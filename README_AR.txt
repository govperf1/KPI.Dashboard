GRC v188
========
الملفات المعدلة فقط:
- index.html
- firestore.rules
- js/firebase.js
- js/grc.js
- js/advisory.js

بعد استبدال الملفات:
1) انشر firestore.rules من Firebase Console. النسخة المطلوبة تحمل probe:
   v34-grc-canonical-sync-owner-20260817
2) Ctrl + F5
3) سجل دخول بحساب Super Admin وافتح GRC مرة واحدة حتى يكتمل canonical_register_catalog_v188.
4) بعدها اختبر GRC Owner / Department user لقسم Projects.
