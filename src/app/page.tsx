"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import type { Order } from "@/lib/wassalha";
import { logAction } from "@/lib/logger";
import { applyStock, diffConsumption, parseItemsConsumption } from "@/lib/stock";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import PageHero from "@/components/ui/PageHero";
import OrderForm from "@/components/orders/OrderForm";
import SllrImport from "@/components/orders/SllrImport";
import OrdersTable from "@/components/orders/OrdersTable";
import EditOrderModal from "@/components/orders/EditOrderModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import type { OrderFormState } from "@/components/orders/OrderFields";

function OrdersPage() {
  const t = useTranslations("orders");
  const { profile } = useSession();
  const { orders, addOrder, importOrders, updateOrder, deleteOrder, archiveAll } = useOrders(true);
  const { products } = useProducts(true);
  const flash = useToast();
  const confirm = useConfirm();
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const actor = { uid: profile.uid, email: profile.email };

  // حركة الستوك best-effort (مابتوقفش عملية الأوردر)، بس لو فشل تحديث أي منتج
  // بننبّه المستخدم إن الستوك ممكن يكون مش مظبوط بدل ما يتداري في الكونسول.
  function warnIfStockFailed(stockResult: Promise<string[]>) {
    void stockResult.then((failed) => {
      if (failed.length) flash(t("toast.stockWarn", { n: failed.length }));
    });
  }

  async function handleAdd(o: OrderFormState) {
    try {
      await addOrder(o, profile.uid);
      flash(t("toast.added"));
      logAction(actor, "order.add", o.name);
      // خصم الستوك للسطور المطابقة للكتالوج
      warnIfStockFailed(applyStock(parseItemsConsumption(o.items, products), -1, profile.uid));
    } catch {
      flash(t("toast.addErr"));
    }
  }

  async function handleImport(list: OrderFormState[]) {
    if (!list.length) { flash(t("toast.fileEmpty")); return; }
    try {
      await importOrders(list, profile.uid);
      logAction(actor, "orders.import", "", list.length);
      // خصم الستوك لكل سطور الأوردرات المستوردة المطابقة للكتالوج
      const all = list.map((o) => o.items).join("\n");
      const consumption = parseItemsConsumption(all, products);
      const totalQty = consumption.reduce((s, l) => s + l.qty, 0);
      warnIfStockFailed(applyStock(consumption, -1, profile.uid));
      // رسالة واحدة بتوضح الاستيراد + حركة الستوك
      flash(
        t("toast.imported", { n: list.length }) +
        (totalQty ? " · " + t("toast.stockTaken", { q: totalQty }) : "")
      );
    } catch {
      flash(t("toast.importErr"));
    }
  }

  async function handleEditSave(changes: OrderFormState) {
    if (!editOrder?.id) return;
    try {
      await updateOrder(editOrder.id, changes, profile.uid);
      flash(t("toast.updated"));
      logAction(actor, "order.update", changes.name);
      // فرق الاستهلاك بين القديم والجديد بس هو اللي بيتطبق
      const delta = diffConsumption(
        parseItemsConsumption(editOrder.items, products),
        parseItemsConsumption(changes.items, products)
      );
      warnIfStockFailed(applyStock(delta, -1, profile.uid));
    } catch {
      flash(t("toast.updateErr"));
    }
    setEditOrder(null);
  }

  async function handleDelete(o: Order) {
    if (!o.id) return;
    try {
      await deleteOrder(o.id);
      flash(t("toast.deleted"));
      logAction(actor, "order.delete", o.name);
      // إرجاع الستوك — الأوردر اتلغى قبل الشحن
      warnIfStockFailed(applyStock(parseItemsConsumption(o.items, products), 1, profile.uid));
    } catch {
      flash(t("toast.deleteErr"));
    }
  }

  async function handleArchiveAll() {
    if (!orders.length) return;
    if (!(await confirm({ title: t("moveBtn"), message: t("confirmClear"), danger: false }))) return;
    try {
      await archiveAll(orders, profile.uid);
      flash(t("toast.cleared"));
      logAction(actor, "orders.clear", "", orders.length);
    } catch {
      flash(t("toast.clearErr"));
    }
  }

  const countBySource = { Sllr: 0, WhatsApp: 0, Instagram: 0, Other: 0 } as Record<string, number>;
  orders.forEach((o) => { countBySource[o.source] = (countBySource[o.source] || 0) + 1; });

  return (
    <>
      <PageHero icon="package_2" title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-5 lg:grid-cols-2 fade-up fade-up-delay-1">
        <OrderForm onAdd={handleAdd} />
        <SllrImport onImport={handleImport} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-3.5">
        <div className="text-sm text-ink-500">
          {t("total")} <b className="text-ink-900 text-lg">{orders.length}</b>{" "}
          {orders.length ? (
            <span>{t("bySource", { sllr: countBySource.Sllr, wa: countBySource.WhatsApp, ig: countBySource.Instagram })}</span>
          ) : null}
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={handleArchiveAll} disabled={!orders.length}>
          <span className="icon text-base" aria-hidden>local_shipping</span>
          {t("moveBtn")}
        </button>
      </div>
      <OrdersTable orders={orders} onView={setViewOrder} onEdit={setEditOrder} onDelete={handleDelete} />

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
      <OrdersPage />
    </AppShell>
  );
}
