"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { logAction } from "@/lib/logger";
import type { Category } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import Toggle from "@/components/ui/Toggle";
import CategoryModal from "@/components/catalog/CategoryModal";

function CategoriesPage() {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { categories, error, addCategory, updateCategory, deleteCategory } = useCategories(true);
  const { products } = useProducts(true);
  const flash = useToast();
  const actor = { uid: profile.uid, email: profile.email };

  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.category] = (map[p.category] ?? 0) + 1;
    }
    return map;
  }, [products]);

  async function handleSave(name: string) {
    if (editCategory?.id) {
      await updateCategory(editCategory.id, { name }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "category.update", name);
    } else {
      await addCategory(name, profile.uid);
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
    if (!window.confirm(t("confirmDelete", { name: c.name }))) return;
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
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <span className="icon text-base" aria-hidden>add_box</span>
            {t("create")}
          </button>
        }
      />

      {error && (
        <div className="card !border-danger/40 text-danger text-sm mb-4">
          {t("loadError")}
          <div className="text-xs text-ink-500 mt-1 break-all" dir="ltr">{error}</div>
        </div>
      )}

      <div className="table-wrap fade-up fade-up-delay-2 max-w-2xl">
        {categories.length === 0 ? (
          <EmptyState icon="category" text={t("empty")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
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
