/**
 * Disputes API (mounted at /api/disputes). All routes require auth.
 *   POST /                 {orderId, reason}  buyer|seller of an active/delivered/revision order -> order "disputed"
 *   GET  /                 own disputes (as opener or order participant); admin sees all (?status=open)
 *   GET  /:id              participant or admin
 *   POST /:id/resolve      admin: {outcome: "buyer"|"seller", resolution} -> refund buyer or release to seller
 */
import { Router, type IRouter } from "express";
import { and, desc, eq, or, inArray, type SQL } from "drizzle-orm";
import {
  db,
  adminAuditTable,
  disputesTable,
  ordersTable,
  createDisputeBodySchema,
  resolveDisputeBodySchema,
  DISPUTE_STATUSES,
  type DisputeRow,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { markOrderDisputed, resolveOrderDispute } from "./orders";
import { refundEscrow, releaseEscrow } from "../lib/payments";
import { logger } from "../lib/logger";

const router: IRouter = Router();

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const parsed = createDisputeBodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues.map((i) => i.message).join("; "));
    const { orderId, reason } = parsed.data;
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) {
      throw new HttpError(404, "Order not found");
    }
    if (!["active", "delivered", "revision"].includes(order.status)) {
      throw new HttpError(409, `Cannot dispute an order that is ${order.status}`);
    }
    const [existing] = await db
      .select({ id: disputesTable.id })
      .from(disputesTable)
      .where(and(eq(disputesTable.orderId, orderId), eq(disputesTable.status, "open")))
      .limit(1);
    if (existing) throw new HttpError(409, "A dispute is already open for this order");

    let dispute: DisputeRow;
    try {
      [dispute] = await db
        .insert(disputesTable)
        .values({ orderId, openedBy: user.id, reason })
        .returning() as [DisputeRow];
    } catch {
      throw new HttpError(409, "A dispute is already open for this order");
    }
    try {
      await markOrderDisputed(orderId);
    } catch (e) {
      // roll back the dispute row so the order and dispute stay consistent
      await db.delete(disputesTable).where(eq(disputesTable.id, dispute.id));
      throw new HttpError(409, e instanceof Error ? e.message : "Order cannot be disputed");
    }
    res.status(201).json({ dispute });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const conds: SQL[] = [];
    const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;
    if (status && (DISPUTE_STATUSES as readonly string[]).includes(status)) {
      conds.push(eq(disputesTable.status, status as (typeof DISPUTE_STATUSES)[number]));
    }
    if (user.role !== "admin") {
      const mine = await db
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(or(eq(ordersTable.buyerId, user.id), eq(ordersTable.sellerId, user.id)));
      const ids = mine.map((o) => o.id);
      conds.push(
        ids.length
          ? or(eq(disputesTable.openedBy, user.id), inArray(disputesTable.orderId, ids))!
          : eq(disputesTable.openedBy, user.id),
      );
    }
    const disputes = await db
      .select()
      .from(disputesTable)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(disputesTable.createdAt))
      .limit(200);
    res.json({ disputes });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const [dispute] = await db.select().from(disputesTable).where(eq(disputesTable.id, String(req.params["id"]))).limit(1);
    if (!dispute) throw new HttpError(404, "Dispute not found");
    if (user.role !== "admin") {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, dispute.orderId)).limit(1);
      if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) {
        throw new HttpError(404, "Dispute not found");
      }
    }
    res.json({ dispute });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/resolve", requireRole("admin"), async (req, res, next) => {
  try {
    const admin = req.user!;
    const parsed = resolveDisputeBodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues.map((i) => i.message).join("; "));
    const { outcome, resolution } = parsed.data;
    const id = String(req.params["id"]);

    // Atomically claim the dispute so concurrent resolves cannot double-settle.
    const [dispute] = await db
      .update(disputesTable)
      .set({
        status: outcome === "buyer" ? "resolved_buyer" : "resolved_seller",
        resolution,
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      })
      .where(and(eq(disputesTable.id, id), eq(disputesTable.status, "open")))
      .returning();
    if (!dispute) {
      const [ex] = await db.select({ id: disputesTable.id }).from(disputesTable).where(eq(disputesTable.id, id)).limit(1);
      throw new HttpError(ex ? 409 : 404, ex ? "Dispute already resolved" : "Dispute not found");
    }

    let settlement: "settled" | "failed" = "settled";
    try {
      await resolveOrderDispute(dispute.orderId, outcome);
    } catch (e) {
      logger.error({ err: e, disputeId: id }, "dispute: order transition failed");
      settlement = "failed";
    }
    try {
      if (outcome === "buyer") await refundEscrow(dispute.orderId, `dispute:${id}`);
      else await releaseEscrow(dispute.orderId);
    } catch (e) {
      // Idempotent calls; payments may also react to order events. Log for manual follow-up.
      logger.error({ err: e, disputeId: id }, "dispute: escrow settlement failed");
      settlement = "failed";
    }
    await db.insert(adminAuditTable).values({
      adminId: admin.id,
      action: "dispute.resolve",
      targetType: "dispute",
      targetId: id,
      details: { orderId: dispute.orderId, outcome, resolution, settlement },
    });
    res.json({ dispute, settlement });
  } catch (err) {
    next(err);
  }
});

router.use((err: unknown, _req: unknown, res: import("express").Response, next: import("express").NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
});

export default router;
