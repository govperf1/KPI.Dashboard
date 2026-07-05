# Patch Notes — QUMC GRC Module v1

## Confirmed current runtime path

The existing portal selection uses the global function:

```javascript
window._selectPortal(portal)
```

The current GRC branch displays a Coming Soon modal for every role. This module is loaded last and wraps only the `grc` selection:

- `super_admin` → opens the new GRC prototype.
- all other roles → opens the new Coming Soon screen.
- `performance` and every other portal value → continues to the original handler unchanged.

## Files changed in the existing project

No existing JavaScript file needs to be overwritten for this version. Add only:

- `css/grc.css`
- `js/grc.js`
- two references in `index.html`

## Production limitation

The current version deliberately does not write GRC data to Firestore. This protects the existing KPI state while the GRC fields and workflows are reviewed.
