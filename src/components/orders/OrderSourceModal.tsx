"use client";
import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { OrderSourceDoc } from "@/lib/types";
import Toggle from "@/components/ui/Toggle";
import ModalShell from "@/components/ui/ModalShell";

/** سبب قفل الاسم: مصدر متجر (الاستيراد بيكتبه بالاسم) أو أوردرات تحت التجهيز عليه */
export type NameLock = "system" | "inUse" | null;

interface OrderSourceModalProps {
  /** null = إنشاء جديد */
  source: OrderSourceDoc | null;
  /** أسماء المصادر التانية — الاسم لازم يبقى فريد (من غير حساسية للحروف) */
  takenNames: string[];
  nameLock: NameLock;
  onSave: (name: string, active: boolean) => Promise<void> | void;
  onClose: () => void;
}

export default function OrderSourceModal({ source, takenNames, nameLock, onSave, onClose }: OrderSourceModalProps) {
  const t = useTranslations("orderSources");
  const tCommon = useTranslations("common");
  const nameId = useId();
  const errId = useId();
  const [name, setName] = useState(source?.name ?? "");
  const [active, setActive] = useState(source?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const trimmed = name.trim();
    if (!trimmed) {
      setErr(t("nameRequired"));
      return;
    }
    if (!nameLock && takenNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())) {
      setErr(t("duplicate"));
      return;
    }
    setBusy(true);
    try {
      await onSave(trimmed, active);
    } catch {
      setErr(t("toast.saveErr"));
      setBusy(false);
    }
  }

  return (
    <ModalShell
      icon={source ? "edit" : "add_box"}
      title={source ? t("editTitle") : t("createTitle")}
      onClose={onClose}
      locked={busy}
      trailing={
        <div className="flex items-center gap-2 text-sm text-ink-500 shrink-0 select-none">
          {t("active")}
          <Toggle checked={active} onChange={() => setActive((v) => !v)} label={t("active")} />
        </div>
      }
    >
      <form onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor={nameId}>{t("name")} <span className="req">*</span></label>
          <input
            id={nameId}
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder={t("namePh")}
            dir="auto"
            autoFocus={!nameLock}
            disabled={!!nameLock}
            aria-invalid={!!err}
            aria-describedby={err ? errId : undefined}
          />
          {nameLock && (
            <div className="text-xs text-ink-500 mt-1.5">
              {nameLock === "system" ? t("systemHint") : t("inUseHint")}
            </div>
          )}

          {err && <div id={errId} role="alert" className="text-danger text-[13px] mt-3">{err}</div>}

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
