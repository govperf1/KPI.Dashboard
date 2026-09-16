الإصلاح v362 — الملفات المعدلة فقط

1) js/firebase.js
- توحيد managerEmail قبل إرسال قرار مدير القسم إلى Firestore.

2) firestore.rules
- السماح بمطابقة بريد المدير بعد التطبيع lowercase مع بريد الحساب المصادق عليه.
- التعديل محصور في مسار قرار Department Manager ولا يغيّر بقية الـ workflow.

بعد الرفع: انشر firestore.rules ثم اعمل Hard Refresh (Ctrl+Shift+R).
