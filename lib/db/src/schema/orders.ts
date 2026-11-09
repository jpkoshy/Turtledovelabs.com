import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ORDER_TIERS = ["basic", "standard", "premium"] as const;
export const ORDER_STATUSES = [
  "pending",
  "active",
  "delivered",
  "revision",
  "completed",
  "cancelled",
  "disputed",
] as const;

export type OrderTier = (typeof ORDER_TIERS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Orders. gig/buyer/seller ids are plain text refs (no FK) to keep schema modules decoupled. */
export const ordersTable = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    gigId: text("gig_id").notNull(),
    buyerId: text("buyer_id").notNull(),
    sellerId: text("seller_id").notNull(),
    tier: text("tier").$type<OrderTier>().notNull(),
    priceCents: integer("price_cents").notNull(),
    feeCents: integer("fee_cents").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    requirements: text("requirements"),
    /** Snapshot of the purchased package at order time. */
    packageSnapshot: jsonb("package_snapshot").$type<{
      name: string;
      deliveryDays: number;
      revisions: number;
    }>(),
    revisionsAllowed: integer("revisions_allowed").notNull().default(0),
    revisionsUsed: integer("revisions_used").notNull().default(0),
    /** Status before a dispute was opened (so resolution can restore it). */
    statusBeforeDispute: text("status_before_dispute").$type<OrderStatus>(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_buyer_idx").on(t.buyerId),
    index("orders_seller_idx").on(t.sellerId),
    index("orders_gig_idx").on(t.gigId),
  ],
);

export const deliveriesTable = pgTable(
  "deliveries",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    orderId: text("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    files: jsonb("files").$type<string[]>().notNull().default([]),
    /** Buyer revision request that followed this delivery, if any. */
    revisionNote: text("revision_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("deliveries_order_idx").on(t.orderId)],
);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({
  id: true,
  createdAt: true,
});

export type OrderRow = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type DeliveryRow = typeof deliveriesTable.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

// ---- Request validation schemas ----
export const createOrderBodySchema = z.object({
  gigId: z.string().min(1).max(100),
  tier: z.enum(ORDER_TIERS),
  requirements: z.string().trim().max(5000).optional(),
});
export const deliverOrderBodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
  files: z.array(z.string().trim().min(1).max(2000)).max(20).default([]),
});
export const revisionOrderBodySchema = z.object({
  note: z.string().trim().min(1).max(5000),
});
export const listOrdersQuerySchema = z.object({
  as: z.enum(["buyer", "seller"]).default("buyer"),
});
