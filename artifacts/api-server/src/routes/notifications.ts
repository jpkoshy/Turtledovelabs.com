import { Router, type IRouter, type Request } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notificationsTable, favoritesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

/** Create a notification for a user. Never throws (best-effort side effect). */
export async function notify(userId: string, kind: string, body: string): Promise<void> {
  try {
    await db.insert(notificationsTable).values({ userId, kind, body });
  } catch (err) {
    console.error("notify failed", err);
  }
}

function uid(req: Request): string {
  return req.user!.id;
}

// NOTE: api-server has no direct zod dependency; validate ids by hand.
const idParam = {
  safeParse: (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 128
      ? { success: true as const, data: v }
      : { success: false as const },
};

router.get("/", requireAuth, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, uid(req)))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
  res.json(rows);
});

router.post("/read-all", requireAuth, async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, uid(req)), eq(notificationsTable.read, false)));
  res.json({ ok: true });
});

router.get("/favorites", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, uid(req)))
    .orderBy(desc(favoritesTable.createdAt));
  res.json(rows);
});

router.put("/favorites/:gigId", requireAuth, async (req, res) => {
  const p = idParam.safeParse(req.params.gigId);
  if (!p.success) return void res.status(400).json({ error: "Invalid gigId" });
  await db
    .insert(favoritesTable)
    .values({ userId: uid(req), gigId: p.data })
    .onConflictDoNothing();
  res.json({ userId: uid(req), gigId: p.data });
});

router.delete("/favorites/:gigId", requireAuth, async (req, res) => {
  const p = idParam.safeParse(req.params.gigId);
  if (!p.success) return void res.status(400).json({ error: "Invalid gigId" });
  await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, uid(req)), eq(favoritesTable.gigId, p.data)));
  res.status(204).end();
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const p = idParam.safeParse(req.params.id);
  if (!p.success) return void res.status(400).json({ error: "Invalid id" });
  const [row] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, p.data), eq(notificationsTable.userId, uid(req))))
    .returning();
  if (!row) return void res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
