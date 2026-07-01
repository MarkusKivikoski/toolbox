import type { BudgetState, StatusTone } from "@/lib/budget";

/** Wording that changes between the salary-budget and trip modes. */
export const COPY = {
  salary: {
    tab: "Monthly budget",
    incomeHeading: "Monthly income",
    sectionsHeading: "Budget sections",
    sectionPlaceholder: "Section name",
    sectionPlaceholderRest: "Section name",
    fallbackNoun: "section",
    addSection: "Add section",
    emptySections: "No sections yet — add one to start splitting up your budget.",
    emptyDoughnut: "Add a section amount to fill in the doughnut.",
    doughnutCenter: "Budgeted / month",
    doughnutSub: "across all sections",
    allocatedLabel: "Allocated",
  },
  trip: {
    tab: "Trip",
    incomeHeading: "Trip budget",
    sectionsHeading: "Trip costs",
    sectionPlaceholder: "e.g. Flights, Hotel",
    sectionPlaceholderRest: "Cost name",
    fallbackNoun: "cost",
    addSection: "Add cost",
    emptySections: "No costs yet — add flights, hotels, food, tickets…",
    emptyDoughnut: "Add a cost to fill in the doughnut.",
    doughnutCenter: "Trip cost",
    doughnutSub: "across all costs",
    allocatedLabel: "Total cost",
  },
} as const;

/** Tailwind class buckets keyed by the tone the domain layer picks. */
export const TONE: Record<StatusTone, string> = {
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  amber:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
};

export const DEFAULT_STATE: BudgetState = {
  mode: "salary",
  salary: {
    incomes: [
      { id: "income-salary", name: "Salary", amount: "2800" },
      { id: "income-side", name: "Side projects", amount: "400" },
    ],
    sections: [
      { id: "section-rent", name: "Rent", amount: "950" },
      { id: "section-groceries", name: "Groceries", amount: "450" },
      { id: "section-transport", name: "Transport", amount: "160" },
      { id: "section-utilities", name: "Utilities", amount: "130" },
      { id: "section-subscriptions", name: "Subscriptions", amount: "60" },
      { id: "section-funmoney", name: "Eating out & fun", amount: "200" },
    ],
    savings: {
      enabled: true,
      balance: "2000",
      target: "15000",
      perMonth: "",
      monthsUntilTrip: "",
    },
  },
  trip: {
    incomes: [{ id: "trip-budget", name: "Trip budget", amount: "" }],
    sections: [
      { id: "trip-flights", name: "Flights", amount: "400" },
      { id: "trip-hotel", name: "Hotel", amount: "600" },
      { id: "trip-food", name: "Food", amount: "300" },
      { id: "trip-activities", name: "Activities", amount: "200" },
      { id: "trip-transport", name: "Local transport", amount: "100" },
    ],
    savings: {
      enabled: true,
      balance: "800",
      target: "",
      perMonth: "300",
      monthsUntilTrip: "5",
    },
  },
};
