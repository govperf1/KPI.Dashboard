# QUMC GRC Module v1 — Test Checklist

## Super Admin
- [ ] Sign in using a `super_admin` account.
- [ ] The existing portal-selection page appears.
- [ ] Select **GRC**.
- [ ] The GRC Dashboard opens instead of the Coming Soon modal.
- [ ] Dashboard, Governance, Risk, Compliance, Action Plans, Audit and Reports are visible.
- [ ] Add a test risk, policy, requirement, action, committee and audit finding.
- [ ] Refresh the browser and confirm prototype records remain in the same browser.
- [ ] Return to Portal works.
- [ ] Performance still opens normally and its existing features are unchanged.

## All Other Roles
Test Admin, Executive, Department Manager, KPI Owner and Viewer:
- [ ] The GRC card remains visible.
- [ ] Selecting GRC shows **Coming Soon**.
- [ ] The user cannot open the Super Admin GRC interface by calling `QUMCGRC.open()` from the browser console.
- [ ] Return to Portal closes the message correctly.
- [ ] Performance remains accessible based on the existing permissions.

## Important
- Version 1 stores prototype GRC records in local browser storage only.
- It does not write to Firebase or modify KPI state.
- Before production storage is enabled, create dedicated Firestore collections and merge secure GRC rules into the existing ruleset.
