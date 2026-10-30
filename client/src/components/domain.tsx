import { Link } from 'react-router-dom';
import { nextAvailable, useAvailabilityVersion, type DayOption, type SlotGroup } from '../lib/availability';
import { dayMonth, dayNum, dayPadded, dow, relativeDay, rupees, timeRange } from '../lib/format';
import { clinicById, doctorById, forLabel, recordTypes } from '../lib/selectors';
import type { Appointment, Clinic, Doctor, HealthRecord, Mood, PortalData } from '../types';
import { Face, moodFaces } from './ui/Art';
import { Avatar, ClinicMark, Tag, type Tone } from './ui/Bits';
import { Icon } from './ui/Icon';

/* ---------- Mood check-in ---------- */

export function MoodPicker({ value, onChange, wrap }: { value: Mood; onChange: (m: Mood) => void; wrap?: boolean }) {
  return (
    <div role="radiogroup" aria-label="How are you feeling today?" className={`flex gap-2.5 pt-[18px] ${wrap ? 'flex-wrap gap-3' : 'scroller'}`}>
      {(Object.keys(moodFaces) as Mood[]).map((m, i) => {
        const f = moodFaces[m];
        const on = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            className={`relative flex h-10 flex-none items-center rounded-full bg-surface px-[18px] text-[15px] font-medium ${on ? 'shadow-[inset_0_0_0_2px_#181818]' : ''}`}
          >
            {f.label}
            <Face size={30} spec={f} rotate={i % 2 ? -8 : 8} className="absolute -right-1.5 -top-5" />
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Status ---------- */

export function statusTag(a: Appointment): { label: string; tone: Tone } {
  switch (a.status) {
    case 'confirmed':
      return { label: 'Confirmed', tone: 'ok' };
    case 'pending':
      return { label: 'Awaiting clinic', tone: 'warn' };
    case 'completed':
      return { label: 'Completed', tone: 'ok' };
    case 'missed':
      return { label: 'Missed', tone: 'neutral' };
    case 'cancelled':
      return a.cancelledBy === 'clinic' ? { label: 'Cancelled by clinic', tone: 'warn' } : { label: 'Cancelled by you', tone: 'bad' };
  }
}

/* ---------- Appointment cards ---------- */

/** The "next visit" card on the dashboard. */
export function NextVisitCard({ appt, data, large }: { appt: Appointment; data: PortalData; large?: boolean }) {
  const doctor = doctorById(data, appt.doctorId);
  const clinic = clinicById(data, appt.clinicId);
  const tag = statusTag(appt);
  return (
    <Link to={`/appointments/${appt.id}`} className={`card flex flex-col gap-1.5 ${large ? 'p-[22px] desktop:p-[26px]' : 'p-[18px]'}`}>
      <span className="flex items-center justify-between gap-2.5">
        <span className="text-[13px] font-medium tablet:text-[14px]">
          {large && <span className="hidden desktop:inline">Next visit · </span>}
          {relativeDay(appt.date)}, {timeRange(appt.time, appt.durationMin)}
        </span>
        <Tag tone={tag.tone} className="text-[12px]">
          {tag.label}
        </Tag>
      </span>
      <span className={`font-semibold tracking-[-0.02em] ${large ? 'text-[23px] tablet:text-[26px] desktop:text-[30px]' : 'text-[23px]'}`}>{appt.title}</span>
      {clinic && (
        <span className="flex items-center gap-1.5 text-[13px] text-text-caption tablet:text-[14px]">
          <Icon name="pin" size={16} />
          {clinic.name} · <span className={large ? 'desktop:hidden' : ''}>{clinic.area}</span>
          {large && <span className="hidden desktop:inline">{clinic.address.split(',').slice(0, 2).join(',')}</span>}
        </span>
      )}
      <span className="mb-2 mt-2.5 h-px bg-divider" />
      <span className="flex items-center gap-3">
        {doctor ? <Avatar initials={doctor.initials} color={doctor.color} size={large ? 44 : 40} /> : null}
        <span className="flex flex-1 flex-col">
          <span className="text-[16px] font-medium">{doctor?.name ?? clinic?.name}</span>
          <span className="text-[13px] text-text-caption">{doctor?.speciality ?? forLabel(data, appt.patientId)}</span>
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface" aria-hidden="true">
          <Icon name="arrow" size={20} />
        </span>
      </span>
    </Link>
  );
}

const dateTint = ['#ECE3FF', '#FFE8DF', '#DCEBFF', '#FFE2E0'];

/** Compact list card with a date block. */
export function AppointmentRow({ appt, data, index = 0 }: { appt: Appointment; data: PortalData; index?: number }) {
  const doctor = doctorById(data, appt.doctorId);
  const tag = statusTag(appt);
  const forTone = appt.patientId === data.patient.id ? '#FFE8DF' : (data.family.find((m) => m.id === appt.patientId)?.color ?? '#DCEBFF');
  return (
    <Link to={`/appointments/${appt.id}`} className="card flex items-center gap-3.5 p-3.5">
      <span className="flex h-[68px] w-[60px] flex-none flex-col items-center justify-center rounded-[18px]" style={{ background: dateTint[index % dateTint.length] }}>
        <span className="text-[12px] font-medium">{dayMonth(appt.date).split(' ')[1]}</span>
        <span className="text-[24px] font-semibold leading-none">{dayPadded(appt.date)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-[15px] font-semibold">{appt.title}</span>
        <span className="truncate text-[13px] text-text-caption">
          {dow(appt.date)} · {appt.time}
          {doctor ? ` · ${doctor.name}` : ''}
        </span>
        <span className="mt-[3px] flex flex-wrap gap-1.5">
          <Tag style={{ background: `${forTone}66` }}>{forLabel(data, appt.patientId)}</Tag>
          <Tag tone={tag.tone}>{tag.label}</Tag>
        </span>
      </span>
      <Icon name="forward" />
    </Link>
  );
}

/* ---------- Doctors & clinics ---------- */

export function DoctorCard({ doctor, data, clinicId }: { doctor: Doctor; data: PortalData; clinicId?: string }) {
  useAvailabilityVersion();
  const cid = clinicId ?? doctor.clinics[0].clinicId;
  const clinic = clinicById(data, cid);
  const next = nextAvailable(doctor, cid, data.appointments);
  const today = next && relativeDay(next.date) === 'Today';
  return (
    <Link to={`/doctors/${doctor.id}`} className="card flex flex-col gap-3 p-4">
      <span className="flex items-center gap-3">
        <Avatar initials={doctor.initials} color={doctor.color} size={52} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] font-semibold">{doctor.name}</span>
          <span className="text-[13px] text-text-caption">
            {[doctor.qualifications.split(' (')[0], doctor.years > 0 ? `${doctor.years} yrs` : ''].filter(Boolean).join(' · ') || doctor.speciality}
          </span>
          {clinic && (
            <span className="truncate text-[13px] text-text-caption">
              {clinic.name}
              {clinic.distanceKm >= 0 && ` · ${clinic.distanceKm} km`}
            </span>
          )}
        </span>
        <span className="text-[15px] font-semibold">{rupees(doctor.fee)}</span>
      </span>
      {today ? (
        <span className="flex items-center gap-2">
          {next.times.slice(0, 3).map((t, i) => (
            <span key={t} className={`rounded-full px-3 py-2 text-[13px] font-medium ${i === 0 ? 'bg-ink text-surface' : 'bg-tint'}`}>
              {i === 0 ? `Next: ${t}` : t}
            </span>
          ))}
          {next.times.length > 3 && <span className="ml-auto text-[13px] font-medium">+{next.times.length - 3}</span>}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-[13px] text-text-caption">
          <Icon name="calendar" size={16} />
          {next ? `No slots today · next on ${relativeDay(next.date)}` : 'No slots in the next two weeks'}
        </span>
      )}
    </Link>
  );
}

export function ClinicCard({ clinic, extraTag }: { clinic: Clinic; extraTag?: string }) {
  return (
    <Link to={`/clinics/${clinic.id}`} className="card flex items-center gap-3.5 p-3.5">
      <ClinicMark initials={clinic.initials} gradient={clinic.gradient} size={64} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[16px] font-semibold">{clinic.name}</span>
        <span className="text-[13px] text-text-caption">
          {[clinic.area, clinic.distanceKm >= 0 ? `${clinic.distanceKm} km` : '', `${clinic.doctorCount} doctors`].filter(Boolean).join(' · ')}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-1.5">
          <Tag tone="ok" className="text-[12px] font-medium">
            Open now
          </Tag>
          {(extraTag ? [extraTag] : clinic.tags).map((t) => (
            <Tag key={t} className="text-[12px] font-medium">
              {t}
            </Tag>
          ))}
        </span>
      </span>
      <Icon name="forward" />
    </Link>
  );
}

/* ---------- Date & slot pickers ---------- */

export function DayPicker({ days, value, onChange, wrap, tintOnDesktop }: { days: DayOption[]; value: string; onChange: (d: string) => void; wrap?: boolean; tintOnDesktop?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Date" className={wrap ? 'flex flex-wrap gap-2' : 'scroller'}>
      {days.map((d) => {
        const on = d.date === value;
        return (
          <button
            key={d.date}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!d.open}
            aria-label={d.open ? undefined : `${dow(d.date)} ${dayNum(d.date)}, no slots`}
            onClick={() => onChange(d.date)}
            className={`flex h-20 w-[58px] flex-none flex-col items-center justify-center gap-1 rounded-[22px] ${
              on ? 'bg-ink text-surface' : d.open ? `bg-surface ${tintOnDesktop ? 'desktop:bg-tint' : ''}` : 'border border-divider bg-surface/40 text-text-faint'
            }`}
          >
            <span className="text-[12px] font-medium">{dow(d.date)}</span>
            <span className={`text-[20px] font-semibold ${d.open ? '' : 'line-through'}`}>{dayNum(d.date)}</span>
            <span className={`h-[5px] w-[5px] rounded-full ${on ? 'bg-rx' : d.open ? 'bg-flower' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}

export function SlotGrid({
  groups,
  value,
  onChange,
  current,
  tintOnDesktop,
}: {
  groups: SlotGroup[];
  tintOnDesktop?: boolean;
  value: string;
  onChange: (t: string) => void;
  /** The appointment's existing time when rescheduling. */
  current?: string;
}) {
  return (
    <>
      {groups.map((g) => {
        const open = g.slots.filter((s) => !s.booked).length;
        return (
          <div key={g.name}>
            <div className="mt-[22px] flex items-baseline justify-between">
              <h3 className="h2">{g.name}</h3>
              <span className="text-[13px] text-text-muted">
                {open} of {g.slots.length} open
              </span>
            </div>
            <div role="radiogroup" aria-label={`${g.name} times`} className="mt-3 grid grid-cols-3 gap-2 tablet:grid-cols-[repeat(auto-fill,minmax(104px,1fr))]">
              {g.slots.map((s) => {
                const on = s.time === value;
                const isCurrent = s.time === current;
                return (
                  <button
                    key={s.time}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={s.booked && !isCurrent}
                    aria-label={s.booked && !isCurrent ? `${s.time} unavailable` : isCurrent ? `${s.time}, your current time` : undefined}
                    onClick={() => onChange(s.time)}
                    className={`h-[46px] rounded-full text-[14px] font-medium ${
                      on
                        ? 'bg-ink text-surface'
                        : isCurrent
                          ? 'bg-wash-rose shadow-[inset_0_0_0_1.5px_#EE2B2B]'
                          : s.booked
                            ? 'border-[1.5px] border-dashed border-slotline text-text-faint line-through'
                            : `border border-white bg-surface ${tintOnDesktop ? 'desktop:border-tint desktop:bg-tint' : ''}`
                    }`}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function SlotLegend() {
  return (
    <div className="mt-4 flex gap-4 text-[12px] text-text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full border border-knob bg-surface" />
        Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full bg-ink" />
        Selected
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-dashed border-[#CBB9B5]" />
        Booked
      </span>
    </div>
  );
}

/* ---------- Records timeline ---------- */

export function TimelineItem({ rec, data }: { rec: HealthRecord; data: PortalData }) {
  const clinic = clinicById(data, rec.clinicId);
  const t = recordTypes[rec.type];
  return (
    <Link to={rec.to} className="flex items-stretch gap-3">
      <span className="flex w-11 flex-none flex-col items-center gap-1 pt-3.5">
        <span className="text-[18px] font-semibold leading-none">{dayPadded(rec.date)}</span>
        <span className="text-[11px] text-text-caption">{dow(rec.date)}</span>
        <span className="mt-1 w-0.5 flex-1 rounded-full" style={{ background: clinic?.color }} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 rounded-[22px] border border-white bg-surface/90 px-4 py-3.5 shadow-card">
        <span className="flex items-center gap-1.5">
          <Tag style={{ background: t.bg }}>{t.label}</Tag>
          <span className="h-2 w-2 flex-none rounded-full" style={{ background: clinic?.color }} />
          <span className="truncate text-[12px] text-text-caption">{clinic?.name}</span>
        </span>
        <span className="mt-0.5 text-[16px] font-semibold">{rec.title}</span>
        <span className="text-[13px] text-text-muted">{rec.who}</span>
      </span>
    </Link>
  );
}
