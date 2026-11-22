import type {
  BudgetState,
  MonthPlan,
  SavingsState,
  StatusTone,
} from "@/lib/budget";

/** Wording that changes between the salary-budget and trip modes. */
export const COPY = {
  salary: {
    tab: "Kuukausibudjetti",
    incomeHeading: "Kuukausitulot",
    sectionsHeading: "Budjetin osiot",
    sectionPlaceholder: "Osion nimi",
    sectionPlaceholderRest: "Osion nimi",
    fallbackNoun: "osio",
    addSection: "Lisää osio",
    emptySections: "Ei vielä osioita — lisää yksi aloittaaksesi budjetin jaon.",
    emptyDoughnut: "Lisää osion summa täyttääksesi donitsin.",
    doughnutCenter: "Budjetoitu / kk",
    doughnutSub: "kaikissa osioissa",
    allocatedLabel: "Allokoitu",
    paidLabel: "Maksettu",
    unpaidLabel: "Maksamattomia",
  },
  trip: {
    tab: "Matka",
    incomeHeading: "Matkabudjetti",
    sectionsHeading: "Matkan kulut",
    sectionPlaceholder: "esim. Lennot, Hotelli",
    sectionPlaceholderRest: "Kulun nimi",
    fallbackNoun: "kulu",
    addSection: "Lisää kulu",
    emptySections: "Ei vielä kuluja — lisää lennot, hotellit, ruoka, liput…",
    emptyDoughnut: "Lisää kulu täyttääksesi donitsin.",
    doughnutCenter: "Matkan hinta",
    doughnutSub: "kaikki kulut yhteensä",
    allocatedLabel: "Kulut yhteensä",
    paidLabel: "Maksettu",
    unpaidLabel: "Maksamatta",
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

/** Example monthly budget offered when there is no earlier month to copy. */
export const EXAMPLE_MONTH_PLAN: MonthPlan = {
  incomes: [
    { id: "income-salary", name: "Palkka", amount: "2800" },
    { id: "income-side", name: "Sivuprojektit", amount: "400" },
  ],
  sections: [
    { id: "section-rent", name: "Vuokra", amount: "950" },
    { id: "section-groceries", name: "Ruokaostokset", amount: "450" },
    { id: "section-transport", name: "Liikenne", amount: "160" },
    { id: "section-utilities", name: "Sähkö ja vesi", amount: "130" },
    { id: "section-subscriptions", name: "Tilaukset", amount: "60" },
    {
      id: "section-funmoney",
      name: "Ravintolat ja hauskanpito",
      amount: "200",
    },
  ],
};

const DEFAULT_SALARY_SAVINGS: SavingsState = {
  enabled: true,
  balance: "2000",
  target: "15000",
  perMonth: "",
  monthsUntilTrip: "",
};

const DEFAULT_TRIP_PLAN: BudgetState["trip"] = {
  incomes: [{ id: "trip-budget", name: "Matkabudjetti", amount: "" }],
  sections: [
    { id: "trip-flights", name: "Lennot", amount: "400" },
    { id: "trip-hotel", name: "Hotelli", amount: "600" },
    { id: "trip-food", name: "Ruoka", amount: "300" },
    { id: "trip-activities", name: "Aktiviteetit", amount: "200" },
    { id: "trip-transport", name: "Paikallisliikenne", amount: "100" },
  ],
  savings: {
    enabled: true,
    balance: "800",
    target: "",
    perMonth: "300",
    monthsUntilTrip: "5",
  },
};

/** No months yet — the current month is started from the example or from scratch. */
export const DEFAULT_STATE: BudgetState = {
  mode: "salary",
  months: {},
  salarySavings: DEFAULT_SALARY_SAVINGS,
  trip: DEFAULT_TRIP_PLAN,
};

/** Fallback plans for reading a pre-months (v1) save. */
export const LEGACY_FALLBACK = {
  salary: { ...EXAMPLE_MONTH_PLAN, savings: DEFAULT_SALARY_SAVINGS },
  trip: DEFAULT_TRIP_PLAN,
};

/** Wording for the month switcher and the not-yet-started-month prompt. */
export const MONTH_COPY = {
  previous: "Edellinen kuukausi",
  next: "Seuraava kuukausi",
  pickerToggle: "Valitse kuukausi",
  previousYear: "Edellinen vuosi",
  nextYear: "Seuraava vuosi",
  emptyHeading: "Tätä kuukautta ei ole vielä aloitettu",
  emptyHint: "Kopioi kulut edelliseltä kuukaudelta",
  copyFrom: (monthLabel: string) => `Kopioi kuukaudelta ${monthLabel}`,
  loadExample: "Kokeile esimerkkibudjetilla",
  startBlank: "Aloita tyhjästä",
  sharedSavingsHint: "Säästöt ovat yhteiset kaikille kuukausille.",
} as const;

/** Mode-independent wording for the paid-tracking UI. */
export const PAID_COPY = {
  allPaid: "Kaikki maksettu ✓",
  clearPaid: "Nollaa maksut",
  markPaid: (name: string) => `Merkitse maksetuksi: ${name}`,
} as const;
