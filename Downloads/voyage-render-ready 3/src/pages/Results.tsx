import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { usePlanContext } from '@/lib/plan-context';
import { useT } from '@/lib/i18n';
import {
  Star, MapPin, Share2, Bookmark, Sun, Coffee, Moon,
  ExternalLink, Images, Search, Check, BadgeDollarSign, CalendarCheck,
  Sparkles, ShieldCheck, AlertTriangle, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HotelGalleryModal } from '@/components/HotelGalleryModal';
import { BookingRedirectModal, isBookingUrlTrusted } from '@/components/BookingRedirectModal';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/lib/auth-context';

const TP_MARKER = '529629';

function buildHotelBookingUrl(hotelName: string, city: string, destination: string, lang: string): string {
  const query = `${hotelName} ${city || destination}`.trim();
  const tpLang = lang === 'ru' ? 'ru' : 'en-gb';
  // Direct booking.com link — tp.media affiliate campaign disabled to prevent "not subscribed" errors
  return `https://www.booking.com/search.html?ss=${encodeURIComponent(query)}&lang=${tpLang}&src=index&src_elem=sb`;
}

// Tag color classes cycling for visual variety
const TAG_COLORS = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-amber-900/20 text-amber-300 border-amber-700/30',
  'bg-sky-900/20 text-sky-300 border-sky-700/30',
  'bg-emerald-900/20 text-emerald-300 border-emerald-700/30',
  'bg-purple-900/20 text-purple-300 border-purple-700/30',
];

