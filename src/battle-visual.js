import { HEROES } from './data.js';
import { heroStats } from './state.js';

const battleDialog=document.querySelector('#battleDialog');
const battleDialogBody=document.querySelector('#battleDialogBody');
if(!battleDialog||!battleDialogBody) throw new Error('battle dialog missing');

const HERO_NAMES=Object.fromEntries(Object.entries(HEROES).map(([id,h])=>[id,h.name]));
const NAME_TO_ID=Object.fromEntries(Object.entries(HERO_NAMES).map(([id,name])=>[name,id]));
const CONTROL_RE=/处于【(眩晕|沉默|封穴)】|受\d+层【佛性】压制/;
let controller=null;

function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function liveState(){return globalThis.__XYT_STATE__||{};}

function collectPlayerFighters(){
  const s=liveState();
  return (s.party||[]).filter(Boolean).filter(id=>s.heroes?.[id]?.owned).map(id=>{
    let hp=100;
    try{hp=Math.max(1,Number(heroStats(s,id)?.hp||100));}catch{}
    return {id,name:HERO_NAMES[id]||id,side:'player',hpMax:hp,hpPct:100,rage:2,alive:true};
  });
}

function enemyNamesFromLog(lines,title){
  const found=[];
  for(const line of lines){
    const ms=line.match(/(?:元兵|守塔人|古墓守卫)\d+/g)||[];
    for(const name of ms)if(!found.includes(name))found.push(name);
  }
  found.sort((a,b)=>(Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0)));
  const label=title.includes('古墓')?'古墓守卫':title.includes('千宝塔')?'守塔人':'元兵';
  while(found.length<6)found.push(`${label}${found.length+1}`);
  return found.slice(0,6);
}

function parseEvents(lines){
  const events=[];let round=0;
  for(const line of lines){
    const rm=line.match(/^—— 第(\d+)回合 ——$/);if(rm){round=Number(rm[1]);events.push({type:'round',round});continue;}
    const am=line.match(/^(.+?)(?:施展【(.+?)】|(普通攻击))，造成\s*([\d,]+)\s*伤害(.*)$/);
    if(am){events.push({type:'action',round,actor:am[1],skill:am[2]||'',normal:!!am[3],damage:Number(am[4].replace(/,/g,''))||0,tail:am[5]||'',line});continue;}
    if(CONTROL_RE.test(line)||line.includes('复活')||line.includes('触发【')||line.includes('获得')&&line.includes('护盾'))events.push({type:'notice',round,line});
  }
  return events;
}

function fighterCard(f,index=0){
  const initial=(f.name||'?').slice(0,1);
  return `<div class="bv-fighter ${f.side} bv-slot-${index}" data-fighter-name="${esc(f.name)}" data-fighter-id="${esc(f.id)}"><div class="bv-bars"><div class="bv-hp"><i style="width:100%"></i></div><div class="bv-rage"><i style="width:25%"></i></div></div><div class="bv-portrait"><span>${esc(initial)}</span></div><div class="bv-name">${esc(f.name)}</div></div>`;
}

function targetCountFor(event,actor){
  if(event.normal)return 1;
  const id=NAME_TO_ID[actor];const target=HEROES[id]?.skill?.target;
  if(target==='all')return 6;if(target==='three')return 3;return 1;
}

