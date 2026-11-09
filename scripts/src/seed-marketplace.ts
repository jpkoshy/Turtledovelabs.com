/**
 * Idempotent demo-data seed for the marketplace.
 *   pnpm --filter @workspace/scripts run seed-marketplace
 * Requires DATABASE_URL. Safe to re-run: all rows have deterministic ids and
 * inserts use ON CONFLICT DO NOTHING. Demo password for all accounts: "demo1234".
 */
import { createHash, randomBytes, scrypt as scryptCb } from "node:crypto";
import {
  db,
  pool,
  usersTable,
  categoriesTable,
  gigsTable,
  ordersTable,
  deliveriesTable,
  reviewsTable,
  transactionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const DEMO_PASSWORD = "demo1234";
const FEE_RATE = 0.2;

/** Deterministic UUID (v5-like) from a name, so re-runs hit the same rows. */
function uid(name: string): string {
  const h = createHash("sha1").update(`tdl-seed:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Same format as the api-server's hashPassword (middlewares/auth.ts).
function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, key) =>
      e
        ? reject(e)
        : resolve(`scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`),
    ),
  );
}

const CATEGORIES: [slug: string, name: string, icon: string][] = [
  ["ai-chatbots", "AI Chatbots", "bot"],
  ["workflow-automation", "Workflow Automation", "workflow"],
  ["data-analysis", "Data Analysis", "bar-chart"],
  ["web-scraping", "Web Scraping", "globe"],
  ["llm-integration", "LLM Integration", "cpu"],
  ["machine-learning", "Machine Learning", "brain"],
  ["content-generation", "AI Content", "file-text"],
  ["prompt-engineering", "Prompt Engineering", "terminal"],
  ["dashboards", "Dashboards & BI", "layout-dashboard"],
  ["data-pipelines", "Data Pipelines", "database"],
  ["voice-ai", "Voice AI", "mic"],
  ["computer-vision", "Computer Vision", "eye"],
];

const SELLERS = [
  ["ada_codes", "Ada Chen", "top", "SG"],
  ["bytebard", "Marcus Webb", "level2", "US"],
  ["neuralnina", "Nina Okafor", "level2", "NG"],
  ["scrapesmith", "Luca Moretti", "level1", "IT"],
  ["flowfox", "Priya Nair", "level1", "IN"],
  ["datadan", "Dan Kowalski", "new", "PL"],
] as const;

const BUYERS = [
  ["demo_buyer", "Demo Buyer", "buyer@demo.turtledovelabs.com"],
  ["acme_ops", "Acme Ops", "ops@demo.turtledovelabs.com"],
] as const;

const TIERS = ["basic", "standard", "premium"] as const;
const BASE_PRICES = [5000, 15000, 40000]; // cents
const DAYS = [3, 7, 14];

function packagesFor(title: string, multiplier: number) {
  return TIERS.map((tier, i) => ({
    tier,
    name: ["Starter", "Pro", "Enterprise"][i]!,
    description: `${["Core deliverable", "Extended scope with support", "Full build, docs and handover"][i]} for: ${title}.`,
    priceCents: Math.round((BASE_PRICES[i]! * multiplier) / 100) * 100,
    deliveryDays: DAYS[i]!,
    revisions: [1, 3, 5][i]!,
    features: [
      ["Source files", "1 revision"],
      ["Source files", "Documentation", "3 revisions"],
      ["Source files", "Documentation", "Priority support", "5 revisions"],
    ][i]!,
  }));
}

const GIG_TITLES = [
  "I will build a custom AI support chatbot for your website",
  "I will automate your business workflows with n8n and Zapier",
  "I will analyze your dataset and deliver an insights report",
  "I will scrape and structure any website data for you",
  "I will integrate GPT and Claude APIs into your product",
  "I will train and deploy a custom machine learning model",
  "I will generate on-brand marketing content with AI",
  "I will engineer production-grade prompts for your use case",
  "I will design an interactive BI dashboard",
  "I will build a reliable ETL data pipeline",
  "I will create an AI voice assistant for your business",
  "I will build an image classification and detection system",
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const now = Date.now();
  const day = 86_400_000;

  // Users
  const users = [
    {
      id: uid("user:admin"),
      email: "admin@demo.turtledovelabs.com",
      username: "demo_admin",
      displayName: "Demo Admin",
      role: "admin" as const,
      level: "new" as const,
    },
    ...BUYERS.map(([username, displayName, email]) => ({
      id: uid(`user:${username}`),
      email,
      username,
      displayName,
      role: "buyer" as const,
      level: "new" as const,
    })),
    ...SELLERS.map(([username, displayName, level, country]) => ({
      id: uid(`user:${username}`),
      email: `${username}@demo.turtledovelabs.com`,
      username,
      displayName,
      role: "seller" as const,
      level,
      country,
      bio: `Independent AI and automation specialist based in ${country}.`,
      languages: ["English"],
      skills: ["Python", "LLMs", "Automation"],
    })),
  ].map((u) => ({ ...u, passwordHash }));
  await db.insert(usersTable).values(users).onConflictDoNothing();

  // Categories
  await db
    .insert(categoriesTable)
    .values(
      CATEGORIES.map(([slug, name, icon]) => ({
        id: uid(`cat:${slug}`),
        slug,
        name,
        icon,
      })),
    )
    .onConflictDoNothing();

  // Gigs: one per category, spread across sellers
  const gigs = GIG_TITLES.map((title, i) => {
    const seller = SELLERS[i % SELLERS.length]!;
    return {
      id: uid(`gig:${i}`),
      sellerId: uid(`user:${seller[0]}`),
      categoryId: uid(`cat:${CATEGORIES[i]![0]}`),
      slug: slugify(title),
      title,
      description: `${title}. Includes a scoped brief, iterative delivery and clear documentation. Message me before ordering for custom requirements.`,
      tags: [CATEGORIES[i]![0], "ai", "automation"],
      images: [] as string[],
      status: "active" as const,
      packages: packagesFor(title, 1 + (i % 4) * 0.25),
      faqs: [{ question: "Can you sign an NDA?", answer: "Yes, on request." }],
    };
  });
  await db.insert(gigsTable).values(gigs).onConflictDoNothing();

  // Completed orders + reviews + ledger for the first 8 gigs
  const buyer = uid("user:demo_buyer");
  const comments = [
    "Excellent work, delivered ahead of schedule.",
    "Great communication and quality. Would hire again.",
    "Solid result, small tweaks needed but handled quickly.",
    "Exactly what I needed. Highly recommended.",
  ];
  for (let i = 0; i < 8; i++) {
    const gig = gigs[i]!;
    const tier = TIERS[i % 2]!;
    const pkg = gig.packages.find((p) => p.tier === tier)!;
    const feeCents = Math.round(pkg.priceCents * FEE_RATE);
    const orderId = uid(`order:${i}`);
    const created = new Date(now - (30 - i) * day);
    const rating = i % 5 === 0 ? 4 : 5;

    await db
      .insert(ordersTable)
      .values({
        id: orderId,
        gigId: gig.id,
        buyerId: buyer,
        sellerId: gig.sellerId,
        tier,
        priceCents: pkg.priceCents,
        feeCents,
        status: "completed",
        requirements: "Demo order seeded for sample data.",
        packageSnapshot: {
          name: pkg.name,
          deliveryDays: pkg.deliveryDays,
          revisions: pkg.revisions,
        },
        revisionsAllowed: pkg.revisions,
        revisionsUsed: 0,
        dueAt: new Date(created.getTime() + pkg.deliveryDays * day),
        createdAt: created,
        updatedAt: created,
      })
      .onConflictDoNothing();
    await db
      .insert(deliveriesTable)
      .values({
        id: uid(`delivery:${i}`),
        orderId,
        message: "Work delivered. See attached notes.",
        files: [],
        createdAt: new Date(created.getTime() + 2 * day),
      })
      .onConflictDoNothing();
    await db
      .insert(reviewsTable)
      .values({
        id: uid(`review:${i}`),
        orderId,
        gigId: gig.id,
        buyerId: buyer,
        rating,
        comment: comments[i % comments.length]!,
        createdAt: new Date(created.getTime() + 3 * day),
      })
      .onConflictDoNothing();
    const ledger = [
      ["charge", buyer, gig.sellerId, pkg.priceCents],
      ["escrow_release", gig.sellerId, buyer, pkg.priceCents - feeCents],
      ["fee", null, gig.sellerId, feeCents],
    ] as const;
    for (const [type, userId, counterpartyId, amountCents] of ledger) {
      await db
        .insert(transactionsTable)
        .values({
          orderId,
          userId,
          counterpartyId,
          type,
          amountCents,
          feeCents: type === "charge" ? feeCents : 0,
          status: "succeeded",
          provider: "mock",
          idempotencyKey: `seed:${orderId}:${type}`,
          createdAt: created,
        })
        .onConflictDoNothing();
    }
  }

  // Recompute gig rating aggregates from seeded reviews.
  for (const gig of gigs.slice(0, 8)) {
    const rows = await db
      .select({ rating: reviewsTable.rating })
      .from(reviewsTable)
      .where(eq(reviewsTable.gigId, gig.id));
    if (!rows.length) continue;
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    await db
      .update(gigsTable)
      .set({
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: rows.length,
        ordersCompleted: rows.length,
      })
      .where(eq(gigsTable.id, gig.id));
  }

  console.log(
    `Seeded ${users.length} users, ${CATEGORIES.length} categories, ${gigs.length} gigs, 8 completed orders. Demo password: ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
