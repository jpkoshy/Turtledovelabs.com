import { pgTable, text, integer, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const REVIEW_COMMENT_MAX = 2000;
export const REVIEW_REPLY_MAX = 1000;

export const reviewsTable = pgTable(
  "reviews",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id").notNull(),
    gigId: text("gig_id").notNull(),
    buyerId: text("buyer_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    sellerReply: text("seller_reply"),
    sellerReplyAt: timestamp("seller_reply_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_order_uidx").on(t.orderId),
    index("reviews_gig_created_idx").on(t.gigId, t.createdAt),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export const insertReviewSchema = createInsertSchema(reviewsTable, {
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX),
}).omit({ id: true, sellerReply: true, sellerReplyAt: true, createdAt: true });

/** Request body for POST /reviews (buyerId comes from the session). */
export const createReviewBodySchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX).default(""),
});

/** Request body for POST /reviews/:id/reply. */
export const replyReviewBodySchema = z.object({
  reply: z.string().trim().min(1).max(REVIEW_REPLY_MAX),
});

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
