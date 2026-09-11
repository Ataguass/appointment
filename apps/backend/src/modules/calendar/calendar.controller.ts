import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/v1/calendar/appointment/:id/ics
   * Download RFC 5545 iCalendar (.ics) file for Apple / Outlook / Google Calendar.
   */
  @Get('appointment/:id/ics')
  async downloadIcs(@Param('id') id: string, @Res() res: Response) {
    const { filename, content } = await this.calendarService.generateIcsFile(id);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
  }

  /**
   * GET /api/v1/calendar/appointment/:id/google-url
   * Get direct Google Calendar 1-click add link.
   */
  @Get('appointment/:id/google-url')
  async getGoogleCalendarUrl(@Param('id') id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { name: true, specialization: true } },
        patient: { select: { name: true } },
      },
    });

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const url = this.calendarService.generateGoogleCalendarUrl(appointment);
    return { success: true, data: { url } };
  }

  /**
   * GET /api/v1/calendar/doctor/:doctorId/status
   * Get doctor's calendar sync status.
   */
  @Get('doctor/:doctorId/status')
  async getDoctorStatus(@Param('doctorId') doctorId: string) {
    const status = await this.calendarService.getDoctorCalendarStatus(doctorId);
    return { success: true, data: status };
  }
}
