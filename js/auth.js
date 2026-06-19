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
  /* window.saveNewKPI: removed — admin.js function saveNewKPI() is the correct implementation
     and is already globally accessible. The auth.js IIFE override was overwriting it. */
  var oldSaveAdmin=window.saveAdmin;
  /* Make saveAdmin async so it can properly await saveNewKPI() */
  window.saveAdmin=async function(){
    try{
      var ap=document.querySelector('.ap.on');
      if(ap && ap.id==='ap-add'){
        /* Call the admin.js function declaration (correct, complete version) */
        if(typeof saveNewKPI==='function') await saveNewKPI();
        return false;
      }
    }catch(e){ console.error('[Add KPI Patch] saveAdmin add branch failed',e); }
    if(typeof oldSaveAdmin==='function') return oldSaveAdmin.apply(this,arguments);
  };
  console.log('[Add KPI Patch] active');
})();
