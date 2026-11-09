/**
 * Pure query-building logic for marketplace search. No DB access here: builds
 * parameterised SQL ($n placeholders) that the route executes via pg.
 */

export const SELLER_LEVELS = ["new", "level1", "level2", "top"] as const;
export const SORTS = ["relevance", "rating", "price_asc", "price_desc", "newest"] as const;
export type SortKey = (typeof SORTS)[number];

export interface GigQuery {
  q?: string;
  categoryId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  maxDeliveryDays?: number;
  minRating?: number;
  sellerLevel?: (typeof SELLER_LEVELS)[number];
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;

/** Searchable document: title (A), tags (B), description (C). */
export const TSV_EXPR =
  "(setweight(to_tsvector('english', g.title), 'A') || " +
  "setweight(to_tsvector('english', coalesce(g.tags::text, '')), 'B') || " +
  "setweight(to_tsvector('english', g.description), 'C'))";
export const MIN_PRICE_EXPR =
  "(SELECT min((p->>'priceCents')::int) FROM jsonb_array_elements(g.packages) p)";
export const MIN_DELIVERY_EXPR =
  "(SELECT min((p->>'deliveryDays')::int) FROM jsonb_array_elements(g.packages) p)";

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function str(v: unknown): string | undefined {
  if (Array.isArray(v)) v = v[0];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : undefined;
}
function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = num(v);
  if (n === undefined) return def;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export type ParsedGigQuery = GigQuery & Required<Pick<GigQuery, "page" | "pageSize" | "sort">>;

/** Normalise untrusted query-string input into a safe GigQuery. */
export function parseGigQuery(raw: Record<string, unknown>): ParsedGigQuery {
  const q = str(raw.q)?.slice(0, 200);
  const level = str(raw.sellerLevel);
  const sort = str(raw.sort);
  const nonNeg = (v: unknown) => {
    const n = num(v);
    return n === undefined || n < 0 ? undefined : Math.floor(n);
  };
  const minRating = num(raw.minRating);
  return {
    q,
    categoryId: str(raw.categoryId)?.slice(0, 100),
    minPriceCents: nonNeg(raw.minPriceCents),
    maxPriceCents: nonNeg(raw.maxPriceCents),
    maxDeliveryDays: nonNeg(raw.maxDeliveryDays),
    minRating: minRating === undefined ? undefined : Math.min(5, Math.max(0, minRating)),
    sellerLevel: SELLER_LEVELS.find((l) => l === level),
    sort: SORTS.find((s) => s === sort) ?? (q ? "relevance" : "newest"),
    page: clampInt(raw.page, 1, 100000, 1),
    pageSize: clampInt(raw.pageSize, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE),
  };
}

export interface BuiltQuery {
  text: string;
  values: unknown[];
  countText: string;
  countValues: unknown[];
}

const GIG_COLUMNS = `g.id, g.seller_id AS "sellerId", g.category_id AS "categoryId", g.slug, g.title,
  g.description, g.tags, g.images, g.status, g.rating_avg AS "ratingAvg", g.rating_count AS "ratingCount",
  g.orders_completed AS "ordersCompleted", g.packages, g.faqs, g.created_at AS "createdAt"`;

/** Build the paged search SQL and the matching count SQL. Only active gigs are returned. */
export function buildGigSearch(input: GigQuery): BuiltQuery {
  const query = parseGigQuery(input as Record<string, unknown>);
  const values: unknown[] = [];
  const add = (v: unknown) => {
    values.push(v);
    return `$${values.length}`;
  };

  const where: string[] = ["g.status = 'active'"];
  let rank = "0";

  if (query.q) {
    const tsq = add(query.q);
    where.push(`${TSV_EXPR} @@ websearch_to_tsquery('english', ${tsq})`);
    rank = `ts_rank(${TSV_EXPR}, websearch_to_tsquery('english', ${tsq}))`;
  }
  if (query.categoryId) where.push(`g.category_id = ${add(query.categoryId)}`);
  if (query.minPriceCents !== undefined) where.push(`${MIN_PRICE_EXPR} >= ${add(query.minPriceCents)}`);
  if (query.maxPriceCents !== undefined) where.push(`${MIN_PRICE_EXPR} <= ${add(query.maxPriceCents)}`);
  if (query.maxDeliveryDays !== undefined) where.push(`${MIN_DELIVERY_EXPR} <= ${add(query.maxDeliveryDays)}`);
  if (query.minRating !== undefined && query.minRating > 0) where.push(`g.rating_avg >= ${add(query.minRating)}`);
  if (query.sellerLevel) {
    where.push(`EXISTS (SELECT 1 FROM users u WHERE u.id::text = g.seller_id AND u.level = ${add(query.sellerLevel)})`);
  }

  const whereSql = where.join(" AND ");
  const countValues = [...values];

  const order: Record<SortKey, string> = {
    relevance: `${rank} DESC, g.rating_avg DESC, g.created_at DESC`,
    rating: "g.rating_avg DESC, g.rating_count DESC, g.created_at DESC",
    price_asc: `${MIN_PRICE_EXPR} ASC, g.created_at DESC`,
    price_desc: `${MIN_PRICE_EXPR} DESC, g.created_at DESC`,
    newest: "g.created_at DESC",
  };
  const limit = add(query.pageSize);
  const offset = add((query.page - 1) * query.pageSize);

  return {
    text: `SELECT ${GIG_COLUMNS} FROM gigs g WHERE ${whereSql} ORDER BY ${order[query.sort]}, g.id LIMIT ${limit} OFFSET ${offset}`,
    values,
    countText: `SELECT count(*)::int AS total FROM gigs g WHERE ${whereSql}`,
    countValues,
  };
}

/** Escape LIKE wildcards in user input. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const SUGGEST_LIMIT = 8;

/** Autocomplete: active gig titles (prefix first, then substring) plus matching tags. */
export function buildSuggest(rawQ: unknown): { text: string; values: unknown[] } | null {
  const q = str(rawQ)?.slice(0, 100);
  if (!q || q.length < 2) return null;
  const like = escapeLike(q.toLowerCase());
  return {
    text: `SELECT s AS text, kind FROM (
      SELECT g.title AS s, 'gig' AS kind,
        (CASE WHEN lower(g.title) LIKE $1 THEN 0 ELSE 1 END) AS pri, g.orders_completed AS pop
      FROM gigs g WHERE g.status = 'active' AND lower(g.title) LIKE $2
      UNION ALL
      SELECT t AS s, 'tag' AS kind, 2 AS pri, count(*)::int AS pop
      FROM gigs g, jsonb_array_elements_text(g.tags) t
      WHERE g.status = 'active' AND lower(t) LIKE $2
      GROUP BY t
    ) x ORDER BY pri, pop DESC, s LIMIT ${SUGGEST_LIMIT}`,
    values: [`${like}%`, `%${like}%`],
  };
}
