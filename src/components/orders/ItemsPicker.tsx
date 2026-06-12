"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useProducts } from "@/hooks/useProducts";
import { formatItemLine } from "@/lib/stock";

interface ItemsPickerProps {
  /** بيضيف سطر للـ items وبيرجع سعر الإضافة عشان الـ COD */
  onPick: (line: string, totalPrice: number) => void;
}

/** اختيار منتج/حجم/كمية من الكتالوج — بيبني سطر بصيغة التصدير النهائية */
export default function ItemsPicker({ onPick }: ItemsPickerProps) {
  const t = useTranslations("orders.picker");
  const { products } = useProducts(true);
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  );
  const selected = activeProducts.find((p) => p.id === productId) ?? null;
  const variant = selected?.variants.find((v) => v.size === size) ?? null;

  function selectProduct(id: string) {
    setProductId(id);
    const p = activeProducts.find((x) => x.id === id);
    setSize(p?.variants[0]?.size ?? "");
    setQty(1);
  }

  function add() {
    if (!selected || !variant || qty < 1) return;
    onPick(formatItemLine(selected.name, variant.size, qty), variant.price * qty);
    setQty(1);
  }

  if (!activeProducts.length) return null;

  return (
    <div className="bg-soft rounded-md px-3.5 py-3 mt-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 rtl:normal-case rtl:tracking-normal mb-2">
        {t("title")}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="form-input flex-1 min-w-0"
          value={productId}
          onChange={(e) => selectProduct(e.target.value)}
          aria-label={t("product")}
        >
          <option value="">{t("productPick")}</option>
          {activeProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
        <select
          className="form-input sm:!w-36"
          value={size}
          onChange={(e) => { setSize(e.target.value); }}
          disabled={!selected}
          aria-label={t("size")}
        >
          {(selected?.variants ?? []).map((v) => (
            <option key={v.size} value={v.size}>
              {v.size || "—"} · {v.price} {v.quantity <= 0 ? `(${t("outOfStock")})` : `(${v.quantity})`}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          className="form-input sm:!w-20"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          disabled={!selected}
          aria-label={t("qty")}
        />
        <button
          type="button"
          className="btn-dark px-4 shrink-0"
          onClick={add}
          disabled={!selected || !variant}
        >
          <span className="icon text-base" aria-hidden>add</span>
          {t("addBtn")}
        </button>
      </div>
      {variant && variant.quantity < qty && (
        <div className="text-xs text-warning mt-1.5">{t("lowStock", { n: variant.quantity })}</div>
      )}
    </div>
  );
}
