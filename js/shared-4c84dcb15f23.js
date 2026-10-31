
(function(){
  const GLOBAL_PREFIX='talkabee-voice-';
  function controls(){
    const selects=[...document.querySelectorAll('select')];
    const voice=selects.find(s=>/voice/i.test((s.id||'')+' '+(s.name||'')+' '+(s.getAttribute('aria-label')||'')));
    const language=selects.find(s=>/lang/i.test((s.id||'')+' '+(s.name||'')+' '+(s.getAttribute('aria-label')||'')));
    return {language,voice};
  }
  function voices(){return ('speechSynthesis' in window)?(speechSynthesis.getVoices()||[]):[];}
  function key(lang){return GLOBAL_PREFIX+lang;}
  function selectedVoiceURI(sel){
    if(!sel||!sel.value)return '';
    const vs=voices(), opt=sel.options[sel.selectedIndex];
    const raw=sel.value, label=(opt&&opt.textContent)||'';
    let v=vs.find(x=>x.voiceURI===raw)||vs.find(x=>x.name===raw);
    if(!v && label) v=vs.find(x=>label===x.name||label.startsWith(x.name+' —')||label.startsWith(x.name+' -'));
    return v?v.voiceURI:'';
  }
  function restore(){
    const {language,voice}=controls(); if(!language||!voice)return;
    const saved=localStorage.getItem(key(language.value))||''; if(!saved)return;
    const vs=voices(), target=vs.find(v=>v.voiceURI===saved); if(!target)return;
    const opts=[...voice.options];
    let opt=opts.find(o=>o.value===target.voiceURI)||opts.find(o=>o.value===target.name)||
            opts.find(o=>o.textContent===target.name||o.textContent.startsWith(target.name+' —')||o.textContent.startsWith(target.name+' -'));
    if(opt && voice.value!==opt.value){
      voice.value=opt.value;
      voice.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  function save(){
    const {language,voice}=controls(); if(!language||!voice)return;
    const uri=selectedVoiceURI(voice);
    localStorage.setItem(key(language.value),uri);
  }
  function bind(){
    const {language,voice}=controls(); if(!language||!voice)return;
    if(!voice.dataset.tabGlobalVoice){ voice.addEventListener('change',save); voice.dataset.tabGlobalVoice='1'; }
    if(!language.dataset.tabGlobalVoice){
      language.addEventListener('change',()=>{setTimeout(restore,0);setTimeout(restore,120);setTimeout(restore,500)});
      language.dataset.tabGlobalVoice='1';
    }
    restore(); setTimeout(restore,120); setTimeout(restore,500); setTimeout(restore,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  if('speechSynthesis' in window){
    const prior=speechSynthesis.onvoiceschanged;
    speechSynthesis.onvoiceschanged=function(e){if(typeof prior==='function')prior.call(this,e);setTimeout(bind,0);setTimeout(restore,120)};
  }
})();
