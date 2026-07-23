/* ======================================================================
   QUMC GRC — Excel / Report / Page Export
   Build: 2026-07-23 v55
   ====================================================================== */
(function(){
  'use strict';

  var PAGE_LABELS={
    executive:'Executive Command',governance:'Governance',risk:'Risk Management',register:'Registers',
    compliance:'Compliance',actions:'Action Plans',documents:'Documents & Records',reports:'Reports',
    manuals:'FMS Manual',advisory:'Review & Guidance Center'
  };
  /* Governance & Performance is intentionally excluded from the department filter. */
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

  function deptMatch(r,depts){
    if(!depts.length)return true;
    r=r||{};
    var rd=String(r.department||r.dept||'').toLowerCase().replace(/[\s&/-]+/g,''),
        hay=[r.id,r.code,r.name,r.nameEn,r.title,r.titleEn,r.riskIdentified].join(' ').toUpperCase();
    return depts.some(function(d){
      if(d==='laundry')return rd==='laundry'||/\bLUND|LAUNDRY/.test(hay);
      if(d==='housekeeping')return rd==='housekeeping'&&!/\bLUND|LAUNDRY/.test(hay);
      if(d==='projects')return rd==='projects'||rd==='projectmanagement';
      return rd===d;
    });
  }
  function recordKey(r){return String(r&&r.id||r&&r.code||'');}
  function simpleValue(v){if(v==null)return'';if(Array.isArray(v))return v.map(function(x){return typeof x==='object'?JSON.stringify(x):x;}).join('; ');if(typeof v==='object')return JSON.stringify(v);return v;}

  function excelPages(){
    return modules().filter(function(m){return !EXCEL_EXCLUDED_PAGES[m.id];});
  }
  function governanceOptionsHtml(){
    return '<div id="grcGovernanceOptions" class="grc-export-section" style="display:none">'+
      '<h3>Governance Contents</h3><p style="font-size:9px;color:#78909A;margin:0 0 10px">Choose all Governance register groups or any combination. Data is taken directly from the platform registers.</p>'+
      '<div class="grc-export-check-grid">'+
        '<label class="grc-export-check"><input id="grcGovernanceAll" type="checkbox" checked onchange="window._grcToggleGovernanceAll(this.checked)"><span><b>All Governance Records</b><br>Policies, plans and forms</span></label>'+
        '<label class="grc-export-check"><input type="checkbox" name="grcGovernanceContent" value="policies" checked onchange="window._grcSyncGovernanceAll()"><span>Policies</span></label>'+
        '<label class="grc-export-check"><input type="checkbox" name="grcGovernanceContent" value="plans" checked onchange="window._grcSyncGovernanceAll()"><span>Plans</span></label>'+
        '<label class="grc-export-check"><input type="checkbox" name="grcGovernanceContent" value="forms" checked onchange="window._grcSyncGovernanceAll()"><span>Forms</span></label>'+
      '</div></div>';
  }
  window._grcToggleGovernanceAll=function(on){
    document.querySelectorAll('input[name="grcGovernanceContent"]').forEach(function(x){x.checked=!!on;});
  };
  window._grcSyncGovernanceAll=function(){
    var all=document.getElementById('grcGovernanceAll'),boxes=Array.prototype.slice.call(document.querySelectorAll('input[name="grcGovernanceContent"]'));
    if(all)all.checked=boxes.length>0&&boxes.every(function(x){return x.checked;});
  };
  window._grcToggleExcelPageOptions=function(){
    var gov=document.querySelector('input[name="grcExcelPage"][value="governance"]'),box=document.getElementById('grcGovernanceOptions');
    if(box)box.style.display=gov&&gov.checked?'block':'none';
  };
  window._grcOpenExcelSelector=function(){
    var pageChecks=excelPages().map(function(m){
      var checkedByDefault=['governance','risk','register'].indexOf(m.id)>=0;
      return'<label class="grc-export-check"><input type="checkbox" name="grcExcelPage" value="'+esc(m.id)+'" '+(checkedByDefault?'checked':'')+' onchange="window._grcToggleExcelPageOptions()"><span>'+esc(PAGE_LABELS[m.id]||m.label)+'</span></label>';
    }).join('');
    var deptChecks=DEPTS.map(function(d){return'<label class="grc-export-check"><input type="checkbox" name="grcExcelDept" value="'+d[0]+'" checked><span>'+d[1]+'</span></label>';}).join('');
    overlay(
      'GRC Excel Export',
      'Choose departments and platform pages. Each selected platform page will be created as a separate worksheet using data from its registers.',
      '<div class="grc-export-section"><h3>Departments</h3><div class="grc-export-check-grid">'+deptChecks+'</div></div>'+
      '<div class="grc-export-section"><h3>Worksheets / Platform Pages</h3><div class="grc-export-check-grid">'+pageChecks+'</div></div>'+governanceOptionsHtml(),
      'Generate Excel','window._grcGenerateExcel()'
    );
    setTimeout(window._grcToggleExcelPageOptions,0);
  };

  function rowsForPage(id,data,depts,governanceTypes){
    var rows=[],source=[],columns=[];
    function filtered(key){return(data[key]||[]).filter(function(r){return deptMatch(r,depts);});}
    if(id==='governance'){
      governanceTypes=governanceTypes&&governanceTypes.length?governanceTypes:['policies','plans','forms'];
      columns=['Record Type','Code','Name','Department','Issue Date','Effective Date','Review Date','Status','Scope'];
      if(governanceTypes.indexOf('policies')>=0)filtered('policies').forEach(function(r){rows.push(['Policy',r.code||r.id,r.nameEn||r.name||r.title,r.department,r.issueDate,r.effectiveDate,r.reviewDate,r.status,'']);});
      if(governanceTypes.indexOf('plans')>=0)filtered('plans').forEach(function(r){rows.push(['Plan',r.code||r.id,r.nameEn||r.name||r.title,r.department,r.issueDate,r.effectiveDate,r.reviewDate,r.status,'']);});
      if(governanceTypes.indexOf('forms')>=0)filtered('forms').forEach(function(r){rows.push(['Form',r.code||r.id,r.nameEn||r.name||r.title,r.department,r.issueDate,r.effectiveDate,r.reviewDate,r.status,r.scope]);});
      return{title:'Governance',columns:columns,rows:rows};
    }
    if(id==='risk'){
      columns=['Record Type','Code','Description','Department','Category','Likelihood','Impact','Score','Level','Status'];
      filtered('risks').forEach(function(r){rows.push(['Risk',r.id||r.code,r.riskIdentified||r.description,r.department,r.riskCategory,r.likelihood,r.impact,r.riskScore||Number(r.likelihood||0)*Number(r.impact||0),r.riskLevel,r.actionStatus||r.status]);});
      filtered('incidents').forEach(function(r){rows.push(['Incident',r.id||r.code,r.title||r.description,r.department,r.category,'','','','',r.status]);});
      filtered('codes').forEach(function(r){rows.push(['Emergency Code',r.id||r.code,r.name||r.title,r.department,r.type,'','','','',r.status]);});
      return{title:'Risk Management',columns:columns,rows:rows};
    }
    if(id==='register'){
      columns=['Register','Code','Name / Description','Department','Status'];
      ['policies','plans','forms','risks','incidents','codes','actions','documents'].forEach(function(k){
        filtered(k).forEach(function(r){rows.push([k,r.code||r.id,r.nameEn||r.name||r.titleEn||r.title||r.riskIdentified||r.description,r.department,r.status||r.actionStatus]);});
      });
      return{title:'Registers',columns:columns,rows:rows};
    }
    if(id==='compliance'){
      source=filtered('compliance');columns=['Code','Authority','Requirement','Department','Status','Gap','CAP'];
      source.forEach(function(r){rows.push([r.code||r.id,r.authority||r.standard,r.requirement||r.description,r.department,r.status,r.gap||r.gapAnalysis,r.cap||r.correctiveAction]);});
      return{title:'Compliance',columns:columns,rows:rows};
    }
    if(id==='actions'){
      source=filtered('actions');columns=['Code','Action','Department','Source','Owner','Due Date','Status','Progress'];
      source.forEach(function(r){rows.push([r.code||r.id,r.name||r.title||r.action,r.department,r.source,r.owner,r.dueDate,r.status,r.progress]);});
      return{title:'Action Plans',columns:columns,rows:rows};
    }
    if(id==='documents'){
      source=filtered('documents');columns=['Code','Document','Department','Category','Version','Issue Date','Status'];
      source.forEach(function(r){rows.push([r.code||r.id,r.name||r.title,r.department,r.category,r.version,r.issueDate,r.status]);});
      return{title:'Documents & Records',columns:columns,rows:rows};
    }
    if(id==='reports'){
      source=data._reports||[];columns=['Code','Report Name','Family','Type','Year','Quarter','Status'];
      source.forEach(function(r){rows.push([r.code||r.id,r.titleEn||r.title||r.name,r.family,r.kind||r.type,r.year,r.quarter,r.status||'Available']);});
      return{title:'Reports',columns:columns,rows:rows};
    }
    if(id==='manuals'){
      source=data.manuals||[];columns=['Code','Manual / Guideline','Language','Version','Status'];
      source.forEach(function(r){rows.push([r.code||r.id,r.nameEn||r.name||r.title,r.language,r.version,r.status]);});
      return{title:'FMS Manual',columns:columns,rows:rows};
    }
    return{title:PAGE_LABELS[id]||id,columns:['Information'],rows:[['No register dataset is configured for this page.']]};
  }

  function waitForExcelJs(timeoutMs){
    return new Promise(function(resolve){
      if(window.ExcelJS)return resolve(true);
      var started=Date.now(),timer=setInterval(function(){
        if(window.ExcelJS){clearInterval(timer);resolve(true);}
        else if(Date.now()-started>=timeoutMs){clearInterval(timer);resolve(false);}
      },100);
    });
  }
  function logoBase64(){var im=document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg');if(!im||!/^data:image/.test(im.src||''))return null;return im.src;}
  function departmentText(depts){return depts.length?depts.map(function(d){var x=DEPTS.find(function(z){return z[0]===d;});return x?x[1]:d;}).join(', '):'All';}
  function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1800);}

  async function buildExcelJs(sets,depts){
    var wb=new ExcelJS.Workbook();wb.creator='QUMC GRC Workspace';wb.created=new Date();
    var logo=logoBase64(),logoId=null;if(logo){try{logoId=wb.addImage({base64:logo,extension:logo.indexOf('png')>=0?'png':'jpeg'});}catch(_){}}
    sets.forEach(function(set){
      var name=(set.title||'Worksheet').replace(/[\\\/?*\[\]:]/g,' ').slice(0,31),ws=wb.addWorksheet(name,{views:[{showGridLines:false,state:'frozen',ySplit:5}]});
      var cols=Math.max(2,set.columns.length);
      ws.mergeCells(1,1,1,cols);ws.getCell(1,1).value='QUMC — Governance, Risk & Compliance';ws.getCell(1,1).font={name:'Calibri',size:15,bold:true,color:{argb:'FFFFFFFF'}};ws.getCell(1,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF152538'}};ws.getCell(1,1).alignment={horizontal:'center',vertical:'middle'};ws.getRow(1).height=30;
      ws.mergeCells(2,1,2,cols);ws.getCell(2,1).value=set.title+' · Facility Management & Safety Division';ws.getCell(2,1).font={name:'Calibri',size:11,bold:true,color:{argb:'FF007A96'}};ws.getCell(2,1).alignment={horizontal:'center'};
      ws.mergeCells(3,1,3,cols);ws.getCell(3,1).value='Departments: '+departmentText(depts)+' · Generated: '+new Date().toLocaleString('en-GB');ws.getCell(3,1).font={name:'Calibri',size:9,color:{argb:'FF64748B'}};ws.getCell(3,1).alignment={horizontal:'center'};
      if(logoId!=null)ws.addImage(logoId,{tl:{col:.15,row:.1},ext:{width:88,height:48}});
      ws.addRow([]);var hr=ws.addRow(set.columns);hr.height=26;
      hr.eachCell(function(c){c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF00A3C4'}};c.font={name:'Calibri',size:10,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border={top:{style:'thin',color:{argb:'FFD6E2EE'}},bottom:{style:'thin',color:{argb:'FFD6E2EE'}},left:{style:'thin',color:{argb:'FFD6E2EE'}},right:{style:'thin',color:{argb:'FFD6E2EE'}}};});
      (set.rows.length?set.rows:[['No matching records']]).forEach(function(a,i){var r=ws.addRow(a.map(simpleValue));r.eachCell(function(c){c.font={name:'Calibri',size:9,color:{argb:'FF243B53'}};c.alignment={vertical:'middle',wrapText:true};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2?'FFF8FAFC':'FFFFFFFF'}};c.border={bottom:{style:'hair',color:{argb:'FFE2E8F0'}}};});});
      ws.columns.forEach(function(c,i){var max=12;[set.columns].concat(set.rows.slice(0,100)).forEach(function(a){max=Math.max(max,String(a[i]||'').length+2);});c.width=Math.min(42,max);});
      ws.autoFilter={from:{row:5,column:1},to:{row:5,column:set.columns.length}};
    });
    var buf=await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'QUMC_GRC_Export_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }
  function buildSheetJs(sets,depts){
    if(!window.XLSX)throw new Error('Excel libraries are unavailable. Check the internet connection and reload the page.');
    var wb=XLSX.utils.book_new();
    sets.forEach(function(set){
      var rows=[['QUMC — Governance, Risk & Compliance'],[set.title+' · Facility Management & Safety Division'],['Departments: '+departmentText(depts)+' · Generated: '+new Date().toLocaleString('en-GB')],[],set.columns].concat(set.rows.length?set.rows:[['No matching records']]);
      var ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=set.columns.map(function(_,i){var max=12;rows.slice(4,105).forEach(function(r){max=Math.max(max,String(r[i]||'').length+2);});return{wch:Math.min(42,max)};});
      var name=(set.title||'Worksheet').replace(/[\\\/?*\[\]:]/g,' ').slice(0,31);XLSX.utils.book_append_sheet(wb,ws,name);
    });
    XLSX.writeFile(wb,'QUMC_GRC_Export_'+new Date().toISOString().slice(0,10)+'.xlsx');
  }
  window._grcGenerateExcel=async function(){
    var pages=checked('grcExcelPage'),depts=checked('grcExcelDept'),governanceTypes=checked('grcGovernanceContent');
    if(!pages.length){alert('Select at least one platform page.');return;}
    if(pages.indexOf('governance')>=0&&!governanceTypes.length){alert('Select at least one Governance content group.');return;}
    var data=snap(),sets=pages.map(function(id){return rowsForPage(id,data,depts,governanceTypes);});
    closeOverlay();
    try{
      var hasExcelJs=await waitForExcelJs(5000);
      if(hasExcelJs)await buildExcelJs(sets,depts);else buildSheetJs(sets,depts);
      if(typeof window.addAudit==='function')window.addAudit('GRC_EXPORT_EXCEL','Exported GRC Excel: '+pages.join(', '));
    }catch(e){alert('Excel export failed: '+String(e&&e.message||e));}
  };

  function parsePage(id){
    var live=document.querySelector('#grc-page-'+id);
    if(live)return live.cloneNode(true);
    var tmp=document.createElement('div');tmp.innerHTML=typeof window._grcGetPageHtml==='function'?window._grcGetPageHtml(id):'';return tmp;
  }
  function cleanPrintNode(node){
    if(!node)return node;
    node.querySelectorAll('button,input,select,textarea,.grc-hero-actions,.grc-admin-actions,.grc-inline-crud-actions,.grc-export-actions,.adv-module-grid,.adv-filters,.grc-dept-bar').forEach(function(x){x.remove();});
    node.querySelectorAll('[onclick]').forEach(function(x){x.removeAttribute('onclick');x.removeAttribute('tabindex');x.removeAttribute('role');});
    node.querySelectorAll('.is-active').forEach(function(x){if(x.classList.contains('grc-tab')||x.classList.contains('adv-module-card'))x.classList.remove('is-active');});
    return node;
  }
  function executiveReportParts(){
    var page=parsePage('executive'),parts=[];
    var hero=page.querySelector('.grc-hero');if(hero)parts.push({title:'Executive Overview',node:cleanPrintNode(hero.cloneNode(true))});
    var modulesGrid=page.querySelector('.grc-module-grid');if(modulesGrid)parts.push({title:'Governance Tools',node:cleanPrintNode(modulesGrid.cloneNode(true))});
    Array.prototype.slice.call(page.querySelectorAll('.grc-exec-domain')).forEach(function(sec,i){
      var titleNode=sec.querySelector('.grc-exec-domain-head h2'),title=(titleNode&&titleNode.textContent||('Section '+(i+1))).trim();
      parts.push({title:title,node:cleanPrintNode(sec.cloneNode(true))});
    });
    return parts;
  }
  window._grcOpenReportSelector=function(){
    REPORT_PARTS=executiveReportParts();
    var opts=REPORT_PARTS.map(function(part,i){return'<label class="grc-export-check"><input type="checkbox" name="grcReportSection" value="'+i+'" checked><span>'+esc((i+1)+'. '+part.title)+'</span></label>';}).join('');
    if(!opts)opts='<div style="padding:12px;color:#8A4650">No Executive Command sections were found. Reload the page and try again.</div>';
    overlay('GRC Executive Command Report','Select any content shown on the Executive Command page. Initiatives and all overview sections are included.','<div class="grc-export-section"><h3>Report Sections</h3><div class="grc-export-check-grid">'+opts+'</div></div>','Build Report','window._grcGenerateReport()');
  };
  function collectedStyles(){
    var base='<base href="'+esc(document.baseURI)+'">';
    var css=Array.prototype.map.call(document.querySelectorAll('link[rel="stylesheet"],style'),function(x){return x.outerHTML;}).join('');
    var extra='<style>html,body{margin:0;background:#fff;color:#152538;font-family:Arial,"Segoe UI",sans-serif}.grc-print-header{display:flex;align-items:center;gap:18px;padding:18px 22px;border-bottom:4px solid #00A3C4;background:#152538;color:#fff}.grc-print-header img{width:78px;height:58px;object-fit:contain;background:#fff;border-radius:8px;padding:4px}.grc-print-header h1{font-size:20px;margin:0 0 4px}.grc-print-header p{font-size:10px;margin:0;color:#D4E0E8}.grc-print-meta{padding:9px 22px;background:#EFF5F8;border-bottom:1px solid #D6E2EE;font-size:9px;color:#52657A}.grc-print-body{padding:18px 22px}.grc-print-section{break-inside:avoid;margin:0 0 24px}.grc-print-section-title{display:flex;align-items:center;gap:7px;font-size:16px;color:#152538;border-bottom:3px solid #00A3C4;padding-bottom:7px;margin:0 0 12px}.grc-print-number{display:inline-grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#00A3C4;color:#fff;font-weight:900}.grc-card,.grc-metric-card,.grc-chart-card,.grc-department-panel,.grc-exec-domain{box-shadow:none!important;break-inside:avoid!important}.grc-table-wrap,.adv-table-wrap{overflow:visible!important}table{min-width:0!important;width:100%!important;font-size:7px!important}button,input,select,textarea,.grc-hero-actions,.grc-admin-actions,.grc-export-actions,.adv-module-grid,.adv-filters{display:none!important}@page{size:A4 landscape;margin:10mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>';
    return base+css+extra;
  }
  function printDocument(title,subtitle,content){
    var win=window.open('','_blank');
    if(!win){alert('The report window was blocked. Allow pop-ups for this site and try again.');return false;}
    var logo=(document.querySelector('#grcApp .grc-logo img')||document.getElementById('logoImg')||{}).src||'';
    var html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+esc(title)+'</title>'+collectedStyles()+'</head><body><div class="grc-print-header">'+(logo?'<img src="'+esc(logo)+'" alt="QUMC">':'')+'<div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div></div><div class="grc-print-meta">Generated: '+new Date().toLocaleString('en-GB')+' · Qassim University Medical City · Facility Management & Safety Division</div><div class="grc-print-body">'+content+'</div><script>window.addEventListener("load",function(){var imgs=Array.from(document.images);Promise.all(imgs.map(function(i){return i.complete?Promise.resolve():new Promise(function(r){i.onload=i.onerror=r;});})).then(function(){setTimeout(function(){window.focus();window.print();},350);});});<\/script></body></html>';
    win.document.open();win.document.write(html);win.document.close();return true;
  }
  window._grcGenerateReport=function(){
    var chosen=checked('grcReportSection').map(Number);
    if(!chosen.length){alert('Select at least one report section.');return;}
    if(!REPORT_PARTS.length)REPORT_PARTS=executiveReportParts();
    var html='';chosen.forEach(function(i,n){var part=REPORT_PARTS[i];if(!part)return;html+='<section class="grc-print-section"><h2 class="grc-print-section-title"><span class="grc-print-number">'+(n+1)+'</span>'+esc(part.title)+'</h2>'+part.node.outerHTML+'</section>';});
    if(!html){alert('The selected sections could not be prepared. Reload the page and try again.');return;}
    closeOverlay();
    if(printDocument('GRC Executive Command Report','Selected Executive Command indicators, charts and results',html)&&typeof window.addAudit==='function')window.addAudit('GRC_REPORT_PDF','Generated Executive Command report');
  };

  window._grcToggleExportMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('grcExportMenu');if(m)m.classList.toggle('is-open');};
  document.addEventListener('click',function(e){var m=document.getElementById('grcExportMenu');if(m&&!e.target.closest('.grc-export-menu-wrap'))m.classList.remove('is-open');});
  window._grcExportPage=function(id){
    var menu=document.getElementById('grcExportMenu');if(menu)menu.classList.remove('is-open');
    var mods=modules(),ids=id==='all'?mods.map(function(x){return x.id;}):[id],html='';
    ids.forEach(function(pid,n){
      var page=cleanPrintNode(parsePage(pid)),label=PAGE_LABELS[pid]||(mods.find(function(x){return x.id===pid;})||{}).label||pid;
      html+='<section class="grc-print-section"'+(n?' style="page-break-before:always"':'')+'><h2 class="grc-print-section-title"><span class="grc-print-number">'+(n+1)+'</span>'+esc(label)+'</h2>'+page.innerHTML+'</section>';
    });
    if(!html){alert('The selected page could not be prepared for export.');return;}
    if(printDocument(id==='all'?'GRC Workspace — All Pages':(PAGE_LABELS[id]||id),'Formatted page export',html)&&typeof window.addAudit==='function')window.addAudit('GRC_PAGE_EXPORT','Exported GRC page: '+id);
  };
})();
