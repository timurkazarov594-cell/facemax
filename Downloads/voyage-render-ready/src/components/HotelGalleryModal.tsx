import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, CalendarCheck, Sparkles, ExternalLink } from 'lucide-react';

interface HotelGalleryModalProps {
  hotel: Record<string, unknown>;
  imageUrl: string;
  isAiGenerated?: boolean;
  destination: string;
  bookingUrl: string;
  lang: string;
  onClose: () => void;
  onBook?: (e: React.MouseEvent) => void;
}

export function HotelGalleryModal({
  hotel, imageUrl, isAiGenerated, destination, bookingUrl, lang, onClose, onBook,
}: HotelGalleryModalProps) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const rating = (hotel.rating as number | undefined) ?? 0;

  const bookLabel = lang === 'ru' ? 'Забронировать этот отель' : 'Book This Hotel';

  // iOS-safe booking click
  const handleBookClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onBook) { onBook(e); return; }
    const opened = window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      window.location.href = bookingUrl;
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-neutral-950 border border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_80px_-20px_rgba(212,175,55,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image area */}
          <div className="relative flex-1 bg-neutral-900 overflow-hidden" style={{ minHeight: 300, maxHeight: '60vh' }}>
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            {!imgError ? (
              <img
                src={imageUrl}
                alt={String(hotel.name ?? '')}
                className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true); }}
                style={{ maxHeight: '60vh', objectPosition: 'center top' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                <p className="text-sm uppercase tracking-widest">Image unavailable</p>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

            {/* Image type badge */}
            {isAiGenerated && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/80 text-purple-300 text-xs font-medium backdrop-blur-sm border border-purple-700/40">
                <Sparkles className="w-3 h-3" />
                AI Visualization
              </div>
            )}
            {!isAiGenerated && imgLoaded && !imgError && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-medium backdrop-blur-sm border border-emerald-700/40">
                ✓ Verified hotel photo
              </div>
            )}
          </div>

          {/* Hotel info + CTA */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1 min-w-0">
              {/* Stars */}
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < rating ? 'text-primary fill-current' : 'text-neutral-700'}`}
                  />
                ))}
              </div>
              <h3 className="text-2xl md:text-3xl font-serif text-white mb-1 truncate">
                {String(hotel.name ?? '')}
              </h3>
              {(Boolean(hotel.location) || Boolean(destination)) && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {hotel.location ? `${String(hotel.location)}, ` : ''}
                    {destination}
                  </span>
                </div>
              )}
              {hotel.pricePerNight != null && (
                <div className="mt-3 text-xl font-mono text-primary">
                  {String(hotel.pricePerNight)}
                  <span className="text-xs text-muted-foreground/60 ml-2 font-sans uppercase tracking-widest">
                    / night
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
              <motion.a
                href={bookingUrl}
                onClick={handleBookClick}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 px-8 py-3.5 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-[0_4px_20px_-8px_rgba(212,175,55,0.5)] whitespace-nowrap"
              >
                <CalendarCheck className="w-4 h-4" />
                {bookLabel}
              </motion.a>
              <div className="flex items-center gap-1.5 justify-center">
                <ExternalLink className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                <p className="text-xs text-muted-foreground/40 text-center">
                  {lang === 'ru'
                    ? 'Откроется страница бронирования выбранного отеля'
                    : 'Opens booking page for the selected hotel'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
