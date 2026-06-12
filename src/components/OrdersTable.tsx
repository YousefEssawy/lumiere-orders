"use client";
import type { Order, OrderSource } from "@/lib/wassalha";

const SRC_PILL: Record<OrderSource, string> = { Sllr: "sllr", WhatsApp: "wa", Instagram: "ig", Other: "ig" };
const SRC_LABEL: Record<OrderSource, string> = { Sllr: "سلر", WhatsApp: "واتساب", Instagram: "إنستجرام", Other: "أخرى" };

export default function OrdersTable({ orders, onDelete }: { orders: Order[]; onDelete: (id: string) => void }) {
  if (!orders.length) {
    return (
      <div className="tablewrap">
        <div className="empty"><div className="big">📦</div>لسه مفيش أوردرات — ضيف يدوي أو ارفع ملف سلر</div>
      </div>
    );
  }
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>المصدر</th><th>اسم العميل</th><th>الموبايل</th><th>العنوان</th>
            <th>المحافظة</th><th>المنتجات</th><th>COD</th><th>الحجم</th><th>مرجع</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><span className={"pill " + (SRC_PILL[o.source] || "ig")}>{SRC_LABEL[o.source] || o.source}</span></td>
              <td>{o.name}</td>
              <td>{o.phone}</td>
              <td className="wrap-cell">{o.address}</td>
              <td>{o.city ? o.city : <span style={{ color: "var(--danger)", fontWeight: 700 }}>⚠ ظبّط</span>}</td>
              <td className="wrap-cell">{String(o.items || "").split("\n").map((line, i) => <div key={i}>{line}</div>)}</td>
              <td>{o.cod}</td>
              <td>{o.vol}</td>
              <td>{o.ref || ""}</td>
              <td><button className="btn btn-danger" onClick={() => o.id && onDelete(o.id)}>حذف</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
