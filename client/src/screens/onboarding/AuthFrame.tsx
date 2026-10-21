import type { ReactNode } from 'react';

/** Full-bleed gradient with a phone-width column, centred on larger screens. */
export function AuthFrame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className={`flex min-h-dvh justify-center ${bg}`}>
      <div className="relative min-h-dvh w-full overflow-hidden">{children}</div>
    </div>
  );
}
