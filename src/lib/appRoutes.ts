// المصدر الوحيد لكل المسارات الداخلية — ممنوع كتابة مسار كنص في أي مكون.
export const AppRoutes = {
  orders: "/",
  users: "/users/",
  logs: "/logs/",
  help: "/help/",
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];
