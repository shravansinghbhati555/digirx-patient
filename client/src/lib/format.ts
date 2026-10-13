import { TODAY } from '../data/mock';
import type { LocalDate } from '../types';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse a local YYYY-MM-DD at noon so DST/timezone shifts never change the day. */
export function toDate(d: LocalDate): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day, 12);
}

export function toLocalDate(d: Date): LocalDate {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: LocalDate, n: number): LocalDate {
  const x = toDate(d);
  x.setDate(x.getDate() + n);
  return toLocalDate(x);
}

export function daysFromToday(d: LocalDate): number {
  return Math.round((toDate(d).getTime() - toDate(TODAY).getTime()) / 86_400_000);
}

export const dow = (d: LocalDate) => DOW[toDate(d).getDay()];
export const dowLong = (d: LocalDate) => DOW_LONG[toDate(d).getDay()];
export const dayNum = (d: LocalDate) => toDate(d).getDate();
export const dayPadded = (d: LocalDate) => String(toDate(d).getDate()).padStart(2, '0');
export const monthShort = (d: LocalDate) => MON[toDate(d).getMonth()];
export const monthYear = (d: LocalDate) => `${MON_LONG[toDate(d).getMonth()]} ${toDate(d).getFullYear()}`;

/** "14 Oct" */
export const dayMonth = (d: LocalDate) => `${dayNum(d)} ${monthShort(d)}`;
/** "Wed, 14 Oct" */
export const shortDate = (d: LocalDate) => `${dow(d)}, ${dayMonth(d)}`;
/** "5 Oct 2026" */
export const fullDate = (d: LocalDate) => `${dayMonth(d)} ${toDate(d).getFullYear()}`;
/** "Wednesday, 14 October" */
export const longDate = (d: LocalDate) => `${dowLong(d)}, ${dayNum(d)} ${MON_LONG[toDate(d).getMonth()]}`;

/** "Today" / "Tomorrow" / "Wed, 14 Oct" */
export function relativeDay(d: LocalDate): string {
  const n = daysFromToday(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return shortDate(d);
}

/** Parses "10:30 AM" into minutes after midnight. */
export function timeToMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

export function minutesToTime(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const mm = String(min % 60).padStart(2, '0');
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${mm} ${ampm}`;
}

/** "10:30 – 10:45 AM" */
export function timeRange(start: string, durationMin: number): string {
  const end = minutesToTime(timeToMinutes(start) + durationMin);
  const [s, sp] = start.split(' ');
  const [e, ep] = end.split(' ');
  return sp === ep ? `${s} – ${e} ${ep}` : `${start} – ${end}`;
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const rupees = (n: number) => `₹${inr.format(n)}`;
/** "₹4.2k" for compact stat tiles */
export const rupeesCompact = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : rupees(n));

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
