import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  RecordPaymentDto,
  WaivePaymentDto,
  GetPaymentsFilterDto,
} from './dto/billing.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a payment collection for an appointment.
   */
  async recordPayment(dto: RecordPaymentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const txnId = dto.transactionId || `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId: dto.appointmentId },
      update: {
        amount: dto.amount,
        status: PaymentStatus.PAID,
        method: dto.method,
        transactionId: txnId,
        paidAt: new Date(),
      },
      create: {
        appointmentId: dto.appointmentId,
        amount: dto.amount,
        status: PaymentStatus.PAID,
        method: dto.method,
        transactionId: txnId,
        paidAt: new Date(),
      },
      include: {
        appointment: {
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
            patient: { select: { id: true, name: true } },
          },
        },
      },
    });

    this.logger.log(
      `Payment collected: ₹${dto.amount} (${dto.method}) for appointment ${dto.appointmentId}. Txn: ${txnId}`,
    );
    return payment;
  }

  /**
   * Waive a consultation fee.
   */
  async waivePayment(dto: WaivePaymentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId: dto.appointmentId },
      update: {
        status: PaymentStatus.WAIVED,
        paidAt: new Date(),
      },
      create: {
        appointmentId: dto.appointmentId,
        amount: 0,
        status: PaymentStatus.WAIVED,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Payment waived for appointment ${dto.appointmentId}. Reason: ${dto.reason}`);
    return payment;
  }

  /**
   * Generate official receipt data for an appointment.
   */
  async getReceipt(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        patient: { select: { id: true, name: true, user: { select: { phone: true, email: true } } } },
        payment: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const payment = appointment.payment;
    const paidDate = payment?.paidAt || appointment.createdAt;
    const datePrefix = new Date(paidDate).toISOString().split('T')[0].replace(/-/g, '');
    const receiptNumber = `REC-${datePrefix}-${appointment.id.slice(-6).toUpperCase()}`;

    return {
      receiptNumber,
      appointmentId: appointment.id,
      date: paidDate,
      doctor: appointment.doctor,
      patient: appointment.patient,
      amount: payment ? Number(payment.amount) : Number(appointment.doctor),
      status: payment?.status || PaymentStatus.UNPAID,
      method: payment?.method || null,
      transactionId: payment?.transactionId || null,
      hospitalDetails: {
        name: 'HospitalFlow OPD Clinic',
        taxId: 'GSTIN27AAAAA0000A1Z5',
        address: 'Healthcare Boulevard, Medical District',
      },
    };
  }

  /**
   * Get payments list and summary metrics.
   */
  async getPaymentsList(filters: GetPaymentsFilterDto) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.doctorId) {
      where.appointment = { doctorId: filters.doctorId };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(`${filters.startDate}T00:00:00.000Z`);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(`${filters.endDate}T23:59:59.999Z`);
      }
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
            patient: { select: { id: true, name: true, user: { select: { phone: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Summary calculations
    let totalCollected = 0;
    let totalPending = 0;
    let totalWaived = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      if (p.status === PaymentStatus.PAID) totalCollected += amt;
      else if (p.status === PaymentStatus.UNPAID) totalPending += amt;
      else if (p.status === PaymentStatus.WAIVED) totalWaived += amt;
    }

    return {
      summary: {
        totalCollected,
        totalPending,
        totalWaived,
        totalTransactions: payments.length,
      },
      payments: payments.map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: Number(p.amount),
        status: p.status,
        method: p.method,
        transactionId: p.transactionId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        patientName: p.appointment.patient.name,
        patientPhone: p.appointment.patient.user.phone,
        doctorName: p.appointment.doctor.name,
        specialization: p.appointment.doctor.specialization,
      })),
    };
  }

  /**
   * Get revenue and billing reports.
   */
  async getRevenueReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(`${endDate}T23:59:59Z`) : new Date();

    const paidPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: start, lte: end },
      },
      include: {
        appointment: {
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
          },
        },
      },
    });

    // Breakdown by payment method
    const methodBreakdown: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      OTHER: 0,
    };

    // Breakdown by doctor
    const doctorBreakdown: Record<string, { doctorName: string; specialization: string; total: number; count: number }> = {};

    let totalRevenue = 0;

    for (const p of paidPayments) {
      const amt = Number(p.amount);
      totalRevenue += amt;

      const m = p.method || 'OTHER';
      methodBreakdown[m] = (methodBreakdown[m] || 0) + amt;

      const docId = p.appointment.doctor.id;
      if (!doctorBreakdown[docId]) {
        doctorBreakdown[docId] = {
          doctorName: p.appointment.doctor.name,
          specialization: p.appointment.doctor.specialization,
          total: 0,
          count: 0,
        };
      }
      doctorBreakdown[docId].total += amt;
      doctorBreakdown[docId].count += 1;
    }

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      totalRevenue,
      totalPaidConsultations: paidPayments.length,
      methodBreakdown,
      doctorEarnings: Object.values(doctorBreakdown),
    };
  }
}
