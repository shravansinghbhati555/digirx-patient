import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chip } from '../../components/ui/Bits';
import { BackButton, Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { NoResults } from '../../components/ui/States';
import { dayMonth } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import type { Report, ReportCategory } from '../../types';

const CATS: { id: ReportCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lab', label: 'Lab' },
  { id: 'imaging', label: 'Imaging' },
  { id: 'summary', label: 'Summaries' },
  { id: 'uploaded', label: 'Uploaded by me' },
];

const MAX_MB = 10;

function Thumb({ r, label }: { r: Report; label: string }) {
  if (r.category === 'imaging') {
    return (
      <span className="relative block h-[120px] overflow-hidden rounded-[16px]" style={{ background: r.thumb }}>
        <svg width="100%" height="120" viewBox="0 0 160 120" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="80" cy="64" rx="44" ry="50" fill="none" stroke="#6E6377" strokeWidth="3" />
          <path d="M80 20v90M50 50q30 12 60 0M50 72q30 12 60 0M54 92q26 10 52 0" fill="none" stroke="#8F8499" strokeWidth="2.5" />
        </svg>
      </span>
    );
  }
  const widths = [70, 90, 55, 80, 40].slice(0, r.category === 'uploaded' ? 3 : 5);
  return (
    <span className="relative flex h-[120px] flex-col gap-1.5 overflow-hidden rounded-[16px] px-3 py-3.5" style={{ background: r.thumb }}>
      {r.isNew && <span className="absolute right-2 top-2 rounded-full bg-ink px-[7px] py-[3px] text-[10px] font-bold text-surface">New</span>}
      <span className="text-[10px] font-bold uppercase">{label}</span>
      {widths.map((w, i) => (
        <span key={i} className="h-[5px] rounded-full bg-ink/20" style={{ width: `${w}%` }} />
      ))}
    </span>
  );
}

export function Reports() {
  const { data } = usePortalData();
  const toast = useToast();
  const [cat, setCat] = useState<ReportCategory | 'all'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const list = [...data.reports].filter((r) => cat === 'all' || r.category === cat).sort((a, b) => b.date.localeCompare(a.date));

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast({ message: `That file is over ${MAX_MB} MB. Try a smaller PDF or photo.`, tone: 'info' });
      return;
    }
    // Upload goes to the documents API (presigned PUT) once the server is wired.
    toast({ message: `${f.name} added to your reports` });
  };

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <BackButton fallback="/records" />
        <Button size="sm" icon="upload" onClick={() => fileRef.current?.click()}>
          Upload
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <h1 className="h1 mt-5">Reports &amp; documents</h1>

      <div className="scroller mt-4">
        {CATS.map((c) => (
          <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
            {c.id === 'all' ? ` · ${data.reports.length}` : ''}
          </Chip>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 tablet:grid-cols-3">
        {list.map((r) => {
          const clinic = clinicById(data, r.clinicId);
          return (
            <Link key={r.id} to={`/reports/${r.id}`} className="flex flex-col gap-2 rounded-[22px] border border-white bg-surface/90 p-2.5 shadow-card">
              <Thumb r={r} label={clinic ? clinic.short : 'Uploaded'} />
              <span className="px-1 text-[14px] font-semibold leading-[1.25]">{r.title}</span>
              <span className="px-1 pb-1 text-[12px] text-text-caption">
                {clinic ? clinic.short : 'You'} · {dayMonth(r.date)}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[186px] flex-col items-center justify-center gap-2.5 rounded-[22px] border-[1.5px] border-dashed border-[#C9B8C4] bg-surface/45 p-2.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-pink">
            <Icon name="plus" />
          </span>
          <span className="text-center text-[14px] font-semibold">Add a report</span>
          <span className="text-center text-[12px] text-text-muted">PDF or photo · up to {MAX_MB} MB</span>
        </button>
      </div>
      {list.length === 0 && (
        <div className="mt-4">
          <NoResults title="Nothing in this category yet" hint="Clinics add reports after your visit" onClear={() => setCat('all')} />
        </div>
      )}
    </Screen>
  );
}
