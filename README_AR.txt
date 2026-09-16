التعديلات:
1) إصلاح مسار موافقة مدير القسم على advisory_requests ليكون مسار التحديث من الوثيقة المصدر نفسها.
2) إضافة تحقق صارم من تطابق managerDecision مع workflowStage وstatus وclosureReason.
3) حذف تكرار validAdvisoryManagerChange في allow update.
4) تحديث deployment probe إلى v77-manager-decision-state-integrity-20260916 في Firestore Rules وfirebase.js.

الملفات المعدلة فقط:
- firestore.rules
- firebase.js
