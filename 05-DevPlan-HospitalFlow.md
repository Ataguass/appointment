# HospitalFlow — Hospital Appointment & OPD Management Platform
## Development Plan & Roadmap

Source of truth: PRD, SRS, System Architecture, and UI/UX Specification (previously defined).

---

## Priorities

1. Reliability 2. Appointment correctness 3. Security 4. Performance 5. Simplicity 6. Maintainability 7. User experience

---

## PHASE 0 — Product and Technical Foundation
**Objective:** Establish a working, deployable skeleton before any feature work.
**Tasks:** Repo setup (monorepo: backend + patient app + staff app), TypeScript/lint/format standards, NestJS module skeleton per Architecture §3, Postgres + Redis provisioning, environment config (dev/staging/prod), CI pipeline (lint/type-check/test/build), error tracking and structured logging wired in.
**Dependencies:** None.
**Priority:** MVP — blocking.
**Expected output:** Deployable "hello world" backend + two empty frontend shells, passing CI.
**Testing:** CI pipeline green on a trivial change.
**Acceptance criteria:** A developer can clone, run locally, and deploy to staging in under 30 minutes.
**Definition of Done:** All environments provisioned; CI/CD deploys to staging automatically on merge to main.

## PHASE 1 — Authentication and Users
**Objective:** Secure login for all roles.
**Tasks:** Patient auth (email/phone+password), staff auth, JWT access/refresh scheme, RBAC permission tables (RBAC-001–007), password reset, account lockout (AUTH-005), profile CRUD.
**Dependencies:** Phase 0.
**Priority:** MVP.
**Expected output:** All five roles can log in and see a role-appropriate empty shell.
**Testing:** Unit tests on auth/permission logic; integration tests per role login.
**Acceptance criteria:** Unauthorized access to any role-restricted endpoint is rejected server-side (RBAC-007).
**DoD:** Auth flows covered by automated tests; security review of token handling passed.

## PHASE 2 — Hospital Structure
**Objective:** Model the hospital itself.
**Tasks:** Doctor CRUD (FR-060), Department CRUD (FR-070), doctor-department assignment, Staff accounts (§36 UI/UX), Rooms/resources (basic).
**Dependencies:** Phase 1 (admin auth/RBAC).
**Priority:** MVP.
**Expected output:** Admin can fully populate hospital structure via Doctor/Department Management screens.
**Testing:** CRUD integration tests, RBAC tests (admin-only).
**Acceptance criteria:** Deactivating a doctor/department preserves historical data (FR-061).
**DoD:** Admin management screens functional end-to-end against real API.

## PHASE 3 — Scheduling Engine
**Objective:** Build the core availability engine — the highest-risk, highest-value module.
**Tasks:** Working hours (FR-090), breaks (FR-100), leave (FR-110), holidays (FR-120), slot generation algorithm (Architecture §15), incremental regeneration on change (FR-002), timezone handling (TZ-001/002), double-booking prevention at DB level (CONC-001).
**Dependencies:** Phase 2.
**Priority:** MVP — highest technical risk, build and harden early.
**Expected output:** `getAvailability(doctorId, dateRange)` returns correct slots under all configured constraints.
**Testing:** Unit tests for slot generation edge cases; concurrency tests simulating simultaneous booking attempts (CONC-001, EDGE-001); tests for leave/holiday overlap with existing appointments (BR-030/031).
**Acceptance criteria:** Zero double-bookings under concurrent load test; slots regenerate correctly on every schedule/leave/holiday change.
**DoD:** Load-tested; no known race conditions.

## PHASE 4 — Appointment System
**Objective:** Patient- and staff-facing booking.
**Tasks:** Booking (FR-140), cancellation (FR-150), rescheduling as atomic cancel-rebook (FR-160), appointment lifecycle state machine (FR-170), reception booking, walk-ins (FR-180, BR-020), check-in (FR-190), idempotency keys (IDEM-001). Frontend: Slot Selection, Booking Confirmation, Appointment History, Reception Booking Workflow, Walk-in Workflow (UI/UX §15–22).
**Dependencies:** Phase 3 (scheduling engine must be solid first).
**Priority:** MVP.
**Expected output:** A patient can book/reschedule/cancel end-to-end; a receptionist can book/walk-in/check-in.
**Testing:** Integration tests per lifecycle transition; idempotency retry tests; UI flow tests against click/action targets (PRD KPIs).
**Acceptance criteria:** Patient booking completes in under 60 seconds in usability testing (PRD §19).
**DoD:** All appointment lifecycle edge cases (SRS §42) covered by tests.

