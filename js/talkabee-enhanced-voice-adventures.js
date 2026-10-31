(function(){
'use strict';
// Only one shared controller and one Piper panel per Adventure.
if(window.__talkabeeSharedPiperControllerActive)return;
window.__talkabeeSharedPiperControllerActive=true;
// Remove leftover static/legacy Piper panels before creating the shared control.
document.querySelectorAll('#tbPiperPanel').forEach(el=>el.remove());
// Shared Piper controller, isolated to avoid collisions with Adventure globals.
const base=new URL('../piper-matched-118/piper-tts-web.js?voice-switch=1',document.currentScript.src).href;
const language=document.getElementById('lang')||document.getElementById('adventureLanguage')||document.getElementById('trainLanguage')||document.getElementById('birdLanguage')||document.getElementById('hotelLanguage')||document.getElementById('homeLanguage')||document.getElementById('busLanguage')||document.getElementById('seaLanguage')||document.getElementById('language');
const browserVoice=document.getElementById('voice')||document.getElementById('adventureVoice')||document.getElementById('trainVoice')||document.getElementById('birdVoice')||document.getElementById('hotelVoice')||document.getElementById('homeVoice')||document.getElementById('busVoice')||document.getElementById('seaVoice');
if(!language){console.warn('Talk A Bee Piper: language selector missing');return;}
const panel=document.createElement('div');panel.id='tbPiperPanel';panel.style.cssText='margin:10px 0;padding:9px;border:1px solid #a8b2bd;border-radius:9px;background:rgba(22,27,32,.65);color:white;font:14px Arial,sans-serif;';
panel.innerHTML='<label style="display:block;margin-bottom:5px">Voice type <select id="tbPiperMode" style="max-width:100%;color:#111;background:#fff"><option value="standard">Standard</option><option value="enhanced">Enhanced (Piper)</option></select></label><div id="tbPiperOptions" hidden><select id="tbPiperModel" aria-label="Piper voice" style="max-width:100%;color:#111;background:#fff"><option value="">Load voice catalog</option></select> <button type="button" id="tbPiperLoad" style="color:#111;background:#eee">Load voice</button></div><div id="tbPiperStatus" role="status" aria-live="polite" style="font-size:12px;margin-top:5px">Standard voice ready.</div>';
(browserVoice||language).insertAdjacentElement('afterend',panel);
const $=id=>panel.querySelector('#'+id),mode=$('tbPiperMode'),select=$('tbPiperModel'),status=$('tbPiperStatus'),options=$('tbPiperOptions');
const prefix={en:'en_',es:'es_',fr:'fr_',de:'de_',it:'it_',pt:'pt_',no:'no_',nb:'no_',nn:'no_'};
let engine=null,loading=null,catalog=[],audio=null,audioUrl=null,request=0;
const show=s=>status.textContent=s;
const voiceKey='talkabee-piper-voice-';
function savedVoice(){try{return localStorage.getItem(voiceKey+language.value)||''}catch(_){return ''}}
function rememberVoice(){if(select.value)try{localStorage.setItem(voiceKey+language.value,select.value)}catch(_){}}
let selectedLanguage=language.value;
function restoreVoice(){selectedLanguage=language.value;if(engine){choose();show('Piper ready: '+(select.value||'no voice available'));}else{show('Restoring saved Piper voice…');load().catch(()=>{});}}

function stop(){request++;if(audio){try{audio.pause()}catch(_){}audio=null}if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}try{speechSynthesis.cancel()}catch(_){}}
function choose(){const p=prefix[language.value]||'en_',old=savedVoice();const matching=catalog.filter(v=>v.toLowerCase().startsWith(p));select.replaceChildren();for(const id of matching)select.add(new Option(id,id));if(matching.includes(old))select.value=old;else if(matching.length)select.value=matching.find(v=>v.toLowerCase().includes('hfc_female')&&v.includes('medium'))||matching.find(v=>v.includes('medium'))||matching[0];if(select.value&&!old)rememberVoice();else select.add(new Option('No Piper voice for this language',''));}
async function load(){if(engine)return engine;if(loading)return loading;loading=(async()=>{show('Loading Piper catalog…');const m=await import(base);const voices=await m.voices();const ids=Array.isArray(voices)?voices.map(v=>typeof v==='string'?v:(v?.id||v?.key||v?.name||'')).filter(Boolean):Object.keys(voices||{});catalog=ids.filter(id=>Object.values(prefix).some(p=>id.toLowerCase().startsWith(p)));if(!catalog.length)throw Error('No Piper voices available');engine=m;choose();show('Piper ready: '+(select.value||'no voice available')+'. First speech may download the voice model.');return m})();try{return await loading}catch(e){loading=null;show('Piper unavailable: '+(e?.message||e));console.error(e);throw e}}
function update(){options.hidden=mode.value!=='enhanced';try{localStorage.setItem('talkabee-lab-voice-mode',mode.value)}catch(_){}if(mode.value==='enhanced'){if(engine){restoreVoice();}else{load().catch(()=>{});}}else show('Standard voice ready.');}
try{if(localStorage.getItem('talkabee-lab-voice-mode')==='enhanced')mode.value='enhanced'}catch(_){}
mode.addEventListener('change',()=>{stop();update()});language.addEventListener('change',()=>{stop();if(engine){restoreVoice();}});select.addEventListener('change',()=>{stop();rememberVoice();show('Voice selected: '+select.value)});select.addEventListener('input',rememberVoice);$('tbPiperLoad').addEventListener('click',()=>load().catch(()=>{}));
// Some Adventures restore the global learning language after Piper starts.
// Keep the Piper catalog in sync even when those scripts change select.value silently.
setInterval(()=>{if(language.value!==selectedLanguage){restoreVoice();}},400);
// Firefox navigation restoration (including back/forward cache).
window.addEventListener('pageshow',()=>{if(mode.value==='enhanced')restoreVoice();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode.value==='enhanced'&&engine)restoreVoice();});
update();
// Show the saved voice immediately; the catalog later validates and replaces this option.
if(mode.value==='enhanced'&&!engine){const saved=savedVoice();if(saved){select.replaceChildren(new Option(saved,saved));select.value=saved;}}
// Claim Enhanced speech immediately, even while the Piper catalog is still loading.
// Returning false here previously handed speech back to the Adventure's browser TTS.
window.tbAdventurePiperSpeak=function(text,rate,onComplete){
  if(mode.value!=='enhanced'||!text)return false;
  stop();
  const ticket=request;
  (async()=>{
    try{
      if(!engine){
        show('Preparing Piper…');
        await load();
      }
      if(ticket!==request||mode.value!=='enhanced')return;
      // The catalog is ready now. Restore the persisted voice for this language.
      if(!select.value)restoreVoice();
      const voiceId=select.value;
      if(!voiceId)throw new Error('No Piper voice for the selected language');
      show('Preparing Piper voice…');
      const wav=await engine.predict({text:String(text),voiceId},p=>{
        if(ticket===request&&p?.total)show('Downloading voice: '+Math.round(p.loaded/p.total*100)+'%');
      });
      if(ticket!==request||mode.value!=='enhanced'||select.value!==voiceId)return;
      audioUrl=URL.createObjectURL(wav);
      audio=new Audio(audioUrl);
      audio.playbackRate=typeof rate==='number'&&rate>0?rate:1;
      const current=audio;
      current.addEventListener('ended',()=>{
        if(audio!==current)return;
        audio=null;
        if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
        if(ticket===request){show('Piper finished.');onComplete?.();}
      },{once:true});
      await current.play();
      if(ticket===request)show('Enhanced voice playing.');
    }catch(e){
      if(ticket!==request)return;
      console.error('Talk A Bee Piper:',e);
      show('Piper failed: '+(e?.message||e));
      onComplete?.();
    }
  })();
  return true;
};
})();
