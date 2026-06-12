"use client";
import { useState, type FormEvent } from "react";
import { WASSALHA_CITIES, normPhone, type Order, type OrderSource } from "@/lib/wassalha";

type FormState = Omit<Order, "id" | "createdAt">;
const INIT: FormState = {
  source: "WhatsApp", name: "", phone: "", address: "", city: "",
  cod: "", items: "", vol: "Small", notes: "", ref: "",
};

export default function OrderForm({ onAdd }: { onAdd: (o: Omit<Order, "id" | "createdAt">) => void }) {
  const [f, setF] = useState<FormState>(INIT);
  const up = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setF((o) => ({ ...o, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd({
      source: f.source as OrderSource,
      name: f.name.trim(),
      phone: normPhone(f.phone),
      address: f.address.trim(),
      city: f.city,
      cod: f.cod,
      items: f.items.trim(),
      vol: f.vol,
      notes: f.notes.trim(),
      ref: f.ref.trim(),
    });
    setF(INIT);
  }

  return (
    <div className="card">
      <h2>➕ إضافة أوردر يدوي</h2>
      <div className="sub">لأوردرات الواتساب والإنستجرام أو أي طلب بره الموقع</div>
      <form onSubmit={submit}>
        <label>اسم العميل <span className="req">*</span></label>
        <input value={f.name} onChange={up("name")} required placeholder="مثال: سارة محمد" />
        <div className="row2">
          <div>
            <label>رقم الموبايل <span className="req">*</span></label>
            <input value={f.phone} onChange={up("phone")} required placeholder="01xxxxxxxxx" />
          </div>
          <div>
            <label>المصدر</label>
            <select value={f.source} onChange={up("source")}>
              <option value="WhatsApp">واتساب</option>
              <option value="Instagram">إنستجرام</option>
              <option value="Other">أخرى</option>
            </select>
          </div>
        </div>
        <label>العنوان بالتفصيل <span className="req">*</span></label>
        <textarea value={f.address} onChange={up("address")} required placeholder="الشارع، المنطقة، رقم العمارة، الدور، الشقة، علامة مميزة" />
        <div className="row2">
          <div>
            <label>المحافظة <span className="req">*</span></label>
            <select value={f.city} onChange={up("city")} required>
              <option value="">— اختر —</option>
              {WASSALHA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>قيمة التحصيل COD (جنيه) <span className="req">*</span></label>
            <input type="number" min="0" value={f.cod} onChange={up("cod")} required placeholder="470" />
          </div>
        </div>
        <label>المنتجات <span className="req">*</span></label>
        <textarea value={f.items} onChange={up("items")} required placeholder={"مثال: Creamy Gold U07 X 1\nLattea W13 X 1"} />
        <div className="row2">
          <div>
            <label>حجم الطرد</label>
            <select value={f.vol} onChange={up("vol")}>
              <option>Small</option><option>medium</option><option>Large</option>
            </select>
          </div>
          <div>
            <label>ملاحظات للشحن</label>
            <input value={f.notes} onChange={up("notes")} placeholder="اختياري" />
          </div>
        </div>
        <label>رقم مرجعي للطلب (داخلي)</label>
        <input value={f.ref} onChange={up("ref")} placeholder="اختياري — للمتابعة عندك بس" />
        <button className="btn btn-gold" type="submit">أضف الأوردر للقائمة</button>
      </form>
    </div>
  );
}
