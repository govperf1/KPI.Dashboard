/* ===========================================================
   QUMC Dashboard  --  translations.js
   SINGLE SOURCE OF TRUTH for all translatable text.
   =========================================================== */

/* ─── Central Translation Table ─── */
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
  'met': { en: 'Met', ar: 'محقق' },
  'missed': { en: 'Missed', ar: 'غير محقق' },
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
  'kpi_performance_report': { en: 'KPI Performance Report', ar: 'تقرير مؤشرات الأداء' },
  'critical_escalations': { en: 'Critical Escalations', ar: 'تصعيدات حرجة' },
  'gap_analysis_open': { en: 'Gap Analysis Open', ar: 'فجوات قيد المعالجة' },
  'current_performance': { en: 'Current Performance', ar: 'الأداء الحالي' },
  'selected_period_average': { en: 'Selected period average', ar: 'متوسط الفترة المحددة' },
  'forecast_ye': { en: 'Forecast YE', ar: 'التوقع السنوي' },
  'pending': { en: 'Pending', ar: 'قيد التنفيذ' },
  'all_kpis': { en: 'All KPIs', ar: 'جميع المؤشرات' },
  'save': { en: 'Save', ar: 'حفظ' },
  'cancel': { en: 'Cancel', ar: 'إلغاء' },
  'edit': { en: 'Edit', ar: 'تعديل' },
  'delete': { en: 'Delete', ar: 'حذف' },
  'add_kpi': { en: 'Add KPI', ar: 'إضافة مؤشر' },
  'edit_kpi': { en: 'Edit KPI', ar: 'تعديل مؤشر' },
  'planned': { en: 'Planned', ar: 'المستهدف' },
  'complete': { en: 'Complete', ar: 'المنجز' },
  'incomplete': { en: 'Incomplete', ar: 'المتبقي' },
  'result': { en: 'Result', ar: 'النتيجة' },
  'target': { en: 'Target', ar: 'الهدف' },
  'performance': { en: 'Performance', ar: 'الأداء' },
  'quarter': { en: 'Quarter', ar: 'الربع' },
  'no_data': { en: 'No data', ar: 'لا توجد بيانات' },
  'loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'saved': { en: 'Saved', ar: 'تم الحفظ' },
  'error': { en: 'Error', ar: 'خطأ' },
  'user_requests': { en: 'User Requests', ar: 'طلبات المستخدمين' },
  'approved': { en: 'Approved', ar: 'موافق عليه' },
  'rejected': { en: 'Rejected', ar: 'مرفوض' },
  'notifications': { en: 'Notifications', ar: 'الإشعارات' },
  'dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'reports': { en: 'Reports', ar: 'التقارير' },
  'settings': { en: 'Settings', ar: 'الإعدادات' },
  'logout': { en: 'Log Out', ar: 'تسجيل الخروج' },
  'at_risk': { en: 'At Risk', ar: 'في خطر' },
  'on_track': { en: 'On Track', ar: 'على المسار' },
  'critical': { en: 'Critical', ar: 'حرج' },
  'stable': { en: 'Stable', ar: 'مستقر' },
  'developing': { en: 'Developing', ar: 'في تطور' },
  'needs_attention': { en: 'Needs Attention', ar: 'يحتاج انتباهاً' },
  'all_good': { en: 'All Good', ar: 'كل المؤشرات جيدة' },
  'all_depts_ok': { en: 'All Depts OK', ar: 'جميع الأقسام مستوفية' },
  'kpis_on_target': { en: 'KPIs on target', ar: 'المؤشرات محققة للأهداف' },
  'met_label': { en: 'Met', ar: 'محقق' },
  'improved': { en: 'Improved', ar: 'تحسّن' },
  'declined': { en: 'Declined', ar: 'انخفض' },
  'all_clear': { en: 'All Clear', ar: 'لا إشكاليات' },
  'requires_immediate_attention': { en: 'Requires immediate attention', ar: 'يستوجب تدخلاً فورياً' },
  'all_documented': { en: 'All documented', ar: 'موثّق بالكامل' },
  'likely_to_meet_target': { en: 'Likely to meet target', ar: 'متوقع تحقيق الهدف' },
  'moderate_risk': { en: 'Moderate risk', ar: 'خطر متوسط' },
  'at_risk_label': { en: 'At risk', ar: 'في خطر' },
  'q1_vs_prior_year': { en: 'Q1 vs prior year Q1', ar: 'الربع الأول مقارنةً بالسابق' },
  'detailed_kpi_performance_cards': { en: 'DETAILED KPI PERFORMANCE CARDS', ar: 'بطاقات أداء المؤشرات التفصيلية' },
  'executive_intelligence': { en: 'Executive Intelligence', ar: 'الاستخبارات التنفيذية' },
  'dept_performance': { en: 'Department Performance', ar: 'أداء الأقسام' },
  'kpi_name_col': { en: 'KPI Name', ar: 'اسم المؤشر' },
  'risk_col': { en: 'Risk', ar: 'المخاطر' },
  'yoy_col': { en: 'YoY', ar: 'سنوي' },
  'avg_col': { en: 'Avg', ar: 'المتوسط' },
  'code_col': { en: 'Code', ar: 'الرمز' },
  'on_track_label': { en: 'ON TRACK', ar: 'في المسار' },
  'critical_attention_required': { en: 'CRITICAL ATTENTION REQUIRED', ar: 'انتباه عاجل مطلوب' },
  'attention_required': { en: 'ATTENTION REQUIRED', ar: 'مطلوب الانتباه' },
  'needs_improvement': { en: 'NEEDS IMPROVEMENT', ar: 'يحتاج تحسيناً' },
  'actions_in_progress': { en: 'Actions Being Implemented', ar: 'الإجراءات جارية' },
  'actions_pending_label': { en: 'Corrective Actions Pending', ar: 'إجراءات تصحيحية معلقة' },
  'chronic_underperformance': { en: 'Chronic underperformance', ar: 'ضعف أداء مزمن' },
  'best_dept_label': { en: 'Best dept', ar: 'أفضل قسم' },
  'tier_label': { en: 'Tier', ar: 'المستوى' },
  'kpi_owner_label': { en: 'KPI Owner', ar: 'مسؤول المؤشر' },
  'overview': { en: 'Overview', ar: 'نظرة عامة' },
  'filters_label': { en: 'Filters', ar: 'عوامل التصفية' },
  'no_gaps_label': { en: 'No gaps', ar: 'لا فجوات' },
  'all_tier1_on_track': { en: 'All Tier-1 KPIs on track', ar: 'جميع مؤشرات المستوى الأول في المسار' },
  'continue_monitoring': { en: 'Continue monitoring', ar: 'استمر في المتابعة' },
  'needs_recovery': { en: 'Needs recovery', ar: 'يحتاج إلى استعادة' },
  'needs_improvement_lower': { en: 'Needs improvement', ar: 'يحتاج تحسيناً' },
  'gap_analysis_incomplete': { en: 'Gap analysis incomplete', ar: 'تحليل الفجوات غير مكتمل' },
  'no_gaps_found': { en: 'No gaps', ar: 'لا فجوات' },
  'performance_on_track_lower': { en: 'Performance on track', ar: 'الأداء في المسار' },
  'requires_exec_escalation': { en: 'Requires executive escalation', ar: 'يستلزم تصعيداً تنفيذياً' },
  'root_cause_required': { en: 'Root cause analysis required', ar: 'مطلوب تحليل السبب الجذري' },
  'last_updated': { en: 'Last Updated', ar: 'آخر تحديث' },
  'performance_label': { en: 'Performance', ar: 'الأداء' },
  'all_kpis_meeting_targets': { en: 'All KPIs are meeting their targets.', ar: 'جميع المؤشرات تحقق أهدافها.' },
  'review_label': { en: 'Review', ar: 'مراجعة' }
};

