# Turtledove Labs Marketplace (Fiverr-style) — Shared Spec

Buyers hire sellers for fixed-price "gigs" with 3 tiers (Basic/Standard/Premium). Gigs are AI/automation/data services.
Static GitHub Pages hosts the frontend, so the **frontend runs on a typed local data layer** (`src/lib/marketplace/`, localStorage-backed, seeded) behind an `api` interface. The **api-server** (Express 5 + Drizzle + Zod) implements the same domain for a real deployment. Frontend and backend agents work independently; keep entity field names identical to the types below.

## Entities (camelCase in TS; snake_case columns in DB)
- User {id, email, username, displayName, avatarUrl?, role: buyer|seller|admin, bio?, country?, languages[], skills[], level: new|level1|level2|top, createdAt}
- Category {id, slug, name, parentId?, icon}
- Gig {id, sellerId, categoryId, slug, title, description, tags[], images[], status: draft|active|paused|rejected, ratingAvg, ratingCount, ordersCompleted, packages: Package[3], faqs[], createdAt}
- Package {tier: basic|standard|premium, name, description, priceCents, deliveryDays, revisions, features[]}
- Order {id, gigId, buyerId, sellerId, tier, priceCents, feeCents, status: pending|active|delivered|revision|completed|cancelled|disputed, requirements?, deliveries[], dueAt, createdAt}
- Review {id, orderId, gigId, buyerId, rating 1-5, comment, sellerReply?, createdAt}
- Conversation {id, participantIds[2], gigId?, lastMessageAt}; Message {id, conversationId, senderId, body, createdAt}
- Transaction {id, orderId, type: charge|escrow_release|payout|refund|fee, amountCents, status, createdAt}
- Dispute {id, orderId, openedBy, reason, status: open|resolved_buyer|resolved_seller, resolution?}
- Notification {id, userId, kind, body, read, createdAt}; Favorite {userId, gigId}
Platform fee: 20% of order price (feeCents). Money is always integer cents (USD).

## Routes (frontend, wouter) — all pre-wired in App.tsx under `/marketplace`
/marketplace, /marketplace/browse, /marketplace/gig/:slug, /marketplace/seller/:username, /marketplace/sell/new, /marketplace/sell/:id/edit, /marketplace/checkout/:gigId/:tier, /marketplace/orders, /marketplace/orders/:id, /marketplace/inbox, /marketplace/dashboard/seller, /marketplace/dashboard/buyer, /marketplace/auth, /marketplace/admin

## API (backend) — mounted at /api, one router file per area (pre-wired in routes/index.ts)
auth, users, categories, gigs, search, orders, reviews, messages, payments, disputes, admin, notifications(+favorites)

## Rules for every agent
- Edit ONLY the files you own (table below). Do not touch pre-wired barrels (App.tsx, routes/index.ts, schema/index.ts) — stubs already export your module.
- Reuse existing shadcn UI in `artifacts/ai-company/src/components/ui` and the site's dark/mono aesthetic. Mobile-first.
- Frontend imports data only via `@/lib/marketplace/api` (types in `@/lib/marketplace/types`). Use `@tanstack/react-query`.
- Backend: Zod (`zod/v4`) validation, Drizzle, no secrets in code, authz checks on every mutation, parameterised queries.
- Typecheck your area before pushing. Commit only your files, then `git pull --rebase origin claude/charming-brown-fljced && git push origin claude/charming-brown-fljced` (retry on non-fast-forward).
- Do NOT open PRs.

## Ownership (agent → files)
Paths: FE=artifacts/ai-company/src, BE=artifacts/api-server/src, DB=lib/db/src/schema. You may create new files inside your own folders/prefixes.

| ID | Area | Owns |
|----|------|------|
| A1 | Auth + users (API) | DB/users.ts, BE/routes/auth.ts, BE/routes/users.ts, BE/middlewares/auth.ts |
| A2 | Categories + gigs (API) | DB/categories.ts, DB/gigs.ts, BE/routes/categories.ts, BE/routes/gigs.ts |
| A3 | Search (API) | BE/routes/search.ts, BE/lib/search.ts |
| A4 | Orders lifecycle (API) | DB/orders.ts, BE/routes/orders.ts |
| A5 | Reviews (API) | DB/reviews.ts, BE/routes/reviews.ts |
| A6 | Messaging (API) | DB/messages.ts, BE/routes/messages.ts |
| A7 | Payments/escrow/payouts (API; provider abstraction + mock provider, Stripe-ready) | DB/transactions.ts, BE/routes/payments.ts, BE/lib/payments.ts |
| A8 | Disputes + admin moderation (API) | DB/disputes.ts, BE/routes/disputes.ts, BE/routes/admin.ts |
| A9 | Notifications + favorites (API) | DB/notifications.ts, BE/routes/notifications.ts |
| A10 | OpenAPI spec + DB seed + API docs | lib/api-spec/openapi.yaml, scripts/src/seed-marketplace.ts, docs/API.md |
| B1 | Local data layer | FE/lib/marketplace/local-api.ts, seed.ts (+ new files in FE/lib/marketplace/store/). Seed: 12 categories, ~10 sellers, ~40 gigs w/ 3 packages, reviews, demo buyer/seller/admin accounts |
| B2 | Marketplace shell | FE/components/marketplace/layout.tsx (+ header/footer/user-menu/notification-bell files), "Marketplace" link in FE/components/layout/navbar.tsx |
| B3 | Marketplace home | FE/pages/marketplace/home.tsx, FE/components/marketplace/home/* |
| B4 | Browse + search | FE/pages/marketplace/browse.tsx, FE/components/marketplace/filters/* |
| B5 | Gig detail | FE/pages/marketplace/gig.tsx, FE/components/marketplace/gig-detail/* |
| B6 | Seller profile | FE/pages/marketplace/seller.tsx, FE/components/marketplace/seller/* |
| B7 | Create/edit gig wizard | FE/pages/marketplace/sell-new.tsx, sell-edit.tsx, FE/components/marketplace/gig-form/* |
| B8 | Checkout | FE/pages/marketplace/checkout.tsx, FE/components/marketplace/checkout/* (mock card form, clearly labelled demo) |
| B9 | Orders list + detail | FE/pages/marketplace/orders.tsx, order-detail.tsx, FE/components/marketplace/orders/* |
| B10 | Inbox / chat | FE/pages/marketplace/inbox.tsx, FE/components/marketplace/chat/* |
| B11 | Seller dashboard | FE/pages/marketplace/seller-dashboard.tsx, FE/components/marketplace/seller-dashboard/* |
| B12 | Buyer dashboard + favorites | FE/pages/marketplace/buyer-dashboard.tsx, FE/components/marketplace/buyer-dashboard/* |
| B13 | Auth UI + context | FE/pages/marketplace/auth.tsx, FE/lib/marketplace/auth-context.tsx |
| B14 | Review components | FE/components/marketplace/reviews/* (ReviewList, ReviewSummary, ReviewForm — exported from reviews/index.ts for B5/B9 to use) |
| B15 | Admin + disputes UI | FE/pages/marketplace/admin.tsx, FE/components/marketplace/admin/* |

Shared, already written (do not edit; request changes in your final report): types.ts, api.ts, format.ts, gig-card.tsx, rating-stars.tsx.
