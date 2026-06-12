"use client";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { AppRoutes } from "@/lib/appRoutes";
import type { UserProfile } from "@/lib/types";
import LanguageToggle from "@/components/LanguageToggle";

interface TopNavBarProps {
  profile: UserProfile;
  /** بيفتح/يقفل السايدبار على كل المقاسات */
  onToggleMenu: () => void;
  menuOpen: boolean;
}

/**
 * ناف بار عائم زجاجي مستدير (glass pill) — همبرجر + اللوجو والاسم في البداية،
 * اللغة والمستخدم والخروج في النهاية. بيمتد بعرض الشاشة بهامش 12px.
 */
export default function TopNavBar({ profile, onToggleMenu, menuOpen }: TopNavBarProps) {
  const t = useTranslations();

  return (
    <header className="fixed top-3 inset-x-3 z-50">
      <div className="glass-card rounded-full h-14 px-2.5 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-canvas/70 transition-colors shrink-0"
          >
            <span className="icon" aria-hidden>{menuOpen ? "menu_open" : "menu"}</span>
          </button>

          <Link href={AppRoutes.orders} className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/assets/logo.jpg"
              alt={t("brand.name")}
              width={32}
              height={32}
              className="rounded-full border border-line object-cover"
              priority
            />
            <span className="font-display font-bold text-base tracking-wide text-ink-900">
              LUMIÈRE
            </span>
          </Link>

          <div className="hidden lg:flex flex-col ms-2 ps-5 border-s border-line min-w-0">
            <span className="text-sm font-semibold text-ink-700 leading-none truncate">
              {t("brand.sub")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <LanguageToggle />
          <span className="text-xs text-ink-500 hidden sm:block max-w-[160px] truncate" title={profile.email}>
            {profile.name || profile.email}
          </span>
          <button
            type="button"
            onClick={() => auth && signOut(auth)}
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:text-danger hover:bg-canvas/70 transition-colors"
          >
            <span className="icon" aria-hidden>logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
