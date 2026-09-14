# Root-cause fix v347

Evidence from the browser console and Firebase screenshots showed a deployment/version mismatch: the browser was loading firebase.js build v344 while the supplied project index references newer workflow code, and the Firebase Rules editor showed v73 while this project contains newer rules.

The manager profile is valid (department_manager, Project_Management -> canonical projects), and requests/queue data exist. The failure was authorization of the live inbox and manager update.

Fixes:
1. Rules v75: manager decision authorization now uses the authoritative advisory_requests canonical department directly. It no longer depends on exists() for the queue projection.
2. Rules v75: inbox GET and LIST are explicit independent branches for Firestore listeners.
3. Client v347: removes the manager-action source GET preflight that could produce permission-denied before the authorized UPDATE. Rules validate stage and department atomically.
4. Cache-bust: index now loads firebase.js with a new v347 query string and build marker.

Deploy firestore.rules from this project to the same Firebase project qumc-kpi-dashboard-f10dd, then deploy the updated web files. Hard refresh after deployment.
