gsap.registerPlugin(ScrollTrigger);

/* ══ ENV: device + accessibility flags ══ */
const PREFERS_REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEVICE_SCALE = (window.innerWidth < 700 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<=2)) ? 0.45 : 1;
function scaled(n){return Math.max(6,Math.floor(n*DEVICE_SCALE))}

/* ══ PERF: single rAF scheduler (delegates to AnimationController when present) ══ */
const RAF={cbs:[],run:false};
function addLoop(fn, id){
  // Prefer central controller when available
  try{
    if(window.AnimationController && typeof window.AnimationController.addLoop === 'function'){
      return window.AnimationController.addLoop(fn, id);
    }
  }catch(e){/* ignore if controller not available yet */}

  if(PREFERS_REDUCED_MOTION) return; // don't start continuous loops for reduced-motion
  RAF.cbs.push(fn);
  if(!RAF.run){
    RAF.run=true;
    (function tick(){ RAF.cbs.forEach(f=>f()); requestAnimationFrame(tick); })();
  }
}

/* ══ NAV ══ */
const pages=document.querySelectorAll('.page'),nds=document.querySelectorAll('.nd');
function goTo(i){pages[i].scrollIntoView({behavior:'smooth'})}
pages.forEach(p=>new IntersectionObserver(e=>{
  e.forEach(x=>{if(x.isIntersecting){const i=Array.from(pages).indexOf(x.target);nds.forEach((d,j)=>d.classList.toggle('on',i===j))}});
},{threshold:.5}).observe(p));

// Accessibility: make nav dots and chips keyboard-focusable and respond to Enter/Space
nds.forEach(d=>{
  d.setAttribute('tabindex','0');d.setAttribute('role','button');
  if(!d.getAttribute('aria-label')) d.setAttribute('aria-label', d.getAttribute('data-t')||'nav');
  d.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); d.click(); } });
});
document.querySelectorAll('.chip').forEach(c=>{
  c.setAttribute('tabindex','0');c.setAttribute('role','button');
  if(!c.getAttribute('aria-label')) c.setAttribute('aria-label', c.textContent.trim());
  c.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } });
});

/* ══ INTRO PARTICLE BG — lightweight ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const c=document.getElementById('introCanvas');if(!c)return;
  const ctx=c.getContext('2d',{alpha:false});
  let W,H,pts=[];
  const rsz=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;pts=[];for(let i=0;i<80;i++) pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.3,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,h:30+Math.random()*20,a:Math.random()})};
  rsz();window.addEventListener('resize',rsz);
  let frame=0;
  addLoop(()=>{
    frame++;
    ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.a+=.003;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.h},85%,60%,${.3+Math.sin(p.a)*.25})`;ctx.fill();
    });
  });
})();

/* ══ CINEMATIC INTRO ══ */
if(!PREFERS_REDUCED_MOTION){
  (function(){
    const tl=anime.timeline({easing:'easeOutExpo'});
    tl.add({targets:'#iom',opacity:[0,1],scale:[.1,1],duration:1400,easing:'easeOutElastic(1,.5)',delay:300})
      .add({targets:'#irule',width:['0px','360px'],duration:900,easing:'easeInOutQuart'},800)
      .add({targets:'#ia',opacity:[0,1],letterSpacing:['28px','12px'],duration:900},1100)
      .add({targets:'#inames',opacity:[0,1],translateY:[40,0],duration:900},1600)
      .add({targets:'#isub',opacity:[0,1],duration:700},2000)
      .add({targets:'#intro',opacity:[1,0],duration:700,easing:'easeInQuart',
        complete:()=>{const el=document.getElementById('intro');el.classList.add('gone')}},2800);
  })();
} else {
  // Reduced-motion: skip intro animation and hide overlay
  const introEl = document.getElementById('intro'); if(introEl) introEl.classList.add('gone');
}

/* ══ OPTIMIZED STAR CANVAS — throttled ══ */
function makeStars(id,col,n){
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');let W,H,pts=[];
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;pts=[];
    for(let i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.2,a:Math.random(),da:(Math.random()-.5)*.006})};
  rsz();new ResizeObserver(rsz).observe(c);
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return; // only every 2nd frame = 30fps
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.a+=p.da;if(p.a<0||p.a>1)p.da*=-1;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=col+Math.floor(p.a*200).toString(16).padStart(2,'0');
      ctx.fill();
    });
  });
}

