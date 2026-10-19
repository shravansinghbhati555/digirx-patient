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
import * as portalApi from '../services/api';
import { API_MODE, fetchPortal, logoutSession } from '../services/api';
import { errorMessage, setSignedOutHandler } from '../services/http';
import { invalidateAvailability } from '../lib/availability';
import { payWithRazorpay } from '../lib/pay';
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

/** Outcome of an action that talks to the server. */
export type Result = { ok: true } | { ok: false; error: string };
const OK: Result = { ok: true };
const fail = (e: unknown): Result => ({ ok: false, error: errorMessage(e) });

type Action =
  | { type: 'startLogin'; phone: string }
  | { type: 'signIn'; profileDone?: boolean }
  | { type: 'completeProfile'; patch: Partial<PortalData['patient']> }
  | { type: 'logout' }
  | { type: 'loading' }
  | { type: 'loaded'; data: PortalData }
  | { type: 'failed' }
  | { type: 'mood'; mood: Mood }
  | { type: 'draft'; draft: BookingDraft | null }
  | { type: 'patchDraft'; patch: Partial<BookingDraft> }
  | { type: 'addAppointment'; appt: Appointment }
  | { type: 'replaceAppointment'; appt: Appointment }
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
    // With the real API, records are always fetched fresh, never kept on disk.
    const data = API_MODE ? null : (saved.data ?? null);
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
      return { ...s, session: { phone: s.pendingPhone ?? '', profileDone: !!a.profileDone }, pendingPhone: null, status: 'idle', data: null };
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
      return {
        ...s,
        status: 'ready',
        data: a.data,
        session: s.session && a.data.patient.profileComplete ? { ...s.session, profileDone: true } : s.session,
      };
    case 'failed':
      return { ...s, status: 'error' };
    case 'mood':
      return { ...s, mood: a.mood };
    case 'draft':
      return { ...s, draft: a.draft };
    case 'patchDraft':
      return s.draft ? { ...s, draft: { ...s.draft, ...a.patch } } : s;
    case 'addAppointment':
      return withData(s, (d) => ({ ...d, appointments: [a.appt, ...d.appointments.filter((x) => x.id !== a.appt.id)] }));
    case 'replaceAppointment':
      return withData(s, (d) => mapAppt(d, a.appt.id, () => a.appt));
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