/* ── Export TR immediately after declaration ── */
window.TR = TR;

/* ─── Core API ─── */

function t(key) {
  var val;
  var _lang = (typeof lang !== 'undefined') ? lang : 'en';
  /* F1: NO cross-language fallback. Each language is independent. */
  if (typeof ST !== 'undefined' && ST.textEdits && ST.textEdits[key]) {
    var _te = ST.textEdits[key];
    /* Only use the current language's value — never fall back to the other language */
    val = (_te[_lang] !== undefined && _te[_lang] !== null) ? _te[_lang] : null;
    if (val === null) {
      /* No edit for this language yet — fall to TR default for this language */
      val = (TR[key] && TR[key][_lang] !== undefined && TR[key][_lang] !== null)
              ? TR[key][_lang]
              : key;
    }
  } else if (TR[key]) {
    /* F1: Only read current language from TR, never cross-read */
    val = (TR[key][_lang] !== undefined && TR[key][_lang] !== null)
            ? TR[key][_lang]
            : key;
  } else {
    val = key;
  }
  if (window._saEditMode) {
    return '<span data-tkey="' + key + '" class="sa-ed" title="Edit: ' + key + '">' + val + '</span>';
  }
  return val;
}
/* ── Export t immediately after definition ── */
window.t = t;

function tText(key) {
  if (typeof ST !== 'undefined' && ST.textEdits && ST.textEdits[key]) {
    return ST.textEdits[key][lang] || ST.textEdits[key]['en'] || key;
  }
  if (TR[key]) return TR[key][lang] || TR[key]['en'] || key;
  return key;
}
window.tText = tText;

