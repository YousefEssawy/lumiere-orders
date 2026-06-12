# Lumière Orders — خطة المعمارية والتشغيل

نظام إدارة أوردرات وشحن لـ Lumière. Next.js (App Router + TypeScript) بيشتغل أونلاين، بيكلّم Firebase مباشرة من المتصفح، بيُنشر على GitHub Pages عبر static export، مع CI/CD على GitHub Actions و3 بيئات.

---

## 1) المكدّس (Stack)

| الطبقة | الاختيار | السبب |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | قابل للتوسع، نفس نمط مشاريعك |
| التصميم | CSS عادي (globals.css) بهوية لوميير | أقل تعقيد، مفيش build إضافي |
| المصادقة | Firebase Auth (Email/Password) | لوجن، أنت تنشئ المستخدمين يدوياً |
| قاعدة البيانات | Firestore (مشروع واحد) | متزامن، real-time |
| الإخراج | static export (`output: 'export'`) | يشتغل على GitHub Pages |
| الاستضافة | GitHub Pages | مجاني، نفس نمط SubTracker |
| CI/CD | GitHub Actions | فحص + نشر تلقائي عند البوش |
| صور المنتجات | repo `YousefEssawy/lumiere-perfume-images` | موجود، نستخدم raw URLs |

> **ليه static export يكفي؟** التطبيق client-side بالكامل ويكلّم Firebase من المتصفح مباشرة — مفيش حاجة محتاجة سيرفر. لو في المستقبل احتجت API routes أو SSR حقيقي، ساعتها ننقل لـ Vercel أو Firebase Hosting.

---

## 2) استراتيجية البرانشات (Git Flow)

ثلاث برانشات دائمة:

```
development   ← الشغل اليومي والتجارب
   │ PR
testing       ← فحص واختبار قبل الإنتاج
   │ PR
production    ← اللي بيتنشر لايف على GitHub Pages
```

- تشتغل وتعمل push على `development`.
- لما تستقر، تعمل PR من `development` إلى `testing`.
- بعد ما تتأكد، PR من `testing` إلى `production` → النشر يحصل تلقائي.
- `production` محمي (branch protection): مفيش push مباشر، عن طريق PR بس.

> **ملاحظة GitHub Pages:** الـ repo بينشر موقع واحد بس (من `production`). برانشات `development`/`testing` الـ CI بيعمل لها build + فحص عند كل push عشان يمسك الأخطاء بدري، من غير نشر عام. لو حبيت dev/test يكونوا لايف، نعمل repos منفصلة أو ننقل لـ Vercel (preview لكل برانش مجاناً).

---

## 3) إدارة الأسرار والإعدادات (مش في الريبو)

إعدادات Firebase **مش هتترفع على الريبو** نهائياً:

- محلياً: ملف `.env.local` (مدرَج في `.gitignore`) فيه القيم.
- في CI/CD: القيم تتخزّن في **GitHub → Settings → Secrets and variables → Actions**، وتتحقن وقت الـ build كـ env vars.
- ملف `.env.example` (مرفوع في الريبو) فيه أسماء المتغيرات بس من غير قيم، كمرجع.

متغيرات Firebase (كلها بادئة `NEXT_PUBLIC_` لأنها بتُستخدم في المتصفح):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

> **مهم تفهمه:** إعدادات Firebase للويب مش "سر" حقيقي — أي تطبيق ويب بيكشفها في المتصفح بطبيعته. الأمان الفعلي بييجي من **Firestore Security Rules + Auth** (ملف `firestore.rules`)، مش من إخفاء الـ config. إحنا بنخرّجها من الريبو زي ما طلبت (نظافة وممارسة سليمة)، بس ده مش بديل عن القواعد.

---

## 4) بنية الملفات

```
lumiere-orders/
├─ .github/workflows/
│  ├─ deploy.yml          # push على production → build + deploy لـ Pages
│  └─ ci.yml              # push/PR على development|testing → فحص (lint, typecheck, build)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx       # الـ root layout (RTL, خط Cairo)
│  │  ├─ page.tsx         # الداشبورد (محمي باللوجن)
│  │  └─ globals.css      # هوية لوميير
│  ├─ components/
│  │  ├─ Login.tsx
│  │  ├─ OrderForm.tsx
│  │  ├─ SllrImport.tsx
│  │  ├─ OrdersTable.tsx
│  │  └─ Toast.tsx
│  ├─ hooks/
│  │  ├─ useAuth.ts
│  │  └─ useOrders.ts
│  └─ lib/
│     ├─ firebase.ts      # تهيئة Firebase من env
│     └─ wassalha.ts      # تحويل المدن/الأرقام، استيراد سلر، تصدير وصلها
├─ .env.example
├─ .gitignore
├─ firestore.rules
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 5) القواعد الثابتة (Business Rules)

محفوظة في `src/lib/wassalha.ts`:

- **الوزن:** دايماً `500` في ملف التصدير.
- **Reference Number:** دايماً فاضي (وصلها بيرفض رقم سلر بـ "Invalid Reference Number"). الرقم بيتخزّن داخلياً للمتابعة بس.
- **التليفون:** أي رقم يتحوّل للصيغة المحلية (`+201117613389` → `01117613389`).
- **المحافظة:** تتحوّل لأسماء وصلها (مثلاً Sohag → SOUHAGE).
- **COD:** = مبلغ الأوردر لو Cash on Delivery، وإلا `0`.
- **Merchant_Name = Lumiere، Warehouse_Name = Home.**

---

## 6) خطوات التشغيل (ملخص — التفاصيل في README.md)

1. `npm install` ثم `npm run dev` للتجربة محلياً.
2. حط بيانات Firebase في `.env.local`.
3. اعمل الريبو، ضيف الـ Secrets، اعمل البرانشات الثلاثة.
4. فعّل GitHub Pages (Source: GitHub Actions).
5. ضيف دومين `*.github.io` في Firebase Authorized Domains.
6. اعمل push → الـ Actions ينشر.

---

## 7) خطوات مستقبلية (مش دلوقتي)

- ربط تتبع شحنات البريد المصري (لو فيه API).
- لوحة إحصائيات (مبيعات/أكثر المنتجات طلباً).
- عرض صور المنتجات من repo الصور جوه الجدول.
- متعدد المستخدمين بأدوار (admin/staff) لو الفريق كبر.
