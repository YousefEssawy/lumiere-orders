"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { EMPTY_DISPLAY, formatDate, formatMoney } from "@/lib/appGlobals";
import type { Expense } from "@/lib/types";

interface ExpenseRowProps {
  expense: Expense;
  selected: boolean;
  resolvedUser: string;
  onMarkPaid: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  onToggleSelect: (id: string) => void;
}

function ExpenseRow({ expense: e, selected, resolvedUser, onMarkPaid, onEdit, onDelete, onToggleSelect }: ExpenseRowProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  return (
    <tr>
      <td>
        <div className="flex items-center gap-1">
          {!e.paid && (
            <button
              className="btn-ghost text-[13px] px-2.5 py-1.5 !text-success"
              onClick={() => onMarkPaid(e)}
              aria-label={t("markPaid")}
              title={t("markPaid")}
            >
              <span className="icon text-base" aria-hidden>paid</span>
            </button>
          )}
          <button
            className="btn-ghost text-[13px] px-2.5 py-1.5"
            onClick={() => onEdit(e)}
            aria-label={t("editTitle")}
            title={t("editTitle")}
          >
            <span className="icon text-base" aria-hidden>edit</span>
          </button>
          <button
            className="btn-danger-soft text-[13px]"
            onClick={() => onDelete(e)}
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
          onChange={() => e.id && onToggleSelect(e.id)}
          aria-label={e.description}
        />
      </td>
      <td className="text-ink-500" dir="ltr">{formatDate(e.date)}</td>
      <td className="font-semibold">
        <span className="block max-w-[260px] truncate" title={e.description}>{e.description}</span>
        {e.notes && <span className="block max-w-[260px] truncate text-xs font-normal text-ink-400" title={e.notes}>{e.notes}</span>}
      </td>
      <td><span className="pill bg-pastel-lavender text-ink-700">{e.category || EMPTY_DISPLAY}</span></td>
      <td className="font-bold" dir="ltr">{formatMoney(Number(e.amount) || 0)}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <span className={"pill " + (e.paid ? "bg-pastel-mint text-ink-700" : "bg-pastel-butter text-ink-700")}>
            {e.paid ? t("statusPaid") : t("statusDebt")}
          </span>
          {e.deductFromBalance && (
            <span className="icon !text-[16px] text-ink-400" aria-hidden title={t("deductFromBalance")}>account_balance_wallet</span>
          )}
        </div>
      </td>
      <td>{e.vendor || EMPTY_DISPLAY}</td>
      <td>{e.paymentMethod ? <span className="pill bg-soft text-ink-500">{t(`payment.${e.paymentMethod}`)}</span> : EMPTY_DISPLAY}</td>
      <td className="text-ink-500 text-xs">
        <span className="block max-w-[140px] truncate" title={resolvedUser}>
          {resolvedUser || EMPTY_DISPLAY}
        </span>
      </td>
    </tr>
  );
}

export default memo(ExpenseRow);
