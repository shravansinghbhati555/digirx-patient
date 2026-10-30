import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Chip } from '../../components/ui/Bits';
import { IconButton } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { PageHeader, Screen } from '../../components/ui/Layout';
import { EmptyState } from '../../components/ui/States';
import { faces } from '../../components/ui/Art';
import { usePortalData } from '../../state/portal';
import type { NotificationKind } from '../../types';

const look: Record<NotificationKind, { icon: IconName; bg: string; color?: string }> = {
  appointment: { icon: 'calendar', bg: '#181818', color: '#FDFCFB' },
  records: { icon: 'flask', bg: '#FF8F8F' },
  family: { icon: 'family', bg: '#C9B2FF' },
  medicine: { icon: 'pill', bg: '#FFC2A8' },
  payment: { icon: 'check', bg: '#DDF3E4', color: '#1E6B3A' },
};

type Filter = 'all' | 'appointments' | 'records' | 'family';
const matches: Record<Filter, NotificationKind[] | null> = {
  all: null,
  appointments: ['appointment'],
  records: ['records', 'medicine', 'payment'],
  family: ['family'],
};

export function Notifications() {
  const { data, actions } = usePortalData();
  const [filter, setFilter] = useState<Filter>('all');
  const unread = data.notifications.filter((n) => n.unread).length;
  const list = data.notifications.filter((n) => !matches[filter] || matches[filter]!.includes(n.kind));
  const groups = (['Today', 'Earlier'] as const).map((g) => ({ g, items: list.filter((n) => n.group === g) })).filter((x) => x.items.length);

  return (
    <Screen>
      <PageHeader
        title="Notifications"
        back="/"
        right={<IconButton icon="filters" to="/profile" label="Notification settings" />}
      />

      <div className="scroller mt-[22px]">
        <Chip size="md" surface="solid" on={filter === 'all'} onClick={() => setFilter('all')}>
          All{unread ? ` · ${unread} new` : ''}
        </Chip>
        <Chip size="md" surface="solid" on={filter === 'appointments'} onClick={() => setFilter('appointments')}>
          Appointments
        </Chip>
        <Chip size="md" surface="solid" on={filter === 'records'} onClick={() => setFilter('records')}>
          Records
        </Chip>
        <Chip size="md" surface="solid" on={filter === 'family'} onClick={() => setFilter('family')}>
          Family
        </Chip>
      </div>

      {unread > 0 && (
        <button type="button" onClick={() => actions.markRead()} className="mt-4 self-end text-[13px] font-medium underline">
          Mark all as read
        </button>
      )}

      {groups.length === 0 && <EmptyState title="You're all caught up" body="New reminders, reports and family updates will show here." face={faces.calm} />}

      {groups.map(({ g, items }) => (
        <section key={g}>
          <h2 className="section-label mb-2.5 mt-[22px]">{g}</h2>
          <div className="flex flex-col gap-2.5">
            {items.map((n) => {
              const l = look[n.kind];
              return (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => n.unread && actions.markRead([n.id])}
                  className="flex gap-3 rounded-[22px] border border-white bg-surface/90 p-4 shadow-card"
                >
                  <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px]" style={{ background: l.bg, color: l.color }}>
                    <Icon name={l.icon} size={20} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-semibold leading-[1.3]">{n.title}</span>
                    <span className="mt-[3px] block text-[13px] leading-[1.4] text-text-muted">{n.body}</span>
                    <span className="mt-2 block text-[12px] text-text-caption">{n.when}</span>
                  </span>
                  {n.unread && (
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-unread">
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </Screen>
  );
}
