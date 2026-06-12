"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppRoutes, type AppRoute } from "@/lib/appRoutes";

interface NavItem {
  labelKey: "orders" | "history" | "products" | "categories" | "users" | "logs" | "migration" | "help";
  icon: string;
  href: AppRoute;
  adminOnly: boolean;
}

interface NavSection {
  sectionKey: "operations" | "catalog" | "administration" | "support";
  items: NavItem[];
}

// تعريف المنيو في مكان واحد — الصلاحية جزء من التعريف مش شرط متكرر
const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: "operations",
    items: [
      { labelKey: "orders", icon: "package_2", href: AppRoutes.orders, adminOnly: false },
      { labelKey: "history", icon: "local_shipping", href: AppRoutes.history, adminOnly: false },
    ],
  },
  {
    sectionKey: "catalog",
    items: [
      { labelKey: "products", icon: "inventory_2", href: AppRoutes.products, adminOnly: false },
      { labelKey: "categories", icon: "category", href: AppRoutes.categories, adminOnly: false },
    ],
  },
  {
    sectionKey: "administration",
    items: [
      { labelKey: "users", icon: "group", href: AppRoutes.users, adminOnly: true },
      { labelKey: "logs", icon: "history", href: AppRoutes.logs, adminOnly: true },
      { labelKey: "migration", icon: "build", href: AppRoutes.migration, adminOnly: true },
    ],
  },
  {
    sectionKey: "support",
    items: [
      { labelKey: "help", icon: "help", href: AppRoutes.help, adminOnly: false },
    ],
  },
];

function isActive(pathname: string, href: AppRoute): boolean {
  if (href === AppRoutes.orders) return pathname === AppRoutes.orders;
  return pathname.startsWith(href.replace(/\/$/, ""));
}

interface SideNavBarProps {
  isAdmin: boolean;
  /** open بيتحكم في الدرج على الموبايل والسايدبار على الديسكتوب */
  open: boolean;
  onClose: () => void;
}

/**
 * سايدبار زجاجي عائم بينزلق برا الشاشة لما يتقفل (على كل المقاسات) —
 * المحتوى الرئيسي بياخد العرض كله. start-0 بيخليه يتبع اتجاه اللغة.
 */
export default function SideNavBar({ isAdmin, open, onClose }: SideNavBarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <>
      {/* خلفية معتمة — موبايل بس */}
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-ink-900/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={
          "fixed start-0 top-20 bottom-3 w-64 z-40 transition-transform duration-300 ease-standard " +
          (open
            ? "translate-x-0"
            : "ltr:-translate-x-[calc(100%+0.75rem)] rtl:translate-x-[calc(100%+0.75rem)]")
        }
        aria-hidden={!open ? "true" : undefined}
      >
        <div className="glass-card rounded-2xl mx-3 h-full flex flex-col py-5 overflow-y-auto">
          <nav className="flex flex-col flex-1 px-3">
            {NAV_SECTIONS.map((section, sectionIndex) => {
              const visibleItems = section.items.filter((i) => !i.adminOnly || isAdmin);
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.sectionKey} className={sectionIndex > 0 ? "mt-2" : ""}>
                  <p className="nav-section">{t(`sections.${section.sectionKey}`)}</p>
                  {visibleItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.labelKey}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={"nav-link " + (active ? "nav-link-active" : "")}
                      >
                        <span className="icon" aria-hidden>{item.icon}</span>
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
            <div className="flex-1" />
            <div className="text-[11px] text-ink-300 px-4 pb-1">Lumière Orders</div>
          </nav>
        </div>
      </aside>
    </>
  );
}
