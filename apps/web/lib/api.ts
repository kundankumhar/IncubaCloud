const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export function getToken() { if (typeof window === 'undefined') return ''; return localStorage.getItem('incubacloud_token') || ''; }
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
