import { useNavigate } from 'react-router-dom';
import { nextAvailable } from '../../lib/availability';
import { doctorById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import { TODAY } from '../../data/mock';
import type { ID, LocalDate } from '../../types';

/** Seeds a booking draft (soonest open slot unless one is given) and opens the slot picker. */
export function useStartBooking() {
  const { data, actions } = usePortalData();
  const navigate = useNavigate();

  return (doctorId: ID, opts: { clinicId?: ID; date?: LocalDate; time?: string; patientId?: ID } = {}) => {
    const doctor = doctorById(data, doctorId);
    if (!doctor) return;
    const clinicId = opts.clinicId ?? doctor.clinics[0].clinicId;
    const next = nextAvailable(doctor, clinicId, data.appointments);
    actions.startBooking({
      doctorId,
      clinicId,
      patientId: opts.patientId ?? data.patient.id,
      date: opts.date ?? next?.date ?? TODAY,
      time: opts.time ?? (opts.date ? '' : (next?.times[0] ?? '')),
      reason: '',
      shareRecords: false,
      payment: 'clinic',
    });
    navigate('/book');
  };
}
