// V0.24.53: Huangshan Girl 玉女素心剑法, pure event-driven static runtime.
// No MutationObserver. No fighter class observation. Battle controller remains authoritative.
const battleBody=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
if(!battleBody||!battleDialog)throw new Error('battle dialog missing');

const ROOT=new URL('../assets/original/huangshan-1000018-event/',import.meta.url);
const META_URL=new URL('meta.json',ROOT).href;
const ROLE_URL=new URL('role-ult-q82.webp',ROOT).href;
const MAGIC_URL=new URL('magic-q82.webp',ROOT).href;
const SKILLNAME=new URL('skillname.png',ROOT).href;
const SOUND=new URL('4910451.mp3',ROOT).href;

const ACTOR_TRACKS=[['m102',100,1500,1,1,1,-251],['m103',200,1500,1,1,1,0],['m104',200,800,1,1,101,1],['m105',1000,2000,1,1,100,-300],['m106',2500,1000,1,1,121,-401],['m107',2500,1000,1,1,-36,-405],['m114',500,3500,1.4,1.3,300,-550]];
const BG_TRACKS=[['m108',0,2800,1,1,241,-601],['m109',0,2800,1.05,1.05,210,650],['m110',0,2800,1.1,1.05,1,661],['m111',0,3500,1.2,1.2,0,-400],['m112',0,3500,2,2,-201,-201],['m112',500,3000,1.2,1.2,200,-50],['m112',300,3200,1,1,-301,301],['m112',0,3500,1.5,1.5,300,500],['m112',0,3500,2,2,-1,-801],['m113',0,3500,1,1,-200,-500],['m113',300,3200,1.2,1.2,1,1],['m113',0,3500,1,1,200,500],['m113',500,3000,1.5,1.5,-201,501],['m116',2600,700,1.1,1.1,-220,-530],['m117',2850,600,1.1,1.1,1,1],['m115',3000,400,1.05,1.05,-11,-101]];
const HIT_CUES=[1200,1700,3000],SHAKES=[1300,1800,3000];
const ULT_TOTAL=3300,SETTLE_AT=3000;
const SHEETS={},timers=new Set(),audios=new Set();
let ready=false,preparePromise=null;

function speedRate(stage){const s=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));return Math.max(.5,s/2)}
function scaled(stage,ms){return Math.max(12,ms/speedRate(stage))}
function later(stage,fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},scaled(stage,ms));timers.add(id);return id}
function preload(url){return new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`image load failed: ${url}`));i.src=url})}
async function prepare(){
  if(ready)return;if(preparePromise)return preparePromise;
  preparePromise=(async()=>{
    const r=await fetch(META_URL,{cache:'force-cache'});if(!r.ok)throw new Error(`meta HTTP ${r.status}`);
    const meta=await r.json();if(!meta?.role?.frames?.att2||!meta?.magic?.frames)throw new Error('invalid Huangshan meta');
    await Promise.all([preload(ROLE_URL),preload(MAGIC_URL),preload(SKILLNAME)]);
    SHEETS.att2={url:ROLE_URL,w:meta.role.size[0],h:meta.role.size[1],frames:meta.role.frames.att2};
    for(const [key,frames] of Object.entries(meta.magic.frames))SHEETS[key]={url:MAGIC_URL,w:meta.magic.size[0],h:meta.magic.size[1],frames};
    ready=true;
  })().catch(e=>{preparePromise=null;console.warn('[XYT] Huangshan event runtime prep failed; generic fallback retained.',e);throw e});
  return preparePromise;
}

