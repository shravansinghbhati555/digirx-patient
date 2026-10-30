import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { statusTag } from '../../components/domain';
import { Face, faces } from '../../components/ui/Art';
import { Avatar, ClinicMark, Tag } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { Sheet, useToast } from '../../components/ui/Overlay';
import { appointmentIcs } from '../../lib/calendar';
import { daysFromToday, longDate, minutesToTime, rupees, shortDate, timeToMinutes } from '../../lib/format';
import { clinicById, doctorById, patientLabel, person } from '../../lib/selectors';
import { downloadText, shareOrCopy } from '../../lib/share';
import { usePortalData } from '../../state/portal';
import type { Appointment } from '../../types';
import { NotFound } from '../system/NotFound';

function minutesUntil(a: Appointment) {
  if (a.startAt) return Math.round((Date.parse(a.startAt) - Date.now()) / 60000);
  const now = new Date();
  return daysFromToday(a.date) * 1440 + timeToMinutes(a.time) - (now.getHours() * 60 + now.getMinutes());
}

function untilLabel(a: Appointment) {
  const m = minutesUntil(a);
  if (m < 60) return `in ${Math.max(m, 1)} min`;
  if (m < 48 * 60) return `in ${Math.round(m / 60)} hours`;
  return `in ${Math.round(m / 1440)} days`;
}

function freeCancelUntil(a: Appointment, leadHours: number) {
  const cutoff = timeToMinutes(a.time) - leadHours * 60;
  const days = daysFromToday(a.date);
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `on ${shortDate(a.date)}`;
  return `${minutesToTime(Math.max(cutoff, 0))} ${when}`;
}

const REASONS = ['Feeling better', 'Schedule clash', 'Booked another doctor', 'Other reason'];

