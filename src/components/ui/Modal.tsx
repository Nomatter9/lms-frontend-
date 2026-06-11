import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  panelClassName?: string;
  /** Keep the modal mounted but hidden — needed for Quill editor pages */
  keepMounted?: boolean;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, children, maxWidth = "max-w-md", panelClassName, keepMounted = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(
        panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      );
      if (!els.length) return;
      const idx = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          els[els.length - 1].focus();
        }
      } else {
        if (idx === els.length - 1) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!keepMounted && !open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm",
        keepMounted && !open && "hidden"
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal={open ? "true" : undefined}
    >
      <div ref={panelRef} className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl overflow-visible ${panelClassName ?? ""}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirming?: boolean;
  icon?: ReactNode;
  confirmClassName?: string;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = "Delete", confirming = false, icon, confirmClassName,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h3 className="font-bold text-gray-900 text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${confirmClassName ?? "bg-rose-500 hover:bg-rose-600"}`}
          >
            {confirming ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
