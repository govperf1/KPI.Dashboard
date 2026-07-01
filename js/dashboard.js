/* ===========================================================
   QUMC Dashboard  --  dashboard.js
   All page-rendering functions.

   Functions:
     dch(), mkChart(), drawBullet()  -- chart helpers
     renderExec()                    -- Executive summary
     renderExecKpiCards()            -- KPI card grid
     buildIntelRisks()               -- Risk intelligence
     renderRAG()                     -- RAG status
     renderDept()                    -- Department view
     renderRegistry()                -- KPI Registry
     renderAcc()                     -- Accountability
     accTable()                      -- Accountability table
     buildFallback()                 -- Fallback render
     renderExecKpiTrends()           -- KPI trend lines
     drilldept()                     -- Dept drill-down

   Depends on:
     kpi.js       (ST, F, lang, allK, filt, qv, ok, metStatus,
                   updateChips, updateBadge, htmlEsc, CH)
     translations.js (renderCurrent -- called by drilldept)
   =========================================================== */

/* -- Charts engine -- */
/* ── CHARTS ── */
function dch(id){if(CH[id]){try{CH[id].destroy()}catch(e){}delete CH[id];}}
function mkChart(id,cfg){
  try{
    if(typeof Chart==='undefined'){return null;}
    const ctx=document.getElementById(id);if(!ctx)return null;
    return new Chart(ctx,cfg);
  }catch(e){return null;}
}
if(typeof Chart!=='undefined'){Chart.defaults.color='rgba(15,23,42,0.50)';Chart.defaults.borderColor='rgba(20,35,80,0.08)';}

/* ==========================================
   BULLET CHART — replaces gauges
========================================== */
function drawBullet(cid,actual,target){
  const cv=document.getElementById(cid);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const w=cv.clientWidth||200,h=28;
  cv.width=w*dpr;cv.height=h*dpr;
  cv.style.width=w+'px';cv.style.height=h+'px';
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const barY=8,barH=12;
  const mV=Math.max(105,actual+5);
  const toX=v=>Math.min(w,(v/mV)*w);
  // Band backgrounds
  [[0,65,'rgba(248,113,113,.10)'],[65,80,'rgba(251,146,60,.10)'],[80,95,'rgba(251,191,36,.08)'],[95,105,'rgba(52,211,153,.10)']].forEach(([mn,mx,col])=>{
    ctx.fillStyle=col;ctx.fillRect(toX(mn),barY-3,toX(mx)-toX(mn),barH+6);
  });
  // Track
  ctx.fillStyle='rgba(255,255,255,.06)';
  ctx.beginPath();if(ctx.roundRect)ctx.roundRect(0,barY,w,barH,3);else ctx.rect(0,barY,w,barH);ctx.fill();
  // Actual bar
  const ax=toX(actual!==null?actual:0);
  ctx.fillStyle=actual>=target?'rgba(52,211,153,.85)':'rgba(248,113,113,.85)';
  ctx.beginPath();if(ctx.roundRect)ctx.roundRect(0,barY,ax,barH,3);else ctx.rect(0,barY,ax,barH);ctx.fill();
  // Target tick
  const tx=toX(target);
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(tx-1.5,barY-5,3,barH+10);
  // Labels
  ctx.font='600 7.5px "DM Mono",monospace';
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.textAlign='left';ctx.fillText('0',2,h-1);
  ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText(target+'%',tx,h-1);
  ctx.textAlign='right';ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillText('100%',w-2,h-1);
}

/* ==========================================
   EXECUTIVE COMMAND PAGE
========================================== */

/* FIX 9: Render-scoped memoization for expensive KPI calculations */
let _renderCache=null;
function _clearCache(){_renderCache=null;}
function _cached(k){
  if(!_renderCache)_renderCache=new Map();
  if(!_renderCache.has(k.id)){
    _renderCache.set(k.id,{v:qv(k),a:ok(k),c:kc(k),rc:getRepeat(k)});
  }
  return _renderCache.get(k.id);
}

