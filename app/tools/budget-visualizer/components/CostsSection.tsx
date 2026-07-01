import type { RefObject } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { colorForIndex, parseAmount, type BudgetRow, type Mode } from "@/lib/budget";
import type { COPY } from "../copy";
import RowEditor from "./RowEditor";
import AddButton from "./AddButton";

type Props = {
  copy: (typeof COPY)[Mode];
  sections: BudgetRow[];
  listRef: RefObject<HTMLDivElement | null>;
  dragId: string | null;
  focusRowId: string | null;
  onAutoFocused: () => void;
  onName: (id: string, value: string) => void;
  onAmount: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onActiveChange: (id: string | null) => void;
  onDragPointerDown: (event: ReactPointerEvent, id: string) => void;
  onMoveSection: (from: number, to: number) => void;
};

/** Spending sections / trip costs: a reorderable list of coloured line items. */
export default function CostsSection({
  copy,
  sections,
  listRef,
  dragId,
  focusRowId,
  onAutoFocused,
  onName,
  onAmount,
  onRemove,
  onAdd,
  onActiveChange,
  onDragPointerDown,
  onMoveSection,
}: Props) {
  return (
    <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {copy.sectionsHeading}
      </span>
      <div ref={listRef} className={`mt-2 space-y-2 ${dragId ? "select-none" : ""}`}>
        {sections.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
            {copy.emptySections}
          </p>
        )}
        {sections.map((row, index) => {
          const amount = parseAmount(row.amount);
          return (
            <RowEditor
              key={row.id}
              row={row}
              ariaPrefix={`Section ${index + 1}`}
              namePlaceholder={
                index === 0 ? copy.sectionPlaceholder : copy.sectionPlaceholderRest
              }
              fallbackNoun={copy.fallbackNoun}
              showDot
              dotColor={amount > 0 ? colorForIndex(index) : undefined}
              autoFocus={row.id === focusRowId}
              onAutoFocused={onAutoFocused}
              onName={(value) => onName(row.id, value)}
              onAmount={(value) => onAmount(row.id, value)}
              onRemove={() => onRemove(row.id)}
              onMouseEnter={() =>
                !dragId && amount > 0 ? onActiveChange(row.id) : undefined
              }
              onMouseLeave={() => !dragId && onActiveChange(null)}
              dragging={row.id === dragId}
              onDragPointerDown={(event) => onDragPointerDown(event, row.id)}
              onHandleKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  onMoveSection(index, index - 1);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  onMoveSection(index, index + 1);
                }
              }}
            />
          );
        })}
      </div>
      <AddButton label={copy.addSection} onClick={onAdd} />
    </div>
  );
}
