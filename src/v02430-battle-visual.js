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

function enemyNamesFromNodes(nodes,title){
  const found=[];
  for(const node of nodes){
    const text=(node.textContent||'').trim();
    const ms=text.match(/(?:元兵|守塔人|古墓守卫)\d+/g)||[];
    for(const name of ms)if(!found.includes(name))found.push(name);
  }
  found.sort((a,b)=>(Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0)));
  const label=title.includes('古墓')?'古墓守卫':title.includes('千宝塔')?'守塔人':'元兵';
  while(found.length<6)found.push(`${label}${found.length+1}`);
  return found.slice(0,6);
}

function structuredMeta(node){
  const html=node?.innerHTML||'';
  const match=html.match(/<!--XYT:([\s\S]*?)-->/);
  if(!match)return null;
  try{
    const value=JSON.parse(decodeURIComponent(match[1]));
    return value?.v===1&&value?.type==='action'?value:null;
  }catch{return null;}
}

function parseEvents(nodes){
  const events=[];let round=0;
  for(const node of nodes){
    const line=(node.textContent||'').trim();
    const rm=line.match(/^—— 第(\d+)回合 ——$/);if(rm){round=Number(rm[1]);events.push({type:'round',round});continue;}
    const meta=structuredMeta(node);
    if(meta){events.push({...meta,type:'action',round:Number(meta.round||round),line,structured:true});continue;}
    const am=line.match(/^(.+?)(?:施展【(.+?)】|(普通攻击))，造成\s*([\d,]+)\s*伤害(.*)$/);
    if(am){events.push({type:'action',round,actor:am[1],skill:am[2]||'',normal:!!am[3],damage:Number(am[4].replace(/,/g,''))||0,tail:am[5]||'',line,structured:false});continue;}
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

function buildController(stage,events,players,enemies,finalBox,outcome){
  const fighters=[...players,...enemies];
  const byName=new Map(fighters.map(x=>[x.name,x]));
  let timer=null,index=0,speed=1,finished=false,targetCursor={player:0,enemy:0};
  stage.dataset.bvSpeedLevel='1';
  const roundEl=stage.querySelector('[data-bv-round]'),skillEl=stage.querySelector('[data-bv-skill]'),ticker=stage.querySelector('[data-bv-ticker]');

  function rate(){return Math.max(.5,speed/2);}
  function scaled(ms){return ms/rate();}
  function card(name){try{return stage.querySelector(`.bv-fighter[data-fighter-name="${CSS.escape(name)}"]`);}catch{return null;}}
  function sync(f){
    const el=card(f.name);if(!el)return;
    el.classList.toggle('dead',!f.alive);
    const hp=el.querySelector('.bv-hp i'),rage=el.querySelector('.bv-rage i');
    if(hp)hp.style.width=`${clamp(f.hpPct,0,100)}%`;
    if(rage)rage.style.width=`${clamp(f.rage/8*100,0,100)}%`;
  }
  function pulse(el,cls,duration=420){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),scaled(duration));}
  function floatText(el,text,kind='damage'){if(!el)return;const n=document.createElement('span');n.className=`bv-float ${kind}`;n.textContent=text;el.appendChild(n);setTimeout(()=>n.remove(),scaled(900));}
  function setTicker(text){if(ticker)ticker.textContent=text||'';}
  function chooseTargets(actor,event){
    if(Array.isArray(event.targets)&&event.targets.length){return event.targets.map(name=>byName.get(name)).filter(Boolean);}
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
    setTimeout(()=>fx.remove(),scaled(520));
  }
  function stageShake(strong=false){
    if(!stage.animate)return;
    const d=strong?8:4;
    stage.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-d}px,1px,0)`},{transform:`translate3d(${d}px,-1px,0)`},{transform:'translate3d(0,0,0)'}],{duration:scaled(strong?250:160),easing:'ease-out'});
  }
  function dashAttack(actorEl,targetEl,mode='normal'){
    const source=actorEl?.querySelector('.bv-portrait'),target=targetEl?.querySelector('.bv-portrait');
    if(!source||!target)return;
    const s=source.getBoundingClientRect(),t=target.getBoundingClientRect(),root=stage.getBoundingClientRect();
    const ghost=source.cloneNode(true);
    const actorId=actorEl?.dataset?.fighterId||'';
    ghost.classList.add('bv-dash-ghost',actorEl.classList.contains('enemy')?'enemy-ghost':'player-ghost');
    if(actorId)ghost.classList.add(`actor-${actorId.replace(/[^a-zA-Z0-9_-]/g,'')}`);
    if(mode==='wudang')ghost.classList.add('wuji-longfist-ghost');
    if(mode==='skill')ghost.classList.add('bv-single-skill-ghost');
    const sourceStyle=getComputedStyle(source);
    ghost.style.background=sourceStyle.background;
    ghost.style.backgroundImage=sourceStyle.backgroundImage;
    ghost.style.backgroundPosition=sourceStyle.backgroundPosition;
    ghost.style.backgroundSize=sourceStyle.backgroundSize;
    ghost.style.backgroundRepeat=sourceStyle.backgroundRepeat;
    ghost.style.left=`${s.left-root.left}px`;ghost.style.top=`${s.top-root.top}px`;ghost.style.width=`${s.width}px`;ghost.style.height=`${s.height}px`;
    stage.appendChild(ghost);source.style.visibility='hidden';actorEl.classList.add('bv-moving');
    const dx=(t.left+t.width/2)-(s.left+s.width/2),dy=(t.top+t.height/2)-(s.top+s.height/2);
    const finish=()=>{ghost.remove();source.style.visibility='';actorEl.classList.remove('bv-moving');};
    if(ghost.animate){
      const isSkill=mode==='skill';
      const frames=mode==='wudang'?
        [{transform:'translate3d(0,0,0) scale(1) rotate(0)',filter:'brightness(1)'},{offset:.16,transform:'translate3d(-8px,2px,0) scale(.96) rotate(-2deg)',filter:'brightness(1.08)'},{offset:.48,transform:`translate3d(${dx*.78}px,${dy*.78-3}px,0) scale(1.08) rotate(4deg)`,filter:'brightness(1.35) drop-shadow(0 0 8px rgba(255,224,155,.7))'},{offset:.62,transform:`translate3d(${dx*.9}px,${dy*.9}px,0) scale(1.12) rotate(7deg)`,filter:'brightness(1.6) drop-shadow(0 0 12px rgba(255,211,118,.9))'},{offset:.78,transform:`translate3d(${dx*.72}px,${dy*.72}px,0) scale(1.04) rotate(1deg)`,filter:'brightness(1.12)'},{transform:'translate3d(0,0,0) scale(1) rotate(0)',filter:'brightness(1)'}]
        :[{transform:'translate3d(0,0,0) scale(1) rotate(0)',filter:'brightness(1)'},{offset:.14,transform:`translate3d(${dx*.12}px,${dy*.12+3}px,0) scale(.96) rotate(${actorEl.classList.contains('enemy')?2:-2}deg)`,filter:'brightness(1.08)'},{offset:.48,transform:`translate3d(${dx*.78}px,${dy*.78-4}px,0) scale(${isSkill?1.12:1.07}) rotate(${actorEl.classList.contains('enemy')?-7:7}deg)`,filter:`brightness(${isSkill?1.55:1.3})`},{offset:.62,transform:`translate3d(${dx*.9}px,${dy*.9}px,0) scale(${isSkill?1.16:1.11}) rotate(${actorEl.classList.contains('enemy')?-9:9}deg)`,filter:`brightness(${isSkill?1.72:1.45}) drop-shadow(0 0 ${isSkill?12:7}px rgba(255,211,118,.8))`},{offset:.78,transform:`translate3d(${dx*.70}px,${dy*.70}px,0) scale(1.03) rotate(1deg)`,filter:'brightness(1.08)'},{transform:'translate3d(0,0,0) scale(1) rotate(0)',filter:'brightness(1)'}];
      const anim=ghost.animate(frames,{duration:scaled(mode==='wudang'?620:isSkill?610:500),easing:'cubic-bezier(.2,.8,.2,1)'});anim.onfinish=finish;anim.oncancel=finish;
    }else{pulse(actorEl,'acting',430);finish();}
  }

  // V0.24.29 retained: event-driven Zhang Wuji single-target normal punch.
  function wujiPunchAttack(actorEl,targetEl,mode='normal',onImpact=null){
    const source=actorEl?.querySelector('.bv-portrait'),target=targetEl?.querySelector('.bv-portrait');
    if(!source||!target){onImpact?.();return;}
    const s=source.getBoundingClientRect(),t=target.getBoundingClientRect(),root=stage.getBoundingClientRect();
    const ghost=source.cloneNode(true);
    ghost.classList.add('bv-dash-ghost',actorEl.classList.contains('enemy')?'enemy-ghost':'player-ghost','actor-wuji');
    if(mode==='wudang')ghost.classList.add('wuji-longfist-ghost');
    if(mode==='skill')ghost.classList.add('bv-single-skill-ghost');
    const sourceStyle=getComputedStyle(source);
    ghost.style.background=sourceStyle.background;
    ghost.style.backgroundImage=sourceStyle.backgroundImage;
    ghost.style.backgroundPosition=sourceStyle.backgroundPosition;
    ghost.style.backgroundSize=sourceStyle.backgroundSize;
    ghost.style.backgroundRepeat=sourceStyle.backgroundRepeat;
    ghost.style.left=`${s.left-root.left}px`;ghost.style.top=`${s.top-root.top}px`;ghost.style.width=`${s.width}px`;ghost.style.height=`${s.height}px`;
    ghost.dataset.wujiPhase='travel';
    stage.appendChild(ghost);source.style.visibility='hidden';actorEl.classList.add('bv-moving');

    const dx=(t.left+t.width/2)-(s.left+s.width/2),dy=(t.top+t.height/2)-(s.top+s.height/2);
    const travelX=dx*.84,travelY=dy*.84;
    const near=`translate3d(${travelX}px,${travelY}px,0)`;
    let cleaned=false,impacted=false,returning=false,fallbackImpact=null,fallbackEnd=null;
    const clearFallbacks=()=>{if(fallbackImpact)clearTimeout(fallbackImpact);if(fallbackEnd)clearTimeout(fallbackEnd);fallbackImpact=fallbackEnd=null;};
    const impact=()=>{if(impacted)return;impacted=true;if(fallbackImpact)clearTimeout(fallbackImpact);fallbackImpact=null;onImpact?.();};
    const cleanup=()=>{if(cleaned)return;cleaned=true;clearFallbacks();ghost.remove();source.style.visibility='';actorEl.classList.remove('bv-moving');};
    const returnHome=()=>{
      if(returning||cleaned)return;returning=true;clearFallbacks();
      if(!impacted)impact();
      ghost.dataset.wujiPhase='return';
      ghost.style.transform=near;
      if(ghost.animate){
        const anim=ghost.animate([{transform:near},{transform:'translate3d(0,0,0)'}],{duration:scaled(160),easing:'cubic-bezier(.35,.1,.4,1)'});
        anim.onfinish=cleanup;anim.oncancel=cleanup;
      }else cleanup();
    };
    const startStrike=()=>{
      if(cleaned)return;
      ghost.style.transform=near;
      ghost.dataset.wujiPhase='arrived';
      requestAnimationFrame(()=>{
        if(!ghost.isConnected||cleaned)return;
        ghost.dataset.wujiPhase='strike';
        fallbackImpact=setTimeout(impact,scaled(260));
        fallbackEnd=setTimeout(returnHome,scaled(380));
      });
    };
    ghost.addEventListener('xyt-wuji-strike-contact',impact,{once:true});
    ghost.addEventListener('xyt-wuji-strike-end',returnHome,{once:true});
    if(ghost.animate){
      const travel=ghost.animate([{transform:'translate3d(0,0,0)'},{transform:near}],{duration:scaled(120),easing:'cubic-bezier(.2,.75,.25,1)'});
      travel.onfinish=()=>{ghost.style.transform=near;startStrike();};
      travel.oncancel=()=>{if(!returning&&!cleaned)startStrike();};
    }else startStrike();
  }

  function skillCast(actorEl,targets,crit){
    if(actorEl){pulse(actorEl,'skill-cast',720);const aura=document.createElement('span');aura.className='bv-skill-aura';actorEl.appendChild(aura);setTimeout(()=>aura.remove(),scaled(760));}
    const wave=document.createElement('span');wave.className='bv-skill-wave';stage.appendChild(wave);setTimeout(()=>wave.remove(),scaled(700));
    setTimeout(()=>{for(const t of targets)addImpact(card(t.name),'burst',crit);stageShake(true);},scaled(170));
  }
  function singleSkillCast(actorEl,targetEl,crit){
    if(!actorEl||!targetEl)return;
    pulse(actorEl,'bv-single-skill-cast',680);
    const aura=document.createElement('span');aura.className='bv-single-skill-aura';actorEl.appendChild(aura);setTimeout(()=>aura.remove(),scaled(620));
    dashAttack(actorEl,targetEl,'skill');
    setTimeout(()=>{addImpact(targetEl,'burst',crit);stageShake(crit);},scaled(350));
  }
  function wujiSingleSkillCast(actorEl,targetEl,crit,onImpact){
    if(!actorEl||!targetEl){onImpact?.();return;}
    pulse(actorEl,'bv-single-skill-cast',680);
    const aura=document.createElement('span');aura.className='bv-single-skill-aura';actorEl.appendChild(aura);setTimeout(()=>aura.remove(),scaled(620));
    wujiPunchAttack(actorEl,targetEl,'skill',()=>{addImpact(targetEl,'burst',crit);stageShake(crit);onImpact?.();});
  }
  function wudangLongFist(actorEl,targetEl,crit,onImpact=null){
    if(!actorEl||!targetEl){onImpact?.();return;}
    pulse(actorEl,'wuji-longfist-cast',680);
    const source=actorEl.querySelector('.bv-portrait');
    if(source){const breath=document.createElement('span');breath.className='wuji-longfist-breath';source.appendChild(breath);setTimeout(()=>breath.remove(),scaled(700));}
    wujiPunchAttack(actorEl,targetEl,'wudang',()=>{addImpact(targetEl,'wudang-fist',crit);stageShake(crit);onImpact?.();});
  }
  function applyStructured(event){
    const hits=Array.isArray(event.hits)?event.hits:[];
    const hitNames=new Set();
    for(const hit of hits){
      const f=byName.get(hit.name),el=card(hit.name);if(!f||!el)continue;
      hitNames.add(hit.name);
      const wasAlive=f.alive;
      if(hit.miss)floatText(el,'闪避','dodge');
      else if(hit.guarded)floatText(el,'格挡','dodge');
      else if(Number(hit.damage||0)>0)floatText(el,`-${fmt(Math.max(1,Math.round(hit.damage)))}`,hit.crit?'crit':'damage');
      if(!hit.miss&&!hit.guarded)pulse(el,'hit',430);
      f.hpPct=clamp(Number(hit.hpPct??f.hpPct),0,100);f.alive=hit.alive!==false;sync(f);
      if(wasAlive&&!f.alive)pulse(el,'fall',650);
    }
    if(Array.isArray(event.states))for(const state of event.states){
      const f=byName.get(state.name);if(!f)continue;
      const wasAlive=f.alive,beforeHp=f.hpPct;
      f.hpPct=clamp(Number(state.hpPct??f.hpPct),0,100);f.rage=clamp(Number(state.rage??f.rage),0,8);f.alive=state.alive!==false;sync(f);
      if(!hitNames.has(state.name)&&beforeHp>f.hpPct+.1)pulse(card(state.name),'hit',430);
      if(wasAlive&&!f.alive)pulse(card(state.name),'fall',650);
    }
  }
  function applyApprox(targets,event,crit,dodged,guarded){
    let visualDrop=event.damage<=0?0:clamp(6+Math.log10(event.damage+1)*5+(event.normal?0:8)+(crit?6:0),8,55);
    const per=visualDrop/Math.max(1,Math.sqrt(targets.length));
    for(const t of targets){const el=card(t.name);pulse(el,'hit',430);if(event.damage>0){t.hpPct=clamp(t.hpPct-per,0,100);floatText(el,`-${fmt(Math.max(1,Math.round(event.damage/targets.length)))}`,crit?'crit':'damage');}else if(dodged)floatText(el,'闪避','dodge');else if(guarded)floatText(el,'格挡','dodge');sync(t);}
    if(event.tail?.includes('有敌人倒下')){const victim=targets.find(x=>x.alive)||targets[0];if(victim){victim.hpPct=0;victim.alive=false;sync(victim);pulse(card(victim.name),'fall',650);}}
  }
  function fallbackWujiSkill(actorEl,targets,crit,settle,event){
    const isWujiLongFist=event.skill==='武当长拳';
    if(isWujiLongFist){const targetEl=card(targets[0].name);wudangLongFist(actorEl,targetEl,crit,settle);return;}
    if(targets.length===1){const targetEl=card(targets[0].name);wujiSingleSkillCast(actorEl,targetEl,crit,settle);return;}
    skillCast(actorEl,targets,crit);setTimeout(settle,scaled(180));
  }
  function applyAction(event){
    const actor=byName.get(event.actor);if(!actor)return setTicker(event.line);
    const actorEl=card(actor.name),targets=chooseTargets(actor,event);
    if(!event.structured){actor.rage=event.normal?Math.min(8,actor.rage+2):Math.max(0,actor.rage-4);sync(actor);}
    if(event.skill&&skillEl){skillEl.textContent=`${actor.name} · ${event.skill}`;skillEl.classList.add('show');setTimeout(()=>skillEl.classList.remove('show'),scaled(720));}
    if(!targets.length){setTicker(event.line);return;}
    const crit=event.structured?Number(event.crits||0)>0:event.tail?.includes('暴击'),dodged=!event.structured&&event.tail?.includes('闪避'),guarded=!event.structured&&event.tail?.includes('护盾挡下');
    const settle=()=>event.structured?applyStructured(event):applyApprox(targets,event,crit,dodged,guarded);
    const isWuji=actor.id==='wuji'||actor.name==='张无忌';
    if(event.normal){
      const targetEl=card(targets[0].name);
      if(isWuji)wujiPunchAttack(actorEl,targetEl,'normal',()=>{addImpact(targetEl,'slash',crit);stageShake(crit);settle();});
      else{dashAttack(actorEl,targetEl);setTimeout(()=>{addImpact(targetEl,'slash',crit);stageShake(crit);settle();},scaled(205));}
    }else if(isWuji){
      // V0.24.30: the cut-in owns the visual order. Targets still come only from chooseTargets/event.targets.
      const targetEls=targets.map(t=>card(t.name)).filter(Boolean);
      const handled=!stage.dispatchEvent(new CustomEvent('xyt-wuji-ultimate',{bubbles:true,cancelable:true,detail:{skill:event.skill||'',targetEls,onImpact:settle}}));
      if(!handled)fallbackWujiSkill(actorEl,targets,crit,settle,event);
    }else if(targets.length===1){
      const targetEl=card(targets[0].name);singleSkillCast(actorEl,targetEl,crit);setTimeout(settle,scaled(350));
    }else{skillCast(actorEl,targets,crit);setTimeout(settle,scaled(180));}
    setTicker((event.line||'').replace(/。+$/,''));
  }
  function applyNotice(event){
    setTicker(event.line);
    const actor=[...byName.keys()].find(name=>event.line.startsWith(name));if(actor){const el=card(actor);if(event.line.includes('复活')){const f=byName.get(actor);f.alive=true;f.hpPct=Math.max(30,f.hpPct);sync(f);pulse(el,'revive',650);floatText(el,'复活','heal');}else if(CONTROL_RE.test(event.line))pulse(el,'controlled',620);}
  }
  function applyEvent(event){if(event.type==='round'){if(roundEl)roundEl.textContent=`第 ${event.round} 回合`;setTicker(`第${event.round}回合`);return;}if(event.type==='action')return applyAction(event);if(event.type==='notice')return applyNotice(event);}
  function delayFor(event){
    if(event.type==='round')return scaled(330);
    if(event.type==='action'){
      if(!event.normal&&event.actor==='张无忌')return scaled(1600);
      return scaled(event.normal?680:900);
    }
    return scaled(420);
  }
  function schedule(){if(finished)return;if(index>=events.length)return finish();const event=events[index++];applyEvent(event);timer=setTimeout(schedule,delayFor(event));}
  function finish(){
    if(finished)return;finished=true;if(timer)clearTimeout(timer);
    const win=outcome.classList.contains('battle-win');
    if(roundEl)roundEl.textContent=win?'战斗胜利':'战斗失败';
    setTicker(win?'胜利！奖励已经结算。':'战败，可调整阵容与养成后再试。');
    finalBox.hidden=false;finalBox.classList.add('show');stage.querySelector('[data-bv-skip]')?.setAttribute('disabled','');
  }
  function clearUltimateFx(){stage.dispatchEvent(new CustomEvent('xyt-battle-stop',{bubbles:true}));}
  function skip(){clearUltimateFx();index=events.length;finish();}
  function toggleSpeed(){speed=speed>=5?1:speed+1;stage.dataset.bvSpeedLevel=String(speed);const btn=stage.querySelector('[data-bv-speed]');if(btn)btn.textContent=`${speed}×`;stage.dispatchEvent(new CustomEvent('battlespeedchange',{detail:{speed,rate:rate()}}));}
  function stop(){
    if(timer)clearTimeout(timer);finished=true;clearUltimateFx();
    for(const moving of stage.querySelectorAll('.bv-fighter.bv-moving')){const portrait=moving.querySelector('.bv-portrait');if(portrait)portrait.style.visibility='';moving.classList.remove('bv-moving');}
    for(const ghost of stage.querySelectorAll('.bv-dash-ghost,.bv-impact,.bv-skill-wave,.bv-skill-aura,.bv-single-skill-aura,.wuji-longfist-breath'))ghost.remove();
  }
  return {start(){timer=setTimeout(schedule,scaled(180));},skip,toggleSpeed,stop};
}

function enhanceBattleDialog(){
  const log=battleDialogBody.querySelector('.battle-log');if(!log||battleDialogBody.dataset.visualized==='1')return null;
  battleDialogBody.dataset.visualized='1';
  const title=battleDialogBody.querySelector('.modal-head h3')?.textContent||'战斗';
  const outcome=battleDialogBody.querySelector('.battle-win,.battle-loss');if(!outcome)return null;
  const reward=[...battleDialogBody.querySelectorAll('.notice')].find(x=>x.closest('.modal-inner'))||null;
  const nodes=[...log.children];
  const events=parseEvents(nodes),players=collectPlayerFighters();
  const enemyNames=enemyNamesFromNodes(nodes,title),enemies=enemyNames.map((name,i)=>({id:`enemy-${i}`,name,side:'enemy',hpMax:100,hpPct:100,rage:2,alive:true}));
  const stage=document.createElement('section');stage.className='battle-visual-stage battle-v240 battle-actors-v02426';stage.dataset.bvSpeedLevel='1';stage.innerHTML=`<div class="bv-stage-top"><span data-bv-round>准备战斗</span><div class="bv-controls"><button class="btn btn-small" type="button" data-bv-speed>1×</button><button class="btn btn-small" type="button" data-bv-skip>跳过</button></div></div><div class="bv-skill-banner" data-bv-skill></div><div class="bv-field"><div class="bv-team player-team">${players.map((f,i)=>fighterCard(f,i)).join('')}</div><div class="bv-center-mark"><b>VS</b></div><div class="bv-team enemy-team">${enemies.map((f,i)=>fighterCard(f,i)).join('')}</div></div><div class="bv-ticker" data-bv-ticker>双方侠客入场……</div>`;
  const finalBox=document.createElement('div');finalBox.className='bv-final';finalBox.hidden=true;outcome.remove();finalBox.appendChild(outcome);if(reward){reward.remove();finalBox.appendChild(reward);}log.parentNode.insertBefore(stage,log);log.parentNode.insertBefore(finalBox,log);
  const details=document.createElement('details');details.className='bv-log-details';details.innerHTML='<summary>查看文字战报</summary>';log.remove();details.appendChild(log);finalBox.after(details);
  controller=buildController(stage,events,players,enemies,finalBox,outcome);
  stage.addEventListener('click',e=>{if(e.target.closest('[data-bv-speed]'))controller?.toggleSpeed();if(e.target.closest('[data-bv-skip]'))controller?.skip();});
  return controller;
}

const nativeShow=battleDialog.showModal.bind(battleDialog);
battleDialog.showModal=function(){controller?.stop();controller=null;battleDialogBody.dataset.visualized='0';const c=enhanceBattleDialog();nativeShow();requestAnimationFrame(()=>c?.start());};
battleDialog.addEventListener('close',()=>{controller?.stop();controller=null;});
