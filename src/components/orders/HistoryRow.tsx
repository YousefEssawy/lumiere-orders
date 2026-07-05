"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import type { ArchivedOrder } from "@/hooks/useArchive";
import { EMPTY_DISPLAY, formatDateTime } from "@/lib/appGlobals";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { SOURCE_CLASS, STATUS_CLASS } from "@/lib/statusStyles";
import { truncatedCell } from "@/components/orders/OrdersTable";

interface HistoryRowProps {
  order: ArchivedOrder;
  status: OrderStatus;
  selected: boolean;
  resolvedUser: string;
  hasWhatsapp: boolean;
  onView: (o: ArchivedOrder) => void;
  onWhatsapp: (o: ArchivedOrder) => void;
  onEdit: (o: ArchivedOrder) => void;
  onDelete: (o: ArchivedOrder) => void;
  onToggleSelect: (id: string) => void;
  onStatusChange: (o: ArchivedOrder, status: OrderStatus) => void;
}

function HistoryRow({
  order: o, status, selected, resolvedUser, hasWhatsapp,
  onView, onWhatsapp, onEdit, onDelete, onToggleSelect, onStatusChange,
}: HistoryRowProps) {
  const t = useTranslations("history");
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");

  return (
    <tr>
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
          {hasWhatsapp && (
            <button
              className="btn-ghost text-[13px] px-2.5 py-1.5 !text-success"
              onClick={() => onWhatsapp(o)}
              aria-label={t("whatsapp")}
              title={t("whatsapp")}
            >
              <span className="icon text-base" aria-hidden>chat</span>
            </button>
          )}
          <button
            className="btn-ghost text-[13px] px-2.5 py-1.5"
            onClick={() => onEdit(o)}
            aria-label={tOrders("editTitle")}
            title={tOrders("editTitle")}
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
      <td>
        <input
          type="checkbox"
          className="w-4 h-4 accent-ink-900 cursor-pointer align-middle"
          checked={selected}
          onChange={() => o.id && onToggleSelect(o.id)}
          aria-label={o.name}
        />
      </td>
      <td>
        <select
          className={"pill border-0 cursor-pointer appearance-none pe-2 " + STATUS_CLASS[status]}
          value={status}
          onChange={(e) => onStatusChange(o, e.target.value as OrderStatus)}
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
        <span className="block max-w-[140px] truncate" title={resolvedUser}>
          {resolvedUser || EMPTY_DISPLAY}
        </span>
      </td>
    </tr>
  );
}

export default memo(HistoryRow);
