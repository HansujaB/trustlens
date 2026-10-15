import { useEffect, useRef } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";

export default function PreviewDialog({ state, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!state) return;
    const previousFocus = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [state]);
  if (!state) return null;
  const isPlan = state.type === "plan";
  return (
    <dialog
      ref={ref}
      className="preview-dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          className="dialog-close"
          aria-label="Close preview"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        <div className="dialog-symbol">
          <Search size={28} />
        </div>
        <span className="paper-eyebrow">
          {isPlan ? "PLANNED ACCESS" : "INTERACTIVE PREVIEW"}
        </span>
        <h2 id="dialog-title">
          {isPlan ? "A closer look is coming." : "The first step is curiosity."}
        </h2>
        {isPlan ? (
          <p>
            <strong>{state.value}</strong> is a proposed launch plan. Billing
            and live investigations aren’t available yet. You can explore the
            sample report now—no payment or signup needed.
          </p>
        ) : (
          <>
            <div className="submitted-target">{state.value}</div>
            <p>
              This preview doesn’t run a live investigation or send your input
              to a research service. Explore our fictional Atlas Protocol report
              to see how findings and evidence will fit together.
            </p>
          </>
        )}
        <a className="button button-blue" href="#evidence" onClick={onClose}>
          Explore the sample report <ArrowUpRight size={17} />
        </a>
        <span className="dialog-footnote">Clear evidence. Clear limits.</span>
      </div>
    </dialog>
  );
}
