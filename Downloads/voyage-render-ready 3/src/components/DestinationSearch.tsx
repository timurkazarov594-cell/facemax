import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin } from 'lucide-react';
import {
  searchDestinations, getTypeLabel, getDestLabel,
  type Destination, type DestType,
} from '@/lib/destinations';

const TYPE_COLORS: Record<DestType, string> = {
  city:        'bg-blue-500/15 text-blue-400    border-blue-500/20',
  country:     'bg-primary/15  text-primary     border-primary/20',
  island:      'bg-cyan-500/15  text-cyan-400   border-cyan-500/20',
  ski_resort:  'bg-sky-500/15   text-sky-400    border-sky-500/20',
  beach:       'bg-teal-500/15  text-teal-400   border-teal-500/20',
  region:      'bg-violet-500/15 text-violet-400 border-violet-500/20',
  archipelago: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

interface DestinationSearchProps {
  value: string;
  onChange: (display: string, destination: string, city: string) => void;
  lang: 'en' | 'ru';
  placeholder?: string;
  autoFocus?: boolean;
}

export function DestinationSearch({
  value,
  onChange,
  lang,
  placeholder,
  autoFocus,
}: DestinationSearchProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = searchDestinations(query, lang);

  const commit = useCallback((dest: Destination) => {
    const display = getDestLabel(dest, lang);
    setQuery(display);
    onChange(display, dest.destination, dest.city);
    setOpen(false);
    inputRef.current?.blur();
  }, [onChange, lang]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setHighlighted(0);
    setOpen(true);
    // Free-text passthrough: set destination to typed value, AI handles it
    onChange(v, v, '');
  };

  const handleClear = () => {
    setQuery('');
    onChange('', '', '');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => {
        const next = Math.min(h + 1, results.length - 1);
        scrollItemIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => {
        const prev = Math.max(h - 1, 0);
        scrollItemIntoView(prev);
        return prev;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) commit(results[highlighted]);
      else setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const scrollItemIntoView = (idx: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-item]');
    items[idx]?.scrollIntoView({ block: 'nearest' });
  };

  // Close on outside click / touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Sync external reset (e.g. when language changes or user goes back)
  useEffect(() => {
    if (value !== query) setQuery(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const popularLabel = !query.trim()
    ? (lang === 'ru' ? 'Популярные направления' : 'Popular destinations')
    : null;

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ── Search Input ── */}
      <div className={`group relative flex items-center border-b-2 transition-colors duration-300 ${open || query ? 'border-primary' : 'border-border'}`}>
        <Search className={`w-6 h-6 shrink-0 mr-4 transition-colors ${open || query ? 'text-primary' : 'text-muted-foreground/40'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? (lang === 'ru' ? 'Введите направление...' : 'Type a destination...')}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="search"
          className="flex-1 bg-transparent text-3xl md:text-4xl font-light py-4 outline-none placeholder:text-muted-foreground/25 caret-primary"
          data-testid="input-destination-search"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 ml-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-all"
            tabIndex={-1}
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top' }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border/60 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            {/* Scrollable list */}
            <div
              ref={listRef}
              className="overflow-y-auto max-h-[320px] overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {popularLabel && (
                <div className="px-4 pt-3 pb-1 sticky top-0 bg-card z-10">
                  <span className="text-xs uppercase tracking-[0.22em] text-primary/50 font-medium">
                    {popularLabel}
                  </span>
                </div>
              )}

              {results.map((dest, i) => {
                const displayLabel = getDestLabel(dest, lang);
                const isHighlighted = highlighted === i;
                return (
                  <button
                    key={`${dest.label}-${i}`}
                    type="button"
                    data-item
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => { e.preventDefault(); commit(dest); }}
                    onTouchEnd={(e) => { e.preventDefault(); commit(dest); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-primary/10 ${
                      isHighlighted ? 'bg-primary/8' : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Emoji flag/icon */}
                    <span className="text-xl w-8 text-center shrink-0 leading-none select-none">
                      {dest.emoji}
                    </span>

                    {/* Name + country sub-label */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-base font-medium leading-tight truncate ${isHighlighted ? 'text-foreground' : 'text-foreground/85'}`}>
                        {displayLabel}
                      </div>
                      {dest.destination !== dest.label && dest.destination !== dest.city && (
                        <div className="text-xs text-muted-foreground/45 leading-tight mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{dest.destination}</span>
                        </div>
                      )}
                    </div>

                    {/* Type badge */}
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${TYPE_COLORS[dest.type]}`}>
                      {getTypeLabel(dest.type, lang)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom hint */}
            <div className="px-4 py-2 border-t border-border/40 bg-card">
              <p className="text-[10px] text-muted-foreground/30 tracking-wide">
                {lang === 'ru'
                  ? 'Или введите любое направление вручную'
                  : 'Or type any destination manually'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
