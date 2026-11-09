import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import {
  db,
  usersTable,
  signupBodySchema,
  loginBodySchema,
} from "@workspace/db";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  requireAuth,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "../middlewares/auth";

const router: IRouter = Router();

// Precomputed so unknown-email logins take similar time to wrong-password ones.
const dummyHash = hashPassword("not-a-real-password");

router.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
      return;
    }
    const { email, username, displayName, password, role } = parsed.data;
    const existing = await db
      .select({ email: usersTable.email, username: usersTable.username })
      .from(usersTable)
      .where(or(eq(usersTable.email, email), eq(usersTable.username, username)))
      .limit(1);
    if (existing.length) {
      res.status(409).json({ error: "Email or username already in use" });
      return;
    }
    const passwordHash = await hashPassword(password);
    let row;
    try {
      [row] = await db
        .insert(usersTable)
        .values({ email, username, displayName, passwordHash, role })
        .returning();
    } catch (e) {
      if ((e as { code?: string }).code === "23505") {
        res.status(409).json({ error: "Email or username already in use" });
        return;
      }
      throw e;
    }
    const token = createSessionToken(row!.id);
    setSessionCookie(res, token);
    res.status(201).json({ user: toPublicUser(row!), token });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const { email, password } = parsed.data;
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    const ok = await verifyPassword(password, row ? row.passwordHash : await dummyHash);
    if (!row || !ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = createSessionToken(row.id);
    setSessionCookie(res, token);
    res.json({ user: toPublicUser(row), token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
