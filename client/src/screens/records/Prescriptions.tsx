import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconTile, Segmented, Tag } from '../../components/ui/Bits';
import { BackButton } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Layout';
import { EmptyState } from '../../components/ui/States';
import { dayMonth, fullDate, plural } from '../../lib/format';
import { clinicById, doctorById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';

export function Prescriptions() {
  const { data } = usePortalData();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const mine = data.prescriptions.filter((p) => p.patientId === data.patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const active = mine.filter((p) => p.active);
  const pastList = mine.filter((p) => !p.active);

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <BackButton fallback="/records" />
        <span className="rounded-full bg-surface/70 px-3 py-2 text-[13px] font-medium">For {data.patient.firstName}</span>
      </div>
      <h1 className="h1 mt-5">Prescriptions</h1>

      <div className="mt-4">
        <Segmented
          label="Prescriptions"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: `Active · ${active.length}` },
            { value: 'past', label: `Past · ${pastList.length}` },
          ]}
        />
      </div>

      {tab === 'active' && (
        <>
          {active.length === 0 && <EmptyState title="No active courses" body="Prescriptions from your DigiRx doctors will appear here." />}
          <div className="grid gap-3 tablet:grid-cols-2">
            {active.map((p) => {
              const doctor = doctorById(data, p.doctorId);
              const clinic = clinicById(data, p.clinicId);
              const [day, total] = p.dayOf ?? [0, 0];
              return (
                <Link key={p.id} to={`/prescriptions/${p.id}`} className="mt-4 flex flex-col gap-2.5 rounded-[26px] bg-hero p-[18px]">
                  <span className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                      {fullDate(p.date)} · {p.id}
                    </span>
                    <Tag tone="ink">Active</Tag>
                  </span>
                  <span className="text-[22px] font-semibold tracking-[-0.02em]">{p.title}</span>
                  <span className="text-[13px]">
                    {doctor?.name} · {clinic?.name}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {p.medicines.map((m) => (
                      <span key={m.name} className="rounded-full bg-surface/75 px-2.5 py-[5px] text-[12px] font-medium">
                        {m.name}
                      </span>
                    ))}
                  </span>
                  {total > 0 && (
                    <span className="mt-1 flex flex-col gap-1.5">
                      <span className="flex justify-between text-[12px] font-medium">
                        <span>
                          Day {day} of {total}
                        </span>
                        <span>{plural(total - day, 'day')} left</span>
                      </span>
                      <span
                        className="h-1.5 overflow-hidden rounded-full bg-surface/60"
                        role="progressbar"
                        aria-label="Course progress"
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-valuenow={day}
                      >
                        <span className="block h-full rounded-full bg-ink" style={{ width: `${(day / total) * 100}%` }} />
                      </span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <h2 className="section-label mb-2.5 mt-[22px]">{tab === 'active' ? 'Earlier' : 'All past prescriptions'}</h2>
      <div className="card px-4 py-1">
        {pastList.map((p) => {
          const doctor = doctorById(data, p.doctorId);
          const clinic = clinicById(data, p.clinicId);
          return (
            <Link key={p.id} to={`/prescriptions/${p.id}`} className="row">
              <IconTile icon="pill" bg={p.thumb} size={42} radius={14} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{p.title}</span>
                <span className="truncate text-[12px] text-text-caption">
                  {doctor?.name} · {clinic?.short} · {dayMonth(p.date)}
                </span>
              </span>
              <span className="text-[12px] text-text-muted">{plural(p.medicines.length, 'med')}</span>
            </Link>
          );
        })}
      </div>
    </Screen>
  );
}
