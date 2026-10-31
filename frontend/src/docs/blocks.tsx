import { useId, useRef, useState, type ReactNode } from "react";
import { useCopy } from "../components/ui";
import { cx, tabKeyTarget } from "../hooks";

/** Colours a YAML or shell snippet: comments, keys and quoted strings. Plain text otherwise. */
function highlight(code: string): ReactNode[] {
  return code.split("\n").map((line, i) => {
    const out: ReactNode[] = [];
    let body = line;
    let comment = "";
    const hash = line.search(/(^|\s)#/);
    if (hash !== -1) {
      body = line.slice(0, hash);
      comment = line.slice(hash);
    }
    const key = /^(\s*-?\s*)([\w.-]+:)(?=\s|$)/.exec(body);
    if (key) {
      out.push(key[1], <span key="k" className="k">{key[2]}</span>);
      body = body.slice(key[0].length);
    }
    body.split(/("[^"]*")/).forEach((part, j) =>
      out.push(part.startsWith('"') ? <span key={`s${j}`} className="s">{part}</span> : part),
    );
    if (comment) out.push(<span key="c" className="c">{comment}</span>);
    return (
      <span key={i}>
        {out}
        {"\n"}
      </span>
    );
  });
}

export function Code({ title, code }: { title: string; code: string }) {
  const [label, setLabel] = useState("Copy");
  const copy = useCopy();
  return (
    <div className="window doc-code">
      <div className="win-bar">
        <span className="title">{title}</span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label={`Copy ${title}`}
          onClick={(e) => void copy(code, e.currentTarget.closest(".doc-code")?.querySelector("pre") ?? null, setLabel)}
        >
          {label}
        </button>
        <span className="sr" aria-live="polite">
          {label === "Copy" ? "" : label}
        </span>
      </div>
      <pre className="code">{highlight(code)}</pre>
    </div>
  );
}

/** A tabbed choice between equivalent ways of doing one step. */
export function Tabs({ label, items }: { label: string; items: Array<{ label: string; body: ReactNode }> }) {
  const [on, setOn] = useState(0);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div className="doc-tabs">
      <div className="seg" role="tablist" aria-label={label}>
        {items.map((t, i) => (
          <button
            key={t.label}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={on === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={on === i ? 0 : -1}
            className={cx(on === i && "on")}
            onClick={() => setOn(i)}
            onKeyDown={(e) => {
              const next = tabKeyTarget(e.key, on, items.length);
              if (next === null) return;
              e.preventDefault();
              setOn(next);
              tabs.current[next]?.focus();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {items.map((t, i) => (
        <div key={t.label} role="tabpanel" id={`${id}-p${i}`} aria-labelledby={`${id}-t${i}`} hidden={on !== i}>
          {t.body}
        </div>
      ))}
    </div>
  );
}

export function Step({ n, title, id, children }: { n: number; title: string; id?: string; children: ReactNode }) {
  return (
    <div className="doc-step" id={id}>
      <span className="doc-n" aria-hidden="true">
        {n}
      </span>
      <div className="doc-body">
        <h3>
          <span className="sr">Step {n}. </span>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export function Callout({ kind = "note", title, children }: { kind?: "note" | "warn" | "ok"; title: string; children: ReactNode }) {
  return (
    <div role="note" className={cx("callout", `callout-${kind}`)}>
      <b>{title}</b>
      <div>{children}</div>
    </div>
  );
}

/** A menu path, e.g. Settings → Secrets and variables → Actions. */
export function Path({ parts }: { parts: string[] }) {
  return (
    <span className="path">
      {parts.map((p, i) => (
        <span key={p}>
          {i > 0 && <i aria-hidden="true">→</i>}
          {p}
        </span>
      ))}
    </span>
  );
}
