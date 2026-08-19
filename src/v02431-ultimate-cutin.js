// V0.24.31: Zhang Wuji ultimate cut-in top-layer fix + dominant vertical skill title.
// The cut-in is mounted inside the battle overlay itself so it shares the overlay stacking context and cannot be hidden behind it.
// Visuals never choose targets; v02430-battle-visual still passes authoritative target elements.
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
  for(const el of stage.querySelectorAll('.wuji31-strike-fx,.wuji30-strike-fx'))el.remove();
  stage.classList.remove('wuji31-striking','wuji30-striking');
}
function clearCutins(){
  for(const el of document.querySelectorAll('.wuji31-cutin,.wuji30-cutin'))el.remove();
  battleDialog.classList.remove('wuji31-cutin-host');
}
function skillChars(skill){
  const text=String(skill||'绝技').replace(/\s+/g,'').slice(0,6);
  return [...text];
}

function strike(stage,targetEls,onImpact){
  const valid=targetEls.filter(el=>el?.isConnected);
  if(!valid.length){onImpact?.();return;}
  clearStage(stage);
  stage.classList.add('wuji31-striking');
  const root=stage.getBoundingClientRect();
  const start={x:root.width*.34,y:root.height*.48};
  const centers=valid.map(el=>center((el.querySelector('.bv-portrait')||el).getBoundingClientRect(),root));
  const impactOnce=(()=>{let done=false;return()=>{if(done)return;done=true;onImpact?.();};})();

  for(const [i,p] of centers.entries()){
    const dx=p.x-start.x,dy=p.y-start.y;
    const beam=document.createElement('i');
    beam.className='wuji31-strike-fx wuji31-beam';
    beam.style.left=`${start.x}px`;beam.style.top=`${start.y}px`;
    beam.style.setProperty('--dx',`${dx}px`);beam.style.setProperty('--dy',`${dy}px`);
    beam.style.setProperty('--delay',`${scaled(stage,i*24)}ms`);
    beam.style.setProperty('--dur',`${scaled(stage,300)}ms`);
    stage.appendChild(beam);

    const burst=document.createElement('i');
    burst.className='wuji31-strike-fx wuji31-burst';
    burst.style.left=`${p.x}px`;burst.style.top=`${p.y}px`;
    burst.style.animationDelay=`${scaled(stage,170+i*24)}ms`;
    burst.style.animationDuration=`${scaled(stage,360)}ms`;
    stage.appendChild(burst);
  }

  const impactAt=215+Math.max(0,valid.length-1)*24;
  later(()=>{
    impactOnce();
    if(stage.animate){
      stage.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(-5px,1px,0)'},{transform:'translate3d(6px,-1px,0)'},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,220),easing:'ease-out'});
    }
  },scaled(stage,impactAt));
  later(()=>clearStage(stage),scaled(stage,620+Math.max(0,valid.length-1)*24));
}

function playCutin(stage,skill,targetEls,onImpact,onComplete){
  clearCutins();
  battleDialog.classList.add('wuji31-cutin-host');

  const overlay=document.createElement('div');
  overlay.className='wuji31-cutin';
  overlay.innerHTML='<div class="wuji31-backdrop"></div><div class="wuji31-lines"></div><div class="wuji31-figure" aria-hidden="true"></div><div class="wuji31-name">张无忌</div><div class="wuji31-skill-vertical" aria-label="技能名"></div>';
  const vertical=overlay.querySelector('.wuji31-skill-vertical');
  const chars=skillChars(skill);
  vertical.dataset.count=String(chars.length);
  for(const ch of chars){
    const span=document.createElement('span');
    span.textContent=ch;
    vertical.appendChild(span);
  }

  // Critical V0.24.31 fix: the battle shell is its own high-priority overlay/stacking context.
  // Mount the cut-in inside that overlay instead of on document.body so the battle layer cannot cover it.
  battleDialog.appendChild(overlay);

  const rate=speedRate(stage),figure=overlay.querySelector('.wuji31-figure');
  const name=overlay.querySelector('.wuji31-name');
  const ms=n=>n/rate;

  if(figure?.animate){
    figure.animate([
      {opacity:0,transform:'translate3d(-7%,7%,0) scale(.42)',filter:'brightness(.62)'},
      {offset:.22,opacity:1,transform:'translate3d(-1%,1%,0) scale(1.04)',filter:'brightness(1.3) drop-shadow(0 0 30px rgba(183,224,255,.82))'},
      {offset:.72,opacity:1,transform:'translate3d(1%,-1%,0) scale(1.12)',filter:'brightness(1.1) drop-shadow(0 0 24px rgba(183,224,255,.62))'},
      {opacity:0,transform:'translate3d(7%,-3%,0) scale(1.25)',filter:'brightness(1.55) blur(.7px)'}
    ],{duration:ms(760),easing:'cubic-bezier(.14,.8,.18,1)',fill:'forwards'});
  }
  if(vertical?.animate){
    vertical.animate([
      {opacity:0,transform:'translate(-50%,-50%) scale(.55)',filter:'blur(3px) brightness(1.8)'},
      {offset:.22,opacity:1,transform:'translate(-50%,-50%) scale(1.08)',filter:'blur(0) brightness(1.28) drop-shadow(0 0 18px rgba(205,239,255,.92))'},
      {offset:.72,opacity:1,transform:'translate(-50%,-50%) scale(1)',filter:'brightness(1.05) drop-shadow(0 0 12px rgba(205,239,255,.72))'},
      {opacity:0,transform:'translate(-50%,-50%) scale(1.18)',filter:'blur(1px) brightness(1.7)'}
    ],{duration:ms(760),easing:'cubic-bezier(.16,.78,.2,1)',fill:'forwards'});
  }
  if(name?.animate){
    name.animate([{opacity:0},{offset:.25,opacity:.9},{offset:.75,opacity:.9},{opacity:0}],{duration:ms(720),easing:'ease-out',fill:'forwards'});
  }

  later(()=>{
    overlay.classList.add('leaving');
    later(()=>{
      overlay.remove();
      battleDialog.classList.remove('wuji31-cutin-host');
    },ms(110));
    strike(stage,targetEls,onImpact);
    onComplete?.();
  },ms(720));
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