function renderExec(){
  /* Guard: F must be initialised. Retry up to 5×150ms then stop. */
  if(typeof F==='undefined'||!F||typeof F!=='object'){
    renderExec._retries=(renderExec._retries||0)+1;
    if(renderExec._retries<=5){
      console.warn('[Dashboard] F not ready — retry '+renderExec._retries+'/5');
      setTimeout(renderExec,150);
    } else {
      console.error('[Dashboard] F never initialised — giving up after 5 retries.');
      renderExec._retries=0;
    }
    return;
  }
  renderExec._retries=0;
  _clearCache();
  const ks=filt();
  const evaluated=ks.filter(k=>ok(k)!==null);
  const total=evaluated.length,nOk=evaluated.filter(k=>ok(k)===true).length,miss=evaluated.filter(k=>ok(k)===false).length;
  /* YoY Q1: compare Q1'26 vs actual Q1'25 (matched by nameEn+dept) */
  const k26y=allK().filter(k=>k.yr===2026&&k.q1!==null);
  let yoyDelta=null;
  if(k26y.length){
    const diffs=k26y.map(k=>{
      const k25=allK().find(x=>x.yr===2025&&x.dept===k.dept&&x.nameEn===k.nameEn);
      return k25&&k25.q1!==null?k.q1-k25.q1:null;
    }).filter(v=>v!==null);
    if(diffs.length)yoyDelta=(diffs.reduce((a,b)=>a+b,0)/diffs.length).toFixed(1);
  }
  /* Annual YoY: avg of ALL available 2026 quarters vs 2025 full-year avg
     ─ When Q2'26 is added: k26All will automatically include it
     ─ Formula: mean(avg per KPI for 2026) - mean(avg per KPI for 2025) */
  const k25All=allK().filter(k=>k.yr===2025);
  const k26All=allK().filter(k=>k.yr===2026);
  let annYoYDelta=null;
  if(k25All.length&&k26All.length){
    const getAvg=arr=>arr.map(k=>{const vs=[k.q1,k.q2,k.q3,k.q4].filter(v=>v!==null);return vs.length?vs.reduce((a,b)=>a+b)/vs.length:null;}).filter(v=>v!==null);
    const avg25=getAvg(k25All),avg26=getAvg(k26All);
    if(avg25.length&&avg26.length){
      const mean25=avg25.reduce((a,b)=>a+b)/avg25.length;
      const mean26=avg26.reduce((a,b)=>a+b)/avg26.length;
      annYoYDelta=(mean26-mean25).toFixed(1);
    }
  }
  const missKpis=ks.filter(k=>ok(k)===false).sort((a,b)=>(a.tier||3)-(b.tier||3));
  const depts=['maintenance','safety','housekeeping','projects'];
  const k25=allK().filter(k=>k.yr===2025);
  const avg=(arr,q)=>{const vs=arr.map(k=>k[q]).filter(v=>v!==null);return vs.length?+(vs.reduce((a,b)=>a+b)/vs.length).toFixed(1):null;};
  const a25=['q1','q2','q3','q4'].map(q=>avg(k25,q));

  
  /* ── Exec summary pre-computed ── */
  const _metPct=total?+(nOk/total*100).toFixed(1):0;
  const _perfLabel=(nOk/Math.max(total,1))>=.75?t('stable'):((nOk/Math.max(total,1))>=.5?t('developing'):t('needs_attention'));
  const _perfColor=(nOk/Math.max(total,1))>=.75?'#15803D':((nOk/Math.max(total,1))>=.5?'#FCD34D':'#F87171');
  const _critEsc=evaluated.filter(k=>ok(k)===false&&(k.tier||3)===1).length;
  const _atRisk=(typeof window._qumcExecAtRiskRows==='function'?window._qumcExecAtRiskRows().length:0);
  const _critColor=_critEsc>0?'#F87171':'rgba(255,255,255,.85)';
  const _riskColor=_atRisk>0?'#FCD34D':'rgba(255,255,255,.85)';
  /* ── Premium bar vars ── */
  const _missK2=evaluated.filter(k=>ok(k)===false);
  const _wK2=_missK2.reduce((a,k)=>{const v=qv(k);if(v===null)return a;const g=k.target-v;return(!a||g>a.g)?{k,g}:a;},null);
  const _bigGapStr=_wK2?(_wK2.g.toFixed(1)+'%'):'—';
  const _bigGapName=_wK2?_wK2.k.nameEn.slice(0,28):'';
  const _dS2=Object.keys(DM).map(d=>{const dk2=evaluated.filter(k=>k.dept===d);return{d,miss:dk2.filter(k=>ok(k)===false).length,total:dk2.length};}).filter(x=>x.total>0).sort((a,b)=>b.miss-a.miss);
  const _wD2=_dS2[0];
  const _dC2={maintenance:'#0195af',safety:'#F87171',housekeeping:'#15803D',projects:'#FCD34D'};
  const _wDColor=_wD2?(_dC2[_wD2.d]||'#fff'):'#15803D';
  const _wDName=_wD2&&_wD2.miss>0?DM[_wD2.d][lang==='ar'?'ar':'en']:t('all_good');
  const _wDSub=_wD2&&_wD2.miss>0?(_wD2.miss+' missed of '+_wD2.total):'';
  const _wText=_wD2&&_wD2.miss>0?(DM[_wD2.d]?DM[_wD2.d].en:'—'):t('all_depts_ok');
  const _annYoyKs=allK().filter(k=>k.yr===2026&&k.yoy!==undefined&&k.yoy!==null);
  const _annualYoy=_annYoyKs.length?(+( _annYoyKs.map(k=>{const v=qv(k);return v!==null?v-k.yoy:null;}).filter(v=>v!==null).reduce((a,b)=>a+b,0)/_annYoyKs.length).toFixed(1)):null;

  const g=document.getElementById('execGrid');
  g.innerHTML=`
<!-- === STAT CARDS === -->
<div class="c12" style="padding:0;background:transparent;box-shadow:none;border:none;margin-bottom:14px">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">

    <!-- TOTAL -->
    <div class="card" style="padding:20px 20px 16px;border-radius:16px;display:flex;flex-direction:column;gap:0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-32px;right:-32px;width:115px;height:115px;border-radius:50%;background:rgba(100,116,139,.06)"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:10px;background:#F1F5F9;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </div>
        <span style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em">Total</span>
      </div>
      <div style="font-size:46px;font-weight:900;color:#152538;font-family:var(--mono);line-height:1;margin-bottom:4px">${total}</div>
      <div style="font-size:11px;font-weight:600;color:#64748B;margin-bottom:12px">KPI Indicators</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #F0F4F8">
        <span style="font-size:10px;color:#0195af;font-weight:700">View all →</span>
        <span style="font-size:9.5px;color:#94A3B8">${evaluated.length} evaluated</span>
      </div>
    </div>

    <!-- MET -->
    <div class="card" style="padding:20px 20px 16px;border-radius:16px;display:flex;flex-direction:column;gap:0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-32px;right:-32px;width:115px;height:115px;border-radius:50%;background:rgba(22,163,74,.07)"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em">${t('met_label')}</span>
      </div>
      <div style="font-size:46px;font-weight:900;color:#16A34A;font-family:var(--mono);line-height:1;margin-bottom:4px">${nOk}</div>
      <div style="font-size:11px;font-weight:600;color:#64748B;margin-bottom:12px">${t('kpis_on_target')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #F0F4F8">
        <span style="font-size:13px;font-weight:900;color:#16A34A;font-family:var(--mono)">${total?+(nOk/total*100).toFixed(1):0}%</span>
        <span style="font-size:8.5px;font-weight:700;padding:2px 10px;border-radius:12px;background:#DCFCE7;color:#16A34A">Success rate</span>
      </div>
    </div>

    <!-- MISSED -->
    <div class="card" style="padding:20px 20px 16px;border-radius:16px;display:flex;flex-direction:column;gap:0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-32px;right:-32px;width:115px;height:115px;border-radius:50%;background:rgba(220,38,38,.07)"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:#DC2626;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <span style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em">Missed</span>
      </div>
      <div style="font-size:46px;font-weight:900;color:#DC2626;font-family:var(--mono);line-height:1;margin-bottom:4px">${miss}</div>
      <div style="font-size:11px;font-weight:600;color:#64748B;margin-bottom:12px">Below target</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #F0F4F8">
        <span style="font-size:13px;font-weight:900;color:#DC2626;font-family:var(--mono)">${total?+(miss/total*100).toFixed(1):0}%</span>
        <span style="font-size:8.5px;font-weight:700;padding:2px 10px;border-radius:12px;background:#FEE2E2;color:#DC2626">Gap rate</span>
      </div>
    </div>

    <!-- YoY Q1 -->
    <div class="card" style="padding:20px 20px 16px;border-radius:16px;display:flex;flex-direction:column;gap:0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-32px;right:-32px;width:115px;height:115px;border-radius:50%;background:rgba(59,130,246,.07)"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>
        <span style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em">YoY Q1</span>
      </div>
      <div style="font-size:36px;font-weight:900;color:${yoyDelta===null?'#94A3B8':parseFloat(yoyDelta)>=0?'#16A34A':'#DC2626'};font-family:var(--mono);line-height:1;margin-bottom:4px">${yoyDelta===null?'—':(parseFloat(yoyDelta)>0?'▲ ':'▼ ')+Math.abs(parseFloat(yoyDelta||0))+'%'}</div>
      <div style="font-size:11px;font-weight:600;color:#64748B;margin-bottom:12px">Q1 vs prior year Q1</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #F0F4F8">
        <span style="font-size:8.5px;font-weight:700;padding:2px 10px;border-radius:12px;background:${yoyDelta===null?'#F1F5F9':parseFloat(yoyDelta)>=0?'#DCFCE7':'#FEE2E2'};color:${yoyDelta===null?'#94A3B8':parseFloat(yoyDelta)>=0?'#16A34A':'#DC2626'}">${yoyDelta===null?t('no_data'):parseFloat(yoyDelta)>=0?t('improved'):t('declined')}</span>
        <svg width="44" height="22" viewBox="0 0 44 22" fill="none"><polyline points="2,16 12,9 22,12 32,6 42,9" stroke="${yoyDelta===null?'#94A3B8':parseFloat(yoyDelta)>=0?'#16A34A':'#DC2626'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </div>
    </div>

    <!-- Annual YoY -->
    <div class="card" style="padding:20px 20px 16px;border-radius:16px;display:flex;flex-direction:column;gap:0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-32px;right:-32px;width:115px;height:115px;border-radius:50%;background:rgba(217,119,6,.07)"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:38px;height:38px;border-radius:10px;background:#FFF7ED;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <span style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em">Annual YoY</span>
      </div>
      <div style="font-size:36px;font-weight:900;color:${_annualYoy===null?'#94A3B8':_annualYoy>=0?'#16A34A':'#DC2626'};font-family:var(--mono);line-height:1;margin-bottom:4px">${_annualYoy===null?'—':(_annualYoy>0?'▲ ':'▼ ')+Math.abs(_annualYoy)+'%'}</div>
      <div style="font-size:11px;font-weight:600;color:#64748B;margin-bottom:12px">Annual avg vs prior year</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #F0F4F8">
        <span style="font-size:8.5px;font-weight:700;padding:2px 10px;border-radius:12px;background:${_annualYoy===null?'#F1F5F9':_annualYoy>=0?'#DCFCE7':'#FEE2E2'};color:${_annualYoy===null?'#94A3B8':_annualYoy>=0?'#16A34A':'#DC2626'}">${_annualYoy===null?'No data':_annualYoy>=0?'Improved':'Declined'}</span>
        <svg width="44" height="22" viewBox="0 0 44 22" fill="none"><polyline points="2,11 10,14 20,9 30,15 42,12" stroke="${_annualYoy===null?'#94A3B8':_annualYoy>=0?'#16A34A':'#DC2626'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </div>
    </div>

  </div>
</div>

<!-- === EXECUTIVE SUMMARY === -->
<div class="c12" style="padding:0;background:transparent;box-shadow:none;border:none;margin-bottom:14px">
  <div id="execIntelBar" style="background:linear-gradient(135deg,#0f1f35 0%,#152538 60%,#0f1f35 100%);border-radius:14px;padding:0;box-shadow:0 4px 24px rgba(10,22,48,.30);overflow:hidden">
    <!-- Top row: status + 6 stats -->
    <div style="display:grid;grid-template-columns:auto 1px minmax(100px,1fr) 1px minmax(100px,1fr) 1px minmax(100px,1fr) 1px minmax(100px,1fr) 1px minmax(100px,1fr) 1px minmax(100px,1fr) 1px minmax(100px,1fr);grid-auto-flow:column;align-items:center;border-bottom:1px solid rgba(14,116,144,.12);overflow-x:auto">
      <!-- Status block -->
      <div style="padding:18px 24px;min-width:220px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(1,149,175,.50);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div style="font-size:10px;font-weight:800;color:#fff;letter-spacing:.08em;text-transform:uppercase">Executive Intelligence<br>Summary</div>
        </div>
        <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.50);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Overall Status:</div>
        <div id="eis_status" style="font-size:13px;font-weight:900;letter-spacing:.04em;margin-bottom:8px">—</div>
        <div id="eis_desc" style="font-size:10px;color:rgba(255,255,255,.55);line-height:1.6">—</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 1: Critical Escalations -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em" data-en="Critical Escalations" data-ar="تصعيدات حرجة">Critical Escalations</div>
        </div>
        <div id="eis_crit" style="font-size:36px;font-weight:900;color:#F87171;font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div id="eis_crit_sub" style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px">—</div>
        <div id="eis_crit_badge" style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(220,38,38,.25);color:#F87171">—</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 2: Biggest Gap -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em">Biggest Gap (KPI)</div>
        </div>
        <div id="eis_gap" style="font-size:36px;font-weight:900;color:#F87171;font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div id="eis_gap_sub" style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;margin-left:auto;margin-right:auto">—</div>
        <div style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(220,38,38,.25);color:#F87171">Performance gap</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 3: Priority Department -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em">Priority Department</div>
        </div>
        <div id="eis_dept" style="font-size:22px;font-weight:900;color:#FBBF24;line-height:1;margin-bottom:4px">—</div>
        <div id="eis_dept_sub" style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px">—</div>
        <div id="eis_dept_badge" style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(217,119,6,.25);color:#FBBF24">—</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 4: Open Actions -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em" data-en="Gap Analysis Open" data-ar="فجوات قيد المعالجة">Gap Analysis Open</div>
        </div>
        <div id="eis_actions" style="font-size:36px;font-weight:900;color:#0195af;font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px">Missed KPIs without gap analysis</div>
        <div id="eis_actions_badge" style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(1,149,175,.25);color:#0195af">—</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 5a: Current Performance -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em" data-en="Current Performance" data-ar="الأداء الحالي">Current Performance</div>
        </div>
        <div id="eis_current_perf" style="font-size:36px;font-weight:900;color:rgba(255,255,255,.85);font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px" data-en="Selected period average" data-ar="متوسط الفترة المحددة">Selected period average</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 5b: Forecast YE -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em" data-en="Forecast YE" data-ar="التوقع السنوي">Forecast YE</div>
        </div>
        <div id="eis_forecast" style="font-size:36px;font-weight:900;color:#0195af;font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div id="eis_forecast_badge" style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(1,149,175,.25);color:#0195af">—</div>
      </div>
      <div style="width:1px;height:60px;background:rgba(255,255,255,.10)"></div>
      <!-- Stat 6: At-Risk KPIs -->
      <div style="padding:16px 20px;text-align:center">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em">At-Risk KPIs (Next Qtr)</div>
        </div>
        <div id="eis_atrisk" style="font-size:36px;font-weight:900;color:#a78bfa;font-family:var(--mono);line-height:1;margin-bottom:4px">—</div>
        <div style="font-size:9px;color:rgba(255,255,255,.40);margin-bottom:8px">KPIs at risk of missing target</div>
        <div style="display:inline-block;font-size:8px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(167,139,250,.20);color:#a78bfa">Monitor closely</div>
      </div>
    </div>

  </div>
</div>





<!-- DETAILED KPI PERFORMANCE CARDS -->
<div class="card c12" style="padding:0;background:transparent;box-shadow:none;border:none">
  <div class="ch" style="background:var(--card);border:1px solid rgba(10,22,48,.07);border-radius:var(--radius) var(--radius) 0 0;border-bottom:1px solid var(--border2)">
    <span style="font-weight:800">📋 ${lang==='ar'?'بطاقات الأداء التفصيلية':'DETAILED KPI PERFORMANCE CARDS'}</span>
    <div class="ch-r">${ks.length} ${lang==='ar'?'مؤشر':'KPIs'}</div>
  </div>
  <div class="cb sc" style="padding:10px;background:var(--card);border:1px solid rgba(10,22,48,.07);border-top:none;border-radius:0 0 var(--radius) var(--radius)">
    <div id="execKpiCards" style="width:100%"></div>
  </div>
</div>

<!-- CHARTS ROW -->
<div class="card c5">
  <div class="ch">📊 ${lang==='ar'?'الإنجاز الربعي':'Quarterly Achievement'}</div>
  <div class="cb"><div class="cw" style="height:110px"><canvas id="cBar"></canvas></div></div>
</div>
<div class="card c4">
  <div class="ch">📈 ${lang==='ar'?'الاتجاه الربعي حسب القسم':'Quarterly Trend by Department'}</div>
  <div class="cb"><div class="cw" style="height:110px"><canvas id="cExecML"></canvas></div></div>
</div>
<div class="card c3" style="display:flex;flex-direction:column">
  <div class="ch">🎯 ${lang==='ar'?'مستويات المخاطر':'Risk Tiers'}</div>
  <div class="cb" style="padding:4px 11px 10px;flex:1;display:flex;flex-direction:column;justify-content:space-evenly">
    ${[1,2,3].map(t=>{const tk=ks.filter(k=>(k.tier||3)===t);const tm=tk.filter(k=>ok(k)===false).length;const to=tk.filter(k=>ok(k)===true).length;return`<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span class="tier-b ${t===1?'t1':t===2?'t2b':'t3b'}">T${t}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;color:var(--t2)">${lang==='ar'?TIERS[t].ar:TIERS[t].en}</div>
        <div style="height:3px;background:var(--t4);border-radius:99px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${tk.length?Math.round(to/tk.length*100):0}%;background:${tm>0?'var(--red)':'var(--green)'};border-radius:99px"></div></div>
      </div>
      <div style="font-size:11px;font-family:var(--mono);font-weight:700;color:${tm>0?'var(--red)':'var(--green)'}">${to}/${tk.length}</div>
    </div>`;}).join('')}
  </div>
</div>

<!-- KPI Trend Analysis (from Departments page) -->


<div class="card c12">
  <div class="ch" style="border-bottom:1px solid var(--border)">
    <span style="font-weight:800">📈 ${lang==='ar'?'تحليل الاتجاه الفردي لكل مؤشر — الهدف + YoY':'KPI Trend Analysis'}</span>
    <div class="ch-r">${lang==='ar'?'Q1\'25 → Q4\'25 → Q1\'26 لكل مؤشر':'Q1\'25 → Q4\'25 → Q1\'26 per KPI'}</div>
  </div>
  <div class="cb sc" style="padding:10px">
    <div id="execKpiTrends" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px"></div>
  </div>
</div>
<!-- === EXECUTIVE INTELLIGENCE CARD === -->
<div class="c12" id="execIntelCard" style="padding:0;background:transparent;box-shadow:none;border:none;margin-bottom:14px">
  <div style="background:#fff;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 2px 16px rgba(10,22,48,.08);overflow:hidden">
    <!-- Header -->
    <div style="padding:14px 20px;border-bottom:1px solid #F0F4F8;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(1,149,175,.10);display:flex;align-items:center;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        </div>
        <span style="font-size:14px;font-weight:800;color:#152538">Executive Intelligence</span>
      </div>
      <span id="ei_updated" style="font-size:10px;color:#94A3B8">Last Updated: —</span>
    </div>
    <!-- Body: 3 columns -->
    <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:0">
      <!-- Summary -->
      <div style="padding:18px 20px;border-right:1px solid #F0F4F8">
        <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Summary</div>
        <div id="ei_summary" style="font-size:11.5px;color:#334155;line-height:1.75">—</div>
      </div>
      <!-- Critical Risks -->
      <div style="padding:18px 20px;border-right:1px solid #F0F4F8">
        <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Critical Risks</div>
        <div id="ei_risks" style="display:flex;flex-direction:column;gap:8px">—</div>
      </div>
      <!-- Recommendations -->
      <div style="padding:18px 20px">
        <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Recommendations</div>
        <div id="ei_recs" style="display:flex;flex-direction:column;gap:10px">—</div>
      </div>
    </div>

    <!-- Top Risk + Recommended Action -->
    <div style="border-top:1px solid #F0F4F8;display:grid;grid-template-columns:1fr 1px 1fr">
      <div style="padding:14px 20px;display:flex;align-items:flex-start;gap:12px">
        <div style="width:32px;height:32px;border-radius:50%;background:rgba(251,191,36,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <div style="font-size:9px;font-weight:800;color:#D97706;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Top Risk</div>
          <div id="ei_card_toprisk" style="font-size:10.5px;color:#334155;line-height:1.65">—</div>
        </div>
      </div>
      <div style="width:1px;background:#F0F4F8"></div>
      <div style="padding:14px 20px;display:flex;align-items:flex-start;gap:12px">
        <div style="width:32px;height:32px;border-radius:50%;background:rgba(1,149,175,.10);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <div style="font-size:9px;font-weight:800;color:#0195af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Recommended Action</div>
          <div id="ei_card_action" style="font-size:10.5px;color:#334155;line-height:1.65">—</div>
        </div>
      </div>
    </div>
    <!-- Repeat Misses -->
    <div style="border-top:1px solid #F0F4F8">
      <div style="padding:12px 20px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #F0F4F8">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 8v4M12 16h.01"/></svg>
        <span style="font-size:10px;font-weight:800;color:#DC2626;text-transform:uppercase;letter-spacing:.06em">Repeat Misses</span>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:8px 20px;background:#F8FAFC;border-bottom:1px solid #F0F4F8">
        <span style="font-size:8px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em">KPI</span>
        <span style="font-size:8px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em">Department</span>
        <span style="font-size:8px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em">Risk Tier</span>
        <span style="font-size:8px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em">Trend</span>
        <span style="font-size:8px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em">Last Result</span>
      </div>
      <div id="ei_repeats">—</div>
    </div>
  </div>
</div>




`;
  setTimeout(()=>{
    /* ── Populate Executive Intelligence Card ── */
    try{
    const _ksi=filt();
    const _miss2=_ksi.filter(k=>ok(k)===false);
    const _met2=_ksi.filter(k=>ok(k)===true);

    /* Timestamp */
    const _now=new Date();
    const _ei_up=document.getElementById('ei_updated');
    if(_ei_up)_ei_up.textContent=tText('last_updated')+': '+_now.getHours()+':'+String(_now.getMinutes()).padStart(2,'0')+' '+(_now.getHours()>=12?'PM':'AM');

    /* Summary */
    const _ei_sum=document.getElementById('ei_summary');
    if(_ei_sum){
      const _pct2=_ksi.filter(k=>ok(k)!==null).length?Math.round(_met2.length/_ksi.filter(k=>ok(k)!==null).length*100):0;
      const _bigG=[..._miss2].sort((a,b)=>(b.target-(qv(b)||0))-(a.target-(qv(a)||0)))[0];
      _ei_sum.innerHTML='Division achieved <strong style="color:'+(_pct2>=80?'#16A34A':_pct2>=60?'#D97706':'#DC2626')+'">'+_pct2+'%</strong>. '
        +(_bigG?'KPI <strong style="color:#152538">'+(lang==='ar'?_bigG.nameAr:_bigG.nameEn)+'</strong> shows the highest gap from target.':'All evaluated KPIs are on track.');
    }

    /* Critical Risks */
    const _ei_risks=document.getElementById('ei_risks');
    if(_ei_risks){
      const _topRisks=[..._miss2].sort((a,b)=>(b.tier||3)-(a.tier||3)||(b.target-(qv(b)||0))-(a.target-(qv(a)||0))).slice(0,4);
      if(_topRisks.length){
        _ei_risks.innerHTML=_topRisks.map(k=>{
          const v=qv(k),gap=v!==null?(k.target-v).toFixed(1):null;
          const rc=getRepeat(k);
          return '<div style="padding:10px 12px;border-radius:8px;border:1px solid rgba(220,38,38,.15);background:#FEF2F2">'
            +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
              +'<span style="font-size:10px;font-weight:900;color:#DC2626;font-family:var(--mono)">'+k.id+'</span>'
              +'<span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(220,38,38,.15);color:#DC2626">T'+(k.tier||3)+'</span>'
              +(rc>=2?'<span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(217,119,6,.15);color:#D97706">+'+rc+'x</span>':'')
            +'</div>'
            +'<div style="font-size:10px;color:#334155;font-weight:600">'+(lang==='ar'?k.nameAr:k.nameEn)+'</div>'
            +'<div style="font-size:9px;color:#64748B;margin-top:3px">'+(v!==null?v.toFixed(1)+'%':' — ')+' / '+(k.op==='='?'=':'≥')+k.target+'%'+(gap?' — <span style="color:#DC2626;font-weight:700">Gap: '+gap+'%</span>':'')+'</div>'
          +'</div>';
        }).join('');
      }else _ei_risks.innerHTML='<div style="font-size:11px;color:#16A34A;font-weight:700">✓ No critical risks identified</div>';
    }

    /* Recommendations */
    const _ei_recs=document.getElementById('ei_recs');
    if(_ei_recs){
      const recs=[];
      const _t1miss=_miss2.filter(k=>(k.tier||3)===1);
      if(_t1miss.length)recs.push({title:'Immediate: Address Tier 1 KPIs',sub:'Requires executive escalation',ok:false});
      if(_miss2.filter(k=>getRepeat(k)>=2).length>=2)recs.push({title:'Chronic underperformance in '+_miss2.filter(k=>getRepeat(k)>=2).length+' KPIs',sub:'Root cause analysis required',ok:false});
      const _nogap=_miss2.filter(k=>!((ST.gaps||{})[k.id]||{}).gapEn);
      if(_nogap.length)recs.push({title:'Gap analysis incomplete',sub:'Enter root causes & actions for all Missed KPIs',ok:false});
      if(!recs.length)recs.push({title:'Performance on track','sub':'Continue monitoring quarterly results',ok:true});
      _ei_recs.innerHTML=recs.map(r=>'<div style="display:flex;align-items:flex-start;gap:10px">'
        +'<div style="width:20px;height:20px;border-radius:50%;background:'+(r.ok?'rgba(22,163,74,.12)':'rgba(220,38,38,.10)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">'
          +'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="'+(r.ok?'#16A34A':'#DC2626')+'" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
        +'</div>'
        +'<div><div style="font-size:10.5px;font-weight:700;color:#152538">'+r.title+'</div>'
        +'<div style="font-size:9px;color:#64748B;margin-top:2px">'+r.sub+'</div></div>'
      +'</div>').join('');
    }

    /* Repeat Misses table */
    const _ei_rep=document.getElementById('ei_repeats');
    if(_ei_rep){
      const _repeats=_ksi.filter(k=>ok(k)===false).sort((a,b)=>getRepeat(b)-getRepeat(a));
      if(_repeats.length){
        _ei_rep.innerHTML=_repeats.map(function(k){
          var v=qv(k);var dm=DM[k.dept]||{};
          var vStr=v!==null?v.toFixed(1)+'%':'—';
          var trendArr=v!==null?(v>=(k.target||90)?'▲':'▼'):'—';
          var trendCol=v!==null?(v>=(k.target||90)?'#16A34A':'#DC2626'):'#94A3B8';
          var tier=k.tier||3;var tierCol=tier===1?'#DC2626':tier===2?'#D97706':'#0195af';
          var tierBg=tier===1?'rgba(220,38,38,.10)':tier===2?'rgba(217,119,6,.10)':'rgba(1,149,175,.10)';
          var deptName=lang==='ar'?(dm.ar||k.dept):(dm.en||k.dept);
          var resCol=v!==null&&v<(k.target||90)?'#DC2626':'#16A34A';
          return '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:10px 20px;border-bottom:1px solid #F0F4F8;align-items:center">'
            +'<div><div style="font-size:10px;font-weight:800;color:'+(dm.color||'#152538')+';font-family:var(--mono);margin-bottom:2px">'+k.id+'</div>'
            +'<div style="font-size:10px;color:#334155">'+(lang==='ar'?k.nameAr:k.nameEn)+'</div></div>'
            +'<div style="font-size:10px;color:#475569">'+deptName+'</div>'
            +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:'+tierBg+';color:'+tierCol+'">T'+tier+'</span>'
            +'<span style="font-size:14px;font-weight:900;color:'+trendCol+'">'+trendArr+'</span>'
            +'<span style="font-size:11px;font-weight:900;color:'+resCol+';font-family:var(--mono)">'+vStr+'</span>'
          +'</div>';
        }).join('');
      }else _ei_rep.innerHTML='<div style="padding:16px 20px;font-size:11px;color:#16A34A;font-weight:700">✓ No repeat misses detected</div>';
    }

    /* Top Risk + Recommended Action in Intel Card */
    try{
      const _iksi2=filt();
      const _imiss2=_iksi2.filter(k=>ok(k)===false);
      const _bigGap2=[..._imiss2].sort((a,b)=>{const va=qv(a)||0,vb=qv(b)||0;return(b.target-vb)-(a.target-va);})[0];
      const _depts2=['maintenance','safety','housekeeping','projects'];
      let _wDept2=null,_wPct2=101;
      _depts2.forEach(d=>{const _dk=_iksi2.filter(k=>k.dept===d&&ok(k)!==null);if(!_dk.length)return;const _dp=Math.round(_dk.filter(k=>ok(k)===true).length/_dk.length*100);if(_dp<_wPct2){_wPct2=_dp;_wDept2=d;}});
      const _tr2=document.getElementById('ei_card_toprisk');
      if(_tr2)_tr2.textContent=_bigGap2?('KPI "'+(_bigGap2.nameEn||_bigGap2.id)+'" is underperforming by '+(qv(_bigGap2)!=null?(_bigGap2.target-qv(_bigGap2)).toFixed(1)+'%':'—')+' below target.'):'All KPIs are meeting their targets.';
      const _ra2=document.getElementById('ei_card_action');
      if(_ra2)_ra2.textContent=(_wDept2&&_bigGap2)?('Review '+DM[_wDept2].en+' department recovery plan and address "'+ (_bigGap2.nameEn||_bigGap2.id)+'" gap analysis before next quarter.'):'Continue monitoring KPI performance.';
    }catch(e2){console.error('TopRisk:',e2);}
    }catch(_eic){console.error('Intel Card error:',_eic);}
    /* ── Populate Executive Intelligence Summary ── */
    const _ks=filt();
    const _miss=_ks.filter(k=>ok(k)===false);
    const _met=_ks.filter(k=>ok(k)===true);
    const _pend=_ks.filter(k=>ok(k)===null);

    try{
    /* Status */
    const _st=document.getElementById('eis_status');
    const _sd=document.getElementById('eis_desc');
    if(_st){
      const _pct=_ks.filter(k=>ok(k)!==null).length?Math.round(_met.length/_ks.filter(k=>ok(k)!==null).length*100):0;
      const _hasT1Miss=_miss.some(k=>(k.tier||3)===1);
      const _total=_ks.filter(k=>ok(k)!==null).length;
      const _missPct=_total>0?(_miss.length/_total):0;
      if(_miss.length===0){
        _st.innerHTML=tText('on_track_label');_st.style.color='#15803D';
      } else if(_hasT1Miss||_missPct>=0.50){
        _st.innerHTML=tText('critical_attention_required');_st.style.color='#F87171';
      } else if(_missPct>=0.30){
        _st.innerHTML=tText('attention_required');_st.style.color='#F87171';
      } else {
        _st.innerHTML=tText('needs_improvement');_st.style.color='#FBBF24';
      }
      _sd.textContent=_miss.length?'Immediate focus required on '+_miss.length+' missed KPI'+(_miss.length===1?'':'s')+' to meet annual targets.':'Division performing at '+_pct+'% achievement rate.';
    }

    /* Critical Escalations */
    const _crit=_miss.filter(k=>(k.tier||3)===1).length;
    const _ce=document.getElementById('eis_crit');
    if(_ce){_ce.textContent=_crit;_ce.style.color=_crit>0?'#F87171':'#15803D';}
    const _cs=document.getElementById('eis_crit_sub');if(_cs)_cs.innerHTML=tText(_crit>0?'requires_immediate_attention':'all_tier1_on_track');
    const _cb=document.getElementById('eis_crit_badge');if(_cb){_cb.innerHTML=tText(_crit>0?'critical':'all_clear');_cb.style.background=_crit>0?'rgba(220,38,38,.25)':'rgba(22,163,74,.20)';_cb.style.color=_crit>0?'#F87171':'#15803D';}

    /* Biggest Gap */
    const _gapK=_miss.sort((a,b)=>{const va=qv(a),vb=qv(b);const ga=va!=null?(a.target-va):0,gb=vb!=null?(b.target-vb):0;return gb-ga;})[0];
    const _ge=document.getElementById('eis_gap');const _gs=document.getElementById('eis_gap_sub');
    if(_ge){if(_gapK){const _gv=qv(_gapK);_ge.textContent=_gv!=null?(_gapK.target-_gv).toFixed(1)+'%':'—';_gs.textContent=_gapK.nameEn.slice(0,30)+(lang==='ar'?_gapK.nameAr.slice(0,30):'');}else{_ge.textContent='—';if(_gs)_gs.textContent=tText('no_gaps_found');}}

    /* Priority Department */
    const _depts=['maintenance','safety','housekeeping','projects'];
    let _worstDept=null,_worstPct=100;
    _depts.forEach(d=>{const _dk=_ks.filter(k=>k.dept===d&&ok(k)!==null);if(!_dk.length)return;const _dp=Math.round(_dk.filter(k=>ok(k)===true).length/_dk.length*100);if(_dp<_worstPct){_worstPct=_dp;_worstDept=d;}});
    const _de=document.getElementById('eis_dept');const _ds=document.getElementById('eis_dept_sub');const _db=document.getElementById('eis_dept_badge');
    if(_de){if(_worstDept){_de.textContent=DM[_worstDept].en;_de.style.color=_worstPct<60?'#F87171':'#FBBF24';if(_ds)_ds.textContent=tText('performance_label')+' '+_worstPct+'%';if(_db){_db.textContent=_worstPct<60?tText('needs_recovery'):tText('needs_improvement_lower');_db.style.background=_worstPct<60?'rgba(220,38,38,.25)':'rgba(217,119,6,.25)';_db.style.color=_worstPct<60?'#F87171':'#FBBF24';}}else{_de.textContent='—';}}

    /* Gap Analysis Open — authoritative source: KPIs that need gap-analysis data.
       It intentionally depends on department scope only; year / quarter / status filters are ignored. */
    const _gapOpenRows=(typeof window._qumcGapOpenRows==='function')?window._qumcGapOpenRows():[];
    const _openAct=_gapOpenRows.length;
    const _ae=document.getElementById('eis_actions');
    if(_ae){
      _ae.textContent=_openAct;
      _ae.style.color=_openAct>0?'#D97706':'#15803D';
      _ae.style.cursor='pointer';
      _ae.onclick=window._showMissingGapKpisDrilldown||null;
    }
    const _ab=document.getElementById('eis_actions_badge');
    if(_ab){
      _ab.textContent=_openAct===0?'All documented':_openAct===1?'1 pending':''+_openAct+' pending';
      _ab.style.color=_openAct>0?'#D97706':'#15803D';
      _ab.style.background=_openAct>0?'rgba(217,119,6,.18)':'rgba(22,163,74,.14)';
    }

    /* Forecast YE — dynamic, no hardcoded years */
    let _fcRes={exec:null,byDept:{},currentYear:null};try{if(typeof calcForecastYE==='function')_fcRes=calcForecastYE({scope:'organization'});}catch(_fce){console.warn('[Forecast]',_fce);}
    const _fcVal=_fcRes.exec;
    const _forecastTxt=_fcVal!==null?_fcVal.toFixed(2)+'%':'—';
    const _fcColor=_fcVal!==null?(_fcVal>=80?'#15803D':_fcVal>=60?'#0195af':'#FBBF24'):'#64748B';
    const _fe=document.getElementById('eis_forecast');
    if(_fe){
      _fe.textContent=_forecastTxt;_fe.style.color=_fcColor;
      _fe.style.cursor='pointer';_fe.title='Click for department breakdown';
      _fe.onclick=function(){if(typeof _showForecastDrilldown==='function')_showForecastDrilldown(_fcRes);};
    }
    const _curPerfEl=document.getElementById('eis_current_perf');
    if(_curPerfEl){
      /* Current Performance = average KPI result, not count of achieved KPIs.
         Respects selected filters; when year=All, it uses the latest year found after filters. */
      const _qtrs=(F&&Array.isArray(F.qtr)&&!F.qtr.includes('all'))?F.qtr:['q1','q2','q3','q4'];
      const _hasVal=k=>_qtrs.some(q=>k&&typeof k[q]==='number'&&isFinite(k[q]));
      let _perfKs=_ks.filter(k=>k&&_hasVal(k));
      if(F&&F.year==='all'){
        const _ly=_perfKs.reduce((m,k)=>Math.max(m,Number(k.yr)||0),0);
        _perfKs=_ly?_perfKs.filter(k=>Number(k.yr)===_ly):[];
      }
      const _perfVals=_perfKs.map(k=>qv(k)).filter(v=>v!==null&&v!==undefined&&typeof v==='number'&&isFinite(v));
      const _curPct=_perfVals.length?(_perfVals.reduce((a,b)=>a+b,0)/_perfVals.length):null;
      _curPerfEl.textContent=_curPct!==null?_curPct.toFixed(2)+'%':'—';
      _curPerfEl.style.color=_curPct===null?'#64748B':_curPct>=80?'#15803D':_curPct>=60?'#0195af':'#FBBF24';
    }
    const _fb=document.getElementById('eis_forecast_badge');
    if(_fb&&_fcVal!==null){_fb.innerHTML=tText(_fcVal>=80?'likely_to_meet_target':_fcVal>=60?'moderate_risk':'at_risk_label');_fb.style.color=_fcColor;_fb.style.background=_fcVal>=80?'rgba(22,163,74,.20)':_fcVal>=60?'rgba(1,149,175,.25)':'rgba(217,119,6,.25)';}
    else if(_fb&&_fcVal===null){_fb.innerHTML='Insufficient data';_fb.style.color='#64748B';_fb.style.background='rgba(100,116,139,.20)';}

    /* At-Risk KPIs */
    const _atRisk=(typeof window._qumcExecAtRiskRows==='function'?window._qumcExecAtRiskRows().length:0);
    const _ar=document.getElementById('eis_atrisk');if(_ar)_ar.textContent=_atRisk;

    /* Top Risk */
    const _tr=document.getElementById('eis_toprisk');
    if(_tr&&_gapK){const _gv2=qv(_gapK);_tr.textContent=(_gapK.nameEn||_gapK.id)+' is underperforming by '+(_gv2!=null?(_gapK.target-_gv2).toFixed(1)+'%':'—')+' and contributing significantly to the overall performance gap.';}
    else if(_tr)_tr.textContent=tText('all_kpis_meeting_targets');

    /* Recommended Action */
    const _ra=document.getElementById('eis_action');
    if(_ra&&_worstDept&&_gapK)_ra.textContent=tText('review_label')+' '+DM[_worstDept].en+' recovery plan and '+_gapK.nameEn+' actions before next quarter closure to improve annual achievement.';
    else if(_ra)_ra.textContent='Continue monitoring KPI performance and maintain current achievement levels.';

    }catch(_eis){console.error('EIS error:',_eis);}
    /* Render individual KPI cards */
    renderExecKpiCards(ks);
    /* Bar chart — uses current filter, shows year in labels */
    dch('cBar');
    requestAnimationFrame(()=>{
      const _bKs=filt();
      const _yrs=[...new Set(_bKs.map(k=>k.yr))].sort();
      const _showAll=_yrs.length>1;
      const _labels=[],_metD=[],_misD=[];
      _yrs.forEach(yr=>{['q1','q2','q3','q4'].forEach((q,qi)=>{
        if(!_bKs.some(k=>(!_showAll||k.yr===yr)&&k[q]!==null))return;
        _labels.push(_showAll?`Q${qi+1}'${String(yr).slice(2)}`:`Q${qi+1}`);
        _metD.push(_bKs.filter(k=>(!_showAll||k.yr===yr)&&k[q]!==null&&k[q]>=k.target).length);
        _misD.push(_bKs.filter(k=>(!_showAll||k.yr===yr)&&k[q]!==null&&k[q]<k.target).length);
      });});
      if(_labels.length)CH['cBar']=mkChart('cBar',{type:'bar',data:{labels:_labels,datasets:[
        {label:'Met',data:_metD,backgroundColor:'rgba(22,163,74,.65)',borderRadius:3,stack:'s'},
        {label:'Missed',data:_misD,backgroundColor:'rgba(220,38,38,.60)',borderRadius:3,stack:'s'}
      ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:9},boxWidth:10,padding:8,color:'#475569'}}},scales:{y:{stacked:true,ticks:{stepSize:1,font:{size:9}},grid:{color:'rgba(20,35,80,.06)'}},x:{stacked:true,ticks:{font:{size:9}},grid:{display:false}}}}});
    });
    /* Quarterly Trend by Dept — updated to Q1'26 */
    dch('cExecML');
    requestAnimationFrame(()=>{
      const avg2=(arr,q)=>{const vs=arr.map(k=>k[q]).filter(v=>v!==null);return vs.length?+(vs.reduce((a,b)=>a+b)/vs.length).toFixed(1):null;};
      const deps2=['maintenance','safety','housekeeping','projects'];
      const dsExec=deps2.map(d=>{
        const kk25=allK().filter(x=>x.yr===2025&&x.dept===d);
        const kk26=allK().filter(x=>x.yr===2026&&x.dept===d);
        const data=[...['q1','q2','q3','q4'].map(q=>avg2(kk25,q)),avg2(kk26,'q1')];
        return{label:DM[d].abbr,data,borderColor:DM[d].color,backgroundColor:'transparent',tension:.4,pointRadius:3,borderWidth:2,spanGaps:true};
      });
      CH['cExecML']=mkChart('cExecML',{type:'line',data:{labels:["Q1'25","Q2'25","Q3'25","Q4'25","Q1'26"],datasets:dsExec},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:9},boxWidth:10,padding:8,color:'#475569'}},tooltip:{mode:'index',intersect:false}},scales:{y:{min:40,max:105,ticks:{callback:v=>v+'%',font:{size:9}},grid:{color:'rgba(26,40,71,.05)'}},x:{ticks:{font:{size:8}},grid:{display:false}}}}});
    });
    /* KPI Trend Analysis in exec page */
    renderExecKpiTrends(ks);
    fetchAI();
    [300,700,1200].forEach(t=>setTimeout(()=>{const s=document.getElementById('trendYrSel');var _dy=(function(){var _ks=allK();var _mx=Math.max.apply(null,_ks.map(function(k){return k.yr||0;}));return _mx>0?String(_mx):'all';})();updateExecTrend(s?s.value:_dy);},t));

    /* Draw executive summary mini trend chart */
    [300,600,1000].forEach(t=>setTimeout(()=>{
      const _sel=document.getElementById('trendYrSel');
      var _dy2=(function(){var _ks2=allK();var _mx2=Math.max.apply(null,_ks2.map(function(k){return k.yr||0;}));return _mx2>0?String(_mx2):'all';})();updateExecTrend(_sel?_sel.value:_dy2);
    },t));
  },30);
}
window.renderExec=renderExec;

