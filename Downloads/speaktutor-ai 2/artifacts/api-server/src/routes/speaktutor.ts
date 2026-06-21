import { Router, type IRouter } from "express";
import OpenAI, { toFile } from "openai";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  tutorUsersTable,
  tutorSessionsTable,
  tutorMessagesTable,
  tutorVocabularyTable,
  tutorVocabReviewsTable,
  tutorAchievementsTable,
  tutorDailyPracticeTable,
  tutorSessionExtensionsTable,
  tutorPaymentsTable,
  type TutorUser,
} from "@workspace/db";
import {
  UpdateSpeakTutorProfileBody,
  CreateSpeakTutorSessionBody,
  SendSpeakTutorMessageBody,
  TranscribeSpeakTutorBody,
  TextToSpeechSpeakTutorBody,
  AddSpeakTutorWordBody,
  GetSpeakTutorSessionParams,
  EndSpeakTutorSessionParams,
  EndSpeakTutorSessionBody,
  SendSpeakTutorMessageParams,
  DeleteSpeakTutorWordParams,
} from "@workspace/api-zod";
import { requireAuth, signToken } from "../middlewares/speaktutor-auth.js";

const router: IRouter = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  const config: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  const baseURL = process.env.OPENAI_BASE_URL;
  if (baseURL) config.baseURL = baseURL;
  return new OpenAI(config);
}

async function getUserById(userId: number): Promise<TutorUser | null> {
  const rows = await db.select().from(tutorUsersTable).where(eq(tutorUsersTable.id, userId)).limit(1);
  return rows[0] ?? null;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEMO_REPLY_LIMIT = 2;
const PAID_SESSIONS_PER_PACKAGE = 5;
const INCLUDED_MESSAGES_PER_SESSION = 6;  // user messages per paid session
const EXTENSION_MESSAGES = 7;             // messages added per extension
const MAX_SESSION_MESSAGES = 20;          // hard cap per session

const FREE_SCENARIOS: Record<string, string> = {
  beginner: "order_coffee",
  intermediate: "travel_plans",
  advanced: "business_meeting",
};

function serializeUser(user: TutorUser) {
  const isPaid = user.paymentStatus === "paid";
  const demoRepliesRemaining = user.demoCompleted ? 0 : Math.max(0, DEMO_REPLY_LIMIT - user.demoRepliesUsed);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    level: user.level,
    xp: user.xp,
    streak: user.streak,
    totalSpeakingMinutes: user.totalSpeakingMinutes,
    lessonsCompleted: user.lessonsCompleted,
    grammarScore: user.grammarScore,
    vocabularyScore: user.vocabularyScore,
    pronunciationScore: user.pronunciationScore,
    createdAt: user.createdAt.toISOString(),
    paymentStatus: user.paymentStatus,
    isPaid,
    demoRepliesUsed: user.demoRepliesUsed,
    demoCompleted: user.demoCompleted,
    paidSessionsRemaining: user.paidSessionsRemaining,
    demoRepliesRemaining,
  };
}

// ── Hardcoded scenarios ───────────────────────────────────────────────────────

const SCENARIOS = [
  // ── Beginner ──
  { id: "order_coffee",       title: "Заказать кофе",              titleEn: "Order Coffee",                     description: "Зайдите в кофейню и закажите свой любимый напиток.",                           emoji: "☕", category: "everyday",  difficulty: "beginner",     durationMinutes: 5,  isPro: false },
  { id: "order_pizza",        title: "Заказать пиццу",             titleEn: "Order Pizza",                      description: "Позвоните или зайдите в пиццерию и сделайте заказ.",                           emoji: "🍕", category: "everyday",  difficulty: "beginner",     durationMinutes: 5,  isPro: false },
  { id: "buy_water",          title: "Купить воду в магазине",      titleEn: "Buy Water at a Shop",              description: "Попросите воду у продавца и оплатите покупку.",                                 emoji: "💧", category: "everyday",  difficulty: "beginner",     durationMinutes: 5,  isPro: false },
  { id: "ask_directions",     title: "Спросить дорогу",            titleEn: "Ask for Directions",               description: "Попросите прохожего показать, как добраться до нужного места.",                  emoji: "🗺️", category: "travel",    difficulty: "beginner",     durationMinutes: 6,  isPro: false },
  { id: "introduce_yourself", title: "Познакомиться",              titleEn: "Introduce Yourself",               description: "Расскажите о себе: имя, откуда, чем занимаетесь.",                              emoji: "👋", category: "everyday",  difficulty: "beginner",     durationMinutes: 6,  isPro: false },
  { id: "buy_bus_ticket",     title: "Купить автобусный билет",     titleEn: "Buy a Bus Ticket",                 description: "Купите билет на автобус до нужного города или остановки.",                      emoji: "🚌", category: "travel",    difficulty: "beginner",     durationMinutes: 5,  isPro: false },
  { id: "ask_price",          title: "Узнать цену",                titleEn: "Ask the Price",                    description: "Уточните стоимость товара или услуги в магазине.",                              emoji: "🏷️", category: "everyday",  difficulty: "beginner",     durationMinutes: 5,  isPro: false },
  { id: "hotel_checkin",      title: "Заселение в отель",          titleEn: "Hotel Check-in",                   description: "Пройдите регистрацию на ресепшене и узнайте всё о номере.",                     emoji: "🏨", category: "travel",    difficulty: "beginner",     durationMinutes: 7,  isPro: false },
  { id: "say_what_you_like",  title: "Рассказать о хобби",         titleEn: "Talk About Your Hobbies",          description: "Поделитесь тем, что вам нравится делать в свободное время.",                    emoji: "🎨", category: "everyday",  difficulty: "beginner",     durationMinutes: 6,  isPro: false },
  { id: "meet_new_friend",    title: "Познакомиться с другом",      titleEn: "Meet a New Friend",                description: "Заведите непринуждённую беседу и узнайте о новом знакомом.",                    emoji: "🤝", category: "everyday",  difficulty: "beginner",     durationMinutes: 7,  isPro: false },
  // ── Intermediate ──
  { id: "buy_painting",       title: "Купить картину в галерее",   titleEn: "Buy a Painting in a Gallery",      description: "Поговорите с куратором и выберите произведение искусства.",                      emoji: "🖼️", category: "everyday",  difficulty: "intermediate", durationMinutes: 9,  isPro: false },
  { id: "return_item",        title: "Вернуть товар",              titleEn: "Return an Item to a Shop",         description: "Объясните причину возврата и договоритесь об обмене или возврате денег.",         emoji: "🔄", category: "everyday",  difficulty: "intermediate", durationMinutes: 8,  isPro: false },
  { id: "book_restaurant",    title: "Забронировать столик",       titleEn: "Book a Table at a Restaurant",     description: "Позвоните в ресторан, выберите время и уточните пожелания.",                     emoji: "🍽️", category: "everyday",  difficulty: "intermediate", durationMinutes: 7,  isPro: false },
  { id: "phone_problem",      title: "Проблема с телефоном",       titleEn: "Explain a Phone Problem",          description: "Опишите неисправность телефона и попросите помощи в сервисе.",                   emoji: "📱", category: "business",  difficulty: "intermediate", durationMinutes: 9,  isPro: false },
  { id: "rent_apartment",     title: "Снять квартиру",             titleEn: "Ask About Renting an Apartment",   description: "Поговорите с арендодателем об условиях аренды.",                                emoji: "🏠", category: "everyday",  difficulty: "intermediate", durationMinutes: 10, isPro: false },
  { id: "doctor_symptoms",    title: "Визит к врачу",              titleEn: "Talk to a Doctor About Symptoms",  description: "Опишите самочувствие и получите рекомендации на английском.",                    emoji: "🏥", category: "healthcare",difficulty: "intermediate", durationMinutes: 9,  isPro: false },
  { id: "travel_plans",       title: "Обсудить поездку",           titleEn: "Discuss Travel Plans",             description: "Расскажите агенту о маршруте мечты и уточните детали.",                         emoji: "✈️", category: "travel",    difficulty: "intermediate", durationMinutes: 10, isPro: false },
  { id: "airport_help",       title: "Помощь в аэропорту",         titleEn: "Ask for Help at the Airport",      description: "Разберитесь с посадкой, багажом или задержкой рейса.",                          emoji: "🛫", category: "travel",    difficulty: "intermediate", durationMinutes: 8,  isPro: false },
  { id: "small_discount",     title: "Попросить скидку",           titleEn: "Negotiate a Small Discount",       description: "Вежливо попросите о скидке при покупке товара или услуги.",                     emoji: "💸", category: "business",  difficulty: "intermediate", durationMinutes: 7,  isPro: false },
  { id: "phone_appointment",  title: "Записаться по телефону",     titleEn: "Make an Appointment by Phone",     description: "Позвоните в клинику или организацию и договоритесь о встрече.",                  emoji: "📞", category: "business",  difficulty: "intermediate", durationMinutes: 7,  isPro: false },
  // ── Advanced ──
  { id: "hotel_budget",       title: "Отель с фиксированным бюджетом", titleEn: "Book a Hotel on a Budget",    description: "Договоритесь о лучшей цене на ночной заезд с ограниченным бюджетом.",            emoji: "🌙", category: "travel",    difficulty: "advanced",     durationMinutes: 12, isPro: false },
  { id: "job_interview",      title: "Собеседование",              titleEn: "Job Interview at an International Company", description: "Пройдите интервью: расскажите об опыте, навыках и мотивации.",         emoji: "💼", category: "interview", difficulty: "advanced",     durationMinutes: 15, isPro: false },
  { id: "business_meeting",   title: "Деловое совещание",          titleEn: "Business Meeting with a Client",   description: "Проведите переговоры: обсудите проект, сроки и условия.",                       emoji: "📊", category: "business",  difficulty: "advanced",     durationMinutes: 15, isPro: false },
  { id: "complain_service",   title: "Пожаловаться на сервис",     titleEn: "Complain About Bad Service",       description: "Вежливо, но настойчиво выразите недовольство и добейтесь решения.",             emoji: "😤", category: "everyday",  difficulty: "advanced",     durationMinutes: 10, isPro: false },
  { id: "tech_support",       title: "Техническая поддержка",      titleEn: "Explain a Technical Problem",      description: "Опишите сложную техническую проблему оператору поддержки.",                    emoji: "💻", category: "business",  difficulty: "advanced",     durationMinutes: 10, isPro: false },
  { id: "contract_terms",     title: "Переговоры по контракту",    titleEn: "Negotiate Contract Terms",         description: "Обсудите ключевые пункты договора и отстаивайте свои интересы.",                emoji: "📝", category: "business",  difficulty: "advanced",     durationMinutes: 15, isPro: false },
  { id: "startup_pitch",      title: "Питч стартапа",              titleEn: "Present a Startup Idea",           description: "Презентуйте идею инвестору и убедите его в перспективности проекта.",          emoji: "🚀", category: "business",  difficulty: "advanced",     durationMinutes: 12, isPro: false },
  { id: "salary_talk",        title: "Переговоры о зарплате",      titleEn: "Discuss Salary Expectations",      description: "Грамотно обсудите вознаграждение с HR-менеджером.",                            emoji: "💰", category: "interview", difficulty: "advanced",     durationMinutes: 10, isPro: false },
  { id: "travel_emergency",   title: "Экстренная ситуация в поездке", titleEn: "Handle a Travel Emergency",   description: "Справьтесь с форс-мажором: потеря паспорта, болезнь, ЧП.",                      emoji: "🆘", category: "travel",    difficulty: "advanced",     durationMinutes: 12, isPro: false },
  { id: "change_flight",      title: "Изменить рейс",              titleEn: "Change a Flight and Explain Why",  description: "Позвоните в авиакомпанию, объясните причину и перебронируйте рейс.",             emoji: "🛩️", category: "travel",    difficulty: "advanced",     durationMinutes: 10, isPro: false },
];

