"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { logAction } from "@/lib/logger";
import { EMPTY_DISPLAY, formatDate, formatMoney } from "@/lib/appGlobals";
import { exportExpensesSheet } from "@/lib/expensesExport";
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import type { ExpenseInput } from "@/hooks/useExpenses";

const ALL = "all";

function ExpensesPage() {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { expenses, error, saveExpense, deleteExpense, deleteExpenses } = useExpenses(true);
  const { categories, addCategory } = useExpenseCategories(true);
  const resolveUser = useUserDirectory();
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const paymentLabel = (m: string | undefined) =>
    m && PAYMENT_METHODS.includes(m as PaymentMethod) ? t(`payment.${m as PaymentMethod}`) : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== ALL && e.category !== categoryFilter) return false;
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        (e.vendor ?? "").toLowerCase().includes(q)
      );
    });
  }, [expenses, search, categoryFilter, fromDate, toDate]);

  const total = useMemo(() => filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0), [filtered]);

  const {
    selected,
    selectedItems: selectedInView,
    allSelected: allInViewSelected,
    toggleOne,
    toggleAll: toggleAllInView,
    clear: clearSelection,
  } = useRowSelection(filtered, (e) => e.id);

  async function handleSave(input: ExpenseInput, id?: string) {
    await saveExpense(input, profile.uid, id);
    flash(id ? t("toast.updated") : t("toast.created"));
    logAction(actor, id ? "expense.update" : "expense.create", input.description);
    setShowCreate(false);
    setEditExpense(null);
  }

  async function handleCreateCategory(name: string) {
    await addCategory(name, profile.uid);
    flash(t("toast.catCreated"));
    logAction(actor, "expenseCategory.create", name);
  }

  async function handleDelete(e: Expense) {
    if (!e.id) return;
    if (!(await confirm({ title: tCommon("delete"), message: t("confirmDelete", { name: e.description }) }))) return;
    try {
      await deleteExpense(e.id);
      flash(t("toast.deleted"));
      logAction(actor, "expense.delete", e.description);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleDeleteSelected() {
    const ids = selectedInView.map((e) => e.id!);
    if (!ids.length) return;
    if (!(await confirm({ title: t("deleteSelected", { n: ids.length }), message: t("confirmDeleteSelected", { n: ids.length }) }))) return;
    try {
      await deleteExpenses(ids);
      flash(t("toast.bulkDeleted", { n: ids.length }));
      logAction(actor, "expense.delete", "", ids.length);
      clearSelection();
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  /** ذكي: المحدد لو فيه تحديد، وإلا كل المعروض */
  function handleExport() {
    const targets = selectedInView.length ? selectedInView : filtered;
    if (!targets.length) return;
    exportExpensesSheet(targets, {
      date: t("date"), description: t("description"), category: t("category"),
      amount: t("amount"), vendor: t("vendor"), paymentMethod: t("paymentMethod"),
      notes: t("notes"), paymentLabel,
    });
    flash(t("toast.exported", { n: targets.length }));
    logAction(actor, "expenses.export", "", targets.length);
  }

  return (
    <>
      <PageHero
        icon="payments"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <>
            {expenses.length > 0 && (
              <button className="btn-ghost" onClick={handleExport}>
                <span className="icon text-base" aria-hidden>download</span>
                {t("exportBtn")}{selectedInView.length ? ` (${selectedInView.length})` : ""}
              </button>
            )}
            {selectedInView.length > 0 && (
              <button className="btn-danger" onClick={handleDeleteSelected}>
                <span className="icon text-base" aria-hidden>delete</span>
                {t("deleteSelected", { n: selectedInView.length })}
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <span className="icon text-base" aria-hidden>add_box</span>
              {t("create")}
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

      {/* بطاقة الإجمالي */}
      <div className="card fade-up fade-up-delay-1 mb-4 flex flex-wrap items-center justify-between gap-3 !py-4">
        <div className="text-sm text-ink-500">{t("totalLabel")}</div>
        <div className="font-display font-extrabold text-2xl text-ink-900" dir="ltr">
          {formatMoney(total)} <span className="text-sm font-bold text-ink-500">{t("egp")}</span>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <input
          className="form-input sm:!w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPh")}
          dir="auto"
        />
        <select className="form-input sm:!w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value={ALL}>{t("filterCategory")}</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input type="date" className="form-input sm:!w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} dir="ltr" aria-label={t("from")} title={t("from")} />
        <input type="date" className="form-input sm:!w-auto" value={toDate} onChange={(e) => setToDate(e.target.value)} dir="ltr" aria-label={t("to")} title={t("to")} />
        <div className="flex-1" />
        <div className="text-sm text-ink-500 self-center">
          {t("count")} <b className="text-ink-900 text-lg">{filtered.length}</b>
        </div>
      </div>

      <div className="table-wrap fade-up fade-up-delay-2">
        {filtered.length === 0 ? (
          <EmptyState icon="payments" text={t("empty")} />
        ) : (
          <table className="data-table min-w-[860px]">
            <thead>
              <tr>
                <th></th>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                    checked={allInViewSelected}
                    onChange={toggleAllInView}
                    aria-label={t("count")}
                  />
                </th>
                <th>{t("date")}</th>
                <th>{t("description")}</th>
                <th>{t("category")}</th>
                <th>{t("amount")}</th>
                <th>{t("vendor")}</th>
                <th>{t("paymentMethod")}</th>
                <th>{t("addedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-ghost text-[13px] px-2.5 py-1.5"
                        onClick={() => setEditExpense(e)}
                        aria-label={t("editTitle")}
                        title={t("editTitle")}
                      >
                        <span className="icon text-base" aria-hidden>edit</span>
                      </button>
                      <button
                        className="btn-danger-soft text-[13px]"
                        onClick={() => handleDelete(e)}
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
                      checked={!!e.id && selected.has(e.id)}
                      onChange={() => e.id && toggleOne(e.id)}
                      aria-label={e.description}
                    />
                  </td>
                  <td className="text-ink-500" dir="ltr">{formatDate(e.date)}</td>
                  <td className="font-semibold">
                    <span className="block max-w-[260px] truncate" title={e.description}>{e.description}</span>
                    {e.notes && <span className="block max-w-[260px] truncate text-xs font-normal text-ink-400" title={e.notes}>{e.notes}</span>}
                  </td>
                  <td><span className="pill bg-pastel-lavender text-ink-700">{e.category || EMPTY_DISPLAY}</span></td>
                  <td className="font-bold" dir="ltr">{formatMoney(Number(e.amount) || 0)}</td>
                  <td>{e.vendor || EMPTY_DISPLAY}</td>
                  <td>{e.paymentMethod ? <span className="pill bg-soft text-ink-500">{t(`payment.${e.paymentMethod}`)}</span> : EMPTY_DISPLAY}</td>
                  <td className="text-ink-500 text-xs">
                    <span className="block max-w-[140px] truncate" title={resolveUser(e.createdBy)}>
                      {resolveUser(e.createdBy) || EMPTY_DISPLAY}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editExpense) && (
        <ExpenseModal
          expense={editExpense}
          categories={categories}
          onSave={handleSave}
          onCreateCategory={handleCreateCategory}
          onClose={() => { setShowCreate(false); setEditExpense(null); }}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <ExpensesPage />
    </AppShell>
  );
}
