/* ===========================================================
   QUMC Dashboard  --  notifications.js
   User notifications, alert badge, profile dropdown,
   AI assistant widget, logout handling.

   Key globals / functions exposed:
     window.toggleUserAlerts()   -- open/close bell dropdown
     window.toggleUserProfile()  -- open/close profile card
     window.renderNotifications()-- rebuild notification list
     window.updateUserBadge()    -- refresh name / role badge
     window.qumcLogoutToLogin()  -- logout handler

   Depends on:
     kpi.js       (ST, lang, sLS, addAudit)
     firebase.js  (window._doLogout, window._fbUser)
   =========================================================== */


/* -- AI Assistant widget (local KPI intelligence, no external API) -- */

function aiIsDashboardVisible(){
  try{
    var auth=document.getElementById('_authOverlay');
    if(auth){
      var as=getComputedStyle(auth);
      if(as.display!=='none' && as.visibility!=='hidden' && as.opacity!=='0') return false;
    }
    var portal=document.getElementById('_portalOverlay');
    if(portal){
      var ps=getComputedStyle(portal);
      if(ps.display!=='none' && ps.visibility!=='hidden' && ps.opacity!=='0') return false;
    }
    var dash=document.querySelector('#page-exec.on,#page-dept.on,#page-registry.on,#page-accountability.on');
    return !!dash && !!window._fbUser;
  }catch(e){return false;}
}
function aiSyncVisibility(){
  var btn=document.getElementById('aiFloatBtn');
  var win=document.getElementById('aiWin');
  var show=aiIsDashboardVisible();
  try{ document.body.classList.toggle('dashboard-ready', !!show); }catch(_){}
  if(btn) btn.style.display=show?'flex':'none';
  if(!show && win){win.style.display='none';win.classList.remove('open');}
}
window.aiSyncVisibility=aiSyncVisibility;
setInterval(aiSyncVisibility,700);
document.addEventListener('DOMContentLoaded',function(){setTimeout(aiSyncVisibility,80);setTimeout(aiSyncVisibility,600);});

function aiToggle(){
  aiSyncVisibility();
  if(!aiIsDashboardVisible()) return;
  var w=document.getElementById('aiWin');
  if(!w) return;
  var show=!(w.style.display==='flex' || w.classList.contains('open'));
  w.style.display=show?'flex':'none';
  w.classList.toggle('open', show);
  if(show){
    setTimeout(function(){var i=document.getElementById('aiInp'); if(i) i.focus();},120);
  }
}
window.aiToggle=aiToggle;

function aiAsk(t){
  var i=document.getElementById('aiInp');
  if(i){i.value=t; aiSend();}
}
window.aiAsk=aiAsk;

