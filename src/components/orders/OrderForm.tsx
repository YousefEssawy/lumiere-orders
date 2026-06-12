"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { WASSALHA_CITIES, normPhone, type Order, type OrderSource } from "@/lib/wassalha";

type FormState = Omit<Order, "id" | "createdAt">;
const INIT: FormState = {
  source: "WhatsApp", name: "", phone: "", address: "", city: "",
  cod: "", items: "", vol: "Small", notes: "", ref: "",
};
const MANUAL_SOURCES: OrderSource[] = ["WhatsApp", "Instagram", "Other"];
const PACKAGE_SIZES = ["Small", "medium", "Large"] as const;

export default function OrderForm({ onAdd }: { onAdd: (o: FormState) => void }) {
  const t = useTranslations("orders");
  const [f, setF] = useState<FormState>(INIT);
  const up = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setF((o) => ({ ...o, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd({
      source: f.source as OrderSource,
      name: f.name.trim(),
      phone: normPhone(f.phone),
      address: f.address.trim(),
      city: f.city,
      cod: f.cod,
      items: f.items.trim(),
      vol: f.vol,
      notes: f.notes.trim(),
      ref: f.ref.trim(),
    });
    setF(INIT);
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold flex items-center gap-2">
        <span className="icon text-gold" aria-hidden>add_circle</span>
        {t("addTitle")}
      </h2>
      <div className="text-[13px] text-ink-500 mb-3">{t("addSub")}</div>
      <form onSubmit={submit}>
        <label className="form-label">{t("name")} <span className="req">*</span></label>
        <input className="form-input" value={f.name} onChange={up("name")} required placeholder={t("namePh")} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">{t("phone")} <span className="req">*</span></label>
            <input className="form-input" value={f.phone} onChange={up("phone")} required placeholder={t("phonePh")} dir="ltr" />
          </div>
          <div>
            <label className="form-label">{t("source")}</label>
            <select className="form-input" value={f.source} onChange={up("source")}>
              {MANUAL_SOURCES.map((s) => (
                <option key={s} value={s}>{t(`sources.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="form-label">{t("address")} <span className="req">*</span></label>
        <textarea className="form-input min-h-[60px]" value={f.address} onChange={up("address")} required placeholder={t("addressPh")} />
        <div className="grid grid-cols-2 gap-3">
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
        <textarea className="form-input min-h-[60px]" value={f.items} onChange={up("items")} required placeholder={t("itemsPh")} />
        <div className="grid grid-cols-2 gap-3">
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
        <button className="btn-primary w-full mt-4" type="submit">{t("addBtn")}</button>
      </form>
    </div>
  );
}
