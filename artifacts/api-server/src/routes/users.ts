import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, updateProfileBodySchema } from "@workspace/db";
import { optionalAuth, requireAuth, toPublicUser } from "../middlewares/auth";

const router: IRouter = Router();

async function updateProfile(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
) {
  try {
    const parsed = updateProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.json({ user: req.user });
      return;
    }
    const [row] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    res.json({ user: toPublicUser(row!) });
  } catch (err) {
    next(err);
  }
}

// "me" routes are declared before ":username" so they are not shadowed.
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
router.patch("/me", requireAuth, updateProfile);

router.get("/:username", optionalAuth, async (req, res, next) => {
  try {
    const username = String(req.params["username"]).toLowerCase();
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Email is private; expose only to the owner.
    const pub = toPublicUser(row);
    const viewer = req.user;
    res.json({ user: viewer?.id === row.id ? pub : { ...pub, email: undefined } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:username", requireAuth, (req, res, next) => {
  if (String(req.params["username"]).toLowerCase() !== req.user!.username) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  void updateProfile(req, res, next);
});

export default router;
