// أنواع البيانات المشتركة (Firestore documents + الأدوار)

export const USER_ROLES = ["admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// حالات الأوردر في الهيستوري:
// preparing (بيتجهز للمندوب — الافتراضي عند الأرشفة) → shipped → delivered،
// و returned / cancelled للحالات الاستثنائية
export const ORDER_STATUSES = [
  "preparing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const DEFAULT_ORDER_STATUS: OrderStatus = "preparing";

export interface UserProfile {
  uid: string;
  /** نفس الـ uid — متخزن جوه الـ document (كل ريكورد له id) */
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  // Audit entity (راجع lib/audit.ts) — createdBy/updatedBy = uid
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}

// أنواع الأحداث المسجلة في اللوجز — append-only
export const LOG_ACTIONS = [
  "order.add",
  "order.update",
  "order.delete",
  "orders.import",
  "orders.export",
  "orders.clear",
  "history.delete",
  "history.clear",
  "history.status",
  "user.create",
  "user.update",
  "user.activate",
  "user.deactivate",
  "user.password",
] as const;
export type LogAction = (typeof LOG_ACTIONS)[number];

export interface LogEntry {
  id?: string;
  uid: string;
  email: string;
  action: LogAction;
  /** تفاصيل مختصرة قابلة للعرض: اسم العميل، عدد الأوردرات، إيميل اليوزر... */
  detail: string;
  /** عدد العناصر المتأثرة لو العملية جماعية */
  count?: number;
  createdAt?: unknown;
}

export const FIRESTORE_COLLECTIONS = {
  orders: "orders",
  ordersArchive: "ordersArchive",
  users: "users",
  logs: "logs",
} as const;
