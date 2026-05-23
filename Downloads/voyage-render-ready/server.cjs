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

// ── Normalize AI response into the exact schema the frontend expects ─────────
function normalizeResult(raw, params) {
  if (!raw || typeof raw !== "object") raw = {};
  const { destination, city, duration, customDuration, guests = "2", language = "en" } = params;
  const effectiveDuration = customDuration || duration || "7 nights";
  const nights = parseInt(String(effectiveDuration)) || 5;
  const dest = raw.destination || destination || "your destination";
  const enc = encodeURIComponent;

  // ── dayPlan: handle all shapes AI might return ──
  let dayPlan = [];
  if (Array.isArray(raw.dayPlan) && raw.dayPlan.length > 0) {
    dayPlan = raw.dayPlan.map((d, i) => ({
      day: d.day ?? i + 1,
      title: d.title || `Day ${i + 1}`,
      morning: typeof d.morning === "string" ? d.morning : (d.morning && d.morning.activity) || "Morning exploration",
      afternoon: typeof d.afternoon === "string" ? d.afternoon : (d.afternoon && d.afternoon.activity) || "Afternoon activities",
      evening: typeof d.evening === "string" ? d.evening : (d.evening && d.evening.activity) || "Evening relaxation",
    }));
  } else if (Array.isArray(raw.days) && raw.days.length > 0) {
    dayPlan = raw.days.map((d, i) => ({
      day: d.day ?? i + 1,
      title: d.title || `Day ${i + 1}`,
      morning: typeof d.morning === "string" ? d.morning : "Morning exploration",
      afternoon: typeof d.afternoon === "string" ? d.afternoon : "Afternoon activities",
      evening: typeof d.evening === "string" ? d.evening : "Evening relaxation",
    }));
  } else if (Array.isArray(raw.itinerary) && raw.itinerary.length > 0) {
    // Legacy shape: {day, title, activities[]}
    dayPlan = raw.itinerary.map((d, i) => {
      const acts = Array.isArray(d.activities) ? d.activities : [];
      const bySlot = (slots) => acts.find(a => slots.some(s => String(a.time || "").startsWith(s)));
      return {
        day: d.day ?? i + 1,
        title: d.title || `Day ${i + 1}`,
        morning: (bySlot(["08","09","10"]) || acts[0] || {}).description || "Morning exploration",
        afternoon: (bySlot(["12","13","14","15"]) || acts[1] || {}).description || "Afternoon activities",
        evening: (bySlot(["17","18","19","20"]) || acts[2] || {}).description || "Evening relaxation",
      };
    });
  }
  // Pad to required length
  while (dayPlan.length < nights) {
    const i = dayPlan.length;
    dayPlan.push({ day: i + 1, title: `Day ${i + 1}`, morning: `Explore ${dest} in the morning.`, afternoon: "Visit local attractions.", evening: "Dinner at a local restaurant." });
  }

  // ── hotel ──
  const rh = raw.hotel || {};
  const hotelName = rh.name || `${dest} Premier Hotel`;
  const hotel = {
    name: hotelName,
    nameEn: rh.nameEn || hotelName,
    rating: rh.rating ?? rh.stars ?? 4,
    location: rh.location || rh.area || city || dest,
    pricePerNight: typeof rh.pricePerNight === "number" ? `$${rh.pricePerNight}/night` : rh.pricePerNight || "$150/night",
    roomType: rh.roomType || "Standard Room",
    nightsCount: rh.nightsCount ?? nights,
    roomsNeeded: rh.roomsNeeded ?? 1,
    hotelTotal: typeof rh.hotelTotal === "number" ? `$${rh.hotelTotal}` : rh.hotelTotal || "",
    description: rh.description || `A comfortable hotel in ${dest}.`,
    whyItFits: rh.whyItFits || rh.reason || "Excellent location and amenities.",
    amenities: Array.isArray(rh.amenities) ? rh.amenities : ["Wi-Fi", "restaurant", "concierge"],
    tags: Array.isArray(rh.tags) ? rh.tags : [],
    imagePrompt: rh.imagePrompt || `${hotelName} hotel exterior ${dest}`,
    imageUrl: rh.imageUrl || "",
    photosUrl: rh.photosUrl || `https://www.booking.com/search.html?ss=${enc(hotelName)}`,
    hotelUrl: rh.hotelUrl || `https://www.booking.com/searchresults.html?aid=529629&ss=${enc(hotelName)}+${enc(dest)}`,
  };

  // ── restaurants ──
  const rests = Array.isArray(raw.restaurants) ? raw.restaurants : [];
  const restaurants = rests.length > 0 ? rests.map(r => ({
    name: r.name || "Local Restaurant",
    style: r.style || r.cuisine || "Local",
    averageCheck: r.averageCheck || r.priceRange || "$25-45/person",
    whyItFits: r.whyItFits || r.description || "Great local dining.",
    location: r.location || r.area || dest,
    imagePrompt: r.imagePrompt || `${r.name} restaurant ${dest}`,
  })) : [
    { name: `${dest} Heritage Kitchen`, style: "Local", averageCheck: "$20-40/person", whyItFits: "Authentic local flavours.", location: dest, imagePrompt: "" },
    { name: "The Grand Brasserie", style: "International", averageCheck: "$35-60/person", whyItFits: "Modern cuisine with a great atmosphere.", location: dest, imagePrompt: "" },
  ];

  // ── activities ──
  const rawActs = Array.isArray(raw.activities) ? raw.activities : [];
  const activities = rawActs.map(a => ({
    name: a.name || "Local Activity",
    duration: a.duration || "2 hours",
    price: a.price != null ? String(a.price) : "$25",
    included: a.included === true,
    whyItFits: a.whyItFits || a.description || "A great local experience.",
    imagePrompt: a.imagePrompt || "",
  }));

  // ── budgetBreakdown ──
  const rb = raw.budgetBreakdown || {};
  const fmt = v => typeof v === "number" ? `$${v}` : (v || "");
  const budgetBreakdown = {
    hotel: fmt(rb.hotel),
    flightEstimate: fmt(rb.flightEstimate || rb.flights),
    food: fmt(rb.food),
    activities: fmt(rb.activities),
    transport: fmt(rb.transport),
    total: fmt(rb.total),
    guests: String(rb.guests || guests),
    ...(rb.airportTransfer ? { airportTransfer: fmt(rb.airportTransfer) } : {}),
    ...(rb.cityTax ? { cityTax: fmt(rb.cityTax) } : {}),
    ...((rb.travelInsurance || rb.insurance) ? { travelInsurance: fmt(rb.travelInsurance || rb.insurance) } : {}),
    ...(rb.visa ? { visa: fmt(rb.visa) } : {}),
    ...(rb.shopping ? { shopping: fmt(rb.shopping) } : {}),
  };

  return {
    destination: dest,
    city: raw.city || city || dest,
    explanation: raw.explanation || raw.summary || `A curated travel experience for ${dest}, crafted to match your travel style.`,
    hotel,
    restaurants,
    activities,
    dayPlan,
    budgetBreakdown,
    ...(raw.fromMock || raw.isFallback ? { fromMock: true } : {}),
  };
}

