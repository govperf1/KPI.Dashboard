# وحدة GRC لمنصة QUMC — الإصدار التجريبي الأول

## ماذا تنفذ هذه الملفات؟

- يظهر قسم **GRC كاملًا** لحساب `super_admin` فقط.
- تظهر لجميع الصلاحيات الأخرى شاشة **Coming Soon**.
- يبقى قسم Performance ونظام KPI الحالي بدون تغيير.
- تشمل واجهة السوبر أدمن:
  - GRC Dashboard
  - Policies & Procedures
  - Committees & Decisions
  - Risk Register
  - Risk Heat Map
  - Key Risk Indicators
  - Compliance Register
  - Action Plans
  - Audit & Findings
  - Reports & Analytics

## الملفات

- `css/grc.css`: تصميم واجهة GRC وصفحة Coming Soon.
- `js/grc.js`: التحقق من الصلاحية، فتح الواجهة، التنقل، النماذج التجريبية والتقارير.
- `integration-snippet.html`: السطران المطلوبان لإضافة الملفات إلى `index.html`.
- `firestore-grc-rules-snippet.txt`: نموذج اختياري لقواعد Firestore المستقبلية، ولا يُستخدم كبديل كامل للقواعد الحالية.
- `TEST_CHECKLIST_GRC.md`: خطوات الاختبار بعد الرفع.
- `demo.html`: معاينة مستقلة للتصميم.

## طريقة التركيب

1. انسخي `grc.css` إلى مجلد `css` في المشروع.
2. انسخي `grc.js` إلى مجلد `js` في المشروع.
3. افتحي `index.html` وأضيفي داخل `<head>`:

```html
<link rel="stylesheet" href="css/grc.css?v=20260705-grc-v1">
```

4. في نهاية `index.html` وبعد جميع ملفات JavaScript الحالية أضيفي:

```html
<script src="js/grc.js?v=20260705-grc-v1"></script>
```

5. ارفعي الملفات إلى GitHub Pages ثم نفذي قائمة الاختبار.

## آلية الصلاحية

الملف يقرأ الدور الحالي من `window._fbRole`، وهو نفس المتغير المستخدم في المشروع الحالي:

- `super_admin`: يفتح واجهة GRC.
- أي دور آخر: تظهر شاشة Coming Soon.

حتى عند استدعاء الواجهة مباشرة من Console، يتم تنفيذ فحص الصلاحية مرة أخرى.

## ملاحظة مهمة عن البيانات

هذه النسخة **واجهة تجريبية**. أي سجل يتم إدخاله في GRC يحفظ في `localStorage` داخل المتصفح فقط ولا يرسل إلى Firestore، لذلك لا يؤثر على بيانات KPI الحالية.

عند اعتماد تصميم GRC وحقوله، تكون المرحلة التالية إنشاء مجموعات Firestore مستقلة وربط كل نموذج بها مع قواعد صلاحيات خاصة بالسوبر أدمن.
