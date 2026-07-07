/* ======================================================================
   QUMC GRC Workspace — Super Admin Preview
   Version: 2026-07-07 Executive Layout & Premium Chart System

   Scope
   - Executive Command: Governance + Risk/Incident/Code summaries.
   - Governance: every FMS department is rendered in a dedicated stacked
     section with policy, plan and form dashboards.
   - Risk Management: every FMS department is rendered in a dedicated stacked
     section with risk, incident and emergency-code dashboards/registers.
   - FMS Manuals & Guidelines: dedicated top-level page.
   - Super Admin only. All other roles receive Coming Soon.
   - Preview records remain in localStorage until Firestore workflow is approved.
   ====================================================================== */
(function(){
  'use strict';

  window.__QUMC_GRC_BUILD__='20260707-grc-reports-library-v16';

  var STORAGE_KEY='qumc_grc_workspace_preview_v1';
  var STATE_VERSION=8;
  var activeTab='executive';
  var app=null;

  var labels={
    en:{
      app:'Governance, Risk & Compliance',sub:'Facilities & Safety Division',preview:'Super Admin Preview',back:'Back to Portal',
      executive:'Executive Command',governance:'Governance',manuals:'FMS Manuals & Guidelines',risk:'Risk Management',register:'Register',compliance:'Compliance',audit:'Audit & Assurance',actions:'Action Plans',documents:'Documents & Records',reports:'Reports',
      executiveTitle:'Executive Command',executiveDesc:'A consolidated view of governance records, risks, incidents and emergency codes across the Facilities & Safety Division.',
      governanceTitle:'Governance',governanceDesc:'Policies, plans and approved forms, monitored for the division and for every department.',
      riskTitle:'Risk Management',riskDesc:'Department-level oversight of risks, incidents and emergency codes with dedicated operational registers.',registerTitle:'Registers',registerDesc:'A consolidated register center. Every register contains records from all FMS departments, grouped clearly by department.',governanceRegisterGroup:'Governance Registers',riskRegisterGroup:'Risk Management Registers',assuranceRegisterGroup:'Assurance & Control Registers',
      manualsTitle:'FMS Manuals & Guidelines',manualsDesc:'A controlled register for Facilities & Safety manuals, guidelines and approved operating references.',
      governanceOverview:'Governance Overview',riskOverview:'Risk, Incident & Code Overview',departmentView:'Department Sections',departmentSectionsDesc:'Each FMS department is displayed in a dedicated section, aligned with the Performance department view.',divisionOverview:'FMS Division Overview',allDepartments:'All FMS Departments',departmentRecords:'Department Records',
      executiveSnapshot:'Executive Portfolio Snapshot',executiveSnapshotDesc:'Live consolidated indicators across Governance and Risk Management.',governanceRecords:'Governance Records',governanceStatusChart:'Governance Records Status',governanceVolumeChart:'Records by Governance Area',riskDistributionChart:'Risk Level Distribution',riskExposureChart:'High & Critical Risks by Department',riskCategoryChart:'Risks by Category',incidentTrendChart:'Incident Trend by Year',codeOutcomeChart:'Emergency Code Outcomes',codeTypeChart:'Emergency Codes by Type',dueReviewTimeline:'Review / Expiry Timeline',riskHeatMap:'Risk Heat Map',riskImpactAxis:'Impact of Risk Occurrence',riskLikelihoodAxis:'Likelihood of Risk Occurrence',almostCertain:'Almost Certain',likely:'Likely',possible:'Possible',unlikely:'Unlikely',rare:'Rare',veryHighImpact:'Very High Impact',highImpact:'High Impact',mediumImpact:'Medium Impact',lowImpact:'Low Impact',veryLowImpact:'Very Low Impact',veryHighRisk:'Very High',highRiskLabel:'High',mediumRiskLabel:'Medium',lowRiskLabel:'Low',risksInCell:'risks',dueThisYear:'Due This Year',other:'Other',attention:'Needs Attention',
      policies:'Policies',plans:'Plans',forms:'Forms',
      totalPolicies:'Total Policies',openPolicies:'Active Policies',expiredPolicies:'Expired Policies',expiringThisYear:'Expiring This Year',expiredPolicyRate:'Expired Policies Rate',
      totalPlans:'Total Plans',activePlans:'Active Plans',expiredPlans:'Expired Plans',expiredPlanRate:'Expired Plans Rate',
      totalForms:'Total Forms',activeForms:'Active Forms',expiredForms:'Expired Forms',
      policyRegister:'Policy Register',planRegister:'Plan Register',formRegister:'Approved Forms Register',manualRegister:'Manuals & Guidelines Register',
      totalManuals:'Total Manuals',activeManuals:'Active Manuals',expiredManuals:'Expired Manuals',manualsDue:'Due for Review This Year',
      orgStructure:'Organizational Structure',orgStructureDesc:'FMS reporting lines, departments and process ownership.',raci:'RACI Matrix',raciDesc:'Responsibility, accountability, consultation and information mapping.',annualPlan:'Annual Operational Plan',annualPlanDesc:'Annual priorities, initiatives, owners and milestones.',orgChartTitle:'FMS Organizational Structure',orgChartDesc:'Approved reporting lines, departments, units and service functions.',fmsDirector:'FMS Director',governanceOperations:'',ticketingCentre:'Ticketing Centre',planningAuditing:'Planning & Auditing',administrativeServices:'Administrative Services Unit',mechanicalUnit:'Mechanical Unit',hvacUnit:'HVAC Unit',electronicsUnit:'Electronics Unit',electricalUnit:'Electrical Unit',architecturalCivilUnit:'Architectural & Civil Works Unit',medicalWasteUnit:'Medical Waste Unit',housekeepingServicesUnit:'Housekeeping Services Unit',laundryServicesUnit:'Laundry Services Unit',safetyManagementUnit:'Safety Management Unit',fireProtectionUnit:'Fire Protection Unit',hazardousMaterialUnit:'Hazardous Material Management Unit',projectStudies:'Project Studies',projectMonitoring:'Project Monitoring',
      totalRisks:'Total Risks',openRisks:'Open Risks',closedRisks:'Closed Risks',closedRiskRate:'Closed Risks Rate',criticalRisks:'Critical Risks',highRisks:'High Risks',mediumRisks:'Medium Risks',lowRisks:'Low Risks',highCriticalRate:'High & Critical Risks Rate',
      incidents:'Incidents',totalIncidents:'Total Incidents',openIncidents:'Open Incidents',closedIncidents:'Closed Incidents',closedIncidentRate:'Closed Incidents Rate',incidentsByYear:'Incidents by Year',
      codes:'Emergency Codes',totalCodes:'Total Codes',realCodes:'Real Code',drillCodes:'Drill Code',successfulCodes:'Successful Code',failedCodes:'Failed Code',failedCodeRate:'Failed Codes Rate',successfulDrills:'Successful Code',failedDrills:'Failed Code',successVsFailed:'Successful vs Failed',
      riskRegister:'Risk Register',incidentRegister:'Incident Register',codeRegister:'Emergency Code Register',
      addPolicy:'Add Policy',addPlan:'Add Plan',addEmergencyPlan:'Add Emergency Plan',addForm:'Add Form',addManual:'Add Manual / Guideline',addRisk:'Add Risk',addIncident:'Add Incident',addCode:'Add Code',
      id:'ID',name:'Name',code:'Code',issueDate:'Issue Date',policyId:'Policy ID',policyName:'Policy Name',planId:'Plan ID',planName:'Plan Name',formId:'Form ID',formName:'Form Name',manualId:'Manual ID',manualName:'Manual / Guideline',
      department:'Department',owner:'Owner',effectiveDate:'Effective Date',startDate:'Start Date',expiryDate:'Expiry Date',reviewDate:'Review Date',version:'Version',status:'Status',category:'Category',actionsCol:'Actions',
      riskId:'Risk ID',riskIdentified:'Risk Identified',riskCategory:'Risk Category',likelihood:'Likelihood',impact:'Impact',riskScore:'Risk Score',riskLevel:'Risk Level',controlType:'Current Risk Control Type',actionStatus:'Action Status',
      incidentId:'Incident ID',date:'Date',contributingFactors:'Contributing Factors',investigationRequired:'Investigation Required (Yes/No)',responsibleDept:'Responsible Dept.',
      codeNumber:'Number',type:'Type',location:'Location',closeDateTime:'Close Date Time',
      total:'Total',open:'Open',closed:'Closed',active:'Active',expired:'Expired',draft:'Draft',underReview:'Under Review',planned:'Planned',archived:'Archived',inProgress:'In Progress',completed:'Completed',
      critical:'Critical',high:'High',medium:'Medium',low:'Low',successful:'Successful',failed:'Failed',real:'Real',drill:'Drill',yes:'Yes',no:'No',
      preventive:'Preventive',detective:'Detective',corrective:'Corrective',directive:'Directive',noControl:'No Current Control',
      operational:'Operational',facility:'Facility',safetyRisk:'Safety',complianceRisk:'Compliance',contractor:'Contractor',emergencyPreparedness:'Emergency Preparedness',
      maintenance:'Maintenance',safety:'Safety',housekeeping:'Housekeeping',housekeepingRisk:'Housekeeping',laundryRisk:'Laundry',projects:'Project Management',division:'FMS Division',allFms:'All FMS',
      noRecords:'No records added yet',noRecordsSub:'Use the Add button to start the preview register.',localNote:'Preview records are saved on this device only.',draftWorkspace:'Draft workspace',
      recordDetails:'Record Details',close:'Close',delete:'Delete',confirmDelete:'Delete this preview record?',cancel:'Cancel',save:'Save Record',required:'Please complete all required fields.',
      percentage:'Rate',records:'Records',clickToView:'Click to view records',year:'Year',count:'Count',noMatching:'No matching records.',
      complianceTitle:'Compliance',complianceDesc:'Regulatory requirements, evidence and corrective actions.',auditTitle:'Audit & Assurance',auditDesc:'Audit findings, recommendations and closure evidence.',actionsTitle:'Action Plans',actionsDesc:'Actions arising from risks, incidents, compliance gaps and reviews.',documentsTitle:'Documents & Records',documentsDesc:'Supporting controlled documents and historical records.',reportsTitle:'Reports',reportsDesc:'Annual and quarterly Facilities & Safety reports available for direct viewing inside the platform.',reportsHub:'Reports Library',reportLibraryDesc:'Select the report family, type, year and quarter to open the report inside the platform.',annualReports:'Annual',quarterlyReports:'Quarterly',annualExecutiveSummary:'Annual Executive Summary',annualFmsReport:'Annual Facilities & Safety Report',quarterlyExecutiveSummary:'Quarterly Executive Summary',quarterlyFmsReport:'Quarterly Facilities & Safety Report',selectReportType:'Select Report Type',selectYear:'Select Year',selectQuarter:'Select Quarter',reportDocuments:'Report Documents',quarterlyDocuments:'Quarterly Reports',executiveSummaries:'Executive Summaries',annualDocuments:'Annual Reports',availableYears:'Available Years',reportsByYear:'Reports by Year',reportCoverage:'Report Coverage by Year',reportViewer:'Report Viewer',available:'Available',unavailable:'Not Available',openFullScreen:'Open Full Screen',noReportAvailable:'No report is available for this selection yet.',q1:'Quarter 1',q2:'Quarter 2',q3:'Quarter 3',q4:'Quarter 4',monthlyIncidentTrend:'Monthly Incident Trend by Year',pages:'pages',
      comingTitle:'GRC Module',comingSub:'This module is currently under development.',comingSoon:'Coming Soon',
      authority:'Authority / Standard',requirement:'Requirement',severity:'Severity',source:'Source',progress:'Progress Rate %',title:'Title / Description',dueDate:'Due Date',
      addRequirement:'Add Requirement',addFinding:'Add Finding',addAction:'Add Action',addDocument:'Add Document',compliant:'Compliant',partial:'Partially Compliant',nonCompliant:'Non-Compliant',notApplicable:'Not Applicable',major:'Major',minor:'Minor',observation:'Observation',pendingVerification:'Pending Verification',pendingApproval:'Pending Approval'
    },
    ar:{
      app:'الحوكمة والمخاطر والالتزام',sub:'إدارة المرافق والسلامة',preview:'معاينة السوبر أدمن',back:'العودة للبوابة',
      executive:'القيادة التنفيذية',governance:'الحوكمة',manuals:'أدلة وإرشادات إدارة المرافق والسلامة',risk:'إدارة المخاطر',register:'السجلات',compliance:'الالتزام',audit:'التدقيق والتوكيد',actions:'خطط العمل',documents:'الوثائق والسجلات',reports:'التقارير',
      executiveTitle:'القيادة التنفيذية',executiveDesc:'نظرة موحدة على سجلات الحوكمة والمخاطر والحوادث وأكواد الطوارئ في إدارة المرافق والسلامة.',
      governanceTitle:'الحوكمة',governanceDesc:'متابعة السياسات والخطط والنماذج المعتمدة على مستوى الإدارة وكل قسم.',
      riskTitle:'إدارة المخاطر',riskDesc:'متابعة المخاطر والحوادث وأكواد الطوارئ لكل قسم مع سجلات تشغيلية مستقلة.',registerTitle:'السجلات',registerDesc:'مركز موحد لجميع سجلات إدارة المرافق والسلامة، مع تجميع سجلات كل قسم بصورة واضحة داخل كل سجل.',governanceRegisterGroup:'سجلات الحوكمة',riskRegisterGroup:'سجلات إدارة المخاطر',assuranceRegisterGroup:'سجلات التوكيد والرقابة',
      manualsTitle:'أدلة وإرشادات إدارة المرافق والسلامة',manualsDesc:'سجل منضبط لأدلة وإرشادات إدارة المرافق والسلامة والمراجع التشغيلية المعتمدة.',
      governanceOverview:'نظرة الحوكمة',riskOverview:'نظرة المخاطر والحوادث والأكواد',departmentView:'أقسام الإدارة',departmentSectionsDesc:'يظهر كل قسم من أقسام إدارة المرافق والسلامة في قسم مستقل وبنفس فكرة عرض الأقسام في الأداء.',divisionOverview:'نظرة شاملة لإدارة المرافق والسلامة',allDepartments:'جميع أقسام إدارة المرافق والسلامة',departmentRecords:'سجلات القسم',
      executiveSnapshot:'ملخص المحفظة التنفيذية',executiveSnapshotDesc:'مؤشرات موحدة ومحدثة للحوكمة وإدارة المخاطر.',governanceRecords:'سجلات الحوكمة',governanceStatusChart:'حالة سجلات الحوكمة',governanceVolumeChart:'السجلات حسب مجال الحوكمة',riskDistributionChart:'توزيع مستويات المخاطر',riskExposureChart:'المخاطر العالية والحرجة حسب القسم',riskCategoryChart:'المخاطر حسب التصنيف',incidentTrendChart:'اتجاه الحوادث حسب السنة',codeOutcomeChart:'نتائج أكواد الطوارئ',codeTypeChart:'أكواد الطوارئ حسب النوع',dueReviewTimeline:'الاستحقاق للمراجعة / الانتهاء',riskHeatMap:'مصفوفة أوزان المخاطر',riskImpactAxis:'أثر حدوث المخاطر',riskLikelihoodAxis:'احتمالية حدوث المخاطر',almostCertain:'مؤكد غالباً',likely:'محتمل',possible:'ممكن',unlikely:'غير محتمل',rare:'نادر',veryHighImpact:'عالي جداً',highImpact:'عالي التأثير',mediumImpact:'متوسط التأثير',lowImpact:'قليل التأثير',veryLowImpact:'ضعيف التأثير',veryHighRisk:'مرتفع جداً',highRiskLabel:'مرتفع',mediumRiskLabel:'متوسط',lowRiskLabel:'منخفض',risksInCell:'مخاطر',dueThisYear:'تستحق خلال السنة',other:'أخرى',attention:'بحاجة للمتابعة',
      policies:'السياسات',plans:'الخطط',forms:'النماذج',
      totalPolicies:'عدد السياسات',openPolicies:'السياسات السارية',expiredPolicies:'السياسات المنتهية',expiringThisYear:'ستنتهي خلال السنة الحالية',expiredPolicyRate:'معدل السياسات المنتهية',
      totalPlans:'عدد الخطط',activePlans:'الخطط السارية',expiredPlans:'الخطط المنتهية',expiredPlanRate:'معدل الخطط المنتهية',
      totalForms:'عدد النماذج',activeForms:'النماذج السارية',expiredForms:'النماذج المنتهية',
      policyRegister:'سجل السياسات',planRegister:'سجل الخطط',formRegister:'سجل النماذج المعتمدة',manualRegister:'سجل الأدلة والإرشادات',
      totalManuals:'عدد الأدلة',activeManuals:'الأدلة السارية',expiredManuals:'الأدلة المنتهية',manualsDue:'مستحقة للمراجعة هذا العام',
      orgStructure:'الهيكل التنظيمي',orgStructureDesc:'خطوط الإشراف والأقسام وملاك العمليات في إدارة المرافق والسلامة.',raci:'مصفوفة RACI',raciDesc:'توزيع المسؤولية والمساءلة والاستشارة والإحاطة.',annualPlan:'الخطة التشغيلية السنوية',annualPlanDesc:'الأولويات والمبادرات والملاك والمراحل السنوية.',orgChartTitle:'الهيكل التنظيمي لإدارة المرافق والسلامة',orgChartDesc:'خطوط الارتباط المعتمدة والأقسام والوحدات والمهام الخدمية.',fmsDirector:'مدير إدارة المرافق والسلامة',governanceOperations:'',ticketingCentre:'مركز التذاكر',planningAuditing:'التخطيط والتدقيق',administrativeServices:'وحدة الخدمات الإدارية',mechanicalUnit:'وحدة الميكانيكا',hvacUnit:'وحدة التكييف',electronicsUnit:'وحدة الإلكترونيات',electricalUnit:'وحدة الكهرباء',architecturalCivilUnit:'وحدة الأعمال المعمارية والمدنية',medicalWasteUnit:'وحدة النفايات الطبية',housekeepingServicesUnit:'وحدة خدمات النظافة',laundryServicesUnit:'وحدة خدمات الغسيل',safetyManagementUnit:'وحدة إدارة السلامة',fireProtectionUnit:'وحدة الوقاية من الحريق',hazardousMaterialUnit:'وحدة إدارة المواد الخطرة',projectStudies:'دراسة المشاريع',projectMonitoring:'متابعة المشاريع',
      totalRisks:'عدد المخاطر',openRisks:'المخاطر المفتوحة',closedRisks:'المخاطر المغلقة',closedRiskRate:'معدل المخاطر المغلقة',criticalRisks:'المخاطر الحرجة',highRisks:'المخاطر العالية',mediumRisks:'المخاطر المتوسطة',lowRisks:'المخاطر المنخفضة',highCriticalRate:'معدل المخاطر العالية والحرجة',
      incidents:'الحوادث',totalIncidents:'عدد الحوادث',openIncidents:'الحوادث المفتوحة',closedIncidents:'الحوادث المغلقة',closedIncidentRate:'معدل الحوادث المغلقة',incidentsByYear:'الحوادث حسب السنة',
      codes:'أكواد الطوارئ',totalCodes:'إجمالي الأكواد',realCodes:'الكود الفعلي',drillCodes:'الكود التدريبي',successfulCodes:'الكود الناجح',failedCodes:'الكود غير الناجح',failedCodeRate:'معدل الأكواد غير الناجحة',successfulDrills:'الكود الناجح',failedDrills:'الكود غير الناجح',successVsFailed:'الناجحة مقابل غير الناجحة',
      riskRegister:'سجل المخاطر',incidentRegister:'سجل الحوادث',codeRegister:'سجل أكواد الطوارئ',
      addPolicy:'إضافة سياسة',addPlan:'إضافة خطة',addEmergencyPlan:'إضافة خطة طوارئ',addForm:'إضافة نموذج',addManual:'إضافة دليل / إرشاد',addRisk:'إضافة مخاطرة',addIncident:'إضافة حادث',addCode:'إضافة كود',
      id:'الرقم',name:'الاسم',code:'الرمز',issueDate:'تاريخ الإصدار',policyId:'رقم السياسة',policyName:'اسم السياسة',planId:'رقم الخطة',planName:'اسم الخطة',formId:'رقم النموذج',formName:'اسم النموذج',manualId:'رقم الدليل',manualName:'اسم الدليل / الإرشاد',
      department:'القسم',owner:'المالك',effectiveDate:'تاريخ السريان',startDate:'تاريخ البداية',expiryDate:'تاريخ الانتهاء',reviewDate:'تاريخ المراجعة',version:'الإصدار',status:'الحالة',category:'التصنيف',actionsCol:'الإجراءات',
      riskId:'رقم الخطر',riskIdentified:'الخطر المحدد',riskCategory:'تصنيف الخطر',likelihood:'الاحتمالية',impact:'الأثر',riskScore:'درجة الخطر',riskLevel:'مستوى الخطر',controlType:'نوع الضوابط الحالية',actionStatus:'حالة الإجراء',
      incidentId:'رقم الحادث',date:'التاريخ',contributingFactors:'العوامل المساهمة',investigationRequired:'هل يتطلب تحقيقاً؟ (نعم/لا)',responsibleDept:'القسم المسؤول',
      codeNumber:'الرقم',type:'النوع',location:'الموقع',closeDateTime:'تاريخ ووقت الإغلاق',
      total:'الإجمالي',open:'مفتوح',closed:'مغلق',active:'ساري',expired:'منتهي',draft:'مسودة',underReview:'تحت المراجعة',planned:'مخطط',archived:'مؤرشف',inProgress:'قيد التنفيذ',completed:'مكتمل',
      critical:'حرج',high:'عالٍ',medium:'متوسط',low:'منخفض',successful:'ناجح',failed:'غير ناجح',real:'فعلي',drill:'تدريبي',yes:'نعم',no:'لا',
      preventive:'وقائي',detective:'كاشف',corrective:'تصحيحي',directive:'توجيهي',noControl:'لا توجد ضوابط حالية',
      operational:'تشغيلي',facility:'مرافق',safetyRisk:'سلامة',complianceRisk:'التزام',contractor:'مقاولون',emergencyPreparedness:'استعداد للطوارئ',
      maintenance:'الصيانة',safety:'السلامة',housekeeping:'النظافة',housekeepingRisk:'النظافة',laundryRisk:'المغسلة',projects:'إدارة المشاريع',division:'إدارة المرافق والسلامة',allFms:'إدارة المرافق والسلامة',
      noRecords:'لا توجد سجلات مضافة',noRecordsSub:'استخدم زر الإضافة لبدء تجربة السجل.',localNote:'تُحفظ سجلات المعاينة في هذا الجهاز فقط.',draftWorkspace:'مساحة عمل تجريبية',
      recordDetails:'تفاصيل السجلات',close:'إغلاق',delete:'حذف',confirmDelete:'هل تريد حذف سجل المعاينة؟',cancel:'إلغاء',save:'حفظ السجل',required:'يرجى تعبئة جميع الحقول المطلوبة.',
      percentage:'المعدل',records:'السجلات',clickToView:'اضغط لعرض السجلات',year:'السنة',count:'العدد',noMatching:'لا توجد سجلات مطابقة.',
      complianceTitle:'الالتزام',complianceDesc:'المتطلبات النظامية والأدلة والإجراءات التصحيحية.',auditTitle:'التدقيق والتوكيد',auditDesc:'ملاحظات التدقيق والتوصيات وأدلة الإغلاق.',actionsTitle:'خطط العمل',actionsDesc:'الإجراءات الناتجة من المخاطر والحوادث وفجوات الالتزام والمراجعات.',documentsTitle:'الوثائق والسجلات',documentsDesc:'الوثائق المساندة والسجلات التاريخية المنضبطة.',reportsTitle:'التقارير',reportsDesc:'التقارير السنوية والربعية لإدارة المرافق والسلامة متاحة للقراءة المباشرة داخل المنصة.',reportsHub:'مكتبة التقارير',reportLibraryDesc:'اختر نوع التقارير ونوع المستند والسنة والربع لفتح التقرير داخل المنصة.',annualReports:'السنوي',quarterlyReports:'الربعي',annualExecutiveSummary:'الملخص التنفيذي السنوي',annualFmsReport:'التقرير السنوي لإدارة المرافق والسلامة',quarterlyExecutiveSummary:'الملخص التنفيذي الربعي',quarterlyFmsReport:'التقرير الربعي لإدارة المرافق والسلامة',selectReportType:'اختر نوع التقرير',selectYear:'اختر السنة',selectQuarter:'اختر الربع',reportDocuments:'إجمالي مستندات التقارير',quarterlyDocuments:'التقارير الربعية',executiveSummaries:'الملخصات التنفيذية',annualDocuments:'التقارير السنوية',availableYears:'السنوات المتاحة',reportsByYear:'التقارير حسب السنة',reportCoverage:'تغطية التقارير حسب السنة',reportViewer:'عارض التقرير',available:'متاح',unavailable:'غير متاح',openFullScreen:'عرض بملء الشاشة',noReportAvailable:'لا يوجد تقرير متاح لهذا الاختيار حالياً.',q1:'الربع الأول',q2:'الربع الثاني',q3:'الربع الثالث',q4:'الربع الرابع',monthlyIncidentTrend:'الاتجاه الشهري للحوادث حسب السنة',pages:'صفحة',
      comingTitle:'قسم GRC',comingSub:'هذا القسم تحت التطوير حالياً.',comingSoon:'قريباً',
      authority:'الجهة / المعيار',requirement:'المتطلب',severity:'الخطورة',source:'المصدر',progress:'معدل الإنجاز %',title:'العنوان / الوصف',dueDate:'تاريخ الاستحقاق',
      addRequirement:'إضافة متطلب',addFinding:'إضافة ملاحظة',addAction:'إضافة إجراء',addDocument:'إضافة وثيقة',compliant:'ملتزم',partial:'ملتزم جزئياً',nonCompliant:'غير ملتزم',notApplicable:'لا ينطبق',major:'جوهري',minor:'بسيط',observation:'ملاحظة',pendingVerification:'بانتظار التحقق',pendingApproval:'بانتظار الاعتماد'
    }
  };

  var modules=[
    {id:'executive',icon:'⌂'},
    {id:'governance',icon:'▦',count:'governance'},
    {id:'risk',icon:'◇',count:'risk'},
    {id:'register',icon:'▤',count:'register'},
    {id:'compliance',icon:'✓',count:'compliance'},
    {id:'audit',icon:'◎',count:'audits'},
    {id:'actions',icon:'→',count:'actions'},
    {id:'documents',icon:'▣',count:'documents'},
    {id:'reports',icon:'▥'},
    {id:'manuals',icon:'▤',count:'manuals'}
  ];

  var departments=['allFms','maintenance','safety','housekeeping','projects'];
  var departmentOrder=departments.slice(1);
  var departmentMeta={
    maintenance:{abbr:'MNT',color:'#60A5FA',ink:'#2563EB',soft:'rgba(96,165,250,.14)'},
    safety:{abbr:'SAF',color:'#F87171',ink:'#DC2626',soft:'rgba(248,113,113,.14)'},
    housekeeping:{abbr:'HK',color:'#34D399',ink:'#15803D',soft:'rgba(52,211,153,.14)'},
    housekeepingRisk:{abbr:'HK',color:'#34D399',ink:'#15803D',soft:'rgba(52,211,153,.14)'},
    laundryRisk:{abbr:'LND',color:'#2FBF9F',ink:'#0F766E',soft:'rgba(47,191,159,.14)'},
    projects:{abbr:'PMD',color:'#FBBF24',ink:'#B45309',soft:'rgba(251,191,36,.18)'},
    division:{abbr:'FMS',color:'#1E3E6A',ink:'#1E3E6A',soft:'rgba(30,62,106,.11)'}
  };

  /* Restrained QUMC chart palette: softer than status colors while preserving meaning. */
  var chartPalette={
    navy:'#4E6B8F',blue:'#6F93C2',teal:'#52A8A5',green:'#70B59B',
    amber:'#D7B267',orange:'#D99A68',coral:'#D77B80',rose:'#C96572',
    violet:'#8C84B8',slate:'#A5B2C1',pale:'#DDE6ED'
  };
  var chartSeq=0;

  /* Static report catalog. Add future entries here and their years appear automatically. */
  var REPORT_LIBRARY=[
    {id:'qr-2025-q1',group:'quarterly',type:'quarterlyReport',year:2025,quarter:1,path:'assets/reports/quarterly_report_2025_q1.pdf',pages:128,titleEn:'Facilities & Safety Quarterly Report - Q1 2025',titleAr:'التقرير الربعي الأول لإدارة المرافق والسلامة لعام 2025'},
    {id:'qr-2025-q2',group:'quarterly',type:'quarterlyReport',year:2025,quarter:2,path:'assets/reports/quarterly_report_2025_q2.pdf',pages:130,titleEn:'Facilities & Safety Quarterly Report - Q2 2025',titleAr:'التقرير الربعي الثاني لإدارة المرافق والسلامة لعام 2025'},
    {id:'qr-2025-q3',group:'quarterly',type:'quarterlyReport',year:2025,quarter:3,path:'assets/reports/quarterly_report_2025_q3.pdf',pages:135,titleEn:'Facilities & Safety Quarterly Report - Q3 2025',titleAr:'التقرير الربعي الثالث لإدارة المرافق والسلامة لعام 2025'},
    {id:'qr-2025-q4',group:'quarterly',type:'quarterlyReport',year:2025,quarter:4,path:'assets/reports/quarterly_report_2025_q4.pdf',pages:137,titleEn:'Facilities & Safety Quarterly Report - Q4 2025',titleAr:'التقرير الربعي الرابع لإدارة المرافق والسلامة لعام 2025'},
    {id:'qe-2025-q3',group:'quarterly',type:'quarterlyExecutive',year:2025,quarter:3,path:'assets/reports/quarterly_executive_2025_q3.pdf',pages:11,titleEn:'Executive Summary - Q3 2025',titleAr:'الملخص التنفيذي للربع الثالث لعام 2025'},
    {id:'qe-2025-q4',group:'quarterly',type:'quarterlyExecutive',year:2025,quarter:4,path:'assets/reports/quarterly_executive_2025_q4.pdf',pages:14,titleEn:'Executive Summary - Q4 2025',titleAr:'الملخص التنفيذي للربع الرابع لعام 2025'},
    {id:'qr-2026-q2',group:'quarterly',type:'quarterlyReport',year:2026,quarter:2,path:'assets/reports/quarterly_report_2026_q2.pdf',pages:1,titleEn:'Facilities & Safety Quarterly Report - Q2 2026',titleAr:'التقرير الربعي الثاني لإدارة المرافق والسلامة لعام 2026'}
  ];
  var reportNav={group:null,type:null,year:null,quarter:null};
  var reportManifestLoaded=false;
  function loadReportManifest(){
    if(reportManifestLoaded||typeof fetch!=='function')return;reportManifestLoaded=true;
    fetch('assets/reports/manifest.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('manifest');return r.json();}).then(function(list){
      if(!Array.isArray(list))return;var changed=false;
      list.forEach(function(x){var type=String(x.type||''),year=Number(x.year),quarter=x.quarter==null?null:Number(x.quarter),file=String(x.file||'');if(!type||!year||!file)return;var exists=REPORT_LIBRARY.some(function(r){return r.type===type&&Number(r.year)===year&&Number(r.quarter||0)===Number(quarter||0);});if(exists)return;REPORT_LIBRARY.push({id:type+'-'+year+'-'+(quarter||'annual'),group:type.indexOf('annual')===0?'annual':'quarterly',type:type,year:year,quarter:quarter,path:'assets/reports/'+file,pages:Number(x.pages||0),titleEn:String(x.titleEn||reportTypeLabel(type)+' - '+year+(quarter?' Q'+quarter:'')),titleAr:String(x.titleAr||reportTypeLabel(type)+' - '+year+(quarter?' - الربع '+quarter:''))});changed=true;});
      if(changed&&activeTab==='reports')render();
    }).catch(function(){});
  }

  /* Imported from rrrisk.xlsx — department is derived from the Risk ID prefix. */
  var RISK_REGISTER_SEED=[{"id":"SAF 01","riskIdentified":"Presence of anesthetic gases& equipment which act source of fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 02","riskIdentified":"storage of flamable items& hazardouse chemical which source of fire","riskCategory":"Hazard / Environmental","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 03","riskIdentified":"fire in the medical record","riskCategory":"Hazard / Environmental","likelihood":2,"impact":2,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 04","riskIdentified":"Inadequate cleaning of grease filters and hoods near natural gas lines may leads to oil-ignited kitchen fires during cooking operations that may cause service interruption in food supply and threat to staff and visitor safety.","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 05","riskIdentified":"electrical spark& flamable solar  as source fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 06","riskIdentified":"electrical sparks from equipment produce source of fire","riskCategory":"Hazard / Environmental","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 07","riskIdentified":"Overheating and electrical faults from equipment which may act as source of fire& connected to electricty","riskCategory":"Hazard / Environmental","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 08","riskIdentified":"explosion of medical gase& presensice of flamable gases","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 09","riskIdentified":"lack of awarness of staff about how to deal in case of presence of fire","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 10","riskIdentified":"Smoking inside the hospital","riskCategory":"Hazard / Environmental","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 11","riskIdentified":"explosuion of natural gase line","riskCategory":"Hazard / Environmental","likelihood":2,"impact":1,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 12","riskIdentified":"fire in the main disel tank","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 13","riskIdentified":"Fire in parking area","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"safety"},{"id":"SAF 14","riskIdentified":"Poor coordination in emergency responses","riskCategory":"Operational","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 15","riskIdentified":"Slip, trip, and fall hazards","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 16","riskIdentified":"Natural disasters (e.g., earthquakes, floods)","riskCategory":"Hazard / Environmental","likelihood":1,"impact":3,"riskScore":3,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 17","riskIdentified":"Hazardous chemical spills","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 18","riskIdentified":"Improper disposal of expired medications or chemical containers","riskCategory":"Hazard / Environmental","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 19","riskIdentified":"Lack of evacuation maps in departments","riskCategory":"Strategic","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"safety"},{"id":"SAF 20","riskIdentified":"No Fm-200 in some rooms","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"SAF 21","riskIdentified":"No water availabilty in fire OPD","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Reduction","actionStatus":"open","department":"safety"},{"id":"SAF 22","riskIdentified":"failure to inspect fire extinguishing  during preventive rounds","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Risk Avoidance","actionStatus":"closed","department":"safety"},{"id":"SAF 23","riskIdentified":"lack of sufficient fire extinguishers in some places","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Risk Acceptance","actionStatus":"closed","department":"safety"},{"id":"SAF 24","riskIdentified":"Improper storage of hazardous chemical","riskCategory":"Hazard / Environmental","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"closed","department":"safety"},{"id":"SAF 25","riskIdentified":"Operational failure of the fire alarm system","riskCategory":"Hazard / Environmental","likelihood":4,"impact":3,"riskScore":12,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"closed","department":"safety"},{"id":"SAF 26","riskIdentified":"Failure of Firefighting System (Sprinklers / Pumps / Hose Reel)","riskCategory":"Hazard / Environmental","likelihood":3,"impact":5,"riskScore":15,"riskLevel":"Critical","controlType":"Loss Reduction","actionStatus":"closed","department":"safety"},{"id":"MNT 01","riskIdentified":"Operational failure of the Air Handling Unit (AHU) in critical zones.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"maintenance"},{"id":"MNT 02","riskIdentified":"Interruption or depletion of medical gas supply.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"maintenance"},{"id":"MNT 03","riskIdentified":"Main electrical power supply failure.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Risk Transfer","actionStatus":"closed","department":"maintenance"},{"id":"MNT 04","riskIdentified":"Interruption or failure of the main water supply network","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Risk Transfer","actionStatus":"closed","department":"maintenance"},{"id":"HK01","riskIdentified":"Slip and fall hazards due to wet surfaces","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK02","riskIdentified":"Risk of infection transmission via contaminated surfaces or equipment","riskCategory":"Hazard / Environmental","likelihood":4,"impact":3,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK03","riskIdentified":"Ergonomic injuries from handling heavy cleaning equipment","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK04","riskIdentified":"Spills of liquids or beverages on corridors and floors","riskCategory":"Hazard / Environmental","likelihood":5,"impact":4,"riskScore":20,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK05","riskIdentified":"Neglecting the cleaning of electrical and mechanical rooms","riskCategory":"Operational","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK06","riskIdentified":"Accidental exposure to hazardous medical waste","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK07","riskIdentified":"Risk of cross-contamination via contaminated cleaning tools","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK08","riskIdentified":"Chemical burns from hazardous cleaning agents","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK09","riskIdentified":"Electrical hazards during the operation of cleaning equipment","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK10","riskIdentified":"Inhalation of hazardous chemical fumes and toxic vapors","riskCategory":"Hazard / Environmental","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK11","riskIdentified":"Airborne dust and particulate accumulation in the workplace","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK12","riskIdentified":"Spread of biological contaminants in the facility environment","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK13","riskIdentified":"Improper disposal and accumulation of regular waste","riskCategory":"Hazard / Environmental","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK14","riskIdentified":"Risk of staff non-compliance with trained cleaning policies","riskCategory":"Human Capital","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK15","riskIdentified":"Use of expired cleaning and disinfection materials","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"open","department":"housekeeping"},{"id":"HK16","riskIdentified":"Contamination risks from shared cleaning equipment between departments","riskCategory":"Operational","likelihood":2,"impact":3,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK17","riskIdentified":"Fall hazards when cleaning elevated areas","riskCategory":"Hazard / Environmental","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"Low","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK18","riskIdentified":"Accidental exposure to sharp medical needles and contaminated waste","riskCategory":"Operational","likelihood":4,"impact":4,"riskScore":16,"riskLevel":"Critical","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"HK19","riskIdentified":"Risk of hazardous cleaning detergent chemical spills or leaks","riskCategory":"Hazard / Environmental","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND01","riskIdentified":"ccidental exposure to hazardous chemical products","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND 02","riskIdentified":"Ergonomic and physical injuries from manual lifting","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND03","riskIdentified":"Risk of infection transmission among laundry staff","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND04","riskIdentified":"Exposure to high heat and steam from laundry machinery","riskCategory":"Hazard / Environmental","likelihood":2,"impact":2,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Reduction","actionStatus":"closed","department":"housekeeping"},{"id":"LUND05","riskIdentified":"Mishandling of contaminated bio-hazardous fabrics","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND06","riskIdentified":"Staff exposure to biological infections","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND07","riskIdentified":"Incomplete or improper drying of laundered clothes","riskCategory":"Operational","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND08","riskIdentified":"Cross-washing of contaminated and clean linens","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND 09","riskIdentified":"Chemical leakages or spills from laundry machinery","riskCategory":"Operational","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND10","riskIdentified":"Improper handling of hot water in washing machinery","riskCategory":"Operational","likelihood":3,"impact":3,"riskScore":9,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND11","riskIdentified":"Accumulation of dust and pathogens on curtains","riskCategory":"Hazard / Environmental","likelihood":3,"impact":4,"riskScore":12,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND12","riskIdentified":"Use of extreme temperatures or harsh cleaning chemicals.","riskCategory":"Operational","likelihood":3,"impact":2,"riskScore":6,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND13","riskIdentified":"Foul odors due to insufficient washing or prolonged dampness","riskCategory":"Hazard / Environmental","likelihood":2,"impact":4,"riskScore":8,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND14","riskIdentified":"Inhalation of toxic chemical gases or foul vapors from laundry","riskCategory":"Hazard / Environmental","likelihood":1,"impact":4,"riskScore":4,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"housekeeping"},{"id":"LUND15","riskIdentified":"High noise levels and severe vibrations from heavy machinery","riskCategory":"Operational","likelihood":1,"impact":2,"riskScore":2,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"open","department":"housekeeping"},{"id":"PM 01","riskIdentified":"Project completion delays","riskCategory":"Operational","likelihood":4,"impact":2,"riskScore":8,"riskLevel":"High","controlType":"Loss Reduction","actionStatus":"closed","department":"projects"},{"id":"PM 02","riskIdentified":"Contractor working without obtaining required permits","riskCategory":"Operational","likelihood":5,"impact":1,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 03","riskIdentified":"Project scope changes by the end-user","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 04","riskIdentified":"Substitution of approved project materials","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 05","riskIdentified":"Unauthorized onboarding or entry of contractors without project department knowledge.","riskCategory":"Operational","likelihood":2,"impact":5,"riskScore":10,"riskLevel":"High","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"},{"id":"PM 06","riskIdentified":"Use of unauthorized or restricted materials by the contractor.","riskCategory":"Operational","likelihood":1,"impact":5,"riskScore":5,"riskLevel":"Medium","controlType":"Loss Prevention","actionStatus":"closed","department":"projects"}];


  function defaultState(){
    return{
      version:STATE_VERSION,
      policies:[],plans:[],forms:[],manuals:[],
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
      /* SAF 25 and SAF 26 are confirmed closed. Force the saved preview state to match. */
      if(k==='SAF25'||k==='SAF26')r.actionStatus='closed';
      merged.push(r);delete existing[k];
    });
    Object.keys(existing).forEach(function(k){
      var r=copyRecord(existing[k]);
      r.department=departmentFromRiskCode(r.id)||r.department||'allFms';
      r.actionStatus=normalizeStatus(r.actionStatus||r.status||'open');
      if(k==='SAF25'||k==='SAF26')r.actionStatus='closed';
      merged.push(r);
    });
    s.risks=merged;
    return s;
  }
  function migrateState(raw){
    var s=defaultState();
    if(!raw||typeof raw!=='object')return applyRiskRegisterSeed(s);
    ['policies','plans','forms','manuals','risks','incidents','codes','compliance','audits','actions','documents'].forEach(function(k){if(Array.isArray(raw[k]))s[k]=raw[k].map(copyRecord);});

    /* Migrate the first GRC preview document catalog into the new registers. */
    if(Array.isArray(raw.documents)){
      raw.documents.forEach(function(d){
        var x=copyRecord(d),cat=String(x.category||'').toLowerCase();
        x.department=x.department||departmentFromOwner(x.owner)||'division';
        x.expiryDate=x.expiryDate||x.reviewDate||'';
        x.status=normalizeStatus(x.status||'planned');
        if(cat==='policy'&&!hasId(s.policies,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.policies.push(x);}
        else if(cat==='plan'&&!hasId(s.plans,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.plans.push(x);}
        else if(cat==='form'&&!hasId(s.forms,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.forms.push(x);}
        else if(cat==='manual'&&!hasId(s.manuals,x.id)){x.name=x.title||x.titleEn||x.titleAr||'';s.manuals.push(x);}
      });
    }
    delete s.emergencyPlans;
    s.risks=s.risks.map(function(r){
      r.department=r.department||'allFms';
      r.riskIdentified=r.riskIdentified||r.title||r.titleEn||r.titleAr||'';
      r.riskCategory=r.riskCategory||r.category||'operational';
      r.controlType=r.controlType||'noControl';
      r.actionStatus=normalizeStatus(r.actionStatus||r.status||'open');
      return r;
    });
    ['policies','plans','forms','manuals','incidents','codes','compliance','audits','actions','documents'].forEach(function(k){
      s[k]=s[k].map(function(r){
        r.status=normalizeStatus(r.status);
        if(r.department==='governanceDept')r.department='division';
        return r;
      });
    });
    s.risks=s.risks.map(function(r){if(r.department==='governanceDept')r.department='division';return r;});
    s.version=STATE_VERSION;s.updatedAt=raw.updatedAt||new Date().toISOString();
    return applyRiskRegisterSeed(s);
  }
  function hasId(arr,id){return arr.some(function(r){return String(r.id)===String(id);});}
  function departmentFromOwner(owner){
    var x=String(owner||'').toLowerCase();
    if(x.indexOf('maintenance')>=0)return'maintenance';if(x.indexOf('safety')>=0)return'safety';if(x.indexOf('house')>=0)return'housekeeping';if(x.indexOf('project')>=0)return'projects';if(x.indexOf('governance')>=0)return'division';return'';
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
  function riskSubgroup(r){return normalizeRiskId(r&&r.id).indexOf('LUND')===0?'laundryRisk':'housekeepingRisk';}
  function filterDept(arr,dept){
    if(!dept||dept==='allFms')return(arr||[]).slice();
    if(dept==='housekeepingRisk'||dept==='laundryRisk')return(arr||[]).filter(function(r){return String(r.department||r.responsibleDept||'')==='housekeeping'&&riskSubgroup(r)===dept;});
    return(arr||[]).filter(function(r){return String(r.department||r.responsibleDept||'')===String(dept);});
  }
  function countFor(key){
    if(key==='governance')return state.policies.length+state.plans.length+state.forms.length;
    if(key==='risk')return state.risks.length+state.incidents.length+state.codes.length;
    if(key==='register')return countFor('governance')+countFor('risk')+state.manuals.length+state.compliance.length+state.audits.length+state.actions.length+state.documents.length;
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
  function riskActionBadge(status){
    var s=normalizeStatus(status);
    if(s==='open')return'<span class="grc-badge bad">'+esc(L(s))+'</span>';
    return badge(s);
  }
  function emptyRow(cols){return'<tr><td colspan="'+cols+'"><div class="grc-empty"><div class="grc-empty-icon">＋</div><div class="grc-empty-title">'+L('noRecords')+'</div><div class="grc-empty-sub">'+L('noRecordsSub')+'</div></div></td></tr>';}
  function delBtn(collection,id){return'<button class="grc-icon-btn danger" title="'+L('delete')+'" onclick="window._grcDelete(\''+collection+'\',\''+esc(id)+'\')">×</button>';}

  function ensureGrcFeatureStyles(){
    if(document.getElementById('_grcFeatureStylesV16'))return;
    var st=document.createElement('style');st.id='_grcFeatureStylesV16';st.textContent=`
      .grc-metric-grid.cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}.grc-report-category-grid,.grc-report-type-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:18px 0 24px}
      .grc-report-card{position:relative;overflow:hidden;border:1px solid rgba(19,82,105,.12);border-radius:22px;background:linear-gradient(145deg,#fff 0%,#f7fbfc 100%);padding:24px;display:flex;align-items:center;gap:18px;cursor:pointer;box-shadow:0 10px 30px rgba(19,56,74,.07);transition:.22s ease;text-align:inherit;color:#17384a}
      .grc-report-card:before{content:'';position:absolute;inset:0 auto 0 0;width:5px;background:linear-gradient(180deg,#1596a5,#4eb7bf)}
      [dir=rtl] .grc-report-card:before{left:auto;right:0}.grc-report-card:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(19,56,74,.12);border-color:rgba(21,150,165,.28)}
      .grc-report-card-icon{width:58px;height:58px;border-radius:18px;background:linear-gradient(145deg,#e7f6f7,#d9eef1);display:grid;place-items:center;font-size:25px;color:#147f8d;flex:0 0 auto}
      .grc-report-card h3{margin:0 0 7px;font-size:18px;color:#17384a}.grc-report-card p{margin:0;color:#6b8390;font-size:12px;line-height:1.7}.grc-report-card .grc-report-arrow{margin-inline-start:auto;width:36px;height:36px;border-radius:12px;background:#173f55;color:#fff;display:grid;place-items:center;font-weight:900}
      .grc-report-path{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 18px}.grc-report-path button{border:0;background:#edf6f7;color:#176f7d;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer}.grc-report-path span{color:#9aabb3}
      .grc-report-year-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:14px;margin:18px 0 24px}.grc-report-year-card,.grc-quarter-card{border:1px solid rgba(19,82,105,.12);border-radius:18px;background:#fff;padding:19px;cursor:pointer;text-align:center;box-shadow:0 8px 24px rgba(19,56,74,.055);transition:.2s ease;color:#17384a}.grc-report-year-card:hover,.grc-quarter-card:not(.disabled):hover{transform:translateY(-2px);border-color:#62b8c0;box-shadow:0 14px 30px rgba(19,56,74,.1)}
      .grc-report-year-card strong{display:block;font-size:24px}.grc-report-year-card small,.grc-quarter-card small{display:block;margin-top:7px;color:#78909a}.grc-report-availability{display:inline-flex;margin-top:10px;padding:5px 9px;border-radius:999px;background:#e6f6ef;color:#237a5d;font-size:9px;font-weight:900}.grc-report-availability.off{background:#f2f4f6;color:#87949b}
      .grc-quarter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:18px 0 24px}.grc-quarter-card{font-weight:900}.grc-quarter-card.disabled{opacity:.48;cursor:not-allowed;background:#f6f8f9}.grc-quarter-card .q-index{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;margin:0 auto 10px;background:#e6f5f6;color:#117f8d;font-size:15px}
      .grc-report-viewer-card{border:1px solid rgba(19,82,105,.13);border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 16px 45px rgba(19,56,74,.09);margin-top:18px}.grc-report-viewer-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;border-bottom:1px solid #e8eef1;background:linear-gradient(90deg,#f8fbfc,#eef7f8)}.grc-report-viewer-title{font-size:15px;font-weight:900;color:#17384a}.grc-report-viewer-meta{font-size:10px;color:#718894;margin-top:4px}.grc-report-viewer-head button{border:0;border-radius:12px;background:#173f55;color:#fff;padding:10px 14px;font-size:10px;font-weight:900;cursor:pointer}.grc-report-frame{width:100%;height:min(74vh,860px);border:0;background:#eef2f4;display:block}
      .grc-report-empty{padding:50px 24px;text-align:center;border:1px dashed #c9d9de;border-radius:18px;background:#fbfdfd;color:#748b96}.grc-report-empty b{display:block;color:#294b5b;font-size:16px;margin-bottom:8px}
      .grc-incident-year-lines{display:grid;gap:13px;margin-top:16px}.grc-year-line-row{border:1px solid #e7eef1;border-radius:16px;background:linear-gradient(180deg,#fff,#fafcfd);padding:13px 14px}.grc-year-line-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.grc-year-line-head strong{font-size:13px;color:#24485a}.grc-year-line-head span{font-size:10px;color:#78909a}.grc-year-line-svg{width:100%;height:104px;display:block}.grc-year-line-grid{stroke:#e8eef1;stroke-width:1}.grc-year-line-label{font-size:8px;fill:#80939c}.grc-year-line-value{font-size:9px;font-weight:800;fill:#315568}
      @media(max-width:900px){.grc-report-category-grid,.grc-report-type-grid{grid-template-columns:1fr}.grc-quarter-grid{grid-template-columns:repeat(2,1fr)}.grc-report-viewer-head{align-items:flex-start;flex-direction:column}.grc-report-frame{height:68vh}}
    `;document.head.appendChild(st);
  }
  function ensureApp(){
    ensureGrcFeatureStyles();loadReportManifest();
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
      '<footer class="grc-footer"><div class="grc-footer-left"><button class="footer-back-glass grc-footer-back" onclick="window._exitGRC()" type="button" title="Back to Portal Selection"><span>'+(isAr()?'رجوع':'← Back')+'</span></button><span><strong>QUMC GRC Workspace</strong> · '+L('draftWorkspace')+' · '+L('localNote')+'</span></div><span class="grc-live"><i></i> Super Admin Preview · © 2026 QUMC</span></footer>';
  }
  function render(){if(!app||!app.classList.contains('grc-visible'))return;app.setAttribute('dir',isAr()?'rtl':'ltr');app.innerHTML=shellHtml();}

  function hero(eye,title,desc,actions){return'<div class="grc-hero"><div class="grc-hero-row"><div><div class="grc-eyebrow">'+eye+'</div><h1>'+title+'</h1><p>'+desc+'</p></div><div class="grc-hero-actions">'+(actions||'')+'</div></div></div>';}
  function sectionHead(title,sub,badgeText){return'<div class="grc-section-head"><div><div class="grc-section-title">'+title+'</div><div class="grc-section-sub">'+(sub||'')+'</div></div>'+(badgeText?'<span class="grc-section-badge">'+badgeText+'</span>':'')+'</div>';}
  function metricCard(label,value,cls,sub,onclick){
    var tone=cls||'info',icons={info:'▦',good:'✓',warn:'△',bad:'!',purple:'◇',neutral:'•'};
    return'<div class="grc-metric-card '+tone+' '+(onclick?'clickable':'')+' '+(isAr()?'rtl':'')+'" '+(onclick?'onclick="'+onclick+'" tabindex="0" role="button"':'')+'>'+
      '<div class="grc-metric-top"><span class="grc-metric-icon">'+(icons[tone]||'▦')+'</span></div>'+
      '<div class="grc-metric-value">'+value+'</div><div class="grc-metric-label">'+label+'</div>'+
      '<div class="grc-metric-foot"><span class="grc-metric-sub">'+(sub||'')+'</span>'+(onclick?'<span class="grc-metric-arrow">›</span>':'')+'</div></div>';
  }
  function registerBlock(kind,title,note,button,table){return'<div class="grc-register-block"><div class="grc-register-titlebar '+kind+'"><div><div class="grc-register-name">'+title+'</div><div class="grc-register-note">'+note+'</div></div>'+button+'</div>'+table+'</div>';}
  function addBtn(type,label,dept){return'<button class="grc-primary-btn" onclick="window._grcOpenForm(\''+type+'\',\''+esc(dept||'')+'\')">＋ '+label+'</button>';}
  function deptColor(dept){return(departmentMeta[dept]&&departmentMeta[dept].color)||'#00A3C4';}
  function deptInk(dept){return(departmentMeta[dept]&&departmentMeta[dept].ink)||deptColor(dept);}
  function deptSoft(dept){return(departmentMeta[dept]&&departmentMeta[dept].soft)||'rgba(0,163,196,.12)';}
  function deptAbbr(dept){return(departmentMeta[dept]&&departmentMeta[dept].abbr)||'FMS';}
  function chartHeader(title,total,caption){
    return'<div class="grc-chart-head"><div><div class="grc-chart-title"><span class="grc-chart-mark"></span>'+title+'</div>'+(caption?'<div class="grc-chart-caption">'+esc(caption)+'</div>':'')+'</div>'+(total!==undefined&&total!==null?'<span class="grc-chart-total">'+Number(total||0)+'</span>':'')+'</div>';
  }
  function chartLegend(items,total){
    total=Number(total||items.reduce(function(a,x){return a+Number(x.value||0);},0));
    return'<div class="grc-chart-legend">'+items.map(function(x){var v=Number(x.value||0),share=total?Math.round(v/total*100):0;return'<span><i style="background:'+x.color+'"></i><span class="grc-legend-label">'+esc(x.label)+'</span><small>'+share+'%</small><b>'+v+'</b></span>';}).join('')+'</div>';
  }
  function donutChart(title,items,centerLabel){
    var total=items.reduce(function(a,x){return a+Number(x.value||0);},0),size=144,r=51,circ=2*Math.PI*r,cursor=0,id='grcDonut'+(++chartSeq);
    var rings='';
    if(total){
      items.forEach(function(x){var raw=Number(x.value||0)/total*circ,gap=Math.min(4,raw*.25),len=Math.max(0,raw-gap);rings+='<circle cx="72" cy="72" r="'+r+'" fill="none" stroke="'+x.color+'" stroke-width="15" stroke-linecap="round" stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="'+(-cursor)+'" transform="rotate(-90 72 72)"></circle>';cursor+=raw;});
    }
    return'<div class="grc-chart-card grc-donut-card">'+chartHeader(title,total,centerLabel||L('records'))+'<div class="grc-donut-layout"><div class="grc-donut-svg-wrap"><svg class="grc-donut-svg" viewBox="0 0 '+size+' '+size+'" role="img" aria-labelledby="'+id+'"><title id="'+id+'">'+esc(title)+'</title><circle cx="72" cy="72" r="'+r+'" fill="none" stroke="#EDF2F6" stroke-width="15"></circle>'+rings+'</svg><div class="grc-donut-center"><strong>'+total+'</strong><span>'+esc(centerLabel||L('records'))+'</span></div></div>'+chartLegend(items,total)+'</div></div>';
  }
  function barChart(title,items){
    var max=Math.max.apply(null,[1].concat(items.map(function(x){return Number(x.value||0);}))),total=items.reduce(function(a,x){return a+Number(x.value||0);},0);
    return'<div class="grc-chart-card grc-horizontal-card">'+chartHeader(title,total,L('records'))+'<div class="grc-bar-list">'+items.map(function(x,i){var v=Number(x.value||0),w=Math.round(v/max*100);return'<div class="grc-bar-row"><div class="grc-bar-head"><span><em>'+(i+1)+'</em>'+esc(x.label)+'</span><b>'+v+'</b></div><div class="grc-bar-track"><span style="width:'+w+'%;--bar-color:'+x.color+'"></span></div></div>';}).join('')+'</div></div>';
  }
  function verticalBarChart(title,items){
    var max=Math.max.apply(null,[1].concat(items.map(function(x){return Number(x.value||0);}))),total=items.reduce(function(a,x){return a+Number(x.value||0);},0);
    return'<div class="grc-chart-card grc-vertical-card">'+chartHeader(title,total,L('records'))+'<div class="grc-vertical-bars">'+items.map(function(x){var v=Number(x.value||0),h=v?Math.max(9,Math.round(v/max*100)):0;return'<div class="grc-vbar-item"><div class="grc-vbar-value">'+v+'</div><div class="grc-vbar-column"><span style="height:'+h+'%;--bar-color:'+x.color+'"></span></div><div class="grc-vbar-label">'+esc(x.label)+'</div></div>';}).join('')+'</div></div>';
  }
  function stackedBarChart(title,rows,legend){
    var grand=rows.reduce(function(a,row){return a+(row.segments||[]).reduce(function(t,s){return t+Number(s.value||0);},0);},0);
    var legendItems=(legend||[]).map(function(item){var value=0;rows.forEach(function(row){(row.segments||[]).forEach(function(seg){if(seg.label===item.label||seg.color===item.color)value+=Number(seg.value||0);});});return{label:item.label,color:item.color,value:value};});
    return'<div class="grc-chart-card grc-stacked-card">'+chartHeader(title,grand,L('records'))+'<div class="grc-stacked-list">'+rows.map(function(row){var total=(row.segments||[]).reduce(function(a,s){return a+Number(s.value||0);},0);return'<div class="grc-stacked-row"><div class="grc-stacked-head"><span>'+esc(row.label)+'</span><b>'+total+'</b></div><div class="grc-stacked-track">'+(row.segments||[]).map(function(s){var w=total?Number(s.value||0)/total*100:0;return'<span title="'+esc(s.label)+': '+Number(s.value||0)+'" style="width:'+w+'%;--segment-color:'+s.color+'"></span>';}).join('')+'</div></div>';}).join('')+'</div>'+chartLegend(legendItems,grand)+'</div>';
  }
  function lineAreaChart(title,items,color){
    color=color||chartPalette.teal;
    var width=700,height=230,left=45,right=22,top=28,bottom=43,max=Math.max.apply(null,[1].concat(items.map(function(x){return Number(x.value||0);}))),usableW=width-left-right,usableH=height-top-bottom,id='grcLineFill'+(++chartSeq);
    var points=items.map(function(x,i){var px=items.length===1?left+usableW/2:left+(usableW*i/(items.length-1)),py=top+usableH-(Number(x.value||0)/max*usableH);return{x:px,y:py,label:x.label,value:Number(x.value||0)};});
    var poly=points.map(function(p){return p.x+','+p.y;}).join(' '),area=points.length?'M '+points[0].x+' '+(height-bottom)+' L '+points.map(function(p){return p.x+' '+p.y;}).join(' L ')+' L '+points[points.length-1].x+' '+(height-bottom)+' Z':'',grid='';
    [0,.25,.5,.75,1].forEach(function(fr){var y=top+usableH*fr;grid+='<line x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'" class="grc-line-grid"/>';});
    return'<div class="grc-chart-card grc-line-card">'+chartHeader(title,items.reduce(function(a,x){return a+Number(x.value||0);},0),L('incidentsByYear'))+'<div class="grc-line-wrap"><svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" role="img" aria-label="'+esc(title)+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".24"/><stop offset="100%" stop-color="'+color+'" stop-opacity=".015"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#'+id+')"/><polyline points="'+poly+'" fill="none" stroke="'+color+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+points.map(function(p){return'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#fff" stroke="'+color+'" stroke-width="3"/><text x="'+p.x+'" y="'+(p.y-13)+'" text-anchor="middle" class="grc-line-value">'+p.value+'</text><text x="'+p.x+'" y="'+(height-13)+'" text-anchor="middle" class="grc-line-label">'+esc(p.label)+'</text>';}).join('')+'</svg></div></div>';
  }
  function governanceBuckets(arr){
    var expired=arr.filter(isExpired),due=arr.filter(function(r){return !isExpired(r)&&expiringThisYear(r);}),active=arr.filter(function(r){return ['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r)&&!expiringThisYear(r);});
    var used=expired.length+due.length+active.length,other=Math.max(0,arr.length-used);
    return{active:active.length,due:due.length,expired:expired.length,other:other};
  }
  function riskHeatMap(dept){
    var risks=filterDept(state.risks,dept),impacts=[5,4,3,2,1],likelihoods=[5,4,3,2,1],impactLabels={5:'veryHighImpact',4:'highImpact',3:'mediumImpact',2:'lowImpact',1:'veryLowImpact'},likeLabels={5:'almostCertain',4:'likely',3:'possible',2:'unlikely',1:'rare'};
    function heatLevel(score){if(score>=15)return{cls:'very-high',label:L('veryHighRisk')};if(score>=8)return{cls:'high',label:L('highRiskLabel')};if(score>=4)return{cls:'medium',label:L('mediumRiskLabel')};return{cls:'low',label:L('lowRiskLabel')};}
    var headers=impacts.map(function(i){return'<div class="grc-heat-impact-head">'+L(impactLabels[i])+'</div>';}).join('')+'<div class="grc-heat-side-head">'+L('riskLikelihoodAxis')+'</div>';
    var rows=likelihoods.map(function(l){var cells=impacts.map(function(i){var score=l*i,level=heatLevel(score),count=risks.filter(function(r){return Number(r.likelihood)===l&&Number(r.impact)===i;}).length;return'<button type="button" class="grc-heat-cell '+level.cls+'" onclick="window._grcOpenHeatCell(\''+dept+'\','+l+','+i+')"><strong>'+score+'</strong><span>'+level.label+'</span>'+(count?'<em>'+count+' '+L('risksInCell')+'</em>':'')+'</button>';}).join('');return cells+'<div class="grc-heat-like-label">'+L(likeLabels[l])+'</div>';}).join('');
    return'<div class="grc-chart-card grc-heatmap-card"><div class="grc-chart-title">'+L('riskHeatMap')+'</div><div class="grc-heat-impact-title">'+L('riskImpactAxis')+'</div><div class="grc-heat-grid" dir="ltr">'+headers+rows+'</div></div>';
  }
  function departmentPanel(dept,scope,total,second,alert,secondLabel,body){
    var color=deptColor(dept),ink=deptInk(dept),soft=deptSoft(dept);
    return'<section class="grc-department-panel" style="--dept-color:'+color+';--dept-ink:'+ink+';--dept-soft:'+soft+'"><div class="grc-department-accent"></div><div class="grc-department-header"><div class="grc-department-identity"><div class="grc-department-abbr">'+esc(deptAbbr(dept))+'</div><div><div class="grc-department-name">'+esc(deptName(dept))+'</div><div class="grc-department-caption">'+esc(scope)+'</div></div></div><div class="grc-department-summary"><div class="grc-mini-stat"><b>'+Number(total||0)+'</b><span>'+L('total')+'</span></div><div class="grc-mini-stat good"><b>'+Number(second||0)+'</b><span>'+esc(secondLabel||L('active'))+'</span></div><div class="grc-mini-stat warn"><b>'+Number(alert||0)+'</b><span>'+L('attention')+'</span></div></div></div><div class="grc-department-body">'+body+'</div></section>';
  }
  function governanceMetricCards(kind,dept){
    var arr=filterDept(state[kind],dept),expired=arr.filter(isExpired),due=arr.filter(expiringThisYear),active=arr.filter(function(r){return['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r);});
    var c=[];
    if(kind==='policies')c=[['totalPolicies',arr.length,'info','total'],['openPolicies',active.length,'good','active'],['expiredPolicies',expired.length,'bad','expired'],['expiringThisYear',due.length,'warn','expiring'],['expiredPolicyRate',pct(expired.length,arr.length),'purple','expired']];
    if(kind==='plans')c=[['totalPlans',arr.length,'info','total'],['activePlans',active.length,'good','active'],['expiredPlans',expired.length,'bad','expired'],['expiringThisYear',due.length,'warn','expiring'],['expiredPlanRate',pct(expired.length,arr.length),'purple','expired']];
    if(kind==='forms')c=[['totalForms',arr.length,'info','total'],['activeForms',active.length,'good','active'],['expiredForms',expired.length,'bad','expired']];
    var gridClass=c.length===4?'cols-4':c.length===3?'cols-3':'';
    return'<div class="grc-metric-grid '+gridClass+'">'+c.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\''+kind+'\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function governanceCategoryChart(kind,dept){
    var arr=filterDept(state[kind],dept),b=governanceBuckets(arr);
    var items=[
      {label:L('active'),value:b.active,color:chartPalette.green},
      {label:L('dueThisYear'),value:b.due,color:chartPalette.amber},
      {label:L('expired'),value:b.expired,color:chartPalette.coral},
      {label:L('other'),value:b.other,color:chartPalette.slate}
    ];
    var titleMap={policies:'policies',plans:'plans',forms:'forms'};
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics">'+donutChart(L(titleMap[kind])+' · '+L('governanceStatusChart'),items,L('records'))+'</div>';
  }
  function governanceOverview(dept,withRegisters,withCharts){
    var sections=[['policies','policies','policyRegister','addPolicy','policy'],['plans','plans','planRegister','addPlan','plan'],['forms','forms','formRegister','addForm','form']];
    return sections.map(function(s){
      var html='<div class="grc-section grc-domain-section">'+sectionHead(L(s[1]),deptName(dept),withRegisters?'':'')+governanceMetricCards(s[0],dept);
      if(withCharts!==false)html+=governanceCategoryChart(s[0],dept);
      if(withRegisters)html+=registerBlock(s[4],L(s[2]),deptName(dept),addBtn(s[4],L(s[3]),dept),governanceTable(s[0],dept,s[4],false));
      return html+'</div>';
    }).join('');
  }

  function riskMetricCards(dept){
    var arr=filterDept(state.risks,dept),closed=arr.filter(isClosed),open=arr.filter(isOpen);
    var levels={critical:[],high:[],medium:[],low:[]};arr.forEach(function(r){levels[riskLevel(r)].push(r);});
    var summary=[
      ['totalRisks',arr.length,'info','total'],
      ['openRisks',open.length,'bad','open'],
      ['closedRisks',closed.length,'good','closed'],
      ['closedRiskRate',pct(closed.length,arr.length),'purple','closed'],
      ['highCriticalRate',pct(levels.high.length+levels.critical.length,arr.length),'bad','highCritical']
    ];
    var levelsRow=[
      ['criticalRisks',levels.critical.length,'bad','critical'],
      ['highRisks',levels.high.length,'warn','high'],
      ['mediumRisks',levels.medium.length,'info','medium'],
      ['lowRisks',levels.low.length,'good','low']
    ];
    function cards(defs,cls){return'<div class="grc-metric-grid '+(cls||'')+'">'+defs.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\'risks\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';}
    return cards(summary,'grc-risk-summary-grid')+cards(levelsRow,'cols-4 grc-risk-level-grid');
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
      ['failedCodeRate',pct(failed.length,success.length+failed.length),'warn','failedRate']
    ];
    return'<div class="grc-metric-grid cols-6">'+defs.map(function(x){return metricCard(L(x[0]),x[1],x[2],L('clickToView'),'window._grcOpenMetric(\'codes\',\''+x[3]+'\',\''+dept+'\')');}).join('')+'</div>';
  }
  function riskDistributionBars(dept){
    var risks=filterDept(state.risks,dept),levels={critical:0,high:0,medium:0,low:0};risks.forEach(function(r){levels[riskLevel(r)]++;});
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics">'+donutChart(L('riskDistributionChart'),[
      {label:L('critical'),value:levels.critical,color:chartPalette.rose},
      {label:L('high'),value:levels.high,color:chartPalette.orange},
      {label:L('medium'),value:levels.medium,color:chartPalette.amber},
      {label:L('low'),value:levels.low,color:chartPalette.green}
    ],L('totalRisks'))+'</div>';
  }
  function riskExposureByDepartmentChart(){
    var items=departmentOrder.map(function(dept){
      var value=filterDept(state.risks,dept).filter(function(r){return['critical','high'].indexOf(riskLevel(r))>=0;}).length;
      return{label:deptName(dept),value:value,color:deptColor(dept)};
    });
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics">'+barChart(L('riskExposureChart'),items)+'</div>';
  }
  function riskCategoryChart(dept){
    var map={};filterDept(state.risks,dept).forEach(function(r){var k=String(r.riskCategory||L('other')).trim()||L('other');map[k]=(map[k]||0)+1;});
    var palette=[chartPalette.navy,chartPalette.teal,chartPalette.blue,chartPalette.amber,chartPalette.coral,chartPalette.green,chartPalette.violet];
    var items=Object.keys(map).sort(function(a,b){return map[b]-map[a];}).slice(0,7).map(function(k,i){return{label:k,value:map[k],color:palette[i%palette.length]};});
    if(!items.length)items=[{label:L('noRecords'),value:0,color:chartPalette.slate}];
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics">'+barChart(L('riskCategoryChart'),items)+'</div>';
  }
  function incidentTrendChartHtml(dept){
    var incidents=filterDept(state.incidents,dept),years={};
    incidents.forEach(function(r){var d=parseDate(r.date),yr=d?d.getFullYear():null;if(yr){if(years[yr]===undefined)years[yr]=0;years[yr]++;}});
    var keys=Object.keys(years).sort(function(a,b){return Number(a)-Number(b);});
    if(!keys.length){var current=String(new Date().getFullYear());years[current]=0;keys=[current];}
    var items=keys.map(function(y){return{label:y,value:years[y]};});
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics">'+lineAreaChart(L('incidentTrendChart'),items,chartPalette.teal)+'</div>';
  }
  function incidentMonthlyTrendChartHtml(dept){
    var incidents=filterDept(state.incidents,dept),years={},monthLabels=isAr()?['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    incidents.forEach(function(r){var d=parseDate(r.date);if(!d)return;var y=String(d.getFullYear());if(!years[y])years[y]=new Array(12).fill(0);years[y][d.getMonth()]++;});
    var keys=Object.keys(years).sort(function(a,b){return Number(a)-Number(b);});
    if(!keys.length){var current=String(new Date().getFullYear());years[current]=new Array(12).fill(0);keys=[current];}
    var globalMax=1;keys.forEach(function(y){years[y].forEach(function(v){globalMax=Math.max(globalMax,Number(v||0));});});
    var palette=[chartPalette.teal,chartPalette.blue,chartPalette.violet,chartPalette.orange,chartPalette.green];
    var width=720,height=104,left=28,right=12,top=12,bottom=24,usableW=width-left-right,usableH=height-top-bottom;
    var rows=keys.map(function(y,yi){
      var vals=years[y],color=palette[yi%palette.length],pts=vals.map(function(v,i){return{x:left+(usableW*i/11),y:top+usableH-(Number(v||0)/globalMax*usableH),v:Number(v||0)};}),poly=pts.map(function(p){return p.x+','+p.y;}).join(' '),grid='';
      [0,.5,1].forEach(function(fr){var gy=top+usableH*fr;grid+='<line x1="'+left+'" y1="'+gy+'" x2="'+(width-right)+'" y2="'+gy+'" class="grc-year-line-grid"/>';});
      return'<div class="grc-year-line-row"><div class="grc-year-line-head"><strong>'+y+'</strong><span>'+vals.reduce(function(a,v){return a+Number(v||0);},0)+' '+L('incidents')+'</span></div><svg class="grc-year-line-svg" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none">'+grid+'<polyline points="'+poly+'" fill="none" stroke="'+color+'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map(function(p,i){return'<circle cx="'+p.x+'" cy="'+p.y+'" r="3.7" fill="#fff" stroke="'+color+'" stroke-width="2.4"/><text x="'+p.x+'" y="'+(height-7)+'" text-anchor="middle" class="grc-year-line-label">'+monthLabels[i]+'</text>'+(p.v?'<text x="'+p.x+'" y="'+(p.y-7)+'" text-anchor="middle" class="grc-year-line-value">'+p.v+'</text>':'');}).join('')+'</svg></div>';
    }).join('');
    return'<div class="grc-chart-grid cols-1 grc-chart-after-metrics"><div class="grc-chart-card"><div class="grc-chart-head"><div><div class="grc-chart-title"><span class="grc-chart-mark"></span>'+L('monthlyIncidentTrend')+'</div><div class="grc-chart-caption">'+L('incidentsByYear')+'</div></div><span class="grc-chart-total">'+incidents.length+'</span></div><div class="grc-incident-year-lines">'+rows+'</div></div></div>';
  }
  function codeCharts(dept){
    var codes=filterDept(state.codes,dept),real=codes.filter(function(r){return normalizeStatus(r.type)==='real';}).length,drill=codes.filter(function(r){return normalizeStatus(r.type)==='drill';}).length,success=codes.filter(function(r){return normalizeStatus(r.status)==='successful';}).length,failed=codes.filter(function(r){return normalizeStatus(r.status)==='failed';}).length;
    return'<div class="grc-chart-grid cols-2 grc-chart-after-metrics">'+verticalBarChart(L('codeTypeChart'),[{label:L('realCodes'),value:real,color:chartPalette.navy},{label:L('drillCodes'),value:drill,color:chartPalette.blue}])+donutChart(L('codeOutcomeChart'),[{label:L('successfulCodes'),value:success,color:chartPalette.green},{label:L('failedCodes'),value:failed,color:chartPalette.coral}],L('codes'))+'</div>';
  }
  function riskSection(dept,withRegisters,withCharts){
    var html='<div class="grc-section grc-domain-section">'+sectionHead(L('riskRegister'),deptName(dept))+riskMetricCards(dept);
    if(withCharts!==false){html+=riskHeatMap(dept)+riskDistributionBars(dept)+riskCategoryChart(dept);if(dept==='allFms')html+=riskExposureByDepartmentChart();}
    if(withRegisters)html+=registerBlock('risk',L('riskRegister'),deptName(dept),addBtn('risk',L('addRisk'),dept==='housekeepingRisk'||dept==='laundryRisk'?'housekeeping':dept),riskTable(dept,false));
    return html+'</div>';
  }
  function housekeepingRiskSplit(withRegisters,withCharts){
    return'<div class="grc-housekeeping-risk-split">'+
      '<section class="grc-risk-subgroup housekeeping-subgroup">'+riskSection('housekeepingRisk',withRegisters,withCharts)+'</section>'+
      '<section class="grc-risk-subgroup laundry-subgroup">'+riskSection('laundryRisk',withRegisters,withCharts)+'</section>'+
      '</div>';
  }
  function riskOverview(dept,withRegisters,withCharts){
    var html=dept==='housekeeping'?housekeepingRiskSplit(withRegisters,withCharts):riskSection(dept,withRegisters,withCharts);
    html+='<div class="grc-section grc-domain-section">'+sectionHead(L('incidents'),deptName(dept))+incidentMetricCards(dept);
    if(withCharts!==false)html+=incidentTrendChartHtml(dept)+incidentMonthlyTrendChartHtml(dept);
    if(withRegisters)html+=registerBlock('incident',L('incidentRegister'),deptName(dept),addBtn('incident',L('addIncident'),dept),incidentTable(dept,false));
    html+='</div><div class="grc-section grc-domain-section">'+sectionHead(L('codes'),deptName(dept))+codeMetricCards(dept);
    if(withCharts!==false)html+=codeCharts(dept);
    if(withRegisters)html+=registerBlock('code',L('codeRegister'),deptName(dept),addBtn('code',L('addCode'),dept),codeTable(dept,false));
    return html+'</div>';
  }
  function governanceCharts(dept){return governanceCategoryChart('policies',dept)+governanceCategoryChart('plans',dept)+governanceCategoryChart('forms',dept);}
  function riskCharts(dept){return riskHeatMap(dept)+riskDistributionBars(dept)+riskCategoryChart(dept)+incidentTrendChartHtml(dept)+incidentMonthlyTrendChartHtml(dept)+codeCharts(dept);}
  function governanceDepartmentPanel(dept){
    var all=[];['policies','plans','forms'].forEach(function(k){all=all.concat(filterDept(state[k],dept));});
    var active=all.filter(function(r){return['active','open'].indexOf(normalizeStatus(r.status))>=0&&!isExpired(r);}).length;
    var alert=all.filter(function(r){return isExpired(r)||expiringThisYear(r);}).length;
    return departmentPanel(dept,L('governance')+' · '+L('departmentRecords'),all.length,active,alert,L('active'),governanceOverview(dept,false,true));
  }
  function riskDepartmentPanel(dept){
    var risks=filterDept(state.risks,dept),incidents=filterDept(state.incidents,dept),codes=filterDept(state.codes,dept),total=risks.length+incidents.length+codes.length;
    var active=risks.filter(isOpen).length+incidents.filter(isOpen).length;
    var alert=risks.filter(function(r){return['critical','high'].indexOf(riskLevel(r))>=0;}).length+incidents.filter(isOpen).length;
    return departmentPanel(dept,L('risk')+' · '+L('departmentRecords'),total,active,alert,L('open'),riskOverview(dept,false,true));
  }
  function executiveGovernancePortfolio(){
    var defs=[['policies','policies','policy'],['plans','plans','plan'],['forms','forms','form']];
    var cards='<div class="grc-metric-grid cols-3 grc-exec-portfolio-cards">'+defs.map(function(d){var arr=filterDept(state[d[0]],'allFms'),b=governanceBuckets(arr),sub=b.active+' '+L('active')+' · '+b.expired+' '+L('expired');return metricCard(L(d[1]),arr.length,'info',sub,'window._grcOpenMetric(\''+d[0]+'\',\'total\',\'allFms\')');}).join('')+'</div>';
    var rows=defs.map(function(d){var b=governanceBuckets(filterDept(state[d[0]],'allFms'));return{label:L(d[1]),segments:[{label:L('active'),value:b.active,color:chartPalette.green},{label:L('dueThisYear'),value:b.due,color:chartPalette.amber},{label:L('expired'),value:b.expired,color:chartPalette.coral},{label:L('other'),value:b.other,color:chartPalette.slate}]};});
    var legend=[{label:L('active'),value:0,color:chartPalette.green},{label:L('dueThisYear'),value:0,color:chartPalette.amber},{label:L('expired'),value:0,color:chartPalette.coral},{label:L('other'),value:0,color:chartPalette.slate}];
    var volume=defs.map(function(d,i){return{label:L(d[1]),value:filterDept(state[d[0]],'allFms').length,color:[chartPalette.teal,chartPalette.blue,chartPalette.navy][i]};});
    return cards+'<div class="grc-chart-grid cols-2 grc-exec-chart-grid">'+stackedBarChart(L('governanceStatusChart'),rows,legend)+verticalBarChart(L('governanceVolumeChart'),volume)+'</div>';
  }
  function executiveRiskPortfolio(){
    return'<div class="grc-exec-risk-summary">'+riskMetricCards('allFms')+'</div>'+
      '<div class="grc-exec-risk-visuals"><div class="grc-exec-risk-heat">'+riskHeatMap('allFms')+'</div><div class="grc-exec-risk-side">'+riskDistributionBars('allFms')+riskExposureByDepartmentChart()+'</div></div>'+
      '<div class="grc-exec-operations-grid"><section class="grc-exec-ops-panel"><div class="grc-exec-ops-head"><div><h3>'+L('incidents')+'</h3><p>'+L('incidentTrendChart')+'</p></div><span>'+state.incidents.length+'</span></div>'+incidentMetricCards('allFms')+incidentTrendChartHtml('allFms')+incidentMonthlyTrendChartHtml('allFms')+'</section>'+
      '<section class="grc-exec-ops-panel"><div class="grc-exec-ops-head"><div><h3>'+L('codes')+'</h3><p>'+L('codeOutcomeChart')+'</p></div><span>'+state.codes.length+'</span></div>'+codeMetricCards('allFms')+codeCharts('allFms')+'</section></div>';
  }
  function executiveSnapshotCards(){
    var gov=countFor('governance');
    var risks=state.risks||[],openRisk=risks.filter(isOpen).length;
    var incidents=state.incidents||[],openIncident=incidents.filter(isOpen).length;
    var codes=state.codes||[],success=codes.filter(function(r){return normalizeStatus(r.status)==='successful';}).length,failed=codes.filter(function(r){return normalizeStatus(r.status)==='failed';}).length;
    return'<div class="grc-exec-snapshot-grid">'+
      metricCard(L('governanceRecords'),gov,'info',L('allDepartments'),'window._grcSwitch(\'governance\')')+
      metricCard(L('openRisks'),openRisk,'warn',L('allDepartments'),'window._grcOpenMetric(\'risks\',\'open\',\'allFms\')')+
      metricCard(L('openIncidents'),openIncident,'bad',L('allDepartments'),'window._grcOpenMetric(\'incidents\',\'open\',\'allFms\')')+
      metricCard(L('failedCodeRate'),pct(failed,success+failed),'purple',L('codes'),'window._grcOpenMetric(\'codes\',\'failedRate\',\'allFms\')')+
      '</div>';
  }
  function executivePage(){
    return hero('GRC · Executive Command',L('executiveTitle'),L('executiveDesc'))+
      '<section class="grc-exec-snapshot">'+sectionHead(L('executiveSnapshot'),L('executiveSnapshotDesc'),'FMS')+executiveSnapshotCards()+'</section>'+
      '<section class="grc-exec-domain governance-domain"><div class="grc-exec-domain-head"><div><span class="grc-exec-domain-kicker">01</span><h2>'+L('governanceOverview')+'</h2><p>'+L('governanceDesc')+'</p></div><span class="grc-exec-domain-badge">'+countFor('governance')+' '+L('records')+'</span></div>'+executiveGovernancePortfolio()+'</section>'+
      '<section class="grc-exec-domain risk-domain"><div class="grc-exec-domain-head"><div><span class="grc-exec-domain-kicker">02</span><h2>'+L('riskOverview')+'</h2><p>'+L('riskDesc')+'</p></div><span class="grc-exec-domain-badge">'+countFor('risk')+' '+L('records')+'</span></div>'+executiveRiskPortfolio()+'</section>';
  }
  function governanceModules(){
    var a=[['⌂','orgStructure','orgStructureDesc','window._grcOpenOrgStructure()','ready'],['⇄','raci','raciDesc','','planned'],['▥','annualPlan','annualPlanDesc','','planned']];
    return'<div class="grc-module-grid">'+a.map(function(x){return'<div class="grc-module-card '+(x[3]?'clickable':'')+'" '+(x[3]?'onclick="'+x[3]+'" tabindex="0" role="button"':'')+'><div class="grc-module-icon">'+x[0]+'</div><div><div class="grc-module-title">'+L(x[1])+'</div><div class="grc-module-desc">'+L(x[2])+'</div><span class="grc-module-status '+(x[4]==='ready'?'ready':'')+'">'+(x[4]==='ready'?(isAr()?'عرض الهيكل':'View Structure'):L('planned'))+'</span></div></div>';}).join('')+'</div>';
  }
  function governancePage(){return hero('GRC · Governance',L('governanceTitle'),L('governanceDesc'))+governanceModules()+'<div class="grc-divider"></div>'+sectionHead(L('departmentView'),L('departmentSectionsDesc'))+'<div class="grc-department-stack">'+departmentOrder.map(governanceDepartmentPanel).join('')+'</div>';}
  function riskPage(){return hero('GRC · Risk Management',L('riskTitle'),L('riskDesc'))+sectionHead(L('departmentView'),L('departmentSectionsDesc'))+'<div class="grc-department-stack">'+departmentOrder.map(riskDepartmentPanel).join('')+'</div>';}

  function governanceRegistersBoard(){
    return'<section class="grc-registers-board">'+sectionHead(L('governanceRegisterGroup'),L('registerDesc'))+
      registerBlock('policy',L('policyRegister'),L('allDepartments'),addBtn('policy',L('addPolicy')),governanceTable('policies','allFms','policy',true))+
      registerBlock('plan',L('planRegister'),L('allDepartments'),addBtn('plan',L('addPlan')),governanceTable('plans','allFms','plan',true))+
      
      registerBlock('form',L('formRegister'),L('allDepartments'),addBtn('form',L('addForm')),governanceTable('forms','allFms','form',true))+'</section>';
  }
  function riskRegistersBoard(){
    return'<section class="grc-registers-board">'+sectionHead(L('riskRegisterGroup'),L('registerDesc'))+
      registerBlock('risk',L('riskRegister'),L('allDepartments'),addBtn('risk',L('addRisk')),riskTable('allFms',true))+
      registerBlock('incident',L('incidentRegister'),L('allDepartments'),addBtn('incident',L('addIncident')),incidentTable('allFms',true))+
      registerBlock('code',L('codeRegister'),L('allDepartments'),addBtn('code',L('addCode')),codeTable('allFms',true))+'</section>';
  }
  function registerPage(){
    return hero('GRC · Registers',L('registerTitle'),L('registerDesc'))+governanceRegistersBoard()+riskRegistersBoard()+
      '<section class="grc-registers-board">'+sectionHead(L('assuranceRegisterGroup'),L('registerDesc'))+
      registerBlock('policy',L('complianceTitle'),L('allDepartments'),addBtn('compliance',L('addRequirement')),tableHtml('policy',['id','requirement','authority','department','owner','dueDate','status'],(state.compliance||[]).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.authority||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td></tr>';}).join('')))+
      registerBlock('incident',L('auditTitle'),L('allDepartments'),addBtn('audit',L('addFinding')),tableHtml('incident',['id','title','severity','department','owner','dueDate','status'],(state.audits||[]).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+badge(r.severity)+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td>'+badge(r.status)+'</td></tr>';}).join('')))+
      registerBlock('plan',L('actionsTitle'),L('allDepartments'),addBtn('action',L('addAction')),tableHtml('plan',['id','title','source','department','owner','dueDate','progress','status'],(state.actions||[]).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.source||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.dueDate)+'</td><td><div style="display:flex;align-items:center;gap:7px"><div class="grc-progress"><span style="width:'+Math.max(0,Math.min(100,Number(r.progress||0)))+'%"></span></div><b>'+Number(r.progress||0)+'%</b></div></td><td>'+badge(r.status)+'</td></tr>';}).join('')))+
      registerBlock('form',L('documentsTitle'),L('allDepartments'),addBtn('document',L('addDocument')),tableHtml('form',['id','title','category','department','owner','reviewDate','status'],(state.documents||[]).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(deptName(r.department))+'</td><td>'+esc(r.owner||'—')+'</td><td>'+dateText(r.reviewDate)+'</td><td>'+badge(r.status)+'</td></tr>';}).join('')))+
      registerBlock('policy',L('manualRegister'),L('allDepartments'),addBtn('manual',L('addManual')),manualTable())+'</section>';
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
  function groupedDepartmentRows(cols,rowBuilder){
    var out='';
    departmentOrder.forEach(function(dept){
      var rows=rowBuilder(dept);
      out+='<tr class="grc-table-group"><td colspan="'+cols+'"><span class="grc-table-group-dot" style="background:'+deptColor(dept)+'"></span><strong>'+esc(deptName(dept))+'</strong><span>'+esc(deptAbbr(dept))+'</span></td></tr>'+(rows||'<tr class="grc-table-group-empty"><td colspan="'+cols+'">'+L('noRecords')+'</td></tr>');
    });
    var divisionRows=rowBuilder('division');
    if(divisionRows)out+='<tr class="grc-table-group"><td colspan="'+cols+'"><span class="grc-table-group-dot" style="background:'+deptColor('division')+'"></span><strong>'+esc(deptName('division'))+'</strong><span>'+esc(deptAbbr('division'))+'</span></td></tr>'+divisionRows;
    return out;
  }

  function governanceTable(kind,dept,style,grouped){
    var heads=['name','code','issueDate','effectiveDate','reviewDate','status'];
    function rowsFor(d){return filterDept(state[kind],d).map(function(r){return'<tr><td>'+esc(recordName(r))+'</td><td class="grc-id">'+esc(r.code||r.id||'—')+'</td><td>'+dateText(r.issueDate)+'</td><td>'+dateText(r.effectiveDate||r.startDate)+'</td><td>'+dateText(r.reviewDate||r.expiryDate)+'</td><td>'+badge(isExpired(r)?'expired':r.status)+'</td></tr>';}).join('');}
    var rows=grouped?groupedDepartmentRows(heads.length,rowsFor):rowsFor(dept);
    return tableHtml(style,heads,rows);
  }
  function riskTable(dept,grouped){
    var heads=['riskId','riskIdentified','riskCategory','likelihood','impact','riskScore','riskLevel','controlType','actionStatus'];
    function rowsFor(d){return filterDept(state.risks,d).map(function(r){var score=riskScore(r),level=riskLevel(r),status=normalizeStatus(r.actionStatus||r.status);return'<tr class="'+(status==='open'?'grc-risk-open-row':'')+'"><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(recordName(r))+'</td><td>'+esc(L(r.riskCategory)||r.riskCategory||'—')+'</td><td>'+esc(r.likelihood||'—')+'</td><td>'+esc(r.impact||'—')+'</td><td><b>'+score+'</b></td><td>'+badge(level)+'</td><td>'+esc(L(r.controlType)||r.controlType||'—')+'</td><td>'+riskActionBadge(status)+'</td></tr>';}).join('');}
    function groupedRows(){
      var out='';
      ['maintenance','safety'].forEach(function(d){out+=riskGroupRow(d,rowsFor(d),heads.length);});
      out+='<tr class="grc-table-group grc-table-group-parent"><td colspan="'+heads.length+'"><span class="grc-table-group-dot" style="background:'+deptColor('housekeeping')+'"></span><strong>'+esc(deptName('housekeeping'))+'</strong><span>'+esc(deptAbbr('housekeeping'))+'</span></td></tr>';
      out+=riskSubgroupRow('housekeepingRisk',rowsFor('housekeepingRisk'),heads.length);
      out+=riskSubgroupRow('laundryRisk',rowsFor('laundryRisk'),heads.length);
      out+=riskGroupRow('projects',rowsFor('projects'),heads.length);
      var divisionRows=filterDept(state.risks,'division').length?rowsFor('division'):'';
      if(divisionRows)out+=riskGroupRow('division',divisionRows,heads.length);
      return out;
    }
    return tableHtml('risk',heads,grouped?groupedRows():rowsFor(dept));
  }
  function riskGroupRow(dept,rows,cols){return'<tr class="grc-table-group"><td colspan="'+cols+'"><span class="grc-table-group-dot" style="background:'+deptColor(dept)+'"></span><strong>'+esc(deptName(dept))+'</strong><span>'+esc(deptAbbr(dept))+'</span></td></tr>'+(rows||'<tr class="grc-table-group-empty"><td colspan="'+cols+'">'+L('noRecords')+'</td></tr>');}
  function riskSubgroupRow(dept,rows,cols){return'<tr class="grc-table-subgroup"><td colspan="'+cols+'"><span class="grc-table-group-dot" style="background:'+deptColor(dept)+'"></span><strong>'+esc(deptName(dept))+'</strong><span>'+esc(deptAbbr(dept))+'</span></td></tr>'+(rows||'<tr class="grc-table-group-empty"><td colspan="'+cols+'">'+L('noRecords')+'</td></tr>');}
  function incidentTable(dept,grouped){
    var heads=['incidentId','date','category','contributingFactors','investigationRequired','responsibleDept','status'];
    function rowsFor(d){return filterDept(state.incidents,d).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+dateText(r.date)+'</td><td>'+esc(r.category||'—')+'</td><td>'+esc(r.contributingFactors||'—')+'</td><td>'+badge(r.investigationRequired==='yes'?'yes':'no')+'</td><td>'+esc(deptName(r.department||r.responsibleDept))+'</td><td>'+badge(r.status)+'</td></tr>';}).join('');}
    return tableHtml('incident',heads,grouped?groupedDepartmentRows(heads.length,rowsFor):rowsFor(dept));
  }
  function codeTable(dept,grouped){
    var heads=['codeNumber','status','type','date','location','closeDateTime'];
    function rowsFor(d){return filterDept(state.codes,d).map(function(r){return'<tr><td class="grc-id">'+esc(r.id)+'</td><td>'+badge(r.status)+'</td><td>'+badge(r.type)+'</td><td>'+dateText(r.date)+'</td><td>'+esc(r.location||'—')+'</td><td>'+dateText(r.closeDateTime)+'</td></tr>';}).join('');}
    return tableHtml('code',heads,grouped?groupedDepartmentRows(heads.length,rowsFor):rowsFor(dept));
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
  function reportTitle(r){return isAr()?(r.titleAr||r.titleEn):(r.titleEn||r.titleAr);}
  function reportTypeLabel(type){var m={annualReport:'annualFmsReport',annualExecutive:'annualExecutiveSummary',quarterlyReport:'quarterlyFmsReport',quarterlyExecutive:'quarterlyExecutiveSummary'};return L(m[type]||type);}
  function reportGroupTypes(group){return group==='annual'?['annualExecutive','annualReport']:['quarterlyExecutive','quarterlyReport'];}
  function reportYears(){var now=new Date().getFullYear(),map={};for(var y=2024;y<=now;y++)map[y]=1;REPORT_LIBRARY.forEach(function(r){map[Number(r.year)]=1;});return Object.keys(map).map(Number).sort(function(a,b){return b-a;});}
  function reportFind(type,year,quarter){return REPORT_LIBRARY.find(function(r){return r.type===type&&Number(r.year)===Number(year)&&(quarter==null||Number(r.quarter)===Number(quarter));})||null;}
  function reportCount(type,year){return REPORT_LIBRARY.filter(function(r){return(!type||r.type===type)&&(!year||Number(r.year)===Number(year));}).length;}
  function reportBreadcrumb(){var parts=['<button onclick="window._grcReportHome()">'+L('reportsHub')+'</button>'];if(reportNav.group)parts.push('<span>›</span><button onclick="window._grcReportGroup(\''+reportNav.group+'\')">'+L(reportNav.group==='annual'?'annualReports':'quarterlyReports')+'</button>');if(reportNav.type)parts.push('<span>›</span><button onclick="window._grcReportType(\''+reportNav.type+'\')">'+reportTypeLabel(reportNav.type)+'</button>');if(reportNav.year)parts.push('<span>›</span><button onclick="window._grcReportYear('+Number(reportNav.year)+')">'+Number(reportNav.year)+'</button>');if(reportNav.quarter)parts.push('<span>›</span><b>'+L('q'+Number(reportNav.quarter))+'</b>');return'<div class="grc-report-path">'+parts.join('')+'</div>';}
  function reportTopCards(){
    return'<div class="grc-report-category-grid">'+
      '<button class="grc-report-card" onclick="window._grcReportGroup(\'annual\')"><span class="grc-report-card-icon">▤</span><span><h3>'+L('annualReports')+'</h3><p>'+L('annualExecutiveSummary')+' · '+L('annualFmsReport')+'</p></span><span class="grc-report-arrow">›</span></button>'+
      '<button class="grc-report-card" onclick="window._grcReportGroup(\'quarterly\')"><span class="grc-report-card-icon">▥</span><span><h3>'+L('quarterlyReports')+'</h3><p>'+L('quarterlyExecutiveSummary')+' · '+L('quarterlyFmsReport')+'</p></span><span class="grc-report-arrow">›</span></button>'+
      '</div>';
  }
  function reportMetricsAndCharts(){
    var years=reportYears(),availableYears={};REPORT_LIBRARY.forEach(function(r){availableYears[r.year]=1;});
    var metrics='<div class="grc-metric-grid cols-5">'+
      metricCard(L('reportDocuments'),REPORT_LIBRARY.length,'info',L('available'))+
      metricCard(L('quarterlyDocuments'),reportCount('quarterlyReport'),'good',L('available'))+
      metricCard(L('executiveSummaries'),reportCount('quarterlyExecutive')+reportCount('annualExecutive'),'purple',L('available'))+
      metricCard(L('annualDocuments'),reportCount('annualReport')+reportCount('annualExecutive'),'warn',L('available'))+
      metricCard(L('availableYears'),Object.keys(availableYears).length,'neutral',L('reports'))+'</div>';
    var yearItems=years.slice().reverse().map(function(y,i){return{label:String(y),value:reportCount(null,y),color:[chartPalette.slate,chartPalette.teal,chartPalette.blue,chartPalette.violet][i%4]};});
    var rows=years.slice().reverse().map(function(y){return{label:String(y),segments:[{label:L('quarterlyFmsReport'),value:reportCount('quarterlyReport',y),color:chartPalette.teal},{label:L('quarterlyExecutiveSummary'),value:reportCount('quarterlyExecutive',y),color:chartPalette.violet},{label:L('annualReports'),value:reportCount('annualReport',y)+reportCount('annualExecutive',y),color:chartPalette.amber}]};});
    var legend=[{label:L('quarterlyFmsReport'),color:chartPalette.teal},{label:L('quarterlyExecutiveSummary'),color:chartPalette.violet},{label:L('annualReports'),color:chartPalette.amber}];
    return metrics+'<div class="grc-chart-grid cols-2">'+verticalBarChart(L('reportsByYear'),yearItems)+stackedBarChart(L('reportCoverage'),rows,legend)+'</div>';
  }
  function reportTypeCards(group){return reportGroupTypes(group).map(function(type){var count=reportCount(type),icon=type.indexOf('Executive')>=0?'◫':'▥';return'<button class="grc-report-card" onclick="window._grcReportType(\''+type+'\')"><span class="grc-report-card-icon">'+icon+'</span><span><h3>'+reportTypeLabel(type)+'</h3><p>'+count+' '+L('reportDocuments')+'</p></span><span class="grc-report-arrow">›</span></button>';}).join('');}
  function reportYearCards(type){return reportYears().map(function(y){var count=reportCount(type,y),available=count>0;return'<button class="grc-report-year-card" onclick="window._grcReportYear('+y+')"><strong>'+y+'</strong><small>'+count+' '+L('reportDocuments')+'</small><span class="grc-report-availability '+(available?'':'off')+'">'+L(available?'available':'unavailable')+'</span></button>';}).join('');}
  function reportQuarterCards(type,year){return[1,2,3,4].map(function(q){var r=reportFind(type,year,q),available=!!r;return'<button class="grc-quarter-card '+(available?'':'disabled')+'" '+(available?'onclick="window._grcReportQuarter('+q+')"':'disabled')+'><span class="q-index">Q'+q+'</span>'+L('q'+q)+'<small>'+L(available?'available':'unavailable')+'</small></button>';}).join('');}
  function reportViewerHtml(r){if(!r)return'<div class="grc-report-empty"><b>'+L('unavailable')+'</b>'+L('noReportAvailable')+'</div>';var src=esc(r.path)+'#toolbar=0&navpanes=0&view=FitH';return'<div class="grc-report-viewer-card"><div class="grc-report-viewer-head"><div><div class="grc-report-viewer-title">'+esc(reportTitle(r))+'</div><div class="grc-report-viewer-meta">'+Number(r.year)+(r.quarter?' · '+L('q'+r.quarter):'')+' · '+Number(r.pages||0)+' '+L('pages')+'</div></div><button onclick="window.open(\''+esc(r.path)+'\',\'_blank\',\'noopener\')">'+L('openFullScreen')+'</button></div><iframe class="grc-report-frame" loading="lazy" title="'+esc(reportTitle(r))+'" src="'+src+'"></iframe></div>';}
  function reportsPage(){
    var content=hero('GRC · Reporting',L('reportsTitle'),L('reportsDesc'))+reportBreadcrumb();
    if(!reportNav.group)return content+reportTopCards()+reportMetricsAndCharts();
    if(!reportNav.type)return content+sectionHead(L('selectReportType'),L(reportNav.group==='annual'?'annualReports':'quarterlyReports'))+'<div class="grc-report-type-grid">'+reportTypeCards(reportNav.group)+'</div>'+reportMetricsAndCharts();
    if(!reportNav.year)return content+sectionHead(L('selectYear'),reportTypeLabel(reportNav.type))+'<div class="grc-report-year-grid">'+reportYearCards(reportNav.type)+'</div>';
    if(reportNav.group==='quarterly'&&!reportNav.quarter)return content+sectionHead(L('selectQuarter'),reportTypeLabel(reportNav.type)+' · '+reportNav.year)+'<div class="grc-quarter-grid">'+reportQuarterCards(reportNav.type,reportNav.year)+'</div>';
    return content+sectionHead(L('reportViewer'),reportTypeLabel(reportNav.type))+reportViewerHtml(reportFind(reportNav.type,reportNav.year,reportNav.quarter));
  }
  window._grcReportHome=function(){reportNav={group:null,type:null,year:null,quarter:null};render();};
  window._grcReportGroup=function(group){reportNav={group:group,type:null,year:null,quarter:null};render();};
  window._grcReportType=function(type){reportNav.type=type;reportNav.year=null;reportNav.quarter=null;render();};
  window._grcReportYear=function(year){reportNav.year=Number(year);reportNav.quarter=null;render();};
  window._grcReportQuarter=function(q){reportNav.quarter=Number(q);render();};
  function pageHtml(id){if(id==='executive')return executivePage();if(id==='governance')return governancePage();if(id==='risk')return riskPage();if(id==='register')return registerPage();if(id==='manuals')return manualsPage();if(id==='compliance')return compliancePage();if(id==='audit')return auditPage();if(id==='actions')return actionsPage();if(id==='documents')return documentsPage();return reportsPage();}

  function ensureOrgViewerStyles(){
    if(document.getElementById('_grcOrgViewerStyles'))return;
    var st=document.createElement('style');
    st.id='_grcOrgViewerStyles';
    st.textContent='\
#_grcOrgModal{position:fixed;inset:0;z-index:2147483000;background:rgba(5,18,32,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;}\
#_grcOrgModal .grc-org-viewer{width:min(96vw,1500px);height:min(94vh,980px);background:#f8fbfd;border:1px solid rgba(255,255,255,.5);border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.38);display:flex;flex-direction:column;overflow:hidden;}\
#_grcOrgModal .grc-org-viewer-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;background:linear-gradient(135deg,#0d3f67,#0f7f86);color:#fff;}\
#_grcOrgModal .grc-org-viewer-title{font-weight:800;font-size:18px;line-height:1.3;}\
#_grcOrgModal .grc-org-viewer-sub{opacity:.82;font-size:12px;margin-top:3px;}\
#_grcOrgModal .grc-org-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\
#_grcOrgModal .grc-org-tool{height:36px;min-width:38px;border:1px solid rgba(255,255,255,.35);border-radius:10px;background:rgba(255,255,255,.13);color:#fff;font-weight:800;cursor:pointer;padding:0 12px;}\
#_grcOrgModal .grc-org-tool:hover{background:rgba(255,255,255,.23);}\
#_grcOrgModal .grc-org-close{font-size:22px;line-height:1;}\
#_grcOrgModal .grc-org-stage{position:relative;flex:1;overflow:auto;background:linear-gradient(180deg,#eef5f8,#f9fbfc);padding:24px;text-align:center;}\
#_grcOrgModal .grc-org-image-wrap{display:inline-block;transform-origin:top center;transition:transform .18s ease;line-height:0;}\
#_grcOrgModal .grc-org-image{display:block;width:min(100%,1120px);height:auto;max-width:none;border-radius:14px;box-shadow:0 14px 42px rgba(19,62,91,.16);background:#fff;image-rendering:auto;}\
#_grcOrgModal .grc-org-note{position:absolute;left:20px;bottom:16px;background:rgba(9,48,78,.82);color:#fff;border-radius:999px;padding:7px 11px;font-size:11px;pointer-events:none;}\
@media(max-width:720px){#_grcOrgModal{padding:0;}#_grcOrgModal .grc-org-viewer{width:100vw;height:100vh;border-radius:0;}#_grcOrgModal .grc-org-viewer-head{padding:12px;}#_grcOrgModal .grc-org-viewer-sub{display:none;}#_grcOrgModal .grc-org-stage{padding:12px;}#_grcOrgModal .grc-org-image{width:980px;}}';
    document.head.appendChild(st);
  }
  window._grcOrgZoom=function(delta){
    var wrap=document.querySelector('#_grcOrgModal .grc-org-image-wrap');
    var stage=document.querySelector('#_grcOrgModal .grc-org-stage');
    if(!wrap||!stage)return;
    var current=Number(wrap.getAttribute('data-scale')||1);
    var next=Math.max(.55,Math.min(2.6,current+delta));
    wrap.setAttribute('data-scale',String(next));
    wrap.style.transform='scale('+next+')';
    wrap.style.marginBottom=Math.max(0,(wrap.offsetHeight*(next-1)))+'px';
  };
  window._grcOrgFit=function(){
    var wrap=document.querySelector('#_grcOrgModal .grc-org-image-wrap');
    if(!wrap)return;
    wrap.setAttribute('data-scale','1');
    wrap.style.transform='scale(1)';
    wrap.style.marginBottom='0';
    var stage=document.querySelector('#_grcOrgModal .grc-org-stage');
    if(stage){stage.scrollTop=0;stage.scrollLeft=0;}
  };
  window._grcOpenOrgStructure=function(){
    var old=document.getElementById('_grcOrgModal');if(old)old.remove();
    ensureOrgViewerStyles();
    var ov=document.createElement('div');
    ov.id='_grcOrgModal';
    ov.innerHTML='<div class="grc-org-viewer" role="dialog" aria-modal="true" aria-label="'+esc(L('orgChartTitle'))+'">'+
      '<div class="grc-org-viewer-head"><div><div class="grc-org-viewer-title">'+L('orgChartTitle')+'</div><div class="grc-org-viewer-sub">'+L('orgChartDesc')+'</div></div>'+
      '<div class="grc-org-toolbar"><button class="grc-org-tool" onclick="window._grcOrgZoom(-0.15)" aria-label="Zoom out">−</button><button class="grc-org-tool" onclick="window._grcOrgFit()">'+(isAr()?'ملاءمة':'Fit')+'</button><button class="grc-org-tool" onclick="window._grcOrgZoom(0.15)" aria-label="Zoom in">+</button><button class="grc-org-tool grc-org-close" onclick="document.getElementById(\'_grcOrgModal\').remove()" aria-label="Close">×</button></div></div>'+
      '<div class="grc-org-stage"><div class="grc-org-image-wrap" data-scale="1"><img class="grc-org-image" src="assets/grc/fms-organizational-structure.png?v=20260707-org-hires" alt="'+esc(L('orgChartTitle'))+'"></div><div class="grc-org-note">'+(isAr()?'استخدمي + و − للتكبير':'Use + and − to zoom')+'</div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'&&document.getElementById('_grcOrgModal')){document.getElementById('_grcOrgModal').remove();document.removeEventListener('keydown',onKey);}});
  };

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
    if(kind==='codes'&&filter==='successful')return arr.filter(function(r){return normalizeStatus(r.status)==='successful';});
    if(kind==='codes'&&filter==='failed')return arr.filter(function(r){return normalizeStatus(r.status)==='failed';});
    if(kind==='codes'&&filter==='drillRatio')return arr.filter(function(r){return['successful','failed'].indexOf(normalizeStatus(r.status))>=0;});
    if(kind==='codes'&&filter==='failedRate')return arr.filter(function(r){return normalizeStatus(r.status)==='failed';});
    return arr;
  }
  function metricTitle(kind,filter){
    var map={policies:'policies',plans:'plans',forms:'forms',manuals:'manuals',risks:'riskRegister',incidents:'incidents',codes:'codes'};
    var f={total:'total',open:'open',active:'active',expired:'expired',expiring:'expiringThisYear',closed:'closed',critical:'critical',high:'high',medium:'medium',low:'low',highCritical:'highCriticalRate',real:'realCodes',drill:'drillCodes',successful:'successfulCodes',failed:'failedCodes',failedRate:'failedCodeRate',drillRatio:'successVsFailed',years:'incidentsByYear'};
    return L(map[kind])+' · '+L(f[filter]||filter);
  }
  function detailRow(kind,r){
    var meta=[];
    if(r.department)meta.push(deptName(r.department));
    if(kind==='risks'){meta.push(L(riskLevel(r)));meta.push(L('riskScore')+': '+riskScore(r));meta.push(L(r.actionStatus||r.status));}
    if(kind==='incidents'){meta.push(dateText(r.date));meta.push(r.category||'—');meta.push(L(r.status));}
    if(kind==='codes'){meta.push(L(r.type));meta.push(L(r.status));meta.push(r.location||'—');}
    if(['policies','plans','forms','manuals'].indexOf(kind)>=0){meta.push(L(isExpired(r)?'expired':r.status));var d=r.expiryDate||r.reviewDate;if(d)meta.push(L('expiryDate')+': '+dateText(d));}
    return'<div class="grc-detail-row"><div class="grc-detail-main"><div class="grc-detail-title">'+esc(recordName(r))+'</div><div class="grc-detail-meta">'+meta.map(esc).join(' · ')+'</div></div><span class="grc-badge neutral">'+esc(r.id||'—')+'</span></div>';
  }
  window._grcOpenMetric=function(kind,filter,dept){
    var records=metricRecords(kind,filter,dept),old=document.getElementById('_grcDetailModal');if(old)old.remove();
    var body='';
    if(kind==='incidents'&&filter==='years'){
      var yearMap={};records.forEach(function(r){var d=parseDate(r.date);if(d)yearMap[d.getFullYear()]=true;});
      var years=Object.keys(yearMap).map(Number).sort(function(a,b){return a-b;});if(!years.length)years=[new Date().getFullYear()];
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
  function deptOptions(){return departments.slice(1).map(function(d){return[d,deptName(d)];});}
  function statusOptions(kind){
    if(kind==='policy')return[['active',L('active')],['draft',L('draft')],['underReview',L('underReview')],['expired',L('expired')],['archived',L('archived')]];
    if(['plan','form','manual','document'].indexOf(kind)>=0)return[['active',L('active')],['draft',L('draft')],['underReview',L('underReview')],['expired',L('expired')],['archived',L('archived')]];
    return[['open',L('open')],['inProgress',L('inProgress')],['closed',L('closed')]];
  }
  function defaultDeptFor(type,deptOverride){if(deptOverride&&departmentOrder.indexOf(deptOverride)>=0)return deptOverride;if(['policy','plan','form'].indexOf(type)>=0)return'maintenance';if(['risk','incident','code'].indexOf(type)>=0)return'safety';return'maintenance';}
  function formSpec(type,deptOverride){
    var d=defaultDeptFor(type,deptOverride);
    if(type==='policy')return{title:L('addPolicy'),collection:'policies',prefix:'POL',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
    if(type==='plan')return{title:L('addPlan'),collection:'plans',prefix:'PLN',fields:field('name',L('name'),'text',null,true,true)+field('code',L('code'),'text',null,true)+field('issueDate',L('issueDate'),'date',null,true)+field('effectiveDate',L('effectiveDate'),'date',null,true)+field('reviewDate',L('reviewDate'),'date',null,true)+field('department',L('department'),'select',deptOptions(),true,false,d)+field('status',L('status'),'select',statusOptions(type),true,false,'active')};
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
  window._grcOpenHeatCell=function(dept,likelihood,impact){
    var records=filterDept(state.risks,dept).filter(function(r){return Number(r.likelihood)===Number(likelihood)&&Number(r.impact)===Number(impact);}),old=document.getElementById('_grcDetailModal');if(old)old.remove();
    var rows=records.map(function(r){return'<tr class="'+(isOpen(r)?'grc-risk-open-row':'')+'"><td class="grc-id">'+esc(r.id)+'</td><td>'+esc(r.riskIdentified||'—')+'</td><td>'+esc(r.riskCategory||'—')+'</td><td>'+Number(r.likelihood||0)+'</td><td>'+Number(r.impact||0)+'</td><td>'+riskScore(r)+'</td><td>'+badge(riskLevel(r))+'</td><td>'+riskActionBadge(r.actionStatus)+'</td></tr>';}).join('');
    var body=tableHtml('risk',['riskId','riskIdentified','riskCategory','likelihood','impact','riskScore','riskLevel','actionStatus'],rows);
    var ov=document.createElement('div');ov.id='_grcDetailModal';ov.className='grc-modal-backdrop';ov.innerHTML='<div class="grc-modal wide"><div class="grc-modal-head"><div><div class="grc-modal-title">'+L('riskHeatMap')+' · '+L('likelihood')+' '+likelihood+' × '+L('impact')+' '+impact+'</div><div class="grc-modal-sub">'+deptName(dept)+' · '+records.length+' '+L('records')+'</div></div><button class="grc-modal-close" onclick="document.getElementById(\'_grcDetailModal\').remove()">×</button></div><div class="grc-modal-body">'+body+'</div></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  };

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
  window._showGrcComingSoon=function(){
    window._closeGrcComingSoon();document.body.classList.add('grc-coming-open');
    var ov=document.createElement('div');ov.id='_grcComingSoon';ov.className='grc-modal-backdrop grc-coming-backdrop';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','_grcComingTitle');
    ov.style.cssText='position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(3,13,31,.84)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;';
    ov.innerHTML='<div class="grc-coming-card" style="width:min(520px,calc(100vw - 34px))!important;max-width:520px!important;background:#fff!important;border:1px solid rgba(1,149,175,.28)!important;border-radius:22px!important;padding:38px 34px 31px!important;text-align:center!important;box-shadow:0 30px 90px rgba(0,0,0,.52)!important;position:relative!important;opacity:1!important;filter:none!important;color:#17384a!important;"><div class="grc-coming-icon">▦</div><div id="_grcComingTitle" class="grc-coming-title">'+L('comingTitle')+'</div><div class="grc-coming-sub">'+L('comingSub')+'</div><div class="grc-coming-pill">'+L('comingSoon')+'</div><div><button type="button" class="grc-coming-back-btn" onclick="window._closeGrcComingSoon()">← '+L('back')+'</button></div></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)window._closeGrcComingSoon();});
  };

  document.addEventListener('DOMContentLoaded',function(){ensureApp();});
})();
