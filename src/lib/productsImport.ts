// استيراد شيت المنتجات (صيغة Lumiere_Products v22 / تصدير سلر):
// صف المنتج (Name en, ID, Category, Image URL, Option 1 = Size)
// وتحته صفوف الأحجام (Option 1 value, Price, Quantity) بأسماء فاضية.
import * as XLSX from "xlsx";
import type { ProductVariant } from "@/lib/types";
import type { ProductInput } from "@/hooks/useProducts";

// الهيدرز في الشيت فيها أسطر إرشادية — بنطابق بالبادئة
function findKey(row: Record<string, unknown>, prefix: string): string | undefined {
  return Object.keys(row).find((k) => k.trim().toLowerCase().startsWith(prefix.toLowerCase()));
}

function val(row: Record<string, unknown>, prefix: string): string {
  const key = findKey(row, prefix);
  return key ? String(row[key] ?? "").trim() : "";
}

function num(row: Record<string, unknown>, prefix: string, fallback: number): number {
  const s = val(row, prefix);
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

export interface ProductsParseResult {
  products: ProductInput[];
  /** أسماء الفئات اللي ظهرت في الشيت */
  categories: string[];
  skippedRows: number;
}

export function parseProductsSheet(arrayBuffer: ArrayBuffer): ProductsParseResult {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const products: ProductInput[] = [];
  const categories = new Set<string>();
  let current: ProductInput | null = null;
  let skippedRows = 0;

  for (const row of rows) {
    const code = val(row, "ID");
    const name = val(row, "Name en");
    const variantSize = val(row, "Option 1 value");

    if (code && name) {
      // صف منتج جديد
      const category = val(row, "Category");
      if (category) categories.add(category);
      const activeRaw = val(row, "Active").toLowerCase();
      current = {
        code,
        name,
        nameAr: val(row, "اسم المنتج بالعربي") || undefined,
        category,
        imageUrl: val(row, "Image URL") || undefined,
        active: activeRaw === "" || activeRaw === "1" || activeRaw === "true",
        variants: [],
      };
      products.push(current);
      // بعض الشيتات بتحط أول حجم على نفس صف المنتج
      if (variantSize) {
        current.variants.push(rowVariant(row, variantSize));
      }
    } else if (current && variantSize) {
      // صف حجم تابع لآخر منتج
      current.variants.push(rowVariant(row, variantSize));
    } else if (code || name || variantSize) {
      skippedRows++;
    }
    // الصفوف الفاضية تماماً بتتعدى بصمت
  }

  // منتج من غير صفوف أحجام = حجم واحد افتراضي بسعر 0
  for (const p of products) {
    if (!p.variants.length) {
      p.variants.push({ size: "", price: 0, quantity: 0 });
    }
  }

  return { products, categories: Array.from(categories), skippedRows };
}

function rowVariant(row: Record<string, unknown>, size: string): ProductVariant {
  return {
    size,
    price: num(row, "Price", 0),
    quantity: num(row, "Quantity", 0),
  };
}
