import { TODAY } from '../data/mock';
import type { Appointment, Doctor, ID, LocalDate } from '../types';
import { addDays, minutesToTime, timeToMinutes, toDate } from './format';

/**
 * Stand-in for the clinic availability API. Slots come from the doctor's
 * weekly days; a deterministic hash marks some as already booked so the
 * same date always looks the same. Real slots will come from
 * `GET /availability` — the portal adds no scheduling logic of its own.
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
  for (const d of bookingDays(doctor, clinicId, TODAY, 14)) {
    if (!d.open) continue;
    const times = openSlots(slotsFor(doctor, clinicId, d.date, existing));
    if (times.length) return { date: d.date, times };
  }
  return null;
}

/** The demo clock reads 2 PM on TODAY, so earlier slots today are gone. */
export function isPastTime(date: LocalDate, time: string, nowMinutes = 14 * 60) {
  return date === TODAY && timeToMinutes(time) <= nowMinutes;
}
