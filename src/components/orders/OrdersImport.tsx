"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { parseOrdersFile, type ImportFormat, type Order } from "@/lib/wassalha";

type Msg =
  | { ok: true; n: number; unknown: number; skipped: number; format: ImportFormat }
  | { ok: false }
  | null;

/**
 * رفع ملف أوردرات من المتجر. بيتعرّف على الفورمات لوحده — ويلت (CSV) أو سلر
 * (xlsx القديم) — فمفيش اختيار على المستخدم.
 */
export default function OrdersImport({ onImport }: { onImport: (list: Omit<Order, "id" | "createdAt">[]) => void }) {
  const t = useTranslations("orders");
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function handle(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const res = parseOrdersFile(ev.target!.result as ArrayBuffer);
        onImport(res.orders);
        setMsg({ ok: true, n: res.orders.length, unknown: res.unknown, skipped: res.skipped, format: res.format });
      } catch {
        setMsg({ ok: false });
      }
    };
    reader.onerror = () => setMsg({ ok: false });
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold flex items-center gap-2">
        <span className="icon text-accent" aria-hidden>upload_file</span>
        {t("importTitle")}
      </h2>
      <div className="text-[13px] text-ink-500 mb-3">{t("importSub")}</div>
      <div
        className={
          "border-2 border-dashed rounded-md p-7 text-center cursor-pointer transition-colors duration-150 " +
          (over ? "border-accent bg-soft text-ink-900" : "border-line text-ink-500 hover:border-accent hover:bg-soft")
        }
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
      >
        <span className="icon !text-[36px] text-accent" aria-hidden>description</span>
        <p className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: t.raw("dropText") }} />
        <p className="text-xs text-ink-300 mt-1">{t("dropHint")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
      />
      {msg && msg.ok && (
        <div className="text-xs text-ink-500 mt-3.5">
          ✓ {t("importedOk", { n: msg.n, src: t(`sources.${msg.format === "wuilt" ? "Wuilt" : "Sllr"}`) })}
          {msg.skipped ? <span> · {t("importedSkipped", { n: msg.skipped })}</span> : null}
          {msg.unknown ? (
            <span className="text-danger"> ⚠ {t("importedUnknown", { n: msg.unknown })}</span>
          ) : null}
        </div>
      )}
      {msg && !msg.ok && <div className="text-xs text-danger mt-3.5">{t("importErr")}</div>}
      <div className="mt-5 p-4 bg-soft rounded-sm text-[13px] text-ink-500">{t("importNote")}</div>
    </div>
  );
}
