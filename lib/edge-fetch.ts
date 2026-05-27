'use client';

import { getToken } from './desktop-auth';

const EDGE_BASE =
  process.env.NEXT_PUBLIC_EDGE_FUNCTION_BASE_URL!;

export async function edgeFetch(
  path: string,
): Promise<Response> {
  const token = await getToken();

  return fetch(
    `${EDGE_BASE}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function edgeGet<T = unknown>(path: string): Promise<T> {
  const res = await edgeFetch(path);

  if (!res.ok) {
    let errorBody: string | null = null;
    try {
      errorBody = await res.text();
    } catch { /* give up */ }
    throw new Error(`edgeFetch ${path} returned ${res.status}: ${errorBody ?? '(no body)'}`);
  }

  const body = await res.json();

  // Unwrap the { ok, data } envelope — Edge Functions use this shape.
  if (body && typeof body === 'object' && 'ok' in body && 'data' in body) {
    if (!body.ok) {
      throw new Error(`edgeFetch ${path} returned ok=false`);
    }
    return body.data as T;
  }

  // No envelope — return as-is
  return body as T;
}
