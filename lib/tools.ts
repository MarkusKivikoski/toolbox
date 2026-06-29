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
      "Enter a Finnish salary and a year, then see what that money was really worth in any other year since 1860.",
    emoji: "💶",
    href: "/tools/cost-of-living",
    status: "live",
  },
];