/* ══ 2D GALAXY — optimised (no shadow, capped particles) ══ */
function makeGalaxy(id){
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');let W,H,pts=[];
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;pts=[];
    const count=Math.max(12,Math.floor(800*DEVICE_SCALE)); // scaled
    for(let i=0;i<count;i++){
      const r=Math.random()*Math.min(W,H)*.36+5;
      const a=(i/count)*Math.PI*18+(Math.random()-.5)*.3;
      const t=r/(Math.min(W,H)*.36);
      pts.push({dist:r,angle:a,spin:.0003+Math.random()*.0002,
        cr:Math.floor(130+t*125),cg:Math.floor(20+t*50),r2:Math.random()*1.2+.3,a2:Math.random()*.7+.2});
    }
  };
  rsz();new ResizeObserver(rsz).observe(c);
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return;
    ctx.fillStyle='rgba(2,0,10,.06)';ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2;
    pts.forEach(p=>{
      p.angle+=p.spin;
      const x=cx+Math.cos(p.angle)*p.dist, y=cy+Math.sin(p.angle)*p.dist;
      ctx.beginPath();ctx.arc(x,y,p.r2,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.cr},${p.cg},255,${p.a2})`;ctx.fill();
    });
  });
}

/* ══ HALDI CANVAS — reduced particles, no shadow on trail ══ */
function makeHaldi(id){
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');let W,H,pts=[];
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight};
  rsz();new ResizeObserver(rsz).observe(c);
  const hCount = Math.max(6, Math.floor(60*DEVICE_SCALE));
  for(let i=0;i<hCount;i++) // was 130
    pts.push({x:Math.random()*2000,y:Math.random()*900,r:Math.random()*4+1,dx:(Math.random()-.5)*.3,dy:-(Math.random()*.5+.1),a:Math.random(),da:(Math.random()-.5)*.007,h:25+Math.random()*25,trail:[]});
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return;
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.trail.push({x:p.x,y:p.y});if(p.trail.length>6)p.trail.shift(); // shorter trail
      p.trail.forEach((t,i)=>{
        ctx.beginPath();ctx.arc(t.x,t.y,p.r*(i/p.trail.length)*.6,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.h},88%,58%,${p.a*(i/p.trail.length)*.18})`;ctx.fill();
      });
      p.x+=p.dx;p.y+=p.dy;p.a+=p.da;if(p.a<0||p.a>1)p.da*=-1;
      if(p.y<-30){p.y=H+30;p.x=Math.random()*W;p.trail=[]}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.h},92%,60%,${p.a*.5})`;ctx.fill();
    });
  });
}

/* ══ GLITTER — reduced, no shadow ══ */
function makeGlitter(id){
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');let W,H,pts=[];
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;pts=[];
    const gCount = Math.max(8, Math.floor(80*DEVICE_SCALE));
    for(let i=0;i<gCount;i++) // was 200
      pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+.3,vx:(Math.random()-.5)*.4,vy:-(Math.random()*.5+.1),a:Math.random(),da:(Math.random()-.5)*.01,h:120+Math.random()*50})};
  rsz();new ResizeObserver(rsz).observe(c);
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return;
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.a+=p.da;if(p.a<0||p.a>1)p.da*=-1;
      if(p.y<-10){p.y=H+10;p.x=Math.random()*W;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.h},100%,65%,${p.a*.55})`;ctx.fill();
    });
  });
}

