import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,fetchSignInMethodsForEmail,setPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    import { getFirestore,doc,getDoc,setDoc,addDoc,collection,serverTimestamp,onSnapshot,updateDoc,arrayUnion,query,where,orderBy,getDocs,deleteDoc,runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const firebaseConfig={apiKey:"AIzaSyAlLWZvsu4UbHn-LncFdrSHlbL3bIAG4no",authDomain:"qumc-kpi-dashboard-f10dd.firebaseapp.com",projectId:"qumc-kpi-dashboard-f10dd",storageBucket:"qumc-kpi-dashboard-f10dd.firebasestorage.app",messagingSenderId:"659971973475",appId:"1:659971973475:web:483116a0711008a6a97356"};
    const DPERMS={
      super_admin:['*'],
      admin:['access_performance','access_grc','manage_users','view_all_departments','view_department','edit_kpi','edit_gap_analysis','edit_actions','edit_targets','approve_changes','lock_quarter','unlock_quarter','view_executive_intelligence','export_reports','manage_dashboard_settings','view_audit_trail'],
      executive:['access_performance','access_grc','view_all_departments','view_department','view_executive_intelligence','export_reports'],
      department_manager:['access_performance','access_grc','view_department','view_executive_intelligence','export_reports'],
      kpi_owner:['access_performance','view_department','edit_kpi','edit_gap_analysis','export_reports'],
      risk_owner:['access_grc','view_department','view_grc_department','view_shared_grc','edit_risk_management','edit_incident_register','update_risk_status','submit_risk_changes','export_reports'],
      platform_owner:['access_performance','access_grc','view_department','view_grc_department','view_shared_grc','edit_kpi','edit_gap_analysis','edit_actions','edit_risk_management','edit_incident_register','update_risk_status','submit_risk_changes','export_reports'],
      viewer:['access_performance','access_grc','view_department','export_reports'],
      user:['access_performance','access_grc','view_department','export_reports']
    };

    const OWNER_ROLE_DEFINITIONS={
      risk_owner:{
        nameEn:'Risk Owner',nameAr:'مالك المخاطر',
        description:'Department-scoped owner for the GRC Risk and Incident Registers.',
        platforms:['grc'],systemRole:true,
        permissions:DPERMS.risk_owner.slice()
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

    function _normalizePortalRole(value){return String(value||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
    function _clientHasPerm(perm){const p=Array.isArray(window._fbPerms)?window._fbPerms:[];return p.includes('*')||p.includes(perm);}
    function _canAccessPortal(portal){
      portal=portal==='governance'?'grc':String(portal||'').toLowerCase();
      const r=_normalizePortalRole(window._fbRole||window.currentUserRole),p=Array.isArray(window._fbPerms)?window._fbPerms:[];
      if(p.includes('*'))return true;
      if(portal==='performance'){
        if(p.includes('access_performance'))return true;
        return ['super_admin','admin','executive','department_manager','kpi_owner','platform_owner','viewer','user'].includes(r);
      }
      if(portal==='grc'){
        if(p.includes('access_grc'))return true;
        return ['super_admin','admin','executive','department_manager','risk_owner','platform_owner','viewer','user'].includes(r);
      }
      return false;
    }
    window._canAccessPortal=_canAccessPortal;
    function _syncPortalCards(){
      const performance=ge('_portalPerformanceCard'),grc=ge('_portalGrcCard'),grid=ge('_portalCardGrid');
      const canPerformance=_canAccessPortal('performance'),canGrc=_canAccessPortal('grc');
      if(performance)performance.style.display=canPerformance?'block':'none';
      if(grc)grc.style.display=canGrc?'block':'none';
      if(grid)grid.style.gridTemplateColumns=(canPerformance&&canGrc)?'1fr 1fr':'minmax(260px,420px)';
      return {performance:canPerformance,grc:canGrc};
    }
    window._syncPortalCards=_syncPortalCards;
    async function _ensureOwnerRoleDefinitions(){
      if(_normalizePortalRole(window._fbRole)!=='super_admin'||!auth.currentUser)return false;
      for(const [roleId,definition] of Object.entries(OWNER_ROLE_DEFINITIONS)){
        const ref=doc(db,'config_roles',roleId),snap=await getDoc(ref);
        if(!snap.exists())await setDoc(ref,Object.assign({},definition,{createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:auth.currentUser.email||''}));
      }
      return true;
    }
    window._installOwnerRoles=_ensureOwnerRoleDefinitions;


    /* ── Shared Audit Trail ─────────────────────────────────────────────
       Every meaningful user action is persisted to Firestore so the
       Super Admin sees one shared log across all users and devices.
       Normal users can append their own actions; only users who can view
       the Audit Trail subscribe to the shared log in real time. */
    const AUDIT_DOC_REF=doc(db,'kpi_dashboard','audit');
    const AUDIT_MAX_RECORDS=1000;
    let _auditListenerUnsub=null;
    let _auditWriteChain=Promise.resolve();

    function _auditId(){
      try{return crypto.randomUUID();}catch(_){return 'audit_'+Date.now()+'_'+Math.random().toString(36).slice(2,10);}
    }
    function _auditCleanValue(v){
      if(v===undefined)return null;
      if(v===null)return null;
      if(typeof v==='object'){
        try{return JSON.parse(JSON.stringify(v));}catch(_){return String(v);}
      }
      return String(v);
    }
    function _auditEntry(raw){
      raw=raw||{};
      return {
        id:String(raw.id||_auditId()),
        ts:String(raw.ts||new Date().toISOString()),
        user:String(raw.user||window._fbName||window.currentUserName||((window._fbUser||'').split('@')[0])||'User'),
        email:String(raw.email||window._fbUser||window.currentUserEmail||auth.currentUser&&auth.currentUser.email||'—'),
        role:String(raw.role||window._fbRole||window.currentUserRole||'viewer'),
        action:String(raw.action||'ACTIVITY'),
        detail:String(raw.detail||''),
        oldVal:_auditCleanValue(raw.oldVal),
        newVal:_auditCleanValue(raw.newVal),
        portal:String(raw.portal||window.__qumcActivePortal||''),
        page:String(raw.page||window.curPage||''),
        dept:String(raw.dept||window._fbDept||window.currentUserDept||''),
        sessionId:String(raw.sessionId||window.__qumcAuditSessionId||(window.__qumcAuditSessionId='s_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)))
      };
    }
    function _auditSort(log){
      return (Array.isArray(log)?log:[]).filter(Boolean).sort(function(a,b){return String(b.ts||'').localeCompare(String(a.ts||''));});
    }
    function _auditCanView(){
      const r=String(window._fbRole||'').toLowerCase().replace(/[\s-]+/g,'_');
      return r==='super_admin'||r==='admin'||(Array.isArray(window._fbPerms)&&window._fbPerms.includes('view_audit_trail'))||(Array.isArray(window._fbPerms)&&window._fbPerms.includes('*'));
    }
    function _applyAuditCloudLog(log){
      log=_auditSort(log).slice(0,AUDIT_MAX_RECORDS);
      window.__qumcAuditCloudLog=log;
      try{
        if(typeof ST!=='undefined'){
          ST.audit=log.slice();
          localStorage.setItem('kpi_v3',JSON.stringify(Object.assign({},ST,{_v:3})));
        }
      }catch(_){ }
      try{if(typeof window.loadAuditLog==='function')window.loadAuditLog();else if(typeof loadAuditLog==='function')loadAuditLog();}catch(_){ }
    }
    window._appendAuditToFS=function(raw){
      const entry=_auditEntry(raw);
      if(!auth.currentUser){
        window.__qumcAuditPending=window.__qumcAuditPending||[];
        window.__qumcAuditPending.push(entry);
        return Promise.resolve(false);
      }
      _auditWriteChain=_auditWriteChain.catch(function(){return null;}).then(function(){
        return runTransaction(db,async function(tx){
          const snap=await tx.get(AUDIT_DOC_REF);
          const data=snap.exists()?snap.data():{};
          let log=Array.isArray(data.log)?data.log.slice():[];
          log=log.filter(function(x){return x&&String(x.id)!==entry.id;});
          log.unshift(entry);
          log=_auditSort(log).slice(0,AUDIT_MAX_RECORDS);
          tx.set(AUDIT_DOC_REF,{log:log,updatedAt:serverTimestamp(),updatedBy:entry.email},{merge:true});
        });
      });
      return _auditWriteChain;
    };
    window._recordAuditDirect=function(action,detail,oldVal,newVal,extra){
      return window._appendAuditToFS(Object.assign({},extra||{},{action:action,detail:detail,oldVal:oldVal,newVal:newVal}));
    };
    window._clearAuditFromFS=async function(){
      if(!_auditCanView())throw new Error('access denied');
      await setDoc(AUDIT_DOC_REF,{log:[],clearedAt:serverTimestamp(),clearedBy:window._fbUser||'',updatedAt:serverTimestamp()},{merge:false});
      _applyAuditCloudLog([]);
      return true;
    };
    window._startAuditListener=function(){
      if(_auditListenerUnsub||!auth.currentUser||!_auditCanView())return;
      _auditListenerUnsub=onSnapshot(AUDIT_DOC_REF,function(snap){
        const data=snap.exists()?snap.data():{};
        _applyAuditCloudLog(data.log||[]);
      },function(err){console.warn('[AUDIT] live listener failed:',err&&err.code||err&&err.message||err);});
      console.log('[AUDIT] Shared Audit Trail listener active');
    };
    window._stopAuditListener=function(){if(_auditListenerUnsub){_auditListenerUnsub();_auditListenerUnsub=null;}};
    async function _flushPendingAudit(){
      const q=(window.__qumcAuditPending||[]).splice(0);
      for(const e of q){try{await window._appendAuditToFS(e);}catch(err){console.warn('[AUDIT] pending write failed',err);}}
    }

    /* Session-only persistence — clears on browser close, prevents cached auto-login */
    setPersistence(auth,browserSessionPersistence).then(()=>console.log('[Auth] Session persistence set')).catch(e=>console.warn('[Auth] Persistence:',e.message));

    const ge=id=>{const e=document.getElementById(id);if(!e)console.warn('[Auth] Missing element:',id);return e;};
    const cleanAccountName=v=>{v=String(v||'').trim();if(!v)return'';if(['user','username','account','admin','null','undefined','-','—'].includes(v.toLowerCase()))return'';return v;};
    const accountNameFrom=(data,user,email)=>cleanAccountName(data&&data.userName)||cleanAccountName(data&&data.username)||cleanAccountName(data&&data.name)||cleanAccountName(data&&data.fullName)||cleanAccountName(data&&data.displayName)||cleanAccountName(user&&user.displayName)||cleanAccountName(email&&email.split('@')[0])||'';
    const setUserDisplay=(name,role)=>{try{const n=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';window._fbName=n;window.currentUserName=n;const ids=['_portalUserName','_userName','topUserName','profileName','profileNameRow'];ids.forEach(id=>{const e=ge(id);if(e)e.textContent=n;});const avIds=['_userAvatar','topUserAvatar','profileAvatar'];avIds.forEach(id=>{const av=ge(id);if(av)av.textContent=(n||'U')[0].toUpperCase();});if(role){const rl=ge('_userRole');if(rl)rl.textContent=role;}if(typeof window.updateUserBadge==='function')window.updateUserBadge(n,window._fbRole||role,window._fbPerms||[]);}catch(e){console.warn('[Auth] user display update skipped',e);}};
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
    const showLogin=()=>{console.log('[Auth] showLogin');/* Show overlay (already visible, but ensure it is) */const ao=ge('_authOverlay');if(ao){ao.style.display='flex';ao.style.alignItems='flex-end';ao.style.background='rgba(245,247,252,0)'}/* Hide loading spinner, show login form */const ld=ge('_authLoading');if(ld)ld.style.display='none';const lp=ge('_loginPanel');if(lp)lp.style.display='block';const po=ge('_portalOverlay');if(po)po.style.display='none';const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}};
    const showPortal=(name,role)=>{console.log('[Auth] showPortal:',name,role);const po=ge('_portalOverlay'),lo=ge('_authOverlay');if(lo)lo.style.display='none';if(po){po.style.display='flex';console.log('[Auth] _portalOverlay is now flex');}else{console.error('[Auth] PORTAL OVERLAY NOT FOUND');return;}const nm=ge('_portalUserName'),rl=ge('_portalUserRole');const realName=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';if(nm)nm.textContent=realName;if(rl){const L={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',risk_owner:'Risk Owner',platform_owner:'Performance & GRC Owner',viewer:'Viewer',user:'User'};rl.textContent=L[_normalizePortalRole(role)]||role;}setTimeout(_syncPortalCards,0);console.log('[Auth] Portal ready');};
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

    window._doLogout=async()=>{console.log('[Auth] Logout');try{await window._recordAuditDirect('LOGOUT','User signed out');}catch(e){console.warn('[AUDIT] logout write skipped',e);}try{window._stopAuditListener&&window._stopAuditListener();await signOut(auth);}catch(e){console.error('[Auth]',e);}};

    window._backToPortal=()=>{console.log('[Auth] Back to portal');const lo=document.getElementById('_authOverlay'),po=document.getElementById('_portalOverlay'),bg=document.getElementById('_bgLayer');if(lo)lo.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};
window._selectPortal=async portal=>{
      portal=portal==='governance'?'grc':portal;
      console.log('[Auth] Selected:',portal);
      if(!_canAccessPortal(portal)){
        if(typeof window._showPortalAccessDenied==='function')window._showPortalAccessDenied(portal);
        else alert(portal==='grc'?'Your role does not have access to the GRC platform.':'Your role does not have access to the Performance platform.');
        return;
      }
      window.__qumcActivePortal=portal;
      try{window._recordAuditDirect&&window._recordAuditDirect('PORTAL_OPEN','Opened portal: '+portal,null,portal,{portal:portal});}catch(_){ }
      if(portal==='performance'){
        hideEntryLoading();
        ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='none';});
        console.log('[Auth] Entering Performance portal...');
        setUserDisplay(window._fbName,window._fbRole);
        if(typeof window.applyRolePermissions==='function')window.applyRolePermissions(window._fbRole,window._fbDept,window._fbPerms);
        if(typeof window.updateUserBadge==='function')window.updateUserBadge(window._fbName,window._fbRole,window._fbPerms);
        /* Load shared Firestore state in the background — no entry loading screen. */
        if(typeof window._onFSLoaded==='function'){
          window._onFSLoaded().catch(e=>console.warn('[FS] background initial load skipped:',e));
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
        hideEntryLoading();
        ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='none';});
        setUserDisplay(window._fbName,window._fbRole);
        if(typeof window.applyRolePermissions==='function')window.applyRolePermissions(window._fbRole,window._fbDept,window._fbPerms);
        if(typeof window.updateUserBadge==='function')window.updateUserBadge(window._fbName,window._fbRole,window._fbPerms);
        if(typeof window._enterGRC==='function'){
          if(typeof window._grcRiskApprovalEntryNoticeReset==='function')window._grcRiskApprovalEntryNoticeReset();
          window._enterGRC();
          console.log('[Auth] ✓ GRC portal entered for',window._fbRole,window._fbDept);
        }else{
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
      if(!user){window.__qumcAuditLoginLoggedFor='';try{window._stopAuditListener&&window._stopAuditListener();}catch(_){}showLogin();return;}
      const email=user.email||'';
      try{
        console.log('[FS READ] users/'+email);
        const snap = await getDoc(doc(db,'users',email));
        if(!snap.exists()){console.warn('[Auth] Not in Firestore:',email);await signOut(auth);setErr('Account not registered. Contact admin.');showLogin();return;}
        const d=snap.data();
        if(!d.approved){console.warn('[Auth] Not approved:',email);await signOut(auth);setErr('Account pending approval.');showLogin();return;}
        const role=d.role||'viewer';
        console.log('[Auth] Role:',role,'Dept:',d.dept||'none');
        let perms=[];console.log('[FS READ] config_roles/'+role);
        try{
        const rs = await getDoc(doc(db,'config_roles',role));perms=rs.exists()?(rs.data().permissions||[]):(DPERMS[role]||[]);}catch(_){perms=DPERMS[role]||[];}
        if(d.extraPermissions)perms=[...new Set([...perms,...d.extraPermissions])];
        if(d.revokedPermissions)perms=perms.filter(p=>!d.revokedPermissions.includes(p));
        const realName=accountNameFrom(d,user,email);
        window._fbUser=email;window._fbEmail=email;window.currentUserEmail=email;window._fbRole=role;window.currentUserRole=role;window._fbDept=d.dept||null;window.currentUserDept=d.dept||null;window._fbPerms=perms;window._fbName=realName;window.currentUserName=realName;window._fbAssignedKpis=d.assignedKpis||null;
        if(_normalizePortalRole(role)==='super_admin'){try{await _ensureOwnerRoleDefinitions();}catch(re){console.warn('[Roles] Owner role installation skipped:',re&&re.message||re);}}
        setUserDisplay(window._fbName,role);
        /* Shared audit: successful authentication + live audit sync for authorized viewers. */
        try{
          window._startAuditListener&&window._startAuditListener();
          await _flushPendingAudit();
          if(window.__qumcAuditLoginLoggedFor!==email){
            window.__qumcAuditLoginLoggedFor=email;
            await window._recordAuditDirect('LOGIN','Successful sign in');
          }
        }catch(ae){console.warn('[AUDIT] login event failed',ae&&ae.message||ae);}
        console.log('[Auth] All checks passed — showing portal');
        showPortal(window._fbName,role);
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
        if(!d) return;
        const _localQueue=_fsResolveQueue.splice(0); /* capture resolvers before async work */
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
        throw e;
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
        requestType: String(requestType||'General').trim(),
        message: String(message||'').trim(),
        status: 'pending',
        superAdminComment: '',
        createdAt: serverTimestamp(),
        respondedAt: null
      });
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
      await updateDoc(doc(db,'kpi_requests',requestId),{
        status: status,
        superAdminComment: String(comment||'').trim(),
        respondedAt: serverTimestamp()
      });
    };

    /* ══════════════════════════════════════════════════════
       grc_requests: GRC system / access requests
       Separate from Performance kpi_requests, Risk Register approvals,
       and Review & Development Center requests.
       ══════════════════════════════════════════════════════ */
    function _grcSystemRequestRole(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
    function _grcSystemRequestIsAdmin(){const r=_grcSystemRequestRole();return r==='admin'||r==='super_admin';}
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
        createdAt: serverTimestamp(),
        respondedAt: null
      });
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
      if(!_grcSystemRequestIsAdmin()) throw new Error('Access denied.');
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
      await updateDoc(doc(db,'grc_requests',requestId),{
        status:String(status||'pending'),
        adminComment:String(comment||'').trim(),
        respondedAt:serverTimestamp(),
        respondedBy:String(window._fbName||window._fbUser||'')
      });
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
    function _advRole(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');}
    function _advIsAdmin(){const r=_advRole();return r==='admin'||r==='super_admin';}
    function _advEmail(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
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
        status:_advStatusKey(r.status),workflowStage:String(r.workflowStage||r.status||'submitted'),closureReason:String(r.closureReason||''),createdAt:r.createdAt||r.createdAtIso||serverTimestamp(),updatedAt:r.updatedAt||r.updatedAtIso||serverTimestamp(),
        firstRespondedAt:r.firstRespondedAt||null,respondedAt:r.respondedAt||null,responseMinutes:r.responseMinutes==null?null:Number(r.responseMinutes),
        completedAt:r.completedAt||null,closedAt:r.closedAt||null,rating:r.rating==null?null:Number(r.rating),
        ratingAt:r.ratingAt||null,attachmentCount:Number(r.attachmentCount||0)
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
      const writes=[];
      for(let i=0;i<chunkCount;i++){
        const chunk=buffer.subarray(i*chunkSize,Math.min((i+1)*chunkSize,buffer.length));
        writes.push(setDoc(doc(db,'advisory_attachments',_advChunkDocId(requestId,attachmentId,i)),{
          requestId,attachmentId,index:i,data:_advBytesToBase64(chunk),createdAt:serverTimestamp(),uploadedBy:String(uploadedBy||_advEmail())
        },{merge:false}));
      }
      await Promise.all(writes);
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
    async function _advAuthorizedRequest(requestId,adminAllowed){
      const loc=await _advLocateRequest(requestId),r=loc.record;
      if(!(adminAllowed&&_advIsAdmin())&&String(r.userEmail||'').toLowerCase().trim()!==_advEmail())throw new Error('Access denied.');
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
      const year=new Date().getFullYear(),deptCode=_advSafeCode(payload.departmentCode),counterId=year+'_'+deptCode;
      const counterRef=doc(db,'advisory_counters',counterId),primaryRef=doc(collection(db,ADV_REQUESTS_COLLECTION));
      let code='',counterFallback=false;
      try{
        await runTransaction(db,async tx=>{const c=await tx.get(counterRef),next=Number(c.exists()&&c.data().next||0)+1;code='RD-'+deptCode+'-'+year+'-'+String(next).padStart(3,'0');tx.set(counterRef,{next,updatedAt:serverTimestamp()},{merge:true});});
      }catch(_){counterFallback=true;code='RD-'+deptCode+'-'+year+'-'+String(Date.now()).slice(-6)+Math.random().toString(36).slice(2,4).toUpperCase();}
      const base={
        userName:String(window._fbName||window.currentUserName||_advEmail().split('@')[0]||'User'),userEmail:_advEmail(),
        departmentKey:String(payload.departmentKey||window._fbDept||''),departmentCode:deptCode,gender:String(payload.gender||''),priority:String(payload.priority||'Medium'),
        platform:String(payload.platform||'grc'),serviceType:String(payload.serviceType||'record_request_review'),requestType:String(payload.requestType||''),requestTypeLabel:String(payload.requestTypeLabel||''),
        category:String(payload.category||''),relatedType:String(payload.relatedType||''),
        relatedItems:Array.isArray(payload.relatedItems)?payload.relatedItems.map(function(x){return {type:String(x&&x.type||''),id:String(x&&x.id||''),code:String(x&&x.code||''),name:String(x&&x.name||'')};}):[],
        relatedNewText:String(payload.relatedNewText||''),benchmarkType:String(payload.benchmarkType||''),formDependencies:payload.formDependencies&&typeof payload.formDependencies==='object'?payload.formDependencies:null,title:String(payload.title||''),details:String(payload.details||''),
        status:'open',workflowStage:'submitted',closureReason:'',messages:[],attachments:[],attachmentCount:0,firstRespondedAt:null,respondedAt:null,responseMinutes:null,completedAt:null,closedAt:null,rating:null,ratingAt:null,
        createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAtIso:_advIso(),updatedAtIso:_advIso(),updatedBy:_advEmail(),code,counterFallback
      };
      let requestId=primaryRef.id,storage='advisory_requests',warning='';
      try{
        await setDoc(primaryRef,base,{merge:false});
        try{await setDoc(doc(db,ADV_PUBLIC_COLLECTION,primaryRef.id),_advPublicShape(base),{merge:false});}catch(publicError){warning='The request was saved, but dashboard analytics could not be updated.';console.warn('[Review Development] public analytics write failed',publicError&&publicError.code||publicError);}
      }catch(primaryError){
        const fallback=Object.assign({},base,{requestDomain:'review_development',isReviewDevelopmentRequest:true,storageBackend:'kpi_requests',requestTypeLegacy:String(payload.requestTypeLabel||''),message:String(payload.details||''),superAdminComment:''});
        try{
          const fallbackRef=await addDoc(collection(db,ADV_FALLBACK_COLLECTION),fallback);requestId=fallbackRef.id;storage='kpi_requests';warning='';
        }catch(fallbackError){
          const e=fallbackError&&fallbackError.code?fallbackError:primaryError;throw e;
        }
      }
      if(file){
        if(storage==='advisory_requests'){
          try{const meta=await _advUploadFile(requestId,file,_advEmail());await updateDoc(doc(db,ADV_REQUESTS_COLLECTION,requestId),{attachments:arrayUnion(meta),attachmentCount:1,updatedAt:serverTimestamp()});try{await updateDoc(doc(db,ADV_PUBLIC_COLLECTION,requestId),{attachmentCount:1,updatedAt:serverTimestamp()});}catch(_){}}catch(fileError){warning=(warning?warning+' ':'')+'The request was submitted, but the attachment could not be uploaded.';console.warn('[Review Development] attachment upload failed',fileError&&fileError.code||fileError);}
        }else warning=(warning?warning+' ':'')+'The request was submitted without the attachment. Please contact the administrator if the attachment is required.';
      }
      return {id:requestId,code,storage,warning};
    };

    window._advisoryGetPublic=async function(){
      if(!_advEmail()||!db)return[];
      let primary=[];try{primary=await _advGetSorted(ADV_PUBLIC_COLLECTION);}catch(_){ }
      const fallback=await _advFallbackRows(!_advIsAdmin());
      if(!primary.length&&!_advIsAdmin()){
        try{const own=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where('userEmail','==',_advEmail())));primary=own.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests'));}catch(_){ }
      }
      return _advMergeRows(primary,fallback,true);
    };
    window._advisoryGetAll=async function(){if(!_advIsAdmin())throw new Error('Access denied.');let primary=[];try{primary=await _advGetSorted(ADV_REQUESTS_COLLECTION);}catch(_){ }return _advMergeRows(primary,await _advFallbackRows(false),false);};
    window._advisoryGetMine=async function(){
      if(!_advEmail()||!db)return[];let primary=[];
      try{const snap=await getDocs(query(collection(db,ADV_REQUESTS_COLLECTION),where('userEmail','==',_advEmail())));primary=snap.docs.map(d=>_advNormalizeRow(d.id,d.data(),'advisory_requests'));}catch(_){ }
      return _advMergeRows(primary,await _advFallbackRows(true),false);
    };
    window._advisoryGetOne=async function(requestId){return _advAuthorizedRequest(requestId,true);};
    window._advisorySubscribe=function(callback){
      if(typeof callback!=='function'||!_advEmail()||!db)return function(){};
      let closed=false,timer=null,unsubs=[];
      const signal=function(){if(closed)return;clearTimeout(timer);timer=setTimeout(function(){if(!closed)callback();},180);};
      const listen=function(qref){try{unsubs.push(onSnapshot(qref,signal,function(){/* The compatible listener may be unavailable under older rules. */}));}catch(_){ }};
      if(_advIsAdmin()){
        listen(collection(db,ADV_REQUESTS_COLLECTION));
        listen(collection(db,ADV_FALLBACK_COLLECTION));
      }else{
        listen(query(collection(db,ADV_REQUESTS_COLLECTION),where('userEmail','==',_advEmail())));
        listen(query(collection(db,ADV_FALLBACK_COLLECTION),where('userEmail','==',_advEmail())));
      }
      return function(){closed=true;clearTimeout(timer);unsubs.forEach(function(u){try{u();}catch(_){}});};
    };

    window._advisoryAdminAction=async function(requestId,action,data,file){
      if(!_advIsAdmin())throw new Error('Access denied.');
      data=data||{};const current=await _advAuthorizedRequest(requestId,true),requestRef=current._requestRef,publicRef=current._publicRef,nowIso=_advIso();
      const updates={updatedAt:serverTimestamp(),updatedAtIso:nowIso,updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file&&current._storage==='advisory_requests'){try{const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}catch(e){throw new Error('The response attachment could not be uploaded: '+String(e&&e.message||e));}}
      const firstResponseActions=['respond','request_info'];
      if(firstResponseActions.includes(action)&&!current.firstRespondedAt){const created=_advTsMs(current.createdAt)||Date.now(),mins=Math.max(0,Math.round((Date.now()-created)/60000));updates.firstRespondedAt=serverTimestamp();updates.responseMinutes=mins;publicUpdates.firstRespondedAt=serverTimestamp();publicUpdates.responseMinutes=mins;}
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
      await updateDoc(requestRef,updates);if(publicRef){try{await updateDoc(publicRef,publicUpdates);}catch(_){}}return true;
    };

    window._advisoryRequesterAction=async function(requestId,action,data,file){
      data=data||{};const current=await _advAuthorizedRequest(requestId,false),requestRef=current._requestRef,publicRef=current._publicRef,updates={updatedAt:serverTimestamp(),updatedAtIso:_advIso(),updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file&&current._storage==='advisory_requests'){const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}
      if(action==='clarify'){
        var stage=String(current.workflowStage||current.status||'');if(stage!=='awaiting_requester_information')throw new Error('This request is not waiting for clarification.');const text=String(data.text||'').trim();if(!text)throw new Error('Clarification is required.');updates.status='in_progress';updates.workflowStage='clarification_received';publicUpdates.status='in_progress';publicUpdates.workflowStage='clarification_received';updates.messages=arrayUnion({id:'msg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),senderRole:_advRole(),senderName:String(window._fbName||'Requester'),senderEmail:_advEmail(),text,attachments:messageAttachments,createdAt:_advIso()});
      }else if(action==='complete'){var currentStage=String(current.workflowStage||current.status||'');if(currentStage!=='responded')throw new Error('The request must have an admin response first.');updates.status='in_progress';updates.workflowStage='requester_confirmed';updates.completedAt=serverTimestamp();publicUpdates.status='in_progress';publicUpdates.workflowStage='requester_confirmed';publicUpdates.completedAt=serverTimestamp();}
      else if(action==='cancel'){if(_advStatusKey(current.status)==='closed')throw new Error('This request can no longer be cancelled.');updates.status='closed';updates.workflowStage='closed';updates.closureReason='cancelled_by_requester';updates.closedAt=serverTimestamp();publicUpdates.status='closed';publicUpdates.workflowStage='closed';publicUpdates.closureReason='cancelled_by_requester';publicUpdates.closedAt=serverTimestamp();}
      else throw new Error('Unsupported action.');
      await updateDoc(requestRef,updates);if(publicRef){try{await updateDoc(publicRef,publicUpdates);}catch(_){}}return true;
    };

    window._advisoryRate=async function(requestId,rating){
      const current=await _advAuthorizedRequest(requestId,false),n=Math.max(1,Math.min(5,Number(rating||0)));if(_advStatusKey(current.status)!=='closed')throw new Error('Only closed requests can be rated.');if(Number(current.rating))throw new Error('This request has already been rated.');
      const updates={rating:n,ratingAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:_advIso(),updatedBy:_advEmail()};await updateDoc(current._requestRef,updates);if(current._publicRef){try{await updateDoc(current._publicRef,{rating:n,ratingAt:serverTimestamp(),updatedAt:serverTimestamp()});}catch(_){}}return true;
    };

    window._advisoryDownloadAttachment=async function(requestId,attachmentId,mimeType,chunkCount){
      const current=await _advAuthorizedRequest(requestId,true);if(current._storage!=='advisory_requests')throw new Error('No stored attachment is available for this request.');const chunks=[];
      for(let i=0;i<Number(chunkCount||0);i++){const snap=await getDoc(doc(db,'advisory_attachments',_advChunkDocId(requestId,attachmentId,i)));if(!snap.exists())throw new Error('Attachment chunk is missing.');chunks.push(_advBase64ToBytes(String(snap.data().data||'')));}
      const total=chunks.reduce((n,x)=>n+x.length,0),out=new Uint8Array(total);let offset=0;chunks.forEach(x=>{out.set(x,offset);offset+=x.length;});return new Blob([out],{type:String(mimeType||'application/octet-stream')});
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
    const GRC_REGISTER_SCHEMA_VERSION=2;
    function _grcRegisterHash(text){let h=2166136261,s=String(text||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
    function _grcRegisterSafeId(value){const out=String(value||'').trim().replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');return(out||'record').slice(0,86);}
    function _grcRegisterCloudId(recordType,record){record=record||{};const existing=String(record._cloudId||record.cloudId||'').trim();if(existing)return _grcRegisterSafeId(existing);const key=recordType==='incident'?'incidents':'risks',identity=String(record.id||record.code||record.riskId||'record');return _grcRegisterSafeId(identity)+'_'+_grcRegisterHash(key+'|'+identity);}
    function _grcRegisterCloudRecord(recordType,record,department,cloudId){const out=_grcRiskJson(record||{}),key=recordType==='incident'?'incidents':'risks',dept=_grcCanonicalDepartment(department||out.department);out._cloudId=cloudId;out.cloudId=cloudId;out.department=dept;out.visibility='department';out.recordType=key;out.schemaVersion=GRC_REGISTER_SCHEMA_VERSION;out.updatedByEmail=_grcRiskEmail();out.cloudUpdatedAt=serverTimestamp();if(!out.createdByEmail)out.createdByEmail=String(out.createdBy||_grcRiskEmail());return out;}
    let _grcRiskRequestUnsub=null;

    function _grcRiskRole(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/^superadmin$/,'super_admin');}
    function _grcRiskEmail(){return String(window._fbUser||window.currentUserEmail||auth.currentUser&&auth.currentUser.email||'').toLowerCase().trim();}
    function _grcCanonicalDepartment(value){
      const raw=String(value||'').trim(),n=raw.toLowerCase().replace(/&/g,' and ').replace(/[\s_\/-]+/g,' ');
      if(!n)return'';
      if(n.includes('laundry'))return'laundry';
      if(n.includes('housekeeping')||n.includes('cleaning'))return'housekeeping';
      if(n.includes('maintenance'))return'maintenance';
      if(n.includes('safety'))return'safety';
      if(n.includes('project'))return'projects';
      if(n.includes('governance')||n.includes('performance'))return'governance';
      if(n==='fms'||n.includes('facility management')||n.includes('facilities management')||n.includes('division'))return'division';
      return n.replace(/\s+/g,'_');
    }
    function _grcRiskDept(){return _grcCanonicalDepartment(window._fbDept||window.currentUserDept||'');}
    window._grcCanonicalDepartment=window._grcCanonicalDepartment||_grcCanonicalDepartment;
    function _grcRiskPerms(){return Array.isArray(window._fbPerms)?window._fbPerms:[];}
    function _grcRiskCanSubmit(recordType){recordType=String(recordType||'risk').toLowerCase();const p=_grcRiskPerms(),owner=['risk_owner','platform_owner'].includes(_grcRiskRole());if(recordType==='incident')return owner||p.includes('edit_incident_register')||p.includes('edit_risk_management')||p.includes('*');return owner||p.includes('edit_risk_management')||p.includes('*');}
    function _grcRiskIsManager(){return _grcRiskRole()==='department_manager'||_grcRiskRole()==='dept_manager';}
    function _grcRiskIsSuper(){return _grcRiskRole()==='super_admin';}
    function _grcRiskIsAdmin(){return _grcRiskRole()==='admin'||_grcRiskIsSuper();}
    window._grcRiskDirectStatusUpdate=async function(record,nextStatus){
      if(!['risk_owner','platform_owner'].includes(_grcRiskRole()))throw new Error('Only the Risk Owner can use direct risk status updates.');
      record=record||{};nextStatus=String(nextStatus||'').toLowerCase();
      if(!['open','closed'].includes(nextStatus))throw new Error('Only Open or Closed can be changed directly.');
      const department=_grcCanonicalDepartment(record.department||_grcRiskDept());
      if(!department||department!==_grcRiskDept())throw new Error('You can update risk status only for your department.');
      const cloudId=_grcRegisterCloudId('risk',record),ref=doc(db,GRC_REGISTER_COLLECTIONS.risk,cloudId);
      await updateDoc(ref,{actionStatus:nextStatus,updatedAt:_grcRiskIso(),updatedBy:String(window._fbName||window.currentUserName||_grcRiskEmail()),updatedByEmail:_grcRiskEmail(),cloudUpdatedAt:serverTimestamp()});
      return true;
    };
    function _grcRiskJson(v){try{return JSON.parse(JSON.stringify(v==null?null:v));}catch(_){return null;}}
    function _grcRiskIso(){return new Date().toISOString();}
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
      const requestedKey=_grcRiskKey(requested);if(requestedKey&&!records.some(r=>_grcRiskRecordKey(r)===requestedKey))return String(requested).trim();
      const dept=String(department||'').toLowerCase();
      if(recordType==='incident'){
        const deptCode=_grcRiskDeptCode(dept),year=new Date().getFullYear(),prefix='INC-'+deptCode+'-'+year+'-';let max=0;
        records.forEach(r=>{const raw=String(r&&r.id||r&&r.code||'').toUpperCase(),m=raw.match(/(\d+)$/);if(m)max=Math.max(max,Number(m[1])||0);});
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
        const assigned=_grcRegisterNextId(records,request.department,proposed.id||proposed.code,recordType);proposed.id=assigned;proposed.code=proposed.code&&_grcRiskKey(proposed.code)!==_grcRiskKey(request.proposedRecord&&request.proposedRecord.id)?proposed.code:assigned;
        proposed.department=recordType==='risk'&&request.department==='laundry'?'housekeeping':request.department;proposed.createdAt=proposed.createdAt||_grcRiskIso();proposed.createdBy=proposed.createdBy||request.submittedByName||request.submittedByEmail;proposed.updatedAt=_grcRiskIso();proposed.updatedBy=_grcRiskEmail();records.push(proposed);return{records,record:proposed};
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
      if(!_grcRiskEmail()||!db)throw new Error('not authenticated');payload=payload||{};const recordType=String(payload.recordType||'risk').toLowerCase();if(!['risk','incident'].includes(recordType)||!_grcRiskCanSubmit(recordType))throw new Error('Access denied.');
      operation=String(operation||'').toLowerCase();if(!['add','update','delete'].includes(operation))throw new Error('Invalid operation.');
      const department=_grcCanonicalDepartment(payload.department||payload.proposedRecord&&payload.proposedRecord.department||payload.currentRecord&&payload.currentRecord.department||_grcRiskDept());
      const userDepartment=_grcRiskDept();
      if(!department||(userDepartment&&department!==userDepartment))throw new Error('You can submit requests for your assigned department only.');
      const current=_grcRiskJson(payload.currentRecord),proposed=_grcRiskJson(payload.proposedRecord),year=new Date().getFullYear(),deptCode=_grcRiskDeptCode(department),kindCode=recordType==='incident'?'INC':'RSK',counterRef=doc(db,GRC_RISK_COUNTERS_COLLECTION,kindCode+'_'+deptCode+'_'+year),requestRef=doc(collection(db,GRC_RISK_REQUESTS_COLLECTION)),nowIso=_grcRiskIso();
      await runTransaction(db,async tx=>{
        const cs=await tx.get(counterRef),next=Number(cs.exists()&&cs.data().next||0)+1,requestCode=kindCode+'-REQ-'+deptCode+'-'+year+'-'+String(next).padStart(3,'0');
        tx.set(counterRef,{next,recordType,updatedAt:serverTimestamp(),updatedBy:_grcRiskEmail()},{merge:true});
        tx.set(requestRef,{requestCode,recordType,operation,department,targetRiskId:String(payload.targetRiskId||payload.targetRecordId||current&&current.id||current&&current.code||proposed&&proposed.id||''),targetRecordId:String(payload.targetRecordId||payload.targetRiskId||current&&current.id||current&&current.code||proposed&&proposed.id||''),currentRecord:current,proposedRecord:proposed,changedFields:_grcRiskChangedFields(current,proposed),deleteReason:String(payload.deleteReason||''),requesterNote:String(payload.note||''),status:'pending_manager',submittedByName:String(window._fbName||window.currentUserName||_grcRiskEmail().split('@')[0]),submittedByEmail:_grcRiskEmail(),submittedByRole:_grcRiskRole(),managerName:'',managerEmail:'',managerNote:'',superAdminName:'',superAdminEmail:'',superAdminNote:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAtIso:nowIso,updatedAtIso:nowIso,history:[{status:'pending_manager',by:_grcRiskEmail(),role:_grcRiskRole(),at:nowIso,note:String(payload.note||'')} ]});
      });
      try{window._recordAuditDirect&&window._recordAuditDirect('GRC_REGISTER_REQUEST_SUBMIT',operation.toUpperCase()+' '+recordType+' request submitted',current,proposed,{portal:'grc',dept:department,recordType});}catch(_){}
      return{requestId:requestRef.id};
    };
    window._grcRiskRequestResubmit=async function(requestId,proposedRecord,note){
      if(!_grcRiskCanSubmit('risk')&&!_grcRiskCanSubmit('incident'))throw new Error('Access denied.');const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(String(r.submittedByEmail||'').toLowerCase()!==_grcRiskEmail())throw new Error('Access denied.');if(!['returned_requester','rejected_manager','rejected_super_admin'].includes(String(r.status||'')))throw new Error('This request cannot be resubmitted.');
      const proposed=_grcRiskJson(proposedRecord||r.proposedRecord),now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status:'pending_manager',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'Resubmitted')});
      await updateDoc(ref,{proposedRecord:proposed,changedFields:_grcRiskChangedFields(r.currentRecord,proposed),status:'pending_manager',requesterNote:String(note||r.requesterNote||''),managerNote:'',superAdminNote:'',updatedAt:serverTimestamp(),updatedAtIso:now,history});return true;
    };
    window._grcRiskRequestCancel=async function(requestId){
      const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(String(r.submittedByEmail||'').toLowerCase()!==_grcRiskEmail())throw new Error('Access denied.');if(!['pending_manager','returned_requester'].includes(String(r.status||'')))throw new Error('This request can no longer be cancelled.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status:'cancelled',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:'Cancelled by requester'});await updateDoc(ref,{status:'cancelled',updatedAt:serverTimestamp(),updatedAtIso:now,history});return true;
    };
    window._grcRiskRequestManagerAction=async function(requestId,action,note){
      if(!_grcRiskIsManager())throw new Error('Department Manager approval is required.');const ref=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId),snap=await getDoc(ref);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(_grcCanonicalDepartment(r.department)!==_grcRiskDept())throw new Error('This request belongs to another department.');if(!['pending_manager','returned_manager'].includes(String(r.status||'')))throw new Error('This request is not awaiting your approval.');
      const status=action==='approve'?'pending_super_admin':action==='return'?'returned_requester':action==='reject'?'rejected_manager':'';if(!status)throw new Error('Invalid action.');if(action!=='approve'&&!String(note||'').trim())throw new Error('A reason is required.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status,by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});
      await updateDoc(ref,{status,managerName:String(window._fbName||''),managerEmail:_grcRiskEmail(),managerNote:String(note||''),managerActionAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:now,history});return true;
    };
    window._grcRiskRequestSuperAction=async function(requestId,action,note){
      if(!_grcRiskIsSuper())throw new Error('Super Admin approval is required.');const requestRef=doc(db,GRC_RISK_REQUESTS_COLLECTION,requestId);if(action==='approve'){
        let published=null,recordType='risk';await runTransaction(db,async tx=>{
          const rs=await tx.get(requestRef);if(!rs.exists())throw new Error('Request not found.');const request=Object.assign({id:rs.id,recordType:'risk'},rs.data());if(String(request.status||'')!=='pending_super_admin')throw new Error('This request is not awaiting final approval.');
          recordType=String(request.recordType||'risk').toLowerCase()==='incident'?'incident':'risk';const operation=String(request.operation||'').toLowerCase(),current=_grcRiskJson(request.currentRecord||{}),proposed=_grcRiskJson(request.proposedRecord||{}),cloudId=_grcRegisterCloudId(recordType,operation==='add'?proposed:current),recordRef=doc(db,GRC_REGISTER_COLLECTIONS[recordType],cloudId),existing=await tx.get(recordRef),now=_grcRiskIso();
          if(operation==='add'){if(existing.exists())throw new Error((recordType==='incident'?'Incident':'Risk')+' record already exists.');published=_grcRegisterCloudRecord(recordType,proposed,request.department,cloudId);published.createdAt=published.createdAt||now;published.createdBy=published.createdBy||request.submittedByName||request.submittedByEmail;tx.set(recordRef,published,{merge:false});}
          else if(operation==='update'){if(!existing.exists())throw new Error((recordType==='incident'?'Incident':'Risk')+' record no longer exists.');const old=existing.data()||{};published=_grcRegisterCloudRecord(recordType,Object.assign({},old,proposed,{id:old.id||proposed.id,code:old.code||proposed.code,createdAt:old.createdAt||proposed.createdAt,createdBy:old.createdBy||proposed.createdBy,updatedAt:now,updatedBy:_grcRiskEmail()}),request.department,cloudId);tx.set(recordRef,published,{merge:false});}
          else if(operation==='delete'){if(!existing.exists())throw new Error((recordType==='incident'?'Incident':'Risk')+' record no longer exists.');published=Object.assign({_cloudId:cloudId,cloudId:cloudId},existing.data()||{});tx.delete(recordRef);}
          else throw new Error('Unsupported '+recordType+' request operation.');
          const history=Array.isArray(request.history)?request.history.slice():[];history.push({status:'published',by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});tx.set(requestRef,{status:'published',recordType,superAdminName:String(window._fbName||''),superAdminEmail:_grcRiskEmail(),superAdminNote:String(note||''),finalRecord:published,publishedRiskId:recordType==='risk'?String(published&&published.id||''):'',publishedRecordId:String(published&&published.id||''),approvedAt:serverTimestamp(),publishedAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedAtIso:now,history},{merge:true});
        });try{window._recordAuditDirect&&window._recordAuditDirect('GRC_REGISTER_REQUEST_PUBLISH',recordType+' request approved and published',null,published,{portal:'grc',recordType});}catch(_){}return published;
      }
      const snap=await getDoc(requestRef);if(!snap.exists())throw new Error('Request not found.');const r=snap.data();if(String(r.status||'')!=='pending_super_admin')throw new Error('This request is not awaiting final approval.');const status=action==='return'?'returned_manager':action==='reject'?'rejected_super_admin':'';if(!status)throw new Error('Invalid action.');if(!String(note||'').trim())throw new Error('A reason is required.');const now=_grcRiskIso(),history=Array.isArray(r.history)?r.history.slice():[];history.push({status,by:_grcRiskEmail(),role:_grcRiskRole(),at:now,note:String(note||'')});await updateDoc(requestRef,{status,superAdminName:String(window._fbName||''),superAdminEmail:_grcRiskEmail(),superAdminNote:String(note||''),updatedAt:serverTimestamp(),updatedAtIso:now,history});return true;
    };
    async function _grcRiskRead(queryRef){const snap=await getDocs(queryRef),rows=[];snap.forEach(d=>rows.push(_grcRiskRequestData(d)));return _grcRiskSort(rows);}
    window._grcRiskRequestsGetMine=async function(){if(!_grcRiskEmail())return[];return _grcRiskRead(query(collection(db,GRC_RISK_REQUESTS_COLLECTION),where('submittedByEmail','==',_grcRiskEmail())));};
    window._grcRiskRequestsGetForManager=async function(){if(!_grcRiskIsManager())return[];return _grcRiskRead(query(collection(db,GRC_RISK_REQUESTS_COLLECTION),where('department','==',_grcRiskDept())));};
    window._grcRiskRequestsGetAll=async function(){if(!_grcRiskIsAdmin())throw new Error('Access denied.');return _grcRiskRead(collection(db,GRC_RISK_REQUESTS_COLLECTION));};
    window._grcRiskRequestsSubscribe=function(callback){
      if(_grcRiskRequestUnsub){_grcRiskRequestUnsub();_grcRiskRequestUnsub=null;}if(!_grcRiskEmail()||!db)return function(){};let qref;
      if(_grcRiskIsAdmin())qref=collection(db,GRC_RISK_REQUESTS_COLLECTION);else if(_grcRiskIsManager())qref=query(collection(db,GRC_RISK_REQUESTS_COLLECTION),where('department','==',_grcRiskDept()));else qref=query(collection(db,GRC_RISK_REQUESTS_COLLECTION),where('submittedByEmail','==',_grcRiskEmail()));
      _grcRiskRequestUnsub=onSnapshot(qref,snap=>{const rows=[];snap.forEach(d=>rows.push(_grcRiskRequestData(d)));callback(_grcRiskSort(rows));},err=>{console.warn('[GRC Risk Requests] listener failed',err);callback([],err);});return _grcRiskRequestUnsub;
    };
    window._grcRiskRequestsStop=function(){if(_grcRiskRequestUnsub){_grcRiskRequestUnsub();_grcRiskRequestUnsub=null;}};

    window._kpiRequestsClearAllForLaunch=async function(){
      if(!window._fbUser||!db) throw new Error('not authenticated');
      const role=String(window._fbRole||'').toLowerCase().replace(/[\s-]+/g,'_');
      if(role!=='super_admin'&&role!=='admin') throw new Error('access denied');
      const snap=await getDocs(collection(db,'kpi_requests'));
      await Promise.all(snap.docs.map(function(d){return deleteDoc(doc(db,'kpi_requests',d.id));}));
      return snap.docs.length;
    };

    /* ══════════════════════════════════════════════════════
       READ-ONLY onSnapshot: receives changes from other users.
       RULE: Never writes to Firestore from this listener.
       ══════════════════════════════════════════════════════ */
    let _fsListenerUnsub = null;
    window._startReadListener = function(){
      if(_fsListenerUnsub || !db || !window._fbUser) return;
      _fsListenerUnsub = onSnapshot(
        doc(db,'kpi_dashboard','state'),
        function(snap){
          if(!snap.exists()) return;
          const fsData = snap.data();
          if(!fsData) return;
          /* Echo suppression: ignore our own writes for 2 seconds */
          const msSince = Date.now() - (window._lastCloudSaveTime||0);
          if(msSince < 2000){
            console.log('[FS READ] onSnapshot: own echo suppressed ('+Math.round(msSince)+'ms)');
            return;
          }
          console.log('[FS READ] onSnapshot: remote change — merging + updating UI');
          /* MERGE into ST — localStorage only, ZERO Firestore write */
          /* Fields where REMOTE is authoritative (no local writes during normal use) */
          const safe=['gaps','actions','pci','codeOv','pciConfig','requests']; /* F5: textEdits removed — handled separately below with LOCAL WINS */
          let changed=false;
          /* Simple replace: local has no business modifying these */
          safe.forEach(function(f){
            if(fsData[f]!==undefined){
              try{ if(JSON.stringify(ST[f])!==JSON.stringify(fsData[f])){ST[f]=fsData[f];changed=true;} }
              catch(_){ST[f]=fsData[f];changed=true;}
            }
          });


          /* F5: textEdits — LOCAL WINS (same pattern as ov).
             Remote provides entries we don't have locally.
             Local entries survive any incoming snapshot. */
          if(fsData.textEdits!==undefined){
            const teMerged=Object.assign({}, fsData.textEdits||{}, ST.textEdits||{});
            try{
              if(JSON.stringify(ST.textEdits)!==JSON.stringify(teMerged)){
                ST.textEdits=teMerged; changed=true;
              }
            }catch(_){ ST.textEdits=teMerged; changed=true; }
          }

          /* `ov` — KPI overrides written by Edit KPI.
             LOCAL WINS: user's in-flight edit must survive an incoming snapshot.
             Merge: remote provides entries we don't have; local entries override remote. */
          if(fsData.ov!==undefined){
            const merged=Object.assign({}, fsData.ov||{}, ST.ov||{});
            try{ if(JSON.stringify(ST.ov)!==JSON.stringify(merged)){ST.ov=merged;changed=true;} }
            catch(_){ST.ov=merged;changed=true;}
          }

          /* `rptEdits` — report text edits written by rptDoneEdit.
             LOCAL WINS: same reason — in-flight edit must survive snapshot. */
          if(fsData.rptEdits!==undefined){
            const merged=Object.assign({}, fsData.rptEdits||{}, ST.rptEdits||{});
            try{ if(JSON.stringify(ST.rptEdits)!==JSON.stringify(merged)){ST.rptEdits=merged;changed=true;} }
            catch(_){ST.rptEdits=merged;changed=true;}
          }

          /* `deleted` — UNION (not intersection).
             ANY entry deleted in EITHER local OR remote stays deleted.
             This ensures a fresh local delete (not yet in Firestore) survives the snapshot.
             The reconcile pass below then handles "added wins over deleted". */
          if(fsData.deleted!==undefined){
            var localDel=Array.isArray(ST.deleted)?ST.deleted:[];
            var remoteDel=Array.isArray(fsData.deleted)?fsData.deleted:[];
            var seen=new Set(); var union=[];
            localDel.concat(remoteDel).forEach(function(id){
              var u=String(id||'').toUpperCase();
              if(u && !seen.has(u)){seen.add(u);union.push(id);}
            });
            try{ if(JSON.stringify(ST.deleted)!==JSON.stringify(union)){ST.deleted=union;changed=true;} }
            catch(_){ST.deleted=union;changed=true;}
          }

          /* `added` — UNION merge by id (local-only adds survive remote snapshots) */
          if(fsData.added!==undefined){
            var localAdded=Array.isArray(ST.added)?ST.added:[];
            var remoteAdded=Array.isArray(fsData.added)?fsData.added:[];
            var mergedMap={};
            remoteAdded.forEach(function(k){if(k&&k.id)mergedMap[String(k.id).toUpperCase()]=k;});
            localAdded.forEach(function(k){if(k&&k.id&&!mergedMap[String(k.id).toUpperCase()])mergedMap[String(k.id).toUpperCase()]=k;});
            var merged=Object.values(mergedMap);
            try{ if(JSON.stringify(ST.added)!==JSON.stringify(merged)){ST.added=merged;changed=true;} }
            catch(_){ST.added=merged;changed=true;}
          }

          /* Reconcile: if a KPI in ST.added is also in ST.deleted, remove it from deleted.
             "Added wins over deleted." Save corrected state once (rate-limited, no loop). */
          if(typeof _reconcileDeletedVsAdded==='function'){
            var reconciled=_reconcileDeletedVsAdded(ST);
            if(reconciled){
              changed=true;
              sLS(ST);
              if(typeof window._saveToFS==='function' && window._fbUser &&
                 (Date.now()-(window._lastReconcileSave||0)) > 5000){
                window._lastReconcileSave=Date.now();
                window._saveToFS(ST).catch(function(e){console.warn('[reconcile] onSnapshot save:',e.message);});
              }
            }
          }
          if(!changed){ return; }
          /* Save to localStorage (NO Firestore!) */
          try{ localStorage.setItem('kpi_v3',JSON.stringify({...ST,_v:3})); }catch(_){}
          /* Update UI — stay on current page */
          const savedPage = window.curPage || 'exec';
          try{ if(typeof renderYearFilter==='function') renderYearFilter(); }catch(_){}
          try{ if(typeof renderCurrent==='function') renderCurrent(); }catch(_){}
          window.curPage = savedPage;
          /* Restore tab highlight */
          document.querySelectorAll('.tabnav .tab').forEach(function(t){
            t.classList.toggle('on',(t.getAttribute('onclick')||'').indexOf("'"+savedPage+"'")>=0);
          });
        },
        function(err){ console.warn('[FS READ] listener error:',err.code||err.message); }
      );
      console.log('[FS] Read-only listener active — NEVER writes back to Firestore');
    };
    window._stopReadListener = function(){
      if(_fsListenerUnsub){ _fsListenerUnsub(); _fsListenerUnsub=null; console.log('[FS] Listener stopped'); }
    };

    window._loadFromFS = async () => {
      if(!db) return null;
      try {
        console.log('[FS READ] kpi_dashboard/state'+(_auditCanView()?' + audit':''));
        const stateSnap = await getDoc(doc(db,'kpi_dashboard','state'));
        const state  = stateSnap.exists()  ? stateSnap.data()  : {};
        const {_by, _at, ...clean} = state;
        if(_auditCanView()){
          const auditSnap=await getDoc(AUDIT_DOC_REF);
          const audit=auditSnap.exists()?auditSnap.data():{};
          return {...clean, audit:_auditSort(audit.log||[]).slice(0,AUDIT_MAX_RECORDS)};
        }
        return clean;
      } catch(e){ console.warn('[FS] Load error:',e.code||e.message); return null; }
    };

    /* Hook into onAuthStateChanged success to load FS data */
    const _origSelectPortal = window._selectPortal;
    window._onFSLoaded = async () => {
      try{
        const fsData = await window._loadFromFS();
        if(!fsData||Object.keys(fsData).length===0) return;
        console.log('[FS] Loaded state from Firestore, keys:',Object.keys(fsData));
        if(typeof ST==='undefined') return;
        /* Safe merge: only merge non-destructive fields */
        const safeFields=['added','gaps','actions','rptEdits','audit','deleted','pci','codeOv']; /* F7: ov handled separately below with LOCAL WINS */
        safeFields.forEach(f=>{
          if(fsData[f]!==undefined) ST[f]=fsData[f];
        });


        /* F7: ov — LOCAL WINS (same pattern as onSnapshot).
           Firestore provides entries we don't have; local entries survive. */
        if(fsData.ov!==undefined){
          ST.ov=Object.assign({}, fsData.ov||{}, ST.ov||{});
        }

        /* F6: Load textEdits from Firestore with LOCAL WINS.
           If Firestore has edits we don't have locally, bring them in.
           Local entries (from localStorage) take priority. */
        if(fsData.textEdits!==undefined){
          ST.textEdits=Object.assign({}, fsData.textEdits||{}, ST.textEdits||{});
        }

        /* Reconcile: added KPIs must never be in deleted list.
           If ST.deleted contains any id from ST.added, remove it.
           Save the corrected state to Firestore once (no loop). */
        if(typeof _reconcileDeletedVsAdded==='function' && _reconcileDeletedVsAdded(ST)){
          sLS(ST);
          if(typeof window._saveToFS==='function' && window._fbUser){
            window._saveToFS(ST)
              .then(function(){console.log('[reconcile] ST.deleted corrected and saved to Firestore');})
              .catch(function(e){console.warn('[reconcile] save failed:',e.message);});
          }
        }        /* Clean nulls from ov (same protection as _loadST) */
        if(ST.ov){
          Object.keys(ST.ov).forEach(kId=>{
            if(!ST.ov[kId])return;
            ['q1','q2','q3','q4'].forEach(q=>{
              if(ST.ov[kId][q]===null||ST.ov[kId][q]===undefined)delete ST.ov[kId][q];
            });
            if(Object.keys(ST.ov[kId]).length===0)delete ST.ov[kId];
          });
        }
        try{localStorage.setItem('kpi_v3',JSON.stringify(ST));}catch(_){}
        if(typeof renderYearFilter==='function') renderYearFilter(); /* update year filters with loaded data */
        if(typeof renderCurrent==='function') renderCurrent();
        if(typeof updateBadge==='function') updateBadge();
        /* Update notification badge for all roles after Firestore data loads */
        if(typeof window.updateAlertUI==='function') window.updateAlertUI();
        else if(typeof window.renderNotifications==='function') window.renderNotifications(false);
      }catch(e){ console.warn('[FS] onFSLoaded error:',e); }
    };

    console.log('[Auth] Firebase module initialized');