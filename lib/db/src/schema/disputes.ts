import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const DISPUTE_STATUSES = ["open", "resolved_buyer", "resolved_seller"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

/** Disputes. Ids are plain text refs (no FK) to keep schema modules decoupled. */
export const disputesTable = pgTable(
  "disputes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    orderId: text("order_id").notNull(),
    openedBy: text("opened_by").notNull(),
    reason: text("reason").notNull(),
    status: text("status").$type<DisputeStatus>().notNull().default("open"),
    resolution: text("resolution"),
    resolvedBy: text("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("disputes_order_idx").on(t.orderId),
    index("disputes_opened_by_idx").on(t.openedBy),
    // at most one open dispute per order
    uniqueIndex("disputes_open_order_uq").on(t.orderId).where(sql`${t.status} = 'open'`),
  ],
);

/** Append-only audit trail of every admin action. */
export const adminAuditTable = pgTable(
  "admin_audit",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    adminId: text("admin_id").notNull(),
    action: text("action").notNull(), // e.g. gig.moderate, user.suspend, dispute.resolve
    targetType: text("target_type").notNull(), // gig | user | dispute
    targetId: text("target_id").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("admin_audit_admin_idx").on(t.adminId, t.createdAt),
    index("admin_audit_target_idx").on(t.targetType, t.targetId),
  ],
);

/** User suspensions (users table has no status column). Active = liftedAt is null. */
export const userSuspensionsTable = pgTable(
  "user_suspensions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id").notNull(),
    reason: text("reason").notNull(),
    suspendedBy: text("suspended_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    liftedAt: timestamp("lifted_at", { withTimezone: true }),
  },
  (t) => [index("user_suspensions_user_idx").on(t.userId)],
);

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({
  id: true,
  createdAt: true,
});
export type DisputeRow = typeof disputesTable.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type AdminAuditRow = typeof adminAuditTable.$inferSelect;
export type UserSuspensionRow = typeof userSuspensionsTable.$inferSelect;

// ---- Request validation schemas ----
export const createDisputeBodySchema = z.object({
  orderId: z.string().min(1).max(100),
  reason: z.string().trim().min(10).max(5000),
});
export const resolveDisputeBodySchema = z.object({
  outcome: z.enum(["buyer", "seller"]),
  resolution: z.string().trim().min(1).max(5000),
});
export const adminGigsQuerySchema = z.object({
  status: z.enum(["draft", "active", "paused", "rejected"]).default("draft"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export const moderateGigBodySchema = z.object({
  action: z.enum(["approve", "reject", "pause"]),
  note: z.string().trim().max(2000).optional(),
});
export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["buyer", "seller", "admin"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export const suspendUserBodySchema = z.object({
  suspended: z.boolean().default(true),
  reason: z.string().trim().min(1).max(2000),
});
