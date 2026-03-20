import { useEffect } from "react";

/**
 * Calls `callback` immediately and then every `intervalMs` milliseconds.
 * Clears the interval on unmount.
 */
export default function useAutoRefresh(callback, intervalMs = 5 * 60 * 1000) {
  useEffect(() => {
    callback();
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs]);
}
