# HospitalFlow — Hospital Appointment & OPD Management Platform
## UI/UX Specification

---

## 1. UX Principles

1. **Speed over polish** — every interaction should feel instant; skeletons over spinners, optimistic UI where safe.
2. **Minimum clicks** — the shortest correct path is the default path.
3. **Clarity over density** — one primary action per screen; secondary actions visually subordinate.
4. **Calm, clinical trust** — restrained color, no decorative animation, generous whitespace.
5. **Role-appropriate density** — patient screens are spacious and mobile-first; staff screens are denser and optimized for repetition and keyboard use.
6. **Fail safely** — destructive actions (cancel, delete) always confirm; errors always explain what to do next.

## 2. Information Architecture

- **Patient app:** Home → Departments → Doctors → Doctor Profile → Booking → Confirmation → My Appointments → Profile
- **Staff app:** Login → Role-based Dashboard → {Doctors | Departments | Schedules | Appointments | Queue | Patients | Billing | Settings}, with a persistent global search and navigation rail.

## 3. Navigation Structure

- Patient: bottom tab bar (mobile) — Home, Search, Appointments, Profile.
- Staff: left navigation rail (desktop/tablet) with role-filtered items; top bar holds global search, notifications, and current queue status.

## 4. Patient Journey

Browse → filter by department/symptom → select doctor → view availability → pick slot → confirm → receive notification → manage via "My Appointments."

## 5. Doctor Journey

Login → Today dashboard (queue + schedule) → open patient → consult → add notes/prescription → complete → optionally schedule follow-up → next patient.

## 6. Receptionist Journey

Login → search/register patient → book or check in → queue view for confirmation.

## 7. Administrator Journey

Login → Command Center (daily OPD summary) → drill into doctors/departments/schedules as needed.

## 8. Billing Journey

Login → Appointments list filtered by payment status → mark paid → generate receipt.

## 9. Complete Screen Inventory

Patient: Home, Department List, Doctor List, Doctor Profile, Slot Selection, Booking Confirmation, Appointment Detail, Appointment History, Profile/Settings.

Staff (shared shell): Login, Dashboard (role-specific), Doctor Management, Department Management, Schedule Management, Leave Management, Patient Search, Reception Booking, Walk-in Booking, Check-in, Queue View, Doctor Daily Schedule, Consultation Workspace, Billing List, Notification Center, Settings.

## 10. Dashboard Layouts

Role-specific landing dashboards using a consistent grid: key metrics/status at top, primary action list/table below, secondary panels (notifications, alerts) in a side rail on desktop, stacked on tablet.

## 11. Doctor Listing (Patient-facing)

**Purpose:** let a patient find and compare doctors. **Layout:** search bar + department filter at top, scrollable card list below (photo, name, specialization, next available slot, "Book" button). **Primary action:** Book. **Empty state:** "No doctors match your filters — try a different department." **Loading:** skeleton cards. **Responsive:** single column on mobile, grid on tablet/desktop.

## 12. Department Listing

Grid of department cards (icon, name, doctor count). Tapping filters the doctor listing. Same skeleton/empty/error pattern as §11.

## 13. Doctor Profile

Photo, name, specialization, department, short bio, consultation fee, next 3 available slots inline, "View all availability" → Slot Selection. Primary action: Book. Secondary: view full schedule.

## 14. Schedule/Calendar (Staff)

Week view by default, day view on mobile/tablet. Color-coded by appointment status. Click/tap a slot to view appointment detail; drag is intentionally *not* supported to avoid accidental rescheduling — reschedule requires the explicit reschedule flow.

## 15. Slot-Selection UI

Date picker (next 30 days, days with availability highlighted) + time-slot grid grouped by morning/afternoon/evening. Selecting a slot advances directly to confirmation — no intermediate step. Unavailable slots are visibly greyed, not hidden, so patients understand doctor load.

## 16. Appointment Booking Flow

Doctor Profile → Slot Selection → Review (doctor, date, time, fee) → Confirm → Confirmation screen. Target: 3 taps from doctor profile to confirmed booking.

## 17. Appointment Confirmation

Large success state, appointment summary card, "Add to calendar" action, "View appointment" and "Book another" secondary actions.

## 18. Appointment History

Two tabs: Upcoming, Past. Upcoming appointments show reschedule/cancel actions (disabled with explanation inside the cutoff window, per BR-010/011). Past appointments are read-only with a "Book follow-up" shortcut if applicable.

