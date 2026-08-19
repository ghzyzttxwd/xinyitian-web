// V0.24.39: original 1.1.41 Yuan soldier (model 1001113) frame runtime.
// Source: official com.kaichen.xyttlj.guanfang APK. Frames are original crops,
// compacted for mobile delivery. 1001113 has no model-specific dead sheet, so
// death uses authentic hit1 followed by the existing battle fall/dead state.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody) throw new Error('battle body missing');
const PARTS=['00','01','02','03'].map(id=>`./assets/original/yuanbing-1001113/atlas.part.${id}.txt?v=02439`);
const ATLAS_W=320,ATLAS_H=184,ATLAS_BYTES=21822;
const ACTIONS={
 stand:{loop:true,interval:275,frames:[[-36.9,-59.4,52,60,2,2],[-38.1,-59.1,53,60,56,2],[-39.3,-58.8,54,59,111,2],[-39.3,-58.8,54,59,167,2],[-38.1,-59.1,53,60,223,2]]},
 att1:{loop:false,interval:65,frames:[[-42.3,-55.5,60,58,2,64],[-34.8,-50.4,56,52,64,64],[-20.7,-52.5,40,55,122,64],[-21.9,-57.0,51,57,164,64],[-18.9,-44.7,49,46,217,64],[-19.2,-45.0,53,46,2,124],[-18.9,-45.9,51,47,57,124]]},
 hit1:{loop:false,interval:65,frames:[[-12.0,-47.4,36,54,110,124],[-18.6,-54.9,37,56,148,124],[-28.5,-53.1,42,58,187,124]]}
};
let atlasUrl='';const states=new WeakMap(),boundStages=new WeakSet();
function speedRate(stage){const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));return Math.max(.5,speed/2);}
function spriteOf(node){if(!node)return null;const portrait=node.classList?.contains('bv-dash-ghost')?node:(node.querySelector?.('.bv-portrait')||null);if(!portrait)return null;const span=portrait.querySelector?.(':scope > span');if(!span)return null;span.classList.add('yuanbing-frame-sprite');span.textContent='';return span;}
function setFrame(node,actionName,index){if(!atlasUrl)return;const frame=ACTIONS[actionName]?.frames?.[index];if(!frame)return;const span=spriteOf(node);if(!span)return;const [ox,oy,w,h,x,y]=frame;span.style.left=`calc(50% + ${ox}px)`;span.style.top=`calc(100% + ${oy}px)`;span.style.width=`${w}px`;span.style.height=`${h}px`;span.style.backgroundImage=`url("${atlasUrl}")`;span.style.backgroundSize=`${ATLAS_W}px ${ATLAS_H}px`;span.style.backgroundPosition=`${-x}px ${-y}px`;span.style.backgroundRepeat='no-repeat';}
function stop(node){const s=states.get(node);if(s?.timer)clearTimeout(s.timer);if(s)s.token+=1;}
function play(node,actionName,{hold=false}={}){if(!node||!ACTIONS[actionName]||!atlasUrl)return;stop(node);const action=ACTIONS[actionName],stage=node.closest?.('.battle-visual-stage')||battleBody.querySelector('.battle-visual-stage');const s=states.get(node)||{token:0,timer:null};s.token+=1;states.set(node,s);const token=s.token;let i=0;const delay=()=>Math.max(20,action.interval/speedRate(stage));const step=()=>{if(states.get(node)?.token!==token||!node.isConnected)return;setFrame(node,actionName,i++);if(i>=action.frames.length){if(action.loop){i=0;s.timer=setTimeout(step,delay());return;}if(hold)setFrame(node,actionName,action.frames.length-1);return;}s.timer=setTimeout(step,delay());};step();}
function isYuanbing(node){return !!node?.matches?.('.bv-fighter.enemy[data-fighter-name^="元兵"]');}
function react(f){if(!f?.isConnected)return;if(f.classList.contains('dead')||f.classList.contains('fall')||f.classList.contains('hit')){play(f,'hit1',{hold:true});return;}if(f.classList.contains('skill-cast')||f.classList.contains('bv-single-skill-cast')){play(f,'att1',{hold:true});return;}if(f.classList.contains('bv-moving'))return;play(f,'stand');}
function bindFighter(f){if(!f||f.dataset.yuanbingFramesBound==='039')return;f.dataset.yuanbingFramesBound='039';f.classList.add('yuanbing-frame-ready');react(f);const o=new MutationObserver(()=>react(f));o.observe(f,{attributes:true,attributeFilter:['class']});}
function bindGhost(g){if(!g||g.dataset.yuanbingFramesBound==='039'||!g.querySelector?.(':scope > .yuanbing-frame-sprite'))return;g.dataset.yuanbingFramesBound='039';g.classList.add('yuanbing-frame-ghost');play(g,'att1',{hold:true});}
function inspect(stage,node){if(node.nodeType!==1)return;if(isYuanbing(node))bindFighter(node);node.querySelectorAll?.('.bv-fighter.enemy[data-fighter-name^="元兵"]').forEach(bindFighter);if(node.matches?.('.bv-dash-ghost.enemy-ghost'))bindGhost(node);node.querySelectorAll?.('.bv-dash-ghost.enemy-ghost').forEach(bindGhost);}
function bindStage(stage){if(!stage||boundStages.has(stage))return;boundStages.add(stage);stage.querySelectorAll('.bv-fighter.enemy[data-fighter-name^="元兵"]').forEach(bindFighter);stage.querySelectorAll('.bv-dash-ghost.enemy-ghost').forEach(bindGhost);const o=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)inspect(stage,n);});o.observe(stage,{childList:true,subtree:true});}
function scan(){battleBody.querySelectorAll('.battle-visual-stage').forEach(bindStage);}
async function loadAtlas(){const chunks=await Promise.all(PARTS.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`Yuanbing atlas chunk ${r.status}`);return (await r.text()).trim();}));const binary=atob(chunks.join(''));if(binary.length!==ATLAS_BYTES||binary.slice(0,4)!=='RIFF'||binary.slice(8,12)!=='WEBP')throw new Error('Yuanbing atlas integrity check failed');const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);atlasUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));scan();}
const rootObserver=new MutationObserver(scan);rootObserver.observe(battleBody,{childList:true,subtree:true});loadAtlas().catch(err=>console.warn('[XYT] original Yuanbing frames unavailable; keep fallback enemy figure.',err));
