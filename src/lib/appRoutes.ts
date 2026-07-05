// المصدر الوحيد لكل المسارات الداخلية — ممنوع كتابة مسار كنص في أي مكون.
export const AppRoutes = {
  orders: "/",
  history: "/history/",
  products: "/products/",
  categories: "/categories/",
  expenses: "/expenses/",
  expenseCategories: "/expense-categories/",
  treasury: "/treasury/",
  users: "/users/",
  logs: "/logs/",
  settings: "/settings/",
  migration: "/migration/",
  help: "/help/",
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];
