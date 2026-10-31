
(function(){
 const bar=document.getElementById('tb-hs-editor');if(!bar)return;
 const buttons=[...document.querySelectorAll('[data-ch]')];
 const dataTag=document.getElementById('talkabee-challenge-data');
 const btn=document.createElement('button');btn.id='tb-challenge-open';btn.type='button';btn.textContent='Edit Challenges';
 bar.insertBefore(btn,bar.querySelector('button:nth-last-child(2)'));
 const panel=document.createElement('div');panel.id='tb-challenge-panel';
 panel.innerHTML='<div id="tb-challenge-drag" title="Drag to move this editor"><h3>↕ Edit Six Challenges</h3><small>Drag here to move</small></div><div>Choose a challenge, then assign an existing hotspot. Changes are included when you save or export HTML.</div><label for="tb-ch-number">Challenge</label><select id="tb-ch-number"></select><label for="tb-ch-hotspot">Find this hotspot</label><select id="tb-ch-hotspot"></select><label for="tb-ch-text">Challenge wording (English)</label><input id="tb-ch-text" maxlength="110" placeholder="Find the balloon basket"><div class="tb-ch-warning" id="tb-ch-warning"></div><button type="button" id="tb-ch-apply">Apply Challenge</button><button type="button" id="tb-ch-close">Close</button>';
 document.body.appendChild(panel);
 // Drag the popup using its heading; leave form controls and hotspot editing alone.
 const handle=panel.querySelector('#tb-challenge-drag');
 let drag=null;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  e.preventDefault();
  const r=panel.getBoundingClientRect();
  panel.style.left=r.left+'px';panel.style.top=r.top+'px';
  panel.style.right='auto';panel.style.bottom='auto';
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,w:r.width,h:r.height};
  handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  panel.style.left=clamp(drag.left+e.clientX-drag.x,0,Math.max(0,innerWidth-drag.w))+'px';
  panel.style.top=clamp(drag.top+e.clientY-drag.y,0,Math.max(0,innerHeight-drag.h))+'px';
 });
 const finish=e=>{if(drag&&e.pointerId===drag.id){drag=null;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId)}};
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 const number=panel.querySelector('#tb-ch-number'),target=panel.querySelector('#tb-ch-hotspot'),wording=panel.querySelector('#tb-ch-text'),warning=panel.querySelector('#tb-ch-warning');
 const all=()=>[...document.querySelectorAll('.hotspot[data-word]')];
 const nameOf=h=>h.dataset.tbEn||h.dataset.en||h.getAttribute('aria-label')||h.dataset.word;
 const existing=()=>{try{return JSON.parse(dataTag.textContent||'[]')}catch(e){return []}};
 function applySaved(){existing().forEach((v,i)=>{if(i>=buttons.length||!v)return;if(v.key)challengeOrder[i]=v.key;if(v.text)buttons[i].textContent=(i+1)+'. '+v.text})}
 applySaved();
 function refresh(){
  const i=Number(number.value)||0, key=challengeOrder[i];
  const found=new Map();all().forEach(h=>{if(!found.has(h.dataset.word))found.set(h.dataset.word,nameOf(h))});
  target.replaceChildren();
  for(const [k,label] of found){const o=document.createElement('option');o.value=k;o.textContent=label+' ['+k+']';target.appendChild(o)}
  if(found.has(key))target.value=key;
  wording.value=buttons[i].textContent.replace(/^\d+\.\s*/, '');
  warning.textContent=!found.size?'No hotspots remain on this page.':(!found.has(key)?'This challenge points to a deleted or missing hotspot. Choose a replacement.':'');
 }
 buttons.forEach((b,i)=>{const o=document.createElement('option');o.value=i;o.textContent='Challenge '+(i+1);number.appendChild(o)});
 number.onchange=refresh;
 panel.querySelector('#tb-ch-close').onclick=()=>panel.style.display='none';
 panel.querySelector('#tb-ch-apply').onclick=()=>{
  const i=Number(number.value),key=target.value,text=wording.value.trim();
  if(!key||!all().some(h=>h.dataset.word===key)){warning.textContent='Select a hotspot that exists.';return}
  if(!text){warning.textContent='Enter a challenge prompt.';return}
  challengeOrder[i]=key;buttons[i].textContent=(i+1)+'. '+text;
  const saved=buttons.map((b,j)=>({key:challengeOrder[j],text:b.textContent.replace(/^\d+\.\s*/, '')}));
  dataTag.textContent=JSON.stringify(saved).replace(/</g,'\\u003c');
  warning.textContent='Saved into this page. Use Save Working HTML to keep it.';
  if(typeof clearChallenge==='function')clearChallenge();
 };
 btn.onclick=()=>{panel.style.display=panel.style.display==='block'?'none':'block';if(panel.style.display==='block')refresh()};
 // Follow the existing hotspot editor's open/close state without changing its behavior.
 const toggle=bar.querySelector('button');
 toggle.addEventListener('click',()=>{btn.style.display=document.body.classList.contains('tb-hs-editing')?'inline-block':'none';if(!document.body.classList.contains('tb-hs-editing'))panel.style.display='none'});
 // Keep the challenge picker updated after hotspot deletion.
 bar.addEventListener('click',e=>{if(e.target.textContent==='Delete Hotspot'&&panel.style.display==='block')setTimeout(refresh,0)});
})();
