import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TimelineItem } from '../../components/domain';
import { Chip, Note, Tag } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { NoResults } from '../../components/ui/States';
import { TODAY } from '../../lib/today';
import { addDays, dayPadded, dow, fullDate, monthYear, rupeesCompact } from '../../lib/format';
import { clinicById, recordTypes } from '../../lib/selectors';
import { downloadText } from '../../lib/share';
import { usePortalData } from '../../state/portal';
import type { HealthRecord, PortalData, RecordType } from '../../types';

type Range = '3m' | '12m' | 'all';
const rangeLabel: Record<Range, string> = { '3m': 'Last 3 months', '12m': 'Last 12 months', all: 'All time' };
const TYPES = Object.keys(recordTypes) as RecordType[];

/** Empty selection means "everything". */
function toggleIn<T>(sel: T[], all: T[], v: T): T[] {
  const current = sel.length ? sel : all;
  const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
  return next.length === all.length ? [] : next;
}
const isOn = <T,>(sel: T[], v: T) => !sel.length || sel.includes(v);

function groupByMonth(list: HealthRecord[]) {
  const out: { month: string; items: HealthRecord[] }[] = [];
  for (const r of list) {
    const m = monthYear(r.date);
    const g = out.find((x) => x.month === m);
    if (g) g.items.push(r);
    else out.push({ month: m, items: [r] });
  }
  return out;
}

