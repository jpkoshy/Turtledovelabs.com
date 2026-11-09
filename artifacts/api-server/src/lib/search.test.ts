import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGigSearch, buildSuggest, parseGigQuery, escapeLike } from "./search";

test("clamps pageSize and page", () => {
  const p = parseGigQuery({ pageSize: "9999", page: "-3" });
  assert.equal(p.pageSize, 50);
  assert.equal(p.page, 1);
});

test("user input never inlined", () => {
  const evil = "'; DROP TABLE gigs; --";
  const b = buildGigSearch({ q: evil, categoryId: evil });
  assert.ok(!b.text.includes("DROP"));
  assert.ok(b.values.includes(evil));
  assert.equal(b.countValues.length, b.values.length - 2);
});

test("filters add params and sort defaults", () => {
  const b = buildGigSearch({ q: "ai", minPriceCents: 100, maxPriceCents: 900, maxDeliveryDays: 3, minRating: 4, sellerLevel: "top", page: 2, pageSize: 10 });
  assert.match(b.text, /websearch_to_tsquery/);
  assert.match(b.text, /ts_rank/);
  assert.deepEqual(b.values.slice(-2), [10, 10]);
  assert.equal(parseGigQuery({ sort: "bogus" }).sort, "newest");
});

test("suggest", () => {
  assert.equal(buildSuggest("a"), null);
  assert.deepEqual(buildSuggest("50%")!.values, ["50\\%%", "%50\\%%"]);
  assert.equal(escapeLike("a_b"), "a\\_b");
});
