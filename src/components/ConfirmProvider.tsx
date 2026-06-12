"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export interface ConfirmOptions {
  /** نص السؤال — إلزامي */
  message: string;
  /** عنوان اختياري فوق الرسالة */
  title?: string;
  /** زرار التأكيد أحمر (للأفعال الخطيرة) — الافتراضي true */
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(() => Promise.resolve(false));

/**
 * const confirm = useConfirm();
 * if (!(await confirm({ message: "..." }))) return;
 *
 * بديل window.confirm — ديالوج بهوية النظام. ممنوع استخدام
 * alert/confirm/prompt الخام في أي مكان.
 */
export function useConfirm(): ConfirmFn {
  return useContext(Ctx);
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  function settle(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  // فوكس على زرار التأكيد + Escape للإلغاء
  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const danger = pending?.danger ?? true;

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {pending &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            className="fixed inset-0 z-[300] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) settle(false); }}
          >
            <div className="card w-full max-w-md shadow-lg fade-up text-center !p-7">
              <span
                className={
                  "inline-flex items-center justify-center w-12 h-12 rounded-full mb-3.5 " +
                  (danger ? "bg-pastel-pink" : "bg-pastel-butter")
                }
              >
                <span
                  className={"icon !text-[24px] " + (danger ? "text-danger" : "text-ink-700")}
                  aria-hidden
                >
                  {danger ? "warning" : "help"}
                </span>
              </span>
              {pending.title && (
                <h2 className="text-base font-bold mb-1.5">{pending.title}</h2>
              )}
              <p className="text-sm text-ink-700 leading-relaxed">{pending.message}</p>
              <div className="flex gap-2.5 mt-6">
                <button
                  ref={confirmBtnRef}
                  type="button"
                  className={(danger ? "btn-danger" : "btn-primary") + " flex-1"}
                  onClick={() => settle(true)}
                >
                  {pending.confirmLabel ?? t("confirm")}
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => settle(false)}
                >
                  {pending.cancelLabel ?? t("cancel")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Ctx.Provider>
  );
}
