"use client";
import { useTranslations } from "next-intl";
import { useArchive, type ArchivedOrder } from "@/hooks/useArchive";
import { logAction } from "@/lib/logger";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/format";
import type { OrderSource } from "@/lib/wassalha";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useAppLocale } from "@/components/IntlProvider";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";

// نفس باستيلات بادجات المصدر في صفحة الأوردرات
const SRC_PILL_CLASS: Record<OrderSource, string> = {
  Sllr: "bg-pastel-sky text-ink-700",
  WhatsApp: "bg-pastel-mint text-ink-700",
  Instagram: "bg-pastel-pink text-ink-700",
  Other: "bg-soft text-ink-500",
};

function HistoryPage() {
  const t = useTranslations("history");
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const { locale } = useAppLocale();
  const { profile } = useSession();
  const { archived, error, deleteArchived, clearArchive } = useArchive(true);
  const flash = useToast();
  const actor = { uid: profile.uid, email: profile.email };

  async function handleDelete(o: ArchivedOrder) {
    if (!o.id) return;
    if (!window.confirm(t("confirmDelete", { name: o.name }))) return;
    try {
      await deleteArchived(o.id);
      flash(t("toast.deleted"));
      logAction(actor, "history.delete", o.name);
    } catch {
      flash(t("toast.deleteErr"));
    }
  }

  async function handleClear() {
    if (!archived.length) return;
    if (!window.confirm(t("confirmClear", { n: archived.length }))) return;
    try {
      await clearArchive(archived);
      flash(t("toast.cleared"));
      logAction(actor, "history.clear", "", archived.length);
    } catch {
      flash(t("toast.clearErr"));
    }
  }

  return (
    <>
      <PageHero
        icon="archive"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          archived.length ? (
            <button className="btn-danger" onClick={handleClear}>
              <span className="icon text-base" aria-hidden>delete_forever</span>
              {t("clearAll")}
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="card !border-danger/40 text-danger text-sm mb-4">
          {t("loadError")}
          <div className="text-xs text-ink-500 mt-1 break-all" dir="ltr">{error}</div>
        </div>
      )}

      <div className="text-sm text-ink-500 mb-3.5">
        {t("total")} <b className="text-ink-900 text-lg">{archived.length}</b>
      </div>

      <div className="table-wrap">
        {archived.length === 0 ? (
          <div className="text-center py-12 px-5 text-ink-500">
            <span className="icon !text-[40px] text-ink-300" aria-hidden>archive</span>
            <div className="mt-2 text-sm">{t("empty")}</div>
          </div>
        ) : (
          <table className="data-table min-w-[940px]">
            <thead>
              <tr>
                <th>{t("archivedAt")}</th>
                <th>{tOrders("table.source")}</th>
                <th>{tOrders("table.name")}</th>
                <th>{tOrders("table.phone")}</th>
                <th>{tOrders("table.address")}</th>
                <th>{tOrders("table.city")}</th>
                <th>{tOrders("table.items")}</th>
                <th>{tOrders("table.cod")}</th>
                <th>{t("archivedBy")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {archived.map((o) => (
                <tr key={o.id}>
                  <td className="text-ink-500">{formatDateTime(o.archivedAt, locale)}</td>
                  <td><span className={"pill " + SRC_PILL_CLASS[o.source]}>{tOrders(`sources.${o.source}`)}</span></td>
                  <td>{o.name}</td>
                  <td dir="ltr">{o.phone}</td>
                  <td className="cell-wrap">{o.address}</td>
                  <td>{o.city || EMPTY_DISPLAY}</td>
                  <td className="cell-wrap">
                    {String(o.items || "").split("\n").map((line, i) => <div key={i}>{line}</div>)}
                  </td>
                  <td>{o.cod}</td>
                  <td dir="ltr" className="text-ink-500 text-xs">{o.archivedBy || EMPTY_DISPLAY}</td>
                  <td>
                    <button
                      className="btn-danger-soft text-[13px]"
                      onClick={() => handleDelete(o)}
                      aria-label={tCommon("delete")}
                      title={tCommon("delete")}
                    >
                      <span className="icon text-base" aria-hidden>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <HistoryPage />
    </AppShell>
  );
}
