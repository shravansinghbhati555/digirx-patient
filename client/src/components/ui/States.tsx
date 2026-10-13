import { useEffect, useState, type ReactNode } from 'react';
import { ArrowButton, Button } from './Button';
import { FlowerFace, faces, type FaceSpec } from './Art';
import { Icon } from './Icon';

/* ---------- Empty ---------- */

export function EmptyState({
  title,
  body,
  action,
  face = faces.sleepy,
  flower = '#F0679F',
}: {
  title: string;
  body: string;
  action?: { label: string; to: string };
  face?: FaceSpec;
  flower?: string;
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="relative">
        <FlowerFace size={180} flowerColor={flower} face={face} faceRotate={6} />
        {face === faces.sleepy && (
          <>
            <span className="absolute right-2.5 top-1.5 text-[20px] font-bold" aria-hidden="true">z</span>
            <span className="absolute -right-1.5 -top-3 text-[26px] font-bold" aria-hidden="true">z</span>
          </>
        )}
      </span>
      <h2 className="m-0 mt-6 text-[26px] font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="m-0 mt-2 max-w-[280px] text-[15px] leading-[1.45] text-text-muted">{body}</p>
      {action && (
        <ArrowButton to={action.to} className="mt-[22px]">
          {action.label}
        </ArrowButton>
      )}
    </div>
  );
}

/** Compact inline "no results" card. */
export function NoResults({ title, hint, onClear }: { title: string; hint: string; onClear?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-surface/75 px-4 py-3.5">
      <Icon name="search" />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[14px] font-semibold">{title}</span>
        <span className="text-[12px] text-text-muted">{hint}</span>
      </span>
      {onClear && (
        <Button variant="secondary" size="xs" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}

/* ---------- Error ---------- */

export function ErrorState({
  title,
  body,
  onRetry,
  retryTo,
  helpTo = '/help',
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryTo?: string;
  helpTo?: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <FlowerFace size={170} flowerColor="#C9B2FF" face={faces.upset} faceRotate={-8} />
      <h1 className="m-0 mt-[22px] text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{title}</h1>
      <p className="m-0 mt-2 max-w-[300px] text-[15px] leading-[1.45] text-text-muted">{body}</p>
      <div className="mt-5 flex gap-2.5">
        {(onRetry || retryTo) && (
          <Button size="md" icon="refresh" onClick={onRetry} to={retryTo}>
            Try again
          </Button>
        )}
        <Button size="md" variant="light" to={helpTo}>
          Get help
        </Button>
      </div>
    </div>
  );
}

/* ---------- Offline ---------- */

export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-4 top-4 z-[55] mx-auto flex max-w-[440px] items-center gap-2.5 rounded-input bg-ink px-[14px] py-3 text-[14px] font-medium text-surface shadow-dialog">
      <Icon name="wifiOff" size={20} />
      <span className="flex-1">You're offline. Showing saved data.</span>
    </div>
  );
}

/* ---------- Loading ---------- */

const Sk = ({ className = '' }: { className?: string }) => <span className={`skeleton block ${className}`} />;

/** Dashboard-shaped skeleton (artboard 27a). */
export function DashboardSkeleton({ message }: { message?: ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Loading your dashboard" className="flex flex-col">
      <div className="flex items-center gap-3">
        <Sk className="h-12 w-12 !rounded-[16px]" />
        <span className="flex flex-1 flex-col gap-2">
          <Sk className="h-2.5 w-[90px]" />
          <Sk className="h-3.5 w-[130px]" />
        </span>
        <Sk className="h-11 w-11" />
      </div>
      <Sk className="mt-[30px] h-[30px] w-full !rounded-[12px]" />
      <Sk className="mt-2.5 h-[30px] w-[70%] !rounded-[12px]" />
      <div className="mt-[26px] flex gap-2.5">
        {[84, 84, 84, 60].map((w, i) => (
          <span key={i} style={{ width: w }}>
            <Sk className="h-10 !rounded-full" />
          </span>
        ))}
      </div>
      <Sk className="mt-[22px] h-[170px] w-full !rounded-card" />
      <div className="mt-[26px] grid grid-cols-4 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} className="h-[88px] !rounded-[20px]" />
        ))}
      </div>
      <Sk className="mt-[22px] h-[130px] w-full !rounded-card" />
      {message && <span className="mt-5 self-center text-[13px] font-medium text-text-muted">{message}</span>}
    </div>
  );
}
