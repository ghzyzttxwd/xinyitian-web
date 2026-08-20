// V0.24.50: safe ordinary Xiao Zhao frames + authentic tower-guard stand frames.
// Stability invariant: only childList DOM insertion is observed. Never observe fighter class/attributes.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody)throw new Error('battle dialog missing');

const XZ_ROOT=new URL('../assets/original/xiaozhao-1000108/',import.meta.url);
const XZ_META=new URL('meta.json',XZ_ROOT).href;
const XZ_ROLE=new URL('role-q82.webp',XZ_ROOT).href;
const XZ_SHEETS={};
let xzReady=false,xzLoading=null;
const timers=new Set(),states=new WeakMap();

const TOWER_MODELS=['1001129','1001228','1001226','1001227','1001225','1001129'];
const TOWER={"1001129":{"url":"https://xyttlj-static.xyimg.net/game/resself/model/role/stand/1001129_v2.png","w":313.2,"h":265.95,"frames":[[-18.9,-86.85,44.1,89.1,179.1,0.0],[-19.35,-85.95,44.55,88.2,179.1,89.1],[-19.8,-85.05,45.0,87.3,134.1,176.4],[-19.8,-85.05,45.0,87.3,179.1,177.3],[-19.35,-85.95,44.55,88.2,44.55,176.4]]},"1001228":{"url":"https://xyttlj-static.xyimg.net/game/resself/model/role/stand/1001228_v1.png","w":254.25,"h":294.3,"frames":[[-18.0,-94.95,33.3,98.1,170.1,196.2],[-18.45,-94.95,33.3,98.1,136.8,196.2],[-21.15,-94.95,36.0,98.1,146.7,98.1],[-22.5,-94.95,37.35,98.1,75.6,0.0],[-21.6,-94.95,36.45,98.1,112.95,0.0]]},"1001226":{"url":"https://xyttlj-static.xyimg.net/game/resself/model/role/stand/1001226_v3.png","w":318.6,"h":198.0,"frames":[[-14.85,-95.85,30.6,99.0,226.8,0.0],[-14.85,-95.85,30.6,99.0,288.0,0.0],[-16.65,-95.85,32.4,99.0,99.0,99.0],[-17.55,-95.85,33.3,99.0,66.6,0.0],[-16.2,-95.85,31.95,99.0,131.4,99.0]]},"1001227":{"url":"https://xyttlj-static.xyimg.net/game/resself/model/role/stand/1001227_v1.png","w":238.95,"h":272.25,"frames":[[-17.1,-88.2,34.2,90.9,34.2,0.0],[-17.1,-87.75,34.2,90.45,102.6,180.9],[-16.65,-87.75,33.75,90.45,0.0,181.8],[-16.65,-87.75,33.75,90.45,205.2,90.45],[-17.1,-87.75,34.2,90.45,136.8,90.45]]},"1001225":{"url":"https://xyttlj-static.xyimg.net/game/resself/model/role/stand/1001225_v3.png","w":490.95,"h":351.0,"frames":[[-54.0,-85.05,81.45,88.65,81.9,88.2],[-54.45,-84.15,81.9,87.75,163.8,0.0],[-54.45,-82.8,81.9,86.4,409.05,0.0],[-54.45,-82.8,81.9,86.4,409.05,86.4],[-54.45,-84.15,81.9,87.75,0.0,176.4]]}};
const towerReady=new Set();let towerLoading=null;

function speedRate(stage){const s=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));return Math.max(.5,s/2)}
function scaled(stage,ms){return Math.max(12,ms/speedRate(stage))}
function later(stage,fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},scaled(stage,ms));timers.add(id);return id}
function preload(url){return new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>resolve();i.onerror=()=>reject(new Error(`image load failed: ${url}`));i.src=url})}

