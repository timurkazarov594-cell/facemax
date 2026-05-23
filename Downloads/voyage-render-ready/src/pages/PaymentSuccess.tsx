import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles, Plane } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import { useAuth } from '@/lib/auth-context';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();
  const { user, refreshPremiumStatus } = useAuth();
  const lang = ctx.language ?? 'ru';
  const [verifying, setVerifying] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 8;
    const poll = async () => {
      try {
        const res = await fetch('/api/payment/status', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json() as { isPremium: boolean };
          if (data.isPremium) {
            setIsPremium(true);
            setVerifying(false);
            await refreshPremiumStatus();
            return;
          }
        }
      } catch { /* ignore */ }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setVerifying(false);
      }
    };
    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
      <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-emerald-400/30"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-emerald-400 mb-3 font-medium">
            <Sparkles className="w-3 h-3" />
            {lang === 'ru' ? 'Оплата прошла успешно' : 'Payment Successful'}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
            {lang === 'ru' ? 'Добро пожаловать в Voyage Premium' : 'Welcome to Voyage Premium'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === 'ru'
              ? 'Ваш доступ активирован. Теперь вы можете создавать персонализированные AI-маршруты.'
              : 'Your access is activated. You can now generate personalized AI itineraries.'}
          </p>
        </motion.div>

        {/* Status card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="w-full rounded-2xl border border-primary/25 bg-card/60 overflow-hidden mb-8 shadow-[0_0_60px_-20px_rgba(212,175,55,0.15)]"
        >
          <div className="px-6 py-6 flex items-center gap-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-primary/60 mb-0.5">
                {lang === 'ru' ? 'Статус доступа' : 'Access Status'}
              </p>
              {verifying ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {lang === 'ru' ? 'Проверяем платёж…' : 'Verifying payment…'}
                  </span>
                </div>
              ) : (
                <p className={`text-sm font-semibold ${isPremium ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isPremium
                    ? (lang === 'ru' ? '✓ Premium активен' : '✓ Premium Active')
                    : (lang === 'ru' ? 'Обновление может занять минуту' : 'Update may take a moment')}
                </p>
              )}
            </div>
          </div>
          {user && (
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                {lang === 'ru' ? 'Аккаунт' : 'Account'}
              </span>
              <span className="text-xs text-muted-foreground/80 font-medium">{user.name}</span>
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <button
            type="button"
            onClick={() => setLocation('/plan')}
            className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.5)]"
          >
            <Plane className="w-5 h-5" />
            {lang === 'ru' ? 'Создать маршрут' : 'Create Itinerary'}
          </button>
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="w-full cursor-pointer py-3 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            {lang === 'ru' ? 'На главную' : 'Go to Home'}
          </button>
        </motion.div>

        <p className="mt-8 text-xs text-muted-foreground/35 max-w-xs leading-relaxed">
          {lang === 'ru'
            ? 'Если статус не обновился, войдите заново — Premium будет активирован автоматически.'
            : 'If status hasn\'t updated, log out and back in — Premium will be activated automatically.'}
        </p>
      </div>
    </div>
  );
}
