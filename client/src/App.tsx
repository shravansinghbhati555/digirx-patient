import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, type RouteObject } from 'react-router-dom';
import { OfflineBanner } from './components/ui/States';
import { AppShell, type RouteHandle } from './layouts/AppShell';
import { Help } from './screens/account/Help';
import { Privacy } from './screens/account/Privacy';
import { Profile } from './screens/account/Profile';
import { AppointmentDetail } from './screens/appointments/AppointmentDetail';
import { Appointments } from './screens/appointments/Appointments';
import { Reschedule } from './screens/appointments/Reschedule';
import { ClinicDetails } from './screens/booking/ClinicDetails';
import { Confirmed } from './screens/booking/Confirmed';
import { Discover } from './screens/booking/Discover';
import { DoctorProfile } from './screens/booking/DoctorProfile';
import { ReviewBooking } from './screens/booking/ReviewBooking';
import { Search } from './screens/booking/Search';
import { SelectSlot } from './screens/booking/SelectSlot';
import { AddFamily } from './screens/family/AddFamily';
import { Family } from './screens/family/Family';
import { FamilyPermissions } from './screens/family/FamilyPermissions';
import { LinkAccount } from './screens/family/LinkAccount';
import { Home } from './screens/home/Home';
import { Notifications } from './screens/home/Notifications';
import { Login } from './screens/onboarding/Login';
import { Otp } from './screens/onboarding/Otp';
import { ProfileSetup } from './screens/onboarding/ProfileSetup';
import { Welcome } from './screens/onboarding/Welcome';
import { Billing } from './screens/records/Billing';
import { Invoice } from './screens/records/Invoice';
import { MedicalHistory } from './screens/records/MedicalHistory';
import { PrescriptionDetail } from './screens/records/PrescriptionDetail';
import { Prescriptions } from './screens/records/Prescriptions';
import { ReportPreview } from './screens/records/ReportPreview';
import { Reports } from './screens/records/Reports';
import { VisitDetail } from './screens/records/VisitDetail';
import { Done } from './screens/system/Done';
import { Legal } from './screens/system/Legal';
import { NotFound, RouteError } from './screens/system/NotFound';

const tab: RouteHandle = { tabbar: true };

function Root() {
  return (
    <>
      <ScrollRestoration />
      <OfflineBanner />
      <Outlet />
    </>
  );
}

const routes: RouteObject[] = [
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      // Onboarding (no shell)
      { path: '/welcome', element: <Welcome /> },
      { path: '/login', element: <Login /> },
      { path: '/otp', element: <Otp /> },
      { path: '/setup', element: <ProfileSetup /> },
      { path: '/legal', element: <Legal /> },

      // Signed-in portal
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Home />, handle: tab },
          { path: 'notifications', element: <Notifications /> },

          { path: 'discover', element: <Discover />, handle: tab },
          { path: 'search', element: <Search /> },
          { path: 'clinics/:id', element: <ClinicDetails /> },
          { path: 'doctors/:id', element: <DoctorProfile /> },
          { path: 'book', element: <SelectSlot /> },
          { path: 'book/review', element: <ReviewBooking /> },
          { path: 'book/confirmed/:id', element: <Confirmed /> },

          { path: 'appointments', element: <Appointments />, handle: tab },
          { path: 'appointments/:id', element: <AppointmentDetail /> },
          { path: 'appointments/:id/reschedule', element: <Reschedule /> },

          { path: 'records', element: <MedicalHistory />, handle: tab },
          { path: 'records/visits/:id', element: <VisitDetail /> },
          { path: 'reports', element: <Reports /> },
          { path: 'reports/:id', element: <ReportPreview /> },
          { path: 'prescriptions', element: <Prescriptions /> },
          { path: 'prescriptions/:id', element: <PrescriptionDetail /> },
          { path: 'billing', element: <Billing /> },
          { path: 'billing/:id', element: <Invoice /> },

          { path: 'family', element: <Family />, handle: tab },
          { path: 'family/add', element: <AddFamily /> },
          { path: 'family/link', element: <LinkAccount /> },
          { path: 'family/:id', element: <FamilyPermissions /> },

          { path: 'profile', element: <Profile />, handle: tab },
          { path: 'privacy', element: <Privacy /> },
          { path: 'help', element: <Help /> },

          { path: 'done', element: <Done /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