// Strip punctuation/capitalization for spoken comparison
function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickRandomScenario(level: string): typeof SCENARIOS[0] {
  const matching = SCENARIOS.filter((s) => s.difficulty === level);
  const pool = matching.length ? matching : SCENARIOS.filter((s) => s.difficulty === "beginner");
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Achievement definitions ───────────────────────────────────────────────────

const ACHIEVEMENT_DEFS = [
  { badgeName: "first_words", titleRu: "Первые слова", descriptionRu: "Завершите первую сессию", emoji: "🎉", xpReward: 50 },
  { badgeName: "week_streak", titleRu: "Неделя подряд", descriptionRu: "Практикуйтесь 7 дней подряд", emoji: "🔥", xpReward: 200 },
  { badgeName: "vocabulary_builder", titleRu: "Собиратель слов", descriptionRu: "Добавьте 25 слов в словарь", emoji: "📚", xpReward: 150 },
  { badgeName: "conversationalist", titleRu: "Разговорчивый", descriptionRu: "Завершите 10 сессий", emoji: "💬", xpReward: 300 },
  { badgeName: "hour_speaker", titleRu: "Час разговора", descriptionRu: "Говорите суммарно 60 минут", emoji: "⏱️", xpReward: 250 },
  { badgeName: "grammar_guru", titleRu: "Грамматический гуру", descriptionRu: "Достигните 80+ баллов по грамматике", emoji: "📝", xpReward: 200 },
  { badgeName: "month_streak", titleRu: "Месяц практики", descriptionRu: "Практикуйтесь 30 дней подряд", emoji: "🏆", xpReward: 500 },
];

async function buildAchievementList(userId: number) {
  const unlocked = await db.select().from(tutorAchievementsTable).where(eq(tutorAchievementsTable.userId, userId));
  const unlockedMap = new Map(unlocked.map((a) => [a.badgeName, a.unlockedAt]));
  return ACHIEVEMENT_DEFS.map((def, index) => ({
    id: index + 1,
    badgeName: def.badgeName,
    titleRu: def.titleRu,
    descriptionRu: def.descriptionRu,
    emoji: def.emoji,
    xpReward: def.xpReward,
    isUnlocked: unlockedMap.has(def.badgeName),
    unlockedAt: unlockedMap.get(def.badgeName)?.toISOString() ?? null,
  }));
}

async function checkAndGrantAchievements(userId: number, user: TutorUser) {
  const existing = new Set(
    (await db.select({ badgeName: tutorAchievementsTable.badgeName }).from(tutorAchievementsTable).where(eq(tutorAchievementsTable.userId, userId))).map((r) => r.badgeName)
  );
  const toGrant: string[] = [];
  const sessions = await db.select({ id: tutorSessionsTable.id }).from(tutorSessionsTable).where(and(eq(tutorSessionsTable.userId, userId), sql`${tutorSessionsTable.endedAt} IS NOT NULL`));
  const vocabCount = await db.select({ count: sql<number>`count(*)` }).from(tutorVocabularyTable).where(eq(tutorVocabularyTable.userId, userId));
  if (sessions.length >= 1 && !existing.has("first_words")) toGrant.push("first_words");
  if (user.streak >= 7 && !existing.has("week_streak")) toGrant.push("week_streak");
  if (user.streak >= 30 && !existing.has("month_streak")) toGrant.push("month_streak");
  if (sessions.length >= 10 && !existing.has("conversationalist")) toGrant.push("conversationalist");
  if (user.totalSpeakingMinutes >= 60 && !existing.has("hour_speaker")) toGrant.push("hour_speaker");
  if (user.grammarScore >= 80 && !existing.has("grammar_guru")) toGrant.push("grammar_guru");
  if (Number(vocabCount[0]?.count ?? 0) >= 25 && !existing.has("vocabulary_builder")) toGrant.push("vocabulary_builder");
  for (const badgeName of toGrant) {
    await db.insert(tutorAchievementsTable).values({ userId, badgeName, unlockedAt: new Date() }).onConflictDoNothing();
  }
  return toGrant;
}

// ── Auth routes (public — no JWT required) ────────────────────────────────────

const VALID_LEVELS = ["beginner", "intermediate", "advanced"] as const;

router.post("/speaktutor/auth/register", async (req, res) => {
  try {
    const { email, password, name, level } = req.body as { email?: string; password?: string; name?: string; level?: string };

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email обязателен" }); return;
    }
    const emailTrimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      res.status(400).json({ error: "Неверный формат email" }); return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Пароль обязателен" }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Пароль слишком короткий (минимум 6 символов)" }); return;
    }

    const safeLevel = level && (VALID_LEVELS as readonly string[]).includes(level) ? level : "beginner";

    const existing = await db.select({ id: tutorUsersTable.id }).from(tutorUsersTable).where(eq(tutorUsersTable.email, emailTrimmed)).limit(1);
    if (existing.length) {
      res.status(409).json({ error: "Аккаунт с таким email уже существует" }); return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(tutorUsersTable).values({
      email: emailTrimmed,
      name: name?.trim() || null,
      passwordHash,
      level: safeLevel,
    }).returning();

    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Ошибка сервера. Попробуйте позже." });
  }
});

