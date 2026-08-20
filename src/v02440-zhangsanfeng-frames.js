// V0.24.40: authentic Zhang Sanfeng (model 1000012) battle frame runtime.
// Source: official 1.1.41 APK. Uses original stand/run/att1/att2/hit1 frame crops.
// No fabricated death sheet: death holds authentic hit1 then reuses existing fall/dead transform.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody) throw new Error('battle body missing');

const SHEETS={
  stand:{url:'./assets/original/zhangsanfeng-1000012/stand.webp?v=02440',w:178,h:138},
  run:{url:'./assets/original/zhangsanfeng-1000012/run.webp?v=02440',w:282,h:132},
  att1:{url:'./assets/original/zhangsanfeng-1000012/att1.webp?v=02440',w:270,h:144},
  att2a:{url:'./assets/original/zhangsanfeng-1000012/att2a.webp?v=02440',w:182,h:140},
  att2b:{url:'./assets/original/zhangsanfeng-1000012/att2b.webp?v=02440',w:368,h:130},
  hit1:{url:'./assets/original/zhangsanfeng-1000012/hit1.webp?v=02440',w:173,h:63}
};
const F=(sheet,rows)=>rows.map(row=>[sheet,...row]);
const ACTIONS={
  stand:{loop:true,interval:260,frames:F('stand',[[-21.0,-64.5,41,66,2,2],[-21.9,-64.5,42,66,46,2],[-19.5,-64.2,40,66,90,2],[-18.6,-64.2,40,66,134,2],[-20.4,-64.5,41,66,2,70]])},
  run:{loop:true,interval:55,frames:F('run',[[-32.4,-58.8,60,55,2,2],[-33.6,-57.9,68,58,72,2],[-23.7,-60.3,49,60,142,2],[-30.9,-56.7,54,58,212,2],[-30.6,-61.5,55,63,2,67],[-26.4,-60.6,50,61,72,67]])},
  att1:{loop:false,interval:45,frames:F('att1',[[-34.8,-65.1,52,69,2,2],[-30.6,-63.9,45,68,69,2],[-36.9,-59.4,54,62,136,2],[-30.9,-58.2,63,60,203,2],[-14.4,-55.2,52,57,2,73],[-14.1,-54.6,56,56,69,73],[-20.4,-54.9,65,57,136,73],[-18.6,-54.9,65,57,203,73]])},
  att2:{loop:false,interval:50,frames:[
    ...F('att2a',[[-22.2,-63.9,58,64,2,2],[-22.5,-60.0,54,61,62,2],[-20.7,-66.6,47,67,122,2],[-19.5,-64.2,56,64,2,71],[-15.0,-66.3,42,67,62,71],[-26.7,-66.0,46,67,122,71]]),
    ...F('att2b',[[-32.1,-62.1,52,62,2,2],[-20.1,-59.1,54,60,124,2],[-19.2,-57.6,64,58,246,2],[-41.1,-59.4,120,60,2,66],[10.8,-58.2,107,58,124,66],[33.6,-58.2,71,58,246,66]])
  ]},
  hit1:{loop:false,interval:65,frames:F('hit1',[[-15.3,-47.1,47,49,2,2],[-19.5,-57.6,45,59,59,2],[-28.2,-53.4,55,56,116,2]])}
};

const states=new WeakMap(),boundStages=new WeakSet();
let ready=false;

