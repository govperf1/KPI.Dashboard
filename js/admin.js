/* ===========================================================
   QUMC Dashboard  --  admin.js
   Admin panel, Gap Analysis, KPI CRUD.

   Functions:
     openKpiPCI()              -- open PCI detail modal
     switchPCIQ()              -- switch PCI quarter
     calcPCI() / savePCI() / closePCI()
     calcAdminPCI()            -- PCI result calculation
     recalcAllAddPCI/EditPCI() -- recalculate table rows
     openGap()                 -- gap analysis panel
     openGapQuarter()          -- per-quarter gap form
     saveGapKPO()              -- save gap entry
     openReport()              -- report overlay
     openLock()                -- admin panel (pin gate)
     doPin()                   -- validate admin pin
     openAdmin()               -- admin tab
     resetAdminTimer()         -- inactivity reset
     getKpiNameBank / populateKpiNamePresets / handleKpiNamePreset
     persistKpiNameToBank
     popAdminSels / popGapSel / parseGapKey
     loadEK()                  -- load KPI into edit form
     loadGD() / loadActD() / swAt()
     populateAddYears / showKpoGapStatusPopup
     refreshAllViewsAfterKpiChange()
     saveAdmin()               -- save edits / add KPI
     populateDelKpiList / previewDelKpi / confirmDelKpi

   Depends on:
     kpi.js       (ST, F, allK, sLS, addAudit, toast, lang,
                   htmlEsc, normalizeOperator, updateBadge)
     dashboard.js (renderCurrent)
   =========================================================== */

/* -- KPI PCI quarterly input modal + calcAdminPCI -- */
function openKpiPCI(id){
  const k=allK().find(x=>x.id===id);if(!k)return;
  _pciKpiId=id;
  const dm=DM[k.dept];
  document.getElementById('pciTitle').textContent=k.nameEn;
  document.getElementById('pciSub').textContent=`${k.id} · ${dm?dm.en:k.dept} · ${k.yr} · Target: ${k.op==='='?'=':'≥'}${k.target}%`;
  /* Build quarter tabs */
  const qs=['q1','q2','q3','q4'].filter(q=>k[q]!==null||(ST.pci||{})[id]?.[q]);
  if(!qs.length)qs.push('q1');
  const tabs=document.getElementById('pciQTabs');
  tabs.innerHTML=qs.map((q,i)=>`<button id="pciTab_${q}" onclick="switchPCIQ('${q}',this)" style="flex:1;padding:6px 0;border-radius:8px;border:1.5px solid ${i===0?'var(--ink)':'var(--border)'};background:${i===0?'var(--ink)':'transparent'};cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;color:${i===0?'#fff':'var(--t2)'};transition:all .15s">${q.toUpperCase()}</button>`).join('');
  switchPCIQ(qs[0],tabs.querySelector('button'));
  const m=document.getElementById('pciModal');m.style.display='flex';requestAnimationFrame(()=>m.classList.add('open'));
}

function switchPCIQ(q,btn){
  _pciQ=q;
  document.querySelectorAll('#pciQTabs button').forEach(b=>{b.style.background='transparent';b.style.color='var(--t2)';b.style.borderColor='var(--border)';});
  if(btn){btn.style.background='var(--ink)';btn.style.color='#fff';btn.style.borderColor='var(--ink)';}
  const k=allK().find(x=>x.id===_pciKpiId);
  const pci=((ST.pci||{})[_pciKpiId]||{})[q]||{};
  const pl=pci.planned||0, co=pci.complete||0, ic=pci.incomplete||0;
  const hasData=pl>0||co>0||ic>0;
  /* Color-coded read-only boxes: Planned=gray, Complete=green, Incomplete=red */
  const mkBox=(icon,label,val,bg,txt,border)=>`
    <div style="background:${bg};border:1.5px solid ${border};border-radius:10px;padding:14px 10px;text-align:center">
      <div style="font-size:8px;font-weight:800;color:${txt};letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px;opacity:.80">${icon} ${label}</div>
      <div style="font-size:30px;font-weight:800;font-family:var(--mono);color:${txt};line-height:1">${hasData?val:'—'}</div>
    </div>`;
  const boxes=document.getElementById('pciBoxes');
  if(boxes){boxes.innerHTML=
    mkBox('','Planned',  pl,'rgba(100,116,139,.08)','#64748B','rgba(100,116,139,.22)')
   +mkBox('', 'Complete', co,'rgba(5,150,105,.09)',  '#059669','rgba(5,150,105,.22)')
   +mkBox('', 'Incomplete',ic,'rgba(220,38,38,.09)', '#DC2626','rgba(220,38,38,.22)');
  }
  /* Result bar */
  const pct=pl>0?Math.min(100,+(co/pl*100).toFixed(1)):null;
  const isMet=k&&pct!==null&&pct>=k.target;
  const resEl=document.getElementById('pciResult');
  const fillEl=document.getElementById('pciBarFill');
  const boxEl=document.getElementById('pciResultBox');
  if(resEl){resEl.textContent=pct!==null?pct+'%':'—';resEl.style.color=pct===null?'var(--t3)':isMet?'var(--green)':'var(--red)';}
  if(fillEl){fillEl.style.width=(pct||0)+'%';fillEl.style.background=pct===null?'var(--t3)':isMet?'var(--green)':'var(--red)';}
  if(boxEl){boxEl.style.background=pct===null?'var(--t4)':isMet?'rgba(5,150,105,.07)':'rgba(220,38,38,.07)';boxEl.style.borderColor=pct===null?'var(--border)':isMet?'rgba(5,150,105,.20)':'rgba(220,38,38,.20)';}
  /* Hide "no data" note if data exists */
  const noteEl=document.getElementById('pciNote');
  if(noteEl)noteEl.style.display=hasData?'none':'flex';
}
function calcPCI(){}
function savePCI(){closePCI();}
function closePCI(){const m=document.getElementById('pciModal');if(!m)return;m.classList.remove('open');setTimeout(()=>{m.style.display='none';},280);_pciKpiId=null;_pciQ=null;}

/* == PCI helper for admin forms — colored result vs target == */
function _adminParseNumber(v){
  if(v === null || v === undefined) return null;
  var s = String(v).trim();
  if(!s) return null;
  var ar='٠١٢٣٤٥٦٧٨٩', fa='۰۱۲۳۴۵۶۷۸۹';
  s = s.replace(/[٠-٩]/g, function(d){ return String(ar.indexOf(d)); })
       .replace(/[۰-۹]/g, function(d){ return String(fa.indexOf(d)); })
       .replace(/[\u066B]/g, '.')
       .replace(/[,%٪\u066C]/g, '')
       .replace(/،/g, '')
       .replace(/\s+/g, '');
  if(s === '' || s === '-' || s === '.') return null;
  var n = Number(s);
  return isFinite(n) ? n : null;
}
window._adminParseNumber = _adminParseNumber;

function calcAdminPCI(q,prefix){
  const Q=q.toUpperCase();
  const plEl=document.getElementById(prefix+Q+'_pl');
  const coEl=document.getElementById(prefix+Q+'_co');
  const icEl=document.getElementById(prefix+Q+'_ic');
  const resEl=document.getElementById(prefix+Q+'_res');
  const errId='pci-err-'+prefix+Q;

  const clearErr=()=>{
    if(coEl){coEl.style.borderColor='';coEl.style.background='';coEl.style.boxShadow='';}
    const e=document.getElementById(errId);if(e)e.style.display='none';
  };
  const clearAll=()=>{
    if(icEl)icEl.value='';
    if(resEl){resEl.textContent='—';resEl.style.color='var(--t3)';resEl.style.background='';resEl.style.fontWeight='';resEl.style.padding='';resEl.style.borderRadius='';}
  };
  const showErr=(msg)=>{
    if(coEl){coEl.value='';coEl.style.borderColor='#EF4444';coEl.style.background='rgba(239,68,68,.08)';coEl.style.boxShadow='0 0 0 3px rgba(239,68,68,.15)';}
    clearAll();
    let e=document.getElementById(errId);
    if(!e){
      e=document.createElement('div');e.id=errId;
      e.style.cssText='position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#DC2626;color:#fff;font-size:9px;font-weight:700;padding:4px 10px;border-radius:6px;white-space:nowrap;z-index:999;box-shadow:0 2px 8px rgba(220,38,38,.35)';
      if(coEl){coEl.parentNode.style.position='relative';coEl.parentNode.appendChild(e);}
    }
    e.textContent=msg;e.style.display='block';
    const onNext=()=>{clearErr();coEl&&coEl.removeEventListener('input',onNext);};
    coEl&&coEl.addEventListener('input',onNext);
  };

  const plRaw=plEl?.value??'';
  const coRaw=coEl?.value??'';
  const pl=_adminParseNumber(plRaw) || 0;
  const co=_adminParseNumber(coRaw);

  /* Always clear if Complete not yet entered */
  if(coRaw.trim()===''){clearAll();clearErr();return;}

  /* Planned must also be filled */
  if(plRaw.trim()===''){clearAll();clearErr();return;}

  /* Validate range: 0 ≤ Complete ≤ Planned */
  if(co<0){showErr('Min: 0 — cannot be negative');return;}
  if(co>pl){showErr('Max: '+pl+' — cannot exceed Planned');return;}

  clearErr();

  /* Now show Incomplete and Result */
  if(icEl)icEl.value=Math.max(0,pl-co)||'';

  const pct=pl>0?+(co/pl*100).toFixed(1):0;
  const tgtEl=document.getElementById(prefix==='eAd'?'eTg':'aTg');
  const tgt=tgtEl?(_adminParseNumber(tgtEl.value)||0):0;
  const isMet=tgt>0?pct>=tgt:pct>0;
  if(resEl){
    resEl.textContent=(isMet?'✓ ':'✗ ')+pct+'%';
    resEl.style.color=isMet?'#059669':'#DC2626';
    resEl.style.fontWeight='800';
    resEl.style.background=isMet?'rgba(5,150,105,.10)':'rgba(220,38,38,.10)';
    resEl.style.padding='2px 6px';
    resEl.style.borderRadius='5px';
  }
  const inp=document.getElementById((prefix==='eAd'?'e':'a')+Q);
  if(inp)inp.value=pct;
}

/* -- Gap Analysis -- */
function openGap(id){
  const k=allK().find(x=>x.id===id);if(!k)return;
  document.getElementById('gapT').textContent=(lang==='ar'?'تحليل الفجوة — ':'Gap Analysis — ')+(lang==='ar'?k.nameAr:k.nameEn);

  const QLBL={q1:'Q1',q2:'Q2',q3:'Q3',q4:'Q4'};
  const rows=['q1','q2','q3','q4'].map(q=>{
    const val=k[q];
    if(val===null||val===undefined)return null;
    const missed = !metStatus(k,val);
    const gd=(ST.gaps||{})[id+'_'+q]||{};
    const hasGap=!!(gd.gapEn&&gd.gapEn.trim()&&gd.actEn&&gd.actEn.trim());
    return {q,val,missed,hasGap,gd};
  }).filter(r=>r);

  const gapQuarters=rows.filter(r=>r.missed);

  if(!gapQuarters.length){
    document.getElementById('gapB').innerHTML='<div style="text-align:center;padding:36px 20px;color:var(--t3);font-size:12px">'+
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 10px;opacity:.3"><polyline points="20 6 9 17 4 12"/></svg>'+
      (lang==='ar'?'لا توجد أرباع فيها فجوة لهذا المؤشر — جميع الأرباع متوافقة مع الهدف.':'No quarters with a gap for this KPI — all reported quarters meet target.')+
      '</div>';
    document.getElementById('gapOv').classList.add('open');
    return;
  }

  const list=gapQuarters.map(r=>{
    const statusTxt = r.hasGap ? (lang==='ar'?'تم إدخال البيانات':'Data entered') : (lang==='ar'?'يحتاج بيانات':'Needs data');
    const icon = r.hasGap ? '✓' : '⚠';
    const color = r.hasGap ? '#16A34A':'#DC2626';
    return '<div onclick="openGapQuarter(\''+id+'\',\''+r.q+'\')" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border:1px solid var(--border);border-radius:11px;margin-bottom:8px;background:var(--card);transition:border-color .15s" onmouseover="this.style.borderColor=\'#0195af\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+
      '<div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--ink)">'+QLBL[r.q]+'</div>'+
        '<div style="font-size:10px;color:var(--t3);margin-top:3px">'+(lang==='ar'?'النتيجة':'Result')+': '+r.val+'% &nbsp;|&nbsp; '+(lang==='ar'?'الهدف':'Target')+': '+k.target+'%</div>'+
      '</div>'+
      '<span style="font-size:10px;font-weight:800;padding:4px 11px;border-radius:10px;background:'+color+'1a;color:'+color+';white-space:nowrap">'+icon+' '+statusTxt+'</span>'+
    '</div>';
  }).join('');

  document.getElementById('gapB').innerHTML =
    '<div style="font-size:11px;font-weight:700;color:var(--t2);margin-bottom:12px">'+
      (lang==='ar'?'اختر الربع لعرض تفاصيل الفجوة الكاملة:':'Select a quarter to view full gap details:')+
    '</div>'+list;

  document.getElementById('gapOv').classList.add('open');
}

/* ── Full gap detail view for a specific KPI + Quarter ── */
function openGapQuarter(id,qtr){
  const k=allK().find(x=>x.id===id);if(!k)return;
  const QLBL={q1:'Q1',q2:'Q2',q3:'Q3',q4:'Q4'};
  const val=k[qtr];
  const gapAmt=val!==null?Math.abs(k.target-val).toFixed(2):null;
  const gapKey=id+'_'+qtr;
  const gd=(ST.gaps||{})[gapKey]||{};
  const ac=(ST.actions||{})[gapKey]||{};
  const na=lang==='ar'?'لم تُدخل بيانات بعد — استخدم النموذج أدناه.':'No data yet — use the form below.';
  const rc=getRepeat(k);
  const _gRole=window._fbRole||'';
  const _gAssigned=window._fbAssignedKpis;
  const _canEditGap=_gRole==='admin'||_gRole==='super_admin'||
    (_gRole==='kpi_owner'&&(
      !Array.isArray(_gAssigned)||_gAssigned.length===0||_gAssigned.includes(id)
    ));

  document.getElementById('gapT').textContent=(lang==='ar'?'تحليل الفجوة — ':'Gap Analysis — ')+(lang==='ar'?k.nameAr:k.nameEn)+' · '+QLBL[qtr];

  document.getElementById('gapB').innerHTML=`
    <button onclick="openGap('${id}')" style="display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:10px;font-weight:700;color:var(--t2);cursor:pointer;margin-bottom:12px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      ${lang==='ar'?'كل الأرباع':'All quarters'}
    </button>
    <div style="display:flex;gap:8px;margin-bottom:11px;flex-wrap:wrap">
      <div style="flex:1;min-width:75px;background:var(--red-dim);border-radius:7px;padding:10px;border:1px solid rgba(248,113,113,.2)"><div style="font-size:8.5px;color:var(--red);font-weight:700;text-transform:uppercase;margin-bottom:3px">${lang==='ar'?'الأداء':'Actual'} (${QLBL[qtr]})</div><div style="font-size:22px;font-weight:800;font-family:var(--mono);color:var(--red)">${val!==null?val+'%':'—'}</div></div>
      <div style="flex:1;min-width:75px;background:rgba(255,255,255,.04);border-radius:7px;padding:10px;border:1px solid var(--border)"><div style="font-size:8.5px;color:var(--t3);font-weight:700;text-transform:uppercase;margin-bottom:3px">${lang==='ar'?'الهدف':'Target'}</div><div style="font-size:22px;font-weight:800;font-family:var(--mono);color:var(--teal)">${k.op==='='?'=':'≥'}${k.target}%</div></div>
      ${gapAmt?`<div style="flex:1;min-width:75px;background:var(--red-dim);border-radius:7px;padding:10px;border:1px solid rgba(248,113,113,.2)"><div style="font-size:8.5px;color:var(--red);font-weight:700;text-transform:uppercase;margin-bottom:3px">${lang==='ar'?'الفجوة':'Gap'}</div><div style="font-size:22px;font-weight:800;font-family:var(--mono);color:var(--red)">${gapAmt}%</div></div>`:''}
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">
      <span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">Tier ${k.tier||3}: ${lang==='ar'?TIERS[k.tier||3].ar:TIERS[k.tier||3].en}</span>
      ${rc>=2?`<span class="repeat-b">↩ ${rc} ${lang==='ar'?'أرباع متتالية':'consecutive quarters'}</span>`:''}
    </div>
    <div style="background:var(--red-dim);border-left:2px solid var(--red);border-radius:6px;padding:10px;margin-bottom:8px">
      <div style="font-size:9.5px;font-weight:800;color:var(--red);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em"> ${lang==='ar'?'أسباب الفجوة':'Root Cause / Gap Reasons'}</div>
      <div style="font-size:11.5px;color:var(--t2);line-height:1.7">${gd.gapEn||na}</div>
    </div>
    <div style="background:rgba(52,211,153,.06);border-left:2px solid var(--green);border-radius:6px;padding:10px;margin-bottom:8px">
      <div style="font-size:9.5px;font-weight:800;color:var(--green);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em"> ${lang==='ar'?'الإجراءات التصحيحية':'Corrective Actions'}</div>
      <div style="font-size:11.5px;color:var(--t2);line-height:1.7">${gd.actEn||(lang==='ar'?'لم تُدخل بعد.':'Not entered yet.')}</div>
    </div>
    ${gd.owner||gd.dueDate?`<div style="background:rgba(251,191,36,.08);border-left:2px solid var(--amber);border-radius:6px;padding:10px">
      <div style="font-size:9.5px;font-weight:800;color:var(--amber);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em"> ${lang==='ar'?'المساءلة':'Accountability'}</div>
      ${gd.owner?`<div style="font-size:11px;color:var(--t2);margin-bottom:4px">${lang==='ar'?'المسؤول':'Responsible'}: <strong>${gd.owner}</strong></div>`:''}
      ${gd.dueDate?`<div style="font-size:11px;color:${new Date(gd.dueDate)<new Date()?'var(--red)':'var(--t2)'}">${lang==='ar'?'الموعد':'Due'}: <strong>${gd.dueDate}</strong>${new Date(gd.dueDate)<new Date()?'  '+(lang==='ar'?'متأخر':'Overdue'):''}</div>`:''}
    </div>`:''}
  `;

  /* ── Editable form (admin / kpi_owner) — keyed by KPI + Quarter ── */
  if(_canEditGap){
    const _gd2=gd;
    const _fixedOwner = DEPT_OWNERS[k.dept] || '';
    const _ownerVal = _gd2.owner || _fixedOwner || window._fbName || '';
    const _eForm=document.createElement('div');
    _eForm.style.cssText='margin-top:16px;padding:16px;background:rgba(217,119,6,.06);border:1px solid rgba(217,119,6,.25);border-radius:12px';
    _eForm.innerHTML=`
      <div style="font-size:11px;font-weight:800;color:#D97706;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        ${lang==='ar'?'تحديث تحليل الفجوة':'Gap Analysis Update'} — ${QLBL[qtr]}
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Root Cause / Gap Reasons <span style="color:#DC2626">*</span></label>
        <textarea id="kpo_gE_${id}_${qtr}" style="width:100%;padding:8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;resize:vertical;min-height:60px;font-family:inherit" placeholder="Root causes…">${htmlEsc(_gd2.gapEn||'')}</textarea>
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Corrective Actions <span style="color:#DC2626">*</span></label>
        <textarea id="kpo_aE_${id}_${qtr}" style="width:100%;padding:8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;resize:vertical;min-height:60px;font-family:inherit" placeholder="Actions planned…">${htmlEsc(_gd2.actEn||'')}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Responsible Person <span style="color:#DC2626">*</span></label>
          <input id="kpo_gOwner_${id}_${qtr}" type="text" value="${htmlEsc(_ownerVal)}" ${_fixedOwner?'readonly':''} style="width:100%;padding:6px 8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit${_fixedOwner?';background:#F1F5F9;color:#475569;cursor:not-allowed':''}" placeholder="Name…">
          ${_fixedOwner?`<div style="font-size:8.5px;color:#94A3B8;margin-top:3px">${lang==='ar'?'مسؤول ثابت لهذا القسم':'Fixed for this department'}</div>`:''}
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Due Date <span style="color:#DC2626">*</span></label>
          <input id="kpo_gDue_${id}_${qtr}" type="date" value="${_gd2.dueDate||''}" style="width:100%;padding:6px 8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Priority <span style="color:#DC2626">*</span></label>
          <select id="kpo_actPri_${id}_${qtr}" style="width:100%;padding:6px 8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit">
            <option value="" ${!_gd2.priority?'selected disabled':''}>— Select Priority —</option>
            <option value="critical" ${_gd2.priority==='critical'?'selected':''}>Critical</option>
            <option value="high" ${_gd2.priority==='high'?'selected':''}>High</option>
            <option value="medium" ${_gd2.priority==='medium'?'selected':''}>Medium</option>
            <option value="low" ${_gd2.priority==='low'?'selected':''}>Low</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748B;display:block;margin-bottom:4px">Status <span style="color:#DC2626">*</span></label>
          <select id="kpo_actStatus_${id}_${qtr}" style="width:100%;padding:6px 8px;font-size:11px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit">
            <option value="" ${!_gd2.status?'selected disabled':''}>— Select Status —</option>
            <option value="in-progress" ${_gd2.status==='in-progress'?'selected':''}>In Progress</option>
            <option value="closed" ${_gd2.status==='closed'?'selected':''}>Closed — Completed</option>
          </select>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;font-size:11px;color:#64748B">
        <input id="kpo_atRisk_${id}_${qtr}" type="checkbox" ${_gd2.atRisk?'checked':''} style="width:14px;height:14px">
        Mark as At Risk
      </label>
      <div id="kpo_fb_${id}_${qtr}" style="display:none;font-size:11px;font-weight:600;padding:6px 10px;border-radius:6px;margin-bottom:8px"></div>
      <button onclick="saveGapKPO('${id}','${qtr}')" style="width:100%;padding:9px;background:#D97706;border:none;border-radius:8px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
        Save Gap Analysis
      </button>`;
    document.getElementById('gapB').appendChild(_eForm);
  }
  document.getElementById('gapOv').classList.add('open');
}

