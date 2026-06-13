"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useWhatsappSettings } from "@/hooks/useWhatsappSettings";
import { logAction } from "@/lib/logger";
import { ORDER_STATUSES, type OrderStatus, type WhatsappTemplates } from "@/lib/types";
import { DEFAULT_WHATSAPP_TEMPLATES, fillTemplate, templateFor } from "@/lib/whatsapp";
import type { Order } from "@/lib/wassalha";
import { STATUS_CLASS } from "@/lib/statusStyles";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";

// أوردر وهمي لمعاينة شكل الرسالة وهي مملوءة
const SAMPLE: Order = {
  source: "WhatsApp", name: "سارة محمد", phone: "01012345678", address: "",
  city: "", cod: 470, items: "White Bloom W19 50ml X 1\nGolden Petals W14 50ml X 1",
  vol: "", notes: "", ref: "",
};

function SettingsPage() {
  const t = useTranslations("settings");
  const tHistory = useTranslations("history");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { templates, saveTemplates } = useWhatsappSettings(true);
  const flash = useToast();

  const [draft, setDraft] = useState<WhatsappTemplates>({});
  const [busy, setBusy] = useState(false);

  // أول ما الإعدادات توصل، عبّي المسودة بالقيم الحالية (أو الافتراضية)
  useEffect(() => {
    if (templates === undefined) return;
    const init: WhatsappTemplates = {};
    for (const s of ORDER_STATUSES) init[s] = templateFor(s, templates);
    setDraft(init);
  }, [templates]);

  function set(status: OrderStatus, value: string) {
    setDraft((d) => ({ ...d, [status]: value }));
  }

  function resetToDefault(status: OrderStatus) {
    set(status, DEFAULT_WHATSAPP_TEMPLATES[status]);
  }

  async function save() {
    setBusy(true);
    try {
      await saveTemplates(draft, profile.uid);
      flash(t("toast.saved"));
      logAction({ uid: profile.uid, email: profile.email }, "settings.update", "whatsapp");
    } catch {
      flash(t("toast.saveErr"));
    }
    setBusy(false);
  }

  const loading = templates === undefined;

  return (
    <>
      <PageHero
        icon="settings"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <button className="btn-primary" onClick={save} disabled={busy || loading}>
            <span className="icon text-base" aria-hidden>save</span>
            {busy ? tCommon("loading") : tCommon("save")}
          </button>
        }
      />

      <div className="card fade-up fade-up-delay-1 mb-5">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span className="icon text-accent" aria-hidden>chat</span>
          {t("waTitle")}
        </h2>
        <p className="text-[13px] text-ink-500 mt-1">{t("waHint")}</p>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="text-ink-400">{t("placeholders")}:</span>
          {["{name}", "{items}", "{cod}"].map((p) => (
            <code key={p} className="pill bg-soft text-ink-700" dir="ltr">{p}</code>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {ORDER_STATUSES.map((status) => {
          const value = draft[status] ?? "";
          const preview = fillTemplate(value, SAMPLE);
          return (
            <div key={status} className="card fade-up fade-up-delay-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={"pill " + STATUS_CLASS[status]}>{tHistory(`statuses.${status}`)}</span>
                <button
                  type="button"
                  className="btn-ghost text-xs px-2.5 py-1"
                  onClick={() => resetToDefault(status)}
                >
                  <span className="icon text-sm" aria-hidden>restart_alt</span>
                  {t("reset")}
                </button>
              </div>
              <textarea
                className="form-input min-h-[110px] leading-relaxed"
                value={value}
                onChange={(e) => set(status, e.target.value)}
                placeholder={t("emptyMeansNoButton")}
              />
              {/* معاينة حية */}
              <div className="mt-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-300 rtl:normal-case rtl:tracking-normal mb-1">
                  {t("preview")}
                </div>
                {value.trim() ? (
                  <div className="bg-pastel-mint rounded-md px-3.5 py-2.5 text-[13px] text-ink-700 whitespace-pre-line leading-relaxed">
                    {preview}
                  </div>
                ) : (
                  <div className="text-xs text-ink-300">{t("noMessage")}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <SettingsPage />
    </AppShell>
  );
}
