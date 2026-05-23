import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLegalModal } from '@/lib/legal-modal-context';
import { motion } from 'framer-motion';
import { Check, Crown, Plane, MapPin, CreditCard, Smartphone, Sparkles, Hotel, PiggyBank, Compass } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import { isDevUnlocked, disableDevMode } from '@/lib/dev-bypass';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup: (config: { eventHandler?: (event: { event: string }) => void }) => void;
    };
  }
}

const CHECKOUT_URL = 'https://voyageai.lemonsqueezy.com/checkout/buy/179bf813-c7e5-409b-840a-f380446ff43d';

const FEATURES_EN = [
  { icon: Sparkles,  text: 'Personalized AI luxury itineraries' },
  { icon: Hotel,     text: 'Exclusive hotel recommendations' },
  { icon: PiggyBank, text: 'Smart budget planning & cost breakdown' },
  { icon: Compass,   text: 'Day-by-day itinerary, crafted for you' },
  { icon: Check,     text: 'Restaurant & dining curation' },
  { icon: Check,     text: 'Activities, excursions & local secrets' },
  { icon: Check,     text: 'All-inclusive pricing when selected' },
];

const FEATURES_RU = [
  { icon: Sparkles,  text: 'Персонализированные AI-маршруты люкс класса' },
  { icon: Hotel,     text: 'Эксклюзивные рекомендации по отелям' },
  { icon: PiggyBank, text: 'Умное планирование бюджета и смета' },
  { icon: Compass,   text: 'Маршрут по дням, созданный специально для вас' },
  { icon: Check,     text: 'Подбор ресторанов и гастрономических мест' },
  { icon: Check,     text: 'Активности, экскурсии и локальные секреты' },
  { icon: Check,     text: 'Расчёт all-inclusive при выборе' },
];

export default function Paywall() {
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();
  const lang = ctx.language ?? 'en';
  const features = lang === 'ru' ? FEATURES_RU : FEATURES_EN;
  const devMode = isDevUnlocked();
  const { openLegal } = useLegalModal();
  const [agreed, setAgreed] = React.useState(false);

  useEffect(() => {
    const init = () => {
      if (typeof window.createLemonSqueezy === 'function') {
        window.createLemonSqueezy();
        window.LemonSqueezy?.Setup({
          eventHandler: (event) => {
            if (event.event === 'Checkout.Success') {
              window.LemonSqueezy?.Url.Close();
              const base = import.meta.env.BASE_URL.replace(/\/$/, '');
              setLocation('/loading?unlocked=1');
              window.history.replaceState({}, '', `${base}/loading?unlocked=1`);
            }
          },
        });
      }
    };

    if (typeof window.createLemonSqueezy === 'function') {
      init();
    } else {
      const script = document.querySelector('script[src*="lemon.js"]');
      script?.addEventListener('load', init);
      return () => script?.removeEventListener('load', init);
    }
  }, [setLocation]);

  const saveDraft = () => {
    try {
      sessionStorage.setItem('voyage_plan_draft', JSON.stringify({
        destination: ctx.destination,
        city: ctx.city,
        travelLevel: ctx.travelLevel,
        tripTypes: ctx.tripTypes,
        hotelPrefs: ctx.hotelPrefs,
        restaurantPrefs: ctx.restaurantPrefs,
        duration: ctx.duration,
        budget: ctx.budget,
        guests: ctx.guests,
        rooms: ctx.rooms,
        roomType: ctx.roomType,
        language: ctx.language,
      }));
    } catch (_) { /* ignore */ }
  };

  const handleUnlock = () => {
    saveDraft();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const returnUrl = `${window.location.origin}${base}/loading?unlocked=1`;
    const overlayUrl = `${CHECKOUT_URL}?embed=1&checkout[redirect_url]=${encodeURIComponent(returnUrl)}`;
    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(overlayUrl);
    } else {
      window.open(`${CHECKOUT_URL}?checkout[redirect_url]=${encodeURIComponent(returnUrl)}`, '_blank', 'noopener');
    }
  };

  const handleBack = () => setLocation('/plan');

  const destPreview = ctx.city || ctx.destination || (lang === 'ru' ? 'Ваш маршрут' : 'Your journey');
  const durPreview  = ctx.duration || (lang === 'ru' ? 'персональный маршрут' : 'personal itinerary');

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">

      {/* Rich background */}
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
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs uppercase tracking-widest text-primary font-medium">{destPreview} · {durPreview}</span>
      </motion.div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">

        {/* Crown icon — membership feel */}
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
            {lang === 'ru' ? 'Ваш личный AI-консьерж' : 'Your Personal AI Travel Concierge'}
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

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs uppercase tracking-widest font-medium mb-5">
              <Crown className="w-3 h-3" />
              {lang === 'ru' ? 'Voyage Premium' : 'Voyage Premium'}
            </div>

            {/* Price */}
            <div className="flex items-start justify-center gap-1 mb-1">
              <span className="text-xl font-serif text-primary/70 mt-2">$</span>
              <span className="text-7xl font-serif text-primary leading-none tracking-tight">7</span>
              <div className="flex flex-col items-start mt-2.5">
                <span className="text-3xl font-serif text-primary leading-none">.99</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {lang === 'ru' ? '/мес' : '/mo'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/70 tracking-wide mb-5">
              {lang === 'ru'
                ? 'Неограниченные AI-маршруты · Отменить в любое время'
                : 'Unlimited AI itineraries · Cancel anytime'}
            </p>

            {/* Payment methods */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/40 border border-border/60 text-xs text-muted-foreground">
                <Smartphone className="w-3.5 h-3.5" />
                Apple Pay
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/40 border border-border/60 text-xs text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" />
                {lang === 'ru' ? 'Карта' : 'Card'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/40 border border-border/60 text-xs text-muted-foreground">
                G Pay
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

          {/* Value note */}
          <div className="bg-primary/5 border-t border-primary/10 px-6 py-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            <p className="text-xs text-primary/70 text-center font-medium tracking-wide">
              {lang === 'ru'
                ? 'Один маршрут в туристическом агентстве стоит $200+. У нас — $7.99/мес.'
                : 'A travel agency itinerary costs $200+. Yours for $7.99/mo.'}
            </p>
          </div>
        </motion.div>

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
              ? <>Я подтверждаю оплату и ознакомился со{' '}
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
              : <>I confirm payment and have read{' '}
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="w-full mb-2"
        >
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!agreed}
            className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            data-testid="btn-unlock-plan"
          >
            <Plane className="w-5 h-5" />
            {lang === 'ru' ? 'Начать за $7.99/мес' : 'Start for $7.99/month'}
          </button>
        </motion.div>

        <p className="mb-5 text-xs text-center text-muted-foreground/50 leading-relaxed max-w-xs">
          {lang === 'ru'
            ? 'Apple Pay доступен на iPhone/Mac в Safari, если карта добавлена в Wallet.'
            : 'Apple Pay available on iPhone & Mac in Safari when a card is added to Wallet.'}
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
            ? 'Защищено Lemon Squeezy. Apple Pay, Google Pay и все основные карты. Отмена в любое время.'
            : 'Secured by Lemon Squeezy · Apple Pay, Google Pay & all major cards · Cancel anytime.'}
        </p>

        {/* ── DEV BYPASS ── only rendered when dev mode is active */}
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
              onClick={() => {
                disableDevMode();
                window.location.reload();
              }}
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
