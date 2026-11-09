/**
 * Orders lifecycle API (mounted at /api/orders).
 *
 * State machine:
 *   pending --activateOrder()--> active --deliver--> delivered --complete--> completed
 *                                  ^                    |
 *                                  +---- revision <-----+ (buyer /revision, limited by package.revisions)
 *   revision --deliver--> delivered
 *   pending: buyer|seller|admin may cancel; active: seller|admin may cancel, buyer only once past dueAt;
 *   delivered/revision/completed/cancelled/disputed cannot be cancelled here (use disputes).
 *
 * Routes (all require auth; responses are `{ order }` / `{ orders }`):
 *   POST /           {gigId, tier, requirements?}  buyer; price+fee computed server-side (20%)
 *   GET  /?as=buyer|seller
 *   GET  /:id        buyer, seller or admin
 *   POST /:id/deliver   {message, files?}  seller
 *   POST /:id/revision  {note}             buyer
 *   POST /:id/complete                     buyer (admin)
 *   POST /:id/cancel                       see rules above
 *
 * ---- Integration hooks for other modules (A7 payments, A8 disputes, A9 notifications) ----
 *   import { orderEvents, activateOrder, markOrderDisputed, resolveOrderDispute } from "./orders";
 *   orderEvents.on("created" | "activated" | "delivered" | "revision_requested"
 *                  | "completed" | "cancelled" | "disputed", ({ order, actorId, previousStatus }) => ...)
 *   Listeners run after the DB write; errors/rejections in listeners are logged, never thrown.
 *   - activateOrder(orderId): called by payments once the charge succeeds (pending -> active, resets dueAt).
 *   - markOrderDisputed(orderId) / resolveOrderDispute(orderId, "buyer"|"seller"): for disputes.
 *       buyer -> cancelled (refund), seller -> completed.
 *   - getOrderById(id), toOrderDto(row, deliveries) are also exported.
 *   Payments should listen for "completed" (escrow release) and "cancelled" (refund).
 */
