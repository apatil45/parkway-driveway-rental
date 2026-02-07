/**
 * Fetch-based API client for client components only.
 * Use this instead of api.ts (axios) to avoid bundling Node-only deps in the client.
 */

const baseURL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : '';

function resolveUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = baseURL || '/api';
  const p = path.startsWith('/') ? path : `/${path}`;
  return base.endsWith('/') ? `${base.slice(0, -1)}${p}` : `${base}${p}`;
}

export interface ApiClientResponse<T = unknown> {
  data: T;
}

async function handleResponse<T>(res: Response): Promise<ApiClientResponse<T>> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json?.message || res.statusText || 'Request failed');
    err.response = { status: res.status, data: json };
    throw err;
  }
  return { data: json };
}

export const apiClient = {
  async get<T = unknown>(path: string, config?: RequestInit): Promise<ApiClientResponse<{ data: T }>> {
    const url = resolveUrl(path);
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      ...config,
    });
    return handleResponse<{ data: T }>(res);
  },

  async post<T = unknown>(path: string, body?: unknown, config?: RequestInit): Promise<ApiClientResponse<{ data: T }>> {
    const url = resolveUrl(path);
    const isFormData = body instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: isFormData ? {} : { 'Content-Type': 'application/json', ...config?.headers },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      ...config,
    });
    return handleResponse<{ data: T }>(res);
  },

  async put<T = unknown>(path: string, body?: unknown, config?: RequestInit): Promise<ApiClientResponse<{ data: T }>> {
    const url = resolveUrl(path);
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...config,
    });
    return handleResponse<{ data: T }>(res);
  },

  async patch<T = unknown>(path: string, body?: unknown, config?: RequestInit): Promise<ApiClientResponse<{ data: T }>> {
    const url = resolveUrl(path);
    const res = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...config,
    });
    return handleResponse<{ data: T }>(res);
  },

  async delete<T = unknown>(path: string, config?: RequestInit): Promise<ApiClientResponse<{ data: T }>> {
    const url = resolveUrl(path);
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      ...config,
    });
    return handleResponse<{ data: T }>(res);
  },
};

export default apiClient;
