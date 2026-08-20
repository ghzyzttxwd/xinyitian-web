// V0.24.46: mobile-safe official Huangshan Girl (1000018) + 4910451 玉女素心剑法.
// Official PNG/CFG sheets are resized one-at-a-time before use; battle.js remains authoritative.
const battleBody=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
if(!battleBody||!battleDialog)throw new Error('battle dialog missing');

const BASE='https://xyttlj-static.xyimg.net/game/';
const DEF={
  stand:['resself/model/role/stand/1000018_v1',.36],
  run:['resself/model/role/run/1000018_v1',.36],
  att1:['resself/model/role/att1/1000018_v1',.36],
  att2:['resself/model/role/att2/1000018_v2',.36],
  hit1:['resself/model/role/hit1/1000018_v1',.36],
};
for(let i=102;i<=117;i++)DEF[`m${i}`]=[`resself/model/magic/atlas/491045${i}_v2`,.16];
const ACTOR_TRACKS=[['m102',100,1500,1,1,1,-251],['m103',200,1500,1,1,1,0],['m104',200,800,1,1,101,1],['m105',1000,2000,1,1,100,-300],['m106',2500,1000,1,1,121,-401],['m107',2500,1000,1,1,-36,-405],['m114',500,3500,1.4,1.3,300,-550]];
const BG_TRACKS=[['m108',0,2800,1,1,241,-601],['m109',0,2800,1.05,1.05,210,650],['m110',0,2800,1.1,1.05,1,661],['m111',0,3500,1.2,1.2,0,-400],['m112',0,3500,2,2,-201,-201],['m112',500,3000,1.2,1.2,200,-50],['m112',300,3200,1,1,-301,301],['m112',0,3500,1.5,1.5,300,500],['m112',0,3500,2,2,-1,-801],['m113',0,3500,1,1,-200,-500],['m113',300,3200,1.2,1.2,1,1],['m113',0,3500,1,1,200,500],['m113',500,3000,1.5,1.5,-201,501],['m116',2600,700,1.1,1.1,-220,-530],['m117',2850,600,1.1,1.1,1,1],['m115',3000,400,1.05,1.05,-11,-101]];
const SKILLNAME=BASE+'res/icon/skillname/4010451_v2.png';
const SOUND=BASE+'resself/sound/4910451_v2.mp3';
const ULT_TOTAL=3300,SETTLE_AT=3000,HIT_CUES=[1200,1700,3000],SHAKES=[1300,1800,3000];
const SHEETS={},states=new WeakMap(),boundStages=new WeakSet(),timers=new Set(),audios=new Set();
let roleReady=false,magicReady=false,magicLoading=null;

