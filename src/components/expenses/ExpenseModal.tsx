"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  PAYMENT_METHODS, type Expense, type ExpenseCategory, type PaymentMethod,
} from "@/lib/types";
import type { ExpenseInput } from "@/hooks/useExpenses";
import ModalShell from "@/components/ui/ModalShell";

interface ExpenseModalProps {
  /** null = إنشاء جديد */
  expense: Expense | null;
  categories: ExpenseCategory[];
  onSave: (input: ExpenseInput, id?: string) => Promise<void> | void;
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpenseModal({ expense, categories, onSave, onClose }: ExpenseModalProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const isNew = !expense;
  const [description, setDescription] = useState(expense?.description ?? "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [amount, setAmount] = useState<string>(expense ? String(expense.amount) : "");
  const [date, setDate] = useState(expense?.date ?? todayStr());
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(expense?.paymentMethod ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr(t("amountInvalid"));
      return;
    }
    setBusy(true);
    try {
      await onSave(
        {
          description: description.trim(),
          category,
          amount: amt,
          date,
          ...(vendor.trim() ? { vendor: vendor.trim() } : {}),
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        expense?.id
      );
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  // الفئات النشطة فقط في القائمة، بس لو الأوردر على فئة متعطلة نسيبها ظاهرة
  const options = categories.filter((c) => c.active || c.name === category);

  return (
    <ModalShell
      icon={isNew ? "add_box" : "edit"}
      title={isNew ? t("createTitle") : t("editTitle")}
      onClose={onClose}
      locked={busy}
    >
      <form onSubmit={submit}>
        <label className="form-label">{t("description")} <span className="req">*</span></label>
        <input
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder={t("descriptionPh")}
          dir="auto"
          autoFocus
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="form-label">{t("category")} <span className="req">*</span></label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">{t("categoryPick")}</option>
              {options.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">{t("amount")} <span className="req">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder={t("amountPh")}
              dir="ltr"
            />
          </div>
          <div>
            <label className="form-label">{t("date")} <span className="req">*</span></label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="form-label">{t("paymentMethod")}</label>
            <select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}>
              <option value="">{t("paymentPick")}</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(`payment.${m}`)}</option>)}
            </select>
          </div>
        </div>

        <label className="form-label">{t("vendor")}</label>
        <input
          className="form-input"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder={t("vendorPh")}
          dir="auto"
        />

        <label className="form-label">{t("notes")}</label>
        <textarea
          className="form-input min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={tCommon("optional")}
          dir="auto"
        />

        {err && <div className="text-danger text-[13px] mt-3">{err}</div>}

        <div className="flex gap-2 mt-6">
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
