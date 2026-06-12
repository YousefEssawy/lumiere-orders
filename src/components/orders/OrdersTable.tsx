"use client";
import { useTranslations } from "next-intl";
import type { Order, OrderSource } from "@/lib/wassalha";
import EmptyState from "@/components/ui/EmptyState";

// ألوان البادجات من باستيلات الهوية (v3) — لمسات خفيفة بنص داكن
const SRC_PILL_CLASS: Record<OrderSource, string> = {
  Sllr: "bg-pastel-sky text-ink-700",
  WhatsApp: "bg-pastel-mint text-ink-700",
  Instagram: "bg-pastel-pink text-ink-700",
  Other: "bg-soft text-ink-500",
};

interface OrdersTableProps {
  orders: Order[];
  onView: (o: Order) => void;
  onEdit: (o: Order) => void;
  onDelete: (o: Order) => void;
}

/** عنوان/منتجات في سطر واحد مقصوص — التفاصيل الكاملة في مودال العرض */
export function truncatedCell(value: string, width = "max-w-[260px]") {
  return (
    <span className={`block ${width} truncate`} title={value}>
      {value}
    </span>
  );
}

export default function OrdersTable({ orders, onView, onEdit, onDelete }: OrdersTableProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  if (!orders.length) {
    return (
      <div className="table-wrap fade-up fade-up-delay-2">
        <EmptyState icon="package_2" text={t("table.empty")} />
      </div>
    );
  }

  return (
    <div className="table-wrap fade-up fade-up-delay-2">
      <table className="data-table min-w-[840px]">
        <thead>
          <tr>
            <th></th>
            <th>{t("table.source")}</th>
            <th>{t("table.name")}</th>
            <th>{t("table.phone")}</th>
            <th>{t("table.address")}</th>
            <th>{t("table.city")}</th>
            <th>{t("table.items")}</th>
            <th>{t("table.cod")}</th>
            <th>{t("table.vol")}</th>
            <th>{t("table.ref")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-ghost text-[13px] px-2.5 py-1.5"
                    onClick={() => onView(o)}
                    aria-label={tCommon("view")}
                    title={tCommon("view")}
                  >
                    <span className="icon text-base" aria-hidden>visibility</span>
                  </button>
                  <button
                    className="btn-ghost text-[13px] px-2.5 py-1.5"
                    onClick={() => onEdit(o)}
                    aria-label={t("editTitle")}
                    title={t("editTitle")}
                  >
                    <span className="icon text-base" aria-hidden>edit</span>
                  </button>
                  <button
                    className="btn-danger-soft text-[13px]"
                    onClick={() => onDelete(o)}
                    aria-label={tCommon("delete")}
                    title={tCommon("delete")}
                  >
                    <span className="icon text-base" aria-hidden>delete</span>
                  </button>
                </div>
              </td>
              <td><span className={"pill " + SRC_PILL_CLASS[o.source]}>{t(`sources.${o.source}`)}</span></td>
              <td>{o.name}</td>
              <td dir="ltr">{o.phone}</td>
              <td>{truncatedCell(o.address)}</td>
              <td>
                {o.city || <span className="text-danger font-bold">{t("table.fixCity")}</span>}
              </td>
              <td>{truncatedCell(String(o.items || "").split("\n").filter(Boolean).join(" · "))}</td>
              <td>{o.cod}</td>
              <td>{o.vol}</td>
              <td>{o.ref || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
