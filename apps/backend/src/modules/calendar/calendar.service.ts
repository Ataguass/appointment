import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate Google Calendar event deep-link.
   */
  generateGoogleCalendarUrl(appointment: {
    id: string;
    doctor: { name: string; specialization: string };
    patient: { name: string };
    scheduledStart: Date;
    scheduledEnd: Date;
    reason?: string | null;
  }): string {
    const title = encodeURIComponent(`OPD Appointment: Dr. ${appointment.doctor.name} (${appointment.doctor.specialization})`);
    const details = encodeURIComponent(
      `Patient: ${appointment.patient.name}\nReason: ${appointment.reason || 'General Consultation'}\nAppointment ID: ${appointment.id}\nHospital: HospitalFlow Clinic`,
    );
    const location = encodeURIComponent('HospitalFlow OPD Clinic, Healthcare Blvd');

    const formatGCalTime = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '');

    const dates = `${formatGCalTime(new Date(appointment.scheduledStart))}/${formatGCalTime(new Date(appointment.scheduledEnd))}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }

  /**
   * Generate standard RFC 5545 iCalendar (.ics) content for Apple Calendar, Outlook, and Google Calendar import.
   */
  async generateIcsFile(appointmentId: string): Promise<{ filename: string; content: string }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { name: true, specialization: true } },
        patient: { select: { name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const formatIcsTime = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '');

    const now = formatIcsTime(new Date());
    const start = formatIcsTime(new Date(appointment.scheduledStart));
    const end = formatIcsTime(new Date(appointment.scheduledEnd));

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HospitalFlow//OPD Calendar Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:appt-${appointment.id}@hospitalflow.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Dr. ${appointment.doctor.name} - OPD Consultation`,
      `DESCRIPTION:Patient: ${appointment.patient.name}\\nDoctor: Dr. ${appointment.doctor.name} (${appointment.doctor.specialization})\\nReason: ${appointment.reason || 'OPD Visit'}\\nHospital: HospitalFlow Clinic`,
      'LOCATION:HospitalFlow OPD Clinic\\, Healthcare Blvd',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Upcoming doctor appointment in 30 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return {
      filename: `appointment-${appointment.id}.ics`,
      content: icsContent,
    };
  }

  /**
   * Get calendar integration status for a doctor.
   */
  async getDoctorCalendarStatus(doctorId: string) {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { doctorId },
    });

    return {
      connected: !!conn && conn.isActive,
      lastSyncAt: conn?.lastSyncAt || null,
    };
  }
}
