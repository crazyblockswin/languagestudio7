
(()=>{
const SEL='.hotspot,.home-hotspot,.yacht-hotspot,.hotspots button,.train-hotspots button';
let editing=false,active=null,adding=false,pendingName='',pendingTranslations=null;
let selectedSoundFile=null;
const all=()=>[...document.querySelectorAll(SEL)].filter(x=>!x.closest('#tb-hs-editor'));
function parentFor(el){return el.offsetParent||el.parentElement||document.body}
function pct(v,n){return +(v/n*100).toFixed(2)}
function cleanActive(){if(active){active.classList.remove('tb-hs-active');active.querySelector(':scope > .tb-hs-handle')?.remove()} active=null}
function select(el){if(!editing||!el)return;cleanActive();active=el;el.classList.add('tb-hs-active');let h=document.createElement('span');h.className='tb-hs-handle';el.appendChild(h);updateSoundUI()}
function semanticNew(name){
 const existing=all()[0]; if(!existing)return null;
 const el=document.createElement('button');el.type='button';
 if(existing.classList.contains('home-hotspot')){el.className='home-hotspot show'}
 else if(existing.classList.contains('yacht-hotspot')){el.className='yacht-hotspot'}
 else if(existing.classList.contains('hotspot')){el.className='hotspot'}
 else if(existing.className)el.className=existing.className;
 if(existing.hasAttribute('data-object'))el.dataset.object=name;else el.dataset.word=name;
 if(existing.hasAttribute('data-en'))el.dataset.en=name;
 if(existing.id&&!existing.hasAttribute('data-word')&&!existing.hasAttribute('data-object'))el.id=name.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
 el.setAttribute('aria-label',name);if(pendingTranslations&&window.TB_registerNewHotspot)window.TB_registerNewHotspot(el,pendingTranslations);
 return el
}
function hotspotContainer(){const e=all()[0];return e?e.parentElement:null}
function placeAt(ev){
 if(!editing||!adding)return;
 const host=hotspotContainer();if(!host)return;
 const el=semanticNew(pendingName);if(!el)return;
 host.appendChild(el);
 const r=parentFor(el).getBoundingClientRect();
 el.style.left=pct(ev.clientX-r.left,r.width)+'%';el.style.top=pct(ev.clientY-r.top,r.height)+'%';el.style.width='6%';el.style.height='8%';
 adding=false;pendingName='';pendingTranslations=null;nameBox.value='';select(el);ev.preventDefault();ev.stopPropagation();
}
function startDrag(ev,el){
 if(!editing||adding)return; if(ev.target.classList.contains('tb-hs-handle'))return;
 select(el);ev.preventDefault();ev.stopPropagation();
 const p=parentFor(el),r=p.getBoundingClientRect();let sx=ev.clientX,sy=ev.clientY;
 let l=parseFloat(el.style.left)||pct(el.offsetLeft,r.width),t=parseFloat(el.style.top)||pct(el.offsetTop,r.height);
 const move=e=>{el.style.left=(l+(e.clientX-sx)/r.width*100).toFixed(2)+'%';el.style.top=(t+(e.clientY-sy)/r.height*100).toFixed(2)+'%'};
 const up=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true)};
 window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true)
}
function startResize(ev,el){
 if(!editing)return;ev.preventDefault();ev.stopPropagation();
 const p=parentFor(el),r=p.getBoundingClientRect();let sx=ev.clientX,sy=ev.clientY;
 let w=parseFloat(el.style.width)||pct(el.offsetWidth,r.width),h=parseFloat(el.style.height)||pct(el.offsetHeight,r.height);
 const move=e=>{el.style.width=Math.max(1,w+(e.clientX-sx)/r.width*100).toFixed(2)+'%';el.style.height=Math.max(1,h+(e.clientY-sy)/r.height*100).toFixed(2)+'%'};
 const up=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true)};
 window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true)
}
function soundPath(el){return el&&el.dataset?String(el.dataset.sound||'').trim():''}
function soundLabel(path){return path?path.split('/').pop():'No sound'}
function updateSoundUI(){if(typeof soundName==='undefined')return;const p=soundPath(active);soundName.textContent=active?soundLabel(p):'Select a hotspot';removeSound.disabled=testSound.disabled=!active||!p;chooseSound.disabled=!active}
function stopEditorPreview(){if(window.__tbHsPreview){try{window.__tbHsPreview.pause();window.__tbHsPreview.currentTime=0}catch(e){}window.__tbHsPreview=null}}
function previewSound(){if(!active)return;stopEditorPreview();let src='';if(selectedSoundFile&&soundPath(active)==='sounds/'+selectedSoundFile.name)src=URL.createObjectURL(selectedSoundFile);else src=soundPath(active);if(!src)return;const a=new Audio(src);window.__tbHsPreview=a;a.play().catch(()=>{});a.onended=()=>{if(src.startsWith('blob:'))URL.revokeObjectURL(src);if(window.__tbHsPreview===a)window.__tbHsPreview=null}}
function assignSoundFile(file){if(!active||!file)return;selectedSoundFile=file;active.dataset.sound='sounds/'+file.name;updateSoundUI();previewSound()}
function removeAssignedSound(){if(!active)return;stopEditorPreview();active.removeAttribute('data-sound');selectedSoundFile=null;updateSoundUI()}
const bar=document.createElement('div');bar.id='tb-hs-editor';
const edit=document.createElement('button');edit.textContent='Edit Hotspots';
const nameBox=document.createElement('input');nameBox.placeholder='hotspot name';
const add=document.createElement('button');add.textContent='Add Hotspot';
const del=document.createElement('button');del.textContent='Delete Hotspot';
const save=document.createElement('button');save.textContent='Save Working HTML';
const exportServer=document.createElement('button');exportServer.textContent='Export Server HTML';
const soundFile=document.createElement('input');soundFile.type='file';soundFile.accept='audio/*,.mp3,.wav,.ogg,.m4a';soundFile.className='tb-sound-file';
const chooseSound=document.createElement('button');chooseSound.textContent='Choose Sound';chooseSound.disabled=true;
const testSound=document.createElement('button');testSound.textContent='Test Sound';testSound.disabled=true;
const removeSound=document.createElement('button');removeSound.textContent='Remove Sound';removeSound.disabled=true;
const soundName=document.createElement('span');soundName.className='tb-sound-name';soundName.textContent='Select a hotspot';
bar.append(edit,nameBox,add,del,chooseSound,testSound,removeSound,soundName,save,exportServer,soundFile);document.body.appendChild(bar);nameBox.style.display=add.style.display=del.style.display=chooseSound.style.display=testSound.style.display=removeSound.style.display=soundName.style.display=save.style.display=exportServer.style.display='none';
chooseSound.onclick=()=>{if(active){soundFile.value='';soundFile.click()}};
soundFile.onchange=()=>{const f=soundFile.files&&soundFile.files[0];if(f)assignSoundFile(f)};
testSound.onclick=previewSound;
removeSound.onclick=removeAssignedSound;
edit.onclick=()=>{editing=!editing;document.body.classList.toggle('tb-hs-editing',editing);edit.textContent=editing?'Exit Editor':'Edit Hotspots';nameBox.style.display=add.style.display=del.style.display=chooseSound.style.display=testSound.style.display=removeSound.style.display=soundName.style.display=save.style.display=exportServer.style.display=editing?'':'none';if(!editing){adding=false;stopEditorPreview();cleanActive()}updateSoundUI()};
add.onclick=async()=>{if(!editing)return;const n=(nameBox.value||'').trim().toLowerCase().replace(/\s+/g,' ');if(!n){nameBox.focus();return}pendingName=n;add.disabled=true;const oldText=add.textContent;add.textContent='Translating...';try{pendingTranslations=window.TB_prepareNewHotspotTranslations?await window.TB_prepareNewHotspotTranslations(n):{en:n}}catch(e){pendingTranslations={en:n}}finally{add.disabled=false;add.textContent=oldText}adding=true;cleanActive()};
del.onclick=()=>{if(active){stopEditorPreview();active.remove();active=null;selectedSoundFile=null;updateSoundUI()}};
function downloadableClone(stripEditor){
 const clone=document.documentElement.cloneNode(true);
 clone.querySelector('#tb-hs-editor')?.remove();
 clone.querySelectorAll('#talkabee-object-popup').forEach(function(n){n.remove()});
 clone.querySelectorAll('.tb-hs-handle').forEach(function(n){n.remove()});
 clone.querySelector('body')?.classList.remove('tb-hs-editing','scene-view');
 clone.querySelectorAll('.tb-hs-active,.scene-only,.activity-collapsed').forEach(function(n){n.classList.remove('tb-hs-active','scene-only','activity-collapsed')});
 clone.querySelectorAll('#sceneView,#sceneViewToggle').forEach(function(n){n.setAttribute('aria-pressed','false')});
 if(stripEditor){
  clone.querySelector('#talkabee-challenge-editor-style')?.remove();
  clone.querySelector('#talkabee-challenge-editor-script')?.remove();
  clone.querySelector('#talkabee-hotspot-editor-style')?.remove();
  clone.querySelector('#talkabee-hotspot-editor-v10')?.remove();
  clone.querySelector('#talkabee-hotspot-editor-script')?.remove();
  clone.querySelector('#tb-challenge-panel')?.remove();
  clone.querySelector('#tb-hs-readout')?.remove();
 }
 return clone;
}
function downloadHTML(stripEditor){
 const clone=downloadableClone(stripEditor),blob=new Blob(['<!doctype html>\n'+clone.outerHTML],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(location.pathname.split('/').pop()||'adventure.html');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
save.onclick=()=>downloadHTML(false);
exportServer.onclick=()=>downloadHTML(true);
document.addEventListener('pointerdown',ev=>{if(!editing)return;const h=ev.target.closest('.tb-hs-handle');if(h){startResize(ev,h.parentElement);return}const el=ev.target.closest(SEL);if(el){startDrag(ev,el);return}},true);
document.addEventListener('click',ev=>{if(!editing)return;if(ev.target.closest('#tb-hs-editor'))return;if(adding){placeAt(ev);return}const el=ev.target.closest(SEL);if(el){ev.preventDefault();ev.stopPropagation();select(el)}},true);
})();
