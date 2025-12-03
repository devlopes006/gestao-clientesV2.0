# Color Token Mapping — Read-only

Generated: 2025-12-03
Purpose: provide a safe, read-only mapping between runtime CSS variables defined in `src/app/globals.css` and the project tokens defined in `src/styles/tokens.ts` and `src/styles/design-system.ts`.

Overview

- I inspected `src/app/globals.css`, `src/styles/tokens.ts`, and `src/styles/design-system.ts`.
- This file lists CSS variables (from `globals.css`) and the nearest canonical tokens in `tokens.ts` / `design-system.ts`.
- Notes include format mismatches (HEX vs HSL), missing tokens, and recommended next steps.

Mapping (CSS variable → canonical token(s) / notes)

## Brand / Studio

- `--color-brand-50` … `--color-brand-900`
  - Canonical: `src/styles/tokens.ts` → `colors.brand[50..900]`
  - Notes: exact hex palette match; these are safe to keep in `tokens.ts` as canonical.

- `--studio-card-bg`
  - Canonical: `src/styles/tokens.ts` → `studioTokens.cardBg` (also in `design-system.colors` / `studioTokens`)
  - Notes: matched.

- `--studio-card-border`
  - Canonical: `src/styles/tokens.ts` → `studioTokens.cardBorder`

- `--studio-card-radius`
  - Canonical: `src/styles/tokens.ts` → `studioTokens.cardRadius`

- `--studio-card-shadow`
  - Canonical: `src/styles/tokens.ts` → `studioTokens.cardShadow`

- `--studio-accent-gradient`
  - Canonical: `src/styles/tokens.ts` → `studioTokens.accentGradient` / `design-system.colors.gradients.studio`

## App role tokens (runtime, HSL values in CSS)

Note: these CSS variables in `globals.css` often contain HSL numeric parts (e.g. `222.2 47.4% 11.2%`) intended to be used with `hsl(var(--primary))`. `design-system.ts` and `tokens.ts` usually store HEX strings; conversion is required to make them identical.

- `--background`
  - Canonical: neutral `designSystem.colors.slate.50` / `tokens` neutral values
  - Notes: `--background: 0 0% 100%` corresponds to white; no direct single-token name in `design-system`, but equivalent to `slate.50` (`#F8FAFC`) in many places.

- `--foreground`
  - Canonical: `designSystem.colors.slate.900` (approx)
  - Notes: HSL `222.2 84% 4.9%` → ~ `#0f172a` (slate.900). Use tokens instead of hard-coded hexs.

- `--card`, `--card-foreground`, `--popover`, `--popover-foreground`
  - Canonical: role-based, derive from `designSystem.colors.slate` and semantic tokens. No single token names present; recommend mapping these roles to appropriate `designSystem` tokens.

- `--primary`, `--primary-foreground`
  - Canonical: `src/styles/design-system.ts` → `colors.brand.primary` (`#6157FF`) and `tokens.brand.DEFAULT` (`#6157FF`)
  - Notes: CSS var uses HSL numeric; conversion needed to align exact value. Tailwind uses `primary: { DEFAULT: 'hsl(var(--primary))' }` so runtime HSL variables are required for dynamic theming.

- `--secondary`, `--secondary-foreground`
  - Canonical: `designSystem.colors.brand.secondary` (`#8E54E9`) / fallback to neutral palette depending on usage.

- `--muted`, `--muted-foreground`
  - Canonical: `designSystem.colors.slate.100/500` depending on contrast; no single token — treat as semantic alias.

- `--accent`, `--accent-foreground`
  - Canonical: relates to `designSystem.colors` semantic entries

- `--destructive`, `--destructive-foreground`
  - Canonical: `designSystem.colors.semantic.danger.DEFAULT` (`#DC2626`) or `tokens.status.danger`
  - Notes: CSS var HSL vs token HEX mismatch.

- `--border`, `--input`, `--ring`
  - Canonical: derive from `designSystem.colors.slate.*` or `designSystem.shadows.focus` (for ring)

- `--chart-1` … `--chart-5`
  - Canonical: not explicitly in `design-system.colors`; chart colors are present inline in components and partially covered by `tokens.ts` -> `status` colors (e.g., `#10B981` etc.).
  - Recommendation: add a `chart` palette to `tokens.ts` if we want canonical chart colors.

## Sidebar tokens

- `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
  - Canonical: role-level tokens; not 1:1 in `design-system`. Map to neutral or semantic tokens depending on visual design (e.g., `sidebar-primary` → `brand.primary` or `slate.*`).

## Hard-coded hexs found in components

- Many components and CSS modules contain direct HEX values (examples: `#0f172a`, `#f8fafc`, `#e6e9ee`, `#3b82f6`, `#ef4444`).
  - Canonical: these typically equal `designSystem.colors.slate.*` or `tokens.brand` / `tokens.status` values.
  - Recommendation: replace direct hexs with `var(--...)` or import tokens where appropriate.

Conversion notes (HEX ↔ HSL)

- Because `globals.css` intentionally uses HSL numeric components (to allow `hsl(var(--...))` and easier alpha adjustments), any generator must convert HEX tokens in `tokens.ts`/`design-system.ts` into HSL numeric strings for CSS variables.
- Example conversion: `#6157FF` → `hsl(249.6 100% 63.1%)` (numbers here are an example; generator should compute accurate H, S, L numbers and format as `H S% L%` or `H S% L% / A` if alpha needed).
- Keep both formats: store canonical HEX in `tokens.ts` (for use at build time and non-themeable cases) and generate HSL variables for runtime theming.

Missing or weak mappings

- `chart-*` variables: not explicitly present in `design-system`; add `tokens.chart` in `tokens.ts`.
- `sidebar-*` role tokens: no direct canonical keys; add mapping entries in `tokens.ts` or document their derived origin.
- Some gradients exist in `design-system` but not referenced by CSS variables; consider exposing gradient CSS variables (e.g. `--gradient-brand`) if used in runtime theming.

Non-destructive next steps (recommended)

1. Use `src/styles/tokens.ts` as canonical SOT (machine-friendly HEX tokens).
2. Create a generator script that:
   - Reads `tokens.ts` (and fallback to `design-system.ts` for missing keys),
   - Converts necessary HEX values to HSL numeric format,
   - Emits `src/styles/generated-vars.css` containing `:root { --primary: 249.6 100% 63.1%; ... }` and `.dark { ... }` entries.
3. `globals.css` should import `generated-vars.css` (or the generator writes into `globals.css` in a marked block), ensuring runtime vars are in sync and are the only place runtime HSL variables are defined.
4. Update `design-system.ts` to import `tokens.ts` for values to avoid duplicated literals (small refactor)
5. Replace hard-coded hex values in components progressively with `var(--...)` or imports from `tokens.ts`.

How to verify (quick checks)

- Dev run: start dev server and check that `hsl(var(--primary))` produces the same visible color as `designSystem.colors.brand.primary`.
- Visual smoke: check `/login` and a few representative pages (KPI cards, header, sidebar) for color regressions.
- Automated: test script that compares converted HSL values (from generator) back to HEX to ensure delta < 1% (optional precision check).

Next steps after review

- After you approve, I will implement the generator script and create `src/styles/generated-vars.css`, update `globals.css` to import it, and refactor `design-system.ts` to reference `tokens.ts` where appropriate. I will run the dev server and verify visually that styles remain consistent.

If you want me to proceed, reply: `Proceed with generator` and I'll implement the non-destructive generator + wire-up and run a local dev verification.

---

File: `docs/COLOR_TOKEN_MAPPING.md` — read-only mapping draft (created by assistant).
