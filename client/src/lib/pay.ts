import { createPaymentOrder, verifyPayment } from '../services/api';
import { ApiError } from '../services/http';
import type { ID } from '../types';

/**
 * Online payment through Razorpay Checkout.
 *
 * The server creates the order for the bill's outstanding amount (the
 * browser never chooses the amount), Checkout collects the payment, and the
 * server verifies Razorpay's signature before recording it on the bill.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open(): void; on(ev: string, fn: (r: unknown) => void): void };

let loading: Promise<RazorpayCtor> | null = null;

function loadCheckout(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new ApiError(0, 'Payment could not start')));
    s.onerror = () => {
      loading = null;
      reject(new ApiError(0, "Couldn't load the payment window. Check your connection."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function payWithRazorpay(billId: ID, prefill: { name?: string; phone?: string; email?: string }) {
  const order = await createPaymentOrder(billId);
  if (!order.keyId) throw new ApiError(503, 'Online payment is not available yet. Please pay at the clinic.');
  const Razorpay = await loadCheckout();
  const response = await new Promise<RazorpayResponse>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'DigiRx',
      description: 'Clinic bill',
      prefill: { name: prefill.name, contact: prefill.phone?.replace(/\s/g, ''), email: prefill.email },
      handler: (r: RazorpayResponse) => resolve(r),
      modal: { ondismiss: () => reject(new ApiError(499, 'Payment cancelled')) },
    });
    rzp.on('payment.failed', () => reject(new ApiError(402, 'The payment did not go through. You have not been charged.')));
    rzp.open();
  });
  await verifyPayment(billId, response);
}
