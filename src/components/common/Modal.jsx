import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4 fill-none stroke-current", className)} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Lightweight, accessible modal dialog.
 * Portaled to document.body to prevent parent CSS transforms/overflow constraints
 * from glitching the overlay, backdrop, or image positioning.
 */
export default function Modal({ open, onClose, title, children, className }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted || typeof document === "undefined") return null;

  const modalElement = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Full-screen Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-ink-900/10 bg-white p-6 shadow-2xl animate-fadeUp",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-lg font-bold text-ink-900">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-mist-100 hover:text-ink-900"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
