"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useProducts, productDocId, type ProductInput } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useCrudActions } from "@/hooks/useCrudActions";
import { logAction } from "@/lib/logger";
import type { Product } from "@/lib/types";
import type { ProductsParseResult } from "@/lib/productsImport";
import { exportProductsSheet } from "@/lib/productsExport";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import ProductModal from "@/components/catalog/ProductModal";
import ProductDetailsModal from "@/components/catalog/ProductDetailsModal";
import ImportProductsModal from "@/components/catalog/ImportProductsModal";
import ProductRow from "@/components/catalog/ProductRow";

const ALL = "all";

function ProductsPage() {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { products, error, loading, saveProduct, deleteProduct, deleteProducts, importProducts } = useProducts(true);
  const { categories, addCategory } = useCategories(true);
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== ALL && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.nameAr ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter]);

  async function handleSave(input: ProductInput, isNew: boolean) {
    await saveProduct(input, profile.uid, isNew);
    flash(isNew ? t("toast.created") : t("toast.updated"));
    logAction(actor, isNew ? "product.create" : "product.update", `${input.name}`);
    setShowCreate(false);
    setEditProduct(null);
  }

  async function handleToggleActive(p: Product) {
    if (!p.id) return;
    try {
      await saveProduct(
        { code: p.code, name: p.name, nameAr: p.nameAr, category: p.category, imageUrl: p.imageUrl, active: !p.active, variants: p.variants },
        profile.uid,
        false
      );
      flash(t("toast.updated"));
      logAction(actor, "product.update", p.name);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  const {
    selected,
    selectedItems: selectedInView,
    allSelected: allInViewSelected,
    toggleOne,
    toggleAll: toggleAllInView,
    clear: clearSelection,
  } = useRowSelection(filtered, (p) => p.id);

  const { runDelete, runBulkDelete } = useCrudActions({ confirm, flash, actor, clearSelection });

  async function handleDelete(p: Product) {
    if (!p.id) return;
    await runDelete({
      confirmTitle: tCommon("delete"),
      confirmMessage: t("confirmDelete", { name: p.name }),
      successToast: t("toast.deleted"),
      errorToast: t("toast.saveErr"),
      logActionName: "product.delete",
      logDetail: p.name,
      onDelete: () => deleteProduct(p.id!),
    });
  }

  async function handleDeleteSelected() {
    const ids = selectedInView.map((p) => p.id!);
    if (!ids.length) return;
    await runBulkDelete({
      count: ids.length,
      confirmTitle: t("deleteSelected", { n: ids.length }),
      confirmMessage: t("confirmDeleteSelected", { n: ids.length }),
      successToast: t("toast.bulkDeleted", { n: ids.length }),
      errorToast: t("toast.saveErr"),
      logActionName: "product.delete",
      onDeleteMany: () => deleteProducts(ids),
    });
  }

  async function handleDeleteAll() {
    if (!products.length) return;
    const ids = products.map((p) => p.id!);
    await runBulkDelete({
      count: ids.length,
      confirmTitle: t("deleteAll"),
      confirmMessage: t("confirmDeleteAll", { n: ids.length }),
      successToast: t("toast.bulkDeleted", { n: ids.length }),
      errorToast: t("toast.saveErr"),
      logActionName: "product.delete",
      onDeleteMany: () => deleteProducts(ids),
    });
  }

  /** ذكي: المحدد لو فيه تحديد، وإلا كل المعروض حسب الفلتر */
  function handleExport() {
    const targets = selectedInView.length ? selectedInView : filtered;
    if (!targets.length) return;
    exportProductsSheet(targets);
    flash(t("toast.exported", { n: targets.length }));
    logAction(actor, "products.export", "", targets.length);
  }

  async function handleImport(result: ProductsParseResult) {
    // الفئات الجديدة من الشيت بتتعمل تلقائياً
    const known = new Set(categories.map((c) => c.name.toLowerCase()));
    for (const name of result.categories) {
      if (!known.has(name.toLowerCase())) {
        await addCategory(name, profile.uid);
        logAction(actor, "category.create", name);
      }
    }
    const existingIds = new Set(products.map((p) => productDocId(p.code)));
    await importProducts(result.products, existingIds, profile.uid);
    flash(t("import.done", { n: result.products.length }));
    logAction(actor, "products.import", "", result.products.length);
    setShowImport(false);
  }

  return (
    <>
      <PageHero
        icon="inventory_2"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <>
            {products.length > 0 && (
              <button className="btn-ghost !text-danger" onClick={handleDeleteAll}>
                <span className="icon text-base" aria-hidden>delete_forever</span>
                {t("deleteAll")}
              </button>
            )}
            <button className="btn-ghost" onClick={() => setShowImport(true)}>
              <span className="icon text-base" aria-hidden>upload_file</span>
              {t("importBtn")}
            </button>
            {products.length > 0 && (
              <button className="btn-ghost" onClick={handleExport}>
                <span className="icon text-base" aria-hidden>download</span>
                {t("exportBtn")}{selectedInView.length ? ` (${selectedInView.length})` : ""}
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

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <input
          className="form-input sm:!w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPh")}
        />
        <select className="form-input sm:!w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value={ALL}>{t("filterCategory")}</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {selectedInView.length > 0 && (
          <button className="btn-danger" onClick={handleDeleteSelected}>
            <span className="icon text-base" aria-hidden>delete</span>
            {t("deleteSelected", { n: selectedInView.length })}
          </button>
        )}
        <div className="flex-1" />
        <div className="text-sm text-ink-500 self-center">
          {t("total")} <b className="text-ink-900 text-lg">{filtered.length}</b>
        </div>
      </div>

      <div className="table-wrap fade-up fade-up-delay-2">
        {loading ? (
          <div className="text-center py-14 text-sm text-ink-500">{tCommon("loading")}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="inventory_2" text={t("empty")} />
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
                    aria-label={t("total")}
                  />
                </th>
                <th>{t("code")}</th>
                <th>{t("image")}</th>
                <th>{t("name")}</th>
                <th>{t("category")}</th>
                <th>{t("variants")}</th>
                <th>{t("active")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  selected={!!p.id && selected.has(p.id)}
                  onView={setViewProduct}
                  onEdit={setEditProduct}
                  onDelete={handleDelete}
                  onToggleSelect={toggleOne}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editProduct) && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditProduct(null); }}
        />
      )}
      {viewProduct && (
        <ProductDetailsModal product={viewProduct} onClose={() => setViewProduct(null)} />
      )}
      {showImport && (
        <ImportProductsModal onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <ProductsPage />
    </AppShell>
  );
}
