/* ======================================================================
   QUMC GRC Workspace — Super Admin Preview
   Version: 2026-07-05 Governance/Risk Registers

   Scope
   - Executive Command: Governance + Risk/Incident/Code summaries.
   - Governance: every FMS department is rendered in a dedicated stacked
     section with policy, plan, emergency-plan and form dashboards/registers.
   - Risk Management: every FMS department is rendered in a dedicated stacked
     section with risk, incident and emergency-code dashboards/registers.
   - FMS Manuals & Guidelines: dedicated top-level page.
   - Super Admin only. All other roles receive Coming Soon.
   - Preview records remain in localStorage until Firestore workflow is approved.
   ====================================================================== */
(function(){
  'use strict';

  var STORAGE_KEY='qumc_grc_workspace_preview_v1';
  var STATE_VERSION=4;
  var activeTab='executive';
  var app=null;

  var labels={
    en:{
      app:'Governance, Risk & Compliance',sub:'Facilities & Safety Division · Governance & Performance Department',preview:'Super Admin Preview',back:'Back to Portal',
      executive:'Executive Command',governance:'Governance',manuals:'FMS Manuals & Guidelines',risk:'Risk Management',compliance:'Compliance',audit:'Audit & Assurance',actions:'Action Plans',documents:'Documents & Records',reports:'Reports & Archive',
      executiveTitle:'Executive Command',executiveDesc:'A consolidated view of governance records, risks, incidents and emergency codes across the Facilities & Safety Division.',
      governanceTitle:'Governance',governanceDesc:'Policies, plans, emergency plans and approved forms, monitored for the division and for every department.',
      riskTitle:'Risk Management',riskDesc:'Department-level oversight of risks, incidents and emergency codes with dedicated operational registers.',
      manualsTitle:'FMS Manuals & Guidelines',manualsDesc:'A controlled register for Facilities & Safety manuals, guidelines and approved operating references.',
      governanceOverview:'Governance Overview',riskOverview:'Risk, Incident & Code Overview',departmentView:'Department Sections',departmentSectionsDesc:'Each FMS department is displayed in a dedicated section, aligned with the Performance department view.',divisionOverview:'FMS Division Overview',allDepartments:'All FMS Departments',departmentRecords:'Department Records',
      executiveSnapshot:'Executive Portfolio Snapshot',executiveSnapshotDesc:'Live consolidated indicators across Governance and Risk Management.',governanceRecords:'Governance Records',governanceStatusChart:'Governance Records Status',governanceVolumeChart:'Records by Governance Area',riskDistributionChart:'Risk Level Distribution',incidentTrendChart:'Incident Trend by Year',codeOutcomeChart:'Emergency Code Outcomes',dueThisYear:'Due This Year',other:'Other',attention:'Needs Attention',
      policies:'Policies',plans:'Plans',emergencyPlans:'Emergency Plans',forms:'Forms',
      totalPolicies:'Total Policies',openPolicies:'Active Policies',expiredPolicies:'Expired Policies',expiringThisYear:'Expiring This Year',expiredPolicyRate:'Expired Policies Rate',
      totalPlans:'Total Plans',activePlans:'Active Plans',expiredPlans:'Expired Plans',totalEmergencyPlans:'Total Emergency Plans',activeEmergencyPlans:'Active Emergency Plans',expiredEmergencyPlans:'Expired Emergency Plans',
      totalForms:'Total Forms',activeForms:'Active Forms',expiredForms:'Expired Forms',
      policyRegister:'Policy Register',planRegister:'Plan Register',emergencyPlanRegister:'Emergency Plan Register',formRegister:'Approved Forms Register',manualRegister:'Manuals & Guidelines Register',
      totalManuals:'Total Manuals',activeManuals:'Active Manuals',expiredManuals:'Expired Manuals',manualsDue:'Due for Review This Year',
      orgStructure:'Organizational Structure',orgStructureDesc:'FMS reporting lines, departments and process ownership.',raci:'RACI Matrix',raciDesc:'Responsibility, accountability, consultation and information mapping.',annualPlan:'Annual Operational Plan',annualPlanDesc:'Annual priorities, initiatives, owners and milestones.',
      totalRisks:'Total Risks',openRisks:'Open Risks',closedRisks:'Closed Risks',closedRiskRate:'Closed Risks Rate',criticalRisks:'Critical Risks',highRisks:'High Risks',mediumRisks:'Medium Risks',lowRisks:'Low Risks',highCriticalRate:'High & Critical Risks Rate',
      incidents:'Incidents',totalIncidents:'Total Incidents',openIncidents:'Open Incidents',closedIncidents:'Closed Incidents',closedIncidentRate:'Closed Incidents Rate',incidentsByYear:'Incidents by Year',
      codes:'Emergency Codes',totalCodes:'Total Codes',realCodes:'Real Code',drillCodes:'Drill Code',successfulCodes:'Successful Code',failedCodes:'Failed Code',failedCodeRate:'Failed Codes Rate',successfulDrills:'Successful Code',failedDrills:'Failed Code',successVsFailed:'Successful vs Failed',
      riskRegister:'Risk Register',incidentRegister:'Incident Register',codeRegister:'Emergency Code Register',
      addPolicy:'Add Policy',addPlan:'Add Plan',addEmergencyPlan:'Add Emergency Plan',addForm:'Add Form',addManual:'Add Manual / Guideline',addRisk:'Add Risk',addIncident:'Add Incident',addCode:'Add Code',
      id:'ID',name:'Name',code:'Code',issueDate:'Issue Date',policyId:'Policy ID',policyName:'Policy Name',planId:'Plan ID',planName:'Plan Name',emergencyPlanId:'Plan ID',emergencyPlanName:'Emergency Plan',formId:'Form ID',formName:'Form Name',manualId:'Manual ID',manualName:'Manual / Guideline',
      department:'Department',owner:'Owner',effectiveDate:'Effective Date',startDate:'Start Date',expiryDate:'Expiry Date',reviewDate:'Review Date',version:'Version',status:'Status',category:'Category',actionsCol:'Actions',
      riskId:'Risk ID',riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',riskScore:'Risk Score',riskLevel:'Risk Level',controlType:'Current Risk Control Type',actionStatus:'Action Status',
      incidentId:'Incident ID',date:'Date',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required (Yes/No)',responsibleDept:'Responsible Dept.',
      codeNumber:'Number',type:'Type',location:'Location',closeDateTime:'Close Date Time',
      total:'Total',open:'Open',closed:'Closed',active:'Active',expired:'Expired',draft:'Draft',underReview:'Under Review',planned:'Planned',archived:'Archived',inProgress:'In Progress',completed:'Completed',
      critical:'Critical',high:'High',medium:'Medium',low:'Low',successful:'Successful',failed:'Failed',real:'Real',drill:'Drill',yes:'Yes',no:'No',
      preventive:'Preventive',detective:'Detective',corrective:'Corrective',directive:'Directive',noControl:'No Current Control',
      operational:'Operational',facility:'Facility',safetyRisk:'Safety',complianceRisk:'Compliance',contractor:'Contractor',emergencyPreparedness:'Emergency Preparedness',
      maintenance:'Maintenance',safety:'Safety',housekeeping:'Housekeeping',projects:'Project Management',governanceDept:'Governance & Performance',allFms:'All FMS',
      noRecords:'No records added yet',noRecordsSub:'Use the Add button to start the preview register.',localNote:'Preview records are saved on this device only.',draftWorkspace:'Draft workspace',
      recordDetails:'Record Details',close:'Close',delete:'Delete',confirmDelete:'Delete this preview record?',cancel:'Cancel',save:'Save Record',required:'Please complete all required fields.',
      percentage:'Rate',records:'Records',clickToView:'Click to view records',year:'Year',count:'Count',noMatching:'No matching records.',
      complianceTitle:'Compliance',complianceDesc:'Regulatory requirements, evidence and corrective actions.',auditTitle:'Audit & Assurance',auditDesc:'Audit findings, recommendations and closure evidence.',actionsTitle:'Action Plans',actionsDesc:'Actions arising from risks, incidents, compliance gaps and reviews.',documentsTitle:'Documents & Records',documentsDesc:'Supporting controlled documents and historical records.',reportsTitle:'Reports & Archive',reportsDesc:'Quarterly, annual and executive reporting areas.',
      comingTitle:'GRC Module',comingSub:'The Governance, Risk & Compliance workspace is currently under development and is available to the Super Admin preview only.',comingSoon:'Coming Soon',
      authority:'Authority / Standard',requirement:'Requirement',severity:'Severity',source:'Source',progress:'Progress Rate %',title:'Title / Description',dueDate:'Due Date',
      addRequirement:'Add Requirement',addFinding:'Add Finding',addAction:'Add Action',addDocument:'Add Document',compliant:'Compliant',partial:'Partially Compliant',nonCompliant:'Non-Compliant',notApplicable:'Not Applicable',major:'Major',minor:'Minor',observation:'Observation',pendingVerification:'Pending Verification',pendingApproval:'Pending Approval'
    },
    ar:{
      app:'الحوكمة والمخاطر والالتزام',sub:'إدارة المرافق والسلامة · قسم الحوكمة والأداء',preview:'معاينة السوبر أدمن',back:'العودة للبوابة',
      executive:'القيادة التنفيذية',governance:'الحوكمة',manuals:'أدلة وإرشادات إدارة المرافق والسلامة',risk:'إدارة المخاطر',compliance:'الالتزام',audit:'التدقيق والتوكيد',actions:'خطط العمل',documents:'الوثائق والسجلات',reports:'التقارير والأرشيف',
      executiveTitle:'القيادة التنفيذية',executiveDesc:'نظرة موحدة على سجلات الحوكمة والمخاطر والحوادث وأكواد الطوارئ في إدارة المرافق والسلامة.',
      governanceTitle:'الحوكمة',governanceDesc:'متابعة السياسات والخطط وخطط الطوارئ والنماذج المعتمدة على مستوى الإدارة وكل قسم.',
      riskTitle:'إدارة المخاطر',riskDesc:'متابعة المخاطر والحوادث وأكواد الطوارئ لكل قسم مع سجلات تشغيلية مستقلة.',
      manualsTitle:'أدلة وإرشادات إدارة المرافق والسلامة',manualsDesc:'سجل منضبط لأدلة وإرشادات إدارة المرافق والسلامة والمراجع التشغيلية المعتمدة.',
      governanceOverview:'نظرة الحوكمة',riskOverview:'نظرة المخاطر والحوادث والأكواد',departmentView:'أقسام الإدارة',departmentSectionsDesc:'يظهر كل قسم من أقسام إدارة المرافق والسلامة في قسم مستقل وبنفس فكرة عرض الأقسام في الأداء.',divisionOverview:'نظرة شاملة لإدارة المرافق والسلامة',allDepartments:'جميع أقسام إدارة المرافق والسلامة',departmentRecords:'سجلات القسم',
      executiveSnapshot:'ملخص المحفظة التنفيذية',executiveSnapshotDesc:'مؤشرات موحدة ومحدثة للحوكمة وإدارة المخاطر.',governanceRecords:'سجلات الحوكمة',governanceStatusChart:'حالة سجلات الحوكمة',governanceVolumeChart:'السجلات حسب مجال الحوكمة',riskDistributionChart:'توزيع مستويات المخاطر',incidentTrendChart:'اتجاه الحوادث حسب السنة',codeOutcomeChart:'نتائج أكواد الطوارئ',dueThisYear:'تستحق خلال السنة',other:'أخرى',attention:'بحاجة للمتابعة',
      policies:'السياسات',plans:'الخطط',emergencyPlans:'خطط الطوارئ',forms:'النماذج',
      totalPolicies:'عدد السياسات',openPolicies:'السياسات السارية',expiredPolicies:'السياسات المنتهية',expiringThisYear:'ستنتهي خلال السنة الحالية',expiredPolicyRate:'معدل السياسات المنتهية',
      totalPlans:'عدد الخطط',activePlans:'الخطط السارية',expiredPlans:'الخطط المنتهية',totalEmergencyPlans:'عدد خطط الطوارئ',activeEmergencyPlans:'خطط الطوارئ السارية',expiredEmergencyPlans:'خطط الطوارئ المنتهية',
      totalForms:'عدد النماذج',activeForms:'النماذج السارية',expiredForms:'النماذج المنتهية',
      policyRegister:'سجل السياسات',planRegister:'سجل الخطط',emergencyPlanRegister:'سجل خطط الطوارئ',formRegister:'سجل النماذج المعتمدة',manualRegister:'سجل الأدلة والإرشادات',
      totalManuals:'عدد الأدلة',activeManuals:'الأدلة السارية',expiredManuals:'الأدلة المنتهية',manualsDue:'مستحقة للمراجعة هذا العام',
      orgStructure:'الهيكل التنظيمي',orgStructureDesc:'خطوط الإشراف والأقسام وملاك العمليات في إدارة المرافق والسلامة.',raci:'مصفوفة RACI',raciDesc:'توزيع المسؤولية والمساءلة والاستشارة والإحاطة.',annualPlan:'الخطة التشغيلية السنوية',annualPlanDesc:'الأولويات والمبادرات والملاك والمراحل السنوية.',
      totalRisks:'عدد المخاطر',openRisks:'المخاطر المفتوحة',closedRisks:'المخاطر المغلقة',closedRiskRate:'معدل المخاطر المغلقة',criticalRisks:'المخاطر الحرجة',highRisks:'المخاطر العالية',mediumRisks:'المخاطر المتوسطة',lowRisks:'المخاطر المنخفضة',highCriticalRate:'معدل المخاطر العالية والحرجة',
      incidents:'الحوادث',totalIncidents:'عدد الحوادث',openIncidents:'الحوادث المفتوحة',closedIncidents:'الحوادث المغلقة',closedIncidentRate:'معدل الحوادث المغلقة',incidentsByYear:'الحوادث حسب السنة',
      codes:'أكواد الطوارئ',totalCodes:'إجمالي الأكواد',realCodes:'الكود الفعلي',drillCodes:'الكود التدريبي',successfulCodes:'الكود الناجح',failedCodes:'الكود غير الناجح',failedCodeRate:'معدل الأكواد غير الناجحة',successfulDrills:'الكود الناجح',failedDrills:'الكود غير الناجح',successVsFailed:'الناجحة مقابل غير الناجحة',
      riskRegister:'سجل المخاطر',incidentRegister:'سجل الحوادث',codeRegister:'سجل أكواد الطوارئ',
      addPolicy:'إضافة سياسة',addPlan:'إضافة خطة',addEmergencyPlan:'إضافة خطة طوارئ',addForm:'إضافة نموذج',addManual:'إضافة دليل / إرشاد',addRisk:'إضافة مخاطرة',addIncident:'إضافة حادث',addCode:'إضافة كود',
      id:'الرقم',name:'الاسم',code:'الرمز',issueDate:'تاريخ الإصدار',policyId:'رقم السياسة',policyName:'اسم السياسة',planId:'رقم الخطة',planName:'اسم الخطة',emergencyPlanId:'رقم الخطة',emergencyPlanName:'خطة الطوارئ',formId:'رقم النموذج',formName:'اسم النموذج',manualId:'رقم الدليل',manualName:'اسم الدليل / الإرشاد',
      department:'القسم',owner:'المالك',effectiveDate:'تاريخ السريان',startDate:'تاريخ البداية',expiryDate:'تاريخ الانتهاء',reviewDate:'تاريخ المراجعة',version:'الإصدار',status:'الحالة',category:'التصنيف',actionsCol:'الإجراءات',
      riskId:'رقم الخطر',riskIdentified:'الخطر المحدد',riskCategory:'تصنيف الخطر',likelihood:'الاحتمالية',impact:'الأثر',riskScore:'درجة الخطر',riskLevel:'مستوى الخطر',controlType:'نوع الضوابط الحالية',actionStatus:'حالة الإجراء',
      incidentId:'رقم الحادث',date:'التاريخ',contributingFactors:'العوامل المساهمة',investigationRequired:'هل يتطلب تحقيقاً؟ (نعم/لا)',responsibleDept:'القسم المسؤول',
      codeNumber:'الرقم',type:'النوع',location:'الموقع',closeDateTime:'تاريخ ووقت الإغلاق',
      total:'الإجمالي',open:'مفتوح',closed:'مغلق',active:'ساري',expired:'منتهي',draft:'مسودة',underReview:'تحت المراجعة',planned:'مخطط',archived:'مؤرشف',inProgress:'قيد التنفيذ',completed:'مكتمل',
      critical:'حرج',high:'عالٍ',medium:'متوسط',low:'منخفض',successful:'ناجح',failed:'غير ناجح',real:'فعلي',drill:'تدريبي',yes:'نعم',no:'لا',
      preventive:'وقائي',detective:'كاشف',corrective:'تصحيحي',directive:'توجيهي',noControl:'لا توجد ضوابط حالية',
      operational:'تشغيلي',facility:'مرافق',safetyRisk:'سلامة',complianceRisk:'التزام',contractor:'مقاولون',emergencyPreparedness:'استعداد للطوارئ',
      maintenance:'الصيانة',safety:'السلامة',housekeeping:'النظافة',projects:'إدارة المشاريع',governanceDept:'الحوكمة والأداء',allFms:'إدارة المرافق والسلامة',
      noRecords:'لا توجد سجلات مضافة',noRecordsSub:'استخدم زر الإضافة لبدء تجربة السجل.',localNote:'تُحفظ سجلات المعاينة في هذا الجهاز فقط.',draftWorkspace:'مساحة عمل تجريبية',
      recordDetails:'تفاصيل السجلات',close:'إغلاق',delete:'حذف',confirmDelete:'هل تريد حذف سجل المعاينة؟',cancel:'إلغاء',save:'حفظ السجل',required:'يرجى تعبئة جميع الحقول المطلوبة.',
      percentage:'المعدل',records:'السجلات',clickToView:'اضغط لعرض السجلات',year:'السنة',count:'العدد',noMatching:'لا توجد سجلات مطابقة.',
      complianceTitle:'الالتزام',complianceDesc:'المتطلبات النظامية والأدلة والإجراءات التصحيحية.',auditTitle:'التدقيق والتوكيد',auditDesc:'ملاحظات التدقيق والتوصيات وأدلة الإغلاق.',actionsTitle:'خطط العمل',actionsDesc:'الإجراءات الناتجة من المخاطر والحوادث وفجوات الالتزام والمراجعات.',documentsTitle:'الوثائق والسجلات',documentsDesc:'الوثائق المساندة والسجلات التاريخية المنضبطة.',reportsTitle:'التقارير والأرشيف',reportsDesc:'مساحات التقارير الربعية والسنوية والتنفيذية.',
      comingTitle:'قسم GRC',comingSub:'قسم الحوكمة والمخاطر والالتزام تحت التطوير ومتاح حالياً لمعاينة السوبر أدمن فقط.',comingSoon:'قريباً',
      authority:'الجهة / المعيار',requirement:'المتطلب',severity:'الخطورة',source:'المصدر',progress:'معدل الإنجاز %',title:'العنوان / الوصف',dueDate:'تاريخ الاستحقاق',
      addRequirement:'إضافة متطلب',addFinding:'إضافة ملاحظة',addAction:'إضافة إجراء',addDocument:'إضافة وثيقة',compliant:'ملتزم',partial:'ملتزم جزئياً',nonCompliant:'غير ملتزم',notApplicable:'لا ينطبق',major:'جوهري',minor:'بسيط',observation:'ملاحظة',pendingVerification:'بانتظار التحقق',pendingApproval:'بانتظار الاعتماد'
    }
  };

  var modules=[
    {id:'executive',icon:'⌂'},
    {id:'governance',icon:'▦',count:'governance'},
    {id:'risk',icon:'◇',count:'risk'},
    {id:'compliance',icon:'✓',count:'compliance'},
    {id:'audit',icon:'◎',count:'audits'},
    {id:'actions',icon:'→',count:'actions'},
    {id:'documents',icon:'▣',count:'documents'},
    {id:'reports',icon:'▥'},
    {id:'manuals',icon:'▤',count:'manuals'}
  ];

  var departments=['allFms','maintenance','safety','housekeeping','projects','governanceDept'];
  var departmentOrder=departments.slice(1);
  var departmentMeta={
    maintenance:{abbr:'MNT',color:'#60A5FA',ink:'#2563EB',soft:'rgba(96,165,250,.14)'},
    safety:{abbr:'SAF',color:'#F87171',ink:'#DC2626',soft:'rgba(248,113,113,.14)'},
    housekeeping:{abbr:'HK',color:'#34D399',ink:'#15803D',soft:'rgba(52,211,153,.14)'},
    projects:{abbr:'PMD',color:'#FBBF24',ink:'#B45309',soft:'rgba(251,191,36,.18)'},
    governanceDept:{abbr:'G&P',color:'#1E3E6A',ink:'#1E3E6A',soft:'rgba(30,62,106,.11)'}
  };

  /* Imported from rrrisk.xlsx — department is derived from the Risk ID prefix. */
  var RISK_REGISTER_SEED=[{"id":"SAF 01","riskIdentified":"Presence of anesthetic gases& equipment which act source of fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 02","riskIdentified":"storage of flamable items& hazardouse chemical which source of fire","riskCategory":"Hazard / Environmental","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 03","riskIdentified":"fire in the medical record","riskCategory":"Hazard / Environmental","likelihood":2,"impact":2,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 04","riskIdentified":"Inadequate cleaning of grease filters and hoods near natural gas lines may leads to oil-ignited kitchen fires during cooking operations that may cause service interruption in food supply and threat to staff and visitor safety.","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 05","riskIdentified":"electrical spark& flamable solar  as source fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 06","riskIdentified":"electrical sparks from equipment produce source of fire","riskCategory":"Hazard / Environmental","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 07","riskIdentified":"Overheating and electrical faults from equipment which may act as source of fire& connected to electricty","riskCategory":"Hazard / Environmental","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 08","riskIdentified":"explosion of medical gase& presensice of flamable gases","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 09","riskIdentified":"lack of awarness of staff about how to deal in case of presence of fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 10","riskIdentified":"Smoking inside the hospital","riskCategory":"Hazard / Environmental","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 11","riskIdentified":"explosuion of natural gase line","riskCategory":"Hazard / Environmental","likelihood":2,"impact":1,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 12","riskIdentified":"fire in the main disel tank","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 13","riskIdentified":"Fire in parking area","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"safety"},{"id":"SAF 14","riskIdentified":"Poor coordination in emergency responses","riskCategory":"Operational","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 15","riskIdentified":"Slip, trip, and fall hazards","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 16","riskIdentified":"Natural disasters (e.g., earthquakes, floods)","riskCategory":"Hazard / Environmental","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 17","riskIdentified":"Hazardous chemical spills","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 18","riskIdentified":"Improper disposal of expired medications or chemical containers","riskCategory":"Hazard / Environmental","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 19","riskIdentified":"Lack of evacuation maps in departments","riskCategory":"Strategic","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 20","riskIdentified":"No Fm-200 in some rooms","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"SAF 21","riskIdentified":"No water availabilty in fire OPD","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"SAF 22","riskIdentified":"failure to inspect fire extinguishing  during preventive rounds","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Risk Avoidance","actionStatus":"closed","department":"safety"},{"id":"SAF 23","riskIdentified":"lack of sufficient fire extinguishers in some places","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Risk Acceptance","actionStatus":"closed","department":"safety"},{"id":"SAF 24","riskIdentified":"Improper storage of hazardous chemical","riskCategory":"Hazard / Environmental","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"closed","department":"safety"},{"id":"SAF 25","riskIdentified":"Operational failure of the fire alarm system","riskCategory":"Hazard / Environmental","likelihood":4,"impact":3,"riskScore":12,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"SAF 26","riskIdentified":"Failure of Firefighting System (Sprinklers / Pumps / Hose Reel)","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"MNT 01","riskIdentified":"Operational failure of the Air Handling Unit (AHU) in critical zones.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"maintenance"},{"id":"MNT 02","riskIdentified":"Interruption or depletion of medical gas supply.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"maintenance"},{"id":"MNT 03","riskIdentified":"Main electrical power supply failure.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Risk Transfer","actionStatus":"closed","department":"maintenance"},{"id":"MNT 04","riskIdentified":"Interruption or failure of the main water supply network","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Risk Transfer","actionStatus":"closed","department":"maintenance"},{"id":"HK01","riskIdentified":"Slip and fall hazards due to wet surfaces","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK02","riskIdentified":"Risk of infection transmission via contaminated surfaces or equipment","riskCategory":"Hazard / Environmental","likelihood":4,"impact":3,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK03","riskIdentified":"Ergonomic injuries from handling heavy cleaning equipment","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK04","riskIdentified":"Spills of liquids or beverages on corridors and floors","riskCategory":"Hazard / Environmental","likelihood":5,"impact":4,"riskScore":20,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK05","riskIdentified":"Neglecting the cleaning of electrical and mechanical rooms","riskCategory":"Operational","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK06","riskIdentified":"Accidental exposure to hazardous medical waste","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK07","riskIdentified":"Risk of cross-contamination via contaminated cleaning tools","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK08","riskIdentified":"Chemical burns from hazardous cleaning agents","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK09","riskIdentified":"Electrical hazards during the operation of cleaning equipment","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK10","riskIdentified":"Inhalation of hazardous chemical fumes and toxic vapors","riskCategory":"Hazard / Environmental","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK11","riskIdentified":"Airborne dust and particulate accumulation in the workplace","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK12","riskIdentified":"Spread of biological contaminants in the facility environment","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK13","riskIdentified":"Improper disposal and accumulation of regular waste","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK14","riskIdentified":"Risk of staff non-compliance with trained cleaning policies","riskCategory":"Human Capital","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK15","riskIdentified":"Use of expired cleaning and disinfection materials","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"housekeeping"},{"id":"HK16","riskIdentified":"Contamination risks from shared cleaning equipment between departments","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK17","riskIdentified":"Fall hazards when cleaning elevated areas","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK18","riskIdentified":"Accidental exposure to sharp medical needles and contaminated waste","riskCategory":"Operational","likelihood":4,"impact":4,"riskScore":16,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK19","riskIdentified":"Risk of hazardous cleaning detergent chemical spills or leaks","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND01","riskIdentified":"ccidental exposure to hazardous chemical products","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND 02","riskIdentified":"Ergonomic and physical injuries from manual lifting","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND03","riskIdentified":"Risk of infection transmission among laundry staff","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND04","riskIdentified":"Exposure to high heat and steam from laundry machinery","riskCategory":"Hazard / Environmental","likelihood":2,"impact":2,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Reduction","actionStatus":"closed","department":"housekeeping"},{"id":"LUND05","riskIdentified":"Mishandling of contaminated bio-hazardous fabrics","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND06","riskIdentified":"Staff exposure to biological infections","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND07","riskIdentified":"Incomplete or improper drying of laundered clothes","riskCategory":"Operational","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND08","riskIdentified":"Cross-washing of contaminated and clean linens","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND 09","riskIdentified":"Chemical leakages or spills from laundry machinery","riskCategory":"Operational","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND10","riskIdentified":"Improper handling of hot water in washing machinery","riskCategory":"Operational","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND11","riskIdentified":"Accumulation of dust and pathogens on curtains","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND12","riskIdentified":"Use of extreme temperatures or harsh cleaning chemicals.","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND13","riskIdentified":"Foul odors due to insufficient washing or prolonged dampness","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND14","riskIdentified":"Inhalation of toxic chemical gases or foul vapors from laundry","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND15","riskIdentified":"High noise levels and severe vibrations from heavy machinery","riskCategory":"Operational","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"open","department":"housekeeping"},{"id":"PM 01","riskIdentified":"Project completion delays","riskCategory":"Operational","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"closed","department":"projects"},{"id":"PM 02","riskIdentified":"Contractor working without obtaining required permits","riskCategory":"Operational","likelihood":5,"impact":1,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 03","riskIdentified":"Project scope changes by the end-user","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 04","riskIdentified":"Substitution of approved project materials","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 05","riskIdentified":"Unauthorized onboarding or entry of contractors without project department knowledge.","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 06","riskIdentified":"Use of unauthorized or restricted materials by the contractor.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"}];


  function defaultState(){
    return{
      version:STATE_VERSION,
      policies:[],plans:[],emergencyPlans:[],forms:[],manuals:[],
      risks:[],incidents:[],codes:[],
      compliance:[],audits:[],actions:[],documents:[],
      updatedAt:new Date().toISOString()
    };
  }

  function copyRecord(r){var o={};Object.keys(r||{}).forEach(function(k){o[k]=r[k];});return o;}
  function normalizeStatus(v){
    var raw=String(v||'').trim();
    var key=raw.toLowerCase().replace(/[\s_-]+/g,'');
    var map={
      openstatus:'open',open:'open',closed:'closed',active:'active',expired:'expired',
      treatment:'inProgress',inprogress:'inProgress',underreview:'underReview',
      pendingverification:'pendingVerification',pendingapproval:'pendingApproval',
      criticalseverity:'critical',moderateseverity:'medium',critical:'critical',
      high:'high',medium:'medium',low:'low',successful:'successful',failed:'failed',
      real:'real',drill:'drill',completed:'completed',planned:'planned',draft:'draft',
      archived:'archived',compliant:'compliant',partial:'partial',
      noncompliant:'nonCompliant',notapplicable:'notApplicable',yes:'yes',no:'no'
    };
    return map[key]||raw;
  }
  function normalizeRiskId(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
  function departmentFromRiskCode(v){
    var id=normalizeRiskId(v);
    if(id.indexOf('SAF')===0)return'safety';
    if(id.indexOf('MNT')===0)return'maintenance';
    if(id.indexOf('HK')===0||id.indexOf('LUND')===0)return'housekeeping';
    if(id.indexOf('PM')===0)return'projects';
    if(id.indexOf('GOV')===0||id.indexOf('GRC')===0)return'governanceDept';
    return'';
  }
  function applyRiskRegisterSeed(s){
    s=s||defaultState();
    var existing={};
    (s.risks||[]).forEach(function(r){var k=normalizeRiskId(r.id);if(k)existing[k]=r;});
    var merged=[];
    RISK_REGISTER_SEED.forEach(function(seed){
      var k=normalizeRiskId(seed.id),old=existing[k],r=copyRecord(seed);
      if(old)Object.keys(old).forEach(function(p){if(old[p]!==undefined&&old[p]!==null&&old[p]!=='')r[p]=old[p];});
      r.department=departmentFromRiskCode(r.id)||r.department||'allFms';
      r.actionStatus=normalizeStatus(r.actionStatus||r.status||'open');
      merged.push(r);delete existing[k];
    });
    Object.keys(existing).forEach(function(k){
      var r=copyRecord(existing[k]);
      r.department=departmentFromRiskCode(r.id)||r.department||'allFms';
      r.actionStatus=normalizeStatus(r.actionStatus||r.status||'open');
      merged.push(r);
    });
    s.risks=merged;
    return s;
  }
  function migrateState(raw){
    var s=defaultState();
    if(!raw||typeof raw!=='object')return applyRiskRegisterSeed(s);
    ['policies','plans','emergencyPlans','forms','manuals','risks','incidents','codes','compliance','audits','actions','documents'].forEach(function(k){if(Array.isArray(raw[k]))s[k]=raw[k].map(copyRecord);});

    /* Migrate the first GRC preview document catalog into the new registers. */
    if(Array.isArray(raw.documents)){
      raw.documents.forEach(function(d){
        var x=copyRecord(d),cat=String(x.category||'').toLowerCase();
        x.department=x.department||departmentFromOwner(x.owner)||'governanceDept';
        x.expiryDate=x.expiryDate||x.reviewDate||'';
        x.status=normalizeStatus(x.status||'planned');
        if(cat==='policy'&&!hasId(s.policies,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.policies.push(x);}
        else if(cat==='plan'&&!hasId(s.plans,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.plans.push(x);}
        else if(cat==='form'&&!hasId(s.forms,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.forms.push(x);}
        else if(cat==='manual'&&!hasId(s.manuals,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.manuals.push(x);}
      });
    }
    s.risks=s.risks.map(function(r){
      r.department=r.department||'allFms';
      r.riskIdentified=r.riskIdentified||r.title||r.titleEn||r.titleAr||'';
      r.riskCategory=r.riskCategory||r.category||'operational';
      r.controlType=r.controlType||'noControl';
      r.actionStatus=normalizeStatus(r.actionStatus||r.status||'open');
      return r;
    });
    ['policies','plans','emergencyPlans','forms','manuals','incidents','codes','compliance','audits','actions','documents'].forEach(function(k){
      s[k]=s[k].map(function(r){r.status=normalizeStatus(r.status);return r;});
    });
    s.version=STATE_VERSION;s.updatedAt=raw.updatedAt||new Date().toISOString();
    return applyRiskRegisterSeed(s);
  }
  function hasId(arr,id){return arr.some(function(r){return String(r.id)===String(id);});}
  function departmentFromOwner(owner){
    var x=String(owner||'').toLowerCase();
    if(x.indexOf('maintenance')>=0)return'maintenance';if(x.indexOf('safety')>=0)return'safety';if(x.indexOf('house')>=0)return'housekeeping';if(x.indexOf('project')>=0)return'projects';if(x.indexOf('governance')>=0)return'governanceDept';return'';
  }
  function loadState(){
    try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}
    catch(_){return applyRiskRegisterSeed(defaultState());}
  }
  var state=loadState();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}
  function saveState(){state.version=STATE_VERSION;state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}render();}

  function isAr(){return (typeof window.lang!=='undefined'?window.lang:(document.documentElement.dir==='rtl'?'ar':'en'))==='ar';}
  function normalizedRole(){var r=String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');return r==='superadmin'?'super_admin':r;}
  function L(k){var lang=isAr()?'ar':'en';return(labels[lang]&&labels[lang][k])||labels.en[k]||k;}
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function currentName(){return String(window._fbName||window.currentUserName||(window._fbUser||'').split('@')[0]||'Super Admin');}
  function roleText(){return normalizedRole()==='super_admin'?'Super Admin':String(window._fbRole||window.currentUserRole||'');}
  function today(){var d=new Date();d.setHours(0,0,0,0);return d;}
  function parseDate(v){if(!v)return null;var d=new Date(String(v).length===10?v+'T00:00:00':v);return isNaN(d.getTime())?null:d;}
  function dateText(v){var d=parseDate(v);if(!d)return'—';try{return new Intl.DateTimeFormat(isAr()?'ar-SA':'en-GB',{year:'numeric',month:'short',day:'numeric',hour:String(v).indexOf('T')>=0?'2-digit':undefined,minute:String(v).indexOf('T')>=0?'2-digit':undefined}).format(d);}catch(_){return String(v);}}
  function pct(n,d){return d?((n/d)*100).toFixed((n*100)%d===0?0:1)+'%':'0%';}
  function deptName(v){return L(v||'allFms');}
  function recordName(r){return(isAr()?(r.nameAr||r.titleAr||r.riskIdentifiedAr||r.name||r.title||r.riskIdentified||r.requirement||r.finding||r.description):(r.nameEn||r.titleEn||r.riskIdentifiedEn||r.name||r.title||r.riskIdentified||r.requirement||r.finding||r.description))||'—';}
  function filterDept(arr,dept){if(!dept||dept==='allFms')return(arr||[]).slice();return(arr||[]).filter(function(r){return String(r.department||r.responsibleDept||'')===String(dept);});}
  function countFor(key){
    if(key==='governance')return state.policies.length+state.plans.length+state.emergencyPlans.length+state.forms.length;
    if(key==='risk')return state.risks.length+state.incidents.length+state.codes.length;
    return Array.isArray(state[key])?state[key].length:0;
  }
  function isExpired(r){var st=normalizeStatus(r.status);var d=parseDate(r.expiryDate||r.reviewDate);return st==='expired'||(d&&d<today());}
  function expiringThisYear(r){var d=parseDate(r.expiryDate||r.reviewDate);var now=today();return!!(d&&d>=now&&d.getFullYear()===now.getFullYear()&&!isExpired(r));}
  function isClosed(r){return['closed','completed'].indexOf(normalizeStatus(r.actionStatus||r.status))>=0;}
  function isOpen(r){return!isClosed(r);}
  function riskScore(r){var saved=Number(r.riskScore);if(isFinite(saved)&&saved>0)return saved;return Number(r.likelihood||0)*Number(r.impact||0);}
  function riskLevel(r){var saved=normalizeStatus(r&&r.riskLevel);if(['critical','high','medium','low'].indexOf(saved)>=0)return saved;var score=riskScore(r);return score>=15?'critical':score>=10?'high':score>=5?'medium':'low';}
  function badge(status){
    var s=normalizeStatus(status),cls='neutral';
    if(['active','open','closed','completed','compliant','successful'].indexOf(s)>=0)cls=s==='open'?'info':'good';
    if(['underReview','inProgress','partial','pendingVerification','pendingApproval','planned'].indexOf(s)>=0)cls='warn';
    if(['expired','nonCompliant','failed','critical'].indexOf(s)>=0)cls='bad';
    if(['high','medium','major'].indexOf(s)>=0)cls=s==='high'?'warn':'info';
    if(s==='low'||s==='minor'||s==='observation')cls='good';
    if(s==='drill')cls='purple';
    return'<span class="grc-badge '+cls+'">'+esc(L(s))+'</span>';
  }
  function emptyRow(cols){return'<tr><td colspan="'+cols+'"><div class="grc-empty"><div class="grc-empty-icon">＋</div><div class="grc-empty-title">'+L('noRecords')+'</div><div class="grc-empty-sub">'+L('noRecordsSub')+'</div></div></td></tr>';}
  function delBtn(collection,id){return'<button class="grc-icon-btn danger" title="'+L('delete')+'" onclick="window._grcDelete(\''+collection+'\',\''+esc(id)+'\')">×</button>';}

  function ensureApp(){
    app=document.getElementById('grcApp');if(app)return app;
    app=document.createElement('section');app.id='grcApp';app.setAttribute('aria-hidden','true');document.body.appendChild(app);return app;
  }
  function logoSrc(){var i=document.getElementById('logoImg');return i&&i.src?i.src:'';}
  function shellHtml(){
    return'<header class="grc-topbar">'+
      '<div class="grc-brand"><div class="grc-logo"><img alt="QUMC" src="'+esc(logoSrc())+'"></div><div><div class="grc-brand-title">'+L('app')+'</div><div class="grc-brand-sub">'+L('sub')+'</div></div></div>'+
      '<div class="grc-preview-pill"><span class="grc-preview-dot"></span>'+L('preview')+'</div><div class="grc-top-space"></div>'+
      '<button class="grc-top-btn" onclick="window._grcToggleLang()">'+(isAr()?'EN':'عربي')+'</button>'+
      '<div class="grc-user"><div class="grc-user-avatar">'+esc((currentName()[0]||'S').toUpperCase())+'</div><div><div class="grc-user-name">'+esc(currentName())+'</div><div class="grc-user-role">'+esc(roleText())+'</div></div></div>'+
      '<button class="grc-top-btn grc-back" onclick="window._exitGRC()">← '+L('back')+'</button></header>'+
      '<div class="grc-nav-wrap"><nav class="grc-nav">'+modules.map(function(x){var c=x.count?countFor(x.count):null;return'<button class="grc-tab '+(activeTab===x.id?'is-active':'')+'" onclick="window._grcSwitch(\''+x.id+'\')"><span class="grc-tab-icon">'+x.icon+'</span><span>'+L(x.id)+'</span>'+(c!==null?'<span class="grc-tab-count">'+c+'</span>':'')+'</button>';}).join('')+'</nav></div>'+
      '<main class="grc-main">'+modules.map(function(x){return'<section id="grc-page-'+x.id+'" class="grc-page '+(activeTab===x.id?'is-active':'')+'">'+pageHtml(x.id)+'</section>';}).join('')+'</main>'+
      '<footer class="grc-footer"><span><strong>QUMC GRC Workspace</strong> · '+L('draftWorkspace')+' · '+L('localNote')+'</span><span class="grc-live"><i></i> Super Admin Preview · © 2026 QUMC</span></footer>';
  }
  function render(){if(!app||!app.classList.contains('grc-visible'))return;app.setAttribute('dir',isAr()?'rtl':'ltr');app.innerHTML=shellHtml();}

  function hero(eye,title,desc,actions){return'<div class="grc-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">'+eye+'</div><h1>'+title+'</h1><p>'+desc+'</p></div><div class="grc-hero-actions">'+(actions||'')+'</div></div></div>';}
  function sectionHead(title,sub,badgeText){return'<div class="grc-section-head"><div><div class="grc-section-title">'+title+'</div><div class="grc-section-sub">'+(sub||'')+'</div></div>'+(badgeText?'<span class="grc-section-badge">'+badgeText+'</span>':'')+'</div>';}
  function metricCard(label,value,cls,sub,onclick){
    var tone=cls||'info',icons={info:'▦',good:'✓',warn:'△',bad:'!',purple:'◇',neutral:'•'};
    return'<div class="grc-metric-card '+tone+' '+(onclick?'clickable':'')+' '+(isAr()?'rtl':'')+'" '+(onclick?'onclick="'+onclick+'" tabindex="0" role="button"':'')+'>'+
      '<div class="grc-metric-top"><span class="grc-metric-icon">'+(icons[tone]||'▦')+'</span><span class="grc-metric-kicker">GRC</span></div>'+
      '<div class="grc-metric-value">'+value+'</div><div class="grc-metric-label">'+label+'</div>'+
      '<div class="grc-metric-foot"><span class="grc-metric-sub">'+(sub||'')+'</span>'+(onclick?'<span class="grc-metric-arrow">›</span>':'')+'</div></div>';
  }
  function registerBlock(kind,title,note,button,table){return'<div class="grc-register-block"><div class="grc-register-titlebar '+kind+'"><div><div class="grc-register-name">'+title+'</div><div class="grc-register-note">'+note+'</div></div>'+button+'</div>'+table+'</div>';}
  function addBtn(type,label,dept){return'<button class="grc-primary-btn" onclick="window._grcOpenForm(\''+type+'\',\''+esc(dept||'')+'\')">＋ '+label+'</button>';}
  function deptColor(dept){return(departmentMeta[dept]&&departmentMeta[dept].color)||'#00A3C4';}
  function deptInk(dept){return(departmentMeta[dept]&&departmentMeta[dept].ink)||deptColor(dept);}
  function deptSoft(dept){return(departmentMeta[dept]&&departmentMeta[dept].soft)||'rgba(0,163,196,.12)';}
  function deptAbbr(dept){return(departmentMeta[dept]&&departmentMeta[dept].abbr)||'FMS';}
  function chartLegend(items){return'<div class="grc-chart-legend">'+items.map(function(x){return'<span><i style="background:'+x.color+'"></i>'+esc(x.label)+' <b>'+x.value+'</b></span>';}).join('')+'</div>';}
  function donutChart(title,items,centerLabel){
    var total=items.reduce(function(a,x){return a+Number(x.value||0);},0),cursor=0,stops=[];
    items.forEach(function(x){var start=cursor,end=total?cursor+(Number(x.value||0)/total*360):cursor;stops.push(x.color+' '+start+'deg '+end+'deg');cursor=end;});
    if(!total)stops=['#E7EEF3 0deg 360deg'];
    return'<div class="grc-chart-card"><div class="grc-chart-title">'+title+'</div><div class="grc-donut-layout"><div class="grc-donut" style="background:conic-gradient('+stops.join(',')+')"><div class="grc-donut-center"><strong>'+total+'</strong><span>'+esc(centerLabel||L('records'))+'</span></div></div>'+chartLegend(items)+'</div></div>';
  }
  function barChart(title,items){
    var max=Math.max.apply(null,[1].concat(items.map(function(x){return Number(x.value||0);}))); 
    return'<div class="grc-chart-card"><div class="grc-chart-title">'+title+'</div><div class="grc-bar-list">'+items.map(function(x){var w=Math.round(Number(x.value||0)/max*100);return'<div class="grc-bar-row"><div class="grc-bar-head"><span>'+esc(x.label)+'</span><b>'+Number(x.value||0)+'</b></div><div class="grc-bar-track"><span style="width:'+w+'%;background:'+x.color+'"></span></div></div>';}).join('')+'</div></div>';
  }
  function departmentPanel(dept,scope,total,second,alert,secondLabel,body){
    var color=deptColor(dept),ink=deptInk(dept),soft=deptSoft(dept);
    return'<section class="grc-department-panel" style="--dept-color:'+color+';--dept-ink:'+ink+';--dept-soft:'+soft+'"><div class="grc-department-accent"></div><div class="grc-department-header"><div class="grc-department-identity"><div class="grc-department-abbr">'+esc(deptAbbr(dept))+'</div><div><div class="grc-department-name">'+esc(deptName(dept))+'</div><div class="grc-department-caption">'+esc(scope)+'</div></div></div><div class="grc-department-summary"><div class="grc-mini-stat"><b>'+Number(total||0)+'</b><span>'+L('total')+'</span></div><div class="grc-mini-stat good"><b>'+Number(second||0)+'</b><span>'+esc(secondLabel||L('active'))+'</span></div><div class="grc-mini-stat warn"><b>'+Number(alert||0)+'</b><span>'+L('attention')+'</span></div></div></div><div class="grc-department-body">'+body+'</div></section>';
  }

  function governanceMetricCards(kind,dept){
    var arr=filterDept(state[kind],dept),expired=arr.filter(isExpired),due=arr.filter(expiringThisYear),active=arr.filter(function(r){return['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r);});
    var c=[];
    if(kind==='policies')c=[
      ['totalPolicies',arr.length,'info','total'],['openPolicies',active.length,'good','active'],['expiredPolicies',expired.length,'bad','expired'],['expiringThisYear',due.length,'warn','expiring'],['expiredPolicyRate',pct(expired.length,arr.length),'purple','expired']
    ];
    if(kind==='plans')c=[['totalPlans',arr.length,'info','total'],['activePlans',active.length,'good','active'],['expiredPlans',expired.length,'bad','expired'],['expiringThisYear',due.length,'warn','expiring']];
    if(kind==='emergencyPlans')c=[['totalEmergencyPlans',arr.length,'info','total'],['activeEmergencyPlans',active.length,'good','active'],['expiredEmergencyPlans',expired.length,'bad','expired']];
    if(kind==='forms')c=[['totalForms',arr.length,'info','total'],['activeForms',active.length,'good','active'],['expiredForms',expired.length,'bad','expired']];
    var gridClass=c.length===4?'cols-4':c.length===3?'cols-3':'';
    return'<div class="grc-metric-grid '+gridClass+'">'+c.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\''+kind+'\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function governanceOverview(dept,withRegisters){
    var sections=[
      ['policies','policies','policyRegister','addPolicy','policy'],
      ['plans','plans','planRegister','addPlan','plan'],
      ['emergencyPlans','emergencyPlans','emergencyPlanRegister','addEmergencyPlan','emergencyPlan'],
      ['forms','forms','formRegister','addForm','form']
    ];
    return sections.map(function(s){
      var html='<div class="grc-section">'+sectionHead(L(s[1]),deptName(dept),withRegisters?'':'')+governanceMetricCards(s[0],dept);
      if(withRegisters)html+=registerBlock(s[4],L(s[2]),deptName(dept),addBtn(s[4],L(s[3]),dept),governanceTable(s[0],dept,s[4]));
      return html+'</div>';
    }).join('');
  }

  function riskMetricCards(dept){
    var arr=filterDept(state.risks,dept),closed=arr.filter(isClosed),open=arr.filter(isOpen);
    var levels={critical:[],high:[],medium:[],low:[]};arr.forEach(function(r){levels[riskLevel(r)].push(r);});
    var defs=[
      ['totalRisks',arr.length,'info','total'],['openRisks',open.length,'warn','open'],['closedRisks',closed.length,'good','closed'],['closedRiskRate',pct(closed.length,arr.length),'purple','closed'],
      ['criticalRisks',levels.critical.length,'bad','critical'],['highRisks',levels.high.length,'warn','high'],['mediumRisks',levels.medium.length,'info','medium'],['lowRisks',levels.low.length,'good','low'],['highCriticalRate',pct(levels.high.length+levels.critical.length,arr.length),'bad','highCritical']
    ];
    return'<div class="grc-metric-grid">'+defs.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\'risks\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function incidentMetricCards(dept){
    var arr=filterDept(state.incidents,dept),closed=arr.filter(isClosed),open=arr.filter(isOpen);
    var defs=[['totalIncidents',arr.length,'info','years'],['openIncidents',open.length,'warn','open'],['closedIncidents',closed.length,'good','closed'],['closedIncidentRate',pct(closed.length,arr.length),'purple','closed']];
    return'<div class="grc-metric-grid cols-4">'+defs.map(function(x){return metricCard(L(x[0]),x[1],x[2],x[3]==='years'?L('incidentsByYear'):L('clickToView'),'window._grcOpenMetric(\'incidents\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function codeMetricCards(dept){
    var arr=filterDept(state.codes,dept);
    var real=arr.filter(function(r){return normalizeStatus(r.type)==='real';});
    var drill=arr.filter(function(r){return normalizeStatus(r.type)==='drill';});
    var success=arr.filter(function(r){return normalizeStatus(r.status)==='successful';});
    var failed=arr.filter(function(r){return normalizeStatus(r.status)==='failed';});
    var defs=[
      ['totalCodes',arr.length,'info','total'],
      ['realCodes',real.length,'purple','real'],
      ['drillCodes',drill.length,'info','drill'],
      ['successfulCodes',success.length,'good','successful'],
      ['failedCodes',failed.length,'bad','failed'],
      ['failedCodeRate',pct(failed.length,drill.length),'warn','failedRate']
    ];
    return'<div class="grc-metric-grid cols-6">'+defs.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\'codes\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function riskOverview(dept,withRegisters){
    var html='<div class="grc-section">'+sectionHead(L('riskRegister'),deptName(dept))+riskMetricCards(dept);
    if(withRegisters)html+=registerBlock('risk',L('riskRegister'),deptName(dept),addBtn('risk',L('addRisk'),dept),riskTable(dept));
    html+='</div><div class="grc-section">'+sectionHead(L('incidents'),deptName(dept))+incidentMetricCards(dept);
    if(withRegisters)html+=registerBlock('incident',L('incidentRegister'),deptName(dept),addBtn('incident',L('addIncident'),dept),incidentTable(dept));
    html+='</div><div class="grc-section">'+sectionHead(L('codes'),deptName(dept))+codeMetricCards(dept);
    if(withRegisters)html+=registerBlock('code',L('codeRegister'),deptName(dept),addBtn('code',L('addCode'),dept),codeTable(dept));
    return html+'</div>';
  }

  function governanceCharts(dept){
    var collections=['policies','plans','emergencyPlans','forms'],all=[];
    collections.forEach(function(k){all=all.concat(filterDept(state[k],dept));});
    var expired=all.filter(isExpired),due=all.filter(expiringThisYear),active=all.filter(function(r){return !isExpired(r)&&!expiringThisYear(r)&&['active','open'].indexOf(normalizeStatus(r.status))>=0;}),other=Math.max(0,all.length-expired.length-due.length-active.length);
    var statusItems=[{label:L('active'),value:active.length,color:'#06845A'},{label:L('dueThisYear'),value:due.length,color:'#B06000'},{label:L('expired'),value:expired.length,color:'#C42B2B'},{label:L('other'),value:other,color:'#94A3B8'}];
    var volumeItems=[{label:L('policies'),value:filterDept(state.policies,dept).length,color:'#00A3C4'},{label:L('plans'),value:filterDept(state.plans,dept).length,color:'#1E3E6A'},{label:L('emergencyPlans'),value:filterDept(state.emergencyPlans,dept).length,color:'#B06000'},{label:L('forms'),value:filterDept(state.forms,dept).length,color:'#2A5280'}];
    return'<div class="grc-chart-grid cols-2">'+donutChart(L('governanceStatusChart'),statusItems,L('records'))+barChart(L('governanceVolumeChart'),volumeItems)+'</div>';
  }
  function riskCharts(dept){
    var risks=filterDept(state.risks,dept),levels={critical:0,high:0,medium:0,low:0};risks.forEach(function(r){levels[riskLevel(r)]++;});
    var levelItems=[{label:L('critical'),value:levels.critical,color:'#C42B2B'},{label:L('high'),value:levels.high,color:'#B06000'},{label:L('medium'),value:levels.medium,color:'#2A5280'},{label:L('low'),value:levels.low,color:'#06845A'}];
    var incidents=filterDept(state.incidents,dept),years={},now=new Date().getFullYear();for(var y=2023;y<=now;y++)years[y]=0;incidents.forEach(function(r){var d=parseDate(r.date),yr=d?d.getFullYear():null;if(yr){if(years[yr]===undefined)years[yr]=0;years[yr]++;}});
    var yearItems=Object.keys(years).sort().map(function(y){return{label:y,value:years[y],color:'#00A3C4'};});
    var codes=filterDept(state.codes,dept),real=codes.filter(function(r){return normalizeStatus(r.type)==='real';}).length,drill=codes.filter(function(r){return normalizeStatus(r.type)==='drill';}).length,success=codes.filter(function(r){return normalizeStatus(r.status)==='successful';}).length,failed=codes.filter(function(r){return normalizeStatus(r.status)==='failed';}).length;
    var codeItems=[{label:L('realCodes'),value:real,color:'#1E3E6A'},{label:L('drillCodes'),value:drill,color:'#60A5FA'},{label:L('successfulCodes'),value:success,color:'#34D399'},{label:L('failedCodes'),value:failed,color:'#F87171'}];
    return'<div class="grc-chart-grid cols-3">'+donutChart(L('riskDistributionChart'),levelItems,L('totalRisks'))+barChart(L('incidentTrendChart'),yearItems)+barChart(L('codeOutcomeChart'),codeItems)+'</div>';
  }
  function governanceDepartmentPanel(dept){
    var all=[];['policies','plans','emergencyPlans','forms'].forEach(function(k){all=all.concat(filterDept(state[k],dept));});
    var active=all.filter(function(r){return['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r);}).length;
    var alert=all.filter(function(r){return isExpired(r)||expiringThisYear(r);}).length;
    return departmentPanel(dept,L('governance')+' · '+L('departmentRecords'),all.length,active,alert,L('active'),governanceCharts(dept)+governanceOverview(dept,true));
  }
  function riskDepartmentPanel(dept){
    var risks=filterDept(state.risks,dept),incidents=filterDept(state.incidents,dept),codes=filterDept(state.codes,dept),total=risks.length+incidents.length+codes.length;
    var active=risks.filter(isOpen).length+incidents.filter(isOpen).length;
    var alert=risks.filter(function(r){return['critical','high'].indexOf(riskLevel(r))>=0;}).length+incidents.filter(isOpen).length;
    return departmentPanel(dept,L('risk')+' · '+L('departmentRecords'),total,active,alert,L('open'),riskCharts(dept)+riskOverview(dept,true));
  }
  function executiveSnapshotCards(){
    var gov=countFor('governance');
    var risks=state.risks||[],openRisk=risks.filter(isOpen).length;
    var incidents=state.incidents||[],openIncident=incidents.filter(isOpen).length;
    var codes=state.codes||[],drill=codes.filter(function(r){return normalizeStatus(r.type)==='drill';}).length,failed=codes.filter(function(r){return normalizeStatus(r.status)==='failed';}).length;
    return'<div class="grc-exec-snapshot-grid">'+
      metricCard(L('governanceRecords'),gov,'info',L('allDepartments'),'window._grcSwitch(\'governance\')')+
      metricCard(L('openRisks'),openRisk,'warn',L('allDepartments'),'window._grcOpenMetric(\'risks\',\'open\',\'allFms\')')+
      metricCard(L('openIncidents'),openIncident,'bad',L('allDepartments'),'window._grcOpenMetric(\'incidents\',\'open\',\'allFms\')')+
      metricCard(L('failedCodeRate'),pct(failed,drill),'purple',L('codes'),'window._grcOpenMetric(\'codes\',\'failedRate\',\'allFms\')')+
      '</div>';
  }
  function executivePage(){
    return hero('GRC · Executive Command',L('executiveTitle'),L('executiveDesc'))+
      '<section class="grc-exec-snapshot">'+sectionHead(L('executiveSnapshot'),L('executiveSnapshotDesc'),'FMS')+executiveSnapshotCards()+'</section>'+
      '<section class="grc-exec-domain governance-domain"><div class="grc-exec-domain-head"><div><span class="grc-exec-domain-kicker">01</span><h2>'+L('governanceOverview')+'</h2><p>'+L('governanceDesc')+'</p></div><span class="grc-exec-domain-badge">'+countFor('governance')+' '+L('records')+'</span></div>'+governanceCharts('allFms')+governanceOverview('allFms',false)+'</section>'+
      '<section class="grc-exec-domain risk-domain"><div class="grc-exec-domain-head"><div><span class="grc-exec-domain-kicker">02</span><h2>'+L('riskOverview')+'</h2><p>'+L('riskDesc')+'</p></div><span class="grc-exec-domain-badge">'+countFor('risk')+' '+L('records')+'</span></div>'+riskCharts('allFms')+riskOverview('allFms',false)+'</section>';
  }
  function governanceModules(){
    var a=[['⌂','orgStructure','orgStructureDesc'],['⇄','raci','raciDesc'],['▥','annualPlan','annualPlanDesc']];
    return'<div class="grc-module-grid">'+a.map(function(x){return'<div class="grc-module-card"><div class="grc-module-icon">'+x[0]+'</div><div><div class="grc-module-title">'+L(x[1])+'</div><div class="grc-module-desc">'+L(x[2])+'</div><span class="grc-module-status">'+L('planned')+'</span></div></div>';}).join('')+'</div>';
  }
  function governancePage(){
    return hero('GRC · Governance',L('governanceTitle'),L('governanceDesc'))+governanceModules()+'<div class="grc-divider"></div>'+sectionHead(L('departmentView'),L('departmentSectionsDesc'))+'<div class="grc-department-stack">'+departmentOrder.map(governanceDepartmentPanel).join('')+'</div>';
  }
  function riskPage(){
    return hero('GRC · Risk Management',L('riskTitle'),L('riskDesc'))+sectionHead(L('departmentView'),L('departmentSectionsDesc'))+'<div class="grc-department-stack">'+departmentOrder.map(riskDepartmentPanel).join('')+'</div>';
  }

  function manualsPage(){
    var arr=state.manuals,expired=arr.filter(isExpired),active=arr.filter(function(r){return normalizeStatus(r.status)==='active'&&!isExpired(r);}),due=arr.filter(expiringThisYear);
    var metrics='<div class="grc-metric-grid cols-4">'+
      metricCard(L('totalManuals'),arr.length,'info',L('clickToView'),'window._grcOpenMetric(\'manuals\',\'total\',\'allFms\')')+
      metricCard(L('activeManuals'),active.length,'good',L('clickToView'),'window._grcOpenMetric(\'manuals\',\'active\',\'allFms\')')+
      metricCard(L('expiredManuals'),expired.length,'bad',L('clickToView'),'window._grcOpenMetric(\'manuals\',\'expired\',\'allFms\')')+
      metricCard(L('manualsDue'),due.length,'warn',L('clickToView'),'window._grcOpenMetric(\'manuals\',\'expiring\',\'allFms\')')+'</div>';
    return hero('GRC · Document Governance',L('manualsTitle'),L('manualsDesc'),addBtn('manual',L('addManual')))+'<div class="grc-section">'+metrics+registerBlock('policy',L('manualRegister'),L('manualsDesc'),addBtn('manual',L('addManual')),manualTable())+'</div>';
  }

  function governanceTable(kind,dept,style){
    var rows=filterDept(state[kind],dept).map(function(r){
      return'<tr><td>'+esc(recordName(r))+'</td><td class="grc-id">'+esc(r.code||r.id||'—')+'</td><td>'+dateText(r.issueDate)+'</td><td>'+dateText(r.effectiveDate||r.startDate)+'</td><td>'+dateText(r.reviewDate||r.expiryDate)+'</td></tr>';
    }).join('');
    return tableHtml(style,['name','code','issueDate','effectiveDate','reviewDate'],rows);
  }
  function riskTable(dept){
    var rows=filterDept(state.risks,dept).map(function(r){var score=riskScore(r),level=riskLevel(r);return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(L(r.riskCategory)||r.riskCategory||'—')+'</td><td>'+esc(r.likelihood||'—')+'</td><td>'+esc(r.impact||'—')+'</td><td><b>'+score+'</b></td><td>'+badge(level)+'</td><td>'+esc(L(r.controlType)||r.controlType||'—')+'</td><td>'+badge(r.actionStatus||r.status)+'</td></tr>';}).join('');
    return tableHtml('risk',['riskId','riskIdentified','riskCategory','likelihood','impact','riskScore','riskLevel','controlType','actionStatus'],rows);
  }
  function incidentTable(dept){
    var rows=filterDept(state.incidents,dept).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+dateText(r.date)+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(r.contributingFactors||'—')+'</td><td>'+badge(r.investigationRequired==='yes'?'yes':'no')+'</td><td>'+badge(r.status)+'</td><td>'+esc(deptName(r.department||r.responsibleDept))+'</td></tr>';}).join('');
    return tableHtml('incident',['incidentId','date','category','contributingFactors','investigationRequired','status','responsibleDept'],rows);
  }
  function codeTable(dept){
    var rows=filterDept(state.codes,dept).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+badge(r.status)+'</td><td>'+badge(r.type)+'</td><td>'+dateText(r.date)+'</td><td>'+esc(r.location||'—')+'</td><td>'+dateText(r.closeDateTime)+'</td></tr>';}).join('');
    return tableHtml('code',['codeNumber','status','type','date','location','closeDateTime'],rows);
  }
  function manualTable(){
    var rows=state.manuals.map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.reviewDate||r.expiryDate)+'</td><td>'+badge(isExpired(r)?'expired':r.status)+'</td></tr>';}).join('');
    return tableHtml('policy',['manualId','manualName','category','department','owner','reviewDate','status'],rows);
  }
  function tableHtml(style,heads,rows){return'<div class="grc-table-wrap"><table class="grc-table '+style+'"><thead><tr>'+heads.map(function(h){return'<th>'+L(h)+'</th>';}).join('')+'</tr></thead><tbody>'+(rows||emptyRow(heads.length))+'</tbody></table></div>';}

  /* Supporting pages retained from the approved GRC navigation. */
  function simpleRegisterPage(kind,titleKey,descKey,addType,addKey,heads,rowBuilder,style){
    var rows=(state[kind]||[]).map(rowBuilder).join('');
    return hero('GRC',L(titleKey),L(descKey),addBtn(addType,L(addKey)))+'<div class="grc-section">'+registerBlock(style||'policy',L(titleKey),L(descKey),addBtn(addType,L(addKey)),tableHtml(style||'policy',heads,rows))+'</div>';
  }
  function compliancePage(){return simpleRegisterPage('compliance','complianceTitle','complianceDesc','compliance','addRequirement',['id','requirement','authority','department','owner','dueDate','status'],function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.authority||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td></tr>';},'policy');}
  function auditPage(){return simpleRegisterPage('audits','auditTitle','auditDesc','audit','addFinding',['id','title','severity','department','owner','dueDate','status'],function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+badge(r.severity)+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td></tr>';},'incident');}
  function actionsPage(){return simpleRegisterPage('actions','actionsTitle','actionsDesc','action','addAction',['id','title','source','department','owner','dueDate','progress','status'],function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.source||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td><div style="display:flex;align-items:center;gap:7px"><div class="grc-progress"><span style="width:'+Math.max(0,Math.min(100,Number(r.progress||0)))+'%"></span></div><b>'+Number(r.progress||0)+'%</b></div></td><td>'+badge(r.status)+'</td></tr>';},'plan');}
  function documentsPage(){return simpleRegisterPage('documents','documentsTitle','documentsDesc','document','addDocument',['id','title','category','department','owner','reviewDate','status'],function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.reviewDate)+'</td><td>'+badge(r.status)+'</td></tr>';},'form');}
  function reportsPage(){
    var cards=[['▥',isAr()?'التقارير الربعية':'Quarterly Reports'],['▤',isAr()?'التقارير السنوية':'Annual Reports'],['◫',isAr()?'التقارير التنفيذية':'Executive Reports'],['⌁',isAr()?'تقارير الحوادث':'Incident Reports'],['▣',isAr()?'أرشيف إدارة المرافق والسلامة':'FMS Archive'],['§',isAr()?'الأطر التنظيمية والتشريعية':'Regulatory & Legislative Framework']];
    return hero('GRC · Reporting',L('reportsTitle'),L('reportsDesc'))+'<div class="grc-module-grid">'+cards.map(function(x){return'<div class="grc-module-card"><div class="grc-module-icon">'+x[0]+'</div><div><div class="grc-module-title">'+x[1]+'</div><div class="grc-module-desc">'+L('planned')+'</div><span class="grc-module-status">'+L('planned')+'</span></div></div>';}).join('')+'</div>';
  }
  function pageHtml(id){if(id==='executive')return executivePage();if(id==='governance')return governancePage();if(id==='manuals')return manualsPage();if(id==='risk')return riskPage();if(id==='compliance')return compliancePage();if(id==='audit')return auditPage();if(id==='actions')return actionsPage();if(id==='documents')return documentsPage();return reportsPage();}

  function metricRecords(kind,filter,dept){
    var arr=filterDept(state[kind]||[],dept);
    if(filter==='total')return arr;
    if(filter==='open')return arr.filter(function(r){return kind==='policies'?(normalizeStatus(r.status)==='open'&&!isExpired(r)):isOpen(r);});
    if(filter==='active')return arr.filter(function(r){return['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r);});
    if(filter==='expired')return arr.filter(isExpired);
    if(filter==='expiring')return arr.filter(expiringThisYear);
    if(filter==='closed')return arr.filter(isClosed);
    if(['critical','high','medium','low'].indexOf(filter)>=0)return arr.filter(function(r){return riskLevel(r)===filter;});
    if(filter==='highCritical')return arr.filter(function(r){return['high','critical'].indexOf(riskLevel(r))>=0;});
    if(kind==='codes'&&filter==='real')return arr.filter(function(r){return normalizeStatus(r.type)==='real';});
    if(kind==='codes'&&filter==='drill')return arr.filter(function(r){return normalizeStatus(r.type)==='drill';});
    if(kind==='codes'&&filter==='successful')return arr.filter(function(r){return normalizeStatus(r.type)==='drill'&&normalizeStatus(r.status)==='successful';});
    if(kind==='codes'&&filter==='failed')return arr.filter(function(r){return normalizeStatus(r.type)==='drill'&&normalizeStatus(r.status)==='failed';});
    if(kind==='codes'&&filter==='drillRatio')return arr.filter(function(r){return normalizeStatus(r.type)==='drill'&&['successful','failed'].indexOf(normalizeStatus(r.status))>=0;});
    if(kind==='codes'&&filter==='failedRate')return arr.filter(function(r){return normalizeStatus(r.type)==='drill'&&normalizeStatus(r.status)==='failed';});
    return arr;
  }
  function metricTitle(kind,filter){
    var map={policies:'policies',plans:'plans',emergencyPlans:'emergencyPlans',forms:'forms',manuals:'manuals',risks:'riskRegister',incidents:'incidents',codes:'codes'};
    var f={total:'total',open:'open',active:'active',expired:'expired',expiring:'expiringThisYear',closed:'closed',critical:'critical',high:'high',medium:'medium',low:'low',highCritical:'highCriticalRate',real:'realCodes',drill:'drillCodes',successful:'successfulCodes',failed:'failedCodes',failedRate:'failedCodeRate',drillRatio:'successVsFailed',years:'incidentsByYear'};
    return L(map[kind])+' · '+L(f[filter]||filter);
  }
  function detailRow(kind,r){
    var meta=[];
    if(r.department)meta.push(deptName(r.department));
    if(kind==='risks'){meta.push(L(riskLevel(r)));meta.push(L('riskScore')+': '+riskScore(r));meta.push(L(r.actionStatus||r.status));}
    if(kind==='incidents'){meta.push(dateText(r.date));meta.push(r.category||'—');meta.push(L(r.status));}
    if(kind==='codes'){meta.push(L(r.type));meta.push(L(r.status));meta.push(r.location||'—');}
    if(['policies','plans','emergencyPlans','forms','manuals'].indexOf(kind)>=0){meta.push(L(isExpired(r)?'expired':r.status));var d=r.expiryDate||r.reviewDate;if(d)meta.push(L('expiryDate')+': '+dateText(d));}
    return'<div class="grc-detail-row"><div class="grc-detail-main"><div class="grc-detail-title">'+esc(recordName(r))+'</div><div class="grc-detail-meta">'+meta.map(esc).join(' · ')+'</div></div><span class="grc-badge neutral">'+esc(r.id||'—')+'</span></div>';
  }
  window._grcOpenMetric=function(kind,filter,dept){
    var records=metricRecords(kind,filter,dept),old=document.getElementById('_grcDetailModal');if(old)old.remove();
    var body='';
    if(kind==='incidents'&&filter==='years'){
      var current=new Date().getFullYear(),years=[];for(var y=2023;y<=current;y++)years.push(y);
      body='<div class="grc-year-grid">'+years.map(function(y){var n=records.filter(function(r){var d=parseDate(r.date);return d&&d.getFullYear()===y;}).length;return'<div class="grc-year-card"><div class="grc-year-label">'+y+'</div><div class="grc-year-value">'+n+'</div></div>';}).join('')+'</div>';
    }
    body+='<div class="grc-detail-list">'+(records.length?records.map(function(r){return detailRow(kind,r);}).join(''):'<div class="grc-empty"><div class="grc-empty-icon">0</div><div class="grc-empty-title">'+L('noMatching')+'</div></div>')+'</div>';
    var ov=document.createElement('div');ov.id='_grcDetailModal';ov.className='grc-modal-backdrop';ov.innerHTML='<div class="grc-modal wide"><div class="grc-modal-head"><div><div class="grc-modal-title">'+metricTitle(kind,filter)+'</div><div class="grc-modal-sub">'+deptName(dept)+' · '+records.length+' '+L('records')+'</div></div><button class="grc-modal-close" onclick="document.getElementById(\'_grcDetailModal\').remove()">×</button></div><div class="grc-modal-body">'+body+'</div></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  };

  function field(name,label,type,opts,required,full,value){
    var cls='grc-field'+(full?' full':''),req=required?' required':'',v=value==null?'':value;
    if(type==='textarea')return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><textarea class="grc-textarea" name="'+name+'"'+req+'>'+esc(v)+'</textarea></div>';
    if(type==='select')return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><select class="grc-select" name="'+name+'"'+req+'>'+selectOptions(opts||[],v)+'</select></div>';
    return'<div class="'+cls+'"><label>'+label+(required?' *':'')+'</label><input class="grc-input" name="'+name+'" type="'+(type||'text')+'" value="'+esc(v)+'"'+req+(type==='number'?' min="0" max="100"':'')+'></div>';
  }
  function selectOptions(items,selected){return items.map(function(x){return'<option value="'+esc(x[0])+'" '+(String(selected)===String(x[0])?'selected':'')+'>'+esc(x[1])+'</option>';}).join('');}
  function deptOptions(){return departments.slice(1).concat(['allFms']).map(function(d){return[d,deptName(d)];});}
  function statusOptions(kind){
    if(kind==='policy')return[['active',L('active')],['draft',L('draft')],['underReview',L('underReview')],['expired',L('expired')],['archived',L('archived')]];
    if(['plan','emergencyPlan','form','manual','document'].indexOf(kind)>=0)return[['active',L('active')],['draft',L('draft')],['underReview',L('underReview')],['expired',L('expired')],['archived',L('archived')]];
    return[['open',L('open')],['inProgress',L('inProgress')],['closed',L('closed')]];
  }
  function defaultDeptFor(type,deptOverride){if(deptOverride&&departmentOrder.indexOf(deptOverride)>=0)return deptOverride;if(['policy','plan','emergencyPlan','form'].indexOf(type)>=0)return'governanceDept';if(['risk','incident','code'].indexOf(type)>=0)return'safety';return'governanceDept';}
  function formSpec(type,deptOverride){
    var d=defaultDeptFor(type,deptOverride);
    if(type==='policy')return{title:L('addPolicy'),collection:'policies',prefix:'POL',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='plan')return{title:L('addPlan'),collection:'plans',prefix:'PLN',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='emergencyPlan')return{title:L('addEmergencyPlan'),collection:'emergencyPlans',prefix:'EMP',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='form')return{title:L('addForm'),collection:'forms',prefix:'FRM',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='manual')return{title:L('addManual'),collection:'manuals',prefix:'MAN',fields:field('name',L('manualName'),'text',null,true,true)+field('category',L('category'),'text',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('owner',L('owner'),'text',null,true)+field('reviewDate',L('reviewDate'),'date')+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='risk')return{title:L('addRisk'),collection:'risks',prefix:'RSK',fields:field('riskIdentified',L('riskIdentified'),'textarea',null,true,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('riskCategory',L('riskCategory'),'select',[['operational',L('operational')],['facility',L('facility')],['safetyRisk',L('safetyRisk')],['complianceRisk',L('complianceRisk')],['contractor',L('contractor')],['emergencyPreparedness',L('emergencyPreparedness')]],true)+field('likelihood',L('likelihood'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],true,false,1)+field('impact',L('impact'),'select',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],true,false,1)+field('controlType',L('controlType'),'select',[['preventive',L('preventive')],['detective',L('detective')],['corrective',L('corrective')],['directive',L('directive')],['noControl',L('noControl')]],true)+field('actionStatus',L('actionStatus'),'select',statusOptions(type),true,false,'open')};
    if(type==='incident')return{title:L('addIncident'),collection:'incidents',prefix:'INC',fields:field('date',L('date'),'date',null,true)+field('category',L('category'),'text',null,true)+field('contributingFactors',L('contributingFactors'),'textarea',null,true,true)+field('investigationRequired',L('investigationRequired'),'select',[['yes',L('yes')],['no',L('no')]],true)+field('status',L('status'),'select',statusOptions(type),true,false,'open')+field('department',L('responsibleDept'),'select',deptOptions(),true,false,d)};
    if(type==='code')return{title:L('addCode'),collection:'codes',prefix:'COD',fields:field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',[['successful',L('successful')],['failed',L('failed')],['open',L('open')],['closed',L('closed')]],true)+field('type',L('type'),'select',[['real',L('real')],['drill',L('drill')]],true)+field('date',L('date'),'datetime-local',null,true)+field('location',L('location'),'text',null,true)+field('closeDateTime',L('closeDateTime'),'datetime-local')};
    if(type==='compliance')return{title:L('addRequirement'),collection:'compliance',prefix:'CMP',fields:field('requirement',L('requirement'),'textarea',null,true,true)+field('authority',L('authority'),'text',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('owner',L('owner'),'text',null,true)+field('dueDate',L('dueDate'),'date')+field('status',L('status'),'select',[['underReview',L('underReview')],['compliant',L('compliant')],['partial',L('partial')],['nonCompliant',L('nonCompliant')],['notApplicable',L('notApplicable')]],true)};
    if(type==='audit')return{title:L('addFinding'),collection:'audits',prefix:'AUD',fields:field('finding',L('title'),'textarea',null,true,true)+field('severity',L('severity'),'select',[['observation',L('observation')],['minor',L('minor')],['medium',L('medium')],['major',L('major')],['critical',L('critical')]],true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('owner',L('owner'),'text',null,true)+field('dueDate',L('dueDate'),'date')+field('status',L('status'),'select',statusOptions(type),true,false,'open')};
    if(type==='action')return{title:L('addAction'),collection:'actions',prefix:'ACT',fields:field('description',L('title'),'textarea',null,true,true)+field('source',L('source'),'text',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('owner',L('owner'),'text',null,true)+field('dueDate',L('dueDate'),'date')+field('progress',L('progress'),'number',null,false)+field('status',L('status'),'select',statusOptions(type),true,false,'open')};
    return{title:L('addDocument'),collection:'documents',prefix:'DOC',fields:field('title',L('title'),'text',null,true,true)+field('category',L('category'),'text',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('owner',L('owner'),'text',null,true)+field('reviewDate',L('reviewDate'),'date')+field('status',L('status'),'select',statusOptions('document'),true,false,'active')};
  }
  function nextId(prefix,collection){var max=0;(state[collection]||[]).forEach(function(r){var m=String(r.id||'').match(/(\d+)$/);if(m)max=Math.max(max,Number(m[1]));});return prefix+'-'+String(max+1).padStart(3,'0');}
  window._grcOpenForm=function(type,deptOverride){
    if(normalizedRole()!=='super_admin')return;
    var spec=formSpec(type,deptOverride),old=document.getElementById('_grcFormModal');if(old)old.remove();
    var ov=document.createElement('div');ov.id='_grcFormModal';ov.className='grc-modal-backdrop';ov.innerHTML='<div class="grc-modal"><div class="grc-modal-head"><div><div class="grc-modal-title">'+spec.title+'</div><div class="grc-modal-sub">'+L('draftWorkspace')+' · '+L('localNote')+'</div></div><button class="grc-modal-close" onclick="document.getElementById(\'_grcFormModal\').remove()">×</button></div><form class="grc-modal-body" id="_grcForm"><div class="grc-form-grid">'+spec.fields+'</div><div id="_grcFormErr" style="font-size:9px;color:#b83232;font-weight:800;margin-top:10px"></div><div class="grc-modal-actions"><button type="button" class="grc-secondary-btn" onclick="document.getElementById(\'_grcFormModal\').remove()">'+L('cancel')+'</button><button type="submit" class="grc-primary-btn">'+L('save')+'</button></div></form></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    document.getElementById('_grcForm').addEventListener('submit',function(e){e.preventDefault();var ok=true;Array.prototype.forEach.call(e.target.querySelectorAll('[required]'),function(el){if(!String(el.value||'').trim())ok=false;});if(!ok){document.getElementById('_grcFormErr').textContent=L('required');return;}var fd=new FormData(e.target),obj={id:nextId(spec.prefix,spec.collection),createdAt:new Date().toISOString(),createdBy:currentName()};fd.forEach(function(v,k){obj[k]=v;});if(obj.likelihood!==undefined)obj.likelihood=Number(obj.likelihood);if(obj.impact!==undefined)obj.impact=Number(obj.impact);if(obj.progress!==undefined)obj.progress=Number(obj.progress||0);state[spec.collection].push(obj);ov.remove();saveState();});
  };

  window._grcDelete=function(collection,id){if(normalizedRole()!=='super_admin')return;if(!window.confirm(L('confirmDelete')))return;state[collection]=(state[collection]||[]).filter(function(r){return String(r.id)!==String(id);});saveState();};
  window._grcSwitch=function(id){if(!modules.some(function(x){return x.id===id;}))id='executive';activeTab=id;render();var m=app&&app.querySelector('.grc-main');if(m)m.scrollTop=0;};
  window._grcToggleLang=function(){if(typeof window.lang!=='undefined')window.lang=window.lang==='en'?'ar':'en';else window.lang=isAr()?'en':'ar';document.documentElement.lang=isAr()?'ar':'en';document.documentElement.dir=isAr()?'rtl':'ltr';var b=document.getElementById('langBtn');if(b)b.textContent=isAr()?'EN':'عربي';render();};
  window._grcRefreshLanguage=function(){render();};
  window._hideGRC=function(){var a=document.getElementById('grcApp');if(a){a.classList.remove('grc-visible');a.setAttribute('aria-hidden','true');}document.body.classList.remove('grc-mode');};
  window._exitGRC=function(){window._hideGRC();var bg=document.getElementById('_bgLayer'),po=document.getElementById('_portalOverlay'),auth=document.getElementById('_authOverlay');if(auth)auth.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};
  window._openGrcPortal=function(){if(normalizedRole()==='super_admin')window._enterGRC();else window._showGrcComingSoon();};
  window._enterGRC=function(){if(normalizedRole()!=='super_admin'){window._showGrcComingSoon();return;}['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});ensureApp();document.body.classList.add('grc-mode');app.classList.add('grc-visible');app.setAttribute('aria-hidden','false');render();};
  window._closeGrcComingSoon=function(){var ov=document.getElementById('_grcComingSoon');if(ov)ov.remove();document.body.classList.remove('grc-coming-open');};
  window._showGrcComingSoon=function(){window._closeGrcComingSoon();document.body.classList.add('grc-coming-open');var ov=document.createElement('div');ov.id='_grcComingSoon';ov.className='grc-modal-backdrop grc-coming-backdrop';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','_grcComingTitle');ov.innerHTML='<div class="grc-coming-card"><div class="grc-coming-icon">▦</div><div id="_grcComingTitle" class="grc-coming-title">'+L('comingTitle')+'</div><div class="grc-coming-sub">'+L('comingSub')+'</div><div class="grc-coming-pill">'+L('comingSoon')+'</div><div><button type="button" class="grc-coming-back-btn" onclick="window._closeGrcComingSoon()">← '+L('back')+'</button></div></div>';document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)window._closeGrcComingSoon();});};

  document.addEventListener('DOMContentLoaded',function(){ensureApp();});
})();
