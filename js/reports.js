/* ===========================================================
   QUMC Dashboard  --  reports.js
   All export and report rendering.

   Functions:
     exportExcel()          -- trigger Excel download
     _buildExcelXLSX()      -- XLSX via ExcelJS (full)
     _buildExcelFull()      -- XLSX fallback (SheetJS)
     _buildExcelSimple()    -- Simple XLSX (SheetJS)
     emptyStateExec()       -- exec page empty state
     toggleExportMenu()     -- show/hide export dropdown
     openExportPDF()        -- open print-to-PDF modal
     closeExportPDF()       -- close print modal
     renderReport()         -- render the Reports page
     rptStartEdit()         -- inline report text edit
     rptDoneEdit()          -- save inline edit
     _drawBarChart()        -- report bar chart
     _drawLineChart()       -- report line chart
     _drawDonut()           -- report donut chart
     exportWordDoc()        -- Word (.docx) export

   Depends on:
     kpi.js       (ST, F, lang, allK, filt, qv, ok, htmlEsc,
                   addAudit, toast)
     External libs: ExcelJS (window.ExcelJS), SheetJS (XLSX)
   =========================================================== */

function exportExcel(){
  addAudit('EXPORT_EXCEL','Excel export downloaded','Filters: dept='+F.dept+' year='+F.year,'Excel file');
  toast(lang==='ar'?'جاري تحضير ملف Excel...':'Building Excel report...');
  setTimeout(()=>_buildExcelFull(),80);
}
function exportExcel_UNUSED(){/* XLSX library kept for future use */
  if(typeof XLSX!=='undefined'){
  const script=document.createElement('script');
  script.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload=()=>{_buildExcelXLSX();};
  script.onerror=()=>{_buildExcelSimple();};
  document.head.appendChild(script);
  }
} /* ← function closed */

/* == SheetJS XLSX — two sheets, works on Mac/PC/LibreOffice == */
function _buildExcelXLSX(){
  const ks=filt();
  const depts=['maintenance','safety','housekeeping','projects'];
  const missKsAll=ks.filter(k=>ok(k)===false);
  const qLbl=F.qtr.includes('all')?'All Quarters':F.qtr.map(q=>q.toUpperCase()).join('+');

  /* ── Sheet 1: KPI Report ── */
  const sh1=[];
  sh1.push(['KPI Performance Report — Facilities & Safety Division — Qassim University Medical City']);
  sh1.push(['Period: '+(F.year==='all'?'All Years':F.year)+' '+qLbl+' | Generated: '+new Date().toLocaleDateString('en-GB')+' | Total: '+ks.length+' | Met: '+ks.filter(k=>ok(k)===true).length+' | Missed: '+ks.filter(k=>ok(k)===false).length]);
  sh1.push([]);
  sh1.push(['Code','KPI Name','Dept','Target','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Avg','YoY Q1','Annual YoY','Risk Tier','Status']);

  depts.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    sh1.push([DM[d].abbr+' — '+DM[d].en]);
    dk.forEach(k=>{
      const v=qv(k),a=ok(k);
      const allV=[k.q1,k.q2,k.q3,k.q4].filter(x=>x!==null);
      const avgV=allV.length?+(allV.reduce((x,y)=>x+y)/allV.length).toFixed(1):null;
      const yoyQ=k.yoy!=null&&k.q1!=null?+(k.q1-k.yoy).toFixed(1):null;
      const annYoY=avgV!=null&&k.yoy!=null?+(avgV-k.yoy).toFixed(1):null;
      sh1.push([
        k.id, k.nameEn, DM[d].en, k.target+'%',
        k.q1!=null?k.q1+'%':'—', k.q2!=null?k.q2+'%':'—',
        k.q3!=null?k.q3+'%':'—', k.q4!=null?k.q4+'%':'—',
        k.yr===2026&&k.q1!=null?k.q1+'%':'—',
        avgV!=null?avgV+'%':'—',
        yoyQ!=null?(yoyQ>0?'▲ ':'▼ ')+Math.abs(yoyQ)+'%':'—',
        annYoY!=null?(annYoY>0?'▲ ':'▼ ')+Math.abs(annYoY)+'%':'—',
        'T'+(k.tier||3),
        a===null?'Pending':a?' Met':' Missed'
      ]);
    });
  });

  /* ── Sheet 2: Gap Analysis ── */
  const sh2=[];
  sh2.push(['Gap Analysis — Missed KPIs Corrective Action Register']);
  sh2.push(['Qassim University Medical City — Facilities & Safety Division']);
  sh2.push([]);
  sh2.push(['Code','KPI Name','Dept','Result','Gap','Priority','Action Status','Root Cause / Gap Reasons (EN)','Corrective Actions (EN)']);

  if(missKsAll.length){
    missKsAll.forEach(k=>{
      const v=qv(k);
      const gd=(ST?.gaps||{})[k.id]||{};
      const ac=(ST?.actions||{})[k.id]||{};
      const gap=v!=null?(k.target-v).toFixed(1)+'%':'—';
      sh2.push([
        k.id, k.nameEn, DM[k.dept].en,
        v!=null?v.toFixed(1)+'%':'—', gap,
        ac.priority||gd.priority||'Medium',
        ac.status||gd.status||'Open',
        gd.gapEn||'Not documented',
        gd.actEn||'Not documented'
      ]);
    });
  } else {
    sh2.push(['No Missed KPIs in the selected filter period.']);
  }

  /* Build workbook */
  const wb=XLSX.utils.book_new();
  const ws1=XLSX.utils.aoa_to_sheet(sh1);
  const ws2=XLSX.utils.aoa_to_sheet(sh2);

  /* Set column widths */
  ws1['!cols']=[{wch:12},{wch:40},{wch:16},{wch:8},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:12},{wch:14},{wch:8},{wch:12}];
  ws2['!cols']=[{wch:12},{wch:40},{wch:16},{wch:10},{wch:10},{wch:10},{wch:16},{wch:40},{wch:40}];

  XLSX.utils.book_append_sheet(wb,ws1,'KPI Report');
  XLSX.utils.book_append_sheet(wb,ws2,'Gap Analysis');

  /* Download as .xlsx */
  XLSX.writeFile(wb,'KPI_Report_'+F.year+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
  toast(lang==='ar'?' تم تحميل Excel — شيتان: KPI Report + Gap Analysis':' Excel downloaded — 2 sheets: KPI Report + Gap Analysis');
}
/* ── Simple HTML-table Excel (100% browser compatible) ── */
function _buildExcelFull(){
  if(typeof ExcelJS==='undefined'){_buildExcelSimple();return;}
  const ks=filt();
  const miss=ks.filter(k=>ok(k)===false);
  const depts=['maintenance','safety','housekeeping','projects'];
  const today=new Date().toLocaleDateString('en-GB');
  const qLbl=F.qtr.includes('all')?'All Quarters':F.qtr.map(q=>q.toUpperCase()).join('+');
  const period=(F.year==='all'?'All Years':F.year)+' '+qLbl;

  const wb=new ExcelJS.Workbook();
  wb.creator='QUMC KPI Dashboard';wb.created=new Date();

  /* ── helpers ── */
  const argb=hex=>hex.replace('#','').toUpperCase().padStart(8,'FF');
  const fl=c=>({type:'pattern',pattern:'solid',fgColor:{argb:argb(c)}});
  const ft=(color,size,bold)=>({name:'Calibri',color:{argb:argb(color)},size:size||10,bold:!!bold});
  const al=(h,v)=>({horizontal:h||'center',vertical:v||'middle',wrapText:true});
  const bd=()=>({top:{style:'thin',color:{argb:'FFE2E8F0'}},left:{style:'thin',color:{argb:'FFE2E8F0'}},bottom:{style:'thin',color:{argb:'FFE2E8F0'}},right:{style:'thin',color:{argb:'FFE2E8F0'}}});
  const sc=(row,col,val,fillHex,fontColor,fontSize,bold,alignH)=>{
    const c=row.getCell(col);c.value=val;
    if(fillHex)c.fill=fl(fillHex);
    c.font=ft(fontColor||'#1E293B',fontSize||10,bold);
    c.alignment=al(alignH||'center');
    c.border=bd();
    return c;
  };

  /* ============ SHEET 1: KPI Report ============ */
  /* Logo */
  let _logoImgId=-1;
  try{
    const _li=document.getElementById('logoImg');
    if(_li&&_li.src&&_li.src.length>100){
      const _ext=_li.src.startsWith('data:image/png')?'png':'jpeg';
      _logoImgId=wb.addImage({base64:_li.src.split(',')[1],extension:_ext});
    }
  }catch(_e){}

  const ws1=wb.addWorksheet('KPI Report',{views:[{showGridLines:false}]});
  ws1.columns=[
    {width:12},{width:38},{width:14},{width:8},
    {width:10},{width:8},{width:8},{width:8},{width:8},
    {width:8},{width:10},{width:8},{width:10}
  ];

  /* Logo — read from existing img element in page */
  try{
    const logoEl=document.getElementById('logoImg');
    if(logoEl&&logoEl.src&&logoEl.src.startsWith('data:')){
      const ext=logoEl.src.includes('png')?'png':'jpeg';
      const b64=logoEl.src.split(',')[1];
      const imgId=wb.addImage({base64:b64,extension:ext});
      ws1.addImage(imgId,{tl:{col:0,row:0},ext:{width:75,height:48},editAs:'oneCell'});
    }
  }catch(e){}

    if(_logoImgId>=0){
    try{ws1.addImage(_logoImgId,{tl:{col:0,row:0},ext:{width:80,height:50},editAs:'oneCell'});}catch(_e){}
  }

  /* Title */
  ws1.mergeCells('A1:M1');
  const t1=ws1.getCell('A1');
  t1.value='Qassim University Medical City — Facilities & Safety Division — KPI Report';
  t1.fill=fl('#152538');t1.font=ft('#FFFFFF',16,true);t1.alignment=al('center');

  /* Subtitle */
  ws1.mergeCells('A2:M2');
  const s1=ws1.getCell('A2');
  s1.value='Period: '+period+' | Generated: '+today+' | Total: '+ks.length+' KPIs | Met: '+ks.filter(k=>ok(k)===true).length+' | Missed: '+miss.length;
  s1.fill=fl('#1E3356');s1.font=ft('#FFFFFF',10,false);s1.alignment=al('center');

  /* Spacer */
  ws1.addRow([]);

  /* Column headers */
  const hdrs=['Code','KPI Name','Department','Year','Target','Q1','Q2','Q3','Q4','Avg','YoY','Risk','Status'];
  const hr=ws1.addRow(hdrs);
  hr.eachCell(c=>{c.fill=fl('#152538');c.font=ft('#FFFFFF',10,true);c.alignment=al('center');c.border=bd();});
  ws1.getRow(4).height=22;

  /* KPI data rows */
  let rowNum=0;
  depts.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    const dm=DM[d];
    const dr=ws1.addRow([dm.abbr+' — '+dm.en]);
    ws1.mergeCells('A'+(rowNum+5)+':M'+(rowNum+5));
    dr.getCell(1).fill=fl('#1E3356');dr.getCell(1).font=ft('#FFFFFF',11,true);
    dr.getCell(1).alignment=al('left');
    dr.height=20;rowNum++;

    dk.forEach(k=>{
      const v=qv(k),a=ok(k);
      const allV=[k.q1,k.q2,k.q3,k.q4].filter(x=>x!==null);
      const avg=allV.length?+(allV.reduce((x,y)=>x+y)/allV.length).toFixed(1):null;
      const yoy=k.yoy!=null&&avg!=null?+(avg-k.yoy).toFixed(1):null;
      const statTxt=a===null?'Pending':a?'✓ Met':'✗ Missed';
      const statFill=a===null?'#F8FAFC':a?'#DCFCE7':'#FEE2E2';
      const statColor=a===null?'#94A3B8':a?'#166534':'#991B1B';
      const tierFill=k.tier===1?'#FEF2F2':k.tier===2?'#FFFBEB':'#EFF6FF';
      const tierColor=k.tier===1?'#7F1D1D':k.tier===2?'#713F12':'#1E40AF';
      const bg=rowNum%2===0?'#FFFFFF':'#F8FAFC';
      const qCell=q=>q!=null?q.toFixed(1)+'%':'—';
      const dr2=ws1.addRow([
        k.id, k.nameEn, DM[d].en, k.yr||2025, (k.op==='='?'=':'≥')+k.target+'%',
        qCell(k.q1),qCell(k.q2),qCell(k.q3),qCell(k.q4),
        avg!=null?avg.toFixed(1)+'%':'—',
        yoy!=null?(yoy>0?'▲ ':'▼ ')+Math.abs(yoy).toFixed(1)+'%':'—',
        'T'+(k.tier||3),
        statTxt
      ]);
      dr2.eachCell((c,i)=>{
        c.fill=fl(bg);c.border=bd();c.alignment=al('center');c.font=ft('#334155',10);
      });
      dr2.getCell(1).font=ft('#006D7F',10,true);dr2.getCell(1).fill=fl('#E0F7FA');
      dr2.getCell(2).alignment=al('left');dr2.getCell(2).font=ft('#1E293B',10);
      dr2.getCell(4).font=ft('#475569',10,true);
      dr2.getCell(12).fill=fl(tierFill);dr2.getCell(12).font=ft(tierColor,10,true);
      dr2.getCell(13).fill=fl(statFill);dr2.getCell(13).font=ft(statColor,10,true);
      rowNum++;
    });
    ws1.addRow([]);rowNum++;
  });

  /* Footer */
  const lastR=ws1.lastRow.number+1;
  ws1.mergeCells('A'+lastR+':M'+lastR);
  const fr=ws1.getCell('A'+lastR);
  fr.value='QUMC KPI Command Center · Governance & Performance · '+today;
  fr.fill=fl('#F8FAFC');fr.font=ft('#94A3B8',8,false);fr.alignment=al('center');

  /* ============ SHEET 2: Gap Analysis ============ */
  const ws2=wb.addWorksheet('Gap Analysis',{views:[{showGridLines:false}]});
  ws2.columns=[
    {width:12},{width:38},{width:14},{width:10},
    {width:10},{width:10},{width:16},{width:22},{width:16},{width:16},{width:40},{width:40}
  ];

  /* Title */
  ws2.mergeCells('A1:L1');
  const t2=ws2.getCell('A1');
  t2.value='Gap Analysis — Missed KPIs Corrective Action Register';
  t2.fill=fl('#7F1D1D');t2.font=ft('#FFFFFF',16,true);t2.alignment=al('center');

  /* Subtitle */
  ws2.mergeCells('A2:L2');
  const s2=ws2.getCell('A2');
  s2.value='Qassim University Medical City · Facilities & Safety Division · '+today+' | Period: '+period;
  s2.fill=fl('#991B1B');s2.font=ft('#FFFFFF',10,false);s2.alignment=al('center');

  ws2.addRow([]);

  /* Column headers */
  const gHdrs=['Code','KPI Name','Dept','Target','Result','Gap','Priority','Responsible Person','Due Date','Status','Root Cause','Corrective Action'];
  const gh=ws2.addRow(gHdrs);
  gh.eachCell(c=>{c.fill=fl('#7F1D1D');c.font=ft('#FFFFFF',10,true);c.alignment=al('center');c.border=bd();});

  if(miss.length){
    miss.forEach((k,i)=>{
      const v=qv(k);
      const gap=v!=null?(k.target-v).toFixed(1)+'%':'—';
      const gd=(ST?.gaps||{})[k.id]||{};
      const ac=(ST?.actions||{})[k.id]||{};
      const pri=(ac.priority||gd.priority||'Medium');
      const sta=(ac.status||gd.status||'Open');
      const priFill=pri.toLowerCase()==='critical'?'#FEE2E2':pri.toLowerCase()==='high'?'#FEF9C3':'#F0FDF4';
      const priFg=pri.toLowerCase()==='critical'?'#7F1D1D':pri.toLowerCase()==='high'?'#713F12':'#166534';
      const bg=i%2===0?'#FFF5F5':'#FEF2F2';
      const owner=(gd.owner||gd.responsible||gd.responsiblePerson||ac.owner||ac.responsible||DEPT_OWNERS?.[k.dept]||'—');
      const due=(gd.due||gd.dueDate||gd.date||ac.due||ac.dueDate||'—');
      const root=(gd.gapEn||gd.rootCause||gd.cause||'Not documented');
      const corrective=(gd.actEn||gd.correctiveAction||gd.action||ac.action||ac.correctiveAction||'Not documented');
      const gr=ws2.addRow([
        k.id,k.nameEn,DM[k.dept]?.abbr||k.dept,
        (k.op==='='?'=':'≥')+k.target+'%',
        v!=null?v.toFixed(1)+'%':'—', gap, pri, owner, due, sta, root, corrective
      ]);
      gr.eachCell((c,j)=>{c.fill=fl(bg);c.border=bd();c.alignment=al('center');c.font=ft('#334155',10);});
      gr.getCell(1).fill=fl('#FFF5F5');gr.getCell(1).font=ft('#C42B2B',10,true);
      gr.getCell(2).alignment=al('left');
      gr.getCell(5).fill=fl('#FEE2E2');gr.getCell(5).font=ft('#991B1B',10,true);
      gr.getCell(6).fill=fl('#FEE2E2');gr.getCell(6).font=ft('#991B1B',10,true);
      gr.getCell(7).fill=fl(priFill);gr.getCell(7).font=ft(priFg,10,true);
      gr.getCell(8).alignment=al('left');gr.getCell(10).font=ft('#991B1B',10,true);gr.getCell(11).alignment=al('left');gr.getCell(12).alignment=al('left');gr.getCell(11).font=ft('#334155',9);gr.getCell(12).font=ft('#334155',9);
      gr.height=40;
    });
  }else{
    const er=ws2.addRow(['All KPIs Met Their Targets — No gap analysis required for this period.']);
    ws2.mergeCells('A5:L5');
    er.getCell(1).fill=fl('#ECFDF5');er.getCell(1).font=ft('#06845A',12,true);er.getCell(1).alignment=al('center');
  }

  /* Download */
  wb.xlsx.writeBuffer().then(buf=>{
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download='QUMC_KPI_Report_'+(F.year==='all'?'All':F.year)+'_'+new Date().toISOString().slice(0,10)+'.xlsx';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast(' Excel downloaded — 2 sheets: KPI Report + Gap Analysis');
  }).catch(()=>{_buildExcelSimple();});
}

