import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Hotel, Calendar, ArrowRight, Bookmark, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePlanContext } from '@/lib/plan-context';
import { useLocation } from 'wouter';

function extractTotalPrice(data: Record<string, unknown>): string | null {
  try {
    const bd = data.budgetBreakdown as Record<string, unknown> | undefined;
    if (!bd) return null;
    const raw =
      bd.grandTotal ?? bd.total ?? bd.totalCost ?? bd.totalPrice ?? null;
    if (raw == null) return null;
    return String(raw);
  } catch {
    return null;
  }
}

interface DeleteConfirmProps {
  destination: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DeleteConfirm({ destination, onConfirm, onCancel, loading }: DeleteConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center gap-3 px-6 py-5 bg-neutral-900/80 border border-red-500/20 rounded-xl mx-6 my-3"
    >
      <AlertTriangle className="w-5 h-5 text-red-400/80" />
      <p className="text-sm text-foreground/80 text-center">
        Удалить поездку в <span className="text-white font-medium">{destination}</span>?
      </p>
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-red-950/60 border border-red-500/30 text-xs text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Удаляю…' : 'Удалить'}
        </button>
      </div>
    </motion.div>
  );
}

export function MyTripsModal() {
  const { tripsModalOpen, closeTripsModal, savedTrips, deleteTrip } = useAuth();
  const { setResult } = usePlanContext();
  const [, setLocation] = useLocation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!tripsModalOpen) return null;

  const handleOpenTrip = (data: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setResult(data as any);
    closeTripsModal();
    setLocation('/results');
  };

  const handleDeleteClick = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setConfirmId(tripId);
  };

  const handleConfirmDelete = async (tripId: string) => {
    setDeletingId(tripId);
    await deleteTrip(tripId);
    setDeletingId(null);
    setConfirmId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) closeTripsModal(); }}
        className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.95 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-neutral-950 border border-primary/25 rounded-2xl overflow-hidden shadow-[0_0_80px_-10px_rgba(212,175,55,0.2)]"
          style={{ maxHeight: 'min(90dvh, 700px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
            <div>
              <p className="font-serif tracking-[0.35em] text-primary text-xs mb-1">VOYAGE</p>
              <h2 className="text-lg font-serif">Мои поездки</h2>
            </div>
            <button
              onClick={closeTripsModal}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Trip list */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(min(90dvh, 700px) - 130px)' }}>
            {savedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <Bookmark className="w-10 h-10 text-primary/15 mb-4" />
                <p className="text-sm text-muted-foreground/50 mb-1">Нет сохранённых поездок</p>
                <p className="text-xs text-muted-foreground/30">
                  После генерации маршрута поездки сохраняются автоматически
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/25">
                {savedTrips.map((trip) => {
                  const totalPrice = extractTotalPrice(trip.data);
                  const isConfirming = confirmId === trip.id;

                  return (
                    <div key={trip.id}>
                      {isConfirming ? (
                        <DeleteConfirm
                          destination={trip.destination}
                          onConfirm={() => handleConfirmDelete(trip.id)}
                          onCancel={() => setConfirmId(null)}
                          loading={deletingId === trip.id}
                        />
                      ) : (
                        <motion.div
                          whileHover={{ backgroundColor: 'rgba(212,175,55,0.04)' }}
                          className="px-6 py-4 flex items-start justify-between gap-3 transition-colors group"
                        >
                          {/* Trip info — clickable */}
                          <button
                            className="flex-1 min-w-0 text-left"
                            onClick={() => handleOpenTrip(trip.data)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="font-serif text-base leading-tight truncate">{trip.destination}</span>
                            </div>

                            {trip.hotelName && (
                              <div className="flex items-center gap-2 mb-2">
                                <Hotel className="w-3 h-3 text-muted-foreground/35 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground/55 truncate">{trip.hotelName}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/35 uppercase tracking-widest">
                              {trip.duration && <span>{trip.duration}</span>}
                              {totalPrice && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1 text-primary/50 normal-case tracking-normal">
                                    <DollarSign className="w-3 h-3" />
                                    {totalPrice}
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span className="flex items-center gap-1 normal-case tracking-normal">
                                <Calendar className="w-3 h-3" />
                                {new Date(trip.createdAt).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </button>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Delete */}
                            <button
                              onClick={(e) => handleDeleteClick(e, trip.id)}
                              className="p-2 rounded-lg text-muted-foreground/25 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                              title="Удалить поездку"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Open */}
                            <button
                              onClick={() => handleOpenTrip(trip.data)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-primary/8 border border-primary/20 rounded-lg text-primary text-xs uppercase tracking-widest font-medium hover:bg-primary/15 transition-colors whitespace-nowrap"
                            >
                              Открыть
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border/25 flex-shrink-0">
            <p className="text-xs text-muted-foreground/30 tracking-wide">
              {savedTrips.length > 0
                ? `${savedTrips.length} ${savedTrips.length === 1 ? 'поездка сохранена' : savedTrips.length < 5 ? 'поездки сохранено' : 'поездок сохранено'}`
                : ''}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
