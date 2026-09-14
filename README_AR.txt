الإصلاح النهائي لمسار الطلبات — v345

تم التعديل على ملفين فقط:
1) js/firebase.js
2) firestore.rules

الجذر الذي تم إصلاحه:
- طلبات Review & Development كانت تظهر لمدير القسم من grc_department_approval_inbox_v3، لكن زر Approve/Return/Reject كان يحدث المصدر advisory_requests مباشرة. بعض الطلبات القديمة تحتوي departmentKey بصيغة مختلفة، لذلك كان التحديث يُرفض permission-denied رغم أن الطلب ظهر في صندوق المدير.
- بعد قرار المدير كان عنصر الـ inbox قد يبقى Pending بنسخة قديمة، فيظهر الطلب وكأنه لم يتحرك.
- طلبات Risk/Incident كانت تنفذ قراءة مسبقة من المصدر قبل التحديث؛ هذه القراءة كانت تفشل permission-denied رغم وجود الطلب في صندوق المدير.
- كان يوجد listener إضافي لسجل مصدر Risk يسبب permission-denied ورسائل console غير لازمة.

الإصلاح:
- قواعد Firestore أصبحت تسمح بقرار مدير القسم عندما يطابق القسم في المصدر أو عندما يوجد تعيين رسمي للطلب في inbox_v3 لنفس القسم والمدير.
- بعد نجاح قرار Review & Development يتم تنظيف عنصر Pending من صندوق المدير بدون التأثير على المصدر أو Super Admin.
- Risk/Incident يقرأ أولاً عنصر inbox المصرح به ثم يحدث المصدر؛ لم تعد قراءة المصدر المسبقة شرطاً لتنفيذ القرار.
- تم حذف listener المصدر الاختياري الذي كان يولد permission-denied ولا يلزم لمسار المدير.
- تم دعم الحساب الذي قدم الطلب قبل أن يصبح Department Manager، بدون السماح لمدير القسم باعتماد طلب أنشأه أصلاً بصفة Department Manager.

مهم جداً:
ارفع firestore.rules كاملاً إلى Firebase Firestore Rules ثم Publish.
بعدها استبدل js/firebase.js في المشروع وارفعه.
ثم Hard Refresh: Ctrl+Shift+R أو افتح الموقع في نافذة خاصة.

النتيجة المطلوبة للاختبار:
User -> Department Manager Pending
Department Manager Approve -> Pending Super Admin
Super Admin -> يرى الطلب ويعتمد/يرفض/يعيد
Department Manager Return -> Returned to Requester
Requester Resubmit -> Pending Department Manager
Department Manager Reject -> Closed / Rejected by Department Manager
