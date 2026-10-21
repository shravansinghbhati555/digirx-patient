import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { NoResults } from '../../components/ui/States';
import { usePortalData } from '../../state/portal';
import { useToast } from '../../components/ui/Overlay';

interface Match {
  initial: string;
  masked: string;
  meta: string;
}

/** The server never says whether a number has an account, so we only confirm the number. */
function lookup(q: string): Match | null {
  const national = q.replace(/\D/g, '').slice(-10);
  return national.length === 10
    ? { initial: '?', masked: `+91 ••••• ${national.slice(-5)}`, meta: "We'll send the request to this number" }
    : null;
}

export function LinkAccount() {
  const { actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<Match | null | undefined>(undefined);

  const find = (e: FormEvent) => {
    e.preventDefault();
    setResult(lookup(q));
  };

  const send = async () => {
    if (!result) return;
    const res = await actions.inviteFamily({ phone: q.replace(/\D/g, '').slice(-10) });
    if (!res.ok) {
      toast({ message: res.error, tone: 'info' });
      return;
    }
    navigate('/done', {
      replace: true,
      state: {
        title: 'Link request sent',
        body: "If they use DigiRx they'll see your request. Their records stay private unless they choose to share.",
        primary: { label: 'Back to family', to: '/family' },
      },
    });
  };

  return (
    <Screen>
      <PageHeader back="/family/add" />
      <h1 className="h1 mt-5">Link an existing DigiRx patient</h1>
      <p className="m-0 mt-2.5 text-[15px] leading-[1.45] text-text-muted">Use their registered mobile number or the patient ID on any DigiRx clinic slip.</p>

      <form onSubmit={find} className="mt-[22px] flex flex-col">
        <label htmlFor="lq" className="label">
          Mobile number or patient ID
        </label>
        <div className="mt-2 flex h-14 items-center gap-2.5 rounded-full border-2 border-ink bg-surface pl-[18px] pr-1.5">
          <Icon name="search" size={20} />
          <input
            id="lq"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setResult(undefined);
            }}
            placeholder="+91 98860 44120"
            className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium outline-none"
          />
          <button type="submit" className="h-11 rounded-full bg-ink px-4 text-[14px] font-semibold text-surface">
            Find
          </button>
        </div>
      </form>

      {result === null && (
        <div className="mt-5">
          <NoResults title="No DigiRx patient found" hint="Check the number, or invite them instead" />
        </div>
      )}

      {result && (
        <>
          <span className="section-label mb-2.5 mt-5">1 patient found</span>
          <div className="card flex flex-col gap-3.5 p-4 shadow-[0_0_0_2px_#181818,0_12px_30px_-16px_rgba(214,110,170,.35)]">
            <span className="flex items-center gap-3">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-input bg-lavender font-semibold">{result.initial}</span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-semibold">{result.masked}</span>
                <span className="text-[13px] text-text-caption">{result.meta}</span>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
              <Icon name="lock" size={16} />
              Details are hidden until they approve
            </span>
          </div>
        </>
      )}

      <div className="card mt-4 flex flex-col gap-3.5 p-4">
        <span className="text-[15px] font-semibold">What happens next</span>
        {[
          'They get an SMS and in-app request from you.',
          'They confirm the relationship and pick what you can see or do.',
          "You're linked. Their records stay private unless they share them.",
        ].map((t, i) => (
          <div key={t} className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-surface">{i + 1}</span>
            <span className="text-[14px] leading-[1.45]">{t}</span>
          </div>
        ))}
      </div>

      <ActionBar>
        <ArrowButton wide disabled={!result} onClick={send}>
          Send link request
        </ArrowButton>
      </ActionBar>
    </Screen>
  );
}
