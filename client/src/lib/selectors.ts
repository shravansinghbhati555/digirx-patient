import { TODAY } from './today';
import type { Appointment, Clinic, Doctor, ID, PortalData, RecordType } from '../types';
import { timeToMinutes } from './format';

export interface Person {
  id: ID;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  relation?: string;
  isMe: boolean;
}

export function people(d: PortalData): Person[] {
  const me: Person = { ...d.patient, isMe: true };
  return [
    me,
    ...d.family
      .filter((m) => m.kind !== 'pending')
      .map((m) => ({ id: m.id, name: m.name, firstName: m.firstName, initials: m.initials, color: m.color, relation: m.relation, isMe: false })),
  ];
}

export function person(d: PortalData, id: ID): Person | undefined {
  return people(d).find((p) => p.id === id);
}

/** "For you" / "For Aarav" */
export function forLabel(d: PortalData, patientId: ID): string {
  if (patientId === d.patient.id) return 'For you';
  return `For ${person(d, patientId)?.firstName ?? 'family'}`;
}

/** "Riya Mehta (you)" / "Aarav Mehta" */
export function patientLabel(d: PortalData, patientId: ID): string {
  const p = person(d, patientId);
  if (!p) return 'Unknown';
  return p.isMe ? `${p.name} (you)` : p.name;
}

/** Who can be booked for: you, dependants, and adults who granted `book`. */
export function bookablePeople(d: PortalData) {
  return people(d).map((p) => {
    const member = d.family.find((m) => m.id === p.id);
    const allowed = p.isMe || !member || member.kind === 'dependant' || member.theyAllow.book;
    const label = p.isMe ? 'Me' : allowed && p.relation ? `${p.firstName} (${p.relation.toLowerCase()})` : p.firstName;
    return { ...p, allowed, label };
  });
}

export const clinicById = (d: PortalData, id?: ID): Clinic | undefined => d.clinics.find((c) => c.id === id);
export const doctorById = (d: PortalData, id?: ID): Doctor | undefined => d.doctors.find((x) => x.id === id);

const sortKey = (a: Appointment) => `${a.date} ${String(timeToMinutes(a.time)).padStart(4, '0')}`;

export function upcoming(d: PortalData): Appointment[] {
  return d.appointments
    .filter((a) => (a.status === 'confirmed' || a.status === 'pending') && a.date >= TODAY)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

export function past(d: PortalData): Appointment[] {
  return d.appointments
    .filter((a) => a.status === 'completed' || a.status === 'missed')
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

export function cancelled(d: PortalData): Appointment[] {
  return d.appointments.filter((a) => a.status === 'cancelled').sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

export const recordTypes: Record<RecordType, { label: string; plural: string; bg: string }> = {
  visit: { label: 'Visit', plural: 'Visits', bg: '#FFE8DF' },
  lab: { label: 'Lab report', plural: 'Lab reports', bg: '#FFE2E0' },
  rx: { label: 'Prescription', plural: 'Prescriptions', bg: '#FFF1D6' },
  vax: { label: 'Vaccine', plural: 'Vaccines', bg: '#DDF3E4' },
};

/** Year-to-date summary for the dashboard hero tile. */
export function yearSummary(d: PortalData) {
  const year = TODAY.slice(0, 4);
  const thisYear = d.records.filter((r) => r.date.startsWith(year));
  // A "visit" is a distinct day at a clinic, whatever records it produced.
  const visits = new Set(thisYear.map((r) => `${r.date}|${r.clinicId}`));
  return {
    year,
    visits: visits.size,
    clinics: new Set(thisYear.map((r) => r.clinicId)).size,
    activeRx: d.prescriptions.filter((p) => p.active).length,
    newReports: d.reports.filter((r) => r.isNew).length,
  };
}

export const unreadCount = (d: PortalData) => d.notifications.filter((n) => n.unread).length;
