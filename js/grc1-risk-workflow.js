/* =====================================================================
   QUMC GRC1 — Risk & Incident Register Requests / Approval Workflow
   Separate from Performance notifications, KPI requests, Gap Analysis and
   Review & Development Center requests.
   ===================================================================== */
(function(){
  'use strict';if(window.__QUMC_GRC1_RISK_WORKFLOW_V177__)return;window.__QUMC_GRC1_RISK_WORKFLOW_V177__=true;
  var cache=[],unsub=null,startedFor='',reviewApprovalRows=[],approvalNoticeKey='',approvalNoticeEntry=0,approvalNoticeTimer=null,feedbackNormalRows=[],feedbackReviewRows=[],feedbackNormalUnsub=null,feedbackReviewUnsub=null,feedbackStartedFor='',feedbackTimer=null;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function role(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
  function email(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
  function isAr(){return document.documentElement.dir==='rtl'||window.lang==='ar';}
  function isManager(){return role()==='department_manager'||role()==='dept_manager'||role()==='departmentmanager';}
  function isSuper(){return role()==='super_admin';}
  function isAdmin(){return role()==='admin'||isSuper();}
  function isOwner(){var r=role();return r==='grc_owner'||r==='platform_owner'||(Array.isArray(window._fbPerms)&&(window._fbPerms.indexOf('edit_risk_management')>=0||window._fbPerms.indexOf('*')>=0));}
  function isNoticeOwner(){var r=role();return r==='grc_owner'||r==='platform_owner';}
  function canAccessRiskIncidentRegisters(){var r=role(),p=Array.isArray(window._fbPerms)?window._fbPerms:[];return ['super_admin','admin','department_manager','dept_manager','grc_owner','platform_owner','governance_performance_manager','viewer','user'].indexOf(r)>=0||p.indexOf('edit_risk_management')>=0||p.indexOf('edit_incident_register')>=0||p.indexOf('*')>=0;}
  window._grc1CanAccessRiskIncidentRegisters=canAccessRiskIncidentRegisters;
  function currentDepartmentKey(){var raw=Object.prototype.hasOwnProperty.call(window,'_fbDept')?window._fbDept:window.currentUserDept;if(typeof window._grc1CanonicalDepartment==='function')return String(window._grc1CanonicalDepartment(raw)||'');return String(raw==null?'':raw).trim().toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');}
  function requestDepartmentKey(r){r=r||{};var raw=r.departmentKey||r.department||r.departmentRaw||r.proposedRecord&&r.proposedRecord.department||r.currentRecord&&r.currentRecord.department||'';if(typeof window._grc1CanonicalDepartment==='function')return String(window._grc1CanonicalDepartment(raw)||'');return String(raw==null?'':raw).trim().toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');}
  function managerDepartmentRequest(r){if(!isManager())return true;var mine=currentDepartmentKey();return !!mine&&requestDepartmentKey(r)===mine;}
  function ownRequest(r){return String(r&&r.submittedByEmail||'').toLowerCase().trim()===email();}
  function reviewStage(r){return String(r&&r.workflowStage||r&&r.status||'').trim().toLowerCase();}
  function reviewDepartmentKey(r){var raw=r&&r.departmentKey||'';if(typeof window._grc1CanonicalDepartment==='function')return String(window._grc1CanonicalDepartment(raw)||'');return String(raw||'').trim().toLowerCase();}
  function reviewManagerRequest(r){return isManager()&&String(r&&r.platform||'grc1').toLowerCase()==='grc1'&&reviewStage(r)==='pending_department_manager'&&String(r&&r.userEmail||'').toLowerCase().trim()!==email()&&!!currentDepartmentKey()&&reviewDepartmentKey(r)===currentDepartmentKey();}
  function reviewRequestTime(r){var v=r&&r.updatedAt||r&&r.createdAt||r&&r.updatedAtIso||r&&r.createdAtIso||'';try{return v&&v.toDate?v.toDate().getTime():new Date(v||0).getTime()||0;}catch(_){return 0;}}
  function reviewRelatedText(r){var out=(Array.isArray(r&&r.relatedItems)?r.relatedItems:[]).map(function(x){return x&&x.code?String(x.code)+(x.name?' — '+String(x.name):''):String(x&&x.name||x&&x.label||'');}).filter(Boolean);if(r&&r.relatedNewText)out.push('New: '+String(r.relatedNewText));return out.join('; ')||'—';}
  function reviewTypeText(r){var t=String(r&&r.requestType||'');return t==='new'?'New Item Request':'Existing Item Review & Update';}
  function reviewDateText(r){var v=r&&r.createdAt||r&&r.createdAtIso||'';try{var d=v&&v.toDate?v.toDate():new Date(v);if(!d||isNaN(d.getTime()))return'—';return d.toLocaleString(isAr()?'ar-SA':'en-GB',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_){return'—';}}
  function statusLabel(s){var m={pending_manager:'Pending Department Manager Approval',pending_super_admin:'Pending Super Admin Approval',returned_requester:'Returned for Update',returned_manager:'Returned to Department Manager',rejected_manager:'Rejected by Department Manager',rejected_super_admin:'Rejected by Super Admin',published:'Published',cancelled:'Cancelled'};return m[s]||String(s||'—').replace(/_/g,' ');}
  function recordType(r){return String(r&&r.recordType||'risk').toLowerCase()==='incident'?'incident':'risk';}
  function recordLabel(r){return recordType(r)==='incident'?'Incident':'Risk';}
  function operationLabel(s,r){var label=recordLabel(r);return({add:'Add '+label,update:'Update '+label,delete:'Delete '+label})[s]||s||'—';}
  function fieldLabel(k){var m={riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',controlType:'Current Risk Control Type',actionStatus:'Action Status',date:'Incident Date',category:'Category',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required',department:'Department',responsibleDept:'Responsible Department',responsibleDepartment:'Responsible Department',status:'Status',id:'ID'};return m[k]||String(k||'').replace(/([A-Z])/g,' $1').replace(/^./,function(x){return x.toUpperCase();});}
  function historyStatusLabel(s){var m={pending_manager:'Submitted for Department Manager Approval',pending_super_admin:'Approved by Department Manager',returned_requester:'Returned for Update',returned_manager:'Returned to Department Manager',rejected_manager:'Rejected by Department Manager',rejected_super_admin:'Rejected by Super Admin',published:'Approved & Published',cancelled:'Cancelled'};return m[String(s||'')]||statusLabel(s);}
  function historyRoleLabel(r){var m={risk_owner:'GRC Owner',grc_owner:'GRC1 Owner',platform_owner:'Platform Owner',department_manager:'Department Manager',dept_manager:'Department Manager',super_admin:'Super Admin',admin:'Admin'};return m[String(r||'').toLowerCase()]||String(r||'').replace(/_/g,' ');}
  function historyTime(v){if(!v)return'—';try{var d=v&&v.toDate?v.toDate():new Date(v);if(isNaN(d.getTime()))return String(v);return d.toLocaleString(isAr()?'ar-SA':'en-GB',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_){return String(v);}}
  function changedKeys(r){var before=r&&r.currentRecord||{},after=r&&r.proposedRecord||{},keys=Array.isArray(r&&r.changedFields)&&r.changedFields.length?r.changedFields:Object.keys(before).concat(Object.keys(after));var seen={};return keys.filter(function(k){if(!k||seen[k])return false;seen[k]=1;if(['updatedAt','updatedBy','updatedByEmail','cloudUpdatedAt','_cloudLoadedAt'].indexOf(k)>=0)return false;return JSON.stringify(before[k]===undefined?'':before[k])!==JSON.stringify(after[k]===undefined?'':after[k]);});}
  function changeValue(v){if(v==null||v==='')return'—';if(Array.isArray(v))return v.length?v.join(', '):'—';if(typeof v==='object'){try{return JSON.stringify(v);}catch(_){return String(v);}}return String(v);}
  function changePreview(r,compact){
    if(String(r&&r.operation||'')!=='update')return'';
    var before=r.currentRecord||{},after=r.proposedRecord||{},keys=changedKeys(r);
    if(!keys.length)return'';
    var rows=keys.map(function(k){return'<tr><th>'+esc(fieldLabel(k))+'</th><td class="grc-risk-before">'+esc(changeValue(before[k]))+'</td><td class="grc-risk-after">'+esc(changeValue(after[k]))+'</td></tr>';}).join('');
    return'<section class="grc-risk-change-preview '+(compact?'compact':'')+'"><div class="grc-risk-block-title">'+esc(isAr()?'التغييرات التي تم تعديلها':'Changed Fields')+'</div><div class="grc-risk-change-table-wrap"><table class="grc-risk-change-table"><thead><tr><th>'+esc(isAr()?'الخانة':'Field')+'</th><th>'+esc(isAr()?'قبل':'Before')+'</th><th>'+esc(isAr()?'بعد':'After')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
  }
  function historyTimeline(r,compact){var h=Array.isArray(r&&r.history)?r.history.slice():[];if(!h.length)return'';if(compact&&h.length>4)h=h.slice(-4);return'<section class="grc-risk-history '+(compact?'compact':'')+'"><div class="grc-risk-block-title">'+esc(isAr()?'سجل الاعتماد':'Approval History')+'</div><div class="grc-risk-history-list">'+h.map(function(x){var note=String(x&&x.note||'').trim(),actor=String(x&&x.by||'').trim(),rlabel=historyRoleLabel(x&&x.role||'');return'<div class="grc-risk-history-item"><i></i><div><div class="grc-risk-history-top"><strong>'+esc(historyStatusLabel(x&&x.status||''))+'</strong><time>'+esc(historyTime(x&&x.at||x&&x.createdAt))+'</time></div><small>'+esc(rlabel+(actor?' · '+actor:''))+'</small>'+(note?'<p>'+esc(note)+'</p>':'')+'</div></div>';}).join('')+'</div></section>';}
  function tone(s){if(/^pending/.test(s)||/^returned/.test(s))return'warn';if(s==='published')return'good';if(/^rejected/.test(s)||s==='cancelled')return'bad';return'info';}
  function actionable(r){var s=String(r.status||'');if(isOwner())return ownRequest(r)&&s==='returned_requester';if(isManager())return managerDepartmentRequest(r)&&(s==='pending_manager'||s==='returned_manager');if(isSuper())return s==='pending_super_admin';return false;}
  function riskApprovalNoticeRows(){
    return cache.filter(function(r){
      var s=String(r&&r.status||'');
      if(isSuper())return s==='pending_super_admin';
      if(isManager())return managerDepartmentRequest(r)&&(s==='pending_manager'||s==='returned_manager');
      if(isNoticeOwner())return ownRequest(r)&&['pending_manager','pending_super_admin','returned_manager','returned_requester'].indexOf(s)>=0;
      return false;
    });
  }
  function approvalNoticeRows(){
    var rows=riskApprovalNoticeRows().map(function(r){return{kind:'risk',row:r};});
    if(isManager())rows=rows.concat(reviewApprovalRows.filter(reviewManagerRequest).map(function(r){return{kind:'review',row:r};}));
    return rows.sort(function(a,b){var at=a.kind==='review'?reviewRequestTime(a.row):new Date(a.row&&a.row.updatedAtIso||a.row&&a.row.createdAtIso||0).getTime()||0,bt=b.kind==='review'?reviewRequestTime(b.row):new Date(b.row&&b.row.updatedAtIso||b.row&&b.row.createdAtIso||0).getTime()||0;return bt-at;});
  }
  function approvalNoticeSignature(rows){
    return [approvalNoticeEntry,role(),email(),rows.map(function(item){var r=item.row||{},kind=item.kind||'risk';return kind+':'+String(r.id||r.requestCode||r.code||'')+':'+String(r.status||r.workflowStage||'')+':'+String(r.updatedAtIso||r.updatedAtText||r.createdAtIso||r.createdAt||'');}).join('|')].join('::');
  }
  function ensureApprovalNoticeStyles(){
    if(document.getElementById('_grc1ApprovalNoticeStyles'))return;
    var st=document.createElement('style');st.id='_grc1ApprovalNoticeStyles';st.textContent=`
#_grc1ApprovalNoticeOv{position:fixed;inset:0;z-index:2147483655;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(7,24,39,.64);backdrop-filter:blur(7px);box-sizing:border-box}
#_grc1ApprovalNoticeOv .grc-apn-dialog{width:min(920px,96vw);max-height:88vh;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(180deg,#fff,#f7fafb);border:1px solid rgba(255,255,255,.82);border-radius:22px;box-shadow:0 28px 86px rgba(7,24,39,.34)}
#_grc1ApprovalNoticeOv .grc-apn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:20px 22px 16px;border-bottom:1px solid #dce7eb;background:#fff}
#_grc1ApprovalNoticeOv .grc-apn-head h2{margin:0;color:#173f5f;font-size:18px;font-weight:900}
#_grc1ApprovalNoticeOv .grc-apn-head p{margin:5px 0 0;color:#647b88;font-size:11px;line-height:1.5}
#_grc1ApprovalNoticeOv .grc-apn-close{width:36px;height:36px;border:1px solid #d9e4e9;border-radius:11px;background:#f4f8fa;color:#365568;font-size:21px;cursor:pointer}
#_grc1ApprovalNoticeOv .grc-apn-body{padding:18px 22px;overflow:auto}
#_grc1ApprovalNoticeOv .grc-apn-summary{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;margin-bottom:14px;border:1px solid rgba(217,119,6,.24);border-radius:15px;background:rgba(255,247,237,.88)}
#_grc1ApprovalNoticeOv .grc-apn-summary span{font-size:11px;font-weight:900;color:#7c4a10;text-transform:uppercase;letter-spacing:.045em}
#_grc1ApprovalNoticeOv .grc-apn-summary b{font-size:14px;color:#b45309}
#_grc1ApprovalNoticeOv .grc-apn-card{border:1px solid #dce6eb;border-radius:15px;padding:14px;background:#fff;margin-bottom:11px;box-shadow:0 7px 20px rgba(23,63,95,.05)}
#_grc1ApprovalNoticeOv .grc-apn-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#_grc1ApprovalNoticeOv .grc-apn-card strong{display:block;color:#173f5f;font-size:12px;font-weight:900}
#_grc1ApprovalNoticeOv .grc-apn-card small{display:block;color:#6a808d;font-size:10px;margin-top:4px}
#_grc1ApprovalNoticeOv .grc-apn-status{white-space:nowrap;padding:5px 9px;border-radius:999px;font-size:9.5px;font-weight:900;background:#fff4df;color:#a85c06;border:1px solid #f2d5a5}
#_grc1ApprovalNoticeOv .grc-apn-status.bad{background:#fff0f1;color:#b3262d;border-color:#efc6c9}
#_grc1ApprovalNoticeOv .grc-apn-meta{display:grid;grid-template-columns:110px minmax(0,1fr);gap:7px 12px;margin-top:12px;font-size:10.5px}
#_grc1ApprovalNoticeOv .grc-apn-meta span{color:#718590}#_grc1ApprovalNoticeOv .grc-apn-meta b{color:#2f4f61;font-weight:800}
#_grc1ApprovalNoticeOv .grc-apn-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:13px}
#_grc1ApprovalNoticeOv .grc-apn-btn{border:0;border-radius:10px;padding:8px 13px;font-size:10.5px;font-weight:900;cursor:pointer}
#_grc1ApprovalNoticeOv .grc-apn-btn.primary{background:#0f7f86;color:#fff}#_grc1ApprovalNoticeOv .grc-apn-btn.secondary{background:#eaf1f4;color:#294f61}
#_grc1ApprovalNoticeOv .grc-apn-foot{display:flex;justify-content:flex-end;gap:9px;padding:14px 22px 18px;border-top:1px solid #dce7eb;background:#fff}
@media(max-width:650px){#_grc1ApprovalNoticeOv{padding:10px}#_grc1ApprovalNoticeOv .grc-apn-dialog{max-height:94vh;border-radius:17px}#_grc1ApprovalNoticeOv .grc-apn-meta{grid-template-columns:1fr}#_grc1ApprovalNoticeOv .grc-apn-summary{align-items:flex-start;flex-direction:column}}
`;document.head.appendChild(st);
  }
  function closeApprovalNotice(){var ov=document.getElementById('_grc1ApprovalNoticeOv');if(ov)ov.remove();}
  function approvalNoticeTitle(){
    if(isSuper())return isAr()?'طلبات اعتماد GRC بانتظار الموافقة النهائية':'GRC1 Requests Awaiting Final Approval';
    if(isManager())return isAr()?'طلبات GRC بانتظار موافقتك':'GRC1 Requests Awaiting Your Approval';
    return isAr()?'حالة طلباتك في GRC':'Your GRC1 Approval Requests';
  }
  function approvalNoticeSubtitle(){
    if(isSuper())return isAr()?'راجع طلبات تعديل سجلات المخاطر والحوادث واعتمد النشر النهائي.':'Review Risk and Incident Register changes awaiting final publication approval.';
    if(isManager())return isAr()?'راجع جميع طلبات قسمك في مكان واحد: المخاطر والحوادث وطلبات المراجعة والتطوير.':'Review all department approvals in one place: Risk, Incident, and Review & Development requests.';
    return isAr()?'تظهر هنا طلباتك التي ما زالت تحت الاعتماد أو تحتاج منك تعديلًا.':'These requests are still in approval or require an update from you.';
  }
  function reviewApprovalNoticeCard(r){
    return `<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>${esc(r.code||r.id)}</strong><small>${esc(isAr()?'مراجعة وتطوير':'Review & Development')} · ${esc(reviewTypeText(r))}</small></div><span class="grc-apn-status">${esc(isAr()?'بانتظار موافقة مدير القسم':'Pending Department Manager Approval')}</span></div><div class="grc-apn-meta"><span>${esc(isAr()?'نوع العنصر':'Item Type')}</span><b>${esc(r.category||r.relatedType||'—')}</b><span>${esc(isAr()?'السجل المرتبط':'Related Record')}</span><b>${esc(reviewRelatedText(r))}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.userName||r.userEmail||'—')}</b></div><div class="grc-apn-actions"><button class="grc-apn-btn primary" onclick="window._grc1ReviewApprovalOpenRequest('${esc(r.id)}')">${esc(isAr()?'مراجعة واعتماد':'Review & Approve')}</button></div></article>`;
  }
  function approvalNoticeCard(item){
    if(item&&item.kind==='review')return reviewApprovalNoticeCard(item.row||{});
    var r=item&&item.row||item||{},s=String(r.status||''),bad=/^returned|^rejected/.test(s),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+recordLabel(r));
    var actionText=actionable(r)?(isAr()?'يحتاج إجراء':'Needs action'):(isAr()?'قيد الاعتماد':'In approval');
    return `<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>${esc(r.requestCode||r.id)}</strong><small>${esc(operationLabel(r.operation,r))} · ${esc(r.department||'')}</small></div><span class="grc-apn-status ${bad?'bad':''}">${esc(statusLabel(s))}</span></div><div class="grc-apn-meta"><span>${esc(isAr()?'السجل':'Record')}</span><b>${esc(target)}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.submittedByName||r.submittedByEmail||'—')}</b><span>${esc(isAr()?'الحالة':'Status')}</span><b>${esc(actionText)}</b></div>${changePreview(r,true)}${historyTimeline(r,true)}<div class="grc-apn-actions"><button class="grc-apn-btn secondary" onclick="window._grc1RiskApprovalNoticeOpenRequest('${esc(r.id)}')">${esc(isAr()?'عرض التفاصيل':'View details')}</button></div>${actions(r)}</article>`;
  }
  function renderApprovalNoticeBody(){
    var ov=document.getElementById('_grc1ApprovalNoticeOv');if(!ov)return;
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
    var ov=document.createElement('div');ov.id='_grc1ApprovalNoticeOv';ov.innerHTML='<section class="grc-apn-dialog" role="dialog" aria-modal="true" aria-labelledby="_grc1ApnTitle"><header class="grc-apn-head"><div><h2 id="_grc1ApnTitle">'+esc(approvalNoticeTitle())+'</h2><p>'+esc(approvalNoticeSubtitle())+'</p></div><button class="grc-apn-close" type="button" onclick="window._grc1RiskApprovalNoticeClose()">×</button></header><main class="grc-apn-body"></main><footer class="grc-apn-foot"><button class="grc-apn-btn secondary" type="button" onclick="window._grc1RiskApprovalNoticeClose()">'+esc(isAr()?'حسنًا':'Got it')+'</button><button class="grc-apn-btn primary" type="button" onclick="window._grc1RiskApprovalNoticeOpenAll()">'+esc(isAr()?'فتح الطلبات':'Open requests')+'</button></footer></section>';
    ov.addEventListener('click',function(e){if(e.target===ov)closeApprovalNotice();});document.body.appendChild(ov);renderApprovalNoticeBody();
  }
  function scheduleApprovalNotice(force){if(!force&&document.getElementById('_grc1ApprovalNoticeOv')){renderApprovalNoticeBody();return;}clearTimeout(approvalNoticeTimer);approvalNoticeTimer=setTimeout(function(){try{showApprovalNotice(!!force);}catch(e){console.warn('[GRC Approval Notice]',e);}},650);}
  window._grc1RiskApprovalNoticeClose=closeApprovalNotice;
  window._grc1RiskApprovalNoticeOpenAll=function(){closeApprovalNotice();window._grc1RiskOpenProfile&&window._grc1RiskOpenProfile();};
  window._grc1RiskApprovalNoticeOpenRequest=function(id){closeApprovalNotice();window._grc1RiskOpenProfile&&window._grc1RiskOpenProfile(id);};
  window._grc1ReviewApprovalOpenRequest=function(id){closeApprovalNotice();var p=document.getElementById('_grc1RiskProfileOv');if(p)p.remove();if(typeof window._advOpenApprovalRequest==='function')window._advOpenApprovalRequest(id);else if(typeof window._grc1AdvOpenRequest==='function')window._grc1AdvOpenRequest(id);};
  window._grc1RiskApprovalEntryNoticeReset=function(){approvalNoticeEntry++;approvalNoticeKey='';scheduleApprovalNotice(true);};
  function notifSeenKey(){return 'qumc_grc1_risk_notif_seen_v111::'+email()+'::'+role();}
  function readNotifSeen(){try{var x=JSON.parse(localStorage.getItem(notifSeenKey())||'[]');return Array.isArray(x)?x.map(String):[];}catch(_){return[];}}
  function writeNotifSeen(rows){try{var out=[],seen={};(rows||[]).map(String).reverse().forEach(function(x){if(!x||seen[x])return;seen[x]=1;out.push(x);});out=out.reverse().slice(-600);localStorage.setItem(notifSeenKey(),JSON.stringify(out));}catch(_){}}
  function notifStamp(r){return String(r&&r.updatedAtIso||r&&r.createdAtIso||r&&r.updatedAtText||r&&r.createdAtText||'');}
  function notifKey(r){return String(r&&r.id||r&&r.requestCode||'')+'::'+String(r&&r.status||'')+'::'+notifStamp(r);}
  function lastHistoryActor(r){var h=Array.isArray(r&&r.history)?r.history:[],last=h.length?h[h.length-1]:null;return String(last&&last.by||'').toLowerCase().trim();}
  function notificationHandledByMe(r){var me=email();if(!me)return false;var by=lastHistoryActor(r);if(by)return by===me;var s=String(r&&r.status||'');if(s==='pending_manager'||s==='cancelled')return String(r&&r.submittedByEmail||'').toLowerCase().trim()===me;if(s==='pending_super_admin'||s==='returned_requester'||s==='rejected_manager')return String(r&&r.managerEmail||'').toLowerCase().trim()===me;if(s==='returned_manager'||s==='rejected_super_admin'||s==='published')return String(r&&r.superAdminEmail||'').toLowerCase().trim()===me;return false;}
  function notificationRows(){var rows=isManager()?cache.filter(managerDepartmentRequest):cache.slice();return rows.sort(function(a,b){var au=notificationUnread(a),bu=notificationUnread(b);if(au!==bu)return bu?1:-1;return notifStamp(b).localeCompare(notifStamp(a))||String(b.id||'').localeCompare(String(a.id||''));});}
  function notificationUnread(r){if(!r||notificationHandledByMe(r))return false;return readNotifSeen().indexOf(notifKey(r))<0;}
  function notificationTone(r){var s=String(r&&r.status||'');if(!notificationUnread(r))return'gray';if(s==='published')return'green';if(/^rejected/.test(s)||s==='cancelled')return'red';if(/^returned/.test(s))return'amber';return'teal';}
  function markNotificationRead(r){if(!r)return;var k=notifKey(r),seen=readNotifSeen();if(seen.indexOf(k)<0){seen.push(k);writeNotifSeen(seen);}refreshBadge();}
  function markAllNotificationsRead(){var seen=readNotifSeen();cache.forEach(function(r){var k=notifKey(r);if(seen.indexOf(k)<0)seen.push(k);});writeNotifSeen(seen);refreshBadge();}
  function refreshBadge(){var scoped=isManager()?cache.filter(managerDepartmentRequest):cache,n=scoped.filter(notificationUnread).length,approvalCount=scoped.filter(actionable).length+(isManager()?reviewApprovalRows.filter(reviewManagerRequest).length:0),el=document.getElementById('grc1RiskNotifCount'),req=document.getElementById('grc1RiskRequestCount'),profile=document.getElementById('_grc1ProfileRiskCount');if(el){el.textContent=String(n);el.style.display=n?'grid':'none';}if(req){req.textContent=String(approvalCount||scoped.length);req.style.display=(approvalCount||scoped.length)?'grid':'none';}if(profile)profile.textContent=String(approvalCount);}
  function feedbackDismissedKey(){return'qumc_grc1_feedback_dismissed_v118::'+email();}
  function readFeedbackDismissed(){try{var x=JSON.parse(localStorage.getItem(feedbackDismissedKey())||'[]');return Array.isArray(x)?x.map(String):[];}catch(_){return[];}}
  function writeFeedbackDismissed(rows){try{localStorage.setItem(feedbackDismissedKey(),JSON.stringify((rows||[]).map(String).slice(-500)));}catch(_){}}
  function feedbackItemKey(item){return String(item.kind||'request')+'::'+String(item.id||'')+'::'+String(item.status||'')+'::'+String(item.updatedAtIso||item.respondedAtIso||item.closedAtIso||'');}
  function feedbackItemTime(item){var v=item.updatedAt||item.respondedAt||item.closedAt||item.ratingAt||item.createdAt;try{return v&&v.toDate?v.toDate().getTime():new Date(v||item.updatedAtIso||0).getTime()||0;}catch(_){return 0;}}
  function feedbackCandidates(){var out=[];feedbackNormalRows.forEach(function(r){if(['approved','rejected'].indexOf(String(r.status||'').toLowerCase())>=0&&!Number(r.rating||0))out.push(Object.assign({kind:'system',label:'GRC1 Request',code:r.requestType||'GRC1 Request'},r));});feedbackReviewRows.forEach(function(r){var stage=String(r.workflowStage||r.status||'').toLowerCase();if(String(r.status||'').toLowerCase()==='closed'&&stage!=='cancelled'&&!Number(r.rating||0))out.push(Object.assign({kind:'review',label:'Review & Development Request'},r));});var dismissed=readFeedbackDismissed();return out.filter(function(x){return dismissed.indexOf(feedbackItemKey(x))<0;}).sort(function(a,b){return feedbackItemTime(b)-feedbackItemTime(a);});}
  function closeFeedbackNotice(dismiss){var ov=document.getElementById('_grc1FeedbackNoticeOv');if(!ov)return;var key=ov.getAttribute('data-feedback-key');if(dismiss&&key){var rows=readFeedbackDismissed();if(rows.indexOf(key)<0){rows.push(key);writeFeedbackDismissed(rows);}}ov.remove();}
  function showFeedbackNotice(){clearTimeout(feedbackTimer);if(!document.body.classList.contains('grc-mode')||document.getElementById('_grc1FeedbackNoticeOv'))return;if(document.getElementById('_grc1ApprovalNoticeOv')){feedbackTimer=setTimeout(showFeedbackNotice,900);return;}var item=feedbackCandidates()[0];if(!item)return;var ov=document.createElement('div');ov.id='_grc1FeedbackNoticeOv';ov.className='grc-feedback-notice';ov.setAttribute('data-feedback-key',feedbackItemKey(item));ov.setAttribute('data-feedback-kind',item.kind);ov.setAttribute('data-feedback-id',String(item.id||''));var code=item.code||item.requestCode||item.id||'',status=String(item.status||'').toLowerCase(),statusText=status==='rejected'?'rejected':'completed';ov.innerHTML='<section class="grc-feedback-dialog" role="dialog" aria-modal="true"><button type="button" class="grc-feedback-close" onclick="window._grc1FeedbackDismiss()">×</button><div class="grc-feedback-icon">★</div><h2>Your request has been '+esc(statusText)+'</h2><p>'+esc(item.label||'Request')+' <b>'+esc(code)+'</b> has been answered and is waiting for your rating.</p><div class="grc-feedback-actions"><button type="button" class="grc-feedback-later" onclick="window._grc1FeedbackDismiss()">Rate Later</button><button type="button" class="grc-feedback-rate" onclick="window._grc1FeedbackRateNow()">Rate Now</button></div></section>';ov.addEventListener('click',function(e){if(e.target===ov)window._grc1FeedbackDismiss();});document.body.appendChild(ov);}
  window._grc1FeedbackDismiss=function(){closeFeedbackNotice(true);};
  window._grc1FeedbackRateNow=function(){var ov=document.getElementById('_grc1FeedbackNoticeOv');if(!ov)return;var kind=ov.getAttribute('data-feedback-kind'),id=ov.getAttribute('data-feedback-id');closeFeedbackNotice(false);if(kind==='system'){window._grc1ShowMyRequests&&window._grc1ShowMyRequests();return;}if(typeof window._grc1Switch==='function')window._grc1Switch('advisory');setTimeout(function(){if(typeof window._grc1AdvOpenRequest==='function')window._grc1AdvOpenRequest(id);},650);};
  function scheduleFeedbackNotice(){clearTimeout(feedbackTimer);feedbackTimer=setTimeout(showFeedbackNotice,650);}
  function refreshFeedbackData(){if(!email())return Promise.resolve();var a=typeof window._grc1RequestsGetMine==='function'?window._grc1RequestsGetMine():Promise.resolve([]),b=typeof window._grc1AdvisoryGetMine==='function'?window._grc1AdvisoryGetMine():Promise.resolve([]);return Promise.all([a,b]).then(function(rows){feedbackNormalRows=Array.isArray(rows[0])?rows[0]:[];feedbackReviewRows=(Array.isArray(rows[1])?rows[1]:[]).filter(function(r){return String(r.platform||'grc1').toLowerCase()==='grc1';});scheduleFeedbackNotice();}).catch(function(){});}
  function stopFeedbackWatch(){if(feedbackNormalUnsub)try{feedbackNormalUnsub();}catch(_){}if(feedbackReviewUnsub)try{feedbackReviewUnsub();}catch(_){}feedbackNormalUnsub=feedbackReviewUnsub=null;feedbackStartedFor='';feedbackNormalRows=[];feedbackReviewRows=[];reviewApprovalRows=[];clearTimeout(feedbackTimer);var ov=document.getElementById('_grc1FeedbackNoticeOv');if(ov)ov.remove();}
  function startFeedbackWatch(){
    var key=email()+'|'+role()+'|'+currentDepartmentKey();
    if(!email()||!document.body.classList.contains('grc-mode'))return;
    /* Retry until the advisory listener is actually available. This avoids the old
       race where the first interval ran before firebase.js exposed the API and the
       manager queue then stayed empty for the entire session. */
    if(feedbackStartedFor===key&&feedbackReviewUnsub)return;
    stopFeedbackWatch();feedbackStartedFor=key;
    if(typeof window._grc1RequestsSubscribeMine==='function')feedbackNormalUnsub=window._grc1RequestsSubscribeMine(function(rows,err){if(!err){feedbackNormalRows=Array.isArray(rows)?rows:[];scheduleFeedbackNotice();}});
    if(typeof window._grc1AdvisorySubscribe==='function')feedbackReviewUnsub=window._grc1AdvisorySubscribe(function(payload){
      var live=payload&&Array.isArray(payload.records)?payload.records:[];
      feedbackReviewRows=live.filter(function(r){return String(r&&r.platform||'grc1').toLowerCase()==='grc1'&&String(r&&r.userEmail||'').toLowerCase().trim()===email();});
      scheduleFeedbackNotice();
      if(isManager()){
        reviewApprovalRows=live.filter(reviewManagerRequest);
        refreshBadge();
        if(document.getElementById('_grc1RiskProfileOv'))renderProfileBody();
        if(document.getElementById('_grc1ApprovalNoticeOv'))renderApprovalNoticeBody();
        scheduleApprovalNotice(false);
      }
    });
    refreshFeedbackData();
  }
  document.addEventListener('grc1:feedbackRefresh',function(){refreshFeedbackData();});
  function stop(){if(unsub)try{unsub();}catch(_){}unsub=null;startedFor='';cache=[];window.__grc1RiskRequestCache=[];var panel=document.getElementById('_grc1RiskNotifPanel');if(panel)panel.remove();closeApprovalNotice();stopFeedbackWatch();refreshBadge();}
  window._grc1RiskStop=stop;
  function start(){if(!document.body.classList.contains('grc-mode')||String(window.__qumcActivePortal||'').toLowerCase()!=='grc1'){if(unsub||startedFor||feedbackStartedFor)stop();return;}var key=email()+'|'+role()+'|'+String(window._fbDept||window.currentUserDept||'');if(!email()){cache=[];refreshBadge();return;}startFeedbackWatch();if(typeof window._grc1RiskRequestsSubscribe!=='function'){cache=[];window.__grc1RiskRequestCache=[];refreshBadge();return;}if(startedFor===key&&unsub)return;if(unsub)try{unsub();}catch(_){}startedFor=key;unsub=window._grc1RiskRequestsSubscribe(function(rows,err){if(err)return;cache=Array.isArray(rows)?rows:[];if(isManager())cache=cache.filter(managerDepartmentRequest);window.__grc1RiskRequestCache=cache;try{document.dispatchEvent(new CustomEvent('grc1:riskRequestsUpdated',{detail:{rows:cache}}));}catch(_e){}refreshBadge();var ov=document.getElementById('_grc1RiskProfileOv');if(ov)renderProfileBody();if(document.getElementById('_grc1ApprovalNoticeOv'))renderApprovalNoticeBody();var np=document.getElementById('_grc1RiskNotifPanel');if(np&&typeof renderNotificationPanel==='function')renderNotificationPanel(np);scheduleApprovalNotice(false);});}
  function fieldRows(obj,type){obj=obj||{};var labels=type==='incident'?{id:'Incident ID',date:'Incident Date',category:'Category',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required',department:'Department',status:'Status'}:{id:'Risk ID',riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',controlType:'Control Type',actionStatus:'Action Status',department:'Department'};return Object.keys(labels).map(function(k){return'<tr><th>'+labels[k]+'</th><td>'+esc(obj[k]==null?'—':obj[k])+'</td></tr>';}).join('');}
  function changedTable(r){var before=r.currentRecord||{},after=r.proposedRecord||{},keys=changedKeys(r);return'<section class="grc-risk-detail-diff"><div class="grc-risk-block-title">'+esc(isAr()?'تفاصيل التعديل':'Update Details')+'</div><table class="grc-risk-diff"><thead><tr><th>'+esc(isAr()?'الخانة التي تغيرت':'Changed Field')+'</th><th>'+esc(isAr()?'قبل':'Before')+'</th><th>'+esc(isAr()?'بعد':'After')+'</th></tr></thead><tbody>'+keys.map(function(k){return'<tr><th>'+esc(fieldLabel(k))+'</th><td class="grc-risk-before">'+esc(changeValue(before[k]))+'</td><td class="grc-risk-after">'+esc(changeValue(after[k]))+'</td></tr>';}).join('')+'</tbody></table></section>'; }
  function inlineDecisionShell(){return '<div class="grc-risk-inline-decision" hidden></div>';}
  function actions(r){var s=String(r.status||''),html='';
    if(isManager()&&managerDepartmentRequest(r)&&(s==='pending_manager'||s==='returned_manager'))html='<button class="grc-risk-action good" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'manager_approve\',this)">Approve</button><button class="grc-risk-action warn" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'manager_return\',this)">Return for Update</button><button class="grc-risk-action bad" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'manager_reject\',this)">Reject</button>';
    if(isSuper()&&s==='pending_super_admin')html='<button class="grc-risk-action good" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'super_approve\',this)">Approve & Publish</button><button class="grc-risk-action warn" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'super_return\',this)">Return to Department Manager</button><button class="grc-risk-action bad" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'super_reject\',this)">Reject</button>';
    if(isOwner()&&ownRequest(r)&&s==='returned_requester')html='<button class="grc-risk-action good" onclick="window._grc1RiskEditResubmit(\''+esc(r.id)+'\')">Edit & Resubmit</button>';
    if(isOwner()&&ownRequest(r)&&s==='pending_manager')html='<button class="grc-risk-action bad ghost" onclick="window._grc1RiskDecision(\''+esc(r.id)+'\',\'cancel\',this)">Cancel Request</button>';
    return html?'<div class="grc-risk-request-actions">'+html+'</div>'+inlineDecisionShell():'';
  }
  function card(r){
    var label=recordLabel(r),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+label);
    return `<article class="grc-risk-request-card"><div class="grc-risk-card-head"><div><strong>${esc(r.requestCode||r.id)}</strong><small>${esc(operationLabel(r.operation,r))} · ${esc(r.department||'')}</small></div><span class="grc-risk-status ${tone(r.status)}">${esc(statusLabel(r.status))}</span></div><div class="grc-risk-card-grid"><span>${label}</span><b>${esc(target)}</b><span>Submitted by</span><b>${esc(r.submittedByName||r.submittedByEmail||'—')}</b><span>Submitted</span><b>${esc(r.createdAtText||r.createdAtIso||'—')}</b><span>Last update</span><b>${esc(r.updatedAtText||r.updatedAtIso||'—')}</b></div>${changePreview(r,true)}${historyTimeline(r,true)}<button class="grc-risk-details-btn" onclick="window._grc1RiskShowDetails('${esc(r.id)}')">View Request Details</button>${actions(r)}</article>`;
  }
  function activeApprovalTab(){var el=document.querySelector('[data-grc-risk-tab].active');return el&&el.dataset?el.dataset.grcRiskTab||'all':'all';}
  function filteredRisk(tab){var base=isManager()?cache.filter(managerDepartmentRequest):cache;return base.filter(function(r){if(tab==='all')return true;if(tab==='action')return actionable(r);if(tab==='published')return r.status==='published';if(tab==='returned')return /^returned|^rejected/.test(r.status);return r.status===tab;});}
  function filteredReview(tab){if(!isManager()||['all','action'].indexOf(tab)<0)return[];return reviewApprovalRows.filter(reviewManagerRequest);}
  function reviewProfileCard(r){
    return `<article class="grc-risk-request-card"><div class="grc-risk-card-head"><div><strong>${esc(r.code||r.id)}</strong><small>${esc(isAr()?'مراجعة وتطوير':'Review & Development')} · ${esc(reviewTypeText(r))}</small></div><span class="grc-risk-status warn">${esc(isAr()?'بانتظار موافقة مدير القسم':'Pending Department Manager Approval')}</span></div><div class="grc-risk-card-grid"><span>${esc(isAr()?'نوع العنصر':'Item Type')}</span><b>${esc(r.category||r.relatedType||'—')}</b><span>${esc(isAr()?'السجل المرتبط':'Related Record')}</span><b>${esc(reviewRelatedText(r))}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.userName||r.userEmail||'—')}</b><span>${esc(isAr()?'تاريخ الإرسال':'Submitted')}</span><b>${esc(reviewDateText(r))}</b><span>${esc(isAr()?'الأولوية':'Priority')}</span><b>${esc(r.priority||'—')}</b></div><button class="grc-risk-details-btn" onclick="window._grc1ReviewApprovalOpenRequest('${esc(r.id)}')">${esc(isAr()?'مراجعة واعتماد':'Review & Approve')}</button></article>`;
  }
  function renderProfileBody(){
    var body=document.getElementById('_grc1RiskProfileBody');if(!body)return;
    var tab=activeApprovalTab(),rows=filteredRisk(tab).map(function(r){return{kind:'risk',row:r,time:new Date(r.updatedAtIso||r.createdAtIso||0).getTime()||0};});
    rows=rows.concat(filteredReview(tab).map(function(r){return{kind:'review',row:r,time:reviewRequestTime(r)};})).sort(function(a,b){return b.time-a.time;});
    body.innerHTML=rows.length?rows.map(function(x){return x.kind==='review'?reviewProfileCard(x.row):card(x.row);}).join(''):'<div class="grc-risk-empty">'+esc(isManager()?(isAr()?'لا توجد طلبات اعتماد GRC في هذا العرض.':'No GRC1 approval requests in this view.'):'No Risk or Incident Register requests in this view.')+'</div>';
    var count=document.getElementById('_grc1RiskProfileCount');if(count)count.textContent=rows.length+' request(s)';
  }
  function closeProfileMenu(){var m=document.getElementById('_grc1UserProfileMenu');if(m)m.remove();}
  var GRC_REQUEST_TYPES=[
    'Access / Permission Request','Role or Permission Update','Data Entry Permission',
    'System Issue','Data Correction Request','General GRC1 Request','Other'
  ];
  window._grc1ShowSubmitRequestForm=function(){
    closeProfileMenu();var old=document.getElementById('grc1SubmitReqOv');if(old)old.remove();
    var ov=document.createElement('div');ov.id='grc1SubmitReqOv';ov.className='qumc-request-overlay qumc-submit-request-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483650;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var opts=GRC_REQUEST_TYPES.map(function(t){return '<option value="'+esc(t)+'">'+esc(t)+'</option>';}).join('');
    ov.innerHTML='<div class="qumc-request-card qumc-submit-request-card grc-submit-request-light" style="background:linear-gradient(180deg,#ffffff,#f6fafc);border:1px solid #c9dbe7;border-radius:18px;padding:28px;width:min(480px,100%);display:flex;flex-direction:column;gap:16px;box-shadow:0 24px 70px rgba(7,24,39,.28)">'+
      '<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:14px;font-weight:850;color:#152538">Submit a Request</div><div style="font-size:10px;color:#60758a;margin-top:2px">GRC1 access, permission and system requests</div></div><button type="button" onclick="document.getElementById(\'grc1SubmitReqOv\').remove()" style="width:30px;height:30px;background:#eef3f7;border:1px solid #d7e2ea;border-radius:7px;color:#52657a;cursor:pointer;font-size:15px">✕</button></div>'+
      '<div><label style="display:block;font-size:10px;font-weight:750;color:#355066;margin-bottom:5px">Request Type</label><select id="grc1ReqTypeSelect" style="width:100%;padding:10px 12px;background:#f8fbfd;border:1px solid #bfd2df;border-radius:8px;color:#152538;font-size:11px;font-family:inherit;outline:none">'+opts+'</select></div>'+
      '<div><label style="display:block;font-size:10px;font-weight:750;color:#355066;margin-bottom:5px">Request Details *</label><textarea id="grc1ReqMessageArea" rows="5" placeholder="Describe the requested access, permission or system change..." style="width:100%;padding:10px 12px;background:#f8fbfd;border:1px solid #bfd2df;border-radius:8px;color:#152538;font-size:11px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none"></textarea></div>'+
      '<div id="grc1ReqSubmitFb" style="font-size:10px;font-weight:600;display:none;padding:7px 12px;border-radius:7px"></div>'+
      '<button id="grc1ReqSubmitBtn" type="button" onclick="window._grc1DoSubmitRequest()" style="padding:10px 20px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:9px;color:#fff;font-size:11px;font-weight:750;cursor:pointer;font-family:inherit">Submit Request</button></div>';
    document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};setTimeout(function(){var x=document.getElementById('grc1ReqMessageArea');if(x)x.focus();},80);
  };
  window._grc1DoSubmitRequest=function(){
    var type=document.getElementById('grc1ReqTypeSelect'),msg=document.getElementById('grc1ReqMessageArea'),fb=document.getElementById('grc1ReqSubmitFb'),btn=document.getElementById('grc1ReqSubmitBtn');
    function feedback(text,ok){if(!fb)return;fb.textContent=text;fb.style.display='block';fb.style.color=ok?'#16A34A':'#DC2626';fb.style.background=ok?'rgba(22,163,74,.08)':'rgba(220,38,38,.08)';}
    if(!msg||!String(msg.value||'').trim()){feedback('⚠ Please enter request details.',false);return;}
    if(typeof window._grc1RequestsSubmit!=='function'){feedback('⚠ GRC1 requests are not available. Check the connection.',false);return;}
    if(btn){btn.disabled=true;btn.textContent='Submitting...';}
    window._grc1RequestsSubmit(type&&type.value,String(msg.value).trim()).then(function(){feedback('✓ Request submitted. You will be notified when it is reviewed.',true);msg.value='';if(btn){btn.disabled=false;btn.textContent='Submit Another';}setTimeout(function(){var x=document.getElementById('grc1SubmitReqOv');if(x)x.remove();},2200);}).catch(function(err){feedback('⚠ '+String(err&&err.message||err),false);if(btn){btn.disabled=false;btn.textContent='Submit Request';}});
  };
  function requestStatus(s){return({pending:'Pending',approved:'Approved',rejected:'Rejected'})[s]||String(s||'—');}
  function requestStatusColor(s){return({pending:'#D97706',approved:'#16A34A',rejected:'#DC2626'})[s]||'#64748b';}
  function systemRequestTerminal(r){return ['approved','rejected'].indexOf(String(r&&r.status||'').toLowerCase())>=0;}
  function ratingStarsMarkup(value){var n=Math.max(0,Math.min(5,Number(value||0)));return'<span class="grc-rating-static">'+('★'.repeat(n))+('☆'.repeat(5-n))+'</span>';}
  function systemRequestRatingHtml(r){
    if(!systemRequestTerminal(r))return'';
    var n=Number(r.rating||0),comment=String(r.ratingComment||'');
    if(n)return'<div class="grc-system-rating-saved"><div><b>Your Rating</b>'+ratingStarsMarkup(n)+'<strong>'+n+' / 5</strong></div>'+(comment?'<p>'+esc(comment)+'</p>':'<p class="muted">No comment provided.</p>')+'</div>';
    if(String(r.userEmail||'').toLowerCase().trim()!==String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim())return'<div class="grc-system-rating-pending">Waiting for requester rating.</div>';
    return'<div class="grc-system-rating" data-grc-system-rating-box="'+esc(r.id)+'" data-rating="0"><div class="grc-system-rating-title">Rate this request</div><div class="grc-system-rating-help">Select the number of stars. A comment is optional.</div><div class="grc-system-rating-stars">'+[1,2,3,4,5].map(function(x){return'<button type="button" data-rating-value="'+x+'" onclick="window._grc1SelectSystemRequestRating(\''+esc(r.id)+'\','+x+')" aria-label="'+x+' star rating">★</button>';}).join('')+'</div><div class="grc-system-rating-selected">No rating selected</div><textarea class="grc-system-rating-comment" placeholder="Add a comment (optional)"></textarea><div class="grc-system-rating-error"></div><button type="button" class="grc-system-rating-submit" onclick="window._grc1SubmitSystemRequestRating(\''+esc(r.id)+'\',this)">Submit Rating</button></div>';
  }
  window._grc1SelectSystemRequestRating=function(id,rating){var box=document.querySelector('[data-grc-system-rating-box="'+CSS.escape(String(id))+'"]');if(!box)return;var n=Math.max(1,Math.min(5,Number(rating||0)));box.dataset.rating=String(n);box.querySelectorAll('[data-rating-value]').forEach(function(btn){var x=Number(btn.getAttribute('data-rating-value')||0);btn.classList.toggle('selected',x<=n);btn.setAttribute('aria-pressed',x<=n?'true':'false');});var label=box.querySelector('.grc-system-rating-selected');if(label)label.textContent='Selected rating: '+n+' out of 5';var err=box.querySelector('.grc-system-rating-error');if(err)err.textContent='';};
  window._grc1SubmitSystemRequestRating=function(id,btn){var box=document.querySelector('[data-grc-system-rating-box="'+CSS.escape(String(id))+'"]');if(!box||typeof window._grc1RequestsRate!=='function')return;var n=Number(box.dataset.rating||0),err=box.querySelector('.grc-system-rating-error');if(!n){if(err)err.textContent='Select a star rating before submitting.';return;}var comment=String((box.querySelector('.grc-system-rating-comment')||{}).value||'').trim(),old=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Submitting…';}window._grc1RequestsRate(id,n,comment).then(function(){var x=document.getElementById('grc1MyReqOv');if(x)x.remove();window._grc1ShowMyRequests();refreshFeedbackData();}).catch(function(e){if(btn){btn.disabled=false;btn.textContent=old||'Submit Rating';}if(err)err.textContent=String(e&&e.message||e);});};
  window._grc1ShowMyRequests=function(){
    closeProfileMenu();var old=document.getElementById('grc1MyReqOv');if(old)old.remove();var admin=false;
    var ov=document.createElement('div');ov.id='grc1MyReqOv';ov.className='qumc-request-overlay qumc-my-requests-overlay';ov.style.cssText='position:fixed;inset:0;z-index:2147483650;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');box.className='qumc-request-card qumc-my-requests-card';box.style.cssText='background:#ffffff;border:1px solid #d7e3e9;border-radius:18px;padding:28px;width:min(760px,100%);max-height:82vh;display:flex;flex-direction:column;gap:16px;box-shadow:0 28px 80px rgba(15,23,42,.28);color:#111827;';
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:14px;font-weight:800;color:#111827">'+'My Requests'+'</div><div style="font-size:10px;color:#64748b;margin-top:2px">'+'Your GRC1 access, permission and system requests'+'</div></div><div style="display:flex;gap:8px"><button type="button" onclick="document.getElementById(\'grc1MyReqOv\').remove();window._grc1ShowSubmitRequestForm()" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">+ New Request</button><button type="button" onclick="document.getElementById(\'grc1MyReqOv\').remove()" style="width:30px;height:30px;background:#f1f5f9;border:1px solid #d7e2ea;border-radius:7px;color:#475569;cursor:pointer;font-size:15px">✕</button></div></div><div id="grc1MyReqBody" style="overflow-y:auto;flex:1;min-height:160px;display:flex;align-items:center;justify-content:center"><div style="color:#64748b;font-size:11px">Loading...</div></div>';
    ov.appendChild(box);document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
    var api=window._grc1RequestsGetMine;if(typeof api!=='function'){document.getElementById('grc1MyReqBody').innerHTML='<div style="color:#DC2626;font-size:11px">GRC1 requests are not available.</div>';return;}
    api().then(function(rows){var body=document.getElementById('grc1MyReqBody');if(!body)return;if(!rows||!rows.length){body.innerHTML='<div style="color:#64748b;font-size:11px;text-align:center;padding:32px">No GRC1 requests have been submitted.</div>';return;}body.style.display='block';body.innerHTML='<div style="display:flex;flex-direction:column;gap:10px;padding:2px">'+rows.map(function(r){var color=requestStatusColor(r.status),date=typeof window._fmtTs==='function'?window._fmtTs(r.createdAt):'—';return '<div style="background:#ffffff;border:1px solid #dce6eb;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;font-weight:800;color:#111827">'+esc(r.requestType||'—')+'</span><span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:'+color+'22;color:'+color+'">'+esc(requestStatus(r.status))+'</span></div><span style="font-size:9px;color:#475569;white-space:nowrap">'+esc(date)+'</span></div>'+(admin?'<div style="font-size:9px;color:#64748b">'+esc(r.userName||r.userEmail||'—')+' · '+esc(r.department||'—')+'</div>':'')+'<div style="font-size:10.5px;color:#334155;line-height:1.5">'+esc(r.message||'')+'</div>'+(r.adminComment?'<div style="background:rgba(1,149,175,.08);border:1px solid rgba(1,149,175,.2);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:3px">Admin Response:</div><div style="font-size:10.5px;color:#111827">'+esc(r.adminComment)+'</div></div>':(r.status==='pending'?'<div style="font-size:9px;color:#475569;font-style:italic">Awaiting response...</div>':''))+systemRequestRatingHtml(r)+(admin?'<div style="display:flex;gap:7px;justify-content:flex-end"><button type="button" onclick="window._grc1RespondSystemRequest(\''+esc(r.id)+'\',\'approved\')" style="border:0;border-radius:8px;padding:7px 11px;background:#166534;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Approve / Respond</button><button type="button" onclick="window._grc1RespondSystemRequest(\''+esc(r.id)+'\',\'rejected\',this)" style="border:0;border-radius:8px;padding:7px 11px;background:#991b1b;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Reject</button></div>':'')+'</div>';}).join('')+'</div>';}).catch(function(err){var b=document.getElementById('grc1MyReqBody');if(b)b.innerHTML='<div style="color:#DC2626;font-size:11px">Error: '+esc(err&&err.message||err)+'</div>';});
  };
  window._grc1RespondSystemRequest=function(id,status,btn){
    if(status==='rejected'&&btn){var actions=btn.parentElement,old=actions&&actions.parentElement&&actions.parentElement.querySelector('.grc-system-inline-decision');if(old)old.remove();var box=document.createElement('div');box.className='grc-system-inline-decision';box.innerHTML='<div class="grc-risk-inline-title">Reject Request</div><div class="grc-risk-inline-copy">A rejection reason is required.</div><textarea class="grc-risk-inline-textarea" rows="3" placeholder="Enter the rejection reason..."></textarea><div class="grc-risk-inline-error"></div><div class="grc-risk-inline-buttons"><button class="grc-risk-inline-confirm bad" type="button">Confirm Reject</button><button class="grc-risk-inline-cancel" type="button">Cancel</button></div>';actions.parentElement.appendChild(box);var confirmBtn=box.querySelector('.grc-risk-inline-confirm'),cancelBtn=box.querySelector('.grc-risk-inline-cancel'),ta=box.querySelector('textarea'),errEl=box.querySelector('.grc-risk-inline-error');cancelBtn.onclick=function(){box.remove();};confirmBtn.onclick=function(){var comment=String(ta.value||'').trim();if(!comment){ta.classList.add('is-invalid');errEl.textContent='A rejection reason is required.';return;}confirmBtn.disabled=true;cancelBtn.disabled=true;ta.disabled=true;window._grc1RequestsRespond(id,status,comment).then(function(){var x=document.getElementById('grc1MyReqOv');if(x)x.remove();window._grc1ShowMyRequests();}).catch(function(err){confirmBtn.disabled=false;cancelBtn.disabled=false;ta.disabled=false;errEl.textContent=String(err&&err.message||err);});};setTimeout(function(){ta.focus();},20);return;}
    window._grc1RequestsRespond(id,status,'').then(function(){var x=document.getElementById('grc1MyReqOv');if(x)x.remove();window._grc1ShowMyRequests();}).catch(function(err){var body=document.getElementById('grc1MyReqBody');if(body){var e=document.createElement('div');e.className='grc-system-inline-error';e.textContent=String(err&&err.message||err);body.prepend(e);}});
  };
  function openCenterRequest(){window._grc1ShowSubmitRequestForm();}
  function openCenterRequests(){window._grc1ShowMyRequests();}
  window._grc1RiskOpenProfileMenu=function(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}start();var old=document.getElementById('_grc1UserProfileMenu');if(old){old.remove();return;}
    var anchor=ev&&ev.currentTarget||document.querySelector('.grc-profile-trigger'),rect=anchor&&anchor.getBoundingClientRect(),menu=document.createElement('div');
    var name=window._fbName||window.currentUserName||'User',dept=window._fbDept||window.currentUserDept||'—',last='Current session';
    try{last=(window._fbLastLogin||sessionStorage.getItem('qumc_last_login')||'Current session');}catch(_){}
    menu.id='_grc1UserProfileMenu';menu.className='qumc-profile-drop grc-user-profile-menu grc-profile-drop-open';menu.style.display='block';menu.style.top=((rect&&rect.bottom||58)+8)+'px';menu.style.right=Math.max(12,window.innerWidth-(rect&&rect.right||window.innerWidth-20))+'px';
    var approvalTaskTitle=isManager()?'GRC1 Approval Requests':'Risk & Incident Registers',approvalTaskSub=isManager()?'Risk, Incident, and Review & Development approvals':'Approval requests and publication status',approvalTaskCount=(isManager()?cache.filter(actionable).length+reviewApprovalRows.filter(reviewManagerRequest).length:cache.filter(actionable).length);
    menu.innerHTML='<div class="qumc-profile-head"><div class="qumc-profile-avatar">'+esc(String(name).charAt(0).toUpperCase())+'</div><div style="min-width:0"><div class="qumc-profile-name">'+esc(name)+'</div><div class="qumc-profile-email">'+esc(email()||'—')+'</div></div></div>'+
      '<div class="qumc-profile-section-title">Profile</div><div class="qumc-profile-grid"><span>Name</span><b>'+esc(name)+'</b><span>Role</span><b>'+esc(role()==='governance_performance_manager'?'Governance & Performance Department Manager':role().replace(/_/g,' '))+'</b><span>Department</span><b>'+esc(dept)+'</b><span>Last Login</span><b>'+esc(last)+'</b></div>'+
      '<div class="grc-profile-task-panel"><div class="grc-profile-task-title">Requests</div>'+
        '<button class="grc-profile-task primary" onclick="window._grc1RiskOpenCenterRequest()"><span>＋</span><div><strong>Submit a Request</strong><small>Request GRC1 access, permission or system support</small></div></button>'+
        '<button class="grc-profile-task" onclick="window._grc1RiskOpenCenterRequests()"><span>▤</span><div><strong>My Requests</strong><small>Track GRC1 system and access requests</small></div></button>'+
        (canAccessRiskIncidentRegisters()?'<button class="grc-profile-task" onclick="document.getElementById(\'_grc1UserProfileMenu\').remove();window._grc1RiskOpenProfile()"><span>◇</span><div><strong>'+esc(approvalTaskTitle)+'</strong><small>'+esc(approvalTaskSub)+'</small></div><i id="_grc1ProfileRiskCount">'+approvalTaskCount+'</i></button>':'')+'</div>'+
      '<button class="qumc-logout-btn grc-profile-logout" onclick="document.getElementById(\'_grc1UserProfileMenu\').remove();if(window.qumcLogoutToLogin)window.qumcLogoutToLogin(event);else if(window._doLogout)window._doLogout();" type="button"><svg fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24" width="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg> Logout</button>';
    document.body.appendChild(menu);
  };
  window._grc1RiskOpenCenterRequest=openCenterRequest;
  window._grc1RiskOpenCenterRequests=openCenterRequests;

  window._grc1RiskOpenProfile=function(requestId){if(!canAccessRiskIncidentRegisters())return;start();var old=document.getElementById('_grc1RiskProfileOv');if(old)old.remove();var ov=document.createElement('div');ov.id='_grc1RiskProfileOv';ov.className='grc-risk-overlay';var title=isManager()?'GRC1 Approval Requests':'Risk & Incident Registers',subtitle=isManager()?'One queue for Risk, Incident, and Review & Development approvals in your department.':'Additions, updates and deletion requests with the GRC approval workflow.';ov.innerHTML='<div class="grc-risk-dialog wide"><header><div><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div><button onclick="document.getElementById(\'_grc1RiskProfileOv\').remove()">×</button></header><div class="grc-risk-profile-summary"><span id="_grc1RiskProfileCount">0 request(s)</span><div class="grc-risk-tabs"><button class="active" data-grc-risk-tab="all">All</button><button data-grc-risk-tab="action">Needs Action</button><button data-grc-risk-tab="returned">Returned / Rejected</button><button data-grc-risk-tab="published">Published</button></div></div><main id="_grc1RiskProfileBody"></main></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(btn){btn.onclick=function(){ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(x){x.classList.remove('active');});btn.classList.add('active');renderProfileBody();};});renderProfileBody();if(requestId)setTimeout(function(){window._grc1RiskShowDetails(requestId);},50);};
  window._grc1RiskShowDetails=function(id){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var old=document.getElementById('_grc1RiskDetailsOv');if(old)old.remove();
    var ov=document.createElement('div');ov.id='_grc1RiskDetailsOv';ov.className='grc-risk-overlay inner';
    var content=r.operation==='update'?changedTable(r):'<table class="grc-risk-record-table"><tbody>'+fieldRows(r.operation==='delete'?r.currentRecord:r.proposedRecord,recordType(r))+'</tbody></table>';
    ov.innerHTML=`<div class="grc-risk-dialog"><header><div><h2>${esc(r.requestCode||r.id)}</h2><p>${esc(operationLabel(r.operation,r))} · ${esc(statusLabel(r.status))}</p></div><button onclick="document.getElementById('_grc1RiskDetailsOv').remove()">×</button></header><main>${content}${r.deleteReason?'<div class="grc-risk-note"><b>Deletion reason</b>'+esc(r.deleteReason)+'</div>':''}${historyTimeline(r,false)}${actions(r)}</main></div>`;
    document.body.appendChild(ov);
  };
  function decisionCopy(r,action){
    var isReturn=/return/.test(action),isReject=/reject/.test(action),isApprove=/approve/.test(action),isCancel=action==='cancel';
    if(isReturn)return {tone:'warn',title:isAr()?'إعادة الطلب للتعديل':'Return for Update',text:isAr()?'اكتب سبب الإعادة بوضوح. سيتم إرساله مع الطلب إلى صاحب الطلب.':'Enter a clear reason for returning this request. The comment will be sent with the request.',label:isAr()?'سبب الإعادة *':'Return reason *',confirm:isAr()?'إعادة الطلب':'Return Request',needNote:true};
    if(isReject)return {tone:'bad',title:isAr()?'رفض الطلب':'Reject Request',text:isAr()?'سبب الرفض إلزامي ولن يمكن إرسال الرفض بدونه.':'A rejection reason is required before this request can be rejected.',label:isAr()?'سبب الرفض *':'Rejection reason *',confirm:isAr()?'تأكيد الرفض':'Confirm Reject',needNote:true};
    if(isCancel)return {tone:'bad',title:isAr()?'إلغاء الطلب':'Cancel Request',text:isAr()?'هل تريد إلغاء هذا الطلب؟ لن يتم إرساله إلى المرحلة التالية.':'Cancel this request? It will not continue to the next approval stage.',confirm:isAr()?'تأكيد الإلغاء':'Confirm Cancel',needNote:false};
    if(action==='super_approve')return {tone:'good',title:isAr()?'اعتماد ونشر الطلب':'Approve & Publish',text:(isAr()?'سيتم اعتماد هذا التغيير ونشره مباشرة في سجل ':'Approve and publish this change directly in the ')+(recordLabel(r))+(isAr()?'؟':' Register?'),confirm:isAr()?'اعتماد ونشر':'Approve & Publish',needNote:false};
    return {tone:'good',title:isAr()?'اعتماد الطلب':'Approve',text:isAr()?'هل تريد اعتماد هذا الطلب؟':'Approve this request?',confirm:isAr()?'اعتماد':'Approve',needNote:false};
  }
  function decisionPanelFromButton(btn){var actions=btn&&btn.closest&&btn.closest('.grc-risk-request-actions');if(!actions)return null;var panel=actions.nextElementSibling;return panel&&panel.classList&&panel.classList.contains('grc-risk-inline-decision')?panel:null;}
  window._grc1RiskCloseDecision=function(btn){var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;panel.hidden=true;panel.innerHTML='';panel.className='grc-risk-inline-decision';};
  window._grc1RiskDecision=function(id,action,btn){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=decisionPanelFromButton(btn);if(!panel)return;
    var c=decisionCopy(r,action),note=c.needNote?'<label class="grc-risk-inline-label">'+esc(c.label)+'</label><textarea class="grc-risk-inline-textarea" rows="3" placeholder="'+esc(isAr()?'اكتب السبب هنا...':'Enter the reason here...')+'"></textarea>':'';
    panel.hidden=false;panel.className='grc-risk-inline-decision '+c.tone;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(c.title)+'</div><div class="grc-risk-inline-copy">'+esc(c.text)+'</div>'+note+'<div class="grc-risk-inline-error" aria-live="polite"></div><div class="grc-risk-inline-buttons"><button type="button" class="grc-risk-inline-confirm '+c.tone+'" onclick="window._grc1RiskSubmitDecision(\''+esc(id)+'\',\''+esc(action)+'\',this)">'+esc(c.confirm)+'</button><button type="button" class="grc-risk-inline-cancel" onclick="window._grc1RiskCloseDecision(this)">'+esc(isAr()?'إلغاء':'Cancel')+'</button></div>';
    var ta=panel.querySelector('textarea');if(ta)setTimeout(function(){ta.focus();},30);
  };
  window._grc1RiskSubmitDecision=async function(id,action,btn){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;
    var errEl=panel.querySelector('.grc-risk-inline-error'),ta=panel.querySelector('textarea'),note=ta?String(ta.value||'').trim():'';
    if(/return|reject/.test(action)&&!note){if(ta)ta.classList.add('is-invalid');if(errEl)errEl.textContent=isAr()?'السبب مطلوب قبل تنفيذ هذا الإجراء.':'A reason is required before this action can be submitted.';return;}
    if(ta)ta.classList.remove('is-invalid');if(errEl)errEl.textContent='';
    Array.prototype.forEach.call(panel.querySelectorAll('button,textarea'),function(el){el.disabled=true;});panel.classList.add('is-busy');
    try{
      if(action==='manager_approve')await window._grc1RiskRequestManagerAction(id,'approve','');
      else if(action==='manager_return')await window._grc1RiskRequestManagerAction(id,'return',note);
      else if(action==='manager_reject')await window._grc1RiskRequestManagerAction(id,'reject',note);
      else if(action==='super_approve')await window._grc1RiskRequestSuperAction(id,'approve','');
      else if(action==='super_return')await window._grc1RiskRequestSuperAction(id,'return',note);
      else if(action==='super_reject')await window._grc1RiskRequestSuperAction(id,'reject',note);
      else if(action==='cancel')await window._grc1RiskRequestCancel(id);
      panel.className='grc-risk-inline-decision success';panel.hidden=false;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(isAr()?'تم تنفيذ الإجراء':'Action completed')+'</div><div class="grc-risk-inline-copy">'+esc(isAr()?'تم حفظ القرار وتحديث حالة الطلب بنجاح.':'The decision was saved and the request status was updated successfully.')+'</div>';
      setTimeout(function(){var d=document.getElementById('_grc1RiskDetailsOv');if(d)d.remove();if(document.getElementById('_grc1RiskProfileOv'))renderProfileBody();if(document.getElementById('_grc1ApprovalNoticeOv'))renderApprovalNoticeBody();},650);
    }catch(err){panel.classList.remove('is-busy');Array.prototype.forEach.call(panel.querySelectorAll('button,textarea'),function(el){el.disabled=false;});if(errEl)errEl.textContent=String(err&&err.message||err||'Unable to complete the action.');}
  };
  window._grc1RiskEditResubmit=function(id){var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;var d=document.getElementById('_grc1RiskDetailsOv');if(d)d.remove();var p=document.getElementById('_grc1RiskProfileOv');if(p)p.remove();if(typeof window._grc1OpenRiskRequestResubmit==='function')window._grc1OpenRiskRequestResubmit(r);};
  function renderNotificationPanel(panel){if(!panel)return;var rows=notificationRows(),body=panel.querySelector('.grc-risk-notif-list');if(!body)return;body.innerHTML=rows.length?rows.map(function(r){var unread=notificationUnread(r),toneName=notificationTone(r),worked=notificationHandledByMe(r),tag=!unread?'<em>'+(worked?(isAr()?'تم الإجراء':'Actioned'):(isAr()?'مقروء':'Read'))+'</em>':'';return'<button type="button" class="grc-risk-notif-row '+toneName+' '+(unread?'is-unread':'is-read')+'" data-grc-notif-id="'+esc(r.id)+'"><i class="grc-risk-notif-dot"></i><span class="grc-risk-notif-copy"><strong>'+esc(r.requestCode||r.id)+tag+'</strong><small>'+esc(operationLabel(r.operation,r))+' · '+esc(statusLabel(r.status))+'</small></span></button>';}).join(''):'<p>'+esc(isAr()?'لا توجد إشعارات حالياً.':'No GRC1 notifications yet.')+'</p>';Array.prototype.forEach.call(body.querySelectorAll('[data-grc-notif-id]'),function(row){row.onclick=function(e){e.preventDefault();e.stopPropagation();var id=row.getAttribute('data-grc-notif-id'),r=cache.find(function(x){return String(x.id)===String(id);});markNotificationRead(r);panel.remove();window._grc1RiskOpenProfile&&window._grc1RiskOpenProfile(id);};});var mark=panel.querySelector('[data-grc-mark-all]');if(mark)mark.onclick=function(e){e.preventDefault();e.stopPropagation();markAllNotificationsRead();renderNotificationPanel(panel);};}
  window._grc1RiskOpenNotifications=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}start();var old=document.getElementById('_grc1RiskNotifPanel');if(old){old.remove();return;}var btn=document.getElementById('grc1RiskNotifBtn'),rect=btn&&btn.getBoundingClientRect(),panel=document.createElement('div');panel.id='_grc1RiskNotifPanel';panel.className='grc-risk-notif-panel';panel.style.top=((rect&&rect.bottom||70)+8)+'px';panel.style.right=Math.max(12,window.innerWidth-(rect&&rect.right||window.innerWidth-20))+'px';panel.innerHTML='<header><b>'+esc(isAr()?'إشعارات سجل المخاطر والحوادث':'Risk & Incident Register Notifications')+'</b><div class="grc-risk-notif-head-actions"><button type="button" data-grc-mark-all class="grc-risk-notif-mark">'+esc(isAr()?'تحديد الكل كمقروء':'Mark all read')+'</button><button type="button" class="grc-risk-notif-close" onclick="document.getElementById(\'_grc1RiskNotifPanel\').remove()">×</button></div></header><div class="grc-risk-notif-list"></div>';document.body.appendChild(panel);renderNotificationPanel(panel);};
  window._grc1RiskRefreshUi=function(){start();refreshBadge();scheduleApprovalNotice(false);};

  window._grc1RiskBindHeader=function(){
    if(String(window.__qumcActivePortal||'').toLowerCase()!=='grc1')return;
    var root=document.getElementById('grc1App'),not=root&&root.querySelector('#grc1RiskNotifBtn'),usr=root&&root.querySelector('.grc-profile-trigger');
    if(not&&!not.dataset.grcBound){not.dataset.grcBound='1';not.onclick=function(e){e.preventDefault();e.stopPropagation();window._grc1RiskOpenNotifications(e);};}
    if(usr&&!usr.dataset.grcBound){usr.dataset.grcBound='1';usr.onclick=function(e){e.preventDefault();e.stopPropagation();window._grc1RiskOpenProfileMenu(e);};}
    start();refreshBadge();
  };

  document.addEventListener('click',function(e){var p=document.getElementById('_grc1RiskNotifPanel'),b=document.getElementById('grc1RiskNotifBtn');if(p&&(!b||!b.contains(e.target))&&!p.contains(e.target))p.remove();var m=document.getElementById('_grc1UserProfileMenu'),root=document.getElementById('grc1App'),u=root&&root.querySelector('.grc-profile-trigger');if(m&&(!u||!u.contains(e.target))&&!m.contains(e.target))m.remove();},true);
  setInterval(start,1000);setInterval(refreshBadge,3000);document.addEventListener('DOMContentLoaded',start);
})();
