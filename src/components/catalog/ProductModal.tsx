"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Category, Product, ProductVariant } from "@/lib/types";
import type { ProductInput } from "@/hooks/useProducts";
import Toggle from "@/components/ui/Toggle";
import ModalShell from "@/components/ui/ModalShell";

interface ProductModalProps {
  /** null = إنشاء جديد */
  product: Product | null;
  categories: Category[];
  onSave: (input: ProductInput, isNew: boolean) => Promise<void> | void;
  onClose: () => void;
}

const EMPTY_VARIANT: ProductVariant = { size: "", price: 0, quantity: 0 };

/** عنوان قسم جوه الديالوج */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300 rtl:normal-case rtl:tracking-normal mt-5 mb-1">
      {children}
    </div>
  );
}

export default function ProductModal({ product, categories, onSave, onClose }: ProductModalProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const isNew = !product;
  const [code, setCode] = useState(product?.code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [nameAr, setNameAr] = useState(product?.nameAr ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr ?? "");
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
      .map((v) => ({
        size: v.size.trim(),
        price: Number(v.price) || 0,
        ...(Number(v.originalPrice) ? { originalPrice: Number(v.originalPrice) } : {}),
        quantity: Number(v.quantity) || 0,
      }))
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
          description: description.trim() || undefined,
          descriptionAr: descriptionAr.trim() || undefined,
          category,
          imageUrl: imageUrl.trim() || undefined,
          optionName: product?.optionName ?? "Size",
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

  return (
    <ModalShell
      icon={isNew ? "add_box" : "edit"}
      title={isNew ? t("createTitle") : t("editTitle")}
      onClose={onClose}
      locked={busy}
      widthClass="max-w-2xl"
      trailing={
        <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer shrink-0 select-none">
          {t("active")}
          <Toggle checked={active} onChange={() => setActive((v) => !v)} label={t("active")} />
        </label>
      }
    >
      <form onSubmit={submit}>
        <div>
          {/* البيانات الأساسية */}
          <SectionLabel>{t("sectionBasics")}</SectionLabel>
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
            <div>
              <label className="form-label">{t("name")} <span className="req">*</span></label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required dir="ltr" placeholder="Tiger M21" />
            </div>
            <div>
              <label className="form-label">{t("nameAr")}</label>
              <input className="form-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="تايجر M21" />
            </div>
          </div>

          {/* الأحجام — بانل بصفوف وعناوين أعمدة */}
          <SectionLabel>{t("variants")}</SectionLabel>
          <div className="bg-soft rounded-md px-4 py-3.5">
            <div className="hidden sm:grid grid-cols-[6rem_1fr_1fr_1fr_2.25rem] gap-2 text-[11px] text-ink-400 font-semibold mb-1.5">
              <span>{t("size")}</span>
              <span>{t("price")}</span>
              <span>{t("originalPrice")}</span>
              <span>{t("quantity")}</span>
              <span />
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-[6rem_1fr_1fr_1fr_2.25rem] gap-2 items-center">
                  <input
                    className="form-input"
                    value={v.size}
                    onChange={(e) => setVariant(i, { size: e.target.value })}
                    dir="ltr"
                    placeholder="50ml"
                    aria-label={t("size")}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={v.price}
                    onChange={(e) => setVariant(i, { price: Number(e.target.value) })}
                    placeholder={t("price")}
                    aria-label={t("price")}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={v.originalPrice ?? ""}
                    onChange={(e) => setVariant(i, { originalPrice: Number(e.target.value) || undefined })}
                    placeholder={t("originalPrice")}
                    aria-label={t("originalPrice")}
                    title={t("originalPriceHint")}
                  />
                  <input
                    type="number"
                    className="form-input"
                    value={v.quantity}
                    onChange={(e) => setVariant(i, { quantity: Number(e.target.value) })}
                    placeholder={t("quantity")}
                    aria-label={t("quantity")}
                  />
                  <button
                    type="button"
                    className="btn-danger-soft px-2 py-1.5 justify-self-end sm:justify-self-auto"
                    onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={variants.length === 1}
                    aria-label={tCommon("delete")}
                  >
                    <span className="icon text-base" aria-hidden>close</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-ghost text-xs px-3 py-1.5 mt-3 bg-canvas"
              onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
            >
              <span className="icon text-sm" aria-hidden>add</span>
              {t("addVariant")}
            </button>
            <div className="text-xs text-ink-400 mt-2">{t("variantsHint")}</div>
          </div>

          {/* الوصف */}
          <SectionLabel>{t("sectionDescriptions")}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea
              className="form-input min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir="ltr"
              placeholder={t("description") + " — " + t("descriptionPh")}
              aria-label={t("description")}
            />
            <textarea
              className="form-input min-h-[80px]"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={t("descriptionAr") + " — " + t("descriptionPh")}
              aria-label={t("descriptionAr")}
            />
          </div>

          {/* الصورة + معاينة حية */}
          <SectionLabel>{t("imageUrl")}</SectionLabel>
          <div className="flex items-center gap-3">
            {imageUrl.trim() ? (
              <img
                src={imageUrl.trim()}
                alt={name || code}
                className="w-12 h-12 rounded-sm object-cover border border-line shrink-0"
              />
            ) : (
              <span className="inline-flex w-12 h-12 rounded-sm bg-soft items-center justify-center shrink-0">
                <span className="icon !text-[18px] text-ink-300" aria-hidden>image</span>
              </span>
            )}
            <input
              className="form-input flex-1"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              dir="ltr"
              placeholder="https://…"
              aria-label={t("imageUrl")}
            />
          </div>

          {err && <div className="text-danger text-[13px] mt-4">{err}</div>}

          <div className="flex gap-2 mt-6">
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? tCommon("loading") : tCommon("save")}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
