# HospitalFlow — Hospital Appointment & OPD Management Platform
## Product Requirements Document (PRD)

---

## 1. Problem Statement

Private hospitals typically manage OPD (Outpatient Department) appointments through a mix of phone calls, physical registers, and disconnected software, leading to:
- Long patient wait times and unpredictable queues
- Double-booked or conflicting appointment slots
- Receptionists unable to see real-time doctor availability
- Doctors with no unified view of their daily schedule and patient queue
- No reliable notification system for confirmations, reminders, or changes
- Manual, error-prone coordination between online bookings and walk-ins
- No single source of truth for hospital-wide OPD activity

There is a need for a fast, reliable, secure system that unifies patient booking, doctor scheduling, reception workflows, and queue management into one authoritative platform.

## 2. Product Vision

HospitalFlow is the operational backbone of a private hospital's outpatient department — a single source of truth for doctor availability, appointments, and queues. It gives patients a fast, low-friction way to find and book care, gives staff simple tools to manage the day-to-day, and gives administrators visibility into hospital operations — all while remaining fast, secure, and simple to operate.

## 3. Target Users

- Patients seeking to book, manage, or track OPD appointments
- Doctors managing their schedule and consultations
- Receptionists handling bookings, walk-ins, and check-ins
- Hospital administrators overseeing doctors, departments, and operations
- Billing staff handling consultation fees and payments

## 4. User Personas

**Patient — Priya (32, working professional)**
Books appointments from her phone between tasks. Wants to find the right doctor quickly, see real availability, and avoid hospital queues.

**Doctor — Dr. Rahman (45, senior physician)**
Sees 30–40 patients a day. Needs a clear, distraction-free view of today's queue and past patient context, on a tablet or desktop.

**Receptionist — Anita (26, front desk)**
Handles a constant stream of phone calls and walk-ins. Needs to book, reschedule, and check in patients in as few clicks as possible.

**Hospital Administrator — Mr. Verma (50, operations head)**
Needs to manage doctor schedules, departments, and staff, and understand daily OPD load at a glance.

**Billing Staff — Kavita (29, accounts)**
Tracks consultation fees, payment status, and invoices tied to appointments.

## 5. User Goals and Pain Points

| User | Goals | Pain Points |
|---|---|---|
| Patient | Book fast, know wait time, get reminders | Slow booking, no visibility into slots, missed appointments |
| Doctor | See today's queue clearly, minimal admin overhead | Scattered patient info, no real-time queue |
| Receptionist | Book/reschedule quickly, manage walk-ins | Manual conflict checking, double bookings |
| Admin | Oversee OPD operations | No dashboard, schedule changes are error-prone |
| Billing | Track payments per appointment | Disconnected from appointment records |

## 6. Product Goals

1. Enable patients to book an appointment in under a minute
2. Guarantee zero double-bookings
3. Give doctors a single, fast daily workspace
4. Give receptionists a low-click booking and check-in flow
5. Provide real-time queue visibility to patients and staff
6. Keep the hospital database as the single source of truth, with Google Calendar as a synced view
7. Deliver reliable notifications for booking, reminders, cancellations, and reschedules

## 7. Non-Goals (MVP)

- AI-based triage, diagnosis, or chat assistants
- Pharmacy management
- Laboratory/diagnostics management
- Full electronic health records (EHR)
- Insurance claims processing
- Multi-hospital / multi-branch support (single hospital only)
- Telemedicine/video consultations

## 8. Core User Journeys

1. **Patient books online** → browses department/doctor → selects slot → confirms → receives notification
2. **Patient reschedules/cancels** → views upcoming appointment → changes or cancels → receives updated notification
3. **Receptionist books for a patient** → searches/registers patient → selects doctor/slot → confirms
4. **Walk-in patient arrives** → receptionist creates walk-in appointment → patient joins queue
5. **Patient checks in** → arrives at hospital → receptionist marks check-in → patient enters queue
6. **Doctor runs consultation** → views queue → opens patient → completes consultation → adds notes/prescription → marks done, optionally schedules follow-up
7. **Admin manages schedule** → sets working hours/leave for a doctor → system regenerates available slots
8. **Doctor connects Google Calendar** → OAuth → appointments sync as calendar events (one-way from HospitalFlow)

## 9. Core Features

- Department & doctor discovery
- Real-time slot availability
- Online booking, rescheduling, cancellation
- Reception booking & walk-in management
- Patient check-in
- Queue/token management with real-time updates
- Doctor daily dashboard & consultation workflow
- Notes, prescriptions, follow-ups
- Notifications (email/push): confirmation, reminder, cancellation, reschedule, queue updates
- Google Calendar sync (one-way, HospitalFlow authoritative)
- Admin dashboard: doctors, departments, schedules, leave, rooms
- Billing: consultation fee, payment status, invoice (basic)
- Audit logging for sensitive actions
- Role-based access control (RBAC)