## PHASE 5 — Queue Management
**Objective:** Real-time queue for staff and patients.
**Tasks:** Token generation (FR-200), queue ordering incl. walk-in insertion (FR-201, BR-021), real-time propagation via WebSocket/Redis pub-sub (FR-202, Architecture §23), doctor running-late status (EDGE-013). Frontend: Queue View, Doctor Dashboard queue panel (UI/UX §24–25).
**Dependencies:** Phase 4.
**Priority:** MVP.
**Expected output:** Queue state updates live across doctor, receptionist, and patient views.
**Testing:** Real-time propagation latency tests (target <2s, FR-003); queue-ordering tests with mixed walk-ins/bookings.
**Acceptance criteria:** Queue reflects check-ins/walk-ins/delays accurately and promptly.
**DoD:** Verified under simulated multi-doctor, multi-patient concurrent load.

## PHASE 6 — Doctor Dashboard
**Objective:** The doctor's daily workspace.
**Tasks:** Today's schedule + queue view (FR-020), consultation workspace (UI/UX §26), notes/prescriptions (FR-023), status updates (FR-021), follow-up creation (FR-024, FR-220).
**Dependencies:** Phase 5.
**Priority:** MVP.
**Expected output:** Doctor can move a patient from queue through consultation to completion, with notes and optional follow-up, in minimal clicks.
**Testing:** Integration tests on consultation state transitions (FR-210–211); access-control tests confirming notes are doctor/admin-only (RBAC-003/005).
**Acceptance criteria:** Doctor opens today's patient and starts consultation with minimal navigation (PRD principle).
**DoD:** Consultation workflow usability-tested with a sample clinician workflow.

## PHASE 7 — Google Calendar
**Objective:** One-way sync, never authoritative.
**Tasks:** OAuth connect/disconnect (CAL-001, Architecture §19), event create/update/cancel on appointment lifecycle events (CAL-002/003), background job-based sync (Architecture §20), webhook handling for reconciliation only (CAL-011, §21), token refresh/expiry handling (EDGE-007), retry with backoff (CAL-010), idempotent webhook processing (IDEM-002).
**Dependencies:** Phase 4 (appointment events must exist to sync).
**Priority:** MVP.
**Expected output:** Confirmed/cancelled/rescheduled appointments correctly reflected on a doctor's connected Google Calendar without blocking booking.
**Testing:** Simulated API failure tests (sync must not affect booking); duplicate webhook tests; token expiry tests.
**Acceptance criteria:** Sync SLA met in staging; booking is fully functional even with Calendar API unavailable.
**DoD:** Verified doctor can disconnect/reconnect without data loss or duplicate events.

## PHASE 8 — Notifications
**Objective:** Reliable lifecycle notifications.
**Tasks:** Confirmation, reminder (24h/2h), cancellation, reschedule, queue-status notifications (NOTIF-001–004) via event bus consumers (Architecture §22); retry/backoff (NOTIF-005); Notification Center UI (§33).
**Dependencies:** Phase 4 (and 5 for queue notifications).
**Priority:** MVP (email); push/SMS post-MVP.
**Expected output:** All defined lifecycle events trigger a notification.
**Testing:** Delivery success-rate tests; failure/retry tests; notification failure must not roll back the underlying action (ERR-002).
**Acceptance criteria:** ≥95% notification delivery success rate (PRD KPI).
**DoD:** Notification failures visible in monitoring, not silent.

## PHASE 9 — Billing
**Objective:** Basic payment record-keeping.
**Tasks:** Payment status field (BILL-001), mark-as-paid flow (BILL-002), basic receipt generation (BILL-003), Billing screens (UI/UX §34).
**Dependencies:** Phase 4.
**Priority:** MVP (basic record-keeping only — no live gateway, per PRD MVP scope).
**Expected output:** Billing staff can view and update payment status per appointment.
**Testing:** RBAC tests (billing role scope, RBAC-006); integration tests on payment status transitions.
**Acceptance criteria:** Billing staff can mark paid and generate a receipt without accessing clinical notes.
**DoD:** Billing flow functional; payment gateway explicitly deferred to Post-MVP per PRD §11.

