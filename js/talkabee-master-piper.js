(function(){
'use strict';
if(window.__tbMasterPiperInstalled)return;
const learn=document.getElementById('learn'),mode=document.getElementById('voiceMode');
if(!learn||!mode)return;
const script=document.currentScript;
if(!script?.src)return;
window.__tbMasterPiperInstalled=true;
const moduleUrl=new URL('../piper-matched-118/piper-tts-web.js',script.src).href;
const voiceKey='talkabee-piper-voice-';
const prefix={en:['en_'],es:['es_'],fr:['fr_'],de:['de_'],it:['it_'],pt:['pt_'],no:['no_','nb_']};
let engine=null,loading=null,voices=[],currentAudio=null,currentUrl=null,token=0,selectionLanguage='',selectionSignature='';
const wrap=document.createElement('div');wrap.id='tbMasterPiperControls';
wrap.style.cssText='margin:8px 0 12px;padding:9px;border:1px solid #a8b2bd;border-radius:8px;font:13px Arial,sans-serif';
const label=document.createElement('label');label.textContent='Enhanced Piper voice';label.htmlFor='tbMasterPiperVoice';
const select=document.createElement('select');select.id='tbMasterPiperVoice';select.style.cssText='display:block;width:100%;margin:5px 0';
const info=document.createElement('div');info.id='tbMasterPiperStatus';info.setAttribute('role','status');info.textContent='Piper waiting';
const loadBtn=document.createElement('button');loadBtn.type='button';loadBtn.textContent='Load Piper voice';
wrap.append(label,select,loadBtn,info);
// Keep Piper settings outside header layout so loading/status cannot enlarge it.
const voiceField=mode.closest('.tb-field')||mode.parentElement;
const settingsBtn=document.createElement('button');
settingsBtn.type='button';settingsBtn.id='tbPiperSettingsButton';
settingsBtn.textContent='Voice Settings';settingsBtn.setAttribute('aria-controls',wrap.id);
settingsBtn.setAttribute('aria-expanded','false');
voiceField.insertAdjacentElement('afterend',settingsBtn);
document.body.appendChild(wrap);
const style=document.createElement('style');style.textContent=`
#tbPiperSettingsButton{align-self:end;margin:0 6px 3px;padding:8px 12px;border:1px solid #8496aa;border-radius:9px;background:#263944;color:white;font:600 15px Arial,sans-serif;cursor:pointer;white-space:nowrap}
#tbPiperSettingsButton[hidden],#tbMasterPiperControls[hidden]{display:none!important}
#tbMasterPiperControls{position:fixed!important;z-index:2147483000;top:80px;right:16px;left:auto;width:min(340px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow:auto;box-sizing:border-box;margin:0!important;padding:15px!important;border:1px solid #9bacbd!important;border-radius:12px!important;background:#19232c!important;color:#f4f6fa!important;box-shadow:0 12px 35px #0009;font:15px Arial,sans-serif!important}
#tbMasterPiperControls select{box-sizing:border-box;color:#fff;background:#30334b;padding:7px;border-radius:8px}
#tbMasterPiperControls button{padding:8px 12px;margin:4px 0;color:white;background:#263944;border:1px solid #8795a4;border-radius:8px;cursor:pointer}
#tbMasterPiperStatus{overflow-wrap:anywhere;margin-top:7px}
`;document.head.appendChild(style);
let panelOpen=false;
function renderPanel(){
 const enabled=mode.value==='enhanced';
 settingsBtn.hidden=!enabled;
 wrap.hidden=!enabled||!panelOpen;
 settingsBtn.setAttribute('aria-expanded',String(enabled&&panelOpen));
 if(enabled&&panelOpen){const r=settingsBtn.getBoundingClientRect();wrap.style.top=Math.min(window.innerHeight-110,Math.max(8,r.bottom+8))+'px';}
}
settingsBtn.addEventListener('click',()=>{panelOpen=!panelOpen;renderPanel();});
document.addEventListener('pointerdown',e=>{if(panelOpen&&!wrap.contains(e.target)&&!settingsBtn.contains(e.target)){panelOpen=false;renderPanel();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panelOpen){panelOpen=false;renderPanel();settingsBtn.focus();}});

function status(message){info.textContent=message}
function stop(){token++;if(currentAudio){currentAudio.pause();currentAudio=null}if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null}}
window.tbMasterPiperStop=stop;
function saved(language){try{return localStorage.getItem(voiceKey+language)||''}catch{return ''}}
function save(language,id){try{if(id)localStorage.setItem(voiceKey+language,id)}catch{}}
function available(language){return voices.filter(v=>(prefix[language]||['en_']).some(p=>v.toLowerCase().startsWith(p)))}
function syncSelection(force){
 const language=learn.value,candidates=available(language),signature=candidates.join('\u0000');
 // Do not rebuild the dropdown during speech: that was undoing user selections.
 if(!force&&selectionLanguage===language&&selectionSignature===signature)return;
 const previous=selectionLanguage===language?select.value:'';
 selectionLanguage=language;selectionSignature=signature;
 const preferred=previous&&candidates.includes(previous)?previous:saved(language);
 const chosen=candidates.includes(preferred)?preferred:(candidates.find(v=>v.includes('medium'))||candidates[0]||'');
 select.replaceChildren();for(const v of candidates)select.add(new Option(v,v));
 if(chosen){select.value=chosen;save(language,chosen)}
 else select.add(new Option('No Piper voice for this language',''));
 status(chosen?'Piper selected: '+chosen:'No Piper voice available for '+language);
}
async function load(){
 if(engine)return engine;
 if(loading)return loading;
 loading=(async()=>{
  status('Loading Piper voice catalog…');
  const m=await import(moduleUrl),raw=await m.voices();
  voices=(Array.isArray(raw)?raw.map(v=>typeof v==='string'?v:v?.id||v?.key||v?.name||''):Object.keys(raw||{})).filter(Boolean);
  engine=m;syncSelection(true);return m;
 })();
 try{return await loading}catch(e){loading=null;status('Piper unavailable: '+(e?.message||e));throw e}
}
// Add a short silent lead-in to PCM WAV audio so the first syllable is not
// lost while the browser/audio device starts. Preserve the original WAV when
// its format is unsupported (e.g. compressed audio).
async function withAudioLeadIn(blob){
 try{
  if(!(blob instanceof Blob))return blob;
  const bytes=new Uint8Array(await blob.arrayBuffer());
  if(bytes.length<44)return blob;
  const view=new DataView(bytes.buffer);
  const tag=(at)=>String.fromCharCode(...bytes.subarray(at,at+4));
  if(tag(0)!=='RIFF'||tag(8)!=='WAVE')return blob;
  let fmt=-1,data=-1,dataSize=0;
  for(let at=12;at+8<=bytes.length;){
   const size=view.getUint32(at+4,true);
   if(at+8+size>bytes.length)break;
   if(tag(at)==='fmt ')fmt=at+8;
   if(tag(at)==='data'){data=at+8;dataSize=size;break}
   at+=8+size+(size%2);
  }
  if(fmt<0||data<0)return blob;
  const format=view.getUint16(fmt,true),sampleRate=view.getUint32(fmt+4,true),blockAlign=view.getUint16(fmt+12,true);
  if(![1,3].includes(format)||!sampleRate||!blockAlign)return blob;
  const silenceBytes=Math.round(sampleRate*.28)*blockAlign;
  if(silenceBytes<=0||silenceBytes>2000000)return blob;
  const result=new Uint8Array(bytes.length+silenceBytes);
  result.set(bytes.subarray(0,data),0);
  // For unsigned 8-bit PCM, silence is 128, not zero.
  if(format===1&&view.getUint16(fmt+14,true)===8)result.fill(128,data,data+silenceBytes);
  result.set(bytes.subarray(data),data+silenceBytes);
  const out=new DataView(result.buffer);
  out.setUint32(4,view.getUint32(4,true)+silenceBytes,true);
  out.setUint32(data-4,dataSize+silenceBytes,true);
  return new Blob([result],{type:'audio/wav'});
 }catch(e){return blob}
}
function update(){
 renderPanel();stop();
 if(mode.value==='enhanced'){if(engine)syncSelection();else load().catch(()=>{})}
}
function languageChanged(){
 stop();
 // Re-select the saved Piper voice immediately for the newly selected language.
 // The engine and this controller both listen for language changes; this is
 // safe even when both notifications arrive for the same selection.
 selectionLanguage='';selectionSignature='';
 if(engine)syncSelection(true);
 else if(mode.value==='enhanced')load().then(()=>syncSelection(true)).catch(()=>{});
 else status('Piper waiting for '+learn.value);
}
mode.addEventListener('change',update);
learn.addEventListener('change',languageChanged);
window.addEventListener('tb-master-language-change',()=>{
 // The engine dispatches this after the native change event. Avoid resetting
 // the dropdown a second time if the language has already been handled.
 if(selectionLanguage!==learn.value)languageChanged();
});
select.addEventListener('change',()=>{
 stop();save(learn.value,select.value);status('Piper selected: '+select.value);
});
loadBtn.addEventListener('click',()=>{stop();load().then(()=>syncSelection()).catch(()=>{})});
window.tbAdventurePiperSpeak=function(text,rate,onComplete,onPlaybackStart){
 if(mode.value!=='enhanced'||!text)return false;
 stop();const ticket=token,languageAtStart=learn.value;
 // Snapshot the requested voice once; never call syncSelection during synthesis.
 (async()=>{
  try{
   const m=await load();
   if(ticket!==token||mode.value!=='enhanced'||learn.value!==languageAtStart)return;
   // Verify the voice against the language *at speech time*, not the
   // previously selected dropdown value. No page refresh is necessary.
   if(selectionLanguage!==languageAtStart ||
      !available(languageAtStart).includes(select.value))syncSelection(true);
   const voiceId=select.value;
   if(!voiceId||!available(languageAtStart).includes(voiceId))
    throw Error('No Piper voice available for '+languageAtStart);
   status('Preparing '+voiceId+'…');
   const wav=await m.predict({text:String(text),voiceId},progress=>{
    if(ticket===token&&progress?.total)status('Downloading voice: '+Math.round(progress.loaded/progress.total*100)+'%');
   });
   if(ticket!==token||mode.value!=='enhanced'||select.value!==voiceId||learn.value!==languageAtStart)return;
   const paddedWav=await withAudioLeadIn(wav);
   if(ticket!==token||mode.value!=='enhanced')return;
   currentUrl=URL.createObjectURL(paddedWav);
   const audio=new Audio(currentUrl);currentAudio=audio;
   audio.playbackRate=typeof rate==='number'&&rate>0?rate:1;
   audio.addEventListener('ended',()=>{
    if(ticket!==token)return;
    currentAudio=null;
    if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null}
    status('Piper ready: '+voiceId);onComplete?.();
   },{once:true});
   await audio.play();if(ticket===token){onPlaybackStart?.(Number.isFinite(audio.duration)&&audio.duration>0?audio.duration/audio.playbackRate:null);status('Playing: '+voiceId)}
  }catch(e){if(ticket===token){status('Piper failed: '+(e?.message||e));console.error(e);onComplete?.()}}
 })();return true;
};
update();
})();
