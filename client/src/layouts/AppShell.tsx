import { useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Bits';
import { Face, faces } from '../components/ui/Art';
import { Icon, type IconName } from '../components/ui/Icon';
import { Screen } from '../components/ui/Layout';
import { DashboardSkeleton, ErrorState } from '../components/ui/States';
import { unreadCount } from '../lib/selectors';
import { usePortal } from '../state/portal';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Other path prefixes that light this item up. */
  also?: string[];
}

const phoneNav: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/appointments', label: 'Bookings', icon: 'calendar', also: ['/discover', '/search', '/clinics', '/doctors', '/book'] },
  { to: '/records', label: 'Records', icon: 'file', also: ['/reports', '/prescriptions', '/billing'] },
  { to: '/family', label: 'Family', icon: 'family' },
  { to: '/profile', label: 'More', icon: 'grid', also: ['/privacy', '/help', '/notifications'] },
];

const railNav: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/appointments', label: 'Bookings', icon: 'calendar', also: ['/discover', '/search', '/clinics', '/doctors', '/book'] },
  { to: '/records', label: 'Records', icon: 'file', also: ['/reports', '/prescriptions'] },
  { to: '/family', label: 'Family', icon: 'family' },
  { to: '/billing', label: 'Billing', icon: 'receipt' },
];

const sideNav: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/appointments', label: 'Appointments', icon: 'calendar', also: ['/discover', '/search', '/clinics', '/doctors', '/book'] },
  { to: '/records', label: 'Health records', icon: 'file', also: ['/reports'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: 'pill' },
  { to: '/billing', label: 'Billing', icon: 'receipt' },
  { to: '/family', label: 'Family', icon: 'family' },
  { to: '/help', label: 'Help', icon: 'help' },
];

function isActive(item: NavItem, path: string) {
  const match = (p: string) => (p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`));
  return match(item.to) || (item.also ?? []).some(match);
}

function BottomNav({ path }: { path: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(86px+env(safe-area-inset-bottom))] justify-around rounded-t-[28px] bg-surface px-1.5 pt-3 shadow-bar tablet:hidden"
    >
      {phoneNav.map((item) => {
        const on = isActive(item, path);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={on ? 'page' : undefined}
            className={`flex w-[66px] flex-col items-center gap-1 pt-1 text-[12px] font-medium ${on ? 'text-ink' : 'text-text-nav'}`}
          >
            <Icon name={item.icon} filled={on} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Rail({ path, initials, color }: { path: string; initials: string; color: string }) {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-24 flex-none flex-col items-center gap-2.5 border-r border-white/90 bg-surface/65 py-9 tablet:flex desktop:hidden"
    >
      <Link to="/" className="mb-[18px] text-[15px] font-bold">
        digiRx
      </Link>
      {railNav.map((item) => {
        const on = isActive(item, path);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={on ? 'page' : undefined}
            className={`flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-[18px] text-[10px] font-medium transition-colors ${on ? 'bg-ink text-surface' : 'text-text-caption hover:bg-surface'}`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        );
      })}
      <span className="flex-1" />
      <Link to="/profile" aria-label="Profile" className="rounded-btn">
        <Avatar initials={initials} color={color} size={44} shape="soft" textSize={14} ring={path.startsWith('/profile') ? 'ink' : undefined} />
      </Link>
    </nav>
  );
}

function Sidebar({ path }: { path: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 flex-none flex-col gap-6 overflow-y-auto border-r border-white/90 bg-surface/55 px-5 py-7 desktop:flex">
      <Link to="/" className="px-2 text-[24px] font-bold tracking-[-0.02em]">
        digiRx <span className="text-[13px] font-medium text-text-muted">Patient</span>
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {sideNav.map((item) => {
          const on = isActive(item, path);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={on ? 'page' : undefined}
              className={`flex h-12 items-center gap-3 rounded-[16px] px-4 text-[15px] font-medium transition-colors ${on ? 'bg-ink text-surface' : 'text-text-body hover:bg-surface/90'}`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2 rounded-[22px] bg-hero p-4">
        <Face size={40} spec={{ ...faces.smile, color: '#FDFCFB' }} />
        <span className="text-[15px] font-semibold">Get the app</span>
        <span className="text-[13px] leading-[1.4]">Reminders and reports on your phone.</span>
      </div>
    </aside>
  );
}

function DesktopTopBar({ name, initials, color, unread }: { name: string; initials: string; color: string; unread: number }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/discover');
  };
  return (
    <div className="mx-auto hidden w-full max-w-[1240px] flex-wrap items-center gap-3 px-12 pt-7 desktop:flex">
      <form role="search" onSubmit={submit} className="flex h-[52px] min-w-[280px] flex-1 items-center gap-2.5 rounded-full border border-white bg-surface px-[18px]">
        <Icon name="search" size={20} />
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <input
          id="global-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search doctors, clinics, records"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none"
        />
      </form>
      <Link
        to="/notifications"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex h-[52px] w-[52px] items-center justify-center rounded-input bg-surface"
      >
        <Icon name="bell" />
        {unread > 0 && <span className="absolute right-[15px] top-[14px] h-2 w-2 rounded-full bg-unread" />}
      </Link>
      <Link to="/profile" className="flex h-[52px] items-center gap-2.5 rounded-full bg-surface pl-1.5 pr-4 text-[15px] font-medium">
        <Avatar initials={initials} color={color} size={40} textSize={14} />
        {name}
      </Link>
    </div>
  );
}

export interface RouteHandle {
  /** Show the phone bottom nav on this route. */
  tabbar?: boolean;
}

export function AppShell() {
  const { state, reload } = usePortal();
  const { pathname } = useLocation();
  const matches = useMatches();
  const showTabbar = matches.some((m) => (m.handle as RouteHandle | undefined)?.tabbar);

  if (!state.session) return <Navigate to="/welcome" replace />;

  const data = state.data;
  const patient = data?.patient;

  let body = <Outlet />;
  if (state.status === 'error') {
    body = (
      <Screen>
        <ErrorState
          title="We couldn't load your records"
          body="DigiRx isn't responding right now. Your records are safe — try again in a moment."
          onRetry={reload}
        />
      </Screen>
    );
  } else if (!data) {
    body = (
      <Screen>
        <DashboardSkeleton message="Fetching your records from 3 clinics…" />
      </Screen>
    );
  }

  return (
    <div className="flex min-h-dvh desktop:bg-screen-wide">
      <Sidebar path={pathname} />
      <Rail path={pathname} initials={patient?.initials ?? '··'} color={patient?.color ?? '#FFC2A8'} />
      <div className="flex min-w-0 flex-1 flex-col">
        {patient && data && (
          <DesktopTopBar name={patient.name} initials={patient.initials} color={patient.color} unread={unreadCount(data)} />
        )}
        <main className="flex-1">{body}</main>
      </div>
      {showTabbar && <BottomNav path={pathname} />}
    </div>
  );
}
