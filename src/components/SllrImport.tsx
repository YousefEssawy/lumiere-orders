"use client";
import { useRef, useState } from "react";
import { parseSllr, type Order } from "@/lib/wassalha";

type Msg = { ok: true; n: number; unknown: number } | { ok: false } | null;

export default function SllrImport({ onImport }: { onImport: (list: Omit<Order, "id" | "createdAt">[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function handle(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const res = parseSllr(ev.target!.result as ArrayBuffer);
        onImport(res.orders);
        setMsg({ ok: true, n: res.orders.length, unknown: res.unknown });
      } catch {
        setMsg({ ok: false });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="card">
      <h2>📥 رفع ملف أوردرات سلر</h2>
      <div className="sub">ارفع ملف Export من Sllr (.xlsx) — هيتقري ويتحوّل أوتوماتيك</div>
      <div
        className={"drop" + (over ? " over" : "")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
      >
        <div style={{ fontSize: "34px" }}>📄</div>
        <p style={{ marginTop: "10px" }}>اسحب ملف سلر هنا أو <b>اضغط للاختيار</b></p>
        <p className="hint">بيقرأ المنتجات، العنوان، المحافظة، والتليفون ويحوّلهم تلقائياً</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
      />
      {msg && msg.ok && (
        <div className="hint" style={{ marginTop: "14px" }}>
          ✓ تم استيراد <b>{msg.n}</b> أوردر من سلر.
          {msg.unknown ? <span style={{ color: "var(--danger)" }}> ⚠ {msg.unknown} محتاجين تظبيط محافظة.</span> : null}
        </div>
      )}
      {msg && !msg.ok && (
        <div className="hint" style={{ marginTop: "14px", color: "var(--danger)" }}>
          تعذّر قراءة الملف. اتأكد إنه ملف سلر صحيح.
        </div>
      )}
      <div style={{ marginTop: "20px", padding: "16px", background: "var(--soft)", borderRadius: "10px", fontSize: "13px", color: "var(--muted)" }}>
        <b style={{ color: "var(--ink)" }}>ملاحظة:</b> المحافظات والأرقام بتتحوّل أوتوماتيك لصيغة وصلها. أي محافظة مش معروفة هتظهر بعلامة في الجدول وتقدر تظبطها.
      </div>
    </div>
  );
}
