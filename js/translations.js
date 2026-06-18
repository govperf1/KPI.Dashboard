/* ===========================================================
   QUMC Dashboard  --  translations.js
   SINGLE SOURCE OF TRUTH for all translatable text.

   Architecture:
     TR      -- base translations (EN + AR per key)
     t(key)  -- resolve key in current lang (ST.textEdits > TR)
     tBoth(key) -- get {en, ar} for translation editor
     applyDOMTranslations() -- push lang to data-en/ar elements
     applyTextEdits()       -- apply ST.textEdits overrides

   Circular dependency check:
     translations.js --> kpi.js  (reads: lang, ST)   ✅ OK
     kpi.js          --> translations.js              ✅ NONE
     dashboard.js    --> translations.js              ✅ NONE
     (no other file is imported by translations.js)

   Load order: AFTER kpi.js (needs lang, ST)
               BEFORE dashboard.js (provides t())
   =========================================================== */

/* ─── Central Translation Table ─── */
/* Edit here OR via the Translation Editor (Super Admin).
   ST.textEdits overrides take priority over these base values. */
var TR = {
  'governance_risk_managementbr_compliance': { en: 'Governance · Risk Management<br>& Compliance', ar: 'الحوكمة · إدارة المخاطر<br>والالتزام' },
  'facilities_safety_division_governance_performance': { en: 'Facilities & Safety Division — Governance & Performance', ar: 'إدارة المرافق والسلامة — الحوكمة والأداء' },
  'year': { en: 'Year', ar: 'السنة' },
  'quarters': { en: 'Quarters', ar: 'الأرباع' },
  'all': { en: 'All', ar: 'الكل' },
  'dept': { en: 'Dept', ar: 'القسم' },
  'maintenance': { en: 'Maintenance', ar: 'الصيانة' },
  'safety': { en: 'Safety', ar: 'السلامة' },
  'housekeeping': { en: 'Housekeeping', ar: 'خدمات الفندقة والنظافة' },
  'project_management': { en: 'Project Management', ar: 'إدارة المشاريع' },
  'status': { en: 'Status', ar: 'الحالة' },
  'met': { en: ' Met', ar: ' تحقق الهدف' },
  'missed': { en: ' Missed', ar: ' لم يتحقق الهدف' },
  'reset': { en: '↺ Reset', ar: '↺ إعادة الضبط' },
  'executive_command': { en: 'Executive Command', ar: 'لوحة القيادة التنفيذية' },
  'departments': { en: 'Departments', ar: 'عرض الأقسام' },
  'kpi_register': { en: 'KPI Register', ar: 'سجل المؤشرات' },
  'accountability': { en: 'Accountability', ar: 'المساءلة والمتابعة' },
  'kpi_performance_command_center': { en: 'KPI Performance Command Center', ar: 'مركز قيادة مؤشرات الأداء' },
  'governance_performance_dept_facilities_safety_divi': { en: 'Governance & Performance Dept — Facilities & Safety Division', ar: 'قسم الحوكمة والأداء — إدارة المرافق والسلامة' },
  'enter_data_via_admin_panel_edit_kpi': { en: 'Enter data via Admin Panel → Edit KPI', ar: 'أدخل البيانات من لوحة المسؤول ← تعديل مؤشر' },
  'delete_kpi': { en: 'Delete KPI', ar: 'حذف المؤشر' },
  'gap_analysis': { en: 'Gap Analysis', ar: 'تحليل الفجوة' },
  'your_gap_analysis_status': { en: 'Your Gap Analysis Status', ar: 'حالة تحليل الفجوة الخاصة بك' },
  'got_it': { en: 'Got it', ar: 'حسناً' },
  'kpi_performance_report': { en: ' KPI Performance Report', ar: ' تقرير مؤشرات الأداء' },
  'critical_escalations': { en: 'Critical Escalations', ar: 'تصعيدات حرجة' },
  'gap_analysis_open': { en: 'Gap Analysis Open', ar: 'فجوات قيد المعالجة' },
  'current_performance': { en: 'Current Performance', ar: 'الأداء الحالي' },
  'selected_period_average': { en: 'Selected period average', ar: 'متوسط الفترة المحددة' },
  'forecast_ye': { en: 'Forecast YE', ar: 'التوقع السنوي' },
  /* ── Additional system labels (extend as needed) ── */
  'met':              { en: 'Met',            ar: 'محقق' },
  'missed':           { en: 'Missed',         ar: 'غير محقق' },
  'pending':          { en: 'Pending',         ar: 'قيد التنفيذ' },
  'all_kpis':         { en: 'All KPIs',        ar: 'جميع المؤشرات' },
  'save':             { en: 'Save',            ar: 'حفظ' },
  'cancel':           { en: 'Cancel',          ar: 'إلغاء' },
  'edit':             { en: 'Edit',            ar: 'تعديل' },
  'delete':           { en: 'Delete',          ar: 'حذف' },
  'add_kpi':          { en: 'Add KPI',         ar: 'إضافة مؤشر' },
  'edit_kpi':         { en: 'Edit KPI',        ar: 'تعديل مؤشر' },
  'planned':          { en: 'Planned',         ar: 'المستهدف' },
  'complete':         { en: 'Complete',        ar: 'المنجز' },
  'incomplete':       { en: 'Incomplete',      ar: 'المتبقي' },
  'result':           { en: 'Result',          ar: 'النتيجة' },
  'target':           { en: 'Target',          ar: 'الهدف' },
  'performance':      { en: 'Performance',     ar: 'الأداء' },
  'quarter':          { en: 'Quarter',         ar: 'الربع' },
  'no_data':          { en: 'No data',         ar: 'لا توجد بيانات' },
  'loading':          { en: 'Loading...',      ar: 'جاري التحميل...' },
  'saved':            { en: 'Saved',           ar: 'تم الحفظ' },
  'error':            { en: 'Error',           ar: 'خطأ' },
  'user_requests':    { en: 'User Requests',   ar: 'طلبات المستخدمين' },
  'approved':         { en: 'Approved',        ar: 'موافق عليه' },
  'rejected':         { en: 'Rejected',        ar: 'مرفوض' },
  'notifications':    { en: 'Notifications',   ar: 'الإشعارات' },
  'dashboard':        { en: 'Dashboard',       ar: 'لوحة التحكم' },
  'reports':          { en: 'Reports',         ar: 'التقارير' },
  'settings':         { en: 'Settings',        ar: 'الإعدادات' },
  'logout':           { en: 'Log Out',         ar: 'تسجيل الخروج' },
  'at_risk':          { en: 'At Risk',         ar: 'في خطر' },
  'on_track':         { en: 'On Track',        ar: 'على المسار' },
  'critical':         { en: 'Critical',        ar: 'حرج' },
};

