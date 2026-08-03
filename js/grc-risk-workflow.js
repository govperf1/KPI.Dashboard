/* =====================================================================
   QUMC GRC — Risk & Incident Register Requests / Approval Workflow
   Separate from Performance notifications, KPI requests, Gap Analysis and
   Review & Development Center requests.
   ===================================================================== */
(function(){
  'use strict';if(window.__QUMC_GRC_RISK_WORKFLOW_V114__)return;window.__QUMC_GRC_RISK_WORKFLOW_V114__=true;
  var cache=[],unsub=null,startedFor='',approvalNoticeKey='',approvalNoticeEntry=0,approvalNoticeTimer=null;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function role(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
  function email(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
  function isAr(){return document.documentElement.dir==='rtl'||window.lang==='ar';}
  function isManager(){return role()==='department_manager'||role()==='dept_manager';}
  function isSuper(){return role()==='super_admin';}
  function isAdmin(){return role()==='admin'||isSuper();}
  function isOwner(){var r=role();return r==='risk_owner'||r==='grc_owner'||r==='platform_owner'||(Array.isArray(window._fbPerms)&&(window._fbPerms.indexOf('edit_risk_management')>=0||window._fbPerms.indexOf('*')>=0));}
  function isNoticeOwner(){var r=role();return r==='risk_owner'||r==='grc_owner'||r==='platform_owner';}
  function ownRequest(r){return String(r&&r.submittedByEmail||'').toLowerCase().trim()===email();}
  function statusLabel(s){var m={pending_manager:'Pending Department Manager Approval',pending_super_admin:'Pending Super Admin Approval',returned_requester:'Returned for Update',returned_manager:'Returned to Department Manager',rejected_manager:'Rejected by Department Manager',rejected_super_admin:'Rejected by Super Admin',published:'Published',cancelled:'Cancelled'};return m[s]||String(s||'—').replace(/_/g,' ');}
  function recordType(r){return String(r&&r.recordType||'risk').toLowerCase()==='incident'?'incident':'risk';}
  function recordLabel(r){return recordType(r)==='incident'?'Incident':'Risk';}
  function operationLabel(s,r){var label=recordLabel(r);return({add:'Add '+label,update:'Update '+label,delete:'Delete '+label})[s]||s||'—';}
  function tone(s){if(/^pending/.test(s)||/^returned/.test(s))return'warn';if(s==='published')return'good';if(/^rejected/.test(s)||s==='cancelled')return'bad';return'info';}
  function actionable(r){var s=String(r.status||'');if(isOwner())return ownRequest(r)&&s==='returned_requester';if(isManager())return s==='pending_manager'||s==='returned_manager';if(isSuper())return s==='pending_super_admin';return false;}
  function approvalNoticeRows(){
    return cache.filter(function(r){
      var s=String(r&&r.status||'');
      if(isSuper())return s==='pending_super_admin';
      if(isManager())return s==='pending_manager'||s==='returned_manager';
      if(isNoticeOwner())return ownRequest(r)&&['pending_manager','pending_super_admin','returned_manager','returned_requester'].indexOf(s)>=0;
      return false;
    });
  }
  function approvalNoticeSignature(rows){
    return [approvalNoticeEntry,role(),email(),rows.map(function(r){return String(r.id||'')+':'+String(r.status||'')+':'+String(r.updatedAtIso||r.updatedAtText||r.createdAtIso||'');}).join('|')].join('::');
  }
  function ensureApprovalNoticeStyles(){
    if(document.getElementById('_grcApprovalNoticeStyles'))return;
    var st=document.createElement('style');st.id='_grcApprovalNoticeStyles';st.textContent=`
#_grcApprovalNoticeOv{position:fixed;inset:0;z-index:2147483655;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(7,24,39,.64);backdrop-filter:blur(7px);box-sizing:border-box}
#_grcApprovalNoticeOv .grc-apn-dialog{width:min(920px,96vw);max-height:88vh;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(180deg,#fff,#f7fafb);border:1px solid rgba(255,255,255,.82);border-radius:22px;box-shadow:0 28px 86px rgba(7,24,39,.34)}
#_grcApprovalNoticeOv .grc-apn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:20px 22px 16px;border-bottom:1px solid #dce7eb;background:#fff}
#_grcApprovalNoticeOv .grc-apn-head h2{margin:0;color:#173f5f;font-size:18px;font-weight:900}
#_grcApprovalNoticeOv .grc-apn-head p{margin:5px 0 0;color:#647b88;font-size:11px;line-height:1.5}
#_grcApprovalNoticeOv .grc-apn-close{width:36px;height:36px;border:1px solid #d9e4e9;border-radius:11px;background:#f4f8fa;color:#365568;font-size:21px;cursor:pointer}
#_grcApprovalNoticeOv .grc-apn-body{padding:18px 22px;overflow:auto}
#_grcApprovalNoticeOv .grc-apn-summary{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;margin-bottom:14px;border:1px solid rgba(217,119,6,.24);border-radius:15px;background:rgba(255,247,237,.88)}
#_grcApprovalNoticeOv .grc-apn-summary span{font-size:11px;font-weight:900;color:#7c4a10;text-transform:uppercase;letter-spacing:.045em}
#_grcApprovalNoticeOv .grc-apn-summary b{font-size:14px;color:#b45309}
#_grcApprovalNoticeOv .grc-apn-card{border:1px solid #dce6eb;border-radius:15px;padding:14px;background:#fff;margin-bottom:11px;box-shadow:0 7px 20px rgba(23,63,95,.05)}
#_grcApprovalNoticeOv .grc-apn-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#_grcApprovalNoticeOv .grc-apn-card strong{display:block;color:#173f5f;font-size:12px;font-weight:900}
#_grcApprovalNoticeOv .grc-apn-card small{display:block;color:#6a808d;font-size:10px;margin-top:4px}
#_grcApprovalNoticeOv .grc-apn-status{white-space:nowrap;padding:5px 9px;border-radius:999px;font-size:9.5px;font-weight:900;background:#fff4df;color:#a85c06;border:1px solid #f2d5a5}
#_grcApprovalNoticeOv .grc-apn-status.bad{background:#fff0f1;color:#b3262d;border-color:#efc6c9}
#_grcApprovalNoticeOv .grc-apn-meta{display:grid;grid-template-columns:110px minmax(0,1fr);gap:7px 12px;margin-top:12px;font-size:10.5px}
#_grcApprovalNoticeOv .grc-apn-meta span{color:#718590}#_grcApprovalNoticeOv .grc-apn-meta b{color:#2f4f61;font-weight:800}
#_grcApprovalNoticeOv .grc-apn-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:13px}
#_grcApprovalNoticeOv .grc-apn-btn{border:0;border-radius:10px;padding:8px 13px;font-size:10.5px;font-weight:900;cursor:pointer}
#_grcApprovalNoticeOv .grc-apn-btn.primary{background:#0f7f86;color:#fff}#_grcApprovalNoticeOv .grc-apn-btn.secondary{background:#eaf1f4;color:#294f61}
#_grcApprovalNoticeOv .grc-apn-foot{display:flex;justify-content:flex-end;gap:9px;padding:14px 22px 18px;border-top:1px solid #dce7eb;background:#fff}
@media(max-width:650px){#_grcApprovalNoticeOv{padding:10px}#_grcApprovalNoticeOv .grc-apn-dialog{max-height:94vh;border-radius:17px}#_grcApprovalNoticeOv .grc-apn-meta{grid-template-columns:1fr}#_grcApprovalNoticeOv .grc-apn-summary{align-items:flex-start;flex-direction:column}}
`;document.head.appendChild(st);
  }
  function closeApprovalNotice(){var ov=document.getElementById('_grcApprovalNoticeOv');if(ov)ov.remove();}
  function approvalNoticeTitle(){
    if(isSuper())return isAr()?'طلبات اعتماد GRC بانتظار الموافقة النهائية':'GRC Requests Awaiting Final Approval';
    if(isManager())return isAr()?'طلبات GRC بانتظار موافقتك':'GRC Requests Awaiting Your Approval';
    return isAr()?'حالة طلباتك في GRC':'Your GRC Approval Requests';
  }
  function approvalNoticeSubtitle(){
    if(isSuper())return isAr()?'راجع طلبات تعديل سجلات المخاطر والحوادث واعتمد النشر النهائي.':'Review Risk and Incident Register changes awaiting final publication approval.';
    if(isManager())return isAr()?'راجع طلبات قسمك ثم وافق عليها أو أعدها إلى المالك للتعديل.':'Review your department requests and approve, return, or reject them.';
    return isAr()?'تظهر هنا طلباتك التي ما زالت تحت الاعتماد أو تحتاج منك تعديلًا.':'These requests are still in approval or require an update from you.';
  }
  function approvalNoticeCard(r){
    var s=String(r.status||''),bad=/^returned|^rejected/.test(s),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+recordLabel(r));
    var actionText=actionable(r)?(isAr()?'يحتاج إجراء':'Needs action'):(isAr()?'قيد الاعتماد':'In approval');
    return '<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>'+esc(r.requestCode||r.id)+'</strong><small>'+esc(operationLabel(r.operation,r))+' · '+esc(r.department||'')+'</small></div><span class="grc-apn-status '+(bad?'bad':'')+'">'+esc(statusLabel(s))+'</span></div><div class="grc-apn-meta"><span>'+esc(isAr()?'السجل':'Record')+'</span><b>'+esc(target)+'</b><span>'+esc(isAr()?'مقدم الطلب':'Submitted by')+'</span><b>'+esc(r.submittedByName||r.submittedByEmail||'—')+'</b><span>'+esc(isAr()?'الحالة':'Status')+'</span><b>'+esc(actionText)+'</b></div><div class="grc-apn-actions"><button class="grc-apn-btn secondary" onclick="window._grcRiskApprovalNoticeOpenRequest(\''+esc(r.id)+'\')">'+esc(isAr()?'عرض التفاصيل':'View details')+'</button></div>'+actions(r)+'</article>';
  }
  function renderApprovalNoticeBody(){
    var ov=document.getElementById('_grcApprovalNoticeOv');if(!ov)return;
    var rows=approvalNoticeRows(),body=ov.querySelector('.grc-apn-body');if(!body)return;
    body.innerHTML='<div class="grc-apn-summary"><span>'+esc(isAr()?'حالة طلبات الاعتماد':'Approval request status')+'</span><b>'+rows.length+' '+esc(isAr()?'طلب يحتاج متابعة':'request(s) require attention')+'</b></div>'+rows.map(approvalNoticeCard).join('');
    if(!rows.length)closeApprovalNotice();
  }
  function showApprovalNotice(force){
    if(!document.body.classList.contains('grc-mode'))return;
    if(!(isNoticeOwner()||isManager()||isSuper()))return;
    var rows=approvalNoticeRows();if(!rows.length)return;
    var key=approvalNoticeSignature(rows);if(!force&&approvalNoticeKey===key)return;approvalNoticeKey=key;
    ensureApprovalNoticeStyles();closeApprovalNotice();
    var ov=document.createElement('div');ov.id='_grcApprovalNoticeOv';ov.innerHTML='<section class="grc-apn-dialog" role="dialog" aria-modal="true" aria-labelledby="_grcApnTitle"><header class="grc-apn-head"><div><h2 id="_grcApnTitle">'+esc(approvalNoticeTitle())+'</h2><p>'+esc(approvalNoticeSubtitle())+'</p></div><button class="grc-apn-close" type="button" onclick="window._grcRiskApprovalNoticeClose()">×</button></header><main class="grc-apn-body"></main><footer class="grc-apn-foot"><button class="grc-apn-btn secondary" type="button" onclick="window._grcRiskApprovalNoticeClose()">'+esc(isAr()?'حسنًا':'Got it')+'</button><button class="grc-apn-btn primary" type="button" onclick="window._grcRiskApprovalNoticeOpenAll()">'+esc(isAr()?'فتح الطلبات':'Open requests')+'</button></footer></section>';
    ov.addEventListener('click',function(e){if(e.target===ov)closeApprovalNotice();});document.body.appendChild(ov);renderApprovalNoticeBody();
  }
  function scheduleApprovalNotice(force){clearTimeout(approvalNoticeTimer);approvalNoticeTimer=setTimeout(function(){try{showApprovalNotice(!!force);}catch(e){console.warn('[GRC Approval Notice]',e);}},420);}
  window._grcRiskApprovalNoticeClose=closeApprovalNotice;
  window._grcRiskApprovalNoticeOpenAll=function(){closeApprovalNotice();window._grcRiskOpenProfile&&window._grcRiskOpenProfile();};
  window._grcRiskApprovalNoticeOpenRequest=function(id){closeApprovalNotice();window._grcRiskOpenProfile&&window._grcRiskOpenProfile(id);};
  window._grcRiskApprovalEntryNoticeReset=function(){approvalNoticeEntry++;approvalNoticeKey='';scheduleApprovalNotice(true);};
  function notifSeenKey(){return 'qumc_grc_risk_notif_seen_v111::'+email()+'::'+role();}
  function readNotifSeen(){try{var x=JSON.parse(localStorage.getItem(notifSeenKey())||'[]');return Array.isArray(x)?x.map(String):[];}catch(_){return[];}}
  function writeNotifSeen(rows){try{var out=[],seen={};(rows||[]).map(String).reverse().forEach(function(x){if(!x||seen[x])return;seen[x]=1;out.push(x);});out=out.reverse().slice(-600);localStorage.setItem(notifSeenKey(),JSON.stringify(out));}catch(_){}}
  function notifStamp(r){return String(r&&r.updatedAtIso||r&&r.createdAtIso||r&&r.updatedAtText||r&&r.createdAtText||'');}
  function notifKey(r){return String(r&&r.id||r&&r.requestCode||'')+'::'+String(r&&r.status||'')+'::'+notifStamp(r);}
  function lastHistoryActor(r){var h=Array.isArray(r&&r.history)?r.history:[],last=h.length?h[h.length-1]:null;return String(last&&last.by||'').toLowerCase().trim();}
  function notificationHandledByMe(r){var me=email();if(!me)return false;var by=lastHistoryActor(r);if(by)return by===me;var s=String(r&&r.status||'');if(s==='pending_manager'||s==='cancelled')return String(r&&r.submittedByEmail||'').toLowerCase().trim()===me;if(s==='pending_super_admin'||s==='returned_requester'||s==='rejected_manager')return String(r&&r.managerEmail||'').toLowerCase().trim()===me;if(s==='returned_manager'||s==='rejected_super_admin'||s==='published')return String(r&&r.superAdminEmail||'').toLowerCase().trim()===me;return false;}
  function notificationRows(){return cache.slice().sort(function(a,b){var au=notificationUnread(a),bu=notificationUnread(b);if(au!==bu)return bu?1:-1;return notifStamp(b).localeCompare(notifStamp(a))||String(b.id||'').localeCompare(String(a.id||''));});}
  function notificationUnread(r){if(!r||notificationHandledByMe(r))return false;return readNotifSeen().indexOf(notifKey(r))<0;}
  function notificationTone(r){var s=String(r&&r.status||'');if(!notificationUnread(r))return'gray';if(s==='published')return'green';if(/^rejected/.test(s)||s==='cancelled')return'red';if(/^returned/.test(s))return'amber';return'teal';}
  function markNotificationRead(r){if(!r)return;var k=notifKey(r),seen=readNotifSeen();if(seen.indexOf(k)<0){seen.push(k);writeNotifSeen(seen);}refreshBadge();}
  function markAllNotificationsRead(){var seen=readNotifSeen();cache.forEach(function(r){var k=notifKey(r);if(seen.indexOf(k)<0)seen.push(k);});writeNotifSeen(seen);refreshBadge();}
  function refreshBadge(){var n=cache.filter(notificationUnread).length,el=document.getElementById('grcRiskNotifCount'),req=document.getElementById('grcRiskRequestCount'),profile=document.getElementById('_grcProfileRiskCount');if(el){el.textContent=String(n);el.style.display=n?'grid':'none';}if(req){req.textContent=String(cache.length);req.style.display=cache.length?'grid':'none';}if(profile)profile.textContent=String(cache.filter(actionable).length);}
  function stop(){if(unsub)try{unsub();}catch(_){}unsub=null;startedFor='';cache=[];window.__grcRiskRequestCache=[];refreshBadge();var panel=document.getElementById('_grcRiskNotifPanel');if(panel)panel.remove();closeApprovalNotice();}
  function start(){if(!document.body.classList.contains('grc-mode')){if(unsub||startedFor)stop();return;}var key=email()+'|'+role()+'|'+String(window._fbDept||window.currentUserDept||'');if(!email()){cache=[];refreshBadge();return;}if(typeof window._grcRiskRequestsSubscribe!=='function'){cache=[];window.__grcRiskRequestCache=[];refreshBadge();return;}if(startedFor===key&&unsub)return;if(unsub)try{unsub();}catch(_){}startedFor=key;unsub=window._grcRiskRequestsSubscribe(function(rows,err){if(err)return;cache=Array.isArray(rows)?rows:[];window.__grcRiskRequestCache=cache;try{document.dispatchEvent(new CustomEvent('grc:riskRequestsUpdated',{detail:{rows:cache}}));}catch(_e){}refreshBadge();var ov=document.getElementById('_grcRiskProfileOv');if(ov)renderProfileBody();if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();var np=document.getElementById('_grcRiskNotifPanel');if(np&&typeof renderNotificationPanel==='function')renderNotificationPanel(np);scheduleApprovalNotice(false);});}
  function fieldRows(obj,type){obj=obj||{};var labels=type==='incident'?{id:'Incident ID',date:'Incident Date',category:'Category',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required',department:'Department',status:'Status'}:{id:'Risk ID',riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',controlType:'Control Type',actionStatus:'Action Status',department:'Department'};return Object.keys(labels).map(function(k){return'<tr><th>'+labels[k]+'</th><td>'+esc(obj[k]==null?'—':obj[k])+'</td></tr>';}).join('');}
  function changedTable(r){var before=r.currentRecord||{},after=r.proposedRecord||{},keys=Array.isArray(r.changedFields)&&r.changedFields.length?r.changedFields:(recordType(r)==='incident'?['date','category','contributingFactors','investigationRequired','department','status']:['riskIdentified','riskCategory','likelihood','impact','controlType','actionStatus']);return'<table class="grc-risk-diff"><thead><tr><th>Field</th><th>Current Value</th><th>Proposed Value</th></tr></thead><tbody>'+keys.map(function(k){return'<tr><th>'+esc(k.replace(/([A-Z])/g,' $1'))+'</th><td>'+esc(before[k]==null?'—':before[k])+'</td><td>'+esc(after[k]==null?'—':after[k])+'</td></tr>';}).join('')+'</tbody></table>';}
  function inlineDecisionShell(){return '<div class="grc-risk-inline-decision" hidden></div>';}
  function actions(r){var s=String(r.status||''),html='';
    if(isManager()&&(s==='pending_manager'||s==='returned_manager'))html='<button class="grc-risk-action good" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_approve\',this)">Approve & Forward</button><button class="grc-risk-action warn" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_return\',this)">Return for Update</button><button class="grc-risk-action bad" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_reject\',this)">Reject</button>';
    if(isSuper()&&s==='pending_super_admin')html='<button class="grc-risk-action good" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_approve\',this)">Approve & Publish</button><button class="grc-risk-action warn" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_return\',this)">Return to Department Manager</button><button class="grc-risk-action bad" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_reject\',this)">Reject</button>';
    if(isOwner()&&ownRequest(r)&&s==='returned_requester')html='<button class="grc-risk-action good" onclick="window._grcRiskEditResubmit(\''+esc(r.id)+'\')">Edit & Resubmit</button>';
    if(isOwner()&&ownRequest(r)&&s==='pending_manager')html='<button class="grc-risk-action bad ghost" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'cancel\',this)">Cancel Request</button>';
    return html?'<div class="grc-risk-request-actions">'+html+'</div>'+inlineDecisionShell():'';
  }
  function card(r){var label=recordLabel(r),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+label);return'<article class="grc-risk-request-card"><div class="grc-risk-card-head"><div><strong>'+esc(r.requestCode||r.id)+'</strong><small>'+esc(operationLabel(r.operation,r))+' · '+esc(r.department||'')+'</small></div><span class="grc-risk-status '+tone(r.status)+'">'+esc(statusLabel(r.status))+'</span></div><div class="grc-risk-card-grid"><span>'+label+'</span><b>'+esc(target)+'</b><span>Submitted by</span><b>'+esc(r.submittedByName||r.submittedByEmail||'—')+'</b><span>Submitted</span><b>'+esc(r.createdAtText||r.createdAtIso||'—')+'</b><span>Last update</span><b>'+esc(r.updatedAtText||r.updatedAtIso||'—')+'</b></div><button class="grc-risk-details-btn" onclick="window._grcRiskShowDetails(\''+esc(r.id)+'\')">View Request Details</button>'+actions(r)+'</article>';}
  function filtered(){var tab=(document.querySelector('[data-grc-risk-tab].active')||{}).dataset&&document.querySelector('[data-grc-risk-tab].active').dataset.grcRiskTab||'all';return cache.filter(function(r){if(tab==='all')return true;if(tab==='action')return actionable(r);if(tab==='published')return r.status==='published';if(tab==='returned')return /^returned|^rejected/.test(r.status);return r.status===tab;});}
  function renderProfileBody(){var body=document.getElementById('_grcRiskProfileBody');if(!body)return;var rows=filtered();body.innerHTML=rows.length?rows.map(card).join(''):'<div class="grc-risk-empty">No Risk or Incident Register requests in this view.</div>';var count=document.getElementById('_grcRiskProfileCount');if(count)count.textContent=rows.length+' request(s)';}
  function closeProfileMenu(){var m=document.getElementById('_grcUserProfileMenu');if(m)m.remove();}
  var GRC_REQUEST_TYPES=[
    'Access / Permission Request','Role or Permission Update','Data Entry Permission',
    'System Issue','Data Correction Request','General GRC Request','Other'
  ];
  window._grcShowSubmitRequestForm=function(){
    closeProfileMenu();var old=document.getElementById('grcSubmitReqOv');if(old)old.remove();
    var ov=document.createElement('div');ov.id='grcSubmitReqOv';ov.className='qumc-request-overlay qumc-submit-request-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483650;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var opts=GRC_REQUEST_TYPES.map(function(t){return '<option value="'+esc(t)+'">'+esc(t)+'</option>';}).join('');
    ov.innerHTML='<div class="qumc-request-card qumc-submit-request-card grc-submit-request-light" style="background:linear-gradient(180deg,#ffffff,#f6fafc);border:1px solid #c9dbe7;border-radius:18px;padding:28px;width:min(480px,100%);display:flex;flex-direction:column;gap:16px;box-shadow:0 24px 70px rgba(7,24,39,.28)">'+
      '<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:14px;font-weight:850;color:#152538">Submit a Request</div><div style="font-size:10px;color:#60758a;margin-top:2px">GRC access, permission and system requests</div></div><button type="button" onclick="document.getElementById(\'grcSubmitReqOv\').remove()" style="width:30px;height:30px;background:#eef3f7;border:1px solid #d7e2ea;border-radius:7px;color:#52657a;cursor:pointer;font-size:15px">✕</button></div>'+
      '<div><label style="display:block;font-size:10px;font-weight:750;color:#355066;margin-bottom:5px">Request Type</label><select id="grcReqTypeSelect" style="width:100%;padding:10px 12px;background:#f8fbfd;border:1px solid #bfd2df;border-radius:8px;color:#152538;font-size:11px;font-family:inherit;outline:none">'+opts+'</select></div>'+
      '<div><label style="display:block;font-size:10px;font-weight:750;color:#355066;margin-bottom:5px">Request Details *</label><textarea id="grcReqMessageArea" rows="5" placeholder="Describe the requested access, permission or system change..." style="width:100%;padding:10px 12px;background:#f8fbfd;border:1px solid #bfd2df;border-radius:8px;color:#152538;font-size:11px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none"></textarea></div>'+
      '<div id="grcReqSubmitFb" style="font-size:10px;font-weight:600;display:none;padding:7px 12px;border-radius:7px"></div>'+
      '<button id="grcReqSubmitBtn" type="button" onclick="window._grcDoSubmitRequest()" style="padding:10px 20px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:9px;color:#fff;font-size:11px;font-weight:750;cursor:pointer;font-family:inherit">Submit Request</button></div>';
    document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};setTimeout(function(){var x=document.getElementById('grcReqMessageArea');if(x)x.focus();},80);
  };
  window._grcDoSubmitRequest=function(){
    var type=document.getElementById('grcReqTypeSelect'),msg=document.getElementById('grcReqMessageArea'),fb=document.getElementById('grcReqSubmitFb'),btn=document.getElementById('grcReqSubmitBtn');
    function feedback(text,ok){if(!fb)return;fb.textContent=text;fb.style.display='block';fb.style.color=ok?'#16A34A':'#DC2626';fb.style.background=ok?'rgba(22,163,74,.08)':'rgba(220,38,38,.08)';}
    if(!msg||!String(msg.value||'').trim()){feedback('⚠ Please enter request details.',false);return;}
    if(typeof window._grcRequestsSubmit!=='function'){feedback('⚠ GRC requests are not available. Check the connection.',false);return;}
    if(btn){btn.disabled=true;btn.textContent='Submitting...';}
    window._grcRequestsSubmit(type&&type.value,String(msg.value).trim()).then(function(){feedback('✓ Request submitted. You will be notified when it is reviewed.',true);msg.value='';if(btn){btn.disabled=false;btn.textContent='Submit Another';}setTimeout(function(){var x=document.getElementById('grcSubmitReqOv');if(x)x.remove();},2200);}).catch(function(err){feedback('⚠ '+String(err&&err.message||err),false);if(btn){btn.disabled=false;btn.textContent='Submit Request';}});
  };
  function requestStatus(s){return({pending:'Pending',approved:'Approved',rejected:'Rejected'})[s]||String(s||'—');}
  function requestStatusColor(s){return({pending:'#D97706',approved:'#16A34A',rejected:'#DC2626'})[s]||'#64748b';}
  window._grcShowMyRequests=function(){
    closeProfileMenu();var old=document.getElementById('grcMyReqOv');if(old)old.remove();var admin=isAdmin();
    var ov=document.createElement('div');ov.id='grcMyReqOv';ov.className='qumc-request-overlay qumc-my-requests-overlay';ov.style.cssText='position:fixed;inset:0;z-index:2147483650;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');box.className='qumc-request-card qumc-my-requests-card';box.style.cssText='background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(760px,100%);max-height:82vh;display:flex;flex-direction:column;gap:16px;';
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:14px;font-weight:800;color:#e2e8f0">'+(admin?'GRC Requests':'My Requests')+'</div><div style="font-size:10px;color:#64748b;margin-top:2px">'+(admin?'GRC access, permission and system requests':'Your GRC access, permission and system requests')+'</div></div><div style="display:flex;gap:8px"><button type="button" onclick="document.getElementById(\'grcMyReqOv\').remove();window._grcShowSubmitRequestForm()" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">+ New Request</button><button type="button" onclick="document.getElementById(\'grcMyReqOv\').remove()" style="width:30px;height:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#94a3b8;cursor:pointer;font-size:15px">✕</button></div></div><div id="grcMyReqBody" style="overflow-y:auto;flex:1;min-height:160px;display:flex;align-items:center;justify-content:center"><div style="color:#64748b;font-size:11px">Loading...</div></div>';
    ov.appendChild(box);document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
    var api=admin?window._grcRequestsGetAll:window._grcRequestsGetMine;if(typeof api!=='function'){document.getElementById('grcMyReqBody').innerHTML='<div style="color:#DC2626;font-size:11px">GRC requests are not available.</div>';return;}
    api().then(function(rows){var body=document.getElementById('grcMyReqBody');if(!body)return;if(!rows||!rows.length){body.innerHTML='<div style="color:#64748b;font-size:11px;text-align:center;padding:32px">No GRC requests have been submitted.</div>';return;}body.style.display='block';body.innerHTML='<div style="display:flex;flex-direction:column;gap:10px;padding:2px">'+rows.map(function(r){var color=requestStatusColor(r.status),date=typeof window._fmtTs==='function'?window._fmtTs(r.createdAt):'—';return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;font-weight:700;color:#e2e8f0">'+esc(r.requestType||'—')+'</span><span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:'+color+'22;color:'+color+'">'+esc(requestStatus(r.status))+'</span></div><span style="font-size:9px;color:#475569;white-space:nowrap">'+esc(date)+'</span></div>'+(admin?'<div style="font-size:9px;color:#64748b">'+esc(r.userName||r.userEmail||'—')+' · '+esc(r.department||'—')+'</div>':'')+'<div style="font-size:10.5px;color:#94a3b8;line-height:1.5">'+esc(r.message||'')+'</div>'+(r.adminComment?'<div style="background:rgba(1,149,175,.08);border:1px solid rgba(1,149,175,.2);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:3px">Admin Response:</div><div style="font-size:10.5px;color:#e2e8f0">'+esc(r.adminComment)+'</div></div>':(r.status==='pending'?'<div style="font-size:9px;color:#475569;font-style:italic">Awaiting response...</div>':''))+(admin?'<div style="display:flex;gap:7px;justify-content:flex-end"><button type="button" onclick="window._grcRespondSystemRequest(\''+esc(r.id)+'\',\'approved\')" style="border:0;border-radius:8px;padding:7px 11px;background:#166534;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Approve / Respond</button><button type="button" onclick="window._grcRespondSystemRequest(\''+esc(r.id)+'\',\'rejected\',this)" style="border:0;border-radius:8px;padding:7px 11px;background:#991b1b;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Reject</button></div>':'')+'</div>';}).join('')+'</div>';}).catch(function(err){var b=document.getElementById('grcMyReqBody');if(b)b.innerHTML='<div style="color:#DC2626;font-size:11px">Error: '+esc(err&&err.message||err)+'</div>';});
  };
  window._grcRespondSystemRequest=function(id,status,btn){
    if(status==='rejected'&&btn){var actions=btn.parentElement,old=actions&&actions.parentElement&&actions.parentElement.querySelector('.grc-system-inline-decision');if(old)old.remove();var box=document.createElement('div');box.className='grc-system-inline-decision';box.innerHTML='<div class="grc-risk-inline-title">Reject Request</div><div class="grc-risk-inline-copy">A rejection reason is required.</div><textarea class="grc-risk-inline-textarea" rows="3" placeholder="Enter the rejection reason..."></textarea><div class="grc-risk-inline-error"></div><div class="grc-risk-inline-buttons"><button class="grc-risk-inline-confirm bad" type="button">Confirm Reject</button><button class="grc-risk-inline-cancel" type="button">Cancel</button></div>';actions.parentElement.appendChild(box);var confirmBtn=box.querySelector('.grc-risk-inline-confirm'),cancelBtn=box.querySelector('.grc-risk-inline-cancel'),ta=box.querySelector('textarea'),errEl=box.querySelector('.grc-risk-inline-error');cancelBtn.onclick=function(){box.remove();};confirmBtn.onclick=function(){var comment=String(ta.value||'').trim();if(!comment){ta.classList.add('is-invalid');errEl.textContent='A rejection reason is required.';return;}confirmBtn.disabled=true;cancelBtn.disabled=true;ta.disabled=true;window._grcRequestsRespond(id,status,comment).then(function(){var x=document.getElementById('grcMyReqOv');if(x)x.remove();window._grcShowMyRequests();}).catch(function(err){confirmBtn.disabled=false;cancelBtn.disabled=false;ta.disabled=false;errEl.textContent=String(err&&err.message||err);});};setTimeout(function(){ta.focus();},20);return;}
    window._grcRequestsRespond(id,status,'').then(function(){var x=document.getElementById('grcMyReqOv');if(x)x.remove();window._grcShowMyRequests();}).catch(function(err){var body=document.getElementById('grcMyReqBody');if(body){var e=document.createElement('div');e.className='grc-system-inline-error';e.textContent=String(err&&err.message||err);body.prepend(e);}});
  };
  function openCenterRequest(){window._grcShowSubmitRequestForm();}
  function openCenterRequests(){window._grcShowMyRequests();}
  window._grcRiskOpenProfileMenu=function(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}start();var old=document.getElementById('_grcUserProfileMenu');if(old){old.remove();return;}
    var anchor=ev&&ev.currentTarget||document.querySelector('.grc-profile-trigger'),rect=anchor&&anchor.getBoundingClientRect(),menu=document.createElement('div');
    var name=window._fbName||window.currentUserName||'User',dept=window._fbDept||window.currentUserDept||'—',last='Current session';
    try{last=(window._fbLastLogin||sessionStorage.getItem('qumc_last_login')||'Current session');}catch(_){}
    menu.id='_grcUserProfileMenu';menu.className='qumc-profile-drop grc-user-profile-menu grc-profile-drop-open';menu.style.display='block';menu.style.top=((rect&&rect.bottom||58)+8)+'px';menu.style.right=Math.max(12,window.innerWidth-(rect&&rect.right||window.innerWidth-20))+'px';
    menu.innerHTML='<div class="qumc-profile-head"><div class="qumc-profile-avatar">'+esc(String(name).charAt(0).toUpperCase())+'</div><div style="min-width:0"><div class="qumc-profile-name">'+esc(name)+'</div><div class="qumc-profile-email">'+esc(email()||'—')+'</div></div></div>'+
      '<div class="qumc-profile-section-title">Profile</div><div class="qumc-profile-grid"><span>Name</span><b>'+esc(name)+'</b><span>Role</span><b>'+esc(role().replace(/_/g,' '))+'</b><span>Department</span><b>'+esc(dept)+'</b><span>Last Login</span><b>'+esc(last)+'</b></div>'+
      '<div class="grc-profile-task-panel"><div class="grc-profile-task-title">Requests</div>'+
        '<button class="grc-profile-task primary" onclick="window._grcRiskOpenCenterRequest()"><span>＋</span><div><strong>Submit a Request</strong><small>Request GRC access, permission or system support</small></div></button>'+
        '<button class="grc-profile-task" onclick="window._grcRiskOpenCenterRequests()"><span>▤</span><div><strong>My Requests</strong><small>Track GRC system and access requests</small></div></button>'+
        '<button class="grc-profile-task" onclick="document.getElementById(\'_grcUserProfileMenu\').remove();window._grcRiskOpenProfile()"><span>◇</span><div><strong>Risk & Incident Registers</strong><small>Approval requests and publication status</small></div><i id="_grcProfileRiskCount">'+cache.filter(actionable).length+'</i></button></div>'+
      '<button class="qumc-logout-btn grc-profile-logout" onclick="document.getElementById(\'_grcUserProfileMenu\').remove();if(window.qumcLogoutToLogin)window.qumcLogoutToLogin(event);else if(window._doLogout)window._doLogout();" type="button"><svg fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24" width="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg> Logout</button>';
    document.body.appendChild(menu);
  };
  window._grcRiskOpenCenterRequest=openCenterRequest;
  window._grcRiskOpenCenterRequests=openCenterRequests;

  window._grcRiskOpenProfile=function(requestId){start();var old=document.getElementById('_grcRiskProfileOv');if(old)old.remove();var ov=document.createElement('div');ov.id='_grcRiskProfileOv';ov.className='grc-risk-overlay';ov.innerHTML='<div class="grc-risk-dialog wide"><header><div><h2>Risk & Incident Registers</h2><p>Additions, updates and deletion requests with the GRC approval workflow.</p></div><button onclick="document.getElementById(\'_grcRiskProfileOv\').remove()">×</button></header><div class="grc-risk-profile-summary"><span id="_grcRiskProfileCount">0 request(s)</span><div class="grc-risk-tabs"><button class="active" data-grc-risk-tab="all">All</button><button data-grc-risk-tab="action">Needs Action</button><button data-grc-risk-tab="returned">Returned / Rejected</button><button data-grc-risk-tab="published">Published</button></div></div><main id="_grcRiskProfileBody"></main></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(btn){btn.onclick=function(){ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(x){x.classList.remove('active');});btn.classList.add('active');renderProfileBody();};});renderProfileBody();if(requestId)setTimeout(function(){window._grcRiskShowDetails(requestId);},50);};
  window._grcRiskShowDetails=function(id){var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;var old=document.getElementById('_grcRiskDetailsOv');if(old)old.remove();var ov=document.createElement('div');ov.id='_grcRiskDetailsOv';ov.className='grc-risk-overlay inner';var content=r.operation==='update'?changedTable(r):'<table class="grc-risk-record-table"><tbody>'+fieldRows(r.operation==='delete'?r.currentRecord:r.proposedRecord,recordType(r))+'</tbody></table>';ov.innerHTML='<div class="grc-risk-dialog"><header><div><h2>'+esc(r.requestCode||r.id)+'</h2><p>'+esc(operationLabel(r.operation,r))+' · '+esc(statusLabel(r.status))+'</p></div><button onclick="document.getElementById(\'_grcRiskDetailsOv\').remove()">×</button></header><main>'+content+(r.deleteReason?'<div class="grc-risk-note"><b>Deletion reason</b>'+esc(r.deleteReason)+'</div>':'')+(r.managerNote?'<div class="grc-risk-note"><b>Department Manager note</b>'+esc(r.managerNote)+'</div>':'')+(r.superAdminNote?'<div class="grc-risk-note"><b>Super Admin note</b>'+esc(r.superAdminNote)+'</div>':'')+actions(r)+'</main></div>';document.body.appendChild(ov);};
  function decisionCopy(r,action){
    var isReturn=/return/.test(action),isReject=/reject/.test(action),isApprove=/approve/.test(action),isCancel=action==='cancel';
    if(isReturn)return {tone:'warn',title:isAr()?'إعادة الطلب للتعديل':'Return for Update',text:isAr()?'اكتب سبب الإعادة بوضوح. سيتم إرساله مع الطلب إلى صاحب الطلب.':'Enter a clear reason for returning this request. The comment will be sent with the request.',label:isAr()?'سبب الإعادة *':'Return reason *',confirm:isAr()?'إعادة الطلب':'Return Request',needNote:true};
    if(isReject)return {tone:'bad',title:isAr()?'رفض الطلب':'Reject Request',text:isAr()?'سبب الرفض إلزامي ولن يمكن إرسال الرفض بدونه.':'A rejection reason is required before this request can be rejected.',label:isAr()?'سبب الرفض *':'Rejection reason *',confirm:isAr()?'تأكيد الرفض':'Confirm Reject',needNote:true};
    if(isCancel)return {tone:'bad',title:isAr()?'إلغاء الطلب':'Cancel Request',text:isAr()?'هل تريد إلغاء هذا الطلب؟ لن يتم إرساله إلى المرحلة التالية.':'Cancel this request? It will not continue to the next approval stage.',confirm:isAr()?'تأكيد الإلغاء':'Confirm Cancel',needNote:false};
    if(action==='super_approve')return {tone:'good',title:isAr()?'اعتماد ونشر الطلب':'Approve & Publish',text:(isAr()?'سيتم اعتماد هذا التغيير ونشره مباشرة في سجل ':'Approve and publish this change directly in the ')+(recordLabel(r))+(isAr()?'؟':' Register?'),confirm:isAr()?'اعتماد ونشر':'Approve & Publish',needNote:false};
    return {tone:'good',title:isAr()?'اعتماد وتحويل الطلب':'Approve & Forward',text:isAr()?'سيتم اعتماد الطلب وتحويله إلى الاعتماد النهائي.':'Approve this request and forward it to final approval.',confirm:isAr()?'اعتماد وتحويل':'Approve & Forward',needNote:false};
  }
  function decisionPanelFromButton(btn){var actions=btn&&btn.closest&&btn.closest('.grc-risk-request-actions');if(!actions)return null;var panel=actions.nextElementSibling;return panel&&panel.classList&&panel.classList.contains('grc-risk-inline-decision')?panel:null;}
  window._grcRiskCloseDecision=function(btn){var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;panel.hidden=true;panel.innerHTML='';panel.className='grc-risk-inline-decision';};
  window._grcRiskDecision=function(id,action,btn){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=decisionPanelFromButton(btn);if(!panel)return;
    var c=decisionCopy(r,action),note=c.needNote?'<label class="grc-risk-inline-label">'+esc(c.label)+'</label><textarea class="grc-risk-inline-textarea" rows="3" placeholder="'+esc(isAr()?'اكتب السبب هنا...':'Enter the reason here...')+'"></textarea>':'';
    panel.hidden=false;panel.className='grc-risk-inline-decision '+c.tone;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(c.title)+'</div><div class="grc-risk-inline-copy">'+esc(c.text)+'</div>'+note+'<div class="grc-risk-inline-error" aria-live="polite"></div><div class="grc-risk-inline-buttons"><button type="button" class="grc-risk-inline-confirm '+c.tone+'" onclick="window._grcRiskSubmitDecision(\''+esc(id)+'\',\''+esc(action)+'\',this)">'+esc(c.confirm)+'</button><button type="button" class="grc-risk-inline-cancel" onclick="window._grcRiskCloseDecision(this)">'+esc(isAr()?'إلغاء':'Cancel')+'</button></div>';
    var ta=panel.querySelector('textarea');if(ta)setTimeout(function(){ta.focus();},30);
  };
  window._grcRiskSubmitDecision=async function(id,action,btn){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;
    var errEl=panel.querySelector('.grc-risk-inline-error'),ta=panel.querySelector('textarea'),note=ta?String(ta.value||'').trim():'';
    if(/return|reject/.test(action)&&!note){if(ta)ta.classList.add('is-invalid');if(errEl)errEl.textContent=isAr()?'السبب مطلوب قبل تنفيذ هذا الإجراء.':'A reason is required before this action can be submitted.';return;}
    if(ta)ta.classList.remove('is-invalid');if(errEl)errEl.textContent='';
    Array.prototype.forEach.call(panel.querySelectorAll('button,textarea'),function(el){el.disabled=true;});panel.classList.add('is-busy');
    try{
      if(action==='manager_approve')await window._grcRiskRequestManagerAction(id,'approve','');
      else if(action==='manager_return')await window._grcRiskRequestManagerAction(id,'return',note);
      else if(action==='manager_reject')await window._grcRiskRequestManagerAction(id,'reject',note);
      else if(action==='super_approve')await window._grcRiskRequestSuperAction(id,'approve','');
      else if(action==='super_return')await window._grcRiskRequestSuperAction(id,'return',note);
      else if(action==='super_reject')await window._grcRiskRequestSuperAction(id,'reject',note);
      else if(action==='cancel')await window._grcRiskRequestCancel(id);
      panel.className='grc-risk-inline-decision success';panel.hidden=false;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(isAr()?'تم تنفيذ الإجراء':'Action completed')+'</div><div class="grc-risk-inline-copy">'+esc(isAr()?'تم حفظ القرار وتحديث حالة الطلب بنجاح.':'The decision was saved and the request status was updated successfully.')+'</div>';
      setTimeout(function(){var d=document.getElementById('_grcRiskDetailsOv');if(d)d.remove();if(document.getElementById('_grcRiskProfileOv'))renderProfileBody();if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();},650);
    }catch(err){panel.classList.remove('is-busy');Array.prototype.forEach.call(panel.querySelectorAll('button,textarea'),function(el){el.disabled=false;});if(errEl)errEl.textContent=String(err&&err.message||err||'Unable to complete the action.');}
  };
  window._grcRiskEditResubmit=function(id){var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;var d=document.getElementById('_grcRiskDetailsOv');if(d)d.remove();var p=document.getElementById('_grcRiskProfileOv');if(p)p.remove();if(typeof window._grcOpenRiskRequestResubmit==='function')window._grcOpenRiskRequestResubmit(r);};
  function renderNotificationPanel(panel){if(!panel)return;var rows=notificationRows(),body=panel.querySelector('.grc-risk-notif-list');if(!body)return;body.innerHTML=rows.length?rows.map(function(r){var unread=notificationUnread(r),toneName=notificationTone(r),worked=notificationHandledByMe(r),tag=!unread?'<em>'+(worked?(isAr()?'تم الإجراء':'Actioned'):(isAr()?'مقروء':'Read'))+'</em>':'';return'<button type="button" class="grc-risk-notif-row '+toneName+' '+(unread?'is-unread':'is-read')+'" data-grc-notif-id="'+esc(r.id)+'"><i class="grc-risk-notif-dot"></i><span class="grc-risk-notif-copy"><strong>'+esc(r.requestCode||r.id)+tag+'</strong><small>'+esc(operationLabel(r.operation,r))+' · '+esc(statusLabel(r.status))+'</small></span></button>';}).join(''):'<p>'+esc(isAr()?'لا توجد إشعارات حالياً.':'No GRC notifications yet.')+'</p>';Array.prototype.forEach.call(body.querySelectorAll('[data-grc-notif-id]'),function(row){row.onclick=function(e){e.preventDefault();e.stopPropagation();var id=row.getAttribute('data-grc-notif-id'),r=cache.find(function(x){return String(x.id)===String(id);});markNotificationRead(r);panel.remove();window._grcRiskOpenProfile&&window._grcRiskOpenProfile(id);};});var mark=panel.querySelector('[data-grc-mark-all]');if(mark)mark.onclick=function(e){e.preventDefault();e.stopPropagation();markAllNotificationsRead();renderNotificationPanel(panel);};}
  window._grcRiskOpenNotifications=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}start();var old=document.getElementById('_grcRiskNotifPanel');if(old){old.remove();return;}var btn=document.getElementById('grcRiskNotifBtn'),rect=btn&&btn.getBoundingClientRect(),panel=document.createElement('div');panel.id='_grcRiskNotifPanel';panel.className='grc-risk-notif-panel';panel.style.top=((rect&&rect.bottom||70)+8)+'px';panel.style.right=Math.max(12,window.innerWidth-(rect&&rect.right||window.innerWidth-20))+'px';panel.innerHTML='<header><b>'+esc(isAr()?'إشعارات سجل المخاطر والحوادث':'Risk & Incident Register Notifications')+'</b><div class="grc-risk-notif-head-actions"><button type="button" data-grc-mark-all class="grc-risk-notif-mark">'+esc(isAr()?'تحديد الكل كمقروء':'Mark all read')+'</button><button type="button" class="grc-risk-notif-close" onclick="document.getElementById(\'_grcRiskNotifPanel\').remove()">×</button></div></header><div class="grc-risk-notif-list"></div>';document.body.appendChild(panel);renderNotificationPanel(panel);};
  window._grcRiskRefreshUi=function(){start();refreshBadge();scheduleApprovalNotice(false);};

  window._grcRiskBindHeader=function(){
    var not=document.getElementById('grcRiskNotifBtn'),usr=document.querySelector('.grc-profile-trigger');
    if(not&&!not.dataset.grcBound){not.dataset.grcBound='1';not.onclick=function(e){e.preventDefault();e.stopPropagation();window._grcRiskOpenNotifications(e);};}
    if(usr&&!usr.dataset.grcBound){usr.dataset.grcBound='1';usr.onclick=function(e){e.preventDefault();e.stopPropagation();window._grcRiskOpenProfileMenu(e);};}
    start();refreshBadge();
  };

  document.addEventListener('click',function(e){var p=document.getElementById('_grcRiskNotifPanel'),b=document.getElementById('grcRiskNotifBtn');if(p&&(!b||!b.contains(e.target))&&!p.contains(e.target))p.remove();var m=document.getElementById('_grcUserProfileMenu'),u=document.querySelector('.grc-profile-trigger');if(m&&(!u||!u.contains(e.target))&&!m.contains(e.target))m.remove();},true);
  setInterval(start,1000);setInterval(refreshBadge,3000);document.addEventListener('DOMContentLoaded',start);
})();