/* ══ FIREWORKS — throttled, fewer particles ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const c=document.getElementById('fwCanvas');if(!c)return;
  const ctx=c.getContext('2d');let W,H;
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight};
  rsz();new ResizeObserver(rsz).observe(c);
  const particles=[];
  function explode(x,y,col){
    const exCount = Math.max(6, Math.floor(40*DEVICE_SCALE));
    for(let i=0;i<exCount;i++){ // was 80
      const angle=Math.random()*Math.PI*2,speed=Math.random()*5+2;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:Math.random()*2.5+.8,life:1,col,gravity:.1});
    }
  }
  let timer=0;
  const cols=['#C77DFF','#9B4FDE','#FFB8FF','#FFFFFF'];
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return;
    ctx.fillStyle='rgba(2,0,10,.15)';ctx.fillRect(0,0,W,H);
    timer++;if(timer%60===0)explode(W*.2+Math.random()*W*.6,H*.15+Math.random()*H*.35,cols[timer/60%cols.length|0]);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.vx*=.97;p.vy*=.97;p.life-=.016;p.r*=.98;
      if(p.life<=0||p.r<.3){particles.splice(i,1);continue;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col+Math.floor(p.life*220).toString(16).padStart(2,'0');ctx.fill();
    }
  });
})();

/* ══ PARTICLE MORPH — reduced N, lower fps ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const c=document.getElementById('morphCanvas');if(!c)return;
  const ctx=c.getContext('2d');let W,H;
  const rsz=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight};
  rsz();new ResizeObserver(rsz).observe(c);
  const N=Math.max(60,Math.floor(300*DEVICE_SCALE)); // was 600
  let particles=[];
  function getOmPts(){
    const pts=[],oc=document.createElement('canvas');oc.width=200;oc.height=200;
    const ox=oc.getContext('2d');ox.fillStyle='white';ox.font='bold 160px serif';ox.textAlign='center';ox.textBaseline='middle';ox.fillText('ॐ',100,110);
    const d=ox.getImageData(0,0,200,200).data;
    for(let y=0;y<200;y+=5)for(let x=0;x<200;x+=5)if(d[(y*200+x)*4+3]>128)pts.push({x:(x-100)/200,y:(y-100)/200});
    return pts;
  }
  function getFlowerPts(){
    const pts=[];
    for(let i=0;i<N;i++){const t=(i/N)*Math.PI*10;const r=(.25+.08*Math.sin(5*t))*.5;pts.push({x:Math.cos(t)*r,y:Math.sin(t)*r})}
    return pts;
  }
  function getNamePts(){
    const pts=[],oc=document.createElement('canvas');oc.width=400;oc.height=100;
    const ox=oc.getContext('2d');ox.fillStyle='white';ox.font='bold 52px serif';ox.textAlign='center';ox.textBaseline='middle';ox.fillText('Jayant & Beauty',200,50);
    const d=ox.getImageData(0,0,400,100).data;
    for(let y=0;y<100;y+=4)for(let x=0;x<400;x+=4)if(d[(y*400+x)*4+3]>128)pts.push({x:(x-200)/400,y:(y-50)/180});
    return pts;
  }
  let targets=[],phase=0,phaseTimer=0;
  const shapes=[getOmPts,getFlowerPts,getNamePts];
  function buildT(fn){const src=fn();targets=[];for(let i=0;i<N;i++)targets.push(src[Math.floor(Math.random()*src.length)]||{x:0,y:0})}
  buildT(shapes[0]);
  for(let i=0;i<N;i++) particles.push({x:(Math.random()-.5),y:(Math.random()-.5),tx:targets[i].x,ty:targets[i].y,vx:0,vy:0,h:30+Math.random()*30,r:Math.random()*1.8+1});
  let fr=0;
  addLoop(()=>{
    fr++;if(fr%2!==0)return;
    ctx.clearRect(0,0,W,H);
    phaseTimer++;
    if(phaseTimer>240){phaseTimer=0;phase=(phase+1)%3;buildT(shapes[phase]);particles.forEach((p,i)=>{p.tx=targets[i].x;p.ty=targets[i].y})}
    const cx=W/2,cy=H/2,scale=Math.min(W,H)*.42;
    particles.forEach(p=>{
      const ax=(p.tx-p.x)*.055,ay=(p.ty-p.y)*.055;
      p.vx=(p.vx+ax)*.9;p.vy=(p.vy+ay)*.9;p.x+=p.vx;p.y+=p.vy;
      ctx.beginPath();ctx.arc(cx+p.x*scale,cy+p.y*scale,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.h},88%,64%,.65)`;ctx.fill();
    });
  });
})();

/* ══ INIT ══ */
makeStars('c1','#F0C060', scaled(400));
makeHaldi('c2');
makeGalaxy('c3');
makeGlitter('c4');
makeStars('c5','#C9952A', scaled(300));

