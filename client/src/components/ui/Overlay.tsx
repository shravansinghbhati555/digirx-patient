import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, IconButton } from './Button';
import { Icon, type IconName } from './Icon';

function useModalBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Scoped to the open modal, removed on close.
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, onClose]);
  return panelRef;
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visual title (e.g. when the body has its own heading). */
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Bottom sheet on phones; centred dialog from tablet up (per handoff:
 * "sheets become centred dialogs").
 */
export function Sheet({ open, onClose, title, hideTitle, children, footer }: SheetProps) {
  const panelRef = useModalBehaviour(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center tablet:items-center tablet:p-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in cursor-default bg-ink/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-sheet bg-surface outline-none tablet:max-w-[480px] tablet:rounded-sheet tablet:shadow-dialog"
      >
        <span className="mx-auto mt-3 h-[5px] w-11 flex-none rounded-full bg-knob tablet:hidden" aria-hidden="true" />
        {!hideTitle && (
          <div className="flex flex-none items-center justify-between px-5 pt-3.5 tablet:pt-6">
            <h2 className="m-0 text-[24px] font-semibold tracking-[-0.02em]">{title}</h2>
            <IconButton icon="close" label="Close" tone="tint" onClick={onClose} />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">{children}</div>
        {footer && (
          <div className="flex flex-none gap-2.5 border-t border-divider px-5 pb-[calc(30px+env(safe-area-inset-bottom))] pt-4 tablet:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  icon?: IconName;
  points?: { ok?: boolean; text: string }[];
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
}

/** Centred alert dialog — destructive confirms only. */
export function ConfirmDialog({ open, onClose, onConfirm, title, icon = 'alert', points, body, confirmLabel, cancelLabel = 'Keep' }: ConfirmProps) {
  const panelRef = useModalBehaviour(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in cursor-default bg-ink/45" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        tabIndex={-1}
        className="relative flex w-full max-w-[400px] animate-sheet-up flex-col rounded-sheet bg-surface px-5 pb-5 pt-6 shadow-dialog outline-none"
      >
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-bad-bg text-bad-fg">
          <Icon name={icon} size={28} />
        </span>
        <h2 id="confirm-title" className="m-0 mt-4 text-[24px] font-semibold leading-[1.15] tracking-[-0.02em]">
          {title}
        </h2>
        <div id="confirm-desc" className="mt-3.5 flex flex-col gap-2.5 text-[14px] leading-[1.45] text-text-body">
          {body}
          {points?.map((p) => (
            <span key={p.text} className="flex items-start gap-2.5">
              <Icon name={p.ok ? 'check' : 'close'} size={18} className="mt-px" />
              {p.text}
            </span>
          ))}
        </div>
        <div className="mt-[22px] flex gap-2.5">
          <Button variant="secondary" block onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="danger" block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Toasts ---------- */

interface ToastInput {
  message: string;
  tone?: 'success' | 'info';
  undo?: () => void;
}

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((t: ToastInput) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex justify-center tablet:top-6">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-[440px] animate-sheet-up items-center gap-2.5 rounded-input px-[14px] py-3 text-[14px] font-medium ${
              toast.tone === 'info' ? 'bg-ink text-surface shadow-dialog' : 'bg-ok-bg text-[#13502A] shadow-[0_12px_24px_-14px_rgba(30,107,58,.5)]'
            }`}
          >
            {toast.tone !== 'info' && (
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-ok-fg text-surface">
                <Icon name="check" size={15} strokeWidth={2.6} />
              </span>
            )}
            <span className="flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
