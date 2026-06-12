"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import {
  DEFAULT_LOCALE, dirOf, getStoredLocale, setStoredLocale, type Locale,
} from "@/lib/i18n";

const MESSAGES: Record<Locale, typeof en> = { en, ar };

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}
const Ctx = createContext<LocaleCtx>({ locale: DEFAULT_LOCALE, setLocale: () => {} });

export function useAppLocale(): LocaleCtx {
  return useContext(Ctx);
}

export default function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // اقرأ اللغة المحفوظة بعد الـ hydration (static export = مفيش server locale)
  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  // اعكس اللغة والاتجاه على <html>
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  function setLocale(l: Locale) {
    setStoredLocale(l);
    setLocaleState(l);
  }

  return (
    <Ctx.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Africa/Cairo">
        {children}
      </NextIntlClientProvider>
    </Ctx.Provider>
  );
}
