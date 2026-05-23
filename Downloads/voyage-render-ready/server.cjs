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
  try {
    const { name, password, termsAccepted } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      return res.status(400).json({ error: "Введите корректный email" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
    }
    if (!termsAccepted) {
      return res.status(400).json({ error: "Подтвердите согласие с правилами сервиса" });
    }
    if (findByName(trimmed)) {
      return res.status(409).json({ error: "Пользователь уже существует" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(String(password), 10);
    const token = crypto.randomUUID();
    const user = {
      id: crypto.randomUUID(),
      name: trimmed,
      passwordHash,
      createdAt: now,
      isPremium: false,
      trips: [],
      sessionToken: token,
      termsAcceptedAt: now,
    };
    createUser(user);
    req.session.userId = user.id;
    console.log("[auth] registered:", trimmed);
    return res.status(201).json({ user: { id: user.id, name: user.name, isPremium: user.isPremium }, token });
  } catch (err) {
    console.error("[auth] Registration error:", err);
    return res.status(500).json({ error: "Ошибка сервера. Попробуйте позже." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    const user = findByName(name.trim());
    if (!user) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const token = crypto.randomUUID();
    setSessionToken(user.id, token);
    req.session.userId = user.id;
    console.log("[auth] login:", user.name);
    return res.json({ user: { id: user.id, name: user.name, isPremium: user.isPremium }, token });
  } catch (err) {
    console.error("[auth] Login error:", err);
    return res.status(500).json({ error: "Ошибка сервера. Попробуйте позже." });
  }
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

// ── Fallback itinerary (used when OpenAI is unavailable) ─────────────────────
function generateFallbackPlan(params) {
  const { destination, city, duration, budget, travelLevel, language,
    guests = "2", customBudget, customDuration } = params;
  const effectiveDuration = customDuration || duration || "7 nights";
  const effectiveBudget = customBudget || budget || "moderate";
  const lang = language || "en";

  // Parse number of nights from duration string (e.g. "7 nights" → 7)
  const nights = parseInt(String(effectiveDuration)) || 5;
  const dest = destination || "your destination";
  const cityName = city || dest;
  const enc = encodeURIComponent;

  const days = [];
  const dayTitles = [
    "Arrival & First Impressions", "City Exploration", "Cultural Highlights",
    "Local Experiences", "Day Trip & Adventure", "Shopping & Leisure", "Departure Day"
  ];
  const activitySets = [
    [
      { time: "14:00", title: "Hotel Check-in", description: `Settle into your accommodation in ${cityName}.`, price: 0, tags: ["accommodation"] },
      { time: "16:00", title: "Neighbourhood Walk", description: `Explore the streets and atmosphere around your hotel in ${cityName}.`, price: 0, tags: ["free", "walking"] },
      { time: "19:00", title: "Welcome Dinner", description: `Enjoy a local dinner at a restaurant near your hotel.`, price: 40, tags: ["food", "local"] },
    ],
    [
      { time: "09:00", title: "Morning City Tour", description: `Visit the main landmarks and squares of ${cityName}.`, price: 25, tags: ["sightseeing"] },
      { time: "12:30", title: "Lunch at Local Café", description: "Sample regional dishes at a well-rated café.", price: 20, tags: ["food"] },
      { time: "15:00", title: "Museum Visit", description: `Explore a top cultural museum in ${dest}.`, price: 15, tags: ["culture", "indoor"] },
      { time: "18:00", title: "Sunset Viewpoint", description: "Catch panoramic views at a popular lookout spot.", price: 0, tags: ["free", "scenic"] },
    ],
    [
      { time: "09:30", title: "Historic District Tour", description: `Walk through the historic heart of ${cityName}.`, price: 0, tags: ["walking", "history"] },
      { time: "12:00", title: "Traditional Lunch", description: `Try the most iconic local dish of ${dest}.`, price: 18, tags: ["food", "local"] },
      { time: "14:30", title: "Art Gallery", description: "Browse contemporary and traditional local art.", price: 12, tags: ["culture", "art"] },
      { time: "17:00", title: "Evening Market", description: "Browse a vibrant local market for souvenirs.", price: 0, tags: ["free", "shopping"] },
    ],
    [
      { time: "08:00", title: "Morning Excursion", description: `Join a guided half-day excursion around ${dest}.`, price: 55, tags: ["guided", "outdoor"] },
      { time: "13:00", title: "Lunch on the Go", description: "Grab street food or a quick café bite.", price: 12, tags: ["food"] },
      { time: "15:30", title: "Cooking Class", description: `Learn to prepare a traditional dish from ${dest}.`, price: 65, tags: ["experience", "food"] },
      { time: "19:30", title: "Rooftop Dinner", description: "Dine with a view over the city skyline.", price: 50, tags: ["food", "scenic"] },
    ],
    [
      { time: "09:00", title: "Full-Day Trip", description: `Day trip to a scenic spot outside ${cityName}.`, price: 40, tags: ["outdoor", "nature"] },
      { time: "13:00", title: "Picnic Lunch", description: "Enjoy a relaxed outdoor lunch at the destination.", price: 15, tags: ["food", "outdoor"] },
      { time: "16:00", title: "Return & Relax", description: "Head back and unwind at the hotel.", price: 0, tags: ["leisure"] },
      { time: "20:00", title: "Dinner at Hotel Restaurant", description: "Enjoy a relaxing dinner before your last full day.", price: 35, tags: ["food"] },
    ],
    [
      { time: "10:00", title: "Shopping District", description: `Browse the best shopping areas in ${cityName}.`, price: 0, tags: ["shopping"] },
      { time: "13:00", title: "Café Lunch", description: "Relax at a trendy local café.", price: 20, tags: ["food", "leisure"] },
      { time: "15:30", title: "Spa Treatment", description: "Treat yourself to a local spa or hammam experience.", price: 70, tags: ["wellness"] },
      { time: "19:00", title: "Farewell Dinner", description: `Celebrate your last evening in ${dest} at a top-rated restaurant.`, price: 60, tags: ["food", "special"] },
    ],
    [
      { time: "09:00", title: "Last Morning Walk", description: `One final stroll through ${cityName} before checkout.`, price: 0, tags: ["free", "walking"] },
      { time: "11:00", title: "Hotel Checkout", description: "Check out and store luggage if needed.", price: 0, tags: ["logistics"] },
      { time: "12:00", title: "Airport Transfer", description: `Travel to the airport and depart ${dest}.`, price: 25, tags: ["transport"] },
    ],
  ];

  for (let i = 0; i < Math.min(nights, 7); i++) {
    days.push({
      day: i + 1,
      title: dayTitles[i] || `Day ${i + 1}`,
      activities: activitySets[i] || activitySets[2],
    });
  }

  const nighPrice = travelLevel === "luxury" ? 320 : travelLevel === "business" ? 180 : 90;
  const hotelTotal = nighPrice * nights;
  const flightCost = 600;
  const foodCost = 35 * nights * parseInt(guests);
  const actCost = 80 * nights;
  const transCost = 120;
  const total = hotelTotal + flightCost + foodCost + actCost + transCost;

  const hotelNames = {
    luxury: `${dest} Grand Palace Hotel`,
    business: `${dest} Executive Suites`,
    budget: `${dest} Central Guesthouse`,
  };
  const hotelName = hotelNames[travelLevel] || `${dest} Premier Hotel`;
  const hotelSlug = enc(hotelName);
  const destSlug = enc(dest);

  return {
    destination: dest,
    city: cityName,
    duration: effectiveDuration,
    language: lang,
    currency: "USD",
    bestTimeToVisit: "Spring and autumn offer the most pleasant weather",
    isFallback: true,
    hotel: {
      name: hotelName,
      stars: travelLevel === "luxury" ? 5 : travelLevel === "business" ? 4 : 3,
      pricePerNight: nighPrice,
      description: `A well-regarded hotel in the heart of ${cityName}, offering comfortable rooms and great amenities.`,
      amenities: ["Wi-Fi", "breakfast", "concierge", "gym"],
      bookingUrl: `https://www.booking.com/search.html?ss=${hotelSlug}`,
      affiliateUrl: `https://www.booking.com/searchresults.html?aid=529629&ss=${hotelSlug}+${destSlug}`,
    },
    itinerary: days,
    restaurants: [
      { name: `${cityName} Heritage Kitchen`, cuisine: "Local", priceRange: "$$", description: "Authentic local dishes in a cosy setting.", bookingUrl: "" },
      { name: "The Grand Brasserie", cuisine: "International", priceRange: "$$$", description: "Modern cuisine with scenic views.", bookingUrl: "" },
      { name: "Street Food Market", cuisine: "Street Food", priceRange: "$", description: "A lively market with dozens of local food stalls.", bookingUrl: "" },
    ],
    budgetBreakdown: {
      hotel: hotelTotal,
      flights: flightCost,
      activities: actCost,
      food: foodCost,
      transport: transCost,
      total,
    },
    tips: [
      `Book accommodations in advance, especially during peak season in ${dest}.`,
      "Always carry some local currency for small purchases.",
      `Check visa requirements for ${dest} well before your trip.`,
      "Download offline maps to navigate without mobile data.",
      "Respect local customs and dress codes, especially at religious sites.",
    ],
  };
}

// ── Voyage plan (async job) ──────────────────────────────────────────────────
app.post("/api/voyage/plan-async", async (req, res) => {
  // Auth is optional — backend users get their trip saved; local/anonymous users
  // receive the result and save it client-side via the auth-context fallback.
  const backendUser = getAuthUser(req);

  const body = req.body || {};
  console.log("[voyage] Trip generation request:", JSON.stringify({
    destination: body.destination,
    city: body.city,
    duration: body.duration,
    budget: body.budget,
    travelLevel: body.travelLevel,
    guests: body.guests,
    language: body.language,
    hasAuth: !!backendUser,
  }));

  const { destination, travelLevel, tripTypes = [], hotelPrefs = [], restaurantPrefs = [],
    duration, budget, language = "en", guests, roomType, city, customBudget, customDuration } = body;

  if (!destination || !duration) {
    return res.status(400).json({ error: "destination and duration are required" });
  }

  const cacheKey = buildCacheKey({
    destination, city, duration: customDuration || duration, guests,
    budget: customBudget || budget || "moderate",
    travelLevel: travelLevel || "comfort", roomType, tripTypes, hotelPrefs, language,
  });
  const cached = getFromCache(cacheKey);
  if (cached) {
    const jobId = createJob();
    jobs.get(jobId).status = "done";
    jobs.get(jobId).result = cached.result;
    if (backendUser) {
      const r = cached.result;
      const trip = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), destination: r.destination || destination, city: r.city || city, duration: r.duration || duration, hotelName: r.hotel && r.hotel.name, data: r };
      addTrip(backendUser.id, trip);
    }
    return res.json({ jobId, cached: true });
  }

  const jobId = createJob();
  res.json({ jobId, cached: false });

  // Run async in background
  (async () => {
    const job = jobs.get(jobId);
    job.status = "running";
    try {
      const openai = getOpenAI();
      let result;
      if (!openai) {
        console.log("[voyage] No OPENAI_API_KEY — using fallback itinerary for:", destination);
        result = generateFallbackPlan(body);
      } else {
        try {
          result = await generateTripPlan(openai, body);
        } catch (aiErr) {
          console.error("[voyage] OpenAI call failed, using fallback:", aiErr.message);
          result = generateFallbackPlan(body);
          result.aiError = aiErr.message;
        }
      }
      job.status = "done";
      job.result = result;
      // Cache the result (fallback results are also cached)
      saveToCache(cacheKey, {
        destination, city, duration: customDuration || duration, guests,
        budget: customBudget || budget || "moderate",
        travelLevel: travelLevel || "comfort", roomType: roomType || "standard", tripTypes, hotelPrefs, language,
      }, result);
      // Save to backend user profile if authenticated
      if (backendUser) {
        const trip = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), destination: result.destination || destination, city: result.city || city, duration: result.duration || duration, hotelName: result.hotel && result.hotel.name, data: result };
        addTrip(backendUser.id, trip);
      }
    } catch (err) {
      console.error("[voyage] Trip generation error:", err);
      // Last resort: still return a fallback so the user sees something
      try {
        const job2 = jobs.get(jobId);
        if (job2) {
          job2.status = "done";
          job2.result = generateFallbackPlan(body);
        }
      } catch (_) {
        const job2 = jobs.get(jobId);
        if (job2) { job2.status = "error"; job2.error = err.message || "Unknown error"; }
      }
    }
  })();
});

// ── Job poll — two route aliases so old and new frontend versions both work ──
function handleJobPoll(req, res) {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status === "done") return res.json({ status: "done", result: job.result });
  if (job.status === "error") return res.json({ status: "error", message: job.error });
  res.json({ status: job.status });
}

app.get("/api/voyage/job/:jobId", handleJobPoll);
app.get("/api/voyage/plan-job/:jobId", handleJobPoll);

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

// SPA fallback — serve index.html for all non-API GET requests
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  const indexFile = path.join(distPath, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  next();
});

// ── Global JSON error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Ошибка сервера. Попробуйте позже." });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] Voyage AI running on port ${PORT}`);
});
