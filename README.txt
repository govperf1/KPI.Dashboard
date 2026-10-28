QUMC GRC - Department Manager Risk & Incident Request History patch

Replace only:
  KPI.Dashboard-main/js/grc-risk-workflow.js

This patch:
- Renames the Department Manager profile menu item to Risk & Incident Request History.
- Provides a bilingual, read-only history page for Risk/Incident register requests.
- Fixes history filtering: full-history records are not required to carry the pending-approval-only _managerAssigned flag.
- Shows requester, request code, operation, register/record ID, status, submitted/updated dates, proposed/changed values, and approval history.
- Refreshes the manager's history automatically every 5 seconds when the optional live-broker function is not present.
- Adds no manager action buttons and does not modify Firebase rules or request submission/action logic.

After replacing the file, update the existing script version query in KPI.Dashboard-main/index.html from:
  js/grc-risk-workflow.js?v=20261027-manager-readonly-v402
To:
  js/grc-risk-workflow.js?v=20261028-manager-history-readonly-v403

Only change that script version string in index.html; do not replace index.html with a different copy.
