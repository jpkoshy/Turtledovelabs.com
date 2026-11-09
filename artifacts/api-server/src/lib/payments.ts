/**
 * Payments: provider abstraction + ledger helpers.
 *
 * Money is integer USD cents. Platform fee is 20% of the order price.
 * Provider is selected by env PAYMENT_PROVIDER ("mock" default, "stripe").
 * No keys live in code; the Stripe adapter reads STRIPE_SECRET_KEY from env.
 *
 * Helpers for the orders router (A4):
 *   holdEscrow({orderId, buyerId, sellerId, priceCents})   on order creation
 *   releaseEscrow(orderId, actor?)                         on completion
 *   refundEscrow(orderId, actor?)                          on cancel / dispute-for-buyer
 *   requestPayout(sellerId, amountCents, idempotencyKey)
 * All are idempotent (safe to retry) and write the append-only ledger.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, transactionsTable, type Transaction } from "@workspace/db";

export const PLATFORM_FEE_RATE = 0.2;

export function computeFeeCents(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE_RATE);
}

// ---------------------------------------------------------------- providers

export interface ProviderResult {
  ref: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Authorise + capture the buyer's payment into platform escrow. */
  charge(a: { amountCents: number; orderId: string; buyerId: string; idempotencyKey: string; paymentMethod?: string }): Promise<ProviderResult>;
  /** Mark escrowed funds as owed to the seller (net of fee). */
  release(a: { amountCents: number; orderId: string; sellerId: string; idempotencyKey: string; chargeRef?: string | null }): Promise<ProviderResult>;
  /** Return escrowed funds to the buyer. */
  refund(a: { amountCents: number; orderId: string; chargeRef?: string | null; idempotencyKey: string }): Promise<ProviderResult>;
  /** Send available seller balance to the seller's bank. */
  payout(a: { amountCents: number; sellerId: string; idempotencyKey: string }): Promise<ProviderResult>;
}

/** Default provider: moves no real money, returns fake references. */
export class MockProvider implements PaymentProvider {
  readonly name = "mock";
  private ref(kind: string) {
    return `mock_${kind}_${randomUUID()}`;
  }
  async charge() { return { ref: this.ref("ch") }; }
  async release() { return { ref: this.ref("rel") }; }
  async refund() { return { ref: this.ref("re") }; }
  async payout() { return { ref: this.ref("po") }; }
}

/**
 * Stripe adapter SKELETON (not wired to the SDK; no dependency added).
 * Intended mapping when implemented with the `stripe` package and
 * STRIPE_SECRET_KEY from the environment:
 *  - charge  -> PaymentIntent (capture_method automatic, transfer_group = orderId),
 *               passing idempotencyKey as the Stripe `Idempotency-Key`.
 *  - release -> Transfer to the seller's connected account (amount = price - fee,
 *               source_transaction = chargeRef, transfer_group = orderId).
 *  - refund  -> Refund on the PaymentIntent in chargeRef.
 *  - payout  -> Payout on the seller's connected account.
 * Never log or persist card data; the client tokenises via Stripe Elements.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  constructor(private readonly secretKey: string) {}
  private notImplemented(op: string): never {
    throw new Error(`StripeProvider.${op} is not implemented yet (see docs in lib/payments.ts)`);
  }
  async charge(): Promise<ProviderResult> { return this.notImplemented("charge"); }
  async release(): Promise<ProviderResult> { return this.notImplemented("release"); }
  async refund(): Promise<ProviderResult> { return this.notImplemented("refund"); }
  async payout(): Promise<ProviderResult> { return this.notImplemented("payout"); }
}

let cached: PaymentProvider | undefined;
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const which = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (which === "stripe") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY");
    cached = new StripeProvider(key);
  } else {
    cached = new MockProvider();
  }
  return cached;
}
/** Test hook. */
export function setPaymentProvider(p: PaymentProvider | undefined) {
  cached = p;
}

// ------------------------------------------------------------------- errors

