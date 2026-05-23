const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "voyage-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    name: "voyage.sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// ── User store (file-based) ─────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")); }
  catch { return []; }
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function findByName(name) { return loadUsers().find(u => u.name.toLowerCase() === name.toLowerCase()) || null; }
function findById(id) { return loadUsers().find(u => u.id === id) || null; }
function findByToken(token) { return loadUsers().find(u => u.sessionToken === token) || null; }

function createUser(user) {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

function setSessionToken(id, token) {
  const users = loadUsers();
  const u = users.find(u => u.id === id);
  if (u) { u.sessionToken = token; saveUsers(users); }
}

function addTrip(userId, trip) {
  const users = loadUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;
  if (!u.trips) u.trips = [];
  const key = `${(trip.destination || "").toLowerCase()}|${(trip.duration || "").toLowerCase()}`;
  const existing = u.trips.findIndex(t =>
    `${(t.destination || "").toLowerCase()}|${(t.duration || "").toLowerCase()}` === key
  );
  if (existing >= 0) {
    u.trips[existing] = { ...u.trips[existing], ...trip, id: u.trips[existing].id, createdAt: u.trips[existing].createdAt };
  } else {
    if (u.trips.length >= 50) u.trips.shift();
    u.trips.push(trip);
  }
  saveUsers(users);
}

function deleteTrip(userId, tripId) {
  const users = loadUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;
  u.trips = (u.trips || []).filter(t => t.id !== tripId);
  saveUsers(users);
}

function getUserTrips(userId) {
  const u = findById(userId);
  return (u && u.trips) ? [...u.trips].reverse() : [];
}

// ── Auth helper ─────────────────────────────────────────────────────────────
function getAuthUser(req) {
  if (req.session && req.session.userId) {
    const u = findById(req.session.userId);
    if (u) return u;
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return findByToken(token);
  }
  return null;
}

// ── Route cache ─────────────────────────────────────────────────────────────
const CACHE_FILE = path.join(DATA_DIR, "route-cache.json");
const MAX_CACHE = 500;

function loadCache() {
  ensureDataDir();
  if (!fs.existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")); }
  catch { return {}; }
}

function saveCache(store) {
  ensureDataDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function buildCacheKey(p) {
  const n = s => (s || "").trim().toLowerCase();
  return [
    n(p.destination), n(p.city || ""), n(p.duration), n(p.guests || "2"),
    n(p.budget), n(p.travelLevel), n(p.roomType || "standard"),
    [...(p.tripTypes || [])].map(n).sort().join(","),
    [...(p.hotelPrefs || [])].map(n).sort().join(","),
    n(p.language || "en"),
  ].join("|");
}

function getFromCache(key) {
  const store = loadCache();
  const entry = store[key];
  if (!entry) return null;
  entry.hitCount = (entry.hitCount || 0) + 1;
  store[key] = entry;
  saveCache(store);
  return entry;
}

function saveToCache(key, params, result) {
  const store = loadCache();
  store[key] = { key, params, result, createdAt: new Date().toISOString(), hitCount: 0 };
  const entries = Object.values(store);
  if (entries.length > MAX_CACHE) {
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    entries.slice(0, entries.length - MAX_CACHE).forEach(e => delete store[e.key]);
  }
  saveCache(store);
}

// ── OpenAI client ────────────────────────────────────────────────────────────
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

// ── In-memory job store ──────────────────────────────────────────────────────
const jobs = new Map();

function createJob() {
  const id = crypto.randomUUID();
  jobs.set(id, { id, status: "pending", result: null, error: null, createdAt: Date.now() });
  // Clean up old jobs (keep last 200)
  if (jobs.size > 200) {
    const oldest = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) jobs.delete(oldest[0]);
  }
  return id;
}

// ── Health ───────────────────────────────────────────────────────────────────
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, password, termsAccepted } = req.body || {};
  if (!name || !password || name.trim().length < 2 || password.length < 4) {
    return res.status(400).json({ error: "Name (min 2 chars) and password (min 4 chars) required" });
  }
  if (!termsAccepted) {
    return res.status(400).json({ error: "You must accept the Terms of Service and Privacy Policy to register." });
  }
  const trimmed = name.trim();
  if (findByName(trimmed)) return res.status(409).json({ error: "That name is already taken" });

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomUUID();
  const user = { id: crypto.randomUUID(), name: trimmed, passwordHash, createdAt: now, isPremium: false, trips: [], sessionToken: token, termsAcceptedAt: now };
  createUser(user);
  req.session.userId = user.id;
  res.status(201).json({ user: { id: user.id, name: user.name, isPremium: user.isPremium }, token });
});

app.post("/api/auth/login", async (req, res) => {
  const { name, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: "Name and password required" });
  const user = findByName(name.trim());
  if (!user) return res.status(401).json({ error: "Invalid name or password" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid name or password" });
  const token = crypto.randomUUID();
  setSessionToken(user.id, token);
  req.session.userId = user.id;
  res.json({ user: { id: user.id, name: user.name, isPremium: user.isPremium }, token });
});

app.post("/api/auth/logout", (req, res) => {
  const userId = (req.session && req.session.userId) || (getAuthUser(req) || {}).id;
  if (userId) setSessionToken(userId, null);
  req.session.destroy(() => {});
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user.id, name: user.name, isPremium: user.isPremium } });
});

// ── Saved trips routes ───────────────────────────────────────────────────────
app.get("/api/voyage/my-trips", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Login required" });
  res.json({ trips: getUserTrips(user.id) });
});

