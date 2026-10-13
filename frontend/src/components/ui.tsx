import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { cx, useReveal } from "../hooks";

export function Check({ size = 14, stroke = 2 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dots() {
  return (
    <span className="dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Live({ children }: { children: ReactNode }) {
  return (
    <span className="live">
      <i />
      {children}
    </span>
  );
}

/** A block that slides up into place when scrolled into view. */
export function Reveal({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const r = useReveal<HTMLDivElement>();
  return (
    <div ref={r.ref} className={cx(className, r.className)} {...rest}>
      {children}
    </div>
  );
}

/** A card with a cursor-following spotlight. */
export function Spot({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const r = useReveal<HTMLDivElement>();
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - box.left}px`);
    el.style.setProperty("--my", `${e.clientY - box.top}px`);
  };
  return (
    <div ref={r.ref} className={cx("spot", className, r.className)} onPointerMove={onMove} {...rest}>
      {children}
    </div>
  );
}

export function SectionHead({
  kicker,
  title,
  lede,
  center,
}: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  center?: boolean;
}) {
  return (
    <Reveal className={cx("section-head", center && "center")}>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </Reveal>
  );
}

/** Copies text, falling back to selecting the element when the clipboard is refused. */
export function useCopy() {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return async (text: string, el: HTMLElement | null, setLabel: (s: string) => void) => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setLabel("Copied ✓");
    } catch {
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setLabel("Selected · Ctrl+C");
    }
    timer.current = setTimeout(() => setLabel("Copy"), 1600);
  };
}
