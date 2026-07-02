import { useEffect, useState, type RefObject } from "react";

/**
 * Track an element's rendered width for responsive SVG sizing. Returns 0 until
 * the first measurement, so callers can hold off drawing until real dimensions
 * are known.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    setWidth(Math.round(element.clientWidth));
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
