import { Link, useParams } from 'react-router-dom';
import { Avatar, IconTile } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { PageHeader, Screen } from '../../components/ui/Layout';
import { dow, fullDate, rupees } from '../../lib/format';
import { clinicById, doctorById } from '../../lib/selectors';
import { downloadText } from '../../lib/share';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';
import { useStartBooking } from '../booking/useStartBooking';

export function VisitDetail() {
  const { id } = useParams();
  const { data } = usePortalData();
  const startBooking = useStartBooking();
  const visit = data.visits.find((v) => v.id === id);
  if (!visit) return <NotFound />;
  const clinic = clinicById(data, visit.clinicId)!;
  const doctor = doctorById(data, visit.doctorId);
  const rx = data.prescriptions.find((p) => p.id === visit.prescriptionId);
  const report = data.reports.find((r) => r.id === visit.reportId);
  const invoice = data.invoices.find((i) => i.id === visit.invoiceId);
  const shared = data.privacy.clinicSharing;
  const sharedWith = data.clinics.filter((c) => c.id !== clinic.id && shared[c.id]).map((c) => c.short);

  const download = () =>
    downloadText(
      `Visit summary - ${visit.title}.txt`,
      [
        visit.title,
        `${clinic.name} · ${fullDate(visit.date)} ${visit.time}`,
        doctor ? `${doctor.name}, ${doctor.speciality}` : '',
        '',
        visit.vitals ? `Vitals: ${visit.vitals.map((v) => `${v.label} ${v.value} ${v.unit}`).join(', ')}` : '',
        visit.diagnosis ? `Diagnosis: ${visit.diagnosis}` : '',
        `Notes: ${visit.notes}`,
        visit.followUp ? `Follow-up: ${visit.followUp}` : '',
      ]
        .filter((l) => l !== undefined)
        .join('\n'),
    );

  return (
    <Screen>
      <PageHeader
        back="/records"
        title={
          <span className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold" style={{ background: `${clinic.color}55` }}>
            <span className="h-2 w-2 rounded-full" style={{ background: clinic.color }} />
            {clinic.name}
          </span>
        }
        right={<IconButton icon="download" label="Download visit summary" onClick={download} />}
      />

      <span className="mt-[22px] text-[13px] font-medium text-text-muted">
        {dow(visit.date)}, {fullDate(visit.date)} · {visit.time} · {visit.mode}
      </span>
      <h1 className="m-0 mt-1.5 text-[29px] font-semibold leading-[1.12] tracking-[-0.025em]">{visit.title}</h1>
      {doctor && (
        <Link to={`/doctors/${doctor.id}`} className="mt-3.5 flex items-center gap-2.5 self-start">
          <Avatar initials={doctor.initials} color={doctor.color} size={38} textSize={13} />
          <span className="flex flex-col">
            <span className="text-[15px] font-medium">{doctor.name}</span>
            <span className="text-[12px] text-text-caption">{doctor.speciality}</span>
          </span>
        </Link>
      )}

      {visit.vitals && (
        <>
          <h2 className="h2 mt-[22px]">Vitals</h2>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {visit.vitals.map((v) => (
              <div key={v.label} className="card flex flex-col gap-0.5 !rounded-input p-3">
                <span className="text-[11px] text-text-caption">{v.label}</span>
                <span className="mt-1 text-[19px] font-semibold tracking-[-0.01em]">{v.value}</span>
                <span className="text-[11px] font-medium">{v.unit}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card mt-3.5 flex flex-col gap-3 p-4">
        {visit.diagnosis && (
          <div>
            <span className="text-[12px] font-semibold uppercase text-text-caption">Diagnosis</span>
            <p className="m-0 mt-1 text-[16px] font-semibold">{visit.diagnosis}</p>
          </div>
        )}
        <div>
          <span className="text-[12px] font-semibold uppercase text-text-caption">Doctor's notes</span>
          <p className="m-0 mt-1 text-[14px] leading-[1.55] text-text-body">{visit.notes}</p>
        </div>
      </div>

      {(rx || report || invoice) && (
        <>
          <h2 className="h2 mt-[22px]">From this visit</h2>
          <div className="card mt-2.5 px-4 py-1">
            {rx && (
              <Link to={`/prescriptions/${rx.id}`} className="row">
                <IconTile icon="pill" bg="#FFE6D8" />
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-medium">Prescription · {rx.medicines.length} medicines</span>
                  <span className="text-[12px] text-text-caption">{rx.id}</span>
                </span>
                <Icon name="forward" />
              </Link>
            )}
            {report && (
              <Link to={`/reports/${report.id}`} className="row">
                <IconTile icon="flask" bg="#FFE0F2" />
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-medium">Lab order · {report.shortName ?? report.title}</span>
                  <span className="text-[12px] text-text-caption">Result ready · {fullDate(report.date).replace(/ \d{4}$/, '')}</span>
                </span>
                <Icon name="forward" />
              </Link>
            )}
            {invoice && (
              <Link to={`/billing/${invoice.id}`} className="row">
                <IconTile icon="receipt" bg="#ECE3FF" />
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-medium">Invoice · {rupees(invoice.amount)}</span>
                  <span className={`text-[12px] font-medium ${invoice.status === 'due' ? 'text-warn-fg' : 'text-ok-fg'}`}>
                    {invoice.status === 'due' ? 'Due' : invoice.status === 'refunded' ? 'Refunded' : 'Paid'}
                  </span>
                </span>
                <Icon name="forward" />
              </Link>
            )}
          </div>
        </>
      )}

      {visit.followUp && doctor && (
        <div className="mt-3.5 flex items-center gap-3 rounded-card bg-hero p-4">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[12px] font-medium">Follow-up advised</span>
            <span className="text-[17px] font-semibold">{visit.followUp}</span>
          </span>
          <Button size="sm" onClick={() => startBooking(doctor.id, { clinicId: clinic.id })}>
            Book
          </Button>
        </div>
      )}

      <Link to="/privacy" className="mt-3.5 flex items-start gap-2 text-[12px] leading-[1.45] text-text-muted">
        <Icon name="lock" size={16} className="mt-px" />
        <span>
          Visible to you and {clinic.name}
          {sharedWith.length ? `, plus ${sharedWith.join(' and ')} (you shared)` : ' only'}.{' '}
          <span className="font-medium text-ink underline">Share with another clinic</span>
        </span>
      </Link>
    </Screen>
  );
}
