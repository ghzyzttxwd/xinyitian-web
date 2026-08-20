// V0.24.49: Xiao Zhao ultimate, pure event-driven runtime.
// No MutationObserver. No fighter class observation. Battle controller remains authoritative.
const battleBody=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
if(!battleBody||!battleDialog)throw new Error('battle dialog missing');

const ROOT=new URL('../assets/original/xiaozhao-1000108/',import.meta.url);
const META_URL=new URL('meta.json',ROOT).href;
const ROLE_URL=new URL('role-q82.webp',ROOT).href;
const MAGIC_URL=new URL('magic-q82.webp',ROOT).href;
const SKILLNAME=new URL('skillname.png',ROOT).href;
const SOUND=new URL('4912351.mp3',ROOT).href;

const CENTER_TRACKS=[
  ['m109',0,1600,-3.17,3.17,-250,-700],
  ['m110',100,1600,-1.5,1.57,-250,-700],
  ['m111',300,2100,1,1,-250,-700],
  ['m112',400,1600,1,1,-250,-600],
  ['m113',900,1200,1.5,1.5,-250,-500],
  ['m114',1800,2100,3.5,3.5,-250,-400],
];
const BG_TRACKS=[
  ['m108',800,3500,-2.1,-2.1,0,-500],
  ['m108',800,3500,2.1,2.1,0,0],
  ['m107',100,3500,2.1,2.1,0,-1],
];
const ACTOR_TRACKS=[
  ['m102',300,1300,1,1,-51,-131],
  ['m101',200,1500,1,1,-30,-130],
  ['m103',1900,1700,1,1,100,-200],
  ['m104',1800,1300,1,1,120,-150],
  ['m106',2000,400,1,1,100,0],
  ['m115',0,1800,1,1,-1,-1],
];
const TARGET_TRACKS=[['m105',2000,900,1,1,0,100]];
const HIT_CUES=[2000,2250,2500,3000];
const SHAKES=[2000,2200,2400,2900];
const ULT_TOTAL=3700,SETTLE_AT=3000;

const SHEETS={};
const timers=new Set(),audios=new Set();
let ready=false,preparePromise=null;

function speedRate(stage){
  const s=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,s/2);
}
function scaled(stage,ms){return Math.max(12,ms/speedRate(stage))}
function later(stage,fn,ms){
  const id=setTimeout(()=>{timers.delete(id);fn()},scaled(stage,ms));
  timers.add(id);
  return id;
}
function preload(url){
  return new Promise((resolve,reject)=>{
    const i=new Image();
    i.decoding='async';
    i.onload=()=>resolve(i);
    i.onerror=()=>reject(new Error(`image load failed: ${url}`));
    i.src=url;
  });
}
async function prepare(){
  if(ready)return;
  if(preparePromise)return preparePromise;
  preparePromise=(async()=>{
    const r=await fetch(META_URL,{cache:'force-cache'});
    if(!r.ok)throw new Error(`meta HTTP ${r.status}`);
    const meta=await r.json();
    if(!meta?.role?.frames?.att2||!meta?.magic?.frames)throw new Error('invalid Xiao Zhao meta');
    await Promise.all([preload(ROLE_URL),preload(MAGIC_URL),preload(SKILLNAME)]);
    const role=meta.role,magic=meta.magic;
    SHEETS.att2={url:ROLE_URL,w:role.size[0],h:role.size[1],frames:role.frames.att2};
    for(const [key,frames] of Object.entries(magic.frames)){
      SHEETS[key]={url:MAGIC_URL,w:magic.size[0],h:magic.size[1],frames};
    }
    ready=true;
  })().catch(e=>{
    preparePromise=null;
    console.warn('[XYT] Xiao Zhao event runtime prep failed; generic fallback retained.',e);
    throw e;
  });
  return preparePromise;
}

// Same compact asset footprint as V0.24.48, but no DOM/class observers.
// This is deliberate A/B isolation: if this stays stable, observer re-entry was the culprit.
prepare().catch(()=>{});

