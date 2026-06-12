# ابدأ من هنا 🚀

المشروع متجهّز بالكامل (كود + CI/CD + docs). الخطوات دي تتعمل في **Claude Code** أو في Terminal على ويندوز (git وnpm بيشتغلوا أحسن هناك).

> ⚠️ **أول حاجة:** فيه فولدر `.git` ناقص اتعمل أثناء التجهيز ومقدرتش أكمّله من البيئة هنا (قيود صلاحيات على الـ drive). **امسح فولدر `.git`** الأول قبل ما تبدأ:
> - في PowerShell: `Remove-Item -Recurse -Force .git`
> - أو احذفه يدوياً من File Explorer (فعّل إظهار الملفات المخفية).

## 1) تثبيت وتجربة محلية
```bash
npm install
copy .env.example .env.local      # وبعدين افتح .env.local وحط بيانات Firebase
npm run dev                       # http://localhost:3000
npm run build                     # تأكد إن الـ static export بيشتغل (مجلد out/)
```

## 2) تهيئة git والبرانشات
```bash
git init
git checkout -b production
git add .
git commit -m "init: Lumière Orders — Next.js + Firebase scaffold, CI/CD, docs"
git branch testing
git branch development
git remote add origin https://github.com/YousefEssawy/lumiere-orders.git
git push -u origin production development testing
```

## 3) GitHub Secrets
**Settings > Secrets and variables > Actions** — ضيف الستة دول (القيم من Firebase):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## 4) GitHub Pages
**Settings > Pages > Source = GitHub Actions**. أول push على `production` هينشر تلقائي.

## 5) Firebase
- **Authentication > Settings > Authorized domains** → ضيف `yousefessawy.github.io`.
- اتأكد إن مستخدم اللوجن متعمل في **Authentication > Users**.

---

## الوثائق
- [`PLAN.md`](./PLAN.md) — المعمارية الكاملة.
- [`README.md`](./README.md) — مرجع سريع للإعداد والأوامر.
- [`docs/OVERVIEW.md`](./docs/OVERVIEW.md) — الفكرة والمشكلة والتدفّق.
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — الحقول والقواعد الثابتة وتحويل المحافظات.
- [`docs/WORKFLOW.md`](./docs/WORKFLOW.md) — البرانشات وإضافة فيتشر والنشر.
