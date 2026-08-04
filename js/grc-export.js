/* ======================================================================
   QUMC GRC — Excel / Report / Page Export
   Build: 2026-07-29 v93 GRC print information block
   ====================================================================== */
(function(){
  'use strict';

  var PAGE_LABELS={
    executive:'Executive Command',governance:'Governance',risk:'Risk Management',register:'Registers',
    compliance:'Compliance',actions:'Action Plans',reports:'Reports',
    manuals:'FMS Manual',advisory:'Review & Development Center'
  };
  var DEPTS=[
    ['safety','Safety'],['maintenance','Maintenance'],['housekeeping','Housekeeping'],
    ['laundry','Laundry'],['projects','Project Management']
  ];
  var EXCEL_EXCLUDED_PAGES={executive:true,advisory:true};
  var REPORT_PARTS=[];

  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function snap(){return typeof window._grcGetExportSnapshot==='function'?(window._grcGetExportSnapshot()||{}):{};}
  function modules(){return typeof window._grcGetModules==='function'?window._grcGetModules():Object.keys(PAGE_LABELS).map(function(id){return{id:id,label:PAGE_LABELS[id]};});}
  function closeOverlay(){var x=document.getElementById('grcExportOverlay');if(x)x.remove();document.body.classList.remove('grc-export-open');}
  function overlay(title,sub,body,confirmLabel,confirmFn){
    closeOverlay();document.body.classList.add('grc-export-open');
    var ov=document.createElement('div');ov.id='grcExportOverlay';ov.className='grc-export-overlay';
    ov.innerHTML='<div class="grc-export-dialog"><div class="grc-export-dialog-head"><div><h2>'+esc(title)+'</h2><p>'+esc(sub||'')+'</p></div><button type="button" onclick="window._grcCloseExportDialog()">×</button></div><div class="grc-export-dialog-body">'+body+'<div class="grc-export-actions-row"><button type="button" class="grc-export-cancel" onclick="window._grcCloseExportDialog()">Cancel</button><button type="button" class="grc-export-confirm" onclick="'+confirmFn+'">'+esc(confirmLabel)+'</button></div></div></div>';
    document.body.appendChild(ov);ov.addEventListener('click',function(e){if(e.target===ov)closeOverlay();});
  }
  window._grcCloseExportDialog=closeOverlay;
  function checked(name){return Array.prototype.map.call(document.querySelectorAll('input[name="'+name+'"]:checked'),function(x){return x.value;});}
  function normalizeDept(v){return String(v||'').toLowerCase().replace(/[\s&/_-]+/g,'');}
  function recordText(r){return[r&&r.id,r&&r.code,r&&r.name,r&&r.nameEn,r&&r.title,r&&r.titleEn,r&&r.riskIdentified,r&&r.responsibleDepartment].join(' ').toUpperCase();}
  function isLaundryRisk(r){return /^LUND/.test(String(r&&r.id||r&&r.code||'').toUpperCase().replace(/[^A-Z0-9]/g,''));}
  function platformDeptIds(depts,mergeLaundry){
    var ids=(depts&&depts.length?depts:DEPTS.map(function(d){return d[0];})).slice();
    if(mergeLaundry&&reportCanViewAllDepartments()){
      if(ids.indexOf('laundry')>=0&&ids.indexOf('housekeeping')<0)ids.push('housekeeping');
      ids=ids.filter(function(x){return x!=='laundry';});
    }
    return ids.filter(function(x,i,a){return a.indexOf(x)===i;});
  }
  function departmentTitle(id){var x=DEPTS.find(function(d){return d[0]===id;});return x?x[1]:id;}
  function deptMatch(r,dept,mode){
    r=r||{};var rd=normalizeDept(r.department||r.dept||r.responsibleDept||r.responsibleDepartment),hay=recordText(r),strict=!reportCanViewAllDepartments();if(strict){if(mode==='risk-register'){if(dept==='laundry')return (rd==='laundry'||rd==='housekeeping')&&isLaundryRisk(r);if(dept==='housekeeping')return (rd==='housekeeping'||rd==='laundry')&&!isLaundryRisk(r);}if(dept==='projects')return rd==='projects'||rd==='projectmanagement';return rd===normalizeDept(dept);}
    if(mode==='risk-register'){
      if(dept==='laundry')return (rd==='housekeeping'||rd==='laundry')&&isLaundryRisk(r);
      if(dept==='housekeeping')return rd==='housekeeping'&&!isLaundryRisk(r);
    }
    if(dept==='housekeeping')return rd==='housekeeping'||rd==='laundry'||/\bHK\b|HOUSEKEEPING|LAUNDRY|LUND/.test(hay);
    if(dept==='laundry')return rd==='laundry'||/LAUNDRY|LUND/.test(hay);
    if(dept==='projects')return rd==='projects'||rd==='projectmanagement';
    return rd===dept;
  }
  function complianceDeptMatch(r,depts){
    if(!depts||!depts.length)return true;
    var raw=String(r&&r.responsibleDepartment||r&&r.department||'').trim();
    if(!raw)return reportCanViewAllDepartments();
    var n=normalizeDept(raw),hay=raw.toLowerCase();
    if(!reportCanViewAllDepartments()){var own=depts&&depts[0];if(!own)return false;if(own==='projects')return n.indexOf('project')>=0;return n===normalizeDept(own);}
    return platformDeptIds(depts,true).some(function(d){
      if(d==='housekeeping')return n.indexOf('housekeeping')>=0||n.indexOf('laundry')>=0||hay.indexOf('housekeeping')>=0||hay.indexOf('laundry')>=0;
      if(d==='projects')return n.indexOf('project')>=0;
      return n.indexOf(d)>=0;
    });
  }
  function simpleValue(v){if(v==null)return'';if(Array.isArray(v))return v.map(function(x){return typeof x==='object'?JSON.stringify(x):x;}).join('; ');if(typeof v==='object')return JSON.stringify(v);return v;}
  var REGISTER_GROUPS=[
    {id:'governance',title:'Governance Registers',items:[['policies','Policy Register'],['forms','Form Register'],['plans','Plan Register']]},
    {id:'risk',title:'Risk Management Registers',items:[['risks','Risk Register'],['incidents','Incident Register'],['codes','Emergency Codes']]},
    {id:'resources',title:'Registers',items:[['actions','Action Plans'],['initiatives','Initiatives Register'],['reports','Reports Register'],['manuals_guidelines','Manuals & Guidelines Register']]},
    {id:'compliance',title:'Compliance Assessments',items:[['cbahi','CBAHI Assessment'],['jci','JCI Assessment']]}
  ];
  var REPORT_GROUPS=[
    {id:'governance',title:'Governance',items:[['gov_policies','Policies'],['gov_plans','Plans'],['gov_forms','Forms']]},
    {id:'risk',title:'Risk Management',items:[['risk_register','Risk Register'],['risk_incidents','Incident Register'],['risk_codes','Emergency Codes']]},
    {id:'compliance',title:'Compliance',items:[['overall','Overall Compliance'],['cbahi','CBAHI Assessment'],['jci','JCI Assessment']]},
    {id:'reports',title:'Reports',items:[['reports','Reports']]},
    {id:'manuals',title:'Manuals & Guidelines',items:[['manuals','Manuals & Guidelines']]},
    {id:'initiatives',title:'Initiatives',items:[['initiatives','Initiatives']]}
  ];
  var REPORT_FIXED_DEPTS=[];
  var EXCEL_FIXED_DEPTS=[];
  function excelSelectable(){return Array.prototype.slice.call(document.querySelectorAll('[data-grc-excel-selectable]'));}
  function selectedCount(group){return Array.prototype.slice.call(document.querySelectorAll('input[data-grc-register-group="'+group.id+'"]')).filter(function(x){return x.checked;}).length;}
  function updateDropdownLabel(group){var label=document.getElementById('grcExcelDropLabel-'+group.id),n=selectedCount(group);if(label)label.textContent=n===group.items.length?'All selected':n+' selected';}
  function registerGroupHtml(group){return'<div class="grc-export-compact-group"><button type="button" class="grc-export-dropdown-btn" onclick="window._grcToggleExcelDropdown(\''+group.id+'\',event)"><span><b>'+esc(group.title)+'</b><small id="grcExcelDropLabel-'+group.id+'">All selected</small></span><i>⌄</i></button><div id="grcExcelDrop-'+group.id+'" class="grc-export-dropdown-menu"><label class="grc-export-check group-all"><input id="grcExcelGroupAll-'+group.id+'" type="checkbox" checked onchange="window._grcToggleRegisterGroup(\''+group.id+'\',this.checked)"><span>Select all in this group</span></label>'+group.items.map(function(item){return'<label class="grc-export-check"><input data-grc-excel-selectable data-grc-register-group="'+group.id+'" type="checkbox" name="grcExcelRegister" value="'+item[0]+'" checked onchange="window._grcSyncRegisterGroup(\''+group.id+'\')"><span>'+esc(item[1])+'</span></label>';}).join('')+'</div></div>';}
  window._grcToggleExcelDropdown=function(id,e){if(e){e.preventDefault();e.stopPropagation();}document.querySelectorAll('.grc-export-dropdown-menu.is-open').forEach(function(x){if(x.id!=='grcExcelDrop-'+id)x.classList.remove('is-open');});var m=document.getElementById('grcExcelDrop-'+id);if(m)m.classList.toggle('is-open');};
  window._grcToggleExcelAll=function(on){excelSelectable().forEach(function(x){x.checked=!!on;});REGISTER_GROUPS.forEach(function(g){var all=document.getElementById('grcExcelGroupAll-'+g.id);if(all)all.checked=!!on;updateDropdownLabel(g);});};
  window._grcToggleRegisterGroup=function(group,on){document.querySelectorAll('input[data-grc-register-group="'+group+'"]').forEach(function(x){x.checked=!!on;});window._grcSyncRegisterGroup(group);};
  window._grcSyncRegisterGroup=function(group){var boxes=Array.prototype.slice.call(document.querySelectorAll('input[data-grc-register-group="'+group+'"]')),all=document.getElementById('grcExcelGroupAll-'+group),g=REGISTER_GROUPS.find(function(x){return x.id===group;});if(all){all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});all.indeterminate=boxes.some(function(x){return x.checked;})&&!all.checked;}if(g)updateDropdownLabel(g);window._grcSyncExcelAll();};
  window._grcSyncExcelAll=function(){var boxes=excelSelectable(),all=document.getElementById('grcExcelSelectAll');if(all){all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});all.indeterminate=boxes.some(function(x){return x.checked;})&&!all.checked;}};
  window._grcOpenExcelSelector=function(){
    var canViewAll=reportCanViewAllDepartments();
    var ownDept=reportUserDept();if(!canViewAll&&!ownDept){alert('No department is assigned to this account. Contact the administrator before exporting.');return;}EXCEL_FIXED_DEPTS=canViewAll?[]:[ownDept];
    var deptSection='';
    if(canViewAll){
      var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input data-grc-excel-selectable type="checkbox" name="grcExcelDept" value="'+d[0]+'" checked onchange="window._grcSyncExcelAll()"><span>'+d[1]+'</span></label>';}).join('');
      deptSection='<div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div>';
    }
    var groups=REGISTER_GROUPS.map(registerGroupHtml).join('');
    var help=canViewAll?'Select or clear every available department and register.':'Select or clear every available register.';
    var body='<label class="grc-export-select-all"><input id="grcExcelSelectAll" type="checkbox" checked onchange="window._grcToggleExcelAll(this.checked)"><span><b>Select All Options</b><small>'+help+'</small></span></label>'+deptSection+'<div class="grc-export-section"><h3>Registers</h3><p class="grc-export-help">Open a compact dropdown and choose one or more register tables.</p><div class="grc-export-dropdown-grid">'+groups+'</div></div>';
    overlay('GRC Excel Export',canViewAll?'Choose departments and register tables. Every selected table is exported from its register data.':'Choose register tables for your assigned department.',body,'Generate Excel','window._grcGenerateExcel()');
  };

  function table(title,columns,rows,color){return{title:title,columns:columns,rows:rows||[],color:color||'FF294B5F'};}
  function section(title,tables,color){tables=(tables||[]).filter(function(t){return t.rows&&t.rows.length;});return tables.length?{title:title,tables:tables,color:color||'FF2B6E7F'}:null;}
  function governanceSet(data,depts,types){
    types=types&&types.length?types:['policies','plans','forms'];
    var defs={
      policies:{title:'Policies',columns:['Code','Policy Name','Issue Date','Effective Date','Review Date','Status'],row:function(r){return[r.code||r.id,r.nameEn||r.name||r.title,r.issueDate,r.effectiveDate||r.startDate,r.reviewDate||r.expiryDate,r.status];}},
      forms:{title:'Forms',columns:['Code','Form Name','Scope','Status'],row:function(r){return[r.code||r.id,r.nameEn||r.name||r.title,r.scope||r.formScope||'',r.status];}},
      plans:{title:'Plans',columns:['Code','Plan Name','Issue Date','Effective Date','Review Date','Status'],row:function(r){return[r.code||r.id,r.nameEn||r.name||r.title,r.issueDate,r.effectiveDate||r.startDate,r.reviewDate||r.expiryDate,r.status];}}
    };
    var sections=platformDeptIds(depts,true).map(function(dept){
      var tables=types.map(function(key){var d=defs[key],rows=(data[key]||[]).filter(function(r){return deptMatch(r,dept,'merged');}).map(d.row);return table(d.title,d.columns,rows);});
      return section(departmentTitle(dept),tables,departmentArgb(dept));
    }).filter(Boolean);
    return{title:'Governance',kind:'sectioned',sections:sections};
  }
  function riskSet(data,depts,types){
    types=types&&types.length?types:['risks','incidents','codes'];
    var sections=[];
    if(types.indexOf('risks')>=0){
      var riskTables=platformDeptIds(depts,false).map(function(dept){
        var rows=(data.risks||[]).filter(function(r){return deptMatch(r,dept,'risk-register');}).map(function(r){return[r.id||r.code,r.riskIdentified||r.description||r.title,departmentTitle(dept),r.riskCategory||r.category,r.likelihood,r.impact,r.riskScore||Number(r.likelihood||0)*Number(r.impact||0),r.riskLevel,r.controlType||r.currentControl,r.actionStatus||r.status];});
        return table(departmentTitle(dept),['Code','Risk Identified','Department','Category','Likelihood','Impact','Score','Level','Control Type','Action Status'],rows,departmentArgb(dept));
      });
      var sec=section('Risk Register',riskTables,'FFC95B58');if(sec)sections.push(sec);
    }
    if(types.indexOf('incidents')>=0){
      var incidentTables=platformDeptIds(depts,true).map(function(dept){
        var rows=(data.incidents||[]).filter(function(r){return deptMatch(r,dept,'merged');}).map(function(r){return[r.id||r.code,r.title||r.name||r.description,departmentTitle(dept),r.category||r.type,r.date||r.incidentDate||r.eventDate,r.severity||r.level,r.status];});
        return table(departmentTitle(dept),['Code','Incident','Department','Category / Type','Date','Severity','Status'],rows,departmentArgb(dept));
      });
      var sec2=section('Incident Register',incidentTables,'FFB77B35');if(sec2)sections.push(sec2);
    }
    if(types.indexOf('codes')>=0){
      var codeTables=platformDeptIds(depts,true).filter(function(d){return d!=='projects';}).map(function(dept){
        var rows=(data.codes||[]).filter(function(r){return deptMatch(r,dept,'merged');}).map(function(r){return[r.id||r.code,r.name||r.title||r.description,departmentTitle(dept),r.type||r.category,r.date||r.eventDate,r.participants||r.attendance,r.outcome||r.status,r.status];});
        return table(departmentTitle(dept),['Code','Emergency Code','Department','Type','Date','Participants','Outcome','Status'],rows,departmentArgb(dept));
      });
      var sec3=section('Emergency Codes',codeTables,'FF8B62B4');if(sec3)sections.push(sec3);
    }
    return{title:'Risk Management',kind:'sectioned',sections:sections};
  }
  var CBAHI_COLUMNS=['Chapter','Standard','Standard Description','Sub-Standard','Sub-Standard Description','Specific Requirement','Specific Requirement Description','Responsible Department','Compliance Status','Score','Assessment Activities','Evidence','Gap Description','CAP','Due Date'];
  function cbahiRow(r){return[r.chapter,r.standard,r.standardDescription,r.subStandard,r.subStandardDescription,r.specificRequirement,r.specificRequirementDescription,r.responsibleDepartment,r.complianceStatus,r.score,r.assessmentActivities,r.evidence,r.gapDescription,r.cap,r.dueDate];}
  var JCI_COLUMNS=['Chapter','Domain','Standard','Standard Description','Sub-Standard','Sub-Standard Description','Specific Requirement','Specific Requirement Description','Responsible Department','Compliance Status','Score','Assessment Activities','Evidence','Gap Description','CAP','Due Date'];
  function jciRow(r){return[r.chapter,r.domain,r.standard,r.standardDescription,r.subStandard,r.subStandardDescription,r.specificRequirement,r.specificRequirementDescription,r.responsibleDepartment,r.complianceStatus,r.score,r.assessmentActivities,r.evidence,r.gapDescription,r.cap,r.dueDate];}
  function complianceSet(data,depts,types){
    types=types&&types.length?types:['cbahi','jci'];var sections=[];
    if(types.indexOf('cbahi')>=0){
      var cbahi=(data._cbahiAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);}).map(cbahiRow);
      var b=section('CBAHI Assessment',[table('CBAHI FMS Compliance Assessment',CBAHI_COLUMNS,cbahi)],'FF00A3C4');if(b)sections.push(b);
    }
    if(types.indexOf('jci')>=0){
      var jci=(data._jciAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);}).map(jciRow);
      var d=section('JCI Assessment',[table('JCI FMS Compliance Assessment',JCI_COLUMNS,jci)],'FF8B62B4');if(d)sections.push(d);
    }
    return{title:'Compliance',kind:'sectioned',sections:sections};
  }
  function simpleSet(id,data,depts){
    var rows=[],source=[],columns=[];
    function filtered(key){return(data[key]||[]).filter(function(r){return platformDeptIds(depts,true).some(function(d){return deptMatch(r,d,'merged');});});}
    if(id==='register'){
      columns=['Register','Code','Name / Description','Department','Status'];
      ['policies','plans','forms','risks','incidents','codes','actions','documents'].forEach(function(k){filtered(k).forEach(function(r){rows.push([k,r.code||r.id,r.nameEn||r.name||r.titleEn||r.title||r.riskIdentified||r.description,r.department,r.status||r.actionStatus]);});});
    }else if(id==='actions'){
      source=filtered('actions');columns=['Code','Action','Department','Source','Owner','Due Date','Status','Progress'];source.forEach(function(r){rows.push([r.code||r.id,r.name||r.title||r.action,r.department,r.source,r.owner,r.dueDate,r.status,r.progress]);});
    }else if(id==='documents'){
      source=filtered('documents');columns=['Code','Document','Department','Category','Version','Issue Date','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.name||r.title,r.department,r.category,r.version,r.issueDate,r.status]);});
    }else if(id==='reports'){
      source=(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()!=='guideline';});columns=['Code','Report Name','Family','Type','Year','Quarter','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.titleEn||r.title||r.name,r.family,r.kind||r.type,r.year,r.quarter,r.status||'Available']);});
    }else if(id==='manuals_guidelines'){
      var manuals=filtered('manuals'),guides=(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()==='guideline';});columns=['Code','Manual / Guideline','Type','Language','Version','Status'];manuals.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,'Manual',r.language,r.version,r.status]);});guides.forEach(function(r){rows.push([r.code||r.id,r.titleEn||r.title||r.name,'Guideline',r.language,r.version,r.status||'Available']);});
    }else if(id==='initiatives'){
      source=filtered('initiatives');columns=['Code','Initiative','Department','Owner','Status','Progress'];source.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,r.department,r.owner||r.responsiblePerson,r.status,r.progress]);});
    }else{columns=['Information'];rows=[['No register dataset is configured for this page.']];}
    var titles={actions:'Action Plans',initiatives:'Initiatives Register',reports:'Reports Register',manuals_guidelines:'Manuals & Guidelines Register'};return{title:titles[id]||PAGE_LABELS[id]||id,kind:'flat',columns:columns,rows:rows};
  }
  function resourceSet(data,depts,types){
    types=types&&types.length?types:['actions','initiatives','reports','manuals_guidelines'];
    var labels={actions:'Action Plans',initiatives:'Initiatives Register',reports:'Reports Register',manuals_guidelines:'Manuals & Guidelines Register'};
    var tables=types.map(function(key){
      var set=simpleSet(key,data,depts);
      return table(labels[key]||set.title,set.columns,set.rows,'FF4C8294');
    });
    var sec=section('Registers',tables,'FF2B6E7F');
    return{title:'Registers',kind:'sectioned',sections:sec?[sec]:[]};
  }
  function rowsForPage(id,data,depts,selections){
    if(id==='governance')return governanceSet(data,depts,selections.governance);
    if(id==='risk')return riskSet(data,depts,selections.risk);
    if(id==='resources')return resourceSet(data,depts,selections.resources);
    if(id==='compliance')return complianceSet(data,depts,selections.compliance);
    return simpleSet(id,data,depts);
  }

  function waitForExcelJs(timeoutMs){return new Promise(function(resolve){if(window.ExcelJS)return resolve(true);var started=Date.now(),timer=setInterval(function(){if(window.ExcelJS){clearInterval(timer);resolve(true);}else if(Date.now()-started>=timeoutMs){clearInterval(timer);resolve(false);}},100);});}
  function logoBase64(){var im=document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg');if(!im||!/^data:image/.test(im.src||''))return null;return im.src;}
  function departmentText(depts){return depts.length?depts.map(departmentTitle).join(', '):'All';}
  function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1800);}
  function departmentArgb(id){return{safety:'FFC95B58',maintenance:'FF5475B8',housekeeping:'FF3C9A82',laundry:'FFB77B35',projects:'FF8B62B4'}[id]||'FF2B6E7F';}
  function semanticStyle(value,column){var text=String(value==null?'':value).trim().toLowerCase(),col=String(column||'').toLowerCase(),palette=null;if(/expired|invalid|failed|not met|non.?compliant|critical/.test(text))palette={fill:'FFFDE7E9',font:'FFB42332'};else if(/valid|active|completed|closed|successful|fully met|compliant|done|available/.test(text))palette={fill:'FFE4F5EC',font:'FF18794E'};else if(/open|in progress|under review|pending|partial|high/.test(text))palette={fill:'FFFFF2D5',font:'FF9A6700'};else if(/medium|planned|draft|not applicable/.test(text))palette={fill:'FFEAF3FB',font:'FF246B9A'};else if(/low/.test(text))palette={fill:'FFEAF7EF',font:'FF2D7A4F'};if(!palette&&/(status|level|priority|score)/.test(col)&&text)palette={fill:'FFF1F5F8',font:'FF405A6A'};return palette;}
  function borderStyle(){return{top:{style:'thin',color:{argb:'FFDCE6EC'}},bottom:{style:'thin',color:{argb:'FFDCE6EC'}},left:{style:'thin',color:{argb:'FFDCE6EC'}},right:{style:'thin',color:{argb:'FFDCE6EC'}}};}
  function styleTableHeader(row,color){row.height=25;row.eachCell(function(c){c.fill={type:'pattern',pattern:'solid',fgColor:{argb:color||'FF00A3C4'}};c.font={name:'Calibri',size:10,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border=borderStyle();});}
  function styleDataRow(row,columns,index){row.eachCell(function(c,col){c.font={name:'Calibri',size:9,color:{argb:'FF243B53'}};c.alignment={vertical:'middle',wrapText:true};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:index%2?'FFF8FAFC':'FFFFFFFF'}};c.border=borderStyle();var sem=semanticStyle(c.value,columns[col-1]);if(sem){c.fill={type:'pattern',pattern:'solid',fgColor:{argb:sem.fill}};c.font={name:'Calibri',size:9,bold:true,color:{argb:sem.font}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};}});}
  function addWorkbookHeader(ws,title,depts,cols,logoId){ws.mergeCells(1,1,1,cols);ws.getCell(1,1).value='QUMC — Governance, Risk & Compliance';ws.getCell(1,1).font={name:'Calibri',size:15,bold:true,color:{argb:'FFFFFFFF'}};ws.getCell(1,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF152538'}};ws.getCell(1,1).alignment={horizontal:'center',vertical:'middle'};ws.getRow(1).height=30;ws.mergeCells(2,1,2,cols);ws.getCell(2,1).value=title+' · Facility Management & Safety Division';ws.getCell(2,1).font={name:'Calibri',size:11,bold:true,color:{argb:'FF007A96'}};ws.getCell(2,1).alignment={horizontal:'center'};ws.mergeCells(3,1,3,cols);ws.getCell(3,1).value='Departments: '+departmentText(depts)+' · Generated: '+new Date().toLocaleString('en-GB');ws.getCell(3,1).font={name:'Calibri',size:9,color:{argb:'FF64748B'}};ws.getCell(3,1).alignment={horizontal:'center'};ws.mergeCells(4,1,4,cols);ws.getCell(4,1).value='Status colors: Green = valid / active / completed · Amber = open / pending / in progress · Red = expired / invalid / failed · Blue = informational';ws.getCell(4,1).font={name:'Calibri',size:8,italic:true,color:{argb:'FF52657A'}};ws.getCell(4,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F7FA'}};ws.getCell(4,1).alignment={horizontal:'center',vertical:'middle',wrapText:true};ws.getRow(4).height=24;if(logoId!=null)ws.addImage(logoId,{tl:{col:.15,row:.1},ext:{width:88,height:48}});}
  function allTables(set){if(set.kind==='sectioned')return(set.sections||[]).reduce(function(a,s){return a.concat(s.tables||[]);},[]);return[set];}
  function setColumnWidths(ws,tables){var maxCols=0,widths=[];(tables||[]).forEach(function(t){maxCols=Math.max(maxCols,t.columns.length);t.columns.forEach(function(name,i){widths[i]=Math.max(widths[i]||12,String(name||'').length+2);});(t.rows||[]).slice(0,180).forEach(function(row){row.forEach(function(v,i){widths[i]=Math.max(widths[i]||12,String(simpleValue(v)||'').length+2);});});});for(var i=0;i<maxCols;i++)ws.getColumn(i+1).width=Math.min(i===1?55:44,widths[i]||14);}
  async function buildExcelJs(sets,depts){
    var wb=new ExcelJS.Workbook();wb.creator='QUMC GRC Workspace';wb.created=new Date();var logo=logoBase64(),logoId=null;if(logo){try{logoId=wb.addImage({base64:logo,extension:logo.indexOf('png')>=0?'png':'jpeg'});}catch(_){}}
    sets.forEach(function(set){
      var tables=allTables(set),maxCols=Math.max(2,...tables.map(function(t){return t.columns.length;})),name=(set.title||'Worksheet').replace(/[\\\/?*\[\]:]/g,' ').slice(0,31),ws=wb.addWorksheet(name,{views:[{showGridLines:false,state:'frozen',ySplit:4}]});addWorkbookHeader(ws,set.title,depts,maxCols,logoId);var rowNo=6;
      if(set.kind==='sectioned'){
        if(!(set.sections||[]).length){ws.getCell(rowNo,1).value='No records matched the selected filters.';ws.getCell(rowNo,1).font={italic:true,color:{argb:'FF64748B'}};}
        (set.sections||[]).forEach(function(sec){ws.mergeCells(rowNo,1,rowNo,maxCols);var sc=ws.getCell(rowNo,1);sc.value=sec.title;sc.fill={type:'pattern',pattern:'solid',fgColor:{argb:sec.color||'FF2B6E7F'}};sc.font={name:'Calibri',size:12,bold:true,color:{argb:'FFFFFFFF'}};sc.alignment={horizontal:'left',vertical:'middle'};ws.getRow(rowNo).height=27;rowNo++;
          (sec.tables||[]).forEach(function(t){ws.mergeCells(rowNo,1,rowNo,maxCols);var tc=ws.getCell(rowNo,1);tc.value=t.title;tc.fill={type:'pattern',pattern:'solid',fgColor:{argb:t.color||'FF294B5F'}};tc.font={name:'Calibri',size:10,bold:true,color:{argb:'FFFFFFFF'}};tc.alignment={horizontal:'left',vertical:'middle'};rowNo++;var hr=ws.getRow(rowNo);t.columns.forEach(function(c,i){hr.getCell(i+1).value=c;});styleTableHeader(hr,'FF00A3C4');rowNo++;t.rows.forEach(function(values,i){var r=ws.getRow(rowNo);values.forEach(function(v,col){r.getCell(col+1).value=simpleValue(v);});styleDataRow(r,t.columns,i);rowNo++;});rowNo++;});rowNo++;});
      }else{var hr=ws.getRow(rowNo);set.columns.forEach(function(c,i){hr.getCell(i+1).value=c;});styleTableHeader(hr,'FF00A3C4');rowNo++;(set.rows.length?set.rows:[['No records matched the selected filters.']]).forEach(function(a,i){var r=ws.getRow(rowNo);a.forEach(function(v,col){r.getCell(col+1).value=simpleValue(v);});styleDataRow(r,set.columns,i);rowNo++;});}
      setColumnWidths(ws,tables);
    });
    var buf=await wb.xlsx.writeBuffer();downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'QUMC_GRC_Export_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }
  function buildSheetJs(sets,depts){
    if(!window.XLSX)throw new Error('Excel libraries are unavailable. Check the internet connection and reload the page.');var wb=XLSX.utils.book_new();
    sets.forEach(function(set){var rows=[['QUMC — Governance, Risk & Compliance'],[set.title+' · Facility Management & Safety Division'],['Departments: '+departmentText(depts)+' · Generated: '+new Date().toLocaleString('en-GB')],['Status colors require ExcelJS. Reload while online for the fully formatted file.'],[]];if(set.kind==='sectioned'){(set.sections||[]).forEach(function(sec){rows.push([sec.title]);(sec.tables||[]).forEach(function(t){rows.push([t.title]);rows.push(t.columns);Array.prototype.push.apply(rows,t.rows);rows.push([]);});rows.push([]);});if(!(set.sections||[]).length)rows.push(['No records matched the selected filters.']);}else{rows.push(set.columns);Array.prototype.push.apply(rows,set.rows.length?set.rows:[['No records matched the selected filters.']]);}var ws=XLSX.utils.aoa_to_sheet(rows),maxCols=Math.max.apply(null,rows.map(function(r){return r.length;}));ws['!cols']=new Array(maxCols).fill(0).map(function(_,i){var max=12;rows.slice(4,200).forEach(function(r){max=Math.max(max,String(r[i]||'').length+2);});return{wch:Math.min(50,max)};});XLSX.utils.book_append_sheet(wb,ws,(set.title||'Worksheet').replace(/[\\\/?*\[\]:]/g,' ').slice(0,31));});XLSX.writeFile(wb,'QUMC_GRC_Export_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }
  window._grcGenerateExcel=async function(){
    var depts=EXCEL_FIXED_DEPTS.length?EXCEL_FIXED_DEPTS:checked('grcExcelDept'),selected=checked('grcExcelRegister'),ownDept=reportUserDept();if(!reportCanViewAllDepartments()){if(!ownDept){alert('No department is assigned to this account.');return;}depts=[ownDept];}
    if(!depts.length){alert('Select at least one department.');return;}
    if(!selected.length){alert('Select at least one register.');return;}
    var data=snap(),sets=[],gov=selected.filter(function(x){return['policies','forms','plans'].indexOf(x)>=0;}),risk=selected.filter(function(x){return['risks','incidents','codes'].indexOf(x)>=0;}),resources=selected.filter(function(x){return['actions','initiatives','reports','manuals_guidelines'].indexOf(x)>=0;}),compliance=selected.filter(function(x){return['cbahi','jci'].indexOf(x)>=0;});
    if(gov.length){var g=governanceSet(data,depts,gov);g.title='Governance Registers';sets.push(g);}
    if(risk.length){var r=riskSet(data,depts,risk);r.title='Risk Management Registers';sets.push(r);}
    if(resources.length){var o=resourceSet(data,depts,resources);sets.push(o);}
    if(compliance.length){var c=complianceSet(data,depts,compliance);c.title='Compliance Assessments';sets.push(c);}
    closeOverlay();
    try{var hasExcelJs=await waitForExcelJs(7000);if(hasExcelJs)await buildExcelJs(sets,depts);else buildSheetJs(sets,depts);if(typeof window.addAudit==='function')window.addAudit('GRC_EXPORT_EXCEL','Exported GRC registers: '+selected.join(', '));}catch(e){alert('Excel export failed: '+String(e&&e.message||e));}
  };

  function parsePage(id){
    var live=document.querySelector('#grc-page-'+id);
    if(live)return live;
    var tmp=document.createElement('section');tmp.id='grc-page-'+id;tmp.className='grc-page is-active';
    tmp.innerHTML=typeof window._grcGetPageHtml==='function'?window._grcGetPageHtml(id):'';
    return tmp;
  }
  function cloneRenderedNode(source){
    if(!source)return null;
    var clone=source.cloneNode(true),sourceCanvases=source.querySelectorAll?source.querySelectorAll('canvas'):[],cloneCanvases=clone.querySelectorAll?clone.querySelectorAll('canvas'):[];
    Array.prototype.forEach.call(sourceCanvases,function(canvas,i){
      var target=cloneCanvases[i];if(!target)return;
      try{var img=document.createElement('img');img.src=canvas.toDataURL('image/png');img.alt='Chart';img.className=target.className;img.style.cssText=target.style.cssText;img.style.width=(canvas.getBoundingClientRect().width||canvas.width||320)+'px';img.style.height=(canvas.getBoundingClientRect().height||canvas.height||160)+'px';img.style.maxWidth='100%';target.replaceWith(img);}catch(_e){}
    });
    return clone;
  }
  function freezeRenderedLayout(source,clone){
    if(!source||!clone||!window.getComputedStyle)return clone;
    var src=[source].concat(Array.prototype.slice.call(source.querySelectorAll('*'))),dst=[clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*'))),count=Math.min(src.length,dst.length);
    for(var i=0;i<count;i++){
      var a=src[i],b=dst[i],cs;try{cs=window.getComputedStyle(a);}catch(_e){continue;}if(!cs)continue;
      if(['grid','inline-grid','flex','inline-flex'].indexOf(cs.display)>=0){
        b.classList.add('grc-export-frozen-layout');
        b.style.setProperty('--grc-freeze-display',cs.display);b.style.setProperty('--grc-freeze-cols',cs.gridTemplateColumns||'none');b.style.setProperty('--grc-freeze-rows',cs.gridTemplateRows||'none');b.style.setProperty('--grc-freeze-gap',cs.gap||'0px');b.style.setProperty('--grc-freeze-flow',cs.gridAutoFlow||'row');b.style.setProperty('--grc-freeze-flex-dir',cs.flexDirection||'row');b.style.setProperty('--grc-freeze-flex-wrap',cs.flexWrap||'nowrap');b.style.setProperty('--grc-freeze-align',cs.alignItems||'stretch');b.style.setProperty('--grc-freeze-justify',cs.justifyContent||'normal');
      }
      if(a.matches&&a.matches('.grc-metric-card,.grc-chart-card,.grc-module-card,.grc-register-block,.grc-exec-ops-card,.grc-compliance-card,.grc-initiative-section')){
        var r=a.getBoundingClientRect();if(r.height>12){b.classList.add('grc-export-frozen-box');b.style.setProperty('--grc-freeze-minh',Math.ceil(r.height)+'px');}
      }
    }
    var rootRect=source.getBoundingClientRect();clone.style.setProperty('--grc-source-width',Math.ceil(rootRect.width||source.scrollWidth||1280)+'px');clone.dataset.grcSourceWidth=String(Math.ceil(rootRect.width||source.scrollWidth||1280));return clone;
  }
  function cleanPrintNode(node){
    if(!node)return node;
    node.querySelectorAll('input,select,textarea,.grc-hero-actions,.grc-admin-actions,.grc-inline-crud-actions,.grc-export-actions,.adv-filters,.grc-dept-bar,.grc-filter-row,.grc-table-filterbar,.grc-report-adminbar,.grc-pdf-search,.grc-modal-backdrop,.grc-primary-btn,.grc-link-btn,.grc-icon-btn,.adv-btn,.grc-row-actions').forEach(function(x){x.remove();});
    node.querySelectorAll('[onclick]').forEach(function(x){x.removeAttribute('onclick');x.removeAttribute('tabindex');x.removeAttribute('role');});
    node.querySelectorAll('.is-active').forEach(function(x){if(x.classList.contains('grc-tab')||x.classList.contains('adv-module-card'))x.classList.remove('is-active');});
    return node;
  }
  async function ensureExecutiveRendered(){
    var live=document.getElementById('grc-page-executive');
    if(live)return live;
    if(typeof window._grcSwitch==='function')window._grcSwitch('executive');
    await new Promise(function(r){setTimeout(r,650);});
    return document.getElementById('grc-page-executive')||parsePage('executive');
  }
  function executiveReportParts(page){
    page=page||parsePage('executive');
    return Array.prototype.slice.call(page.querySelectorAll('.grc-exec-domain')).map(function(sec,i){
      var h=sec.querySelector('.grc-exec-domain-head h2'),title=(h&&h.textContent||('Section '+(i+1))).replace(/^\s*\d+(?:\.\d+)*[.\s-]*/,'').trim(),clone=cloneRenderedNode(sec);
      cleanPrintNode(clone);
      return{title:title,node:clone,width:Number(clone.dataset.grcSourceWidth||sec.getBoundingClientRect().width||1280)};
    });
  }
  function reportRole(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');}
  function reportCanViewAllDepartments(){var r=reportRole(),p=Array.isArray(window._fbPerms)?window._fbPerms:[];if(typeof window._grcCanViewAllDepartments==='function')return !!window._grcCanViewAllDepartments();return r==='admin'||r==='super_admin'||p.indexOf('*')>=0||p.indexOf('view_all_departments')>=0||p.indexOf('view_grc_all_departments')>=0;}
  function reportUserDept(){var d='';try{d=typeof window._grcGetCurrentDepartment==='function'?window._grcGetCurrentDepartment():window._fbDept||window.currentUserDept||'';}catch(_){}d=String(d||'').toLowerCase();if(d.indexOf('safe')>=0)return'safety';if(d.indexOf('maint')>=0)return'maintenance';if(d.indexOf('laund')>=0)return'laundry';if(d.indexOf('house')>=0)return'housekeeping';if(d.indexOf('project')>=0)return'projects';return'';}
  function reportSelectable(){return Array.prototype.slice.call(document.querySelectorAll('[data-grc-report-selectable]'));}
  function reportSelectedCount(group){return Array.prototype.slice.call(document.querySelectorAll('input[data-grc-report-group="'+group.id+'"]')).filter(function(x){return x.checked;}).length;}
  function updateReportDropdownLabel(group){var label=document.getElementById('grcReportDropLabel-'+group.id),n=reportSelectedCount(group);if(label)label.textContent=n===group.items.length?'All selected':n+' selected';}
  function reportGroupHtml(group){return'<div class="grc-export-compact-group"><button type="button" class="grc-export-dropdown-btn" onclick="window._grcToggleReportDropdown(\''+group.id+'\',event)"><span><b>'+esc(group.title)+'</b><small id="grcReportDropLabel-'+group.id+'">All selected</small></span><i>⌄</i></button><div id="grcReportDrop-'+group.id+'" class="grc-export-dropdown-menu"><label class="grc-export-check group-all"><input id="grcReportGroupAll-'+group.id+'" type="checkbox" checked onchange="window._grcToggleReportGroup(\''+group.id+'\',this.checked)"><span>Select all in this section</span></label>'+group.items.map(function(item){return'<label class="grc-export-check"><input data-grc-report-selectable data-grc-report-group="'+group.id+'" type="checkbox" name="grcReportItem" value="'+item[0]+'" checked onchange="window._grcSyncReportGroup(\''+group.id+'\')"><span>'+esc(item[1])+'</span></label>';}).join('')+'</div></div>';}
  window._grcToggleReportDropdown=function(id,e){if(e){e.preventDefault();e.stopPropagation();}document.querySelectorAll('.grc-export-dropdown-menu.is-open').forEach(function(x){if(x.id!=='grcReportDrop-'+id)x.classList.remove('is-open');});var m=document.getElementById('grcReportDrop-'+id);if(m)m.classList.toggle('is-open');};
  window._grcToggleReportAll=function(on){reportSelectable().forEach(function(x){x.checked=!!on;});REPORT_GROUPS.forEach(function(g){var all=document.getElementById('grcReportGroupAll-'+g.id);if(all)all.checked=!!on;updateReportDropdownLabel(g);});};
  window._grcToggleReportGroup=function(group,on){document.querySelectorAll('input[data-grc-report-group="'+group+'"]').forEach(function(x){x.checked=!!on;});window._grcSyncReportGroup(group);};
  window._grcSyncReportGroup=function(group){var boxes=Array.prototype.slice.call(document.querySelectorAll('input[data-grc-report-group="'+group+'"]')),all=document.getElementById('grcReportGroupAll-'+group),g=REPORT_GROUPS.find(function(x){return x.id===group;});if(all){all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});all.indeterminate=boxes.some(function(x){return x.checked;})&&!all.checked;}if(g)updateReportDropdownLabel(g);window._grcSyncReportAll();};
  window._grcSyncReportAll=function(){var boxes=reportSelectable(),all=document.getElementById('grcReportSelectAll');if(all){all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});all.indeterminate=boxes.some(function(x){return x.checked;})&&!all.checked;}};
  window._grcOpenReportSelector=function(){
    var canAll=reportCanViewAllDepartments(),ownDept=reportUserDept();if(!canAll&&!ownDept){alert('No department is assigned to this account. Contact the administrator before building a report.');return;}REPORT_FIXED_DEPTS=canAll?[]:[ownDept];var deptSection='';
    if(canAll){var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input data-grc-report-selectable type="checkbox" name="grcReportDept" value="'+d[0]+'" checked onchange="window._grcSyncReportAll()"><span>'+d[1]+'</span></label>';}).join('');deptSection='<div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div>';}
    var body='<label class="grc-export-select-all"><input id="grcReportSelectAll" type="checkbox" checked onchange="window._grcToggleReportAll(this.checked)"><span><b>Select All Options</b><small>Select or clear every available department and report section.</small></span></label>'+deptSection+'<div class="grc-export-section"><h3>Report Content</h3><p class="grc-export-help">Choose the executive-summary sections and indicators to include. The report uses cards and charts only; register tables are excluded.</p><div class="grc-export-dropdown-grid">'+REPORT_GROUPS.map(reportGroupHtml).join('')+'</div></div>';
    overlay('GRC Executive Summary','Choose the departments and the executive-summary content to include.',body,'Build Report','window._grcGenerateReport()');
  };
  function logoSrc(){return((document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg')||{}).src||'');}
  function reportHeader(title,subtitle,date,context){var logo=logoSrc();return'<header class="grc-exec-report-header"><div class="grc-exec-logo">'+(logo?'<img src="'+esc(logo)+'" alt="QUMC">':'')+'</div><div class="grc-exec-heading"><span>OFFICIAL GOVERNANCE, RISK &amp; COMPLIANCE REPORT</span><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p><div><b>'+esc(date)+'</b><i>•</i><b>'+esc(context)+'</b></div></div></header><div class="grc-exec-header-line"></div>';}
  function reportFooter(date){return'<footer class="grc-exec-report-footer"><div><strong>Qassim University Medical City</strong><span>Facility Management &amp; Safety Division · Governance &amp; Performance</span></div><div><b>End of Report</b><small>Generated '+esc(date)+'</small></div></footer>';}
  function reportPrintUser(){
    var name='',email='',role='';
    try{name=String(window._fbName||window.currentUserName||'').trim();}catch(_e){}
    try{email=String(window._fbUser||window._fbEmail||window.currentUserEmail||'').trim();}catch(_e){}
    try{role=String(window._fbRole||window.currentUserRole||'').trim();}catch(_e){}
    if(!name&&email)name=email.split('@')[0];
    if(!name)name='User';
    return{name:name,email:email||'—',role:role||'—'};
  }
  function reportPrintInformation(period){
    var user=reportPrintUser(),printedAt='';
    try{printedAt=new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});}catch(_e){printedAt=new Date().toLocaleString();}
    return'<section class="grc-exec-print-info"><h3>Print Information</h3><div class="grc-exec-print-info-grid"><div><b>Printed by:</b> <strong>'+esc(user.name)+'</strong> <span>'+esc(user.email)+'</span> <span>'+esc(user.role)+'</span></div><div><b>Printed at:</b> '+esc(printedAt)+'</div><div class="grc-exec-print-period"><b>Period:</b> '+esc(period||'—')+'</div></div></section>';
  }
  function reportName(r){return String(r&&(r.nameEn||r.name||r.titleEn||r.title||r.riskIdentified||r.standardDescription||r.specificRequirementDescription||r.requirement||r.description)||'—');}
  function reportStatus(r){return String(r&&(r.status||r.actionStatus||r.complianceStatus||r.executionStatus)||'Unknown');}
  function reportFilter(records,depts,mode){records=Array.isArray(records)?records:[];if(!depts||!depts.length)return records.slice();return records.filter(function(r){return depts.some(function(d){return deptMatch(r,d,mode||'merged');});});}
  function statusNorm(v){return String(v||'Unknown').trim()||'Unknown';}
  function countBy(rows,getter){var out={};(rows||[]).forEach(function(r){var k=statusNorm(getter?getter(r):reportStatus(r));out[k]=(out[k]||0)+1;});return out;}
  function sumValues(obj){return Object.keys(obj||{}).reduce(function(n,k){return n+Number(obj[k]||0);},0);}
  function positiveStatus(v){return /active|valid|available|complete|completed|closed|met|compliant|approved|published/i.test(String(v||''))&&!/not met|non.?compliant|invalid|expired/i.test(String(v||''));}
  function attentionStatus(v){return /expired|invalid|open|pending|high|critical|not met|partial|overdue|failed|rejected/i.test(String(v||''));}
  function metric(label,value,note,tone){return'<article class="grc-exec-metric '+(tone||'')+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note||'')+'</small></article>';}
  function barChart(title,counts,tone,extraClass){var entries=Object.keys(counts||{}).map(function(k){return[k,Number(counts[k]||0)];}).filter(function(x){return x[1]>0;}).sort(function(a,b){return b[1]-a[1];}),max=Math.max(1,...entries.map(function(x){return x[1];}));return'<article class="grc-exec-chart '+(extraClass||'')+' '+(tone||'')+'"><div class="grc-exec-chart-head"><h3>'+esc(title)+'</h3><span>'+sumValues(counts)+' total</span></div><div class="grc-exec-bars">'+(entries.length?entries.slice(0,9).map(function(x){return'<div><label>'+esc(x[0])+'</label><i><b style="width:'+Math.max(4,Math.round(x[1]/max*100))+'%"></b></i><strong>'+x[1]+'</strong></div>';}).join(''):'<p class="grc-exec-empty">No data available for the selected scope.</p>')+'</div></article>';}
  function coloredBarChart(title,counts,colorMap){var entries=Object.keys(counts||{}).map(function(k){return[k,Number(counts[k]||0)];}).filter(function(x){return x[1]>0;}),max=Math.max(1,...entries.map(function(x){return x[1];}));return'<article class="grc-exec-chart"><div class="grc-exec-chart-head"><h3>'+esc(title)+'</h3><span>'+sumValues(counts)+' total</span></div><div class="grc-exec-bars grc-exec-colored-bars">'+(entries.length?entries.map(function(x){var c=colorMap&&colorMap[String(x[0]).toLowerCase()]||'#0195af';return'<div><label><i class="grc-exec-color-dot" style="background:'+c+'"></i>'+esc(x[0])+'</label><i><b style="width:'+Math.max(4,Math.round(x[1]/max*100))+'%;background:'+c+'"></b></i><strong>'+x[1]+'</strong></div>';}).join(''):'<p class="grc-exec-empty">No data available for the selected scope.</p>')+'</div></article>';}
  function emergencyCodeName(r){var raw=String(r&& (r.codeType||r.emergencyCode||r.codeName||r.category)||'Other').trim().toLowerCase();if(raw.indexOf('brown')>=0)return'Brown Code';if(raw.indexOf('orange')>=0)return'Orange Code';if(raw.indexOf('red')>=0)return'Red Code';if(raw.indexOf('blue')>=0)return'Blue Code';if(raw.indexOf('yellow')>=0)return'Yellow Code';if(raw.indexOf('pink')>=0)return'Pink Code';return raw?raw.replace(/\b\w/g,function(c){return c.toUpperCase();}):'Other';}
  function emergencyCodeMetrics(rows){rows=Array.isArray(rows)?rows:[];var real=rows.filter(function(r){return /real/i.test(String(r.type||r.codeMode||''));}).length,drill=rows.filter(function(r){return /drill/i.test(String(r.type||r.codeMode||''));}).length,successful=rows.filter(function(r){return /successful|success|closed/i.test(reportStatus(r));}).length,failed=rows.filter(function(r){return /failed|failure|open/i.test(reportStatus(r));}).length;return{total:rows.length,real:real,drill:drill,successful:successful,failed:failed,failedRate:successful+failed?Math.round(failed/(successful+failed)*100):0};}
  function emergencyColorPanel(number,label,rows,tone,color){var m=emergencyCodeMetrics(rows);return'<div class="grc-exec-subsection grc-exec-code-color-panel" style="--code-color:'+color+'">'+subSectionHead(number,label,'Emergency-code activity, mode and outcome metrics for '+label.toLowerCase()+'.')+overviewBlock([metric('Total Codes',m.total,'Emergency-code records','navy'),metric('Real Code',m.real,'Actual emergency events','purple'),metric('Drill Code',m.drill,'Simulation and drill events','navy'),metric('Successful Code',m.successful,'Successful outcomes','teal'),metric('Failed Code',m.failed,'Failed outcomes','red'),metric('Failed Codes Rate',m.failedRate+'%','Failed ÷ successful and failed','amber')],[donutChart(label+' Mode',{Real:m.real,Drill:m.drill},m.total),donutChart(label+' Outcome',{Successful:m.successful,Failed:m.failed},m.total)])+'</div>';}

  function donutChart(title,segments,center,extraClass){var entries=Object.keys(segments||{}).map(function(k){return[k,Number(segments[k]||0)];}).filter(function(x){return x[1]>0;}),total=entries.reduce(function(n,x){return n+x[1];},0),colors=['#0195af','#153f55','#d89a2b','#7a5aa6','#cf5f69','#52a47c'],cursor=0,parts=[];entries.forEach(function(x,i){var end=total?cursor+(x[1]/total*100):cursor;parts.push(colors[i%colors.length]+' '+cursor.toFixed(2)+'% '+end.toFixed(2)+'%');cursor=end;});return'<article class="grc-exec-chart '+(extraClass||'')+'"><div class="grc-exec-chart-head"><h3>'+esc(title)+'</h3><span>'+total+' total</span></div><div class="grc-exec-donut-wrap"><div class="grc-exec-donut" style="background:conic-gradient('+(parts.length?parts.join(','):'#e7eef1 0 100%')+')"><div><strong>'+esc(center==null?total:center)+'</strong><span>Total</span></div></div><div class="grc-exec-legend">'+(entries.length?entries.map(function(x,i){return'<div><i style="background:'+colors[i%colors.length]+'"></i><span>'+esc(x[0])+'</span><strong>'+x[1]+'</strong></div>';}).join(''):'<p class="grc-exec-empty">No data</p>')+'</div></div></article>';}
  function reportHeatMap(rows){var counts={};(rows||[]).forEach(function(r){var l=Number(r.likelihood),i=Number(r.impact);if(l>=1&&l<=5&&i>=1&&i<=5)counts[l+'-'+i]=(counts[l+'-'+i]||0)+1;});var cells='';for(var l=5;l>=1;l--){for(var i=1;i<=5;i++){var score=l*i,tone=score>=15?'critical':score>=8?'high':score>=4?'medium':'low';cells+='<div class="'+tone+'"><small>'+l+'×'+i+'</small><strong>'+Number(counts[l+'-'+i]||0)+'</strong><span>'+score+'</span></div>';}}return'<article class="grc-exec-chart grc-exec-heat"><div class="grc-exec-chart-head"><h3>Risk Heat Map</h3><span>Likelihood × Impact</span></div><div class="grc-exec-heat-grid">'+cells+'</div><div class="grc-exec-heat-legend"><span class="low">Low 1–3</span><span class="medium">Medium 4–7</span><span class="high">High 8–14</span><span class="critical">Critical 15–25</span></div></article>';}
  function sectionHead(number,title,description,selectedLabels){return'<div class="grc-exec-section-head"><span>'+number+'</span><div><small>'+esc(String(title||'').toUpperCase())+'</small><h2>'+esc(title)+'</h2><p>'+esc(description)+'</p>'+(selectedLabels&&selectedLabels.length?'<div class="grc-exec-tags">'+selectedLabels.map(function(x){return'<b>'+esc(x)+'</b>';}).join('')+'</div>':'')+'</div></div>';}
  function selectedLabels(group,items){return group.items.filter(function(x){return items.indexOf(x[0])>=0;}).map(function(x){return x[1];});}
  function complianceSummary(list){
    list=Array.isArray(list)?list:[];
    var assessed=list.filter(function(r){return String(r&&r.complianceStatus||'').trim();});
    var na=assessed.filter(function(r){return /not applicable/i.test(String(r.complianceStatus||''));}).length;
    var applicable=assessed.filter(function(r){return !/not applicable/i.test(String(r.complianceStatus||''));});
    var met=applicable.filter(function(r){var v=String(r.complianceStatus||'');return /fully met|^met$|compliant/i.test(v)&&!/not met|non.?compliant/i.test(v);}).length;
    var partial=applicable.filter(function(r){return /partial/i.test(String(r.complianceStatus||''));}).length;
    var notMet=Math.max(0,applicable.length-met-partial);
    return{total:assessed.length,applicable:applicable.length,met:met,partial:partial,notMet:notMet,na:na,rate:applicable.length?Math.round(met/applicable.length*100):0};
  }
  function initiativeDepartment(r){return String(r&&r.department||'Unassigned');}
  function reportData(items,depts){var data=snap();return{
    policies:items.indexOf('gov_policies')>=0?reportFilter(data.policies,depts):[],plans:items.indexOf('gov_plans')>=0?reportFilter(data.plans,depts):[],forms:items.indexOf('gov_forms')>=0?reportFilter(data.forms,depts):[],
    risks:items.indexOf('risk_register')>=0?reportFilter(data.risks,depts,'risk-register'):[],incidents:items.indexOf('risk_incidents')>=0?reportFilter(data.incidents,depts):[],codes:items.indexOf('risk_codes')>=0?reportFilter(data.codes,depts):[],
    cbahi:(items.indexOf('cbahi')>=0||items.indexOf('overall')>=0)?((data._cbahiAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);})):[],jci:(items.indexOf('jci')>=0||items.indexOf('overall')>=0)?((data._jciAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);})):[],
    reports:items.indexOf('reports')>=0?(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()!=='guideline';}):[],
    manuals:items.indexOf('manuals')>=0?reportFilter(data.manuals,depts).concat((data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()==='guideline';})):[],
    initiatives:items.indexOf('initiatives')>=0?reportFilter(data.initiatives,depts):[]
  };}
  function subSectionHead(number,title,description){return'<div class="grc-exec-subsection-head"><span>'+esc(number)+'</span><div><h3>'+esc(title)+'</h3><p>'+esc(description||'')+'</p></div></div>';}
  function departmentCounts(rows){return countBy(rows,function(r){return departmentTitle(r&&r.department||r&&r.section||r&&r.ownerDepartment||'Unassigned');});}
  function currentYearDue(rows){var y=new Date().getFullYear();return (rows||[]).filter(function(r){var d=String(r.reviewDate||r.expiryDate||r.dueDate||'');return d.indexOf(String(y))>=0;}).length;}
  function overviewBlock(metrics,charts){return'<div class="grc-exec-overview-block"><div class="grc-exec-metrics">'+metrics.join('')+'</div><div class="grc-exec-chart-grid">'+charts.join('')+'</div></div>';}
  function recordSubsection(number,title,description,rows,options){options=options||{};rows=Array.isArray(rows)?rows:[];var positive=rows.filter(function(r){return positiveStatus(reportStatus(r));}).length,attention=rows.filter(function(r){return attentionStatus(reportStatus(r));}).length,status=countBy(rows),departments=departmentCounts(rows),rate=rows.length?Math.round(positive/rows.length*100):0,metrics=[metric('Total '+title,rows.length,'Records in the selected scope','navy'),metric(options.positiveLabel||'Active / Valid',positive,options.positiveNote||'Records in a positive current status','teal'),metric(options.attentionLabel||'Needs Attention',attention,options.attentionNote||'Expired, pending or invalid records','amber'),metric(options.rateLabel||'Current Rate',rows.length?rate+'%':'—',options.rateNote||'Positive records as a share of total','purple')],charts=[barChart(title+' by Department',departments,'teal'),donutChart(title+' Status',status,rows.length)];if(options.extraMetric)metrics[2]=options.extraMetric(rows);if(options.extraChart)charts[0]=options.extraChart(rows);return'<div class="grc-exec-subsection">'+subSectionHead(number,title,description)+overviewBlock(metrics,charts)+'</div>';}
  function governanceDetailedSubsection(number,title,rows,kind){rows=Array.isArray(rows)?rows:[];var expired=rows.filter(function(r){return /expired|invalid/i.test(reportStatus(r));}),due=rows.filter(function(r){var d=String(r.reviewDate||r.expiryDate||r.dueDate||'');return d.indexOf(String(new Date().getFullYear()))>=0&&!/expired|invalid/i.test(reportStatus(r));}),active=rows.filter(function(r){return positiveStatus(reportStatus(r));}),metrics=[];if(kind==='forms'){metrics=[metric('Total Forms',rows.length,'Forms in the selected scope','navy'),metric('Active Forms',active.length,'Active or valid forms','teal'),metric('Expired Forms',expired.length,'Expired or invalid forms','red')];}else{var singular=kind==='policies'?'Policies':'Plans';metrics=[metric('Total '+singular,rows.length,'Records in the selected scope','navy'),metric(kind==='policies'?'Open Policies':'Active Plans',active.length,'Active, valid or open records','teal'),metric('Expired '+singular,expired.length,'Expired or invalid records','red'),metric('Due This Year',due.length,'Review or expiry date in the current year','amber'),metric('Expired '+(kind==='policies'?'Policy':'Plan')+' Rate',rows.length?Math.round(expired.length/rows.length*100)+'%':'—','Expired records ÷ total','purple')];}return'<div class="grc-exec-subsection">'+subSectionHead(number,title,'Current status, review timing and department distribution for '+title.toLowerCase()+'.')+overviewBlock(metrics,[barChart(title+' by Department',departmentCounts(rows),'teal'),donutChart(title+' Status',countBy(rows),rows.length)])+'</div>';}
  function governanceSection(data,number,labels,items){var all=data.policies.concat(data.plans,data.forms),positive=all.filter(function(r){return positiveStatus(reportStatus(r));}).length,attention=all.filter(function(r){return attentionStatus(reportStatus(r));}).length,types={Policies:data.policies.length,Plans:data.plans.length,Forms:data.forms.length},status=countBy(all),parts=[],sub=1;if(items.indexOf('gov_policies')>=0)parts.push(governanceDetailedSubsection(number+'.'+sub++,'Policies',data.policies,'policies'));if(items.indexOf('gov_plans')>=0)parts.push(governanceDetailedSubsection(number+'.'+sub++,'Plans',data.plans,'plans'));if(items.indexOf('gov_forms')>=0)parts.push(governanceDetailedSubsection(number+'.'+sub++,'Forms',data.forms,'forms'));return'<section class="grc-exec-section">'+sectionHead(number,'Governance','An executive overview of the controlled policies, plans and forms that define and document Facility Management & Safety activities.',labels)+overviewBlock([metric('Governance Records',all.length,'Policies, plans and forms','navy'),metric('Active / Valid',positive,'Records in a positive current status','teal'),metric('Needs Attention',attention,'Expired, pending or invalid records','amber'),metric('Current Rate',all.length?Math.round(positive/all.length*100)+'%':'—','Positive records as a share of total','purple')],[barChart('Governance Records by Type',types,'teal'),donutChart('Overall Governance Status',status,all.length)])+parts.join('')+'</section>';}
  function riskSeverity(rows){var severity={Low:0,Medium:0,High:0,Critical:0};(rows||[]).forEach(function(r){var score=Number(r.riskScore)||Number(r.likelihood||0)*Number(r.impact||0),level=score>=15?'Critical':score>=8?'High':score>=4?'Medium':'Low';severity[level]++;});return severity;}
  function riskSection(data,number,labels,items){
    var severity=riskSeverity(data.risks),openInc=data.incidents.filter(function(r){return !/closed|complete/i.test(reportStatus(r));}).length,critical=severity.Critical,high=severity.High,parts=[],sub=1;
    if(items.indexOf('risk_register')>=0){
      var closedRisks=data.risks.filter(function(r){return /closed|complete|treated/i.test(reportStatus(r));}).length,openRisks=Math.max(0,data.risks.length-closedRisks),highCritical=high+critical;
      parts.push('<div class="grc-exec-subsection">'+subSectionHead(number+'.'+sub++,'Risk Register','The current risk exposure, treatment status and likelihood-impact profile for the selected department scope.')+overviewBlock([
        metric('Total Risks',data.risks.length,'Registered risks','navy'),metric('Open Risks',openRisks,'Risks not closed or completed','red'),metric('Closed Risks',closedRisks,'Closed or treated risks','teal'),metric('Closed Risk Rate',data.risks.length?Math.round(closedRisks/data.risks.length*100)+'%':'—','Closed risks ÷ total','purple'),metric('High & Critical Risks Rate',data.risks.length?Math.round(highCritical/data.risks.length*100)+'%':'—','High and critical risks ÷ total','red'),metric('Critical Risks',critical,'Risk score 15–25','red'),metric('High Risks',high,'Risk score 8–14','amber'),metric('Medium Risks',severity.Medium,'Risk score 4–7','purple'),metric('Low Risks',severity.Low,'Risk score 1–3','teal')
      ],[barChart('Risk Severity Distribution',severity,'risk'),reportHeatMap(data.risks)])+'</div>');
    }
    if(items.indexOf('risk_incidents')>=0){
      var closedInc=data.incidents.filter(function(r){return /closed|complete/i.test(reportStatus(r));}).length,years=countBy(data.incidents,function(r){var d=new Date(r.date||r.incidentDate||r.createdAt||'');return isNaN(d)?'Unknown':String(d.getFullYear());});
      parts.push('<div class="grc-exec-subsection">'+subSectionHead(number+'.'+sub++,'Incident Register','Incident volume, closure status and annual distribution for the selected department scope.')+overviewBlock([
        metric('Total Incidents',data.incidents.length,'Recorded incidents','navy'),metric('Open Incidents',openInc,'Incidents requiring follow-up','amber'),metric('Closed Incidents',closedInc,'Closed incidents','teal'),metric('Closed Incident Rate',data.incidents.length?Math.round(closedInc/data.incidents.length*100)+'%':'—','Closed incidents ÷ total','purple')
      ],[barChart('Incidents by Year',years,'teal'),donutChart('Incident Status',{Open:openInc,Closed:closedInc},data.incidents.length)])+'</div>');
    }
    if(items.indexOf('risk_codes')>=0){
      var m=emergencyCodeMetrics(data.codes),colorRows={'Red Code':[],'Brown Code':[],'Yellow Code':[],'Orange Code':[]};
      data.codes.forEach(function(r){var n=emergencyCodeName(r);if(colorRows[n])colorRows[n].push(r);});
      parts.push('<div class="grc-exec-subsection">'+subSectionHead(number+'.'+sub++,'Emergency Codes','Emergency-code records, activity mode and response outcomes for the selected scope.')+overviewBlock([
        metric('Total Codes',m.total,'Emergency-code records','navy'),metric('Real Code',m.real,'Actual emergency events','purple'),metric('Drill Code',m.drill,'Simulation and drill events','navy'),metric('Successful Code',m.successful,'Successful outcomes','teal'),metric('Failed Code',m.failed,'Failed outcomes','red'),metric('Failed Codes Rate',m.failedRate+'%','Failed ÷ successful and failed','amber')
      ],[coloredBarChart('Emergency Codes by Color',countBy(data.codes,emergencyCodeName),{'red code':'#d94a57','brown code':'#7b4a2f','yellow code':'#e4b929','orange code':'#e88932'}),donutChart('Emergency Code Outcomes',{Successful:m.successful,Failed:m.failed},data.codes.length)])+'</div>');
      var colorIndex=1;
      [['Red Code','#d94a57'],['Brown Code','#7b4a2f'],['Yellow Code','#e4b929'],['Orange Code','#e88932']].forEach(function(x){parts.push(emergencyColorPanel(number+'.'+(sub-1)+'.'+colorIndex++,x[0],colorRows[x[0]],'code',x[1]));});
    }
    return'<section class="grc-exec-section">'+sectionHead(number,'Risk Management','An executive view of risk exposure, incident performance and emergency-code readiness.',labels)+parts.join('')+'</section>';
  }
  function complianceSubsection(number,title,s,rows,includePartial){var status={Met:s.met};if(includePartial!==false)status.Partial=s.partial;status['Not Met']=s.notMet;status['Not Applicable']=s.na;var metrics=[metric('Total Requirements',s.total,'Assessed requirements','navy'),metric('Fully Met',s.met,'Fully met requirements','teal')];if(includePartial!==false)metrics.push(metric('Partially Met',s.partial,'Partially met requirements','amber'));metrics.push(metric('Not Met',s.notMet,'Requirements not met','red'),metric('Not Applicable',s.na,'Excluded from compliance rate','navy'),metric('Compliance Rate',s.rate+'%','Fully met ÷ applicable requirements','purple'));return'<div class="grc-exec-subsection">'+subSectionHead(number,title,'Assessment status and compliance performance for '+title+'.')+overviewBlock(metrics,[barChart(title+' Status',status,'teal'),barChart(title+' by Department',departmentCounts(rows),'navy')])+'</div>';}

  function complianceSection(data,number,labels,items){
    var c=complianceSummary(data.cbahi),j=complianceSummary(data.jci),app=c.applicable+j.applicable,met=c.met+j.met,partial=c.partial+j.partial,notMet=c.notMet+j.notMet,na=c.na+j.na,overall=app?Math.round(met/app*100):0,parts=[],sub=1;
    if(items.indexOf('cbahi')>=0)parts.push(complianceSubsection(number+'.'+sub++,'CBAHI Assessment',c,data.cbahi,true));
    if(items.indexOf('jci')>=0)parts.push(complianceSubsection(number+'.'+sub++,'JCI Assessment',j,data.jci,false));
    return'<section class="grc-exec-section">'+sectionHead(number,'Compliance','A consolidated executive view of CBAHI and JCI assessment performance. Not Applicable and blank rows are excluded from rate calculations.',labels)+overviewBlock([
      metric('Total Authorities',2,'CBAHI and JCI','navy'),metric('Total Requirements',c.total+j.total,'Assessed requirements','purple'),metric('Fully Met',met,'Fully met requirements','teal'),metric('Partially Met',partial,'Partially met requirements','amber'),metric('Not Met',notMet,'Requirements not met','red'),metric('Not Applicable',na,'Excluded from rate calculations','navy'),metric('Overall Compliance Rate',overall+'%','Fully met ÷ applicable requirements','purple')
    ],[barChart('Compliance Rate by Authority',{CBAHI:c.rate,JCI:j.rate},'teal'),donutChart('Combined Assessment Outcomes',{Met:met,Partial:partial,'Not Met':notMet,'Not Applicable':na},c.total+j.total)])+parts.join('')+'</section>';
  }
  function executiveReportStatsForReport(rows){var now=new Date(),current=now.getFullYear(),completedQuarter=Math.floor((now.getMonth()+1)/3),uploaded=(rows||[]).filter(function(r){return /annual|quarter/i.test(String(r.group||r.family||r.type||''));});function typeOf(r){var raw=String(r.type||r.family||r.kind||'').toLowerCase(),exec=/executive/.test(raw+String(r.name||r.title||'').toLowerCase()),annual=/annual/.test(raw);return annual?(exec?'annualExecutive':'annualReport'):(exec?'quarterlyExecutive':'quarterlyReport');}function has(type,year,q){return uploaded.some(function(r){return typeOf(r)===type&&Number(r.year)===Number(year)&&Number(r.quarter||0)===Number(q||0);});}var expected=[];uploaded.forEach(function(r){if(Number(r.year)<2026)expected.push({type:typeOf(r),year:Number(r.year),quarter:Number(r.quarter||0),available:true});});for(var y=2026;y<=current;y++){var last=y<current?4:completedQuarter;for(var q=1;q<=last;q++){expected.push({type:'quarterlyReport',year:y,quarter:q,available:has('quarterlyReport',y,q)});expected.push({type:'quarterlyExecutive',year:y,quarter:q,available:has('quarterlyExecutive',y,q)});}if(y<current){expected.push({type:'annualReport',year:y,quarter:0,available:has('annualReport',y,0)});expected.push({type:'annualExecutive',year:y,quarter:0,available:has('annualExecutive',y,0)});}}uploaded.forEach(function(r){var t=typeOf(r),yr=Number(r.year),q=Number(r.quarter||0);if(!expected.some(function(x){return x.type===t&&x.year===yr&&x.quarter===q;}))expected.push({type:t,year:yr,quarter:q,available:true});});function count(t){return expected.filter(function(x){return x.type===t&&x.available;}).length;}return{total:expected.length,available:expected.filter(function(x){return x.available;}).length,unavailable:expected.filter(function(x){return !x.available;}).length,quarterly:count('quarterlyReport'),quarterlyExecutive:count('quarterlyExecutive'),annual:count('annualReport'),annualExecutive:count('annualExecutive')};}
  function reportsSection(data,number,labels){var st=executiveReportStatsForReport(data.reports);return'<section class="grc-exec-section">'+sectionHead(number,'Reports','An executive overview of Facility Management & Safety report availability by report family.',labels)+overviewBlock([
    metric('Total Reports',st.total,'Expected report documents','navy'),metric('Quarterly Documents',st.quarterly,'Available quarterly reports','teal'),metric('Quarterly Executive Summary',st.quarterlyExecutive,'Available quarterly executive summaries','purple'),metric('Annual FMS Report',st.annual,'Available annual division reports','amber'),metric('Annual Executive Summary',st.annualExecutive,'Available annual executive summaries','navy')
  ],[barChart('Reports by Type',{'Quarterly Documents':st.quarterly,'Quarterly Executive Summary':st.quarterlyExecutive,'Annual FMS Report':st.annual,'Annual Executive Summary':st.annualExecutive},'teal'),donutChart('Reports Availability',{Available:st.available,Unavailable:st.unavailable},st.total)])+'</section>';}

  function manualsSection(data,number,labels){var rows=data.manuals||[],keys={},validKeys={},versions={};rows.forEach(function(r){var k=String(r.guideKey||r.code||r.titleEn||r.title||r.name||r.id||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');if(k)keys[k]=1;versions[String(r.versionLabel||r.version||'1.0')]=1;if(k&&/valid|active|available|published/i.test(reportStatus(r)))validKeys[k]=1;});var total=Object.keys(keys).length||rows.length,valid=Object.keys(validKeys).length,unavailable=Math.max(0,total-valid);return'<section class="grc-exec-section">'+sectionHead(number,'Manuals & Guidelines','An executive overview of controlled manuals and guidance documents supporting consistent operational practice.',labels)+overviewBlock([
    metric('Total Manuals',total,'Controlled manuals and guidelines','navy'),metric('Valid',valid,'Valid or available manuals','teal'),metric('Unavailable',unavailable,'Unavailable or invalid manuals','red'),metric('Versions',Object.keys(versions).length,'Distinct document versions','purple')
  ],[barChart('Manual Availability',{Valid:valid,Unavailable:unavailable},'teal'),donutChart('Documents by Language',countBy(rows,function(r){var l=String(r.language||'').toLowerCase();return l==='ar'?'Arabic':l==='en'?'English':'Not Specified';}),rows.length)])+'</section>';}

  function initiativeMembers(r){var a=[];if(Array.isArray(r&&r.team))a=a.concat(r.team);if(Array.isArray(r&&r.members))a=a.concat(r.members);if(Array.isArray(r&&r.teamMembers))a=a.concat(r.teamMembers);for(var i=1;i<=10;i++){if(r&&r['member'+i])a.push(r['member'+i]);}return a.filter(Boolean);}
  function initiativesSection(data,number,labels){
    var rows=data.initiatives||[],selected=rows.filter(function(r){return /selected|approved/i.test(reportStatus(r))||r.selected===true;}).length,proposed=rows.filter(function(r){return /proposed/i.test(reportStatus(r));}).length,done=rows.filter(function(r){return Number(r.progress||0)>=100||/done|complete|completed|closed/i.test(String(r.executionStatus||reportStatus(r)));}).length,inProgress=Math.max(0,selected-done),avg=selected?Math.round(rows.filter(function(r){return /selected|approved/i.test(reportStatus(r))||r.selected===true;}).reduce(function(n,r){return n+Number(r.progress||0);},0)/selected):0;
    var gender={Male:0,Female:0},deptParticipants={Maintenance:0,Safety:0,Housekeeping:0,'Project Management':0,'FMS Division':0},totalParticipants=0;
    rows.forEach(function(r){var members=initiativeMembers(r),fallback=Number(r.participants||r.participantCount||0);if(!members.length&&fallback){totalParticipants+=fallback;var rd=departmentTitle(r.department||'allFms');deptParticipants[rd]=(deptParticipants[rd]||0)+fallback;}members.forEach(function(m){totalParticipants++;var g=String(m.gender||'').toLowerCase();if(g==='female')gender.Female++;else if(g==='male')gender.Male++;var raw=normalizeDept(m.department||r.department||'');var d=raw==='maintenance'?'Maintenance':raw==='safety'?'Safety':(raw==='housekeeping'||raw==='laundry')?'Housekeeping':raw.indexOf('project')>=0?'Project Management':'FMS Division';deptParticipants[d]=(deptParticipants[d]||0)+1;});});
    var initiativeStatus={Proposed:proposed,Selected:selected},participantMetrics=[metric('Total Participants',totalParticipants,'Recorded participants','navy'),metric('Female',gender.Female,'Female participants','purple'),metric('Male',gender.Male,'Male participants','teal')];Object.keys(deptParticipants).forEach(function(d){participantMetrics.push(metric(d,deptParticipants[d],'Participants','navy'));});
    return'<section class="grc-exec-section">'+sectionHead(number,'Initiatives','An executive overview of improvement initiatives, implementation progress and participation across Facility Management & Safety departments.',labels)+
      '<div class="grc-exec-subsection">'+subSectionHead(number+'.1','Participants','Participant distribution by gender and department.')+overviewBlock(participantMetrics,[barChart('Participants by Department',deptParticipants,'teal','grc-exec-participant-chart'),donutChart('Participants by Gender',gender,totalParticipants,'grc-exec-participant-chart')])+'</div>'+
      '<div class="grc-exec-subsection">'+subSectionHead(number+'.2','Initiatives','Proposed, selected and implementation progress of improvement initiatives.')+overviewBlock([
        metric('Total Initiatives',rows.length,'Registered initiatives','navy'),metric('Proposed Initiatives',proposed,'Proposed initiatives','amber'),metric('Selected Initiatives',selected,'Selected initiatives','teal'),metric('Done',done,'Completed selected initiatives','teal'),metric('In Progress',inProgress,'Selected initiatives in progress','amber'),metric('Completion Rate',avg+'%','Average progress of selected initiatives','purple')
      ],[donutChart('Initiative Status',initiativeStatus,rows.length),barChart('Initiatives by Department',departmentCounts(rows),'teal')])+'</div></section>';
  }
  function buildExecutiveReport(items,depts){var data=reportData(items,depts),date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}),doc=document.createElement('div'),sections=[],n=1;
    REPORT_GROUPS.forEach(function(group){var labels=selectedLabels(group,items);if(!labels.length)return;if(group.id==='governance')sections.push(governanceSection(data,n++,labels,items));else if(group.id==='risk')sections.push(riskSection(data,n++,labels,items));else if(group.id==='compliance')sections.push(complianceSection(data,n++,labels,items));else if(group.id==='reports')sections.push(reportsSection(data,n++,labels));else if(group.id==='manuals')sections.push(manualsSection(data,n++,labels));else if(group.id==='initiatives')sections.push(initiativesSection(data,n++,labels));});
    var totalGovernance=data.policies.length+data.plans.length+data.forms.length,totalRisk=data.risks.length,totalOperational=data.reports.length+data.manuals.length+data.initiatives.length,comp=complianceSummary(data.cbahi.concat(data.jci));
    doc.id='rptDocument';doc.className='grc-executive-summary-report';doc.innerHTML='<div class="grc-exec-report">'+reportHeader('GRC Executive Summary','Facility Management & Safety Division',date,departmentText(depts))+'<main class="grc-exec-report-body"><section class="grc-exec-overview"><div><small>EXECUTIVE OVERVIEW</small><h2>Governance, Risk &amp; Compliance at a Glance</h2><p>This report consolidates the selected platform indicators into one executive summary. Each domain begins with an overview, followed by the selected components and their dedicated indicators and charts.</p></div><div class="grc-exec-overview-grid">'+metric('Governance Records',totalGovernance,'Policies, plans and forms','navy')+metric('Registered Risks',totalRisk,'Current risk register','amber')+metric('Compliance Rate',comp.rate+'%','Combined applicable CBAHI and JCI items','teal')+metric('Supporting Outputs',totalOperational,'Reports, manuals and initiatives','purple')+'</div></section>'+sections.join('')+'</main>'+reportFooter(date)+reportPrintInformation(departmentText(depts)+' · '+date)+'</div>';
    var style=document.createElement('style');style.textContent=`
@media print{@page{size:A4 portrait;margin:8mm}.grc-exec-section{break-before:auto}.grc-exec-section:first-of-type{break-before:auto}.grc-exec-chart,.grc-exec-metric,.grc-exec-section-head,.grc-exec-subsection-head{break-inside:avoid}.grc-exec-subsection{break-inside:auto;page-break-inside:auto}.grc-exec-report-header,.grc-exec-report-footer{break-inside:avoid}}
#rptDocument{font-family:Arial,"Segoe UI",sans-serif;color:#152538;background:#fff;width:100%!important;min-width:0!important;max-width:none!important;min-height:297mm!important;margin:0!important}.grc-exec-report{background:#fff;width:100%!important;min-width:0!important;max-width:none!important;min-height:297mm!important;margin:0!important}.grc-exec-report-header{display:flex;align-items:center;gap:22px;padding:18px 26px 15px;background:#152538;color:#fff;border-radius:10px 10px 0 0}.grc-exec-logo img{height:62px;max-width:170px;object-fit:contain}.grc-exec-heading{flex:1;border-left:2px solid rgba(1,181,210,.6);padding-left:20px}.grc-exec-heading>span{display:block;font-size:9px;font-weight:900;letter-spacing:.16em;color:#01c0dc}.grc-exec-heading h1{margin:4px 0;font-size:24px;color:#fff}.grc-exec-heading p{margin:0 0 8px;font-size:11px;color:rgba(255,255,255,.82)}.grc-exec-heading>div{display:flex;gap:9px;font-size:9px;color:#01c0dc}.grc-exec-header-line{height:5px;background:linear-gradient(90deg,#0195af,#01c5e8 45%,#152538)}.grc-exec-report-body{padding:16px 18px 18px}.grc-exec-overview{padding:16px;border:1px solid #d8e6ea;border-radius:12px;background:linear-gradient(135deg,#f4fafb,#fff);margin-bottom:16px}.grc-exec-overview small,.grc-exec-section-head small{font-size:8px;font-weight:900;letter-spacing:.13em;color:#0195af}.grc-exec-overview h2{margin:5px 0 6px;font-size:23px}.grc-exec-overview p,.grc-exec-section-head p,.grc-exec-subsection-head p{margin:0;color:#647a87;font-size:10px;line-height:1.55}.grc-exec-overview-grid,.grc-exec-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(48mm,1fr));gap:11px;margin-top:13px}.grc-exec-section{padding:14px 0 7px;width:100%;box-sizing:border-box}.grc-exec-section-head{display:flex;gap:13px;align-items:flex-start;padding:12px 14px;border:1px solid #d9e6ea;border-left:6px solid #0195af;border-radius:10px;background:#f8fbfc}.grc-exec-section-head>span{display:grid;place-items:center;flex:0 0 44px;height:44px;border-radius:9px;background:#152538;color:#fff;font-size:19px;font-weight:900}.grc-exec-section-head h2{margin:2px 0 5px;font-size:18px}.grc-exec-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.grc-exec-tags b{padding:4px 8px;border-radius:999px;background:#e9f5f7;color:#087a90;font-size:8px}.grc-exec-overview-block{margin-top:12px}.grc-exec-subsection{margin-top:16px;padding:13px;border:1px solid #dbe7eb;border-radius:12px;background:#fff}.grc-exec-subsection-head{display:flex;align-items:flex-start;gap:10px;padding-bottom:9px;border-bottom:1px solid #e2ecef}.grc-exec-subsection-head>span{display:grid;place-items:center;min-width:42px;height:30px;padding:0 8px;border-radius:8px;background:#e7f5f7;color:#087a90;font-size:11px;font-weight:900}.grc-exec-subsection-head h3{margin:1px 0 3px;font-size:14px;color:#153f55}.grc-exec-metric{border:1px solid #dbe7eb;border-top:4px solid #153f55;border-radius:10px;padding:11px 12px;background:#fff;min-height:66px}.grc-exec-metric.teal{border-top-color:#0195af}.grc-exec-metric.amber{border-top-color:#d89a2b}.grc-exec-metric.purple{border-top-color:#7a5aa6}.grc-exec-metric.red{border-top-color:#cf5f69}.grc-exec-metric span{display:block;font-size:11px;font-weight:800;color:#617987}.grc-exec-metric strong{display:block;margin:4px 0;font-size:28px;color:#153f55}.grc-exec-metric small{font-size:10px;color:#82939d}.grc-exec-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:11px}.grc-exec-chart-grid-wide{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}.grc-exec-chart{border:1px solid #dbe7eb;border-radius:11px;padding:12px 14px;background:#fbfdfe;min-height:148px}.grc-exec-chart-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.grc-exec-chart-head h3{margin:0;font-size:14px;color:#153f55}.grc-exec-chart-head span{font-size:8px;color:#7c909b}.grc-exec-bars{display:grid;gap:7px}.grc-exec-bars>div{display:grid;grid-template-columns:125px 1fr 30px;gap:8px;align-items:center}.grc-exec-bars label{font-size:10px;color:#4c6573;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.grc-exec-bars i{height:9px;background:#e7eff2;border-radius:999px;overflow:hidden}.grc-exec-bars i b{display:block;height:100%;background:linear-gradient(90deg,#0195af,#00bfd5);border-radius:999px}.grc-exec-bars strong{font-size:9px;text-align:right}.grc-exec-donut-wrap{display:grid;grid-template-columns:118px 1fr;gap:16px;align-items:center}.grc-exec-donut{width:124px;height:124px;border-radius:50%;display:grid;place-items:center}.grc-exec-donut>div{width:76px;height:76px;border-radius:50%;background:#fff;display:grid;place-items:center;align-content:center;box-shadow:inset 0 0 0 1px #dce8eb}.grc-exec-donut strong{font-size:23px}.grc-exec-donut span{font-size:8px;color:#718691}.grc-exec-legend{display:grid;gap:6px}.grc-exec-legend>div{display:grid;grid-template-columns:10px 1fr 30px;gap:7px;align-items:center;font-size:9px}.grc-exec-legend i{width:9px;height:9px;border-radius:3px}.grc-exec-legend strong{text-align:right}.grc-exec-heat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.grc-exec-heat-grid>div{min-height:35px;border-radius:6px;padding:5px;display:grid;grid-template-columns:1fr auto;align-items:center}.grc-exec-heat-grid .low{background:#a8d7c4}.grc-exec-heat-grid .medium{background:#f1dc85}.grc-exec-heat-grid .high{background:#efaa73}.grc-exec-heat-grid .critical{background:#d96d73;color:#fff}.grc-exec-heat-grid small,.grc-exec-heat-grid span{font-size:7px}.grc-exec-heat-grid strong{font-size:11px}.grc-exec-heat-legend{display:flex;gap:7px;margin-top:8px}.grc-exec-heat-legend span{padding:4px 8px;border-radius:999px;font-size:7px}.grc-exec-heat-legend .low{background:#a8d7c4}.grc-exec-heat-legend .medium{background:#f1dc85}.grc-exec-heat-legend .high{background:#efaa73}.grc-exec-heat-legend .critical{background:#d96d73;color:#fff}.grc-exec-empty{font-size:9px;color:#7a8e99}.grc-exec-report-footer{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:#152538;color:#fff;border-radius:0 0 10px 10px}.grc-exec-report-footer div{display:flex;flex-direction:column;gap:3px}.grc-exec-report-footer strong,.grc-exec-report-footer b{font-size:10px}.grc-exec-report-footer span,.grc-exec-report-footer small{font-size:8px;color:rgba(255,255,255,.72)}.grc-exec-print-info{margin:14px 20px 18px;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#152538;break-inside:avoid;page-break-inside:avoid;box-sizing:border-box}.grc-exec-print-info h3{margin:0 0 9px;padding:0 0 8px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:900;color:#0b1c33}.grc-exec-print-info-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px 22px;font-size:9.5px;line-height:1.55}.grc-exec-print-info-grid b,.grc-exec-print-info-grid strong{font-weight:900;color:#0b1c33}.grc-exec-print-info-grid span{margin-left:6px;font-weight:600;color:#64748b}.grc-exec-print-period{grid-column:1/-1}.grc-exec-colored-bars label{display:flex;align-items:center;gap:7px}.grc-exec-color-dot{display:inline-block!important;width:9px!important;height:9px!important;border-radius:50%!important;flex:0 0 9px!important}.grc-exec-code-color-panel{border-top:5px solid var(--code-color)!important}.grc-exec-code-color-panel .grc-exec-subsection-head>span{background:var(--code-color)!important;color:#fff!important}.grc-exec-section,.grc-exec-subsection,.grc-exec-chart,.grc-exec-metric{box-sizing:border-box}.grc-exec-section-head,.grc-exec-subsection-head,.grc-exec-metric,.grc-exec-chart{break-inside:avoid;page-break-inside:avoid}#qumcPrintReportPage,#qumcPrintReportPage .qumc-print-report-sheet{background:#fff!important;transform:none!important;zoom:1!important}.grc-exec-report-body{width:100%;box-sizing:border-box}.grc-exec-overview-grid,.grc-exec-metrics{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.grc-exec-metric{width:100%!important;min-height:88px!important;padding:15px 16px!important}.grc-exec-metric span{font-size:13px!important}.grc-exec-metric strong{font-size:34px!important;margin:6px 0!important}.grc-exec-metric small{font-size:11px!important;line-height:1.35!important}.grc-exec-chart-grid{width:100%!important;gap:14px!important}.grc-exec-chart{width:100%!important;min-height:188px!important;padding:16px 18px!important}.grc-exec-chart-head h3{font-size:16px!important}.grc-exec-chart-head span{font-size:10px!important}.grc-exec-bars{gap:9px!important}.grc-exec-bars>div{grid-template-columns:150px 1fr 36px!important;gap:10px!important}.grc-exec-bars label{font-size:12px!important}.grc-exec-bars i{height:11px!important}.grc-exec-bars strong{font-size:11px!important}.grc-exec-donut-wrap{grid-template-columns:150px 1fr!important;gap:20px!important}.grc-exec-donut{width:148px!important;height:148px!important}.grc-exec-donut>div{width:92px!important;height:92px!important}.grc-exec-donut strong{font-size:28px!important}.grc-exec-donut span{font-size:10px!important}.grc-exec-legend>div{grid-template-columns:12px 1fr 36px!important;font-size:11px!important}.grc-exec-legend i{width:11px!important;height:11px!important}.grc-exec-subsection,.grc-exec-overview,.grc-exec-section-head{width:100%!important}.grc-exec-report-body{padding:18px 22px 22px!important}@media print{#qumcPrintReportPage{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;padding:0!important;margin:0!important;box-sizing:border-box!important;background:#fff!important}#qumcPrintReportPage .qumc-print-report-sheet,#qumcPrintReportPage #rptDocument,#qumcPrintReportPage .grc-exec-report{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;box-sizing:border-box!important;background:#fff!important}}
`;
    /* v104: keep every report heading with the first content that belongs to it.
       This prevents a subsection heading from being stranded at the bottom of a
       portrait page while its metrics/charts start on the next page. */
    style.textContent += `
@media print{
  .grc-exec-section-head,
  .grc-exec-subsection-head{
    break-after:avoid-page!important;
    page-break-after:avoid!important;
  }
  .grc-exec-subsection-head + .grc-exec-overview-block,
  .grc-exec-section-head + .grc-exec-subsection,
  .grc-exec-section-head + .grc-exec-overview-block{
    break-before:avoid-page!important;
    page-break-before:avoid!important;
  }
  .grc-exec-subsection-head + .grc-exec-overview-block .grc-exec-metrics{
    break-before:avoid-page!important;
    page-break-before:avoid!important;
  }
  .grc-exec-section,
  .grc-exec-subsection{
    orphans:3!important;
    widows:3!important;
  }
  /* Chrome/PDF can move an entire CSS grid to the next page, leaving the
     subsection title by itself. Use printable inline blocks so metric/chart
     rows may paginate naturally while each card remains intact. */
  .grc-exec-overview-block{
    break-inside:auto!important;
    page-break-inside:auto!important;
  }
  .grc-exec-metrics,
  .grc-exec-chart-grid{
    display:block!important;
    font-size:0!important;
    width:100%!important;
  }
  .grc-exec-metric,
  .grc-exec-chart{
    display:inline-block!important;
    vertical-align:top!important;
    width:calc(50% - 6px)!important;
    margin:0 12px 12px 0!important;
    break-inside:avoid-page!important;
    page-break-inside:avoid!important;
  }
  .grc-exec-metric:nth-child(even),
  .grc-exec-chart:nth-child(even){
    margin-right:0!important;
  }
}`;
    /* v106 — portrait report visual polish: equal participant chart cards,
       compact border-free subsections, and full-width aligned overview cards. */
    style.textContent += `
.grc-exec-subsection{
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  padding:0!important;
  margin-top:16px!important;
}
.grc-exec-subsection-head{padding:0 0 9px!important;}
.grc-exec-overview-grid{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:12px!important;
  align-items:stretch!important;
}
.grc-exec-overview-grid>.grc-exec-metric{
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  width:100%!important;
  min-width:0!important;
  min-height:104px!important;
  margin:0!important;
}
.grc-exec-chart-grid{align-items:stretch!important;}
.grc-exec-participant-chart{
  height:220px!important;
  min-height:220px!important;
  max-height:220px!important;
  overflow:hidden!important;
}
.grc-exec-participant-chart .grc-exec-bars{min-height:148px!important;align-content:center!important;}
.grc-exec-participant-chart .grc-exec-donut-wrap{height:158px!important;align-items:center!important;}
@media print{
  .grc-exec-overview-grid>.grc-exec-metric{
    display:flex!important;
    width:100%!important;
    margin:0!important;
  }
  .grc-exec-participant-chart{
    display:inline-block!important;
    vertical-align:top!important;
    width:calc(50% - 6px)!important;
    height:220px!important;
    min-height:220px!important;
    max-height:220px!important;
  }
}
`;
    /* v109 — unify every GRC report chart with the compact participant-chart layout.
       All chart cards use the same dimensions, title/total alignment, internal
       spacing, bar density and donut proportions so paired charts stay balanced. */
    style.textContent += `
.grc-exec-chart-grid{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  align-items:stretch!important;
  gap:12px!important;
}
.grc-exec-chart{
  height:220px!important;
  min-height:220px!important;
  max-height:220px!important;
  padding:13px 14px!important;
  border:1px solid #d7e5ea!important;
  border-radius:11px!important;
  background:#fbfdfe!important;
  overflow:hidden!important;
  display:flex!important;
  flex-direction:column!important;
  box-sizing:border-box!important;
}
.grc-exec-chart-head{
  min-height:24px!important;
  margin-bottom:8px!important;
  flex:0 0 auto!important;
}
.grc-exec-chart-head h3{
  font-size:13px!important;
  line-height:1.2!important;
  color:#153f55!important;
}
.grc-exec-chart-head span{
  font-size:8px!important;
  line-height:1!important;
  white-space:nowrap!important;
}
.grc-exec-bars{
  flex:1 1 auto!important;
  min-height:0!important;
  display:grid!important;
  align-content:center!important;
  gap:5px!important;
}
.grc-exec-bars>div{
  grid-template-columns:minmax(88px,128px) 1fr 24px!important;
  gap:7px!important;
  min-height:14px!important;
}
.grc-exec-bars label{
  font-size:9px!important;
  line-height:1.15!important;
}
.grc-exec-bars i{
  height:8px!important;
}
.grc-exec-bars strong{
  font-size:9px!important;
}
.grc-exec-donut-wrap{
  flex:1 1 auto!important;
  min-height:0!important;
  height:auto!important;
  display:grid!important;
  grid-template-columns:118px minmax(0,1fr)!important;
  gap:14px!important;
  align-items:center!important;
  justify-content:center!important;
}
.grc-exec-donut{
  width:118px!important;
  height:118px!important;
  margin:auto!important;
}
.grc-exec-donut>div{
  width:72px!important;
  height:72px!important;
}
.grc-exec-donut strong{font-size:22px!important;}
.grc-exec-donut span{font-size:8px!important;}
.grc-exec-legend{
  align-content:center!important;
  gap:5px!important;
  min-width:0!important;
}
.grc-exec-legend>div{
  grid-template-columns:9px minmax(0,1fr) 25px!important;
  gap:6px!important;
  font-size:9px!important;
}
.grc-exec-legend i{width:9px!important;height:9px!important;}
.grc-exec-heat{
  justify-content:flex-start!important;
}
.grc-exec-heat-grid{
  flex:1 1 auto!important;
  min-height:0!important;
  align-content:center!important;
  gap:4px!important;
}
.grc-exec-heat-grid>div{
  min-height:27px!important;
  padding:4px!important;
}
.grc-exec-heat-legend{
  flex:0 0 auto!important;
  margin-top:6px!important;
  flex-wrap:wrap!important;
}
/* participant pair now simply inherits the same universal chart sizing */
.grc-exec-participant-chart{
  height:220px!important;
  min-height:220px!important;
  max-height:220px!important;
}
.grc-exec-participant-chart .grc-exec-bars{min-height:0!important;}
.grc-exec-participant-chart .grc-exec-donut-wrap{height:auto!important;}
@media print{
  .grc-exec-chart-grid{
    display:block!important;
    font-size:0!important;
    width:100%!important;
  }
  .grc-exec-chart{
    display:inline-flex!important;
    vertical-align:top!important;
    width:calc(50% - 6px)!important;
    height:220px!important;
    min-height:220px!important;
    max-height:220px!important;
    margin:0 12px 12px 0!important;
    break-inside:avoid-page!important;
    page-break-inside:avoid!important;
  }
  .grc-exec-chart:nth-child(even){margin-right:0!important;}
}
`;
    /* v119 — use the portrait page more efficiently. Single charts and odd
       metric cards span the row, while paired cards keep the compact balanced
       layout. This reduces unused white space without changing report content. */
    style.textContent += `
.grc-exec-metric{min-height:106px!important;}
.grc-exec-chart{height:236px!important;min-height:236px!important;max-height:236px!important;}
.grc-exec-chart-grid>.grc-exec-chart:only-child{grid-column:1/-1!important;width:100%!important;}
.grc-exec-metrics>.grc-exec-metric:last-child:nth-child(odd){grid-column:1/-1!important;}
.grc-exec-overview-grid>.grc-exec-metric{min-height:116px!important;}
.grc-exec-subsection{margin-top:12px!important;}
.grc-exec-overview-block{margin-top:10px!important;}
@media print{
  .grc-exec-chart{height:236px!important;min-height:236px!important;max-height:236px!important;}
  .grc-exec-chart-grid>.grc-exec-chart:only-child{display:flex!important;width:100%!important;margin-right:0!important;}
  .grc-exec-metrics>.grc-exec-metric:last-child:nth-child(odd){display:flex!important;width:100%!important;margin-right:0!important;}
  .grc-exec-overview-grid>.grc-exec-metric{min-height:116px!important;}
}
`;
    doc.appendChild(style);return doc;}

  function cleanupGrcReportPrint(){
    try{document.body.classList.remove('qumc-print-report-only','grc-print-report-only');}catch(_e){}
    try{document.documentElement.classList.remove('qumc-print-report-only','grc-print-report-only');}catch(_e){}
    var holder=document.getElementById('qumcPrintReportPage');if(holder)holder.remove();
  }
  function printGrcReportDocument(doc,options){
    try{
      cleanupGrcReportPrint();
      var st=document.getElementById('grc-report-direct-print-css');
      if(st)st.remove();
      st=document.createElement('style');
      st.id='grc-report-direct-print-css';
      st.textContent='@media screen{#qumcPrintReportPage{position:fixed!important;left:-100000px!important;top:0!important;width:210mm!important;min-width:210mm!important;visibility:hidden!important;pointer-events:none!important;background:#fff!important}}@media print{@page{size:210mm 297mm!important;margin:0!important}html.grc-print-report-only,body.grc-print-report-only{width:210mm!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body.grc-print-report-only>:not(#qumcPrintReportPage){display:none!important}#qumcPrintReportPage{display:block!important;position:static!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;background:#fff!important;visibility:visible!important;overflow:visible!important;box-sizing:border-box!important}#qumcPrintReportPage .qumc-print-report-sheet,#qumcPrintReportPage #rptDocument,#qumcPrintReportPage .grc-exec-report{display:block!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;background:#fff!important;transform:none!important;zoom:1!important;box-sizing:border-box!important;overflow:visible!important}}';
      document.head.appendChild(st);
      var holder=document.createElement('div');holder.id='qumcPrintReportPage';
      var sheet=document.createElement('div');sheet.className='qumc-print-report-sheet';
      if(doc&&typeof doc.cloneNode==='function')sheet.appendChild(doc.cloneNode(true));else sheet.innerHTML=String(doc||'');
      holder.appendChild(sheet);document.body.appendChild(holder);
      document.body.classList.add('qumc-print-report-only','grc-print-report-only');
      document.documentElement.classList.add('qumc-print-report-only','grc-print-report-only');
      var cleaned=false,done=function(){if(cleaned)return;cleaned=true;window.removeEventListener('afterprint',done);setTimeout(cleanupGrcReportPrint,40);};
      window.addEventListener('afterprint',done);
      setTimeout(function(){try{window.print();}catch(err){done();throw err;}},180);
      setTimeout(done,60000);
      return true;
    }catch(err){cleanupGrcReportPrint();try{console.error('[GRC Report] print preparation failed',err);}catch(_e){}return false;}
  }

  window._grcGenerateReport=async function(){var items=checked('grcReportItem'),depts=REPORT_FIXED_DEPTS.length?REPORT_FIXED_DEPTS:checked('grcReportDept'),ownDept=reportUserDept();if(!reportCanViewAllDepartments()){if(!ownDept){alert('No department is assigned to this account.');return;}depts=[ownDept];}if(!items.length){alert('Select at least one report content option.');return;}if(!depts.length){alert('Select at least one department.');return;}var doc=buildExecutiveReport(items,depts);closeOverlay();var period=(depts.length===DEPTS.length?'All Departments':depts.map(departmentTitle).join(', '))+' · '+new Date().toLocaleDateString('en-GB'),ok=false;try{if(typeof window._qumcPrintReportDocument==='function')ok=window._qumcPrintReportDocument(doc,{period:'GRC Executive Summary · '+period,orientation:'portrait'});}catch(_printErr){ok=false;}if(!ok)ok=printGrcReportDocument(doc,{period:'GRC Executive Summary · '+period,orientation:'portrait'});if(ok){var ps=document.getElementById('grc-a4-portrait-override');if(ps)ps.remove();ps=document.createElement('style');ps.id='grc-a4-portrait-override';ps.textContent='@media print{@page{size:210mm 297mm!important;margin:0!important}html,body{width:210mm!important;margin:0!important;padding:0!important;background:#fff!important}#qumcPrintReportPage{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;padding:0!important;margin:0!important;background:#fff!important;display:block!important;box-sizing:border-box!important}#qumcPrintReportPage .qumc-print-report-sheet,#qumcPrintReportPage #rptDocument,#qumcPrintReportPage .grc-exec-report{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;transform:none!important;zoom:1!important;background:#fff!important;box-sizing:border-box!important}}@media screen{#qumcPrintReportPage{width:210mm!important;min-width:210mm!important;max-width:210mm!important;padding:0!important;margin:0!important;background:#fff!important;box-sizing:border-box!important}#qumcPrintReportPage .qumc-print-report-sheet,#qumcPrintReportPage #rptDocument,#qumcPrintReportPage .grc-exec-report{width:210mm!important;min-width:210mm!important;max-width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;transform:none!important;zoom:1!important;background:#fff!important;box-sizing:border-box!important}}';document.head.appendChild(ps);}if(!ok){alert('Unable to prepare the GRC report for printing. Reload the page and try again.');return;}if(typeof window.addAudit==='function')window.addAudit('GRC_REPORT_PDF','Generated GRC executive summary: '+items.join(', '));};

  window._grcToggleExportMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('grcExportMenu');if(m)m.classList.toggle('is-open');};
  document.addEventListener('click',function(e){var m=document.getElementById('grcExportMenu');if(m&&!e.target.closest('.grc-export-menu-wrap'))m.classList.remove('is-open');});
  function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
  async function buildAllPrintHost(ids){var app=document.getElementById('grcApp'),host=document.getElementById('grcNativeExportHost');if(host)host.remove();host=document.createElement('div');host.id='grcNativeExportHost';host.className='grc-native-export-host';for(var i=0;i<ids.length;i++){if(typeof window._grcSwitch==='function')window._grcSwitch(ids[i]);await wait(520);var live=document.getElementById('grc-page-'+ids[i]);if(!live)continue;var clone=cloneRenderedNode(live);freezeRenderedLayout(live,clone);cleanPrintNode(clone);clone.classList.add('is-active','grc-native-export-sheet');clone.setAttribute('data-grc-export-sheet',ids[i]);clone.style.display='block';host.appendChild(clone);}app.appendChild(host);return host;}
  function cleanupNativeExport(returnPage){document.body.classList.remove('grc-native-export','grc-native-export-all');document.body.removeAttribute('data-grc-export-page');var h=document.getElementById('grcNativeExportHost');if(h)h.remove();if(returnPage&&typeof window._grcSwitch==='function')window._grcSwitch(returnPage);}
  window._grcExportPage=async function(id){var menu=document.getElementById('grcExportMenu');if(menu)menu.classList.remove('is-open');var current=(document.querySelector('#grcApp .grc-page.is-active')||{}).id.replace(/^grc-page-/,'')||'executive';try{var ids=id==='all'?modules().map(function(x){return x.id;}):[id];await buildAllPrintHost(ids);document.body.classList.add('grc-native-export-all');document.body.setAttribute('data-grc-export-page',id);var done=function(){window.removeEventListener('afterprint',done);cleanupNativeExport(current);};window.addEventListener('afterprint',done);setTimeout(function(){window.print();},120);setTimeout(function(){if(document.body.classList.contains('grc-native-export')||document.body.classList.contains('grc-native-export-all'))cleanupNativeExport(current);},15000);if(typeof window.addAudit==='function')window.addAudit('GRC_PAGE_EXPORT','Exported GRC page: '+id);}catch(e){cleanupNativeExport(current);alert('Export failed: '+String(e&&e.message||e));}};
})();
