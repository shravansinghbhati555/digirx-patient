import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SmileMark } from '../../components/ui/Art';
import { Chip, Tag, type Tone } from '../../components/ui/Bits';
import { ArrowButton, BackButton } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Layout';
import { NoResults } from '../../components/ui/States';
import { TODAY } from '../../data/mock';
import { dayMonth, plural, rupees } from '../../lib/format';
import { clinicById } from '../../lib/selectors';
import { usePortalData } from '../../state/portal';
import type { Invoice, InvoiceStatus } from '../../types';

export function invoiceTag(i: Invoice): { label: string; tone: Tone } {
  if (i.status === 'due') return { label: 'Due', tone: 'warn' };
  if (i.status === 'refunded') return { label: 'Refunded', tone: 'info' };
  return { label: `Paid${i.method ? ` · ${i.method}` : ''}`, tone: 'ok' };
}

export function Billing() {
  const { data } = usePortalData();
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const year = TODAY.slice(0, 4);
  const sorted = [...data.invoices].sort((a, b) => b.date.localeCompare(a.date));
  const due = sorted.filter((i) => i.status === 'due');
  const paid = sorted.filter((i) => i.status === 'paid' && i.date.startsWith(year));
  const refunded = sorted.filter((i) => i.status === 'refunded' && i.date.startsWith(year));
  const list = sorted.filter((i) => filter === 'all' || i.status === filter);
  const firstDue = due[0];

  return (
    <Screen width="medium">
      <div className="flex items-center justify-between">
        <BackButton fallback="/records" />
        <span className="rounded-full bg-surface/70 px-3 py-2 text-[13px] font-medium">{year}</span>
      </div>
      <h1 className="h1 mt-5">Billing &amp; payments</h1>

      <div className="mt-4 grid gap-2.5 tablet:grid-cols-[1.4fr_1fr]">
        {firstDue ? (
          <div className="relative flex flex-col gap-1 overflow-hidden rounded-[26px] bg-hero p-5">
            <span className="text-[13px] font-medium">Amount due</span>
            <span className="text-[38px] font-semibold tracking-[-0.03em]">{rupees(due.reduce((s, i) => s + i.amount, 0))}</span>
            <span className="text-[13px]">
              {clinicById(data, firstDue.clinicId)?.name} · {firstDue.title}
              {firstDue.dueDate ? ` · due ${dayMonth(firstDue.dueDate)}` : ''}
            </span>
            <ArrowButton to={`/billing/${firstDue.id}`} className="mt-3 !h-[46px] self-start !text-[14px]">
              Pay now
            </ArrowButton>
            <SmileMark className="absolute -right-1.5 top-5 h-[90px] w-[110px]" />
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-[26px] bg-hero p-5">
            <span className="text-[13px] font-medium">Amount due</span>
            <span className="text-[38px] font-semibold tracking-[-0.03em]">₹0</span>
            <span className="text-[13px]">You're all paid up.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 tablet:grid-cols-1">
          <div className="card flex flex-col gap-1 !rounded-[20px] p-3.5">
            <span className="text-[12px] text-text-caption">Paid this year</span>
            <span className="text-[22px] font-semibold">{rupees(paid.reduce((s, i) => s + i.amount, 0))}</span>
            <span className="text-[12px] font-medium">{plural(paid.length, 'invoice')}</span>
          </div>
          <div className="card flex flex-col gap-1 !rounded-[20px] p-3.5">
            <span className="text-[12px] text-text-caption">Refunded</span>
            <span className="text-[22px] font-semibold">{rupees(refunded.reduce((s, i) => s + i.amount, 0))}</span>
            <span className="text-[12px] font-medium">{plural(refunded.length, 'cancellation')}</span>
          </div>
        </div>
      </div>

      <div className="scroller mt-[18px]">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        <Chip on={filter === 'due'} onClick={() => setFilter('due')}>
          Due{due.length ? ` · ${due.length}` : ''}
        </Chip>
        <Chip on={filter === 'paid'} onClick={() => setFilter('paid')}>
          Paid
        </Chip>
        <Chip on={filter === 'refunded'} onClick={() => setFilter('refunded')}>
          Refunds
        </Chip>
      </div>

      {list.length ? (
        <div className="card mt-3 px-4">
          {list.map((i) => {
            const tag = invoiceTag(i);
            return (
              <Link key={i.id} to={`/billing/${i.id}`} className="row !py-3.5">
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-[15px] font-semibold">{i.title}</span>
                  <span className="truncate text-[12px] text-text-caption">
                    {clinicById(data, i.clinicId)?.short} · {dayMonth(i.date)} · {i.id}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-right text-[15px] font-semibold">{rupees(i.amount)}</span>
                  <Tag tone={tag.tone}>{tag.label}</Tag>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <NoResults title="Nothing here" hint="No invoices with this status" onClear={() => setFilter('all')} />
        </div>
      )}
    </Screen>
  );
}
