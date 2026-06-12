"use client";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import { SOURCE_CLASS, STATUS_CLASS } from "@/lib/statusStyles";
import { DEFAULT_ORDER_STATUS, ORDER_STATUSES } from "@/lib/types";
import type { ArchivedOrder } from "@/hooks/useArchive";
import AuditTimeline from "@/components/ui/AuditTimeline";

interface OrderDetailsModalProps {
  /** Order أو ArchivedOrder — الحقول الإضافية بتظهر لو موجودة */
  order: ArchivedOrder;
  onClose: () => void;
}

/** عرض كامل لتفاصيل الأوردر — شكل بوليصة شحن */
export default function OrderDetailsModal({ order: o, onClose }: OrderDetailsModalProps) {
  const t = useTranslations("orders");
  const tHistory = useTranslations("history");
  const tDetails = useTranslations("details");
  const tCommon = useTranslations("common");
  const resolveUser = useUserDirectory();

  const status = o.status ?? (o.archivedAt ? DEFAULT_ORDER_STATUS : undefined);
  const items = String(o.items || "").split("\n").filter(Boolean);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card !p-0 overflow-hidden w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto fade-up">
        {/* شريط الهوية الهولوجرافيك */}
        <div className="h-1.5 w-full" style={{ background: "var(--grad-hero)" }} aria-hidden />

        {/* الهيدر: العميل هو البطل */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300 rtl:normal-case rtl:tracking-normal">
                {tDetails("title")}
              </div>
              <h2 className="font-display font-bold text-2xl text-ink-900 mt-1 truncate">
                {o.name || EMPTY_DISPLAY}
              </h2>
              <div className="text-sm text-ink-500 mt-0.5" dir="ltr">{o.phone || EMPTY_DISPLAY}</div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-soft transition-colors shrink-0"
              onClick={onClose}
              aria-label={tCommon("close")}
            >
              <span className="icon" aria-hidden>close</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={"pill " + SOURCE_CLASS[o.source]}>{t(`sources.${o.source}`)}</span>
            {status && ORDER_STATUSES.includes(status) && (
              <span className={"pill " + STATUS_CLASS[status]}>{tHistory(`statuses.${status}`)}</span>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* العنوان */}
          <div className="flex items-start gap-2.5">
            <span className="icon !text-[18px] text-ink-300 mt-0.5 shrink-0" aria-hidden>location_on</span>
            <div className="min-w-0">
              <div className="text-sm text-ink-700 leading-relaxed break-words">
                {o.address || EMPTY_DISPLAY}
              </div>
              <span className="pill bg-soft text-ink-500 mt-1.5 inline-block" dir="ltr">
                {o.city || EMPTY_DISPLAY}
              </span>
            </div>
          </div>

          {/* المنتجات — بلوك إيصال */}
          <div className="bg-soft rounded-md px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 rtl:normal-case rtl:tracking-normal">
                {t("items")}
              </span>
              <span className="text-[11px] text-ink-400">{items.length}</span>
            </div>
            <ul>
              {items.length ? items.map((line, i) => (
                <li key={i} className="py-1.5 text-sm text-ink-900 border-b border-dashed border-ink-100 last:border-0">
                  {line}
                </li>
              )) : <li className="py-1.5 text-sm text-ink-300">{EMPTY_DISPLAY}</li>}
            </ul>
          </div>

          {/* الإجمالي — COD بارز زي إجمالي الإيصال */}
          <div className="flex items-end justify-between border-t border-dashed border-line pt-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 rtl:normal-case rtl:tracking-normal pb-1.5">
              {t("cod")}
            </span>
            <span className="font-display font-extrabold text-3xl text-ink-900 leading-none" dir="ltr">
              {o.cod || 0}
            </span>
          </div>

          {/* ميتا صغيرة */}
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-ink-500">
            <span>{t("vol")}: <b className="text-ink-700">{o.vol || EMPTY_DISPLAY}</b></span>
            <span>{t("ref")}: <b className="text-ink-700" dir="ltr">{o.ref || EMPTY_DISPLAY}</b></span>
          </div>

          {/* ملاحظات الشحن لو موجودة */}
          {o.notes ? (
            <div className="flex items-start gap-2 bg-pastel-butter rounded-sm px-3.5 py-2.5 text-[13px] text-ink-700 leading-relaxed">
              <span className="icon !text-[16px] text-ink-500 mt-0.5 shrink-0" aria-hidden>sticky_note_2</span>
              <span className="break-words min-w-0">{o.notes}</span>
            </div>
          ) : null}
        </div>

        {/* بيانات السجل — تايملاين هادي */}
        <div className="px-6 py-4 bg-soft border-t border-dashed border-line">
          <AuditTimeline
            nodes={[
              { icon: "add_circle", label: tDetails("createdBy"), who: resolveUser(o.createdBy) || EMPTY_DISPLAY, when: formatDateTime(o.createdAt) },
              { icon: "edit", label: tDetails("updatedBy"), who: resolveUser(o.updatedBy) || EMPTY_DISPLAY, when: formatDateTime(o.updatedAt) },
              { icon: "local_shipping", label: tDetails("archivedBy"), who: resolveUser(o.archivedBy) || EMPTY_DISPLAY, when: formatDateTime(o.archivedAt) },
            ]}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
