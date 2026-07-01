import { useEffect, useState } from "react";
import { normalizeState, type BudgetState } from "@/lib/budget";
import { DEFAULT_STATE } from "../copy";

const STORAGE_KEY = "toolbox.budget-visualizer.state.v1";

/**
 * Hold the budget state in `localStorage` with the standard hydration guard:
 * load once on mount, then persist on every change once hydrated.
 */
export function usePersistedBudgetState() {
  const [state, setState] = useState<BudgetState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeState(JSON.parse(raw), DEFAULT_STATE));
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.warn("Could not load the saved budget:", error);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.warn("Could not save the budget:", error);
    }
  }, [state, hydrated]);

  return { state, setState, hydrated };
}
