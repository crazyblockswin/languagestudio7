/* Talk A Bee V2: use local media folders for file:// previews, shared parent folders for hosted /master/. */
(function(){'use strict';
  window.tbMasterMediaUrl=function(path){
    if(typeof path!=='string'||!path)return path;
    if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|\.\.?\/)/i.test(path))return path;
    if(location.protocol==='file:'||/^(?:localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname))return path;
    if(!/\/master\//i.test(location.pathname))return path;
    return /^(?:images|sounds)\//i.test(path)?'../'+path:path;
  };
})();
