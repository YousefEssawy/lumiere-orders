"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { isValidEgyptPhone, normPhone } from "@/lib/wassalha";
import { useOrderSources } from "@/hooks/useOrderSources";
import { defaultManualSource } from "@/lib/orderSources";
import OrderFields, { ORDER_FORM_INIT, type OrderFormState } from "@/components/orders/OrderFields";

export default function OrderForm({ onAdd }: { onAdd: (o: OrderFormState) => void }) {
  const t = useTranslations("orders");
  const [f, setF] = useState<OrderFormState>(ORDER_FORM_INIT);
  const [err, setErr] = useState("");
  const { activeNames } = useOrderSources(true);
  // لو المختار مش مفعّل (أول مرة، أو اتقفل/اتمسح) نرجع للافتراضي — واتساب، مش مصدر متجر
  const source = activeNames.includes(f.source) ? f.source : defaultManualSource(activeNames);

  function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!source) {
      setErr(t("noSource"));
      return;
    }
    const phone = normPhone(f.phone);
    if (!isValidEgyptPhone(phone)) {
      setErr(t("phoneInvalid"));
      return;
    }
    onAdd({
      source,
      name: f.name.trim(),
      phone,
      address: f.address.trim(),
      city: f.city,
      cod: f.cod,
      items: f.items.trim(),
      vol: f.vol,
      notes: f.notes.trim(),
      ref: f.ref.trim(),
    });
    setF(ORDER_FORM_INIT);
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold flex items-center gap-2">
        <span className="icon text-accent" aria-hidden>add_circle</span>
        {t("addTitle")}
      </h2>
      <div className="text-[13px] text-ink-500 mb-3">{t("addSub")}</div>
      <form onSubmit={submit}>
        <OrderFields
          value={{ ...f, source }}
          onChange={(k, v) => setF((o) => ({ ...o, [k]: v }))}
          sources={activeNames}
        />
        {err && <div className="text-danger text-[13px] mt-2">{err}</div>}
        <button className="btn-primary w-full mt-4" type="submit">{t("addBtn")}</button>
      </form>
    </div>
  );
}
