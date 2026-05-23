import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useLegalModal } from '@/lib/legal-modal-context';
import { motion } from 'framer-motion';
import { Check, Crown, Plane, Sparkles, Hotel, PiggyBank, Compass, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import { useAuth } from '@/lib/auth-context';
import { isDevUnlocked, disableDevMode } from '@/lib/dev-bypass';

const FEATURES_RU = [
  { icon: Sparkles,  text: 'Персонализированные AI-маршруты люкс класса' },
  { icon: Hotel,     text: 'Эксклюзивные рекомендации по отелям' },
  { icon: PiggyBank, text: 'Умное планирование бюджета и смета' },
  { icon: Compass,   text: 'Маршрут по дням, созданный специально для вас' },
  { icon: Check,     text: 'Подбор ресторанов и гастрономических мест' },
  { icon: Check,     text: 'Активности, экскурсии и локальные секреты' },
  { icon: Check,     text: 'Расчёт all-inclusive при выборе' },
];

const FEATURES_EN = [
  { icon: Sparkles,  text: 'Personalized AI luxury itineraries' },
  { icon: Hotel,     text: 'Exclusive hotel recommendations' },
  { icon: PiggyBank, text: 'Smart budget planning & cost breakdown' },
  { icon: Compass,   text: 'Day-by-day itinerary, crafted for you' },
  { icon: Check,     text: 'Restaurant & dining curation' },
  { icon: Check,     text: 'Activities, excursions & local secrets' },
  { icon: Check,     text: 'All-inclusive pricing when selected' },
];

export default function Paywall() {
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();
  const { user, openAuthModal } = useAuth();
  const lang = ctx.language ?? 'ru';
  const features = lang === 'ru' ? FEATURES_RU : FEATURES_EN;
  const devMode = isDevUnlocked();
  const { openLegal } = useLegalModal();

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!agreed) return;
    setLoading(true);
    setError('');

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const successUrl = `${window.location.origin}${base}/payment-success`;

      const res = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ successUrl }),
      });
      const data = await res.json() as { confirmationUrl?: string; error?: string; missingKeys?: boolean };

      if (!res.ok || data.error) {
        setError(data.error ?? (lang === 'ru' ? 'Ошибка платежа. Попробуйте позже.' : 'Payment error. Please try again.'));
        setLoading(false);
        return;
      }

      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        setError(lang === 'ru' ? 'Не получен URL для оплаты.' : 'Could not get payment URL.');
        setLoading(false);
      }
    } catch {
      setError(lang === 'ru' ? 'Ошибка соединения. Проверьте интернет.' : 'Connection error. Check your connection.');
      setLoading(false);
    }
  };

  const handleBack = () => setLocation('/plan');
  const destPreview = ctx.city || ctx.destination || (lang === 'ru' ? 'Ваш маршрут' : 'Your journey');
  const durPreview  = ctx.duration || (lang === 'ru' ? 'персональный маршрут' : 'personal itinerary');

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(212,175,55,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(212,175,55,0.04),transparent)]" />
      <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Destination badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm whitespace-nowrap"
      >
        <span className="text-xs uppercase tracking-widest text-primary font-medium">{destPreview} · {durPreview}</span>
      </motion.div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">

        {/* Crown icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 relative"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_-8px_rgba(212,175,55,0.4)]">
            <Crown className="w-9 h-9 text-primary" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-primary/30"
          />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-primary mb-3 font-medium">
            <Sparkles className="w-3 h-3" />
            {lang === 'ru' ? 'Премиум членство' : 'Premium Membership'}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
            {lang === 'ru' ? 'Voyage AI Premium' : 'Voyage AI Premium'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {lang === 'ru'
              ? 'Персонализированные маршруты люкс класса — от бюджетных до ультра-премиум — созданные мгновенно.'
              : 'Personalized luxury itineraries — from budget to ultra-premium — crafted instantly for you.'}
          </p>
        </motion.div>

        {/* Membership card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="w-full rounded-2xl overflow-hidden mb-6 border border-primary/25 shadow-[0_0_60px_-20px_rgba(212,175,55,0.2)]"
        >
          {/* Pricing header */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 py-8 text-center border-b border-primary/15">
            <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs uppercase tracking-widest font-medium mb-5">
              <Crown className="w-3 h-3" />
              Voyage Premium
            </div>

            {/* Price */}
            <div className="flex items-start justify-center gap-1 mb-1">
              <span className="text-7xl font-serif text-primary leading-none tracking-tight">799</span>
              <div className="flex flex-col items-start mt-2.5">
                <span className="text-3xl font-serif text-primary leading-none">₽</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/70 tracking-wide mb-5">
              {lang === 'ru' ? 'Единовременная оплата · Без подписки' : 'One-time payment · No subscription'}
            </p>

            {/* Payment method */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/40 border border-border/60 text-xs text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" />
                {lang === 'ru' ? 'Банковские карты и СБП через ЮKassa' : 'Bank cards & SBP via YooKassa'}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-card/60 px-6 py-5 space-y-3.5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/85 leading-snug">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-primary/5 border-t border-primary/10 px-6 py-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            <p className="text-xs text-primary/70 text-center font-medium tracking-wide">
              {lang === 'ru'
                ? 'Один маршрут в турагентстве стоит $200+. У нас — 799₽.'
                : 'A travel agency itinerary costs $200+. Yours for 799₽.'}
            </p>
          </div>
        </motion.div>

        {/* Login notice if not logged in */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/30 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              {lang === 'ru'
                ? 'Для оплаты необходимо войти в аккаунт. Платёж будет привязан к вашей учётной записи.'
                : 'You must be logged in to pay. The payment will be linked to your account.'}
            </p>
          </motion.div>
        )}

        {/* Agreement checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="w-full mb-4 flex items-start gap-3 px-1"
        >
          <button
            type="button"
            onClick={() => {
              const next = !agreed;
              setAgreed(next);
              if (next) {
                try { localStorage.setItem('voyage_payment_agreement', new Date().toISOString()); } catch (_) { /* ignore */ }
              }
            }}
            className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors flex items-center justify-center ${
              agreed ? 'bg-primary border-primary' : 'border-white/20 bg-neutral-900/50 hover:border-primary/50'
            }`}
          >
            {agreed && (
              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 8">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <p className="text-xs text-muted-foreground/50 leading-relaxed">
            {lang === 'ru'
              ? <>Я подтверждаю оплату 799₽ и ознакомился со{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('rules')}
                    className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    всеми правилами сервиса
                  </button>
                  {'. Маршрут создан AI и может содержать неточности. Я проверю данные перед бронированием. Я принимаю '}
                  <button type="button" onClick={() => openLegal('terms')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Пользовательское соглашение</button>
                  {' и '}
                  <button type="button" onClick={() => openLegal('privacy')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Политику конфиденциальности</button>.</>
              : <>I confirm payment of 799₽ and have read{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('rules')}
                    className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    all service rules
                  </button>
                  {'. The itinerary is AI-generated and may contain inaccuracies. I accept the '}
                  <button type="button" onClick={() => openLegal('terms')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Terms of Service</button>
                  {' and '}
                  <button type="button" onClick={() => openLegal('privacy')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Privacy Policy</button>.</>
            }
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-red-950/30 border border-red-800/30 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200/80 leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="w-full mb-2"
        >
          {!user ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.5)]"
              data-testid="btn-unlock-plan"
            >
              <Crown className="w-5 h-5" />
              {lang === 'ru' ? 'Войти и оплатить' : 'Sign In to Pay'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePay}
              disabled={!agreed || loading}
              className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              data-testid="btn-unlock-plan"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plane className="w-5 h-5" />
              )}
              {loading
                ? (lang === 'ru' ? 'Подготовка платежа…' : 'Preparing payment…')
                : (lang === 'ru' ? 'Оплатить 799₽' : 'Pay 799₽')}
            </button>
          )}
        </motion.div>

        <p className="mb-5 text-xs text-center text-muted-foreground/50 leading-relaxed max-w-xs">
          {lang === 'ru'
            ? 'Безопасная оплата через ЮKassa. Банковские карты, СБП и другие методы.'
            : 'Secure payment via YooKassa. Bank cards, SBP and other methods.'}
        </p>

        <button
          type="button"
          onClick={handleBack}
          className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          data-testid="btn-paywall-back"
        >
          ← {lang === 'ru' ? 'Изменить параметры' : 'Edit trip details'}
        </button>

        <p className="mt-6 text-xs text-center text-muted-foreground/35 max-w-xs leading-relaxed">
          {lang === 'ru'
            ? 'Платёж защищён ЮKassa · НКО «ЮМани» · Лицензия ЦБ РФ.'
            : 'Payment secured by YooKassa · Licensed by the Bank of Russia.'}
        </p>

        {/* DEV BYPASS */}
        {devMode && (
          <div className="mt-10 w-full border border-dashed border-amber-500/30 rounded-xl p-4 flex flex-col items-center gap-3 bg-amber-500/5">
            <span className="text-xs font-mono text-amber-400/70 uppercase tracking-widest">⚙ Dev Mode Active</span>
            <button
              type="button"
              onClick={() => {
                const base = import.meta.env.BASE_URL.replace(/\/$/, '');
                setLocation('/loading');
                window.history.replaceState({}, '', `${base}/loading`);
              }}
              className="cursor-pointer w-full py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest hover:bg-amber-500/25 transition-colors active:scale-95"
            >
              Skip Paywall → Generate Itinerary
            </button>
            <button
              type="button"
              onClick={() => { disableDevMode(); window.location.reload(); }}
              className="cursor-pointer text-xs font-mono text-amber-400/40 hover:text-amber-400/70 transition-colors"
            >
              Disable dev mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
