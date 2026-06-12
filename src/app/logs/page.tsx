"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLogs } from "@/hooks/useLogs";
import { LOG_ACTIONS, type LogAction } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import AppShell from "@/components/layout/AppShell";
import { useAppLocale } from "@/components/IntlProvider";
import PageHero from "@/components/ui/PageHero";

const ALL = "all";

function LogsPage() {
  const t = useTranslations("logs");
  const { locale } = useAppLocale();
  const logs = useLogs(true);
  const [userFilter, setUserFilter] = useState<string>(ALL);
  const [actionFilter, setActionFilter] = useState<string>(ALL);

  const emails = useMemo(
    () => Array.from(new Set(logs.map((l) => l.email))).sort(),
    [logs]
  );

  const filtered = logs.filter(
    (l) =>
      (userFilter === ALL || l.email === userFilter) &&
      (actionFilter === ALL || l.action === actionFilter)
  );

  return (
    <>
      <PageHero icon="history" title={t("title")} subtitle={t("subtitle")} />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <select className="form-input sm:!w-auto" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value={ALL}>{t("filterUser")}</option>
          {emails.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="form-input sm:!w-auto" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value={ALL}>{t("filterAction")}</option>
          {LOG_ACTIONS.map((a) => <option key={a} value={a}>{t(`actions.${a}`)}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-5 text-ink-500 text-sm">{t("table.empty")}</div>
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
                  <td className="text-ink-500">{formatDateTime(l.createdAt, locale)}</td>
                  <td dir="ltr">{l.email}</td>
                  <td>
                    <span className="pill bg-pastel-lavender text-ink-700">
                      {t(`actions.${l.action as LogAction}`)}
                    </span>
                  </td>
                  <td className="cell-wrap">
                    {l.detail}
                    {l.count !== undefined ? ` (${l.count})` : ""}
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
    <AppShell adminOnly>
      <LogsPage />
    </AppShell>
  );
}
