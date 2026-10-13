import { Navigate, useNavigate } from 'react-router-dom';
import { Toggle } from '../../components/ui/Bits';
import { ArrowButton, BackButton } from '../../components/ui/Button';
import { ActionBar, BarSummary, Screen } from '../../components/ui/Layout';
import { dow, fullDate, rupees } from '../../lib/format';
import { clinicById, doctorById, patientLabel } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';

export function ReviewBooking() {
  const { data, state, actions } = usePortalData();
  const navigate = useNavigate();
  const draft = state.draft;
  const doctor = doctorById(data, draft?.doctorId);
  if (!draft || !doctor) return <Navigate to="/discover" replace />;
  if (!draft.time) return <Navigate to="/book" replace />;
  const clinic = clinicById(data, draft.clinicId)!;
  const otherClinics = [...new Set(data.records.map((r) => r.clinicId))]
    .filter((id) => id !== clinic.id)
    .map((id) => clinicById(data, id)?.short)
    .filter(Boolean);
  const lastName = doctor.name.split(' ').slice(-1)[0];

  const confirm = () => {
    const appt = actions.confirmBooking();
    if (appt) navigate(`/book/confirmed/${appt.id}`, { replace: true });
  };

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <BackButton fallback="/book" />
        <span className="text-[13px] font-medium">Step 2 of 2</span>
        <span className="w-11" />
      </div>
      <h1 className="m-0 mt-5 text-[29px] font-semibold leading-[1.14] tracking-[-0.025em]">Review your booking</h1>

      <div className="card mt-[18px] overflow-hidden">
        <div className="flex items-end justify-between bg-hero p-[18px]">
          <span className="flex flex-col gap-1">
            <span className="text-[13px] font-medium">
              {dow(draft.date)}, {fullDate(draft.date)}
            </span>
            <span className="text-[30px] font-semibold tracking-[-0.02em]">{draft.time}</span>
          </span>
          <span className="rounded-full bg-surface/70 px-3 py-1.5 text-[13px] font-semibold">{doctor.durationMin} min · In clinic</span>
        </div>
        <div className="px-[18px] py-1">
          {[
            ['Patient', patientLabel(data, draft.patientId)],
            ['Doctor', doctor.name],
            ['Clinic', `${clinic.name}, ${clinic.area}`],
          ].map(([k, v]) => (
            <div key={k} className="row justify-between text-[14px]">
              <span className="text-text-caption">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <label htmlFor="reason" className="h2 mt-[22px] block">
        Reason for visit <span className="text-[13px] font-normal text-text-muted">(optional)</span>
      </label>
      <textarea
        id="reason"
        rows={2}
        value={draft.reason}
        onChange={(e) => actions.patchDraft({ reason: e.target.value })}
        placeholder="e.g. Fever and sore throat for 3 days"
        className="mt-2.5 w-full resize-none rounded-input border border-white bg-surface px-4 py-3.5 text-[15px] outline-none focus:border-2 focus:border-ink"
      />

      {otherClinics.length > 0 && (
        <div className="card mt-3.5 flex items-start gap-3 p-4">
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-[15px] font-semibold">Share past records with this clinic</span>
            <span className="text-[13px] leading-[1.45] text-text-muted">
              Lets Dr. {lastName} see your visits at {otherClinics.join(' and ')} for this appointment. Off unless you turn it on.
            </span>
          </span>
          <Toggle on={draft.shareRecords} onChange={(v) => actions.patchDraft({ shareRecords: v })} label="Share past records" />
        </div>
      )}

      <h2 className="h2 mt-[22px]" id="pay-l">
        Payment
      </h2>
      <div role="radiogroup" aria-labelledby="pay-l" className="mt-2.5 flex gap-2">
        {(
          [
            ['clinic', 'Pay at clinic', 'Cash, card or UPI'],
            ['online', 'Pay now', 'UPI or card'],
          ] as const
        ).map(([v, t, s]) => {
          const on = draft.payment === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => actions.patchDraft({ payment: v })}
              className={`flex flex-1 flex-col gap-1 rounded-[20px] p-3.5 text-left ${on ? 'bg-ink text-surface' : 'border border-white bg-surface'}`}
            >
              <span className="text-[15px] font-semibold">{t}</span>
              <span className={`text-[12px] ${on ? 'opacity-80' : 'text-text-muted'}`}>{s}</span>
            </button>
          );
        })}
      </div>
      <span className="mt-3 text-[12px] leading-[1.45] text-text-muted">Free cancellation up to 2 hours before. Clinic policy applies after that.</span>

      <ActionBar>
        <BarSummary label="Consultation fee" value={rupees(doctor.fee)} large />
        <ArrowButton glyph="check" onClick={confirm}>
          {draft.payment === 'online' ? `Pay ${rupees(doctor.fee)}` : 'Confirm booking'}
        </ArrowButton>
      </ActionBar>
    </Screen>
  );
}