## 19. Patient Profile

Name, contact info, edit action, linked appointment history shortcut, notification preferences.

## 20. Receptionist Patient Search

Single search field (name/phone/ID) with live results below. "No match" state surfaces a prominent "Register new patient" action inline — never a dead end.

## 21. Reception Booking Workflow

Patient (searched or newly registered) → Doctor/department select → Slot Selection (same component as patient app) → Confirm. Target: ≤4 actions for an existing patient.

## 22. Walk-in Workflow

Patient search/register → Doctor select (only doctors with remaining capacity shown) → Confirm walk-in → patient added directly to queue with a token, bypassing slot selection.

## 23. Check-in Workflow

From Queue View or Appointment search: one-tap "Check in" action on a matched upcoming appointment. Confirmation toast shows assigned token number.

## 24. Queue Management

Live list per doctor: token number, patient name, status (waiting/in consultation/done), wait time estimate. Doctor "running late" toggle is visible and prominent here, propagating a banner to patient-facing queue status.

## 25. Doctor Dashboard

Today's queue front and center (current patient highlighted), schedule strip for the day, quick stats (seen/remaining). One click opens the current/next patient into the Consultation Workspace.

## 26. Consultation Workspace

Split layout: patient context (past visits, notes) on one side, active note/prescription editor on the other. Primary action: "Complete Consultation." Secondary: "Schedule Follow-up" (enabled only after completion, per FR-211).

## 27. Hospital Command Center (Admin)

Single dashboard: today's OPD volume by department, no-show rate, doctors currently active/on leave, alerts (e.g., leave conflicts flagged per BR-031). Drill-down links to relevant management screens.

## 28. Doctor Management

Table of doctors (searchable/filterable) with add/edit/deactivate actions. Edit form: profile fields, department assignment, fee, active status.

## 29. Department Management

Table of departments with add/edit/deactivate and assigned-doctor count.

## 30. Schedule Management

Per-doctor weekly template editor: day-of-week rows with shift start/end times, slot duration setting. Changes show a confirmation summarizing downstream slot regeneration impact.

## 31. Leave Management

Calendar-range picker to add leave for a doctor. If the range overlaps existing appointments, the system surfaces an inline warning listing affected appointments before confirming (BR-031, EDGE-003).

## 32. Calendar Integration UI

Doctor Settings → "Connect Google Calendar" button → OAuth redirect → connected state shows last sync time and a "Disconnect" option. Sync failures surface a small persistent banner with a reconnect prompt (EDGE-007).

## 33. Notification Center

Bell icon with unread count; dropdown/panel listing recent notifications (booking, reminders, cancellations, queue updates), each linking to the relevant appointment.

## 34. Billing/Payment Screens

List of appointments filtered by payment status, with inline "Mark as paid" action (amount + method modal) and a "Generate receipt" action producing a simple printable record.

## 35. Settings

Account info, password change, notification preferences (patient); staff additionally see role display (read-only) and, for admins, hospital-wide configuration (default slot duration, cutoff windows).

## 36. User/Profile Management

Admin-only screen to create/deactivate staff accounts and assign roles (RBAC-001).

## 37. Loading States

Skeleton screens matching the eventual layout (never blank white or generic spinners) for all list/detail views; inline spinners only for button-level actions (e.g., "Booking...").

## 38. Skeleton States

Card/table skeletons sized to match real content to avoid layout shift on load.

## 39. Empty States

Every list screen defines a specific empty state with a clear next action (e.g., "No appointments yet — Book one").

## 40. Error States

Every data-fetching screen defines a retry-capable error state with a plain-language message (no raw error codes shown to end users).

## 41. Offline/Network States

Patient app detects lost connectivity and shows a non-blocking banner; in-flight booking attempts show "Reconnecting..." rather than failing silently, relying on idempotency keys (IDEM-001) to avoid duplicate bookings on retry.

## 42. Confirmation Dialogs

Required for: cancel appointment, delete/deactivate doctor or department, disconnect calendar. Each states the consequence in plain language and requires an explicit confirm action (no default-confirm on Enter for destructive actions).

## 43. Success States

Brief, non-intrusive toasts for routine successes (saved, checked in); full-screen confirmation only for booking (§17), which is the highest-stakes patient action.

## 44. Validation Messages

