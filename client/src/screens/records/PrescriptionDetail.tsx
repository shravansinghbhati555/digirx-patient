import { useParams } from 'react-router-dom';
import { Avatar } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { fullDate, plural } from '../../lib/format';
import { clinicById, doctorById } from '../../lib/selectors';
import { shareOrCopy } from '../../lib/share';
import { prescriptionPdfUrl } from '../../services/api';
import { openSignedFile } from '../../lib/files';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';

const SLOTS = ['Morning', 'Afternoon', 'Night'];

export function PrescriptionDetail() {
  const { id } = useParams();
  const { data } = usePortalData();
  const toast = useToast();
  const rx = data.prescriptions.find((p) => p.id === id);
  if (!rx) return <NotFound />;
  const doctor = doctorById(data, rx.doctorId);
  const clinic = clinicById(data, rx.clinicId);

  const text = [
    `${rx.title} (${rx.id})`,
    `${doctor?.name}${doctor?.regNo ? `, Reg. ${doctor.regNo}` : ''} · ${clinic?.name}`,
    `Issued ${fullDate(rx.date)}${rx.validTill ? ` · valid till ${fullDate(rx.validTill)}` : ''}`,
    '',
    ...rx.medicines.map((m) => `• ${m.name} — ${m.form}; ${m.schedule.join('-')} (M-A-N); ${m.duration}; ${m.instructions}`),
    '',
    ...rx.advice.map((a) => `- ${a}`),
  ].join('\n');

  return (
    <Screen>
      <PageHeader
        title={<span className="text-[13px]">{rx.id}</span>}
        back="/prescriptions"
        right={
          <IconButton
            icon="download"
            label="Download prescription"
            onClick={() => openSignedFile(() => prescriptionPdfUrl(rx.id), (message) => toast({ message, tone: 'info' }))}
          />
        }
      />

      <h1 className="m-0 mt-5 text-[29px] font-semibold leading-[1.12] tracking-[-0.025em]">{rx.title}</h1>
      <span className="mt-1.5 text-[14px] text-text-muted">
        Issued {fullDate(rx.date)}
        {rx.validTill ? ` · Valid till ${fullDate(rx.validTill).replace(/ \d{4}$/, '')}` : ''}
      </span>
      {doctor && (
        <div className="card mt-3.5 flex items-center gap-3 px-4 py-3.5">
          <Avatar initials={doctor.initials} color={doctor.color} size={42} textSize={13} />
          <span className="flex flex-1 flex-col">
            <span className="text-[15px] font-semibold">{doctor.name}</span>
            <span className="text-[12px] text-text-caption">
              {doctor.qualifications.split(' (')[0]}
              {doctor.regNo ? ` · Reg. ${doctor.regNo}` : ''} · {clinic?.name}
            </span>
          </span>
        </div>
      )}

      <div className="mt-[22px] flex items-baseline justify-between">
        <h2 className="h2">Medicines</h2>
        <span className="text-[13px] text-text-muted">{plural(rx.medicines.length, 'item')}</span>
      </div>
      {rx.medicines.map((m) => (
        <div key={m.name} className="card mt-2.5 flex flex-col gap-3 p-4">
          <span className="flex items-start justify-between gap-2.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-[17px] font-semibold">{m.name}</span>
              <span className="text-[13px] text-text-caption">{m.form}</span>
            </span>
            <span className="whitespace-nowrap rounded-full bg-wash-pink px-2.5 py-[5px] text-[12px] font-medium">{m.duration}</span>
          </span>
          <span className="flex gap-1.5" aria-label={`Dose: ${m.schedule.map((n, i) => `${n} ${SLOTS[i].toLowerCase()}`).join(', ')}`}>
            {m.schedule.map((n, i) => (
              <span key={SLOTS[i]} className={`flex flex-1 flex-col items-center gap-0.5 rounded-[14px] px-1 py-2 text-[11px] font-medium ${n ? 'bg-ink text-surface' : 'bg-tint text-text-nav'}`}>
                <b className="text-[15px] font-semibold">{n}</b>
                {SLOTS[i]}
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-text-body">
            <Icon name="clock" size={16} />
            {m.instructions}
          </span>
        </div>
      ))}

      {rx.advice.length > 0 && (
        <>
          <h2 className="h2 mt-[22px]">Advice</h2>
          <ul className="m-0 mt-2.5 rounded-[20px] bg-surface/75 py-3.5 pl-[34px] pr-4 text-[14px] leading-[1.6] text-text-body">
            {rx.advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <ActionBar>
        <Button variant="secondary" block icon="bell" size="md" onClick={() => toast({ message: 'Reminders set for each dose' })}>
          Set reminders
        </Button>
        <Button block icon="share" size="md" onClick={() => shareOrCopy(`Prescription ${rx.id}`, toast, text)}>
          Share with pharmacy
        </Button>
      </ActionBar>
    </Screen>
  );
}
