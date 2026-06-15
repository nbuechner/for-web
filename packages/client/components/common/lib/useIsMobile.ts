import { createSignal, onCleanup } from "solid-js";

const MOBILE_BREAKPOINT = 768;

/**
 * Returns a reactive signal that is true when the viewport width is below
 * the mobile breakpoint (768px by default).
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`);
  const [isMobile, setIsMobile] = createSignal(query.matches);

  const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
  query.addEventListener("change", handler);
  onCleanup(() => query.removeEventListener("change", handler));

  return isMobile;
}
