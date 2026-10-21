import { useParams } from 'react-router-dom';
import { BackButton, Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { fullDate } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { shareOrCopy } from '../../lib/share';
import { reportUrl } from '../../services/api';
import { openSignedFile } from '../../lib/files';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';

export function ReportPreview() {
  const { id } = useParams();
  const { data } = usePortalData();
  const toast = useToast();
  const r = data.reports.find((x) => x.id === id);
  if (!r) return <NotFound />;
  const clinic = clinicById(data, r.clinicId);
  const p = data.patient;
  const flagged = r.results?.filter((x) => x.flag) ?? [];

  const download = () => openSignedFile(() => reportUrl(r.id), (message) => toast({ message, tone: 'info' }));

  return (
    <Screen>
      <div className="flex items-center gap-3">
        <BackButton fallback="/reports" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-semibold">{r.title}</span>
          <span className="truncate text-[12px] text-text-caption">
            {clinic?.name ?? 'Uploaded by you'} · {fullDate(r.date)}
          </span>
        </span>
      </div>

      {flagged.length > 0 && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-input bg-warn-bg px-3.5 py-3">
          <Icon name="alert" size={20} className="text-warn-fg" />
          <span className="text-[13px] leading-[1.45] text-[#5A3700]">
            <strong className="font-semibold">
              {flagged.length} value{flagged.length > 1 ? 's' : ''} outside range.
            </strong>{' '}
            {r.alert ?? 'Talk to your doctor at your next visit.'}
          </span>
        </div>
      )}

      {r.results ? (
        <div className="mt-3.5 flex flex-col gap-3 rounded-[20px] bg-white px-[18px] py-5 shadow-paper">
          <div className="flex items-start justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-[14px] font-bold">{clinic?.name}</span>
              <span className="text-[10px] text-text-caption">
                {clinic?.area}, Bengaluru{clinic?.tags.includes('NABL lab') ? ' · NABL lab' : ''}
              </span>
            </span>
            <span className="text-right text-[10px] text-text-caption">
              Sample: {r.sampledAt}
              <br />
              Report: {r.reportedAt}
            </span>
          </div>
          <div className="flex justify-between rounded-[10px] bg-[#F8F3F6] px-2.5 py-2 text-[11px]">
            <span>
              {p.name} · {p.gender[0]} · {p.age} y
            </span>
            <span>ID {r.labId}</span>
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Test', 'Result', 'Range'].map((h) => (
                  <th key={h} className="border-b border-[#EADCE4] px-1 py-1.5 text-left text-[11px] font-semibold text-text-caption">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.results.map((x) => (
                <tr key={x.test} className="border-b border-[#F4ECF0] last:border-0">
                  <td className="px-1 py-2">{x.test}</td>
                  <td className="px-1 py-2 font-semibold">
                    {x.result}{' '}
                    {x.flag && <span className="rounded-full bg-bad-bg px-1.5 py-0.5 text-[10px] font-bold text-bad-fg">{x.flag}</span>}
                  </td>
                  <td className="px-1 py-2">{x.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.verifiedBy && <span className="text-[10px] text-text-caption">Electronically verified · {r.verifiedBy}</span>}
        </div>
      ) : (
        <div className="mt-3.5 flex h-[420px] flex-col items-center justify-center gap-3 rounded-[20px] bg-white text-center shadow-paper" style={{ background: r.category === 'imaging' ? '#1F1B24' : undefined }}>
          <Icon name="file" size={40} className={r.category === 'imaging' ? 'text-[#8F8499]' : 'text-text-faint'} />
          <span className={`text-[13px] ${r.category === 'imaging' ? 'text-[#C9BFD0]' : 'text-text-muted'}`}>[Document preview — rendered from the stored file]</span>
        </div>
      )}
      <span className="mt-3 self-center rounded-full bg-surface/75 px-3 py-[5px] text-[12px] font-medium">Page 1 of {r.pages}</span>

      <ActionBar>
        <Button variant="secondary" block icon="share" onClick={() => shareOrCopy(r.title, toast)}>
          Share
        </Button>
        <Button block icon="download" onClick={download}>
          Download
        </Button>
      </ActionBar>
    </Screen>
  );
}
