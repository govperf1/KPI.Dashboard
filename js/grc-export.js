/* ======================================================================
   QUMC GRC — Excel / Report / Page Export
   Build: 2026-07-27 v64 register selector, professional report and page export
   ====================================================================== */
(function(){
  'use strict';

  var PAGE_LABELS={
    executive:'Executive Command',governance:'Governance',risk:'Risk Management',register:'Registers',
    compliance:'Compliance',actions:'Action Plans',reports:'Reports',
    manuals:'FMS Manual',advisory:'Review & Guidance Center'
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
    {id:'resources',title:'Operational & Resource Registers',items:[['actions','Action Plans'],['initiatives','Initiatives Register'],['reports','Reports Register'],['manuals','Manuals Register'],['guides','Guidelines Register']]},
    {id:'compliance',title:'Compliance Assessments',items:[['cbahi','CBAHI Assessment'],['jci','JCI Assessment']]}
  ];
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
    }else if(id==='manuals'){
      source=filtered('manuals');columns=['Code','Manual','Language','Version','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,r.language,r.version,r.status]);});
    }else if(id==='guides'){
      source=(data._reports||[]).filter(function(r){return String(r.kind||r.type||'').toLowerCase()==='guideline';});columns=['Code','Guideline','Language','Version','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.titleEn||r.title||r.name,r.language,r.version,r.status||'Available']);});
    }else if(id==='initiatives'){
      source=filtered('initiatives');columns=['Code','Initiative','Department','Owner','Status','Progress'];source.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,r.department,r.owner||r.responsiblePerson,r.status,r.progress]);});
    }else{columns=['Information'];rows=[['No register dataset is configured for this page.']];}
    var titles={actions:'Action Plans',initiatives:'Initiatives Register',reports:'Reports Register',manuals:'Manuals Register',guides:'Guidelines Register'};return{title:titles[id]||PAGE_LABELS[id]||id,kind:'flat',columns:columns,rows:rows};
  }
  function rowsForPage(id,data,depts,selections){
    if(id==='governance')return governanceSet(data,depts,selections.governance);
    if(id==='risk')return riskSet(data,depts,selections.risk);
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
    var data=snap(),sets=[],gov=selected.filter(function(x){return['policies','forms','plans'].indexOf(x)>=0;}),risk=selected.filter(function(x){return['risks','incidents','codes'].indexOf(x)>=0;}),compliance=selected.filter(function(x){return['cbahi','jci'].indexOf(x)>=0;});
    if(gov.length){var g=governanceSet(data,depts,gov);g.title='Governance Registers';sets.push(g);}
    if(risk.length){var r=riskSet(data,depts,risk);r.title='Risk Management Registers';sets.push(r);}
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
  window._grcOpenReportSelector=async function(){
    var page=await ensureExecutiveRendered();REPORT_PARTS=executiveReportParts(page);
    var opts=REPORT_PARTS.map(function(p,i){return'<label class="grc-export-check"><input type="checkbox" name="grcReportSection" value="'+i+'" checked><span>'+esc((i+1)+'. '+p.title)+'</span></label>';}).join('');
    if(!opts)opts='<div style="padding:12px;color:#8A4650">No Executive Command sections were found. Reload the page and try again.</div>';
    overlay('GRC Executive Command Report','Choose the GRC sections to include. The report begins with Governance and uses the same official Performance report frame, header and footer.','<div class="grc-export-section"><h3>Report Sections</h3><div class="grc-export-check-grid">'+opts+'</div></div>','Build Report','window._grcGenerateReport()');
  };
  function subsectionCandidates(node){
    var all=Array.prototype.slice.call(node.querySelectorAll('.grc-section-title,.grc-exec-ops-head h3'));
    return all.filter(function(h){
      return !h.closest('.grc-chart-card,.grc-metric-card,.grc-exec-domain-head,.grc-table-wrap,thead,tbody')&&String(h.textContent||'').trim();
    });
  }
  function numberSubsections(node,mainNo){
    subsectionCandidates(node).forEach(function(h,i){
      var text=String(h.textContent||'').replace(/^\s*\d+(?:\.\d+)*[.\s-]*/,'').trim();
      h.textContent='';h.classList.add('grc-report-numbered-title');
      var no=document.createElement('span');no.className='grc-report-subnumber';no.textContent=mainNo+'.'+(i+1);
      var label=document.createElement('span');label.className='grc-report-subtitle-text';label.textContent=text;
      h.appendChild(no);h.appendChild(label);
    });
  }
  function prepareReportDomain(part,index){
    var node=part.node.cloneNode(true),oldHead=node.querySelector('.grc-exec-domain-head'),desc=oldHead&&oldHead.querySelector('p')&&oldHead.querySelector('p').textContent||'';
    if(oldHead)oldHead.remove();
    node.querySelectorAll('.grc-export-frozen-box').forEach(function(x){x.classList.remove('grc-export-frozen-box');x.style.removeProperty('--grc-freeze-minh');x.style.minHeight='0';});
    node.querySelectorAll('[style*="min-height"]').forEach(function(x){x.style.minHeight='0';});
    numberSubsections(node,index);
    node.classList.add('grc-report-domain');
    var head=document.createElement('div');head.className='grc-report-section-head';head.innerHTML='<span>'+index+'</span><div><h2>'+esc(part.title)+'</h2>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div>';
    node.insertBefore(head,node.firstChild);
    return node;
  }
  function logoSrc(){return((document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg')||{}).src||'');}
  function reportHeader(title,subtitle,date,context){
    var logo=logoSrc();return'<div class="qumc-report-header grc-report-header"><div class="grc-report-logo">'+(logo?'<img src="'+esc(logo)+'" alt="QUMC">':'')+'</div><div class="grc-report-heading"><p>OFFICIAL GOVERNANCE, RISK &amp; COMPLIANCE REPORT</p><h1>'+esc(title)+'</h1><h2>'+esc(subtitle)+'</h2><div><span>'+esc(date)+'</span><i>·</i><span>'+esc(context)+'</span></div></div></div><div class="qumc-report-header-line"></div>';
  }
  function buildReportDocument(chosen){
    var doc=document.createElement('div');doc.id='rptDocument';doc.className='grc-official-report grc-professional-report';
    var date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}),selected=chosen.map(function(i){return REPORT_PARTS[i];}).filter(Boolean);
    doc.innerHTML=reportHeader('GRC Executive Command Report','Facility Management & Safety Division',date,'Executive Command');
    var body=document.createElement('div');body.className='grc-report-content';
    var intro=document.createElement('section');intro.className='grc-report-overview';intro.innerHTML='<div><span>REPORT SCOPE</span><h2>Governance, Risk and Compliance Executive Overview</h2><p>This report presents the selected Executive Command domains using the current platform data. Each main domain begins on a clear report section, with numbered internal register headings and unnumbered charts.</p></div><div class="grc-report-overview-metrics"><article><b>'+selected.length+'</b><span>Included Sections</span></article><article><b>'+esc(date)+'</b><span>Generated Date</span></article></div>';
    /* compact official report: no separate overview cover */
    var contents=document.createElement('section');contents.className='grc-report-contents';contents.innerHTML='<h3>Report Contents</h3><div>'+selected.map(function(p,i){return'<span><b>'+(i+1)+'</b>'+esc(p.title)+'</span>';}).join('')+'</div>';/* contents omitted to keep the report compact */
    var scope=document.createElement('div');scope.id='grcApp';scope.className='grc-visible grc-report-snapshot';scope.setAttribute('dir','ltr');
    chosen.forEach(function(i,index){var part=REPORT_PARTS[i];if(part)scope.appendChild(prepareReportDomain(part,index+1));});body.appendChild(scope);
    var footer=document.createElement('div');footer.className='grc-report-footer';footer.innerHTML='<div><strong>Qassim University Medical City</strong><span>Facility Management &amp; Safety Division · Governance &amp; Performance Department</span></div><small>Generated: '+esc(date)+'</small>';body.appendChild(footer);doc.appendChild(body);
    var style=document.createElement('style');style.textContent=`
      @media print{@page{size:A4 landscape!important;margin:0!important}}
      #rptDocument.grc-official-report{display:block!important;width:100%!important;margin:0!important;background:#fff!important;color:#152538!important;font-family:Arial,"Segoe UI",sans-serif!important;overflow:visible!important}
      #rptDocument .grc-report-header{display:flex!important;align-items:center!important;gap:18px!important;padding:17px 25px 14px!important;background:#152538!important;color:#fff!important}
      #rptDocument .grc-report-logo img{height:56px!important;width:auto!important;max-width:145px!important;object-fit:contain!important}
      #rptDocument .grc-report-heading{flex:1!important;border-left:2px solid rgba(1,181,210,.55)!important;padding-left:18px!important}
      #rptDocument .grc-report-heading p{margin:0 0 3px!important;font-size:7px!important;font-weight:900!important;color:#01b5d2!important;letter-spacing:.18em!important}
      #rptDocument .grc-report-heading h1{margin:0 0 2px!important;font-size:19px!important;line-height:1.18!important;color:#fff!important;font-weight:900!important}
      #rptDocument .grc-report-heading h2{margin:0 0 7px!important;font-size:10px!important;font-weight:500!important;color:rgba(255,255,255,.78)!important}
      #rptDocument .grc-report-heading>div{display:flex!important;gap:10px!important;font-size:8px!important;font-weight:700!important;color:#01b5d2!important}
      #rptDocument .qumc-report-header-line{height:3px!important;background:linear-gradient(90deg,#0195af,#01c5e8 45%,#152538)!important}
      #rptDocument .grc-report-content{padding:11px 14px 14px!important;overflow:visible!important}
      #rptDocument .grc-report-overview{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:18px!important;padding:14px 16px!important;margin:0 0 10px!important;border:1px solid #d7e4e9!important;border-radius:10px!important;background:linear-gradient(135deg,#f8fbfc,#eef7f8)!important}
      #rptDocument .grc-report-overview span{font-size:7px!important;font-weight:900!important;letter-spacing:.16em!important;color:#0195af!important}#rptDocument .grc-report-overview h2{font-size:14px!important;margin:3px 0 4px!important}#rptDocument .grc-report-overview p{font-size:7.5px!important;line-height:1.45!important;margin:0!important;color:#5e7480!important;max-width:720px!important}
      #rptDocument .grc-report-overview-metrics{display:flex!important;gap:8px!important}#rptDocument .grc-report-overview-metrics article{min-width:105px!important;padding:9px 11px!important;border-radius:8px!important;background:#fff!important;border:1px solid #dce7eb!important;text-align:center!important}#rptDocument .grc-report-overview-metrics b{display:block!important;font-size:13px!important;color:#173f55!important}#rptDocument .grc-report-overview-metrics span{font-size:6.5px!important;letter-spacing:0!important;color:#6f838e!important}
      #rptDocument .grc-report-contents{padding:9px 12px!important;margin:0 0 12px!important;border:1px solid #e0e8ec!important;border-radius:9px!important;background:#fff!important}#rptDocument .grc-report-contents h3{font-size:9px!important;margin:0 0 7px!important}#rptDocument .grc-report-contents>div{display:flex!important;flex-wrap:wrap!important;gap:6px!important}#rptDocument .grc-report-contents span{display:inline-flex!important;align-items:center!important;gap:5px!important;padding:5px 8px!important;border-radius:7px!important;background:#f2f7f9!important;font-size:7px!important;color:#355464!important}#rptDocument .grc-report-contents b{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;border-radius:5px!important;background:#173f55!important;color:#fff!important;font-size:6.5px!important}
      #rptDocument #grcApp{display:block!important;position:static!important;max-width:none!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;color:#152538!important}
      #rptDocument #grcApp .grc-report-domain{display:block!important;margin:0!important;padding:0!important;border:0!important;background:#fff!important;box-shadow:none!important;overflow:visible!important;break-before:page!important;page-break-before:always!important}
      #rptDocument #grcApp .grc-report-domain:first-child{break-before:auto!important;page-break-before:auto!important}
      #rptDocument #grcApp .grc-report-section-head{display:flex!important;align-items:center!important;gap:10px!important;margin:0 0 9px!important;padding:8px 10px!important;border:1px solid #d4e2e9!important;border-left:4px solid #0195af!important;border-radius:8px!important;background:#f7fafc!important;break-after:avoid!important}
      #rptDocument #grcApp .grc-report-section-head>span{display:grid!important;place-items:center!important;min-width:30px!important;height:30px!important;border-radius:8px!important;background:#152538!important;color:#fff!important;font-size:10px!important;font-weight:900!important}#rptDocument #grcApp .grc-report-section-head h2{font-size:14px!important;line-height:1.15!important;margin:0!important}#rptDocument #grcApp .grc-report-section-head p{font-size:7px!important;margin:2px 0 0!important;color:#647b88!important}
      #rptDocument #grcApp .grc-report-numbered-title{display:flex!important;align-items:center!important;gap:7px!important;margin:7px 0 6px!important;break-after:avoid!important}#rptDocument #grcApp .grc-report-subnumber{display:inline-grid!important;place-items:center!important;min-width:32px!important;height:21px!important;padding:0 5px!important;border-radius:6px!important;background:#173f55!important;color:#fff!important;font-size:7px!important;font-weight:900!important}#rptDocument #grcApp .grc-report-subtitle-text{font-size:10px!important;font-weight:900!important;color:#173f55!important}
      #rptDocument #grcApp .grc-metric-grid,#rptDocument #grcApp .grc-exec-metric-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:7px!important;margin:0 0 9px!important}
      #rptDocument #grcApp .grc-chart-grid,#rptDocument #grcApp .grc-exec-operations-grid,#rptDocument #grcApp .grc-form-scope-grid,#rptDocument #grcApp .grc-initiative-sections{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:0 0 9px!important}
      #rptDocument #grcApp .grc-exec-risk-visuals{display:grid!important;grid-template-columns:minmax(0,1.5fr) minmax(0,.8fr)!important;gap:8px!important;margin:0 0 9px!important}
      #rptDocument #grcApp .grc-metric-card,#rptDocument #grcApp .grc-chart-card,#rptDocument #grcApp .grc-module-card,#rptDocument #grcApp .grc-exec-ops-card,#rptDocument #grcApp .grc-section{min-height:0!important;height:auto!important;margin:0!important;padding:9px!important;box-shadow:none!important;break-inside:avoid!important;page-break-inside:avoid!important}
      #rptDocument #grcApp .grc-metric-value{font-size:17px!important}#rptDocument #grcApp .grc-metric-label{font-size:7px!important}#rptDocument #grcApp .grc-metric-foot{font-size:6.5px!important}
      #rptDocument #grcApp .grc-chart-title{font-size:8.5px!important;font-weight:900!important}#rptDocument #grcApp .grc-chart-card svg,#rptDocument #grcApp .grc-chart-card canvas,#rptDocument #grcApp .grc-chart-card img{display:block!important;width:100%!important;max-width:100%!important;height:155px!important;max-height:155px!important;object-fit:contain!important;margin:auto!important}#rptDocument #grcApp .grc-donut-card svg,#rptDocument #grcApp .grc-donut-card img{height:125px!important;max-height:125px!important}
      #rptDocument #grcApp .grc-table-wrap{overflow:visible!important;max-height:none!important}#rptDocument #grcApp table{width:100%!important;min-width:0!important;font-size:6.5px!important}#rptDocument #grcApp th,#rptDocument #grcApp td{padding:4px 5px!important;line-height:1.25!important}
      #rptDocument #grcApp input,#rptDocument #grcApp select,#rptDocument #grcApp textarea,#rptDocument #grcApp .grc-hero-actions,#rptDocument #grcApp .grc-primary-btn,#rptDocument #grcApp .grc-link-btn,#rptDocument #grcApp .grc-icon-btn,#rptDocument #grcApp .grc-row-actions{display:none!important}
      #rptDocument #grcApp .grc-report-domain>.grc-section,#rptDocument #grcApp .grc-exec-domain-body{display:block!important;min-height:0!important;gap:8px!important}
      #rptDocument #grcApp .grc-chart-grid>.grc-heatmap-card,#rptDocument #grcApp .grc-exec-risk-visuals>.grc-heatmap-card,#rptDocument #grcApp .grc-heatmap-card{grid-column:1/-1!important;width:100%!important;display:block!important;padding:8px!important;break-inside:avoid!important}
      #rptDocument #grcApp .grc-heat-grid{display:grid!important;grid-template-columns:repeat(5,minmax(68px,1fr)) 82px!important;gap:4px!important;min-width:0!important;margin-top:6px!important}
      #rptDocument #grcApp .grc-heat-cell{display:flex!important;min-height:42px!important;padding:4px!important;border:0!important;border-radius:6px!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;position:relative!important}
      #rptDocument #grcApp .grc-heat-cell.very-high{background:#D96D73!important;color:#fff!important}#rptDocument #grcApp .grc-heat-cell.high{background:#E7A76E!important;color:#374B59!important}#rptDocument #grcApp .grc-heat-cell.medium{background:#E7D17A!important;color:#374B59!important}#rptDocument #grcApp .grc-heat-cell.low{background:#7DBCA5!important;color:#244D43!important}
      #rptDocument #grcApp .grc-heat-cell strong{font-size:10px!important}#rptDocument #grcApp .grc-heat-cell span{font-size:5.8px!important}#rptDocument #grcApp .grc-heat-cell em{font-size:5px!important;padding:1px 3px!important;top:2px!important;right:2px!important}
      #rptDocument #grcApp .grc-heat-impact-head,#rptDocument #grcApp .grc-heat-like-label,#rptDocument #grcApp .grc-heat-side-head{font-size:5.8px!important;min-height:22px!important;padding:3px!important}
      #rptDocument #grcApp .grc-chart-card{min-height:0!important}#rptDocument #grcApp .grc-chart-card:not(.grc-heatmap-card){max-height:205px!important;overflow:hidden!important}
      #rptDocument #grcApp .grc-line-wrap,#rptDocument #grcApp .grc-vertical-bars,#rptDocument #grcApp .grc-bar-list,#rptDocument #grcApp .grc-stacked-list{min-height:0!important;max-height:150px!important;overflow:hidden!important}
      #rptDocument #grcApp .grc-chart-grid{align-items:start!important}
      #rptDocument .grc-report-footer{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;margin-top:10px!important;padding:9px 13px!important;border-radius:8px!important;background:#152538!important;color:#fff!important;break-inside:avoid!important}#rptDocument .grc-report-footer div{display:flex!important;flex-direction:column!important;gap:2px!important}#rptDocument .grc-report-footer strong{font-size:9px!important}#rptDocument .grc-report-footer span,#rptDocument .grc-report-footer small{font-size:7px!important;color:rgba(255,255,255,.68)!important}
    `;doc.appendChild(style);return doc;
  }
  window._grcGenerateReport=function(){
    var chosen=checked('grcReportSection').map(Number);if(!chosen.length){alert('Select at least one report section.');return;}
    var doc=buildReportDocument(chosen);closeOverlay();
    var ok=typeof window._qumcPrintReportDocument==='function'&&window._qumcPrintReportDocument(doc,{period:'GRC Executive Command · '+new Date().toLocaleDateString('en-GB'),orientation:'landscape'});
    if(!ok){alert('The Performance report print engine is not ready. Reload the page and try again.');return;}
    if(typeof window.addAudit==='function')window.addAudit('GRC_REPORT_PDF','Generated GRC Executive Command report');
  };

  window._grcToggleExportMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('grcExportMenu');if(m)m.classList.toggle('is-open');};
  document.addEventListener('click',function(e){var m=document.getElementById('grcExportMenu');if(m&&!e.target.closest('.grc-export-menu-wrap'))m.classList.remove('is-open');});
  function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
  async function buildAllPrintHost(ids){var app=document.getElementById('grcApp'),host=document.getElementById('grcNativeExportHost');if(host)host.remove();host=document.createElement('div');host.id='grcNativeExportHost';host.className='grc-native-export-host';for(var i=0;i<ids.length;i++){if(typeof window._grcSwitch==='function')window._grcSwitch(ids[i]);await wait(420);var live=document.getElementById('grc-page-'+ids[i]);if(!live)continue;var clone=cloneRenderedNode(live);cleanPrintNode(clone);clone.classList.add('is-active','grc-native-export-sheet');clone.style.display='block';host.appendChild(clone);}app.appendChild(host);return host;}
  function cleanupNativeExport(returnPage){document.body.classList.remove('grc-native-export','grc-native-export-all');document.body.removeAttribute('data-grc-export-page');var h=document.getElementById('grcNativeExportHost');if(h)h.remove();if(returnPage&&typeof window._grcSwitch==='function')window._grcSwitch(returnPage);}
  window._grcExportPage=async function(id){var menu=document.getElementById('grcExportMenu');if(menu)menu.classList.remove('is-open');var current=(document.querySelector('#grcApp .grc-page.is-active')||{}).id.replace(/^grc-page-/,'')||'executive';try{if(id==='all'){var ids=modules().map(function(x){return x.id;});await buildAllPrintHost(ids);document.body.classList.add('grc-native-export-all');}else{if(typeof window._grcSwitch==='function')window._grcSwitch(id);await wait(520);document.body.classList.add('grc-native-export');document.body.setAttribute('data-grc-export-page',id);}var done=function(){window.removeEventListener('afterprint',done);cleanupNativeExport(current);};window.addEventListener('afterprint',done);setTimeout(function(){window.print();},80);setTimeout(function(){if(document.body.classList.contains('grc-native-export')||document.body.classList.contains('grc-native-export-all'))cleanupNativeExport(current);},15000);if(typeof window.addAudit==='function')window.addAudit('GRC_PAGE_EXPORT','Exported GRC page: '+id);}catch(e){cleanupNativeExport(current);alert('Export failed: '+String(e&&e.message||e));}};
})();
