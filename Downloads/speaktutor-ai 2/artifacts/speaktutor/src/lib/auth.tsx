import { createContext, useContext, useState, useEffect, useCallback } from "react";

const JWT_KEY = "speaktutor_jwt";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, level: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getToken(): string | null {
  try { return localStorage.getItem(JWT_KEY); } catch { return null; }
}
function setToken(t: string): void {
  try { localStorage.setItem(JWT_KEY, t); } catch { /* ignore */ }
}
function clearToken(): void {
  try { localStorage.removeItem(JWT_KEY); } catch { /* ignore */ }
}

// Translates raw API/network errors into friendly Russian messages.
function translateError(raw: string): string {
  const s = raw.toLowerCase();

  // JSON parse errors (Safari: "The string did not match the expected pattern.", Chrome: "Unexpected token...")
  if (s.includes("did not match") || s.includes("unexpected token") || s.includes("json parse") || s.includes("failed to fetch") || s.includes("networkerror") || s.includes("load failed")) {
    return "Ошибка соединения с сервером. Попробуйте позже.";
  }
  if (s.includes("email") && (s.includes("invalid") || s.includes("неверный") || s.includes("already"))) {
    return "Неверный формат email";
  }
  if (s.includes("уже существует") || s.includes("already exists") || s.includes("unique") || s.includes("duplicate")) {
    return "Аккаунт с таким email уже существует";
  }
  if (s.includes("пароль") && s.includes("6")) return "Пароль слишком короткий (минимум 6 символов)";
  if (s.includes("password") && (s.includes("short") || s.includes("weak") || s.includes("6"))) {
    return "Пароль слишком короткий (минимум 6 символов)";
  }
  if (s.includes("неверный email или пароль") || s.includes("invalid") || s.includes("unauthorized") || s.includes("401")) {
    return "Неверный email или пароль";
  }
  if (s.includes("не найден") || s.includes("not found") || s.includes("404")) {
    return "Пользователь не найден";
  }
  if (s.includes("500") || s.includes("сервер") || s.includes("server")) {
    return "Ошибка сервера. Попробуйте позже.";
  }
  // If it's already in Russian, return as-is
  const hasRussian = /[а-яёА-ЯЁ]/.test(raw);
  if (hasRussian) return raw;
  // Fallback — don't show raw technical strings to the user
  return "Произошла ошибка. Попробуйте позже.";
}

// API calls always use root-absolute paths (/api/...) regardless of Vite base.
// Do NOT prepend import.meta.env.BASE_URL — that's for asset URLs, not API calls.
async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Ошибка соединения с сервером. Попробуйте позже.");
  }
  if (!res.ok) {
    const raw = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(translateError(raw));
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — validate stored token via /api/speaktutor/auth/me
  useEffect(() => {
    const token = getToken();
    if (!token) { setIsLoading(false); return; }
    apiFetch("/api/speaktutor/auth/me")
      .then((data) => setUser(data as AuthUser))
      .catch(() => { clearToken(); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/api/speaktutor/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const d = data as { token: string; user: AuthUser };
    setToken(d.token);
    setUser(d.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, level: string) => {
    const data = await apiFetch("/api/speaktutor/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name: name.trim() || null, level }),
    });
    const d = data as { token: string; user: AuthUser };
    setToken(d.token);
    setUser(d.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