/* ══ TWINKLING DOM STARS ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const w=document.getElementById('stars');if(!w)return;
  const starCount = Math.max(6, Math.floor(40*DEVICE_SCALE));
  for(let i=0;i<starCount;i++){
    const s=document.createElement('div');
    s.style.cssText=`position:absolute;left:${Math.random()*100}%;top:${Math.random()*60}%;width:${Math.random()*2+.5}px;height:${Math.random()*2+.5}px;background:#F0C060;border-radius:50%;animation:twinkle ${1.5+Math.random()*2}s ${Math.random()*3}s ease-in-out infinite`;
    w.appendChild(s);
  }
})();

/* ══ GOD RAYS ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const w=document.getElementById('rays');if(!w)return;
  const rays = Math.max(3, Math.floor(7*DEVICE_SCALE));
  for(let i=0;i<rays;i++){
    const r=document.createElement('div');r.className='ray';
    const angle=-55+i*18;
    r.style.cssText=`position:absolute;top:0;left:${28+i*7}%;width:${1+i%2}px;height:110vh;transform:rotate(${angle}deg);transform-origin:top center;background:linear-gradient(180deg,rgba(255,210,100,.12),transparent);pointer-events:none;animation:godRay ${2.5+i*.5}s ${i*.3}s ease-in-out infinite alternate`;
    w.appendChild(r);
  }
})();

/* ══ FIRE PARTICLES ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const w=document.getElementById('fpts');if(w){
    const fpCount = Math.max(4, Math.floor(30*DEVICE_SCALE));
    for(let i=0;i<fpCount;i++){
      const fp=document.createElement('div');fp.className='fp';
      const dx=(Math.random()-.5)*160,dy=-(Math.random()*140+40);
      fp.style.cssText=`left:${65+Math.random()*70}px;bottom:0;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:hsl(${28+Math.random()*28},100%,${60+Math.random()*35}%);--sx:${dx}px;--sy:${dy}px;animation:sparkFly ${.5+Math.random()*.9}s ${Math.random()*2}s ease-out infinite`;
      w.appendChild(fp);
    }
  }
  const sw=document.getElementById('fsmkw');if(sw){
    const smokeCount = Math.max(1, Math.floor(5*DEVICE_SCALE));
    for(let i=0;i<smokeCount;i++){
      const s=document.createElement('div');s.className='fsmk';
      s.style.cssText=`left:${12+i*12}px;bottom:0;width:${20+Math.random()*18}px;height:${20+Math.random()*18}px;animation:smoke ${2+Math.random()*2}s ${Math.random()*2}s ease-out infinite`;
      sw.appendChild(s);
    }
  }
})();

/* ══ CONFETTI ══ */
(function(){
  if(PREFERS_REDUCED_MOTION) return;
  const w=document.getElementById('conf');if(!w)return;
  const cols=['#00FF88','#88FFCC','#FFFFFF','#00CC66','#FFD700','#FF88CC'];
  const confCount = Math.max(6, Math.floor(50*DEVICE_SCALE));
  for(let i=0;i<confCount;i++){
    const el=document.createElement('div');el.className='cfd';
    el.style.cssText=`left:${Math.random()*100}vw;top:-20px;background:${cols[i%cols.length]};--r:${(Math.random()-.5)*720}deg;border-radius:${Math.random()>.5?'50%':'2px'};width:${5+Math.random()*8}px;height:${5+Math.random()*8}px;animation-duration:${5+Math.random()*9}s;animation-delay:${Math.random()*12}s;opacity:0`;
    w.appendChild(el);
  }
})();

/* ══ PETALS ══ */
function petals(id,arr,n){
  const w=document.getElementById(id);if(!w)return;
  if(PREFERS_REDUCED_MOTION) n = Math.min(4, n);
  n = Math.max(0, Math.floor(n*DEVICE_SCALE));
  for(let i=0;i<n;i++){
    const el=document.createElement('div');el.className='pt';
    el.textContent=arr[i%arr.length];
    el.style.left=Math.random()*100+'vw';
    el.style.animationDuration=(10+Math.random()*14)+'s';
    el.style.animationDelay=(Math.random()*20)+'s';
    el.style.fontSize=(.5+Math.random()*1.1)+'rem';
    w.appendChild(el);
  }
}
petals('pl1',['🌸','🌼','🌺','✿','💫','⭐'],20);
petals('pl2',['🌿','🌼','💛','🌻','🧡','🪔','🌸'],22);
petals('pl3',['💜','✨','🌺','🌸','⭐','💫'],18);
petals('pl4',['🎊','💚','🌟','🎉','✨','🥂','🎈'],20);
petals('pl5',['🌸','⭐','🌼','🌺','💫','✨'],18);

