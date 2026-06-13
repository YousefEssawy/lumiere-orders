/**
 * App-wide display formats — single source of truth.
 *
 * نفس نمط devopsolution `lib/appGlobals.ts`: فورمات تواريخ ثابتة
 * locale-independent بتستخدم في كل الواجهة بنفس الشكل.
 *
 * القاعدة: ممنوع تنسيق تاريخ/وقت للعرض بـ toLocaleDateString أو
 * toLocaleString أو قص نصوص — استخدم الدوال هنا عشان كل الشاشات
 * ترندر بنفس الطريقة.
 */
import { Timestamp } from "firebase/firestore";

export const DATE_ONLY_FORMAT = "yyyy-MM-dd";
export const TIME_FORMAT = "h:mm a";
export const DATE_TIME_FORMAT = "yyyy-MM-dd h:mm a";

/** بديل القيم الفاضية/غير الصالحة — نفس شرطة الجداول. */
export const EMPTY_DISPLAY = "—";

export type DateInput = string | number | Date | Timestamp | unknown;

interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
}

function extract(value: DateInput): Parts | null {
  if (value === null || value === undefined || value === "") return null;

  // Firestore Timestamp — مصدر التواريخ الأساسي عندنا
  if (value instanceof Timestamp) {
    const dt = value.toDate();
    return {
      y: dt.getFullYear(),
      mo: dt.getMonth() + 1,
      d: dt.getDate(),
      h: dt.getHours(),
      mi: dt.getMinutes(),
    };
  }

  if (typeof value === "string") {
    // "yyyy-MM-dd" أو "yyyy-MM-dd[T| ]HH:mm..." — قراءة حرفية من غير timezone shifting
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim());
    if (m) {
      return {
        y: Number(m[1]),
        mo: Number(m[2]),
        d: Number(m[3]),
        h: m[4] !== undefined ? Number(m[4]) : 0,
        mi: m[5] !== undefined ? Number(m[5]) : 0,
      };
    }
  }

  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return null;
  }
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return {
    y: dt.getFullYear(),
    mo: dt.getMonth() + 1,
    d: dt.getDate(),
    h: dt.getHours(),
    mi: dt.getMinutes(),
  };
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** `yyyy-MM-dd`، أو `—` للفاضي/غير الصالح. */
export function formatDate(value: DateInput): string {
  const p = extract(value);
  return p ? `${p.y}-${pad2(p.mo)}-${pad2(p.d)}` : EMPTY_DISPLAY;
}

/** `h:mm AM/PM` (12 ساعة ثابت)، أو `—`. */
export function formatTime(value: DateInput): string {
  const p = extract(value);
  if (!p) return EMPTY_DISPLAY;
  const isAm = p.h < 12;
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${pad2(p.mi)} ${isAm ? "AM" : "PM"}`;
}

/** `yyyy-MM-dd h:mm AM/PM`، أو `—`. */
export function formatDateTime(value: DateInput): string {
  const p = extract(value);
  return p ? `${formatDate(value)} ${formatTime(value)}` : EMPTY_DISPLAY;
}

/** نطاق تواريخ `2026-05-18 → 2026-05-22` — بينهار لقيمة واحدة لو متساويين. */
export function formatDateRange(from: DateInput, to: DateInput): string {
  const f = formatDate(from);
  if (f === EMPTY_DISPLAY) return EMPTY_DISPLAY;
  const t = formatDate(to);
  if (t === EMPTY_DISPLAY || t === f) return f;
  return `${f} → ${t}`;
}

/**
 * تجميع رقمي ثابت (فواصل آلاف) — locale مثبّت "en-US" فالنتيجة واحدة عبر
 * كل الأجهزة. للأرقام/المبالغ فقط، مش للتواريخ.
 */
export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}
