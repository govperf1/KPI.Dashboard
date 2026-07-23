/* ======================================================================
   QUMC Advisory Center — Performance + GRC
   Build: 2026-07-23 v2
   English-only. Two request types only:
   1) Interpretation & Clarification
   2) Advisory Review
   ====================================================================== */
(function(){
  'use strict';

  var records=[];
  var currentPlatform='grc';
  var currentRootId='advRootGrc';
  var currentView='dashboard';
  var dashboardFilter='all';
  var departmentFilter='';
  var loading=false;
  var lastLoadError='';
  var selectedRequest=null;
  var dashboardSearch='',dashboardStatus='',dashboardGender='';
  var adminSearch='',adminStatus='',adminDepartment='';

  var STATUS_LABELS={
    under_review:'Under Review',in_progress:'In Progress',awaiting_requester_information:'Awaiting Information from Requester',
    responded:'Responded',completed:'Completed',closed:'Closed',duplicate:'Duplicate',cancelled:'Cancelled by Requester',
    out_of_scope:'Out of Scope',knowledge_guide:'Directed to Knowledge Guide'
  };
  var TYPE_LABELS={clarification:'Interpretation & Clarification',review:'Advisory Review'};
  var PLATFORM_LABELS={performance:'Performance',grc:'GRC'};
  var PLATFORM_CATEGORIES={
    performance:{
      clarification:[
        'KPI Calculation Methodology Clarification','KPI Result Interpretation','KPI Target or Direction Clarification',
        'KPI Gap Analysis Clarification','KPI Data Entry or Platform Usage Clarification','Other'
      ],
      review:[
        'Review KPI Wording Before Approval','Review KPI Calculation Formula','Review KPI Target and Direction',
        'Review KPI Gap Analysis','Review KPI Supporting Data or Evidence','Review KPI Output Before Approval','Other'
      ]
    },
    grc:{
      clarification:[
        'CBAHI Standard Interpretation','JCI Requirement Interpretation','Policy or Procedure Clarification','Form Clarification',
        'Risk or Control Clarification','Plan or Initiative Clarification','Roles and Responsibilities Clarification',
        'GRC Platform Usage Clarification','Other'
      ],
      review:[
        'Review Risk Description or Controls','Review Plan or Initiative','Review Policy or Procedure','Review Form',
        'Review Compliance Gap or CAP','Review Output Before Approval','Other'
      ]
    }
  };
  var DEPARTMENTS={
    safety:{name:'Safety',code:'SAF'},maintenance:{name:'Maintenance',code:'MNT'},housekeeping:{name:'Housekeeping',code:'HSK'},
    laundry:{name:'Laundry',code:'LND'},projects:{name:'Project Management',code:'PRJ'},governance:{name:'Governance & Performance',code:'GOV'},division:{name:'Governance & Performance',code:'GOV'}
  };

  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function role(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');}
  function isAdmin(){return role()==='admin'||role()==='super_admin';}
  function isSuperAdmin(){return role()==='super_admin';}
  function userEmail(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
  function userDepartmentKey(){
    var raw=String(window._fbDept||window.currentUserDept||'').trim().toLowerCase().replace(/[\s&/-]+/g,'_');
    if(raw.indexOf('safe')>=0)return'safety';
    if(raw.indexOf('maint')>=0)return'maintenance';
    if(raw.indexOf('laund')>=0)return'laundry';
    if(raw.indexOf('house')>=0||raw.indexOf('clean')>=0)return'housekeeping';
    if(raw.indexOf('project')>=0)return'projects';
    if(raw.indexOf('govern')>=0||raw.indexOf('performance')>=0||raw.indexOf('division')>=0)return'governance';
    return DEPARTMENTS[raw]?raw:'governance';
  }
  function departmentName(key){return (DEPARTMENTS[key]&&DEPARTMENTS[key].name)||String(key||'—');}
  function departmentCode(key){return (DEPARTMENTS[key]&&DEPARTMENTS[key].code)||'FMS';}
  function root(){return document.getElementById(currentRootId);}
  function host(){var r=root();return r&&r.querySelector('#advViewHost');}
  function recordPlatform(r){return String(r&&r.platform||'grc').toLowerCase()==='performance'?'performance':'grc';}
  function isRelevantRecord(r){return r&&recordPlatform(r)===currentPlatform&&String(r.serviceType||'consultation')!=='session';}
  function formatDate(value,withTime){
    if(!value)return'—';var d=value&&value.toDate?value.toDate():new Date(value);if(isNaN(d.getTime()))return'—';
    try{return new Intl.DateTimeFormat('en-GB',withTime?{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',year:'numeric'}).format(d);}catch(_){return d.toLocaleString();}
  }
  function timeMs(value){if(!value)return 0;var d=value&&value.toDate?value.toDate():new Date(value);return isNaN(d.getTime())?0:d.getTime();}
  function responseMinutes(r){if(Number.isFinite(Number(r.responseMinutes)))return Number(r.responseMinutes);var a=timeMs(r.createdAt),b=timeMs(r.firstRespondedAt||r.respondedAt);return a&&b?Math.max(0,Math.round((b-a)/60000)):null;}
  function durationText(mins){if(mins==null)return'Not Responded';if(mins<60)return mins+' min';var h=Math.floor(mins/60),m=mins%60;if(h<24)return h+' hr'+(h===1?'':'s')+(m?' '+m+' min':'');var d=Math.floor(h/24),rh=h%24;return d+' day'+(d===1?'':'s')+(rh?' '+rh+' hrs':'');}
  function statusLabel(status){return STATUS_LABELS[status]||String(status||'—');}
  function statusBadge(status){return'<span class="adv-status '+esc(status)+'">'+esc(statusLabel(status))+'</span>';}
  function stars(value){var n=Number(value||0);return n?'<span title="'+n+' out of 5">'+('★'.repeat(n))+('☆'.repeat(Math.max(0,5-n)))+'</span>':'—';}
  function toast(message){var r=root()||document.body,old=r.querySelector&&r.querySelector('.adv-toast');if(old)old.remove();var el=document.createElement('div');el.className='adv-toast';el.textContent=message;r.appendChild(el);setTimeout(function(){el.remove();},3200);}
  function apiReady(name){return typeof window[name]==='function';}
  function audit(action,detail){try{if(typeof window.addAudit==='function')window.addAudit(action,detail);else if(typeof window._recordAuditDirect==='function')window._recordAuditDirect(action,detail);}catch(_){} }

  function pageSkeleton(platform,rootId){
    currentPlatform=platform;currentRootId=rootId;
    var platformLabel=PLATFORM_LABELS[platform];
    return '<div class="adv-platform-root" id="'+rootId+'" data-adv-platform="'+platform+'"><div class="adv-shell">'+
      '<div class="grc-hero adv-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">'+platformLabel+' · INTERNAL ADVISORY SERVICE</div><h1>Advisory Center</h1><p>Submit requests for interpretation, clarification or advisory review. Existing edit, approval and ownership workflows remain unchanged.</p></div><div class="grc-hero-actions"><button class="grc-primary-btn" onclick="window._advOpenConsultation()">＋ New Advisory Request</button></div></div></div>'+
      '<div class="adv-privacy-note"><span class="adv-privacy-icon">i</span><div><strong>Before submitting an advisory request</strong>Service indicators use aggregated non-personal data such as department, gender, request type, category, status and date. Requester identity, request text and attachments are available only to Admin and Super Admin for response and follow-up.</div></div>'+
      '<div class="adv-module-grid">'+
        moduleCard('dashboard','▦','Advisory Dashboard','Aggregated indicators and a non-personal request register scoped to the user\'s department and this platform.')+
        moduleCard('requests','✦','Advisory Requests',isAdmin()?'Review requests, respond, request additional information and close completed cases.':'Submit an interpretation, clarification or advisory review request and follow the response workflow.')+
        (isSuperAdmin()?moduleCard('management','⚙','Advisory Center Management','Review approved request categories and the automatic status workflow.',true):'')+
      '</div><div id="advViewHost"><div class="adv-loading">Loading Advisory Center…</div></div></div></div>';
  }
  function moduleCard(id,icon,title,desc,sa){return'<button type="button" class="adv-module-card '+(currentView===id?'is-active':'')+'" data-adv-view="'+id+'" onclick="window._advSwitchView(\''+id+'\')">'+(sa?'<span class="adv-sa-pill">SUPER ADMIN</span>':'')+'<span class="adv-module-icon">'+icon+'</span><h3>'+title+'</h3><p>'+desc+'</p></button>';}

  window._grcAdvisoryPage=function(){return pageSkeleton('grc','advRootGrc');};
  window._grcAdvisoryMount=function(){mount('grc','advRootGrc');};
  window._performanceAdvisoryMount=function(){
    var holder=document.getElementById('performanceAdvisoryRoot');if(!holder)return;
    if(!holder.querySelector('#advRootPerformance'))holder.innerHTML=pageSkeleton('performance','advRootPerformance');
    mount('performance','advRootPerformance');
  };
  function mount(platform,rootId){currentPlatform=platform;currentRootId=rootId;currentView='dashboard';dashboardFilter='all';departmentFilter='';loadRecords(true);}

  window._advSwitchView=function(view){
    if(view==='management'&&!isSuperAdmin())return;currentView=view;dashboardSearch='';dashboardStatus='';dashboardGender='';adminSearch='';adminStatus='';adminDepartment='';
    var r=root();if(r)r.querySelectorAll('.adv-module-card').forEach(function(x){x.classList.toggle('is-active',x.getAttribute('data-adv-view')===view);});
    if(view==='management')renderView();else loadRecords(true);
  };

  async function loadRecords(){
    if(loading)return;loading=true;lastLoadError='';renderView();
    try{
      if(currentView==='dashboard'){
        if(!apiReady('_advisoryGetPublic'))throw new Error('Advisory data service is unavailable.');records=await window._advisoryGetPublic();
      }else if(isAdmin()){
        if(!apiReady('_advisoryGetAll'))throw new Error('Advisory management service is unavailable.');records=await window._advisoryGetAll();
      }else{
        if(!apiReady('_advisoryGetMine'))throw new Error('Advisory request service is unavailable.');records=await window._advisoryGetMine();
      }
      records=(Array.isArray(records)?records:[]).filter(isRelevantRecord);
    }catch(e){lastLoadError=String(e&&e.message||e);records=[];}
    loading=false;renderView();if(!isAdmin())showRatingNotification();
  }
  function renderView(){var h=host();if(!h)return;if(loading){h.innerHTML='<div class="adv-loading">Loading Advisory Center…</div>';return;}if(lastLoadError){h.innerHTML='<div class="adv-error">'+esc(lastLoadError)+'</div>'+(currentView==='dashboard'?dashboardHtml():requestsHtml());return;}if(currentView==='dashboard')h.innerHTML=dashboardHtml();else if(currentView==='requests')h.innerHTML=requestsHtml();else h.innerHTML=managementHtml();}

  function scopedPublicRecords(){if(isAdmin())return records.slice();var dept=userDepartmentKey();return records.filter(function(r){return String(r.departmentKey||'')===dept;});}
  function isOpen(r){return['under_review','in_progress','awaiting_requester_information'].indexOf(r.status)>=0;}
  function filterRecords(base){
    var q=dashboardSearch.toLowerCase().trim(),st=dashboardStatus,gender=dashboardGender;
    return base.filter(function(r){
      if(departmentFilter&&String(r.departmentKey)!==departmentFilter)return false;if(st&&r.status!==st)return false;if(gender&&r.gender!==gender)return false;
      if(dashboardFilter==='clarification'&&r.requestType!=='clarification')return false;if(dashboardFilter==='review'&&r.requestType!=='review')return false;
      if(dashboardFilter==='open'&&!isOpen(r))return false;if(dashboardFilter==='responded'&&responseMinutes(r)==null)return false;if(dashboardFilter==='rated'&&!Number(r.rating))return false;
      if(q){var hay=[r.code,r.requestTypeLabel,r.category,relatedText(r),departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase();if(hay.indexOf(q)<0)return false;}return true;
    });
  }
  function metric(label,value,sub,filter,tone){return'<button type="button" class="adv-metric-card '+(dashboardFilter===filter?'is-active':'')+'" style="--adv-tone:'+tone+'" onclick="window._advDashboardFilter(\''+filter+'\')"><span class="adv-metric-label">'+label+'</span><strong class="adv-metric-value">'+value+'</strong><span class="adv-metric-sub">'+sub+'</span></button>';}
  function dashboardHtml(){
    var base=scopedPublicRecords(),clar=base.filter(function(r){return r.requestType==='clarification';}).length,rev=base.filter(function(r){return r.requestType==='review';}).length,open=base.filter(isOpen).length;
    var responded=base.map(responseMinutes).filter(function(x){return x!=null;}),rated=base.filter(function(r){return Number(r.rating)>0;}),avg=responded.length?Math.round(responded.reduce(function(a,b){return a+b;},0)/responded.length):null,sat=rated.length?Math.round(rated.reduce(function(a,r){return a+Number(r.rating);},0)/(rated.length*5)*100):null,displayed=filterRecords(base);
    return '<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Advisory Dashboard</div><div class="grc-section-sub">'+(isAdmin()?'All FMS Division departments · '+PLATFORM_LABELS[currentPlatform]+' records':'Department scope: '+esc(departmentName(userDepartmentKey()))+' · '+PLATFORM_LABELS[currentPlatform]+' records')+'</div></div><span class="grc-section-badge">No personal data</span></div><div class="adv-metric-grid">'+
      metric('Total Requests',base.length,'Since service launch','all','#60a5fa')+
      metric('Interpretation & Clarification',clar,base.length?Math.round(clar/base.length*100)+'% of total':'0% of total','clarification','#00a3c4')+
      metric('Advisory Review',rev,base.length?Math.round(rev/base.length*100)+'% of total':'0% of total','review','#8b5cf6')+
      metric('Open Requests',open,'Under review, in progress or awaiting information','open','#f59e0b')+
      metric('Average First Response',avg==null?'—':durationText(avg),'Requests with a recorded response','responded','#10b981')+
      metric('Satisfaction Rate',sat==null?'—':sat+'%',rated.length+' rated request'+(rated.length===1?'':'s'),'rated','#ef6c75')+
      '</div><div class="adv-grid-2" style="margin-top:14px">'+departmentBars(base)+statusSummary(base)+'</div>'+registerHtml(displayed,base.length)+'</section>';
  }
  function departmentBars(base){var counts={};base.forEach(function(r){var k=r.departmentKey||'other';counts[k]=(counts[k]||0)+1;});var max=Math.max.apply(null,[1].concat(Object.keys(counts).map(function(k){return counts[k];})));var bars=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).map(function(k){return'<div class="adv-dept-bar '+(departmentFilter===k?'is-active':'')+'" onclick="window._advDepartmentFilter(\''+esc(k)+'\')"><span>'+esc(departmentName(k))+'</span><div class="adv-dept-track"><i style="width:'+Math.round(counts[k]/max*100)+'%"></i></div><b>'+counts[k]+'</b></div>';}).join('');return'<div class="adv-card"><h3 class="adv-card-title">Requests by Department</h3><div class="adv-dept-bars">'+(bars||'<div class="adv-empty">No records available.</div>')+'</div></div>';}
  function statusSummary(base){function n(st){return base.filter(function(r){return r.status===st;}).length;}return'<div class="adv-card"><h3 class="adv-card-title">Current Status Distribution</h3><div class="adv-status-summary"><div class="adv-status-tile"><b>'+n('under_review')+'</b><span>Under Review</span></div><div class="adv-status-tile"><b>'+n('in_progress')+'</b><span>In Progress</span></div><div class="adv-status-tile"><b>'+n('awaiting_requester_information')+'</b><span>Awaiting Information</span></div><div class="adv-status-tile"><b>'+n('responded')+'</b><span>Responded</span></div><div class="adv-status-tile"><b>'+n('completed')+'</b><span>Completed</span></div><div class="adv-status-tile"><b>'+n('closed')+'</b><span>Closed</span></div></div></div>';}
  function registerHtml(list,total){var deptOptions=isAdmin()?'<option value="">All Departments</option>'+Object.keys(DEPARTMENTS).filter(function(k){return k!=='division';}).map(function(k){return'<option value="'+k+'" '+(departmentFilter===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join(''):'';return'<div class="adv-card" style="margin-top:14px"><div class="adv-register-toolbar"><div><h3>Advisory Request Register</h3><p>Each row represents one request and contains non-personal data only.</p></div><div class="adv-filter-note">Showing <b>'+list.length+'</b> of <b>'+total+'</b> requests · '+esc(filterTitle())+'</div></div><div class="adv-filters"><input value="'+esc(dashboardSearch)+'" placeholder="Search by code, category or related record" oninput="window._advSetDashboardFilter(&quot;search&quot;,this.value)">'+(isAdmin()?'<select onchange="window._advDepartmentFilter(this.value,true)">'+deptOptions+'</select>':'')+'<select onchange="window._advSetDashboardFilter(&quot;status&quot;,this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(dashboardStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><select onchange="window._advSetDashboardFilter(&quot;gender&quot;,this.value)"><option value="">All Genders</option><option value="Male" '+(dashboardGender==='Male'?'selected':'')+'>Male</option><option value="Female" '+(dashboardGender==='Female'?'selected':'')+'>Female</option></select><button class="adv-btn ghost" onclick="window._advResetFilters()">Reset</button></div>'+publicTable(list)+'</div>';}
  function filterTitle(){return{all:'All Requests',clarification:'Interpretation & Clarification',review:'Advisory Review',open:'Open Requests',responded:'Responded Requests',rated:'Rated Requests'}[dashboardFilter]||'All Requests';}
  function relatedText(r){var arr=Array.isArray(r.relatedItems)?r.relatedItems:[];var values=arr.map(function(x){return x.code?x.code+' — '+x.name:(x.name||x.label||'');}).filter(Boolean);if(r.relatedNewText)values.push('New / Not Listed: '+r.relatedNewText);return values.join('; ')||'—';}
  function publicTable(list){return'<div class="adv-table-wrap"><table class="adv-table"><thead><tr><th>Request Code</th><th>Request Type</th><th>Category</th><th>Related Record(s)</th><th>Department</th><th>Gender</th><th>Priority</th><th>Request Date</th><th>Status</th><th>First Response</th><th>Response Duration</th><th>Rating</th></tr></thead><tbody>'+(list.length?list.map(function(r){var mins=responseMinutes(r);return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(r.gender||'—')+'</td><td>'+esc(r.priority||'Normal')+'</td><td>'+formatDate(r.createdAt,false)+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td>'+durationText(mins)+'</td><td>'+stars(r.rating)+'</td></tr>';}).join(''):'<tr><td colspan="12"><div class="adv-empty">No requests match the selected filters.</div></td></tr>')+'</tbody></table></div>';}
  window._advDashboardFilter=function(filter){dashboardFilter=filter;renderView();setTimeout(function(){var r=root(),t=r&&r.querySelector('.adv-table-wrap');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},30);};
  window._advDepartmentFilter=function(key,fromSelect){departmentFilter=fromSelect?key:(departmentFilter===key?'':key);renderView();};
  window._advSetDashboardFilter=function(kind,value){if(kind==='search')dashboardSearch=String(value||'');if(kind==='status')dashboardStatus=String(value||'');if(kind==='gender')dashboardGender=String(value||'');renderView();};
  window._advResetFilters=function(){dashboardFilter='all';departmentFilter='';dashboardSearch='';dashboardStatus='';dashboardGender='';renderView();};
  window._advReload=function(){loadRecords(true);};

  function requestsHtml(){return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Advisory Requests</div><div class="grc-section-sub">'+(isAdmin()?'Review and respond to '+PLATFORM_LABELS[currentPlatform]+' advisory requests.':'Submit an interpretation, clarification or advisory review request and follow the response workflow.')+'</div></div><button class="grc-primary-btn" onclick="window._advOpenConsultation()">＋ New Advisory Request</button></div>'+(isAdmin()?adminRequestsHtml():ownRequestsHtml())+'</section>';}
  function ownRequestsHtml(){var list=records.slice().sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});return'<div class="adv-action-grid adv-action-grid-single"><button class="adv-action-card" onclick="window._advOpenConsultation()"><strong>✦ Submit an Advisory Request</strong><span>Choose Interpretation & Clarification or Advisory Review. Categories and related records are limited to this platform and your department.</span></button></div><div class="adv-card"><div class="adv-register-toolbar"><div><h3>Submitted Advisory Requests</h3><p>Your '+PLATFORM_LABELS[currentPlatform]+' advisory requests only.</p></div><button class="adv-btn ghost" onclick="window._advReload()">Refresh</button></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:980px"><thead><tr><th>Request Code</th><th>Request Type</th><th>Category</th><th>Related Record(s)</th><th>Submitted</th><th>Status</th><th>Last Update</th><th>Rating</th><th></th></tr></thead><tbody>'+(list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.updatedAt||r.respondedAt||r.createdAt,true)+'</td><td>'+stars(r.rating)+'</td><td><button class="adv-btn secondary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Open</button></td></tr>';}).join(''):'<tr><td colspan="9"><div class="adv-empty">No advisory requests have been submitted yet.</div></td></tr>')+'</tbody></table></div></div>';}
  function adminRequestsHtml(){var list=filteredAdminRecords();return'<div class="adv-personal-note"><strong>Authorized view:</strong> Requester name and email are available to Admin and Super Admin for response and follow-up.</div><div class="adv-filters"><input value="'+esc(adminSearch)+'" placeholder="Search by code, requester, email, department, category or related record" oninput="window._advSetAdminFilter(&quot;search&quot;,this.value)"><select onchange="window._advSetAdminFilter(&quot;status&quot;,this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(adminStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><select onchange="window._advSetAdminFilter(&quot;department&quot;,this.value)"><option value="">All Departments</option>'+Object.keys(DEPARTMENTS).filter(function(k){return k!=='division';}).map(function(k){return'<option value="'+k+'" '+(adminDepartment===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join('')+'</select></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:1420px"><thead><tr><th>Request Code</th><th>Requester</th><th>Email</th><th>Department</th><th>Gender</th><th>Request Type</th><th>Category</th><th>Related Record(s)</th><th>Priority</th><th>Status</th><th>Submitted</th><th>First Response</th><th></th></tr></thead><tbody>'+(list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.userName||'—')+'</td><td>'+esc(r.userEmail||'—')+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(r.gender||'—')+'</td><td>'+esc(r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(relatedText(r))+'</td><td>'+esc(r.priority||'Normal')+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td><button class="adv-btn primary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Open & Respond</button></td></tr>';}).join(''):'<tr><td colspan="13"><div class="adv-empty">No requests found.</div></td></tr>')+'</tbody></table></div>';}
  function filteredAdminRecords(){var q=adminSearch.toLowerCase().trim();return records.filter(function(r){if(adminStatus&&r.status!==adminStatus)return false;if(adminDepartment&&r.departmentKey!==adminDepartment)return false;if(q){var h=[r.code,r.userName,r.userEmail,r.category,relatedText(r),departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase();if(h.indexOf(q)<0)return false;}return true;}).sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});}
  window._advSetAdminFilter=function(kind,value){if(kind==='search')adminSearch=String(value||'');if(kind==='status')adminStatus=String(value||'');if(kind==='department')adminDepartment=String(value||'');renderView();};

  function managementHtml(){var cats=PLATFORM_CATEGORIES[currentPlatform];return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Advisory Center Management</div><div class="grc-section-sub">Approved '+PLATFORM_LABELS[currentPlatform]+' request types, categories and action-driven workflow.</div></div><span class="grc-section-badge">SUPER ADMIN</span></div><div class="adv-management-grid"><div class="adv-card"><h3 class="adv-card-title">Interpretation & Clarification</h3>'+cats.clarification.map(function(x){return'<span class="adv-chip">'+esc(x)+'</span>';}).join('')+'</div><div class="adv-card"><h3 class="adv-card-title">Advisory Review</h3>'+cats.review.map(function(x){return'<span class="adv-chip">'+esc(x)+'</span>';}).join('')+'</div><div class="adv-card"><h3 class="adv-card-title">Automatic Status Workflow</h3><div class="adv-workflow">'+workflowStep(1,'Under Review','Assigned automatically when a request is submitted.')+workflowStep(2,'Awaiting Information from Requester','Applied when Admin requests additional information.')+workflowStep(3,'In Progress','Applied when the requester sends the requested clarification.')+workflowStep(4,'Responded','Applied when Admin sends the formal response.')+workflowStep(5,'Completed','Applied when the requester confirms the response is sufficient.')+workflowStep(6,'Closed','Applied by Admin after completion; rating notification is then shown.')+'</div></div><div class="adv-card"><h3 class="adv-card-title">Department-Based Related Records</h3><p style="font-size:9px;color:#718692;line-height:1.7">KPI, policy, form, risk, plan and initiative options are limited to the requester\'s department. Multiple records can be selected, or the requester can choose New / Not Listed.</p></div></div></section>';}
  function workflowStep(n,title,desc){return'<div class="adv-workflow-step"><b>'+n+'</b><div><strong>'+title+'</strong><span>'+desc+'</span></div></div>';}

  function performanceOptions(){
    var dept=userDepartmentKey(),map={projects:'projects',housekeeping:'housekeeping',maintenance:'maintenance',safety:'safety',laundry:'laundry',governance:'governance'},items=[];
    try{var all=typeof window.allK==='function'?window.allK():(typeof allK==='function'?allK():[]);items=(all||[]).filter(function(k){return String(k.dept||k.department||'')===map[dept];}).map(function(k){return{type:'kpi',id:String(k.id||''),code:String(k.id||''),name:String(k.nameEn||k.name||k.title||'KPI')};});}catch(_){}
    return{kpis:items};
  }
  function grcOptions(){try{if(typeof window._grcGetAdvisoryOptions==='function')return window._grcGetAdvisoryOptions(userDepartmentKey())||{};}catch(_){}return{};}
  function relatedConfig(category){
    if(currentPlatform==='performance'){
      if(category==='Other'||category.indexOf('Platform Usage')>=0)return null;
      return{title:'Related KPI(s)',key:'kpis',type:'KPI',newLabel:'New KPI / Not Listed'};
    }
    if(/Policy|Procedure/.test(category))return{title:'Related Policy or Procedure(s)',key:'policies',type:'Policy / Procedure',newLabel:'New Policy or Procedure / Not Listed'};
    if(/Form/.test(category))return{title:'Related Form(s)',key:'forms',type:'Form',newLabel:'New Form / Not Listed'};
    if(/Risk|Control/.test(category))return{title:'Related Risk(s)',key:'risks',type:'Risk',newLabel:'New Risk / Not Listed'};
    if(/Plan|Initiative/.test(category))return{title:'Related Plan or Initiative(s)',key:'plansInitiatives',type:'Plan / Initiative',newLabel:'New Plan or Initiative / Not Listed'};
    if(/CBAHI|JCI|Compliance/.test(category))return{title:'Related Compliance Requirement(s)',key:'compliance',type:'Compliance Requirement',newLabel:'New / Not Listed Requirement'};
    return null;
  }
  function getOptionsForConfig(cfg){var data=currentPlatform==='performance'?performanceOptions():grcOptions();return Array.isArray(data[cfg.key])?data[cfg.key]:[];}

  window._advOpenConsultation=function(){
    closeModal();document.body.classList.add('adv-modal-open');var dept=userDepartmentKey(),ov=document.createElement('div');ov.id='advModal';ov.className='adv-modal-backdrop';ov.innerHTML='<div class="adv-modal"><div class="adv-modal-head"><div><h2>New Advisory Request</h2><p>'+PLATFORM_LABELS[currentPlatform]+' · '+esc(departmentName(dept))+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body"><div class="adv-form">'+
      '<div class="adv-field"><label>Request Type *</label><select id="advRequestType" onchange="window._advTypeChanged()"><option value="">Select request type</option><option value="clarification">Interpretation & Clarification</option><option value="review">Advisory Review</option></select></div>'+
      '<div class="adv-field" id="advCategoryField" style="display:none"><label>Category *</label><select id="advCategory" onchange="window._advCategoryChanged()"><option value="">Select category</option></select></div>'+
      '<div class="adv-field full" id="advOtherCategoryField" style="display:none"><label>Other Category *</label><input id="advOtherCategory" placeholder="Enter the category"></div>'+
      '<div class="adv-field full" id="advRelatedField" style="display:none"></div>'+
      '<div class="adv-field full"><label>Request Title *</label><input id="advTitle" placeholder="Enter a concise request title"></div>'+
      '<div class="adv-field full"><label>Request Details *</label><textarea id="advDetails" placeholder="Describe the point that needs interpretation, clarification or review"></textarea></div>'+
      '<div class="adv-field"><label>Priority</label><select id="advPriority"><option>Normal</option><option>High</option></select></div>'+
      '<div class="adv-field"><label>Gender</label><select id="advGender"><option value="">Select</option><option>Male</option><option>Female</option></select></div>'+
      '<div class="adv-field full"><label>Attachment (optional)</label><input id="advAttachment" type="file"><small>Maximum file size: 5 MB.</small></div></div></div><div class="adv-modal-actions"><button class="adv-btn ghost" onclick="window._advCloseModal()">Cancel</button><button class="adv-btn primary" onclick="window._advSubmitConsultation()">Submit Request</button></div></div>';
    (root()||document.body).appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  };
  window._advTypeChanged=function(){var type=String((document.getElementById('advRequestType')||{}).value||''),field=document.getElementById('advCategoryField'),sel=document.getElementById('advCategory');if(!field||!sel)return;if(!type){field.style.display='none';sel.innerHTML='<option value="">Select category</option>';window._advCategoryChanged();return;}field.style.display='flex';var cats=(PLATFORM_CATEGORIES[currentPlatform]&&PLATFORM_CATEGORIES[currentPlatform][type])||[];sel.innerHTML='<option value="">Select category</option>'+cats.map(function(x){return'<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join('');window._advCategoryChanged();};
  window._advCategoryChanged=function(){
    var category=String((document.getElementById('advCategory')||{}).value||''),other=document.getElementById('advOtherCategoryField'),related=document.getElementById('advRelatedField');if(other)other.style.display=category==='Other'?'flex':'none';if(!related)return;var cfg=relatedConfig(category);if(!cfg){related.style.display='none';related.innerHTML='';return;}var options=getOptionsForConfig(cfg);related.style.display='flex';related.innerHTML='<label>'+esc(cfg.title)+' <span style="font-weight:600;color:#80929c">(multiple selection allowed)</span></label><div class="adv-related-list">'+(options.length?options.map(function(x){var val=encodeURIComponent(JSON.stringify(x));return'<label class="adv-related-option"><input type="checkbox" name="advRelatedItem" value="'+esc(val)+'"><span><b>'+esc(x.code||x.id||'')+'</b>'+esc(x.name||x.label||'')+'</span></label>';}).join(''):'<div class="adv-empty" style="padding:14px">No existing records are available for your department.</div>')+'<label class="adv-related-option adv-related-new"><input type="checkbox" id="advRelatedNew" onchange="window._advToggleRelatedNew()"><span><b>＋</b>'+esc(cfg.newLabel)+'</span></label></div><input id="advRelatedNewText" style="display:none;margin-top:8px" placeholder="Enter the new or unlisted record name"><input type="hidden" id="advRelatedType" value="'+esc(cfg.type)+'">';
  };
  window._advToggleRelatedNew=function(){var c=document.getElementById('advRelatedNew'),i=document.getElementById('advRelatedNewText');if(i)i.style.display=c&&c.checked?'block':'none';};
  function selectedRelatedItems(){return Array.prototype.map.call(document.querySelectorAll('input[name="advRelatedItem"]:checked'),function(x){try{return JSON.parse(decodeURIComponent(x.value));}catch(_){return null;}}).filter(Boolean);}
  window._advSubmitConsultation=async function(){
    var type=String((document.getElementById('advRequestType')||{}).value||''),category=String((document.getElementById('advCategory')||{}).value||''),other=String((document.getElementById('advOtherCategory')||{}).value||'').trim(),title=String((document.getElementById('advTitle')||{}).value||'').trim(),details=String((document.getElementById('advDetails')||{}).value||'').trim(),priority=String((document.getElementById('advPriority')||{}).value||'Normal'),gender=String((document.getElementById('advGender')||{}).value||''),file=(document.getElementById('advAttachment')||{}).files&&document.getElementById('advAttachment').files[0],relatedItems=selectedRelatedItems(),relatedNewText=String((document.getElementById('advRelatedNewText')||{}).value||'').trim(),relatedNew=!!((document.getElementById('advRelatedNew')||{}).checked),relatedType=String((document.getElementById('advRelatedType')||{}).value||'');
    if(!type||!category||!title||!details){toast('Complete the request type, category, title and details.');return;}if(category==='Other'&&!other){toast('Enter the other category.');return;}var cfg=relatedConfig(category);if(cfg&&!relatedItems.length&&!relatedNew){toast('Select at least one related record or choose New / Not Listed.');return;}if(relatedNew&&!relatedNewText){toast('Enter the new or unlisted record name.');return;}if(file&&file.size>5*1024*1024){toast('The attachment must be 5 MB or smaller.');return;}if(!apiReady('_advisorySubmit')){toast('Advisory request service is unavailable.');return;}
    var dept=userDepartmentKey();try{var result=await window._advisorySubmit({platform:currentPlatform,departmentKey:dept,departmentCode:departmentCode(dept),gender:gender,priority:priority,serviceType:'consultation',requestType:type,requestTypeLabel:TYPE_LABELS[type],category:category==='Other'?other:category,title:title,details:details,relatedType:relatedType,relatedItems:relatedItems,relatedNewText:relatedNew?relatedNewText:''},file||null);audit('ADVISORY_SUBMIT','Submitted '+currentPlatform+' request '+(result&&result.code||''));closeModal();currentView='requests';await loadRecords(true);toast('Request submitted successfully: '+(result&&result.code||''));}catch(e){toast(String(e&&e.message||e));}
  };

  window._advOpenRequest=async function(id){if(!apiReady('_advisoryGetOne'))return;try{selectedRequest=await window._advisoryGetOne(id);if(recordPlatform(selectedRequest)!==currentPlatform)throw new Error('This request belongs to another platform.');showRequestModal(selectedRequest);}catch(e){toast(String(e&&e.message||e));}};
  function showRequestModal(r){closeModal(false);document.body.classList.add('adv-modal-open');selectedRequest=r;var ov=document.createElement('div');ov.id='advModal';ov.className='adv-modal-backdrop';ov.innerHTML='<div class="adv-modal adv-modal-wide"><div class="adv-modal-head"><div><h2>'+esc(r.code||'Advisory Request')+'</h2><p>'+esc(PLATFORM_LABELS[recordPlatform(r)]+' · '+TYPE_LABELS[r.requestType])+' · '+statusLabel(r.status)+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body">'+requestDetails(r)+(isAdmin()?adminActions(r):requesterActions(r))+'</div></div>';(root()||document.body).appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});}
  function requestDetails(r){var personal=isAdmin()?'<div class="adv-personal-note"><strong>Requester information:</strong> '+esc(r.userName||'—')+' · '+esc(r.userEmail||'—')+' · '+esc(departmentName(r.departmentKey))+' · '+esc(r.gender||'—')+'</div>':'';var meta='<div class="adv-detail-grid">'+detail('Request Type',r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+detail('Category',r.category||'—')+detail('Priority',r.priority||'Normal')+detail('Created',formatDate(r.createdAt,true))+detail('First Response',formatDate(r.firstRespondedAt||r.respondedAt,true))+detail('Response Duration',durationText(responseMinutes(r)))+'</div>';var body='<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">'+esc(r.title||'Request Details')+'</h3><div style="font-size:9.5px;line-height:1.7;color:#3b5865;white-space:pre-wrap">'+esc(r.details||'—')+'</div><div class="adv-detail-grid" style="margin-top:12px">'+detail('Related Record(s)',relatedText(r))+detail('Status',statusLabel(r.status))+'</div></div>';var attachments=attachmentHtml(r.attachments||[]),conversation='<div class="adv-card"><h3 class="adv-card-title">Responses & Clarifications</h3>'+((r.messages||[]).length?(r.messages||[]).map(messageHtml).join(''):'<div class="adv-empty">No responses or clarifications yet.</div>')+'</div>';return personal+meta+body+(attachments?'<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">Attachments</h3>'+attachments+'</div>':'')+conversation;}
  function detail(label,value){return'<div class="adv-detail-item"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';}
  function messageHtml(m){return'<div class="adv-message '+(m.senderRole==='admin'||m.senderRole==='super_admin'?'admin':'requester')+'"><div class="adv-message-head"><strong>'+esc(m.senderName||m.senderRole||'User')+'</strong><span>'+formatDate(m.createdAt,true)+'</span></div><div class="adv-message-body">'+esc(m.text||'')+'</div>'+attachmentHtml(m.attachments||[])+'</div>';}
  function attachmentHtml(list){return(list||[]).map(function(a){return'<button class="adv-attachment" onclick="window._advDownloadAttachment(\''+esc(selectedRequest&&selectedRequest.id||'')+'\',\''+esc(a.id)+'\',\''+esc(a.name||'attachment')+'\',\''+esc(a.type||'application/octet-stream')+'\','+Number(a.chunkCount||0)+')">▣ '+esc(a.name||'Attachment')+'</button>';}).join('');}
  window._advDownloadAttachment=async function(requestId,attachmentId,name,type,count){if(!apiReady('_advisoryDownloadAttachment')){toast('Attachment service is unavailable.');return;}try{var blob=await window._advisoryDownloadAttachment(requestId,attachmentId,type,count),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name||'attachment';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}catch(e){toast(String(e&&e.message||e));}};

  function adminActions(r){var canClose=r.status==='completed';return'<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Admin Action</h3><div class="adv-form"><div class="adv-field full"><label>Response / Recommendation</label><textarea id="advAdminReply" placeholder="Write the response that will be shown to the requester"></textarea></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advAdminAttachment" type="file"></div><div class="adv-field full"><div class="adv-modal-actions" style="justify-content:flex-start"><button class="adv-btn primary" onclick="window._advAdminAction(\'respond\')">Send Response</button><button class="adv-btn warn" onclick="window._advAdminAction(\'request_info\')">Request More Information</button>'+(canClose?'<button class="adv-btn good" onclick="window._advAdminAction(\'close\')">Close Completed Request</button>':'')+'<select id="advExceptionalAction" style="padding:8px 9px;border:1px solid #d7e2e7;border-radius:9px;font-size:9px"><option value="">Exceptional Action</option><option value="duplicate">Mark as Duplicate</option><option value="out_of_scope">Mark as Out of Scope</option><option value="knowledge_guide">Direct to Knowledge Guide</option></select><button class="adv-btn ghost" onclick="window._advApplyExceptional()">Apply</button></div></div></div></div>';}
  window._advAdminAction=async function(action){if(!selectedRequest||!apiReady('_advisoryAdminAction'))return;var reply=String((document.getElementById('advAdminReply')||{}).value||'').trim(),file=(document.getElementById('advAdminAttachment')||{}).files&&document.getElementById('advAdminAttachment').files[0];if((action==='respond'||action==='request_info')&&!reply){toast('Enter a response or information request first.');return;}if(file&&file.size>5*1024*1024){toast('The attachment must be 5 MB or smaller.');return;}try{await window._advisoryAdminAction(selectedRequest.id,action,{text:reply},file||null);audit('ADVISORY_ADMIN_ACTION',action+' on '+selectedRequest.code);closeModal();await loadRecords(true);toast(action==='close'?'Request closed. The requester will be prompted to rate the service.':'Request updated successfully.');}catch(e){toast(String(e&&e.message||e));}};
  window._advApplyExceptional=function(){var v=String((document.getElementById('advExceptionalAction')||{}).value||'');if(!v){toast('Select an exceptional action.');return;}window._advAdminAction(v);};

  function requesterActions(r){var html='';if(r.status==='awaiting_requester_information')html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Provide Additional Information</h3><div class="adv-form"><div class="adv-field full"><label>Clarification *</label><textarea id="advClarification" placeholder="Add the requested information"></textarea></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advClarificationFile" type="file"></div><div class="adv-field full"><button class="adv-btn primary" onclick="window._advSendClarification()">Send Clarification</button></div></div></div>';if(r.status==='responded')html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Confirm Service Completion</h3><p style="font-size:9px;color:#718692;line-height:1.55">Confirm that the response or recommendation is sufficient. The request will then move to Completed and can be closed by Admin.</p><button class="adv-btn good" onclick="window._advConfirmComplete()">Confirm Completed</button></div>';if(['under_review','in_progress','awaiting_requester_information'].indexOf(r.status)>=0)html+='<div style="margin-top:12px;text-align:right"><button class="adv-btn danger" onclick="window._advCancelRequest()">Cancel Request</button></div>';if(r.status==='closed'&&!Number(r.rating))html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Rate Your Experience</h3><p style="font-size:9px;color:#718692">Select a satisfaction rating from 1 to 5.</p><div class="adv-stars">'+[1,2,3,4,5].map(function(n){return'<button class="adv-star" onclick="window._advRate('+n+')">★</button>';}).join('')+'</div></div>';return html;}
  window._advSendClarification=async function(){var text=String((document.getElementById('advClarification')||{}).value||'').trim(),file=(document.getElementById('advClarificationFile')||{}).files&&document.getElementById('advClarificationFile').files[0];if(!text){toast('Enter the clarification first.');return;}try{await window._advisoryRequesterAction(selectedRequest.id,'clarify',{text:text},file||null);audit('ADVISORY_CLARIFICATION','Added clarification to '+selectedRequest.code);closeModal();await loadRecords(true);toast('Clarification sent. The request is now In Progress.');}catch(e){toast(String(e&&e.message||e));}};
  window._advConfirmComplete=async function(){try{await window._advisoryRequesterAction(selectedRequest.id,'complete',{},null);audit('ADVISORY_COMPLETED','Confirmed completion of '+selectedRequest.code);closeModal();await loadRecords(true);toast('Request marked as Completed.');}catch(e){toast(String(e&&e.message||e));}};
  window._advCancelRequest=async function(){if(!window.confirm('Cancel this request?'))return;try{await window._advisoryRequesterAction(selectedRequest.id,'cancel',{},null);audit('ADVISORY_CANCELLED','Cancelled '+selectedRequest.code);closeModal();await loadRecords(true);toast('Request cancelled.');}catch(e){toast(String(e&&e.message||e));}};
  window._advRate=async function(rating){try{await window._advisoryRate(selectedRequest.id,rating);audit('ADVISORY_RATED','Rated '+selectedRequest.code+' '+rating+'/5');closeModal();await loadRecords(true);toast('Thank you. Your satisfaction rating was saved.');}catch(e){toast(String(e&&e.message||e));}};

  function showRatingNotification(){if(currentView!=='requests')return;var r=records.find(function(x){return x.status==='closed'&&!Number(x.rating);});if(!r)return;var key='qumc_adv_rating_notice_'+r.id;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');setTimeout(function(){toast('Request '+(r.code||'')+' is closed. Please rate your experience.');},400);}
  function closeModal(clear){var m=document.getElementById('advModal');if(m)m.remove();document.body.classList.remove('adv-modal-open');if(clear!==false)selectedRequest=null;}
  window._advCloseModal=function(){closeModal();};
})();
