ROOT CAUSE FIX — GRC Review & Development / Department Manager Requests

Use BOTH files together.

1) Replace your project's firebase.js with this firebase.js.
2) In Firebase Console > Firestore Database > Rules, replace the published rules with this firestore.rules and Publish.
3) Hard refresh the website (Ctrl+F5), sign out, then sign in again.

ROOT CAUSE FOUND:
Your deployed rules are v71 and allow only this probe:
  v71-canonical-exact-request-reads-20260908

The old firebase.js was still checking:
  v69-grc-manager-approval-20260902

That mismatch produced the exact error:
  rules-version-mismatch / Required Firestore GRC manager rules are not active
and blocked Review & Development submission before the request was written.

This firebase.js checks the SAME v71 probe as firestore.rules.
It also uses exact departmentKey queries for Department Manager requests and
keeps advisory_requests as the authoritative source, with the department inbox
as a recovery/index path.

Do not mix this firebase.js with an older firestore.rules file.
