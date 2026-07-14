const API_BASE_URL = (window as any).__env__?.VITE_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = 'pharmaco_api_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiEnvelope<T> {
  status: number;
  message: string | null;
  data: T;
  meta?: unknown;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  let body: ApiEnvelope<T> | { message?: string; errors?: Record<string, string[]> } | null = null;
  try {
    body = await res.json();
  } catch {
    // empty body (e.g. 204)
  }

  if (!res.ok) {
    // A 401 means the token is gone/invalid server-side - clear it and tell
    // AuthContext so the cached "logged in" user doesn't outlive the session
    // (it lives in a separate localStorage key and can't see this directly).
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message = (body as { message?: string } | null)?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, (body as { errors?: Record<string, string[]> } | null)?.errors);
  }

  return ((body as ApiEnvelope<T> | null)?.data ?? (body as T)) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