export class PaymentError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// ------------------------------------------------------------------- ledger

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockOrder(tx: Tx, orderId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"payments:" + orderId}))`);
}

async function orderRows(tx: Tx | typeof db, orderId: string): Promise<Transaction[]> {
  return tx.select().from(transactionsTable).where(eq(transactionsTable.orderId, orderId));
}

export type EscrowState = "none" | "held" | "released" | "refunded";

export function escrowStateOf(rows: Transaction[]): EscrowState {
  const ok = rows.filter((r) => r.status === "succeeded");
  if (ok.some((r) => r.type === "refund")) return "refunded";
  if (ok.some((r) => r.type === "escrow_release")) return "released";
  if (ok.some((r) => r.type === "charge")) return "held";
  return "none";
}

export async function getEscrowState(orderId: string): Promise<EscrowState> {
  return escrowStateOf(await orderRows(db, orderId));
}

export interface HoldEscrowInput {
  orderId: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  paymentMethod?: string;
  idempotencyKey?: string;
}

/** Charge the buyer and hold funds in escrow. Idempotent per order. */
export async function holdEscrow(input: HoldEscrowInput): Promise<Transaction> {
  const { orderId, buyerId, sellerId, priceCents } = input;
  if (!Number.isInteger(priceCents) || priceCents <= 0) throw new PaymentError(400, "Invalid amount");
  const key = input.idempotencyKey ?? `charge:${orderId}`;
  return db.transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const rows = await orderRows(tx, orderId);
    const existing = rows.find((r) => r.type === "charge" && r.status === "succeeded");
    if (existing) return existing;
    const dup = await tx.select().from(transactionsTable).where(eq(transactionsTable.idempotencyKey, key));
    if (dup[0]) return dup[0];
    const provider = getPaymentProvider();
    // Provider call inside the order lock so concurrent retries cannot double charge.
    const res = await provider.charge({ amountCents: priceCents, orderId, buyerId, idempotencyKey: key, paymentMethod: input.paymentMethod });
    const [row] = await tx
      .insert(transactionsTable)
      .values({
        orderId, userId: buyerId, counterpartyId: sellerId, type: "charge",
        amountCents: priceCents, feeCents: computeFeeCents(priceCents),
        status: "succeeded", provider: provider.name, providerRef: res.ref, idempotencyKey: key,
      })
      .returning();
    return row!;
  });
}

/** Release escrow: seller is credited price - fee, platform books the fee. Idempotent. */
export async function releaseEscrow(orderId: string): Promise<Transaction> {
  return db.transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const rows = await orderRows(tx, orderId);
    const done = rows.find((r) => r.type === "escrow_release" && r.status === "succeeded");
    if (done) return done;
    const charge = rows.find((r) => r.type === "charge" && r.status === "succeeded");
    if (!charge) throw new PaymentError(409, "No escrowed funds for this order");
    if (rows.some((r) => r.type === "refund" && r.status === "succeeded")) {
      throw new PaymentError(409, "Order was already refunded");
    }
    const fee = charge.feeCents;
    const net = charge.amountCents - fee;
    const sellerId = charge.counterpartyId!;
    const provider = getPaymentProvider();
    const res = await provider.release({ amountCents: net, orderId, sellerId, idempotencyKey: `release:${orderId}`, chargeRef: charge.providerRef });
    const [release] = await tx
      .insert(transactionsTable)
      .values({
        orderId, userId: sellerId, counterpartyId: charge.userId, type: "escrow_release",
        amountCents: net, feeCents: fee, status: "succeeded", provider: provider.name,
        providerRef: res.ref, idempotencyKey: `release:${orderId}`,
      })
      .returning();
    await tx.insert(transactionsTable).values({
      orderId, userId: null, counterpartyId: sellerId, type: "fee", amountCents: fee,
      status: "succeeded", provider: provider.name, providerRef: res.ref, idempotencyKey: `fee:${orderId}`,
    });
    return release!;
  });
}

/** Refund escrowed funds to the buyer (only while still held). Idempotent. */
export async function refundEscrow(orderId: string, reason?: string): Promise<Transaction> {
  return db.transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const rows = await orderRows(tx, orderId);
    const done = rows.find((r) => r.type === "refund" && r.status === "succeeded");
    if (done) return done;
    const charge = rows.find((r) => r.type === "charge" && r.status === "succeeded");
    if (!charge) throw new PaymentError(409, "No escrowed funds for this order");
    if (rows.some((r) => r.type === "escrow_release" && r.status === "succeeded")) {
      throw new PaymentError(409, "Funds already released to the seller");
    }
    const provider = getPaymentProvider();
    const res = await provider.refund({ amountCents: charge.amountCents, orderId, chargeRef: charge.providerRef, idempotencyKey: `refund:${orderId}` });
    const [row] = await tx
      .insert(transactionsTable)
      .values({
        orderId, userId: charge.userId, counterpartyId: charge.counterpartyId, type: "refund",
        amountCents: charge.amountCents, status: "succeeded", provider: provider.name,
        providerRef: res.ref, idempotencyKey: `refund:${orderId}`, metadata: reason ? { reason } : null,
      })
      .returning();
    return row!;
  });
}

export interface Balance {
  availableCents: number;
  pendingCents: number;
  paidOutCents: number;
  lifetimeEarnedCents: number;
}

export async function getSellerBalance(sellerId: string): Promise<Balance> {
  const t = transactionsTable;
  const sumOf = async (type: Transaction["type"]) => {
    const r = await db
      .select({ s: sql<number>`coalesce(sum(${t.amountCents}),0)::int` })
      .from(t)
      .where(and(eq(t.userId, sellerId), eq(t.type, type), eq(t.status, "succeeded")));
    return r[0]?.s ?? 0;
  };
  const [earned, paidOut] = await Promise.all([sumOf("escrow_release"), sumOf("payout")]);
  // Pending: seller's share of charges still in escrow (no release / refund yet).
  const pend = await db.execute<{ s: number }>(sql`
    select coalesce(sum(c.amount_cents - c.fee_cents),0)::int as s
    from transactions c
    where c.type = 'charge' and c.status = 'succeeded' and c.counterparty_id = ${sellerId}
      and not exists (select 1 from transactions x
        where x.order_id = c.order_id and x.type in ('escrow_release','refund') and x.status = 'succeeded')`);
  const pendingCents = Number(pend.rows[0]?.s ?? 0);
  return { availableCents: earned - paidOut, pendingCents, paidOutCents: paidOut, lifetimeEarnedCents: earned };
}

/** Withdraw from the seller's available balance. Idempotent per key. */
export async function requestPayout(sellerId: string, amountCents: number, idempotencyKey: string): Promise<Transaction> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new PaymentError(400, "Invalid amount");
  const key = `payout:${sellerId}:${idempotencyKey}`;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"payout:" + sellerId}))`);
    const dup = await tx.select().from(transactionsTable).where(eq(transactionsTable.idempotencyKey, key));
    if (dup[0]) return dup[0];
    const bal = await getSellerBalance(sellerId);
    if (amountCents > bal.availableCents) throw new PaymentError(409, "Insufficient available balance");
    const provider = getPaymentProvider();
    const res = await provider.payout({ amountCents, sellerId, idempotencyKey: key });
    const [row] = await tx
      .insert(transactionsTable)
      .values({ userId: sellerId, type: "payout", amountCents, status: "succeeded", provider: provider.name, providerRef: res.ref, idempotencyKey: key })
      .returning();
    return row!;
  });
}

export async function listUserTransactions(userId: string, limit = 100, offset = 0): Promise<Transaction[]> {
  const t = transactionsTable;
  return db
    .select()
    .from(t)
    .where(eq(t.userId, userId))
    .orderBy(desc(t.createdAt))
    .limit(limit)
    .offset(offset);
}