/* ─── Core API ─── */

/**
 * t(key) — resolve a translation key in the current language.
 * Priority: ST.textEdits[key] > TR[key] > key (fallback)
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  if (typeof ST !== 'undefined' && ST.textEdits && ST.textEdits[key]) {
    return ST.textEdits[key][lang] || ST.textEdits[key]['en'] || key;
  }
  if (TR[key]) return TR[key][lang] || TR[key]['en'] || key;
  return key;
}

/**
 * tBoth(key) — return {en, ar} for a key (used by Translation Editor).
 * Merges base TR entry with any ST.textEdits overrides.
 */
function tBoth(key) {
  var base   = TR[key] || { en: key, ar: '' };
  var over   = (typeof ST !== 'undefined' && ST.textEdits && ST.textEdits[key]) || {};
  return {
    en: over.en !== undefined ? over.en : base.en,
    ar: over.ar !== undefined ? over.ar : base.ar,
  };
}

/**
 * tSet(key, en, ar) — update ST.textEdits and TR simultaneously.
 * Called by the Translation Editor after a successful Firestore save.
 */
function tSet(key, en, ar) {
  if (!TR[key]) TR[key] = { en: '', ar: '' };
  if (en !== undefined) TR[key].en = en;
  if (ar !== undefined) TR[key].ar = ar;
  /* Persist into the runtime override layer */
  if (typeof ST !== 'undefined') {
    if (!ST.textEdits) ST.textEdits = {};
    ST.textEdits[key] = { en: TR[key].en, ar: TR[key].ar };
  }
  applyDOMTranslations();
}

