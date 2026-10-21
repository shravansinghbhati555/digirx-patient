/**
 * HTTP client for the DigiRx patient-portal API (`/portal/*` on the shared
 * DigiRx backend).
 *
 * The access token lives in memory only. The refresh token is an httpOnly
 * cookie scoped to `/portal/auth`, so after a reload the first request gets
 * a 401, the client refreshes once through the cookie, and retries.
 */

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSignedOut: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Called when the session can no longer be refreshed (expired or revoked). */
export function setSignedOutHandler(fn: () => void) {
  onSignedOut = fn;
}

function messageOf(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join('. ');
    if (typeof m === 'string') return m;
  }
  if (status === 0) return "Can't reach DigiRx. Check your connection.";
  return 'Something went wrong. Please try again.';
}

async function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (!API_BASE) {
    throw new ApiError(0, 'Set VITE_API_BASE_URL to the DigiRx backend.');
  }
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  } catch {
    throw new ApiError(0, messageOf(null, 0));
  }
}

/** Exchange the refresh cookie for a new access token. One flight at a time. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await raw('/portal/auth/refresh', { method: 'POST' });
      if (!res.ok) return false;
      const body = (await res.json()) as { accessToken: string };
      accessToken = body.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      queueMicrotask(() => (refreshing = null));
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const req: RequestInit = json === undefined ? rest : { ...rest, body: JSON.stringify(json) };
  let res = await raw(path, req);
  if (res.status === 401 && !path.startsWith('/portal/auth/')) {
    if (await refreshSession()) res = await raw(path, req);
  }
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/portal/auth/')) {
      accessToken = null;
      onSignedOut?.();
    }
    throw new ApiError(res.status, messageOf(body, res.status), body);
  }
  return body as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
}
