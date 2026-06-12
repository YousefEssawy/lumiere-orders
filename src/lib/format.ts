// تنسيق التواريخ — كل تاريخ معروض في التطبيق لازم يعدي من هنا
import { Timestamp } from "firebase/firestore";
import type { Locale } from "@/lib/i18n";

export const EMPTY_DISPLAY = "—";

export function formatDateTime(value: unknown, locale: Locale): string {
  if (!(value instanceof Timestamp)) return EMPTY_DISPLAY;
  // nu-latn: أرقام غربية حتى في العربي (قاعدة البراند)
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value.toDate());
}
