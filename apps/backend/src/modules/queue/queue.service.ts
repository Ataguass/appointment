import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { QueueGateway } from './queue.gateway';
import { AnnounceDelayDto } from './dto/queue.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: QueueGateway,
  ) {}

  /**
   * Get the current queue state for a doctor for today.
   */
  async getDoctorQueue(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, specialization: true, slotDurationMins: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        queueToken: {
          date: todayDate,
        },
      },
      include: {
        patient: { select: { id: true, name: true, user: { select: { phone: true } } } },
        queueToken: true,
      },
      orderBy: {
        queueToken: {
          tokenNumber: 'asc',
        },
      },
    });

    const inConsultation = appointments.find(
      (a) => a.status === AppointmentStatus.IN_CONSULTATION,
    );

    const inQueue = appointments.filter(
      (a) => a.status === AppointmentStatus.IN_QUEUE || a.status === AppointmentStatus.CHECKED_IN,
    );

    const completed = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    );

    const noShow = appointments.filter(
      (a) => a.status === AppointmentStatus.NO_SHOW,
    );

    // Calculate estimated wait time for each waiting patient
    const slotDuration = doctor.slotDurationMins || 15;
    const waitingQueueWithEstimates = inQueue.map((item, index) => {
      const waitMinutes = (index + (inConsultation ? 1 : 0)) * slotDuration;
      return {
        ...item,
        positionInQueue: index + 1,
        estimatedWaitMinutes: waitMinutes,
      };
    });

    return {
      doctor,
      todayDate: todayDate.toISOString().split('T')[0],
      inConsultation: inConsultation || null,
      waitingQueue: waitingQueueWithEstimates,
      completedCount: completed.length,
      noShowCount: noShow.length,
      totalQueueCount: appointments.length,
    };
  }

  /**
   * Get all active doctor queues for the hospital waiting display board.
   */
  async getHospitalDisplayQueues() {
    const doctors = await this.prisma.doctor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, specialization: true },
    });

    const queuePromises = doctors.map(async (doc) => {
      const queue = await this.getDoctorQueue(doc.id);
      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialization: doc.specialization,
        currentToken: queue.inConsultation?.queueToken?.tokenNumber || null,
        currentPatientName: queue.inConsultation?.patient.name || null,
        nextTokens: queue.waitingQueue.slice(0, 4).map((w) => ({
          tokenNumber: w.queueToken?.tokenNumber,
          patientName: w.patient.name,
          estimatedWaitMinutes: w.estimatedWaitMinutes,
        })),
        totalWaiting: queue.waitingQueue.length,
      };
    });

    return Promise.all(queuePromises);
  }

  /**
   * Call next token in queue for a doctor.
   */
  async callNextToken(doctorId: string) {
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Complete current patient in consultation if any
      const currentInConsultation = await tx.appointment.findFirst({
        where: {
          doctorId,
          status: AppointmentStatus.IN_CONSULTATION,
          queueToken: { date: todayDate },
        },
      });

      if (currentInConsultation) {
        await tx.appointment.update({
          where: { id: currentInConsultation.id },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      // 2. Find next patient in queue
      const nextInQueue = await tx.appointment.findFirst({
        where: {
          doctorId,
          status: { in: [AppointmentStatus.IN_QUEUE, AppointmentStatus.CHECKED_IN] },
          queueToken: { date: todayDate },
        },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          queueToken: true,
        },
        orderBy: {
          queueToken: {
            tokenNumber: 'asc',
          },
        },
      });

      if (!nextInQueue) {
        return null;
      }

      // 3. Update next patient to IN_CONSULTATION
      const called = await tx.appointment.update({
        where: { id: nextInQueue.id },
        data: { status: AppointmentStatus.IN_CONSULTATION },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          queueToken: true,
        },
      });

      return called;
    });

    // Broadcast live updates via WebSocket Gateway
    const updatedQueue = await this.getDoctorQueue(doctorId);
    this.gateway.broadcastQueueUpdate(doctorId, updatedQueue);

    if (result) {
      this.gateway.broadcastTokenCalled(doctorId, {
        tokenNumber: result.queueToken?.tokenNumber,
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        specialization: result.doctor.specialization,
      });
      this.logger.log(`Token #${result.queueToken?.tokenNumber} called for Dr. ${result.doctor.name}`);
    }

    return {
      calledPatient: result,
      queue: updatedQueue,
    };
  }

  /**
   * Skip a patient / mark as NO_SHOW.
   */
  async skipToken(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.NO_SHOW },
    });

    const updatedQueue = await this.getDoctorQueue(appointment.doctorId);
    this.gateway.broadcastQueueUpdate(appointment.doctorId, updatedQueue);

    return updated;
  }

  /**
   * Get live queue position and estimated wait time for a specific patient appointment.
   */
  async getPatientLiveQueue(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, name: true, specialization: true, slotDurationMins: true } },
        patient: { select: { id: true, name: true } },
        queueToken: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!appointment.queueToken) {
      return {
        appointmentId,
        hasToken: false,
        status: appointment.status,
        message: 'Patient has not checked in yet. Please check in at the reception desk to receive your queue token.',
      };
    }

    const doctorQueue = await this.getDoctorQueue(appointment.doctorId);
    const myToken = appointment.queueToken.tokenNumber;
    const currentToken = doctorQueue.inConsultation?.queueToken?.tokenNumber || null;

    // Calculate how many waiting tokens are ahead of this patient
    const waitingAhead = doctorQueue.waitingQueue.filter(
      (w) => (w.queueToken?.tokenNumber || 0) < myToken,
    );

    const isCurrentlyServing = currentToken === myToken;
    const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
    const isSkipped = appointment.status === AppointmentStatus.NO_SHOW;

    const estimatedWaitMinutes = isCurrentlyServing || isCompleted || isSkipped
      ? 0
      : (waitingAhead.length + (doctorQueue.inConsultation ? 1 : 0)) * (appointment.doctor.slotDurationMins || 15);

    return {
      appointmentId,
      hasToken: true,
      myToken,
      doctor: appointment.doctor,
      status: appointment.status,
      currentTokenBeingSeen: currentToken,
      tokensAhead: waitingAhead.length,
      estimatedWaitMinutes,
      isCurrentlyServing,
      isCompleted,
      isSkipped,
    };
  }

  /**
   * Announce a doctor delay to the queue room.
   */
  async announceDelay(dto: AnnounceDelayDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      select: { id: true, name: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const payload = {
      doctorId: dto.doctorId,
      doctorName: doctor.name,
      delayMinutes: dto.delayMinutes,
      reason: dto.reason || 'Doctor delayed due to emergency / surgery',
      announcedAt: new Date().toISOString(),
    };

    this.gateway.broadcastDoctorDelay(dto.doctorId, payload);
    return { success: true, ...payload };
  }
}
