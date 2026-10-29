import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClinicCard, DoctorCard } from '../../components/domain';
import { Chip, Segmented } from '../../components/ui/Bits';
import { BackButton, Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { Sheet } from '../../components/ui/Overlay';
import { NoResults } from '../../components/ui/States';
import { TODAY } from '../../lib/today';
import { nextAvailable, useAvailabilityVersion } from '../../lib/availability';
import { addDays, plural, rupees, timeToMinutes } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import type { Doctor, PortalData } from '../../types';

type When = 'any' | 'today' | 'tomorrow' | 'week';

interface Filters {
  when: When;
  clinics: string[];
  feeMax: number;
  nearby: boolean;
  mode: 'clinic' | 'video';
  languages: string[];
}

const FEE_CAP = 1000;
const defaults = (d: PortalData): Filters => ({
  when: 'any',
  clinics: d.clinics.map((c) => c.id),
  feeMax: FEE_CAP,
  nearby: false,
  mode: 'clinic',
  languages: [],
});

const LANGS: [string, string][] = [
  ['EN', 'English'],
  ['HI', 'Hindi'],
  ['KN', 'Kannada'],
  ['TA', 'Tamil'],
];

const whenLabel: Record<When, string> = { any: 'Any time', today: 'Today', tomorrow: 'Tomorrow', week: 'This week' };

function applyDoctors(d: PortalData, q: string, speciality: string | null, f: Filters) {
  const needle = q.trim().toLowerCase();
  const limit = f.when === 'today' ? TODAY : f.when === 'tomorrow' ? addDays(TODAY, 1) : f.when === 'week' ? addDays(TODAY, 6) : null;
  return d.doctors
    .map((doc) => {
      const cid = doc.clinics.find((c) => f.clinics.includes(c.clinicId))?.clinicId;
      return { doc, cid, next: cid ? nextAvailable(doc, cid, d.appointments) : null };
    })
    .filter(({ doc, cid, next }) => {
      if (!cid) return false;
      const clinic = clinicById(d, cid);
      if (speciality && doc.specialityId !== speciality) return false;
      if (needle && ![doc.name, doc.speciality, clinic?.name ?? ''].some((s) => s.toLowerCase().includes(needle))) return false;
      if (doc.fee > f.feeMax) return false;
      if (f.nearby && (clinic?.distanceKm ?? 99) > 5) return false;
      if (f.mode === 'video') return false; // No DigiRx clinic offers video consults yet.
      if (f.languages.length && !f.languages.some((l) => doc.languages.includes(l))) return false;
      if (limit && (!next || next.date > limit)) return false;
      return true;
    });
}

export function Search() {
  const { data } = usePortalData();
  const availability = useAvailabilityVersion();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const speciality = params.get('speciality');
  const tab = params.get('tab') === 'clinics' ? 'clinics' : 'doctors';
  const [filters, setFilters] = useState<Filters>(() => ({ ...defaults(data), when: (params.get('when') as When) ?? 'any' }));
  const [draft, setDraft] = useState<Filters>(filters);
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<'soonest' | 'fee'>('soonest');

  const doctors = useMemo(() => {
    const list = applyDoctors(data, q, speciality, filters);
    const key = (x: (typeof list)[number]) =>
      sort === 'fee' ? String(x.doc.fee).padStart(5, '0') : x.next ? `${x.next.date} ${String(timeToMinutes(x.next.times[0])).padStart(4, '0')}` : 'z';
    return list.sort((a, b) => key(a).localeCompare(key(b)));
  }, [data, q, speciality, filters, sort, availability]);

  const clinics = data.clinics.filter(
    (c) =>
      filters.clinics.includes(c.id) &&
      (!filters.nearby || c.distanceKm <= 5) &&
      (!q.trim() || `${c.name} ${c.area} ${c.services.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const clinicCount = new Set(doctors.map((x) => x.cid)).size;

  const base = defaults(data);
  const applied: { key: string; label: string; clear: (f: Filters) => Filters }[] = [];
  if (filters.when !== 'any') applied.push({ key: 'when', label: whenLabel[filters.when], clear: (f) => ({ ...f, when: 'any' }) });
  if (filters.nearby) applied.push({ key: 'near', label: 'Within 5 km', clear: (f) => ({ ...f, nearby: false }) });
  if (filters.feeMax < FEE_CAP) applied.push({ key: 'fee', label: `Up to ${rupees(filters.feeMax)}`, clear: (f) => ({ ...f, feeMax: FEE_CAP }) });
  if (filters.clinics.length < base.clinics.length) applied.push({ key: 'cl', label: plural(filters.clinics.length, 'clinic'), clear: (f) => ({ ...f, clinics: base.clinics }) });
  if (filters.languages.length) applied.push({ key: 'lang', label: filters.languages.join(', '), clear: (f) => ({ ...f, languages: [] }) });
  if (filters.mode === 'video') applied.push({ key: 'mode', label: 'Video', clear: (f) => ({ ...f, mode: 'clinic' }) });
  const specLabel = data.specialities.find((s) => s.id === speciality)?.label;

  const setTab = (t: 'doctors' | 'clinics') => {
    const next = new URLSearchParams(params);
    if (t === 'clinics') next.set('tab', 'clinics');
    else next.delete('tab');
    setParams(next, { replace: true });
  };

  const draftCount = applyDoctors(data, q, speciality, draft).length;

  return (
    <Screen width="medium">
      <div className="flex items-center gap-2.5">
        <BackButton fallback="/discover" />
        <label className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-ink bg-surface px-3.5">
          <Icon name="search" size={20} />
          <span className="sr-only">Search doctors, clinics or specialities</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Doctor, clinic or speciality"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium outline-none"
            autoFocus={!speciality}
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => setQ('')}>
              <Icon name="close" size={18} />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => {
            setDraft(filters);
            setOpen(true);
          }}
          aria-label={applied.length ? `Filters, ${applied.length} applied` : 'Filters'}
          className="relative flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-ink text-surface"
        >
          <Icon name="filters" />
          {applied.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[11px] font-bold text-ink">
              {applied.length}
            </span>
          )}
        </button>
      </div>

      <div className="mt-[18px]">
        <Segmented
          label="Result type"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'doctors', label: `Doctors · ${doctors.length}` },
            { value: 'clinics', label: `Clinics · ${clinics.length}` },
          ]}
        />
      </div>

      {(applied.length > 0 || specLabel) && (
        <div className="scroller mt-3.5">
          {specLabel && (
            <Chip
              on
              removable
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('speciality');
                setParams(next, { replace: true });
              }}
            >
              {specLabel}
            </Chip>
          )}
          {applied.map((a) => (
            <Chip key={a.key} on removable onClick={() => setFilters(a.clear(filters))}>
              {a.label}
            </Chip>
          ))}
        </div>
      )}

      {tab === 'doctors' ? (
        <>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[14px] text-text-muted">
              {plural(doctors.length, 'doctor')} across {plural(clinicCount, 'clinic')}
            </span>
            <label className="flex items-center gap-1 text-[14px] font-medium">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as 'soonest' | 'fee')} className="cursor-pointer appearance-none border-0 bg-transparent pr-1 text-right font-medium outline-none">
                <option value="soonest">Soonest first</option>
                <option value="fee">Lowest fee</option>
              </select>
              <Icon name="chevronDown" size={16} />
            </label>
          </div>
          <div className="mt-3 grid gap-3 tablet:grid-cols-2">
            {doctors.map(({ doc, cid }: { doc: Doctor; cid?: string }) => (
              <DoctorCard key={doc.id} doctor={doc} data={data} clinicId={cid} />
            ))}
          </div>
          {doctors.length === 0 && (
            <NoResults
              title={q ? `No doctors match "${q}"` : 'No doctors match these filters'}
              hint="Try another date or fewer filters"
              onClear={() => {
                setQ('');
                setFilters(base);
                setParams({}, { replace: true });
              }}
            />
          )}
        </>
      ) : (
        <div className="mt-5 grid gap-2.5 tablet:grid-cols-2">
          {clinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} />
          ))}
          {clinics.length === 0 && <NoResults title="No clinics match" hint="Try a different search" onClear={() => setQ('')} />}
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(base)}>
              Reset
            </Button>
            <Button
              block
              onClick={() => {
                setFilters(draft);
                setOpen(false);
              }}
            >
              Show {plural(draftCount, 'doctor')}
            </Button>
          </>
        }
      >
        <FilterBody data={data} draft={draft} setDraft={setDraft} />
      </Sheet>
    </Screen>
  );
}

function FilterBody({ data, draft, setDraft }: { data: PortalData; draft: Filters; setDraft: (f: Filters) => void }) {
  const toggleClinic = (id: string) =>
    setDraft({ ...draft, clinics: draft.clinics.includes(id) ? draft.clinics.filter((c) => c !== id) : [...draft.clinics, id] });
  const toggleLang = (l: string) =>
    setDraft({ ...draft, languages: draft.languages.includes(l) ? draft.languages.filter((x) => x !== l) : [...draft.languages, l] });
  const pct = ((draft.feeMax - 200) / (FEE_CAP - 200)) * 100;

  return (
    <div className="pb-4">
      <h3 className="mb-2.5 mt-[22px] text-[15px] font-semibold">Availability</h3>
      <div className="flex flex-wrap gap-2">
        {(['today', 'tomorrow', 'week', 'any'] as When[]).map((w) => (
          <Chip key={w} size="md" surface="tint" on={draft.when === w} onClick={() => setDraft({ ...draft, when: w })}>
            {whenLabel[w]}
          </Chip>
        ))}
      </div>

      <h3 className="mb-1 mt-[22px] text-[15px] font-semibold">DigiRx clinics</h3>
      <div>
        {[...data.clinics]
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map((c) => {
            const on = draft.clinics.includes(c.id);
            return (
              <label key={c.id} className="row cursor-pointer text-[15px]">
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggleClinic(c.id)} />
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-[1.8px] border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${on ? 'bg-ink text-surface' : ''}`}
                  aria-hidden="true"
                >
                  {on && <Icon name="check" size={16} strokeWidth={2.4} />}
                </span>
                <span className="flex-1">{c.name}</span>
                {c.distanceKm >= 0 && <span className="text-[13px] text-text-caption">{c.distanceKm} km</span>}
              </label>
            );
          })}
        <label className="row cursor-pointer text-[15px]">
          <input type="checkbox" className="peer sr-only" checked={draft.nearby} onChange={() => setDraft({ ...draft, nearby: !draft.nearby })} />
          <span
            className={`flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-[1.8px] border-ink peer-focus-visible:outline peer-focus-visible:outline-2 ${draft.nearby ? 'bg-ink text-surface' : ''}`}
            aria-hidden="true"
          >
            {draft.nearby && <Icon name="check" size={16} strokeWidth={2.4} />}
          </span>
          <span className="flex-1">Only within 5 km</span>
        </label>
      </div>

      <h3 className="mb-2.5 mt-[22px] flex justify-between text-[15px] font-semibold">
        <label htmlFor="fee">Consultation fee</label>
        <span className="font-medium">{draft.feeMax >= FEE_CAP ? 'Any' : `Up to ${rupees(draft.feeMax)}`}</span>
      </h3>
      <input
        id="fee"
        type="range"
        min={200}
        max={FEE_CAP}
        step={50}
        value={draft.feeMax}
        onChange={(e) => setDraft({ ...draft, feeMax: Number(e.target.value) })}
        className="fee-range w-full"
        style={{ background: `linear-gradient(90deg, #FFB690, #FFA7DC ${pct}%, #F1E6EC ${pct}%)` }}
      />

      <h3 className="mb-2.5 mt-[22px] text-[15px] font-semibold">Consultation type</h3>
      <div className="flex flex-wrap gap-2">
        <Chip size="md" surface="tint" on={draft.mode === 'clinic'} onClick={() => setDraft({ ...draft, mode: 'clinic' })}>
          In clinic
        </Chip>
        <Chip size="md" surface="tint" on={draft.mode === 'video'} onClick={() => setDraft({ ...draft, mode: 'video' })}>
          Video
        </Chip>
      </div>

      <h3 className="mb-2.5 mt-[22px] text-[15px] font-semibold">Doctor speaks</h3>
      <div className="flex flex-wrap gap-2">
        {LANGS.map(([code, name]) => (
          <Chip key={code} size="md" surface="tint" on={draft.languages.includes(code)} onClick={() => toggleLang(code)}>
            {name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
