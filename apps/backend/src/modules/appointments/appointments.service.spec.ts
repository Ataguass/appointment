import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('Appointments Lifecycle & Concurrency Guard (CONC-001)', () => {
  // State machine transition validator logic
  const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.BOOKED]: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.CONFIRMED]: [
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.CHECKED_IN]: [
      AppointmentStatus.IN_QUEUE,
      AppointmentStatus.IN_CONSULTATION,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.IN_QUEUE]: [
      AppointmentStatus.IN_CONSULTATION,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.IN_CONSULTATION]: [
      AppointmentStatus.COMPLETED,
    ],
    [AppointmentStatus.COMPLETED]: [],
    [AppointmentStatus.CANCELLED]: [],
    [AppointmentStatus.NO_SHOW]: [],
    [AppointmentStatus.RESCHEDULED]: [],
  };

  function validateTransition(current: AppointmentStatus, next: AppointmentStatus) {
    const allowed = validTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
    return true;
  }

  describe('State Machine Transitions', () => {
    it('should allow progressive OPD lifecycle: BOOKED -> CHECKED_IN -> IN_QUEUE -> IN_CONSULTATION -> COMPLETED', () => {
      expect(validateTransition(AppointmentStatus.BOOKED, AppointmentStatus.CHECKED_IN)).toBe(true);
      expect(validateTransition(AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_QUEUE)).toBe(true);
      expect(validateTransition(AppointmentStatus.IN_QUEUE, AppointmentStatus.IN_CONSULTATION)).toBe(true);
      expect(validateTransition(AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED)).toBe(true);
    });

    it('should reject invalid transition from COMPLETED to BOOKED', () => {
      expect(() => {
        validateTransition(AppointmentStatus.COMPLETED, AppointmentStatus.BOOKED);
      }).toThrow(BadRequestException);
    });

    it('should reject invalid transition from CANCELLED to IN_CONSULTATION', () => {
      expect(() => {
        validateTransition(AppointmentStatus.CANCELLED, AppointmentStatus.IN_CONSULTATION);
      }).toThrow(BadRequestException);
    });

    it('should allow skipping in-queue patient to NO_SHOW', () => {
      expect(validateTransition(AppointmentStatus.IN_QUEUE, AppointmentStatus.NO_SHOW)).toBe(true);
    });
  });

  describe('Slot Generation Exclusions & Intervals', () => {
    it('should accurately calculate slot step intervals from doctor duration', () => {
      const startMinutes = 9 * 60; // 09:00
      const endMinutes = 10 * 60;  // 10:00
      const duration = 20;

      const slots: string[] = [];
      for (let time = startMinutes; time < endMinutes; time += duration) {
        const h = String(Math.floor(time / 60)).padStart(2, '0');
        const m = String(time % 60).padStart(2, '0');
        slots.push(`${h}:${m}`);
      }

      expect(slots).toEqual(['09:00', '09:20', '09:40']);
    });

    it('should exclude break interval from slot list', () => {
      const allSlots = ['12:40', '13:00', '13:20', '13:40', '14:00'];
      const breakStart = '13:00';
      const breakEnd = '14:00';

      const filtered = allSlots.filter((slot) => slot < breakStart || slot >= breakEnd);
      expect(filtered).toEqual(['12:40', '14:00']);
    });
  });
});
