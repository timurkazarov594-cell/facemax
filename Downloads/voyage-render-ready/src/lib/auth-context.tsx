import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  isPremium: boolean;
}

export interface SavedTrip {
  id: string;
  createdAt: string;
  destination: string;
  city?: string;
  duration: string;
  hotelName?: string;
  data: Record<string, unknown>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  tripsModalOpen: boolean;
  openTripsModal: () => void;
  closeTripsModal: () => void;
  login: (name: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, password: string, termsAccepted?: boolean) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
  saveTrip: (
    data: Record<string, unknown>,
    meta: { destination: string; city?: string; duration: string; hotelName?: string }
  ) => Promise<{ error?: string }>;
  deleteTrip: (tripId: string) => Promise<{ error?: string }>;
  savedTrips: SavedTrip[];
  refreshTrips: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = '/api';
const LS_KEY = 'voyage_auth';
const LS_LOCAL_USERS = 'voyage_local_users';

// ── Stored session ──────────────────────────────────────────────────────────
interface StoredAuth {
  user: AuthUser;
  token: string;
}

function readLS(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeLS(data: StoredAuth | null): void {
  try {
    if (data) localStorage.setItem(LS_KEY, JSON.stringify(data));
    else localStorage.removeItem(LS_KEY);
  } catch { /* ignore */ }
}

// ── Local user store ────────────────────────────────────────────────────────
interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  isPremium: boolean;
  createdAt: string;
  termsAcceptedAt: string;
  trips: SavedTrip[];
}

function readLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(LS_LOCAL_USERS);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]): void {
  try {
    localStorage.setItem(LS_LOCAL_USERS, JSON.stringify(users));
  } catch { /* ignore */ }
}

function findLocalUser(email: string): LocalUser | null {
  return readLocalUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

function updateLocalUser(updated: LocalUser): void {
  const users = readLocalUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx >= 0) users[idx] = updated;
  writeLocalUsers(users);
}

async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback: simple deterministic string if SubtleCrypto unavailable
    let h = 0;
    for (let i = 0; i < password.length; i++) {
      h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
    }
    return 'fb_' + Math.abs(h).toString(16);
  }
}

function isLocalToken(tok: string | null): boolean {
  return typeof tok === 'string' && tok.startsWith('local_');
}

function makeLocalToken(userId: string): string {
  return 'local_' + userId;
}

