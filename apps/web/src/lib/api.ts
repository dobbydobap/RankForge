const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
  ) {
    super(data?.message || `API Error: ${status}`);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, data);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };
