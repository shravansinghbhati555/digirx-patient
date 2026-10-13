import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppointmentRow, statusTag } from '../../components/domain';
import { Avatar, Chip, Segmented, Tag } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { EmptyState } from '../../components/ui/States';
import { monthYear, relativeDay, shortDate, timeRange } from '../../lib/format';
import { cancelled, clinicById, doctorById, forLabel, past, people, upcoming } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import type { Appointment, PortalData } from '../../types';

type Tab = 'upcoming' | 'past' | 'cancelled';

function groupByMonth(list: Appointment[]) {
  const out: { month: string; items: Appointment[] }[] = [];
  for (const a of list) {
    const m = monthYear(a.date);
    const g = out.find((x) => x.month === m);
    if (g) g.items.push(a);
    else out.push({ month: m, items: [a] });
  }
  return out;
}

export function Appointments() {
  const { data } = usePortalData();
  const [params, setParams] = useSearchParams();
  const tab = (['past', 'cancelled'].includes(params.get('tab') ?? '') ? params.get('tab') : 'upcoming') as Tab;
  const [who, setWho] = useState('all');

  const setTab = (t: Tab) => setParams(t === 'upcoming' ? {} : { tab: t }, { replace: true });
  const all = upcoming(data);
  const list = all.filter((a) => who === 'all' || a.patientId === who);
  const [next, ...later] = list;
  const members = people(data).filter((p) => all.some((a) => a.patientId === p.id) || p.isMe);

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <h1 className="h1">Appointments</h1>
        <IconButton icon="plus" label="Book new appointment" to="/discover" tone="ink" round size={48} />
      </div>

      <div className="mt-[18px]">
        <Segmented
          label="Appointments"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: `Upcoming · ${all.length}` },
            { value: 'past', label: 'Past' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>

      {tab === 'upcoming' && (
        <>
          {all.length > 0 && (
            <div className="scroller mt-3.5" role="group" aria-label="Show appointments for">
              <Chip on={who === 'all'} onClick={() => setWho('all')}>
                Everyone
              </Chip>
              {members.map((p) => (
                <Chip key={p.id} on={who === p.id} onClick={() => setWho(p.id)}>
                  {p.isMe ? 'Me' : p.firstName}
                </Chip>
              ))}
            </div>
          )}

          {!next && (
            <EmptyState
              title="Nothing booked yet"
              body={who === 'all' ? "When you book a visit at any DigiRx clinic, it'll show up here." : 'No upcoming visits for this person.'}
              action={{ label: 'Find a doctor', to: '/discover' }}
            />
          )}

          {next && (
            <>
              <h2 className="section-label mb-2.5 mt-5">Next up</h2>
              <NextUp appt={next} data={data} />
            </>
          )}
          {later.length > 0 && (
            <>
              <h2 className="section-label mb-2.5 mt-[22px]">Later</h2>
              <div className="grid gap-2.5 tablet:grid-cols-2">
                {later.map((a, i) => (
                  <AppointmentRow key={a.id} appt={a} data={data} index={i} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'past' && <PastList list={past(data)} data={data} />}
      {tab === 'cancelled' && <PastList list={cancelled(data)} data={data} isCancelled />}
    </Screen>
  );
}

function NextUp({ appt, data }: { appt: Appointment; data: PortalData }) {
  const doctor = doctorById(data, appt.doctorId);
  const clinic = clinicById(data, appt.clinicId);
  const tag = statusTag(appt);
  return (
    <Link to={`/appointments/${appt.id}`} className="flex flex-col gap-1.5 rounded-card bg-hero p-[18px]">
      <span className="flex items-center justify-between">
        <span className="text-[13px] font-medium">
          {relativeDay(appt.date)} · {timeRange(appt.time, appt.durationMin)}
        </span>
        <Tag tone="surface">{tag.label}</Tag>
      </span>
      <span className="text-[23px] font-semibold tracking-[-0.02em]">{appt.title}</span>
      <span className="mt-2 flex items-center gap-2.5">
        {doctor && <Avatar initials={doctor.initials} color="#FDFCFB" size={38} />}
        <span className="flex flex-1 flex-col">
          <span className="text-[15px] font-medium">{doctor?.name ?? clinic?.name}</span>
          <span className="text-[12px]">
            {clinic?.name} · {forLabel(data, appt.patientId)}
          </span>
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface" aria-hidden="true">
          <Icon name="arrow" size={20} />
        </span>
      </span>
    </Link>
  );
}

function PastList({ list, data, isCancelled }: { list: Appointment[]; data: PortalData; isCancelled?: boolean }) {
  if (!list.length) {
    return <EmptyState title={isCancelled ? 'No cancellations' : 'No past visits yet'} body="Your visit history across DigiRx clinics will appear here." />;
  }
  return (
    <>
      {groupByMonth(list).map((g) => (
        <section key={g.month}>
          <h2 className="section-label mb-2.5 mt-[22px]">{g.month}</h2>
          <div className="grid gap-2.5 tablet:grid-cols-2">
            {g.items.map((a) => (
              <PastCard key={a.id} appt={a} data={data} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function PastCard({ appt, data }: { appt: Appointment; data: PortalData }) {
  const doctor = doctorById(data, appt.doctorId);
  const clinic = clinicById(data, appt.clinicId);
  const tag = statusTag(appt);
  const isCancelled = appt.status === 'cancelled';
  const sub = [doctor?.name, appt.patientId === data.patient.id ? clinic?.name : forLabel(data, appt.patientId)].filter(Boolean).join(' · ');
  const rebook = doctor ? `/doctors/${doctor.id}?clinic=${appt.clinicId}` : `/clinics/${appt.clinicId}`;

  return (
    <div className="card flex flex-col gap-2.5 p-4">
      <span className="flex items-center justify-between gap-2">
        <span className={`text-[13px] text-text-caption ${isCancelled ? 'line-through' : ''}`}>
          {shortDate(appt.date)} · {appt.time}
        </span>
        <Tag tone={tag.tone}>{tag.label}</Tag>
      </span>
      <Link to={`/appointments/${appt.id}`} className="flex items-center gap-3">
        <Avatar initials={doctor?.initials ?? clinic?.initials ?? '?'} color={doctor?.color ?? clinic?.color ?? '#F6EEF3'} size={42} textSize={13} />
        <span className="flex flex-1 flex-col">
          <span className="text-[16px] font-semibold">{appt.title}</span>
          <span className="text-[13px] text-text-caption">{sub || clinic?.name}</span>
        </span>
      </Link>
      {appt.outcomeNote && <span className="text-[13px] text-text-muted">{appt.outcomeNote}</span>}
      <span className="flex flex-wrap gap-2">
        {appt.visitId && (
          <Button size="xs" to={`/records/visits/${appt.visitId}`}>
            Visit summary
          </Button>
        )}
        {appt.reportId && (
          <Button size="xs" to={`/reports/${appt.reportId}`}>
            View report
          </Button>
        )}
        {appt.status !== 'cancelled' || appt.cancelledBy === 'you' ? (
          <Button size="xs" variant={appt.visitId || appt.reportId ? 'secondary' : isCancelled ? 'primary' : 'secondary'} to={rebook}>
            {appt.status === 'missed' ? 'Rebook' : 'Book again'}
          </Button>
        ) : null}
      </span>
    </div>
  );
}
