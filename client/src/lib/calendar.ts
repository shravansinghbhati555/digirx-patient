import type { Appointment, Clinic, Doctor } from '../types';
import { timeToMinutes } from './format';

const pad = (n: number) => String(n).padStart(2, '0');

/** Floating local time (no TZ suffix) so calendars show the clinic-local time. */
function stamp(date: string, minutes: number) {
  const [y, m, d] = date.split('-');
  return `${y}${m}${d}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}

const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function appointmentIcs(a: Appointment, doctor?: Doctor, clinic?: Clinic): string {
  const start = timeToMinutes(a.time);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DigiRx//Patient Portal//EN',
    'BEGIN:VEVENT',
    `UID:${a.id}@digirx`,
    `DTSTAMP:${stamp(a.date, start)}`,
    `DTSTART:${stamp(a.date, start)}`,
    `DTEND:${stamp(a.date, start + a.durationMin)}`,
    `SUMMARY:${esc(`${a.title}${doctor ? ` · ${doctor.name}` : ''}`)}`,
    clinic ? `LOCATION:${esc(`${clinic.name}, ${clinic.address}`)}` : '',
    `DESCRIPTION:${esc(`Booking ID ${a.code}. Arrive 10 minutes early with a photo ID.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}
