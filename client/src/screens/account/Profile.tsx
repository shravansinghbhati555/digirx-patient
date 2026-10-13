import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, IconTile } from '../../components/ui/Bits';
import { IconButton } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { ConfirmDialog, Sheet, useToast } from '../../components/ui/Overlay';

const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'ಕನ್ನಡ (Kannada)', 'தமிழ் (Tamil)'];
import { usePortalData } from '../../state/portal';

function Item({ to, icon, bg, children, value, danger, onClick }: { to?: string; icon: IconName; bg: string; children: ReactNode; value?: string; danger?: boolean; onClick?: () => void }) {
  const inner = (
    <>
      <IconTile icon={icon} bg={bg} size={38} radius={12} />
      <span className={`flex-1 text-left ${danger ? 'font-medium' : ''}`}>{children}</span>
      {value && <span className="text-[13px] text-text-muted">{value}</span>}
      {!danger && <Icon name="forward" size={18} />}
    </>
  );
  const cls = `row !py-[13px] text-[15px] ${danger ? 'text-bad-fg' : ''}`;
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${cls} w-full`}>
      {inner}
    </button>
  );
}

export function Profile() {
  const { data, actions } = usePortalData();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const p = data.patient;
  const myClinics = new Set(data.records.map((r) => r.clinicId)).size;

  return (
    <Screen>
      <h1 className="h1">Profile</h1>

      <div className="relative mt-4 flex flex-col gap-3.5 overflow-hidden rounded-[28px] bg-hero p-[18px]">
        <span className="flex items-center gap-3.5">
          <Avatar initials={p.initials} color="#FDFCFB" size={64} shape="soft" textSize={20} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[21px] font-semibold tracking-[-0.02em]">{p.name}</span>
            <span className="text-[13px]">
              {p.phone} · {p.gender[0]} · {p.age} y
            </span>
            <span className="text-[12px] font-medium">Patient ID {p.patientCode}</span>
          </span>
          <IconButton icon="edit" label="Edit profile" to="/setup" tone="glass" size={42} />
        </span>
        <span className="flex flex-wrap gap-1.5">
          {p.healthTags.map((t) => (
            <span key={t} className="rounded-full bg-surface/75 px-2.5 py-1.5 text-[12px] font-medium">
              {t}
            </span>
          ))}
        </span>
      </div>

      <h2 className="section-label mb-2 mt-5">Account</h2>
      <div className="card px-4">
        <Item to="/setup" icon="user" bg="#FFE6D8">
          Personal &amp; health details
        </Item>
        <Item to="/discover" icon="building" bg="#FFE0F2" value={String(myClinics)}>
          My DigiRx clinics
        </Item>
        <Item to="/billing" icon="receipt" bg="#ECE3FF">
          Billing &amp; payments
        </Item>
      </div>

      <h2 className="section-label mb-2 mt-5">Preferences</h2>
      <div className="card px-4">
        <Item to="/notifications" icon="bell" bg="#FFE6D8" value="SMS, push">
          Notifications
        </Item>
        <Item icon="globe" bg="#DCEBFF" value={language} onClick={() => setLangOpen(true)}>
          Language
        </Item>
      </div>

      <h2 className="section-label mb-2 mt-5">Safety &amp; help</h2>
      <div className="card px-4">
        <Item to="/privacy" icon="shield" bg="#DDF3E4">
          Privacy &amp; security
        </Item>
        <Item to="/help" icon="help" bg="#FFF1D6">
          Help &amp; support
        </Item>
        <Item icon="logout" bg="#FFE1E1" danger onClick={() => setConfirm(true)}>
          Log out
        </Item>
      </div>
      <span className="mt-3.5 self-center text-[12px] text-text-caption">digiRx Patient · v1.0</span>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title="Language">
        <div role="radiogroup" aria-label="Language" className="mb-4 mt-4 flex flex-col gap-2">
          {LANGUAGES.map((l) => {
            const on = language === l;
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setLanguage(l);
                  setLangOpen(false);
                  toast({ message: `Language set to ${l}` });
                }}
                className={`flex items-center gap-3 rounded-input px-4 py-3.5 text-left text-[15px] font-medium ${on ? 'bg-wash-rose shadow-[inset_0_0_0_2px_#181818]' : 'bg-tint'}`}
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 border-ink">
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                </span>
                {l}
              </button>
            );
          })}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          actions.logout();
          navigate('/welcome', { replace: true });
        }}
        icon="logout"
        title="Log out of DigiRx?"
        points={[{ ok: true, text: 'Your records stay safe with your clinics.' }, { text: "You'll need an OTP to log back in." }]}
        confirmLabel="Log out"
        cancelLabel="Stay"
      />
    </Screen>
  );
}
