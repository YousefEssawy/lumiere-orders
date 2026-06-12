"use client";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/components/IntlProvider";

export default function LanguageToggle() {
  const t = useTranslations("nav");
  const { locale, setLocale } = useAppLocale();

  return (
    <button
      type="button"
      className="btn-ghost text-xs px-3 py-1.5"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      aria-label={t("language")}
    >
      <span className="icon text-base" aria-hidden>language</span>
      {t("language")}
    </button>
  );
}
