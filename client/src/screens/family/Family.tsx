import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flower } from '../../components/ui/Art';
import { Avatar, Note, Tag } from '../../components/ui/Bits';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Screen } from '../../components/ui/Layout';
import { ConfirmDialog, useToast } from '../../components/ui/Overlay';
import { usePortalData } from '../../state/portal';
import type { FamilyMember, Grants, PortalData } from '../../types';

const PARENT = ['mother', 'father', 'parent'];
const SPOUSE = ['husband', 'wife', 'spouse', 'partner'];
const CHILD = ['son', 'daughter', 'child'];

/** Positions people around "You" in a 350×320 box, mirroring the design's tree. */
function FamilyTree({ data }: { data: PortalData }) {
  const members = data.family.filter((m) => m.kind !== 'pending');
  const rel = (m: FamilyMember) => m.relation.toLowerCase();
  const parent = members.find((m) => PARENT.includes(rel(m)));
  const spouse = members.find((m) => SPOUSE.includes(rel(m)));
  const children = members.filter((m) => CHILD.includes(rel(m))).slice(0, 2);
  const others = members.filter((m) => m !== parent && m !== spouse && !children.includes(m)).slice(0, 1);
  const p = data.patient;

  const describe = [
    parent && `${parent.firstName} is ${p.firstName}'s ${rel(parent)}`,
    spouse && `${spouse.firstName} is ${p.firstName}'s ${rel(spouse)}`,
    ...children.map((c) => `${c.firstName} is their ${rel(c)}`),
    ...others.map((o) => `${o.firstName} is ${p.firstName}'s ${rel(o)}`),
  ]
    .filter(Boolean)
    .join('; ');

  const node = (initials: string, color: string, x: number, y: number, me = false) => (
    <span
      className={`absolute flex h-[60px] w-[60px] items-center justify-center rounded-[22px] border-[3px] text-[16px] font-semibold ${me ? 'border-ink' : 'border-surface'}`}
      style={{ left: x, top: y, background: color }}
    >
      {initials}
    </span>
  );
  const label = (title: string, sub: string, x: number, y: number, align: 'left' | 'center' = 'center') => (
    <span className="absolute flex w-[100px] flex-col" style={{ left: x, top: y, textAlign: align }}>
      <b className="text-[13px] font-semibold">{title}</b>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </span>
  );
  const sub = (m: FamilyMember) => `${m.relation}${m.kind === 'dependant' ? (m.age ? ` · ${m.age} yrs` : '') : ' · Linked'}`;

  return (
    <div role="img" aria-label={`Family tree: ${describe || 'just you so far'}.`} className="relative mt-3.5 h-[320px] overflow-hidden rounded-[28px] bg-family-tree">
      <Flower size={160} color="#FDFCFB" bold={false} className="absolute -right-10 -top-10 opacity-60" />
      <div className="absolute left-1/2 top-0 h-full w-[350px] -translate-x-1/2">
        {parent && <span className="absolute left-[119px] top-[70px] h-[50px] w-0.5 rounded bg-ink" />}
        {spouse && <span className="absolute left-[150px] top-[149px] h-0.5 w-[70px] rounded bg-ink" />}
        {children.length > 0 && <span className="absolute left-[184px] top-[150px] h-20 w-0.5 rounded bg-ink" />}
        {others[0] && <span className="absolute left-[60px] top-[149px] h-0.5 w-[30px] rounded bg-ink" />}

        {parent && node(parent.initials, parent.color, 90, 10)}
        {parent && label(parent.firstName, sub(parent), 158, 22, 'left')}

        {node(p.initials, p.color, 90, 120, true)}
        {label('You', p.firstName, 70, 186)}

        {spouse && node(spouse.initials, spouse.color, 220, 120)}
        {spouse && label(spouse.firstName, sub(spouse), 200, 186)}

        {children[0] && node(children[0].initials, children[0].color, 155, 230)}
        {children[0] && label(children[0].firstName, sub(children[0]), 222, 244, 'left')}

        {others[0] && node(others[0].initials, others[0].color, 0, 120)}
        {others[0] && label(others[0].firstName, sub(others[0]), -20, 186)}
      </div>
    </div>
  );
}

const grantLabels: [keyof Grants, string][] = [
  ['book', 'Book'],
  ['rx', 'Prescriptions'],
  ['reports', 'Reports'],
  ['bills', 'Bills'],
];

