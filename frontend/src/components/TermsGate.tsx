import { useEffect, useRef, useState } from "react";
import { TERMS_VERSION, TermsText } from "../terms/TermsText";

const KEY = "gitpay-terms-accepted";

function accepted(): boolean {
  try {
    return localStorage.getItem(KEY) === TERMS_VERSION;
  } catch {
    return false;
  }
}

/**
 * Shows the Terms of Use on a visitor's first visit, and again whenever
 * TERMS_VERSION changes. It cannot be dismissed without agreeing. If storage
 * is blocked the agreement holds for this page view only.
 */
export function TermsGate({ termsHref }: { termsHref: string }) {
  const [open, setOpen] = useState(() => !accepted());
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  if (!open) return null;

  const agree = () => {
    try {
      localStorage.setItem(KEY, TERMS_VERSION);
    } catch {
      // Storage blocked: ask again next visit.
    }
    ref.current?.close();
    setOpen(false);
  };

  return (
    <dialog
      ref={ref}
      className="terms-modal"
      aria-labelledby="terms-title"
      // Escape would close the dialog without agreement.
      onCancel={(e) => e.preventDefault()}
    >
      <div className="terms-head">
        <span className="kicker">Before you continue</span>
        <h2 id="terms-title">Terms of Use</h2>
      </div>
      <div className="terms-body" tabIndex={0}>
        <TermsText />
      </div>
      <div className="terms-foot">
        <label className="terms-check">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>I have read and agree to the Terms of Use.</span>
        </label>
        <div className="terms-actions">
          <a className="btn btn-ghost btn-sm" href={termsHref} target="_blank" rel="noopener">
            Open full page
          </a>
          <button type="button" className="btn btn-primary btn-sm" disabled={!checked} onClick={agree}>
            Agree and continue
          </button>
        </div>
      </div>
    </dialog>
  );
}
