// V0.24.32: Zhang Wuji cinematic ultimate cut-in matched to reference pacing.
// The figure appears at its final size immediately; no slow zoom on low-resolution artwork.
// Visuals never choose targets; v02430-battle-visual passes authoritative target elements.
const battleBody=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
if(!battleBody||!battleDialog) throw new Error('battle dialog missing');

const active=new Set();
const later=(fn,ms)=>{const id=setTimeout(()=>{active.delete(id);fn();},ms);active.add(id);return id;};
function speedRate(stage){
  const speed=Math.max(1,Math.min(5,Number(stage?.dataset?.bvSpeedLevel||1)));
  return Math.max(.5,speed/2);
}
function scaled(stage,ms){return ms/speedRate(stage);}
function center(rect,root){return {x:rect.left-root.left+rect.width/2,y:rect.top-root.top+rect.height/2};}
function clearStage(stage){
  for(const el of stage.querySelectorAll('.wuji32-strike-fx,.wuji31-strike-fx,.wuji30-strike-fx'))el.remove();
  stage.classList.remove('wuji32-striking','wuji31-striking','wuji30-striking');
}
function clearCutins(){
  for(const el of document.querySelectorAll('.wuji32-cutin,.wuji31-cutin,.wuji30-cutin'))el.remove();
  battleDialog.classList.remove('wuji32-cutin-host','wuji31-cutin-host');
}
function titleRows(skill){
  const chars=[...String(skill||'绝技').replace(/\s+/g,'').slice(0,6)];
  if(chars.length<=2)return [chars.join('')];
  const split=chars.length<=4?2:Math.ceil(chars.length/2);
  return [chars.slice(0,split).join(''),chars.slice(split).join('')].filter(Boolean);
}

function strike(stage,targetEls,onImpact){
  const valid=targetEls.filter(el=>el?.isConnected);
  if(!valid.length){onImpact?.();return;}
  clearStage(stage);
  stage.classList.add('wuji32-striking');
  const root=stage.getBoundingClientRect();
  const start={x:root.width*.34,y:root.height*.48};
  const centers=valid.map(el=>center((el.querySelector('.bv-portrait')||el).getBoundingClientRect(),root));
  const impactOnce=(()=>{let done=false;return()=>{if(done)return;done=true;onImpact?.();};})();

  for(const [i,p] of centers.entries()){
    const dx=p.x-start.x,dy=p.y-start.y;
    const beam=document.createElement('i');
    beam.className='wuji32-strike-fx wuji32-beam';
    beam.style.left=`${start.x}px`;beam.style.top=`${start.y}px`;
    beam.style.setProperty('--dx',`${dx}px`);beam.style.setProperty('--dy',`${dy}px`);
    beam.style.setProperty('--delay',`${scaled(stage,i*24)}ms`);
    beam.style.setProperty('--dur',`${scaled(stage,300)}ms`);
    stage.appendChild(beam);

    const burst=document.createElement('i');
    burst.className='wuji32-strike-fx wuji32-burst';
    burst.style.left=`${p.x}px`;burst.style.top=`${p.y}px`;
    burst.style.animationDelay=`${scaled(stage,170+i*24)}ms`;
    burst.style.animationDuration=`${scaled(stage,360)}ms`;
    stage.appendChild(burst);
  }

  const impactAt=215+Math.max(0,valid.length-1)*24;
  later(()=>{
    impactOnce();
    if(stage.animate){
      stage.animate(
        [{transform:'translate3d(0,0,0)'},{transform:'translate3d(-5px,1px,0)'},{transform:'translate3d(6px,-1px,0)'},{transform:'translate3d(0,0,0)'}],
        {duration:scaled(stage,220),easing:'ease-out'}
      );
    }
  },scaled(stage,impactAt));
  later(()=>clearStage(stage),scaled(stage,620+Math.max(0,valid.length-1)*24));
}

function playCutin(stage,skill,targetEls,onImpact,onComplete){
  clearCutins();
  battleDialog.classList.add('wuji32-cutin-host');

  const overlay=document.createElement('div');
  overlay.className='wuji32-cutin';
  overlay.innerHTML='<div class="wuji32-backdrop"></div><div class="wuji32-moon"></div><div class="wuji32-energy e1"></div><div class="wuji32-energy e2"></div><div class="wuji32-sparks"></div><div class="wuji32-figure" aria-hidden="true"></div><div class="wuji32-skill-title" aria-label="技能名"></div><div class="wuji32-name">张无忌</div>';
  const title=overlay.querySelector('.wuji32-skill-title');
  for(const rowText of titleRows(skill)){
    const row=document.createElement('span');
    row.textContent=rowText;
    title.appendChild(row);
  }

  // Keep the cut-in inside the battle overlay so it cannot be covered.
  battleDialog.appendChild(overlay);

  const rate=speedRate(stage);
  const ms=n=>n/rate;
  const figure=overlay.querySelector('.wuji32-figure');
  const name=overlay.querySelector('.wuji32-name');

  // Instant cinematic reveal: enter at final size in ~50-80 ms, hold, then fade.
  // No scale interpolation is used on the character artwork.
  if(figure?.animate){
    figure.animate([
      {offset:0,opacity:0,transform:'translate3d(14px,8px,0)',filter:'brightness(.78)'},
      {offset:.07,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.12) drop-shadow(0 0 18px rgba(170,224,255,.52))'},
      {offset:.82,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.04) drop-shadow(0 0 14px rgba(170,224,255,.44))'},
      {offset:1,opacity:0,transform:'translate3d(-5px,-2px,0)',filter:'brightness(1.22)'}
    ],{duration:ms(520),easing:'linear',fill:'forwards'});
  }
  if(title?.animate){
    title.animate([
      {offset:0,opacity:0,transform:'translate3d(-10px,5px,0)',filter:'brightness(1.7)'},
      {offset:.08,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.2) drop-shadow(0 0 10px rgba(220,245,255,.7))'},
      {offset:.82,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.05)'},
      {offset:1,opacity:0,transform:'translate3d(4px,-2px,0)',filter:'brightness(1.4)'}
    ],{duration:ms(520),easing:'linear',fill:'forwards'});
  }
  if(name?.animate){
    name.animate([{opacity:0},{offset:.1,opacity:.78},{offset:.82,opacity:.78},{opacity:0}],{duration:ms(520),easing:'linear',fill:'forwards'});
  }

  later(()=>{
    overlay.classList.add('leaving');
    later(()=>{
      overlay.remove();
      battleDialog.classList.remove('wuji32-cutin-host');
    },ms(70));
    strike(stage,targetEls,onImpact);
    onComplete?.();
  },ms(500));
}

battleBody.addEventListener('xyt-wuji-ultimate',event=>{
  const stage=event.target?.closest?.('.battle-visual-stage')||event.target;
  const detail=event.detail||{};
  if(!stage?.classList?.contains('battle-visual-stage'))return;
  if(!Array.isArray(detail.targetEls)||typeof detail.onImpact!=='function')return;
  event.preventDefault();
  playCutin(stage,detail.skill,detail.targetEls,detail.onImpact,detail.onComplete);
});

battleBody.addEventListener('xyt-battle-stop',()=>{
  for(const id of active)clearTimeout(id);
  active.clear();
  clearCutins();
  battleBody.querySelectorAll('.battle-visual-stage').forEach(clearStage);
});
