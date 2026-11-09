import { randomUUID } from "node:crypto";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One conversation per (participant pair, optional gig).
 * participantAId < participantBId (lexicographic) so the pair is canonical;
 * gigKey is the gig id or '' so the unique index also dedupes gig-less chats.
 * User/gig ids are plain text (no FK) to stay independent of other schemas.
 */
export const conversationsTable = pgTable(
  "conversations",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    participantAId: text("participant_a_id").notNull(),
    participantBId: text("participant_b_id").notNull(),
    gigId: text("gig_id"),
    gigKey: text("gig_key").notNull().default(""),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReadAtA: timestamp("last_read_at_a", { withTimezone: true }),
    lastReadAtB: timestamp("last_read_at_b", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_pair_gig_uq").on(
      t.participantAId,
      t.participantBId,
      t.gigKey,
    ),
    index("conversations_a_idx").on(t.participantAId, t.lastMessageAt),
    index("conversations_b_idx").on(t.participantBId, t.lastMessageAt),
  ],
);

export const messagesTable = pgTable(
  "messages",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_conv_created_idx").on(t.conversationId, t.createdAt, t.id),
  ],
);

export const MESSAGE_BODY_MAX = 5000;

export const insertMessageSchema = createInsertSchema(messagesTable, {
  body: z.string().trim().min(1).max(MESSAGE_BODY_MAX),
}).omit({ id: true, createdAt: true });

const idParam = z.string().min(1).max(100);

/** Request schemas live here so the api-server needs no direct zod dependency. */
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(MESSAGE_BODY_MAX),
});
export const createConversationSchema = z.object({
  recipientId: idParam,
  gigId: idParam.optional(),
});
export const messagePageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  /** return messages strictly newer than this message id (polling) */
  since: idParam.optional(),
  /** return messages strictly older than this message id (history paging) */
  before: idParam.optional(),
});
export const conversationIdSchema = idParam;

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
