import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const TRANSACTION_TYPES = [
  "charge",
  "escrow_release",
  "payout",
  "refund",
  "fee",
] as const;
export const TRANSACTION_STATUSES = ["pending", "succeeded", "failed"] as const;

/**
 * Append-only payments ledger. Rows are never updated or deleted; state
 * (escrow held / released / refunded) is derived from the rows of an order.
 * Money is integer USD cents. Ids are stored as text so the ledger does not
 * depend on the id type of users/orders.
 *
 * - charge:         userId = buyer, counterpartyId = seller, funds held in escrow
 * - escrow_release: userId = seller, amount = price - fee
 * - fee:            userId = null (platform), amount = fee
 * - refund:         userId = buyer, amount = price returned from escrow
 * - payout:         userId = seller, amount withdrawn from available balance
 */
export const transactionsTable = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: text("order_id"),
    userId: text("user_id"),
    counterpartyId: text("counterparty_id"),
    type: varchar("type", { length: 20 }).$type<(typeof TRANSACTION_TYPES)[number]>().notNull(),
    amountCents: integer("amount_cents").notNull(),
    feeCents: integer("fee_cents").notNull().default(0),
    status: varchar("status", { length: 16 })
      .$type<(typeof TRANSACTION_STATUSES)[number]>()
      .notNull()
      .default("succeeded"),
    provider: varchar("provider", { length: 32 }).notNull().default("mock"),
    providerRef: text("provider_ref"),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("transactions_idempotency_key_uq").on(t.idempotencyKey),
    // At most one charge / release / fee / refund per order.
    uniqueIndex("transactions_order_type_uq")
      .on(t.orderId, t.type)
      .where(sql`${t.type} <> 'payout' and ${t.orderId} is not null`),
    index("transactions_user_idx").on(t.userId, t.createdAt),
    index("transactions_order_idx").on(t.orderId),
  ],
);

export const insertTransactionSchema = createInsertSchema(transactionsTable, {
  amountCents: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true });

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;
