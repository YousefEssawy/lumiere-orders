"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { normPhone, type Order, type OrderSource } from "@/lib/wassalha";
import OrderFields, { ALL_SOURCES, type OrderFormState } from "@/components/orders/OrderFields";

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <form onSubmit={submit} className="card w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>edit</span>
          {t("editTitle")}
        </h2>

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
    </div>,
    document.body
  );
}