/* Forecast YE Department Drill-Down Popup */
function _showForecastDrilldown(fcRes){
  var prev=document.getElementById('_forecastDrillOv');
  if(prev){prev.remove();return;}
  var isAr=(typeof lang!=='undefined'&&lang==='ar');
  function _e(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function _col(v){return (v===null||v===undefined||!isFinite(v))?'#64748b':v>=80?'#15803D':v>=60?'#0195af':'#FBBF24';}
  var deptOrder=['maintenance','safety','housekeeping','projects'];
  var seen={};
  var entries=deptOrder.map(function(d){seen[d]=true;return{dept:d,fc:(fcRes.byDept&&fcRes.byDept[d]!==undefined)?fcRes.byDept[d]:null};});
  Object.keys(fcRes.byDept||{}).forEach(function(d){if(!seen[d]) entries.push({dept:d,fc:fcRes.byDept[d]});});
  var execPct=(fcRes.exec!==null&&fcRes.exec!==undefined&&isFinite(fcRes.exec))?fcRes.exec.toFixed(2)+'%':'—';
  var execC=(fcRes.exec!==null&&fcRes.exec!==undefined&&isFinite(fcRes.exec))?_col(fcRes.exec):'#64748b';
  var yr=fcRes.currentYear?String(fcRes.currentYear):'—';
  var ov=document.createElement('div');
  ov.id='_forecastDrillOv';
  ov.style.cssText='position:fixed;inset:0;background:radial-gradient(circle at top left,rgba(34,211,238,.18),transparent 34%),rgba(15,23,42,.34);backdrop-filter:blur(14px) saturate(150%);z-index:9800;display:flex;align-items:center;justify-content:center;padding:16px;';
  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(145deg,rgba(248,252,255,.88),rgba(226,248,255,.72));border:1px solid rgba(255,255,255,.60);border-radius:28px;padding:24px 28px;color:#0F172A;box-shadow:0 28px 90px rgba(15,23,42,.24);width:100%;max-width:400px;max-height:88vh;overflow-y:auto;';
  /* Header */
  var hdr=document.createElement('div');hdr.style.cssText='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;';
  var hi=document.createElement('div');
  hi.innerHTML='<div style="font-size:8px;font-weight:700;color:#0195af;text-transform:uppercase;letter-spacing:.10em;margin-bottom:3px">'+_e(isAr?'التوقع السنوي':'Forecast YE')+'</div>'
    +'<div style="font-size:10px;color:#64748b">'+_e(isAr?'السنة الحالية: ':'Current Year: ')+_e(yr)+'</div>';
  var cl=document.createElement('button');cl.textContent='✕';
  cl.style.cssText='background:none;border:none;color:#64748b;cursor:pointer;font-size:20px;line-height:1;padding:2px 8px;border-radius:6px;';
  cl.onclick=function(){ov.remove();};
  hdr.appendChild(hi);hdr.appendChild(cl);
  /* Executive summary */
  var sum=document.createElement('div');
  sum.style.cssText='text-align:center;background:rgba(255,255,255,.58);border:1px solid rgba(14,116,144,.12);border-radius:18px;padding:16px;margin-bottom:18px;';
  sum.innerHTML='<div style="font-size:10px;color:#64748b;margin-bottom:4px">'+_e(isAr?'متوسط التوقع العام':'Overall Executive Forecast')+'</div>'
    +'<div style="font-size:42px;font-weight:900;color:'+execC+';font-family:var(--mono);line-height:1">'+execPct+'</div>'
    ;
  /* Dept label */
  var dl=document.createElement('div');dl.style.cssText='font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;';
  dl.textContent=isAr?'توقعات الأقسام':'Department Forecasts';
  /* Dept rows */
  var dr=document.createElement('div');
  entries.forEach(function(e){
    var dm=(typeof DM!=='undefined'&&DM[e.dept])||{en:e.dept,ar:e.dept};
    var name=_e(isAr?(dm.ar||dm.en):dm.en);
    var row=document.createElement('div');row.style.cssText='padding:10px 0;border-bottom:1px solid rgba(14,116,144,.12);';
    row.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">'
      +'<span style="font-size:11px;color:#64748b">'+name+'</span>'
      +'<span style="font-size:14px;font-weight:900;color:'+_col(e.fc)+';font-family:var(--mono)">'+((e.fc!==null&&e.fc!==undefined&&isFinite(e.fc))?e.fc.toFixed(2)+'%':'—')+'</span>'
      +'</div>'
      +'<div style="height:4px;background:rgba(14,116,144,.12);border-radius:2px">'
      +'<div style="height:4px;background:'+_col(e.fc)+';border-radius:2px;width:'+((e.fc!==null&&e.fc!==undefined&&isFinite(e.fc))?Math.min(100,Math.round(e.fc)):0)+'%"></div>'
      +'</div>';
    dr.appendChild(row);
  });
  box.appendChild(hdr);box.appendChild(sum);box.appendChild(dl);box.appendChild(dr);
  ov.appendChild(box);
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}
window._showForecastDrilldown=_showForecastDrilldown;


/* == KPI cards grouped by department — with embedded dept summary == */
function renderExecKpiCards(ks){
  const el=document.getElementById('execKpiCards');
  if(!el)return;
  if(!ks.length){el.innerHTML=emptyStateExec(F.dept,F.status);return;}
  const isAllYr=F.year==='all';

  /* ── KPI detail popup ── */
  window._showKpiDetail=(kId)=>{
    const k=allK().find(x=>x.id===kId);if(!k)return;
    const v=qv(k),dm=DM[k.dept];
    const old=document.getElementById('kpiDetailOv');if(old)old.remove();
    const ov=document.createElement('div');
    ov.id='kpiDetailOv';
    ov.style.cssText='position:fixed;inset:0;background:rgba(10,22,48,.60);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center';
    ov.onclick=function(e){if(e.target===ov)ov.remove();};

    const pciData=(ST.pci||{})[k.id]||{};
    const quarters=['q1','q2','q3','q4'];
    const qLabels=['Q1','Q2','Q3','Q4'];
    const anyPCI=quarters.some(function(q){return (pciData[q]||{}).planned>0;});
    /* Check for custom-field master config */
    const _masterCfg=(typeof _findMasterKpiByName==='function')?_findMasterKpiByName(k.nameEn||''):null;
    const _hasCustom=!!((_masterCfg&&_masterCfg.config&&_masterCfg.config.fieldConfig&&_masterCfg.config.fieldConfig.length>0));
    const _customFields=_hasCustom?_masterCfg.config.fieldConfig:null;

    const qRows=quarters.map(function(q,i){
      const qv2=k[q];
      const pci=pciData[q]||{};
      const pl=pci.planned>0?pci.planned:null;
      const co=pl!==null?pci.complete:null;
      const ic=pl!==null?(pci.planned-(pci.complete||0)):null;
      const hasPCI=pl!==null;
      const pct=hasPCI?Math.min(100,Math.round((pci.complete||0)/pl*100)):0;
      const isMet=qv2!==null&&qv2>=k.target;
      const bg=qv2===null?'#F8FAFC':isMet?'rgba(22,163,74,.05)':'rgba(220,38,38,.05)';
      const bc=qv2===null?'#E2E8F0':isMet?'rgba(22,163,74,.20)':'rgba(220,38,38,.18)';
      const tc=qv2===null?'#94A3B8':isMet?'#16A34A':'#DC2626';
      return '<div style="background:'+bg+';border:1px solid '+bc+';border-radius:12px;padding:14px 16px;min-height:150px;box-sizing:border-box;">'
        +'<div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">'+qLabels[i]+'</div>'
        +'<div style="font-size:28px;font-weight:900;color:'+tc+';font-family:var(--mono);line-height:1;margin-bottom:6px">'+(qv2!==null?qv2.toFixed(1)+'%':'—')+'</div>'
        +'<div style="font-size:9px;font-weight:600;color:#94A3B8;margin-bottom:12px">'+(qv2!==null?(isMet?'&#10003; Met':'&#10007; Below target'):'Pending')+'</div>'
        +'<div style="border-top:1px solid '+bc+';padding-top:8px">'+(_hasCustom  ?/* Custom field display */    (function(){      var _html='';      var _qd=pciData[q]||{};      (_customFields||[]).forEach(function(f,fi){        var letter=String.fromCharCode(65+fi);        var fval=_qd[letter];        var fDisplay=fval!==undefined&&fval!==null&&fval!==''?fval:'—';        _html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">'          +'<span style="font-size:8.5px;color:#64748B;line-height:1.3;flex:1;padding-right:6px">'+htmlEsc(f.nameEn||letter)+'</span>'          +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:#93C5FD;white-space:nowrap">'+fDisplay+'</span>'          +'</div>';      });      if(_qd._result!==undefined&&_qd._result!==null){        _html+='<div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,.08)">'          +'<span style="font-size:8.5px;color:#67E8F9">Result</span>'          +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:#67E8F9">'+Math.round(_qd._result*10)/10+'%</span>'          +'</div>';      }      return _html;    })()  :/* Standard Planned/Complete/Incomplete display */    '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'    +'<span style="font-size:9px;color:#64748B">Planned</span>'    +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:#475569">'+(hasPCI?pl:'—')+'</span>'    +'</div>'    +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'    +'<span style="font-size:9px;color:#16A34A">Complete</span>'    +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:#16A34A">'+(hasPCI?pci.complete:'—')+'</span>'    +'</div>')+(_hasCustom?'':(
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'  
          +'<span style="font-size:9px;color:#DC2626">Incomplete</span>'  
          +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:#DC2626">'+(hasPCI?ic:'—')+'</span>'  
          +'</div>'  
          +'<div style="height:5px;background:rgba(0,0,0,.08);border-radius:4px;overflow:hidden;margin-bottom:6px">'  
            +'<div style="width:'+pct+'%;height:100%;background:'+(pct>=100?'#16A34A':'#0195af')+';border-radius:4px"></div>'  
          +'</div>'  
          +(hasPCI?'<div style="font-size:9px;color:#94A3B8;text-align:right;margin-top:3px">'+pct+'%</div>':'')
        ))
        +'</div>'
      +'</div>';
    }).join('');

    const op=v!==null?+v.toFixed(1):null;
    const isMet=op!==null&&op>=k.target;
    const gap=op!==null?+(k.target-op).toFixed(1):null;

    const inner=document.createElement('div');
    inner.style.cssText='background:#fff;border-radius:16px;padding:24px;width:600px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(10,22,48,.28);position:relative';
    inner.innerHTML=''
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
        +'<div style="width:40px;height:40px;border-radius:11px;background:'+dm.color+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
          +'<span style="font-size:12px;font-weight:900;color:'+dm.color+'">'+dm.abbr+'</span>'
        +'</div>'
        +'<div style="flex:1">'
          +'<div style="font-size:10px;font-weight:700;color:'+dm.color+';text-transform:uppercase">'+k.id+' &middot; '+dm.en+' &middot; '+k.yr+'</div>'
          +'<div style="font-size:13px;font-weight:800;color:#152538;line-height:1.35;word-break:break-word">'+k.nameEn+'</div>'
        +'</div>'
        +'<div style="text-align:right;flex-shrink:0">'
          +'<div style="font-size:30px;font-weight:900;color:'+(isMet?'#16A34A':op!==null?'#DC2626':'#94A3B8')+';font-family:var(--mono);line-height:1.1">'+(op!==null?op+'%':'—')+'</div>'
          +'<div style="font-size:9.5px;color:#94A3B8">Target: '+(k.op==='='?'=':'&ge;')+k.target+'%'+(gap!==null&&gap>0?' &middot; Gap: '+gap+'%':'')
          +(function(){
            var QTRS=['q1','q2','q3','q4'],QLBLS=['Q1','Q2','Q3','Q4'];
            var lastIdx=-1;
            for(var i=0;i<4;i++){if(k[QTRS[i]]!==null&&k[QTRS[i]]!==undefined)lastIdx=i;}
            if(lastIdx<0||lastIdx>2)return '';
            var curVal=k[QTRS[lastIdx]];
            var nxtQ=QTRS[lastIdx+1];
            var prevK=allK().filter(function(x){return x.yr===k.yr-1&&x.dept===k.dept&&x.nameEn===k.nameEn;})[0];
            if(!prevK)return '<div style="font-size:9px;color:#94A3B8;margin-top:2px">Forecast: Insufficient Data</div>';
            var pCur=prevK[QTRS[lastIdx]],pNxt=prevK[nxtQ];
            if(pCur==null||pNxt==null)return '<div style="font-size:9px;color:#94A3B8;margin-top:2px">Forecast: Insufficient Data</div>';
            var fc=Math.min(100,Math.max(0,+(curVal+(pNxt-pCur)).toFixed(1)));
            var ok=fc>=k.target;
            return '<div style="font-size:9px;font-weight:700;margin-top:3px;color:'+(ok?'#16A34A':'#DC2626')+'">Forecast '+QLBLS[lastIdx+1]+'\''+(String(k.yr).slice(2))+': <span style="font-family:var(--mono)">'+fc+'%</span></div>';
          }())+'</div>'
        +'</div>'
      +'</div>'
      +(!anyPCI?'<div style="background:#FFF7ED;border:1px solid rgba(217,119,6,.25);border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:10.5px;color:#92400E">'
        +'&#9888; No PCI data entered yet &mdash; go to <strong>Admin Panel &rarr; Edit KPI</strong> to add Planned / Complete numbers per quarter.'
        +'</div>':'')
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:4px">'+qRows+'</div>';

    const closeBtn=document.createElement('button');
    closeBtn.textContent=(typeof lang!=='undefined'&&lang==='ar')?'إغلاق':'✕ Close';
    closeBtn.style.cssText='width:100%;margin-top:16px;padding:10px;background:#152538;color:#fff;border:none;border-radius:9px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer';
    closeBtn.onclick=function(){ov.remove();};

    const xBtn=document.createElement('button');
    xBtn.innerHTML='&times;';
    xBtn.style.cssText='position:absolute;top:14px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#94A3B8;line-height:1';
    xBtn.onclick=function(){ov.remove();};

    inner.appendChild(closeBtn);
    inner.appendChild(xBtn);
    ov.appendChild(inner);
    document.body.appendChild(ov);
  };

  /* ── KPI card builder — flex column, same height via grid stretch ── */
  const mkCard=(k)=>{
    const v=qv(k),a=ok(k);
    const miss=a===false,met=a===true;
    const dC=DM[k.dept]?.color||'#64748B';
    const acC=miss?'#DC2626':met?'#16A34A':'#94A3B8';
    const lB=miss?'#DC2626':met?'#16A34A':'#CBD5E1';
    const rc=getRepeat(k);
    let yStr='',yC='#94A3B8';
    if(k.yoy!==undefined&&k.yoy!==null&&k.yoy!==0&&v!==null){
      const d=+((v-k.yoy)/Math.abs(k.yoy)*100).toFixed(1);
      yStr=(d>=0?'▲':'▼')+' '+Math.abs(d).toFixed(1)+'%';
      yC=d>=0?'#16A34A':'#DC2626';
    }
    const pB=v!==null?Math.min(100,Math.max(0,Math.round(v/k.target*100))):0;
    return ''
      +'<div style="'
        +'background:'+(miss?'rgba(220,38,38,.025)':met?'rgba(22,163,74,.018)':'var(--card)')+';'
        +'border:1.5px solid '+(miss?'rgba(220,38,38,.28)':met?'rgba(22,163,74,.22)':'var(--border)')+';'
        +'border-left:4px solid '+lB+';'
        +'border-radius:10px;padding:14px;box-sizing:border-box;'
        +'display:flex;flex-direction:column;height:100%">'
        /* badges row */
        +'<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex-shrink:0">'
          +'<span style="font-size:10px;font-weight:800;font-family:var(--mono);color:'+dC+'">'+k.id+'</span>'
          +'<span class="tier-b '+((k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b')+'" style="font-size:8px">T'+(k.tier||3)+'</span>'
          +(rc>=2?'<span class="repeat-b">\u21a9'+rc+'x</span>':'')
          +'<span class="'+(a===null?'pill-pend':met?'pill-ok':'pill-miss')+'" style="font-size:9px;margin-left:auto">'+(a===null?'\u2014':met?'\u2713 Met':'\u2715 Missed')+'</span>'
        +'</div>'
        /* KPI name — flex:1 pushes everything below to bottom */
        +'<div style="font-size:11.5px;font-weight:700;color:var(--t1);line-height:1.38;margin-top:8px;flex:1">'+(lang==='ar'?k.nameAr:k.nameEn)+'</div>'
        /* percentage — clickable */
        +'<div onclick="window._showKpiDetail(\''+k.id+'\')" title="Click for details"'
          +' style="font-size:34px;font-weight:900;color:'+acC+';font-family:var(--mono);line-height:1;margin-top:8px;cursor:pointer;flex-shrink:0"'
          +' onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'">'+(v!==null?v.toFixed(1)+'%':'\u2014')+'</div>'
        /* progress bar */
        +'<div style="height:5px;background:rgba(0,0,0,.08);border-radius:4px;overflow:hidden;margin-top:8px;flex-shrink:0">'
          +'<div style="width:'+pB+'%;height:100%;background:'+lB+';border-radius:4px"></div>'
        +'</div>'
        /* footer */
        +'<div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;margin-top:6px;flex-shrink:0">'
          +'<span style="color:var(--t3)">Target: '+(k.op==='='?'=':'\u2265')+k.target+'%</span>'
          +(yStr?'<span style="color:'+yC+';font-weight:700">vs PY: '+yStr+'</span>':'')
        +'</div>'
        /* gap button — visibility:hidden on met keeps equal height */
        +'<div style="margin-top:8px;flex-shrink:0">'
          +(miss
            ?'<div onclick="openGap(\''+k.id+'\')" style="padding:7px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.18);border-radius:7px;font-size:9px;font-weight:700;color:#DC2626;cursor:pointer;text-align:center" onmouseover="this.style.background=\'rgba(220,38,38,.14)\'" onmouseout="this.style.background=\'rgba(220,38,38,.07)\'">\u00bb View Gap Analysis</div>'
            :'<div style="padding:7px;visibility:hidden;font-size:9px">\u00bb placeholder</div>')
        +'</div>'
      +'</div>';
  };

  /* ── Dept stat box ── */
  const mkSt=(lb,val,c)=>''
    +'<div style="flex:1;background:var(--bg);border-radius:8px;padding:8px 10px;text-align:center;border:1px solid var(--border)">'
      +'<div style="font-size:38px;font-weight:900;color:'+c+';font-family:var(--mono);line-height:1.1">'+val+'</div>'
      +'<div style="font-size:8.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">'+lb+'</div>'
    +'</div>';

  /* ── One dept block ── */
  const mkD=(d,yrKs)=>{
    const dk=yrKs.filter(k=>k.dept===d);
    if(!dk.length)return'';
    const dm=DM[d];
    const nO=dk.filter(k=>ok(k)===true).length;
    const nM=dk.filter(k=>ok(k)===false).length;

    /* ── Year breakdown (when All years selected) ── */
    let yrBreakdown='';
    if(isAllYr){
      const yrs=[...new Set(dk.map(k=>k.yr))].sort((a,b)=>b-a);
      let ybHtml='<div style="display:flex;flex-direction:column;gap:0;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-top:2px">';
      yrs.forEach(function(yr,i){
        const yk=dk.filter(k=>k.yr===yr);
        const yO=yk.filter(k=>ok(k)===true).length;
        const yM=yk.filter(k=>ok(k)===false).length;
        const yEval=yk.filter(k=>ok(k)!==null).length;
        const yPct=yEval?Math.round(yO/yEval*100):0;
        const srt=[
          ...yk.filter(k=>ok(k)===false).sort(function(a,b){return(a.tier||3)-(b.tier||3);}),
          ...yk.filter(k=>ok(k)===true),
          ...yk.filter(k=>ok(k)===null)
        ];
        const cols=srt.length===1?'1fr':srt.length===3?'1fr 1fr 1fr':'1fr 1fr';
        const rowBg=i%2===0?'#F8FAFC':'#fff';
        ybHtml+=('<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:'+rowBg+';border-bottom:1px solid #E2E8F0">'
          +'<span style="font-size:11px;font-weight:800;color:'+dm.color+';font-family:var(--mono);min-width:36px">'+yr+'</span>'
          +'<div style="display:flex;gap:6px;flex:1">'
            +'<span style="font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;background:rgba(100,116,139,.10);color:#475569">'+yk.length+' KPIs</span>'
            +'<span style="font-size:13px;font-weight:800;padding:3px 12px;border-radius:20px;background:rgba(22,163,74,.10);color:#16A34A">✓ '+yO+' Met</span>'
            +(yM?'<span style="font-size:13px;font-weight:800;padding:3px 12px;border-radius:20px;background:rgba(220,38,38,.10);color:#DC2626">✕ '+yM+' Missed</span>':'')
          +'</div>'
          +'<div style="font-size:9px;font-weight:700;font-family:var(--mono);color:'+(yPct>=80?'#16A34A':yPct>=50?'#D97706':'#DC2626')+'">'+yPct+'%</div>'
        +'</div>'
        +'<div style="padding:10px;display:grid;grid-template-columns:'+cols+';grid-auto-rows:1fr;gap:8px;background:'+rowBg+'">'
          +srt.map(function(k){return mkCard(k);}).join('')
        +'</div>');
      });
      ybHtml+='</div>';
      yrBreakdown=ybHtml;
    }

    /* ── Normal (single year) sorted cards ── */
    const srt=isAllYr?[]:[
      ...dk.filter(k=>ok(k)===false).sort(function(a,b){return(a.tier||3)-(b.tier||3);}),
      ...dk.filter(k=>ok(k)===true),
      ...dk.filter(k=>ok(k)===null)
    ];
    const cols=(!isAllYr&&srt.length===1)?'1fr':(!isAllYr&&srt.length===3)?'1fr 1fr 1fr':'1fr 1fr';

    const deptBlock=(''
      +'<div style="display:flex;flex-direction:column;gap:12px;min-width:0;box-sizing:border-box;width:100%">'
        +'<div style="display:flex;align-items:stretch;gap:10px">'
          +'<div style="width:4px;border-radius:2px;background:'+dm.color+';flex-shrink:0"></div>'
          +'<div><div style="display:flex;align-items:baseline;gap:7px">'
            +'<span style="font-size:18px;font-weight:900;color:'+dm.color+';font-family:var(--mono)">'+dm.abbr+'</span>'
            +'<span style="font-size:12px;font-weight:600;color:var(--t2)">'+(lang==='ar'?dm.ar:dm.en)+'</span>'
          +'</div></div>'
        +'</div>'
        +'<div style="display:flex;gap:8px;width:100%">'
          +mkSt('KPIs',dk.length,'var(--t1)')+mkSt('✓ MET',nO,'#16A34A')+mkSt('✕ MISSED',nM,nM?'#DC2626':'var(--t3)')
        +'</div>'
        +(isAllYr
          ?yrBreakdown
          :('<div style="display:grid;grid-template-columns:'+cols+';grid-auto-rows:1fr;gap:10px;width:100%">'
            +srt.map(function(k){return mkCard(k);}).join('')
          +'</div>')
        )
      +'</div>'
    );
    return deptBlock;
  };

  const bldYr=(yrKs,yr)=>{
    let out='';
    if(isAllYr&&yr){
      out+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
        +'<div style="height:1px;flex:0 0 14px;background:var(--teal)"></div>'
        +'<span style="font-size:13px;font-weight:800;color:var(--teal);letter-spacing:.04em">'+yr+'</span>'
        +'<div style="height:1px;flex:1;background:var(--border2)"></div>'
      +'</div>';
    }
    /* Row 1: MNT + SAF   |   Row 2: HK + PMD */
    [['maintenance','safety'],['housekeeping','projects']].forEach(([d1,d2],ri)=>{
      const s1=mkD(d1,yrKs),s2=mkD(d2,yrKs);
      if(!s1&&!s2)return;
      const oneOnly=(!!s1)!=(!!s2);
      out+=''
        +'<div class="qumc-kpi-dept-row '+(oneOnly?'qumc-one-dept-row':'')+'" style="'
          +'display:grid;grid-template-columns:'+(oneOnly?'1fr':'1fr 1fr')+';gap:'+(oneOnly?'0':'24px')+';align-items:start;justify-content:stretch;width:100%;'
          +'margin-bottom:'+(ri===0?'24px':'0')+';'
          +'padding-bottom:'+(ri===0?'20px':'0')+';'
          +(ri===0?'border-bottom:1px solid var(--border2);':'')
        +'">'
          +(s1||'')
          +(s2||'')
        +'</div>';
    });
    return out;
  };

  /* ── Final render ── */
  let out='';
  if(isAllYr){
    /* Pass ALL ks to bldYr so mkD can do its own year grouping */
    out=bldYr(ks,null);
  }else{
    out=bldYr(ks,null);
  }
  el.innerHTML=out;
}

function buildIntelRisks(missKpis, repKpis){
  const el=document.getElementById('intelPanel');
  if(!el)return;

  /* ── Analytics (filter-aware) ── */
  const allKs   = filt();
  const evalKs  = allKs.filter(k=>ok(k)!==null);
  const metKs   = evalKs.filter(k=>ok(k)===true);
  const missAll = evalKs.filter(k=>ok(k)===false);
  const pendKs  = allKs.filter(k=>ok(k)===null);
  const pct     = evalKs.length ? Math.round(metKs.length/evalKs.length*100) : 0;

  /* Worst gap KPI */
  const worstK = missAll.reduce((a,k)=>{
    const v=qv(k); if(v===null)return a;
    const g=k.target-v;
    return(!a||g>a.g)?{k,g}:a;
  },null);

  /* Best performing dept */
  const deptPct = Object.keys(DM).map(d=>{
    const dk=evalKs.filter(k=>k.dept===d);
    return dk.length?{d, pct:Math.round(dk.filter(k=>ok(k)===true).length/dk.length*100)}:null;
  }).filter(Boolean).sort((a,b)=>b.pct-a.pct);

  /* YoY comparison */
  const ks26=allKs.filter(k=>k.yr===2026&&k.q1!==null&&k.yoy!==null);
  const yoyImproved=ks26.filter(k=>k.q1>k.yoy).length;
  const yoyDeclined=ks26.filter(k=>k.q1<k.yoy).length;

  /* Tier 1 risks */
  const t1Miss=missAll.filter(k=>(k.tier||3)===1);

  /* Analytical summary (filter-aware) */
  const filterLabel = F.dept!=='all'
    ? (DM[F.dept]?.en||'') + (F.year!=='all'?' ('+F.year+')':'')
    : F.year!=='all' ? String(F.year) : 'the Division';

  let summLines=[];
  summLines.push(filterLabel+' achieved <strong style="color:'+(pct>=75?'#16A34A':pct>=50?'#D97706':'#DC2626')+';font-weight:800">'+pct+'%</strong> ('+metKs.length+' of '+evalKs.length+' KPIs met).');
  if(worstK) summLines.push('Highest gap: <strong style="color:#DC2626">'+worstK.k.id+'</strong> at '+(qv(worstK.k)||0).toFixed(1)+'% vs '+worstK.k.target+'% target (–'+worstK.g.toFixed(1)+'%).');
  if(deptPct.length>0) summLines.push('Best dept: <strong style="color:'+DM[deptPct[0].d].color+'">'+DM[deptPct[0].d].en+'</strong> ('+deptPct[0].pct+'%). Needs attention: <strong style="color:'+DM[deptPct[deptPct.length-1].d].color+'">'+DM[deptPct[deptPct.length-1].d].en+'</strong> ('+deptPct[deptPct.length-1].pct+'%).');
  if(ks26.length>0) summLines.push('YoY: '+yoyImproved+' KPIs improved, '+yoyDeclined+' declined vs prior year Q1.');
  if(t1Miss.length>0) summLines.push('<span style="color:#DC2626;font-weight:700">⚠ '+t1Miss.length+' Tier-1 patient safety KPI'+(t1Miss.length>1?'s':'')+' require immediate action.</span>');
  if(pendKs.length>0) summLines.push(pendKs.length+' KPI'+(pendKs.length>1?'s':'')+' pending data entry.');

  /* Last Updated */
  const tEl=document.getElementById('intelUpdateTime');
  if(tEl)tEl.textContent=tText('last_updated')+': '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});

  /* ── Helpers ── */
  const tB=(t,lg)=>{
    const c=t===1?'#DC2626':t===2?'#D97706':'#0195af';
    const bg=t===1?'rgba(220,38,38,.10)':t===2?'rgba(217,119,6,.10)':'rgba(1,149,175,.10)';
    return'<span style="display:inline-block;padding:2px 7px;border-radius:5px;font-size:'+(lg?'10':'9')+'px;font-weight:800;color:'+c+';background:'+bg+'">T'+t+'</span>';
  };
  const rB=n=>'<span style="display:inline-block;padding:2px 7px;border-radius:20px;font-size:8.5px;font-weight:700;background:rgba(217,119,6,.12);color:#D97706">+'+n+'x</span>';

  const dIcon=dept=>{
    const p={maintenance:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',safety:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',housekeeping:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',projects:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h2a2 2 0 0 1 2 2v2M8 3H6a2 2 0 0 0-2 2v2"/>'};
    const c={maintenance:'#0195af',safety:'#DC2626',housekeeping:'#16A34A',projects:'#D97706'}[dept]||'#64748B';
    return'<div style="width:30px;height:30px;border-radius:50%;background:'+c+'1A;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      +'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(p[dept]||'')+'</svg></div>';
  };

  const tArrow=k=>{
    const v=qv(k),pr=k.yoy;
    if(v===null||pr===null||pr===undefined)return'<span style="color:#CBD5E1;font-size:12px">—</span>';
    const up=v>=pr,c=up?'#16A34A':'#DC2626';
    return'<svg width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="'+c+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
      +(up?'<polyline points="2,18 8,10 13,13 21,4"/><polyline points="15,4 21,4 21,10"/>':'<polyline points="2,4 8,12 13,9 21,18"/><polyline points="15,18 21,18 21,12"/>')
      +'</svg>';
  };

  /* ── CRITICAL RISKS ── */
  const topMiss=missKpis.slice(0,4);
  const riskH=topMiss.length
    ?topMiss.map(k=>{
        const v=qv(k),rc=getRepeat(k),dC=DM[k.dept]?.color||'#64748B';
        return'<div style="display:flex;align-items:center;gap:8px;padding:9px 13px;margin-bottom:7px;background:#FFF5F5;border:1px solid rgba(220,38,38,.14);border-left:3px solid #DC2626;border-radius:0 8px 8px 0;transition:background .15s"'
          +' onmouseover="this.style.background=\'#FEE2E2\'" onmouseout="this.style.background=\'#FFF5F5\'">'
          +'<span style="font-size:10.5px;font-weight:800;font-family:var(--mono);color:'+dC+';min-width:64px;flex-shrink:0">'+k.id+'</span>'
          +tB(k.tier||3)+(rc>=2?'<span style="margin-left:3px">'+rB(rc)+'</span>':'')
          +'<span style="font-size:10px;color:#475569;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:5px">'+k.nameEn+' \u2014 '+(v!==null?v.toFixed(1)+'%':'\u2014')+' / '+k.target+'%</span>'
        +'</div>';
      }).join('')
    :'<p style="font-size:11px;color:#94A3B8;margin:8px 0">No critical risks \u2014 all KPIs on track</p>';

  /* ── RECOMMENDATIONS (analytical) ── */
  const recItems=[
    t1Miss.length>0  ? {t:'Immediate: Address '+t1Miss.length+' Tier 1 Safety KPI'+(t1Miss.length>1?'s':''),s:'Patient safety at risk — requires executive escalation'} : null,
    missAll.length>=3 ? {t:'Chronic underperformance in '+missAll.length+' KPIs',s:'Root cause analysis and corrective actions required'} : null,
    yoyDeclined>0     ? {t:yoyDeclined+' KPI'+(yoyDeclined>1?'s':'')+' declined vs prior year Q1',s:'Review improvement plans for declining indicators'} : null,
    (repKpis||[]).length>0 ? {t:'Gap analysis incomplete for repeat misses',s:'Enter root causes & corrective actions'} : null,
    missAll.length===0 ? {t:'All KPIs on track — excellent performance',s:'Continue monitoring and sustaining current results'} : null,
    pendKs.length>0   ? {t:pendKs.length+' KPI'+(pendKs.length>1?'s':'')+' awaiting data entry',s:'Complete quarterly data to enable full analysis'} : null,
  ].filter(Boolean).slice(0,3);

  const recH=recItems.map(r=>
    '<div style="display:flex;gap:10px;padding:10px 13px;background:#F0FDF4;border-radius:9px;border:1px solid rgba(22,163,74,.15);margin-bottom:8px">'
    +'<div style="width:22px;height:22px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">'
      +'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
    +'</div>'
    +'<div><div style="font-size:11px;font-weight:700;color:#152538;line-height:1.35">'+r.t+'</div>'
    +'<div style="font-size:9.5px;color:#64748B;margin-top:2px">'+r.s+'</div></div>'
  +'</div>').join('');

  /* ── REPEAT MISSES ── */
  const repRows=(repKpis&&repKpis.length?repKpis:missKpis).slice(0,5);
  const repH=!repRows.length?'':
    '<div style="display:grid;grid-template-columns:1fr 170px 92px 82px 120px;gap:0">'
      /* Header */
      +'<div style="padding:7px 20px;font-size:8.5px;font-weight:700;color:#94A3B8;letter-spacing:.09em;text-transform:uppercase;border-bottom:1px solid #F0F4F8"></div>'
      +['DEPARTMENT','RISK TIER','TREND','LAST RESULT'].map(h=>
        '<div style="padding:7px 12px;font-size:8.5px;font-weight:700;color:#94A3B8;letter-spacing:.09em;text-transform:uppercase;text-align:center;border-bottom:1px solid #F0F4F8">'+h+'</div>'
      ).join('')
      /* Rows */
      +repRows.map((k,i)=>{
        const v=qv(k),rc=getRepeat(k),dm=DM[k.dept],dC=dm.color;
        const bg=i%2===0?'#fff':'#FAFBFC';
        return'<div style="display:contents">'
          +'<div style="padding:10px 20px;background:'+bg+';border-bottom:1px solid #F8FAFC">'
            +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">'
              +'<span style="font-size:11px;font-weight:800;font-family:var(--mono);color:'+dC+'">'+k.id+'</span>'
              +'<span style="font-size:9px;color:#94A3B8">'+rc+' quarters</span>'
              +tB(k.tier||3)
            +'</div>'
            +'<div style="font-size:10px;color:#64748B">'+k.nameEn+'</div>'
          +'</div>'
          +'<div style="padding:10px 12px;background:'+bg+';border-bottom:1px solid #F8FAFC;display:flex;align-items:center;justify-content:center"><span style="font-size:10.5px;font-weight:600;color:#334155">'+dm.en+'</span></div>'
          +'<div style="padding:10px 12px;background:'+bg+';border-bottom:1px solid #F8FAFC;display:flex;align-items:center;justify-content:center">'+tB(k.tier||3,true)+'</div>'
          +'<div style="padding:10px 12px;background:'+bg+';border-bottom:1px solid #F8FAFC;display:flex;align-items:center;justify-content:center">'+tArrow(k)+'</div>'
          +'<div style="padding:10px 20px;background:'+bg+';border-bottom:1px solid #F8FAFC;display:flex;align-items:center;justify-content:flex-end;font-size:10.5px;font-family:var(--mono)">'
            +(v!==null
              ?'<span style="font-weight:800;color:'+(v>=k.target?'#16A34A':'#DC2626')+'">'+v.toFixed(1)+'%</span><span style="color:#94A3B8;margin-left:3px">/ '+k.target+'%</span>'
              :'<span style="color:#94A3B8">\u2014</span>')
          +'</div>'
        +'</div>';
      }).join('')
    +'</div>';

  /* ── Final layout (matches image) ── */
  el.innerHTML=
    /* 3-col top */
    '<div style="display:grid;grid-template-columns:240px 1fr 276px;gap:0">'
      /* SUMMARY */
      +'<div style="padding:18px 20px 20px;border-right:1px solid #F0F4F8;align-self:start">'
        +'<div style="font-size:9px;font-weight:800;color:#64748B;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px">Summary</div>'
        +'<div style="font-size:11.5px;color:#334155;line-height:1.75">'+summLines.map(l=>'<p style="margin:0 0 8px">'+l+'</p>').join('')+'</div>'
      +'</div>'
      /* CRITICAL RISKS */
      +'<div style="padding:18px 20px 20px;border-right:1px solid #F0F4F8">'
        +'<div style="font-size:9px;font-weight:800;color:#64748B;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px">Critical Risks</div>'
        +riskH
      +'</div>'
      /* RECOMMENDATIONS */
      +'<div style="padding:18px 20px 20px">'
        +'<div style="font-size:9px;font-weight:800;color:#64748B;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px">Recommendations</div>'
        +recH
      +'</div>'
    +'</div>'
    /* REPEAT MISSES */
    +(repRows.length
      ?'<div style="border-top:1px solid #F0F4F8"><div style="padding:10px 20px 6px;font-size:9px;font-weight:800;color:#64748B;letter-spacing:.12em;text-transform:uppercase">Repeat Misses</div>'+repH+'</div>'
      :'');
}

function renderRAG(ks){
  const el=document.getElementById('ragMatrix');if(!el)return;
  const cols='62px 1fr 65px 50px 55px 55px 55px 55px 58px 55px 48px 78px';
  const hs=lang==='ar'
    ?['الكود','المؤشر','القسم','الهدف','Q1','Q2','Q3','Q4','المتوسط','YoY','مخاطر','الحالة']
    :['Code','KPI Name','Dept','Target','Q1','Q2','Q3','Q4','Avg','YoY','Risk','Status'];
  let tbl=`<div style="display:grid;grid-template-columns:${cols};gap:2px;padding:6px 2px;border-bottom:1px solid var(--border2);position:sticky;top:0;background:var(--card);z-index:1">
    ${hs.map(x=>`<div style="font-size:9px;font-weight:700;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;padding:0 4px">${x}</div>`).join('')}
  </div>`;
  const deps=['maintenance','safety','housekeeping','projects'];
  deps.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    const dm=DM[d];
    /* Dept header with colored left border */
    tbl+=`<div style="display:flex;align-items:center;gap:0;margin:8px 0 3px">
      <div style="width:3px;height:20px;background:${dm.color};border-radius:2px;flex-shrink:0;margin-right:8px"></div>
      <span style="font-size:9.5px;font-weight:800;color:${dm.color};text-transform:uppercase;letter-spacing:.08em">${dm.abbr}</span>
      <span style="font-size:9px;font-weight:600;color:var(--t2);margin-left:6px">${lang==='ar'?dm.ar:dm.en}</span>
    </div>`;
    dk.forEach(k=>{
      const v=qv(k),a=ok(k),c=kc(k);
      const yStr=k.yoy!==undefined&&k.yoy!==null&&k.q1!==null?((k.q1-k.yoy>=0?'+':'')+(k.q1-k.yoy).toFixed(1)+'%'):'\u2014';
      const yC=k.yoy!==undefined&&k.yoy!==null&&k.q1!==null?(k.q1>=k.yoy?'var(--green)':'var(--red)'):'var(--t3)';
      const rc=getRepeat(k);const isMissed=a===false;
      tbl+=`<div style="display:grid;grid-template-columns:${cols};gap:2px;padding:5px 0;border-bottom:1px solid var(--border);align-items:center;${isMissed?'cursor:pointer;':'cursor:default;'}"
        ${isMissed?`onclick="openGap('${k.id}')"`:''}
        ${isMissed?`onmouseover="this.style.background='rgba(220,38,38,.04)'" onmouseout="this.style.background='transparent'"`:''}>
        <div style="padding:0 4px"><div style="font-size:9px;font-family:var(--mono);font-weight:700;color:var(--teal)">${k.id}</div>${rc>=2?`<span class="repeat-b" style="margin-top:2px">\u21a9${rc}</span>`:''}</div>
        <div style="font-size:10.5px;color:var(--t2);padding:0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lang==='ar'?k.nameAr:k.nameEn}</div>
        <div style="font-size:9px;color:${DM[k.dept].color};padding:0 4px;font-weight:600">${DM[k.dept].abbr}</div>
        <div style="font-size:9.5px;font-family:var(--mono);color:var(--t3);padding:0 4px">${k.op==='='?'=':'\u2265'}${k.target}%</div>
        ${['q1','q2','q3','q4'].map(q=>{const v2=k[q];const b=pb(v2,k);const _qMissed=(b===1);return`<div ${_qMissed?`onclick="event.stopPropagation();openGapQuarter('${k.id}','${q}')" title="View gap details for ${q.toUpperCase()}"`:''} style="font-size:9.5px;font-family:var(--mono);padding:2px 4px;border-radius:3px;background:${BC[b]};color:${b===3?'#1a1200':'#fff'};text-align:center${_qMissed?';cursor:pointer;text-decoration:underline dotted':''}">${v2!==null?v2.toFixed(0)+'%':'\u2014'}</div>`;}).join('')}
        <div style="font-size:10px;font-family:var(--mono);font-weight:700;color:${c};padding:0 4px">${f2(v)}</div>
        <div style="font-size:9.5px;font-family:var(--mono);color:${yC};font-weight:700;padding:0 4px">${yStr}</div>
        <span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">T${k.tier||3}</span>
        <span class="${a===null?'pill-pend':a?'pill-ok':'pill-miss'}" style="font-size:9px${isMissed?';cursor:pointer':''}">
          ${a===null?'\u2014':a?'\u2713 Met':'Missed'}${isMissed?'<span style="font-size:8px;opacity:.7;margin-left:2px">\u2197</span>':''}
        </span>
      </div>`;
    });
  });
  el.innerHTML=`<div class="card c12 r4"><div class="ch">\u{1F4CA} ${lang==='ar'?'مصفوفة RAG':'RAG Status Matrix \u2014 Click missed KPI for gap details'}<div class="ch-r">${ks.length} ${lang==='ar'?'مؤشر':'KPIs'}</div></div><div class="cb sc" style="padding:4px 10px 10px">${tbl}</div></div>`;
}


function renderDept(){
  if(typeof F==='undefined'||!F||typeof F!=='object'){
    renderDept._retries=(renderDept._retries||0)+1;
    if(renderDept._retries<=5){
      console.warn('[Dashboard] F not ready — retry '+renderDept._retries+'/5');
      setTimeout(renderDept,150);
    } else {
      console.error('[Dashboard] F never initialised — giving up.');
      renderDept._retries=0;
    }
    return;
  }
  renderDept._retries=0;
  const el=document.getElementById('deptGrid');
  if(!el)return;
  const depts=F.dept==='all'?['maintenance','safety','housekeeping','projects']:[F.dept];
  const TEAL='#0195af';

  function _trendGroupKey(k){
    var nm=String((k&&k.nameEn)||'').trim().toLowerCase().replace(/[^a-z0-9؀-ۿ]/gi,'_');
    return nm||String((k&&k.id)||'').replace(/[^A-Z0-9]/gi,'');
  }
  function _trendQVal(k,q){
    if(!k)return null;
    if(k[q]!==null&&k[q]!==undefined)return k[q];
    try{
      var pci=(typeof ST!=='undefined'&&ST.pci&&ST.pci[k.id]&&ST.pci[k.id][q])?ST.pci[k.id][q]:null;
      if(!pci)return null;
      if(pci._result!==null&&pci._result!==undefined)return pci._result;
      if(pci.planned&&pci.planned>0&&pci.complete!==undefined)return Math.min(100,Math.round(((pci.complete||0)/pci.planned)*100));
    }catch(_e){}
    return null;
  }
  function _trendLabels(records){
    var seen={};
    records.forEach(function(k){
      ['q1','q2','q3','q4'].forEach(function(q,idx){
        if(_trendQVal(k,q)!==null){
          var yr=parseInt(k.yr,10)||new Date().getFullYear();
          seen[yr+'_'+q]={yr:yr,q:q,idx:idx,label:'Q'+(idx+1)+"'"+String(yr).slice(-2)};
        }
      });
    });
    return Object.values(seen).sort(function(a,b){return a.yr-b.yr||a.idx-b.idx;});
  }
  function _trendSeries(records,labels){
    records=(records||[]).slice().sort(function(a,b){return (parseInt(a.yr,10)||0)-(parseInt(b.yr,10)||0)||String(a.id).localeCompare(String(b.id));});
    var idSet=[];records.forEach(function(k){if(k&&idSet.indexOf(k.id)<0)idSet.push(k.id);});
    var data=labels.map(function(l){
      for(var i=0;i<records.length;i++){
        var k=records[i];
        if((parseInt(k.yr,10)||0)!==l.yr)continue;
        var v=_trendQVal(k,l.q);
        if(v!==null)return v;
      }
      return null;
    });
    return {label:idSet.join(' / '),data:data};
  }

  function drawBar(cid,groups,dC){
    setTimeout(function(){
      dch(cid);var cv=document.getElementById(cid);if(!cv)return;
      var labels=groups.map(function(g){return(g.k26||g.k25).id;});
      var results=groups.map(function(g){return qv(g.k26||g.k25);});
      var targets=groups.map(function(g){return(g.k26||g.k25).target;});
      var allV=results.filter(function(v){return v!==null;});
      if(!allV.length)return;
      CH[cid]=mkChart(cid,{type:'bar',data:{labels:labels,datasets:[
        {label:'Result',data:results,backgroundColor:results.map(function(v,i){return v===null?'#E2E8F0':v>=targets[i]?dC+'BB':'rgba(220,38,38,.65)';

        }),borderRadius:5,borderSkipped:false,barPercentage:.6},
        {type:'line',label:'Target',data:targets,borderColor:TEAL,borderWidth:2,borderDash:[6,3],pointRadius:0,fill:false,order:0}
      ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',labels:{font:{size:8},boxWidth:10,padding:6,color:'#475569'}}},
        scales:{y:{min:0,max:105,ticks:{callback:function(v){return v+'%';},font:{size:8},maxTicksLimit:5},grid:{color:'rgba(20,35,80,.05)'}},
          x:{ticks:{font:{size:8},maxRotation:40},grid:{display:false}}}}});
    },80);
  }

  function drawTrend(cid,groups,dC){
    setTimeout(function(){
      dch(cid);var cv=document.getElementById(cid);if(!cv)return;
      var TEAL2=TEAL;
      var colors=['#0195af','#16A34A','#D97706','#7C3AED','#DC2626','#0891B2','#0F766E','#BE123C'];
      var flat=[];
      (groups||[]).forEach(function(g){
        if(g&&Array.isArray(g.records)) flat=flat.concat(g.records);
        else { if(g&&g.k25)flat.push(g.k25); if(g&&g.k26)flat.push(g.k26); }
      });
      flat=flat.filter(function(k){return k&&k.id;});
      var labelsObj=_trendLabels(flat);
      if(!labelsObj.length)return;
      var labels=labelsObj.map(function(x){return x.label;});
      var ds=[];
      var isComparison=(groups||[]).length>1;
      if(isComparison){
        (groups||[]).forEach(function(g,i){
          var recs=g.records||[g.k25,g.k26].filter(Boolean);
          var ser=_trendSeries(recs,labelsObj);
          if(!ser.data.some(function(v){return v!==null;}))return;
          var col=colors[i%colors.length];
          ds.push({label:ser.label,data:ser.data,borderColor:col,backgroundColor:col+'10',fill:false,tension:.35,pointRadius:ser.data.map(function(v){return v!==null?4:0;}),pointBackgroundColor:ser.data.map(function(v){return v===null?'transparent':col;}),borderWidth:2,spanGaps:true});
        });
      }else{
        var ser=_trendSeries(flat,labelsObj);
        if(!ser.data.some(function(v){return v!==null;}))return;
        var sample=flat[flat.length-1]||flat[0];
        var tgt0=(sample&&sample.target)||90;
        var entered=ser.data.filter(function(v){return v!==null;});
        var last=entered.length?entered[entered.length-1]:null;
        var lc=last!==null&&last>=tgt0?dC:'#DC2626';
        ds.push({label:ser.label,data:ser.data,borderColor:lc,backgroundColor:lc+'10',fill:true,tension:.35,pointRadius:ser.data.map(function(v){return v!==null?4:0;}),pointBackgroundColor:ser.data.map(function(v){return v===null?'transparent':v>=tgt0?dC:'#DC2626';}),borderWidth:2.2,spanGaps:true});
      }
      if(!ds.length)return;
      var tgt=(flat[flat.length-1]&&flat[flat.length-1].target)||(flat[0]&&flat[0].target)||90;
      ds.push({label:'Target',data:labels.map(function(){return tgt;}),borderColor:TEAL2,borderWidth:1.5,borderDash:[5,3],pointRadius:0,fill:false,spanGaps:true,backgroundColor:'transparent'});
      var allV=ds.flatMap(function(d){return d.data;}).filter(function(v){return v!==null;});
      if(!allV.length)return;
      CH[cid]=mkChart(cid,{type:'line',data:{labels:labels,datasets:ds},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:true,position:'bottom',labels:{font:{size:8},boxWidth:8,padding:3}},tooltip:{mode:'index',intersect:false,callbacks:{label:function(c){return c.raw!==null?c.dataset.label+': '+c.raw+'%':'—';}}}},
          scales:{y:{min:Math.max(0,Math.min.apply(null,allV.concat([tgt]))-8),
            max:Math.min(105,Math.max.apply(null,allV.concat([tgt]))+5),
            ticks:{callback:function(v){return v+'%';},font:{size:8},maxTicksLimit:5},
            grid:{color:'rgba(20,35,80,.05)'}},x:{ticks:{font:{size:8}},grid:{display:false}}}}});
    },150);
  }

  function getGroups(dept){
    var all=filt().filter(function(k){return k.dept===dept;});
    if(F.year!=='all')return all.map(function(k){return k.yr===2025?{k25:k,k26:null}:{k25:null,k26:k};});
    var map={};
    all.forEach(function(k){
      var key=k.id.replace(/[^A-Z0-9]/gi,'');
      if(!map[key])map[key]={k25:null,k26:null};
      if(k.yr===2025)map[key].k25=k;else map[key].k26=k;
    });
    return Object.values(map).filter(function(g){return g.k25||g.k26;});
  }
  /* Trend groups always include all years / added KPIs for proper trend display */
  function getTrendGroups(dept){
    var all=allK().filter(function(k){return k.dept===dept;});
    var map={};
    all.forEach(function(k){
      var groupKey=_trendGroupKey(k);
      if(!map[groupKey])map[groupKey]={nameEn:k.nameEn||k.id,nameAr:k.nameAr||'',dept:dept,records:[]};
      map[groupKey].records.push(k);
    });
    Object.keys(map).forEach(function(key){
      map[key].records.sort(function(a,b){return (parseInt(a.yr,10)||0)-(parseInt(b.yr,10)||0)||String(a.id).localeCompare(String(b.id));});
    });
    return Object.values(map).filter(function(g){return g.records&&g.records.length;});
  }

  function _htmlEsc(v){
    return String(v==null?'':v).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];});
  }
  function _gapTextObj(obj){
    obj=obj||{};
    return {
      rootEn: obj.gapEn || obj.rootCause || obj.root || obj.cause || obj.reason || obj.gapReasons || '',
      rootAr: obj.gapAr || obj.rootCauseAr || obj.rootAr || obj.causeAr || obj.reasonAr || obj.gapReasonsAr || '',
      actEn: obj.actEn || obj.correctiveAction || obj.correctiveActions || obj.actionPlan || obj.action || obj.actions || '',
      actAr: obj.actAr || obj.correctiveActionAr || obj.correctiveActionsAr || obj.actionPlanAr || obj.actionAr || obj.actionsAr || ''
    };
  }
  function _hasGapContent(obj){
    var t=_gapTextObj(obj);
    return !!(String(t.rootEn||t.rootAr||t.actEn||t.actAr||'').trim() || (obj&&String(obj.status||obj.priority||obj.dueDate||obj.due||'').trim()));
  }
  function _latestGapAction(k){
    var gaps=(typeof ST!=='undefined'&&ST&&ST.gaps)||{}, actions=(typeof ST!=='undefined'&&ST&&ST.actions)||{};
    var keys=[], chosenQ=null;
    try{
      if(window.F && Array.isArray(window.F.qtr) && window.F.qtr.length===1 && window.F.qtr[0] && window.F.qtr[0]!=='all') chosenQ=String(window.F.qtr[0]).toLowerCase();
    }catch(_e){}
    if(chosenQ) keys.push(k.id+'_'+chosenQ);
    ['q4','q3','q2','q1'].forEach(function(q){ keys.push(k.id+'_'+q); });
    keys.push(k.id);
    var pickedKey=null, gd={}, ac={};
    for(var i=0;i<keys.length;i++){
      var key=keys[i];
      if(_hasGapContent(gaps[key]) || _hasGapContent(actions[key])){ pickedKey=key; gd=gaps[key]||{}; ac=actions[key]||{}; break; }
    }
    if(!pickedKey){ gd=gaps[k.id]||{}; ac=actions[k.id]||{}; pickedKey=k.id; }
    var txt=_gapTextObj(gd), actTxt=_gapTextObj(ac);
    if(!txt.actEn) txt.actEn=actTxt.actEn;
    if(!txt.actAr) txt.actAr=actTxt.actAr;
    if(!txt.rootEn) txt.rootEn=actTxt.rootEn;
    if(!txt.rootAr) txt.rootAr=actTxt.rootAr;
    return {key:pickedKey,gd:gd,ac:ac,rootEn:txt.rootEn,rootAr:txt.rootAr,actEn:txt.actEn,actAr:txt.actAr};
  }
  function _gapFooterText(k){
    var g=_latestGapAction(k);
    var root=(lang==='ar'?(g.rootAr||g.rootEn):(g.rootEn||g.rootAr));
    var act=(lang==='ar'?(g.actAr||g.actEn):(g.actEn||g.actAr));
    var noRoot=lang==='ar'?'لم يتم توثيق سبب الفجوة':'Root cause not documented';
    var noAct=lang==='ar'?'لم يتم إدخال خطة الإجراء':'Action plan not entered';
    return '<div style="min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.25;text-align:'+(lang==='ar'?'right':'left')+'">'
      +'<span title="'+_htmlEsc(root||noRoot)+'" style="font-size:8.8px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px"><b style="color:#475569">'+(lang==='ar'?'السبب: ':'RC: ')+'</b>'+_htmlEsc(root||noRoot)+'</span>'
      +(act?'<span title="'+_htmlEsc(act)+'" style="font-size:8.8px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px"><b style="color:#475569">'+(lang==='ar'?'الإجراء: ':'Action: ')+'</b>'+_htmlEsc(act)+'</span>':'<span style="font-size:8.8px;color:#94A3B8"><b style="color:#64748B">'+(lang==='ar'?'الإجراء: ':'Action: ')+'</b>'+noAct+'</span>')
      +'</div>';
  }

  function mkCard(k25,k26,dept){
    var k=k26||k25,dm=DM[dept],dC=dm.color;
    var v=qv(k),a=ok(k),isMet=a===true,isMiss=a===false;
    var tgt=k.target,tier=k.tier||3;
    var latest=[k26?k26.q1:null,k25?k25.q4:null,k25?k25.q3:null,k25?k25.q2:null,k25?k25.q1:null].filter(function(x){return x!=null;})[0]||null;
    var yoyRef=k26&&k26.yoy!=null?k26.yoy:null;
    var yoyDiff=yoyRef!==null&&latest!==null?+(latest-yoyRef).toFixed(1):null;
    /* Use 'v' (=qv(k)) which already respects the active quarter filter (F.qtr) */
    var _ravg=v!==null?+v.toFixed(2):null;var _rMet=_ravg!==null?metStatus(k,_ravg):null;var gap=(_ravg!==null&&_rMet===false)?+Math.abs(tgt-_ravg).toFixed(1):null;
    /* Does ANY quarter have a gap, even if the overall KPI is Met? */
    var _qtrGapHas=['q1','q2','q3','q4'].some(function(qq){var qvv=k[qq];return qvv!==null&&qvv!==undefined&&!metStatus(k,qvv);});
    var gd=_latestGapAction(k).gd||{};
    var cid='dt_'+k.id.replace(/[^a-z0-9]/gi,'_');
    setTimeout(function(){
      dch(cid);var cv=document.getElementById(cid);if(!cv)return;
      var v25=[k25?k25.q1:null,k25?k25.q2:null,k25?k25.q3:null,k25?k25.q4:null];
      var v26=[k26?k26.q1:null,k26?k26.q2:null,k26?k26.q3:null,k26?k26.q4:null];
      var ds=[];
      if(v25.some(function(v){return v!==null;}))
        ds.push({label:'Result (2025)',data:v25,borderColor:'rgba(100,116,139,.55)',backgroundColor:'transparent',tension:.4,pointRadius:v25.map(function(v){return v!==null?3:0;}),borderWidth:1.5,borderDash:[4,2],spanGaps:true});
      if(v26.some(function(v){return v!==null;}))
        ds.push({label:'Result (2026)',data:v26,borderColor:dC,backgroundColor:dC+'14',fill:true,tension:.4,pointRadius:v26.map(function(v){return v!==null?3.5:0;}),borderWidth:2.2,spanGaps:true});
      ds.push({label:'Target',data:[tgt,tgt,tgt,tgt],borderColor:TEAL,borderWidth:1.5,borderDash:[5,3],pointRadius:0,fill:false,backgroundColor:'transparent'});
      if(!ds.slice(0,-1).some(function(d){return d.data.some(function(v){return v!==null;});}))return;
      var allV=v25.concat(v26).filter(function(v){return v!==null;});
      CH[cid]=mkChart(cid,{type:'line',data:{labels:['Q1','Q2','Q3','Q4'],datasets:ds},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:true,position:'bottom',labels:{font:{size:7},boxWidth:7,padding:4,color:'#64748B'}}},
          scales:{y:{min:Math.max(0,(allV.length?Math.min.apply(null,allV):tgt)-8),
            max:Math.min(105,(allV.length?Math.max.apply(null,allV):tgt)+5),
            ticks:{callback:function(v){return v+'%';},font:{size:8},maxTicksLimit:4},grid:{color:'rgba(20,35,80,.04)'}},
            x:{ticks:{font:{size:8}},grid:{display:false}}}}});
    },50);
    var statColor=function(val){return val===null?'#94A3B8':val>=tgt?'#16A34A':'#DC2626';};
    var _resultAvg=null;
    var stats=[
      {l:(lang==='ar'?'النتيجة':'Result'),v:(function(){_resultAvg=_ravg;return _resultAvg!==null?_resultAvg.toFixed(1)+'%':'—';}()),c:_resultAvg!==null?(_resultAvg>=tgt?'#16A34A':'#DC2626'):'#94A3B8'},
      {l:(lang==='ar'?'الهدف':'Target'),v:(k.op==='='?'=':'\u2265')+tgt+'%',c:TEAL},
      {l:(lang==='ar'?'مقارنة سنوية':'YoY'),v:yoyDiff!==null?(yoyDiff>0?'\u25b2':yoyDiff<0?'\u25bc':'\u2014')+' '+Math.abs(yoyDiff).toFixed(1)+'%':'—',c:yoyDiff===null?'#94A3B8':yoyDiff>=0?'#16A34A':'#DC2626'},
      {l:(lang==='ar'?'الفجوة':'Gap'),v:gap!==null?gap.toFixed(1)+'%':'—',c:gap!==null?'#DC2626':'#94A3B8'}
    ];
    return '<div class="dept-kpi-uniform-card" style="background:#fff;border:1px solid '+(isMiss?'rgba(220,38,38,.22)':'#E2E8F0')+';border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(10,22,48,.06);display:flex;flex-direction:column;height:100%;min-height:310px;width:100%;max-width:420px">'
      +'<div style="padding:10px 14px 9px;border-bottom:1px solid #F0F4F8;display:flex;gap:10px">'
        +'<div style="width:3px;border-radius:2px;background:'+dC+';flex-shrink:0;align-self:stretch"></div>'
        +'<div style="flex:1;min-width:0">'
          +'<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">'
            +'<span style="font-size:10px;font-weight:900;font-family:var(--mono);color:'+dC+'">'+k.id+'</span>'
            +'<span style="font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;background:'+(tier===1?'rgba(220,38,38,.10)':tier===2?'rgba(217,119,6,.10)':'rgba(1,149,175,.10)')+';color:'+(tier===1?'#DC2626':tier===2?'#D97706':TEAL)+'">T'+tier+'</span>'
            +'<span style="margin-left:auto;font-size:9px;font-weight:700;padding:2px 8px;border-radius:12px;background:'+(isMet?'#ECFDF5':isMiss?'#FEF2F2':'#F8FAFC')+';color:'+(isMet?'#16A34A':isMiss?'#DC2626':'#94A3B8')+'">'+(isMet?(lang==='ar'?'✓ محقق':'\u2713 Met'):isMiss?(lang==='ar'?'✗ غير محقق':'\u2717 Missed'):'\u23f3')+'</span>'
          +'</div>'
          +'<div style="font-size:11.5px;font-weight:700;color:#152538;line-height:1.3">'+(lang==='ar'?k.nameAr:k.nameEn)+'</div>'
        +'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #F0F4F8">'
        +stats.map(function(s,i){return '<div style="padding:8px 10px;text-align:center;border-right:'+(i<3?'1px solid #F0F4F8':'none')+'">'
          +'<div style="font-size:7.5px;font-weight:700;color:#94A3B8;text-transform:uppercase;margin-bottom:2px">'+s.l+'</div>'
          +'<div style="font-size:15px;font-weight:900;color:'+s.c+';font-family:var(--mono);line-height:1;white-space:nowrap">'+s.v+'</div>'
        +'</div>';}).join('')
      +'</div>'
      +'<div style="padding:10px 12px;border-bottom:1px solid #F0F4F8">'
        +'<div style="background:#FAFBFC;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px 4px">'
          +'<div style="height:68px"><canvas id="'+cid+'"></canvas></div>'
        +'</div>'
      +'</div>'
      +'<div style="padding:8px 12px;display:flex;gap:4px;flex-wrap:wrap">'
        +['q1','q2','q3','q4'].map(function(q,i){var v2=k[q]!=null?k[q]:null;var m2=v2!==null&&v2>=tgt;
          return '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:'+(v2===null?'#F1F5F9':m2?'rgba(22,163,74,.10)':'rgba(220,38,38,.08)')+';color:'+(v2===null?'#CBD5E1':m2?'#16A34A':'#DC2626')+'">Q'+(i+1)+' '+(v2!==null?v2.toFixed(1)+'%':'—')+'</span>';
        }).join('')
      +'</div>'

      /* Next QTR Forecast — avg quarterly trend from previous year */
      +(function(){
        var QTRS=['q1','q2','q3','q4'],QLBLS=['Q1','Q2','Q3','Q4'];
        var kCur=k26||k25;if(!kCur)return '';
        var lastIdx=-1;
        for(var i=0;i<4;i++){if(kCur[QTRS[i]]!==null&&kCur[QTRS[i]]!==undefined)lastIdx=i;}
        if(lastIdx<0||lastIdx>=3)return '';
        if(kCur[QTRS[lastIdx+1]]!==null&&kCur[QTRS[lastIdx+1]]!==undefined)return '';
        var curVal=kCur[QTRS[lastIdx]];
        var prevK=allK().filter(function(x){return x.yr===kCur.yr-1&&x.dept===kCur.dept&&x.nameEn===kCur.nameEn;})[0];
        if(!prevK)return '';
        /* Avg quarterly change in prev year */
        var pVals=[prevK.q1,prevK.q2,prevK.q3,prevK.q4].filter(function(v){return v!==null&&v!==undefined;});
        if(pVals.length<2)return '';
        var avgDelta=(pVals[pVals.length-1]-pVals[0])/(pVals.length-1);
        var fc=Math.min(100,Math.max(0,+(curVal+avgDelta).toFixed(1)));
        var fcOk=fc>=tgt;
        var lbl=QLBLS[lastIdx+1]+"'"+(String(kCur.yr).slice(2));
        return '<div style="padding:6px 12px;border-top:1px solid #F0F4F8;display:flex;align-items:center;justify-content:space-between">'
          +'<span style="font-size:9px;font-weight:700;color:#64748B">Forecast '+lbl+'</span>'
          +'<span style="font-size:12px;font-weight:900;color:'+(fcOk?'#16A34A':'#DC2626')+';font-family:var(--mono);padding:2px 10px;border-radius:8px;background:'+(fcOk?'rgba(22,163,74,.08)':'rgba(220,38,38,.06)')+'">'+fc.toFixed(1)+'%</span>'
        +'</div>';
      }())
      +'<div style="margin-top:auto;padding:7px 12px;border-top:1px solid '+(isMiss?'rgba(220,38,38,.10)':'#F0F4F8')+';background:'+(isMiss?'rgba(220,38,38,.02)':'#FAFBFC')+';display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px">'
        +(isMiss?_gapFooterText(k)+'<button onclick="openGap(&quot;'+k.id+'&quot;)" style="font-size:9px;font-weight:700;color:#DC2626;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.18);border-radius:6px;padding:4px 9px;cursor:pointer;font-family:inherit;white-space:nowrap">'+(lang==='ar'?'الفجوة »':'Gap »')+'</button>'
        :(_qtrGapHas?_gapFooterText(k)+'<button onclick="openGap(&quot;'+k.id+'&quot;)" style="font-size:9px;font-weight:700;color:#D97706;background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.2);border-radius:6px;padding:4px 9px;cursor:pointer;font-family:inherit;white-space:nowrap">'+(lang==='ar'?'فجوة الربع »':'Quarter Gap »')+'</button>':'<span style="font-size:9px;color:#94A3B8">'+(a===true?(lang==='ar'?'✓ محقق':'✓ Met'):(lang==='ar'?'⏳ قيد الانتظار':'⏳ Pending'))+'</span>'))
      +'</div>'
    +'</div>';
  }

  var html='<div class="c12" style="padding:4px 0">';
  depts.forEach(function(dept){
    var dm=DM[dept],dC=dm.color;
    var groups=getGroups(dept);
    if(!groups.length)return;
    var allKs=groups.map(function(g){return g.k26||g.k25;});
    var met=allKs.filter(function(k){return ok(k)===true;}).length;
    var miss=allKs.filter(function(k){return ok(k)===false;}).length;
    var pct=allKs.filter(function(k){return ok(k)!==null;}).length?Math.round(met/allKs.filter(function(k){return ok(k)!==null;}).length*100):0;

    /* Build trend groups by nameEn */
    var trendGroups=getTrendGroups(dept);
    var nm={};
    trendGroups.forEach(function(g){
      var kk=(g.records&&g.records[0])||{};
      /* For Projects: group PMD-02-xx together by prefix for comparison */
      var prefix=String(kk.id||'').match(/^([A-Z]+-\d+)-/);
      var name=(dept==='projects'&&prefix)?prefix[1]:(g.nameEn||kk.nameEn||kk.id);
      if(!nm[name])nm[name]=[];
      nm[name].push(g);
    });
    var trendEntries=Object.entries(nm);
    var tcols=dept==='housekeeping'?2:Math.min(trendEntries.length,4);
    var trendHtml='<div style="display:grid;grid-template-columns:repeat('+tcols+',1fr);gap:10px">'
      +trendEntries.filter(function(e){
        return e[1].some(function(g){
          var recs=g.records||[g.k25,g.k26].filter(Boolean);
          return recs.some(function(k){return k&&['q1','q2','q3','q4'].some(function(q){return _trendQVal(k,q)!==null;});});
        });
      }).map(function(e){
        var name=e[0],gs=e[1];
        var tid='dtrn_'+gs.map(function(g){return (g.records||[g.k25,g.k26].filter(Boolean)).map(function(k){return k.id;}).join('_');}).join('_').replace(/[^a-z0-9]/gi,'_');
        return '<div>'
          +'<div style="font-size:8px;font-weight:700;color:#64748B;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+name+'</div>'
          +'<div style="background:#FAFBFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 8px 4px">'
            +'<div style="height:130px"><canvas id="'+tid+'"></canvas></div>'
          +'</div>'
        +'</div>';
      }).join('')
    +'</div>';

    var cKB='dkb_'+dept;
    html+='<div style="background:#fff;border-radius:14px;border:1px solid #E2E8F0;box-shadow:0 2px 12px rgba(10,22,48,.07);overflow:hidden;margin-bottom:20px;width:100%">'
      +'<div style="height:4px;background:'+dC+'"></div>'
      +'<div style="padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-bottom:1px solid #F0F4F8">'
        +'<div style="display:flex;align-items:center;gap:10px;flex:1">'
          +'<span style="font-size:22px;font-weight:900;color:'+dC+';font-family:var(--mono)">'+dm.abbr+'</span>'
          +'<div>'
            +'<div style="font-size:14px;font-weight:800;color:#152538">'+(lang==='ar'?dm.ar:dm.en)+'</div>'
            +'<div style="font-size:10px;color:#94A3B8">'+groups.length+' KPI'+(groups.length>1?'s':'')+'</div>'
          +'</div>'
        +'</div>'
        +'<div style="display:flex;gap:0;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">'
          +[{l:'Total',v:allKs.length,c:'#152538'},{l:'Met',v:met,c:met?'#16A34A':'#94A3B8'},{l:'Missed',v:miss,c:miss?'#DC2626':'#94A3B8'}]
          .map(function(s,i){return '<div style="padding:7px 14px;text-align:center;border-left:'+(i>0?'1px solid #E2E8F0':'none')+';background:#F8FAFC">'
            +'<div style="font-size:19px;font-weight:900;color:'+s.c+';font-family:var(--mono);line-height:1">'+s.v+'</div>'
            +'<div style="font-size:8px;font-weight:700;color:#94A3B8;text-transform:uppercase;margin-top:2px">'+s.l+'</div>'
          +'</div>';}).join('')
        +'</div>'
        +'<div style="min-width:100px">'
          +'<div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#152538;margin-bottom:4px"><span>Achievement</span><span style="color:'+dC+'">'+pct+'%</span></div>'
          +'<div style="height:6px;background:#E2E8F0;border-radius:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+dC+';border-radius:4px"></div></div>'
        +'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #F0F4F8">'
        +'<div style="padding:14px 16px;border-right:1px solid #F0F4F8">'
          +'<div style="font-size:8px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">'+(lang==='ar'?'تحقيق المؤشرات مقابل الهدف':'KPI Achievement vs Target')+'</div>'
          +'<div style="background:#FAFBFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 8px 4px"><div style="height:130px"><canvas id="'+cKB+'"></canvas></div></div>'
        +'</div>'
        +'<div style="padding:14px 16px">'
          +'<div style="font-size:8px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">'+(lang==='ar'?'اتجاهات المؤشرات':'KPI Trends')+'</div>'
          +trendHtml
        +'</div>'
      +'</div>'
      +(function(){
        /* Fixed-size KPI card layout: all departments use identical card size and start from the left, even with one KPI */
        var _cardGrid='display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:18px;align-items:start;direction:'+(lang==='ar'?'rtl':'ltr')+';width:100%;justify-items:'+(lang==='ar'?'end':'start');
        return '<div class="dept-kpi-card-grid" style="padding:14px;'+_cardGrid+'">'
          +groups.map(function(g){return mkCard(g.k25,g.k26,dept);}).join('')
        +'</div>';
      }())
    +'</div>';

    /* Draw charts */
    drawBar(cKB,groups,dC);
    trendEntries.forEach(function(e){
      var gs=e[1];
      var tid='dtrn_'+gs.map(function(g){return (g.records||[g.k25,g.k26].filter(Boolean)).map(function(k){return k.id;}).join('_');}).join('_').replace(/[^a-z0-9]/gi,'_');
      drawTrend(tid,gs,dC);
    });
  });
  html+='</div>';
  el.innerHTML=html;
}

