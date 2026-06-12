"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLogs } from "@/hooks/useLogs";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { LOG_ACTIONS, type LogAction, type LogEntry } from "@/lib/types";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";

const ALL = "all";

/** التفاصيل المعروضة: نص + عدد، أو "n أوردر" مترجمة للعمليات الجماعية */
function detailText(
  l: LogEntry,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  if (l.detail) return l.count !== undefined ? `${l.detail} (${l.count})` : l.detail;
  if (l.count !== undefined) return t("items", { n: l.count });
  return EMPTY_DISPLAY;
}

function LogsPage() {
  const t = useTranslations("logs");
  const { logs, error } = useLogs(true);
  const resolveUser = useUserDirectory();
  const [userFilter, setUserFilter] = useState<string>(ALL);
  const [actionFilter, setActionFilter] = useState<string>(ALL);

  // الفلتر بالـ uid — والعرض بالاسم من دليل المستخدمين
  const uids = useMemo(
    () => Array.from(new Set(logs.map((l) => l.uid))).sort((a, b) =>
      resolveUser(a).localeCompare(resolveUser(b))
    ),
    [logs, resolveUser]
  );

  const filtered = logs.filter(
    (l) =>
      (userFilter === ALL || l.uid === userFilter) &&
      (actionFilter === ALL || l.action === actionFilter)
  );

  return (
    <>
      <PageHero icon="history" title={t("title")} subtitle={t("subtitle")} />

      {error && (
        <div className="card !border-danger/40 text-danger text-sm mb-4">
          {t("loadError")}
          <div className="text-xs text-ink-500 mt-1 break-all" dir="ltr">{error}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <select className="form-input sm:!w-auto" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value={ALL}>{t("filterUser")}</option>
          {uids.map((uid) => <option key={uid} value={uid}>{resolveUser(uid)}</option>)}
        </select>
        <select className="form-input sm:!w-auto" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value={ALL}>{t("filterAction")}</option>
          {LOG_ACTIONS.map((a) => <option key={a} value={a}>{t(`actions.${a}`)}</option>)}
        </select>
      </div>

      <div className="table-wrap fade-up fade-up-delay-2">
        {filtered.length === 0 ? (
          <EmptyState icon="history" text={t("table.empty")} />
        ) : (
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>{t("table.when")}</th>
                <th>{t("table.who")}</th>
                <th>{t("table.action")}</th>
                <th>{t("table.detail")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="text-ink-500" dir="ltr">{formatDateTime(l.createdAt)}</td>
                  <td title={l.email}>{resolveUser(l.uid)}</td>
                  <td>
                    <span className="pill bg-pastel-lavender text-ink-700">
                      {t(`actions.${l.action as LogAction}`)}
                    </span>
                  </td>
                  <td className="cell-wrap">{detailText(l, t)}</td>
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
    <AppShell adminOnly>
      <LogsPage />
    </AppShell>
  );
}
