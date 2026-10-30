import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chip } from '../../components/ui/Bits';
import { ArrowButton } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { usePortalData } from '../../state/portal';
import { dobToIso } from '../../services/api';

const CHILD_REL = ['Son', 'Daughter', 'Parent (dependant)', 'Other'];
const ADULT_REL = ['Spouse', 'Parent', 'Sibling', 'Other'];

function OptionCard({ icon, bg, title, sub, on, onClick }: { icon: IconName; bg: string; title: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[22px] p-3.5 text-left ${on ? 'bg-ink text-surface' : 'bg-surface/75'}`}
    >
      <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[16px] text-ink" style={{ background: bg }}>
        <Icon name={icon} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[16px] font-semibold">{title}</span>
        <span className={`text-[13px] ${on ? 'opacity-80' : 'text-text-muted'}`}>{sub}</span>
      </span>
    </button>
  );
}

export function AddFamily() {
  const { actions } = usePortalData();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'child' | 'invite'>('child');
  const [rel, setRel] = useState('Son');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (m: 'child' | 'invite') => {
    setMode(m);
    setRel(m === 'child' ? 'Son' : 'Parent');
    setError('');
  };

  const first = name.trim().split(/\s+/)[0];
  const cta = mode === 'child' ? (first ? `Add ${first}` : 'Add member') : 'Send invite';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) return setError(mode === 'child' ? 'Add their full name.' : 'Add their name so you recognise the invite.');
    if (mode === 'invite' && digits.length !== 10) return setError('Enter their 10-digit mobile number.');
    const relation = rel.replace(' (dependant)', '');
    const iso = mode === 'child' ? dobToIso(dob) : null;
    if (mode === 'child' && !iso) return setError('Enter their date of birth as DD / MM / YYYY.');
    setBusy(true);
    const res =
      mode === 'child'
        ? await actions.addDependant({ fullName: name.trim(), dob: iso!, relation })
        : await actions.inviteFamily({ phone: digits, name: name.trim(), relation });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    navigate('/done', {
      replace: true,
      state:
        mode === 'child'
          ? { title: `${first} is in your family`, body: `Their records at DigiRx clinics that carry your mobile number and ${first}'s date of birth are now linked.`, primary: { label: 'Back to family', to: '/family' } }
          : { title: 'Invite sent', body: `If ${first} uses DigiRx they'll see your request. Nothing is shared until they accept and choose permissions.`, primary: { label: 'Back to family', to: '/family' } },
    });
  };

  return (
    <Screen>
      <form onSubmit={submit} noValidate className="flex flex-col">
        <PageHeader back="/family" />
        <h1 className="h1 mt-5">Add to your family</h1>

        <div role="radiogroup" aria-label="Member type" className="mt-[18px] flex flex-col gap-2">
          <OptionCard icon="user" bg="#9CC9FF" title="Add a child or dependant" sub="You manage their profile and bookings" on={mode === 'child'} onClick={() => switchMode('child')} />
          <OptionCard icon="chat" bg="#FF8F8F" title="Invite an adult" sub="They accept and choose what to share" on={mode === 'invite'} onClick={() => switchMode('invite')} />
          <Link to="/family/link" className="flex w-full items-center gap-3 rounded-[22px] bg-surface/75 p-3.5">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[16px] bg-lavender">
              <Icon name="link" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[16px] font-semibold">Link an existing patient</span>
              <span className="text-[13px] text-text-muted">Already registered at a DigiRx clinic</span>
            </span>
            <Icon name="forward" />
          </Link>
        </div>

        <span className="label mb-2 mt-4 block" id="rel-l">
          Relationship
        </span>
        <div role="group" aria-labelledby="rel-l" className="flex flex-wrap gap-2">
          {(mode === 'child' ? CHILD_REL : ADULT_REL).map((r) => (
            <Chip key={r} size="md" surface="solid" on={rel === r} onClick={() => setRel(r)}>
              {r}
            </Chip>
          ))}
        </div>

        <label className="label mb-2 mt-4 block" htmlFor="fname">
          {mode === 'child' ? 'Full name' : 'Their name'}
        </label>
        <input id="fname" className="field" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} autoComplete="off" />

        {mode === 'child' ? (
          <>
            <label className="label mb-2 mt-4 block" htmlFor="fdob">
              Date of birth
            </label>
            <input id="fdob" className="field" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DD / MM / YYYY" inputMode="numeric" />
            <span className="mt-2.5 block text-[12px] leading-[1.45] text-text-muted">
              {first ? `When ${first} turns 18, they'll` : "At 18 they'll"} be asked to take over their own account.
            </span>
          </>
        ) : (
          <>
            <label className="label mb-2 mt-4 block" htmlFor="fphone">
              Their mobile number
            </label>
            <div className="flex gap-2">
              <span className="field flex !w-auto items-center font-medium">+91</span>
              <input id="fphone" type="tel" inputMode="numeric" className="field flex-1" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} placeholder="98860 44120" />
            </div>
            <span className="mt-2.5 block text-[12px] leading-[1.45] text-text-muted">We'll send an SMS invite. Nothing is shared until they accept and choose permissions.</span>
          </>
        )}

        {error && (
          <p role="alert" className="m-0 mt-3 flex items-center gap-1.5 text-[13px] font-medium text-bad-fg">
            <Icon name="alert" size={16} />
            {error}
          </p>
        )}

        <ActionBar>
          <ArrowButton type="submit" wide disabled={busy}>
            {cta}
          </ArrowButton>
        </ActionBar>
      </form>
    </Screen>
  );
}
