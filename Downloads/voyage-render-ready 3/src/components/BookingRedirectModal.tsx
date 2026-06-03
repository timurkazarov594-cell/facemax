import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ExternalLink, X, Globe } from 'lucide-react';

export const BOOKING_TRUSTED_DOMAINS = [
  'booking.com',
  'agoda.com',
  'hotels.com',
  'expedia.com',
  'trip.com',
  'airbnb.com',
  'tp.media',
  'travelpayouts.com',
  'hotellook.com',
  'search.hotellook.com',
];

export function isBookingUrlTrusted(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BOOKING_TRUSTED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export function isBookingUrlValid(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

interface Props {
  open: boolean;
  url: string;          // '' = missing/invalid
  isTrusted: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BookingRedirectModal({ open, url, isTrusted, onConfirm, onClose }: Props) {
  const isValid  = !!url && isBookingUrlValid(url);
  const domain   = isValid ? getDomain(url) : '';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-muted-foreground/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 border ${
                  !isValid
                    ? 'bg-red-950/40 border-red-800/30'
                    : isTrusted
                    ? 'bg-emerald-950/40 border-emerald-800/30'
                    : 'bg-amber-950/40 border-amber-800/30'
                }`}>
                  {!isValid
                    ? <AlertTriangle className="w-5 h-5 text-red-400" />
                    : isTrusted
                    ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    : <AlertTriangle className="w-5 h-5 text-amber-400" />
                  }
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white leading-snug">
                    {!isValid ? 'Ссылка недоступна' : 'Переход на сайт бронирования'}
                  </h3>
                  {domain && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8">
                      <Globe className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-xs text-muted-foreground/70 font-mono">{domain}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main warning text */}
              {isValid ? (
                <p className="text-sm text-muted-foreground/75 leading-relaxed mb-4">
                  Вы переходите на сторонний сервис бронирования.{' '}
                  <span className="text-white/70 font-medium">
                    Проверьте адрес сайта, условия, цену и наличие перед оплатой.
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/75 leading-relaxed mb-4">
                  Ссылка на бронирование недоступна. Проверьте отель вручную на официальном сайте бронирования.
                </p>
              )}

              {/* Untrusted domain extra warning */}
              {isValid && !isTrusted && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-950/30 border border-amber-800/25 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Адрес сайта отличается от популярных сервисов бронирования. Будьте внимательны.
                  </p>
                </div>
              )}

              {/* Voyage doesn't take payment note */}
              {isValid && (
                <p className="text-xs text-muted-foreground/40 leading-relaxed mb-5">
                  Voyage AI не принимает оплату за отели и не несёт ответственности за условия бронирования на сторонних сайтах.
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-white/3 text-muted-foreground text-sm font-medium hover:bg-white/8 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                {isValid ? (
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Понял, продолжить
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/8 text-muted-foreground text-sm font-medium hover:bg-white/12 transition-colors"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
