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

/* -- Notification centre: alert badge, bell dropdown -- */
(function(){
  function roleLabel(role){
    return ({super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',viewer:'Viewer'})[role]||role||'—';
  }
  function getUserAlerts(){
    try{
      var user=(window._fbEmail||'').toLowerCase();
      var role=window._fbRole||'';
      var assigned=Array.isArray(window._fbAssignedKpis)?window._fbAssignedKpis:[];
      var ks=(typeof allK==='function'?allK():[]);
      var gaps=(window.ST&&ST.gaps)||{};
      var actions=(window.ST&&ST.actions)||{};
      var list=[];
      ks.forEach(function(k){
        if(role==='kpi_owner' && assigned.length && assigned.indexOf(k.id)===-1) return;
        var missed=(typeof ok==='function')?ok(k)===false:false;
        var g=gaps[k.id]||{}, a=actions[k.id]||{};
        var st=(g.status||a.status||'').toString().toLowerCase();
        var pri=(g.priority||a.priority||'').toString().toLowerCase();
        var owner=(g.owner||g.responsible||g.responsiblePerson||a.owner||a.responsible||'').toString().toLowerCase();
        var due=g.due||g.dueDate||g.date||a.due||a.dueDate||'';
        var relevant=!user || !owner || owner.indexOf(user.split('@')[0])>-1 || owner.indexOf(user)>-1 || role!=='kpi_owner';
        if((missed||st==='in-progress'||pri==='critical'||pri==='high') && relevant){
          list.push({
            title:(k.id||'KPI')+' — '+(k.nameEn||k.name||'KPI'),
            meta:(missed?'Missed target':'Needs follow-up')+(pri?' · '+pri.toUpperCase():'')+(due?' · Due: '+due:''),
            status:st||'pending'
          });
        }
      });
      return list.slice(0,20);
    }catch(e){return [];}
  }
  window.refreshUserTopbar=function(){
    try{
      var name=window._fbName||'User', role=window._fbRole||'—';
      var n=document.getElementById('topUserName'), r=document.getElementById('topUserRole'), a=document.getElementById('topUserAvatar');
      if(n)n.textContent=name;
      if(r)r.textContent=roleLabel(role);
      if(a)a.textContent=(name||'U').charAt(0).toUpperCase();
      var alerts=getUserAlerts(), c=document.getElementById('userAlertCount'), list=document.getElementById('userAlertList');
      if(c){c.textContent=alerts.length; c.style.display=alerts.length?'flex':'none';}
      if(list){
        list.innerHTML=alerts.length?alerts.map(function(x){
          return '<div style="padding:9px 10px;border-bottom:1px solid #EEF2F7">'+
            '<div style="font-size:11px;font-weight:800;color:#152538;margin-bottom:3px">'+String(x.title).replace(/[&<>]/g,function(s){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[s]})+'</div>'+
            '<div style="font-size:9.5px;color:#64748B;line-height:1.45">'+String(x.meta).replace(/[&<>]/g,function(s){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[s]})+'</div>'+
          '</div>';
        }).join(''):'<div style="padding:18px;text-align:center;color:#94A3B8;font-size:11px">No important alerts for this user.</div>';
      }
    }catch(e){}
  };
  window.toggleUserAlerts=function(ev){
    if(ev)ev.stopPropagation();
    refreshUserTopbar();
    var d=document.getElementById('userAlertDrop');
    if(d)d.style.display=d.style.display==='block'?'none':'block';
  };
  document.addEventListener('click',function(e){
    var d=document.getElementById('userAlertDrop');
    if(d && !e.target.closest('#userNotifyWidget')) d.style.display='none';
  });
  var oldBadge=window.updateUserBadge;
  window.updateUserBadge=function(name,role,perms){
    try{ if(typeof oldBadge==='function') oldBadge(name,role,perms); }catch(_){}
    window._fbName=name||window._fbName||'User'; window._fbRole=role||window._fbRole||'';
    setTimeout(refreshUserTopbar,50);
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
    try{
      var bg=document.querySelector('#_bgLayer > div:first-child');
      if(bg){
        bg.style.backgroundSize='cover';
        bg.style.backgroundPosition='center center';
      }
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',function(){
    replacePerformanceIcon();
    applyPortalBackground();
    refreshUserTopbar();
    setInterval(refreshUserTopbar,30000); /* [FIXED] 5s→30s */
  });
  setTimeout(function(){replacePerformanceIcon();applyPortalBackground();refreshUserTopbar();},600);
})();

/* -- User profile dropdown, logout, notification badge -- */
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id);};
  function text(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function role(){return String(window._fbRole||'').toLowerCase();}
  function dept(){return String(window._fbDept||window._lockedDept||'').toLowerCase();}
  function userKey(){return String(window._fbUser||window._fbEmail||window._fbName||'guest').toLowerCase();}
  function readSeen(){try{return JSON.parse(localStorage.getItem('qumc_seen_notifs_'+userKey())||'[]')||[];}catch(e){return[];}}
  function writeSeen(a){try{localStorage.setItem('qumc_seen_notifs_'+userKey(),JSON.stringify(Array.from(new Set(a))));}catch(e){}}
  function canSeeKpi(k){
    var r=role(), d=dept();
    if(!k)return false;
    if(r==='super_admin'||r==='admin'||r==='executive')return true;
    if(d && String(k.dept||'').toLowerCase()!==d)return false;
    if(r==='kpi_owner'){
      var asg=window._fbAssignedKpis;
      if(Array.isArray(asg)&&asg.length&&asg.indexOf(k.id)<0)return false;
    }
    return true;
  }
  function qvals(k){var qs=['q1','q2','q3','q4'];return qs.map(function(q){return {q:q,v:k[q]};}).filter(function(x){return x.v!==null&&x.v!==undefined&&!isNaN(x.v);});}
  function met(k,v){try{if(typeof window.metStatus==='function')return window.metStatus(k,v);}catch(e){} var t=Number(k.target||k.ta||100), op=k.op||'>='; if(op==='<=')return Number(v)<=t;if(op==='=')return Math.abs(Number(v)-t)<=.05;return Number(v)>=t;}
  function kName(k){return (k.id||k.code||'KPI')+' — '+(k.nameEn||k.name||k.nameAr||'KPI');}
  function collectNotifications(){
    var out=[];var ks=[];try{ks=typeof window.allK==='function'?window.allK():(Array.isArray(window.KPIS)?window.KPIS:[]);}catch(e){ks=[];}
    ks.forEach(function(k){
      if(!canSeeKpi(k))return;
      var vals=qvals(k);var missed=vals.filter(function(x){return !met(k,x.v);});
      if(missed.length){out.push({id:'miss_'+(k.id||'')+'_'+(k.yr||''),level:'red',title:kName(k),meta:'Missed target in '+missed.map(function(x){return x.q.toUpperCase();}).join(', ')});}
      var valsAll=vals.length?vals:[]; if(!valsAll.length){out.push({id:'nodata_'+(k.id||'')+'_'+(k.yr||''),level:'blue',title:kName(k),meta:'No quarterly data entered yet'});}
    });
    try{var acts=(window.ST&&window.ST.actions)||{};Object.keys(acts).forEach(function(id){var a=acts[id]||{};var k=ks.find(function(x){return x.id===id;});if(k&&!canSeeKpi(k))return;if(a.status&&String(a.status).toLowerCase()!=='closed'){out.push({id:'act_'+id+'_'+(a.status||''),level:(role()==='kpi_owner'?'red':'orange'),title:(id||'Gap action'),meta:'Gap action status: '+a.status});}});}catch(e){}
    var seen=readSeen();
    var map={};out.forEach(function(n){if(n&&n.id&&!map[n.id]&&seen.indexOf(n.id)<0)map[n.id]=n;});
    return Object.keys(map).map(function(k){return map[k];}).slice(0,30);
  }
  function renderNotifications(){
    if(typeof window.renderNotifications==='function'&&window.renderNotifications!==renderNotifications)return window.renderNotifications(false);
    var arr=collectNotifications();
    var c=$('userAlertCount'), list=$('userAlertList'), drop=$('userAlertDrop');
    if(c){c.textContent=arr.length;c.style.display=arr.length?'flex':'none';}
    if(drop){
      var h=drop.firstElementChild;
      if(h){h.innerHTML='<span>Notifications</span><button type="button" class="qumc-clear-notifs" id="qumcClearNotifs">Clear all</button>';h.style.display='flex';h.style.justifyContent='space-between';h.style.alignItems='center';}
    }
    if(list){
      list.style.padding='0';list.style.maxHeight='310px';
      list.innerHTML=arr.length?arr.map(function(n){var col=n.level==='red'?'#C42B2B':(n.level==='orange'?'#D97706':'#0195af');return '<div class="qumc-nrow" data-nid="'+text(n.id)+'"><span class="qumc-n-dot" style="background:'+col+'"></span><div><div class="qumc-n-title">'+text(n.title)+'</div><div class="qumc-n-meta">'+text(n.meta)+'</div></div></div>';}).join(''):'<div class="qumc-n-empty">No important notifications.</div>';
      list.querySelectorAll('.qumc-nrow').forEach(function(row){row.addEventListener('click',function(ev){ev.stopPropagation();var id=this.getAttribute('data-nid');var seen=readSeen();seen.push(id);writeSeen(seen);renderNotifications();},true);});
    }
    var clear=$('qumcClearNotifs'); if(clear){clear.onclick=function(ev){ev.preventDefault();ev.stopPropagation();var ids=collectNotifications().map(function(n){return n.id;});writeSeen(readSeen().concat(ids));renderNotifications();};}
  }
  function placePanel(p,b,w){if(!p||!b)return;var r=b.getBoundingClientRect();p.style.position='fixed';p.style.width=(w||320)+'px';p.style.top=(r.bottom+10)+'px';p.style.right=Math.max(12,window.innerWidth-r.right)+'px';}
  window.toggleUserAlerts=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}var d=$('userAlertDrop'), p=$('userProfileDrop'), b=$('userAlertBtn');if(!d)return false;renderNotifications();if(p){p.style.display='none';p.classList.remove('qumc-profile-open');}placePanel(d,b,320);var show=!d.classList.contains('qumc-stay-open');d.classList.toggle('qumc-stay-open',show);d.style.display=show?'block':'none';return false;};
  window.toggleUserProfile=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}var p=$('userProfileDrop'), d=$('userAlertDrop'), b=$('topUserBadge');if(!p)return false;if(d){d.style.display='none';d.classList.remove('qumc-stay-open');}placePanel(p,b,320);var show=!p.classList.contains('qumc-profile-open');p.classList.toggle('qumc-profile-open',show);p.style.display=show?'block':'none';return false;};
  function cleanProfile(){
    var sec=document.querySelectorAll('#userProfileDrop .qumc-profile-section-title'); if(sec[1])sec[1].style.display='none'; var act=$('profileActivityList'); if(act)act.style.display='none';
    var n=window._fbName||'User', em=window._fbUser||window._fbEmail||'', ro=window._fbRole||'—', dp=window._fbDept||window._lockedDept||'All Departments';
    [['topUserName',n],['profileName',n],['profileNameRow',n],['profileEmail',em||'—'],['profileRoleRow',ro],['profileDeptRow',dp],['topUserRole',ro]].forEach(function(a){var el=$(a[0]);if(el)el.textContent=a[1];});
    ['topUserAvatar','profileAvatar'].forEach(function(id){var e=$(id);if(e)e.textContent=(n||'U').charAt(0).toUpperCase();});
  }
  function logout(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    try{if(typeof window.addAudit==='function')window.addAudit('LOGOUT','User logout');}catch(e){}
    try{if(typeof window._doLogout==='function')window._doLogout();}catch(e){}
    try{window._fbUser='';window._fbEmail='';window._fbName='';window._fbRole='';window._fbDept=null;window._lockedDept=null;window._fbAssignedKpis=null;}catch(e){}
    var rm=$('_rememberMe'), pass=$('_fbPass'), email=$('_fbEmail');
    if(pass && (!rm || !rm.checked))pass.value='';
    if(email && (!rm || !rm.checked))email.value='';
    ['userProfileDrop','userAlertDrop'].forEach(function(id){var x=$(id);if(x){x.style.display='none';x.classList.remove('qumc-stay-open','qumc-profile-open');}});
    var bg=$('_bgLayer'), portal=$('_portalOverlay'), auth=$('_authOverlay'), forgot=$('_forgotOverlay');
    if(forgot)forgot.style.display='none'; if(auth)auth.style.display='none';
    if(bg){bg.style.display='block';bg.style.zIndex='9990';}
    if(portal){portal.style.display='flex';portal.style.zIndex='9996';}
    try{document.querySelectorAll('.page').forEach(function(p){p.classList.remove('on');}); var ex=$('page-exec'); if(ex)ex.classList.add('on');}catch(e){}
    return false;
  }
  function registryAllQuarterPatch(){
    if(window.__registryQuarterPatched||typeof window.renderRegistry!=='function')return;
    var old=window.renderRegistry;
    window.renderRegistry=function(){var q=Array.isArray(window.F&&F.qtr)?F.qtr.slice():null;try{if(window.F)F.qtr=['all'];return old.apply(this,arguments);}finally{if(q&&window.F)F.qtr=q;}};
    window.__registryQuarterPatched=true;
  }
  function kpiNameDeletePatch(){
    ['aNEPreset','aNAPreset'].forEach(function(id){
      var sel=$(id); if(!sel||sel.dataset.deletePatch)return; sel.dataset.deletePatch='1';
      var wrap=document.createElement('div');wrap.className='qumc-kpi-preset-wrap';sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(sel);
      var btn=document.createElement('button');btn.type='button';btn.className='qumc-kpi-preset-del';btn.title='Delete selected custom name';btn.textContent='×';wrap.appendChild(btn);
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var v=sel.value;if(!v||v==='__other__'){alert('Select a saved KPI name first.');return;}if(!confirm('Delete this KPI name from the list?'))return;try{var bank=JSON.parse(localStorage.getItem('kpi_name_bank')||'{"en":[],"ar":[]}');var key=id==='aNEPreset'?'en':'ar';bank[key]=(bank[key]||[]).filter(function(x){return x!==v;});localStorage.setItem('kpi_name_bank',JSON.stringify(bank));}catch(e){} if(typeof window.populateKpiNamePresets==='function')window.populateKpiNamePresets(); setTimeout(kpiNameDeletePatch,50);},true);
    });
  }
  function bind(){
    document.body.classList.toggle('gap-owner',role()==='kpi_owner');
    var ab=$('userAlertBtn'), ub=$('topUserBadge'), lo=$('profileLogoutBtn');
    if(ab&&!ab.dataset.safeBind){ab.dataset.safeBind='1';ab.onclick=null;ab.addEventListener('click',window.toggleUserAlerts,true);} 
    if(ub&&!ub.dataset.safeBind){ub.dataset.safeBind='1';ub.onclick=null;ub.addEventListener('click',window.toggleUserProfile,true);} 
    if(lo&&!lo.dataset.safeBind){lo.dataset.safeBind='1';lo.onclick=null;lo.addEventListener('click',logout,true);} 
    cleanProfile(); renderNotifications(); registryAllQuarterPatch(); kpiNameDeletePatch();
  }
  document.addEventListener('click',function(ev){var wrap=$('userNotifyWidget'); if(wrap&&wrap.contains(ev.target))return; var d=$('userAlertDrop'), p=$('userProfileDrop'); if(d){d.style.display='none';d.classList.remove('qumc-stay-open');} if(p){p.style.display='none';p.classList.remove('qumc-profile-open');}},false);
  var oldUpd=window.updateUserBadge; window.updateUserBadge=function(name,r){try{if(oldUpd)oldUpd.apply(this,arguments);}catch(e){} setTimeout(bind,0);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind); else bind();
  setInterval(bind,30000); /* [FIXED] was 2000ms — reduced to 30s */
})();

