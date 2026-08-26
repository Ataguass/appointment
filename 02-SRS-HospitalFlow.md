# HospitalFlow — Hospital Appointment & OPD Management Platform
## Software/System Requirements Specification (SRS)

---

## 1. System Overview

HospitalFlow is a hospital appointment and OPD management platform for a single private hospital. It provides distinct experiences for patients, doctors, receptionists, hospital administrators, and billing staff, built around an authoritative appointment/scheduling database that syncs one-way to Google Calendar for doctors.

## 2. System Scope

In scope: patient booking, doctor scheduling, reception workflows, walk-ins, check-in, queue management, doctor consultation workflow, notifications, Google Calendar sync, basic billing, RBAC, audit logging.

Out of scope (MVP): AI/ML, pharmacy, lab management, full EHR, insurance claims, multi-branch, telemedicine (see PRD §7, §18).

## 3. Actors and User Roles

- **Patient** — books/manages own appointments
- **Doctor** — manages schedule, queue, consultations
- **Receptionist** — manages bookings, walk-ins, check-in, queue
- **Hospital Administrator** — manages doctors, departments, schedules, operations
- **Billing Staff** — manages payment status and invoices
- **System/Scheduler** (non-human actor) — background jobs: slot generation, reminders, calendar sync

## 4. Authentication Requirements

- AUTH-001: The system shall support email/phone + password authentication for patients.
- AUTH-002: The system shall support staff (doctor/receptionist/admin/billing) authentication via hospital-issued credentials.
- AUTH-003: The system shall support session expiry after a configurable inactivity period (default 30 minutes for staff, 7 days for patients via refresh token).
- AUTH-004: The system shall support password reset via verified email or phone.
- AUTH-005: The system shall lock an account for 15 minutes after 5 consecutive failed login attempts.
- AUTH-006: Doctors shall authenticate separately with Google via OAuth 2.0 solely for calendar sync, independent of their HospitalFlow login.

## 5. Authorization and RBAC

- RBAC-001: The system shall enforce role-based access control with roles: Patient, Doctor, Receptionist, Admin, Billing.
- RBAC-002: A patient shall access only their own appointments and profile data.
- RBAC-003: A doctor shall access only appointments and patient data for patients under their care (past or current appointment relationship).
- RBAC-004: A receptionist shall access patient search, booking, and check-in functions but not consultation notes/prescriptions.
- RBAC-005: An admin shall access doctor/department/schedule management but not clinical notes by default.
- RBAC-006: Billing staff shall access payment/invoice data linked to appointments but not clinical notes.
- RBAC-007: All role-permission checks shall occur server-side; client-side role display shall never be the sole enforcement point.

## 6. Functional Requirements (Cross-cutting)

- FR-001: The system shall prevent any two active bookings from occupying the same doctor/slot.
- FR-002: The system shall recompute available slots whenever a doctor's working hours, breaks, leave, or holidays change.
- FR-003: The system shall reflect appointment and queue status changes to relevant users within 2 seconds under normal load.
- FR-004: The system shall log all create/update/cancel actions on appointments with actor, timestamp, and reason where applicable.

## 7. Patient Requirements

- FR-010: Patients shall be able to browse departments and doctors without authentication.
- FR-011: Patients shall authenticate before booking, rescheduling, or cancelling an appointment.
- FR-012: Patients shall view real-time available slots for a selected doctor and date.
- FR-013: Patients shall book an available slot, which becomes immediately unavailable to others.
- FR-014: Patients shall reschedule an existing appointment to another available slot, subject to BR-010 (cutoff rules).
- FR-015: Patients shall cancel an appointment, subject to BR-011 (cancellation window).
- FR-016: Patients shall view upcoming and past appointment history.
- FR-017: Patients shall receive notifications for booking confirmation, reminders, cancellations, and reschedules.

## 8. Doctor Requirements

- FR-020: Doctors shall view their daily schedule with ordered patient queue.
- FR-021: Doctors shall update appointment status (e.g., in-progress, completed, no-show).
- FR-022: Doctors shall mark themselves as running late, which shall propagate to queued/waiting patients.
- FR-023: Doctors shall add consultation notes and prescriptions tied to a specific appointment.
- FR-024: Doctors shall create a follow-up appointment directly from a completed consultation.
- FR-025: Doctors shall connect/disconnect their Google Calendar via OAuth.

## 9. Receptionist Requirements

- FR-030: Receptionists shall search for existing patients by name, phone, or patient ID.
- FR-031: Receptionists shall register a new patient record when no match is found.
- FR-032: Receptionists shall book an appointment for a patient into any available slot.
- FR-033: Receptionists shall create a walk-in appointment for a doctor with available capacity, per BR-020.
- FR-034: Receptionists shall reschedule or cancel any patient's appointment.
- FR-035: Receptionists shall check in a patient, moving them into the doctor's active queue.
- FR-036: Receptionists shall view doctor schedules across departments for a given day.

