/* QUMC GRC Workspace Chat — hardened clickable floating assistant */
(function(){
  'use strict';
  if(window.__QUMC_GRC_CHAT_V67__) return;
  window.__QUMC_GRC_CHAT_V67__=true;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function snap(){try{return typeof window._grcGetExportSnapshot==='function'?(window._grcGetExportSnapshot()||{}):{};}catch(_){return{};}}
  function counts(){var s=snap();return{policies:(s.policies||[]).length,forms:(s.forms||[]).length,plans:(s.plans||[]).length,risks:(s.risks||[]).length,incidents:(s.incidents||[]).length,codes:(s.codes||[]).length,actions:(s.actions||[]).length,initiatives:(s.initiatives||[]).length,cbahi:(s._cbahiAssessment||[]).length,jci:(s._jciAssessment||[]).length};}
  function answer(q){var c=counts(),t=String(q||'').toLowerCase();
    if(/risk|مخاطر/.test(t))return 'Risk Management currently contains '+c.risks+' risks, '+c.incidents+' incidents and '+c.codes+' emergency-code records.';
    if(/compliance|cbahi|jci|امتثال|سباهي/.test(t))return 'Compliance contains '+c.cbahi+' CBAHI assessment rows and '+c.jci+' JCI assessment rows.';
    if(/governance|policy|form|plan|حوكمة|سياس/.test(t))return 'Governance currently contains '+c.policies+' policies, '+c.forms+' forms and '+c.plans+' plans.';
    if(/initiative|مباد/.test(t))return 'There are '+c.initiatives+' initiatives in the current GRC workspace.';
    return 'GRC snapshot: '+c.policies+' policies, '+c.forms+' forms, '+c.plans+' plans, '+c.risks+' risks, '+c.incidents+' incidents and '+c.actions+' action-plan records.';
  }
  function add(text,who){var box=document.getElementById('grcAiMsgs');if(!box)return;var d=document.createElement('div');d.className='ai-msg-bubble '+(who==='user'?'user':'assistant');d.innerHTML=esc(text);box.appendChild(d);box.scrollTop=box.scrollHeight;}
  function inGrc(){return !!(document.body&&document.body.classList.contains('grc-mode'));}
  function harden(el,kind){if(!el)return;el.style.position='fixed';el.style.zIndex='2147483646';el.style.pointerEvents='auto';el.style.touchAction='manipulation';el.style.userSelect='none';if(kind==='button'){el.style.display=inGrc()?'grid':'none';el.style.cursor='pointer';el.style.right='22px';el.style.bottom='22px';}}

  window._grcAiToggle=function(force){
    window._grcChatEnsure&&window._grcChatEnsure();
    var w=document.getElementById('grcAiWin'); if(!w)return;
    var visible=w.classList.contains('open')||w.style.display==='flex';
    var show=typeof force==='boolean'?force:!visible;
    w.classList.toggle('open',show); w.style.display=show?'flex':'none'; w.style.zIndex='2147483646'; w.style.pointerEvents='auto';
    w.setAttribute('aria-hidden',show?'false':'true');
    if(show){var i=document.getElementById('grcAiInp');if(i)setTimeout(function(){i.focus();},30);}
  };
  window._grcAiSend=function(){var i=document.getElementById('grcAiInp'),q=String(i&&i.value||'').trim();if(!q)return;add(q,'user');i.value='';setTimeout(function(){add(answer(q),'bot');},120);};
  window._grcAiSuggest=function(q){var i=document.getElementById('grcAiInp');if(i)i.value=q;window._grcAiSend();};

  window._grcChatEnsure=function(){
    var btn=document.getElementById('grcAiFloatBtn'),win=document.getElementById('grcAiWin');
    if(!btn){
      btn=document.createElement('button'); btn.id='grcAiFloatBtn'; btn.className='ai-float-btn grc-ai-float'; btn.type='button'; btn.title='GRC Chat'; btn.setAttribute('aria-label','Open GRC Chat'); btn.innerHTML='<span class="ai-float-chart">💬</span>';
      document.body.appendChild(btn);
    }
    if(!win){
      win=document.createElement('section'); win.id='grcAiWin'; win.className='ai-chat-window grc-ai-window'; win.style.display='none'; win.setAttribute('aria-hidden','true');
      win.innerHTML='<div class="ai-chat-head"><div class="ai-chat-title-wrap"><div class="ai-chat-icon">💬</div><div><div class="ai-chat-title">GRC Chat</div><div class="ai-chat-subtitle">Workspace insights</div></div></div><button type="button" class="ai-chat-close" aria-label="Close chat">×</button></div><div class="ai-chat-messages" id="grcAiMsgs"><div class="ai-msg-bubble assistant"><b>Hi 👋</b><br>Ask about Governance, Risk Management, Compliance or Initiatives.</div><div class="ai-suggestion-row"><button type="button" data-q="Summarize GRC">Summary</button><button type="button" data-q="Show risk overview">Risks</button><button type="button" data-q="Show compliance overview">Compliance</button></div></div><div class="ai-chat-inputbar"><textarea id="grcAiInp" rows="1" placeholder="Ask about GRC…"></textarea><button id="grcAiSendBtn" type="button" aria-label="Send message">➤</button></div>';
      document.body.appendChild(win);
      win.querySelector('.ai-chat-close').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();window._grcAiToggle(false);});
      win.querySelectorAll('[data-q]').forEach(function(b){b.addEventListener('click',function(){window._grcAiSuggest(this.getAttribute('data-q'));});});
      var inp=win.querySelector('#grcAiInp'); inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();window._grcAiSend();}});
      win.querySelector('#grcAiSendBtn').addEventListener('click',window._grcAiSend);
    }
    harden(btn,'button'); harden(win,'window');
    // Replace any stale inline handler with a direct listener once.
    if(!btn.__grcChatBound){btn.__grcChatBound=true;btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();window._grcAiToggle();},true);}
    if(!inGrc()){btn.style.display='none';win.classList.remove('open');win.style.display='none';win.setAttribute('aria-hidden','true');}
  };

  function boot(){window._grcChatEnsure();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',boot,{once:true});
  // Only react to actual page-mode changes; no repeated polling loop.
  var last='';setInterval(function(){var now=inGrc()?'1':'0';if(now!==last){last=now;window._grcChatEnsure();}},500);
})();
