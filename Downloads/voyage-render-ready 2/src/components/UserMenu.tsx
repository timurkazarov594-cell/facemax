import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Bookmark, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import { useLocation } from 'wouter';

interface UserMenuProps {
  compact?: boolean;
}

export function UserMenu({ compact }: UserMenuProps) {
  const { user, loading, openAuthModal, logout, openTripsModal } = useAuth();
  const t = useT();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <motion.button
        onClick={openAuthModal}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 border border-primary/30 text-primary rounded-xl text-xs uppercase tracking-widest font-medium hover:bg-primary/10 transition-colors ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      >
        <User className="w-3.5 h-3.5" />
        {t('auth.login')}
      </motion.button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 text-primary rounded-xl text-xs uppercase tracking-widest font-medium hover:bg-primary/15 transition-colors"
      >
        <User className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{user.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-neutral-950 border border-primary/20 rounded-xl overflow-hidden shadow-[0_8px_30px_-8px_rgba(0,0,0,0.8)] z-50"
          >
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">{t('auth.account')}</p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{user.name}</p>
            </div>

            <button
              onClick={() => { setOpen(false); setLocation('/account'); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left"
            >
              <Settings className="w-3.5 h-3.5 text-primary/60" />
              {t('auth.account')}
            </button>

            <button
              onClick={() => { setOpen(false); openTripsModal(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left"
            >
              <Bookmark className="w-3.5 h-3.5 text-primary/60" />
              {t('auth.saved_trips')}
            </button>

            <button
              onClick={async () => { setOpen(false); await logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground hover:text-red-400 hover:bg-red-950/20 transition-colors text-left border-t border-border/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('auth.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
