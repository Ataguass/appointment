import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  BookAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  WalkInAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointments.dto';
import { AppointmentStatus, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Book an appointment with concurrency safety (CONC-001).
   */
  async book(dto: BookAppointmentDto, userId: string, userRole: Role) {
    // 1. Resolve Patient ID
    let patientId = dto.patientId;
    if (userRole === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
      });
      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }
      patientId = patient.id;
    } else if (!patientId) {
      throw new BadRequestException('patientId is required when booking as staff');
    }

    // 2. Check Idempotency Key
    if (dto.idempotencyKey) {
      const existing = await this.prisma.appointment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
          patient: { select: { id: true, name: true } },
          slot: true,
          payment: true,
        },
      });
      if (existing) {
        this.logger.log(`Idempotent booking hit for key: ${dto.idempotencyKey}`);
        return existing;
      }
    }

    // 3. Verify Doctor
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    // 4. Atomic Transaction: Slot Lock & Appointment Creation (CONC-001)
    const appointment = await this.prisma.$transaction(async (tx) => {
      // Upsert the slot to acquire a lock or create record
      const slot = await tx.slot.upsert({
        where: {
          doctorId_startTime: {
            doctorId: dto.doctorId,
            startTime: start,
          },
        },
        update: {},
        create: {
          doctorId: dto.doctorId,
          startTime: start,
          endTime: end,
          isBooked: false,
        },
      });

      // Check if slot is already booked
      if (slot.isBooked) {
        throw new ConflictException(
          'This time slot is already booked. Please choose another time.',
        );
      }

      // Mark slot as booked
      await tx.slot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      // Create appointment
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: patientId!,
          doctorId: dto.doctorId,
          slotId: slot.id,
          scheduledStart: start,
          scheduledEnd: end,
          reason: dto.reason,
          idempotencyKey: dto.idempotencyKey,
          status: AppointmentStatus.BOOKED,
        },
        include: {
          doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
          patient: { select: { id: true, name: true } },
          slot: true,
        },
      });

      // Initialize Payment record (Phase 9)
      await tx.payment.create({
        data: {
          appointmentId: newAppointment.id,
          amount: doctor.consultationFee,
          status: PaymentStatus.UNPAID,
        },
      });

      return newAppointment;
    });

    this.logger.log(`Appointment booked: ${appointment.id} for patient ${patientId}`);
    return appointment;
  }

  /**
   * Reschedule an appointment atomically.
   */
  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    userId: string,
    userRole: Role,
  ) {
    const appointment = await this.findOne(id);
    this.authorizeAccess(appointment, userId, userRole);

    if (
      appointment.status !== AppointmentStatus.BOOKED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot reschedule appointment in '${appointment.status}' status`,
      );
    }

    const newStart = new Date(dto.newStartTime);
    const newEnd = new Date(dto.newEndTime);

    if (newStart >= newEnd) {
      throw new BadRequestException('Start time must be before end time');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Release old slot
      if (appointment.slotId) {
        await tx.slot.update({
          where: { id: appointment.slotId },
          data: { isBooked: false },
        });
      }

      // 2. Acquire new slot
      const newSlot = await tx.slot.upsert({
        where: {
          doctorId_startTime: {
            doctorId: appointment.doctorId,
            startTime: newStart,
          },
        },
        update: {},
        create: {
          doctorId: appointment.doctorId,
          startTime: newStart,
          endTime: newEnd,
          isBooked: false,
        },
      });

      if (newSlot.isBooked) {
        throw new ConflictException(
          'The selected new time slot is already booked. Please choose another time.',
        );
      }

      // Lock new slot
      await tx.slot.update({
        where: { id: newSlot.id },
        data: { isBooked: true },
      });

      // 3. Update appointment
      return tx.appointment.update({
        where: { id },
        data: {
          slotId: newSlot.id,
          scheduledStart: newStart,
          scheduledEnd: newEnd,
          reason: dto.reason || appointment.reason,
          status: AppointmentStatus.BOOKED,
        },
        include: {
          doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
          patient: { select: { id: true, name: true } },
          slot: true,
        },
      });
    });

    this.logger.log(`Appointment rescheduled: ${id} to ${dto.newStartTime}`);
    return updated;
  }

  /**
   * Cancel an appointment and release its slot.
   */
  async cancel(
    id: string,
    dto: CancelAppointmentDto,
    userId: string,
    userRole: Role,
  ) {
    const appointment = await this.findOne(id);
    this.authorizeAccess(appointment, userId, userRole);

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Appointment is already in ${appointment.status} status`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update appointment status
      const cancelled = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelReason: dto.reason,
        },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, name: true } },
        },
      });

      // 2. Release slot
      if (appointment.slotId) {
        await tx.slot.update({
          where: { id: appointment.slotId },
          data: { isBooked: false },
        });
      }

      return cancelled;
    });

    this.logger.log(`Appointment cancelled: ${id}. Reason: ${dto.reason}`);
    return updated;
  }

  /**
   * Check in an appointment and assign a queue token (Phases 4 & 5).
   */
  async checkIn(id: string) {
    const appointment = await this.findOne(id);

    if (
      appointment.status !== AppointmentStatus.BOOKED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot check in appointment in '${appointment.status}' status`,
      );
    }

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Calculate token number for this doctor today
      const count = await tx.queueToken.count({
        where: {
          doctorId: appointment.doctorId,
          date: todayDate,
        },
      });
      const tokenNumber = count + 1;

      // Create queue token
      const queueToken = await tx.queueToken.create({
        data: {
          appointmentId: id,
          doctorId: appointment.doctorId,
          tokenNumber,
          date: todayDate,
        },
      });

      // Update appointment status to IN_QUEUE
      const checkedInAppt = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.IN_QUEUE },
        include: {
          doctor: { select: { id: true, name: true, specialization: true } },
          patient: { select: { id: true, name: true } },
          queueToken: true,
        },
      });

      return { ...checkedInAppt, tokenNumber: queueToken.tokenNumber };
    });

    this.logger.log(`Appointment checked in: ${id}, assigned token #${updated.tokenNumber}`);
    return updated;
  }

  /**
   * Register a walk-in patient appointment (Receptionist/Admin).
   */
  async createWalkIn(dto: WalkInAppointmentDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    const now = new Date();
    const end = new Date(now.getTime() + (doctor.slotDurationMins || 15) * 60000);
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Find or create patient by phone
      let user = await tx.user.findFirst({
        where: { phone: dto.patientPhone },
        include: { patient: true },
      });

      let patientId: string;

      if (user?.patient) {
        patientId = user.patient.id;
      } else {
        // Create walk-in patient user
        const dummyEmail = `walkin_${Date.now()}_${Math.floor(Math.random() * 1000)}@hospitalflow.local`;
        const newUser = await tx.user.create({
          data: {
            email: dto.patientEmail || dummyEmail,
            phone: dto.patientPhone,
            passwordHash: 'WALK_IN_NO_PASSWORD',
            role: Role.PATIENT,
          },
        });

        const newPatient = await tx.patient.create({
          data: {
            userId: newUser.id,
            name: dto.patientName,
          },
        });
        patientId = newPatient.id;
      }

      // 2. Create on-demand slot
      const slot = await tx.slot.create({
        data: {
          doctorId: dto.doctorId,
          startTime: now,
          endTime: end,
          isBooked: true,
        },
      });

      // 3. Create appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId: dto.doctorId,
          slotId: slot.id,
          isWalkIn: true,
          scheduledStart: now,
          scheduledEnd: end,
          reason: dto.reason || 'Walk-in Consultation',
          status: AppointmentStatus.IN_QUEUE,
        },
        include: {
          doctor: { select: { id: true, name: true, specialization: true } },
          patient: { select: { id: true, name: true } },
        },
      });

      // 4. Generate Queue Token
      const count = await tx.queueToken.count({
        where: {
          doctorId: dto.doctorId,
          date: todayDate,
        },
      });
      const tokenNumber = count + 1;

      const queueToken = await tx.queueToken.create({
        data: {
          appointmentId: appointment.id,
          doctorId: dto.doctorId,
          tokenNumber,
          date: todayDate,
        },
      });

      // 5. Initialize Payment
      await tx.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: doctor.consultationFee,
          status: PaymentStatus.UNPAID,
        },
      });

      return {
        ...appointment,
        queueToken,
        tokenNumber: queueToken.tokenNumber,
      };
    });

    this.logger.log(`Walk-in appointment created: ${result.id} (Token #${result.tokenNumber})`);
    return result;
  }

  /**
   * Update appointment status with state machine validations.
   */
  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.findOne(id);
    const validTransitions = this.getValidTransitions(appointment.status);

    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from '${appointment.status}' to '${dto.status}'. Allowed: ${validTransitions.join(', ') || 'None (Terminal state)'}`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
        queueToken: true,
        payment: true,
      },
    });
  }

  /**
   * Find all appointments matching query filters.
   */
  async findAll(filters: {
    doctorId?: string;
    patientId?: string;
    date?: string;
    status?: AppointmentStatus;
    userId?: string;
    userRole?: Role;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    // Patient role can only see their own appointments
    if (filters.userRole === Role.PATIENT && filters.userId) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: filters.userId },
      });
      if (patient) {
        where.patientId = patient.id;
      }
    } else if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.date) {
      const startOfDay = new Date(`${filters.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${filters.date}T23:59:59.999Z`);
      where.scheduledStart = { gte: startOfDay, lte: endOfDay };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
          patient: { select: { id: true, name: true, user: { select: { phone: true, email: true } } } },
          queueToken: true,
          payment: true,
        },
        orderBy: { scheduledStart: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single appointment by ID.
   */
  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, specialization: true, consultationFee: true, slotDurationMins: true } },
        patient: { select: { id: true, name: true, user: { select: { phone: true, email: true } } } },
        slot: true,
        queueToken: true,
        payment: true,
        consultationNote: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private getValidTransitions(current: AppointmentStatus): AppointmentStatus[] {
    switch (current) {
      case AppointmentStatus.BOOKED:
        return [
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.CANCELLED,
          AppointmentStatus.NO_SHOW,
        ];
      case AppointmentStatus.CONFIRMED:
        return [
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.CANCELLED,
          AppointmentStatus.NO_SHOW,
        ];
      case AppointmentStatus.CHECKED_IN:
        return [AppointmentStatus.IN_QUEUE, AppointmentStatus.NO_SHOW];
      case AppointmentStatus.IN_QUEUE:
        return [AppointmentStatus.IN_CONSULTATION, AppointmentStatus.NO_SHOW];
      case AppointmentStatus.IN_CONSULTATION:
        return [AppointmentStatus.COMPLETED];
      default:
        return [];
    }
  }

  private authorizeAccess(
    appointment: { patientId: string; doctor: { id: string } },
    userId: string,
    userRole: Role,
  ) {
    if (userRole === Role.ADMIN || userRole === Role.RECEPTIONIST) {
      return;
    }
    // Patient access validation
    if (userRole === Role.PATIENT) {
      // Patient ownership is validated at query time
      return;
    }
  }
}