function _aiEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _aiFmt(txt){return _aiEsc(txt).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');}
function aiAddMsg(txt,role){
  var box=document.getElementById('aiMsgs')||document.getElementById('aiBody');
  if(!box) return null;
  var d=document.createElement('div');
  d.className='ai-msg-bubble '+(role==='user'?'user':'assistant')+(role==='loading'?' loading':'');
  d.innerHTML=(role==='loading')?'<span class="ai-typing"><i></i><i></i><i></i></span>':(role==='user'?_aiEsc(txt):_aiFmt(txt));
  box.appendChild(d);
  box.scrollTop=box.scrollHeight;
  return d;
}

function _aiNum(v){
  if(v===null||v===undefined||v==='') return null;
  var n=parseFloat(v); return isNaN(n)?null:n;
}
function _aiVal(k){
  try{ if(typeof qv==='function') return qv(k); }catch(e){}
  var qs=(window.F&&Array.isArray(window.F.qtr)&&!window.F.qtr.includes('all'))?window.F.qtr:['q1','q2','q3','q4'];
  var vs=qs.map(function(q){return _aiNum(k&&k[q]);}).filter(function(v){return v!==null;});
  return vs.length?vs.reduce(function(a,b){return a+b;},0)/vs.length:null;
}
function _aiMet(k){
  try{ if(typeof ok==='function') return ok(k); }catch(e){}
  var v=_aiVal(k), t=_aiNum(k&&k.target);
  if(v===null||t===null) return null;
  if(k&&k.op==='<=') return v<=t;
  if(k&&k.op==='=') return Math.abs(v-t)<=0.05;
  return v>=t;
}
function _aiName(k){return (k&&(k.nameEn||k.name||k.title||k.id))||'Unnamed KPI';}
function _aiDeptLabel(d){
  var m=(typeof DM!=='undefined'&&DM&&DM[d])?DM[d]:null;
  return m?(m.abbr||m.en||d):d;
}
function _aiGetKpis(){
  var ks=[];
  try{ ks=(typeof filt==='function')?filt():((typeof allK==='function')?allK():[]); }catch(e){ks=[];}
  return (ks||[]).filter(function(k){return k&&typeof k==='object';});
}
function _aiAvg(arr){
  var v=arr.filter(function(x){return x!==null&&x!==undefined&&!isNaN(x);});
  return v.length?v.reduce(function(a,b){return a+b;},0)/v.length:null;
}
function _aiPct(v){return v===null||v===undefined?'N/A':(Math.round(v*10)/10)+'%';}
function _aiStatusLine(k){
  var v=_aiVal(k), met=_aiMet(k), code=k.id||k.code||'';
  return '• '+code+' — '+_aiName(k)+': '+_aiPct(v)+' / target '+(k.target!=null?k.target+'%':'N/A')+' — '+(met===true?'Met':met===false?'Missed':'Pending');
}
function _aiForecastText(){
  try{
    if(typeof calcForecastYE==='function'){
      var r=calcForecastYE();
      if(r&&r.exec!=null){
        var lines=['**Forecast YE analysis**','Overall forecast: **'+_aiPct(r.exec)+'**'];
        if(r.byDept){
          Object.keys(r.byDept).sort(function(a,b){return r.byDept[b]-r.byDept[a];}).forEach(function(d){
            lines.push('• '+_aiDeptLabel(d)+': '+_aiPct(r.byDept[d]));
          });
        }
        return lines.join('\n');
      }
    }
  }catch(e){}
  return 'Forecast data is not available for the current filter.';
}
function aiAnalyze(q){
  var query=String(q||'').trim();
  var low=query.toLowerCase();
  var ks=_aiGetKpis();
  var evaluated=ks.map(function(k){return {k:k,v:_aiVal(k),m:_aiMet(k)};});
  var withResult=evaluated.filter(function(x){return x.v!==null;});
  var met=evaluated.filter(function(x){return x.m===true;});
  var missed=evaluated.filter(function(x){return x.m===false;});
  var avg=_aiAvg(withResult.map(function(x){return x.v;}));
  var depts={};
  ks.forEach(function(k){var d=k.dept||'unknown'; if(!depts[d]) depts[d]=[]; depts[d].push(k);});
  var deptRows=Object.keys(depts).map(function(d){
    var list=depts[d], vals=list.map(_aiVal).filter(function(v){return v!==null;});
    var m=list.filter(function(k){return _aiMet(k)===true;}).length;
    var miss=list.filter(function(k){return _aiMet(k)===false;}).length;
    return {dept:d,label:_aiDeptLabel(d),total:list.length,met:m,miss:miss,avg:_aiAvg(vals)};
  }).sort(function(a,b){return (b.avg||-1)-(a.avg||-1);});

  if(!ks.length) return 'No KPI records match the current dashboard filters. Try changing year, quarter, department, or status.';

  if(/forecast|توقع|فا?ركاست|ye/i.test(low)) return _aiForecastText();

  if(/best|top|أفضل|افضل|الأفضل|اعلى|highest/i.test(low)){
    var b=deptRows[0];
    return b?'**Best department**\n'+b.label+' is currently leading with average **'+_aiPct(b.avg)+'** and '+b.met+'/'+b.total+' KPIs met.\n\n'+deptRows.map(function(d){return '• '+d.label+': '+_aiPct(d.avg)+' | met '+d.met+'/'+d.total;}).join('\n'):'No department data.';
  }
  if(/worst|lowest|risk|ضعيف|اسوأ|أسوأ|اقل|أقل/i.test(low)){
    var rows=deptRows.slice().sort(function(a,b){return (a.avg||999)-(b.avg||999);});
    var w=rows[0];
    return w?'**Lowest performance / risk area**\n'+w.label+' has average **'+_aiPct(w.avg)+'** with '+w.miss+' missed KPI(s).\n\n'+rows.map(function(d){return '• '+d.label+': '+_aiPct(d.avg)+' | missed '+d.miss;}).join('\n'):'No department data.';
  }
  if(/miss|below|fail|not met|غير محقق|متعثر|missed/i.test(low)){
    return missed.length?'**Missed KPIs ('+missed.length+')**\n'+missed.slice(0,12).map(function(x){return _aiStatusLine(x.k);}).join('\n')+(missed.length>12?'\n… +'+(missed.length-12)+' more':''):'All evaluated KPIs are currently met under the selected filters.';
  }
  if(/department|dept|قسم|الأقسام|الاقسام|division/i.test(low)){
    return '**Department summary**\n'+deptRows.map(function(d){return '• '+d.label+': average '+_aiPct(d.avg)+' | met '+d.met+'/'+d.total+' | missed '+d.miss;}).join('\n');
  }
  if(/trend|تحسن|انخفاض|increase|decrease|quarter|ربع/i.test(low)){
    var trend=ks.map(function(k){
      var qs=['q1','q2','q3','q4'].map(function(q){return _aiNum(k[q]);});
      var first=qs.find(function(v){return v!==null;});
      var last=qs.slice().reverse().find(function(v){return v!==null;});
      return {k:k,first:first,last:last,delta:(first!==undefined&&last!==undefined&&first!==null&&last!==null)?last-first:null};
    }).filter(function(x){return x.delta!==null;}).sort(function(a,b){return Math.abs(b.delta)-Math.abs(a.delta);});
    return trend.length?'**KPI trend movement**\n'+trend.slice(0,8).map(function(x){return '• '+(x.k.id||'')+' — '+_aiName(x.k)+': '+(x.delta>=0?'+':'')+(Math.round(x.delta*10)/10)+' pp';}).join('\n'):'No quarterly trend can be calculated for the current filter.';
  }

  var found=ks.filter(function(k){
    var hay=[k.id,k.code,k.nameEn,k.nameAr,k.dept].map(function(x){return String(x||'').toLowerCase();}).join(' | ');
    return hay.indexOf(low)>-1;
  });
  if(found.length && low.length>2){
    return '**KPI search result**\n'+found.slice(0,10).map(_aiStatusLine).join('\n')+(found.length>10?'\n… +'+(found.length-10)+' more':'');
  }

  return '**Dashboard summary**\n'+ks.length+' KPI(s) in the current filter.\nAverage KPI result: **'+_aiPct(avg)+'**.\nMet: **'+met.length+'** | Missed: **'+missed.length+'** | Pending/no result: **'+(ks.length-met.length-missed.length)+'**.\n\nTry asking: “best department”, “missed KPIs”, “forecast analysis”, or search by KPI name/code.';
}

function aiSend(){
  var inp=document.getElementById('aiInp');
  var btn=document.getElementById('aiSendBtn');
  if(!inp) return;
  var q=inp.value.trim();
  if(!q) return;
  var sg=document.getElementById('aiSugg'); if(sg) sg.style.display='none';
  inp.value=''; inp.style.height='auto';
  if(btn){btn.disabled=true; btn.classList.add('busy');}
  aiAddMsg(q,'user');
  var load=aiAddMsg('', 'loading');
  setTimeout(function(){
    var ans;
    try{ans=aiAnalyze(q);}catch(e){ans='Analysis error: '+(e&&e.message?e.message:e);}
    if(load){load.classList.remove('loading'); load.innerHTML=_aiFmt(ans);}
    if(btn){btn.disabled=false; btn.classList.remove('busy');}
    var box=document.getElementById('aiMsgs'); if(box) box.scrollTop=box.scrollHeight;
  },120);
}
window.aiSend=aiSend;


function updateExecTrend(yr){
  /* Draw on execSumChart (bar1) and execSumChart2 (bar2) */
  ['execSumChart','execSumChart2'].forEach(function(cvId){
    const cv=document.getElementById(cvId);if(!cv)return;
    cv.width=cv.offsetWidth||240;
    const ctx=cv.getContext('2d');
    const W=cv.width,H=cv.height||50;
    ctx.clearRect(0,0,W,H);

    const yrs=yr==='all'?[2025,2026]:[parseInt(yr)];
    const clr={2025:'rgba(255,255,255,.70)',2026:'#0195af'};
    const dsh={2025:[5,3],2026:[]};
    let drawn=false;

    yrs.forEach(function(y){
      const ks=allK().filter(function(k){return k.yr===y;});
      const pts=['q1','q2','q3','q4'].map(function(q){
        const v=ks.map(function(k){return k[q];}).filter(function(x){return x!==null;});
        return v.length?+(v.reduce(function(a,b){return a+b;})/v.length).toFixed(1):null;
      }).map(function(v,i){return v!==null?{i:i,v:v}:null;}).filter(Boolean);
      if(pts.length<2)return;
      drawn=true;
      const vals=pts.map(function(p){return p.v;});
      const mn=Math.min.apply(null,vals)-4,mx=Math.max.apply(null,vals)+4,rng=mx-mn||1;
      const xOf=function(i){return Math.round(8+i*(W-16)/3);};
      const yOf=function(v){return Math.round(4+(1-(v-mn)/rng)*(H-8));};
      /* Area fill for 2026 */
      if(y===2026){
        const g=ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'rgba(1,149,175,.25)');g.addColorStop(1,'rgba(1,149,175,.02)');
        ctx.beginPath();ctx.moveTo(xOf(pts[0].i),H);
        pts.forEach(function(p){ctx.lineTo(xOf(p.i),yOf(p.v));});
        ctx.lineTo(xOf(pts[pts.length-1].i),H);ctx.closePath();
        ctx.fillStyle=g;ctx.fill();
      }
      /* Line */
      ctx.beginPath();ctx.moveTo(xOf(pts[0].i),yOf(pts[0].v));
      pts.forEach(function(p,j){
        if(j>0){
          const cx=(xOf(pts[j-1].i)+xOf(p.i))/2;
          ctx.bezierCurveTo(cx,yOf(pts[j-1].v),cx,yOf(p.v),xOf(p.i),yOf(p.v));
        }
      });
      ctx.strokeStyle=clr[y];ctx.lineWidth=y===2026?2.5:1.5;
      ctx.setLineDash(dsh[y]);ctx.stroke();ctx.setLineDash([]);
      /* Dots */
      pts.forEach(function(p){
        ctx.beginPath();ctx.arc(xOf(p.i),yOf(p.v),3.5,0,Math.PI*2);
        ctx.fillStyle=clr[y];ctx.fill();
        ctx.strokeStyle='rgba(21,37,56,.40)';ctx.lineWidth=1.5;ctx.stroke();
      });
    });
    if(!drawn){
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='9px sans-serif';
      ctx.textAlign='center';ctx.fillText('No data',W/2,H/2);
    }
  });
}

