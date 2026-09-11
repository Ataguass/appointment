import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  SetScheduleDto,
  SetBreaksDto,
  CreateLeaveDto,
  CreateHolidayDto,
  GenerateSlotsDto,
} from './dto/scheduling.dto';
import { DayOfWeek } from '@prisma/client';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Doctor Schedules ──────────────────────────────────────────────

  /**
   * Get weekly schedule for a doctor.
   */
  async getDoctorSchedule(doctorId: string) {
    await this.ensureDoctorExists(doctorId);

    return this.prisma.schedule.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /**
   * Set/replace weekly schedule for a doctor.
   */
  async setDoctorSchedule(doctorId: string, dto: SetScheduleDto) {
    await this.ensureDoctorExists(doctorId);

    // Validate times (startTime < endTime for each active day)
    for (const s of dto.schedules) {
      if (s.startTime >= s.endTime) {
        throw new BadRequestException(
          `Start time (${s.startTime}) must be earlier than end time (${s.endTime}) on ${s.dayOfWeek}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Clear existing schedule
      await tx.schedule.deleteMany({ where: { doctorId } });

      // Create new schedules
      if (dto.schedules.length > 0) {
        await tx.schedule.createMany({
          data: dto.schedules.map((s) => ({
            doctorId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive,
          })),
        });
      }

      return tx.schedule.findMany({
        where: { doctorId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  // ─── Doctor Breaks ─────────────────────────────────────────────────

  /**
   * Get breaks for a doctor.
   */
  async getDoctorBreaks(doctorId: string) {
    await this.ensureDoctorExists(doctorId);

    return this.prisma.break.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Set/replace breaks for a doctor.
   */
  async setDoctorBreaks(doctorId: string, dto: SetBreaksDto) {
    await this.ensureDoctorExists(doctorId);

    for (const b of dto.breaks) {
      if (b.startTime >= b.endTime) {
        throw new BadRequestException(
          `Break start time (${b.startTime}) must be earlier than end time (${b.endTime}) on ${b.dayOfWeek}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.break.deleteMany({ where: { doctorId } });

      if (dto.breaks.length > 0) {
        await tx.break.createMany({
          data: dto.breaks.map((b) => ({
            doctorId,
            dayOfWeek: b.dayOfWeek,
            startTime: b.startTime,
            endTime: b.endTime,
            label: b.label,
          })),
        });
      }

      return tx.break.findMany({
        where: { doctorId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  // ─── Doctor Leaves ─────────────────────────────────────────────────

  /**
   * Get leaves for a doctor.
   */
  async getDoctorLeaves(doctorId: string) {
    await this.ensureDoctorExists(doctorId);

    return this.prisma.leave.findMany({
      where: { doctorId },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Create a leave request for a doctor.
   */
  async createLeave(doctorId: string, dto: CreateLeaveDto) {
    await this.ensureDoctorExists(doctorId);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start > end) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    return this.prisma.leave.create({
      data: {
        doctorId,
        startDate: start,
        endDate: end,
        reason: dto.reason,
      },
    });
  }

  /**
   * Delete a doctor leave.
   */
  async deleteLeave(id: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    return this.prisma.leave.delete({ where: { id } });
  }

  // ─── Hospital Holidays ─────────────────────────────────────────────

  /**
   * Get all hospital holidays.
   */
  async getHolidays() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Create a hospital holiday.
   */
  async createHoliday(dto: CreateHolidayDto) {
    const date = new Date(dto.date);

    const existing = await this.prisma.holiday.findUnique({
      where: { date },
    });

    if (existing) {
      throw new ConflictException(`Holiday already exists on ${dto.date}`);
    }

    return this.prisma.holiday.create({
      data: {
        date,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  /**
   * Delete a holiday.
   */
  async deleteHoliday(id: string) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return this.prisma.holiday.delete({ where: { id } });
  }

  // ─── Slot Generation Engine (Phase 3 Core) ─────────────────────────

  /**
   * Get available and booked slots for a doctor on a specific date (YYYY-MM-DD).
   */
  async getSlotsForDate(doctorId: string, dateStr: string) {
    const doctor = await this.ensureDoctorExists(doctorId);
    const targetDate = new Date(`${dateStr}T00:00:00Z`);

    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }

    // 1. Check Hospital Holiday
    const holiday = await this.prisma.holiday.findFirst({
      where: { date: targetDate },
    });
    if (holiday) {
      return {
        date: dateStr,
        isUnavailable: true,
        reason: `Hospital Holiday: ${holiday.name}`,
        slots: [],
      };
    }

    // 2. Check Doctor Leave
    const leave = await this.prisma.leave.findFirst({
      where: {
        doctorId,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });
    if (leave) {
      return {
        date: dateStr,
        isUnavailable: true,
        reason: `Doctor on Leave${leave.reason ? `: ${leave.reason}` : ''}`,
        slots: [],
      };
    }

    // 3. Get Doctor's DayOfWeek Schedule
    const dayOfWeek = DAY_MAP[targetDate.getUTCDay()];
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return {
        date: dateStr,
        isUnavailable: true,
        reason: `Doctor does not consult on ${dayOfWeek}`,
        slots: [],
      };
    }

    // 4. Get Doctor's Breaks for this Day
    const breaks = await this.prisma.break.findMany({
      where: { doctorId, dayOfWeek },
    });

    // 5. Generate candidate time intervals
    const slotDuration = doctor.slotDurationMins || 15;
    const intervals = this.calculateSlotIntervals(
      dateStr,
      schedule.startTime,
      schedule.endTime,
      slotDuration,
      breaks,
    );

    // 6. Fetch existing slots in database for this doctor on this day
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const existingSlots = await this.prisma.slot.findMany({
      where: {
        doctorId,
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    const slotMap = new Map<string, typeof existingSlots[0]>();
    for (const slot of existingSlots) {
      slotMap.set(slot.startTime.toISOString(), slot);
    }

    // 7. Combine generated intervals with DB state
    const resultSlots = intervals.map((interval) => {
      const existing = slotMap.get(interval.startTime.toISOString());
      return {
        id: existing?.id || null,
        doctorId,
        startTime: interval.startTime.toISOString(),
        endTime: interval.endTime.toISOString(),
        isBooked: existing ? existing.isBooked : false,
      };
    });

    return {
      date: dateStr,
      isUnavailable: false,
      slotDurationMins: slotDuration,
      slots: resultSlots,
    };
  }

  /**
   * Pre-generate and persist slot records in the database for a date range.
   */
  async generateSlots(dto: GenerateSlotsDto) {
    const doctor = await this.ensureDoctorExists(dto.doctorId);
    const start = new Date(`${dto.startDate}T00:00:00Z`);
    const end = new Date(`${dto.endDate}T00:00:00Z`);

    if (start > end) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    let createdCount = 0;
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const slotData = await this.getSlotsForDate(dto.doctorId, dateStr);

      if (!slotData.isUnavailable && slotData.slots.length > 0) {
        for (const s of slotData.slots) {
          if (!s.id) {
            try {
              await this.prisma.slot.upsert({
                where: {
                  doctorId_startTime: {
                    doctorId: dto.doctorId,
                    startTime: new Date(s.startTime),
                  },
                },
                update: {},
                create: {
                  doctorId: dto.doctorId,
                  startTime: new Date(s.startTime),
                  endTime: new Date(s.endTime),
                  isBooked: false,
                },
              });
              createdCount++;
            } catch {
              // Ignore duplicates per CONC-001 unique constraint
            }
          }
        }
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    this.logger.log(
      `Pre-generated slots for doctor ${doctor.name} (${dto.doctorId}): ${createdCount} created between ${dto.startDate} and ${dto.endDate}`,
    );

    return { success: true, createdCount };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  /**
   * Splits a working window into slot intervals and excludes breaks.
   */
  private calculateSlotIntervals(
    dateStr: string,
    startTimeStr: string,
    endTimeStr: string,
    slotDurationMins: number,
    breaks: { startTime: string; endTime: string }[],
  ) {
    const intervals: { startTime: Date; endTime: Date }[] = [];

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDurationMins <= endMinutes) {
      const slotStartMin = currentMinutes;
      const slotEndMin = currentMinutes + slotDurationMins;

      // Check if this slot overlaps with any break
      const overlapsBreak = breaks.some((b) => {
        const [bStartH, bStartM] = b.startTime.split(':').map(Number);
        const [bEndH, bEndM] = b.endTime.split(':').map(Number);
        const bStartMin = bStartH * 60 + bStartM;
        const bEndMin = bEndH * 60 + bEndM;

        // Overlap: max(start1, start2) < min(end1, end2)
        return Math.max(slotStartMin, bStartMin) < Math.min(slotEndMin, bEndMin);
      });

      if (!overlapsBreak) {
        const startIso = this.formatTimeIso(dateStr, slotStartMin);
        const endIso = this.formatTimeIso(dateStr, slotEndMin);
        intervals.push({ startTime: startIso, endTime: endIso });
      }

      currentMinutes += slotDurationMins;
    }

    return intervals;
  }

  private formatTimeIso(dateStr: string, minutes: number): Date {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return new Date(`${dateStr}T${hh}:${mm}:00.000Z`);
  }

  private async ensureDoctorExists(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }
}
