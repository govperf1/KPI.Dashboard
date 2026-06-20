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
  const pl=parseFloat(plRaw)||0;
  const co=parseFloat(coRaw);

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
  const tgt=tgtEl?parseFloat(tgtEl.value)||0:0;
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
  if(fb){fb.textContent='✓ Gap Analysis saved';fb.style.color='#16A34A';fb.style.display='block';}
  toast(' Gap Analysis saved');
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
    inp.value='';inp.readOnly=false;inp.style.background='#fff';inp.placeholder=langKey==='en'?'Type a new English KPI name…':'اكتب اسم مؤشر عربي جديد…';inp.focus();
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
  /* Load PCI detailed data if available */
  ['Q1','Q2','Q3','Q4'].forEach(Q=>{
    const pciData=((ST.pci||{})[id]||{})[Q.toLowerCase()]||{};
    const plEl=document.getElementById('eAd'+Q+'_pl');if(plEl)plEl.value=pciData.planned||'';
    const coEl=document.getElementById('eAd'+Q+'_co');if(coEl)coEl.value=pciData.complete||'';
    const icEl=document.getElementById('eAd'+Q+'_ic');if(icEl)icEl.value=pciData.incomplete||'';
    if(pciData.planned)calcAdminPCI(Q.toLowerCase(),'eAd');
  });

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
const pn=v=>{const n=parseFloat(v);return isNaN(n)?null:n;};
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
    target:parseFloat(_gv('aTg','100'))||100,
    op:normalizeOperator(_gv('aO','>=')),
    type:'core',
    tier:parseInt(_gv('aTier','3'))||3,
    q1:pn(_gv('aQ1','')),
    q2:pn(_gv('aQ2','')),
    q3:pn(_gv('aQ3','')),
    q4:pn(_gv('aQ4',''))
  };

  /* ── 4. Append to main state array (ST.added) ── */
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
  ['Q1','Q2','Q3','Q4'].forEach(Q=>{
    const q=Q.toLowerCase();
    const planned=pn(_gv('aAd'+Q+'_pl',''));
    const complete=pn(_gv('aAd'+Q+'_co',''));
    const incomplete=pn(_gv('aAd'+Q+'_ic',''));
    if(planned!==null||complete!==null||incomplete!==null){
      ST.pci[code][q]={planned,complete,incomplete};
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
  _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg> Saving to cloud…',true);

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
    _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg> ✓ KPI "'+code+'" saved to cloud — visible in Dashboard',true);
  } else {
    /* Saved locally but not to Firestore */
    _showFb('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg> KPI saved locally — cloud sync pending (visible after next login sync)',false);
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
  /* FIX 6: Validate PCI data integrity */
  let pciValid=true;
  ['Q1','Q2','Q3','Q4'].forEach(Q=>{
    const pl=parseFloat(document.getElementById('eAd'+Q+'_pl')?.value)||0;
    const co=parseFloat(document.getElementById('eAd'+Q+'_co')?.value)||0;
    const ic=parseFloat(document.getElementById('eAd'+Q+'_ic')?.value)||0;
    if(pl>0&&(co+ic)>pl){
      const msg=lang==='ar'
        ?(' '+Q+': المجموع ('+(co+ic)+') يتجاوز المخطط ('+pl+')')
        :(' '+Q+': Total ('+(co+ic)+') exceeds planned ('+pl+')');
      toast(msg);
      pciValid=false;
    }
  });
  if(!pciValid)return;
  const displayId=document.getElementById('eSel').value;if(!displayId){toast('Select a KPI');return;}
  const id=realId(displayId);  /* resolve to real storage key (handles renamed codes) */
  if(!ST.ov)ST.ov={};
  const _gQV=Q=>{const pl=parseFloat(document.getElementById('eAd'+Q+'_pl')?.value)||0;const co=parseFloat(document.getElementById('eAd'+Q+'_co')?.value);return(pl>0&&!isNaN(co)&&co!==null)?+(co/pl*100).toFixed(1):null;};
  if(!ST.ov[id])ST.ov[id]={};
  const _eYrEl=document.getElementById('eYr');
  const _eYrVal=_eYrEl?parseInt(_eYrEl.value)||null:null;
  ST.ov[id]={...ST.ov[id],
    q1:_gQV('Q1'),q2:_gQV('Q2'),q3:_gQV('Q3'),q4:_gQV('Q4'),
    target:parseFloat(document.getElementById('eTg').value)||90,
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
  if(_newCode && _newCode!==displayId){
    /* Renaming the KPI code — check for duplicates among OTHER KPIs */
    const dup=allK().some(x=>x.id===_newCode && realId(x.id)!==id);
    if(dup){
      toast(' KPI Code "'+_newCode+'" is already in use');return;
    }
    if(!ST.codeOv)ST.codeOv={};
    ST.codeOv[id]=_newCode;
  }
  /* Save PCI breakdown data */
  if(!ST.pci)ST.pci={};if(!ST.pci[id])ST.pci[id]={};
  ['Q1','Q2','Q3','Q4'].forEach(Q=>{
    const pl=parseFloat(document.getElementById('eAd'+Q+'_pl')?.value)||0;
    const co=parseFloat(document.getElementById('eAd'+Q+'_co')?.value)||0;
    const ic=parseFloat(document.getElementById('eAd'+Q+'_ic')?.value)||0;
    if(pl>0||co>0)ST.pci[id][Q.toLowerCase()]={planned:pl,complete:co,incomplete:ic};
  });
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
    if(fb2){fb2.textContent=' Gap Analysis saved successfully';fb2.style.color='#16A34A';fb2.style.display='block';fb2.style.background='rgba(22,163,74,.06)';}
    /* Reset field styles */
    _gReq.forEach(r=>{const el=document.getElementById(r.id);if(el){el.style.borderColor='';el.style.boxShadow='';}});
    action='GAP_EDIT';detail=`Gap for ${kpiId}${qtr?' · '+qtr.toUpperCase():''}`;window._editOldVal=oldGap;}
  else if(ap==='ap-actions'||ap==='ap-auditlog')return;
  if(action)addAudit(action,detail,window._editOldVal||null,window._editNewVal||null);window._editOldVal=null;window._editNewVal=null;
  /* Save to localStorage + Firestore via unified helper (no-loop, no auto-save) */
  persistST('KPI_EDIT').catch(function(e){
    toast('⚠ '+(lang==='ar'?'لم يُحفظ في السحابة: ':'Cloud save failed: ')+(e.code||e.message));
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
    o.textContent=k.id+' — '+k.nameEn+' ('+k.yr+')'+(!isBase?' ★':'');
    const lastGrp=sel.querySelector('optgroup:last-of-type');
    if(lastGrp)lastGrp.appendChild(o);
    else sel.appendChild(o);
  });
  if(!all.length){
    const o=document.createElement('option');o.disabled=true;o.textContent='No KPIs available';
    sel.appendChild(o);
  }
  /* Legend */
  const leg=document.getElementById('_delLegend');
  if(leg)leg.style.display=all.length?'block':'none';
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
    toast('⚠ Deleted locally — cloud sync failed: '+(e.code||e.message));
    if(_delFb){_delFb.innerHTML='⚠ Delete saved locally, cloud sync failed';_delFb.style.color='#D97706';_delFb.style.display='flex';}
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
     title:'Text & Language Editor',titleAr:'\u0645\u062d\u0631\u0631 \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0644\u0644\u063a\u0629',
     desc:'Edit Arabic and English terminology, report labels and shared text dictionary.',
     descAr:'\u062a\u0639\u062f\u064a\u0644 \u0645\u0635\u0637\u0644\u062d\u0627\u062a \u0627\u0644\u0644\u0648\u062d\u0629 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.',action:'sa-texteditor'}
  ];
  var inner='<div style="background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:32px 28px;max-width:820px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">'
    +'<div><div style="font-size:16px;font-weight:800;color:#e2e8f0">'+(isAr?'\u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0623\u0639\u0644\u0649':'Super Admin Hub')+'</div>'
    +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'\u0627\u062e\u062a\u0631 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629':'Select a management area')+'</div></div>'
    +'<button onclick="var e=document.getElementById(\'saHubOv\');if(e)e.remove();" style="width:32px;height:32px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;cursor:pointer;font-size:16px">&#x2715;</button>'
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
    var adminOv=document.getElementById('adminOv');
    if(adminOv)adminOv.classList.add('open');
    try{if(typeof popAdminSels==='function')popAdminSels();}catch(_){}
    try{if(typeof loadAuditLog==='function')loadAuditLog();}catch(_){}
  }else if(action==='sa-texteditor'){
    var adminOv=document.getElementById('adminOv');
    if(adminOv)adminOv.classList.add('open');
    try{if(typeof popAdminSels==='function')popAdminSels();}catch(_){}
    _ensureSaTextEditorTab();
    setTimeout(function(){if(typeof swAt==='function')swAt('ap-textedit');},120);
  }else if(action==='sa-requests'){
    _showUserRequestsPanel();
  }
  try{addAudit('SA_HUB_NAV','SA navigated to: '+action);}catch(_){}
}
window._saHubAction=_saHubAction;

