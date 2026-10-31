import { useEffect, useRef, useState, type RefObject } from "react";

export function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useInView(ref: RefObject<Element | null>, threshold = 0): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

/** Runs `callback` every `ms` while `ms` is not null, skipping ticks while the tab is hidden. */
export function useInterval(callback: () => void, ms: number | null): void {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => {
      if (!document.hidden) saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}

/**
 * Slides an element up as it scrolls into view. Only elements that start below
 * the fold are offset, and only by a transform, so content is never hidden.
 */
export function useReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; className: string } {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();
  const [pre, setPre] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || el.getBoundingClientRect().top <= window.innerHeight) return;
    setPre(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPre(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return { ref, className: pre ? "reveal pre" : "reveal" };
}

/** Eases a number from 0 to `target` each time `play` changes (and never on first render). */
export function useCountUp(target: number, play: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (play === 0 || reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / durationMs);
      setValue(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, play, durationMs, reduced]);
  return value;
}

export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

/** The tab an arrow, Home or End key moves to, per the ARIA tabs pattern; null for any other key. */
export function tabKeyTarget(key: string, current: number, count: number): number | null {
  const last = count - 1;
  if (key === "ArrowRight") return current === last ? 0 : current + 1;
  if (key === "ArrowLeft") return current === 0 ? last : current - 1;
  if (key === "Home") return 0;
  if (key === "End") return last;
  return null;
}
