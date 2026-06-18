# QUMC Dashboard — Post-Deploy Test Checklist

Deploy to GitHub Pages, then verify each item below.

---

## 1. Page Load
- [ ] Page loads without a white screen
- [ ] No console errors on load (open DevTools → Console)
- [ ] Login overlay appears correctly
- [ ] Background image visible

## 2. Authentication
- [ ] Can log in with a Super Admin account
- [ ] Can log in with an Admin account
- [ ] Can log in with a KPI Owner account
- [ ] Incorrect password shows an error message
- [ ] "Forgot Password" link sends a reset email

## 3. Portal Navigation
- [ ] Performance card appears after login
- [ ] GRC card appears after login
- [ ] User Requests card appears for Admin and Super Admin only
- [ ] Clicking Performance enters the dashboard
- [ ] Back button returns to the portal (not a blank page)

## 4. Dashboard Rendering
- [ ] Executive summary page loads (charts, KPI cards)
- [ ] Departments tab loads
- [ ] KPI Register tab loads
- [ ] Accountability tab loads
- [ ] Reports tab loads
- [ ] Year filter shows correct years
- [ ] Quarter filter chips work
- [ ] Dept filter changes the view

## 5. Language Toggle
- [ ] Clicking "عربي" switches all [data-en]/[data-ar] labels to Arabic
- [ ] Clicking "EN" switches back to English
- [ ] No labels remain untranslated (no English text visible in AR mode)
- [ ] Dashboard re-renders correctly after toggle

## 6. Translation System
- [ ] (Super Admin) "✏ Edit Text" button visible in topbar
- [ ] (Non-SA) "✏ Edit Text" button NOT visible
- [ ] Clicking a text label opens the Translation Editor
- [ ] Saving updates the text immediately on screen
- [ ] After refresh, the saved text persists (from ST.textEdits via Firestore)

## 7. KPI Management
- [ ] Add KPI form opens (Admin+)
- [ ] Filling all fields and clicking Save adds the KPI
- [ ] New KPI appears in the dashboard immediately
- [ ] Edit KPI loads existing data correctly
- [ ] Delete KPI removes it from the list

## 8. Quarterly Values & PCI
- [ ] Entering Planned and Complete values shows a calculated Result
- [ ] Formula column reads from KPI Table Setup config (if set)
- [ ] Hidden columns do not appear

## 9. Gap Analysis
- [ ] KPI Owner can open Gap Analysis
- [ ] Filling and saving a gap entry saves correctly
- [ ] Admin sees the gap update notification

## 10. Admin Panel (Super Admin)
- [ ] Super Admin Hub shows 3 cards (Dashboard, KPI Table Setup, User Requests)
- [ ] KPI Table Setup loads and saves correctly
- [ ] User Requests panel shows submitted requests
- [ ] Approve/Reject with a reply works and notifies the user

## 11. Notifications
- [ ] Bell icon shows unread count after an action
- [ ] Opening the bell shows the notification list
- [ ] Clicking a row marks it as Read (dot goes grey, count decreases)
- [ ] View button opens detail without deleting the notification
- [ ] On a second browser tab, a new notification appears within seconds

## 12. Reports & Export
- [ ] Reports page renders the report table
- [ ] "Download Excel" produces a valid .xlsx file
- [ ] "Download Word" produces a valid .docx file

## 13. Firestore (Console verification)
- [ ] Open Firebase Console → Firestore → Usage
- [ ] Perform 5 actions (save, edit, toggle lang, navigate tabs, open profile)
- [ ] Confirm write count is ≤ 5 (one per explicit user action)
- [ ] Confirm no continuous write flood in Firestore metrics

## 14. GitHub Pages Specific
- [ ] All assets load (no 404s in Network tab)
- [ ] css/style.css loads (200 OK)
- [ ] js/kpi.js loads (200 OK)
- [ ] js/firebase.js loads as module (200 OK)
- [ ] No mixed-content warnings (all CDN links use https)

---
*Last updated after modular refactor — Steps 1–19 complete.*
