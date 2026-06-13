// رسائل واتساب عبر رابط wa.me (Click-to-Chat) — مفيش سيرفر ولا API:
// الزر بيفتح واتساب برقم العميل ورسالة جاهزة، والمستخدم بيبعتها بإيده.
import type { Order } from "@/lib/wassalha";
import type { OrderStatus, WhatsappTemplates } from "@/lib/types";

/**
 * القوالب الافتراضية (عربي بهوية لوميير) — بتتسخدم لو الأدمن لسه ماظبطش
 * إعدادات مخصصة. نص فاضي لحالة = مفيش رسالة لها.
 * البلايس هولدرز: {name} اسم العميل · {items} المنتجات · {cod} قيمة التحصيل
 */
export const DEFAULT_WHATSAPP_TEMPLATES: Record<OrderStatus, string> = {
  preparing:
    "أهلاً {name} 🌿\nطلبك من Lumière بيتجهز دلوقتي:\n{items}\nقيمة التحصيل: {cod} جنيه.\nهنبعتلك تحديث أول ما يتشحن. شكراً لاختيارك لوميير 💛",
  shipped:
    "أهلاً {name} 🚚\nطلبك من Lumière اتشحن وفي الطريق إليك:\n{items}\nالمندوب هيتواصل معاك قريب، والمطلوب عند الاستلام: {cod} جنيه.",
  delivered:
    "أهلاً {name} 💛\nيا رب يكون طلبك من Lumière وصلك بالسلامة وعجبك:\n{items}\nلو حابب أي ترشيح أو استفسار إحنا في خدمتك.",
  returned: "",
  cancelled: "",
};

/** 01117613389 → 201117613389 (الصيغة الدولية لمصر لرابط wa.me) */
export function intlPhone(local: string): string {
  let p = String(local || "").replace(/\D/g, "");
  if (p.startsWith("20")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  return "20" + p;
}

/** سرد المنتجات سطر-سطر بنقطة في الأول */
function itemsList(items: string): string {
  return String(items || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => "• " + l)
    .join("\n");
}

/** بيملأ القالب ببيانات الأوردر */
export function fillTemplate(template: string, order: Order): string {
  return template
    .replace(/\{name\}/g, order.name || "")
    .replace(/\{items\}/g, itemsList(order.items))
    .replace(/\{cod\}/g, String(order.cod ?? ""));
}

/** القالب الفعلي لحالة: المخصص لو موجود، وإلا الافتراضي */
export function templateFor(
  status: OrderStatus,
  custom: WhatsappTemplates | undefined
): string {
  const c = custom?.[status];
  if (c !== undefined) return c; // الأدمن ظبطها (حتى لو فاضية = متعمد)
  return DEFAULT_WHATSAPP_TEMPLATES[status] ?? "";
}

/** رابط wa.me كامل بالرسالة الجاهزة — أو null لو مفيش رقم/رسالة */
export function waLink(order: Order, message: string): string | null {
  const phone = intlPhone(order.phone);
  if (phone.length < 11 || !message.trim()) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
