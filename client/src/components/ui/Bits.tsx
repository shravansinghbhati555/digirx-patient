import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

/* ---------- Avatar ---------- */

interface AvatarProps {
  initials: string;
  color: string;
  size?: number;
  /** `round` for people, `soft` (squircle) for family tiles, `clinic` for clinic marks. */
  shape?: 'round' | 'soft';
  ring?: 'ink' | 'surface' | 'dashed';
  className?: string;
  textSize?: number;
}

export function Avatar({ initials, color, size = 40, shape = 'round', ring, className = '', textSize }: AvatarProps) {
  const radius = shape === 'round' ? 9999 : Math.round(size * 0.34);
  const ringCls =
    ring === 'ink'
      ? 'border-2 border-ink'
      : ring === 'surface'
        ? 'border-[3px] border-surface'
        : ring === 'dashed'
          ? 'border-[1.5px] border-dashed border-[#C9B8C4]'
          : '';
  return (
    <span
      className={`flex flex-none items-center justify-center font-semibold text-ink ${ringCls} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: textSize ?? Math.max(11, Math.round(size * 0.32)),
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Gradient clinic mark, e.g. "SF" on peach→pink. */
export function ClinicMark({ initials, gradient, size = 44 }: { initials: string; gradient: string; size?: number }) {
  return (
    <span
      className={`flex flex-none items-center justify-center font-bold ${gradient}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), fontSize: Math.round(size * 0.3) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/* ---------- Tags ---------- */

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'ink' | 'neutral' | 'tint' | 'surface';

const tones: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok-fg',
  warn: 'bg-warn-bg text-warn-fg',
  bad: 'bg-bad-bg text-bad-fg',
  info: 'bg-info-bg text-info-fg',
  ink: 'bg-ink text-surface',
  neutral: 'bg-divider text-text-muted',
  tint: 'bg-tint text-ink',
  surface: 'bg-surface text-ink',
};

export function Tag({ children, tone = 'tint', className = '', style }: { children: ReactNode; tone?: Tone; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${tones[tone]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

/* ---------- Chips ---------- */

interface ChipProps {
  children: ReactNode;
  on?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** Unselected surface: `glass` on gradients, `tint` inside sheets/cards. */
  surface?: 'glass' | 'tint' | 'solid';
  removable?: boolean;
  className?: string;
}

const chipSizes = { sm: 'h-[36px] px-[14px] text-[13px]', md: 'h-[40px] px-4 text-[14px]', lg: 'h-[44px] px-[18px] text-[15px]' };
const chipOff = { glass: 'bg-surface/85', tint: 'bg-tint', solid: 'bg-surface border border-white' };

export function Chip({ children, on, onClick, size = 'sm', surface = 'glass', removable, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors ${chipSizes[size]} ${on ? 'bg-ink text-surface' : chipOff[surface]} ${className}`}
    >
      {children}
      {removable && <Icon name="close" size={15} />}
    </button>
  );
}

/* ---------- Segmented tabs ---------- */

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid rounded-full bg-surface/55 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`h-10 rounded-full text-[14px] transition-colors ${on ? 'bg-surface font-semibold shadow-seg' : 'font-medium'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Toggle ---------- */

export function Toggle({ on, onChange, label }: { on: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange?.(!on)}
      className={`flex h-8 w-[52px] flex-none rounded-full p-[3px] transition-colors ${on ? 'justify-end bg-ink' : 'justify-start bg-knob'}`}
    >
      <span className="h-[26px] w-[26px] rounded-full bg-surface shadow-knob" />
    </button>
  );
}

/* ---------- Section header ---------- */

export function SectionHeader({ title, to, action = 'See all', className = '', level = 'h2-lg' }: { title: ReactNode; to?: string; action?: string; className?: string; level?: 'h2' | 'h2-lg' }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className={level}>{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-1.5 text-[14px] font-medium">
          {action}
          <Icon name="arrow" size={18} />
        </Link>
      )}
    </div>
  );
}

/* ---------- Info note ---------- */

export function Note({ icon = 'shield', children, to, tone = 'hero' }: { icon?: 'shield' | 'lock' | 'clock' | 'alert'; children: ReactNode; to?: string; tone?: 'hero' | 'glass' | 'warn' }) {
  const bg = tone === 'hero' ? 'bg-hero-soft' : tone === 'warn' ? 'bg-warn-bg text-[#5A3700]' : 'bg-surface/70';
  const inner = (
    <>
      <Icon name={icon} size={20} className={tone === 'warn' ? 'mt-px text-warn-fg' : 'mt-px'} />
      <span className="text-[13px] leading-[1.45]">{children}</span>
    </>
  );
  const cls = `flex items-start gap-2.5 rounded-input px-[14px] py-3 ${bg}`;
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ---------- List row with icon tile ---------- */

export function IconTile({ icon, bg, color, size = 40, radius = 13 }: { icon: Parameters<typeof Icon>[0]['name']; bg: string; color?: string; size?: number; radius?: number }) {
  return (
    <span className="flex flex-none items-center justify-center" style={{ width: size, height: size, borderRadius: radius, background: bg, color }}>
      <Icon name={icon} size={20} />
    </span>
  );
}
