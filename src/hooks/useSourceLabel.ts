"use client";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

/**
 * اسم المصدر للعرض: المصادر الافتراضية ليها ترجمة (sources.WhatsApp = واتساب)،
 * وأي مصدر اتضاف من صفحة المصادر بيظهر باسمه زي ما اتكتب.
 */
export function useSourceLabel() {
  const t = useTranslations("orders.sources");
  // النقطة عند next-intl مسار مفاتيح متداخلة — اسم زي "fb.com" مالوش ترجمة أصلاً
  return useCallback((name: string) => (name && !name.includes(".") && t.has(name) ? t(name) : name), [t]);
}
