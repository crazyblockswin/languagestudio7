
(()=>{
if(window.__tbNewHotspotLiveClick)return;window.__tbNewHotspotLiveClick=true;
const codes={es:'es-ES',fr:'fr-FR',en:'en-US',de:'de-DE',it:'it-IT',pt:'pt-PT',no:'nb-NO',el:'el-GR'};
let currentSound=null, soundTimer=null;
function lang(){try{return document.querySelector('[id$="Language"]')?.value||localStorage.getItem('talkabee-learn-language')||'en'}catch(e){return 'en'}}
function translation(el,l){const en=el.dataset.tbEn||el.dataset.en||el.dataset.word||el.dataset.object||'';return l==='en'?en:(el.dataset['tb'+l.charAt(0).toUpperCase()+l.slice(1)]||en)}
function soundAfterVoice(el){
 clearTimeout(soundTimer);
 if(currentSound){try{currentSound.pause();currentSound.currentTime=0}catch(e){}currentSound=null}
 const path=(el.getAttribute('data-sound')||'').trim();if(!path)return;
 // The editor stores a path relative to the HTML page. Use that exact saved path.
 soundTimer=setTimeout(()=>{try{const audio=new Audio(path);currentSound=audio;audio.play().catch(e=>console.warn('Talk A Bee sound could not play:',path,e));audio.onended=()=>{if(currentSound===audio)currentSound=null}}catch(e){console.warn('Talk A Bee sound error:',path,e)}},1500);
}
document.addEventListener('click',function(ev){
 if(document.body.classList.contains('tb-hs-editing'))return;
 const el=ev.target.closest&&ev.target.closest('[data-tb-custom="1"]');if(!el)return;
 // If the Adventure already owns this hotspot's click handler, let it run.
 // Blocking propagation here previously prevented native challenge scoring.
 // The batch-repaired HTML keeps the challenge card visible during scoring.
 if(typeof el.onclick==='function')return;
 ev.preventDefault();ev.stopPropagation();
 const l=lang(),txt=translation(el,l),en=translation(el,'en'),key=el.dataset.word||el.dataset.object||en;
 try{
   // Custom hotspots intercept clicks before the original challenge checker.
   // Keep the challenge prompt intact and provide the same answer feedback.
   const inChallenge=(typeof challenge==='number'&&challenge>=0);
   if(inChallenge){
     const correct=(typeof challengeOrder!=='undefined'&&key===challengeOrder[challenge]);
     const feedback=document.getElementById('status');
     if(feedback){
       feedback.textContent=correct?'✓ Nice find!':'Not that one — keep looking.';
       feedback.style.setProperty('color',correct?'#35e46a':'#ffe28a','important');
     }
   }else if(typeof showWord==='function')showWord(key);
   else{const line=document.querySelector('[id$="Line"]');const trans=document.querySelector('[id$="Translation"]');if(line)line.textContent=txt;if(trans)trans.textContent=l==='en'?'':en}
 }catch(e){console.warn('Talk A Bee challenge feedback:',e)}
 try{if(typeof speak==='function')speak(txt,.82);else if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang=codes[l]||l;u.rate=.82;speechSynthesis.speak(u)}}catch(e){}
 // Always schedule assigned MP3, regardless of which speech function exists.
 soundAfterVoice(el);
},true);
})();
