export type Tool = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  href: string;
  status: "live" | "soon";
};

// Add new tools here — the home page renders this list automatically.
export const tools: Tool[] = [
  {
    slug: "investing-calculator",
    name: "Investing Calculator",
    description:
      "Project your portfolio with variable monthly contributions, then model living off it in retirement.",
    emoji: "📈",
    href: "/tools/investing-calculator",
    status: "live",
  },
  {
    slug: "darts-score",
    name: "Darts Score Tracker",
    description:
      "Track X01 darts games — pick players, enforce official out-rules, and get checkout suggestions.",
    emoji: "🎯",
    href: "/tools/darts-score",
    status: "live",
  },
  {
    slug: "cost-of-living",
    name: "Cost of Living Calculator",
    description:
      "Compare a Finnish salary across two years — see if your pay kept up with inflation and what it should be today.",
    emoji: "💶",
    href: "/tools/cost-of-living",
    status: "live",
  },
  {
    slug: "budget-visualizer",
    name: "Budget Visualizer",
    description:
      "Break a monthly budget — or a trip's costs — into a doughnut, with a savings goal that tells you when you'll get there.",
    emoji: "🍩",
    href: "/tools/budget-visualizer",
    status: "live",
  },
  {
    slug: "currency-converter",
    name: "Currency Converter",
    description:
      "Convert one amount into several currencies at once — free daily reference rates, cached so it works offline.",
    emoji: "💱",
    href: "/tools/currency-converter",
    status: "live",
  },
  {
    slug: "tax-bracket-visualizer",
    name: "Tax Bracket Visualizer",
    description:
      "See how Finnish 2026 income tax eats a gross salary — progressive brackets, net pay, and your marginal rate on the next euro.",
    emoji: "🧾",
    href: "/tools/tax-bracket-visualizer",
    status: "live",
  },
];
