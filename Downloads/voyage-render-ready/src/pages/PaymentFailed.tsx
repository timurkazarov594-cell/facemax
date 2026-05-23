import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();
  const lang = ctx.language ?? 'ru';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(239,68,68,0.06),transparent)]" />
      <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400/80" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
            {lang === 'ru' ? 'Оплата не прошла' : 'Payment Failed'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {lang === 'ru'
              ? 'Платёж был отменён или завершился с ошибкой. Ваши данные не были сохранены.'
              : 'The payment was cancelled or failed. No charges were made.'}
          </p>
        </motion.div>

        {/* Reasons card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full rounded-2xl border border-border/50 bg-card/60 px-6 py-5 mb-8 text-left space-y-2"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3">
            {lang === 'ru' ? 'Возможные причины' : 'Possible reasons'}
          </p>
          {(lang === 'ru'
            ? ['Недостаточно средств на карте', 'Платёж отменён вручную', 'Технический сбой на стороне банка', 'Превышен лимит карты']
            : ['Insufficient funds', 'Payment manually cancelled', 'Bank-side technical error', 'Card limit exceeded']
          ).map((reason) => (
            <div key={reason} className="flex items-center gap-2.5 text-sm text-muted-foreground/70">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
              {reason}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <button
            type="button"
            onClick={() => setLocation('/paywall')}
            className="w-full cursor-pointer flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-base font-semibold uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_30px_-8px_rgba(212,175,55,0.4)]"
          >
            <RefreshCw className="w-5 h-5" />
            {lang === 'ru' ? 'Попробовать снова' : 'Try Again'}
          </button>
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'ru' ? 'На главную' : 'Go to Home'}
          </button>
        </motion.div>

        <p className="mt-8 text-xs text-muted-foreground/35 leading-relaxed">
          {lang === 'ru'
            ? 'Если деньги были списаны, но статус не обновился — напишите нам.'
            : 'If funds were charged but status didn\'t update, please contact support.'}
        </p>
      </div>
    </div>
  );
}
