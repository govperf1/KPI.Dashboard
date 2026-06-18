# QUMC KPI Dashboard — Dependency Map

## Module Responsibility

| File | Responsibility |
|------|---------------|
| `js/firebase.js` | Firebase init, Firestore read/write, real-time listener |
| `js/kpi.js` | Global state (ST, F, BASE), KPI data layer, utilities, permissions |
| `js/translations.js` | Central TR table, t() resolver, language toggle, DOM apply |
| `js/dashboard.js` | All page rendering (exec, dept, registry, accountability, charts) |
| `js/reports.js` | Excel/Word/PDF export, report page rendering |
| `js/admin.js` | Gap analysis, admin panel, KPI CRUD (add/edit/delete) |
| `js/notifications.js` | Bell badge, profile dropdown, AI assistant, logout |
| `js/auth.js` | Add-KPI stable save patch (last-loaded, overrides saveNewKPI/saveAdmin) |
| `css/style.css` | Main dashboard styles |
| `css/admin.css` | Admin panel, notification, profile, portal styles |
| `css/reports.css` | Print / PDF / report styles |

---

## Load Order & Dependency Chain

```
index.html
 │
 ├── <link> css/style.css
 ├── <link> css/admin.css
 ├── <link> css/reports.css
 │
 ├── Chart.js (CDN)
 ├── ExcelJS  (CDN, async)
 ├── SheetJS  (CDN)
 │
 ├── <script type="module"> js/firebase.js
 │     Imports: Firebase SDK (CDN)
 │     Exports: window._saveToFS, window._loadFromFS,
 │              window._startReadListener, window._stopReadListener
 │              window._doLogout (sign-out)
 │     Reads:   Firestore (kpi_dashboard/state, notifications/*)
 │     Writes:  Firestore only on explicit user action
 │
 ├── <script> js/kpi.js         [depends on: nothing]
 │     Globals: ST, F, BASE, lang, CH, curPage
 │     Exports: allK, filt, qv, ok, metStatus, sLS, lLS,
 │              addAudit, toast, applyRolePermissions,
 │              updateUserBadge, updateBadge, initSecurity,
 │              renderYearFilter, updateChips, htmlEsc
 │
 ├── <script> js/translations.js [depends on: kpi.js (lang, ST)]
 │     Globals: TR (translation table)
 │     Exports: t(key), tBoth(key), tSet(key, en, ar),
 │              applyTextEdits(), applyDOMTranslations(),
 │              toggleLang(), switchTab(), renderCurrent()
 │     NOTE:    Single source of truth for all EN/AR strings.
 │              ST.textEdits overrides TR at runtime.
 │
 ├── <script> js/dashboard.js   [depends on: kpi.js, translations.js]
 │     Exports: renderExec, renderDept, renderRegistry,
 │              renderAcc, renderExecKpiTrends, drilldept,
 │              dch, mkChart, drawBullet
 │
 ├── <script> js/reports.js     [depends on: kpi.js + CDN libs]
 │     Exports: exportExcel, _buildExcelXLSX, _buildExcelFull,
 │              renderReport, _drawBarChart, exportWordDoc,
 │              emptyStateExec, openExportPDF
 │
 ├── <script> js/admin.js       [depends on: kpi.js, dashboard.js]
 │     Exports: openGap, saveGapKPO, openLock, saveAdmin,
 │              calcAdminPCI, openKpiPCI, openReport, loadEK,
 │              confirmDelKpi, refreshAllViewsAfterKpiChange
 │
 ├── <script> js/notifications.js [depends on: kpi.js, firebase.js]
 │     Exports: toggleUserAlerts, renderNotifications,
 │              toggleUserProfile, qumcLogoutToLogin,
 │              updateUserBadge (override), aiToggle
 │
 ├── <script> js/auth.js        [depends on: kpi.js, firebase.js, admin.js]
 │     Overrides: window.saveNewKPI, window.saveAdmin
 │     Purpose: Ensures Add-KPI saves to Firestore before
 │              showing success. Loaded last so override wins.
 │
 ├── <script type="module">     [password reset patch 1]
 └── <script type="module">     [password reset patch 2 — canonical]
```

---

## Translation Architecture

```
TR object (translations.js)
 └── key: { en: '...', ar: '...' }

Runtime priority (highest to lowest):
  1. ST.textEdits[key][lang]   -- saved by Translation Editor
  2. TR[key][lang]             -- base value in translations.js
  3. key                       -- fallback (key itself)

API:
  t('key')           -- current-lang value
  tBoth('key')       -- { en, ar } merged object
  tSet('key',en,ar)  -- update TR + ST.textEdits + re-apply DOM

DOM auto-apply:
  applyDOMTranslations()
   ├── [data-en][data-ar] elements  -- switched on toggleLang
   ├── [data-te-key] elements       -- custom-keyed overrides
   └── <option data-en> elements    -- dropdown options
```

---

## Circular Dependency Check

| Pair | Direction | Status |
|------|-----------|--------|
| `translations.js` → `kpi.js` | reads `lang`, `ST` | ✅ OK (kpi loads first) |
| `kpi.js` → `translations.js` | none | ✅ No dependency |
| `dashboard.js` → `translations.js` | none (t() optional) | ✅ No dependency |
| `firebase.js` → any app JS | none | ✅ No dependency |
| `auth.js` → `admin.js` | overrides, not imports | ✅ Load-order only |

**No circular dependencies exist.**

---

## Firestore Write Rules

| Trigger | Writer | Collection/Doc |
|---------|--------|----------------|
| User clicks Save (KPI/Gap/Config) | `_saveToFS(ST)` debounced 800ms | `kpi_dashboard/state` |
| User marks notification read | `_ncMarkRead()` | `notifications/{id}` |
| User sends notification | `_ncSend()` | `notifications/` (addDoc) |
| Password reset button | reset patch module | auth only, no Firestore |
| **Auto / interval / onSnapshot** | **NEVER** | — |

