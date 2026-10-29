إصلاح ظهور Responsible Department لجميع المستخدمين — v420

الملفات المعدلة فقط:
- index.html
- js/grc.js

سبب الإصلاح:
التعيين مسؤول القسم محسوب في js/grc.js من رقم الـ Standard والاستثناءات المحددة، وليس تعديلًا خاصًا بحساب Super Admin. اختلاف العرض بين الحسابات يرجّح تحميل نسخة قديمة مخزنة من grc.js. تم تحديث رقم إصدار الملف في index.html لإجبار المتصفحات على طلب النسخة الجديدة.

طريقة التطبيق:
1. ارفع index.html و js/grc.js إلى نفس مساراتهما الحالية في الاستضافة، واستبدل الملفين فقط.
2. لا تستبدل أي ملفات أخرى ولا تغيّر Firestore Rules لهذا الإصلاح.
3. افتح الصفحة عند مستخدم عادي باستخدام Ctrl+Shift+R، ثم سجّل الخروج والدخول إن لزم.
4. تأكد من ظهور Responsible Department في CBAHI FMS Division Assessment.

المسميات المضمنة:
FMS؛ Safety Department؛ Maintenance Department؛ Housekeeping Department؛ Biomedical Department؛ Security Department؛ Radiology Safety Department؛ والاستثناءات المشتركة كما حددها المستخدم.
