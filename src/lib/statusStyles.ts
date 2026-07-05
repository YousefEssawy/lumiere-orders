// ألوان حالات الأوردر ومصادره وعمليات اللوجز — من باستيلات الهوية. مصدر واحد لكل الصفحات.
import type { LogAction, OrderStatus } from "@/lib/types";
import type { OrderSource } from "@/lib/wassalha";

/** بادجات مصدر الأوردر */
export const SOURCE_CLASS: Record<OrderSource, string> = {
  Sllr: "bg-pastel-sky text-ink-700",
  WhatsApp: "bg-pastel-mint text-ink-700",
  Instagram: "bg-pastel-pink text-ink-700",
  Other: "bg-soft text-ink-500",
};

export const STATUS_CLASS: Record<OrderStatus, string> = {
  preparing: "bg-pastel-butter text-ink-700",
  shipped: "bg-pastel-sky text-ink-700",
  delivered: "bg-pastel-mint text-ink-700",
  returned: "bg-pastel-peach text-ink-700",
  cancelled: "bg-soft text-ink-500",
};

/**
 * تلوين تصنيفي لعمليات اللوجز عشان القراءة السريعة:
 * أخضر = إنشاء/تفعيل · أزرق = تعديل · وردي/أحمر = حذف/تعطيل ·
 * أصفر = استيراد/تصدير · برتقالي = نقل · لافندر = حالة/حساب · كريمي = نظام
 */
export const ACTION_CLASS: Record<LogAction, string> = {
  "order.add": "bg-pastel-mint text-ink-700",
  "order.update": "bg-pastel-sky text-ink-700",
  "order.delete": "bg-pastel-pink text-danger",
  "orders.import": "bg-pastel-butter text-ink-700",
  "orders.export": "bg-pastel-butter text-ink-700",
  "orders.clear": "bg-pastel-peach text-ink-700",
  "history.update": "bg-pastel-sky text-ink-700",
  "history.delete": "bg-pastel-pink text-danger",
  "history.clear": "bg-pastel-pink text-danger",
  "history.status": "bg-pastel-lavender text-ink-700",
  "user.create": "bg-pastel-mint text-ink-700",
  "user.update": "bg-pastel-sky text-ink-700",
  "user.activate": "bg-pastel-mint text-ink-700",
  "user.deactivate": "bg-pastel-pink text-danger",
  "user.password": "bg-pastel-lavender text-ink-700",
  "product.create": "bg-pastel-mint text-ink-700",
  "product.update": "bg-pastel-sky text-ink-700",
  "product.delete": "bg-pastel-pink text-danger",
  "products.import": "bg-pastel-butter text-ink-700",
  "products.export": "bg-pastel-butter text-ink-700",
  "category.create": "bg-pastel-mint text-ink-700",
  "category.update": "bg-pastel-sky text-ink-700",
  "category.delete": "bg-pastel-pink text-danger",
  "expense.create": "bg-pastel-mint text-ink-700",
  "expense.update": "bg-pastel-sky text-ink-700",
  "expense.delete": "bg-pastel-pink text-danger",
  "expense.pay": "bg-pastel-mint text-ink-700",
  "expenses.export": "bg-pastel-butter text-ink-700",
  "expenseCategory.create": "bg-pastel-mint text-ink-700",
  "expenseCategory.update": "bg-pastel-sky text-ink-700",
  "expenseCategory.delete": "bg-pastel-pink text-danger",
  "fund.create": "bg-pastel-mint text-ink-700",
  "fund.update": "bg-pastel-sky text-ink-700",
  "fund.delete": "bg-pastel-pink text-danger",
  "whatsapp.send": "bg-pastel-mint text-ink-700",
  "settings.update": "bg-pastel-sky text-ink-700",
  "system.migrate": "bg-soft text-ink-700",
};