function _buildExcelSimple(){
  const ks=filt(),depts=['maintenance','safety','housekeeping','projects'];
  const miss=ks.filter(k=>ok(k)===false);
  const metKs=ks.filter(k=>ok(k)===true);
  const period=(F.year==='all'?'2025–2026':F.year)+(F.qtr.includes('all')?' (Full Year)':' ('+F.qtr.map(q=>q.toUpperCase()).join('+')+')')
  const today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const avgs=ks.map(k=>qv(k)).filter(v=>v!==null);
  const avg=avgs.length?+(avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(1):null;

  /* ── inline style shortcuts ── */
  const e=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const td=(txt,bg,fg,extra)=>{fg=fg||'#1E293B';extra=extra||'';return `<td bgcolor="${bg}" style="color:${fg};${extra};font-family:Calibri,Arial;font-size:10pt;padding:7px 10px;border:1px solid #E2E8F0">${e(txt)}</td>`;};
  
  const th=(txt,bg='#00A3C4',fg='#FFFFFF',extra='')=>`<th bgcolor="${bg}" style="color:${fg};${extra};font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:9px 10px;border:1px solid #007A96;text-align:center">${e(txt)}</th>`;
  const qCell=(v,tgt)=>{
    if(v===null)return td('—','#F8FAFC','#CBD5E1','text-align:center');
    const ok2=v>=tgt;
    return td(v.toFixed(1)+'%',ok2?'#DCFCE7':'#FEE2E2',ok2?'#166534':'#991B1B','text-align:center;font-weight:bold');
  };
  const statusCell=(a,odd)=>{
    if(a===true)return td(' Met','#ECFDF5','#06845A','text-align:center;font-weight:bold');
    if(a===false)return td(' Missed','#FEF2F2','#C42B2B','text-align:center;font-weight:bold');
    return td('Pending','#F8FAFC','#94A3B8','text-align:center');
  };

  /* ===============================
     SHEET 1: KPI REPORT
  =============================== */
  let t1=`<table style="border-collapse:collapse;width:100%">`;

  /* Title */
  t1+=`<tr><td colspan="13" bgcolor="#152538" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:16pt;font-weight:bold;padding:14px 18px;border:none;text-align:center">
    Qassim University Medical City — Facilities &amp; Safety Division
  </td></tr>`;
  t1+=`<tr><td colspan="13" bgcolor="#1E3356" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:10pt;font-weight:bold;padding:7px 18px;border:none">
    KPI Performance Report · Governance &amp; Performance Department
  </td></tr>`;
  t1+=`<tr><td colspan="13" bgcolor="#EBF5F7" style="color:#475569;font-family:Calibri,Arial;font-size:9pt;font-style:italic;padding:6px 18px;border:none;text-align:center">
    Period: ${period} &nbsp;|&nbsp; Generated: ${today} &nbsp;|&nbsp; Total: ${ks.length} &nbsp;|&nbsp; Met: ${metKs.length} &nbsp;|&nbsp; Missed: ${miss.length}
  </td></tr>`;
  t1+=`<tr><td colspan="13" style="padding:6px;border:none"></td></tr>`;

  /* Summary strip */
  t1+=`<tr>
    <td colspan="2" bgcolor="#374151" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 12px;text-align:center;border:1px solid #4B5563">TOTAL KPIs</td>
    <td colspan="2" bgcolor="#374151" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 12px;text-align:center;border:1px solid #4B5563">MET TARGET</td>
    <td colspan="2" bgcolor="#374151" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 12px;text-align:center;border:1px solid #4B5563">MISSED</td>
    <td colspan="2" bgcolor="#374151" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 12px;text-align:center;border:1px solid #4B5563">AVG SCORE</td>
    <td colspan="6" style="border:none"></td>
  </tr>`;
  t1+=`<tr>
    <td colspan="2" bgcolor="#EFF6FF" style="color:#152538;font-family:Calibri,Arial;font-size:22pt;font-weight:bold;padding:12px;text-align:center;border:1px solid #BFDBFE">${ks.length}</td>
    <td colspan="2" bgcolor="#ECFDF5" style="color:#06845A;font-family:Calibri,Arial;font-size:22pt;font-weight:bold;padding:12px;text-align:center;border:1px solid #A7F3D0">${metKs.length}</td>
    <td colspan="2" bgcolor="${miss.length?'#FEF2F2':'#ECFDF5'}" style="color:${miss.length?'#C42B2B':'#06845A'};font-family:Calibri,Arial;font-size:22pt;font-weight:bold;padding:12px;text-align:center;border:1px solid ${miss.length?'#FECACA':'#A7F3D0'}">${miss.length}</td>
    <td colspan="2" bgcolor="${avg&&avg>=90?'#ECFDF5':'#FEF2F2'}" style="color:${avg&&avg>=90?'#06845A':'#C42B2B'};font-family:Calibri,Arial;font-size:22pt;font-weight:bold;padding:12px;text-align:center;border:1px solid ${avg&&avg>=90?'#A7F3D0':'#FECACA'}">${avg!==null?avg+'%':'N/A'}</td>
    <td colspan="6" style="border:none"></td>
  </tr>`;
  t1+=`<tr><td colspan="13" style="padding:5px;border:none"></td></tr>`;

  /* Column headers */
  t1+=`<tr>
    ${th('Code','#152538')}
    ${th('KPI Name (EN)','#152538','#FFFFFF','text-align:center')}
    ${th('Dept','#152538')}
    ${th('Target','#152538')}
    ${th('Q1 2025','#00A3C4')}
    ${th('Q2 2025','#00A3C4')}
    ${th('Q3 2025','#00A3C4')}
    ${th('Q4 2025','#00A3C4')}
    ${th('Avg','#152538')}
    ${th('YoY','#152538')}
    ${th('Risk','#152538')}
    ${th('Status','#152538')}
    ${th('Year','#1E3356')}
  </tr>`;

  /* KPI rows by dept */
  let rowNum=0;
  depts.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    t1+=`<tr><td colspan="13" bgcolor="#1E3356" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:10pt;font-weight:bold;padding:8px 14px;border:1px solid #1E3E6A;text-align:center">
      ${DM[d].abbr} — ${DM[d].en}
    </td></tr>`;
    dk.forEach(k=>{
      const v=qv(k),a=ok(k);
      const allV=[k.q1,k.q2,k.q3,k.q4].filter(x=>x!==null);
      const kAvg=allV.length?+(allV.reduce((x,y)=>x+y)/allV.length).toFixed(1):null;
      const yoy=k.yoy!=null&&kAvg!=null?+(kAvg-k.yoy).toFixed(1):null;
      const odd=rowNum%2===0;rowNum++;
      const rb='#FFFFFF';
      const tier=k.tier||3;
      const tBg=tier===1?'#FEF2F2':tier===2?'#FFFBEB':'#EFF6FF';
      const tFg=tier===1?'#7F1D1D':tier===2?'#713F12':'#1E40AF';
      t1+=`<tr>
        <td bgcolor="#E0F7FA" style="color:#006D7F;font-family:Courier New,Courier;font-weight:bold;font-size:9pt;padding:7px 10px;border:1px solid #BAE6FD;text-align:center">${e(k.id)}</td>
        <td bgcolor="${rb}" style="color:#1E293B;font-family:Calibri,Arial;font-size:9.5pt;padding:7px 10px;border:1px solid #E2E8F0;text-align:center">${e(k.nameEn)}</td>
        <td bgcolor="${rb}" style="color:#64748B;font-family:Calibri,Arial;font-size:9pt;padding:7px 10px;border:1px solid #E2E8F0;text-align:center">${e(DM[d].abbr)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:7px 10px;border:1px solid #E2E8F0;text-align:center">${k.op==='='?'=':'≥'}${k.target}%</td>
        ${qCell(k.q1,k.target)}
        ${qCell(k.q2,k.target)}
        ${qCell(k.q3,k.target)}
        ${qCell(k.q4,k.target)}
        ${kAvg!==null?td(kAvg+'%',kAvg>=k.target?'#ECFDF5':'#FEF2F2',kAvg>=k.target?'#06845A':'#C42B2B','text-align:center;font-weight:bold'):td('—','#F8FAFC','#CBD5E1','text-align:center')}
        ${yoy!==null?td((yoy>=0?'+':'')+yoy+'%',rb,yoy>=0?'#06845A':'#C42B2B','text-align:center;font-weight:bold'):td('—','#F8FAFC','#CBD5E1','text-align:center')}
        <td bgcolor="${tBg}" style="color:${tFg};font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:7px 8px;border:1px solid #E2E8F0;text-align:center">T${tier}</td>
        ${statusCell(a,odd)}
        <td bgcolor="${rb}" style="color:#64748B;font-family:Calibri,Arial;font-size:9pt;padding:7px 10px;border:1px solid #E2E8F0;text-align:center">${k.yr||2025}</td>
      </tr>`;
    });
    t1+=`<tr><td colspan="13" style="padding:3px;border:none"></td></tr>`;
  });

  /* Footer */
  t1+=`<tr><td colspan="13" bgcolor="#F8FAFC" style="color:#94A3B8;font-family:Calibri,Arial;font-size:8pt;font-style:italic;padding:6px 14px;border-top:2px solid #E2E8F0;text-align:center;border-bottom:none">
    QUMC KPI Command Center · Governance &amp; Performance Department · ${today}
  </td></tr>`;
  t1+=`</table>`;

  /* ===============================
     SHEET 2: GAP ANALYSIS
  =============================== */
  let t2=`<table style="border-collapse:collapse;width:100%">`;
  t2+=`<tr><td colspan="12" bgcolor="#7F1D1D" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:14pt;font-weight:bold;padding:14px 18px;border:none;text-align:center">
     Gap Analysis — Missed KPIs Corrective Action Register
  </td></tr>`;
  t2+=`<tr><td colspan="12" bgcolor="#991B1B" style="color:#FFFFFF;font-family:Calibri,Arial;font-size:9.5pt;font-weight:bold;padding:7px 18px;border:none;text-align:center">
    Qassim University Medical City · Facilities &amp; Safety Division · ${today} · Period: ${period}
  </td></tr>`;
  t2+=`<tr><td colspan="12" style="padding:5px;border:none"></td></tr>`;

  if(miss.length){
    t2+=`<tr>
      ${th('Code','#7F1D1D')}
      ${th('KPI Name','#7F1D1D','#FFFFFF','text-align:center')}
      ${th('Dept','#7F1D1D')}
      ${th('Target','#7F1D1D')}
      ${th('Result','#7F1D1D')}
      ${th('Gap','#7F1D1D')}
      ${th('Priority','#7F1D1D')}
      ${th('Responsible Person','#7F1D1D')}
      ${th('Due Date','#7F1D1D')}
      ${th('Status','#7F1D1D')}
      ${th('Root Cause','#7F1D1D','#FFFFFF','text-align:center')}
      ${th('Corrective Action','#7F1D1D','#FFFFFF','text-align:center')}
    </tr>`;
    miss.forEach((k,i)=>{
      const v=qv(k),gap=v!=null?(k.target-v).toFixed(1):null;
      const gd=(ST?.gaps||{})[k.id]||{},ac=(ST?.actions||{})[k.id]||{};
      const pri=(ac.priority||gd.priority||'medium').toLowerCase();
      const sta=(ac.status||gd.status||'open').toLowerCase();
      const priBg=pri==='critical'?'#FEE2E2':pri==='high'?'#FEF9C3':'#F0FDF4';
      const priFg=pri==='critical'?'#7F1D1D':pri==='high'?'#713F12':'#166534';
      const staBg=sta.includes('closed')?'#F0FDF4':sta.includes('progress')?'#FEF9C3':'#FEE2E2';
      const staFg=sta.includes('closed')?'#166534':sta.includes('progress')?'#713F12':'#7F1D1D';
      const owner=(gd.owner||gd.responsible||gd.responsiblePerson||ac.owner||ac.responsible||DEPT_OWNERS?.[k.dept]||'—');
      const due=(gd.due||gd.dueDate||gd.date||ac.due||ac.dueDate||'—');
      const root=(gd.gapEn||gd.rootCause||gd.cause||'Not documented');
      const corrective=(gd.actEn||gd.correctiveAction||gd.action||ac.action||ac.correctiveAction||'Not documented');
      const rb='#FFFFFF';
      t2+=`<tr>
        <td bgcolor="#FFF5F5" style="color:#C42B2B;font-family:Courier New,Courier;font-weight:bold;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;border-left:4px solid #C42B2B">${e(k.id)}</td>
        <td bgcolor="${rb}" style="color:#1E293B;font-family:Calibri,Arial;font-size:9.5pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(k.nameEn)}</td>
        <td bgcolor="${rb}" style="color:#64748B;font-family:Calibri,Arial;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(DM[k.dept]?.abbr||k.dept)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 10px;border:1px solid #FECACA;text-align:center">${k.op==='='?'=':'≥'}${k.target}%</td>
        <td bgcolor="#FEE2E2" style="color:#991B1B;font-family:Calibri,Arial;font-size:9.5pt;font-weight:bold;padding:8px 10px;border:1px solid #FECACA;text-align:center">${v!=null?v.toFixed(1)+'%':'N/A'}</td>
        <td bgcolor="#FEE2E2" style="color:#991B1B;font-family:Calibri,Arial;font-size:9.5pt;font-weight:bold;padding:8px 10px;border:1px solid #FECACA;text-align:center">${gap?gap+'%':'—'}</td>
        <td bgcolor="${priBg}" style="color:${priFg};font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 10px;border:1px solid #FECACA;text-align:center">${(pri||'medium').charAt(0).toUpperCase()+(pri||'medium').slice(1)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(owner)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(due)}</td>
        <td bgcolor="${staBg}" style="color:${staFg};font-family:Calibri,Arial;font-size:9pt;font-weight:bold;padding:8px 10px;border:1px solid #FECACA;text-align:center">${(sta||'open').charAt(0).toUpperCase()+(sta||'open').slice(1)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(root)}</td>
        <td bgcolor="${rb}" style="color:#334155;font-family:Calibri,Arial;font-size:9pt;padding:8px 10px;border:1px solid #FECACA;text-align:center">${e(corrective)}</td>
      </tr>`;
    });
  } else {
    t2+=`<tr><td colspan="12" bgcolor="#ECFDF5" style="color:#06845A;font-family:Calibri,Arial;font-size:11pt;font-weight:bold;padding:16px;text-align:center;border:1px solid #A7F3D0">
       All KPIs Met Their Targets — No gap analysis required for this period.
    </td></tr>`;
  }
  t2+=`</table>`;

  /* == Build two-sheet workbook as HTML with MSO namespace == */
  const workbook=`<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>KPI Report</x:Name>
  <x:WorksheetOptions><x:Selected/><x:DoNotDisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
<x:ExcelWorksheet><x:Name>Gap Analysis</x:Name>
  <x:WorksheetOptions><x:DoNotDisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
  br {mso-data-placement:same-cell;}
  td,th {mso-number-format:"@"; vertical-align:middle;}
</style>

<style id="_qumc_hotfix_layout">
/* Hotfix: restore executive summary bar and detailed KPI cards stacking */
#execGrid{align-items:start!important;}
#execIntelBar{margin-bottom:16px!important;}
#execKpiCards{display:block!important;clear:both!important;min-height:260px!important;}
#execGrid > .card.c12{margin-top:14px!important;position:relative!important;z-index:1!important;}
#backPortalBtn{font-family:var(--font)!important;}
</style>
</head>
<body>
${t1}
<div style="page-break-before:always;mso-break-type:section-break"></div>
${t2}




</body></html>`;

  const blob=new Blob(['\ufeff'+workbook],{type:'application/vnd.ms-excel;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='QUMC_KPI_Report_'+(F.year==='all'?'All':F.year)+'_'+new Date().toISOString().slice(0,10)+'.xls';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast(lang==='ar'?' تم تحميل Excel (2 شيتات مع الألوان)':' Premium Excel downloaded — KPI Report + Gap Analysis');
}

async function _buildExcel(){
  const ks=filt();
  const wb=new ExcelJS.Workbook();
  wb.creator='Qassim University Medical City';wb.created=new Date();
  const ws=wb.addWorksheet('KPI Report',{properties:{tabColor:{argb:'FF006766'}},views:[{rightToLeft:false}]});

  /* Colors — QUMC identity */
  const TEAL='FF006766',GREEN='FF1A7A4A',RED='FFB91C1C';
  const LGRE='FFD1FAE5',LRED='FFFEE2E2',WHITE='FFFFFFFF',DARK='FF0A2540';
  const mkFill=c=>({type:'pattern',pattern:'solid',fgColor:{argb:c}});
  const mkFont=(sz,bold,color)=>({name:'Calibri',size:sz,bold:!!bold,color:{argb:color||DARK}});
  const border={style:'thin',color:{argb:'FFCCDDDD'}};
  const allBorders={top:border,left:border,bottom:border,right:border};

  /* Logo */
  const logoId=wb.addImage({base64:'data:image/jpeg;base64,'+LOGO,extension:'jpeg'});
  ws.addImage(logoId,{tl:{col:0,row:0},ext:{width:140,height:70}});

  /* Col widths — extra column for Annual YoY */
  ws.columns=[{width:12},{width:38},{width:14},{width:8},{width:10},{width:10},{width:10},{width:10},{width:10},{width:8},{width:12},{width:14},{width:8},{width:12}];

  /* Rows 1-3: header block */
  ws.getRow(1).height=28;ws.getRow(2).height=18;ws.getRow(3).height=16;
  ws.mergeCells('C1:N1');
  const t1=ws.getCell('C1');
  t1.value='KPI Performance Report — Facilities & Safety Division';
  t1.font=mkFont(14,true,TEAL);t1.alignment={vertical:'middle',horizontal:'center'};

  ws.mergeCells('C2:N2');
  const t2=ws.getCell('C2');
  t2.value='Qassim University Medical City — Governance & Performance Department';
  t2.font=mkFont(10,false,DARK);t2.alignment={vertical:'middle',horizontal:'center'};

  ws.mergeCells('C3:N3');
  const t3=ws.getCell('C3');
  const qLbl=F.qtr.includes('all')?'All Quarters':F.qtr.map(q=>q.toUpperCase()).join('+');
  t3.value=`Period: ${F.year==='all'?'All Years':F.year} | ${qLbl} | Generated: ${new Date().toLocaleDateString('en-GB')} | Total KPIs: ${ks.length} | Met: ${ks.filter(k=>ok(k)===true).length} | Missed: ${ks.filter(k=>ok(k)===false).length}`;
  t3.font=mkFont(9,false,'FF64748B');t3.alignment={vertical:'middle',horizontal:'center'};
  ws.addRow([]);

  /* Header row — with Annual YoY column */
  const hdrs=['Code','KPI Name (EN)','Department','Target','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','AVG','YoY (Q1 vs PY Q1)','Annual YoY (Avg vs PY)','Risk','Status'];
  const hRow=ws.addRow(hdrs);hRow.height=22;
  hRow.eachCell(cell=>{cell.fill=mkFill(TEAL);cell.font=mkFont(10,true,WHITE);cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border=allBorders;});

  /* Data rows */
  const depts=['maintenance','safety','housekeeping','projects'];
  let rowIdx=0;
  depts.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    const dRow=ws.addRow([DM[d].abbr+' — '+DM[d].en]);
    ws.mergeCells(dRow.number,1,dRow.number,14);dRow.height=18;
    dRow.getCell(1).fill=mkFill(TEAL);
    dRow.getCell(1).font=mkFont(10,true,WHITE);
    dRow.getCell(1).alignment={horizontal:'left',vertical:'middle',indent:1};

    dk.forEach(k=>{
      const v=qv(k),a=ok(k);
      const allV=[k.q1,k.q2,k.q3,k.q4].filter(x=>x!==null);
      const avgV=allV.length?+(allV.reduce((x,y)=>x+y)/allV.length).toFixed(1):null;
      /* Quarterly YoY: Q1 current vs Q1 prior year */
      const yoyQ=k.yoy!==undefined&&k.yoy!==null&&k.q1!==null?+(k.q1-k.yoy).toFixed(1):null;
      /* Annual YoY: current avg vs prior year Q1 baseline */
      const annYoY=avgV!==null&&k.yoy!==null&&k.yoy!==undefined?+(avgV-k.yoy).toFixed(1):null;
      const row=ws.addRow([
        k.id, k.nameEn, DM[d].en, k.target+'%',
        k.q1!=null?k.q1+'%':'—', k.q2!=null?k.q2+'%':'—',
        k.q3!=null?k.q3+'%':'—', k.q4!=null?k.q4+'%':'—',
        k.yr===2026&&k.q1!=null?k.q1+'%':'—',
        avgV!=null?avgV+'%':'—',
        yoyQ!=null?(yoyQ>=0?'+':'')+yoyQ+'%':'—',
        annYoY!=null?(annYoY>=0?'+':'')+annYoY+'%':'—',
        'T'+(k.tier||3),
        a===null?'Pending':a?' Met':' Missed'
      ]);
      row.height=17;
      row.eachCell(cell=>{cell.fill=mkFill(WHITE);cell.font=mkFont(10,false,DARK);cell.alignment={vertical:'middle'};cell.border=allBorders;});
      [5,6,7,8,9].forEach(ci=>{
        const cell=row.getCell(ci);
        if(cell.value&&cell.value!=='—'){const val=parseFloat(cell.value);const met=val>=k.target;
          cell.fill=mkFill(met?LGRE:LRED);cell.font=mkFont(10,true,met?'FF065F46':'FF7F1D1D');cell.alignment={horizontal:'center',vertical:'middle'};}
      });
      if(avgV!==null){const aC=row.getCell(10);aC.fill=mkFill(avgV>=k.target?LGRE:LRED);aC.font=mkFont(10,true,avgV>=k.target?'FF065F46':'FF7F1D1D');aC.alignment={horizontal:'center',vertical:'middle'};}
      if(yoyQ!==null){const yC=row.getCell(11);yC.font=mkFont(10,true,yoyQ>=0?GREEN:RED);yC.alignment={horizontal:'center',vertical:'middle'};}
      if(annYoY!==null){const ayC=row.getCell(12);ayC.font=mkFont(10,true,annYoY>=0?GREEN:RED);ayC.alignment={horizontal:'center',vertical:'middle'};}
      const stC=row.getCell(14);
      if(a===true){stC.fill=mkFill(LGRE);stC.font=mkFont(10,true,'FF065F46');}
      else if(a===false){stC.fill=mkFill(LRED);stC.font=mkFont(10,true,'FF7F1D1D');}
      stC.alignment={horizontal:'center',vertical:'middle'};
      row.getCell(1).font=mkFont(10,true,TEAL);
      rowIdx++;
    });
  });

  /* ── Gap Analysis Sheet — always create as Sheet 2 ── */
  const missKs=filt().filter(k=>ok(k)===false);
  {
    const ws2=wb.addWorksheet('Gap Analysis',{properties:{tabColor:{argb:'FFB91C1C'}}});
    /* Title row */
    ws2.mergeCells('A1:L1');
    const titleRow=ws2.getRow(1);
    titleRow.getCell(1).value='Gap Analysis — Missed KPIs Corrective Action Register';
    titleRow.getCell(1).font={name:'Calibri',size:13,bold:true,color:{argb:'FFFFFFFF'}};
    titleRow.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF7B0D0D'}};
    titleRow.getCell(1).alignment={horizontal:'center',vertical:'middle'};
    titleRow.height=28;
    /* Subtitle row */
    ws2.mergeCells('A2:L2');
    const subRow=ws2.getRow(2);
    const subPeriod=(typeof F!=='undefined'&&F.year!=='all'?F.year:'2026')+(typeof F!=='undefined'&&!F.qtr.includes('all')?' ('+F.qtr.map(q=>q.toUpperCase()).join(', ')+')':'(Q1)');
    subRow.getCell(1).value='Qassim University Medical City  Facilities & Safety Division  '+new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})+'  Period: '+subPeriod;
    subRow.getCell(1).font={name:'Calibri',size:10,bold:false,color:{argb:'FFFFFFFF'}};
    subRow.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF9B1C1C'}};
    subRow.getCell(1).alignment={horizontal:'center',vertical:'middle'};
    subRow.height=18;
    /* Empty row */
    ws2.getRow(3).height=6;
    /* Header row */
    ws2.columns=[{width:10},{width:38},{width:8},{width:9},{width:9},{width:9},{width:12},{width:10},{width:42}];
    const hdr=['Code','KPI Name','Dept','Target','Result','Gap','Priority','Status','Root Cause & Corrective Action'];
    const hdrRow=ws2.addRow(hdr);
    hdrRow.height=22;
    hdrRow.eachCell((cell,ci)=>{
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF5A0000'}};
      cell.font={name:'Calibri',size:10,bold:true,color:{argb:'FFFFFFFF'}};
      cell.alignment={horizontal:'center',vertical:'middle',wrapText:false};
      cell.border={top:{style:'thin',color:{argb:'FFDD4444'}},bottom:{style:'medium',color:{argb:'FFDD4444'}},left:{style:'thin',color:{argb:'FF7B0D0D'}},right:{style:'thin',color:{argb:'FF7B0D0D'}}};
    });
    /* Data rows */
    if(missKs.length){
      missKs.forEach((k,i)=>{
        const v=qv(k);
        const tgt=k.target;
        const gap=v!==null?(v-tgt).toFixed(1):'—';
        const gapStr=v!==null?(v>=tgt?'+'+gap:gap)+'%':'—';
        const gd=(ST?.gaps||{})[k.id]||{};
        const ac=(ST?.actions||{})[k.id]||{};
        const priority=(k.tier||3)===1?'High':'Medium';
        const bgColor=i%2===0?'FFFFFFFF':'FFFFF8F8';
        const row=ws2.addRow([
          k.id,
          k.nameEn,
          DM[k.dept]?.abbr||k.dept,
          tgt+'%',
          v!==null?v.toFixed(1)+'%':'—',
          gapStr,
          priority,
          ac.status||'Open',
          gd.gapEn||ac.action||'Not documented'
        ]);
        row.height=18;
        row.eachCell((cell,ci)=>{
          cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:bgColor}};
          cell.font={name:'Calibri',size:10,bold:ci===1,color:{argb:'FF1A1A1A'}};
          cell.alignment={horizontal:ci<=1?'center':'left',vertical:'middle',wrapText:ci===9};
          cell.border={top:{style:'thin',color:{argb:'FFE2E8F0'}},bottom:{style:'thin',color:{argb:'FFE2E8F0'}},left:{style:'thin',color:{argb:'FFCCCCCC'}},right:{style:'thin',color:{argb:'FFCCCCCC'}}};
        });
        /* Code cell — colored like image */
        const codeCell=row.getCell(1);
        codeCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF0F0'}};
        codeCell.font={name:'Calibri',size:10,bold:true,color:{argb:'FFB91C1C'}};
        codeCell.alignment={horizontal:'center',vertical:'middle'};
        /* Result cell — red since below target */
        const resCell=row.getCell(5);
        resCell.font={name:'Calibri',size:10,bold:true,color:{argb:'FF991B1B'}};
        /* Gap cell — red */
        const gapCell=row.getCell(6);
        gapCell.font={name:'Calibri',size:10,bold:true,color:{argb:'FF991B1B'}};
        /* Priority cell */
        const priCell=row.getCell(7);
        priCell.font={name:'Calibri',size:10,bold:true,color:{argb:priority==='High'?'FF991B1B':'FFB45309'}};
      });
    }else{
      const noRow=ws2.addRow(['','No missed KPIs in selected period','','','','','','','']);
      noRow.getCell(2).font={name:'Calibri',size:10,italic:true,color:{argb:'FF64748B'}};
      noRow.height=18;
    }
  }

  /* Download */
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`KPI_Report_${F.year}_${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast(lang==='ar'?' تم تحميل ملف Excel':' Excel downloaded successfully');
}

/* ==========================================
   WORD REPORT GENERATOR — loads docx.js on demand
========================================== */
async function generateWordDoc(){
  toast(lang==='ar'?'⏳ جاري تحميل مكتبة Word...':'⏳ Loading Word library...');
  /* Load docx.js dynamically only when needed (avoids blocking page load) */
  if(typeof window.docx==='undefined'){
    await new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src='https://unpkg.com/docx@8.5.0/build/index.js';
      s.onload=res;s.onerror=()=>rej(new Error('Failed to load Word library. Check internet connection.'));
      document.head.appendChild(s);
    });
  }
  toast(lang==='ar'?'⏳ جاري إنشاء التقرير...':'⏳ Building report...');
  try{await _buildWordDoc();}catch(e){console.error(e);toast(' Word error: '+e.message);}
}
async function _buildWordDoc(){
  const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,
         AlignmentType,HeadingLevel,BorderStyle,WidthType,ShadingType,VerticalAlign}=window.docx;
  const ks=filt();if(!ks.length){toast('No KPIs');return;}
  const now=new Date();
  const dateStr=now.toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'});
  /* Colors (matching template) */
  const DARK='134163',TEAL='1481AB',GREEN='215D4B',MED='318B70',LT_TEAL='E8F4F2',WHITE='FFFFFF',GREY='808080';
  const bd={style:BorderStyle.SINGLE,size:4,color:TEAL};
  const bds={top:bd,bottom:bd,left:bd,right:bd};
  /* Helpers */
  const hCell=(t,w)=>new TableCell({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:String(t),bold:true,color:WHITE,font:'Times New Roman',size:20})]})],shading:{fill:TEAL,type:ShadingType.CLEAR},borders:bds,width:{size:w,type:WidthType.DXA},margins:{top:80,bottom:80,left:120,right:120},verticalAlign:VerticalAlign.CENTER});
  const dCell=(t,w,bg='FFFFFF',bold=false,col='000000',align=AlignmentType.LEFT)=>new TableCell({children:[new Paragraph({alignment:align,children:[new TextRun({text:String(t||'\u2014'),bold,color:col,font:'Times New Roman',size:20})]})],shading:{fill:bg,type:ShadingType.CLEAR},borders:bds,width:{size:w,type:WidthType.DXA},margins:{top:80,bottom:80,left:120,right:120}});
  const H1=(t)=>new Paragraph({children:[new TextRun({text:t,bold:true,font:'Times New Roman',size:48,color:DARK})],alignment:AlignmentType.CENTER,spacing:{before:240,after:120}});
  const H2=(t)=>new Paragraph({children:[new TextRun({text:t,bold:true,font:'Times New Roman',size:28,color:GREEN})],spacing:{before:220,after:100}});
  const H3=(t)=>new Paragraph({children:[new TextRun({text:t,bold:true,font:'Times New Roman',size:24,color:MED})],spacing:{before:160,after:80}});
  const P=(t)=>new Paragraph({children:[new TextRun({text:t,font:'Times New Roman',size:22})],alignment:AlignmentType.BOTH,spacing:{before:80,after:80}});
  const BUL=(t)=>new Paragraph({numbering:{reference:'bullets',level:0},children:[new TextRun({text:t,font:'Times New Roman',size:22})],spacing:{before:40,after:40}});
  const LINE=()=>new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:TEAL,space:1}},spacing:{before:60,after:180}});
  const SP=(n=1)=>new Paragraph({spacing:{before:n*60,after:n*60}});
  /* Build content */
  const children=[];
  const isSingle=ks.length===1;
  const k=isSingle?ks[0]:null;
  const deptName=k?DM[k.dept].en:(F.dept!=='all'?DM[F.dept].en:'All Departments');
  /* ── TITLE ── */
  if(isSingle){
    children.push(H1(k.nameEn));
    children.push(H1('KPI Performance Report'));
  }else{
    children.push(H1('KPI Performance Report'));
  }
  children.push(new Paragraph({children:[new TextRun({text:`Facility Management and Safety – ${deptName} Department`,bold:true,font:'Times New Roman',size:26,color:DARK})],alignment:AlignmentType.CENTER,spacing:{before:60,after:40}}));
  children.push(new Paragraph({children:[new TextRun({text:'Qassim University Medical City',font:'Times New Roman',size:22,color:TEAL})],alignment:AlignmentType.CENTER,spacing:{before:40,after:40}}));
  children.push(new Paragraph({children:[new TextRun({text:dateStr+' | Period: '+(F.year==='all'?'All Years':F.year)+' | '+F.qtr.map(q=>q.toUpperCase()).join('+'),font:'Times New Roman',size:18,color:GREY})],alignment:AlignmentType.CENTER,spacing:{before:40,after:120}}));
  children.push(LINE());
  if(isSingle){
    /* === SINGLE KPI FULL REPORT (matches template exactly) === */
    const v=qv(k),a=ok(k);
    const gd=(ST.gaps||{})[k.id]||{};const ac=(ST.actions||{})[k.id]||{};
    const allV=[k.q1,k.q2,k.q3,k.q4].filter(x=>x!==null);
    const avgVal=allV.length?(allV.reduce((s,x)=>s+x)/allV.length).toFixed(1):null;
    const dm=DM[k.dept];
    const metW=a===true?'achieved':'did not achieve';
    /* Executive Summary */
    children.push(new Paragraph({children:[new TextRun({text:'Executive Summary',bold:true,font:'Times New Roman',size:26,color:GREEN})],spacing:{before:120,after:100}}));
    const summaryBody=gd.gapEn?`The ${dm.en} Department ${metW} the ${k.nameEn} KPI target of ${k.target}%. ${gd.gapEn}`:`The ${dm.en} Department demonstrated ${a===true?'strong':'moderate'} performance in the ${k.nameEn} KPI, achieving an overall result of ${avgVal!==null?avgVal+'%':'N/A'}, which is ${a===true?'at or above':'below'} the annual target of ${k.target}%. ${allV.length>=2?(k.q4!==null&&k.q1!==null&&k.q4>k.q1?'Performance showed an improving trend throughout the period.':k.q4!==null&&k.q1!==null&&k.q4<k.q1?'Performance showed a declining trend during the period.':'Performance remained relatively stable.'):''}`;
    children.push(P(summaryBody));
    /* 1. Introduction */
    children.push(H2('1. Introduction'));
    children.push(P(`This report presents the performance of the ${dm.en} Department in relation to the ${k.nameEn} KPI (${k.id}). It reviews quarterly results, compares actual outcomes against the target of ${k.target}%, and provides insights and recommendations to enhance performance effectiveness.`));
    /* 2. KPI Overview */
    children.push(H2('2. KPI Overview'));
    const ov=[
      ['KPI Code',k.id],['KPI Name',k.nameEn],['KPI Name (AR)',k.nameAr],['Department',dm.en],
      ['Annual Target',k.target+'%'],['KPI Result',v!==null?v.toFixed(1)+'%':'Pending'],
      ['Status',a===null?'Pending':a?' Met — Target Achieved':' Not Met — Below Target'],
      ['Risk Tier',`T${k.tier||3} — ${TIERS[k.tier||3]?.en||'Operational'}`],
      ['Year',String(k.yr)],['YoY (vs Prior Year Q1)',k.yoy!==null&&v!==null?(v-k.yoy>=0?'▲ +':' ▼ ')+(v-k.yoy).toFixed(1)+'%':'N/A']
    ];
    children.push(new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2800,6226],rows:ov.map(([lbl,val],i)=>new TableRow({children:[dCell(lbl,2800,LT_TEAL,true,DARK),dCell(val,6226,i%2===0?WHITE:LT_TEAL,false,lbl==='Status'&&a===true?'065F46':lbl==='Status'&&a===false?'7F1D1D':'000000')]}))}));
    children.push(SP());
    /* 3. Quarterly Performance */
    children.push(H2('3. Quarterly Performance Results'));
    children.push(H3(`3.1 ${k.nameEn} KPI per Quarter`));
    const qls=['Q1','Q2','Q3','Q4'],qvs=[k.q1,k.q2,k.q3,k.q4];
    const qRows=[new TableRow({children:[hCell('Quarter',1200),hCell('Result',1600),hCell('Target',1600),hCell('Gap',1200),hCell('Status',3426)]})];
    qls.forEach((ql,i)=>{
      const qv_v=qvs[i];
      const bg=i%2===0?WHITE:LT_TEAL;
      const qMet=qv_v!==null&&qv_v>=k.target;
      const qGap=qv_v!==null?(qv_v-k.target).toFixed(1):'---';
      const qGapStr=qv_v!==null?qGap+'%':'---';
      const qStatus=qv_v===null?'Pending':qMet?'Met':'Not Met';
      const qStatusBg=qMet?'D1FAE5':qv_v===null?'F5F5F5':'FEE2E2';
      const qStatusCol=qMet?'065F46':qv_v===null?GREY:'7F1D1D';
      qRows.push(new TableRow({children:[
        dCell(ql,1200,bg,true,DARK),
        dCell(qv_v!==null?qv_v.toFixed(1)+'%':'---',1600,bg,false,qMet?'065F46':'7F1D1D'),
        dCell(k.target+'%',1600,bg,false,GREEN),
        dCell(qGapStr,1200,bg,false,qMet?'065F46':'7F1D1D'),
        dCell(qStatus,3426,qStatusBg,true,qStatusCol,AlignmentType.CENTER)
      ]}));
    });
    children.push(new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1200,1600,1600,1200,3426],rows:qRows}));
    children.push(SP());
    children.push(new Paragraph({children:[new TextRun({text:'Analysis:',bold:true,font:'Times New Roman',size:24,color:GREEN})],spacing:{before:120,after:80}}));
    qls.forEach((ql,i)=>{const qv_v=qvs[i];if(qv_v===null)return;const met=qv_v>=k.target;const gap=Math.abs(qv_v-k.target).toFixed(1);children.push(BUL(`${ql}: Performance was ${qv_v.toFixed(1)}%, ${met?`exceeding the target by ${gap}%.`:`${gap}% below the target of ${k.target}%.`}${!met&&gd.gapEn?' '+gd.gapEn.split('.')[0]+'.':''}`));});
    /* 4. Target vs Actual */
    children.push(H2('4. Target vs Actual KPI (Quarterly)'));
    children.push(P(`This comparison illustrates the gap between actual performance and the annual target of ${k.target}% across the available quarters.`));
    const w4=(9026-2200)/4;
    const tv=[new TableRow({children:[hCell('Metric',2200),...qls.map(q=>hCell(q,w4))]})];
    tv.push(new TableRow({children:[dCell('Target',2200,LT_TEAL,true),...qls.map(()=>dCell(k.target+'%',w4,LT_TEAL,false,GREEN,AlignmentType.CENTER))]}));
    tv.push(new TableRow({children:[dCell('Actual',2200,'FFFFFF',true),...qvs.map(v=>dCell(v!==null?v.toFixed(1)+'%':'\u2014',w4,'FFFFFF',false,v!==null?(v>=k.target?'065F46':'7F1D1D'):GREY,AlignmentType.CENTER))]}));
    tv.push(new TableRow({children:[dCell('Gap',2200,'FFFFFF',true),...qvs.map(v=>dCell(v!==null?((v-k.target>=0?'+':'')+(v-k.target).toFixed(1)+'%'):'\u2014',w4,'FFFFFF',false,v!==null?(v>=k.target?'065F46':'7F1D1D'):GREY,AlignmentType.CENTER))]}));
    children.push(new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,w4,w4,w4,w4],rows:tv}));
    children.push(SP());
    const metQs=qls.filter((_,i)=>qvs[i]!==null&&qvs[i]>=k.target);
    const missQs=qls.filter((_,i)=>qvs[i]!==null&&qvs[i]<k.target);
    children.push(new Paragraph({children:[new TextRun({text:'Key Findings:',bold:true,font:'Times New Roman',size:24,color:GREEN})],spacing:{before:120,after:80}}));
    if(metQs.length)children.push(BUL(`Target was achieved in: ${metQs.join(', ')}.`));
    if(missQs.length)children.push(BUL(`Target was not achieved in: ${missQs.join(', ')}.`));
    if(k.yoy!==null&&v!==null)children.push(BUL(`Year-over-Year: ${v>=k.yoy?'▲ Improvement':'▼ Decline'} of ${Math.abs(v-k.yoy).toFixed(1)}% compared to prior year Q1.`));
    /* 5. Annual KPI Trend */
    children.push(H2(`5. Annual KPI Trend (Q1–Q${qvs.filter(v=>v!==null).length>3?'4':''+qvs.filter(v=>v!==null).length})`));
    const trend=qvs.filter(v=>v!==null);
    children.push(P(`The annual trend shows ${trend.length>=2?(trend[trend.length-1]>trend[0]?'a positive improving trajectory':'a declining trajectory'):'limited data'} during the reviewed period.`));
    children.push(new Paragraph({children:[new TextRun({text:'Interpretation:',bold:true,font:'Times New Roman',size:24,color:GREEN})],spacing:{before:120,after:80}}));
    if(trend.length>=2){children.push(BUL(`Starting performance: ${trend[0].toFixed(1)}% in Q1.`));children.push(BUL(`Final period performance: ${trend[trend.length-1].toFixed(1)}%.`));children.push(BUL(`Overall change: ${(trend[trend.length-1]-trend[0]>=0?'+':'')}${(trend[trend.length-1]-trend[0]).toFixed(1)}% over the period.`));}
    /* 6. KPI Achievement Distribution */
    children.push(H2('6. KPI Achievement Distribution'));
    if(avgVal!==null){children.push(BUL(`Achieved: ${avgVal}%`));children.push(BUL(`Remaining gap: ${Math.max(0,k.target-parseFloat(avgVal)).toFixed(1)}%`));}
    children.push(P(`This distribution highlights ${a===true?'that the department successfully met the annual target, demonstrating strong operational performance.':'that a performance gap remains when considering overall annual performance against the target of '+k.target+'%.'}`));
    /* 7. Key Performance Enablers */
    children.push(H2('7. Key Performance Enablers'));
    const enabs=gd.actEn?gd.actEn.split('.').filter(s=>s.trim()).map(s=>s.trim()):['Enhanced operational procedures and protocols','Effective management oversight and monitoring','Improved communication between teams','Timely escalation and follow-up mechanisms'];
    enabs.forEach(e=>children.push(BUL(e+(e.endsWith('.')?'':'.'))));
    /* 8. Recommendations */
    children.push(H2('8. Recommendations and Improvement Opportunities'));
    const recs=a===true?['Continue practices that led to achieving the target of '+k.target+'%.','Maintain monitoring and reporting mechanisms.','Share best practices across departments.','Set a higher benchmark target for continuous improvement.']:['Strengthen operational controls to achieve the '+k.target+'% target.','Conduct root cause analysis for quarters where target was missed.','Implement and monitor corrective action plans closely.','Increase management oversight and escalation protocols.','Provide additional resources and training as needed.'];
    if(gd.actEn)gd.actEn.split('.').filter(s=>s.trim()).forEach(s=>children.push(BUL(s.trim()+'.')));
    else recs.forEach(r=>children.push(BUL(r)));
    /* 9. Conclusion */
    children.push(H2('9. Conclusion & Forward Outlook'));
    const yoyTxt=k.yoy!==null&&v!==null?` Year-over-year performance ${v>=k.yoy?'improved':'declined'} by ${Math.abs(v-k.yoy).toFixed(1)}%.`:'';
    children.push(P(a===true?`The ${dm.en} Department successfully achieved the ${k.nameEn} KPI target of ${k.target}%.${yoyTxt} This demonstrates effective operational management. Sustained commitment to current practices will ensure continued compliance in future cycles.`:`The ${dm.en} Department did not achieve the ${k.nameEn} KPI target of ${k.target}%, with an overall result of ${avgVal||'N/A'}%.${yoyTxt} ${gd.gapEn?'Root causes have been identified and documented.':'Root cause analysis and corrective action plans should be developed.'} By implementing the recommendations in this report, the department can achieve full compliance in future performance cycles.`));
    /* Action Plan (if documented) */
    if(gd.gapEn||gd.actEn||ac.owner||ac.status){
      children.push(H2('Appendix: Documented Action Plan'));
      const ap=[['Responsible Person',ac.owner||gd.owner||'\u2014'],['Expected Closure Date',ac.dueDate||gd.dueDate||'\u2014'],['Action Status',ac.status||gd.status||'Open'],['Priority',ac.priority||gd.priority||'\u2014'],['Gap Reasons (EN)',gd.gapEn||'\u2014'],['Corrective Actions (EN)',gd.actEn||'\u2014'],['Gap Reasons (AR)',gd.gapAr||'\u2014'],['Corrective Actions (AR)',gd.actAr||'\u2014']];
      children.push(new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2800,6226],rows:ap.filter(([,v])=>v&&v!=='\u2014').map(([l,v],i)=>new TableRow({children:[dCell(l,2800,LT_TEAL,true,DARK),dCell(v,6226,i%2===0?WHITE:LT_TEAL)]})) }));
    }
  }else{
    /* === MULTI-KPI SUMMARY REPORT === */
    const nOk=ks.filter(k=>ok(k)===true).length,nMiss=ks.filter(k=>ok(k)===false).length;
    children.push(new Paragraph({children:[new TextRun({text:'Executive Summary',bold:true,font:'Times New Roman',size:26,color:GREEN})],spacing:{before:120,after:100}}));
    children.push(P(`This report covers ${ks.length} KPIs across ${deptName} for the period ${F.year==='all'?'All Years':F.year}. Overall performance: ${nOk} KPIs Met (${ks.length?Math.round(nOk/ks.length*100):0}%), ${nMiss} KPIs Not Met.`));
    children.push(H2('KPI Performance Summary'));
    const w1=800,w2=3200,w3=800,w4d=700,w5=900,w6=1026,wTotal=w1+w2+w3+w4d+w5+w6+100;
    const sRows=[new TableRow({children:[hCell('Code',w1),hCell('KPI Name',w2),hCell('Dept',w3),hCell('Target',w4d),hCell('Result',w5),hCell('Status',w6+100)]})];
    ks.forEach((k,i)=>{
      const v=qv(k),a=ok(k);const bg=i%2===0?WHITE:LT_TEAL;
      const stText=a===null?'Pending':a?'Met':'Not Met';
      const stBg=a===true?'D1FAE5':a===false?'FEE2E2':'F5F5F5';
      const stCol=a===true?'065F46':a===false?'7F1D1D':GREY;
      sRows.push(new TableRow({children:[
        dCell(k.id,w1,bg,true,TEAL),
        dCell(k.nameEn,w2,bg),
        dCell(DM[k.dept].abbr,w3,bg),
        dCell(k.target+'%',w4d,bg,false,GREEN,AlignmentType.CENTER),
        dCell(v!==null?v.toFixed(1)+'%':'---',w5,bg,false,a===true?'065F46':a===false?'7F1D1D':GREY,AlignmentType.CENTER),
        dCell(stText,w6+100,stBg,true,stCol,AlignmentType.CENTER)
      ]}));
    });
    children.push(new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[w1,w2,w3,w4d,w5,w6+100],rows:sRows}));
    const missKs=ks.filter(k=>ok(k)===false);
    if(missKs.length){children.push(SP(2));children.push(H2('Missed KPIs — Gap Analysis'));missKs.forEach(k=>{const gd=(ST.gaps||{})[k.id]||{};const v=qv(k);children.push(new Paragraph({children:[new TextRun({text:`${k.id}: ${k.nameEn}`,bold:true,font:'Times New Roman',size:22,color:'7F1D1D'})],spacing:{before:100,after:40}}));if(v!==null)children.push(BUL(`Result: ${v.toFixed(1)}% vs Target: ${k.target}% (Gap: ${(k.target-v).toFixed(1)}%)`));if(gd.gapEn)children.push(BUL(`Root Cause: ${gd.gapEn}`));if(gd.actEn)children.push(BUL(`Corrective Action: ${gd.actEn}`));});}
  }
  /* Footer line */
  children.push(SP(2));
  children.push(new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:4,color:TEAL,space:1}},children:[new TextRun({text:`KPI Performance Report — Facilities Management & Safety Division — Qassim University Medical City — ${dateStr}`,font:'Times New Roman',size:16,color:GREY})],alignment:AlignmentType.CENTER,spacing:{before:100,after:60}}));
  /* Build document */
  const doc=new Document({
    numbering:{config:[{reference:'bullets',levels:[{level:0,format:'bullet',text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]}]},
    styles:{default:{document:{run:{font:'Times New Roman',size:22}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1440,bottom:1440,left:1440}}},children}]
  });
  const blob=await Packer.toBlob(doc);
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  const fname=isSingle?`${ks[0].id}_KPI_Report_${now.toISOString().slice(0,10)}.docx`:`KPI_Report_${F.year}_${now.toISOString().slice(0,10)}.docx`;
  a.download=fname;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast(lang==='ar'?` تم تحميل: ${fname}`:` Downloaded: ${fname}`);
}
/* == PCI BREAKDOWN — Read-Only View (data entered via Admin Panel) == */
var _pciKpiId=null, _pciQ=null;

/* == Context-aware empty state == */
function emptyStateExec(dept,status){
  const dm=dept&&dept!=='all'?DM[dept]:null;
  const deptName=dm?(lang==='ar'?dm.ar:dm.en):(lang==='ar'?'جميع الأقسام':'All Departments');
  const yr=F.year==='all'?'':(lang==='ar'?` في ${F.year}`:` in ${F.year}`);
  const qtr=F.qtr&&!F.qtr.includes('all')?` · ${F.qtr.map(q=>q.toUpperCase()).join('+')}`:' ';
  const allDK=allK().filter(k=>dept==='all'||k.dept===dept);
  const evaled=allDK.filter(k=>ok(k)!==null);
  const metCount=evaled.filter(k=>ok(k)===true).length;
  const missCount=evaled.filter(k=>ok(k)===false).length;
  const allMet=evaled.length>0&&missCount===0;
  const allMissed=evaled.length>0&&metCount===0;
  let ico,title,sub;
  if(status==='missed'&&allMet){
    ico='';
    title=lang==='ar'?'جميع المؤشرات محققة!':'All KPIs Are Met!';
    sub=lang==='ar'
      ?`جميع الـ ${evaled.length} مؤشرات لقسم ${deptName}${yr}${qtr}حققت أهدافها. لا توجد مؤشرات Missed لعرضها — هذا إنجاز ممتاز!`
      :`All ${evaled.length} KPIs for ${deptName}${yr}${qtr}have achieved their targets. There are no Missed KPIs — this is excellent performance!`;
  }else if(status==='met'&&allMissed){
    ico='';
    title=lang==='ar'?'لا توجد مؤشرات محققة في هذه الفترة':'No KPIs Met Target in This Period';
    sub=lang==='ar'
      ?`جميع مؤشرات ${deptName}${yr}${qtr}لم تحقق أهدافها. راجع قسم المؤشرات المفقودة.`
      :`All KPIs for ${deptName}${yr}${qtr}are below target. Review the Missed KPIs section.`;
  }else if(evaled.length===0){
    ico='';
    title=lang==='ar'?'لا توجد بيانات لهذه الفترة':'No Data Available';
    sub=lang==='ar'
      ?`لم يتم إدخال نتائج مؤشرات لقسم ${deptName}${yr}${qtr}بعد.`
      :`No KPI results have been recorded for ${deptName}${yr}${qtr}yet.`;
  }else{
    ico='';
    title=lang==='ar'?'لا توجد نتائج مطابقة':'No Matching Results';
    sub=lang==='ar'
      ?`لا توجد مؤشرات تطابق الفلتر المحدد لقسم ${deptName}${yr}${qtr}.`
      :`No KPIs match the selected filters for ${deptName}${yr}${qtr}.`;
  }
  return`<div style="grid-column:1/-1;text-align:center;padding:52px 32px">
    <div style="font-size:50px;margin-bottom:16px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.10))">${ico}</div>
    <div style="font-size:16px;font-weight:800;color:var(--ink);margin-bottom:8px;letter-spacing:-.01em">${title}</div>
    <div style="font-size:11.5px;color:var(--t3);max-width:400px;margin:0 auto;line-height:1.65">${sub}</div>
    ${status==='missed'&&allMet?`<div style="margin-top:20px;display:inline-flex;align-items:center;gap:7px;background:rgba(5,150,105,0.09);border:1px solid rgba(5,150,105,0.16);border-radius:24px;padding:8px 18px;font-size:11px;font-weight:700;color:var(--green)"> ${metCount} ${lang==='ar'?'مؤشر محقق بالكامل':'KPIs fully achieved'}</div>`:''}
  </div>`;
}

/* == Export PDF == */
function toggleExportMenu(e){
  e&&e.stopPropagation();
  const m=document.getElementById('exportMenuDrop');if(!m)return;
  const isOpen=m.style.display==='block';
  m.style.display=isOpen?'none':'block';
  if(!isOpen)setTimeout(()=>document.addEventListener('click',()=>{m.style.display='none';},{once:true}),10);
}
function openExportPDF(){toggleExportMenu(null);}
function closeExportPDF(){const m=document.getElementById('exportMenuDrop');if(m)m.style.display='none';}
async function doExportPage(pageSel){
  const m=document.getElementById('exportMenuDrop');
  if(m)m.style.display='none';

  const pageMap={
    exec:'page-exec', dept:'page-dept',
    registry:'page-registry', acc:'page-accountability'
  };
  const tabKeys={exec:'executive',dept:'department',registry:'registry',acc:'account'};

  /* Navigate to selected tab so content renders */
  if(pageSel!=='all'){
    document.querySelectorAll('.tab').forEach(t=>{
      if((t.textContent||'').toLowerCase().includes(tabKeys[pageSel]||pageSel))
        t.click();
    });
    await new Promise(r=>setTimeout(r,1500));
  }

  /* Build override CSS: un-hide selected page(s), fix dashwrap */
  let overrideCSS='@media print{';
  overrideCSS+='.dashwrap{overflow:visible!important;height:auto!important;max-height:none!important}';
  overrideCSS+='.cb.sc,.sc{overflow:visible!important;max-height:none!important;height:auto!important}';
  overrideCSS+='.topbar,.filter-strip,.tabnav,.footbar,.overlay,.rpt-edit-btn{display:none!important}';
  overrideCSS+='.gg{grid-auto-rows:auto!important}';
  overrideCSS+='.card{break-inside:avoid;box-shadow:none!important}';
  overrideCSS+='@page{size:landscape;margin:10mm}';

  if(pageSel==='all'){
    /* Show all dashboard pages, hide report */
    overrideCSS+='#page-exec,#page-dept,#page-registry,#page-accountability{display:block!important;visibility:visible!important}';
    overrideCSS+='#page-report{display:none!important}';
  } else {
    const tid=pageMap[pageSel];
    /* Show only selected, hide the rest including report */
    ['page-exec','page-dept','page-registry','page-accountability','page-report'].forEach(pid=>{
      if(pid===tid)
        overrideCSS+='#'+pid+'{display:block!important;visibility:visible!important;width:100%!important}';
      else
        overrideCSS+='#'+pid+'{display:none!important;visibility:hidden!important}';
    });
  }
  overrideCSS+='}';

  /* Inject override AFTER existing print styles so it wins */
  const old=document.getElementById('kpi-print-override');if(old)old.remove();
  const st=document.createElement('style');
  st.id='kpi-print-override';
  st.textContent=overrideCSS;
  document.head.appendChild(st);

  /* Small paint delay then print */
  await new Promise(r=>setTimeout(r,200));
  window.print();

  /* Clean up after dialog closes */
  setTimeout(()=>{
    const s=document.getElementById('kpi-print-override');
    if(s)s.remove();
  },3000);
}

async function doExportPDF(){doExportPage('exec');}
/* Sync hash — works on file:// and HTTPS, no async needed */
/* ==========================================================
   REPORT TAB — Executive Performance Report Generator

========================================================== */
function renderReport(){
  const el=document.getElementById('page-report');if(!el)return;
  if(typeof window._rptKpi==='undefined')window._rptKpi='';

  if(typeof window._rptDept==='undefined')window._rptDept='';
  /* Role-aware base set — dept managers / kpi_owners only see their scope */
  let ks_base=allK();
  const _rptRole=window._fbRole||'';
  const _rptLocked=window._lockedDept||null;
  const _rptAssigned=window._fbAssignedKpis;
  /* Apply hard dept lock */
  if(_rptLocked) ks_base=ks_base.filter(k=>k.dept===_rptLocked);
  /* Apply kpi_owner KPI restriction */
  if(_rptRole==='kpi_owner'&&Array.isArray(_rptAssigned)&&_rptAssigned.length>0)
    ks_base=ks_base.filter(k=>_rptAssigned.includes(k.id));
  /* Lock _rptDept to the locked dept if applicable */
  if(_rptLocked&&window._rptDept!==_rptLocked) window._rptDept=_rptLocked;
  const ks_all=ks_base.filter(k=>F.year==='all'||k.yr===parseInt(F.year));
  /* Dept filter options — locked users see only their dept */
  const _showAllDepts=!_rptLocked;
  const deptOpts=(_showAllDepts?'<option value=""'+(window._rptDept===''?' selected':'')+'>All Departments</option>':'')+
    Object.keys(DM).filter(d=>!_rptLocked||d===_rptLocked).map(d=>'<option value="'+d+'"'+(window._rptDept===d?' selected':'')+'>'+DM[d].en+'</option>').join('');
  /* Filter KPIs by selected report dept */
  const ks_dept=window._rptDept?ks_all.filter(k=>k.dept===window._rptDept):ks_all;
  /* Build KPI options filtered by selected dept */
  const kpiOpts='<option value=""'+(window._rptKpi===''?' selected':'')+'>— All KPIs —</option>'+
    ks_dept.map(k=>'<option value="'+k.id+'"'+(window._rptKpi===k.id?' selected':'')+'>'+k.id+' — '+k.nameEn+'</option>').join('');
  /* Final KPI set: dept filtered + optional single KPI */
  const ks=window._rptKpi?ks_dept.filter(k=>k.id===window._rptKpi):ks_dept;

  const k1=ks.length===1?ks[0]:null;
  const kpiYear=k1?String(k1.yr):(F.year!=='all'?String(F.year):'2025');
  /* deptFull from report's own dept filter */
  const rptDm=window._rptDept?DM[window._rptDept]:null;
  const deptFull=rptDm?(rptDm.en+' Department'):'All Departments';
  const metKs=ks.filter(k=>ok(k)===true);
  const missKs=ks.filter(k=>ok(k)===false);
  const total=ks.length;
  const avgV=ks.map(k=>qv(k)).filter(v=>v!==null);
  const kpiResult=avgV.length?+(avgV.reduce((a,b)=>a+b,0)/avgV.length).toFixed(0):null;
  const kpiTarget=k1?k1.target:(ks.length?Math.round(ks.reduce((a,k)=>a+k.target,0)/ks.length):96);
  const isMet=kpiResult!==null&&kpiResult>=kpiTarget;
  const today=new Date();
  const dateStr=today.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  const period=kpiYear+(F.qtr.includes('all')?'':' ('+F.qtr.map(q=>q.toUpperCase()).join(', ')+')');
  const kpiNameFull=ks.map(k=>k.nameEn).join(', ')||'KPI Performance Report';
  const kpiNameShort=k1?k1.nameEn:(ks.length===0?'KPI Performance Report':ks.length<=2?kpiNameFull:ks.length+' KPIs');

  const qAvg=q=>{const v=ks.map(k=>k[q]).filter(x=>x!==null);return v.length?+(v.reduce((a,b)=>a+b)/v.length).toFixed(0):null;};
  const [q1v,q2v,q3v,q4v]=['q1','q2','q3','q4'].map(qAvg);

  /* Section header */
  const SH=(n,t)=>`<div style="display:flex;align-items:center;gap:10px;margin:28px 0 13px;break-after:avoid;page-break-after:avoid">
    <div style="width:4px;height:22px;background:linear-gradient(180deg,#0195af,#007A96);border-radius:2px;flex-shrink:0"></div>
    <h2 style="font-size:14px;font-weight:800;color:#152538;margin:0">${n}. ${t}</h2>
  </div>`;

  /* Editable paragraph */
  let _eid=0;
  const EP=(txt,style='')=>{
    const id='ep'+(++_eid);
    /* Stable key: based on KPI selection ONLY — not on year/dept/qtr filters */
    /* This ensures edits persist when user changes filters or returns later */
    const _stableKpi=window._rptKpi||'_all_';
    const _ctxKey='rpt_'+_stableKpi+'_'+_eid;
    const _saved=(ST.rptEdits||{})[_ctxKey];const _content=_saved!==undefined?_saved:txt;
    return `<div class="rpt-ep" id="${id}-w" style="display:flex;align-items:flex-start;gap:8px;${style}">
      <p id="${id}" style="font-size:12px;color:#334155;line-height:1.85;margin:0;min-height:20px;flex:1">${_content}</p>
      <div id="${id}-acts" style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;padding-top:2px">
        <button class="rpt-edit-btn" onclick="rptStartEdit('${id}')" title="Edit" style="position:static;opacity:0;transform:translateX(4px)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>`;
  };

  /* Q table row */
  const QR=(q,v)=>{const ok2=v!==null&&v>=kpiTarget;return`<tr>
    <td style="padding:9px 14px;font-weight:700;color:#152538;border:1px solid #E2E8F0">${q}</td>
    <td style="padding:9px 14px;text-align:center;font-weight:700;color:#1E40AF;border:1px solid #E2E8F0">${kpiTarget}%</td>
    <td style="padding:9px 14px;text-align:center;font-weight:800;background:${v===null?'#F8FAFC':ok2?'#DCFCE7':'#FEE2E2'};color:${v===null?'#CBD5E1':ok2?'#166534':'#991B1B'};border:1px solid #E2E8F0">${v!==null?v+'%':'N/A'}</td>
    <td style="padding:9px 14px;text-align:center;border:1px solid #E2E8F0">
      <span style="padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;background:${v===null?'#F8FAFC':ok2?'#ECFDF5':'#FEF2F2'};color:${v===null?'#94A3B8':ok2?'#06845A':'#C42B2B'}">${v===null?'Pending':ok2?' Met':' Below Target'}</span>
    </td>
  </tr>`;};

  /* Analysis bullets per quarter */
  const qBullets=[[q1v,'Q1'],[q2v,'Q2'],[q3v,'Q3'],[q4v,'Q4']]
    .filter(([v])=>v!==null)
    .map(([v,q])=>`• <strong>${q}:</strong> Performance was <strong style="color:${v>=kpiTarget?'#06845A':'#C42B2B'}">${v}%</strong>${v<kpiTarget?', below the target of '+kpiTarget+'%.':' — target achieved.'}`)
    .join('<br>');

  /* Key findings */
  const kfParts=[[q1v,'Q1'],[q2v,'Q2'],[q3v,'Q3'],[q4v,'Q4']].filter(([v])=>v!==null);
  const kfLines=[
    ...kfParts.map(([v,q])=>`The KPI ${v>=kpiTarget?`<strong>target was achieved</strong> in ${q}.`:`<strong>target was not achieved in ${q}</strong>, falling short by ${kpiTarget-v}%.`}`),
    metKs.length&&missKs.length?`${metKs.length} KPI${metKs.length>1?'s':''} achieved target; ${missKs.length} require corrective action.`:
    missKs.length?`${missKs.length} KPI${missKs.length>1?'s':''} require immediate corrective action.`:
    ' All monitored KPIs achieved target in the selected period.',
    kfParts.length>=2?(kfParts[kfParts.length-1][0]||0)>(kfParts[0][0]||0)?'Progressive improvement is noted across the reporting period.':'Performance stability is noted with room for further improvement.':''
  ].filter(Boolean).map(l=>`• ${l}`).join('<br>');

  /* Recs */
  const recs=[
    missKs.length?`Implement targeted corrective actions for the <strong>${missKs.length}</strong> KPI${missKs.length>1?'s':''} that fell below target.`:null,
    'Strengthen preparedness and response planning at the start of each quarter.',
    'Conduct regular drills and simulations to build team readiness.',
    'Improve staffing availability and on-call arrangements to ensure consistent coverage.',
    'Monitor performance closely with real-time tracking tools and automated alerts.',
    metKs.length?`Sustain the effective practices implemented in the <strong>${metKs.length}</strong> high-performing KPI${metKs.length>1?'s':''}.`:null
  ].filter(Boolean);

  el.innerHTML=`<div style="padding:0;background:var(--bg);min-height:100%">

  <!-- Toolbar -->
  <div class="rpt-topbar" style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:var(--bg);flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:8px">
      <label style="font-size:10px;font-weight:700;color:var(--t2);white-space:nowrap">Department:</label>
      <select class="msel" style="min-width:160px;height:34px;font-size:11px" onchange="window._rptDept=this.value;window._rptKpi='';renderReport()">${deptOpts}</select>
    </div>
    <div style="width:1px;height:22px;background:var(--border)"></div>
    <div style="display:flex;align-items:center;gap:8px">
      <label style="font-size:10px;font-weight:700;color:var(--t2);white-space:nowrap">KPI: <span style="color:#DC2626">*</span></label>
      <select class="msel" style="min-width:200px;height:34px;font-size:11px" onchange="window._rptKpi=this.value;renderReport()">${kpiOpts}</select>
    </div>
    <div style="width:1px;height:22px;background:var(--border)"></div>
    <button onclick="window.print()" style="display:flex;align-items:center;gap:6px;padding:7px 18px;background:#C42B2B;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;box-shadow:0 2px 10px rgba(196,43,43,.28)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Export PDF
    </button>
    <span style="margin-left:auto;font-size:10px;color:var(--t3)">${period} · ${dateStr}</span>
  </div>

  <!-- A4 Doc -->
  <div id="rptDocument" style="background:#fff;max-width:860px;margin:0 auto 32px;border-radius:12px;box-shadow:0 12px 48px rgba(13,31,60,.14);overflow:hidden;font-family:'IBM Plex Sans',Calibri,Arial,sans-serif">

    <!-- Header -->
    <div style="background:#152538;padding:26px 36px 22px;display:flex;align-items:flex-start;gap:22px">
      <div style="flex-shrink:0;background:#152538">
        <img src="${LOGO}" alt="QUMC" style="height:80px;width:auto;object-fit:contain">
      </div>
      <div style="flex:1;border-left:2px solid rgba(1,149,175,.45);padding-left:22px">
        <p style="margin:0 0 4px;font-size:8px;font-weight:700;color:#0195af;letter-spacing:.26em;text-transform:uppercase">Official KPI Performance Report</p>
        <h1 style="margin:0 0 4px;font-size:19px;font-weight:900;color:#fff;line-height:1.25">${kpiNameShort}</h1>
        <h2 style="margin:0 0 12px;font-size:12px;font-weight:400;color:rgba(255,255,255,.62)">${deptFull}</h2>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <span style="font-size:10px;font-weight:600;color:#0195af">${dateStr}</span>
          <span style="color:rgba(255,255,255,.25)">·</span>
          <span style="font-size:10px;font-weight:600;color:#0195af">${period}</span>
          <span style="color:rgba(255,255,255,.25)">·</span>
          <span style="font-size:10px;font-weight:600;color:#0195af">Target: ${kpiTarget}%</span>
        </div>
      </div>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#0195af,#01c5e8 40%,#152538)"></div>

    <!-- Body -->
    <div style="padding:28px 36px">

      <!-- Scorecard -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin-bottom:26px;break-inside:avoid">
        ${[
          {l:'Total KPIs',v:total,bg:'#EFF6FF',c:'#1E40AF',b:'#BFDBFE'},
          {l:'Met Target',v:metKs.length,bg:'#ECFDF5',c:'#06845A',b:'#A7F3D0'},
          {l:'Missed',v:missKs.length,bg:missKs.length?'#FEF2F2':'#ECFDF5',c:missKs.length?'#C42B2B':'#06845A',b:missKs.length?'#FECACA':'#A7F3D0'},
          {l:'Pending',v:ks.filter(k=>ok(k)===null).length,bg:'#F8FAFC',c:'#64748B',b:'#E2E8F0'},
          {l:'Avg Score',v:kpiResult!==null?kpiResult+'%':'N/A',bg:isMet?'#ECFDF5':'#FEF2F2',c:isMet?'#06845A':'#C42B2B',b:isMet?'#A7F3D0':'#FECACA'}
        ].map(m=>`<div style="background:${m.bg};border:1.5px solid ${m.b};border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:7.5px;font-weight:700;color:#64748B;letter-spacing:.09em;text-transform:uppercase;margin-bottom:6px">${m.l}</div>
          <div style="font-size:24px;font-weight:800;color:${m.c};font-family:monospace;line-height:1">${m.v}</div>
        </div>`).join('')}
      </div>

      <!-- Executive Summary -->
      <div style="background:${isMet?'#ECFDF5':'#FEF2F2'};border-left:4px solid ${isMet?'#06845A':'#C42B2B'};border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:24px;break-inside:avoid">
        <p style="margin:0 0 5px;font-size:10px;font-weight:800;color:#152538;letter-spacing:.05em;text-transform:uppercase">Executive Summary</p>
        ${EP(`${deptFull} demonstrated ${isMet?'strong':'moderate'} performance in the ${kpiNameFull} KPI during ${period}, achieving an overall KPI Result of <strong style="color:${isMet?'#06845A':'#C42B2B'}">${kpiResult!==null?kpiResult+'%':'N/A'}</strong>${kpiResult!==null?`, which is ${isMet?'above':'below'} the annual target of <strong>${kpiTarget}%</strong>`:''}.${isMet?' Performance remains on track, reflecting sound operational discipline.':' Performance remained consistent but under target, highlighting the need for stronger operational control and faster response mechanisms.'}`)}
      </div>

      ${SH('1','Introduction')}
      <div style="margin-bottom:22px;break-inside:avoid">
        ${EP(`This report presents the ${period} performance of the <strong>${deptFull}</strong> in relation to the <strong>${kpiNameFull}</strong> KPI. It reviews quarterly performance results, compares actual outcomes against the annual target of <strong>${kpiTarget}%</strong>, and provides insights and recommendations to enhance operational efficiency and service effectiveness.`)}
      </div>

      ${SH('2','KPI Overview')}
      <div style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:12px;break-inside:avoid">
        <table style="width:100%;border-collapse:collapse">
          <tbody>
            <tr><td style="padding:10px 14px;background:#F8FAFC;font-weight:700;font-size:11px;color:#475569;border-bottom:1px solid #E2E8F0;width:32%">KPI Name</td><td style="padding:10px 14px;font-size:12px;color:#152538;font-weight:600;border-bottom:1px solid #E2E8F0">${kpiNameFull}</td></tr>
            <tr><td style="padding:10px 14px;background:#F8FAFC;font-weight:700;font-size:11px;color:#475569;border-bottom:1px solid #E2E8F0">Annual Target</td><td style="padding:10px 14px;font-size:12px;color:#1E40AF;font-weight:700;border-bottom:1px solid #E2E8F0">${kpiTarget}%</td></tr>
            <tr><td style="padding:10px 14px;background:#F8FAFC;font-weight:700;font-size:11px;color:#475569;border-bottom:1px solid #E2E8F0">KPI Result</td><td style="padding:10px 14px;font-size:12px;font-weight:700;border-bottom:1px solid #E2E8F0;color:${isMet?'#06845A':'#C42B2B'}">${kpiResult!==null?kpiResult+'%':'N/A'} — ${kpiResult===null?'Pending':isMet?' Achieved':' Below Target'}</td></tr>
            <tr><td style="padding:10px 14px;background:#F8FAFC;font-weight:700;font-size:11px;color:#475569">Department</td><td style="padding:10px 14px;font-size:12px;color:#334155">${deptFull}</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-bottom:22px">
        ${EP(`The KPI result ${isMet?'demonstrates that the department successfully achieved the annual target, reflecting strong operational performance and effective process management.':'shows that the department did not meet the annual target, indicating opportunities for improvement in key operational areas and execution.'}`)}
      </div>

      ${SH('3','Quarterly Performance Results')}
      <p style="font-size:12px;font-weight:700;color:#152538;margin:0 0 10px">3.1 ${kpiNameFull} per Quarter</p>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;margin-bottom:14px;break-inside:avoid">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:linear-gradient(135deg,#152538,#1D3550)">
            <th style="padding:10px 14px;text-align:left;font-size:9px;font-weight:700;color:rgba(255,255,255,.85)">QUARTER</th>
            <th style="padding:10px 14px;text-align:center;font-size:9px;font-weight:700;color:rgba(255,255,255,.85)">TARGET</th>
            <th style="padding:10px 14px;text-align:center;font-size:9px;font-weight:700;color:#0195af">ACTUAL RESULT</th>
            <th style="padding:10px 14px;text-align:center;font-size:9px;font-weight:700;color:rgba(255,255,255,.85)">STATUS</th>
          </tr></thead>
          <tbody>${QR('Q1 '+kpiYear,q1v)}${QR('Q2 '+kpiYear,q2v)}${QR('Q3 '+kpiYear,q3v)}${QR('Q4 '+kpiYear,q4v)}</tbody>
        </table>
      </div>
      <div style="margin-bottom:22px">
        <div style="background:rgba(1,149,175,.05);border:1px solid rgba(1,149,175,.18);border-radius:9px;padding:12px 15px;margin-bottom:6px">
        <p style="font-size:11px;font-weight:700;color:#152538;margin:0 0 6px">Analysis:</p>
        ${EP(qBullets||'No quarterly data available for the selected period.')}
      </div>
      </div>

      ${SH('4','Target vs Actual KPI (Quarterly)')}
      <div style="margin-bottom:10px">
        ${EP('This comparison illustrates the gap between actual performance and the annual target across the four quarters. Green bars indicate quarters where the target was achieved; red bars show performance gaps.')}
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:14px;break-inside:avoid">
        <canvas id="rptBarChart" style="width:100%;max-height:220px"></canvas>
      </div>
      <div style="margin-bottom:22px">
        <div style="background:rgba(22,163,74,.05);border:1px solid rgba(22,163,74,.18);border-radius:9px;padding:12px 15px;margin-bottom:6px">
        <p style="font-size:11px;font-weight:700;color:#152538;margin:0 0 6px">Key Findings:</p>
        ${EP(kfLines||'Insufficient data for findings analysis.')}
      </div>
      </div>

      ${SH('5','Annual KPI Trend (Q1–Q4)')}
      <div style="margin-bottom:10px">
        ${EP('The annual trend shows quarterly performance trajectory throughout the year. The dashed red line represents the target threshold for visual reference.')}
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:14px;break-inside:avoid">
        <canvas id="rptLineChart" style="width:100%;max-height:200px"></canvas>
      </div>
      <div style="margin-bottom:22px">
        <div style="background:rgba(100,116,139,.06);border:1px solid rgba(100,116,139,.18);border-radius:9px;padding:12px 15px;margin-bottom:6px">
        <p style="font-size:11px;font-weight:700;color:#152538;margin:0 0 6px">Interpretation:</p>
        ${EP([
          'Performance remained relatively '+([[q1v,q2v,q3v,q4v].filter(v=>v!==null).reduce((a,b,i,arr)=>a+(b-arr[0]),0)].map(d=>Math.abs(d)<10?'stable':'variable')[0])+' across the reporting period.',
          isMet?'The department maintained performance above the target threshold.':'Further corrective action is needed to achieve full target compliance.'
        ].join(' '))}
      </div>
      </div>

      ${SH('6','KPI Achievement Distribution')}
      <div style="display:grid;grid-template-columns:200px 1fr;gap:22px;align-items:center;margin-bottom:22px;break-inside:avoid">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:center">
          <canvas id="rptDonut" style="max-width:176px;max-height:176px"></canvas>
        </div>
        <div>
          ${EP(`The KPI achievement distribution visualises overall performance against the target. The department achieved <strong style="color:${isMet?'#06845A':'#C42B2B'}">${kpiResult!==null?kpiResult+'%':'N/A'}</strong> against an annual target of <strong>${kpiTarget}%</strong>.`)}
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:7px">
            ${[
              {l:'Achieved',v:kpiResult||0,c:'#06845A',bg:'#ECFDF5',b:'#A7F3D0'},
              {l:'Remaining Gap',v:kpiResult!==null?Math.max(0,kpiTarget-kpiResult):0,c:'#C42B2B',bg:'#FEF2F2',b:'#FECACA'},
              {l:'Target',v:kpiTarget,c:'#1E40AF',bg:'#EFF6FF',b:'#BFDBFE'}
            ].map(m=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${m.bg};border:1px solid ${m.b};border-radius:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:${m.c};flex-shrink:0"></div>
              <span style="flex:1;font-size:11px;font-weight:600;color:#334155">${m.l}</span>
              <span style="font-size:18px;font-weight:800;color:${m.c};font-family:monospace">${m.v}%</span>
            </div>`).join('')}
          </div>
        </div>
      </div>

      ${SH('7','Key Performance Enablers')}
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:22px;break-inside:avoid">
        ${[
          {n:1,i:'',t:'Enhanced Emergency Response Procedures',d:'Clear escalation protocols and response procedures were established and communicated across all shift teams.'},
          {n:2,i:'',t:'Manpower Allocation',d:'Better allocation of manpower during critical situations ensured faster deployment and reduced response times.'},
          {n:3,i:'',t:'Management Follow-up & Escalation',d:'Increased management oversight and real-time escalation channels supported early issue detection and resolution.'},
          {n:4,i:'',t:'Improved Communication Mechanisms',d:'Enhanced internal communication and reporting mechanisms streamlined coordination across departments.'}
        ].map((e,_i)=>{const _id='kpe'+(_i+1);return `<div style="display:flex;gap:12px;padding:11px 15px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;align-items:flex-start">
          <div style="width:26px;height:26px;background:#152538;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">${e.i||e.n}</div>
          ${EP('<strong>'+e.t+'</strong> — '+e.d,'font-size:11.5px;color:#334155;line-height:1.7;margin:0;flex:1')}
        </div>`;}).join('')}
      </div>

      ${SH('8','Recommendations & Improvement Opportunities')}
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:22px;break-inside:avoid">
        ${recs.map((r,i)=>`<div style="display:flex;gap:12px;padding:11px 15px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;align-items:flex-start">
          <div style="width:26px;height:26px;background:#152538;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">${i+1}</div>
          ${EP(r,'font-size:11.5px;color:#334155;line-height:1.85;margin:0;flex:1')}
        </div>`).join('')}     </div>

      ${SH('9','Conclusion & Forward Outlook')}
      <div style="background:linear-gradient(135deg,rgba(1,149,175,.07),rgba(21,37,56,.04));border:1px solid rgba(1,149,175,.20);border-radius:10px;padding:16px 20px;margin-bottom:8px;break-inside:avoid">
        ${EP(`${deptFull} demonstrated ${isMet?'strong':'gradual improvement in the'} ${kpiNameFull} KPI during ${period}. ${kpiResult!==null?`${isMet?'The department achieved full compliance with the annual target of':'Although the annual target of'} <strong>${kpiTarget}%</strong> ${isMet?', demonstrating operational excellence.':'was not fully met, the performance trajectory indicates positive momentum.'}`:''} By maintaining corrective actions and strengthening early-year response strategies, the department can achieve consistent full compliance in future performance cycles. Moving forward, the Governance & Performance Department recommends sustaining high-performance practices, addressing identified gaps, and continuing to monitor results on a quarterly basis.`)}
      </div>

      <!-- Footer -->
      <div style="margin-top:28px;background:#152538;border-radius:10px;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:3px;height:32px;background:#0195af;border-radius:2px;flex-shrink:0"></div>
          <div>
            <p style="margin:0;font-size:10px;font-weight:800;color:#fff">Qassim University Medical City</p>
            <p style="margin:2px 0 0;font-size:8.5px;color:rgba(255,255,255,.50)">Facilities &amp; Safety Division · Governance &amp; Performance Department</p>
          </div>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:8.5px;color:rgba(255,255,255,.55)">Generated: ${dateStr}</p>
          <p style="margin:3px 0 0;display:inline-flex;align-items:center;gap:5px;padding:2px 10px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.25);border-radius:20px;font-size:8px;font-weight:700;color:#0195af;letter-spacing:.06em;text-transform:uppercase"></p>
        </div>
      </div>
    </div>
  </div></div>`;

  /* Hover for edit buttons */
  el.querySelectorAll('.rpt-ep').forEach(w=>{
    w.addEventListener('mouseenter',()=>{const b=w.querySelector('.rpt-edit-btn');if(b)b.style.opacity='1';});
    w.addEventListener('mouseleave',()=>{const b=w.querySelector('.rpt-edit-btn');if(b&&!w.dataset.editing)b.style.opacity='0';});
  });

  /* Charts */
  setTimeout(()=>{
    requestAnimationFrame(()=>{['rptBarChart','rptLineChart','rptDonut'].forEach(id=>{if(CH[id]){CH[id].destroy();delete CH[id];}});
    const qVals=[q1v,q2v,q3v,q4v];
    let lq=0;qVals.forEach((v,i)=>{if(v!==null)lq=i+1;});
    const aL=['Q1','Q2','Q3','Q4'].slice(0,lq||4);
    const aV=qVals.slice(0,lq||4);

    CH['rptBarChart']=mkChart('rptBarChart',{type:'bar',data:{labels:aL,datasets:[
      {label:'Actual',data:aV,backgroundColor:aV.map(v=>v===null?'#CBD5E1':v>=kpiTarget?'rgba(22,163,74,.72)':'rgba(220,38,38,.68)'),borderRadius:5,borderSkipped:false},
      {label:'Target',data:aL.map(()=>kpiTarget),type:'line',borderColor:'#C42B2B',borderWidth:2,borderDash:[6,4],pointRadius:0,fill:false,order:0}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:10}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.parsed.y+'%'}}},scales:{y:{min:0,max:110,ticks:{callback:v=>v+'%',font:{size:10}},grid:{color:'rgba(20,35,80,.06)'}},x:{ticks:{font:{size:11,weight:'600'}},grid:{display:false}}}}});

    const ks25=ks.filter(k=>k.yr===2025),ks26=ks.filter(k=>k.yr===2026);
    const avgQ=(arr,q)=>{const vs=arr.map(k=>k[q]).filter(v=>v!==null);return vs.length?+(vs.reduce((a,b)=>a+b)/vs.length).toFixed(1):null;};
    const l25=['q1','q2','q3','q4'].map(q=>avgQ(ks25.length?ks25:ks,q));
    const l26=['q1','q2','q3','q4'].map(q=>avgQ(ks26,q));
    const has26=l26.some(v=>v!==null);
    CH['rptLineChart']=mkChart('rptLineChart',{type:'line',data:{labels:['Q1','Q2','Q3','Q4'],datasets:[
      {label:'2025',data:l25,borderColor:'#0195af',backgroundColor:'rgba(1,149,175,.10)',tension:.4,pointRadius:4,pointBackgroundColor:'#0195af',borderWidth:2.5,fill:true,spanGaps:true},
      ...(has26?[{label:'2026',data:l26,borderColor:'#152538',backgroundColor:'rgba(21,37,56,.07)',tension:.4,pointRadius:4,pointBackgroundColor:'#152538',borderWidth:2.5,fill:true,spanGaps:true}]:[]),
      {label:'Target',data:[kpiTarget,kpiTarget,kpiTarget,kpiTarget],borderColor:'#C42B2B',borderWidth:1.5,borderDash:[6,4],pointRadius:0,fill:false,order:0}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:10}},tooltip:{mode:'index',intersect:false}},scales:{y:{min:0,max:110,ticks:{callback:v=>v+'%',font:{size:10}},grid:{color:'rgba(20,35,80,.06)'}},x:{ticks:{font:{size:11,weight:'600'}},grid:{display:false}}}}});

    const ach=kpiResult||0,gap=kpiResult!==null?Math.max(0,kpiTarget-kpiResult):0;
    CH['rptDonut']=mkChart('rptDonut',{type:'doughnut',data:{labels:['Achieved','Gap','Pending'],datasets:[{data:[ach,gap,Math.max(0,100-ach-gap)],backgroundColor:['rgba(22,163,74,.80)','rgba(220,38,38,.70)','rgba(203,213,225,.50)'],borderColor:['#16A34A','#DC2626','#CBD5E1'],borderWidth:2,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:true,cutout:'62%',plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:c=>c.label+': '+c.parsed+'%'}}}}});
    });
  },120);
}

function rptStartEdit(id){
  const _role=window._fbRole||'';
  /* Only super_admin and admin may edit report content */
  if(_role!=='super_admin'&&_role!=='admin'){
    const wrap=document.getElementById(id+'-w');
    if(wrap){
      wrap.style.outline='2px solid #DC2626';
      wrap.style.borderRadius='6px';
      setTimeout(()=>{wrap.style.outline='none';},900);
    }
    return;
  }
  const p=document.getElementById(id);
  const wrap=document.getElementById(id+'-w');
  if(!p||!wrap||wrap.dataset.editing)return;
  wrap.dataset.editing='1';
  p.contentEditable='true';
  p.focus();
  p.style.outline='2px solid rgba(0,163,196,.40)';
  p.style.borderRadius='6px';
  p.style.padding='4px 8px';
  /* Hide edit btn, show done btn */
  const editBtn=wrap.querySelector('.rpt-edit-btn');
  if(editBtn)editBtn.style.display='none';
  /* Find or create the acts column */
  const acts=document.getElementById(id+'-acts')||wrap;
  /* Hide edit btn */
  const _origTxt=p.innerHTML;
  /* Save button */
  const doneBtn=document.createElement('button');
  doneBtn.className='rpt-edit-btn done-btn';
  doneBtn.style.cssText='position:static;opacity:1;transform:none;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;font-size:9px';
  doneBtn.innerHTML='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Save';
  doneBtn.onclick=()=>{rptDoneEdit(id);cancelBtn.remove();};
  acts.appendChild(doneBtn);
  /* Cancel button */
  const cancelBtn=document.createElement('button');
  cancelBtn.className='rpt-edit-btn';
  cancelBtn.style.cssText='position:static;opacity:1;transform:none;background:#FEF2F2;border-color:#FECACA;color:#DC2626;padding:4px 8px;font-size:9px';
  cancelBtn.innerHTML='&#8592; Undo';
  cancelBtn.onclick=()=>{
    p.innerHTML=_origTxt;p.contentEditable='false';
    p.style.outline='none';p.style.padding='';
    delete wrap.dataset.editing;
    doneBtn.remove();cancelBtn.remove();
    const eb=acts.querySelector('.rpt-edit-btn:not(.done-btn)');
    if(eb){eb.style.display='';eb.style.opacity='1';eb.style.transform='none';}
    wrap.style.opacity='';
  };
  acts.appendChild(cancelBtn);
  wrap.style.opacity='1';
}

function rptDoneEdit(id){
  const p=document.getElementById(id);
  const wrap=document.getElementById(id+'-w');
  if(!p||!wrap)return;
  if(!ST.rptEdits)ST.rptEdits={};
  /* Build the SAME stable key used when rendering */
  const _stableKpi=window._rptKpi||'_all_';
  /* Extract section index from id (format: 'epN') */
  const _sIdx=parseInt((id||'ep0').replace('ep',''))||0;
  const _rCtxKey='rpt_'+_stableKpi+'_'+_sIdx;
  ST.rptEdits[_rCtxKey]=p.innerHTML;
  /* Save to localStorage + Firestore via unified helper */
  if(typeof persistST==='function'){
    persistST('REPORT_EDIT:'+_rCtxKey).catch(function(e){
      console.warn('[rptDoneEdit] Cloud sync failed:',e.code||e.message);
    });
  } else {
    sLS(ST);
  }
  /* [REMOVED] toggleLang FS write — language is local preference only */
  if(typeof toast==='function')toast(lang==='ar'?'تم حفظ تعديل التقرير بشكل دائم':'Report edit saved permanently');
  delete wrap.dataset.editing;
  p.contentEditable='false';
  p.style.outline='none';
  p.style.padding='0';
  /* Remove done btn, restore edit btn */
  wrap.querySelectorAll('button').forEach(b=>b.remove());
  const editBtn=document.createElement('button');
  editBtn.className='rpt-edit-btn';
  editBtn.style.cssText='position:absolute;top:0;right:0;display:flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(0,163,196,.10);border:1px solid rgba(0,163,196,.25);border-radius:6px;color:#00A3C4;font-size:9.5px;font-weight:700;cursor:pointer;font-family:inherit;opacity:0;transition:opacity .2s';
  editBtn.innerHTML=' Edit';
  editBtn.onclick=()=>rptStartEdit(id);
  wrap.appendChild(editBtn);
  editBtn.style.opacity='1';
  editBtn.style.transform='none';
}

function _drawBarChart(ks,qVals,kpiTarget,canvasId){
  canvasId=canvasId||'rptBarChart';
  const cv=document.getElementById(canvasId);if(!cv)return;
  cv.width=cv.offsetWidth||820;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  const PAD={t:36,r:24,b:48,l:52};
  const cw=W-PAD.l-PAD.r,ch=H-PAD.t-PAD.b;
  const labels=['Q1','Q2','Q3','Q4'];
  const vals=qVals||labels.map((_,i)=>{const q=['q1','q2','q3','q4'][i];const v=ks.map(k=>k[q]).filter(x=>x!==null);return v.length?+(v.reduce((a,b)=>a+b)/v.length).toFixed(1):null;});
  const tgt=kpiTarget||90;
  ctx.clearRect(0,0,W,H);
  /* Background */
  ctx.fillStyle='#F8FAFC';
  ctx.fillRect(0,0,W,H);
  /* Grid */
  for(let i=0;i<=5;i++){
    const y=PAD.t+ch*(1-i/5);
    ctx.strokeStyle='rgba(226,232,240,0.9)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PAD.l,y);ctx.lineTo(W-PAD.r,y);ctx.stroke();
    ctx.fillStyle='#94A3B8';ctx.font='10px system-ui';ctx.textAlign='right';
    ctx.fillText(i*20+'%',PAD.l-7,y+4);
  }
  /* Bars */
  const bw=Math.min(60,cw/labels.length*0.55);
  labels.forEach((q,i)=>{
    const v=vals[i];
    if(v===null)return;
    const x=PAD.l+i*(cw/4)+cw/8-bw/2;
    const bh=Math.max(2,(v/100)*ch);
    const y=PAD.t+ch-bh;
    const ok2=v>=tgt;
    /* shadow */
    ctx.shadowColor=ok2?'rgba(6,132,90,.2)':'rgba(196,43,43,.2)';
    ctx.shadowBlur=6;ctx.shadowOffsetY=2;
    /* gradient bar */
    const grad=ctx.createLinearGradient(0,y,0,y+bh);
    grad.addColorStop(0,ok2?'#34D399':'#F87171');
    grad.addColorStop(1,ok2?'#06845A':'#C42B2B');
    ctx.fillStyle=grad;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x,y,bw,bh,4);
    else ctx.rect(x,y,bw,bh);
    ctx.fill();
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    /* value label on top */
    ctx.fillStyle=ok2?'#065F46':'#7F1D1D';ctx.font='bold 11px system-ui';ctx.textAlign='center';
    ctx.fillText(v+'%',x+bw/2,y-7);
    /* quarter label */
    ctx.fillStyle='#475569';ctx.font='bold 11px system-ui';ctx.textAlign='center';
    ctx.fillText(q,x+bw/2,H-PAD.b+16);
    /* year under Q */
    ctx.fillStyle='#94A3B8';ctx.font='9px system-ui';
    ctx.fillText('2025',x+bw/2,H-PAD.b+28);
  });
  /* Target line */
  const ty=PAD.t+ch*(1-tgt/100);
  ctx.setLineDash([7,5]);ctx.strokeStyle='#C42B2B';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(PAD.l,ty);ctx.lineTo(W-PAD.r,ty);ctx.stroke();
  ctx.setLineDash([]);
  /* Target label */
  ctx.fillStyle='#fff';ctx.fillRect(W-PAD.r-58,ty-12,54,18);
  ctx.fillStyle='#C42B2B';ctx.font='bold 9.5px system-ui';ctx.textAlign='left';
  ctx.fillText('Target: '+tgt+'%',W-PAD.r-56,ty+1);
  /* Title */
  ctx.fillStyle='#152538';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText('Quarterly Performance vs Target',W/2,20);
}
function _drawLineChart(ks){
  const cv=document.getElementById('rptLineChart');if(!cv)return;
  cv.width=cv.offsetWidth||780;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  const PAD={t:38,r:90,b:44,l:52};
  const cw=W-PAD.l-PAD.r,ch=H-PAD.t-PAD.b;
  const labels=['Q1','Q2','Q3','Q4'];
  const qKeys=['q1','q2','q3','q4'];
  const ks25=ks.filter(k=>k.yr===2025);
  const ks26=ks.filter(k=>k.yr===2026);
  const allKs=ks.length?ks:[];

  /* avg per quarter for each year */
  const pts25=qKeys.map(q=>{
    const v=ks25.length?ks25.map(k=>k[q]).filter(v=>v!==null):allKs.map(k=>k[q]).filter(v=>v!==null);
    return v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null;
  });
  const pts26=qKeys.map(q=>{
    const v=ks26.map(k=>k[q]).filter(v=>v!==null);
    return v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null;
  });
  const allAvgTgt=allKs.length?+(allKs.reduce((a,k)=>a+k.target,0)/allKs.length).toFixed(1):90;

  ctx.clearRect(0,0,W,H);

  /* Background */
  ctx.fillStyle='#F8FAFC';
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(0,0,W,H,8):ctx.rect(0,0,W,H);
  ctx.fill();

  /* Grid lines + Y labels */
  for(let i=0;i<=5;i++){
    const y=PAD.t+ch*(1-i/5);
    ctx.strokeStyle=i===0?'rgba(226,232,240,1)':'rgba(226,232,240,.7)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PAD.l,y);ctx.lineTo(W-PAD.r,y);ctx.stroke();
    ctx.fillStyle='#94A3B8';ctx.font='10px system-ui';ctx.textAlign='right';
    ctx.fillText(i*20+'%',PAD.l-6,y+4);
  }

  /* X axis labels */
  labels.forEach((q,i)=>{
    const x=PAD.l+i*(cw/3);
    ctx.fillStyle='#64748B';ctx.font='bold 10px system-ui';ctx.textAlign='center';
    ctx.fillText(q,x,H-PAD.b+16);
  });

  /* Target line */
  const ty=PAD.t+ch*(1-allAvgTgt/100);
  ctx.strokeStyle='rgba(196,43,43,.55)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(PAD.l,ty);ctx.lineTo(W-PAD.r,ty);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='#C42B2B';ctx.font='bold 9px system-ui';ctx.textAlign='left';
  ctx.fillText('Target: '+Math.round(allAvgTgt)+'%',W-PAD.r+5,ty+4);

  /* Draw line helper */
  const drawLine=(pts,color,labelTxt)=>{
    const valid=pts.map((v,i)=>({v,i})).filter(p=>p.v!==null);
    if(valid.length<1)return;
    /* Gradient fill */
    const grad=ctx.createLinearGradient(0,PAD.t,0,PAD.t+ch);
    grad.addColorStop(0,color+'33');grad.addColorStop(1,color+'05');
    if(valid.length>=2){
      ctx.beginPath();
      ctx.moveTo(PAD.l+valid[0].i*(cw/3),PAD.t+ch);
      valid.forEach(p=>ctx.lineTo(PAD.l+p.i*(cw/3),PAD.t+ch*(1-p.v/100)));
      ctx.lineTo(PAD.l+valid[valid.length-1].i*(cw/3),PAD.t+ch);
      ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    }
    /* Line */
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();
    valid.forEach((p,i)=>{
      const x=PAD.l+p.i*(cw/3),y=PAD.t+ch*(1-p.v/100);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    /* Dots + values */
    valid.forEach(p=>{
      const x=PAD.l+p.i*(cw/3),y=PAD.t+ch*(1-p.v/100);
      const isGood=p.v>=allAvgTgt;
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);
      ctx.fillStyle=isGood?'#06845A':'#C42B2B';ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=isGood?'#06845A':'#C42B2B';ctx.font='bold 9.5px system-ui';ctx.textAlign='center';
      ctx.fillText(p.v+'%',x,y-11);
    });
    /* Legend entry */
    return{color,label:labelTxt};
  };

  const legends=[];
  const l1=drawLine(pts25,'#00A3C4','2025');
  const l2=drawLine(pts26,'#1E3356','2026');
  if(l1)legends.push(l1);if(l2&&pts26.some(v=>v!==null))legends.push(l2);

  /* Legend */
  let lx=PAD.l+8;
  legends.forEach(lg=>{
    ctx.fillStyle=lg.color;ctx.fillRect(lx,PAD.t-22,14,10);
    ctx.fillStyle='#334155';ctx.font='10px system-ui';ctx.textAlign='left';
    ctx.fillText(lg.label,lx+18,PAD.t-13);
    lx+=60;
  });

  /* Title */
  ctx.fillStyle='#152538';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText('Annual KPI Performance Trend — 2025 vs 2026',W/2,18);
}
function _drawDonut(achieved,gap,target){
  const cv=document.getElementById('rptDonut');if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  const cx=W/2,cy=H/2,r=Math.min(W,H)/2-16,inner=r*0.58;
  ctx.clearRect(0,0,W,H);
  const total=target||100;
  const ach=Math.min(achieved,total);
  const rem=Math.max(0,total-ach);
  const segs=[{v:ach,c:'#06845A'},{v:rem,c:'#FCA5A5'}];
  let start=-Math.PI/2;
  segs.forEach(s=>{
    if(!s.v)return;
    const ang=(s.v/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,start+ang);
    ctx.closePath();ctx.fillStyle=s.c;ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke();
    start+=ang;
  });
  ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#fff';ctx.fill();
  ctx.fillStyle=ach>=total?'#06845A':'#C42B2B';
  ctx.font='bold 24px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(ach+'%',cx,cy-8);
  ctx.fillStyle='#64748B';ctx.font='10px system-ui';
  ctx.fillText('Achieved',cx,cy+12);
  ctx.fillStyle='#CBD5E1';ctx.font='9px system-ui';
  ctx.fillText('vs '+total+'% target',cx,cy+26);
  ctx.textBaseline='alphabetic';
}
function exportWordDoc(){
  const doc=document.getElementById('reportDoc');
  if(!doc){toast(' Open the Report tab first');return;}
  const today=new Date(),ds=today.toISOString().slice(0,10);
  const deptLabel=F.dept==='all'?'All_Depts':F.dept.toUpperCase();
  const wordHTML=`<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><title>QUMC KPI Report — ${deptLabel}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4 portrait;margin:15mm 18mm}body{font-family:'Calibri',sans-serif;font-size:11pt;color:#1E293B;margin:0;padding:0}table{width:100%;border-collapse:collapse;font-size:9.5pt}th{background:#152538;color:#fff;padding:7pt 9pt;text-align:center;font-weight:bold;font-size:9pt}td{padding:5.5pt 8pt;border:0.5pt solid #E2E8F0;vertical-align:middle}h1,h2{font-family:'Calibri',sans-serif}.met-cell{background:#ECFDF5;color:#166534;font-weight:bold;text-align:center}.miss-cell{background:#FEE2E2;color:#991B1B;font-weight:bold;text-align:center}
/* == AI Assistant == */
.ai-chip{padding:5px 12px;border-radius:20px;border:1.5px solid rgba(0,163,196,.28);background:rgba(0,163,196,.07);color:#00A3C4;font-size:10.5px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
.ai-chip:hover{background:rgba(0,163,196,.18);border-color:#00A3C4;transform:translateY(-1px)}
@keyframes aiDot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-6px);opacity:1}}
</style>
<style id="_qumc_hotfix_layout">
/* Hotfix: restore executive summary bar and detailed KPI cards stacking */
#execGrid{align-items:start!important;}
#execIntelBar{margin-bottom:16px!important;}
#execKpiCards{display:block!important;clear:both!important;min-height:260px!important;}
#execGrid > .card.c12{margin-top:14px!important;position:relative!important;z-index:1!important;}
#backPortalBtn{font-family:var(--font)!important;}
</style>
</head><body>${doc.innerHTML}</body></html>`;
  const blob=new Blob(['﻿'+wordHTML],{type:'application/msword;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='QUMC_KPI_Report_'+deptLabel+'_'+ds+'.doc';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast(lang==='ar'?' تم تحميل تقرير Word':' Word report downloaded');
}


/* FIX 2: Encrypted Backup — AES-GCM */
async function exportSnapshot(){
  const pin=prompt(lang==='ar'?'أدخل رمز الأدمن لتشفير النسخة الاحتياطية:':'Enter Admin PIN to encrypt backup:');
  if(!pin)return;
  try{
    const keyMat=await crypto.subtle.importKey('raw',
      new TextEncoder().encode(pin.padEnd(32,'0').slice(0,32)),
      'AES-GCM',false,['encrypt']);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},keyMat,
      new TextEncoder().encode(JSON.stringify(ST)));
    const payload=JSON.stringify({
      v:3,iv:Array.from(iv),
      data:Array.from(new Uint8Array(encrypted)),
      ts:new Date().toISOString(),
      kpiCount:allK().length
    });
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([payload],{type:'application/octet-stream'}));
    a.download='QUMC_Backup_'+new Date().toISOString().slice(0,10)+'.qumc';
    a.click();
    toast(lang==='ar'?' تم حفظ النسخة الاحتياطية المشفرة':' Encrypted backup saved');
    addAudit('BACKUP_EXPORT','Encrypted backup exported');sLS(ST);
  }catch(e){toast(' Backup failed: '+e.message);}
}

async function importSnapshot(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.qumc';
  inp.onchange=async()=>{
    if(!inp.files[0])return;
    const pin=prompt(lang==='ar'?'أدخل الرمز لفك التشفير:':'Enter PIN to decrypt:');
    if(!pin)return;
    try{
      const text=await inp.files[0].text();
      const {v,iv,data}=JSON.parse(text);
      const km=await crypto.subtle.importKey('raw',
        new TextEncoder().encode(pin.padEnd(32,'0').slice(0,32)),'AES-GCM',false,['decrypt']);
      const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(iv)},
        km,new Uint8Array(data));
      const restored=JSON.parse(new TextDecoder().decode(decrypted));
      if(confirm(lang==='ar'?' سيتم استبدال البيانات الحالية. هل أنت متأكد؟':' This will replace current data. Are you sure?')){
        Object.assign(ST,restored);sLS(ST);renderCurrent();
        toast(lang==='ar'?' تمت استعادة النسخة الاحتياطية':' Backup restored');
        addAudit('BACKUP_IMPORT','Backup restored from encrypted file');sLS(ST);
      }
    }catch(e){toast(' '+(lang==='ar'?'فشل فك التشفير — رمز خاطئ؟':'Decryption failed — wrong PIN?'));}
  };
  inp.click();
}
