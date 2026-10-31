/* tb-studio-runtime */

(function(){'use strict';
 const $=id=>document.getElementById(id),studio=$('tb-studio'),launch=$('tb-studio-launch'),mode=$('tb-studio-mode');
 const scene=$('world');if(!scene)return;
 const backLayer=document.createElement('div');backLayer.id='tb-overlay-back-layer';scene.appendChild(backLayer);
 const layer=document.createElement('div');layer.id='tb-overlay-layer';scene.appendChild(layer);
 let overlays=[],selected=null,history=[],future=[],drag=null,muted=false;
 try{overlays=JSON.parse($('tb-overlay-data').textContent||'[]');if(!Array.isArray(overlays))overlays=[]}catch(e){overlays=[]}
 const safe=o=>({id:String(o.id||('overlay-'+Date.now())),src:String(o.src||'').replace(/^images\/PNG\//i,'images/png/'),x:Number(o.x)||0,y:Number(o.y)||0,w:Number(o.w)||12,rotation:Number(o.rotation)||0,z:Number(o.z)||1,plane:o.plane==='back'?'back':'front'});
 overlays=overlays.filter(o=>o&&typeof o.src==='string').map(safe);
 function sync(){ $('tb-overlay-data').textContent=JSON.stringify(overlays); }
 function snapshot(){history.push(JSON.stringify(overlays));if(history.length>50)history.shift();future=[]}
 function refresh(){layer.replaceChildren();backLayer.replaceChildren();const select=$('tb-overlay-items');select.replaceChildren(new Option('Select an overlay',''));
  overlays.forEach((o,i)=>{const img=document.createElement('img');img.className='tb-overlay'+(selected===o.id?' tb-selected':'');img.dataset.id=o.id;img.src=o.src;img.alt='Decorative overlay '+(i+1);img.draggable=false;img.style.left=o.x+'%';img.style.top=o.y+'%';img.style.width=o.w+'%';img.style.height='auto';img.style.zIndex=o.z;img.style.transform='rotate('+o.rotation+'deg)';(o.plane==='back'?backLayer:layer).appendChild(img);select.add(new Option('Image '+(i+1),o.id));});
  if(selected&&!overlays.some(o=>o.id===selected))selected=null;select.value=selected||'';const o=overlays.find(x=>x.id===selected);$('tb-overlay-width').value=o?o.w:'';$('tb-overlay-rotate').value=o?o.rotation:'';sync(); }
 function choose(id){selected=id||null;refresh()}
 function closeLegacy(){document.body.classList.remove('tb-hs-editing');const ch=$('tb-challenge-panel');if(ch)ch.style.display='none';}
 function setMode(v){closeLegacy();document.body.classList.toggle('tb-overlay-editing',v==='overlay');document.querySelectorAll('#tb-studio .tb-studio-panel').forEach(p=>p.classList.toggle('active',p.id==='tb-studio-'+v));}
 mode.addEventListener('change',()=>setMode(mode.value));
 launch.onclick=()=>{studio.style.display='block';launch.style.display='none'};
 $('tb-studio-close').onclick=()=>{setMode('none');mode.value='none';studio.style.display='none';launch.style.display='block'};
 $('tb-studio-min').onclick=()=>{muted=!muted;$('tb-studio-main').hidden=muted;studio.style.height=muted?'auto':'';};
 // Keep legacy editor scripts as the source of truth. Do not replace their handlers.
 $('tb-studio-hs-open') && ($('tb-studio-hs-open').onclick=()=>{const hs=$('tb-hs-editor');if(!hs){alert('Hotspot Editor could not initialize.');return;}hs.style.display='flex';const toggle=hs.querySelector('button');if(toggle&&!document.body.classList.contains('tb-hs-editing'))toggle.click();});
 $('tb-studio-ch-open') && ($('tb-studio-ch-open').onclick=()=>{const ch=$('tb-challenge-panel');if(ch){ch.style.display='block';ch.style.right='16px';ch.style.bottom='92px';const opener=$('tb-challenge-open');if(opener)opener.click();if(opener)opener.click();}else alert('The Challenge Editor has not loaded.');});
 const title=$('tb-studio-drag');title.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=studio.getBoundingClientRect();drag={type:'studio',dx:e.clientX-r.left,dy:e.clientY-r.top};title.setPointerCapture(e.pointerId)});
 title.addEventListener('pointermove',e=>{if(!drag||drag.type!=='studio')return;studio.style.left=Math.max(0,Math.min(innerWidth-60,e.clientX-drag.dx))+'px';studio.style.top=Math.max(0,Math.min(innerHeight-35,e.clientY-drag.dy))+'px';});title.addEventListener('pointerup',()=>drag=null);title.addEventListener('pointercancel',()=>drag=null);
 function add(src){if(!src)return;snapshot();const id='overlay-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);overlays.push({id,src,x:45,y:35,w:12,rotation:0,z:overlays.length+1,plane:'front'});choose(id)}
 $('tb-overlay-add-path').onclick=()=>{const src=$('tb-overlay-path').value.trim().replace(/^images\/PNG\//i,'images/png/');if(!src||/^(javascript:|https?:|\/\/)/i.test(src)){alert('Enter a relative image path from your website, such as images/png/bee.png');return;}add(src)};
 // Keep image bytes outside the HTML. Firefox downloads the chosen files;
 // the user places them in images/png/ before publishing the HTML.
 const pendingOverlayFiles=new Map();
 const overlayFolder='images/png/';
 function overlayFilename(name){return String(name||'overlay.png').replace(/[\\/]/g,'_').replace(/[^a-zA-Z0-9._-]/g,'_');}
 function downloadOverlayFile(file){
   const url=URL.createObjectURL(file),a=document.createElement('a');
   a.href=url;a.download=overlayFilename(file.name);document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 $('tb-overlay-file').onchange=async e=>{
   const files=[...e.target.files];
   for(const f of files){
     if(!/^image\/(png|webp|jpeg|gif)$/i.test(f.type))continue;
     const filename=overlayFilename(f.name),src=overlayFolder+filename;
     if(pendingOverlayFiles.has(src)&&pendingOverlayFiles.get(src)!==f){
       alert('An overlay with this filename was already selected. Rename one of the images to avoid overwriting it.');continue;
     }
     pendingOverlayFiles.set(src,f);
     add(src);
   }
   e.target.value='';
 };
 // Allow the save runtime to download only files still referenced by overlays.
 window.tbStudioOverlayAssets={
   pending:()=>[...pendingOverlayFiles].filter(([src])=>overlays.some(o=>o.src===src)),
   hasEmbedded:()=>overlays.some(o=>/^data:image\//i.test(o.src)),
   download:downloadOverlayFile
 };
 const pathInput=$('tb-overlay-path');if(pathInput)pathInput.placeholder='images/png/bee.png';
 const overlayNote=document.querySelector('#tb-studio-overlay .tb-note:last-of-type');
 if(overlayNote)overlayNote.textContent='Overlays use images/png/ file paths. Save Local Master and Export Server Version download HTML only.';
 $('tb-overlay-items').onchange=e=>choose(e.target.value);
 function edit(prop,value){const o=overlays.find(x=>x.id===selected);if(!o||!Number.isFinite(value))return;snapshot();o[prop]=value;refresh()}
 $('tb-overlay-width').onchange=e=>edit('w',Math.max(1,Math.min(100,Number(e.target.value))));$('tb-overlay-rotate').onchange=e=>edit('rotation',Number(e.target.value));

 // Rebuild each entire control cell once. Old builds left buttons in outer
 // wrappers, so cleaning only the innermost stepper did not remove duplicates.
 function wireStepper(inputId,prop,step,min,max){
   const input=$(inputId);if(!input)return;
   const cell=input.closest('.tb-smallrow > div');if(!cell)return;
   const label=cell.querySelector('label[for="'+inputId+'"]');
   // Detach the original input to preserve its onchange handler and value.
   input.remove();
   // Remove every stale nested wrapper, stray button, and duplicate control.
   cell.replaceChildren();
   if(label)cell.appendChild(label);
   const group=document.createElement('div');group.className='tb-overlay-stepper';
   const minus=document.createElement('button'),plus=document.createElement('button');
   for(const [button,direction] of [[minus,-1],[plus,1]]){
     button.type='button';button.className='tb-overlay-step-button';
     button.textContent=direction<0?'−':'+';
     button.title=(direction<0?'Decrease ':'Increase ')+(prop==='w'?'image width':'image rotation');
     button.setAttribute('aria-label',button.title);
     button.addEventListener('click',()=>{
       const o=overlays.find(x=>x.id===selected);if(!o)return;
       edit(prop,Math.round(Math.max(min,Math.min(max,Number(o[prop])+direction*step))*100)/100);
     });
   }
   input.className='tb-overlay-step-input';input.setAttribute('inputmode','decimal');
   group.append(minus,input,plus);cell.appendChild(group);
 }
 wireStepper('tb-overlay-width','w',0.5,1,100);
 wireStepper('tb-overlay-rotate','rotation',5,-360,360);
 // Scoped controls override the Adventure's global button rules.
 if(!document.getElementById('tb-overlay-stepper-repair')){
   const style=document.createElement('style');style.id='tb-overlay-stepper-repair';
   style.textContent=`#tb-studio-overlay .tb-smallrow{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;min-width:0!important}#tb-studio-overlay .tb-smallrow>div{min-width:0!important}#tb-studio-overlay .tb-overlay-stepper{display:grid!important;grid-template-columns:34px minmax(0,1fr) 34px!important;gap:5px!important;align-items:center!important;width:100%!important;max-width:100%!important;min-width:0!important}#tb-studio-overlay .tb-overlay-stepper .tb-overlay-step-button{display:grid!important;place-items:center!important;box-sizing:border-box!important;width:34px!important;min-width:0!important;max-width:34px!important;height:36px!important;min-height:0!important;margin:0!important;padding:0!important;font:700 20px/1 Arial,sans-serif!important;white-space:nowrap!important}#tb-studio-overlay .tb-overlay-stepper .tb-overlay-step-input{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:36px!important;min-height:0!important;margin:0!important;padding:3px!important;text-align:center!important;font:600 14px/1 Arial,sans-serif!important}#tb-studio-overlay{overflow-x:hidden!important}`;
   document.head.appendChild(style);
 }

 $('tb-overlay-delete').onclick=()=>{if(!selected)return;snapshot();overlays=overlays.filter(o=>o.id!==selected);selected=null;refresh()};
 // These controls change the selected image's position relative to the script card.
 // The front/back layer is stored per image, so local saves and server exports agree.
 const frontButton=$('tb-overlay-front'),backButton=$('tb-overlay-back');
 frontButton.textContent='Bring in Front of Card';backButton.textContent='Send Behind Card';
 frontButton.title='Display the selected image over the script card';
 backButton.title='Display the selected image behind the script card, above the scene';
 // Reuse the existing explanation; older builds added a duplicate every load.
 const oldNotes=[...document.querySelectorAll('#tb-studio-overlay .tb-note')].filter(n=>n.textContent.trim().startsWith('Front/Back places the selected image'));
 const depthNote=oldNotes.shift()||document.createElement('p');
 oldNotes.forEach(n=>n.remove());
 depthNote.className='tb-note';
 depthNote.textContent='Front/Back places the selected image above or behind the script card. Drag to move it; Width (%) changes its size.';
 backButton.insertAdjacentElement('afterend',depthNote);
 function changeDepth(toFront){
   const item=overlays.find(o=>o.id===selected);if(!item){depthNote.textContent='Select an image first.';return;}
   snapshot();item.plane=toFront?'front':'back';
   item.z=Math.max(0,...overlays.filter(o=>o!==item&&o.plane===item.plane).map(o=>o.z))+1;
   refresh();
   depthNote.textContent=toFront?'Image is now IN FRONT of the script card.':'Image is now BEHIND the script card. Select it from the image list if the card covers it.';
 }
 frontButton.onclick=()=>changeDepth(true);
 backButton.onclick=()=>changeDepth(false);
 $('tb-overlay-undo').onclick=()=>{if(!history.length)return;future.push(JSON.stringify(overlays));overlays=JSON.parse(history.pop());refresh()};$('tb-overlay-redo').onclick=()=>{if(!future.length)return;history.push(JSON.stringify(overlays));overlays=JSON.parse(future.pop());refresh()};
 [layer,backLayer].forEach(overlayLayer=>overlayLayer.addEventListener('pointerdown',e=>{if(!document.body.classList.contains('tb-overlay-editing'))return;const img=e.target.closest('.tb-overlay');if(!img)return;e.preventDefault();e.stopPropagation();selected=img.dataset.id;const o=overlays.find(x=>x.id===selected);if(!o)return;snapshot();const r=scene.getBoundingClientRect();drag={type:'overlay',id:selected,x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,w:r.width,h:r.height};img.setPointerCapture(e.pointerId);refreshControls();}));
 function refreshControls(){const o=overlays.find(x=>x.id===selected);$('tb-overlay-items').value=selected||'';$('tb-overlay-width').value=o?o.w:'';$('tb-overlay-rotate').value=o?o.rotation:'';document.querySelectorAll('#tb-overlay-layer .tb-overlay,#tb-overlay-back-layer .tb-overlay').forEach(x=>x.classList.toggle('tb-selected',x.dataset.id===selected));}
 [layer,backLayer].forEach(overlayLayer=>overlayLayer.addEventListener('pointermove',e=>{if(!drag||drag.type!=='overlay')return;const o=overlays.find(x=>x.id===drag.id);if(!o)return;o.x=Math.max(-100,Math.min(100,drag.ox+(e.clientX-drag.x)/drag.w*100));o.y=Math.max(-100,Math.min(100,drag.oy+(e.clientY-drag.y)/drag.h*100));const img=document.querySelector('.tb-overlay[data-id="'+o.id+'"]');if(img){img.style.left=o.x+'%';img.style.top=o.y+'%'}sync();}));
 [layer,backLayer].forEach(overlayLayer=>{overlayLayer.addEventListener('pointerup',()=>{drag=null;refresh()});overlayLayer.addEventListener('pointercancel',()=>{drag=null;refresh()});});
 $('tb-overlay-export').onclick=()=>{sync();$('tb-studio-save-local')?.click();};
 refresh();setMode('none');
})();


/* tb-studio-unified-runtime */

(function(){'use strict';
 const $=id=>document.getElementById(id);
 const studio=$('tb-studio'),mode=$('tb-studio-mode'),hs=$('tb-hs-editor'),ch=$('tb-challenge-panel');
 if(!studio||!hs)return;
 if(!ch){const opt=mode.querySelector('option[value="challenge"]');if(opt){opt.disabled=true;opt.textContent='Challenge Editor (not installed on this Adventure)';}}
 const hp=$('tb-studio-hotspot'),cp=$('tb-studio-challenge');
 hp.replaceChildren(hs);if(ch)cp.replaceChildren(ch);
 // Keep original editor logic intact: only its buttons are used to enter/exit editing.
 const toggle=hs.querySelector('button');
 function stopHotspot(){if(document.body.classList.contains('tb-hs-editing'))toggle.click()}
 function startHotspot(){if(!document.body.classList.contains('tb-hs-editing'))toggle.click()}
 function switchTo(value){
   if(value!=='hotspot')stopHotspot();
   if(value==='hotspot')startHotspot();
   if(ch)ch.style.display=value==='challenge'?'block':'none';
 }
 mode.addEventListener('change',()=>switchTo(mode.value));
 $('tb-studio-hs-open')?.remove();$('tb-studio-ch-open')?.remove();
 if(!hp.querySelector('.tb-note'))hp.insertAdjacentHTML('afterbegin','<p class="tb-note">Select a hotspot in the scene to edit it. Move this whole window by its title bar.</p>');
 if(!cp.querySelector('.tb-note'))cp.insertAdjacentHTML('afterbegin','<p class="tb-note">Choose a challenge and assign its answer below.</p>');
 // Original challenge panel uses a draggable heading; disable its drag capture now that it is docked.
 const handle=$('tb-challenge-drag');
 handle?.addEventListener('pointerdown',e=>e.stopImmediatePropagation(),true);
 // Legacy close hides the challenge panel; switching back should show it again.
 $('tb-ch-close')?.addEventListener('click',()=>{mode.value='none';mode.dispatchEvent(new Event('change'));},true);
 $('tb-studio-close').addEventListener('click',()=>stopHotspot());
 // Refresh challenge options through the existing opener without displaying a second popup.
 function refreshChallenge(){const opener=$('tb-challenge-open');if(!opener)return;
   if(!ch)return;ch.style.display='none';opener.click();ch.style.display='block';}
 mode.addEventListener('change',()=>{if(mode.value==='challenge'&&ch)refreshChallenge()});
 // Preserve a stable toolbar when the Studio is minimized.
 switchTo(mode.value);
})();


/* tb-studio-large-resize-grip-script */

(function(){
 const panel=document.getElementById('tb-studio');if(!panel)return;
 const grip=document.createElement('div');grip.id='tb-studio-resize-grip';
 grip.title='Drag to resize the Studio wider or taller';
 grip.setAttribute('role','separator');grip.setAttribute('aria-label','Resize Studio');
 grip.textContent='↘';panel.appendChild(grip);
 grip.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  const startX=e.clientX,startY=e.clientY;
  const rect=panel.getBoundingClientRect(),startW=rect.width,startH=rect.height;
  grip.setPointerCapture(e.pointerId);
  function move(ev){
   const maxW=Math.max(265,innerWidth-rect.left-8);
   const maxH=Math.max(180,innerHeight-rect.top-8);
   panel.style.width=Math.max(265,Math.min(maxW,startW+ev.clientX-startX))+'px';
   panel.style.height=Math.max(180,Math.min(maxH,startH+ev.clientY-startY))+'px';
  }
  function done(){grip.removeEventListener('pointermove',move);grip.removeEventListener('pointerup',done);grip.removeEventListener('pointercancel',done);}
  grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',done);grip.addEventListener('pointercancel',done);
 });
})();


/* tb-studio-save-runtime */

(function(){
'use strict';
const $=id=>document.getElementById(id);
const studio=$('tb-studio'),status=$('tb-studio-save-status');
if(!studio)return;
const hs=$('tb-hs-editor');
if(hs){[...hs.querySelectorAll('button')].filter(b=>/^(Save Working HTML|Export Server HTML)$/.test(b.textContent.trim())).forEach(b=>b.dataset.tbOldSave='1');}
let dirty=false;
function markDirty(){dirty=true;status.textContent='● Unsaved changes';status.classList.add('tb-unsaved');}
function markDownloaded(which){dirty=false;status.textContent=which+' downloaded';status.classList.remove('tb-unsaved');}
function serialize(server){
 const clone=document.documentElement.cloneNode(true);
 const body=clone.querySelector('body');
 // Runtime-only editing surfaces should never be baked into the exported page.
 clone.querySelector('#tb-overlay-layer')?.remove();
 clone.querySelector('#tb-overlay-back-layer')?.remove();
 clone.querySelector('#talkabee-object-popup')?.remove();
 clone.querySelectorAll('.tb-hs-handle').forEach(x=>x.remove());
 clone.querySelectorAll('.tb-hs-active,.scene-only,.activity-collapsed').forEach(x=>x.classList.remove('tb-hs-active','scene-only','activity-collapsed'));
 body?.classList.remove('tb-hs-editing','tb-overlay-editing','scene-view');
 clone.querySelectorAll('#sceneView,#sceneViewToggle').forEach(x=>x.setAttribute('aria-pressed','false'));
 // The legacy editors build their own UI at startup. Remove the docked live UI
 // so it is recreated once, cleanly, on the next local open.
 clone.querySelector('#tb-hs-editor')?.remove();
 clone.querySelector('#tb-challenge-panel')?.remove();
 if(server){
   const removeIds=[
    'talkabee-hotspot-editor-style','talkabee-hotspot-editor-v10',
    'talkabee-hotspot-editor-script','talkabee-challenge-editor-style',
    'talkabee-challenge-editor-script','tb-studio-style','tb-studio-runtime',
    'tb-studio-unified-style','tb-studio-size-refinement',
    'tb-studio-default-position-tweak','tb-studio-large-resize-grip-style',
    'tb-studio-unified-runtime','tb-studio-large-resize-grip-script',
    'tb-studio-save-style','tb-studio-save-runtime'
   ];
   removeIds.forEach(id=>clone.querySelector('#'+id)?.remove());
   clone.querySelector('#tb-studio')?.remove();
   clone.querySelector('script[data-tb-shared-studio]')?.remove();
   clone.querySelector('link[data-tb-shared-studio]')?.remove();
   clone.querySelector('#tb-studio-music-style')?.remove();
   clone.querySelector('#tb-studio-music-runtime')?.remove();
   clone.querySelector('#tb-studio-launch')?.remove();
   clone.querySelector('#tb-hs-readout')?.remove();
   // Retain saved overlay data, but replace the editing engine with a
   // tiny display-only renderer so public visitors see the PNGs.
   const runtime=clone.querySelector('#tb-overlay-data');
   if(runtime){
     const css=clone.ownerDocument.createElement('style');
     css.id='tb-overlay-public-style';
     css.textContent='#world>.tab-master-card,#world>.card{position:relative;z-index:2147483007!important}#tb-overlay-layer,#tb-overlay-back-layer{position:absolute;inset:0;pointer-events:none}#tb-overlay-layer{z-index:2147483008}#tb-overlay-back-layer{z-index:2147483006}#tb-overlay-layer img,#tb-overlay-back-layer img{position:absolute;pointer-events:none;user-select:none;transform-origin:center;object-fit:contain}';
     const script=clone.ownerDocument.createElement('script');
     script.id='tb-overlay-public-runtime';
     script.textContent=`(function(){const scene=document.getElementById('world'),data=document.getElementById('tb-overlay-data');if(!scene||!data)return;let items=[];try{items=JSON.parse(data.textContent||'[]')}catch(e){}const back=document.createElement('div');back.id='tb-overlay-back-layer';scene.appendChild(back);const layer=document.createElement('div');layer.id='tb-overlay-layer';scene.appendChild(layer);items.forEach(o=>{if(!o||typeof o.src!=='string')return;const im=document.createElement('img');im.src=o.src;im.alt='';im.draggable=false;im.style.left=Number(o.x||0)+'%';im.style.top=Number(o.y||0)+'%';im.style.width=Number(o.w||12)+'%';im.style.transform='rotate('+Number(o.rotation||0)+'deg)';im.style.zIndex=String(Number(o.z||1));(o.plane==='back'?back:layer).appendChild(im)})})();`;
     runtime.parentNode.insertBefore(css,runtime.nextSibling);
     css.parentNode.insertBefore(script,css.nextSibling);
   }
 }else{
   const player=clone.querySelector('#tb-music-audio');
   if(player){player.removeAttribute('src');player.removeAttribute('preload');}
   const f=clone.querySelector('#tb-music-file');if(f)f.value='';
   const tr=clone.querySelector('#tb-music-track');if(tr)tr.textContent='No music selected';
   ['tb-music-play','tb-music-stop'].forEach(id=>{const b=clone.querySelector('#'+id);if(b)b.disabled=true;});
   const c=clone.querySelector('#tb-studio');
   if(c){c.style.display='none';c.style.removeProperty('height');c.style.removeProperty('width');c.style.removeProperty('top');c.style.removeProperty('left');}
   const launcher=clone.querySelector('#tb-studio-launch');
   if(launcher)launcher.style.display='';
   const main=clone.querySelector('#tb-studio-main');
   if(main)main.hidden=false;
   const mode=clone.querySelector('#tb-studio-mode');
   if(mode){mode.value='none';[...mode.options].forEach(o=>o.selected=o.value==='none');}
   clone.querySelectorAll('.tb-studio-panel').forEach(x=>x.classList.remove('active'));
   // Export the canonical controls, not runtime-added wrappers or messages.
   clone.querySelector('#tb-overlay-stepper-repair')?.remove();
   // Save a clean canonical stepper even if a previous build left nested buttons.
   for(const id of ['tb-overlay-width','tb-overlay-rotate']){
     const input=clone.querySelector('#'+id);if(!input)continue;
     const cell=input.closest('.tb-smallrow > div');if(!cell)continue;
     const label=cell.querySelector('label[for="'+id+'"]');
     input.remove();cell.replaceChildren();
     if(label)cell.appendChild(label);
     const group=clone.ownerDocument.createElement('div');group.className='tb-overlay-stepper';
     for(const sign of ['−','+']){
       const button=clone.ownerDocument.createElement('button');
       button.type='button';button.className='tb-overlay-step-button';button.textContent=sign;
       if(sign==='−')group.appendChild(button);
       else {group.appendChild(input);group.appendChild(button);}
     }
     cell.appendChild(group);
   }
   const depthNotes=[...clone.querySelectorAll('#tb-studio-overlay .tb-note')].filter(n=>n.textContent.trim().startsWith('Front/Back places the selected image'));
   depthNotes.slice(1).forEach(n=>n.remove());
   clone.querySelector('#tb-studio-resize-grip')?.remove();
   const stat=clone.querySelector('#tb-studio-save-status');
   if(stat){stat.textContent='Ready';stat.classList.remove('tb-unsaved');}
 }
 return '<!doctype html>\n'+clone.outerHTML;
}
function download(server){
 try{
  const assets=window.tbStudioOverlayAssets;
  if(assets?.hasEmbedded()){
    alert('This Adventure still contains an older Base64 overlay. Remove and re-add that image using a PNG file or an existing website path before exporting.');
    status.textContent='Export blocked: embedded image';return;
  }
  // Overlay assets are already managed in the website images/PNG folder.
  // Saving either HTML version must never trigger image downloads or confirmations.
  const html=serialize(server);
  // Use the currently opened Adventure, never the Airplane pilot's name.
  const opened=decodeURIComponent(location.pathname.split('/').pop()||'Talk-A-Bee-Adventure.html');
  const base=opened.replace(/\.html?$/i,'').replace(/-SERVER$/i,'');
  const file=base+'.html';
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  markDownloaded(server?'Server version':'Local master');
 }catch(e){console.error('Talk A Bee save failed',e);status.textContent='Save failed — try again';}
}
$('tb-studio-save-local').addEventListener('click',()=>download(false));
$('tb-studio-save-server').addEventListener('click',()=>download(true));
// Track editor changes without interfering with existing handlers.
document.addEventListener('click',e=>{
 if(e.target.closest('#tb-studio-savebar'))return;
 if(e.target.closest('#tb-hs-editor')&&/^(Add Hotspot|Delete Hotspot|Choose Sound|Remove Sound)$/.test(e.target.textContent.trim()))markDirty();
 if(e.target.id==='tb-ch-apply'||e.target.id==='tb-overlay-add-path'||e.target.id==='tb-overlay-delete'||e.target.id==='tb-overlay-front'||e.target.id==='tb-overlay-back'||e.target.id==='tb-overlay-undo'||e.target.id==='tb-overlay-redo')markDirty();
},true);
document.addEventListener('change',e=>{
 if(e.target.closest('#tb-studio-overlay')||e.target.id==='tb-ch-hotspot'||e.target.id==='tb-ch-text')markDirty();
},true);
document.addEventListener('pointerup',e=>{
 if(document.body.classList.contains('tb-hs-editing')&&e.target.closest('.hotspot'))markDirty();
 if(document.body.classList.contains('tb-overlay-editing')&&e.target.closest('.tb-overlay'))markDirty();
},true);
})();


/* tb-studio-music-runtime */

(function(){
 const $=id=>document.getElementById(id);
 const audio=$('tb-music-audio'),file=$('tb-music-file'),play=$('tb-music-play'),stop=$('tb-music-stop'),track=$('tb-music-track');
 if(!audio||!file)return;
 let url=null;
 audio.volume=.35;
 $('tb-music-volume').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;});
 $('tb-music-choose').addEventListener('click',()=>file.click());
 file.addEventListener('change',()=>{
  const chosen=file.files&&file.files[0];if(!chosen)return;
  audio.pause();if(url)URL.revokeObjectURL(url);
  url=URL.createObjectURL(chosen);audio.src=url;audio.load();
  track.textContent=chosen.name;play.disabled=false;stop.disabled=false;
  play.textContent='▶ Play';
 });
 play.addEventListener('click',async()=>{
  if(audio.paused){try{await audio.play();}catch(e){track.textContent='Unable to play this audio file';}}
  else audio.pause();
 });
 stop.addEventListener('click',()=>{audio.pause();audio.currentTime=0;});
 audio.addEventListener('play',()=>{play.textContent='Ⅱ Pause';});
 audio.addEventListener('pause',()=>{play.textContent='▶ Play';});
 audio.addEventListener('ended',()=>{play.textContent='▶ Play';});
 // Local computer file is intentionally not embedded in saved HTML.
 window.addEventListener('pagehide',()=>{audio.pause();if(url)URL.revokeObjectURL(url);});
})();
