import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { SaveConsultationDto } from './dto/consultations.dto';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueGateway: QueueGateway,
  ) {}

  /**
   * Save or update consultation note and prescriptions.
   */
  async saveNote(userId: string, userRole: Role, dto: SaveConsultationDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        doctor: true,
        patient: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // If caller is DOCTOR, ensure doctor owns the appointment
    if (userRole === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
      });
      if (!doctor || doctor.id !== appointment.doctorId) {
        throw new BadRequestException('You are not authorized to write notes for this appointment');
      }
    }

    const complete = dto.completeAppointment ?? true;

    const note = await this.prisma.$transaction(async (tx) => {
      // Upsert consultation note
      const savedNote = await tx.consultationNote.upsert({
        where: { appointmentId: dto.appointmentId },
        update: {
          diagnosis: dto.diagnosis,
          notes: dto.notes,
          prescription: dto.prescription,
        },
        create: {
          appointmentId: dto.appointmentId,
          doctorId: appointment.doctorId,
          diagnosis: dto.diagnosis,
          notes: dto.notes,
          prescription: dto.prescription,
        },
      });

      // Complete appointment
      if (complete) {
        await tx.appointment.update({
          where: { id: dto.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return savedNote;
    });

    // Broadcast queue update if completed
    if (complete) {
      this.queueGateway.broadcastQueueUpdate(appointment.doctorId, {
        completedAppointmentId: appointment.id,
      });
    }

    this.logger.log(`Consultation note saved for appointment ${dto.appointmentId}`);
    return note;
  }

  /**
   * Get consultation note and prescription for an appointment.
   */
  async getNoteByAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        patient: { select: { id: true, name: true, dateOfBirth: true, gender: true } },
        consultationNote: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return {
      appointmentId: appointment.id,
      scheduledStart: appointment.scheduledStart,
      status: appointment.status,
      doctor: appointment.doctor,
      patient: appointment.patient,
      note: appointment.consultationNote || null,
    };
  }

  /**
   * Get full medical consultation history for a patient.
   */
  async getPatientHistory(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        consultationNote: true,
      },
      orderBy: { scheduledStart: 'desc' },
    });

    return {
      patient,
      history: appointments.map((a) => ({
        appointmentId: a.id,
        date: a.scheduledStart,
        doctor: a.doctor,
        reason: a.reason,
        diagnosis: a.consultationNote?.diagnosis || null,
        prescription: a.consultationNote?.prescription || null,
        notes: a.consultationNote?.notes || null,
      })),
    };
  }
}
