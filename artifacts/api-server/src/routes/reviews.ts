import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, avg, count, isNull } from "drizzle-orm";
import {
  db,
  reviewsTable,
  ordersTable,
  gigsTable,
  createReviewBodySchema,
  replyReviewBodySchema,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function userIdOf(req: Request): string {
  return req.user!.id;
}

function toReview(r: typeof reviewsTable.$inferSelect) {
  return {
    id: r.id,
    orderId: r.orderId,
    gigId: r.gigId,
    buyerId: r.buyerId,
    rating: r.rating,
    comment: r.comment,
    sellerReply: r.sellerReply ?? undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (req: Request, res: Response) => {
  const gigId = typeof req.query.gigId === "string" ? req.query.gigId : "";
  if (!gigId) {
    res.status(400).json({ error: "gigId query parameter is required" });
    return;
  }
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.gigId, gigId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(200);
  res.json(rows.map(toReview));
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createReviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid review", details: parsed.error.issues });
    return;
  }
  const { orderId, rating, comment } = parsed.data;
  const userId = userIdOf(req);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) return { status: 404, error: "Order not found" } as const;
    if (order.buyerId !== userId) return { status: 403, error: "Only the buyer can review this order" } as const;
    if (order.status !== "completed") {
      return { status: 409, error: "Only completed orders can be reviewed" } as const;
    }
    const inserted = await tx
      .insert(reviewsTable)
      .values({ orderId, gigId: order.gigId, buyerId: userId, rating, comment })
      .onConflictDoNothing({ target: reviewsTable.orderId })
      .returning();
    if (inserted.length === 0) return { status: 409, error: "Order already reviewed" } as const;

    const [agg] = await tx
      .select({ avg: avg(reviewsTable.rating), n: count() })
      .from(reviewsTable)
      .where(eq(reviewsTable.gigId, order.gigId));
    const ratingAvg = Math.round(Number(agg?.avg ?? rating) * 100) / 100;
    await tx
      .update(gigsTable)
      .set({ ratingAvg, ratingCount: Number(agg?.n ?? 1) })
      .where(eq(gigsTable.id, order.gigId));
    return { status: 201, review: inserted[0]! } as const;
  });

  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(toReview(result.review));
});

router.post("/:id/reply", requireAuth, async (req: Request, res: Response) => {
  const parsed = replyReviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reply", details: parsed.error.issues });
    return;
  }
  const id = String(req.params.id);
  const userId = userIdOf(req);
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id)).limit(1);
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  const [gig] = await db.select().from(gigsTable).where(eq(gigsTable.id, review.gigId)).limit(1);
  if (!gig || gig.sellerId !== userId) {
    res.status(403).json({ error: "Only the seller of this gig can reply" });
    return;
  }
  // Conditional update guarantees a single reply even under concurrency.
  const updated = await db
    .update(reviewsTable)
    .set({ sellerReply: parsed.data.reply, sellerReplyAt: new Date() })
    .where(and(eq(reviewsTable.id, id), isNull(reviewsTable.sellerReply)))
    .returning();
  if (updated.length === 0) {
    res.status(409).json({ error: "Review already has a reply" });
    return;
  }
  res.json(toReview(updated[0]!));
});

export default router;
