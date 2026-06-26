import type { InvestingInput, InvestingResult } from "./investing";
import {
  buildInputRows,
  buildSummaryRows,
  buildProjectionRows,
  type Cell,
} from "./spreadsheet";

// fi-FI numbers: comma decimal, no grouping — pairs with the ";" delimiter so
// Finnish Excel/LibreOffice parse the cells as numbers.
const fiNumber = new Intl.NumberFormat("fi-FI", {
  useGrouping: false,
  maximumFractionDigits: 2,
});

function cell(v: Cell): string {
  if (typeof v === "number") return Number.isFinite(v) ? fiNumber.format(v) : "";
  if (/[;"\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const rowsToCsv = (rows: Cell[][]): string =>
  rows.map((r) => r.map(cell).join(";")).join("\r\n");

/** Build a single semicolon-delimited, UTF-8-BOM CSV with all sections stacked. */
export function toCsv(result: InvestingResult, input: InvestingInput): string {
  const rows: Cell[][] = [
    ["Investing calculator"],
    [],
    ["Inputs"],
    ...buildInputRows(input),
    [],
    ["Summary"],
    ...buildSummaryRows(result, input),
    [],
    ["Year-by-year"],
    ...buildProjectionRows(result),
  ];
  // Lead with a UTF-8 BOM so Excel reads € / ä / ö correctly.
  return String.fromCharCode(0xfeff) + rowsToCsv(rows);
}
