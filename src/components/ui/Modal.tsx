"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { XIcon } from "../icons";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // onClose costuma ser uma função inline (nova a cada render); guardá-la numa ref
  // evita re-executar o efeito a cada tecla — o que roubava o foco do campo activo.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Respeita campos com autoFocus: só foca o diálogo se o foco ainda não estiver dentro dele.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative w-full rounded-2xl border border-gray-200 bg-white shadow-theme-xl outline-none dark:border-gray-800 dark:bg-gray-900",
          size === "sm" && "max-w-md",
          size === "md" && "max-w-xl",
          size === "lg" && "max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            {title && (
              <h3 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
          >
            <XIcon size={20} />
          </button>
        </div>
        {children && <div className="max-h-[70vh] overflow-y-auto px-6 py-5 custom-scrollbar">{children}</div>}
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  danger,
  loading,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div>{message}</div>
        {children}
      </div>
    </Modal>
  );
}
