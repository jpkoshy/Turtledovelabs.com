import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { buildGigSearch, buildSuggest, parseGigQuery } from "../lib/search";

const router: IRouter = Router();

router.get("/gigs", async (req, res) => {
  try {
    const parsed = parseGigQuery(req.query as Record<string, unknown>);
    const built = buildGigSearch(parsed);
    const [rows, count] = await Promise.all([
      pool.query(built.text, built.values),
      pool.query<{ total: number }>(built.countText, built.countValues),
    ]);
    res.json({
      items: rows.rows,
      total: count.rows[0]?.total ?? 0,
      page: parsed.page,
      pageSize: parsed.pageSize,
    });
  } catch (err) {
    req.log.error({ err }, "gig search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/suggest", async (req, res) => {
  try {
    const built = buildSuggest(req.query.q);
    if (!built) {
      res.json({ suggestions: [] });
      return;
    }
    const { rows } = await pool.query<{ text: string; kind: "gig" | "tag" }>(built.text, built.values);
    const seen = new Set<string>();
    const suggestions = rows.filter((r) => {
      const k = r.text.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "suggest failed");
    res.status(500).json({ error: "Suggest failed" });
  }
});

export default router;
