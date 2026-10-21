import { Link, Navigate } from 'react-router-dom';
import { Face, Flower, Star, faces } from '../../components/ui/Art';
import { ArrowButton } from '../../components/ui/Button';
import { usePortal } from '../../state/portal';
import { AuthFrame } from './AuthFrame';

export function Welcome() {
  const { state } = usePortal();
  if (state.session) return <Navigate to={state.session.profileDone ? '/' : '/setup'} replace />;

  return (
    <AuthFrame bg="bg-welcome">
      <Flower size={270} className="absolute left-1.5 top-9 -rotate-12" />
      <Face size={150} spec={faces.happy} rotate={-8} className="absolute left-[66px] top-[102px]" />
      <Flower size={110} color="#FDFCFB" bold={false} className="absolute -right-1.5 top-[168px] rotate-[18deg]" />

      <div className="relative z-10 flex flex-col items-center gap-[22px] px-7 pt-[275px] text-center">
        <span className="rounded-full bg-surface/55 px-3.5 py-1.5 text-[15px] font-semibold tracking-[-0.01em]">digiRx · Patient</span>
        <h1 className="m-0 text-[38px] font-semibold leading-[1.12] tracking-[-0.03em]">Your care, every clinic, one place</h1>
        <ArrowButton to="/login" tone="glass">
          Get started
        </ArrowButton>
      </div>

      <Flower size={96} color="#FDFCFB" bold={false} className="absolute -left-2.5 top-[620px] -rotate-[20deg]" />
      <Star size={270} className="absolute -bottom-[60px] -right-10 rotate-[14deg]" />
      <Face size={128} spec={faces.laughing} rotate={10} className="absolute bottom-[30px] right-[52px]" />

      <Link to="/login" className="absolute bottom-10 left-7 z-10 text-[14px] font-medium underline">
        I already have an account
      </Link>
    </AuthFrame>
  );
}
