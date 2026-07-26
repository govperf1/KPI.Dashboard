/* ======================================================================
   QUMC GRC — Excel / Report / Page Export
   Build: 2026-07-26 v59
   ====================================================================== */
(function(){
  'use strict';

  var PAGE_LABELS={
    executive:'Executive Command',governance:'Governance',risk:'Risk Management',register:'Registers',
    compliance:'Compliance',actions:'Action Plans',documents:'Documents & Records',reports:'Reports',
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
  function excelPages(){return modules().filter(function(m){return!EXCEL_EXCLUDED_PAGES[m.id];});}

  function optionGroup(id,title,description,allId,allLabel,name,items){
    return'<div id="'+id+'" class="grc-export-section" style="display:none"><h3>'+esc(title)+'</h3><p style="font-size:9px;color:#78909A;margin:0 0 10px">'+esc(description)+'</p><div class="grc-export-check-grid">'+
      '<label class="grc-export-check"><input id="'+allId+'" type="checkbox" checked onchange="window._grcToggleContentAll(\''+name+'\',this.checked,\''+allId+'\')"><span><b>'+esc(allLabel)+'</b></span></label>'+
      items.map(function(x){return'<label class="grc-export-check"><input type="checkbox" name="'+name+'" value="'+esc(x[0])+'" checked onchange="window._grcSyncContentAll(\''+name+'\',\''+allId+'\')"><span>'+esc(x[1])+'</span></label>';}).join('')+
      '</div></div>';
  }
  window._grcToggleContentAll=function(name,on){document.querySelectorAll('input[name="'+name+'"]').forEach(function(x){x.checked=!!on;});};
  window._grcSyncContentAll=function(name,allId){var all=document.getElementById(allId),boxes=Array.prototype.slice.call(document.querySelectorAll('input[name="'+name+'"]'));if(all)all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});};
  function governanceOptionsHtml(){return optionGroup('grcGovernanceOptions','Governance Contents','Choose all Governance register groups or any combination. Data is taken directly from the platform registers.','grcGovernanceAll','All Governance Records','grcGovernanceContent',[['policies','Policies'],['plans','Plans'],['forms','Forms']]);}
  function riskOptionsHtml(){return optionGroup('grcRiskOptions','Risk Management Contents','Choose all three Risk Management registers or any combination.','grcRiskAll','All Risk Management Records','grcRiskContent',[['risks','Risk Register'],['incidents','Incident Register'],['codes','Emergency Codes']]);}
  function complianceOptionsHtml(){return optionGroup('grcComplianceOptions','Compliance Contents','Choose CBAHI, JCI, or both. CBAHI includes the complete assessment, including ESR requirements.','grcComplianceAll','All Compliance Records','grcComplianceContent',[['cbahi','CBAHI Assessment'],['jci','JCI Assessment']]);}
  window._grcToggleExcelPageOptions=function(){
    [['governance','grcGovernanceOptions'],['risk','grcRiskOptions'],['compliance','grcComplianceOptions']].forEach(function(pair){var box=document.getElementById(pair[1]),page=document.querySelector('input[name="grcExcelPage"][value="'+pair[0]+'"]');if(box)box.style.display=page&&page.checked?'block':'none';});
  };
  window._grcOpenExcelSelector=function(){
    var pageChecks=excelPages().map(function(m){var on=['governance','risk','compliance','register'].indexOf(m.id)>=0;return'<label class="grc-export-check"><input type="checkbox" name="grcExcelPage" value="'+esc(m.id)+'" '+(on?'checked':'')+' onchange="window._grcToggleExcelPageOptions()"><span>'+esc(PAGE_LABELS[m.id]||m.label)+'</span></label>';}).join('');
    var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input type="checkbox" name="grcExcelDept" value="'+d[0]+'" checked><span>'+d[1]+'</span></label>';}).join('');
    overlay('GRC Excel Export','Choose departments, platform pages, and the exact register groups required. Each platform page is created as a separate worksheet.','<div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div><div class="grc-export-section"><h3>Worksheets / Platform Pages</h3><div class="grc-export-check-grid">'+pageChecks+'</div></div>'+governanceOptionsHtml()+riskOptionsHtml()+complianceOptionsHtml(),'Generate Excel','window._grcGenerateExcel()');
    setTimeout(window._grcToggleExcelPageOptions,0);
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
      source=data._reports||[];columns=['Code','Report Name','Family','Type','Year','Quarter','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.titleEn||r.title||r.name,r.family,r.kind||r.type,r.year,r.quarter,r.status||'Available']);});
    }else if(id==='manuals'){
      source=data.manuals||[];columns=['Code','Manual / Guideline','Language','Version','Status'];source.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,r.language,r.version,r.status]);});
    }else{columns=['Information'];rows=[['No register dataset is configured for this page.']];}
    return{title:PAGE_LABELS[id]||id,kind:'flat',columns:columns,rows:rows};
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
    var pages=checked('grcExcelPage'),depts=checked('grcExcelDept'),selections={governance:checked('grcGovernanceContent'),risk:checked('grcRiskContent'),compliance:checked('grcComplianceContent')};
    if(!pages.length){alert('Select at least one platform page.');return;}if(pages.indexOf('governance')>=0&&!selections.governance.length){alert('Select at least one Governance content group.');return;}if(pages.indexOf('risk')>=0&&!selections.risk.length){alert('Select at least one Risk Management content group.');return;}if(pages.indexOf('compliance')>=0&&!selections.compliance.length){alert('Select at least one Compliance content group.');return;}
    var data=snap(),sets=pages.map(function(id){return rowsForPage(id,data,depts,selections);});closeOverlay();try{var hasExcelJs=await waitForExcelJs(7000);if(hasExcelJs)await buildExcelJs(sets,depts);else buildSheetJs(sets,depts);if(typeof window.addAudit==='function')window.addAudit('GRC_EXPORT_EXCEL','Exported GRC Excel: '+pages.join(', '));}catch(e){alert('Excel export failed: '+String(e&&e.message||e));}
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
  function cleanPrintNode(node){
    if(!node)return node;
    node.querySelectorAll('button,input,select,textarea,.grc-hero-actions,.grc-admin-actions,.grc-inline-crud-actions,.grc-export-actions,.adv-module-grid,.adv-filters,.grc-dept-bar,.grc-filter-row,.grc-table-filterbar,.grc-report-adminbar,.grc-pdf-search').forEach(function(x){x.remove();});
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
      var h=sec.querySelector('.grc-exec-domain-head h2'),title=(h&&h.textContent||('Section '+(i+1))).trim();
      return{title:title,node:cleanPrintNode(cloneRenderedNode(sec))};
    });
  }
  window._grcOpenReportSelector=async function(){
    var page=await ensureExecutiveRendered();REPORT_PARTS=executiveReportParts(page);
    var opts=REPORT_PARTS.map(function(p,i){return'<label class="grc-export-check"><input type="checkbox" name="grcReportSection" value="'+i+'" checked><span>'+esc((i+1)+'. '+p.title)+'</span></label>';}).join('');
    if(!opts)opts='<div style="padding:12px;color:#8A4650">No Executive Command sections were found. Reload the page and try again.</div>';
    overlay('GRC Executive Command Report','Select the Executive Command sections to include. Governance is the first report section; the introductory Executive Overview and Governance Tools are intentionally excluded.','<div class="grc-export-section"><h3>Report Sections</h3><div class="grc-export-check-grid">'+opts+'</div></div>','Build Report','window._grcGenerateReport()');
  };
  function numberSubsections(node,mainNo){
    var n=0,seen=[];
    Array.prototype.slice.call(node.querySelectorAll('.grc-section-title,.grc-card-title,.grc-chart-title,.grc-register-titlebar strong,h3,h4')).forEach(function(h){
      if(h.closest('.grc-exec-domain-head'))return;
      var text=(h.textContent||'').trim();if(!text||/^\d+(?:\.\d+)*[.\s]/.test(text)||seen.indexOf(text)>=0)return;
      seen.push(text);n++;h.textContent=mainNo+'.'+n+' '+text;
    });
  }
  function prepareReportDomain(part,index){
    var node=part.node.cloneNode(true),head=node.querySelector('.grc-exec-domain-head'),kick=head&&head.querySelector('.grc-exec-domain-kicker'),title=head&&head.querySelector('h2');
    if(kick)kick.textContent=String(index).padStart(2,'0');
    if(title)title.textContent=index+'. '+part.title;
    numberSubsections(node,index);
    node.classList.add('grc-report-domain');
    return node;
  }
  function logoSrc(){return((document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg')||{}).src||'');}
  function buildReportDocument(chosen){
    var doc=document.createElement('div');doc.id='rptDocument';doc.style.cssText="background:#fff;max-width:860px;margin:0 auto 32px;border-radius:12px;box-shadow:0 12px 48px rgba(13,31,60,.14);overflow:hidden;font-family:'IBM Plex Sans',Calibri,Arial,sans-serif";
    var date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}),logo=logoSrc();
    var header=document.createElement('div');header.style.cssText='background:#152538;padding:26px 36px 22px;display:flex;align-items:flex-start;gap:22px';
    header.innerHTML='<div style="flex-shrink:0;background:#152538">'+(logo?'<img src="'+esc(logo)+'" alt="QUMC" style="height:80px;width:auto;object-fit:contain">':'')+'</div><div style="flex:1;border-left:2px solid rgba(1,149,175,.45);padding-left:22px"><p style="margin:0 0 4px;font-size:8px;font-weight:700;color:#0195af;letter-spacing:.26em;text-transform:uppercase">Official Governance, Risk &amp; Compliance Report</p><h1 style="margin:0 0 4px;font-size:19px;font-weight:900;color:#fff;line-height:1.25">GRC Executive Command Report</h1><h2 style="margin:0 0 12px;font-size:12px;font-weight:400;color:rgba(255,255,255,.62)">Facility Management &amp; Safety Division</h2><div style="display:flex;gap:14px;flex-wrap:wrap"><span style="font-size:10px;font-weight:600;color:#0195af">'+esc(date)+'</span><span style="color:rgba(255,255,255,.25)">·</span><span style="font-size:10px;font-weight:600;color:#0195af">Executive Command</span></div></div>';
    doc.appendChild(header);var line=document.createElement('div');line.style.cssText='height:3px;background:linear-gradient(90deg,#0195af,#01c5e8 40%,#152538)';doc.appendChild(line);
    var body=document.createElement('div');body.style.cssText='padding:24px 30px 28px';
    var scope=document.createElement('div');scope.id='grcApp';scope.className='grc-visible grc-report-snapshot';scope.setAttribute('dir','ltr');
    chosen.forEach(function(i,index){var part=REPORT_PARTS[i];if(part)scope.appendChild(prepareReportDomain(part,index+1));});
    body.appendChild(scope);
    var footer=document.createElement('div');footer.className='grc-report-footer';footer.innerHTML='<div style="display:flex;align-items:center;gap:14px"><div style="width:3px;height:32px;background:#0195af;border-radius:2px;flex-shrink:0"></div><div><p style="margin:0;font-size:10px;font-weight:800;color:#fff">Qassim University Medical City</p><p style="margin:2px 0 0;font-size:8.5px;color:rgba(255,255,255,.50)">Facility Management &amp; Safety Division · Governance &amp; Performance Department</p></div></div><div style="text-align:right"><p style="margin:0;font-size:8.5px;color:rgba(255,255,255,.55)">Generated: '+esc(date)+'</p></div>';
    body.appendChild(footer);doc.appendChild(body);
    var reportStyle=document.createElement('style');reportStyle.textContent=`
      #rptDocument>#grcApp,#rptDocument #grcApp{display:block!important;position:static!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;color:#152538!important}
      #rptDocument #grcApp .grc-report-domain{margin:0 0 18px!important;padding:14px 14px 10px!important;border-radius:14px!important;box-shadow:none!important;break-inside:auto!important;page-break-inside:auto!important}
      #rptDocument #grcApp .grc-exec-domain-head{margin:0 0 12px!important;padding:0 0 10px!important;break-after:avoid!important;page-break-after:avoid!important}
      #rptDocument #grcApp .grc-exec-domain-head h2{font-size:15px!important;line-height:1.25!important}
      #rptDocument #grcApp .grc-exec-domain-head p{font-size:8px!important;margin-top:3px!important}
      #rptDocument #grcApp .grc-exec-domain-kicker{width:28px!important;height:28px!important;font-size:9px!important}
      #rptDocument #grcApp .grc-section{margin:10px 0 14px!important;padding-bottom:0!important}
      #rptDocument #grcApp .grc-section-head{margin-bottom:9px!important}
      #rptDocument #grcApp .grc-section-title{font-size:11px!important}
      #rptDocument #grcApp .grc-section-sub{font-size:7.5px!important}
      #rptDocument #grcApp .grc-metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:8px 0 10px!important}
      #rptDocument #grcApp .grc-metric-grid.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      #rptDocument #grcApp .grc-metric-grid.cols-5{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #rptDocument #grcApp .grc-metric-grid.cols-6{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      #rptDocument #grcApp .grc-metric-grid.cols-7{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      #rptDocument #grcApp .grc-metric-card{min-height:88px!important;padding:10px 11px 9px!important;border-radius:11px!important;box-shadow:none!important;break-inside:avoid!important;page-break-inside:avoid!important}
      #rptDocument #grcApp .grc-metric-icon{width:25px!important;height:25px!important;font-size:12px!important}
      #rptDocument #grcApp .grc-metric-label{font-size:7.8px!important;min-height:18px!important}
      #rptDocument #grcApp .grc-metric-value{font-size:20px!important;margin-top:3px!important}
      #rptDocument #grcApp .grc-metric-sub,#rptDocument #grcApp .grc-metric-foot{font-size:6.8px!important;margin-top:3px!important}
      #rptDocument #grcApp .grc-chart-grid,#rptDocument #grcApp .grc-chart-grid.cols-2,#rptDocument #grcApp .grc-chart-grid.cols-3{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;margin:9px 0 12px!important}
      #rptDocument #grcApp .grc-chart-grid.cols-1{grid-template-columns:minmax(0,1fr)!important}
      #rptDocument #grcApp .grc-chart-card{min-height:135px!important;height:auto!important;padding:10px 11px!important;border-radius:11px!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important}
      #rptDocument #grcApp .grc-chart-title{font-size:7.5px!important;margin-bottom:8px!important}
      #rptDocument #grcApp svg{max-height:118px!important;width:100%!important}
      #rptDocument #grcApp .grc-vertical-bars{height:118px!important}
      #rptDocument #grcApp .grc-vbar-item{min-width:36px!important;grid-template-rows:15px 1fr 24px!important}
      #rptDocument #grcApp .grc-initiative-sections{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #rptDocument #grcApp .grc-initiative-equal-cards{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      #rptDocument #grcApp .grc-department-panel{margin:0 0 10px!important;box-shadow:none!important;break-inside:auto!important;page-break-inside:auto!important}
      #rptDocument #grcApp .grc-department-header{padding:9px 11px!important}
      #rptDocument #grcApp .grc-department-body{padding:10px 11px 12px!important}
      #rptDocument #grcApp .grc-table-wrap{overflow:visible!important;max-height:none!important;border-radius:0 0 10px 10px!important}
      #rptDocument #grcApp table{min-width:0!important;width:100%!important;table-layout:fixed!important;font-size:6.5px!important}
      #rptDocument #grcApp th{font-size:6.2px!important;padding:5px 4px!important;white-space:normal!important}
      #rptDocument #grcApp td{font-size:6.2px!important;padding:5px 4px!important;white-space:normal!important;word-break:break-word!important}
      #rptDocument #grcApp tr{break-inside:avoid!important;page-break-inside:avoid!important}
      #rptDocument #grcApp .grc-register-block{margin-top:10px!important}
      #rptDocument #grcApp .grc-register-titlebar{padding:8px 10px!important}
      #rptDocument .grc-report-footer{margin-top:20px;background:#152538;border-radius:10px;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;break-inside:avoid;page-break-inside:avoid}
      #rptDocument #grcApp button,#rptDocument #grcApp input,#rptDocument #grcApp select,#rptDocument #grcApp textarea{display:none!important}
    `;doc.appendChild(reportStyle);return doc;
  }
  window._grcGenerateReport=function(){
    var chosen=checked('grcReportSection').map(Number);if(!chosen.length){alert('Select at least one report section.');return;}
    var doc=buildReportDocument(chosen);closeOverlay();
    var ok=typeof window._qumcPrintReportDocument==='function'&&window._qumcPrintReportDocument(doc,{period:'GRC Executive Command · '+new Date().toLocaleDateString('en-GB')});
    if(!ok){alert('The Performance report print engine is not ready. Reload the page and try again.');return;}
    if(typeof window.addAudit==='function')window.addAudit('GRC_REPORT_PDF','Generated GRC Executive Command report');
  };

  window._grcToggleExportMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('grcExportMenu');if(m)m.classList.toggle('is-open');};
  document.addEventListener('click',function(e){var m=document.getElementById('grcExportMenu');if(m&&!e.target.closest('.grc-export-menu-wrap'))m.classList.remove('is-open');});
  function cleanupPageExport(){
    var st=document.getElementById('kpi-print-override');if(st)st.remove();
    var stage=document.getElementById('grcExportPrintStage');if(stage)stage.remove();
    document.documentElement.classList.remove('grc-page-export-only');document.body.classList.remove('grc-page-export-only');
  }
  async function renderAllPagesForExport(ids){
    var current=(document.querySelector('#grcApp .grc-page.is-active')||{}).id||'',stage=document.createElement('div');stage.id='grcExportPrintStage';stage.className='grc-export-stage';
    for(var i=0;i<ids.length;i++){
      if(typeof window._grcSwitch==='function')window._grcSwitch(ids[i]);
      await new Promise(function(r){setTimeout(r,360);});
      var live=document.getElementById('grc-page-'+ids[i]);if(!live)continue;
      var clone=cleanPrintNode(cloneRenderedNode(live));clone.classList.add('grc-export-page-print');clone.style.pageBreakBefore=i?'always':'auto';stage.appendChild(clone);
    }
    var app=document.getElementById('grcApp');if(app)app.appendChild(stage);
    if(current&&typeof window._grcSwitch==='function')window._grcSwitch(current.replace(/^grc-page-/,''));
    return stage;
  }
  function singlePageExportCss(id){return '@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body>*:not(#grcApp){display:none!important}#grcApp{display:block!important;position:static!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important}#grcApp>.grc-topbar,#grcApp>.grc-nav-wrap,#grcApp>.grc-footer{display:none!important}#grcApp .grc-main{display:block!important;overflow:visible!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;padding:0!important;margin:0!important}#grcApp .grc-page{display:none!important;visibility:hidden!important}#grcApp #grc-page-'+id+'{display:block!important;visibility:visible!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}#grcApp .grc-hero-actions,#grcApp button,#grcApp input,#grcApp select,#grcApp textarea,#grcApp .grc-inline-crud-actions,#grcApp .grc-filter-row,#grcApp .grc-table-filterbar,#grcApp .grc-report-adminbar,#grcApp .grc-pdf-search{display:none!important}#grcApp .grc-card,#grcApp .grc-metric-card,#grcApp .grc-chart-card,#grcApp .grc-department-panel,#grcApp .grc-exec-domain{box-shadow:none!important}#grcApp .grc-table-wrap{overflow:visible!important;max-height:none!important}#grcApp table{width:100%!important} @page{size:landscape;margin:10mm}}';}
  function allPagesExportCss(){return '@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body>*:not(#grcApp){display:none!important}#grcApp{display:block!important;position:static!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important}#grcApp>*:not(#grcExportPrintStage){display:none!important}#grcExportPrintStage{display:block!important;width:100%!important;overflow:visible!important}#grcExportPrintStage .grc-export-page-print{display:block!important;visibility:visible!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}#grcExportPrintStage .grc-hero-actions,#grcExportPrintStage button,#grcExportPrintStage input,#grcExportPrintStage select,#grcExportPrintStage textarea,#grcExportPrintStage .grc-inline-crud-actions,#grcExportPrintStage .grc-filter-row,#grcExportPrintStage .grc-table-filterbar,#grcExportPrintStage .grc-report-adminbar,#grcExportPrintStage .grc-pdf-search{display:none!important}#grcExportPrintStage .grc-card,#grcExportPrintStage .grc-metric-card,#grcExportPrintStage .grc-chart-card,#grcExportPrintStage .grc-department-panel,#grcExportPrintStage .grc-exec-domain{box-shadow:none!important}#grcExportPrintStage .grc-table-wrap{overflow:visible!important;max-height:none!important}#grcExportPrintStage table{width:100%!important}@page{size:landscape;margin:10mm}}';}
  window._grcExportPage=async function(id){
    var menu=document.getElementById('grcExportMenu');if(menu)menu.classList.remove('is-open');cleanupPageExport();
    var mods=modules(),ids=id==='all'?mods.map(function(x){return x.id;}):[id];
    if(id==='all'){
      var stage=await renderAllPagesForExport(ids);if(!stage||!stage.children.length){cleanupPageExport();alert('The selected pages could not be prepared for export.');return;}
    }else{
      if(typeof window._grcSwitch==='function')window._grcSwitch(id);await new Promise(function(r){setTimeout(r,650);});
      if(!document.getElementById('grc-page-'+id)){alert('The selected page could not be prepared for export.');return;}
    }
    var st=document.createElement('style');st.id='kpi-print-override';st.textContent=id==='all'?allPagesExportCss():singlePageExportCss(id);document.head.appendChild(st);
    document.documentElement.classList.add('grc-page-export-only');document.body.classList.add('grc-page-export-only');
    await new Promise(function(r){setTimeout(r,180);});window.print();setTimeout(cleanupPageExport,3000);
    if(typeof window.addAudit==='function')window.addAudit('GRC_PAGE_EXPORT','Exported GRC page: '+id);
  };
  window.addEventListener('afterprint',function(){if(document.getElementById('kpi-print-override')||document.getElementById('grcExportPrintStage'))cleanupPageExport();});
})();
