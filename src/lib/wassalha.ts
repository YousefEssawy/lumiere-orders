// منطق التحويل بين أوردرات المتجر وملف وصلها + القواعد الثابتة
import * as XLSX from "xlsx";
import { fileDateStamp } from "@/lib/appGlobals";

export type OrderSource = "Sllr" | "Wuilt" | "WhatsApp" | "Instagram" | "Other";

export interface Order {
  id?: string;
  source: OrderSource;
  name: string;
  phone: string;
  address: string;
  city: string; // قيمة وصلها أو "" لو مش معروفة
  cod: number | string;
  items: string;
  vol: string;
  notes: string;
  ref: string;
  // Audit entity (راجع lib/audit.ts) — createdBy/updatedBy = uid
  createdBy?: string;
  createdAt?: unknown;
  updatedBy?: string;
  updatedAt?: unknown;
}

export const WASSALHA_CITIES: string[] = [
  "CAIRO","GIZA","ALEXANDRIA","BEHIRA","QALIUBIA","GHARBIA","MONOUFIA","DOMITTA",
  "DAKAHLIA","KAFR EL SHEIKH","MARSA MATROUH","ISMAILIA","SUEZ","PORT SAID","SHARKIA",
  "FAYOUM","BANI SWEIF","MENIA","ASSIUT","SOUHAGE","QENA","ASWAN","LOUXOR","RED SEA",
  "NEW VALLLEY","NOURTH SINAI","SOUTH SINAI",
];

const CITY_MAP: Record<string, string> = {
  "cairo":"CAIRO","القاهرة":"CAIRO",
  "giza":"GIZA","الجيزة":"GIZA","الجيزه":"GIZA",
  "alexandria":"ALEXANDRIA","alex":"ALEXANDRIA","الاسكندرية":"ALEXANDRIA","الإسكندرية":"ALEXANDRIA",
  "beheira":"BEHIRA","behira":"BEHIRA","elbehira":"BEHIRA","البحيرة":"BEHIRA",
  "qaliubia":"QALIUBIA","qalyubia":"QALIUBIA","qaliobia":"QALIUBIA","القليوبية":"QALIUBIA",
  "gharbia":"GHARBIA","الغربية":"GHARBIA",
  "monoufia":"MONOUFIA","menoufia":"MONOUFIA","monufia":"MONOUFIA","المنوفية":"MONOUFIA",
  "domitta":"DOMITTA","damietta":"DOMITTA","dumyat":"DOMITTA","دمياط":"DOMITTA",
  "dakahlia":"DAKAHLIA","dakahleya":"DAKAHLIA","الدقهلية":"DAKAHLIA",
  "kafr el sheikh":"KAFR EL SHEIKH","kafr elsheikh":"KAFR EL SHEIKH","kafrelsheikh":"KAFR EL SHEIKH","كفر الشيخ":"KAFR EL SHEIKH",
  "marsa matrouh":"MARSA MATROUH","matrouh":"MARSA MATROUH","matruh":"MARSA MATROUH","مطروح":"MARSA MATROUH",
  "ismailia":"ISMAILIA","الاسماعيلية":"ISMAILIA","الإسماعيلية":"ISMAILIA",
  "suez":"SUEZ","السويس":"SUEZ",
  "port said":"PORT SAID","portsaid":"PORT SAID","بورسعيد":"PORT SAID","بور سعيد":"PORT SAID",
  "sharkia":"SHARKIA","sharqia":"SHARKIA","الشرقية":"SHARKIA",
  "fayoum":"FAYOUM","faiyum":"FAYOUM","الفيوم":"FAYOUM",
  "bani sweif":"BANI SWEIF","beni suef":"BANI SWEIF","banisweif":"BANI SWEIF","بني سويف":"BANI SWEIF",
  "menia":"MENIA","minya":"MENIA","المنيا":"MENIA",
  "assiut":"ASSIUT","asyut":"ASSIUT","اسيوط":"ASSIUT","أسيوط":"ASSIUT",
  "souhage":"SOUHAGE","sohag":"SOUHAGE","suhag":"SOUHAGE","سوهاج":"SOUHAGE",
  "qena":"QENA","قنا":"QENA",
  "aswan":"ASWAN","اسوان":"ASWAN","أسوان":"ASWAN",
  "louxor":"LOUXOR","luxor":"LOUXOR","الاقصر":"LOUXOR","الأقصر":"LOUXOR",
  "red sea":"RED SEA","redsea":"RED SEA","البحر الاحمر":"RED SEA","البحر الأحمر":"RED SEA",
  "new valley":"NEW VALLLEY","newvalley":"NEW VALLLEY","الوادي الجديد":"NEW VALLLEY",
  "north sinai":"NOURTH SINAI","nourth sinai":"NOURTH SINAI","شمال سيناء":"NOURTH SINAI",
  "south sinai":"SOUTH SINAI","جنوب سيناء":"SOUTH SINAI",
};