function speedRate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function scaled(stage,ms){return Math.max(20,ms/speedRate(stage));}
function spriteOf(node){
  if(!node)return null;
  const portrait=node.classList?.contains('bv-dash-ghost')?node:(node.querySelector?.('.bv-portrait')||null);
  if(!portrait)return null;
  const span=portrait.querySelector?.(':scope > span');
  if(!span)return null;
  span.classList.add('zsf-frame-sprite');
  span.textContent='';
  return span;
}
function setFrame(node,actionName,index){
  const frame=ACTIONS[actionName]?.frames?.[index];if(!frame)return;
  const [sheetName,ox,oy,w,h,x,y]=frame;
  const sheet=SHEETS[sheetName],span=spriteOf(node);if(!sheet||!span)return;
  span.style.left=`calc(50% + ${ox}px)`;
  span.style.top=`calc(100% + ${oy}px)`;
  span.style.width=`${w}px`;span.style.height=`${h}px`;
  span.style.backgroundImage=`url("${sheet.url}")`;
  span.style.backgroundSize=`${sheet.w}px ${sheet.h}px`;
  span.style.backgroundPosition=`${-x}px ${-y}px`;
  span.style.backgroundRepeat='no-repeat';
}
function stop(node){
  const s=states.get(node);
  if(s?.timer)clearTimeout(s.timer);
  if(s)s.token+=1;
}
function play(node,actionName,{hold=false}={}){
  if(!ready||!node||!ACTIONS[actionName])return;
  stop(node);
  const action=ACTIONS[actionName];
  const stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage');
  const s=states.get(node)||{token:0,timer:null};
  s.token+=1;states.set(node,s);
  const token=s.token;let i=0;
  const step=()=>{
    if(states.get(node)?.token!==token||!node.isConnected)return;
    setFrame(node,actionName,i++);
    if(i>=action.frames.length){
      if(action.loop){i=0;s.timer=setTimeout(step,scaled(stage,action.interval));return;}
      if(hold)setFrame(node,actionName,action.frames.length-1);
      return;
    }
    s.timer=setTimeout(step,scaled(stage,action.interval));
  };
  step();
}
function isZsf(node){return !!node?.matches?.('.bv-fighter[data-fighter-id="zhangsanfeng"]');}
function reactFighter(f){
  if(!ready||!f?.isConnected)return;
  if(f.classList.contains('dead')||f.classList.contains('fall')||f.classList.contains('hit')){
    play(f,'hit1',{hold:true});return;
  }
  if(f.classList.contains('skill-cast')||f.classList.contains('bv-single-skill-cast')){
    play(f,'att2',{hold:true});return;
  }
  if(f.classList.contains('bv-moving'))return;
  play(f,'stand');
}
function bindFighter(f){
  if(!f||f.dataset.zsfFramesBound==='040')return;
  f.dataset.zsfFramesBound='040';
  f.classList.add('zsf-frame-ready');
  reactFighter(f);
  const observer=new MutationObserver(()=>reactFighter(f));
  observer.observe(f,{attributes:true,attributeFilter:['class']});
}
function bindGhost(g){
  if(!ready||!g||g.dataset.zsfFramesBound==='040'||!g.matches?.('.bv-dash-ghost.actor-zhangsanfeng'))return;
  g.dataset.zsfFramesBound='040';
  g.classList.add('zsf-frame-ghost');
  const stage=g.closest('.battle-visual-stage');
  play(g,'run');
  const strike=g.classList.contains('bv-single-skill-ghost')?'att2':'att1';
  setTimeout(()=>{if(g.isConnected)play(g,strike,{hold:true});},scaled(stage,180));
}
function inspect(node){
  if(node.nodeType!==1)return;
  if(isZsf(node))bindFighter(node);
  node.querySelectorAll?.('.bv-fighter[data-fighter-id="zhangsanfeng"]').forEach(bindFighter);
  if(node.matches?.('.bv-dash-ghost.actor-zhangsanfeng'))bindGhost(node);
  node.querySelectorAll?.('.bv-dash-ghost.actor-zhangsanfeng').forEach(bindGhost);
}
function bindStage(stage){
  if(!stage||boundStages.has(stage))return;
  boundStages.add(stage);
  stage.querySelectorAll('.bv-fighter[data-fighter-id="zhangsanfeng"]').forEach(bindFighter);
  stage.querySelectorAll('.bv-dash-ghost.actor-zhangsanfeng').forEach(bindGhost);
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)inspect(node);
  });
  observer.observe(stage,{childList:true,subtree:true});
}
function scan(){battleBody.querySelectorAll('.battle-visual-stage').forEach(bindStage);}
function preloadSheet(name,sheet){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      if(img.naturalWidth!==sheet.w||img.naturalHeight!==sheet.h){
        reject(new Error(`Zhang Sanfeng ${name} dimension mismatch`));return;
      }
      resolve();
    };
    img.onerror=()=>reject(new Error(`Zhang Sanfeng ${name} load failed`));
    img.src=sheet.url;
  });
}
async function loadSheets(){
  await Promise.all(Object.entries(SHEETS).map(([name,sheet])=>preloadSheet(name,sheet)));
  ready=true;scan();
}
const rootObserver=new MutationObserver(scan);
rootObserver.observe(battleBody,{childList:true,subtree:true});
loadSheets().catch(err=>console.warn('[XYT] authentic Zhang Sanfeng battle frames unavailable; keep static fallback.',err));
