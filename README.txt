TARGETED FIX ONLY

Updated: firestore.rules

Fixes Department Manager Review & Development decisions (Approve / Return / Reject)
being denied when the manager profile email/display identity does not exactly match
the normalized auth email. Authorization remains restricted by the existing approved
Department Manager + department ownership checks and exact workflow transitions.

No other application files were changed.