/* ── KPI Owner Gap save — per KPI + Quarter ── */
function saveGapKPO(kpiId,qtr){
  const role=window._fbRole||'';
  if(role!=='kpi_owner'&&role!=='admin'&&role!=='super_admin'){
    toast(' Access denied');return;
  }
  if(role==='kpi_owner'){
    const assigned=window._fbAssignedKpis;
    if(Array.isArray(assigned)&&assigned.length>0&&!assigned.includes(kpiId)){
      toast(' You are not assigned to this KPI');return;
    }
  }
  const k=allK().find(x=>x.id===kpiId);if(!k)return;
  const id=kpiId, sfx='_'+id+'_'+qtr;
  const gE=document.getElementById('kpo_gE'+sfx);
  const aE=document.getElementById('kpo_aE'+sfx);
  const gOwner=document.getElementById('kpo_gOwner'+sfx);
  const gDue=document.getElementById('kpo_gDue'+sfx);
  const actPri=document.getElementById('kpo_actPri'+sfx);
  const actStatus=document.getElementById('kpo_actStatus'+sfx);
  const atRisk=document.getElementById('kpo_atRisk'+sfx);
  /* Validate required fields */
  let ok=true;
  [[gE,'Root Cause'],[aE,'Corrective Actions'],[gOwner,'Responsible Person'],[gDue,'Due Date'],[actPri,'Priority'],[actStatus,'Status']].forEach(([el,lbl])=>{
    if(!el)return;
    const empty=!el.value||!el.value.trim();
    el.style.borderColor=empty?'#DC2626':'';
    el.style.boxShadow=empty?'0 0 0 3px rgba(220,38,38,.15)':'';
    if(empty)ok=false;
  });
  if(!ok){toast(' Fill all required fields');return;}

  if(/[\u0600-\u06FF]/.test(gE.value)||/[\u0600-\u06FF]/.test(aE.value)){
    toast(' Gap fields must be in English only — please remove Arabic text');
    return;
  }

  /* Fixed Responsible Person per department (KPI Owner cannot override) */
  const fixedOwner=DEPT_OWNERS[k.dept];
  const ownerVal=fixedOwner||gOwner.value;

  const gapKey=id+'_'+qtr;
  if(!ST.gaps)ST.gaps={};
  const oldGap=ST.gaps[gapKey]?JSON.stringify(ST.gaps[gapKey]):null;
  ST.gaps[gapKey]={
    gapEn:gE.value,
    actEn:aE.value,
    owner:ownerVal,
    dueDate:gDue.value,
    status:actStatus.value,
    priority:actPri.value,
    atRisk:atRisk?.checked||false
  };
  if(!ST.actions)ST.actions={};
  ST.actions[gapKey]={owner:ownerVal,status:actStatus.value,dueDate:gDue.value,priority:actPri.value};
  /* Gap save: sLS (local) + explicit _saveToFS (cloud) — addAudit is memory-only now */
  sLS(ST);
  console.log('[FS WRITE] gap save — user clicked Save Gap Analysis button');
  /* USER ACTION: Save Gap Analysis button → Firestore write */
  if(typeof window._saveToFS==='function')window._saveToFS(ST);
  addAudit('GAP_EDIT','Gap updated for '+id+' · '+qtr.toUpperCase()+' by '+(window._fbName||role),oldGap,'See ST.gaps.'+gapKey);

  const fb=document.getElementById('kpo_fb'+sfx);
  if(fb){fb.textContent='✓ Saved';fb.style.color='#16A34A';fb.style.display='block';}
  toast(' Saved');
  setTimeout(()=>openGapQuarter(id,qtr),400);
}


/* ==========================================
   REPORT

/* -- Admin panel: openReport -> openLock -> saveAdmin -> confirmDelKpi -- */
function openReport(){
  const ks=filt(),nOk=ks.filter(k=>ok(k)===true).length,miss=ks.filter(k=>ok(k)===false).length,rate=ks.length?Math.round(nOk/ks.length*100):0;
  const now=new Date().toLocaleDateString(lang==='ar'?'ar-SA':'en-GB',{year:'numeric',month:'long',day:'numeric'});
  const logo='data:image/jpeg;base64,'+LOGO;
  const hs=lang==='ar'?['الكود','المؤشر','القسم','الهدف','Q1','Q2','Q3','Q4','النتيجة','YoY','المخاطر','الحالة']:['Code','KPI Name','Dept','Target','Q1','Q2','Q3','Q4','Result','YoY','Risk','Status'];
  let rows='',gapSec='';
  ks.forEach(k=>{const v=qv(k),a=ok(k);const yr=k.yoy!==undefined&&k.yoy!==null&&k.q1!==null?((k.q1-k.yoy>=0?'+':'')+(k.q1-k.yoy).toFixed(1)+'%'):'—';
    rows+=`<tr><td><b>${k.id}</b><br><small style="color:#94a3b8">T${k.tier||3}</small></td><td>${lang==='ar'?k.nameAr:k.nameEn}</td><td>${lang==='ar'?DM[k.dept].ar:DM[k.dept].en}</td><td>${k.op==='='?'=':'≥'}${k.target}%</td>${[1,2,3,4].map(i=>`<td>${k['q'+i]!=null?k['q'+i].toFixed(1)+'%':'—'}</td>`).join('')}<td style="font-weight:700;color:${a===null?'#64748b':a?'#065f46':'#7f1d1d'}">${f2(v)}</td><td>${yr}</td><td>${lang==='ar'?TIERS[k.tier||3].ar:TIERS[k.tier||3].en}</td><td><span class="${a===true?'rpt-ok':'rpt-miss'}" style="${a===null?'background:#f1f5f9;color:#64748b':''}">${a===null?'—':a?' Met':' Missed'}</span></td></tr>`;
  });
  ks.filter(k=>ok(k)===false).forEach(k=>{const v=qv(k),g=(k.target-v).toFixed(2);const gd=(ST.gaps||{})[k.id]||{};const ac=(ST.actions||{})[k.id]||{};const rc=getRepeat(k);
    gapSec+=`<div class="rpt-box warn"><div class="rpt-box-t">${k.id} — ${lang==='ar'?k.nameAr:k.nameEn}</div><p style="margin-bottom:4px"><b>${lang==='ar'?'الفجوة:':'Gap:'}</b> -${g}% | <b>${lang==='ar'?'المخاطر:':'Risk:'}</b> ${lang==='ar'?TIERS[k.tier||3].ar:TIERS[k.tier||3].en}${rc>=2?` | <b>${lang==='ar'?'تكرار:':'Repeat:'}</b> ${rc}x`:''}</p><p><b>${lang==='ar'?'الأسباب:':'Reasons:'}</b> ${(lang==='ar'?gd.gapAr:gd.gapEn)||(lang==='ar'?'لم تُدخل':'Not entered')}</p><p><b>${lang==='ar'?'الإجراءات:':'Actions:'}</b> ${(lang==='ar'?gd.actAr:gd.actEn)||(lang==='ar'?'لم تُدخل':'Not entered')}</p>${ac.owner?`<p><b>${lang==='ar'?'المسؤول:':'Owner:'}</b> ${ac.owner} | <b>${lang==='ar'?'الحالة:':'Status:'}</b> ${ac.status||'—'} | <b>${lang==='ar'?'الموعد:':'Due:'}</b> ${ac.dueDate||'—'}</p>`:''}</div>`;
  });
  document.getElementById('rptB').innerHTML=`<div class="rpt"><div class="rpt-pg">
    <div class="rpt-hdr"><div class="rpt-hdr-l"><img src="${logo}"><div><div class="rpt-org">${lang==='ar'?'المدينة الطبية — جامعة القصيم':'Medical City — Qassim University'}</div><div class="rpt-div">${lang==='ar'?'إدارة المرافق والسلامة':'Facilities & Safety Division'}</div></div></div>
    <div class="rpt-meta"><div>${lang==='ar'?'التاريخ:':'Date:'} ${now}</div><div style="color:#1a7a6a;font-weight:700">${lang==='ar'?'للاستخدام الداخلي فقط':'Internal Use Only'}</div></div></div>
    <div class="rpt-ttl">${lang==='ar'?'تقرير مؤشرات الأداء الرئيسية':'KPI Performance Report'}</div>
    <div class="rpt-sub">${lang==='ar'?'قسم الحوكمة والأداء — إدارة المرافق والسلامة':'Governance & Performance Dept — Facilities & Safety Division'}</div>
    <div class="rpt-sec">1. ${lang==='ar'?'الملخص التنفيذي':'Executive Summary'}</div>
    <div class="rpt-kv"><div class="rpt-kv-i"><div class="rpt-kv-l">${lang==='ar'?'إجمالي':'Total'}</div><div class="rpt-kv-v" style="color:#1a7a6a">${ks.length}</div></div><div class="rpt-kv-i"><div class="rpt-kv-l"> Met</div><div class="rpt-kv-v" style="color:#065f46">${nOk}</div></div><div class="rpt-kv-i"><div class="rpt-kv-l"> Missed</div><div class="rpt-kv-v" style="color:#7f1d1d">${miss}</div></div></div>
    <div class="rpt-sec">2. ${lang==='ar'?'تفاصيل المؤشرات':'KPI Detail Table'}</div>
    <table class="rpt-tbl"><thead><tr>${hs.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
    ${gapSec?`<div class="rpt-sec">3. ${lang==='ar'?'تحليل الفجوات والإجراءات':'Gap Analysis & Corrective Actions'}</div>${gapSec}`:''}
    <div class="rpt-sec">${lang==='ar'?'التوصيات':'Recommendations'}</div>
    <div class="rpt-box"><ul style="padding-left:16px;line-height:2.1">
      ${miss?`<li>${lang==='ar'?`مراجعة الأسباب الجذرية للمؤشرات الـ${miss} غير المحققة وتحديث خطط الإجراءات التصحيحية.`:`Review root causes for ${miss} missed KPI(s) and update corrective action plans.`}</li>`:''}
      ${allK().filter(k=>getRepeat(k)>=2).length?`<li>${lang==='ar'?'إعطاء الأولوية للمؤشرات ذات الإخفاق المتكرر مع مراجعة منهجية.':'Prioritize repeat-miss KPIs with systematic root cause review.'}</li>`:''}
      <li>${lang==='ar'?'الحفاظ على الأداء المتميز ومشاركة الممارسات الفضلى بين الأقسام.':'Sustain excellence in achieved KPIs and share best practices across departments.'}</li>
    </ul></div>
    <div class="rpt-foot"><span>${lang==='ar'?'إدارة المرافق والسلامة — قسم الحوكمة والأداء':'Facilities & Safety — Governance & Performance Dept'}</span><span>${now}</span></div>
  </div></div>`;
  document.getElementById('rptOv').classList.add('open');
}

/* ==========================================
   ADMIN
========================================== */
function openLock(){
  const role=window._fbRole||'';
  if(role==='super_admin'||role==='admin'){
    window._adminActive=true;
    const warn=document.getElementById('defWarn');if(warn)warn.style.display=ST&&ST.pinDefault?'flex':'none';
    if(typeof popAdminSels==='function')popAdminSels();
    if(typeof loadAuditLog==='function')loadAuditLog();
    const admin=document.getElementById('adminOv');if(admin)admin.classList.add('open');
    if(typeof addAudit==='function'){try{addAudit('ADMIN_OPEN','Admin tools opened by role '+role);}catch(_){}}
    if(typeof resetAdminTimer==='function')resetAdminTimer();
    return;
  }
  const ov=document.getElementById('lockOv');if(ov)ov.classList.add('open');
}
/* PIN lockout (5 attempts) + Session timer */

function doPin(){
  const eEl=document.getElementById('pinE');
  if(_failCount>=MAX_FAILS){
    eEl.textContent=lang==='ar'?' النظام مقفل. أعد تحميل الصفحة.':' Locked. Reload page to retry.';
    return;
  }
  const inp=document.getElementById('pinI').value;
  if(!inp){eEl.textContent=lang==='ar'?'أدخل الرمز':'Enter PIN';return;}
  const ih=hashPin(inp);
  if(ih===ST.pinHash){
    _failCount=0;
    window._adminActive=true;
    closOv('lockOv');
    document.getElementById('pinI').value='';
    eEl.textContent='';
    document.getElementById('defWarn').style.display=ST.pinDefault?'flex':'none';
    popAdminSels();loadAuditLog();
    document.getElementById('adminOv').classList.add('open');
    addAudit('LOGIN','Admin login');
    resetAdminTimer();
  } else {
    _failCount++;
    const rem=MAX_FAILS-_failCount;
    eEl.textContent=rem>0
      ?(lang==='ar'?`رمز غير صحيح (${_failCount}/${MAX_FAILS})`:`Incorrect PIN (${_failCount}/${MAX_FAILS})`)
      :(lang==='ar'?' النظام مقفل. أعد تحميل الصفحة.':' Locked. Reload page.');
    document.getElementById('pinI').value='';
    addAudit('LOGIN_FAIL',`Failed attempt ${_failCount}/${MAX_FAILS}`);sLS(ST);
  }
}

function openAdmin(){
  const role=window._fbRole||'';
  if(role==='super_admin'||role==='admin'){
    document.getElementById('adminOv').classList.add('open');
    window._adminActive=true;
    console.log('[Admin] Panel opened for',role);
    /* Build dynamic year options + populate delete list */
    setTimeout(()=>{
      buildYearOptions('eYr','2026');
      buildYearOptions('aY', '');
      populateDelKpiList();
    },80);
  } else {
    /* Non-admin: show brief shake feedback */
    const btn=document.querySelector('button[onclick*="openAdmin"]');
    if(btn){btn.style.animation='shake .3s';setTimeout(()=>{btn.style.animation='';},400);}
    console.warn('[Admin] Access denied for role:',role||'none');
  }
}

/* FIX 5: Admin session auto-timeout — 5 minutes */
function resetAdminTimer(){
  clearTimeout(_adminTimeout);
  _adminTimeout=setTimeout(()=>{
    const aOv=document.getElementById('adminOv');
    if(aOv&&aOv.classList.contains('open')){
      closOv('adminOv');
      toast(lang==='ar'?' انتهت الجلسة — أعد إدخال الرمز':' Session expired — re-enter PIN');
      addAudit('SESSION_TIMEOUT','Admin session expired after 5 min');sLS(ST);
    }
  },5*60*1000);
}
(function(){
  const aOv=document.getElementById('adminOv');
  if(aOv){
    ['mousemove','click','keydown'].forEach(ev=>aOv.addEventListener(ev,resetAdminTimer,{passive:true}));
  }
})();

function getKpiNameBank(){
  const bank={en:[],ar:[]};
  allK().forEach(k=>{
    if(k.nameEn&&!bank.en.includes(k.nameEn))bank.en.push(k.nameEn);
    if(k.nameAr&&!bank.ar.includes(k.nameAr))bank.ar.push(k.nameAr);
  });
  try{
    const saved=JSON.parse(localStorage.getItem('kpi_name_bank')||'{}');
    ['en','ar'].forEach(l=>(saved[l]||[]).forEach(v=>{if(v&&!bank[l].includes(v))bank[l].push(v);}));
  }catch(_){}
  bank.en.sort();bank.ar.sort();
  return bank;
}
function populateKpiNamePresets(){
  const bank=getKpiNameBank();
  const en=document.getElementById('aNEPreset'), ar=document.getElementById('aNAPreset');
  if(en)en.innerHTML='<option value="" selected disabled>— Select KPI name —</option>'+bank.en.map(v=>`<option value="${htmlEsc(v)}">${htmlEsc(v)}</option>`).join('')+'<option value="__other__">Other — add new name</option>';
  if(ar)ar.innerHTML='<option value="" selected disabled>— اختر اسم المؤشر —</option>'+bank.ar.map(v=>`<option value="${htmlEsc(v)}">${htmlEsc(v)}</option>`).join('')+'<option value="__other__">Other — إضافة اسم جديد</option>';
}
function handleKpiNamePreset(langKey){
  const sel=document.getElementById(langKey==='en'?'aNEPreset':'aNAPreset');
  const inp=document.getElementById(langKey==='en'?'aNE':'aNA');
  if(!sel||!inp)return;
  if(sel.value==='__other__'){
    inp.value='';inp.readOnly=false;inp.style.background='';inp.placeholder=langKey==='en'?'Type a new English KPI name…':'اكتب اسم مؤشر عربي جديد…';inp.focus();
    /* CRITICAL: also clear the code field so it doesn't collide with a BASE KPI.
       allK() dedup removes ST.added when same code exists in BASE, so the typed name
       would be invisible — the BASE name would show instead.                        */
    /* Code field kept as-is — user may keep or change their code. Collision check happens at save. */
    /* Reset quarterly table — remove master config so Add KPI uses standard columns */
    var _qSec=document.getElementById('addQtrSection');
    if(_qSec){ _qSec.removeAttribute('data-master');
      var _qTbl=document.getElementById('addQtrTable');
      if(_qTbl&&typeof _buildQtrTableHTML==='function') _qTbl.innerHTML=_buildQtrTableHTML(null,'aAd');
    }
  }else{
    inp.value=sel.value;inp.readOnly=true;inp.style.background='#F8FAFC';
  }
}
function persistKpiNameToBank(enName,arName){
  const bank=getKpiNameBank();
  if(enName&&!bank.en.includes(enName))bank.en.push(enName);
  if(arName&&!bank.ar.includes(arName))bank.ar.push(arName);
  localStorage.setItem('kpi_name_bank',JSON.stringify(bank));
  populateKpiNamePresets();
}

function popAdminSels(){
  if(typeof populateKpiNamePresets==='function')populateKpiNamePresets();
  ['eSel','gS','actSel'].forEach(sid=>{
    const s=document.getElementById(sid);if(!s)return;
    s.innerHTML='<option value="">—</option>';
    allK().forEach(k=>{const o=document.createElement('option');o.value=k.id;o.textContent=`[${k.id}] ${lang==='ar'?k.nameAr:k.nameEn} (${k.yr})`;s.appendChild(o);});
  });
}

function popGapSel(){
  const sel=document.getElementById('gS');if(!sel)return;
  const rows=[];
  allK().forEach(k=>{
    ['q1','q2','q3','q4'].forEach(q=>{
      const val=k[q];
      if(val===null||val===undefined)return;
      if(!metStatus(k,val)){
        const key=k.id+'_'+q;
        rows.push({k,q,key,val});
      }
    });
  });
  sel.innerHTML='<option value="">— Select a KPI gap quarter —</option>'+
    rows.map(r=>`<option value="${r.key}">${r.k.id} — ${r.k.nameEn} · ${r.q.toUpperCase()} gap (${r.val}% / target ${r.k.target}%)</option>`).join('');
}
function parseGapKey(v){
  const m=String(v||'').match(/^(.*)_(q[1-4])$/);
  return m?{kpiId:m[1],qtr:m[2],gapKey:v}:{kpiId:v,qtr:null,gapKey:v};
}
function loadEK(){
  const id=document.getElementById('eSel').value;if(!id)return;
  const k=allK().find(x=>x.id===id);if(!k)return;
  /* Populate editable Code + Name fields */
  const eCEl=document.getElementById('eC');if(eCEl)eCEl.value=k.id;
  const eNEEl=document.getElementById('eNE');if(eNEEl)eNEEl.value=k.nameEn||'';
  const eNAEl=document.getElementById('eNA');if(eNAEl)eNAEl.value=k.nameAr||'';
  /* Rebuild year list using the SAME range as Add KPI, then select this KPI's year */
  if(typeof buildYearOptions==='function'){
    buildYearOptions('eYr', String(k.yr));
  }
  /* Populate quarterly inputs + show current value in label */
  ['Q1','Q2','Q3','Q4'].forEach(q=>{
    const val=k[q.toLowerCase()]; /* k['q1'], k['q2']… NOT k['qq1'] */
    const inp=document.getElementById('e'+q);if(inp)inp.value=(val!==null&&val!==undefined)?val:'';
    const lbl=document.getElementById('e'+q+'Cur');if(lbl)lbl.textContent=(val!==null&&val!==undefined)?'['+val+'%]':'[—]';
  });
  document.getElementById('eTg').value=k.target;document.getElementById('eTier').value=k.tier||3;document.getElementById('eYr').value=k.yr;
  /* Rebuild quarterly table columns for this KPI's master config, then fill values */
  if(typeof _updateEditQtrTable==='function') _updateEditQtrTable(k.nameEn||'', id, k.nameAr||'');
  setTimeout(function(){
    if(typeof _fillQtrFormFromPci==='function'){
      _fillQtrFormFromPci(id,'eAd','editQtrSection');
    } else {
      /* Legacy fallback: fill standard pci inputs */
      ['Q1','Q2','Q3','Q4'].forEach(function(Q){
        var pciData=((ST.pci||{})[id]||{})[Q.toLowerCase()]||{};
        var plEl=document.getElementById('eAd'+Q+'_pl');if(plEl)plEl.value=pciData.planned||'';
        var coEl=document.getElementById('eAd'+Q+'_co');if(coEl)coEl.value=pciData.complete||'';
        var icEl=document.getElementById('eAd'+Q+'_ic');if(icEl)icEl.value=(pciData.incomplete!=null&&pciData.incomplete!==undefined)?pciData.incomplete:'';
        if(pciData.planned)calcAdminPCI(Q.toLowerCase(),'eAd');
      });
    }
  }, 80);

  const info=document.getElementById('eKpiInfo');if(info)info.style.display='block';
  const en=document.getElementById('eKpiNameEN');if(en)en.textContent=k.nameEn;
  const ar=document.getElementById('eKpiNameAR');if(ar)ar.textContent=k.nameAr;
  const meta=document.getElementById('eKpiMeta');if(meta){
    const v=qv(k),a=ok(k);
    meta.innerHTML=`<span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">T${k.tier||3}</span><span style="font-size:9px;color:var(--t3)">${DM[k.dept]?.en||k.dept} · ${k.yr}</span><span class="${a===null?'pill-pend':a?'pill-ok':'pill-miss'}" style="font-size:8.5px">${a===null?'Pending':a?' Met':' Missed'}</span>${v!==null?`<span style="font-size:10px;font-weight:700;color:${metStatus(k,v)?'var(--green)':'var(--red)'};background:${metStatus(k,v)?'var(--green-dim)':'var(--red-dim)'};padding:2px 7px;border-radius:4px">${v.toFixed(1)}% / ${k.target}%</span>`:''}`;
  }
}
function loadGD(){
  const raw=document.getElementById('gS').value;if(!raw)return;
  const {gapKey}=parseGapKey(raw);
  const gd=(ST.gaps||{})[gapKey]||{};const ac=(ST.actions||{})[gapKey]||{};
  const gE=document.getElementById('gE');if(gE)gE.value=gd.gapEn||'';
  const aE=document.getElementById('aE');if(aE)aE.value=gd.actEn||'';
  document.getElementById('gOwner').value=gd.owner||ac.owner||'';document.getElementById('gDue').value=gd.dueDate||ac.dueDate||'';
  document.getElementById('actStatus').value=ac.status||gd.status||'';
  document.getElementById('actPri').value=ac.priority||gd.priority||'';
  const atRisk=document.getElementById('gAtRisk');if(atRisk)atRisk.checked=!!(gd.atRisk||ac.atRisk);
}
function loadActD(){}
function swAt(id,el){
  /* Hide all feedback divs when switching tabs */
  ['_addFeedback','_editFeedback','_delFeedback','_gapFeedback'].forEach(fbId=>{
    const fbEl=document.getElementById(fbId);if(fbEl)fbEl.style.display='none';
  });
  /* Populate delete list when switching to delete tab */
  if(id==='del') setTimeout(populateDelKpiList, 50);
  document.querySelectorAll('.atb').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.ap').forEach(p=>{
    p.classList.remove('on');
    p.style.removeProperty('display'); /* let CSS control */
  });
  el.classList.add('on');
  const panel=document.getElementById('ap-'+id);
  if(panel)panel.classList.add('on');
  if(id==='auditlog')loadAuditLog();
  if(id==='gap')popGapSel();
}
function populateAddYears(){
  const sel=document.getElementById('aY');if(!sel)return;
  const curYear=new Date().getFullYear();
  const yrs=[];for(let y=2025;y<=2060;y++)yrs.push(y);
  sel.innerHTML='<option value="" selected disabled>— Select year —</option>'+yrs.map(y=>`<option value="${y}">${y}</option>`).join('');
}
const pn=v=>{const n=(typeof _adminParseNumber==='function')?_adminParseNumber(v):parseFloat(v);return (n===null||isNaN(n))?null:n;};
/* ==========================================================
   Dedicated Add-KPI save — awaits Firestore confirmation
   Shows green ONLY after Firestore confirms, red on failure
   ============================================================ */
