
(function(){
 'use strict';
 const card=document.querySelector('.tab-master-card');
 if(!card)return;
 const row=card.querySelector('.controls');
 if(!row)return;
 let phrase=document.getElementById('nextPhrase');
 let next=document.getElementById('nextChallenge');
 if(!next){next=document.createElement('button');next.id='nextChallenge';next.type='button';next.textContent='Next →';next.hidden=true;row.appendChild(next)}
 if(!phrase){phrase=document.createElement('button');phrase.id='nextPhrase';phrase.type='button';phrase.textContent='Next →';phrase.hidden=true;row.appendChild(phrase);
   // Pages without an original Next phrase handler: alternate the two lesson sentences.
   let index=1;
   phrase.addEventListener('click',function(){
     if(typeof activeLesson==='undefined'||!activeLesson||typeof lessons==='undefined')return;
     const pair=lessons[document.getElementById('lang').value]?.[activeLesson];
     if(!pair||pair.length<2)return;
     index=1-index;
     const text=pair[index];
     const line=document.getElementById('line'),translation=document.getElementById('translation');
     if(line)line.textContent=text;
     if(translation)translation.textContent=document.getElementById('lang').value==='en'?'':(lessons.en?.[activeLesson]?.[index]||'');
     if(typeof speak==='function')speak(text);
   });
   document.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>{index=1}));
 }
 // Some older master-template scripts rename every button beginning with "Next".
 // Restore the correct labels after those scripts run.
 function sync(){
   const ch=(typeof challenge==='number'&&challenge>=0);
   const act=(typeof activeLesson==='string'&&!!activeLesson&&!ch);
   next.textContent='Next →';phrase.textContent='Next →';
   next.hidden=!ch;phrase.hidden=!act;
   next.style.setProperty('display',ch?'inline-block':'none','important');
   phrase.style.setProperty('display',act?'inline-block':'none','important');
 }
 next.addEventListener('click',function(){
   const buttons=[...document.querySelectorAll('.tab-master-panel [data-ch],.panel [data-ch]')];
   if(!buttons.length||typeof challenge!=='number'||challenge<0)return;
   const current=buttons.findIndex(b=>Number(b.dataset.ch)===challenge);
   buttons[(current+1)%buttons.length].click();sync();
 });
 document.querySelectorAll('[data-ch],[data-lesson],#discovery').forEach(b=>b.addEventListener('click',sync));
 // Original hotspot handlers may reset the active lesson without changing challenge mode.
 document.querySelectorAll('.hotspot').forEach(h=>h.addEventListener('click',sync));
 document.addEventListener('click',function(e){if(e.target.closest('.hotspot'))requestAnimationFrame(sync)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
})();
