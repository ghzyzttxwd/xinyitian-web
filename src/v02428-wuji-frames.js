// V0.24.28: Zhang Wuji original APK frame choreography.
// Keeps the verified V0.24.27 atlas, but no longer plays attack frames for the whole travel path.
// Travel uses stable standing frames; the real attack frames start just before contact and settle before return.
// Battle target / damage remain authoritative in v02426-battle-visual.js + battle.js.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody) throw new Error('battle body missing');

const PARTS=['00','01','02a','02b','03','04','05'].map(id=>`./assets/original/wuji-frames/atlas.part.${id}.txt?v=02428`);
const ATLAS_W=384,ATLAS_H=194,RENDER_SCALE=1.15;
const ACTIONS={
  stand:{loop:true,interval:180,frames:[
    [-21.42,-66.36,35,69,1,1],[-21.42,-65.94,35,68,37,1],[-20.58,-65.94,34,68,73,1],
    [-19.74,-65.94,34,68,108,1],[-19.74,-65.94,34,68,143,1],[-20.58,-65.94,35,68,178,1]
  ]},
  att1:{loop:false,interval:45,frames:[
    [-27.72,-60.48,57,64,214,1],[-26.04,-52.08,57,58,272,1],[-10.08,-56.7,59,57,1,71],
    [-9.66,-53.34,63,54,61,71],[-11.34,-52.92,66,54,125,71],[-13.02,-52.92,66,57,192,71],
    [-16.38,-54.18,66,59,259,71],[-18.9,-55.02,64,60,1,131]
  ]},
  hit1:{loop:false,interval:72,frames:[
    [-25.2,-52.92,56,55,66,131],[-26.04,-60.06,54,62,123,131],[-30.66,-58.38,57,62,178,131]
  ]}
};

let atlasUrl='';
const states=new WeakMap();
const boundStages=new WeakSet();
const ghostTimers=new WeakMap();

function speedRate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function scaled(stage,ms){return ms/speedRate(stage);}
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
  const frame=ACTIONS[actionName]?.frames?.[index];if(!frame)return;
  const span=spriteOf(node);if(!span)return;
  const [ox,oy,w,h,x,y]=frame,s=RENDER_SCALE;
  // Preserve the original APK actor-root offsets. The container owns travel; frames only animate the body.
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
  const state=states.get(node);if(state?.timer)clearTimeout(state.timer);
  if(state)state.token+=1;
}
function play(node,actionName,{hold=false,onDone=null}={}){
  if(!node||!ACTIONS[actionName]||!atlasUrl)return;
  stop(node);
  const action=ACTIONS[actionName],stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage');
  const state=states.get(node)||{token:0,timer:null};state.token+=1;states.set(node,state);
  const token=state.token;let i=0;
  const step=()=>{
    if(states.get(node)?.token!==token||!node.isConnected)return;
    setFrame(node,actionName,i++);
    if(i>=action.frames.length){
      if(action.loop)i=0;
      else if(hold){setFrame(node,actionName,action.frames.length-1);onDone?.();return;}
      else {onDone?.();return;}
    }
    state.timer=setTimeout(step,Math.max(22,action.interval/speedRate(stage)));
  };
  step();
}
function returnIdle(fighter){
  if(!fighter?.isConnected||fighter.classList.contains('dead'))return;
  if(fighter.classList.contains('hit')||fighter.classList.contains('fall')||fighter.classList.contains('bv-moving'))return;
  play(fighter,'stand');
}
function reactToFighter(fighter){
  if(!fighter?.isConnected)return;
  if(!fighter.classList.contains('wuji-frame-ready'))fighter.classList.add('wuji-frame-ready');
  if(fighter.classList.contains('dead')){play(fighter,'hit1',{hold:true});return;}
  if(fighter.classList.contains('hit')||fighter.classList.contains('fall')){
    play(fighter,'hit1',{onDone:()=>setTimeout(()=>returnIdle(fighter),30)});return;
  }
  // The original source portrait is hidden while a dash ghost moves. Do not waste an attack animation here.
  if(fighter.classList.contains('bv-moving'))return;
  returnIdle(fighter);
}
function bindFighter(fighter){
  if(!fighter||fighter.dataset.wujiFramesBound==='028')return;
  fighter.dataset.wujiFramesBound='028';
  reactToFighter(fighter);
  const observer=new MutationObserver(()=>reactToFighter(fighter));
  observer.observe(fighter,{attributes:true,attributeFilter:['class']});
}
function impactBase(ghost){
  if(ghost.classList.contains('wuji-longfist-ghost'))return 360;
  if(ghost.classList.contains('bv-single-skill-ghost'))return 350;
  return 205;
}
function clearGhostTimers(ghost){
  const timers=ghostTimers.get(ghost)||[];for(const timer of timers)clearTimeout(timer);ghostTimers.delete(ghost);
}
function bindGhost(ghost){
  if(!ghost||ghost.dataset.wujiFramesBound==='028')return;
  ghost.dataset.wujiFramesBound='028';
  ghost.classList.add('wuji-frame-ready');
  const stage=ghost.closest('.battle-visual-stage');
  const impact=impactBase(ghost);
  // Fix from the V0.24.27 recording: do NOT animate the punch for the entire trip.
  // Stable travel -> real strike near contact -> stable return.
  play(ghost,'stand');
  const timers=[];
  timers.push(setTimeout(()=>{if(ghost.isConnected)play(ghost,'att1');},scaled(stage,Math.max(40,impact-150))));
  timers.push(setTimeout(()=>{if(ghost.isConnected)play(ghost,'stand');},scaled(stage,impact+170)));
  timers.push(setTimeout(()=>clearGhostTimers(ghost),scaled(stage,900)));
  ghostTimers.set(ghost,timers);
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
function scan(){battleBody.querySelectorAll('.battle-visual-stage').forEach(bindStage);}
async function loadAtlas(){
  const chunks=await Promise.all(PARTS.map(async url=>{
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`Wuji atlas chunk ${response.status}`);
    return (await response.text()).trim();
  }));
  const binary=atob(chunks.join(''));
  const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  if(bytes.length!==24170||binary.slice(0,4)!=='RIFF'||binary.slice(8,12)!=='WEBP')throw new Error('Wuji atlas integrity check failed');
  atlasUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
  scan();
}

const rootObserver=new MutationObserver(scan);
rootObserver.observe(battleBody,{childList:true,subtree:true});
loadAtlas().catch(err=>console.warn('[XYT] Wuji frame atlas unavailable; keep V0.24.26 figure fallback.',err));