/* ══ GSAP SCROLL ══ */
if(!PREFERS_REDUCED_MOTION){
  const tl_p2 = gsap.timeline({scrollTrigger:{trigger:'#p2',start:'top 88%',toggleActions:'play none none reverse'}});
  tl_p2.fromTo('#p2w',{opacity:0,y:120,scale:.84,rotationX:22,transformPerspective:1200},{opacity:1,y:0,scale:1,rotationX:0,duration:1.5,ease:'power4.out'})
    .fromTo('#hn',{scale:0,rotation:-100,opacity:0},{scale:1,rotation:0,opacity:1,duration:1.2,ease:'elastic.out(1,.44)'},'-=.9')
    .fromTo('#h-rc .rc',{opacity:0,y:50,scale:.74,rotation:5},{opacity:1,y:0,scale:1,rotation:0,duration:.7,ease:'back.out(1.8)',stagger:.13},'-=.5');
  try{ if(window.AnimationController && AnimationController.registerTimeline) AnimationController.registerTimeline('p2', tl_p2); }catch(e){}

  const tl_p3 = gsap.timeline({scrollTrigger:{trigger:'#p3',start:'top 88%',toggleActions:'play none none reverse'}});
  tl_p3.fromTo('#p3w',{opacity:0,scale:.82,y:110},{opacity:1,scale:1,y:0,duration:1.6,ease:'power4.out'})
    .fromTo('#wn',{scale:0,rotation:180,opacity:0},{scale:1,rotation:0,opacity:1,duration:1.2,ease:'elastic.out(1,.46)'},'-=1')
    .fromTo('#w-rc .rc',{opacity:0,x:70,rotation:7},{opacity:1,x:0,rotation:0,duration:.75,ease:'back.out(1.7)',stagger:.14},'-=.55')
    .fromTo('#fsc',{opacity:0,scale:.35,y:90},{opacity:1,scale:1,y:0,duration:1.4,ease:'elastic.out(.75,.4)'},0)
    .fromTo('.skt',{opacity:0,scale:0},{opacity:1,scale:1,duration:.7,stagger:.18,ease:'back.out(2)'},'.5');
  try{ if(window.AnimationController && AnimationController.registerTimeline) AnimationController.registerTimeline('p3', tl_p3); }catch(e){}

  const tl_p4 = gsap.timeline({scrollTrigger:{trigger:'#p4',start:'top 88%',toggleActions:'play none none reverse'}});
  tl_p4.fromTo('#p4w',{opacity:0,y:110,scale:.83},{opacity:1,y:0,scale:1,duration:1.5,ease:'power4.out'})
    .fromTo('#rn',{scale:0,opacity:0},{scale:1,opacity:1,duration:1.1,ease:'elastic.out(1,.48)'},'-=.9')
    .fromTo('.cdb',{opacity:0,y:60,scale:.35},{opacity:1,y:0,scale:1,duration:.9,ease:'elastic.out(1,.5)',stagger:.14},'-=.5')
    .fromTo('#r-fc .fc2',{opacity:0,y:50,scale:.68},{opacity:1,y:0,scale:1,duration:.65,ease:'back.out(1.8)',stagger:.09},'-=.35');
  try{ if(window.AnimationController && AnimationController.registerTimeline) AnimationController.registerTimeline('p4', tl_p4); }catch(e){}

  const tl_p5 = gsap.timeline({scrollTrigger:{trigger:'#p5',start:'top 82%',toggleActions:'play none none reverse'}});
  tl_p5.fromTo('#cl > *',{opacity:0,y:55},{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.11});
  try{ if(window.AnimationController && AnimationController.registerTimeline) AnimationController.registerTimeline('p5', tl_p5); }catch(e){}
} else {
  // Reduced-motion: ensure key sections are visible without animation
  ['#p2w','#p3w','#p4w','#cl'].forEach(sel=>{const el=document.querySelector(sel);if(el)el.style.opacity=1});
}

anime.timeline({easing:'easeOutExpo'})
  .add({targets:'#shiva',translateY:[-35,0],opacity:[0,1],duration:1000,delay:3400})
  .add({targets:'#gsvg',scale:[0,1],opacity:[0,1],duration:1100,easing:'easeOutElastic(1,.52)'},3600)
  .add({targets:'#mbox',translateY:[45,0],opacity:[0,1],duration:900},4100)
  .add({targets:'#inv',opacity:[0,1],duration:800},4500)
  .add({targets:'#ng',translateX:[-100,0],opacity:[0,1],duration:850,easing:'easeOutBack'},4700)
  .add({targets:'#nb',translateX:[100,0],opacity:[0,1],duration:850,easing:'easeOutBack'},4900)
  .add({targets:'.chip',translateY:[25,0],opacity:[0,1],duration:600,delay:anime.stagger(140)},5100);