function tBoth(key) {
  var base = TR[key] || { en: key, ar: '' };
  var over = (typeof ST !== 'undefined' && ST.textEdits && ST.textEdits[key]) || {};
  return {
    en: over.en !== undefined ? over.en : base.en,
    ar: over.ar !== undefined ? over.ar : base.ar
  };
}
/* ── Export tBoth immediately after definition ── */
window.tBoth = tBoth;

function tSet(key, en, ar) {
  /* F2: Write only the language that was explicitly provided.
     Never overwrite the other language. */
  if (!TR[key]) TR[key] = {};
  if (en !== undefined && en !== null) TR[key].en = en;
  if (ar !== undefined && ar !== null) TR[key].ar = ar;
  if (typeof ST !== 'undefined') {
    if (!ST.textEdits) ST.textEdits = {};
    if (!ST.textEdits[key]) ST.textEdits[key] = {};
    /* Only set the languages that were explicitly passed */
    if (en !== undefined && en !== null) ST.textEdits[key].en = en;
    if (ar !== undefined && ar !== null) ST.textEdits[key].ar = ar;
  }
  if (typeof applyDOMTranslations === 'function') applyDOMTranslations();
}
window.tSet = tSet;

function applyDOMTranslations() {
  var isAr = (typeof lang !== 'undefined' && lang === 'ar');
  document.querySelectorAll('[data-en][data-ar]').forEach(function(el) {
    el.textContent = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
  });
  if (typeof ST !== 'undefined' && ST.textEdits) {
    Object.keys(ST.textEdits).forEach(function(key) {
      var val = ST.textEdits[key][lang];
      if (!val) return;
      document.querySelectorAll(
        '[data-en="' + key + '"],[data-ar="' + key + '"],[data-te-key="' + key + '"]'
      ).forEach(function(el) { el.textContent = val; });
    });
  }
  document.querySelectorAll('select option[data-en]').forEach(function(o) {
    o.textContent = isAr ? (o.dataset.ar || o.dataset.en) : o.dataset.en;
  });
}
window.applyDOMTranslations = applyDOMTranslations;

function applyTextEdits() { applyDOMTranslations(); }
window.applyTextEdits = applyTextEdits;

/* ── All critical exports are already set above ──
   The block below re-affirms them and is safe to reach or not. */
window.TR   = TR;
window.t    = t;
window.tBoth = tBoth;
window.tSet  = tSet;
console.log('[TR] loaded — typeof t:', typeof t, '| typeof window.t:', typeof window.t);

/* ─── Language toggle, tab navigation, render dispatcher ─── */
function toggleLang() {
  if (typeof lang === 'undefined') return;
  lang = lang === 'en' ? 'ar' : 'en';
  var root = document.getElementById('root');
  if (root) { root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
  var lb = document.getElementById('langBtn');
  if (lb) lb.textContent = lang === 'ar' ? 'EN' : 'عربي';
  document.querySelectorAll('[data-en][data-ar]').forEach(function(e) {
    e.textContent = lang === 'ar' ? e.dataset.ar : e.dataset.en;
  });
  document.querySelectorAll('select option[data-en]').forEach(function(o) {
    o.textContent = lang === 'ar' ? o.dataset.ar : o.dataset.en;
  });
  /* Guard: updateChips and renderCurrent may not exist at parse time */
  if (typeof updateChips === 'function') updateChips();
  if (typeof renderCurrent === 'function') renderCurrent();
  /* fetchAI is optional — guard it */
  if (typeof fetchAI === 'function') fetchAI();
}
window.toggleLang = toggleLang;

function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(function(tab) { tab.classList.remove('on'); });
  document.querySelectorAll('.page').forEach(function(pg) { pg.classList.remove('on'); });
  if (el) el.classList.add('on');
  var page = document.getElementById('page-' + id);
  if (page) page.classList.add('on');
  window.curPage = id;
  if (typeof curPage !== 'undefined') curPage = id;
  if (typeof renderCurrent === 'function') renderCurrent();
  if (typeof updateChips === 'function') updateChips();
}
window.switchTab = switchTab;

function renderCurrent() {
  try {
    var cur = (typeof window.curPage !== 'undefined' ? window.curPage : null) ||
              (typeof curPage !== 'undefined' ? curPage : 'exec');
    if (cur === 'exec') { if (typeof renderExec === 'function') renderExec(); }
    else if (cur === 'dept') { if (typeof renderDept === 'function') renderDept(); }
    else if (cur === 'registry') { if (typeof renderRegistry === 'function') renderRegistry(); }
    else if (cur === 'accountability') { if (typeof renderAcc === 'function') renderAcc(); }
    else if (cur === 'report') { if (typeof renderReport === 'function') renderReport(); }
  } catch(e) {
    console.error('[Dashboard] renderCurrent error:', e);
  }
}
window.renderCurrent = renderCurrent;

/* resetFilters is defined in dashboard.js — export only if it exists */
if (typeof resetFilters === 'function') window.resetFilters = resetFilters;