function speedRate(stage){const s=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));return Math.max(.5,s/2)}
function scaled(stage,ms){return Math.max(12,ms/speedRate(stage))}
function later(stage,fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},scaled(stage,ms));timers.add(id);return id}
function parseCfg(buffer,scale){const v=new DataView(buffer),n=v.getUint16(0,false),out=[];if(buffer.byteLength<2+n*12)throw new Error('truncated cfg');for(let i=0;i<n;i++){const p=2+i*12;out.push([v.getInt16(p,false)*scale,v.getInt16(p+2,false)*scale,Math.max(1,Math.round(v.getUint16(p+4,false)*scale)),Math.max(1,Math.round(v.getUint16(p+6,false)*scale)),Math.round(v.getUint16(p+8,false)*scale),Math.round(v.getUint16(p+10,false)*scale)])}return out}
async function resizeBlob(blob,scale){
  if(!globalThis.createImageBitmap)throw new Error('createImageBitmap unsupported');
  const head=new DataView(await blob.slice(0,24).arrayBuffer());
  const srcW=head.getUint32(16,false),srcH=head.getUint32(20,false);
  if(!srcW||!srcH)throw new Error('invalid PNG dimensions');
  const w=Math.max(1,Math.round(srcW*scale)),h=Math.max(1,Math.round(srcH*scale));
  const small=await createImageBitmap(blob,{resizeWidth:w,resizeHeight:h,resizeQuality:'high'});
  let out;
  if(globalThis.OffscreenCanvas){const c=new OffscreenCanvas(w,h),x=c.getContext('2d',{alpha:true});x.drawImage(small,0,0,w,h);small.close();out=await c.convertToBlob({type:'image/webp',quality:.78})}
  else{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d',{alpha:true}).drawImage(small,0,0,w,h);small.close();out=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('canvas encode failed')),'image/webp',.78));c.width=c.height=1}
  return{blob:out,w,h};
}
async function loadSheet(key){
  if(SHEETS[key])return SHEETS[key];const [path,scale]=DEF[key];
  const [cfgRes,pngRes]=await Promise.all([fetch(BASE+path+'.cfg',{cache:'force-cache'}),fetch(BASE+path+'.png',{cache:'force-cache'})]);
  if(!cfgRes.ok||!pngRes.ok)throw new Error(`${key} HTTP ${cfgRes.status}/${pngRes.status}`);
  const [cfg,png]=await Promise.all([cfgRes.arrayBuffer(),pngRes.blob()]);const resized=await resizeBlob(png,scale);
  return SHEETS[key]={url:URL.createObjectURL(resized.blob),w:resized.w,h:resized.h,frames:parseCfg(cfg,scale)};
}
async function loadSequential(keys){for(const key of keys)await loadSheet(key)}
function portraitOf(node){if(!node)return null;if(node.classList?.contains('bv-dash-ghost'))return node;return node.querySelector?.('.bv-portrait')||null}
function spriteOf(node){const p=portraitOf(node);if(!p)return null;const s=p.querySelector?.(':scope > span');if(!s)return null;s.classList.add('huangshan46-sprite');s.textContent='';return s}
function setFrame(span,key,index,sx=1,sy=1){const sh=SHEETS[key],f=sh?.frames?.[index];if(!sh||!f||!span)return;const [ox,oy,w,h,x,y]=f;span.style.left=`${ox}px`;span.style.top=`${oy}px`;span.style.width=`${w}px`;span.style.height=`${h}px`;span.style.backgroundImage=`url("${sh.url}")`;span.style.backgroundSize=`${sh.w}px ${sh.h}px`;span.style.backgroundPosition=`${-x}px ${-y}px`;span.style.backgroundRepeat='no-repeat';span.style.transform=`scale(${sx},${sy})`}
function stop(node){const s=states.get(node);if(s?.timer)clearTimeout(s.timer);if(s)s.token++}
function playNode(node,key,{loop=false,interval=60,hold=false,onDone=null}={}){if(!roleReady||!SHEETS[key])return;const span=spriteOf(node);if(!span)return;stop(node);const stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage'),sh=SHEETS[key],s=states.get(node)||{token:0,timer:null};s.token++;states.set(node,s);const token=s.token;let i=0;const step=()=>{if(states.get(node)?.token!==token||!node.isConnected)return;setFrame(span,key,i++);if(i>=sh.frames.length){if(loop){i=0;s.timer=setTimeout(step,scaled(stage,interval));return}if(hold)setFrame(span,key,sh.frames.length-1);onDone?.();return}s.timer=setTimeout(step,scaled(stage,interval))};step()}
function playSpan(stage,span,key,total,onDone=null,sx=1,sy=1){const sh=SHEETS[key];if(!sh?.frames?.length)return;let i=0;const step=()=>{if(!span.isConnected)return;setFrame(span,key,i++,sx,sy);if(i>=sh.frames.length){onDone?.();return}later(stage,step,total/sh.frames.length)};step()}
function react(f){if(!roleReady||!f?.isConnected)return;f.classList.add('huangshan46-ready');if(f.classList.contains('dead')||f.classList.contains('fall')){playNode(f,'hit1',{hold:true,interval:68});return}if(f.classList.contains('hit')){playNode(f,'hit1',{interval:68,onDone:()=>later(f.closest('.battle-visual-stage'),()=>{if(f.isConnected&&!f.classList.contains('dead'))playNode(f,'stand',{loop:true,interval:150})},25)});return}if(f.classList.contains('bv-moving'))return;playNode(f,'stand',{loop:true,interval:150})}
function bindFighter(f){if(!f||f.dataset.huangshanFrames==='046')return;f.dataset.huangshanFrames='046';react(f);const o=new MutationObserver(()=>react(f));o.observe(f,{attributes:true,attributeFilter:['class']})}
function bindGhost(g){if(!roleReady||!g||g.dataset.huangshanFrames==='046'||!g.matches?.('.bv-dash-ghost.actor-huangshan'))return;g.dataset.huangshanFrames='046';g.classList.add('huangshan46-ghost');playNode(g,'run',{loop:true,interval:55});const stage=g.closest('.battle-visual-stage');later(stage,()=>{if(g.isConnected)playNode(g,'att1',{interval:48,hold:true})},115)}
function inspect(node){if(node.nodeType!==1)return;if(node.matches?.('.bv-fighter[data-fighter-id="huangshan"]'))bindFighter(node);node.querySelectorAll?.('.bv-fighter[data-fighter-id="huangshan"]').forEach(bindFighter);if(node.matches?.('.bv-dash-ghost.actor-huangshan'))bindGhost(node);node.querySelectorAll?.('.bv-dash-ghost.actor-huangshan').forEach(bindGhost)}
function bindStage(stage){if(!stage||boundStages.has(stage))return;boundStages.add(stage);stage.querySelectorAll('.bv-fighter[data-fighter-id="huangshan"]').forEach(bindFighter);const o=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)inspect(n)});o.observe(stage,{childList:true,subtree:true})}
function scan(){battleBody.querySelectorAll('.battle-visual-stage').forEach(bindStage)}
loadSequential(['stand','run','att1','att2','hit1']).then(()=>{roleReady=true;scan()}).catch(e=>console.warn('[XYT] Huangshan role resize failed; generic fallback retained.',e));
function preloadMagic(){if(magicReady)return Promise.resolve();if(magicLoading)return magicLoading;const keys=[...new Set([...ACTOR_TRACKS,...BG_TRACKS].map(x=>x[0]))];magicLoading=loadSequential(keys).then(()=>{magicReady=true});return magicLoading}
function center(el,root){const r=(el?.querySelector?.('.bv-portrait')||el)?.getBoundingClientRect?.();return r?{x:r.left-root.left+r.width/2,y:r.top-root.top+r.height*.82}:null}
function spawnFx(stage,key,dur,x,y,sx=1,sy=1,layer='actor'){const w=document.createElement('i'),sp=document.createElement('b');w.className=`huangshan46-fx ${layer}`;sp.className='huangshan46-sprite';w.style.left=`${x}px`;w.style.top=`${y}px`;w.appendChild(sp);stage.appendChild(w);playSpan(stage,sp,key,dur,()=>w.remove(),sx,sy);later(stage,()=>w.remove(),dur+100)}
function actorPoint(tr,a,t){const x=Number(tr[5]||0),y=Number(tr[6]||0),q=Math.max(-.25,Math.min(1.25,x/300));return{x:a.x+(t.x-a.x)*q,y:a.y+(t.y-a.y)*q+y*.16}}
function showName(stage){const el=document.createElement('div');el.className='huangshan46-skillname';const i=document.createElement('i');i.style.backgroundImage=`url("${SKILLNAME}")`;el.appendChild(i);battleDialog.appendChild(el);later(stage,()=>el.classList.add('leaving'),520);later(stage,()=>el.remove(),680)}
function playSound(){try{const a=new Audio(SOUND);a.volume=.72;audios.add(a);const done=()=>audios.delete(a);a.addEventListener('ended',done,{once:true});a.addEventListener('error',done,{once:true});a.play().catch(done)}catch{}}
function impact(stage,target,strong=false){target?.animate?.(strong?[{transform:'translate3d(0,0,0)'},{transform:'translate3d(9px,-2px,0)'},{transform:'translate3d(-7px,2px,0)'},{transform:'translate3d(0,0,0)'}]:[{transform:'translate3d(0,0,0)'},{transform:'translate3d(4px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,strong?230:150),easing:'ease-out'})}
function clear(stage){stage?.querySelectorAll?.('.huangshan46-caster,.huangshan46-fx').forEach(x=>x.remove());battleDialog.querySelectorAll('.huangshan46-skillname').forEach(x=>x.remove());const f=stage?.querySelector?.('.bv-fighter[data-fighter-id="huangshan"]');if(f){const p=f.querySelector('.bv-portrait');if(p)p.style.visibility='';f.classList.remove('bv-moving')}}
function cast(stage,targetEls,onImpact){const actor=stage.querySelector('.bv-fighter[data-fighter-id="huangshan"]'),src=actor?.querySelector('.bv-portrait'),target=targetEls[0];if(!actor||!src||!target){onImpact?.();return}clear(stage);const root=stage.getBoundingClientRect(),a=center(actor,root),t=center(target,root);if(!a||!t){onImpact?.();return}actor.classList.add('bv-moving');src.style.visibility='hidden';const caster=document.createElement('div'),sp=document.createElement('span');caster.className='huangshan46-caster';sp.className='huangshan46-sprite';caster.style.left=`${a.x}px`;caster.style.top=`${a.y}px`;caster.appendChild(sp);stage.appendChild(caster);playSpan(stage,sp,'att2',ULT_TOTAL);showName(stage);playSound();for(const tr of ACTOR_TRACKS)later(stage,()=>{if(!caster.isConnected)return;const p=actorPoint(tr,a,t);spawnFx(stage,tr[0],tr[2],p.x,p.y,tr[3],tr[4],'actor')},tr[1]);const c={x:root.width/2,y:root.height/2};for(const tr of BG_TRACKS)later(stage,()=>{if(caster.isConnected)spawnFx(stage,tr[0],tr[2],c.x+Number(tr[5]||0)*.12,c.y+Number(tr[6]||0)*.12,tr[3],tr[4],'bg')},tr[1]);for(const ms of HIT_CUES)later(stage,()=>impact(stage,target,ms===3000),ms);for(const ms of SHAKES)later(stage,()=>stage.animate?.([{transform:'translate3d(0,0,0)'},{transform:'translate3d(-6px,1px,0)'},{transform:'translate3d(6px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,220),easing:'ease-out'}),ms);let settled=false;later(stage,()=>{if(!settled){settled=true;onImpact?.()}},SETTLE_AT);later(stage,()=>{if(!settled){settled=true;onImpact?.()}caster.remove();src.style.visibility='';actor.classList.remove('bv-moving');if(actor.isConnected&&!actor.classList.contains('dead'))playNode(actor,'stand',{loop:true,interval:150})},ULT_TOTAL+120)}
battleBody.addEventListener('xyt-huangshan-ultimate',e=>{const stage=e.target?.closest?.('.battle-visual-stage')||e.target,d=e.detail||{};if(!roleReady||!magicReady||!stage?.classList?.contains('battle-visual-stage')||!Array.isArray(d.targetEls)||typeof d.onImpact!=='function')return;stage.dataset.bvActionDelayMs='3650';e.preventDefault();cast(stage,d.targetEls,d.onImpact)});
battleBody.addEventListener('xyt-battle-stop',()=>{for(const id of timers)clearTimeout(id);timers.clear();for(const a of audios){try{a.pause();a.currentTime=0}catch{}}audios.clear();battleBody.querySelectorAll('.battle-visual-stage').forEach(clear)});
const rootObserver=new MutationObserver(scan);rootObserver.observe(battleBody,{childList:true,subtree:true});scan();
