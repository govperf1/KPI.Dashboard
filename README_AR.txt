GRC Manager Request Visibility Fix v416

الملفات المعدلة فقط:
- index.html: تحديث cache-busting لملفات GRC.
- js/firebase.js: إزالة إخفاء طلبات GRC بناءً على تطابق البريد الإلكتروني وحده. تتم الآن مقارنة UID + role، بحيث لا يختفي طلب أرسله GRC Owner لمجرد أن حساب الاختبار يستخدم البريد نفسه عند الدخول بدور Department Manager.

لم يتم تعديل Firestore rules أو مسار الاعتماد أو صلاحيات تعديل السجلات.

بعد الاستبدال والنشر، نفّذ Ctrl+Shift+R واختبر حساب Department Manager. إذا استمرت المشكلة، أرسل سجل Console بعد تسجيل دخول المدير؛ قد تكون هناك مشكلة مستقلة في قواعد Firestore المنشورة.