import { EventEmitter } from "node:events";
import { Router, type IRouter } from "express";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import {
  db,
  deliveriesTable,
  gigsTable,
  ordersTable,
  createOrderBodySchema,
  deliverOrderBodySchema,
  revisionOrderBodySchema,
  listOrdersQuerySchema,
  type DeliveryRow,
  type OrderRow,
  type OrderStatus,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

export const PLATFORM_FEE_RATE = 0.2;

// ---------- events ----------
export type OrderEventName =
  | "created"
  | "activated"
  | "delivered"
  | "revision_requested"
  | "completed"
  | "cancelled"
  | "disputed";

export interface OrderEvent {
  order: OrderRow;
  /** User who triggered it; null for system actions (e.g. payment webhooks). */
  actorId: string | null;
  previousStatus: OrderStatus | null;
}

class OrderEvents {
  private emitter = new EventEmitter();
  on(name: OrderEventName, fn: (e: OrderEvent) => void | Promise<void>): () => void {
    this.emitter.on(name, fn);
    return () => this.emitter.off(name, fn);
  }
  emit(name: OrderEventName, e: OrderEvent): void {
    for (const fn of this.emitter.listeners(name) as Array<
      (e: OrderEvent) => void | Promise<void>
    >) {
      try {
        const r = fn(e);
        if (r && typeof r.catch === "function") {
          r.catch((err) => logger.error({ err, name }, "orderEvents listener failed"));
        }
      } catch (err) {
        logger.error({ err, name }, "orderEvents listener failed");
      }
    }
  }
}
export const orderEvents = new OrderEvents();

// ---------- helpers ----------
export interface OrderDto {
  id: string;
  gigId: string;
  buyerId: string;
  sellerId: string;
  tier: OrderRow["tier"];
  priceCents: number;
  feeCents: number;
  status: OrderStatus;
  requirements?: string;
  revisionsAllowed: number;
  revisionsUsed: number;
  deliveries: Array<{
    id: string;
    message: string;
    files: string[];
    revisionNote?: string;
    createdAt: string;
  }>;
  dueAt: string;
  createdAt: string;
}

export function toOrderDto(o: OrderRow, deliveries: DeliveryRow[] = []): OrderDto {
  return {
    id: o.id,
    gigId: o.gigId,
    buyerId: o.buyerId,
    sellerId: o.sellerId,
    tier: o.tier,
    priceCents: o.priceCents,
    feeCents: o.feeCents,
    status: o.status,
    ...(o.requirements ? { requirements: o.requirements } : {}),
    revisionsAllowed: o.revisionsAllowed,
    revisionsUsed: o.revisionsUsed,
    deliveries: deliveries.map((d) => ({
      id: d.id,
      message: d.message,
      files: d.files,
      ...(d.revisionNote ? { revisionNote: d.revisionNote } : {}),
      createdAt: d.createdAt.toISOString(),
    })),
    dueAt: o.dueAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
  };
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  return row ?? null;
}

async function loadDeliveries(orderIds: string[]): Promise<Map<string, DeliveryRow[]>> {
  const map = new Map<string, DeliveryRow[]>();
  if (orderIds.length === 0) return map;
  const rows = await db
    .select()
    .from(deliveriesTable)
    .where(inArray(deliveriesTable.orderId, orderIds))
    .orderBy(asc(deliveriesTable.createdAt));
  for (const r of rows) {
    const list = map.get(r.orderId) ?? [];
    list.push(r);
    map.set(r.orderId, list);
  }
  return map;
}

async function respondWithOrder(order: OrderRow): Promise<OrderDto> {
  const d = await loadDeliveries([order.id]);
  return toOrderDto(order, d.get(order.id) ?? []);
}

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Atomic status transition: only succeeds if the row is still in one of `from`. */
async function transition(
  id: string,
  from: OrderStatus[],
  set: Partial<typeof ordersTable.$inferInsert>,
  extraWhere?: ReturnType<typeof and>,
): Promise<OrderRow> {
  const [row] = await db
    .update(ordersTable)
    .set({ ...set, updatedAt: new Date() })
    .where(and(eq(ordersTable.id, id), inArray(ordersTable.status, from), extraWhere))
    .returning();
  if (!row) throw new HttpError(409, "Order is not in a state that allows this action");
  return row;
}

// ---------- system hooks (payments / disputes) ----------
export async function activateOrder(orderId: string): Promise<OrderRow> {
  const cur = await getOrderById(orderId);
  if (!cur) throw new HttpError(404, "Order not found");
  const now = new Date();
  const days = cur.packageSnapshot?.deliveryDays ?? 1;
  const row = await transition(orderId, ["pending"], {
    status: "active",
    dueAt: addDays(now, days),
  });
  orderEvents.emit("activated", { order: row, actorId: null, previousStatus: "pending" });
  return row;
}

export async function markOrderDisputed(orderId: string): Promise<OrderRow> {
  const cur = await getOrderById(orderId);
  if (!cur) throw new HttpError(404, "Order not found");
  const row = await transition(orderId, ["active", "delivered", "revision"], {
    status: "disputed",
    statusBeforeDispute: cur.status,
  });
  orderEvents.emit("disputed", { order: row, actorId: null, previousStatus: cur.status });
  return row;
}

export async function resolveOrderDispute(
  orderId: string,
  winner: "buyer" | "seller",
): Promise<OrderRow> {
  const next: OrderStatus = winner === "buyer" ? "cancelled" : "completed";
  const row = await transition(orderId, ["disputed"], { status: next });
  orderEvents.emit(next === "cancelled" ? "cancelled" : "completed", {
    order: row,
    actorId: null,
    previousStatus: "disputed",
  });
  return row;
}

// ---------- routes ----------
const router: IRouter = Router();
router.use(requireAuth);

function parse<S extends { safeParse(d: unknown): any }>(
  schema: S,
  data: unknown,
): NonNullable<ReturnType<S["safeParse"]>["data"]> {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues.map((i: { message: string }) => i.message).join("; "));
  return r.data;
}

async function loadFor(id: string, userId: string, isAdmin: boolean): Promise<OrderRow> {
  const o = await getOrderById(id);
  // Non-participants get 404 to avoid leaking existence.
  if (!o || (!isAdmin && o.buyerId !== userId && o.sellerId !== userId)) {
    throw new HttpError(404, "Order not found");
  }
  return o;
}

function wrap(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>,
): import("express").RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch((err) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else {
        next(err);
      }
    });
  };
}

router.post(
  "/",
  wrap(async (req, res) => {
    const user = req.user!;
    const body = parse(createOrderBodySchema, req.body);
    const [gig] = await db.select().from(gigsTable).where(eq(gigsTable.id, body.gigId)).limit(1);
    if (!gig || gig.status !== "active") throw new HttpError(404, "Gig not found");
    if (gig.sellerId === user.id) throw new HttpError(403, "You cannot order your own gig");
    const pkg = gig.packages.find((p) => p.tier === body.tier);
    if (!pkg) throw new HttpError(400, "Package not available");
    // Never trust client price: derive from the stored package.
    const priceCents = pkg.priceCents;
    const feeCents = Math.round(priceCents * PLATFORM_FEE_RATE);
    const [row] = await db
      .insert(ordersTable)
      .values({
        gigId: gig.id,
        buyerId: user.id,
        sellerId: gig.sellerId,
        tier: pkg.tier,
        priceCents,
        feeCents,
        status: "pending",
        requirements: body.requirements ?? null,
        packageSnapshot: {
          name: pkg.name,
          deliveryDays: pkg.deliveryDays,
          revisions: pkg.revisions,
        },
        revisionsAllowed: pkg.revisions,
        dueAt: addDays(new Date(), pkg.deliveryDays),
      })
      .returning();
    orderEvents.emit("created", { order: row!, actorId: user.id, previousStatus: null });
    res.status(201).json({ order: await respondWithOrder(row!) });
  }),
);