router.post("/speaktutor/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) { res.status(400).json({ error: "Email и пароль обязательны" }); return; }

    const rows = await db.select().from(tutorUsersTable).where(eq(tutorUsersTable.email, email.toLowerCase())).limit(1);
    if (!rows.length) { res.status(401).json({ error: "Неверный email или пароль" }); return; }

    const user = rows[0];
    if (!user.passwordHash) { res.status(401).json({ error: "Неверный email или пароль" }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Неверный email или пароль" }); return; }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ── YooKassa webhook (public — no JWT required) ───────────────────────────────

router.post("/speaktutor/payment/webhook", async (req, res) => {
  try {
    const event = req.body as {
      type?: string;
      object?: {
        id?: string;
        status?: string;
        metadata?: Record<string, string>;
      };
    };

    if (event.type === "payment.succeeded" && event.object?.metadata?.payment_db_id) {
      const paymentDbId = Number(event.object.metadata.payment_db_id);
      const [payment] = await db.select().from(tutorPaymentsTable)
        .where(eq(tutorPaymentsTable.id, paymentDbId)).limit(1);

      if (payment && payment.paymentStatus !== "paid") {
        await db.update(tutorPaymentsTable)
          .set({ paymentStatus: "paid", paidAt: new Date() })
          .where(eq(tutorPaymentsTable.id, paymentDbId));

        await db.update(tutorUsersTable)
          .set({
            paidSessionsRemaining: sql`${tutorUsersTable.paidSessionsRemaining} + ${payment.sessionsGranted}`,
            paymentStatus: "paid",
          })
          .where(eq(tutorUsersTable.id, payment.userId));
      }
    } else if (event.type === "payment.canceled" && event.object?.metadata?.payment_db_id) {
      const paymentDbId = Number(event.object.metadata.payment_db_id);
      await db.update(tutorPaymentsTable)
        .set({ paymentStatus: "failed" })
        .where(and(eq(tutorPaymentsTable.id, paymentDbId), eq(tutorPaymentsTable.paymentStatus, "pending")));
    }

    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "webhook error" });
  }
});

// ── All routes below require a valid JWT ─────────────────────────────────────

router.use(requireAuth);

router.get("/speaktutor/auth/me", async (req, res) => {
  try {
    const user = await getUserById(req.tutorUserId!);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get("/speaktutor/profile", async (req, res) => {
  try {
    const user = await getUserById(req.tutorUserId!);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(serializeUser(user));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/speaktutor/activate-sessions", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const user = await getUserById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    await db.update(tutorUsersTable).set({
      paymentStatus: "paid",
      demoCompleted: true,
      paidSessionsRemaining: user.paidSessionsRemaining + PAID_SESSIONS_PER_PACKAGE,
    }).where(eq(tutorUsersTable.id, userId));
    const updated = await getUserById(userId);
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json(serializeUser(updated));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

router.post("/speaktutor/sessions/:sessionId/extend", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const sessionId = Number(req.params.sessionId);
    if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];
    if (session.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
    const newPurchasedUser = session.purchasedExtraUserMessages + EXTENSION_MESSAGES;
    const newPurchasedAi = session.purchasedExtraAiMessages + EXTENSION_MESSAGES;
    if (session.includedUserMessages + newPurchasedUser > session.maxUserMessages) {
      res.status(400).json({ error: "SESSION_MAX_MESSAGES_REACHED" });
      return;
    }
    await db.update(tutorSessionsTable)
      .set({ purchasedExtraUserMessages: newPurchasedUser, purchasedExtraAiMessages: newPurchasedAi })
      .where(eq(tutorSessionsTable.id, sessionId));
    await db.insert(tutorSessionExtensionsTable).values({
      sessionId, userId,
      userMessagesAdded: EXTENSION_MESSAGES,
      aiMessagesAdded: EXTENSION_MESSAGES,
      priceRub: 100,
      paymentStatus: "paid",
    });
    const totalUserMessages = session.includedUserMessages + newPurchasedUser;
    res.json({
      sessionId,
      purchasedExtraUserMessages: newPurchasedUser,
      totalUserMessages,
      userMessagesRemaining: Math.max(0, totalUserMessages - session.userMessagesUsed),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/speaktutor/profile", async (req, res) => {
  try {
    const body = UpdateSpeakTutorProfileBody.parse(req.body);
    const updated = await db
      .update(tutorUsersTable)
      .set({ ...(body.name !== undefined ? { name: body.name } : {}), ...(body.level !== undefined ? { level: body.level } : {}) })
      .where(eq(tutorUsersTable.id, req.tutorUserId!))
      .returning();
    if (!updated.length) { res.status(404).json({ error: "User not found" }); return; }
    res.json(serializeUser(updated[0]));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: String(e) });
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get("/speaktutor/dashboard", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const user = await getUserById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const recentSessionRows = await db.select().from(tutorSessionsTable)
      .where(eq(tutorSessionsTable.userId, userId))
      .orderBy(desc(tutorSessionsTable.startedAt))
      .limit(5);

    const recentSessions = recentSessionRows.map((s) => ({
      id: s.id, scenarioId: s.scenarioId, scenarioTitle: s.scenarioTitle,
      startedAt: s.startedAt.toISOString(), endedAt: s.endedAt?.toISOString() ?? null,
      durationSeconds: s.durationSeconds, overallScore: s.overallScore, xpEarned: s.xpEarned, messageCount: s.messageCount,
    }));

    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const weeklyXp = last7Days.map((date) => {
      const d = new Date(date);
      return { day: dayNames[d.getDay()], xp: 0 };
    });

    const dailyRows = await db.select().from(tutorDailyPracticeTable).where(
      and(eq(tutorDailyPracticeTable.userId, userId), sql`${tutorDailyPracticeTable.date} >= ${last7Days[0]}`)
    );
    const dailyMap = new Map(dailyRows.map((r) => [r.date, r.xpEarned]));
    for (let i = 0; i < 7; i++) weeklyXp[i].xp = dailyMap.get(last7Days[i]) ?? 0;

    const streakCalendar = last7Days.map((date) => ({ date, practiced: dailyMap.has(date) }));

    const topMistakesRows = await db.select({ correction: tutorMessagesTable.correction })
      .from(tutorMessagesTable)
      .innerJoin(tutorSessionsTable, eq(tutorMessagesTable.sessionId, tutorSessionsTable.id))
      .where(and(eq(tutorSessionsTable.userId, userId), eq(tutorMessagesTable.role, "user"), sql`${tutorMessagesTable.correction} IS NOT NULL`))
      .orderBy(desc(tutorMessagesTable.createdAt)).limit(50);

    const mistakeCount = new Map<string, { count: number; category: string }>();
    for (const row of topMistakesRows) {
      const c = row.correction as { grammarMistakes?: string[]; vocabularyMistakes?: string[] } | null;
      if (!c) continue;
      for (const m of c.grammarMistakes ?? []) { const prev = mistakeCount.get(m) ?? { count: 0, category: "grammar" }; mistakeCount.set(m, { count: prev.count + 1, category: "grammar" }); }
      for (const m of c.vocabularyMistakes ?? []) { const prev = mistakeCount.get(m) ?? { count: 0, category: "vocabulary" }; mistakeCount.set(m, { count: prev.count + 1, category: "vocabulary" }); }
    }
    const topMistakes = [...mistakeCount.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([mistake, data]) => ({ mistake, count: data.count, category: data.category }));

    res.json({ profile: serializeUser(user), weeklyXp, recentSessions, topMistakes, streakCalendar });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Scenarios ─────────────────────────────────────────────────────────────────

router.get("/speaktutor/scenarios", async (req, res) => {
  try {
    const user = req.tutorUserId ? await getUserById(req.tutorUserId) : null;
    const isPaid = user?.paymentStatus === "paid";
    const userLevel = user?.level ?? "beginner";
    const demoScenarioId = FREE_SCENARIOS[userLevel] ?? "order_coffee";
    const result = SCENARIOS.map((s) => ({
      ...s,
      isLocked: !isPaid && s.id !== demoScenarioId,
      isPremiumLocked: !isPaid && s.id !== demoScenarioId,
    }));
    res.json(result);
  } catch {
    res.json(SCENARIOS.map((s) => ({ ...s, isLocked: false, isPremiumLocked: false })));
  }
});

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get("/speaktutor/sessions", async (req, res) => {
  try {
    const rows = await db.select().from(tutorSessionsTable)
      .where(eq(tutorSessionsTable.userId, req.tutorUserId!))
      .orderBy(desc(tutorSessionsTable.startedAt));
    res.json(rows.map((s) => ({
      id: s.id, scenarioId: s.scenarioId, scenarioTitle: s.scenarioTitle,
      startedAt: s.startedAt.toISOString(), endedAt: s.endedAt?.toISOString() ?? null,
      durationSeconds: s.durationSeconds, overallScore: s.overallScore, xpEarned: s.xpEarned, messageCount: s.messageCount,
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/speaktutor/sessions", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const user = await getUserById(userId);

    const isPaid = user?.paymentStatus === "paid";

    if (!isPaid) {
      // Demo user: block if demo already completed
      if (user?.demoCompleted) {
        res.status(402).json({ error: "DEMO_COMPLETED" });
        return;
      }
    } else {
      // Paid user: check session balance
      if (user && user.paidSessionsRemaining <= 0) {
        res.status(402).json({ error: "NO_SESSIONS_REMAINING", paidSessionsRemaining: 0 });
        return;
      }
    }

    const body = CreateSpeakTutorSessionBody.parse(req.body);
    let scenarioId = body.scenarioId;

    // "random" — demo users get only their level's demo scenario
    if (scenarioId === "random") {
      const level = user?.level ?? "beginner";
      if (!isPaid) {
        scenarioId = FREE_SCENARIOS[level] ?? "order_coffee";
      } else {
        const chosen = pickRandomScenario(level);
        scenarioId = chosen.id;
      }
    }

    // Demo users cannot start locked scenarios
    if (!isPaid) {
      const demoScenarioId = FREE_SCENARIOS[user?.level ?? "beginner"] ?? "order_coffee";
      if (scenarioId !== demoScenarioId) {
        res.status(403).json({ error: "SCENARIO_LOCKED", demoScenarioId });
        return;
      }
    }

    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    const scenarioTitle = scenario?.title ?? scenarioId;
    const [session] = await db.insert(tutorSessionsTable).values({
      userId,
      scenarioId,
      scenarioTitle,
      isDemoSession: !isPaid,
      includedUserMessages: isPaid ? INCLUDED_MESSAGES_PER_SESSION : 0,
      includedAiMessages: isPaid ? INCLUDED_MESSAGES_PER_SESSION : 0,
      maxUserMessages: MAX_SESSION_MESSAGES,
      maxAiMessages: MAX_SESSION_MESSAGES,
    }).returning();
    res.status(201).json({
      id: session.id, scenarioId: session.scenarioId, scenarioTitle: session.scenarioTitle,
      startedAt: session.startedAt.toISOString(), endedAt: null,
      durationSeconds: null, overallScore: null, xpEarned: null, messageCount: 0,
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: String(e) });
  }
});

router.get("/speaktutor/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = GetSpeakTutorSessionParams.parse({ sessionId: Number(req.params.sessionId) });
    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];
    const messages = await db.select().from(tutorMessagesTable).where(eq(tutorMessagesTable.sessionId, sessionId)).orderBy(tutorMessagesTable.createdAt);
    res.json({
      session: {
        id: session.id, scenarioId: session.scenarioId, scenarioTitle: session.scenarioTitle,
        startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() ?? null,
        durationSeconds: session.durationSeconds, overallScore: session.overallScore, xpEarned: session.xpEarned, messageCount: session.messageCount,
        isDemoSession: session.isDemoSession,
        userMessagesUsed: session.userMessagesUsed,
        aiMessagesUsed: session.aiMessagesUsed,
        includedUserMessages: session.includedUserMessages,
        includedAiMessages: session.includedAiMessages,
        purchasedExtraUserMessages: session.purchasedExtraUserMessages,
        purchasedExtraAiMessages: session.purchasedExtraAiMessages,
        maxUserMessages: session.maxUserMessages,
        maxAiMessages: session.maxAiMessages,
      },
      messages: messages.map((m) => ({
        id: m.id, role: m.role, text: m.text, audioUrl: m.audioUrl ?? null,
        createdAt: m.createdAt.toISOString(), correction: m.correction ?? null,
      })),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Session intro (AI first message + TTS) ────────────────────────────────────

router.post("/speaktutor/sessions/:sessionId/intro", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const sessionId = Number(req.params.sessionId);
    if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }

    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];

    // If intro already exists, return the first message
    const existing = await db.select().from(tutorMessagesTable)
      .where(eq(tutorMessagesTable.sessionId, sessionId))
      .orderBy(tutorMessagesTable.createdAt).limit(1);
    if (existing.length) {
      res.json({
        message: { id: existing[0].id, role: existing[0].role, text: existing[0].text, createdAt: existing[0].createdAt.toISOString(), correction: null },
        audioBase64: null,
      });
      return;
    }

    const user = await getUserById(userId);
    const userLevel = user?.level ?? "beginner";
    const scenario = SCENARIOS.find((s) => s.id === session.scenarioId);
    const scenarioRu = scenario?.title ?? session.scenarioTitle;
    const scenarioEn = scenario?.titleEn ?? session.scenarioTitle;

    const levelDesc: Record<string, string> = {
      beginner: "beginner (simple vocabulary, short sentences, very supportive)",
      intermediate: "intermediate (normal daily English, some idioms)",
      advanced: "advanced (natural fluent English, complex sentences, realistic tone)",
    };

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a Russian-speaking English tutor setting up a roleplay session.
Scenario: "${scenarioEn}" (Russian: "${scenarioRu}")
Learner level: ${levelDesc[userLevel] ?? levelDesc.beginner}

In this roleplay YOU (the AI) speak FIRST as a character, and the LEARNER responds naturally as their role.
The AI never asks the learner to repeat what the AI said — the learner always answers naturally.

Write an intro in this EXACT JSON format:
{
  "introRu": "Привет! Сегодня ситуация: [scenario name in Russian].\nТвоя роль: [learner's role in Russian, e.g. покупатель, путешественник, соискатель].\nСобеседник: [AI character's role in Russian, e.g. бариста, агент, менеджер].\n\nОтветь на эту фразу, чтобы продолжить диалог:",
  "firstLineEn": "Your natural opening line as the AI character. Do NOT ask the learner to repeat. Just start the scene naturally. 1-2 sentences appropriate for ${levelDesc[userLevel] ?? levelDesc.beginner} level."
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    let parsed: { introRu?: string; firstLineEn?: string } = {};
    try { parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}"); } catch { /* ignore */ }

    const introRu = parsed.introRu ?? `Привет! Сегодня ситуация: ${scenarioRu}.\n\nОтветь на эту фразу, чтобы продолжить диалог:`;
    const firstLineEn = parsed.firstLineEn ?? "Hello! How can I help you today?";
    const fullText = `${introRu}\n\n${firstLineEn}`;

    const [msg] = await db.insert(tutorMessagesTable).values({
      sessionId, role: "assistant", text: fullText,
    }).returning();

    // Generate TTS for the English first line only
    let audioBase64: string | null = null;
    try {
      const ttsRes = await openai.audio.speech.create({ model: "tts-1", voice: "nova", input: firstLineEn });
      audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString("base64");
    } catch { /* TTS is optional */ }

    res.json({
      message: { id: msg.id, role: msg.role, text: msg.text, createdAt: msg.createdAt.toISOString(), correction: null },
      audioBase64,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/speaktutor/sessions/:sessionId", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const { sessionId } = EndSpeakTutorSessionParams.parse({ sessionId: Number(req.params.sessionId) });
    const body = EndSpeakTutorSessionBody.parse(req.body);

    type CorrectionData = {
      score?: number; naturalnessScore?: number;
      grammarMistakes?: string[]; vocabularyMistakes?: string[]; pronunciationWarnings?: string[];
      originalText?: string; correctedText?: string; explanationRu?: string;
    };

    const userMsgs = await db.select({ id: tutorMessagesTable.id, text: tutorMessagesTable.text, correction: tutorMessagesTable.correction })
      .from(tutorMessagesTable)
      .where(and(eq(tutorMessagesTable.sessionId, sessionId), eq(tutorMessagesTable.role, "user")));

    const corrections = userMsgs.map((m) => m.correction as CorrectionData | null).filter(Boolean) as CorrectionData[];
    const scores        = corrections.map((c) => c.score).filter((s): s is number => typeof s === "number");
    const naturScores   = corrections.map((c) => c.naturalnessScore ?? c.score ?? 7).filter((s): s is number => typeof s === "number");
    const grammarErrs   = corrections.flatMap((c) => c.grammarMistakes ?? []);
    const vocabErrs     = corrections.flatMap((c) => c.vocabularyMistakes ?? []);
    const pronErrs      = corrections.flatMap((c) => c.pronunciationWarnings ?? []);
    const totalMistakes = grammarErrs.length + vocabErrs.length + pronErrs.length;

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 7;
    const overallScore     = avg(scores);
    const grammarScore     = Math.max(0, Math.min(100, avg(scores) * 10 - grammarErrs.length * 3));
    const vocabularyScore  = Math.max(0, Math.min(100, avg(scores) * 10 - vocabErrs.length * 4));
    const naturalnessScore = Math.max(0, Math.min(100, avg(naturScores) * 10));
    const pronunciationScore = Math.max(0, Math.min(100, 80 - pronErrs.length * 5));
    const xpEarned = scores.length ? Math.round(overallScore * 10 + scores.length * 5) : 0;

    // Best and weakest phrase
    const sortedByScore = [...userMsgs]
      .map((m) => ({ text: m.text, score: (m.correction as CorrectionData | null)?.score ?? 5 }))
      .sort((a, b) => b.score - a.score);
    const bestPhrase    = sortedByScore[0]?.text ?? null;
    const weakestPhrase = sortedByScore[sortedByScore.length - 1]?.text ?? null;

    // Generate AI summary
    const openai = getOpenAI();
    let summaryFeedback: Record<string, unknown> = {};
    try {
      const correctionsForAI = corrections.slice(0, 10).map((c) => ({
        original: c.originalText, corrected: c.correctedText, score: c.score,
        grammar: c.grammarMistakes, vocab: c.vocabularyMistakes, pron: c.pronunciationWarnings,
      }));
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `Analyze this English speaking session for a Russian learner and provide feedback in JSON format:

Corrections: ${JSON.stringify(correctionsForAI)}
Total messages: ${userMsgs.length}
Overall score: ${overallScore.toFixed(1)}/10

Respond with this JSON structure:
{
  "positives": ["2-4 specific things done well, in Russian"],
  "improvements": ["2-4 specific things to improve, in Russian"],
  "repeatedMistakes": ["up to 3 recurring error patterns, in Russian"],
  "bestCorrections": [
    { "userSaid": "...", "betterVersion": "...", "explanationRu": "..." }
  ]
}

Keep all feedback in Russian. Be specific and encouraging. Only include bestCorrections for the most important mistakes (max 3).`,
        }],
        temperature: 0.7,
      });
      summaryFeedback = JSON.parse(summaryCompletion.choices[0]?.message?.content ?? "{}");
    } catch { /* summary generation is optional */ }

    const [updated] = await db.update(tutorSessionsTable).set({
      endedAt: new Date(), durationSeconds: body.durationSeconds, overallScore, xpEarned,
      messageCount: userMsgs.length, status: "completed",
      grammarScore, vocabularyScore, naturalnessScore, pronunciationScore,
      totalMistakes, summaryFeedback, bestPhrase, weakestPhrase,
    }).where(eq(tutorSessionsTable.id, sessionId)).returning();

    if (!updated) { res.status(404).json({ error: "Session not found" }); return; }

    const user = await getUserById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const durationMinutes = Math.round((body.durationSeconds ?? 0) / 60);
    const today = todayString();
    const existingDaily = await db.select().from(tutorDailyPracticeTable)
      .where(and(eq(tutorDailyPracticeTable.userId, userId), eq(tutorDailyPracticeTable.date, today)));
    if (existingDaily.length) {
      await db.update(tutorDailyPracticeTable)
        .set({ xpEarned: existingDaily[0].xpEarned + xpEarned, minutesPracticed: existingDaily[0].minutesPracticed + durationMinutes })
        .where(eq(tutorDailyPracticeTable.id, existingDaily[0].id));
    } else {
      await db.insert(tutorDailyPracticeTable).values({ userId, date: today, xpEarned, minutesPracticed: durationMinutes });
    }

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const practicedYesterday = await db.select().from(tutorDailyPracticeTable)
      .where(and(eq(tutorDailyPracticeTable.userId, userId), eq(tutorDailyPracticeTable.date, yesterdayStr)));
    const newStreak = practicedYesterday.length || user.streak === 0 ? user.streak + 1 : 1;

    const allMessages = await db.select({ correction: tutorMessagesTable.correction })
      .from(tutorMessagesTable)
      .innerJoin(tutorSessionsTable, eq(tutorMessagesTable.sessionId, tutorSessionsTable.id))
      .where(and(eq(tutorSessionsTable.userId, userId), eq(tutorMessagesTable.role, "user")));
    const allScores = allMessages.map((m) => (m.correction as CorrectionData | null)?.score).filter((s): s is number => typeof s === "number");
    const globalAvg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 50;
    const userGrammarScore = Math.min(100, globalAvg * 10);

    await db.update(tutorUsersTable).set({
      xp: user.xp + xpEarned, streak: newStreak, lessonsCompleted: user.lessonsCompleted + 1,
      totalSpeakingMinutes: user.totalSpeakingMinutes + durationMinutes, grammarScore: userGrammarScore, lastPracticedAt: new Date(),
      // Decrement paid session balance on completion of a real paid session
      ...(user.paymentStatus === "paid" && !updated.isDemoSession ? { paidSessionsRemaining: Math.max(0, user.paidSessionsRemaining - 1) } : {}),
    }).where(eq(tutorUsersTable.id, userId));

    const updatedUser = await getUserById(userId);
    if (updatedUser) await checkAndGrantAchievements(userId, updatedUser);

    res.json({
      id: updated.id, scenarioId: updated.scenarioId, scenarioTitle: updated.scenarioTitle,
      startedAt: updated.startedAt.toISOString(), endedAt: updated.endedAt?.toISOString() ?? null,
      durationSeconds: updated.durationSeconds, overallScore: updated.overallScore, xpEarned: updated.xpEarned,
      messageCount: userMsgs.length, status: updated.status,
    });

    // Fire-and-forget: auto-extract vocabulary from this session
    setImmediate(() => extractVocabFromSession(sessionId, userId).catch(() => {}));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Session summary ────────────────────────────────────────────────────────────

router.get("/speaktutor/sessions/:sessionId/summary", async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }

    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];

    const userMsgs = await db.select().from(tutorMessagesTable)
      .where(and(eq(tutorMessagesTable.sessionId, sessionId), eq(tutorMessagesTable.role, "user")));

    res.json({
      id: session.id,
      scenarioTitle: session.scenarioTitle,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      status: session.status,
      overallScore: session.overallScore,
      grammarScore: session.grammarScore,
      vocabularyScore: session.vocabularyScore,
      naturalnessScore: session.naturalnessScore,
      pronunciationScore: session.pronunciationScore,
      totalMistakes: session.totalMistakes,
      xpEarned: session.xpEarned,
      hintsUsedCount: session.hintsUsedCount,
      messageCount: userMsgs.length,
      bestPhrase: session.bestPhrase,
      weakestPhrase: session.weakestPhrase,
      summaryFeedback: session.summaryFeedback as {
        positives?: string[];
        improvements?: string[];
        repeatedMistakes?: string[];
        bestCorrections?: { userSaid: string; betterVersion: string; explanationRu: string }[];
      } | null,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Session hint ───────────────────────────────────────────────────────────────

router.post("/speaktutor/sessions/:sessionId/hint", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const sessionId = Number(req.params.sessionId);
    if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }

    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];
    const scenario = SCENARIOS.find((s) => s.id === session.scenarioId);

    // Get the last assistant message to generate a contextual hint
    const lastMessages = await db.select().from(tutorMessagesTable)
      .where(eq(tutorMessagesTable.sessionId, sessionId))
      .orderBy(desc(tutorMessagesTable.createdAt))
      .limit(6);

    const lastAssistant = lastMessages.find((m) => m.role === "assistant");
    const contextText = lastAssistant?.text ?? `Scenario: ${scenario?.titleEn ?? session.scenarioTitle}`;

    const user = await getUserById(userId);
    const userLevel = user?.level ?? "beginner";

    const levelDesc: Record<string, string> = {
      beginner: "beginner (simple, basic words)",
      intermediate: "intermediate",
      advanced: "advanced (natural, idiomatic)",
    };

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: `You are helping a Russian learner practice English in a roleplay scenario.

Scenario: "${scenario?.titleEn ?? session.scenarioTitle}"
Learner level: ${levelDesc[userLevel] ?? "intermediate"}
Last AI message: "${contextText.slice(0, 300)}"

Generate a helpful hint for what the learner should say next. Respond with this JSON:
{
  "markerWord": "one key English word the learner should use",
  "usefulPhrase": "a helpful English phrase to use in response",
  "explanationRu": "brief explanation in Russian of why this phrase is useful and what markerWord means",
  "exampleAnswer": "a natural complete English response the learner could say"
}

Keep usefulPhrase appropriate for ${levelDesc[userLevel] ?? "intermediate"} level. Make it specific to the conversation context.`,
      }],
      temperature: 0.8,
    });

    let hint: { markerWord?: string; usefulPhrase?: string; explanationRu?: string; exampleAnswer?: string } = {};
    try { hint = JSON.parse(completion.choices[0]?.message?.content ?? "{}"); } catch { /* ignore */ }

    // Increment hint counter
    await db.update(tutorSessionsTable)
      .set({ hintsUsedCount: sql`${tutorSessionsTable.hintsUsedCount} + 1` })
      .where(and(eq(tutorSessionsTable.id, sessionId), eq(tutorSessionsTable.userId, userId)));

    res.json({
      markerWord:    hint.markerWord    ?? "please",
      usefulPhrase:  hint.usefulPhrase  ?? "Could you help me with that?",
      explanationRu: hint.explanationRu ?? "Вежливая просьба о помощи.",
      exampleAnswer: hint.exampleAnswer ?? "",
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Conversation ──────────────────────────────────────────────────────────────

router.post("/speaktutor/sessions/:sessionId/messages", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const { sessionId } = SendSpeakTutorMessageParams.parse({ sessionId: Number(req.params.sessionId) });
    const body = SendSpeakTutorMessageBody.parse(req.body);

    const sessions = await db.select().from(tutorSessionsTable).where(eq(tutorSessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) { res.status(404).json({ error: "Session not found" }); return; }
    const session = sessions[0];
    const scenario = SCENARIOS.find((s) => s.id === session.scenarioId);

    // ── Monetization gate ─────────────────────────────────────────────────────
    const user = await getUserById(userId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const isPaid = user.paymentStatus === "paid";

    if (!isPaid) {
      // Demo: check reply limit
      if (user.demoRepliesUsed >= DEMO_REPLY_LIMIT) {
        if (!user.demoCompleted) {
          await db.update(tutorUsersTable).set({ demoCompleted: true }).where(eq(tutorUsersTable.id, userId));
        }
        res.status(402).json({ error: "DEMO_LIMIT_REACHED", demoRepliesUsed: user.demoRepliesUsed });
        return;
      }
    } else {
      // Paid: check message limits
      const totalUserMessages = session.includedUserMessages + session.purchasedExtraUserMessages;
      if (session.userMessagesUsed >= session.maxUserMessages) {
        res.status(402).json({ error: "SESSION_MAX_MESSAGES_REACHED", userMessagesUsed: session.userMessagesUsed, maxUserMessages: session.maxUserMessages });
        return;
      }
      if (session.userMessagesUsed >= totalUserMessages) {
        res.status(402).json({ error: "SESSION_MESSAGE_LIMIT_REACHED", userMessagesUsed: session.userMessagesUsed, totalUserMessages });
        return;
      }
    }

    const history = await db.select().from(tutorMessagesTable).where(eq(tutorMessagesTable.sessionId, sessionId)).orderBy(tutorMessagesTable.createdAt);

    // Include user's recently learned vocabulary to help AI reinforce it
    const recentVocab = await db.select({ word: tutorVocabularyTable.word, translation: tutorVocabularyTable.translation })
      .from(tutorVocabularyTable)
      .where(and(eq(tutorVocabularyTable.userId, userId), eq(tutorVocabularyTable.wordType, "word")))
      .orderBy(desc(tutorVocabularyTable.addedAt))
      .limit(10);
    const vocabContext = recentVocab.length
      ? `\nUSER'S RECENT VOCABULARY (naturally incorporate these words when appropriate): ${recentVocab.map((v) => v.word).join(", ")}.`
      : "";

    const systemPrompt = `You are an English conversation tutor for Russian-speaking learners.
Your role: Play the role in the scenario "${scenario?.titleEn ?? session.scenarioTitle}" and have a natural conversation in English.
After each user message, respond as the character in the scenario, then separately provide a JSON correction analysis.${vocabContext}

IMPORTANT RULES FOR CORRECTION:
- NEVER correct punctuation (commas, periods, apostrophes, quotes, capitalization). Spoken English practice only evaluates meaning, grammar, vocabulary, naturalness and pronunciation.
- NEVER mention comma, period, capitalization, apostrophe or any punctuation as a mistake.
- If the only difference between user's text and correct text is punctuation or capitalization, set score = 10 and all mistake arrays = [].
- Focus only on: grammar, word choice, naturalness, meaning, pronunciation warnings.

ALWAYS respond with valid JSON in this exact format:
{
  "reply": "Your conversational response as the tutor/character in English",
  "correction": {
    "originalText": "the user's exact text",
    "correctedText": "corrected version (same as original if only punctuation differs)",
    "grammarMistakes": ["specific grammar error 1"],
    "vocabularyMistakes": ["wrong word choice 1"],
    "pronunciationWarnings": ["sounds that are typically hard for Russian speakers"],
    "naturalnessScore": 8,
    "nativeSpeakerVersion": "how a native speaker would naturally say it",
    "explanationRu": "Краткое объяснение ошибок на русском языке. Если ошибок нет — напишите что-то позитивное.",
    "score": 8
  }
}

If the user's message is perfect or only differs in punctuation/capitalization, set correctedText = originalText, all mistake arrays = [], naturalnessScore = 10, and score = 10.
Score 1-10 where 10 = perfect native-level English. naturalnessScore 1-10 evaluates how natural the phrasing is.
Always respond in English (except explanationRu which must be in Russian).
Keep your reply short and natural, 1-3 sentences.`;

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.text })),
      { role: "user", content: body.text },
    ];

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", messages: openaiMessages, response_format: { type: "json_object" }, temperature: 0.7,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { reply?: string; correction?: { originalText: string; correctedText: string; grammarMistakes?: string[]; vocabularyMistakes?: string[]; pronunciationWarnings?: string[]; naturalnessScore?: number; nativeSpeakerVersion?: string; explanationRu?: string; score?: number } };
    try { parsed = JSON.parse(rawContent); } catch {
      parsed = { reply: "I'm sorry, could you repeat that?", correction: { originalText: body.text, correctedText: body.text, grammarMistakes: [], vocabularyMistakes: [], pronunciationWarnings: [], nativeSpeakerVersion: body.text, explanationRu: "Не удалось проанализировать.", score: 5 } };
    }

    const rawOriginal = parsed.correction?.originalText ?? body.text;
    const rawCorrected = parsed.correction?.correctedText ?? body.text;

    // If only difference is punctuation/capitalization — force perfect score
    const isPunctuationOnly = normalizeText(rawOriginal) === normalizeText(rawCorrected);

    const correction = {
      originalText: rawOriginal,
      correctedText: isPunctuationOnly ? rawOriginal : rawCorrected,
      grammarMistakes:        isPunctuationOnly ? [] : (parsed.correction?.grammarMistakes ?? []),
      vocabularyMistakes:     isPunctuationOnly ? [] : (parsed.correction?.vocabularyMistakes ?? []),
      pronunciationWarnings:  isPunctuationOnly ? [] : (parsed.correction?.pronunciationWarnings ?? []),
      naturalnessScore:       isPunctuationOnly ? 10 : (parsed.correction?.naturalnessScore ?? 7),
      nativeSpeakerVersion:   parsed.correction?.nativeSpeakerVersion ?? body.text,
      explanationRu:          isPunctuationOnly ? "Отлично! Всё сказано правильно." : (parsed.correction?.explanationRu ?? ""),
      score:                  isPunctuationOnly ? 10 : (parsed.correction?.score ?? 7),
    };

    const [userMsg] = await db.insert(tutorMessagesTable).values({ sessionId, role: "user", text: body.text, correction }).returning();
    const replyText = parsed.reply ?? "Let's continue!";
    const [assistantMsg] = await db.insert(tutorMessagesTable).values({ sessionId, role: "assistant", text: replyText }).returning();

    const xpEarned = Math.round(correction.score * 2);
    await db.update(tutorUsersTable).set({ xp: sql`${tutorUsersTable.xp} + ${xpEarned}` }).where(eq(tutorUsersTable.id, userId));

    if (correction.score === 10) {
      await checkAndGrantAchievements(userId, user);
    }

    // Increment message counters
    const newUserMessagesUsed = session.userMessagesUsed + 1;
    const newAiMessagesUsed = session.aiMessagesUsed + 1;
    await db.update(tutorSessionsTable)
      .set({ userMessagesUsed: newUserMessagesUsed, aiMessagesUsed: newAiMessagesUsed, messageCount: history.length + 2 })
      .where(eq(tutorSessionsTable.id, sessionId));

    // Compute message info for response (paid sessions)
    let messageInfo: { userMessagesUsed: number; userMessagesTotal: number; userMessagesRemaining: number } | null = null;
    if (isPaid) {
      const total = session.includedUserMessages + session.purchasedExtraUserMessages;
      messageInfo = {
        userMessagesUsed: newUserMessagesUsed,
        userMessagesTotal: total,
        userMessagesRemaining: Math.max(0, total - newUserMessagesUsed),
      };
    }

    res.json({
      userMessage: { id: userMsg.id, role: userMsg.role, text: userMsg.text, audioUrl: null, createdAt: userMsg.createdAt.toISOString(), correction },
      assistantMessage: { id: assistantMsg.id, role: assistantMsg.role, text: assistantMsg.text, audioUrl: null, createdAt: assistantMsg.createdAt.toISOString(), correction: null },
      correction, xpEarned, messageInfo,
    });

    // Fire-and-forget: update demo counters
    setImmediate(async () => {
      try {
        if (!isPaid) {
          const newCount = user.demoRepliesUsed + 1;
          await db.update(tutorUsersTable)
            .set({ demoRepliesUsed: newCount, ...(newCount >= DEMO_REPLY_LIMIT ? { demoCompleted: true } : {}) })
            .where(eq(tutorUsersTable.id, userId));
        }
      } catch { /* non-fatal */ }
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Transcribe ────────────────────────────────────────────────────────────────

router.post("/speaktutor/transcribe", async (req, res) => {
  try {
    // Demo gate: reject before calling Whisper if user exhausted demo replies
    const userId = req.tutorUserId!;
    const user = await getUserById(userId);
    if (user && user.paymentStatus !== "paid") {
      if (user.demoRepliesUsed >= DEMO_REPLY_LIMIT) {
        if (!user.demoCompleted) {
          await db.update(tutorUsersTable).set({ demoCompleted: true }).where(eq(tutorUsersTable.id, userId));
        }
        res.status(402).json({ error: "DEMO_LIMIT_REACHED", demoRepliesUsed: user.demoRepliesUsed });
        return;
      }
    }

    const body = TranscribeSpeakTutorBody.parse(req.body);
    const openai = getOpenAI();
    const audioBuffer = Buffer.from(body.audioBase64, "base64");
    const baseType = body.mimeType.split(";")[0].trim();
    const ext = baseType === "audio/mp4" ? "mp4" : baseType === "audio/ogg" ? "ogg" : baseType === "audio/wav" ? "wav" : "webm";
    const file = await toFile(audioBuffer, `audio.${ext}`, { type: baseType });
    const transcription = await openai.audio.transcriptions.create({ file, model: "whisper-1", language: "en" });
    res.json({ text: transcription.text, confidence: null, words: [] });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── TTS ───────────────────────────────────────────────────────────────────────

router.post("/speaktutor/tts", async (req, res) => {
  try {
    const body = TextToSpeechSpeakTutorBody.parse(req.body);
    const openai = getOpenAI();
    const response = await openai.audio.speech.create({
      model: "tts-1", voice: (body.voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer") ?? "nova", input: body.text,
    });
    const arrayBuffer = await response.arrayBuffer();
    res.json({ audioBase64: Buffer.from(arrayBuffer).toString("base64") });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Achievements ──────────────────────────────────────────────────────────────

router.get("/speaktutor/achievements", async (req, res) => {
  try {
    const achievements = await buildAchievementList(req.tutorUserId!);
    res.json(achievements);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Vocabulary ────────────────────────────────────────────────────────────────

function serializeWord(w: typeof tutorVocabularyTable.$inferSelect) {
  return {
    id: w.id, word: w.word, translation: w.translation,
    explanation: w.explanation, exampleSentence: w.exampleSentence, sessionExample: w.sessionExample,
    wordType: w.wordType, difficulty: w.difficulty,
    isMastered: w.isMastered, isFavorite: w.isFavorite,
    timesSeenWrong: w.timesSeenWrong, timesReviewed: w.timesReviewed, timesCorrect: w.timesCorrect,
    intervalDays: w.intervalDays,
    nextReviewAt: w.nextReviewAt?.toISOString() ?? null,
    addedAt: w.addedAt.toISOString(),
  };
}

router.get("/speaktutor/vocabulary", async (req, res) => {
  try {
    const rows = await db.select().from(tutorVocabularyTable)
      .where(eq(tutorVocabularyTable.userId, req.tutorUserId!))
      .orderBy(desc(tutorVocabularyTable.addedAt));
    res.json(rows.map(serializeWord));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/speaktutor/vocabulary", async (req, res) => {
  try {
    const body = AddSpeakTutorWordBody.parse(req.body);
    const [word] = await db.insert(tutorVocabularyTable).values({
      userId: req.tutorUserId!, word: body.word, translation: body.translation, exampleSentence: body.exampleSentence,
    }).returning();
    res.status(201).json(serializeWord(word));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: String(e) });
  }
});

router.patch("/speaktutor/vocabulary/:wordId", async (req, res) => {
  try {
    const wordId = Number(req.params.wordId);
    const allowed = ["isMastered", "isFavorite", "difficulty", "explanation", "translation", "exampleSentence"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }
    const [word] = await db.update(tutorVocabularyTable).set(update)
      .where(and(eq(tutorVocabularyTable.id, wordId), eq(tutorVocabularyTable.userId, req.tutorUserId!)))
      .returning();
    if (!word) { res.status(404).json({ error: "Word not found" }); return; }
    res.json(serializeWord(word));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// SM-2 spaced repetition
function applySpacedRepetition(intervalDays: number, result: string): { newInterval: number; nextReviewAt: Date } {
  let newInterval = intervalDays;
  if (result === "easy")   newInterval = Math.max(1, intervalDays * 2.5);
  else if (result === "medium") newInterval = Math.max(1, intervalDays * 1.5);
  else if (result === "hard")  newInterval = 1;
  else if (result === "correct") newInterval = Math.max(1, intervalDays * 2);
  else if (result === "incorrect") newInterval = 1;
  newInterval = Math.min(newInterval, 60);
  const nextReviewAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
  return { newInterval, nextReviewAt };
}

router.post("/speaktutor/vocabulary/:wordId/review", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const wordId = Number(req.params.wordId);
    const { result } = req.body as { result: string };
    if (!result) { res.status(400).json({ error: "result required" }); return; }

    const rows = await db.select().from(tutorVocabularyTable)
      .where(and(eq(tutorVocabularyTable.id, wordId), eq(tutorVocabularyTable.userId, userId))).limit(1);
    if (!rows.length) { res.status(404).json({ error: "Word not found" }); return; }
    const word = rows[0];

    const isCorrect = result === "easy" || result === "correct" || result === "medium";
    const { newInterval, nextReviewAt } = applySpacedRepetition(word.intervalDays, result);
    const isMastered = newInterval >= 14;

    const [updated] = await db.update(tutorVocabularyTable).set({
      timesReviewed: word.timesReviewed + 1,
      timesCorrect: isCorrect ? word.timesCorrect + 1 : word.timesCorrect,
      timesSeenWrong: !isCorrect ? word.timesSeenWrong + 1 : word.timesSeenWrong,
      intervalDays: newInterval,
      nextReviewAt,
      isMastered,
    }).where(eq(tutorVocabularyTable.id, wordId)).returning();

    await db.insert(tutorVocabReviewsTable).values({ wordId, userId, result });

    // XP for correct review
    if (isCorrect) {
      await db.update(tutorUsersTable).set({ xp: sql`${tutorUsersTable.xp} + 5` }).where(eq(tutorUsersTable.id, userId));
    }

    res.json({ ...serializeWord(updated), xpEarned: isCorrect ? 5 : 0 });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

router.get("/speaktutor/vocabulary/due", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const now = new Date();
    const allWords = await db.select().from(tutorVocabularyTable)
      .where(eq(tutorVocabularyTable.userId, userId));

    const dueWords = allWords.filter((w) =>
      !w.nextReviewAt || w.nextReviewAt <= now
    );
    const masteredCount = allWords.filter((w) => w.isMastered).length;
    const totalCorrect = allWords.reduce((a, w) => a + w.timesCorrect, 0);
    const totalReviewed = allWords.reduce((a, w) => a + w.timesReviewed, 0);
    const accuracy = totalReviewed ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

    res.json({
      dueCount: dueWords.length,
      dueWords: dueWords.map(serializeWord),
      stats: {
        total: allWords.length, mastered: masteredCount,
        difficult: allWords.filter((w) => w.timesSeenWrong >= 2).length,
        accuracy, totalReviewed,
      },
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Auto-extract vocabulary from a completed session
async function extractVocabFromSession(sessionId: number, userId: number): Promise<void> {
  try {
    const messages = await db.select().from(tutorMessagesTable)
      .where(eq(tutorMessagesTable.sessionId, sessionId))
      .orderBy(tutorMessagesTable.createdAt);
    if (messages.length < 2) return;

    // Get existing words to avoid duplicates
    const existingWords = await db.select({ word: tutorVocabularyTable.word })
      .from(tutorVocabularyTable).where(eq(tutorVocabularyTable.userId, userId));
    const existingSet = new Set(existingWords.map((w) => w.word.toLowerCase()));

    // Build conversation text for GPT
    const conversationText = messages.slice(0, 20).map((m) => `${m.role}: ${m.text}`).join("\n");

    // Also get correction data
    const corrections = messages
      .filter((m) => m.role === "user" && m.correction)
      .map((m) => m.correction as { grammarMistakes?: string[]; vocabularyMistakes?: string[]; originalText?: string; correctedText?: string; explanationRu?: string });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: `Analyze this English conversation and extract useful vocabulary for a Russian learner.

Conversation:
${conversationText}

Grammar/vocabulary corrections from session: ${JSON.stringify(corrections.slice(0, 5))}

Extract 3-8 most useful items. Focus on:
1. Useful intermediate words and phrases (not: the, and, is, hello, ok, yes, no, sorry)
2. Words the user struggled with (from corrections)
3. Natural expressions used by the AI tutor
4. Grammar patterns worth remembering

Respond with JSON:
{
  "items": [
    {
      "word": "English word or phrase",
      "translation": "Russian translation",
      "explanation": "Brief Russian explanation of usage (1 sentence)",
      "example": "Natural example sentence using this word",
      "sessionExample": "Actual sentence from the conversation where this was used (or null)",
      "wordType": "word|phrase|mistake",
      "difficulty": "easy|medium|hard"
    }
  ]
}

For wordType="mistake": word = wrong version, translation = correct version, explanation = why it's wrong in Russian.
Skip words that are too simple or already very well known.`,
      }],
      temperature: 0.5,
    });

    let extracted: { items?: Array<{ word: string; translation: string; explanation?: string; example?: string; sessionExample?: string; wordType?: string; difficulty?: string }> } = {};
    try { extracted = JSON.parse(completion.choices[0]?.message?.content ?? "{}"); } catch { return; }
    if (!extracted.items?.length) return;

    const COMMON_WORDS = new Set(["the", "and", "is", "are", "was", "were", "be", "to", "a", "an", "in", "on", "at", "it", "i", "you", "he", "she", "we", "they", "hello", "hi", "ok", "okay", "yes", "no", "please", "sorry", "thank", "thanks"]);

    for (const item of extracted.items) {
      if (!item.word || !item.translation) continue;
      const normalized = item.word.toLowerCase().trim();
      if (COMMON_WORDS.has(normalized)) continue;
      if (existingSet.has(normalized)) continue;
      existingSet.add(normalized);

      await db.insert(tutorVocabularyTable).values({
        userId, word: item.word.trim(), translation: item.translation.trim(),
        explanation: item.explanation ?? null,
        exampleSentence: item.example ?? null,
        sessionExample: item.sessionExample ?? null,
        wordType: (item.wordType === "phrase" || item.wordType === "mistake") ? item.wordType : "word",
        difficulty: (item.difficulty === "easy" || item.difficulty === "hard") ? item.difficulty : "medium",
      }).onConflictDoNothing();
    }
  } catch { /* auto-extraction errors are non-critical */ }
}

router.post("/speaktutor/sessions/:sessionId/extract-vocabulary", async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
    // Fire-and-forget — respond immediately
    res.json({ status: "processing" });
    await extractVocabFromSession(sessionId, req.tutorUserId!);
  } catch (e) {
    req.log.error(e);
  }
});

router.delete("/speaktutor/vocabulary/:wordId", async (req, res) => {
  try {
    const { wordId } = DeleteSpeakTutorWordParams.parse({ wordId: Number(req.params.wordId) });
    await db.delete(tutorVocabularyTable).where(and(eq(tutorVocabularyTable.id, wordId), eq(tutorVocabularyTable.userId, req.tutorUserId!)));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────

router.get("/speaktutor/analytics", async (req, res) => {
  try {
    const userId = req.tutorUserId!;
    const user = await getUserById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const sessions = await db.select().from(tutorSessionsTable)
      .where(and(eq(tutorSessionsTable.userId, userId), sql`${tutorSessionsTable.endedAt} IS NOT NULL`))
      .orderBy(tutorSessionsTable.startedAt);

    const weeklyMap = new Map<string, { grammarScores: number[]; vocabScores: number[]; minutes: number; count: number }>();
    for (const s of sessions) {
      const d = new Date(s.startedAt); const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      const entry = weeklyMap.get(weekKey) ?? { grammarScores: [], vocabScores: [], minutes: 0, count: 0 };
      if (s.overallScore) { entry.grammarScores.push(s.overallScore * 10); entry.vocabScores.push(s.overallScore * 9); }
      entry.minutes += Math.round((s.durationSeconds ?? 0) / 60); entry.count += 1;
      weeklyMap.set(weekKey, entry);
    }
    const weeklyProgress = [...weeklyMap.entries()].slice(-8).map(([week, data]) => ({
      week,
      grammarScore: data.grammarScores.length ? data.grammarScores.reduce((a, b) => a + b, 0) / data.grammarScores.length : 0,
      vocabularyScore: data.vocabScores.length ? data.vocabScores.reduce((a, b) => a + b, 0) / data.vocabScores.length : 0,
      pronunciationScore: user.pronunciationScore, speakingMinutes: data.minutes, sessionsCount: data.count,
    }));

    const allMessages = await db.select({ correction: tutorMessagesTable.correction })
      .from(tutorMessagesTable)
      .innerJoin(tutorSessionsTable, eq(tutorMessagesTable.sessionId, tutorSessionsTable.id))
      .where(and(eq(tutorSessionsTable.userId, userId), eq(tutorMessagesTable.role, "user"), sql`${tutorMessagesTable.correction} IS NOT NULL`));

    let grammarCount = 0, vocabCount = 0, pronCount = 0;
    for (const m of allMessages) {
      const c = m.correction as { grammarMistakes?: string[]; vocabularyMistakes?: string[]; pronunciationWarnings?: string[] } | null;
      grammarCount += c?.grammarMistakes?.length ?? 0; vocabCount += c?.vocabularyMistakes?.length ?? 0; pronCount += c?.pronunciationWarnings?.length ?? 0;
    }
    const total = grammarCount + vocabCount + pronCount || 1;
    const errorFrequency = [
      { category: "Грамматика", count: grammarCount, percentage: Math.round((grammarCount / total) * 100) },
      { category: "Лексика", count: vocabCount, percentage: Math.round((vocabCount / total) * 100) },
      { category: "Произношение", count: pronCount, percentage: Math.round((pronCount / total) * 100) },
    ];

    const words = await db.select({ addedAt: tutorVocabularyTable.addedAt }).from(tutorVocabularyTable).where(eq(tutorVocabularyTable.userId, userId));
    const monthMap = new Map<string, number>();
    for (const w of words) { const month = w.addedAt.toISOString().slice(0, 7); monthMap.set(month, (monthMap.get(month) ?? 0) + 1); }
    const vocabularyGrowth = [...monthMap.entries()].map(([month, wordsLearned]) => ({ month, wordsLearned }));

    const allScores = allMessages.map((m) => (m.correction as { score?: number } | null)?.score).filter((s): s is number => typeof s === "number");
    const avgScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    res.json({
      weeklyProgress, errorFrequency, vocabularyGrowth,
      totalStats: { totalSessions: sessions.length, totalMinutes: user.totalSpeakingMinutes, totalWords: words.length, averageScore: Math.round(avgScore * 10) / 10 },
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Payments ──────────────────────────────────────────────────────────────────

const YOOKASSA_API = "https://api.yookassa.ru/v3";

// POST /speaktutor/payment/create
router.post("/speaktutor/payment/create", async (req, res) => {
  const userId = req.tutorUserId!;

  const [payment] = await db.insert(tutorPaymentsTable).values({
    userId,
    amount: 49900,
    currency: "RUB",
    paymentProvider: "yookassa",
    paymentStatus: "pending",
    sessionsGranted: 5,
    description: "Пакет из 5 практических сессий — 499 ₽",
  }).returning();

  const shopId = process.env["YOOKASSA_SHOP_ID"];
  const secretKey = process.env["YOOKASSA_SECRET_KEY"];

  if (!shopId || !secretKey) {
    req.log.warn("YooKassa credentials not configured");
    res.status(503).json({ error: "Платёжный сервис временно недоступен" });
    return;
  }

  try {
    const returnUrl = (req.body as { returnUrl?: string }).returnUrl
      ?? `${req.headers["origin"] ?? "https://speaktutor.ru"}/speaktutor/payment/return`;

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
    const ykRes = await fetch(`${YOOKASSA_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": randomUUID(),
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: { value: "499.00", currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: `${returnUrl}?payment_db_id=${payment.id}`,
        },
        description: "Пакет из 5 практических сессий — 499 ₽",
        metadata: { payment_db_id: String(payment.id), user_id: String(userId) },
      }),
    });

    if (!ykRes.ok) {
      const errBody = await ykRes.text();
      req.log.error({ status: ykRes.status, body: errBody }, "YooKassa create payment failed");
      res.status(502).json({ error: "Ошибка платёжного сервиса. Попробуйте позже." });
      return;
    }

    const ykData = await ykRes.json() as { id: string; confirmation?: { confirmation_url?: string } };

    await db.update(tutorPaymentsTable)
      .set({ yookassaPaymentId: ykData.id, yookassaConfirmationUrl: ykData.confirmation?.confirmation_url })
      .where(eq(tutorPaymentsTable.id, payment.id));

    res.json({
      paymentDbId: payment.id,
      yookassaPaymentId: ykData.id,
      confirmationUrl: ykData.confirmation?.confirmation_url,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// GET /speaktutor/payment/:paymentDbId/status
router.get("/speaktutor/payment/:paymentDbId/status", async (req, res) => {
  const userId = req.tutorUserId!;
  const paymentDbId = Number(req.params.paymentDbId);

  if (!paymentDbId || isNaN(paymentDbId)) {
    res.status(400).json({ error: "Invalid payment id" });
    return;
  }

  try {
    const [payment] = await db.select().from(tutorPaymentsTable)
      .where(and(eq(tutorPaymentsTable.id, paymentDbId), eq(tutorPaymentsTable.userId, userId)))
      .limit(1);

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // If still pending and YooKassa is configured, sync status
    if (payment.paymentStatus === "pending" && payment.yookassaPaymentId) {
      const shopId = process.env["YOOKASSA_SHOP_ID"];
      const secretKey = process.env["YOOKASSA_SECRET_KEY"];
      if (shopId && secretKey) {
        try {
          const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
          const ykRes = await fetch(`${YOOKASSA_API}/payments/${payment.yookassaPaymentId}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (ykRes.ok) {
            const ykData = await ykRes.json() as { status: string };
            if (ykData.status === "succeeded" && payment.paymentStatus !== "paid") {
              await db.update(tutorPaymentsTable)
                .set({ paymentStatus: "paid", paidAt: new Date() })
                .where(eq(tutorPaymentsTable.id, payment.id));
              await db.update(tutorUsersTable)
                .set({
                  paidSessionsRemaining: sql`${tutorUsersTable.paidSessionsRemaining} + ${payment.sessionsGranted}`,
                  paymentStatus: "paid",
                })
                .where(eq(tutorUsersTable.id, payment.userId));
              res.json({ status: "paid", paidAt: new Date().toISOString() });
              return;
            } else if (ykData.status === "canceled") {
              await db.update(tutorPaymentsTable)
                .set({ paymentStatus: "failed" })
                .where(eq(tutorPaymentsTable.id, payment.id));
              res.json({ status: "failed", paidAt: null });
              return;
            }
          }
        } catch {
          // fall through to return DB status
        }
      }
    }

    res.json({ status: payment.paymentStatus, paidAt: payment.paidAt?.toISOString() ?? null });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
