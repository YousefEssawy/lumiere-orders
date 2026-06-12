// المصدر الوحيد لكل المسارات الداخلية — ممنوع كتابة مسار كنص في أي مكون.
export const AppRoutes = {
  orders: "/",
  history: "/history/",
  users: "/users/",
  logs: "/logs/",
  migration: "/migration/",
  help: "/help/",
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];