// ── Fallback itinerary (used when OpenAI is unavailable) ─────────────────────
function generateFallbackPlan(params) {
  const { destination, city, duration, travelLevel = "comfort",
    guests = "2", customDuration } = params;
  const effectiveDuration = customDuration || duration || "7 nights";
  const nights = parseInt(String(effectiveDuration)) || 5;
  const dest = destination || "your destination";
  const cityName = city || dest;
  const enc = encodeURIComponent;
  const guestCount = parseInt(guests) || 2;

  // day-by-day plan with morning/afternoon/evening strings (matches VoyageDayEntry)
  const TITLES = [
    "Arrival & First Impressions", "City Exploration", "Cultural Highlights",
    "Local Experiences", "Day Trip & Adventure", "Shopping & Leisure", "Departure Day",
  ];
  const MORNINGS = [
    `Arrive at ${cityName} and check into your hotel. Take a refreshing shower and enjoy a welcome drink.`,
    `Start your day with breakfast at a local café, then head to the main squares and central landmarks of ${cityName}.`,
    `Visit the most important historical sites and museums in ${cityName} — an unmissable cultural experience.`,
    `Join a guided local tour or cooking class to experience authentic ${dest} culture firsthand.`,
    `Set out early for a full-day scenic excursion outside ${cityName} to explore natural or historic highlights.`,
    `Explore the best shopping districts and boutiques of ${cityName} for souvenirs and local crafts.`,
    `Enjoy a final leisurely breakfast and take a last stroll around your favourite neighbourhood.`,
  ];
  const AFTERNOONS = [
    `Explore the neighbourhood around your hotel at your own pace. Stop at a local café for your first taste of ${dest} cuisine.`,
    `Visit a renowned museum or art gallery. Enjoy a relaxed lunch at a well-regarded local restaurant.`,
    `Wander through colourful local markets and parks. Sample street food and soak in the atmosphere.`,
    `Explore artisan workshops, local galleries, and hidden gem spots recommended by residents.`,
    `Enjoy nature, countryside, or coastal scenery. Have a relaxed picnic or lunch at the destination.`,
    `Visit a local spa, hammam, or wellness centre for an afternoon of relaxation and rejuvenation.`,
    `Check out of the hotel. Store luggage and spend remaining hours at a favourite café or viewpoint.`,
  ];
  const EVENINGS = [
    `Enjoy a welcome dinner at a well-rated local restaurant. Toast to the start of your ${dest} adventure.`,
    `Watch the sunset from a rooftop terrace or scenic viewpoint. Dinner at a restaurant recommended by locals.`,
    `Dinner at a traditional restaurant featuring the most iconic dishes of ${dest}. Try the local speciality.`,
    `Evening at a local cultural performance, jazz bar, or rooftop lounge for an authentic night out.`,
    `Return to ${cityName} and enjoy a relaxing rooftop dinner with panoramic city views.`,
    `Farewell dinner at the best restaurant of your trip — celebrate your final evening in style.`,
    `Transfer to the airport. Safe travels and wonderful memories from ${dest}!`,
  ];

  const dayPlan = [];
  for (let i = 0; i < Math.min(nights, 7); i++) {
    dayPlan.push({
      day: i + 1,
      title: TITLES[i] || `Day ${i + 1}`,
      morning: MORNINGS[i] || `Explore ${dest} in the morning.`,
      afternoon: AFTERNOONS[i] || "Visit local attractions.",
      evening: EVENINGS[i] || "Dinner at a local restaurant.",
    });
  }
  // Pad beyond 7 days
  while (dayPlan.length < nights) {
    const i = dayPlan.length;
    dayPlan.push({ day: i + 1, title: `Day ${i + 1}`, morning: `Explore ${dest}.`, afternoon: "Visit local attractions.", evening: "Dinner at a local restaurant." });
  }

  const nightPrice = travelLevel === "luxury" ? 320 : travelLevel === "business" ? 180 : 90;
  const hotelTotalNum = nightPrice * nights;
  const flightCost = 600;
  const foodCost = 30 * nights * guestCount;
  const actCost = 70 * nights;
  const transCost = 120;
  const totalNum = hotelTotalNum + flightCost + foodCost + actCost + transCost;

  const hotelName = travelLevel === "luxury"
    ? `${dest} Grand Palace Hotel`
    : travelLevel === "business" ? `${dest} Executive Suites` : `${dest} Premier Hotel`;

  return {
    destination: dest,
    city: cityName,
    explanation: `A carefully curated ${effectiveDuration} travel plan for ${dest}, designed to match your travel style with the best local experiences, dining, and accommodation.`,
    fromMock: true,
    hotel: {
      name: hotelName,
      nameEn: hotelName,
      rating: travelLevel === "luxury" ? 5 : travelLevel === "business" ? 4 : 3,
      location: cityName,
      pricePerNight: `$${nightPrice}/night`,
      roomType: "Standard Room",
      nightsCount: nights,
      roomsNeeded: 1,
      hotelTotal: `$${hotelTotalNum}`,
      description: `A well-regarded hotel in the heart of ${cityName}, offering comfortable rooms, excellent service, and great amenities in a prime location.`,
      whyItFits: `Perfectly located for exploring ${dest} with easy access to major attractions and dining.`,
      amenities: ["Wi-Fi", "Breakfast", "Concierge", "Gym", "Restaurant"],
      tags: [],
      imagePrompt: `${hotelName} hotel exterior ${cityName}`,
      imageUrl: "",
      photosUrl: `https://www.booking.com/search.html?ss=${enc(hotelName)}`,
      hotelUrl: `https://www.booking.com/searchresults.html?aid=529629&ss=${enc(hotelName)}+${enc(dest)}`,
    },
    restaurants: [
      { name: `${cityName} Heritage Kitchen`, style: "Local", averageCheck: "$20-40/person", whyItFits: `Authentic ${dest} dishes in a warm, traditional setting — perfect for your first taste.`, location: cityName, imagePrompt: "" },
      { name: "The Grand Brasserie", style: "International", averageCheck: "$35-60/person", whyItFits: "Modern cuisine with an elegant atmosphere and scenic views.", location: cityName, imagePrompt: "" },
      { name: "Street Food Market", style: "Street Food", averageCheck: "$8-15/person", whyItFits: "Lively, colourful market with dozens of local food stalls — the real taste of the city.", location: cityName, imagePrompt: "" },
    ],
    activities: [
      { name: "City Walking Tour", duration: "3 hours", price: "$25", included: false, whyItFits: `The best way to discover ${dest} on foot with a knowledgeable local guide.`, imagePrompt: "" },
      { name: "Museum & Cultural Sites", duration: "2-4 hours", price: "$15", included: false, whyItFits: "Explore the history and art of the region at your own pace.", imagePrompt: "" },
    ],
    dayPlan,
    budgetBreakdown: {
      hotel: `$${hotelTotalNum}`,
      flightEstimate: `$${flightCost}`,
      food: `$${foodCost}`,
      activities: `$${actCost}`,
      transport: `$${transCost}`,
      total: `$${totalNum}`,
      guests: String(guestCount),
    },
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

// ── OpenAI trip generation (with retry + normalization) ─────────────────────
async function generateTripPlan(openai, params) {
  const { destination, travelLevel = "comfort", tripTypes = [], hotelPrefs = [],
    restaurantPrefs = [], duration, budget, language = "en", guests = "2",
    roomType = "standard", city, customBudget, customDuration } = params;

  const effectiveBudget = customBudget || budget || "moderate";
  const effectiveDuration = customDuration || duration || "7 nights";
  const nights = parseInt(String(effectiveDuration)) || 5;
  const lang = language === "ru" ? "Russian" : "English";
  const destFull = city ? `${city}, ${destination}` : destination;

  const systemPrompt = `You are an elite luxury travel concierge. Generate comprehensive, realistic travel itineraries. Always respond in ${lang}. Respond ONLY with valid JSON — no markdown, no code blocks, no text before or after the JSON.`;

  const buildPrompt = (attempt) => `Create a detailed travel plan for:
- Destination: ${destFull}
- Travel style: ${travelLevel}
- Trip types: ${tripTypes.join(", ") || "general sightseeing"}
- Hotel preferences: ${hotelPrefs.join(", ") || "none specified"}
- Restaurant preferences: ${restaurantPrefs.join(", ") || "none specified"}
- Duration: ${effectiveDuration} (${nights} nights)
- Budget level: ${effectiveBudget}
- Guests: ${guests}
- Room type: ${roomType}
${attempt > 1 ? "\nCRITICAL: Return ONLY valid JSON. No markdown. No code blocks. Exactly the schema below." : ""}

Return ONLY this JSON structure (no other text):
{
  "destination": "${destination}",
  "city": "${city || destination}",
  "explanation": "2-3 sentences about why this plan perfectly matches the traveler",
  "hotel": {
    "name": "Real hotel name in ${destFull}",
    "rating": 5,
    "location": "Specific neighbourhood or area",
    "pricePerNight": "$XXX/night",
    "roomType": "Room type name",
    "nightsCount": ${nights},
    "roomsNeeded": 1,
    "hotelTotal": "$XXXX total",
    "description": "2 sentences about the hotel",
    "whyItFits": "Why this hotel matches the preferences",
    "amenities": ["pool", "spa", "gym", "wifi", "breakfast"],
    "tags": ["luxury", "central"]
  },
  "restaurants": [
    { "name": "Restaurant name", "style": "Cuisine style", "averageCheck": "$XX-XX/person", "whyItFits": "Why it suits this traveler", "location": "Area/neighbourhood" },
    { "name": "Restaurant 2", "style": "Cuisine style", "averageCheck": "$XX-XX/person", "whyItFits": "Why it suits", "location": "Area" },
    { "name": "Restaurant 3", "style": "Cuisine style", "averageCheck": "$XX-XX/person", "whyItFits": "Why it suits", "location": "Area" }
  ],
  "activities": [
    { "name": "Activity name", "duration": "X hours", "price": "$XX", "included": false, "whyItFits": "Why this suits the traveler" },
    { "name": "Activity 2", "duration": "X hours", "price": "$XX", "included": false, "whyItFits": "Why this suits" },
    { "name": "Activity 3", "duration": "X hours", "price": "Included", "included": true, "whyItFits": "Part of hotel package" }
  ],
  "dayPlan": [
    { "day": 1, "title": "Arrival & First Impressions", "morning": "Detailed paragraph about morning", "afternoon": "Detailed paragraph about afternoon", "evening": "Detailed paragraph about evening" },
    { "day": 2, "title": "Day title", "morning": "...", "afternoon": "...", "evening": "..." }
  ],
  "budgetBreakdown": {
    "hotel": "$${nights * 200}",
    "flightEstimate": "$800",
    "food": "$300",
    "activities": "$250",
    "transport": "$150",
    "total": "$${nights * 200 + 1500}",
    "guests": "${guests}"
  }
}
dayPlan MUST have exactly ${nights} entries. morning/afternoon/evening MUST be plain strings (not objects). All arrays must be populated.`;

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[voyage] OpenAI attempt ${attempt}/3 for: ${destination}`);
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildPrompt(attempt) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4500,
        temperature: attempt === 1 ? 0.7 : 0.4,
      });

      let raw = (response.choices[0]?.message?.content || "{}").trim();
      // Strip markdown code fences if model adds them despite instructions
      raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

      const parsed = JSON.parse(raw);
      console.log(`[voyage] OpenAI success on attempt ${attempt} for: ${destination}`);
      return normalizeResult(parsed, params);
    } catch (err) {
      console.error(`[voyage] Attempt ${attempt}/3 failed for ${destination}:`, err.message);
      lastError = err;
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
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