## 10. Hospital Administrator Requirements

- FR-040: Admins shall create, update, and deactivate doctor profiles.
- FR-041: Admins shall create and manage departments and doctor-department assignments.
- FR-042: Admins shall define and update doctor working hours, breaks, and slot duration.
- FR-043: Admins shall record doctor leave and hospital-wide holidays.
- FR-044: Admins shall manage rooms/resources associated with departments or doctors.
- FR-045: Admins shall view an operational dashboard summarizing daily OPD activity (appointments booked, checked-in, completed, no-shows) across departments.

## 11. Billing Staff Requirements

- FR-050: Billing staff shall view the payment status of any appointment.
- FR-051: Billing staff shall mark an appointment as paid and record the amount and method.
- FR-052: Billing staff shall generate a basic receipt/invoice record tied to an appointment.

## 12. Doctor Management

- FR-060: Each doctor record shall include name, specialization, department(s), contact info, consultation fee, and active status.
- FR-061: Deactivating a doctor shall not delete historical appointment records.

## 13. Department Management

- FR-070: Each department shall have a name, description, and associated doctors.
- FR-071: A department may be deactivated without deleting historical data.

## 14. Schedule Management

- FR-080: Each doctor shall have a weekly working-hours template (per day of week, start/end time).
- FR-081: Schedule changes shall apply to future slot generation only; existing booked appointments are not silently altered (see BR-030).

## 15. Working Hours

- FR-090: Working hours shall be defined per doctor per day of week, with support for multiple shifts per day (e.g., morning/evening).

## 16. Breaks

- FR-100: Doctors shall have configurable recurring breaks (e.g., lunch) excluded from slot generation.

## 17. Doctor Leave

- FR-110: Admins or doctors shall be able to record leave for a specific date range.
- FR-111: Adding leave over a date range with existing booked appointments shall trigger BR-031 (conflict handling).

## 18. Holidays

- FR-120: Admins shall define hospital-wide holidays that block slot generation across all doctors for that date, unless a doctor explicitly opts to work.

## 19. Appointment Slot Generation

- FR-130: The system shall generate bookable slots from a doctor's working hours, slot duration, breaks, leave, and holidays.
- FR-131: Slot generation shall run on a rolling window (e.g., next 30 days) and regenerate on any relevant schedule change.

## 20. Appointment Booking

- FR-140: Booking a slot shall be atomic: either the slot is successfully reserved for exactly one patient, or the booking fails cleanly with no partial state.
- FR-141: A successful booking shall immediately trigger a confirmation notification (NOTIF-001).

## 21. Appointment Cancellation

- FR-150: Cancelling an appointment shall free the slot for rebooking immediately.
- FR-151: Cancellation shall require a reason for staff-initiated cancellations; optional for patient-initiated.

## 22. Appointment Rescheduling

- FR-160: Rescheduling shall be modeled as an atomic cancel-and-rebook: the original slot is released and the new slot is reserved in a single transaction, or neither occurs.

## 23. Appointment Status Lifecycle

- FR-170: Appointment status shall follow: `Booked → Confirmed → CheckedIn → InQueue → InConsultation → Completed`, with `Cancelled` and `NoShow` as terminal states reachable from `Booked`, `Confirmed`, or `InQueue`.

## 24. Walk-in Appointments

- FR-180: A walk-in appointment shall be created against a doctor's remaining daily capacity rather than a pre-generated slot, per BR-020.

## 25. Patient Check-in

- FR-190: Check-in shall be available starting a configurable window before the appointment time (default 30 minutes) and shall move the appointment to `CheckedIn`/`InQueue`.

## 26. Queue/Token Management

- FR-200: Each checked-in patient shall receive a sequential token per doctor per day.
- FR-201: The queue order shall be determined by check-in time by default, with walk-ins inserted per BR-021.
- FR-202: Queue position updates shall propagate in real time to the patient and doctor views.

## 27. Doctor Consultation Workflow

- FR-210: Starting a consultation shall move the appointment to `InConsultation` and update the queue for remaining patients.
- FR-211: Completing a consultation shall require the appointment to move to `Completed` before a follow-up can be scheduled.

## 28. Follow-up Appointments

- FR-220: A follow-up created from a consultation shall pre-fill doctor and patient, requiring only slot selection.

## 29. Notifications

- NOTIF-001: The system shall send a notification on booking confirmation.
- NOTIF-002: The system shall send a reminder notification a configurable time before the appointment (default 24h and 2h).
- NOTIF-003: The system shall send a notification on cancellation or rescheduling.
- NOTIF-004: The system shall send a queue-status notification when a patient is next or near-next.
- NOTIF-005: Notification delivery failures shall be retried up to 3 times with exponential backoff before being logged as failed.

