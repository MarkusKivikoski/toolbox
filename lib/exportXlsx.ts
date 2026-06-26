import type { InvestingInput, InvestingResult } from "./investing";
import {
  buildInputRows,
  buildSummaryRows,
  buildProjectionRows,
} from "./spreadsheet";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Build an .xlsx workbook (Inputs / Summary / Projection sheets) as a Blob.
 * `xlsx` is imported dynamically so it only loads when the user exports.
 */
export async function toXlsxBlob(
  result: InvestingResult,
  input: InvestingInput
): Promise<Blob> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const inputs = XLSX.utils.aoa_to_sheet([["Inputs"], [], ...buildInputRows(input)]);
  const summary = XLSX.utils.aoa_to_sheet([
    ["Summary"],
    [],
    ...buildSummaryRows(result, input),
  ]);
  const projection = XLSX.utils.aoa_to_sheet([
    ["Year-by-year"],
    [],
    ...buildProjectionRows(result),
  ]);
  projection["!cols"] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 9 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, inputs, "Inputs");
  XLSX.utils.book_append_sheet(wb, summary, "Summary");
  XLSX.utils.book_append_sheet(wb, projection, "Projection");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], { type: XLSX_MIME });
}
