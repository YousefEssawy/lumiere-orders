"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useArchive, type ArchivedOrder } from "@/hooks/useArchive";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useWhatsappSettings } from "@/hooks/useWhatsappSettings";
import { fillTemplate, templateFor, waLink } from "@/lib/whatsapp";
import { logAction } from "@/lib/logger";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import {
  DEFAULT_ORDER_STATUS, ORDER_STATUSES, type OrderStatus,
} from "@/lib/types";
import { exportWassalha } from "@/lib/wassalha";
import { SOURCE_CLASS, STATUS_CLASS } from "@/lib/statusStyles";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import EmptyState from "@/components/ui/EmptyState";
import EditOrderModal from "@/components/orders/EditOrderModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import { truncatedCell } from "@/components/orders/OrdersTable";
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
  const { archived, error, deleteArchived, clearArchive, setStatus, updateArchived } = useArchive(true);
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

  async function handleDelete(o: ArchivedOrder) {
    if (!o.id) return;
    if (!(await confirm({ title: tCommon("delete"), message: t("confirmDelete", { name: o.name }) }))) return;
    try {
      await deleteArchived(o.id);
      flash(t("toast.deleted"));
      logAction(actor, "history.delete", o.name);
    } catch {
      flash(t("toast.deleteErr"));
    }
  }

  async function handleClear() {
    if (!archived.length) return;
    if (!(await confirm({ title: t("clearAll"), message: t("confirmClear", { n: archived.length }) }))) return;
    try {
      await clearArchive(archived);
      flash(t("toast.cleared"));
      logAction(actor, "history.clear", "", archived.length);
    } catch {
      flash(t("toast.clearErr"));
    }
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
    if (!(await confirm({ title: t("deleteSelected", { n: selectedInView.length }), message: t("confirmDeleteSelected", { n: selectedInView.length }) }))) return;
    try {
      await clearArchive(selectedInView);
      flash(t("toast.bulkDeleted", { n: selectedInView.length }));
      logAction(actor, "history.delete", "", selectedInView.length);
      clearSelection();
    } catch {
      flash(t("toast.deleteErr"));
    }
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
        {filtered.length === 0 ? (
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
              {filtered.map((o) => {
                const status = statusOf(o);
                return (
                  <tr key={o.id}>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn-ghost text-[13px] px-2.5 py-1.5"
                          onClick={() => setViewOrder(o)}
                          aria-label={tCommon("view")}
                          title={tCommon("view")}
                        >
                          <span className="icon text-base" aria-hidden>visibility</span>
                        </button>
                        {hasWhatsapp(o) && (
                          <button
                            className="btn-ghost text-[13px] px-2.5 py-1.5 !text-success"
                            onClick={() => handleWhatsapp(o)}
                            aria-label={t("whatsapp")}
                            title={t("whatsapp")}
                          >
                            <span className="icon text-base" aria-hidden>chat</span>
                          </button>
                        )}
                        <button
                          className="btn-ghost text-[13px] px-2.5 py-1.5"
                          onClick={() => setEditOrder(o)}
                          aria-label={tOrders("editTitle")}
                          title={tOrders("editTitle")}
                        >
                          <span className="icon text-base" aria-hidden>edit</span>
                        </button>
                        <button
                          className="btn-danger-soft text-[13px]"
                          onClick={() => handleDelete(o)}
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
                        checked={!!o.id && selected.has(o.id)}
                        onChange={() => o.id && toggleOne(o.id)}
                        aria-label={o.name}
                      />
                    </td>
                    <td>
                      <select
                        className={"pill border-0 cursor-pointer appearance-none pe-2 " + STATUS_CLASS[status]}
                        value={status}
                        onChange={(e) => handleStatus(o, e.target.value as OrderStatus)}
                        aria-label={t("status")}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-ink-500" dir="ltr">{formatDateTime(o.archivedAt)}</td>
                    <td><span className={"pill " + SOURCE_CLASS[o.source]}>{tOrders(`sources.${o.source}`)}</span></td>
                    <td>{o.name}</td>
                    <td dir="ltr">{o.phone}</td>
                    <td>{truncatedCell(o.address)}</td>
                    <td>{o.city || EMPTY_DISPLAY}</td>
                    <td>{truncatedCell(String(o.items || "").split("\n").filter(Boolean).join(" · "))}</td>
                    <td>{o.cod}</td>
                    <td className="text-ink-500 text-xs">
                      <span className="block max-w-[140px] truncate" title={resolveUser(o.archivedBy)}>
                        {resolveUser(o.archivedBy) || EMPTY_DISPLAY}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
