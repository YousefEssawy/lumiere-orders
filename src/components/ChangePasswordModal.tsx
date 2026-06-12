"use client";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const WRONG_PASS_CODES = ["auth/invalid-credential", "auth/wrong-password"];
const MIN_PASSWORD_LENGTH = 6;

interface ChangePasswordModalProps {
  onChanged: () => void;
  onClose: () => void;
}

/** أي مستخدم يغيّر الباسورد بتاعه — بيتطلب الباسورد الحالي للتأكيد */
export default function ChangePasswordModal({ onChanged, onClose }: ChangePasswordModalProps) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (next !== confirm) {
      setErr(t("mismatch"));
      return;
    }
    const user = auth?.currentUser;
    if (!user || !user.email) return;
    setBusy(true);
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, current)
      );
      await updatePassword(user, next);
      onChanged();
    } catch (er) {
      const code = (er as AuthError).code;
      if (WRONG_PASS_CODES.includes(code)) setErr(t("wrongPassword"));
      else if (code === "auth/weak-password") setErr(t("weak"));
      else setErr(t("error"));
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
      <form onSubmit={submit} className="card w-full max-w-sm shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>key</span>
          {t("changePassword")}
        </h2>

        <label className="form-label">{t("current")} <span className="req">*</span></label>
        <input type="password" className="form-input" value={current} onChange={(e) => setCurrent(e.target.value)} required dir="ltr" autoComplete="current-password" />

        <label className="form-label">{t("new")} <span className="req">*</span></label>
        <input type="password" className="form-input" value={next} onChange={(e) => setNext(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} dir="ltr" autoComplete="new-password" />

        <label className="form-label">{t("confirm")} <span className="req">*</span></label>
        <input type="password" className="form-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} dir="ltr" autoComplete="new-password" />

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
