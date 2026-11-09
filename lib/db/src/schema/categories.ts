import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable(
  "categories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    icon: text("icon").notNull().default("folder"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  createdAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CategoryRow = typeof categoriesTable.$inferSelect;