function makeActions(dispatch: Dispatch<Action>, get: () => State, reload: () => Promise<void>) {
  /** Run a server call; refresh the portal data in the background after it. */
  const run = async (fn: () => Promise<unknown>, after?: () => void, refresh = true): Promise<Result> => {
    try {
      await fn();
      after?.();
      if (refresh) void reload();
      return OK;
    } catch (e) {
      return fail(e);
    }
  };

  return {
    startLogin: (phone: string) => dispatch({ type: 'startLogin', phone }),
    signIn: (profileDone = false) => dispatch({ type: 'signIn', profileDone }),
    /** Saves the profile (and, with the API, links matching clinic records). */
    completeProfile: async (patch: Partial<PortalData['patient']> = {}): Promise<Result & { linked?: number }> => {
      if (!API_MODE || Object.keys(patch).length === 0) {
        dispatch({ type: 'completeProfile', patch });
        return OK;
      }
      try {
        const res = await portalApi.updateProfile(patch);
        dispatch({ type: 'completeProfile', patch: res.patient });
        await reload();
        return { ok: true, linked: res.linkedRecords };
      } catch (e) {
        return fail(e);
      }
    },
    logout: () => {
      void logoutSession().catch(() => undefined);
      dispatch({ type: 'logout' });
    },
    setMood: (mood: Mood) => dispatch({ type: 'mood', mood }),
    startBooking: (draft: BookingDraft) => dispatch({ type: 'draft', draft }),
    patchDraft: (patch: Partial<BookingDraft>) => dispatch({ type: 'patchDraft', patch }),
    clearDraft: () => dispatch({ type: 'draft', draft: null }),
    /** Creates the appointment from the current draft. */
    confirmBooking: async (): Promise<{ appt: Appointment | null; error?: string }> => {
      const { draft, data } = get();
      if (!draft || !data) return { appt: null };
      const doctor = data.doctors.find((d) => d.id === draft.doctorId);
      const clinic = data.clinics.find((c) => c.id === draft.clinicId);
      if (!doctor || !clinic) return { appt: null };
      if (API_MODE) {
        try {
          const appt = await portalApi.bookAppointment(draft, data.patient.id);
          invalidateAvailability();
          dispatch({ type: 'addAppointment', appt });
          void reload();
          return { appt };
        } catch (e) {
          invalidateAvailability();
          return { appt: null, error: errorMessage(e) };
        }
      }
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
      return { appt };
    },
    cancelAppointment: async (id: ID, reason: string): Promise<Result> => {
      if (!API_MODE) {
        dispatch({ type: 'cancel', id, reason });
        return OK;
      }
      try {
        const appt = await portalApi.cancelAppointment(id, reason);
        invalidateAvailability();
        dispatch({ type: 'replaceAppointment', appt });
        void reload();
        return OK;
      } catch (e) {
        return fail(e);
      }
    },
    reschedule: async (id: ID, date: LocalDate, time: string): Promise<Result> => {
      if (!API_MODE) {
        dispatch({ type: 'reschedule', id, date, time });
        return OK;
      }
      try {
        const appt = await portalApi.rescheduleAppointment(id, date, time);
        invalidateAvailability();
        dispatch({ type: 'replaceAppointment', appt });
        return OK;
      } catch (e) {
        invalidateAvailability();
        return fail(e);
      }
    },
    setGrant: async (memberId: ID, key: keyof Grants, value: boolean): Promise<Result> => {
      const member = get().data?.family.find((m) => m.id === memberId);
      if (!API_MODE || !member?.connectionId) {
        dispatch({ type: 'grant', memberId, key, value });
        return OK;
      }
      dispatch({ type: 'grant', memberId, key, value });
      const res = await run(() => portalApi.setFamilyGrants(member.connectionId!, { [key]: value }), undefined, false);
      if (!res.ok) dispatch({ type: 'grant', memberId, key, value: !value });
      return res;
    },
    removeMember: async (id: ID): Promise<Result> => {
      if (!API_MODE) {
        dispatch({ type: 'removeMember', id });
        return OK;
      }
      const member = get().data?.family.find((m) => m.id === id);
      const target = member?.kind === 'dependant' ? id : (member?.connectionId ?? id);
      return run(() => portalApi.removeFamilyMember(target), () => dispatch({ type: 'removeMember', id }));
    },
    addMember: (member: FamilyMember) => dispatch({ type: 'addMember', member }),
    addDependant: (input: { fullName: string; dob: string; relation?: string }) =>
      run(() => portalApi.addDependant(input)),
    inviteFamily: (input: { phone: string; name?: string; relation?: string }) =>
      run(() => portalApi.inviteFamily(input)),
    respondInvite: (connectionId: ID, accept: boolean) => run(() => portalApi.respondInvite(connectionId, accept)),
    setPrivacy: async (patch: Partial<PrivacySettings>): Promise<Result> => {
      dispatch({ type: 'privacy', patch });
      if (!API_MODE) return OK;
      const { appLock, hidePreviews } = patch;
      return run(() => portalApi.updatePrivacy({ appLock, hidePreviews }), undefined, false);
    },
    setClinicSharing: async (clinicId: ID, value: boolean): Promise<Result> => {
      dispatch({ type: 'clinicShare', clinicId, value });
      if (!API_MODE) return OK;
      const res = await run(() => portalApi.setClinicSharing(clinicId, value));
      if (!res.ok) dispatch({ type: 'clinicShare', clinicId, value: !value });
      return res;
    },
    markRead: (ids?: ID[]) => {
      dispatch({ type: 'readNotifications', ids });
      if (API_MODE) void portalApi.markNotificationsRead(ids).catch(() => undefined);
    },
    payInvoice: async (id: ID, method: Invoice['method'] = 'UPI'): Promise<Result> => {
      if (!API_MODE) {
        dispatch({ type: 'pay', id, method });
        return OK;
      }
      const data = get().data;
      try {
        await payWithRazorpay(id, { name: data?.patient.name, phone: data?.patient.phone, email: data?.patient.email });
        await reload();
        return OK;
      } catch (e) {
        return fail(e);
      }
    },
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

  const fetchData = useCallback(async (background: boolean) => {
    if (!background) dispatch({ type: 'loading' });
    try {
      dispatch({ type: 'loaded', data: await fetchPortal() });
    } catch {
      if (!background) dispatch({ type: 'failed' });
    }
  }, []);
  const reload = useCallback(() => void fetchData(false), [fetchData]);
  const actions = useMemo(
    () => makeActions(dispatch, () => stateRef.current, () => fetchData(stateRef.current.data !== null)),
    [fetchData],
  );

  // An expired/revoked session (refresh failed) signs the person out.
  useEffect(() => {
    setSignedOutHandler(() => dispatch({ type: 'logout' }));
    return () => setSignedOutHandler(() => undefined);
  }, []);

  // Signed in without data (fresh login or reload): load it.
  useEffect(() => {
    if (state.session && state.status === 'idle') reload();
  }, [state.session, state.status, reload]);

  useEffect(() => {
    try {
      const { session, data, mood, draft } = state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(API_MODE ? { session, mood, draft } : { session, data, mood, draft }),
      );
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
