import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export interface CacheEntry {
  key: string;
  params: {
    destination: string;
    city?: string;
    duration: string;
    guests: string;
    budget: string;
    travelLevel: string;
    roomType: string;
    tripTypes: string[];
    hotelPrefs: string[];
    language: string;
  };
  result: Record<string, unknown>;
  createdAt: string;
  hitCount: number;
}

type CacheStore = Record<string, CacheEntry>;

const DATA_DIR = join(process.cwd(), "data");
const CACHE_FILE = join(DATA_DIR, "route-cache.json");
const MAX_ENTRIES = 500;

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): CacheStore {
  ensureDataDir();
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as CacheStore;
  } catch {
    return {};
  }
}

function save(store: CacheStore): void {
  ensureDataDir();
  writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function normalize(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

export function buildCacheKey(params: {
  destination: string;
  city?: string;
  duration: string;
  guests?: string;
  budget: string;
  travelLevel: string;
  roomType?: string;
  tripTypes?: string[];
  hotelPrefs?: string[];
  language?: string;
}): string {
  const dest = normalize(params.destination);
  const city = normalize(params.city ?? "");
  const duration = normalize(params.duration);
  const guests = normalize(params.guests ?? "2");
  const budget = normalize(params.budget);
  const level = normalize(params.travelLevel);
  const roomType = normalize(params.roomType ?? "standard");
  const tripTypes = [...(params.tripTypes ?? [])].map(normalize).sort().join(",");
  const hotelPrefs = [...(params.hotelPrefs ?? [])].map(normalize).sort().join(",");
  const lang = normalize(params.language ?? "en");

  return [dest, city, duration, guests, budget, level, roomType, tripTypes, hotelPrefs, lang].join("|");
}

export function getFromCache(key: string): CacheEntry | null {
  const store = load();
  const entry = store[key];
  if (!entry) return null;

  // Update hit count
  entry.hitCount = (entry.hitCount ?? 0) + 1;
  store[key] = entry;
  save(store);
  return entry;
}

export function saveToCache(
  key: string,
  params: CacheEntry["params"],
  result: Record<string, unknown>
): void {
  const store = load();

  store[key] = {
    key,
    params,
    result,
    createdAt: new Date().toISOString(),
    hitCount: 0,
  };

  // Prune oldest if over limit
  const entries = Object.values(store);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const toDelete = entries.slice(0, entries.length - MAX_ENTRIES);
    for (const e of toDelete) delete store[e.key];
  }

  save(store);
}
