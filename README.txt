TARGETED FIX ONLY — GRC Owner Risk/Incident Edit & Resubmit

Fixes only the Firestore permission check for a requester-owned Risk/Incident
request that is already in status: returned_requester.

No other workflow routing or permissions were changed.

The fix allows the returned GRC Owner request to update proposedRecord and
resubmit to pending_manager even when legacy returnFields are empty or contain
UI labels that do not match Firestore field keys.
