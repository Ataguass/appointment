const API_URL = 'http://localhost:3000/api/v1';

/**
 * Shared API client for staff app.
 * Attaches JWT token from localStorage to all requests.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data: T; error?: { code: string; message: string } }> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.error?.message || 'Request failed',
      json.error?.code || 'UNKNOWN',
      response.status,
    );
  }

  return json;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
