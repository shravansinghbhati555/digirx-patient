# DigiRx Patient Portal

Patient-facing portal for DigiRx clinics: book visits, manage appointments, see one timeline of records across every DigiRx clinic, share access with family, and pay bills.

It is phone-first, with tablet and desktop layouts. The UI is built from the **DigiRx Patient Portal** design canvas, all 45 artboards.

It talks to the **existing DigiRx NestJS backend** (`../backend`), the same API and database the clinic app uses, through its `/portal/*` routes. With no API configured it runs on mock data, which is handy for UI work.

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # type-check + production build
```

Sign in with any 10-digit mobile number. Any 6-digit OTP works except `000000`, which shows the error state.

The demo clock is fixed at **Tue 13 Oct 2026, 2 PM**, so "Tomorrow", "in 21 hours" and today's past slots match the designs. Change `TODAY` in `client/src/data/mock.ts`.

State (bookings, cancellations, grants, payments) persists in `localStorage` under `digirx.patient.v1`. Log out from Profile to reset it.

## Stack

React 19 · Vite 8 · TypeScript (strict) · Tailwind 3 · React Router 7. This is the same stack as `/frontend`, so the two apps can share know-how.

## Layout by screen size

| Width | Navigation | Notes |
| --- | --- | --- |
| < 768 px (phone) | Bottom nav (5 tabs) | 20 px gutter, sticky bottom action bars, bottom sheets |
| 768–1279 px (tablet) | 96 px icon rail | 2-column grids; sheets become centred dialogs |
| ≥ 1280 px (desktop) | 240 px sidebar + top search bar | Max content 1240 px; 3-pane records; 3-column booking |

Breakpoints are the `tablet:` and `desktop:` Tailwind screens. Tokens (colours, gradients, radii, shadows) live in `client/tailwind.config.js` and mirror the design system artboard.

## Code map

```
client/src/
  types.ts               domain model (clinic, doctor, appointment, record, invoice, family grants…)
  data/mock.ts           fixtures from the designs + TODAY
  services/api.ts        API boundary: real /portal/* calls, or the mock when no API is set
  services/http.ts       token + refresh-cookie handling for the portal API
  state/portal.tsx       context + reducer: session, data, booking draft, all mutations
  lib/                   dates/currency, availability (slot stand-in), selectors, .ics, share
  components/ui/         design system: Icon, Art (flowers/faces), Button, Bits, Overlay, Layout, States
  components/domain.tsx  mood picker, appointment/doctor/clinic cards, day & slot pickers, timeline item
  layouts/AppShell.tsx   auth gate + responsive nav (bottom nav / rail / sidebar)
  screens/               onboarding · home · booking · appointments · records · family · account · system
```

## Screen → route

| Design | Route |
| --- | --- |
| 01 Welcome · 02 Login/OTP · 03 Profile | `/welcome` `/login` `/otp` `/setup` |
| 04 Dashboard · 23 Notifications | `/` `/notifications` |
| 05 Discover · 06 Search + Filters sheet | `/discover` `/search` |
| 07 Clinic · 08 Doctor | `/clinics/:id` `/doctors/:id` |
| 09 Date & time · 09b Review · 10 Confirmed | `/book` `/book/review` `/book/confirmed/:id` |
| 11–12 Appointments (upcoming/past/cancelled) | `/appointments?tab=` |
| 13 Details + Cancel sheet · 13c Reschedule | `/appointments/:id` `/appointments/:id/reschedule` |
| 14 History · 15 Visit | `/records` `/records/visits/:id` |
| 16 Reports + preview | `/reports` `/reports/:id` |
| 17 Prescriptions | `/prescriptions` `/prescriptions/:id` |
| 18 Billing · Invoice (+ pay sheet) | `/billing` `/billing/:id` |
| 19–22 Family, add, link, access | `/family` `/family/add` `/family/link` `/family/:id` |
| 24–26 Profile, privacy, help | `/profile` `/privacy` `/help` |
| 27 Loading / empty / error / success / confirm | shell skeleton, `EmptyState`, `ErrorState` + offline banner, `/done`, `ConfirmDialog` |

## Connecting to the DigiRx backend

The portal uses the backend's patient-portal API (`backend/src/modules/patient-portal`). It's off by default, so turn it on in both places:

1. **Backend `.env`**: `PATIENT_PORTAL_ENABLED=true`, a `JWT_PORTAL_SECRET` (32+ characters, different from the staff secrets), and the portal origin in `CORS_ORIGINS` (dev: `http://localhost:5174`; prod: `https://patient.digirx.com`). Set `NOTIFICATION_PROVIDER=twilio` for real OTP SMS. With the default console provider, the code is printed in the backend log.
2. **Each clinic opts in** through its settings: `PATCH /clinics/:id/settings` with `{ "portal": { "enabled": true, "bookingEnabled": true } }`. Optional fields: `bookableDoctorIds`, `maxAdvanceDays`, `cancellationLeadTimeHours`, `maxActiveFutureAppointments`.
3. **Client**: copy `client/.env.example` to `client/.env` and set `VITE_API_BASE_URL`.

How records reach a patient: after OTP login the patient enters a name and date of birth. Clinic records with the **same mobile number AND date of birth** are linked automatically. Records are never merged, and an ambiguous match is left unlinked. A child is added under Family with their own date of birth.

Access model:
- Clinics see only their own records. A clinic sees records from other clinics only after the patient turns on sharing for it (Privacy, or "share past records" when booking). Staff read those through `GET /patients/:id/shared-records`.
- Adult family members see nothing by default. Each grant (`book`, `rx`, `reports`, `bills`) goes one way and can be revoked at any time. Visit history is never shared with adults.
- Medical data isn't stored in the browser. Only the signed-in flag is kept; records are fetched fresh on each load.

Online payment uses Razorpay Checkout when the backend has `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` set. Otherwise patients are told to pay at the clinic.
