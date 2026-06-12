"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { signInWithEmailAndPassword, type AuthError } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import LanguageToggle from "@/components/LanguageToggle";

const INVALID_CODES = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"];

export default function Login() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!auth) return;
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (er) {
      const code = (er as AuthError).code;
      if (INVALID_CODES.includes(code)) setErr(t("auth.errInvalid"));
      else if (code === "auth/invalid-email") setErr(t("auth.errEmail"));
      else setErr(t("auth.errGeneric"));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={submit} className="card w-full max-w-sm text-center shadow-lg !p-9">
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/logo.jpg"
            alt={t("brand.name")}
            width={72}
            height={72}
            className="rounded-full border border-line object-cover"
            priority
          />
        </div>
        <div className="font-display font-extrabold text-3xl tracking-wide">
          LUMI<span className="text-gold">È</span>RE
        </div>
        <div className="text-ink-500 text-[13px] mt-1 mb-6">{t("brand.sub")}</div>

        <label className="form-label text-start">{t("auth.email")}</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          dir="ltr"
        />
        <label className="form-label text-start">{t("auth.password")}</label>
        <input
          type="password"
          className="form-input"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
          placeholder="••••••••"
          dir="ltr"
        />
        <button className="btn-primary w-full mt-5" disabled={busy} type="submit">
          {busy ? t("auth.submitting") : t("auth.submit")}
        </button>
        <div className="text-danger text-[13px] mt-3 min-h-[18px]">{err}</div>
        <div className="flex justify-center mt-2">
          <LanguageToggle />
        </div>
      </form>
    </div>
  );
}
