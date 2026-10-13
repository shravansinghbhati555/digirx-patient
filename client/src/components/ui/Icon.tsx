import type { ReactNode } from 'react';

/**
 * Stroke icon set taken from the design artboards (24px grid, 1.8 stroke).
 * `base` is the outline; `detail` holds inner lines that flip to the
 * surface colour when the icon is drawn filled (active nav state).
 */
interface Glyph {
  base: ReactNode;
  detail?: ReactNode;
}

const g: Record<string, Glyph> = {
  back: { base: <path d="M15 5l-7 7 7 7" /> },
  forward: { base: <path d="m9 5 7 7-7 7" /> },
  chevronDown: { base: <path d="m6 9 6 6 6-6" /> },
  arrow: { base: <path d="M5 12h14M13 6l6 6-6 6" /> },
  plus: { base: <path d="M12 5v14M5 12h14" /> },
  close: { base: <path d="M6 6l12 12M18 6 6 18" /> },
  check: { base: <path d="m5 12.5 4.5 4.5L19 7.5" /> },
  home: { base: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> },
  calendar: {
    base: <rect x="3" y="4.5" width="18" height="16.5" rx="3" />,
    detail: <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />,
  },
  calendarPlus: {
    base: <rect x="3" y="4.5" width="18" height="16.5" rx="3" />,
    detail: <path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5" />,
  },
  file: {
    base: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />,
    detail: <path d="M14 3v5h5M9 13h6M9 17h4" />,
  },
  family: {
    base: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M17 14.5c2.3 0 4 1.5 4.5 4" />
      </>
    ),
  },
  grid: {
    base: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2.5" />
      </>
    ),
  },
  pill: {
    base: <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />,
    detail: <path d="m8.5 8.5 7 7" />,
  },
  clock: { base: <circle cx="12" cy="12" r="9" />, detail: <path d="M12 7v5l3 2" /> },
  flask: { base: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /> },
  receipt: { base: <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />, detail: <path d="M9 8h6M9 12h6" /> },
  pin: {
    base: <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />,
    detail: <circle cx="12" cy="9.5" r="2.5" />,
  },
  phone: {
    base: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  },
  share: { base: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" /> },
  download: { base: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" /> },
  search: { base: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></> },
  filters: {
    base: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
  },
  bell: { base: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></> },
  heart: { base: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /> },
  shield: { base: <path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z" />, detail: <path d="m9 12 2 2 4-4" /> },
  lock: { base: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="3" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></> },
  refresh: { base: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /> },
  user: { base: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></> },
  userMinus: {
    base: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 11h6" />
      </>
    ),
  },
  chat: { base: <path d="M4 5h16v11H9l-5 4z" /> },
  link: {
    base: (
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    ),
  },
  building: { base: <path d="M3 21h18M5 21V8l7-5 7 5v13M10 21v-5h4v5M12 9v4M10 11h4" /> },
  globe: { base: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></> },
  help: { base: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></> },
  logout: { base: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /> },
  edit: { base: <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16z" /> },
  alert: { base: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.5h.01" /></> },
  wifiOff: {
    base: (
      <>
        <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.3M19 13a10 10 0 0 0-2-1.5M2 9.5a15 15 0 0 1 4.5-2.8M22 9.5A15 15 0 0 0 11 5.1" />
        <circle cx="12" cy="20" r="0.8" fill="currentColor" />
      </>
    ),
  },
  upload: { base: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" /> },
};

export type IconName = keyof typeof g;

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

export function Icon({ name, size = 22, strokeWidth = 1.8, filled = false, className }: Props) {
  const glyph = g[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={`flex-none ${className ?? ''}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph.base}
      {glyph.detail && (filled ? <g stroke="#FDFCFB" fill="none">{glyph.detail}</g> : glyph.detail)}
    </svg>
  );
}
