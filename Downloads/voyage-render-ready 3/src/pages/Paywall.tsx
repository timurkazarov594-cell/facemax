import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLegalModal } from '@/lib/legal-modal-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Crown, Plane, Sparkles, Hotel, PiggyBank,
  Compass, CreditCard, AlertCircle, MapPin, ShieldCheck,
} from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import { useAuth } from '@/lib/auth-context';
import { isDevUnlocked, disableDevMode } from '@/lib/dev-bypass';

const FEATURES_RU = [
  { icon: Sparkles,   text: 'Персональные AI-маршруты' },
  { icon: Hotel,      text: 'Подбор отелей под ваши предпочтения' },
  { icon: PiggyBank,  text: 'Итоговая стоимость поездки' },
  { icon: Check,      text: 'Сохранённые поездки' },
  { icon: ShieldCheck,text: 'Партнёрские ссылки на бронирование' },
];

const FEATURES_EN = [
  { icon: Sparkles,   text: 'Personalized AI itineraries' },
  { icon: Hotel,      text: 'Hotel recommendations for your preferences' },
  { icon: PiggyBank,  text: 'Full trip cost breakdown' },
  { icon: Check,      text: 'Saved trips' },
  { icon: ShieldCheck,text: 'Affiliate booking links' },
];

const PAY_STEPS_RU = [
  'Подготовка оплаты',
  'Создание безопасной ссылки ЮKassa',
  'Переход к оплате',
];
const PAY_STEPS_EN = [
  'Preparing payment',
  'Creating secure YooKassa link',
  'Redirecting to payment',
];

