GRC REVIEW & DEVELOPMENT — ROOT CAUSE FIX

Confirmed from the uploaded KPI.Dashboard-main (85).zip, the active Firestore rules v73,
and the Firestore records/screenshots:

1) The Department Manager account ajory2420@gmail.com / Jory Alsuhaibani is mapped to
   departmentKey=projects.

2) The source request DEV-REQ-PRJ-2026-009 is correctly stored with:
   requesterRole = department_manager
   requiresManagerApproval = false
   managerDecision = not_required
   workflowStage = pending_super_admin

3) The old Department Approval Requests UI was still reading a stale inbox_v3 snapshot
   for the request. It displayed it as pending Department Manager approval and attempted
   a manager update.

4) Firestore Rules correctly rejected that update because a Department Manager decision
   is only valid while the authoritative source request has:
   workflowStage = pending_department_manager.

5) A redundant own-email listener/query was also opened for Department Manager sessions.
   The Department Manager already has an authorized department-scoped query, but the
   redundant listener produced repeated permission-denied errors and noisy fallbacks.

FIX IN THIS firebase.js:
- Department Manager My Requests uses the authorized exact departmentKey query, then
  filters to the manager's own email.
- Removes redundant Department Manager own-email live listener.
- Keeps the authorized department listener and includes the manager's own rows locally.
- Drops stale manager inbox snapshots when requesterRole=department_manager.
- Drops stale manager inbox snapshots when requiresManagerApproval=false.
- Applies the stale-inbox protection to both normal queue reads and live queue broker.

No Firestore Rules were loosened. The existing v73 rule that rejects a manager action
on a pending_super_admin request is correct and remains protected.
