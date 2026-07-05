"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useArchive, type ArchivedOrder } from "@/hooks/useArchive";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useWhatsappSettings } from "@/hooks/useWhatsappSettings";
import { useCrudActions } from "@/hooks/useCrudActions";
import { fillTemplate, templateFor, waLink } from "@/lib/whatsapp";
import { logAction } from "@/lib/logger";
import {
  DEFAULT_ORDER_STATUS, ORDER_STATUSES, type OrderStatus,
} from "@/lib/types";
import { exportWassalha } from "@/lib/wassalha";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import EditOrderModal from "@/components/orders/EditOrderModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import HistoryRow from "@/components/orders/HistoryRow";
import type { OrderFormState } from "@/components/orders/OrderFields";

const ALL = "all";

function statusOf(o: ArchivedOrder): OrderStatus {
  return o.status ?? DEFAULT_ORDER_STATUS;
}

function ShipmentsPage() {
  const t = useTranslations("history");
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const { profile } = useSession();
  const { archived, error, loading, deleteArchived, clearArchive, setStatus, updateArchived } = useArchive(true);
  const resolveUser = useUserDirectory();
  const { templates } = useWhatsappSettings(true);
  const flash = useToast();
  const confirm = useConfirm();
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [editOrder, setEditOrder] = useState<ArchivedOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<ArchivedOrder | null>(null);
  const actor = { uid: profile.uid, email: profile.email };

  const filtered = statusFilter === ALL
    ? archived
    : archived.filter((o) => statusOf(o) === statusFilter);

  const {
    selected,
    selectedItems: selectedInView,
    allSelected: allInViewSelected,
    toggleOne,
    toggleAll: toggleAllInView,
    clear: clearSelection,
  } = useRowSelection(filtered, (o) => o.id);

  /** ذكي: المحدد لو فيه تحديد، وإلا كل المعروض حسب الفلتر */
  async function handleExport() {
    const targets = selectedInView.length ? selectedInView : filtered;
    if (!targets.length) { flash(t("exportEmpty")); return; }
    const bad = targets.filter((o) => !o.city);
    if (bad.length && !(await confirm({ title: t("export"), message: t("confirmExportBadCity", { n: bad.length }) }))) return;
    exportWassalha(targets);
    flash(t("toast.exported", { n: targets.length }));
    logAction(actor, "orders.export", "", targets.length);
    clearSelection();
  }

  async function handleEditSave(changes: OrderFormState) {
    if (!editOrder?.id) return;
    try {
      await updateArchived(editOrder.id, changes, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "history.update", changes.name);
    } catch {
      flash(t("toast.updateErr"));
    }
    setEditOrder(null);
  }

  async function handleStatus(o: ArchivedOrder, status: OrderStatus) {
    if (!o.id || statusOf(o) === status) return;
    try {
      await setStatus(o.id, status, profile.uid);
      flash(t("toast.statusChanged", { status: t(`statuses.${status}`) }));
      logAction(actor, "history.status", `${o.name}: ${status}`);
    } catch {
      flash(t("toast.statusErr"));
    }
  }

  const { runDelete, runBulkDelete } = useCrudActions({ confirm, flash, actor, clearSelection });

  async function handleDelete(o: ArchivedOrder) {
    if (!o.id) return;
    await runDelete({
      confirmTitle: tCommon("delete"),
      confirmMessage: t("confirmDelete", { name: o.name }),
      successToast: t("toast.deleted"),
      errorToast: t("toast.deleteErr"),
      logActionName: "history.delete",
      logDetail: o.name,
      onDelete: () => deleteArchived(o.id!),
    });
  }

  async function handleClear() {
    if (!archived.length) return;
    await runBulkDelete({
      count: archived.length,
      confirmTitle: t("clearAll"),
      confirmMessage: t("confirmClear", { n: archived.length }),
      successToast: t("toast.cleared"),
      errorToast: t("toast.clearErr"),
      logActionName: "history.clear",
      onDeleteMany: () => clearArchive(archived),
    });
  }

  /** يفتح واتساب برقم العميل ورسالة جاهزة حسب حالة الأوردر */
  function handleWhatsapp(o: ArchivedOrder) {
    const msg = fillTemplate(templateFor(statusOf(o), templates), o);
    const link = waLink(o, msg);
    if (!link) { flash(t("toast.waUnavailable")); return; }
    window.open(link, "_blank", "noopener,noreferrer");
    logAction(actor, "whatsapp.send", `${o.name}: ${t(`statuses.${statusOf(o)}`)}`);
  }

  /** فيه قالب رسالة لحالة الأوردر دي؟ */
  function hasWhatsapp(o: ArchivedOrder): boolean {
    return !!waLink(o, fillTemplate(templateFor(statusOf(o), templates), o));
  }

  /** حذف نهائي للمحدد بس */
  async function handleDeleteSelected() {
    if (!selectedInView.length) return;
    await runBulkDelete({
      count: selectedInView.length,
      confirmTitle: t("deleteSelected", { n: selectedInView.length }),
      confirmMessage: t("confirmDeleteSelected", { n: selectedInView.length }),
      successToast: t("toast.bulkDeleted", { n: selectedInView.length }),
      errorToast: t("toast.deleteErr"),
      logActionName: "history.delete",
      onDeleteMany: () => clearArchive(selectedInView),
    });
  }

  const exportCount = selectedInView.length || filtered.length;

  return (
    <>
      <PageHero
        icon="local_shipping"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          archived.length ? (
            <>
              <button className="btn-ghost !text-danger" onClick={handleClear}>
                <span className="icon text-base" aria-hidden>delete_forever</span>
                {t("clearAll")}
              </button>
              {selectedInView.length > 0 && (
                <button className="btn-danger" onClick={handleDeleteSelected}>
                  <span className="icon text-base" aria-hidden>delete</span>
                  {t("deleteSelected", { n: selectedInView.length })}
                </button>
              )}
              <button className="btn-primary" onClick={handleExport} disabled={!exportCount}>
                <span className="icon text-base" aria-hidden>download</span>
                {t("export")}{exportCount ? ` (${exportCount})` : ""}
              </button>
            </>
          ) : undefined
        }
      />

      {error && (
        <div className="card !border-danger/40 text-danger text-sm mb-4">
          {t("loadError")}
          <div className="text-xs text-ink-500 mt-1 break-all" dir="ltr">{error}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 mb-3.5">
        <div className="text-sm text-ink-500">
          {t("total")} <b className="text-ink-900 text-lg">{filtered.length}</b>
          {selectedInView.length ? (
            <span className="ms-2 text-ink-900 font-semibold">· {t("selected", { n: selectedInView.length })}</span>
          ) : null}
        </div>
        <div className="flex-1" />
        <select
          className="form-input sm:!w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value={ALL}>{t("filterStatus")}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`statuses.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap fade-up fade-up-delay-2">
        {loading ? (
          <div className="text-center py-14 text-sm text-ink-500">{tCommon("loading")}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="local_shipping" text={t("empty")} />
        ) : (
          <table className="data-table min-w-[1080px]">
            <thead>
              <tr>
                <th></th>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
                    checked={allInViewSelected}
                    onChange={toggleAllInView}
                    aria-label={t("selected", { n: filtered.length })}
                  />
                </th>
                <th>{t("status")}</th>
                <th>{t("archivedAt")}</th>
                <th>{tOrders("table.source")}</th>
                <th>{tOrders("table.name")}</th>
                <th>{tOrders("table.phone")}</th>
                <th>{tOrders("table.address")}</th>
                <th>{tOrders("table.city")}</th>
                <th>{tOrders("table.items")}</th>
                <th>{tOrders("table.cod")}</th>
                <th>{t("archivedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <HistoryRow
                  key={o.id}
                  order={o}
                  status={statusOf(o)}
                  selected={!!o.id && selected.has(o.id)}
                  resolvedUser={resolveUser(o.archivedBy)}
                  hasWhatsapp={hasWhatsapp(o)}
                  onView={setViewOrder}
                  onWhatsapp={handleWhatsapp}
                  onEdit={setEditOrder}
                  onDelete={handleDelete}
                  onToggleSelect={toggleOne}
                  onStatusChange={handleStatus}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewOrder && (
        <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onSave={handleEditSave}
          onClose={() => setEditOrder(null)}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <ShipmentsPage />
    </AppShell>
  );
}
