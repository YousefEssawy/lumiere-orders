"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useOrderSources } from "@/hooks/useOrderSources";
import { useOrders } from "@/hooks/useOrders";
import { useSourceLabel } from "@/hooks/useSourceLabel";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useCrudActions } from "@/hooks/useCrudActions";
import { logAction } from "@/lib/logger";
import { sourceClass } from "@/lib/statusStyles";
import { DEFAULT_ORDER_SOURCES, isSystemSource, missingDefaultSources } from "@/lib/orderSources";
import type { OrderSourceDoc } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import Toggle from "@/components/ui/Toggle";
import OrderSourceModal, { type NameLock } from "@/components/orders/OrderSourceModal";

const nameKey = (name: string) => name.trim().toLowerCase();

function OrderSourcesPage() {
  const t = useTranslations("orderSources");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const {
    sources, error, loading, seedDefaults, addSource, updateSource, deleteSource, deleteSources,
  } = useOrderSources(true);
  const { orders } = useOrders(true);
  const sourceLabel = useSourceLabel();
  const flash = useToast();
  const confirm = useConfirm();
  const actor = { uid: profile.uid, email: profile.email };

  const [showCreate, setShowCreate] = useState(false);
  const [editSource, setEditSource] = useState<OrderSourceDoc | null>(null);
  const [seeding, setSeeding] = useState(false);

  // الاستخدام في أوردرات التجهيز الحالية — الأوردر بيخزن اسم المصدر، فالشحنات
  // القديمة بتفضل محتفظة بالاسم كنص حتى لو المصدر اتمسح
  const countBySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      const key = nameKey(o.source ?? "");
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [orders]);
  const usage = (s: OrderSourceDoc) => countBySource[nameKey(s.name)] ?? 0;

  const missingDefaults = useMemo(() => missingDefaultSources(sources), [sources]);
  // مصادر المتجر مش قابلة للحذف — فبرا التحديد (حتى «تحديد الكل»)
  const selectable = useMemo(() => sources.filter((s) => !isSystemSource(s)), [sources]);

  const {
    selected,
    selectedItems: selectedSources,
    allSelected,
    toggleOne,
    toggleAll,
    clear: clearSelection,
  } = useRowSelection(selectable, (s) => s.id);

  const { runDelete, runBulkDelete } = useCrudActions({ confirm, flash, actor, clearSelection });

  const isDeletable = (s: OrderSourceDoc) => !isSystemSource(s) && usage(s) === 0;

  // الاسم بيتقفل لو الاستيراد بيعتمد عليه، أو لو أوردرات تحت التجهيز شايلاه
  // (تغييره كان هيسيبهم على اسم قديم ويخلي المصدر ينفع يتمسح)
  function nameLockOf(s: OrderSourceDoc | null): NameLock {
    if (!s) return null;
    if (isSystemSource(s)) return "system";
    return usage(s) > 0 ? "inUse" : null;
  }

  async function bulkDelete(targets: OrderSourceDoc[]) {
    const deletable = targets.filter((s) => isDeletable(s) && s.id);
    const skipped = targets.length - deletable.length;
    if (!deletable.length) {
      flash(t("toast.noneDeletable"));
      return;
    }
    const ids = deletable.map((s) => s.id!);
    await runBulkDelete({
      count: ids.length,
      confirmTitle: t("deleteSelected", { n: ids.length }),
      confirmMessage: t("confirmDeleteSelected", { n: ids.length }),
      successToast: skipped > 0
        ? t("toast.bulkDeletedSkipped", { n: ids.length, s: skipped })
        : t("toast.bulkDeleted", { n: ids.length }),
      errorToast: t("toast.saveErr"),
      logActionName: "orderSource.delete",
      onDeleteMany: () => deleteSources(ids),
    });
  }

  /** زرع الافتراضي الناقص — بيرمي لو فشل، والنداء هو اللي بيعرض الخطأ */
  async function seedMissing() {
    const added = await seedDefaults(profile.uid, sources);
    if (added.length) logAction(actor, "orderSource.create", added.join(", "), added.length);
  }

  async function handleSave(name: string, active: boolean) {
    if (editSource?.id) {
      const locked = nameLockOf(editSource);
      await updateSource(editSource.id, locked ? { active } : { name, active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "orderSource.update", locked ? editSource.name : name);
    } else {
      // أول مصدر مخصص: نزرع الافتراضي الأول، وإلا الفورم كان هيفقد واتساب/ويلت...
      // (بيرمي لو فشل — المودال بيعرض الخطأ ويفك القفل)
      if (!sources.length) await seedMissing();
      await addSource(name, profile.uid, active);
      flash(t("toast.created"));
      logAction(actor, "orderSource.create", name);
    }
    setShowCreate(false);
    setEditSource(null);
  }

  async function handleToggle(s: OrderSourceDoc) {
    if (!s.id) return;
    try {
      await updateSource(s.id, { active: !s.active }, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "orderSource.update", s.name);
    } catch {
      flash(t("toast.saveErr"));
    }
  }

  async function handleDelete(s: OrderSourceDoc) {
    if (!s.id) return;
    await runDelete({
      confirmTitle: tCommon("delete"),
      confirmMessage: t("confirmDelete", { name: sourceLabel(s.name) }),
      successToast: t("toast.deleted"),
      errorToast: t("toast.saveErr"),
      logActionName: "orderSource.delete",
      logDetail: s.name,
      guard: () => {
        if (isSystemSource(s)) return t("toast.isSystem");
        const count = usage(s);
        return count > 0 ? t("toast.hasOrders", { n: count }) : null;
      },
      onDelete: () => deleteSource(s.id!),
    });
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedMissing();
      flash(t("toast.seeded"));
    } catch {
      flash(t("toast.saveErr"));
    }
    setSeeding(false);
  }

  // قبل الزرع الفورم شغال بالافتراضي، فأسماؤه محجوزة برضه
  const takenNames = (sources.length ? sources : DEFAULT_ORDER_SOURCES)
    .filter((s) => s.id !== editSource?.id)
    .map((s) => s.name);

  const seedButton = (label: string) => (
    <button className="btn-ghost" onClick={handleSeed} disabled={seeding}>
      <span className="icon text-base" aria-hidden>playlist_add</span>
      {seeding ? tCommon("loading") : label}
    </button>
  );

  return (
    <>
      <PageHero
        icon="storefront"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <>
            {sources.length > 0 && missingDefaults.length > 0 && seedButton(t("restore", { n: missingDefaults.length }))}
            {selectedSources.length > 0 && (
              <button className="btn-danger" onClick={() => bulkDelete(selectedSources)}>
                <span className="icon text-base" aria-hidden>delete</span>
                {t("deleteSelected", { n: selectedSources.length })}
              </button>
            )}
            {/* قبل ما القايمة تتحمّل «فاضية» مش معناها فاضية — الزرع وقتها كان هيكتب فوق مصادر موجودة */}
            <button className="btn-primary" onClick={() => setShowCreate(true)} disabled={loading || !!error}>
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
          <div className="text-center py-14 text-sm text-ink-500" role="status">{tCommon("loading")}</div>
        ) : sources.length === 0 ? (
          <div className="pb-8 text-center">
            <EmptyState icon="storefront" text={t("empty")} />
            {!error && seedButton(t("seed"))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><span className="sr-only">{t("actions")}</span></th>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t("selectAll")}
                  />
                </th>
                <th>{t("name")}</th>
                <th>{t("ordersCount")}</th>
                <th>{t("active")}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const label = sourceLabel(s.name);
                const system = isSystemSource(s);
                return (
                  <tr key={s.id} className={s.active ? "" : "opacity-60"}>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn-ghost text-[13px] px-2.5 py-1.5"
                          onClick={() => setEditSource(s)}
                          aria-label={t("editNamed", { name: label })}
                          title={t("editTitle")}
                        >
                          <span className="icon text-base" aria-hidden>edit</span>
                        </button>
                        {!system && (
                          <button
                            className="btn-danger-soft text-[13px]"
                            onClick={() => handleDelete(s)}
                            aria-label={t("deleteNamed", { name: label })}
                            title={tCommon("delete")}
                          >
                            <span className="icon text-base" aria-hidden>delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-ink-900 cursor-pointer align-middle disabled:cursor-not-allowed"
                        checked={!!s.id && selected.has(s.id)}
                        onChange={() => s.id && toggleOne(s.id)}
                        disabled={system}
                        aria-label={label}
                      />
                    </td>
                    <td>
                      <span className={"pill " + sourceClass(s.name)}>{label}</span>
                      {system && (
                        <span className="text-xs text-ink-500 ms-2" title={t("systemHint")}>{t("system")}</span>
                      )}
                    </td>
                    <td>{usage(s)}</td>
                    <td>
                      <Toggle checked={s.active} onChange={() => handleToggle(s)} label={t("activeNamed", { name: label })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editSource) && (
        <OrderSourceModal
          source={editSource}
          takenNames={takenNames}
          nameLock={nameLockOf(editSource)}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditSource(null); }}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <OrderSourcesPage />
    </AppShell>
  );
}
