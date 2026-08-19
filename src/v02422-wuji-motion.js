// V0.24.22: visible full-body Zhang Wuji motion for all current story skills.
// battle.js / v02421-battle-visual.js remain authoritative for targets and damage.
const body=document.querySelector('#battleDialogBody');
if(!body) throw new Error('battle body missing');

const bound=new WeakSet();
const castState=new WeakMap();

function rate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function scaled(stage,ms){return ms/rate(stage);}

function cloneWuji(stage,target){
  const source=stage.querySelector('.bv-fighter[data-fighter-id="wuji"] .bv-portrait');
  const targetPortrait=target?.querySelector('.bv-portrait');
  if(!source||!targetPortrait||!source.animate)return;
  const state=castState.get(stage);
  if(!state||state.dashed)return;
  state.dashed=true;

  const sr=source.getBoundingClientRect(),tr=targetPortrait.getBoundingClientRect(),rr=stage.getBoundingClientRect();
  const ghost=source.cloneNode(true);
  ghost.className='bv-portrait wuji-v02422-ghost';
  ghost.style.left=`${sr.left-rr.left}px`;
  ghost.style.top=`${sr.top-rr.top}px`;
  ghost.style.width=`${sr.width}px`;
  ghost.style.height=`${sr.height}px`;
  stage.appendChild(ghost);
  source.style.visibility='hidden';

  const dx=(tr.left+tr.width/2)-(sr.left+sr.width/2);
  const dy=(tr.top+tr.height/2)-(sr.top+sr.height/2);
  const duration=scaled(stage,620);
  const anim=ghost.animate([
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},
    {offset:.14,transform:'translate3d(-9px,2px,0) scale(.96)',filter:'brightness(1.06)'},
    {offset:.48,transform:`translate3d(${dx*.72}px,${dy*.72-4}px,0) scale(1.08)`,filter:'brightness(1.28)'},
    {offset:.62,transform:`translate3d(${dx*.91}px,${dy*.91}px,0) scale(1.13)`,filter:'brightness(1.62) drop-shadow(0 0 12px rgba(255,211,118,.9))'},
    {offset:.77,transform:`translate3d(${dx*.72}px,${dy*.72}px,0) scale(1.05)`,filter:'brightness(1.1)'},
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'}
  ],{duration,easing:'cubic-bezier(.2,.78,.2,1)'});

  const hitDelay=scaled(stage,360);
  setTimeout(()=>{
    const fx=document.createElement('span');
    fx.className='wuji-v02422-fist';
    targetPortrait.appendChild(fx);
    setTimeout(()=>fx.remove(),scaled(stage,420));
  },hitDelay);

  const finish=()=>{ghost.remove();source.style.visibility='';};
  anim.onfinish=finish;anim.oncancel=finish;
}

function beginWujiCast(stage,banner){
  if(!banner.classList.contains('show'))return;
  const text=(banner.textContent||'').trim();
  if(!text.startsWith('张无忌 · '))return;
  const skill=text.slice('张无忌 · '.length).trim();
  // 武当长拳已有 v02421 内建的精确目标冲拳，避免重复克隆。
  if(skill==='武当长拳')return;

  const token=Symbol('wuji-cast');
  castState.set(stage,{token,dashed:false});
  stage.classList.add('wuji-v02422-cast');

  const source=stage.querySelector('.bv-fighter[data-fighter-id="wuji"] .bv-portrait');
  source?.animate?.([
    {transform:'translate3d(0,0,0) scale(1)'},
    {offset:.34,transform:'translate3d(-7px,2px,0) scale(.95)'},
    {offset:.62,transform:'translate3d(5px,-2px,0) scale(1.07)'},
    {transform:'translate3d(0,0,0) scale(1)'}
  ],{duration:scaled(stage,520),easing:'cubic-bezier(.2,.75,.2,1)'});

  setTimeout(()=>{
    const current=castState.get(stage);
    if(current?.token===token){stage.classList.remove('wuji-v02422-cast');castState.delete(stage);}
  },scaled(stage,900));
}

function inspectAdded(stage,node){
  const state=castState.get(stage);if(!state||state.dashed)return;
  const impacts=[];
  if(node.nodeType===1){
    if(node.matches?.('.bv-impact.burst'))impacts.push(node);
    impacts.push(...(node.querySelectorAll?.('.bv-impact.burst')||[]));
  }
  const impact=impacts[0];if(!impact)return;
  const target=impact.closest('.enemy-team .bv-fighter');
  if(target)cloneWuji(stage,target);
}

function bind(stage){
  if(!stage||bound.has(stage))return;
  bound.add(stage);
  const banner=stage.querySelector('[data-bv-skill]');
  if(banner){
    const bo=new MutationObserver(()=>beginWujiCast(stage,banner));
    bo.observe(banner,{attributes:true,attributeFilter:['class'],childList:true,characterData:true,subtree:true});
  }
  const so=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)inspectAdded(stage,node);
  });
  so.observe(stage,{childList:true,subtree:true});
}

const root=new MutationObserver(()=>{
  const stage=body.querySelector('.battle-visual-stage');
  if(stage)bind(stage);
});
root.observe(body,{childList:true,subtree:true});
requestAnimationFrame(()=>bind(body.querySelector('.battle-visual-stage')));
