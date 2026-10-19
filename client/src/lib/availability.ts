import { useEffect, useState, useSyncExternalStore } from 'react';
import { TODAY } from '../data/mock';
import type { Appointment, Doctor, ID, LocalDate } from '../types';
import { addDays, minutesToTime, timeToMinutes, toDate } from './format';
import { API_MODE, fetchNextAvailable, fetchSlots } from '../services/api';
import { errorMessage } from '../services/http';

/**
 * Doctor availability.
 *
 * With the API, slots come from the clinic's own availability engine
 * (`GET /portal/slots`) and the server re-checks every booking — the
 * portal adds no scheduling logic of its own. In mock mode a deterministic
 * stand-in marks some slots as booked so the same date always looks the same.
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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

function range(startMin: number, endMin: number, step: number): number[] {
  const out: number[] = [];
  for (let m = startMin; m < endMin; m += step) out.push(m);
  return out;
}

export function slotsFor(
  doctor: Doctor,
  clinicId: ID,
  date: LocalDate,
  existing: Appointment[] = [],
  ignoreAppointmentId?: ID,
): SlotGroup[] {
  if (API_MODE) return slotCache.get(slotKey(doctor.id, clinicId, date, ignoreAppointmentId)) ?? [];
  if (!worksOn(doctor, clinicId, date)) return [];
  const taken = new Set(
    existing
      .filter(
        (a) =>
          a.id !== ignoreAppointmentId &&
          a.doctorId === doctor.id &&
          a.date === date &&
          (a.status === 'confirmed' || a.status === 'pending'),
      )
      .map((a) => a.time),
  );
  const mk = (mins: number[]): Slot[] =>
    mins.map((m) => {
      const time = minutesToTime(m);
      const booked = isPastTime(date, time) || taken.has(time) || hash(`${doctor.id}|${date}|${time}`) % 3 === 0;
      return { time, booked };
    });
  return [
    { name: 'Morning' as const, slots: mk(range(9 * 60, 13 * 60, 30)) },
    { name: 'Evening' as const, slots: mk(range(16 * 60, 19 * 60, 30)) },
  ];
}

export function openSlots(groups: SlotGroup[]): string[] {
  return groups.flatMap((g) => g.slots.filter((s) => !s.booked).map((s) => s.time));
}

/** First open slot today or later, for "Next available" labels. */
export function nextAvailable(doctor: Doctor, clinicId: ID, existing: Appointment[] = []) {
  if (API_MODE) return nextFromServer(doctor, clinicId);
  for (const d of bookingDays(doctor, clinicId, TODAY, 14)) {
    if (!d.open) continue;
    const times = openSlots(slotsFor(doctor, clinicId, d.date, existing));
    if (times.length) return { date: d.date, times };
  }
  return null;
}

/** The demo clock reads 2 PM on TODAY; with the API it is the real time. */
export function isPastTime(date: LocalDate, time: string, nowMinutes?: number) {
  const now = nowMinutes ?? (API_MODE ? new Date().getHours() * 60 + new Date().getMinutes() : 14 * 60);
  return date === TODAY && timeToMinutes(time) <= now;
}

// ---------------------------------------------------------------------------
// API-backed caches
// ---------------------------------------------------------------------------

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

/**
 * Re-render when server availability arrives. Call it in any component that
 * shows `nextAvailable(...)`; it is a no-op in mock mode.
 */
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
  for (const [k] of batch) nextCache.set(k, null); // in flight: don't re-request
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

/**
 * Slots for one doctor/clinic/day from the server. Returns `null` while
 * loading. `slotsFor` reads the same cache, so existing callers work.
 */
export function useSlots(
  doctor: Doctor | undefined,
  clinicId: ID | undefined,
  date: LocalDate,
  ignoreAppointmentId?: ID,
  existing: Appointment[] = [],
) {
  useAvailabilityVersion();
  const [error, setError] = useState('');
  const key = doctor && clinicId ? slotKey(doctor.id, clinicId, date, ignoreAppointmentId) : '';
  useEffect(() => {
    if (!API_MODE || !doctor || !clinicId || slotCache.has(key)) return;
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
  if (!API_MODE) return { groups: slotsFor(doctor, clinicId, date, existing, ignoreAppointmentId), loading: false, error: '' };
  const groups = slotCache.get(key);
  return { groups: groups ?? [], loading: groups === undefined, error };
}
