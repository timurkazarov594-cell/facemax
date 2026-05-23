import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const RULES = [
  'Voyage AI генерирует маршруты с помощью искусственного интеллекта.',
  'Результаты AI могут быть неточными или содержать устаревшие данные.',
  'Цены, отели и наличие мест могут изменяться без предупреждения.',
  'Пользователь обязан самостоятельно проверить все данные перед бронированием.',
  'Voyage AI не несёт ответственности за расходы пользователя на путешествие или за сторонние сайты.',
  'Оплата предназначена для получения доступа к сервису AI-планирования, а не для получения гарантированного результата путешествия.',
  'Возврат средств после генерации маршрута не гарантируется.',
];

export function LegalRulesModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/30 flex-shrink-0 mt-0.5">
                <Bot className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-white mb-1">Правила использования сервиса</h3>
                <p className="text-xs text-muted-foreground/50">Voyage AI — условия и ограничения</p>
              </div>
            </div>

            <div className="space-y-3.5 mb-7">
              {RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/12 border border-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-primary/70 text-[10px] font-mono font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground/75 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mb-3"
            >
              Понятно
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/30">
              <a href="/terms" target="_blank" rel="noopener" className="hover:text-primary/50 transition-colors">
                Пользовательское соглашение
              </a>
              <span>·</span>
              <a href="/disclaimer" target="_blank" rel="noopener" className="hover:text-primary/50 transition-colors">
                AI Disclaimer
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
