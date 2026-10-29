import { SITE } from './site';

/** Server-side base (Docker internal network) or public base in the browser. */
const base = () => (typeof window === 'undefined' ? process.env.API_INTERNAL_URL ?? SITE.apiUrl : SITE.apiUrl);

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

function csrfToken() {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split('; ').find((c) => c.startsWith('te_csrf='))?.split('=')[1];
}

export async function api<T>(path: string, init: RequestInit & { revalidate?: number } = {}): Promise<T> {
  const { revalidate, headers, ...rest } = init;
  const token = csrfToken();
  const res = await fetch(`${base()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'x-te-csrf': token } : {}), ...headers },
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  } as RequestInit);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiFailure(res.status, body?.error?.code ?? 'http_error', body?.error?.message ?? `Request failed (${res.status})`, body?.error?.details);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/** Build-time / ISR fetch that never breaks a page when the API is down. */
export async function tryApi<T>(path: string, fallback: T, revalidate = 300): Promise<T> {
  if (process.env.STATIC_PREVIEW === '1') return fallback;
  try {
    return await api<T>(path, { revalidate });
  } catch {
    return fallback;
  }
}
