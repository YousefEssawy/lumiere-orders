// تصدير المصروفات لملف إكسل بسيط (للأرشفة/المحاسبة).
import * as XLSX from "xlsx";
import type { Expense } from "@/lib/types";

type Labels = {
  date: string;
  description: string;
  category: string;
  amount: string;
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
    [labels.vendor]: e.vendor || "",
    [labels.paymentMethod]: labels.paymentLabel(e.paymentMethod),
    [labels.notes]: e.notes || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data, {
    header: [labels.date, labels.description, labels.category, labels.amount, labels.vendor, labels.paymentMethod, labels.notes],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  XLSX.writeFile(wb, `Lumiere-Expenses-${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}.xlsx`);
}
