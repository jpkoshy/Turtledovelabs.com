# Marketplace API

Express 5 + Drizzle + Zod, mounted at `/api`. The machine-readable contract is
`lib/api-spec/openapi.yaml`; regenerate the typed clients with
`pnpm --filter @workspace/api-spec run codegen` (outputs `lib/api-client-react`, `lib/api-zod`).

Conventions: JSON in camelCase, money as integer USD cents, platform fee 20% of price
(`feeCents`), errors as `{ "error": string, "issues"?: [...] }`. Many resources are wrapped
(`{ user }`, `{ order }`, `{ orders }`, `{ dispute }`, ...); see the spec for exact shapes.

## Auth

`POST /auth/signup` and `POST /auth/login` return `{ user, token }` and set an httpOnly
`tdl_session` cookie (7 day TTL). Send either the cookie or `Authorization: Bearer <token>`.
Passwords are hashed with scrypt. Roles: `buyer`, `seller`, `admin`. Every mutation checks
ownership or role; the order price is always derived from the stored gig package.

## Endpoints

| Area | Endpoints |
|------|-----------|
| health | `GET /healthz` |
| auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| users | `GET/PATCH /users/me`, `GET/PATCH /users/:username` |
| categories | `GET /categories` |
| gigs | `GET /gigs/mine`, `GET /gigs/:slug`, `POST /gigs`, `PATCH /gigs/:id`, `DELETE /gigs/:id` |
| search | `GET /search/gigs` (q, categoryId, minPriceCents, maxPriceCents, maxDeliveryDays, minRating, sellerLevel, sort, page, pageSize), `GET /search/suggest?q=` |
| orders | `GET /orders?as=buyer\|seller`, `POST /orders`, `GET /orders/:id`, `POST /orders/:id/{deliver,revision,complete,cancel}` |
| reviews | `GET /reviews?gigId=`, `POST /reviews`, `POST /reviews/:id/reply` |
| messages | `GET /messages/stream` (SSE), `GET/POST /messages/conversations`, `GET/POST /messages/conversations/:id`, `POST /messages/conversations/:id/read` |
| payments | `POST /payments/charge`, `POST /payments/release/:orderId`, `POST /payments/refund/:orderId`, `GET /payments/transactions`, `GET /payments/balance`, `GET /payments/escrow/:orderId`, `POST /payments/payout` |
| disputes | `GET/POST /disputes`, `GET /disputes/:id`, `POST /disputes/:id/resolve` (admin) |
| admin | `GET /admin/gigs`, `POST /admin/gigs/:id/moderate`, `GET /admin/users`, `POST /admin/users/:id/suspend`, `GET /admin/stats`, `GET /admin/audit` |
| notifications | `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/:id/read`, `GET /notifications/favorites`, `PUT/DELETE /notifications/favorites/:gigId` |

Order lifecycle: `pending -> active -> delivered <-> revision -> completed`, with
`cancelled` and `disputed` branches. Payment charges are held in escrow, released to the
seller (minus fee) on completion, and refunded on cancellation or a buyer-favouring dispute.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Postgres connection string (`@workspace/db`) |
| `SESSION_SECRET` | production (min 16 chars) | Signs session tokens |
| `PAYMENT_PROVIDER` | no | `mock` (default) or `stripe` (also needs `STRIPE_SECRET_KEY`) |
| `PORT` | no | api-server listen port |

## Database and seed data

```
pnpm --filter @workspace/db run push                 # create tables
pnpm --filter @workspace/scripts run seed-marketplace # idempotent demo data
```

The seed creates 12 categories, 1 admin, 2 buyers, 6 sellers, 12 active gigs with three
packages each, and 8 completed orders with reviews and ledger rows. All demo accounts use the
password `demo1234` (e.g. `buyer@demo.turtledovelabs.com`, `admin@demo.turtledovelabs.com`,
`ada_codes@demo.turtledovelabs.com`). Never run it against a production database.
