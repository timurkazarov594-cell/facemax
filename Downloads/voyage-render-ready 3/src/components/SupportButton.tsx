import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X, Mail } from 'lucide-react';

export function SupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2.5 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl w-64"
          >
            <p className="text-xs text-muted-foreground/60 mb-2.5 leading-relaxed">
              По вопросам поддержки напишите нам:
            </p>
            <a
              href="mailto:voyagetrip.ai@mail.ru"
              className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              voyagetrip.ai@mail.ru
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-neutral-900/95 border border-white/12 rounded-full text-sm text-muted-foreground/70 hover:text-white hover:border-primary/40 transition-all shadow-lg backdrop-blur-sm"
      >
        {open ? <X className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        {!open && <span className="font-medium">Поддержка</span>}
      </motion.button>
    </div>
  );
}