// ── Hotel photo header ──────────────────────────────────────────────────────
function HotelPhotoHeader({
  hotel, destination, bookingUrl, onOpenGallery, imageOverride, t, onBookingClick,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hotel: Record<string, any>;
  destination: string;
  bookingUrl: string;
  onOpenGallery: (() => void) | null;
  imageOverride?: string | null;
  t: (k: string) => string;
  lang?: string;
  onBookingClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const imageUrl = (imageOverride ?? hotel.imageUrl) as string | undefined | null;
  const isReal = hotel.imageIsReal as boolean | undefined;
  const imageSource = (imageOverride ? 'ai-generated' : hotel.imageSource) as string | undefined;
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  // Reset when imageUrl changes (e.g. AI image loads in)
  React.useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [imageUrl]);

  const tags = (hotel.tags as string[] | undefined) ?? [];

  return (
    <div className="relative border-b border-border overflow-hidden">
      {/* Photo layer */}
      {imageUrl && !imgError ? (
        <div className="relative h-72 md:h-96 bg-neutral-950">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
          )}
          <img
            src={imageUrl}
            alt={String(hotel.name ?? '')}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Image source label */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {isReal && imageSource === 'database' && (
              <span className="px-3 py-1 rounded-full bg-emerald-900/70 text-emerald-300 text-xs font-medium backdrop-blur-sm border border-emerald-700/40">
                ✓ Verified hotel photo
              </span>
            )}
            {imageSource === 'ai-generated' && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-900/70 text-purple-300 text-xs font-medium backdrop-blur-sm border border-purple-700/40">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
            )}
          </div>

          {/* Tags overlay — bottom left above hotel name */}
          {tags.length > 0 && (
            <div className="absolute bottom-20 md:bottom-24 left-6 md:left-8 flex flex-wrap gap-1.5 max-w-md">
              {tags.slice(0, 4).map((tag, i) => (
                <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Hotel info overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < (hotel.rating as number) ? 'text-primary fill-current' : 'text-white/30'}`} />
              ))}
            </div>
            <h3 className="text-2xl md:text-4xl font-serif text-white mb-1" data-testid="text-hotel-name">
              {hotel.name as string}
            </h3>
            {hotel.location && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{hotel.location as string}, {destination}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Elegant placeholder — no generic images, link to exact hotel photos */
        <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex flex-col items-center justify-center py-16 px-8 text-center overflow-hidden min-h-[280px]">
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          {/* Subtle corner accents */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-primary/20 rounded-tl" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-primary/20 rounded-tr" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-primary/20 rounded-bl" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-primary/20 rounded-br" />

          {/* Tags in placeholder */}
          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-5">
              {tags.slice(0, 4).map((tag, i) => (
                <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < (hotel.rating as number) ? 'text-primary fill-current' : 'text-neutral-700'}`} />
            ))}
          </div>
          <h3 className="text-3xl md:text-5xl font-serif mb-3" data-testid="text-hotel-name">{hotel.name as string}</h3>
          {hotel.location && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{hotel.location as string}, {destination}</span>
            </div>
          )}
          <div className="text-2xl text-primary font-mono mb-7">{hotel.pricePerNight as string}</div>

          {/* Placeholder CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <motion.a
              href={bookingUrl}
              onClick={onBookingClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-[0_4px_20px_-6px_rgba(212,175,55,0.5)]"
              data-testid="btn-hotel-book"
            >
              <CalendarCheck className="w-4 h-4" />
              {t('results.hotel.book')}
            </motion.a>
            {onOpenGallery && (
              <motion.button
                onClick={onOpenGallery}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-7 py-3 bg-primary/8 border border-primary/30 text-primary font-medium uppercase tracking-widest text-sm rounded-xl hover:bg-primary/15 transition-colors"
              >
                <Search className="w-4 h-4" />
                {t('results.hotel.photos')}
              </motion.button>
            )}
          </div>
          <p className="mt-4 text-xs text-white/30 tracking-wide">
            {t('results.hotel.tp_note')}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="p-5 bg-card/80 backdrop-blur-sm border-t border-primary/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {imageUrl && !imgError && (
            <div className="hidden sm:flex flex-col justify-center flex-1 min-w-0">
              <div className="text-2xl text-primary font-mono shrink-0 leading-none">{hotel.pricePerNight as string}</div>
              <div className="text-xs text-muted-foreground/60 uppercase tracking-widest mt-0.5">{t('results.hotel.per_night')}</div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <motion.button
              onClick={onBookingClick}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 30px -8px rgba(212,175,55,0.6)' }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded-xl transition-colors shadow-[0_4px_20px_-8px_rgba(212,175,55,0.4)]"
              data-testid="btn-hotel-book"
            >
              <CalendarCheck className="w-4 h-4" />
              {t('results.hotel.book')}
            </motion.button>
            {onOpenGallery && (
              <motion.button
                onClick={onOpenGallery}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 border border-primary/30 text-primary font-medium uppercase tracking-widest text-sm rounded-xl hover:bg-primary/8 transition-colors"
                data-testid="btn-hotel-gallery"
              >
                <Images className="w-4 h-4" />
                {t('results.hotel.gallery')}
              </motion.button>
            )}
          </div>
        </div>
        {/* Verified badge + redirect notice */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 border border-emerald-800/25 rounded-lg w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-400/80 font-medium tracking-wide">{t('results.hotel.verified_partner')}</span>
          </div>
          <p className="text-xs text-muted-foreground/35 tracking-wide leading-relaxed">{t('results.hotel.redirect_notice')}</p>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { result, setResult, hotelPrefs, language } = usePlanContext();
  const t = useT();
  const { toast } = useToast();
  const isAllInclusive = hotelPrefs.includes('all_inclusive');
  const lang = language ?? 'en';

  const { user, saveTrip, openAuthModal, refreshTrips } = useAuth();

  // AI-generated hotel image state (fallback when no real photo is found)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [tripSaved, setTripSaved] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ url: string; trusted: boolean } | null>(null);
  // Prevent double-click from opening booking twice (debounce 1.5 s)
  const lastBookingClickMs = useRef<number>(0);

  useEffect(() => {
    if (!result) setLocation('/');
  }, [result, setLocation]);

  // Sync saved trips when a result is loaded (auto-save happens on the backend)
  useEffect(() => {
    if (result && user) {
      refreshTrips().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, [result?.destination, (result?.hotel as any)?.name, user?.id]);

  const hotel = result ? (((result.hotel as any) ?? null) as Record<string, any> | null) : null;

  // Fetch AI-generated hotel image when no real image is available
  useEffect(() => {
    if (!hotel) return;
    const existingUrl = hotel.imageUrl as string | null | undefined;
    if (existingUrl || aiImageUrl || aiImageLoading) return;

    const imagePrompt = hotel.imagePrompt as string | undefined;
    const hotelNameEn = (hotel.nameEn ?? hotel.name) as string;
    const destination = result?.destination ?? '';

    setAiImageLoading(true);
    fetch('/api/voyage/hotel-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelName: hotelNameEn, destination, imagePrompt }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: { imageUrl?: string } | null) => {
        if (data?.imageUrl) setAiImageUrl(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => setAiImageLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel?.name]);

  if (!result) return null;

  // Null-safe hotel data — backend always provides a fallback object, but guard here too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotelData = (((result.hotel as any) ?? {}) as Record<string, any>);

  const hotelSearchName = ((hotelData.nameEn ?? hotelData.name ?? result.destination) as string);
  const hotelCity = (hotelData.location as string | undefined) ?? '';
  const bookingUrl = buildHotelBookingUrl(hotelSearchName, hotelCity, result.destination, lang);
  const similarUrl = `https://search.hotellook.com/?query=${encodeURIComponent(result.destination)}&lang=${lang === 'ru' ? 'ru' : 'en'}&marker=${TP_MARKER}`;

  // Resolved image: DB photo takes priority, then AI-generated
  const resolvedImageUrl = (hotelData.imageUrl as string | null | undefined) ?? aiImageUrl;
  const resolvedIsAi = !hotelData.imageUrl && !!aiImageUrl;

  // Open external link via the confirmation modal — always shows the modal
  const openBookingLink = (url: string) => {
    const trusted = !!url && isBookingUrlTrusted(url);
    setBookingModal({ url: url ?? '', trusted });
  };

  // Confirmed by user in the redirect modal — actually open the URL
  const handleBookingConfirm = () => {
    const url = bookingModal?.url;
    setBookingModal(null);
    if (!url) return;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      window.location.href = url;
    }
  };

  // iOS WebView–safe booking link handler with trusted-URL check + double-click guard
  const handleBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Debounce: ignore if same button clicked within 1.5 s
    const now = Date.now();
    if (now - lastBookingClickMs.current < 1500) return;
    lastBookingClickMs.current = now;
    openBookingLink(bookingUrl);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: t('results.copied_toast') });
  };

  const handleSave = async () => {
    if (!user) { openAuthModal(); return; }
    if (tripSaved) return;
    const { error } = await saveTrip(result as unknown as Record<string, unknown>, {
      destination: result.destination,
      city: hotelCity || undefined,
      duration: `${result.dayPlan?.length ?? 0} days`,
      hotelName: hotelSearchName,
    });
    if (!error) {
      setTripSaved(true);
      toast({ title: t('results.saved_toast') });
      setTimeout(() => setTripSaved(false), 4000);
    }
  };

  const handlePlanNew = () => { setResult(null); setLocation('/plan'); };

  const hasIncludedActivities = result.activities?.some((a: any) => a.included);

  return (
    <Layout>
      <div className="min-h-[100dvh] pb-24">

        {/* User menu — top right of results page */}
        <div className="fixed top-4 right-4 z-40 md:top-5 md:right-6">
          <UserMenu compact />
        </div>

        {/* DESTINATION TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="pt-36 pb-8 text-center px-4"
        >
          {/* Cache label — shown when result was served from global shared cache */}
          {!!(result as unknown as Record<string, unknown>).fromCache && !(result as unknown as Record<string, unknown>).fromMock && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-primary/8 border border-primary/20 text-primary/60 text-xs tracking-wide"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              Маршрут создан на основе похожего запроса
            </motion.div>
          )}
          {/* Mock label — shown when AI was unavailable and a fallback plan was served */}
          {!!(result as unknown as Record<string, unknown>).fromMock && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/70 text-xs tracking-wide"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              Демо-маршрут — AI временно недоступен. Данные приблизительные, проверьте перед бронированием.
            </motion.div>
          )}
          <span className="inline-block px-4 py-1 rounded-full border border-primary/30 text-primary text-xs uppercase tracking-widest bg-primary/5 mb-6">
            {result.dayPlan?.length ?? 0} {t('plan.step6.title').replace(/\?/g, '').trim()}
          </span>
          <h1 className="text-5xl md:text-7xl font-serif mb-6" data-testid="text-result-dest">
            {result.destination}
          </h1>
          {/* Save trip + account row */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={handleSave}
              disabled={tripSaved}
              whileHover={{ scale: tripSaved ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs uppercase tracking-widest font-medium transition-colors ${
                tripSaved
                  ? 'border-emerald-600/40 text-emerald-400 bg-emerald-950/20'
                  : 'border-primary/30 text-primary hover:bg-primary/10'
              }`}
            >
              {tripSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {tripSaved ? (lang === 'ru' ? 'Сохранено!' : 'Saved!') : t('auth.save_trip')}
            </motion.button>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 md:px-8 max-w-6xl">

          {/* ═══ HOTEL CARD ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-20"
          >
            <h2 className="text-xs uppercase tracking-widest text-primary font-semibold mb-6">
              {t('results.hotel')}
            </h2>

            <div className="rounded-2xl border border-border overflow-hidden bg-card">

              {/* Hotel photo area */}
              <HotelPhotoHeader
                hotel={hotelData}
                destination={result.destination}
                bookingUrl={bookingUrl}
                onOpenGallery={resolvedImageUrl ? () => { console.log('[Voyage] Gallery open:', { hotel: hotelSearchName, city: hotelCity }); setGalleryOpen(true); } : null}
                imageOverride={aiImageUrl}
                t={t}
                lang={lang}
                onBookingClick={handleBookingClick}
              />

              {/* ── Hotel Room Pricing Strip ── */}
              <div className="px-6 md:px-8 py-6 bg-neutral-950/70 border-b border-border">
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-5">
                  {t('results.hotel.room_pricing')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {hotelData.roomType && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/50 mb-1.5">{t('results.hotel.room_type')}</div>
                      <div className="text-sm font-medium text-foreground leading-tight">{hotelData.roomType as string}</div>
                    </div>
                  )}
                  {hotelData.pricePerNight && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/50 mb-1.5">{t('results.hotel.per_night')}</div>
                      <div className="text-xl font-mono text-primary">{hotelData.pricePerNight as string}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary/50 mb-1.5">{t('results.hotel.rooms_x_nights')}</div>
                    <div className="text-xl font-mono">
                      {hotelData.roomsNeeded as number ?? 1} × {hotelData.nightsCount as number ?? '—'}
                    </div>
                  </div>
                  {hotelData.hotelTotal && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/50 mb-1.5">{t('results.hotel.hotel_total')}</div>
                      <div className="text-2xl font-serif text-primary font-semibold">{hotelData.hotelTotal as string}</div>
                    </div>
                  )}
                </div>

                {/* All-inclusive breakdown */}
                {isAllInclusive && hotelData.allInclusivePerNight && (
                  <div className="mt-6 pt-6 border-t border-emerald-900/40">
                    <p className="text-xs uppercase tracking-widest text-emerald-500/70 font-semibold mb-4">
                      {t('results.hotel.allinclusive_breakdown')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-emerald-500/50 mb-1.5">{t('results.hotel.base_room')}</div>
                        <div className="text-lg font-mono text-foreground/80">{hotelData.pricePerNight as string}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-widest text-emerald-500/50 mb-1.5">{t('results.hotel.ai_package')}</div>
                        <div className="text-lg font-mono text-emerald-400">{hotelData.allInclusivePerNight as string}</div>
                      </div>
                      {hotelData.allInclusiveTotalPerNight && (
                        <div>
                          <div className="text-xs uppercase tracking-widest text-emerald-500/50 mb-1.5">{t('results.hotel.total_per_night')}</div>
                          <div className="text-lg font-mono">{hotelData.allInclusiveTotalPerNight as string}</div>
                        </div>
                      )}
                      {hotelData.allInclusiveHotelTotal && (
                        <div>
                          <div className="text-xs uppercase tracking-widest text-emerald-500/50 mb-1.5">{t('results.hotel.ai_total')}</div>
                          <div className="text-2xl font-serif text-emerald-400 font-semibold">{hotelData.allInclusiveHotelTotal as string}</div>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-xs text-emerald-400/60 leading-relaxed">
                      {t('results.hotel.ai_includes')}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Closest Match Banner ── */}
              {hotelData.isClosestMatch && (
                <div className="px-6 md:px-8 py-5 bg-amber-950/25 border-b border-amber-800/30">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
                        {t('results.hotel.closest_match_banner')}
                      </p>
                      <p className="text-sm text-amber-200/80 leading-relaxed">
                        {(hotelData.closestMatchNote as string) || t('results.hotel.closest_match_note')}
                      </p>
                      {/* Original selection pill */}
                      {hotelData.originalAccommodation && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-amber-400/60 uppercase tracking-widest shrink-0">
                            {lang === 'ru' ? 'Ваш выбор:' : 'Your selection:'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300/90 text-xs font-medium">
                            {hotelData.originalAccommodation as string}
                          </span>
                          <span className="text-amber-600/50 text-xs">→</span>
                          {(hotelData.suggestedAlternatives as string[] | undefined ?? []).slice(0, 2).map((alt) => (
                            <span key={alt} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300/80 text-xs font-medium">
                              {alt}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Booking availability notice */}
                      <p className="text-xs text-amber-400/50 mt-2 italic">
                        {lang === 'ru'
                          ? 'Рекомендуемый тип размещения — проверьте наличие перед бронированием.'
                          : 'Recommended accommodation type — verify availability before booking.'}
                      </p>
                    </div>
                  </div>

                  {/* Two columns: missing vs matched */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    {/* Missing features */}
                    {(hotelData.missingFeatures as string[] | undefined ?? []).length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-red-400/70 font-semibold mb-2">
                          {t('results.hotel.missing_features')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(hotelData.missingFeatures as string[]).map((feat) => (
                            <span key={feat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-800/30 text-red-300/80 text-xs font-medium">
                              <X className="w-2.5 h-2.5 shrink-0" />
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Matched features */}
                    {(hotelData.matchedFeatures as string[] | undefined ?? []).length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-400/70 font-semibold mb-2">
                          {t('results.hotel.matched_features')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(hotelData.matchedFeatures as string[]).map((feat) => (
                            <span key={feat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-300/80 text-xs font-medium">
                              <Check className="w-2.5 h-2.5 shrink-0" />
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hotellook search link */}
                  {hotelData.hotellookSearchUrl && (
                    <div className="mt-4 pt-4 border-t border-amber-800/20">
                      <motion.button
                        type="button"
                        onClick={() => openBookingLink(hotelData.hotellookSearchUrl as string)}
                        whileHover={{ scale: 1.01 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/30 border border-amber-700/30 text-amber-300 text-xs font-semibold uppercase tracking-widest hover:bg-amber-900/50 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 shrink-0" />
                        {t('results.hotel.search_hotellook')}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* Hotel body */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-primary mb-3">{t('results.hotel.about')}</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed">{hotelData.description}</p>
                  </div>
                  <div className="bg-background/50 rounded-xl border border-border/60 p-5 space-y-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-primary mb-2">{t('results.why')}</h4>
                      <p className="text-sm italic text-foreground/70 leading-relaxed">"{hotelData.whyItFits}"</p>
                    </div>
                    {hotelData.whyThisArea && (
                      <div className="pt-3 border-t border-border/40">
                        <h4 className="text-xs uppercase tracking-widest text-primary/60 mb-2">{t('results.hotel.why_area')}</h4>
                        <p className="text-sm text-foreground/65 leading-relaxed">{hotelData.whyThisArea as string}</p>
                      </div>
                    )}
                    {hotelData.bestFor && (
                      <div className="pt-3 border-t border-border/40 flex items-start gap-2">
                        <span className="text-primary/40 text-xs uppercase tracking-widest shrink-0 mt-0.5">{t('results.hotel.best_for')}</span>
                        <p className="text-sm text-primary/80 font-medium leading-snug">{hotelData.bestFor as string}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t('results.hotel.amenities')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {(hotelData.amenities as string[] | undefined ?? []).map((am: string) => (
                        <span key={am} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 font-medium">
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI image loading indicator */}
                  {aiImageLoading && !hotelData.imageUrl && !aiImageUrl && (
                    <div className="flex items-center gap-2 text-xs text-purple-400/70 bg-purple-900/10 border border-purple-800/20 rounded-lg px-4 py-3">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      <span>{t('results.hotel.generating_image')}</span>
                    </div>
                  )}

                  <motion.a
                    href={similarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-border hover:border-primary/50 text-foreground/80 transition-colors rounded-xl text-sm font-medium tracking-wide"
                    data-testid="btn-hotel-similar"
                  >
                    <Search className="w-4 h-4" />
                    {t('results.hotel.similar')}
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══ AI EXPLANATION ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-card border border-border p-8 rounded-xl mb-20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <h3 className="text-primary text-xs uppercase tracking-widest font-semibold mb-4">{t('results.why')}</h3>
            <p className="text-lg leading-relaxed text-muted-foreground font-serif italic">
              "{result.explanation}"
            </p>
          </motion.div>

          {/* ═══ RESTAURANTS ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-serif mb-8 border-b border-border pb-4">{t('results.restaurants')}</h2>
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-5 no-scrollbar">
              {(result.restaurants ?? []).map((rest, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[280px] md:w-[360px] flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="h-0.5 bg-gradient-to-r from-primary/60 to-primary/10" />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-serif leading-tight flex-1">{rest.name}</h3>
                      <span className="text-primary font-mono text-sm ml-3 shrink-0">{rest.averageCheck}</span>
                    </div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{rest.style}</span>
                    <p className="text-sm text-foreground/75 mb-5 flex-1 leading-relaxed">{rest.whyItFits}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-primary" />
                        {rest.location}
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(rest.name + ' ' + result.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs uppercase tracking-widest hover:underline ml-3"
                      >
                        {t('results.rest.view_map')}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ═══ ACTIVITIES ═══ */}
          {result.activities && result.activities.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="text-3xl font-serif mb-8 border-b border-border pb-4">{t('results.activities')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.activities.map((act: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-card border rounded-xl p-6 flex flex-col gap-3 transition-colors duration-300 ${act.included ? 'border-emerald-800/40 hover:border-emerald-700/60' : 'border-border hover:border-primary/40'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-serif leading-tight">{act.name}</h3>
                      {act.included ? (
                        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-900/40 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-700/40 uppercase tracking-wide">
                          <Check className="w-3 h-3" />
                          {t('results.activity.included')}
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-background text-muted-foreground text-xs rounded-full border border-border uppercase tracking-wide">
                          <BadgeDollarSign className="w-3 h-3" />
                          {t('results.activity.extra')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
                      <span className="text-muted-foreground">{act.duration}</span>
                      {act.included ? (
                        <span className="text-emerald-400 font-medium">
                          {isAllInclusive ? t('results.activity.included_in') : t('results.activity.included')}
                        </span>
                      ) : (
                        <span className="text-primary font-mono">{act.price}</span>
                      )}
                    </div>

                    <p className="text-sm text-foreground/70 leading-relaxed">{act.whyItFits}</p>
                  </motion.div>
                ))}
              </div>

              {/* All-inclusive note */}
              {(isAllInclusive || hasIncludedActivities) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-6 flex items-start gap-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-5"
                >
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-300/80">{t('results.budget.allincl_note')}</p>
                </motion.div>
              )}
            </motion.section>
          )}

          {/* ═══ ITINERARY ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-serif mb-12 border-b border-border pb-4">{t('results.itinerary')}</h2>
            <div className="space-y-10 max-w-4xl mx-auto">
              {(result.dayPlan ?? []).map((day, i) => (
                <div key={i} data-testid={`card-day-${day.day}`}>
                  <div className="md:grid md:grid-cols-[120px_1fr] gap-8 items-start">
                    <div className="hidden md:flex justify-end pt-1">
                      <span className="text-4xl font-serif text-primary opacity-30 leading-none">
                        {String(day.day).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-serif mb-4 text-primary flex items-center gap-3">
                        <span className="md:hidden text-primary/40 font-mono text-sm">
                          {String(day.day).padStart(2, '0')}
                        </span>
                        {day.title}
                      </h3>
                      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                        <div className="flex gap-4 items-start p-5">
                          <Sun className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed text-foreground/80">{day.morning}</p>
                        </div>
                        <div className="flex gap-4 items-start p-5">
                          <Coffee className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed text-foreground/80">{day.afternoon}</p>
                        </div>
                        <div className="flex gap-4 items-start p-5">
                          <Moon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed text-foreground/80">{day.evening}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ═══ BUDGET BREAKDOWN ═══ */}
          {result.budgetBreakdown && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="text-3xl font-serif mb-8 border-b border-border pb-4">{t('results.budget')}</h2>
              <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 space-y-0">
                  {[
                    { key: 'hotel', label: t('results.cost.hotel') },
                    { key: 'flightEstimate', label: t('results.cost.flights') },
                    { key: 'food', label: t('results.cost.food') },
                    { key: 'activities', label: t('results.cost.activities') },
                    { key: 'transport', label: t('results.cost.transport') },
                    { key: 'airportTransfer', label: t('results.cost.airport') },
                    { key: 'cityTax', label: t('results.cost.city_tax') },
                    { key: 'travelInsurance', label: t('results.cost.insurance') },
                    { key: 'visa', label: t('results.cost.visa') },
                    { key: 'shopping', label: t('results.cost.shopping') },
                  ].filter(item => result.budgetBreakdown[item.key]).map((item, i) => (
                    <div key={item.key} className={`flex items-center justify-between py-3.5 ${i > 0 ? 'border-t border-border/50' : ''}`}>
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-sm text-foreground/90">{result.budgetBreakdown[item.key]}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/5 border-t border-primary/20 px-6 py-5 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-widest text-primary font-semibold">{t('results.cost.total')}</span>
                  <span className="text-2xl font-serif text-primary font-semibold">{result.budgetBreakdown.total}</span>
                </div>
                <div className="px-6 py-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground/50">
                    {t('results.cost.note')} {result.budgetBreakdown.guests ?? '2'} {t('plan.step1.guests')}
                  </p>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-2xl mx-auto">
                <motion.button
                  onClick={handlePlanNew}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {t('results.cost.recalculate')}
                </motion.button>
                <motion.button
                  onClick={handleShare}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-border hover:border-primary/40 text-foreground/80 text-sm rounded-xl transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {t('results.share')}
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 border border-border hover:border-primary/40 text-foreground/80 text-sm rounded-xl transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* ═══ MOBILE SUMMARY ═══ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="md:hidden bg-card border border-border rounded-xl p-6 mb-20 space-y-4"
          >
            {(hotelData.roomType || hotelData.nightsCount || hotelData.hotelTotal) && (
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">{t('results.hotel.room_pricing')}</p>
                <div className="grid grid-cols-2 gap-4">
                  {hotelData.roomType && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/60 mb-1">{t('results.hotel.room_type')}</div>
                      <div className="text-sm font-medium text-foreground/90 leading-tight">{hotelData.roomType as string}</div>
                    </div>
                  )}
                  {hotelData.nightsCount && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/60 mb-1">{t('results.hotel.nights')}</div>
                      <div className="text-2xl font-serif text-primary">{hotelData.nightsCount as number}</div>
                    </div>
                  )}
                  {hotelData.roomsNeeded && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/60 mb-1">{t('results.hotel.rooms_needed')}</div>
                      <div className="text-2xl font-serif text-primary">{hotelData.roomsNeeded as number}</div>
                    </div>
                  )}
                  {hotelData.hotelTotal && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary/60 mb-1">{t('results.hotel.hotel_total')}</div>
                      <div className="text-xl font-mono text-primary">{hotelData.hotelTotal as string}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <motion.button
                onClick={handleBookingClick}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs rounded-xl"
                data-testid="btn-hotel-book-mobile"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {t('results.hotel.book')}
              </motion.button>
              {resolvedImageUrl && (
                <motion.button
                  onClick={() => setGalleryOpen(true)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-primary/30 text-primary font-medium uppercase tracking-widest text-xs rounded-xl"
                >
                  <Images className="w-3.5 h-3.5" />
                  {t('results.hotel.gallery')}
                </motion.button>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Hotel gallery modal */}
      {galleryOpen && resolvedImageUrl && (
        <HotelGalleryModal
          hotel={hotelData}
          imageUrl={resolvedImageUrl}
          isAiGenerated={resolvedIsAi}
          destination={result.destination}
          bookingUrl={bookingUrl}
          lang={lang}
          onClose={() => setGalleryOpen(false)}
          onBook={handleBookingClick}
        />
      )}

      {/* Booking redirect confirmation modal */}
      <BookingRedirectModal
        open={bookingModal !== null}
        url={bookingModal?.url ?? ''}
        isTrusted={bookingModal?.trusted ?? true}
        onConfirm={handleBookingConfirm}
        onClose={() => setBookingModal(null)}
      />
    </Layout>
  );
}
