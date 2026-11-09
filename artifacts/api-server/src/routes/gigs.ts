import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  gigsTable,
  categoriesTable,
  createGigSchema,
  updateGigSchema,
  type GigRow,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { optionalAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

type AuthedUser = { id: string; role: string };

function currentUser(req: Request): AuthedUser | undefined {
  const u = (req as unknown as { user?: AuthedUser }).user;
  return u && typeof u.id === "string" ? u : undefined;
}

function toGig(row: GigRow) {
  return {
    id: row.id,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    tags: row.tags,
    images: row.images,
    status: row.status,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    ordersCompleted: row.ordersCompleted,
    packages: row.packages,
    faqs: row.faqs,
    createdAt: row.createdAt.toISOString(),
  };
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return base.length >= 3 ? base : `gig-${base}`.replace(/-$/, "");
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: gigsTable.id })
    .from(gigsTable)
    .where(eq(gigsTable.slug, slug))
    .limit(1);
  return !!row && row.id !== exceptId;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  if (!(await slugTaken(base))) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    if (!(await slugTaken(candidate))) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 12)}`;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

async function categoryExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);
  return !!row;
}

function badRequest(res: Response, error: { issues: unknown }) {
  res.status(400).json({ error: "Validation failed", issues: error.issues });
}

// GET /gigs/mine — the authenticated seller's gigs (all statuses)
router.get("/mine", requireRole("seller", "admin"), async (req, res) => {
  const user = currentUser(req);
  if (!user) return void res.status(401).json({ error: "Unauthorized" });
  const rows = await db
    .select()
    .from(gigsTable)
    .where(eq(gigsTable.sellerId, user.id))
    .orderBy(desc(gigsTable.createdAt));
  res.json(rows.map(toGig));
});

// GET /gigs/:slug — public for active gigs; owner/admin may see any status
router.get("/:slug", optionalAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(gigsTable)
    .where(eq(gigsTable.slug, String(req.params.slug)))
    .limit(1);
  if (!row) return void res.status(404).json({ error: "Gig not found" });
  if (row.status !== "active") {
    const user = currentUser(req);
    if (!user || (user.id !== row.sellerId && user.role !== "admin")) {
      return void res.status(404).json({ error: "Gig not found" });
    }
  }
  res.json(toGig(row));
});

// POST /gigs
router.post("/", requireRole("seller", "admin"), async (req, res) => {
  const user = currentUser(req);
  if (!user) return void res.status(401).json({ error: "Unauthorized" });
  const parsed = createGigSchema.safeParse(req.body);
  if (!parsed.success) return void badRequest(res, parsed.error);
  const input = parsed.data;

  if (input.status === "rejected") {
    return void res.status(403).json({ error: "Only moderators can reject a gig" });
  }
  if (!(await categoryExists(input.categoryId))) {
    return void res.status(400).json({ error: "Unknown categoryId" });
  }
  let slug = input.slug;
  if (slug) {
    if (await slugTaken(slug)) return void res.status(409).json({ error: "Slug already in use" });
  } else {
    slug = await uniqueSlug(input.title);
  }

  try {
    const [row] = await db
      .insert(gigsTable)
      .values({
        sellerId: user.id,
        categoryId: input.categoryId,
        slug,
        title: input.title,
        description: input.description,
        tags: input.tags,
        images: input.images,
        status: input.status ?? "draft",
        packages: input.packages,
        faqs: input.faqs,
      })
      .returning();
    res.status(201).json(toGig(row!));
  } catch (err) {
    if (isUniqueViolation(err)) return void res.status(409).json({ error: "Slug already in use" });
    throw err;
  }
});

// PATCH /gigs/:id — owner or admin
router.patch("/:id", requireRole("seller", "admin"), async (req, res) => {
  const user = currentUser(req);
  if (!user) return void res.status(401).json({ error: "Unauthorized" });
  const id = String(req.params.id);
  const [existing] = await db.select().from(gigsTable).where(eq(gigsTable.id, id)).limit(1);
  if (!existing) return void res.status(404).json({ error: "Gig not found" });
  if (existing.sellerId !== user.id && user.role !== "admin") {
    return void res.status(403).json({ error: "Forbidden" });
  }

  const parsed = updateGigSchema.safeParse(req.body);
  if (!parsed.success) return void badRequest(res, parsed.error);
  const input = parsed.data;

  if (input.status === "rejected" && user.role !== "admin") {
    return void res.status(403).json({ error: "Only moderators can reject a gig" });
  }
  if (input.categoryId && !(await categoryExists(input.categoryId))) {
    return void res.status(400).json({ error: "Unknown categoryId" });
  }
  if (input.slug && input.slug !== existing.slug && (await slugTaken(input.slug, id))) {
    return void res.status(409).json({ error: "Slug already in use" });
  }

  const patch: Partial<typeof gigsTable.$inferInsert> = { updatedAt: new Date() };
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.images !== undefined) patch.images = input.images;
  if (input.status !== undefined) patch.status = input.status;
  if (input.packages !== undefined) patch.packages = input.packages;
  if (input.faqs !== undefined) patch.faqs = input.faqs;

  try {
    const [row] = await db
      .update(gigsTable)
      .set(patch)
      .where(eq(gigsTable.id, id))
      .returning();
    res.json(toGig(row!));
  } catch (err) {
    if (isUniqueViolation(err)) return void res.status(409).json({ error: "Slug already in use" });
    throw err;
  }
});

// DELETE /gigs/:id — owner or admin
router.delete("/:id", requireRole("seller", "admin"), async (req, res) => {
  const user = currentUser(req);
  if (!user) return void res.status(401).json({ error: "Unauthorized" });
  const id = String(req.params.id);
  const [existing] = await db.select().from(gigsTable).where(eq(gigsTable.id, id)).limit(1);
  if (!existing) return void res.status(404).json({ error: "Gig not found" });
  if (existing.sellerId !== user.id && user.role !== "admin") {
    return void res.status(403).json({ error: "Forbidden" });
  }
  await db.delete(gigsTable).where(and(eq(gigsTable.id, id)));
  res.status(204).end();
});

export default router;