function MemberTags({ m }: { m: FamilyMember }) {
  if (m.shared) {
    return <Tag tone="neutral">{m.note}</Tag>;
  }
  if (m.kind === 'dependant') {
    return (
      <>
        <Tag tone="ink">You manage</Tag>
        {['Book', 'Records', 'Bills'].map((t) => (
          <Tag key={t} tone="ok">
            {t}
          </Tag>
        ))}
      </>
    );
  }
  const any = Object.values(m.theyAllow).some(Boolean);
  if (!any) {
    return (
      <Tag tone="neutral">
        <Icon name="lock" size={12} strokeWidth={2.2} />
        Connected only · nothing shared
      </Tag>
    );
  }
  return (
    <>
      {grantLabels.map(([k, l]) => (
        <Tag key={k} tone={m.theyAllow[k] ? 'ok' : 'neutral'}>
          {m.theyAllow[k] ? l : `${l} off`}
        </Tag>
      ))}
    </>
  );
}

export function Family() {
  const { data, actions } = usePortalData();
  const toast = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const pending = data.family.find((m) => m.id === cancelId);

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <h1 className="h1">Your family</h1>
        <IconButton icon="plus" label="Add family member" to="/family/add" tone="ink" round size={48} />
      </div>

      <div className="tablet:grid tablet:grid-cols-[1fr_1fr] tablet:items-start tablet:gap-5">
        <div>
          <FamilyTree data={data} />
          <div className="mt-3">
            <Note to="/privacy" tone="glass">
              <strong className="font-semibold">Being family doesn't share records.</strong> Each adult decides what you can see or do.{' '}
              <span className="font-medium underline">Manage access</span>
            </Note>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 tablet:mt-3.5">
          {data.family.map((m) =>
            m.kind === 'pending' && m.incoming ? (
              <div key={m.id} className="card flex flex-col gap-3 !bg-[rgba(255,241,214,.85)] p-3.5">
                <span className="flex items-center gap-3">
                  <Avatar initials={m.initials} color="#FDFCFB" size={46} shape="soft" ring="dashed" textSize={15} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-[16px] font-semibold">{m.name}</span>
                    <span className="text-[12px] text-text-caption">{m.note}. Nothing is shared until you choose.</span>
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button
                    size="xs"
                    onClick={async () => {
                      const res = await actions.respondInvite(m.connectionId ?? m.id, true);
                      toast(res.ok ? { message: `You're connected with ${m.firstName}` } : { message: res.error, tone: 'info' });
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={async () => {
                      const res = await actions.respondInvite(m.connectionId ?? m.id, false);
                      if (!res.ok) toast({ message: res.error, tone: 'info' });
                    }}
                  >
                    Decline
                  </Button>
                </span>
              </div>
            ) : m.kind === 'pending' ? (
              <button key={m.id} type="button" onClick={() => setCancelId(m.id)} className="card flex flex-col gap-2.5 !bg-[rgba(255,241,214,.85)] p-3.5 text-left">
                <span className="flex items-center gap-3">
                  <Avatar initials={m.initials} color="#FDFCFB" size={46} shape="soft" ring="dashed" textSize={15} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-[16px] font-semibold">{m.name}</span>
                    <span className="text-[12px] text-text-caption">
                      {m.relation} · {m.note}
                    </span>
                  </span>
                  <Tag tone="warn">Pending</Tag>
                </span>
              </button>
            ) : (
              <Link key={m.id} to={`/family/${m.id}`} className="card flex flex-col gap-2.5 p-3.5">
                <span className="flex items-center gap-3">
                  <Avatar initials={m.initials} color={m.color} size={46} shape="soft" textSize={15} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-[16px] font-semibold">{m.name}</span>
                    <span className="text-[12px] text-text-caption">
                      {m.relation} · {m.note}
                    </span>
                  </span>
                  <Icon name="forward" />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <MemberTags m={m} />
                </span>
              </Link>
            ),
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setCancelId(null)}
        onConfirm={() => {
          if (pending) {
            void actions.removeMember(pending.id).then((res) =>
              toast(res.ok ? { message: `Invite to ${pending.firstName} cancelled`, tone: 'info' } : { message: res.error, tone: 'info' }),
            );
          }
          setCancelId(null);
        }}
        icon="userMinus"
        title={`Cancel the invite to ${pending?.firstName ?? ''}?`}
        points={[{ text: "They won't be able to accept it." }, { ok: true, text: 'You can invite them again any time.' }]}
        confirmLabel="Cancel invite"
        cancelLabel="Keep"
      />
    </Screen>
  );
}
