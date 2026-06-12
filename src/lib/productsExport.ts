// تصدير المنتجات بنفس صيغة شيت Lumiere_Products v22 بالظبط —
// الملف بيتسخدم لتحديث الكوليكشن على موقع سلر، فالهيدرز حرفية
// (بما فيها النصوص الإرشادية) وبنية الصفوف مطابقة:
// صف المنتج وتحته صف لكل حجم.
import * as XLSX from "xlsx";
import type { Product } from "@/lib/types";

// الهيدرز الحرفية من الشيت الأصلي — متتغيرش
const HEADERS = [
  "Name en",
  "اسم المنتج بالعربي",
  "Description",
  "وصف المنتج بالعربي",
  "ID",
  "Category\nWrite the same category names as in the dashboard or add new custom category name.",
  "Price\nIf you leave it empty, default value will be 0",
  "Original price\nAdd it in case you want to show a bigger price that got reduced",
  "Quantity\nIf you leave it empty, default value will be 1",
  "Active\nIf you leave it empty, default value will be True",
  "Option 1",
  "Option 1 value",
  "Option 2",
  "Option 2 value",
  "Option 3",
  "Option 3 value",
  "Image URL",
] as const;

type SheetRow = (string | number)[];

export function exportProductsSheet(products: Product[]): void {
  const rows: SheetRow[] = [];

  for (const p of products) {
    // صف المنتج
    rows.push([
      p.name,
      p.nameAr ?? "",
      p.description ?? "",
      p.descriptionAr ?? "",
      p.code,
      p.category,
      "", // Price — على صفوف الأحجام
      "", // Original price
      "", // Quantity
      p.active ? 1 : 0,
      p.optionName ?? "Size",
      "", // Option 1 value — على صفوف الأحجام
      "",
      "",
      "",
      "",
      p.imageUrl ?? "",
    ]);
    // صف لكل حجم
    for (const v of p.variants) {
      rows.push([
        "", "", "", "", "", "",
        v.price,
        v.originalPrice ?? "",
        v.quantity,
        "",
        "",
        v.size,
        "", "", "", "",
        "",
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([[...HEADERS], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  XLSX.writeFile(
    wb,
    `Lumiere-Products-${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}.xlsx`
  );
}
