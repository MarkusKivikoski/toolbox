# Toolbox — agent guide

## What this repo is

A personal collection of small, self-contained browser tools. No backend, no auth, no database. Every tool runs entirely client-side and persists state in `localStorage`. The site is a statically exported Next.js app deployed on Netlify.

The goal is simplicity: each tool does one thing well, lives at its own URL, and works well on mobile.

## Current tools

| Slug                   | Name                      | Description                                                                                                                                                                                                        |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `investing-calculator` | Investing Calculator      | Portfolio growth projection with variable contribution phases and retirement drawdown modelling                                                                                                                    |
| `darts-score`          | Darts Score Tracker       | X01 darts scorekeeping — per-dart entry, official out-rules, bust logic, checkout suggestions, legs/sets formats                                                                                                   |
| `cost-of-living`       | Cost of Living Calculator | Finnish salary-history comparison — enter pay for two years (1860–present) and see the inflation-parity target ("should now be X") and the real buying-power change, via Statistics Finland's cost-of-living index |

## Architecture conventions

### Adding a new tool — the required steps

1. **Register it** — add an entry to `lib/tools.ts`. The home page renders the grid automatically from this array. Required fields: `slug`, `name`, `description`, `emoji`, `href`, `status`.
2. **Create the route** — `app/tools/<slug>/page.tsx` is a server component. It exports `metadata` (title + description), renders a breadcrumb nav (`Toolbox /` → tool name), a `<header>` with the emoji + name + one-line description, then mounts the client component.
3. **Client component** — the interactive logic lives in `app/tools/<slug>/<ToolName>.tsx` with `"use client"` at the top. Complex tools colocate sub-components in the same folder; shared components go in `components/`.
4. **Domain logic** — business/calculation logic lives in `lib/<slug>.ts` with zero React imports. This keeps it unit-testable and importable from anywhere.
5. **Generic helpers** — non-domain utilities (formatting, ID generation, debounce, clamp, etc. — things that don't encode a business rule) live in `app/tools/<slug>/utils.ts`. If a helper is genuinely reused across multiple tools, promote it to `lib/utils.ts` instead of duplicating it.
   Rule of thumb: if a helper needs the spec/requirements to explain _why_ it does what it does (e.g. "checkout suggestions follow official darts out-rules"), it's domain logic → `lib/<slug>.ts`. If you could paste it into an unrelated project unchanged, it's a generic helper → `utils.ts`.

## Workflow for new or refactored tools

Before writing implementation code for anything non-trivial, propose
a file breakdown (component tree + hooks + what state/logic lives
where) as a short list. Wait for confirmation, then implement file by
file, not as one giant component.

## Component structure

- No component file should exceed ~150 lines unless absolutely necessary. If a page-level component
  is trending past that, stop, think if the component needs to be this big, and split if needed before continuing.
- A function component defined inline inside another component's file
  (rather than at module scope and exported) is a smell — if it's
  generic/reusable (form fields, buttons, list rows) it belongs in
  `components/`, even if only used once today.
- Stateful logic that isn't rendering (persistence, drag/reorder,
  subscriptions, polling) belongs in a custom hook under `hooks/`,
  named `use<Thing>`, not inlined in the component body.
- Two near-duplicate JSX blocks gated by a mode/variant (e.g. an
  if/else rendering two ~100-line panels) should be split into two
  named components, not left as inline branches.
- Config/copy objects (labels, tone maps, static text per mode)
  live in their own file, not at the top of the component file.
- For any tool with more than one render-affecting concern (persistence, drag,
  derived calculations, multi-mode UI), colocate inside `app/tools/<slug>/`:
  - `components/` — presentational pieces
  - `hooks/` — non-visual stateful logic
- One default export per file, named to match the filename.
- Custom hooks return either a single value/tuple (`useX(): [state, setState]`)
  or a named object (`useX(): { value, setValue }`) — never a bare positional
  array with more than 2 elements.
- No `useEffect` for derived state — if a value can be computed from
  props/state during render (or via `useMemo`), it's not an effect.
- Barrel (`index.ts` re-export) files only at the `components/` folder level,
  and only once 3+ siblings are imported elsewhere. Don't add one reflexively.

## Naming & readability

- Never use single-letter or otherwise non-semantic variable names, even in
  short callbacks. Write the noun.

```ts
// Bad
students.map((s) => s.name);

// Good
students.map((student) => student.name);
```

This applies everywhere: `.map`, `.filter`, `.reduce`, destructuring,
loop variables — not just top-level variables.

