/* ======================================================================
   QUMC Advisory Center — GRC
   Build: 2026-07-22 v1
   English-only page. Uses advisory_requests / advisory_public in Firestore.
   ====================================================================== */
(function(){
  'use strict';

  var records=[];
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
    responded:'Responded',completed:'Completed',closed:'Closed',scheduled_session:'Scheduled as Consultation Session',
    duplicate:'Duplicate',cancelled:'Cancelled by Requester',out_of_scope:'Out of Scope',knowledge_guide:'Directed to Knowledge Guide'
  };
  var TYPE_CATEGORIES={
    guidance:[
      'Governance Consultation','KPI Consultation','Risk Management Consultation','Compliance Consultation',
      'Operational Planning Consultation','Policies and Procedures Consultation','Initiatives and Improvement Consultation','General Consultation','Other'
    ],
    clarification:[
      'CBAHI Standard Interpretation','JCI Requirement Interpretation','Policy or Procedure Clarification',
      'Calculation Methodology Clarification','Assessment or Classification Method Clarification',
      'Roles and Responsibilities Clarification','Platform Usage Clarification','Other'
    ],
    review:[
      'Review KPI Wording Before Approval','Review Gap Analysis','Review Risk Description or Controls',
      'Review Plan or Initiative','Review Policy or Procedure','Review Form','Review Output Before Approval','Other'
    ],
    development:[
      'Platform Improvement Suggestion','Report Difficulty in a Process or Workflow',
      'Suggest a New Service or Feature','Request to Share a Successful Practice or Experience','Other'
    ]
  };
  var TYPE_LABELS={guidance:'Consultation & Guidance',clarification:'Interpretation & Clarification',review:'Advisory Review',development:'Support & Development',session:'Consultation Session'};
  var DEPARTMENTS={
    safety:{name:'Safety',code:'SAF'},maintenance:{name:'Maintenance',code:'MNT'},housekeeping:{name:'Housekeeping',code:'HSK'},
    laundry:{name:'Laundry',code:'LND'},projects:{name:'Project Management',code:'PRJ'},governance:{name:'Governance & Performance',code:'GOV'}
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
    if(raw.indexOf('govern')>=0||raw.indexOf('performance')>=0)return'governance';
    return DEPARTMENTS[raw]?raw:'governance';
  }
  function departmentName(key){return (DEPARTMENTS[key]&&DEPARTMENTS[key].name)||String(key||'—');}
  function departmentCode(key){return (DEPARTMENTS[key]&&DEPARTMENTS[key].code)||'FMS';}
  function formatDate(value,withTime){
    if(!value)return'—';
    var d=value&&value.toDate?value.toDate():new Date(value);
    if(isNaN(d.getTime()))return'—';
    try{return new Intl.DateTimeFormat('en-GB',withTime?{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',year:'numeric'}).format(d);}catch(_){return d.toLocaleString();}
  }
  function timeMs(value){if(!value)return 0;var d=value&&value.toDate?value.toDate():new Date(value);return isNaN(d.getTime())?0:d.getTime();}
  function responseMinutes(r){
    if(Number.isFinite(Number(r.responseMinutes)))return Number(r.responseMinutes);
    var a=timeMs(r.createdAt),b=timeMs(r.firstRespondedAt||r.respondedAt);return a&&b?Math.max(0,Math.round((b-a)/60000)):null;
  }
  function durationText(mins){
    if(mins==null)return'Not Responded';
    if(mins<60)return mins+' min';
    var hours=Math.floor(mins/60),m=mins%60;
    if(hours<24)return hours+' hr'+(hours===1?'':'s')+(m?' '+m+' min':'');
    var days=Math.floor(hours/24),h=hours%24;return days+' day'+(days===1?'':'s')+(h?' '+h+' hrs':'');
  }
  function statusLabel(status){return STATUS_LABELS[status]||String(status||'—');}
  function statusBadge(status){return'<span class="adv-status '+esc(status)+'">'+esc(statusLabel(status))+'</span>';}
  function stars(value){var n=Number(value||0);return n?'<span title="'+n+' out of 5">'+('★'.repeat(n))+('☆'.repeat(Math.max(0,5-n)))+'</span>':'—';}
  function toast(message){var old=document.querySelector('#grcApp .adv-toast');if(old)old.remove();var el=document.createElement('div');el.className='adv-toast';el.textContent=message;document.getElementById('grcApp').appendChild(el);setTimeout(function(){el.remove();},3200);}
  function apiReady(name){return typeof window[name]==='function';}
  function audit(action,detail){try{if(typeof window.addAudit==='function')window.addAudit(action,detail);else if(typeof window._recordAuditDirect==='function')window._recordAuditDirect(action,detail);}catch(_){} }

  window._grcAdvisoryPage=function(){
    return '<div class="adv-shell" id="advRoot">'+
      '<div class="grc-hero adv-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">GRC · INTERNAL ADVISORY SERVICE</div><h1>Advisory Center</h1><p>A unified service for consultations, clarification, advisory reviews, support and consultation sessions across the Performance and GRC platforms. Existing edit and approval workflows continue to operate independently.</p></div><div class="grc-hero-actions"><button class="grc-primary-btn" onclick="window._advOpenConsultation()">＋ New Consultation</button><button class="grc-primary-btn" onclick="window._advOpenSession()">◷ Book a Session</button></div></div></div>'+
      '<div class="adv-privacy-note"><span class="adv-privacy-icon">i</span><div><strong>Before submitting a consultation or session request</strong>General service analytics use aggregated non-personal data such as gender, department, service type, category, status and date. Names, email addresses, request text and attachments are visible only to Admin and Super Admin for response and follow-up.</div></div>'+
      '<div class="adv-module-grid">'+
        moduleCard('dashboard','▦','Advisory Dashboard','Aggregated indicators and a non-personal request register scoped to the user\'s department.')+
        moduleCard('requests','✦','Consultations & Sessions',isAdmin()?'Review requests, respond, request information, schedule sessions and close completed cases.':'Submit a consultation or book a session, then follow the responses and workflow.')+
        (isSuperAdmin()?moduleCard('management','⚙','Advisory Center Management','Manage approved categories, automatic statuses, response targets and service settings.',true):'')+
      '</div>'+
      '<div id="advViewHost"><div class="adv-loading">Loading Advisory Center…</div></div>'+
    '</div>';
  };

  function moduleCard(id,icon,title,desc,sa){return'<button type="button" class="adv-module-card '+(currentView===id?'is-active':'')+'" data-adv-view="'+id+'" onclick="window._advSwitchView(\''+id+'\')">'+(sa?'<span class="adv-sa-pill">SUPER ADMIN</span>':'')+'<span class="adv-module-icon">'+icon+'</span><h3>'+title+'</h3><p>'+desc+'</p></button>';}

  window._grcAdvisoryMount=function(){
    var root=document.getElementById('advRoot');if(!root)return;
    currentView='dashboard';dashboardFilter='all';departmentFilter='';
    loadRecords(true);
  };

  window._advSwitchView=function(view){
    if(view==='management'&&!isSuperAdmin())return;
    currentView=view;dashboardSearch='';dashboardStatus='';dashboardGender='';adminSearch='';adminStatus='';adminDepartment='';
    document.querySelectorAll('#advRoot .adv-module-card').forEach(function(x){x.classList.toggle('is-active',x.getAttribute('data-adv-view')===view);});
    if(view==='management')renderView();else loadRecords(true);
  };

  async function loadRecords(force){
    if(loading)return;loading=true;lastLoadError='';renderView();
    try{
      if(currentView==='dashboard'){
        if(!apiReady('_advisoryGetPublic'))throw new Error('Advisory data service is unavailable.');
        records=await window._advisoryGetPublic();
      }else if(isAdmin()){
        if(!apiReady('_advisoryGetAll'))throw new Error('Advisory management service is unavailable.');
        records=await window._advisoryGetAll();
      }else{
        if(!apiReady('_advisoryGetMine'))throw new Error('Advisory request service is unavailable.');
        records=await window._advisoryGetMine();
      }
      records=Array.isArray(records)?records:[];
    }catch(e){lastLoadError=String(e&&e.message||e);records=[];}
    loading=false;renderView();
    if(!isAdmin())showRatingNotification();
  }

  function renderView(){
    var host=document.getElementById('advViewHost');if(!host)return;
    if(loading){host.innerHTML='<div class="adv-loading">Loading Advisory Center…</div>';return;}
    if(lastLoadError){host.innerHTML='<div class="adv-error">'+esc(lastLoadError)+'</div>'+(currentView==='dashboard'?dashboardHtml():requestsHtml());return;}
    if(currentView==='dashboard')host.innerHTML=dashboardHtml();
    else if(currentView==='requests')host.innerHTML=requestsHtml();
    else host.innerHTML=managementHtml();
  }

  function scopedPublicRecords(){
    if(isAdmin())return records.slice();
    var dept=userDepartmentKey();return records.filter(function(r){return String(r.departmentKey||'')===dept;});
  }
  function isOpen(r){return['under_review','in_progress','awaiting_requester_information','scheduled_session'].indexOf(r.status)>=0;}
  function filterRecords(base){
    var q=dashboardSearch.toLowerCase().trim();
    var st=dashboardStatus;
    var gender=dashboardGender;
    return base.filter(function(r){
      if(departmentFilter&&String(r.departmentKey)!==departmentFilter)return false;
      if(st&&r.status!==st)return false;if(gender&&r.gender!==gender)return false;
      if(dashboardFilter==='consultation'&&r.serviceType!=='consultation')return false;
      if(dashboardFilter==='session'&&r.serviceType!=='session')return false;
      if(dashboardFilter==='open'&&!isOpen(r))return false;
      if(dashboardFilter==='responded'&&responseMinutes(r)==null)return false;
      if(dashboardFilter==='rated'&&!Number(r.rating))return false;
      if(q){var hay=[r.code,r.serviceType,r.requestTypeLabel,r.category,r.sessionTopic,departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase();if(hay.indexOf(q)<0)return false;}
      return true;
    });
  }
  function metric(label,value,sub,filter,tone){return'<button type="button" class="adv-metric-card '+(dashboardFilter===filter?'is-active':'')+'" style="--adv-tone:'+tone+'" onclick="window._advDashboardFilter(\''+filter+'\')"><span class="adv-metric-label">'+label+'</span><strong class="adv-metric-value">'+value+'</strong><span class="adv-metric-sub">'+sub+'</span></button>';}
  function dashboardHtml(){
    var base=scopedPublicRecords();
    var consult=base.filter(function(r){return r.serviceType==='consultation';}).length;
    var sessions=base.filter(function(r){return r.serviceType==='session';}).length;
    var open=base.filter(isOpen).length;
    var responded=base.map(responseMinutes).filter(function(x){return x!=null;});
    var rated=base.filter(function(r){return Number(r.rating)>0;});
    var avg=responded.length?Math.round(responded.reduce(function(a,b){return a+b;},0)/responded.length):null;
    var satisfaction=rated.length?Math.round(rated.reduce(function(a,r){return a+Number(r.rating);},0)/(rated.length*5)*100):null;
    var displayed=filterRecords(base);
    return '<section class="adv-view is-active">'+
      '<div class="grc-section-head"><div><div class="grc-section-title">Advisory Dashboard</div><div class="grc-section-sub">'+(isAdmin()?'All FMS Division departments · aggregated non-personal records':'Department scope: '+esc(departmentName(userDepartmentKey()))+' · aggregated non-personal records')+'</div></div><span class="grc-section-badge">No personal data</span></div>'+
      '<div class="adv-metric-grid">'+
        metric('Total Requests',base.length,'Since service launch','all','#60a5fa')+
        metric('Consultation Requests',consult,base.length?Math.round(consult/base.length*100)+'% of total':'0% of total','consultation','#00a3c4')+
        metric('Consultation Sessions',sessions,base.length?Math.round(sessions/base.length*100)+'% of total':'0% of total','session','#8b5cf6')+
        metric('Open Requests',open,'Under review, in progress, waiting or scheduled','open','#f59e0b')+
        metric('Average First Response',avg==null?'—':durationText(avg),'Requests with a recorded response','responded','#10b981')+
        metric('Satisfaction Rate',satisfaction==null?'—':satisfaction+'%',rated.length+' rated request'+(rated.length===1?'':'s'),'rated','#ef6c75')+
      '</div>'+
      '<div class="adv-grid-2" style="margin-top:14px">'+departmentBars(base)+statusSummary(base)+'</div>'+
      registerHtml(displayed,base.length)+
    '</section>';
  }
  function departmentBars(base){
    var counts={};base.forEach(function(r){var k=r.departmentKey||'other';counts[k]=(counts[k]||0)+1;});
    var max=Math.max.apply(null,[1].concat(Object.keys(counts).map(function(k){return counts[k];})));
    var bars=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).map(function(k){return'<div class="adv-dept-bar '+(departmentFilter===k?'is-active':'')+'" onclick="window._advDepartmentFilter(\''+esc(k)+'\')"><span>'+esc(departmentName(k))+'</span><div class="adv-dept-track"><i style="width:'+Math.round(counts[k]/max*100)+'%"></i></div><b>'+counts[k]+'</b></div>';}).join('');
    return'<div class="adv-card"><h3 class="adv-card-title">Requests by Department</h3><div class="adv-dept-bars">'+(bars||'<div class="adv-empty">No records available.</div>')+'</div></div>';
  }
  function statusSummary(base){
    function n(st){return base.filter(function(r){return r.status===st;}).length;}
    return'<div class="adv-card"><h3 class="adv-card-title">Current Status Distribution</h3><div class="adv-status-summary">'+
      '<div class="adv-status-tile"><b>'+n('under_review')+'</b><span>Under Review</span></div><div class="adv-status-tile"><b>'+n('in_progress')+'</b><span>In Progress</span></div><div class="adv-status-tile"><b>'+n('awaiting_requester_information')+'</b><span>Awaiting Information</span></div><div class="adv-status-tile"><b>'+n('responded')+'</b><span>Responded</span></div><div class="adv-status-tile"><b>'+n('completed')+'</b><span>Completed</span></div><div class="adv-status-tile"><b>'+n('closed')+'</b><span>Closed</span></div></div></div>';
  }
  function registerHtml(list,total){
    var deptOptions=isAdmin()?'<option value="">All Departments</option>'+Object.keys(DEPARTMENTS).map(function(k){return'<option value="'+k+'" '+(departmentFilter===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join(''):'';
    return'<div class="adv-card" style="margin-top:14px"><div class="adv-register-toolbar"><div><h3>Consultations & Sessions Register</h3><p>Each row represents one request and contains non-personal data only.</p></div><div class="adv-filter-note">Showing <b>'+list.length+'</b> of <b>'+total+'</b> requests · '+esc(filterTitle())+'</div></div><div class="adv-filters"><input id="advSearch" value="'+esc(dashboardSearch)+'" placeholder="Search by code, service, category or status" oninput="window._advSetDashboardFilter(&quot;search&quot;,this.value)">'+(isAdmin()?'<select onchange="window._advDepartmentFilter(this.value,true)">'+deptOptions+'</select>':'')+'<select id="advStatusFilter" onchange="window._advSetDashboardFilter(&quot;status&quot;,this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(dashboardStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><select id="advGenderFilter" onchange="window._advSetDashboardFilter(&quot;gender&quot;,this.value)"><option value="">All Genders</option><option value="Male" '+(dashboardGender==='Male'?'selected':'')+'>Male</option><option value="Female" '+(dashboardGender==='Female'?'selected':'')+'>Female</option></select><button class="adv-btn ghost" onclick="window._advResetFilters()">Reset</button></div>'+publicTable(list)+'</div>';
  }
  function filterTitle(){return{all:'All Requests',consultation:'Consultation Requests',session:'Consultation Sessions',open:'Open Requests',responded:'Responded Requests',rated:'Rated Requests'}[dashboardFilter]||'All Requests';}
  function publicTable(list){
    return'<div class="adv-table-wrap"><table class="adv-table"><thead><tr><th>Request Code</th><th>Service</th><th>Request Type</th><th>Category / Topic</th><th>Department</th><th>Gender</th><th>Priority</th><th>Request Date</th><th>Status</th><th>First Response</th><th>Response Duration</th><th>Rating</th></tr></thead><tbody>'+(
      list.length?list.map(function(r){var mins=responseMinutes(r);return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.serviceType==='session'?'Consultation Session':'Consultation')+'</td><td>'+esc(r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+'</td><td>'+esc(r.serviceType==='session'?(r.sessionTopic||'—'):(r.category||'—'))+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(r.gender||'—')+'</td><td>'+esc(r.priority||'Normal')+'</td><td>'+formatDate(r.createdAt,false)+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td>'+durationText(mins)+'</td><td>'+stars(r.rating)+'</td></tr>';}).join(''):'<tr><td colspan="12"><div class="adv-empty">No requests match the selected filters.</div></td></tr>'
    )+'</tbody></table></div>';
  }
  window._advDashboardFilter=function(filter){dashboardFilter=filter;renderView();setTimeout(function(){var t=document.querySelector('#advViewHost .adv-table-wrap');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},30);};
  window._advDepartmentFilter=function(key,fromSelect){departmentFilter=(fromSelect?key:(departmentFilter===key?'':key));renderView();};
  window._advSetDashboardFilter=function(kind,value){if(kind==='search')dashboardSearch=String(value||'');if(kind==='status')dashboardStatus=String(value||'');if(kind==='gender')dashboardGender=String(value||'');renderView();};
  window._advRenderDashboard=function(){renderView();};
  window._advResetFilters=function(){dashboardFilter='all';departmentFilter='';dashboardSearch='';dashboardStatus='';dashboardGender='';renderView();};

  function requestsHtml(){
    if(isAdmin())return adminRequestsHtml();
    var closedUnrated=records.filter(function(r){return r.status==='closed'&&!Number(r.rating);});
    return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Consultations & Sessions</div><div class="grc-section-sub">Submit a consultation or book a consultation session, then follow the response and automatic workflow.</div></div><button class="grc-primary-btn" onclick="window._advOpenConsultation()">＋ New Consultation</button></div>'+(
      closedUnrated.length?'<div class="adv-alert"><div><strong>Service rating required</strong><br>'+closedUnrated.length+' closed request'+(closedUnrated.length===1?' is':'s are')+' waiting for your satisfaction rating.</div><button class="adv-btn warn" onclick="window._advOpenRequest(\''+esc(closedUnrated[0].id)+'\')">Rate Now</button></div>':'')+
      '<div class="adv-action-grid"><button class="adv-action-card" onclick="window._advOpenConsultation()"><strong>💬 Request a Consultation</strong><span>Request guidance, clarification, an advisory review, or support and development advice.</span></button><button class="adv-action-card" onclick="window._advOpenSession()"><strong>📅 Book a Consultation Session</strong><span>Provide the topic, participants, preferred duration, suitable days and supporting attachments.</span></button></div>'+ownRequestsTable()+'</section>';
  }
  function ownRequestsTable(){
    var list=records.slice().sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});
    return'<div class="adv-card"><div class="adv-register-toolbar"><div><h3>Submitted Consultations & Sessions</h3><p>This is the GRC advisory service record, separate from Performance “My Requests”.</p></div><button class="adv-btn ghost" onclick="window._advReload()">Refresh</button></div><div class="adv-table-wrap"><table class="adv-table" style="min-width:920px"><thead><tr><th>Request Code</th><th>Service</th><th>Request Type / Topic</th><th>Submitted</th><th>Status</th><th>Last Update</th><th>Rating</th><th></th></tr></thead><tbody>'+(
      list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.serviceType==='session'?'Consultation Session':'Consultation')+'</td><td>'+esc(r.serviceType==='session'?(r.sessionTopic||'—'):(r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—'))+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.updatedAt||r.respondedAt||r.createdAt,true)+'</td><td>'+stars(r.rating)+'</td><td><button class="adv-btn secondary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Open</button></td></tr>';}).join(''):'<tr><td colspan="8"><div class="adv-empty">No consultations or sessions have been submitted yet.</div></td></tr>')+'</tbody></table></div></div>';
  }

  function adminRequestsHtml(){
    var list=records.slice().sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});
    return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Consultation Request Management</div><div class="grc-section-sub">Admin and Super Admin can view requester information, respond, request clarification, schedule a session and close completed requests.</div></div><button class="adv-btn ghost" onclick="window._advReload()">Refresh</button></div><div class="adv-personal-note"><strong>Authorized view:</strong> Requester name and email are visible here only to Admin and Super Admin for response and follow-up. No assigned employee or manually entered expected-response date is used.</div><div class="adv-filters"><input id="advAdminSearch" value="'+esc(adminSearch)+'" placeholder="Search by code, requester, email, department or category" oninput="window._advSetAdminFilter(&quot;search&quot;,this.value)"><select id="advAdminStatus" onchange="window._advSetAdminFilter(&quot;status&quot;,this.value)"><option value="">All Statuses</option>'+Object.keys(STATUS_LABELS).map(function(k){return'<option value="'+k+'" '+(adminStatus===k?'selected':'')+'>'+STATUS_LABELS[k]+'</option>';}).join('')+'</select><select id="advAdminDept" onchange="window._advSetAdminFilter(&quot;department&quot;,this.value)"><option value="">All Departments</option>'+Object.keys(DEPARTMENTS).map(function(k){return'<option value="'+k+'" '+(adminDepartment===k?'selected':'')+'>'+DEPARTMENTS[k].name+'</option>';}).join('')+'</select></div><div id="advAdminTable">'+adminTable(list)+'</div></section>';
  }
  function adminFiltered(){
    var q=adminSearch.toLowerCase().trim(),st=adminStatus,dept=adminDepartment;
    return records.filter(function(r){if(st&&r.status!==st)return false;if(dept&&r.departmentKey!==dept)return false;if(q){var h=[r.code,r.userName,r.userEmail,r.category,r.sessionTopic,departmentName(r.departmentKey),statusLabel(r.status)].join(' ').toLowerCase();if(h.indexOf(q)<0)return false;}return true;}).sort(function(a,b){return timeMs(b.createdAt)-timeMs(a.createdAt);});
  }
  function adminTable(list){return'<div class="adv-table-wrap"><table class="adv-table" style="min-width:1450px"><thead><tr><th>Request Code</th><th>Requester</th><th>Email</th><th>Department</th><th>Gender</th><th>Service</th><th>Type / Category</th><th>Priority</th><th>Status</th><th>Submitted</th><th>First Response</th><th></th></tr></thead><tbody>'+(
    list.length?list.map(function(r){return'<tr><td class="adv-code">'+esc(r.code||r.id)+'</td><td>'+esc(r.userName||'—')+'</td><td>'+esc(r.userEmail||'—')+'</td><td>'+esc(departmentName(r.departmentKey))+'</td><td>'+esc(r.gender||'—')+'</td><td>'+esc(r.serviceType==='session'?'Consultation Session':'Consultation')+'</td><td>'+esc(r.serviceType==='session'?(r.sessionTopic||'—'):((r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+' · '+(r.category||'—')))+'</td><td>'+esc(r.priority||'Normal')+'</td><td>'+statusBadge(r.status)+'</td><td>'+formatDate(r.createdAt,true)+'</td><td>'+formatDate(r.firstRespondedAt||r.respondedAt,true)+'</td><td><button class="adv-btn primary" onclick="window._advOpenRequest(\''+esc(r.id)+'\')">Open & Respond</button></td></tr>';}).join(''):'<tr><td colspan="12"><div class="adv-empty">No requests found.</div></td></tr>')+'</tbody></table></div>';}
  window._advSetAdminFilter=function(kind,value){if(kind==='search')adminSearch=String(value||'');if(kind==='status')adminStatus=String(value||'');if(kind==='department')adminDepartment=String(value||'');renderView();};
  window._advRenderAdminTable=function(){var h=document.getElementById('advAdminTable');if(h)h.innerHTML=adminTable(adminFiltered());};
  window._advReload=function(){loadRecords(true);};

  function managementHtml(){
    var targets=getSettings();
    return'<section class="adv-view is-active"><div class="grc-section-head"><div><div class="grc-section-title">Advisory Center Management</div><div class="grc-section-sub">Super Admin only. Approved request categories and automatic workflow rules.</div></div><span class="grc-section-badge">SUPER ADMIN</span></div><div class="adv-management-grid">'+
      '<div class="adv-card"><h3 class="adv-card-title">Approved Consultation Categories</h3>'+Object.keys(TYPE_CATEGORIES).map(function(k){return'<div style="margin-bottom:12px"><strong style="font-size:9px;color:#315665">'+esc(TYPE_LABELS[k])+'</strong><div class="adv-chip-list" style="margin-top:6px">'+TYPE_CATEGORIES[k].map(function(x){return'<span class="adv-chip">'+esc(x)+'</span>';}).join('')+'</div></div>';}).join('')+'</div>'+
      '<div class="adv-card"><h3 class="adv-card-title">Automatic Status Workflow</h3><div class="adv-workflow">'+workflowStep(1,'Under Review','Assigned automatically when a requester submits a consultation or session request.')+workflowStep(2,'Awaiting Information from Requester','Applied automatically when Admin requests more information.')+workflowStep(3,'In Progress','Applied automatically when the requester sends the required clarification.')+workflowStep(4,'Responded','Applied automatically when Admin sends the response. First-response time is recorded at the same moment.')+workflowStep(5,'Completed','Applied when the requester confirms that the response or session outcome is complete.')+workflowStep(6,'Closed','Applied by Admin after completion. The requester receives a rating notification.')+'</div></div>'+
      '<div class="adv-card"><h3 class="adv-card-title">Response Targets</h3><div class="adv-form"><div class="adv-field"><label>Normal Priority</label><input id="advTargetNormal" type="number" min="1" value="'+targets.normal+'"><small>Target in business hours.</small></div><div class="adv-field"><label>High Priority</label><input id="advTargetHigh" type="number" min="1" value="'+targets.high+'"><small>Target in business hours.</small></div><div class="adv-field full"><button class="adv-btn primary" onclick="window._advSaveSettings()">Save Settings</button></div></div></div>'+
      '<div class="adv-card"><h3 class="adv-card-title">Exceptional Outcomes</h3><div class="adv-chip-list"><span class="adv-chip">Duplicate</span><span class="adv-chip">Cancelled by Requester</span><span class="adv-chip">Out of Scope</span><span class="adv-chip">Directed to Knowledge Guide</span><span class="adv-chip">Scheduled as Consultation Session</span></div><p style="font-size:8.5px;line-height:1.6;color:#718692;margin:12px 0 0">These are applied through a specific action, not selected as a general manual status. Statuses remain linked to the action that caused them.</p></div>'+
    '</div></section>';
  }
  function workflowStep(n,title,desc){return'<div class="adv-workflow-step"><b>'+n+'</b><div><strong>'+title+'</strong><span>'+desc+'</span></div></div>';}
  function getSettings(){try{return Object.assign({normal:24,high:8},JSON.parse(localStorage.getItem('qumc_adv_settings_v1')||'{}'));}catch(_){return{normal:24,high:8};}}
  window._advSaveSettings=function(){var n=Math.max(1,Number(document.getElementById('advTargetNormal').value||24)),h=Math.max(1,Number(document.getElementById('advTargetHigh').value||8));localStorage.setItem('qumc_adv_settings_v1',JSON.stringify({normal:n,high:h}));toast('Advisory Center settings saved.');audit('ADVISORY_SETTINGS','Updated Advisory Center response targets.');};

  window._advOpenConsultation=function(){openForm('consultation');};
  window._advOpenSession=function(){openForm('session');};
  function openForm(kind){
    if(isAdmin()){toast('Admin and Super Admin manage requests from the request table.');return;}
    closeModal();var host=document.getElementById('grcApp');if(!host)return;
    var modal=document.createElement('div');modal.id='advModal';modal.className='adv-modal-backdrop';
    modal.innerHTML='<div class="adv-modal"><div class="adv-modal-head"><div><h3>'+(kind==='session'?'Book a Consultation Session':'New Consultation Request')+'</h3><p>'+(kind==='session'?'Provide session details and suitable scheduling options.':'Select the request type first; the category list will then update automatically.')+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body"><div class="adv-privacy-note" style="margin-bottom:13px"><span class="adv-privacy-icon">i</span><div>Your account information is used to deliver and follow up the response. Personal data is not shown in the aggregated register.</div></div><form class="adv-form" id="advSubmitForm">'+(kind==='session'?sessionFields():consultationFields())+'<div class="adv-field full"><div id="advFormError"></div><div class="adv-modal-actions"><button type="button" class="adv-btn ghost" onclick="window._advCloseModal()">Cancel</button><button type="submit" class="adv-btn primary" id="advSubmitBtn">'+(kind==='session'?'Submit Session Request':'Submit Consultation')+'</button></div></div></form></div></div>';
    host.appendChild(modal);modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
    if(kind==='consultation'){
      var type=document.getElementById('advRequestType');type.addEventListener('change',updateCategory);updateCategory();
    }
    document.getElementById('advSubmitForm').addEventListener('submit',function(e){e.preventDefault();submitForm(kind,e.target);});
  }
  function commonFields(){return'<div class="adv-field"><label>Gender *</label><select name="gender" required><option value="">Select</option><option>Male</option><option>Female</option></select></div><div class="adv-field"><label>Priority *</label><select name="priority" required><option>Normal</option><option>High</option></select></div>';}
  function consultationFields(){return'<div class="adv-field"><label>Request Type *</label><select name="requestType" id="advRequestType" required><option value="">Select Request Type</option><option value="guidance">Consultation & Guidance</option><option value="clarification">Interpretation & Clarification</option><option value="review">Advisory Review</option><option value="development">Support & Development</option></select></div><div class="adv-field"><label>Category *</label><select name="category" id="advCategory" required disabled><option value="">Select the request type first</option></select></div><div class="adv-field full" id="advOtherCategoryWrap" style="display:none"><label>Other Category *</label><input name="otherCategory" id="advOtherCategory" placeholder="Enter the category"></div><div class="adv-field full"><label>Consultation Title *</label><input name="title" required maxlength="160" placeholder="Enter a short and clear title"></div><div class="adv-field full"><label>Consultation Details *</label><textarea name="details" required placeholder="Describe the question, challenge or clarification required"></textarea></div>'+commonFields()+'<div class="adv-field full"><label>Attachment (optional)</label><input name="attachment" type="file"><small>Maximum 5 MB. The file is visible only to the requester, Admin and Super Admin.</small></div>';}
  function sessionFields(){return'<div class="adv-field full"><label>Session Topic *</label><input name="sessionTopic" required maxlength="180" placeholder="Enter the consultation session topic"></div><div class="adv-field full"><label>Participants *</label><textarea name="participants" required placeholder="List the participants or roles expected to attend"></textarea></div><div class="adv-field"><label>Preferred Duration *</label><select name="preferredDuration" required><option value="">Select</option><option>30 minutes</option><option>45 minutes</option><option>60 minutes</option><option>90 minutes</option></select></div><div class="adv-field"><label>Suitable Days / Times *</label><input name="suitableDays" required placeholder="Example: Sunday or Tuesday, 10:00–12:00"></div><div class="adv-field full"><label>Session Details *</label><textarea name="details" required placeholder="Provide the context and points that should be discussed during the session"></textarea></div>'+commonFields()+'<div class="adv-field full"><label>Documents to Review Before the Session (optional)</label><input name="attachment" type="file"><small>Maximum 5 MB. The file is visible only to the requester, Admin and Super Admin.</small></div>';}
  function updateCategory(){
    var type=document.getElementById('advRequestType'),cat=document.getElementById('advCategory'),wrap=document.getElementById('advOtherCategoryWrap'),other=document.getElementById('advOtherCategory');if(!type||!cat)return;
    var arr=TYPE_CATEGORIES[type.value]||[];cat.disabled=!arr.length;cat.innerHTML=arr.length?'<option value="">Select Category</option>'+arr.map(function(x){return'<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join(''):'<option value="">Select the request type first</option>';
    wrap.style.display='none';other.required=false;cat.onchange=function(){var show=cat.value==='Other';wrap.style.display=show?'flex':'none';other.required=show;if(!show)other.value='';};
  }
  async function submitForm(kind,form){
    var err=document.getElementById('advFormError'),btn=document.getElementById('advSubmitBtn');err.innerHTML='';
    if(!apiReady('_advisorySubmit')){err.innerHTML='<div class="adv-error">Advisory service is unavailable. Check Firebase connection.</div>';return;}
    var fd=new FormData(form),file=form.elements.attachment&&form.elements.attachment.files[0];
    if(file&&file.size>5*1024*1024){err.innerHTML='<div class="adv-error">The attachment must be 5 MB or smaller.</div>';return;}
    var payload={serviceType:kind,departmentKey:userDepartmentKey(),departmentCode:departmentCode(userDepartmentKey()),gender:fd.get('gender'),priority:fd.get('priority'),details:fd.get('details')};
    if(kind==='consultation'){
      payload.requestType=fd.get('requestType');payload.requestTypeLabel=TYPE_LABELS[payload.requestType]||'';payload.category=fd.get('category')==='Other'?String(fd.get('otherCategory')||'').trim():fd.get('category');payload.title=fd.get('title');
    }else{payload.requestType='session';payload.requestTypeLabel=TYPE_LABELS.session;payload.sessionTopic=fd.get('sessionTopic');payload.participants=fd.get('participants');payload.preferredDuration=fd.get('preferredDuration');payload.suitableDays=fd.get('suitableDays');payload.title=payload.sessionTopic;}
    btn.disabled=true;btn.textContent='Submitting…';
    try{
      var result=await window._advisorySubmit(payload,file||null);audit('ADVISORY_REQUEST_SUBMITTED','Submitted '+kind+' request '+(result.code||result.id));closeModal();currentView='requests';await loadRecords(true);toast('Request '+(result.code||'')+' submitted successfully.');
    }catch(e){err.innerHTML='<div class="adv-error">'+esc(String(e&&e.message||e))+'</div>';btn.disabled=false;btn.textContent=kind==='session'?'Submit Session Request':'Submit Consultation';}
  }

  window._advOpenRequest=async function(id){
    closeModal();var r=records.find(function(x){return String(x.id)===String(id);});
    try{if(apiReady('_advisoryGetOne'))r=await window._advisoryGetOne(id);}catch(_){}
    if(!r){toast('Request could not be loaded.');return;}selectedRequest=r;
    var host=document.getElementById('grcApp'),modal=document.createElement('div');modal.id='advModal';modal.className='adv-modal-backdrop';
    modal.innerHTML='<div class="adv-modal"><div class="adv-modal-head"><div><h3>'+esc(r.code||r.id)+'</h3><p>'+esc(r.serviceType==='session'?'Consultation Session':'Consultation Request')+' · '+statusLabel(r.status)+'</p></div><button class="adv-modal-close" onclick="window._advCloseModal()">×</button></div><div class="adv-modal-body">'+requestDetails(r)+(isAdmin()?adminActions(r):requesterActions(r))+'</div></div>';
    host.appendChild(modal);modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  };
  function requestDetails(r){
    var personal=isAdmin()?'<div class="adv-personal-note"><strong>Requester:</strong> '+esc(r.userName||'—')+' · '+esc(r.userEmail||'—')+'</div>':'';
    var details='<div class="adv-detail-grid">'+detail('Department',departmentName(r.departmentKey))+detail('Gender',r.gender||'—')+detail('Priority',r.priority||'Normal')+detail('Submitted',formatDate(r.createdAt,true))+detail('First Response',formatDate(r.firstRespondedAt||r.respondedAt,true))+detail('Response Duration',durationText(responseMinutes(r)))+'</div>';
    var body='<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">'+esc(r.title||r.sessionTopic||'Request Details')+'</h3><div style="font-size:9.5px;line-height:1.7;color:#3b5865;white-space:pre-wrap">'+esc(r.details||'—')+'</div>'+(r.serviceType==='session'?'<div class="adv-detail-grid" style="margin-top:12px">'+detail('Participants',r.participants||'—')+detail('Preferred Duration',r.preferredDuration||'—')+detail('Suitable Days / Times',r.suitableDays||'—')+'</div>':'<div class="adv-detail-grid" style="margin-top:12px">'+detail('Request Type',r.requestTypeLabel||TYPE_LABELS[r.requestType]||'—')+detail('Category',r.category||'—')+detail('Status',statusLabel(r.status))+'</div>')+'</div>';
    var attachments=attachmentHtml(r.attachments||[]);
    var conversation='<div class="adv-card"><h3 class="adv-card-title">Responses & Clarifications</h3>'+((r.messages||[]).length?(r.messages||[]).map(messageHtml).join(''):'<div class="adv-empty">No responses or clarifications yet.</div>')+'</div>';
    return personal+details+body+(attachments?'<div class="adv-card" style="margin-bottom:12px"><h3 class="adv-card-title">Attachments</h3>'+attachments+'</div>':'')+conversation;
  }
  function detail(label,value){return'<div class="adv-detail-item"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';}
  function messageHtml(m){return'<div class="adv-message '+(m.senderRole==='admin'||m.senderRole==='super_admin'?'admin':'requester')+'"><div class="adv-message-head"><strong>'+esc(m.senderName||m.senderRole||'User')+'</strong><span>'+formatDate(m.createdAt,true)+'</span></div><div class="adv-message-body">'+esc(m.text||'')+'</div>'+attachmentHtml(m.attachments||[])+'</div>';}
  function attachmentHtml(list){return(list||[]).map(function(a){return'<button class="adv-attachment" onclick="window._advDownloadAttachment(\''+esc(selectedRequest&&selectedRequest.id||'')+'\',\''+esc(a.id)+'\',\''+esc(a.name||'attachment')+'\',\''+esc(a.type||'application/octet-stream')+'\','+Number(a.chunkCount||0)+')">▣ '+esc(a.name||'Attachment')+'</button>';}).join('');}
  window._advDownloadAttachment=async function(requestId,attachmentId,name,type,count){if(!apiReady('_advisoryDownloadAttachment')){toast('Attachment service is unavailable.');return;}try{var blob=await window._advisoryDownloadAttachment(requestId,attachmentId,type,count);var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name||'attachment';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}catch(e){toast(String(e&&e.message||e));}};

  function adminActions(r){
    var canClose=r.status==='completed';
    return'<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Admin Action</h3><div class="adv-form"><div class="adv-field full"><label>Response / Recommendation</label><textarea id="advAdminReply" placeholder="Write the response that will be shown to the requester"></textarea></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advAdminAttachment" type="file"></div><div class="adv-field full"><div class="adv-modal-actions" style="justify-content:flex-start"><button class="adv-btn primary" onclick="window._advAdminAction(\'respond\')">Send Response</button><button class="adv-btn warn" onclick="window._advAdminAction(\'request_info\')">Request More Information</button><button class="adv-btn secondary" onclick="window._advScheduleSession()">Schedule Session</button>'+(canClose?'<button class="adv-btn good" onclick="window._advAdminAction(\'close\')">Close Completed Request</button>':'')+'<select id="advExceptionalAction" style="padding:8px 9px;border:1px solid #d7e2e7;border-radius:9px;font-size:9px"><option value="">Exceptional Action</option><option value="duplicate">Mark as Duplicate</option><option value="out_of_scope">Mark as Out of Scope</option><option value="knowledge_guide">Direct to Knowledge Guide</option></select><button class="adv-btn ghost" onclick="window._advApplyExceptional()">Apply</button></div></div></div></div>';
  }
  window._advAdminAction=async function(action){
    if(!selectedRequest||!apiReady('_advisoryAdminAction'))return;
    var reply=String((document.getElementById('advAdminReply')||{}).value||'').trim(),file=(document.getElementById('advAdminAttachment')||{}).files&&document.getElementById('advAdminAttachment').files[0];
    if((action==='respond'||action==='request_info')&&!reply){toast('Enter a response or information request first.');return;}
    if(file&&file.size>5*1024*1024){toast('The attachment must be 5 MB or smaller.');return;}
    try{await window._advisoryAdminAction(selectedRequest.id,action,{text:reply},file||null);audit('ADVISORY_ADMIN_ACTION',action+' on '+selectedRequest.code);closeModal();await loadRecords(true);toast(action==='close'?'Request closed. The requester will be prompted to rate the service.':'Request updated successfully.');}catch(e){toast(String(e&&e.message||e));}
  };
  window._advApplyExceptional=function(){var v=String((document.getElementById('advExceptionalAction')||{}).value||'');if(!v){toast('Select an exceptional action.');return;}window._advAdminAction(v);};
  window._advScheduleSession=function(){
    var date=window.prompt('Enter the confirmed session date and time (example: 2026-07-28 10:00):','');if(!date)return;
    var duration=window.prompt('Enter the confirmed session duration:','45 minutes')||'45 minutes';
    if(!apiReady('_advisoryAdminAction'))return;
    window._advisoryAdminAction(selectedRequest.id,'schedule_session',{sessionDate:date,sessionDuration:duration,text:'Consultation session scheduled for '+date+' ('+duration+').'},null).then(async function(){audit('ADVISORY_SESSION_SCHEDULED','Scheduled session for '+selectedRequest.code);closeModal();await loadRecords(true);toast('Consultation session scheduled.');}).catch(function(e){toast(String(e&&e.message||e));});
  };

  function requesterActions(r){
    var html='';
    if(r.status==='awaiting_requester_information')html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Provide Additional Information</h3><div class="adv-form"><div class="adv-field full"><label>Clarification *</label><textarea id="advClarification" placeholder="Add the requested information"></textarea></div><div class="adv-field full"><label>Attachment (optional)</label><input id="advClarificationFile" type="file"></div><div class="adv-field full"><button class="adv-btn primary" onclick="window._advSendClarification()">Send Clarification</button></div></div></div>';
    if(r.status==='responded')html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Confirm Service Completion</h3><p style="font-size:9px;color:#718692;line-height:1.55">Confirm that the response or recommendation is sufficient. The request will then move to Completed and can be closed by Admin.</p><button class="adv-btn good" onclick="window._advConfirmComplete()">Confirm Completed</button></div>';
    if(['under_review','in_progress','awaiting_requester_information','scheduled_session'].indexOf(r.status)>=0)html+='<div style="margin-top:12px;text-align:right"><button class="adv-btn danger" onclick="window._advCancelRequest()">Cancel Request</button></div>';
    if(r.status==='closed'&&!Number(r.rating))html+='<div class="adv-card" style="margin-top:12px"><h3 class="adv-card-title">Rate Your Experience</h3><p style="font-size:9px;color:#718692">Select a satisfaction rating from 1 to 5.</p><div class="adv-stars">'+[1,2,3,4,5].map(function(n){return'<button class="adv-star" onclick="window._advRate('+n+')">★</button>';}).join('')+'</div></div>';
    return html;
  }
  window._advSendClarification=async function(){var text=String((document.getElementById('advClarification')||{}).value||'').trim(),file=(document.getElementById('advClarificationFile')||{}).files&&document.getElementById('advClarificationFile').files[0];if(!text){toast('Enter the clarification first.');return;}try{await window._advisoryRequesterAction(selectedRequest.id,'clarify',{text:text},file||null);audit('ADVISORY_CLARIFICATION','Added clarification to '+selectedRequest.code);closeModal();await loadRecords(true);toast('Clarification sent. The request is now In Progress.');}catch(e){toast(String(e&&e.message||e));}};
  window._advConfirmComplete=async function(){try{await window._advisoryRequesterAction(selectedRequest.id,'complete',{},null);audit('ADVISORY_COMPLETED','Confirmed completion of '+selectedRequest.code);closeModal();await loadRecords(true);toast('Request marked as Completed.');}catch(e){toast(String(e&&e.message||e));}};
  window._advCancelRequest=async function(){if(!window.confirm('Cancel this request?'))return;try{await window._advisoryRequesterAction(selectedRequest.id,'cancel',{},null);audit('ADVISORY_CANCELLED','Cancelled '+selectedRequest.code);closeModal();await loadRecords(true);toast('Request cancelled.');}catch(e){toast(String(e&&e.message||e));}};
  window._advRate=async function(rating){try{await window._advisoryRate(selectedRequest.id,rating);audit('ADVISORY_RATED','Rated '+selectedRequest.code+' '+rating+'/5');closeModal();await loadRecords(true);toast('Thank you. Your satisfaction rating was saved.');}catch(e){toast(String(e&&e.message||e));}};

  function showRatingNotification(){
    if(currentView!=='requests')return;
    var r=records.find(function(x){return x.status==='closed'&&!Number(x.rating);});if(!r)return;
    var key='qumc_adv_rating_notice_'+r.id;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');
    setTimeout(function(){toast('Request '+(r.code||'')+' is closed. Please rate your experience.');},400);
  }
  function closeModal(){var m=document.getElementById('advModal');if(m)m.remove();selectedRequest=null;}
  window._advCloseModal=closeModal;

})();
