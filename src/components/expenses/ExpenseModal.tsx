"use client";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import {
  PAYMENT_METHODS, type Expense, type ExpenseCategory, type PaymentMethod,
} from "@/lib/types";
import type { ExpenseInput } from "@/hooks/useExpenses";
import ModalShell from "@/components/ui/ModalShell";
import Toggle from "@/components/ui/Toggle";

interface ExpenseModalProps {
  /** null = إنشاء جديد */
  expense: Expense | null;
  categories: ExpenseCategory[];
  onSave: (input: ExpenseInput, id?: string) => Promise<void> | void;
  /** إنشاء فئة جديدة من جوه المودال على طول */
  onCreateCategory: (name: string) => Promise<void>;
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpenseModal({ expense, categories, onSave, onCreateCategory, onClose }: ExpenseModalProps) {
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
  // حالة الدفع والخصم من الخزنة — الجديد افتراضياً مدفوع ويُخصم
  const [paid, setPaid] = useState(expense?.paid ?? true);
  const [deductFromBalance, setDeductFromBalance] = useState(expense?.deductFromBalance ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // إضافة فئة جديدة inline من غير ما نسيب المودال
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState("");
  const newCatRef = useRef<HTMLInputElement>(null);

  function openAddCat() {
    setCatErr("");
    setNewCat("");
    setAddingCat(true);
    // نركّز على الحقل بعد ما يظهر
    requestAnimationFrame(() => newCatRef.current?.focus());
  }

  function cancelAddCat() {
    setAddingCat(false);
    setNewCat("");
    setCatErr("");
  }

  async function confirmAddCat() {
    const name = newCat.trim();
    if (!name) return;
    // لو الفئة موجودة بالفعل نختارها بدل ما نكرّرها
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCategory(existing.name);
      cancelAddCat();
      return;
    }
    setCatBusy(true);
    setCatErr("");
    try {
      await onCreateCategory(name);
      setCategory(name); // هتظهر في القائمة أول ما الـ snapshot يوصل
      setAddingCat(false);
      setNewCat("");
    } catch {
      setCatErr(t("toast.catSaveErr"));
    } finally {
      setCatBusy(false);
    }
  }

  function onNewCatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // ما نسيبش الفورم الرئيسي يتبعت
      confirmAddCat();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelAddCat();
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!category) {
      setErr(t("categoryRequired"));
      return;
    }
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
          paid,
          deductFromBalance,
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
            <div className="flex items-center justify-between gap-2">
              <label className="form-label">{t("category")} <span className="req">*</span></label>
              {!addingCat && (
                <button
                  type="button"
                  className="mt-3 mb-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-deep transition-colors disabled:opacity-50"
                  onClick={openAddCat}
                  disabled={busy}
                  title={t("addCategoryTitle")}
                >
                  <span className="icon !text-[16px] leading-none" aria-hidden>add</span>
                  {t("addCategoryBtn")}
                </button>
              )}
            </div>
            {addingCat ? (
              <div className="fade-up">
                <div className="flex items-stretch gap-1.5">
                  <input
                    ref={newCatRef}
                    className="form-input flex-1"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={onNewCatKeyDown}
                    placeholder={t("newCategoryPh")}
                    dir="auto"
                    disabled={catBusy}
                  />
                  <button
                    type="button"
                    className="btn-primary !px-3"
                    onClick={confirmAddCat}
                    disabled={catBusy || !newCat.trim()}
                    aria-label={t("addCategoryTitle")}
                    title={t("addCategoryTitle")}
                  >
                    <span className="icon !text-[18px]" aria-hidden>check</span>
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-3"
                    onClick={cancelAddCat}
                    disabled={catBusy}
                    aria-label={tCommon("cancel")}
                    title={tCommon("cancel")}
                  >
                    <span className="icon !text-[18px]" aria-hidden>close</span>
                  </button>
                </div>
                {catErr && <div className="text-danger text-[12px] mt-1">{catErr}</div>}
              </div>
            ) : (
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">{t("categoryPick")}</option>
                {options.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
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

        {/* حالة الدفع + الخصم من الخزنة */}
        <div className="mt-3 rounded-sm border border-line bg-soft p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-ink-700">{t("paymentStatus")}</span>
            <div className="inline-flex rounded-full bg-canvas border border-line p-0.5" role="group" aria-label={t("paymentStatus")}>
              <button
                type="button"
                aria-pressed={paid}
                onClick={() => setPaid(true)}
                className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold transition-colors " +
                  (paid ? "bg-success text-white" : "text-ink-500 hover:text-ink-900")}
              >
                <span className="icon !text-[16px]" aria-hidden>check_circle</span>
                {t("statusPaid")}
              </button>
              <button
                type="button"
                aria-pressed={!paid}
                onClick={() => setPaid(false)}
                className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold transition-colors " +
                  (!paid ? "bg-warning text-white" : "text-ink-500 hover:text-ink-900")}
              >
                <span className="icon !text-[16px]" aria-hidden>schedule</span>
                {t("statusDebt")}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-line">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink-700">{t("deductFromBalance")}</div>
              <div className="text-[11px] text-ink-400">{t("deductHint")}</div>
            </div>
            <Toggle
              checked={deductFromBalance}
              onChange={() => setDeductFromBalance((v) => !v)}
              label={t("deductFromBalance")}
            />
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