async function ensureXzRole(){
  if(xzReady)return;if(xzLoading)return xzLoading;
  xzLoading=(async()=>{const r=await fetch(XZ_META,{cache:'force-cache'});if(!r.ok)throw new Error(`meta HTTP ${r.status}`);const m=await r.json();await preload(XZ_ROLE);for(const key of ['stand','run','att1','hit1']){const frames=m?.role?.frames?.[key];if(!frames?.length)throw new Error(`missing Xiao Zhao ${key}`);XZ_SHEETS[key]={url:XZ_ROLE,w:m.role.size[0],h:m.role.size[1],frames}}xzReady=true})().catch(e=>{xzLoading=null;console.warn('[XYT] Xiao Zhao ordinary frames unavailable; generic fallback retained.',e);throw e});return xzLoading;
}
function xzSpan(node){const p=node?.classList?.contains('bv-dash-ghost')?node:node?.querySelector?.('.bv-portrait');if(!p)return null;const s=p.querySelector?.(':scope > span');if(!s)return null;s.classList.add('xiaozhao47-sprite');s.dataset.xzSafeSprite='050';s.textContent='';return s}
function setXzFrame(span,key,index){const sh=XZ_SHEETS[key],f=sh?.frames?.[index];if(!sh||!f||!span)return;const [ox,oy,w,h,x,y]=f;span.style.left=`calc(50% + ${ox}px)`;span.style.top=`calc(100% + ${oy}px)`;span.style.width=`${w}px`;span.style.height=`${h}px`;span.style.backgroundImage=`url("${sh.url}")`;span.style.backgroundSize=`${sh.w}px ${sh.h}px`;span.style.backgroundPosition=`${-x}px ${-y}px`;span.style.backgroundRepeat='no-repeat'}
function stopNode(node){const s=states.get(node);if(s?.timer)clearTimeout(s.timer);if(s)s.token++}
function playFrames(node,frames,setter,{loop=false,interval=80,hold=false,onDone=null}={}){if(!node?.isConnected||!frames?.length)return;stopNode(node);const stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage'),st=states.get(node)||{token:0,timer:null};st.token++;states.set(node,st);const token=st.token;let i=0;const step=()=>{if(states.get(node)?.token!==token||!node.isConnected)return;setter(i++);if(i>=frames.length){if(loop){i=0;st.timer=setTimeout(step,scaled(stage,interval));return}if(hold)setter(frames.length-1);onDone?.();return}st.timer=setTimeout(step,scaled(stage,interval))};step()}
function playXz(node,key,opts={}){if(!xzReady||!XZ_SHEETS[key])return;const span=xzSpan(node);if(!span)return;playFrames(node,XZ_SHEETS[key].frames,i=>setXzFrame(span,key,i),opts)}
function setupXz(f){if(!xzReady||!f?.isConnected||f.dataset.xzOrdinarySafe==='050')return;f.dataset.xzOrdinarySafe='050';f.classList.add('xiaozhao47-ready');xzSpan(f);playXz(f,'stand',{loop:true,interval:150})}
function setupXzGhost(g){if(!xzReady||!g?.isConnected||g.dataset.xzOrdinarySafe==='050')return;const s=g.querySelector?.(':scope > span[data-xz-safe-sprite="050"],:scope > span.xiaozhao47-sprite');if(!s)return;g.dataset.xzOrdinarySafe='050';playXz(g,'run',{loop:true,interval:58});const stage=g.closest('.battle-visual-stage');later(stage,()=>{if(g.isConnected)playXz(g,'att1',{interval:52,hold:true})},120)}
function hitXz(f){if(!xzReady||!f?.isConnected)return;playXz(f,'hit1',{interval:68,hold:true});const stage=f.closest('.battle-visual-stage');later(stage,()=>{if(!f.isConnected)return;if(f.classList.contains('dead')||f.classList.contains('fall')){playXz(f,'hit1',{interval:68,hold:true});return}playXz(f,'stand',{loop:true,interval:150})},250)}

async function ensureTower(){
  if(towerReady.size===Object.keys(TOWER).length)return;if(towerLoading)return towerLoading;
  towerLoading=(async()=>{for(const mid of Object.keys(TOWER)){if(towerReady.has(mid))continue;await preload(TOWER[mid].url);towerReady.add(mid);scan()}})().catch(e=>{towerLoading=null;console.warn('[XYT] tower guard stand frames unavailable; gray fallback retained.',e);throw e});return towerLoading;
}
function towerSpan(node){const p=node?.classList?.contains('bv-dash-ghost')?node:node?.querySelector?.('.bv-portrait');if(!p)return null;const s=p.querySelector?.(':scope > span');if(!s)return null;s.classList.add('tower50-sprite');s.textContent='';return s}
function setTowerFrame(node,mid,index){const d=TOWER[mid],f=d?.frames?.[index],s=towerSpan(node);if(!d||!f||!s)return;const [ox,oy,w,h,x,y]=f;s.style.left=`calc(50% + ${ox}px)`;s.style.top=`calc(100% + ${oy}px)`;s.style.width=`${w}px`;s.style.height=`${h}px`;s.style.backgroundImage=`url("${d.url}")`;s.style.backgroundSize=`${d.w}px ${d.h}px`;s.style.backgroundPosition=`${-x}px ${-y}px`;s.style.backgroundRepeat='no-repeat';s.dataset.towerModel=mid}
function playTowerStand(node,mid){const d=TOWER[mid];if(!towerReady.has(mid)||!d)return;playFrames(node,d.frames,i=>setTowerFrame(node,mid,i),{loop:true,interval:275})}
function setupTower(stage){const guards=[...stage.querySelectorAll('.bv-fighter.enemy[data-fighter-name^="守塔人"]')];if(!guards.length)return;ensureTower().catch(()=>{});guards.forEach((f,i)=>{const mid=TOWER_MODELS[i%TOWER_MODELS.length];if(!towerReady.has(mid)||f.dataset.towerSafe==='050')return;f.dataset.towerSafe='050';f.dataset.towerModel=mid;f.classList.add('tower50-ready');towerSpan(f);playTowerStand(f,mid)})}
function setupTowerGhost(g){if(!g?.isConnected||g.dataset.towerSafe==='050')return;const s=g.querySelector?.(':scope > span[data-tower-model]');const mid=s?.dataset?.towerModel;if(!mid||!towerReady.has(mid))return;g.dataset.towerSafe='050';g.classList.add('tower50-ghost');playTowerStand(g,mid)}

function inspectAdded(n){if(n?.nodeType!==1)return;if(n.matches?.('.battle-visual-stage'))scanStage(n);n.querySelectorAll?.('.battle-visual-stage').forEach(scanStage);if(n.matches?.('.bv-fighter[data-fighter-id="xiaozhao"]'))setupXz(n);n.querySelectorAll?.('.bv-fighter[data-fighter-id="xiaozhao"]').forEach(setupXz);if(n.matches?.('.bv-dash-ghost')){setupXzGhost(n);setupTowerGhost(n)}n.querySelectorAll?.('.bv-dash-ghost').forEach(g=>{setupXzGhost(g);setupTowerGhost(g)});const impacts=[];if(n.matches?.('.bv-impact'))impacts.push(n);n.querySelectorAll?.('.bv-impact').forEach(x=>impacts.push(x));for(const x of impacts){const f=x.closest?.('.bv-fighter[data-fighter-id="xiaozhao"]');if(f)hitXz(f)}}
function scanStage(stage){if(!stage?.isConnected)return;stage.querySelectorAll('.bv-fighter[data-fighter-id="xiaozhao"]').forEach(setupXz);setupTower(stage);stage.querySelectorAll('.bv-dash-ghost').forEach(g=>{setupXzGhost(g);setupTowerGhost(g)})}
function scan(){battleBody.querySelectorAll('.battle-visual-stage').forEach(scanStage)}

ensureXzRole().then(scan).catch(()=>{});
const rootObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)inspectAdded(n)});
rootObserver.observe(battleBody,{childList:true,subtree:true});
scan();
battleBody.addEventListener('xyt-battle-stop',()=>{for(const id of timers)clearTimeout(id);timers.clear();battleBody.querySelectorAll('[data-xz-ordinary-safe="050"],[data-tower-safe="050"]').forEach(n=>stopNode(n))});
