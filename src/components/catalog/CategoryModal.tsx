"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { Category } from "@/lib/types";

interface CategoryModalProps {
  /** null = إنشاء جديدة */
  category: Category | null;
  onSave: (name: string) => Promise<void> | void;
  onClose: () => void;
}

export default function CategoryModal({ category, onSave, onClose }: CategoryModalProps) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(category?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await onSave(name.trim());
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <form onSubmit={submit} className="card w-full max-w-lg shadow-lg">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>{category ? "edit" : "add_box"}</span>
          {category ? t("editTitle") : t("createTitle")}
        </h2>

        <label className="form-label">{t("name")} <span className="req">*</span></label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("namePh")} />

        {err && <div className="text-danger text-[13px] mt-3">{err}</div>}

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
