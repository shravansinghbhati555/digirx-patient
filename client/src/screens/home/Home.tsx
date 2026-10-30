import { Link } from 'react-router-dom';
import { MoodPicker, NextVisitCard } from '../../components/domain';
import { SmileMark } from '../../components/ui/Art';
import { Avatar, IconTile, SectionHeader, Tag } from '../../components/ui/Bits';
import { ArrowButton, IconButton } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { TODAY } from '../../lib/today';
import { daysFromToday, dayMonth, longDate, plural, relativeDay, rupees } from '../../lib/format';
import { clinicById, doctorById, unreadCount, upcoming, yearSummary } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import type { PortalData } from '../../types';

function ago(date: string) {
  const n = -daysFromToday(date);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return `${n} days ago`;
  return dayMonth(date);
}

interface Activity {
  to: string;
  icon: IconName;
  bg: string;
  title: string;
  sub: string;
  isNew?: boolean;
}

function recentActivity(d: PortalData): Activity[] {
  const out: Activity[] = [];
  const report = [...d.reports].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (report) {
    out.push({
      to: `/reports/${report.id}`,
      icon: 'flask',
      bg: '#FFE2E0',
      title: `${report.shortName ?? report.title} report added`,
      sub: `${clinicById(d, report.clinicId)?.name ?? 'Uploaded by you'} · ${ago(report.date)}`,
      isNew: report.isNew,
    });
  }
  const rx = [...d.prescriptions].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (rx) {
    out.push({ to: `/prescriptions/${rx.id}`, icon: 'pill', bg: '#FFE8DF', title: 'New prescription', sub: `${doctorById(d, rx.doctorId)?.name} · ${dayMonth(rx.date)}` });
  }
  const paid = d.invoices.filter((i) => i.status === 'paid').sort((a, b) => (b.paidOn ?? '').localeCompare(a.paidOn ?? ''))[0];
  if (paid) {
    out.push({ to: `/billing/${paid.id}`, icon: 'receipt', bg: '#ECE3FF', title: `Invoice paid · ${rupees(paid.amount)}`, sub: `${clinicById(d, paid.clinicId)?.name} · ${dayMonth(paid.paidOn ?? paid.date)}` });
  }
  return out;
}

const quick: { to: string; label: string; icon: IconName; bg: string; ink?: boolean; sub: (d: PortalData) => string }[] = [
  { to: '/discover', label: 'Book', icon: 'calendarPlus', bg: '#181818', ink: true, sub: (d) => `${d.clinics.length} clinics nearby` },
  { to: '/reports', label: 'Reports', icon: 'file', bg: '#FF8F8F', sub: (d) => `${d.reports.filter((r) => r.isNew).length || 'No'} new` },
  { to: '/prescriptions', label: 'Medicines', icon: 'pill', bg: '#FFC2A8', sub: (d) => plural(d.prescriptions.filter((p) => p.active).length, 'active course') },
  { to: '/records', label: 'History', icon: 'clock', bg: '#C9B2FF', sub: (d) => plural(d.records.length, 'record') },
];

