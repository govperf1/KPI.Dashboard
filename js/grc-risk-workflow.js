/* =====================================================================
   QUMC GRC — Risk & Incident Register Requests / Approval Workflow
   Separate from Performance notifications, KPI requests, Gap Analysis and
   Review & Development Center requests.
   ===================================================================== */
(function(){
  'use strict';if(window.__QUMC_GRC_RISK_WORKFLOW_V217__)return;window.__QUMC_GRC_RISK_WORKFLOW_V217__=true;
  var cache=[],unsub=null,startedFor='',reviewApprovalRows=[],reviewApprovalUnsub=null,approvalNoticeKey='',approvalNoticeEntry=0,approvalNoticeTimer=null,feedbackNormalRows=[],feedbackReviewRows=[],feedbackNormalUnsub=null,feedbackReviewUnsub=null,feedbackStartedFor='',feedbackTimer=null,managerPullBusy=false,managerPullAt=0,managerPollTimer=null;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function role(){var raw=window._fbRole||window.currentUserRole||'viewer';return typeof window._normalizePortalRole==='function'?window._normalizePortalRole(raw):String(raw).trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
  function email(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
  function isAr(){return document.documentElement.dir==='rtl'||window.lang==='ar';}
  function isManager(){return role()==='department_manager'||role()==='dept_manager'||role()==='departmentmanager';}
  function isSuper(){return role()==='super_admin';}
  function isAdmin(){return role()==='admin'||isSuper();}
  function isOwner(){var r=role();if(['super_admin','admin','department_manager','governance_performance_manager'].indexOf(r)>=0)return false;return r==='risk_owner'||r==='grc_owner'||r==='platform_owner'||(Array.isArray(window._fbPerms)&&(window._fbPerms.indexOf('edit_risk_management')>=0||window._fbPerms.indexOf('submit_risk_changes')>=0));}
  function isNoticeOwner(){var r=role();return r==='risk_owner'||r==='grc_owner'||r==='platform_owner';}
  function canAccessRiskIncidentWorkflow(){var r=role(),p=Array.isArray(window._fbPerms)?window._fbPerms:[];if(r==='viewer'||r==='user')return false;return ['super_admin','admin','department_manager','dept_manager','risk_owner','grc_owner','platform_owner','governance_performance_manager'].indexOf(r)>=0||p.indexOf('edit_risk_management')>=0||p.indexOf('edit_incident_register')>=0||p.indexOf('*')>=0;}
  // This module controls the approval/request queue only. Do not overwrite
  // window._grcCanAccessRiskIncidentRegisters from grc.js: Viewer/User are
  // allowed to read their department's Risk & Incident registers.
  window._grcCanAccessRiskIncidentWorkflow=canAccessRiskIncidentWorkflow;
  function currentDepartmentKey(){if(isManager()&&window.__grcManagerDepartmentKey)return String(window.__grcManagerDepartmentKey);var raw=Object.prototype.hasOwnProperty.call(window,'_fbDept')?window._fbDept:window.currentUserDept;if(typeof window._grcCanonicalDepartment==='function')return String(window._grcCanonicalDepartment(raw)||'');return String(raw==null?'':raw).trim().toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');}
  function requestDepartmentKey(r){r=r||{};var raw=r.departmentKey||r.department||r.departmentRaw||r.proposedRecord&&r.proposedRecord.department||r.currentRecord&&r.currentRecord.department||'';if(typeof window._grcCanonicalDepartment==='function')return String(window._grcCanonicalDepartment(raw)||'');return String(raw==null?'':raw).trim().toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');}
  function managerDepartmentRequest(r){if(!isManager())return true;return !!(r&&r._managerAssigned===true);}
  function ownRequest(r){return String(r&&r.submittedByEmail||'').toLowerCase().trim()===email();}
  function reviewStage(r){return String(r&&r.workflowStage||r&&r.status||'').trim().toLowerCase();}
  function reviewDepartmentKey(r){var raw=r&&r.departmentKey||'';if(typeof window._grcCanonicalDepartment==='function')return String(window._grcCanonicalDepartment(raw)||'');return String(raw||'').trim().toLowerCase();}
  function reviewManagerRequest(r){return isManager()&&r&&r._managerAssigned===true&&String(r&&r.platform||'grc').toLowerCase()==='grc'&&reviewStage(r)==='pending_department_manager'&&String(r&&r.userEmail||'').toLowerCase().trim()!==email();}
  function reviewRequestTime(r){var v=r&&r.updatedAt||r&&r.createdAt||r&&r.updatedAtIso||r&&r.createdAtIso||'';try{return v&&v.toDate?v.toDate().getTime():new Date(v||0).getTime()||0;}catch(_){return 0;}}
  function reviewRelatedText(r){var out=(Array.isArray(r&&r.relatedItems)?r.relatedItems:[]).map(function(x){return x&&x.code?String(x.code)+(x.name?' — '+String(x.name):''):String(x&&x.name||x&&x.label||'');}).filter(Boolean);if(r&&r.relatedNewText)out.push('New: '+String(r.relatedNewText));return out.join('; ')||'—';}
  function reviewTypeText(r){var t=String(r&&r.requestType||'');return t==='new'?'New Item Request':'Existing Item Review & Update';}
  function reviewDateText(r){var v=r&&r.createdAt||r&&r.createdAtIso||'';try{var d=v&&v.toDate?v.toDate():new Date(v);if(!d||isNaN(d.getTime()))return'—';return d.toLocaleString(isAr()?'ar-SA':'en-GB',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_){return'—';}}
  function statusLabel(s){var m={pending_manager:'Pending Department Manager Approval',pending_super_admin:'Pending Super Admin Approval',returned_requester:'Returned for Update',returned_manager:'Returned to Department Manager',rejected_manager:'Rejected by Department Manager',rejected_super_admin:'Rejected by Super Admin',published:'Published',cancelled:'Cancelled'};return m[s]||String(s||'—').replace(/_/g,' ');}
  function recordType(r){return String(r&&r.recordType||'risk').toLowerCase()==='incident'?'incident':'risk';}
  function recordLabel(r){return recordType(r)==='incident'?'Incident':'Risk';}
  function operationLabel(s,r){var label=recordLabel(r);return({add:'Add '+label,update:'Update '+label,delete:'Delete '+label})[s]||s||'—';}
  function fieldLabel(k){var m={riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',controlType:'Current Risk Control Type',actionStatus:'Action Status',date:'Incident Date',category:'Category',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required',department:'Department',responsibleDept:'Responsible Department',responsibleDepartment:'Responsible Department',status:'Status',id:'ID'};return m[k]||String(k||'').replace(/([A-Z])/g,' $1').replace(/^./,function(x){return x.toUpperCase();});}
  function returnableFields(r){var keys=recordType(r)==='incident'?['date','category','contributingFactors','investigationRequired','status']:['riskIdentified','riskCategory','likelihood','impact','controlType','actionStatus'];return keys.slice();}
  function requestedFieldsHtml(r){var f=Array.isArray(r&&r.returnFields)?r.returnFields:[],note=String(r&&r.returnNote||'').trim();if(!f.length&&!note)return'';return '<section class="grc-risk-return-request"><div class="grc-risk-block-title">'+esc(isAr()?'المطلوب تعديله':'Requested Corrections')+'</div>'+(f.length?'<div class="grc-risk-return-fields">'+f.map(function(k){return '<span>'+esc(fieldLabel(k))+'</span>';}).join('')+'</div>':'')+(note?'<div class="grc-risk-note"><b>'+esc(isAr()?'الملاحظة':'Note')+'</b>'+esc(note)+'</div>':'')+'</section>';}
  function returnFieldSelectorHtml(r,required){var selected=Array.isArray(r&&r.returnFields)?r.returnFields:[],fields=returnableFields(r);return '<div class="grc-risk-return-select"><div class="grc-risk-inline-label">'+esc(isAr()?'حدد الحقول المطلوب تعديلها'+(required?' *':''):'Select fields to be updated'+(required?' *':''))+'</div><div class="grc-risk-return-checks">'+fields.map(function(k){return '<label><input type="checkbox" data-grc-return-field value="'+esc(k)+'" '+(selected.indexOf(k)>=0?'checked':'')+'> <span>'+esc(fieldLabel(k))+'</span></label>';}).join('')+'</div></div>';}
  function ensureReturnWorkflowStyles(){if(document.getElementById('_grcReturnWorkflowStyles'))return;var st=document.createElement('style');st.id='_grcReturnWorkflowStyles';st.textContent='.grc-risk-return-select{margin:10px 0;padding:10px;border:1px solid #d9e5ea;border-radius:10px;background:#fff}.grc-risk-return-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 10px;margin-top:8px}.grc-risk-return-checks label{display:flex;gap:7px;align-items:center;padding:7px 8px;border:1px solid #e1e9ed;border-radius:8px;background:#f8fbfc;font-size:10px;font-weight:800;color:#35566a}.grc-risk-return-checks input{width:15px;height:15px}.grc-risk-return-request{margin:12px 0;padding:11px;border:1px solid #efcc84;border-radius:11px;background:#fff9ea}.grc-risk-return-fields{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.grc-risk-return-fields span{padding:5px 8px;border-radius:999px;background:#fff0c8;color:#7a5200;font-size:9px;font-weight:900}@media(max-width:640px){.grc-risk-return-checks{grid-template-columns:1fr}}';document.head.appendChild(st);}
  function historyStatusLabel(s){var m={pending_manager:'Submitted for Department Manager Approval',pending_super_admin:'Approved by Department Manager',returned_requester:'Returned for Update',returned_manager:'Returned to Department Manager',rejected_manager:'Rejected by Department Manager',rejected_super_admin:'Rejected by Super Admin',published:'Approved & Published',cancelled:'Cancelled'};return m[String(s||'')]||statusLabel(s);}
  function historyRoleLabel(r){var m={risk_owner:'GRC Owner',grc_owner:'GRC Owner',platform_owner:'Performance & GRC Owner',department_manager:'Department Manager',dept_manager:'Department Manager',super_admin:'Super Admin',admin:'Admin'};return m[String(r||'').toLowerCase()]||String(r||'').replace(/_/g,' ');}
  /* The Department Manager return/reject UI must name the actual requester
     role rather than assuming "GRC Owner" — submittedByRole reflects who
     really submitted the Risk/Incident request. */
  var SUBMITTER_ROLE_LABELS_EN={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Department Manager',governance_performance_manager:'Governance & Performance Manager',kpi_owner:'KPI Owner',risk_owner:'Risk Owner',grc_owner:'GRC Owner',platform_owner:'Platform Owner',viewer:'Viewer',user:'User'};
  var SUBMITTER_ROLE_LABELS_AR={super_admin:'سوبر أدمن',admin:'أدمن',executive:'تنفيذي',department_manager:'مدير القسم',governance_performance_manager:'مدير الحوكمة والأداء',kpi_owner:'مالك مؤشر الأداء',risk_owner:'مالك المخاطر',grc_owner:'مسؤول الحوكمة',platform_owner:'مالك المنصة',viewer:'مستخدم مشاهد',user:'مستخدم'};
  function submitterLabel(r){var role=String(r&&r.submittedByRole||'').toLowerCase().trim();return isAr()?(SUBMITTER_ROLE_LABELS_AR[role]||'مقدم الطلب'):(SUBMITTER_ROLE_LABELS_EN[role]||'Requester');}
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
  function historyTimeline(r,compact){var h=Array.isArray(r&&r.history)?r.history.slice():[];if(!h.length)return'';if(compact&&h.length>4)h=h.slice(-4);return'<section class="grc-risk-history '+(compact?'compact':'')+'"><div class="grc-risk-block-title">'+esc(isAr()?'سجل الاعتماد':'Approval History')+'</div><div class="grc-risk-history-list">'+h.map(function(x){var note=String(x&&x.note||'').trim(),actor=String(x&&x.by||'').trim(),rlabel=historyRoleLabel(x&&x.role||''),fields=Array.isArray(x&&x.fields)?x.fields:[];return'<div class="grc-risk-history-item"><i></i><div><div class="grc-risk-history-top"><strong>'+esc(historyStatusLabel(x&&x.status||''))+'</strong><time>'+esc(historyTime(x&&x.at||x&&x.createdAt))+'</time></div><small>'+esc(rlabel+(actor?' · '+actor:''))+'</small>'+(fields.length?'<p><b>'+esc(isAr()?'الحقول: ':'Fields: ')+'</b>'+esc(fields.map(fieldLabel).join(' · '))+'</p>':'')+(note?'<p>'+esc(note)+'</p>':'')+'</div></div>';}).join('')+'</div></section>';}
  function tone(s){if(/^pending/.test(s)||/^returned/.test(s))return'warn';if(s==='published')return'good';if(/^rejected/.test(s)||s==='cancelled')return'bad';return'info';}
  function actionable(r){var s=String(r.status||'');if(isOwner())return ownRequest(r)&&s==='returned_requester';if(isManager())return !ownRequest(r)&&managerDepartmentRequest(r)&&(s==='pending_manager'||s==='returned_manager');if(isSuper())return s==='pending_super_admin';return false;}
  function riskApprovalNoticeRows(){
    return cache.filter(function(r){
      var s=String(r&&r.status||'');
      if(isSuper())return s==='pending_super_admin';
      if(isManager())return !ownRequest(r)&&managerDepartmentRequest(r)&&(s==='pending_manager'||s==='returned_manager');
      if(isNoticeOwner())return ownRequest(r)&&['pending_manager','pending_super_admin','returned_manager','returned_requester'].indexOf(s)>=0;
      return false;
    });
  }
  function approvalNoticeRows(){
    var rows=riskApprovalNoticeRows().map(function(r){return{kind:'risk',row:r};});
    if(isManager())rows=rows.concat(reviewApprovalRows.filter(reviewManagerRequest).map(function(r){return{kind:'review',row:r};}));
    if(isSuper())rows=rows.concat(reviewApprovalRows.filter(function(r){return String(r&&r.workflowStage||r&&r.status||'').toLowerCase()==='pending_super_admin';}).map(function(r){return{kind:'review',row:r};}));
    return rows.sort(function(a,b){var at=a.kind==='review'?reviewRequestTime(a.row):new Date(a.row&&a.row.updatedAtIso||a.row&&a.row.createdAtIso||0).getTime()||0,bt=b.kind==='review'?reviewRequestTime(b.row):new Date(b.row&&b.row.updatedAtIso||b.row&&b.row.createdAtIso||0).getTime()||0;return bt-at;});
  }
  function approvalNoticeSignature(rows){
    return [approvalNoticeEntry,role(),email(),rows.map(function(item){var r=item.row||{},kind=item.kind||'risk';return kind+':'+String(r.id||r.requestCode||r.code||'')+':'+String(r.status||r.workflowStage||'')+':'+String(r.updatedAtIso||r.updatedAtText||r.createdAtIso||r.createdAt||'');}).join('|')].join('::');
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

      .grc-manager-approval-section{margin-bottom:18px}
      .grc-manager-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;margin:0 0 10px;border:1px solid #dbe7ec;border-radius:13px;background:linear-gradient(180deg,#f8fbfc,#eef5f7)}
      .grc-manager-section-head h3{margin:0;color:#173f5f;font-size:12px;font-weight:900}
      .grc-manager-section-head p{margin:4px 0 0;color:#708592;font-size:9.5px}
      .grc-manager-section-head>span{min-width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#15566d;color:#fff;font-size:10px;font-weight:900}

#_grcApprovalNoticeOv .grc-apn-group{margin:0 0 16px}
#_grcApprovalNoticeOv .grc-apn-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;margin-bottom:9px;border:1px solid #dbe7ec;border-radius:13px;background:linear-gradient(180deg,#f8fbfc,#eef5f7)}
#_grcApprovalNoticeOv .grc-apn-group-head strong{display:block;color:#173f5f;font-size:11px;font-weight:900}
#_grcApprovalNoticeOv .grc-apn-group-head small{display:block;color:#708592;font-size:9px;margin-top:3px}
#_grcApprovalNoticeOv .grc-apn-group-head>b{min-width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#15566d;color:#fff;font-size:9px}
#_grcApprovalNoticeOv .grc-apn-group-empty{padding:18px;text-align:center;border:1px dashed #cbdde4;border-radius:12px;color:#78909c;font-size:10px;background:#fbfdfe}
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
    if(isManager())return isAr()?'راجع جميع طلبات قسمك في مكان واحد: المخاطر والحوادث وطلبات المراجعة والتطوير.':'Review all department approvals in one place: Risk, Incident, and Review & Development requests.';
    return isAr()?'تظهر هنا طلباتك التي ما زالت تحت الاعتماد أو تحتاج منك تعديلًا.':'These requests are still in approval or require an update from you.';
  }
  function reviewApprovalNoticeCard(r){
    var details=String(r.details||r.title||r.relatedNewText||r.category||r.relatedType||'').trim();
    return `<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>${esc(r.code||r.id)}</strong><small>${esc(isAr()?'مراجعة وتطوير':'Review & Development')} · ${esc(reviewTypeText(r))}</small></div><span class="grc-apn-status">${esc(isAr()?'بانتظار موافقة مدير القسم':'Pending Department Manager Approval')}</span></div><div class="grc-apn-meta"><span>${esc(isAr()?'نوع العنصر':'Item Type')}</span><b>${esc(r.category||r.relatedType||r.requestTypeLabel||'—')}</b><span>${esc(isAr()?'السجل المرتبط':'Related Record')}</span><b>${esc(reviewRelatedText(r)||r.relatedNewText||'—')}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.userName||r.userEmail||'—')}</b><span>${esc(isAr()?'التفاصيل':'Details')}</span><b>${esc(details||'No request details were stored.')}</b></div><div class="grc-apn-actions"><button class="grc-apn-btn primary" onclick="window._grcReviewManagerPanel('${esc(r.id)}','approve',this)">${esc(isAr()?'اعتماد للسوبر أدمن':'Approve to Super Admin')}</button><button class="grc-apn-btn secondary" onclick="window._grcReviewManagerPanel('${esc(r.id)}','return',this)">${esc(isAr()?'إعادة لمقدم الطلب':'Return to Requester')}</button><button class="grc-apn-btn secondary" onclick="window._grcReviewManagerPanel('${esc(r.id)}','reject',this)">${esc(isAr()?'رفض':'Reject')}</button></div><div class="grc-review-manager-panel grc-risk-inline-decision" hidden></div></article>`;
  }
  function reviewSuperAdminNoticeCard(r){
    var details=String(r&&r.details||r&&r.title||r&&r.relatedNewText||r&&r.category||r&&r.relatedType||'').trim();
    return `<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>${esc(r.code||r.id)}</strong><small>${esc(isAr()?'مراجعة وتطوير':'Review & Development')} · ${esc(reviewTypeText(r))}</small></div><span class="grc-apn-status">${esc(isAr()?'بانتظار المراجعة النهائية':'Pending Super Admin Review')}</span></div><div class="grc-apn-meta"><span>${esc(isAr()?'نوع العنصر':'Item Type')}</span><b>${esc(r.category||r.relatedType||r.requestTypeLabel||'—')}</b><span>${esc(isAr()?'السجل المرتبط':'Related Record')}</span><b>${esc(reviewRelatedText(r)||r.relatedNewText||'—')}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.userName||r.userEmail||'—')}</b><span>${esc(isAr()?'التفاصيل':'Details')}</span><b>${esc(details||'No request details were stored.')}</b></div><div class="grc-apn-actions"><button class="grc-apn-btn primary" onclick="window._grcReviewApprovalOpenRequest('${esc(r.id)}')">${esc(isAr()?'فتح الطلب والرد':'Open & Respond')}</button></div></article>`;
  }
  function approvalNoticeCard(item){
    if(item&&item.kind==='review')return isSuper()?reviewSuperAdminNoticeCard(item.row||{}):reviewApprovalNoticeCard(item.row||{});
    var r=item&&item.row||item||{},s=String(r.status||''),bad=/^returned|^rejected/.test(s),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+recordLabel(r));
    var actionText=actionable(r)?(isAr()?'يحتاج إجراء':'Needs action'):(isAr()?'قيد الاعتماد':'In approval');
    return `<article class="grc-apn-card"><div class="grc-apn-card-head"><div><strong>${esc(r.requestCode||r.id)}</strong><small>${esc(operationLabel(r.operation,r))} · ${esc(r.department||'')}</small></div><span class="grc-apn-status ${bad?'bad':''}">${esc(statusLabel(s))}</span></div><div class="grc-apn-meta"><span>${esc(isAr()?'السجل':'Record')}</span><b>${esc(target)}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.submittedByName||r.submittedByEmail||'—')}</b><span>${esc(isAr()?'الحالة':'Status')}</span><b>${esc(actionText)}</b></div>${changePreview(r,true)}${historyTimeline(r,true)}<div class="grc-apn-actions"><button class="grc-apn-btn secondary" onclick="window._grcRiskApprovalNoticeOpenRequest('${esc(r.id)}')">${esc(isAr()?'عرض التفاصيل':'View details')}</button></div>${actions(r)}</article>`;
  }
  function renderApprovalNoticeBody(){
    var ov=document.getElementById('_grcApprovalNoticeOv');if(!ov)return;
    var rows=approvalNoticeRows(),body=ov.querySelector('.grc-apn-body');if(!body)return;
    if(isManager()){
      var riskRows=rows.filter(function(x){return x.kind==='risk';}),reviewRows=rows.filter(function(x){return x.kind==='review';});
      body.innerHTML='<div class="grc-apn-summary"><span>'+esc(isAr()?'طلبات الاعتماد الحالية':'Current approval requests')+'</span><b>'+rows.length+' '+esc(isAr()?'طلب قائم':'pending request(s)')+'</b></div>'+
        '<section class="grc-apn-group"><div class="grc-apn-group-head"><div><strong>Risk & Incident Register Approval Requests</strong><small>Requests awaiting your department decision.</small></div><b>'+riskRows.length+'</b></div>'+(riskRows.length?riskRows.map(approvalNoticeCard).join(''):'<div class="grc-apn-group-empty">No pending Risk or Incident requests.</div>')+'</section>'+
        '<section class="grc-apn-group"><div class="grc-apn-group-head"><div><strong>Review & Development Approval Requests</strong><small>Requests awaiting your department decision.</small></div><b>'+reviewRows.length+'</b></div>'+(reviewRows.length?reviewRows.map(approvalNoticeCard).join(''):'<div class="grc-apn-group-empty">No pending Review & Development requests.</div>')+'</section>';
    }else{
      body.innerHTML='<div class="grc-apn-summary"><span>'+esc(isAr()?'حالة طلبات الاعتماد':'Approval request status')+'</span><b>'+rows.length+' '+esc(isAr()?'طلب يحتاج متابعة':'request(s) require attention')+'</b></div>'+rows.map(approvalNoticeCard).join('');
    }
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
  function scheduleApprovalNotice(force){if(!force&&document.getElementById('_grcApprovalNoticeOv')){renderApprovalNoticeBody();return;}clearTimeout(approvalNoticeTimer);approvalNoticeTimer=setTimeout(function(){try{showApprovalNotice(!!force);}catch(e){console.warn('[GRC Approval Notice]',e);}},650);}
  window._grcRiskApprovalNoticeClose=closeApprovalNotice;
  window._grcRiskApprovalNoticeOpenAll=function(){closeApprovalNotice();window._grcRiskOpenProfile&&window._grcRiskOpenProfile();};
  window._grcRiskApprovalNoticeOpenRequest=function(id){closeApprovalNotice();window._grcRiskOpenProfile&&window._grcRiskOpenProfile(id);};
  window._grcReviewApprovalOpenRequest=function(id){closeApprovalNotice();var p=document.getElementById('_grcRiskProfileOv');if(p)p.remove();if(typeof window._advOpenApprovalRequest==='function')window._advOpenApprovalRequest(id);else if(typeof window._advOpenRequest==='function')window._advOpenRequest(id);};
  window._grcRiskApprovalEntryNoticeReset=function(){approvalNoticeEntry++;approvalNoticeKey='';scheduleApprovalNotice(true);};
  function notifSeenKey(){return 'qumc_grc_risk_notif_seen_v111::'+email()+'::'+role();}
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
  function refreshBadge(){var scoped=isManager()?cache.filter(managerDepartmentRequest):cache,n=scoped.filter(notificationUnread).length,approvalCount=scoped.filter(actionable).length+(isManager()?reviewApprovalRows.filter(reviewManagerRequest).length:0)+(isSuper()?reviewApprovalRows.filter(function(r){return String(r&&r.workflowStage||r&&r.status||'').toLowerCase()==='pending_super_admin';}).length:0),el=document.getElementById('grcRiskNotifCount'),req=document.getElementById('grcRiskRequestCount'),profile=document.getElementById('_grcProfileRiskCount');if(el){el.textContent=String(n);el.style.display=n?'grid':'none';}if(req){req.textContent=String(approvalCount||scoped.length);req.style.display=(approvalCount||scoped.length)?'grid':'none';}if(profile)profile.textContent=String(approvalCount);}
  function feedbackDismissedKey(){return'qumc_grc_feedback_dismissed_v118::'+email();}
  function readFeedbackDismissed(){try{var x=JSON.parse(localStorage.getItem(feedbackDismissedKey())||'[]');return Array.isArray(x)?x.map(String):[];}catch(_){return[];}}
  function writeFeedbackDismissed(rows){try{localStorage.setItem(feedbackDismissedKey(),JSON.stringify((rows||[]).map(String).slice(-500)));}catch(_){}}
  function feedbackItemKey(item){return String(item.kind||'request')+'::'+String(item.id||'')+'::'+String(item.status||'');}
  function feedbackItemTime(item){var v=item.updatedAt||item.respondedAt||item.closedAt||item.ratingAt||item.createdAt;try{return v&&v.toDate?v.toDate().getTime():new Date(v||item.updatedAtIso||0).getTime()||0;}catch(_){return 0;}}
  function feedbackCandidates(){var out=[];feedbackNormalRows.forEach(function(r){if(['approved','rejected'].indexOf(String(r.status||'').toLowerCase())>=0&&!Number(r.rating||0))out.push(Object.assign({kind:'system',label:'GRC Request',code:r.requestType||'GRC Request'},r));});feedbackReviewRows.forEach(function(r){var stage=String(r.workflowStage||r.status||'').toLowerCase();if(String(r.status||'').toLowerCase()==='closed'&&stage!=='cancelled'&&!Number(r.rating||0))out.push(Object.assign({kind:'review',label:'Review & Development Request'},r));});var dismissed=readFeedbackDismissed();return out.filter(function(x){return dismissed.indexOf(feedbackItemKey(x))<0;}).sort(function(a,b){return feedbackItemTime(b)-feedbackItemTime(a);});}
  function closeFeedbackNotice(dismiss){var ov=document.getElementById('_grcFeedbackNoticeOv');if(!ov)return;var key=ov.getAttribute('data-feedback-key');if(dismiss&&key){var rows=readFeedbackDismissed();if(rows.indexOf(key)<0){rows.push(key);writeFeedbackDismissed(rows);}}ov.remove();}
  function showFeedbackNotice(){clearTimeout(feedbackTimer);if(!document.body.classList.contains('grc-mode')||document.getElementById('_grcFeedbackNoticeOv'))return;if(document.getElementById('_grcApprovalNoticeOv')){feedbackTimer=setTimeout(showFeedbackNotice,900);return;}var item=feedbackCandidates()[0];if(!item)return;var ov=document.createElement('div');ov.id='_grcFeedbackNoticeOv';ov.className='grc-feedback-notice';ov.setAttribute('data-feedback-key',feedbackItemKey(item));ov.setAttribute('data-feedback-kind',item.kind);ov.setAttribute('data-feedback-id',String(item.id||''));var code=item.code||item.requestCode||item.id||'',status=String(item.status||'').toLowerCase(),statusText=status==='rejected'?'rejected':'completed';ov.innerHTML='<section class="grc-feedback-dialog" role="dialog" aria-modal="true"><button type="button" class="grc-feedback-close" onclick="window._grcFeedbackDismiss()">×</button><div class="grc-feedback-icon">★</div><h2>Your request has been '+esc(statusText)+'</h2><p>'+esc(item.label||'Request')+' <b>'+esc(code)+'</b> has been answered and is waiting for your rating.</p><div class="grc-feedback-actions"><button type="button" class="grc-feedback-later" onclick="window._grcFeedbackDismiss()">Rate Later</button><button type="button" class="grc-feedback-rate" onclick="window._grcFeedbackRateNow()">Rate Now</button></div></section>';ov.addEventListener('click',function(e){if(e.target===ov)window._grcFeedbackDismiss();});document.body.appendChild(ov);}
  window._grcFeedbackDismiss=function(){closeFeedbackNotice(true);};
  window._grcFeedbackRateNow=function(){var ov=document.getElementById('_grcFeedbackNoticeOv');if(!ov)return;var kind=ov.getAttribute('data-feedback-kind'),id=ov.getAttribute('data-feedback-id');closeFeedbackNotice(true);if(kind==='system'){window._grcShowMyRequests&&window._grcShowMyRequests();return;}if(typeof window._grcSwitch==='function')window._grcSwitch('advisory');setTimeout(function(){if(typeof window._advOpenRequest==='function')window._advOpenRequest(id);},650);};
  function scheduleFeedbackNotice(){clearTimeout(feedbackTimer);feedbackTimer=setTimeout(showFeedbackNotice,650);}
  function refreshFeedbackData(){if(!email())return Promise.resolve();var a=typeof window._grcRequestsGetMine==='function'?window._grcRequestsGetMine():Promise.resolve([]),b=typeof window._advisoryGetMine==='function'?window._advisoryGetMine():Promise.resolve([]);return Promise.all([a,b]).then(function(rows){feedbackNormalRows=Array.isArray(rows[0])?rows[0]:[];feedbackReviewRows=(Array.isArray(rows[1])?rows[1]:[]).filter(function(r){return String(r.platform||'grc').toLowerCase()==='grc';});scheduleFeedbackNotice();}).catch(function(){});}
  function stopFeedbackWatch(){if(feedbackNormalUnsub)try{feedbackNormalUnsub();}catch(_){}if(feedbackReviewUnsub)try{feedbackReviewUnsub();}catch(_){}feedbackNormalUnsub=feedbackReviewUnsub=null;feedbackStartedFor='';feedbackNormalRows=[];feedbackReviewRows=[];reviewApprovalRows=[];clearTimeout(feedbackTimer);var ov=document.getElementById('_grcFeedbackNoticeOv');if(ov)ov.remove();}
  function startFeedbackWatch(){
    var key=email()+'|'+role()+'|'+currentDepartmentKey();
    if(!email()||!document.body.classList.contains('grc-mode'))return;
    /* Retry until the advisory listener is actually available. This avoids the old
       race where the first interval ran before firebase.js exposed the API and the
       manager queue then stayed empty for the entire session. */
    if(feedbackStartedFor===key&&(feedbackReviewUnsub||isManager()))return;
    stopFeedbackWatch();feedbackStartedFor=key;
    if(typeof window._grcRequestsSubscribeMine==='function')feedbackNormalUnsub=window._grcRequestsSubscribeMine(function(rows,err){if(!err){feedbackNormalRows=Array.isArray(rows)?rows:[];scheduleFeedbackNotice();}});
    if(!isManager()&&typeof window._advisorySubscribe==='function')feedbackReviewUnsub=window._advisorySubscribe(function(payload){
      var live=payload&&Array.isArray(payload.records)?payload.records:[];
      feedbackReviewRows=live.filter(function(r){return String(r&&r.platform||'grc').toLowerCase()==='grc'&&String(r&&r.userEmail||'').toLowerCase().trim()===email();});
      scheduleFeedbackNotice();
    });
    refreshFeedbackData();
  }
  document.addEventListener('grc:feedbackRefresh',function(){refreshFeedbackData();});
  function refreshManagerApprovalQueues(force){
    if(!isManager())return Promise.resolve();
    var now=Date.now();if(managerPullBusy||(!force&&now-managerPullAt<5000))return Promise.resolve();
    managerPullBusy=true;managerPullAt=now;
    var risk=typeof window._grcRiskRequestsGetForManager==='function'?window._grcRiskRequestsGetForManager():Promise.resolve([]);
    var review=typeof window._advisoryGetManagerQueue==='function'?window._advisoryGetManagerQueue():Promise.resolve([]);
    return Promise.allSettled([risk,review]).then(function(rows){
      var errors=[];
      if(rows[0].status==='fulfilled')cache=(Array.isArray(rows[0].value)?rows[0].value:[]).filter(managerDepartmentRequest);
      else errors.push('Risk / Incident: '+String(rows[0].reason&&rows[0].reason.message||rows[0].reason||'Permission denied'));
      if(rows[1].status==='fulfilled')reviewApprovalRows=(Array.isArray(rows[1].value)?rows[1].value:[]).filter(reviewManagerRequest);
      else errors.push('Review & Development: '+String(rows[1].reason&&rows[1].reason.message||rows[1].reason||'Permission denied'));
      window.__grcManagerApprovalError=errors.length?errors.join(' · '):'';
      window.__grcRiskRequestCache=cache;
      try{document.dispatchEvent(new CustomEvent('grc:riskRequestsUpdated',{detail:{rows:cache}}));}catch(_e){}
      refreshBadge();
      if(document.getElementById('_grcRiskProfileOv'))renderProfileBody();
      if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();
      if(errors.length)console.warn('[GRC Manager Approval Pull]',errors.join(' · '));
      scheduleApprovalNotice(false);
    }).finally(function(){managerPullBusy=false;});
  }
  window._grcRiskInjectManagerQueue=function(riskRows,reviewRows){
    if(!isManager())return;
    cache=(Array.isArray(riskRows)?riskRows:[]).filter(managerDepartmentRequest);
    reviewApprovalRows=(Array.isArray(reviewRows)?reviewRows:[]).filter(reviewManagerRequest);
    window.__grcRiskRequestCache=cache;
    refreshBadge();
    if(document.getElementById('_grcRiskProfileOv'))renderProfileBody();
    if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();
  };
  function stop(){if(unsub)try{unsub();}catch(_){}unsub=null;if(reviewApprovalUnsub)try{reviewApprovalUnsub();}catch(_){}reviewApprovalUnsub=null;if(managerPollTimer){clearInterval(managerPollTimer);managerPollTimer=null;}startedFor='';cache=[];managerPullBusy=false;managerPullAt=0;window.__grcRiskRequestCache=[];var panel=document.getElementById('_grcRiskNotifPanel');if(panel)panel.remove();closeApprovalNotice();stopFeedbackWatch();refreshBadge();}
  function start(){
    if(!document.body.classList.contains('grc-mode')){if(unsub||startedFor||feedbackStartedFor)stop();return;}
    var key=email()+'|'+role()+'|'+String(window._fbDept||window.currentUserDept||'');
    if(!email()){cache=[];refreshBadge();return;}
    startFeedbackWatch();
    /* Department Manager approval queues use fresh Firestore profile reads.
       Do not let a stale session-scoped live listener hide valid approvals. */
    if(isManager()){
      if(unsub)try{unsub();}catch(_){}unsub=null;
      if(managerPollTimer)clearInterval(managerPollTimer);
      startedFor=key;
      refreshManagerApprovalQueues(true);
      managerPollTimer=setInterval(function(){
        if(document.body.classList.contains('grc-mode')&&isManager())refreshManagerApprovalQueues(true);
        else if(managerPollTimer){clearInterval(managerPollTimer);managerPollTimer=null;}
      },4000);
      return;
    }
    if(isSuper()&&typeof window._advisorySubscribePendingSuperAdmin==='function'){
      if(reviewApprovalUnsub)try{reviewApprovalUnsub();}catch(_){}
      reviewApprovalUnsub=window._advisorySubscribePendingSuperAdmin(function(rows,err){
        if(err){console.warn('[GRC Super Admin Review Queue]',err&&err.message||err);return;}
        reviewApprovalRows=Array.isArray(rows)?rows:[];
        refreshBadge();
        if(document.getElementById('_grcRiskProfileOv'))renderProfileBody();
        if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();
        scheduleApprovalNotice(false);
      });
    }
    if(typeof window._grcRiskRequestsSubscribe!=='function'){cache=[];window.__grcRiskRequestCache=[];refreshBadge();return;}
    if(startedFor===key&&unsub)return;
    if(unsub)try{unsub();}catch(_){}
    startedFor=key;
    unsub=window._grcRiskRequestsSubscribe(function(rows,err){
      if(err)return;
      cache=Array.isArray(rows)?rows:[];window.__grcRiskRequestCache=cache;
      try{document.dispatchEvent(new CustomEvent('grc:riskRequestsUpdated',{detail:{rows:cache}}));}catch(_e){}
      refreshBadge();var ov=document.getElementById('_grcRiskProfileOv');if(ov)renderProfileBody();
      if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();
      var np=document.getElementById('_grcRiskNotifPanel');if(np&&typeof renderNotificationPanel==='function')renderNotificationPanel(np);
      scheduleApprovalNotice(false);
    });
  }
  function fieldRows(obj,type){obj=obj||{};var labels=type==='incident'?{id:'Incident ID',date:'Incident Date',category:'Category',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required',department:'Department',status:'Status'}:{id:'Risk ID',riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',controlType:'Control Type',actionStatus:'Action Status',department:'Department'};return Object.keys(labels).map(function(k){return'<tr><th>'+labels[k]+'</th><td>'+esc(obj[k]==null?'—':obj[k])+'</td></tr>';}).join('');}
  function changedTable(r){var before=r.currentRecord||{},after=r.proposedRecord||{},keys=changedKeys(r);return'<section class="grc-risk-detail-diff"><div class="grc-risk-block-title">'+esc(isAr()?'تفاصيل التعديل':'Update Details')+'</div><table class="grc-risk-diff"><thead><tr><th>'+esc(isAr()?'الخانة التي تغيرت':'Changed Field')+'</th><th>'+esc(isAr()?'قبل':'Before')+'</th><th>'+esc(isAr()?'بعد':'After')+'</th></tr></thead><tbody>'+keys.map(function(k){return'<tr><th>'+esc(fieldLabel(k))+'</th><td class="grc-risk-before">'+esc(changeValue(before[k]))+'</td><td class="grc-risk-after">'+esc(changeValue(after[k]))+'</td></tr>';}).join('')+'</tbody></table></section>'; }
  function inlineDecisionShell(){return '<div class="grc-risk-inline-decision" hidden></div>';}
  function actions(r){var s=String(r.status||''),html='';
    if(isManager()&&!ownRequest(r)&&managerDepartmentRequest(r)&&s==='pending_manager')html='<button class="grc-risk-action good" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_approve\',this)">Approve to Super Admin</button><button class="grc-risk-action warn" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_return\',this)">Return to '+esc(submitterLabel(r))+'</button><button class="grc-risk-action bad" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_reject\',this)">Reject</button>';
    if(isManager()&&!ownRequest(r)&&managerDepartmentRequest(r)&&s==='returned_manager')html='<button class="grc-risk-action good" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_approve\',this)">Approve to Super Admin</button><button class="grc-risk-action warn" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_return\',this)">Return to '+esc(submitterLabel(r))+'</button><button class="grc-risk-action bad" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'manager_reject\',this)">Reject</button>';
    if(isSuper()&&s==='pending_super_admin')html='<button class="grc-risk-action good" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_approve\',this)">Approve & Publish</button><button class="grc-risk-action warn" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_return\',this)">Return to Department Manager</button><button class="grc-risk-action bad" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'super_reject\',this)">Reject</button>';
    if(isOwner()&&ownRequest(r)&&s==='returned_requester')html='<button class="grc-risk-action good" onclick="window._grcRiskEditResubmit(\''+esc(r.id)+'\')">Edit Requested Fields & Resubmit</button>';
    if(isOwner()&&ownRequest(r)&&s==='pending_manager')html='<button class="grc-risk-action bad ghost" onclick="window._grcRiskDecision(\''+esc(r.id)+'\',\'cancel\',this)">Cancel Request</button>';
    return html?'<div class="grc-risk-request-actions">'+html+'</div>'+inlineDecisionShell():'';
  }
  function card(r){
    var label=recordLabel(r),target=r.targetRecordId||r.targetRiskId||r.proposedRecord&&r.proposedRecord.id||('New '+label);
    return `<article class="grc-risk-request-card"><div class="grc-risk-card-head"><div><strong>${esc(r.requestCode||r.id)}</strong><small>${esc(operationLabel(r.operation,r))} · ${esc(r.department||'')}</small></div><span class="grc-risk-status ${tone(r.status)}">${esc(statusLabel(r.status))}</span></div><div class="grc-risk-card-grid"><span>${label}</span><b>${esc(target)}</b><span>Submitted by</span><b>${esc(r.submittedByName||r.submittedByEmail||'—')}</b><span>Submitted</span><b>${esc(r.createdAtText||r.createdAtIso||'—')}</b><span>Last update</span><b>${esc(r.updatedAtText||r.updatedAtIso||'—')}</b></div>${changePreview(r,true)}${historyTimeline(r,true)}<button class="grc-risk-details-btn" onclick="window._grcRiskShowDetails('${esc(r.id)}')">View Request Details</button>${actions(r)}</article>`;
  }
  function activeApprovalTab(){var el=document.querySelector('[data-grc-risk-tab].active');return el&&el.dataset?el.dataset.grcRiskTab||'all':'all';}
  function filteredRisk(tab){var base=isManager()?cache.filter(managerDepartmentRequest):cache;return base.filter(function(r){if(tab==='all')return true;if(tab==='action')return actionable(r);if(tab==='published')return r.status==='published';if(tab==='returned')return /^returned|^rejected/.test(r.status);return r.status===tab;});}
  function filteredReview(tab){if(isManager()&&['all','action'].indexOf(tab)>=0)return reviewApprovalRows.filter(reviewManagerRequest);if(isSuper()&&['all','action'].indexOf(tab)>=0)return reviewApprovalRows.filter(function(r){return String(r&&r.workflowStage||r&&r.status||'').toLowerCase()==='pending_super_admin';});return[];}
  function reviewReturnFieldsHtml(id){
    var fs=[['requestType','Request Type'],['category','Item / Record Type'],['relatedType','Related Record'],['relatedNewText','Proposed Item'],['title','Request Title'],['details','Request Details'],['priority','Priority'],['attachments','Attachments / Evidence']];
    return '<div class="grc-risk-inline-fields"><div class="grc-risk-inline-label">Fields to be corrected *</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">'+fs.map(function(f){return '<label style="display:flex;align-items:center;gap:6px;padding:7px 8px;border:1px solid #dce7eb;border-radius:8px;background:#fff;font-size:9px;color:#405a6a"><input type="checkbox" data-review-return-field="'+esc(f[0])+'"><span>'+esc(f[1])+'</span></label>';}).join('')+'</div></div>';
  }
  function reviewManagerActionPanel(id,action,btn){
    var cardEl=btn&&btn.closest?btn.closest('.grc-risk-request-card'):null;if(!cardEl)return;
    var panel=cardEl.querySelector('.grc-review-manager-panel');if(!panel)return;
    var needNote=action!=='approve',fields=action==='return'?reviewReturnFieldsHtml(id):'';
    panel.hidden=false;
    panel.innerHTML=(action==='return'?fields:'')+
      (needNote?'<label class="grc-risk-inline-label">'+(action==='reject'?'Rejection reason *':'Return note *')+'</label><textarea class="grc-risk-inline-textarea" rows="3" placeholder="Enter the note here..."></textarea>':'')+
      '<div class="grc-risk-inline-error"></div><div class="grc-risk-inline-buttons"><button type="button" class="grc-risk-inline-confirm '+(action==='reject'?'bad':action==='return'?'warn':'good')+'" onclick="window._grcReviewManagerSubmit(\''+esc(id)+'\',\''+esc(action)+'\',this)">'+(action==='approve'?'Approve to Super Admin':action==='return'?'Return to Requester':'Reject')+'</button><button type="button" class="grc-risk-inline-cancel" onclick="this.closest(\'.grc-review-manager-panel\').hidden=true">Cancel</button></div>';
  }
  window._grcReviewManagerSubmit=async function(id,action,btn){
    var panel=btn&&btn.closest?btn.closest('.grc-review-manager-panel'):null;if(!panel)return;
    var note=String((panel.querySelector('textarea')||{}).value||'').trim(),fields=Array.prototype.slice.call(panel.querySelectorAll('[data-review-return-field]:checked')).map(function(x){return x.getAttribute('data-review-return-field');}),err=panel.querySelector('.grc-risk-inline-error');
    if(action!=='approve'&&!note){if(err)err.textContent=action==='reject'?'A rejection reason is required.':'A return note is required.';return;}
    if(action==='return'&&!fields.length){if(err)err.textContent='Select at least one field to be corrected.';return;}
    var old=btn.textContent;btn.disabled=true;btn.textContent=action==='approve'?'Approving…':action==='return'?'Returning…':'Rejecting…';
    try{
      if(typeof window._advisoryManagerAction!=='function')throw new Error('Review & Development manager service is unavailable.');
      await window._advisoryManagerAction(id,action,note,fields);
      if(typeof window._advReload==='function')await window._advReload();
      panel.hidden=true;
    }catch(e){if(err)err.textContent=String(e&&e.message||e);btn.disabled=false;btn.textContent=old;}
  };
  window._grcReviewManagerPanel=function(id,action,btn){reviewManagerActionPanel(id,action,btn);};
  function reviewProfileCard(r){
    var details=String(r.details||r.title||r.relatedNewText||r.category||r.relatedType||'').trim();
    return `<article class="grc-risk-request-card"><div class="grc-risk-card-head"><div><strong>${esc(r.code||r.id)}</strong><small>${esc(isAr()?'مراجعة وتطوير':'Review & Development')} · ${esc(reviewTypeText(r))}</small></div><span class="grc-risk-status warn">${esc(isAr()?'بانتظار موافقة مدير القسم':'Pending Department Manager Approval')}</span></div><div class="grc-risk-card-grid"><span>${esc(isAr()?'نوع العنصر':'Item Type')}</span><b>${esc(r.category||r.relatedType||r.requestTypeLabel||'—')}</b><span>${esc(isAr()?'السجل المرتبط':'Related Record')}</span><b>${esc(reviewRelatedText(r)||r.relatedNewText||'—')}</b><span>${esc(isAr()?'مقدم الطلب':'Submitted by')}</span><b>${esc(r.userName||r.userEmail||'—')}</b><span>${esc(isAr()?'تاريخ الإرسال':'Submitted')}</span><b>${esc(reviewDateText(r))}</b><span>${esc(isAr()?'الأولوية':'Priority')}</span><b>${esc(r.priority||'—')}</b></div><div style="margin-top:9px;padding:9px 10px;border:1px solid #e1ebef;border-radius:9px;background:#f8fbfc"><div style="font-size:9px;font-weight:850;color:#5b7180;margin-bottom:4px">${esc(isAr()?'تفاصيل الطلب':'Request Details')}</div><div style="font-size:10px;line-height:1.55;color:#243f50;white-space:pre-wrap">${esc(details||'No request details were stored for this request.')}</div></div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid #e4edf1"><button type="button" class="grc-risk-action good" onclick="window._grcReviewManagerPanel('${esc(r.id)}','approve',this)">Approve to Super Admin</button><button type="button" class="grc-risk-action warn" onclick="window._grcReviewManagerPanel('${esc(r.id)}','return',this)">Return to Requester</button><button type="button" class="grc-risk-action bad" onclick="window._grcReviewManagerPanel('${esc(r.id)}','reject',this)">Reject</button></div><div class="grc-review-manager-panel grc-risk-inline-decision" hidden></div></article>`;
  }
  function renderProfileBody(){
    var body=document.getElementById('_grcRiskProfileBody');if(!body)return;
    if(isManager()){
      var riskRows=cache.filter(managerDepartmentRequest).filter(function(r){return ['pending_manager','returned_manager'].indexOf(String(r.status||'').toLowerCase())>=0;}).sort(function(a,b){return (new Date(b.updatedAtIso||b.createdAtIso||0).getTime()||0)-(new Date(a.updatedAtIso||a.createdAtIso||0).getTime()||0);});
      var reviewRows=reviewApprovalRows.filter(reviewManagerRequest).filter(function(r){return String(r.workflowStage||r.status||'').toLowerCase()==='pending_department_manager';}).sort(function(a,b){return reviewRequestTime(b)-reviewRequestTime(a);});
      var total=riskRows.length+reviewRows.length;
      body.innerHTML=(riskRows.length?'<section class="grc-manager-approval-section"><div class="grc-manager-section-head"><div><h3>Risk & Incident Register Approval Requests</h3><p>Active register changes awaiting your department decision.</p></div><span>'+riskRows.length+'</span></div>'+riskRows.map(function(r){return card(r);}).join('')+'</section>':'<section class="grc-manager-approval-section"><div class="grc-manager-section-head"><div><h3>Risk & Incident Register Approval Requests</h3><p>Active register changes awaiting your department decision.</p></div><span>0</span></div><div class="grc-risk-empty">No pending Risk or Incident requests.</div></section>')+
      (reviewRows.length?'<section class="grc-manager-approval-section"><div class="grc-manager-section-head"><div><h3>Review & Development Approval Requests</h3><p>Active review and development requests awaiting your department decision.</p></div><span>'+reviewRows.length+'</span></div>'+reviewRows.map(function(r){return reviewProfileCard(r);}).join('')+'</section>':'<section class="grc-manager-approval-section"><div class="grc-manager-section-head"><div><h3>Review & Development Approval Requests</h3><p>Active review and development requests awaiting your department decision.</p></div><span>0</span></div><div class="grc-risk-empty">No pending Review & Development requests.</div></section>');
      var count=document.getElementById('_grcRiskProfileCount');if(count)count.textContent=total+' pending request(s)';
      return;
    }
    var tab=activeApprovalTab(),rows=filteredRisk(tab).map(function(r){return{kind:'risk',row:r,time:new Date(r.updatedAtIso||r.createdAtIso||0).getTime()||0};});
    rows=rows.concat(filteredReview(tab).map(function(r){return{kind:'review',row:r,time:reviewRequestTime(r)};})).sort(function(a,b){return b.time-a.time;});
    body.innerHTML=rows.length?rows.map(function(x){return x.kind==='review'?(isSuper()?reviewSuperAdminNoticeCard(x.row):reviewProfileCard(x.row)):card(x.row);}).join(''):'<div class="grc-risk-empty">No Risk or Incident Register requests in this view.</div>';
    var count=document.getElementById('_grcRiskProfileCount');if(count)count.textContent=rows.length+' request(s)';
  }
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
  function systemRequestTerminal(r){return ['approved','rejected'].indexOf(String(r&&r.status||'').toLowerCase())>=0;}
  function ratingStarsMarkup(value){var n=Math.max(0,Math.min(5,Number(value||0)));return'<span class="grc-rating-static">'+('★'.repeat(n))+('☆'.repeat(5-n))+'</span>';}
  function systemRequestRatingHtml(r){
    if(!systemRequestTerminal(r))return'';
    var n=Number(r.rating||0),comment=String(r.ratingComment||'');
    if(n)return'<div class="grc-system-rating-saved"><div><b>Your Rating</b>'+ratingStarsMarkup(n)+'<strong>'+n+' / 5</strong></div>'+(comment?'<p>'+esc(comment)+'</p>':'<p class="muted">No comment provided.</p>')+'</div>';
    if(String(r.userEmail||'').toLowerCase().trim()!==String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim())return'<div class="grc-system-rating-pending">Waiting for requester rating.</div>';
    return'<div class="grc-system-rating" data-grc-system-rating-box="'+esc(r.id)+'" data-rating="0"><div class="grc-system-rating-title">Rate this request</div><div class="grc-system-rating-help">Select the number of stars. A comment is optional.</div><div class="grc-system-rating-stars">'+[1,2,3,4,5].map(function(x){return'<button type="button" data-rating-value="'+x+'" onclick="window._grcSelectSystemRequestRating(\''+esc(r.id)+'\','+x+')" aria-label="'+x+' star rating">★</button>';}).join('')+'</div><div class="grc-system-rating-selected">No rating selected</div><textarea class="grc-system-rating-comment" placeholder="Add a comment (optional)"></textarea><div class="grc-system-rating-error"></div><button type="button" class="grc-system-rating-submit" onclick="window._grcSubmitSystemRequestRating(\''+esc(r.id)+'\',this)">Submit Rating</button></div>';
  }
  window._grcSelectSystemRequestRating=function(id,rating){var box=document.querySelector('[data-grc-system-rating-box="'+CSS.escape(String(id))+'"]');if(!box)return;var n=Math.max(1,Math.min(5,Number(rating||0)));box.dataset.rating=String(n);box.querySelectorAll('[data-rating-value]').forEach(function(btn){var x=Number(btn.getAttribute('data-rating-value')||0);btn.classList.toggle('selected',x<=n);btn.setAttribute('aria-pressed',x<=n?'true':'false');});var label=box.querySelector('.grc-system-rating-selected');if(label)label.textContent='Selected rating: '+n+' out of 5';var err=box.querySelector('.grc-system-rating-error');if(err)err.textContent='';};
  window._grcSubmitSystemRequestRating=function(id,btn){var box=document.querySelector('[data-grc-system-rating-box="'+CSS.escape(String(id))+'"]');if(!box||typeof window._grcRequestsRate!=='function')return;var n=Number(box.dataset.rating||0),err=box.querySelector('.grc-system-rating-error');if(!n){if(err)err.textContent='Select a star rating before submitting.';return;}var comment=String((box.querySelector('.grc-system-rating-comment')||{}).value||'').trim(),old=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='Submitting…';}window._grcRequestsRate(id,n,comment).then(function(){var x=document.getElementById('grcMyReqOv');if(x)x.remove();window._grcShowMyRequests();refreshFeedbackData();}).catch(function(e){if(btn){btn.disabled=false;btn.textContent=old||'Submit Rating';}if(err)err.textContent=String(e&&e.message||e);});};
  window._grcShowMyRequests=function(){
    closeProfileMenu();var old=document.getElementById('grcMyReqOv');if(old)old.remove();var admin=false;
    var ov=document.createElement('div');ov.id='grcMyReqOv';ov.className='qumc-request-overlay qumc-my-requests-overlay';ov.style.cssText='position:fixed;inset:0;z-index:2147483650;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');box.className='qumc-request-card qumc-my-requests-card';box.style.cssText='background:#ffffff;border:1px solid #d7e3e9;border-radius:18px;padding:28px;width:min(760px,100%);max-height:82vh;display:flex;flex-direction:column;gap:16px;box-shadow:0 28px 80px rgba(15,23,42,.28);color:#111827;';
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:14px;font-weight:800;color:#111827">'+'My Requests'+'</div><div style="font-size:10px;color:#64748b;margin-top:2px">'+'Your GRC access, permission and system requests'+'</div></div><div style="display:flex;gap:8px"><button type="button" onclick="document.getElementById(\'grcMyReqOv\').remove();window._grcShowSubmitRequestForm()" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">+ New Request</button><button type="button" onclick="document.getElementById(\'grcMyReqOv\').remove()" style="width:30px;height:30px;background:#f1f5f9;border:1px solid #d7e2ea;border-radius:7px;color:#475569;cursor:pointer;font-size:15px">✕</button></div></div><div id="grcMyReqBody" style="overflow-y:auto;flex:1;min-height:160px;display:flex;align-items:center;justify-content:center"><div style="color:#64748b;font-size:11px">Loading...</div></div>';
    ov.appendChild(box);document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
    var api=window._grcRequestsGetMine;if(typeof api!=='function'){document.getElementById('grcMyReqBody').innerHTML='<div style="color:#DC2626;font-size:11px">GRC requests are not available.</div>';return;}
    api().then(function(rows){var body=document.getElementById('grcMyReqBody');if(!body)return;if(!rows||!rows.length){body.innerHTML='<div style="color:#64748b;font-size:11px;text-align:center;padding:32px">No GRC requests have been submitted.</div>';return;}body.style.display='block';body.innerHTML='<div style="display:flex;flex-direction:column;gap:10px;padding:2px">'+rows.map(function(r){var color=requestStatusColor(r.status),date=typeof window._fmtTs==='function'?window._fmtTs(r.createdAt):'—';return '<div style="background:#ffffff;border:1px solid #dce6eb;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;font-weight:800;color:#111827">'+esc(r.requestType||'—')+'</span><span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:'+color+'22;color:'+color+'">'+esc(requestStatus(r.status))+'</span></div><span style="font-size:9px;color:#475569;white-space:nowrap">'+esc(date)+'</span></div>'+(admin?'<div style="font-size:9px;color:#64748b">'+esc(r.userName||r.userEmail||'—')+' · '+esc(r.department||'—')+'</div>':'')+'<div style="font-size:10.5px;color:#334155;line-height:1.5">'+esc(r.message||'')+'</div>'+(r.adminComment?'<div style="background:rgba(1,149,175,.08);border:1px solid rgba(1,149,175,.2);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:3px">Admin Response:</div><div style="font-size:10.5px;color:#111827">'+esc(r.adminComment)+'</div></div>':(r.status==='pending'?'<div style="font-size:9px;color:#475569;font-style:italic">Awaiting response...</div>':''))+systemRequestRatingHtml(r)+(admin?'<div style="display:flex;gap:7px;justify-content:flex-end"><button type="button" onclick="window._grcRespondSystemRequest(\''+esc(r.id)+'\',\'approved\')" style="border:0;border-radius:8px;padding:7px 11px;background:#166534;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Approve / Respond</button><button type="button" onclick="window._grcRespondSystemRequest(\''+esc(r.id)+'\',\'rejected\',this)" style="border:0;border-radius:8px;padding:7px 11px;background:#991b1b;color:#fff;font-size:9px;font-weight:800;cursor:pointer">Reject</button></div>':'')+'</div>';}).join('')+'</div>';}).catch(function(err){var b=document.getElementById('grcMyReqBody');if(b)b.innerHTML='<div style="color:#DC2626;font-size:11px">Error: '+esc(err&&err.message||err)+'</div>';});
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
    var approvalTaskTitle=isManager()?'GRC Approval Requests':'Risk & Incident Registers',approvalTaskSub=isManager()?'Risk, Incident, and Review & Development approvals':'Approval requests and publication status',approvalTaskCount=(isManager()?cache.filter(actionable).length+reviewApprovalRows.filter(reviewManagerRequest).length:cache.filter(actionable).length);
    menu.innerHTML='<div class="qumc-profile-head"><div class="qumc-profile-avatar">'+esc(String(name).charAt(0).toUpperCase())+'</div><div style="min-width:0"><div class="qumc-profile-name">'+esc(name)+'</div><div class="qumc-profile-email">'+esc(email()||'—')+'</div></div></div>'+
      '<div class="qumc-profile-section-title">Profile</div><div class="qumc-profile-grid"><span>Name</span><b>'+esc(name)+'</b><span>Role</span><b>'+esc(role()==='governance_performance_manager'?'Governance & Performance Department Manager':role().replace(/_/g,' '))+'</b><span>Department</span><b>'+esc(dept)+'</b><span>Last Login</span><b>'+esc(last)+'</b></div>'+
      '<div class="grc-profile-task-panel"><div class="grc-profile-task-title">Requests</div>'+
        '<button class="grc-profile-task primary" onclick="window._grcRiskOpenCenterRequest()"><span>＋</span><div><strong>Submit a Request</strong><small>Request GRC access, permission or system support</small></div></button>'+
        '<button class="grc-profile-task" onclick="window._grcRiskOpenCenterRequests()"><span>▤</span><div><strong>My Requests</strong><small>Track GRC system and access requests</small></div></button>'+
        (canAccessRiskIncidentWorkflow()?'<button class="grc-profile-task" onclick="document.getElementById(\'_grcUserProfileMenu\').remove();window._grcRiskOpenProfile()"><span>◇</span><div><strong>'+esc(approvalTaskTitle)+'</strong><small>'+esc(approvalTaskSub)+'</small></div><i id="_grcProfileRiskCount">'+approvalTaskCount+'</i></button>':'')+'</div>'+
      '<button class="qumc-logout-btn grc-profile-logout" onclick="document.getElementById(\'_grcUserProfileMenu\').remove();if(window.qumcLogoutToLogin)window.qumcLogoutToLogin(event);else if(window._doLogout)window._doLogout();" type="button"><svg fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24" width="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg> Logout</button>';
    document.body.appendChild(menu);
  };
  window._grcRiskOpenCenterRequest=openCenterRequest;
  window._grcRiskOpenCenterRequests=openCenterRequests;

  window._grcRiskOpenProfile=function(requestId){if(!canAccessRiskIncidentWorkflow())return;ensureReturnWorkflowStyles();start();var old=document.getElementById('_grcRiskProfileOv');if(old)old.remove();var ov=document.createElement('div');ov.id='_grcRiskProfileOv';ov.className='grc-risk-overlay';var manager=isManager(),title=manager?'GRC Requests Awaiting Your Approval':'Risk & Incident Registers',subtitle=manager?'Review only the active requests assigned to your department. Completed decisions are removed from this queue.':'Additions, updates and deletion requests with the GRC approval workflow.';ov.innerHTML='<div class="grc-risk-dialog wide"><header><div><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div><button onclick="document.getElementById(\'_grcRiskProfileOv\').remove()">×</button></header><div class="grc-risk-profile-summary"><span id="_grcRiskProfileCount">0 request(s)</span>'+(manager?'':'<div class="grc-risk-tabs"><button class="active" data-grc-risk-tab="all">All</button><button data-grc-risk-tab="action">Needs Action</button><button data-grc-risk-tab="returned">Returned / Rejected</button><button data-grc-risk-tab="published">Published</button></div>')+'</div><main id="_grcRiskProfileBody"></main></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});if(!manager)ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(btn){btn.onclick=function(){ov.querySelectorAll('[data-grc-risk-tab]').forEach(function(x){x.classList.remove('active');});btn.classList.add('active');renderProfileBody();};});renderProfileBody();if(requestId)setTimeout(function(){window._grcRiskShowDetails(requestId);},50);};
  window._grcRiskShowDetails=async function(id){
    ensureReturnWorkflowStyles();
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    /* The approval list is an index. Before opening a Manager action dialog,
       re-read the authoritative request so an old queue snapshot can never
       produce a false 'Approve' button or blank record details. */
    if(isManager()&&typeof window._grcRiskRequestGetManagerOne==='function'){
      try{
        r=await window._grcRiskRequestGetManagerOne(id);
        var idx=cache.findIndex(function(x){return String(x.id)===String(id);});
        if(idx>=0)cache[idx]=r;else cache.push(r);
        window.__grcRiskRequestCache=cache;
      }catch(e){
        cache=cache.filter(function(x){return String(x.id)!==String(id);});
        window.__grcRiskRequestCache=cache;
        var profile=document.getElementById('_grcRiskProfileOv');if(profile)renderProfileBody();
        if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();
        refreshBadge();
        var msg=String(e&&e.message||e||'This request is no longer pending.');
        var existing=document.getElementById('_grcRiskDetailsOv');if(existing)existing.remove();
        var errOv=document.createElement('div');errOv.id='_grcRiskDetailsOv';errOv.className='grc-risk-overlay inner';
        errOv.innerHTML='<div class="grc-risk-dialog"><header><div><h2>Request no longer pending</h2><p>Department Manager Approval</p></div><button onclick="document.getElementById(\'_grcRiskDetailsOv\').remove()">×</button></header><main><div class="grc-risk-inline-decision bad" style="display:block"><div class="grc-risk-inline-title">Approval list refreshed</div><div class="grc-risk-inline-copy">'+esc(msg)+'</div></div></main></div>';
        document.body.appendChild(errOv);
        return;
      }
    }
    var old=document.getElementById('_grcRiskDetailsOv');if(old)old.remove();
    var ov=document.createElement('div');ov.id='_grcRiskDetailsOv';ov.className='grc-risk-overlay inner';
    var content=r.operation==='update'?changedTable(r):'<table class="grc-risk-record-table"><tbody>'+fieldRows(r.operation==='delete'?r.currentRecord:r.proposedRecord,recordType(r))+'</tbody></table>';
    ov.innerHTML=`<div class="grc-risk-dialog"><header><div><h2>${esc(r.requestCode||r.id)}</h2><p>${esc(operationLabel(r.operation,r))} · ${esc(statusLabel(r.status))}</p></div><button onclick="document.getElementById(\'_grcRiskDetailsOv\').remove()">×</button></header><main>${content}${r.deleteReason?'<div class="grc-risk-note"><b>Deletion reason</b>'+esc(r.deleteReason)+'</div>':''}${requestedFieldsHtml(r)}${historyTimeline(r,false)}${actions(r)}</main></div>`;
    document.body.appendChild(ov);
  };
  function decisionCopy(r,action){
    if(action==='manager_return'){var whoEn=submitterLabel(r),whoAr=whoEn;if(isAr()){var role=String(r&&r.submittedByRole||'').toLowerCase().trim();whoAr=SUBMITTER_ROLE_LABELS_AR[role]||'مقدم الطلب';}return {tone:'warn',title:isAr()?'إعادة إلى '+whoAr:'Return to '+whoEn,text:isAr()?'حدد الحقول المطلوب تعديلها واكتب ملاحظة واضحة. سيعود نفس الطلب إلى '+whoAr+'.':'Select the fields that must be corrected and add a clear note. The same request will return to the '+whoEn+'.',label:isAr()?'ملاحظة الإعادة *':'Return note *',confirm:isAr()?'إعادة لـ '+whoAr:'Return to '+whoEn,needNote:true,showFields:true,fieldsRequired:true};}
    if(action==='super_return')return {tone:'warn',title:isAr()?'إعادة إلى مدير القسم':'Return to Department Manager',text:isAr()?'اكتب ملاحظة لمدير القسم. ويمكنك تحديد الحقول التي تحتاج مراجعة.':'A note to the Department Manager is required. You may also identify the fields that need review.',label:isAr()?'ملاحظة مدير القسم *':'Note to Department Manager *',confirm:isAr()?'إعادة لمدير القسم':'Return to Department Manager',needNote:true,showFields:true,fieldsRequired:false};
    if(action==='manager_resend')return {tone:'good',title:isAr()?'إعادة الإرسال للسوبر أدمن':'Resend to Super Admin',text:isAr()?'اكتب ملاحظة توضح سبب إعادة الإرسال للسوبر أدمن.':'Add a note before resending the same request to Super Admin.',label:isAr()?'ملاحظة إعادة الإرسال *':'Resubmission note *',confirm:isAr()?'إعادة الإرسال':'Resend to Super Admin',needNote:true};
    if(/reject/.test(action))return {tone:'bad',title:isAr()?'رفض الطلب':'Reject Request',text:isAr()?'سبب الرفض إلزامي.':'A rejection reason is required.',label:isAr()?'سبب الرفض *':'Rejection reason *',confirm:isAr()?'تأكيد الرفض':'Confirm Reject',needNote:true};
    if(action==='cancel')return {tone:'bad',title:isAr()?'إلغاء الطلب':'Cancel Request',text:isAr()?'هل تريد إلغاء هذا الطلب؟':'Cancel this request?',confirm:isAr()?'تأكيد الإلغاء':'Confirm Cancel',needNote:false};
    if(action==='super_approve')return {tone:'good',title:isAr()?'اعتماد ونشر الطلب':'Approve & Publish',text:(isAr()?'سيتم اعتماد هذا التغيير ونشره مباشرة في سجل ':'Approve and publish this change directly in the ')+(recordLabel(r))+(isAr()?'؟':' Register?'),confirm:isAr()?'اعتماد ونشر':'Approve & Publish',needNote:false};
    return {tone:'good',title:isAr()?'اعتماد الطلب':'Approve',text:isAr()?'سيتم إرسال الطلب للسوبر أدمن.':'Approve and send this request to Super Admin?',confirm:isAr()?'اعتماد':'Approve',needNote:false};
  }
  function decisionPanelFromButton(btn){var actions=btn&&btn.closest&&btn.closest('.grc-risk-request-actions');if(!actions)return null;var panel=actions.nextElementSibling;return panel&&panel.classList&&panel.classList.contains('grc-risk-inline-decision')?panel:null;}
  window._grcRiskCloseDecision=function(btn){var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;panel.hidden=true;panel.innerHTML='';panel.className='grc-risk-inline-decision';};
  window._grcRiskDecision=function(id,action,btn){
    ensureReturnWorkflowStyles();
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=decisionPanelFromButton(btn);if(!panel)return;
    var c=decisionCopy(r,action),fields=c.showFields?returnFieldSelectorHtml(r,!!c.fieldsRequired):'',note=c.needNote?'<label class="grc-risk-inline-label">'+esc(c.label)+'</label><textarea class="grc-risk-inline-textarea" rows="3" placeholder="'+esc(isAr()?'اكتب الملاحظة هنا...':'Enter the note here...')+'"></textarea>':'';
    panel.hidden=false;panel.className='grc-risk-inline-decision '+c.tone;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(c.title)+'</div><div class="grc-risk-inline-copy">'+esc(c.text)+'</div>'+fields+note+'<div class="grc-risk-inline-error" aria-live="polite"></div><div class="grc-risk-inline-buttons"><button type="button" class="grc-risk-inline-confirm '+c.tone+'" onclick="window._grcRiskSubmitDecision(\''+esc(id)+'\',\''+esc(action)+'\',this)">'+esc(c.confirm)+'</button><button type="button" class="grc-risk-inline-cancel" onclick="window._grcRiskCloseDecision(this)">'+esc(isAr()?'إلغاء':'Cancel')+'</button></div>';
    var ta=panel.querySelector('textarea');if(ta)setTimeout(function(){ta.focus();},30);
  };
  window._grcRiskSubmitDecision=async function(id,action,btn){
    var r=cache.find(function(x){return String(x.id)===String(id);});if(!r)return;
    var panel=btn&&btn.closest&&btn.closest('.grc-risk-inline-decision');if(!panel)return;
    var errEl=panel.querySelector('.grc-risk-inline-error'),ta=panel.querySelector('textarea'),note=ta?String(ta.value||'').trim():'',fields=Array.prototype.map.call(panel.querySelectorAll('[data-grc-return-field]:checked'),function(x){return x.value;});
    if((/return|reject/.test(action)||action==='manager_resend')&&!note){if(ta)ta.classList.add('is-invalid');if(errEl)errEl.textContent=isAr()?'الملاحظة مطلوبة قبل تنفيذ هذا الإجراء.':'A note is required before this action can be submitted.';return;}
    if(action==='manager_return'&&!fields.length){if(errEl)errEl.textContent=isAr()?'حدد حقلًا واحدًا على الأقل يحتاج تعديل.':'Select at least one field that needs correction.';return;}
    if(ta)ta.classList.remove('is-invalid');if(errEl)errEl.textContent='';
    Array.prototype.forEach.call(panel.querySelectorAll('button,textarea,input'),function(el){el.disabled=true;});panel.classList.add('is-busy');
    try{
      if(action==='manager_approve')await window._grcRiskRequestManagerAction(id,'approve','',[]);
      else if(action==='manager_resend')await window._grcRiskRequestManagerAction(id,'resend',note,[]);
      else if(action==='manager_return')await window._grcRiskRequestManagerAction(id,'return',note,fields);
      else if(action==='manager_reject')await window._grcRiskRequestManagerAction(id,'reject',note,[]);
      else if(action==='super_approve')await window._grcRiskRequestSuperAction(id,'approve','',[]);
      else if(action==='super_return')await window._grcRiskRequestSuperAction(id,'return',note,fields);
      else if(action==='super_reject')await window._grcRiskRequestSuperAction(id,'reject',note,[]);
      else if(action==='cancel')await window._grcRiskRequestCancel(id);
      if(isManager()&&(action==='manager_approve'||action==='manager_return'||action==='manager_reject'||action==='manager_resend')){
        cache=cache.filter(function(x){return String(x.id)!==String(id);});
        window.__grcRiskRequestCache=cache;
      }
      panel.className='grc-risk-inline-decision success';panel.hidden=false;panel.innerHTML='<div class="grc-risk-inline-title">'+esc(isAr()?'تم تنفيذ الإجراء':'Action completed')+'</div><div class="grc-risk-inline-copy">'+esc(isAr()?'تم حفظ القرار وإزالة الطلب من قائمة الموافقات الحالية.':'The decision was saved and the request was removed from the current approval queue.')+'</div>';
      setTimeout(function(){var d=document.getElementById('_grcRiskDetailsOv');if(d)d.remove();if(document.getElementById('_grcRiskProfileOv'))renderProfileBody();if(document.getElementById('_grcApprovalNoticeOv'))renderApprovalNoticeBody();refreshBadge();},350);
    }catch(err){panel.classList.remove('is-busy');Array.prototype.forEach.call(panel.querySelectorAll('button,textarea,input'),function(el){el.disabled=false;});if(errEl)errEl.textContent=String(err&&err.message||err||'Unable to complete the action.');}
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
