import { useEffect, useRef } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FlowerFace, faces } from '../../components/ui/Art';
import { ArrowButton } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';

export interface DoneState {
  title: string;
  body: string;
  primary?: { label: string; to: string };
  toast?: string;
  face?: keyof typeof faces;
}

/** Generic success screen (artboard 27d), driven by navigation state. */
export function Done() {
  const { state } = useLocation() as { state: DoneState | null };
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (state?.toast && !shown.current) {
      shown.current = true;
      const message = state.toast;
      toast({ message, undo: () => toast({ message: 'Reminder removed', tone: 'info' }) });
    }
  }, [state, toast]);

  if (!state) return <Navigate to="/" replace />;

  return (
    <Screen className="items-center text-center">
      <div className="flex flex-col items-center pt-[110px] tablet:pt-16">
        <FlowerFace size={190} face={faces[state.face ?? 'smile']} badge="check" />
        <h1 role="status" className="m-0 mt-[22px] text-[30px] font-semibold leading-[1.12] tracking-[-0.025em]">
          {state.title}
        </h1>
        <p className="m-0 mt-2 max-w-[290px] text-[15px] leading-[1.45] text-text-muted">{state.body}</p>
        {state.primary && (
          <ArrowButton to={state.primary.to} replace className="mt-[22px]">
            {state.primary.label}
          </ArrowButton>
        )}
        <Link to="/" replace className="mt-4 text-[14px] font-medium underline">
          Back to home
        </Link>
      </div>
    </Screen>
  );
}
