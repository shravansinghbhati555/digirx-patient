# Testing the DigiRx Patient Portal

This guide explains how to run the patient portal on your own computer and what to test, step by step. You don't need to read any code.

Each test has **Steps** and an **Expected** result. If what you see is different from "Expected", it's a bug. Write it down using the [bug template](#reporting-a-bug) at the end.

---

## ⚠️ The one rule

**Only ever test against your LOCAL database.** The `backend/.env` file from the team points at a **shared** database and shared file storage that other people use. Never run the portal, the setup script or tests against it. Step 2 below switches you to a local database. The setup script refuses to run if you get this wrong.

---

## Part 1: One-time setup (about 20 minutes)

### What you need installed
- **Node.js** 20 or newer
- **pnpm** (`npm install -g pnpm`)
- **Docker Desktop** (it runs the local database and file storage)
- **Git Bash** (comes with Git for Windows; use it for the commands below)

The project folder is `C:\Office Projects\DigiRx`. It has three apps:

| Folder | What it is | Address in the browser |
| --- | --- | --- |
| `backend` | The API that both apps use | http://localhost:4000 |
| `frontend` | The **clinic app** (for clinic staff) | http://localhost:5173 |
| `DigiRx-Patient/client` | The **patient portal** (what you are testing) | http://localhost:5174 |

### Step 1: Start the local database and file storage
Open Docker Desktop and wait until it says it is running. Then:
```bash
cd "/c/Office Projects/DigiRx"
docker compose up -d mongodb minio minio-init
```
**Expected:** Docker Desktop shows `digirx_mongodb` and `digirx_minio` as running.

### Step 2: Point the backend at the local database
1. In `C:\Office Projects\DigiRx\backend`, **rename** the existing `.env` to `.env.shared-dev`. Don't delete it; the team needs it.
2. Create a new file called `.env` in the same folder with exactly this content:

```env
PORT=4000
NODE_ENV=development

# LOCAL database only (separate database name just for portal testing)
MONGODB_URI=mongodb://root:rootpassword@127.0.0.1:27017/digirx_portal_test?authSource=admin
REDIS_URL=
NOTIFICATIONS_QUEUE_ENABLED=false

# LOCAL file storage (MinIO from docker compose)
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=digirx
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true

# Login secrets for local testing only
JWT_ACCESS_SECRET=local_access_secret_for_testing_only
JWT_REFRESH_SECRET=local_refresh_secret_for_testing_only
JWT_PORTAL_SECRET=local_portal_secret_for_testing_only_123

# Patient portal ON
PATIENT_PORTAL_ENABLED=true

# SMS and email are printed in the backend window instead of being sent
NOTIFICATION_PROVIDER=console

# Allow both apps to talk to the API
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

FACE_PROVIDER=local
```

> When you finish testing, delete this `.env` and rename `.env.shared-dev` back to `.env`.

### Step 3: Install the apps
```bash
cd "/c/Office Projects/DigiRx/backend" && pnpm install
cd "/c/Office Projects/DigiRx/frontend" && pnpm install
cd "/c/Office Projects/DigiRx/DigiRx-Patient" && npm install
```

### Step 4: Point the patient portal at the backend
Create the file `DigiRx-Patient/client/.env` with this one line:
```env
VITE_API_BASE_URL=http://localhost:4000
```
Also open `frontend/.env` if it exists. Its `VITE_API_BASE_URL` must be `http://localhost:4000` (or the line must be missing).

### Step 5: Create the test data
```bash
cd "/c/Office Projects/DigiRx/backend"
node scripts/portal-test-setup.cjs
```
**Expected:** it prints `Connected to local database "digirx_portal_test"`, then `Done. Test data ready.` and a list of logins.
If it prints **REFUSING TO RUN**, Step 2 is wrong. Stop and fix it.

You can run this command again at any time to **reset** all test data back to the start.

---

## Part 2: Starting everything (every testing day)

Open **three** Git Bash windows and leave them running:

