Review & Development Manager → Super Admin Fix v77

Root fix:
- Removes brittle manager audit-value equality checks that were causing valid
  Department Manager decisions to receive permission-denied.
- Keeps authorization restricted to an approved Department Manager whose
  canonical department matches the request.
- Keeps the allowed transition strict:
  pending_department_manager -> pending_super_admin (approved)
  pending_department_manager -> returned_requester (returned)
  pending_department_manager -> rejected_manager (rejected)

Deploy firestore.rules, then replace js/firebase.js with the included file.