export function Home() {
  const { data, state, actions } = usePortalData();
  const p = data.patient;
  const next = upcoming(data)[0];
  const sum = yearSummary(data);
  const unread = unreadCount(data);
  const activity = recentActivity(data);
  const members = data.family.filter((m) => m.kind !== 'pending');

  return (
    <Screen width="wide">
      {/* Phone header */}
      <div className="flex items-center gap-3 tablet:hidden">
        <Link to="/profile" aria-label="Your profile">
          <Avatar initials={p.initials} color={p.color} size={48} shape="soft" textSize={17} className="border-2 border-surface" />
        </Link>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[13px] text-text-nav">Welcome back</span>
          <span className="text-[17px] font-medium">{p.name}</span>
        </div>
        <IconButton icon="bell" to="/notifications" label={unread ? `Notifications, ${unread} unread` : 'Notifications'} badge={unread > 0} />
      </div>

      {/* Tablet header */}
      <div className="hidden items-center gap-3 tablet:flex desktop:hidden">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[14px] text-text-muted">{longDate(TODAY)}</span>
          <span className="text-[17px] font-medium">Welcome back, {p.firstName}</span>
        </span>
        <ArrowButton to="/discover" className="!h-12 !text-[15px]">
          Book a visit
        </ArrowButton>
        <IconButton icon="bell" to="/notifications" label={unread ? `Notifications, ${unread} unread` : 'Notifications'} badge={unread > 0} size={48} />
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-5 tablet:mt-[30px] desktop:mt-4">
        <h1 className="m-0 max-w-[640px] text-[31px] font-semibold leading-[1.16] tracking-[-0.025em] tablet:text-[44px] tablet:leading-[1.08] desktop:text-[clamp(32px,4vw,52px)] desktop:leading-[1.05]">
          Hello {p.firstName}! How are you feeling today?
        </h1>
        <ArrowButton to="/discover" className="hidden desktop:inline-flex">
          Book a visit
        </ArrowButton>
      </div>

      <div className="mt-[18px] tablet:mt-[26px]">
        <MoodPicker value={state.mood} onChange={actions.setMood} />
        <span className="mt-2.5 block text-[12px] text-text-nav">Shared with your doctor before your next visit.</span>
      </div>

      <div
        className="mt-5 grid grid-cols-1 gap-x-4 gap-y-6 [grid-template-areas:'next''quick''hero''family''recent'] tablet:mt-7 tablet:grid-cols-2 tablet:gap-y-4 tablet:[grid-template-areas:'next_hero''quick_quick''family_recent'] desktop:grid-cols-[2fr_1fr] desktop:gap-5 desktop:[grid-template-areas:'next_hero''quick_quick''recent_family']"
      >
        <div className="[grid-area:next]">
          {next ? (
            <NextVisitCard appt={next} data={data} large />
          ) : (
            <Link to="/discover" className="card flex flex-col gap-2 p-[18px]">
              <span className="text-[13px] font-medium">No upcoming visits</span>
              <span className="text-[23px] font-semibold tracking-[-0.02em]">Book your next visit</span>
              <span className="text-[13px] text-text-caption">Find a doctor at any DigiRx clinic.</span>
            </Link>
          )}
        </div>

        <div className="relative flex min-h-[170px] flex-col gap-1.5 overflow-hidden rounded-card bg-hero p-5 [grid-area:hero] tablet:p-[22px] desktop:min-h-[230px] desktop:rounded-[28px] desktop:p-[26px]">
          <span className="text-[13px] font-medium tablet:text-[14px]">Your health in {sum.year}</span>
          <span className="mt-[18px] text-[30px] font-semibold tracking-[-0.02em] tablet:mt-auto tablet:text-[40px] desktop:text-[44px]">{plural(sum.visits, 'visit')}</span>
          <span className="max-w-[230px] text-[14px] leading-[1.4]">
            Across {plural(sum.clinics, 'DigiRx clinic')} · {plural(sum.activeRx, 'active prescription')} · {plural(sum.newReports, 'new report')}
          </span>
          <SmileMark className="absolute -right-3.5 top-[18px]" />
        </div>

        <div className="[grid-area:quick]">
          <h2 className="h2-lg desktop:hidden">Quick actions</h2>
          <div className="mt-3 grid grid-cols-4 gap-2.5 tablet:gap-3 desktop:mt-0 desktop:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] desktop:gap-3.5">
            {quick.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="card flex flex-col items-center gap-2 !rounded-[20px] px-1.5 pb-3 pt-3.5 tablet:flex-row tablet:gap-3 tablet:p-4 desktop:!rounded-[22px] desktop:gap-3.5 desktop:p-[18px]"
              >
                <IconTile icon={q.icon} bg={q.bg} color={q.ink ? '#FDFCFB' : undefined} size={42} radius={14} />
                <span className="flex flex-col">
                  <span className="text-[12px] font-medium tablet:text-[15px] tablet:font-semibold desktop:text-[16px]">{q.label}</span>
                  <span className="hidden text-[12px] text-text-caption desktop:block">{q.sub(data)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <section className="[grid-area:family]">
          <SectionHeader title="Your family" to="/family" action="See all" className="desktop:hidden" />
          <SectionHeader title="Your family" to="/family" action="Manage" className="hidden desktop:flex" />
          {/* Phone & tablet: avatar row */}
          <div className="mt-3.5 flex gap-3.5 tablet:card tablet:mt-3 tablet:justify-between tablet:p-[18px] desktop:hidden">
            <Link to="/family" className="flex w-16 flex-col items-center gap-1.5 tablet:hidden">
              <Avatar initials={p.initials} color={p.color} size={58} shape="soft" ring="ink" />
              <span className="text-[12px] font-medium">Me</span>
            </Link>
            {members.map((m) => (
              <Link key={m.id} to={`/family/${m.id}`} className="flex w-16 flex-col items-center gap-1.5">
                <Avatar initials={m.initials} color={m.color} size={58} shape="soft" />
                <span className="text-[12px] font-medium">{m.firstName}</span>
              </Link>
            ))}
            <Link to="/family/add" aria-label="Add family member" className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-[58px] w-[58px] items-center justify-center rounded-[20px] border-[1.5px] border-dashed border-[#B9A9A6] bg-surface/70">
                <Icon name="plus" />
              </span>
              <span className="text-[12px] font-medium">Add</span>
            </Link>
          </div>
          {/* Desktop: list with each member's next visit */}
          <div className="card mt-3 hidden px-5 py-2 desktop:block">
            {members.map((m) => {
              const appt = upcoming(data).find((a) => a.patientId === m.id);
              return (
                <Link key={m.id} to={`/family/${m.id}`} className="row !py-3.5">
                  <Avatar initials={m.initials} color={m.color} size={44} shape="soft" textSize={14} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px] font-medium">{m.firstName}</span>
                    <span className="text-[12px] text-text-caption">{appt ? `${appt.title.split(' ·')[0]} · ${relativeDay(appt.date)}` : m.relation}</span>
                  </span>
                </Link>
              );
            })}
            <Link to="/family/add" className="row !py-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[15px] border-[1.5px] border-dashed border-[#B9A9A6]">
                <Icon name="plus" />
              </span>
              <span className="text-[15px] font-medium">Add a member</span>
            </Link>
          </div>
        </section>

        <section className="[grid-area:recent]">
          <SectionHeader title="Recent activity" to="/records" action="See all" />
          <div className="card mt-3 px-4 py-1.5 desktop:px-[22px]">
            {activity.map((a) => (
              <Link key={a.to} to={a.to} className="row">
                <IconTile icon={a.icon} bg={a.bg} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-medium">{a.title}</span>
                  <span className="truncate text-[12px] text-text-caption desktop:text-[13px]">{a.sub}</span>
                </span>
                {a.isNew && <Tag tone="ink">New</Tag>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
