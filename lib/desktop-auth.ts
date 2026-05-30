'use client';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://zfushou.hasinraiyan.me';

export async function saveToken(token: string): Promise<void> {
  if (!window.desktopAuth) throw new Error('desktopAuth bridge not available');
  return window.desktopAuth.saveToken(token);
}

export async function readStoredToken(): Promise<string | null> {
  if (!window.desktopAuth) return null;
  return window.desktopAuth.readToken();
}

export async function getToken(): Promise<string | null> {
  return readStoredToken();
}

export async function deleteStoredToken(): Promise<void> {
  if (!window.desktopAuth) return;
  return window.desktopAuth.deleteToken();
}

export type AuthErrorKind =
  | 'expired'       // 401 — token/session expired
  | 'forbidden'     // 403 — user lacks permission
  | 'server'        // 5xx — server-side error
  | 'network'       // fetch threw (offline, DNS, timeout)
  | 'invalid';      // generic invalid response

export type VerificationResult = {
  valid: boolean;
  errorKind?: AuthErrorKind;
  isNetworkError?: boolean;
};

export async function verifyToken(token: string): Promise<VerificationResult> {
  const url = `${APP_URL}/api/desktop/verify`;
  console.log('[desktop-auth] verifyToken — url:', url, 'token length:', token?.length ?? 0);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    console.log('[desktop-auth] verify response — status:', res.status, res.statusText);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[desktop-auth] verify failed — status:', res.status, 'body:', text);
      if (res.status === 401) {
        return { valid: false, errorKind: 'expired' };
      }
      if (res.status === 403) {
        return { valid: false, errorKind: 'forbidden' };
      }
      if (res.status >= 500) {
        return { valid: false, errorKind: 'server' };
      }
      return { valid: false, errorKind: 'invalid' };
    }
    const text = await res.text();
    console.log('[desktop-auth] verify RAW body:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[desktop-auth] verify response is not valid JSON');
      return { valid: false, errorKind: 'invalid' };
    }
    console.log('[desktop-auth] verify PARSED:', JSON.stringify(data));
    return { valid: data.ok === true || data.valid === true, errorKind: undefined };
  } catch (err) {
    console.error('[desktop-auth] verify threw:', err);
    return { valid: false, errorKind: 'network', isNetworkError: true };
  }
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${APP_URL}/api/desktop/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // best-effort — the server may be unreachable
  }
}

export function openLoginPage(): void {
  if (window.desktopAuth) {
    window.desktopAuth.openLoginPage();
  }
}
