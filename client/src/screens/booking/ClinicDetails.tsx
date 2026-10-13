import { Link, useParams } from 'react-router-dom';
import { Flower } from '../../components/ui/Art';
import { Avatar, Tag } from '../../components/ui/Bits';
import { ArrowButton, BackButton, Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, BarSummary, Screen } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/Overlay';
import { nextAvailable } from '../../lib/availability';
import { dow, relativeDay, rupees } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';
import { shareOrCopy } from '../../lib/share';
import { useStartBooking } from './useStartBooking';

export function ClinicDetails() {
  const { id } = useParams();
  const { data } = usePortalData();
  const toast = useToast();
  const startBooking = useStartBooking();
  const clinic = clinicById(data, id);
  if (!clinic) return <NotFound />;

  const doctors = data.doctors
    .filter((d) => d.clinics.some((c) => c.clinicId === clinic.id))
    .map((d) => ({ d, next: nextAvailable(d, clinic.id, data.appointments), sched: d.clinics.find((c) => c.clinicId === clinic.id)! }));
  const soonest = [...doctors].filter((x) => x.next).sort((a, b) => `${a.next!.date}`.localeCompare(`${b.next!.date}`))[0];
  const yourVisits = new Set(data.records.filter((r) => r.clinicId === clinic.id).map((r) => r.date)).size;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}`)}`;

  return (
    <div className="mx-auto w-full tablet:max-w-[880px] tablet:px-9 tablet:pt-10">
      <div className="relative h-[270px] overflow-hidden rounded-b-[36px] bg-[linear-gradient(160deg,#FFB690_0%,#FFA7DC_70%)] tablet:rounded-[36px]">
        <Flower size={230} className="absolute -right-10 top-[50px] rotate-[16deg]" />
        <Flower size={90} color="#FDFCFB" bold={false} className="absolute left-[150px] top-[150px]" />
        <span className="absolute right-[34px] top-[120px] rounded-full bg-surface/70 px-3 py-1.5 text-[13px] font-medium">[Clinic photo]</span>
        <div className="absolute inset-x-5 top-[max(24px,env(safe-area-inset-top))] flex justify-between tablet:top-6">
          <BackButton fallback="/discover" tone="solid" />
          <IconButton icon="share" label="Share clinic" tone="solid" onClick={() => shareOrCopy(clinic.name, toast)} />
        </div>
        <span className="absolute bottom-[22px] left-5 flex h-[72px] w-[72px] items-center justify-center rounded-card bg-surface text-[22px] font-bold">
          {clinic.initials}
        </span>
      </div>

      <Screen className="!pt-[18px] tablet:!px-0">
        <Tag tone="ok" className="self-start text-[12px]">
          Open now · until {clinic.openUntil}
        </Tag>
        <h1 className="m-0 mt-2.5 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em]">{clinic.name}</h1>
        <span className="mt-1.5 text-[14px] leading-[1.45] text-text-muted">{clinic.address}</span>

        <div className="mt-4 flex gap-2">
          <a href={`tel:${clinic.phone.replace(/\s/g, '')}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white bg-surface text-[14px] font-medium">
            <Icon name="phone" size={18} />
            Call
          </a>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white bg-surface text-[14px] font-medium">
            <Icon name="pin" size={18} />
            Directions
          </a>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ['Hours', clinic.hours],
            ['Fees from', rupees(clinic.feesFrom)],
            ['Your visits', yourVisits ? `${yourVisits} here` : 'None yet'],
          ].map(([k, v]) => (
            <div key={k} className="card flex flex-col gap-1 !rounded-[20px] p-3.5">
              <span className="text-[12px] text-text-caption">{k}</span>
              <span className="text-[15px] font-semibold">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-[26px] flex items-center justify-between">
          <h2 className="h2-lg">Doctors</h2>
          <span className="text-[14px] text-text-muted">{clinic.doctorCount} doctors</span>
        </div>
        <div className="card mt-3 px-4 py-1">
          {doctors.map(({ d, next, sched }) => {
            const isToday = next && relativeDay(next.date) === 'Today';
            return (
              <Link key={d.id} to={`/doctors/${d.id}?clinic=${clinic.id}`} className="row">
                <Avatar initials={d.initials} color={d.color} size={44} textSize={14} />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{d.name}</span>
                  <span className="text-[13px] text-text-caption">
                    {d.speciality} · {sched.schedule.split(' · ')[0]}
                  </span>
                </span>
                {next && (
                  <Tag tone={isToday ? 'ink' : 'tint'} className="text-[12px]">
                    {isToday ? 'Today' : dow(next.date)}
                  </Tag>
                )}
              </Link>
            );
          })}
        </div>

        <h2 className="h2-lg mt-[26px]">Services</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {clinic.services.map((s) => (
            <span key={s} className="rounded-full border border-white bg-surface px-3.5 py-2 text-[13px] font-medium">
              {s}
            </span>
          ))}
        </div>

        <ActionBar>
          <BarSummary label="Next available" value={soonest?.next ? `${relativeDay(soonest.next.date)}, ${soonest.next.times[0]}` : 'No slots soon'} />
          {soonest ? (
            <ArrowButton onClick={() => startBooking(soonest.d.id, { clinicId: clinic.id })}>Book visit</ArrowButton>
          ) : (
            <Button variant="secondary" disabled>
              Book visit
            </Button>
          )}
        </ActionBar>
      </Screen>
    </div>
  );
}
