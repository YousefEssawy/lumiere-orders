"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { Category, Product, ProductVariant } from "@/lib/types";
import type { ProductInput } from "@/hooks/useProducts";

interface ProductModalProps {
  /** null = إنشاء جديد */
  product: Product | null;
  categories: Category[];
  onSave: (input: ProductInput, isNew: boolean) => Promise<void> | void;
  onClose: () => void;
}

const EMPTY_VARIANT: ProductVariant = { size: "", price: 0, quantity: 0 };

export default function ProductModal({ product, categories, onSave, onClose }: ProductModalProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const isNew = !product;
  const [code, setCode] = useState(product?.code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [nameAr, setNameAr] = useState(product?.nameAr ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants.length ? product.variants : [{ ...EMPTY_VARIANT }]
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function setVariant(i: number, changes: Partial<ProductVariant>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...changes } : v)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const cleanVariants = variants
      .map((v) => ({ size: v.size.trim(), price: Number(v.price) || 0, quantity: Number(v.quantity) || 0 }))
      .filter((v, i) => v.size || variants.length === 1 || i === 0);
    if (!cleanVariants.length) {
      setErr(t("variantsRequired"));
      return;
    }
    setBusy(true);
    try {
      await onSave(
        {
          code: code.trim(),
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          category,
          imageUrl: imageUrl.trim() || undefined,
          active,
          variants: cleanVariants,
        },
        isNew
      );
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <form onSubmit={submit} className="card w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>{isNew ? "add_box" : "edit"}</span>
          {isNew ? t("createTitle") : t("editTitle")}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="form-label">{t("code")} <span className="req">*</span></label>
            <input
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              dir="ltr"
              placeholder="M21"
              disabled={!isNew}
            />
            {!isNew && <div className="text-xs text-ink-300 mt-1">{t("codeLocked")}</div>}
          </div>
          <div>
            <label className="form-label">{t("category")} <span className="req">*</span></label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">{t("categoryPick")}</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <label className="form-label">{t("name")} <span className="req">*</span></label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required dir="ltr" placeholder="Tiger M21" />

        <label className="form-label">{t("nameAr")}</label>
        <input className="form-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="تايجر M21" />

        <label className="form-label">{t("imageUrl")}</label>
        <input className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" placeholder="https://…" />

        {/* الأحجام */}
        <div className="flex items-center justify-between mt-4 mb-1">
          <label className="form-label !m-0">{t("variants")}</label>
          <button
            type="button"
            className="btn-ghost text-xs px-3 py-1.5"
            onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
          >
            <span className="icon text-sm" aria-hidden>add</span>
            {t("addVariant")}
          </button>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="form-input !w-24"
                value={v.size}
                onChange={(e) => setVariant(i, { size: e.target.value })}
                dir="ltr"
                placeholder="50ml"
                aria-label={t("size")}
              />
              <input
                type="number"
                min="0"
                className="form-input flex-1"
                value={v.price}
                onChange={(e) => setVariant(i, { price: Number(e.target.value) })}
                placeholder={t("price")}
                aria-label={t("price")}
              />
              <input
                type="number"
                className="form-input flex-1"
                value={v.quantity}
                onChange={(e) => setVariant(i, { quantity: Number(e.target.value) })}
                placeholder={t("quantity")}
                aria-label={t("quantity")}
              />
              <button
                type="button"
                className="btn-danger-soft px-2 py-1.5 shrink-0"
                onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={variants.length === 1}
                aria-label={tCommon("delete")}
              >
                <span className="icon text-base" aria-hidden>close</span>
              </button>
            </div>
          ))}
        </div>
        <div className="text-xs text-ink-300 mt-1">{t("variantsHint")}</div>

        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-ink-900" checked={active} onChange={(e) => setActive(e.target.checked)} />
          {t("active")}
        </label>

        {err && <div className="text-danger text-[13px] mt-3">{err}</div>}

        <div className="flex gap-2 mt-5">
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy ? tCommon("loading") : tCommon("save")}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            {tCommon("cancel")}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
