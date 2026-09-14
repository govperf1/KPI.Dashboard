GRC ROOT-CAUSE FIX v78

Replace these exact project files:
- firestore.rules
- js/firebase.js
- js/grc-risk-workflow.js
- index.html

Then publish Firestore Rules and hard refresh the browser.

Fixes:
1. Department Manager -> Approve to Super Admin now accepts all authoritative routing forms for existing requests: departmentKey, department, departmentRaw, or canonical inbox assignment.
2. Manager update no longer fails solely because an old request lacks one normalized routing field.
3. Risk & Incident Register Requests profile now loads complete department history from the authoritative collection, not only the pending inbox.
4. Processed Risk/Incident requests remain visible: pending, returned, rejected, pending Super Admin, approved/published, cancelled.
5. Review & Development department history is also loaded separately from the active approval queue.
6. Active inbox remains pending-only for notifications, while the profile is permanent history.
7. Script cache versions were changed so browsers load the new JS instead of an old cached copy.
