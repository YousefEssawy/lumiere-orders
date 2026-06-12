# Lumière Orders

نظام إدارة أوردرات وشحن لـ Lumière — Next.js + Firebase، بيُنشر على GitHub Pages.
الخطة المعمارية الكاملة في [`PLAN.md`](./PLAN.md).

## الصفحات والأدوار

| صفحة | المسار | مين يشوفها |
|---|---|---|
| الأوردرات | `/` | أي مستخدم نشط |
| المستخدمين | `/users` | أدمن بس |
| سجل النشاط | `/logs` | أدمن بس |
| المساعدة | `/help` | أي مستخدم نشط |

- **الأدوار:** `admin` (كل حاجة) و`staff` (أوردرات بس) — محفوظة في collection `users` ومفروضة بالـ Security Rules.
- **التعطيل بدل الحذف:** تعطيل المستخدم بيمنع وصوله فوراً. الحذف النهائي من Firebase Console.
- **اللوجز:** كل عملية بتتسجل في collection `logs` (append-only — ممنوع التعديل/الحذف حتى للأدمن).
- **اللغة:** إنجليزي/عربي (RTL) — زرار في الشريط العلوي، كل النصوص في `src/messages/`.
- **الهوية:** كل الألوان/الفونتات tokens في `src/app/globals.css` + `tailwind.config.ts` — ممنوع hex مباشر في المكونات.

> **مهم:** أي تعديل في `firestore.rules` لازم يتنشر يدوياً من **Firebase Console → Firestore → Rules** (مفيش CI للـ rules).

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # وبعدين حط بيانات Firebase
npm run dev                  # http://localhost:3000
```

## الإعداد لأول مرة

### 1) Firebase
- مشروعك جاهز والـ rules متطبّقة (ملف `firestore.rules`).
- فعّل **Authentication > Email/Password** وأنشئ مستخدم اللوجن بتاعك من **Authentication > Users**.
- انسخ إعدادات الويب من **Project settings** وحطها في `.env.local`.

### 2) الريبو والبرانشات
```bash
git init && git add . && git commit -m "init: lumiere-orders"
git branch -M production
git branch development
git branch testing
git remote add origin https://github.com/YousefEssawy/lumiere-orders.git
git push -u origin production development testing
```
الفلو: تشتغل على `development` ← PR لـ `testing` ← PR لـ `production` (بينشر تلقائي).
يُفضّل تفعيل **branch protection** على `production`.

### 3) الأسرار (GitHub Secrets)
في **Settings > Secrets and variables > Actions** ضيف:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### 4) GitHub Pages
- **Settings > Pages > Source = GitHub Actions**.
- أول push على `production` هيشغّل `deploy.yml` وينشر على `https://YousefEssawy.github.io/lumiere-orders/`.

### 5) Firebase Authorized Domains
- **Authentication > Settings > Authorized domains** → ضيف `yousefessawy.github.io`.

## CI/CD
- `.github/workflows/ci.yml` — فحص (lint + typecheck + build) على push/PR لـ `development`/`testing`.
- `.github/workflows/deploy.yml` — build + deploy لـ Pages على push لـ `production`.

## القواعد الثابتة (في `src/lib/wassalha.ts`)
- الوزن دايماً `500`.
- Reference Number دايماً فاضي في التصدير (وصلها بيرفض رقم سلر).
- التليفون يتحوّل لصيغة محلية (`+20…` → `0…`).
- المحافظات تتحوّل لأسماء وصلها.

## الأوامر
| أمر | وظيفة |
|---|---|
| `npm run dev` | تشغيل محلي |
| `npm run build` | static export في `out/` |
| `npm run lint` | فحص ESLint |
| `npm run typecheck` | فحص TypeScript |
