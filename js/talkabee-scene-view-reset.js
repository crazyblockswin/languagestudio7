
(function(){
  function resetTalkABeeSceneView(){
    document.body.classList.remove('scene-view');
    document.querySelectorAll('.scene-only').forEach(function(el){el.classList.remove('scene-only');});
    document.querySelectorAll('.activity-collapsed').forEach(function(el){el.classList.remove('activity-collapsed');});
    ['sceneView','sceneViewToggle'].forEach(function(id){var b=document.getElementById(id);if(b)b.setAttribute('aria-pressed','false');});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',resetTalkABeeSceneView);
  else resetTalkABeeSceneView();
  window.addEventListener('pageshow',resetTalkABeeSceneView);
})();
