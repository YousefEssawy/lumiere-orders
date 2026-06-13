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

export function exportExpensesSheet(expenses: Expense[], L: Labels): void {
  const data = expenses.map((e) => ({
    [L.date]: e.date || "",
    [L.description]: e.description || "",
    [L.category]: e.category || "",
    [L.amount]: e.amount ?? 0,
    [L.vendor]: e.vendor || "",
    [L.paymentMethod]: L.paymentLabel(e.paymentMethod),
    [L.notes]: e.notes || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data, {
    header: [L.date, L.description, L.category, L.amount, L.vendor, L.paymentMethod, L.notes],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  XLSX.writeFile(wb, `Lumiere-Expenses-${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}.xlsx`);
}