/* -- Profile topbar helper only (legacy notification writes disabled) -- */
(function(){
  function roleLabel(role){
    return ({super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',gap_owner:'Gap Owner',viewer:'Viewer'})[role]||role||'—';
  }
  window.refreshUserTopbar=function(){
    try{
      var name=window._fbName||'User', role=window._fbRole||'—';
      var n=document.getElementById('topUserName'), r=document.getElementById('topUserRole'), a=document.getElementById('topUserAvatar');
      if(n)n.textContent=name;
      if(r)r.textContent=roleLabel(role);
      if(a)a.textContent=(name||'U').charAt(0).toUpperCase();
      /* Do not touch #userAlertCount or #userAlertList here. Notifications are owned by the V12 single engine only. */
    }catch(e){}
  };
  function replacePerformanceIcon(){
    try{
      var card=document.querySelector("#_portalOverlay div[onclick*=\"performance\"]");
      if(!card)return;
      var icon=card.querySelector('div[style*="width:56px"]');
      if(icon){
        icon.style.background='linear-gradient(135deg,rgba(74,222,128,.20),rgba(1,149,175,.22))';
        icon.innerHTML='<svg width="34" height="34" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'+
          '<rect x="8" y="10" width="48" height="38" rx="6" stroke="#4ADE80" stroke-width="4"/>'+
          '<path d="M16 40L26 30L34 35L48 20" stroke="#0195af" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
          '<circle cx="16" cy="40" r="3" fill="#4ADE80"/><circle cx="26" cy="30" r="3" fill="#4ADE80"/><circle cx="34" cy="35" r="3" fill="#4ADE80"/><circle cx="48" cy="20" r="3" fill="#4ADE80"/>'+
          '<path d="M18 54H46" stroke="rgba(255,255,255,.65)" stroke-width="4" stroke-linecap="round"/>'+
        '</svg>';
      }
    }catch(e){}
  }
  function applyPortalBackground(){
    try{var bg=document.querySelector('#_bgLayer > div:first-child'); if(bg){bg.style.backgroundSize='cover';bg.style.backgroundPosition='center center';}}catch(e){}
  }
  document.addEventListener('DOMContentLoaded',function(){replacePerformanceIcon();applyPortalBackground();refreshUserTopbar();setInterval(refreshUserTopbar,30000);});
  setTimeout(function(){replacePerformanceIcon();applyPortalBackground();refreshUserTopbar();},600);
})();


/* ===========================================================
   QUMC Notifications — SINGLE CANONICAL ENGINE V12
   - One renderer only, one badge source only.
   - Read state is saved by user email, not by role/department.
   - Read notifications stay visible in the list.
   - Scope is applied at render time without changing read status.
   =========================================================== */
(function(){
  'use strict';
  if(window.__QUMC_NOTIF_SINGLE_ENGINE_V12__) return;
  window.__QUMC_NOTIF_SINGLE_ENGINE_V12__ = true;
  window.__QUMC_NOTIF_ENGINE_VERSION__ = 'v12.1-single-canonical-role-scoped';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function norm(s){ return String(s || '').toLowerCase().trim().replace(/[\u200e\u200f]/g,'').replace(/[_\s\-]+/g,' '); }
  function normKey(s){ return norm(s).replace(/[^a-z0-9\u0600-\u06ff]+/g,''); }
  function isAr(){ return (typeof window.lang !== 'undefined' && window.lang === 'ar') || document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar'; }
  function role(){ return norm(window._fbRole || window.currentUserRole || '').replace(/\s+/g,'_'); }
  function rawEmail(){
    var candidates = [];
    try{
      if(window._fbEmail) candidates.push(window._fbEmail);
      if(window.currentUserEmail) candidates.push(window.currentUserEmail);
      if(window._fbUser){
        if(typeof window._fbUser === 'string') candidates.push(window._fbUser);
        else if(window._fbUser.email) candidates.push(window._fbUser.email);
      }
      if(window.currentUser && window.currentUser.email) candidates.push(window.currentUser.email);
      candidates.push(sessionStorage.getItem('qumc_user_email'));
      candidates.push(localStorage.getItem('qumc_user_email'));
    }catch(_){ }
    for(var i=0;i<candidates.length;i++){
      var e = String(candidates[i] || '').toLowerCase().trim();
      if(e && e.indexOf('@') > 0 && e.indexOf('[object object]') < 0) return e;
    }
    return '';
  }
  function email(){ return rawEmail() || 'guest'; }
  function uname(){ return String(window._fbName || window.currentUserName || (rawEmail() ? rawEmail().split('@')[0] : 'User')).trim(); }
  function safeKey(s){ return String(s || 'guest').toLowerCase().trim().replace(/[^a-z0-9@._-]+/g,'_'); }
  function userSeenKey(){ return 'qumc_notifications_seen_single_v12_' + safeKey(email()); }
  function userHistoryKey(){ return 'qumc_notifications_history_single_v12_' + safeKey(email()); }
  function readJson(key, fallback){ try{ var x = JSON.parse(localStorage.getItem(key) || ''); return x == null ? fallback : x; }catch(_){ return fallback; } }
  function writeJson(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(_){ } }
  function readArray(key){ var a = readJson(key, []); return Array.isArray(a) ? a.filter(Boolean).map(String) : []; }
  function writeArray(key, arr){ writeJson(key, Array.from(new Set((arr || []).filter(Boolean).map(String))).slice(-900)); }
  function legacySeenKeys(){
    var keys = [userSeenKey()];
    try{
      for(var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i); if(!k) continue;
        if(k.indexOf('qumc_notifications_seen_') === 0 || k.indexOf('qumc_seen_notifs_') === 0){ if(keys.indexOf(k) < 0) keys.push(k); }
      }
    }catch(_){ }
    return keys;
  }
  function readSeen(){
    var merged = [];
    legacySeenKeys().forEach(function(k){ merged = merged.concat(readArray(k)); });
    var out = Array.from(new Set(merged.filter(Boolean).map(String)));
    if(out.length) writeArray(userSeenKey(), out);
    return out;
  }
  function writeSeen(arr){ writeArray(userSeenKey(), arr); }
  function readHistory(){
    var a = readJson(userHistoryKey(), []);
    if(!Array.isArray(a)) return [];
    return a.filter(function(n){ return n && n.id; });
  }
  function writeHistory(rows){
    var by = {};
    (rows || []).forEach(function(n){ if(n && n.id) by[String(n.id)] = Object.assign({}, by[String(n.id)] || {}, n); });
    var out = Object.keys(by).map(function(id){ return by[id]; }).sort(function(a,b){ return Number(b.ts || 0) - Number(a.ts || 0); }).slice(0,160);
    writeJson(userHistoryKey(), out);
  }

  function deptAlias(v){
    var x = normKey(v); if(!x) return '';
    if(x.indexOf('maintenance')>-1 || x.indexOf('صيانة')>-1) return 'maintenance';
    if(x.indexOf('safety')>-1 || x.indexOf('سلامة')>-1) return 'safety';
    if(x.indexOf('housekeeping')>-1 || x.indexOf('cleaning')>-1 || x.indexOf('hospitality')>-1 || x.indexOf('نظافة')>-1 || x.indexOf('فندقة')>-1) return 'housekeeping';
    if(x.indexOf('project')>-1 || x.indexOf('مشاريع')>-1 || x.indexOf('المشاريع')>-1) return 'projects';
    if(x.indexOf('governance')>-1 || x.indexOf('حوكمة')>-1) return 'governance';
    return x;
  }
  function dept(){ return deptAlias(window._fbDept || window._lockedDept || window.currentUserDept || ''); }
  function isSuper(){ var r=role(); return r === 'super_admin' || r === 'superadmin' || r === 'admin'; }
  function isExecutive(){ var r=role(); return r === 'executive'; }
  /* Global notification scope is intentionally limited to leadership/admin roles.
     Viewer is NOT global here; it follows the user's assigned department/KPIs. */
  function isGlobalViewer(){ return isSuper() || isExecutive(); }
  function isDeptScoped(){ var r=role(); return r === 'department_manager' || r === 'dept_manager' || r === 'viewer'; }
  function assigned(){
    var a = window._fbAssignedKpis; if(a === undefined || a === null) a = window.assignedKpis;
    if(typeof a === 'string') a = a.split(/[;,|]/);
    if(!Array.isArray(a)) return [];
    var out=[];
    a.forEach(function(x){
      if(x && typeof x === 'object'){
        [x.id,x.code,x.kpiCode,x.kpiId,x.name,x.nameEn,x.nameAr,x.title].forEach(function(v){ var n=normKey(v); if(n) out.push(n); });
      }else{
        var n=normKey(x); if(n) out.push(n);
      }
    });
    return Array.from(new Set(out));
  }
  function scopeReady(){
    var r = role();
    if(!rawEmail() || !r) return false;
    if(isGlobalViewer()) return true;
    if((r === 'kpi_owner' || r === 'gap_owner') && assigned().length) return true;
    return !!dept();
  }
  function state(){ try{ return window.ST || JSON.parse(localStorage.getItem('kpi_v3') || '{}') || {}; }catch(_){ return window.ST || {}; } }
  function allKpis(){ try{ if(typeof window.allK === 'function') return window.allK() || []; }catch(_){ } try{ if(Array.isArray(window.KPIS)) return window.KPIS; }catch(_){ } var st=state(); return Array.isArray(st.kpis) ? st.kpis : []; }
  function code(k){ return String(k && (k.id || k.code || k.kpiCode || k.kpi_id) || '').trim(); }
  function kname(k){ return String(k && (k.nameEn || k.name || k.nameAr || k.kpiName) || '').trim(); }
  function kdept(k){ return deptAlias(k && (k.dept || k.department || k.departmentId || k.section || k.sectionName)); }
  function year(k){ return String(k && (k.year || k.yr || k.fy) || '').trim() || 'current'; }
  function title(k, fallback){ return k ? ((code(k) || 'KPI') + (kname(k) ? ' — ' + kname(k) : '')) : (fallback || 'KPI'); }
  function num(v){
    if(v === null || v === undefined || v === '') return null;
    var s = String(v).trim().replace(/[٪%]/g,'').replace(/,/g,'').replace(/\s+/g,'');
    s = s.replace(/[٠-٩]/g,function(c){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }).replace(/[۰-۹]/g,function(c){ return '۰۱۲۳۴۵۶۷۸۹'.indexOf(c); });
    var n = Number(s); return isFinite(n) ? n : null;
  }
  function qvals(k){
    var out = [];
    ['q1','q2','q3','q4'].forEach(function(q){ var v = k && k[q]; if(v === undefined) v = k && k[q.toUpperCase()]; var n = num(v); if(n !== null) out.push({q:q, v:n}); });
    return out;
  }
  function met(k, v){
    try{ if(typeof window.metStatus === 'function') return !!window.metStatus(k, v); }catch(_){ }
    var n = num(v), t = num(k && (k.target || k.tg || k.targetValue)); if(n === null) return true; if(t === null) t = 100;
    var op = String(k && (k.op || k.operator || k.comparison) || '>=').toLowerCase();
    if(op.indexOf('<=')>-1 || op.indexOf('less')>-1 || op.indexOf('at most')>-1) return n <= t;
    if(op === '=' || op.indexOf('equal')>-1) return Math.abs(n - t) <= 0.05;
    return n >= t;
  }
  function ownedBy(obj){
    if(!obj) return false;
    var me = rawEmail(), nm = norm(uname());
    var vals = [obj.email,obj.userEmail,obj.ownerEmail,obj.assignedEmail,obj.responsibleEmail,obj.kpiOwnerEmail,obj.gapOwnerEmail,obj.owner,obj.kpiOwner,obj.gapOwner,obj.responsible,obj.responsiblePerson,obj.assignee,obj.user,obj.name].map(norm).filter(Boolean);
    return vals.some(function(v){ return (me && v.indexOf(me) > -1) || (nm && v.indexOf(nm) > -1); });
  }
  function canSee(k, extra){
    if(isGlobalViewer()) return true;
    var r = role(), d = dept(), a = assigned(), kc = normKey(code(k)), kn = normKey(kname(k)), kd = kdept(k);
    /* KPI / Gap owners: exact assigned KPI first; if no assignment was configured, fall back to ownership/email then department. */
    if(r === 'kpi_owner' || r === 'gap_owner'){
      if(a.length){ if(kc && a.indexOf(kc)>-1) return true; if(kn && a.indexOf(kn)>-1) return true; if(extra && ownedBy(extra)) return true; return false; }
      if(extra && ownedBy(extra)) return true;
      if(k && ownedBy(k)) return true;
      return !!(d && kd && d === kd);
    }
    /* Department managers and viewers are department-scoped for notifications. */
    if(isDeptScoped()) return !!(d && kd && d === kd);
    /* Any other non-admin role: show only explicitly assigned KPIs, otherwise nothing. */
    if(a.length){ if(kc && a.indexOf(kc)>-1) return true; if(kn && a.indexOf(kn)>-1) return true; if(extra && ownedBy(extra)) return true; }
    return false;
  }
  function baseGapCode(key){ return String(key || '').replace(/_(q[1-4])$/i,'').replace(/-(q[1-4])$/i,''); }
  function gapQuarter(key){ var m = String(key || '').match(/(?:_|-)(q[1-4])$/i); return m ? m[1].toLowerCase() : ''; }
  function findKpi(ks, c){ var nk = normKey(c); return (ks || []).find(function(k){ return normKey(code(k)) === nk; }) || null; }
  function gtext(o){
    o=o||{};
    return {
      root:String(o.gapEn||o.gapAr||o.rootCause||o.rootCauseEn||o.root||o.reason||o.gapReasons||'').trim(),
      action:String(o.actEn||o.actAr||o.correctiveAction||o.correctiveActions||o.actionPlan||o.action||o.actions||'').trim(),
      impact:String(o.impactEn||o.impactAr||o.impact||o.impactOfGap||'').trim()
    };
  }
  function statusText(st){
    var ar=isAr();
    return ({
      pending_manager: ar?'بانتظار مدير القسم':'Pending Department Manager',
      pending_super_admin: ar?'بانتظار السوبر أدمن':'Pending Super Admin',
      approved: ar?'تم الاعتماد النهائي':'Final approved',
      rejected_manager: ar?'مرفوض من مدير القسم':'Rejected by Department Manager',
      rejected_super_admin: ar?'مرفوض من السوبر أدمن':'Rejected by Super Admin'
    })[String(st||'')] || String(st||'');
  }
  function latestApprovalFor(approvals, k, q, predicate){
    var c = code(k), qq = String(q || '').toLowerCase();
    return (approvals || []).filter(function(r){
      return r && String(r.kpiId || r.kpiCode || '') === c && String(r.quarter || '').toLowerCase() === qq && (!predicate || predicate(r));
    }).sort(function(a,b){ return String(b.updatedAt || b.submittedAt || '').localeCompare(String(a.updatedAt || a.submittedAt || '')); })[0] || null;
  }
  function gapDone(gaps, actions, k, q){
    var c = code(k), qq = String(q || '').toLowerCase();
    var keys = [c+'_'+qq, c+'_'+qq.toUpperCase(), c+'-'+qq, c+'-'+qq.toUpperCase(), c];
    for(var i=0;i<keys.length;i++){
      var gt = gtext(gaps[keys[i]] || {}), at = gtext(actions[keys[i]] || {});
      if((gt.root || at.root) && (gt.action || at.action) && (gt.impact || at.impact)) return true;
    }
    return false;
  }

  function collectActive(){
    if(!scopeReady()) return null;
    var ks = allKpis(), st = state(), out = [];

    (ks || []).forEach(function(k){
      if(!canSee(k)) return;
      qvals(k).forEach(function(x){
        if(met(k, x.v)) return;
        var q = String(x.q).toUpperCase();
        out.push({
          id:'miss:'+normKey(code(k))+':'+year(k)+':'+String(x.q).toLowerCase(), type:'kpi_miss', level:'red',
          dept:kdept(k), kpiCode:code(k), kpiName:kname(k), quarter:String(x.q).toLowerCase(),
          title:title(k), meta:isAr()?('لم يحقق الهدف في '+q):('Missed target in '+q),
          body:isAr()?'هذا المؤشر ضمن صلاحيتك ولم يحقق الهدف في الربع المحدد ويحتاج متابعة.':'This KPI is within your permission scope and missed the target for this quarter.',
          active:true, ts:Date.now()
        });
      });
    });

    var gaps = st.gaps || st.gapAnalysis || st.gap_analysis || {}; if(Array.isArray(gaps)){ var tmp={}; gaps.forEach(function(g,i){ tmp[g.kpiId||g.kpiCode||g.id||i]=g; }); gaps=tmp; }
    var actions = st.actions || {};
    Object.keys(gaps || {}).forEach(function(key){
      var g = gaps[key] || {}, base = baseGapCode(key), k = findKpi(ks, base);
      if(!canSee(k, g)) return;
      var txt = gtext(g), status = norm(g.status || g.actionStatus || g.state || ''), pri = norm(g.priority || g.risk || g.severity || '');
      var open = !status || ['open','pending','in progress','inprogress','active','overdue'].some(function(x){ return status.indexOf(x)>-1; });
      if(!(open || txt.root || txt.action || txt.impact || pri.indexOf('high')>-1 || pri.indexOf('critical')>-1)) return;
      var q = gapQuarter(key) || 'all';
      out.push({
        id:'gap:'+normKey(base)+':'+q+':'+normKey(status||'open')+':'+normKey(pri||'normal'), type:'gap_action',
        level:(pri.indexOf('critical')>-1 || pri.indexOf('high')>-1) ? 'red' : 'orange',
        dept:k ? kdept(k) : deptAlias(g.dept || g.department), kpiCode:k ? code(k) : base, kpiName:k ? kname(k) : '', quarter:q,
        title:k ? title(k) : (base || 'Gap action'),
        meta:isAr()?('إجراء تحليل فجوة يحتاج متابعة'+(q!=='all'?' - '+q.toUpperCase():'')):('Gap action requires follow-up'+(q!=='all'?' - '+q.toUpperCase():'')),
        body:txt.action || txt.root || txt.impact || '', active:true, ts:Date.now()
      });
    });

    var approvals = Array.isArray(st.gapApprovals) ? st.gapApprovals : [];
    approvals.forEach(function(rq){
      if(!rq || !rq.id) return;
      var stt = String(rq.status || ''), rd = deptAlias(rq.dept || ''), rr = role(), show = false, level = 'blue', meta = '';
      if((rr === 'department_manager' || rr === 'dept_manager') && stt === 'pending_manager' && rd === dept()){
        show = true; level = 'orange'; meta = isAr()?'طلب تحليل فجوة بانتظار موافقتك':'Gap Analysis request pending your approval';
      }else if(isSuper() && stt === 'pending_super_admin'){
        show = true; level = 'orange'; meta = isAr()?'اعتماد نهائي مطلوب من السوبر أدمن':'Final Super Admin approval required';
      }else if((rr === 'department_manager' || rr === 'dept_manager') && rd === dept() && stt.indexOf('rejected') === 0){
        show = true; level = 'red'; meta = isAr()?'تم رفض طلب تحليل فجوة ضمن قسمك':'A Gap Analysis request in your department was rejected';
      }else if(isSuper() && stt.indexOf('rejected') === 0){
        show = true; level = 'red'; meta = isAr()?'تم رفض طلب تحليل فجوة':'A Gap Analysis request was rejected';
      }else if((rr === 'kpi_owner' || rr === 'gap_owner') && String(rq.submittedByEmail || '').toLowerCase() === rawEmail() && /^(rejected|approved)/.test(stt)){
        show = true; level = stt === 'approved' ? 'blue' : 'red';
        meta = stt === 'approved' ? (isAr()?'تم اعتماد تحليل الفجوة وانعكس على الداشبورد':'Gap Analysis approved and posted to dashboard') : (isAr()?'تم رفض الطلب؛ أدخل بيانات تحليل الفجوة من جديد':'Request rejected; please re-enter the Gap Analysis data');
      }
      if(!show) return;
      out.push({
        id:'gapapproval:'+rq.id+':'+stt, type:'gap_approval', approvalId:rq.id, level:level, dept:rd,
        kpiCode:rq.kpiCode || rq.kpiId, kpiName:rq.kpiNameEn || rq.kpiNameAr || '', quarter:String(rq.quarter || '').toLowerCase(),
        title:(rq.kpiCode || rq.kpiId || 'KPI')+' — '+(rq.kpiNameEn || rq.kpiNameAr || 'Gap Analysis')+(rq.quarter ? ' · '+String(rq.quarter).toUpperCase() : ''),
        meta:meta + (stt ? ' · '+statusText(stt) : ''),
        body:(String(stt).indexOf('rejected')===0 && (rq.superAdminNote || rq.managerNote)) ? ((isAr()?'سبب الرفض: ':'Reject reason: ')+(rq.superAdminNote || rq.managerNote)) : ((rq.payload && ((rq.payload.gapEn || rq.payload.gapAr || '')+' '+(rq.payload.actEn || rq.payload.actAr || '')+' '+(rq.payload.impactEn || rq.payload.impactAr || ''))) || ''),
        active:true, ts:Date.parse(rq.updatedAt || rq.submittedAt || '') || Date.now()
      });
    });

    if(role() === 'kpi_owner' || role() === 'gap_owner'){
      (ks || []).forEach(function(k){
        if(!canSee(k)) return;
        ['q1','q2','q3','q4'].forEach(function(q){
          var v = k && k[q]; if(v === undefined) v = k && k[q.toUpperCase()]; var n = num(v); if(n === null) return;
          if(met(k, n) !== false) return;
          if(gapDone(gaps, actions, k, q)) return;
          var live = latestApprovalFor(approvals, k, q, function(r){ return /^(pending_manager|pending_super_admin|approved)$/.test(String(r.status || '')); });
          if(live) return;
          var rejected = latestApprovalFor(approvals, k, q, function(r){ return String(r.status || '').indexOf('rejected') === 0; });
          out.push({
            id:'gapmissing:'+normKey(code(k))+':'+year(k)+':'+q+(rejected?':rejected:'+String(rejected.id):''), type:'gap_required', level:rejected?'red':'orange',
            dept:kdept(k), kpiCode:code(k), kpiName:kname(k), quarter:q,
            title:title(k),
            meta:rejected ? (isAr()?('تم رفض الطلب السابق - '+q.toUpperCase()):('Previous request rejected - '+q.toUpperCase())) : (isAr()?('بيانات تحليل الفجوة مطلوبة - '+q.toUpperCase()):('Gap Analysis data required - '+q.toUpperCase())),
            body:rejected ? (rejected.superAdminNote || rejected.managerNote || (isAr()?'يرجى تعديل البيانات وإعادة الإرسال.':'Please update the data and submit again.')) : (isAr()?'هذا الربع لم يحقق الهدف ولا توجد بيانات تحليل فجوة مكتملة.':'This quarter missed the target and does not have complete Gap Analysis data.'),
            active:true, ts:Date.parse((rejected && (rejected.updatedAt || rejected.submittedAt)) || '') || Date.now()
          });
        });
      });
    }

    var by = {};
    out.forEach(function(n){ if(n && n.id && allowed(n)) by[String(n.id)] = n; });
    return Object.keys(by).map(function(id){ return by[id]; });
  }
  function allowed(n){
    if(!n) return false;
    if(isGlobalViewer()) return true;
    var d=dept(), nd=deptAlias(n.dept || n.department || '');
    var a=assigned();
    var c=normKey(n.kpiCode || ''), name=normKey(n.kpiName || n.title || '');
    var rr=role();
    if(rr === 'kpi_owner' || rr === 'gap_owner'){
      if(a.length) return (c && a.indexOf(c)>-1) || (name && a.indexOf(name)>-1) || ownedBy(n);
      return ownedBy(n) || !!(d && nd && d === nd);
    }
    if(isDeptScoped()) return !!(d && nd && d === nd);
    if(a.length) return (c && a.indexOf(c)>-1) || (name && a.indexOf(name)>-1) || ownedBy(n);
    return false;
  }
  function rowsForList(){
    var active = collectActive();
    if(active === null) return readHistory().filter(allowed);
    var activeIds = {}, by = {};
    active.forEach(function(n){ activeIds[n.id] = true; by[n.id] = Object.assign({}, by[n.id] || {}, n, {active:true, ts:n.ts || Date.now()}); });
    readHistory().forEach(function(n){ if(!allowed(n)) return; if(!by[n.id]) by[n.id] = Object.assign({}, n, {active:false}); });
    var rows = Object.keys(by).map(function(id){ return by[id]; }).filter(allowed);
    writeHistory(rows);
    return rows;
  }
  function unreadActiveRows(){ var active = collectActive(); if(active === null) return []; var seen=readSeen(); return active.filter(function(n){ return seen.indexOf(String(n.id)) < 0; }); }
  function orderedRows(rows){
    var seen=readSeen();
    return (rows || []).slice().sort(function(a,b){
      var au = a.active !== false && seen.indexOf(String(a.id)) < 0, bu = b.active !== false && seen.indexOf(String(b.id)) < 0;
      if(au !== bu) return bu ? 1 : -1;
      if(!!a.active !== !!b.active) return b.active ? 1 : -1;
      return Number(b.ts || 0) - Number(a.ts || 0) || String(a.id).localeCompare(String(b.id));
    });
  }
  function ensureHeader(){
    var drop=$('userAlertDrop'); if(!drop) return;
    var h = drop.firstElementChild;
    if(h){
      h.innerHTML='<span>'+(isAr()?'الإشعارات':'Notifications')+'</span><button type="button" class="qumc-clear-notifs" id="qumcClearNotifs">'+(isAr()?'تحديد الكل كمقروء':'Mark all read')+'</button>';
      h.style.display='flex'; h.style.justifyContent='space-between'; h.style.alignItems='center';
    }
  }
  function renderNotifications(){
    var count=$('userAlertCount'), list=$('userAlertList');
    if(!scopeReady()){
      if(count){ count.textContent=''; count.style.display='none'; count.style.visibility='hidden'; count.style.opacity='0'; }
      if(list && !list.innerHTML.trim()) list.innerHTML='<div class="qumc-n-empty-final">'+(isAr()?'جاري تحميل الإشعارات…':'Loading notifications…')+'</div>';
      return [];
    }
    ensureHeader();
    var unread=unreadActiveRows(), rows=orderedRows(rowsForList()), seen=readSeen();
    if(count){ count.textContent=String(unread.length); count.style.display=unread.length?'flex':'none'; count.style.visibility=unread.length?'visible':'hidden'; count.style.opacity=unread.length?'1':'0'; }
    if(list){
      if(!rows.length){ list.innerHTML='<div class="qumc-n-empty-final">'+(isAr()?'لا توجد إشعارات مهمة ضمن صلاحيتك حالياً.':'No important notifications for your permission scope.')+'</div>'; }
      else{
        window._notifMap={}; rows.forEach(function(n){ window._notifMap[String(n.id)] = n; });
        list.innerHTML = rows.map(function(n){
          var id=String(n.id), read=seen.indexOf(id)>=0, old=n.active===false;
          var col=read || old ? '#64748B' : (n.level==='red'?'#C42B2B':(n.level==='orange'?'#D97706':'#0195af'));
          var tag = old ? '<span class="qumc-read-tag">'+(isAr()?'سابق':'old')+'</span>' : (read ? '<span class="qumc-read-tag">'+(isAr()?'مقروء':'read')+'</span>' : '');
          return '<div class="qumc-nrow-final '+(read?'is-read':'is-unread')+'" data-nid="'+esc(id)+'" style="opacity:'+(read||old?'.62':'1')+';cursor:pointer">'
            +'<span class="qumc-n-dot-final" style="background:'+col+'"></span>'
            +'<div><div class="qumc-n-title-final">'+esc(n.title)+' '+tag+'</div><div class="qumc-n-meta-final">'+esc(n.meta||'')+'</div></div></div>';
        }).join('');
        Array.prototype.forEach.call(list.querySelectorAll('.qumc-nrow-final'), function(row){
          row.onclick=function(ev){
            ev.preventDefault(); ev.stopPropagation();
            var id=String(row.getAttribute('data-nid')||''); var s=readSeen();
            if(id && s.indexOf(id)<0){ s.push(id); writeSeen(s); }
            var n=(window._notifMap||{})[id];
            handleNotificationOpen(n);
            renderNotifications();
            return false;
          };
        });
      }
    }
    var clr=$('qumcClearNotifs');
    if(clr){ clr.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); var r=rowsForList(); writeSeen(readSeen().concat(r.map(function(n){return String(n.id);}))); renderNotifications(); return false; }; }
    return rows;
  }
  function positionPanel(panel, anchor, width){
    if(!panel || !anchor) return;
    try{ if(panel.parentElement !== document.body) document.body.appendChild(panel); }catch(_){ }
    var r = anchor.getBoundingClientRect(), w = width || 360;
    panel.style.position='fixed'; panel.style.width=w+'px'; panel.style.top=(r.bottom+10)+'px'; panel.style.left=Math.max(12, Math.min(window.innerWidth-w-12, r.right-w))+'px'; panel.style.right='auto'; panel.style.zIndex='2147483646';
  }
  function closePanel(id){ var el=$(id); if(el){ el.style.display='none'; el.classList.remove('qumc-final-open','qumc-stay-open','qumc-profile-open'); } }
  function roleLabel(r){ return ({super_admin:'Super Admin',superadmin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',dept_manager:'Dept Manager',kpi_owner:'KPI Owner',gap_owner:'Gap Owner',viewer:'Viewer'})[r] || r || '—'; }
  function refreshProfile(){
    var name=uname() || 'User', mail=rawEmail() || '—', r=roleLabel(role()), d=dept() || window._fbDept || '—';
    var ids={topUserName:name, topUserRole:r, profileName:name, profileEmail:mail, profileNameRow:name, profileRoleRow:r, profileDeptRow:d, profileLastLoginRow:'Current session'};
    Object.keys(ids).forEach(function(id){ var el=$(id); if(el) el.textContent=ids[id]; });
    ['topUserAvatar','profileAvatar'].forEach(function(id){ var el=$(id); if(el) el.textContent=(name||'U').charAt(0).toUpperCase(); });
  }
  function toggleUserAlerts(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    closePanel('userProfileDrop');
    var d=$('userAlertDrop'), b=$('userAlertBtn'); if(!d) return false;
    var open=d.style.display !== 'block';
    if(open){ positionPanel(d,b,360); d.style.display='block'; d.classList.add('qumc-final-open','qumc-stay-open'); renderNotifications(); }
    else closePanel('userAlertDrop');
    return false;
  }
  function toggleUserProfile(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    closePanel('userAlertDrop'); refreshProfile();
    var p=$('userProfileDrop'), b=$('topUserBadge'); if(!p) return false;
    var open=p.style.display !== 'block';
    if(open){ positionPanel(p,b,320); p.style.display='block'; p.classList.add('qumc-profile-open','qumc-final-open'); }
    else closePanel('userProfileDrop');
    return false;
  }
  function showModal(n){
    if(!n) return;
    var old=$('_notifModal'); if(old) old.remove();
    var c=n.level==='red'?'#C42B2B':(n.level==='orange'?'#D97706':'#0195af');
    var ov=document.createElement('div'); ov.id='_notifModal'; ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(8,18,35,.36);backdrop-filter:blur(9px);display:flex;align-items:center;justify-content:center;padding:18px;';
    var box=document.createElement('div'); box.style.cssText='width:min(460px,94vw);background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.72);box-shadow:0 26px 80px rgba(2,8,23,.24);border-radius:22px;padding:0;overflow:hidden;direction:'+(isAr()?'rtl':'ltr');
    box.innerHTML='<div style="padding:18px 20px;border-bottom:1px solid rgba(15,23,42,.08);display:flex;gap:12px;align-items:flex-start"><div style="width:10px;height:10px;margin-top:5px;border-radius:50%;background:'+c+';box-shadow:0 0 0 5px '+c+'22"></div><div style="flex:1"><div style="font-size:13px;font-weight:900;color:#152538;margin-bottom:5px">'+esc(n.title||'Notification')+'</div><div style="font-size:11px;color:#64748B;line-height:1.6">'+esc(n.meta||'')+'</div></div><button onclick="window._closeNotifModal()" style="border:none;background:rgba(15,23,42,.06);color:#475569;border-radius:10px;width:30px;height:30px;cursor:pointer;font-weight:900">×</button></div><div style="padding:18px 20px"><div style="font-size:12px;color:#334155;line-height:1.85;background:rgba(248,250,252,.78);border:1px solid rgba(226,232,240,.75);border-radius:14px;padding:14px">'+esc(n.body||n.meta||'')+'</div><button onclick="window._closeNotifModal()" style="margin-top:14px;width:100%;padding:10px;border:none;border-radius:12px;background:#0195af;color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">'+(isAr()?'تم':'Done')+'</button></div>';
    ov.appendChild(box); ov.onclick=function(e){ if(e.target===ov) ov.remove(); }; document.body.appendChild(ov);
  }
  function handleNotificationOpen(n){
    if(n && n.type === 'gap_approval'){
      if(typeof window._showGapApprovalDetails === 'function'){ window._showGapApprovalDetails(n.approvalId); return; }
      if(typeof window._showGapApprovals === 'function'){ window._showGapApprovals(); return; }
    }
    if(n && n.type === 'gap_required' && typeof window.openGapQuarter === 'function'){
      window.openGapQuarter(n.kpiCode, String(n.quarter || 'q1').toLowerCase()); return;
    }
    showModal(n);
  }
  function showLoginPage(){
    var pass=$('_fbPass'); if(pass) pass.value='';
    try{ window._fbUser=''; window._fbEmail=''; window._fbName=''; window._fbRole=''; window._fbDept=null; window._lockedDept=null; window._fbAssignedKpis=null; }catch(_){ }
    try{ sessionStorage.clear(); }catch(_){ }
    try{ Object.keys(localStorage).forEach(function(k){ if(/firebase|auth|current|session|token|user/i.test(k)) localStorage.removeItem(k); }); }catch(_){ }
    var bg=$('_bgLayer'), auth=$('_authOverlay'), portal=$('_portalOverlay'), forgot=$('_forgotOverlay');
    if(portal) portal.style.display='none'; if(forgot) forgot.style.display='none'; if(bg){ bg.style.display='block'; bg.style.zIndex='9990'; } if(auth){ auth.style.display='flex'; auth.style.zIndex='9998'; }
    Array.prototype.forEach.call(document.querySelectorAll('.dashwrap,.topbar,.filter-strip,.tabnav,.footbar'),function(x){ x.style.display='none'; });
    closePanel('userProfileDrop'); closePanel('userAlertDrop');
  }
  function logout(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    try{ if(typeof window.addAudit === 'function') window.addAudit('LOGOUT','User logout'); }catch(_){ }
    var old=window.__qumcOriginalDoLogout || window._doLogout;
    try{ if(old && old !== window.qumcLogoutToLogin) old(); }catch(_){ }
    setTimeout(showLoginPage,80); return false;
  }
  function bind(){
    refreshProfile(); renderNotifications();
    var ab=$('userAlertBtn'), ub=$('topUserBadge'), lo=$('profileLogoutBtn');
    if(ab && ab.dataset.qumcNotifV12 !== '1'){
      ab.dataset.qumcNotifV12='1'; ab.onclick=null; ab.addEventListener('click', toggleUserAlerts, true);
    }
    if(ub && ub.dataset.qumcProfileV12 !== '1'){
      ub.dataset.qumcProfileV12='1'; ub.onclick=null; ub.addEventListener('click', toggleUserProfile, true);
    }
    if(lo && lo.dataset.qumcLogoutV12 !== '1'){
      lo.dataset.qumcLogoutV12='1'; lo.onclick=logout; lo.addEventListener('click', logout, true);
    }
    try{ var wrap=$('userNotifyWidget'); if(wrap) wrap.classList.add('qumc-user-widget-modern'); var badge=$('topUserBadge'); if(badge) badge.classList.add('qumc-user-badge-modern'); var alert=$('userAlertBtn'); if(alert) alert.classList.add('qumc-alert-btn-modern'); var drop=$('userProfileDrop'); if(drop) drop.classList.add('qumc-profile-glass'); }catch(_){ }
  }

  window.renderNotifications = renderNotifications;
  window.updateAlertUI = renderNotifications;
  window.buildUserAlerts = rowsForList;
  window.collectNotifications = rowsForList;
  window.debugNotificationScope = function(){
    return {version:window.__QUMC_NOTIF_ENGINE_VERSION__, email:rawEmail(), role:role(), dept:dept(), assigned:assigned(), unread:unreadActiveRows().length, rows:rowsForList().map(function(n){return {id:n.id,type:n.type,dept:n.dept,kpiCode:n.kpiCode,kpiName:n.kpiName,meta:n.meta};})};
  };
  window.toggleUserAlerts = toggleUserAlerts;
  window.toggleUserProfile = toggleUserProfile;
  window._showNotifModal = handleNotificationOpen;
  window._closeNotifModal = function(){ var m=$('_notifModal'); if(m) m.remove(); };
  if(!window.__qumcOriginalDoLogout && window._doLogout && window._doLogout !== logout) window.__qumcOriginalDoLogout = window._doLogout;
  window.qumcLogoutToLogin = logout;
  window._doLogout = logout;

  document.addEventListener('click', function(ev){
    var w=$('userNotifyWidget'), d=$('userAlertDrop'), p=$('userProfileDrop');
    if(w && w.contains(ev.target)) return;
    if(d && d.contains(ev.target)) return;
    if(p && p.contains(ev.target)) return;
    closePanel('userAlertDrop'); closePanel('userProfileDrop');
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  setTimeout(bind,300); setTimeout(bind,1200); setTimeout(bind,3000);
  setInterval(function(){ try{ renderNotifications(); refreshProfile(); }catch(_){ } }, 30000);
})();

/* ── User Requests: Submit form + My Requests view (user-facing) ──
   Appended to notifications.js. Injects buttons into profile dropdown.
   ────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  var REQ_TYPES_EN=['Add KPI','Edit KPI','Delete KPI','Report Issue','Access Request','General Request','Other'];
  var REQ_TYPES_AR=['إضافة مؤشر','تعديل مؤشر','حذف مؤشر','إبلاغ عن مشكلة','طلب وصول','طلب عام','أخرى'];

  /* ── Inject "Submit Request" + "My Requests" buttons into profile dropdown ── */
  function _injectReqButtons(){
    var drop=document.getElementById('userProfileDrop');
    if(!drop||document.getElementById('_profileReqBtns')) return;
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var wrap=document.createElement('div');
    wrap.id='_profileReqBtns';
    wrap.className='qumc-profile-requests-panel'; wrap.style.cssText='display:flex;flex-direction:column;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07);margin-top:4px;';
    wrap.innerHTML=
      '<div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">'+(isAr?'الطلبات':'Requests')+'</div>'
      +'<button id="_profileSubmitReq" class="qumc-profile-request-btn qumc-profile-request-btn-primary" style="width:100%;padding:9px 12px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.28);border-radius:12px;color:#0195af;font-size:10px;font-weight:800;cursor:pointer;text-align:left;">'
      +'✚ '+(isAr?'إرسال طلب جديد':'Submit a Request')+'</button>'
      +'<button id="_profileMyReqs" class="qumc-profile-request-btn qumc-profile-request-btn-soft" style="width:100%;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#94a3b8;font-size:10px;font-weight:800;cursor:pointer;text-align:left;">'
      +'📋 '+(isAr?'طلباتي':'My Requests')+'</button>';
    /* Insert before logout button */
    var logout=drop.querySelector('.qumc-logout-btn,#profileLogoutBtn');
    if(logout) drop.insertBefore(wrap,logout);
    else drop.appendChild(wrap);
    document.getElementById('_profileSubmitReq').onclick=function(){window._showSubmitRequestForm();};
    document.getElementById('_profileMyReqs').onclick=function(){window._showMyRequests();};
  }

  /* Call injection whenever profile is opened */
  var _origToggle=window.toggleUserProfile;
  window.toggleUserProfile=function(){
    var ret=_origToggle?_origToggle.apply(this,arguments):undefined;
    setTimeout(_injectReqButtons,80);
    return ret;
  };
  /* Also try on page load */
  window.addEventListener('load',function(){
    setTimeout(_injectReqButtons,1200);
    /* Re-inject every time profile is viewed (covers edge cases) */
    setInterval(function(){
      if(document.getElementById('userProfileDrop') && !document.getElementById('_profileReqBtns')){
        _injectReqButtons();
      }
    }, 2000);
  });

  /* ── Submit Request form ── */
  window._showSubmitRequestForm=function(){
    var existing=document.getElementById('submitReqOv'); if(existing)existing.remove();
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var ov=document.createElement('div'); ov.id='submitReqOv'; ov.className='qumc-request-overlay qumc-submit-request-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:9200;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var typeOpts=isAr
      ?REQ_TYPES_AR.map(function(t,i){return '<option value="'+REQ_TYPES_EN[i]+'">'+t+'</option>';}).join('')
      :REQ_TYPES_EN.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
    ov.innerHTML='<div class="qumc-request-card qumc-submit-request-card" style="background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(480px,100%);display:flex;flex-direction:column;gap:16px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div><div style="font-size:14px;font-weight:800;color:#e2e8f0">'+(isAr?'إرسال طلب جديد':'Submit a Request')+'</div>'
      +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'سيتم مراجعته من قِبل المسؤول الأعلى':'Will be reviewed by Super Admin')+'</div></div>'
      +'<button onclick="document.getElementById(\'submitReqOv\').remove()" style="width:30px;height:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#94a3b8;cursor:pointer;font-size:15px">&#x2715;</button>'
      +'</div>'
      +'<div><label style="display:block;font-size:10px;font-weight:700;color:#64748b;margin-bottom:5px">'+(isAr?'نوع الطلب':'Request Type')+'</label>'
      +'<select id="reqTypeSelect" style="width:100%;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#e2e8f0;font-size:11px;font-family:inherit">'+typeOpts+'</select></div>'
      +'<div><label style="display:block;font-size:10px;font-weight:700;color:#64748b;margin-bottom:5px">'+(isAr?'تفاصيل الطلب *':'Request Details *')+'</label>'
      +'<textarea id="reqMessageArea" rows="5" placeholder="'+(isAr?'اكتب تفاصيل طلبك هنا...':'Describe your request in detail...')+'" '
      +'style="width:100%;padding:9px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#e2e8f0;font-size:11px;font-family:inherit;resize:vertical;box-sizing:border-box"></textarea></div>'
      +'<div id="reqSubmitFb" style="font-size:10px;font-weight:600;display:none;padding:7px 12px;border-radius:7px"></div>'
      +'<button id="reqSubmitBtn" onclick="_doSubmitRequest()" '
      +'style="padding:10px 20px;background:linear-gradient(90deg,#0195af,#0077cc);border:none;border-radius:9px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">'
      +(isAr?'إرسال الطلب':'Submit Request')+'</button></div>';
    document.body.appendChild(ov);
    ov.onclick=function(e){if(e.target===ov)ov.remove();};
    setTimeout(function(){var el=document.getElementById('reqMessageArea');if(el)el.focus();},100);
  };

  window._doSubmitRequest=function(){
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var typeEl=document.getElementById('reqTypeSelect');
    var msgEl=document.getElementById('reqMessageArea');
    var fbEl=document.getElementById('reqSubmitFb');
    var btnEl=document.getElementById('reqSubmitBtn');

    /* ── Diagnostic: show all failure conditions visibly ── */
    function _showErr(msg){
      if(fbEl){
        fbEl.textContent=msg;
        fbEl.style.color='#DC2626';
        fbEl.style.background='rgba(220,38,38,.08)';
        fbEl.style.padding='8px 12px';
        fbEl.style.borderRadius='7px';
        fbEl.style.fontWeight='600';
        fbEl.style.fontSize='10.5px';
        fbEl.style.display='block';
      }
      console.error('[UserReq]',msg);
    }
    if(!typeEl||!msgEl){_showErr('⚠ Form elements missing (reqTypeSelect/reqMessageArea)');return;}
    var reqType=typeEl.value.trim();
    var message=msgEl.value.trim();
    if(!message){
      if(fbEl){fbEl.textContent=isAr?'⚠ يرجى كتابة تفاصيل الطلب':'⚠ Please enter request details';fbEl.style.color='#DC2626';fbEl.style.background='rgba(220,38,38,.08)';fbEl.style.display='block';}
      return;
    }
    if(typeof window._kpiRequestsSubmit!=='function'){
      if(fbEl){fbEl.textContent='⚠ Requests not available — check connection';fbEl.style.color='#DC2626';fbEl.style.background='rgba(220,38,38,.08)';fbEl.style.display='block';}
      return;
    }
    if(btnEl){btnEl.disabled=true;btnEl.textContent=isAr?'جاري الإرسال...':'Submitting...';}
    if(fbEl){fbEl.style.display='none';}
    /* Verify API and auth — show exact failure */
    if(typeof window._kpiRequestsSubmit!=='function'){
      _showErr('⚠ Firebase request API not loaded. Check: firebase.js type=module, no console errors.');
      if(btnEl){btnEl.disabled=false;btnEl.textContent=isAr?'إرسال الطلب':'Submit Request';}
      return;
    }
    if(!window._fbUser){
      _showErr('⚠ No authenticated user (window._fbUser is empty). Please log out and log in again.');
      if(btnEl){btnEl.disabled=false;btnEl.textContent=isAr?'إرسال الطلب':'Submit Request';}
      return;
    }
    console.log('[UserReq] Submitting as:', window._fbUser, 'type:', reqType);
    window._kpiRequestsSubmit(reqType,message).then(function(){
      if(fbEl){fbEl.textContent=isAr?'✓ تم إرسال طلبك بنجاح. سيتم الرد عليه قريباً.':'✓ Request submitted. You will be notified of the response.';fbEl.style.color='#16A34A';fbEl.style.background='rgba(22,163,74,.08)';fbEl.style.display='block';}
      if(msgEl)msgEl.value='';
      if(btnEl){btnEl.disabled=false;btnEl.textContent=isAr?'إرسال طلب آخر':'Submit Another';}
      setTimeout(function(){var ov=document.getElementById('submitReqOv');if(ov)ov.remove();},3000);
    }).catch(function(e){
      var errMsg = (e.code ? e.code : '') + (e.message ? ': '+e.message : '');
      if(!errMsg) errMsg = String(e);
      /* Firestore permission-denied — show exact rule needed */
      if(e.code === 'permission-denied') errMsg = '⛔ Firestore permission-denied.\nAdd this rule in Firebase Console → Firestore → Rules:\n  match /kpi_requests/{doc}{\n    allow read, write: if request.auth != null;\n  }';
      /* Fallback: save to localStorage */
      try{
        if(!window.ST) window.ST={};
        if(!window.ST.requests) window.ST.requests=[];
        window.ST.requests.unshift({id:'req_'+Date.now(),user:window._fbName||window._fbUser,type:reqType,msg:message,status:'pending (local)',ts:new Date().toISOString()});
        if(typeof localStorage!=='undefined') localStorage.setItem('kpi_v3',JSON.stringify(window.ST));
        if(fbEl){fbEl.textContent='⚠ Saved locally (Firestore rules not set — see details above)';fbEl.style.color='#D97706';fbEl.style.background='rgba(217,119,6,.08)';fbEl.style.display='block';}
        if(btnEl){btnEl.disabled=false;btnEl.textContent=isAr?'تم الحفظ محلياً':'Saved Locally';}
        return;
      }catch(_){}
      _showErr('⚠ '+errMsg);
      if(btnEl){btnEl.disabled=false;btnEl.textContent=isAr?'إرسال الطلب':'Submit Request';}
    });
  };

  /* ── My Requests view ── */
  window._showMyRequests=function(){
    var existing=document.getElementById('myReqOv'); if(existing)existing.remove();
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var ov=document.createElement('div'); ov.id='myReqOv'; ov.className='qumc-request-overlay qumc-my-requests-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:9200;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');
    box.className='qumc-request-card qumc-my-requests-card'; box.style.cssText='background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(700px,100%);max-height:80vh;display:flex;flex-direction:column;gap:16px;';
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div><div style="font-size:14px;font-weight:800;color:#e2e8f0">'+(isAr?'طلباتي':'My Requests')+'</div>'
      +'<div style="font-size:10px;color:#64748b;margin-top:2px">'+(isAr?'جميع طلباتك والردود عليها':'All your submitted requests and responses')+'</div></div>'
      +'<div style="display:flex;gap:8px">'
      +'<button onclick="var e=document.getElementById(\'myReqOv\');if(e)e.remove();window._showSubmitRequestForm();" style="padding:6px 14px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer">+ '+(isAr?'طلب جديد':'New Request')+'</button>'
      +'<button onclick="document.getElementById(\'myReqOv\').remove()" style="width:30px;height:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#94a3b8;cursor:pointer;font-size:15px">&#x2715;</button>'
      +'</div></div>'
      +'<div id="myReqBody" style="overflow-y:auto;flex:1;min-height:160px;display:flex;align-items:center;justify-content:center">'
      +'<div style="color:#64748b;font-size:11px">'+(isAr?'جاري التحميل...':'Loading...')+'</div></div>';
    ov.appendChild(box);
    document.body.appendChild(ov);
    ov.onclick=function(e){if(e.target===ov)ov.remove();};

    if(typeof window._kpiRequestsGetMine!=='function'){
      var b=document.getElementById('myReqBody');
      if(b) b.innerHTML='<div style="color:#DC2626;font-size:11px">Requests not available.</div>';
      return;
    }
    window._kpiRequestsGetMine().then(function(reqs){
      var body=document.getElementById('myReqBody'); if(!body) return;
      var isAr=(typeof lang!=='undefined'&&lang==='ar');
      if(!reqs||!reqs.length){
        body.innerHTML='<div style="color:#64748b;font-size:11px;text-align:center;padding:32px">'+(isAr?'لم تقم بإرسال أي طلبات بعد':'You have not submitted any requests yet')+'</div>';
        return;
      }
      var statusColor={pending:'#D97706',approved:'#16A34A',rejected:'#DC2626'};
      var statusLabel={
        pending:isAr?'معلق':'Pending',
        approved:isAr?'موافق عليه':'Approved',
        rejected:isAr?'مرفوض':'Rejected'
      };
      var html='<div style="display:flex;flex-direction:column;gap:10px;padding:2px;">';
      reqs.forEach(function(r){
        var sc=statusColor[r.status]||'#64748b';
        var sl=statusLabel[r.status]||r.status||'—';
        var ts=typeof window._fmtTs==='function'?window._fmtTs(r.createdAt):'—';
        html+='<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px">'
          +'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">'
          +'<div style="display:flex;align-items:center;gap:8px">'
          +'<span style="font-size:10px;font-weight:700;color:#e2e8f0">'+htmlEsc(r.requestType||'—')+'</span>'
          +'<span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:'+sc+'22;color:'+sc+'">'+sl+'</span>'
          +'</div>'
          +'<span style="font-size:9px;color:#475569;white-space:nowrap">'+htmlEsc(ts)+'</span></div>'
          +'<div style="font-size:10.5px;color:#94a3b8;line-height:1.5">'+htmlEsc(r.message||'')+'</div>'
          +(r.superAdminComment
            ?'<div style="background:rgba(1,149,175,.08);border:1px solid rgba(1,149,175,.2);border-radius:7px;padding:8px 10px">'
              +'<div style="font-size:9px;font-weight:700;color:#0195af;margin-bottom:3px">'+(isAr?'رد المسؤول:':'Admin Response:')+'</div>'
              +'<div style="font-size:10.5px;color:#e2e8f0">'+htmlEsc(r.superAdminComment)+'</div></div>'
            :(r.status==='pending'
              ?'<div style="font-size:9px;color:#475569;font-style:italic">'+(isAr?'في انتظار الرد...':'Awaiting response...')+'</div>'
              :''))
          +'</div>';
      });
      html+='</div>';
      body.innerHTML=html;
    }).catch(function(e){
      var body=document.getElementById('myReqBody');
      if(body) body.innerHTML='<div style="color:#DC2626;font-size:11px">Error: '+htmlEsc(e.message)+'</div>';
    });
  };

})();
