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
  'housekeeping': { en: 'Housekeeping', ar: 'النظافة' },
  'project_management': { en: 'Project Management', ar: 'إدارة المشاريع' },
  'status': { en: 'Status', ar: 'الحالة' },
  'met': { en: 'Met', ar: 'محقق الهدف' },
  'missed': { en: 'Missed', ar: 'لم يحقق الهدف' },
  'reset': { en: '↺ Reset', ar: '↺ إعادة الضبط' },
  'executive_command': { en: 'Executive Command', ar: 'لوحة القيادة التنفيذية' },
  'departments': { en: 'Departments', ar: 'الأقسام' },
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
  'critical_escalations': { en: 'Critical Escalations', ar: 'المؤشرات التي تحتاج إلى تصعيد' },
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
  'met_label': { en: 'Met', ar: 'محقق الهدف' },
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
  'executive_intelligence': { en: 'Executive Intelligence', ar: 'الملخص التنفيذي' },
  'dept_performance': { en: 'Department Performance', ar: 'أداء الأقسام' },
  'kpi_name_col': { en: 'KPI Name', ar: 'اسم المؤشر' },
  'risk_col': { en: 'Risk', ar: 'تصنيف الخطر' },
  'yoy_col': { en: 'YoY', ar: 'المقارنة بالسنة الماضية' },
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
    var _l=(typeof lang!=='undefined'?lang:'en'); return (ST.textEdits[key][_l]!==undefined && ST.textEdits[key][_l]!==null && ST.textEdits[key][_l]!=='' ) ? ST.textEdits[key][_l] : key;
  }
  if (TR[key]) { var _l2=(typeof lang!=='undefined'?lang:'en'); return (TR[key][_l2]!==undefined && TR[key][_l2]!==null && TR[key][_l2]!=='' ) ? TR[key][_l2] : key; }
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
  var curLang = isAr ? 'ar' : 'en';
  function editedForKey(key){
    if(typeof ST==='undefined'||!ST.textEdits||!ST.textEdits[key]) return null;
    var v=ST.textEdits[key][curLang];
    return (v!==undefined&&v!==null&&String(v).trim()!=='') ? String(v) : null;
  }
  document.querySelectorAll('[data-en][data-ar]').forEach(function(el) {
    var baseEn=el.getAttribute('data-en')||'';
    var baseAr=el.getAttribute('data-ar')||'';
    var key=null;
    if(typeof TR!=='undefined'){
      Object.keys(TR).some(function(k){
        if((TR[k].en||'')===baseEn || (TR[k].ar||'')===baseAr){ key=k; return true; }
        return false;
      });
    }
    var v=editedForKey(key);
    el.textContent = v!==null ? v : (isAr ? baseAr : baseEn);
  });
  if (typeof ST !== 'undefined' && ST.textEdits) {
    Object.keys(ST.textEdits).forEach(function(key) {
      var val = editedForKey(key);
      if (val===null) return;
      document.querySelectorAll('[data-te-key="' + key + '"],[data-tkey="' + key + '"]').forEach(function(el) { el.textContent = val; });
    });
  }
  document.querySelectorAll('select option[data-en]').forEach(function(o) {
    o.textContent = isAr ? (o.dataset.ar || o.dataset.en) : o.dataset.en;
  });
  if (typeof _applyDashboardTextEditsSoon === 'function') _applyDashboardTextEditsSoon();
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


/* Apply saved dashboard text edits after any render.
   This keeps general dashboard titles/descriptions visible even outside Text Edit mode.
   It intentionally skips KPI name keys; KPI names keep using their existing ST.ov / ST.added flow. */
