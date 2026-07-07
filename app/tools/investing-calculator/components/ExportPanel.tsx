import { useState } from "react";
import type { InvestingInput, InvestingResult } from "@/lib/investing";
import { toCsv } from "@/lib/exportCsv";
import { toXlsxBlob } from "@/lib/exportXlsx";
import { download } from "@/lib/download";
import { dateStamp } from "@/lib/utils";
import { EXPORT_FILENAME_BASE } from "../constants";

type ExportPanelProps = {
  result: InvestingResult;
  input: InvestingInput;
};

/** Spreadsheet export card — .xlsx (lazy-loaded SheetJS) and .csv. */
export default function ExportPanel({ result, input }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const exportName = `${EXPORT_FILENAME_BASE}-${dateStamp()}`;

  const handleExportCsv = () =>
    download(`${exportName}.csv`, "text/csv;charset=utf-8", toCsv(result, input));

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      const blob = await toXlsxBlob(result, input);
      download(`${exportName}.xlsx`, blob.type, blob);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Export projection
        </div>
        <div className="text-xs text-zinc-400">
          Inputs, summary and year-by-year — for Excel / LibreOffice.
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExportXlsx}
          disabled={isExporting}
          className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {isExporting ? "Generating…" : "Excel (.xlsx)"}
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          CSV
        </button>
      </div>
    </div>
  );
}
