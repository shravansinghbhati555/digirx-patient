import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Note, Tag, Toggle } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { PageHeader, Screen } from '../../components/ui/Layout';
import { ConfirmDialog, useToast } from '../../components/ui/Overlay';
import { usePortalData } from '../../state/portal';
import type { Grants } from '../../types';
import { NotFound } from '../system/NotFound';

const THEY: [keyof Grants, (n: string) => string][] = [
  ['book', () => 'Book & manage visits'],
  ['rx', () => 'See prescriptions'],
  ['reports', () => 'See reports & history'],
  ['bills', () => 'See & pay bills'],
];

const YOU: [keyof Grants, string, string][] = [
  ['book', 'Book visits for you', 'They can book and cancel on your behalf'],
  ['rx', 'See your prescriptions', 'Read-only'],
  ['reports', 'See your reports & history', 'Includes all clinics'],
  ['bills', 'See & pay your bills', 'Invoices and payments'],
];

export function FamilyPermissions() {
  const { id } = useParams();
  const { data, actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const m = data.family.find((x) => x.id === id);
  if (!m) return <NotFound />;
  const rel = m.relation.toLowerCase();

  const remove = async () => {
    const res = await actions.removeMember(m.id);
    setConfirm(false);
    if (!res.ok) {
      toast({ message: res.error, tone: 'info' });
      return;
    }
    toast({ message: `${m.firstName} removed from your family`, tone: 'info' });
    navigate('/family', { replace: true });
  };

  return (
    <Screen>
      <PageHeader title="Access & consent" back="/family" />

      <div className="mt-5 flex items-center gap-3.5">
        <Avatar initials={m.initials} color={m.color} size={64} shape="soft" textSize={20} ring={m.kind === 'pending' ? 'dashed' : undefined} />
        <span className="flex flex-col gap-0.5">
          <span className="text-[22px] font-semibold tracking-[-0.02em]">{m.name}</span>
          <span className="text-[13px] text-text-muted">
            Your {rel}
            {m.kind === 'dependant' ? ` · ${m.age ? `${m.age} yrs · ` : ''}you manage this profile` : m.linkedSince ? ` · linked since ${m.linkedSince}` : ` · ${m.note.toLowerCase()}`}
          </span>
        </span>
      </div>

      {m.shared ? (
        <div className="mt-4">
          <Note tone="hero" icon="shield">
            {m.firstName} is {m.note.charAt(0).toLowerCase() + m.note.slice(1)}, so they show on your tree too. Their own account decides what you can see.
          </Note>
        </div>
      ) : m.kind === 'dependant' ? (
        <>
          <div className="mt-4">
            <Note tone="hero" icon="shield">
              As {m.firstName}'s guardian you can book visits, see records and pay bills at every DigiRx clinic. When {m.firstName} turns 18 they'll be asked to take over their own account.
            </Note>
          </div>
          <h2 className="h2 mt-[22px]">You can</h2>
          <div className="card mt-2.5 px-4 py-1">
            {THEY.map(([k, l]) => (
              <div key={k} className="row">
                <span className="flex-1 text-[15px]">{l(m.firstName)}</span>
                <Tag tone="ok" className="text-[12px]">
                  Allowed
                </Tag>
              </div>
            ))}
          </div>
          <Button variant="light" className="mt-4 self-start" size="sm" to="/records">
            Open {m.firstName}'s records
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-input bg-hero-soft px-3.5 py-3 text-[13px] leading-[1.45]">
            Access works both ways and each person controls their own side. Clinics never get extra access from these settings.
          </div>

          <div className="mt-[22px] flex items-center justify-between gap-2">
            <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">What {m.firstName} allows you</h2>
            <Tag tone="neutral" className="text-[12px]">
              Set by {m.firstName}
            </Tag>
          </div>
          <div className="card mt-2.5 px-4 py-1">
            {THEY.map(([k, l]) => (
              <div key={k} className="row">
                <span className="flex-1 text-[15px]">{l(m.firstName)}</span>
                <Tag tone={m.theyAllow[k] ? 'ok' : 'neutral'} className="text-[12px]">
                  {m.theyAllow[k] ? 'Allowed' : 'Not shared'}
                </Tag>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2.5 self-start text-[14px] font-medium underline"
            onClick={() => toast({ message: `We've asked ${m.firstName} for more access` })}
          >
            Ask {m.firstName} for more access
          </button>

          <div className="mt-[22px] flex items-center justify-between gap-2">
            <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">What you allow {m.firstName}</h2>
            <Tag tone="ink" className="text-[12px]">
              You control
            </Tag>
          </div>
          <div className="card mt-2.5 px-4 py-1">
            {YOU.map(([k, label, hint]) => (
              <div key={k} className="row">
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px]">{label}</span>
                  <span className="text-[12px] text-text-caption">{hint}</span>
                </span>
                <Toggle on={m.youAllow[k]} onChange={(v) => actions.setGrant(m.id, k, v)} label={`${label} — ${m.firstName}`} />
              </div>
            ))}
          </div>
          <span className="mt-3 text-[12px] text-text-muted">
            {m.grantsChangedOn ? `Last changed by you ${m.grantsChangedOn === 'today' ? 'today' : `on ${m.grantsChangedOn}`}` : 'Nothing shared yet'} ·{' '}
            <Link to="/privacy" className="underline">
              View consent log
            </Link>
          </span>
        </>
      )}

      {!m.shared && (
        <Button variant="dangerSoft" className="mt-[18px]" onClick={() => setConfirm(true)}>
          {m.kind === 'pending' ? 'Cancel invite' : 'Remove from family'}
        </Button>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        icon="userMinus"
        title={`Remove ${m.firstName} from your family?`}
        points={[
          { text: "You'll stop seeing each other in Family." },
          { text: "Any access you've given each other ends now." },
          { ok: true, text: 'Bookings already made stay with the clinic.' },
        ]}
        confirmLabel="Remove"
      />
    </Screen>
  );
}
