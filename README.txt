GRC Root Cause Fix v79

Fixes:
1. Department Manager -> Super Admin Review & Development update authorization simplified to authoritative profile + source department + exact transition; queue and audit metadata no longer block the write.
2. Risk & Incident Profile is permanent history for Super Admin, not pending queue only.
3. GRC/Risk/Platform owners load own history through exact email + UID queries, merged by document ID.
4. Manager department history remains unchanged and complete.
Deploy firestore.rules and replace both JS files.
