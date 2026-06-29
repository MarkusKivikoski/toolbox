# 🧰 Toolbox

A small collection of focused, self-contained web tools — built with Next.js (App Router) and Tailwind CSS.

<!-- Replace YOUR_BADGE_ID / your-site after creating the Netlify site (Site configuration → Status badges). -->
[Running on Netlify](https://macbox.netlify.app/)

## Tools

| Tool | Description |
| ---- | ----------- |
| 📈 [Investing Calculator](/tools/investing-calculator) | Project a portfolio with variable monthly contributions (phases) on an age-based timeline, then model living off it in retirement — fixed withdrawal or a "spend it all" mode that solves for the most you can draw (rising with inflation) so the pot empties at life expectancy. Models Finnish capital-gains tax (30% default, with hankintameno-olettama) on the realised gain, with a net/gross switch, plus an optional **kansaneläke** (state pension) added to monthly income. Inflation-adjusted view, a responsive touch-friendly chart, named scenarios you can save (e.g. "Child's fund"), and **export to Excel (.xlsx) / CSV**. |
| 💶 [Cost of Living Calculator](/tools/cost-of-living) | See what a Finnish salary was really worth in any year. Enter a net or gross figure and its year, pick another year, and it converts the buying power using **Statistics Finland's cost-of-living index** (1914:1–6 = 100, annual averages **1860–present**) — the same series behind the official money-value converter, spanning the 1963 currency reform and the 2002 euro changeover. Shows the equivalent in euros, the **markka** amount Finns actually paid (5.94573 mk/€), cumulative and average annual inflation, and a chart of equal buying power across the years. |

All state is client-side (localStorage) — no backend, no accounts.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks + lints)
```

## Project layout

```
app/
  page.tsx                         # home — tool grid
  layout.tsx                       # shell (header / footer)
  tools/
    investing-calculator/
      page.tsx                     # route + metadata
      InvestingCalculator.tsx      # the interactive UI (client)
components/
  BalanceChart.tsx                 # dependency-free SVG chart
lib/
  investing.ts                     # pure projection engine (no React)
  format.ts                        # currency / duration formatters
  tools.ts                         # tool registry (drives the home page)
```

## Adding a tool

1. Create `app/tools/<slug>/page.tsx` (and supporting components).
2. Add an entry to the `tools` array in [`lib/tools.ts`](lib/tools.ts) — the home page picks it up automatically.

Keep tool-specific logic in a pure module under `lib/` where practical, so it can be reasoned about and tested without the UI.

## Deploy

The app is a **static export** (`output: "export"` in [`next.config.ts`](next.config.ts)) and is deployed to **Netlify** by **GitHub Actions** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

- Push to `main` → production deploy.
- Pull request → preview deploy (URL commented on the PR).

The workflow builds `out/` and uploads it; Netlify only hosts the prebuilt files (the site is intentionally **not** Git-connected, so Actions is the single deployer). It needs two repository secrets — `NETLIFY_AUTH_TOKEN` (a Netlify personal access token) and `NETLIFY_SITE_ID` (the site's API ID).

```bash
npm run build      # emits the static site to ./out
npx serve out      # optional: preview the export locally
```