// مفاتيح المدن مرتبة من الأطول للأقصر — عشان الـ substring match يفضّل
// الأكثر تحديداً ومايقعش في false positive من مفتاح قصير (alex/suez/qena).
const CITY_KEYS_BY_LENGTH = Object.keys(CITY_MAP).sort((a, b) => b.length - a.length);

export function mapCity(raw: unknown): string {
  if (!raw) return "";
  const k = String(raw).trim().toLowerCase();
  if (CITY_MAP[k]) return CITY_MAP[k];
  for (const key of CITY_KEYS_BY_LENGTH) {
    if (k.includes(key)) return CITY_MAP[key];
  }
  const up = String(raw).trim().toUpperCase();
  if (WASSALHA_CITIES.includes(up)) return up;
  return "";
}

// +201117613389 -> 01117613389
export function normPhone(raw: unknown): string {
  let p = String(raw == null ? "" : raw).replace(/[^\d+]/g, "");
  p = p.replace(/^\+/, "");
  if (p.startsWith("20")) p = p.slice(2);
  if (!p.startsWith("0")) p = "0" + p;
  return p;
}

const EG_PHONE_RE = /^01[0125]\d{8}$/;

/** بيتحقق من رقم موبايل مصري بعد التطبيع — لازم يتنادى بعد normPhone() */
export function isValidEgyptPhone(normalized: string): boolean {
  return EG_PHONE_RE.test(normalized);
}

function cleanVal(v: unknown): string {
  const s = String(v == null ? "" : v).trim();
  return !s || s === "." ? "" : s;
}

function buildAddress(r: Record<string, unknown>): string {
  const parts = [
    cleanVal(r["Address Details"]),
    cleanVal(r["Area"]),
    cleanVal(r["Building"]) ? "عمارة " + cleanVal(r["Building"]) : "",
    cleanVal(r["Floor"]) ? "دور " + cleanVal(r["Floor"]) : "",
    cleanVal(r["Apartment"]) ? "شقة " + cleanVal(r["Apartment"]) : "",
    cleanVal(r["Landmark"]) ? "علامة: " + cleanVal(r["Landmark"]) : "",
  ];
  return parts.filter(Boolean).join(" - ");
}

// القواعد الثابتة لوصلها
const TEMPLATE_COLS = [
  "Package_Serial","Description","Total_Weight","Package_volume","COD_Value",
  "Item_Special_Notes","Customer_Name","Mobile_No","Street","City",
  "Package_Ref. Number","Merchant_Name","Warehouse_Name","HasPOD","SellerName","Post_Id",
];

