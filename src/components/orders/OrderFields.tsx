"use client";
import { useTranslations } from "next-intl";
import { WASSALHA_CITIES, type Order, type OrderSource } from "@/lib/wassalha";
import ItemsPicker from "@/components/orders/ItemsPicker";

export type OrderFormState = Omit<Order, "id" | "createdAt">;

export const ORDER_FORM_INIT: OrderFormState = {
  source: "WhatsApp", name: "", phone: "", address: "", city: "",
  cod: "", items: "", vol: "Small", notes: "", ref: "",
};

export const MANUAL_SOURCES: OrderSource[] = ["WhatsApp", "Instagram", "Other"];
export const ALL_SOURCES: OrderSource[] = ["Wuilt", "Sllr", ...MANUAL_SOURCES];
const PACKAGE_SIZES = ["Small", "Medium", "Large"] as const;

interface OrderFieldsProps {
  value: OrderFormState;
  onChange: (key: keyof OrderFormState, v: string) => void;
  /** مصادر القايمة — الإضافة اليدوية من غير سلر، التعديل بكل المصادر */
  sources?: OrderSource[];
}

/** حقول الأوردر المشتركة بين الإضافة والتعديل — مصدر واحد للفورم */
export default function OrderFields({ value: f, onChange, sources = MANUAL_SOURCES }: OrderFieldsProps) {
  const t = useTranslations("orders");
  const up = (k: keyof OrderFormState) => (e: { target: { value: string } }) =>
    onChange(k, e.target.value);

  return (
    <>
      <label className="form-label">{t("name")} <span className="req">*</span></label>
      <input className="form-input" value={f.name} onChange={up("name")} required placeholder={t("namePh")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="form-label">{t("phone")} <span className="req">*</span></label>
          <input className="form-input" value={f.phone} onChange={up("phone")} required placeholder={t("phonePh")} dir="ltr" />
        </div>
        <div>
          <label className="form-label">{t("source")}</label>
          <select className="form-input" value={f.source} onChange={up("source")}>
            {sources.map((s) => (
              <option key={s} value={s}>{t(`sources.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="form-label">{t("address")} <span className="req">*</span></label>
      <textarea className="form-input min-h-[60px]" value={f.address} onChange={up("address")} required placeholder={t("addressPh")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="form-label">{t("city")} <span className="req">*</span></label>
          <select className="form-input" value={f.city} onChange={up("city")} required>
            <option value="">{t("cityPick")}</option>
            {WASSALHA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">{t("cod")} <span className="req">*</span></label>
          <input type="number" min="0" className="form-input" value={String(f.cod)} onChange={up("cod")} required placeholder={t("codPh")} />
        </div>
      </div>
      <label className="form-label">{t("items")} <span className="req">*</span></label>
      {/* الاختيار من الكتالوج بيضيف سطر بالصيغة النهائية ويزود الـ COD بالسعر */}
      <ItemsPicker
        onPick={(line, totalPrice) => {
          onChange("items", f.items ? `${f.items}\n${line}` : line);
          onChange("cod", String((Number(f.cod) || 0) + totalPrice));
        }}
      />
      <textarea className="form-input min-h-[60px] mt-2" value={f.items} onChange={up("items")} required placeholder={t("itemsPh")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="form-label">{t("vol")}</label>
          <select className="form-input" value={f.vol} onChange={up("vol")}>
            {PACKAGE_SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">{t("notes")}</label>
          <input className="form-input" value={f.notes} onChange={up("notes")} placeholder={t("notesPh")} />
        </div>
      </div>
      <label className="form-label">{t("ref")}</label>
      <input className="form-input" value={f.ref} onChange={up("ref")} placeholder={t("refPh")} />
    </>
  );
}
