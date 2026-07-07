/**
 * Thin API client for talking to the api-server backend.
 * All calls go to /api/... which Vite proxies to the api-server in development.
 */

const TOKEN_KEY = 'sai_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  };

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body.error ?? errMsg;
    } catch { /* ignore */ }
    console.error(`[api] ${options.method ?? 'GET'} ${path} → ${res.status}:`, errMsg);
    throw new Error(errMsg);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<void> {
  const { token } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  setToken(token);
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  publicId: string;
  url: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  order: number;
  createdAt: string;
}

export async function fetchGallery(): Promise<GalleryImage[]> {
  return apiFetch('/api/gallery');
}

export async function saveImageMetadata(data: {
  publicId: string;
  title: string;
  description: string;
  category: string;
  order: number;
  featured: boolean;
}): Promise<void> {
  await apiFetch('/api/gallery/metadata', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await apiFetch('/api/gallery/delete', {
    method: 'POST',
    body: JSON.stringify({ publicId }),
  });
}

export async function reorderImages(
  items: Array<{ publicId: string; order: number }>
): Promise<void> {
  await apiFetch('/api/gallery/reorder', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}