function showKpoGapStatusPopup(){
  const role=window._fbRole||'';
  if(role!=='kpi_owner')return;
  const assigned=window._fbAssignedKpis;
  const dept=window._fbDept||window._lockedDept||null;

  /* Scope: assigned KPIs, or all dept KPIs if no specific assignment */
  let myKs=allK();
  if(Array.isArray(assigned)&&assigned.length>0){
    myKs=myKs.filter(k=>assigned.includes(k.id));
  } else if(dept){
    myKs=myKs.filter(k=>k.dept===dept);
  }

  const QLBL={q1:'Q1',q2:'Q2',q3:'Q3',q4:'Q4'};

  /* Build per-quarter rows (one row per missed quarter per KPI) */
  const rows=[];
  myKs.forEach(k=>{
    ['q1','q2','q3','q4'].forEach(q=>{
      const val=k[q];
      if(val===null||val===undefined)return;
      const missed = !metStatus(k,val);
      if(!missed)return;
      const gapKey=k.id+'_'+q;
      const gd=(ST.gaps||{})[gapKey]||{};
      const hasGap=!!(gd.gapEn&&gd.gapEn.trim()&&gd.actEn&&gd.actEn.trim());
      const st=gd.status||'open';
      if(hasGap&&st==='closed')return; /* completed — don't show */
      rows.push({k,q,val,hasGap,st});
    });
  });

  const pending=rows.filter(r=>!r.hasGap);

  const body=document.getElementById('_kpoStatusBody');
  if(!body)return;

  if(!rows.length){
    body.innerHTML='<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">'+
      (lang==='ar'?'لا توجد مؤشرات فجوة قيد التنفيذ ضمن نطاقك حالياً.':'No in-progress gap KPIs are currently assigned to you.')+'</div>';
  } else {
    const summary='<div style="margin-bottom:14px;padding:10px 14px;border-radius:10px;background:'+
      (pending.length?'rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2)':'rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.2)')+
      '"><strong style="color:'+(pending.length?'#DC2626':'#16A34A')+'">'+
      (pending.length
        ? (lang==='ar' ? (pending.length+' ربع/مؤشر يحتاج إلى تحليل فجوة') : (pending.length+' KPI quarter(s) need Gap Analysis data entry'))
        : (lang==='ar' ? 'جميع الأرباع مكتملة — لا يوجد إجراء مطلوب' : 'All quarters up to date — no action required')
      )+'</strong></div>';

    const list=rows.map(r=>{
      const name=lang==='ar'?r.k.nameAr||r.k.nameEn:r.k.nameEn;
      const color=r.hasGap?'#16A34A':'#DC2626';
      const icon=r.hasGap?'✓':'⚠';
      const status=r.hasGap?(lang==='ar'?'مدخل':'Entered'):(lang==='ar'?'يحتاج بيانات':'Needs Data Entry');
      return '<div style="cursor:pointer" onclick="closOv(\'_kpoStatusOv\');openGapQuarter(\''+r.k.id+'\',\''+r.q+'\')" style="display:flex;align-items:center;justify-content:between;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:9px;margin-bottom:6px;background:var(--card)">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:11px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+htmlEsc(r.k.id)+' — '+htmlEsc(name)+' · '+QLBL[r.q]+'</div>'+
          '<div style="font-size:9px;color:var(--t3);margin-top:2px">'+(lang==='ar'?'النتيجة':'Result')+': '+r.val+'% | '+(lang==='ar'?'الهدف':'Target')+': '+r.k.target+'%</div>'+
        '</div>'+
        '<span style="font-size:9px;font-weight:800;padding:3px 9px;border-radius:10px;background:'+color+'1a;color:'+color+';white-space:nowrap">'+icon+' '+status+'</span>'+
      '</div>';
    }).join('');

    body.innerHTML=summary+list;
  }

  document.getElementById('_kpoStatusOv').classList.add('open');
}

function refreshAllViewsAfterKpiChange(reason){

  if(typeof renderYearFilter==='function') renderYearFilter();
  if(typeof popAdminSels==='function') popAdminSels();
  if(typeof populateDelKpiList==='function') populateDelKpiList();
  if(typeof popGapSel==='function') popGapSel();
  if(typeof updateBadge==='function') updateBadge();
  if(typeof updateChips==='function') updateChips();
  if(typeof renderCurrent==='function') renderCurrent();

}

async function saveNewKPI(){
  function _showFb(msg,ok){
    /* Create feedback element dynamically if not in HTML */
    var fbEl=document.getElementById('_addFeedback');
    if(!fbEl){
      var panel=document.getElementById('ap-add');
      if(panel){
        fbEl=document.createElement('div');
        fbEl.id='_addFeedback';
        fbEl.style.cssText='margin:8px 0 4px;padding:0;border-radius:8px;font-weight:600;font-size:11px;display:none;align-items:center;gap:6px;';
        var firstBtn=panel.querySelector('.af-btn,.af-save,button[onclick]');
        if(firstBtn) panel.insertBefore(fbEl,firstBtn);
        else panel.appendChild(fbEl);
      }
    }
    if(!fbEl)return;
    fbEl.innerHTML=msg;
    fbEl.style.color=ok?'#16A34A':'#DC2626';
    fbEl.style.background=ok?'rgba(22,163,74,.08)':'rgba(220,38,38,.06)';
    fbEl.style.border=ok?'1px solid rgba(22,163,74,.25)':'1px solid rgba(220,38,38,.20)';
    fbEl.style.display='flex';fbEl.style.alignItems='center';fbEl.style.gap='6px';
    fbEl.style.padding='8px 12px';fbEl.style.borderRadius='8px';fbEl.style.fontWeight='600';fbEl.style.fontSize='11px';
  }

  /* ── 1. Language validation ── */
  const neVal=(document.getElementById('aNE')||{}).value||'';
  const naVal=(document.getElementById('aNA')||{}).value||'';
  if(neVal && /[\u0600-\u06FF]/.test(neVal)){
    const el=document.getElementById('aNE');
    if(el){el.style.borderColor='#DC2626';el.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}
    _showFb('⚠ KPI Name (English) must contain English letters and numbers only',false);return;
  }
  if(naVal && !/^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9 0-9\-()_/.,،!?]*$/.test(naVal)){
    const el=document.getElementById('aNA');
    if(el){el.style.borderColor='#DC2626';el.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}
    _showFb('⚠ الاسم العربي يجب أن يحتوي على أحرف عربية وأرقام فقط',false);return;
  }

  /* ── 2. Required fields validation ── */
  const _req=[
    {id:'aC',lbl:'KPI Code'},{id:'aDp',lbl:'Department'},
    {id:'aO',lbl:'Operator'},{id:'aTier',lbl:'Risk Tier'},
    {id:'aTg',lbl:'Target'},{id:'aY',lbl:'Year'},{id:'aNE',lbl:'KPI Name (EN)'},{id:'aNA',lbl:'KPI Name (AR)'}
  ];
  let ok=true;
  _req.forEach(r=>{
    const el=document.getElementById(r.id);if(!el)return;
    const empty=!el.value||!el.value.trim();
    el.style.borderColor=empty?'#DC2626':'';
    el.style.boxShadow=empty?'0 0 0 3px rgba(220,38,38,.15)':'';
    if(empty)ok=false;
  });
  if(!ok){_showFb('⚠ Please fill all required fields (marked *)',false);return;}

  /* ── 3. Build KPI object ── */
  const code=document.getElementById('aC').value.trim().toUpperCase();
  if(!code){_showFb('⚠ KPI Code cannot be empty',false);return;}

  /* Duplicate check — case-insensitive, covers BASE + ST.added + allK() */
  const _dupInBase=(BASE||[]).some(function(k){return String(k.id||'').toUpperCase()===code&&!(ST.deleted||[]).some(function(d){return String(d||'').toUpperCase()===code;});});
  const _dupInAdded=(ST.added||[]).some(function(k){return String(k.id||'').toUpperCase()===code;});
  const _dupInAllK=allK().some(function(k){return String(k.id||'').toUpperCase()===code;});
  if(_dupInBase||_dupInAdded||_dupInAllK){
    _showFb('⚠ KPI Code "'+code+'" already exists — use a unique code',false);return;
  }

  /* ── Defensive field reads with null guards ── */
  const _gv=(id,fallback='')=>{
    const el=document.getElementById(id);
    if(!el){console.error('[saveNewKPI] Missing field: #'+id);return fallback;}
    return el.value??fallback;
  };

  /* Verify all critical fields exist before building object */
  const _critical=['aDp','aO','aTier','aY','aNE','aNA','aTg','aQ1','aQ2','aQ3','aQ4'];
  const _missing=_critical.filter(id=>!document.getElementById(id));
  if(_missing.length){
    _showFb('⚠ Missing form fields: '+_missing.join(', ')+' — Please reload admin panel',false);
    console.error('[saveNewKPI] Missing IDs:',_missing);
    return;
  }

  const kpiObj={
    id:code,
    dept:_gv('aDp','unknown'),
    yr:parseInt(_gv('aY','2026'))||new Date().getFullYear(),
    nameEn:(_gv('aNE')).trim(),
    nameAr:(_gv('aNA')).trim()||'',
    target:(_adminParseNumber(_gv('aTg','100'))||100),
    op:normalizeOperator(_gv('aO','>=')),
    type:'core',
    tier:parseInt(_gv('aTier','3'))||3,
    q1:pn(_gv('aQ1','')),
    q2:pn(_gv('aQ2','')),
    q3:pn(_gv('aQ3','')),
    q4:pn(_gv('aQ4',''))
  };

  /* ── 4. Check for BASE KPI collision when using custom name ──
     allK() dedup: BASE wins when code matches. Warn if custom name differs. */
  const _isOtherMode = !document.getElementById('aNEPreset') ||
    (document.getElementById('aNEPreset').value === '__other__') ||
    (document.getElementById('aNEPreset').value === '');
  if(_isOtherMode){
    const _baseKpi = (typeof BASE!=='undefined'?BASE:[]).find(function(k){return String(k.id||'').toUpperCase()===code;});
    if(_baseKpi){
      _showFb('⚠ Code "'+code+'" already exists as "'+_baseKpi.nameEn+'". Please use a different code for your custom KPI.',false);
      return;
    }
  }
  /* ── Append to main state array (ST.added) ── */
  if(!ST.added)ST.added=[];
  /* Filter uses case-sensitive compare — code is already uppercase */
  ST.added=ST.added.filter(function(k){return String(k.id||'').toUpperCase()!==code;});
  ST.added.push(kpiObj);
  /* Remove id AND code from ST.deleted — case-insensitive.
     A previously deleted KPI being re-added must become visible immediately. */
  /* General rule: any KPI in ST.added must be removed from ST.deleted.
     _reconcileDeletedVsAdded handles this for all IDs at once. */
  if(typeof _reconcileDeletedVsAdded==='function') _reconcileDeletedVsAdded(ST);
  /* Save PCI counts in the same dashboard state so KPI cards can reveal planned/complete/incomplete counts */
  if(!ST.pci)ST.pci={};
  ST.pci[code]={};
  /* ── Use _readQtrValuesFromForm — handles standard PCI and custom-field KPIs ── */
  /* If neVal is a custom name (not matching any master KPI), clear data-master */
  (function(){
    var _addSec2=document.getElementById('addQtrSection');
    if(_addSec2&&_addSec2.getAttribute('data-master')){
      var _masterMatch2=(typeof _findMasterKpiByName==='function')?_findMasterKpiByName(neVal):null;
      if(!_masterMatch2||!_masterMatch2.config){
        _addSec2.setAttribute('data-master',''); /* clear stale master */
      }
    }
  })();
  var _qtrRead=(typeof _readQtrValuesFromForm==='function')
    ?_readQtrValuesFromForm(code,'aAd','addQtrSection')
    :{pciData:{Q1:{},Q2:{},Q3:{},Q4:{}},masterId:'',cfg:null};
  Object.keys(_qtrRead.pciData).forEach(function(ql){
    ST.pci[code][ql]=_qtrRead.pciData[ql];
  });
  /* Set q1-q4 on kpiObj — formula result for custom, complete% for standard */
  ['Q1','Q2','Q3','Q4'].forEach(function(Q){
    var q=Q.toLowerCase();
    var qd=_qtrRead.pciData[q]||{};
    if(qd._custom){
      kpiObj[q]=qd._result;
    }else{
      /* Fallback to existing pn() reading for standard mode */
      const planned=pn(_gv('aAd'+Q+'_pl',''));
      const complete=pn(_gv('aAd'+Q+'_co',''));
      const incomplete=pn(_gv('aAd'+Q+'_ic',''));
      if(planned!==null||complete!==null||incomplete!==null){
        ST.pci[code][q]={planned,complete,incomplete};
      }
      kpiObj[q]=planned>0?Math.min(100,Math.round((complete||0)/planned*100)):null;
    }
  });

  /* Update localStorage immediately */
  try{
    localStorage.setItem('kpi_v3',JSON.stringify({...ST,_v:3}));
    }catch(_){
    }

  /* Refresh ALL dashboard views with the new local state */
  refreshAllViewsAfterKpiChange('KPI_ADD:'+code);

  /* ── 5. Show saving state ── */
  _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg> Saving…',true);

  /* ── 6. Save COMPLETE dashboard state to Firestore and await confirmation ── */
  let fsSaved=false;
  if(typeof window._saveToFS==='function'&&window._fbUser){
    try{
      /* USER ACTION: Admin clicked Save Changes → Firestore write */
      await window._saveToFS(ST);
      fsSaved=true;
    
      /* NOTE: Do NOT reload from Firestore here — the write may not be complete yet.
         The onSnapshot listener will propagate the write to all users automatically. */
      refreshAllViewsAfterKpiChange('KPI_ADD:'+code+':firestore-confirmed');

    }catch(e){
      console.error('[saveNewKPI] Firestore error:',e.code||e.message,e);
      fsSaved=false;
    }
  } else {
    console.warn('[saveNewKPI] _saveToFS not available (user='+(!!window._fbUser)+') — localStorage only');
  }

  /* ── 7. Show result ── */
  if(fsSaved){
    _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg> ✓ KPI "'+code+'" saved',true);
  } else {
    /* Saved locally but not to Firestore */
    _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg> KPI saved locally — sync pending',false);
  }

  /* ── 8. Jump filters so the new KPI is immediately VISIBLE on dashboard ── */
  const _kpiYear=String(kpiObj.yr);
  let _filtersChanged=false;
  if(F.year!=='all' && F.year!==_kpiYear){
      F.year=_kpiYear;
    _filtersChanged=true;
  }
  if(F.dept!=='all' && F.dept!==kpiObj.dept && !window._lockedDept){
      F.dept=kpiObj.dept;
    _filtersChanged=true;
  }
  const _newKpiQtrs=['q1','q2','q3','q4'].filter(q=>kpiObj[q]!==null);
  if(Array.isArray(F.qtr) && _newKpiQtrs.length && !_newKpiQtrs.some(q=>F.qtr.includes(q))){
    F.qtr=_newKpiQtrs;
    _filtersChanged=true;
  }
  if(Array.isArray(F.qtr) && !_newKpiQtrs.length){
    F.qtr=['q1','q2','q3','q4'];
    _filtersChanged=true;
  }
  if(_filtersChanged){
    refreshAllViewsAfterKpiChange('KPI_ADD:'+code+':filters-adjusted');
    }
  /* Quick visibility check */

  /* ── 9. Audit + clear form ── */
  persistKpiNameToBank(kpiObj.nameEn,kpiObj.nameAr);
  addAudit('KPI_ADD','Added new KPI: '+code+' ('+kpiObj.dept+', '+kpiObj.yr+')',null,'KPI: '+kpiObj.nameEn);
  sLS(ST);
  refreshAllViewsAfterKpiChange('KPI_ADD:'+code+':audit-persisted');
  setTimeout(()=>{
    /* Clear visible form fields */
    ['aC','aNE','aNA','aTg','aAdQ1_pl','aAdQ1_co','aAdQ2_pl','aAdQ2_co',
     'aAdQ3_pl','aAdQ3_co','aAdQ4_pl','aAdQ4_co'].forEach(id=>{
      const e=document.getElementById(id);if(e){e.value='';e.style.borderColor='';e.style.boxShadow='';}
    });
    /* Clear computed hidden fields */
    ['aQ1','aQ2','aQ3','aQ4'].forEach(id=>{
      const e=document.getElementById(id);if(e)e.value='';
    });
    /* Reset required dropdowns to manual selection state */
    ['aY','aO','aTier','aDp','aNEPreset','aNAPreset'].forEach(id=>{const e=document.getElementById(id);if(e){e.value='';e.style.borderColor='';e.style.boxShadow='';}});
    ['aNE','aNA'].forEach(id=>{const e=document.getElementById(id);if(e){e.readOnly=true;e.style.background='#F8FAFC';}});
    /* Reset PCI result spans */
    ['aAdQ1_res','aAdQ2_res','aAdQ3_res','aAdQ4_res'].forEach(id=>{
      const e=document.getElementById(id);if(e){e.textContent='—';e.style.color='var(--t3)';e.style.background='';}
    });
  },2000);
}

