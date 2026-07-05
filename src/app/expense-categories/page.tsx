"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useCrudActions } from "@/hooks/useCrudActions";
import { logAction } from "@/lib/logger";
import type { ExpenseCategory } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import Toggle from "@/components/ui/Toggle";
import ExpenseCategoryModal from "@/components/expenses/ExpenseCategoryModal";

function ExpenseCategoriesPage() {
  const t = useTranslations("expenseCategories");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { categories, error, loading, addCategory, updateCategory, deleteCategory, deleteCategories } = useExpenseCategories(true);
  const { expenses } = useExpenses(true);
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<ExpenseCategory | null>(null);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) map[e.category] = (map[e.category] ?? 0) + 1;
    return map;
  }, [expenses]);

  const {
    selected,
    selectedItems: selectedCategories,
    allSelected,
    toggleOne,
    toggleAll,
    clear: clearSelection,
  } = useRowSelection(categories, (c) => c.id);

  const { runDelete, runBulkDelete } = useCrudActions({ confirm, flash, actor, clearSelection });

  async function bulkDelete(targets: ExpenseCategory[]) {
    const deletable = targets.filter((c) => (countByCategory[c.name] ?? 0) === 0 && c.id);
    const skipped = targets.length - deletable.length;
    if (!deletable.length) {
      flash(t("toast.allInUse"));
      return;
    }
    const ids = deletable.map((c) => c.id!);
    await runBulkDelete({
      count: ids.length,
      confirmTitle: t("deleteSelected", { n: ids.length }),
      confirmMessage: t("confirmDeleteSelected", { n: ids.length }),
      successToast: skipped > 0
        ? t("toast.bulkDeletedSkipped", { n: ids.length, s: skipped })
        : t("toast.bulkDeleted", { n: ids.length }),
      errorToast: t("toast.saveErr"),
      logActionName: "expenseCategory.delete",
      onDeleteMany: () => deleteCategories(ids),
    });
  }

  async function handleSave(name: string, active: boolean) {
    if (editCategory?.id) {
      await updateCategory(editCategory.id, { name, active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "expenseCategory.update", name);
    } else {
      await addCategory(name, profile.uid, active);
      flash(t("toast.created"));
      logAction(actor, "expenseCategory.create", name);
    }
    setShowCreate(false);
    setEditCategory(null);
  }

  async function handleToggle(c: ExpenseCategory) {
    if (!c.id) return;
    try {
      await updateCategory(c.id, { active: !c.active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "expenseCategory.update", c.name);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleDelete(c: ExpenseCategory) {
    if (!c.id) return;
    await runDelete({
      confirmTitle: tCommon("delete"),
      confirmMessage: t("confirmDelete", { name: c.name }),
      successToast: t("toast.deleted"),
      errorToast: t("toast.saveErr"),
      logActionName: "expenseCategory.delete",
      logDetail: c.name,
      guard: () => {
        const count = countByCategory[c.name] ?? 0;
        return count > 0 ? t("toast.hasExpenses", { n: count }) : null;
      },
      onDelete: () => deleteCategory(c.id!),
    });
  }

  return (
    <>
      <PageHero
        icon="sell"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <>
            {categories.length > 0 && (
              <button className="btn-ghost !text-danger" onClick={() => bulkDelete(categories)}>
                <span className="icon text-base" aria-hidden>delete_forever</span>
                {t("deleteAll")}
              </button>
            )}
            {selectedCategories.length > 0 && (
              <button className="btn-danger" onClick={() => bulkDelete(selectedCategories)}>
                <span className="icon text-base" aria-hidden>delete</span>
                {t("deleteSelected", { n: selectedCategories.length })}
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

      <div className="table-wrap fade-up fade-up-delay-2">
        {loading ? (
          <div className="text-center py-14 text-sm text-ink-500">{tCommon("loading")}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon="sell" text={t("empty")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t("title")}
                  />
                </th>
                <th>{t("name")}</th>
                <th>{t("expensesCount")}</th>
                <th>{t("active")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className={c.active ? "" : "opacity-60"}>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-ghost text-[13px] px-2.5 py-1.5"
                        onClick={() => setEditCategory(c)}
                        aria-label={t("editTitle")}
                        title={t("editTitle")}
                      >
                        <span className="icon text-base" aria-hidden>edit</span>
                      </button>
                      <button
                        className="btn-danger-soft text-[13px]"
                        onClick={() => handleDelete(c)}
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
                      checked={!!c.id && selected.has(c.id)}
                      onChange={() => c.id && toggleOne(c.id)}
                      aria-label={c.name}
                    />
                  </td>
                  <td className="font-semibold">{c.name}</td>
                  <td>{countByCategory[c.name] ?? 0}</td>
                  <td>
                    <Toggle checked={c.active} onChange={() => handleToggle(c)} label={t("active")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editCategory) && (
        <ExpenseCategoryModal
          category={editCategory}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditCategory(null); }}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <ExpenseCategoriesPage />
    </AppShell>
  );
}