| Window | Command | Ready when you see |
| --- | --- | --- |
| 1 Backend | `cd "/c/Office Projects/DigiRx/backend" && pnpm dev` | `Nest application successfully started` (it can take a minute) |
| 2 Clinic app | `cd "/c/Office Projects/DigiRx/frontend" && pnpm dev` | `Local: http://localhost:5173/` |
| 3 Patient portal | `cd "/c/Office Projects/DigiRx/DigiRx-Patient" && npm run dev` | `Local: http://localhost:5174/` |

**Where is the login code (OTP)?** No real SMS is sent. Look in **window 1 (Backend)** for a line like:
```
[notify] SMS +919000000011 482913 is your DigiRx login code...
```
The 6 digits (here `482913`) are the code.

---

## Test data you can use

**Patients** (use these numbers to log in to the patient portal)

| Person | Mobile | Date of birth | What's special |
| --- | --- | --- | --- |
| Priya Sharma | 9000000011 | 15 / 05 / 1990 | Has records at all 3 clinics. Her son Aarav (DOB 10 / 03 / 2016) is on the same number |
| Rahul Verma | 9000000022 | 02 / 11 / 1985 | Has a record at Sunrise. Use him as the "other person" |
| Meera Iyer | 9000000033 | 20 / 01 / 1972 | The clinic typed **21**/01/1972 by mistake, so her record must **not** link |

**Clinics** (staff logins for the clinic app; the password for all is `Test@12345`)

| Clinic | Staff login | On the portal? | Doctors |
| --- | --- | --- | --- |
| Sunrise Test Clinic | admin@sunrise.test | Yes. Changes allowed up to **2 hours** before a visit | Dr. Kavya Rao (₹500, Mon–Sat), Dr. Sana Khan (₹600, Mon/Wed/Fri) |
| CarePoint Test Clinic | admin@carepoint.test | Yes. Changes allowed up to **24 hours** before a visit | Dr. Rahul Menon (₹800, Mon–Sat) |
| Hidden Test Clinic | admin@hidden.test | **No** (must never appear in the portal) | Dr. Not Online |

Doctors work **9 AM – 1 PM and 4 PM – 7 PM** in 15-minute slots. Nobody works on Sundays.

**Tip:** to be two people at once, use a normal browser window for Priya and an **Incognito/Private** window for Rahul.

---

## Part 3: What to test

Tick each box as you go. Reset the data (Part 1, Step 5) before a full round of testing.

### A. Login

- [ ] **A1. Log in with a new number**
  Steps: Open http://localhost:5174 → **Get started** → enter `9000000011` → **Send code** → type the code from the backend window.
  Expected: You reach the "Tell us a little about you" screen.

- [ ] **A2. Wrong code**
  Steps: Log out, start again, and type `111111` as the code.
  Expected: The message "That code is incorrect or has expired". You are not logged in.

- [ ] **A3. Five wrong codes lock the code**
  Steps: Request a code. Type a wrong code 5 times, then type the **correct** code.
  Expected: The correct code is now refused too. You have to request a new code.

- [ ] **A4. Asking for codes too often**
  Steps: Click **Resend** straight away, before the countdown ends (or request twice within a minute).
  Expected: The message "Please wait a minute before asking for another code".

- [ ] **A5. Number that has never visited a clinic**
  Steps: Log in with `9111111111`, fill in any name and date of birth.
  Expected: Login works, and the portal shows no records. It must not show an error, and it must not show anyone else's data.

- [ ] **A6. Staying logged in**
  Steps: After logging in, refresh the page (F5).
  Expected: You are still logged in, and your data loads again.

- [ ] **A7. Log out**
  Steps: Profile → **Log out**.
  Expected: You're back at the welcome screen. Refreshing doesn't log you back in.

### B. Finding your records (linking)

Records are linked only when the clinic has **the same mobile number AND the same date of birth**.

- [ ] **B1. Records found**
  Steps: Log in as Priya. On the profile screen enter **Priya Sharma**, DOB **15 / 05 / 1990**, gender Female → **Continue**.
  Expected: A message like "Linked your records at 3 clinics". The home screen loads.

- [ ] **B2. The non-portal clinic stays hidden**
  Steps: As Priya, open **Find care / Discover** and **Records**.
  Expected: Sunrise and CarePoint appear. **Hidden Test Clinic does not appear anywhere.**

