import { mockPortal } from '../data/mock';
import type { PortalData } from '../types';

/**
 * API boundary. Everything the screens need goes through here so the
 * mock can be swapped for the Express + MongoDB server without touching
 * components. The latency is deliberate: it lets the loading state render
 * as it will against a real network.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const LATENCY_MS = 700;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function requestOtp(phone: string): Promise<{ sentTo: string }> {
  await wait(400);
  return { sentTo: phone };
}

export async function verifyOtp(_phone: string, code: string): Promise<{ ok: boolean; attemptsLeft: number }> {
  await wait(500);
  // Demo rule: any 6 digits except all-zeros verifies.
  const ok = /^\d{6}$/.test(code) && code !== '000000';
  return { ok, attemptsLeft: ok ? 3 : 2 };
}

export async function fetchPortal(): Promise<PortalData> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/portal/me`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Portal request failed (${res.status})`);
    return (await res.json()) as PortalData;
  }
  await wait(LATENCY_MS);
  return structuredClone(mockPortal);
}
