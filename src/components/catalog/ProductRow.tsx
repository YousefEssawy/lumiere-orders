"use client";
/* eslint-disable @next/next/no-img-element */
import { memo } from "react";
import { useTranslations } from "next-intl";
import { EMPTY_DISPLAY } from "@/lib/appGlobals";
import type { Product } from "@/lib/types";
import Toggle from "@/components/ui/Toggle";

interface ProductRowProps {
  product: Product;
  selected: boolean;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggleSelect: (id: string) => void;
  onToggleActive: (p: Product) => void;
}

function ProductRow({ product: p, selected, onView, onEdit, onDelete, onToggleSelect, onToggleActive }: ProductRowProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");

  return (
    <tr className={p.active ? "" : "opacity-60"}>
      <td>
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost text-[13px] px-2.5 py-1.5"
            onClick={() => onView(p)}
            aria-label={tCommon("view")}
            title={tCommon("view")}
          >
            <span className="icon text-base" aria-hidden>visibility</span>
          </button>
          <button
            className="btn-ghost text-[13px] px-2.5 py-1.5"
            onClick={() => onEdit(p)}
            aria-label={t("editTitle")}
            title={t("editTitle")}
          >
            <span className="icon text-base" aria-hidden>edit</span>
          </button>
          <button
            className="btn-danger-soft text-[13px]"
            onClick={() => onDelete(p)}
            aria-label={tCommon("delete")}
            title={tCommon("delete")}
          >
            <span className="icon text-base" aria-hidden>delete</span>
          </button>
        </div>
      </td>
      <td>
        <input
          type="checkbox"
          className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
          checked={selected}
          onChange={() => p.id && onToggleSelect(p.id)}
          aria-label={p.name}
        />
      </td>
      <td dir="ltr" className="font-bold">{p.code}</td>
      <td>
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            className="w-9 h-9 rounded-sm object-cover border border-line"
            loading="lazy"
          />
        ) : (
          <span className="inline-flex w-9 h-9 rounded-sm bg-soft items-center justify-center">
            <span className="icon !text-[16px] text-ink-300" aria-hidden>image</span>
          </span>
        )}
      </td>
      <td>
        <div dir="ltr" className="text-start">{p.name}</div>
        {p.nameAr && <div className="text-xs text-ink-400">{p.nameAr}</div>}
      </td>
      <td><span className="pill bg-soft text-ink-500">{p.category || EMPTY_DISPLAY}</span></td>
      <td>
        <div className="flex flex-wrap gap-1.5 max-w-[260px]">
          {p.variants.map((v, i) => (
            <span
              key={i}
              className={
                "pill " +
                (v.quantity <= 0 ? "bg-pastel-pink text-danger" : "bg-soft text-ink-700")
              }
              dir="ltr"
              title={`${t("price")}: ${v.price} · ${t("quantity")}: ${v.quantity}`}
            >
              {v.size || "—"} · {v.price} · ×{v.quantity}
            </span>
          ))}
        </div>
      </td>
      <td>
        <Toggle
          checked={p.active}
          onChange={() => onToggleActive(p)}
          label={t("active")}
        />
      </td>
    </tr>
  );
}

export default memo(ProductRow);
