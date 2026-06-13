"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { ExpenseCategory } from "@/lib/types";
import Toggle from "@/components/ui/Toggle";
import ModalShell from "@/components/ui/ModalShell";

interface ExpenseCategoryModalProps {
  /** null = إنشاء جديدة */
  category: ExpenseCategory | null;
  onSave: (name: string, active: boolean) => Promise<void> | void;
  onClose: () => void;
}

export default function ExpenseCategoryModal({ category, onSave, onClose }: ExpenseCategoryModalProps) {
  const t = useTranslations("expenseCategories");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(category?.name ?? "");
  const [active, setActive] = useState(category?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await onSave(name.trim(), active);
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  return (
    <ModalShell
      icon={category ? "edit" : "add_box"}
      title={category ? t("editTitle") : t("createTitle")}
      onClose={onClose}
      locked={busy}
      trailing={
        <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer shrink-0 select-none">
          {t("active")}
          <Toggle checked={active} onChange={() => setActive((v) => !v)} label={t("active")} />
        </label>
      }
    >
      <form onSubmit={submit}>
        <div>
          <label className="form-label">{t("name")} <span className="req">*</span></label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("namePh")}
            dir="auto"
            autoFocus
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
        </div>
      </form>
    </ModalShell>
  );
}
