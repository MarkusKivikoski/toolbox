import { useCallback, useEffect, useState } from "react";
import { RESET_CONFIRM_TIMEOUT_MS } from "../constants";

/**
 * The "tap again to confirm" state of the reset button. Arming auto-cancels
 * after `RESET_CONFIRM_TIMEOUT_MS` if the second tap never comes.
 */
export function useResetConfirm() {
  const [isArmed, setIsArmed] = useState(false);
  const arm = useCallback(() => setIsArmed(true), []);
  const disarm = useCallback(() => setIsArmed(false), []);

  useEffect(() => {
    if (!isArmed) return;
    const timer = window.setTimeout(disarm, RESET_CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isArmed, disarm]);

  return { isArmed, arm, disarm };
}
