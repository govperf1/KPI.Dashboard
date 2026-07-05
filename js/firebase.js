import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    import { getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,fetchSignInMethodsForEmail,setPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    import { getFirestore,doc,getDoc,setDoc,addDoc,collection,serverTimestamp,onSnapshot,updateDoc,arrayUnion,query,where,orderBy,getDocs,deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const firebaseConfig={apiKey:"AIzaSyAlLWZvsu4UbHn-LncFdrSHlbL3bIAG4no",authDomain:"qumc-kpi-dashboard-f10dd.firebaseapp.com",projectId:"qumc-kpi-dashboard-f10dd",storageBucket:"qumc-kpi-dashboard-f10dd.firebasestorage.app",messagingSenderId:"659971973475",appId:"1:659971973475:web:483116a0711008a6a97356"};
    const DPERMS={super_admin:['*'],admin:['manage_users','view_all_departments','view_department','edit_kpi','edit_gap_analysis','edit_actions','edit_targets','approve_changes','lock_quarter','unlock_quarter','view_executive_intelligence','export_reports','manage_dashboard_settings','view_audit_trail'],executive:['view_all_departments','view_department','view_executive_intelligence','export_reports'],department_manager:['view_department','view_executive_intelligence','export_reports'],kpi_owner:['view_department','edit_gap_analysis','export_reports'],viewer:['view_all_departments','view_department','export_reports']};

    const app=initializeApp(firebaseConfig);
    const auth=getAuth(app);
    const db=getFirestore(app);

    /* Session-only persistence — clears on browser close, prevents cached auto-login */
    setPersistence(auth,browserSessionPersistence).then(()=>console.log('[Auth] Session persistence set')).catch(e=>console.warn('[Auth] Persistence:',e.message));

    const ge=id=>{const e=document.getElementById(id);if(!e)console.warn('[Auth] Missing element:',id);return e;};
    const cleanAccountName=v=>{v=String(v||'').trim();if(!v)return'';if(['user','username','account','admin','null','undefined','-','—'].includes(v.toLowerCase()))return'';return v;};
    const normalizeRole=v=>{const r=String(v||'viewer').trim().toLowerCase().replace(/[\s-]+/g,'_');return r==='superadmin'?'super_admin':r;};
    const accountNameFrom=(data,user,email)=>cleanAccountName(data&&data.userName)||cleanAccountName(data&&data.username)||cleanAccountName(data&&data.name)||cleanAccountName(data&&data.fullName)||cleanAccountName(data&&data.displayName)||cleanAccountName(user&&user.displayName)||cleanAccountName(email&&email.split('@')[0])||'';
    const setUserDisplay=(name,role)=>{try{const n=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';window._fbName=n;window.currentUserName=n;const ids=['_portalUserName','_userName','topUserName','profileName','profileNameRow'];ids.forEach(id=>{const e=ge(id);if(e)e.textContent=n;});const avIds=['_userAvatar','topUserAvatar','profileAvatar'];avIds.forEach(id=>{const av=ge(id);if(av)av.textContent=(n||'U')[0].toUpperCase();});if(role){const rl=ge('_userRole');if(rl)rl.textContent=role;}if(typeof window.updateUserBadge==='function')window.updateUserBadge(n,window._fbRole||role,window._fbPerms||[]);}catch(e){console.warn('[Auth] user display update skipped',e);}};
    const showEntryLoading=(msg)=>{try{let ov=ge('_perfEntryLoading');if(!ov){ov=document.createElement('div');ov.id='_perfEntryLoading';ov.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(239,243,248,.92);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:inherit;color:#152538';ov.innerHTML='<div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.16);padding:20px 24px;text-align:center;min-width:220px"><div style="width:34px;height:34px;border-radius:50%;border:3px solid rgba(1,149,175,.18);border-top-color:#0195af;margin:0 auto 12px;animation:qumcSpin .85s linear infinite"></div><div id="_perfEntryLoadingText" style="font-size:12px;font-weight:900"></div></div>';document.body.appendChild(ov);let st=document.getElementById('qumc-entry-loading-style');if(!st){st=document.createElement('style');st.id='qumc-entry-loading-style';st.textContent='@keyframes qumcSpin{to{transform:rotate(360deg)}}';document.head.appendChild(st);}}const t=ge('_perfEntryLoadingText');if(t)t.textContent=msg||'Loading dashboard…';ov.style.display='flex';}catch(e){}};
    const hideEntryLoading=()=>{try{const ov=document.getElementById('_perfEntryLoading');if(ov)ov.remove();}catch(e){}};
    const showLogin=()=>{console.log('[Auth] showLogin');if(typeof window._hideGRC==='function')window._hideGRC();/* Show overlay (already visible, but ensure it is) */const ao=ge('_authOverlay');if(ao){ao.style.display='flex';ao.style.alignItems='flex-end';ao.style.background='rgba(245,247,252,0)'}/* Hide loading spinner, show login form */const ld=ge('_authLoading');if(ld)ld.style.display='none';const lp=ge('_loginPanel');if(lp)lp.style.display='block';const po=ge('_portalOverlay');if(po)po.style.display='none';const b=ge('_fbLoginBtn');if(b){b.disabled=false;b.textContent='Sign In';}};
    const showPortal=(name,role)=>{console.log('[Auth] showPortal:',name,role);if(typeof window._hideGRC==='function')window._hideGRC();const po=ge('_portalOverlay'),lo=ge('_authOverlay');if(lo)lo.style.display='none';if(po){po.style.display='flex';console.log('[Auth] _portalOverlay is now flex');}else{console.error('[Auth] PORTAL OVERLAY NOT FOUND');return;}const nm=ge('_portalUserName'),rl=ge('_portalUserRole');const realName=cleanAccountName(name)||cleanAccountName(window._fbName)||cleanAccountName((window._fbUser||'').split('@')[0])||'';if(nm)nm.textContent=realName;if(rl){const L={super_admin:'Super Admin',admin:'Admin',executive:'Executive',department_manager:'Dept Manager',kpi_owner:'KPI Owner',viewer:'Viewer'};rl.textContent=L[role]||role;}console.log('[Auth] Portal ready');};
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

    window._doLogout=async()=>{console.log('[Auth] Logout');if(typeof window._hideGRC==='function')window._hideGRC();try{await signOut(auth);}catch(e){console.error('[Auth]',e);}};

    window._backToPortal=()=>{console.log('[Auth] Back to portal');if(typeof window._hideGRC==='function')window._hideGRC();const lo=document.getElementById('_authOverlay'),po=document.getElementById('_portalOverlay'),bg=document.getElementById('_bgLayer');if(lo)lo.style.display='none';if(bg)bg.style.display='block';if(po)po.style.display='flex';};
window._selectPortal=async portal=>{
      console.log('[Auth] Selected:',portal);
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
      }else if(portal==='governance'||portal==='grc'){
        hideEntryLoading();
        setUserDisplay(window._fbName,window._fbRole);
        if(normalizeRole(window._fbRole)==='super_admin'){
          console.log('[Auth] Entering GRC Super Admin preview...');
          if(typeof window._enterGRC==='function') window._enterGRC();
          else console.warn('[GRC] grc.js is not loaded yet');
        }else{
          console.log('[Auth] GRC is restricted to Super Admin during development');
          if(typeof window._showGrcComingSoon==='function') window._showGrcComingSoon();
        }
      }else{
        console.warn('[Auth] Unknown portal:',portal);

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
        const role=normalizeRole(d.role||'viewer');
        console.log('[Auth] Role:',role,'Dept:',d.dept||'none');
        let perms=[];console.log('[FS READ] config_roles/'+role);
        try{
        const rs = await getDoc(doc(db,'config_roles',role));perms=rs.exists()?(rs.data().permissions||[]):(DPERMS[role]||[]);}catch(_){perms=DPERMS[role]||[];}
        if(d.extraPermissions)perms=[...new Set([...perms,...d.extraPermissions])];
        if(d.revokedPermissions)perms=perms.filter(p=>!d.revokedPermissions.includes(p));
        const realName=accountNameFrom(d,user,email);
        window._fbUser=email;window._fbEmail=email;window.currentUserEmail=email;window._fbRole=role;window.currentUserRole=role;window._fbDept=d.dept||null;window.currentUserDept=d.dept||null;window._fbPerms=perms;window._fbName=realName;window.currentUserName=realName;window._fbAssignedKpis=d.assignedKpis||null;
        setUserDisplay(window._fbName,role);
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
        // Save audit separately (collection for scalability)
        if(audit.length){
          console.log('[FS WRITE] kpi_dashboard/audit');
          await setDoc(doc(db,'kpi_dashboard','audit'),
            {log:audit.slice(0,2000)}, {merge:false});
        }
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
          const safe=['gaps','actions','audit','pci','codeOv','pciConfig','requests']; /* F5: textEdits removed — handled separately below with LOCAL WINS */
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