function _applyDashboardTextEdits(){
  try{
    if(typeof ST === 'undefined' || !ST.textEdits) return;
    var curLang = (typeof lang !== 'undefined') ? lang : 'en';
    var skipTags = {SCRIPT:1,STYLE:1,INPUT:1,TEXTAREA:1,SELECT:1,OPTION:1,SVG:1,PATH:1,CANVAS:1};
    var containers = [];
    ['page-exec','page-reg','page-dept','page-acc','page-accountability','page-report'].forEach(function(id){
      var el=document.getElementById(id); if(el) containers.push(el);
    });
    if(!containers.length) return;

    function wanted(key){
      if(!key || key.indexOf('kpi_name:')===0 || key.indexOf('kpi_name_group:')===0) return null;
      var row = ST.textEdits[key];
      if(!row) return null;
      var v = row[curLang];
      return (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : null;
    }
    function isLeaf(el){for(var i=0;i<el.childNodes.length;i++) if(el.childNodes[i].nodeType===1) return false; return true;}
    function domKey(el){
      if(typeof window._saDomKey==='function') return window._saDomKey(el);
      var parts=[], n=el;
      while(n&&n.nodeType===1&&n.id!=='root'&&parts.length<7){
        if(n.id && /^page-/.test(n.id)){parts.unshift(n.id);break;}
        var idx=1,sib=n; while((sib=sib.previousElementSibling)){if(sib.tagName===n.tagName)idx++;}
        parts.unshift(n.tagName.toLowerCase()+':'+idx); n=n.parentElement;
      }
      return 'dom_'+parts.join('>');
    }

    /* Apply explicit keys only. No text matching: text matching was the root cause
       of edits jumping between unrelated labels and between KPI/status labels. */
    document.querySelectorAll('[data-tkey]').forEach(function(el){
      var key=el.getAttribute('data-tkey');
      var v=wanted(key);
      if(v!==null && el.textContent!==v) el.textContent=v;
    });
    containers.forEach(function(container){
      container.querySelectorAll('*').forEach(function(el){
        if(skipTags[el.tagName]) return;
        if(!isLeaf(el)) return;
        var v=wanted(domKey(el));
        if(v!==null && el.textContent!==v) el.textContent=v;
      });
    });
  }catch(e){ console.warn('[TextEdits] apply failed:', e && e.message ? e.message : e); }
}
window._applyDashboardTextEdits = _applyDashboardTextEdits;
function _applyDashboardTextEditsSoon(){
  try{ if(typeof _applyDashboardTextEdits==='function') _applyDashboardTextEdits(); }catch(_){}
  try{ requestAnimationFrame(function(){ try{_applyDashboardTextEdits();}catch(_){} }); }catch(_){}
  setTimeout(function(){ try{_applyDashboardTextEdits();}catch(_){} },80);
  setTimeout(function(){ try{_applyDashboardTextEdits();}catch(_){} },300);
  setTimeout(function(){ try{_applyDashboardTextEdits();}catch(_){} },900);
}
window._applyDashboardTextEditsSoon=_applyDashboardTextEditsSoon;

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
  try{if(window._fbUser&&typeof addAudit==='function')addAudit('LANGUAGE_CHANGE','Language changed to '+lang);}catch(_){}
}
window.toggleLang = toggleLang;

function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(function(tab) { tab.classList.remove('on'); });
  document.querySelectorAll('.page').forEach(function(pg) { pg.classList.remove('on'); });
  if (el) el.classList.add('on');
  document.body.classList.toggle('performance-advisory-mode', id === 'advisory');
  var page = document.getElementById('page-' + id);
  if (page) page.classList.add('on');
  window.curPage = id;
  if (typeof curPage !== 'undefined') curPage = id;
  if (typeof renderCurrent === 'function') renderCurrent();
  if (typeof updateChips === 'function') updateChips();
  try{if(window._fbUser&&typeof addAudit==='function'){var names={exec:'Executive Command',dept:'Departments',registry:'KPI Register',accountability:'Accountability',advisory:'Advisory Center'};addAudit('PAGE_VIEW','Opened page: '+(names[id]||id));}}catch(_){}
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
    else if (cur === 'advisory') { if (typeof window._performanceAdvisoryMount === 'function') window._performanceAdvisoryMount(); }
    else if (cur === 'report') { if (typeof renderReport === 'function') renderReport(); }
    if (typeof _applyDashboardTextEditsSoon === 'function') _applyDashboardTextEditsSoon();
    else if (typeof _applyDashboardTextEdits === 'function') _applyDashboardTextEdits();
  } catch(e) {
    console.error('[Dashboard] renderCurrent error:', e);
  }
}
window.renderCurrent = renderCurrent;

