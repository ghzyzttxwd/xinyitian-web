// V0.24.34: Wuji ultimate stays at home position and casts two remote palm strikes.
// No dash-to-target: the fighter only jumps/gestures in place; palm seals and impact FX appear on authoritative targets.
// First palm is visual-only, second palm triggers the single backend damage settlement.
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
  for(const el of stage.querySelectorAll('.wuji34-palm,.wuji34-impact,.wuji34-caster-ghost'))el.remove();
  stage.classList.remove('wuji34-striking');
  const wuji=stage.querySelector('.bv-fighter[data-fighter-id="wuji"]');
  if(wuji){
    const p=wuji.querySelector('.bv-portrait');
    if(p)p.style.visibility='';
    wuji.classList.remove('bv-moving');
  }
}
function clearCutins(){
  for(const el of document.querySelectorAll('.wuji34-cutin,.wuji33-cutin,.wuji32-cutin'))el.remove();
  battleDialog.classList.remove('wuji34-cutin-host','wuji33-cutin-host','wuji32-cutin-host');
}
function titleRows(skill){
  const chars=[...String(skill||'绝技').replace(/\s+/g,'').slice(0,6)];
  if(chars.length<=2)return [chars.join('')];
  const split=chars.length<=4?2:Math.ceil(chars.length/2);
  return [chars.slice(0,split).join(''),chars.slice(split).join('')].filter(Boolean);
}
function copyPortraitStyle(source,ghost){
  const style=getComputedStyle(source);
  ghost.style.background=style.background;
  ghost.style.backgroundImage=style.backgroundImage;
  ghost.style.backgroundPosition=style.backgroundPosition;
  ghost.style.backgroundSize=style.backgroundSize;
  ghost.style.backgroundRepeat=style.backgroundRepeat;
}
function palmSvg(){
  return '<svg viewBox="0 0 120 150" aria-hidden="true"><g class="wuji34-palm-shape"><ellipse cx="61" cy="96" rx="34" ry="39"/><rect x="19" y="46" width="18" height="58" rx="9" transform="rotate(-20 28 75)"/><rect x="39" y="21" width="18" height="69" rx="9" transform="rotate(-8 48 55)"/><rect x="59" y="12" width="18" height="74" rx="9"/><rect x="79" y="24" width="18" height="66" rx="9" transform="rotate(7 88 57)"/><rect x="95" y="48" width="17" height="53" rx="9" transform="rotate(20 103 74)"/></g></svg>';
}
function spawnImpact(stage,targetEl,strong=false){
  if(!targetEl?.isConnected)return;
  const target=targetEl.querySelector('.bv-portrait')||targetEl;
  const tr=target.getBoundingClientRect(),root=stage.getBoundingClientRect(),p=center(tr,root);
  const fx=document.createElement('i');
  fx.className=`wuji34-impact${strong?' strong':''}`;
  fx.style.left=`${p.x}px`;fx.style.top=`${p.y}px`;
  stage.appendChild(fx);
  later(()=>fx.remove(),scaled(stage,strong?520:360));
  if(targetEl.animate){
    targetEl.animate(
      strong
        ? [{transform:'translate3d(0,0,0)'},{transform:'translate3d(8px,-2px,0)'},{transform:'translate3d(-6px,2px,0)'},{transform:'translate3d(0,0,0)'}]
        : [{transform:'translate3d(0,0,0)'},{transform:'translate3d(4px,-1px,0)'},{transform:'translate3d(0,0,0)'}],
      {duration:scaled(stage,strong?220:150),easing:'ease-out'}
    );
  }
}
function spawnPalm(stage,targetEls,hitNo=1,strong=false){
  const valid=targetEls.filter(el=>el?.isConnected);
  if(!valid.length)return;
  const root=stage.getBoundingClientRect();
  valid.forEach((el,index)=>{
    const target=el.querySelector('.bv-portrait')||el;
    const p=center(target.getBoundingClientRect(),root);
    const palm=document.createElement('div');
    palm.className=`wuji34-palm hit-${hitNo}${strong?' strong':''}`;
    palm.innerHTML=palmSvg();
    palm.style.left=`${p.x}px`;
    palm.style.top=`${p.y}px`;
    palm.style.setProperty('--palm-rot',`${hitNo===1?-18+index*5:14-index*5}deg`);
    palm.style.setProperty('--palm-delay',`${scaled(stage,index*22)}ms`);
    palm.style.setProperty('--palm-dur',`${scaled(stage,strong?520:430)}ms`);
    stage.appendChild(palm);
    later(()=>palm.remove(),scaled(stage,(strong?560:470)+index*22));
    spawnImpact(stage,el,strong);
  });
  if(stage.animate){
    const d=strong?7:3;
    stage.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-d}px,1px,0)`},{transform:`translate3d(${d}px,-1px,0)`},{transform:'translate3d(0,0,0)'}],{duration:scaled(stage,strong?230:150),easing:'ease-out'});
  }
}

function homeCast(stage,targetEls,onImpact){
  const actorEl=stage.querySelector('.bv-fighter[data-fighter-id="wuji"]');
  const source=actorEl?.querySelector('.bv-portrait');
  if(!actorEl||!source){onImpact?.();return;}
  clearStage(stage);
  const s=source.getBoundingClientRect(),root=stage.getBoundingClientRect();
  const ghost=source.cloneNode(true);
  ghost.classList.add('bv-dash-ghost','player-ghost','actor-wuji','wuji34-caster-ghost');
  copyPortraitStyle(source,ghost);
  ghost.style.left=`${s.left-root.left}px`;ghost.style.top=`${s.top-root.top}px`;
  ghost.style.width=`${s.width}px`;ghost.style.height=`${s.height}px`;
  ghost.dataset.wujiPhase='arrived';
  stage.appendChild(ghost);
  source.style.visibility='hidden';actorEl.classList.add('bv-moving');stage.classList.add('wuji34-striking');

  let strikeCount=0,contactCount=0,settled=false,cleaned=false;
  let fallbackContact=null,fallbackEnd=null;
  const clearFallback=()=>{if(fallbackContact)clearTimeout(fallbackContact);if(fallbackEnd)clearTimeout(fallbackEnd);fallbackContact=fallbackEnd=null;};
  const settle=()=>{if(settled)return;settled=true;onImpact?.();};
  const cleanup=()=>{
    if(cleaned)return;cleaned=true;clearFallback();
    ghost.remove();source.style.visibility='';actorEl.classList.remove('bv-moving');stage.classList.remove('wuji34-striking');
  };
  const onContact=()=>{
    if(contactCount>=strikeCount)return;
    if(fallbackContact)clearTimeout(fallbackContact);fallbackContact=null;
    contactCount=strikeCount;
    if(contactCount===1){spawnPalm(stage,targetEls,1,false);return;}
    spawnPalm(stage,targetEls,2,true);settle();
  };
  const armFallback=()=>{
    clearFallback();
    // Keep fallbacks behind the real att1 contact/end frames even at 5x, where frame playback has a 22ms floor.
    fallbackContact=setTimeout(onContact,scaled(stage,360));
    fallbackEnd=setTimeout(onStrikeEnd,scaled(stage,620));
  };
  const beginStrike=()=>{
    if(cleaned)return;
    strikeCount+=1;
    ghost.dataset.wujiPhase='arrived';
    if(ghost.animate){
      ghost.animate(
        strikeCount===1
          ? [{transform:'translate3d(0,0,0)'},{offset:.34,transform:'translate3d(0,-18px,0)'},{offset:.58,transform:'translate3d(0,-13px,0)'},{transform:'translate3d(0,0,0)'}]
          : [{transform:'translate3d(0,0,0)'},{offset:.3,transform:'translate3d(3px,-12px,0)'},{offset:.55,transform:'translate3d(-2px,-8px,0)'},{transform:'translate3d(0,0,0)'}],
        {duration:scaled(stage,strikeCount===1?310:270),easing:'cubic-bezier(.2,.8,.2,1)'}
      );
    }
    later(()=>{
      if(!ghost.isConnected||cleaned)return;
      ghost.dataset.wujiPhase='strike';
      armFallback();
    },scaled(stage,55));
  };
  function onStrikeEnd(){
    if(fallbackEnd)clearTimeout(fallbackEnd);fallbackEnd=null;
    ghost.dataset.wujiPhase='arrived';
    if(strikeCount<2){later(beginStrike,scaled(stage,85));return;}
    if(!settled)settle();
    later(()=>{ghost.dataset.wujiPhase='return';cleanup();},scaled(stage,90));
  }

  ghost.addEventListener('xyt-wuji-strike-contact',onContact);
  ghost.addEventListener('xyt-wuji-strike-end',onStrikeEnd);
  later(beginStrike,scaled(stage,90));
}

function playCutin(stage,skill,targetEls,onImpact){
  clearCutins();
  battleDialog.classList.add('wuji34-cutin-host');
  const overlay=document.createElement('div');
  overlay.className='wuji34-cutin wuji32-cutin';
  overlay.innerHTML='<div class="wuji32-backdrop"></div><div class="wuji32-moon"></div><div class="wuji32-energy e1"></div><div class="wuji32-energy e2"></div><div class="wuji32-sparks"></div><div class="wuji32-figure" aria-hidden="true"></div><div class="wuji32-skill-title" aria-label="技能名"></div><div class="wuji32-name">张无忌</div>';
  const title=overlay.querySelector('.wuji32-skill-title');
  for(const rowText of titleRows(skill)){
    const row=document.createElement('span');row.textContent=rowText;title.appendChild(row);
  }
  battleDialog.appendChild(overlay);

  const ms=n=>n/speedRate(stage),figure=overlay.querySelector('.wuji32-figure'),name=overlay.querySelector('.wuji32-name');
  overlay.style.setProperty('--wuji34-cutin-ms',`${ms(700)}ms`);
  if(figure?.animate){
    figure.animate([
      {offset:0,opacity:0,transform:'translate3d(10px,6px,0)',filter:'brightness(.8)'},
      {offset:.05,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.1) drop-shadow(0 0 18px rgba(170,224,255,.48))'},
      {offset:.9,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.04) drop-shadow(0 0 14px rgba(170,224,255,.4))'},
      {offset:1,opacity:0,transform:'translate3d(-4px,-2px,0)',filter:'brightness(1.2)'}
    ],{duration:ms(700),easing:'linear',fill:'forwards'});
  }
  if(title?.animate){
    title.animate([
      {offset:0,opacity:0,transform:'translate3d(-8px,4px,0)',filter:'brightness(1.5)'},
      {offset:.055,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.16) drop-shadow(0 0 9px rgba(220,245,255,.62))'},
      {offset:.9,opacity:1,transform:'translate3d(0,0,0)',filter:'brightness(1.03)'},
      {offset:1,opacity:0,transform:'translate3d(3px,-1px,0)',filter:'brightness(1.3)'}
    ],{duration:ms(700),easing:'linear',fill:'forwards'});
  }
  if(name?.animate)name.animate([{opacity:0},{offset:.06,opacity:.78},{offset:.9,opacity:.78},{opacity:0}],{duration:ms(700),easing:'linear',fill:'forwards'});

  later(()=>{
    overlay.classList.add('leaving');
    later(()=>{overlay.remove();battleDialog.classList.remove('wuji34-cutin-host');},ms(70));
    homeCast(stage,targetEls,onImpact);
  },ms(700));
}

battleBody.addEventListener('xyt-wuji-ultimate',event=>{
  const stage=event.target?.closest?.('.battle-visual-stage')||event.target;
  const detail=event.detail||{};
  if(!stage?.classList?.contains('battle-visual-stage'))return;
  if(!Array.isArray(detail.targetEls)||typeof detail.onImpact!=='function')return;
  event.preventDefault();
  playCutin(stage,detail.skill,detail.targetEls,detail.onImpact);
});

battleBody.addEventListener('xyt-battle-stop',()=>{
  for(const id of active)clearTimeout(id);active.clear();clearCutins();
  battleBody.querySelectorAll('.battle-visual-stage').forEach(clearStage);
});
