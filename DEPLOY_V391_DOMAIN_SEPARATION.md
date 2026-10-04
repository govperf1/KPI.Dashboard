# v391 — Domain-separated request routing

- My Requests reads only `grc_requests` by `requesterScopeKey` (Firebase UID + active role).
- Review & Development stays in `advisory_requests` / Review & Development Center.
- Risk & Incident and register requests never enter My Requests.
- The same Auth email can be tested under different roles without mixing requester histories.
- GRC request submission resolves the active role from the server-side `users/{email}` profile before writing.
- GRC and Review & Development ratings are available only after Closed. Other register requests are not rated.
- Legacy `request_history` rules remain only for compatibility; v391 does not read/write that collection.
- Cache-busting version is `20261004-domain-separated-v391`.