function setFrame(span,key,index,sx=1,sy=1){
  const sh=SHEETS[key],f=sh?.frames?.[index];
  if(!sh||!f||!span)return;
  const [ox,oy,w,h,x,y]=f;
  span.style.left=`${ox}px`;
  span.style.top=`${oy}px`;
  span.style.width=`${w}px`;
  span.style.height=`${h}px`;
  span.style.backgroundImage=`url("${sh.url}")`;
  span.style.backgroundSize=`${sh.w}px ${sh.h}px`;
  span.style.backgroundPosition=`${-x}px ${-y}px`;
  span.style.backgroundRepeat='no-repeat';
  span.style.transform=`scale(${sx},${sy})`;
}
function playSpan(stage,span,key,total,onDone=null,sx=1,sy=1){
  const sh=SHEETS[key];
  if(!sh?.frames?.length)return;
  let i=0;
  const step=()=>{
    if(!span.isConnected)return;
    setFrame(span,key,i++,sx,sy);
    if(i>=sh.frames.length){onDone?.();return}
    later(stage,step,total/sh.frames.length);
  };
  step();
}
function center(el,root){
  const r=(el?.querySelector?.('.bv-portrait')||el)?.getBoundingClientRect?.();
  return r?{x:r.left-root.left+r.width/2,y:r.top-root.top+r.height*.82}:null;
}
function spawnFx(stage,key,dur,x,y,sx=1,sy=1,layer='actor'){
  const w=document.createElement('i'),sp=document.createElement('b');
  w.className=`xiaozhao47-fx ${layer}`;
  sp.className='xiaozhao47-sprite';
  w.style.left=`${x}px`;
  w.style.top=`${y}px`;
  w.appendChild(sp);
  stage.appendChild(w);
  playSpan(stage,sp,key,dur,()=>w.remove(),sx,sy);
  later(stage,()=>w.remove(),dur+120);
}
function showName(stage){
  const el=document.createElement('div');
  el.className='xiaozhao47-skillname';
  const i=document.createElement('i');
  i.style.backgroundImage=`url("${SKILLNAME}")`;
  el.appendChild(i);
  battleDialog.appendChild(el);
  later(stage,()=>el.classList.add('leaving'),560);
  later(stage,()=>el.remove(),720);
}
function playSound(){
  try{
    const a=new Audio(SOUND);
    a.volume=.72;
    audios.add(a);
    const done=()=>audios.delete(a);
    a.addEventListener('ended',done,{once:true});
    a.addEventListener('error',done,{once:true});
    a.play().catch(done);
  }catch{}
}
function impact(stage,target,strong=false){
  target?.animate?.(
    strong
      ?[{transform:'translate3d(0,0,0)'},{transform:'translate3d(8px,-2px,0)'},{transform:'translate3d(-7px,2px,0)'},{transform:'translate3d(0,0,0)'}]
      :[{transform:'translate3d(0,0,0)'},{transform:'translate3d(4px,-1px,0)'},{transform:'translate3d(0,0,0)'}],
    {duration:scaled(stage,strong?230:150),easing:'ease-out'}
  );
}
function clear(stage){
  stage?.querySelectorAll?.('.xiaozhao47-caster,.xiaozhao47-fx').forEach(x=>x.remove());
  battleDialog.querySelectorAll('.xiaozhao47-skillname').forEach(x=>x.remove());
  const f=stage?.querySelector?.('.bv-fighter[data-fighter-id="xiaozhao"]');
  if(f){
    const p=f.querySelector('.bv-portrait');
    if(p)p.style.visibility='';
    f.classList.remove('bv-moving');
  }
}
function cast(stage,targetEls,onImpact){
  const actor=stage.querySelector('.bv-fighter[data-fighter-id="xiaozhao"]');
  const src=actor?.querySelector('.bv-portrait');
  const target=targetEls[0];
  if(!actor||!src||!target){onImpact?.();return}

  clear(stage);
  const root=stage.getBoundingClientRect(),a=center(actor,root),t=center(target,root);
  if(!a||!t){onImpact?.();return}

  actor.classList.add('bv-moving');
  src.style.visibility='hidden';

  const caster=document.createElement('div'),sp=document.createElement('span');
  caster.className='xiaozhao47-caster';
  sp.className='xiaozhao47-sprite';
  caster.style.left=`${a.x}px`;
  caster.style.top=`${a.y}px`;
  caster.appendChild(sp);
  stage.appendChild(caster);
  playSpan(stage,sp,'att2',ULT_TOTAL);
  showName(stage);
  playSound();

  const c={x:root.width/2,y:root.height/2};
  for(const tr of BG_TRACKS){
    later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],c.x+tr[5]*.10,c.y+tr[6]*.10,tr[3],tr[4],'bg')},tr[1]);
  }
  for(const tr of CENTER_TRACKS){
    later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],c.x+tr[5]*.12,c.y+tr[6]*.12,tr[3],tr[4],'actor')},tr[1]);
  }
  for(const tr of ACTOR_TRACKS){
    later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],a.x+tr[5]*.16,a.y+tr[6]*.16,tr[3],tr[4],'actor')},tr[1]);
  }
  for(const tr of TARGET_TRACKS){
    later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],t.x+tr[5]*.16,t.y+tr[6]*.16,tr[3],tr[4],'actor')},tr[1]);
  }
  for(const ms of HIT_CUES)later(stage,()=>impact(stage,target,ms===3000),ms);
  for(const ms of SHAKES){
    later(stage,()=>stage.animate?.(
      [{transform:'translate3d(0,0,0)'},{transform:'translate3d(-5px,1px,0)'},{transform:'translate3d(5px,-1px,0)'},{transform:'translate3d(0,0,0)'}],
      {duration:scaled(stage,190),easing:'ease-out'}
    ),ms);
  }

  let settled=false;
  later(stage,()=>{if(!settled){settled=true;onImpact?.()}},SETTLE_AT);
  later(stage,()=>{
    if(!settled){settled=true;onImpact?.()}
    caster.remove();
    src.style.visibility='';
    actor.classList.remove('bv-moving');
  },ULT_TOTAL+120);
}

battleBody.addEventListener('xyt-xiaozhao-ultimate',e=>{
  const stage=e.target?.closest?.('.battle-visual-stage')||e.target;
  const d=e.detail||{};
  if(!ready){
    prepare().catch(()=>{});
    return; // controller keeps generic fallback; do not stall the turn
  }
  if(!stage?.classList?.contains('battle-visual-stage')||!Array.isArray(d.targetEls)||typeof d.onImpact!=='function')return;
  stage.dataset.bvActionDelayMs='4050';
  e.preventDefault();
  cast(stage,d.targetEls,d.onImpact);
});

battleBody.addEventListener('xyt-battle-stop',()=>{
  for(const id of timers)clearTimeout(id);
  timers.clear();
  for(const a of audios){try{a.pause();a.currentTime=0}catch{}}
  audios.clear();
  battleBody.querySelectorAll('.battle-visual-stage').forEach(clear);
});
