/*
 * QUMC GRC Module v1.0
 * - Super Admin: full GRC prototype interface
 * - Other roles: Coming Soon screen
 * - Prototype records are stored in localStorage only (no Firestore writes)
 * Load this file after the existing project scripts.
 */
(function(){
  'use strict';
  if(window.__QUMC_GRC_MODULE_V1__) return;
  window.__QUMC_GRC_MODULE_V1__=true;

  var VERSION='1.0.0';
  var STORE_KEY='qumc_grc_prototype_v1';
  var state={view:'dashboard',lang:detectLang(),search:''};

  var I18N={
    en:{
      title:'Governance, Risk & Compliance', subtitle:'Integrated GRC Management Portal', preview:'Super Admin Preview', back:'Back to Portal', superAdmin:'Super Admin', language:'العربية',
      prototypeTitle:'Prototype environment', prototypeText:'This preview is available only to Super Admin. Records created here are saved in this browser only and are not written to Firestore.',
      dashboard:'GRC Dashboard', governance:'Governance', policies:'Policies & Procedures', committees:'Committees & Decisions', risks:'Risk Register', heatmap:'Risk Heat Map', kri:'Key Risk Indicators', compliance:'Compliance Register', actions:'Action Plans', audit:'Audit & Findings', reports:'Reports & Analytics',
      overview:'Overview', riskManagement:'Risk Management', complianceGroup:'Compliance', assurance:'Assurance & Reporting',
      complianceScore:'Compliance Score', openRisks:'Open Risks', criticalRisks:'High / Critical Risks', overdueActions:'Overdue Actions', policiesDue:'Policies Due for Review', openFindings:'Open Audit Findings', noAssessment:'No assessment yet', noData:'No records yet',
      quickModules:'GRC Modules', quickModulesSub:'Open a module to review the proposed structure and workflow.', openModule:'Open module',
      recentActivity:'Recent Activity', riskSummary:'Risk Summary', actionSummary:'Action Plan Summary',
      addRisk:'Add Risk', addPolicy:'Add Policy', addRequirement:'Add Requirement', addAction:'Add Action', addCommittee:'Add Committee', addFinding:'Add Finding',
      search:'Search records…', export:'Export JSON', print:'Print', reset:'Reset Prototype Data',
      code:'Code', name:'Name / Description', category:'Category', owner:'Owner', likelihood:'Likelihood', impact:'Impact', score:'Score', level:'Risk Level', dueDate:'Due Date', status:'Status', controls:'Existing Controls', treatment:'Treatment Plan', actionsCol:'Actions',
      policyTitle:'Policy / Procedure', documentOwner:'Document Owner', version:'Version', approvalDate:'Approval Date', reviewDate:'Next Review', documentStatus:'Document Status',
      requirement:'Requirement', source:'Source / Regulator', evidence:'Evidence', assessment:'Assessment', lastReview:'Last Review',
      action:'Corrective / Treatment Action', priority:'Priority', progress:'Progress', linkedTo:'Linked To',
      committee:'Committee', chair:'Chair', members:'Members', nextMeeting:'Next Meeting', openDecisions:'Open Decisions',
      finding:'Audit Finding', auditArea:'Audit Area', classification:'Classification', recommendation:'Recommendation',
      save:'Save', cancel:'Cancel', delete:'Delete', close:'Close',
      emptyRisk:'No risks have been registered. Use “Add Risk” to test the proposed risk workflow.', emptyPolicy:'No policies or procedures have been added.', emptyCompliance:'No compliance requirements have been added.', emptyActions:'No action plans have been added.', emptyCommittee:'No committees have been added.', emptyAudit:'No audit findings have been added.',
      comingSoon:'Coming Soon', comingText:'The GRC module is currently under development and will be available to your role in a future release.', returnPortal:'Return to Portal', accessRestricted:'Access is currently limited to Super Admin.',
      saved:'Record saved in prototype storage.', deleted:'Record deleted.', resetDone:'Prototype data cleared.', confirmDelete:'Delete this prototype record?', confirmReset:'Clear all GRC prototype records from this browser?',
      low:'Low', moderate:'Moderate', high:'High', critical:'Critical', open:'Open', closed:'Closed', inProgress:'In Progress', overdue:'Overdue', draft:'Draft', underReview:'Under Review', approved:'Approved', expired:'Expired', compliant:'Compliant', partiallyCompliant:'Partially Compliant', nonCompliant:'Non-Compliant', notApplicable:'Not Applicable', planned:'Planned', completed:'Completed', major:'Major', minor:'Minor', observation:'Observation',
      riskDesc:'Central risk register, inherent and residual scoring, treatment plans, ownership and due dates.', policyDesc:'Controlled document library, review dates, versions, approvals and document ownership.', complianceDesc:'Regulatory requirements, assessments, evidence, responsible owners and review cycles.', actionDesc:'Unified follow-up for risk treatments, non-compliance, audit findings and committee decisions.', auditDesc:'Annual audit plan, findings, classifications, recommendations and closure verification.', reportDesc:'Executive GRC summaries and export-ready management views.', committeeDesc:'Committees, meetings, decisions, accountable owners and decision due dates.', kriDesc:'Early-warning indicators linked to operational and strategic risks.', heatDesc:'5×5 visualization of registered risk exposure.',
      noKri:'KRI configuration is ready for the next phase. Indicators can later be linked to KPI and incident data.', reportsText:'This prototype report summarizes records saved locally in this browser.', generated:'Generated', totalRecords:'Total prototype records',
      localOnly:'LOCAL PROTOTYPE', required:'Please complete the required fields.'
    },
    ar:{
      title:'الحوكمة والمخاطر والالتزام', subtitle:'البوابة المتكاملة لإدارة GRC', preview:'معاينة السوبر أدمن', back:'العودة للبوابة', superAdmin:'سوبر أدمن', language:'English',
      prototypeTitle:'بيئة تجريبية', prototypeText:'هذه المعاينة متاحة للسوبر أدمن فقط. السجلات المضافة هنا تُحفظ في هذا المتصفح فقط ولا يتم إرسالها إلى Firestore.',
      dashboard:'لوحة GRC', governance:'الحوكمة', policies:'السياسات والإجراءات', committees:'اللجان والقرارات', risks:'سجل المخاطر', heatmap:'مصفوفة المخاطر', kri:'مؤشرات المخاطر الرئيسية', compliance:'سجل الالتزام', actions:'خطط الإجراءات', audit:'التدقيق والملاحظات', reports:'التقارير والتحليلات',
      overview:'نظرة عامة', riskManagement:'إدارة المخاطر', complianceGroup:'الالتزام', assurance:'التأكيد والتقارير',
      complianceScore:'مستوى الالتزام', openRisks:'المخاطر المفتوحة', criticalRisks:'المخاطر المرتفعة والحرجة', overdueActions:'الإجراءات المتأخرة', policiesDue:'السياسات المستحقة للمراجعة', openFindings:'ملاحظات التدقيق المفتوحة', noAssessment:'لا يوجد تقييم بعد', noData:'لا توجد سجلات',
      quickModules:'وحدات GRC', quickModulesSub:'افتح أي وحدة لاستعراض الهيكل وسير العمل المقترح.', openModule:'فتح الوحدة',
      recentActivity:'أحدث الأنشطة', riskSummary:'ملخص المخاطر', actionSummary:'ملخص خطط الإجراءات',
      addRisk:'إضافة خطر', addPolicy:'إضافة سياسة', addRequirement:'إضافة متطلب', addAction:'إضافة إجراء', addCommittee:'إضافة لجنة', addFinding:'إضافة ملاحظة',
      search:'البحث في السجلات…', export:'تصدير JSON', print:'طباعة', reset:'مسح البيانات التجريبية',
      code:'الرمز', name:'الاسم / الوصف', category:'التصنيف', owner:'المالك', likelihood:'الاحتمالية', impact:'التأثير', score:'الدرجة', level:'مستوى الخطر', dueDate:'تاريخ الاستحقاق', status:'الحالة', controls:'الضوابط الحالية', treatment:'خطة المعالجة', actionsCol:'الإجراءات',
      policyTitle:'السياسة / الإجراء', documentOwner:'مالك الوثيقة', version:'الإصدار', approvalDate:'تاريخ الاعتماد', reviewDate:'المراجعة القادمة', documentStatus:'حالة الوثيقة',
      requirement:'المتطلب', source:'المصدر / الجهة المنظمة', evidence:'الدليل', assessment:'التقييم', lastReview:'آخر مراجعة',
      action:'الإجراء التصحيحي / العلاجي', priority:'الأولوية', progress:'نسبة الإنجاز', linkedTo:'مرتبط بـ',
      committee:'اللجنة', chair:'الرئيس', members:'الأعضاء', nextMeeting:'الاجتماع القادم', openDecisions:'القرارات المفتوحة',
      finding:'ملاحظة التدقيق', auditArea:'نطاق التدقيق', classification:'التصنيف', recommendation:'التوصية',
      save:'حفظ', cancel:'إلغاء', delete:'حذف', close:'إغلاق',
      emptyRisk:'لم يتم تسجيل مخاطر. استخدم «إضافة خطر» لتجربة سير عمل المخاطر المقترح.', emptyPolicy:'لم تتم إضافة سياسات أو إجراءات.', emptyCompliance:'لم تتم إضافة متطلبات التزام.', emptyActions:'لم تتم إضافة خطط إجراءات.', emptyCommittee:'لم تتم إضافة لجان.', emptyAudit:'لم تتم إضافة ملاحظات تدقيق.',
      comingSoon:'قريبًا', comingText:'وحدة الحوكمة والمخاطر والالتزام قيد التطوير حاليًا، وستتاح لصلاحيتك في إصدار قادم.', returnPortal:'العودة إلى البوابة', accessRestricted:'الوصول في الوقت الحالي متاح للسوبر أدمن فقط.',
      saved:'تم حفظ السجل في التخزين التجريبي.', deleted:'تم حذف السجل.', resetDone:'تم مسح البيانات التجريبية.', confirmDelete:'هل تريد حذف هذا السجل التجريبي؟', confirmReset:'هل تريد مسح جميع سجلات GRC التجريبية من هذا المتصفح؟',
      low:'منخفض', moderate:'متوسط', high:'مرتفع', critical:'حرج', open:'مفتوح', closed:'مغلق', inProgress:'قيد التنفيذ', overdue:'متأخر', draft:'مسودة', underReview:'تحت المراجعة', approved:'معتمد', expired:'منتهي', compliant:'ملتزم', partiallyCompliant:'ملتزم جزئيًا', nonCompliant:'غير ملتزم', notApplicable:'غير منطبق', planned:'مخطط', completed:'مكتمل', major:'جسيم', minor:'طفيف', observation:'ملاحظة',
      riskDesc:'سجل مركزي للمخاطر، تقييم قبل وبعد المعالجة، خطط المعالجة، المالك وتواريخ الاستحقاق.', policyDesc:'مكتبة وثائق محكومة تشمل الإصدارات، الاعتمادات، مواعيد المراجعة وملكية الوثائق.', complianceDesc:'المتطلبات النظامية، التقييمات، الأدلة، المسؤولون ودورات المراجعة.', actionDesc:'متابعة موحدة لمعالجات المخاطر وعدم الالتزام وملاحظات التدقيق وقرارات اللجان.', auditDesc:'خطة التدقيق السنوية، الملاحظات، التصنيفات، التوصيات والتحقق من الإغلاق.', reportDesc:'ملخصات تنفيذية وتقارير إدارية جاهزة للتصدير.', committeeDesc:'اللجان والاجتماعات والقرارات والمسؤولون وتواريخ الاستحقاق.', kriDesc:'مؤشرات إنذار مبكر مرتبطة بالمخاطر التشغيلية والاستراتيجية.', heatDesc:'عرض بصري 5×5 لتوزيع المخاطر المسجلة.',
      noKri:'تم تجهيز هيكل مؤشرات المخاطر للمرحلة القادمة، ويمكن لاحقًا ربطها ببيانات KPI والحوادث.', reportsText:'يلخص هذا التقرير التجريبي السجلات المحفوظة محليًا في هذا المتصفح.', generated:'تاريخ الإنشاء', totalRecords:'إجمالي السجلات التجريبية',
      localOnly:'نموذج محلي', required:'يرجى تعبئة الحقول المطلوبة.'
    }
  };

  function detectLang(){
    try{
      if(window.lang==='ar'||document.documentElement.dir==='rtl'||document.documentElement.lang==='ar') return 'ar';
    }catch(_){ }
    return 'en';
  }
  function t(key){return (I18N[state.lang]&&I18N[state.lang][key])||I18N.en[key]||key;}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(v){return String(v||'').toLowerCase().trim().replace(/[\s-]+/g,'_');}
  function isSuperAdmin(){var r=norm(window._fbRole||window.currentUserRole||window.userRole||'');return r==='super_admin'||r==='superadmin';}
  function userName(){return String(window._fbName||window.currentUserName||'Super Admin');}
  function userRole(){return norm(window._fbRole||window.currentUserRole||'');}
  function nowIso(){return new Date().toISOString();}
  function today(){return new Date().toISOString().slice(0,10);}
  function uid(prefix){return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}

  function emptyData(){return {risks:[],policies:[],requirements:[],actions:[],committees:[],findings:[],audit:[]};}
  function loadData(){
    try{
      var raw=localStorage.getItem(STORE_KEY);if(!raw)return emptyData();
      var d=JSON.parse(raw)||{};var base=emptyData();Object.keys(base).forEach(function(k){if(!Array.isArray(d[k]))d[k]=[];});return d;
    }catch(_){return emptyData();}
  }
  function saveData(d){try{localStorage.setItem(STORE_KEY,JSON.stringify(d));}catch(_){ }}
  function addAudit(action,detail){var d=loadData();d.audit.unshift({id:uid('AUD'),at:nowIso(),user:userName(),action:action,detail:detail});d.audit=d.audit.slice(0,200);saveData(d);}

  function icon(name,size){
    var s=size||18, common='width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    var p={
      dashboard:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      policy:'<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
      committee:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a4 4 0 0 1 7 0"/>',
      risk:'<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',
      heat:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
      kri:'<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="m4 9 6-4 6 7 5-5"/>',
      compliance:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-5"/>',
      action:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      audit:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11l2 2 4-4"/>',
      report:'<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',
      arrow:'<path d="m9 18 6-6-6-6"/>', back:'<path d="m15 18-6-6 6-6"/>', plus:'<path d="M12 5v14M5 12h14"/>', search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', export:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>', print:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>', trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', building:'<path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3"/>'
    };
    return '<svg '+common+'>'+((p[name]||p.info))+'</svg>';
  }

  var NAV=[
    {group:'overview',items:[['dashboard','dashboard','dashboard']]},
    {group:'governance',items:[['policies','policy','policies'],['committees','committee','committees']]},
    {group:'riskManagement',items:[['risks','risk','risks'],['heatmap','heat','heatmap'],['kri','kri','kri']]},
    {group:'complianceGroup',items:[['compliance','compliance','compliance'],['actions','action','actions']]},
    {group:'assurance',items:[['audit','audit','audit'],['reports','report','reports']]}
  ];

  function viewMeta(view){
    var m={
      dashboard:['dashboard','prototypeText'],policies:['policies','policyDesc'],committees:['committees','committeeDesc'],risks:['risks','riskDesc'],heatmap:['heatmap','heatDesc'],kri:['kri','kriDesc'],compliance:['compliance','complianceDesc'],actions:['actions','actionDesc'],audit:['audit','auditDesc'],reports:['reports','reportDesc']
    };return m[view]||m.dashboard;
  }

  function renderShell(){
    var old=document.getElementById('qumcGrcRoot');if(old)old.remove();
    var root=document.createElement('div');root.id='qumcGrcRoot';root.setAttribute('dir',state.lang==='ar'?'rtl':'ltr');root.setAttribute('lang',state.lang);
    var initials=(userName().trim()[0]||'S').toUpperCase();
    root.innerHTML=''
      +'<aside class="grc-sidebar">'
      +'<div class="grc-brand"><div class="grc-brand-mark">'+icon('building',24)+'</div><div><div class="grc-brand-title">GRC</div><div class="grc-brand-sub">'+esc(t('title'))+'</div><span class="grc-preview-badge">'+esc(t('preview'))+'</span></div></div>'
      +'<nav class="grc-nav">'+NAV.map(function(g){return '<div class="grc-nav-group"><div class="grc-nav-label">'+esc(t(g.group))+'</div>'+g.items.map(function(it){return '<button class="grc-nav-btn '+(state.view===it[0]?'active':'')+'" data-grc-view="'+it[0]+'"><span class="grc-nav-icon">'+icon(it[1],17)+'</span><span>'+esc(t(it[2]))+'</span></button>';}).join('')+'</div>';}).join('')+'</nav>'
      +'<div class="grc-sidebar-foot"><div class="grc-user-mini"><div class="grc-user-avatar">'+esc(initials)+'</div><div style="min-width:0"><div class="grc-user-name">'+esc(userName())+'</div><div class="grc-user-role">'+esc(t('superAdmin'))+'</div></div></div></div>'
      +'</aside>'
      +'<main class="grc-main"><header class="grc-topbar"><button class="grc-back-btn" data-grc-action="back">'+icon('back',16)+'<span>'+esc(t('back'))+'</span></button><div class="grc-page-head"><div class="grc-page-title" id="grcPageTitle"></div><div class="grc-page-subtitle" id="grcPageSubtitle"></div></div><div class="grc-top-actions"><span class="grc-role-pill">'+esc(t('superAdmin'))+'</span><button class="grc-icon-btn" data-grc-action="lang">'+esc(t('language'))+'</button></div></header><section class="grc-content" id="grcContent"></section></main>';
    document.body.appendChild(root);bindRoot(root);renderView();
  }

  function bindRoot(root){
    root.addEventListener('click',function(ev){
      var v=ev.target.closest('[data-grc-view]');if(v){state.view=v.getAttribute('data-grc-view');state.search='';renderShell();return;}
      var a=ev.target.closest('[data-grc-action]');if(!a)return;
      var act=a.getAttribute('data-grc-action');
      if(act==='back')return backToPortal();
      if(act==='lang'){state.lang=state.lang==='ar'?'en':'ar';return renderShell();}
      if(act==='add-risk')return openForm('risk');
      if(act==='add-policy')return openForm('policy');
      if(act==='add-requirement')return openForm('requirement');
      if(act==='add-action')return openForm('action');
      if(act==='add-committee')return openForm('committee');
      if(act==='add-finding')return openForm('finding');
      if(act==='delete'){return deleteRecord(a.getAttribute('data-type'),a.getAttribute('data-id'));}
      if(act==='export')return exportJson();
      if(act==='print')return printView();
      if(act==='reset')return resetData();
    });
    root.addEventListener('input',function(ev){if(ev.target&&ev.target.id==='grcSearch'){state.search=ev.target.value||'';renderViewBodyOnly();}});
  }

  function setHead(){var m=viewMeta(state.view),pt=document.getElementById('grcPageTitle'),ps=document.getElementById('grcPageSubtitle');if(pt)pt.textContent=t(m[0]);if(ps)ps.textContent=t(m[1]);}
  function renderView(){setHead();renderViewBodyOnly();}
  function renderViewBodyOnly(){
    var el=document.getElementById('grcContent');if(!el)return;var html='';
    if(state.view==='dashboard')html=renderDashboard();
    else if(state.view==='risks')html=renderRisks();
    else if(state.view==='heatmap')html=renderHeatmap();
    else if(state.view==='policies')html=renderPolicies();
    else if(state.view==='committees')html=renderCommittees();
    else if(state.view==='compliance')html=renderCompliance();
    else if(state.view==='actions')html=renderActions();
    else if(state.view==='audit')html=renderAudit();
    else if(state.view==='kri')html=renderKri();
    else if(state.view==='reports')html=renderReports();
    el.innerHTML=prototypeBanner()+html;
  }

  function prototypeBanner(){return '<div class="grc-banner"><div style="color:var(--grc-teal);margin-top:1px">'+icon('info',19)+'</div><div><div class="grc-banner-title">'+esc(t('prototypeTitle'))+' <span class="grc-badge blue" style="margin-inline-start:7px">'+esc(t('localOnly'))+'</span></div><div class="grc-banner-text">'+esc(t('prototypeText'))+'</div></div></div>';}
  function metric(value,label,note,dot){return '<div class="grc-card grc-kpi-card"><span class="grc-kpi-dot '+(dot||'')+'"></span><div class="grc-kpi-icon">'+icon('report',18)+'</div><div class="grc-kpi-value">'+esc(value)+'</div><div class="grc-kpi-label">'+esc(label)+'</div><div class="grc-kpi-note">'+esc(note||'')+'</div></div>';}
  function moduleCard(view,ico,title,desc){return '<div class="grc-card grc-module-card" data-grc-view="'+view+'"><div class="grc-module-icon">'+icon(ico,21)+'</div><div class="grc-module-name">'+esc(t(title))+'</div><div class="grc-module-desc">'+esc(t(desc))+'</div><div class="grc-module-link">'+esc(t('openModule'))+' '+icon('arrow',13)+'</div></div>';}

  function metrics(d){
    var assessed=d.requirements.filter(function(x){return x.status&&x.status!=='notApplicable';});
    var compliant=assessed.filter(function(x){return x.status==='compliant';}).length;
    var score=assessed.length?Math.round(compliant/assessed.length*100)+'%':'—';
    var openRisks=d.risks.filter(function(x){return x.status!=='closed';});
    var critical=openRisks.filter(function(x){return riskLevel(+x.likelihood,+x.impact)==='high'||riskLevel(+x.likelihood,+x.impact)==='critical';});
    var overdue=d.actions.filter(function(x){return x.status!=='completed'&&x.dueDate&&x.dueDate<today();});
    var duePolicies=d.policies.filter(function(x){return x.reviewDate&&x.reviewDate<=today();});
    var openFindings=d.findings.filter(function(x){return x.status!=='closed';});
    return {score:score,assessed:assessed.length,openRisks:openRisks.length,critical:critical.length,overdue:overdue.length,duePolicies:duePolicies.length,openFindings:openFindings.length};
  }

  function renderDashboard(){
    var d=loadData(),m=metrics(d);
    return '<div class="grc-grid">'
      +'<div class="grc-span-2">'+metric(m.score,t('complianceScore'),m.assessed?t('assessment')+': '+m.assessed:t('noAssessment'),m.score==='—'?'':(+m.score.replace('%','')>=80?'green':'amber'))+'</div>'
      +'<div class="grc-span-2">'+metric(m.openRisks,t('openRisks'),t('riskSummary'),m.openRisks?'amber':'green')+'</div>'
      +'<div class="grc-span-2">'+metric(m.critical,t('criticalRisks'),t('riskSummary'),m.critical?'red':'green')+'</div>'
      +'<div class="grc-span-2">'+metric(m.overdue,t('overdueActions'),t('actionSummary'),m.overdue?'red':'green')+'</div>'
      +'<div class="grc-span-2">'+metric(m.duePolicies,t('policiesDue'),t('governance'),m.duePolicies?'amber':'green')+'</div>'
      +'<div class="grc-span-2">'+metric(m.openFindings,t('openFindings'),t('audit'),m.openFindings?'amber':'green')+'</div>'
      +'<div class="grc-span-12"><div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+esc(t('quickModules'))+'</div><div class="grc-card-sub">'+esc(t('quickModulesSub'))+'</div></div></div><div class="grc-card-body"><div class="grc-grid">'
      +'<div class="grc-span-3">'+moduleCard('risks','risk','risks','riskDesc')+'</div><div class="grc-span-3">'+moduleCard('policies','policy','policies','policyDesc')+'</div><div class="grc-span-3">'+moduleCard('compliance','compliance','compliance','complianceDesc')+'</div><div class="grc-span-3">'+moduleCard('actions','action','actions','actionDesc')+'</div>'
      +'<div class="grc-span-3">'+moduleCard('audit','audit','audit','auditDesc')+'</div><div class="grc-span-3">'+moduleCard('committees','committee','committees','committeeDesc')+'</div><div class="grc-span-3">'+moduleCard('heatmap','heat','heatmap','heatDesc')+'</div><div class="grc-span-3">'+moduleCard('reports','report','reports','reportDesc')+'</div>'
      +'</div></div></div></div>'
      +'<div class="grc-span-12">'+renderActivity(d.audit)+'</div></div>';
  }

  function renderActivity(rows){
    var body=!rows.length?emptyBlock('audit',t('noData')):'<div class="grc-table-wrap"><table class="grc-table"><thead><tr><th>'+esc(t('generated'))+'</th><th>'+esc(t('owner'))+'</th><th>'+esc(t('action'))+'</th><th>'+esc(t('name'))+'</th></tr></thead><tbody>'+rows.slice(0,8).map(function(r){return '<tr><td>'+esc(formatDateTime(r.at))+'</td><td>'+esc(r.user)+'</td><td><span class="grc-badge blue">'+esc(r.action)+'</span></td><td>'+esc(r.detail)+'</td></tr>';}).join('')+'</tbody></table></div>';
    return '<div class="grc-card"><div class="grc-card-head"><div class="grc-card-title">'+esc(t('recentActivity'))+'</div></div>'+body+'</div>';
  }

  function toolbar(addAction,addLabel){return '<div class="grc-toolbar"><button class="grc-btn primary" data-grc-action="'+addAction+'">'+icon('plus',14)+esc(t(addLabel))+'</button><input class="grc-search" id="grcSearch" value="'+esc(state.search)+'" placeholder="'+esc(t('search'))+'"><span class="grc-spacer"></span><button class="grc-btn ghost" data-grc-action="export">'+icon('export',14)+esc(t('export'))+'</button><button class="grc-btn ghost" data-grc-action="print">'+icon('print',14)+esc(t('print'))+'</button></div>';}
  function matches(x){var q=state.search.toLowerCase().trim();if(!q)return true;return JSON.stringify(x).toLowerCase().indexOf(q)>-1;}
  function deleteBtn(type,id){return '<button class="grc-btn ghost" style="height:29px;padding:0 9px" data-grc-action="delete" data-type="'+type+'" data-id="'+esc(id)+'" title="'+esc(t('delete'))+'">'+icon('trash',13)+'</button>';}
  function cardTable(title,sub,head,rows,emptyText){return '<div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+esc(title)+'</div><div class="grc-card-sub">'+esc(sub||'')+'</div></div></div>'+(rows?'<div class="grc-table-wrap"><table class="grc-table"><thead>'+head+'</thead><tbody>'+rows+'</tbody></table></div>':emptyBlock('report',emptyText))+'</div>';}
  function emptyBlock(ico,text){return '<div class="grc-empty"><div class="grc-empty-icon">'+icon(ico,23)+'</div><div class="grc-empty-title">'+esc(t('noData'))+'</div><div class="grc-empty-text">'+esc(text||'')+'</div></div>';}

  function riskScore(l,i){return (+l||0)*(+i||0);}
  function riskLevel(l,i){var s=riskScore(l,i);if(s>=20)return'critical';if(s>=12)return'high';if(s>=6)return'moderate';return'low';}
  function badge(key){var cls={low:'green',moderate:'amber',high:'amber',critical:'red',open:'blue',closed:'green',inProgress:'amber',overdue:'red',draft:'gray',underReview:'amber',approved:'green',expired:'red',compliant:'green',partiallyCompliant:'amber',nonCompliant:'red',notApplicable:'gray',planned:'blue',completed:'green',major:'red',minor:'amber',observation:'blue'}[key]||'gray';return '<span class="grc-badge '+cls+'">'+esc(t(key))+'</span>';}

  function renderRisks(){var d=loadData(),arr=d.risks.filter(matches);var rows=arr.map(function(r){var lv=riskLevel(r.likelihood,r.impact);return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td style="min-width:240px"><strong>'+esc(r.title)+'</strong><div style="font-size:8.5px;color:#7b8ca0;margin-top:3px">'+esc(r.treatment||'')+'</div></td><td>'+esc(r.category||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+esc(r.likelihood)+'</td><td>'+esc(r.impact)+'</td><td><strong>'+riskScore(r.likelihood,r.impact)+'</strong></td><td>'+badge(lv)+'</td><td>'+esc(r.dueDate||'—')+'</td><td>'+badge(r.status||'open')+'</td><td>'+deleteBtn('risks',r.id)+'</td></tr>';}).join('');return toolbar('add-risk','addRisk')+cardTable(t('risks'),t('riskDesc'),'<tr><th>'+t('code')+'</th><th>'+t('name')+'</th><th>'+t('category')+'</th><th>'+t('owner')+'</th><th>'+t('likelihood')+'</th><th>'+t('impact')+'</th><th>'+t('score')+'</th><th>'+t('level')+'</th><th>'+t('dueDate')+'</th><th>'+t('status')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyRisk'));}

  function renderHeatmap(){var d=loadData(),counts={};d.risks.forEach(function(r){var k=(+r.impact||1)+'-'+(+r.likelihood||1);counts[k]=(counts[k]||0)+1;});var grid='<div class="grc-heatmap"><div></div>';for(var l=1;l<=5;l++)grid+='<div class="grc-heat-label">L'+l+'</div>';for(var impact=5;impact>=1;impact--){grid+='<div class="grc-heat-label">I'+impact+'</div>';for(var likelihood=1;likelihood<=5;likelihood++){var level=riskLevel(likelihood,impact);grid+='<div class="grc-heat-cell grc-heat-'+(level==='moderate'?'med':level)+'" title="Impact '+impact+' × Likelihood '+likelihood+'">'+(counts[impact+'-'+likelihood]||0)+'</div>';}}grid+='</div>';return '<div class="grc-grid"><div class="grc-span-8"><div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+esc(t('heatmap'))+'</div><div class="grc-card-sub">'+esc(t('heatDesc'))+'</div></div></div><div class="grc-card-body">'+grid+'</div></div></div><div class="grc-span-4"><div class="grc-card"><div class="grc-card-head"><div class="grc-card-title">'+esc(t('riskSummary'))+'</div></div><div class="grc-card-body">'+riskLevelSummary(d.risks)+'</div></div></div></div>';}
  function riskLevelSummary(arr){var levels=['critical','high','moderate','low'];return levels.map(function(l){var n=arr.filter(function(r){return riskLevel(r.likelihood,r.impact)===l;}).length;return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--grc-border)"><div style="flex:1">'+badge(l)+'</div><strong style="font-size:16px">'+n+'</strong></div>';}).join('');}

  function renderPolicies(){var d=loadData(),arr=d.policies.filter(matches);var rows=arr.map(function(r){return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td style="min-width:250px"><strong>'+esc(r.title)+'</strong></td><td>'+esc(r.owner||'—')+'</td><td>'+esc(r.version||'—')+'</td><td>'+esc(r.approvalDate||'—')+'</td><td>'+esc(r.reviewDate||'—')+'</td><td>'+badge(r.status||'draft')+'</td><td>'+deleteBtn('policies',r.id)+'</td></tr>';}).join('');return toolbar('add-policy','addPolicy')+cardTable(t('policies'),t('policyDesc'),'<tr><th>'+t('code')+'</th><th>'+t('policyTitle')+'</th><th>'+t('documentOwner')+'</th><th>'+t('version')+'</th><th>'+t('approvalDate')+'</th><th>'+t('reviewDate')+'</th><th>'+t('status')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyPolicy'));}

  function renderCompliance(){var d=loadData(),arr=d.requirements.filter(matches);var rows=arr.map(function(r){return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td style="min-width:260px"><strong>'+esc(r.title)+'</strong></td><td>'+esc(r.source||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+badge(r.status||'underReview')+'</td><td>'+esc(r.evidence||'—')+'</td><td>'+esc(r.lastReview||'—')+'</td><td>'+deleteBtn('requirements',r.id)+'</td></tr>';}).join('');return toolbar('add-requirement','addRequirement')+cardTable(t('compliance'),t('complianceDesc'),'<tr><th>'+t('code')+'</th><th>'+t('requirement')+'</th><th>'+t('source')+'</th><th>'+t('owner')+'</th><th>'+t('assessment')+'</th><th>'+t('evidence')+'</th><th>'+t('lastReview')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyCompliance'));}

  function renderActions(){var d=loadData(),arr=d.actions.filter(matches);var rows=arr.map(function(r){var overdue=r.status!=='completed'&&r.dueDate&&r.dueDate<today();var st=overdue?'overdue':(r.status||'open');return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td style="min-width:260px"><strong>'+esc(r.title)+'</strong></td><td>'+esc(r.linkedTo||'—')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+esc(r.priority||'—')+'</td><td>'+esc(r.dueDate||'—')+'</td><td><div style="display:flex;align-items:center;gap:7px"><div class="grc-progress"><span style="width:'+Math.max(0,Math.min(100,+r.progress||0))+'%"></span></div><span>'+esc(r.progress||0)+'%</span></div></td><td>'+badge(st)+'</td><td>'+deleteBtn('actions',r.id)+'</td></tr>';}).join('');return toolbar('add-action','addAction')+cardTable(t('actions'),t('actionDesc'),'<tr><th>'+t('code')+'</th><th>'+t('action')+'</th><th>'+t('linkedTo')+'</th><th>'+t('owner')+'</th><th>'+t('priority')+'</th><th>'+t('dueDate')+'</th><th>'+t('progress')+'</th><th>'+t('status')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyActions'));}

  function renderCommittees(){var d=loadData(),arr=d.committees.filter(matches);var rows=arr.map(function(r){return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td style="min-width:240px"><strong>'+esc(r.title)+'</strong></td><td>'+esc(r.chair||'—')+'</td><td>'+esc(r.members||0)+'</td><td>'+esc(r.nextMeeting||'—')+'</td><td>'+esc(r.openDecisions||0)+'</td><td>'+badge(r.status||'open')+'</td><td>'+deleteBtn('committees',r.id)+'</td></tr>';}).join('');return toolbar('add-committee','addCommittee')+cardTable(t('committees'),t('committeeDesc'),'<tr><th>'+t('code')+'</th><th>'+t('committee')+'</th><th>'+t('chair')+'</th><th>'+t('members')+'</th><th>'+t('nextMeeting')+'</th><th>'+t('openDecisions')+'</th><th>'+t('status')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyCommittee'));}

  function renderAudit(){var d=loadData(),arr=d.findings.filter(matches);var rows=arr.map(function(r){return '<tr><td><span class="grc-code">'+esc(r.code)+'</span></td><td>'+esc(r.area||'—')+'</td><td style="min-width:250px"><strong>'+esc(r.title)+'</strong><div style="font-size:8.5px;color:#7b8ca0;margin-top:3px">'+esc(r.recommendation||'')+'</div></td><td>'+badge(r.classification||'observation')+'</td><td>'+esc(r.owner||'—')+'</td><td>'+esc(r.dueDate||'—')+'</td><td>'+badge(r.status||'open')+'</td><td>'+deleteBtn('findings',r.id)+'</td></tr>';}).join('');return toolbar('add-finding','addFinding')+cardTable(t('audit'),t('auditDesc'),'<tr><th>'+t('code')+'</th><th>'+t('auditArea')+'</th><th>'+t('finding')+'</th><th>'+t('classification')+'</th><th>'+t('owner')+'</th><th>'+t('dueDate')+'</th><th>'+t('status')+'</th><th>'+t('actionsCol')+'</th></tr>',rows,t('emptyAudit'));}

  function renderKri(){return '<div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+esc(t('kri'))+'</div><div class="grc-card-sub">'+esc(t('kriDesc'))+'</div></div></div>'+emptyBlock('kri',t('noKri'))+'</div>';}

  function renderReports(){var d=loadData(),m=metrics(d),total=d.risks.length+d.policies.length+d.requirements.length+d.actions.length+d.committees.length+d.findings.length;return '<div class="grc-toolbar"><span class="grc-spacer"></span><button class="grc-btn ghost" data-grc-action="export">'+icon('export',14)+esc(t('export'))+'</button><button class="grc-btn ghost" data-grc-action="print">'+icon('print',14)+esc(t('print'))+'</button><button class="grc-btn ghost" data-grc-action="reset">'+icon('trash',14)+esc(t('reset'))+'</button></div><div class="grc-grid"><div class="grc-span-12"><div class="grc-card"><div class="grc-card-head"><div><div class="grc-card-title">'+esc(t('reports'))+'</div><div class="grc-card-sub">'+esc(t('reportsText'))+'</div></div></div><div class="grc-card-body"><div class="grc-grid"><div class="grc-span-3">'+metric(total,t('totalRecords'),t('localOnly'),'')+'</div><div class="grc-span-3">'+metric(m.score,t('complianceScore'),t('assessment'),'')+'</div><div class="grc-span-3">'+metric(m.openRisks,t('openRisks'),t('riskSummary'),'')+'</div><div class="grc-span-3">'+metric(m.overdue,t('overdueActions'),t('actionSummary'),'')+'</div></div></div></div></div><div class="grc-span-12">'+renderActivity(d.audit)+'</div></div>';}

  function formField(name,label,type,options,full,required){
    var h='<div class="grc-field '+(full?'full':'')+'"><label>'+esc(label)+(required?' *':'')+'</label>';
    if(type==='select')h+='<select name="'+name+'">'+options.map(function(o){return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>';}).join('')+'</select>';
    else if(type==='textarea')h+='<textarea name="'+name+'"></textarea>';
    else h+='<input type="'+(type||'text')+'" name="'+name+'" '+(required?'required':'')+'>';
    return h+'</div>';
  }
  function statusOptions(keys){return keys.map(function(k){return[k,t(k)];});}

  function openForm(type){
    if(!isSuperAdmin())return showComingSoon();
    var modal=document.createElement('div');modal.className='grc-modal-backdrop';modal.id='grcFormModal';
    var titleKey={risk:'addRisk',policy:'addPolicy',requirement:'addRequirement',action:'addAction',committee:'addCommittee',finding:'addFinding'}[type];
    var fields='';
    if(type==='risk')fields=formField('title',t('name'),'text',null,true,true)+formField('category',t('category'),'text',null,false,true)+formField('owner',t('owner'),'text',null,false,true)+formField('likelihood',t('likelihood'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],false)+formField('impact',t('impact'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],false)+formField('dueDate',t('dueDate'),'date',null,false)+formField('status',t('status'),'select',statusOptions(['open','inProgress','closed']),false)+formField('controls',t('controls'),'textarea',null,true)+formField('treatment',t('treatment'),'textarea',null,true);
    if(type==='policy')fields=formField('title',t('policyTitle'),'text',null,true,true)+formField('owner',t('documentOwner'),'text',null,false,true)+formField('version',t('version'),'text',null,false)+formField('approvalDate',t('approvalDate'),'date',null,false)+formField('reviewDate',t('reviewDate'),'date',null,false)+formField('status',t('status'),'select',statusOptions(['draft','underReview','approved','expired']),false);
    if(type==='requirement')fields=formField('title',t('requirement'),'textarea',null,true,true)+formField('source',t('source'),'text',null,false,true)+formField('owner',t('owner'),'text',null,false,true)+formField('status',t('assessment'),'select',statusOptions(['underReview','compliant','partiallyCompliant','nonCompliant','notApplicable']),false)+formField('evidence',t('evidence'),'text',null,false)+formField('lastReview',t('lastReview'),'date',null,false);
    if(type==='action')fields=formField('title',t('action'),'textarea',null,true,true)+formField('linkedTo',t('linkedTo'),'text',null,false)+formField('owner',t('owner'),'text',null,false,true)+formField('priority',t('priority'),'select',statusOptions(['low','moderate','high','critical']),false)+formField('dueDate',t('dueDate'),'date',null,false)+formField('progress',t('progress'),'number',null,false)+formField('status',t('status'),'select',statusOptions(['open','inProgress','completed']),false);
    if(type==='committee')fields=formField('title',t('committee'),'text',null,true,true)+formField('chair',t('chair'),'text',null,false,true)+formField('members',t('members'),'number',null,false)+formField('nextMeeting',t('nextMeeting'),'date',null,false)+formField('openDecisions',t('openDecisions'),'number',null,false)+formField('status',t('status'),'select',statusOptions(['open','closed']),false);
    if(type==='finding')fields=formField('area',t('auditArea'),'text',null,false,true)+formField('title',t('finding'),'textarea',null,true,true)+formField('classification',t('classification'),'select',statusOptions(['major','minor','observation']),false)+formField('owner',t('owner'),'text',null,false,true)+formField('dueDate',t('dueDate'),'date',null,false)+formField('status',t('status'),'select',statusOptions(['open','inProgress','closed']),false)+formField('recommendation',t('recommendation'),'textarea',null,true);
    modal.innerHTML='<div class="grc-modal"><div class="grc-modal-head"><div class="grc-modal-title">'+esc(t(titleKey))+'</div><button class="grc-close" type="button">×</button></div><form id="grcEntityForm"><div class="grc-modal-body"><div class="grc-form-grid">'+fields+'</div></div><div class="grc-modal-foot"><button class="grc-btn ghost" type="button" data-close>'+esc(t('cancel'))+'</button><button class="grc-btn primary" type="submit">'+esc(t('save'))+'</button></div></form></div>';
    document.body.appendChild(modal);
    function close(){modal.remove();}
    modal.querySelector('.grc-close').onclick=close;modal.querySelector('[data-close]').onclick=close;modal.addEventListener('click',function(e){if(e.target===modal)close();});
    modal.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var fd=new FormData(e.currentTarget),obj={id:uid(type.toUpperCase()),createdAt:nowIso()};fd.forEach(function(v,k){obj[k]=String(v).trim();});if(!obj.title){toast(t('required'));return;}saveEntity(type,obj);close();renderViewBodyOnly();});
  }

  function nextCode(prefix,arr){var max=0;arr.forEach(function(x){var m=String(x.code||'').match(/(\d+)$/);if(m)max=Math.max(max,+m[1]);});return prefix+'-'+String(max+1).padStart(3,'0');}
  function saveEntity(type,obj){var d=loadData(),map={risk:['risks','RSK'],policy:['policies','POL'],requirement:['requirements','CMP'],action:['actions','ACT'],committee:['committees','COM'],finding:['findings','AUD']},cfg=map[type];if(!cfg)return;obj.code=nextCode(cfg[1],d[cfg[0]]);if(type==='action'){obj.progress=Math.max(0,Math.min(100,+obj.progress||0));}d[cfg[0]].unshift(obj);saveData(d);addAudit('GRC_'+type.toUpperCase()+'_ADD',obj.code+' — '+obj.title);toast(t('saved'));}
  function deleteRecord(collection,id){if(!isSuperAdmin())return showComingSoon();if(!window.confirm(t('confirmDelete')))return;var d=loadData(),row=(d[collection]||[]).find(function(x){return x.id===id;});d[collection]=(d[collection]||[]).filter(function(x){return x.id!==id;});saveData(d);addAudit('GRC_RECORD_DELETE',(row&&row.code?row.code+' — ':'')+(row&&row.title?row.title:id));toast(t('deleted'));renderViewBodyOnly();}
  function resetData(){if(!window.confirm(t('confirmReset')))return;saveData(emptyData());toast(t('resetDone'));renderViewBodyOnly();}

  function exportJson(){var d=loadData(),blob=new Blob([JSON.stringify({version:VERSION,exportedAt:nowIso(),data:d},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='QUMC_GRC_Prototype_'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);addAudit('GRC_EXPORT','Prototype JSON exported');}
  function printView(){var root=document.getElementById('qumcGrcRoot');if(!root)return;var w=window.open('','_blank','width=1200,height=800');if(!w)return;w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(t('title'))+'</title><link rel="stylesheet" href="css/grc.css"><style>body{background:#fff!important}#qumcGrcRoot{position:relative!important;height:auto!important;min-height:100vh}.grc-sidebar,.grc-top-actions,.grc-back-btn,.grc-toolbar,.grc-banner{display:none!important}.grc-content{overflow:visible!important}.grc-main{overflow:visible!important}</style></head><body>'+root.outerHTML+'</body></html>');w.document.close();setTimeout(function(){w.focus();w.print();},500);addAudit('GRC_PRINT','Printed view: '+state.view);}
  function formatDateTime(v){try{return new Date(v).toLocaleString(state.lang==='ar'?'ar-SA':'en-GB');}catch(_){return v||'—';}}
  function toast(msg){var old=document.querySelector('.grc-toast');if(old)old.remove();var el=document.createElement('div');el.className='grc-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove();},2600);}

  function hideExistingLayers(){['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay','_grcComingSoon','_grcComingSoonV1'].forEach(function(id){var el=document.getElementById(id);if(el){if(id.indexOf('ComingSoon')>-1)el.remove();else el.style.display='none';}});}
  function openGrc(){
    if(!isSuperAdmin()){showComingSoon();return false;}
    hideExistingLayers();document.body.classList.remove('auth-mode','portal-mode','dashboard-mode','modal-mode');document.body.classList.add('grc-mode');state.lang=detectLang();state.view='dashboard';renderShell();addAudit('GRC_OPEN','Super Admin opened GRC prototype');return true;
  }
  function backToPortal(){var root=document.getElementById('qumcGrcRoot');if(root)root.remove();document.body.classList.remove('grc-mode','dashboard-mode','auth-mode','modal-mode');document.body.classList.add('portal-mode');try{if(typeof window._backToPortal==='function')window._backToPortal();}catch(_){ }setTimeout(function(){var bg=document.getElementById('_bgLayer'),po=document.getElementById('_portalOverlay');if(bg)bg.style.display='block';if(po)po.style.display='flex';},20);}

  function showComingSoon(){
    var old=document.getElementById('_grcComingSoonV1');if(old)old.remove();var ar=detectLang()==='ar';state.lang=ar?'ar':'en';var el=document.createElement('div');el.id='_grcComingSoonV1';el.setAttribute('dir',ar?'rtl':'ltr');
    el.innerHTML='<div class="grc-coming-card"><div class="grc-coming-icon">'+icon('building',31)+'</div><div class="grc-coming-title">GRC</div><div class="grc-coming-sub">'+esc(t('title'))+'</div><div class="grc-coming-pill">'+esc(t('comingSoon'))+'</div><div class="grc-coming-text">'+esc(t('comingText'))+'<br><strong style="color:rgba(255,255,255,.8)">'+esc(t('accessRestricted'))+'</strong></div><button class="grc-coming-btn" type="button">'+esc(t('returnPortal'))+'</button></div>';
    document.body.appendChild(el);el.querySelector('button').onclick=function(){el.remove();};
  }

  function installPortalHook(){
    var fn=window._selectPortal;if(typeof fn!=='function'||fn.__qumcGrcAccessV1)return false;
    var original=fn;
    var wrapped=async function(portal){if(norm(portal)==='grc')return openGrc();return original.apply(this,arguments);};
    wrapped.__qumcGrcAccessV1=true;wrapped.__qumcOriginal=original;window._selectPortal=wrapped;return true;
  }
  function boot(){installPortalHook();var tries=0,timer=setInterval(function(){tries++;installPortalHook();if(tries>=60)clearInterval(timer);},500);}

  window.QUMCGRC={version:VERSION,open:openGrc,back:backToPortal,showComingSoon:showComingSoon,isSuperAdmin:isSuperAdmin,resetPrototype:function(){saveData(emptyData());}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();window.addEventListener('load',boot);
})();
