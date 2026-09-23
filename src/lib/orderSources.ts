// مصادر الأوردرات: القايمة الافتراضية + قواعد مصادر النظام + أصل الأوردر.
import type { OrderOrigin, OrderSourceDoc } from "@/lib/types";
import type { Order } from "@/lib/wassalha";

/** مصادر بيكتبها الاستيراد بالاسم — تغيير اسمها أو حذفها يكسر الاستيراد */
export const SYSTEM_SOURCES = ["Wuilt", "Sllr"] as const;

/** المصدر الافتراضي في فورم الإضافة اليدوية (لو مفعّل) */
const PREFERRED_MANUAL_SOURCE = "WhatsApp";

/**
 * القايمة الافتراضية — بتتزرع في Firestore بـ ids ثابتة، وبتستخدم كـ fallback
 * لو الكوليكشن فاضي أو القراءة فشلت (الفورم مايفضلش من غير مصادر أبداً).
 */
export const DEFAULT_ORDER_SOURCES: (OrderSourceDoc & { id: string })[] = [
  { id: "wuilt", name: "Wuilt", active: true, system: true },
  { id: "sllr", name: "Sllr", active: true, system: true },
  { id: "whatsapp", name: "WhatsApp", active: true },
  { id: "instagram", name: "Instagram", active: true },
  { id: "other", name: "Other", active: true },
];

/** بالاسم كمان — مصدر "Wuilt" اتضاف يدوي لازم يتقفل برضه */
export function isSystemSource(source: string | Pick<OrderSourceDoc, "name" | "system">): boolean {
  const name = typeof source === "string" ? source : source.name;
  if (typeof source !== "string" && source.system) return true;
  return SYSTEM_SOURCES.some((s) => s.toLowerCase() === name.trim().toLowerCase());
}

/** المصادر الافتراضية الناقصة من الكوليكشن (بالاسم، من غير حساسية للحروف) */
export function missingDefaultSources(existing: Pick<OrderSourceDoc, "name">[]) {
  const names = new Set(existing.map((s) => s.name.trim().toLowerCase()));
  return DEFAULT_ORDER_SOURCES.filter((s) => !names.has(s.name.toLowerCase()));
}

/**
 * المصدر المختار افتراضياً في الفورم اليدوي: واتساب لو مفعّل، وإلا أول مصدر
 * مش من مصادر المتجر — عشان أوردر يدوي مايتسجلش ويلت من غير ما حد ياخد باله.
 */
export function defaultManualSource(activeNames: string[]): string {
  if (activeNames.includes(PREFERRED_MANUAL_SOURCE)) return PREFERRED_MANUAL_SOURCE;
  return activeNames.find((n) => !isSystemSource(n)) ?? activeNames[0] ?? "";
}

/**
 * أصل الأوردر. الأوردرات اللي قبل حقل origin من غيره: ويلت/سلر بنعتبرهم
 * استيراد والباقي يدوي — تقدير، لأن التعديل القديم كان بيسمح بتغيير المصدر.
 * أداة ترقية البيانات بتثبّت القيمة دي في الـ document.
 */
export function orderOrigin(o: Pick<Order, "origin" | "source">): OrderOrigin {
  return o.origin ?? (isSystemSource(o.source) ? "import" : "manual");
}
