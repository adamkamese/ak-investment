/* app.js
   Boot: runs last, after every module is defined.
   Part of the Boboda Business Dashboard. Loaded in order by index.html.
   Shared helpers live in core.js; edit a module file to change that module. */
/* ---- boot: load the local cache, pull the shared cloud copy, then log in ---- */
function hideSplash(){ const s=document.getElementById("splash");
  if(s&&!s.classList.contains("gone")){ s.classList.add("gone");
    setTimeout(function(){ if(s&&s.parentNode) s.parentNode.removeChild(s); },500); } }
setTimeout(hideSplash,4000);   // safety: never let the splash get stuck
(async function boot(){
  const t0=Date.now();
  load();
  if(CLOUD.on){ CLOUD_BOOT=true; setSync("sync"); await cloudPull(); CLOUD_BOOT=false; startPoller(); }
  renderLogin();
  setTimeout(hideSplash,Math.max(0,500-(Date.now()-t0)));   // brief minimum so it doesn't flash
})();
