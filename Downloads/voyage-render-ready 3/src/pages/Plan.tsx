import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Briefcase, DollarSign, Mountain, Waves, Heart, Users, Music2,
  Sparkles, Utensils, Leaf, ShoppingBag, Camera, Dumbbell, Compass, Flower2
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { usePlanContext } from '@/lib/plan-context';
import { useT } from '@/lib/i18n';
import { isDevUnlocked } from '@/lib/dev-bypass';
import { DestinationSearch } from '@/components/DestinationSearch';
import { useAuth } from '@/lib/auth-context';

const PAYWALL_ENABLED = true;

const TOTAL_STEPS = 9;

const MAIN_CATEGORIES = [
  { id: 'luxury_exp',    Icon: Crown,      color: 'from-amber-500/20 to-yellow-500/10',   border: 'border-amber-500/40' },
  { id: 'business_trip', Icon: Briefcase,  color: 'from-blue-500/20 to-slate-500/10',     border: 'border-blue-500/40' },
  { id: 'budget_trip',   Icon: DollarSign, color: 'from-emerald-500/20 to-green-500/10',  border: 'border-emerald-500/40' },
  { id: 'ski',           Icon: Mountain,   color: 'from-sky-500/20 to-blue-400/10',       border: 'border-sky-500/40' },
  { id: 'beach',         Icon: Waves,      color: 'from-cyan-500/20 to-teal-500/10',      border: 'border-cyan-500/40' },
  { id: 'romantic',      Icon: Heart,      color: 'from-rose-500/20 to-pink-500/10',      border: 'border-rose-500/40' },
  { id: 'family',        Icon: Users,      color: 'from-violet-500/20 to-purple-500/10',  border: 'border-violet-500/40' },
  { id: 'nightlife',     Icon: Music2,     color: 'from-fuchsia-500/20 to-pink-600/10',   border: 'border-fuchsia-500/40' },
];

const REFINE_TAGS = [
  { id: 'wellness',   Icon: Flower2 },
  { id: 'adventure',  Icon: Compass },
  { id: 'shopping',   Icon: ShoppingBag },
  { id: 'food_tour',  Icon: Utensils },
  { id: 'honeymoon',  Icon: Sparkles },
  { id: 'spa',        Icon: Leaf },
  { id: 'sport',      Icon: Dumbbell },
  { id: 'nature',     Icon: Leaf },
  { id: 'tiktok',     Icon: Camera },
];

