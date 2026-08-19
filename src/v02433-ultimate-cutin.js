// V0.24.33: slower readable Wuji cut-in + two-hit in-battle follow-through.
// The cut-in still appears at final size immediately (no slow zoom on low-res art).
// Damage remains authoritative: first contact is visual only, second contact calls the single backend settlement.
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
function copyPortraitStyle(source,ghost){
  const style=getComputedStyle(source);
  ghost.style.background=style.background;
  ghost.style.backgroundImage=style.backgroundImage;
  ghost.style.backgroundPosition=style.backgroundPosition;
  ghost.style.backgroundSize=style.backgroundSize;
  ghost.style.backgroundRepeat=style.backgroundRepeat;
}
function clearStage(stage){
  for(const el of stage.querySelectorAll('.wuji33-hit-fx,.wuji32-strike-fx,.wuji31-strike-fx,.wuji30-strike-fx,.wuji33-ultimate-ghost'))el.remove();
  stage.classList.remove('wuji33-striking','wuji32-striking','wuji31-striking','wuji30-striking');
  const wuji=stage.querySelector('.bv-fighter[data-fighter-id="wuji"]');
  if(wuji){
    const p=wuji.querySelector('.bv-portrait');
    if(p)p.style.visibility='';
    wuji.classList.remove('bv-moving');
  }
}
function clearCutins(){
  for(const el of document.querySelectorAll('.wuji33-cutin,.wuji32-cutin,.wuji31-cutin,.wuji30-cutin'))el.remove();
  battleDialog.classList.remove('wuji33-cutin-host','wuji32-cutin-host','wuji31-cutin-host');
}
function titleRows(skill){
  const chars=[...String(skill||'绝技').replace(/\s+/g,'').slice(0,6)];
  if(chars.length<=2)return [chars.join('')];
  const split=chars.length<=4?2:Math.ceil(chars.length/2);
  return [chars.slice(0,split).join(''),chars.slice(split).join('')].filter(Boolean);
}
function impactFx(stage,targetEl,strong=false){
  if(!targetEl?.isConnected)return;
  const target=targetEl.querySelector('.bv-portrait')||targetEl;
  const tr=target.getBoundingClientRect(),root=stage.getBoundingClientRect();
  const p=center(tr,root);
  const fx=document.createElement('i');
  fx.className=`wuji33-hit-fx${strong?' strong':''}`;
  fx.style.left=`${p.x}px`;fx.style.top=`${p.y}px`;
  stage.appendChild(fx);
  later(()=>fx.remove(),scaled(stage,strong?420:300));
  if(targetEl.animate){
    targetEl.animate(
      strong
        ? [{transform:'translate3d(0,0,0)'},{transform:'translate3d(8px,-2px,0)'},{transform:'translate3d(-5px,1px,0)'},{transform:'translate3d(0,0,0)'}]
        : [{transform:'translate3d(0,0,0)'},{transform:'translate3d(4px,-1px,0)'},{transform:'translate3d(0,0,0)'}],
      {duration:scaled(stage,strong?180:120),easing:'ease-out'}
    );
  }
}
function allTargetImpact(stage,targetEls,strong=false){
  for(const el of targetEls)impactFx(stage,el,strong);
  if(stage.animate){
    const d=strong?7:3;
    stage.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-d}px,1px,0)`},{transform:`translate3d(${d}px,-1px,0)`},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,strong?200:120),easing:'ease-out'});
  }
}

function twoHitStrike(stage,targetEls,onImpact){
  const actorEl=stage.querySelector('.bv-fighter[data-fighter-id="wuji"]');
  const source=actorEl?.querySelector('.bv-portrait');
  const primary=targetEls.find(el=>el?.isConnected);
  const target=primary?.querySelector('.bv-portrait')||primary;
  if(!actorEl||!source||!target){onImpact?.();return;}

  const s=source.getBoundingClientRect(),t=target.getBoundingClientRect(),root=stage.getBoundingClientRect();
  const ghost=source.cloneNode(true);
  ghost.classList.add('bv-dash-ghost','player-ghost','actor-wuji','wuji33-ultimate-ghost');
  copyPortraitStyle(source,ghost);
  ghost.style.left=`${s.left-root.left}px`;ghost.style.top=`${s.top-root.top}px`;
  ghost.style.width=`${s.width}px`;ghost.style.height=`${s.height}px`;
  ghost.dataset.wujiPhase='travel';
  stage.appendChild(ghost);
  source.style.visibility='hidden';actorEl.classList.add('bv-moving');stage.classList.add('wuji33-striking');

  const dx=(t.left+t.width/2)-(s.left+s.width/2),dy=(t.top+t.height/2)-(s.top+s.height/2);
  const x=dx*.84,y=dy*.84;
  const near=`translate3d(${x}px,${y}px,0)`;
  let hitCount=0,endCount=0,settled=false,cleaned=false;
  let fallbackContact=null,fallbackEnd=null;
  const clearFallback=()=>{if(fallbackContact)clearTimeout(fallbackContact);if(fallbackEnd)clearTimeout(fallbackEnd);fallbackContact=fallbackEnd=null;};
  const settle=()=>{if(settled)return;settled=true;onImpact?.();};
  const cleanup=()=>{
    if(cleaned)return;cleaned=true;clearFallback();
    ghost.remove();source.style.visibility='';actorEl.classList.remove('bv-moving');stage.classList.remove('wuji33-striking');
  };
  const returnHome=()=>{
    if(cleaned)return;
    clearFallback();ghost.dataset.wujiPhase='return';ghost.style.transform=near;
    if(ghost.animate){
      const a=ghost.animate([{transform:near},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,90),easing:'cubic-bezier(.35,.1,.4,1)'});
      a.onfinish=cleanup;a.oncancel=cleanup;
    }else cleanup();
  };
  const onContact=()=>{
    clearTimeout(fallbackContact);fallbackContact=null;
    hitCount+=1;
    if(hitCount===1){
      allTargetImpact(stage,[primary],false);
    }else{
      allTargetImpact(stage,targetEls,true);
      settle();
    }
  };
  const armFallback=()=>{
    clearFallback();
    fallbackContact=setTimeout(onContact,scaled(stage,250));
    fallbackEnd=setTimeout(onStrikeEnd,scaled(stage,385));
  };
  const startStrike=()=>{
    if(cleaned)return;
    ghost.dataset.wujiPhase='arrived';
    requestAnimationFrame(()=>{
      if(!ghost.isConnected||cleaned)return;
      ghost.dataset.wujiPhase='strike';
      armFallback();
    });
  };
  function onStrikeEnd(){
    clearTimeout(fallbackEnd);fallbackEnd=null;
    endCount+=1;
    if(endCount===1){
      ghost.dataset.wujiPhase='arrived';
      const recoil=`translate3d(${x-7}px,${y-10}px,0)`;
      if(ghost.animate){
        const a=ghost.animate([{transform:near},{transform:recoil},{transform:near}],{duration:scaled(stage,50),easing:'ease-out'});
        a.onfinish=()=>later(startStrike,scaled(stage,10));
        a.oncancel=startStrike;
      }else later(startStrike,scaled(stage,10));
      return;
    }
    if(!settled)settle();
    returnHome();
  }

  ghost.addEventListener('xyt-wuji-strike-contact',onContact);
  ghost.addEventListener('xyt-wuji-strike-end',onStrikeEnd);

  if(ghost.animate){
    const arc=`translate3d(${x*.55}px,${y*.55-15}px,0)`;
    const travel=ghost.animate([{transform:'translate3d(0,0,0)'},{offset:.56,transform:arc},{transform:near}],{duration:scaled(stage,60),easing:'cubic-bezier(.2,.75,.25,1)'});
    travel.onfinish=()=>{ghost.style.transform=near;startStrike();};
    travel.oncancel=startStrike;
  }else startStrike();
}

function playCutin(stage,skill,targetEls,onImpact,onComplete){
  clearCutins();
  battleDialog.classList.add('wuji33-cutin-host');

  const overlay=document.createElement('div');
  overlay.className='wuji33-cutin wuji32-cutin';
  overlay.innerHTML='<div class="wuji32-backdrop"></div><div class="wuji32-moon"></div><div class="wuji32-energy e1"></div><div class="wuji32-energy e2"></div><div class="wuji32-sparks"></div><div class="wuji32-figure" aria-hidden="true"></div><div class="wuji32-skill-title" aria-label="技能名"></div><div class="wuji32-name">张无忌</div>';
  const title=overlay.querySelector('.wuji32-skill-title');
  for(const rowText of titleRows(skill)){
    const row=document.createElement('span');row.textContent=rowText;title.appendChild(row);
  }
  battleDialog.appendChild(overlay);

  const rate=speedRate(stage),ms=n=>n/rate;
  overlay.style.setProperty('--wuji33-cutin-ms',`${ms(625)}ms`);
  const figure=overlay.querySelector('.wuji32-figure');
  const name=overlay.querySelector('.wuji32-name');

  // Fast reveal at final size, then a longer hold so the player can actually read the skill card.
  if(figure?.animate){
    figure.animate([
      {offset:0,opacity:0,transform:'translate3d(10px,6px,0)',filter:'brightness(.8)'},
      {offset:.055,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.1) drop-shadow(0 0 18px rgba(170,224,255,.48))'},
      {offset:.88,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.04) drop-shadow(0 0 14px rgba(170,224,255,.4))'},
      {offset:1,opacity:0,transform:'translate3d(-4px,-2px,0)',filter:'brightness(1.2)'}
    ],{duration:ms(625),easing:'linear',fill:'forwards'});
  }
  if(title?.animate){
    title.animate([
      {offset:0,opacity:0,transform:'translate3d(-8px,4px,0)',filter:'brightness(1.5)'},
      {offset:.06,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.16) drop-shadow(0 0 9px rgba(220,245,255,.62))'},
      {offset:.9,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.03)'},
      {offset:1,opacity:0,transform:'translate3d(3px,-1px,0)',filter:'brightness(1.3)'}
    ],{duration:ms(625),easing:'linear',fill:'forwards'});
  }
  if(name?.animate)name.animate([{opacity:0},{offset:.07,opacity:.78},{offset:.9,opacity:.78},{opacity:0}],{duration:ms(625),easing:'linear',fill:'forwards'});

  later(()=>{
    overlay.classList.add('leaving');
    later(()=>{overlay.remove();battleDialog.classList.remove('wuji33-cutin-host');},ms(65));
    twoHitStrike(stage,targetEls,onImpact);
    onComplete?.();
  },ms(625));
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
  for(const id of active)clearTimeout(id);active.clear();clearCutins();
  battleBody.querySelectorAll('.battle-visual-stage').forEach(clearStage);
});
