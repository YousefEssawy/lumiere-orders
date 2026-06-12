"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { USER_ROLES, type UserProfile, type UserRole } from "@/lib/types";
import { updateUserProfile } from "@/lib/adminUsers";

interface EditUserModalProps {
  user: UserProfile;
  byUid: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function EditUserModal({ user, byUid, onSaved, onClose }: EditUserModalProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<UserRole>(user.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await updateUserProfile(user.uid, { name, role }, byUid);
      onSaved();
    } catch {
      setErr(t("toast.updateErr"));
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
      <form onSubmit={submit} className="card w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>edit</span>
          {t("editTitle")}
        </h2>

        <label className="form-label">{t("email")}</label>
        <input type="email" className="form-input opacity-60 cursor-not-allowed" value={user.email} disabled dir="ltr" />
        <div className="text-xs text-ink-300 mt-1">{t("emailLocked")}</div>

        <label className="form-label">{t("name")} <span className="req">*</span></label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("namePh")} />

        <label className="form-label">{t("role")}</label>
        <select className="form-input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {USER_ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
        </select>
        <div className="text-xs text-ink-300 mt-1">{t("rolesHint")}</div>

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