function buildController(stage,events,players,enemies,finalBox,outcome,reward){
  const fighters=[...players,...enemies];
  const byName=new Map(fighters.map(x=>[x.name,x]));
  let timer=null,index=0,speed=1,finished=false,targetCursor={player:0,enemy:0};
  const roundEl=stage.querySelector('[data-bv-round]'),skillEl=stage.querySelector('[data-bv-skill]'),ticker=stage.querySelector('[data-bv-ticker]');

  function card(name){return stage.querySelector(`.bv-fighter[data-fighter-name="${CSS.escape(name)}"]`);}
  function sync(f){const el=card(f.name);if(!el)return;el.classList.toggle('dead',!f.alive);const hp=el.querySelector('.bv-hp i'),rage=el.querySelector('.bv-rage i');if(hp)hp.style.width=`${clamp(f.hpPct,0,100)}%`;if(rage)rage.style.width=`${clamp(f.rage/8*100,0,100)}%`;}
  function pulse(el,cls,duration=420){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),duration/Math.max(1,speed));}
  function floatText(el,text,kind='damage'){if(!el)return;const n=document.createElement('span');n.className=`bv-float ${kind}`;n.textContent=text;el.appendChild(n);setTimeout(()=>n.remove(),900/Math.max(1,speed));}
  function setTicker(text){if(ticker)ticker.textContent=text||'';}
  function chooseTargets(actor,event){
    const foes=fighters.filter(x=>x.side!==actor.side&&x.alive);if(!foes.length)return[];
    const count=Math.min(foes.length,targetCountFor(event,actor.name));
    if(count>=foes.length)return foes;
    const side=actor.side==='player'?'enemy':'player',start=targetCursor[side]%foes.length;targetCursor[side]++;
    return Array.from({length:count},(_,i)=>foes[(start+i)%foes.length]);
  }
  function addImpact(el,kind='slash',crit=false){
    if(!el)return;
    const portrait=el.querySelector('.bv-portrait')||el;
    const fx=document.createElement('span');
    fx.className=`bv-impact ${kind}${crit?' crit':''}`;
    portrait.appendChild(fx);
    setTimeout(()=>fx.remove(),520/Math.max(1,speed));
  }
  function stageShake(strong=false){
    if(!stage.animate)return;
    const d=strong?8:4;
    stage.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-d}px,1px,0)`},{transform:`translate3d(${d}px,-1px,0)`},{transform:'translate3d(0,0,0)'}],{duration:(strong?250:160)/Math.max(1,speed),easing:'ease-out'});
  }
  function dashAttack(actorEl,targetEl){
    const source=actorEl?.querySelector('.bv-portrait'),target=targetEl?.querySelector('.bv-portrait');
    if(!source||!target)return;
    const s=source.getBoundingClientRect(),t=target.getBoundingClientRect(),root=stage.getBoundingClientRect();
    const ghost=source.cloneNode(true);
    ghost.classList.add('bv-dash-ghost',actorEl.classList.contains('enemy')?'enemy-ghost':'player-ghost');
    const sourceStyle=getComputedStyle(source);
    ghost.style.background=sourceStyle.background;
    ghost.style.backgroundImage=sourceStyle.backgroundImage;
    ghost.style.backgroundPosition=sourceStyle.backgroundPosition;
    ghost.style.backgroundSize=sourceStyle.backgroundSize;
    ghost.style.backgroundRepeat=sourceStyle.backgroundRepeat;
    ghost.style.left=`${s.left-root.left}px`;
    ghost.style.top=`${s.top-root.top}px`;
    ghost.style.width=`${s.width}px`;
    ghost.style.height=`${s.height}px`;
    stage.appendChild(ghost);
    source.style.visibility='hidden';
    const dx=(t.left+t.width/2)-(s.left+s.width/2),dy=(t.top+t.height/2)-(s.top+s.height/2);
    const finish=()=>{ghost.remove();source.style.visibility='';};
    if(ghost.animate){
      const anim=ghost.animate([
        {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},
        {offset:.18,transform:`translate3d(${dx*.18}px,${dy*.18-4}px,0) scale(1.08)`,filter:'brightness(1.25)'},
        {offset:.52,transform:`translate3d(${dx*.82}px,${dy*.82}px,0) scale(1.15)`,filter:'brightness(1.45)'},
        {offset:.68,transform:`translate3d(${dx*.72}px,${dy*.72}px,0) scale(1.08)`,filter:'brightness(1.15)'},
        {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'}
      ],{duration:480/Math.max(1,speed),easing:'cubic-bezier(.2,.8,.2,1)'});
      anim.onfinish=finish;anim.oncancel=finish;
    }else{pulse(actorEl,'acting',430);finish();}
  }
  function skillCast(actorEl,targets,crit){
    if(actorEl){pulse(actorEl,'skill-cast',720);const aura=document.createElement('span');aura.className='bv-skill-aura';actorEl.appendChild(aura);setTimeout(()=>aura.remove(),760/Math.max(1,speed));}
    const wave=document.createElement('span');wave.className='bv-skill-wave';stage.appendChild(wave);setTimeout(()=>wave.remove(),700/Math.max(1,speed));
    setTimeout(()=>{for(const t of targets)addImpact(card(t.name),'burst',crit);stageShake(true);},170/Math.max(1,speed));
  }
  function applyDamage(targets,event,crit,dodged,guarded){
    let visualDrop=event.damage<=0?0:clamp(6+Math.log10(event.damage+1)*5+(event.normal?0:8)+(crit?6:0),8,55);
    const per=visualDrop/Math.max(1,Math.sqrt(targets.length));
    for(const t of targets){
      const el=card(t.name);
      pulse(el,'hit',430);
      if(event.damage>0){t.hpPct=clamp(t.hpPct-per,0,100);floatText(el,`-${fmt(Math.max(1,Math.round(event.damage/targets.length)))}`,crit?'crit':'damage');}
      else if(dodged)floatText(el,'闪避','dodge');else if(guarded)floatText(el,'格挡','dodge');
      sync(t);
    }
    if(event.tail.includes('有敌人倒下')){const victim=targets.find(x=>x.alive)||targets[0];if(victim){victim.hpPct=0;victim.alive=false;sync(victim);pulse(card(victim.name),'fall',650);}}
  }
  function applyAction(event){
    const actor=byName.get(event.actor);if(!actor)return setTicker(event.line);
    const actorEl=card(actor.name);
    actor.rage=event.normal?Math.min(8,actor.rage+2):Math.max(0,actor.rage-4);sync(actor);
    const targets=chooseTargets(actor,event);
    if(event.skill&&skillEl){skillEl.textContent=`${actor.name} · ${event.skill}`;skillEl.classList.add('show');setTimeout(()=>skillEl.classList.remove('show'),720/Math.max(1,speed));}
    if(!targets.length){setTicker(event.line);return;}
    const crit=event.tail.includes('暴击'),dodged=event.tail.includes('闪避'),guarded=event.tail.includes('护盾挡下');
    if(event.normal){
      const targetEl=card(targets[0].name);
      dashAttack(actorEl,targetEl);
      setTimeout(()=>{addImpact(targetEl,'slash',crit);stageShake(crit);applyDamage(targets,event,crit,dodged,guarded);},190/Math.max(1,speed));
    }else{
      skillCast(actorEl,targets,crit);
      setTimeout(()=>applyDamage(targets,event,crit,dodged,guarded),180/Math.max(1,speed));
    }
    setTicker(event.line.replace(/。+$/,''));
  }
  function applyNotice(event){
    setTicker(event.line);
    const actor=[...byName.keys()].find(name=>event.line.startsWith(name));if(actor){const el=card(actor);if(event.line.includes('复活')){const f=byName.get(actor);f.alive=true;f.hpPct=Math.max(30,f.hpPct);sync(f);pulse(el,'revive',650);floatText(el,'复活','heal');}else if(CONTROL_RE.test(event.line))pulse(el,'controlled',620);}
  }
  function applyEvent(event){if(event.type==='round'){if(roundEl)roundEl.textContent=`第 ${event.round} 回合`;setTicker(`第${event.round}回合`);return;}if(event.type==='action')return applyAction(event);if(event.type==='notice')return applyNotice(event);}
  function delayFor(event){if(event.type==='round')return 330/speed;if(event.type==='action')return (event.normal?650:850)/speed;return 420/speed;}
  function schedule(){if(finished)return;if(index>=events.length)return finish();const event=events[index++];applyEvent(event);timer=setTimeout(schedule,delayFor(event));}
  function finish(){if(finished)return;finished=true;if(timer)clearTimeout(timer);const win=outcome.classList.contains('battle-win');const losing=win?enemies:players;for(const f of losing){f.alive=false;f.hpPct=0;sync(f);}if(roundEl)roundEl.textContent=win?'战斗胜利':'战斗失败';setTicker(win?'胜利！奖励已经结算。':'战败，可调整阵容与养成后再试。');finalBox.hidden=false;finalBox.classList.add('show');stage.querySelector('[data-bv-skip]')?.setAttribute('disabled','');}
  function skip(){index=events.length;finish();}
  function toggleSpeed(){speed=speed===1?2:1;const btn=stage.querySelector('[data-bv-speed]');if(btn)btn.textContent=`${speed}×`;}
  function stop(){if(timer)clearTimeout(timer);finished=true;for(const ghost of stage.querySelectorAll('.bv-dash-ghost,.bv-impact,.bv-skill-wave,.bv-skill-aura'))ghost.remove();}
  return {start(){setTimeout(schedule,180);},skip,toggleSpeed,stop};
}

function enhanceBattleDialog(){
  const log=battleDialogBody.querySelector('.battle-log');if(!log||battleDialogBody.dataset.visualized==='1')return null;
  battleDialogBody.dataset.visualized='1';
  const title=battleDialogBody.querySelector('.modal-head h3')?.textContent||'战斗';
  const outcome=battleDialogBody.querySelector('.battle-win,.battle-loss');if(!outcome)return null;
  const reward=[...battleDialogBody.querySelectorAll('.notice')].find(x=>x.closest('.modal-inner'))||null;
  const lines=[...log.children].map(x=>x.textContent.trim()).filter(Boolean);
  const events=parseEvents(lines),players=collectPlayerFighters();
  const enemyNames=enemyNamesFromLog(lines,title),enemies=enemyNames.map((name,i)=>({id:`enemy-${i}`,name,side:'enemy',hpMax:100,hpPct:100,rage:2,alive:true}));
  const stage=document.createElement('section');stage.className='battle-visual-stage battle-v240';stage.innerHTML=`<div class="bv-stage-top"><span data-bv-round>准备战斗</span><div class="bv-controls"><button class="btn btn-small" type="button" data-bv-speed>1×</button><button class="btn btn-small" type="button" data-bv-skip>跳过</button></div></div><div class="bv-skill-banner" data-bv-skill></div><div class="bv-field"><div class="bv-team player-team">${players.map((f,i)=>fighterCard(f,i)).join('')}</div><div class="bv-center-mark"><b>VS</b></div><div class="bv-team enemy-team">${enemies.map((f,i)=>fighterCard(f,i)).join('')}</div></div><div class="bv-ticker" data-bv-ticker>双方侠客入场……</div>`;
  const finalBox=document.createElement('div');finalBox.className='bv-final';finalBox.hidden=true;outcome.remove();finalBox.appendChild(outcome);if(reward){reward.remove();finalBox.appendChild(reward);}log.parentNode.insertBefore(stage,log);log.parentNode.insertBefore(finalBox,log);
  const details=document.createElement('details');details.className='bv-log-details';details.innerHTML='<summary>查看文字战报</summary>';log.remove();details.appendChild(log);finalBox.after(details);
  controller=buildController(stage,events,players,enemies,finalBox,outcome,reward);
  stage.addEventListener('click',e=>{if(e.target.closest('[data-bv-speed]'))controller?.toggleSpeed();if(e.target.closest('[data-bv-skip]'))controller?.skip();});
  return controller;
}

const nativeShow=battleDialog.showModal.bind(battleDialog);
battleDialog.showModal=function(){controller?.stop();controller=null;battleDialogBody.dataset.visualized='0';const c=enhanceBattleDialog();nativeShow();requestAnimationFrame(()=>c?.start());};
battleDialog.addEventListener('close',()=>{controller?.stop();controller=null;});