// ── API fetch (throws on non-2xx) ────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body.error as string | undefined) ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readLS();

  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [loading, setLoading] = useState(!stored);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tripsModalOpen, setTripsModalOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // ── Trip loading ────────────────────────────────────────────────────────────
  const loadTripsForUser = async (tok?: string | null, userId?: string) => {
    const t = tok ?? token;
    const uid = userId ?? user?.id;

    if (isLocalToken(t)) {
      // Load from localStorage
      if (!uid) { setSavedTrips([]); return; }
      const localUser = readLocalUsers().find(u => u.id === uid);
      setSavedTrips(localUser ? [...(localUser.trips ?? [])].reverse() : []);
      return;
    }

    try {
      const { trips } = await apiFetch<{ trips: SavedTrip[] }>('/voyage/my-trips', undefined, t);
      setSavedTrips(trips);
    } catch {
      setSavedTrips([]);
    }
  };

  // ── On mount: verify session ────────────────────────────────────────────────
  useEffect(() => {
    if (stored) {
      setLoading(false);
      loadTripsForUser(stored.token, stored.user.id);

      // Local token — no API verification needed
      if (isLocalToken(stored.token)) return;

      // Backend token — verify it's still valid
      apiFetch<{ user: AuthUser | null }>('/auth/me', undefined, stored.token)
        .then(({ user: u }) => {
          if (u) {
            setUser(u);
            writeLS({ user: u, token: stored.token });
          } else {
            setUser(null);
            setToken(null);
            writeLS(null);
          }
        })
        .catch(() => {
          // Backend unreachable — keep local session as-is
        });
    } else {
      apiFetch<{ user: AuthUser | null }>('/auth/me')
        .then(({ user: u }) => {
          if (u) setUser(u);
          else setUser(null);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (name: string, password: string, termsAccepted?: boolean): Promise<{ error?: string }> => {
    // 1. Try backend first
    try {
      const { user: u, token: tok } = await apiFetch<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), password, termsAccepted: termsAccepted === true }),
      });
      setUser(u);
      setToken(tok);
      writeLS({ user: u, token: tok });
      setAuthModalOpen(false);
      await loadTripsForUser(tok, u.id);
      return {};
    } catch {
      // Backend unavailable — fall through to local fallback
    }

    // 2. Local fallback
    const email = name.trim();
    if (findLocalUser(email)) {
      return { error: 'Пользователь уже существует' };
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const localUser: LocalUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      isPremium: false,
      createdAt: now,
      termsAcceptedAt: termsAccepted ? now : '',
      trips: [],
    };

    const users = readLocalUsers();
    users.push(localUser);
    writeLocalUsers(users);

    const authUser: AuthUser = { id: localUser.id, name: localUser.email, isPremium: false };
    const tok = makeLocalToken(localUser.id);
    setUser(authUser);
    setToken(tok);
    writeLS({ user: authUser, token: tok });
    setAuthModalOpen(false);
    try { localStorage.setItem('voyage_agreement_accepted', now); } catch { /* ignore */ }
    setSavedTrips([]);
    return {};
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = async (name: string, password: string): Promise<{ error?: string }> => {
    // 1. Try backend first
    try {
      const { user: u, token: tok } = await apiFetch<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), password }),
      });
      setUser(u);
      setToken(tok);
      writeLS({ user: u, token: tok });
      setAuthModalOpen(false);
      await loadTripsForUser(tok, u.id);
      return {};
    } catch (e) {
      const msg = (e as Error).message ?? '';
      // If backend explicitly rejected credentials, honour that
      if (
        msg.toLowerCase().includes('неверный') ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('401') ||
        msg.toLowerCase().includes('not found')
      ) {
        // Still try localStorage in case the user registered locally
      }
    }

    // 2. Local fallback
    const email = name.trim();
    const localUser = findLocalUser(email);
    if (!localUser) {
      return { error: 'Неверный email или пароль' };
    }

    const hash = await hashPassword(password);
    if (hash !== localUser.passwordHash) {
      return { error: 'Неверный email или пароль' };
    }

    const authUser: AuthUser = { id: localUser.id, name: localUser.email, isPremium: localUser.isPremium };
    const tok = makeLocalToken(localUser.id);
    setUser(authUser);
    setToken(tok);
    writeLS({ user: authUser, token: tok });
    setAuthModalOpen(false);
    await loadTripsForUser(tok, localUser.id);
    return {};
  };

  // ── Refresh premium status ───────────────────────────────────────────────────
  const refreshPremiumStatus = async () => {
    const stored = readLS();
    if (!stored) return;

    // Local users: check /api/payment/status and update localStorage + state
    if (isLocalToken(stored.token)) {
      try {
        const res = await fetch(`${API}/payment/status`, { credentials: 'include' });
        if (res.ok) {
          const { isPremium } = await res.json() as { isPremium: boolean };
          if (isPremium) {
            const updatedUser = { ...stored.user, isPremium: true };
            writeLS({ user: updatedUser, token: stored.token });
            setUser(updatedUser);
          }
        }
      } catch { /* ignore */ }
      return;
    }

    // Backend users: re-fetch /auth/me which returns the latest isPremium
    try {
      const { user: u } = await apiFetch<{ user: AuthUser | null }>('/auth/me', undefined, stored.token);
      if (u) {
        writeLS({ user: u, token: stored.token });
        setUser(u);
      }
    } catch { /* ignore */ }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (!isLocalToken(token)) {
      try { await apiFetch('/auth/logout', { method: 'POST' }, token); } catch { /* ignore */ }
    }
    setUser(null);
    setToken(null);
    writeLS(null);
    setSavedTrips([]);
  };

  // ── Save trip ────────────────────────────────────────────────────────────────
  const saveTrip = async (
    data: Record<string, unknown>,
    meta: { destination: string; city?: string; duration: string; hotelName?: string }
  ): Promise<{ error?: string }> => {
    if (!user) {
      setAuthModalOpen(true);
      return { error: 'Login required' };
    }

    if (isLocalToken(token)) {
      // Local user — save directly to localStorage
      const localUser = readLocalUsers().find(u => u.id === user.id);
      if (!localUser) return { error: 'Пользователь не найден' };

      const trip: SavedTrip = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        destination: meta.destination,
        city: meta.city,
        duration: meta.duration,
        hotelName: meta.hotelName,
        data,
      };

      // Dedup by destination+duration
      const key = `${meta.destination.toLowerCase()}|${meta.duration.toLowerCase()}`;
      const existing = localUser.trips.findIndex(
        t => `${t.destination.toLowerCase()}|${t.duration.toLowerCase()}` === key
      );
      if (existing >= 0) {
        localUser.trips[existing] = { ...localUser.trips[existing], ...trip, id: localUser.trips[existing].id };
      } else {
        if (localUser.trips.length >= 50) localUser.trips.shift();
        localUser.trips.push(trip);
      }
      updateLocalUser(localUser);

      setSavedTrips((prev) => {
        const idx = prev.findIndex(t => t.id === trip.id);
        if (idx >= 0) { const u = [...prev]; u[idx] = trip; return u; }
        return [trip, ...prev];
      });
      return {};
    }

    // Backend user
    try {
      const { trip } = await apiFetch<{ trip: SavedTrip }>('/voyage/save-trip', {
        method: 'POST',
        body: JSON.stringify({ ...meta, data }),
      }, token);
      setSavedTrips((prev) => {
        const idx = prev.findIndex(t => t.id === trip.id);
        if (idx >= 0) { const u = [...prev]; u[idx] = trip; return u; }
        return [trip, ...prev];
      });
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  // ── Delete trip ──────────────────────────────────────────────────────────────
  const deleteTrip = async (tripId: string): Promise<{ error?: string }> => {
    if (isLocalToken(token) && user) {
      const localUser = readLocalUsers().find(u => u.id === user.id);
      if (localUser) {
        localUser.trips = localUser.trips.filter(t => t.id !== tripId);
        updateLocalUser(localUser);
      }
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
      return {};
    }

    try {
      await apiFetch(`/voyage/trips/${tripId}`, { method: 'DELETE' }, token);
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
      tripsModalOpen,
      openTripsModal: () => { setTripsModalOpen(true); loadTripsForUser(); },
      closeTripsModal: () => setTripsModalOpen(false),
      login, register, logout, refreshPremiumStatus,
      saveTrip, deleteTrip, savedTrips,
      refreshTrips: () => loadTripsForUser(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
