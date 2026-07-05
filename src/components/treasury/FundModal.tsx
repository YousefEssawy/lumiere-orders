"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Fund } from "@/lib/types";
import type { FundInput } from "@/hooks/useFunds";
import ModalShell from "@/components/ui/ModalShell";

interface FundModalProps {
  /** null = إضافة جديدة */
  fund: Fund | null;
  onSave: (input: FundInput, id?: string) => Promise<void> | void;
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function FundModal({ fund, onSave, onClose }: FundModalProps) {
  const t = useTranslations("treasury");
  const tCommon = useTranslations("common");
  const isNew = !fund;
  const [amount, setAmount] = useState<string>(fund ? String(fund.amount) : "");
  const [date, setDate] = useState(fund?.date ?? todayStr());
  const [source, setSource] = useState(fund?.source ?? "");
  const [notes, setNotes] = useState(fund?.notes ?? "");
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
          amount: amt,
          date,
          ...(source.trim() ? { source: source.trim() } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        fund?.id
      );
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  return (
    <ModalShell
      icon={isNew ? "add_card" : "edit"}
      title={isNew ? t("addTitle") : t("editTitle")}
      onClose={onClose}
      locked={busy}
    >
      <form onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
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
              autoFocus
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
        </div>

        <label className="form-label">{t("source")}</label>
        <input
          className="form-input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={t("sourcePh")}
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
