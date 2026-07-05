"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useFunds, type FundInput } from "@/hooks/useFunds";
import { useExpenses } from "@/hooks/useExpenses";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useCrudActions } from "@/hooks/useCrudActions";
import { logAction } from "@/lib/logger";
import { EMPTY_DISPLAY, formatDate, formatMoney } from "@/lib/appGlobals";
import type { Fund } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import FundModal from "@/components/treasury/FundModal";

function TreasuryPage() {
  const t = useTranslations("treasury");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { funds, error, loading, saveFund, deleteFund, deleteFunds } = useFunds(true);
  const { expenses } = useExpenses(true);
  const resolveUser = useUserDirectory();
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [showCreate, setShowCreate] = useState(false);
  const [editFund, setEditFund] = useState<Fund | null>(null);

  // إجماليات الخزنة — الرصيد = المضاف ناقص المصروفات المدفوعة اللي بتتخصم
  const { totalFunds, totalDeducted, totalDebt, balance } = useMemo(() => {
    const tf = funds.reduce((s, f) => s + (Number(f.amount) || 0), 0);
    let deducted = 0;
    let debt = 0;
    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      if (e.paid && e.deductFromBalance) deducted += amt;
      if (!e.paid) debt += amt;
    }
    return { totalFunds: tf, totalDeducted: deducted, totalDebt: debt, balance: tf - deducted };
  }, [funds, expenses]);

  const {
    selected,
    selectedItems: selectedFunds,
    allSelected,
    toggleOne,
    toggleAll,
    clear: clearSelection,
  } = useRowSelection(funds, (f) => f.id);

  async function handleSave(input: FundInput, id?: string) {
    await saveFund(input, profile.uid, id);
    flash(id ? t("toast.updated") : t("toast.created"));
    logAction(actor, id ? "fund.update" : "fund.create", formatMoney(input.amount));
    setShowCreate(false);
    setEditFund(null);
  }

  const { runDelete, runBulkDelete } = useCrudActions({ confirm, flash, actor, clearSelection });

  async function handleDelete(f: Fund) {
    if (!f.id) return;
    await runDelete({
      confirmTitle: tCommon("delete"),
      confirmMessage: t("confirmDelete", { amount: formatMoney(f.amount) }),
      successToast: t("toast.deleted"),
      errorToast: t("toast.saveErr"),
      logActionName: "fund.delete",
      logDetail: formatMoney(f.amount),
      onDelete: () => deleteFund(f.id!),
    });
  }

  async function handleDeleteSelected() {
    const ids = selectedFunds.map((f) => f.id!);
    if (!ids.length) return;
    await runBulkDelete({
      count: ids.length,
      confirmTitle: t("deleteSelected", { n: ids.length }),
      confirmMessage: t("confirmDeleteSelected", { n: ids.length }),
      successToast: t("toast.bulkDeleted", { n: ids.length }),
      errorToast: t("toast.saveErr"),
      logActionName: "fund.delete",
      onDeleteMany: () => deleteFunds(ids),
    });
  }

  return (
    <>
      <PageHero
        icon="account_balance_wallet"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <>
            {selectedFunds.length > 0 && (
              <button className="btn-danger" onClick={handleDeleteSelected}>
                <span className="icon text-base" aria-hidden>delete</span>
                {t("deleteSelected", { n: selectedFunds.length })}
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <span className="icon text-base" aria-hidden>add_card</span>
              {t("addFunds")}
            </button>
          </>
        }
      />

      {error && (
        <div className="card !border-danger/40 text-danger text-sm mb-4">
          {t("loadError")}
          <div className="text-xs text-ink-500 mt-1 break-all" dir="ltr">{error}</div>
        </div>
      )}

      {/* بطاقة الرصيد الرئيسية */}
      <div className="card fade-up mb-4 !p-0 overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: "var(--grad-hero)" }} aria-hidden />
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-ink-500 mb-1 flex items-center gap-1.5">
              <span className="icon !text-[18px]" aria-hidden>savings</span>
              {t("balance")}
            </div>
            <div className={"font-display font-extrabold text-4xl " + (balance < 0 ? "text-danger" : "text-success")} dir="ltr">
              {formatMoney(balance)} <span className="text-base font-bold text-ink-500">{t("egp")}</span>
            </div>
            <div className="text-xs text-ink-400 mt-1">{t("balanceHint")}</div>
          </div>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4 fade-up fade-up-delay-1">
        <div className="card !py-4">
          <div className="text-sm text-ink-500 flex items-center gap-1.5">
            <span className="icon !text-[18px] text-success" aria-hidden>add_circle</span>
            {t("totalFunds")}
          </div>
          <div className="font-display font-extrabold text-2xl text-ink-900 mt-1" dir="ltr">{formatMoney(totalFunds)}</div>
        </div>
        <div className="card !py-4">
          <div className="text-sm text-ink-500 flex items-center gap-1.5">
            <span className="icon !text-[18px]" aria-hidden>remove_circle</span>
            {t("totalDeducted")}
          </div>
          <div className="font-display font-extrabold text-2xl text-ink-900 mt-1" dir="ltr">{formatMoney(totalDeducted)}</div>
        </div>
        <div className="card !py-4">
          <div className="text-sm text-ink-500 flex items-center gap-1.5">
            <span className="icon !text-[18px] text-warning" aria-hidden>schedule</span>
            {t("totalDebt")}
          </div>
          <div className="font-display font-extrabold text-2xl text-ink-900 mt-1" dir="ltr">{formatMoney(totalDebt)}</div>
        </div>
      </div>

      {/* سجل إضافات الرصيد */}
      <div className="flex items-center justify-between gap-3 mb-3 mt-6">
        <h2 className="font-bold text-ink-900">{t("fundsListTitle")}</h2>
        <div className="text-sm text-ink-500">
          {t("count")} <b className="text-ink-900 text-lg">{funds.length}</b>
        </div>
      </div>

      <div className="table-wrap fade-up fade-up-delay-2">
        {loading ? (
          <div className="text-center py-14 text-sm text-ink-500">{tCommon("loading")}</div>
        ) : funds.length === 0 ? (
          <EmptyState icon="account_balance_wallet" text={t("empty")} />
        ) : (
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th></th>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t("count")}
                  />
                </th>
                <th>{t("date")}</th>
                <th>{t("amount")}</th>
                <th>{t("source")}</th>
                <th>{t("notes")}</th>
                <th>{t("addedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-ghost text-[13px] px-2.5 py-1.5"
                        onClick={() => setEditFund(f)}
                        aria-label={t("editTitle")}
                        title={t("editTitle")}
                      >
                        <span className="icon text-base" aria-hidden>edit</span>
                      </button>
                      <button
                        className="btn-danger-soft text-[13px]"
                        onClick={() => handleDelete(f)}
                        aria-label={tCommon("delete")}
                        title={tCommon("delete")}
                      >
                        <span className="icon text-base" aria-hidden>delete</span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                      checked={!!f.id && selected.has(f.id)}
                      onChange={() => f.id && toggleOne(f.id)}
                      aria-label={formatMoney(f.amount)}
                    />
                  </td>
                  <td className="text-ink-500" dir="ltr">{formatDate(f.date)}</td>
                  <td className="font-bold text-success" dir="ltr">+{formatMoney(f.amount)}</td>
                  <td>{f.source || EMPTY_DISPLAY}</td>
                  <td>
                    {f.notes
                      ? <span className="block max-w-[240px] truncate text-ink-500" title={f.notes}>{f.notes}</span>
                      : EMPTY_DISPLAY}
                  </td>
                  <td className="text-ink-500 text-xs">
                    <span className="block max-w-[140px] truncate" title={resolveUser(f.createdBy)}>
                      {resolveUser(f.createdBy) || EMPTY_DISPLAY}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editFund) && (
        <FundModal
          fund={editFund}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditFund(null); }}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <TreasuryPage />
    </AppShell>
  );
}
