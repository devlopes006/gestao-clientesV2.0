<!-- .github/copilot-instructions.md - Guidance for AI coding agents -->
# Copilot instructions — gestao-clientes

Purpose: give short, actionable repository-specific guidance so an AI coding agent becomes productive immediately.

- Project type: Next.js 16 (App Router) + TypeScript + TailwindCSS. Runtime auth via Firebase + Firestore; Prisma/Postgres prepared but not yet primary.
- Package manager: pnpm preferred. Many dev scripts expect `pnpm` and `tsx` for Node scripts.

Quick commands

- Install: `pnpm install`
- Dev: `pnpm dev` (runs `next dev`)
- Build (Netlify wrapper): `pnpm build` (runs `scripts/netlify-build-with-guard.mjs`)
- Build only Next: `pnpm build:next` (useful when debugging build steps)
- Typecheck: `pnpm type-check`
- Format: `pnpm format`
- Unit tests: `pnpm test` (Vitest). E2E: `pnpm e2e` (Playwright).
- Prisma: `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:studio`.

Important files and places to inspect (examples)

- `package.json` — canonical list of scripts and dev dependencies (uses `tsx` and postinstall hooks).
- `next.config.ts` — image remotePatterns, headers, rewrites (uploads -> /api/uploads), Sentry integration, lowered server body size limit.
- `src/lib/firebase` — single-source Firebase initialization; backend logic should import from here.
- `lib/permissions.ts` — central permission helpers. Example usage: `import { can } from '@/lib/permissions'`.
- `prisma/schema.prisma` — schema for planned Postgres migration. Prisma client generated via `pnpm prisma:generate`.
- `firestore.rules` — production Firestore security rules; Firestore is the current runtime DB.
- `scripts/` — utility scripts (CSS var generation, prisma-generate wrapper, whatsapp helpers, billing backfill, netlify build guard).
- `src/proxy.ts` (middleware) — CSP and header handling are managed here; be careful when changing headers or CSP.
- `docs/WHATSAPP_*` — WhatsApp integration docs and quickstart; uses a fake gateway for local testing.

> Note: When modifying scripts or build pipeline, prefer `pnpm build:next` to isolate Next build issues from Netlify wrapper.

Project-specific conventions & patterns

- Use `pnpm` (or npm/yarn but `pnpm` is tested). Node 20+ expected.
- Scripts: many ad-hoc node scripts are written in ESM and invoked via `node` or `tsx`. Inspect `scripts/*.ts|.mjs` before changing invocation.
- Server-side logic that needs Firebase Admin should import from `src/lib/firebase` (avoid duplicate inits).
- Use `tsx` for running TypeScript scripts (e.g., `pnpm whatsapp:test`).
- Images: Next.js remote images use `next.config.ts` `remotePatterns` including S3/R2; signed URL flows exist — don't bluntly whitelist `*`.
- CSP: middleware-based CSP in `src/proxy.ts` and related docs; changes need end-to-end verification (Netlify/Edge differences).

Integration points & external services

- Firebase Auth & Firestore (runtime): auth flows, client SDKs in `src`, server-side admin in `src/lib/firebase`.
- Prisma/Postgres (planned/parallel persistence): `prisma/` contains schema and migrations; use `pnpm prisma:generate` and `prisma migrate` in CI when enabling.
- WhatsApp providers: meta/twilio/generic fake gateway. Docs live in `docs/WHATSAPP_*`. For local testing, use `WHATSAPP_PROVIDER=generic` and the fake gateway URL.
- Queues & caching: `bull`, Redis and `@upstash/redis` appear in code; inspect `src/services` and `scripts` for job processing patterns.
- S3/R2: images and media may come from AWS S3 or Cloudflare R2; `next.config.ts` references S3 via env `S3_BUCKET`.

What an AI agent should do first (practical checklist)

1. Run `pnpm install` and `pnpm dev` to confirm local start (use `.env.local` from `.env.example`).
2. Run `pnpm test` and `pnpm e2e:smoke` (Playwright smoke spec) — report failures and stack traces.
3. Inspect `src/lib/firebase`, `lib/permissions.ts`, `services/onboarding` and `prisma/schema.prisma` for data model mismatches before touching DB migration code.
4. If editing build or Netlify behavior, reproduce with `pnpm build:next` and then `pnpm build` (Netlify wrapper).

Hints & gotchas found in repo

- `FIREBASE_PRIVATE_KEY` must be stored escaped (\n) as noted in `README.md`. Never print or log raw private key.
- `scripts/netlify-build-with-guard.mjs` wraps `next build` — CI and Netlify deploys rely on it; changing it affects deploys.
- CSS variable generation runs in `postinstall` and `prebuild` hooks (`scripts/generate-css-vars.js`). If you change Tailwind tokens, ensure these scripts still run.
- Use `pnpm prisma:generate` after changing `schema.prisma`; migrations are not yet the canonical source of truth for runtime data (Firestore is), so coordinate migration carefully.

When in doubt

- Run the app locally and reproduce the problem end-to-end before large refactors.
- Prefer minimal, well-scoped changes and include tests where possible (`vitest` or Playwright for E2E).

Contact / context

- Repo README contains more operational notes and WhatsApp quickstarts. Search `docs/` for domain-specific guides (ex: `docs/WHATSAPP_SETUP_GUIDE.md`).

If any section is unclear or you'd like more detail (CI, Netlify, Prisma migration strategy, or WhatsApp flow), say which area to expand.