/* resetFilters is defined in dashboard.js — export only if it exists */
if (typeof resetFilters === 'function') window.resetFilters = resetFilters;

/* ==========================================================
   FINAL QUMC FIX — Arabic-only UI translation sweep
   Does not touch English mode, form values, inputs, or KPI name fields.
   ========================================================== */
(function(){
  var MAP={
    'Executive Command':'لوحة القيادة التنفيذية','Departments':'عرض الأقسام','KPI Register':'سجل المؤشرات','Accountability':'المساءلة والمتابعة','Reports':'التقارير','Dashboard':'لوحة القيادة',
    'Dept':'القسم','Department':'القسم','Status':'الحالة','All':'الكل','Met':'محقق الهدف','Missed':'لم يحقق الهدف','Pending':'قيد المتابعة','Reset':'إعادة الضبط','↺ Reset':'↺ إعادة الضبط',
    'Total':'الإجمالي','KPI Indicators':'مؤشرات الأداء','View all →':'عرض الكل ←','evaluated':'تم تقييمها','Target achieved':'محقق الهدف','Need attention':'بحاجة إلى متابعة','Critical':'حرج','Tier 1 escalations':'تصعيدات المستوى الأول',
    'Current Performance':'الأداء الحالي','Forecast YE':'التوقع السنوي','Selected period average':'متوسط الفترة المحددة','Expected year-end':'التوقع لنهاية السنة','Department Forecasts':'توقعات الأقسام','Overall Executive Forecast':'التوقع التنفيذي العام',
    'KPI':'المؤشر','KPI Name':'اسم المؤشر','Code':'الرمز','Target':'الهدف','Result':'النتيجة','Achievement':'نسبة أداء القسم','Avg':'المتوسط','Average':'المتوسط','YoY':'المقارنة بالسنة الماضية','Risk':'تصنيف الخطر','Risk Tier':'تصنيف الخطر','Trend':'الاتجاه','Last Result':'آخر نتيجة','Owner':'المسؤول','KPI Owner':'مسؤول المؤشر',
    'Target:':'الهدف:','Result:':'النتيجة:','Performance':'الأداء','Filters':'الفلاتر','Overview':'نظرة عامة','Executive Intelligence':'الملخص التنفيذي','Department Performance':'أداء الأقسام','Detailed KPI Performance Cards':'بطاقات أداء المؤشرات التفصيلية','DETAILED KPI PERFORMANCE CARDS':'بطاقات أداء المؤشرات التفصيلية',
    'Repeat Misses':'الإخفاقات المتكررة','Last Updated':'آخر تحديث','Top Risk':'أعلى خطر','Recommended Action':'الإجراء الموصى به','Critical Escalations':'المؤشرات التي تحتاج إلى تصعيد','Gap Analysis Open':'تحليل فجوات مفتوح','At-Risk KPIs':'مؤشرات قد تتعرض لخطر عدم تحقيق الهدف','Priority Department':'القسم ذو الأولوية','Biggest Gap':'أكبر فجوة (اسم المؤشر)',
    'ON TRACK':'في المسار','CRITICAL ATTENTION REQUIRED':'يتطلب انتباهاً عاجلاً','ATTENTION REQUIRED':'مطلوب الانتباه','NEEDS IMPROVEMENT':'يحتاج تحسيناً','All documented':'موثق بالكامل','Insufficient data':'بيانات غير كافية',
    'All KPIs':'جميع المؤشرات','No data':'لا توجد بيانات','No important notifications.':'لا توجد إشعارات مهمة.','Loading notifications…':'جاري تحميل الإشعارات…','Close':'إغلاق','Notification':'إشعار'
  };
  function txt(n){return (n&&n.nodeValue||'').replace(/\s+/g,' ').trim();}
  function skipEl(el){
    if(!el) return true;
    var tag=(el.tagName||'').toLowerCase();
    if(['script','style','textarea','input','select','option','canvas','svg'].indexOf(tag)>=0) return true;
    if(el.closest&&el.closest('.kpi-name,[data-kpi-name],.rpt-ep,#aiMsgs,#aiInp')) return true;
    return false;
  }
  function apply(root){
    if(typeof lang==='undefined'||lang!=='ar') return;
    root=root||document.body; if(!root) return;
    document.querySelectorAll('[data-ar]').forEach(function(el){
      if(skipEl(el)) return;
      var ar=el.getAttribute('data-ar'); if(ar) el.textContent=ar;
    });
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return skipEl(n.parentElement)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    var nodes=[],n; while((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node){
      var raw=node.nodeValue, clean=txt(node); if(!clean) return;
      if(MAP[clean]){ node.nodeValue=raw.replace(clean,MAP[clean]); return; }
      var out=raw;
      Object.keys(MAP).sort(function(a,b){return b.length-a.length;}).forEach(function(k){
        if(k.length<4) return;
        out=out.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),MAP[k]);
      });
      node.nodeValue=out;
    });
    document.documentElement.setAttribute('dir','rtl');
  }
  window.qumcApplyArabicUI=apply;
  var old=window.renderCurrent;
  if(typeof old==='function'){
    window.renderCurrent=function(){var r=old.apply(this,arguments);setTimeout(function(){apply(document.body);},100);return r;};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){apply(document.body);},200);});else setTimeout(function(){apply(document.body);},200);
})();


