import { EventEmitter } from "node:events";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  sendMessageSchema,
  createConversationSchema,
  messagePageQuerySchema,
  conversationIdSchema,
  type Conversation,
  type Message,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ---- helpers ---------------------------------------------------------------

function uid(req: Request): string {
  const u = (req as unknown as { user?: { id?: string } }).user;
  return String(u?.id ?? "");
}

const idParam = conversationIdSchema;

function shapeMessage(m: Message) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

function shapeConversation(
  c: Conversation,
  me: string,
  extra: { unreadCount?: number; lastMessage?: Message | null } = {},
) {
  return {
    id: c.id,
    participantIds: [c.participantAId, c.participantBId],
    gigId: c.gigId ?? undefined,
    lastMessageAt: c.lastMessageAt.toISOString(),
    unreadCount: extra.unreadCount ?? 0,
    lastMessage: extra.lastMessage ? shapeMessage(extra.lastMessage) : undefined,
    otherUserId: c.participantAId === me ? c.participantBId : c.participantAId,
  };
}

function isParticipant(c: Conversation, me: string): boolean {
  return c.participantAId === me || c.participantBId === me;
}

/** Loads a conversation the caller participates in; responds 404 otherwise. */
async function loadOwn(
  req: Request,
  res: Response,
): Promise<Conversation | null> {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return null;
  }
  const [c] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id.data))
    .limit(1);
  // 404 (not 403) so non-participants cannot probe for conversation ids.
  if (!c || !isParticipant(c, uid(req))) {
    res.status(404).json({ error: "Conversation not found" });
    return null;
  }
  return c;
}

// ---- live updates (in-process pub/sub; single-instance) --------------------

const bus = new EventEmitter();
bus.setMaxListeners(0);

// ---- routes ----------------------------------------------------------------

/** SSE: events "message" (new message) and "read" for the caller's conversations. */
router.get("/stream", requireAuth, (req, res) => {
  const me = uid(req);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 5000\n\n");
  const channel = `user:${me}`;
  const onEvent = (evt: { type: string; data: unknown }) => {
    res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
  };
  bus.on(channel, onEvent);
  const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
  req.on("close", () => {
    clearInterval(ping);
    bus.off(channel, onEvent);
  });
});

router.get("/conversations", requireAuth, async (req, res) => {
  const me = uid(req);
  const convs = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.participantAId, me),
        eq(conversationsTable.participantBId, me),
      ),
    )
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(200);

  const out = await Promise.all(
    convs.map(async (c) => {
      const myRead =
        c.participantAId === me ? c.lastReadAtA : c.lastReadAtB;
      const [last] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id))
        .limit(1);
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, c.id),
            ne(messagesTable.senderId, me),
            myRead ? gt(messagesTable.createdAt, myRead) : undefined,
          ),
        );
      return shapeConversation(c, me, { unreadCount: n, lastMessage: last });
    }),
  );
  res.json({ conversations: out });
});

const createConvBody = createConversationSchema;

router.post("/conversations", requireAuth, async (req, res) => {
  const me = uid(req);
  const parsed = createConvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }
  const { recipientId, gigId } = parsed.data;
  if (recipientId === me) {
    res.status(400).json({ error: "Cannot start a conversation with yourself" });
    return;
  }
  const [a, b] = me < recipientId ? [me, recipientId] : [recipientId, me];
  const gigKey = gigId ?? "";
  await db
    .insert(conversationsTable)
    .values({ participantAId: a, participantBId: b, gigId: gigId ?? null, gigKey })
    .onConflictDoNothing();
  const [c] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.participantAId, a),
        eq(conversationsTable.participantBId, b),
        eq(conversationsTable.gigKey, gigKey),
      ),
    )
    .limit(1);
  res.json({ conversation: shapeConversation(c, me) });
});

const pageQuery = messagePageQuerySchema;

router.get("/conversations/:id", requireAuth, async (req, res) => {
  const c = await loadOwn(req, res);
  if (!c) return;
  const q = pageQuery.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: "Invalid query", issues: q.error.issues });
    return;
  }
  const me = uid(req);
  const { limit, since, before } = q.data;

  const cursor = since ?? before;
  let cursorMsg: Message | undefined;
  if (cursor) {
    [cursorMsg] = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.id, cursor),
          eq(messagesTable.conversationId, c.id),
        ),
      )
      .limit(1);
    if (!cursorMsg) {
      res.status(400).json({ error: "Unknown cursor" });
      return;
    }
  }

  const after = (m: Message) =>
    or(
      gt(messagesTable.createdAt, m.createdAt),
      and(eq(messagesTable.createdAt, m.createdAt), gt(messagesTable.id, m.id)),
    );
  const older = (m: Message) =>
    or(
      lt(messagesTable.createdAt, m.createdAt),
      and(eq(messagesTable.createdAt, m.createdAt), lt(messagesTable.id, m.id)),
    );

  let rows: Message[];
  let hasMore: boolean;
  if (since && cursorMsg) {
    rows = await db
      .select()
      .from(messagesTable)
      .where(and(eq(messagesTable.conversationId, c.id), after(cursorMsg)))
      .orderBy(asc(messagesTable.createdAt), asc(messagesTable.id))
      .limit(limit + 1);
    hasMore = rows.length > limit;
    rows = rows.slice(0, limit);
  } else {
    // newest page (optionally older than `before`), returned oldest-first
    rows = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.conversationId, c.id),
          cursorMsg ? older(cursorMsg) : undefined,
        ),
      )
      .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id))
      .limit(limit + 1);
    hasMore = rows.length > limit;
    rows = rows.slice(0, limit).reverse();
  }

  res.json({
    conversation: shapeConversation(c, me),
    messages: rows.map(shapeMessage),
    hasMore,
  });
});

const sendBody = sendMessageSchema;

router.post("/conversations/:id", requireAuth, async (req, res) => {
  const c = await loadOwn(req, res);
  if (!c) return;
  const parsed = sendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message", issues: parsed.error.issues });
    return;
  }
  const me = uid(req);
  const msg = await db.transaction(async (tx) => {
    const [m] = await tx
      .insert(messagesTable)
      .values({ conversationId: c.id, senderId: me, body: parsed.data.body })
      .returning();
    await tx
      .update(conversationsTable)
      .set({
        lastMessageAt: m.createdAt,
        // sender has implicitly read everything up to their own message
        ...(c.participantAId === me
          ? { lastReadAtA: m.createdAt }
          : { lastReadAtB: m.createdAt }),
      })
      .where(eq(conversationsTable.id, c.id));
    return m;
  });
  const shaped = shapeMessage(msg);
  for (const p of [c.participantAId, c.participantBId]) {
    bus.emit(`user:${p}`, { type: "message", data: shaped });
  }
  res.status(201).json({ message: shaped });
});

router.post("/conversations/:id/read", requireAuth, async (req, res) => {
  const c = await loadOwn(req, res);
  if (!c) return;
  const me = uid(req);
  const now = new Date();
  await db
    .update(conversationsTable)
    .set(c.participantAId === me ? { lastReadAtA: now } : { lastReadAtB: now })
    .where(eq(conversationsTable.id, c.id));
  bus.emit(`user:${me}`, {
    type: "read",
    data: { conversationId: c.id, readAt: now.toISOString() },
  });
  res.json({ ok: true });
});

export default router;
