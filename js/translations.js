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
function _saCleanText(txt){
  return String(txt||'').replace(/[✓✕✗↗↩▲▼]/g,'').replace(/\s+/g,' ').trim();
}
window._saCleanText=_saCleanText;
function _saNormText(txt){
  return _saCleanText(txt).replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase().substring(0,50);
}
window._saNormText=_saNormText;
function _saDomPath(el, root){
  var parts=[]; var n=el;
  while(n && n!==root && n.nodeType===1 && parts.length<8){
    var tag=(n.tagName||'x').toLowerCase();
    var idx=1, sib=n;
    while((sib=sib.previousElementSibling)){ if((sib.tagName||'').toLowerCase()===tag) idx++; }
    var cls=String(n.className||'').split(/\s+/).filter(Boolean).slice(0,2).join('_').replace(/[^a-zA-Z0-9_-]/g,'');
    parts.unshift(tag+(cls?'.'+cls:'')+':'+idx);
    n=n.parentElement;
  }
  return parts.join('/');
}
window._saDomPath=_saDomPath;
function _saStableDomKey(el){
  if(!el) return '';
  var root = el.closest('#page-exec,#page-dept,#page-registry,#page-accountability,#page-report') || document.body;
  var rid = root.id || 'body';
  var base = el.getAttribute('data-sa-base') || _saCleanText(el.textContent||'');
  return 'dom_'+rid+'_'+_saNormText(_saDomPath(el,root))+'_'+_saNormText(base);
}
window._saStableDomKey=_saStableDomKey;
function _saExactTRKeyForText(txt){
  var c=_saCleanText(txt);
  if(!c || typeof TR==='undefined') return null;
  for(var k in TR){
    if(!Object.prototype.hasOwnProperty.call(TR,k)) continue;
    var tr=TR[k]||{};
    if(_saCleanText(tr.en)===c || _saCleanText(tr.ar)===c) return k;
  }
  return null;
}
window._saExactTRKeyForText=_saExactTRKeyForText;

function _applyDashboardTextEdits(){
  try{
    if(typeof ST === 'undefined' || !ST.textEdits) return;
    var curLang = (typeof lang !== 'undefined') ? lang : 'en';
    var skipTags = {SCRIPT:1,STYLE:1,INPUT:1,TEXTAREA:1,SELECT:1,OPTION:1,SVG:1,PATH:1,CANVAS:1,BUTTON:1};
    var containers = [];
    ['page-exec','page-registry','page-dept','page-accountability','page-report'].forEach(function(id){
      var el=document.getElementById(id); if(el) containers.push(el);
    });
    if(!containers.length) return;
    function wanted(key){
      if(!key || key.indexOf('kpi_name:')===0) return null;
      var row = ST.textEdits[key];
      if(!row) return null;
      var v = row[curLang];
      return (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : null;
    }
    function hasChildElement(el){
      for(var i=0;i<el.childNodes.length;i++) if(el.childNodes[i].nodeType===1) return true;
      return false;
    }
    document.querySelectorAll('[data-tkey]').forEach(function(el){
      var key=el.getAttribute('data-tkey');
      var v=wanted(key);
      if(v!==null && el.textContent!==v) el.textContent=v;
    });
    containers.forEach(function(container){
      container.querySelectorAll('*').forEach(function(el){
        if(skipTags[el.tagName]) return;
        if(hasChildElement(el)) return;
        var txt=_saCleanText(el.textContent||'');
        if(!txt || txt.length<2 || txt.length>180) return;
        var keys=[];
        if(el.getAttribute('data-tkey')) keys.push(el.getAttribute('data-tkey'));
        keys.push(_saStableDomKey(el));
        var trKey=_saExactTRKeyForText(txt);
        if(trKey) keys.push(trKey);
        for(var i=0;i<keys.length;i++){
          var v=wanted(keys[i]);
          if(v!==null && el.textContent!==v){ el.textContent=v; el.setAttribute('data-sa-base', txt); break; }
        }
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
    if (typeof _applyDashboardTextEditsSoon === 'function') _applyDashboardTextEditsSoon();
    else if (typeof _applyDashboardTextEdits === 'function') _applyDashboardTextEdits();
  } catch(e) {
    console.error('[Dashboard] renderCurrent error:', e);
  }
}
window.renderCurrent = renderCurrent;

/* resetFilters is defined in dashboard.js — export only if it exists */
if (typeof resetFilters === 'function') window.resetFilters = resetFilters;