/* -- Notification bindings (order / logout patch) -- */
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id);};
  function safe(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function role(){return String(window._fbRole||'').toLowerCase();}
  function dept(){return String(window._fbDept||window._lockedDept||'').toLowerCase();}
  function userKey(){return String(window._fbUser||window._fbEmail||window._fbName||'guest').toLowerCase();}
  function readSeen(){try{return JSON.parse(localStorage.getItem('qumc_seen_notifs_'+userKey())||'[]')||[];}catch(e){return[];}}
  function writeSeen(a){try{localStorage.setItem('qumc_seen_notifs_'+userKey(),JSON.stringify(Array.from(new Set(a))));}catch(e){}}
  function state(){try{return window.ST||JSON.parse(localStorage.getItem('kpi_v3')||'{}')||{};}catch(e){return window.ST||{};}}
  function canSee(k){var r=role(),d=dept();if(!k)return false;if(r==='super_admin'||r==='admin'||r==='executive')return true;if(d&&String(k.dept||'').toLowerCase()!==d)return false;if(r==='kpi_owner'||r==='gap_owner'){var asg=window._fbAssignedKpis;if(Array.isArray(asg)&&asg.length&&asg.indexOf(k.id)<0)return false;}return true;}
  function qvals(k){return ['q1','q2','q3','q4'].map(function(q){return {q:q,v:k[q]};}).filter(function(x){return x.v!==null&&x.v!==undefined&&x.v!==''&&!isNaN(Number(x.v));});}
  function isMet(k,v){try{if(typeof window.metStatus==='function')return window.metStatus(k,v);}catch(e){}var t=Number(k.target||100),op=String(k.op||'>=');if(op==='<=')return Number(v)<=t;if(op==='=')return Math.abs(Number(v)-t)<=0.05;return Number(v)>=t;}
  function kname(k){return (k.id||k.code||'KPI')+' — '+(k.nameEn||k.name||k.nameAr||'KPI');}
  function collect(){var out=[],ks=[];try{ks=typeof window.allK==='function'?window.allK():(Array.isArray(window.KPIS)?window.KPIS:[]);}catch(e){ks=[];}ks.forEach(function(k){if(!canSee(k))return;var bad=qvals(k).filter(function(x){return !isMet(k,x.v);});if(bad.length)out.push({id:'miss_'+(k.id||'')+'_'+(k.yr||''),level:'red',title:kname(k),meta:'Missed target in '+bad.map(function(x){return x.q.toUpperCase();}).join(', ')});});try{var gaps=state().gaps||{};Object.keys(gaps).forEach(function(id){var g=gaps[id]||{},k=ks.find(function(x){return String(x.id)===String(id);});if(k&&!canSee(k))return;var stat=String(g.status||'').toLowerCase(),pri=String(g.priority||'').toLowerCase();if((stat&&stat!=='closed')||pri==='critical'||pri==='high')out.push({id:'gap_'+id+'_'+stat+'_'+pri,level:'red',title:'Gap Action '+id,meta:(g.status||'Pending')+(g.dueDate||g.due?' · Due: '+(g.dueDate||g.due):'')});});}catch(e){}try{var acts=state().actions||{};Object.keys(acts).forEach(function(id){var a=acts[id]||{},stat=String(a.status||'').toLowerCase();if(stat&&stat!=='closed')out.push({id:'act_'+id+'_'+stat,level:'red',title:'Action '+id,meta:'Action status: '+(a.status||'Pending')});});}catch(e){}var seen=readSeen(),map={};out.forEach(function(n){if(n&&n.id&&!map[n.id])map[n.id]=n;}); /* include read */return Object.keys(map).map(function(k){return map[k];}).slice(0,30);}
  function renderNotifications(){if(typeof window.renderNotifications==='function'&&window.renderNotifications!==renderNotifications)return window.renderNotifications(false);
  var arr=collect(),c=$('userAlertCount'),list=$('userAlertList');if(c){c.textContent=arr.length;c.style.display=arr.length?'flex':'none';}if(list){list.innerHTML=arr.length?arr.map(function(n){var col=n.level==='red'?'#C42B2B':(n.level==='orange'?'#D97706':'#0195af');return '<div class="qumc-nrow" data-nid="'+safe(n.id)+'"><span class="qumc-n-dot" style="background:'+col+'"></span><div><div class="qumc-n-title">'+safe(n.title)+'</div><div class="qumc-n-meta">'+safe(n.meta)+'</div></div></div>';}).join(''):'<div class="qumc-n-empty">No important notifications.</div>';list.querySelectorAll('.qumc-nrow').forEach(function(row){row.onclick=function(ev){ev.stopPropagation();var s=readSeen();s.push(row.getAttribute('data-nid'));writeSeen(s);renderNotifications();};});}var clear=$('qumcClearNotifs');if(clear){clear.onclick=function(ev){ev.preventDefault();ev.stopPropagation();writeSeen(readSeen().concat(collect().map(function(n){return n.id;})));renderNotifications();};}}
  function posPanel(panel,anchor,w){if(!panel||!anchor)return;var r=anchor.getBoundingClientRect();panel.style.position='fixed';panel.style.width=(w||320)+'px';panel.style.top=(r.bottom+10)+'px';panel.style.left=Math.max(12,Math.min(window.innerWidth-(w||320)-12,r.right-(w||320)))+'px';panel.style.right='auto';}
  window.toggleUserAlerts=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}var d=$('userAlertDrop'),p=$('userProfileDrop'),b=$('userAlertBtn');if(!d)return false;renderNotifications();if(p){p.style.display='none';p.classList.remove('qumc-profile-open');}posPanel(d,b,320);var show=!d.classList.contains('qumc-stay-open');d.classList.toggle('qumc-stay-open',show);d.style.display=show?'block':'none';return false;};
  window.toggleUserProfile=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}var p=$('userProfileDrop'),d=$('userAlertDrop'),b=$('topUserBadge');if(!p)return false;if(d){d.style.display='none';d.classList.remove('qumc-stay-open');}posPanel(p,b,320);var show=!p.classList.contains('qumc-profile-open');p.classList.toggle('qumc-profile-open',show);p.style.display=show?'block':'none';return false;};
  function logout(ev){if(ev){ev.preventDefault();ev.stopPropagation();}try{if(typeof window.addAudit==='function')window.addAudit('LOGOUT','User logout');}catch(e){}try{if(typeof window._doLogout==='function')window._doLogout();}catch(e){}try{window._fbUser='';window._fbEmail='';window._fbName='';window._fbRole='';window._fbDept=null;window._lockedDept=null;window._fbAssignedKpis=null;}catch(e){}var rm=$('_rememberMe'),pass=$('_fbPass');if(pass&&(!rm||!rm.checked))pass.value='';var forgot=$('_forgotOverlay'),portal=$('_portalOverlay'),auth=$('_authOverlay'),bg=$('_bgLayer');if(forgot)forgot.style.display='none';if(portal)portal.style.display='none';if(bg){bg.style.display='block';bg.style.zIndex='9990';}if(auth){auth.style.display='flex';auth.style.zIndex='9998';}['userProfileDrop','userAlertDrop'].forEach(function(id){var x=$(id);if(x){x.style.display='none';x.classList.remove('qumc-stay-open','qumc-profile-open');}});return false;}
  function refreshProfile(){var n=window._fbName||'User',em=window._fbUser||window._fbEmail||'—',ro=window._fbRole||'—',dp=window._fbDept||window._lockedDept||'All Departments';[['topUserName',n],['profileName',n],['profileNameRow',n],['profileEmail',em],['topUserRole',ro],['profileRoleRow',ro],['profileDeptRow',dp],['profileLastLoginRow','Current session']].forEach(function(a){var el=$(a[0]);if(el)el.textContent=a[1];});['topUserAvatar','profileAvatar'].forEach(function(id){var e=$(id);if(e)e.textContent=(n||'U').charAt(0).toUpperCase();});document.body.classList.toggle('gap-owner',role()==='kpi_owner'||role()==='gap_owner');}
  function bind(){var wrap=$('userNotifyWidget'),action=document.querySelector('.topbar .tb-space + div');if(wrap&&action&&wrap.parentElement!==action){action.insertBefore(wrap,action.firstChild);}var ab=$('userAlertBtn'),ub=$('topUserBadge'),lo=$('profileLogoutBtn');if(ab&&!ab.dataset.finalBind){ab.dataset.finalBind='1';ab.onclick=null;ab.addEventListener('click',window.toggleUserAlerts,true);}if(ub&&!ub.dataset.finalBind){ub.dataset.finalBind='1';ub.onclick=null;ub.addEventListener('click',window.toggleUserProfile,true);}if(lo&&!lo.dataset.finalBind){lo.dataset.finalBind='1';lo.onclick=null;lo.addEventListener('click',logout,true);}refreshProfile();renderNotifications();var back=$('backPortalBtn');if(back)back.textContent='← Back';}
  document.addEventListener('click',function(ev){var w=$('userNotifyWidget');if(w&&w.contains(ev.target))return;var d=$('userAlertDrop'),p=$('userProfileDrop');if(d){d.style.display='none';d.classList.remove('qumc-stay-open');}if(p){p.style.display='none';p.classList.remove('qumc-profile-open');}},false);
  var oldBadge=window.updateUserBadge;window.updateUserBadge=function(){try{if(oldBadge)oldBadge.apply(this,arguments);}catch(e){}setTimeout(bind,0);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();setInterval(bind,30000); /* [FIXED] was 1500ms */
})();