function saveAdmin(){
  const ap=document.querySelector('.ap.on').id;let action='',detail='';
  if(ap==='ap-edit'){
  /* Required fields validation */
  const _eReq=[
    {id:'eSel',lbl:'KPI'},
    {id:'eC',lbl:'KPI Code'},
    {id:'eTg',lbl:'Target'},
    {id:'eTier',lbl:'Risk Tier'}
  ];
  let _eOk=true;
  _eReq.forEach(r=>{
    const el=document.getElementById(r.id);if(!el)return;
    const empty=!el.value||!el.value.trim();
    el.style.borderColor=empty?'#DC2626':'';
    el.style.boxShadow=empty?'0 0 0 3px rgba(220,38,38,.15)':'';
    if(empty)_eOk=false;
  });
  if(!_eOk){
    const ef=document.getElementById('_editFeedback');
    if(ef){ef.textContent=' Please fill all required fields';ef.style.color='#DC2626';ef.style.display='block';ef.style.background='rgba(220,38,38,.06)';}
    return;
  }
  /* Validate PCI data — only for standard Planned/Complete KPIs */
  const _selKForValid=allK().find(function(x){return x.id===document.getElementById('eSel')?.value;});
  const _hasCustomValid=(_selKForValid&&typeof _findMasterKpiByName==='function')
    ?_findMasterKpiByName(_selKForValid.nameEn||''):null;
  if(!_hasCustomValid||!(_hasCustomValid.config&&_hasCustomValid.config.fieldConfig&&_hasCustomValid.config.fieldConfig.length>0)){
    let pciValid=true;
    ['Q1','Q2','Q3','Q4'].forEach(Q=>{
      const pl=_adminParseNumber(document.getElementById('eAd'+Q+'_pl')?.value)||0;
      const co=_adminParseNumber(document.getElementById('eAd'+Q+'_co')?.value)||0;
      const ic=_adminParseNumber(document.getElementById('eAd'+Q+'_ic')?.value)||0;
      if(pl>0&&(co+ic)>pl){
        toast(lang==='ar'?(' '+Q+': المجموع ('+(co+ic)+') يتجاوز المخطط ('+pl+')'):(' '+Q+': Total ('+(co+ic)+') exceeds planned ('+pl+')'));
        pciValid=false;
      }
    });
    if(!pciValid)return;
  }
  const displayId=document.getElementById('eSel').value;if(!displayId){toast('Select a KPI');return;}
  const id=realId(displayId);  /* resolve to real storage key (handles renamed codes) */
  if(!ST.ov)ST.ov={};
  const _gQV=Q=>{
    /* Check if this KPI has custom-field config */
    var _selId=document.getElementById('eSel')?.value;
    var _selK=_selId?allK().find(function(x){return x.id===_selId;}):null;
    var _masterMatch=(_selK&&typeof _findMasterKpiByName==='function')?_findMasterKpiByName(_selK.nameEn||''):null;
    if(_masterMatch&&_masterMatch.config&&_masterMatch.config.fieldConfig&&_masterMatch.config.fieldConfig.length>0){
      /* Read formula result from result span */
      var resEl=document.getElementById('eAd'+Q+'_res');
      if(resEl){var resText=resEl.textContent.replace('%','').trim();var rv=_adminParseNumber(resText);return (rv===null||isNaN(rv))?null:rv;}
      return null;
    }
    const pl=_adminParseNumber(document.getElementById('eAd'+Q+'_pl')?.value)||0;
    const co=_adminParseNumber(document.getElementById('eAd'+Q+'_co')?.value);
    return(pl>0&&!isNaN(co)&&co!==null)?+(co/pl*100).toFixed(1):null;
  };
  if(!ST.ov[id])ST.ov[id]={};
  const _eYrEl=document.getElementById('eYr');
  const _eYrVal=_eYrEl?parseInt(_eYrEl.value)||null:null;
  ST.ov[id]={...ST.ov[id],
    q1:_gQV('Q1'),q2:_gQV('Q2'),q3:_gQV('Q3'),q4:_gQV('Q4'),
    target:(_adminParseNumber(document.getElementById('eTg').value)||90),
    tier:parseInt(document.getElementById('eTier').value)||3
  };
  /* Year: update in ST.ov AND in ST.added if this KPI was user-added */
  if(_eYrVal) ST.ov[id].yr=_eYrVal;
  /* If this KPI exists in ST.added, update yr there too (for added KPIs) */
  if(_eYrVal && Array.isArray(ST.added)){
    const _addedIdx=ST.added.findIndex(function(k){return String(k.id||'').toUpperCase()===id.toUpperCase();});
    if(_addedIdx>=0) ST.added[_addedIdx].yr=_eYrVal;
  }
  /* ── KPI Code / Name (EN/AR) edits ── */
  const _newCode=(document.getElementById('eC')?.value||'').trim().toUpperCase();
  const _newNE=(document.getElementById('eNE')?.value||'').trim();
  const _newNA=(document.getElementById('eNA')?.value||'').trim();
  if(_newNE && /[\u0600-\u06FF]/.test(_newNE)){
    toast(' Name (English) must be English letters/numbers only');return;
  }
  if(_newNE) ST.ov[id].nameEn=_newNE;
  if(_newNA) ST.ov[id].nameAr=_newNA;
  /* Keep KPI-specific formula overrides tied to the edited KPI code + current names. */
  if(ST.kpiFormulaOverrides && ST.kpiFormulaOverrides[_adminNormKpiCode(id)]){
    ST.kpiFormulaOverrides[_adminNormKpiCode(id)].kpiNameEn = _newNE || ST.kpiFormulaOverrides[_adminNormKpiCode(id)].kpiNameEn || '';
    ST.kpiFormulaOverrides[_adminNormKpiCode(id)].kpiNameAr = _newNA || ST.kpiFormulaOverrides[_adminNormKpiCode(id)].kpiNameAr || '';
  }
  if(_newCode && _newCode!==displayId){
    /* Renaming the KPI code — check for duplicates among OTHER KPIs */
    const dup=allK().some(x=>x.id===_newCode && realId(x.id)!==id);
    if(dup){
      toast(' KPI Code "'+_newCode+'" is already in use');return;
    }
    if(!ST.codeOv)ST.codeOv={};
    ST.codeOv[id]=_newCode;
  }
  /* Save PCI — custom-field or standard */
  if(!ST.pci)ST.pci={};if(!ST.pci[id])ST.pci[id]={};
  if(typeof _readQtrValuesFromForm==='function'){
    var _editQR=_readQtrValuesFromForm(id,'eAd','editQtrSection');
    Object.keys(_editQR.pciData).forEach(function(ql){ST.pci[id][ql]=_editQR.pciData[ql];});
  } else {
    ['Q1','Q2','Q3','Q4'].forEach(Q=>{
      const pl=_adminParseNumber(document.getElementById('eAd'+Q+'_pl')?.value)||0;
      const co=_adminParseNumber(document.getElementById('eAd'+Q+'_co')?.value)||0;
      const ic=_adminParseNumber(document.getElementById('eAd'+Q+'_ic')?.value)||0;
      if(pl>0||co>0)ST.pci[id][Q.toLowerCase()]={planned:pl,complete:co,incomplete:ic};
    });
  }
  const _oldK=allK().find(x=>x.id===id);
  const _oldVal=_oldK?`Q1:${_oldK.q1||'—'} Q2:${_oldK.q2||'—'} Q3:${_oldK.q3||'—'} Q4:${_oldK.q4||'—'} Target:${_oldK.target||'—'}%`:'new';
  const ef2=document.getElementById('_editFeedback');
  if(ef2){ef2.textContent=' KPI saved successfully';ef2.style.color='#16A34A';ef2.style.display='block';ef2.style.background='rgba(22,163,74,.06)';}
  _eReq.forEach(r=>{const el=document.getElementById(r.id);if(el){el.style.borderColor='';el.style.boxShadow='';}});
  action='KPI_EDIT';detail=`Edited ${id}`;if(!window._editOldVal)window._editOldVal=_oldVal;}
  else if(ap==='ap-add'){
    /* ── Required fields validation ── */
    /* Language format validation */
    const _aNEVal=(document.getElementById('aNE')||{}).value||'';
    const _aNAVal=(document.getElementById('aNA')||{}).value||'';
    if(_aNEVal && /[\u0600-\u06FF]/.test(_aNEVal)){
      const el=document.getElementById('aNE');
      if(el){el.style.borderColor='#DC2626';el.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}
      const fb2=document.getElementById('_addFeedback');
      if(fb2){fb2.textContent='⚠ KPI Name (English) must contain English letters and numbers only — no Arabic';fb2.style.color='#DC2626';fb2.style.background='rgba(220,38,38,.06)';fb2.style.border='1px solid rgba(220,38,38,.2)';fb2.style.display='block';}
      return;
    }
    if(_aNAVal && !/^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9 0-9\-()_/.،,!?]*$/.test(_aNAVal)){
      const el=document.getElementById('aNA');
      if(el){el.style.borderColor='#DC2626';el.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}
      const fb2=document.getElementById('_addFeedback');
      if(fb2){fb2.textContent='⚠ الاسم العربي يجب أن يحتوي على أحرف عربية وأرقام فقط';fb2.style.color='#DC2626';fb2.style.background='rgba(220,38,38,.06)';fb2.style.border='1px solid rgba(220,38,38,.2)';fb2.style.display='block';}
      return;
    }
    const _req=[
      {id:'aC',lbl:'KPI Code'},
      {id:'aDp',lbl:'Department'},
      {id:'aO',lbl:'Operator'},
      {id:'aTier',lbl:'Risk Tier'},
      {id:'aTg',lbl:'Target'},
      {id:'aY',lbl:'Year'},
      {id:'aNE',lbl:'KPI Name (EN)'},
      {id:'aNA',lbl:'KPI Name (AR)'}
    ];
    let _reqOk=true;
    _req.forEach(r=>{
      const el=document.getElementById(r.id);if(!el)return;
      const empty=!el.value||!el.value.trim();
      el.style.borderColor=empty?'#DC2626':'';
      el.style.boxShadow=empty?'0 0 0 3px rgba(220,38,38,.15)':'';
      if(empty)_reqOk=false;
    });
    if(!_reqOk){
      /* Show red feedback */
          if(fb){fb.textContent=lang==='ar'?' يرجى ملء جميع الحقول الإلزامية ('+'*)':'⚠ Please fill all required fields (marked *)';fb.style.color='#DC2626';fb.style.display='block';}
      toast(' Fill all required fields');return;
    }
    /* ── Delegate to dedicated async function ── */
    saveNewKPI();
    return; /* saveNewKPI handles audit + render internally */
  }
  else if(ap==='ap-gap'){
    const rawGap=document.getElementById('gS').value;
    const {kpiId,qtr,gapKey}=parseGapKey(rawGap);
    const id=gapKey;
    if(!id){toast(' Select a KPI first');return;}
    /* Language validation for gap fields */
    const _gEval=(document.getElementById('gE')||{}).value||'';
    const _aEval=(document.getElementById('aE')||{}).value||'';
    if(/[\u0600-\u06FF]/.test(_gEval)||/[\u0600-\u06FF]/.test(_aEval)){
      const fbG=document.getElementById('_gapFeedback');
      if(fbG){fbG.textContent='⚠ Gap fields must be in English only — please remove Arabic text';fbG.style.color='#DC2626';fbG.style.background='rgba(220,38,38,.06)';fbG.style.display='block';}
      if(/[\u0600-\u06FF]/.test(_gEval)){const e=document.getElementById('gE');if(e){e.style.borderColor='#DC2626';e.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}}
      if(/[\u0600-\u06FF]/.test(_aEval)){const e=document.getElementById('aE');if(e){e.style.borderColor='#DC2626';e.style.boxShadow='0 0 0 3px rgba(220,38,38,.15)';}}
      return;
    }
    /* Required field validation (except At Risk checkbox) */
    const _gReq=[
      {id:'actPri',lbl:'Priority'},
      {id:'actStatus',lbl:'Action Status'},
      {id:'gE',lbl:'Root Cause / Gap Reasons'},
      {id:'aE',lbl:'Corrective Actions'},
      {id:'gOwner',lbl:'Responsible Person'},
      {id:'gDue',lbl:'Expected Closure Date'}
    ];
    let _gOk=true;
    _gReq.forEach(r=>{
      const el=document.getElementById(r.id);if(!el)return;
      const empty=!el.value||!el.value.trim();
      el.style.borderColor=empty?'#DC2626':'';
      el.style.boxShadow=empty?'0 0 0 3px rgba(220,38,38,.15)':'';
      if(empty)_gOk=false;
    });
    if(!_gOk){
      const fb=document.getElementById('_gapFeedback');
      if(fb){fb.textContent=' Please fill all required fields';fb.style.color='#DC2626';fb.style.display='block';fb.style.background='rgba(220,38,38,.06)';}
      return;
    }
    if(!ST.gaps)ST.gaps={};
    const atRisk=document.getElementById('gAtRisk')?.checked||false;
    const oldGap=ST.gaps[id]?JSON.stringify(ST.gaps[id]):null;
    ST.gaps[id]={
      gapEn:document.getElementById('gE').value,
      actEn:document.getElementById('aE').value,
      owner:document.getElementById('gOwner').value,
      dueDate:document.getElementById('gDue').value,
      status:document.getElementById('actStatus').value,
      priority:document.getElementById('actPri').value,
      atRisk
    };
    if(!ST.actions)ST.actions={};
    ST.actions[id]={...ST.actions[id],owner:document.getElementById('gOwner').value,status:document.getElementById('actStatus').value,dueDate:document.getElementById('gDue').value,priority:document.getElementById('actPri').value,atRisk};
    /* Success feedback */
    const fb2=document.getElementById('_gapFeedback');
    if(fb2){fb2.textContent=' Saved successfully';fb2.style.color='#16A34A';fb2.style.display='block';fb2.style.background='rgba(22,163,74,.06)';}
    /* Reset field styles */
    _gReq.forEach(r=>{const el=document.getElementById(r.id);if(el){el.style.borderColor='';el.style.boxShadow='';}});
    action='GAP_EDIT';detail=`Gap for ${kpiId}${qtr?' · '+qtr.toUpperCase():''}`;window._editOldVal=oldGap;}
  else if(ap==='ap-actions'||ap==='ap-auditlog')return;
  if(action)addAudit(action,detail,window._editOldVal||null,window._editNewVal||null);window._editOldVal=null;window._editNewVal=null;
  /* Save to localStorage + Firestore via unified helper (no-loop, no auto-save) */
  persistST('KPI_EDIT').catch(function(e){
    toast('⚠ '+(lang==='ar'?'فشل الحفظ: ':'Save failed: ')+(e.code||e.message));
  });
  toast(lang==='ar'?'✓ تم الحفظ بنجاح':'✓ Saved successfully');
  updateBadge();
  renderYearFilter();  /* ensure year filter stays current */
  renderCurrent();
}
function populateDelKpiList(){
  const sel=document.getElementById('delSel');
  if(!sel)return;
  /* Get ALL visible KPIs (BASE + added, excluding already deleted) */
  const all=allK().sort((a,b)=>a.dept.localeCompare(b.dept)||a.id.localeCompare(b.id));
  sel.innerHTML='<option value="">— Select a KPI to delete —</option>';
  let lastDept='';
  all.forEach(k=>{
    if(k.dept!==lastDept){
      const grp=document.createElement('optgroup');
      grp.label=(typeof DM!=='undefined'&&DM[k.dept]?DM[k.dept].en:k.dept).toUpperCase();
      sel.appendChild(grp);
      lastDept=k.dept;
    }
    const o=document.createElement('option');
    o.value=k.id;
    const isBase=typeof BASE!=='undefined'&&BASE.some(b=>b.id===k.id);
    o.textContent=k.id+' — '+k.nameEn+' ('+k.yr+')';
    const lastGrp=sel.querySelector('optgroup:last-of-type');
    if(lastGrp)lastGrp.appendChild(o);
    else sel.appendChild(o);
  });
  if(!all.length){
    const o=document.createElement('option');o.disabled=true;o.textContent='No KPIs available';
    sel.appendChild(o);
  }
  /* Legend hidden — no star explanations shown */
  const leg=document.getElementById('_delLegend');
  if(leg)leg.style.display='none';
}
function previewDelKpi(id){
  const prev=document.getElementById('delPreview');
  if(!id){if(prev)prev.style.display='none';return;}
  const k=allK().find(x=>x.id===id);
  if(!k){if(prev)prev.style.display='none';return;}
  if(prev)prev.style.display='block';
  const nm=document.getElementById('delPreviewName');
  const mt=document.getElementById('delPreviewMeta');
  if(nm)nm.textContent=k.id+' — '+k.nameEn;
  if(mt)mt.textContent='Dept: '+DM[k.dept].en+' | Year: '+k.yr+' | Target: '+k.target+'%'+(k.q1!==null?' | Q1: '+k.q1+'%':'');
}
function confirmDelKpi(){
  const role=window._fbRole||'';
  if(role!=='admin'&&role!=='super_admin'){toast(' Only Admins can delete KPIs');return;}
  const id=document.getElementById('delSel').value;
  if(!id){toast('Select a KPI to delete');return;}
  /* Use BASE concat added — before deletion filter */
  const allKPIs=BASE.map(k=>{const ov=(ST.ov||{})[k.id];return ov?{...k,...ov}:k}).concat(ST.added||[]);
  const k=allKPIs.find(x=>x.id===id);
  if(!k){toast('KPI not found');return;}
  /* Custom confirmation dialog */
  const confirmed=confirm(
    'PERMANENTLY DELETE KPI\n\n'+
    '  Code: '+k.id+'\n'+
    '  Name: '+k.nameEn+'\n'+
    '  Dept: '+(k.dept||'—')+'\n\n'+
    'This will remove the KPI from Dashboard, Reports, Accountability,\n'+
    'Filters, and Persistent Storage.\n\n'+
    'This action CANNOT be undone. Click OK to confirm.'
  );
  if(!confirmed){toast('Deletion cancelled');return;}
  /* Add to permanent deleted list */
  if(!ST.deleted)ST.deleted=[];
  if(!ST.deleted.includes(id))ST.deleted.push(id);
  /* Remove from ST.added if present */
  ST.added=(ST.added||[]).filter(x=>x.id!==id);
  /* Clean up all related data */
  if(ST.ov&&ST.ov[id])delete ST.ov[id];
  if(ST.gaps&&ST.gaps[id])delete ST.gaps[id];
  if(ST.actions&&ST.actions[id])delete ST.actions[id];
  if(ST.rptEdits){Object.keys(ST.rptEdits).forEach(k2=>{if(k2.includes(id))delete ST.rptEdits[k2];});}
  /* Audit + persist */
  addAudit('KPI_DEL','Permanently deleted KPI: '+id+' ('+k.nameEn+')',k.nameEn,'DELETED');
  /* ── Save: localStorage + Firestore (must persist for all users) ── */
  const _delFb=document.getElementById('_delFeedback');
  if(_delFb){_delFb.innerHTML='Deleting…';_delFb.style.color='#888';_delFb.style.display='flex';}
  persistST('KPI_DEL:'+id).then(function(){
    toast('✓ KPI '+id+' permanently deleted for all users');
    if(_delFb){
      _delFb.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> KPI "'+id+'" permanently deleted';
      _delFb.style.color='#16A34A';_delFb.style.background='rgba(22,163,74,.08)';
      _delFb.style.border='1px solid rgba(22,163,74,.25)';_delFb.style.display='flex';
      _delFb.style.alignItems='center';_delFb.style.gap='6px';
    }
    const prev=document.getElementById('delPreview');if(prev)prev.style.display='none';
    setTimeout(populateDelKpiList,200);
    renderYearFilter();
  }).catch(function(e){
    toast('⚠ Delete failed to sync: '+(e.code||e.message));
    if(_delFb){_delFb.innerHTML='⚠ Delete failed to sync';_delFb.style.color='#D97706';_delFb.style.display='flex';}
    renderYearFilter(); renderCurrent();
  });
}


/* ══════════════════════════════════════════════════════════════
   Super Admin Hub
   Called from firebase.js after SA selects the Performance portal.
   Opens the Admin Panel immediately and selects the SA overview tab.
   ══════════════════════════════════════════════════════════════ */
function _showSuperAdminHub(){
  var prev=document.getElementById('saHubOv'); if(prev)prev.remove();
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var ov=document.createElement('div');
  ov.id='saHubOv';
  ov.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,8,20,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
  var cards=[
    {icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
     title:'User Requests',titleAr:'\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646',
     desc:'View and manage user requests, responses and workflow.',
     descAr:'\u0639\u0631\u0636 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0648\u0625\u062f\u0627\u0631\u062a\u0647\u0627.',action:'sa-requests'},
    {icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>',
     title:'KPI Management',titleAr:'\u0625\u062f\u0627\u0631\u0629 \u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621',
     desc:'Add, edit and delete KPIs. Configure structure, columns and targets.',
     descAr:'\u0625\u0636\u0627\u0641\u0629 \u0648\u062a\u0639\u062f\u064a\u0644 \u0648\u062d\u0630\u0641 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a.',action:'sa-kpimgmt'},
    {icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
     title:'Dashboard',titleAr:'\u0645\u062d\u0631\u0631 \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0644\u0644\u063a\u0629',
     desc:'Open the live dashboard. Click any outlined text to edit it in-place.',
     descAr:'\u062a\u0639\u062f\u064a\u0644 \u0645\u0635\u0637\u0644\u062d\u0627\u062a \u0627\u0644\u0644\u0648\u062d\u0629 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.',action:'sa-dashboard'}
  ];
  var inner='<div style="background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:32px 28px;max-width:820px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">'
    +'<div><div style="font-size:16px;font-weight:800;color:#e2e8f0">'+(isAr?'\u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0623\u0639\u0644\u0649':'Super Admin Hub')+'</div>'
    +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'\u0627\u062e\u062a\u0631 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629':'Select a management area')+'</div></div>'
    +'<button onclick="_saHubBack();" style="width:32px;height:32px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;cursor:pointer;font-size:16px">&#x2715;</button>'
    +'</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">';
  cards.forEach(function(card){
    var t=isAr?card.titleAr:card.title;
    var d=isAr?card.descAr:card.desc;
    inner+='<div onclick="_saHubAction(\''+card.action+'\')"'
      +' style="background:rgba(255,255,255,.04);border:1px solid rgba(1,149,175,.18);border-radius:14px;padding:22px 18px;cursor:pointer;display:flex;flex-direction:column;gap:10px;transition:all .18s"'
      +' onmouseenter="this.style.background=\'rgba(1,149,175,.1)\';this.style.borderColor=\'rgba(1,149,175,.4)\'"'
      +' onmouseleave="this.style.background=\'rgba(255,255,255,.04)\';this.style.borderColor=\'rgba(1,149,175,.18)\'">'
      +'<div style="width:44px;height:44px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.25);border-radius:11px;display:flex;align-items:center;justify-content:center">'+card.icon+'</div>'
      +'<div><div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+htmlEsc(t)+'</div>'
      +'<div style="font-size:10px;color:#64748b;line-height:1.5">'+htmlEsc(d)+'</div></div>'
      +'<div style="margin-top:auto;font-size:10px;font-weight:700;color:#0195af">'+(isAr?'\u0641\u062a\u062d':'Open')+' \u2192</div></div>';
  });
  inner+='</div></div>';
  ov.innerHTML=inner;
  document.body.appendChild(ov);
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  try{if(typeof popAdminSels==='function')popAdminSels();}catch(_){}
  try{if(typeof populateAddYears==='function')populateAddYears();}catch(_){}
}
window._showSuperAdminHub=_showSuperAdminHub;

function _saHubAction(action){
  var ov=document.getElementById('saHubOv'); if(ov)ov.remove();
  if(action==='sa-kpimgmt'){
    _showKpiMgmtPanel();
    setTimeout(function(){if(typeof _injectSaBackBtn==='function')_injectSaBackBtn();},200);
  }else if(action==='sa-texteditor'||action==='sa-dashboard'){
    /* Dashboard card: close hub, render, inject Edit Text toggle, then scan */
    setTimeout(function(){
      try{if(typeof renderCurrent==='function')renderCurrent();}catch(_){}
      setTimeout(function(){
        _injectSaEditTextBtn();
        if(typeof _injectSaBackBtn==='function') _injectSaBackBtn();
      }, 200);
    }, 50);
  }else if(action==='sa-requests'){
    _showUserRequestsPanel();
  }
  try{addAudit('SA_HUB_NAV','SA navigated to: '+action);}catch(_){}
}
window._saHubAction=_saHubAction;

/* _saHubBack: hub ✕ / Back button → returns to portal selection */
function _saHubBack(){
  var ov=document.getElementById('saHubOv'); if(ov) ov.remove();
  if(typeof window._backToPortal==='function') window._backToPortal();
}
window._saHubBack=_saHubBack;

/* _injectSaBackBtn: inject "← Hub" button in toolbar while SA is in a sub-section */
function _injectSaBackBtn(){
  if(document.getElementById('_saHubBackBtn')) return;
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var btn=document.createElement('button');
  btn.id='_saHubBackBtn'; btn.className='tb-btn';
  btn.textContent=isAr?'← القائمة':'← Hub';
  btn.style.cssText='font-size:9.5px;font-weight:700;flex-shrink:0;';
  btn.onclick=function(){
    btn.remove();
    var etb=document.getElementById('_saEditTextBtn'); if(etb) etb.remove();
    if(typeof _deactivateSaEditMode==='function') _deactivateSaEditMode();
    if(typeof _showSuperAdminHub==='function') _showSuperAdminHub();
  };
  var langBtn=document.getElementById('langBtn');
  if(langBtn&&langBtn.parentNode) langBtn.parentNode.insertBefore(btn,langBtn);
}
window._injectSaBackBtn=_injectSaBackBtn;

