import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Face, Flower, faces } from '../../components/ui/Art';
import { ArrowButton, BackButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { requestOtp } from '../../services/api';
import { errorMessage } from '../../services/http';
import { usePortal } from '../../state/portal';
import { AuthFrame } from './AuthFrame';

const digitsOnly = (s: string) => s.replace(/\D/g, "");
const pretty = (d: string) =>
  d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5, 10)}` : d;

export function Login() {
  const { state, actions } = usePortal();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() =>
    digitsOnly(state.pendingPhone?.replace("+91", "") ?? ""),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (state.session)
    return <Navigate to={state.session.profileDone ? "/" : "/setup"} replace />;

  
const submit = async (e: FormEvent) => {
  e.preventDefault();

  if (phone.length !== 10) {
    setError("Enter your 10-digit mobile number.");
    return;
  }

  setBusy(true);
  const full = `+91 ${pretty(phone)}`;

  try {
    const res = await requestOtp(full);

    actions.startLogin(full);

    navigate("/otp", {
      state: {
        debugOtp: import.meta.env.DEV ? res.otp : undefined,
      },
    });
  } catch (err) {
    setError(errorMessage(err));
  } finally {
    setBusy(false);
  }
};


  return (
    <AuthFrame bg="bg-login">
      <Flower
        size={220}
        className="absolute -right-[50px] top-[30px] rotate-[14deg]"
      />
      <Face
        size={96}
        spec={faces.smile}
        rotate={10}
        className="absolute right-[26px] top-[92px]"
      />
      <Flower
        size={70}
        color="#FDFCFB"
        bold={false}
        className="absolute left-[150px] top-[150px]"
      />

      <form
        onSubmit={submit}
        noValidate
        className="relative z-10 flex flex-col px-6 pt-[max(24px,env(safe-area-inset-top))]"
      >
        <BackButton fallback="/welcome" />

        <div className="mt-[125px] flex flex-col gap-8 md:mx-auto md:mt-[100px] md:max-w-[1200px] md:flex-row md:items-start md:justify-center md:gap-6">
          {/* First div: Heading and description */}
          <div className="w-full md:mt-[45px] md:w-[30%]">
            <span className="text-[15px] font-semibold">digiRx</span>

            <h1 className="m-0 mt-2.5 text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[34px]">
              Log in with your phone number
            </h1>

            <p className="m-0 mt-3 text-[15px] leading-[1.45] text-text-muted">
              Use the number you gave at any DigiRx clinic. We'll find your
              records automatically.
            </p>
          </div>

          {/* Second div: Mobile number and OTP form */}
          <div className="w-full md:mt-8 md:w-[40%] md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-6 md:shadow-lg lg:p-8">
            <label htmlFor="phone" className="label">
              Mobile number
            </label>

            <div className="mt-2 flex gap-2">
              <span className="flex h-14 shrink-0 items-center gap-1.5 rounded-input border border-white bg-surface px-3.5 text-[16px] font-medium">
                +91
                <Icon name="chevronDown" size={16} />
              </span>

              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={pretty(phone)}
                onChange={(e) => {
                  setPhone(digitsOnly(e.target.value).slice(0, 10));
                  setError("");
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "phone-err" : undefined}
                placeholder="98450 12345"
                className={`h-14 min-w-0 flex-1 rounded-input bg-surface px-3 text-[16px] font-medium tracking-[0.02em] outline-none transition-colors sm:px-[18px] sm:text-[18px] ${error
                  ? "border-2 border-danger bg-[#FFF5F5]"
                  : "border-2 border-gray-300 focus:border-ink focus:ring-2 focus:ring-gray-200"
                  }`}
              />
            </div>

            {error && (
              <span
                id="phone-err"
                className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-bad-fg"
              >
                <Icon name="alert" size={16} />
                {error}
              </span>
            )}

            <ArrowButton type="submit" wide className="mt-5" disabled={busy}>
              {busy ? "Sending…" : "Send OTP"}
            </ArrowButton>

            <p className="m-0 mt-[18px] text-center text-[12px] leading-[1.5] text-text-muted">
              By continuing you agree to DigiRx's{" "}
              <Link to="/legal" className="font-medium underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/legal" className="font-medium underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Third div: Empty space */}
          <div className="hidden md:block md:w-[10%]"></div>
        </div>

      </form>
    </AuthFrame>
  );
}
