import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import {
  PaymentError,
  getEscrowState,
  getSellerBalance,
  holdEscrow,
  listUserTransactions,
  refundEscrow,
  releaseEscrow,
  requestPayout,
} from "../lib/payments";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface AuthUser {
  id: string;
  role: "buyer" | "seller" | "admin";
}

/**
 * Resolve the authenticated user populated by the auth middleware (A1).
 * Accepts req.user or res.locals.user with {id, role}; anything else is 401.
 */
function authUser(req: Request, res: Response): AuthUser | null {
  const u = ((req as unknown as { user?: AuthUser }).user ?? res.locals.user) as AuthUser | undefined;
  if (!u || u.id == null) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return { id: String(u.id), role: u.role };
}

type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  price_cents: number;
  status: string;
};

/** Reads the orders table (owned by A4) with a parameterised query. */
async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const r = await db.execute<OrderRow>(sql`
    select id::text as id, buyer_id::text as buyer_id, seller_id::text as seller_id,
           price_cents::int as price_cents, status
    from orders where id::text = ${orderId} limit 1`);
  return r.rows[0] ?? null;
}

function fail(res: Response, e: unknown) {
  if (e instanceof PaymentError) return res.status(e.status).json({ error: e.message });
  logger.error({ err: e }, "payments route error");
  return res.status(500).json({ error: "Payment processing failed" });
}

const serialize = <T extends { providerRef?: unknown; metadata?: unknown }>(t: T) => {
  const { providerRef: _p, metadata: _m, ...rest } = t;
  return rest;
};

const chargeBody = z.object({
  orderId: z.string().min(1).max(64),
  paymentMethod: z.string().max(64).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

// Buyer pays; funds are held in escrow. Amount is taken from the order, never the client.
router.post("/charge", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const body = chargeBody.safeParse(req.body);
  if (!body.success) return void res.status(400).json({ error: "Invalid request", issues: body.error.issues });
  try {
    const order = await loadOrder(body.data.orderId);
    if (!order) return void res.status(404).json({ error: "Order not found" });
    if (order.buyer_id !== user.id) return void res.status(403).json({ error: "Only the buyer can pay for this order" });
    if (["cancelled", "completed"].includes(order.status)) return void res.status(409).json({ error: `Order is ${order.status}` });
    const tx = await holdEscrow({
      orderId: order.id,
      buyerId: order.buyer_id,
      sellerId: order.seller_id,
      priceCents: order.price_cents,
      paymentMethod: body.data.paymentMethod,
      idempotencyKey: body.data.idempotencyKey ? `charge:${order.id}:${body.data.idempotencyKey}` : undefined,
    });
    res.status(201).json(serialize(tx));
  } catch (e) {
    fail(res, e);
  }
});

// Buyer (accepting delivery) or admin releases escrow to the seller.
router.post("/release/:orderId", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  try {
    const order = await loadOrder(String(req.params.orderId));
    if (!order) return void res.status(404).json({ error: "Order not found" });
    if (order.buyer_id !== user.id && user.role !== "admin") return void res.status(403).json({ error: "Forbidden" });
    if (order.status !== "completed" && order.status !== "delivered" && user.role !== "admin") {
      return void res.status(409).json({ error: "Order must be delivered or completed to release funds" });
    }
    res.json(serialize(await releaseEscrow(order.id)));
  } catch (e) {
    fail(res, e);
  }
});

// Seller (cancelling) or admin refunds the buyer while funds are still escrowed.
router.post("/refund/:orderId", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const reason = z.object({ reason: z.string().max(500).optional() }).safeParse(req.body ?? {});
  try {
    const order = await loadOrder(String(req.params.orderId));
    if (!order) return void res.status(404).json({ error: "Order not found" });
    if (order.seller_id !== user.id && user.role !== "admin") return void res.status(403).json({ error: "Forbidden" });
    res.json(serialize(await refundEscrow(order.id, reason.success ? reason.data.reason : undefined)));
  } catch (e) {
    fail(res, e);
  }
});

router.get("/transactions", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const q = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }).safeParse(req.query);
  if (!q.success) return void res.status(400).json({ error: "Invalid query" });
  try {
    const rows = await listUserTransactions(user.id, q.data.limit, q.data.offset);
    res.json(rows.map(serialize));
  } catch (e) {
    fail(res, e);
  }
});

router.get("/balance", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  try {
    res.json(await getSellerBalance(user.id));
  } catch (e) {
    fail(res, e);
  }
});

router.get("/escrow/:orderId", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  try {
    const order = await loadOrder(String(req.params.orderId));
    if (!order) return void res.status(404).json({ error: "Order not found" });
    if (![order.buyer_id, order.seller_id].includes(user.id) && user.role !== "admin") return void res.status(403).json({ error: "Forbidden" });
    res.json({ orderId: order.id, state: await getEscrowState(order.id) });
  } catch (e) {
    fail(res, e);
  }
});

router.post("/payout", async (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const body = z.object({
    amountCents: z.number().int().positive(),
    idempotencyKey: z.string().min(1).max(128),
  }).safeParse(req.body);
  if (!body.success) return void res.status(400).json({ error: "Invalid request", issues: body.error.issues });
  try {
    res.status(201).json(serialize(await requestPayout(user.id, body.data.amountCents, body.data.idempotencyKey)));
  } catch (e) {
    fail(res, e);
  }
});

export default router;
