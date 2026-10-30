import { useState } from 'react';
import { Face, faces } from '../../components/ui/Art';
import { Button } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { PageHeader, Screen } from '../../components/ui/Layout';
import { NoResults } from '../../components/ui/States';
import { usePortalData } from '../../state/portal';

const TOPICS: { label: string; icon: IconName; bg: string; ink?: boolean; tag: string }[] = [
  { label: 'Bookings', icon: 'calendar', bg: '#181818', ink: true, tag: 'booking' },
  { label: 'Records & reports', icon: 'file', bg: '#FF8F8F', tag: 'records' },
  { label: 'Family access', icon: 'family', bg: '#C9B2FF', tag: 'family' },
  { label: 'Payments', icon: 'receipt', bg: '#FFC2A8', tag: 'payments' },
];

const FAQS: { q: string; a: string; tag: string }[] = [
  {
    q: 'Why can’t I see records from one clinic?',
    a: 'Clinics add records after your visit. Some take up to 48 hours. If a record is still missing, ask that clinic to link it to your number.',
    tag: 'records',
  },
  {
    q: 'Can my clinic see my other clinics’ records?',
    a: 'Only if you turn on sharing for that clinic in Privacy & security. By default each clinic sees just its own records.',
    tag: 'records',
  },
  {
    q: 'How do I book for my parent?',
    a: 'Link their account from Family. Once they allow booking, they’ll appear in “Who is this visit for?”.',
    tag: 'family',
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds for cancelled paid visits go back to the original payment method within 5–7 working days.',
    tag: 'payments',
  },
  {
    q: 'Can I cancel or move a booking?',
    a: 'Yes — open the appointment and choose Reschedule or Cancel. It’s free up to 2 hours before the visit.',
    tag: 'booking',
  },
];

export function Help() {
  const { data } = usePortalData();
  const [open, setOpen] = useState(0);
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  const list = FAQS.filter((f) => (!topic || f.tag === topic) && (!needle || `${f.q} ${f.a}`.toLowerCase().includes(needle)));
  const clinicPhone = data.clinics[0]?.phone.replace(/\s/g, '');

  return (
    <Screen className="relative">
      <Face size={120} spec={faces.smile} rotate={12} className="pointer-events-none absolute right-0 top-16 tablet:hidden" />
      <PageHeader back="/profile" />
      <h1 className="h1 mt-5 max-w-[260px] tablet:max-w-none">Hi {data.patient.firstName}, how can we help?</h1>

      <label className="mt-[18px] flex h-[54px] items-center gap-2.5 rounded-full border border-white bg-surface px-[18px]">
        <Icon name="search" size={20} />
        <span className="sr-only">Search help</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
      </label>

      <div className="mt-3.5 grid grid-cols-2 gap-2 tablet:grid-cols-4">
        {TOPICS.map((t) => {
          const on = topic === t.tag;
          return (
            <button
              key={t.tag}
              type="button"
              aria-pressed={on}
              onClick={() => setTopic(on ? null : t.tag)}
              className={`card flex flex-col gap-2.5 !rounded-[20px] p-3.5 text-left ${on ? '!border-ink shadow-[inset_0_0_0_1px_#181818]' : ''}`}
            >
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-icon" style={{ background: t.bg, color: t.ink ? '#FDFCFB' : undefined }}>
                <Icon name={t.icon} size={18} />
              </span>
              <span className="text-[14px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>

      <h2 className="section-label mb-2 mt-[22px]">{topic || needle ? 'Matching questions' : 'Common questions'}</h2>
      {list.length ? (
        <div className="card px-4">
          {list.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-divider last:border-0">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center gap-3 py-3.5 text-left text-[15px] font-medium">
                  <span className="flex-1">{f.q}</span>
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-tint text-[18px] font-medium" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && <p className="m-0 -mt-1 pb-3.5 text-[14px] leading-[1.5] text-text-body">{f.a}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <NoResults title="No articles match" hint="Try different words, or chat with us" onClear={() => { setQ(''); setTopic(null); }} />
      )}

      <h2 className="section-label mb-2 mt-[22px]">Still need help?</h2>
      <div className="flex gap-2">
        <Button block size="md" icon="chat" onClick={() => window.open('mailto:support@digirx.example?subject=Patient%20portal%20help')}>
          Chat with us
        </Button>
        <a href={`tel:${clinicPhone}`} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-surface text-[15px] font-semibold">
          <Icon name="phone" size={18} />
          Helpline Number
        </a>
      </div>
      <span className="mt-3.5 rounded-[16px] bg-bad-bg px-3.5 py-3 text-[13px] font-medium leading-[1.4] text-[#7E1717]">
        In a medical emergency, call 112 or go to the nearest hospital.
      </span>
    </Screen>
  );
}
