import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { SlotGrid } from '../../components/domain';
import { ArrowButton, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { TODAY } from '../../data/mock';
import { openSlots, slotsFor, worksOn } from '../../lib/availability';
import { addDays, dayNum, dow, minutesToTime, monthYear, relativeDay, shortDate, timeToMinutes, toDate } from '../../lib/format';
import { doctorById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Reschedule() {
  const { id } = useParams();
  const { data, actions } = usePortalData();
  const navigate = useNavigate();
  const appt = data.appointments.find((a) => a.id === id);
  const doctor = doctorById(data, appt?.doctorId);
  const [date, setDate] = useState(appt?.date ?? TODAY);
  const [time, setTime] = useState('');
  const [offset, setOffset] = useState(0);

  // Two weeks starting on the Sunday of this week (shifted by `offset` weeks).
  const weekStart = addDays(TODAY, -toDate(TODAY).getDay() + offset * 7);
  const cells = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const groups = useMemo(
    () => (appt && doctor ? slotsFor(doctor, appt.clinicId, date, data.appointments, appt.id) : []),
    [appt, doctor, date, data.appointments],
  );

  if (!appt) return <NotFound />;
  if (!doctor || (appt.status !== 'confirmed' && appt.status !== 'pending')) return <Navigate to={`/appointments/${appt.id}`} replace />;

  const hasSlots = (d: string) =>
    d >= TODAY && worksOn(doctor, appt.clinicId, d) && openSlots(slotsFor(doctor, appt.clinicId, d, data.appointments, appt.id)).length > 0;

  const changed = !!time && !(date === appt.date && time === appt.time);
  const evening = groups.find((g) => g.slots.some((s) => s.time === time))?.name;

  const confirm = () => {
    actions.reschedule(appt.id, date, time);
    const remind = minutesToTime(Math.max(timeToMinutes(time) - 60, 0));
    navigate('/done', {
      replace: true,
      state: {
        title: 'Appointment moved',
        body: `${doctor.name} · ${shortDate(date)} at ${time}. The clinic has been told.`,
        primary: { label: 'View appointment', to: `/appointments/${appt.id}` },
        toast: `Reminder set for ${remind}, ${relativeDay(date)}`,
      },
    });
  };

  return (
    <Screen>
      <PageHeader title="Reschedule" back={`/appointments/${appt.id}`} />

      <div className="mt-5 flex items-center gap-2.5">
        <span className="flex flex-1 flex-col rounded-input bg-surface/60 px-3.5 py-3">
          <span className="text-[11px] text-text-caption">Current</span>
          <span className="text-[14px] font-medium line-through">
            {dow(appt.date)} {dayNum(appt.date)} · {appt.time}
          </span>
        </span>
        <Icon name="arrow" />
        <span className={`flex flex-1 flex-col rounded-input px-3.5 py-3 ${changed ? 'bg-ink text-surface' : 'bg-surface/60'}`}>
          <span className={`text-[11px] ${changed ? 'opacity-75' : 'text-text-caption'}`}>New</span>
          <span className="text-[14px] font-semibold">{changed ? `${dow(date)} ${dayNum(date)} · ${time}` : 'Pick a time'}</span>
        </span>
      </div>

      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-semibold">{monthYear(cells[0])}</span>
          <span className="flex gap-1.5">
            <IconButton icon="back" label="Earlier weeks" tone="tint" size={34} disabled={offset === 0} className="!rounded-[11px] disabled:opacity-40" onClick={() => setOffset(offset - 1)} />
            <IconButton icon="forward" label="Later weeks" tone="tint" size={34} disabled={offset >= 3} className="!rounded-[11px] disabled:opacity-40" onClick={() => setOffset(offset + 1)} />
          </span>
        </div>
        <div className="mt-3.5 grid grid-cols-7 gap-1" role="grid" aria-label="Choose a date">
          {WD.map((w) => (
            <span key={w} className="text-center text-[12px] font-medium text-text-caption">
              {w}
            </span>
          ))}
          {cells.map((d) => {
            const open = hasSlots(d);
            const sel = d === date;
            const cur = d === appt.date;
            const label = `${shortDate(d)}${cur ? ', current booking' : ''}${open ? '' : ', no slots'}`;
            return (
              <button
                key={d}
                type="button"
                disabled={!open && !cur}
                aria-pressed={sel}
                aria-label={label}
                onClick={() => {
                  setDate(d);
                  setTime('');
                }}
                className={`flex h-[42px] items-center justify-center rounded-btn text-[15px] font-medium ${
                  sel ? 'bg-ink font-semibold text-surface' : open ? 'bg-wash-rose' : 'text-[#A99AA6] line-through'
                } ${cur && !sel ? 'shadow-[inset_0_0_0_1.5px_#F0679F]' : ''}`}
              >
                {dayNum(d)}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3.5 text-[12px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] border border-[#F3D3E4] bg-wash-rose" />
            Has slots
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] shadow-[inset_0_0_0_1.5px_#F0679F]" />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-ink" />
            Selected
          </span>
        </div>
      </div>

      <h2 className="h2 mt-[22px]">
        {shortDate(date)}
        {evening ? ` · ${evening}` : ''}
      </h2>
      {groups.length ? (
        <SlotGrid groups={groups} value={time} onChange={setTime} current={date === appt.date ? appt.time : undefined} />
      ) : (
        <p className="m-0 mt-3 text-[14px] text-text-muted">No slots on this day.</p>
      )}

      <ActionBar>
        <ArrowButton wide glyph="check" disabled={!changed} onClick={confirm}>
          Confirm new time
        </ArrowButton>
      </ActionBar>
    </Screen>
  );
}
