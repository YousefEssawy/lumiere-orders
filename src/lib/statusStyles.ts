// ألوان حالات الأوردر وعمليات اللوجز — من باستيلات الهوية. مصدر واحد لكل الصفحات.
import type { LogAction, OrderStatus } from "@/lib/types";

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
  "system.migrate": "bg-soft text-ink-700",
};
