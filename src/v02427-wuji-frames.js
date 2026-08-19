// V0.24.27: Zhang Wuji real APK frame animation sample.
// Source frames are sampled from original APK role/1001003 stand / att1 / hit1 sheets.
// Battle target / damage remain authoritative in v02426-battle-visual.js + battle.js.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody) throw new Error('battle body missing');

const PARTS=Array.from({length:6},(_,i)=>`./assets/original/wuji-frames/atlas.part.${String(i).padStart(2,'0')}.txt?v=02427`);
const ATLAS_W=384,ATLAS_H=194,RENDER_SCALE=1.15;
const ACTIONS={
  stand:{loop:true,interval:260,frames:[
    [-21.42,-66.36,35,69,1,1],[-21.42,-65.94,35,68,37,1],[-20.58,-65.94,34,68,73,1],
    [-19.74,-65.94,34,68,108,1],[-19.74,-65.94,34,68,143,1],[-20.58,-65.94,35,68,178,1]
  ]},
  att1:{loop:false,interval:72,frames:[
    [-27.72,-60.48,57,64,214,1],[-26.04,-52.08,57,58,272,1],[-10.08,-56.7,59,57,1,71],
    [-9.66,-53.34,63,54,61,71],[-11.34,-52.92,66,54,125,71],[-13.02,-52.92,66,57,192,71],
    [-16.38,-54.18,66,59,259,71],[-18.9,-55.02,64,60,1,131]
  ]},
  hit1:{loop:false,interval:80,frames:[
    [-25.2,-52.92,56,55,66,131],[-26.04,-60.06,54,62,123,131],[-30.66,-58.38,57,62,178,131]
  ]}
};

let atlasUrl='';
const states=new WeakMap();
const boundStages=new WeakSet();

function speedRate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function portraitOf(node){
  if(!node)return null;
  if(node.classList?.contains('bv-portrait'))return node;
  if(node.classList?.contains('bv-dash-ghost'))return node;
  return node.querySelector?.('.bv-portrait')||null;
}
function spriteOf(node){
  const portrait=portraitOf(node);if(!portrait)return null;
  const span=portrait.querySelector(':scope > span');if(!span)return null;
  span.classList.add('wuji-frame-sprite');
  span.textContent='';
  return span;
}
function setFrame(node,actionName,index){
  if(!atlasUrl)return;
  const action=ACTIONS[actionName],frame=action?.frames?.[index];if(!frame)return;
  const span=spriteOf(node);if(!span)return;
  const [ox,oy,w,h,x,y]=frame,s=RENDER_SCALE;
  span.style.left=`calc(50% + ${ox*s}px)`;
  span.style.top=`calc(100% + ${oy*s}px)`;
  span.style.width=`${w*s}px`;
  span.style.height=`${h*s}px`;
  span.style.backgroundImage=`url("${atlasUrl}")`;
  span.style.backgroundSize=`${ATLAS_W*s}px ${ATLAS_H*s}px`;
  span.style.backgroundPosition=`${-x*s}px ${-y*s}px`;
  span.style.backgroundRepeat='no-repeat';
}
function stop(node){
  const s=states.get(node);if(s?.timer)clearTimeout(s.timer);
  if(s)s.token+=1;
}
function play(node,actionName,{hold=false,onDone=null}={}){
  if(!node||!ACTIONS[actionName]||!atlasUrl)return;
  stop(node);
  const action=ACTIONS[actionName],stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage');
  const state=states.get(node)||{token:0,timer:null};state.token+=1;states.set(node,state);
  const token=state.token;let i=0;
  const step=()=>{
    if(states.get(node)?.token!==token||!node.isConnected)return;
    setFrame(node,actionName,i);
    i+=1;
    if(i>=action.frames.length){
      if(action.loop)i=0;
      else if(hold){setFrame(node,actionName,action.frames.length-1);onDone?.();return;}
      else {onDone?.();return;}
    }
    state.timer=setTimeout(step,Math.max(24,action.interval/speedRate(stage)));
  };
  step();
}
function returnIdle(fighter){
  if(!fighter?.isConnected||fighter.classList.contains('dead'))return;
  if(fighter.classList.contains('hit')||fighter.classList.contains('bv-moving')||fighter.classList.contains('bv-single-skill-cast')||fighter.classList.contains('wuji-longfist-cast')||fighter.classList.contains('skill-cast'))return;
  play(fighter,'stand');
}
function reactToFighter(fighter){
  if(!fighter?.isConnected)return;
  fighter.classList.add('wuji-frame-ready');
  if(fighter.classList.contains('dead')){play(fighter,'hit1',{hold:true});return;}
  if(fighter.classList.contains('hit')||fighter.classList.contains('fall')){
    play(fighter,'hit1',{onDone:()=>setTimeout(()=>returnIdle(fighter),30)});return;
  }
  if(fighter.classList.contains('bv-moving')||fighter.classList.contains('bv-single-skill-cast')||fighter.classList.contains('wuji-longfist-cast')||fighter.classList.contains('skill-cast')){
    play(fighter,'att1',{onDone:()=>setTimeout(()=>returnIdle(fighter),30)});return;
  }
  returnIdle(fighter);
}
function bindFighter(fighter){
  if(!fighter||fighter.dataset.wujiFramesBound==='1')return;
  fighter.dataset.wujiFramesBound='1';
  reactToFighter(fighter);
  const observer=new MutationObserver(()=>reactToFighter(fighter));
  observer.observe(fighter,{attributes:true,attributeFilter:['class']});
}
function bindGhost(ghost){
  if(!ghost||ghost.dataset.wujiFramesBound==='1')return;
  ghost.dataset.wujiFramesBound='1';
  ghost.classList.add('wuji-frame-ready');
  play(ghost,'att1',{hold:true});
}
function inspectNode(stage,node){
  if(node.nodeType!==1)return;
  if(node.matches?.('.bv-fighter[data-fighter-id="wuji"]'))bindFighter(node);
  node.querySelectorAll?.('.bv-fighter[data-fighter-id="wuji"]').forEach(bindFighter);
  if(node.matches?.('.bv-dash-ghost.actor-wuji'))bindGhost(node);
  node.querySelectorAll?.('.bv-dash-ghost.actor-wuji').forEach(bindGhost);
}
function bindStage(stage){
  if(!stage||boundStages.has(stage))return;
  boundStages.add(stage);
  stage.querySelectorAll('.bv-fighter[data-fighter-id="wuji"]').forEach(bindFighter);
  stage.querySelectorAll('.bv-dash-ghost.actor-wuji').forEach(bindGhost);
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)inspectNode(stage,node);
  });
  observer.observe(stage,{childList:true,subtree:true});
}
function scan(){
  battleBody.querySelectorAll('.battle-visual-stage').forEach(bindStage);
}
async function loadAtlas(){
  const chunks=await Promise.all(PARTS.map(async url=>{
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`Wuji atlas chunk ${response.status}`);
    return (await response.text()).trim();
  }));
  const binary=atob(chunks.join(''));
  const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  atlasUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
  scan();
}

const rootObserver=new MutationObserver(scan);
rootObserver.observe(battleBody,{childList:true,subtree:true});
loadAtlas().catch(err=>console.warn('[XYT] Wuji frame atlas unavailable; keep V0.24.26 figure fallback.',err));
