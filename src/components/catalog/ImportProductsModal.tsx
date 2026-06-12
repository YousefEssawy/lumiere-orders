"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { parseProductsSheet, type ProductsParseResult } from "@/lib/productsImport";

interface ImportProductsModalProps {
  onImport: (result: ProductsParseResult) => Promise<void> | void;
  onClose: () => void;
}

/** استيراد شيت المنتجات (صيغة v22) — معاينة قبل التنفيذ */
export default function ImportProductsModal({ onImport, onClose }: ImportProductsModalProps) {
  const t = useTranslations("products.import");
  const tCommon = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [parsed, setParsed] = useState<ProductsParseResult | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function handle(file?: File) {
    if (!file) return;
    setErr("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const res = parseProductsSheet(ev.target!.result as ArrayBuffer);
        if (!res.products.length) {
          setErr(t("empty"));
          setParsed(null);
        } else {
          setParsed(res);
        }
      } catch {
        setErr(t("parseErr"));
        setParsed(null);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function apply() {
    if (!parsed) return;
    setBusy(true);
    try {
      await onImport(parsed);
    } catch {
      setErr(t("applyErr"));
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
      <div className="card w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold flex items-center gap-2 mb-2">
          <span className="icon text-accent" aria-hidden>upload_file</span>
          {t("title")}
        </h2>
        <p className="text-[13px] text-ink-500 mb-3">{t("hint")}</p>

        <div
          className={
            "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors duration-150 " +
            (over ? "border-accent bg-soft text-ink-900" : "border-line text-ink-500 hover:border-accent hover:bg-soft")
          }
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
          onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
        >
          <span className="icon !text-[32px] text-accent" aria-hidden>table_view</span>
          <p className="mt-2 text-sm">{t("dropText")}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
        />

        {parsed && (
          <div className="bg-soft rounded-md px-4 py-3 mt-4 text-sm text-ink-700 space-y-1">
            <div>✓ {t("preview", { n: parsed.products.length })}</div>
            <div className="text-xs text-ink-500">{t("previewCategories", { n: parsed.categories.length })}</div>
            {parsed.skippedRows > 0 && (
              <div className="text-xs text-warning">{t("previewSkipped", { n: parsed.skippedRows })}</div>
            )}
          </div>
        )}

        {err && <div className="text-danger text-[13px] mt-3">{err}</div>}

        <div className="flex gap-2 mt-5">
          <button className="btn-primary flex-1" onClick={apply} disabled={!parsed || busy}>
            {busy ? tCommon("loading") : t("applyBtn")}
          </button>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
