/* ======================================================================
   QUMC GRC — Excel / Report / Page Export
   Build: 2026-07-28 v74 registers, professional report and page export
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
    if(mergeLaundry){
      if(ids.indexOf('laundry')>=0&&ids.indexOf('housekeeping')<0)ids.push('housekeeping');
      ids=ids.filter(function(x){return x!=='laundry';});
    }
    return ids.filter(function(x,i,a){return a.indexOf(x)===i;});
  }
  function departmentTitle(id){var x=DEPTS.find(function(d){return d[0]===id;});return x?x[1]:id;}
  function deptMatch(r,dept,mode){
    r=r||{};var rd=normalizeDept(r.department||r.dept||r.responsibleDept||r.responsibleDepartment),hay=recordText(r);
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
    if(!raw)return true;
    var n=normalizeDept(raw),hay=raw.toLowerCase();
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
    {id:'governance',title:'Governance',items:[['gov_policies','Policy Register'],['gov_plans','Plan Register'],['gov_forms','Form Register']]},
    {id:'risk',title:'Risk Management',items:[['risk_register','Risk Register'],['risk_incidents','Incident Register'],['risk_codes','Emergency Codes']]},
    {id:'compliance',title:'Compliance',items:[['overall','Overall Compliance'],['cbahi','CBAHI Assessment'],['jci','JCI Assessment']]},
    {id:'operational_plan',title:'Operational Plan',items:[['operational_plan','Operational Plan']]},
    {id:'reports',title:'Reports',items:[['reports','Reports Register']]},
    {id:'manuals',title:'Manuals & Guidelines',items:[['manuals','Manuals & Guidelines Register']]},
    {id:'initiatives',title:'Initiatives',items:[['initiatives','Initiatives Register']]}
  ];
  var REPORT_FIXED_DEPTS=[];
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
    var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input data-grc-excel-selectable type="checkbox" name="grcExcelDept" value="'+d[0]+'" checked onchange="window._grcSyncExcelAll()"><span>'+d[1]+'</span></label>';}).join('');
    var groups=REGISTER_GROUPS.map(registerGroupHtml).join('');
    var body='<label class="grc-export-select-all"><input id="grcExcelSelectAll" type="checkbox" checked onchange="window._grcToggleExcelAll(this.checked)"><span><b>Select All Options</b><small>Select or clear every department and register.</small></span></label><div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div><div class="grc-export-section"><h3>Registers</h3><p class="grc-export-help">Open a compact dropdown and choose one or more register tables.</p><div class="grc-export-dropdown-grid">'+groups+'</div></div>';
    overlay('GRC Excel Export','Choose departments and register tables. Every selected table is exported from its register data.',body,'Generate Excel','window._grcGenerateExcel()');
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
    var depts=checked('grcExcelDept'),selected=checked('grcExcelRegister');
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
  function reportUserDept(){var d='';try{d=typeof window._grcGetCurrentDepartment==='function'?window._grcGetCurrentDepartment():window._fbDept||window.currentUserDept||'';}catch(_){}d=String(d||'').toLowerCase();if(d.indexOf('safe')>=0)return'safety';if(d.indexOf('maint')>=0)return'maintenance';if(d.indexOf('laund')>=0)return'laundry';if(d.indexOf('house')>=0)return'housekeeping';if(d.indexOf('project')>=0)return'projects';return'allFms';}
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
    REPORT_FIXED_DEPTS=reportCanViewAllDepartments()?[]:[reportUserDept()];var deptSection='';
    if(reportCanViewAllDepartments()){var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input data-grc-report-selectable type="checkbox" name="grcReportDept" value="'+d[0]+'" checked onchange="window._grcSyncReportAll()"><span>'+d[1]+'</span></label>';}).join('');deptSection='<div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div>';}
    var body='<label class="grc-export-select-all"><input id="grcReportSelectAll" type="checkbox" checked onchange="window._grcToggleReportAll(this.checked)"><span><b>Select All Options</b><small>Select or clear every available department and report section.</small></span></label>'+deptSection+'<div class="grc-export-section"><h3>Report Content</h3><p class="grc-export-help">Each section below becomes a professionally formatted report section.</p><div class="grc-export-dropdown-grid">'+REPORT_GROUPS.map(reportGroupHtml).join('')+'</div></div>';
    overlay('GRC Report','Choose the departments and the exact registers or assessments to include.',body,'Build Report','window._grcGenerateReport()');
  };
  function logoSrc(){return((document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg')||{}).src||'');}
  function reportHeader(title,subtitle,date,context){var logo=logoSrc();return'<div class="qumc-report-header grc-report-header"><div class="grc-report-logo">'+(logo?'<img src="'+esc(logo)+'" alt="QUMC">':'')+'</div><div class="grc-report-heading"><p>OFFICIAL GOVERNANCE, RISK &amp; COMPLIANCE REPORT</p><h1>'+esc(title)+'</h1><h2>'+esc(subtitle)+'</h2><div><span>'+esc(date)+'</span><i>·</i><span>'+esc(context)+'</span></div></div></div><div class="qumc-report-header-line"></div>';}
  function reportFooter(date){return'<div class="grc-rpt-footer"><div><strong>Qassim University Medical City</strong><span>Facility Management &amp; Safety Division · Governance &amp; Performance</span></div><small>Generated: '+esc(date)+'</small></div>';}
  function reportName(r){return String(r&& (r.nameEn||r.name||r.titleEn||r.title||r.riskIdentified||r.standardDescription||r.specificRequirementDescription||r.requirement||r.description)||'—');}
  function reportStatus(r){return String(r&& (r.status||r.actionStatus||r.complianceStatus||r.executionStatus)||'Unknown');}
  function reportDate(v){if(!v)return'—';var d=new Date(String(v).length===10?v+'T00:00:00':v);return isNaN(d.getTime())?String(v):d.toLocaleDateString('en-GB');}
  function reportFilter(records,depts,mode){records=Array.isArray(records)?records:[];if(!depts||!depts.length)return records.slice();return records.filter(function(r){return depts.some(function(d){return deptMatch(r,d,mode||'merged');});});}
  function reportStatusCounts(rows){var map={};rows.forEach(function(r){var k=reportStatus(r)||'Unknown';map[k]=(map[k]||0)+1;});return map;}
  function reportMetric(label,value,note,tone){return'<article class="grc-rpt-metric '+(tone||'')+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note||'')+'</small></article>';}
  function reportBars(title,counts){var entries=Object.keys(counts).map(function(k){return[k,counts[k]];}).sort(function(a,b){return b[1]-a[1];}),max=Math.max(1,...entries.map(function(x){return x[1];}));return'<section class="grc-rpt-chart"><h3>'+esc(title)+'</h3><div class="grc-rpt-bars">'+(entries.length?entries.slice(0,8).map(function(x,i){return'<div><span>'+esc(x[0])+'</span><i><b style="width:'+Math.max(4,Math.round(x[1]/max*100))+'%"></b></i><strong>'+x[1]+'</strong></div>';}).join(''):'<p>No data available.</p>')+'</div></section>';}
  function reportTable(title,columns,rows){return'<section class="grc-rpt-table-card"><h3>'+esc(title)+'</h3><table><thead><tr>'+columns.map(function(c){return'<th>'+esc(c)+'</th>';}).join('')+'</tr></thead><tbody>'+(rows.length?rows.map(function(row){return'<tr>'+row.map(function(v){return'<td>'+esc(v==null?'—':v)+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="'+columns.length+'" class="empty">No matching records.</td></tr>')+'</tbody></table></section>';}
  function chunkRows(rows,size){var out=[];for(var i=0;i<rows.length;i+=size)out.push(rows.slice(i,i+size));return out.length?out:[[]];}
  function reportHeatMap(rows){var counts={};rows.forEach(function(r){var l=Number(r.likelihood),i=Number(r.impact);if(l>=1&&l<=5&&i>=1&&i<=5)counts[l+'-'+i]=(counts[l+'-'+i]||0)+1;});var cells='';for(var l=5;l>=1;l--){for(var i=1;i<=5;i++){var score=l*i,tone=score>=15?'critical':score>=8?'high':score>=4?'medium':'low';cells+='<div class="'+tone+'"><span>'+l+'×'+i+'</span><strong>'+Number(counts[l+'-'+i]||0)+'</strong><small>'+score+'</small></div>';}}return'<section class="grc-rpt-heat"><h3>Risk Heat Map</h3><div class="grc-rpt-heat-grid">'+cells+'</div><div class="grc-rpt-heat-legend"><span class="low">Low 1–3</span><span class="medium">Medium 4–7</span><span class="high">High 8–14</span><span class="critical">Critical 15–25</span></div></section>';}
  var REPORT_META={
    gov_policies:{domain:1,domainTitle:'Governance',sub:'1.1',title:'Policy Register'},gov_plans:{domain:1,domainTitle:'Governance',sub:'1.2',title:'Plan Register'},gov_forms:{domain:1,domainTitle:'Governance',sub:'1.3',title:'Form Register'},
    risk_register:{domain:2,domainTitle:'Risk Management',sub:'2.1',title:'Risk Register'},risk_incidents:{domain:2,domainTitle:'Risk Management',sub:'2.2',title:'Incident Register'},risk_codes:{domain:2,domainTitle:'Risk Management',sub:'2.3',title:'Emergency Codes'},
    overall:{domain:3,domainTitle:'Compliance',sub:'3.1',title:'Overall Compliance'},cbahi:{domain:3,domainTitle:'Compliance',sub:'3.2',title:'CBAHI Assessment'},jci:{domain:3,domainTitle:'Compliance',sub:'3.3',title:'JCI Assessment'},
    operational_plan:{domain:4,domainTitle:'Operational Plan',sub:'4.1',title:'Operational Plan'},reports:{domain:5,domainTitle:'Reports',sub:'5.1',title:'Reports Register'},manuals:{domain:6,domainTitle:'Manuals & Guidelines',sub:'6.1',title:'Manuals & Guidelines Register'},initiatives:{domain:7,domainTitle:'Initiatives',sub:'7.1',title:'Initiatives Register'}
  };
  function reportDataset(item,data,depts){var rows=[],columns=[],raw=[],chartCounts={},extras='';
    if(item==='gov_policies'){raw=reportFilter(data.policies,depts);columns=['Code','Policy','Department','Issue Date','Review Date','Status'];rows=raw.map(function(r){return[r.code||r.id,reportName(r),r.department,reportDate(r.issueDate),reportDate(r.reviewDate||r.expiryDate),reportStatus(r)];});}
    else if(item==='gov_plans'){raw=reportFilter(data.plans,depts);columns=['Code','Plan','Department','Start Date','End / Review Date','Status'];rows=raw.map(function(r){return[r.code||r.id,reportName(r),r.department,reportDate(r.startDate||r.issueDate),reportDate(r.endDate||r.reviewDate||r.expiryDate),reportStatus(r)];});}
    else if(item==='gov_forms'){raw=reportFilter(data.forms,depts);columns=['Code','Form','Scope','Department','Status'];rows=raw.map(function(r){return[r.code||r.id,reportName(r),r.scope||r.formScope||'Internal',r.department,reportStatus(r)];});}
    else if(item==='risk_register'){raw=reportFilter(data.risks,depts,'risk-register');columns=['ID','Risk','Department','Category','Likelihood','Impact','Score','Level','Status'];rows=raw.map(function(r){var score=Number(r.riskScore)||Number(r.likelihood||0)*Number(r.impact||0);return[r.id||r.code,reportName(r),r.department,r.riskCategory,Number(r.likelihood||0),Number(r.impact||0),score,r.riskLevel,r.actionStatus||r.status];});extras=reportHeatMap(raw);}
    else if(item==='risk_incidents'){raw=reportFilter(data.incidents,depts);columns=['ID','Date','Category','Contributing Factors','Department','Investigation','Status'];rows=raw.map(function(r){return[r.id||r.code,reportDate(r.date||r.incidentDate),r.category,r.contributingFactors,r.department||r.responsibleDept,r.investigationRequired,reportStatus(r)];});}
    else if(item==='risk_codes'){raw=reportFilter(data.codes,depts);columns=['Code','Emergency Code','Department','Type','Date','Location','Status'];rows=raw.map(function(r){return[r.id||r.code,reportName(r),r.department,r.type||r.category,reportDate(r.date||r.eventDate),r.location,reportStatus(r)];});}
    else if(item==='cbahi'||item==='jci'){raw=(item==='cbahi'?data._cbahiAssessment:data._jciAssessment)||[];raw=raw.filter(function(r){return complianceDeptMatch(r,depts);});columns=['Standard','Requirement','Department','Compliance Status','Score','Due Date'];rows=raw.map(function(r){return[[r.standard,r.subStandard,r.specificRequirement].filter(Boolean).join(' / '),r.specificRequirementDescription||r.standardDescription,r.responsibleDepartment,r.complianceStatus,r.score,reportDate(r.dueDate)];});}
    else if(item==='overall'){var c=((data._cbahiAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);})),j=((data._jciAssessment||[]).filter(function(r){return complianceDeptMatch(r,depts);}));function summary(authority,list){var applicable=list.filter(function(r){return String(r.complianceStatus||'').trim()&&String(r.complianceStatus||'').toLowerCase()!=='not applicable';}),met=applicable.filter(function(r){return /fully met|met|compliant/i.test(String(r.complianceStatus||''))&&!/not met/i.test(String(r.complianceStatus||''));}).length,rate=applicable.length?Math.round(met/applicable.length*100):0;return[authority,list.length,applicable.length,met,applicable.length-met,rate+'%'];}raw=c.concat(j);columns=['Authority','Total','Applicable','Met','Not Met / Partial','Compliance Rate'];rows=[summary('CBAHI',c),summary('JCI',j)];}
    else if(item==='operational_plan'){raw=(data._operationalPlans||[]).filter(function(r){return r.scope==='division'||depts.indexOf(String(r.department||'').toLowerCase())>=0;});columns=['Year','Scope','Department','Plan','Pages','Status'];rows=raw.map(function(r){return[r.year,r.scope,r.department||'Division',r.titleEn||r.titleAr||('Operational Plan '+r.year),r.pages||'—',r.status||'Available'];});}
    else if(item==='reports'){raw=(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()!=='guideline';});columns=['Code','Report','Family','Year','Quarter','Status'];rows=raw.map(function(r){return[r.code||r.id,r.titleEn||r.title||r.name,r.family,r.year,r.quarter,r.status||'Available'];});}
    else if(item==='manuals'){var manuals=reportFilter(data.manuals,depts),guides=(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()==='guideline';});raw=manuals.concat(guides);columns=['Code','Manual / Guideline','Type','Language','Version','Status'];rows=manuals.map(function(r){return[r.code||r.id,reportName(r),'Manual',r.language,r.version,reportStatus(r)];}).concat(guides.map(function(r){return[r.code||r.id,r.titleEn||r.title||r.name,'Guideline',r.language,r.version,r.status||'Available'];}));}
    else if(item==='initiatives'){raw=reportFilter(data.initiatives,depts);columns=['Code','Initiative','Department','Team Members','Status','Progress'];rows=raw.map(function(r){return[r.code||r.id,reportName(r),r.department,(r.team||[]).map(function(m){return m.name||m.nameEn||m.email;}).filter(Boolean).join(', ')||r.owner||'—',reportStatus(r),(Number(r.progress)||0)+'%'];});}
    chartCounts=reportStatusCounts(raw);return{raw:raw,columns:columns,rows:rows,counts:chartCounts,extras:extras};
  }
  function reportPage(meta,content,depts,date,pageIndex,totalPages,continuation){var total=content.raw.length,completed=content.raw.filter(function(r){return /active|valid|complete|completed|closed|available|met|compliant/i.test(reportStatus(r))&&!/not met/i.test(reportStatus(r));}).length,attention=content.raw.filter(function(r){return /expired|invalid|open|pending|high|critical|not met|partial/i.test(reportStatus(r));}).length,rate=total?Math.round(completed/total*100):0;var metrics='<div class="grc-rpt-metrics">'+reportMetric('Total Records',total,'Current register records','navy')+reportMetric('Positive / Completed',completed,'Based on current status','teal')+reportMetric('Needs Attention',attention,'Open, overdue or non-compliant','amber')+reportMetric('Completion Rate',rate+'%','Calculated from current data','purple')+'</div>';var tableChunks=chunkRows(content.rows,10),chunk=tableChunks[pageIndex]||[],pageTitle=continuation?meta.title+' — Continued':meta.title;return'<section class="grc-rpt-page">'+reportHeader('GRC Report','Facility Management & Safety Division',date,departmentText(depts))+'<div class="grc-rpt-body"><div class="grc-rpt-domain"><span>'+meta.domain+'</span><div><small>SECTION '+String(meta.domain).padStart(2,'0')+'</small><h2>'+esc(meta.domainTitle)+'</h2></div></div><div class="grc-rpt-subhead"><b>'+meta.sub+'</b><div><h3>'+esc(pageTitle)+'</h3><p>Data source: live platform register · Page '+(pageIndex+1)+' of '+totalPages+'</p></div></div>'+(pageIndex===0?metrics+'<div class="grc-rpt-visuals">'+reportBars('Status Distribution',content.counts)+(content.extras||'')+'</div>':'')+reportTable(meta.title+(continuation?' — Continued':''),content.columns,chunk)+'</div>'+reportFooter(date)+'</section>';}
  function buildProfessionalReport(items,depts){var data=snap(),date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}),doc=document.createElement('div');doc.id='rptDocument';doc.className='grc-official-report grc-professional-v74';var html='';items.forEach(function(item){var meta=REPORT_META[item];if(!meta)return;var content=reportDataset(item,data,depts),chunks=chunkRows(content.rows,10);chunks.forEach(function(_,i){html+=reportPage(meta,content,depts,date,i,chunks.length,i>0);});});doc.innerHTML=html;var style=document.createElement('style');style.textContent=`
@media print{@page{size:A4 landscape;margin:0}.grc-rpt-page{page-break-after:always;break-after:page}.grc-rpt-page:last-child{page-break-after:auto}}
#rptDocument{font-family:Arial,"Segoe UI",sans-serif;color:#152538;background:#fff}.grc-rpt-page{width:100%;min-height:190mm;box-sizing:border-box;background:#fff;display:flex;flex-direction:column;overflow:hidden}.grc-report-header{display:flex;align-items:center;gap:18px;padding:15px 24px 12px;background:#152538;color:#fff}.grc-report-logo img{height:52px;max-width:145px;object-fit:contain}.grc-report-heading{flex:1;border-left:2px solid rgba(1,181,210,.55);padding-left:17px}.grc-report-heading p{margin:0 0 3px;font-size:7px;font-weight:900;color:#01b5d2;letter-spacing:.17em}.grc-report-heading h1{margin:0 0 2px;font-size:18px;color:#fff}.grc-report-heading h2{margin:0 0 6px;font-size:9px;font-weight:500;color:rgba(255,255,255,.78)}.grc-report-heading>div{display:flex;gap:9px;font-size:7px;font-weight:700;color:#01b5d2}.qumc-report-header-line{height:3px;background:linear-gradient(90deg,#0195af,#01c5e8 45%,#152538)}.grc-rpt-body{flex:1;padding:11px 16px 10px;display:flex;flex-direction:column;gap:9px}.grc-rpt-domain{display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:9px;background:linear-gradient(90deg,#edf7f9,#fff);border:1px solid #d6e6ea;border-left:5px solid #0195af}.grc-rpt-domain>span{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:#152538;color:#fff;font-size:14px;font-weight:900}.grc-rpt-domain small{display:block;color:#0195af;font-size:6.5px;font-weight:900;letter-spacing:.12em}.grc-rpt-domain h2{margin:2px 0 0;font-size:14px}.grc-rpt-subhead{display:flex;align-items:center;gap:9px}.grc-rpt-subhead>b{display:grid;place-items:center;min-width:38px;height:25px;border-radius:7px;background:#0195af;color:#fff;font-size:8px}.grc-rpt-subhead h3{margin:0;font-size:11px}.grc-rpt-subhead p{margin:2px 0 0;font-size:6.8px;color:#6c8290}.grc-rpt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.grc-rpt-metric{border:1px solid #dbe7eb;border-top:3px solid #294b5f;border-radius:9px;padding:8px 10px;background:#fff}.grc-rpt-metric.teal{border-top-color:#0195af}.grc-rpt-metric.amber{border-top-color:#d79524}.grc-rpt-metric.purple{border-top-color:#8161aa}.grc-rpt-metric span{display:block;font-size:6.8px;font-weight:800;color:#607785}.grc-rpt-metric strong{display:block;margin:3px 0;font-size:17px;color:#173f55}.grc-rpt-metric small{font-size:6px;color:#82939d}.grc-rpt-visuals{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:9px;align-items:stretch}.grc-rpt-chart,.grc-rpt-heat{border:1px solid #dbe7eb;border-radius:9px;padding:8px 10px;background:#fbfdfe;min-height:104px}.grc-rpt-chart h3,.grc-rpt-heat h3,.grc-rpt-table-card h3{margin:0 0 7px;font-size:8px;color:#173f55}.grc-rpt-bars{display:grid;gap:5px}.grc-rpt-bars>div{display:grid;grid-template-columns:110px 1fr 24px;gap:6px;align-items:center;font-size:6.5px}.grc-rpt-bars i{display:block;height:7px;border-radius:999px;background:#e6eff2;overflow:hidden}.grc-rpt-bars i b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#0195af,#00bfd5)}.grc-rpt-bars strong{text-align:right;font-size:7px}.grc-rpt-heat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}.grc-rpt-heat-grid>div{min-height:27px;border-radius:5px;padding:3px;display:grid;grid-template-columns:1fr auto;align-items:center;color:#173f55}.grc-rpt-heat-grid .low{background:#a8d7c4}.grc-rpt-heat-grid .medium{background:#f1dc85}.grc-rpt-heat-grid .high{background:#efaa73}.grc-rpt-heat-grid .critical{background:#d96d73;color:#fff}.grc-rpt-heat-grid span,.grc-rpt-heat-grid small{font-size:5px}.grc-rpt-heat-grid strong{font-size:8px}.grc-rpt-heat-legend{display:flex;gap:5px;margin-top:5px}.grc-rpt-heat-legend span{padding:3px 6px;border-radius:999px;font-size:5.5px}.grc-rpt-heat-legend .low{background:#a8d7c4}.grc-rpt-heat-legend .medium{background:#f1dc85}.grc-rpt-heat-legend .high{background:#efaa73}.grc-rpt-heat-legend .critical{background:#d96d73;color:#fff}.grc-rpt-table-card{border:1px solid #dbe7eb;border-radius:9px;padding:8px;background:#fff;break-inside:avoid;overflow:hidden}.grc-rpt-table-card table{width:100%;border-collapse:collapse;table-layout:fixed}.grc-rpt-table-card th{background:#173f55;color:#fff;padding:5px 6px;font-size:6.4px;text-align:left}.grc-rpt-table-card td{padding:4px 6px;border-bottom:1px solid #e6edf0;font-size:6.1px;line-height:1.25;word-break:break-word}.grc-rpt-table-card tr:nth-child(even) td{background:#f8fbfc}.grc-rpt-table-card td.empty{text-align:center;color:#748895;padding:18px}.grc-rpt-footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding:8px 15px;background:#152538;color:#fff}.grc-rpt-footer div{display:flex;flex-direction:column;gap:2px}.grc-rpt-footer strong{font-size:7.5px}.grc-rpt-footer span,.grc-rpt-footer small{font-size:6px;color:rgba(255,255,255,.7)}
`;doc.appendChild(style);return doc;}
  window._grcGenerateReport=async function(){var items=checked('grcReportItem'),depts=REPORT_FIXED_DEPTS.length?REPORT_FIXED_DEPTS:checked('grcReportDept');if(!items.length){alert('Select at least one report content option.');return;}if(!depts.length){alert('Select at least one department.');return;}var doc=buildProfessionalReport(items,depts);closeOverlay();var period=(depts.length===DEPTS.length?'All Departments':depts.map(departmentTitle).join(', '))+' · '+new Date().toLocaleDateString('en-GB'),ok=typeof window._qumcPrintReportDocument==='function'&&window._qumcPrintReportDocument(doc,{period:'GRC Report · '+period,orientation:'landscape'});if(!ok){alert('The Performance report print engine is not ready. Reload the page and try again.');return;}if(typeof window.addAudit==='function')window.addAudit('GRC_REPORT_PDF','Generated GRC report: '+items.join(', '));};

  window._grcToggleExportMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('grcExportMenu');if(m)m.classList.toggle('is-open');};
  document.addEventListener('click',function(e){var m=document.getElementById('grcExportMenu');if(m&&!e.target.closest('.grc-export-menu-wrap'))m.classList.remove('is-open');});
  function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
  async function buildAllPrintHost(ids){var app=document.getElementById('grcApp'),host=document.getElementById('grcNativeExportHost');if(host)host.remove();host=document.createElement('div');host.id='grcNativeExportHost';host.className='grc-native-export-host';for(var i=0;i<ids.length;i++){if(typeof window._grcSwitch==='function')window._grcSwitch(ids[i]);await wait(520);var live=document.getElementById('grc-page-'+ids[i]);if(!live)continue;var clone=cloneRenderedNode(live);freezeRenderedLayout(live,clone);cleanPrintNode(clone);clone.classList.add('is-active','grc-native-export-sheet');clone.setAttribute('data-grc-export-sheet',ids[i]);clone.style.display='block';host.appendChild(clone);}app.appendChild(host);return host;}
  function cleanupNativeExport(returnPage){document.body.classList.remove('grc-native-export','grc-native-export-all');document.body.removeAttribute('data-grc-export-page');var h=document.getElementById('grcNativeExportHost');if(h)h.remove();if(returnPage&&typeof window._grcSwitch==='function')window._grcSwitch(returnPage);}
  window._grcExportPage=async function(id){var menu=document.getElementById('grcExportMenu');if(menu)menu.classList.remove('is-open');var current=(document.querySelector('#grcApp .grc-page.is-active')||{}).id.replace(/^grc-page-/,'')||'executive';try{var ids=id==='all'?modules().map(function(x){return x.id;}):[id];await buildAllPrintHost(ids);document.body.classList.add('grc-native-export-all');document.body.setAttribute('data-grc-export-page',id);var done=function(){window.removeEventListener('afterprint',done);cleanupNativeExport(current);};window.addEventListener('afterprint',done);setTimeout(function(){window.print();},120);setTimeout(function(){if(document.body.classList.contains('grc-native-export')||document.body.classList.contains('grc-native-export-all'))cleanupNativeExport(current);},15000);if(typeof window.addAudit==='function')window.addAudit('GRC_PAGE_EXPORT','Exported GRC page: '+id);}catch(e){cleanupNativeExport(current);alert('Export failed: '+String(e&&e.message||e));}};
})();
