"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { AuthError } from "firebase/auth";
import { USER_ROLES, type UserRole } from "@/lib/types";
import { createUser } from "@/lib/adminUsers";
import ModalShell from "@/components/ui/ModalShell";

interface CreateUserModalProps {
  adminUid: string;
  onCreated: (email: string) => void;
  onClose: () => void;
}

export default function CreateUserModal({ adminUid, onCreated, onClose }: CreateUserModalProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await createUser(adminUid, { name, email, password, role });
      onCreated(email.trim());
    } catch (er) {
      const code = (er as AuthError).code;
      if (code === "auth/email-already-in-use") setErr(t("toast.emailInUse"));
      else if (code === "auth/weak-password") setErr(t("toast.weakPassword"));
      else setErr(t("toast.createErr"));
      setBusy(false);
    }
  }

  return (
    <ModalShell icon="person_add" title={t("createTitle")} onClose={onClose} locked={busy}>
      <form onSubmit={submit}>
        <label className="form-label">{t("name")} <span className="req">*</span></label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("namePh")} />

        <label className="form-label">{t("email")} <span className="req">*</span></label>
        <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" placeholder="user@example.com" />

        <label className="form-label">{t("password")} <span className="req">*</span></label>
        <input type="text" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
        <div className="text-xs text-ink-300 mt-1">{t("passwordHint")}</div>

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
    </ModalShell>
  );
}