export function AppointmentDetail() {
  const { id } = useParams();
  const { data, actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(1);

  const appt = data.appointments.find((a) => a.id === id);
  if (!appt) return <NotFound />;
  const doctor = doctorById(data, appt.doctorId);
  const clinic = clinicById(data, appt.clinicId);
  const who = person(data, appt.patientId);
  const tag = statusTag(appt);
  const active = appt.status === 'confirmed' || appt.status === 'pending';
  const lead = clinic?.cancellationLeadTimeHours ?? 2;
  const leadLabel = `${lead} hour${lead === 1 ? '' : 's'}`;
  const free = minutesUntil(appt) > lead * 60;
  const mapsUrl = clinic ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}`)}` : '#';

  const doCancel = async () => {
    const res = await actions.cancelAppointment(appt.id, REASONS[reason]);
    setCancelOpen(false);
    if (!res.ok) {
      toast({ message: res.error, tone: 'info' });
      return;
    }
    navigate('/done', {
      replace: true,
      state: {
        title: 'Appointment cancelled',
        body: `${doctor?.name ?? clinic?.name} · ${shortDate(appt.date)} at ${appt.time}. The clinic has been told.${free ? ' No charge.' : ''}`,
        primary: { label: 'Book another visit', to: '/discover' },
        face: 'calm',
      },
    });
  };

  return (
    <Screen>
      <PageHeader
        title="Appointment"
        back="/appointments"
        right={<IconButton icon="share" label="Share appointment" onClick={() => shareOrCopy(appt.title, toast)} />}
      />

      <div className="relative mt-5 flex flex-col gap-1 overflow-hidden rounded-[28px] bg-hero p-5">
        <Tag tone="surface" className="self-start text-[12px]">
          {tag.label}
          {active ? ` · ${untilLabel(appt)}` : ''}
        </Tag>
        <span className="mt-3.5 text-[14px] font-medium">{longDate(appt.date)}</span>
        <span className="text-[38px] font-semibold leading-[1.05] tracking-[-0.03em]">{appt.time}</span>
        <span className="text-[14px]">
          {appt.title} · {appt.durationMin} min
        </span>
        <span className="mt-3.5 flex items-center justify-between rounded-[16px] bg-surface/75 px-3.5 py-2.5">
          <span className="text-[13px]">Show at reception</span>
          <span className="text-[17px] font-bold tracking-[0.04em]">{appt.code}</span>
        </span>
      </div>

      <div className="card mt-3.5 px-4 py-1">
        <div className="row">
          <Avatar initials={who?.initials ?? '?'} color={who?.color ?? '#F7EFEE'} size={42} textSize={13} />
          <span className="flex flex-1 flex-col">
            <span className="text-[12px] text-text-caption">Patient</span>
            <span className="text-[15px] font-medium">{patientLabel(data, appt.patientId)}</span>
          </span>
        </div>
        {doctor && (
          <Link to={`/doctors/${doctor.id}`} className="row">
            <Avatar initials={doctor.initials} color={doctor.color} size={42} textSize={13} />
            <span className="flex flex-1 flex-col">
              <span className="text-[12px] text-text-caption">Doctor</span>
              <span className="text-[15px] font-medium">
                {doctor.name} · {doctor.speciality}
              </span>
            </span>
            <Icon name="forward" />
          </Link>
        )}
        {clinic && (
          <Link to={`/clinics/${clinic.id}`} className="row">
            <ClinicMark initials={clinic.initials} gradient={clinic.gradient} size={42} />
            <span className="flex flex-1 flex-col">
              <span className="text-[12px] text-text-caption">Clinic</span>
              <span className="text-[15px] font-medium">
                {clinic.name}, {clinic.area}
              </span>
            </span>
            <Icon name="forward" />
          </Link>
        )}
      </div>

      {clinic && (
        <div className="mt-3 flex gap-2">
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white bg-surface text-[14px] font-medium">
            <Icon name="pin" size={18} />
            Directions
          </a>
          <a href={`tel:${clinic.phone.replace(/\s/g, '')}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white bg-surface text-[14px] font-medium">
            <Icon name="phone" size={18} />
            Call clinic
          </a>
        </div>
      )}

      {active && (
        <>
          <h2 className="h2 mt-[22px]">Before you go</h2>
          <div className="card mt-2.5 px-4 py-2">
            {['Arrive 10 minutes early', 'Bring a photo ID and current medicines'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 py-2 text-[14px]">
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-ink text-surface">
                  <Icon name="check" size={14} strokeWidth={2.6} />
                </span>
                {t}
              </div>
            ))}
            <div className="flex items-center gap-2.5 py-2 text-[14px]">
              <span className="h-[22px] w-[22px] flex-none rounded-[7px] bg-divider" />
              Fee {rupees(appt.fee)} · {appt.payment === 'online' ? 'paid online' : 'pay at clinic'}
            </div>
          </div>
          {appt.reason && <p className="m-0 mt-3 text-[13px] text-text-muted">Reason you gave: {appt.reason}</p>}

          <span className="mt-[18px] flex items-start gap-2 text-[13px] leading-[1.45] text-text-muted">
            <Icon name="clock" size={18} />
            {free ? `You can reschedule or cancel free until ${freeCancelUntil(appt, lead)}.` : `Within ${leadLabel} of your visit, please call the clinic to change it.`}
          </span>

          <button
            type="button"
            className="mt-3 self-start text-[13px] font-medium underline"
            onClick={() => downloadText(`${appt.code}.ics`, appointmentIcs(appt, doctor, clinic), 'text/calendar')}
          >
            Add to calendar
          </button>

          <ActionBar>
            <Button variant="dangerSoft" onClick={() => setCancelOpen(true)}>
              Cancel
            </Button>
            <Button block icon="refresh" to={`/appointments/${appt.id}/reschedule`}>
              Reschedule
            </Button>
          </ActionBar>
        </>
      )}

      {!active && appt.outcomeNote && <p className="m-0 mt-5 text-[14px] text-text-muted">{appt.outcomeNote}</p>}
      {!active && (
        <div className="mt-5 flex flex-wrap gap-2">
          {appt.visitId && (
            <Button size="sm" to={`/records/visits/${appt.visitId}`}>
              Visit summary
            </Button>
          )}
          {appt.reportId && (
            <Button size="sm" to={`/reports/${appt.reportId}`}>
              View report
            </Button>
          )}
          <Button size="sm" variant="light" to={doctor ? `/doctors/${doctor.id}?clinic=${appt.clinicId}` : `/clinics/${appt.clinicId}`}>
            Book again
          </Button>
        </div>
      )}

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this appointment?"
        hideTitle
        footer={
          <div className="flex w-full flex-col items-center gap-3.5">
            <div className="flex w-full gap-2.5">
              <Button variant="secondary" block onClick={() => setCancelOpen(false)}>
                Keep it
              </Button>
              <Button variant="danger" block onClick={doCancel}>
                Yes, cancel
              </Button>
            </div>
            <Link to={`/appointments/${appt.id}/reschedule`} className="text-[14px] font-medium underline">
              Reschedule instead
            </Link>
          </div>
        }
      >
        <Face size={64} spec={faces.sad} rotate={-6} className="mt-[18px]" />
        <h2 className="m-0 mt-3.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">Cancel this appointment?</h2>
        <span className="mt-1.5 block text-[14px] text-text-muted">
          {doctor?.name ?? clinic?.name} · {shortDate(appt.date)} · {appt.time}
        </span>

        <span className="mb-2 mt-[18px] block text-[14px] font-semibold" id="reason-l">
          Tell the clinic why (optional)
        </span>
        <div role="radiogroup" aria-labelledby="reason-l" className="flex flex-col gap-1.5">
          {REASONS.map((r, i) => {
            const on = reason === i;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setReason(i)}
                className={`flex w-full items-center gap-3 rounded-input px-4 py-3.5 text-left text-[15px] font-medium ${on ? 'bg-wash-rose shadow-[inset_0_0_0_2px_#181818]' : 'bg-tint'}`}
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 border-ink">
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                </span>
                {r}
              </button>
            );
          })}
        </div>

        <div className={`mb-3 mt-3.5 flex items-center gap-2 rounded-[16px] px-3.5 py-3 text-[13px] font-medium ${free ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'}`}>
          <Icon name={free ? 'check' : 'alert'} size={18} />
          {free ? `No charge — more than ${leadLabel} before your visit.` : `Less than ${leadLabel} to go — please call the clinic.`}
        </div>
      </Sheet>
    </Screen>
  );
}