app.post("/api/voyage/save-trip", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Login required" });
  const { destination, city, duration, hotelName, data } = req.body || {};
  if (!destination || !data) return res.status(400).json({ error: "destination and data required" });
  const trip = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), destination, city, duration: duration || "", hotelName, data };
  addTrip(user.id, trip);
  res.status(201).json({ trip });
});

app.delete("/api/voyage/trips/:tripId", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Login required" });
  deleteTrip(user.id, req.params.tripId);
  res.json({ ok: true });
});

// ── Voyage plan (async job) ──────────────────────────────────────────────────
app.post("/api/voyage/plan-async", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Login required" });

  const body = req.body || {};
  const { destination, travelLevel, tripTypes = [], hotelPrefs = [], restaurantPrefs = [],
    duration, budget, language = "en", guests, roomType, city, customBudget, customDuration } = body;

  if (!destination || !travelLevel || !duration || !budget) {
    return res.status(400).json({ error: "destination, travelLevel, duration, and budget are required" });
  }

  const cacheKey = buildCacheKey({ destination, city, duration: customDuration || duration, guests, budget: customBudget || budget, travelLevel, roomType, tripTypes, hotelPrefs, language });
  const cached = getFromCache(cacheKey);
  if (cached) {
    const jobId = createJob();
    jobs.get(jobId).status = "done";
    jobs.get(jobId).result = cached.result;
    // Auto-save for user
    const r = cached.result;
    const trip = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), destination: r.destination || destination, city: r.city || city, duration: r.duration || duration, hotelName: r.hotel && r.hotel.name, data: r };
    addTrip(user.id, trip);
    return res.json({ jobId, cached: true });
  }

  const jobId = createJob();
  res.json({ jobId, cached: false });

  // Run async
  (async () => {
    const job = jobs.get(jobId);
    job.status = "running";
    try {
      const openai = getOpenAI();
      if (!openai) throw new Error("OPENAI_API_KEY not configured");
      const result = await generateTripPlan(openai, body);
      job.status = "done";
      job.result = result;
      saveToCache(cacheKey, { destination, city, duration: customDuration || duration, guests, budget: customBudget || budget, travelLevel, roomType: roomType || "standard", tripTypes, hotelPrefs, language }, result);
      const trip = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), destination: result.destination || destination, city: result.city || city, duration: result.duration || duration, hotelName: result.hotel && result.hotel.name, data: result };
      addTrip(user.id, trip);
    } catch (err) {
      job.status = "error";
      job.error = err.message || "Unknown error";
      console.error("[voyage] plan error:", err.message);
    }
  })();
});

app.get("/api/voyage/plan-job/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status === "done") return res.json({ status: "done", result: job.result });
  if (job.status === "error") return res.json({ status: "error", error: job.error });
  res.json({ status: job.status });
});

app.get("/api/voyage/hotel-image", async (req, res) => {
  const name = (req.query.name || "").toString().trim();
  if (!name) return res.status(400).json({ error: "name required" });
  // Try OpenAI image search as fallback
  res.json({ url: null });
});

// ── OpenAI trip generation ───────────────────────────────────────────────────
async function generateTripPlan(openai, params) {
  const { destination, travelLevel, tripTypes = [], hotelPrefs = [], restaurantPrefs = [],
    duration, budget, language = "en", guests = "2", roomType = "standard", city, customBudget, customDuration } = params;

  const effectiveBudget = customBudget || budget;
  const effectiveDuration = customDuration || duration;
  const lang = language === "ru" ? "Russian" : "English";

  const systemPrompt = `You are an elite luxury travel concierge with deep knowledge of hotels, restaurants, activities, and local culture worldwide. Generate comprehensive, accurate travel itineraries. Always respond in ${lang}. Respond ONLY with valid JSON.`;

  const userPrompt = `Create a detailed travel plan for:
- Destination: ${destination}${city ? ` (${city})` : ""}
- Travel style: ${travelLevel}
- Trip types: ${tripTypes.join(", ") || "general"}
- Hotel preferences: ${hotelPrefs.join(", ") || "none"}
- Restaurant preferences: ${restaurantPrefs.join(", ") || "none"}
- Duration: ${effectiveDuration}
- Budget: ${effectiveBudget}
- Guests: ${guests}
- Room type: ${roomType}

Return a JSON object with this exact structure:
{
  "destination": "Country Name",
  "city": "City Name",
  "duration": "${effectiveDuration}",
  "hotel": {
    "name": "Hotel Name",
    "stars": 5,
    "pricePerNight": 250,
    "description": "Brief description",
    "amenities": ["pool", "spa", "gym"],
    "bookingUrl": "https://www.booking.com/search.html?ss=Hotel+Name",
    "affiliateUrl": "https://www.booking.com/searchresults.html?aid=529629&ss=Hotel+Name+${destination}"
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival & Exploration",
      "activities": [
        { "time": "10:00", "title": "Activity name", "description": "Details", "price": 0, "tags": ["free"] }
      ]
    }
  ],
  "restaurants": [
    { "name": "Restaurant Name", "cuisine": "Type", "priceRange": "$$", "description": "Details", "bookingUrl": "" }
  ],
  "budgetBreakdown": {
    "hotel": 1750,
    "flights": 800,
    "activities": 400,
    "food": 350,
    "transport": 150,
    "total": 3450
  },
  "tips": ["Tip 1", "Tip 2"],
  "bestTimeToVisit": "Spring and autumn",
  "currency": "USD",
  "language": "${language}"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

// ── Static frontend ──────────────────────────────────────────────────────────
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Voyage AI running on port ${PORT}`);
});
