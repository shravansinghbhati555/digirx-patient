import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flower, FlowerFace, faces } from '../../components/ui/Art';
import { Avatar, Tag } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { appointmentIcs } from '../../lib/calendar';
import { shortDate } from '../../lib/format';
import { clinicById, doctorById, forLabel } from '../../lib/selectors';
import { downloadText } from '../../lib/share';
import { usePortalData } from '../../state/portal';
import { NotFound } from '../system/NotFound';

export function Confirmed() {
  const { id } = useParams();
  const { data, actions } = usePortalData();
  useEffect(() => actions.clearDraft(), [actions]);
  const appt = data.appointments.find((a) => a.id === id);
  if (!appt) return <NotFound />;
  const doctor = doctorById(data, appt.doctorId);
  const clinic = clinicById(data, appt.clinicId);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-celebrate">
      <Flower size={120} color="#FDFCFB" bold={false} className="absolute -left-[30px] top-[70px] -rotate-[16deg]" />
      <Flower size={84} color="#FFD3CB" bold={false} className="absolute right-2.5 top-[260px] rotate-[20deg]" />

      <div className="relative mx-auto flex max-w-[460px] flex-col items-center px-6 pb-16 pt-[92px]">
        <FlowerFace size={190} face={faces.laughing} badge="check" />
        <h1 className="m-0 mt-5 text-center text-[36px] font-semibold leading-[1.1] tracking-[-0.03em]">You're booked!</h1>
        <p role="status" className="m-0 mt-2.5 max-w-[290px] text-center text-[15px] leading-[1.45]">
          We've sent the details by SMS. The clinic has your slot.
        </p>

        <div className="mt-[22px] flex w-full flex-col gap-3 rounded-card bg-surface p-[18px]">
          <div className="flex items-start justify-between">
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] text-text-caption">
                {shortDate(appt.date)} · {appt.time}
              </span>
              <span className="text-[20px] font-semibold">{appt.title}</span>
              {appt.patientId !== data.patient.id && <span className="text-[13px] text-text-muted">{forLabel(data, appt.patientId)}</span>}
            </span>
            <Tag tone="ok" className="text-[12px]">
              Confirmed
            </Tag>
          </div>
          <div className="flex items-center gap-3 border-t-[1.5px] border-dashed border-[#EBDDDA] pt-3">
            {doctor && <Avatar initials={doctor.initials} color={doctor.color} size={40} />}
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] font-medium">{doctor?.name}</span>
              <span className="text-[12px] text-text-caption">{clinic?.name}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-[11px] text-text-caption">Booking ID</span>
              <span className="text-[13px] font-semibold">{appt.code}</span>
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex w-full gap-2.5">
          <Button
            variant="glass"
            icon="calendar"
            block
            size="md"
            onClick={() => downloadText(`${appt.code}.ics`, appointmentIcs(appt, doctor, clinic), 'text/calendar')}
          >
            Add to calendar
          </Button>
          <Button block size="md" to={`/appointments/${appt.id}`} replace>
            View booking
          </Button>
        </div>
        <Link to="/" replace className="mt-4 text-[14px] font-medium underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
