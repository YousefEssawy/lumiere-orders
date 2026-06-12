"use client";
import { useTranslations } from "next-intl";
import type { Order, OrderSource } from "@/lib/wassalha";

// ألوان البادجات من باستيلات الهوية (v3) — لمسات خفيفة بنص داكن
const SRC_PILL_CLASS: Record<OrderSource, string> = {
  Sllr: "bg-pastel-sky text-ink-700",
  WhatsApp: "bg-pastel-mint text-ink-700",
  Instagram: "bg-pastel-pink text-ink-700",
  Other: "bg-soft text-ink-500",
};

export default function OrdersTable({ orders, onDelete }: { orders: Order[]; onDelete: (o: Order) => void }) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  if (!orders.length) {
    return (
      <div className="table-wrap">
        <div className="text-center py-12 px-5 text-ink-500">
          <span className="icon !text-[40px] text-ink-300" aria-hidden>package_2</span>
          <div className="mt-2 text-sm">{t("table.empty")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table min-w-[840px]">
        <thead>
          <tr>
            <th>{t("table.source")}</th>
            <th>{t("table.name")}</th>
            <th>{t("table.phone")}</th>
            <th>{t("table.address")}</th>
            <th>{t("table.city")}</th>
            <th>{t("table.items")}</th>
            <th>{t("table.cod")}</th>
            <th>{t("table.vol")}</th>
            <th>{t("table.ref")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><span className={"pill " + SRC_PILL_CLASS[o.source]}>{t(`sources.${o.source}`)}</span></td>
              <td>{o.name}</td>
              <td dir="ltr">{o.phone}</td>
              <td className="cell-wrap">{o.address}</td>
              <td>
                {o.city || <span className="text-danger font-bold">{t("table.fixCity")}</span>}
              </td>
              <td className="cell-wrap">
                {String(o.items || "").split("\n").map((line, i) => <div key={i}>{line}</div>)}
              </td>
              <td>{o.cod}</td>
              <td>{o.vol}</td>
              <td>{o.ref || ""}</td>
              <td>
                <button
                  className="btn-danger-soft text-[13px]"
                  onClick={() => onDelete(o)}
                  aria-label={tCommon("delete")}
                  title={tCommon("delete")}
                >
                  <span className="icon text-base" aria-hidden>delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
