import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSoft' | 'light' | 'glass';
type Size = 'lg' | 'md' | 'sm' | 'xs';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-surface',
  secondary: 'bg-tint text-ink',
  danger: 'bg-danger text-surface',
  dangerSoft: 'bg-bad-bg text-bad-fg',
  light: 'bg-surface text-ink',
  glass: 'bg-surface/75 text-ink',
};

const sizes: Record<Size, string> = {
  lg: 'h-[56px] px-6 text-[15px]',
  md: 'h-[52px] px-[22px] text-[15px]',
  sm: 'h-[44px] px-[18px] text-[14px]',
  xs: 'h-[38px] px-[14px] text-[13px]',
};

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  block?: boolean;
  className?: string;
  to?: string;
  state?: unknown;
  replace?: boolean;
}

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

/** Pill button. Renders a router Link when `to` is set. */
export function Button({ children, variant = 'primary', size = 'lg', icon, block, className = '', to, state, replace, ...rest }: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${block ? 'w-full flex-1' : ''} ${className}`;
  const body = (
    <>
      {icon && <Icon name={icon} size={size === 'xs' ? 16 : 18} />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} state={state} replace={replace} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {body}
    </button>
  );
}

interface ArrowProps extends Omit<ButtonProps, 'icon' | 'size' | 'variant'> {
  /** Trailing glyph inside the pink circle. */
  glyph?: 'arrow' | 'check';
  /** `wide` = full-width bar CTA (label left, circle right). */
  wide?: boolean;
  tone?: 'ink' | 'glass';
}

/** Signature CTA: near-black pill with a pink arrow circle. */
export function ArrowButton({ children, glyph = 'arrow', wide, tone = 'ink', className = '', to, state, replace, ...rest }: ArrowProps) {
  const base =
    tone === 'ink'
      ? 'bg-ink text-surface'
      : 'bg-surface/70 text-ink border border-white/90';
  const circle = tone === 'ink' ? 'bg-pink text-ink' : 'bg-ink text-surface';
  const cls = wide
    ? `flex h-[58px] w-full items-center justify-between rounded-full pl-6 pr-2 text-[16px] font-semibold ${base} ${className}`
    : `inline-flex h-[56px] items-center gap-3 rounded-full pl-[22px] pr-2 text-[15px] font-semibold ${base} ${className}`;
  const body = (
    <>
      <span>{children}</span>
      <span className={`flex items-center justify-center rounded-full ${circle} ${wide ? 'h-[42px] w-[42px]' : 'h-10 w-10'}`}>
        <Icon name={glyph === 'check' ? 'check' : 'arrow'} size={glyph === 'check' ? 18 : 20} strokeWidth={glyph === 'check' ? 2.2 : 1.8} />
      </span>
    </>
  );
  if (to) {
    return (
      <Link to={to} state={state} replace={replace} className={`${cls} transition-opacity hover:opacity-90`}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={`${cls} transition-opacity hover:opacity-90 disabled:opacity-50`} {...rest}>
      {body}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  label: string;
  to?: string;
  tone?: 'glass' | 'tint' | 'ink' | 'solid';
  round?: boolean;
  badge?: boolean;
  size?: number;
}

const iconTones = {
  glass: 'bg-surface/85 border border-white',
  solid: 'bg-surface border border-white',
  tint: 'bg-tint',
  ink: 'bg-ink text-surface',
};

/** 44px square-ish icon button (back, share, download…). Always labelled. */
export function IconButton({ icon, label, to, tone = 'glass', round, badge, size = 44, className = '', ...rest }: IconButtonProps) {
  const cls = `relative flex flex-none items-center justify-center ${round ? 'rounded-full' : 'rounded-btn'} ${iconTones[tone]} ${className}`;
  const style = { width: size, height: size };
  const body = (
    <>
      <Icon name={icon} />
      {badge && <span className="absolute right-[11px] top-[10px] h-2 w-2 rounded-full border-[1.5px] border-surface bg-unread" />}
    </>
  );
  if (to) {
    return (
      <Link to={to} aria-label={label} className={cls} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} className={cls} style={style} {...rest}>
      {body}
    </button>
  );
}

/** Goes back in history when there is somewhere to go, else to `fallback`. */
export function BackButton({ fallback = '/', tone = 'glass' }: { fallback?: string; tone?: IconButtonProps['tone'] }) {
  const navigate = useNavigate();
  const canGoBack = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;
  return (
    <IconButton
      icon="back"
      label="Back"
      tone={tone}
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))}
    />
  );
}
