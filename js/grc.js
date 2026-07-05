/* ======================================================================
   QUMC GRC WORKSPACE — Super Admin Preview
   - Super Admin only; all other roles receive a Coming Soon screen.
   - Horizontal module tabs, matching the Performance navigation concept.
   - Preview records are stored in localStorage until Firestore workflow is
     approved and connected in the next implementation phase.
   ====================================================================== */
(function(){
  'use strict';

  var STORAGE_KEY='qumc_grc_workspace_preview_v1';
  var activeTab='executive';
  var app=null;

  var labels={
    en:{
      app:'Governance, Risk & Compliance', sub:'Facilities & Safety Division · Governance & Performance Department', preview:'Super Admin Preview', back:'Back to Portal', logout:'Logout',
      executive:'Executive Command', governance:'Governance', risk:'Risk Management', compliance:'Compliance', audit:'Audit & Assurance', actions:'Action Plans', documents:'Documents & Records', reports:'Reports & Archive',
      executiveTitle:'GRC Executive Command Center', executiveDesc:'Centralized oversight for governance, risks, compliance obligations, assurance findings and management actions.',
      criticalRisks:'High & Critical Risks', complianceGaps:'Compliance Gaps', pendingApprovals:'Pending Approvals', overdueActions:'Overdue Actions', openFindings:'Open Audit Findings', policiesDue:'Documents Due for Review',
      executiveAttention:'Executive Attention', executiveAttentionSub:'Records that require management intervention or follow-up.', noAttention:'No urgent items yet', noAttentionSub:'High risks, compliance gaps and overdue actions will appear here automatically.',
      moduleCoverage:'GRC Module Coverage', moduleCoverageSub:'Open any area to configure its registers and governance content.', roadmap:'Implementation Roadmap', roadmapSub:'Suggested staged rollout for the GRC module.',
      phase1:'Phase 1', phase2:'Phase 2', phase3:'Phase 3', current:'Current', next:'Next', later:'Later',
      phase1Text:'Super Admin structure, registers and document catalog', phase2Text:'Approval workflows, notifications and Firestore integration', phase3Text:'Department access, ownership assignments and reporting',
      governanceTitle:'Governance', governanceDesc:'Organizational oversight, decision rights, committees, approved manuals and controlled governance documents.', addDecision:'Add Decision',
      riskTitle:'Risk Management', riskDesc:'Identify, assess, treat and monitor operational, facility, safety and compliance risks.', addRisk:'Add Risk', heatMap:'Risk Heat Map', heatMapSub:'Likelihood × impact based on registered risks.', riskRegister:'Risk Register',
      complianceTitle:'Compliance', complianceDesc:'Map regulatory obligations, required evidence, compliance status and corrective actions.', addRequirement:'Add Requirement', complianceRegister:'Compliance Register', frameworks:'Regulatory Frameworks',
      auditTitle:'Audit & Assurance', auditDesc:'Track internal audit plans, findings, recommendations, assurance reviews and closure evidence.', addFinding:'Add Finding', auditRegister:'Audit Findings Register',
      actionsTitle:'Action Plans', actionsDesc:'A single register for actions arising from risks, compliance gaps, audits, incidents and management decisions.', addAction:'Add Action', actionRegister:'Central Action Register',
      documentsTitle:'Documents & Records', documentsDesc:'Controlled library for FMS manuals, policies, procedures, approved forms and document lifecycle.', addDocument:'Add Document', documentRegister:'Document Control Register',
      reportsTitle:'Reports & Archive', reportsDesc:'Quarterly, annual and executive reporting with controlled access to historical records.', printPage:'Print Current Page', existingContent:'Existing Content Map', archiveAreas:'Archive & Reporting Areas',
      open:'Open', readySetup:'Ready for setup', planned:'Planned', draftWorkspace:'Draft workspace', localNote:'Preview records are stored on this device only.',
      id:'ID', title:'Title', department:'Department', category:'Category', likelihood:'Likelihood', impact:'Impact', score:'Score', owner:'Owner', dueDate:'Due Date', status:'Status', authority:'Authority / Standard', requirement:'Requirement', source:'Source', progress:'Progress', severity:'Severity', reviewDate:'Review Date', committee:'Committee / Source', actionsCol:'Actions',
      noRecords:'No records added yet', noRecordsSub:'Use the Add button to test the proposed register structure.', cancel:'Cancel', save:'Save Record', delete:'Delete', confirmDelete:'Delete this preview record?', required:'Please complete all required fields.',
      comingTitle:'GRC Module', comingSub:'The Governance, Risk & Compliance workspace is currently being developed and is available to the Super Admin preview only.', comingSoon:'Coming Soon',
      orgStructure:'Organizational Structure', orgStructureDesc:'FMS structure, sections, reporting lines and process ownership.', manuals:'FMS Manuals & Guidelines', manualsDesc:'Approved management manuals, operating guides and governance references.', committees:'Committees & Decisions', committeesDesc:'Committees, minutes, decisions, assignments and follow-up.', authorityMatrix:'Authority & RACI Matrix', authorityMatrixDesc:'Decision rights, accountability and responsibility mapping.', annualPlan:'Annual Operational Plan', annualPlanDesc:'Controlled annual plan, initiatives, owners and milestones.', approvedForms:'Approved Work Forms', approvedFormsDesc:'Central catalog of approved operational templates and forms.',
      cbahi:'CBAHI', moh:'Ministry of Health', civilDefense:'Civil Defense', university:'University Regulations', internal:'Internal Policies', frameworkDesc:'Requirements, evidence and review status.',
      quarterlyReports:'Quarterly Reports', annualReports:'Annual Reports', executiveReports:'Executive Reports', incidentReports:'Incident Reports', historicalArchive:'FMS Archive', regulatoryArchive:'Regulatory & Legislative Framework',
      low:'Low', moderate:'Moderate', high:'High', critical:'Critical',
      fieldTitle:'Title / Description', fieldDepartment:'Responsible Department', fieldCategory:'Category', fieldOwner:'Owner', fieldDue:'Due Date', fieldStatus:'Status', fieldAuthority:'Authority / Standard', fieldRequirement:'Requirement', fieldSource:'Source Record', fieldProgress:'Progress %', fieldSeverity:'Severity', fieldReview:'Next Review Date', fieldCommittee:'Committee / Decision Source',
      maintenance:'Maintenance', safety:'Safety', housekeeping:'Housekeeping', projects:'Project Management', governanceDept:'Governance & Performance', allFms:'FMS Division',
      draft:'Draft', underReview:'Under Review', approved:'Approved', treatment:'Treatment in Progress', closed:'Closed', compliant:'Compliant', partial:'Partially Compliant', nonCompliant:'Non-Compliant', notApplicable:'Not Applicable', openStatus:'Open', inProgress:'In Progress', pendingVerification:'Pending Verification', completed:'Completed', overdue:'Overdue', observation:'Observation', minor:'Minor', moderateSeverity:'Moderate', major:'Major', criticalSeverity:'Critical', active:'Active', expired:'Expired', archived:'Archived', pendingApproval:'Pending Approval',
      governanceDecision:'Governance Decision', riskSource:'Risk', complianceSource:'Compliance Gap', auditSource:'Audit Finding', incidentSource:'Incident', managementSource:'Management Request',
      riskOperational:'Operational', riskFacility:'Facility', riskSafety:'Safety', riskCompliance:'Compliance', riskContractor:'Contractor', riskEmergency:'Emergency Preparedness',
      docManual:'Manual / Guideline', docPolicy:'Policy', docProcedure:'Procedure', docForm:'Approved Form', docReport:'Report', docPlan:'Operational Plan', docArchive:'Archived Record'
    },
    ar:{
      app:'الحوكمة والمخاطر والالتزام', sub:'إدارة المرافق والسلامة · قسم الحوكمة والأداء', preview:'معاينة السوبر أدمن', back:'العودة للبوابة', logout:'تسجيل الخروج',
      executive:'القيادة التنفيذية', governance:'الحوكمة', risk:'إدارة المخاطر', compliance:'الالتزام', audit:'التدقيق والتوكيد', actions:'خطط العمل', documents:'الوثائق والسجلات', reports:'التقارير والأرشيف',
      executiveTitle:'مركز القيادة التنفيذي لـ GRC', executiveDesc:'إشراف موحد على الحوكمة والمخاطر ومتطلبات الالتزام وملاحظات التدقيق وخطط العمل الإدارية.',
      criticalRisks:'المخاطر العالية والحرجة', complianceGaps:'فجوات الالتزام', pendingApprovals:'الموافقات المعلقة', overdueActions:'الإجراءات المتأخرة', openFindings:'ملاحظات التدقيق المفتوحة', policiesDue:'وثائق مستحقة للمراجعة',
      executiveAttention:'تدخل الإدارة التنفيذية', executiveAttentionSub:'السجلات التي تحتاج إلى تدخل أو متابعة إدارية.', noAttention:'لا توجد عناصر عاجلة حالياً', noAttentionSub:'ستظهر هنا المخاطر العالية وفجوات الالتزام والإجراءات المتأخرة تلقائياً.',
      moduleCoverage:'نطاق وحدات GRC', moduleCoverageSub:'افتح أي قسم لإعداد سجلاته ومحتواه التنظيمي.', roadmap:'خارطة طريق التنفيذ', roadmapSub:'مراحل الإطلاق المقترحة لقسم GRC.',
      phase1:'المرحلة الأولى', phase2:'المرحلة الثانية', phase3:'المرحلة الثالثة', current:'الحالية', next:'التالية', later:'لاحقاً',
      phase1Text:'هيكل السوبر أدمن والسجلات وفهرس الوثائق', phase2Text:'مسارات الاعتماد والإشعارات والربط مع Firestore', phase3Text:'صلاحيات الأقسام وتعيين الملاك والتقارير',
      governanceTitle:'الحوكمة', governanceDesc:'الإشراف التنظيمي والصلاحيات واللجان والأدلة المعتمدة والوثائق الخاضعة للضبط.', addDecision:'إضافة قرار',
      riskTitle:'إدارة المخاطر', riskDesc:'تحديد وتقييم ومعالجة ومتابعة المخاطر التشغيلية ومخاطر المرافق والسلامة والالتزام.', addRisk:'إضافة مخاطرة', heatMap:'خريطة المخاطر', heatMapSub:'الاحتمالية × الأثر حسب المخاطر المسجلة.', riskRegister:'سجل المخاطر',
      complianceTitle:'الالتزام', complianceDesc:'ربط المتطلبات التنظيمية بالأدلة وحالة الالتزام والإجراءات التصحيحية.', addRequirement:'إضافة متطلب', complianceRegister:'سجل الالتزام', frameworks:'الأطر التنظيمية',
      auditTitle:'التدقيق والتوكيد', auditDesc:'متابعة خطط التدقيق الداخلي والملاحظات والتوصيات ومراجعات التوكيد وأدلة الإغلاق.', addFinding:'إضافة ملاحظة', auditRegister:'سجل ملاحظات التدقيق',
      actionsTitle:'خطط العمل', actionsDesc:'سجل موحد للإجراءات الناتجة عن المخاطر وفجوات الالتزام والتدقيق والحوادث وقرارات الإدارة.', addAction:'إضافة إجراء', actionRegister:'سجل الإجراءات الموحد',
      documentsTitle:'الوثائق والسجلات', documentsDesc:'مكتبة مضبوطة لأدلة الإدارة والسياسات والإجراءات والنماذج المعتمدة ودورة حياة الوثيقة.', addDocument:'إضافة وثيقة', documentRegister:'سجل ضبط الوثائق',
      reportsTitle:'التقارير والأرشيف', reportsDesc:'تقارير ربعية وسنوية وتنفيذية مع وصول منظم للسجلات التاريخية.', printPage:'طباعة الصفحة الحالية', existingContent:'خريطة المحتوى الحالي', archiveAreas:'مجالات التقارير والأرشيف',
      open:'فتح', readySetup:'جاهز للإعداد', planned:'مخطط', draftWorkspace:'مساحة عمل أولية', localNote:'بيانات المعاينة محفوظة على هذا الجهاز فقط.',
      id:'المعرّف', title:'العنوان', department:'القسم', category:'التصنيف', likelihood:'الاحتمالية', impact:'الأثر', score:'الدرجة', owner:'المالك', dueDate:'تاريخ الاستحقاق', status:'الحالة', authority:'الجهة / المعيار', requirement:'المتطلب', source:'المصدر', progress:'الإنجاز', severity:'الخطورة', reviewDate:'تاريخ المراجعة', committee:'اللجنة / المصدر', actionsCol:'الإجراءات',
      noRecords:'لا توجد سجلات مضافة', noRecordsSub:'استخدمي زر الإضافة لتجربة هيكل السجل المقترح.', cancel:'إلغاء', save:'حفظ السجل', delete:'حذف', confirmDelete:'هل تريدين حذف سجل المعاينة؟', required:'يرجى تعبئة جميع الحقول المطلوبة.',
      comingTitle:'قسم GRC', comingSub:'قسم الحوكمة والمخاطر والالتزام قيد التطوير ومتاح حالياً لمعاينة السوبر أدمن فقط.', comingSoon:'قريباً',
      orgStructure:'الهيكل التنظيمي', orgStructureDesc:'هيكل إدارة المرافق والسلامة والأقسام وخطوط الإشراف وملاك العمليات.', manuals:'أدلة إدارة المرافق والسلامة', manualsDesc:'الأدلة الإدارية والتشغيلية والمراجع التنظيمية المعتمدة.', committees:'اللجان والقرارات', committeesDesc:'اللجان والمحاضر والقرارات والتكليفات والمتابعة.', authorityMatrix:'مصفوفة الصلاحيات وRACI', authorityMatrixDesc:'صلاحيات اتخاذ القرار وتوزيع المسؤوليات والمساءلة.', annualPlan:'الخطة التشغيلية السنوية', annualPlanDesc:'الخطة السنوية والمبادرات والملاك والمراحل الرئيسية.', approvedForms:'نماذج العمل المعتمدة', approvedFormsDesc:'فهرس مركزي للنماذج والقوالب التشغيلية المعتمدة.',
      cbahi:'سباهي CBAHI', moh:'وزارة الصحة', civilDefense:'الدفاع المدني', university:'لوائح الجامعة', internal:'السياسات الداخلية', frameworkDesc:'المتطلبات والأدلة وحالة المراجعة.',
      quarterlyReports:'التقارير الربعية', annualReports:'التقارير السنوية', executiveReports:'التقارير التنفيذية', incidentReports:'تقارير الحوادث', historicalArchive:'أرشيف إدارة المرافق والسلامة', regulatoryArchive:'الأطر التنظيمية والتشريعية',
      low:'منخفض', moderate:'متوسط', high:'عالٍ', critical:'حرج',
      fieldTitle:'العنوان / الوصف', fieldDepartment:'القسم المسؤول', fieldCategory:'التصنيف', fieldOwner:'المالك', fieldDue:'تاريخ الاستحقاق', fieldStatus:'الحالة', fieldAuthority:'الجهة / المعيار', fieldRequirement:'المتطلب', fieldSource:'السجل المصدر', fieldProgress:'نسبة الإنجاز %', fieldSeverity:'مستوى الخطورة', fieldReview:'تاريخ المراجعة القادمة', fieldCommittee:'اللجنة / مصدر القرار',
      maintenance:'الصيانة', safety:'السلامة', housekeeping:'النظافة', projects:'إدارة المشاريع', governanceDept:'الحوكمة والأداء', allFms:'إدارة المرافق والسلامة',
      draft:'مسودة', underReview:'تحت المراجعة', approved:'معتمد', treatment:'المعالجة جارية', closed:'مغلق', compliant:'ملتزم', partial:'ملتزم جزئياً', nonCompliant:'غير ملتزم', notApplicable:'لا ينطبق', openStatus:'مفتوح', inProgress:'قيد التنفيذ', pendingVerification:'بانتظار التحقق', completed:'مكتمل', overdue:'متأخر', observation:'ملاحظة', minor:'بسيط', moderateSeverity:'متوسط', major:'جوهري', criticalSeverity:'حرج', active:'ساري', expired:'منتهي', archived:'مؤرشف', pendingApproval:'بانتظار الاعتماد',
      governanceDecision:'قرار حوكمة', riskSource:'مخاطرة', complianceSource:'فجوة التزام', auditSource:'ملاحظة تدقيق', incidentSource:'حادث', managementSource:'طلب إداري',
      riskOperational:'تشغيلي', riskFacility:'مرافق', riskSafety:'سلامة', riskCompliance:'التزام', riskContractor:'مقاولون', riskEmergency:'الاستعداد للطوارئ',
      docManual:'دليل / إرشاد', docPolicy:'سياسة', docProcedure:'إجراء', docForm:'نموذج معتمد', docReport:'تقرير', docPlan:'خطة تشغيلية', docArchive:'سجل مؤرشف'
    }
  };

  var modules=[
    {id:'executive',icon:'⌂',count:null},
    {id:'governance',icon:'▦',count:'decisions'},
    {id:'risk',icon:'◇',count:'risks'},
    {id:'compliance',icon:'✓',count:'compliance'},
    {id:'audit',icon:'◎',count:'audits'},
    {id:'actions',icon:'→',count:'actions'},
    {id:'documents',icon:'▤',count:'documents'},
    {id:'reports',icon:'▥',count:null}
  ];

  var starterDocuments=[
    {id:'DOC-001',titleEn:'Facilities & Safety Management Manuals',titleAr:'أدلة إدارة المرافق والسلامة',category:'manual',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-002',titleEn:'Facilities & Safety Archive',titleAr:'أرشيف إدارة المرافق والسلامة',category:'archive',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-003',titleEn:'Regulatory & Legislative Framework',titleAr:'الأطر التنظيمية والتشريعية لإدارة المرافق والسلامة',category:'policy',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-004',titleEn:'Quarterly Reports',titleAr:'التقارير الربعية',category:'report',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-005',titleEn:'Annual Reports',titleAr:'التقارير السنوية',category:'report',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-006',titleEn:'Annual Operational Plan',titleAr:'الخطة التشغيلية السنوية',category:'plan',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-007',titleEn:'FMS Organizational Structure',titleAr:'الهيكل التنظيمي لإدارة المرافق والسلامة وأقسامها',category:'manual',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-008',titleEn:'Incident Register & Reports',titleAr:'سجل وتقارير الحوادث',category:'report',owner:'Safety',reviewDate:'',status:'planned',starter:true},
    {id:'DOC-009',titleEn:'Approved Work Forms',titleAr:'نماذج العمل المعتمدة',category:'form',owner:'Governance & Performance',reviewDate:'',status:'planned',starter:true}
  ];

  function defaultState(){return{version:1,risks:[],compliance:[],actions:[],audits:[],decisions:[],documents:starterDocuments.slice(),updatedAt:new Date().toISOString()};}
  function loadState(){
    try{
      var x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!x||typeof x!=='object')return defaultState();
      ['risks','compliance','actions','audits','decisions','documents'].forEach(function(k){if(!Array.isArray(x[k]))x[k]=[];});
      if(!x.documents.length)x.documents=starterDocuments.slice();
      return x;
    }catch(_){return defaultState();}
  }
  var state=loadState();
  function saveState(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}render();}

  function isAr(){return (typeof window.lang!=='undefined'?window.lang:(document.documentElement.dir==='rtl'?'ar':'en'))==='ar';}
  function normalizedRole(){var r=String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');return r==='superadmin'?'super_admin':r;}
  function L(key){var lang=isAr()?'ar':'en';return (labels[lang]&&labels[lang][key])||(labels.en[key])||key;}
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function dateText(v){if(!v)return'—';try{return new Intl.DateTimeFormat(isAr()?'ar-SA':'en-GB',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v+'T00:00:00'));}catch(_){return v;}}
  function recordTitle(r){return isAr()?(r.titleAr||r.title||r.requirementAr||r.requirement||r.findingAr||r.finding||r.descriptionAr||r.description):(r.titleEn||r.title||r.requirementEn||r.requirement||r.findingEn||r.finding||r.descriptionEn||r.description)||'—';}
  function currentName(){return String(window._fbName||window.currentUserName||(window._fbUser||'').split('@')[0]||'Super Admin');}
  function roleText(){return normalizedRole()==='super_admin'?'Super Admin':String(window._fbRole||window.currentUserRole||'');}
  function countFor(k){return Array.isArray(state[k])?state[k].length:0;}
  function isOverdue(r){return !!(r&&r.dueDate&&new Date(r.dueDate+'T23:59:59')<new Date()&&!['completed','closed','compliant','archived'].includes(r.status));}
  function riskScore(r){return Number(r.likelihood||0)*Number(r.impact||0);}
  function riskBand(score){return score>=15?'critical':score>=10?'high':score>=5?'moderate':'low';}
  function riskBandLabel(score){return L(riskBand(score));}
  function metrics(){
    var high=state.risks.filter(function(r){return riskScore(r)>=10&&r.status!=='closed';}).length;
    var gaps=state.compliance.filter(function(r){return ['partial','nonCompliant'].includes(r.status);}).length;
    var pending=[].concat(state.risks,state.compliance,state.audits,state.decisions,state.documents).filter(function(r){return ['underReview','pendingApproval','pendingVerification'].includes(r.status);}).length;
    var overdue=state.actions.filter(isOverdue).length;
    var findings=state.audits.filter(function(r){return !['closed','completed'].includes(r.status);}).length;
    var soon=state.documents.filter(function(r){if(!r.reviewDate||['archived','planned'].includes(r.status))return false;var d=new Date(r.reviewDate+'T23:59:59')-new Date();return d<=60*86400000;}).length;
    return{high:high,gaps:gaps,pending:pending,overdue:overdue,findings:findings,soon:soon};
  }

  function badge(status){
    var cls='neutral';
    if(['approved','compliant','completed','closed','active'].includes(status))cls='good';
    else if(['underReview','partial','inProgress','pendingVerification','pendingApproval','treatment'].includes(status))cls='warn';
    else if(['nonCompliant','overdue','expired','critical'].includes(status))cls='bad';
    else if(['open','major','moderateSeverity'].includes(status))cls='info';
    return'<span class="grc-badge '+cls+'">'+esc(L(status)||status)+'</span>';
  }
  function emptyRow(cols){return'<tr><td colspan="'+cols+'"><div class="grc-empty"><div class="grc-empty-icon">＋</div><div class="grc-empty-title">'+L('noRecords')+'</div><div class="grc-empty-sub">'+L('noRecordsSub')+'</div></div></td></tr>';}
  function delBtn(type,id){return'<button class="grc-icon-btn danger" title="'+L('delete')+'" onclick="window._grcDelete(\''+type+'\',\''+esc(id)+'\')">×</button>';}

  function ensureApp(){
    app=document.getElementById('grcApp');
    if(app)return app;
    app=document.createElement('section');
    app.id='grcApp';
    app.setAttribute('aria-hidden','true');
    document.body.appendChild(app);
    return app;
  }

  function logoSrc(){var img=document.getElementById('logoImg');return img&&img.src?img.src:'';}
  function shellHtml(){
    var m=metrics();
    return '<header class="grc-topbar">'+
      '<div class="grc-brand"><div class="grc-logo"><img id="grcLogo" alt="QUMC" src="'+esc(logoSrc())+'"></div><div><div class="grc-brand-title">'+L('app')+'</div><div class="grc-brand-sub">'+L('sub')+'</div></div></div>'+
      '<div class="grc-preview-pill"><span class="grc-preview-dot"></span>'+L('preview')+'</div><div class="grc-top-space"></div>'+
      '<button class="grc-top-btn" onclick="window._grcToggleLang()">'+(isAr()?'EN':'عربي')+'</button>'+
      '<div class="grc-user"><div class="grc-user-avatar">'+esc((currentName()[0]||'S').toUpperCase())+'</div><div><div class="grc-user-name">'+esc(currentName())+'</div><div class="grc-user-role">'+esc(roleText())+'</div></div></div>'+
      '<button class="grc-top-btn grc-back" onclick="window._exitGRC()">← '+L('back')+'</button>'+
      '</header>'+
      '<div class="grc-nav-wrap"><nav class="grc-nav">'+modules.map(function(x){var c=x.count?countFor(x.count):null;return'<button class="grc-tab '+(activeTab===x.id?'is-active':'')+'" onclick="window._grcSwitch(\''+x.id+'\')"><span class="grc-tab-icon">'+x.icon+'</span><span>'+L(x.id)+'</span>'+(c!==null?'<span class="grc-tab-count">'+c+'</span>':'')+'</button>';}).join('')+'</nav></div>'+
      '<main class="grc-main">'+modules.map(function(x){return'<section id="grc-page-'+x.id+'" class="grc-page '+(activeTab===x.id?'is-active':'')+'">'+pageHtml(x.id,m)+'</section>';}).join('')+'</main>'+
      '<footer class="grc-footer"><span><strong>QUMC GRC Workspace</strong> · '+L('draftWorkspace')+' · '+L('localNote')+'</span><span class="grc-live"><i></i> Super Admin Preview · © 2026 QUMC</span></footer>';
  }

  function metricCard(label,value,cls,sub){return'<div class="grc-metric '+cls+'"><div class="grc-metric-label">'+label+'</div><div class="grc-metric-value">'+value+'</div><div class="grc-metric-sub">'+sub+'</div></div>';}
  function sectionHero(eye,title,desc,actions){return'<div class="grc-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">'+eye+'</div><h1>'+title+'</h1><p>'+desc+'</p></div><div class="grc-hero-actions">'+(actions||'')+'</div></div></div>';}
  function card(title,sub,body,action){return'<div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+title+'</div>'+(sub?'<div class="grc-card-sub">'+sub+'</div>':'')+'</div>'+(action||'')+'</div><div class="grc-card-body">'+body+'</div></div>';}

  function attentionHtml(){
    var rows=[];
    state.risks.filter(function(r){return riskScore(r)>=10&&r.status!=='closed';}).slice(0,3).forEach(function(r){rows.push('<div class="grc-attention bad"><span class="grc-attention-dot"></span><div><div class="grc-attention-title">'+esc(recordTitle(r))+'</div><div class="grc-attention-sub">'+L('risk')+' · '+riskBandLabel(riskScore(r))+' · '+esc(r.department||'—')+'</div></div></div>');});
    state.compliance.filter(function(r){return ['partial','nonCompliant'].includes(r.status);}).slice(0,3).forEach(function(r){rows.push('<div class="grc-attention warn"><span class="grc-attention-dot"></span><div><div class="grc-attention-title">'+esc(recordTitle(r))+'</div><div class="grc-attention-sub">'+L('compliance')+' · '+esc(r.authority||'—')+' · '+L(r.status)+'</div></div></div>');});
    state.actions.filter(isOverdue).slice(0,3).forEach(function(r){rows.push('<div class="grc-attention bad"><span class="grc-attention-dot"></span><div><div class="grc-attention-title">'+esc(recordTitle(r))+'</div><div class="grc-attention-sub">'+L('overdueActions')+' · '+dateText(r.dueDate)+'</div></div></div>');});
    if(!rows.length)return'<div class="grc-empty"><div class="grc-empty-icon">✓</div><div class="grc-empty-title">'+L('noAttention')+'</div><div class="grc-empty-sub">'+L('noAttentionSub')+'</div></div>';
    return'<div class="grc-attention-list">'+rows.slice(0,7).join('')+'</div>';
  }

  function moduleCards(){
    var list=[
      ['governance','▦','governanceTitle','governanceDesc'],['risk','◇','riskTitle','riskDesc'],['compliance','✓','complianceTitle','complianceDesc'],
      ['audit','◎','auditTitle','auditDesc'],['actions','→','actionsTitle','actionsDesc'],['documents','▤','documentsTitle','documentsDesc']
    ];
    return'<div class="grc-module-grid">'+list.map(function(x){return'<div class="grc-module-card" onclick="window._grcSwitch(\''+x[0]+'\')"><div class="grc-module-icon">'+x[1]+'</div><div class="grc-module-title">'+L(x[2])+'</div><div class="grc-module-desc">'+L(x[3])+'</div><span class="grc-module-status">'+L('readySetup')+'</span></div>';}).join('')+'</div>';
  }

  function executivePage(m){
    var hero=sectionHero('GRC · Executive Oversight',L('executiveTitle'),L('executiveDesc'),'<button class="grc-primary-btn light" onclick="window._grcSwitch(\'risk\')">＋ '+L('addRisk')+'</button><button class="grc-secondary-btn" onclick="window._grcSwitch(\'compliance\')">'+L('complianceRegister')+'</button>');
    var metricsHtml='<div class="grc-kpis">'+
      metricCard(L('criticalRisks'),m.high,'bad',L('riskRegister'))+
      metricCard(L('complianceGaps'),m.gaps,'warn',L('complianceRegister'))+
      metricCard(L('pendingApprovals'),m.pending,'info',L('governance'))+
      metricCard(L('overdueActions'),m.overdue,'bad',L('actionRegister'))+
      metricCard(L('openFindings'),m.findings,'warn',L('auditRegister'))+
      metricCard(L('policiesDue'),m.soon,'good',L('documentRegister'))+'</div>';
    var roadmap='<div class="grc-roadmap">'+
      '<div class="grc-roadmap-row"><span class="grc-roadmap-phase">'+L('phase1')+'</span><span class="grc-roadmap-title">'+L('phase1Text')+'</span><span class="grc-roadmap-state">'+L('current')+'</span></div>'+
      '<div class="grc-roadmap-row"><span class="grc-roadmap-phase">'+L('phase2')+'</span><span class="grc-roadmap-title">'+L('phase2Text')+'</span><span class="grc-roadmap-state">'+L('next')+'</span></div>'+
      '<div class="grc-roadmap-row"><span class="grc-roadmap-phase">'+L('phase3')+'</span><span class="grc-roadmap-title">'+L('phase3Text')+'</span><span class="grc-roadmap-state">'+L('later')+'</span></div></div>';
    return hero+metricsHtml+'<div class="grc-grid-2">'+card(L('executiveAttention'),L('executiveAttentionSub'),attentionHtml())+card(L('roadmap'),L('roadmapSub'),roadmap)+'</div>'+card(L('moduleCoverage'),L('moduleCoverageSub'),moduleCards());
  }

  function governanceModules(){
    var arr=[['⌂','orgStructure','orgStructureDesc'],['▤','manuals','manualsDesc'],['◎','committees','committeesDesc'],['⇄','authorityMatrix','authorityMatrixDesc'],['▥','annualPlan','annualPlanDesc'],['□','approvedForms','approvedFormsDesc']];
    return'<div class="grc-module-grid">'+arr.map(function(x){return'<div class="grc-module-card"><div class="grc-module-icon">'+x[0]+'</div><div class="grc-module-title">'+L(x[1])+'</div><div class="grc-module-desc">'+L(x[2])+'</div><span class="grc-module-status">'+L('planned')+'</span></div>';}).join('')+'</div>';
  }
  function governanceTable(){
    var rows=state.decisions.map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(r.committee||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td><td><div class="grc-row-actions">'+delBtn('decisions',r.id)+'</div></td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('title')+'</th><th>'+L('committee')+'</th><th>'+L('owner')+'</th><th>'+L('dueDate')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(7))+'</tbody></table></div>';
  }
  function governancePage(){return sectionHero('GRC · Governance',L('governanceTitle'),L('governanceDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'decision\')">＋ '+L('addDecision')+'</button>')+card(L('moduleCoverage'),L('governanceDesc'),governanceModules())+'<div style="height:14px"></div>'+card(L('committees'),L('committeesDesc'),governanceTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'decision\')">＋ '+L('addDecision')+'</button>');}

  function heatMap(){
    var cells='';
    for(var impact=5;impact>=1;impact--){
      cells+='<div class="grc-axis">'+impact+'</div>';
      for(var likelihood=1;likelihood<=5;likelihood++){
        var score=impact*likelihood,band=riskBand(score),count=state.risks.filter(function(r){return Number(r.impact)===impact&&Number(r.likelihood)===likelihood;}).length;
        cells+='<div class="grc-heat-cell '+band+'" title="'+L('score')+': '+score+'"><span class="grc-heat-count">'+count+'</span></div>';
      }
    }
    cells+='<div class="grc-axis"></div>';
    for(var x=1;x<=5;x++)cells+='<div class="grc-axis">'+x+'</div>';
    return'<div class="grc-heatmap-wrap">'+cells+'</div><div style="display:flex;justify-content:space-between;margin-top:9px;font-size:8px;color:#83939f"><span>'+L('impact')+' ↑</span><span>'+L('likelihood')+' →</span></div>';
  }
  function riskTable(){
    var rows=state.risks.map(function(r){var score=riskScore(r);return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(L(r.department)||r.department||'—')+'</td><td>'+esc(L(r.category)||r.category||'—')+'</td><td>'+esc(r.likelihood)+'</td><td>'+esc(r.impact)+'</td><td><span class="grc-badge '+(score>=15?'bad':score>=10?'warn':score>=5?'info':'good')+'">'+score+' · '+riskBandLabel(score)+'</span></td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td><td>'+delBtn('risks',r.id)+'</td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('title')+'</th><th>'+L('department')+'</th><th>'+L('category')+'</th><th>'+L('likelihood')+'</th><th>'+L('impact')+'</th><th>'+L('score')+'</th><th>'+L('owner')+'</th><th>'+L('dueDate')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(11))+'</tbody></table></div>';
  }
  function riskPage(){
    var open=state.risks.filter(function(r){return r.status!=='closed';}).length, high=state.risks.filter(function(r){return riskScore(r)>=10&&r.status!=='closed';}).length, treatment=state.risks.filter(function(r){return r.status==='treatment';}).length;
    return sectionHero('GRC · Risk Management',L('riskTitle'),L('riskDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'risk\')">＋ '+L('addRisk')+'</button>')+
      '<div class="grc-kpis" style="grid-template-columns:repeat(3,minmax(150px,1fr))">'+metricCard(L('openStatus'),open,'info',L('riskRegister'))+metricCard(L('criticalRisks'),high,'bad',L('heatMap'))+metricCard(L('treatment'),treatment,'warn',L('actions'))+'</div>'+
      '<div class="grc-grid-2">'+card(L('riskRegister'),L('riskDesc'),riskTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'risk\')">＋ '+L('addRisk')+'</button>')+card(L('heatMap'),L('heatMapSub'),heatMap())+'</div>';
  }

  function frameworkCards(){var a=[['CBAHI','cbahi'],['MOH','moh'],['CD','civilDefense'],['QU','university'],['INT','internal']];return'<div class="grc-framework-grid">'+a.map(function(x){return'<div class="grc-framework"><div class="grc-framework-top"><span class="grc-framework-code">'+x[0]+'</span><span class="grc-badge neutral">'+L('planned')+'</span></div><div class="grc-framework-title">'+L(x[1])+'</div><div class="grc-framework-desc">'+L('frameworkDesc')+'</div></div>';}).join('')+'</div>';}
  function complianceTable(){
    var rows=state.compliance.map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(r.authority||'—')+'</td><td>'+esc(L(r.department)||r.department||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td><td>'+delBtn('compliance',r.id)+'</td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('requirement')+'</th><th>'+L('authority')+'</th><th>'+L('department')+'</th><th>'+L('owner')+'</th><th>'+L('dueDate')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(8))+'</tbody></table></div>';
  }
  function compliancePage(){
    var compliant=state.compliance.filter(function(r){return r.status==='compliant';}).length,gaps=state.compliance.filter(function(r){return ['partial','nonCompliant'].includes(r.status);}).length,review=state.compliance.filter(function(r){return r.status==='underReview';}).length;
    return sectionHero('GRC · Compliance',L('complianceTitle'),L('complianceDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'compliance\')">＋ '+L('addRequirement')+'</button>')+
      '<div class="grc-kpis" style="grid-template-columns:repeat(3,minmax(150px,1fr))">'+metricCard(L('compliant'),compliant,'good',L('complianceRegister'))+metricCard(L('complianceGaps'),gaps,'bad',L('actions'))+metricCard(L('underReview'),review,'warn',L('frameworks'))+'</div>'+frameworkCards()+card(L('complianceRegister'),L('complianceDesc'),complianceTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'compliance\')">＋ '+L('addRequirement')+'</button>');
  }

  function auditTable(){
    var rows=state.audits.map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(r.auditName||'—')+'</td><td>'+badge(r.severity)+'</td><td>'+esc(L(r.department)||r.department||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td><td>'+delBtn('audits',r.id)+'</td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('title')+'</th><th>'+L('source')+'</th><th>'+L('severity')+'</th><th>'+L('department')+'</th><th>'+L('owner')+'</th><th>'+L('dueDate')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(9))+'</tbody></table></div>';
  }
  function auditPage(){var open=state.audits.filter(function(r){return !['closed','completed'].includes(r.status);}).length,critical=state.audits.filter(function(r){return ['criticalSeverity','major'].includes(r.severity)&&!['closed','completed'].includes(r.status);}).length;return sectionHero('GRC · Audit & Assurance',L('auditTitle'),L('auditDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'audit\')">＋ '+L('addFinding')+'</button>')+'<div class="grc-kpis" style="grid-template-columns:repeat(2,minmax(150px,1fr))">'+metricCard(L('openFindings'),open,'warn',L('auditRegister'))+metricCard(L('criticalRisks'),critical,'bad',L('pendingVerification'))+'</div>'+card(L('auditRegister'),L('auditDesc'),auditTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'audit\')">＋ '+L('addFinding')+'</button>');}

  function actionTable(){
    var rows=state.actions.map(function(r){var over=isOverdue(r);return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(L(r.source)||r.source||'—')+'</td><td>'+esc(L(r.department)||r.department||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td><div style="display:flex;align-items:center;gap:7px"><div class="grc-progress"><span style="width:'+Math.max(0,Math.min(100,Number(r.progress||0)))+'%"></span></div><b>'+esc(r.progress||0)+'%</b></div></td><td>'+badge(over?'overdue':r.status)+'</td><td>'+delBtn('actions',r.id)+'</td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('title')+'</th><th>'+L('source')+'</th><th>'+L('department')+'</th><th>'+L('owner')+'</th><th>'+L('dueDate')+'</th><th>'+L('progress')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(9))+'</tbody></table></div>';
  }
  function actionsPage(){var open=state.actions.filter(function(r){return !['completed','closed'].includes(r.status);}).length,over=state.actions.filter(isOverdue).length,done=state.actions.filter(function(r){return r.status==='completed';}).length;return sectionHero('GRC · Action Management',L('actionsTitle'),L('actionsDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'action\')">＋ '+L('addAction')+'</button>')+'<div class="grc-kpis" style="grid-template-columns:repeat(3,minmax(150px,1fr))">'+metricCard(L('openStatus'),open,'info',L('actionRegister'))+metricCard(L('overdueActions'),over,'bad',L('dueDate'))+metricCard(L('completed'),done,'good',L('progress'))+'</div>'+card(L('actionRegister'),L('actionsDesc'),actionTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'action\')">＋ '+L('addAction')+'</button>');}

  function docCategory(v){var m={manual:'docManual',policy:'docPolicy',procedure:'docProcedure',form:'docForm',report:'docReport',plan:'docPlan',archive:'docArchive'};return L(m[v]||v);}
  function documentTable(){
    var rows=state.documents.map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordTitle(r))+'</td><td>'+esc(docCategory(r.category))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.reviewDate)+'</td><td>'+badge(r.status)+'</td><td>'+(!r.starter?delBtn('documents',r.id):'<span class="grc-badge neutral">Starter</span>')+'</td></tr>';}).join('');
    return'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+L('id')+'</th><th>'+L('title')+'</th><th>'+L('category')+'</th><th>'+L('owner')+'</th><th>'+L('reviewDate')+'</th><th>'+L('status')+'</th><th>'+L('actionsCol')+'</th></tr></thead><tbody>'+(rows||emptyRow(7))+'</tbody></table></div>';
  }
  function documentsPage(){var active=state.documents.filter(function(r){return r.status==='active';}).length,planned=state.documents.filter(function(r){return r.status==='planned';}).length,due=metrics().soon;return sectionHero('GRC · Document Control',L('documentsTitle'),L('documentsDesc'),'<button class="grc-primary-btn light" onclick="window._grcOpenForm(\'document\')">＋ '+L('addDocument')+'</button>')+'<div class="grc-kpis" style="grid-template-columns:repeat(3,minmax(150px,1fr))">'+metricCard(L('active'),active,'good',L('documentRegister'))+metricCard(L('planned'),planned,'info',L('existingContent'))+metricCard(L('policiesDue'),due,'warn',L('reviewDate'))+'</div>'+card(L('documentRegister'),L('documentsDesc'),documentTable(),'<button class="grc-link-btn" onclick="window._grcOpenForm(\'document\')">＋ '+L('addDocument')+'</button>');}

  function reportsPage(){
    var list=[['▥','quarterlyReports','Quarterly governance, risk and compliance reporting.'],['▥','annualReports','Annual consolidated GRC report.'],['⌁','executiveReports','Executive summary and decision briefing.'],['⚠','incidentReports','Incident trends, corrective actions and closure.'],['▤','historicalArchive','Controlled historical records and previous versions.'],['§','regulatoryArchive','Regulations, standards, clauses and references.']];
    var cards='<div class="grc-module-grid">'+list.map(function(x){return'<div class="grc-module-card"><div class="grc-module-icon">'+x[0]+'</div><div class="grc-module-title">'+L(x[1])+'</div><div class="grc-module-desc">'+(isAr()?L('planned'):x[2])+'</div><span class="grc-module-status">'+L('planned')+'</span></div>';}).join('')+'</div>';
    return sectionHero('GRC · Reporting',L('reportsTitle'),L('reportsDesc'),'<button class="grc-primary-btn light" onclick="window.print()">▥ '+L('printPage')+'</button><button class="grc-secondary-btn" onclick="window._selectPortal&&window._exitGRC();setTimeout(function(){window._selectPortal(\'performance\')},80)">KPI Performance</button>')+card(L('archiveAreas'),L('reportsDesc'),cards);
  }

  function pageHtml(id,m){if(id==='executive')return executivePage(m);if(id==='governance')return governancePage();if(id==='risk')return riskPage();if(id==='compliance')return compliancePage();if(id==='audit')return auditPage();if(id==='actions')return actionsPage();if(id==='documents')return documentsPage();return reportsPage();}

  function render(){
    if(!app||!app.classList.contains('grc-visible'))return;
    app.innerHTML=shellHtml();
    var img=document.getElementById('grcLogo'),src=logoSrc();if(img&&src)img.src=src;
  }

  function selectOptions(items,selected){return items.map(function(x){var value=x[0],label=x[1];return'<option value="'+esc(value)+'" '+(selected===value?'selected':'')+'>'+esc(label)+'</option>';}).join('');}
  function deptOptions(){return[['maintenance',L('maintenance')],['safety',L('safety')],['housekeeping',L('housekeeping')],['projects',L('projects')],['governanceDept',L('governanceDept')],['allFms',L('allFms')]];}
  function field(name,label,type,opts,required,full){
    var req=required?' required':'';var cls='grc-form-field'+(full?' full':'');
    if(type==='textarea')return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><textarea class="grc-textarea" name="'+name+'"'+req+'></textarea></div>';
    if(type==='select')return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><select class="grc-select" name="'+name+'"'+req+'>'+selectOptions(opts||[],null)+'</select></div>';
    return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><input class="grc-input" name="'+name+'" type="'+(type||'text')+'"'+req+(type==='number'?' min="0" max="100"':'')+'></div>';
  }
  function formSpec(type){
    if(type==='risk')return{title:L('addRisk'),collection:'risks',prefix:'RSK',fields:field('title',L('fieldTitle'),'textarea',null,true,true)+field('department',L('fieldDepartment'),'select',deptOptions(),true)+field('category',L('fieldCategory'),'select',[['riskOperational',L('riskOperational')],['riskFacility',L('riskFacility')],['riskSafety',L('riskSafety')],['riskCompliance',L('riskCompliance')],['riskContractor',L('riskContractor')],['riskEmergency',L('riskEmergency')]],true)+field('likelihood',L('likelihood'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],true)+field('impact',L('impact'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],true)+field('owner',L('fieldOwner'),'text',null,true)+field('dueDate',L('fieldDue'),'date')+field('status',L('fieldStatus'),'select',[['draft',L('draft')],['underReview',L('underReview')],['approved',L('approved')],['treatment',L('treatment')],['closed',L('closed')]],true)};
    if(type==='compliance')return{title:L('addRequirement'),collection:'compliance',prefix:'CMP',fields:field('requirement',L('fieldRequirement'),'textarea',null,true,true)+field('authority',L('fieldAuthority'),'text',null,true)+field('department',L('fieldDepartment'),'select',deptOptions(),true)+field('owner',L('fieldOwner'),'text',null,true)+field('dueDate',L('fieldDue'),'date')+field('status',L('fieldStatus'),'select',[['underReview',L('underReview')],['compliant',L('compliant')],['partial',L('partial')],['nonCompliant',L('nonCompliant')],['notApplicable',L('notApplicable')]],true)};
    if(type==='action')return{title:L('addAction'),collection:'actions',prefix:'ACT',fields:field('description',L('fieldTitle'),'textarea',null,true,true)+field('source',L('fieldSource'),'select',[['governanceDecision',L('governanceDecision')],['riskSource',L('riskSource')],['complianceSource',L('complianceSource')],['auditSource',L('auditSource')],['incidentSource',L('incidentSource')],['managementSource',L('managementSource')]],true)+field('department',L('fieldDepartment'),'select',deptOptions(),true)+field('owner',L('fieldOwner'),'text',null,true)+field('dueDate',L('fieldDue'),'date',null,true)+field('progress',L('fieldProgress'),'number')+field('status',L('fieldStatus'),'select',[['openStatus',L('openStatus')],['inProgress',L('inProgress')],['pendingVerification',L('pendingVerification')],['completed',L('completed')]],true)};
    if(type==='audit')return{title:L('addFinding'),collection:'audits',prefix:'AUD',fields:field('finding',L('fieldTitle'),'textarea',null,true,true)+field('auditName',L('fieldSource'),'text',null,true)+field('severity',L('fieldSeverity'),'select',[['observation',L('observation')],['minor',L('minor')],['moderateSeverity',L('moderateSeverity')],['major',L('major')],['criticalSeverity',L('criticalSeverity')]],true)+field('department',L('fieldDepartment'),'select',deptOptions(),true)+field('owner',L('fieldOwner'),'text',null,true)+field('dueDate',L('fieldDue'),'date')+field('status',L('fieldStatus'),'select',[['openStatus',L('openStatus')],['inProgress',L('inProgress')],['pendingVerification',L('pendingVerification')],['closed',L('closed')]],true)};
    if(type==='decision')return{title:L('addDecision'),collection:'decisions',prefix:'DEC',fields:field('description',L('fieldTitle'),'textarea',null,true,true)+field('committee',L('fieldCommittee'),'text',null,true)+field('owner',L('fieldOwner'),'text',null,true)+field('dueDate',L('fieldDue'),'date')+field('status',L('fieldStatus'),'select',[['draft',L('draft')],['underReview',L('underReview')],['pendingApproval',L('pendingApproval')],['approved',L('approved')],['closed',L('closed')]],true)};
    return{title:L('addDocument'),collection:'documents',prefix:'DOC',fields:field('title',L('fieldTitle'),'text',null,true,true)+field('category',L('fieldCategory'),'select',[['manual',L('docManual')],['policy',L('docPolicy')],['procedure',L('docProcedure')],['form',L('docForm')],['report',L('docReport')],['plan',L('docPlan')],['archive',L('docArchive')]],true)+field('owner',L('fieldOwner'),'text',null,true)+field('reviewDate',L('fieldReview'),'date')+field('status',L('fieldStatus'),'select',[['draft',L('draft')],['underReview',L('underReview')],['pendingApproval',L('pendingApproval')],['active',L('active')],['expired',L('expired')],['archived',L('archived')]],true)};
  }
  function nextId(prefix,collection){var max=0;(state[collection]||[]).forEach(function(r){var n=Number(String(r.id||'').split('-').pop());if(n>max)max=n;});return prefix+'-'+String(max+1).padStart(3,'0');}

  window._grcOpenForm=function(type){
    if(normalizedRole()!=='super_admin')return;
    var spec=formSpec(type),old=document.getElementById('_grcFormModal');if(old)old.remove();
    var ov=document.createElement('div');ov.id='_grcFormModal';ov.className='grc-modal-backdrop';
    ov.innerHTML='<div class="grc-modal" role="dialog" aria-modal="true"><div class="grc-modal-head"><div><div class="grc-modal-title">'+spec.title+'</div><div class="grc-modal-sub">'+L('draftWorkspace')+' · '+L('localNote')+'</div></div><button class="grc-modal-close" type="button" onclick="document.getElementById(\'_grcFormModal\').remove()">×</button></div><form class="grc-modal-body" id="_grcForm"><div class="grc-form-grid">'+spec.fields+'</div><div id="_grcFormErr" style="font-size:9px;color:#b83232;font-weight:800;margin-top:10px"></div><div class="grc-modal-actions"><button type="button" class="grc-secondary-btn" onclick="document.getElementById(\'_grcFormModal\').remove()">'+L('cancel')+'</button><button type="submit" class="grc-primary-btn">'+L('save')+'</button></div></form></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    document.getElementById('_grcForm').addEventListener('submit',function(e){e.preventDefault();var fd=new FormData(e.target),obj={id:nextId(spec.prefix,spec.collection),createdAt:new Date().toISOString(),createdBy:currentName()};var ok=true;Array.from(e.target.querySelectorAll('[required]')).forEach(function(el){if(!String(el.value||'').trim())ok=false;});if(!ok){document.getElementById('_grcFormErr').textContent=L('required');return;}fd.forEach(function(v,k){obj[k]=v;});if(obj.progress!==undefined)obj.progress=Number(obj.progress||0);if(obj.likelihood!==undefined)obj.likelihood=Number(obj.likelihood||0);if(obj.impact!==undefined)obj.impact=Number(obj.impact||0);state[spec.collection].push(obj);ov.remove();saveState();});
  };

  window._grcDelete=function(collection,id){if(normalizedRole()!=='super_admin')return;if(!window.confirm(L('confirmDelete')))return;state[collection]=(state[collection]||[]).filter(function(r){return String(r.id)!==String(id);});saveState();};
  window._grcSwitch=function(id){if(!modules.some(function(x){return x.id===id;}))id='executive';activeTab=id;render();var main=app&&app.querySelector('.grc-main');if(main)main.scrollTop=0;};
  window._grcToggleLang=function(){
    if(typeof window.lang!=='undefined')window.lang=window.lang==='en'?'ar':'en';
    var ar=isAr();document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';
    var perfBtn=document.getElementById('langBtn');if(perfBtn)perfBtn.textContent=ar?'EN':'عربي';render();
  };
  window._grcRefreshLanguage=function(){render();};

  window._hideGRC=function(){var a=document.getElementById('grcApp');if(a){a.classList.remove('grc-visible');a.setAttribute('aria-hidden','true');}document.body.classList.remove('grc-mode');};
  window._exitGRC=function(){window._hideGRC();var bg=document.getElementById('_bgLayer'),po=document.getElementById('_portalOverlay'),auth=document.getElementById('_authOverlay');if(auth)auth.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};
  window._openGrcPortal=function(){
    if(normalizedRole()==='super_admin')window._enterGRC();
    else window._showGrcComingSoon();
  };
  window._enterGRC=function(){
    if(normalizedRole()!=='super_admin'){window._showGrcComingSoon();return;}
    ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});
    ensureApp();activeTab=activeTab||'executive';document.body.classList.add('grc-mode');app.classList.add('grc-visible');app.setAttribute('aria-hidden','false');render();
  };
  window._showGrcComingSoon=function(){
    var old=document.getElementById('_grcComingSoon');if(old)old.remove();
    var ov=document.createElement('div');ov.id='_grcComingSoon';ov.className='grc-modal-backdrop';
    ov.innerHTML='<div class="grc-coming-card"><div class="grc-coming-icon">▦</div><div class="grc-coming-title">'+L('comingTitle')+'</div><div class="grc-coming-sub">'+L('comingSub')+'</div><div class="grc-coming-pill">'+L('comingSoon')+'</div><div><button class="grc-top-btn grc-back" style="margin:auto" onclick="document.getElementById(\'_grcComingSoon\').remove()">← '+L('back')+'</button></div></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  };

  document.addEventListener('DOMContentLoaded',function(){ensureApp();});
})();