/* ── SA Edit Text: inject toolbar button + full overlay ── */
function _injectSaEditTextBtn(){
  if(document.getElementById('_saEditTextBtn')) return;
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var btn=document.createElement('button');
  btn.id='_saEditTextBtn'; btn.className='tb-btn';
  btn.title=isAr?'تعديل نصوص اللوحة':'Edit Dashboard Text';
  btn.textContent=isAr?'✏ نصوص':'✏ Text';
  btn.style.cssText='background:rgba(1,149,175,.15);border-color:rgba(1,149,175,.4);color:#0195af;font-weight:700;';
  btn.onclick=function(){ _activateSaEditMode(); };
  var langBtn=document.getElementById('langBtn');
  if(langBtn&&langBtn.parentNode) langBtn.parentNode.insertBefore(btn,langBtn);
}
window._injectSaEditTextBtn=_injectSaEditTextBtn;

function _showSaTextEditorOverlay(){
  var existing=document.getElementById('saTextEdOv');
  if(existing){existing.remove();return;}
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var ov=document.createElement('div'); ov.id='saTextEdOv';
  ov.style.cssText='position:fixed;inset:0;z-index:8500;background:rgba(0,8,20,.9);backdrop-filter:blur(4px);display:flex;flex-direction:column;';
  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:rgba(0,0,0,.4);border-bottom:1px solid rgba(1,149,175,.2);flex-shrink:0;';
  hdr.innerHTML='<div style="display:flex;align-items:center;gap:12px">'
    +'<div style="font-size:14px;font-weight:800;color:#e2e8f0">'+(isAr?'محرر نصوص اللوحة':'Dashboard Text Editor')+'</div>'
    +'<span style="font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(248,113,113,.15);color:#F87171;font-weight:700">SUPER ADMIN</span>'
    +'</div>'
    +'<div style="display:flex;gap:8px">'
    +'<button id="_saTeReset" style="padding:6px 14px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.3);border-radius:8px;color:#DC2626;font-size:10px;font-weight:700;cursor:pointer">'+(isAr?'إعادة ضبط':'Reset All')+'</button>'
    +'<button id="_saTeSave" style="padding:6px 16px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:8px;color:#fff;font-size:10px;font-weight:700;cursor:pointer">'+(isAr?'حفظ التغييرات':'Save Changes')+'</button>'
    +'<button id="_saTeClose" style="width:30px;height:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#94a3b8;cursor:pointer;font-size:15px">&#x2715;</button>'
    +'</div>';
  var info=document.createElement('div');
  info.style.cssText='padding:8px 20px;background:rgba(1,149,175,.06);border-bottom:1px solid rgba(1,149,175,.12);font-size:10px;color:#64748b;flex-shrink:0;';
  info.textContent=isAr?'عدّل النصوص واحفظ — تنعكس التغييرات فوراً على جميع المستخدمين.':'Edit labels and save — changes reflect immediately for all users across dashboard, reports, and filters.';
  var wrap=document.createElement('div');
  wrap.style.cssText='overflow-y:auto;flex:1;padding:0 20px 20px;'; wrap.id='saTeWrap';
  ov.appendChild(hdr); ov.appendChild(info); ov.appendChild(wrap);
  document.body.appendChild(ov);
  _buildSaTeTable();
  document.getElementById('_saTeClose').onclick=function(){ov.remove();};
  document.getElementById('_saTeSave').onclick=function(){_saveSaTextEdits();};
  document.getElementById('_saTeReset').onclick=function(){
    if(!confirm(isAr?'هل تريد إعادة ضبط جميع النصوص؟':'Reset all text edits to defaults?')) return;
    ST.textEdits={};
    persistST('TEXT_EDIT_RESET').then(function(){
      if(typeof applyDOMTranslations==='function') applyDOMTranslations();
      ov.remove(); toast(isAr?'✓ تمت إعادة الضبط':'✓ Text reset to defaults');
    }).catch(function(e){toast('Error: '+e.message);});
  };
}
window._showSaTextEditorOverlay=_showSaTextEditorOverlay;

function _buildSaTeTable(){
  var wrap=document.getElementById('saTeWrap'); if(!wrap) return;
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  if(typeof window.TR==='undefined'){
    wrap.innerHTML='<div style="padding:32px;text-align:center;color:#475569;font-size:11px">'+(isAr?'نظام الترجمة غير متوفر':'Translation system not loaded.')+'</div>';
    return;
  }
  var html='<table style="width:100%;border-collapse:collapse;margin-top:12px">'
    +'<thead><tr style="position:sticky;top:0;background:#0d1b2e;z-index:1">'
    +'<th style="padding:8px 10px;font-size:9.5px;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid rgba(255,255,255,.08)">Key</th>'
    +'<th style="padding:8px 10px;font-size:9.5px;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid rgba(255,255,255,.08)">English</th>'
    +'<th style="padding:8px 10px;font-size:9.5px;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid rgba(255,255,255,.08)">Arabic</th>'
    +'</tr></thead><tbody>';
  Object.keys(window.TR).forEach(function(key){
    var both=typeof tBoth==='function'?tBoth(key):(window.TR[key]||{});
    var edited=ST.textEdits&&ST.textEdits[key];
    var enVal=edited&&edited.en!==undefined?edited.en:(both.en||'');
    var arVal=edited&&edited.ar!==undefined?edited.ar:(both.ar||'');
    html+='<tr data-tekey="'+htmlEsc(key)+'" style="border-bottom:1px solid rgba(255,255,255,.04)'+(edited?';background:rgba(1,149,175,.06)':'')+'">'
      +'<td style="padding:7px 10px;font-size:9.5px;color:#475569;white-space:nowrap;font-family:monospace">'+htmlEsc(key)+(edited?'<span style="color:#0195af;margin-left:4px">✎</span>':'')+'</td>'
      +'<td style="padding:4px 6px"><input class="te-en" style="width:100%;padding:5px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#e2e8f0;font-size:10.5px;font-family:inherit" value="'+htmlEsc(enVal)+'"></td>'
      +'<td style="padding:4px 6px"><input class="te-ar" style="width:100%;padding:5px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#e2e8f0;font-size:10.5px;direction:rtl;font-family:inherit" value="'+htmlEsc(arVal)+'"></td>'
      +'</tr>';
  });
  html+='</tbody></table>';
  wrap.innerHTML=html;
  wrap.querySelectorAll('input.te-en,input.te-ar').forEach(function(inp){
    inp.addEventListener('input',function(){
      var row=inp.closest('tr[data-tekey]');
      if(row) row.style.background='rgba(1,149,175,.08)';
    });
  });
}

function _saveSaTextEdits(){
  var ov=document.getElementById('saTextEdOv'); if(!ov) return;
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  if(!ST.textEdits) ST.textEdits={};
  var changed=0;
  ov.querySelectorAll('tr[data-tekey]').forEach(function(row){
    var key=row.getAttribute('data-tekey');
    var enEl=row.querySelector('.te-en'); var arEl=row.querySelector('.te-ar');
    if(!key||!enEl||!arEl) return;
    var existing=ST.textEdits[key]||{};
    if(enEl.value!==existing.en||arEl.value!==existing.ar){
      ST.textEdits[key]={en:enEl.value,ar:arEl.value}; changed++;
    }
  });
  if(!changed){toast(isAr?'لا تغييرات':'No changes detected');return;}
  if(typeof tSet==='function'){
    Object.keys(ST.textEdits).forEach(function(key){
      tSet(key,ST.textEdits[key].en,ST.textEdits[key].ar);
    });
  }
  persistST('TEXT_EDIT').then(function(){
    toast(isAr?'✓ تم الحفظ — '+changed+' مصطلح تم تحديثه':'✓ Saved — '+changed+' term(s) updated for all users');
    if(typeof renderCurrent==='function') renderCurrent();
    ov.remove();
  }).catch(function(e){toast('\u26a0 Save error: '+(e.code||e.message));});
}
window._saveSaTextEdits=_saveSaTextEdits;


function _showUserRequestsPanel(){
  var existing=document.getElementById('saReqOv'); if(existing)existing.remove();
  var isAr=(typeof lang!=='undefined'&&lang==='ar');

  /* Overlay skeleton with loading state */
  var ov=document.createElement('div'); ov.id='saReqOv';
  ov.style.cssText='position:fixed;inset:0;z-index:9100;background:rgba(0,8,20,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';

  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(900px,100%);max-height:85vh;display:flex;flex-direction:column;gap:16px;';
  box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div><div style="font-size:15px;font-weight:800;color:#e2e8f0">'+(isAr?'طلبات المستخدمين':'User Requests')+'</div>'
    +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'إدارة الطلبات والردود':'Manage requests and responses')+'</div></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button id="saReqRefresh" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">'+(isAr?'تحديث':'Refresh')+'</button>'
    +'<button onclick="_showSuperAdminHub()" style="padding:6px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;font-size:10px;cursor:pointer">'+(isAr?'← رجوع':'← Back')+'</button>'
    +'</div></div>'
    +'<div id="saReqBody" style="overflow-y:auto;flex:1;min-height:200px;display:flex;align-items:center;justify-content:center">'
    +'<div style="color:#64748b;font-size:11px">'+(isAr?'جاري التحميل...':'Loading requests...')+'</div></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.onclick=function(e){if(e.target===ov)ov.remove();};

  document.getElementById('saReqRefresh').onclick=function(){_saReqLoad(true);};

  function _saReqLoad(forceRefresh){
    var body=document.getElementById('saReqBody');
    if(!body) return;
    body.innerHTML='<div style="color:#64748b;font-size:11px">'+(isAr?'جاري التحميل...':'Loading...')+'</div>';
    if(typeof window._kpiRequestsGetAll!=='function'){
      body.innerHTML='<div style="color:#DC2626;font-size:11px">Requests API not available. Check Firebase.</div>'; return;
    }
    window._kpiRequestsGetAll().then(function(reqs){
      if(!document.getElementById('saReqOv')) return; /* panel closed */
      _saReqRender(reqs);
    }).catch(function(e){
      if(body) body.innerHTML='<div style="color:#DC2626;font-size:11px">Error: '+htmlEsc(e.message)+'</div>';
    });
  }

  function _saReqRender(reqs){
    var body=document.getElementById('saReqBody'); if(!body) return;
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    if(!reqs||!reqs.length){
      body.innerHTML='<div style="color:#64748b;font-size:11px;text-align:center;padding:32px">'+(isAr?'لا توجد طلبات حتى الآن':'No requests yet')+'</div>';
      return;
    }
    var html='<table style="width:100%;border-collapse:collapse;font-size:10.5px">'
      +'<thead><tr style="border-bottom:1px solid rgba(1,149,175,.2)">'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700;white-space:nowrap">'+(isAr?'التاريخ':'Date')+'</th>'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700">'+(isAr?'المستخدم':'User')+'</th>'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700">'+(isAr?'النوع':'Type')+'</th>'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700">'+(isAr?'الطلب':'Message')+'</th>'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700">'+(isAr?'الحالة':'Status')+'</th>'
      +'<th style="padding:8px;text-align:left;color:#64748b;font-weight:700">'+(isAr?'الرد':'Response')+'</th>'
      +'</tr></thead><tbody>';
    var statusColor={pending:'#D97706',approved:'#16A34A',rejected:'#DC2626'};
    var statusLabel={pending:isAr?'معلق':'Pending',approved:isAr?'موافق عليه':'Approved',rejected:isAr?'مرفوض':'Rejected'};
    reqs.forEach(function(r){
      var sc=statusColor[r.status]||'#64748b';
      var sl=statusLabel[r.status]||r.status||'—';
      var ts=typeof window._fmtTs==='function'?window._fmtTs(r.createdAt):'—';
      html+='<tr data-reqid="'+htmlEsc(r.id||'')+'" style="border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<td style="padding:8px;color:#94a3b8;white-space:nowrap;font-size:9.5px">'+htmlEsc(ts)+'</td>'
        +'<td style="padding:8px;color:#e2e8f0">'+htmlEsc(r.userName||r.userEmail||'—')+'<br>'
        +'<span style="font-size:9px;color:#64748b">'+htmlEsc(r.userEmail||'')+'</span></td>'
        +'<td style="padding:8px;color:#94a3b8;white-space:nowrap">'+htmlEsc(r.requestType||'—')+'</td>'
        +'<td style="padding:8px;color:#e2e8f0;max-width:240px">'+htmlEsc(r.message||'')+'</td>'
        +'<td style="padding:8px;white-space:nowrap"><span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:'+sc+'22;color:'+sc+'">'+sl+'</span></td>'
        +'<td style="padding:8px;min-width:220px">'
        +(r.status!=='pending'
          ? '<div style="font-size:9.5px;color:#94a3b8;margin-bottom:4px">'+(r.superAdminComment?htmlEsc(r.superAdminComment):'—')+'</div>'
            +'<div style="font-size:9px;color:#475569">'+(isAr?'ردّ في:':'Responded: ')+(typeof window._fmtTs==='function'?window._fmtTs(r.respondedAt):'')+'</div>'
          : '<div style="display:flex;flex-direction:column;gap:5px">'
            +'<textarea id="cmt_'+htmlEsc(r.id)+'" placeholder="'+(isAr?'تعليق اختياري...':'Optional comment...')+'" '
            +'style="width:100%;padding:5px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#e2e8f0;font-size:9.5px;resize:vertical;min-height:36px;font-family:inherit"></textarea>'
            +'<div style="display:flex;gap:6px">'
            +'<button onclick="_saReqRespond(\''+htmlEsc(r.id)+'\',\'approved\')" '
            +'style="flex:1;padding:5px 10px;background:rgba(22,163,74,.15);border:1px solid rgba(22,163,74,.4);border-radius:6px;color:#16A34A;font-size:9px;font-weight:700;cursor:pointer">'+(isAr?'✓ موافقة':'✓ Approve')+'</button>'
            +'<button onclick="_saReqRespond(\''+htmlEsc(r.id)+'\',\'rejected\')" '
            +'style="flex:1;padding:5px 10px;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.35);border-radius:6px;color:#DC2626;font-size:9px;font-weight:700;cursor:pointer">'+(isAr?'✕ رفض':'✕ Reject')+'</button>'
            +'</div></div>'
        )
        +'</td></tr>';
    });
    html+='</tbody></table>';
    body.innerHTML=html;
  }

  window._saReqRespond=function(reqId,status){
    if(!reqId) return;
    var cmtEl=document.getElementById('cmt_'+reqId);
    var comment=cmtEl?cmtEl.value.trim():'';
    if(typeof window._kpiRequestsRespond!=='function'){toast('Requests API unavailable');return;}
    window._kpiRequestsRespond(reqId,status,comment).then(function(){
      toast((status==='approved'?(isAr?'✓ تمت الموافقة':'✓ Approved'):(isAr?'✕ تم الرفض':'✕ Rejected')));
      _saReqLoad(true);
    }).catch(function(e){toast('Error: '+e.message);});
  };
  window._saReqRespond=window._saReqRespond;

  _saReqLoad(false);
}
window._showUserRequestsPanel=_showUserRequestsPanel;


window._showSuperAdminHub = _showSuperAdminHub;

/* ══════════════════════════════════════════════════════════════
   ISSUE 1: Dashboard card — click-to-edit text mode
   ══════════════════════════════════════════════════════════════ */
var _saEditModeActive = false;

function _activateSaEditMode(){
  /* CRITICAL: set window._saEditMode FIRST so t() returns editable spans on next render */
  window._saEditMode = true;
  _saEditModeActive  = true;

  /* Inject outline CSS */
  if(!document.getElementById('_saEditStyle')){
    var st = document.createElement('style');
    st.id = '_saEditStyle';
    st.textContent =
      '[data-tkey]{outline:2px dashed rgba(1,149,175,.7);cursor:pointer;border-radius:2px;transition:outline .15s;}'
      +'[data-tkey]:hover{outline:2px solid #0195af;background:rgba(1,149,175,.12);}';
    document.head.appendChild(st);
  }

  /* Update button to show Exit state */
  var btn = document.getElementById('_saEditTextBtn');
  if(btn){
    btn.style.background  = 'rgba(1,149,175,.3)';
    btn.style.borderColor = '#0195af';
    btn.textContent = (typeof lang!=='undefined'&&lang==='ar') ? '✕ إيقاف التعديل' : '✕ Exit Edit';
    btn.onclick = function(){ _deactivateSaEditMode(); };
  }

  /* Re-render dashboard WITH _saEditMode=true so t() injects [data-tkey] spans,
     then scan those spans to attach click handlers.                              */
  try{ if(typeof renderCurrent==='function') renderCurrent(); }catch(_){}
  setTimeout(function(){ _scanDashboardForEditable(); }, 300);
}
window._activateSaEditMode = _activateSaEditMode;

function _deactivateSaEditMode(){
  /* Clear both flags so t() returns plain text on next render */
  window._saEditMode = false;
  _saEditModeActive  = false;

  /* Remove outline CSS */
  var st = document.getElementById('_saEditStyle');
  if(st) st.remove();

  /* Reset button to Enter state */
  var btn = document.getElementById('_saEditTextBtn');
  if(btn){
    btn.style.background  = 'rgba(1,149,175,.15)';
    btn.style.borderColor = 'rgba(1,149,175,.4)';
    btn.textContent = (typeof lang!=='undefined'&&lang==='ar') ? '✏ نصوص' : '✏ Text';
    btn.onclick = function(){ _activateSaEditMode(); };
  }

  /* Re-render dashboard without edit mode to restore plain text */
  try{ if(typeof renderCurrent==='function') renderCurrent(); }catch(_){}
}
window._deactivateSaEditMode = _deactivateSaEditMode;


/* ── FINAL TEXT EDIT ROUTING HELPERS ─────────────────────────────
   General UI text uses DOM-scoped keys and edits current language only.
   KPI names use group keys by visible KPI name and update all KPIs that share
   that name in the edited language, regardless of KPI code. */
function _saCleanText(v){return String(v||'').replace(/\s+/g,' ').trim();}
function _saB64(s){try{return btoa(unescape(encodeURIComponent(String(s||'')))).replace(/=+$/,'');}catch(_){return String(s||'').replace(/[^a-zA-Z0-9]+/g,'_').slice(0,60);}}
function _saUnB64(s){try{var x=String(s||''); while(x.length%4)x+='='; return decodeURIComponent(escape(atob(x)));}catch(_){return '';}}
function _saCurrentPageId(el){
  var ids=['page-exec','page-dept','page-reg','page-acc','page-accountability','page-report'];
  for(var i=0;i<ids.length;i++){var p=document.getElementById(ids[i]); if(p&&p.contains(el)) return ids[i];}
  var on=el&&el.closest?el.closest('.page.on,.page'):null; return on&&on.id?on.id:'page';
}
function _saDomPath(el){
  var parts=[], n=el;
  while(n&&n.nodeType===1&&n.id!=='root'&&parts.length<7){
    if(n.id && /^page-/.test(n.id)){parts.unshift(n.id);break;}
    var idx=1, sib=n;
    while((sib=sib.previousElementSibling)){ if(sib.tagName===n.tagName) idx++; }
    var cls=(n.className&&typeof n.className==='string')?'.'+n.className.trim().split(/\s+/).slice(0,2).join('.'):'';
    parts.unshift(n.tagName.toLowerCase()+cls+':'+idx); n=n.parentElement;
  }
  return parts.join('>');
}
function _saDomKey(el){
  return 'dom_'+_saCurrentPageId(el)+'_'+_saB64(_saDomPath(el));
}
function _saKpiNameGroupKey(langCode, visibleName){
  return 'kpi_name_group:'+langCode+':'+_saB64(_saCleanText(visibleName).toLowerCase());
}
function _saKpiNameGroupFromKey(key){
  var m=String(key||'').match(/^kpi_name_group:(en|ar):(.+)$/); if(!m) return null;
  return {lang:m[1], name:_saUnB64(m[2])};
}
function _saFindKpiNameGroupForText(text){
  if(typeof allK!=='function') return null;
  var t=_saCleanText(text); if(!t) return null;
  var ks=allK(), en=[], ar=[];
  ks.forEach(function(k){ if(_saCleanText(k.nameEn)===t) en.push(k); if(_saCleanText(k.nameAr)===t) ar.push(k); });
  if((typeof lang!=='undefined'&&lang==='ar') && ar.length) return {key:_saKpiNameGroupKey('ar',t), lang:'ar', name:t, list:ar};
  if((typeof lang!=='undefined'&&lang==='en') && en.length) return {key:_saKpiNameGroupKey('en',t), lang:'en', name:t, list:en};
  if(en.length) return {key:_saKpiNameGroupKey('en',t), lang:'en', name:t, list:en};
  if(ar.length) return {key:_saKpiNameGroupKey('ar',t), lang:'ar', name:t, list:ar};
  return null;
}
function _saApplyKpiNameGroupEdit(key,newVal){
  var g=_saKpiNameGroupFromKey(key); if(!g||!newVal) return 0;
  var oldName=_saCleanText(g.name), count=0;
  if(!ST.ov) ST.ov={};
  function upd(id){ if(!id) return; if(!ST.ov[id]) ST.ov[id]={}; if(g.lang==='ar') ST.ov[id].nameAr=newVal; else ST.ov[id].nameEn=newVal; count++; }
  if(typeof allK==='function'){
    allK().forEach(function(k){
      var cur=_saCleanText(g.lang==='ar'?k.nameAr:k.nameEn).toLowerCase();
      if(cur===oldName) upd(k.id);
    });
  }
  if(Array.isArray(ST.added)){
    ST.added.forEach(function(k){
      var cur=_saCleanText(g.lang==='ar'?k.nameAr:k.nameEn).toLowerCase();
      if(cur===oldName){ if(g.lang==='ar') k.nameAr=newVal; else k.nameEn=newVal; }
    });
  }
  return count;
}
function _saReadKpiNameGroup(key){
  var g=_saKpiNameGroupFromKey(key); if(!g) return {en:'',ar:''};
  var out={en:'',ar:''};
  if(typeof allK==='function'){
    var old=g.name;
    var k=(allK()||[]).find(function(x){return _saCleanText(g.lang==='ar'?x.nameAr:x.nameEn).toLowerCase()===old;});
    if(k){out.en=k.nameEn||'';out.ar=k.nameAr||'';}
  }
  return out;
}
function _saIsKpiGroupKey(key){return /^kpi_name_group:(en|ar):/.test(String(key||''));}

