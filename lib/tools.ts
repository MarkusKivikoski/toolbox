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
];
