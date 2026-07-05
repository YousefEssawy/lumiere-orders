"use client";
/* eslint-disable @next/next/no-img-element */
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import type { Product } from "@/lib/types";
import AuditTimeline from "@/components/ui/AuditTimeline";

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

/** عرض كامل لتفاصيل المنتج — نفس روح بوليصة الأوردر */
export default function ProductDetailsModal({ product: p, onClose }: ProductDetailsModalProps) {
  const t = useTranslations("products");
  const tDetails = useTranslations("details");
  const tCommon = useTranslations("common");
  const resolveUser = useUserDirectory();

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

        {/* الهيدر: الصورة + الاسم */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4 min-w-0">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-20 h-20 rounded-md object-cover border border-line shrink-0"
                />
              ) : (
                <span className="inline-flex w-20 h-20 rounded-md bg-soft items-center justify-center shrink-0">
                  <span className="icon !text-[28px] text-ink-300" aria-hidden>image</span>
                </span>
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300 rtl:normal-case rtl:tracking-normal" dir="ltr">
                  {p.code}
                </div>
                <h2 className="font-display font-bold text-2xl text-ink-900 mt-1 truncate" dir="ltr">
                  {p.name}
                </h2>
                {p.nameAr && <div className="text-sm text-ink-500 mt-0.5">{p.nameAr}</div>}
              </div>
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
            <span className="pill bg-soft text-ink-500">{p.category || EMPTY_DISPLAY}</span>
            <span className={"pill " + (p.active ? "bg-pastel-mint text-ink-700" : "bg-pastel-pink text-danger")}>
              {p.active ? t("active") : t("inactive")}
            </span>
          </div>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* الأحجام — جدول إيصال */}
          <div className="bg-soft rounded-md px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 rtl:normal-case rtl:tracking-normal mb-1.5">
              {t("variants")}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-ink-400">
                  <th className="text-start font-semibold pb-1">{t("size")}</th>
                  <th className="text-start font-semibold pb-1">{t("price")}</th>
                  <th className="text-start font-semibold pb-1">{t("originalPrice")}</th>
                  <th className="text-start font-semibold pb-1">{t("quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v, i) => (
                  <tr key={i} className="border-t border-dashed border-ink-100">
                    <td className="py-1.5" dir="ltr">{v.size || EMPTY_DISPLAY}</td>
                    <td className="py-1.5 font-bold" dir="ltr">{v.price}</td>
                    <td className="py-1.5 text-ink-400 line-through" dir="ltr">{v.originalPrice || ""}</td>
                    <td className={"py-1.5 font-bold " + (v.quantity <= 0 ? "text-danger" : "")} dir="ltr">
                      {v.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الوصف */}
          {(p.description || p.descriptionAr) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {p.description && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300 rtl:normal-case rtl:tracking-normal mb-1.5">
                    {t("description")}
                  </div>
                  <div
                    dir="ltr"
                    className="text-[13px] text-ink-700 leading-relaxed whitespace-pre-wrap"
                  >
                    {p.description}
                  </div>
                </div>
              )}
              {p.descriptionAr && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300 rtl:normal-case rtl:tracking-normal mb-1.5">
                    {t("descriptionAr")}
                  </div>
                  <div
                    dir="rtl"
                    className="text-[13px] text-ink-700 leading-relaxed whitespace-pre-wrap"
                  >
                    {p.descriptionAr}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* رابط الصورة */}
          {p.imageUrl && (
            <div className="text-xs text-ink-500">
              {t("imageUrl")}:{" "}
              <a href={p.imageUrl} target="_blank" rel="noreferrer" className="text-ink-700 underline break-all" dir="ltr">
                {p.imageUrl}
              </a>
            </div>
          )}
        </div>

        {/* بيانات السجل — تايملاين هادي */}
        <div className="px-6 py-4 bg-soft border-t border-dashed border-line">
          <AuditTimeline
            nodes={[
              { icon: "add_circle", label: tDetails("createdBy"), who: resolveUser(p.createdBy) || EMPTY_DISPLAY, when: formatDateTime(p.createdAt) },
              { icon: "edit", label: tDetails("updatedBy"), who: resolveUser(p.updatedBy) || EMPTY_DISPLAY, when: formatDateTime(p.updatedAt) },
            ]}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
