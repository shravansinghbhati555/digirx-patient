import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';
import { fetchPortal } from '../services/api';
import type {
  Appointment,
  BookingDraft,
  FamilyMember,
  Grants,
  ID,
  Invoice,
  LocalDate,
  Mood,
  PortalData,
  PrivacySettings,
} from '../types';
import { TODAY } from '../data/mock';

interface Session {
  phone: string;
  profileDone: boolean;
}

interface State {
  session: Session | null;
  pendingPhone: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: PortalData | null;
  mood: Mood;
  draft: BookingDraft | null;
}

type Action =
  | { type: 'startLogin'; phone: string }
  | { type: 'signIn' }
  | { type: 'completeProfile'; patch: Partial<PortalData['patient']> }
  | { type: 'logout' }
  | { type: 'loading' }
  | { type: 'loaded'; data: PortalData }
  | { type: 'failed' }
  | { type: 'mood'; mood: Mood }
  | { type: 'draft'; draft: BookingDraft | null }
  | { type: 'patchDraft'; patch: Partial<BookingDraft> }
  | { type: 'addAppointment'; appt: Appointment }
  | { type: 'cancel'; id: ID; reason: string }
  | { type: 'reschedule'; id: ID; date: LocalDate; time: string }
  | { type: 'grant'; memberId: ID; key: keyof Grants; value: boolean }
  | { type: 'removeMember'; id: ID }
  | { type: 'addMember'; member: FamilyMember }
  | { type: 'privacy'; patch: Partial<PrivacySettings> }
  | { type: 'clinicShare'; clinicId: ID; value: boolean }
  | { type: 'readNotifications'; ids?: ID[] }
  | { type: 'pay'; id: ID; method: Invoice['method'] };

const STORAGE_KEY = 'digirx.patient.v1';

const initial: State = { session: null, pendingPhone: null, status: 'idle', data: null, mood: 'great', draft: null };

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const saved = JSON.parse(raw) as Partial<State>;
    const data = saved.data ?? null;
    return {
      ...initial,
      session: saved.session ?? null,
      mood: saved.mood ?? 'great',
      draft: saved.draft ?? null,
      data,
      status: data ? 'ready' : 'idle',
    };
  } catch {
    return initial;
  }
}

function withData(s: State, fn: (d: PortalData) => PortalData): State {
  return s.data ? { ...s, data: fn(s.data) } : s;
}

function mapAppt(d: PortalData, id: ID, fn: (a: Appointment) => Appointment): PortalData {
  return { ...d, appointments: d.appointments.map((a) => (a.id === id ? fn(a) : a)) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'startLogin':
      return { ...s, pendingPhone: a.phone };
    case 'signIn':
      return { ...s, session: { phone: s.pendingPhone ?? '', profileDone: false }, pendingPhone: null };
    case 'completeProfile':
      return {
        ...withData(s, (d) => ({ ...d, patient: { ...d.patient, ...a.patch } })),
        session: s.session ? { ...s.session, profileDone: true } : s.session,
      };
    case 'logout':
      return { ...initial };
    case 'loading':
      return { ...s, status: 'loading' };
    case 'loaded':
      return { ...s, status: 'ready', data: a.data };
    case 'failed':
      return { ...s, status: 'error' };
    case 'mood':
      return { ...s, mood: a.mood };
    case 'draft':
      return { ...s, draft: a.draft };
    case 'patchDraft':
      return s.draft ? { ...s, draft: { ...s.draft, ...a.patch } } : s;
    case 'addAppointment':
      return withData(s, (d) => ({ ...d, appointments: [a.appt, ...d.appointments] }));
    case 'cancel':
      return withData(s, (d) =>
        mapAppt(d, a.id, (x) => ({
          ...x,
          status: 'cancelled',
          cancelledBy: 'you',
          outcomeNote: `Reason: ${a.reason.toLowerCase()} · No charge`,
        })),
      );
    case 'reschedule':
      return withData(s, (d) => mapAppt(d, a.id, (x) => ({ ...x, date: a.date, time: a.time })));
    case 'grant':
      return withData(s, (d) => ({
        ...d,
        family: d.family.map((m) =>
          m.id === a.memberId
            ? { ...m, youAllow: { ...m.youAllow, [a.key]: a.value }, grantsChangedOn: 'today' }
            : m,
        ),
      }));
    case 'removeMember':
      return withData(s, (d) => ({ ...d, family: d.family.filter((m) => m.id !== a.id) }));
    case 'addMember':
      return withData(s, (d) => ({ ...d, family: [...d.family, a.member] }));
    case 'privacy':
      return withData(s, (d) => ({ ...d, privacy: { ...d.privacy, ...a.patch } }));
    case 'clinicShare':
      return withData(s, (d) => ({
        ...d,
        privacy: { ...d.privacy, clinicSharing: { ...d.privacy.clinicSharing, [a.clinicId]: a.value } },
      }));
    case 'readNotifications':
      return withData(s, (d) => ({
        ...d,
        notifications: d.notifications.map((n) => (!a.ids || a.ids.includes(n.id) ? { ...n, unread: false } : n)),
      }));
    case 'pay':
      return withData(s, (d) => ({
        ...d,
        invoices: d.invoices.map((i) =>
          i.id === a.id
            ? { ...i, status: 'paid', method: a.method, paidOn: TODAY, reference: `${a.method} ref. ${Date.now().toString().slice(-12)}` }
            : i,
        ),
      }));
  }
}

