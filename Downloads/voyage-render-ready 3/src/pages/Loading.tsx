import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { PlaneTakeoff, AlertCircle, RefreshCw } from 'lucide-react';
import { usePlanContext, type VoyagePlanResult } from '@/lib/plan-context';
import { useT } from '@/lib/i18n';

// Build a deterministic client-side fallback shown after 60-second timeout
function buildClientFallback(ctx: ReturnType<typeof usePlanContext>): VoyagePlanResult {
  const dest = ctx.destination || 'Your Destination';
  const cityName = ctx.city || dest;
  const nights = parseInt(ctx.duration) || 5;
  const enc = encodeURIComponent;

  const TITLES = ['Arrival & First Impressions', 'City Exploration', 'Cultural Highlights', 'Local Experiences', 'Day Trip & Adventure', 'Shopping & Leisure', 'Departure Day'];
  const MORNINGS = [
    `Arrive at ${cityName} and check into your hotel. Take a refreshing shower and enjoy a welcome drink.`,
    `Breakfast at a local café, then explore the main squares and landmarks of ${cityName}.`,
    `Visit the most important historical sites and museums in ${cityName}.`,
    `Join a guided local tour or cooking class to experience authentic ${dest} culture.`,
    `Set out early for a scenic day trip outside ${cityName} to explore natural highlights.`,
    `Explore the best shopping districts and boutiques of ${cityName} for local crafts.`,
    `Final leisurely breakfast and a last stroll around your favourite neighbourhood.`,
  ];
  const AFTERNOONS = [
    `Explore the neighbourhood around your hotel. Stop at a local café for your first taste of ${dest}.`,
    `Visit a renowned museum or art gallery, then enjoy lunch at a well-regarded local restaurant.`,
    `Wander through colourful local markets and parks. Sample street food and soak in the atmosphere.`,
    `Explore artisan workshops and hidden gems recommended by locals.`,
    `Enjoy nature, countryside or coastal scenery. A relaxed picnic or lunch at the destination.`,
    `Visit a local spa or wellness centre for an afternoon of relaxation and rejuvenation.`,
    `Check out of the hotel. Store luggage and enjoy last moments at a favourite spot.`,
  ];
  const EVENINGS = [
    `Welcome dinner at a well-rated local restaurant. Toast to the start of your ${dest} adventure.`,
    `Sunset from a rooftop terrace or viewpoint, then dinner at a restaurant recommended by locals.`,
    `Dinner at a traditional restaurant featuring the most iconic dishes of ${dest}.`,
    `Evening at a local cultural performance, jazz bar, or rooftop lounge.`,
    `Return to ${cityName} and enjoy a relaxing rooftop dinner with panoramic views.`,
    `Farewell dinner at the best restaurant of your trip — celebrate your final evening in style.`,
    `Transfer to the airport. Safe travels and wonderful memories from ${dest}!`,
  ];

  const dayPlan = Array.from({ length: Math.min(nights, 7) }, (_, i) => ({
    day: i + 1,
    title: TITLES[i] || `Day ${i + 1}`,
    morning: MORNINGS[i] || `Explore ${dest} in the morning.`,
    afternoon: AFTERNOONS[i] || 'Visit local attractions.',
    evening: EVENINGS[i] || 'Dinner at a local restaurant.',
  }));
  while (dayPlan.length < nights) {
    const i = dayPlan.length;
    dayPlan.push({ day: i + 1, title: `Day ${i + 1}`, morning: `Explore ${dest}.`, afternoon: 'Visit local attractions.', evening: 'Dinner at a local restaurant.' });
  }

  const hotelName = `${dest} Premier Hotel`;
  return {
    destination: dest,
    explanation: `A curated travel plan for ${dest}, designed to match your travel style with the best local experiences.`,
    hotel: {
      name: hotelName,
      rating: 4,
      pricePerNight: '$150/night',
      description: `A comfortable hotel in the heart of ${cityName} with excellent service and a prime location.`,
      whyItFits: `Perfectly located for exploring ${dest} with easy access to major attractions.`,
      amenities: ['Wi-Fi', 'Breakfast', 'Gym', 'Concierge', 'Restaurant'],
      imagePrompt: '',
      location: cityName,
      hotelUrl: `https://www.booking.com/searchresults.html?aid=529629&ss=${enc(dest)}`,
      imageUrl: '',
      photosUrl: `https://www.booking.com/search.html?ss=${enc(hotelName)}`,
    },
    restaurants: [
      { name: `${dest} Heritage Kitchen`, style: 'Local', averageCheck: '$20-40/person', whyItFits: 'Authentic local flavours in a warm traditional setting.', location: cityName, imagePrompt: '' },
      { name: 'The Grand Brasserie', style: 'International', averageCheck: '$35-60/person', whyItFits: 'Modern cuisine with a great atmosphere.', location: cityName, imagePrompt: '' },
    ],
    activities: [],
    dayPlan,
    budgetBreakdown: {
      hotel: '', food: '', activities: '', transport: '',
      total: 'Varies by preferences',
      guests: ctx.guests || '2',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function useRestoreFromSession(ctx: ReturnType<typeof usePlanContext>) {
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    const isUnlocked = new URLSearchParams(window.location.search).get('unlocked') === '1';
    if (!isUnlocked) return;

    try {
      const raw = sessionStorage.getItem('voyage_plan_draft');
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (!ctx.destination && draft.destination) ctx.setDestination(String(draft.destination));
      if (!ctx.city && draft.city) ctx.setCity(String(draft.city));
      if (!ctx.travelLevel && draft.travelLevel) ctx.setTravelLevel(String(draft.travelLevel));
      if (!ctx.duration && draft.duration) ctx.setDuration(String(draft.duration));
      if (!ctx.budget && draft.budget) ctx.setBudget(String(draft.budget));
      if (Array.isArray(draft.tripTypes) && !ctx.tripTypes.length) ctx.setTripTypes(draft.tripTypes as string[]);
      if (Array.isArray(draft.hotelPrefs) && !ctx.hotelPrefs.length) ctx.setHotelPrefs(draft.hotelPrefs as string[]);
      if (Array.isArray(draft.restaurantPrefs) && !ctx.restaurantPrefs.length) ctx.setRestaurantPrefs(draft.restaurantPrefs as string[]);
      if (draft.guests) ctx.setGuests(String(draft.guests));
      if (draft.rooms) ctx.setRooms(String(draft.rooms));
      if (draft.roomType) ctx.setRoomType(String(draft.roomType));
      sessionStorage.removeItem('voyage_plan_draft');
    } catch (_) { }
    restored.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

type JobStatus = 'idle' | 'starting' | 'polling' | 'done' | 'error';

export default function Loading() {
  const [, setLocation] = useLocation();
  const planContext = usePlanContext();
  const { result, setResult } = planContext;
  const t = useT();

  const [textIndex, setTextIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetried, setAutoRetried] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [serverError, setServerError] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetched = useRef(false);

  useRestoreFromSession(planContext);

  const loadingTexts: string[] = t('loading.texts');

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  // Cleanup poll interval and timeout on unmount
  useEffect(() => () => { clearPoll(); clearTimeout_(); }, [clearPoll, clearTimeout_]);

  const doFetch = useCallback(() => {
    clearPoll();
    setJobStatus('starting');

    const body = {
      destination: planContext.destination,
      city: planContext.city || undefined,
      travelLevel: planContext.travelLevel,
      tripTypes: planContext.tripTypes,
      hotelPrefs: planContext.hotelPrefs,
      restaurantPrefs: planContext.restaurantPrefs,
      duration: planContext.duration,
      budget: planContext.budget,
      language: planContext.language || 'en',
      guests: planContext.guests || '2',
      rooms: planContext.rooms || '1',
      roomType: planContext.roomType || 'standard',
    };

    // Attach Bearer token so server can authenticate and auto-save trip
    const storedAuth = localStorage.getItem('voyage_auth');
    const authToken: string | null = storedAuth ? (JSON.parse(storedAuth) as { token?: string }).token ?? null : null;

    fetch('/api/voyage/plan-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    })
      .then((r) => r.ok ? r.json() as Promise<{ jobId: string }> : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(({ jobId }) => {
        setJobStatus('polling');

        // 60-second safety timeout — show deterministic fallback instead of error screen
        clearTimeout_();
        timeoutRef.current = setTimeout(() => {
          clearPoll();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResult(buildClientFallback(planContext) as any);
          setLocation('/results');
        }, 60000);

        pollRef.current = setInterval(() => {
          fetch(`/api/voyage/job/${jobId}`)
            .then((r) => r.ok ? r.json() as Promise<{ status: string; result?: Record<string, unknown>; message?: string }> : null)
            .then((job) => {
              if (!job) return;
              if (job.status === 'done' && job.result) {
                clearPoll();
                clearTimeout_();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setResult(job.result as any);
                setLocation('/results');
              } else if (job.status === 'error') {
                clearPoll();
                clearTimeout_();
                setServerError(job.message ?? '');
                setJobStatus('error');
              }
            })
            .catch(() => { });
        }, 3000);
      })
      .catch(() => {
        clearTimeout_();
        setJobStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planContext.destination, planContext.city, planContext.travelLevel, planContext.tripTypes,
      planContext.hotelPrefs, planContext.restaurantPrefs, planContext.duration, planContext.budget,
      planContext.language, planContext.guests, planContext.rooms, planContext.roomType]);

  // Initial fetch — run once when component mounts
  useEffect(() => {
    if (!hasFetched.current && !result) {
      hasFetched.current = true;
      doFetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-retry once on first error
  useEffect(() => {
    if (jobStatus === 'error' && !autoRetried) {
      setAutoRetried(true);
      setRetryCount(1);
      const timer = setTimeout(() => {
        hasFetched.current = false;
        doFetch();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobStatus]);

  // Rotate loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loadingTexts.length]);

  const handleRetry = () => {
    clearPoll();
    setAutoRetried(false);
    setJobStatus('idle');
    hasFetched.current = false;
    setRetryCount((c) => c + 1);
    doFetch();
  };

  const isError = jobStatus === 'error';

  // Show final error state only after auto-retry has also failed
  if (isError && autoRetried) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center flex flex-col items-center shadow-2xl"
        >
          <AlertCircle className="w-12 h-12 text-destructive mb-6" />
          <h2 className="text-2xl font-serif mb-3">{t('loading.error')}</h2>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {planContext.destination
              ? `Не удалось создать маршрут для ${planContext.destination}. Попробуйте ещё раз.`
              : t('loading.error')}
          </p>
          {serverError && (
            <p className="text-xs text-muted-foreground/50 mb-6 leading-relaxed bg-white/5 rounded-lg px-3 py-2 border border-white/8 text-left">
              {serverError.length > 200 ? serverError.slice(0, 200) + '…' : serverError}
            </p>
          )}
          <div className="flex flex-col gap-3 w-full">
            <motion.button
              onClick={handleRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-8 py-3.5 rounded-xl uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('loading.try_again')}
            </motion.button>
            <button
              onClick={() => setLocation('/plan')}
              className="text-muted-foreground/60 text-xs uppercase tracking-widest hover:text-primary transition-colors py-2"
            >
              ← Change destinations
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Auto-retry in progress
  if (isError && !autoRetried) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
            <RefreshCw className="w-12 h-12 text-primary" />
          </motion.div>
          <p className="font-serif text-xl text-primary text-center">Refining your plan…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-12"
        >
          <PlaneTakeoff className="w-16 h-16 text-primary" />
        </motion.div>

        {retryCount > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-primary/50 uppercase tracking-widest mb-4">
            Retrying…
          </motion.p>
        )}

        <div className="h-12 overflow-hidden relative w-full flex justify-center">
          <motion.h2
            key={textIndex}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-2xl md:text-3xl text-center absolute text-primary"
            data-testid="text-loading-status"
          >
            {loadingTexts[textIndex]}
          </motion.h2>
        </div>

        {planContext.destination && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-xs uppercase tracking-widest text-muted-foreground/40"
          >
            {planContext.destination}
          </motion.p>
        )}
      </div>
    </div>
  );
}
