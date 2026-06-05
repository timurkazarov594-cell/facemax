import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, UserPlus, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Tab = 'login' | 'register';
type Lang = 'ru' | 'en';

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function LegalDocLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [missing, setMissing] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(href, { method: 'HEAD' });
      if (res.ok) { window.open(href, '_blank', 'noopener noreferrer'); return; }
    } catch { /* fall through */ }
    setMissing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMissing(false), 3500);
  };
  return (
    <span className="relative inline-block">
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}
        className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">
        {children}
      </a>
      {missing && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white/70 whitespace-nowrap pointer-events-none shadow-lg">
          Документ временно недоступен
        </span>
      )}
    </span>
  );
}

export function AuthGate() {
  const { login, register } = useAuth();
  const [lang, setLang] = useState<Lang>('ru');
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const ru = lang === 'ru';

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    setName('');
    setPassword('');
    setAgreed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(ru ? 'Введите email' : 'Enter your email');
      return;
    }
    if (tab === 'register' && !isValidEmail(name)) {
      setError(ru ? 'Введите корректный email' : 'Enter a valid email');
      return;
    }
    if (!password) {
      setError(ru ? 'Введите пароль' : 'Enter your password');
      return;
    }
    if (tab === 'register' && password.length < 6) {
      setError(ru ? 'Пароль должен быть не короче 6 символов' : 'Password must be at least 6 characters');
      return;
    }
    if (tab === 'register' && !agreed) {
      setError(ru ? 'Подтвердите согласие с правилами сервиса' : 'Please accept the terms to continue');
      return;
    }

    setLoading(true);
    setError('');

    const result =
      tab === 'login'
        ? await login(name.trim(), password)
        : await register(name.trim(), password, true);

    setLoading(false);

    if (result.error) {
      if (tab === 'login') {
        setError(ru ? 'Неверный логин или пароль' : 'Incorrect email or password');
      } else if (
        result.error.toLowerCase().includes('taken') ||
        result.error.toLowerCase().includes('exist') ||
        result.error.toLowerCase().includes('занят') ||
        result.error.toLowerCase().includes('существует') ||
        result.error.toLowerCase().includes('зарегистрирован')
      ) {
        setError(ru ? 'Пользователь уже существует' : 'This email is already registered');
      } else if (result.error.toLowerCase().includes('terms') || result.error.toLowerCase().includes('accept')) {
        setError(ru ? 'Подтвердите согласие с правилами сервиса' : 'Please accept the terms to continue');
      } else if (result.error.toLowerCase().includes('сервер') || result.error.toLowerCase().includes('server')) {
        setError(ru ? 'Ошибка сервера. Попробуйте позже.' : 'Server error. Please try again later.');
      } else {
        setError(ru ? 'Ошибка регистрации. Попробуйте снова.' : 'Registration failed. Please try again.');
      }
    } else if (tab === 'register') {
      try { localStorage.setItem('voyage_agreement_accepted', new Date().toISOString()); } catch (_) { /* ignore */ }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,175,55,0.08),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <Compass className="w-7 h-7 text-primary" />
            <span className="font-serif text-2xl tracking-widest uppercase font-medium">VOYAGE</span>
          </div>
          <p className="text-xs text-muted-foreground/40 tracking-[0.22em] uppercase">The World Awaits</p>
        </div>

        {/* Language picker */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-lg border border-white/8 bg-neutral-900/60 p-0.5">
            {(['ru', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-5 py-1.5 rounded-md text-xs font-medium tracking-widest uppercase transition-all duration-200 ${
                  lang === l
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                }`}
              >
                {l === 'ru' ? 'Русский' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-white/8 bg-neutral-900/60 p-1 mb-8">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {t === 'login'
                ? (ru ? 'Войти' : 'Log in')
                : (ru ? 'Регистрация' : 'Sign up')}
            </button>
          ))}
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/50 uppercase tracking-widest">Email</label>
              <input
                type="text"
                inputMode="email"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example@mail.com"
                autoComplete="email"
                autoFocus
                className="w-full bg-neutral-900/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/25 outline-none focus:border-primary/50 focus:bg-neutral-900 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                {ru ? 'Пароль' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register'
                    ? (ru ? 'Минимум 6 символов' : 'Min 6 characters')
                    : '••••••••'}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-neutral-900/70 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-muted-foreground/25 outline-none focus:border-primary/50 focus:bg-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Agreement checkbox — registration only */}
            {tab === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 pt-1"
              >
                <button
                  type="button"
                  onClick={() => setAgreed((v) => !v)}
                  className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors flex items-center justify-center ${
                    agreed ? 'bg-primary border-primary' : 'border-white/20 bg-neutral-900/70 hover:border-primary/50'
                  }`}
                >
                  {agreed && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                  {ru ? (
                    <>
                      Я ознакомился с правилами сайта,{' '}
                      <LegalDocLink href="/legal/terms.pdf">Пользовательским соглашением</LegalDocLink>
                      {', '}
                      <LegalDocLink href="/legal/privacy.pdf">Политикой конфиденциальности</LegalDocLink>
                      {' и '}
                      <LegalDocLink href="/legal/oferta.pdf">Офертой</LegalDocLink>
                    </>
                  ) : (
                    <>
                      I have read and agree to the{' '}
                      <LegalDocLink href="/legal/terms.pdf">Terms of Service</LegalDocLink>
                      {', '}
                      <LegalDocLink href="/legal/privacy.pdf">Privacy Policy</LegalDocLink>
                      {' and '}
                      <LegalDocLink href="/legal/oferta.pdf">Offer Agreement</LegalDocLink>
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400/80 text-center py-1"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !password || (tab === 'register' && !agreed)}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-1 bg-primary text-primary-foreground rounded-xl text-sm font-medium tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  {ru ? 'Войти' : 'Log in'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {ru ? 'Создать аккаунт' : 'Create account'}
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Bottom legal links — PDF documents */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground/25">
          <LegalDocLink href="/legal/terms.pdf">
            {ru ? 'Пользовательское соглашение' : 'Terms of Service'}
          </LegalDocLink>
          <span className="hidden sm:inline">·</span>
          <LegalDocLink href="/legal/privacy.pdf">
            {ru ? 'Политика конфиденциальности' : 'Privacy Policy'}
          </LegalDocLink>
          <span className="hidden sm:inline">·</span>
          <LegalDocLink href="/legal/oferta.pdf">
            {ru ? 'Оферта' : 'Offer Agreement'}
          </LegalDocLink>
        </div>
      </motion.div>
    </div>
  );
}
