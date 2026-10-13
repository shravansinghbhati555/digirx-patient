import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Avatar, Chip } from '../../components/ui/Bits';
import { ArrowButton, BackButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { DashboardSkeleton } from '../../components/ui/States';
import { usePortal } from '../../state/portal';
import type { Patient, PortalData } from '../../types';
import { AuthFrame } from './AuthFrame';

const GENDERS: Patient['gender'][] = ['Female', 'Male', 'Other'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'Other'];

/**
 * Step 2 of onboarding (records matched by phone), and later the
 * "Personal & health details" editor from Profile.
 */
export function ProfileSetup() {
  const { state } = usePortal();
  if (!state.session) return <Navigate to="/welcome" replace />;
  if (!state.data) {
    return (
      <AuthFrame bg="bg-screen">
        <Screen>
          <DashboardSkeleton message="Looking for your records at DigiRx clinics…" />
        </Screen>
      </AuthFrame>
    );
  }
  // Mounted only once data is loaded, so the form starts pre-filled.
  return <ProfileForm data={state.data} editing={state.session.profileDone} />;
}

function ProfileForm({ data, editing }: { data: PortalData; editing: boolean }) {
  const { actions } = usePortal();
  const navigate = useNavigate();
  const toast = useToast();
  const p = data.patient;

  const [name, setName] = useState(p.name);
  const [dob, setDob] = useState(p.dob);
  const [gender, setGender] = useState<Patient['gender']>(p.gender);
  const [blood, setBlood] = useState(p.bloodGroup ?? '');
  const [email, setEmail] = useState(p.email ?? '');
  const [error, setError] = useState('');

  const clinicsWithRecords = new Set(data.records.map((r) => r.clinicId)).size;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Add your full name so clinics can match your records.');
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError('That email address looks incomplete.');
      return;
    }
    const first = name.trim().split(/\s+/)[0];
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
    actions.completeProfile({ name: name.trim(), firstName: first, initials, dob, gender, bloodGroup: blood || undefined, email: email || undefined });
    if (editing) {
      toast({ message: 'Profile updated' });
      navigate('/profile');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthFrame bg="bg-screen">
      <form onSubmit={submit} noValidate className="flex flex-col px-6 pb-10 pt-[max(24px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <BackButton fallback={editing ? '/profile' : '/'} />
          {!editing && (
            <>
              <span className="text-[13px] font-medium">Step 2 of 3</span>
              <Link to="/" className="text-[14px] font-medium text-text-muted" onClick={() => actions.completeProfile()}>
                Skip
              </Link>
            </>
          )}
        </div>
        {!editing && (
          <div className="mt-[18px] grid grid-cols-3 gap-1.5" aria-hidden="true">
            <span className="h-[5px] rounded-full bg-ink" />
            <span className="h-[5px] rounded-full bg-ink" />
            <span className="h-[5px] rounded-full bg-ink/15" />
          </div>
        )}

        <h1 className="m-0 mt-[26px] text-[31px] font-semibold leading-[1.14] tracking-[-0.03em]">
          {editing ? 'Personal & health details' : 'Tell us a little about you'}
        </h1>

        {!editing && clinicsWithRecords > 0 && (
          <div className="mt-[18px] flex items-center gap-3 rounded-[20px] bg-hero px-4 py-3.5">
            <Icon name="file" />
            <span className="text-[14px] font-medium leading-[1.4]">
              We found your records at {clinicsWithRecords} DigiRx clinics. Confirm your details to link them.
            </span>
          </div>
        )}

        <div className="mt-[22px] flex items-center gap-4">
          <span className="relative">
            <Avatar initials={p.initials} color={p.color} size={76} shape="soft" textSize={24} />
            <button
              type="button"
              aria-label="Add a photo"
              className="absolute -bottom-1.5 -right-1.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-surface bg-ink text-surface"
            >
              <Icon name="plus" size={15} />
            </button>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-medium">Add a photo</span>
            <span className="text-[13px] text-text-muted">Helps clinic staff recognise you</span>
          </span>
        </div>

        <label className="label mb-2 mt-4 block" htmlFor="name">
          Full name
        </label>
        <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />

        <label className="label mb-2 mt-4 block" htmlFor="dob">
          Date of birth
        </label>
        <input id="dob" className="field" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DD / MM / YYYY" inputMode="numeric" />

        <span className="label mb-2 mt-4 block" id="gender-l">
          Gender
        </span>
        <div className="flex gap-2" role="group" aria-labelledby="gender-l">
          {GENDERS.map((g) => (
            <Chip key={g} size="lg" surface="solid" on={gender === g} onClick={() => setGender(g)}>
              {g}
            </Chip>
          ))}
        </div>

        <span className="label mb-2 mt-4 block" id="blood-l">
          Blood group <span className="font-normal text-text-muted">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="blood-l">
          {BLOOD.map((b) => (
            <Chip key={b} size="lg" surface="solid" on={blood === b} onClick={() => setBlood(blood === b ? '' : b)}>
              {b}
            </Chip>
          ))}
        </div>

        <label className="label mb-2 mt-4 block" htmlFor="email">
          Email <span className="font-normal text-text-muted">(for invoices)</span>
        </label>
        <input
          id="email"
          type="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        {error && (
          <p role="alert" className="m-0 mt-3 flex items-center gap-1.5 text-[13px] font-medium text-bad-fg">
            <Icon name="alert" size={16} />
            {error}
          </p>
        )}

        <ArrowButton type="submit" wide className="mt-[26px]">
          {editing ? 'Save changes' : 'Continue'}
        </ArrowButton>
      </form>
    </AuthFrame>
  );
}
