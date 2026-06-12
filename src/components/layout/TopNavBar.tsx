"use client";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import LanguageToggle from "@/components/LanguageToggle";

interface TopNavBarProps {
  profile: UserProfile;
  onToggleMenu: () => void;
}

export default function TopNavBar({ profile, onToggleMenu }: TopNavBarProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
        <button
          type="button"
          className="btn-ghost p-2 md:hidden"
          onClick={onToggleMenu}
          aria-label={t("nav.menu")}
        >
          <span className="icon" aria-hidden>menu</span>
        </button>

        <Image
          src="/assets/logo.jpg"
          alt={t("brand.name")}
          width={36}
          height={36}
          className="rounded-full border border-line object-cover"
          priority
        />
        <div className="leading-tight">
          <div className="font-display font-bold text-lg tracking-wide">
            LUMI<span className="text-gold">È</span>RE
          </div>
          <div className="text-[11px] text-ink-500 hidden sm:block">{t("brand.sub")}</div>
        </div>

        <div className="flex-1" />

        <LanguageToggle />
        <div className="text-xs text-ink-500 hidden sm:block" title={profile.email}>
          {profile.name || profile.email}
        </div>
        <button
          type="button"
          className="btn-dark text-xs px-3 py-1.5"
          onClick={() => auth && signOut(auth)}
        >
          <span className="icon text-base" aria-hidden>logout</span>
          <span className="hidden sm:inline">{t("nav.logout")}</span>
        </button>
      </div>
    </header>
  );
}
