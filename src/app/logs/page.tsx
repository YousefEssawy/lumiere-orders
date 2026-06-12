"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLogs } from "@/hooks/useLogs";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import {
  LOG_ACTIONS, ORDER_STATUSES, type LogAction, type LogEntry, type OrderStatus,
} from "@/lib/types";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import { ACTION_CLASS, STATUS_CLASS } from "@/lib/statusStyles";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";

const ALL = "all";

/** عمليات تفاصيلها = اسم عميل */
const CUSTOMER_ACTIONS: LogAction[] = [
  "order.add", "order.update", "order.delete", "history.update", "history.delete",
];
/** عمليات تفاصيلها = مستخدم (إيميل) */
const USER_ACTIONS: LogAction[] = [
  "user.create", "user.update", "user.activate", "user.deactivate", "user.password",
];

interface DetailProps {
  l: LogEntry;
  resolveUser: (v?: string) => string;
}

/** عرض دلالي للتفاصيل حسب نوع العملية — بدل النص الخام */
function LogDetail({ l, resolveUser }: DetailProps) {
  const t = useTranslations("logs");
  const tStatuses = useTranslations("history.statuses");
  const action = l.action as LogAction;

  // تغيير حالة: "اسم العميل: statusKey" → اسم + badge مترجمة
  if (action === "history.status") {
    const idx = l.detail.lastIndexOf(": ");
    const name = idx >= 0 ? l.detail.slice(0, idx) : l.detail;
    const statusKey = idx >= 0 ? (l.detail.slice(idx + 2) as OrderStatus) : null;
    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span>{name}</span>
        {statusKey && ORDER_STATUSES.includes(statusKey) && (
          <>
            <span className="icon !text-[14px] text-ink-300 rtl:rotate-180" aria-hidden>arrow_forward</span>
            <span className={"pill " + STATUS_CLASS[statusKey]}>{tStatuses(statusKey)}</span>
          </>
        )}
      </span>
    );
  }

  // عمليات على مستخدم: الاسم المحلول + الإيميل صغير لو مختلف
  if (USER_ACTIONS.includes(action) && l.detail) {
    const name = resolveUser(l.detail);
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="icon !text-[15px] text-ink-300" aria-hidden>person</span>
        <span>{name}</span>
        {name !== l.detail && (
          <span className="text-xs text-ink-300" dir="ltr">({l.detail})</span>
        )}
      </span>
    );
  }

  // عمليات على أوردر: اسم العميل بأيقونة
  if (CUSTOMER_ACTIONS.includes(action) && l.detail) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="icon !text-[15px] text-ink-300" aria-hidden>package_2</span>
        <span>{l.detail}</span>
      </span>
    );
  }

  // عمليات جماعية: العدد كشارة واضحة
  if (l.count !== undefined) {
    const label = action === "system.migrate"
      ? t("records", { n: l.count })
      : t("items", { n: l.count });
    return <span className="pill bg-soft text-ink-700">{label}</span>;
  }

  return <span>{l.detail || EMPTY_DISPLAY}</span>;
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
                    <span className={"pill " + (ACTION_CLASS[l.action as LogAction] ?? "bg-soft text-ink-500")}>
                      {t(`actions.${l.action as LogAction}`)}
                    </span>
                  </td>
                  <td className="cell-wrap">
                    <LogDetail l={l} resolveUser={resolveUser} />
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