export function exportWassalha(orders: Order[]): void {
  const data = orders.map((o) => ({
    "Package_Serial": "",
    "Description": o.items,
    "Total_Weight": 500,            // ثابت
    "Package_volume": o.vol || "Small",
    "COD_Value": o.cod || 0,
    "Item_Special_Notes": o.notes || "",
    "Customer_Name": o.name,
    "Mobile_No": normPhone(o.phone),
    "Street": o.address,
    "City": o.city,
    "Package_Ref. Number": "",      // فاضي دايماً (وصلها بيرفض رقم سلر)
    "Merchant_Name": "Lumiere",
    "Warehouse_Name": "Home",
    "HasPOD": "",
    "SellerName": "",
    "Post_Id": "",
  }));
  const ws = XLSX.utils.json_to_sheet(data, { header: TEMPLATE_COLS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  XLSX.writeFile(wb, `Wassalha-Lumiere-${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}.xlsx`);
}

export type ImportFormat = "sllr" | "wuilt";

export interface ParseResult {
  orders: Omit<Order, "id">[];
  /** أوردرات محافظتها مش متعرّفة على وصلها */
  unknown: number;
  /** أوردرات متشحنة خلاص واتعدّت (ويلت بس) */
  skipped: number;
  format: ImportFormat;
}

/**
 * ويلت بيصدّر CSV وسلر بيصدّر xlsx — بنشوف الـ magic bytes بدل ما نعتمد على
 * امتداد الملف: "PK" = xlsx، D0CF11E0 = xls القديم، وأي حاجة تانية نص CSV.
 */
function readWorkbook(arrayBuffer: ArrayBuffer): XLSX.WorkBook {
  const bytes = new Uint8Array(arrayBuffer);
  const isBinary =
    (bytes[0] === 0x50 && bytes[1] === 0x4b) ||
    (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0);
  if (isBinary) return XLSX.read(bytes, { type: "array" });
  const text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
  return XLSX.read(text, { type: "string" });
}

function headerRow(wb: XLSX.WorkBook): string[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false });
  return (rows[0] ?? []).map((h) => String(h ?? "").trim());
}

/** بيحدد الفورمات من عناوين الأعمدة — ويلت فيه "Order ID"، سلر فيه "Sales Order ID". */
export function detectFormat(arrayBuffer: ArrayBuffer): ImportFormat | null {
  const h = headerRow(readWorkbook(arrayBuffer)).map((x) => x.toLowerCase());
  if (h.includes("order id") && h.includes("item name")) return "wuilt";
  if (h.includes("sales order id") || h.includes("customer name") && h.includes("order items")) return "sllr";
  return null;
}

/** نقطة الدخول الوحيدة للاستيراد — بتتعرّف على الملف وتنادي البارسر المناسب. */
export function parseOrdersFile(arrayBuffer: ArrayBuffer): ParseResult {
  const fmt = detectFormat(arrayBuffer);
  if (fmt === "wuilt") return parseWuilt(arrayBuffer);
  if (fmt === "sllr") return parseSllr(arrayBuffer);
  throw new Error("Unrecognised orders file");
}

export function parseSllr(arrayBuffer: ArrayBuffer): ParseResult {
  const wb = readWorkbook(arrayBuffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const out: Omit<Order, "id">[] = [];
  let unknown = 0;
  rows.forEach((r) => {
    if (!r["Customer Name"] && !r["Customer Phone"]) return;
    const city = mapCity(r["City"]);
    if (!city) unknown++;
    const pay = String(r["Payment Type"] || "").toLowerCase();
    const cod = pay.includes("cash") || pay.includes("cod") ? Number(r["Order Amount"] || 0) : 0;
    out.push({
      source: "Sllr",
      name: String(r["Customer Name"] || "").trim(),
      phone: normPhone(r["Customer Phone"]),
      address: buildAddress(r),
      city,
      cod,
      items: String(r["Order Items"] || "").trim(),
      vol: "Small",
      notes: String(r["Order Notes"] || "").trim(),
      ref: String(r["Sales Order ID"] || "").trim(),
    });
  });
  return { orders: out, unknown, skipped: 0, format: "sllr" };
}

/* ─────────────────────────── ويلت ─────────────────────────── */

// "Donna W28 - (SIMPLE)" -> "Donna W28"
function wuiltItemName(raw: unknown): string {
  return String(raw ?? "").replace(/\s*-\s*\([^)]*\)\s*$/, "").trim();
}

// "Size:50 mL" -> "50mL"  ·  المسافات بتتشال عشان تطابق variants الكتالوج (50ml/10ml)
function wuiltItemSize(raw: unknown): string {
  return String(raw ?? "").replace(/^[^:]*:\s*/, "").replace(/\s+/g, "").trim();
}

