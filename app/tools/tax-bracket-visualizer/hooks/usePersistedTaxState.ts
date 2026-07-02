import { useEffect, useState } from "react";
import { normalizeTaxToolState, type TaxToolState } from "@/lib/tax-bracket-visualizer";
import { DEFAULT_STATE } from "../constants";

const STORAGE_KEY = "toolbox.tax-bracket-visualizer.state.v1";

/**
 * Hold the tax tool inputs in `localStorage` with the standard hydration
 * guard: load once on mount, then persist on every change once hydrated.
 */
export function usePersistedTaxState() {
  const [state, setState] = useState<TaxToolState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeTaxToolState(JSON.parse(raw), DEFAULT_STATE));
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.warn("Could not load the saved tax inputs:", error);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.warn("Could not save the tax inputs:", error);
    }
  }, [state, hydrated]);

  return { state, setState, hydrated };
}