- [ ] **B3. Wrong date of birth links nothing**
  Steps: Log in as Meera (`9000000033`) and enter DOB **20 / 01 / 1972**.
  Expected: No records are linked. Meera sees nothing from Sunrise.

- [ ] **B4. The son's record is not shown to Priya automatically**
  Steps: As Priya (before adding any family), look at **Reports**.
  Expected: Only **CBC report**. "Vaccination card" (Aarav's) must **not** appear.

- [ ] **B5. Date of birth is locked after linking**
  Steps: As Priya → Profile → edit your details.
  Expected: The date of birth box is greyed out, with the text "Linked to your clinic records…".

- [ ] **B6. Bad date format**
  Steps: As a new number (e.g. `9222222222`), type the date of birth as `1990-05-15` or `15/13/1990`.
  Expected: The message "Enter your date of birth as DD / MM / YYYY…".

### C. Viewing records (log in as Priya)

- [ ] **C1. Visit history**
  Steps: Records → History.
  Expected: One visit, **"Gastro-oesophageal reflux (GERD)"**, from about 10 days ago at Sunrise. Open it: you see the vitals (BP 118/76, pulse 72…) and the follow-up advice.

- [ ] **C2. Private and draft data never show**
  Steps: Look through every records screen.
  Expected: You never see the words **"INTERNAL CLINICIAN NOTE"**, **"DRAFT VISIT"** or **"DRAFT MEDICINE"**.

- [ ] **C3. Prescription**
  Steps: Open **Prescriptions**.
  Expected: One active prescription: Pantoprazole 40 mg (morning, 14 days) and Antacid gel (3 times a day, 7 days). The download icon opens a PDF in a new tab.

- [ ] **C4. Lab report**
  Steps: Open **Reports** → **CBC report** → **Download**.
  Expected: A PDF opens in a new tab.

- [ ] **C5. Bill**
  Steps: Open **Billing**.
  Expected: One **due** bill from CarePoint for **₹1,200** (Skin consultation ₹800 + Patch test ₹400).

- [ ] **C6. Notifications**
  Steps: Open the bell / **Notifications**.
  Expected: "New report added" (CBC report) and "Bill due". **Mark all as read** removes the unread dots, and they stay read after a refresh.

### D. Booking an appointment (log in as Priya)

- [ ] **D1. See free slots**
  Steps: Find care → **Dr. Kavya Rao** → Book → pick a weekday (not Sunday).
  Expected: Morning (9 AM–1 PM) and Evening (4 PM–7 PM) slots every 15 minutes. Slots already in the past today are disabled.

- [ ] **D2. Book**
  Steps: Pick a free slot → Continue → type a reason, e.g. "Fever" → **Confirm booking**.
  Expected: The "Booking confirmed" screen. The appointment appears under **Appointments → Upcoming** with the right date and time.

- [ ] **D3. The clinic sees it**
  Steps: Log in to the **clinic app** (http://localhost:5173) as `admin@sunrise.test` / `Test@12345` and open Appointments for that day.
  Expected: Priya's appointment is there at the same time, with Dr. Kavya Rao.

- [ ] **D4. Taken slots are blocked**
  Steps: As Rahul (incognito window), open Dr. Kavya Rao on the **same day**.
  Expected: The slot Priya booked shows as **booked** and can't be picked. **Priya's name is never shown.**

- [ ] **D5. Only one visit per doctor per day**
  Steps: As Priya, try to book Dr. Kavya Rao again **on the same day**, at another time.
  Expected: The message "You already have an appointment with this doctor that day".

- [ ] **D6. Limit of 3 upcoming visits per clinic**
  Steps: As Priya, book Sunrise doctors on 3 different days, then try a 4th.
  Expected: The 4th is refused with "You can have up to 3 upcoming appointments at this clinic".

- [ ] **D7. Doctor's days are respected**
  Steps: Open **Dr. Sana Khan** and look at the days.
  Expected: Only Monday, Wednesday and Friday can be picked.

- [ ] **D8. Two people, same slot, same moment** (optional, needs two people or two windows)
  Steps: Priya and Rahul open the same free slot. Both click Confirm at the same time.
  Expected: One booking succeeds. The other sees "That slot was just taken. Please pick another time."

### E. Changing an appointment

- [ ] **E1. Reschedule**
  Steps: As Priya, open a Sunrise appointment that is more than 2 hours away → **Reschedule** → pick another day/time → confirm.
  Expected: "Appointment moved". The new time shows in the portal **and** in the clinic app.

- [ ] **E2. Cancel**
  Steps: Open a Sunrise appointment more than 2 hours away → **Cancel** → pick a reason → confirm.
  Expected: "Appointment cancelled". It moves to the **Cancelled** tab and says "cancelled by you". The clinic app shows it as cancelled, and the slot becomes free again.

- [ ] **E3. Too late to change (CarePoint = 24 hours)**
  Steps: Book **Dr. Rahul Menon** at CarePoint for **tomorrow**, then try to cancel it.
  Expected: Refused with a message like "Changes are possible up to 24 hours before the visit. Please call the clinic."

- [ ] **E4. Clinic cancels**
  Steps: In the clinic app, cancel one of Priya's appointments. In the portal, refresh.
  Expected: The portal shows it as **cancelled by the clinic**. The clinic's internal reason is **not** shown.

### F. Family

- [ ] **F1. Add a child**
  Steps: As Priya → Family → **+** → "Child or dependant" → name **Aarav Sharma**, relation Son, DOB **10 / 03 / 2016** → Add.
  Expected: Aarav appears in the family list. **Reports** now also show **Vaccination card**.

- [ ] **F2. Only children can be added as dependants**
  Steps: Try adding a dependant with DOB **01 / 01 / 1990**.
  Expected: The message "Only children under 18 can be added as dependants…".

- [ ] **F3. Book for the child**
  Steps: Start a booking → under "Who is this visit for?" pick **Aarav** → confirm.
  Expected: The booking succeeds, and the appointment shows "For Aarav".

- [ ] **F4. Invite another adult**
  Steps: As Rahul → Family → + → "Invite an adult" → mobile **9000000011**, name Priya → Send.
  Expected: The message "Invite sent". Rahul sees Priya as **Pending**.

- [ ] **F5. Accept the invite**
  Steps: As Priya, open Family.
  Expected: A card "Rahul… wants to connect with you" with **Accept / Decline**. Click **Accept**.

- [ ] **F6. Being family shares NOTHING by itself**
  Steps: As Rahul, refresh, then look at Prescriptions, Reports and Billing. Try to start a booking.
  Expected: Rahul sees **none** of Priya's records, and Priya can't be picked as "who is this visit for".

- [ ] **F7. Give one permission**
  Steps: As Priya → Family → Rahul → turn **on** only "See your prescriptions".
  Expected: As Rahul (after a refresh), Priya's **prescription** appears. Her **reports, bills and visit history still do not.**

- [ ] **F8. Remove the connection**
  Steps: As Priya → Family → Rahul → **Remove**.
  Expected: As Rahul (refresh), Priya's prescription is gone again.

### G. Sharing records with another clinic

Clinics normally see only their own records. This checks the patient's "share" switch.

- [ ] **G1. Sharing is off by default**
  Steps: As Priya → Privacy.
  Expected: Sharing is **off** for every clinic.

- [ ] **G2. Turn sharing on** (needs the commands below)
  Steps: Run commands 1–3 below. Then, as Priya, turn sharing **on** for **CarePoint**, and run command 3 again.
  Expected: Before → `"shared":false`. After → `"shared":true`, with the GERD visit from Sunrise listed. The internal clinician note is **not** in the output.
  ```bash
  # 1. Log in as CarePoint staff and keep the token
  TOKEN=$(curl -s -X POST http://localhost:4000/auth/login-by-email -H "Content-Type: application/json" \
    -d '{"email":"admin@carepoint.test","password":"Test@12345"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
  # 2. Find Priya's id at CarePoint (copy the first "_id" value)
  curl -s "http://localhost:4000/patients?query=Priya" -H "Authorization: Bearer $TOKEN"
  # 3. Ask for her shared records (replace PATIENT_ID)
  curl -s "http://localhost:4000/patients/PATIENT_ID/shared-records" -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **G3. Turn it off again**
  Steps: As Priya, turn CarePoint sharing **off**, then run command 3.
  Expected: Back to `"shared":false`.

### H. Privacy and profile

- [ ] **H1.** Privacy → turn **App lock** and **Hide record previews** on, then refresh. Expected: both are still on.
- [ ] **H2.** Profile → change the email, then refresh. Expected: the new email is saved.

### I. Online payment (only if the team gives you Razorpay **test** keys)

Without keys, check this instead: Billing → the CarePoint bill → **Pay** → **Continue to secure payment**.
Expected: the message "Online payment is not available yet. Please pay at the clinic."

With test keys (added to the backend `.env` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`):
- [ ] **I1.** Pay the CarePoint bill with Razorpay's test card. Expected: the bill turns **Paid**, and the clinic app shows the payment on that bill.
- [ ] **I2.** Close the payment window without paying. Expected: "Payment cancelled". The bill stays **due**.

### J. Security checks (important)

- [ ] **J1. One patient can't open another's records**
  Steps: As Priya, open a prescription and copy the address from the browser bar (e.g. `/prescriptions/...`). Paste it in Rahul's window.
  Expected: "Not found". Never Priya's data.
- [ ] **J2. Logged out means locked out**
  Steps: Log out, then paste http://localhost:5174/records into the address bar.
  Expected: You're sent to the welcome/login screen.
- [ ] **J3. Portal switched off**
  Steps: In `backend/.env` set `PATIENT_PORTAL_ENABLED=false` and restart window 1. Try to log in to the portal.
  Expected: Login fails. Meanwhile the clinic app at :5173 **still works normally**. Set it back to `true` and restart afterwards.

### K. Screen sizes

Open the browser DevTools (F12) → device toolbar. Check the Home, Booking and Records screens at:
- [ ] **Phone** (390 px wide): bottom navigation bar; nothing cut off; no sideways scrolling.
- [ ] **Tablet** (820 px): icon rail on the left.
- [ ] **Desktop** (1440 px): sidebar with a search bar on top.

### L. The clinic app still works (regression)

The portal must not change anything for clinic staff. Log in to the clinic app as `admin@sunrise.test` and check:
- [ ] L1. Add a new patient, book them an appointment, check them in.
- [ ] L2. Create a bill, issue it, take a cash payment.
- [ ] L3. Open the patient list and a patient's history.

Expected: everything works exactly as before.

---

## Resetting

- **Everything back to the start:** `cd backend && node scripts/portal-test-setup.cjs`. This also clears login codes, so use it if you're stuck on "Too many codes requested".
- **Remove the test data completely:** `node scripts/portal-test-setup.cjs --remove`

## When something doesn't work

| Problem | Fix |
| --- | --- |
| Setup script says **REFUSING TO RUN** | Your `backend/.env` points at the shared database. Redo Part 1, Step 2 |
| Portal says "Can't reach DigiRx" | Window 1 (backend) isn't running, or `client/.env` is missing (Step 4) |
| Login code never appears | Look in window 1 for `[notify] SMS`. Check `NOTIFICATION_PROVIDER=console` |
| "Too many codes requested" | Wait an hour, or reset (above) |
| Downloads fail | Docker's `digirx_minio` must be running; run the reset again |
| Blocked by CORS (in DevTools console) | Check `CORS_ORIGINS` in `backend/.env`, then restart window 1 |
| No slots | Pick a weekday; Sunday has none. Slots before now are disabled |

## Reporting a bug

Copy this for each bug:

```
Test ID:        (e.g. D4)
Who:            (Priya / Rahul / clinic staff)
Screen size:    (phone / tablet / desktop)
Steps:          1. ...  2. ...  3. ...
Expected:       (copy from this guide)
What happened:  (what you saw — include the exact message)
Screenshot:     (attach)
Backend window: (copy any red error lines from window 1)
```

## When you're done for the day

1. Stop the three windows (Ctrl + C in each).
2. `docker compose stop` in the `DigiRx` folder.
3. If you've finished testing for good: delete `backend/.env` and rename `backend/.env.shared-dev` back to `.env`.
