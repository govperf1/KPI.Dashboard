import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,setPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    import { getFirestore,doc,getDoc,getDocFromServer,setDoc,addDoc,collection,serverTimestamp,onSnapshot,updateDoc,arrayUnion,query,where,orderBy,getDocs,deleteDoc,runTransaction,writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const firebaseConfig={apiKey:"AIzaSyAlLWZvsu4UbHn-LncFdrSHlbL3bIAG4no",authDomain:"qumc-kpi-dashboard-f10dd.firebaseapp.com",projectId:"qumc-kpi-dashboard-f10dd",storageBucket:"qumc-kpi-dashboard-f10dd.firebasestorage.app",messagingSenderId:"659971973475",appId:"1:659971973475:web:483116a0711008a6a97356"};
    const DPERMS={
      super_admin:['*'],
      admin:['access_performance','access_grc','manage_users','view_all_departments','view_department','edit_kpi','edit_gap_analysis','edit_actions','edit_targets','approve_changes','lock_quarter','unlock_quarter','view_executive_intelligence','export_reports','manage_dashboard_settings','view_audit_trail'],
      executive:['access_performance','access_grc','view_all_departments','view_department','view_executive_intelligence','export_reports'],
      department_manager:['access_performance','access_grc','view_department','view_executive_intelligence','export_reports'],
      governance_performance_manager:['access_performance','access_grc','view_department','view_all_departments','view_grc_department','view_grc_all_departments','view_shared_grc','view_executive_intelligence','export_reports','view_request_analytics'],
      kpi_owner:['access_performance','view_department','edit_kpi','edit_gap_analysis','export_reports'],
      risk_owner:['access_grc','view_department','view_grc_department','view_shared_grc','edit_risk_management','edit_incident_register','update_risk_status','submit_risk_changes','export_reports'],
      grc_owner:['access_grc','view_department','view_grc_department','view_shared_grc','edit_risk_management','edit_incident_register','update_risk_status','submit_risk_changes','export_reports'],
      platform_owner:['access_performance','access_grc','view_department','view_grc_department','view_shared_grc','edit_kpi','edit_gap_analysis','edit_actions','edit_risk_management','edit_incident_register','update_risk_status','submit_risk_changes','export_reports'],
      viewer:['access_performance','access_grc','view_department','view_grc_department','view_shared_grc','export_reports'],
      user:['access_performance','access_grc','view_department','export_reports']
    };

    const OWNER_ROLE_DEFINITIONS={
      risk_owner:{
        nameEn:'GRC Owner',nameAr:'مالك الحوكمة والمخاطر والالتزام',
        description:'Department-scoped GRC owner for the Risk and Incident Registers.',
        platforms:['grc'],systemRole:true,
        permissions:DPERMS.risk_owner.slice()
      },
      grc_owner:{
        nameEn:'GRC Owner',nameAr:'مالك الحوكمة والمخاطر والالتزام',
        description:'Compatibility alias for the department-scoped GRC Owner role.',
        platforms:['grc'],systemRole:true,
        permissions:DPERMS.grc_owner.slice()
      },
      governance_performance_manager:{
        nameEn:'Governance & Performance Department Manager',nameAr:'مدير قسم الحوكمة والأداء',
        description:'Platform-wide Governance & Performance manager with cross-department analytics across Performance and GRC.',
        platforms:['performance','grc'],systemRole:true,
        permissions:DPERMS.governance_performance_manager.slice()
      },
      platform_owner:{
        nameEn:'Performance & GRC Owner',nameAr:'مالك الأداء والحوكمة والمخاطر',
        description:'Department-scoped owner with access to both Performance and GRC.',
        platforms:['performance','grc'],systemRole:true,
        permissions:DPERMS.platform_owner.slice()
      }
    };

    const app=initializeApp(firebaseConfig);
    const auth=getAuth(app);
    const db=getFirestore(app);
    const QUMC_CLIENT_BUILD=String(window.__QUMC_BUILD__||'20260817-v194-grc-department-normalization');
    window.__QUMC_CLIENT_BUILD__=QUMC_CLIENT_BUILD;
    /* v166 device-consistency rule: security/profile and initial dashboard state
       must come from the Firestore server, never from a browser-specific cache. */
    async function _getServerDoc(ref){
      return getDocFromServer(ref);
    }

    function _normalizePortalRole(value){
      const r=String(value||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');
      const aliases={superadmin:'super_admin',departmentmanager:'department_manager',dept_manager:'department_manager',deptmanager:'department_manager',riskowner:'risk_owner',grcowner:'grc_owner',platformowner:'platform_owner',kpiowner:'kpi_owner',governanceperformancemanager:'governance_performance_manager',view:'viewer'};
      return aliases[r]||r;
    }
    window._normalizePortalRole=_normalizePortalRole;
    function _clientHasPerm(perm){const p=Array.isArray(window._fbPerms)?window._fbPerms:[];return p.includes('*')||p.includes(perm);}
    function _canAccessPortal(portal){
      portal=portal==='governance'?'grc':String(portal||'').toLowerCase();
      const r=_normalizePortalRole(window._fbRole||window.currentUserRole),p=Array.isArray(window._fbPerms)?window._fbPerms:[];
      if(p.includes('*'))return true;
      if(portal==='performance'){
        if(p.includes('access_performance'))return true;
        return ['super_admin','admin','executive','department_manager','governance_performance_manager','kpi_owner','platform_owner','viewer','user'].includes(r);
      }
      if(portal==='grc'){
        if(p.includes('access_grc'))return true;
        return ['super_admin','admin','executive','department_manager','governance_performance_manager','risk_owner','grc_owner','platform_owner','viewer','user'].includes(r);
      }
      return false;
    }
    window._canAccessPortal=_canAccessPortal;
    function _syncPortalCards(){
      const performance=ge('_portalPerformanceCard'),grc=ge('_portalGrcCard'),grid=ge('_portalCardGrid');
      const canPerformance=_canAccessPortal('performance'),canGrc=_canAccessPortal('grc');
      /* Always show both platform cards. Access is checked only after the user
         selects a platform, so a KPI Owner can see GRC and receive the centered
         access message, and a GRC Owner can see Performance the same way. */
      if(performance){performance.style.display='block';performance.setAttribute('aria-disabled',canPerformance?'false':'true');performance.dataset.accessAllowed=canPerformance?'1':'0';}
      if(grc){grc.style.display='block';grc.setAttribute('aria-disabled',canGrc?'false':'true');grc.dataset.accessAllowed=canGrc?'1':'0';}
      if(grid)grid.style.gridTemplateColumns='1fr 1fr';
      return {performance:canPerformance,grc:canGrc};
    }
    window._syncPortalCards=_syncPortalCards;
    async function _ensureOwnerRoleDefinitions(){
      if(_normalizePortalRole(window._fbRole)!=='super_admin'||!auth.currentUser)return false;
      for(const [roleId,definition] of Object.entries(OWNER_ROLE_DEFINITIONS)){
        const ref=doc(db,'config_roles',roleId),snap=await _getServerDoc(ref);
        if(!snap.exists()){
          await setDoc(ref,Object.assign({},definition,{createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:auth.currentUser.email||''}));
          continue;
        }
        const current=snap.data()||{},existing=Array.isArray(current.permissions)?current.permissions:[],required=Array.isArray(definition.permissions)?definition.permissions:[];
        /* Governance & Performance Manager is a platform-wide analytics role.
           Keep its system permissions exact so a stale config_roles document
           cannot accidentally retain old edit/approval privileges. Other owner
           roles preserve explicitly-added permissions for backward compatibility. */
        const desired=roleId==='governance_performance_manager'?required.slice():[...new Set(existing.concat(required))];
        const patch={nameEn:definition.nameEn,nameAr:definition.nameAr,description:definition.description,platforms:definition.platforms,systemRole:true,updatedAt:serverTimestamp()};
        if(JSON.stringify(existing)!==JSON.stringify(desired))patch.permissions=desired;
        await setDoc(ref,patch,{merge:true});
      }
      return true;
    }
    window._installOwnerRoles=_ensureOwnerRoleDefinitions;


    /* v172 one-time integrity repair for Review & Development analytics.
       Older builds wrote advisory_requests and advisory_public separately, so a
       network/rules failure could leave the primary request valid while the G&P
       dashboard mirror was missing or stale. Super Admin repairs the sanitized
       mirror once per audited build. Existing mirrors are replaced from the
       primary source of truth; a failed legacy row is isolated so it cannot stop
       repairs for every other request. */
    async function _repairAdvisoryPublicMirrorV172(){
      if(_normalizePortalRole(window._fbRole)!=='super_admin'||!auth.currentUser)return false;
      const markerRef=doc(db,'grc_meta','advisory_public_mirror_v172');
      try{const marker=await _getServerDoc(markerRef);if(marker.exists()&&String(marker.data().status||'')==='completed')return true;}catch(_){ }
      let primarySnap;
      try{primarySnap=await getDocs(collection(db,'advisory_requests'));}
      catch(e){console.warn('[Review Development] public mirror repair could not read requests',e&&e.message||e);return false;}
      const docs=primarySnap.docs||[];
      let repaired=0,failed=0;
      const applyOne=async function(d){
        try{await setDoc(doc(db,'advisory_public',d.id),_advPublicShape(d.data()||{}),{merge:false});repaired++;return true;}
        catch(e){failed++;console.warn('[Review Development] public mirror repair skipped',d.id,e&&e.code||e&&e.message||e);return false;}
      };
      /* Use moderate batches first for speed. If a legacy row violates the
         sanitized projection contract, retry that batch row-by-row so one bad
         document cannot roll back otherwise valid repairs. */
      for(let start=0;start<docs.length;start+=250){
        const chunk=docs.slice(start,start+250),batch=writeBatch(db);
        chunk.forEach(function(d){batch.set(doc(db,'advisory_public',d.id),_advPublicShape(d.data()||{}),{merge:false});});
        try{await batch.commit();repaired+=chunk.length;}
        catch(_batchError){for(const d of chunk)await applyOne(d);}
      }
      try{await setDoc(markerRef,{status:failed?'partial':'completed',sourceCount:docs.length,repairedCount:repaired,failedCount:failed,build:QUMC_CLIENT_BUILD,updatedAt:serverTimestamp()},{merge:true});}catch(_){ }
      return failed===0;
    }
    window._repairAdvisoryPublicMirrorV172=_repairAdvisoryPublicMirrorV172;


    /* ── Shared Audit Trail ─────────────────────────────────────────────
       Audit v10 uses an append-only Firestore collection (one document per
       action) instead of keeping every user's activity inside one capped
       array document. This prevents older users/actions from disappearing
       and avoids cross-user transaction contention. The old shared document
       remains read as a compatibility source and is migrated once by Admin. */
    const AUDIT_DOC_REF=doc(db,'kpi_dashboard','audit');
    const AUDIT_COLLECTION='audit_trail';
    let _auditListenerUnsub=null;
    let _auditLegacyListenerUnsub=null;
    let _auditWriteChain=Promise.resolve();
    let _auditMigrationRunning=false;

    function _auditId(){
      try{return crypto.randomUUID();}catch(_){return 'audit_'+Date.now()+'_'+Math.random().toString(36).slice(2,10);}
    }
    function _auditCleanValue(v){
      if(v===undefined||v===null)return null;
      if(typeof v==='object'){
        try{return JSON.parse(JSON.stringify(v));}catch(_){return String(v);}
      }
      return String(v);
    }
    function _auditEntry(raw){
      raw=raw||{};
      const email=String(raw.email||window._fbUser||window.currentUserEmail||(auth.currentUser&&auth.currentUser.email)||'').toLowerCase().trim();
      const user=String(raw.user||window._fbName||window.currentUserName||(email?email.split('@')[0]:'User'));
      const explicitDept=Object.prototype.hasOwnProperty.call(raw,'dept')?raw.dept:(Object.prototype.hasOwnProperty.call(window,'_fbDept')?window._fbDept:window.currentUserDept);
      return {
        id:String(raw.id||_auditId()),
        ts:String(raw.ts||new Date().toISOString()),
        user:user||'User',
        email:email||'—',
        role:String(raw.role||window._fbRole||window.currentUserRole||'viewer'),
        action:String(raw.action||'ACTIVITY'),
        detail:String(raw.detail||''),
        oldVal:_auditCleanValue(raw.oldVal),
        newVal:_auditCleanValue(raw.newVal),
        portal:String(raw.portal||window.__qumcActivePortal||''),
        page:String(raw.page||window.curPage||''),
        dept:explicitDept==null?'':String(explicitDept),
        sessionId:String(raw.sessionId||window.__qumcAuditSessionId||(window.__qumcAuditSessionId='s_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)))
      };
    }
    function _auditSort(log){
      return (Array.isArray(log)?log:[]).filter(Boolean).sort(function(a,b){return String(b.ts||'').localeCompare(String(a.ts||''));});
    }
    function _auditDedupe(log){
      const seen=new Set(),out=[];
      _auditSort(log).forEach(function(e){
        const key=String(e&&e.id||[e&&e.ts,e&&e.email,e&&e.action,e&&e.detail].join('|'));
        if(!key||seen.has(key))return;seen.add(key);out.push(e);
      });
      return out;
    }
    function _auditIsAdmin(){
      const r=_normalizePortalRole(window._fbRole||'');
      return r==='super_admin'||r==='admin';
    }
    function _auditIsSuper(){return _normalizePortalRole(window._fbRole||'')==='super_admin';}
    function _auditCanView(){
      return _auditIsAdmin()||(Array.isArray(window._fbPerms)&&window._fbPerms.includes('view_audit_trail'))||(Array.isArray(window._fbPerms)&&window._fbPerms.includes('*'));
    }
    function _auditMergedSources(){
      const collectionLog=Array.isArray(window.__qumcAuditCollectionLog)?window.__qumcAuditCollectionLog:[];
      const legacyLog=Array.isArray(window.__qumcAuditLegacyLog)?window.__qumcAuditLegacyLog:[];
      return _auditDedupe(collectionLog.concat(legacyLog));
    }
    function _applyAuditCloudLog(log){
      log=_auditDedupe(log);
      window.__qumcAuditCloudLog=log;
      try{
        if(typeof ST!=='undefined'){
          /* Keep a bounded local cache only. The Audit Trail itself reads the
             full append-only cloud collection, so this cache never limits the UI. */
          ST.audit=log.slice(0,2000);
          localStorage.setItem('kpi_v3',JSON.stringify(Object.assign({},ST,{_v:3})));
        }
      }catch(_){ }
      try{if(typeof window.loadAuditLog==='function')window.loadAuditLog();else if(typeof loadAuditLog==='function')loadAuditLog();}catch(_){ }
      try{if(typeof window._grcAdminRenderAudit==='function'&&document.getElementById('_grcAuditList'))window._grcAdminRenderAudit();}catch(_){ }
    }
    function _refreshAuditMergedView(){
      _applyAuditCloudLog(_auditMergedSources());
    }
    async function _deleteAuditDocs(predicate){
      if(!_auditIsSuper())throw new Error('access denied');
      const snap=await getDocs(collection(db,AUDIT_COLLECTION)),jobs=[];
      snap.forEach(function(d){
        const row=Object.assign({id:d.id},d.data()||{});
        if(!predicate||predicate(row))jobs.push(deleteDoc(doc(db,AUDIT_COLLECTION,d.id)));
      });
      for(let i=0;i<jobs.length;i+=100)await Promise.all(jobs.slice(i,i+100));
      return jobs.length;
    }
    async function _migrateLegacyAuditToCollection(){
      if(_auditMigrationRunning||!auth.currentUser||!_auditIsSuper())return false;
      _auditMigrationRunning=true;
      try{
        const snap=await getDoc(AUDIT_DOC_REF),data=snap.exists()?snap.data():{};
        if(data.collectionMigratedAt)return false;
        const log=Array.isArray(data.log)?data.log:[];
        for(let i=0;i<log.length;i+=100){
          const chunk=log.slice(i,i+100);
          await Promise.all(chunk.map(function(raw){
            const entry=_auditEntry(raw);
            return setDoc(doc(db,AUDIT_COLLECTION,entry.id),entry,{merge:false});
          }));
        }
        await setDoc(AUDIT_DOC_REF,{
          collectionMigratedAt:serverTimestamp(),
          collectionMigratedBy:String(window._fbUser||''),
          updatedAt:serverTimestamp(),
          updatedBy:String(window._fbUser||'')
        },{merge:true});
        return true;
      }catch(e){
        console.warn('[AUDIT] legacy migration skipped:',e&&e.code||e&&e.message||e);
        return false;
      }finally{_auditMigrationRunning=false;}
    }
    window._appendAuditToFS=function(raw){
      const entry=_auditEntry(raw);
      if(!auth.currentUser){
        window.__qumcAuditPending=window.__qumcAuditPending||[];
        window.__qumcAuditPending.push(entry);
        return Promise.resolve(false);
      }
      _auditWriteChain=_auditWriteChain.catch(function(){return null;}).then(function(){
        /* Deterministic document IDs make retries idempotent. */
        return setDoc(doc(db,AUDIT_COLLECTION,entry.id),entry,{merge:false});
      });
      return _auditWriteChain;
    };
    window._recordAuditDirect=function(action,detail,oldVal,newVal,extra){
      return window._appendAuditToFS(Object.assign({},extra||{},{action:action,detail:detail,oldVal:oldVal,newVal:newVal}));
    };
    window._clearAuditFromFS=async function(){
      if(!_auditIsSuper())throw new Error('access denied');
      await _deleteAuditDocs();
      await setDoc(AUDIT_DOC_REF,{log:[],clearedAt:serverTimestamp(),clearedBy:window._fbUser||'',updatedAt:serverTimestamp(),updatedBy:window._fbUser||'',collectionMigratedAt:serverTimestamp(),collectionMigratedBy:window._fbUser||''},{merge:true});
      window.__qumcAuditCollectionLog=[];window.__qumcAuditLegacyLog=[];_refreshAuditMergedView();
      return true;
    };
    window._clearGrcAuditFromFS=async function(){
      if(!_auditIsSuper())throw new Error('access denied');
      const isGrc=function(entry){
        const portal=String(entry&&entry.portal||'').toLowerCase(),action=String(entry&&entry.action||'').toUpperCase();
        return portal==='grc'||action.indexOf('GRC_')===0||(action.indexOf('REVIEW_DEVELOPMENT_')===0&&portal==='grc');
      };
      await _deleteAuditDocs(isGrc);
      let remaining=[];
      await runTransaction(db,async function(tx){
        const snap=await tx.get(AUDIT_DOC_REF),data=snap.exists()?snap.data():{},log=Array.isArray(data.log)?data.log.slice():[];
        remaining=log.filter(function(entry){return !isGrc(entry);});
        tx.set(AUDIT_DOC_REF,{log:remaining,clearedAt:serverTimestamp(),clearedBy:window._fbUser||'',updatedAt:serverTimestamp(),updatedBy:window._fbUser||'',collectionMigratedAt:data.collectionMigratedAt||serverTimestamp(),collectionMigratedBy:data.collectionMigratedBy||window._fbUser||''},{merge:true});
      });
      window.__qumcAuditLegacyLog=remaining;
      window.__qumcAuditCollectionLog=(window.__qumcAuditCollectionLog||[]).filter(function(entry){return !isGrc(entry);});
      _refreshAuditMergedView();
      return true;
    };
    window._startAuditListener=function(){
      if((_auditListenerUnsub||_auditLegacyListenerUnsub)||!auth.currentUser||!_auditCanView())return;
      try{
        _auditListenerUnsub=onSnapshot(query(collection(db,AUDIT_COLLECTION),orderBy('ts','desc')),function(snap){
          window.__qumcAuditCollectionLog=snap.docs.map(function(d){return Object.assign({id:d.id},d.data()||{});});
          _refreshAuditMergedView();
        },function(err){console.warn('[AUDIT] collection listener failed:',err&&err.code||err&&err.message||err);});
      }catch(e){console.warn('[AUDIT] collection listener could not start:',e&&e.message||e);}
      _auditLegacyListenerUnsub=onSnapshot(AUDIT_DOC_REF,function(snap){
        const data=snap.exists()?snap.data():{};
        window.__qumcAuditLegacyLog=Array.isArray(data.log)?data.log.slice():[];
        _refreshAuditMergedView();
      },function(err){console.warn('[AUDIT] legacy listener failed:',err&&err.code||err&&err.message||err);});
      setTimeout(function(){_migrateLegacyAuditToCollection();},250);
      console.log('[AUDIT] Append-only shared Audit Trail listeners active');
    };
    window._stopAuditListener=function(){
      if(_auditListenerUnsub){_auditListenerUnsub();_auditListenerUnsub=null;}
      if(_auditLegacyListenerUnsub){_auditLegacyListenerUnsub();_auditLegacyListenerUnsub=null;}
    };
    async function _flushPendingAudit(){
      const q=(window.__qumcAuditPending||[]).splice(0);
      for(const e of q){try{await window._appendAuditToFS(e);}catch(err){console.warn('[AUDIT] pending write failed',err);}}
    }

    /* Session-only persistence — clears on browser close, prevents cached auto-login */
    setPersistence(auth,browserSessionPersistence).then(()=>console.log('[Auth] Session persistence set')).catch(e=>console.warn('[Auth] Persistence:',e.message));

    const ge=id=>{const e=document.getElementById(id);if(!e)console.warn('[Auth] Missing element:',id);return e;};
    const cleanAccountName=v=>{v=String(v||'').trim();if(!v)return'';if(['user','username','account','admin','null','undefined','-','—'].includes(v.toLowerCase()))return'';return v;};
    const accountNameFrom=(data,user,email)=>cleanAccountName(data&&data.userName)||cleanAccountName(data&&data.username)||cleanAccountName(data&&data.name)||cleanAccountName(data&&data.fullName)||cleanAccountName(data&&data.displayName)||cleanAccountName(user&&user.displayName)||cleanAccountName(email&&email.split('@')[0])||'';
    const setUserDisplay=(name,role)=>{try{const n=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';window._fbName=n;window.currentUserName=n;const ids=['_portalUserName','_userName','topUserName','profileName','profileNameRow'];ids.forEach(id=>{const e=ge(id);if(e)e.textContent=n;});const avIds=['_userAvatar','topUserAvatar','profileAvatar'];avIds.forEach(id=>{const av=ge(id);if(av)av.textContent=(n||'U')[0].toUpperCase();});if(role){const rl=ge('_userRole');if(rl)rl.textContent=role;}const auditClear=ge('_auditClearBtn');if(auditClear)auditClear.style.display=_normalizePortalRole(window._fbRole||role)==='super_admin'?'':'none';if(typeof window.updateUserBadge==='function')window.updateUserBadge(n,window._fbRole||role,window._fbPerms||[]);}catch(e){console.warn('[Auth] user display update skipped',e);}};
    const showEntryLoading=(msg)=>{try{let ov=ge('_perfEntryLoading');if(!ov){ov=document.createElement('div');ov.id='_perfEntryLoading';ov.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(239,243,248,.92);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:inherit;color:#152538';ov.innerHTML='<div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.16);padding:20px 24px;text-align:center;min-width:220px"><div style="width:34px;height:34px;border-radius:50%;border:3px solid rgba(1,149,175,.18);border-top-color:#0195af;margin:0 auto 12px;animation:qumcSpin .85s linear infinite"></div><div id="_perfEntryLoadingText" style="font-size:12px;font-weight:900"></div></div>';document.body.appendChild(ov);let st=document.getElementById('qumc-entry-loading-style');if(!st){st=document.createElement('style');st.id='qumc-entry-loading-style';st.textContent='@keyframes qumcSpin{to{transform:rotate(360deg)}}';document.head.appendChild(st);}}const t=ge('_perfEntryLoadingText');if(t)t.textContent=msg||'Loading dashboard…';ov.style.display='flex';}catch(e){}};
    const hideEntryLoading=()=>{try{const ov=document.getElementById('_perfEntryLoading');if(ov)ov.remove();}catch(e){}};
    window._closePortalAccessDenied=function(){try{const ov=document.getElementById('_portalAccessDenied');if(ov)ov.remove();document.body.classList.remove('portal-access-denied-open');}catch(e){}};
    window._showPortalAccessDenied=function(portal){
      portal=portal==='governance'?'grc':portal;
      window._closePortalAccessDenied();
      const ar=(window.lang==='ar'||document.documentElement.lang==='ar'||document.documentElement.dir==='rtl');
      const platform=portal==='grc'?(ar?'منصة الحوكمة والمخاطر والامتثال':'GRC platform'):(ar?'منصة الأداء':'Performance platform');
      const title=ar?'تعذر الوصول':'Access Restricted';
      const message=ar?('صلاحيتك الحالية لا تسمح لك بالدخول إلى '+platform+'.'):('Your current role does not have access to the '+platform+'.');
      const hint=ar?'يمكنك الرجوع واختيار المنصة المتاحة لصلاحيتك.':'Return and choose the platform available for your role.';
      const back=ar?'العودة إلى المنصات':'Back to Platforms';
      const ov=document.createElement('div');
      ov.id='_portalAccessDenied';
      ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','_portalAccessDeniedTitle');
      ov.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(4,16,35,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:inherit;';
      ov.innerHTML='<div style="width:min(460px,calc(100vw - 34px));background:#fff;border:1px solid rgba(1,149,175,.28);border-radius:22px;padding:34px 30px 28px;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.38);color:#17384a;position:relative;">'
        +'<div style="width:62px;height:62px;border-radius:18px;margin:0 auto 17px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#e7f8fb,#f4fbfc);border:1px solid rgba(1,149,175,.24);color:#0195af;font-size:30px;font-weight:900;">!</div>'
        +'<div id="_portalAccessDeniedTitle" style="font-size:21px;line-height:1.25;font-weight:950;color:#12354a;margin-bottom:10px;">'+title+'</div>'
        +'<div style="font-size:13px;line-height:1.8;font-weight:800;color:#526b7a;margin:0 auto 7px;max-width:360px;">'+message+'</div>'
        +'<div style="font-size:11px;line-height:1.7;font-weight:700;color:#8295a1;margin:0 auto 22px;max-width:360px;">'+hint+'</div>'
        +'<button type="button" id="_portalAccessDeniedBack" style="height:40px;min-width:170px;border:0;border-radius:12px;padding:0 18px;background:#123d59;color:#fff;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px rgba(18,61,89,.22);">'+back+'</button>'
        +'</div>';
      document.body.classList.add('portal-access-denied-open');
      document.body.appendChild(ov);
      const close=()=>{window._closePortalAccessDenied();showPortal(window._fbName,window._fbRole);};
      const btn=document.getElementById('_portalAccessDeniedBack');if(btn){btn.addEventListener('click',close);setTimeout(()=>btn.focus(),30);}
      ov.addEventListener('click',e=>{if(e.target===ov)close();});
      ov.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    };
    function _clearClientAuthState(){
      window.__qumcActivePortal='';
      window._fbUser='';window._fbEmail='';window.currentUserEmail='';
      window._fbRole='viewer';window.currentUserRole='viewer';
      window._fbDept=null;window.currentUserDept=null;
      window._fbPerms=[];window._fbName='';window.currentUserName='';
      window._fbAssignedKpis=null;window._fbProfileResolved=false;
    }
    const showLogin=()=>{
      console.log('[Auth] showLogin');
      try{
        window.__qumcActivePortal='';
        window._closePortalAccessDenied&&window._closePortalAccessDenied();
        window._hideGRC&&window._hideGRC();
        hideEntryLoading();
      }catch(_){ }
      try{
        if(document.body){
          document.body.classList.remove('grc-mode','dashboard-mode','portal-mode','performance-advisory-mode','dashboard-ready','modal-mode');
          document.body.classList.add('auth-mode');
        }
        window.scrollTo(0,0);
      }catch(_){ }
      const bg=ge('_bgLayer');
      if(bg){bg.style.display='block';bg.style.zIndex='2147483490';}
      const ao=ge('_authOverlay');
      if(ao){
        ao.style.setProperty('position','fixed','important');
        ao.style.setProperty('inset','0','important');
        ao.style.setProperty('z-index','2147483500','important');
        ao.style.setProperty('display','flex','important');
        ao.style.setProperty('align-items','center','important');
        ao.style.setProperty('justify-content','center','important');
        ao.style.setProperty('overflow-y','auto','important');
        ao.style.setProperty('background','transparent','important');
        ao.style.setProperty('padding','24px 12px','important');
      }
      const fo=ge('_forgotOverlay');if(fo)fo.style.display='none';
      const po=ge('_portalOverlay');if(po)po.style.display='none';
      const ld=ge('_authLoading');if(ld)ld.style.display='none';
      const lp=ge('_loginPanel');if(lp){lp.style.display='block';lp.style.margin='auto';}
      const pw=ge('_fbPass');if(pw)pw.value='';
      const err=ge('_fbErr');if(err)err.textContent='';
      const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}
    };
    /* v192: Cold-login portal transition must undo the !important login layer.
       showLogin() intentionally hard-locks the auth overlay above every app panel.
       A normal `style.display = none` cannot override that inline !important, and
       showLogin() also raises _bgLayer above the portal. On a browser refresh the
       authenticated session skips showLogin(), which is why the two portal cards
       appeared only after F5. Reset those layers explicitly before showing Portal. */
    const showPortal=(name,role)=>{
      console.log('[Auth] showPortal:',name,role);
      const po=ge('_portalOverlay'),lo=ge('_authOverlay'),bg=ge('_bgLayer'),fo=ge('_forgotOverlay');
      if(document.body){
        document.body.classList.remove('auth-mode','dashboard-mode','grc-mode','performance-advisory-mode','modal-mode','grc-coming-open','portal-access-denied-open');
        document.body.classList.add('portal-mode');
      }
      if(lo){
        lo.style.setProperty('display','none','important');
      }
      if(fo)fo.style.display='none';
      /* Keep the institutional background visible, but always behind Portal. */
      if(bg){bg.style.display='block';bg.style.zIndex='9990';}
      if(po){
        po.style.display='flex';
        po.style.visibility='visible';
        po.style.opacity='1';
        po.style.pointerEvents='auto';
        console.log('[Auth] _portalOverlay is now flex');
      }else{console.error('[Auth] PORTAL OVERLAY NOT FOUND');return;}
      const nm=ge('_portalUserName'),rl=ge('_portalUserRole');
      const realName=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';
      if(nm)nm.textContent=realName;
      if(rl){const L={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',risk_owner:'GRC Owner',grc_owner:'GRC Owner',platform_owner:'Performance & GRC Owner',governance_performance_manager:'Governance & Performance Department Manager',viewer:'Viewer',user:'User'};rl.textContent=L[_normalizePortalRole(role)]||role;}
      const forcePortalCards=()=>{
        const grid=ge('_portalCardGrid'),performance=ge('_portalPerformanceCard'),grc=ge('_portalGrcCard'),panel=ge('_portalPanel');
        if(panel){panel.style.display='flex';panel.style.visibility='visible';panel.style.opacity='1';panel.style.filter='none';panel.style.pointerEvents='auto';}
        if(grid){grid.style.display='grid';grid.style.visibility='visible';grid.style.opacity='1';grid.style.gridTemplateColumns='1fr 1fr';}
        if(performance){performance.style.display='block';performance.style.visibility='visible';performance.style.opacity='1';}
        if(grc){grc.style.display='block';grc.style.visibility='visible';grc.style.opacity='1';}
        _syncPortalCards();
      };
      forcePortalCards();
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(forcePortalCards);
      setTimeout(forcePortalCards,80);
      setTimeout(forcePortalCards,300);
      console.log('[Auth] Portal ready');
    };
    const setErr=msg=>{console.warn('[Auth] Error:',msg);const e=ge('_fbErr');if(e)e.textContent=msg;const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}};

    window._doLogin=async()=>{
      const em=(ge('_fbEmail')||{value:''}).value.trim();
      const pw=(ge('_fbPass')||{value:''}).value;
      const errEl=ge('_fbErr');if(errEl)errEl.textContent='';
      if(!em||!pw){setErr('Please enter email and password.');return;}
      console.log('[Auth] Login attempt:',em);
      try{
        const b=ge('_fbLoginBtn');if(b){b.disabled=true;b.textContent='Verifying...';}
        const c=await signInWithEmailAndPassword(auth,em,pw);
        console.log('[Auth] Firebase accepted:',c.user.email);
      }catch(e){
        console.error('[Auth] Login rejected:',e.code,e.message);
        setErr(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'||e.code==='auth/user-not-found'?'Incorrect email or password.':e.code==='auth/invalid-email'?'Invalid email format.':e.code==='auth/too-many-requests'?'Too many attempts. Wait a moment.':'Login failed: '+e.message);
      }
    };

    window._doLogout=async()=>{
      console.log('[Auth] Logout');
      showLogin();
      try{
        const auditPromise=window._recordAuditDirect?window._recordAuditDirect('LOGOUT','User signed out'):Promise.resolve();
        await Promise.race([Promise.resolve(auditPromise).catch(function(e){console.warn('[AUDIT] logout write skipped',e);}),new Promise(function(resolve){setTimeout(resolve,450);})]);
      }catch(e){console.warn('[AUDIT] logout write skipped',e);}
      try{
        window._stopAuditListener&&window._stopAuditListener();
        window._stopReadListener&&window._stopReadListener();
        window._grcStopSecureSync&&window._grcStopSecureSync();
        window._grcRiskRequestsStop&&window._grcRiskRequestsStop();
        try{sessionStorage.removeItem('qumc_user_email');sessionStorage.removeItem('qumc_last_login');localStorage.removeItem('qumc_user_email');localStorage.removeItem('qumc_last_login');}catch(_storage){}
        await signOut(auth);
      }catch(e){console.error('[Auth]',e);}
      finally{_clearClientAuthState();showLogin();}
    };

    window._backToPortal=()=>{console.log('[Auth] Back to portal');try{window._stopReadListener&&window._stopReadListener();if(typeof window._hideGRC==='function')window._hideGRC();}catch(_e){}window.__qumcActivePortal='';const lo=document.getElementById('_authOverlay'),po=document.getElementById('_portalOverlay'),bg=document.getElementById('_bgLayer');if(lo)lo.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};

    /* v191 cold-entry barrier. The portal is normally shown only after the
       Firestore profile resolves, but the old GRC card bypassed this coordinator
       and could render while role/department globals were still transitioning.
       A refresh masked the race because Auth + profile were already warm. */
    async function _waitForResolvedPortalProfile(maxMs){
      const deadline=Date.now()+(Number(maxMs)||5000);
      while(Date.now()<deadline){
        if(window._fbProfileResolved===true && window._fbUser && window._fbRole)return true;
        await new Promise(resolve=>setTimeout(resolve,40));
      }
      return window._fbProfileResolved===true && !!window._fbUser;
    }

window._selectPortal=async portal=>{
      portal=portal==='governance'?'grc':portal;
      console.log('[Auth] Selected:',portal);
      if(!(await _waitForResolvedPortalProfile(5000))){
        console.warn('[Auth] Portal entry paused — authenticated profile is not ready.');
        showPortal(window._fbName,window._fbRole);
        return;
      }
      if(!_canAccessPortal(portal)){
        if(typeof window._showPortalAccessDenied==='function')window._showPortalAccessDenied(portal);
        else alert(portal==='grc'?'Your role does not have access to the GRC platform.':'Your role does not have access to the Performance platform.');
        return;
      }
      window.__qumcActivePortal=portal;
      try{window._recordAuditDirect&&window._recordAuditDirect('PORTAL_OPEN','Opened portal: '+portal,null,portal,{portal:portal});}catch(_){ }
      if(portal==='performance'){
        try{if(typeof window._hideGRC==='function')window._hideGRC();}catch(_grcStop){}
        hideEntryLoading();
        ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='none';});
        console.log('[Auth] Entering Performance portal...');
        setUserDisplay(window._fbName,window._fbRole);
        if(typeof window.applyRolePermissions==='function')window.applyRolePermissions(window._fbRole,window._fbDept,window._fbPerms);
        if(typeof window.updateUserBadge==='function')window.updateUserBadge(window._fbName,window._fbRole,window._fbPerms);
        /* v166: do not render charts from device-local state first. Resolve the
           authenticated Firestore state, then render the portal. This removes
           device-speed/cache races where the same user saw different charts. */
        showEntryLoading('Syncing latest dashboard data…');
        if(typeof window._onFSLoaded==='function'){
          try{await window._onFSLoaded({skipRender:window._fbRole==='super_admin'});}
          catch(e){console.warn('[FS] initial server hydration skipped:',e);}
        }
        /* Role-specific rendering:
           - super_admin → show SA hub landing page immediately, do NOT render dashboard first
           - all others  → render dashboard, then role-specific popup                        */
        if(window._fbRole==='super_admin'){
          /* SA: show hub IMMEDIATELY — do NOT render dashboard first */
          setTimeout(()=>{
            try{
              if(typeof window._showSuperAdminHub==='function') window._showSuperAdminHub();
              hideEntryLoading();
            }catch(e){console.warn('[SA] hub error:',e);}
          },60); /* minimal delay so DOM is ready */
        }else{
          /* Normal Admin / KPI Owner / Viewer: render dashboard */
          if(typeof window.renderCurrent==='function'){
            try{ window.renderCurrent(); }
            catch(e){ console.error('[Auth] Initial render error:',e); }
            setTimeout(()=>{try{window.renderCurrent();}catch(_){} hideEntryLoading();},250);
          }else{ hideEntryLoading(); }
          /* KPI Owner: gap status popup */
          if(['kpi_owner','platform_owner'].includes(_normalizePortalRole(window._fbRole)) && typeof window.showKpoGapStatusPopup==='function'){
            setTimeout(()=>{try{window.showKpoGapStatusPopup();}catch(e){console.warn('[KPO]',e);}},700);
          }
        }
        /* Start read-only Firestore listener for cross-user updates */
        if(typeof window._startReadListener==='function') setTimeout(window._startReadListener, 800);
        console.log('[Auth] ✓ Performance portal entered');
      }else{
        try{window._stopReadListener&&window._stopReadListener();}catch(_perfStop){}
        showEntryLoading('Preparing GRC workspace…');
        ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='none';});
        setUserDisplay(window._fbName,window._fbRole);
        if(typeof window.applyRolePermissions==='function')window.applyRolePermissions(window._fbRole,window._fbDept,window._fbPerms);
        if(typeof window.updateUserBadge==='function')window.updateUserBadge(window._fbName,window._fbRole,window._fbPerms);
        /* Yield one paint after closing the portal overlay so the dynamically
           created GRC root is attached to the final body layout, not the old
           portal frame. */
        await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
        if(typeof window._enterGRC==='function'){
          if(typeof window._grcRiskApprovalEntryNoticeReset==='function')window._grcRiskApprovalEntryNoticeReset();
          window._enterGRC();
          /* Verify the first shell instead of requiring a manual refresh. These
             checks are no-ops when Header/Tabs/Page already rendered correctly. */
          if(typeof window._grcEnsureFirstRender==='function'){
            try{window._grcEnsureFirstRender();}catch(firstRenderErr){console.warn('[GRC] first render verification skipped',firstRenderErr);}
            setTimeout(()=>{try{if(window.__qumcActivePortal==='grc')window._grcEnsureFirstRender();}catch(_){}},90);
            setTimeout(()=>{try{if(window.__qumcActivePortal==='grc')window._grcEnsureFirstRender();}catch(_){}},360);
          }
          hideEntryLoading();
          console.log('[Auth] ✓ GRC portal entered for',window._fbRole,window._fbDept);
        }else{
          hideEntryLoading();
          console.error('[Auth] GRC runtime is not ready.');
          showPortal(window._fbName,window._fbRole);
          alert('GRC is still loading. Please try again.');
        }
      }
    };

    window._openForgot=()=>{const fo=ge('_forgotOverlay');if(fo)fo.style.display='flex';const re=ge('_resetEmail');if(re){re.value='';setTimeout(()=>re.focus(),100);}['_resetErr','_resetOk'].forEach(id=>{const e=ge(id);if(e)e.textContent='';});const b=ge('_resetBtn');if(b){b.disabled=false;b.textContent='Send Reset Link';}};
    window._closeForgot=()=>{const fo=ge('_forgotOverlay');if(fo)fo.style.display='none';};
    window._doResetPassword=async()=>{
      const em=(ge('_resetEmail')||{value:''}).value.trim().toLowerCase();
      const errEl=ge('_resetErr'),okEl=ge('_resetOk'),btn=ge('_resetBtn');
      if(errEl)errEl.textContent='';if(okEl)okEl.textContent='';
      if(!em){if(errEl)errEl.textContent='Please enter your email.';return;}
      try{
        if(btn){btn.disabled=true;btn.textContent='Checking…';}
        /* QUMC fix: password reset must be based on Firebase Authentication only. */
        if(btn)btn.textContent='Sending...';
        await sendPasswordResetEmail(auth,em);
        console.log('[Auth] Reset sent to:',em);
        if(okEl)okEl.textContent='Reset link sent. Check inbox and spam.';
        if(btn)btn.textContent='Sent ✓';
        setTimeout(()=>window._closeForgot(),4000);
      }catch(e){
        console.error('[Auth] Reset failed:',e.code);
        const msg=e.code==='auth/invalid-email'?'Invalid email format.':e.code==='auth/too-many-requests'?'Too many requests. Please wait.':'Reset link could not be sent. Please try again.';
        if(errEl)errEl.textContent=msg;
        if(btn){btn.disabled=false;btn.textContent='Send Reset Link';}
      }
    };

    onAuthStateChanged(auth,async user=>{
      console.log('[Auth] onAuthStateChanged — user:',user?user.email:'none');
      window._fbProfileResolved=false;
      if(!user){
        window.__qumcAuditLoginLoggedFor='';window._fbUser='';window._fbEmail='';window.currentUserEmail='';window._fbRole='viewer';window.currentUserRole='viewer';window._fbDept=null;window.currentUserDept=null;window._fbPerms=[];window._fbName='';window.currentUserName='';window._fbAssignedKpis=null;window._fbProfileResolved=false;
        try{window._stopAuditListener&&window._stopAuditListener();}catch(_){}try{window._stopReadListener&&window._stopReadListener();}catch(_){}try{window._grcRiskRequestsStop&&window._grcRiskRequestsStop();}catch(_){}try{window._grcStopSecureSync&&window._grcStopSecureSync();}catch(_){}showLogin();return;
      }
      const email=String(user.email||'').toLowerCase().trim();
      try{
        console.log('[FS READ] users/'+email);
        const snap = await _getServerDoc(doc(db,'users',email));
        if(!snap.exists()){console.warn('[Auth] Not in Firestore:',email);await signOut(auth);setErr('Account not registered. Contact admin.');showLogin();return;}
        const d=snap.data();
        if(!d.approved){console.warn('[Auth] Not approved:',email);await signOut(auth);setErr('Account pending approval.');showLogin();return;}
        const role=_normalizePortalRole(d.role||'viewer');
        const rawAccountDept=_advProfileDepartmentValue(d);
        const deptText=rawAccountDept==null?'':String(rawAccountDept).trim();
        /* Governance & Performance Manager is intentionally platform-wide.
           Ignore any legacy/stale operational department stored on the user doc
           so every device resolves the same All FMS scope. */
        const parsedAccountDept=(!deptText||['null','none','undefined','n/a','na','unassigned','not assigned','-','—'].includes(deptText.toLowerCase()))?null:rawAccountDept;
        const accountDept=role==='governance_performance_manager'?null:parsedAccountDept;
        console.log('[Auth] Role:',role,'Dept:',accountDept==null?'all departments':accountDept);
        let perms=[];
        /* Built-in role permissions are a fixed application/security contract.
           Do not let a stale config_roles document make two devices behave
           differently or silently widen a system role. Custom roles still load
           their permission list from Firestore. */
        if(Object.prototype.hasOwnProperty.call(DPERMS,role)){perms=(DPERMS[role]||[]).slice();console.log('[Auth] canonical built-in permissions:',role);}
        else{console.log('[FS READ] config_roles/'+role);try{const rs=await _getServerDoc(doc(db,'config_roles',role));perms=rs.exists()?(rs.data().permissions||[]):[];}catch(_){perms=[];}}
        if(d.extraPermissions)perms=[...new Set([...perms,...d.extraPermissions])];
        if(d.revokedPermissions)perms=perms.filter(p=>!d.revokedPermissions.includes(p));
        const realName=accountNameFrom(d,user,email);
        window._fbUser=email;window._fbEmail=email;window.currentUserEmail=email;window._fbRole=role;window.currentUserRole=role;window._fbDept=accountDept;window.currentUserDept=accountDept;window._fbPerms=perms;window._fbName=realName;window.currentUserName=realName;window._fbAssignedKpis=d.assignedKpis||null;window._fbProfileResolved=true;
        /* The GRC register listeners must bind only after the resolved user
           profile is known. Otherwise Auth may start them with an empty
           department and approved register changes never reach the dashboard. */
        try{var _grcNow=window.__qumcActivePortal==='grc'||!!(document.body&&document.body.classList.contains('grc-mode'));if(_grcNow&&typeof window._grcRestartSecureSync==='function')window._grcRestartSecureSync();}catch(syncErr){console.warn('[GRC Secure Sync] profile rebind skipped',syncErr);}
        /* v188: profile resolution is the only work allowed to block the portal.
           Role repair, advisory repair and audit writes are maintenance jobs and
           may take seconds on a slow connection. Show the two portal cards now,
           then run those jobs in the background so first login never stalls on
           the full-screen background until the user manually refreshes. */
        setUserDisplay(window._fbName,role);
        console.log('[Auth] Profile resolved — showing portal immediately');
        showPortal(window._fbName,role);
        setTimeout(async function(){
          try{
            if(_normalizePortalRole(role)==='super_admin'){
              try{await _ensureOwnerRoleDefinitions();}catch(re){console.warn('[Roles] Owner role installation skipped:',re&&re.message||re);}
              try{await _repairAdvisoryPublicMirrorV172();}catch(repairErr){console.warn('[Review Development] public mirror integrity repair skipped:',repairErr&&repairErr.message||repairErr);}
            }
            try{await _flushPendingAudit();}catch(ae){console.warn('[AUDIT] pending audit flush failed',ae&&ae.message||ae);}
            if(window.__qumcAuditLoginLoggedFor!==email){
              window.__qumcAuditLoginLoggedFor=email;
              try{await window._recordAuditDirect('LOGIN','Successful sign in');}catch(ae){console.warn('[AUDIT] login event failed',ae&&ae.message||ae);}
            }
          }catch(backgroundErr){console.warn('[Auth] background post-login work skipped',backgroundErr&&backgroundErr.message||backgroundErr);}
        },0);
      }catch(e){console.error('[Auth] Error:',e);setErr('Connection error. Try again.');showLogin();}
    });

    /* ── Firestore State Persistence ── */
    /* ══════════════════════════════════════════════════════
       _saveToFS: ONLY called by explicit user actions.
       Never called by onSnapshot, sLS, addAudit, or intervals.
       Debounced 800ms to prevent double-clicks firing twice.
       ══════════════════════════════════════════════════════ */
    let _fsSaveTimer=null, _fsPending=null;
    /* Queue of resolvers for the debounced write — allows callers to await real completion */
    var _fsResolveQueue=[];
    window._saveToFS = async (data) => {
      if(!window._fbUser||!db){
        console.warn('[FS] Write skipped — not authenticated');
        return Promise.reject(new Error('not authenticated'));
      }
      /* Suppress onSnapshot echoes from NOW — before the debounce even fires.
         Without this, a remote snapshot arriving in the 800ms window would
         overwrite ST.added with old Firestore data, erasing local changes. */
      window._lastCloudSaveTime = Date.now();
      /* Debounce: batch multiple rapid writes into one */
      _fsPending=data;
      /* Return a Promise that resolves ONLY when the Firestore write completes */
      var writePromise=new Promise(function(res,rej){_fsResolveQueue.push({resolve:res,reject:rej});});
      if(_fsSaveTimer) return writePromise; /* already scheduled — queue the resolver */
      _fsSaveTimer=setTimeout(async()=>{
        _fsSaveTimer=null;
        const d=_fsPending; _fsPending=null;
        const _localQueue=_fsResolveQueue.splice(0); /* capture resolvers before async work */
        if(!d){
          _localQueue.forEach(function(p){p.resolve();});
          return;
        }
      try {
        const {audit=[], ...rest} = d;
        await setDoc(doc(db,'kpi_dashboard','state'),
          {...rest, _by:window._fbUser, _at:serverTimestamp()}, {merge:true});
        /* Audit is persisted entry-by-entry through _appendAuditToFS.
           Never rewrite the whole audit array from dashboard state, because
           that would overwrite other users' events or restore cleared logs. */
        /* Firestore write successful — resolve all waiting callers */
        _localQueue.forEach(function(p){p.resolve();});
      } catch(e){
        console.error('[FS WRITE ERROR]',e.code||e.message,'added[] length:', (d.added||[]).length, e);
        _localQueue.forEach(function(p){p.reject(e);});
        /* Do not rethrow from the timer callback: awaited callers already receive
           the rejection above, while a second throw would become an unrelated
           unhandled promise rejection in the browser. */
        return;
      }
      }, 800); /* 800ms debounce — prevents double-click double-write */
      return writePromise; /* caller awaits this — resolves when write completes */
    };

    /* ══════════════════════════════════════════════════════
       kpi_requests: User Requests CRUD
       Uses its own Firestore collection — never touches ST.
       ══════════════════════════════════════════════════════ */
    function _fmtTs(ts){
      if(!ts) return '—';
      try{ return (ts.toDate?ts.toDate():new Date(ts)).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
      catch(_){ return String(ts); }
    }
    window._fmtTs=_fmtTs;

    function _isReviewDevelopmentRequestDoc(r){return !!(r&&(r.isReviewDevelopmentRequest===true||String(r.requestDomain||'')==='review_development'));}

    /* Submit a new request */
    window._kpiRequestsSubmit=async function(requestType,message){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      const ref=await addDoc(collection(db,'kpi_requests'),{
        userName: window._fbName||window._fbUser.split('@')[0],
        userEmail: (window._fbUser||'').toLowerCase().trim(),
        department: String(window._fbDept||window.currentUserDept||'').trim(),
        requestType: String(requestType||'General').trim(),
        message: String(message||'').trim(),
        status: 'pending',
        superAdminComment: '',
        createdAt: serverTimestamp(),
        respondedAt: null
      });
      try{await window._recordAuditDirect('USER_REQUEST_SUBMIT','Submitted Performance user request: '+String(requestType||'General'),null,{requestId:ref.id,requestType:String(requestType||'General')},{portal:'performance'});}catch(_){}
      return ref.id;
    };

    /* SA: get all requests ordered by newest first */
    window._kpiRequestsGetAll=async function(){
      if(!window._fbUser||!db) return [];
      try{
        const snap=await getDocs(query(collection(db,'kpi_requests'),orderBy('createdAt','desc')));
        return snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(r){return !_isReviewDevelopmentRequestDoc(r);});
      }catch(e){console.warn('[Requests] getAll:',e.message);return [];}
    };

    /* User: get own requests */
    window._kpiRequestsGetMine=async function(){
      if(!window._fbUser||!db) return [];
      try{
        /* Filter only by email — avoids composite index requirement.
           Sort newest-first on client. */
        const _email=(window._fbUser||'').toLowerCase().trim();
        const snap=await getDocs(query(collection(db,'kpi_requests'),
          where('userEmail','==',_email)));
        const rows=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(r){return !_isReviewDevelopmentRequestDoc(r);});
        rows.sort(function(a,b){
          var ta=(a.createdAt&&a.createdAt.seconds)||0;
          var tb=(b.createdAt&&b.createdAt.seconds)||0;
          return tb-ta;
        });
        return rows;
      }catch(e){
        console.warn('[Requests] getMine error:',e.code||'',e.message);
        if(e.message&&e.message.indexOf('index')>-1)
          console.info('[Requests] Tip: remove orderBy or create composite index in Firebase Console');
        return [];
      }
    }

    /* SA: respond to a request */
    window._kpiRequestsRespond=async function(requestId,status,comment){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      if(String(status||'').toLowerCase()==='rejected'&&!String(comment||'').trim())throw new Error('A rejection reason is required.');
      const requestRef=doc(db,'kpi_requests',requestId),beforeSnap=await getDoc(requestRef),before=beforeSnap.exists()?Object.assign({id:beforeSnap.id},beforeSnap.data()||{}):null;
      await updateDoc(requestRef,{
        status: status,
        superAdminComment: String(comment||'').trim(),
        respondedAt: serverTimestamp()
      });
      try{await window._recordAuditDirect('USER_REQUEST_RESPONSE','Performance user request '+String(status||'updated')+' · '+requestId,before,{requestId:requestId,status:String(status||''),comment:String(comment||'')},{portal:'performance'});}catch(_){}
    };

    /* ══════════════════════════════════════════════════════
       grc_requests: GRC system / access requests
       Separate from Performance kpi_requests, Risk Register approvals,
       and Review & Development Center requests.
       ══════════════════════════════════════════════════════ */
    function _grcSystemRequestRole(){return _normalizePortalRole(window._fbRole||window.currentUserRole||'viewer');}
    function _grcSystemRequestIsAdmin(){const r=_grcSystemRequestRole();return r==='admin'||r==='super_admin';}
    function _grcSystemRequestCanAnalyze(){return _grcSystemRequestIsAdmin()||_clientHasPerm('view_request_analytics')||_grcSystemRequestRole()==='governance_performance_manager';}
    window._grcRequestsSubmit=async function(requestType,message){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      const ref=await addDoc(collection(db,'grc_requests'),{
        platform:'grc',
        userName: window._fbName||window._fbUser.split('@')[0],
        userEmail: (window._fbUser||'').toLowerCase().trim(),
        department: String(window._fbDept||window.currentUserDept||'').trim(),
        requestType: String(requestType||'General GRC Request').trim(),
        message: String(message||'').trim(),
        status: 'pending',
        adminComment: '',
        rating: null,
        ratingComment: '',
        ratingAt: null,
        createdAt: serverTimestamp(),
        respondedAt: null,
        updatedAt: serverTimestamp(),
        updatedAtIso: new Date().toISOString()
      });
      try{await window._recordAuditDirect('GRC_USER_REQUEST_SUBMIT','Submitted GRC user request: '+String(requestType||'General GRC Request'),null,{requestId:ref.id,requestType:String(requestType||'General GRC Request')},{portal:'grc'});}catch(_){}
      return ref.id;
    };
    window._grcRequestsGetMine=async function(){
      if(!window._fbUser||!db) return [];
      try{
        const userEmail=(window._fbUser||'').toLowerCase().trim();
        const result=await getDocs(query(collection(db,'grc_requests'),where('userEmail','==',userEmail)));
        const rows=result.docs.map(function(d){return Object.assign({id:d.id},d.data());});
        rows.sort(function(a,b){return ((b.createdAt&&b.createdAt.seconds)||0)-((a.createdAt&&a.createdAt.seconds)||0);});
        return rows;
      }catch(e){console.warn('[GRC Requests] getMine:',e&&e.message);return [];}
    };
    window._grcRequestsGetAll=async function(){
      if(!window._fbUser||!db) return [];
      if(!_grcSystemRequestCanAnalyze()) throw new Error('Access denied.');
      try{
        const result=await getDocs(query(collection(db,'grc_requests'),orderBy('createdAt','desc')));
        return result.docs.map(function(d){return Object.assign({id:d.id},d.data());});
      }catch(e){
        try{const result=await getDocs(collection(db,'grc_requests'));const rows=result.docs.map(function(d){return Object.assign({id:d.id},d.data());});rows.sort(function(a,b){return ((b.createdAt&&b.createdAt.seconds)||0)-((a.createdAt&&a.createdAt.seconds)||0);});return rows;}catch(_){return [];}
      }
    };
    window._grcRequestsRespond=async function(requestId,status,comment){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      if(!_grcSystemRequestIsAdmin()) throw new Error('Access denied.');
      if(String(status||'').toLowerCase()==='rejected'&&!String(comment||'').trim())throw new Error('A rejection reason is required.');
      const nowIso=new Date().toISOString(),requestRef=doc(db,'grc_requests',requestId),beforeSnap=await getDoc(requestRef),before=beforeSnap.exists()?Object.assign({id:beforeSnap.id},beforeSnap.data()||{}):null;
      await updateDoc(requestRef,{
        status:String(status||'pending'),
        adminComment:String(comment||'').trim(),
        respondedAt:serverTimestamp(),
        respondedBy:String(window._fbName||window._fbUser||''),
        updatedAt:serverTimestamp(),
        updatedAtIso:nowIso
      });
      try{await window._recordAuditDirect('GRC_USER_REQUEST_RESPONSE','GRC user request '+String(status||'updated')+' · '+requestId,before,{requestId:requestId,status:String(status||''),comment:String(comment||'')},{portal:'grc'});}catch(_){}
    };
    window._grcRequestsRate=async function(requestId,rating,comment){
      if(!window._fbUser||!db)throw new Error('not authenticated');
      const ref=doc(db,'grc_requests',requestId),snap=await getDoc(ref);
      if(!snap.exists())throw new Error('Request not found.');
      const row=snap.data()||{},me=(window._fbUser||'').toLowerCase().trim();
      if(String(row.userEmail||'').toLowerCase().trim()!==me)throw new Error('Access denied.');
      const status=String(row.status||'').toLowerCase();
      if(!['approved','rejected'].includes(status))throw new Error('Only completed requests can be rated.');
      if(Number(row.rating||0))throw new Error('This request has already been rated.');
      const n=Math.max(1,Math.min(5,Number(rating||0))),nowIso=new Date().toISOString();
      await updateDoc(ref,{rating:n,ratingComment:String(comment||'').trim(),ratingAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:nowIso});
      try{await window._recordAuditDirect('GRC_USER_REQUEST_RATING','Rated GRC user request '+requestId+' · '+n+'/5',null,{requestId:requestId,rating:n,comment:String(comment||'')},{portal:'grc'});}catch(_){}
      return true;
    };
    window._grcRequestsSubscribeMine=function(callback){
      if(typeof callback!=='function'||!window._fbUser||!db)return function(){};
      const me=(window._fbUser||'').toLowerCase().trim();
      return onSnapshot(query(collection(db,'grc_requests'),where('userEmail','==',me)),function(snap){
        const rows=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
        rows.sort(function(a,b){return ((b.updatedAt&&b.updatedAt.seconds)||(b.createdAt&&b.createdAt.seconds)||0)-((a.updatedAt&&a.updatedAt.seconds)||(a.createdAt&&a.createdAt.seconds)||0);});
        callback(rows,null);
      },function(err){callback([],err);});
    };


    /* ══════════════════════════════════════════════════════
       Review & Development Center requests
       Primary storage:
         - advisory_requests (full request)
         - advisory_public (sanitized analytics)
       Compatibility fallback:
         - kpi_requests with requestDomain = review_development
       The fallback keeps the center operational on deployments whose current
       Firestore rules already allow kpi_requests but have not yet been updated
       for the dedicated Review & Development collections.
       ══════════════════════════════════════════════════════ */
    const ADV_REQUESTS_COLLECTION='advisory_requests';
    const ADV_PUBLIC_COLLECTION='advisory_public';
    const ADV_FALLBACK_COLLECTION='kpi_requests';
    function _advRole(){return _normalizePortalRole(window._fbRole||window.currentUserRole||'viewer');}
    function _advIsAdmin(){const r=_advRole();return r==='admin'||r==='super_admin';}
    function _advIsSuperAdmin(){return _advRole()==='super_admin';}
    function _advIsDepartmentManager(){return _advRole()==='department_manager';}
    function _advCanAnalyze(){return _advIsAdmin()||_clientHasPerm('view_request_analytics')||_advRole()==='governance_performance_manager';}
    function _advEmail(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
    function _advUid(){return String(auth.currentUser&&auth.currentUser.uid||'').trim();}
    function _advRawDepartment(){return Object.prototype.hasOwnProperty.call(window,'_fbDept')?window._fbDept:window.currentUserDept;}
    function _advCanonicalDepartment(value){
      let raw=String(value==null?'':value).trim();
      if(!raw||/^(null|none|undefined|n\/?a|na|unassigned|not assigned|-|—)$/i.test(raw))return'';
      const low=raw.toLowerCase(), compact=low.replace(/[^a-z0-9\u0600-\u06ff]+/g,' '), tokens=compact.split(/\s+/).filter(Boolean);
      const has=function(x){return tokens.indexOf(x)>=0;};
      if(low.includes('السلامة')||low.includes('سلامة')||low.includes('safety')||has('saf'))return'safety';
      if(low.includes('الصيانة')||low.includes('صيانة')||low.includes('maintenance')||has('mnt'))return'maintenance';
      if(low.includes('المغسلة')||low.includes('مغسلة')||low.includes('الغسيل')||low.includes('laundry')||has('lnd')||has('lund'))return'laundry';
      if(low.includes('النظافة')||low.includes('نظافة')||low.includes('housekeeping')||low.includes('cleaning')||has('hsk')||has('hk'))return'housekeeping';
      if(low.includes('المشاريع')||low.includes('مشاريع')||low.includes('project')||has('prj')||has('pmd')||low==='pm')return'projects';
      if(low.includes('الحوكمة')||low.includes('حوكمة')||low.includes('الأداء')||low.includes('الاداء')||low.includes('governance')||low.includes('performance')||has('gov'))return'governance';
      if(low.includes('facility management')||low.includes('facilities management')||low.includes('المرافق')||low.includes('division')||low==='fms')return'division';
      const normalized=low.replace(/[\s&/-]+/g,'_');
      return ['safety','maintenance','laundry','housekeeping','projects','governance','division'].includes(normalized)?normalized:'';
    }
    function _advDepartmentKey(){return _advCanonicalDepartment(_advRawDepartment());}
    function _advNormalizeRoleValue(value){return _normalizePortalRole(value);}
    function _advMeaningfulDepartment(value){var s=String(value==null?'':value).trim();return !!s&&!/^(null|none|undefined|n\/?a|na|unassigned|not assigned|-|—)$/i.test(s);}
    function _advProfileDepartmentValue(data){
      data=data||{};var fields=['dept','department','deptKey'],i,value;
      /* User documents have existed in three schemas. Never let an old blank or
         unrecognized `dept` shadow a valid department/departmentKey value.
         First pick the first field in the historical precedence that actually
         canonicalizes; only then retain an unrecognized meaningful value so the
         caller can surface an explicit profile error instead of silently
         widening the user to All Departments. */
      for(i=0;i<fields.length;i++){if(!Object.prototype.hasOwnProperty.call(data,fields[i]))continue;value=data[fields[i]];if(_advCanonicalDepartment(value))return value;}
      for(i=0;i<fields.length;i++){if(!Object.prototype.hasOwnProperty.call(data,fields[i]))continue;value=data[fields[i]];if(_advMeaningfulDepartment(value))return value;}
      return null;
    }
    async function _advFreshProfile(){
      const u=auth.currentUser;if(!u||!u.email)throw new Error('Not authenticated.');
      const profileEmail=String(u.email||'').toLowerCase().trim();
      const snap=await _getServerDoc(doc(db,'users',profileEmail));
      if(!snap.exists())throw new Error('Your user profile could not be found in Firestore.');
      const d=snap.data()||{};if(d.approved!==true)throw new Error('Your account is not approved.');
      const raw=_advProfileDepartmentValue(d);
      const meaningful=_advMeaningfulDepartment(raw),role=_advNormalizeRoleValue(d.role||'viewer'),parsedKey=_advCanonicalDepartment(raw),key=role==='governance_performance_manager'?'':parsedKey;
      if(role!=='governance_performance_manager'&&meaningful&&!parsedKey)throw new Error('profile-department-unrecognized:'+String(raw));
      return {email:String(u.email||'').toLowerCase().trim(),uid:String(u.uid||''),role:role,rawDepartment:role==='governance_performance_manager'?null:raw,departmentKey:key};
    }
    async function _advAssertRulesVersion(){
      if(window.__advRulesV39Verified===true)return true;
      try{await _getServerDoc(doc(db,'system_rule_versions','v39-grc-department-normalization-20260817'));window.__advRulesV39Verified=true;return true;}
      catch(e){if(String(e&&e.code||'').toLowerCase().indexOf('permission-denied')>=0)throw new Error('rules-version-mismatch:Firestore Rules v39 are not active. Publish the firestore.rules file included with this update, wait for Firebase to confirm the rules were saved successfully, then sign in again.');throw e;}
    }
    function _advIso(){return new Date().toISOString();}
    function _advTsMs(v){if(!v)return 0;try{return v.toDate?v.toDate().getTime():new Date(v).getTime()||0;}catch(_){return 0;}}
    function _advIsFallbackRow(r){return !!(r&&(r.isReviewDevelopmentRequest===true||String(r.requestDomain||'')==='review_development'));}
    function _advStatusKey(value){
      value=String(value||'open').toLowerCase();
      if(['closed','completed','cancelled','duplicate','out_of_scope','knowledge_guide'].includes(value))return'closed';
      if(['in_progress','awaiting_requester_information','responded'].includes(value))return'in_progress';
      return'open';
    }
    function _advPublicShape(r){
      r=r||{};
      return {
        code:String(r.code||''),platform:String(r.platform||'grc'),serviceType:String(r.serviceType||'record_request_review'),requestType:String(r.requestType||''),
        requestTypeLabel:String(r.requestTypeLabel||''),category:String(r.category||''),
        relatedType:String(r.relatedType||''),relatedItems:Array.isArray(r.relatedItems)?r.relatedItems.map(function(x){return {type:String(x&&x.type||''),id:String(x&&x.id||''),code:String(x&&x.code||''),name:String(x&&x.name||'')};}):[],
        relatedNewText:String(r.relatedNewText||''),benchmarkType:String(r.benchmarkType||''),formDependencies:r.formDependencies&&typeof r.formDependencies==='object'?r.formDependencies:null,departmentKey:String(r.departmentKey||''),
        departmentCode:String(r.departmentCode||''),gender:String(r.gender||''),priority:String(r.priority||'Medium'),
        status:_advStatusKey(r.status),workflowStage:String(r.workflowStage||r.status||'pending_super_admin'),closureReason:String(r.closureReason||''),requiresManagerApproval:r.requiresManagerApproval===true,managerDecision:String(r.managerDecision||''),managerActionAt:r.managerActionAt||null,managerActionAtIso:String(r.managerActionAtIso||''),createdAt:r.createdAt||r.createdAtIso||serverTimestamp(),updatedAt:r.updatedAt||r.updatedAtIso||serverTimestamp(),
        firstRespondedAt:r.firstRespondedAt||null,respondedAt:r.respondedAt||null,responseMinutes:r.responseMinutes==null?null:Number(r.responseMinutes),
        completedAt:r.completedAt||null,closedAt:r.closedAt||null,rating:r.rating==null?null:Number(r.rating),
        ratingComment:String(r.ratingComment||''),ratingAt:r.ratingAt||null,attachmentCount:Number(r.attachmentCount||0)
      };
    }
    function _advSafeCode(v){return String(v||'FMS').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5)||'FMS';}
    function _advAttachmentId(){try{return crypto.randomUUID().replace(/-/g,'');}catch(_){return 'att'+Date.now()+Math.random().toString(36).slice(2,9);}}
    function _advChunkDocId(requestId,attachmentId,index){return requestId+'_'+attachmentId+'_'+String(index).padStart(3,'0');}
    function _advBytesToBase64(bytes){let binary='';const step=0x8000;for(let i=0;i<bytes.length;i+=step){binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+step,bytes.length)));}return btoa(binary);}
    function _advBase64ToBytes(text){const binary=atob(text),out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}
    async function _advUploadFile(requestId,file,uploadedBy){
      if(!file)return null;
      if(Number(file.size||0)>5*1024*1024)throw new Error('Attachment must be 5 MB or smaller.');
      const attachmentId=_advAttachmentId(),buffer=new Uint8Array(await file.arrayBuffer()),chunkSize=320*1024,chunkCount=Math.max(1,Math.ceil(buffer.length/chunkSize));
      /* Keep every attachment all-or-nothing. A failed Promise.all used to
         leave orphan chunks that appeared on one device but could not be opened
         on another. The whole <=5 MB attachment fits safely in one Firestore
         write batch (at most 17 chunk documents with the current chunk size). */
      const batch=writeBatch(db);
      for(let i=0;i<chunkCount;i++){
        const chunk=buffer.subarray(i*chunkSize,Math.min((i+1)*chunkSize,buffer.length));
        batch.set(doc(db,'advisory_attachments',_advChunkDocId(requestId,attachmentId,i)),{
          requestId,attachmentId,index:i,data:_advBytesToBase64(chunk),createdAt:serverTimestamp(),uploadedBy:String(uploadedBy||_advEmail())
        },{merge:false});
      }
      await batch.commit();
      return {id:attachmentId,name:String(file.name||'attachment'),type:String(file.type||'application/octet-stream'),size:Number(file.size||0),chunkCount,createdAt:_advIso(),uploadedBy:String(uploadedBy||_advEmail())};
    }
    function _advNormalizeRow(id,r,storage){
      r=Object.assign({},r||{});
      if(storage==='kpi_requests'){
        r.details=String(r.details||r.message||'');
        r.title=String(r.title||r.requestTitle||r.requestTypeLabel||'Review & Development Request');
        r.status=String(r.status||'open')==='pending'?'open':String(r.status||'open');
        r.requestType=String(r.requestType||r.reviewRequestType||'edit_review');
        r.requestTypeLabel=String(r.requestTypeLabel||'');
        r.serviceType=String(r.serviceType||'record_request_review');
      }
      var legacyStatus=String(r.status||'open');
      if(!r.workflowStage)r.workflowStage=legacyStatus==='under_review'?'submitted':legacyStatus;
      r.status=_advStatusKey(legacyStatus);
      r.id=id;r._storage=storage;return r;
    }
    async function _advLocateRequest(requestId){
      try{
        const primary=await getDoc(doc(db,ADV_REQUESTS_COLLECTION,requestId));
        if(primary.exists())return {record:_advNormalizeRow(primary.id,primary.data(),'advisory_requests'),requestRef:primary.ref,publicRef:doc(db,ADV_PUBLIC_COLLECTION,primary.id),storage:'advisory_requests'};
      }catch(_){ }
      const fallback=await getDoc(doc(db,ADV_FALLBACK_COLLECTION,requestId));
      if(!fallback.exists()||!_advIsFallbackRow(fallback.data()))throw new Error('Request not found.');
      return {record:_advNormalizeRow(fallback.id,fallback.data(),'kpi_requests'),requestRef:fallback.ref,publicRef:null,storage:'kpi_requests'};
    }
    async function _advAuthorizedRequest(requestId,adminAllowed,managerAllowed){
      const loc=await _advLocateRequest(requestId),r=loc.record,owner=String(r.userEmail||'').toLowerCase().trim()===_advEmail();
      const manager=managerAllowed&&_advIsDepartmentManager()&&!!_advDepartmentKey()&&String(r.departmentKey||'')===_advDepartmentKey()&&String(r.workflowStage||r.status||'')==='pending_department_manager'&&r.requiresManagerApproval!==false;
      const analyticsViewer=adminAllowed&&_advCanAnalyze();
      if(!analyticsViewer&&!owner&&!manager)throw new Error('Access denied.');
      return Object.assign(r,{_requestRef:loc.requestRef,_publicRef:loc.publicRef});
    }
    async function _advGetSorted(collectionName){
      try{
        const snap=await getDocs(query(collection(db,collectionName),orderBy('createdAt','desc')));
        return snap.docs.map(d=>_advNormalizeRow(d.id,d.data(),collectionName));
      }catch(e){
        const snap=await getDocs(collection(db,collectionName));
        const rows=snap.docs.map(d=>_advNormalizeRow(d.id,d.data(),collectionName));
        rows.sort((a,b)=>_advTsMs(b.createdAt||b.createdAtIso)-_advTsMs(a.createdAt||a.createdAtIso));return rows;
      }
    }
    async function _advFallbackRows(userOnly){
      try{
        let snap;
        if(userOnly)snap=await getDocs(query(collection(db,ADV_FALLBACK_COLLECTION),where('userEmail','==',_advEmail())));
        else snap=await getDocs(collection(db,ADV_FALLBACK_COLLECTION));
        const rows=snap.docs.filter(d=>_advIsFallbackRow(d.data())).map(d=>_advNormalizeRow(d.id,d.data(),'kpi_requests'));
        rows.sort((a,b)=>_advTsMs(b.createdAt||b.createdAtIso)-_advTsMs(a.createdAt||a.createdAtIso));return rows;
      }catch(_){return [];}
    }
    function _advMergeRows(primary,fallback,publicOnly){
      const map=new Map();
      (fallback||[]).concat(primary||[]).forEach(function(r){
        if(!r)return;const key=String(r.platform||'grc')+'|'+String(r.code||r.id||'');
        const value=publicOnly?_advPublicShape(r):r;value.id=r.id;value._storage=r._storage;
        map.set(key,value);
      });
      return Array.from(map.values()).sort((a,b)=>_advTsMs(b.createdAt||b.createdAtIso)-_advTsMs(a.createdAt||a.createdAtIso));
    }

    window._advisorySubmit=async function(payload,file){
      if(!_advEmail()||!db)throw new Error('Not authenticated.');
      payload=payload||{};
      /* Read the user's profile again at submission time. This keeps the client
         payload in lock-step with the profile that Firestore Security Rules
         evaluate and prevents stale department/role values from causing false
         permission denials after an account was edited while the session stayed open. */
      await _advAssertRulesVersion();
      const freshProfile=await _advFreshProfile(),departmentKey=freshProfile.departmentKey;
      const isFreshManager=freshProfile.role==='department_manager';
      const isFreshPlatformManager=freshProfile.role==='governance_performance_manager';
      const isFreshAdmin=['admin','super_admin'].includes(freshProfile.role);
      const requiresManagerApproval=!!departmentKey&&!isFreshManager&&!isFreshPlatformManager&&!isFreshAdmin;
      const routedDeptCode=departmentKey?_advSafeCode(({safety:'SAF',maintenance:'MNT',laundry:'LND',housekeeping:'HSK',projects:'PRJ',governance:'GOV',division:'FMS'})[departmentKey]||payload.departmentCode):'FMS';
      const year=new Date().getFullYear(),deptCode=routedDeptCode,counterId=year+'_'+deptCode;
      const counterRef=doc(db,'advisory_counters',counterId),primaryRef=doc(collection(db,ADV_REQUESTS_COLLECTION));
      let code='',counterFallback=false;
      try{
        await runTransaction(db,async tx=>{const c=await tx.get(counterRef),next=Number(c.exists()&&c.data().next||0)+1;code='RD-'+deptCode+'-'+year+'-'+String(next).padStart(3,'0');tx.set(counterRef,{next,updatedAt:serverTimestamp()},{merge:true});});
      }catch(_){counterFallback=true;code='RD-'+deptCode+'-'+year+'-'+String(Date.now()).slice(-6)+Math.random().toString(36).slice(2,4).toUpperCase();}
      const nowIso=_advIso(),base={
        userName:String(window._fbName||window.currentUserName||freshProfile.email.split('@')[0]||'User'),userEmail:freshProfile.email,requesterUid:freshProfile.uid,requesterRole:freshProfile.role,
        departmentKey:departmentKey,departmentRaw:String(freshProfile.rawDepartment==null?'':freshProfile.rawDepartment).trim(),departmentCode:deptCode,gender:String(payload.gender||''),priority:String(payload.priority||'Medium'),
        platform:String(payload.platform||'grc'),serviceType:String(payload.serviceType||'record_request_review'),requestType:String(payload.requestType||''),requestTypeLabel:String(payload.requestTypeLabel||''),
        category:String(payload.category||''),relatedType:String(payload.relatedType||''),
        relatedItems:Array.isArray(payload.relatedItems)?payload.relatedItems.map(function(x){return {type:String(x&&x.type||''),id:String(x&&x.id||''),code:String(x&&x.code||''),name:String(x&&x.name||'')};}):[],
        relatedNewText:String(payload.relatedNewText||''),benchmarkType:String(payload.benchmarkType||''),formDependencies:payload.formDependencies&&typeof payload.formDependencies==='object'?payload.formDependencies:null,title:String(payload.title||''),details:String(payload.details||''),
        status:'open',workflowStage:requiresManagerApproval?'pending_department_manager':'pending_super_admin',requiresManagerApproval:requiresManagerApproval,managerDecision:requiresManagerApproval?'pending':'not_required',managerName:'',managerEmail:'',managerComment:'',managerActionAt:null,managerActionAtIso:'',closureReason:'',messages:[],attachments:[],attachmentCount:0,firstRespondedAt:null,respondedAt:null,responseMinutes:null,completedAt:null,closedAt:null,rating:null,ratingComment:'',ratingAt:null,
        createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAtIso:nowIso,updatedAtIso:nowIso,updatedBy:_advEmail(),code,counterFallback
      };
      const requestId=primaryRef.id,storage='advisory_requests';let warning='';
      /* New Review & Development requests intentionally use the dedicated collection only.
         Falling back to kpi_requests would bypass the Department Manager approval route. */
      try{
        /* advisory_requests is the single operational source of truth. A former
           atomic primary+mirror batch meant an analytics-mirror rule failure
           rolled back a perfectly valid user request. Persist the request first;
           dashboards now read this primary collection directly. */
        await setDoc(primaryRef,base,{merge:false});
      }catch(saveError){
        const codeText=String(saveError&&saveError.code||saveError&&saveError.message||saveError||'save-failed');
        if(codeText.toLowerCase().includes('permission')){
          throw new Error('permission-denied: role='+freshProfile.role+'; department='+String(freshProfile.rawDepartment==null?'':freshProfile.rawDepartment)+'; departmentKey='+departmentKey+'; workflowStage='+base.workflowStage+'; managerApproval='+String(requiresManagerApproval));
        }
        throw saveError;
      }
      if(file){try{
        const meta=await _advUploadFile(requestId,file,_advEmail()),attachmentUpdates={attachments:arrayUnion(meta),attachmentCount:1,updatedAt:serverTimestamp(),updatedAtIso:_advIso(),updatedBy:_advEmail()};
        await updateDoc(primaryRef,attachmentUpdates);
      }catch(fileError){warning='The request was submitted, but the attachment could not be uploaded.';console.warn('[Review Development] attachment upload failed',fileError&&fileError.code||fileError);}}
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_REQUEST_SUBMIT','Submitted '+String(base.platform||'grc')+' Review & Development request '+code,null,{requestId:requestId,code:code,requestType:base.requestType,category:base.category,workflowStage:base.workflowStage,departmentKey:departmentKey},{portal:String(base.platform||'grc')});}catch(_){}
      return {id:requestId,code,storage,warning,workflowStage:base.workflowStage,departmentKey:departmentKey};
    };

    window._advisoryGetPublic=async function(){
      if(!_advEmail()||!db)return[];
      let primary=[];
      /* Analytics roles read the authoritative request collection directly and
         sanitize in memory. Operational users use an exact own-email query. */
      if(_advCanAnalyze())primary=await _advGetSorted(ADV_REQUESTS_COLLECTION);
      else{
        try{const own=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where(_advUid()?'requesterUid':'userEmail','==',_advUid()||_advEmail())));primary=own.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests'));}catch(_){ }
      }
      const fallback=await _advFallbackRows(!_advCanAnalyze());
      return _advMergeRows(primary,fallback,true);
    };
    window._advisoryGetAll=async function(){if(!_advCanAnalyze())throw new Error('Access denied.');const primary=await _advGetSorted(ADV_REQUESTS_COLLECTION);return _advMergeRows(primary,await _advFallbackRows(false),false);};
    window._advisoryGetMine=async function(){
      if(!_advEmail()||!db)return[];
      let primary=[];
      /* requesterUid is the canonical ownership key for current requests. Keep
         the email query as a silent compatibility read for older documents; a
         legacy permission failure must never break the current request list. */
      if(_advUid()){
        const snap=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where('requesterUid','==',_advUid())));
        primary=snap.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests'));
      }
      try{
        const legacy=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where('userEmail','==',_advEmail())));
        primary=_advMergeRows(primary,legacy.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests')),false);
      }catch(_legacyOwnRead){}
      return _advMergeRows(primary,await _advFallbackRows(true),false);
    };
    window._advisoryGetManagerQueue=async function(){
      if(!_advIsDepartmentManager())throw new Error('Access denied.');
      const dept=_advDepartmentKey(),own=await window._advisoryGetMine();if(!dept)return own;
      const snap=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where('departmentKey','==',dept),where('workflowStage','==','pending_department_manager')));
      const departmentRows=snap.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests'));
      return _advMergeRows(departmentRows,own,false);
    };
    window._advisoryGetOne=async function(requestId){return _advAuthorizedRequest(requestId,true,true);};
    window._advisorySubscribe=function(callback){
      if(typeof callback!=='function'||!_advEmail()||!db)return function(){};
      let closed=false,timer=null,unsubs=[];
      const sources={};
      const required=[];
      const me=_advEmail();
      const dept=_advDepartmentKey();
      const stageOf=function(r){return String(r&&r.workflowStage||r&&r.status||'').trim().toLowerCase();};
      const rowsFromSnap=function(snap,storage){return snap.docs.map(function(d){return _advNormalizeRow(d.id,d.data(),storage);});};
      const emit=function(){
        if(closed)return;
        if(required.some(function(k){return !sources[k]||!sources[k].ready;}))return;
        clearTimeout(timer);
        timer=setTimeout(function(){
          if(closed)return;
          let primary=(sources.primary&&sources.primary.rows)||[];
          const fallback=(sources.fallback&&sources.fallback.rows)||[];
          /* Manager privacy and query correctness use two narrow listeners while
             this page is open: one exact pending queue for the manager's department
             and one exact own-request query. This prevents cross-department reads
             and avoids a broad department listener that Firestore can reject. */
          if(_advIsDepartmentManager()){
            primary=primary.concat((sources.own&&sources.own.rows)||[]);
          }
          const merged=_advMergeRows(primary,fallback,false);
          const dashboardRows=merged.map(function(r){const x=_advPublicShape(r);x.id=r.id;x._storage=r._storage;return x;});
          callback({
            records:merged,
            publicRecords:dashboardRows,
            errors:Object.keys(sources).reduce(function(out,k){if(sources[k]&&sources[k].error)out[k]=sources[k].error;return out;},{}),
            source:'snapshot'
          });
        },90);
      };
      const listen=function(key,qref,storage){
        required.push(key);sources[key]={ready:false,rows:[]};
        try{
          unsubs.push(onSnapshot(qref,function(snap){sources[key]={ready:true,rows:rowsFromSnap(snap,storage)};emit();},function(err){
            console.warn('[Review Development] live listener failed',key,err&&err.code||err);
            sources[key]={ready:true,rows:[],error:String(err&&err.message||err&&err.code||err||'listener-failed')};emit();
          }));
        }catch(err){sources[key]={ready:true,rows:[],error:String(err&&err.message||err||'listener-failed')};emit();}
      };
      if(_advIsDepartmentManager()){
        if(dept){
          listen('primary',query(collection(db,ADV_REQUESTS_COLLECTION),where('departmentKey','==',dept),where('workflowStage','==','pending_department_manager')),'advisory_requests');
          listen('own',query(collection(db,ADV_REQUESTS_COLLECTION),where(_advUid()?'requesterUid':'userEmail','==',_advUid()||me)),'advisory_requests');
        }else{
          listen('primary',query(collection(db,ADV_REQUESTS_COLLECTION),where(_advUid()?'requesterUid':'userEmail','==',_advUid()||me)),'advisory_requests');
        }
        listen('fallback',query(collection(db,ADV_FALLBACK_COLLECTION),where('userEmail','==',me)),'kpi_requests');
      }else if(_advIsAdmin()){
        listen('primary',collection(db,ADV_REQUESTS_COLLECTION),'advisory_requests');
        listen('fallback',collection(db,ADV_FALLBACK_COLLECTION),'kpi_requests');
      }else if(_advCanAnalyze()){
        /* Analytics roles read all authoritative requests. The dashboard is
           sanitized in memory, so no secondary mirror can break synchronization. */
        listen('primary',collection(db,ADV_REQUESTS_COLLECTION),'advisory_requests');
        listen('fallback',collection(db,ADV_FALLBACK_COLLECTION),'kpi_requests');
      }else{
        listen('primary',query(collection(db,ADV_REQUESTS_COLLECTION),where(_advUid()?'requesterUid':'userEmail','==',_advUid()||me)),'advisory_requests');
        listen('fallback',query(collection(db,ADV_FALLBACK_COLLECTION),where('userEmail','==',me)),'kpi_requests');
      }
      return function(){closed=true;clearTimeout(timer);unsubs.forEach(function(u){try{u();}catch(_){}});};
    };

    window._advisoryManagerAction=async function(requestId,action,comment){
      // Re-read the manager profile from the Firestore server immediately before
      // the decision. This keeps the client department/role exactly aligned with
      // the values Security Rules evaluate and avoids stale-device permission
      // failures after a profile change.
      await _advAssertRulesVersion();
      const freshProfile=await _advFreshProfile(),managerRoles=['department_manager'];
      if(!managerRoles.includes(freshProfile.role))throw new Error('Access denied.');
      const dept=freshProfile.departmentKey,managerEmail=freshProfile.email,managerName=String(window._fbName||window.currentUserName||managerEmail),managerComment=String(comment||'').trim();
      if(!dept)throw new Error('Your Department Manager profile does not have a valid department.');
      const loc=await _advLocateRequest(requestId),current=Object.assign(loc.record,{_requestRef:loc.requestRef,_publicRef:loc.publicRef});
      if(String(current.departmentKey||'')!==dept)throw new Error('This request does not belong to your department.');
      if(String(current.userEmail||'').toLowerCase().trim()===managerEmail)throw new Error('A Department Manager cannot approve their own request. Your request must be reviewed by Super Admin.');
      if(current._storage!=='advisory_requests')throw new Error('Legacy requests cannot use the Department Manager approval workflow.');
      if(String(current.workflowStage||'')!=='pending_department_manager')throw new Error('This request is no longer awaiting Department Manager approval.');
      if(!['approve','reject'].includes(String(action||'')))throw new Error('Unsupported action.');
      if(action==='reject'&&!managerComment)throw new Error('A rejection reason is required.');
      const requestRef=current._requestRef,publicRef=current._publicRef,nowIso=_advIso();
      let finalStage='',finalStatus='',closureReason='';
      await runTransaction(db,async tx=>{
        const snap=await tx.get(requestRef);if(!snap.exists())throw new Error('Request not found.');const live=snap.data()||{};
        if(String(live.workflowStage||'')!=='pending_department_manager')throw new Error('This request is no longer awaiting Department Manager approval.');
        if(String(live.departmentKey||'')!==dept)throw new Error('This request does not belong to your department.');
        if(String(live.userEmail||'').toLowerCase().trim()===managerEmail)throw new Error('A Department Manager cannot approve their own request.');
        if(action==='approve'){finalStage='pending_super_admin';finalStatus='open';closureReason='';}
        else{finalStage='rejected_manager';finalStatus='closed';closureReason='rejected_by_department_manager';}
        const updates={status:finalStatus,workflowStage:finalStage,closureReason:closureReason,managerDecision:action==='approve'?'approved':'rejected',managerComment:managerComment,managerName:managerName,managerEmail:managerEmail,managerActionAt:serverTimestamp(),managerActionAtIso:nowIso,updatedAt:serverTimestamp(),updatedAtIso:nowIso,updatedBy:managerEmail};
        if(action==='reject')updates.closedAt=serverTimestamp();
        tx.update(requestRef,updates);
      });
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_MANAGER_APPROVAL',(action==='approve'?'Approved and forwarded ':'Rejected ')+String(current.code||requestId),{workflowStage:'pending_department_manager'},{workflowStage:finalStage,managerDecision:action==='approve'?'approved':'rejected',comment:managerComment},{portal:String(current.platform||'grc')});}catch(_){}
      return true;
    };

    window._advisoryAdminAction=async function(requestId,action,data,file){
      if(!_advIsSuperAdmin())throw new Error('Super Admin approval is required.');
      data=data||{};const current=await _advAuthorizedRequest(requestId,true,false),requestRef=current._requestRef,publicRef=current._publicRef,nowIso=_advIso();const approvalStage=String(current.workflowStage||'');if(approvalStage==='pending_department_manager'||approvalStage==='rejected_manager')throw new Error('This request has not been approved by the Department Manager.');
      const updates={updatedAt:serverTimestamp(),updatedAtIso:nowIso,updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file&&current._storage==='advisory_requests'){try{const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}catch(e){throw new Error('The response attachment could not be uploaded: '+String(e&&e.message||e));}}
      const firstResponseActions=['respond','request_info'];
      if(firstResponseActions.includes(action)&&!current.firstRespondedAt){const created=_advTsMs(current.createdAt)||Date.now(),mins=Math.max(1,Math.ceil((Date.now()-created)/60000));updates.firstRespondedAt=serverTimestamp();updates.responseMinutes=mins;publicUpdates.firstRespondedAt=serverTimestamp();publicUpdates.responseMinutes=mins;}
      let status=_advStatusKey(current.status),workflowStage=String(current.workflowStage||current.status||'submitted'),closureReason=String(current.closureReason||''),messageText=String(data.text||'').trim();
      if(action==='respond'){status='in_progress';workflowStage='responded';updates.respondedAt=serverTimestamp();publicUpdates.respondedAt=serverTimestamp();}
      else if(action==='request_info'){status='in_progress';workflowStage='awaiting_requester_information';}
      else if(action==='close'){if(status==='closed')throw new Error('This request is already closed.');status='closed';workflowStage='closed';closureReason='closed_by_admin';updates.closedAt=serverTimestamp();publicUpdates.closedAt=serverTimestamp();}
      else if(action==='duplicate'){status='closed';workflowStage='closed';closureReason='duplicate';updates.closedAt=serverTimestamp();publicUpdates.closedAt=serverTimestamp();}
      else if(action==='out_of_scope'){status='closed';workflowStage='closed';closureReason='out_of_scope';updates.closedAt=serverTimestamp();publicUpdates.closedAt=serverTimestamp();}
      else if(action==='knowledge_guide'){status='closed';workflowStage='closed';closureReason='knowledge_guide';updates.closedAt=serverTimestamp();publicUpdates.closedAt=serverTimestamp();}
      else throw new Error('Unsupported action.');
      updates.status=status;updates.workflowStage=workflowStage;updates.closureReason=closureReason;publicUpdates.status=status;publicUpdates.workflowStage=workflowStage;publicUpdates.closureReason=closureReason;
      if(messageText||messageAttachments.length)updates.messages=arrayUnion({id:'msg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),senderRole:_advRole(),senderName:String(window._fbName||'Admin'),senderEmail:_advEmail(),text:messageText,attachments:messageAttachments,createdAt:nowIso});
      await updateDoc(requestRef,updates);
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_ADMIN_ACTION',String(action||'action')+' on '+String(current.code||requestId),{status:current.status,workflowStage:current.workflowStage},{status:status,workflowStage:workflowStage,comment:messageText},{portal:String(current.platform||'grc')});}catch(_){}
      return true;
    };

    window._advisoryRequesterAction=async function(requestId,action,data,file){
      data=data||{};const current=await _advAuthorizedRequest(requestId,false),requestRef=current._requestRef,publicRef=current._publicRef,updates={updatedAt:serverTimestamp(),updatedAtIso:_advIso(),updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file&&current._storage==='advisory_requests'){const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}
      if(action==='clarify'){
        var stage=String(current.workflowStage||current.status||'');if(stage!=='awaiting_requester_information')throw new Error('This request is not waiting for clarification.');const text=String(data.text||'').trim();if(!text)throw new Error('Clarification is required.');updates.status='in_progress';updates.workflowStage='clarification_received';publicUpdates.status='in_progress';publicUpdates.workflowStage='clarification_received';updates.messages=arrayUnion({id:'msg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),senderRole:_advRole(),senderName:String(window._fbName||'Requester'),senderEmail:_advEmail(),text,attachments:messageAttachments,createdAt:_advIso()});
      }else if(action==='complete'){var currentStage=String(current.workflowStage||current.status||'');if(currentStage!=='responded')throw new Error('The request must have an admin response first.');updates.status='in_progress';updates.workflowStage='requester_confirmed';updates.completedAt=serverTimestamp();publicUpdates.status='in_progress';publicUpdates.workflowStage='requester_confirmed';publicUpdates.completedAt=serverTimestamp();}
      else if(action==='cancel'){if(_advStatusKey(current.status)==='closed')throw new Error('This request can no longer be cancelled.');updates.status='closed';updates.workflowStage='closed';updates.closureReason='cancelled_by_requester';updates.closedAt=serverTimestamp();publicUpdates.status='closed';publicUpdates.workflowStage='closed';publicUpdates.closureReason='cancelled_by_requester';publicUpdates.closedAt=serverTimestamp();}
      else throw new Error('Unsupported action.');
      await updateDoc(requestRef,updates);
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_REQUESTER_ACTION',String(action||'action')+' on '+String(current.code||requestId),{status:current.status,workflowStage:current.workflowStage},{status:updates.status||current.status,workflowStage:updates.workflowStage||current.workflowStage},{portal:String(current.platform||'grc')});}catch(_){}
      return true;
    };

    window._advisoryRate=async function(requestId,rating,comment){
      const current=await _advAuthorizedRequest(requestId,false),n=Math.max(1,Math.min(5,Number(rating||0)));if(_advStatusKey(current.status)!=='closed')throw new Error('Only closed requests can be rated.');if(Number(current.rating))throw new Error('This request has already been rated.');
      const ratingComment=String(comment||'').trim(),updates={rating:n,ratingComment:ratingComment,ratingAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:_advIso(),updatedBy:_advEmail()};await updateDoc(current._requestRef,updates);
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_RATING','Rated Review & Development request '+String(current.code||requestId)+' · '+n+'/5',null,{requestId:requestId,rating:n,comment:ratingComment},{portal:String(current.platform||'grc')});}catch(_){}
      return true;
    };

    window._advisoryDownloadAttachment=async function(requestId,attachmentId,mimeType,chunkCount){
      const current=await _advAuthorizedRequest(requestId,true,true);if(current._storage!=='advisory_requests')throw new Error('No stored attachment is available for this request.');const chunks=[];
      for(let i=0;i<Number(chunkCount||0);i++){const snap=await getDoc(doc(db,'advisory_attachments',_advChunkDocId(requestId,attachmentId,i)));if(!snap.exists())throw new Error('Attachment chunk is missing.');chunks.push(_advBase64ToBytes(String(snap.data().data||'')));}
      const total=chunks.reduce((n,x)=>n+x.length,0),out=new Uint8Array(total);let offset=0;chunks.forEach(x=>{out.set(x,offset);offset+=x.length;});
      try{await window._recordAuditDirect('REVIEW_DEVELOPMENT_ATTACHMENT_DOWNLOAD','Downloaded attachment from '+String(current.code||requestId),null,{requestId:requestId,attachmentId:attachmentId},{portal:String(current.platform||'grc')});}catch(_){}
      return new Blob([out],{type:String(mimeType||'application/octet-stream')});
    };


    /* Cleanup helper for pre-launch test User Requests (Super Admin/Admin only, explicit caller). */

    /* ── GRC Risk Management Approval Workflow ────────────────────────
       This workflow is intentionally separate from Performance requests,
       Gap Analysis approvals and Review & Guidance requests.
       Published Risk Register data changes only after final Super Admin
       approval. Published records are written to the department-scoped
       grc_risks and grc_incidents collections. */
    const GRC_RISK_REQUESTS_COLLECTION='grc_risk_requests';
    const GRC_RISK_COUNTERS_COLLECTION='grc_risk_request_counters';
    const GRC_REGISTER_COLLECTIONS={risk:'grc_risks',incident:'grc_incidents'};
    const GRC_RISK_STATUS_COLLECTION='grc_risk_status';
    const GRC_REGISTER_SCHEMA_VERSION=2;
    function _grcRegisterHash(text){let h=2166136261,s=String(text||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
    function _grcRegisterSafeId(value){const out=String(value||'').trim().replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');return(out||'record').slice(0,86);}
    function _grcRegisterCloudId(recordType,record){
      record=record||{};const key=recordType==='incident'?'incidents':'risks',identity=String(record.id||record.code||record.riskId||'').trim();
      /* One deterministic document per register business ID. Do not preserve a
         legacy _cloudId because that recreates duplicate Risk/Incident rows. */
      if(identity)return _grcRegisterSafeId(identity)+'_'+_grcRegisterHash(key+'|'+identity);
      const existing=String(record._cloudId||record.cloudId||'').trim();if(existing)return _grcRegisterSafeId(existing);
      return _grcRegisterSafeId('record')+'_'+_grcRegisterHash(key+'|record');
    }
    function _grcRegisterCloudRecord(recordType,record,department,cloudId,revisionIso,revisionSource){
      const out=_grcRiskJson(record||{}),key=recordType==='incident'?'incidents':'risks',dept=_grcCanonicalDepartment(department||out.department),revision=String(revisionIso||out.publicationRevision||out.publishedAtIso||out.updatedAtIso||_grcRiskIso());
      out._cloudId=cloudId;out.cloudId=cloudId;out.department=dept;out.departmentKey=dept;out.visibility='department';out.recordType=key;out.schemaVersion=GRC_REGISTER_SCHEMA_VERSION;out.canonicalDocument=true;out.revisionSource=String(revisionSource||out.revisionSource||'workflow');out.updatedByEmail=_grcRiskEmail();out.cloudUpdatedAt=serverTimestamp();out.updatedAtIso=revision;out.publishedAtIso=revision;out.publicationRevision=revision;delete out._sourceCloudId;delete out._fromCache;if(!out.createdByEmail)out.createdByEmail=String(out.createdBy||_grcRiskEmail());return out;
    }
    function _grcRegisterBusinessKey(record){return _grcRiskKey(record&& (record.id||record.code||record.riskId));}
    async function _grcRegisterRemoveLegacyDuplicates(recordType,record,keepCloudId){
      if(!_grcRiskIsAdmin()||!record)return 0;
      const collectionName=GRC_REGISTER_COLLECTIONS[recordType],wantedKey=_grcRegisterBusinessKey(record),wantedDept=_grcCanonicalDepartment(record.department),keep=String(keepCloudId||record._cloudId||record.cloudId||'');
      if(!collectionName||!wantedKey||!keep)return 0;
      const snap=await getDocs(collection(db,collectionName)),deletes=[];
      snap.forEach(d=>{if(d.id===keep)return;const data=d.data()||{},key=_grcRegisterBusinessKey(data),dept=_grcRiskRecordDepartment(data);if(key===wantedKey&&(!wantedDept||!dept||dept===wantedDept))deletes.push(deleteDoc(doc(db,collectionName,d.id)));});
      if(deletes.length)await Promise.all(deletes);
      return deletes.length;
    }
    let _grcRiskRequestUnsub=null;
    let _grcPublishedRepairFor='';

    function _grcRiskRole(){return _normalizePortalRole(window._fbRole||window.currentUserRole||'viewer');}
    function _grcRiskEmail(){return String(window._fbUser||window.currentUserEmail||auth.currentUser&&auth.currentUser.email||'').toLowerCase().trim();}
    function _grcRiskUid(){return String(auth.currentUser&&auth.currentUser.uid||'').trim();}
    function _grcRawDeptValue(){if(Object.prototype.hasOwnProperty.call(window,'_fbDept'))return window._fbDept;return window.currentUserDept;}
    function _grcRiskRawDept(){const v=_grcRawDeptValue();return v==null?'':String(v).trim();}
    function _grcCanonicalDepartment(value){
      if(value===null||value===undefined)return'';
      const raw=String(value).trim(),n=raw.toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');
      if(!n||['null','none','undefined','n a','na','unassigned','not assigned','-','—'].includes(n))return'';
      if(n==='saf')return'safety';if(n==='mnt')return'maintenance';if(n==='hsk'||n==='hk')return'housekeeping';if(n==='lnd'||n==='lund')return'laundry';if(n==='prj'||n==='pmd'||n==='pm')return'projects';if(n==='gov')return'governance';
      if(n.includes('laundry')||n.includes('مغسلة')||n.includes('المغسلة')||n.includes('غسيل'))return'laundry';
      if(n.includes('housekeeping')||n.includes('cleaning')||n.includes('نظافة')||n.includes('النظافة'))return'housekeeping';
      if(n.includes('maintenance')||n.includes('صيانة')||n.includes('الصيانة'))return'maintenance';
      if(n.includes('safety')||n.includes('سلامة')||n.includes('السلامة'))return'safety';
      if(n.includes('project')||n.includes('مشاريع')||n.includes('المشاريع'))return'projects';
      if(n.includes('governance')||n.includes('performance')||n.includes('حوكمة')||n.includes('الحوكمة')||n.includes('الأداء')||n.includes('الاداء'))return'governance';
      if(n==='fms'||n.includes('facility management')||n.includes('facilities management')||n.includes('division')||n.includes('المرافق'))return'division';
      return n.replace(/\s+/g,'_');
    }
    function _grcRiskDept(){return _grcCanonicalDepartment(_grcRawDeptValue());}
    window._grcCanonicalDepartment=window._grcCanonicalDepartment||_grcCanonicalDepartment;
    function _grcRiskPerms(){return Array.isArray(window._fbPerms)?window._fbPerms:[];}
    function _grcRiskOwnsRequest(r){
      r=r||{};const uid=_grcRiskUid(),email=_grcRiskEmail();
      return (!!uid&&String(r.submittedByUid||'')===uid)||String(r.submittedByEmail||'').toLowerCase()===email;
    }
    function _grcRiskCanSubmit(recordType){recordType=String(recordType||'risk').toLowerCase();const r=_grcRiskRole();if(r==='governance_performance_manager')return false;const p=_grcRiskPerms(),owner=['risk_owner','grc_owner','platform_owner'].includes(r),workflow=p.includes('submit_risk_changes');if(recordType==='incident')return owner||workflow||p.includes('edit_incident_register')||p.includes('edit_risk_management')||p.includes('*');return owner||workflow||p.includes('edit_risk_management')||p.includes('*');}
    function _grcRiskIsManager(){return _grcRiskRole()==='department_manager';}
    function _grcRiskIsSuper(){return _grcRiskRole()==='super_admin';}
    function _grcRiskIsAdmin(){return _grcRiskRole()==='admin'||_grcRiskIsSuper();}
    function _grcRiskCanViewRegister(){const r=_grcRiskRole(),p=_grcRiskPerms();return ['super_admin','admin','department_manager','risk_owner','grc_owner','platform_owner','governance_performance_manager','viewer','user'].includes(r)||p.includes('access_grc')||p.includes('view_grc_department')||p.includes('edit_risk_management')||p.includes('edit_incident_register')||p.includes('*');}
    function _grcRiskCanUpdateStatus(){const r=_grcRiskRole();if(r==='governance_performance_manager')return false;const p=_grcRiskPerms();return ['risk_owner','grc_owner','platform_owner'].includes(r)||p.includes('update_risk_status')||p.includes('edit_risk_management')||p.includes('*');}
    async function _grcRiskAssertRulesVersion(){
      if(window.__grcRulesV39Verified===true)return true;
      try{await _getServerDoc(doc(db,'system_rule_versions','v39-grc-department-normalization-20260817'));window.__grcRulesV39Verified=true;return true;}
      catch(e){if(String(e&&e.code||'').toLowerCase().indexOf('permission-denied')>=0)throw new Error('rules-version-mismatch:Firestore Rules v39 are not active. Publish the firestore.rules file included with this update, wait for Firebase to confirm the rules were saved successfully, then sign in again.');throw e;}
    }
    window._qumcAssertFirestoreRulesV39=_grcRiskAssertRulesVersion;
    // Compatibility aliases point to the same current probe so old callers cannot
    // silently accept a stale deployed ruleset.
    window._qumcAssertFirestoreRulesV38=_grcRiskAssertRulesVersion;window._qumcAssertFirestoreRulesV36=_grcRiskAssertRulesVersion;window._qumcAssertFirestoreRulesV35=_grcRiskAssertRulesVersion;window._qumcAssertFirestoreRulesV34=_grcRiskAssertRulesVersion;window._qumcAssertFirestoreRulesV33=_grcRiskAssertRulesVersion;
    function _grcRiskRecordDepartment(record,fallback){
      record=record||{};const id=String(record.id||record.code||record.riskId||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
      /* Stable business IDs outrank legacy scope fields. This also handles old
         Incident IDs whose departmentKey may not have been backfilled yet. */
      if(/^LUND/.test(id)||/^INCLND/.test(id)||/^INCLAUNDRY/.test(id))return'laundry';
      if(/^HK/.test(id)||/^INCHSK/.test(id)||/^INCHK/.test(id))return'housekeeping';
      if(/^SAF/.test(id)||/^INCSAF/.test(id))return'safety';
      if(/^MNT/.test(id)||/^INCMNT/.test(id))return'maintenance';
      if(/^(PM|PMD|PRJ)/.test(id)||/^INC(PM|PMD|PRJ)/.test(id))return'projects';
      /* users/{email}.dept and historical record.department are the original
         schema authorities; departmentKey is a canonical compatibility field. */
      return _grcCanonicalDepartment(record.department||record.departmentKey||record.responsibleDept||record.responsibleDepartment||fallback);
    }
    window._grcRiskDirectStatusUpdate=async function(record,nextStatus){
      await _grcRiskAssertRulesVersion();
      const freshProfile=await _advFreshProfile();
      const allowedRoles=['risk_owner','grc_owner','platform_owner'];
      const canByRole=allowedRoles.includes(freshProfile.role),canByPerm=_grcRiskCanUpdateStatus();
      if(freshProfile.role==='governance_performance_manager'||(!canByRole&&!canByPerm))throw new Error('You do not have permission to update Risk status.');
      record=record||{};nextStatus=String(nextStatus||'').trim().toLowerCase();
      if(!['open','closed'].includes(nextStatus))throw new Error('Action Status can only be Open or Closed.');
      const myDepartment=freshProfile.departmentKey,department=_grcRiskRecordDepartment(record,myDepartment);
      if(!department||!myDepartment||department!==myDepartment)throw new Error('You can update Risk status only for your assigned department.');
      const now=_grcRiskIso(),businessKey=_grcRiskRecordKey(record),canonicalCloudId=_grcRegisterCloudId('risk',record);
      let liveRef=null,liveData=null;
      /* If this row came from Firestore, use the real source document id. The
         old code recomputed a deterministic id and then attempted to read a
         different/nonexistent document, which Firestore surfaced as permission
         denied for legacy/baseline rows. */
      const sourceId=String(record._sourceCloudId||'').trim();
      if(sourceId){
        try{const sourceSnap=await getDoc(doc(db,GRC_REGISTER_COLLECTIONS.risk,sourceId));if(sourceSnap.exists()&&sourceSnap.data().deleted!==true){liveRef=sourceSnap.ref;liveData=sourceSnap.data()||{};}}catch(e){if(String(e&&e.code||'')!=='permission-denied')console.warn('[GRC Risk Status] source lookup failed',e&&e.code||e);}
      }
      /* Canonical department query is query-safe and also finds records whose
         document id predates the current deterministic-id algorithm. */
      if(!liveRef){
        try{
          const deptSnap=await getDocs(query(collection(db,GRC_REGISTER_COLLECTIONS.risk),where('departmentKey','==',myDepartment)));
          for(const d of deptSnap.docs){const x=d.data()||{};if(x.deleted===true)continue;if(_grcRiskRecordKey(x)===businessKey){liveRef=d.ref;liveData=x;break;}}
        }catch(e){console.warn('[GRC Risk Status] canonical lookup failed',e&&e.code||e);}
      }
      let statusStoredInRecord=false;
      if(liveRef){
        const liveDept=_grcRiskRecordDepartment(Object.assign({},liveData||{},{id:(liveData&& (liveData.id||liveData.code))||record.id||record.code}),department);
        /* Legacy rows can still carry a stale department field even though the
           business ID is visibly part of the user's register. Prefer the
           canonical v190 migration, but if Firestore rejects this legacy row,
           fall back to the dedicated status-only collection instead of blocking
           the GRC Owner. No Risk content other than Open/Closed is written. */
        if(liveDept===myDepartment){
          try{
            await updateDoc(liveRef,{actionStatus:nextStatus,updatedAt:serverTimestamp(),updatedAtIso:now,updatedBy:String(window._fbName||window.currentUserName||freshProfile.email),updatedByEmail:freshProfile.email,cloudUpdatedAt:serverTimestamp()});
            statusStoredInRecord=true;
            try{await deleteDoc(doc(db,GRC_RISK_STATUS_COLLECTION,canonicalCloudId));}catch(_legacyDelete){}
          }catch(writeErr){
            const code=String(writeErr&&writeErr.code||writeErr&&writeErr.message||'').toLowerCase();
            if(!code.includes('permission'))throw writeErr;
            console.warn('[GRC Risk Status] legacy row denied; using status-only override until canonical migration completes');
          }
        }
      }
      if(!statusStoredInRecord){
        await setDoc(doc(db,GRC_RISK_STATUS_COLLECTION,canonicalCloudId),{
          recordId:String(record.id||record.code||record.riskId||''),cloudId:canonicalCloudId,department:myDepartment,departmentRaw:String(freshProfile.rawDepartment==null?'':freshProfile.rawDepartment),actionStatus:nextStatus,updatedAt:serverTimestamp(),updatedAtIso:now,updatedBy:String(window._fbName||window.currentUserName||freshProfile.email),updatedByEmail:freshProfile.email,updatedByUid:freshProfile.uid,schemaVersion:1
        },{merge:false});
      }
      try{window._recordAuditDirect&&window._recordAuditDirect('GRC_RISK_STATUS_UPDATE','Risk Action Status changed directly',record,Object.assign({},record,{actionStatus:nextStatus}),{portal:'grc',dept:department,recordType:'risk'});}catch(_){}
      return true;
    };

    function _grcRiskJson(v){try{return JSON.parse(JSON.stringify(v==null?null:v));}catch(_){return null;}}
    function _grcRiskIso(){return new Date().toISOString();}
    function _grcRevisionMillis(value){
      if(!value)return 0;if(typeof value==='number')return Number(value)||0;if(typeof value==='string'){const n=Date.parse(value);return Number.isFinite(n)?n:0;}if(typeof value.toMillis==='function')try{return Number(value.toMillis())||0;}catch(_){}if(typeof value.toDate==='function')try{return value.toDate().getTime()||0;}catch(_){}if(typeof value.seconds==='number')return(Number(value.seconds)||0)*1000+Math.floor((Number(value.nanoseconds)||0)/1000000);return 0;
    }
    function _grcRecordExplicitRevisionMillis(record){record=record||{};return Math.max(_grcRevisionMillis(record.publicationRevision),_grcRevisionMillis(record.publishedAtIso),_grcRevisionMillis(record.updatedAtIso),_grcRevisionMillis(record.publishedAt),_grcRevisionMillis(record.updatedAt),_grcRevisionMillis(record.createdAtIso),_grcRevisionMillis(record.createdAt));}
    function _grcRecordRevisionMillis(record){const explicit=_grcRecordExplicitRevisionMillis(record);return explicit||_grcRevisionMillis(record&&record.cloudUpdatedAt);}
    function _grcRiskDeptCode(d){return({maintenance:'MNT',safety:'SAF',housekeeping:'HSK',laundry:'LND',projects:'PRJ',division:'FMS',governance:'GOV'})[_grcCanonicalDepartment(d)]||'FMS';}
    function _grcRiskKey(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
    function _grcRiskRecordKey(r){return _grcRiskKey(r&& (r.id||r.code));}
    function _grcRiskSort(rows){return (rows||[]).sort((a,b)=>String(b.updatedAtIso||b.createdAtIso||'').localeCompare(String(a.updatedAtIso||a.createdAtIso||'')));}
    function _grcRiskChangedFields(before,after){
      before=before||{};after=after||{};const ignored={updatedAt:1,updatedBy:1,createdAt:1,createdBy:1,riskScore:1,riskLevel:1};
      return Array.from(new Set(Object.keys(before).concat(Object.keys(after)))).filter(k=>!ignored[k]&&JSON.stringify(before[k]??'')!==JSON.stringify(after[k]??''));
    }
    function _grcRegisterNextId(records,department,requested,recordType){
      recordType=String(recordType||'risk').toLowerCase();
      const dept=_grcCanonicalDepartment(department);
      if(recordType==='incident'&&dept==='projects'){
        const legacy=String(requested||'').trim().toUpperCase().match(/^(?:INC[- ]?)?PMD[- ]?(\d+)$/);
        if(legacy)requested='INC-PMD-'+String(Number(legacy[1])||0).padStart(2,'0');
      }
      const requestedKey=_grcRiskKey(requested);if(requestedKey&&!records.some(r=>_grcRiskRecordKey(r)===requestedKey))return String(requested).trim();
      if(recordType==='incident'){
        let max=0;
        if(dept==='projects'){
          records.forEach(r=>{if(_grcCanonicalDepartment(r&& (r.department||r.responsibleDept))!=='projects')return;const raw=String(r&&r.id||r&&r.code||'').toUpperCase(),m=raw.match(/^(?:INC[- ]?)?PMD[- ]?(\d+)$/);if(m)max=Math.max(max,Number(m[1])||0);});
          return'INC-PMD-'+String(max+1).padStart(2,'0');
        }
        const deptCode=_grcRiskDeptCode(dept),year=new Date().getFullYear(),prefix='INC-'+deptCode+'-'+year+'-';
        records.forEach(r=>{if(_grcCanonicalDepartment(r&& (r.department||r.responsibleDept))!==dept)return;const raw=String(r&&r.id||r&&r.code||'').toUpperCase(),m=raw.match(/(\d+)$/);if(m)max=Math.max(max,Number(m[1])||0);});
        return prefix+String(max+1).padStart(3,'0');
      }
      let prefix=({safety:'SAF',maintenance:'MNT',projects:'PM',laundry:'LUND'})[dept]||'HK';
      if(dept==='housekeeping'&&/^LUND/i.test(String(requested||'')))prefix='LUND';
      let max=0,width=2;
      records.forEach(r=>{const raw=String(r&&r.id||r&&r.code||'').toUpperCase().replace(/\s+/g,'');const m=raw.match(new RegExp('^'+prefix+'[- ]?(\\d+)$'));if(m){max=Math.max(max,Number(m[1])||0);width=Math.max(width,m[1].length);}});
      return prefix+(prefix==='HK'||prefix==='LUND'?'':' ')+String(max+1).padStart(width,'0');
    }
    function _grcRegisterApplyOperation(records,request){
      records=(Array.isArray(records)?records:[]).map(r=>_grcRiskJson(r));
      const recordType=String(request.recordType||'risk').toLowerCase(),label=recordType==='incident'?'Incident':'Risk',op=String(request.operation||''),targetKey=_grcRiskKey(request.targetRecordId||request.targetRiskId||request.currentRecord&&request.currentRecord.id||request.currentRecord&&request.currentRecord.code),proposed=_grcRiskJson(request.proposedRecord||{});
      if(op==='add'){
        const assigned=_grcRegisterNextId(records,request.department,proposed.id||proposed.code,recordType);proposed.id=assigned;proposed.code=proposed.code&&_grcRiskKey(proposed.code)!==_grcRiskKey(request.proposedRecord&&request.proposedRecord.id)?proposed.code:assigned;if(recordType==='incident'&&_grcCanonicalDepartment(request.department)==='projects')proposed.code=assigned;
        proposed.department=request.department;proposed.createdAt=proposed.createdAt||_grcRiskIso();proposed.createdBy=proposed.createdBy||request.submittedByName||request.submittedByEmail;proposed.updatedAt=_grcRiskIso();proposed.updatedBy=_grcRiskEmail();records.push(proposed);return{records,record:proposed};
      }
      const index=records.findIndex(r=>_grcRiskRecordKey(r)===targetKey);if(index<0)throw new Error(label+' record no longer exists.');
      if(op==='delete'){const removed=records[index];records.splice(index,1);return{records,record:removed};}
      if(op==='update'){
        const current=records[index],updated=Object.assign({},current,proposed,{id:current.id||proposed.id,code:current.code||proposed.code,department:current.department||request.department,updatedAt:_grcRiskIso(),updatedBy:_grcRiskEmail()});records[index]=updated;return{records,record:updated};
      }
      throw new Error('Unsupported '+recordType+' request operation.');
    }
    function _grcRiskRequestData(snap){if(!snap||!snap.exists())return null;const d=snap.data()||{};return Object.assign({id:snap.id},d,{createdAtText:window._fmtTs?window._fmtTs(d.createdAt):d.createdAtIso||'',updatedAtText:window._fmtTs?window._fmtTs(d.updatedAt):d.updatedAtIso||''});}

    window._grcRiskRequestSubmit=async function(operation,payload){
      if(!_grcRiskEmail()||!db)throw new Error('not authenticated');
      await _grcRiskAssertRulesVersion();
      const freshProfile=await _advFreshProfile();
      payload=payload||{};const recordType=String(payload.recordType||'risk').toLowerCase();
      const freshOwner=['risk_owner','grc_owner','platform_owner'].includes(freshProfile.role);
      if(!['risk','incident'].includes(recordType)||freshProfile.role==='governance_performance_manager'||(!freshOwner&&!_grcRiskCanSubmit(recordType)))throw new Error('Access denied.');
      operation=String(operation||'').toLowerCase();if(!['add','update','delete'].includes(operation))throw new Error('Invalid operation.');
      const userDepartment=freshProfile.departmentKey,departmentRaw=String(freshProfile.rawDepartment==null?'':freshProfile.rawDepartment).trim();
      if(!userDepartment)throw new Error('No department is assigned to your account. Contact the administrator before submitting.');
      /* The authenticated Firestore profile is the workflow authority. Never let
         a stale department stored inside a legacy Risk/Incident row reroute or
         block its owner's request. For existing records, infer the business-ID
         department only as a cross-department safety check; the request itself is
         always stamped with the user's canonical server department. */
      const existingRecord=payload.currentRecord||payload.proposedRecord||{},recordDepartment=_grcRiskRecordDepartment(existingRecord,userDepartment);
      if((operation==='update'||operation==='delete')&&recordDepartment&&recordDepartment!==userDepartment)throw new Error('You can submit requests for your assigned department only.');
      const department=userDepartment;
      const current=_grcRiskJson(payload.currentRecord),proposed=_grcRiskJson(payload.proposedRecord),year=new Date().getFullYear(),deptCode=_grcRiskDeptCode(department),kindCode=recordType==='incident'?'INC':'RSK',counterRef=doc(db,GRC_RISK_COUNTERS_COLLECTION,kindCode+'_'+deptCode+'_'+year),requestRef=doc(collection(db,GRC_RISK_REQUESTS_COLLECTION)),nowIso=_grcRiskIso();
      let requestCode='';
      try{
        requestCode=await runTransaction(db,async tx=>{const cs=await tx.get(counterRef),next=Number(cs.exists()&&cs.data().next||0)+1,code=kindCode+'-REQ-'+deptCode+'-'+year+'-'+String(next).padStart(3,'0');tx.set(counterRef,{next,recordType,updatedAt:serverTimestamp(),updatedBy:_grcRiskEmail()},{merge:true});return code;});
      }catch(counterError){
        console.warn('[GRC Risk Workflow] counter unavailable; using collision-safe fallback code',counterError&&counterError.code||counterError);
        requestCode=kindCode+'-REQ-'+deptCode+'-'+year+'-'+String(Date.now()).slice(-7);
      }
      const requestData={requestCode,recordType,operation,department,departmentKey:department,departmentRaw:departmentRaw,targetRiskId:String(payload.targetRiskId||payload.targetRecordId||current&&current.id||current&&current.code||proposed&&proposed.id||''),targetRecordId:String(payload.targetRecordId||payload.targetRiskId||current&&current.id||current&&current.code||proposed&&proposed.id||''),currentRecord:current,proposedRecord:proposed,changedFields:_grcRiskChangedFields(current,proposed),deleteReason:String(payload.deleteReason||''),requesterNote:String(payload.note||''),status:'pending_manager',submittedByName:String(window._fbName||window.currentUserName||freshProfile.email.split('@')[0]),submittedByEmail:freshProfile.email,submittedByUid:freshProfile.uid,submittedByRole:freshProfile.role,managerName:'',managerEmail:'',managerNote:'',superAdminName:'',superAdminEmail:'',superAdminNote:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAtIso:nowIso,updatedAtIso:nowIso,history:[{status:'pending_manager',by:freshProfile.email,role:freshProfile.role,at:nowIso,note:String(payload.note||'')}]};
      try{await setDoc(requestRef,requestData,{merge:false});}
      catch(saveError){
        const codeText=String(saveError&&saveError.code||saveError&&saveError.message||saveError||'save-failed');
        if(codeText.toLowerCase().includes('permission'))throw new Error('permission-denied: role='+freshProfile.role+'; department='+departmentRaw+'; departmentKey='+userDepartment+'; recordType='+recordType+'; operation='+operation);
        throw saveError;
      }
      /* setDoc resolves only after Firestore acknowledges the write. Avoid a
         second read here: older deployments could allow the create but reject
         the immediate verification read, producing a false permissions alert. */
      try{window._recordAuditDirect&&window._recordAuditDirect('GRC_REGISTER_REQUEST_SUBMIT',operation.toUpperCase()+' '+recordType+' request submitted',current,proposed,{portal:'grc',dept:department,recordType});}catch(_){}
      return{requestId:requestRef.id,requestCode:requestCode};
    };
    window._grcRiskRequestResubmit=async function(requestId,proposedRecord,note){
      if(!_grcRiskCanSubmit('risk')&&!_grcRiskCanSubmit('incident'))throw new Error('Access denied.');const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(!_grcRiskOwnsRequest(r))throw new Error('Access denied.');if(String(r.status||'')!=='returned_requester')throw new Error('Only a request returned for update can be edited and resubmitted.');
      const proposed=_grcRiskJson(proposedRecord||r.proposedRecord),now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status:'pending_manager',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'Resubmitted')});
      await updateDoc(ref,{proposedRecord:proposed,changedFields:_grcRiskChangedFields(r.currentRecord,proposed),status:'pending_manager',requesterNote:String(note||r.requesterNote||''),managerNote:'',superAdminNote:'',updatedAt:serverTimestamp(),updatedAtIso:now,history});
      try{await window._recordAuditDirect('GRC_REGISTER_REQUEST_RESUBMIT','Resubmitted '+String(r.recordType||'risk')+' request '+String(r.requestCode||requestId),r.proposedRecord,proposed,{portal:'grc',dept:r.department,recordType:r.recordType||'risk'});}catch(_){}
      return true;
    };
    window._grcRiskRequestCancel=async function(requestId){
      const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(!_grcRiskOwnsRequest(r))throw new Error('Access denied.');if(!['pending_manager','returned_requester'].includes(String(r.status||'')))throw new Error('This request can no longer be cancelled.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status:'cancelled',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:'Cancelled by requester'});await updateDoc(ref,{status:'cancelled',updatedAt:serverTimestamp(),updatedAtIso:now,history});
      try{await window._recordAuditDirect('GRC_REGISTER_REQUEST_CANCEL','Cancelled '+String(r.recordType||'risk')+' request '+String(r.requestCode||requestId),{status:r.status},{status:'cancelled'},{portal:'grc',dept:r.department,recordType:r.recordType||'risk'});}catch(_){}
      return true;
    };
    function _grcIsSyntheticProjectIncident(r){
      r=r||{};const dept=_grcCanonicalDepartment(r.department||r.responsibleDept),date=String(r.date||'').slice(0,10),cat=String(r.category||'').trim().toLowerCase(),factor=String(r.contributingFactors||'').trim().toLowerCase(),invest=String(r.investigationRequired||'').trim().toLowerCase(),status=String(r.status||'').trim().toLowerCase();
      return dept==='projects'&&['2024-01-01','2025-01-01'].includes(date)&&cat==='safety hazard'&&factor==='human error'&&invest==='no'&&status==='closed';
    }
    async function _grcRepairProjectIncidentIds(){
      /* v154: previous builds created two synthetic Project Management
         incidents and also renumbered arbitrary legacy incidents during read.
         Remove only those known synthetic placeholders; never renumber a real
         incident outside the Add workflow. */
      if(!_grcRiskIsAdmin()||!db)return 0;
      const snap=await getDocs(collection(db,GRC_REGISTER_COLLECTIONS.incident)),deletes=[];
      snap.forEach(d=>{const row=d.data()||{};if(_grcIsSyntheticProjectIncident(row))deletes.push(deleteDoc(doc(db,GRC_REGISTER_COLLECTIONS.incident,d.id)));});
      if(deletes.length)await Promise.all(deletes);
      return deletes.length;
    }
    window._grcRiskRepairProjectIncidentIds=_grcRepairProjectIncidentIds;

    window._grcMigrateRiskStatusOverrides=async function(){
      if(!_grcRiskIsAdmin()||!db)return 0;
      const snap=await getDocs(collection(db,GRC_RISK_STATUS_COLLECTION));let migrated=0;
      for(const d of snap.docs){
        const o=d.data()||{},status=String(o.actionStatus||'').trim().toLowerCase();if(!['open','closed'].includes(status))continue;
        const cloudId=String(o.cloudId||d.id),ref=doc(db,GRC_REGISTER_COLLECTIONS.risk,cloudId),riskSnap=await getDoc(ref);
        if(!riskSnap.exists()||riskSnap.data().deleted===true)continue;
        const now=String(o.updatedAtIso||_grcRiskIso());
        await updateDoc(ref,{actionStatus:status,updatedAt:serverTimestamp(),updatedAtIso:now,updatedBy:String(o.updatedBy||o.updatedByEmail||_grcRiskEmail()),updatedByEmail:String(o.updatedByEmail||_grcRiskEmail()),cloudUpdatedAt:serverTimestamp()});
        await deleteDoc(doc(db,GRC_RISK_STATUS_COLLECTION,d.id));migrated++;
      }
      return migrated;
    };

    window._grcRiskRepairPublishedRequests=async function(force){
      if(!_grcRiskIsSuper()||!db)return 0;
      const who=_grcRiskEmail();if(!force&&_grcPublishedRepairFor===who)return 0;
      const snap=await getDocs(query(collection(db,GRC_RISK_REQUESTS_COLLECTION),where('status','==','published'))),rows=[];
      snap.forEach(d=>rows.push(Object.assign({id:d.id},d.data()||{})));
      rows.sort((a,b)=>String(a.publishedAtIso||a.updatedAtIso||a.createdAtIso||'').localeCompare(String(b.publishedAtIso||b.updatedAtIso||b.createdAtIso||'')));
      let repaired=0;
      for(const request of rows){
        const recordType=String(request.recordType||'risk').toLowerCase()==='incident'?'incident':'risk',operation=String(request.operation||'').toLowerCase();
        if(!['add','update','delete'].includes(operation))continue;
        const base=_grcRiskJson(request.finalRecord||(operation==='delete'?request.currentRecord:request.proposedRecord)||{});if(!base)continue;
        const identity=operation==='add'?(request.proposedRecord||base):(request.currentRecord||base),cloudId=_grcRegisterCloudId(recordType,identity),ref=doc(db,GRC_REGISTER_COLLECTIONS[recordType],cloudId),existing=await getDoc(ref),now=_grcRiskIso(),revision=String(request.publishedAtIso||request.updatedAtIso||request.createdAtIso||now),requestMs=_grcRevisionMillis(revision),current=existing.exists()?(existing.data()||{}):null,currentExplicitMs=_grcRecordExplicitRevisionMillis(current);
        /* This repair is only for missing/stale publication writes. A later
           direct Admin edit is authoritative and must never be rolled back by
           replaying an older Published request during a future Admin login. */
        if(current&&currentExplicitMs>=requestMs)continue;
        if(operation==='delete'){
          const old=current||base,tomb=_grcRegisterCloudRecord(recordType,Object.assign({},old,base,{id:old.id||base.id,code:old.code||base.code,deleted:true,deletedAt:revision,updatedAt:revision,updatedBy:request.superAdminEmail||_grcRiskEmail()}),request.department,cloudId,revision,'workflow');
          tomb.deleted=true;tomb.deletedAt=revision;await setDoc(ref,tomb,{merge:false});await _grcRegisterRemoveLegacyDuplicates(recordType,tomb,cloudId);repaired++;
        }else{
          const desired=_grcRegisterCloudRecord(recordType,Object.assign({},base,{deleted:false}),request.department,cloudId,revision,'workflow');delete desired.deleted;delete desired.deletedAt;
          await setDoc(ref,desired,{merge:false});await _grcRegisterRemoveLegacyDuplicates(recordType,desired,cloudId);repaired++;
        }
      }
      try{repaired+=await _grcRepairProjectIncidentIds();}catch(idRepairErr){console.warn('[GRC Synthetic Incident Cleanup]',idRepairErr);}
      try{repaired+=await window._grcMigrateRiskStatusOverrides();}catch(statusRepairErr){console.warn('[GRC Risk Status Migration]',statusRepairErr);}
      _grcPublishedRepairFor=who;if(repaired&&typeof window._grcRestartSecureSync==='function')window._grcRestartSecureSync(true);return repaired;
    };

    window._grcRiskRequestManagerAction=async function(requestId,action,note){
      if(!_grcRiskIsManager())throw new Error('Department Manager approval is required.');const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(_grcCanonicalDepartment(r.department)!==_grcRiskDept())throw new Error('This request belongs to another department.');if(!['pending_manager','returned_manager'].includes(String(r.status||'')))throw new Error('This request is not awaiting your approval.');
      const status=action==='approve'?'pending_super_admin':action==='return'?'returned_requester':action==='reject'?'rejected_manager':'';if(!status)throw new Error('Invalid action.');if(action!=='approve'&&!String(note||'').trim())throw new Error('A reason is required.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status,by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});
      await updateDoc(ref,{status,managerName:String(window._fbName||''),managerEmail:_grcRiskEmail(),managerNote:String(note||''),managerActionAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:now,history});
      try{await window._recordAuditDirect('GRC_MANAGER_APPROVAL_'+String(action||'action').toUpperCase(),'Department Manager '+String(action||'action')+' · '+String(r.requestCode||requestId),{status:r.status},{status:status,note:String(note||'')},{portal:'grc',dept:r.department,recordType:r.recordType||'risk'});}catch(_){}
      return true;
    };
    window._grcRiskRequestSuperAction=async function(requestId,action,note){
      if(!_grcRiskIsSuper())throw new Error('Super Admin approval is required.');const requestRef=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId);if(action==='approve'){
        let published=null,recordType='risk',publishedOperation='',publishedBefore=null;await runTransaction(db,async tx=>{
          const rs=await tx.get(requestRef);if(!rs.exists())throw new Error('Request not found.');const request=Object.assign({id:rs.id,recordType:'risk'},rs.data());if(String(request.status||'')!=='pending_super_admin')throw new Error('This request is not awaiting final approval.');
          recordType=String(request.recordType||'risk').toLowerCase()==='incident'?'incident':'risk';const operation=String(request.operation||'').toLowerCase(),current=_grcRiskJson(request.currentRecord||{}),proposed=_grcRiskJson(request.proposedRecord||{}),cloudId=_grcRegisterCloudId(recordType,operation==='add'?proposed:current),recordRef=doc(db,GRC_REGISTER_COLLECTIONS[recordType],cloudId),existing=await tx.get(recordRef),now=_grcRiskIso(),statusRef=recordType==='risk'?doc(db,GRC_RISK_STATUS_COLLECTION,cloudId):null;
          publishedOperation=operation;publishedBefore=existing.exists()?_grcRiskJson(existing.data()):_grcRiskJson(current);if(operation==='add'){if(existing.exists()&&existing.data().deleted!==true)throw new Error((recordType==='incident'?'Incident':'Risk')+' record already exists.');published=_grcRegisterCloudRecord(recordType,proposed,request.department,cloudId,now,'workflow');published.createdAt=published.createdAt||now;published.createdBy=published.createdBy||request.submittedByName||request.submittedByEmail;delete published.deleted;delete published.deletedAt;tx.set(recordRef,published,{merge:false});if(statusRef)tx.delete(statusRef);}
          else if(operation==='update'){const old=existing.exists()&&existing.data().deleted!==true?(existing.data()||{}):current;published=_grcRegisterCloudRecord(recordType,Object.assign({},old,proposed,{id:old.id||proposed.id,code:old.code||proposed.code,createdAt:old.createdAt||proposed.createdAt,createdBy:old.createdBy||proposed.createdBy,updatedAt:now,updatedBy:_grcRiskEmail()}),request.department,cloudId,now,'workflow');delete published.deleted;delete published.deletedAt;tx.set(recordRef,published,{merge:false});if(statusRef)tx.delete(statusRef);}
          else if(operation==='delete'){const old=existing.exists()?(existing.data()||{}):current;published=Object.assign({_cloudId:cloudId,cloudId:cloudId},old);const tombstone=_grcRegisterCloudRecord(recordType,Object.assign({},old,{id:old.id||current.id,code:old.code||current.code,deleted:true,deletedAt:now,updatedAt:now,updatedBy:_grcRiskEmail()}),request.department,cloudId,now,'workflow');tombstone.deleted=true;tombstone.deletedAt=now;tx.set(recordRef,tombstone,{merge:false});if(statusRef)tx.delete(statusRef);}
          else throw new Error('Unsupported '+recordType+' request operation.');
          const history=Array.isArray(request.history)?request.history.slice():[];history.push({status:'published',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});tx.set(requestRef,{status:'published',recordType,superAdminName:String(window._fbName||''),superAdminEmail:_grcRiskEmail(),superAdminNote:String(note||''),finalRecord:published,publishedRiskId:recordType==='risk'?String(published&&published.id||''):'',publishedRecordId:String(published&&published.id||''),publishedCloudId:String(published&& (published._cloudId||published.cloudId)||''),approvedAt:serverTimestamp(),publishedAt:serverTimestamp(),publishedAtIso:now,updatedAt:serverTimestamp(),updatedAtIso:now,history},{merge:true});
        });
        try{await _grcRegisterRemoveLegacyDuplicates(recordType,published,published&& (published._cloudId||published.cloudId));}catch(cleanupErr){console.warn('[GRC Register Publish] legacy duplicate cleanup skipped',cleanupErr);}
        try{if(typeof window._grcApplyPublishedRegisterRecord==='function')window._grcApplyPublishedRegisterRecord(recordType,publishedOperation,published);}catch(uiErr){console.warn('[GRC Register Publish] local refresh skipped',uiErr);}
        try{if(typeof window._grcRestartSecureSync==='function')window._grcRestartSecureSync(true);}catch(_syncErr){}
        try{await window._recordAuditDirect('GRC_SUPER_ADMIN_APPROVAL_APPROVE','Super Admin approved and published '+recordType+' '+publishedOperation+' request',publishedBefore,publishedOperation==='delete'?null:published,{portal:'grc',recordType:recordType,dept:published&&published.department||''});}catch(_){}
        return published;
      }
      const snap=await getDoc(requestRef);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(String(r.status||'')!=='pending_super_admin')throw new Error('This request is not awaiting final approval.');const status=action==='return'?'returned_manager':action==='reject'?'rejected_super_admin':'';if(!status)throw new Error('Invalid action.');if(!String(note||'').trim())throw new Error('A reason is required.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status,by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});await updateDoc(requestRef,{status,superAdminName:String(window._fbName||''),superAdminEmail:_grcRiskEmail(),superAdminNote:String(note||''),updatedAt:serverTimestamp(),updatedAtIso:now,history});
      try{await window._recordAuditDirect('GRC_SUPER_ADMIN_APPROVAL_'+String(action||'action').toUpperCase(),'Super Admin '+String(action||'action')+' · '+String(r.requestCode||requestId),{status:r.status},{status:status,note:String(note||'')},{portal:'grc',dept:r.department,recordType:r.recordType||'risk'});}catch(_){}
      return true;
    };
    async function _grcRiskRead(queryRef){const snap=await getDocs(queryRef),rows=[];snap.forEach(d=>rows.push(_grcRiskRequestData(d)));return _grcRiskSort(rows);}
    function _grcRiskMergeRows(groups){const map={};(groups||[]).forEach(rows=>(rows||[]).forEach(r=>{if(r&&r.id)map[r.id]=r;}));return _grcRiskSort(Object.keys(map).map(id=>map[id]));}
    async function _grcRiskReadMany(qrefs){const groups=await Promise.all((qrefs||[]).map(async qref=>{try{return await _grcRiskRead(qref);}catch(err){console.warn('[GRC Risk Requests] scoped read failed',err&&err.code||err);return[];}}));return _grcRiskMergeRows(groups);}
    window._grcRiskRequestsGetMine=async function(){
      if(!_grcRiskEmail())return[];const col=collection(db,GRC_RISK_REQUESTS_COLLECTION),qrefs=[];
      if(_grcRiskUid())qrefs.push(query(col,where('submittedByUid','==',_grcRiskUid())));
      qrefs.push(query(col,where('submittedByEmail','==',_grcRiskEmail())));
      return _grcRiskReadMany(qrefs);
    };
    window._grcRiskRequestsGetForManager=async function(){
      if(!_grcRiskIsManager())return[];
      const col=collection(db,GRC_RISK_REQUESTS_COLLECTION),qrefs=[],raw=_grcRiskRawDept(),key=_grcRiskDept();
      /* Department Manager approval inbox is intentionally strict: it is
         department-scoped only. Personal/owner fallbacks must never widen the
         manager approval queue. If no department is assigned, there is no
         approval inbox until a department is configured. */
      if(!raw&&!key)return[];
      if(raw)qrefs.push(query(col,where('departmentRaw','==',raw)));
      if(key){qrefs.push(query(col,where('departmentKey','==',key)));qrefs.push(query(col,where('department','==',key)));}
      return _grcRiskReadMany(qrefs);
    };
    window._grcRiskRequestsGetAll=async function(){if(!_grcRiskIsAdmin())throw new Error('Access denied.');return _grcRiskRead(collection(db,GRC_RISK_REQUESTS_COLLECTION));};
    window._grcRiskRequestsSubscribe=function(callback){
      if(_grcRiskRequestUnsub){_grcRiskRequestUnsub();_grcRiskRequestUnsub=null;}if(!_grcRiskEmail()||!db)return function(){};if(!_grcRiskCanViewRegister()||['viewer','user'].includes(_grcRiskRole())){callback([]);return function(){};}
      const col=collection(db,GRC_RISK_REQUESTS_COLLECTION),qrefs=[];
      if(_grcRiskIsAdmin())qrefs.push(col);
      else{
        const raw=_grcRiskRawDept(),key=_grcRiskDept();
        if(_grcRiskIsManager()){
          /* SECURITY / WORKFLOW RULE: Department Managers receive only the
             Risk & Incident approval activity for their assigned department.
             Do not add submittedByUid/submittedByEmail fallback queries here;
             a manager's personal requests belong in My Requests, not in the
             approval inbox or approval notifications. */
          if(!raw&&!key){callback([]);return function(){};}
          if(raw)qrefs.push(query(col,where('departmentRaw','==',raw)));
          if(key){qrefs.push(query(col,where('departmentKey','==',key)));qrefs.push(query(col,where('department','==',key)));}
        }else{
          /* Other GRC roles keep department activity plus own-request fallback
             for compatibility with older workflow documents. */
          if(raw)qrefs.push(query(col,where('departmentRaw','==',raw)));
          if(key){qrefs.push(query(col,where('departmentKey','==',key)));qrefs.push(query(col,where('department','==',key)));}
          if(_grcRiskUid())qrefs.push(query(col,where('submittedByUid','==',_grcRiskUid())));
          qrefs.push(query(col,where('submittedByEmail','==',_grcRiskEmail())));
        }
      }
      const sources={},unsubs=[],failed={};let successCount=0;
      function emit(){callback(_grcRiskMergeRows(Object.keys(sources).map(k=>sources[k])));}
      qrefs.forEach((qref,i)=>{unsubs.push(onSnapshot(qref,{includeMetadataChanges:true},snap=>{
        const rows=[];snap.forEach(d=>{if(d.metadata&&d.metadata.hasPendingWrites)return;const row=_grcRiskRequestData(d);if(row)rows.push(row);});sources[i]=rows;delete failed[i];successCount++;emit();
      },err=>{failed[i]=err;console.warn('[GRC Risk Requests] listener '+i+' failed',err&&err.code||err);if(Object.keys(failed).length===qrefs.length&&successCount===0)callback([],err);}));});
      _grcRiskRequestUnsub=function(){unsubs.forEach(u=>{try{u();}catch(_){}});};return _grcRiskRequestUnsub;
    };
    window._grcRiskRequestsStop=function(){if(_grcRiskRequestUnsub){_grcRiskRequestUnsub();_grcRiskRequestUnsub=null;}};

    window._kpiRequestsClearAllForLaunch=async function(){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      const role=_normalizePortalRole(window._fbRole||'');
      if(role!=='super_admin'&&role!=='admin') throw new Error('access denied');
      const snap=await getDocs(collection(db,'kpi_requests'));
      await Promise.all(snap.docs.map(function(d){return deleteDoc(doc(db,'kpi_requests',d.id));}));
      return snap.docs.length;
    };

    /* ══════════════════════════════════════════════════════
       READ-ONLY onSnapshot: receives changes from other users.
       RULE: Never writes to Firestore from this listener.
       ══════════════════════════════════════════════════════ */
    const PERFORMANCE_SHARED_DEFAULTS={
      added:()=>[], deleted:()=>[], gapApprovals:()=>[], requests:()=>[],
      gaps:()=>({}), actions:()=>({}), pci:()=>({}), codeOv:()=>({}), ov:()=>({}),
      textEdits:()=>({}), rptEdits:()=>({}), masterKpis:()=>({}),
      kpiFormulaOverrides:()=>({}), pciConfig:()=>({})
    };
    function _perfClone(value){
      try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}
    }
    function _applyPerformanceCloudState(fsData,clearMissing){
      if(typeof ST==='undefined'||!ST)return false;
      fsData=fsData&&typeof fsData==='object'?fsData:{};
      let changed=false;
      Object.keys(PERFORMANCE_SHARED_DEFAULTS).forEach(function(field){
        const has=Object.prototype.hasOwnProperty.call(fsData,field);
        if(!has&&!clearMissing)return;
        const next=_perfClone(has?fsData[field]:PERFORMANCE_SHARED_DEFAULTS[field]());
        try{if(JSON.stringify(ST[field])!==JSON.stringify(next)){ST[field]=next;changed=true;}}
        catch(_){ST[field]=next;changed=true;}
      });
      if(Object.prototype.hasOwnProperty.call(fsData,'audit')){
        const next=_perfClone(fsData.audit||[]);
        try{if(JSON.stringify(ST.audit)!==JSON.stringify(next)){ST.audit=next;changed=true;}}catch(_){ST.audit=next;changed=true;}
      }
      return changed;
    }
    window._applyPerformanceCloudState=_applyPerformanceCloudState;

    let _fsListenerUnsub = null;
    window._startReadListener = function(){
      if(_fsListenerUnsub || !db || !window._fbUser) return;
      _fsListenerUnsub = onSnapshot(
        doc(db,'kpi_dashboard','state'),
        {includeMetadataChanges:true},
        function(snap){
          if(!snap.exists()) return;
          /* Ignore browser/memory-cache snapshots. A server-confirmed snapshot
             is the only source allowed to change shared KPI/chart data. */
          if(snap.metadata&&snap.metadata.fromCache){
            window.__qumcPerformanceCloudSource='cache-waiting-for-server';
            console.log('[FS READ] cached snapshot ignored — waiting for server');
            return;
          }
          window.__qumcPerformanceCloudSource='server-live';
          const fsData = snap.data();
          if(!fsData) return;
          /* Echo suppression: our local state already contains the write. */
          const msSince = Date.now() - (window._lastCloudSaveTime||0);
          if(msSince < 2000){
            console.log('[FS READ] onSnapshot: own echo suppressed ('+Math.round(msSince)+'ms)');
            return;
          }
          console.log('[FS READ] server change — replacing shared client state + updating UI');
          const changed=_applyPerformanceCloudState(fsData,true);
          if(typeof _reconcileDeletedVsAdded==='function')_reconcileDeletedVsAdded(ST);
          if(!changed) return;
          try{ localStorage.setItem('kpi_v3',JSON.stringify({...ST,_v:3})); }catch(_){}
          const savedPage = window.curPage || 'exec';
          try{ if(typeof renderYearFilter==='function') renderYearFilter(); }catch(_){}
          try{ if(typeof renderCurrent==='function') renderCurrent(); }catch(_){}
          window.curPage = savedPage;
          document.querySelectorAll('.tabnav .tab').forEach(function(t){
            t.classList.toggle('on',(t.getAttribute('onclick')||'').indexOf("'"+savedPage+"'")>=0);
          });
        },
        function(err){ console.warn('[FS READ] listener error:',err.code||err.message); }
      );
      console.log('[FS] Server-authoritative read listener active — NEVER writes back to Firestore');
    };
    window._stopReadListener = function(){
      if(_fsListenerUnsub){ _fsListenerUnsub(); _fsListenerUnsub=null; console.log('[FS] Listener stopped'); }
    };

    window._loadFromFS = async () => {
      if(!db) return null;
      try {
        console.log('[FS READ] SERVER kpi_dashboard/state'+(_auditCanView()?' + audit':''));
        const stateSnap = await _getServerDoc(doc(db,'kpi_dashboard','state'));
        const state  = stateSnap.exists() ? stateSnap.data() : {};
        const {_by, _at, ...clean} = state;
        window.__qumcPerformanceCloudSource='server-initial';
        if(_auditCanView()){
          const auditSnap=await _getServerDoc(AUDIT_DOC_REF);
          const audit=auditSnap.exists()?auditSnap.data():{};
          return {...clean, audit:_auditSort(audit.log||[]).slice(0,AUDIT_MAX_RECORDS)};
        }
        return clean;
      } catch(e){
        window.__qumcPerformanceCloudSource='unavailable-local-fallback';
        console.warn('[FS] Server load error — keeping local fallback only:',e.code||e.message);
        return null;
      }
    };

    /* Initial Performance hydration is server-authoritative. Browser localStorage
       is only a temporary fallback; it can never override shared KPI/chart data
       once an authenticated server snapshot has been received. */
    window._onFSLoaded = async (options) => {
      options=options||{};
      try{
        const fsData = await window._loadFromFS();
        if(fsData===null) return false;
        if(typeof ST==='undefined') return false;
        console.log('[FS] Applying authoritative Firestore state, keys:',Object.keys(fsData));
        _applyPerformanceCloudState(fsData,true);
        if(typeof _reconcileDeletedVsAdded==='function')_reconcileDeletedVsAdded(ST);
        /* Keep the per-device cache as a mirror of the latest server state. */
        try{
          localStorage.setItem('kpi_v3',JSON.stringify({...ST,_v:3}));
          localStorage.setItem('qumc_performance_cache_owner_v166',String(window._fbUser||'').toLowerCase().trim());
          localStorage.setItem('qumc_performance_cache_build',QUMC_CLIENT_BUILD);
        }catch(_){}
        if(typeof renderYearFilter==='function') renderYearFilter();
        if(!options.skipRender&&typeof renderCurrent==='function') renderCurrent();
        if(typeof updateBadge==='function') updateBadge();
        if(typeof window.updateAlertUI==='function') window.updateAlertUI();
        else if(typeof window.renderNotifications==='function') window.renderNotifications(false);
        return true;
      }catch(e){ console.warn('[FS] onFSLoaded error:',e); return false; }
    };

    /* Support diagnostic: if one device ever disagrees again, this exposes the
       exact build/profile/cloud source and shared-state counts without changing
       any user data. Run _qumcDataDiagnostics() in DevTools Console. */
    window._qumcDataDiagnostics=function(){
      const st=(typeof ST!=='undefined'&&ST)||{};
      return{
        build:QUMC_CLIENT_BUILD,
        cloudSource:String(window.__qumcPerformanceCloudSource||''),
        email:String(window._fbUser||''),
        role:String(window._fbRole||''),
        department:window._fbDept==null?null:String(window._fbDept),
        profileResolved:window._fbProfileResolved===true,
        counts:{
          added:Array.isArray(st.added)?st.added.length:0,
          deleted:Array.isArray(st.deleted)?st.deleted.length:0,
          gaps:st.gaps&&typeof st.gaps==='object'?Object.keys(st.gaps).length:0,
          actions:st.actions&&typeof st.actions==='object'?Object.keys(st.actions).length:0,
          overrides:st.ov&&typeof st.ov==='object'?Object.keys(st.ov).length:0
        }
      };
    };

    console.log('[Auth] Firebase module initialized');