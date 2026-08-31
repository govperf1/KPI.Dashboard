# GRC Cleanup — Canonical Files

## Active GRC files
- js/firebase.js
- js/grc.js
- js/advisory.js
- js/grc-risk-workflow.js
- firestore.rules
- index.html

## Removed obsolete duplicate/backup files
- firebase-workflow-v60-fixed.js
- firebase-workflow-v64-fixed.js
- grc-superadmin-firestore-fixed.js
- advisory-close-workflow-fixed.js
- js/advisory(9).js
- js/advisory-v216-close-response.js
- js/grc-risk-workflow(9).js
- js/grc-risk-workflow-v216.js
- js/grc-v216-authoritative-registers.js

The root firebase.js, grc.js, and advisory.js files were NOT deleted; they were replaced with the same canonical versions used by index.html. This prevents an older/stale HTML reference from loading the old v60 code.

IMPORTANT:
Publish firestore.rules in Firebase Console before testing. The current client treats the rules probe as diagnostic/non-blocking, but Firestore itself still enforces the deployed rules.
