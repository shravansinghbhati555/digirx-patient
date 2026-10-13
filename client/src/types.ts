// Domain types for the patient portal. Shapes follow the handoff's data
// sources (clinics, doctors, availability, appointments, records,
// prescriptions, billing) so the mock layer can be swapped for the API.

export type ID = string;

/** YYYY-MM-DD in clinic-local time. */
export type LocalDate = string;

export interface Patient {
  id: ID;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  phone: string;
  dob: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodGroup?: string;
  email?: string;
  patientCode: string;
  healthTags: string[];
}

export interface Clinic {
  id: ID;
  name: string;
  short: string;
  initials: string;
  area: string;
  address: string;
  phone: string;
  distanceKm: number;
  doctorCount: number;
  hours: string;
  openUntil: string;
  feesFrom: number;
  /** Identity colour for timeline rails and dots — never the only signal. */
  color: string;
  /** Tailwind background-image token, e.g. `bg-clinic-a`. */
  gradient: string;
  services: string[];
  tags: string[];
}

export interface DoctorClinic {
  clinicId: ID;
  schedule: string;
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
}

export interface Doctor {
  id: ID;
  name: string;
  initials: string;
  color: string;
  speciality: string;
  specialityId: ID;
  qualifications: string;
  regNo?: string;
  years: number;
  fee: number;
  durationMin: number;
  languages: string[];
  about: string;
  clinics: DoctorClinic[];
  availabilityNote: string;
  seenBefore: boolean;
  pronoun: 'her' | 'him' | 'them';
}

export interface Speciality {
  id: ID;
  label: string;
  doctorCount: number;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'missed' | 'cancelled';

export interface Appointment {
  id: ID;
  code: string;
  patientId: ID;
  doctorId?: ID;
  clinicId: ID;
  date: LocalDate;
  time: string;
  durationMin: number;
  title: string;
  status: AppointmentStatus;
  fee: number;
  payment: 'clinic' | 'online';
  reason?: string;
  cancelledBy?: 'you' | 'clinic';
  outcomeNote?: string;
  visitId?: ID;
  reportId?: ID;
}

export type RecordType = 'visit' | 'lab' | 'rx' | 'vax';

export interface HealthRecord {
  id: ID;
  type: RecordType;
  date: LocalDate;
  clinicId: ID;
  title: string;
  who: string;
  summary: string;
  to: string;
}

export interface Visit {
  id: ID;
  date: LocalDate;
  time: string;
  clinicId: ID;
  doctorId: ID;
  title: string;
  mode: string;
  vitals?: { label: string; value: string; unit: string }[];
  diagnosis?: string;
  notes: string;
  prescriptionId?: ID;
  reportId?: ID;
  invoiceId?: ID;
  followUp?: string;
}

export type ReportCategory = 'lab' | 'imaging' | 'summary' | 'uploaded';

export interface LabResult {
  test: string;
  result: string;
  range: string;
  flag?: 'LOW' | 'HIGH';
}

export interface Report {
  id: ID;
  title: string;
  /** e.g. "CBC" — used in activity lines. */
  shortName?: string;
  clinicId?: ID;
  date: LocalDate;
  category: ReportCategory;
  isNew?: boolean;
  thumb: string;
  orderedBy?: string;
  sampledAt?: string;
  reportedAt?: string;
  labId?: string;
  verifiedBy?: string;
  pages: number;
  results?: LabResult[];
  alert?: string;
}

export interface Medicine {
  name: string;
  form: string;
  duration: string;
  /** Doses at morning / afternoon / night */
  schedule: [number, number, number];
  instructions: string;
}

export interface Prescription {
  id: ID;
  title: string;
  date: LocalDate;
  validTill?: LocalDate;
  doctorId: ID;
  clinicId: ID;
  patientId: ID;
  active: boolean;
  dayOf?: [number, number];
  medicines: Medicine[];
  advice: string[];
  thumb: string;
}

export type InvoiceStatus = 'due' | 'paid' | 'refunded';

export interface Invoice {
  id: ID;
  title: string;
  clinicId: ID;
  doctorId?: ID;
  patientId: ID;
  date: LocalDate;
  dueDate?: LocalDate;
  amount: number;
  status: InvoiceStatus;
  method?: 'UPI' | 'Card' | 'Cash';
  paidOn?: LocalDate;
  reference?: string;
  gstin?: string;
  items: { label: string; amount: number; muted?: boolean }[];
}

export interface Grants {
  book: boolean;
  rx: boolean;
  reports: boolean;
  bills: boolean;
}

export type FamilyKind = 'dependant' | 'linked' | 'pending';

export interface FamilyMember {
  id: ID;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  relation: string;
  kind: FamilyKind;
  note: string;
  age?: number;
  linkedSince?: string;
  /** What this member lets you do (set by them; for dependants, you manage all). */
  theyAllow: Grants;
  /** What you let this member do (set by you). */
  youAllow: Grants;
  grantsChangedOn?: string;
}

export type NotificationKind = 'appointment' | 'records' | 'family' | 'medicine' | 'payment';

export interface PortalNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  when: string;
  group: 'Today' | 'Earlier';
  unread: boolean;
  to: string;
}

export type Mood = 'great' | 'unwell' | 'tired' | 'anxious' | 'okay';

export interface PrivacySettings {
  clinicSharing: Record<ID, boolean>;
  appLock: boolean;
  hidePreviews: boolean;
}

export interface BookingDraft {
  doctorId: ID;
  clinicId: ID;
  patientId: ID;
  date: LocalDate;
  time: string;
  reason: string;
  shareRecords: boolean;
  payment: 'clinic' | 'online';
}

/** Everything the portal loads for a signed-in patient. */
export interface PortalData {
  patient: Patient;
  clinics: Clinic[];
  doctors: Doctor[];
  specialities: Speciality[];
  appointments: Appointment[];
  records: HealthRecord[];
  visits: Visit[];
  reports: Report[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  family: FamilyMember[];
  notifications: PortalNotification[];
  privacy: PrivacySettings;
}
