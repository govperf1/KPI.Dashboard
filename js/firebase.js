import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,fetchSignInMethodsForEmail,setPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    import { getFirestore,doc,getDoc,setDoc,addDoc,collection,serverTimestamp,onSnapshot,updateDoc,arrayUnion,query,where,orderBy,getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const firebaseConfig={apiKey:"AIzaSyAlLWZvsu4UbHn-LncFdrSHlbL3bIAG4no",authDomain:"qumc-kpi-dashboard-f10dd.firebaseapp.com",projectId:"qumc-kpi-dashboard-f10dd",storageBucket:"qumc-kpi-dashboard-f10dd.firebasestorage.app",messagingSenderId:"659971973475",appId:"1:659971973475:web:483116a0711008a6a97356"};
    const DPERMS={super_admin:['*'],admin:['manage_users','view_all_departments','view_department','edit_kpi','edit_gap_analysis','edit_actions','edit_targets','approve_changes','lock_quarter','unlock_quarter','view_executive_intelligence','export_reports','manage_dashboard_settings','view_audit_trail'],executive:['view_all_departments','view_department','view_executive_intelligence','export_reports'],department_manager:['view_department','view_executive_intelligence','export_reports'],kpi_owner:['view_department','edit_gap_analysis','export_reports'],viewer:['view_all_departments','view_department','export_reports']};

    const app=initializeApp(firebaseConfig);
    const auth=getAuth(app);
    const db=getFirestore(app);

    /* Session-only persistence — clears on browser close, prevents cached auto-login */
    setPersistence(auth,browserSessionPersistence).then(()=>console.log('[Auth] Session persistence set')).catch(e=>console.warn('[Auth] Persistence:',e.message));

    const ge=id=>{const e=document.getElementById(id);if(!e)console.warn('[Auth] Missing element:',id);return e;};
    const showLogin=()=>{console.log('[Auth] showLogin');['_authOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='flex';});const po=ge('_portalOverlay');if(po)po.style.display='none';const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}};
    const showPortal=(name,role)=>{console.log('[Auth] showPortal:',name,role);const po=ge('_portalOverlay'),lo=ge('_authOverlay');if(lo)lo.style.display='none';if(po){po.style.display='flex';console.log('[Auth] _portalOverlay is now flex');}else{console.error('[Auth] PORTAL OVERLAY NOT FOUND');return;}const nm=ge('_portalUserName'),rl=ge('_portalUserRole');if(nm)nm.textContent=name||'User';if(rl){const L={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',viewer:'Viewer'};rl.textContent=L[role]||role;}console.log('[Auth] Portal ready');};
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

    window._doLogout=async()=>{console.log('[Auth] Logout');try{await signOut(auth);}catch(e){console.error('[Auth]',e);}};

    window._backToPortal=()=>{console.log('[Auth] Back to portal');const lo=document.getElementById('_authOverlay'),po=document.getElementById('_portalOverlay'),bg=document.getElementById('_bgLayer');if(lo)lo.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};
window._selectPortal=async portal=>{
      console.log('[Auth] Selected:',portal);
      if(portal==='performance'){
        ['_bgLayer','_authOverlay','_portalOverlay','_forgotOverlay'].forEach(id=>{const e=ge(id);if(e)e.style.display='none';});
        console.log('[Auth] Entering Performance portal...');
        if(typeof window.applyRolePermissions==='function')window.applyRolePermissions(window._fbRole,window._fbDept,window._fbPerms);
        if(typeof window.updateUserBadge==='function')window.updateUserBadge(window._fbName,window._fbRole,window._fbPerms);
        /* Load shared Firestore state BEFORE first render so edits persist across all accounts */
        if(typeof window._onFSLoaded==='function'){
          try{ await window._onFSLoaded(); }
          catch(e){ console.warn('[FS] initial load skipped:',e); }
        }
        /* Render with small delay to ensure DOM is ready */
        if(typeof window.renderCurrent==='function'){
          try{ window.renderCurrent(); }
          catch(e){ console.error('[Auth] Initial render error:',e); }
          /* Second render after any async operations */
          setTimeout(()=>{try{window.renderCurrent();}catch(_){}},250);
        }
        /* KPI Owner: show Gap Analysis status popup every login */
        if(window._fbRole==='kpi_owner' && typeof window.showKpoGapStatusPopup==='function'){
          setTimeout(()=>{try{window.showKpoGapStatusPopup();}catch(e){console.warn('[KPO] status popup error:',e);}},700);
        }
        /* Super Admin: open admin hub immediately after entering Performance portal */
        if(window._fbRole==='super_admin'){
          setTimeout(()=>{
            try{
              if(typeof window._showSuperAdminHub==='function'){
                window._showSuperAdminHub();
              } else {
                /* Fallback: open the standard admin panel */
                const adminOv=document.getElementById('adminOv');
                if(adminOv) adminOv.classList.add('open');
                if(typeof popAdminSels==='function') popAdminSels();
              }
            }catch(e){console.warn('[SA] hub open error:',e);}
          },400);
        }
        /* Start read-only Firestore listener for cross-user updates */
        if(typeof window._startReadListener==='function') setTimeout(window._startReadListener, 800);
        console.log('[Auth] ✓ Performance portal entered');
      }else{
        const cs=document.createElement('div');cs.style.cssText='position:fixed;inset:0;z-index:10000;background:linear-gradient(135deg,#0a1628,#0f2444);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:inherit';cs.innerHTML='<div style="font-size:28px;font-weight:900;color:#fff">Governance</div><div style="font-size:13px;color:rgba(255,255,255,.45)">Under development</div><div style="padding:8px 24px;background:rgba(1,149,175,.12);border:1px solid rgba(1,149,175,.25);border-radius:20px;font-size:11px;color:#0195af;font-weight:700">COMING SOON</div><button onclick="this.parentElement.remove()" style="background:transparent;color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.15);border-radius:9px;padding:9px 24px;font-size:11px;cursor:pointer;font-family:inherit;margin-top:8px">← Back</button>';document.body.appendChild(cs);
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
      if(!user){showLogin();return;}
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
        window._fbUser=email;window._fbRole=role;window._fbDept=d.dept||null;window._fbPerms=perms;window._fbName=d.displayName||email.split('@')[0];window._fbAssignedKpis=d.assignedKpis||null;
        /* [REMOVED] lastLogin write — was costing 1 Firestore write per login */
        /* [REMOVED] activity_log write — was 1 Firestore write per login */
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
    window._saveToFS = async (data) => {
      if(!window._fbUser||!db){
        console.warn('[FS] Write skipped — not authenticated');
        return;
      }
      /* Debounce: if called twice within 800ms, only write once */
      _fsPending=data;
      if(_fsSaveTimer) return;
      _fsSaveTimer=setTimeout(async()=>{
        _fsSaveTimer=null;
        const d=_fsPending; _fsPending=null;
        if(!d) return;
        window._lastCloudSaveTime=Date.now();
        console.log('[FS WRITE] kpi_dashboard/state — triggered by user action');
      try {
        const {audit=[], ...rest} = d;
        console.log('[FS WRITE] kpi_dashboard/state');
        await setDoc(doc(db,'kpi_dashboard','state'),
          {...rest, _by:window._fbUser, _at:serverTimestamp()}, {merge:true});
        // Save audit separately (collection for scalability)
        if(audit.length){
          console.log('[FS WRITE] kpi_dashboard/audit');
          await setDoc(doc(db,'kpi_dashboard','audit'),
            {log:audit.slice(0,2000)}, {merge:false});
        }
      } catch(e){ console.warn('[FS] Save error:',e.code||e.message); throw e; }
      }, 800); /* 800ms debounce — prevents double-click double-write */
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
          const safe=['ov','added','gaps','actions','rptEdits','audit','deleted','pci','codeOv','textEdits','pciConfig','requests'];
          let changed=false;
          safe.forEach(function(f){
            if(fsData[f]!==undefined){
              try{ if(JSON.stringify(ST[f])!==JSON.stringify(fsData[f])){ST[f]=fsData[f];changed=true;} }catch(_){ST[f]=fsData[f];changed=true;}
            }
          });
          if(!changed){ console.log('[FS READ] onSnapshot: no data change, skip render'); return; }
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
        console.log('[FS READ] kpi_dashboard/state + audit');
        const [stateSnap, auditSnap] = await Promise.all([
          getDoc(doc(db,'kpi_dashboard','state')),
          getDoc(doc(db,'kpi_dashboard','audit'))
        ]);
        const state  = stateSnap.exists()  ? stateSnap.data()  : {};
        const audit  = auditSnap.exists()  ? auditSnap.data()  : {};
        const {_by, _at, ...clean} = state;
        return {...clean, audit: audit.log||[]};
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
        const safeFields=['ov','added','gaps','actions','rptEdits','audit','deleted','pci','codeOv'];
        safeFields.forEach(f=>{
          if(fsData[f]!==undefined) ST[f]=fsData[f];
        });
        /* Clean nulls from ov (same protection as _loadST) */
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
      }catch(e){ console.warn('[FS] onFSLoaded error:',e); }
    };

    console.log('[Auth] Firebase module initialized');