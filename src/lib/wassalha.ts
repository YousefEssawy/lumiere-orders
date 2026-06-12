// منطق التحويل بين أوردرات سلر وملف وصلها + القواعد الثابتة
import * as XLSX from "xlsx";

export type OrderSource = "Sllr" | "WhatsApp" | "Instagram" | "Other";

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

export function mapCity(raw: unknown): string {
  if (!raw) return "";
  const k = String(raw).trim().toLowerCase();
  if (CITY_MAP[k]) return CITY_MAP[k];
  for (const key in CITY_MAP) {
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

export interface ParseResult { orders: Omit<Order, "id">[]; unknown: number; }

export function parseSllr(arrayBuffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
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
  return { orders: out, unknown };
}
