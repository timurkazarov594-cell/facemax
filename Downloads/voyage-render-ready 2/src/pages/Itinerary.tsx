import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { useVoyageStore } from '@/lib/store';
import { MapPin, Wallet, CalendarDays, BedDouble, Sun, Moon, Coffee } from 'lucide-react';

export default function Itinerary() {
  const [, setLocation] = useLocation();
  const { currentItinerary } = useVoyageStore();

  if (!currentItinerary) {
    setLocation('/plan');
    return null;
  }

  const { destination, mode, budgetEstimate, duration, moodTags, accommodation, days } = currentItinerary;

  return (
    <Layout>
      <div className="min-h-screen pt-32 pb-24 px-6 container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="mb-20 text-center border-b border-border pb-16">
            <h4 className="text-primary tracking-[0.3em] uppercase text-xs mb-6 font-semibold" data-testid="text-itinerary-mode">
              {mode} Tier Itinerary
            </h4>
            <h1 className="text-5xl md:text-7xl font-serif mb-8" data-testid="text-itinerary-dest">
              {destination}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>{duration} Days</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span>Est. {budgetEstimate}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              {moodTags.map(tag => (
                <span key={tag} className="px-3 py-1 border border-border rounded-full text-xs tracking-wider uppercase bg-card/50">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Accommodation */}
          <section className="mb-20">
            <h2 className="text-sm uppercase tracking-widest text-primary mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-primary/50"></span>
              Your Residence
            </h2>
            <div className="bg-card border border-border p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-start">
              <div className="p-4 bg-background rounded-full shrink-0">
                <BedDouble className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-2">{accommodation.name}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl">{accommodation.description}</p>
                <div className="text-sm font-mono text-primary bg-primary/10 inline-block px-3 py-1 rounded">
                  {accommodation.estimatedCost}
                </div>
              </div>
            </div>
          </section>

          {/* Day by Day */}
          <section>
            <h2 className="text-sm uppercase tracking-widest text-primary mb-12 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-primary/50"></span>
              The Journey
            </h2>

            <div className="space-y-12">
              {days.map((day, idx) => (
                <motion.div 
                  key={day.day}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-8"
                  data-testid={`itinerary-day-${day.day}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-mono text-muted-foreground uppercase">Day</span>
                    <span className="text-5xl font-serif text-primary">{day.day}</span>
                  </div>
                  
                  <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
                    <h3 className="text-xl font-serif">{day.title}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Sun className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-widest font-semibold">Morning</span>
                        </div>
                        <p className="text-sm leading-relaxed">{day.morning.activity}</p>
                        <p className="text-xs text-muted-foreground font-mono">{day.morning.venue} • {day.morning.cost}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Coffee className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-widest font-semibold">Afternoon</span>
                        </div>
                        <p className="text-sm leading-relaxed">{day.afternoon.activity}</p>
                        <p className="text-xs text-muted-foreground font-mono">{day.afternoon.venue} • {day.afternoon.cost}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Moon className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-widest font-semibold">Evening</span>
                        </div>
                        <p className="text-sm leading-relaxed">{day.evening.activity}</p>
                        <p className="text-xs text-muted-foreground font-mono">{day.evening.venue} • {day.evening.cost}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

        </motion.div>
      </div>
    </Layout>
  );
}
