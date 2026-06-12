# نموذج البيانات والقواعد

## Firestore

مجموعة واحدة: **`orders`**. كل مستند = أوردر.

| الحقل | النوع | الوصف |
|---|---|---|
| `source` | string | `Sllr` / `WhatsApp` / `Instagram` / `Other` |
| `name` | string | اسم العميل |
| `phone` | string | تليفون بصيغة محلية (`01…`) |
| `address` | string | العنوان المجمّع |
| `city` | string | اسم المحافظة بصيغة وصلها (أو `""` لو مش معروفة) |
| `cod` | number | قيمة التحصيل |
| `items` | string | المنتجات (سطر لكل منتج) |
| `vol` | string | حجم الطرد: `Small` / `medium` / `Large` |
| `notes` | string | ملاحظات للشحن |
| `ref` | string | رقم مرجعي داخلي (مابيتصدّرش لوصلها) |
| `createdAt` | timestamp | وقت الإضافة (serverTimestamp) |

التعريف الرسمي في [`../src/lib/wassalha.ts`](../src/lib/wassalha.ts) (نوع `Order`).

## القواعد الثابتة (Business Rules)

> ⚠️ القواعد دي اتحطّت بعد تجارب فعلية على وصلها — متغيّرهاش من غير سبب.

1. **الوزن** = `500` دايماً في ملف التصدير.
2. **Reference Number** = فاضي دايماً في التصدير. وصلها بيرفض رقم سلر بـ "Invalid Reference Number". الرقم بيتخزّن في `ref` للمتابعة الداخلية بس.
3. **التليفون**: أي صيغة تتحوّل لمحلية — `+201117613389` → `01117613389` (يشيل `+20` ويضيف `0`).
4. **COD** = مبلغ الأوردر لو الدفع Cash on Delivery، وإلا `0`.
5. **ثابت:** `Merchant_Name = Lumiere`، `Warehouse_Name = Home`، `Package_volume = Small` افتراضي.

## تحويل المحافظات

سلر بيكتب أسماء إنجليزي/عربي مختلفة عن وصلها. الـ `mapCity()` بتطابق:

| سلر (أمثلة) | وصلها |
|---|---|
| Giza / الجيزة | GIZA |
| Sohag / سوهاج | SOUHAGE |
| Luxor / الأقصر | LOUXOR |
| Beheira | BEHIRA |
| Port Said / بورسعيد | PORT SAID |
| … | … |

القايمة الكاملة (27 محافظة) والـ mapping في `CITY_MAP` داخل [`../src/lib/wassalha.ts`](../src/lib/wassalha.ts). أي محافظة مش متعرّفة بتظهر في الجدول بعلامة ⚠ عشان تظبطها يدوياً قبل التصدير.

## تحويل العنوان

من ملف سلر، العنوان بيتجمّع من: `Address Details` + `Area` + `Building` + `Floor` + `Apartment` + `Landmark` — مع تجاهل القيم الفاضية أو `.` (placeholder بتاع سلر).

## أعمدة ملف وصلها (التصدير)

`Package_Serial, Description, Total_Weight, Package_volume, COD_Value, Item_Special_Notes, Customer_Name, Mobile_No, Street, City, Package_Ref. Number, Merchant_Name, Warehouse_Name, HasPOD, SellerName, Post_Id`
