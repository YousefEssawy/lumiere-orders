"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useProducts, productDocId, type ProductInput } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { logAction } from "@/lib/logger";
import { EMPTY_DISPLAY } from "@/lib/appGlobals";
import type { Product } from "@/lib/types";
import type { ProductsParseResult } from "@/lib/productsImport";
import { exportProductsSheet } from "@/lib/productsExport";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import Toggle from "@/components/ui/Toggle";
import ProductModal from "@/components/catalog/ProductModal";
import ProductDetailsModal from "@/components/catalog/ProductDetailsModal";
import ImportProductsModal from "@/components/catalog/ImportProductsModal";

const ALL = "all";

function ProductsPage() {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { products, error, saveProduct, deleteProduct, deleteProducts, importProducts } = useProducts(true);
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  async function handleDelete(p: Product) {
    if (!p.id) return;
    if (!(await confirm({ title: tCommon("delete"), message: t("confirmDelete", { name: p.name }) }))) return;
    try {
      await deleteProduct(p.id);
      flash(t("toast.deleted"));
      logAction(actor, "product.delete", p.name);
    } catch {
      flash(t("toast.saveErr"));
    }
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

  const selectedInView = filtered.filter((p) => p.id && selected.has(p.id));
  const allInViewSelected = filtered.length > 0 && selectedInView.length === filtered.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllInView() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allInViewSelected) filtered.forEach((p) => p.id && next.delete(p.id));
      else filtered.forEach((p) => p.id && next.add(p.id));
      return next;
    });
  }

  async function handleDeleteSelected() {
    const ids = selectedInView.map((p) => p.id!) ;
    if (!ids.length) return;
    if (!(await confirm({ title: t("deleteSelected", { n: ids.length }), message: t("confirmDeleteSelected", { n: ids.length }) }))) return;
    try {
      await deleteProducts(ids);
      flash(t("toast.bulkDeleted", { n: ids.length }));
      logAction(actor, "product.delete", "", ids.length);
      setSelected(new Set());
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleDeleteAll() {
    if (!products.length) return;
    if (!(await confirm({ title: t("deleteAll"), message: t("confirmDeleteAll", { n: products.length }) }))) return;
    try {
      await deleteProducts(products.map((p) => p.id!).filter(Boolean));
      flash(t("toast.bulkDeleted", { n: products.length }));
      logAction(actor, "product.delete", "", products.length);
      setSelected(new Set());
    } catch {
      flash(t("toast.saveErr"));
    }
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
        {filtered.length === 0 ? (
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
                <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-ghost text-[13px] px-2.5 py-1.5"
                        onClick={() => setViewProduct(p)}
                        aria-label={tCommon("view")}
                        title={tCommon("view")}
                      >
                        <span className="icon text-base" aria-hidden>visibility</span>
                      </button>
                      <button
                        className="btn-ghost text-[13px] px-2.5 py-1.5"
                        onClick={() => setEditProduct(p)}
                        aria-label={t("editTitle")}
                        title={t("editTitle")}
                      >
                        <span className="icon text-base" aria-hidden>edit</span>
                      </button>
                      <button
                        className="btn-danger-soft text-[13px]"
                        onClick={() => handleDelete(p)}
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
                      checked={!!p.id && selected.has(p.id)}
                      onChange={() => p.id && toggleOne(p.id)}
                      aria-label={p.name}
                    />
                  </td>
                  <td dir="ltr" className="font-bold">{p.code}</td>
                  <td>
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-9 h-9 rounded-sm object-cover border border-line"
                        loading="lazy"
                      />
                    ) : (
                      <span className="inline-flex w-9 h-9 rounded-sm bg-soft items-center justify-center">
                        <span className="icon !text-[16px] text-ink-300" aria-hidden>image</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div dir="ltr" className="text-start">{p.name}</div>
                    {p.nameAr && <div className="text-xs text-ink-400">{p.nameAr}</div>}
                  </td>
                  <td><span className="pill bg-soft text-ink-500">{p.category || EMPTY_DISPLAY}</span></td>
                  <td>
                    <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                      {p.variants.map((v, i) => (
                        <span
                          key={i}
                          className={
                            "pill " +
                            (v.quantity <= 0 ? "bg-pastel-pink text-danger" : "bg-soft text-ink-700")
                          }
                          dir="ltr"
                          title={`${t("price")}: ${v.price} · ${t("quantity")}: ${v.quantity}`}
                        >
                          {v.size || "—"} · {v.price} · ×{v.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Toggle
                      checked={p.active}
                      onChange={() => handleToggleActive(p)}
                      label={t("active")}
                    />
                  </td>
                </tr>
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
