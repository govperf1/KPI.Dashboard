v366 — إصلاح ظهور الطلبات وتفاصيل Review & Development

الملفات المعدلة فقط:
- index.html: تحديث cache-buster إلى v366.
- js/firebase.js: جلب تاريخ Review & Development كاملًا بدمج email + UID + السجلات القديمة المتوافقة، ودعم تاريخ القسم لمدير القسم.
- js/advisory.js: لا تغيير وظيفي؛ أُدرجت النسخة الحالية لتثبيت التوافق مع firebase.js.
- js/grc-risk-workflow.js: عرض جميع طلبات القسم Risk & Incident وReview & Development مع الحالة، مع إبقاء أزرار الإجراء فقط للطلبات التي تحتاج قرار مدير القسم.
- firestore.rules: السماح بقراءة طلب Review & Development للمالك باستخدام email غير حساس لحالة الأحرف، وإضافة مسارات UID والتاريخ القديم الآمنة.

بعد الرفع:
1) Publish firestore.rules.
2) ارفع index.html وملفات js الثلاثة إلى نفس المسارات.
3) Hard Reload: Ctrl+Shift+R.
4) تأكد أن الروابط تظهر v366.
