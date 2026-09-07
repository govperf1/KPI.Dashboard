PRE-LAUNCH REQUEST CLEANUP + DUPLICATE REQUEST FIX

الملفات المعدلة:
1) js/firebase.js
2) firestore.rules

بعد استبدال الملفات:
1) ارفعي js/firebase.js للمشروع.
2) انشري firestore.rules في Firebase Console > Firestore Database > Rules > Publish.
3) سجلي الدخول بحساب Super Admin.
4) افتحي الموقع ثم Console واكتبي هذا الأمر مرة واحدة:
   await window._grcPreLaunchCleanupRequests()
5) انتظري ظهور النتيجة ثم حدّثي الصفحة.

سيتم حذف الطلبات فقط:
- advisory_requests (Review & Development)
- advisory_public
- advisory_attachments
- grc_risk_requests (Risk & Incident requests)
- Review & Development fallback rows فقط من kpi_requests
- Department Approval Inbox review/risk
- كاش الطلبات المحلي في المتصفح

لن يتم حذف:
- Risk Register records
- Incident Register records
- Policies / Plans / Forms / Codes / Initiatives
- Users / Roles
- KPI data
- Request counters
- Audit logs

Duplicate behavior:
إذا كان نفس الطلب ما زال Pending/Open في نفس workflow، لن يتم إنشاء طلب جديد.
بدلاً من Request failed تظهر رسالة أن هناك طلب مشابه موجود بالفعل.
