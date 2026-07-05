// تصدير المصروفات لملف إكسل بسيط (للأرشفة/المحاسبة).
import * as XLSX from "xlsx";
import type { Expense } from "@/lib/types";
import { fileDateStamp } from "@/lib/appGlobals";

type Labels = {
  date: string;
  description: string;
  category: string;
  amount: string;
  status: string;
  statusPaid: string;
  statusDebt: string;
  vendor: string;
  paymentMethod: string;
  notes: string;
  paymentLabel: (m: string | undefined) => string;
};

export function exportExpensesSheet(expenses: Expense[], labels: Labels): void {
  const data = expenses.map((e) => ({
    [labels.date]: e.date || "",
    [labels.description]: e.description || "",
    [labels.category]: e.category || "",
    [labels.amount]: e.amount ?? 0,
    [labels.status]: e.paid ? labels.statusPaid : labels.statusDebt,
    [labels.vendor]: e.vendor || "",
    [labels.paymentMethod]: labels.paymentLabel(e.paymentMethod),
    [labels.notes]: e.notes || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data, {
    header: [labels.date, labels.description, labels.category, labels.amount, labels.status, labels.vendor, labels.paymentMethod, labels.notes],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, `Lumiere-Expenses-${fileDateStamp()}.xlsx`);
}
