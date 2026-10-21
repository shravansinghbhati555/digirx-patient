import { useEffect, useState, useSyncExternalStore } from 'react';
import { TODAY } from './today';
import type { Appointment, Doctor, ID, LocalDate } from '../types';
import { addDays, toDate } from './format';
import { fetchNextAvailable, fetchSlots } from '../services/api';
import { errorMessage } from '../services/http';

/**
 * Doctor availability from the clinic's own engine (`GET /portal/slots`).
 * The server re-checks every booking; the portal does not invent slots.
 */

export interface Slot {
  time: string;
  booked: boolean;
}

export interface SlotGroup {
  name: 'Morning' | 'Evening';
  slots: Slot[];
}

export interface DayOption {
  date: LocalDate;
  open: boolean;
}

/** Times the clinic still has free, from the groups the server returned. */
export function openSlots(groups: SlotGroup[]): string[] {
  return groups.flatMap((g) => g.slots.filter((s) => !s.booked).map((s) => s.time));
}

export function worksOn(doctor: Doctor, clinicId: ID, date: LocalDate): boolean {
  const c = doctor.clinics.find((x) => x.clinicId === clinicId) ?? doctor.clinics[0];
  return c.days.includes(toDate(date).getDay());
}

export function bookingDays(doctor: Doctor, clinicId: ID, from: LocalDate = TODAY, count = 7): DayOption[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(from, i);
    return { date, open: worksOn(doctor, clinicId, date) };
  });
}

const slotKey = (doctorId: ID, clinicId: ID, date: LocalDate, ignore?: ID) =>
  `${clinicId}|${doctorId}|${date}|${ignore ?? ''}`;

const slotCache = new Map<string, SlotGroup[]>();
const nextCache = new Map<string, { date: LocalDate; times: string[] } | null>();
const listeners = new Set<() => void>();
let version = 0;
const bump = () => {
  version += 1;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-render when server availability arrives. */
export function useAvailabilityVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

/** Drop cached availability (after a booking, cancel or reschedule). */
export function invalidateAvailability() {
  slotCache.clear();
  nextCache.clear();
  bump();
}

let pending = new Map<string, { clinicId: ID; doctorId: ID }>();
let scheduled = false;

function nextFromServer(doctor: Doctor, clinicId: ID) {
  if (doctor.bookable === false) return null;
  const key = `${clinicId}|${doctor.id}`;
  if (nextCache.has(key)) return nextCache.get(key) ?? null;
  pending.set(key, { clinicId, doctorId: doctor.id });
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flushNext);
  }
  return null;
}

async function flushNext() {
  scheduled = false;
  const batch = [...pending.entries()];
  pending = new Map();
  for (const [k] of batch) nextCache.set(k, null);
  for (let i = 0; i < batch.length; i += 20) {
    const chunk = batch.slice(i, i + 20).map(([, v]) => v);
    try {
      const res = await fetchNextAvailable(chunk);
      for (const it of res.items) nextCache.set(`${it.clinicId}|${it.doctorId}`, it.next);
    } catch {
      /* labels just stay empty */
    }
  }
  bump();
}

/** First open slot today or later, for "Next available" labels. */
export function nextAvailable(doctor: Doctor, clinicId: ID, _existing: Appointment[] = []) {
  return nextFromServer(doctor, clinicId);
}

/**
 * Slots for one doctor/clinic/day from the server. Returns empty groups
 * while loading.
 */
export function useSlots(
  doctor: Doctor | undefined,
  clinicId: ID | undefined,
  date: LocalDate,
  ignoreAppointmentId?: ID,
  _existing: Appointment[] = [],
) {
  useAvailabilityVersion();
  const [error, setError] = useState('');
  const key = doctor && clinicId ? slotKey(doctor.id, clinicId, date, ignoreAppointmentId) : '';
  useEffect(() => {
    if (!doctor || !clinicId || slotCache.has(key)) return;
    let live = true;
    setError('');
    fetchSlots(clinicId, doctor.id, date, ignoreAppointmentId)
      .then((res) => {
        if (!live) return;
        slotCache.set(key, res.groups);
        bump();
      })
      .catch((e) => {
        if (!live) return;
        slotCache.set(key, []);
        setError(errorMessage(e));
        bump();
      });
    return () => {
      live = false;
    };
  }, [key, doctor, clinicId, date, ignoreAppointmentId]);

  if (!doctor || !clinicId) return { groups: [] as SlotGroup[], loading: false, error };
  const groups = slotCache.get(key);
  return { groups: groups ?? [], loading: groups === undefined, error };
}
