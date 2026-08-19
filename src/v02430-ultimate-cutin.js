// V0.24.30: Zhang Wuji ultimate cut-in + target-accurate follow-up FX.
// Visuals never choose targets. v02430-battle-visual passes the already-authoritative target elements.
const battleBody=document.querySelector('#battleDialogBody');
if(!battleBody) throw new Error('battle body missing');

const active=new Set();
const later=(fn,ms)=>{const id=setTimeout(()=>{active.delete(id);fn();},ms);active.add(id);return id;};
function speedRate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function scaled(stage,ms){return ms/speedRate(stage);}
function center(rect,root){return {x:rect.left-root.left+rect.width/2,y:rect.top-root.top+rect.height/2};}
function clearStage(stage){
  for(const el of stage.querySelectorAll('.wuji30-strike-fx'))el.remove();
  stage.classList.remove('wuji30-striking');
}
function clearCutins(){for(const el of document.querySelectorAll('.wuji30-cutin'))el.remove();}

function strike(stage,targetEls,onImpact){
  const valid=targetEls.filter(el=>el?.isConnected);
  if(!valid.length){onImpact?.();return;}
  clearStage(stage);
  stage.classList.add('wuji30-striking');
  const root=stage.getBoundingClientRect();
  const start={x:root.width*.34,y:root.height*.48};
  const centers=valid.map(el=>center((el.querySelector('.bv-portrait')||el).getBoundingClientRect(),root));
  const impactOnce=(()=>{let done=false;return()=>{if(done)return;done=true;onImpact?.();};})();

  for(const [i,p] of centers.entries()){
    const dx=p.x-start.x,dy=p.y-start.y;
    const beam=document.createElement('i');
    beam.className='wuji30-strike-fx wuji30-beam';
    beam.style.left=`${start.x}px`;beam.style.top=`${start.y}px`;
    beam.style.setProperty('--dx',`${dx}px`);beam.style.setProperty('--dy',`${dy}px`);
    beam.style.setProperty('--delay',`${scaled(stage,i*24)}ms`);
    beam.style.setProperty('--dur',`${scaled(stage,300)}ms`);
    stage.appendChild(beam);

    const burst=document.createElement('i');
    burst.className='wuji30-strike-fx wuji30-burst';
    burst.style.left=`${p.x}px`;burst.style.top=`${p.y}px`;
    burst.style.animationDelay=`${scaled(stage,170+i*24)}ms`;
    burst.style.animationDuration=`${scaled(stage,360)}ms`;
    stage.appendChild(burst);
  }

  later(()=>{
    impactOnce();
    if(stage.animate){
      stage.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(-5px,1px,0)'},{transform:'translate3d(6px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,220),easing:'ease-out'});
    }
  },scaled(stage,215));
  later(()=>clearStage(stage),scaled(stage,620));
}

function playCutin(stage,skill,targetEls,onImpact,onComplete){
  clearCutins();
  const overlay=document.createElement('div');
  overlay.className='wuji30-cutin';
  overlay.innerHTML=`<div class="wuji30-backdrop"></div><div class="wuji30-lines"></div><div class="wuji30-figure" aria-hidden="true"></div><div class="wuji30-title"><b>张无忌</b><span>${String(skill||'绝技')}</span></div>`;
  document.body.appendChild(overlay);
  const rate=speedRate(stage),figure=overlay.querySelector('.wuji30-figure');
  const title=overlay.querySelector('.wuji30-title');
  const ms=n=>n/rate;
  if(figure?.animate){
    figure.animate([
      {opacity:0,transform:'translate3d(-8%,5%,0) scale(.55)',filter:'brightness(.7)'},
      {offset:.28,opacity:1,transform:'translate3d(0,0,0) scale(.98)',filter:'brightness(1.22) drop-shadow(0 0 24px rgba(183,224,255,.72))'},
      {offset:.72,opacity:1,transform:'translate3d(1%,-1%,0) scale(1.02)',filter:'brightness(1.08) drop-shadow(0 0 18px rgba(183,224,255,.55))'},
      {opacity:0,transform:'translate3d(7%,-2%,0) scale(1.12)',filter:'brightness(1.45) blur(.5px)'}
    ],{duration:ms(690),easing:'cubic-bezier(.16,.78,.2,1)',fill:'forwards'});
  }
  if(title?.animate){
    title.animate([{opacity:0,transform:'translateY(10px)'},{offset:.28,opacity:1,transform:'translateY(0)'},{offset:.76,opacity:1},{opacity:0,transform:'translateY(-5px)'}],{duration:ms(650),easing:'ease-out',fill:'forwards'});
  }
  later(()=>{
    overlay.classList.add('leaving');
    later(()=>overlay.remove(),ms(90));
    strike(stage,targetEls,onImpact);
    onComplete?.();
  },ms(650));
}

battleBody.addEventListener('xyt-wuji-ultimate',event=>{
  const stage=event.target?.closest?.('.battle-visual-stage')||event.target;
  const detail=event.detail||{};
  if(!stage?.classList?.contains('battle-visual-stage'))return;
  if(!Array.isArray(detail.targetEls)||typeof detail.onImpact!=='function')return;
  event.preventDefault();
  playCutin(stage,detail.skill,detail.targetEls,detail.onImpact,detail.onComplete);
});

battleBody.addEventListener('xyt-battle-stop',()=>{for(const id of active)clearTimeout(id);active.clear();clearCutins();battleBody.querySelectorAll('.battle-visual-stage').forEach(clearStage);});
