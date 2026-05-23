import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, UserPlus, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLegalModal } from '@/lib/legal-modal-context';

type Tab = 'login' | 'register';

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function AuthGate() {
  const { login, register } = useAuth();
  const { openLegal } = useLegalModal();
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

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
      setError('Введите email');
      return;
    }

    if (tab === 'register' && !isValidEmail(name)) {
      setError('Введите корректный email');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    if (tab === 'register' && password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }

    if (tab === 'register' && !agreed) {
      setError('Подтвердите согласие с правилами сервиса');
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
        setError('Неверный логин или пароль');
      } else if (
        result.error.toLowerCase().includes('taken') ||
        result.error.toLowerCase().includes('exist') ||
        result.error.toLowerCase().includes('занят')
      ) {
        setError('Этот email уже зарегистрирован. Попробуйте войти.');
      } else if (result.error.toLowerCase().includes('terms') || result.error.toLowerCase().includes('accept')) {
        setError('Подтвердите согласие с правилами сервиса');
      } else {
        setError('Ошибка регистрации. Попробуйте снова.');
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
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <Compass className="w-7 h-7 text-primary" />
            <span className="font-serif text-2xl tracking-widest uppercase font-medium">VOYAGE</span>
          </div>
          <p className="text-xs text-muted-foreground/40 tracking-[0.22em] uppercase">The World Awaits</p>
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
              {t === 'login' ? 'Войти' : 'Регистрация'}
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
              <label className="text-xs text-muted-foreground/50 uppercase tracking-widest">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Минимум 6 символов' : '••••••••'}
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
                  Я ознакомился с{' '}
                  <button type="button" onClick={() => openLegal('rules')}
                    className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">
                    правилами сайта
                  </button>
                  {', '}
                  <button type="button" onClick={() => openLegal('terms')}
                    className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">
                    Пользовательским соглашением
                  </button>
                  {' и '}
                  <button type="button" onClick={() => openLegal('privacy')}
                    className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">
                    Политикой конфиденциальности
                  </button>
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
                  Войти
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Создать аккаунт
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Bottom legal links — open modal instead of navigating */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/25">
          <button type="button" onClick={() => openLegal('terms')} className="hover:text-primary/50 transition-colors">
            Соглашение
          </button>
          <span>·</span>
          <button type="button" onClick={() => openLegal('privacy')} className="hover:text-primary/50 transition-colors">
            Конфиденциальность
          </button>
          <span>·</span>
          <button type="button" onClick={() => openLegal('disclaimer')} className="hover:text-primary/50 transition-colors">
            AI Disclaimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
