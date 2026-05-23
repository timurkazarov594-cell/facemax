import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Compass, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Register() {
  const { register, user } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    setLocation('/account');
    return null;
  }

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) return;
    if (!isValidEmail(name)) {
      setError('Введите корректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    setLoading(true);
    setError('');
    const result = await register(name.trim(), password, true);
    setLoading(false);
    if (result.error) {
      if (result.error.toLowerCase().includes('exist') || result.error.toLowerCase().includes('taken') || result.error.toLowerCase().includes('уже')) {
        setError('Это имя уже занято. Выберите другое.');
      } else {
        setError(result.error);
      }
    } else {
      setLocation('/account');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <Compass className="w-6 h-6 text-primary group-hover:rotate-45 transition-transform duration-700 ease-out" />
          <span className="font-serif text-xl tracking-widest uppercase font-medium">VOYAGE</span>
        </Link>
      </header>

      {/* Form */}
      <main className="flex-grow flex items-center justify-center px-5 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl text-white mb-2">Регистрация</h1>
            <p className="text-sm text-muted-foreground/50">Создайте аккаунт, чтобы сохранять поездки</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/60 uppercase tracking-widest">Email</label>
              <input
                type="text"
                inputMode="email"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="example@mail.com"
                autoComplete="email"
                autoFocus
                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 focus:bg-neutral-900 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/60 uppercase tracking-widest">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                  className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 focus:bg-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400/80 text-center py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Создать аккаунт
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground/40 mt-8">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary/70 hover:text-primary transition-colors underline underline-offset-4">
              Войти
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/25 mt-5">
            Создавая аккаунт, вы соглашаетесь с{' '}
            <Link href="/terms" className="hover:text-muted-foreground/50 transition-colors underline underline-offset-2">
              условиями использования
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
