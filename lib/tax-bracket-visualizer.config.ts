// Finnish personal income tax figures for one tax year — the single file to
// update when the numbers change. Everything the estimator knows about rates
// and thresholds lives here; the calculation logic in
// `lib/tax-bracket-visualizer.ts` never hardcodes a figure.
//
// The model is a deliberate rough estimate. It covers only the progressive
// state tax, the flat municipal tax, the employee TyEL + unemployment
// contributions and the automatic €750 tulonhankkimisvähennys. It leaves out
// the automatic tax credits (työtulovähennys, perusvähennys), health insurance
// contributions, the Yle tax, church tax, itemized deductions and capital
// income — so it somewhat OVERSTATES the tax compared to vero.fi's calculator.
//
// Rates are stored as percent numbers (12.64, 5.3) so they can be compared
// against Vero's published tables at a glance when updating.

/** The tax year every figure below belongs to. */
export const TAX_YEAR = 2026;

/**
 * Employee's earnings-related pension contribution (työntekijän TyEL-maksu).
 * Flat for all ages in 2026 — the higher 53–62 tier was abolished.
 * Source: https://www.elo.fi/fi-fi/tyonantaja/tyel-vakuuttaminen/tyel-maksu/sosiaalivakuutusmaksut-2026
 */
export const PENSION_CONTRIBUTION_RATE_PERCENT = 7.3;

/**
 * Employee's unemployment insurance contribution (palkansaajan
 * työttömyysvakuutusmaksu).
 * Source: https://www.tyollisyysrahasto.fi/uutiset/vuoden-2026-tyottomyysvakuutusmaksut-on-vahvistettu/
 */
export const UNEMPLOYMENT_INSURANCE_RATE_PERCENT = 0.89;

/**
 * Automatic deduction for work-related expenses (tulonhankkimisvähennys),
 * granted to everyone with wage income without itemizing; capped at the wage
 * income itself.
 * Source: https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/tulot-ja-vahennykset/tulonhankkimismenot/
 */
export const WAGE_INCOME_DEDUCTION_EUR = 750;

export type TaxBracket = {
  /** Taxable income the bracket starts at, inclusive. */
  lowerBound: number;
  /** Taxable income the bracket ends at, exclusive; null for the top bracket. */
  upperBound: number | null;
  /** Marginal rate applied to income inside the bracket. */
  ratePercent: number;
};

/**
 * Progressive state income tax scale (valtion tuloveroasteikko) for 2026.
 * The scale changed for 2026: five brackets, top rate 37.5 % from €52,100
 * (2025 had six brackets topping out at 44.25 %).
 * Source: https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/tulot-ja-vahennykset/ansiotulot/
 * (cross-checked against https://www.veronmaksajat.fi/neuvot/henkiloverotus/tyo-elake-ja-etuudet/ansiotulojen-verot-ja-maksut/valtion-tulovero/)
 */
export const STATE_TAX_BRACKETS: readonly TaxBracket[] = [
  { lowerBound: 0, upperBound: 22_000, ratePercent: 12.64 },
  { lowerBound: 22_000, upperBound: 32_600, ratePercent: 19.0 },
  { lowerBound: 32_600, upperBound: 40_100, ratePercent: 30.25 },
  { lowerBound: 40_100, upperBound: 52_100, ratePercent: 33.25 },
  { lowerBound: 52_100, upperBound: null, ratePercent: 37.5 },
];

export type Municipality = {
  id: string;
  name: string;
  ratePercent: number;
};

/**
 * Municipal income tax rates (kunnan tuloveroprosentti) 2026 for a curated set
 * of larger cities — the big-city rates are unchanged from 2025.
 * Source: https://www.vero.fi/syventavat-vero-ohjeet/paatokset/47465/kuntien-ja-seurakuntien-tuloveroprosentit-vuonna-2026/
 * (per-city figures cross-checked against Veronmaksajat's kuntaveroselvitys;
 * when updating yearly, eyeball against vero.fi's official attachment.)
 */
export const MUNICIPALITIES: readonly Municipality[] = [
  { id: "helsinki", name: "Helsinki", ratePercent: 5.3 },
  { id: "espoo", name: "Espoo", ratePercent: 5.3 },
  { id: "kauniainen", name: "Kauniainen", ratePercent: 4.7 },
  { id: "vantaa", name: "Vantaa", ratePercent: 6.4 },
  { id: "tampere", name: "Tampere", ratePercent: 7.6 },
  { id: "turku", name: "Turku", ratePercent: 7.1 },
  { id: "oulu", name: "Oulu", ratePercent: 8.1 },
  { id: "jyvaskyla", name: "Jyväskylä", ratePercent: 8.1 },
  { id: "kuopio", name: "Kuopio", ratePercent: 8.1 },
  { id: "lahti", name: "Lahti", ratePercent: 8.6 },
  { id: "pori", name: "Pori", ratePercent: 8.7 },
  { id: "joensuu", name: "Joensuu", ratePercent: 8.1 },
  { id: "lappeenranta", name: "Lappeenranta", ratePercent: 8.3 },
  { id: "hameenlinna", name: "Hämeenlinna", ratePercent: 8.4 },
  { id: "rovaniemi", name: "Rovaniemi", ratePercent: 8.9 },
  { id: "seinajoki", name: "Seinäjoki", ratePercent: 9.2 },
  { id: "vaasa", name: "Vaasa", ratePercent: 8.4 },
];

/** Sentinel municipality id meaning "the user sets the rate themselves". */
export const CUSTOM_MUNICIPALITY_ID = "custom";

/** Lowest 2026 municipal rate in mainland Finland (Kauniainen). */
export const CUSTOM_RATE_MIN_PERCENT = 4.7;
/** Highest 2026 municipal rate in mainland Finland (Pomarkku). */
export const CUSTOM_RATE_MAX_PERCENT = 10.9;
/** Municipal rates are set at 0.1 pp precision since 2024. */
export const CUSTOM_RATE_STEP_PERCENT = 0.1;
/** Close to the 2026 income-weighted national average of 7.57 %. */
export const CUSTOM_RATE_DEFAULT_PERCENT = 7.6;