function _scanDashboardForEditable(){
  if(!_saEditModeActive) return;
  var SKIP_TAGS = {SCRIPT:1,STYLE:1,INPUT:1,TEXTAREA:1,SELECT:1,OPTION:1,SVG:1,PATH:1,BUTTON:1,CANVAS:1};
  var containers = [];
  ['page-exec','page-reg','page-dept','page-acc','page-accountability','page-report'].forEach(function(id){
    var el=document.getElementById(id); if(el) containers.push(el);
  });
  if(!containers.length){var m=document.querySelector('.page.on,.page-content,main'); if(m) containers.push(m); else return;}

  function bind(el,key){
    if(!el||!key) return;
    el.setAttribute('data-tkey',key);
    el.setAttribute('data-sa-bound','1');
    el.onclick=function(e){e.stopPropagation(); _showTextKeyPopup(key,el);};
    if(window._saEditMode){el.classList.add('sa-ed');}
  }
  function isLeaf(el){for(var i=0;i<el.childNodes.length;i++) if(el.childNodes[i].nodeType===1) return false; return true;}

  containers.forEach(function(container){
    container.querySelectorAll('*').forEach(function(el){
      if(SKIP_TAGS[el.tagName]) return;
      if(!isLeaf(el)) return;
      var text=_saCleanText(el.textContent);
      if(!text || text.length<2 || text.length>180) return;
      var kpiGrp=_saFindKpiNameGroupForText(text);
      if(kpiGrp){ bind(el,kpiGrp.key); return; }
      /* General UI text: always DOM scoped, never text scoped. This prevents
         editing one label from changing another label with similar text. */
      bind(el,_saDomKey(el));
    });
  });
}
window._scanDashboardForEditable = _scanDashboardForEditable;

function _showTextKeyPopup(key, anchorEl){
  var existing = document.getElementById('saTextKeyPopup');
  if(existing) existing.remove();
  var isAr = (typeof lang !== 'undefined' && lang === 'ar');
  var stored = ST.textEdits && ST.textEdits[key];
  var tr = window.TR && window.TR[key];
  /* For kpi_name: keys, skip ST.textEdits/TR — values come from ST.ov/allK() block below */
  var _isKpiKey = (key.indexOf('kpi_name:')===0) || (typeof _saIsKpiGroupKey==='function' && _saIsKpiGroupKey(key));
  var enVal = _isKpiKey ? '' : (stored ? (stored.en !== undefined ? stored.en : (tr ? tr.en||'' : '')) : (tr ? tr.en||'' : ''));
  var arVal = _isKpiKey ? '' : (stored ? (stored.ar !== undefined ? stored.ar : (tr ? tr.ar||'' : '')) : (tr ? tr.ar||'' : ''));

  var popup = document.createElement('div');
  popup.id = 'saTextKeyPopup';
  popup.style.cssText = 'position:fixed;z-index:10000;background:#0d1b2e;border:1px solid rgba(1,149,175,.4);border-radius:12px;padding:16px;min-width:300px;max-width:420px;box-shadow:0 12px 40px rgba(0,0,0,.6);';
  /* Position near anchor */
  var rect = anchorEl ? anchorEl.getBoundingClientRect() : {top:200,left:200};
  var top = Math.min(rect.bottom + 6, window.innerHeight - 200);
  var left = Math.max(8, Math.min(rect.left, window.innerWidth - 440));
  popup.style.top = top + 'px'; popup.style.left = left + 'px';

  /* If KPI name key, read from ST.ov not ST.textEdits */
  if(typeof _saIsKpiGroupKey==='function' && _saIsKpiGroupKey(key)){
    var _grpVals = _saReadKpiNameGroup(key);
    enVal = _grpVals.en || enVal;
    arVal = _grpVals.ar || arVal;
  } else if(key.indexOf('kpi_name:') === 0){
    var _parts0 = key.split(':');
    var _kpiId0 = _parts0[1];
    var _nameLang0 = _parts0[2];
    var _ov0 = (ST.ov||{})[_kpiId0]||{};
    var _kpiK0 = (typeof allK==='function'?allK():[]).find(function(x){return x.id===_kpiId0;})||{};
    enVal = _ov0.nameEn || _kpiK0.nameEn || enVal;
    arVal = _ov0.nameAr || _kpiK0.nameAr || arVal;
  }
  var editLang = isAr ? 'ar' : 'en';
  if(typeof _saIsKpiGroupKey==='function' && _saIsKpiGroupKey(key)){ var _g0=_saKpiNameGroupFromKey(key); if(_g0&&_g0.lang) editLang=_g0.lang; }
  var readLang = editLang === 'ar' ? 'en' : 'ar';
  var editVal  = editLang === 'ar' ? arVal : enVal;
  var readVal  = editLang === 'ar' ? enVal : arVal;
  var editLabel = editLang === 'ar' ? 'النص بالعربية (قابل للتعديل)' : 'English text (editable)';
  var readLabel = editLang === 'ar' ? 'النص بالإنجليزية (مرجع فقط)' : 'Arabic text (reference only)';

  popup.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +'<div style="font-size:9px;color:#64748b;font-family:monospace">'+htmlEsc(key)+'</div>'
    +'<button id="_saPopClose" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;padding:0">&#x2715;</button></div>'
    +'<label style="display:block;font-size:9.5px;font-weight:700;color:#0195af;margin-bottom:4px">'+editLabel+'</label>'
    +'<input id="_saPopEdit" value="'+htmlEsc(editVal)+'" '+(isAr?'dir="rtl"':'')+' '
    +'style="width:100%;padding:7px 10px;background:rgba(255,255,255,.07);border:1px solid rgba(1,149,175,.3);border-radius:7px;color:#e2e8f0;font-size:11px;font-family:inherit;box-sizing:border-box;margin-bottom:8px">'
    +'<label style="display:block;font-size:9.5px;color:#475569;margin-bottom:3px">'+readLabel+'</label>'
    +'<div style="padding:6px 10px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.07);border-radius:6px;color:#64748b;font-size:10.5px;min-height:24px;margin-bottom:10px"'+(!isAr?' dir="rtl"':'')+'>'+htmlEsc(readVal)+'</div>'
    +'<button id="_saPopSave" style="width:100%;padding:8px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:10px;cursor:pointer">'
    +(isAr?'حفظ':'Save')+'</button>'
    +'<div id="_saPopFb" style="margin-top:6px;font-size:9.5px;display:none"></div>';

  document.body.appendChild(popup);
  var input = document.getElementById('_saPopEdit');
  if(input){ input.focus(); input.select(); }
  document.getElementById('_saPopClose').onclick = function(){ popup.remove(); };

  document.getElementById('_saPopSave').onclick = function(){
    var newVal = input ? input.value : editVal;
    /* Route KPI name edits ONLY to ST.ov — never mix into ST.textEdits */
    if(typeof _saIsKpiGroupKey==='function' && _saIsKpiGroupKey(key)){
      _saApplyKpiNameGroupEdit(key,newVal);
      if(ST.textEdits) delete ST.textEdits[key];
    } else if(key.indexOf('kpi_name:') === 0){
      var _parts = key.split(':');
      var _kpiId2 = _parts[1];
      var _nameLang = _parts[2]; /* 'en' or 'ar' from the scan key */
      if(!ST.ov) ST.ov = {};
      if(!ST.ov[_kpiId2]) ST.ov[_kpiId2] = {};
      if(_nameLang === 'en'){
        /* Update ONLY English — preserve existing Arabic */
        ST.ov[_kpiId2].nameEn = newVal;
        if(!ST.ov[_kpiId2].nameAr && arVal) ST.ov[_kpiId2].nameAr = arVal;
      } else {
        /* Update ONLY Arabic — preserve existing English */
        ST.ov[_kpiId2].nameAr = newVal;
        if(!ST.ov[_kpiId2].nameEn && enVal) ST.ov[_kpiId2].nameEn = enVal;
      }
      /* Never store KPI names in ST.textEdits — avoids cross-language contamination */
      if(ST.textEdits) delete ST.textEdits[key];
    } else {
      /* General dashboard text edits: save the edited language only.
         Keep the original/base text so future renderCurrent() calls can re-apply
         the edit even when the dashboard rebuilds hardcoded labels. */
      if(!ST.textEdits) ST.textEdits = {};
      if(!ST.textEdits[key]) ST.textEdits[key] = {};
      if(ST.textEdits[key]._baseEn === undefined) ST.textEdits[key]._baseEn = enVal || (anchorEl ? anchorEl.textContent : '');
      if(ST.textEdits[key]._baseAr === undefined) ST.textEdits[key]._baseAr = arVal || (anchorEl ? anchorEl.textContent : '');
      if(ST.textEdits[key]._sourceText === undefined && anchorEl) ST.textEdits[key]._sourceText = anchorEl.textContent || '';
      ST.textEdits[key][editLang] = newVal;
      /* Do not call tSet() here. tSet mutates TR and can make hardcoded dashboard
         labels lose their original lookup after a refresh/re-render. */
      if(typeof window._applyDashboardTextEditsSoon==='function') window._applyDashboardTextEditsSoon();
    }
        persistST(((key.indexOf('kpi_name:')===0)||(typeof _saIsKpiGroupKey==='function'&&_saIsKpiGroupKey(key))) ? 'KPI_NAME_EDIT:'+key : 'TEXT_EDIT:'+key).then(function(){
      var fb = document.getElementById('_saPopFb');
      if(fb){fb.textContent='✓ '+(typeof lang!=='undefined'&&lang==='ar'?'تم الحفظ — سيظهر لجميع المستخدمين':'Saved — reflects for all users');fb.style.color='#16A34A';fb.style.display='block';}
      /* Re-render dashboard so KPI names update everywhere */
      setTimeout(function(){
        try{ if(typeof renderCurrent==='function') renderCurrent(); }catch(_){}
        try{ if(typeof window._applyDashboardTextEditsSoon==='function') window._applyDashboardTextEditsSoon(); }catch(_){}
        popup.remove();
      }, 800);
    }).catch(function(e){
      var fb = document.getElementById('_saPopFb');
      if(fb){fb.textContent='⚠ '+e.message;fb.style.color='#DC2626';fb.style.display='block';}
    });
  };
  /* Close on outside click */
  setTimeout(function(){
    document.addEventListener('click', function _closePopup(e){
      if(!popup.contains(e.target)){ popup.remove(); document.removeEventListener('click', _closePopup); }
    });
  }, 100);
}
window._showTextKeyPopup = _showTextKeyPopup;

/* ══════════════════════════════════════════════════════════════
   ISSUE 2: KPI Management — field config + formula editor
   ══════════════════════════════════════════════════════════════ */
function _adminMergedMasterConfig(masterId){
  if(!masterId) return null;
  if(typeof window._mergeMasterKpiConfig === 'function') return window._mergeMasterKpiConfig(masterId);
  var base=(window.BUILTIN_MASTER_KPIS||{})[masterId]||{};
  var ov=((typeof ST!=='undefined'&&ST.masterKpis)?ST.masterKpis[masterId]:null)||{};
  var cfg=Object.assign({},base,ov);
  var bf=Array.isArray(base.fieldConfig)?base.fieldConfig:[];
  var of=Array.isArray(ov.fieldConfig)?ov.fieldConfig:[];
  var max=Math.max(bf.length,of.length);
  cfg.fieldConfig=[];
  for(var i=0;i<max;i++) cfg.fieldConfig.push(Object.assign({},bf[i]||{},of[i]||{}));
  cfg.resultFormula=(ov.resultFormula!==undefined&&ov.resultFormula!==null&&String(ov.resultFormula).trim()!=='')?ov.resultFormula:(base.resultFormula||'');
  return cfg;
}
window._adminMergedMasterConfig=_adminMergedMasterConfig;

function _ensureMasterOverride(masterId, cfg){
  if(!masterId) return null;
  if(!ST.masterKpis) ST.masterKpis={};
  if(!ST.masterKpis[masterId]) ST.masterKpis[masterId]={};
  var ov=ST.masterKpis[masterId];
  cfg = cfg || _adminMergedMasterConfig(masterId) || {};
  ov.nameEn = ov.nameEn || cfg.nameEn || '';
  ov.nameAr = ov.nameAr || cfg.nameAr || ov.nameEn || '';
  if(!Array.isArray(ov.fieldConfig) || !ov.fieldConfig.length){
    ov.fieldConfig = (cfg.fieldConfig||[]).map(function(f){return Object.assign({},f);});
  }
  if((ov.resultFormula===undefined||ov.resultFormula===null||String(ov.resultFormula).trim()==='') && cfg.resultFormula){
    ov.resultFormula = cfg.resultFormula;
  }
  return ov;
}
window._ensureMasterOverride=_ensureMasterOverride;


/* ── KPI-specific Formula Override Helpers ─────────────────────────────
   Add KPI keeps master/name-level formula config in ST.masterKpis.
   Edit KPI saves formula references/formula under the specific KPI code + name,
   so KPIs sharing the same name can still have different formulas/references when edited. */
function _adminNormKpiCode(id){
  var v=String(id||'').trim();
  try{ if(typeof realId==='function') v=realId(v); }catch(_){ }
  return String(v||'').trim().toUpperCase();
}
function _adminGetEditKpiId(section){
  section = section || document.getElementById('editQtrSection');
  var id = section ? (section.getAttribute('data-kpi-id') || '') : '';
  if(!id){ var sel=document.getElementById('eSel'); if(sel) id=sel.value||''; }
  return _adminNormKpiCode(id);
}
function _adminGetEditKpiNameEn(section){
  section = section || document.getElementById('editQtrSection');
  var v = section ? (section.getAttribute('data-kpi-name-en') || '') : '';
  if(!v){ var e=document.getElementById('eNE'); if(e) v=e.value||''; }
  return String(v||'').trim();
}
function _adminGetEditKpiNameAr(section){
  section = section || document.getElementById('editQtrSection');
  var v = section ? (section.getAttribute('data-kpi-name-ar') || '') : '';
  if(!v){ var e=document.getElementById('eNA'); if(e) v=e.value||''; }
  return String(v||'').trim();
}
function _adminEnsureKpiFormulaStore(){
  if(typeof ST==='undefined') return {};
  if(!ST.kpiFormulaOverrides) ST.kpiFormulaOverrides={};
  return ST.kpiFormulaOverrides;
}
function _adminGetKpiFormulaOverride(kpiId){
  var store=(typeof ST!=='undefined'&&ST.kpiFormulaOverrides)?ST.kpiFormulaOverrides:null;
  if(!store) return null;
  var key=_adminNormKpiCode(kpiId);
  return store[key] || store[String(kpiId||'')] || null;
}
function _adminCloneFieldConfig(fields){
  return (Array.isArray(fields)?fields:[]).map(function(f){return Object.assign({},f||{});});
}
function _adminEnsureKpiFormulaOverride(kpiId, kpiNameEn, masterId, baseCfg){
  var key=_adminNormKpiCode(kpiId);
  if(!key) return null;
  var store=_adminEnsureKpiFormulaStore();
  if(!store[key]) store[key]={};
  var ov=store[key];
  baseCfg = baseCfg || (masterId ? _adminMergedMasterConfig(masterId) : {}) || {};
  ov.kpiCode = key;
  ov.kpiNameEn = String(kpiNameEn || ov.kpiNameEn || _adminGetEditKpiNameEn() || '').trim();
  ov.kpiNameAr = String(ov.kpiNameAr || _adminGetEditKpiNameAr() || '').trim();
  ov.masterId = masterId || ov.masterId || '';
  if(!Array.isArray(ov.fieldConfig) || !ov.fieldConfig.length){
    ov.fieldConfig = _adminCloneFieldConfig(baseCfg.fieldConfig);
  }
  if((ov.resultFormula===undefined || ov.resultFormula===null || String(ov.resultFormula).trim()==='') && baseCfg.resultFormula){
    ov.resultFormula = baseCfg.resultFormula;
  }
  return ov;
}
function _adminMergeKpiSpecificConfig(masterId, kpiId, kpiNameEn){
  var base=(masterId && typeof _adminMergedMasterConfig==='function') ? _adminMergedMasterConfig(masterId) : null;
  if(!base) return null;
  var ov=_adminGetKpiFormulaOverride(kpiId);
  if(!ov) return base;
  /* Code is the primary key; name is stored for audit/clarity, not for broad matching. */
  var cfg=Object.assign({},base,ov);
  var bf=Array.isArray(base.fieldConfig)?base.fieldConfig:[];
  var of=Array.isArray(ov.fieldConfig)?ov.fieldConfig:[];
  var max=Math.max(bf.length,of.length);
  cfg.fieldConfig=[];
  for(var i=0;i<max;i++) cfg.fieldConfig.push(Object.assign({},bf[i]||{},of[i]||{}));
  cfg.resultFormula=(ov.resultFormula!==undefined&&ov.resultFormula!==null&&String(ov.resultFormula).trim()!=='')?ov.resultFormula:(base.resultFormula||'');
  cfg._kpiSpecific=true;
  cfg._kpiCode=_adminNormKpiCode(kpiId);
  cfg._kpiNameEn=kpiNameEn||ov.kpiNameEn||'';
  return cfg;
}
window._adminMergeKpiSpecificConfig=_adminMergeKpiSpecificConfig;

function _getMasterKpiId(kpiNameEn){
  if(!kpiNameEn) return '';
  return kpiNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}
window._getMasterKpiId = _getMasterKpiId;

function _showKpiMgmtPanel(){
  var existing = document.getElementById('kpiMgmtOv'); if(existing) existing.remove();
  var isAr = (typeof lang !== 'undefined' && lang === 'ar');

  var ov = document.createElement('div'); ov.id = 'kpiMgmtOv';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(0,8,20,.86);backdrop-filter:blur(5px);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var box = document.createElement('div');
  box.style.cssText = 'background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(860px,100%);margin:auto;';

  /* Get unique KPI names from allK() */
  var kpis = (typeof allK === 'function') ? allK() : [];
  var nameMap = {}; /* nameEn → {kpi, masterKpiId} */
  kpis.forEach(function(k){
    var nm = k.nameEn || k.id || '';
    if(nm && !nameMap[nm]) nameMap[nm] = {kpi:k, masterKpiId:_getMasterKpiId(nm)};
  });
  var nameKeys = Object.keys(nameMap).sort();

  var opts = '<option value="">'+(isAr?'— اختر مؤشراً —':'— Select a KPI —')+'</option>'
    + nameKeys.map(function(nm){
        var mid = nameMap[nm].masterKpiId;
        var hasConfig = !!(ST.masterKpis && ST.masterKpis[mid] && ST.masterKpis[mid].fieldConfig && ST.masterKpis[mid].fieldConfig.length);
        return '<option value="'+htmlEsc(mid)+'" data-name-en="'+htmlEsc(nm)+'" data-name-ar="'+htmlEsc(nameMap[nm].kpi.nameAr||nm)+'">'+htmlEsc(nm)+(hasConfig?' ✎':'')+'</option>';
      }).join('');

  box.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">'
    +'<div><div style="font-size:15px;font-weight:800;color:#e2e8f0">'+(isAr?'إعداد مؤشرات الأداء':'KPI Management')+'</div>'
    +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'اختر مؤشراً لتعديل حقوله وصيغة النتيجة':'Select a KPI to configure its fields and result formula')+'</div></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button onclick="_showSuperAdminHub()" style="padding:6px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;font-size:10px;cursor:pointer">'+(isAr?'← رجوع':'← Back')+'</button>'
    +'</div></div>'
    +'<div style="margin-bottom:18px">'
    +'<label style="display:block;font-size:10px;font-weight:700;color:#64748b;margin-bottom:6px">'+(isAr?'اختر المؤشر بالاسم:':'Select KPI by Name:')+'</label>'
    +'<select id="kpiMgmtSelect" style="width:100%;padding:10px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#e2e8f0;font-size:12px;font-family:inherit">'+opts+'</select></div>'
    +'<div id="kpiMgmtConfig" style="display:none"></div>';

  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };

  document.getElementById('kpiMgmtSelect').onchange = function(){
    var mid = this.value;
    var opt = this.options[this.selectedIndex];
    var nameEn = opt ? opt.getAttribute('data-name-en') : '';
    var nameAr = opt ? opt.getAttribute('data-name-ar') : '';
    if(mid) _renderKpiFieldConfig(mid, nameEn, nameAr);
    else document.getElementById('kpiMgmtConfig').style.display = 'none';
  };
}
window._showKpiMgmtPanel = _showKpiMgmtPanel;

