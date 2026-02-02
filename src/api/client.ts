const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export interface ApiError {
  error: boolean;
  message: string;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err?.message || `HTTP ${res.status}`);
  }

  return data as T;
}
