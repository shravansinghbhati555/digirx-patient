import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowButton, Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ActionBar, PageHeader, Screen } from '../../components/ui/Layout';
import { Sheet, useToast } from '../../components/ui/Overlay';
import { dayMonth, fullDate, rupees } from '../../lib/format';
import { clinicById, doctorById, person } from '../../lib/selectors';
import { shareOrCopy } from '../../lib/share';
import { invoicePdfUrl } from '../../services/api';
import { openSignedFile } from '../../lib/files';
import { usePortalData } from '../../state/portal';
import type { Invoice as InvoiceT } from '../../types';
import { NotFound } from '../system/NotFound';

const METHODS: { id: NonNullable<InvoiceT['method']>; label: string; sub: string }[] = [
  { id: 'UPI', label: 'UPI', sub: 'GPay, PhonePe, Paytm or any UPI app' },
  { id: 'Card', label: 'Debit or credit card', sub: 'Visa, Mastercard, RuPay' },
];

export function Invoice() {
  const { id } = useParams();
  const { data, actions } = usePortalData();
  const toast = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<NonNullable<InvoiceT['method']>>('UPI');
  const [paying, setPaying] = useState(false);
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) return <NotFound />;
  const clinic = clinicById(data, inv.clinicId);
  const doctor = doctorById(data, inv.doctorId);
  const total = inv.items.reduce((s, i) => s + i.amount, 0);

  const header =
    inv.status === 'due'
      ? { badge: 'DUE', line: inv.dueDate ? `Due by ${fullDate(inv.dueDate)}` : 'Payment due' }
      : inv.status === 'refunded'
        ? { badge: 'REFUNDED', line: `Refunded on ${fullDate(inv.paidOn ?? inv.date)} to ${inv.method}` }
        : { badge: 'PAID', line: `Paid on ${fullDate(inv.paidOn ?? inv.date)} via ${inv.method}` };

  const due = inv.outstanding ?? inv.amount;
  const pay = async () => {
    setPaying(true);
    const res = await actions.payInvoice(inv.id, method);
    setPaying(false);
    setPayOpen(false);
    toast(res.ok ? { message: `Paid ${rupees(due)} to ${clinic?.short}` } : { message: res.error, tone: 'info' });
  };
  const downloadPdf = () =>
    openSignedFile(() => invoicePdfUrl(inv.id), (message) => toast({ message, tone: 'info' }));

  return (
    <Screen>
      <PageHeader title="Invoice" back="/billing" right={<IconButton icon="share" label="Share invoice" onClick={() => shareOrCopy(`Invoice ${inv.id}`, toast)} />} />

      <div className="relative mt-5 overflow-hidden rounded-[28px] bg-surface shadow-[0_20px_40px_-22px_rgba(120,40,30,.4)]">
        <div className="flex flex-col gap-1 bg-hero p-5">
          <span className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">{clinic?.name}</span>
            <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-surface">
              {inv.status === 'paid' && <Icon name="check" size={12} strokeWidth={3} />}
              {header.badge}
            </span>
          </span>
          <span className="mt-2.5 text-[40px] font-semibold tracking-[-0.03em]">{rupees(inv.amount)}</span>
          <span className="text-[13px]">{header.line}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          {[
            ['Invoice no.', inv.id],
            ['Date', fullDate(inv.date)],
            ['Patient', person(data, inv.patientId)?.name ?? '—'],
            ['Doctor', doctor?.name ?? clinic?.name ?? '—'],
          ].map(([k, v]) => (
            <span key={k} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-caption">{k}</span>
              <span className="text-[13px] font-medium">{v}</span>
            </span>
          ))}
        </div>
        <div className="mx-5 mt-4 border-t-[1.5px] border-dashed border-[#EBDDDA]" />
        <div className="px-5 pt-1">
          {inv.items.map((i) => (
            <div key={i.label} className={`row justify-between text-[14px] ${i.muted ? 'text-text-muted' : ''}`}>
              <span>{i.label}</span>
              <span className={i.muted ? 'font-medium' : 'font-semibold'}>{rupees(i.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3 py-3 text-[17px]">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{rupees(total)}</span>
          </div>
        </div>
        {(inv.reference || inv.gstin) && (
          <div className="mx-5 mb-[18px] flex flex-wrap justify-between gap-2 rounded-[14px] bg-[#F9F4F3] px-3 py-2.5 text-[12px] text-text-muted">
            <span>{inv.reference ?? '—'}</span>
            {inv.gstin && <span>GSTIN {inv.gstin}</span>}
          </div>
        )}
      </div>

      <span className="mt-3.5 text-center text-[12px] leading-[1.45] text-text-muted">
        Issued by the clinic through DigiRx. For billing questions, contact {clinic?.name}.
      </span>

      <ActionBar>
        {inv.status === 'due' ? (
          <ArrowButton wide onClick={() => setPayOpen(true)}>
            Pay {rupees(due)}
          </ArrowButton>
        ) : (
          <Button block icon="download" onClick={downloadPdf}>
            Download invoice
          </Button>
        )}
      </ActionBar>

      <Sheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={`Pay ${rupees(due)}`}
        footer={
          <ArrowButton wide glyph="check" onClick={pay} disabled={paying}>
            Continue to secure payment
          </ArrowButton>
        }
      >
        <p className="m-0 mt-2 text-[14px] text-text-muted">
          {inv.title} · {clinic?.name}
          {inv.dueDate ? ` · due ${dayMonth(inv.dueDate)}` : ''}
        </p>
        <div role="radiogroup" aria-label="Payment method" className="mb-4 mt-4 flex flex-col gap-2">
          {METHODS.map((m) => {
            const on = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 rounded-input px-4 py-3.5 text-left ${on ? 'bg-wash-rose shadow-[inset_0_0_0_2px_#181818]' : 'bg-tint'}`}
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 border-ink">
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">{m.label}</span>
                  <span className="text-[12px] text-text-muted">{m.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </Screen>
  );
}
