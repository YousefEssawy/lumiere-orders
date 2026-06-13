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
  "history.update",
  "history.delete",
  "history.clear",
  "history.status",
  "user.create",
  "user.update",
  "user.activate",
  "user.deactivate",
  "user.password",
  "product.create",
  "product.update",
  "product.delete",
  "products.import",
  "products.export",
  "category.create",
  "category.update",
  "category.delete",
  "expense.create",
  "expense.update",
  "expense.delete",
  "expenses.export",
  "expenseCategory.create",
  "expenseCategory.update",
  "expenseCategory.delete",
  "whatsapp.send",
  "settings.update",
  "system.migrate",
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
  products: "products",
  categories: "categories",
  settings: "settings",
  expenses: "expenses",
  expenseCategories: "expenseCategories",
} as const;

// ============ المصروفات ============

/** طرق الدفع للمصروف */
export const PAYMENT_METHODS = ["cash", "instapay", "bank", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** فئة مصروف (مواد خام، تغليف، تسويق...) — قابلة للإضافة والتعديل */
export interface ExpenseCategory {
  id?: string;
  name: string;
  active: boolean;
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}

/** مصروف واحد — date = تاريخ الصرف الفعلي (yyyy-MM-dd) مستقل عن createdAt */
export interface Expense {
  id?: string;
  description: string;
  category: string;
  amount: number;
  date: string; // yyyy-MM-dd
  vendor?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}

/** doc id الثابت لإعدادات قوالب الواتساب داخل settings */
export const WHATSAPP_SETTINGS_DOC = "whatsapp";

/**
 * قوالب رسائل الواتساب لكل حالة — نص فاضي = مفيش زرار واتساب للحالة دي.
 * البلايس هولدرز المتاحة: {name} {items} {cod}
 */
export type WhatsappTemplates = Partial<Record<OrderStatus, string>>;

export interface WhatsappSettings {
  id?: string;
  templates: WhatsappTemplates;
  updatedBy?: string;
  updatedAt?: unknown;
}

// ============ الكتالوج ============

export interface Category {
  id?: string;
  name: string;
  active: boolean;
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}

/** حجم/خيار للمنتج — سعر وكمية ستوك مستقلين */
export interface ProductVariant {
  size: string; // "50ml" — ممكن تكون "" لمنتج من غير أحجام
  price: number;
  /** السعر قبل الخصم (شيت سلر: Original price) */
  originalPrice?: number;
  quantity: number;
}

/** المنتج — الـ document id هو الكود (M21) عشان الـ upsert من الشيت */
export interface Product {
  id?: string;
  code: string; // M21
  name: string; // Tiger M21
  nameAr?: string;
  /** وصف HTML (شيت سلر) */
  description?: string;
  descriptionAr?: string;
  category: string;
  imageUrl?: string;
  /** اسم الخيار في شيت سلر (Option 1) — افتراضياً Size */
  optionName?: string;
  active: boolean;
  variants: ProductVariant[];
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}
