import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";
import {
  findByName,
  findById,
  findByToken,
  createUser,
  setSessionToken,
  addTrip,
  getUserTrips,
  type User,
} from "../lib/user-store.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

function getAuthUser(req: Request): User | null {
  if (req.session.userId) {
    const u = findById(req.session.userId);
    if (u) return u;
  }
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return findByToken(token);
  }
  return null;
}

router.post("/auth/register", async (req, res) => {
  const { name, password, termsAccepted } = req.body as {
    name?: string;
    password?: string;
    termsAccepted?: boolean;
  };

  if (!name || !password) {
    res.status(400).json({ error: "Email и пароль обязательны" });
    return;
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    res.status(400).json({ error: "Введите корректный email" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
    return;
  }

  if (!termsAccepted) {
    res.status(400).json({ error: "Подтвердите согласие с правилами сервиса" });
    return;
  }

  if (findByName(trimmed)) {
    res.status(409).json({ error: "Этот email уже зарегистрирован. Попробуйте войти." });
    return;
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = uuidv4();
  const user: User = {
    id: uuidv4(),
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
  req.log.info({ userId: user.id, name: user.name }, "User registered");

  res.status(201).json({
    user: { id: user.id, name: user.name, isPremium: user.isPremium },
    token,
  });
});

router.post("/auth/login", async (req, res) => {
  const { name, password } = req.body as {
    name?: string;
    password?: string;
  };

  if (!name || !password) {
    res.status(400).json({ error: "Name and password required" });
    return;
  }

  const user = findByName(name.trim());
  if (!user) {
    res.status(401).json({ error: "Invalid name or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid name or password" });
    return;
  }

  const token = uuidv4();
  setSessionToken(user.id, token);
  req.session.userId = user.id;
  req.log.info({ userId: user.id, name: user.name }, "User logged in");

  res.json({
    user: { id: user.id, name: user.name, isPremium: user.isPremium },
    token,
  });
});

router.post("/auth/logout", (req, res) => {
  const userId = req.session.userId ?? getAuthUser(req)?.id;
  if (userId) setSessionToken(userId, null);
  req.session.destroy(() => {});
  req.log.info({ userId }, "User logged out");
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.json({ user: null });
    return;
  }
  res.json({
    user: { id: user.id, name: user.name, isPremium: user.isPremium },
  });
});

router.post("/voyage/save-trip", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const { destination, city, duration, hotelName, data } = req.body as {
    destination?: string;
    city?: string;
    duration?: string;
    hotelName?: string;
    data?: Record<string, unknown>;
  };

  if (!destination || !data) {
    res.status(400).json({ error: "destination and data required" });
    return;
  }

  const trip = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    destination,
    city,
    duration: duration ?? "",
    hotelName,
    data,
  };

  addTrip(user.id, trip);
  req.log.info(
    { userId: user.id, destination, hotelName },
    "Trip saved to user account"
  );

  res.status(201).json({ trip });
});

router.get("/voyage/my-trips", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const trips = getUserTrips(user.id);
  res.json({ trips });
});

export default router;