function _renderKpiFieldConfig(masterKpiId, nameEn, nameAr){
  var cfg = document.getElementById('kpiMgmtConfig'); if(!cfg) return;
  var isAr = (typeof lang !== 'undefined' && lang === 'ar');
  if(!ST.masterKpis) ST.masterKpis = {};
  var mergedCfg = (typeof _adminMergedMasterConfig==='function') ? _adminMergedMasterConfig(masterKpiId) : null;
  var mc = _ensureMasterOverride(masterKpiId, mergedCfg || { nameEn: nameEn, nameAr: nameAr, fieldConfig: [], resultFormula: '' });
  mc.nameEn = nameEn || mc.nameEn || (mergedCfg&&mergedCfg.nameEn) || '';
  mc.nameAr = nameAr || mc.nameAr || (mergedCfg&&mergedCfg.nameAr) || mc.nameEn || '';
  var displayCfg = (typeof _adminMergedMasterConfig==='function') ? _adminMergedMasterConfig(masterKpiId) : mc;
  var fields = (displayCfg && displayCfg.fieldConfig) || mc.fieldConfig || [];
  var FIELD_TYPES = ['number','percentage','text','formula'];

  var letterMap = fields.map(function(_,i){ return String.fromCharCode(65+i); }); /* A,B,C,D... */

  var rowsHtml = fields.map(function(f, i){
    var letter = String.fromCharCode(65+i);
    return '<tr data-fidx="'+i+'" style="border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<td style="padding:6px 8px;color:#64748b;font-weight:700;font-size:11px;width:28px">'+letter+'</td>'
      +'<td style="padding:4px 5px"><input class="fc-name-en" value="'+htmlEsc(f.nameEn||'')+'" placeholder="English" style="width:100%;padding:5px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e2e8f0;font-size:10px;font-family:inherit;box-sizing:border-box"></td>'
      +'<td style="padding:4px 5px"><input class="fc-name-ar" value="'+htmlEsc(f.nameAr||'')+'" placeholder="Arabic" dir="rtl" style="width:100%;padding:5px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e2e8f0;font-size:10px;font-family:inherit;box-sizing:border-box"></td>'
      +'<td style="padding:4px 5px;width:110px"><select class="fc-type" style="width:100%;padding:5px 7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e2e8f0;font-size:10px;font-family:inherit">'
      +FIELD_TYPES.map(function(t){return '<option value="'+t+'"'+(f.type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></td>'
      +'<td style="padding:4px 5px;width:80px"><select class="fc-input" style="width:100%;padding:5px 7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e2e8f0;font-size:10px;font-family:inherit">'
      +'<option value="manual"'+(f.inputMode!=='calculated'?' selected':'')+'>Manual</option>'
      +'<option value="calculated"'+(f.inputMode==='calculated'?' selected':'')+'>Calculated</option></select></td>'
      +'<td style="padding:4px 5px;width:60px;text-align:center">'
      +'<button onclick="_fcMoveRow('+i+',-1)" title="Move up" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;padding:0 3px">↑</button>'
      +'<button onclick="_fcMoveRow('+i+',1)" title="Move down" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;padding:0 3px">↓</button>'
      +'</td>'
      +'<td style="padding:4px 5px;width:30px;text-align:center">'
      +'<button onclick="_fcDeleteRow('+i+')" style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:14px;padding:0">✕</button></td></tr>';
  }).join('');

  cfg.style.display = 'block';
  cfg.innerHTML =
    '<div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08)">'
    +(isAr ? nameAr||nameEn : nameEn)+'</div>'
    /* Fields table */
    +'<div style="margin-bottom:16px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<div style="font-size:10.5px;font-weight:700;color:#64748b">'+(isAr?'الحقول / الأعمدة':'Fields / Columns')+'</div>'
    +'<button id="fcAddRow" style="padding:5px 12px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:7px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">+ '+(isAr?'إضافة حقل':'Add Field')+'</button></div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">'
    +'<thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)">'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Col</th>'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Name (EN)</th>'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Name (AR)</th>'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Type</th>'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Input</th>'
    +'<th style="padding:6px 8px;text-align:left;color:#64748b">Order</th>'
    +'<th></th>'
    +'</tr></thead>'
    +'<tbody id="fcFieldsBody">'+rowsHtml+'</tbody></table></div></div>'
    /* Formula editor */
    +'<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px;margin-bottom:16px">'
    +'<div style="font-size:10.5px;font-weight:700;color:#64748b;margin-bottom:10px">'+(isAr?'صيغة النتيجة (Result Formula)':'Result Formula')+'</div>'
    +'<div style="font-size:9.5px;color:#475569;margin-bottom:8px">'
    +letterMap.map(function(l,i){ var f=fields[i]; return '<b style="color:#0195af">'+l+'</b> = '+(f?(isAr&&f.nameAr?f.nameAr:f.nameEn)||'Field '+(i+1):'Field '+(i+1)); }).join(' &nbsp;·&nbsp; ')
    +'</div>'
    +'<input id="fcFormula" value="'+htmlEsc((displayCfg&&displayCfg.resultFormula)||mc.resultFormula||'')+'" placeholder="e.g.  A / B * 100  or  (B - C) / B * 100" '
    +'style="width:100%;padding:8px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(1,149,175,.25);border-radius:8px;color:#e2e8f0;font-size:12px;font-family:monospace;box-sizing:border-box">'
    +'<div id="fcFormulaFb" style="margin-top:5px;font-size:9.5px;color:#64748b">'+(isAr?'استخدم أحرف الأعمدة A,B,C,D … لكتابة الصيغة.':'Use column letters A, B, C, D… in formulas. Example: A / B * 100')+'</div>'
    +'</div>'
    /* Save */
    +'<div style="display:flex;gap:10px;align-items:center">'
    +'<button id="fcSaveBtn" style="padding:9px 22px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:11px;cursor:pointer">'+(isAr?'حفظ الإعداد':'Save Configuration')+'</button>'
    +'<div id="fcSaveFb" style="font-size:10px;font-weight:600;display:none"></div>'
    +'</div>';

  /* Wire up buttons */
  var _currentMasterId = masterKpiId;
  document.getElementById('fcAddRow').onclick = function(){ _fcAddRow(_currentMasterId, nameEn, nameAr); };
  document.getElementById('fcSaveBtn').onclick = function(){ _fcSave(_currentMasterId); };
  /* Formula validation on change */
  document.getElementById('fcFormula').oninput = function(){ _fcValidateFormula(this.value, fields.length); };
}

function _fcCollectFields(){
  var rows = document.querySelectorAll('#fcFieldsBody tr[data-fidx]');
  var fields = [];
  rows.forEach(function(row){
    fields.push({
      nameEn: (row.querySelector('.fc-name-en')||{value:''}).value.trim(),
      nameAr:  (row.querySelector('.fc-name-ar')||{value:''}).value.trim(),
      type:   (row.querySelector('.fc-type')||{value:'number'}).value,
      inputMode: (row.querySelector('.fc-input')||{value:'manual'}).value
    });
  });
  return fields;
}

function _fcAddRow(masterKpiId, nameEn, nameAr){
  if(!ST.masterKpis) ST.masterKpis = {};
  if(!ST.masterKpis[masterKpiId]) ST.masterKpis[masterKpiId] = {nameEn:nameEn,nameAr:nameAr,fieldConfig:[],resultFormula:''};
  _ensureMasterOverride(masterKpiId, _adminMergedMasterConfig(masterKpiId)||{nameEn:nameEn,nameAr:nameAr,fieldConfig:[],resultFormula:''}).fieldConfig.push({nameEn:'',nameAr:'',type:'number',inputMode:'manual'});
  _renderKpiFieldConfig(masterKpiId, nameEn, nameAr);
}
window._fcAddRow = _fcAddRow;

function _fcDeleteRow(idx){
  var sel = document.getElementById('kpiMgmtSelect');
  var mid  = sel ? sel.value : '';
  var opt  = sel ? sel.options[sel.selectedIndex] : null;
  var nEn = opt ? opt.getAttribute('data-name-en') : '';
  var nAr = opt ? opt.getAttribute('data-name-ar') : '';
  if(!mid) return;
  var ovDel=_ensureMasterOverride(mid, _adminMergedMasterConfig(mid));
  if(!ovDel || !Array.isArray(ovDel.fieldConfig)) return;
  ovDel.fieldConfig.splice(idx, 1);
  _renderKpiFieldConfig(mid, nEn, nAr);
}
window._fcDeleteRow = _fcDeleteRow;

function _fcMoveRow(idx, dir){
  var sel = document.getElementById('kpiMgmtSelect');
  var mid  = sel ? sel.value : '';
  var opt  = sel ? sel.options[sel.selectedIndex] : null;
  var nEn = opt ? opt.getAttribute('data-name-en') : '';
  var nAr = opt ? opt.getAttribute('data-name-ar') : '';
  if(!mid) return;
  var ovMove=_ensureMasterOverride(mid, _adminMergedMasterConfig(mid));
  if(!ovMove || !Array.isArray(ovMove.fieldConfig)) return;
  var arr = ovMove.fieldConfig;
  var newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
  _renderKpiFieldConfig(mid, nEn, nAr);
}
window._fcMoveRow = _fcMoveRow;

function _fcValidateFormula(formula, fieldCount){
  var fb = document.getElementById('fcFormulaFb'); if(!fb) return true;
  if(!formula.trim()){ fb.textContent = 'No formula — default calculation will be used.'; fb.style.color='#475569'; return true; }
  /* Check for valid column letters */
  var used = formula.match(/[A-Z]/g) || [];
  var invalid = used.filter(function(l){ return l.charCodeAt(0) - 65 >= fieldCount; });
  if(invalid.length){
    fb.textContent = '⚠ Column(s) ' + invalid.join(',') + ' exceed field count (' + fieldCount + ' fields = ' + String.fromCharCode(64+fieldCount) + ').';
    fb.style.color = '#DC2626'; return false;
  }
  /* Basic syntax test */
  try{
    var test = formula.replace(/[A-Z]/g,'1').replace(/avg\s*\(/g,'(').replace(/\)/g,'+0)');
    // eslint-disable-next-line no-new-func
    new Function('return ('+test+')');
    fb.textContent = '✓ Formula valid.'; fb.style.color = '#16A34A'; return true;
  }catch(e){
    fb.textContent = '⚠ Syntax error: ' + e.message; fb.style.color = '#DC2626'; return false;
  }
}

function _fcSave(masterKpiId){
  if(!masterKpiId) return;
  _ensureMasterOverride(masterKpiId, _adminMergedMasterConfig(masterKpiId));
  var fields  = _fcCollectFields();
  var formula = (document.getElementById('fcFormula')||{value:''}).value.trim();
  var fb = document.getElementById('fcSaveFb');
  if(!_fcValidateFormula(formula, fields.length)){
    if(fb){fb.textContent='⚠ Fix formula before saving.';fb.style.color='#DC2626';fb.style.display='block';}
    return;
  }
  ST.masterKpis[masterKpiId].fieldConfig  = fields;
  ST.masterKpis[masterKpiId].resultFormula = formula;
  if(fb){fb.textContent='Saving…';fb.style.color='#64748b';fb.style.display='block';}
  persistST('KPI_FIELD_CONFIG:'+masterKpiId).then(function(){
    if(fb){fb.textContent='✓ Saved for all users.';fb.style.color='#16A34A';fb.style.display='block';}
    setTimeout(function(){if(fb)fb.style.display='none';}, 3000);
  }).catch(function(e){
    if(fb){fb.textContent='⚠ '+e.message;fb.style.color='#DC2626';fb.style.display='block';}
  });
}
window._fcSave = _fcSave;

/* ══════════════════════════════════════════════════════════════
   Update _saHubAction to route to new panels
   ══════════════════════════════════════════════════════════════ */


/* Inject a Text Editor tab into the admin panel for SA */
function _ensureSaTextEditorTab(){
  if(document.getElementById('ap-textedit')) return; /* already injected */

  /* Tab button */
  const tabs=document.getElementById('adminTabs');
  if(!tabs) return;
  const btn=document.createElement('button');
  btn.className='atb';
  btn.textContent= typeof lang!=='undefined'&&lang==='ar'?'محرر النصوص':'Text Editor';
  btn.onclick=function(){ swAt('ap-textedit',this); };
  tabs.appendChild(btn);

  /* Tab content panel */
  const mbody=document.querySelector('#adminOv .mbody');
  if(!mbody) return;
  const panel=document.createElement('div');
  panel.id='ap-textedit';
  panel.className='ap';
  panel.style.display='none';
  panel.innerHTML=_buildTextEditorUI();
  mbody.appendChild(panel);
}

/* Build the SA text editor panel HTML */
function _buildTextEditorUI(){
  if(typeof window.TR==='undefined') return '<p style="padding:16px;color:#888">Translation system not loaded.</p>';
  const isAr=(typeof lang!=='undefined'&&lang==='ar');
  const rows=Object.keys(window.TR).map(function(key){
    const both=(typeof tBoth==='function')?tBoth(key):{en:window.TR[key].en,ar:window.TR[key].ar};
    return '<tr data-tekey="'+htmlEsc(key)+'">'
      +'<td style="padding:4px 8px;font-size:10px;color:#888;white-space:nowrap">'+htmlEsc(key)+'</td>'
      +'<td style="padding:4px"><input class="te-en" style="width:100%;padding:4px 6px;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:rgba(255,255,255,.05);color:#fff;font-size:11px" value="'+htmlEsc(both.en||'')+'"></td>'
      +'<td style="padding:4px"><input class="te-ar" style="width:100%;padding:4px 6px;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:rgba(255,255,255,.05);color:#fff;font-size:11px;direction:rtl" value="'+htmlEsc(both.ar||'')+'"></td>'
      +'</tr>';
  }).join('');
  return '<div style="padding:12px">'
    +'<h3 style="font-size:12px;font-weight:700;color:#0195af;margin:0 0 8px">'+( isAr?'محرر نصوص الواجهة':'Dashboard Text Editor (Super Admin Only)')+'</h3>'
    +'<p style="font-size:10px;color:#999;margin:0 0 10px">'+( isAr?'عدّل النص وانقر حفظ — يُطبَّق على جميع المستخدمين':'Edit labels then click Save — changes apply to all users immediately.')+'</p>'
    +'<div style="max-height:380px;overflow-y:auto">'
    +'<table style="width:100%;border-collapse:collapse">'
    +'<thead><tr>'
    +'<th style="padding:4px 8px;font-size:10px;text-align:left;color:#888">Key</th>'
    +'<th style="padding:4px 8px;font-size:10px;text-align:left;color:#888">English</th>'
    +'<th style="padding:4px 8px;font-size:10px;text-align:left;color:#888">Arabic</th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table></div>'
    +'<div id="teEditFeedback" style="margin:8px 0;min-height:20px"></div>'
    +'<button onclick="_saveTextEdits()" style="padding:8px 20px;background:#0195af;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:11px">'
    +(isAr?'حفظ التعديلات':'Save Text Changes')+'</button>'
    +'</div>';
}
window._buildTextEditorUI = _buildTextEditorUI;

/* Save text editor changes to ST.textEdits → Firestore */
function _saveTextEdits(){
  const panel=document.getElementById('ap-textedit');
  if(!panel) return;
  if(!ST.textEdits) ST.textEdits={};
  let changed=0;
  panel.querySelectorAll('tr[data-tekey]').forEach(function(row){
    const key=row.getAttribute('data-tekey');
    const en=row.querySelector('.te-en');
    const ar=row.querySelector('.te-ar');
    if(!key||!en||!ar) return;
    const enVal=en.value.trim();
    const arVal=ar.value.trim();
    const oldObj=ST.textEdits[key]||{};
    const next=Object.assign({}, oldObj);
    if(enVal) next.en=enVal;
    if(arVal) next.ar=arVal;
    if(enVal || arVal){
      const old=JSON.stringify(oldObj);
      ST.textEdits[key]=next;
      if(JSON.stringify(ST.textEdits[key])!==old) changed++;
    }
  });
  if(!changed){ _teFeedback('No changes detected.', false); return; }
  if(typeof window._applyDashboardTextEditsSoon==='function') window._applyDashboardTextEditsSoon();
  /* Save to localStorage + Firestore via unified helper */
  persistST('TEXT_EDIT').then(function(){
    if(typeof window._applyDashboardTextEditsSoon==='function') window._applyDashboardTextEditsSoon();
    _teFeedback('Saved! Changes visible for all users.', true);
  }).catch(function(e){
    _teFeedback('Save failed: '+e.message, false);
  });
  addAudit('TEXT_EDIT','Updated '+changed+' text label(s)');
}
window._saveTextEdits = _saveTextEdits;

function _teFeedback(msg,ok){
  const el=document.getElementById('teEditFeedback');
  if(!el) return;
  el.textContent=msg;
  el.style.color=ok?'#16A34A':'#D97706';
  el.style.fontSize='10px';
  el.style.fontWeight='600';
}


/* ── Quarterly Table Fns appended ── */
/* ═══════════════════════════════════════════════════════════════
   DYNAMIC QUARTERLY TABLE — changes based on KPI name / Master KPI
   ═══════════════════════════════════════════════════════════════ */


function _formulaReferenceHtml(cfg, masterId, mode, editable){
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var fields=(cfg&&cfg.fieldConfig)||[];
  var letters=fields.map(function(_,i){return String.fromCharCode(65+i);});
  if(!fields.length) return '';
  if(editable){
    return '<div class="formula-ref-grid" data-master="'+htmlEsc(masterId||'')+'">'
      +fields.map(function(f,i){
        var val=isAr?(f.nameAr||f.nameEn||''):(f.nameEn||f.nameAr||'');
        return '<label class="formula-ref-row" style="display:flex;align-items:center;gap:6px;margin:4px 0;font-size:9.5px;color:#64748B">'
          +'<b style="color:#0195af;width:16px;font-family:var(--mono)">'+letters[i]+'</b>'
          +'<span>=</span>'
          +'<input class="formula-ref-input" data-idx="'+i+'" value="'+htmlEsc(val)+'" '+(isAr?'dir="rtl"':'')+' style="flex:1;min-width:120px;padding:4px 7px;background:#fff;border:1px solid rgba(1,149,175,.25);border-radius:6px;color:#152538;font-size:10px;font-family:inherit">'
          +'</label>';
      }).join('')
      +'<button type="button" onclick="_saveFormulaReference(\''+mode+'\')" style="margin-top:6px;padding:5px 10px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.3);border-radius:6px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">'+(isAr?'حفظ المراجع':'Save reference')+'</button>'
      +'<div id="_'+mode+'FormulaRefFb" style="font-size:10px;color:#16A34A;margin-top:4px;display:none"></div>'
      +'</div>';
  }
  return fields.map(function(f,i){
    var label=isAr?(f.nameAr||f.nameEn||''):(f.nameEn||f.nameAr||'');
    return '<span style="font-size:9.5px;color:#64748B;margin-right:12px"><b style="color:#0195af">'+letters[i]+'</b> = '+htmlEsc(label)+'</span>';
  }).join('');
}
window._formulaReferenceHtml=_formulaReferenceHtml;

function _saveFormulaReference(mode){
  var section=document.getElementById(mode==='edit'?'editQtrSection':'addQtrSection');
  var fb=document.getElementById('_'+mode+'FormulaRefFb');
  var masterId=section?section.getAttribute('data-master'):'';
  if(!masterId){ if(fb){fb.textContent='No KPI formula reference found.';fb.style.color='#DC2626';fb.style.display='block';} return; }
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var kpiId=(mode==='edit')?_adminGetEditKpiId(section):'';
  var kpiNameEn=(mode==='edit')?_adminGetEditKpiNameEn(section):'';
  var cfg=(mode==='edit')
    ? ((typeof _adminMergeKpiSpecificConfig==='function')?_adminMergeKpiSpecificConfig(masterId,kpiId,kpiNameEn):_adminMergedMasterConfig(masterId))
    : ((typeof _adminMergedMasterConfig==='function')?_adminMergedMasterConfig(masterId):null);
  var ov=(mode==='edit')
    ? _adminEnsureKpiFormulaOverride(kpiId,kpiNameEn,masterId,cfg||{})
    : _ensureMasterOverride(masterId,cfg||{});
  if(!ov){ if(fb){fb.textContent='No KPI-specific formula config found.';fb.style.color='#DC2626';fb.style.display='block';} return; }
  ov.kpiNameEn = (mode==='edit') ? (kpiNameEn || ov.kpiNameEn || '') : ov.kpiNameEn;
  if(mode==='edit') ov.kpiNameAr = _adminGetEditKpiNameAr(section) || ov.kpiNameAr || '';
  if(!ov.fieldConfig) ov.fieldConfig=[];
  Array.prototype.forEach.call(section.querySelectorAll('.formula-ref-input'),function(inp){
    var idx=parseInt(inp.getAttribute('data-idx'),10);
    if(isNaN(idx)) return;
    if(!ov.fieldConfig[idx]) ov.fieldConfig[idx]=Object.assign({}, (cfg&&cfg.fieldConfig&&cfg.fieldConfig[idx])||{});
    if(isAr) ov.fieldConfig[idx].nameAr=inp.value.trim();
    else ov.fieldConfig[idx].nameEn=inp.value.trim();
  });
  var saveTag=(mode==='edit') ? ('FORMULA_REFERENCE_EDIT_KPI:'+kpiId+':'+masterId+':'+(isAr?'ar':'en')) : ('FORMULA_REFERENCE_EDIT:'+masterId+':'+(isAr?'ar':'en'));
  persistST(saveTag).then(function(){
    if(fb){fb.textContent=isAr?'✓ تم حفظ مراجع الصيغة':'✓ Formula reference saved';fb.style.color='#16A34A';fb.style.display='block';}
    if(mode==='edit'){
      var nm=section.getAttribute('data-kpi-name-en')||'';
      setTimeout(function(){_updateEditQtrTable(nm,kpiId,_adminGetEditKpiNameAr(section));},150);
    }else{
      setTimeout(function(){_updateAddQtrTable();},150);
    }
  }).catch(function(e){ if(fb){fb.textContent='⚠ '+e.message;fb.style.color='#DC2626';fb.style.display='block';} });
}
window._saveFormulaReference=_saveFormulaReference;

/* Build the quarterly table HTML for a given master config (or default) */
function _buildQtrTableHTML(masterConfig, prefix){
  var fields = masterConfig ? (masterConfig.fieldConfig || []) : null;
  var formula = masterConfig ? (masterConfig.resultFormula || '') : '';
  var hasCustom = fields && fields.length > 0;
  var letters = hasCustom ? fields.map(function(_,i){return String.fromCharCode(65+i);}) : [];

  /* Default pci columns */
  if(!hasCustom){
    var thead = '<thead><tr>'
      +'<th style="width:42px;text-align:left;padding-left:12px">QTR</th>'
      +'<th style="color:#93C5FD"> Planned</th>'
      +'<th style="color:#6EE7B7"> Complete</th>'
      +'<th style="color:#FCA5A5"> Incomplete</th>'
      +'<th style="color:#67E8F9;width:100px">Result</th>'
      +'</tr></thead>';
    var tbody = '<tbody>';
    ['Q1','Q2','Q3','Q4'].forEach(function(Q){
      tbody += '<tr>'
        +'<td>'+Q+'</td>'
        +'<td><input class="pci-pl" id="'+prefix+Q+'_pl" min="0" type="text" inputmode="decimal" autocomplete="off" placeholder="0" oninput="calcAdminPCI(\''+Q.toLowerCase()+'\',\''+prefix+'\')"></td>'
        +'<td><input class="pci-co" id="'+prefix+Q+'_co" min="0" type="text" inputmode="decimal" autocomplete="off" placeholder="0" oninput="calcAdminPCI(\''+Q.toLowerCase()+'\',\''+prefix+'\')"></td>'
        +'<td><input class="pci-ic" id="'+prefix+Q+'_ic" min="0" type="text" inputmode="decimal" autocomplete="off" placeholder="—" readonly style="background:rgba(196,43,43,.05);color:#C42B2B;font-weight:700;cursor:default" title="Planned − Complete"></td>'
        +'<td><span class="pci-calc" id="'+prefix+Q+'_res">—</span></td>'
        +'</tr>';
    });
    tbody += '</tbody>';
    return thead + tbody;
  }

  /* Custom field columns */
  var formulaEscaped = formula.replace(/"/g,'&quot;').replace(/'/g,"\\'");
  var lettersJSON = JSON.stringify(letters);
  var thead2 = '<thead><tr>'
    +'<th style="width:42px;text-align:left;padding-left:12px">QTR</th>';
  fields.forEach(function(f, i){
    var letter = letters[i];
    var nameDisplay = (typeof lang!=='undefined'&&lang==='ar') ? (f.nameAr||htmlEsc(f.nameEn)) : htmlEsc(f.nameEn);
    thead2 += '<th style="padding:6px 8px;line-height:1.4;word-break:break-word;white-space:normal;min-width:80px;max-width:150px;vertical-align:top">'
      + '<div style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:rgba(1,149,175,.25);border-radius:4px;font-size:10px;font-weight:900;color:#0195af;margin-bottom:3px;font-family:var(--mono)">' + letter + '</div>'
      + '<div style="font-size:9px;font-weight:600;color:#93C5FD;margin-top:2px">' + nameDisplay + '</div>'
      + '</th>';
  });
    var _fl = (lang==='ar') ? 'النتيجة' : 'Result';
  thead2 += '<th style="color:#67E8F9;width:90px;min-width:70px;vertical-align:top">'
    + '<div style="font-size:10px;font-weight:700">' + _fl + '</div>'
    + (formula ? '<div style="font-size:8px;color:rgba(103,232,249,.6);font-family:var(--mono);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:88px" title="' + htmlEsc(formula) + '">' + htmlEsc(formula) + '</div>' : '')
    + '</th></tr></thead>';

  var tbody2 = '<tbody>';
  ['Q1','Q2','Q3','Q4'].forEach(function(Q){
    tbody2 += '<tr><td style="font-weight:700;font-size:10px">'+Q+'</td>';
    letters.forEach(function(letter){
      tbody2 += '<td><input class="pci-pl custom-field-input" id="'+prefix+Q+'_'+letter+'"'
        +' type="text" inputmode="decimal" autocomplete="off" placeholder="0"'
        +' data-q="'+Q.toLowerCase()+'" data-prefix="'+prefix+'" data-formula="'+formulaEscaped+'" data-letters="'+letters.join(',')+'" oninput="_onCustomFieldInput(this)">'
        +'</td>';
    });
    tbody2 += '<td><span class="pci-calc" id="'+prefix+Q+'_res" style="min-width:60px;display:inline-block">—</span></td>'
      +'</tr>';
  });
  tbody2 += '</tbody>';
  return thead2 + tbody2;
}

/* Recalculate result when a custom field input changes */
function _calcCustomResult(q, prefix, formula, letters){
  var Q = q.toUpperCase();
  var vals = {};
  var valid = true;
  letters.forEach(function(letter){
    var el = document.getElementById(prefix+Q+'_'+letter);
    if(!el || el.value.trim() === ''){ valid = false; return; }
    var v = _adminParseNumber(el.value);
    if(v===null||isNaN(v)){ valid = false; return; }
    vals[letter] = v;
  });
  var resEl = document.getElementById(prefix+Q+'_res');
  if(!resEl) return;
  if(!valid || !Object.keys(vals).length){ resEl.textContent = '—'; return; }
  var result = (typeof window._evalFormula === 'function') ? window._evalFormula(formula, vals) : null;
  if(result === null){ resEl.textContent = '⚠ err'; resEl.style.color = '#F87171'; }
  else { resEl.textContent = Math.round(result*10)/10 + '%'; resEl.style.color = result >= 0 ? '#67E8F9' : '#F87171'; }
}
window._calcCustomResult = _calcCustomResult;

/* Handler for custom field inputs — reads config from data attributes to avoid
   the JSON double-quote attribute breakage when using inline oninput.          */
function _onCustomFieldInput(el){
  var q       = el.getAttribute('data-q')       || '';
  var prefix  = el.getAttribute('data-prefix')  || '';
  var formula = el.getAttribute('data-formula') || '';
  var letters = (el.getAttribute('data-letters')||'').split(',').filter(Boolean);
  if(q && prefix && formula && letters.length > 0){
    _calcCustomResult(q, prefix, formula, letters);
  }
}
window._onCustomFieldInput = _onCustomFieldInput;

/* Rebuild the Add KPI quarterly table based on current name selection */
function _updateAddQtrTable(){
  var nameEnEl = document.getElementById('aNE');
  var nameEn = nameEnEl ? nameEnEl.value.trim() : '';
  var master = (typeof _findMasterKpiByName === 'function') ? _findMasterKpiByName(nameEn) : null;
  var cfg = master ? master.config : null;
  var table = document.getElementById('addQtrTable');
  if(!table) return;
  /* Store current master id on section for save to read */
  var section = document.getElementById('addQtrSection');
  if(section) section.setAttribute('data-master', master ? master.id : '');
  table.innerHTML = _buildQtrTableHTML(cfg, 'aAd');
  /* Update section label */
  var lbl = section ? section.querySelector('.af-sec-lbl') : null;
  if(lbl){
    lbl.textContent = cfg ? ' Quarterly Values — Custom Fields' : ' Quarterly Values';
    lbl.style.color = cfg ? '#0195af' : '';
  }
  /* ── Formula Editor: show below table when master config exists ── */
  var existingFed = document.getElementById('_formulaEditorBox');
  if(existingFed) existingFed.remove();
  if(cfg && cfg.fieldConfig && cfg.fieldConfig.length > 0 && section){
    var letters = cfg.fieldConfig.map(function(_,i){return String.fromCharCode(65+i);});
    var isSa = (typeof window._fbRole!=='undefined'&&window._fbRole==='super_admin');
    var fedDiv = document.createElement('div');
    fedDiv.id = '_formulaEditorBox';
    fedDiv.style.cssText = 'margin-top:10px;padding:12px 14px;background:rgba(1,149,175,.06);border:1px solid rgba(1,149,175,.2);border-radius:10px;';
    var mapHtml = (typeof _formulaReferenceHtml==='function') ? _formulaReferenceHtml(cfg, master ? master.id : '', 'add', isSa) : cfg.fieldConfig.map(function(f,i){
      return '<span style="font-size:9.5px;color:#64748B;margin-right:12px"><b style="color:#0195af">'+letters[i]+'</b> = '+htmlEsc(f.nameEn)+'</span>';
    }).join('');
    var currentFormula = cfg.resultFormula || '';
    fedDiv.innerHTML =
      '<div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Formula Reference</div>'
      +'<div style="margin-bottom:8px;flex-wrap:wrap">'+mapHtml+'</div>'
      +'<div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:4px">Result Formula</div>'
      +(isSa
        ? '<div style="display:flex;gap:6px;align-items:center">'
          +'<input id="_formulaInput" value="'+htmlEsc(currentFormula)+'" style="flex:1;padding:5px 8px;background:#fff;border:1px solid rgba(1,149,175,.35);border-radius:6px;font-size:11px;font-family:monospace;color:#152538" placeholder="e.g. (A+B)/2">'
          +'<button onclick="_saveCustomFormula()" style="padding:5px 12px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.3);border-radius:6px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">Save</button>'
          +'</div>'
          +'<div id="_formulaSaveFb" style="font-size:10px;color:#16A34A;margin-top:4px;display:none"></div>'
        : '<div style="font-family:monospace;font-size:11px;color:#0195af;padding:4px 8px;background:rgba(1,149,175,.08);border-radius:6px;border:1px solid rgba(1,149,175,.18)">'+htmlEsc(currentFormula)+'</div>'
      );
    section.appendChild(fedDiv);
  }
}
window._updateAddQtrTable = _updateAddQtrTable;

/* Save custom formula from the inline formula editor */
function _saveCustomFormula(){
  var inp = document.getElementById('_formulaInput');
  var fb  = document.getElementById('_formulaSaveFb');
  var section = document.getElementById('addQtrSection');
  var masterId = section ? section.getAttribute('data-master') : '';
  if(!inp || !masterId){ if(fb){fb.textContent='No formula config to save.';fb.style.display='block';} return; }
  var newFormula = inp.value.trim();
  /* Basic validation */
  try{
    var testVals = {A:80,B:90,C:85,D:75};
    var testExpr = newFormula.replace(/\b([A-Z])\b/g,function(m,l){return testVals[l]!==undefined?testVals[l]:'0';});
    var result = new Function('return ('+testExpr+')')();
    if(isNaN(result)||!isFinite(result)) throw new Error('Formula returns invalid number');
  }catch(e){
    if(fb){fb.textContent='⚠ Invalid formula: '+e.message;fb.style.color='#DC2626';fb.style.display='block';} return;
  }
  /* Save to ST.masterKpis (overrides BUILTIN for this key) */
  if(!ST.masterKpis) ST.masterKpis = {};
  if(!ST.masterKpis[masterId]) ST.masterKpis[masterId] = {};
  ST.masterKpis[masterId].resultFormula = newFormula;
  /* Do NOT mutate BUILTIN_MASTER_KPIS — ST.masterKpis is the override layer */
  persistST('FORMULA_EDIT:'+masterId).then(function(){
    if(fb){fb.textContent='✓ Formula saved';fb.style.color='#16A34A';fb.style.display='block';}
    /* Refresh the quarterly table with new formula */
    _updateAddQtrTable();
  });
}
window._saveCustomFormula = _saveCustomFormula;

/* Rebuild the Edit KPI quarterly table when KPI is loaded in edit panel */
function _updateEditQtrTable(kpiNameEn,kpiId,kpiNameAr){
  if(!kpiId){ var _sel=document.getElementById('eSel'); if(_sel) kpiId=_sel.value||''; }
  var master = (typeof _findMasterKpiByName === 'function') ? _findMasterKpiByName(kpiNameEn||'') : null;
  var cfg = master ? ((typeof _adminMergeKpiSpecificConfig==='function') ? _adminMergeKpiSpecificConfig(master.id,kpiId,kpiNameEn) : master.config) : null;
  var table = document.getElementById('editQtrTable');
  if(!table) return;
  var section = document.getElementById('editQtrSection');
  if(section){ section.setAttribute('data-master', master ? master.id : ''); section.setAttribute('data-kpi-name-en', kpiNameEn||''); section.setAttribute('data-kpi-name-ar', kpiNameAr||_adminGetEditKpiNameAr(section)||''); section.setAttribute('data-kpi-id', _adminNormKpiCode(kpiId||'')); }
  table.innerHTML = _buildQtrTableHTML(cfg, 'eAd');
  var lbl = section ? section.querySelector('.af-sec-lbl') : null;
  if(lbl){
    lbl.textContent = cfg ? ' Quarterly Results — Custom Fields' : ' Quarterly Results';
    lbl.style.color = cfg ? '#0195af' : '';
  }
  /* ── Formula Editor for Edit KPI (same as Add KPI) ── */
  var _efed=document.getElementById('_editFormulaEditorBox');
  if(_efed) _efed.remove();
  if(cfg && cfg.fieldConfig && cfg.fieldConfig.length > 0 && section){
    var _eLetters=cfg.fieldConfig.map(function(_,i){return String.fromCharCode(65+i);});
    var _eiSa=(typeof window._fbRole!=='undefined'&&window._fbRole==='super_admin');
    var _eFed=document.createElement('div');
    _eFed.id='_editFormulaEditorBox';
    _eFed.style.cssText='margin-top:10px;padding:12px 14px;background:rgba(1,149,175,.06);border:1px solid rgba(1,149,175,.2);border-radius:10px;';
    var _eMapHtml=(typeof _formulaReferenceHtml==='function') ? _formulaReferenceHtml(cfg, master ? master.id : '', 'edit', _eiSa) : cfg.fieldConfig.map(function(f,i){
      return '<span style="font-size:9.5px;color:#64748B;margin-right:12px"><b style="color:#0195af">'+_eLetters[i]+'</b> = '+(f.nameEn||f.label||'Field '+_eLetters[i])+'</span>';
    }).join('');
    var _eCurFormula=cfg.resultFormula||'';
    _eFed.innerHTML=
      '<div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Formula Reference</div>'
      +'<div style="margin-bottom:8px">'+_eMapHtml+'</div>'
      +'<div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:4px">Result Formula</div>'
      +(_eiSa
        ?'<div style="display:flex;gap:6px;align-items:center">'
          +'<input id="_editFormulaInput" value="'+(_eCurFormula.replace(/"/g,'&quot;'))+'" style="flex:1;padding:5px 8px;background:#fff;border:1px solid rgba(1,149,175,.35);border-radius:6px;font-size:11px;font-family:monospace;color:#152538">'
          +'<button onclick="_saveEditFormula()" style="padding:5px 12px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.3);border-radius:6px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">Save</button>'
          +'</div><div id="_editFormulaSaveFb" style="font-size:10px;color:#16A34A;margin-top:4px;display:none"></div>'
        :'<div style="font-family:monospace;font-size:11px;color:#0195af;padding:4px 8px;background:rgba(1,149,175,.08);border-radius:6px">'+(_eCurFormula||'—')+'</div>'
      );
    section.appendChild(_eFed);
  }
}

function _saveEditFormula(){
  var inp=document.getElementById('_editFormulaInput');
  var fb=document.getElementById('_editFormulaSaveFb');
  var section=document.getElementById('editQtrSection');
  var masterId=section?section.getAttribute('data-master'):'';
  if(!inp||!masterId){if(fb){fb.textContent='No formula config.';fb.style.display='block';}return;}
  var newF=inp.value.trim();
  try{var tv={A:80,B:90,C:85,D:75};var te=newF.replace(/\b([A-Z])\b/g,function(m,l){return tv[l]!==undefined?tv[l]:'0';});var tr2=new Function('return ('+te+')')();if(isNaN(tr2)||!isFinite(tr2))throw new Error('invalid');}
  catch(e){if(fb){fb.textContent='⚠ Invalid: '+e.message;fb.style.color='#DC2626';fb.style.display='block';}return;}
  var kpiId=_adminGetEditKpiId(section);
  var kpiNameEn=_adminGetEditKpiNameEn(section);
  var baseCfg=(typeof _adminMergeKpiSpecificConfig==='function')?_adminMergeKpiSpecificConfig(masterId,kpiId,kpiNameEn):_adminMergedMasterConfig(masterId);
  var ov=_adminEnsureKpiFormulaOverride(kpiId,kpiNameEn,masterId,baseCfg||{});
  if(!ov){if(fb){fb.textContent='No KPI-specific formula config.';fb.style.color='#DC2626';fb.style.display='block';}return;}
  ov.resultFormula=newF;
  ov.kpiNameAr=_adminGetEditKpiNameAr(section)||ov.kpiNameAr||'';
  persistST('FORMULA_EDIT_KPI:'+kpiId+':'+masterId).then(function(){
    if(fb){fb.textContent='✓ Formula saved for this KPI code + name';fb.style.color='#16A34A';fb.style.display='block';}
    var nm=(section&&section.getAttribute('data-kpi-name-en'))||kpiNameEn||'';
    _updateEditQtrTable(nm,kpiId,_adminGetEditKpiNameAr(section));
  });
}
window._saveEditFormula=_saveEditFormula;

window._updateEditQtrTable = _updateEditQtrTable;

/* Read quarterly values from Add form (custom or standard) */
function _readQtrValuesFromForm(kpiId, prefix, sectionId){
  var section = document.getElementById(sectionId || 'addQtrSection');
  var masterId = section ? section.getAttribute('data-master') : '';
  var cfg = masterId ? ((sectionId==='editQtrSection' && typeof _adminMergeKpiSpecificConfig==='function') ? _adminMergeKpiSpecificConfig(masterId,kpiId,_adminGetEditKpiNameEn(section)) : ((typeof _adminMergedMasterConfig==='function') ? _adminMergedMasterConfig(masterId) : Object.assign({}, ((window.BUILTIN_MASTER_KPIS||{})[masterId]||{}), (((typeof ST!=='undefined'&&ST.masterKpis)||{})[masterId]||{})))) : null;
  var pciData = {};

  if(cfg && cfg.fieldConfig && cfg.fieldConfig.length > 0){
    var letters = cfg.fieldConfig.map(function(_,i){return String.fromCharCode(65+i);});
    ['Q1','Q2','Q3','Q4'].forEach(function(Q){
      var ql = Q.toLowerCase();
      var vals = {};
      letters.forEach(function(letter){
        var el = document.getElementById(prefix+Q+'_'+letter);
        vals[letter] = el ? (_adminParseNumber(el.value)||0) : 0;
      });
      var result = (typeof _evalFormula==='function') ? _evalFormula(cfg.resultFormula||'', vals) : null;
      pciData[ql] = Object.assign({_custom:true, _masterId:masterId, _formula:cfg.resultFormula}, vals);
      pciData[ql]._result = result;
    });
  } else {
    ['Q1','Q2','Q3','Q4'].forEach(function(Q){
      var ql = Q.toLowerCase();
      var pl = _adminParseNumber((document.getElementById(prefix+Q+'_pl')||{}).value)||0;
      var co = _adminParseNumber((document.getElementById(prefix+Q+'_co')||{}).value)||0;
      var ic = Math.max(0, pl-co);
      pciData[ql] = { planned:pl, complete:co, incomplete:ic };
    });
  }
  return { pciData:pciData, masterId:masterId, cfg:cfg };
}
window._readQtrValuesFromForm = _readQtrValuesFromForm;

/* Fill quarterly form from existing pci data (for Edit KPI) */
function _fillQtrFormFromPci(kpiId, prefix, sectionId){
  var pciData = (ST.pci||{})[kpiId] || {};
  var section = document.getElementById(sectionId || 'editQtrSection');
  var masterId = section ? section.getAttribute('data-master') : '';
  var cfg = masterId ? ((sectionId==='editQtrSection' && typeof _adminMergeKpiSpecificConfig==='function') ? _adminMergeKpiSpecificConfig(masterId,kpiId,_adminGetEditKpiNameEn(section)) : ((typeof _adminMergedMasterConfig==='function') ? _adminMergedMasterConfig(masterId) : Object.assign({}, ((window.BUILTIN_MASTER_KPIS||{})[masterId]||{}), (((typeof ST!=='undefined'&&ST.masterKpis)||{})[masterId]||{})))) : null;

  ['Q1','Q2','Q3','Q4'].forEach(function(Q){
    var ql = Q.toLowerCase();
    var qd = pciData[ql] || {};
    if(cfg && cfg.fieldConfig && cfg.fieldConfig.length > 0){
      var letters = cfg.fieldConfig.map(function(_,i){return String.fromCharCode(65+i);});
      letters.forEach(function(letter){
        var el = document.getElementById(prefix+Q+'_'+letter);
        if(el) el.value = qd[letter] || '';
      });
      /* Recompute result display */
      var vals = {};
      letters.forEach(function(letter){ vals[letter] = _adminParseNumber(qd[letter])||0; });
      var resEl = document.getElementById(prefix+Q+'_res');
      if(resEl){
        var result = (typeof _evalFormula==='function') ? _evalFormula(cfg.resultFormula||'', vals) : null;
        resEl.textContent = result !== null ? Math.round(result*10)/10+'%' : '—';
      }
    } else {
      var plEl = document.getElementById(prefix+Q+'_pl');
      var coEl = document.getElementById(prefix+Q+'_co');
      var icEl = document.getElementById(prefix+Q+'_ic');
      if(plEl) plEl.value = (qd.planned!=null&&qd.planned!==undefined) ? qd.planned : '';
      if(coEl) coEl.value = (qd.complete!=null&&qd.complete!==undefined) ? qd.complete : '';
      /* FIX: also fill Incomplete — was previously missing */
      if(icEl) icEl.value = (qd.incomplete!=null&&qd.incomplete!==undefined) ? qd.incomplete : '';
      /* Recalculate displayed result for this quarter */
      if(qd.planned) calcAdminPCI(Q.toLowerCase(), prefix);
    }
  });
}
window._fillQtrFormFromPci = _fillQtrFormFromPci;

/* ==========================================================
   FINAL QUMC FIX — quarterly form read should ignore blank quarters
   Prevents Reset from jumping to Q4 when Q4 fields were never entered.
   ========================================================== */
(function(){
  function _hasText(id){var el=document.getElementById(id);return !!(el&&String(el.value||'').trim()!=='');}
  function _pf(id){var el=document.getElementById(id); if(!el||String(el.value||'').trim()==='') return null; var n=(typeof _adminParseNumber==='function')?_adminParseNumber(el.value):parseFloat(el.value); return (n!==null&&isFinite(n))?n:null;}
  window._readQtrValuesFromForm=_readQtrValuesFromForm=function(kpiId,prefix,sectionId){
    var section=document.getElementById(sectionId||'addQtrSection');
    var masterId=section?section.getAttribute('data-master'):'';
    var cfg=masterId?(((sectionId==='editQtrSection')&&typeof _adminMergeKpiSpecificConfig==='function')?_adminMergeKpiSpecificConfig(masterId,kpiId,_adminGetEditKpiNameEn(section)):((typeof _adminMergedMasterConfig==='function')?_adminMergedMasterConfig(masterId):Object.assign({},((window.BUILTIN_MASTER_KPIS||{})[masterId]||{}),(((typeof ST!=='undefined'&&ST.masterKpis)||{})[masterId]||{})))):null;
    var pciData={};
    if(cfg&&cfg.fieldConfig&&cfg.fieldConfig.length>0){
      var letters=cfg.fieldConfig.map(function(_,i){return String.fromCharCode(65+i);});
      ['Q1','Q2','Q3','Q4'].forEach(function(Q){
        var ql=Q.toLowerCase(), vals={}, any=false;
        letters.forEach(function(letter){ var id=prefix+Q+'_'+letter; var v=_pf(id); if(v!==null) any=true; vals[letter]=v===null?null:v; });
        if(!any){ pciData[ql]={_custom:true,_masterId:masterId,_formula:cfg.resultFormula,_result:null}; return; }
        var evalVals={}; letters.forEach(function(letter){evalVals[letter]=vals[letter]===null?0:vals[letter];});
        var result=(typeof _evalFormula==='function')?_evalFormula(cfg.resultFormula||'',evalVals):null;
        pciData[ql]=Object.assign({_custom:true,_masterId:masterId,_formula:cfg.resultFormula},vals);
        pciData[ql]._result=(result===null||result===undefined||!isFinite(result))?null:result;
      });
    }else{
      ['Q1','Q2','Q3','Q4'].forEach(function(Q){
        var ql=Q.toLowerCase();
        var has=_hasText(prefix+Q+'_pl')||_hasText(prefix+Q+'_co')||_hasText(prefix+Q+'_ic');
        if(!has){ pciData[ql]={planned:null,complete:null,incomplete:null}; return; }
        var pl=_pf(prefix+Q+'_pl'), co=_pf(prefix+Q+'_co');
        var ic=(pl!==null&&co!==null)?Math.max(0,pl-co):_pf(prefix+Q+'_ic');
        pciData[ql]={planned:pl,complete:co,incomplete:ic};
      });
    }
    return {pciData:pciData,masterId:masterId,cfg:cfg};
  };
})();
