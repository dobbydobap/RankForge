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

// Access tokens expire after 15 minutes; without a transparent refresh every
// session silently broke mid-use. On a 401 we refresh once (single-flight so
// parallel queries share it) and retry the request with the new token.
let refreshInFlight: Promise<string | null> | null = null;
let applyRefreshedAuth: ((accessToken: string, user: unknown) => void) | null = null;
let clearAuthOnFailure: (() => void) | null = null;

/** Wired up by the auth store at init (avoids a circular import). */
export function bindAuthBridge(
  onRefreshed: (accessToken: string, user: unknown) => void,
  onFailed: () => void,
) {
  applyRefreshedAuth = onRefreshed;
  clearAuthOnFailure = onFailed;
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          clearAuthOnFailure?.();
          return null;
        }
        const data = await res.json();
        if (data?.accessToken) {
          applyRefreshedAuth?.(data.accessToken, data.user);
          return data.accessToken as string;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
  isRetry = false,
): Promise<T> {
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
    if (res.status === 401 && token && !isRetry && !endpoint.startsWith('/auth/')) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return fetchApi<T>(endpoint, { ...options, token: newToken }, true);
      }
    }
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
