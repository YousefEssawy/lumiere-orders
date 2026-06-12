// أنواع البيانات المشتركة (Firestore documents + الأدوار)

export const USER_ROLES = ["admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt?: unknown;
  createdBy?: string; // uid اللي أنشأ الحساب
}

// أنواع الأحداث المسجلة في اللوجز — append-only
export const LOG_ACTIONS = [
  "order.add",
  "order.delete",
  "orders.import",
  "orders.export",
  "orders.clear",
  "history.delete",
  "history.clear",
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