function _showUserRequestsPanel(){
  var existing=document.getElementById('saReqOv'); if(existing)existing.remove();
  var reqs=ST.requests||[]; var isAr=(typeof lang!=='undefined'&&lang==='ar');
  var rows=reqs.length?reqs.map(function(r){
    return '<tr style="border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<td style="padding:8px 10px;font-size:10.5px;color:#94a3b8">'+htmlEsc(r.date||'')+'</td>'
      +'<td style="padding:8px 10px;font-size:10.5px;color:#e2e8f0">'+htmlEsc(r.user||'')+'</td>'
      +'<td style="padding:8px 10px;font-size:10.5px;color:#e2e8f0">'+htmlEsc(r.text||'')+'</td>'
      +'<td style="padding:8px 10px;font-size:10px;color:'+(r.status==='done'?'#16A34A':'#D97706')+'">'+htmlEsc(r.status||'new')+'</td></tr>';
  }).join(''):'<tr><td colspan="4" style="padding:24px;text-align:center;color:#475569;font-size:11px">'+(isAr?'\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a':'No requests yet')+'</td></tr>';
  var ov=document.createElement('div'); ov.id='saReqOv';
  ov.style.cssText='position:fixed;inset:0;z-index:9100;background:rgba(0,8,20,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.innerHTML='<div style="background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;max-width:700px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:16px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:15px;font-weight:800;color:#e2e8f0">'+(isAr?'\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646':'User Requests')+'</div>'
    +'<button onclick="_showSuperAdminHub()" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">\u2190 Back</button>'
    +'</div>'
    +'<div style="overflow-y:auto;flex:1"><table style="width:100%;border-collapse:collapse">'
    +'<thead><tr>'
    +'<th style="padding:6px 10px;font-size:9.5px;color:#64748b;text-align:left">'+(isAr?'\u0627\u0644\u062a\u0627\u0631\u064a\u062e':'Date')+'</th>'
    +'<th style="padding:6px 10px;font-size:9.5px;color:#64748b;text-align:left">'+(isAr?'\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645':'User')+'</th>'
    +'<th style="padding:6px 10px;font-size:9.5px;color:#64748b;text-align:left">'+(isAr?'\u0627\u0644\u0637\u0644\u0628':'Request')+'</th>'
    +'<th style="padding:6px 10px;font-size:9.5px;color:#64748b;text-align:left">'+(isAr?'\u0627\u0644\u062d\u0627\u0644\u0629':'Status')+'</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  document.body.appendChild(ov);
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
}
window._showUserRequestsPanel=_showUserRequestsPanel;

window._showSuperAdminHub = _showSuperAdminHub;

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
    if(enVal || arVal){
      const old=JSON.stringify(ST.textEdits[key]||{});
      ST.textEdits[key]={en:enVal,ar:arVal};
      if(JSON.stringify(ST.textEdits[key])!==old) changed++;
    }
  });
  if(!changed){ _teFeedback('No changes detected.', false); return; }
  /* Apply to TR immediately (single source of truth) */
  if(typeof tSet==='function'){
    Object.keys(ST.textEdits).forEach(function(key){
      tSet(key, ST.textEdits[key].en, ST.textEdits[key].ar);
    });
  } else if(typeof applyDOMTranslations==='function'){
    applyDOMTranslations();
  }
  /* Save to localStorage + Firestore via unified helper */
  persistST('TEXT_EDIT').then(function(){
    _teFeedback('Saved! Changes visible for all users.', true);
  }).catch(function(e){
    _teFeedback('Saved locally. Cloud sync failed: '+e.message, false);
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
