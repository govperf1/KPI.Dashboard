import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,fetchSignInMethodsForEmail,setPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    import { getFirestore,doc,getDoc,setDoc,addDoc,collection,serverTimestamp,onSnapshot,updateDoc,arrayUnion,query,where,orderBy,getDocs,deleteDoc,runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const firebaseConfig={apiKey:"AIzaSyAlLWZvsu4UbHn-LncFdrSHlbL3bIAG4no",authDomain:"qumc-kpi-dashboard-f10dd.firebaseapp.com",projectId:"qumc-kpi-dashboard-f10dd",storageBucket:"qumc-kpi-dashboard-f10dd.firebasestorage.app",messagingSenderId:"659971973475",appId:"1:659971973475:web:483116a0711008a6a97356"};
    const DPERMS={super_admin:['*'],admin:['manage_users','view_all_departments','view_department','edit_kpi','edit_gap_analysis','edit_actions','edit_targets','approve_changes','lock_quarter','unlock_quarter','view_executive_intelligence','export_reports','manage_dashboard_settings','view_audit_trail'],executive:['view_all_departments','view_department','view_executive_intelligence','export_reports'],department_manager:['view_department','view_executive_intelligence','export_reports'],kpi_owner:['view_department','edit_gap_analysis','export_reports'],viewer:['view_all_departments','view_department','export_reports']};

    const app=initializeApp(firebaseConfig);
    const auth=getAuth(app);
    const db=getFirestore(app);


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
    const showLogin=()=>{console.log('[Auth] showLogin');/* Show overlay (already visible, but ensure it is) */const ao=ge('_authOverlay');if(ao){ao.style.display='flex';ao.style.alignItems='flex-end';ao.style.background='rgba(245,247,252,0)'}/* Hide loading spinner, show login form */const ld=ge('_authLoading');if(ld)ld.style.display='none';const lp=ge('_loginPanel');if(lp)lp.style.display='block';const po=ge('_portalOverlay');if(po)po.style.display='none';const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}};
    const showPortal=(name,role)=>{console.log('[Auth] showPortal:',name,role);const po=ge('_portalOverlay'),lo=ge('_authOverlay');if(lo)lo.style.display='none';if(po){po.style.display='flex';console.log('[Auth] _portalOverlay is now flex');}else{console.error('[Auth] PORTAL OVERLAY NOT FOUND');return;}const nm=ge('_portalUserName'),rl=ge('_portalUserRole');const realName=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';if(nm)nm.textContent=realName;if(rl){const L={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',viewer:'Viewer'};rl.textContent=L[role]||role;}console.log('[Auth] Portal ready');};
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
      console.log('[Auth] Selected:',portal);
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
          if(window._fbRole==='kpi_owner' && typeof window.showKpoGapStatusPopup==='function'){
            setTimeout(()=>{try{window.showKpoGapStatusPopup();}catch(e){console.warn('[KPO]',e);}},700);
          }
        }
        /* Start read-only Firestore listener for cross-user updates */
        if(typeof window._startReadListener==='function') setTimeout(window._startReadListener, 800);
        console.log('[Auth] ✓ Performance portal entered');
      }else{
        /* GRC is not active yet. Show a clean portal-level modal ABOVE the portal overlay.
           Previous z-index was lower than #_portalOverlay, so the portal cards appeared on top of
           the coming-soon screen and the Back button overlapped the cards. */
        const old=document.getElementById('_grcComingSoon');
        if(old) old.remove();
        const cs=document.createElement('div');
        cs.id='_grcComingSoon';
        cs.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(5,15,35,.68);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit;pointer-events:all';
        cs.innerHTML='\
          <div style="width:min(420px,88vw);background:rgba(15,35,65,.92);border:1px solid rgba(255,255,255,.20);border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.45);padding:30px 28px;text-align:center;color:#fff">\
            <div style="width:64px;height:64px;border-radius:20px;background:rgba(1,149,175,.18);border:1px solid rgba(1,149,175,.28);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">\
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0195af" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="18" width="18" height="3" rx="1"></rect><rect x="3" y="3" width="18" height="3" rx="1"></rect><rect x="5" y="6" width="2" height="12"></rect><rect x="11" y="6" width="2" height="12"></rect><rect x="17" y="6" width="2" height="12"></rect></svg>\
            </div>\
            <div style="font-size:24px;font-weight:900;margin-bottom:6px">GRC</div>\
            <div style="font-size:13px;color:rgba(255,255,255,.62);font-weight:700;margin-bottom:10px">Governance · Risk Management & Compliance</div>\
            <div style="display:inline-flex;align-items:center;justify-content:center;padding:7px 18px;background:rgba(1,149,175,.15);border:1px solid rgba(1,149,175,.32);border-radius:999px;font-size:11px;color:#21bfd9;font-weight:900;letter-spacing:.04em;margin-bottom:18px">COMING SOON</div>\
            <div style="font-size:11px;color:rgba(255,255,255,.45);line-height:1.7;margin-bottom:20px">This module is currently under development and will be enabled when ready.</div>\
            <button id="_grcBackBtn" type="button" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 24px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">← Back</button>\
          </div>';
        document.body.appendChild(cs);
        cs.addEventListener('click',e=>{if(e.target===cs)cs.remove();});
        const bb=document.getElementById('_grcBackBtn');
        if(bb)bb.onclick=()=>cs.remove();
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
        return snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
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
        const rows=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
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
       advisory_requests: Performance + GRC Advisory Center
       - Full records: advisory_requests (requester + Admin/SA)
       - Sanitized analytics: advisory_public (all authenticated users)
       - File chunks: advisory_attachments
       Statuses are action-driven; no free manual status selector.
       ══════════════════════════════════════════════════════ */
    function _advRole(){return String(window._fbRole||window.currentUserRole||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');}
    function _advIsAdmin(){const r=_advRole();return r==='admin'||r==='super_admin';}
    function _advEmail(){return String(window._fbUser||window.currentUserEmail||'').toLowerCase().trim();}
    function _advIso(){return new Date().toISOString();}
    function _advTsMs(v){if(!v)return 0;try{return v.toDate?v.toDate().getTime():new Date(v).getTime()||0;}catch(_){return 0;}}
    function _advPublicShape(r){
      r=r||{};
      return {
        code:String(r.code||''),platform:String(r.platform||'grc'),serviceType:'consultation',requestType:String(r.requestType||''),
        requestTypeLabel:String(r.requestTypeLabel||''),category:String(r.category||''),
        relatedType:String(r.relatedType||''),relatedItems:Array.isArray(r.relatedItems)?r.relatedItems.map(function(x){return {type:String(x&&x.type||''),id:String(x&&x.id||''),code:String(x&&x.code||''),name:String(x&&x.name||'')};}):[],
        relatedNewText:String(r.relatedNewText||''),departmentKey:String(r.departmentKey||''),
        departmentCode:String(r.departmentCode||''),gender:String(r.gender||''),priority:String(r.priority||'Normal'),
        status:String(r.status||'under_review'),createdAt:r.createdAt||serverTimestamp(),updatedAt:r.updatedAt||serverTimestamp(),
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
    async function _advAuthorizedRequest(requestId,adminAllowed){
      const snap=await getDoc(doc(db,'advisory_requests',requestId));
      if(!snap.exists())throw new Error('Request not found.');
      const r=Object.assign({id:snap.id},snap.data());
      if(!(adminAllowed&&_advIsAdmin())&&String(r.userEmail||'').toLowerCase().trim()!==_advEmail())throw new Error('Access denied.');
      return r;
    }
    async function _advGetSorted(collectionName){
      try{
        const snap=await getDocs(query(collection(db,collectionName),orderBy('createdAt','desc')));
        return snap.docs.map(d=>Object.assign({id:d.id},d.data()));
      }catch(e){
        const snap=await getDocs(collection(db,collectionName));
        const rows=snap.docs.map(d=>Object.assign({id:d.id},d.data()));
        rows.sort((a,b)=>_advTsMs(b.createdAt)-_advTsMs(a.createdAt));return rows;
      }
    }

    window._advisorySubmit=async function(payload,file){
      if(!_advEmail()||!db)throw new Error('Not authenticated.');
      payload=payload||{};
      const year=new Date().getFullYear(),deptCode=_advSafeCode(payload.departmentCode),counterId=year+'_'+deptCode;
      const counterRef=doc(db,'advisory_counters',counterId),requestRef=doc(collection(db,'advisory_requests')),publicRef=doc(db,'advisory_public',requestRef.id);
      let code='';
      const base={
        userName:String(window._fbName||window.currentUserName||_advEmail().split('@')[0]||'User'),userEmail:_advEmail(),
        departmentKey:String(payload.departmentKey||window._fbDept||''),departmentCode:deptCode,gender:String(payload.gender||''),priority:String(payload.priority||'Normal'),
        platform:String(payload.platform||'grc'),serviceType:'consultation',requestType:String(payload.requestType||''),requestTypeLabel:String(payload.requestTypeLabel||''),
        category:String(payload.category||''),relatedType:String(payload.relatedType||''),
        relatedItems:Array.isArray(payload.relatedItems)?payload.relatedItems.map(function(x){return {type:String(x&&x.type||''),id:String(x&&x.id||''),code:String(x&&x.code||''),name:String(x&&x.name||'')};}):[],
        relatedNewText:String(payload.relatedNewText||''),title:String(payload.title||''),details:String(payload.details||''),
        status:'under_review',messages:[],attachments:[],attachmentCount:0,firstRespondedAt:null,respondedAt:null,responseMinutes:null,
        completedAt:null,closedAt:null,rating:null,ratingAt:null,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAtIso:_advIso(),updatedBy:_advEmail()
      };
      await runTransaction(db,async tx=>{
        const c=await tx.get(counterRef),next=Number(c.exists()&&c.data().next||0)+1;
        code='ADV-'+deptCode+'-'+year+'-'+String(next).padStart(3,'0');
        tx.set(counterRef,{next,updatedAt:serverTimestamp()},{merge:true});
        const full=Object.assign({},base,{code});
        tx.set(requestRef,full,{merge:false});
        tx.set(publicRef,_advPublicShape(full),{merge:false});
      });
      if(file){
        const meta=await _advUploadFile(requestRef.id,file,_advEmail());
        await updateDoc(requestRef,{attachments:arrayUnion(meta),attachmentCount:1,updatedAt:serverTimestamp()});
        await updateDoc(publicRef,{attachmentCount:1,updatedAt:serverTimestamp()});
      }
      return {id:requestRef.id,code};
    };

    window._advisoryGetPublic=async function(){if(!_advEmail()||!db)return[];return _advGetSorted('advisory_public');};
    window._advisoryGetAll=async function(){if(!_advIsAdmin())throw new Error('Access denied.');return _advGetSorted('advisory_requests');};
    window._advisoryGetMine=async function(){
      if(!_advEmail()||!db)return[];
      const snap=await getDocs(query(collection(db,'advisory_requests'),where('userEmail','==',_advEmail())));
      const rows=snap.docs.map(d=>Object.assign({id:d.id},d.data()));rows.sort((a,b)=>_advTsMs(b.createdAt)-_advTsMs(a.createdAt));return rows;
    };
    window._advisoryGetOne=async function(requestId){return _advAuthorizedRequest(requestId,true);};

    window._advisoryAdminAction=async function(requestId,action,data,file){
      if(!_advIsAdmin())throw new Error('Access denied.');
      data=data||{};const current=await _advAuthorizedRequest(requestId,true),requestRef=doc(db,'advisory_requests',requestId),publicRef=doc(db,'advisory_public',requestId),nowIso=_advIso();
      const updates={updatedAt:serverTimestamp(),updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file){const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}
      const firstResponseActions=['respond','request_info'];
      if(firstResponseActions.includes(action)&&!current.firstRespondedAt){
        const created=_advTsMs(current.createdAt)||Date.now(),mins=Math.max(0,Math.round((Date.now()-created)/60000));
        updates.firstRespondedAt=serverTimestamp();updates.responseMinutes=mins;publicUpdates.firstRespondedAt=serverTimestamp();publicUpdates.responseMinutes=mins;
      }
      let status=current.status,messageText=String(data.text||'').trim();
      if(action==='respond'){status='responded';updates.respondedAt=serverTimestamp();publicUpdates.respondedAt=serverTimestamp();}
      else if(action==='request_info')status='awaiting_requester_information';
      else if(action==='close'){if(current.status!=='completed')throw new Error('Only completed requests can be closed.');status='closed';updates.closedAt=serverTimestamp();publicUpdates.closedAt=serverTimestamp();}
      else if(action==='duplicate')status='duplicate';
      else if(action==='out_of_scope')status='out_of_scope';
      else if(action==='knowledge_guide')status='knowledge_guide';
      else throw new Error('Unsupported action.');
      updates.status=status;publicUpdates.status=status;
      if(messageText||messageAttachments.length){updates.messages=arrayUnion({id:'msg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),senderRole:_advRole(),senderName:String(window._fbName||'Admin'),senderEmail:_advEmail(),text:messageText,attachments:messageAttachments,createdAt:nowIso});}
      await updateDoc(requestRef,updates);await updateDoc(publicRef,publicUpdates);return true;
    };

    window._advisoryRequesterAction=async function(requestId,action,data,file){
      data=data||{};const current=await _advAuthorizedRequest(requestId,false),requestRef=doc(db,'advisory_requests',requestId),publicRef=doc(db,'advisory_public',requestId),updates={updatedAt:serverTimestamp(),updatedBy:_advEmail()},publicUpdates={updatedAt:serverTimestamp()},messageAttachments=[];
      if(file){const meta=await _advUploadFile(requestId,file,_advEmail());messageAttachments.push(meta);updates.attachments=arrayUnion(meta);updates.attachmentCount=Number(current.attachmentCount||0)+1;publicUpdates.attachmentCount=updates.attachmentCount;}
      if(action==='clarify'){
        if(current.status!=='awaiting_requester_information')throw new Error('This request is not waiting for clarification.');
        const text=String(data.text||'').trim();if(!text)throw new Error('Clarification is required.');updates.status='in_progress';publicUpdates.status='in_progress';
        updates.messages=arrayUnion({id:'msg_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),senderRole:_advRole(),senderName:String(window._fbName||'Requester'),senderEmail:_advEmail(),text,attachments:messageAttachments,createdAt:_advIso()});
      }else if(action==='complete'){
        if(current.status!=='responded')throw new Error('The request must be in Responded status first.');updates.status='completed';updates.completedAt=serverTimestamp();publicUpdates.status='completed';publicUpdates.completedAt=serverTimestamp();
      }else if(action==='cancel'){
        if(['completed','closed','duplicate','out_of_scope','knowledge_guide'].includes(current.status))throw new Error('This request can no longer be cancelled.');updates.status='cancelled';publicUpdates.status='cancelled';
      }else throw new Error('Unsupported action.');
      await updateDoc(requestRef,updates);await updateDoc(publicRef,publicUpdates);return true;
    };

    window._advisoryRate=async function(requestId,rating){
      const current=await _advAuthorizedRequest(requestId,false),n=Math.max(1,Math.min(5,Number(rating||0)));
      if(current.status!=='closed')throw new Error('Only closed requests can be rated.');if(Number(current.rating))throw new Error('This request has already been rated.');
      const updates={rating:n,ratingAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedBy:_advEmail()};
      await updateDoc(doc(db,'advisory_requests',requestId),updates);await updateDoc(doc(db,'advisory_public',requestId),{rating:n,ratingAt:serverTimestamp(),updatedAt:serverTimestamp()});return true;
    };

    window._advisoryDownloadAttachment=async function(requestId,attachmentId,mimeType,chunkCount){
      await _advAuthorizedRequest(requestId,true);const chunks=[];
      for(let i=0;i<Number(chunkCount||0);i++){
        const snap=await getDoc(doc(db,'advisory_attachments',_advChunkDocId(requestId,attachmentId,i)));if(!snap.exists())throw new Error('Attachment chunk is missing.');chunks.push(_advBase64ToBytes(String(snap.data().data||'')));
      }
      const total=chunks.reduce((n,x)=>n+x.length,0),out=new Uint8Array(total);let offset=0;chunks.forEach(x=>{out.set(x,offset);offset+=x.length;});return new Blob([out],{type:String(mimeType||'application/octet-stream')});
    };



    /* Cleanup helper for pre-launch test User Requests (Super Admin/Admin only, explicit caller). */
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