/* ==========================================================
   QUMC ARABIC POLISH — Arabic mode only. English is untouched.
   - Translates static dashboard labels, chart titles, header actions.
   - Does not translate form inputs or KPI name editable fields.
   ========================================================== */
(function(){
  var AR_MAP={

    'MISSED':'لم يحقق الهدف','غير محقق':'لم يحقق الهدف','المحقق':'نسبة أداء القسم','محقق':'محقق الهدف',
    'Patient Safety':'سلامة المرضى','سلامة المريض':'سلامة المرضى',
    'Forecast Q2\'26':'توقع الربع القادم Q2\'26','Forecast Q3\'26':'توقع الربع القادم Q3\'26','Forecast Q4\'26':'توقع الربع القادم Q4\'26',
    'Forecast Q1\'27':'توقع الربع القادم Q1\'27',
    'Risk Tiers':'تصنيف المخاطر','🎯 مستويات المخاطر':'🎯 تصنيف المخاطر','المخاطر':'تصنيف الخطر','مخاطر':'تصنيف الخطر',
    'Executive Intelligence Summary':'الملخص التنفيذي','التحليل التنفيذيالملخص':'الملخص التنفيذي',
    'Missed KPIs without gap analysis':'مؤشرات لم تحقق الهدف بدون تحليل فجوات','مؤشرات غير محقق بدون تحليل فجوات':'مؤشرات لم تحقق الهدف بدون تحليل فجوات',
    '» View Gap Analysis':'استعراض تحليل الفجوات','View Gap Analysis':'استعراض تحليل الفجوات',
    'KPI':'اسم المؤشر','المؤشر':'اسم المؤشر',
    'KPIs at risk of missing target':'مؤشرات قد تتعرض لخطر عدم تحقيق الهدف','At-Risk KPIs (Next Qtr)':'مؤشرات معرضة للخطر الربع القادم',
    'المقارنة السنوية':'المقارنة بالسنة الماضية','Critical Escalations':'المؤشرات التي تحتاج إلى تصعيد','تصعيدات حرجة':'المؤشرات التي تحتاج إلى تصعيد',
    'بلاغ مشكلة':'إبلاغ عن مشكلة',
    'Housekeeping':'النظافة','خدمات النظافة':'النظافة','خدمات الفندقة والنظافة':'النظافة',
    'Executive Command':'لوحة القيادة التنفيذية','Executive Intelligence':'الملخص التنفيذي','Departments':'الأقسام','Department':'القسم','KPI Register':'سجل المؤشرات','Accountability':'المساءلة والمتابعة','Reports':'التقارير','Dashboard':'لوحة القيادة',
    'Excel':'إكسل','Report':'التقرير','Export':'تصدير','Export ▾':'تصدير ▾','Select Page to Export':'اختر الصفحة للتصدير','All Pages':'كل الصفحات','Export to PDF':'تصدير إلى PDF','Page to Export':'الصفحة المراد تصديرها','Download PDF':'تحميل PDF','Cancel':'إلغاء',
    'Year':'السنة','Quarters':'الأرباع','Dept':'القسم','Status':'الحالة','All':'الكل','Met':'محقق الهدف','Missed':'لم يحقق الهدف','Pending':'قيد المتابعة','Reset':'إعادة الضبط','↺ Reset':'↺ إعادة الضبط',
    'Total':'الإجمالي','TOTAL':'الإجمالي','KPI Indicators':'مؤشرات الأداء','KPIs':'مؤشرات','View all →':'عرض الكل ←','evaluated':'تم تقييمها','evaluated 22':'تم تقييمها 22',
    'Current Performance':'الأداء الحالي','Forecast YE':'التوقع السنوي','Selected period average':'متوسط الفترة المحددة','Expected year-end':'التوقع لنهاية السنة','Department Forecasts':'توقعات الأقسام','Overall Executive Forecast':'التوقع التنفيذي العام',
    'Annual avg vs prior year':'المتوسط السنوي مقارنة بالسنة السابقة','Annual Average vs Prior Year':'المتوسط السنوي مقارنة بالسنة السابقة','Below target':'أقل من الهدف','Success rate':'معدل النجاح','Gap rate':'معدل الفجوة',
    'KPI':'المؤشر','KPI Name':'اسم المؤشر','Code':'الرمز','Target':'الهدف','Result':'النتيجة','Achievement':'نسبة أداء القسم','Avg':'المتوسط','Average':'المتوسط','YoY':'المقارنة بالسنة الماضية','Risk':'تصنيف الخطر','Risk Tier':'تصنيف الخطر','Trend':'الاتجاه','Last Result':'آخر نتيجة','Owner':'المسؤول','KPI Owner':'مسؤول المؤشر',
    'KPI Achievement vs Target':'تحقيق المؤشرات مقابل الهدف','KPI ACHIEVEMENT VS TARGET':'تحقيق المؤشرات مقابل الهدف','KPI Trends':'اتجاهات المؤشرات','KPI TRENDS':'اتجاهات المؤشرات','KPI Trend Analysis':'تحليل اتجاه المؤشرات','Quarterly Achievement':'الإنجاز الربعي','Quarterly Trend by Department':'الاتجاه الربعي حسب القسم','Risk Tiers':'تصنيف المخاطر',
    'Detailed KPI Performance Cards':'بطاقات أداء المؤشرات التفصيلية','DETAILED KPI PERFORMANCE CARDS':'بطاقات أداء المؤشرات التفصيلية','Summary':'الملخص التنفيذي','Critical Risks':'المخاطر الحرجة','Recommendations':'التوصيات','Last Updated':'آخر تحديث',
    'Target achieved':'محقق الهدف','Need attention':'بحاجة إلى متابعة','Critical':'حرج','Tier 1 escalations':'تصعيدات المستوى الأول','At-Risk KPIs':'مؤشرات قد تتعرض لخطر عدم تحقيق الهدف','Priority Department':'القسم ذو الأولوية','Biggest Gap':'أكبر فجوة (اسم المؤشر)','Repeat Misses':'الإخفاقات المتكررة',
    'ON TRACK':'في المسار','CRITICAL ATTENTION REQUIRED':'يتطلب انتباهاً عاجلاً','ATTENTION REQUIRED':'مطلوب الانتباه','NEEDS IMPROVEMENT':'يحتاج تحسيناً','All documented':'موثق بالكامل','Insufficient data':'بيانات غير كافية','No data':'لا توجد بيانات',
    'Maintenance':'الصيانة','Safety':'السلامة','Project Management':'إدارة المشاريع','Projects':'إدارة المشاريع',
    'Preventive Maintenance Compliance':'معدل الالتزام بالصيانة الوقائية','Corrective Maintenance Resolution Rate':'معدل إغلاق طلبات الصيانة التصحيحية',
    'Fire Safety Compliance':'معدل الالتزام بالسلامة من الحريق','Emergency Drill Compliance':'معدل الالتزام بتمارين الطوارئ','Hazardous Waste Segregation Rate':'معدل الفصل الصحيح للنفايات الطبية الخطرة','Emergency Request Response Time':'زمن الاستجابة للطلبات الطارئة','Hygiene Standards Compliance':'معدل الالتزام بمعايير النظافة','Laundry Turnaround Time Compliance':'الالتزام بوقت دورة الغسيل','Schedule Performance Index':'مؤشر أداء الجدول الزمني',
    'Responsible Person':'الشخص المسؤول','Action':'الإجراء','Priority':'الأولوية','Due Date':'تاريخ الاستحقاق','Root Cause':'السبب الجذري','Corrective Action':'الإجراء التصحيحي','Open':'مفتوح','In Prog':'جاري','Done':'مكتمل','Details':'تفاصيل'
  };
  function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  window.qumcAr=function(s){
    if(s==null)return s; var out=String(s);
    if(AR_MAP[out.trim()]) return AR_MAP[out.trim()];
    Object.keys(AR_MAP).sort(function(a,b){return b.length-a.length;}).forEach(function(k){ if(k.length>2) out=out.replace(new RegExp(escRe(k),'g'),AR_MAP[k]); });
    return out;
  };
  function skip(el){
    if(!el)return true; var tag=(el.tagName||'').toLowerCase();
    if(['script','style','textarea','input','select','option','canvas','svg','path'].indexOf(tag)>=0)return true;
    if(el.closest&&el.closest('.kpi-name,[data-kpi-name],.rpt-ep,#aiMsgs,#aiInp,[contenteditable="true"]'))return true;
    return false;
  }
  function apply(root){
    if(typeof lang==='undefined'||lang!=='ar')return; root=root||document.body; if(!root)return;
    try{document.documentElement.dir='rtl'; var rt=document.getElementById('root'); if(rt)rt.dir='rtl';}catch(_){ }
    root.querySelectorAll('[data-ar]').forEach(function(el){ if(skip(el))return; var ar=el.getAttribute('data-ar'); if(ar)el.textContent=ar; });
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return skip(n.parentElement)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    var arr=[],n; while((n=walker.nextNode()))arr.push(n);
    arr.forEach(function(node){ var before=node.nodeValue; var after=window.qumcAr(before); if(after!==before)node.nodeValue=after; });
    // Header action buttons and export menu, without touching English mode.
    document.querySelectorAll('button,.export-menu-item,.tab span,.ch,.ch-r').forEach(function(el){ if(skip(el))return; var before=el.textContent; var after=window.qumcAr(before); if(after!==before)el.textContent=after; });
    var deptF=document.getElementById('deptF'); if(deptF){ Array.prototype.forEach.call(deptF.options,function(o){ if(o.value==='housekeeping')o.textContent='النظافة'; }); }
  }
  window.qumcApplyArabicUI=apply;
  var prev=window.applyDOMTranslations;
  window.applyDOMTranslations=function(){ if(prev)prev.apply(this,arguments); setTimeout(function(){apply(document.body);},0); setTimeout(function(){apply(document.body);},100); };
  var oldToggle=window.toggleLang;
  if(typeof oldToggle==='function')window.toggleLang=function(){ var r=oldToggle.apply(this,arguments); setTimeout(function(){apply(document.body);},80); setTimeout(function(){apply(document.body);},350); return r; };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){apply(document.body);},300);}); else setTimeout(function(){apply(document.body);},300);
})();
