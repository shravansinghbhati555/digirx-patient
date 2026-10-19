import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { DayPicker, SlotGrid, SlotLegend } from '../../components/domain';
import { Flower } from '../../components/ui/Art';
import { Chip } from '../../components/ui/Bits';
import { ArrowButton, BackButton, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, BarSummary, Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { TODAY } from '../../data/mock';
import { bookingDays, openSlots, useSlots } from '../../lib/availability';
import { addDays, daysFromToday, longDate, monthYear, rupees, shortDate } from '../../lib/format';
import { bookablePeople, clinicById, doctorById, patientLabel } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';

const WEEKS = 3;

export function SelectSlot() {
  const { data, state, actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const draft = state.draft;
  const doctor = doctorById(data, draft?.doctorId);
  const [week, setWeek] = useState(() =>
    draft ? Math.max(0, Math.min(WEEKS - 1, Math.floor(daysFromToday(draft.date) / 7))) : 0,
  );

  const days = useMemo(
    () => (doctor && draft ? bookingDays(doctor, draft.clinicId, addDays(TODAY, week * 7), 7) : []),
    [doctor, draft, week],
  );
  const slots = useSlots(doctor, draft?.clinicId, draft?.date ?? TODAY, undefined, data.appointments);
  const groups = slots.groups;

  // Keep the selected time valid when the date or clinic changes.
  useEffect(() => {
    if (!draft || slots.loading) return;
    const open = openSlots(groups);
    if (draft.time && !open.includes(draft.time)) actions.patchDraft({ time: '' });
  }, [groups, draft, actions, slots.loading]);

  if (!draft || !doctor) return <Navigate to="/discover" replace />;
  const clinic = clinicById(data, draft.clinicId)!;
  const who = bookablePeople(data);
  const ready = !!draft.time;

  const pickDay = (date: string) => actions.patchDraft({ date, time: '' });
  const summary = ready ? `${shortDate(draft.date)} · ${draft.time}` : 'Pick a time';
  const forName = who.find((p) => p.id === draft.patientId)?.label ?? 'Me';

  const confirmNow = async () => {
    setBusy(true);
    const { appt, error } = await actions.confirmBooking();
    setBusy(false);
    if (appt) navigate(`/book/confirmed/${appt.id}`, { replace: true });
    else if (error) toast({ message: error, tone: 'info' });
  };

  const picker = (
    <>
      <h2 className="h2 mt-6 desktop:mt-0">Who is this visit for?</h2>
      <div className="scroller mt-3 desktop:mr-0 desktop:flex-wrap desktop:pr-0">
        {who.map((p) => {
          const on = p.id === draft.patientId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              disabled={!p.allowed}
              aria-label={p.allowed ? undefined : `${p.firstName}, booking not permitted`}
              onClick={() => actions.patchDraft({ patientId: p.id })}
              className={`flex h-12 flex-none items-center gap-2 rounded-full pl-1.5 pr-4 text-[14px] font-medium ${
                on ? 'bg-ink text-surface' : p.allowed ? 'bg-surface desktop:bg-tint' : 'bg-surface/45 text-text-nav'
              }`}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-ink"
                style={{ background: p.allowed ? p.color : '#EDE3EA' }}
              >
                {p.initials}
              </span>
              {p.label}
              {!p.allowed && <Icon name="lock" size={15} />}
            </button>
          );
        })}
      </div>
      <span className="mt-2 text-[12px] text-text-muted">
        Only family who allow you to book for them appear here. <Link to="/family" className="underline">Manage family</Link>
      </span>

      {doctor.clinics.length > 1 && (
        <>
          <h2 className="h2 mt-6">Where</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.clinics.map((dc) => {
              const c = clinicById(data, dc.clinicId)!;
              return (
                <Chip
                  key={c.id}
                  size="md"
                  surface="solid"
                  on={c.id === draft.clinicId}
                  onClick={() => actions.patchDraft({ clinicId: c.id, time: '' })}
                >
                  {c.name}
                </Chip>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="h2">{monthYear(days[0]?.date ?? TODAY)}</h2>
        <span className="flex gap-1.5">
          <IconButton icon="back" label="Previous week" size={36} disabled={week === 0} onClick={() => setWeek(week - 1)} className="disabled:opacity-40" />
          <IconButton icon="forward" label="Next week" size={36} disabled={week >= WEEKS - 1} onClick={() => setWeek(week + 1)} className="disabled:opacity-40" />
        </span>
      </div>
      <div className="mt-3">
        <DayPicker days={days} value={draft.date} onChange={pickDay} tintOnDesktop />
      </div>

      {slots.loading ? (
        <p className="m-0 mt-6 rounded-[20px] bg-surface/70 p-4 text-[14px] text-text-muted">Checking the doctor's diary…</p>
      ) : slots.error ? (
        <p className="m-0 mt-6 rounded-[20px] bg-surface/70 p-4 text-[14px] text-text-muted">{slots.error}</p>
      ) : groups.length ? (
        <SlotGrid groups={groups} value={draft.time} onChange={(time) => actions.patchDraft({ time })} tintOnDesktop />
      ) : (
        <p className="m-0 mt-6 rounded-[20px] bg-surface/70 p-4 text-[14px] text-text-muted">
          {doctor.name} isn't at {clinic.short} on this day. Pick a date with a pink dot.
        </p>
      )}
      <SlotLegend />
    </>
  );

  return (
    <Screen width="wide">
      {/* Phone / tablet header */}
      <div className="flex items-center justify-between desktop:hidden">
        <BackButton fallback={`/doctors/${doctor.id}`} />
        <span className="text-[13px] font-medium">Step 1 of 2</span>
        <span className="w-11" />
      </div>
      <div className="desktop:hidden">
        <h1 className="m-0 mt-5 text-[29px] font-semibold leading-[1.14] tracking-[-0.025em]">Book with {doctor.name}</h1>
        <span className="mt-1.5 block text-[14px] text-text-muted">
          {clinic.name} · {rupees(doctor.fee)} · {doctor.durationMin} min
        </span>
      </div>

      {/* Desktop header */}
      <nav aria-label="Breadcrumb" className="hidden flex-wrap items-center gap-2 text-[14px] text-text-muted desktop:flex">
        <Link to="/discover" className="text-text-muted">
          Find care
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/doctors/${doctor.id}`} className="text-text-muted">
          {doctor.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink">Book</span>
      </nav>
      <h1 className="m-0 mt-5 hidden text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.05] tracking-[-0.035em] desktop:block">Pick a time that works</h1>

      <div className="desktop:mt-5 desktop:flex desktop:items-start desktop:gap-5">
        <section className="card hidden flex-[1_1_240px] flex-col items-start gap-2.5 !rounded-[28px] p-[22px] desktop:flex">
          <span className="relative h-[110px] w-[110px]">
            <Flower size={110} className="absolute inset-0" />
            <span className="absolute left-6 top-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border-[3px] border-surface text-[20px] font-semibold" style={{ background: doctor.color }}>
              {doctor.initials}
            </span>
          </span>
          <span className="text-[22px] font-semibold tracking-[-0.02em]">{doctor.name}</span>
          <span className="text-[14px] text-text-muted">
            {doctor.speciality}
            {doctor.years > 0 && ` · ${doctor.years} yrs`}
          </span>
          <span className="text-[14px] text-text-muted">
            {clinic.name}, {clinic.area}
          </span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {[rupees(doctor.fee), `${doctor.durationMin} min`, 'In clinic'].map((t) => (
              <span key={t} className="rounded-full bg-tint px-2.5 py-[5px] text-[12px] font-medium">
                {t}
              </span>
            ))}
          </span>
        </section>

        <section className="flex min-w-0 flex-col desktop:card desktop:flex-[2.4_1_420px] desktop:!rounded-[28px] desktop:p-6">{picker}</section>

        <section className="card hidden flex-[1.2_1_280px] flex-col overflow-hidden !rounded-[28px] desktop:sticky desktop:top-6 desktop:flex">
          <div className="flex flex-col gap-1 bg-hero p-[22px]">
            <span className="text-[13px] font-medium">Your booking</span>
            <span className="mt-2.5 text-[15px] font-medium">{longDate(draft.date)}</span>
            <span className="text-[36px] font-semibold tracking-[-0.03em]">{draft.time || '—'}</span>
          </div>
          <div className="flex flex-col px-[22px] pb-[22px] pt-2">
            {[
              ['Patient', patientLabel(data, draft.patientId)],
              ['Doctor', doctor.name],
              ['Clinic', `${clinic.short}, ${clinic.area}`],
              ['Fee', doctor.fee > 0 ? `${rupees(doctor.fee)} · pay at clinic` : 'Pay at clinic'],
            ].map(([k, v]) => (
              <div key={k} className="row justify-between !py-[11px] text-[14px]">
                <span className="text-text-caption">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            <ArrowButton wide glyph="check" className="mt-3 !h-14 !text-[15px]" disabled={!ready || busy} onClick={confirmNow}>
              Confirm booking
            </ArrowButton>
            <Link to="/book/review" className={`mt-3 text-center text-[13px] font-medium underline ${ready ? '' : 'pointer-events-none opacity-50'}`}>
              Add a reason, share records or pay online
            </Link>
            <span className="mt-2.5 text-center text-[12px] text-text-muted">Free cancellation up to 2 hours before</span>
          </div>
        </section>
      </div>

      <ActionBar className="desktop:hidden">
        <BarSummary label={`For ${forName}`} value={summary} />
        <ArrowButton onClick={() => navigate('/book/review')} disabled={!ready}>
          Continue
        </ArrowButton>
      </ActionBar>
    </Screen>
  );
}
