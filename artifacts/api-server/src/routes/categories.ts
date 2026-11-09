import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

// GET /categories — flat list; clients build the tree via parentId.
router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      parentId: categoriesTable.parentId,
      icon: categoriesTable.icon,
    })
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.name));
  res.json(rows);
});

export default router;
