// إعدادات اللغة — client-side (static export، مفيش server routing)
export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "lumiere.locale";

export function isLocale(v: unknown): v is Locale {
  return SUPPORTED_LOCALES.includes(v as Locale);
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