## 10. MVP Scope

Patient booking + Doctor schedules + Receptionist booking + Appointment management + Check-in/queue + Doctor dashboard + Google Calendar + Notifications.

Basic billing (fee capture, payment status) is included at MVP level only as a record-keeping feature, not a full payment gateway.

## 11. Post-MVP Features

- Payment gateway integration (online prepayment)
- Advanced billing (invoices, refunds, insurance)
- Multi-branch/multi-hospital support
- SMS notifications
- Analytics/reporting dashboards
- Patient medical history module
- Doctor performance analytics
- Additional calendar providers (Outlook, etc.)

## 12. User Stories

**Patient**
- As a patient, I want to search doctors by department so I can find the right specialist.
- As a patient, I want to see real-time available slots so I don't book an unavailable time.
- As a patient, I want to reschedule my appointment without calling the hospital.
- As a patient, I want a notification when my appointment is confirmed, changed, or cancelled.

**Doctor**
- As a doctor, I want to see today's patient queue in order so I know who's next.
- As a doctor, I want to mark myself as running late so patients are informed.
- As a doctor, I want to add consultation notes tied to the appointment record.
- As a doctor, I want my confirmed appointments to appear on my Google Calendar.

**Receptionist**
- As a receptionist, I want to search for an existing patient by phone number before creating a new record.
- As a receptionist, I want to book a walk-in patient into a doctor's queue without a pre-existing slot.
- As a receptionist, I want to check in a patient and have them appear in the doctor's queue instantly.

**Hospital Administrator**
- As an administrator, I want to set a doctor's working hours and have slots regenerate automatically.
- As an administrator, I want to mark a doctor on leave and have future appointments flagged for rescheduling.
- As an administrator, I want a daily dashboard of OPD activity across departments.

**Billing Staff**
- As billing staff, I want to see the payment status of each appointment.
- As billing staff, I want to mark a consultation as paid and generate a basic receipt.

## 13. Functional Requirements (Product Level)

- The system must prevent two bookings for the same doctor/slot.
- The system must regenerate available slots when a doctor's schedule, leave, or holiday changes.
- The system must reflect check-in and queue status in real time to relevant staff and patients.
- The system must sync confirmed appointments to a doctor's Google Calendar without treating it as authoritative.
- The system must send notifications for booking, cancellation, rescheduling, and reminders.
- The system must restrict access to patient data based on role and doctor-patient relationship.

## 14. Success Metrics and KPIs

- Median patient booking time < 60 seconds
- Zero double-booking incidents
- >95% notification delivery success rate
- Average patient wait time reduction vs. baseline (measured post-launch)
- <1% appointment sync failure rate with Google Calendar
- Receptionist average booking time < 30 seconds for existing patients

## 15. Assumptions

- Single hospital, single location for MVP
- Doctors are hospital employees/contracted, not independent multi-clinic practitioners within the system
- Patients have basic smartphone/internet access for booking
- Hospital has reliable internet connectivity for real-time features

## 16. Dependencies

- Google Calendar API (OAuth, events, webhooks)
- Email/push notification provider
- Hospital's existing patient identification process (for reception registration)

## 17. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Double bookings under concurrent load | Database-level locking/constraints on slot booking |
| Google Calendar API failure | Queue-and-retry sync; HospitalFlow DB remains authoritative regardless |
| Staff resistance to new workflow | Minimal-click UX, training, phased rollout |
| Notification delivery failure | Retry logic, in-app notification fallback |
| Data privacy breach | RBAC, encryption, audit logging |

## 18. Out-of-Scope Features

AI/ML features, pharmacy, lab management, EHR, insurance claims, multi-branch support, telemedicine — all excluded from MVP and near-term roadmap unless explicitly re-scoped.

## 19. MVP Acceptance Criteria

- Patient can complete a booking end-to-end in under 60 seconds in usability testing
- No double-booking occurs under simulated concurrent booking load
- Doctor dashboard shows accurate, real-time queue state
- Receptionist can book, reschedule, cancel, and check in a patient
- Confirmed appointments appear correctly on connected Google Calendars
- Notifications are sent for all defined appointment lifecycle events

## 20. Definition of Done

- All MVP features implemented and functionally tested
- No known critical or high-severity bugs
- Security review completed (auth, RBAC, data access)
- Performance targets met under expected load
- Notifications and calendar sync verified in staging
- Documentation (SRS, architecture, UI/UX) aligned with implementation
- Deployed to production with monitoring and backups active