export default function Plan() {
  const t = useT();
  const [, setLocation] = useLocation();
  const ctx = usePlanContext();

  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const nextStep = () => { if (step < TOTAL_STEPS) { setDirection(1); setStep(s => s + 1); } };
  const prevStep = () => { if (step > 1) { setDirection(-1); setStep(s => s - 1); } };
  const handleSubmit = () => setLocation(
    (!PAYWALL_ENABLED || isDevUnlocked() || user?.isPremium) ? '/loading' : '/paywall'
  );

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 800 : -800, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit:  (d: number) => ({ zIndex: 0, x: d < 0 ? 800 : -800, opacity: 0 }),
  };

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(i => i !== val) : [...arr, val]);

  const ROOM_COUNT_OPTIONS = ['1', '2', '3'];
  const ROOM_TYPE_OPTIONS  = ['cheapest', 'standard', 'comfort', 'business', 'luxury', 'presidential', 'villa'];
  const GUEST_OPTIONS      = ['1', '2', '3', '4', '5+'];

  return (
    <Layout>
      <div className="relative min-h-[100dvh] flex flex-col pt-24 pb-12 overflow-hidden">

        {/* Progress Bar */}
        <div className="absolute top-20 left-0 w-full h-0.5 bg-border/50 z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/80 to-primary"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="container mx-auto px-6 flex-1 flex flex-col justify-center relative">
          <div className="absolute top-8 right-6 text-xs font-mono text-muted-foreground/50 tracking-widest">
            {t("plan.step")} {step}/{TOTAL_STEPS}
          </div>

          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center relative py-12">
            <AnimatePresence initial={false} custom={direction} mode="wait">

              {/* ── STEP 1: Destination Search ── */}
              {step === 1 && (
                <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-10">

                  <div>
                    <motion.h2
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="text-4xl md:text-5xl font-serif mb-10"
                    >
                      {t("plan.step1.title")}
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <DestinationSearch
                        value={ctx.destination}
                        onChange={(_display, destination, city) => {
                          ctx.setDestination(destination);
                          ctx.setCity(city);
                        }}
                        lang={(ctx.language as 'en' | 'ru') ?? 'en'}
                        placeholder={t("plan.step1.placeholder")}
                        autoFocus
                      />
                    </motion.div>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xs text-muted-foreground/35 tracking-wide leading-relaxed"
                  >
                    {t("plan.step1.hint")}
                  </motion.p>

                </motion.div>
              )}

              {/* ── STEP 2: Travel Level ── */}
              {step === 2 && (
                <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step2.title")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['cheap_perfect','budget','comfort','business','premium','luxury','ultra_luxury'].map(lvl => (
                      <button key={lvl} onClick={() => ctx.setTravelLevel(lvl)}
                        className={`p-6 border text-left rounded-xl transition-all duration-200 group ${ctx.travelLevel === lvl ? 'border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]' : 'border-border/60 hover:border-primary/50'}`}
                        data-testid={`btn-level-${lvl}`}>
                        <h3 className={`text-xl font-serif ${ctx.travelLevel === lvl ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                          {t(`plan.level.${lvl}`)}
                        </h3>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Trip Categories ── */}
              {step === 3 && (
                <motion.div key="s3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-2">{t("plan.step3.title")}</h2>

                  {/* Main category cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MAIN_CATEGORIES.map(({ id, Icon, color, border }) => {
                      const selected = ctx.tripTypes.includes(id);
                      return (
                        <motion.button
                          key={id}
                          onClick={() => toggle(ctx.tripTypes, ctx.setTripTypes, id)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className={`relative overflow-hidden p-5 border rounded-2xl text-left transition-all duration-200 ${
                            selected
                              ? `${border} bg-gradient-to-br ${color} shadow-[0_0_25px_-8px_rgba(212,175,55,0.25)]`
                              : 'border-border/50 hover:border-border bg-card/30'
                          }`}
                          data-testid={`btn-category-${id}`}
                        >
                          {selected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`absolute inset-0 bg-gradient-to-br ${color} opacity-60`}
                            />
                          )}
                          <div className="relative z-10">
                            <div className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              selected ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className={`text-sm font-semibold tracking-wide mb-0.5 transition-colors ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
                              {t(`plan.category.${id}`)}
                            </div>
                            <div className="text-xs text-muted-foreground/60 font-light">
                              {t(`plan.category.${id}.desc`)}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Refinement tags */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-4 font-medium">
                      {t("plan.step3.refine")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REFINE_TAGS.map(({ id, Icon }) => (
                        <button
                          key={id}
                          onClick={() => toggle(ctx.tripTypes, ctx.setTripTypes, id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium tracking-wide transition-all ${
                            ctx.tripTypes.includes(id)
                              ? 'border-primary/60 bg-primary/10 text-primary'
                              : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground/80'
                          }`}
                          data-testid={`pill-type-${id}`}
                        >
                          <Icon className="w-3 h-3" />
                          {t(`plan.type.${id}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Hotel Preferences ── */}
              {step === 4 && (
                <motion.div key="s4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step4.title")}</h2>
                  <div className="flex flex-wrap gap-3">
                    {['water_sports','private_beach','pool','spa','gym','breakfast','sea_view','city_view','near_center','near_beach','adults_only','family_friendly','all_inclusive','luxury_design','photo_spot','quiet','nightlife_nearby'].map(pref => (
                      <button key={pref} onClick={() => toggle(ctx.hotelPrefs, ctx.setHotelPrefs, pref)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-medium tracking-wide transition-all ${ctx.hotelPrefs.includes(pref) ? 'border-primary ring-1 ring-primary/30 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}
                        data-testid={`pill-hotel-${pref}`}>
                        {t(`plan.hotel.${pref}`)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Restaurant Preferences ── */}
              {step === 5 && (
                <motion.div key="s5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step5.title")}</h2>
                  <div className="flex flex-wrap gap-3">
                    {['romantic','michelin','cheap_local','rooftop','sea_view_rest','fine_dining','street_food','family_rest','tiktok_cafe','luxury_dinner','halal','vegan'].map(pref => (
                      <button key={pref} onClick={() => toggle(ctx.restaurantPrefs, ctx.setRestaurantPrefs, pref)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-medium tracking-wide transition-all ${ctx.restaurantPrefs.includes(pref) ? 'border-primary ring-1 ring-primary/30 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}
                        data-testid={`pill-rest-${pref}`}>
                        {t(`plan.rest.${pref}`)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 6: Guests ── */}
              {step === 6 && (
                <motion.div key="s6" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step_guests.title")}</h2>
                  <div className="flex flex-wrap gap-4 mb-6">
                    {GUEST_OPTIONS.map(g => (
                      <button key={g} onClick={() => ctx.setGuests(g)}
                        className={`px-8 py-5 border text-center rounded-xl min-w-[90px] transition-all ${ctx.guests === g ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]' : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                        data-testid={`btn-guests-${g}`}>
                        <div className="text-2xl font-serif mb-0.5">{g}</div>
                        <div className="text-xs uppercase tracking-widest">{t(`plan.guest.${g === '5+' ? '5plus' : g}`)}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                    <span className="text-muted-foreground text-sm">{t("plan.guest.custom")}:</span>
                    <input type="number" min="1" max="20"
                      value={!GUEST_OPTIONS.includes(ctx.guests) ? ctx.guests : ''}
                      onChange={e => ctx.setGuests(e.target.value)}
                      placeholder="6, 8, 10…"
                      className="bg-transparent border-b border-border/60 focus:border-primary text-xl font-light w-28 outline-none px-2"
                      data-testid="input-guests-custom" />
                  </div>
                </motion.div>
              )}

              {/* ── STEP 7: Room Details ── */}
              {step === 7 && (
                <motion.div key="s7" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-2">{t("plan.step_room_details.title")}</h2>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-primary/70 mb-4">{t("plan.room_count.label")}</p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {ROOM_COUNT_OPTIONS.map(n => (
                        <button key={n} onClick={() => ctx.setRooms(n)}
                          className={`w-20 h-20 border text-center rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${ctx.rooms === n ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}
                          data-testid={`btn-rooms-${n}`}>
                          <span className="text-2xl font-serif">{n}</span>
                          <span className="text-xs uppercase tracking-widest">{t("plan.room_count.rooms")}</span>
                        </button>
                      ))}
                      <div className="flex items-center gap-3 px-5 py-3 border border-border/60 rounded-xl">
                        <span className="text-muted-foreground text-sm">{t("plan.room_count.custom")}:</span>
                        <input type="number" min="1" max="20"
                          value={!ROOM_COUNT_OPTIONS.includes(ctx.rooms) ? ctx.rooms : ''}
                          onChange={e => ctx.setRooms(e.target.value)}
                          className="bg-transparent border-b border-border/60 focus:border-primary text-lg font-light w-16 outline-none text-center"
                          data-testid="input-rooms-custom" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-primary/70 mb-4">{t("plan.step_room.title")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {ROOM_TYPE_OPTIONS.map(room => (
                        <button key={room} onClick={() => ctx.setRoomType(room)}
                          className={`p-4 border text-left rounded-xl transition-all group ${ctx.roomType === room ? 'border-primary bg-primary/10 shadow-[0_0_15px_-5px_rgba(212,175,55,0.25)]' : 'border-border/60 hover:border-primary/40'}`}
                          data-testid={`btn-room-${room}`}>
                          <div className={`text-base font-serif mb-0.5 ${ctx.roomType === room ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                            {t(`plan.room.${room}`)}
                          </div>
                          <div className="text-xs text-muted-foreground/60">{t(`plan.room.${room}.desc`)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 8: Duration ── */}
              {step === 8 && (
                <motion.div key="s8" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step6.title")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {[['2-3 days','2_3'],['4-5 days','4_5'],['7 days','7'],['10 days','10'],['14 days','14']].map(([dur, key]) => (
                      <button key={dur} onClick={() => ctx.setDuration(dur)}
                        className={`p-6 border text-center rounded-xl transition-all ${ctx.duration === dur ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]' : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                        data-testid={`btn-dur-${key}`}>
                        <span className="text-lg font-serif">{t(`plan.days.${key}`)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                    <span className="text-muted-foreground font-serif">{t("plan.days.custom")}:</span>
                    <input type="number" min="1"
                      value={!['2-3 days','4-5 days','7 days','10 days','14 days'].includes(ctx.duration) ? ctx.duration : ''}
                      onChange={e => ctx.setDuration(e.target.value)}
                      className="bg-transparent border-b border-border/60 focus:border-primary text-xl font-light w-24 outline-none px-2"
                      data-testid="input-dur-custom" />
                  </div>
                </motion.div>
              )}

              {/* ── STEP 9: Budget ── */}
              {step === 9 && (
                <motion.div key="s9" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif mb-8">{t("plan.step7.title")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {['under_500','500_1000','1000_2500','2500_5000','5000_plus'].map(bud => (
                      <button key={bud} onClick={() => ctx.setBudget(bud)}
                        className={`p-6 border text-center rounded-xl transition-all ${ctx.budget === bud ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]' : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                        data-testid={`btn-budget-${bud}`}>
                        <span className="text-lg font-serif">{t(`plan.budget.${bud}`)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                    <span className="text-muted-foreground font-serif">{t("plan.budget.custom")}:</span>
                    <input type="number" min="0"
                      value={!['under_500','500_1000','1000_2500','2500_5000','5000_plus'].includes(ctx.budget) ? ctx.budget : ''}
                      onChange={e => ctx.setBudget(e.target.value)}
                      className="bg-transparent border-b border-border/60 focus:border-primary text-xl font-light w-32 outline-none px-2"
                      data-testid="input-budget-custom" />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-border/30">
            <button onClick={prevStep}
              className={`px-8 py-3 uppercase tracking-widest text-sm font-semibold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:text-primary'}`}
              data-testid="btn-plan-back">
              {t("plan.back")}
            </button>
            {step < TOTAL_STEPS ? (
              <button onClick={nextStep}
                className="bg-primary text-primary-foreground px-10 py-3 rounded-full uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.5)]"
                data-testid="btn-plan-next">
                {t("plan.next")}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!ctx.budget}
                className="bg-primary text-primary-foreground px-10 py-3 rounded-full uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="btn-plan-submit">
                {t("plan.submit")}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
