import { TICK_COLUMNS, TICK_TONE, TICK_TONE_OFF } from "../copy";

export type TickColumn = keyof typeof TICK_COLUMNS;

type Props = {
  column: TickColumn;
  isOn: boolean;
  /** Used to build the label, e.g. "Anna confirmed". */
  guestName: string;
  onToggle: () => void;
};

/** One of a guest's two ticks — RSVP'd yes, or walked in the door. */
export default function TickBox({ column, isOn, guestName, onToggle }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isOn}
      aria-label={`${guestName} ${TICK_COLUMNS[column].label}`}
      onClick={onToggle}
      // The button is row-height for a comfortable tap; the box inside is the
      // smaller square you actually see.
      className="group flex h-9 w-9 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
          isOn ? TICK_TONE[column] : TICK_TONE_OFF
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.79a1 1 0 0 1 1.4 0Z" />
        </svg>
      </span>
    </button>
  );
}