function renderRegistry(){
  _clearCache();
  const __registrySavedQtr = Array.isArray(F&&F.qtr) ? F.qtr.slice() : null;
  if(F) F.qtr=['all'];
  const ks=filt();
  const g=document.getElementById('registryGrid');
  const cols='62px 45px 1fr 65px 50px 55px 55px 55px 55px 58px 52px 48px 78px';
  const hs=lang==='ar'?['الكود','السنة','المؤشر','القسم','الهدف','Q1','Q2','Q3','Q4','المتوسط','YoY','مخاطر','الحالة']:['Code','Year','KPI Name','Dept','Target','Q1','Q2','Q3','Q4','Avg','YoY','Risk','Status'];
  let tbl=`<div style="display:grid;grid-template-columns:${cols};gap:2px;padding:6px 2px;border-bottom:1px solid var(--border2);position:sticky;top:0;background:var(--card);z-index:1">
    ${hs.map(x=>`<div style="font-size:9px;font-weight:700;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;padding:0 4px">${x}</div>`).join('')}
  </div>`;
  const deps=['maintenance','safety','housekeeping','projects'];
  deps.forEach(d=>{
    const dk=ks.filter(k=>k.dept===d);if(!dk.length)return;
    tbl+=`<div style="margin:6px 0 2px;display:flex;align-items:center;gap:0">
      <div style="width:100%;height:2.5px;background:${DM[d].color};border-radius:2px;opacity:.85"></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:4px 4px 3px">
      <div style="width:3px;height:18px;background:${DM[d].color};border-radius:2px;flex-shrink:0"></div>
      <span style="font-size:9.5px;font-weight:800;color:${DM[d].color};text-transform:uppercase;letter-spacing:.08em">${DM[d].abbr}</span>
      <span style="font-size:9px;font-weight:600;color:var(--t2)">${lang==='ar'?DM[d].ar:DM[d].en}</span>
    </div>`; 
    dk.forEach(k=>{
      const v=qv(k),a=ok(k),c=kc(k);
      const rc=getRepeat(k);
      const _yoyDiff=k.yoy!==undefined&&k.yoy!==null&&k.q1!==null?+(k.q1-k.yoy).toFixed(1):null;
      const _yoyStr=_yoyDiff!==null?(_yoyDiff>0?'▲':_yoyDiff<0?'▼':'—')+' '+Math.abs(_yoyDiff).toFixed(1)+'%':'—';
      const _yoyC=_yoyDiff===null?'var(--t3)':_yoyDiff>0?'var(--green)':'var(--red)';
      const isMissed=a===false;
      /* Row is only clickable for missed KPIs */
      tbl+=`<div style="display:grid;grid-template-columns:${cols};gap:2px;padding:5px 0;border-bottom:1px solid var(--border);align-items:center;${isMissed?'cursor:pointer;':'cursor:default;'}" ${isMissed?`onclick="openGap('${k.id}')"`:''} ${isMissed?`onmouseover="this.style.background='rgba(220,38,38,.04)'" onmouseout="this.style.background='transparent'"`:''}>
        <div style="padding:0 4px"><div style="font-size:9px;font-family:var(--mono);font-weight:700;color:var(--teal)">${k.id}</div>${rc>=2?`<span class="repeat-b" style="margin-top:2px">↩${rc}</span>`:''}</div>
        <div style="font-size:9px;font-weight:700;color:var(--t3);padding:0 4px;text-align:center;font-family:var(--mono)">${k.yr}</div>
        <div style="font-size:10.5px;color:var(--t2);padding:0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lang==='ar'?k.nameAr:k.nameEn}</div>
        <div style="font-size:9px;color:${DM[k.dept].color};padding:0 4px;font-weight:600">${DM[k.dept].abbr}</div>
        <div style="font-size:9.5px;font-family:var(--mono);color:var(--t3);padding:0 4px">${k.op==='='?'=':'≥'}${k.target}%</div>
        ${['q1','q2','q3','q4'].map(q=>{const v2=k[q];const b=pb(v2,k);const _qMissed=(b===1);return`<div ${_qMissed?`onclick="event.stopPropagation();openGapQuarter('${k.id}','${q}')" title="View gap details for ${q.toUpperCase()}"`:''} style="font-size:9.5px;font-family:var(--mono);padding:2px 4px;border-radius:3px;background:${BC[b]};color:${b===3?'#1a1200':'#fff'};text-align:center${_qMissed?';cursor:pointer;text-decoration:underline dotted':''}">${v2!==null?v2.toFixed(0)+'%':'\u2014'}</div>`;}).join('')}
        <div style="font-size:10px;font-family:var(--mono);font-weight:700;color:${c};padding:0 4px">${f2(v)}</div>
        <div style="font-size:9.5px;font-family:var(--mono);font-weight:700;color:${_yoyC};padding:0 4px">${_yoyStr}</div>
        <span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">T${k.tier||3}</span>
        <span class="${a===null?'pill-pend':a?'pill-ok':'pill-miss'}" style="font-size:9px${isMissed?';cursor:pointer;':''}">
          ${a===null?'\u2014':a?'\u2713 Met':' Missed'}
          ${isMissed?'<span style="font-size:8px;opacity:.7;margin-left:3px">↗</span>':''}
        </span>
      </div>`;
    });
  });
  g.innerHTML=`<div class="card c12 r4"><div class="ch"> ${lang==='ar'?'سجل المؤشرات الكامل — انقر على مؤشر لعرض التفاصيل':'Complete KPI Registry — Click any KPI for details'}<div class="ch-r">${ks.length} ${lang==='ar'?'مؤشر':'KPIs'}</div></div><div class="cb sc" style="padding:4px 10px 10px">${tbl}</div></div>`;
  if(__registrySavedQtr && F) F.qtr=__registrySavedQtr;
}

