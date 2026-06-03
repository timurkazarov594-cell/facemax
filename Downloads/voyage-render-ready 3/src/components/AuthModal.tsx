import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, User, Lock, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function legalUrl(path: string): string {
  return `${window.location.origin}${BASE}${path}`;
}

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register } = useAuth();
  const t = useT();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите email');
      return;
    }

    if (mode === 'register' && !isValidEmail(name)) {
      setError('Введите корректный email');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }

    if (mode === 'register' && !termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    setLoading(true);

    const result = mode === 'login'
      ? await login(name.trim(), password)
      : await register(name.trim(), password, true);

    setLoading(false);
    if (result.error) {
      if (mode === 'login') {
        setError('Неверный логин или пароль');
      } else if (
        result.error.toLowerCase().includes('taken') ||
        result.error.toLowerCase().includes('exist') ||
        result.error.toLowerCase().includes('занят') ||
        result.error.toLowerCase().includes('существует') ||
        result.error.toLowerCase().includes('зарегистрирован')
      ) {
        setError('Пользователь уже существует');
      } else if (result.error.toLowerCase().includes('terms') || result.error.toLowerCase().includes('accept')) {
        setError('Подтвердите согласие с правилами сервиса');
      } else if (result.error.toLowerCase().includes('сервер') || result.error.toLowerCase().includes('server')) {
        setError('Ошибка сервера. Попробуйте позже.');
      } else {
        setError('Ошибка регистрации. Попробуйте снова.');
      }
    } else {
      setName('');
      setPassword('');
      setTermsAccepted(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
    setTermsError(false);
  };

  if (!authModalOpen) return null;

  const isRegisterDisabled = loading || (mode === 'register' && !termsAccepted);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-sm bg-neutral-950 border border-primary/25 rounded-2xl overflow-hidden shadow-[0_0_60px_-10px_rgba(212,175,55,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          {/* Close */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <p className="font-serif tracking-[0.4em] text-primary text-xl mb-1">VOYAGE</p>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
                {mode === 'login' ? t('auth.welcome_back') : t('auth.create_account')}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl border border-border/50 mb-7 overflow-hidden">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors ${
                    mode === m
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'login' ? t('auth.login') : t('auth.register')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  inputMode="email"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="example@mail.com"
                  autoComplete="email"
                  className="w-full bg-neutral-900 border border-border/60 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-neutral-900 border border-border/60 rounded-xl pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Terms checkbox — only in register mode */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    key="terms"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTermsAccepted((v) => !v);
                        setTermsError(false);
                      }}
                      className={`group w-full flex items-start gap-3 py-3 px-3.5 rounded-xl border transition-all duration-200 text-left ${
                        termsError
                          ? 'border-red-500/60 bg-red-500/5'
                          : termsAccepted
                          ? 'border-primary/50 bg-primary/8'
                          : 'border-border/60 bg-neutral-900 hover:border-primary/30'
                      }`}
                      aria-pressed={termsAccepted}
                    >
                      {/* Custom checkbox */}
                      <span
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                          termsAccepted
                            ? 'bg-primary border-primary shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                            : termsError
                            ? 'border-red-500/60 bg-transparent'
                            : 'border-border/60 bg-transparent group-hover:border-primary/40'
                        }`}
                      >
                        <AnimatePresence>
                          {termsAccepted && (
                            <motion.span
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Check className="w-3 h-3 text-black font-bold stroke-[3]" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>

                      {/* Label with clickable links */}
                      <span className="text-xs leading-relaxed text-muted-foreground/80">
                        {t('auth.terms_i_accept')}{' '}
                        <a
                          href={legalUrl('/terms')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 transition-colors"
                        >
                          {t('auth.terms_link')}
                        </a>
                        {' '}{t('auth.terms_and')}{' '}
                        <a
                          href={legalUrl('/privacy')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 transition-colors"
                        >
                          {t('auth.privacy_link')}
                        </a>
                      </span>
                    </button>

                    {/* Terms validation error */}
                    <AnimatePresence>
                      {termsError && (
                        <motion.p
                          key="terms-err"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1.5 text-xs text-red-400 px-1"
                        >
                          {t('auth.terms_required')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* API Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 text-center px-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isRegisterDisabled}
                whileHover={{ scale: isRegisterDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isRegisterDisabled ? 1 : 0.97 }}
                className="w-full py-3.5 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-[0_4px_20px_-8px_rgba(212,175,55,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? '...' : (mode === 'login' ? t('auth.login') : t('auth.register'))}
              </motion.button>
            </form>

            {/* Mode switch */}
            <div className="mt-6 text-center">
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs text-muted-foreground/50 hover:text-primary transition-colors"
              >
                {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