function makeActions(dispatch: Dispatch<Action>, get: () => State) {
  return {
    startLogin: (phone: string) => dispatch({ type: 'startLogin', phone }),
    signIn: () => dispatch({ type: 'signIn' }),
    completeProfile: (patch: Partial<PortalData['patient']> = {}) => dispatch({ type: 'completeProfile', patch }),
    logout: () => dispatch({ type: 'logout' }),
    setMood: (mood: Mood) => dispatch({ type: 'mood', mood }),
    startBooking: (draft: BookingDraft) => dispatch({ type: 'draft', draft }),
    patchDraft: (patch: Partial<BookingDraft>) => dispatch({ type: 'patchDraft', patch }),
    clearDraft: () => dispatch({ type: 'draft', draft: null }),
    /** Creates the appointment from the current draft and returns it. */
    confirmBooking: (): Appointment | null => {
      const { draft, data } = get();
      if (!draft || !data) return null;
      const doctor = data.doctors.find((d) => d.id === draft.doctorId);
      const clinic = data.clinics.find((c) => c.id === draft.clinicId);
      if (!doctor || !clinic) return null;
      const n = String(Math.floor(10000 + Math.random() * 89999));
      const appt: Appointment = {
        id: `a-${n}`,
        code: `${clinic.id.toUpperCase()}-${n}`,
        patientId: draft.patientId,
        doctorId: doctor.id,
        clinicId: clinic.id,
        date: draft.date,
        time: draft.time,
        durationMin: doctor.durationMin,
        title: doctor.specialityId === 'gp' ? 'General consultation' : `${doctor.speciality} consultation`,
        status: 'confirmed',
        fee: doctor.fee,
        payment: draft.payment,
        reason: draft.reason || undefined,
      };
      // The draft is cleared by the confirmation screen once it mounts; clearing
      // it here would trip the booking screens' "no draft" redirect first.
      dispatch({ type: 'addAppointment', appt });
      return appt;
    },
    cancelAppointment: (id: ID, reason: string) => dispatch({ type: 'cancel', id, reason }),
    reschedule: (id: ID, date: LocalDate, time: string) => dispatch({ type: 'reschedule', id, date, time }),
    setGrant: (memberId: ID, key: keyof Grants, value: boolean) => dispatch({ type: 'grant', memberId, key, value }),
    removeMember: (id: ID) => dispatch({ type: 'removeMember', id }),
    addMember: (member: FamilyMember) => dispatch({ type: 'addMember', member }),
    setPrivacy: (patch: Partial<PrivacySettings>) => dispatch({ type: 'privacy', patch }),
    setClinicSharing: (clinicId: ID, value: boolean) => dispatch({ type: 'clinicShare', clinicId, value }),
    markRead: (ids?: ID[]) => dispatch({ type: 'readNotifications', ids }),
    payInvoice: (id: ID, method: Invoice['method'] = 'UPI') => dispatch({ type: 'pay', id, method }),
  };
}

export type PortalActions = ReturnType<typeof makeActions>;

interface Ctx {
  state: State;
  actions: PortalActions;
  reload: () => void;
}

const PortalContext = createContext<Ctx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  // Actions read the latest state through a ref so their identity stays stable.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const actions = useMemo(() => makeActions(dispatch, () => stateRef.current), []);

  const reload = useCallback(() => {
    dispatch({ type: 'loading' });
    fetchPortal()
      .then((data) => dispatch({ type: 'loaded', data }))
      .catch(() => dispatch({ type: 'failed' }));
  }, []);

  // Signed in without data (fresh login): load it.
  useEffect(() => {
    if (state.session && state.status === 'idle') reload();
  }, [state.session, state.status, reload]);

  useEffect(() => {
    try {
      const { session, data, mood, draft } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, data, mood, draft }));
    } catch {
      /* storage unavailable (private mode) — state still works in memory */
    }
  }, [state]);

  const value = useMemo(() => ({ state, actions, reload }), [state, actions, reload]);
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): Ctx {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside <PortalProvider>');
  return ctx;
}

/** For screens rendered inside the signed-in shell, where data is guaranteed. */
export function usePortalData() {
  const { state, actions } = usePortal();
  if (!state.data) throw new Error('Portal data not loaded');
  return { data: state.data, state, actions };
}
