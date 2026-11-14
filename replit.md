# Turtledove Labs — turtledovelabs.com

Marketing site for Turtledove Labs: custom AI models and agent systems deployed inside the client's own infrastructure. Static React/Vite app in `artifacts/ai-company`, deployed to GitHub Pages from `main` by `.github/workflows/pages.yml`.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Site: `artifacts/ai-company` — pages in `src/pages`, home sections in `src/components/sections`
- Contact email and mailto builder: `src/lib/contact.ts`; every CTA opens the shared modal via `useContact()` (`src/components/contact-provider.tsx`)
- Brand: `src/assets/logo.svg` and `public/favicon.svg` come from the logo set in the `jpkoshy/Biz-AI-Content` repo (`turtledovelabs-logo/`)
- SEO: `index.html` (meta, Open Graph, JSON-LD), `public/sitemap.xml`, `public/robots.txt`, per-route title/canonical via `src/lib/page-meta.ts`

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The site is static, so the contact form hands off to the visitor's email client (pre-filled mailto); there is no backend submission.
- `trackEvent` calls Umami, but no Umami script is loaded in `index.html` yet, so events are currently dropped.
- Add new routes to `public/sitemap.xml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
