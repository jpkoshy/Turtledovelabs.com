/**
 * Admin API (mounted at /api/admin). Admin role only; every mutation is written to admin_audit.
 *   GET  /gigs?status=draft|active|paused|rejected&limit&offset
 *   POST /gigs/:id/moderate   {action: approve|reject|pause, note?}
 *   GET  /users?q&role&limit&offset
 *   POST /users/:id/suspend   {suspended?: boolean (default true), reason}
 *   GET  /stats               {gmvCents, feesCents, orders, ordersByStatus, users, usersByRole, openDisputes}
 *   GET  /audit               recent audit entries
 * Note: suspension is recorded in user_suspensions; auth middleware owners must enforce it at login.
 */
import { Router, type IRouter, type NextFunction, type Response } from "express";
import { and, count, desc, eq, ilike, isNull, or, sum } from "drizzle-orm";
import {
  db,
  adminAuditTable,
  disputesTable,
  gigsTable,
  ordersTable,
  usersTable,
  userSuspensionsTable,
  adminGigsQuerySchema,
  moderateGigBodySchema,
  adminUsersQuerySchema,
  suspendUserBodySchema,
} from "@workspace/db";
import { requireRole, toPublicUser } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireRole("admin"));

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function parse<T>(schema: { safeParse(d: unknown): { success: boolean; data?: T; error?: { issues: { message: string }[] } } }, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error!.issues.map((i) => i.message).join("; "));
  return r.data as T;
}

function audit(adminId: string, action: string, targetType: string, targetId: string, details: Record<string, unknown>) {
  return db.insert(adminAuditTable).values({ adminId, action, targetType, targetId, details });
}

router.get("/gigs", async (req, res, next) => {
  try {
    const q = parse(adminGigsQuerySchema, req.query) as ReturnType<typeof adminGigsQuerySchema.parse>;
    const gigs = await db
      .select()
      .from(gigsTable)
      .where(eq(gigsTable.status, q.status))
      .orderBy(desc(gigsTable.createdAt))
      .limit(q.limit)
      .offset(q.offset);
    res.json({ gigs });
  } catch (err) {
    next(err);
  }
});

router.post("/gigs/:id/moderate", async (req, res, next) => {
  try {
    const body = parse(moderateGigBodySchema, req.body) as ReturnType<typeof moderateGigBodySchema.parse>;
    const id = String(req.params["id"]);
    const status = body.action === "approve" ? "active" : body.action === "reject" ? "rejected" : "paused";
    const [before] = await db.select({ status: gigsTable.status }).from(gigsTable).where(eq(gigsTable.id, id)).limit(1);
    if (!before) throw new HttpError(404, "Gig not found");
    const [gig] = await db
      .update(gigsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(gigsTable.id, id))
      .returning();
    await audit(req.user!.id, `gig.${body.action}`, "gig", id, {
      from: before.status,
      to: status,
      note: body.note ?? null,
    });
    res.json({ gig });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const q = parse(adminUsersQuerySchema, req.query) as ReturnType<typeof adminUsersQuerySchema.parse>;
    const conds = [];
    if (q.role) conds.push(eq(usersTable.role, q.role));
    if (q.q) {
      const like = `%${q.q.replace(/[\\%_]/g, "\\$&")}%`;
      conds.push(or(ilike(usersTable.email, like), ilike(usersTable.username, like), ilike(usersTable.displayName, like))!);
    }
    const rows = await db
      .select()
      .from(usersTable)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(usersTable.createdAt))
      .limit(q.limit)
      .offset(q.offset);
    const active = await db
      .select({ userId: userSuspensionsTable.userId })
      .from(userSuspensionsTable)
      .where(isNull(userSuspensionsTable.liftedAt));
    const suspended = new Set(active.map((a) => a.userId));
    res.json({ users: rows.map((u) => ({ ...toPublicUser(u), suspended: suspended.has(u.id) })) });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/suspend", async (req, res, next) => {
  try {
    const body = parse(suspendUserBodySchema, req.body) as ReturnType<typeof suspendUserBodySchema.parse>;
    const id = String(req.params["id"]);
    const admin = req.user!;
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) throw new HttpError(404, "User not found");
    if (target.id === admin.id || target.role === "admin") {
      throw new HttpError(403, "Cannot suspend an admin account");
    }
    if (body.suspended) {
      const [open] = await db
        .select({ id: userSuspensionsTable.id })
        .from(userSuspensionsTable)
        .where(and(eq(userSuspensionsTable.userId, id), isNull(userSuspensionsTable.liftedAt)))
        .limit(1);
      if (!open) {
        await db.insert(userSuspensionsTable).values({ userId: id, reason: body.reason, suspendedBy: admin.id });
      }
      // Take their listings offline.
      await db
        .update(gigsTable)
        .set({ status: "paused", updatedAt: new Date() })
        .where(and(eq(gigsTable.sellerId, id), eq(gigsTable.status, "active")));
    } else {
      await db
        .update(userSuspensionsTable)
        .set({ liftedAt: new Date() })
        .where(and(eq(userSuspensionsTable.userId, id), isNull(userSuspensionsTable.liftedAt)));
    }
    await audit(admin.id, body.suspended ? "user.suspend" : "user.unsuspend", "user", id, { reason: body.reason });
    res.json({ user: { ...toPublicUser(target), suspended: body.suspended } });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const [gmv] = await db
      .select({ gmv: sum(ordersTable.priceCents), fees: sum(ordersTable.feeCents) })
      .from(ordersTable)
      .where(eq(ordersTable.status, "completed"));
    const byStatus = await db
      .select({ status: ordersTable.status, n: count() })
      .from(ordersTable)
      .groupBy(ordersTable.status);
    const byRole = await db.select({ role: usersTable.role, n: count() }).from(usersTable).groupBy(usersTable.role);
    const [open] = await db.select({ n: count() }).from(disputesTable).where(eq(disputesTable.status, "open"));
    const ordersByStatus = Object.fromEntries(byStatus.map((r) => [r.status, r.n]));
    const usersByRole = Object.fromEntries(byRole.map((r) => [r.role, r.n]));
    res.json({
      gmvCents: Number(gmv?.gmv ?? 0),
      feesCents: Number(gmv?.fees ?? 0),
      orders: byStatus.reduce((a, r) => a + r.n, 0),
      ordersByStatus,
      users: byRole.reduce((a, r) => a + r.n, 0),
      usersByRole,
      openDisputes: open?.n ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/audit", async (_req, res, next) => {
  try {
    const entries = await db.select().from(adminAuditTable).orderBy(desc(adminAuditTable.createdAt)).limit(200);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

router.use((err: unknown, _req: unknown, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
});

export default router;
