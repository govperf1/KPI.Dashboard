/* ======================================================================
   QUMC Review & Development Center — Performance + GRC
   Build: 2026-08-25 v191 GRC root sync — manager approval + live data hardening
   Request types:
   1) Existing Item Review & Update
   2) New Item Request
   ====================================================================== */
(function(){
  'use strict';

  var records=[],currentPlatform='grc',currentRootId='advRootGrc',currentView='requests';
  var dashboardFilter='all',departmentFilter='',dashboardSearch='',dashboardStatus='';
  var adminSearch='',adminStatus='',adminDepartment='',loading=false,lastLoadError='',selectedRequest=null,selectedRating=0,selectedAdminAction='respond',liveUnsub=null,livePayload=null,managerRiskRecords=[];

  var STATUS_LABELS={open:'Open',in_progress:'In Progress',closed:'Closed'};
  /* The requester who submits a Review & Development request can be ANY
     approved role (Viewer, User, KPI Owner, ...) — Review & Development is
     open to every department user, unlike the Risk/Incident workflow which
     is restricted to GRC/Risk Owners. The Department Manager UI must never
     assume the requester is a "GRC Owner"; it must reflect the requester's
     actual role. */
  var REQUESTER_ROLE_LABELS={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Department Manager',governance_performance_manager:'Governance & Performance Manager',kpi_owner:'KPI Owner',risk_owner:'Risk Owner',grc_owner:'GRC Owner',platform_owner:'Platform Owner',viewer:'Viewer',user:'User'};
  function requesterRoleLabel(role){role=String(role||'').toLowerCase().trim();return REQUESTER_ROLE_LABELS[role]||'Requester';}
  function requesterLabelFor(r){return requesterRoleLabel(r&&r.requesterRole);}
  function statusKey(value){
    value=String(value||'open').toLowerCase();
    if(['closed','completed','cancelled','duplicate','out_of_scope','knowledge_guide'].indexOf(value)>=0)return'closed';
    if(['in_progress','awaiting_requester_information','responded'].indexOf(value)>=0)return'in_progress';
    return'open';
  }
  var TYPE_LABELS={edit_review:'Existing Item Review & Update',new:'New Item Request',clarification:'Existing Item Review & Update',review:'Existing Item Review & Update'};
  var PLATFORM_LABELS={performance:'Performance',grc:'GRC'};
  var ITEM_TYPES={
    performance:[
      {value:'kpi_definition',label:'KPI Definition / Indicator',key:'kpis'},
      {value:'benchmark',label:'Benchmark',key:'kpis'},
      {value:'target',label:'Target',key:'kpis'},
      {value:'formula',label:'Calculation Formula',key:'kpis'},
      {value:'data_source',label:'Data Source',key:'kpis'},
      {value:'quarterly_result',label:'Quarterly Result',key:'kpis'},
      {value:'gap_analysis',label:'Gap Analysis',key:'kpis'},
      {value:'corrective_action',label:'Corrective Action',key:'kpis'},
      {value:'ownership',label:'KPI Ownership / Responsibility',key:'kpis'},
      {value:'dashboard_view',label:'Dashboard / Visualization',key:'kpis'}
    ],
    grc:[
      {value:'policy',label:'Policy / Procedure',key:'policies'},
      {value:'form',label:'Form',key:'forms'},
      {value:'plan',label:'Plan',key:'plans'},
      {value:'operational_plan',label:'Operational Plan',key:'operationalPlans'},
      {value:'code',label:'Emergency Code Record',key:'codes'},
      {value:'action',label:'Action Plan',key:'actions'},
      {value:'initiative',label:'Initiative',key:'initiatives'},
      {value:'manual',label:'Manual / Guideline',key:'manuals'},
      {value:'report',label:'Report',key:'reports'},
      {value:'cbahi',label:'CBAHI Requirement',key:'cbahi'},
      {value:'jci',label:'JCI Requirement',key:'jci'}
    ]
  };
  var DEPARTMENTS={
    safety:{name:'Safety',code:'SAF'},maintenance:{name:'Maintenance',code:'MNT'},housekeeping:{name:'Housekeeping',code:'HSK'},
    laundry:{name:'Laundry',code:'LND'},projects:{name:'Project Management',code:'PRJ'},governance:{name:'Governance & Performance',code:'GOV'},division:{name:'Governance & Performance',code:'GOV'}
  };

  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function role(){if(typeof window._normalizePortalRole==='function')return window._normalizePortalRole(window._fbRole||window.currentUserRole||'viewer');return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
  function isAdmin(){return role()==='admin'||role()==='super_admin';}
  function isGovernancePerformanceManager(){return role()==='governance_performance_manager';}
  function hasAllDashboardScope(){return isAdmin()||isGovernancePerformanceManager();}
  function canViewDashboard(){var r=role(),p=Array.isArray(window._fbPerms)?window._fbPerms:[];return isAdmin()||r==='governance_performance_manager'||p.indexOf('view_request_analytics')>=0||p.indexOf('*')>=0;}
  function isSuperAdmin(){return role()==='super_admin';}
  function isDepartmentManager(){return role()==='department_manager';}
  function userEmail(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
  function rawUserDepartment(){return Object.prototype.hasOwnProperty.call(window,'_fbDept')?window._fbDept:window.currentUserDept;}
  function userDepartmentKey(){
    /* Department Manager queues are fetched with a server-fresh Firestore
       profile. Use that exact canonical department for every post-fetch filter
       too; falling back to a stale _fbDept here used to fetch the right rows and
       then immediately hide them from the manager UI. */
    if(isDepartmentManager()&&window.__grcManagerDepartmentKey)return String(window.__grcManagerDepartmentKey||'');
    var raw=String(rawUserDepartment()==null?'':rawUserDepartment()).trim();
    if(!raw||/^(null|none|undefined|n\/?a|na|unassigned|not assigned|-|—)$/i.test(raw))return'';
    var low=raw.toLowerCase(),compact=low.replace(/[^a-z0-9\u0600-\u06ff]+/g,' '),tokens=compact.split(/\s+/).filter(Boolean),has=function(x){return tokens.indexOf(x)>=0;};
    if(low.indexOf('السلامة')>=0||low.indexOf('سلامة')>=0||low.indexOf('safety')>=0||has('saf'))return'safety';
    if(low.indexOf('الصيانة')>=0||low.indexOf('صيانة')>=0||low.indexOf('maintenance')>=0||has('mnt'))return'maintenance';
    if(low.indexOf('المغسلة')>=0||low.indexOf('مغسلة')>=0||low.indexOf('الغسيل')>=0||low.indexOf('laundry')>=0||has('lnd')||has('lund'))return'laundry';
    if(low.indexOf('النظافة')>=0||low.indexOf('نظافة')>=0||low.indexOf('housekeeping')>=0||low.indexOf('cleaning')>=0||has('hsk')||has('hk'))return'housekeeping';
    if(low.indexOf('المشاريع')>=0||low.indexOf('مشاريع')>=0||low.indexOf('project')>=0||has('prj')||has('pmd')||low==='pm')return'projects';
    if(low.indexOf('الحوكمة')>=0||low.indexOf('حوكمة')>=0||low.indexOf('الأداء')>=0||low.indexOf('الاداء')>=0||low.indexOf('governance')>=0||low.indexOf('performance')>=0||has('gov'))return'governance';
    if(low.indexOf('facility management')>=0||low.indexOf('facilities management')>=0||low.indexOf('المرافق')>=0||low.indexOf('division')>=0||low==='fms')return'division';
    var normalized=low.replace(/[\s&/-]+/g,'_');return DEPARTMENTS[normalized]?normalized:'';
  }
  function workflowStage(r){var x=String(r&&r.workflowStage||r&&r.status||'').trim().toLowerCase();return x==='submitted'?'pending_super_admin':x;}
  function workflowLabel(r){var x=workflowStage(r),m={pending_department_manager:'Pending Department Manager Approval',pending_super_admin:'Pending Super Admin Review',rejected_manager:'Rejected by Department Manager',responded:'Super Admin Response Sent',awaiting_requester_information:'Awaiting Requester Information',clarification_received:'Clarification Received',requester_confirmed:'Requester Confirmed',closed:'Closed'};return m[x]||String(x||'Open').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function canonicalDeptKey(value){
    var raw=String(value==null?'':value).trim().toLowerCase();
    if(!raw)return'';
    if(typeof window._grcCanonicalDepartment==='function'){try{return String(window._grcCanonicalDepartment(raw)||'').toLowerCase();}catch(_){} }
    raw=raw.replace(/[\s_\/-]+/g,' ');
    if(/^(project|projects|pmd|prj|pm)( management| department)?$/.test(raw))return'projects';
    if(/^(safety|saf)( management| department)?$/.test(raw))return'safety';
    if(/^(maintenance|mnt)( management| department)?$/.test(raw))return'maintenance';
    if(/^(housekeeping|hsk|hk|cleaning)( management| department)?$/.test(raw))return'housekeeping';
    if(/^(laundry|lnd|lund)( management| department)?$/.test(raw))return'laundry';
    if(/^(governance|gov)( and performance| & performance| performance| department)?$/.test(raw))return'governance';
    return raw.replace(/ /g,'_');
  }
  function isManagerApprovalRecord(r){
    if(!isDepartmentManager()||!userDepartmentKey())return false;
    var requestDept=canonicalDeptKey(r&&r.departmentKey||r&&r.department||r&&r.departmentRaw||'');
    var myDept=canonicalDeptKey(userDepartmentKey());
    return !!requestDept&&!!myDept&&requestDept===myDept&&String(r&&r.userEmail||'').toLowerCase().trim()!==userEmail();
  }
  function isManagerOwnRequest(r){return isDepartmentManager()&&String(r&&r.userEmail||'').toLowerCase().trim()===userEmail();}
  function isOwnRequest(r){return String(r&&r.userEmail||'').toLowerCase().trim()===userEmail();}
  function departmentName(k){return(DEPARTMENTS[k]&&DEPARTMENTS[k].name)||String(k||'—');}
  function departmentCode(k){return(DEPARTMENTS[k]&&DEPARTMENTS[k].code)||'FMS';}
  function root(){return document.getElementById(currentRootId);}
  function host(){var r=root();return r&&r.querySelector('#advViewHost');}
  function recordPlatform(r){return String(r&&r.platform||'grc').toLowerCase()==='performance'?'performance':'grc';}
  function normalizedType(r){var t=String(r&&r.requestType||'');return t==='new'?'new':'edit_review';}
  function typeLabel(r){return TYPE_LABELS[String(r&&r.requestType||'')]||TYPE_LABELS[normalizedType(r)];}
  function isRelevantRecord(r){return r&&recordPlatform(r)===currentPlatform&&String(r.serviceType||'review_guidance')!=='session';}
  function formatDate(v,withTime){if(!v)return'—';var d=v&&v.toDate?v.toDate():new Date(v);if(isNaN(d.getTime()))return'—';try{return new Intl.DateTimeFormat('en-GB',withTime?{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',year:'numeric'}).format(d);}catch(_){return d.toLocaleString();}}
  function timeMs(v){if(!v)return 0;var d=v&&v.toDate?v.toDate():new Date(v);return isNaN(d.getTime())?0:d.getTime();}
  function responseMinutes(r){var a=timeMs(r.createdAt),b=timeMs(r.firstRespondedAt||r.respondedAt);if(a&&b&&b>=a)return Math.max(1,Math.ceil((b-a)/60000));var stored=Number(r.responseMinutes);return Number.isFinite(stored)&&stored>0?stored:null;}
  function durationText(m){if(m==null)return'Not Responded';if(m<60)return m+' min';var h=Math.floor(m/60),x=m%60;if(h<24)return h+' hr'+(h===1?'':'s')+(x?' '+x+' min':'');var d=Math.floor(h/24),rh=h%24;return d+' day'+(d===1?'':'s')+(rh?' '+rh+' hrs':'');}
  function statusLabel(s){var key=statusKey(s);return STATUS_LABELS[key]||'Open';}
  function statusBadge(s){var key=statusKey(s);return'<span class="adv-status '+esc(key)+'">'+esc(STATUS_LABELS[key])+'</span>';}
  function stars(v){var n=Number(v||0);return n?'<span title="'+n+' out of 5">'+('★'.repeat(n))+('☆'.repeat(Math.max(0,5-n)))+'</span>':'—';}
  function toast(message){var r=root()||document.body,old=r.querySelector&&r.querySelector('.adv-toast');if(old)old.remove();var e=document.createElement('div');e.className='adv-toast';e.textContent=message;r.appendChild(e);setTimeout(function(){e.remove();},4200);}
  function clearFieldErrors(){
    document.querySelectorAll('#advModal .adv-field-invalid').forEach(function(el){el.classList.remove('adv-field-invalid');});
    document.querySelectorAll('#advModal [aria-invalid="true"]').forEach(function(el){el.removeAttribute('aria-invalid');});
  }
  function clearSubmitError(){var box=document.getElementById('advSubmitError');if(box){box.style.display='none';box.textContent='';}clearFieldErrors();}
  function markFieldInvalid(target){
    if(!target)return;
    var el=typeof target==='string'?document.getElementById(target):target;if(!el)return;
    try{el.setAttribute('aria-invalid','true');}catch(_){}
    var wrap=el.closest&&el.closest('.adv-field,.adv-form-dependency');
    if(!wrap&&el.id==='advRelatedField')wrap=el;
    if(wrap)wrap.classList.add('adv-field-invalid');
  }
  function showSubmitError(message,target){message=String(message||'Request submission failed.');if(target)markFieldInvalid(target);var box=document.getElementById('advSubmitError');if(box){box.innerHTML='<strong>Request not submitted</strong><span>'+esc(message)+'</span>';box.style.display='flex';try{box.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_){}}toast(message);}
  function friendlySubmitError(error){
    var raw=String(error&&error.code||error&&error.message||error||'').trim(),text=raw.toLowerCase();
    if(!navigator.onLine)return'No internet connection. Reconnect, then submit the request again.';
    if(/submission-timeout|deadline-exceeded|timed out|timeout/.test(text))return'The request service did not respond in time. Check My Requests first; if the request is not listed, check the connection and submit it again.';
    if(/rules-version-mismatch/.test(text))return raw.replace(/^rules-version-mismatch:/,'');
    if(/profile-department-unrecognized/.test(text)){var dept=raw.split(':').slice(1).join(':')||'Unknown';return'Your account department is not recognized by the Review & Development workflow ('+dept+'). Update the user department to a supported department, then sign in again.';}
    if(/permission-denied|missing or insufficient permissions/.test(text)){var diag=raw.indexOf(':')>=0?raw.split(':').slice(1).join(':').trim():'';return'Firebase rejected this request because the deployed Firestore Rules do not allow this operation.'+(diag?' Diagnostic: '+diag:'');}
    if(/unauthenticated|not authenticated/.test(text))return'Your session is no longer active. Sign in again, then resubmit the request.';
    if(/unavailable|network-request-failed|failed to fetch|offline/.test(text))return'The request service is temporarily unavailable. Check the connection and try again.';
    if(/resource-exhausted|quota/.test(text))return'The request could not be saved because the database service limit was reached. Contact the system administrator.';
    return raw||'The request could not be submitted. Review the entered data and try again.';
  }
  function submitWithTimeout(promise,ms){return Promise.race([promise,new Promise(function(_,reject){setTimeout(function(){reject(new Error('submission-timeout'));},ms||20000);})]);}
  function showSubmitSuccess(code,warning,workflowStage,departmentKey){var old=document.getElementById('advSubmitSuccess');if(old)old.remove();var stage=String(workflowStage||''),dept=departmentName(departmentKey||userDepartmentKey()),routeHtml='';if(stage==='pending_department_manager'){routeHtml='<p>Your request has been sent to the <strong>'+esc(dept)+' Department Manager</strong> for approval.</p><div class="adv-success-route"><strong>Approval Route</strong><span>Department Manager → Super Admin</span><small>Once the Department Manager approves the request, it will be forwarded automatically to Super Admin for final review. If the Department Manager rejects it, the request will be closed and will not be forwarded.</small></div>';}else{routeHtml='<p>Your request has been sent directly to <strong>Super Admin</strong> for review.</p><div class="adv-success-route"><strong>Approval Route</strong><span>Super Admin</span><small>No Department Manager approval is required for this request.</small></div>';}var ov=document.createElement('div');ov.id='advSubmitSuccess';ov.className='adv-success-backdrop';ov.innerHTML='<div class="adv-success-card" role="dialog" aria-modal="true" aria-labelledby="advSuccessTitle"><div class="adv-success-icon">✓</div><h2 id="advSuccessTitle">Request Submitted Successfully</h2>'+routeHtml+(code?'<div class="adv-success-code"><span>Request Code</span><strong>'+esc(code)+'</strong></div>':'')+(warning?'<div class="adv-success-warning">'+esc(warning)+'</div>':'')+'<button type="button" class="adv-btn primary adv-success-ok" onclick="window._advCloseSubmitSuccess()">OK</button></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)window._advCloseSubmitSuccess();});setTimeout(function(){var b=ov.querySelector('button');if(b)b.focus();},20);}
  window._advCloseSubmitSuccess=function(){var x=document.getElementById('advSubmitSuccess');if(x)x.remove();};
  function apiReady(n){return typeof window[n]==='function';}
  function audit(a,d){try{if(typeof window.addAudit==='function')window.addAudit(a,d);else if(typeof window._recordAuditDirect==='function')window._recordAuditDirect(a,d);}catch(_){}}
  function approved(r){return statusKey(r&&r.status)==='closed';}
  function isOpen(r){return statusKey(r&&r.status)!=='closed';}
  function canRateReview(r){return statusKey(r&&r.status)==='closed'&&String(r&&r.status||'').toLowerCase()!=='cancelled';}

  function moduleCard(id,icon,title,desc,sa){return'<button type="button" class="adv-module-card '+(currentView===id?'is-active':'')+'" data-adv-view="'+id+'" onclick="window._advSwitchView(\''+id+'\')">'+(sa?'<span class="adv-sa-pill">SUPER ADMIN</span>':'')+'<span class="adv-module-icon">'+icon+'</span><h3>'+title+'</h3><p>'+desc+'</p></button>';}
  function pageSkeleton(platform,rootId){
    currentPlatform=platform;currentRootId=rootId;var label=PLATFORM_LABELS[platform];
    return'<div class="adv-platform-root" id="'+rootId+'" data-adv-platform="'+platform+'"><div class="adv-shell">'+
      '<div class="grc-hero adv-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">'+label+' · INTERNAL REVIEW & DEVELOPMENT SERVICE</div><h1>Review & Development Center</h1><p>Request an update and professional review for an existing record, or submit a request for a new record. Available items are limited to this platform and the requester\'s department.</p></div></div></div>'+
      '<div class="adv-privacy-note"><span class="adv-privacy-icon">i</span><div><strong>Before submitting a request</strong>Choose Existing Item Review & Update for an item already listed, or New Item Request for an item that does not yet exist. Request details are available to authorized Governance & Performance analytics roles; approval actions remain limited to the assigned Department Manager and Super Admin.</div></div>'+
      '<div class="adv-module-grid '+(canViewDashboard()?'adv-module-grid-admin':'adv-module-grid-user')+'">'+(canViewDashboard()?moduleCard('dashboard','▦','Review & Development Dashboard',hasAllDashboardScope()?'Approval indicators and a non-personal request register across all FMS departments.':'Approval indicators and a non-personal request register scoped to this platform and department.'):'')+moduleCard('requests','✦','Review & Development Requests',isAdmin()?'Review requests, request information, respond and close completed cases.':'Submit and follow Existing Item Review & Update or New Item Request cases.')+'</div>'+
      '<div id="advViewHost"><div class="adv-loading">Loading Review & Development Center…</div></div></div></div>';
  }
  window._grcAdvisoryPage=function(){return pageSkeleton('grc','advRootGrc');};
  window._grcAdvisoryMount=function(){mount('grc','advRootGrc');};
  window._performanceAdvisoryMount=function(){var h=document.getElementById('performanceAdvisoryRoot');if(!h)return;if(!h.querySelector('#advRootPerformance'))h.innerHTML=pageSkeleton('performance','advRootPerformance');mount('performance','advRootPerformance');};
  function applyLivePayload(payload){if(!payload||!root())return;livePayload=payload;var next=currentView==='dashboard'?payload.publicRecords:payload.records;if(!Array.isArray(next))return;var incoming=next.filter(isRelevantRecord),errs=payload.errors||{},keys=currentView==='dashboard'?['primary']:((isDepartmentManager()?['primary','own']:['primary'])),messages=keys.filter(function(k){return !!errs[k];}).map(function(k){return k+': '+String(errs[k]);});if(errs.fallback)console.warn('[Review Development] legacy fallback sync skipped',errs.fallback);if(messages.length)console.warn('[Review Development] live sync warning',messages.join(' · '));/* Keep the last verified rows on a transient listener denial instead of replacing the page with an empty/error state. */if(!messages.length||incoming.length||!records.length)records=incoming;lastLoadError='';loading=false;renderView();if(currentView==='requests'&&!isAdmin())showRatingNotification();}
  function mount(platform,rootId){
    if(liveUnsub){try{liveUnsub();}catch(_){}liveUnsub=null;}
    livePayload=null;currentPlatform=platform;currentRootId=rootId;currentView='requests';dashboardFilter='all';departmentFilter='';loading=true;lastLoadError='';renderView();
    if(isDepartmentManager()){
      /* grc-risk-workflow owns the single manager approval listener. Do not open
         another live listener from this page. The page consumes its shared payload. */
      var onManagerQueue=function(e){if(!e||!e.detail)return;livePayload=e.detail;applyLivePayload(e.detail);};
      window.addEventListener('grc:managerReviewQueueUpdated',onManagerQueue);
      liveUnsub=function(){window.removeEventListener('grc:managerReviewQueueUpdated',onManagerQueue);};
      if(window.__grcManagerReviewPayload)onManagerQueue({detail:window.__grcManagerReviewPayload});
      loadRecords(false);
      return;
    }
    if(apiReady('_advisorySubscribe'))liveUnsub=window._advisorySubscribe(applyLivePayload);else{loading=false;loadRecords();}
  }
  window._advSwitchView=function(view){if(view==='management')view='requests';if(view==='dashboard'&&!canViewDashboard())view='requests';currentView=view;dashboardSearch='';dashboardStatus='';adminSearch='';adminStatus='';adminDepartment='';var r=root();if(r)r.querySelectorAll('.adv-module-card').forEach(function(x){x.classList.toggle('is-active',x.getAttribute('data-adv-view')===view);});if(livePayload)applyLivePayload(livePayload);else loadRecords();};

  async function loadRecords(){
    if(loading)return;loading=true;lastLoadError='';renderView();
    try{
      var next;
      if(currentView==='dashboard'){
        if(!apiReady('_advisoryGetPublic'))throw new Error('Record request data service is unavailable.');
        next=await window._advisoryGetPublic();managerRiskRecords=[];
      }else if(isAdmin()){
        if(!apiReady('_advisoryGetAll'))throw new Error('Record request data service is unavailable.');
        next=await window._advisoryGetAll();managerRiskRecords=[];
      }else if(isDepartmentManager()){
        /* Department Manager approval inbox is Review & Development only.
           Risk / Incident requests are intentionally not loaded on this page.
           Fetch the manager's own submissions separately so they remain visible
           in Submitted Review & Development Requests without entering the
           approval inbox. */
        if(!apiReady('_advisoryGetManagerQueue')||!apiReady('_advisoryGetMine'))throw new Error('Review & Development request services are unavailable.');
        var bundle=await Promise.allSettled([window._advisoryGetManagerQueue(),window._advisoryGetMine()]);
        var approvalRows=bundle[0].status==='fulfilled'&&Array.isArray(bundle[0].value)?bundle[0].value:[];
        var ownRows=bundle[1].status==='fulfilled'&&Array.isArray(bundle[1].value)?bundle[1].value:[];
        var byId={};
        approvalRows.concat(ownRows).forEach(function(r){if(r&&r.id)byId[String(r.id)]=r;});
        next=Object.keys(byId).map(function(k){return byId[k];});
        managerRiskRecords=[];
        var errs=[];
        if(bundle[0].status==='rejected')errs.push('Review & Development approval queue: '+String(bundle[0].reason&&bundle[0].reason.message||bundle[0].reason));
        if(bundle[1].status==='rejected')errs.push('My Review & Development Requests: '+String(bundle[1].reason&&bundle[1].reason.message||bundle[1].reason));
        if(errs.length)lastLoadError=errs.join(' · ');
      }else{
        if(!apiReady('_advisoryGetMine'))throw new Error('Record request data service is unavailable.');
        next=await window._advisoryGetMine();managerRiskRecords=[];
      }
      records=(next||[]).filter(isRelevantRecord);
      if(isDepartmentManager()&&typeof window._grcRiskInjectManagerQueue==='function')window._grcRiskInjectManagerQueue(managerRiskRecords,records.filter(isManagerApprovalRecord));
    }catch(e){
      console.warn('[Review Development] refresh failed',e&&e.message||e);
      if(!records.length)lastLoadError=[lastLoadError,String(e&&e.message||e||'Unable to load requests.')].filter(Boolean).join(' · ');
    }
    loading=false;renderView();if(currentView==='requests'&&!isAdmin())showRatingNotification();
  }
  function refreshAfterMutation(){return isDepartmentManager()?loadRecords():(liveUnsub?Promise.resolve():loadRecords());}
  window._advReload=function(){loadRecords();};
  function renderView(){var h=host();if(!h)return;if(loading){h.innerHTML='<div class="adv-loading">Loading Review & Development Center…</div>';return;}if(currentView==='dashboard'&&!canViewDashboard())currentView='requests';if(currentView==='management')currentView='requests';h.innerHTML=(currentView==='dashboard'?dashboardHtml():requestsHtml());}

  function scopedPublicRecords(){var all=records.filter(isRelevantRecord);return hasAllDashboardScope()?all:all.filter(function(r){return r.departmentKey===userDepartmentKey();});}
  function filterRecords(base){var q=dashboardSearch.toLowerCase().trim();return base.filter(function(r){if(departmentFilter&&r.departmentKey!==departmentFilter)return false;if(dashboardStatus&&statusKey(r.status)!==dashboardStatus)return false;var t=normalizedType(r);if(dashboardFilter==='edit_review'&&t!=='edit_review')return false;if(dashboardFilter==='new'&&t!=='new')return false;if(dashboardFilter==='approved'&&!approved(r))return false;if(dashboardFilter==='open'&&statusKey(r.status)!=='open')return false;if(dashboardFilter==='in_progress'&&statusKey(r.status)!=='in_progress')return false;if(q&&[r.code,typeLabel(r),r.category,relatedText(r),departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase().indexOf(q)<0)return false;return true;});}
  function metric(label,value,sub,filter,tone){var icons={info:'▦',good:'✓',warn:'△',purple:'◇',bad:'!'};return'<div class="grc-metric-card adv-metric-card '+tone+' clickable '+(dashboardFilter===filter?'is-active':'')+'" onclick="window._advDashboardFilter(\''+filter+'\')" tabindex="0" role="button"><div class="grc-metric-top"><span class="grc-metric-icon">'+(icons[tone]||'▦')+'</span></div><div class="grc-metric-value">'+value+'</div><div class="grc-metric-label">'+label+'</div><div class="grc-metric-foot"><span class="grc-metric-sub">'+sub+'</span><span class="grc-metric-arrow">›</span></div></div>';}
  function dashboardMetric(label,value,sub,tone){return'<div class="grc-metric-card adv-metric-card '+tone+'"><div class="grc-metric-top"><span class="grc-metric-icon">'+(tone==='good'?'✓':tone==='warn'?'△':'▦')+'</span></div><div class="grc-metric-value">'+value+'</div><div class="grc-metric-label">'+label+'</div><div class="grc-metric-foot"><span class="grc-metric-sub">'+sub+'</span></div></div>';}
  function requestTypeDashboard(title,type,base){
    var rows=base.filter(function(r){return normalizedType(r)===type;}),open=rows.filter(function(r){return statusKey(r.status)==='open';}).length,progress=rows.filter(function(r){return statusKey(r.status)==='in_progress';}).length,closed=rows.filter(function(r){return statusKey(r.status)==='closed';}).length,rate=rows.length?Math.round(closed/rows.length*100):0;
    return'<div class="adv-type-dashboard"><div class="adv-type-dashboard-head"><div><h3>'+title+'</h3><p>'+PLATFORM_LABELS[currentPlatform]+' · Request workflow summary</p></div><span>'+rows.length+' requests</span></div><div class="adv-type-dashboard-metrics">'+dashboardMetric('Total',rows.length,'All requests in this category','info')+dashboardMetric('Open',open,'Newly submitted requests','bad')+dashboardMetric('In Progress',progress,'Being handled or awaiting information','warn')+dashboardMetric('Closed',closed,'Closed or cancelled requests','good')+dashboardMetric('Closure Rate',rate+'%',closed+' closed of '+rows.length+' requests','good')+'</div></div>';
  }
  function dashboardHtml(){
    var base=scopedPublicRecords(),editCount=base.filter(function(r){return normalizedType(r)==='edit_review';}).length,newCount=base.filter(function(r){return normalizedType(r)==='new';}).length,openCount=base.filter(function(r){return statusKey(r.status)==='open';}).length,progressCount=base.filter(function(r){return statusKey(r.status)==='in_progress';}).length,approvedCount=base.filter(approved).length,rate=base.length?Math.round(approvedCount/base.length*100):0,displayed=filterRecords(base);
    return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Review & Development Dashboard</div><div class="grc-section-sub">'+(hasAllDashboardScope()?'All FMS departments · '+PLATFORM_LABELS[currentPlatform]:'Department scope: '+esc(departmentName(userDepartmentKey()))+' · '+PLATFORM_LABELS[currentPlatform])+'</div></div><span class="grc-section-badge">No personal data</span></div><div class="adv-metric-grid">'+
      metric('Total Requests',base.length,'All submitted requests','all','info')+metric('New Item Requests',newCount,base.length?Math.round(newCount/base.length*100)+'% of total':'0% of total','new','info')+metric('Existing Item Review & Update',editCount,base.length?Math.round(editCount/base.length*100)+'% of total':'0% of total','edit_review','purple')+metric('Open Requests',openCount,'Open requests','open','bad')+metric('In Progress Requests',progressCount,'Requests currently being handled','in_progress','warn')+metric('Closed Requests',approvedCount,'Closed or cancelled requests','approved','good')+metric('Closure Rate',rate+'%',approvedCount+' closed of '+base.length+' requests','approved','good')+
      '</div>'+requestTypeDashboard('New Item Requests Dashboard','new',base)+requestTypeDashboard('Existing Item Review & Update Dashboard','edit_review',base)+registerHtml(displayed,base.length)+'</section>';
  }
  function filterTitle(){return{all:'All Requests',open:'Open Requests',in_progress:'In Progress',edit_review:'Existing Item Review & Update',new:'New Item Requests',approved:'Closed Requests'}[dashboardFilter]||'All Requests';}
  function registerHtml(list,total){var dept=hasAllDashboardScope()?'<select onchange="window._advDepartmentFilter(this.value,true)"><option value="">All Departments</option>'+Object.keys(DEPARTMENTS).filter(function(k){return k!=='division';}).map(function(k){return'<option value="'+k+'" '+(departmentFilter===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join('')+'</select>':'';return'<div class="adv-card" style="margin-top:14px"><div class="adv-register-toolbar"><div><h3>Request & Review Register</h3><p>Each row contains non-personal request data only.</p></div><div class="adv-filter-note">Showing <b>'+list.length+'</b> of <b>'+total+'</b> requests · '+esc(filterTitle())+'</div></div><div class="adv-filters"><input value="'+esc(dashboardSearch)+'" placeholder="Search by code, item type or related record" oninput="window._advSetDashboardFilter(\'search\',this.value)">'+dept+'<select onchange="window._advSetDashboardFilter(\'status\',this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(dashboardStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><button class="adv-btn ghost" onclick="window._advResetFilters()">Reset</button></div>'+publicTable(list)+'</div>';}
  function relatedText(r){var a=Array.isArray(r.relatedItems)?r.relatedItems:[],v=a.map(function(x){return x.code?x.code+' — '+x.name:(x.name||x.label||'');}).filter(Boolean);if(r.relatedNewText)v.push('New: '+r.relatedNewText);return v.join('; ')||'—';}
  function publicTable(list){return'<div class="adv-table-wrap"><table class="adv-table"><thead><tr><th>Request Code</th><th>Request Type</th><th>Item Type</th><th>Related Record(s)</th><th>Department</th><th>Priority</th><th>Request Date</th><th>Status</th><th>First Response</th><th>Response Duration</th><th>Rating</th></tr></thead><tbody>'+(list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(typeLabel(r))+'</td><td>'+esc(r.category||r.relatedType||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(r.priority||'Medium')+'</td><td>'+formatDate(r.createdAt,false)+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td>'+durationText(responseMinutes(r))+'</td><td>'+stars(r.rating)+'</td></tr>';}).join(''):'<tr><td colspan="11"><div class="adv-empty">No requests match the selected filters.</div></td></tr>')+'</tbody></table></div>';}
  window._advDashboardFilter=function(f){dashboardFilter=f;renderView();setTimeout(function(){var r=root(),t=r&&r.querySelector('.adv-table-wrap');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},30);};
  window._advDepartmentFilter=function(k,fromSelect){departmentFilter=fromSelect?k:(departmentFilter===k?'':k);renderView();};
  window._advSetDashboardFilter=function(k,v){if(k==='search')dashboardSearch=String(v||'');if(k==='status')dashboardStatus=String(v||'');renderView();};
  window._advResetFilters=function(){dashboardFilter='all';departmentFilter='';dashboardSearch='';dashboardStatus='';renderView();};

  function requestsHtml(){return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Review & Development Requests</div><div class="grc-section-sub">'+(isAdmin()?'Review and respond to '+PLATFORM_LABELS[currentPlatform]+' requests.':isDepartmentManager()?'Approve Review & Development requests from your department, then follow your own submitted requests below.':'Submit an Existing Item Review & Update request or a New Item Request.')+'</div></div><button class="grc-primary-btn" onclick="window._advOpenGuidanceRequest()">＋ Submit Request</button></div>'+(isAdmin()?adminRequestsHtml():isDepartmentManager()?managerRequestsHtml():ownRequestsHtml())+'</section>';}
  function ownRequestsHtml(){var list=records.filter(function(r){if(isDepartmentManager())return isManagerOwnRequest(r);return String(r&&r.userEmail||'').toLowerCase().trim()===userEmail();}).slice().sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});return'<div class="adv-card"><div class="adv-register-toolbar"><div><h3>Submitted Review & Development Requests</h3><p>Your '+PLATFORM_LABELS[currentPlatform]+' requests only.</p></div><button class="adv-btn ghost" onclick="window._advReload()">Refresh</button></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:980px"><thead><tr><th>Request Code</th><th>Request Type</th><th>Item Type</th><th>Related Record(s)</th><th>Submitted</th><th>Status</th><th>Approval Stage</th><th>Last Update</th><th>Rating</th><th></th></tr></thead><tbody>'+(list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(typeLabel(r))+'</td><td>'+esc(r.category||r.relatedType||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+statusBadge(r.status)+'</td><td><span class="adv-workflow-stage">'+esc(workflowLabel(r))+'</span></td><td>'+formatDate(r.updatedAt||r.respondedAt||r.createdAt,true)+'</td><td>'+stars(r.rating)+(r.ratingComment?'<div class="adv-rating-comment-mini">'+esc(r.ratingComment)+'</div>':'')+'</td><td><button class="adv-btn secondary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Show</button></td></tr>';}).join(''):'<tr><td colspan="10"><div class="adv-empty">No requests have been submitted yet.</div></td></tr>')+'</tbody></table></div></div>';}
  function managerRequestsHtml(){
    var review=records.filter(isManagerApprovalRecord);
    var error=lastLoadError?'<div class="adv-card" style="margin-bottom:12px;border-color:#f1b6b6;background:#fff7f7;color:#991b1b"><strong>Department approval sync error:</strong> '+esc(lastLoadError)+'</div>':'';
    var table='<div class="adv-card" style="margin-bottom:14px"><div class="adv-register-toolbar"><div><h3>Department Approval Requests</h3><p>All Review & Development requests for your department.</p></div><div class="adv-filter-note"><b>'+review.length+'</b> Pending</div></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:900px"><thead><tr><th>Request Code</th><th>Request Area</th><th>Requester</th><th>Approval Stage</th><th>Submitted</th><th></th></tr></thead><tbody>'+(review.length?review.map(function(x){var onclick="window._advOpenRequest('"+esc(x.id)+"')";return'<tr><td class="adv-code">'+esc(x.code||x.id)+'</td><td>'+esc(typeLabel(x))+'</td><td>'+esc(x.userName||x.userEmail||'—')+'</td><td><span class="adv-workflow-stage">'+esc(workflowLabel(x))+'</span></td><td>'+esc(formatDate(x.createdAt,true))+'</td><td><button class="adv-btn secondary" onclick="'+onclick+'">Review & Approve</button></td></tr>';}).join(''):'<tr><td colspan="6"><div class="adv-empty">No Review & Development requests are awaiting approval.</div></td></tr>')+'</tbody></table></div></div>';
    return error+table+ownRequestsHtml();
  }

  function filteredAdminRecords(){var q=adminSearch.toLowerCase().trim();return records.filter(function(r){var stage=workflowStage(r);if(stage==='pending_department_manager'||stage==='rejected_manager')return false;if(adminStatus&&r.status!==adminStatus)return false;if(adminDepartment&&r.departmentKey!==adminDepartment)return false;if(q&&[r.code,r.userName,r.userEmail,r.category,relatedText(r),departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase().indexOf(q)<0)return false;return true;}).sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});}
  function adminRequestsHtml(){var list=filteredAdminRecords();return'<div class="adv-personal-note"><strong>Authorized view:</strong> Requester name and email are available to Admin and Super Admin for response and follow-up.</div><div class="adv-filters"><input value="'+esc(adminSearch)+'" placeholder="Search by code, requester, email, department, item type or record" oninput="window._advSetAdminFilter(\'search\',this.value)"><select onchange="window._advSetAdminFilter(\'status\',this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(adminStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><select onchange="window._advSetAdminFilter(\'department\',this.value)"><option value="">All Departments</option>'+Object.keys(DEPARTMENTS).filter(function(k){return k!=='division';}).map(function(k){return'<option value="'+k+'" '+(adminDepartment===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join('')+'</select></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:1300px"><thead><tr><th>Request Code</th><th>Requester</th><th>Email</th><th>Department</th><th>Request Type</th><th>Item Type</th><th>Related Record(s)</th><th>Priority</th><th>Status</th><th>Submitted</th><th>First Response</th><th></th></tr></thead><tbody>'+(list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.userName||'—')+'</td><td>'+esc(r.userEmail||'—')+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(typeLabel(r))+'</td><td>'+esc(r.category||r.relatedType||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+esc(r.priority||'Medium')+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td><button class="adv-btn primary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Open & Respond</button></td></tr>';}).join(''):'<tr><td colspan="12"><div class="adv-empty">No requests found.</div></td></tr>')+'</tbody></table></div>';}
  window._advSetAdminFilter=function(k,v){if(k==='search')adminSearch=String(v||'');if(k==='status')adminStatus=String(v||'');if(k==='department')adminDepartment=String(v||'');renderView();};



  function performanceOptions(){var dept=userDepartmentKey(),items=[];try{var all=typeof window.allK==='function'?window.allK():(typeof allK==='function'?allK():[]);items=(all||[]).filter(function(k){var kd=String(k.dept||k.department||'').toLowerCase();return kd===dept||(dept==='projects'&&kd.indexOf('project')>=0)||(dept==='governance'&&(kd.indexOf('govern')>=0||kd.indexOf('performance')>=0));}).map(function(k){return{type:'kpi',id:String(k.id||k.code||''),code:String(k.id||k.code||''),name:String(k.nameEn||k.name||k.title||'KPI')};});}catch(_){}return{kpis:items};}
  function grcOptions(){try{if(typeof window._grcGetAdvisoryOptions==='function')return window._grcGetAdvisoryOptions(userDepartmentKey())||{};}catch(_){}return{};}
  function itemDef(value){return(ITEM_TYPES[currentPlatform]||[]).find(function(x){return x.value===value;})||null;}
  function optionsFor(def){var data=currentPlatform==='performance'?performanceOptions():grcOptions();return def&&Array.isArray(data[def.key])?data[def.key]:[];}

  window._advOpenGuidanceRequest=function(){closeModal();document.body.classList.add('adv-modal-open');var dept=userDepartmentKey(),ov=document.createElement('div');ov.id='advModal';ov.className='adv-modal-backdrop';ov.innerHTML='<div class="adv-modal"><div class="adv-modal-head"><div><h2>New Review & Development Request</h2><p>'+PLATFORM_LABELS[currentPlatform]+' · '+esc(departmentName(dept))+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body"><div class="adv-form"><div class="adv-field"><label>Request Type *</label><select id="advRequestType" onchange="window._advTypeChanged()"><option value="">Select request type</option><option value="edit_review">Existing Item Review & Update</option><option value="new">New Item Request</option></select></div><div class="adv-field" id="advItemTypeField" style="display:none"><label>Item Type *</label><select id="advItemType" onchange="window._advItemTypeChanged()"><option value="">Select item type</option></select></div><div class="adv-field full" id="advRelatedField" style="display:none"></div><div class="adv-field full"><label>Request Title *</label><input id="advTitle" placeholder="Enter a concise request title"></div><div class="adv-field full"><label>Request Details *</label><textarea id="advDetails" placeholder="Describe the review, proposed update, or new item requirement"></textarea></div><div class="adv-field"><label>Priority</label><select id="advPriority"><option>Low</option><option selected>Medium</option><option>High</option></select></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advAttachment" type="file"><small>Maximum file size: 5 MB.</small></div></div></div><div id="advSubmitError" class="adv-error" style="display:none;margin:0 18px 12px"></div><div class="adv-modal-actions"><button class="adv-btn ghost" onclick="window._advCloseModal()">Cancel</button><button id="advSubmitBtn" class="adv-btn primary" onclick="window._advSubmitConsultation()">Submit Request</button></div></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});ov.addEventListener('input',function(e){var wrap=e.target&&e.target.closest&&e.target.closest('.adv-field-invalid');if(wrap)wrap.classList.remove('adv-field-invalid');if(e.target&&e.target.removeAttribute)e.target.removeAttribute('aria-invalid');});ov.addEventListener('change',function(e){var wrap=e.target&&e.target.closest&&e.target.closest('.adv-field-invalid');if(wrap)wrap.classList.remove('adv-field-invalid');if(e.target&&e.target.removeAttribute)e.target.removeAttribute('aria-invalid');});};
  window._advTypeChanged=function(){var type=String((document.getElementById('advRequestType')||{}).value||''),field=document.getElementById('advItemTypeField'),sel=document.getElementById('advItemType'),related=document.getElementById('advRelatedField');if(!field||!sel)return;if(!type){field.style.display='none';sel.innerHTML='<option value="">Select item type</option>';if(related){related.style.display='none';related.innerHTML='';}return;}field.style.display='flex';sel.innerHTML='<option value="">Select item type</option>'+(ITEM_TYPES[currentPlatform]||[]).map(function(x){return'<option value="'+x.value+'">'+esc(x.label)+'</option>';}).join('');if(related){related.style.display='none';related.innerHTML='';}};
  function relatedOptionList(name,label,options,requiredText){
    return'<div class="adv-form-dependency"><label>'+esc(label)+' '+(requiredText||'')+'</label><div class="adv-related-list">'+(options.length?options.map(function(x){var val=encodeURIComponent(JSON.stringify(x));return'<label class="adv-related-option"><input type="checkbox" name="'+name+'" value="'+esc(val)+'"><span><b>'+esc(x.code||x.id||'')+'</b>'+esc(x.name||x.label||'')+'</span></label>';}).join(''):'<div class="adv-empty" style="padding:14px">No records are available for your department.</div>')+'</div></div>';
  }
  function benchmarkTypeField(){return'<div class="adv-form-dependency adv-benchmark-type"><label>Benchmark Type *</label><select id="advBenchmarkType"><option value="">Select benchmark type</option><option value="internal">Internal Benchmark</option><option value="external">External Benchmark</option></select></div>';}
  function formDependencyNote(){return'<div class="adv-dependency-note"><strong>Required link:</strong> Choose whether this form is linked to a Policy / Procedure or a Plan, then select at least one related record.</div>';}
  function formDependencySelector(data){
    return formDependencyNote()+'<div class="adv-form-dependency"><label>Form Reference Type *</label><select id="advFormDependencyType" onchange="window._advFormDependencyTypeChanged()"><option value="">Select Policy / Procedure or Plan</option><option value="policy">Policy / Procedure</option><option value="plan">Plan</option></select><div id="advFormDependencyOptions"></div></div>';
  }
  window._advFormDependencyTypeChanged=function(){
    var type=String((document.getElementById('advFormDependencyType')||{}).value||''),holder=document.getElementById('advFormDependencyOptions');if(!holder)return;var data=grcOptions(),options=type==='policy'?(Array.isArray(data.policies)?data.policies:[]):type==='plan'?(Array.isArray(data.plans)?data.plans:[]):[];
    holder.innerHTML=!type?'':relatedOptionList(type==='policy'?'advRelatedPolicy':'advRelatedPlan',type==='policy'?'Select Related Policy / Procedure(s)':'Select Related Plan(s)',options,'*');
  };
  window._advItemTypeChanged=function(){
    var type=String((document.getElementById('advRequestType')||{}).value||''),value=String((document.getElementById('advItemType')||{}).value||''),def=itemDef(value),related=document.getElementById('advRelatedField');
    if(!related)return;if(!type||!def){related.style.display='none';related.innerHTML='';return;}
    related.style.display='flex';
    var isForm=currentPlatform==='grc'&&def.value==='form',isBenchmark=currentPlatform==='performance'&&def.value==='benchmark';
    var dependencies=isForm?formDependencySelector(grcOptions()):'';
    var benchmark=isBenchmark?benchmarkTypeField():'';
    if(type==='new'){
      related.innerHTML='<label>Proposed '+esc(def.label)+' Name(s) *</label><textarea id="advRelatedNewText" placeholder="Enter the proposed name. Use a new line for more than one item."></textarea>'+benchmark+dependencies+'<input type="hidden" id="advRelatedType" value="'+esc(def.label)+'">';
      return;
    }
    var options=optionsFor(def);
    related.innerHTML=relatedOptionList('advRelatedItem','Select Existing '+def.label+' Record(s)',options,'*')+benchmark+dependencies+'<input type="hidden" id="advRelatedType" value="'+esc(def.label)+'">';
  };
  function selectedItemsByName(name){return Array.prototype.map.call(document.querySelectorAll('input[name="'+name+'"]:checked'),function(x){try{return JSON.parse(decodeURIComponent(x.value));}catch(_){return null;}}).filter(Boolean);}
  function selectedRelatedItems(){return selectedItemsByName('advRelatedItem').concat(selectedItemsByName('advRelatedPolicy'),selectedItemsByName('advRelatedPlan'));}
  window._advSubmitConsultation=async function(){
    clearSubmitError();
    var type=String((document.getElementById('advRequestType')||{}).value||''),itemValue=String((document.getElementById('advItemType')||{}).value||''),def=itemDef(itemValue),title=String((document.getElementById('advTitle')||{}).value||'').trim(),details=String((document.getElementById('advDetails')||{}).value||'').trim(),priority=String((document.getElementById('advPriority')||{}).value||'Medium'),file=(document.getElementById('advAttachment')||{}).files&&document.getElementById('advAttachment').files[0],primaryItems=selectedItemsByName('advRelatedItem'),policyItems=selectedItemsByName('advRelatedPolicy'),planItems=selectedItemsByName('advRelatedPlan'),formDependencyType=String((document.getElementById('advFormDependencyType')||{}).value||''),relatedItems=primaryItems.concat(policyItems,planItems),relatedNewText=String((document.getElementById('advRelatedNewText')||{}).value||'').trim(),isForm=currentPlatform==='grc'&&def&&def.value==='form',isBenchmark=currentPlatform==='performance'&&def&&def.value==='benchmark',benchmarkType=String((document.getElementById('advBenchmarkType')||{}).value||''),submitBtn=document.getElementById('advSubmitBtn');
    function stop(reason,target){showSubmitError(reason,target);try{var el=typeof target==='string'?document.getElementById(target):target;if(el&&el.focus)el.focus({preventScroll:true});}catch(_){}return false;}
    if(!type)return stop('Required field: select Request Type before submitting.','advRequestType');
    if(!def)return stop('Required field: select Item Type before submitting.','advItemType');
    if(!title)return stop('Required field: enter the Request Title before submitting.','advTitle');
    if(!details)return stop('Required field: enter the Request Details before submitting.','advDetails');
    if(type==='edit_review'&&!primaryItems.length)return stop('Required field: select at least one existing record before submitting.','advRelatedField');
    if(type==='new'&&!relatedNewText)return stop('Required field: enter the proposed new item name before submitting.','advRelatedNewText');
    if(isForm&&!formDependencyType)return stop('Required field: choose whether the form is linked to a Policy / Procedure or a Plan.','advFormDependencyType');
    if(isForm&&formDependencyType==='policy'&&!policyItems.length)return stop('Required field: select at least one related Policy / Procedure for the form.','advRelatedField');
    if(isForm&&formDependencyType==='plan'&&!planItems.length)return stop('Required field: select at least one related Plan for the form.','advRelatedField');
    if(isBenchmark&&!benchmarkType)return stop('Required field: select Internal Benchmark or External Benchmark.','advBenchmarkType');
    if(file&&file.size>5*1024*1024)return stop('The attachment must be 5 MB or smaller.','advAttachment');
    if(!navigator.onLine)return stop('No internet connection. Reconnect, then submit the request again.');
    if(!apiReady('_advisorySubmit'))return stop('The request service is still loading. Reload the page and try again.');
    var dept=userDepartmentKey(),oldText=submitBtn&&submitBtn.textContent,submitted=false;
    if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Submitting…';}
    try{
      var result=await submitWithTimeout(window._advisorySubmit({platform:currentPlatform,departmentKey:dept,departmentCode:departmentCode(dept),priority:priority,serviceType:'record_request_review',requestType:type,requestTypeLabel:TYPE_LABELS[type],category:def.label,title:title,details:details,relatedType:def.label,relatedItems:relatedItems,relatedNewText:type==='new'?relatedNewText:'',formDependencies:isForm?{dependencyType:formDependencyType,policies:policyItems,plans:planItems}:null,benchmarkType:isBenchmark?benchmarkType:''},file||null),20000);
      if(!result||(!result.id&&!result.code))throw new Error('The request service returned no confirmation number.');
      submitted=true;closeModal();currentView='requests';await refreshAfterMutation();showSubmitSuccess(result.code||result.id||'',result.warning||'',result.workflowStage||'',result.departmentKey||dept);
    }catch(e){
      showSubmitError(friendlySubmitError(e));
    }finally{
      if(!submitted&&submitBtn){submitBtn.disabled=false;submitBtn.textContent=oldText||'Submit Request';}
    }
  };



  window._advOpenPlatformRequest=function(platform){
    platform=platform==='performance'?'performance':'grc';
    if(platform==='grc'&&typeof window._grcSwitch==='function')window._grcSwitch('advisory');
    if(platform==='performance'&&typeof window.switchPage==='function')window.switchPage('advisory');
    setTimeout(function(){
      if(platform==='grc'){currentPlatform='grc';currentRootId='advRootGrc';}
      else{currentPlatform='performance';currentRootId='advRootPerformance';}
      window._advOpenGuidanceRequest();
    },180);
  };
  window._advOpenPlatformRequests=function(platform){
    platform=platform==='performance'?'performance':'grc';
    if(platform==='grc'&&typeof window._grcSwitch==='function')window._grcSwitch('advisory');
    if(platform==='performance'&&typeof window.switchPage==='function')window.switchPage('advisory');
    setTimeout(function(){
      currentPlatform=platform;currentRootId=platform==='grc'?'advRootGrc':'advRootPerformance';
      currentView='requests';
      var r=root();if(r)r.querySelectorAll('.adv-module-card').forEach(function(x){x.classList.toggle('is-active',x.getAttribute('data-adv-view')==='requests');});
      if(livePayload)applyLivePayload(livePayload);else loadRecords();
    },220);
  };

  window._advOpenRequest=async function(id){if(!apiReady('_advisoryGetOne'))return;try{selectedRequest=await window._advisoryGetOne(id);if(recordPlatform(selectedRequest)!==currentPlatform)throw new Error('This request belongs to another platform.');showRequestModal(selectedRequest);}catch(e){toast(String(e&&e.message||e));}};
  window._advOpenApprovalRequest=async function(id){currentPlatform='grc';currentRootId='advRootGrc';if(!apiReady('_advisoryGetOne'))return;try{selectedRequest=await window._advisoryGetOne(id);if(recordPlatform(selectedRequest)!=='grc')throw new Error('This request belongs to another platform.');showRequestModal(selectedRequest);}catch(e){toast(String(e&&e.message||e));}};
  function detail(l,v){return'<div class="adv-detail-item"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>';}
  function messageHtml(m){return'<div class="adv-message '+(m.senderRole==='admin'||m.senderRole==='super_admin'?'admin':'requester')+'"><div class="adv-message-head"><strong>'+esc(m.senderName||m.senderRole||'User')+'</strong><span>'+formatDate(m.createdAt,true)+'</span></div><div class="adv-message-body">'+esc(m.text||'')+'</div>'+attachmentHtml(m.attachments||[])+'</div>';}
  function attachmentHtml(list){return(list||[]).map(function(a){return'<button class="adv-attachment" onclick="window._advDownloadAttachment(\''+esc(selectedRequest&&selectedRequest.id||'')+'\',\''+esc(a.id)+'\',\''+esc(a.name||'attachment')+'\',\''+esc(a.type||'application/octet-stream')+'\','+Number(a.chunkCount||0)+')">▣ '+esc(a.name||'Attachment')+'</button>';}).join('');}
  function requestDetails(r){var canSeePersonal=canViewDashboard()||isManagerApprovalRecord(r)||isOwnRequest(r),personal=canSeePersonal?'<div class="adv-personal-note"><strong>Requester information:</strong> '+esc(r.userName||'—')+' · '+esc(r.userEmail||'—')+' · '+esc(departmentName(r.departmentKey))+'</div>':'';var meta='<div class="adv-detail-grid">'+detail('Request Type',typeLabel(r))+detail('Item Type',r.category||r.relatedType||'—')+(r.benchmarkType?detail('Benchmark Type',String(r.benchmarkType).replace(/^./,function(c){return c.toUpperCase();})+' Benchmark'):'')+detail('Priority',r.priority||'Medium')+detail('Approval Stage',workflowLabel(r))+detail('Created',formatDate(r.createdAt,true))+detail('First Response',formatDate(r.firstRespondedAt||r.respondedAt,true))+detail('Response Duration',durationText(responseMinutes(r)))+'</div>';var managerNote='';if(r.managerDecision&&String(r.managerDecision)!=='not_required'){managerNote='<div class="adv-card adv-manager-decision" style="margin-bottom:12px"><h3 class="adv-card-title">Department Manager Decision</h3><div class="adv-detail-grid">'+detail('Decision',String(r.managerDecision||'pending').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}))+detail('Manager',r.managerName||r.managerEmail||'—')+detail('Decision Date',formatDate(r.managerActionAt||r.managerActionAtIso,true))+'</div>'+(r.managerComment?'<div style="font-size:9.5px;line-height:1.7;color:#3b5865;margin-top:8px;white-space:pre-wrap">'+esc(r.managerComment)+'</div>':'')+'</div>';}var body='<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">'+esc(r.title||'Request Details')+'</h3><div style="font-size:9.5px;line-height:1.7;color:#3b5865;white-space:pre-wrap">'+esc(r.details||'—')+'</div><div class="adv-detail-grid" style="margin-top:12px">'+detail('Related Record(s)',relatedText(r))+detail('Status',statusLabel(r.status))+'</div></div>';var attachments=attachmentHtml(r.attachments||[]),conversation='<div class="adv-card"><h3 class="adv-card-title">Responses & Clarifications</h3>'+((r.messages||[]).length?(r.messages||[]).map(messageHtml).join(''):'<div class="adv-empty">No responses or clarifications yet.</div>')+'</div>',ratingBlock=Number(r.rating)?'<div class="adv-card adv-rating-saved" style="margin-top:12px"><h3 class="adv-card-title">Requester Rating</h3><div class="adv-rating-saved-row"><span class="adv-rating-static">'+('★'.repeat(Number(r.rating)))+('☆'.repeat(Math.max(0,5-Number(r.rating))))+'</span><b>'+Number(r.rating)+' / 5</b></div>'+(r.ratingComment?'<div class="adv-rating-saved-comment">'+esc(r.ratingComment)+'</div>':'<div class="adv-rating-saved-comment muted">No comment provided.</div>')+'</div>':'';return personal+meta+managerNote+body+(attachments?'<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">Attachments</h3>'+attachments+'</div>':'')+conversation+ratingBlock;}

  function showRequestModal(r){closeModal(false);document.body.classList.add('adv-modal-open');selectedRequest=r;selectedRating=0;selectedAdminAction='respond';var actions=isSuperAdmin()?adminActions(r):(isManagerApprovalRecord(r)?managerActions(r):(isOwnRequest(r)?requesterActions(r):'')),ov=document.createElement('div');ov.id='advModal';ov.className='adv-modal-backdrop';ov.innerHTML='<div class="adv-modal adv-modal-wide"><div class="adv-modal-head"><div><h2>'+esc(r.code||'Review & Development Request')+'</h2><p>'+esc(PLATFORM_LABELS[recordPlatform(r)]+' · '+typeLabel(r)+' · '+statusLabel(r.status)+' · '+workflowLabel(r))+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body">'+requestDetails(r)+actions+'</div></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});}
  window._advDownloadAttachment=async function(requestId,attachmentId,name,type,count){if(!apiReady('_advisoryDownloadAttachment'))return toast('Attachment service is unavailable.');try{var blob=await window._advisoryDownloadAttachment(requestId,attachmentId,type,count),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name||'attachment';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}catch(e){toast(String(e&&e.message||e));}};
  function managerActions(r){
    if(!isManagerApprovalRecord(r))return'';
    var reqLabel=requesterLabelFor(r);
    var fields=[
      ['requestType','Request Type'],
      ['category','Item / Record Type'],
      ['relatedType','Related Record'],
      ['relatedNewText','Proposed Item'],
      ['title','Request Title'],
      ['details','Request Details'],
      ['priority','Priority'],
      ['attachments','Attachments / Evidence']
    ];
    var fieldHtml='<div class="adv-field full" id="advManagerReturnFields" hidden><label>Fields to be corrected *</label><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">'+fields.map(function(f){
      return '<label style="display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid #dce7eb;border-radius:8px;background:#fff;font-size:11px"><input type="checkbox" data-adv-return-field="'+esc(f[0])+'"><span>'+esc(f[1])+'</span></label>';
    }).join('')+'</div></div>';
    return'<div class="adv-card adv-manager-action-card" style="margin-top:12px"><h3 class="adv-card-title">Department Manager Approval</h3><p class="adv-rating-help">Approve to forward this request to Super Admin, return it to the requester for correction, or Reject it to close the workflow.</p><div class="adv-form"><div class="adv-field full"><label>Manager Comment / Return / Rejection Reason</label><textarea id="advManagerComment" placeholder="Required for Return and Reject; optional for Approve"></textarea><div id="advManagerError" class="adv-rating-error"></div></div>'+fieldHtml+'<div class="adv-field full"><div class="adv-modal-actions" style="justify-content:flex-start"><button class="adv-btn good" type="button" onclick="window._advManagerAction(\'approve\',this)">Approve to Super Admin</button><button class="adv-btn warn" type="button" onclick="window._advManagerAction(\'return\',this)">Return to '+esc(reqLabel)+'</button><button class="adv-btn danger" type="button" onclick="window._advManagerAction(\'reject\',this)">Reject</button></div></div></div></div>';
  }
  window._advManagerAction=async function(action,btn){
    if(!selectedRequest||!apiReady('_advisoryManagerAction'))return;
    var reqLabel=requesterLabelFor(selectedRequest),
        comment=String((document.getElementById('advManagerComment')||{}).value||'').trim(),
        err=document.getElementById('advManagerError'),
        fieldBox=document.getElementById('advManagerReturnFields'),
        fields=Array.prototype.slice.call((fieldBox||document).querySelectorAll('[data-adv-return-field]:checked')).map(function(x){return x.getAttribute('data-adv-return-field');});
    if(fieldBox)fieldBox.hidden=action!=='return';
    if((action==='return'||action==='reject')&&!comment){
      if(err)err.textContent=action==='return'?'Enter the correction note before returning the request.':'Enter a rejection reason before rejecting the request.';
      return;
    }
    if(action==='return'&&!fields.length){
      if(err)err.textContent='Select at least one field that must be corrected before returning the request.';
      return;
    }
    if(err)err.textContent='';
    var old=btn&&btn.textContent;
    if(btn){btn.disabled=true;btn.textContent=action==='approve'?'Approving…':(action==='return'?'Returning…':'Rejecting…');}
    try{
      await window._advisoryManagerAction(selectedRequest.id,action,comment,fields);
      closeModal();await refreshAfterMutation();
      toast(action==='approve'?'Request approved and forwarded to Super Admin.':(action==='return'?'Request returned to the '+reqLabel+' for correction.':'Request rejected. It will not be forwarded to Super Admin.'));
    }catch(e){
      if(btn){btn.disabled=false;btn.textContent=old||'Submit';}
      if(err)err.textContent=String(e&&e.message||e);else toast(String(e&&e.message||e));
    }
  };
  function adminActionLabel(action){
    return action==='respond'?'Send Response / Close Request':(action==='request_info'?'Request More Information':(action==='reject'?'Reject Request':'Exceptional Action'));
  }
  function adminActions(r){
    if(statusKey(r.status)==='closed'||String(r.workflowStage||'')==='closed')return'<div class="adv-card adv-closed-action-card" style="margin-top:12px"><h3 class="adv-card-title">Request Closed</h3><p class="adv-rating-help">This request is closed. Super Admin cannot send a response, request more information, reject it, or perform any other action.</p></div>';
    var selected=String(selectedAdminAction||'respond');
    return'<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Super Admin Action</h3>'+
      '<div class="adv-form">'+
      '<div class="adv-field full"><label>Action</label><div class="adv-admin-action-picker">'+
      '<button type="button" class="adv-btn primary" data-adv-admin-action="respond" onclick="window._advSelectAdminAction(\'respond\')">Send Response / Close Request</button>'+
      '<button type="button" class="adv-btn warn" data-adv-admin-action="request_info" onclick="window._advSelectAdminAction(\'request_info\')">Request More Information</button>'+
      '<button type="button" class="adv-btn danger" data-adv-admin-action="reject" onclick="window._advSelectAdminAction(\'reject\')">Reject</button>'+
      '</div></div>'+
      '<div id="advAdminSelectedAction" class="adv-admin-selected-action" style="padding:12px 14px;margin:2px 0 10px;border:1px solid #b8dce4;border-radius:10px;background:#eef9fb;display:flex;flex-direction:column;gap:4px"><strong>Selected Action: '+esc(adminActionLabel(selected))+'</strong><span>'+ (selected==='respond'?'The response will be sent to the requester and the request will be closed.':(selected==='request_info'?'The requester will be asked to provide additional information.':'The request will be rejected and closed.')) +'</span></div>'+
      '<div class="adv-field full"><label id="advAdminReplyLabel">'+(selected==='reject'?'Rejection Reason *':(selected==='request_info'?'Information Request *':'Response / Recommendation *'))+'</label><textarea id="advAdminReply" placeholder="'+(selected==='reject'?'Write the rejection reason.':(selected==='request_info'?'Write what information is required from the requester.':'Write the response shown to the requester.'))+'"></textarea></div>'+
      '<div class="adv-field full"><label>Attachment (optional)</label><input id="advAdminAttachment" type="file"></div>'+ 
      '<div class="adv-modal-actions" style="justify-content:flex-start"><button class="adv-btn good" type="button" onclick="window._advConfirmAdminAction()">Confirm Action</button>'+ 
      '<select id="advExceptionalAction" style="padding:8px 9px;border:1px solid #d7e2e7;border-radius:9px;font-size:9px"><option value="">Exceptional Action</option><option value="duplicate">Mark as Duplicate</option><option value="out_of_scope">Mark as Out of Scope</option><option value="knowledge_guide">Direct to Knowledge Guide</option></select><button class="adv-btn ghost" type="button" onclick="window._advApplyExceptional()">Apply</button></div>'+
      '</div></div>';
  }

  window._advSelectAdminAction=function(action){
    action=String(action||'respond');
    if(['respond','request_info','reject'].indexOf(action)<0)action='respond';
    selectedAdminAction=action;
    var box=document.getElementById('advAdminSelectedAction'),label=document.getElementById('advAdminReplyLabel'),ta=document.getElementById('advAdminReply');
    document.querySelectorAll('#advModal [data-adv-admin-action]').forEach(function(btn){btn.classList.toggle('selected',btn.getAttribute('data-adv-admin-action')===action);});
    if(box){box.innerHTML='<strong>Selected Action: '+esc(adminActionLabel(action))+'</strong><span>'+esc(action==='respond'?'The response will be sent to the requester and the request will be closed.':(action==='request_info'?'The requester will be asked to provide additional information.':'The request will be rejected and closed.'))+'</span>';}
    if(label)label.textContent=action==='reject'?'Rejection Reason *':(action==='request_info'?'Information Request *':'Response / Recommendation *');
    if(ta){ta.placeholder=action==='reject'?'Write the rejection reason.':(action==='request_info'?'Write what information is required from the requester.':'Write the response shown to the requester.');}
  };
  window._advConfirmAdminAction=function(){return window._advAdminAction(selectedAdminAction);};
  window._advAdminAction=async function(action){if(!selectedRequest||!apiReady('_advisoryAdminAction'))return;action=String(action||selectedAdminAction||'respond');var reply=String((document.getElementById('advAdminReply')||{}).value||'').trim(),file=(document.getElementById('advAdminAttachment')||{}).files&&document.getElementById('advAdminAttachment').files[0];if(!reply)return toast(action==='reject'?'Enter the rejection reason first.':(action==='request_info'?'Enter the requested information first.':'Enter the response first.'));try{await window._advisoryAdminAction(selectedRequest.id,action,{text:reply},file||null);closeModal();await refreshAfterMutation();toast(action==='respond'?'Response sent and request closed.':(action==='request_info'?'Information request sent.':'Request rejected and closed.'));}catch(e){toast(String(e&&e.message||e));}};
  window._advApplyExceptional=function(){var v=String((document.getElementById('advExceptionalAction')||{}).value||'');if(!v)return toast('Select an exceptional action.');window._advAdminAction(v);};
  function requesterActions(r){var h='';if(String(r.workflowStage||r.status)==='awaiting_requester_information')h+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Provide Additional Information</h3><div class="adv-form"><div class="adv-field full"><label>Clarification *</label><textarea id="advClarification"></textarea></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advClarificationFile" type="file"></div><div class="adv-field full"><button class="adv-btn primary" onclick="window._advSendClarification()">Send Clarification</button></div></div></div>';if(String(r.workflowStage||r.status)==='responded')h+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Confirm Completion</h3><button class="adv-btn good" onclick="window._advConfirmComplete()">Confirm Completed</button></div>';if(statusKey(r.status)!=='closed')h+='<div class="adv-requester-cancel-wrap"><button class="adv-btn danger" onclick="window._advShowCancelConfirm()">Cancel Request</button><div id="advCancelConfirmSlot"></div></div>';if(canRateReview(r)&&!Number(r.rating))h+='<div class="adv-card adv-rating-card" style="margin-top:12px"><h3 class="adv-card-title">Rate Your Experience</h3><p class="adv-rating-help">Choose the number of stars, add an optional comment, then submit your rating.</p><div class="adv-stars adv-stars-select">'+[1,2,3,4,5].map(function(n){return'<button type="button" class="adv-star" data-adv-rating="'+n+'" onclick="window._advSelectRating('+n+')" aria-label="'+n+' star rating">★</button>';}).join('')+'</div><div id="advRatingSelected" class="adv-rating-selected">No rating selected</div><textarea id="advRatingComment" class="adv-rating-comment" placeholder="Add a comment (optional)"></textarea><div id="advRatingError" class="adv-rating-error"></div><button id="advRatingSubmit" class="adv-btn primary" type="button" onclick="window._advSubmitRating(this)">Submit Rating</button></div>';return h;}
  window._advSendClarification=async function(){var text=String((document.getElementById('advClarification')||{}).value||'').trim(),file=(document.getElementById('advClarificationFile')||{}).files&&document.getElementById('advClarificationFile').files[0];if(!text)return toast('Enter the clarification first.');try{await window._advisoryRequesterAction(selectedRequest.id,'clarify',{text:text},file||null);closeModal();await refreshAfterMutation();toast('Clarification sent.');}catch(e){toast(String(e&&e.message||e));}};
  window._advConfirmComplete=async function(){try{await window._advisoryRequesterAction(selectedRequest.id,'complete',{},null);closeModal();await refreshAfterMutation();toast('Request marked as Completed.');}catch(e){toast(String(e&&e.message||e));}};
  window._advShowCancelConfirm=function(){var slot=document.getElementById('advCancelConfirmSlot');if(!slot)return;if(slot.innerHTML.trim()){slot.innerHTML='';return;}slot.innerHTML='<div class="adv-inline-confirm danger" role="alertdialog" aria-label="Cancel request confirmation"><div class="adv-inline-confirm-icon">!</div><div class="adv-inline-confirm-copy"><strong>Cancel this request?</strong><span>This request will be cancelled and no further action will be taken.</span></div><div class="adv-inline-confirm-actions"><button class="adv-btn ghost" type="button" onclick="window._advHideCancelConfirm()">Keep Request</button><button class="adv-btn danger" type="button" onclick="window._advCancelRequest(this)">Confirm Cancel</button></div></div>';};
  window._advHideCancelConfirm=function(){var slot=document.getElementById('advCancelConfirmSlot');if(slot)slot.innerHTML='';};
  window._advCancelRequest=async function(btn){if(!selectedRequest||!apiReady('_advisoryRequesterAction'))return;var oldText=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Cancelling…';}try{await window._advisoryRequesterAction(selectedRequest.id,'cancel',{},null);closeModal();await refreshAfterMutation();toast('Request cancelled.');}catch(e){if(btn){btn.disabled=false;btn.textContent=oldText||'Confirm Cancel';}var slot=document.getElementById('advCancelConfirmSlot');if(slot){var box=slot.querySelector('.adv-inline-confirm');if(box)box.classList.add('has-error');var copy=slot.querySelector('.adv-inline-confirm-copy span');if(copy)copy.textContent=String(e&&e.message||e);}}};
  window._advSelectRating=function(rating){selectedRating=Math.max(1,Math.min(5,Number(rating||0)));document.querySelectorAll('#advModal [data-adv-rating]').forEach(function(btn){var n=Number(btn.getAttribute('data-adv-rating')||0);btn.classList.toggle('selected',n<=selectedRating);btn.setAttribute('aria-pressed',n<=selectedRating?'true':'false');});var label=document.getElementById('advRatingSelected');if(label)label.textContent='Selected rating: '+selectedRating+' out of 5';var err=document.getElementById('advRatingError');if(err)err.textContent='';};
  window._advSubmitRating=async function(btn){if(!selectedRequest||!apiReady('_advisoryRate'))return;var err=document.getElementById('advRatingError');if(!selectedRating){if(err)err.textContent='Select a star rating before submitting.';return;}var comment=String((document.getElementById('advRatingComment')||{}).value||'').trim(),old=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Submitting…';}try{await window._advisoryRate(selectedRequest.id,selectedRating,comment);closeModal();await refreshAfterMutation();toast('Thank you. Your rating was saved.');}catch(e){if(btn){btn.disabled=false;btn.textContent=old||'Submit Rating';}if(err)err.textContent=String(e&&e.message||e);}};
  function showRatingNotification(){try{document.dispatchEvent(new CustomEvent('grc:feedbackRefresh'));}catch(_){}}
  function closeModal(clear){var m=document.getElementById('advModal');if(m)m.remove();document.body.classList.remove('adv-modal-open');if(clear!==false)selectedRequest=null;}
  window._advCloseModal=function(){closeModal();};
})();