function setFrame(span,key,index,sx=1,sy=1){const sh=SHEETS[key],f=sh?.frames?.[index];if(!sh||!f||!span)return;const [ox,oy,w,h,x,y]=f;span.style.left=`${ox}px`;span.style.top=`${oy}px`;span.style.width=`${w}px`;span.style.height=`${h}px`;span.style.backgroundImage=`url("${sh.url}")`;span.style.backgroundSize=`${sh.w}px ${sh.h}px`;span.style.backgroundPosition=`${-x}px ${-y}px`;span.style.backgroundRepeat='no-repeat';span.style.transform=`scale(${sx},${sy})`}
function playSpan(stage,span,key,total,onDone=null,sx=1,sy=1){const sh=SHEETS[key];if(!sh?.frames?.length)return;let i=0;const step=()=>{if(!span.isConnected)return;setFrame(span,key,i++,sx,sy);if(i>=sh.frames.length){onDone?.();return}later(stage,step,total/sh.frames.length)};step()}
function center(el,root){const r=(el?.querySelector?.('.bv-portrait')||el)?.getBoundingClientRect?.();return r?{x:r.left-root.left+r.width/2,y:r.top-root.top+r.height*.82}:null}
function spawnFx(stage,key,dur,x,y,sx=1,sy=1,layer='actor'){const w=document.createElement('i'),sp=document.createElement('b');w.className=`huangshan53-fx ${layer}`;sp.className='huangshan53-sprite';w.style.left=`${x}px`;w.style.top=`${y}px`;w.appendChild(sp);stage.appendChild(w);playSpan(stage,sp,key,dur,()=>w.remove(),sx,sy);later(stage,()=>w.remove(),dur+120)}
function actorPoint(tr,a,t){const x=Number(tr[5]||0),y=Number(tr[6]||0),q=Math.max(-.25,Math.min(1.25,x/300));return{x:a.x+(t.x-a.x)*q,y:a.y+(t.y-a.y)*q+y*.16}}
function showName(stage){const el=document.createElement('div');el.className='huangshan53-skillname';const i=document.createElement('i');i.style.backgroundImage=`url("${SKILLNAME}")`;el.appendChild(i);battleDialog.appendChild(el);later(stage,()=>el.classList.add('leaving'),520);later(stage,()=>el.remove(),680)}
function playSound(){try{const a=new Audio(SOUND);a.volume=.72;audios.add(a);const done=()=>audios.delete(a);a.addEventListener('ended',done,{once:true});a.addEventListener('error',done,{once:true});a.play().catch(done)}catch{}}
function impact(stage,target,strong=false){target?.animate?.(strong?[{transform:'translate3d(0,0,0)'},{transform:'translate3d(9px,-2px,0)'},{transform:'translate3d(-7px,2px,0)'},{transform:'translate3d(0,0,0)'}]:[{transform:'translate3d(0,0,0)'},{transform:'translate3d(4px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,strong?230:150),easing:'ease-out'})}
function clear(stage){stage?.querySelectorAll?.('.huangshan53-caster,.huangshan53-fx').forEach(x=>x.remove());battleDialog.querySelectorAll('.huangshan53-skillname').forEach(x=>x.remove());const f=stage?.querySelector?.('.bv-fighter[data-fighter-id="huangshan"]');if(f){const p=f.querySelector('.bv-portrait');if(p)p.style.visibility='';f.classList.remove('bv-moving')}}
function cast(stage,targetEls,onImpact){
  const actor=stage.querySelector('.bv-fighter[data-fighter-id="huangshan"]'),src=actor?.querySelector('.bv-portrait'),target=targetEls[0];
  if(!actor||!src||!target){onImpact?.();return}
  clear(stage);const root=stage.getBoundingClientRect(),a=center(actor,root),t=center(target,root);if(!a||!t){onImpact?.();return}
  actor.classList.add('bv-moving');src.style.visibility='hidden';
  const caster=document.createElement('div'),sp=document.createElement('span');caster.className='huangshan53-caster';sp.className='huangshan53-sprite';caster.style.left=`${a.x}px`;caster.style.top=`${a.y}px`;caster.appendChild(sp);stage.appendChild(caster);playSpan(stage,sp,'att2',ULT_TOTAL);showName(stage);playSound();
  for(const tr of ACTOR_TRACKS)later(stage,()=>{if(!caster.isConnected)return;const p=actorPoint(tr,a,t);spawnFx(stage,tr[0],tr[2],p.x,p.y,tr[3],tr[4],'actor')},tr[1]);
  const c={x:root.width/2,y:root.height/2};for(const tr of BG_TRACKS)later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],c.x+Number(tr[5]||0)*.12,c.y+Number(tr[6]||0)*.12,tr[3],tr[4],'bg')},tr[1]);
  for(const ms of HIT_CUES)later(stage,()=>impact(stage,target,ms===3000),ms);
  for(const ms of SHAKES)later(stage,()=>stage.animate?.([{transform:'translate3d(0,0,0)'},{transform:'translate3d(-6px,1px,0)'},{transform:'translate3d(6px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,220),easing:'ease-out'}),ms);
  let settled=false;later(stage,()=>{if(!settled){settled=true;onImpact?.()}},SETTLE_AT);later(stage,()=>{if(!settled){settled=true;onImpact?.()}caster.remove();src.style.visibility='';actor.classList.remove('bv-moving')},ULT_TOTAL+120);
}

battleBody.addEventListener('xyt-huangshan-ultimate',e=>{
  const stage=e.target?.closest?.('.battle-visual-stage')||e.target,d=e.detail||{};
  if(!stage?.classList?.contains('battle-visual-stage')||!Array.isArray(d.targetEls)||typeof d.onImpact!=='function')return;
  if(ready){stage.dataset.bvActionDelayMs='3650';e.preventDefault();cast(stage,d.targetEls,d.onImpact);return}
  // First cast owns the event while the verified local atlases decode. This prevents
  // the first ultimate from silently falling back to the generic animation.
  stage.dataset.bvActionDelayMs='5200';e.preventDefault();
  prepare().then(()=>{if(stage.isConnected)cast(stage,d.targetEls,d.onImpact);else d.onImpact()}).catch(()=>d.onImpact());
});

battleBody.addEventListener('xyt-battle-stop',()=>{for(const id of timers)clearTimeout(id);timers.clear();for(const a of audios){try{a.pause();a.currentTime=0}catch{}}audios.clear();battleBody.querySelectorAll('.battle-visual-stage').forEach(clear)});