/**
 * ملف أوردرات ويلت (CSV، 50 عمود).
 *
 * تلات حاجات مميزة في الفورمات ده:
 *  1. الأوردر اللي فيه أكتر من صنف بيتكتب على أكتر من صف — الصف الأول فيه بيانات
 *     الأوردر كلها والصفوف اللي بعده فيها الأصناف بس (Order ID فاضي).
 *  2. أسماء الأعمدة مكررة: Phone و State و City و Address Line 2 بتتكرر لبلوك
 *     الشحن والفوترة والعميل — فبنقرأ بالترتيب مش بالاسم لوحده.
 *  3. State = المحافظة (اللي وصلها عايزاها) و City = المنطقة (بتروح جوه العنوان).
 *
 * شركة الشحن اللي في الملف (Bosta وغيرها) بتتجاهل — الشحن عندنا وصلها.
 */
export function parseWuilt(arrayBuffer: ArrayBuffer): ParseResult {
  const wb = readWorkbook(arrayBuffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false });
  const header = (rows[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
  const col = (name: string, from = 0) =>
    header.findIndex((h, i) => i >= from && h === name.toLowerCase());

  const iOrderId = col("order id");
  const iSerial = col("order serial");
  const iFulfil = col("fulfillment");
  const iItem = col("item name");
  const iSel = col("item selections");
  const iQty = col("item quantity");
  const iPay = col("payment method");
  const iTotal = col("total");
  const iShip = col("shipping address");
  const iLine2 = col("address line 2", iShip);
  const iState = col("state", iShip);
  const iArea = col("city", iShip);
  const iName = col("customer name");
  const iPhone = col("phone", iName >= 0 ? iName : 0);
  const iShipPhone = col("phone", iShip >= 0 ? iShip : 0);
  const iNotes = col("notes");

  const val = (r: unknown[], i: number) => (i < 0 ? "" : String(r[i] ?? "").trim());

  const out: Omit<Order, "id">[] = [];
  let unknown = 0;
  let skipped = 0;
  let current: Omit<Order, "id"> | null = null;
  let dropping = false; // الأوردر الحالي متشحن — نعدّي صفوف أصنافه كمان

  const pushItem = (r: unknown[]) => {
    const name = wuiltItemName(val(r, iItem));
    if (!name) return;
    const qty = Number(val(r, iQty)) || 1;
    const size = wuiltItemSize(val(r, iSel));
    // نفس صيغة formatItemLine في lib/stock.ts: "Tiger M21 50ml X 2"
    const line = `${name}${size ? " " + size : ""} X ${qty}`;
    if (current) current.items = current.items ? current.items + "\n" + line : line;
  };

  rows.slice(1).forEach((r) => {
    if (!Array.isArray(r)) return;
    const orderId = val(r, iOrderId);

    if (!orderId) {           // صف صنف إضافي للأوردر اللي فوقه
      if (!dropping) pushItem(r);
      return;
    }

    if (/fulfilled/i.test(val(r, iFulfil)) && !/unfulfilled/i.test(val(r, iFulfil))) {
      skipped++; current = null; dropping = true; return;   // متشحن خلاص
    }
    dropping = false;

    const city = mapCity(val(r, iState));
    if (!city) unknown++;
    const pay = val(r, iPay).toLowerCase();
    const isCod = pay.includes("cash") || pay.includes("cod");
    const address = [val(r, iShip), val(r, iLine2), val(r, iArea)]
      .map((s) => (s === "." ? "" : s))
      .filter(Boolean)
      .join(" - ");

    current = {
      source: "Wuilt",
      name: val(r, iName),
      phone: normPhone(val(r, iPhone) || val(r, iShipPhone)),
      address,
      city,
      // Total = المنتجات + الشحن، وده اللي المندوب بيحصّله من العميل
      cod: isCod ? Number(val(r, iTotal).replace(/[^\d.]/g, "")) || 0 : 0,
      items: "",
      vol: "Small",
      notes: val(r, iNotes),
      ref: val(r, iSerial) || orderId,
    };
    out.push(current);
    pushItem(r);
  });

  return { orders: out.filter((o) => o.name || o.phone), unknown, skipped, format: "wuilt" };
}
