"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { logAction } from "@/lib/logger";
import type { Category } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import Toggle from "@/components/ui/Toggle";
import CategoryModal from "@/components/catalog/CategoryModal";

function CategoriesPage() {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { categories, error, addCategory, updateCategory, deleteCategory, deleteCategories } = useCategories(true);
  const { products } = useProducts(true);
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.category] = (map[p.category] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const selectedCategories = categories.filter((c) => c.id && selected.has(c.id));
  const allSelected = categories.length > 0 && selectedCategories.length === categories.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.id!).filter(Boolean)));
  }

  /** حذف جماعي — الفئات المستخدمة بتتعدى ويتبلغ عنها */
  async function bulkDelete(targets: Category[]) {
    const deletable = targets.filter((c) => (countByCategory[c.name] ?? 0) === 0 && c.id);
    const skipped = targets.length - deletable.length;
    if (!deletable.length) {
      flash(t("toast.allInUse"));
      return;
    }
    if (!(await confirm({ title: t("deleteSelected", { n: deletable.length }), message: t("confirmDeleteSelected", { n: deletable.length }) }))) return;
    try {
      await deleteCategories(deletable.map((c) => c.id!));
      flash(skipped > 0 ? t("toast.bulkDeletedSkipped", { n: deletable.length, s: skipped }) : t("toast.bulkDeleted", { n: deletable.length }));
      logAction(actor, "category.delete", "", deletable.length);
      setSelected(new Set());
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleSave(name: string, active: boolean) {
    if (editCategory?.id) {
      await updateCategory(editCategory.id, { name, active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "category.update", name);
    } else {
      await addCategory(name, profile.uid, active);
      flash(t("toast.created"));
      logAction(actor, "category.create", name);
    }
    setShowCreate(false);
    setEditCategory(null);
  }

  async function handleToggle(c: Category) {
    if (!c.id) return;
    try {
      await updateCategory(c.id, { active: !c.active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "category.update", c.name);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleDelete(c: Category) {
    if (!c.id) return;
    const count = countByCategory[c.name] ?? 0;
    if (count > 0) {
      flash(t("toast.hasProducts", { n: count }));
      return;
    }
    if (!(await confirm({ title: tCommon("delete"), message: t("confirmDelete", { name: c.name }) }))) return;
    try {
      await deleteCategory(c.id);
      flash(t("toast.deleted"));
      logAction(actor, "category.delete", c.name);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  return (
    <>
      <PageHero
        icon="category"
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
        {categories.length === 0 ? (
          <EmptyState icon="category" text={t("empty")} />
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
                <th>{t("productsCount")}</th>
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
        <CategoryModal
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
    <AppShell>
      <CategoriesPage />
    </AppShell>
  );
}