## PHASE 10 — Security and Production Hardening
**Objective:** Harden before real patient data goes live.
**Tasks:** Audit logging across all sensitive actions (SEC-001–002, Architecture §26), rate limiting (SEC-013), full RBAC penetration pass, encryption at rest for OAuth tokens (§28), secrets management setup (§29), backup/recovery drill (BAK-001/002).
**Dependencies:** All prior phases (hardening pass across the whole system).
**Priority:** MVP — blocking for production launch.
**Expected output:** Security review sign-off.
**Testing:** Permission/RBAC test suite across all roles and endpoints; audit log completeness check; backup restore drill.
**Acceptance criteria:** No known critical/high-severity security findings.
**DoD:** Security review document signed off; backup restore tested successfully.

## PHASE 11 — Testing
**Objective:** Comprehensive coverage before launch.
**Tasks:** Unit, integration, API, database, scheduling/concurrency (CONC-001), calendar integration, E2E (patient booking, reception, doctor consultation flows), accessibility (WCAG 2.1 AA, §49), performance (PERF-001–003), security, and failure/recovery testing.
**Dependencies:** All feature phases complete.
**Priority:** MVP.
**Expected output:** Full automated test suite green; manual accessibility and performance audits complete.
**Testing:** (this phase is testing).
**Acceptance criteria:** All SRS acceptance criteria (§51) met and verified.
**DoD:** No known critical bugs; test suite runs in CI on every merge.

## PHASE 12 — Deployment
**Objective:** Go live.
**Tasks:** Production infrastructure provisioning (Architecture §36), database migration execution, environment config finalization, monitoring/alerting live (§32), backup schedule active, rollback plan documented and tested, production smoke tests.
**Dependencies:** Phase 10 and 11 complete.
**Priority:** MVP.
**Expected output:** Live production system serving real hospital traffic.
**Testing:** Production smoke test suite; monitoring dashboards verified populated.
**Acceptance criteria:** System live with monitoring, backups, and rollback plan confirmed operational.
**DoD:** Post-launch checklist complete; on-call/monitoring active.

---

## Recommended Development Sequence

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → (7 and 8 in parallel, both depend on 4) → 9 (parallel with 7/8, depends on 4) → 10 → 11 → 12.

**Hard blocking dependencies:**
- Phase 3 (Scheduling Engine) must be solid — including concurrency testing — before Phase 4 begins, since all booking logic depends on correct, race-safe availability.
- Phase 4 (Appointments) must exist before Phases 5, 6, 7, 8, or 9 can begin, since each depends on appointment lifecycle events.
- Phase 5 (Queue) should precede Phase 6 (Doctor Dashboard), since the dashboard's queue panel depends on it.
- Phase 10 (Hardening) and Phase 11 (Testing) run across the full system and should not be treated as a single end-of-project sprint — security and test coverage should be built incrementally per phase, with Phase 10/11 as a final consolidated pass.

## MVP / Post-MVP / Future Division

**MVP (Phases 0–12 as scoped above):** Patient booking, doctor schedules, receptionist booking, appointment management, check-in/queue, doctor dashboard, Google Calendar sync, notifications (email), basic billing record-keeping.

**Post-MVP:** Payment gateway integration, advanced billing (invoices/refunds/insurance), SMS notifications, analytics/reporting dashboards, doctor performance analytics.

**Future/Advanced:** Multi-branch/multi-hospital support, additional calendar providers, patient medical history module, telemedicine.

---

## Final MVP Definition of Done

- **Functional correctness:** All FR/BR requirements in the SRS implemented and passing acceptance criteria (SRS §51).
- **Security:** RBAC enforced server-side for all roles; audit logging complete; no critical/high findings from security review (Phase 10).
- **Performance:** PERF-001–003 targets met under load testing.
- **UX:** Patient booking completable in under 60 seconds; receptionist/doctor click targets met per UI/UX spec.
- **Accessibility:** WCAG 2.1 AA verified across patient and staff apps.
- **Testing:** Full automated suite (unit/integration/E2E/concurrency/accessibility/performance/security) green in CI.
- **Monitoring:** Error tracking, structured logging, and alerting live in production.
- **Deployment:** CI/CD pipeline deploying to production with tested rollback; backups active and drilled.
- **Documentation:** PRD, SRS, Architecture, and UI/UX docs kept in sync with what was actually built.
