"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { normPhone, type Order, type OrderSource } from "@/lib/wassalha";
import OrderFields, { ALL_SOURCES, type OrderFormState } from "@/components/orders/OrderFields";
import ModalShell from "@/components/ui/ModalShell";

interface EditOrderModalProps {
  order: Order;
  onSave: (changes: OrderFormState) => Promise<void> | void;
  onClose: () => void;
}

/** تعديل أوردر قبل التصدير — نفس حقول الإضافة، معبأة مسبقاً */
export default function EditOrderModal({ order, onSave, onClose }: EditOrderModalProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const [f, setF] = useState<OrderFormState>({
    source: order.source,
    name: order.name,
    phone: order.phone,
    address: order.address,
    city: order.city,
    cod: order.cod,
    items: order.items,
    vol: order.vol,
    notes: order.notes,
    ref: order.ref,
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSave({
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
  }

  return (
    <ModalShell icon="edit" title={t("editTitle")} onClose={onClose} locked={busy} widthClass="max-w-2xl">
      <form onSubmit={submit}>
        <OrderFields
          value={f}
          onChange={(k, v) => setF((o) => ({ ...o, [k]: v }))}
          sources={ALL_SOURCES}
        />

        <div className="flex gap-2 mt-5">
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy ? tCommon("loading") : tCommon("save")}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            {tCommon("cancel")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
