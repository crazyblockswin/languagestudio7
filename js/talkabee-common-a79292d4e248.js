
(function(){
 const panel=document.querySelector('.tab-master-panel,.activity-panel,.panel');
 if(panel){
  const minus=panel.querySelector('.tab-panel-minus'),plus=panel.querySelector('.tab-panel-plus'),reset=panel.querySelector('.tab-panel-reset');
  const KEY='talkabee-global-activity-panel-size',DEFAULT=195,MIN=170,MAX=310,STEP=20;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const apply=(width,save=true)=>{width=clamp(Math.round(Number(width)||DEFAULT),MIN,MAX);const scale=clamp(width/DEFAULT,.88,1.42);panel.style.setProperty('width',width+'px','important');panel.style.setProperty('min-width',width+'px','important');panel.style.setProperty('max-width',width+'px','important');panel.style.setProperty('--tab-panel-scale',scale.toFixed(3));if(save)try{localStorage.setItem(KEY,String(width))}catch(e){}};
  const current=()=>panel.getBoundingClientRect().width||DEFAULT;
  if(minus)minus.addEventListener('click',()=>apply(current()-STEP));
  if(plus)plus.addEventListener('click',()=>apply(current()+STEP));
  if(reset)reset.addEventListener('click',()=>{apply(DEFAULT,false);try{localStorage.removeItem(KEY)}catch(e){}});
  try{const saved=localStorage.getItem(KEY);if(saved)apply(saved,false)}catch(e){}
 }

 const card=document.querySelector('.tab-master-card,.script,.card');
 if(!card)return;
 const drag=card.querySelector('.tab-card-drag'),down=card.querySelector('.tab-card-font-down'),up=card.querySelector('.tab-card-font-up'),reset=card.querySelector('.tab-card-reset'),resize=card.querySelector('.tab-card-resize');
 const PK='talkabee-global-script-card-position',SK='talkabee-global-script-card-scale',FK='talkabee-global-script-card-font-scale';
 const pageKey=(location.pathname.split('/').pop()||'adventure').replace(/[^a-z0-9-]/gi,'_');
 const WK='talkabee-script-card-width-'+pageKey,HK='talkabee-script-card-height-'+pageKey;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const defaultScale=()=>matchMedia('(max-width:760px)').matches?.82:.67;
 let scale=defaultScale(),fontScale=1,dragState=null;
 // Capture actual rendered font sizes, even on Adventures with older card markup.
 // Never modify the Move / A- / A+ / Reset controls or resize handle.
 const textNodes=Array.from(card.querySelectorAll('*')).filter(el=>{
   if(el.closest('.tab-card-tools,.tab-card-resize'))return false;
   if(el.matches('script,style,svg,path,select,input,textarea'))return false;
   return Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim());
 });
 textNodes.forEach(el=>{el.dataset.baseFont=getComputedStyle(el).fontSize});
 function applyBox(width,height,save=true){
   card.style.setProperty('width',width+'px','important');
   card.style.setProperty('max-width','none','important');
   card.style.setProperty('min-width','0','important');
   card.style.setProperty('min-height',height+'px','important');
   card.style.setProperty('max-height','none','important');
   card.style.setProperty('overflow','visible','important');
   if(save)try{localStorage.setItem(WK,String(width));localStorage.setItem(HK,String(height))}catch(e){}
 }

 function applyTransform(){
   if(card.dataset.moved==='1'){
     card.style.setProperty('transform-origin','top left','important');
     card.style.setProperty('transform','scale('+scale+')','important');
   }else{
     card.style.removeProperty('transform-origin');
     card.style.removeProperty('transform');
   }
 }
 function applyFont(v,save=true){
   fontScale=clamp(Number(v)||1,.75,1.6);
   card.style.setProperty('--tab-card-font-scale',fontScale.toFixed(2));
   textNodes.forEach(el=>el.style.setProperty('font-size',(parseFloat(el.dataset.baseFont)*fontScale)+'px','important'));
   if(save)try{localStorage.setItem(FK,String(fontScale))}catch(e){}
 }
 function saveState(){
   try{
     localStorage.setItem(SK,String(scale));
     if(card.dataset.moved==='1'){
       localStorage.setItem(PK,JSON.stringify({left:parseFloat(card.style.left)||card.getBoundingClientRect().left,top:parseFloat(card.style.top)||card.getBoundingClientRect().top}));
     }
   }catch(e){}
 }
 function restore(){
   try{
     const fs=localStorage.getItem(FK); if(fs)applyFont(fs,false);
     // Older A+/A- controls stored a whole-card zoom. Ignore that legacy value.
      const ww=parseFloat(localStorage.getItem(WK)),hh=parseFloat(localStorage.getItem(HK));
      if(ww&&hh)applyBox(ww,hh,false);
     const ps=JSON.parse(localStorage.getItem(PK)||'null');
     if(ps&&innerWidth>760){
       card.dataset.moved='1';
       card.style.setProperty('left',clamp(ps.left,8,innerWidth-80)+'px','important');
       card.style.setProperty('top',clamp(ps.top,8,innerHeight-80)+'px','important');
       card.style.setProperty('right','auto','important');
       card.style.setProperty('bottom','auto','important');
       applyTransform();
     }
   }catch(e){}
 }

 if(down)down.addEventListener('click',()=>applyFont(fontScale-.1));
 if(up)up.addEventListener('click',()=>applyFont(fontScale+.1));

 if(reset)reset.addEventListener('click',()=>{
   try{localStorage.removeItem(PK);localStorage.removeItem(SK);localStorage.removeItem(FK);localStorage.removeItem(WK);localStorage.removeItem(HK)}catch(e){}
   scale=defaultScale();fontScale=1;
   delete card.dataset.moved;
   ['width','height','left','top','right','bottom','inset','transform','transform-origin','min-width','max-width','min-height','max-height'].forEach(p=>card.style.removeProperty(p));
   applyFont(1,false);
   // Reset must restore the approved centered, bottom-anchored appearance
   // without allowing any part of the card to fall outside the viewport.
   // Do not rely on the later boundary observer: its correction can run
   // before the browser has laid out the newly reset content.
   const placeDefault=()=>{
     naturalHeight();
     const gap=16;
     const cssWidth=card.getBoundingClientRect().width || 520;
     const baseWidth=parseFloat(getComputedStyle(card).width)||520;
     const visualScale=defaultScale();
     const visualWidth=baseWidth*visualScale;
     const visualHeight=card.scrollHeight*visualScale;
     const vw=document.documentElement.clientWidth;
     const vh=document.documentElement.clientHeight;
     const x=Math.max(gap,(vw-visualWidth)/2);
     const y=Math.max(gap,vh-gap-visualHeight);
     card.dataset.moved='1';
     card.style.setProperty('left',x+'px','important');
     card.style.setProperty('top',y+'px','important');
     card.style.setProperty('right','auto','important');
     card.style.setProperty('bottom','auto','important');
     card.style.setProperty('transform-origin','top left','important');
     card.style.setProperty('transform','scale('+visualScale+')','important');
   };
   requestAnimationFrame(()=>requestAnimationFrame(placeDefault));
 });

 function startDrag(e){
   if(innerWidth<=760 || (typeof e.button==='number'&&e.button!==0))return;
   if(e.target.closest('.tab-card-resize,.tab-card-font-down,.tab-card-font-up,.tab-card-reset,a,input,select,textarea'))return;
   if(e.target.closest('button') && !e.target.closest('.tab-card-drag'))return;
   e.preventDefault();
   const r=card.getBoundingClientRect();
   // Convert the visual top-left to fixed coordinates, while keeping the exact current scale.
   card.dataset.moved='1';
   card.style.setProperty('left',r.left+'px','important');
   card.style.setProperty('top',r.top+'px','important');
   card.style.setProperty('right','auto','important');
   card.style.setProperty('bottom','auto','important');
   applyTransform();
   dragState={id:e.pointerId,sx:e.clientX,sy:e.clientY,left:r.left,top:r.top,w:r.width,h:r.height};
   try{card.setPointerCapture(e.pointerId)}catch(_){}
 }
 function moveDrag(e){
   if(!dragState||e.pointerId!==dragState.id)return;
   e.preventDefault();
   const x=clamp(dragState.left+e.clientX-dragState.sx,8,Math.max(8,innerWidth-dragState.w-8));
   const y=clamp(dragState.top+e.clientY-dragState.sy,8,Math.max(8,innerHeight-dragState.h-8));
   card.style.setProperty('left',x+'px','important');
   card.style.setProperty('top',y+'px','important');
 }
 function endDrag(e){
   if(!dragState||e.pointerId!==dragState.id)return;
   dragState=null; saveState();
   try{card.releasePointerCapture(e.pointerId)}catch(_){}
 }

 // Drag from the Move button OR any non-interactive empty area of the card.
 card.addEventListener('pointerdown',startDrag);
 card.addEventListener('pointermove',moveDrag);
 card.addEventListener('pointerup',endDrag);
 card.addEventListener('pointercancel',endDrag);

 // Resize only the card's dimensions. The text and visual scale remain unchanged.
 if(resize)resize.addEventListener('pointerdown',e=>{
   if(innerWidth<=760)return;
   e.preventDefault();e.stopPropagation();
   const sx=e.clientX,sy=e.clientY,baseW=parseFloat(getComputedStyle(card).width),baseH=parseFloat(getComputedStyle(card).height);
   const effectiveScale=card.getBoundingClientRect().width/baseW||defaultScale();
   resize.setPointerCapture(e.pointerId);
   const mv=ev=>{const width=clamp(baseW+(ev.clientX-sx)/effectiveScale,320,Math.max(520,innerWidth/effectiveScale-50));const height=clamp(baseH+(ev.clientY-sy)/effectiveScale,120,Math.max(250,innerHeight/effectiveScale-40));applyBox(width,height,false)};
   const end=()=>{resize.removeEventListener('pointermove',mv);resize.removeEventListener('pointerup',end);resize.removeEventListener('pointercancel',end);applyBox(parseFloat(getComputedStyle(card).width),parseFloat(getComputedStyle(card).height),true);naturalHeight()};
   resize.addEventListener('pointermove',mv);resize.addEventListener('pointerup',end);resize.addEventListener('pointercancel',end);
 });

  restore();

  // Grandpa's Place behavior: the card follows its content rather than keeping
  // a height left behind by an earlier challenge or a saved editor snapshot.
  // A manual corner drag can temporarily set a preferred minimum height;
  // the next phrase/challenge change returns the card to natural auto-height.
  function naturalHeight(){
    // The card must size to content, not become an internally scrolling pane.
    // Preserve the user's chosen width and screen position.
    card.style.setProperty('height','auto','important');
    card.style.setProperty('min-height','0px','important');
    card.style.setProperty('max-height','none','important');
    card.style.setProperty('overflow','visible','important');
    card.style.setProperty('overflow-y','visible','important');
    try{localStorage.removeItem(HK)}catch(e){}
  }
  naturalHeight();
  const contentFields=['title','prompt','line','translation','status']
    .map(id=>document.getElementById(id)).filter(Boolean);
  const contentWatcher=new MutationObserver(()=>naturalHeight());
  contentFields.forEach(el=>contentWatcher.observe(el,{
    subtree:true,childList:true,characterData:true
  }));
})();