/* -- Final notification + profile render (canonical) -- */
(function(){
  'use strict';
  if(window.__QUMC_FINAL_REQUEST_FIX_V3__) return;
  window.__QUMC_FINAL_REQUEST_FIX_V3__=true;
  var $=function(id){return document.getElementById(id);};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});};
  function normalizeRole(v){return String(v||'').toLowerCase().replace(/[\s-]+/g,'_');}
  function role(){return normalizeRole(window._fbRole||window.currentUserRole||'');}
  function dept(){return String(window._fbDept||window._lockedDept||window.currentUserDept||'').toLowerCase().trim();}
  function email(){return String(window._fbUser||window._fbEmail||window.currentUserEmail||'').toLowerCase().trim();}
  function userName(){return String(window._fbName||window.currentUserName||email().split('@')[0]||'User');}
  function isAdmin(){var r=role();return r==='super_admin'||r==='superadmin'||r==='admin'||r==='executive';}
  function userKey(){return (email()||userName()||'guest')+'|'+role()+'|'+dept();}
  function seenKey(){return 'qumc_notifications_seen_v3_'+userKey();}
  function historyKey(){return 'qumc_notifications_history_v4_'+userKey();}
  function readSeen(){try{return JSON.parse(localStorage.getItem(seenKey())||'[]')||[];}catch(e){return[];}}
  function writeSeen(a){try{localStorage.setItem(seenKey(),JSON.stringify(Array.from(new Set(a||[]))));}catch(e){}}
  function readHistory(){try{var a=JSON.parse(localStorage.getItem(historyKey())||'[]')||[];return Array.isArray(a)?a.filter(function(n){return n&&n.id;}):[];}catch(e){return[];}}
  function writeHistory(a){try{localStorage.setItem(historyKey(),JSON.stringify((a||[]).filter(function(n){return n&&n.id;}).slice(0,100)));}catch(e){}}
  function mergeHistory(fresh){
    var byId={}, merged=[];
    readHistory().forEach(function(n){if(n&&n.id&&!byId[n.id]){byId[n.id]=n;merged.push(n);}});
    (fresh||[]).forEach(function(n){
      if(!n||!n.id)return;
      n.ts=n.ts||Date.now();
      if(byId[n.id]){Object.assign(byId[n.id],n);}
      else{byId[n.id]=n;merged.unshift(n);}
    });
    writeHistory(merged);
    return merged;
  }
  function getState(){try{return window.ST||JSON.parse(localStorage.getItem('kpi_v3')||'{}')||{};}catch(e){return window.ST||{};}}
  function getKpis(){try{if(typeof window.allK==='function')return window.allK()||[];}catch(e){} try{if(Array.isArray(window.KPIS))return window.KPIS;}catch(e){} try{var st=getState(); if(Array.isArray(st.kpis))return st.kpis;}catch(e){} return [];}
  function assignedList(){var a=window._fbAssignedKpis||window.assignedKpis||[];if(typeof a==='string')a=a.split(/[;,|]/);return Array.isArray(a)?a.map(function(x){return String(x).trim().toLowerCase();}).filter(Boolean):[];}
  function kId(k){return String(k&&((k.id||k.code||k.kpiCode||k.kpi_id)||'')).trim();}
  function kDept(k){return String(k&&((k.dept||k.department||k.departmentId)||'')).toLowerCase().trim();}
  function ownedByUser(obj){
    if(isAdmin())return true;
    var me=email(), nm=userName().toLowerCase();
    var vals=[obj&&obj.email,obj&&obj.userEmail,obj&&obj.ownerEmail,obj&&obj.assignedEmail,obj&&obj.responsibleEmail,obj&&obj.kpiOwnerEmail,obj&&obj.gapOwnerEmail,obj&&obj.owner,obj&&obj.kpiOwner,obj&&obj.gapOwner,obj&&obj.responsible,obj&&obj.responsiblePerson,obj&&obj.assignee,obj&&obj.user,obj&&obj.name].map(function(v){return String(v||'').toLowerCase();});
    return vals.some(function(v){return v && ((me&&v===me)||(me&&v.indexOf(me)>-1)||(nm&&v.indexOf(nm)>-1));});
  }
  function canSeeKpi(k){
    if(!k)return false;
    var r=role(), d=dept(), kd=kDept(k), id=kId(k).toLowerCase(), asg=assignedList();
    if(isAdmin())return true;
    if(r==='kpi_owner'||r==='gap_owner'){
      if(asg.length && id && asg.indexOf(id)>-1)return true;
      if(ownedByUser(k))return true;
      if(d && kd && kd===d)return true;
      return !d && !asg.length;
    }
    if(d && kd && kd!==d)return false;
    return true;
  }
  function numeric(v){var n=Number(v);return isFinite(n)?n:null;}
  function qValues(k){
    var qs=[];
    ['q1','q2','q3','q4'].forEach(function(q){var v=k[q]; if(v===undefined)v=k[q.toUpperCase()]; if(v!==undefined&&v!==null&&v!=='')qs.push({q:q,v:v});});
    if(k.quarters&&typeof k.quarters==='object')Object.keys(k.quarters).forEach(function(q){var v=k.quarters[q]; if(v!==undefined&&v!==null&&v!=='')qs.push({q:String(q).toLowerCase(),v:v});});
    return qs;
  }
  function isMet(k,val){
    try{if(typeof window.metStatus==='function')return !!window.metStatus(k,val);}catch(e){}
    try{if(typeof window.ok==='function' && val===undefined)return !!window.ok(k);}catch(e){}
    var v=numeric(val); if(v===null){try{if(typeof window.qv==='function')v=numeric(window.qv(k));}catch(e){}}
    if(v===null)return false;
    var t=numeric(k.target||k.tg||k.targetValue||100); if(t===null)t=100;
    var op=String(k.op||k.operator||k.comparison||'>=').toLowerCase();
    if(op.indexOf('<=')>-1||op.indexOf('at most')>-1||op.indexOf('less')>-1)return v<=t;
    if(op==='='||op.indexOf('equal')>-1)return Math.abs(v-t)<0.0001;
    return v>=t;
  }
  function kTitle(k){return (kId(k)||'KPI')+(k&&(k.nameEn||k.name||k.nameAr)?' — '+(k.nameEn||k.name||k.nameAr):'');}
  var notifCacheKey='', notifCache=null;
  function rawNotifications(){
    var out=[], ks=getKpis(), st=getState();
    ks.forEach(function(k){
      if(!canSeeKpi(k))return;
      var bad=qValues(k).filter(function(x){return !isMet(k,x.v);});
      /* Only create a KPI notification when an actual quarterly value missed the target. */
      if(!bad.length)return;
      var quarters=bad.map(function(x){return String(x.q).toUpperCase();}).join(', ');
      out.push({id:'miss_'+kId(k)+'_'+String(k.year||k.yr||'')+'_'+quarters,level:'red',title:kTitle(k),meta:'Missed target in '+quarters,ts:Date.now()});
    });
    var gaps=st.gaps||st.gapAnalysis||st.gap_analysis||{};
    if(Array.isArray(gaps)){var tmp={};gaps.forEach(function(g,i){tmp[g.kpiId||g.id||i]=g;});gaps=tmp;}
    Object.keys(gaps||{}).forEach(function(id){
      var g=gaps[id]||{}, k=ks.find(function(x){return String(kId(x)).toLowerCase()===String(id).toLowerCase();});
      if(k && !canSeeKpi(k))return;
      if(!k && !isAdmin() && !ownedByUser(g))return;
      var r=role();
      if((r==='gap_owner'||r==='kpi_owner') && !ownedByUser(g) && k && !canSeeKpi(k))return;
      var status=String(g.status||g.actionStatus||g.state||'').toLowerCase();
      var pri=String(g.priority||g.risk||'').toLowerCase();
      var open=!status||['open','in progress','in-progress','pending','overdue','active'].some(function(s){return status.indexOf(s)>-1;});
      if(open||pri==='critical'||pri==='high')out.push({id:'gap_'+id+'_'+status+'_'+pri,level:'red',title:(k?kTitle(k):(id||'Gap action')),meta:'Gap analysis action '+(status||'open'),ts:Date.now()});
    });
    var seen=readSeen();
    var unique={};
    out.forEach(function(n){if(n&&n.id&&!unique[n.id])unique[n.id]=n;});
    return Object.keys(unique).map(function(k){return unique[k];}); /* Show ALL notifications — mark-read only dims, never removes */
  }
  function getNotifications(forBadge){
    var key=userKey();
    if(key!==notifCacheKey){ notifCacheKey=key; notifCache=null; }
    var seen=readSeen();
    var fresh=rawNotifications();
    if(forBadge){
      /* Badge = live unread only. This never clears or replaces history. */
      return fresh.filter(function(n){return seen.indexOf(n.id)===-1;});
    }
    /* History = accumulated notifications. Never replace it with an empty rebuild. */
    if(!notifCache){
      notifCache=mergeHistory(fresh);
    } else {
      /* If a timer refresh runs while data is temporarily empty/loading,
         keep the in-memory history instead of replacing the open panel with empty. */
      notifCache=fresh.length?mergeHistory(fresh):(notifCache&&notifCache.length?notifCache:readHistory());
    }
    return notifCache||[];
  }
  function positionDrop(drop,btn,width){
    if(!drop||!btn)return;
    var r=btn.getBoundingClientRect(), w=width||320;
    drop.style.position='fixed';drop.style.width=w+'px';drop.style.right='auto';drop.style.top=(r.bottom+10)+'px';drop.style.left=Math.max(10,Math.min(window.innerWidth-w-10,r.right-w))+'px';drop.style.zIndex='2147483646';
  }
  function renderNotifications(force){
    /* Badge count = UNREAD only; list shows all with read/unread visual */
    var unreadArr=getNotifications(true), c=$('userAlertCount'), list=$('userAlertList');
    if(c){c.textContent=unreadArr.length;c.style.display=unreadArr.length?'flex':'none';}
    var arr=getNotifications(false);  /* all (for list display) */
    if(list){
      if(!arr.length && !(notifCache&&notifCache.length)){
        /* Do not wipe an already-open list during temporary empty refresh. */
        if(!list.querySelector('.qumc-nrow-final')){
          list.innerHTML='<div class="qumc-n-empty-final">No important notifications.</div>';
        }
      }
      else{
  /* Show ALL notifications (read + unread); dim read ones */
  var allNotifs=(function(){
        var seen2=readSeen();
        var all=getNotifications(false)||[];
        /* Sort: unread first, then read; newest (by array position = generation order) first within each group */
        var unread=all.filter(function(n){return seen2.indexOf(n.id)<0;});
        var read=all.filter(function(n){return seen2.indexOf(n.id)>=0;});
        return unread.concat(read);
      }()); /* sorted: unread first, read last */
  var seen=readSeen();
  list.innerHTML=allNotifs.map(function(n){
    var isRead=seen.indexOf(n.id)>=0;
    var col=isRead?'#555':(n.level==='red'?'#C42B2B':(n.level==='orange'?'#D97706':'#0195af'));
    var opacity=isRead?'0.6':'1';
    return '<div class="qumc-nrow-final" data-nid="'+esc(n.id)+'" style="opacity:'+opacity+'">'
      +'<span class="qumc-n-dot-final" style="background:'+col+'"></span>'
      +'<div><div class="qumc-n-title-final">'+esc(n.title)+(isRead?' <span style="font-size:9px;color:#555">(read)</span>':'')+'</div>'
      +'<div class="qumc-n-meta-final">'+esc(n.meta)+'</div></div>'
      +'</div>';
  }).join('');
      window._notifMap={};
      allNotifs.forEach(function(x){if(x&&x.id)window._notifMap[x.id]=x;});
}
      Array.prototype.forEach.call(list.querySelectorAll('.qumc-nrow-final'),function(row){
        var id=row.getAttribute('data-nid');
        var seen=readSeen();
        var isRead=seen.indexOf(id)>=0;
        /* Visual: dim the dot for already-read items */
        var dot=row.querySelector('.qumc-n-dot-final');
        if(dot && isRead) dot.style.background='#555';
        row.onclick=function(ev){
          ev.preventDefault();ev.stopPropagation();
          /* Mark as read */
          var s=readSeen(); if(s.indexOf(id)<0){s.push(id);writeSeen(s);}
          if(dot) dot.style.background='#555';
          /* BUG FIX: n was out-of-scope here (outside the else block).
             Use window._notifMap[id] which was populated inside the else block. */
          var _n=(window._notifMap&&window._notifMap[id])||null;
          window._showNotifModal(_n);
          setTimeout(function(){renderNotifications(false);},80);
        };
      });
    }
    var clear=$('qumcClearNotifs'); if(clear){clear.onclick=function(ev){
      ev.preventDefault();ev.stopPropagation();
      /* Mark all as read only. Do NOT clear notifCache/history; read notifications must remain visible. */
      writeSeen(readSeen().concat(getNotifications(false).map(function(n){return n.id;})));
      renderNotifications(false);
    };}
  }

    /* Centered modal for full notification message */
        function _showNotifModal(n){
      if(!n) return; /* guard against undefined notification */
      var prev=document.getElementById('_notifModal');
      if(prev){ prev.remove(); return; } /* toggle: second click closes */
      var isAr=(typeof lang!=='undefined'&&lang==='ar');
      function _e(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
      var level=n.level||'blue';
      var bc=level==='red'?'#F87171':level==='orange'?'#FBBF24':'#0195af';
      var modal=document.createElement('div');
      modal.id='_notifModal';
      /* No backdrop-filter — can block pointer events in some browsers */
      modal.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(0,8,20,.85);display:flex;align-items:center;justify-content:center;padding:20px;pointer-events:all;';
      var box=document.createElement('div');
      box.style.cssText='background:#0d1b2e;border:1px solid '+bc+';border-radius:16px;padding:28px;max-width:480px;width:100%;pointer-events:all;';
      var sub=(n.meta||n.sub||'');
      box.innerHTML=
        '<div style="font-size:13px;font-weight:800;color:'+bc+';margin-bottom:12px">'+_e(n.title||'Notification')+'</div>'
        +(sub?'<div style="font-size:10px;color:#64748b;margin-bottom:8px">'+_e(sub)+'</div>':'')
        +(n.body?'<div style="font-size:11px;color:#e2e8f0;line-height:1.6;margin-bottom:12px">'+_e(n.body)+'</div>':'')
        +'<button onclick="window._closeNotifModal()" style="width:100%;padding:9px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.3);border-radius:8px;color:#0195af;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">'
        +(isAr?'إغلاق':'Close')+'</button>';
      modal.appendChild(box);
      document.body.appendChild(modal);
      modal.onclick=function(e){
        if(e.target===modal){ modal.remove(); }
      };
    }    window._showNotifModal=_showNotifModal;
    window._closeNotifModal=function(){var m=document.getElementById('_notifModal');if(m)m.remove();};



  window.renderNotifications=renderNotifications;
  window.updateAlertUI=function(){renderNotifications(false);};
  window.buildUserAlerts=function(){return getNotifications(false);};
  window.collectNotifications=function(){return getNotifications(false);};
  window.toggleUserAlerts=function(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
    var d=$('userAlertDrop'), p=$('userProfileDrop'), b=$('userAlertBtn'); if(!d)return false;
    if(p){p.style.display='none';p.classList.remove('qumc-profile-open','qumc-final-open');}
    var open=d.style.display!=='block';
    if(open){positionDrop(d,b,320);d.style.display='block';d.classList.add('qumc-final-open','qumc-stay-open');renderNotifications(false);} else {d.style.display='none';d.classList.remove('qumc-final-open','qumc-stay-open');}
    return false;
  };
  function showLoginPage(){
    var pass=$('_fbPass'); if(pass)pass.value='';
    try{window._fbUser='';window._fbEmail='';window._fbName='';window._fbRole='';window._fbDept=null;window._lockedDept=null;window._fbAssignedKpis=null;}catch(e){}
    try{sessionStorage.clear();}catch(e){}
    try{Object.keys(localStorage).forEach(function(k){if(/firebase|auth|current|session|token|user/i.test(k))localStorage.removeItem(k);});}catch(e){}
    var bg=$('_bgLayer'), auth=$('_authOverlay'), portal=$('_portalOverlay'), forgot=$('_forgotOverlay');
    if(portal)portal.style.display='none'; if(forgot)forgot.style.display='none';
    if(bg){bg.style.display='block';bg.style.zIndex='9990';}
    if(auth){auth.style.display='flex';auth.style.zIndex='9998';}
    Array.prototype.forEach.call(document.querySelectorAll('.dashwrap,.topbar,.filter-strip,.tabnav,.footbar'),function(x){x.style.display='none';});
    ['userProfileDrop','userAlertDrop'].forEach(function(id){var x=$(id);if(x){x.style.display='none';x.classList.remove('qumc-final-open','qumc-stay-open','qumc-profile-open');}});
  }
  window.qumcLogoutToLogin=function(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
    try{if(typeof window.addAudit==='function')window.addAudit('LOGOUT','User logout');}catch(e){}
    var old=window.__qumcOriginalDoLogout||window._doLogout;
    try{if(old&&old!==window.qumcLogoutToLogin)old();}catch(e){}
    setTimeout(showLoginPage,80);
    return false;
  };
  if(!window.__qumcOriginalDoLogout && window._doLogout && window._doLogout!==window.qumcLogoutToLogin)window.__qumcOriginalDoLogout=window._doLogout;
  window._doLogout=window.qumcLogoutToLogin;
  function forceRedGapStyling(){
    document.body.classList.toggle('kpi-owner',role()==='kpi_owner');
    document.body.classList.toggle('kpi_owner',role()==='kpi_owner');
    var isKpo=role()==='kpi_owner'; if(!isKpo)return;
    Array.prototype.forEach.call(document.querySelectorAll('[style]'),function(el){
      var txt=(el.textContent||'').toLowerCase(), cls=(el.className||'').toString().toLowerCase();
      if(txt.indexOf('gap')>-1||txt.indexOf('miss')>-1||txt.indexOf('قاب')>-1||cls.indexOf('gap')>-1||cls.indexOf('miss')>-1){
        var s=el.getAttribute('style')||''; s=s.replace(/#B06000|#D97706|#F59E0B|orange/ig,'#C42B2B'); s=s.replace(/rgba\(176,96,0,[^)]+\)/ig,'rgba(196,43,43,.09)'); el.setAttribute('style',s);
      }
    });
  }
  function removeKpiCodeStar(){Array.prototype.forEach.call(document.querySelectorAll('label.af-lbl,label'),function(l){if(/KPI Code/.test(l.textContent||'')&&l.parentElement&&l.parentElement.querySelector('#eC'))l.textContent='KPI Code';});}
  function moveUserLast(){var wrap=$('userNotifyWidget'); if(!wrap)return; var parent=wrap.parentElement; if(parent&&parent.lastElementChild!==wrap)parent.appendChild(wrap);}
  function bindFinal(){
    moveUserLast(); removeKpiCodeStar(); forceRedGapStyling(); renderNotifications(false);
    var ab=$('userAlertBtn'), lo=$('profileLogoutBtn');
    if(ab&&ab.dataset.qumcFinalV3!=='1'){ab.dataset.qumcFinalV3='1';ab.onclick=null;ab.addEventListener('click',window.toggleUserAlerts,true);}
    if(lo&&lo.dataset.qumcFinalV3!=='1'){lo.dataset.qumcFinalV3='1';lo.onclick=window.qumcLogoutToLogin;lo.addEventListener('click',window.qumcLogoutToLogin,true);}
  }
  document.addEventListener('click',function(ev){var w=$('userNotifyWidget');if(w&&w.contains(ev.target))return;var d=$('userAlertDrop');if(d){d.style.display='none';d.classList.remove('qumc-final-open','qumc-stay-open');}},true);
  var oldUpdate=window.updateUserBadge; window.updateUserBadge=function(){try{if(oldUpdate)oldUpdate.apply(this,arguments);}catch(e){}setTimeout(bindFinal,0); /* do NOT clear notifCache here — history must survive badge refresh */};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindFinal);else bindFinal();
  setTimeout(function(){bindFinal();},1200); /* first init after FS load */
  setTimeout(function(){
  /* Merge refresh: getNotifications(false) accumulates fresh items into history.
     If rawNotifications() returns empty, notifCache is untouched (history preserved).
     Badge is always fresh (getNotifications(true) returns live count). */
  getNotifications(false);
  bindFinal();
},4000); /* merge refresh — history never cleared by empty rebuild */
})();


