import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorUsersTable = pgTable("tutor_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  level: text("level").notNull().default("beginner"),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  totalSpeakingMinutes: integer("total_speaking_minutes").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  grammarScore: real("grammar_score").notNull().default(50),
  vocabularyScore: real("vocabulary_score").notNull().default(50),
  pronunciationScore: real("pronunciation_score").notNull().default(50),
  lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Monetization
  demoRepliesUsed: integer("demo_replies_used").notNull().default(0),
  demoCompleted: boolean("demo_completed").notNull().default(false),
  paidSessionsRemaining: integer("paid_sessions_remaining").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("free"),
});

export const insertTutorUserSchema = createInsertSchema(tutorUsersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTutorUser = z.infer<typeof insertTutorUserSchema>;
export type TutorUser = typeof tutorUsersTable.$inferSelect;

export const tutorSessionsTable = pgTable("tutor_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scenarioId: text("scenario_id").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  overallScore: real("overall_score"),
  xpEarned: integer("xp_earned"),
  messageCount: integer("message_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  grammarScore: real("grammar_score"),
  vocabularyScore: real("vocabulary_score"),
  naturalnessScore: real("naturalness_score"),
  pronunciationScore: real("pronunciation_score"),
  totalMistakes: integer("total_mistakes"),
  hintsUsedCount: integer("hints_used_count").notNull().default(0),
  summaryFeedback: jsonb("summary_feedback"),
  bestPhrase: text("best_phrase"),
  weakestPhrase: text("weakest_phrase"),
  // Message-based limits
  userMessagesUsed: integer("user_messages_used").notNull().default(0),
  aiMessagesUsed: integer("ai_messages_used").notNull().default(0),
  includedUserMessages: integer("included_user_messages").notNull().default(0),
  includedAiMessages: integer("included_ai_messages").notNull().default(0),
  purchasedExtraUserMessages: integer("purchased_extra_user_messages").notNull().default(0),
  purchasedExtraAiMessages: integer("purchased_extra_ai_messages").notNull().default(0),
  maxUserMessages: integer("max_user_messages").notNull().default(20),
  maxAiMessages: integer("max_ai_messages").notNull().default(20),
  // Demo tracking
  isDemoSession: boolean("is_demo_session").notNull().default(false),
});

export const insertTutorSessionSchema = createInsertSchema(tutorSessionsTable).omit({
  id: true,
  startedAt: true,
  messageCount: true,
  userMessagesUsed: true,
  aiMessagesUsed: true,
});
export type InsertTutorSession = z.infer<typeof insertTutorSessionSchema>;
export type TutorSession = typeof tutorSessionsTable.$inferSelect;

export const tutorSessionExtensionsTable = pgTable("tutor_session_extensions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: integer("user_id").notNull(),
  userMessagesAdded: integer("user_messages_added").notNull().default(7),
  aiMessagesAdded: integer("ai_messages_added").notNull().default(7),
  priceRub: integer("price_rub").notNull().default(100),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const tutorPaymentsTable = pgTable("tutor_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // in kopecks: 49900 = 499.00 RUB
  currency: text("currency").notNull().default("RUB"),
  paymentProvider: text("payment_provider").notNull().default("yookassa"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
  yookassaPaymentId: text("yookassa_payment_id"),
  yookassaConfirmationUrl: text("yookassa_confirmation_url"),
  sessionsGranted: integer("sessions_granted").notNull().default(5),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const insertTutorPaymentSchema = createInsertSchema(tutorPaymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTutorPayment = z.infer<typeof insertTutorPaymentSchema>;
export type TutorPayment = typeof tutorPaymentsTable.$inferSelect;

export const insertTutorSessionExtensionSchema = createInsertSchema(tutorSessionExtensionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTutorSessionExtension = z.infer<typeof insertTutorSessionExtensionSchema>;
export type TutorSessionExtension = typeof tutorSessionExtensionsTable.$inferSelect;

export const tutorMessagesTable = pgTable("tutor_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(),
  text: text("text").notNull(),
  audioUrl: text("audio_url"),
  correction: jsonb("correction"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTutorMessageSchema = createInsertSchema(tutorMessagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTutorMessage = z.infer<typeof insertTutorMessageSchema>;
export type TutorMessage = typeof tutorMessagesTable.$inferSelect;

export const tutorVocabularyTable = pgTable("tutor_vocabulary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  explanation: text("explanation"),
  exampleSentence: text("example_sentence"),
  sessionExample: text("session_example"),
  wordType: text("word_type").notNull().default("word"),
  difficulty: text("difficulty").notNull().default("medium"),
  isMastered: boolean("is_mastered").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
  timesSeenWrong: integer("times_seen_wrong").notNull().default(0),
  timesReviewed: integer("times_reviewed").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  intervalDays: real("interval_days").notNull().default(1),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTutorVocabularySchema = createInsertSchema(tutorVocabularyTable).omit({
  id: true,
  addedAt: true,
  timesSeenWrong: true,
  timesReviewed: true,
  timesCorrect: true,
});
export type InsertTutorVocabulary = z.infer<typeof insertTutorVocabularySchema>;
export type TutorVocabulary = typeof tutorVocabularyTable.$inferSelect;

export const tutorVocabReviewsTable = pgTable("tutor_vocab_reviews", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").notNull(),
  userId: integer("user_id").notNull(),
  result: text("result").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTutorVocabReviewSchema = createInsertSchema(tutorVocabReviewsTable).omit({
  id: true,
  reviewedAt: true,
});
export type InsertTutorVocabReview = z.infer<typeof insertTutorVocabReviewSchema>;
export type TutorVocabReview = typeof tutorVocabReviewsTable.$inferSelect;

export const tutorAchievementsTable = pgTable("tutor_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeName: text("badge_name").notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
});

export const insertTutorAchievementSchema = createInsertSchema(tutorAchievementsTable).omit({
  id: true,
});
export type InsertTutorAchievement = z.infer<typeof insertTutorAchievementSchema>;
export type TutorAchievement = typeof tutorAchievementsTable.$inferSelect;

export const tutorDailyPracticeTable = pgTable("tutor_daily_practice", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  minutesPracticed: integer("minutes_practiced").notNull().default(0),
});

export const insertTutorDailyPracticeSchema = createInsertSchema(tutorDailyPracticeTable).omit({
  id: true,
});
export type InsertTutorDailyPractice = z.infer<typeof insertTutorDailyPracticeSchema>;
export type TutorDailyPractice = typeof tutorDailyPracticeTable.$inferSelect;
