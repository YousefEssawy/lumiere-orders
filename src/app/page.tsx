"use client";
import { useTranslations } from "next-intl";
import { useOrders } from "@/hooks/useOrders";
import { exportWassalha, type Order } from "@/lib/wassalha";
import { logAction } from "@/lib/logger";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";
import OrderForm from "@/components/orders/OrderForm";
import SllrImport from "@/components/orders/SllrImport";
import OrdersTable from "@/components/orders/OrdersTable";

function OrdersPage() {
  const t = useTranslations("orders");
  const { profile } = useSession();
  const { orders, addOrder, importOrders, deleteOrder, archiveAll } = useOrders(true);
  const flash = useToast();
  const actor = { uid: profile.uid, email: profile.email };

  async function handleAdd(o: Omit<Order, "id" | "createdAt">) {
    try {
      await addOrder(o);
      flash(t("toast.added"));
      logAction(actor, "order.add", o.name);
    } catch {
      flash(t("toast.addErr"));
    }
  }

  async function handleImport(list: Omit<Order, "id" | "createdAt">[]) {
    if (!list.length) { flash(t("toast.fileEmpty")); return; }
    try {
      await importOrders(list);
      flash(t("toast.imported", { n: list.length }));
      logAction(actor, "orders.import", "", list.length);
    } catch {
      flash(t("toast.importErr"));
    }
  }

  async function handleDelete(o: Order) {
    if (!o.id) return;
    try {
      await deleteOrder(o.id);
      flash(t("toast.deleted"));
      logAction(actor, "order.delete", o.name);
    } catch {
      flash(t("toast.deleteErr"));
    }
  }

  async function handleClear() {
    if (!orders.length) return;
    if (!window.confirm(t("confirmClear"))) return;
    try {
      await archiveAll(orders, profile.email);
      flash(t("toast.cleared"));
      logAction(actor, "orders.clear", "", orders.length);
    } catch {
      flash(t("toast.clearErr"));
    }
  }

  function handleExport() {
    if (!orders.length) { flash(t("toast.exportEmpty")); return; }
    const bad = orders.filter((o) => !o.city);
    if (bad.length && !window.confirm(t("confirmExportBadCity", { n: bad.length }))) return;
    exportWassalha(orders);
    flash(t("toast.exported", { n: orders.length }));
    logAction(actor, "orders.export", "", orders.length);
  }

  const c = { Sllr: 0, WhatsApp: 0, Instagram: 0, Other: 0 } as Record<string, number>;
  orders.forEach((o) => { c[o.source] = (c[o.source] || 0) + 1; });

  return (
    <>
      <PageHero icon="package_2" title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-5 lg:grid-cols-2">
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
        <div className="flex gap-2.5">
          <button className="btn-ghost" onClick={handleClear}>
            <span className="icon text-base" aria-hidden>delete_sweep</span>
            {t("clearAll")}
          </button>
          <button className="btn-primary" onClick={handleExport}>
            <span className="icon text-base" aria-hidden>download</span>
            {t("export")}
          </button>
        </div>
      </div>
      <OrdersTable orders={orders} onDelete={handleDelete} />
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
