// ألوان حالات الأوردر — من باستيلات الهوية. مصدر واحد لكل الصفحات.
import type { OrderStatus } from "@/lib/types";

export const STATUS_CLASS: Record<OrderStatus, string> = {
  preparing: "bg-pastel-butter text-ink-700",
  shipped: "bg-pastel-sky text-ink-700",
  delivered: "bg-pastel-mint text-ink-700",
  returned: "bg-pastel-peach text-ink-700",
  cancelled: "bg-soft text-ink-500",
};
