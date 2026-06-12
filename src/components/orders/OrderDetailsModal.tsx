"use client";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import { STATUS_CLASS } from "@/lib/statusStyles";
import { DEFAULT_ORDER_STATUS, ORDER_STATUSES } from "@/lib/types";
import type { OrderSource } from "@/lib/wassalha";
import type { ArchivedOrder } from "@/hooks/useArchive";

const SRC_PILL_CLASS: Record<OrderSource, string> = {
  Sllr: "bg-pastel-sky text-ink-700",
  WhatsApp: "bg-pastel-mint text-ink-700",
  Instagram: "bg-pastel-pink text-ink-700",
  Other: "bg-soft text-ink-500",
};

interface OrderDetailsModalProps {
  /** Order أو ArchivedOrder — الحقول الإضافية بتظهر لو موجودة */
  order: ArchivedOrder;
  onClose: () => void;
}

function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-300 rtl:normal-case rtl:tracking-normal">
        {label}
      </div>
      <div className="text-sm text-ink-900 mt-0.5 break-words">{children}</div>
    </div>
  );
}

/** عرض كامل لتفاصيل الأوردر — للقراءة بس */
export default function OrderDetailsModal({ order: o, onClose }: OrderDetailsModalProps) {
  const t = useTranslations("orders");
  const tHistory = useTranslations("history");
  const tDetails = useTranslations("details");
  const tCommon = useTranslations("common");
  const resolveUser = useUserDirectory();

  const status = o.status ?? (o.archivedAt ? DEFAULT_ORDER_STATUS : undefined);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span className="icon text-accent" aria-hidden>receipt_long</span>
            {tDetails("title")}
          </h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-soft transition-colors"
            onClick={onClose}
            aria-label={tCommon("close")}
          >
            <span className="icon" aria-hidden>close</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={"pill " + SRC_PILL_CLASS[o.source]}>{t(`sources.${o.source}`)}</span>
          {status && ORDER_STATUSES.includes(status) && (
            <span className={"pill " + STATUS_CLASS[status]}>{tHistory(`statuses.${status}`)}</span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3.5">
          <Field label={t("name")}>{o.name || EMPTY_DISPLAY}</Field>
          <Field label={t("phone")}><span dir="ltr">{o.phone || EMPTY_DISPLAY}</span></Field>
          <Field label={t("address")} full>{o.address || EMPTY_DISPLAY}</Field>
          <Field label={t("city")}>{o.city || EMPTY_DISPLAY}</Field>
          <Field label={t("cod")}>{o.cod || 0}</Field>
          <Field label={t("items")} full>
            {String(o.items || "").split("\n").filter(Boolean).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </Field>
          <Field label={t("vol")}>{o.vol || EMPTY_DISPLAY}</Field>
          <Field label={t("ref")}><span dir="ltr">{o.ref || EMPTY_DISPLAY}</span></Field>
          {o.notes ? <Field label={t("notes")} full>{o.notes}</Field> : null}
        </div>

        {/* بيانات السجل (audit) */}
        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-300 rtl:normal-case rtl:tracking-normal mb-2.5">
            {tDetails("audit")}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-2 text-xs text-ink-500">
            <div>{tDetails("createdBy")}: <b className="text-ink-700">{resolveUser(o.createdBy) || EMPTY_DISPLAY}</b></div>
            <div dir="ltr">{formatDateTime(o.createdAt)}</div>
            <div>{tDetails("updatedBy")}: <b className="text-ink-700">{resolveUser(o.updatedBy) || EMPTY_DISPLAY}</b></div>
            <div dir="ltr">{formatDateTime(o.updatedAt)}</div>
            {o.archivedAt ? (
              <>
                <div>{tDetails("archivedBy")}: <b className="text-ink-700">{resolveUser(o.archivedBy) || EMPTY_DISPLAY}</b></div>
                <div dir="ltr">{formatDateTime(o.archivedAt)}</div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
