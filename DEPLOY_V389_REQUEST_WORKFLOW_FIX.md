# QUMC GRC Request Workflow — v389 Root-Cause Fix

## Firebase project
`qumc-kpi-dashboard-f10dd`

## Root causes fixed

1. **Same email used for multiple test roles**
   - Request ownership is now persisted by `Firebase UID + active portal role`.
   - A request created as GRC Owner is separate from one created as Department Manager even when the Firebase email is identical.
   - Department Manager approval is blocked only for requests created while that same UID was actually operating as Department Manager.

2. **My Requests / Review & Development rows appearing then disappearing**
   - Added `request_history/{uid}/{role}/{entryId}` as a canonical, role-isolated request-history index.
   - Every new GRC, Performance, Review & Development, and Risk/Incident request writes an index entry.
   - My Requests and requester listeners read the index first, then fetch the authoritative source document.
   - This prevents a transient/legacy collection-query permission failure from replacing valid history with an empty table.

3. **Department Manager queue permission noise**
   - Manager live queue now listens to the department approval inbox projection only.
   - Review & Development queue rows remain as history after a manager decision instead of being deleted.
   - The queue snapshot remains the manager's routing/history projection.

4. **Risk & Incident manager actions failing**
   - `managerActionAtIso` was missing from the Firestore Rules allowed update fields while the client was writing it.
   - This caused Approve / Return / Reject to be rejected by Firestore.
   - The rule now explicitly permits that field while keeping the transition/state restrictions intact.

5. **Risk & Incident requester history**
   - Requester history is now role-scoped by UID + role instead of department-wide history.
   - Department Manager still receives department-wide approval history through the manager queue.
   - Risk/Incident request details and approval history remain available after closure/publication.

6. **Requester rating**
   - Risk/Incident terminal requests now support requester rating.
   - Existing GRC system and Review & Development rating behavior remains supported.

7. **Server-profile authority**
   - GRC and Performance request submission now refreshes the Firestore profile before stamping role/department/scope.
   - This is important when the same Auth account is reused while testing different roles.

## Files changed

- `firestore.rules`
- `js/firebase.js`
- `js/advisory.js`
- `js/grc-risk-workflow.js`
- `css/grc-risk-workflow.css`
- `index.html`

## Deployment order

1. Deploy `firestore.rules` to **qumc-kpi-dashboard-f10dd**.
2. Deploy the web files from this v389 build.
3. Hard refresh the browser (`Ctrl + Shift + R`).
4. Sign in with the test email as **GRC Owner** and create a Review/Record request.
5. Change the same Firestore user profile to **Department Manager / Project_Management** and reload the portal.
6. Verify:
   - Review & Development request appears in the requester table under the original GRC Owner scope.
   - Department Manager receives the request in the Review approval area.
   - Risk/Incident request appears in the requester history.
   - Department Manager can Approve, Return, or Reject Risk/Incident requests.
   - Requests remain in history after action.
   - Closed requests can be rated by the original requester.

## Existing request history

On Super Admin login, v389 automatically rebuilds the role-isolated `request_history` index from the four authoritative request collections. This is a one-time migration/backfill and does not delete or modify the request source records.