- No abbreviations in identifiers unless truly universal (`id`, `url`,
  `props` are fine; `btn`, `usr`, `cfg` are not).
- Boolean props/state are prefixed `is`/`has`/`should`
  (`isLoading`, `hasError`, `shouldReset`) — never a bare adjective.
  Reserve bare `error` for the actual error object/message, not a boolean flag.
- Event handler props are named `onX`; the implementations they're wired to
  are named `handleX` (`onSubmit={handleSubmit}`, not `onSubmit={submit}`).

## No slop code

- No module-level mutable counters or globals used to fake unique IDs,
  e.g.:

```ts
// Bad — module-level mutable state, not tied to component lifecycle
let rowSeq = 0;
const newRowId = () => `row-${++rowSeq}-${Date.now()}`;
```

Use `crypto.randomUUID()` for IDs generated outside render, or React's
`useId()` when the ID is tied to a specific component instance. Do **not**
reach for `useState` here either — a counter that exists only to mint an
ID isn't UI state, and wrapping it in `useState` just adds a pointless
re-render on every mint.

- No `any`. If a type is genuinely unknown at that point, use `unknown` and
  narrow it before use.
- No magic numbers or magic strings. Any literal that isn't self-evidently a
  one-off — timeouts, thresholds, breakpoints, animation durations, debounce
  delays, `maxLength`, retry counts, storage key versions — gets hoisted to a
  named `const`, either at module scope or in a `constants.ts` alongside the
  tool.

```ts
// Bad
setTimeout(() => setConfirmReset(false), 3000);

// Good
const RESET_CONFIRM_TIMEOUT_MS = 3000;
setTimeout(() => setConfirmReset(false), RESET_CONFIRM_TIMEOUT_MS);
```

Same applies to a repeated Tailwind class string that encodes a design
decision (a specific "danger" border color, a specific shadow) — pull it
into a constant or design-token map instead of repeating the literal in
five places.

- Prefer discriminated unions over optional-field soup for variant state.
  If a tool has modes (like salary vs. trip budgeting), model it as
  `{ mode: "a"; a: AState } | { mode: "b"; b: BState }` where practical,
  rather than a flat object where half the fields are only valid in one mode.

## Types

- Derive types from Zod schemas (or similar) at I/O boundaries — form input,
  localStorage reads, any external data — rather than hand-writing parallel
  interfaces that can drift from validation.
- `normalizeXxx()` migration functions (see below) should return the
  validated/derived type, not `any`/`unknown` cast through.

### localStorage persistence

Every tool that needs persistence uses the shared hook
`useLocalStorageState` from `@/hooks/useLocalStorageState` (built on
`useSyncExternalStore`; its React-free core lives in
`lib/localStorageStore.ts` and is unit-tested). Do **not** hand-roll the old
two-effect "hydration guard" — synchronous `setState` in a mount effect trips
`react-hooks/set-state-in-effect`.

```ts
const normalizeStoredThing = (stored: unknown): Thing => /* validate + backfill */;

const { value, setValue, hydrated } = useLocalStorageState({
  storageKey: "toolbox.<slug>.<purpose>.v<n>",
  defaultValue: DEFAULT_THING,        // module-level const
  normalize: normalizeStoredThing,    // module-level const
  legacy: { storageKey: OLD_KEY, migrate: fromLegacy }, // optional old-key fallback
});
```

Rules and behavior:

- `defaultValue`, `normalize`, and `legacy` must be stable module-level
  values — `defaultValue` doubles as the prerender/SSR snapshot.
- The prerender and hydration render see `defaultValue`; use `hydrated`
  (false until after hydration) to gate a `Loading…` placeholder.
- Writes happen synchronously in `setValue` (which also accepts updater
  functions) — there is no separate persist effect. Edits made in another
  tab propagate automatically via the `storage` event.
- Per-tool wrappers (e.g. `usePersistedBudgetState`) supply the key, default,
  and normalizer, and live in the tool's `hooks/` folder as before. Truly
  shared hooks live in the repo-root `hooks/` folder.

Key naming convention: `toolbox.<slug>.<purpose>.v<n>` — e.g. `toolbox.darts-score.game.v1`.

When a stored schema gains new fields, extend the `normalizeXxx()` migration
function so it backfills defaults at load time and old saves don't crash; for
a key/shape change, bump `v<n>` and read the old key via the `legacy` option
(migrated data is re-written to the new key on the first edit).

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
