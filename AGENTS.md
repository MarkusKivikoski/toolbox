# Toolbox — agent guide

## What this repo is

A personal collection of small, self-contained browser tools. No backend, no auth, no database. Every tool runs entirely client-side and persists state in `localStorage`. The site is a statically exported Next.js app deployed on Netlify.

The goal is simplicity: each tool does one thing well, lives at its own URL, and works well on mobile.

## Current tools

| Slug | Name | Description |
|---|---|---|
| `investing-calculator` | Investing Calculator | Portfolio growth projection with variable contribution phases and retirement drawdown modelling |
| `darts-score` | Darts Score Tracker | X01 darts scorekeeping — per-dart entry, official out-rules, bust logic, checkout suggestions, legs/sets formats |
| `cost-of-living` | Cost of Living Calculator | Finnish purchasing-power converter — adjusts a net/gross salary between any two years (1860–present) using Statistics Finland's cost-of-living index, with markka equivalents |

## Architecture conventions

### Adding a new tool — the required steps

1. **Register it** — add an entry to `lib/tools.ts`. The home page renders the grid automatically from this array. Required fields: `slug`, `name`, `description`, `emoji`, `href`, `status`.
2. **Create the route** — `app/tools/<slug>/page.tsx` is a server component. It exports `metadata` (title + description), renders a breadcrumb nav (`Toolbox /` → tool name), a `<header>` with the emoji + name + one-line description, then mounts the client component.
3. **Client component** — the interactive logic lives in `app/tools/<slug>/<ToolName>.tsx` with `"use client"` at the top. Complex tools colocate sub-components in the same folder; shared components go in `components/`.
4. **Pure logic** — business/calculation logic lives in `lib/<slug>.ts` with zero React imports. This keeps it unit-testable and importable from anywhere.

### localStorage persistence

Every tool that needs persistence follows the hydration-guard pattern:

```ts
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  // load from localStorage
  setHydrated(true);
}, []);

useEffect(() => {
  if (!hydrated) return;
  // write to localStorage
}, [data, hydrated]);
```

Key naming convention: `toolbox.<slug>.<purpose>.v<n>` — e.g. `toolbox.darts-score.game.v1`.

When a stored schema gains new fields, add a `normalizeXxx()` migration function that backfills defaults at load time so old saves don't crash.

### Styling

- Tailwind v4 (PostCSS-based) — no config file, utilities only.
- Mobile-first: base styles for mobile, `sm:`/`lg:` for wider screens.
- Palette: zinc neutrals, emerald accent (primary actions / active state), amber warnings/undo.
- Cards: `rounded-2xl border bg-white dark:bg-zinc-900` — always support dark mode via `dark:` prefix.
- Numbers: `tabular-nums` on any figure that changes value at runtime.

### Path alias

`@/*` maps to the repo root. Use it for all cross-folder imports.

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