/* ==========================================
   ACCOUNTABILITY
========================================== */
function renderAcc(){
  const missKpis=filt().filter(k=>ok(k)===false).sort((a,b)=>{if((a.tier||3)!==(b.tier||3))return(a.tier||3)-(b.tier||3);return getRepeat(b)-getRepeat(a);});
  const openC=missKpis.filter(k=>{const ac=(ST.actions||{})[k.id];return!ac||ac.status==='open';}).length;
  const progC=missKpis.filter(k=>{const ac=(ST.actions||{})[k.id];return ac&&ac.status==='in-progress';}).length;
  const doneC=missKpis.filter(k=>{const ac=(ST.actions||{})[k.id];return ac&&ac.status==='closed';}).length;
  const repKpis=filt().filter(k=>getRepeat(k)>=2);  /* Use filt() to enforce role-based scoping */
  const g=document.getElementById('accGrid');
  g.innerHTML=`
<div class="card c4"><div class="ch"> ${lang==='ar'?'مفتوح':'Open'}</div><div class="cb"><div class="mbig" style="color:var(--red)">${openC}</div><div class="mlbl">${lang==='ar'?'إجراءات تصحيحية معلقة':'Corrective Actions Pending'}</div></div></div>
<div class="card c4"><div class="ch"> ${lang==='ar'?'جاري التنفيذ':'In Progress'}</div><div class="cb"><div class="mbig" style="color:var(--amber)">${progC}</div><div class="mlbl">${lang==='ar'?'إجراءات تحت التنفيذ':'Actions Being Implemented'}</div></div></div>
<div class="card c4"><div class="ch"> ${lang==='ar'?'مكتمل':'Completed'}</div><div class="cb"><div class="mbig" style="color:var(--green)">${doneC}</div><div class="mlbl">${lang==='ar'?'إجراءات مكتملة':'Actions Completed'}</div></div></div>
<div class="card c12 r3">
  <div class="ch"> ${lang==='ar'?'سجل المساءلة والإجراءات التصحيحية':'Accountability & Corrective Action Register'}
    <div class="ch-r" style="color:#64748B">${lang==='ar'?'مرتب حسب مستوى المخاطر والتكرار':'Sorted by risk tier & repeat count'}</div>
  </div>
  <div class="cb sc" style="padding:4px 11px 11px">
    ${!missKpis.length?`<div class="empty-s"><div class="empty-ico"></div><div class="empty-txt">${emptyState('missed')}</div></div>`:accTable(missKpis)}
  </div>
</div>
<div class="card c12">
  <div class="ch">↩ ${lang==='ar'?'الإخفاق المتكرر — مؤشرات الخطر المزمن':'Repeat Miss Alert — Chronic Underperformance'}</div>
  <div class="cb sc" style="padding:4px 11px 11px">
    ${!repKpis.length?`<div class="empty-s"><div class="empty-ico"></div><div class="empty-txt">${lang==='ar'?'لا توجد مؤشرات بإخفاق متكرر':'No repeat miss KPIs detected'}</div></div>`:
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px">${repKpis.map(k=>{const rc=getRepeat(k),v=qv(k);return`<div style="background:rgba(251,146,60,.08);border:1px solid rgba(251,146,60,.2);border-radius:6px;padding:10px"><div style="display:flex;gap:4px;align-items:center;margin-bottom:5px"><span class="repeat-b">↩ ${rc}x</span><span style="font-size:9.5px;font-family:var(--mono);font-weight:700;color:var(--teal)">${k.id}</span><span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">T${k.tier||3}</span></div><div style="font-size:11px;color:var(--t2);line-height:1.4;margin-bottom:5px">${lang==='ar'?k.nameAr:k.nameEn}</div><div style="font-size:9px;color:#DC2626">${lang==='ar'?`إخفاق ${rc} أرباع متتالية — يستلزم مراجعة جذرية.`:`Missed ${rc} consecutive quarters — systematic review required.`}</div></div>`;}).join('')}</div>`}
  </div>
</div>`;
}
function accTable(ks){
  const hs=lang==='ar'?['المؤشر','الفجوة','المخاطر','التكرار','الشخص المسؤول','الإجراء','الأولوية','الموعد','الحالة','']:
    ['KPI','Gap','Risk','Repeat','Responsible Person','Action','Priority','Due Date','Status',''];
  const pickAccData=function(k){
    const gaps=ST.gaps||{}, actions=ST.actions||{};
    let q=null;
    try{
      if(window.F && Array.isArray(window.F.qtr) && window.F.qtr.length===1 && window.F.qtr[0]!=='all') q=window.F.qtr[0];
    }catch(_){}
    if(!q){
      ['q4','q3','q2','q1'].some(function(x){
        const v=k&&k[x];
        if(v!==null && v!==undefined && v!==''){ q=x; return true; }
        return false;
      });
    }
    const keys=[];
    if(q) keys.push(k.id+'_'+q);
    ['q4','q3','q2','q1'].forEach(function(x){ keys.push(k.id+'_'+x); });
    keys.push(k.id);
    let gd={}, ac={};
    for(let i=0;i<keys.length;i++){ if(gaps[keys[i]]){ gd=gaps[keys[i]]; break; } }
    for(let i=0;i<keys.length;i++){ if(actions[keys[i]]){ ac=actions[keys[i]]; break; } }
    return {gd:gd||{}, ac:ac||{}};
  };
  let h=`<table class="acc-tbl"><thead><tr>${hs.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>`;
  ks.forEach(k=>{
    const v=qv(k),gap=(v!=null?Math.abs(k.target-v):0).toFixed(1);
    const _acc=pickAccData(k), gd=_acc.gd, ac=_acc.ac, rc=getRepeat(k);
    const sc=ac.status==='closed'?'acc-done':ac.status==='in-progress'?'acc-prog':'acc-open';
    const st=ac.status==='closed'?(lang==='ar'?'مكتمل':'Done'):ac.status==='in-progress'?(lang==='ar'?'جاري':'In Prog'):(lang==='ar'?'مفتوح':'Open');
    const pc={'critical':'var(--red)','high':'#DC2626','medium':'#D97706'};
    const pt={'critical':lang==='ar'?'حرجة':'Critical','high':lang==='ar'?'عالية':'High','medium':lang==='ar'?'متوسطة':'Medium'};
    const overdue=ac.dueDate&&new Date(ac.dueDate)<new Date();
    h+=`<tr>
      <td><div style="font-size:10px;font-family:var(--mono);font-weight:700;color:var(--teal)">${k.id}</div><div style="font-size:9.5px;color:var(--t3);margin-top:1px">${lang==='ar'?k.nameAr:k.nameEn}</div></td>
      <td style="color:var(--red);font-family:var(--mono);font-weight:700">${gap}%</td>
      <td><span class="tier-b ${(k.tier||3)===1?'t1':(k.tier||3)===2?'t2b':'t3b'}">T${k.tier||3}</span></td>
      <td>${rc>=2?`<span class="repeat-b">↩${rc}x</span>`:rc===1?`<span style="font-size:9px;color:var(--amber)">1x</span>`:'\u2014'}</td>
      <td style="font-size:10.5px">${(()=>{const _ow={maintenance:lang==='ar'?'وليد الصريخ':'Waleed Alsuraykh',safety:lang==='ar'?'مشاري الصعب':'Meshari Alsaab',housekeeping:lang==='ar'?'اسامه الغفيص':'Osamah Algafes',projects:lang==='ar'?'سلمان الخضيري':'Salman Alkhodairi'};return (lang==='ar'?(_ow[k.dept]||ac.owner||gd.owner||gd.responsiblePerson):(ac.owner||gd.owner||gd.responsiblePerson||(typeof DEPT_OWNERS!=='undefined'&&DEPT_OWNERS[k.dept])||_ow[k.dept]))||`<span style="color:var(--t3);font-size:9px">${lang==='ar'?'غير محدد':'Unassigned'}</span>`;})()}</td>
      <td style="font-size:10.5px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(lang==='ar'?gd.actAr:gd.actEn)||`<span style="color:var(--t3);font-size:9px">${lang==='ar'?'لم يدخل':'Not entered'}</span>`}</td>
      <td>${ac.priority?`<span style="font-size:9px;font-weight:700;color:${pc[ac.priority]||'var(--t3)'}">${pt[ac.priority]||ac.priority}</span>`:'\u2014'}</td>
      <td style="font-size:10px;font-family:var(--mono);color:${overdue?'var(--red)':'var(--t2)'}">${ac.dueDate||'\u2014'}${overdue?' ':''}</td>
      <td><span class="acc-s ${sc}">${st}</span></td>
      <td><button style="background:var(--teal-dim);color:var(--teal);border:1px solid rgba(0,196,180,.2);border-radius:3px;font-size:9px;font-weight:700;padding:3px 7px;cursor:pointer;font-family:inherit;white-space:nowrap" onclick="openGap('${k.id}')">${lang==='ar'?'تفاصيل':'Details'}</button></td>
    </tr>`;
  });
  return h+'</tbody></table>';
}

/* ==========================================
   ANALYTICS
========================================== */
/* ==========================================
   AI — ENHANCED STRUCTURED PROMPT
========================================== */
async function fetchAI(){
  const el=document.getElementById('intelPanel');if(!el)return;
  /* Wide 2-column layout for intel below KPI cards */
  const setIntelContent=(html)=>{el.innerHTML=`<div style="padding:8px 14px 12px;border-right:1px solid var(--border)">${html.split('</div></div>').slice(0,Math.ceil(html.split('</div></div>').length/2)).join('</div></div>')}</div><div style="padding:8px 14px 12px">${html.split('</div></div>').slice(Math.ceil(html.split('</div></div>').length/2)).join('</div></div>')}</div>`;};
  const now=new Date();const ts=document.getElementById('intelUpdateTime');if(ts)ts.textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  el.innerHTML=`<div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>`;
  const ks=filt();
  const nOk=ks.filter(k=>ok(k)===true).length,miss=ks.filter(k=>ok(k)===false).length,rate=ks.length?Math.round(nOk/ks.length*100):0;
  const missKpis=ks.filter(k=>ok(k)===false).sort((a,b)=>(a.tier||3)-(b.tier||3));
  const repKpis=allK().filter(k=>getRepeat(k)>=2);
  const deptStr=['maintenance','safety','housekeeping','projects'].map(d=>{
    const dk=ks.filter(k=>k.dept===d);const o=dk.filter(k=>ok(k)===true).length;
    return`- ${DM[d].en}: ${dk.length?Math.round(o/dk.length*100):0}% (${o}/${dk.length})`;
  }).join('\n');
  const missStr=missKpis.map(k=>{const v=qv(k),gap=(v!=null?Math.abs(k.target-v):0).toFixed(1);const rc=getRepeat(k);const gd=(ST.gaps||{})[k.id]||{};
    return`- ${k.id} (${k.nameEn}): ${(v||0).toFixed(1)}% vs ${k.target}% target | Gap: ${gap}% | Risk Tier ${k.tier||3}(${TIERS[k.tier||3].en})${rc>=2?` | REPEAT MISS: ${rc} quarters`:''} | Root cause: ${gd.gapEn||'Not documented'}`;
  }).join('\n');
  const prompt=lang==='ar'
    ?`أنت محلل مؤشرات أداء متخصص في مستشفيات الكبرى. البيانات لإدارة المرافق والسلامة في المدينة الطبية بجامعة القصيم:\n\nالإجمالي: ${ks.length} مؤشر | محقق: ${nOk} | غير محقق: ${miss} | معدل الإنجاز: ${rate}%\n\nالمؤشرات غير المحققة:\n${missStr||'لا توجد'}\n\nالأداء حسب القسم:\n${deptStr}\n\nاكتب تقريراً تنفيذياً موجزاً مكوناً من 3 فقرات قصيرة باللغة العربية الرسمية:\n1. تقييم الأداء العام بالأرقام الفعلية\n2. تحديد المخاطر الحرجة (ركز على مؤشرات T1 والإخفاق المتكرر)\n3. التوصية التشغيلية الأكثر أولوية\n\nلا تستخدم عبارات عامة. استخدم أسماء المؤشرات والأرقام الفعلية.`
    :`You are a hospital KPI analyst, Facilities & Safety Division, Qassim University Medical City.\n\nData: ${ks.length} KPIs | Achieved: ${nOk} | Missed: ${miss} | Rate: ${rate}%\n\nMissed KPIs:\n${missStr||'None'}\n\nDepartment breakdown:\n${deptStr}\n\nWrite a concise executive briefing in exactly 3 short paragraphs:\n1. Overall performance verdict with specific numbers\n2. Critical risk identification — name Tier 1 KPIs and repeat misses specifically\n3. Single highest-priority operational recommendation\n\nNo generic statements. Use actual KPI IDs and numbers.`;
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    const d=await r.json();const t=d.content?.[0]?.text||'';
    if(el&&t){ buildIntelRisks(missKpis,repKpis); } else if(el)buildIntelRisks(missKpis,repKpis);
  } catch(e){if(el)buildIntelRisks(missKpis,repKpis);}
}
function buildFallback(rate,missKpis,repKpis){ buildIntelRisks(missKpis,repKpis); }

/* ==========================================
   GAP MODAL

/* -- KPI trend lines and department drill-down -- */
function renderExecKpiTrends(ks){
  const el=document.getElementById('execKpiTrends');if(!el)return;
  const visible=ks||[];
  const allDk=allK();
  function _qvDyn(k,q){
    if(!k)return null;
    if(k[q]!==null&&k[q]!==undefined)return k[q];
    try{
      var pci=(typeof ST!=='undefined'&&ST.pci&&ST.pci[k.id]&&ST.pci[k.id][q])?ST.pci[k.id][q]:null;
      if(!pci)return null;
      if(pci._result!==null&&pci._result!==undefined)return pci._result;
      if(pci.planned&&pci.planned>0&&pci.complete!==undefined)return Math.min(100,Math.round(((pci.complete||0)/pci.planned)*100));
    }catch(_e){}
    return null;
  }
  function _key(k){return (String(k.nameEn||'').trim().toLowerCase().replace(/[^a-z0-9؀-ۿ]/gi,'_')||String(k.id||''))+'__'+k.dept;}
  function _labels(records){
    var seen={};
    records.forEach(function(k){['q1','q2','q3','q4'].forEach(function(q,idx){if(_qvDyn(k,q)!==null){var yr=parseInt(k.yr,10)||new Date().getFullYear();seen[yr+'_'+q]={yr:yr,q:q,idx:idx,label:'Q'+(idx+1)+"'"+String(yr).slice(-2)};}});});
    return Object.values(seen).sort(function(a,b){return a.yr-b.yr||a.idx-b.idx;});
  }
  function _series(records,labels){
    records=(records||[]).slice().sort(function(a,b){return (parseInt(a.yr,10)||0)-(parseInt(b.yr,10)||0)||String(a.id).localeCompare(String(b.id));});
    var ids=[];records.forEach(function(k){if(k&&ids.indexOf(k.id)<0)ids.push(k.id);});
    return {label:ids.join(' / '),data:labels.map(function(l){for(var i=0;i<records.length;i++){var k=records[i];if((parseInt(k.yr,10)||0)!==l.yr)continue;var v=_qvDyn(k,l.q);if(v!==null)return v;}return null;})};
  }
  const nameMap={};
  allDk.forEach(k=>{
    if(!visible.some(function(x){return x.nameEn===k.nameEn||x.id===k.id||(k.nameAr&&x.nameAr===k.nameAr);}))return;
    const key=_key(k);
    if(!nameMap[key])nameMap[key]={nameEn:k.nameEn,nameAr:k.nameAr,dept:k.dept,tier:k.tier||3,target:k.target,op:k.op,ids:[]};
    nameMap[key].ids.push(k);
    if(k.target!==undefined&&k.target!==null)nameMap[key].target=k.target;
    if(k.op)nameMap[key].op=k.op;
  });
  const groups=Object.values(nameMap).filter(function(g){return g.ids&&g.ids.length;});
  if(!groups.length){el.innerHTML='';return;}
  el.innerHTML=groups.map(g=>{
    const labelsObj=_labels(g.ids);
    const vals=_series(g.ids,labelsObj).data;
    const idStr=g.ids.map(k=>k.id).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
    const latestVal=vals.filter(v=>v!==null).slice(-1)[0]??null;
    const isM=latestVal!==null?latestVal>=g.target:null;
    const c=isM===null?'var(--t3)':isM?'var(--green)':'var(--red)';
    const nonNull=vals.filter(v=>v!==null);
    let arrow='';if(nonNull.length>=2){const d=nonNull[nonNull.length-1]-nonNull[0];arrow=d>0?`▲${d.toFixed(1)}%`:d<0?`▼${Math.abs(d).toFixed(1)}%`:'';}
    const dm=DM[g.dept];
    const cid='ext_'+idStr.replace(/[^a-zA-Z0-9]/g,'_').substring(0,35)+'_'+g.dept;
    return`<div style="background:var(--card);border:1px solid ${isM===false?'rgba(185,28,28,.3)':isM===true?'rgba(26,122,74,.25)':'var(--border)'};border-top:3px solid ${dm.color};border-radius:10px;padding:14px;box-shadow:0 2px 6px rgba(10,37,64,.05)">
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap">
        <span style="font-size:9px;font-family:var(--mono);font-weight:800;color:var(--teal)">${idStr}</span>
        <span style="font-size:8px;font-weight:700;color:${dm.color};background:${dm.color}18;padding:1px 5px;border-radius:3px">${dm.abbr}</span>
        <span class="tier-b ${g.tier===1?'t1':g.tier===2?'t2b':'t3b'}">T${g.tier}</span>
        ${arrow?`<span style="font-size:9px;font-weight:700;color:${arrow.startsWith('▲')?'var(--green)':'var(--red)'}">${arrow}</span>`:''}
        <span style="margin-left:auto" class="${isM===null?'pill-pend':isM?'pill-ok':'pill-miss'}">${isM===null?'—':isM?'✓ Met':'✕ Missed'}</span>
      </div>
      <div style="font-size:11px;font-weight:600;color:var(--t1);margin-bottom:10px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${lang==='ar'?g.nameAr:g.nameEn}</div>
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px">
        <span style="font-size:22px;font-weight:800;font-family:var(--mono);color:${c}">${latestVal!==null?latestVal.toFixed(1)+'%':'—'}</span>
        <span style="font-size:9px;color:var(--t3)">Target: ${g.op==='='?'=':'≥'}${g.target}%</span>
      </div>
      <div style="height:90px"><canvas id="${cid}"></canvas></div>
    </div>`;
  }).join('');
  setTimeout(()=>{
    groups.forEach(g=>{
      const idStr=g.ids.map(k=>k.id).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
      const cid='ext_'+idStr.replace(/[^a-zA-Z0-9]/g,'_').substring(0,35)+'_'+g.dept;
      const labelsObj=_labels(g.ids); if(!labelsObj.length)return;
      const labels=labelsObj.map(x=>x.label);
      const ser=_series(g.ids,labelsObj);
      if(!ser.data.some(v=>v!==null))return;
      const latestVal=ser.data.filter(v=>v!==null).slice(-1)[0]??null;
      const isM=latestVal!==null?latestVal>=g.target:null;
      const lc=isM===false?'var(--missed)':isM===true?'var(--met)':'#64748b';
      const fillC=isM===false?'rgba(185,28,28,.07)':isM===true?'rgba(26,122,74,.07)':'rgba(100,116,139,.04)';
      const datasets=[
        {label:ser.label,data:ser.data,borderColor:lc,backgroundColor:fillC,fill:true,tension:.35,pointRadius:ser.data.map(v=>v!==null?3:0),borderWidth:2,spanGaps:true},
        {label:'Target',data:labels.map(()=>g.target),borderColor:'rgba(185,28,28,.45)',borderDash:[4,3],pointRadius:0,borderWidth:1.5,fill:false,backgroundColor:'transparent'}
      ];
      const allV=[...ser.data.filter(v=>v!==null),g.target].filter(v=>v!==null);
      dch(cid);
      mkChart(cid,{type:'line',data:{labels:labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{font:{size:8},boxWidth:8,padding:3}},tooltip:{mode:'index',intersect:false,callbacks:{label:c=>c.raw!==null?c.dataset.label+': '+c.raw+'%':'—'}}},scales:{y:{min:Math.max(0,Math.floor(Math.min(...allV)-8)),max:Math.min(105,Math.ceil(Math.max(...allV)+4)),ticks:{callback:v=>v+'%',font:{size:8},maxTicksLimit:5},grid:{color:'rgba(10,37,64,.04)'}},x:{ticks:{font:{size:8}},grid:{display:false}}}}});
    });
  },30);
}

/* == Per-KPI Quarterly Bar Chart Cards == */

function drilldept(d){
  F.dept=d;document.getElementById('deptF').value=d;
  document.querySelectorAll('.fb[data-filter="dept"]').forEach(b=>b.classList.remove('on'));
  updateChips();updateBadge();
  const tabs=document.querySelectorAll('.tab');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  tabs[1].classList.add('on');document.getElementById('page-dept').classList.add('on');
  window.curPage='dept'; curPage='dept'; renderDept();
}
/* ==========================================================
   FINAL QUMC FIX — Arabic UI polishing + filtered KPI cards
   ========================================================== */
(function(){
  function _fmt(v){return (v!==null&&v!==undefined&&isFinite(v))?Number(v).toFixed(2)+'%':'—';}
  function _col(v){return (v===null||v===undefined||!isFinite(v))?'#64748B':v>=80?'#15803D':v>=60?'#0195af':'#FBBF24';}
  function _e(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function _deptName(d){var dm=(typeof DM!=='undefined'&&DM[d])||{en:d,ar:d};return (typeof lang!=='undefined'&&lang==='ar')?(dm.ar||dm.en):(dm.en||d);}
  window._showCurrentPerformanceDrilldown=function(res){
    res=res||(typeof calcCurrentPerformanceBreakdown==='function'?calcCurrentPerformanceBreakdown({respectFilters:true}):{exec:null,byDept:{}});
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var old=document.getElementById('_curPerfDrill'); if(old)old.remove();
    var ov=document.createElement('div'); ov.id='_curPerfDrill';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483645;background:radial-gradient(circle at top left,rgba(34,211,238,.18),transparent 34%),radial-gradient(circle at bottom right,rgba(74,222,128,.11),transparent 34%),rgba(15,23,42,.34);backdrop-filter:blur(14px) saturate(150%);display:flex;align-items:center;justify-content:center;padding:20px';
    var box=document.createElement('div');
    box.style.cssText='width:min(460px,94vw);background:linear-gradient(145deg,rgba(248,252,255,.88),rgba(226,248,255,.72));border:1px solid rgba(255,255,255,.60);border-radius:28px;box-shadow:0 28px 90px rgba(15,23,42,.24), inset 0 1px 0 rgba(255,255,255,.72);padding:22px;color:#0F172A;backdrop-filter:blur(22px) saturate(150%);direction:'+(isAr?'rtl':'ltr');
    var rows=['maintenance','safety','housekeeping','projects'].map(function(d){var v=res.byDept&&res.byDept[d];return {d:d,v:v};});
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px"><div><div style="font-size:16px;font-weight:900;color:#fff">'+(isAr?'تفصيل الأداء الحالي':'Current Performance Breakdown')+'</div><div style="font-size:10px;color:#64748b;margin-top:4px">'+(isAr?'حسب الفلاتر المحددة حالياً':'Based on current filters')+'</div></div><button onclick="document.getElementById(\'_curPerfDrill\').remove()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;width:30px;height:30px;cursor:pointer">×</button></div>'+
      '<div style="background:rgba(255,255,255,.58);border:1px solid rgba(14,116,144,.12);border-radius:18px;padding:16px;margin-bottom:12px"><div style="font-size:10px;color:#64748b;margin-bottom:4px">'+(isAr?'المتوسط العام':'Overall average')+'</div><div style="font-size:38px;font-weight:900;font-family:var(--mono);color:'+_col(res.exec)+'">'+_fmt(res.exec)+'</div></div>'+
      rows.map(function(r){var w=(r.v!==null&&r.v!==undefined&&isFinite(r.v))?Math.min(100,Math.max(0,r.v)):0;return '<div style="padding:11px 0;border-bottom:1px solid rgba(14,116,144,.12)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;color:#334155">'+_e(_deptName(r.d))+'</span><b style="font-family:var(--mono);color:'+_col(r.v)+'">'+_fmt(r.v)+'</b></div><div style="height:5px;background:rgba(14,116,144,.12);border-radius:5px"><div style="height:5px;width:'+w+'%;background:'+_col(r.v)+';border-radius:5px"></div></div></div>';}).join('');
    ov.appendChild(box); ov.onclick=function(e){if(e.target===ov)ov.remove();}; document.body.appendChild(ov);
  };
  window._showForecastDrilldown=function(res){
    res=res||(typeof calcForecastYE==='function'?calcForecastYE({respectFilters:true}):{exec:null,byDept:{}});
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var old=document.getElementById('_forecastDrilldown'); if(old)old.remove();
    var ov=document.createElement('div'); ov.id='_forecastDrilldown';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483645;background:radial-gradient(circle at top left,rgba(34,211,238,.18),transparent 34%),radial-gradient(circle at bottom right,rgba(74,222,128,.11),transparent 34%),rgba(15,23,42,.34);backdrop-filter:blur(14px) saturate(150%);display:flex;align-items:center;justify-content:center;padding:20px';
    var box=document.createElement('div'); box.style.cssText='width:min(460px,94vw);background:linear-gradient(145deg,rgba(248,252,255,.88),rgba(226,248,255,.72));border:1px solid rgba(255,255,255,.60);border-radius:28px;box-shadow:0 28px 90px rgba(15,23,42,.24), inset 0 1px 0 rgba(255,255,255,.72);padding:22px;color:#0F172A;backdrop-filter:blur(22px) saturate(150%);direction:'+(isAr?'rtl':'ltr');
    var rows=['maintenance','safety','housekeeping','projects'].map(function(d){var v=res.byDept&&res.byDept[d];return {d:d,v:v};});
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px"><div><div style="font-size:16px;font-weight:900;color:#fff">'+(isAr?'تفصيل التوقع السنوي':'Forecast YE Breakdown')+'</div><div style="font-size:10px;color:#64748b;margin-top:4px">'+(isAr?'حسب الفلاتر المحددة حالياً':'Based on current filters')+'</div></div><button onclick="document.getElementById(\'_forecastDrilldown\').remove()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;width:30px;height:30px;cursor:pointer">×</button></div>'+
      '<div style="background:rgba(255,255,255,.58);border:1px solid rgba(14,116,144,.12);border-radius:18px;padding:16px;margin-bottom:12px"><div style="font-size:10px;color:#64748b;margin-bottom:4px">'+(isAr?'التوقع العام':'Overall forecast')+'</div><div style="font-size:38px;font-weight:900;font-family:var(--mono);color:'+_col(res.exec)+'">'+_fmt(res.exec)+'</div></div>'+
      rows.map(function(r){var w=(r.v!==null&&r.v!==undefined&&isFinite(r.v))?Math.min(100,Math.max(0,r.v)):0;return '<div style="padding:11px 0;border-bottom:1px solid rgba(14,116,144,.12)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;color:#334155">'+_e(_deptName(r.d))+'</span><b style="font-family:var(--mono);color:'+_col(r.v)+'">'+_fmt(r.v)+'</b></div><div style="height:5px;background:rgba(14,116,144,.12);border-radius:5px"><div style="height:5px;width:'+w+'%;background:'+_col(r.v)+';border-radius:5px"></div></div></div>';}).join('');
    ov.appendChild(box); ov.onclick=function(e){if(e.target===ov)ov.remove();}; document.body.appendChild(ov);
  };
  function enhanceExecCards(){
    try{
      var fc=(typeof calcForecastYE==='function')?calcForecastYE({respectFilters:true}):null;
      var fe=document.getElementById('eis_forecast');
      if(fe&&fc){fe.textContent=_fmt(fc.exec);fe.style.color=_col(fc.exec);fe.style.cursor='pointer';fe.onclick=function(){window._showForecastDrilldown(fc);};}
      var cp=(typeof calcCurrentPerformanceBreakdown==='function')?calcCurrentPerformanceBreakdown({respectFilters:true}):null;
      var ce=document.getElementById('eis_current_perf');
      if(ce&&cp){ce.textContent=_fmt(cp.exec);ce.style.color=_col(cp.exec);ce.style.cursor='pointer';ce.title=(lang==='ar'?'اضغط لالأقسام':'Click for department breakdown');ce.onclick=function(){window._showCurrentPerformanceDrilldown(cp);};}
    }catch(e){console.warn('[QUMC enhance cards]',e);}
    if(typeof window.qumcApplyArabicUI==='function') window.qumcApplyArabicUI();
  }
  var _oldRenderExec=window.renderExec||renderExec;
  window.renderExec=renderExec=function(){ var r=_oldRenderExec.apply(this,arguments); setTimeout(enhanceExecCards,80); return r; };
  var _oldMk=window.mkChart||mkChart;
  window.mkChart=mkChart=function(id,cfg){
    try{
      if(typeof lang!=='undefined'&&lang==='ar'&&cfg&&cfg.data&&Array.isArray(cfg.data.datasets)){
        var m={'Met':'محقق','Missed':'غير محقق','Target':'الهدف','Result':'النتيجة','Performance':'الأداء','Actual':'الفعلي','Gap':'الفجوة'};
        cfg=JSON.parse(JSON.stringify(cfg));
        cfg.data.datasets.forEach(function(ds){ if(ds&&m[ds.label]) ds.label=m[ds.label]; });
      }
    }catch(_e){}
    return _oldMk.apply(this,[id,cfg]);
  };
})();


/* ==========================================================
   QUMC ARABIC DASHBOARD POLISH — Arabic mode only.
   - RTL department KPI card layout.
   - Arabic chart legends/titles after every render.
   - Header / executive labels sweep.
   ========================================================== */
(function(){
  function ar(s){return (typeof window.qumcAr==='function')?window.qumcAr(s):s;}
  function isAr(){return typeof lang!=='undefined'&&lang==='ar';}
  function apply(){
    if(!isAr())return;
    try{ if(window.DM&&DM.housekeeping)DM.housekeeping.ar='النظافة'; }catch(_){ }
    try{
      var dg=document.getElementById('deptGrid');
      if(dg){dg.dir='rtl';dg.style.textAlign='right';}
      document.querySelectorAll('#page-dept .dept-kpi-card-grid').forEach(function(g){g.style.direction='rtl';g.style.justifyItems='end';});
      document.querySelectorAll('#page-dept .dept-kpi-uniform-card').forEach(function(c){c.dir='rtl';c.style.textAlign='right';});
      document.querySelectorAll('#page-dept .ch,#page-exec .ch,#page-exec .ch-r,#page-dept .ch-r').forEach(function(el){el.textContent=ar(el.textContent);});
      document.querySelectorAll('#page-dept [style*="text-transform:uppercase"],#page-exec [style*="text-transform:uppercase"]').forEach(function(el){el.textContent=ar(el.textContent);});
      document.querySelectorAll('#page-dept span,#page-dept div,#page-exec span,#page-exec div').forEach(function(el){
        if(el.children&&el.children.length>0)return;
        var b=el.textContent, a=ar(b); if(a!==b)el.textContent=a;
      });
    }catch(e){console.warn('[Arabic dashboard polish]',e);}
  }
  var oldMk=window.mkChart||mkChart;
  window.mkChart=mkChart=function(id,cfg){
    try{
      if(isAr()&&cfg&&cfg.data){
        cfg=JSON.parse(JSON.stringify(cfg));
        var m={'Met':'محقق','Missed':'غير محقق','Target':'الهدف','Result':'النتيجة','Result (2025)':'النتيجة (2025)','Result (2026)':'النتيجة (2026)','Performance':'الأداء','Actual':'الفعلي','Gap':'الفجوة'};
        if(Array.isArray(cfg.data.datasets))cfg.data.datasets.forEach(function(ds){if(ds&&ds.label){ds.label=m[ds.label]||ar(ds.label);}});
        if(Array.isArray(cfg.data.labels))cfg.data.labels=cfg.data.labels.map(function(x){return ar(x);});
      }
    }catch(_){ }
    return oldMk.apply(this,[id,cfg]);
  };
  ['renderExec','renderDept','renderRegistry','renderAcc'].forEach(function(fn){
    var old=window[fn]; if(typeof old==='function')window[fn]=eval(fn+'=function(){var r=old.apply(this,arguments);setTimeout(apply,80);setTimeout(apply,350);return r;}');
  });
  setTimeout(apply,500);
})();

/* ==========================================================
   QUMC EXEC INTELLIGENCE ROOT FIX — stable At-Risk + drilldowns
   - One authoritative At-Risk calculation is used by the card and drilldown.
   - No recurring timers that rewrite the At-Risk number after render.
   - Achievement KPIs such as SAF-04 / Completion / Compliance / Rounds are higher-is-better.
   ========================================================== */
(function(){
  'use strict';
  if(window.__QUMC_EXEC_INTELLIGENCE_ROOT_FIX_20260701__) return;
  window.__QUMC_EXEC_INTELLIGENCE_ROOT_FIX_20260701__ = true;

  function $(id){return document.getElementById(id);} 
  function isAr(){return (typeof window.lang!=='undefined'&&window.lang==='ar')||document.documentElement.lang==='ar'||document.documentElement.dir==='rtl';}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){
    if(v===null||v===undefined||v==='')return null;
    var s=String(v).trim();
    if(!s||s==='—'||s==='-'||/^n\/?a$/i.test(s))return null;
    s=s.replace(/[٪%]/g,'').replace(/,/g,'').replace(/\s+/g,'');
    s=s.replace(/[٠-٩]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.indexOf(c);});
    s=s.replace(/[۰-۹]/g,function(c){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(c);});
    var n=Number(s);return isFinite(n)?n:null;
  }
  function norm(v){return String(v||'').toLowerCase().replace(/[\u200e\u200f]/g,'').replace(/[\s\-_]+/g,' ').replace(/[^a-z0-9\u0600-\u06ff ]+/g,'').trim();}
  function deptAlias(v){var x=norm(v).replace(/ /g,'');if(!x)return'';if(x.indexOf('maintenance')>-1||x.indexOf('صيانة')>-1)return'maintenance';if(x.indexOf('safety')>-1||x.indexOf('سلامة')>-1)return'safety';if(x.indexOf('housekeeping')>-1||x.indexOf('cleaning')>-1||x.indexOf('hospitality')>-1||x.indexOf('نظافة')>-1||x.indexOf('فندقة')>-1)return'housekeeping';if(x.indexOf('project')>-1||x.indexOf('مشاريع')>-1||x.indexOf('المشاريع')>-1)return'projects';if(x.indexOf('governance')>-1||x.indexOf('حوكمة')>-1)return'governance';return x;}
  function allKpis(){try{if(typeof window.allK==='function')return window.allK()||[];}catch(_){}try{if(Array.isArray(window.KPIS))return window.KPIS;}catch(_){}try{if(Array.isArray(window.BASE))return window.BASE;}catch(_){}return[];}
  function code(k){return String(k&&(k.id||k.kpiCode||k.code)||'').trim();}
  function kDept(k){return deptAlias(k&&(k.dept||k.department||k.section||k.sectionName||''));}
  function kName(k){return isAr()?(k.nameAr||k.nameEn||k.name||code(k)):(k.nameEn||k.name||k.nameAr||code(k));}
  function canonicalName(k){return norm(k&&(k.nameEn||k.name||k.nameAr||code(k)));}
  function groupKey(k){return (kDept(k)||'')+'|'+canonicalName(k);}
  function yearOf(k){var y=num(k&&(k.yr!==undefined?k.yr:(k.year!==undefined?k.year:k.fy)));return y===null?0:y;}
  function qVal(k,q){var v=k&&k[q];if(v===undefined)v=k&&k[String(q).toUpperCase()];return num(v);}
  function qName(q){return String(q||'').toUpperCase();}
  function selectedDept(){try{if(window._lockedDept)return deptAlias(window._lockedDept);}catch(_){}try{if(window.F&&F.dept&&F.dept!=='all')return deptAlias(F.dept);}catch(_){}return'';}
  function isClosed(k){var s=norm(k&&(k.kpiStatus||k.lifecycleStatus||k.lifecycle||k.recordStatus||k.statusText||k.state||''));return !!(k&&(k.closed===true||k.isClosed===true||k.archived===true||['closed','completed','complete','done','archived','inactive','مغلق','مكتمل','منتهي','مؤرشف'].indexOf(s)>-1));}
  function achievementKpi(k){
    var txt=norm([k&&k.id,k&&k.kpiCode,k&&k.nameEn,k&&k.nameAr,k&&k.name,k&&k.unit,k&&k.measure,k&&k.description].join(' '));
    if(code(k).toUpperCase()==='SAF-04')return true;
    return /completion|compliance|achievement|completed|accuracy|quality|rate|percentage|percent|round|rounds|inspection|training|coverage|نسبة|معدل|اكتمال|امتثال|إنجاز|انجاز|جولات|جولة|تفتيش|تدريب|جودة/.test(txt);
  }
  function lowerIsBetter(k){
    if(achievementKpi(k))return false;
    var txt=norm([k&&k.id,k&&k.kpiCode,k&&k.nameEn,k&&k.nameAr,k&&k.name,k&&k.unit,k&&k.measure,k&&k.description].join(' '));
    if(/response|time|duration|delay|turnaround|waiting|closure time|minutes|minute|hours|hour|زمن|وقت|مدة|تأخر|تأخير|استجابة|دقيقة|ساعة/.test(txt))return true;
    var op=String(k&&(k.op||k.operator||k.comparison)||'>=').toLowerCase();
    if(op.indexOf('<=')>-1||op.indexOf('less')>-1||op.indexOf('at most')>-1)return true;
    return false;
  }
  function equalTarget(k){if(achievementKpi(k))return false;var op=String(k&&(k.op||k.operator||k.comparison)||'').toLowerCase();return op==='='||op.indexOf('equal')>-1;}
  function missed(k,v){var t=num(k&&k.target);if(v===null)return false;if(t===null)t=100;if(equalTarget(k))return Math.abs(v-t)>0.05;return lowerIsBetter(k)?(v>t):(v<t);}
  function canAccess(k){
    if(!k||typeof k!=='object'||isClosed(k))return false;
    var d=selectedDept();if(d&&kDept(k)!==d)return false;
    try{if(window._fbRole==='kpi_owner'){var a=window._fbAssignedKpis;if(Array.isArray(a)&&a.length){var c=code(k), nm=canonicalName(k);var ok=a.some(function(x){var sx=String(x||'');return sx===c||norm(sx)===nm;});if(!ok)return false;}}}catch(_){}
    return true;
  }
  function observations(k){var out=[];['q1','q2','q3','q4'].forEach(function(q,i){var v=qVal(k,q);if(v!==null)out.push({k:k,q:q,qi:i+1,v:v,year:yearOf(k)});});return out;}
  function currentCycle(){
    var obs=[];allKpis().forEach(function(k){if(canAccess(k))obs=obs.concat(observations(k));});
    if(!obs.length)return{year:0,qi:0};
    var years=obs.map(function(o){return o.year;}).filter(function(y){return y>0;});
    var y=years.length?Math.max.apply(null,years):0;
    var same=obs.filter(function(o){return y?o.year===y:true;});
    var qi=same.length?Math.max.apply(null,same.map(function(o){return o.qi;})):0;
    return{year:y,qi:qi};
  }
  function history(gk){var rows=[];allKpis().forEach(function(k){if(!canAccess(k)||groupKey(k)!==gk)return;rows=rows.concat(observations(k));});rows.sort(function(a,b){return (a.year-b.year)||(a.qi-b.qi);});return rows;}
  function filterStatus(k,latest){try{var st=window.F&&F.status;if(!st||st==='all')return true;var isMiss=missed(k,latest.v);if(st==='achieved')return !isMiss;if(st==='missed')return isMiss;}catch(_){}return true;}

  function atRiskRows(){
    var cyc=currentCycle(), rows=[], used={};
    if(!cyc.qi||cyc.qi>=4)return rows;
    allKpis().forEach(function(k){
      if(!canAccess(k))return;
      if(cyc.year&&yearOf(k)!==cyc.year)return;
      var gk=groupKey(k);if(used[gk])return;used[gk]=1;
      var hist=history(gk).filter(function(o){return !cyc.year||o.year<=cyc.year;});
      if(!hist.length)return;
      var latest=hist[hist.length-1];
      if(cyc.year&&latest.year!==cyc.year)return;
      if(latest.qi!==cyc.qi||latest.qi>=4)return;
      if(!filterStatus(latest.k,latest))return;
      var prev=hist.length>1?hist[hist.length-2]:null;
      var target=num(latest.k.target);if(target===null)target=100;
      var trend=prev?(latest.v-prev.v):0;
      var predicted=latest.v+trend;
      /* Strict root rule: achieved/improving completion KPIs are never At-Risk.
         This prevents SAF-04 / Environmental Safety Rounds Completion from appearing when the latest result and forecast meet or exceed target. */
      var txtForSaf=norm([code(latest.k),latest.k&&latest.k.nameEn,latest.k&&latest.k.nameAr].join(' '));
      if((achievementKpi(latest.k)||txtForSaf.indexOf('environmental safety rounds completion')>-1||code(latest.k).toUpperCase()==='SAF-04') && latest.v>=target && predicted>=target)return;
      /* Show At-Risk only when next-quarter forecast misses target. */
      if(!missed(latest.k,predicted))return;
      var reason=missed(latest.k,latest.v)?(isAr()?'آخر نتيجة والتوقع القادم غير محققين للهدف':'Latest result and next-quarter forecast miss the target'):(isAr()?'الاتجاه الحالي قد يؤدي لعدم تحقيق الهدف في الربع القادم':'Current trend may miss target next quarter');
      rows.push({k:latest.k,latest:latest,prev:prev,target:target,trend:trend,predicted:predicted,reason:reason,nextQ:'q'+(latest.qi+1),cycle:cyc});
    });
    rows.sort(function(a,b){function risk(r){if(equalTarget(r.k))return Math.abs(r.predicted-r.target);return lowerIsBetter(r.k)?(r.predicted-r.target):(r.target-r.predicted);}return risk(b)-risk(a);});
    return rows;
  }
  window._qumcExecAtRiskRows=atRiskRows;
  window._qumcLatestAtRiskRows=atRiskRows;
  window._qumcExecAtRiskCount=function(){return atRiskRows().length;};

  function gapTexts(obj){obj=obj||{};return{root:String(obj.gapEn||obj.gapAr||obj.rootCause||obj.rootCauseEn||obj.root||obj.reason||obj.gapReasons||'').trim(),action:String(obj.actEn||obj.actAr||obj.correctiveAction||obj.correctiveActions||obj.actionPlan||obj.action||obj.actions||'').trim(),impact:String(obj.impactEn||obj.impactAr||obj.impact||obj.impactOfGap||obj.gapImpact||'').trim(),owner:String(obj.owner||obj.responsible||obj.responsiblePerson||'').trim(),due:String(obj.dueDate||obj.due||obj.targetDate||'').trim()};}
  function gapComplete(k,q){
    var st=window.ST||{},g=st.gaps||{},a=st.actions||{},id=code(k),qq=String(q||'').toLowerCase(),yr=yearOf(k)||'';
    var keys=[id+'_'+qq,id+'_'+qq.toUpperCase(),id+'_'+yr+'_'+qq,id+'_'+yr+'_'+qq.toUpperCase(),id];
    for(var i=0;i<keys.length;i++){
      var gt=gapTexts(g[keys[i]]||{}),at=gapTexts(a[keys[i]]||{});
      var hasRoot=!!(gt.root||at.root), hasAction=!!(gt.action||at.action), hasImpact=!!(gt.impact||at.impact);
      if(hasRoot&&hasAction&&hasImpact)return true;
    }
    return false;
  }
  function hasLiveApproval(k,q){
    var arr=(window.ST&&Array.isArray(ST.gapApprovals))?ST.gapApprovals:[], id=code(k), qq=String(q||'').toLowerCase();
    return arr.some(function(r){
      if(!r)return false;
      var rid=String(r.kpiId||r.kpiCode||r.id||'').trim();
      var rq=String(r.quarter||r.qtr||r.q||'').toLowerCase();
      var st=String(r.status||'').toLowerCase();
      return rid===id && rq===qq && /^(pending_manager|pending_dept_manager|pending_department_manager|pending_super_admin|approved)$/.test(st);
    });
  }
  function gapOpenKey(k,q){return [kDept(k)||'',code(k),yearOf(k)||'',String(q||'').toLowerCase()].join('|');}
  function clearedGapOpenMap(){var arr=(window.ST&&Array.isArray(ST._prelaunchClearedGapOpenKeysV2))?ST._prelaunchClearedGapOpenKeysV2:[];var m={};arr.forEach(function(x){m[String(x||'')]=1;});return m;}
  function missingGapQuarterRowsRaw(){
    var out=[];
    allKpis().forEach(function(k){
      if(!canAccess(k))return;
      ['q1','q2','q3','q4'].forEach(function(q){
        var v=qVal(k,q);
        if(v===null)return;
        if(!missed(k,v))return;
        if(gapComplete(k,q)||hasLiveApproval(k,q))return;
        out.push({k:k,q:q,value:v,target:num(k.target),year:k.yr||k.year||yearOf(k)||'',dept:k.dept||k.department||'',key:gapOpenKey(k,q)});
      });
    });
    out.sort(function(a,b){return String(a.dept).localeCompare(String(b.dept))||String(code(a.k)).localeCompare(String(code(b.k)))||String(a.year).localeCompare(String(b.year))||a.q.localeCompare(b.q);});
    return out;
  }
  function aggregateMissingByKpi(rows){
    var map={}, out=[];
    rows.forEach(function(r){
      var gk=(kDept(r.k)||'')+'|'+code(r.k)+'|'+String(r.year||yearOf(r.k)||'');
      if(!map[gk]){
        map[gk]={k:r.k,qs:[],quarters:[],value:r.value,target:r.target,year:r.year,dept:r.dept,keys:[],key:gk};
        out.push(map[gk]);
      }
      map[gk].qs.push(r.q);
      map[gk].quarters.push(r);
      map[gk].keys.push(r.key);
    });
    return out;
  }
  function missingGapRowsRaw(){return missingGapQuarterRowsRaw();}
  function missingGapRows(){
    var cleared=clearedGapOpenMap();
    return missingGapQuarterRowsRaw().filter(function(r){return !cleared[r.key];});
  }
  function missingGapKpiRows(){return aggregateMissingByKpi(missingGapRows());}
  function missingGapKpiRowsRaw(){return aggregateMissingByKpi(missingGapQuarterRowsRaw());}
  /* Root rule: Gap Analysis Open is counted by missing KPI-quarter, not by KPI.
     It depends on department scope only; year / quarter / status filters do not affect it. */
  window._qumcGapOpenRows=function(){return missingGapRows();};
  window._qumcGapOpenRowsRaw=function(){return missingGapRowsRaw();};
  window._qumcGapOpenQuarterRows=missingGapRows;
  window._qumcGapOpenQuarterRowsRaw=missingGapQuarterRowsRaw;
  window._qumcGapOpenKpiRows=missingGapKpiRows;
  window._qumcGapOpenKpiRowsRaw=missingGapKpiRowsRaw;
  window._qumcMarkCurrentGapOpenClearedForLaunch=function(){
    if(!window.ST)window.ST={};
    var keys=missingGapQuarterRowsRaw().map(function(r){return r.key;});
    ST._prelaunchClearedGapOpenKeysV2=Array.from(new Set([].concat(ST._prelaunchClearedGapOpenKeysV2||[],keys)));
    return keys.length;
  };
  function criticalRows(){var rows=[];allKpis().forEach(function(k){if(!canAccess(k)||Number(k.tier||3)!==1)return;var missedQs=['q1','q2','q3','q4'].filter(function(q){var v=qVal(k,q);return v!==null&&missed(k,v);});if(missedQs.length)rows.push({k:k,qs:missedQs});});return rows;}

  function modal(id,title,sub,bodyHtml){var old=$(id);if(old)old.remove();var ov=document.createElement('div');ov.id=id;ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;direction:'+(isAr()?'rtl':'ltr');ov.innerHTML='<div style="width:min(820px,94vw);max-height:82vh;overflow:auto;background:rgba(255,255,255,.96);border-radius:22px;padding:20px;border:1px solid rgba(255,255,255,.75);box-shadow:0 28px 80px rgba(15,23,42,.28)"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px"><div><div style="font-size:16px;font-weight:900;color:#0f172a">'+esc(title)+'</div><div style="font-size:10px;color:#64748b;margin-top:4px">'+esc(sub||'')+'</div></div><button onclick="document.getElementById(\''+id+'\').remove()" style="border:0;background:rgba(15,23,42,.08);width:30px;height:30px;border-radius:10px;cursor:pointer">×</button></div>'+bodyHtml+'</div>';ov.onclick=function(e){if(e.target===ov)ov.remove();};document.body.appendChild(ov);}
  window._showAtRiskKpisDrilldown=function(){var rows=atRiskRows(), a=isAr(), cyc=currentCycle();var sub=a?('يعرض فقط المؤشرات المتوقع عدم تحقيقها من آخر إدخال فعلي: '+(cyc.year||'')+' '+(cyc.qi?('Q'+cyc.qi):'')):('Only KPIs forecasted to miss target from the latest entered data: '+(cyc.year||'')+' '+(cyc.qi?('Q'+cyc.qi):''));modal('_atRiskDrilldown',a?'المؤشرات المعرضة للخطر في الربع القادم':'At-Risk KPIs — Next Quarter',sub,rows.length?rows.map(function(r){var arrow=r.trend>0?'↑':(r.trend<0?'↓':'→'),col=r.trend>0?'#047857':(r.trend<0?'#B91C1C':'#64748B'),mag=Math.abs(r.trend).toFixed(2);return '<div style="border:1px solid rgba(217,119,6,.18);background:rgba(255,251,235,.78);border-radius:16px;padding:12px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:12px;color:#152538">'+esc(code(r.k))+' — '+esc(kName(r.k))+'</b><div style="font-size:10px;color:#64748b;margin-top:3px">'+esc(r.reason)+'</div></div><b style="font-family:var(--mono);color:#92400E;white-space:nowrap">'+(isFinite(r.predicted)?r.predicted.toFixed(2)+'%':'—')+'</b></div><div style="font-size:10px;color:#475569;margin-top:8px;display:flex;gap:12px;flex-wrap:wrap"><span>'+esc(a?'آخر نتيجة':'Latest')+': <b>'+r.latest.v.toFixed(2)+'%</b> '+esc(qName(r.latest.q))+' '+esc(r.latest.year||'')+'</span><span>'+esc(a?'الربع القادم':'Next Qtr')+': <b>'+esc(qName(r.nextQ))+'</b></span><span>'+esc(a?'الهدف':'Target')+': <b>'+esc(r.target)+'%</b></span><span>'+esc(a?'الاتجاه':'Trend')+': <b style="color:'+col+'">'+arrow+' '+mag+'%</b></span></div></div>';}).join(''):'<div style="padding:18px;border-radius:16px;background:rgba(22,163,74,.10);color:#166534;font-weight:800;text-align:center">'+(a?'لا توجد مؤشرات معرضة للخطر ضمن آخر إدخال فعلي.':'No at-risk KPIs in the latest entered data.')+'</div>');};
  window._showMissingGapKpisDrilldown=function(){
    var a=isAr(), rows=missingGapRows();
    modal('_missingGapDrilldown',
      a?'تحليل الفجوات المفتوحة حسب الربع':'Gap Analysis Open — Missing Quarters',
      a?'يعرض كل ربع غير محقق لم يتم إدخال بيانات Gap Analysis له، ويعتمد على فلتر القسم فقط.':'Shows each missed KPI quarter that still has no Gap Analysis data; department filter only.',
      rows.length?rows.map(function(r){
        var openCall='document.getElementById(\'_missingGapDrilldown\')&&document.getElementById(\'_missingGapDrilldown\').remove();window.openGapQuarter&&window.openGapQuarter(\''+esc(code(r.k))+'\',\''+esc(r.q)+'\')';
        return '<div style="border:1px solid rgba(217,119,6,.20);background:rgba(255,251,235,.78);border-radius:16px;padding:12px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:12px;color:#78350f">'+esc(code(r.k))+' — '+esc(kName(r.k))+'</b><div style="font-size:10px;color:#64748b;margin-top:4px">'+esc(r.dept||'')+' · '+esc(a?'السنة':'Year')+': <b>'+esc(r.year||'—')+'</b> · '+esc(a?'الربع':'Quarter')+': <b>'+esc(qName(r.q))+'</b></div></div><span style="font-family:var(--mono);font-weight:900;color:#92400e;white-space:nowrap">'+esc(qName(r.q))+'</span></div><div style="font-size:10px;color:#475569;margin-top:8px;display:flex;gap:12px;flex-wrap:wrap"><span>'+esc(a?'النتيجة':'Result')+': <b>'+esc(r.value)+'%</b></span><span>'+esc(a?'الهدف':'Target')+': <b>'+esc(r.target)+'%</b></span></div><button onclick="'+openCall+'" style="margin-top:10px;border:1px solid rgba(217,119,6,.26);background:#fff7ed;color:#92400e;border-radius:999px;padding:5px 12px;font-size:10px;font-weight:900;cursor:pointer">'+(a?'إدخال بيانات الفجوة':'Enter Gap Data')+'</button></div>';
      }).join(''):'<div style="padding:18px;border-radius:16px;background:rgba(22,163,74,.10);color:#166534;font-weight:800;text-align:center">'+(a?'كل بيانات تحليل الفجوات مكتملة ضمن القسم المحدد.':'All Gap Analysis data is complete within the selected department.')+'</div>'
    );
  };
  window._showCriticalEscalationKpis=function(){var a=isAr(), rows=criticalRows();modal('_criticalKpiDrilldown',a?'المؤشرات التي تحتاج إلى تصعيد':'Critical Escalations — KPIs',a?'ضمن صلاحيتك الحالية':'Within your current scope',rows.length?rows.map(function(r){return '<div style="border:1px solid rgba(220,38,38,.18);background:rgba(254,242,242,.78);border-radius:16px;padding:12px;margin-bottom:10px"><b style="font-size:12px;color:#7f1d1d">'+esc(code(r.k))+' — '+esc(kName(r.k))+'</b><div style="font-size:10px;color:#475569;margin-top:6px">'+esc(r.k.dept||'')+' · '+(a?'الأرباع':'Quarters')+': <b>'+esc(r.qs.map(qName).join(', ')||'—')+'</b> · '+(a?'الهدف':'Target')+': <b>'+esc(r.k.target)+'%</b></div></div>';}).join(''):'<div style="padding:18px;border-radius:16px;background:rgba(22,163,74,.10);color:#166534;font-weight:800;text-align:center">'+(a?'لا توجد مؤشرات حرجة ضمن صلاحيتك.':'No critical escalation KPIs within your scope.')+'</div>');};

  var _applyBusy=false;
  function apply(){
    if(_applyBusy)return;
    _applyBusy=true;
    try{
      var a=atRiskRows(), m=missingGapRows(), c=criticalRows();
      var ar=$('eis_atrisk');if(ar){var av=String(a.length);if(ar.textContent!==av)ar.textContent=av;ar.style.cursor='pointer';ar.title=isAr()?'اضغط لعرض المؤشرات المتوقع عدم تحقيقها فقط':'Click to view KPIs forecasted to miss target';ar.onclick=window._showAtRiskKpisDrilldown;}
      var ae=$('eis_actions');if(ae){var mv=String(m.length);if(ae.textContent!==mv)ae.textContent=mv;ae.style.cursor='pointer';ae.onclick=window._showMissingGapKpisDrilldown;ae.style.color=m.length?'#D97706':'#15803D';ae.title=isAr()?'يعتمد على فلتر القسم فقط':'Depends on department filter only';}
      var ab=$('eis_actions_badge');if(ab){var bt=m.length===0?(isAr()?'مكتمل':'All documented'):(m.length===1?('1 '+(isAr()?'ربع مفتوح':'open quarter')):(m.length+' '+(isAr()?'أرباع مفتوحة':'open quarters')));if(ab.textContent!==bt)ab.textContent=bt;ab.style.color=m.length?'#D97706':'#15803D';ab.style.background=m.length?'rgba(217,119,6,.18)':'rgba(22,163,74,.14)';}
      var ce=$('eis_crit');if(ce){ce.textContent=c.length;ce.style.cursor='pointer';ce.onclick=window._showCriticalEscalationKpis;}
    }catch(e){console.warn('[QUMC exec intelligence root fix]',e);}finally{_applyBusy=false;}
  }
  window._qumcApplyExecIntelligenceRootFix=apply;
  var prev=window.renderExec;
  if(typeof prev==='function'&&!prev.__qumcRootStableWrapped){
    var wrapped=function(){var r=prev.apply(this,arguments);apply();return r;};
    wrapped.__qumcRootStableWrapped=true;
    window.renderExec=renderExec=wrapped;
  }
  var prevCurrent=window.renderCurrent;
  if(typeof prevCurrent==='function'&&!prevCurrent.__qumcExecStableWrapped){
    var wrappedCurrent=function(){var r=prevCurrent.apply(this,arguments);try{apply();}catch(_){}return r;};
    wrappedCurrent.__qumcExecStableWrapped=true;
    window.renderCurrent=wrappedCurrent;
  }
  document.addEventListener('click',function(e){var t=e.target;if(!t)return;if(t.id==='eis_atrisk'){e.preventDefault();window._showAtRiskKpisDrilldown();}if(t.id==='eis_actions'){e.preventDefault();window._showMissingGapKpisDrilldown();}if(t.id==='eis_crit'){e.preventDefault();window._showCriticalEscalationKpis();}},true);
  function watchStableCounts(){
    try{
      ['eis_atrisk','eis_actions','eis_actions_badge'].forEach(function(id){
        var el=$(id);if(!el||el.__qumcStableCountWatch)return;
        el.__qumcStableCountWatch=true;
        new MutationObserver(function(){if(!_applyBusy)setTimeout(apply,0);}).observe(el,{childList:true,characterData:true,subtree:true});
      });
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){apply();watchStableCounts();},{once:true});else{apply();watchStableCounts();}
  setTimeout(function(){apply();watchStableCounts();},0);setTimeout(function(){apply();watchStableCounts();},250);setTimeout(function(){apply();watchStableCounts();},900);setTimeout(function(){apply();watchStableCounts();},1800);
})();
