import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Flower } from '../../components/ui/Art';
import { ClinicMark, Tag } from '../../components/ui/Bits';
import { ArrowButton, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { nextAvailable, useAvailabilityVersion } from '../../lib/availability';
import { relativeDay, rupees } from '../../lib/format';
import { clinicById, doctorById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';
import { useStartBooking } from './useStartBooking';

export function DoctorProfile() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data } = usePortalData();
  useAvailabilityVersion();
  const toast = useToast();
  const startBooking = useStartBooking();
  const [saved, setSaved] = useState(false);
  const doctor = doctorById(data, id);
  console.log('Experience field:', doctor.years);
  console.log('Fee field:', doctor.fee);
  console.log('Languages field:', doctor.languages);

  console.log('All doctor fields:', Object.keys(doctor));
  console.log('Complete doctor data:', JSON.stringify(doctor, null, 2));
  if (!doctor) return <NotFound />;

  const clinicId = doctor.clinics.find((c) => c.clinicId === params.get('clinic'))?.clinicId ?? doctor.clinics[0].clinicId;
  const clinic = clinicById(data, clinicId)!;
  const next = nextAvailable(doctor, clinicId, data.appointments);
  const dayLabel = next ? relativeDay(next.date) : null;

  return (
    <Screen>
      <PageHeader
        title="Doctor"
        back="/discover"
        right={
          <IconButton
            icon="heart"
            label={saved ? 'Remove from saved doctors' : 'Save doctor'}
            aria-pressed={saved}
            className={saved ? 'text-flower' : ''}
            onClick={() => {
              setSaved(!saved);
              toast({ message: saved ? 'Removed from saved doctors' : `${doctor.name} saved`, tone: 'info' });
            }}
          />
        }
      />

      <div className="mt-[22px] flex items-center gap-[18px]">
        <span className="relative h-[120px] w-[120px] flex-none">
          <Flower size={120} className="absolute inset-0 -rotate-[10deg]" />
          <span
            className="absolute left-[26px] top-[26px] flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-surface text-[22px] font-semibold"
            style={{ background: doctor.color }}
            aria-hidden="true"
          >
            {doctor.initials}
          </span>
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[26px] font-semibold leading-[1.1] tracking-[-0.025em]">{doctor.name}</h1>
          <span className="text-[14px] text-text-muted">{doctor.speciality}</span>
          <span className="text-[13px] text-text-muted">{doctor.qualifications}</span>
          {doctor.seenBefore && (
            <Tag tone="ink" className="mt-1 self-start text-[12px]">
              You've seen {doctor.pronoun}
            </Tag>
          )}
        </div>
      </div>

      <div className="mt-[22px] grid grid-cols-3 gap-2">
        {[
          ['Experience', doctor.years > 0 ? String(doctor.years) : '—', 'Years'],
          ['Fee', rupees(doctor.fee), 'In clinic'],
          ['Languages', String(doctor.languages.length), doctor.languages.join(' · ')],
        ].map(([k, v, u]) => (
          <div key={k} className="card flex flex-col gap-0.5 !rounded-[20px] p-3.5">
            <span className="text-[12px] text-text-caption">{k}</span>
            <span className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">{v}</span>
            <span className="text-[12px] font-medium">{u}</span>
          </div>
        ))}
      </div>

      <h2 className="h2-lg mt-[26px]">About</h2>
      <p className="m-0 mt-2.5 text-[15px] leading-[1.55] text-text-body">{doctor.about}</p>

      <h2 className="h2-lg mt-[26px]">Consults at</h2>
      <div className="card mt-3 px-4 py-1">
        {doctor.clinics.map((dc) => {
          const c = clinicById(data, dc.clinicId)!;
          return (
            <Link key={c.id} to={`/clinics/${c.id}`} className="row">
              <ClinicMark initials={c.initials} gradient={c.gradient} size={44} />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{c.name}</span>
                <span className="text-[13px] text-text-caption">{dc.schedule}</span>
              </span>
              <Icon name="forward" />
            </Link>
          );
        })}
      </div>

      {next && (
        <>
          <div className="mt-[26px] flex items-center justify-between">
            <h2 className="h2-lg">
              {dayLabel} at {clinic.short}
            </h2>
            <button type="button" className="text-[14px] font-medium" onClick={() => startBooking(doctor.id, { clinicId })}>
              All dates
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {next.times.slice(0, 6).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => startBooking(doctor.id, { clinicId, date: next.date, time: t })}
                className="rounded-full border border-white bg-surface px-4 py-3 text-[14px] font-medium"
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      <ActionBar>
        <ArrowButton wide onClick={() => startBooking(doctor.id, { clinicId })}>
          Book appointment
        </ArrowButton>
      </ActionBar>
    </Screen>
  );
}