/* ══ COUNTDOWN ══ */
function tick(){
  const target=new Date('2026-07-03T00:00:00'),now=new Date();
  let diff=Math.max(0,target-now);
  const d=Math.floor(diff/864e5);diff-=d*864e5;
  const h=Math.floor(diff/36e5);diff-=h*36e5;
  const m=Math.floor(diff/6e4);diff-=m*6e4;
  const s=Math.floor(diff/1e3);
  const fmt=n=>String(n).padStart(2,'0');
  [['cdd',d],['cdh',h],['cdm',m],['cds',s]].forEach(([id,v])=>{
    const el=document.getElementById(id);if(!el)return;
    if(el.textContent!==fmt(v)){el.textContent=fmt(v);gsap.fromTo(el,{scale:1.5,opacity:.3},{scale:1,opacity:1,duration:.35,ease:'back.out(2.5)'})}
  });
}
tick();setInterval(tick,1000);

/* ── MUSIC & AUTO-SCROLL ENGINE ── */
let musicPlaying = false;
let autoScrollOn = true;
let autoScrollTimer = null;
let currentPage = 0;
let userScrolling = false;
let userScrollTimer = null;
const bgm = document.getElementById('bgm');
if(bgm) bgm.volume = 0.85;

const PAGE_DURATIONS = [8000,9000,10000,9000,8000];
const TOTAL_PAGES = 5;

function startExperience(){
  const so=document.getElementById('startOverlay'); if(so) so.style.display='none';
  if(bgm) bgm.play().catch(()=>{});
  musicPlaying = true;
  const pb=document.getElementById('playBtn'); if(pb) pb.textContent='⏸';
  startAutoScroll();
}

function toggleMusic(){
  if(!bgm) return;
  if(musicPlaying){bgm.pause();musicPlaying=false;const pb=document.getElementById('playBtn'); if(pb) pb.textContent='▶';
    document.querySelectorAll('.viz-bar').forEach(b=>b.style.animationPlayState='paused');
  } else {
    bgm.play().catch(()=>{});musicPlaying=true;const pb=document.getElementById('playBtn'); if(pb) pb.textContent='⏸';
    document.querySelectorAll('.viz-bar').forEach(b=>b.style.animationPlayState='running');
  }
}

function toggleAutoScroll(){
  autoScrollOn = !autoScrollOn;
  const as=document.getElementById('autoScrollBtn'); if(as) as.textContent = autoScrollOn ? '⏸ AUTO-SCROLL: ON' : '▶ AUTO-SCROLL: OFF';
  if(autoScrollOn) startAutoScroll(); else stopAutoScroll();
}

function startAutoScroll(){
  stopAutoScroll();
  if(!autoScrollOn) return;
  scheduleNext();
}

function scheduleNext(){
  if(!autoScrollOn) return;
  const dur = PAGE_DURATIONS[currentPage] || 8000;
  autoScrollTimer = setTimeout(()=>{
    if(!autoScrollOn) return;
    currentPage = (currentPage + 1) % TOTAL_PAGES;
    const pages = document.querySelectorAll('.page');
    if(pages[currentPage]){
      pages[currentPage].scrollIntoView({behavior:'smooth'});
    }
    scheduleNext();
  }, dur);
}

function stopAutoScroll(){
  if(autoScrollTimer) clearTimeout(autoScrollTimer);
  autoScrollTimer = null;
}

const pages2 = document.querySelectorAll('.page');
new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const i = Array.from(pages2).indexOf(e.target);
      if(i !== -1) currentPage = i;
    }
  });
},{threshold:.6}).observe && pages2.forEach(p=>new IntersectionObserver(e=>{
  e.forEach(x=>{if(x.isIntersecting){const i=Array.from(pages2).indexOf(x.target);if(i!==-1)currentPage=i;}});
},{threshold:.6}).observe(p));

let hideTimer;
document.addEventListener('mousemove',()=>{
  const mc=document.getElementById('musicCtrl'); if(mc) mc.classList.remove('hide');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(()=>{const mc=document.getElementById('musicCtrl'); if(mc) mc.classList.add('hide')},4000);
});
document.addEventListener('touchstart',()=>{
  const mc=document.getElementById('musicCtrl'); if(mc) mc.classList.remove('hide');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(()=>{const mc=document.getElementById('musicCtrl'); if(mc) mc.classList.add('hide')},4000);
});
