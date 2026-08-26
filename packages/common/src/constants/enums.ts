/**
 * User roles in the HospitalFlow system.
 * Maps directly to RBAC-001 in the SRS.
 */
export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  ADMIN = 'ADMIN',
  BILLING = 'BILLING',
}

/**
 * Appointment status lifecycle.
 * Matches FR-170 in the SRS:
 * Booked → Confirmed → CheckedIn → InQueue → InConsultation → Completed
 * with Cancelled and NoShow as terminal states.
 */
export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_QUEUE = 'IN_QUEUE',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Payment status for appointments.
 * Matches BILL-001 in the SRS.
 */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

/**
 * Payment method used when marking as paid.
 * Matches BILL-002 in the SRS.
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  OTHER = 'OTHER',
}

/**
 * Days of the week for schedule templates.
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}