/* ── User Requests: Submit form + My Requests view (user-facing) ──
   Appended to notifications.js. Injects buttons into profile dropdown.
   ────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  var REQ_TYPES_EN=['Add KPI','Edit KPI','Delete KPI','Report Issue','Access Request','General Request','Other'];
  var REQ_TYPES_AR=['إضافة مؤشر','تعديل مؤشر','حذف مؤشر','بلاغ مشكلة','طلب وصول','طلب عام','أخرى'];

  /* ── Inject "Submit Request" + "My Requests" buttons into profile dropdown ── */
  function _injectReqButtons(){
    var drop=document.getElementById('userProfileDrop');
    if(!drop||document.getElementById('_profileReqBtns')) return;
    var isAr=(typeof lang!=='undefined'&&lang==='ar');
    var wrap=document.createElement('div');
    wrap.id='_profileReqBtns';
    wrap.style.cssText='display:flex;flex-direction:column;gap:6px;padding:10px 12px 4px;border-top:1px solid rgba(255,255,255,.07);margin-top:4px;';
    wrap.innerHTML=
      '<div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">'+(isAr?'الطلبات':'Requests')+'</div>'
      +'<button id="_profileSubmitReq" style="width:100%;padding:7px 12px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.28);border-radius:8px;color:#0195af;font-size:10px;font-weight:700;cursor:pointer;text-align:left;">'
      +'✚ '+(isAr?'إرسال طلب جديد':'Submit a Request')+'</button>'
      +'<button id="_profileMyReqs" style="width:100%;padding:7px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;font-size:10px;font-weight:700;cursor:pointer;text-align:left;">'
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
    var ov=document.createElement('div'); ov.id='submitReqOv';
    ov.style.cssText='position:fixed;inset:0;z-index:9200;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var typeOpts=isAr
      ?REQ_TYPES_AR.map(function(t,i){return '<option value="'+REQ_TYPES_EN[i]+'">'+t+'</option>';}).join('')
      :REQ_TYPES_EN.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
    ov.innerHTML='<div style="background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(480px,100%);display:flex;flex-direction:column;gap:16px">'
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
    var ov=document.createElement('div'); ov.id='myReqOv';
    ov.style.cssText='position:fixed;inset:0;z-index:9200;background:rgba(0,8,20,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');
    box.style.cssText='background:linear-gradient(135deg,#0d1b2e,#0a2040);border:1px solid rgba(1,149,175,.25);border-radius:18px;padding:28px;width:min(700px,100%);max-height:80vh;display:flex;flex-direction:column;gap:16px;';
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
