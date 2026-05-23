import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ExternalLink, X } from 'lucide-react';

interface Props {
  url: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function BookingRedirectModal({ url, onConfirm, onClose }: Props) {
  return (
    <AnimatePresence>
      {url && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-white">Переход на сайт бронирования</h3>
                <p className="text-xs text-muted-foreground/50">Официальный партнёр</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground/70 leading-relaxed mb-6">
              Вы переходите на официальный сайт бронирования или проверенного партнёра.{' '}
              <span className="text-white/60 font-medium">
                Voyage AI не принимает оплату за отели напрямую.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-muted-foreground text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Продолжить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
