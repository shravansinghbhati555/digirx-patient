import { setToday } from '../lib/today';
import type {
  Appointment,
  BookingDraft,
  Grants,
  ID,
  LocalDate,
  Patient,
  PortalData,
  PrivacySettings,
} from '../types';
import type { SlotGroup } from '../lib/availability';
import { ApiError, api, setAccessToken } from './http';

/** Everything the screens need, against the DigiRx backend `/portal/*` API. */

export { ApiError } from './http';

// --- Auth -------------------------------------------------------------------


export async function requestOtp(
  phone: string,
): Promise<{ sentTo: string; otp?: string; ttlSeconds?: number }> {
  const res = await api<{
    ok: boolean;
    ttlSeconds: number;
    otp?: string;
  }>('/portal/auth/request-otp', {
    method: 'POST',
    json: { phone },
  });

  return {
    sentTo: phone,
    ttlSeconds: res.ttlSeconds,
    ...(import.meta.env.DEV && res.otp ? { otp: res.otp } : {}),
  };
}


export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ ok: boolean; attemptsLeft?: number; profileComplete?: boolean; error?: string }> {
  try {
    const res = await api<{ accessToken: string; patient: Patient }>('/portal/auth/verify-otp', {
      method: 'POST',
      json: { phone, code },
    });
    setAccessToken(res.accessToken);
    return { ok: true, profileComplete: !!res.patient.profileComplete };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await api('/portal/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

// --- Data -------------------------------------------------------------------

export async function fetchPortal(): Promise<PortalData> {
  const data = await api<PortalData>('/portal/bootstrap');
  if (data.today) setToday(data.today);
  return data;
}

/** DD / MM / YYYY (as typed in the profile form) → YYYY-MM-DD, or null. */
export function dobToIso(dob: string): string | null {
  const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(dob.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const date = new Date(`${iso}T12:00:00`);
  return isNaN(date.getTime()) || date.getMonth() + 1 !== Number(mo) ? null : iso;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER: Record<Patient['gender'], string> = { Female: 'FEMALE', Male: 'MALE', Other: 'OTHER' };

export function updateProfile(p: Partial<Patient>) {
  const dob = p.dob ? dobToIso(p.dob) : undefined;
  return api<{ patient: Patient; linkedRecords: number }>('/portal/me', {
    method: 'PATCH',
    json: {
      fullName: p.name,
      ...(dob ? { dob } : {}),
      gender: p.gender ? GENDER[p.gender] : undefined,
      email: p.email ?? null,
      bloodGroup: p.bloodGroup && BLOOD_GROUPS.includes(p.bloodGroup) ? p.bloodGroup : null,
    },
  });
}

// --- Booking ----------------------------------------------------------------

export function fetchSlots(clinicId: ID, doctorId: ID, date: LocalDate, ignoreAppointmentId?: ID) {
  const q = new URLSearchParams({ clinicId, doctorId, date });
  if (ignoreAppointmentId) q.set('ignoreAppointmentId', ignoreAppointmentId);
  return api<{ date: string; groups: SlotGroup[] }>(`/portal/slots?${q}`);
}

export function fetchNextAvailable(items: { clinicId: ID; doctorId: ID }[]) {
  return api<{ items: { clinicId: ID; doctorId: ID; next: { date: LocalDate; times: string[] } | null }[] }>(
    '/portal/availability/next',
    { method: 'POST', json: { items } },
  );
}

export function bookAppointment(draft: BookingDraft, selfId: ID) {
  return api<Appointment>('/portal/appointments', {
    method: 'POST',
    json: {
      patientId: draft.patientId === selfId ? undefined : draft.patientId,
      clinicId: draft.clinicId,
      doctorId: draft.doctorId,
      date: draft.date,
      time: draft.time,
      reason: draft.reason || undefined,
      shareRecords: draft.shareRecords,
      payment: draft.payment,
    },
  });
}

export function cancelAppointment(id: ID, reason: string) {
  return api<Appointment>(`/portal/appointments/${id}/cancel`, { method: 'POST', json: { reason } });
}

export function rescheduleAppointment(id: ID, date: LocalDate, time: string) {
  return api<Appointment>(`/portal/appointments/${id}/reschedule`, { method: 'POST', json: { date, time } });
}

// --- Family -----------------------------------------------------------------

export function addDependant(input: { fullName: string; dob: string; relation?: string }) {
  return api<{ id: ID }>('/portal/family/dependants', { method: 'POST', json: input });
}

export function inviteFamily(input: { phone: string; name?: string; relation?: string }) {
  return api<{ sent: boolean }>('/portal/family/invites', { method: 'POST', json: input });
}

export function respondInvite(connectionId: ID, accept: boolean) {
  return api(`/portal/family/invites/${connectionId}/respond`, { method: 'POST', json: { accept } });
}

export function setFamilyGrants(connectionId: ID, patch: Partial<Grants>) {
  return api<Grants>(`/portal/family/${connectionId}/grants`, { method: 'PUT', json: patch });
}

export function removeFamilyMember(id: ID) {
  return api(`/portal/family/${id}`, { method: 'DELETE' });
}

// --- Privacy / notifications --------------------------------------------------

export function updatePrivacy(patch: Partial<Pick<PrivacySettings, 'appLock' | 'hidePreviews'>>) {
  return api('/portal/me/privacy', { method: 'PATCH', json: patch });
}

export function setClinicSharing(clinicId: ID, enabled: boolean) {
  return api(`/portal/me/record-sharing/${clinicId}`, { method: 'PUT', json: { enabled } });
}

export function markNotificationsRead(ids?: ID[]) {
  return api('/portal/notifications/read', { method: 'POST', json: ids ? { ids } : {} });
}

// --- Files ------------------------------------------------------------------

type SignedUrl = { url: string; expiresInSeconds: number; mimeType: string };

export const reportUrl = (id: ID) => api<SignedUrl>(`/portal/reports/${id}/download`);
export const prescriptionPdfUrl = (id: ID) => api<SignedUrl>(`/portal/prescriptions/${id}/pdf`);
export const invoicePdfUrl = (id: ID) => api<SignedUrl>(`/portal/bills/${id}/pdf`);

// --- Payments -----------------------------------------------------------------

export function createPaymentOrder(billId: ID) {
  return api<{ orderId: string; amount: number; currency: string; keyId?: string }>(`/portal/bills/${billId}/pay/order`, {
    method: 'POST',
  });
}

export function verifyPayment(
  billId: ID,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) {
  return api<{ ok: boolean }>(`/portal/bills/${billId}/pay/verify`, { method: 'POST', json: payload });
}
