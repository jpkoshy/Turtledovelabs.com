import {
  pgTable,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const GIG_STATUSES = ["draft", "active", "paused", "rejected"] as const;
export const PACKAGE_TIERS = ["basic", "standard", "premium"] as const;

export const packageSchema = z.object({
  tier: z.enum(PACKAGE_TIERS),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(1000),
  priceCents: z.number().int().positive().max(100_000_000),
  deliveryDays: z.number().int().positive().max(365),
  revisions: z.number().int().min(0).max(100),
  features: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
});
export type GigPackage = z.infer<typeof packageSchema>;

/** Exactly 3 packages, one per tier. */
export const packagesSchema = z
  .array(packageSchema)
  .length(3)
  .refine(
    (p) => new Set(p.map((x) => x.tier)).size === 3,
    "Packages must be exactly basic, standard and premium",
  );

export const faqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
});
export type GigFaq = z.infer<typeof faqSchema>;

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens");

export const createGigSchema = z.object({
  categoryId: z.string().min(1),
  slug: slugSchema.optional(),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(8000),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  images: z.array(z.string().trim().min(1).max(2000)).max(10).default([]),
  status: z.enum(GIG_STATUSES).optional(),
  packages: packagesSchema,
  faqs: z.array(faqSchema).max(20).default([]),
});
export type CreateGigInput = z.infer<typeof createGigSchema>;

export const updateGigSchema = createGigSchema.partial();
export type UpdateGigInput = z.infer<typeof updateGigSchema>;

export const gigsTable = pgTable(
  "gigs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sellerId: text("seller_id").notNull(),
    categoryId: text("category_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    status: text("status", { enum: GIG_STATUSES }).notNull().default("draft"),
    ratingAvg: real("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    ordersCompleted: integer("orders_completed").notNull().default(0),
    packages: jsonb("packages").$type<GigPackage[]>().notNull(),
    faqs: jsonb("faqs").$type<GigFaq[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("gigs_slug_unique").on(t.slug),
    index("gigs_seller_idx").on(t.sellerId),
    index("gigs_category_idx").on(t.categoryId),
    index("gigs_status_idx").on(t.status),
  ],
);

export type GigRow = typeof gigsTable.$inferSelect;
export type InsertGig = typeof gigsTable.$inferInsert;
