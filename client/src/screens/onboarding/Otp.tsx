import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Face, faces } from '../../components/ui/Art';
import { ArrowButton, BackButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { requestOtp, verifyOtp } from '../../services/api';
import { usePortal } from '../../state/portal';
import { AuthFrame } from './AuthFrame';

const LENGTH = 6;
const RESEND_SECONDS = 30;

export function Otp() {
  const { state, actions } = usePortal();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  useEffect(() => inputs.current[0]?.focus(), []);

  if (state.session) return <Navigate to={state.session.profileDone ? '/' : '/setup'} replace />;
  if (!state.pendingPhone) return <Navigate to="/login" replace />;

  const setAt = (i: number, v: string) => {
    setDigits((prev) => prev.map((d, j) => (j === i ? v : d)));
    setError('');
  };

  const onChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1);
    setAt(i, v);
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => text[i] ?? ''));
    inputs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== LENGTH) {
      setError('Enter all 6 digits.');
      return;
    }
    setBusy(true);
    const res = await verifyOtp(state.pendingPhone ?? '', code);
    setBusy(false);
    if (!res.ok) {
      setError(`That code didn't match. ${res.attemptsLeft} tries left.`);
      return;
    }
    actions.signIn();
    navigate('/setup', { replace: true });
  };

  const resend = async () => {
    await requestOtp(state.pendingPhone ?? '');
    setSeconds(RESEND_SECONDS);
  };

  return (
    <AuthFrame bg="bg-screen">
      <form onSubmit={submit} className="flex flex-col px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <BackButton fallback="/login" />

        <div className="relative mt-11 h-[88px] w-[88px]">
          <Face size={88} spec={faces.calm} rotate={-8} />
          <span className="absolute -bottom-1.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface">
            <Icon name="lock" size={18} />
          </span>
        </div>

        <h1 className="m-0 mt-7 text-[34px] font-semibold leading-[1.12] tracking-[-0.03em]">Enter the 6-digit code</h1>
        <p className="m-0 mt-3 text-[15px] leading-[1.45] text-text-muted">
          Sent by SMS to <strong className="font-semibold text-ink">{state.pendingPhone}</strong> ·{' '}
          <Link to="/login" className="font-medium underline">
            Change
          </Link>
        </p>

        <fieldset className="m-0 mt-8 border-0 p-0">
          <legend className="sr-only">One-time password</legend>
          <div className="flex justify-between gap-2" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                aria-label={`Digit ${i + 1}`}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                aria-invalid={!!error}
                className={`h-[60px] w-12 min-w-0 flex-1 rounded-input text-center text-[24px] font-semibold outline-none ${
                  error ? 'border-2 border-danger bg-[#FFF5F5]' : 'border border-white bg-surface focus:border-2 focus:border-ink'
                }`}
              />
            ))}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="m-0 mt-4 flex items-center gap-1.5 text-[13px] font-medium text-bad-fg">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : seconds > 0 ? (
          <p className="m-0 mt-4 flex items-center gap-1.5 text-[14px] text-text-muted">
            <Icon name="clock" size={18} />
            Resend code in <strong className="font-semibold text-ink">0:{String(seconds).padStart(2, '0')}</strong>
          </p>
        ) : (
          <button type="button" onClick={resend} className="mt-4 self-start text-[14px] font-semibold underline">
            Resend code
          </button>
        )}

        <ArrowButton type="submit" wide className="mt-9" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </ArrowButton>

        <div className="mt-7 flex items-start gap-3 rounded-[20px] bg-surface/60 px-4 py-3.5">
          <Icon name="shield" size={20} className="mt-px" />
          <span className="text-[13px] leading-[1.45] text-text-muted">DigiRx staff will never ask for this code. Don't share it with anyone.</span>
        </div>
      </form>
    </AuthFrame>
  );
}