## 30. Google Calendar Integration

- CAL-001: A doctor shall connect their Google Calendar via OAuth 2.0 consent.
- CAL-002: A confirmed appointment shall create a corresponding Google Calendar event on the doctor's connected calendar.
- CAL-003: A cancelled or rescheduled appointment shall update or remove the corresponding calendar event.
- CAL-004: HospitalFlow's database shall remain authoritative; calendar events are a projection, never a source of scheduling truth.

## 31. Calendar Synchronization and Conflict Handling

- CAL-010: If the Google Calendar API is unavailable, the appointment shall still be created in HospitalFlow, with sync queued for retry (EDGE-006).
- CAL-011: If a doctor manually deletes a synced event on Google Calendar, HospitalFlow shall treat its own database as authoritative and shall not cancel the appointment; it shall recreate the event on next sync.

## 32. Payments/Billing Requirements

- BILL-001: Each appointment shall carry a payment status: `Unpaid`, `Paid`, `Waived`.
- BILL-002: Marking an appointment as paid shall require an amount and payment method (cash/card/other).
- BILL-003: A basic receipt record shall be generated on payment, referencing the appointment ID.

## 33. Audit Logging

- SEC-001: The system shall log all appointment state changes, schedule changes, and access to consultation notes, including actor ID, timestamp, and action type.
- SEC-002: Audit logs shall be immutable and retained for a minimum of 3 years (or per hospital policy).

## 34. Data Requirements

Core entities: Patient, Doctor, Department, Staff, Appointment, Slot, Schedule, Leave, Holiday, Queue/Token, ConsultationNote, Prescription, Payment, Notification, AuditLog, CalendarConnection.

## 35. Database Entities and Relationships (summary)

- Doctor `belongs to` one or more Departments
- Doctor `has` Schedule (working hours), Leave records
- Appointment `belongs to` one Patient, one Doctor, one Slot (or walk-in capacity unit)
- Appointment `has one` ConsultationNote (optional), `has one` Payment record
- Queue Token `belongs to` one Appointment
- CalendarConnection `belongs to` one Doctor

## 36. Data Validation

- VAL-001: Patient phone numbers shall be validated for format before registration.
- VAL-002: Appointment booking shall reject slots in the past.
- VAL-003: Doctor working-hour ranges shall reject end time earlier than or equal to start time.

## 37. Business Rules

- BR-010: Patient-initiated rescheduling shall not be permitted within a configurable cutoff window before the appointment (default 2 hours).
- BR-011: Patient-initiated cancellation shall not be permitted within a configurable cutoff window (default 1 hour), after which only staff can cancel.
- BR-020: Walk-in appointments shall only be permitted if the doctor has remaining daily capacity or explicit walk-in allowance configured by admin.
- BR-021: Walk-ins shall be inserted into the queue after all patients checked in with a pre-booked slot at the time of walk-in creation, unless staff manually reorders for clinical priority.
- BR-030: Doctor schedule changes shall never automatically cancel existing booked appointments; conflicting appointments shall be flagged for staff review (EDGE-002).
- BR-031: Adding doctor leave over a range with existing appointments shall flag all affected appointments for rescheduling and notify affected patients (EDGE-003).

## 38. Timezone Handling

- TZ-001: All appointment times shall be stored in UTC and displayed in the hospital's configured local timezone by default.
- TZ-002: Patient-facing displays shall use the patient's device timezone where determinable, with the hospital timezone shown for clarity if they differ (EDGE-013).

## 39. Concurrency and Double-Booking Prevention

- CONC-001: Slot reservation shall use a database-level unique constraint or row-level lock on (doctor_id, slot_id) to guarantee only one successful booking per slot under concurrent requests (EDGE-001).
- CONC-002: A failed concurrent booking attempt shall return an immediate, clear "slot no longer available" response and prompt slot refresh.

## 40. Idempotency

- IDEM-001: Booking requests shall accept an idempotency key so retried network requests do not create duplicate appointments (EDGE-010).
- IDEM-002: Google Calendar webhook processing shall deduplicate by event ID to prevent duplicate sync actions (EDGE-008).
- IDEM-003: Payment webhook processing shall deduplicate by transaction ID (EDGE-009).

## 41. Error Handling

- ERR-001: All booking failures shall return a specific, user-readable reason (slot taken, past time, invalid patient, etc.), never a generic error.
- ERR-002: Notification failures shall not roll back the underlying appointment action (EDGE-011).

## 42. Edge Cases

