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
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const actor = { uid: profile.uid, email: profile.email };

  async function handleAdd(o: OrderFormState) {
    try {
      await addOrder(o, profile.uid);
      flash(t("toast.added"));
      logAction(actor, "order.add", o.name);
      // خصم الستوك للسطور المطابقة للكتالوج
      applyStock(parseItemsConsumption(o.items, products), -1, profile.uid);
    } catch {
      flash(t("toast.addErr"));
    }
  }

  async function handleImport(list: OrderFormState[]) {
    if (!list.length) { flash(t("toast.fileEmpty")); return; }
    try {
      await importOrders(list, profile.uid);
      flash(t("toast.imported", { n: list.length }));
      logAction(actor, "orders.import", "", list.length);
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
      applyStock(delta, -1, profile.uid);
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
      applyStock(parseItemsConsumption(o.items, products), 1, profile.uid);
    } catch {
      flash(t("toast.deleteErr"));
    }
  }

  async function handleMove() {
    if (!orders.length) return;
    if (!window.confirm(t("confirmClear"))) return;
    try {
      await archiveAll(orders, profile.uid);
      flash(t("toast.cleared"));
      logAction(actor, "orders.clear", "", orders.length);
    } catch {
      flash(t("toast.clearErr"));
    }
  }

  const c = { Sllr: 0, WhatsApp: 0, Instagram: 0, Other: 0 } as Record<string, number>;
  orders.forEach((o) => { c[o.source] = (c[o.source] || 0) + 1; });

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
            <span>{t("bySource", { sllr: c.Sllr, wa: c.WhatsApp, ig: c.Instagram })}</span>
          ) : null}
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={handleMove} disabled={!orders.length}>
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
