
/* Keep the complete displayed script card inside the viewport after moving,
   resizing, restoring its position, or growing to fit longer text. */
(function(){
  'use strict';
  const card=document.querySelector('.tab-master-card');
  if(!card)return;
  const GAP=16;
  let pending=false,adjusting=false;
  function keepVisible(){
    if(adjusting || document.body.classList.contains('scene-view'))return;
    adjusting=true;
    try{
      const r=card.getBoundingClientRect();
      if(!r.width||!r.height)return;
      // Normal, bottom-anchored default remains untouched when already visible.
      let dx=0,dy=0;
      const vw=document.documentElement.clientWidth,vh=document.documentElement.clientHeight;
      if(r.width<=vw-2*GAP){
        if(r.left<GAP)dx=GAP-r.left;
        else if(r.right>vw-GAP)dx=vw-GAP-r.right;
      }else if(r.left>GAP)dx=GAP-r.left;
      if(r.height<=vh-2*GAP){
        if(r.top<GAP)dy=GAP-r.top;
        else if(r.bottom>vh-GAP)dy=vh-GAP-r.bottom;
      }else if(r.top>GAP)dy=GAP-r.top;
      if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return;
      // Use the *rendered* rectangle, not the unscaled CSS width/height.
      // This preserves the existing .67 card transform and drag behavior.
      card.dataset.moved='1';
      card.style.setProperty('left',(r.left+dx)+'px','important');
      card.style.setProperty('top',(r.top+dy)+'px','important');
      card.style.setProperty('right','auto','important');
      card.style.setProperty('bottom','auto','important');
      card.style.setProperty('transform-origin','top left','important');
      const cssWidth=parseFloat(getComputedStyle(card).width)||r.width;
      const factor=r.width/cssWidth;
      card.style.setProperty('transform','scale('+factor+')','important');
    }finally{adjusting=false;}
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;keepVisible()});}
  // Capture ensures the corrected position is saved by the existing drag handler.
  // Reset restores CSS defaults first; then re-check the full rendered card.
  // This also handles a reset that changes position without changing its size.
  const resetButton=card.querySelector('.tab-card-reset');
  if(resetButton)resetButton.addEventListener('click',()=>{
    requestAnimationFrame(()=>{keepVisible();requestAnimationFrame(keepVisible);});
  });
  card.addEventListener('pointerup',keepVisible,true);
  card.addEventListener('pointercancel',keepVisible,true);
  card.addEventListener('pointermove',schedule);
  const ro=new ResizeObserver(schedule);
  ro.observe(card);
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  // Font changes, new challenge text and the status line can alter card height.
  new MutationObserver(schedule).observe(card,{subtree:true,childList:true,characterData:true});
  schedule();
})();