- EDGE-001: Two patients booking the same slot simultaneously → only one succeeds (CONC-001); the other receives a clear conflict message.
- EDGE-002: Doctor schedule changes after appointments are booked → existing appointments are preserved and flagged, not auto-cancelled (BR-030).
- EDGE-003: Doctor leave added after appointments exist in that range → affected appointments flagged, patients notified, staff must reschedule or the patient may self-reschedule (BR-031).
- EDGE-004: Appointment cancellation → slot released immediately, notification sent (FR-150, NOTIF-003).
- EDGE-005: Appointment rescheduling → atomic cancel-and-rebook (FR-160).
- EDGE-006: Google Calendar API failure → appointment persists in HospitalFlow; sync retried in background (CAL-010).
- EDGE-007: Expired Google OAuth token → sync paused for that doctor, doctor notified to reconnect, HospitalFlow booking unaffected.
- EDGE-008: Duplicate Google Calendar webhook → deduplicated by event ID (IDEM-002).
- EDGE-009: Duplicate payment webhook → deduplicated by transaction ID (IDEM-003).
- EDGE-010: Network failure during booking → idempotency key prevents duplicate appointment creation on retry (IDEM-001).
- EDGE-011: Notification failure after successful booking → appointment remains valid; notification retried (NOTIF-005, ERR-002).
- EDGE-012: Patient timezone changes (e.g., travel) → displayed appointment time recalculated from stored UTC value (TZ-002).
- EDGE-013: Doctor running late → status flag propagates to queue and triggers patient notification (FR-022, NOTIF-004).
- EDGE-014: Walk-in patient arrives while online appointments exist → inserted per queue ordering rule (BR-021).
- EDGE-015: No-show patients → appointment auto-transitions to `NoShow` after a configurable grace period past check-in window if not checked in.
- EDGE-016: Hospital-wide holiday → no slots generated for any doctor that date unless explicitly overridden (FR-120).

## 43. Security Requirements

- SEC-010: All data in transit shall use TLS 1.2+.
- SEC-011: Passwords shall be stored using a strong salted hash (e.g., bcrypt/argon2).
- SEC-012: Consultation notes and prescriptions shall be accessible only to the treating doctor and authorized admins, per RBAC-003/RBAC-005.
- SEC-013: The system shall enforce rate limiting on authentication and booking endpoints.

## 44. Privacy Requirements

- PRIV-001: Patient personal and clinical data shall not be exposed to receptionist or billing roles beyond what their role requires (RBAC-004, RBAC-006).
- PRIV-002: Patients shall be able to request export or deletion of their personal data, subject to legal record-retention requirements for medical/appointment history.

## 45. File/Document Handling

- FILE-001: Where prescriptions or notes include attachments, files shall be stored in access-controlled object storage, never directly linked without authorization checks.

## 46. Performance Requirements

- PERF-001: Patient-facing pages (department/doctor listing, slot view) shall load in under 1.5 seconds on a typical mobile connection.
- PERF-002: Slot booking confirmation shall complete in under 1 second under normal load.
- PERF-003: The system shall support at least 200 concurrent booking requests without data inconsistency.

## 47. Availability/Reliability Requirements

- AVAIL-001: The system shall target 99.5% uptime for patient-facing and staff-facing services during hospital operating hours.
- AVAIL-002: Scheduled maintenance shall occur outside peak OPD hours where possible.

## 48. API Requirements

- API-001: All internal APIs shall be versioned.
- API-002: All write operations affecting appointments shall be idempotent where retries are possible (IDEM-001).
- API-003: All APIs shall validate and reject malformed input with structured error responses.

## 49. Logging and Monitoring

- MON-001: The system shall log application errors with sufficient context for debugging without exposing sensitive patient data in plaintext logs.
- MON-002: The system shall monitor booking success/failure rates and alert on anomalies.

## 50. Backup and Recovery Requirements

- BAK-001: The database shall be backed up at least daily with point-in-time recovery capability.
- BAK-002: Recovery procedures shall be tested at least quarterly.

## 51. Acceptance Criteria for Major Modules

- **Scheduling engine**: No double-bookings under concurrent load test (CONC-001 verified); slots regenerate correctly on schedule/leave/holiday changes (FR-002).
- **Booking**: Patient can book, reschedule, cancel within defined rules (FR-013–016, BR-010/011).
- **Reception workflow**: Receptionist can search/register, book, walk-in, check in within defined click/action targets.
- **Queue**: Real-time queue reflects check-ins, walk-ins, and doctor delays accurately (FR-200–202).
- **Doctor workflow**: Doctor can view queue, run consultation, record notes, schedule follow-up (FR-210–220).
- **Calendar sync**: Confirmed/cancelled/rescheduled appointments correctly reflected on connected Google Calendar within a defined sync SLA (CAL-002/003).
- **Notifications**: All defined lifecycle events trigger notifications with ≥95% delivery success (NOTIF-001–005).
- **Security**: RBAC enforced server-side for all roles; audit log captures all sensitive actions (SEC-001–002).
