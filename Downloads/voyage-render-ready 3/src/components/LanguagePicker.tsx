import React from 'react';
import { motion } from 'framer-motion';
import { usePlanContext, Language } from '../lib/plan-context';

export function LanguagePicker() {
  const { setLanguage } = usePlanContext();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center max-w-md w-full px-6"
      >
        <h1 className="text-primary text-4xl font-serif tracking-widest mb-4">VOYAGE</h1>
        <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-2">The World Awaits</p>
        <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-12">Мир Ждет</p>

        <div className="flex flex-col w-full gap-4">
          <button
            onClick={() => handleSelect('en')}
            className="w-full py-4 px-6 border border-border hover:border-primary/50 hover:bg-primary/5 text-lg font-serif transition-all duration-300 rounded-lg group"
            data-testid="btn-lang-en"
          >
            <span className="group-hover:text-primary transition-colors">English</span>
          </button>
          
          <button
            onClick={() => handleSelect('ru')}
            className="w-full py-4 px-6 border border-border hover:border-primary/50 hover:bg-primary/5 text-lg font-serif transition-all duration-300 rounded-lg group"
            data-testid="btn-lang-ru"
          >
            <span className="group-hover:text-primary transition-colors">Русский</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
