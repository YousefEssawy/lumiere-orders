# سير العمل (Workflow)

## البرانشات

```
development   ← الشغل اليومي والفيتشرز الجديدة
   │ PR
testing       ← فحص واختبار
   │ PR
production    ← لايف على GitHub Pages (نشر تلقائي)
```

- شغل دايماً على `development`.
- مفيش push مباشر على `production` (يُفضّل تفعيل branch protection).
- النشر بيحصل تلقائي بس لما يوصل كود لـ `production`.

## تشغيل محلي

```bash
npm install
cp .env.example .env.local   # حط بيانات Firebase
npm run dev                  # http://localhost:3000
```

## إضافة فيتشر جديدة (في Claude Code لاحقاً)

```bash
git checkout development
git pull
# … الشغل والتعديلات …
npm run lint && npm run typecheck && npm run build   # تأكد قبل الـ commit
git add . && git commit -m "feat: وصف الفيتشر"
git push origin development
```
بعدين PR: `development` → `testing` → `production`.

## النشر

أول ما يتعمل push/merge على `production`:
1. GitHub Actions (`deploy.yml`) بيشتغل.
2. بيبني static export بإعدادات Firebase من الـ Secrets.
3. بينشر على `https://YousefEssawy.github.io/lumiere-orders/`.

تقدر تتابع التقدّم من تبويب **Actions** في الريبو.

## فين كل حاجة

| محتاج تعدّل في… | روح لـ |
|---|---|
| منطق التحويل/القواعد | `src/lib/wassalha.ts` |
| الاتصال بـ Firebase | `src/lib/firebase.ts` |
| الواجهة/المكوّنات | `src/components/` |
| الصفحة الرئيسية | `src/app/page.tsx` |
| الستايل/الهوية | `src/app/globals.css` |
| قواعد الأمان | `firestore.rules` (وتطبّقها في Firebase Console) |
| الـ CI/CD | `.github/workflows/` |

## أفكار فيتشرز جاية

- عرض صور المنتجات في الجدول (من repo `lumiere-perfume-images`).
- لوحة إحصائيات (مبيعات، أكتر منتج، أكتر محافظة).
- تتبع حالة الشحنة.
- بحث وفلترة في الجدول.
- تعديل أوردر inline (خصوصاً تظبيط المحافظات المجهولة).
