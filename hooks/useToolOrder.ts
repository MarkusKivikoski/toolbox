import { useCallback, useMemo } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  DEFAULT_TOOL_ORDER,
  applyToolOrder,
  moveSlug,
  normalizeStoredOrder,
} from "@/lib/toolOrder";

const TOOL_ORDER_STORAGE_KEY = "toolbox.home.tool-order.v1";

/** The user's saved arrangement of a list of tools, persisted locally. */
export function useToolOrder<Item extends { slug: string }>(items: Item[]) {
  const { value: savedOrder, setValue: setSavedOrder } = useLocalStorageState({
    storageKey: TOOL_ORDER_STORAGE_KEY,
    defaultValue: DEFAULT_TOOL_ORDER,
    normalize: normalizeStoredOrder,
  });

  const orderedItems = useMemo(
    () => applyToolOrder(items, savedOrder),
    [items, savedOrder],
  );

  const moveItem = useCallback(
    (slug: string, targetIndex: number) =>
      setSavedOrder((previousOrder) =>
        moveSlug(
          applyToolOrder(items, previousOrder).map((item) => item.slug),
          slug,
          targetIndex,
        ),
      ),
    [items, setSavedOrder],
  );

  const resetOrder = useCallback(
    () => setSavedOrder(DEFAULT_TOOL_ORDER),
    [setSavedOrder],
  );

  const isCustomOrder = savedOrder.length > 0;

  return { orderedItems, moveItem, resetOrder, isCustomOrder };
}
