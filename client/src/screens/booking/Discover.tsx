import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClinicCard, DoctorCard } from '../../components/domain';
import { SectionHeader } from '../../components/ui/Bits';
import { BackButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { nextAvailable, useAvailabilityVersion } from '../../lib/availability';
import { relativeDay } from '../../lib/format';
import { usePortalData } from '../../state/portal';

export function Discover() {
  const { data } = usePortalData();
  useAvailabilityVersion();

  const [location, setLocation] = useState('Detecting location...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Location unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) throw new Error('Location lookup failed');

          const result = await response.json();

          const address = result.address;

          const city =
            address.city ||
            address.town ||
            address.city_district ||
            address.village ||
            address.county;

          setLocation(city || 'Location unavailable');
        } catch {
          setLocation('Location unavailable');
        }
      },
      () => {
        setLocation('Location unavailable');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  const visited = new Set(data.records.map((r) => r.clinicId));
  const clinics = [...data.clinics].sort((a, b) => a.distanceKm - b.distanceKm);

  const today = data.doctors
    .filter((d) => d.bookable !== false)
    .map((d) => ({
      d,
      next: nextAvailable(d, d.clinics[0].clinicId, data.appointments),
    }))
    .filter((x) => x.next && relativeDay(x.next.date) === 'Today');

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <BackButton fallback="/" />

        <span className="flex items-center gap-1.5 rounded-full bg-surface/70 px-3.5 py-2.5 text-[14px] font-medium">
          <Icon name="pin" size={16} />
          {location}
        </span>
      </div>

      <h1 className="h1 mt-[22px]">Who would you like to see?</h1>

      <Link to="/search" className="mt-[18px] flex h-14 items-center gap-2.5 rounded-full border border-white bg-surface pl-[18px] pr-1.5">
        <Icon name="search" />
        <span className="flex-1 text-[15px] text-text-caption">Doctor, clinic or speciality</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface" aria-hidden="true">
          <Icon name="filters" size={20} />
        </span>
      </Link>

      <SectionHeader title="Specialities" to="/search" className="mt-7" />

      <div className="scroller mt-3 gap-3 tablet:mr-0 tablet:grid tablet:grid-cols-3 tablet:pr-0">
        {data.specialities.map((s) => {
          const docs = data.doctors.filter((d) => d.specialityId === s.id);
          const extra = s.doctorCount - docs.length;

          return (
            <Link key={s.id} to={`/search?speciality=${s.id}`} className="card flex w-[168px] flex-none flex-col gap-1 p-4 tablet:w-auto">
              <span className="text-[13px] text-text-caption">{s.doctorCount} doctors</span>
              <span className="text-[17px] font-semibold">{s.label}</span>

              <span className="mt-[22px] flex" aria-hidden="true">
                {docs.map((d, i) => (
                  <span
                    key={d.id}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-surface text-[11px] font-semibold"
                    style={{ background: d.color, marginLeft: i ? -8 : 0 }}
                  >
                    {d.initials}
                  </span>
                ))}

                {extra > 0 && (
                  <span className="-ml-2 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-surface bg-ink text-[11px] font-semibold text-surface">
                    +{extra}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      <SectionHeader title="DigiRx clinics near you" to="/search?tab=clinics" action="All clinics" className="mt-7" />

      <div className="mt-3 grid gap-2.5 tablet:grid-cols-2">
        {clinics.map((c) => (
          <ClinicCard key={c.id} clinic={c} extraTag={visited.has(c.id) ? "You've visited" : c.tags[0]} />
        ))}
      </div>

      <SectionHeader title="Available today" to="/search?when=today" className="mt-7" />

      <div className="mt-3 grid gap-3 tablet:grid-cols-2">
        {today.length ? (
          today.map(({ d }) => <DoctorCard key={d.id} doctor={d} data={data} />)
        ) : (
          <p className="m-0 text-[14px] text-text-muted">No open slots left today. Try tomorrow.</p>
        )}
      </div>
    </Screen>
  );
}