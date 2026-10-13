import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toggle } from '../../components/ui/Bits';
import { Icon } from '../../components/ui/Icon';
import { PageHeader, Screen } from '../../components/ui/Layout';
import { ConfirmDialog, Sheet, useToast } from '../../components/ui/Overlay';
import { fullDate } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { downloadText } from '../../lib/share';
import { usePortalData } from '../../state/portal';

export function Privacy() {
  const { data, actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [logOpen, setLogOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const pv = data.privacy;

  const exportAll = () => {
    const lines = [
      `DigiRx records export — ${data.patient.name} (${data.patient.patientCode})`,
      '',
      ...[...data.records]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((r) => `${fullDate(r.date)} · ${clinicById(data, r.clinicId)?.name} · ${r.title}\n  ${r.summary}`),
    ];
    downloadText('digirx-records.txt', lines.join('\n'));
    toast({ message: 'Your records are downloading' });
  };

  return (
    <Screen>
      <PageHeader back="/profile" />
      <h1 className="h1 mt-5">Privacy &amp; security</h1>

      <h2 className="section-label mb-2 mt-5">Cross-clinic sharing</h2>
      <span className="mb-2.5 text-[13px] leading-[1.45] text-text-muted">
        Each clinic always sees what it created. Turn on to let a clinic also see records from your other DigiRx clinics.
      </span>
      <div className="card px-4 py-1">
        {data.clinics.map((c) => {
          const on = !!pv.clinicSharing[c.id];
          return (
            <div key={c.id} className="row">
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: c.color }} />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-medium">{c.name}</span>
                <span className="text-[12px] text-text-caption">{on ? 'Can see your full DigiRx history' : 'Sees only its own records'}</span>
              </span>
              <Toggle on={on} onChange={(v) => actions.setClinicSharing(c.id, v)} label={`Share other records with ${c.name}`} />
            </div>
          );
        })}
      </div>

      <h2 className="section-label mb-2 mt-5">Security</h2>
      <div className="card px-4 py-1">
        <div className="row">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium">App lock</span>
            <span className="text-[12px] text-text-caption">Fingerprint or device PIN</span>
          </span>
          <Toggle on={pv.appLock} onChange={(v) => actions.setPrivacy({ appLock: v })} label="App lock" />
        </div>
        <div className="row">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium">Hide record previews</span>
            <span className="text-[12px] text-text-caption">Notifications won't show report names</span>
          </span>
          <Toggle on={pv.hidePreviews} onChange={(v) => actions.setPrivacy({ hidePreviews: v })} label="Hide record previews" />
        </div>
        <button type="button" onClick={() => setDevicesOpen(true)} className="row w-full text-left">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium">Signed-in devices</span>
            <span className="text-[12px] text-text-caption">This browser · Pixel 8</span>
          </span>
          <Icon name="forward" size={18} />
        </button>
      </div>

      <h2 className="section-label mb-2 mt-5">Your data</h2>
      <div className="card px-4 py-1">
        <button type="button" onClick={() => setLogOpen(true)} className="row w-full text-left">
          <span className="flex-1 text-[15px] font-medium">Consent &amp; access log</span>
          <Icon name="forward" size={18} />
        </button>
        <button type="button" onClick={exportAll} className="row w-full text-left">
          <span className="flex-1 text-[15px] font-medium">Download all my records</span>
          <Icon name="download" size={18} />
        </button>
        <button type="button" onClick={() => setDeleteOpen(true)} className="row w-full text-left text-bad-fg">
          <span className="flex-1 text-[15px] font-medium">Delete my portal account</span>
        </button>
      </div>

      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Consent & access log">
        <ul className="m-0 mb-4 mt-3 list-none p-0">
          {[
            ['2 Oct 2026', 'You changed what Sunita can see', 'Allowed: book visits'],
            ['14 Aug 2026', 'Sunita linked as your mother', 'Request accepted by you'],
            ['21 Mar 2026', 'You turned on sharing for CarePoint Diagnostics', 'CarePoint can see your full history'],
          ].map(([d, t, s]) => (
            <li key={t} className="row items-start">
              <span className="w-[86px] flex-none text-[12px] text-text-caption">{d}</span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium">{t}</span>
                <span className="text-[12px] text-text-muted">{s}</span>
              </span>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={devicesOpen} onClose={() => setDevicesOpen(false)} title="Signed-in devices">
        <ul className="m-0 mb-4 mt-3 list-none p-0">
          {[
            ['This browser', 'Active now'],
            ['Pixel 8 · DigiRx app', 'Last used yesterday'],
          ].map(([d, s], i) => (
            <li key={d} className="row">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-medium">{d}</span>
                <span className="text-[12px] text-text-caption">{s}</span>
              </span>
              {i > 0 && (
                <button type="button" className="text-[13px] font-semibold text-bad-fg" onClick={() => { setDevicesOpen(false); toast({ message: `Signed out of ${d}` }); }}>
                  Sign out
                </button>
              )}
            </li>
          ))}
        </ul>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          actions.logout();
          navigate('/welcome', { replace: true });
        }}
        icon="alert"
        title="Delete your portal account?"
        points={[
          { text: 'You lose portal access to your combined history.' },
          { text: 'Family links and access you granted end now.' },
          { ok: true, text: 'Clinics keep their own medical records, as the law requires.' },
        ]}
        confirmLabel="Delete account"
      />
    </Screen>
  );
}
