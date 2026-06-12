"use client";
import { useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { exportWassalha, type Order } from "@/lib/wassalha";
import Login from "@/components/Login";
import OrderForm from "@/components/OrderForm";
import SllrImport from "@/components/SllrImport";
import OrdersTable from "@/components/OrdersTable";
import Toast from "@/components/Toast";

export default function Page() {
  const user = useAuth();
  const enabled = !!user;
  const { orders, addOrder, importOrders, deleteOrder, clearAll } = useOrders(enabled);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(m: string) {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  // إعدادات Firebase مش متظبطة
  if (!isFirebaseConfigured) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <div className="logo">LUMI<span>È</span>RE</div>
          <div className="lsub">مركز الأوردرات والشحن</div>
          <div className="setup-warn">
            ⚠ لسه ماظبطتش إعدادات Firebase.<br />
            انسخ <b>.env.example</b> لـ <b>.env.local</b> وحط بيانات مشروعك، وراجع <b>README.md</b>.
          </div>
        </div>
      </div>
    );
  }
  if (user === undefined) return <div className="center-msg">جاري التحميل…</div>;
  if (user === null) return <Login />;

  async function handleAdd(o: Omit<Order, "id" | "createdAt">) {
    try { await addOrder(o); flash("تمت إضافة الأوردر ✓"); } catch { flash("حصل خطأ في الحفظ"); }
  }
  async function handleImport(list: Omit<Order, "id" | "createdAt">[]) {
    if (!list.length) { flash("الملف فاضي"); return; }
    try { await importOrders(list); flash(`تم استيراد ${list.length} أوردر من سلر`); } catch { flash("حصل خطأ في الاستيراد"); }
  }
  async function handleDelete(id: string) {
    try { await deleteOrder(id); flash("تم حذف الأوردر"); } catch { flash("حصل خطأ في الحذف"); }
  }
  async function handleClear() {
    if (!orders.length) return;
    if (!window.confirm("متأكد إنك عايز تمسح كل الأوردرات؟ مش هينفع ترجعها.")) return;
    try { await clearAll(orders); flash("تم مسح الكل"); } catch { flash("حصل خطأ في المسح"); }
  }
  function handleExport() {
    if (!orders.length) { flash("مفيش أوردرات تصدّرها"); return; }
    const bad = orders.filter((o) => !o.city);
    if (bad.length && !window.confirm(`فيه ${bad.length} أوردر محافظتهم مش مظبوطة (هيتصدّروا فاضيين). تكمّل؟`)) return;
    exportWassalha(orders);
    flash(`تم تصدير ${orders.length} أوردر لملف وصلها ✓`);
  }

  const c = { Sllr: 0, WhatsApp: 0, Instagram: 0, Other: 0 } as Record<string, number>;
  orders.forEach((o) => { c[o.source] = (c[o.source] || 0) + 1; });

  return (
    <>
      <header>
        <div className="logo">LUMI<span>È</span>RE</div>
        <div className="tag">مركز الأوردرات والشحن</div>
        <div className="spacer" />
        <div className="who">{user.email}</div>
        <button className="logout" onClick={() => auth && signOut(auth)}>خروج</button>
      </header>
      <div className="wrap">
        <div className="grid">
          <OrderForm onAdd={handleAdd} />
          <SllrImport onImport={handleImport} />
        </div>
        <div className="bar">
          <div className="stats">
            إجمالي الأوردرات: <b>{orders.length}</b>{" "}
            {orders.length ? <span>(سلر {c.Sllr} · واتساب {c.WhatsApp} · إنستجرام {c.Instagram})</span> : null}
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={handleClear}>🗑️ مسح الكل</button>
            <button className="btn btn-green" onClick={handleExport}>⬇️ صدّر ملف وصلها</button>
          </div>
        </div>
        <OrdersTable orders={orders} onDelete={handleDelete} />
        <div className="foot">Lumière Orders · بياناتك متزامنة وآمنة على Firebase · مطلوب تسجيل دخول</div>
      </div>
      <Toast msg={toast} />
    </>
  );
}