export default function Paywall() {
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();
  const { user, openAuthModal } = useAuth();
  const lang = ctx.language ?? 'ru';
  const features = lang === 'ru' ? FEATURES_RU : FEATURES_EN;
  const payStepsLabels = lang === 'ru' ? PAY_STEPS_RU : PAY_STEPS_EN;
  const devMode = isDevUnlocked();
  const { openLegal } = useLegalModal();

  const [agreed, setAgreed] = useState(false);
  const [payStep, setPayStep] = useState<number | null>(null); // null = not animating
  const [error, setError] = useState('');

  // If user is already premium, skip straight to loading
  useEffect(() => {
    if (user?.isPremium) setLocation('/loading');
  }, [user, setLocation]);

  const handlePay = async () => {
    if (!user) { openAuthModal(); return; }
    if (!agreed) return;

    setError('');
    const agreementAt = new Date().toISOString();

    // Save locally
    try {
      localStorage.setItem('voyage_payment_agreement', agreementAt);
      if (user.name) localStorage.setItem('voyage_payment_email', user.name);
    } catch { /* ignore */ }

    // Step 0 — "Подготовка оплаты"
    setPayStep(0);
    await new Promise(r => setTimeout(r, 700));

    // Step 1 — "Создание безопасной ссылки ЮKassa"
    setPayStep(1);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const successUrl = `${window.location.origin}${base}/payment-success`;

      const res = await fetch('/api/yookassa/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          successUrl,
          agreementAccepted: true,
          agreementAcceptedAt: agreementAt,
        }),
      });
      const data = await res.json() as {
        confirmationUrl?: string;
        error?: string;
        missingKeys?: boolean;
      };

      if (!res.ok || data.error) {
        setPayStep(null);
        setError(data.error ?? (lang === 'ru' ? 'Ошибка платежа. Попробуйте позже.' : 'Payment error. Try again.'));
        return;
      }

      if (!data.confirmationUrl) {
        setPayStep(null);
        setError(lang === 'ru' ? 'Не получен URL для оплаты.' : 'Could not get payment URL.');
        return;
      }

      // Step 2 — "Переход к оплате"
      setPayStep(2);
      await new Promise(r => setTimeout(r, 800));
      window.location.href = data.confirmationUrl;

    } catch {
      setPayStep(null);
      setError(lang === 'ru' ? 'Ошибка соединения. Проверьте интернет.' : 'Connection error. Check your network.');
    }
  };

  const handleBack = () => setLocation('/plan');
  const destPreview = ctx.city || ctx.destination || (lang === 'ru' ? 'Ваш маршрут' : 'Your journey');
  const durPreview  = ctx.duration || (lang === 'ru' ? 'персональный маршрут' : 'personal itinerary');

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">

      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(212,175,55,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(212,175,55,0.04),transparent)]" />
      <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* ── Payment animation overlay ── */}
      <AnimatePresence>
        {payStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-neutral-950/95 p-8 text-center overflow-hidden shadow-[0_0_100px_-20px_rgba(212,175,55,0.45)]"
            >
              {/* glow bg */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.10),transparent)]" />
              <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              {/* Spinner + crown */}
              <div className="relative mb-6 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary"
                />
                <div className="absolute w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
              </div>

              <h3 className="text-lg font-serif text-white mb-1">Voyage AI Premium</h3>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-7">499₽</p>

              {/* Steps */}
              <div className="space-y-2.5">
                {payStepsLabels.map((label, i) => {
                  const isDone    = i < (payStep ?? 0);
                  const isActive  = i === (payStep ?? 0);
                  const isPending = i > (payStep ?? 0);
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        opacity: isPending ? 0.25 : 1,
                        scale: isActive ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        isActive  ? 'bg-primary/12 border-primary/30' :
                        isDone    ? 'bg-white/3 border-white/6' :
                                    'border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isDone   ? 'border-primary/40 bg-primary/20' :
                        isActive ? 'border-primary/60' :
                                   'border-white/10'
                      }`}>
                        {isDone ? (
                          <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 10 8">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isActive ? (
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        ) : null}
                      </div>
                      <span className={`text-sm leading-snug ${
                        isActive ? 'text-primary font-medium' :
                        isDone   ? 'text-muted-foreground/60' :
                                   'text-muted-foreground/30'
                      }`}>
                        {label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Destination badge ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm whitespace-nowrap"
      >
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
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
            {lang === 'ru' ? 'Премиум доступ' : 'Premium Access'}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
            Voyage AI Premium
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {lang === 'ru'
              ? 'Полный доступ к AI-маршрутам, подбору отелей, сохранённым поездкам и расчёту бюджета'
              : 'Full access to AI itineraries, hotel matching, saved trips, and budget breakdown'}
          </p>
        </motion.div>

        {/* ── Membership card ── */}
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
              <span className="text-7xl font-serif text-primary leading-none tracking-tight">499</span>
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
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                {lang === 'ru' ? 'Оплата банковской картой или СБП через ЮKassa' : 'Bank card or SBP via YooKassa'}
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
                ? 'Один маршрут в турагентстве стоит $200+. У нас — 499₽.'
                : 'A travel agency itinerary costs $200+. Yours for 499₽.'}
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

        {/* ── Legal agreement checkbox ── */}
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
                try { localStorage.setItem('voyage_payment_agreement', new Date().toISOString()); } catch { /* ignore */ }
              }
            }}
            aria-label="Подтвердить оплату"
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
          <p className="text-xs text-muted-foreground/55 leading-relaxed">
            {lang === 'ru'
              ? <>
                  Я{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    подтверждаю оплату
                  </button>
                  {' '}499₽ и ознакомился со{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('rules')}
                    className="text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    всеми правилами сервиса
                  </button>
                  {'. Маршрут создан AI и может содержать неточности. Я проверю данные перед бронированием. Я принимаю '}
                  <button type="button" onClick={() => openLegal('terms')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Пользовательское соглашение</button>
                  {' и '}
                  <button type="button" onClick={() => openLegal('privacy')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Политику конфиденциальности</button>
                  .
                </>
              : <>
                  I{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    confirm payment
                  </button>
                  {' '}of 499₽ and have read{' '}
                  <button
                    type="button"
                    onClick={() => openLegal('rules')}
                    className="text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    all service rules
                  </button>
                  {'. The itinerary is AI-generated and may contain inaccuracies. I accept the '}
                  <button type="button" onClick={() => openLegal('terms')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Terms of Service</button>
                  {' and '}
                  <button type="button" onClick={() => openLegal('privacy')} className="text-primary/60 hover:text-primary underline-offset-2 hover:underline transition-colors">Privacy Policy</button>
                  .
                </>
            }
          </p>
        </motion.div>

        {/* Error banner */}
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

        {/* ── CTA button ── */}
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
              disabled={!agreed || payStep !== null}
              className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              data-testid="btn-unlock-plan"
            >
              <Plane className="w-5 h-5" />
              {lang === 'ru' ? 'Оплатить 499₽' : 'Pay 499₽'}
            </button>
          )}
        </motion.div>

        {/* Disabled hint */}
        {user && !agreed && (
          <p className="mb-3 text-xs text-center text-muted-foreground/40 leading-relaxed">
            {lang === 'ru' ? '↑ Отметьте согласие, чтобы продолжить' : '↑ Check the box above to continue'}
          </p>
        )}

        <p className="mb-5 text-xs text-center text-muted-foreground/45 leading-relaxed max-w-xs">
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

        <p className="mt-6 text-xs text-center text-muted-foreground/30 max-w-xs leading-relaxed">
          {lang === 'ru'
            ? 'Платёж защищён ЮKassa · НКО «ЮМани» · Лицензия ЦБ РФ.'
            : 'Payment secured by YooKassa · Licensed by the Bank of Russia.'}
        </p>

        {/* ── DEV BYPASS ── */}
        {devMode && (
          <div className="mt-10 w-full border border-dashed border-amber-500/30 rounded-xl p-4 flex flex-col items-center gap-3 bg-amber-500/5">
            <span className="text-xs font-mono text-amber-400/70 uppercase tracking-widest">⚙ Dev Mode Active</span>
            <button
              type="button"
              onClick={() => setLocation('/loading')}
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
