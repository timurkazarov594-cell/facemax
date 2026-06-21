import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export interface SavedTrip {
  id: string;
  createdAt: string;
  destination: string;
  city?: string;
  duration: string;
  hotelName?: string;
  data: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  isPremium: boolean;
  trips: SavedTrip[];
  sessionToken?: string;
  termsAcceptedAt?: string;
}

type UserStore = Record<string, User>;

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): UserStore {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as UserStore;
  } catch {
    return {};
  }
}

function save(store: UserStore): void {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function findByName(name: string): User | null {
  const store = load();
  return (
    Object.values(store).find(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

export function findById(id: string): User | null {
  const store = load();
  return store[id] ?? null;
}

export function findByToken(token: string): User | null {
  if (!token) return null;
  const store = load();
  return Object.values(store).find((u) => u.sessionToken === token) ?? null;
}

export function createUser(user: User): void {
  const store = load();
  store[user.id] = user;
  save(store);
}

export function setSessionToken(userId: string, token: string | null): void {
  const store = load();
  if (!store[userId]) return;
  if (token === null) {
    delete store[userId].sessionToken;
  } else {
    store[userId].sessionToken = token;
  }
  save(store);
}

/**
 * Upsert a trip for a user.
 * Deduplication key: destination + duration (case-insensitive).
 * If a matching trip already exists, its data is updated in-place
 * while its original id and createdAt are preserved.
 * Returns the persisted trip (with the canonical id/createdAt).
 */
export function addTrip(userId: string, trip: SavedTrip): SavedTrip {
  const store = load();
  if (!store[userId]) return trip;
  const trips: SavedTrip[] = store[userId].trips ?? [];

  const key = (t: SavedTrip) =>
    `${t.destination.toLowerCase().trim()}|${t.duration.toLowerCase().trim()}`;
  const existingIdx = trips.findIndex((t) => key(t) === key(trip));

  let resultTrip: SavedTrip;
  if (existingIdx >= 0) {
    // Update in-place — preserve original id and createdAt
    resultTrip = {
      ...trip,
      id: trips[existingIdx].id,
      createdAt: trips[existingIdx].createdAt,
    };
    trips[existingIdx] = resultTrip;
  } else {
    resultTrip = trip;
    trips.unshift(trip);
  }

  store[userId].trips = trips.slice(0, 50);
  save(store);
  return resultTrip;
}

export function deleteTrip(userId: string, tripId: string): void {
  const store = load();
  if (!store[userId]) return;
  store[userId].trips = (store[userId].trips ?? []).filter(
    (t) => t.id !== tripId
  );
  save(store);
}

export function getUserTrips(userId: string): SavedTrip[] {
  return findById(userId)?.trips ?? [];
}

export function setUserPremium(userId: string, isPremium: boolean): void {
  const store = load();
  if (!store[userId]) return;
  store[userId].isPremium = isPremium;
  save(store);
}
