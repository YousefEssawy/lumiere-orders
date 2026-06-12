"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppRoutes, type AppRoute } from "@/lib/appRoutes";

interface NavItem {
  labelKey: "orders" | "users" | "logs" | "help";
  icon: string;
  href: AppRoute;
  adminOnly: boolean;
}

// تعريف المنيو في مكان واحد — الصلاحية جزء من التعريف مش شرط متكرر
const NAV_ITEMS: NavItem[] = [
  { labelKey: "orders", icon: "package_2", href: AppRoutes.orders, adminOnly: false },
  { labelKey: "users", icon: "group", href: AppRoutes.users, adminOnly: true },
  { labelKey: "logs", icon: "history", href: AppRoutes.logs, adminOnly: true },
  { labelKey: "help", icon: "help", href: AppRoutes.help, adminOnly: false },
];

function isActive(pathname: string, href: AppRoute): boolean {
  if (href === AppRoutes.orders) return pathname === AppRoutes.orders;
  return pathname.startsWith(href.replace(/\/$/, ""));
}

interface SideNavBarProps {
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
}

export default function SideNavBar({ isAdmin, open, onClose }: SideNavBarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={
          "fixed top-[57px] bottom-0 start-0 z-40 w-60 transition-transform duration-300 ease-standard " +
          // الإخفاء بيحصل تحت md بس — على الديسكتوب السايدبار ظاهر دايماً
          (open
            ? "translate-x-0"
            : "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full")
        }
      >
        <nav className="h-full bg-canvas border-e border-line p-3 flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.labelKey}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={"nav-link " + (active ? "nav-link-active" : "")}
              >
                <span className="icon" aria-hidden>{item.icon}</span>
                {t(item.labelKey)}
              </Link>
            );
          })}
          <div className="flex-1" />
          <div className="text-[11px] text-ink-300 px-4 pb-2">Lumière Orders</div>
        </nav>
      </aside>
    </>
  );
}