/**
 * applyDOMTranslations() — push current language to every
 * data-en / data-ar element in the DOM.
 * Called by: toggleLang(), renderCurrent() (via hook).
 */
function applyDOMTranslations() {
  var isAr = (lang === 'ar');
  /* 1. data-en / data-ar attribute pairs */
  document.querySelectorAll('[data-en][data-ar]').forEach(function(el) {
    el.textContent = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
  });
  /* 2. data-te-key overrides (from Translation Editor / ST.textEdits) */
  if (typeof ST !== 'undefined' && ST.textEdits) {
    Object.keys(ST.textEdits).forEach(function(key) {
      var val = ST.textEdits[key][lang];
      if (!val) return;
      document.querySelectorAll(
        '[data-en="' + key + '"],[data-ar="' + key + '"],[data-te-key="' + key + '"]'
      ).forEach(function(el) { el.textContent = val; });
    });
  }
  /* 3. <option> elements with data-en */
  document.querySelectorAll('select option[data-en]').forEach(function(o) {
    o.textContent = isAr ? (o.dataset.ar || o.dataset.en) : o.dataset.en;
  });
}

/**
 * applyTextEdits() — alias kept for backwards compatibility.
 * Applies ST.textEdits overrides to the DOM.
 */
function applyTextEdits() { applyDOMTranslations(); }

/* Expose to global scope so all modules can call t() */
window.TR   = TR;
window.t    = t;
window.tBoth = tBoth;
window.tSet  = tSet;
window.applyTextEdits       = applyTextEdits;
window.applyDOMTranslations = applyDOMTranslations;

/* ─── Language toggle, tab navigation, render dispatcher ─── */
function toggleLang(){
  lang=lang==='en'?'ar':'en';
  const r=document.getElementById('root');r.lang=lang;r.dir=lang==='ar'?'rtl':'ltr';
  document.getElementById('langBtn').textContent=lang==='ar'?'EN':'عربي';
  document.querySelectorAll('[data-en][data-ar]').forEach(e=>e.textContent=lang==='ar'?e.dataset.ar:e.dataset.en);
  document.querySelectorAll('select option[data-en]').forEach(o=>o.textContent=lang==='ar'?o.dataset.ar:o.dataset.en);
  updateChips();renderCurrent();fetchAI();
}

function switchTab(id,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');
  const pg=document.getElementById('page-'+id);
  if(pg)pg.classList.add('on');
  window.curPage=id; curPage=id;
  renderCurrent();
  updateChips();
}
function renderCurrent(){
  try{
    curPage = window.curPage || curPage || 'exec';
    if(curPage==='exec')renderExec();
    else if(curPage==='dept')renderDept();
    else if(curPage==='registry')renderRegistry();
    else if(curPage==='accountability')renderAcc();
    else if(curPage==='report')renderReport();
  }catch(e){
    console.error('[Dashboard] renderCurrent error:',e);
    const wrap=document.getElementById('pageWrap')||document.getElementById('dash-wrap')||document.querySelector('.page-wrap');
    if(wrap&&!wrap.innerHTML.trim()){
      wrap.innerHTML='<div style="padding:40px;text-align:center;color:#DC2626"><p>⚠ Dashboard render error. Please refresh.</p><p style="font-size:11px;color:#64748B">'+e.message+'</p></div>';
    }
  }
}


window.switchTab = switchTab;
window.renderCurrent = renderCurrent;
window.resetFilters = resetFilters;
window.toggleLang = toggleLang;