Inline, field-level, shown on blur and on submit attempt; never only a top-of-form summary.

## 45. Responsive Behavior

Patient app: mobile-first, single column, scales up to tablet/desktop with wider cards, not more density. Staff app: tablet as the practical minimum for consultation/queue screens; full density on desktop.

## 46. Mobile Design

Primary target for the patient app: large touch targets (min 44px), bottom-anchored primary actions within thumb reach, minimal text entry (pickers over free text wherever possible).

## 47. Tablet Design

Primary target for doctor consultation workspace and reception desk screens: two-pane layouts, larger touch targets than desktop but denser than mobile.

## 48. Desktop Design

Primary target for admin command center and detailed management tables: full data density, keyboard shortcuts enabled (§50).

## 49. Accessibility

WCAG 2.1 AA target: color contrast minimums, all interactive elements reachable and operable via keyboard, all form fields labeled, all status changes (queue, booking) announced to screen readers via ARIA live regions.

## 50. Keyboard Navigation

Staff app supports keyboard shortcuts for high-frequency actions: `/` to focus global search, `N` for new booking, `Esc` to close modals. Documented in a discoverable shortcuts panel (`?`).

## 51. Typography

A single humanist sans-serif family across both apps for legibility and a calm, clinical tone. Clear type scale: distinct sizes for page title, section header, body, and caption — no more than 4 sizes in active use per screen.

## 52. Color System

Neutral base (whites/greys) with a single primary accent color for actions/links, and a small, fixed semantic palette: success (green), warning (amber, e.g., "running late"), danger (red, cancellations), info (blue). No decorative gradients.

## 53. Spacing System

8px base spacing unit across both apps for consistent rhythm and easier responsive scaling.

## 54. Buttons and Form Components

One primary button style per screen (filled), secondary actions as outline/text buttons. Form inputs use consistent height, label position (above field), and inline validation styling across both apps.

## 55. Tables

Staff tables: sticky header, sortable key columns, row-level actions in a trailing menu, pagination or virtualized scroll for large lists (doctor/patient/appointment tables).

## 56. Cards

Used for patient-facing browsing (doctor/department cards) and dashboard summaries; consistent padding, single clear primary action per card.

## 57. Modals

Used sparingly — for confirmations (§42) and short focused forms (mark as paid, add leave). Never used for primary multi-step flows like booking, which get full screens instead.

## 58. Toasts

Bottom-anchored (mobile) / top-right (desktop), auto-dismiss after 4 seconds for non-critical confirmations, manually dismissible, never used for errors requiring action (those get inline or banner treatment).

## 59. Status Indicators

Consistent color+label pairing for appointment/queue status across all screens (e.g., amber dot + "Running late", green dot + "Completed") so status is recognizable at a glance regardless of screen.

## 60. Calendar Components

Shared date-range picker and week/day schedule grid components reused across Slot Selection (patient), Schedule Management, and Leave Management to keep interaction patterns consistent.

## 61. Queue/Token Components

A shared "queue row" component (token number, patient name, status, wait estimate) reused identically in Doctor Dashboard, Queue Management, and any patient-facing "your position" view, so the same visual language represents queue state everywhere.

---

## Interaction Behavior — Key Actions

- **Booking a slot:** tap slot → review screen (no separate "are you sure") → single "Confirm Booking" tap → success screen. Total: 3 taps from slot list.
- **Cancelling (patient):** Appointment Detail → "Cancel" → confirmation dialog stating cutoff policy if inside window (disabled state with explanation instead) → confirm → toast + updated list.
- **Check-in (staff):** search/scan → matched appointment card → single "Check In" tap → toast with token number, queue auto-updates.
- **Running late (doctor):** toggle in Doctor Dashboard header → confirmation of estimated delay → banner propagates to Queue View and patient notification within the FR-003 2-second target.
- **Global search (staff):** `/` focuses search → results grouped by type (patient/doctor/appointment) → arrow keys + Enter to select, no mouse required.
- **Preventing accidental cancellation:** destructive actions never share a button style with primary actions, always require explicit confirm dialog (§42), and cannot be triggered by a single accidental tap on a list row.

---

## Visual Language Summary

Professional, calm, trustworthy, modern — restrained color, generous whitespace, no decorative animation or unnecessary cards, single clear primary action per screen, and consistent shared components (queue row, calendar grid, status indicators) so staff never have to relearn a pattern between screens.