router.get(
  "/",
  wrap(async (req, res) => {
    const user = req.user!;
    const { as } = parse(listOrdersQuerySchema, req.query);
    const col = as === "seller" ? ordersTable.sellerId : ordersTable.buyerId;
    const rows = await db
      .select()
      .from(ordersTable)
      .where(eq(col, user.id))
      .orderBy(desc(ordersTable.createdAt))
      .limit(500);
    const d = await loadDeliveries(rows.map((r) => r.id));
    res.json({ orders: rows.map((r) => toOrderDto(r, d.get(r.id) ?? [])) });
  }),
);

router.get(
  "/:id",
  wrap(async (req, res) => {
    const o = await loadFor(String(req.params["id"]), req.user!.id, req.user!.role === "admin");
    res.json({ order: await respondWithOrder(o) });
  }),
);

router.post(
  "/:id/deliver",
  wrap(async (req, res) => {
    const user = req.user!;
    const body = parse(deliverOrderBodySchema, req.body);
    const o = await loadFor(String(req.params["id"]), user.id, false);
    if (o.sellerId !== user.id) throw new HttpError(403, "Only the seller can deliver");
    const row = await transition(o.id, ["active", "revision"], { status: "delivered" });
    // A revision request is attached to the latest delivery; this new one answers it.
    await db.insert(deliveriesTable).values({ orderId: o.id, message: body.message, files: body.files });
    orderEvents.emit("delivered", { order: row, actorId: user.id, previousStatus: o.status });
    res.json({ order: await respondWithOrder(row) });
  }),
);

router.post(
  "/:id/revision",
  wrap(async (req, res) => {
    const user = req.user!;
    const body = parse(revisionOrderBodySchema, req.body);
    const o = await loadFor(String(req.params["id"]), user.id, false);
    if (o.buyerId !== user.id) throw new HttpError(403, "Only the buyer can request a revision");
    if (o.status === "delivered" && o.revisionsUsed >= o.revisionsAllowed) {
      throw new HttpError(409, "No revisions remaining for this package");
    }
    const row = await transition(
      o.id,
      ["delivered"],
      { status: "revision", revisionsUsed: sql`${ordersTable.revisionsUsed} + 1` as unknown as number },
      lt(ordersTable.revisionsUsed, ordersTable.revisionsAllowed),
    );
    const [latest] = await db
      .select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.orderId, o.id))
      .orderBy(desc(deliveriesTable.createdAt))
      .limit(1);
    if (latest) {
      await db
        .update(deliveriesTable)
        .set({ revisionNote: body.note })
        .where(eq(deliveriesTable.id, latest.id));
    }
    orderEvents.emit("revision_requested", { order: row, actorId: user.id, previousStatus: "delivered" });
    res.json({ order: await respondWithOrder(row) });
  }),
);

router.post(
  "/:id/complete",
  wrap(async (req, res) => {
    const user = req.user!;
    const isAdmin = user.role === "admin";
    const o = await loadFor(String(req.params["id"]), user.id, isAdmin);
    if (o.buyerId !== user.id && !isAdmin) throw new HttpError(403, "Only the buyer can complete an order");
    const row = await transition(o.id, ["delivered"], { status: "completed" });
    orderEvents.emit("completed", { order: row, actorId: user.id, previousStatus: "delivered" });
    res.json({ order: await respondWithOrder(row) });
  }),
);

router.post(
  "/:id/cancel",
  wrap(async (req, res) => {
    const user = req.user!;
    const isAdmin = user.role === "admin";
    const o = await loadFor(String(req.params["id"]), user.id, isAdmin);
    const isBuyer = o.buyerId === user.id;
    const isSeller = o.sellerId === user.id;
    if (!isAdmin && !isBuyer && !isSeller) throw new HttpError(403, "Forbidden");
    let from: OrderStatus[];
    let extra: ReturnType<typeof and> | undefined;
    if (isAdmin || o.status === "pending") {
      from = isAdmin ? ["pending", "active", "delivered", "revision"] : ["pending"];
    } else if (isSeller) {
      from = ["active"];
    } else {
      // Buyer may cancel an active order only if the seller missed the deadline.
      from = ["active"];
      extra = lt(ordersTable.dueAt, new Date());
      if (o.status === "active" && o.dueAt.getTime() >= Date.now()) {
        throw new HttpError(409, "Order is not overdue yet; ask the seller to cancel or open a dispute");
      }
    }
    const row = await transition(o.id, from, { status: "cancelled" }, extra);
    orderEvents.emit("cancelled", { order: row, actorId: user.id, previousStatus: o.status });
    res.json({ order: await respondWithOrder(row) });
  }),
);

export default router;
