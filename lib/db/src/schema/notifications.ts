import { pgTable, text, boolean, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_created_idx").on(t.userId, t.createdAt)],
);

export const favoritesTable = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    gigId: text("gig_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.gigId] }), index("favorites_user_idx").on(t.userId)],
);

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  read: true,
  createdAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({ createdAt: true });

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Favorite = typeof favoritesTable.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
