"use client";
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
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
      let m = "خطأ في تسجيل الدخول";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found")
        m = "الإيميل أو الباسورد غلط";
      if (code === "auth/invalid-email") m = "صيغة الإيميل غير صحيحة";
      setErr(m);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <div className="logo">LUMI<span>È</span>RE</div>
        <div className="lsub">مركز الأوردرات والشحن</div>
        <label>الإيميل</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <label>الباسورد</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required placeholder="••••••••" />
        <button className="btn btn-gold" disabled={busy} type="submit">{busy ? "جاري الدخول…" : "تسجيل الدخول"}</button>
        <div className="err">{err}</div>
      </form>
    </div>
  );
}
