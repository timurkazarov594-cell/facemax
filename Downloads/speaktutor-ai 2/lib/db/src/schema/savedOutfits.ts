import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedOutfitsTable = pgTable("saved_outfits", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  quizAnswers: jsonb("quiz_answers").notNull(),
  outfitResult: jsonb("outfit_result").notNull(),
  label: text("label"),
});

export const insertSavedOutfitSchema = createInsertSchema(savedOutfitsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedOutfit = z.infer<typeof insertSavedOutfitSchema>;
export type SavedOutfit = typeof savedOutfitsTable.$inferSelect;
