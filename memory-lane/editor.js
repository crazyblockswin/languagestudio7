(()=>{'use strict';
const $=id=>document.getElementById(id);
let items=JSON.parse(JSON.stringify(Array.isArray(window.MEMORY_LANE_ITEMS)?window.MEMORY_LANE_ITEMS:[]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanName=s=>String(s||'').split(/[\\/]/).pop();
const titleFrom=s=>cleanName(s).replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
function draw(){
 const target=$('entries'); target.innerHTML='';
 $('count').textContent=items.length+' picture'+(items.length===1?'':'s');
 items.forEach((x,i)=>{
  const el=document.createElement('section'); el.className='entry';
  el.innerHTML=`<div class="entry-head"><strong>#${i+1} ${esc(x.title||'Untitled')}</strong><div class="entry-actions"><button data-act="up" ${i===0?'disabled':''}>↑</button><button data-act="down" ${i===items.length-1?'disabled':''}>↓</button><button data-act="delete" class="danger">Delete</button></div></div>
  <div class="fields">
   <label>Title<input data-field="title" value="${esc(x.title||'')}" placeholder="Enter a title"></label>
   <label>Image JPG filename<input data-field="image" value="${esc(x.image||'')}" placeholder="Choose a JPG from your PC"></label>
   <label>Sound MP3 filename (optional)<input data-field="sound" value="${esc(x.sound||'')}" placeholder="Choose an MP3 from your PC"></label>
   <label>Own duration (optional, seconds)<input type="number" min="1" max="3600" data-field="duration" value="${esc(x.duration||'')}" placeholder="Use visitor's speed"></label>
  </div>
  <div class="file-actions"><button type="button" data-pick="image">Choose / Replace JPG from PC</button><button type="button" data-pick="sound">Choose / Replace MP3 from PC</button></div>
  <div class="preview"><img alt="Selected picture preview" loading="lazy"><audio controls preload="none"></audio><span class="file-status"></span></div>
  <input type="file" data-file="image" accept=".jpg,.jpeg,image/jpeg" hidden><input type="file" data-file="sound" accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav" hidden>`;
  const img=el.querySelector('img'),audio=el.querySelector('audio'),status=el.querySelector('.file-status');
  function preview(){
   const im=items[i], imageSrc=im._localImageUrl || (im.image?'images/'+encodeURIComponent(im.image):'');
   img.hidden=!imageSrc; if(imageSrc) img.src=imageSrc; else img.removeAttribute('src');
   const soundSrc=im._localSoundUrl || (im.sound?'sounds/'+encodeURIComponent(im.sound):'');
   audio.hidden=!soundSrc; if(soundSrc) audio.src=soundSrc; else {audio.pause();audio.removeAttribute('src');audio.load();}
   status.textContent=(im._localImageUrl||im._localSoundUrl)?'Local preview selected. Upload the file to its matching GitHub folder before publishing.':'';
  }
  el.querySelectorAll('[data-field]').forEach(inp=>inp.addEventListener('input',()=>{
   const field=inp.dataset.field; items[i][field]=field==='duration'?(inp.value?Number(inp.value):''):inp.value;
   if(field==='title') el.querySelector('.entry-head strong').textContent=`#${i+1} ${items[i].title||'Untitled'}`;
   if(field==='image'||field==='sound'){if(field==='image')delete items[i]._localImageUrl;if(field==='sound')delete items[i]._localSoundUrl;preview();}
  }));
  el.querySelectorAll('[data-pick]').forEach(btn=>btn.addEventListener('click',()=>el.querySelector(`[data-file="${btn.dataset.pick}"]`).click()));
  el.querySelectorAll('[data-file]').forEach(inp=>inp.addEventListener('change',()=>{
   const file=inp.files&&inp.files[0]; if(!file)return;
   const kind=inp.dataset.file, url=URL.createObjectURL(file);
   if(kind==='image'){
    if(items[i]._localImageUrl)URL.revokeObjectURL(items[i]._localImageUrl);
    items[i].image=cleanName(file.name);items[i]._localImageUrl=url;
    if(!items[i].title)items[i].title=titleFrom(file.name);
    el.querySelector('[data-field="image"]').value=items[i].image;
    el.querySelector('[data-field="title"]').value=items[i].title;
    el.querySelector('.entry-head strong').textContent=`#${i+1} ${items[i].title||'Untitled'}`;
   }else{
    if(items[i]._localSoundUrl)URL.revokeObjectURL(items[i]._localSoundUrl);
    items[i].sound=cleanName(file.name);items[i]._localSoundUrl=url;
    el.querySelector('[data-field="sound"]').value=items[i].sound;
   }
   preview();
  }));
  el.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=()=>{
   const act=btn.dataset.act;
   if(act==='delete'){if(!confirm('Remove this picture from the catalog?'))return;items.splice(i,1);}
   else{const j=i+(act==='up'?-1:1);[items[i],items[j]]=[items[j],items[i]];}
   draw();
  });
  preview();target.appendChild(el);
 });
}
function addChosenImage(file){
 if(!file)return;
 const item={title:titleFrom(file.name),image:cleanName(file.name),sound:'',_localImageUrl:URL.createObjectURL(file)};
 items.push(item);draw();$('entries').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'});
}
function download(){
 const cleaned=items.map(x=>({title:String(x.title||'').trim(),image:String(x.image||'').trim(),sound:String(x.sound||'').trim(),...(Number(x.duration)>0?{duration:Number(x.duration)}:{})}));
 const invalid=cleaned.find(x=>!x.image||/[\\/]/.test(x.image)||/[\\/]/.test(x.sound)||!/\.(jpe?g)$/i.test(x.image)|| (x.sound&&!/\.(mp3|wav)$/i.test(x.sound)));
 if(invalid){alert('Each entry needs a JPG/JPEG filename. Sound filenames must end in .mp3 or .wav.');return;}
 const source='/* Memory Lane catalog — generated by Memory Lane Studio. */\nwindow.MEMORY_LANE_ITEMS = '+JSON.stringify(cleaned,null,2)+';\n';
 const blob=new Blob([source],{type:'text/javascript'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='memory-lane-data.js';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('add').onclick=()=>$('newImagePicker').click();
$('newImagePicker').addEventListener('change',e=>{const file=e.target.files&&e.target.files[0];if(file)addChosenImage(file);e.target.value='';});
$('save').onclick=download;
$('load').onclick=()=>{if(!confirm('Discard unsaved edits and reload the published catalog?'))return;items=JSON.parse(JSON.stringify(window.MEMORY_LANE_ITEMS||[]));draw();};
draw();
})();