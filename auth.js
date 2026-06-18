/* ===========================================================
   QUMC Dashboard  --  auth.js
   Add-KPI stable save patch (last-writer-wins override).

   This IIFE overrides window.saveNewKPI and window.saveAdmin
   to ensure the Add-KPI form saves correctly to Firestore
   and only shows success after a confirmed cloud write.

   Loaded LAST so it can safely override earlier definitions.

   Depends on:
     kpi.js       (ST, sLS, allK, addAudit, F, lang)
     firebase.js  (window._saveToFS, window._fbUser)
     admin.js     (saveAdmin -- overrides it)
   =========================================================== */

(function(){
  'use strict';
  function byId(id){return document.getElementById(id)}
  function val(id){var e=byId(id);return e && e.value!=null ? String(e.value).trim() : ''}
  function num(id){var v=val(id); if(v==='') return null; var n=parseFloat(v); return isNaN(n)?null:n}
  function showAddMsg(msg, ok){
    var fb=byId('_addFeedback');
    if(!fb){ try{ alert(msg.replace(/<[^>]+>/g,'')); }catch(_){} return; }
    fb.innerHTML=msg;
    fb.style.display='block';
    fb.style.padding='8px 12px';
    fb.style.borderRadius='8px';
    fb.style.fontWeight='700';
    fb.style.fontSize='11px';
    fb.style.color=ok?'#06845A':'#C42B2B';
    fb.style.background=ok?'rgba(6,132,90,.08)':'rgba(196,43,43,.08)';
    fb.style.border=ok?'1px solid rgba(6,132,90,.20)':'1px solid rgba(196,43,43,.20)';
  }
  function saveStateLocal(){
    try{ if(typeof sLS==='function') sLS(ST); else localStorage.setItem('kpi_v3',JSON.stringify(Object.assign({},ST,{_v:3}))); }catch(e){ console.warn('[Add KPI Patch] local save failed',e); }
  }
  function refreshViews(reason){
    try{ if(typeof refreshAllViewsAfterKpiChange==='function') return refreshAllViewsAfterKpiChange(reason||'ADD_KPI_PATCH'); }catch(e){}
    ['render','renderExec','renderDept','renderRegistry','renderAcc','syncFilterUI'].forEach(function(fn){try{ if(typeof window[fn]==='function') window[fn](); }catch(_){}});
    try{ if(typeof render==='function') render(); }catch(_){}
  }
  window.saveNewKPI = async function(){
    var required=['aC','aDp','aO','aTier','aTg','aY','aNE','aNA'];
    var ok=true;
    required.forEach(function(id){var e=byId(id); if(!e) return; var empty=!String(e.value||'').trim(); e.style.borderColor=empty?'#C42B2B':''; e.style.boxShadow=empty?'0 0 0 3px rgba(196,43,43,.14)':''; if(empty) ok=false;});
    if(!ok){showAddMsg('Please fill all required fields.',false);return false;}
    var code=val('aC').toUpperCase();
    if(!code){showAddMsg('KPI Code cannot be empty.',false);return false;}
    var nameEn=val('aNE'), nameAr=val('aNA');
    if(/[\u0600-\u06FF]/.test(nameEn)){showAddMsg('KPI Name (English) must be English only.',false);return false;}
    if(nameAr && !/^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9 0-9\-()_/.،,!?]*$/.test(nameAr)){showAddMsg('Arabic KPI name must be Arabic/numbers only.',false);return false;}
    var exists=false;
    try{ exists=(typeof allK==='function'?allK():[]).some(function(k){return String(k.id||'').toUpperCase()===code;}); }catch(_){exists=false;}
    if(exists){showAddMsg('KPI Code already exists: '+code,false);return false;}
    if(typeof ST==='undefined'){showAddMsg('Dashboard state is not ready. Please reload the page.',false);return false;}
    if(!Array.isArray(ST.added)) ST.added=[];
    var k={
      id:code,
      dept:val('aDp')||'maintenance',
      yr:parseInt(val('aY'),10)||new Date().getFullYear(),
      nameEn:nameEn,
      nameAr:nameAr,
      target:(num('aTg')!=null?num('aTg'):100),
      op:(typeof normalizeOperator==='function'?normalizeOperator(val('aO')||'>='):(val('aO')||'>=')),
      type:'core',
      tier:parseInt(val('aTier'),10)||3,
      q1:num('aQ1'), q2:num('aQ2'), q3:num('aQ3'), q4:num('aQ4')
    };
    ST.added=ST.added.filter(function(x){return String(x.id||'').toUpperCase()!==code;});
    ST.added.push(k);
    if(!ST.pci) ST.pci={};
    ST.pci[code]={};
    ['Q1','Q2','Q3','Q4'].forEach(function(Q){
      var q=Q.toLowerCase(), pl=num('aAd'+Q+'_pl'), co=num('aAd'+Q+'_co'), ic=num('aAd'+Q+'_ic');
      if(pl!=null || co!=null || ic!=null) ST.pci[code][q]={planned:pl,complete:co,incomplete:ic};
    });
    saveStateLocal();
    /* USER ACTION: Add KPI Save button (patch) → Firestore write */
    try{ if(typeof window._saveToFS==='function' && window._fbUser) await window._saveToFS(ST); }catch(e){ console.warn('[Add KPI Patch] cloud save failed; kept local',e); }
    try{ if(typeof persistKpiNameToBank==='function') persistKpiNameToBank(nameEn,nameAr); }catch(_){}
    try{ if(typeof addAudit==='function') addAudit('KPI_ADD','Added new KPI: '+code,null,'KPI: '+nameEn); }catch(_){}
    try{
      if(typeof F!=='undefined'){
        F.year=String(k.yr);
        if(!window._lockedDept) F.dept=k.dept;
        F.qtr=['q1','q2','q3','q4'];
        if(!F.status) F.status='all';
      }
    }catch(_){}
    refreshViews('KPI_ADD:'+code);
    showAddMsg('KPI '+code+' saved successfully and added to dashboard.',true);
    return true;
  };
  var oldSaveAdmin=window.saveAdmin;
  window.saveAdmin=function(){
    try{ var ap=document.querySelector('.ap.on'); if(ap && ap.id==='ap-add'){ window.saveNewKPI(); return false; } }catch(e){ console.error('[Add KPI Patch] saveAdmin add branch failed',e); }
    if(typeof oldSaveAdmin==='function') return oldSaveAdmin.apply(this,arguments);
  };
  console.log('[Add KPI Patch] active');
})();
