/* AnimationController: central registry for timelines and frame loops */
(function(){
  const AC = {
    loops: [],
    loopMap: new Map(),
    running: false,
    paused: false,
    timelines: new Map(),
    prefersReduced: (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  };

  function tick(){
    if(!AC.running) return;
    if(AC.paused) return;
    for(const fn of AC.loops) try{ fn(); } catch(e){ console.error('AC loop error',e); }
    requestAnimationFrame(tick);
  }

  AC.init = function(){
    if(AC.prefersReduced) return;
    if(AC.running) return; AC.running = true; requestAnimationFrame(tick);
  };

  AC.addLoop = function(fn, id){
    if(AC.prefersReduced) return null;
    AC.loops.push(fn);
    if(id) AC.loopMap.set(id, fn);
    AC.init();
    return id || (AC.loops.length-1).toString();
  };

  AC.removeLoop = function(idOrFn){
    const fn = typeof idOrFn === 'string' ? AC.loopMap.get(idOrFn) : idOrFn;
    if(!fn) return false;
    const idx = AC.loops.indexOf(fn); if(idx>-1) AC.loops.splice(idx,1);
    for(const [k,v] of AC.loopMap){ if(v===fn) AC.loopMap.delete(k); }
    return true;
  };

  AC.pause = function(){ AC.paused = true; for(const t of AC.timelines.values()) if(t && t.pause) try{ t.pause(); }catch(e){} };
  AC.resume = function(){ AC.paused = false; for(const t of AC.timelines.values()) if(t && t.play) try{ t.play(); }catch(e){} };

  // Pause/resume when page visibility changes
  AC.pauseOnHidden = function(enable = true){
    if(typeof document === 'undefined' || !document.addEventListener) return;
    if(AC._visBound && enable) return; // already bound
    const handler = function(){
      try{
        if(document.hidden){
          AC.pause();
        } else {
          AC.resume();
        }
      }catch(e){console.error('AnimationController visibility handler error',e)}
    };
    AC._visibilityHandler = handler;
    if(enable){
      document.addEventListener('visibilitychange', handler, {passive:true});
      AC._visBound = true;
      // apply current state immediately
      if(document.hidden) AC.pause();
    } else {
      if(AC._visBound){ document.removeEventListener('visibilitychange', AC._visibilityHandler); AC._visBound = false; }
    }
  };

  AC.registerTimeline = function(name, tl){ if(!name || !tl) return; AC.timelines.set(name, tl); };
  AC.unregisterTimeline = function(name){ AC.timelines.delete(name); };

  // expose to global
  window.AnimationController = AC;
  // enable automatic pause/resume on page visibility by default
  try{ AC.pauseOnHidden(true); }catch(e){}
})();
