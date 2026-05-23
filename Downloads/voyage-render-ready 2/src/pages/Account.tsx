import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, MapPin, Hotel, Calendar, LogOut, ArrowRight, Bookmark, Star, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePlanContext } from '@/lib/plan-context';
import { useLocation } from 'wouter';

export default function Account() {
  const { user, logout, savedTrips, openAuthModal } = useAuth();
  const { setResult } = usePlanContext();
  const [, setLocation] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  const handleOpenTrip = (data: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setResult(data as any);
    setLocation('/results');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLocation('/');
  };

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-neutral-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20 inline-flex mb-5">
            <User className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-lg font-serif text-white mb-2">Войти</p>
          <p className="text-sm text-muted-foreground/50 mb-6">Войдите, чтобы увидеть свой аккаунт</p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium uppercase tracking-widest rounded-xl"
          >
            Войти
          </button>
        </motion.div>
      </div>
    );
  }

  const memberSince = (() => {
    try {
      return new Date(user.id.substring(0, 8)).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
    } catch {
      return '2025';
    }
  })();

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-white/5">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-white/8 transition-colors text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-serif tracking-[0.3em] text-primary text-sm">VOYAGE</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 border border-red-900/30 hover:border-red-700/40 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative bg-neutral-900/60 border border-white/8 rounded-2xl overflow-hidden p-6"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_-6px_rgba(212,175,55,0.3)]">
              <span className="font-serif text-2xl text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-serif text-white truncate">{user.name}</h1>
                {user.isPremium && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/30 rounded-full text-xs text-primary">
                    <Star className="w-3 h-3 fill-primary" />
                    Premium
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
                <Clock className="w-3 h-3" />
                <span>Участник с {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-neutral-950/60 rounded-xl px-4 py-3 text-center border border-white/5">
              <p className="text-2xl font-serif text-white mb-0.5">{savedTrips.length}</p>
              <p className="text-xs text-muted-foreground/40 uppercase tracking-widest">
                {savedTrips.length === 1 ? 'поездка' : savedTrips.length >= 2 && savedTrips.length <= 4 ? 'поездки' : 'поездок'}
              </p>
            </div>
            <div className="bg-neutral-950/60 rounded-xl px-4 py-3 text-center border border-white/5">
              <p className="text-2xl font-serif text-primary mb-0.5">
                {user.isPremium ? '★' : '—'}
              </p>
              <p className="text-xs text-muted-foreground/40 uppercase tracking-widest">
                {user.isPremium ? 'Premium' : 'Стандарт'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Saved trips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <h2 className="text-base font-serif text-white mb-4 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary/60" />
            Сохранённые поездки
          </h2>

          <AnimatePresence>
            {savedTrips.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-14 text-center bg-neutral-900/30 border border-white/5 rounded-2xl"
              >
                <Bookmark className="w-8 h-8 text-primary/10 mb-3" />
                <p className="text-sm text-muted-foreground/40">Нет сохранённых поездок. Спланируйте первое путешествие.</p>
                <button
                  onClick={() => setLocation('/')}
                  className="mt-4 text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4"
                >
                  Спланировать поездку
                </button>
              </motion.div>
            ) : (
              <div className="bg-neutral-900/50 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
                {savedTrips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleOpenTrip(trip.data)}
                    className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-primary/4 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                        <span className="font-serif text-base text-white/90 leading-tight truncate">{trip.destination}</span>
                      </div>
                      {trip.hotelName && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Hotel className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                          <span className="text-sm text-muted-foreground/50 truncate">{trip.hotelName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/30 uppercase tracking-widest">
                        {trip.duration && <span>{trip.duration}</span>}
                        {trip.duration && <span>·</span>}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(trip.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary transition-colors text-xs">
                      Открыть
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="pt-2"
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-900/30 text-red-400/60 hover:text-red-400 hover:bg-red-950/25 hover:border-red-700/40 transition-colors text-sm disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Выход...' : 'Выйти'}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
