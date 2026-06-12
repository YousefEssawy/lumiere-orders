"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { Category } from "@/lib/types";
import Toggle from "@/components/ui/Toggle";

interface CategoryModalProps {
  /** null = إنشاء جديدة */
  category: Category | null;
  onSave: (name: string, active: boolean) => Promise<void> | void;
  onClose: () => void;
}

export default function CategoryModal({ category, onSave, onClose }: CategoryModalProps) {
  const t = useTranslations("categories");
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <form onSubmit={submit} className="card !p-0 overflow-hidden w-full max-w-lg shadow-lg fade-up">
        {/* شريط الهوية */}
        <div className="h-1.5 w-full" style={{ background: "var(--grad-hero)" }} aria-hidden />

        {/* الهيدر: العنوان + التفعيل */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5">
          <h2 className="text-base font-bold flex items-center gap-2.5">
            <span className="icon-tile !w-9 !h-9">
              <span className="icon text-ink-900 !text-[20px]" aria-hidden>{category ? "edit" : "add_box"}</span>
            </span>
            {category ? t("editTitle") : t("createTitle")}
          </h2>
          <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer shrink-0 select-none">
            {t("active")}
            <Toggle checked={active} onChange={() => setActive((v) => !v)} label={t("active")} />
          </label>
        </div>

        <div className="px-6 pb-6">
          <label className="form-label">{t("name")} <span className="req">*</span></label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("namePh")}
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
    </div>,
    document.body
  );
}
