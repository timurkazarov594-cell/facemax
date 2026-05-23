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
    if (data) {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch { /* ignore */ }
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readLS();

  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [loading, setLoading] = useState(!stored);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tripsModalOpen, setTripsModalOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  const loadTripsForUser = async (tok?: string | null) => {
    try {
      const t = tok ?? token;
      const { trips } = await apiFetch<{ trips: SavedTrip[] }>('/voyage/my-trips', undefined, t);
      setSavedTrips(trips);
    } catch {
      setSavedTrips([]);
    }
  };

  useEffect(() => {
    if (stored) {
      setLoading(false);
      loadTripsForUser(stored.token);
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
        .catch(() => {});
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

  const login = async (name: string, password: string): Promise<{ error?: string }> => {
    try {
      const { user: u, token: tok } = await apiFetch<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
      });
      setUser(u);
      setToken(tok);
      writeLS({ user: u, token: tok });
      setAuthModalOpen(false);
      await loadTripsForUser(tok);
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  const register = async (name: string, password: string, termsAccepted?: boolean): Promise<{ error?: string }> => {
    try {
      const { user: u, token: tok } = await apiFetch<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, password, termsAccepted: termsAccepted === true }),
      });
      setUser(u);
      setToken(tok);
      writeLS({ user: u, token: tok });
      setAuthModalOpen(false);
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }, token);
    } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    writeLS(null);
    setSavedTrips([]);
  };

  const saveTrip = async (
    data: Record<string, unknown>,
    meta: { destination: string; city?: string; duration: string; hotelName?: string }
  ): Promise<{ error?: string }> => {
    if (!user) {
      setAuthModalOpen(true);
      return { error: 'Login required' };
    }
    try {
      const { trip } = await apiFetch<{ trip: SavedTrip }>('/voyage/save-trip', {
        method: 'POST',
        body: JSON.stringify({ ...meta, data }),
      }, token);
      // Upsert in local state: replace existing if same id, else prepend
      setSavedTrips((prev) => {
        const idx = prev.findIndex((t) => t.id === trip.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = trip;
          return updated;
        }
        return [trip, ...prev];
      });
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  const deleteTrip = async (tripId: string): Promise<{ error?: string }> => {
    try {
      await apiFetch(`/voyage/trips/${tripId}`, { method: 'DELETE' }, token);
      setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
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
      login, register, logout,
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