export function MedicalHistory() {
  const { data } = usePortalData();
  const [types, setTypes] = useState<RecordType[]>([]);
  const [clinics, setClinics] = useState<string[]>([]);
  const [range, setRange] = useState<Range>('12m');
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const clinicIds = data.clinics.map((c) => c.id);

  const records = useMemo(() => {
    const from = range === '3m' ? addDays(TODAY, -90) : range === '12m' ? addDays(TODAY, -365) : '0000';
    const needle = q.trim().toLowerCase();
    return [...data.records]
      .filter(
        (r) =>
          isOn(types, r.type) &&
          isOn(clinics, r.clinicId) &&
          r.date >= from &&
          (!needle || `${r.title} ${r.who} ${clinicById(data, r.clinicId)?.name}`.toLowerCase().includes(needle)),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data, types, clinics, range, q]);

  const sel = records.find((r) => r.id === selected) ?? records[0];
  const paid = data.invoices.filter((i) => i.status === 'paid' && i.date.startsWith(TODAY.slice(0, 4))).reduce((s, i) => s + i.amount, 0);
  const reset = () => {
    setTypes([]);
    setClinics([]);
    setRange('all');
    setQ('');
  };

  const stats = [
    { to: '/records', n: String(data.records.length), label: 'Records', on: true },
    { to: '/reports', n: String(data.reports.length), label: 'Reports' },
    { to: '/prescriptions', n: String(data.prescriptions.length), label: 'Rx' },
    { to: '/billing', n: rupeesCompact(paid), label: 'Billing' },
  ];

  return (
    <Screen width="wide">
      {/* ---------- Phone & tablet ---------- */}
      <div className="flex flex-col desktop:hidden tablet:mx-auto tablet:w-full tablet:max-w-[720px]">
        <div className="flex items-center justify-between">
          <h1 className="h1">Health records</h1>
          <IconButton icon={searching ? 'close' : 'search'} label={searching ? 'Close search' : 'Search records'} onClick={() => { setSearching(!searching); setQ(''); }} />
        </div>
        <span className="mt-1.5 text-[14px] text-text-muted">All your DigiRx visits in one timeline · {data.patient.firstName}</span>

        {searching && (
          <label className="mt-3.5 flex h-[52px] items-center gap-2 rounded-full border-2 border-ink bg-surface px-3.5">
            <Icon name="search" size={20} />
            <span className="sr-only">Search records</span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Test, doctor or clinic" className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium outline-none" />
          </label>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              aria-current={s.on ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-input px-1.5 py-3 ${s.on ? 'bg-ink text-surface' : 'bg-surface/90'}`}
            >
              <span className="text-[18px] font-semibold">{s.n}</span>
              <span className="text-[11px]">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-3.5">
          <Note to="/privacy">
            <strong className="font-semibold">Only you see this combined view.</strong> Each clinic sees just its own records unless you share more.{' '}
            <span className="font-medium underline">Manage sharing</span>
          </Note>
        </div>

        <div className="scroller mt-4" role="group" aria-label="Record type">
          <Chip on={!types.length} onClick={() => setTypes([])}>
            All
          </Chip>
          {TYPES.map((t) => (
            <Chip key={t} on={types.length === 1 && types[0] === t} onClick={() => setTypes([t])}>
              {recordTypes[t].plural}
            </Chip>
          ))}
        </div>
        <div className="scroller mt-2" role="group" aria-label="Clinic">
          <Chip on={!clinics.length} onClick={() => setClinics([])}>
            <span className={`h-2.5 w-2.5 rounded-full ${clinics.length ? 'bg-ink' : 'bg-surface'}`} />
            All clinics
          </Chip>
          {data.clinics.map((c) => (
            <Chip key={c.id} on={clinics.length === 1 && clinics[0] === c.id} onClick={() => setClinics([c.id])}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              {c.short}
            </Chip>
          ))}
        </div>
        <label className="mt-2.5 flex items-center gap-1.5 self-start text-[13px] font-medium">
          <Icon name="calendar" size={16} />
          <span className="sr-only">Date range</span>
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="cursor-pointer appearance-none border-0 bg-transparent font-medium outline-none">
            {(Object.keys(rangeLabel) as Range[]).map((r) => (
              <option key={r} value={r}>
                {rangeLabel[r]}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={14} />
        </label>

        {records.length === 0 && (
          <div className="mt-5">
            <NoResults title="No records match these filters" hint="Try a wider date range or another clinic" onClear={reset} />
          </div>
        )}
        {groupByMonth(records).map((g) => (
          <section key={g.month}>
            <h2 className="section-label mb-2.5 mt-5">{g.month}</h2>
            <div className="flex flex-col gap-2.5">
              {g.items.map((r) => (
                <TimelineItem key={r.id} rec={r} data={data} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ---------- Desktop: filters · timeline · preview ---------- */}
      <div className="hidden flex-col gap-5 desktop:flex">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.05] tracking-[-0.035em]">Health records</h1>
            <span className="text-[15px] text-text-muted">Every DigiRx visit, report and prescription in one timeline</span>
          </div>
          <div className="max-w-[420px]">
            <Note to="/privacy">
              <strong className="font-semibold">Only you see this combined view.</strong> Each clinic sees its own records unless you share more.
            </Note>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <section aria-label="Filters" className="card flex-[1_1_220px] !rounded-[28px] px-5 pb-5 pt-1.5">
            <label className="mt-4 flex h-11 items-center gap-2 rounded-full bg-tint px-3.5">
              <Icon name="search" size={18} />
              <span className="sr-only">Search records</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none" />
            </label>
            <FilterGroup title="Clinics">
              {data.clinics.map((c) => (
                <Check key={c.id} on={isOn(clinics, c.id)} onChange={() => setClinics(toggleIn(clinics, clinicIds, c.id))}>
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: c.color }} />
                  {c.name}
                </Check>
              ))}
            </FilterGroup>
            <FilterGroup title="Record type">
              {TYPES.map((t) => (
                <Check key={t} on={isOn(types, t)} onChange={() => setTypes(toggleIn(types, TYPES, t))}>
                  {recordTypes[t].plural}
                </Check>
              ))}
            </FilterGroup>
            <FilterGroup title="Date range">
              <div className="flex flex-wrap gap-1.5">
                {(['3m', '12m', 'all'] as Range[]).map((r) => (
                  <Chip key={r} surface="tint" on={range === r} onClick={() => setRange(r)}>
                    {r === 'all' ? 'All' : r === '3m' ? '3 months' : '12 months'}
                  </Chip>
                ))}
              </div>
            </FilterGroup>
          </section>

          <section aria-label="Timeline" className="flex min-w-0 flex-[2_1_380px] flex-col gap-2">
            {records.length === 0 && <NoResults title="No records match" hint="Widen the filters on the left" onClear={reset} />}
            {groupByMonth(records).map((g) => (
              <div key={g.month} className="flex flex-col gap-2">
                <h2 className="section-label mb-0.5 mt-2.5">{g.month}</h2>
                {g.items.map((r) => {
                  const on = sel?.id === r.id;
                  const c = clinicById(data, r.clinicId);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected(r.id)}
                      className={`flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3.5 text-left ${on ? 'bg-ink text-surface' : 'bg-surface/90 shadow-card'}`}
                    >
                      <span className="flex w-[46px] flex-none flex-col items-center">
                        <span className="text-[20px] font-semibold leading-none">{dayPadded(r.date)}</span>
                        <span className="text-[11px] opacity-75">{dow(r.date)}</span>
                      </span>
                      <span className="w-[3px] self-stretch rounded-full" style={{ background: c?.color }} />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <Tag style={{ background: recordTypes[r.type].bg, color: '#181818' }}>{recordTypes[r.type].label}</Tag>
                          <span className="truncate text-[12px] opacity-75">{c?.name}</span>
                        </span>
                        <span className="text-[16px] font-semibold">{r.title}</span>
                        <span className="text-[13px] opacity-75">{r.who}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </section>

          {sel && <Preview rec={sel} data={data} />}
        </div>
      </div>
    </Screen>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 mt-[18px] text-[13px] font-semibold text-text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({ on, onChange, children }: { on: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-2 text-[14px]">
      <input type="checkbox" checked={on} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-[7px] border-[1.8px] border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${on ? 'bg-ink text-surface' : ''}`}
      >
        {on && <Icon name="check" size={14} strokeWidth={2.6} />}
      </span>
      {children}
    </label>
  );
}

function Preview({ rec, data }: { rec: HealthRecord; data: PortalData }) {
  const c = clinicById(data, rec.clinicId);
  const t = recordTypes[rec.type];
  return (
    <section aria-label="Record preview" className="card sticky top-6 flex min-w-0 flex-[1.4_1_320px] flex-col gap-2.5 !rounded-[28px] p-6">
      <span className="flex items-center gap-2">
        <Tag style={{ background: t.bg }}>{t.label}</Tag>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c?.color }} />
        <span className="text-[13px] text-text-muted">{c?.name}</span>
      </span>
      <span className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{rec.title}</span>
      <span className="text-[14px] text-text-muted">
        {fullDate(rec.date)} · {rec.who}
      </span>
      <span className="my-2 h-px bg-divider" />
      <p className="m-0 text-[15px] leading-[1.55] text-text-body">{rec.summary}</p>
      <span className="mt-2.5 flex flex-wrap gap-2.5">
        <Button size="sm" to={rec.to}>
          Open full record
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon="download"
          onClick={() => downloadText(`${rec.title}.txt`, `${rec.title}\n${c?.name} · ${fullDate(rec.date)}\n${rec.who}\n\n${rec.summary}\n`)}
        >
          Download
        </Button>
      </span>
      <span className="mt-2 flex items-center gap-1.5 text-[12px] text-text-muted">
        <Icon name="lock" size={14} />
        Visible to you and {c?.name} only
      </span>
    </section>
  );
}
