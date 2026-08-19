import { HEROES, chapterEnemyPower, towerEnemyPower, chapterEnemyRating, towerEnemyRating } from './data.js';
import { heroStats } from './state.js';
import { RED_KUNGFU, DIVINE_KUNGFU, effectAtLevel } from './kungfu.js';
import { weaponBattleEffects } from './weapons.js';
import { effectiveHeroProfile, awakeningBattleEffects } from './awakening.js';
import { applyWudaoProfile, wudaoBattleEffects } from './wudao.js';
import { storyHeroProfile, storyBattleEffects } from './story.js';
import { innerPowerBattleEffects } from './innerpower.js';

const CONTROL_TYPES=['stun','silence','seal'];
const CONTROL_NAMES={stun:'眩晕',silence:'沉默',seal:'封穴'};
const THREE_DU=['duer','dunan','dujie'];
const ENEMY_POWER_MULTIPLIER=4;

function effectsForHero(state, heroId) {
  const h=state.heroes?.[heroId], out=[];
  for (const ref of h?.kungfu?.equipped || []) {
    if (!ref) continue;
    if (String(ref).startsWith('god:')) {
      const god=DIVINE_KUNGFU[String(ref).slice(4)];
      if (!god) continue;
      const source=god.recipe?.find(x=>x.kind==='kungfu' && RED_KUNGFU[x.id]?.type===god.type);
      if (source) { const e=effectAtLevel(source.id,10); if(e) out.push(e); }
    } else {
      const lv=Number(state.kungfu?.red?.[ref]?.level||0);
      const e=effectAtLevel(ref,lv); if(e) out.push(e);
    }
  }
  out.push(...weaponBattleEffects(state,heroId));
  out.push(...awakeningBattleEffects(state,heroId));
  out.push(...wudaoBattleEffects(state,heroId));
  out.push(...storyBattleEffects(state,heroId));
  out.push(...innerPowerBattleEffects(heroId,h?.innerPower?.year||0));
  return out;
}

function effectOf(fighter,kind){ return fighter.effects?.find(x=>x.kind===kind) || null; }
function living(team){return team.filter(x=>x.alive);}
function circleActive(team){return THREE_DU.every(id=>living(team).some(x=>x.id===id));}
function controlCount(f){return CONTROL_TYPES.reduce((n,k)=>n+(Number(f.statuses?.[k]||0)>0?1:0),0);}
function hpPct(f){return Math.max(0,Math.min(100,Number(f?.hp||0)>0?Number(f.hpNow||0)/Number(f.hp)*100:0));}
function visualState(f){return {name:f.name,hpPct:hpPct(f),rage:Math.max(0,Math.min(8,Number(f.rage||0))),alive:!!f.alive};}
function visualMarker(payload){return `<!--XYT:${encodeURIComponent(JSON.stringify(payload))}-->`;}

function cloneFighter(base) {
  const rage=base.initialRage??2;
  return { ...base, hpNow:base.hp, rage, alive:true, shield:0, reviveUsed:0,
    statuses:{stun:0,silence:0,seal:0}, buddha:0, vajraGuard:0, controlDamageBonus:0,
    rageTransferUsed:0, guardStacks:0, hitsTaken:0, damageImmuneCharges:0, damageImmuneThroughRound:0,
    actedThisRound:false, firstHitTakenThisRound:false, yinYangAtk:0, yinYangDef:0,
    lethalReverseUsed:0, lowHpTriggered:0, nextSkillBonus:0, innerNextDamageBonus:0, innerReactionRound:{}, assistCount:0, assistSeen:{},
    attackDownPct:0, attackDownTurns:0, abnormalImmuneThroughRound:base.passive?.firstRoundAbnormalImmune?1:0 };
}

function playerTeam(state) {
  const team=state.party.filter(Boolean).map(id=>{
    const tpl=applyWudaoProfile(state,id,storyHeroProfile(state,id,effectiveHeroProfile(state,id,HEROES[id]))), s=heroStats(state,id), effects=effectsForHero(state,id);
    const rageEffect=effects.find(x=>x.kind==='rageBurst'),dodgeStart=effects.find(x=>x.kind==='dodgeStart');
    return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,
      passive:tpl.passive||{},combat:tpl.combat||{},effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });
  });
  const maxAtk=Math.max(0,...team.map(x=>x.atk));
  for(const f of team){const e=effectOf(f,'copyHighestAtk');if(e)f.atk+=Math.round(maxAtk*e.ratio);}
  for(const f of team){const e=effectOf(f,'teamStartShield');if(e)for(const ally of team)ally.shield+=Math.round(ally.hp*e.ratio);}
  return team;
}

function makeEnemyTeam(power,label='江湖敌手') {
  const count=6, tunedPower=power*ENEMY_POWER_MULTIPLIER, each=tunedPower/count, team=[];
  for(let i=0;i<count;i++){
    const scale=.93+i*.035, atk=Math.max(60,Math.round(each*.155*scale)), def=Math.max(40,Math.round(each*.087*scale)), hp=Math.max(800,Math.round(each*.83*scale));
    team.push(cloneFighter({id:`enemy-${i}`,name:`${label}${i+1}`,side:'enemy',atk,def,hp,speed:92+i*2,hit:0,dodge:0,crit:0,antiCrit:0,effects:[],combat:{},skill:{name:'合击',target:'one',multiplier:1.65,rageCost:4}}));
  }
  return team;
}

function pickTargets(skill,enemies){
  const alive=living(enemies); if(!alive.length)return[];
  if(skill.target==='all')return alive;
  if(skill.target==='three')return [...alive].sort((a,b)=>a.hpNow-b.hpNow).slice(0,3);
  if(skill.target==='highestAtk')return [[...alive].sort((a,b)=>b.atk-a.atk)[0]];
  return [alive[Math.floor(Math.random()*alive.length)]];
}

function damage(attacker,target,multiplier=1,ignoreDef=0){
  const hitChance=Math.max(.15,Math.min(.98,.95+Number(attacker.hit||0)/100-Number(target.dodge||0)/100));
  if(Math.random()>hitChance)return {amount:0,miss:true,crit:false};
  const atkNow=attacker.atk*(1-Number(attacker.attackDownPct||0)),effectiveDef=target.def*(1-ignoreDef), base=Math.max(atkNow*.28,atkNow-effectiveDef*.56), variance=.92+Math.random()*.16;
  const critChance=Math.max(0,Math.min(.75,.05+Number(attacker.crit||0)/100-Number(target.antiCrit||0)/100));
  const crit=Math.random()<critChance,critMul=Math.max(1.05,1.5+Number(attacker.critDamage||0)/100-Number(target.critDamageReduction||0)/100);
  const bonus=1+Number(attacker.damageBonus||0)/100+Number(attacker.controlDamageBonus||0),reflect=effectOf(target,'reflect'),flatDR=effectOf(target,'damageReduction');
  const turnGuard=effectOf(target,'turnGuard'),stackGuard=effectOf(target,'stackDRonHit');
  let extraDR=Number(stackGuard?.perHit||0)*Math.min(Number(target.guardStacks||0),Number(stackGuard?.maxStacks||0));
  if(turnGuard){extraDR+=target.actedThisRound?Number(turnGuard.afterActionDR||0):Number(turnGuard.beforeActionDR||0);if(target.actedThisRound&&!target.firstHitTakenThisRound)extraDR+=Number(turnGuard.firstHitReduction||0);}
  const reduction=Math.max(.08,1-Number(target.damageReduction||0)/100-Number(reflect?.damageReduction||0)-Number(flatDR?.value||0)/100-extraDR);
  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?critMul:1)*bonus*reduction)),miss:false,crit};
}

function addBuddha(target,amount,log){
  const before=Number(target.buddha||0),after=Math.min(10,before+Math.max(0,Number(amount)||0));
  target.buddha=after;
  if(after>before)log.push(`${target.name}佛性 ${before}→${after}层（行动失败率${after*10}%）。`);
}

function applyAbnormal(target,type,duration,round,log,source='',targetTeam=[]){ 
  if(!CONTROL_TYPES.includes(type)||!target.alive)return false;
  if(Number(target.abnormalImmuneThroughRound||0)>=round){log.push(`${target.name}免疫${CONTROL_NAMES[type]}${source?`（${source}）`:''}。`);return false;}
  target.statuses[type]=Math.max(Number(target.statuses[type]||0),Math.max(1,Number(duration)||1));
  log.push(`${target.name}陷入【${CONTROL_NAMES[type]}】${target.statuses[type]}次行动。`);triggerInnerReaction(target,'abnormal',targetTeam,round,log);return true;
}

function tickControls(actor){for(const k of CONTROL_TYPES)if(Number(actor.statuses?.[k]||0)>0)actor.statuses[k]-=1;actor.controlDamageBonus=0;}

function prepareJiuyin(actor,log){
  const e=effectOf(actor,'consumeControlDamage');if(!e)return;
  const active=CONTROL_TYPES.filter(k=>Number(actor.statuses?.[k]||0)>0);if(!active.length||Math.random()>=Number(e.chance||0))return;
  const n=Math.min(active.length,Math.max(1,Number(e.maxControls||1)));
  for(const k of active.slice(0,n))actor.statuses[k]=0;
  actor.controlDamageBonus=n*Number(e.bonusPerControl||0);
  log.push(`${actor.name}触发【九阴真经】，化去${n}个控制，本次出手伤害+${Math.round(actor.controlDamageBonus*100)}%。`);
}

function tryRageTransfer(target,own,amount,log){
  const e=effectOf(target,'rageTransfer');if(!e||amount<=0||target.rageTransferUsed>=Number(e.maxPerRound||5)||Math.random()>=Number(e.chance||0))return;
  const allies=living(own).filter(x=>x!==target);if(!allies.length)return;
  const ally=allies[Math.floor(Math.random()*allies.length)],give=Math.min(amount,Number(e.maxPerRound||5)-target.rageTransferUsed);
  ally.rage=Math.min(8,ally.rage+give);target.rageTransferUsed+=give;
  log.push(`${target.name}触发【气劲转注诀】，将被削减的${give}点怒气转给${ally.name}。`);
}
function reduceRage(target,own,amount,log){const before=target.rage,actual=Math.min(before,Math.max(0,Number(amount)||0));target.rage=Math.max(0,before-actual);if(actual)tryRageTransfer(target,own,actual,log);return actual;}

function tryRevive(target,log){
  const e=effectOf(target,'revive');
  if(!e || target.reviveUsed>=e.maxTriggers || Math.random()>=e.chance)return false;
  target.reviveUsed+=1; target.alive=true; target.hpNow=Math.max(1,Math.round(target.hp*e.healRatio));
  log.push(`${target.name}触发【混元一气功】，复活并恢复${Math.round(e.healRatio*100)}%气血！`); return true;
}
function tryTeamRevive(target,team,log){
  if(target.alive)return false;
  for(const source of living(team)){const e=effectOf(source,'teamReviveOnce');if(e&&!source.teamReviveUsed){source.teamReviveUsed=1;target.alive=true;target.hpNow=Math.max(1,Math.round(target.hp*e.ratio));log.push(`${source.name}悟道触发复起，${target.name}恢复${Math.round(e.ratio*100)}%气血！`);return true;}}
  return false;
}
function applyDamage(target,amount,log){
  let left=amount;
  if(target.shield>0){const absorbed=Math.min(target.shield,left);target.shield-=absorbed;left-=absorbed;}
  if(left>0)target.hpNow-=left;
  if(target.hpNow<=0){target.hpNow=0;target.alive=false;tryRevive(target,log);}
}
function triggerInnerReaction(target,event,team,round,log){
  if(!target?.alive)return;
  for(const e of (target.effects||[]).filter(x=>x.kind==='innerReaction'&&x.event===event)){
    const key=`${event}:${e.label||''}`;if(e.oncePerRound&&target.innerReactionRound?.[key]===round)continue;
    target.innerReactionRound=target.innerReactionRound||{};target.innerReactionRound[key]=round;
    if(e.mode==='nextDamage'){target.innerNextDamageBonus=Math.max(Number(target.innerNextDamageBonus||0),Number(e.value||0));log.push(`${target.name}触发【${e.label}】，下次出手伤害提高${Math.round(Number(e.value||0)*100)}%。`);}
    else if(e.mode==='heal'){const allies=living(team).filter(x=>x.alive);if(allies.length){const ally=[...allies].sort((a,b)=>a.hpNow/a.hp-b.hpNow/b.hp)[0],heal=Math.max(1,Math.round(ally.hp*Number(e.value||0)));ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);log.push(`${target.name}触发【${e.label}】，为${ally.name}恢复 ${heal.toLocaleString()} 气血。`);}}
    else if(e.mode==='shield'){const shield=Math.max(1,Math.round(target.hp*Number(e.value||0)));target.shield+=shield;log.push(`${target.name}触发【${e.label}】，获得 ${shield.toLocaleString()} 护盾。`);}
  }
}
function triggerInnerBuff(target,team,round,log){triggerInnerReaction(target,'buff',team,round,log);}

function tryVajraGuard(attacker,target,log){
  if(Number(target.vajraGuard||0)<=0)return false;
  target.vajraGuard-=1;addBuddha(attacker,1,log);
  log.push(`${target.name}的【金刚伏魔圈】护盾免疫本次直接伤害，${attacker.name}沾染1层佛性。`);return true;
}
function initializeKungfuBattle(fighters,log){
  for(const f of fighters){const e=effectOf(f,'damageImmunityStart');if(e&&Math.random()<Number(e.chance||0)){f.damageImmuneCharges=Number(e.charges||1);f.damageImmuneThroughRound=Number(e.duration||2);log.push(`${f.name}触发【阿罗汉神功】，获得${f.damageImmuneCharges}次伤害免疫。`);}}
}
function tryDamageImmunity(target,round,log){if(Number(target.damageImmuneCharges||0)<=0||round>Number(target.damageImmuneThroughRound||0))return false;target.damageImmuneCharges-=1;log.push(`${target.name}的【阿罗汉神功】免疫本次伤害。`);return true;}
function adjustBigHit(target,amount,log){const e=effectOf(target,'bigHitGuard');if(!e||amount<=target.hp*Number(e.threshold||.35))return amount;if(e.lethalReverse&&!target.lethalReverseUsed&&amount>=target.hpNow){target.lethalReverseUsed=1;const heal=Math.round(amount*Number(e.reverseHeal||.5));target.hpNow=Math.min(target.hp,target.hpNow+heal);log.push(`${target.name}触发【先天功·逆转】，免疫致命伤害并转化治疗 ${heal.toLocaleString()}。`);return 0;}const reduced=Math.max(0,Math.round(amount*(1-Number(e.reduction||0))));log.push(`${target.name}触发【先天功】，大额伤害由${amount.toLocaleString()}降至${reduced.toLocaleString()}。`);return reduced;}
function afterDirectHit(target,log){target.firstHitTakenThisRound=true;const e=effectOf(target,'stackDRonHit');if(e){target.hitsTaken=Number(target.hitsTaken||0)+1;target.guardStacks=Math.min(Number(e.maxStacks||0),Number(target.guardStacks||0)+1);if(e.healEvery3&&target.hitsTaken%3===0&&target.alive){const heal=Math.round(target.hp*Number(e.healEvery3||0));target.hpNow=Math.min(target.hp,target.hpNow+heal);log.push(`${target.name}触发【金刚护体功】，受击积累减伤并恢复 ${heal.toLocaleString()} 气血。`);}}const low=effectOf(target,'lowHpSkillBoost');if(low&&!target.lowHpTriggered&&target.alive&&target.hpNow/target.hp<Number(low.threshold||.5)){target.lowHpTriggered=1;target.nextSkillBonus=Math.max(target.nextSkillBonus,Number(low.bonus||0));target.rage=Math.min(8,target.rage+Number(low.rage||0));log.push(`${target.name}触发【真武归元诀】，下次绝技增伤${Math.round(Number(low.bonus||0)*100)}%${low.rage?`并回复${low.rage}怒`:''}。`);}}
function selfHealAfterAction(actor,log){const e=effectOf(actor,'selfHealAfterAction');if(!e||Math.random()>=Number(e.chance||0)||!actor.alive)return;const heal=Math.round(actor.hp*Number(e.ratio||0));actor.hpNow=Math.min(actor.hp,actor.hpNow+heal);log.push(`${actor.name}触发【子午针灸经】，恢复 ${heal.toLocaleString()} 气血。`);}
function healReceivedMul(target){const e=effectOf(target,'selfHealAfterAction');return 1+Number(e?.healReceived||0);}
function applyYinYangRound(f,round){if(f.yinYangAtk){f.atk-=f.yinYangAtk;f.yinYangAtk=0;}if(f.yinYangDef){f.def-=f.yinYangDef;f.yinYangDef=0;}const e=effectOf(f,'yinYangConversion');if(!e)return;const baseAtk=f.atk,baseDef=f.def;if(round===1&&e.firstRoundBoth){f.yinYangDef=Math.round(baseAtk*Number(e.firstRoundBoth||0));f.yinYangAtk=Math.round(baseDef*Number(e.firstRoundBoth||0));}else if(round%2===1)f.yinYangDef=Math.round(baseAtk*Number(e.oddAtkToDef||0));else f.yinYangAtk=Math.round(baseDef*Number(e.evenDefToAtk||0));f.atk+=f.yinYangAtk;f.def+=f.yinYangDef;}
function triggerDeathCurse(dead,foes,round,log){const e=effectOf(dead,'deathCurse');if(!e||dead.alive||dead.deathCurseUsed)return;dead.deathCurseUsed=1;const targets=[...living(foes)].sort((a,b)=>b.atk-a.atk).slice(0,Number(e.targets||1));for(const t of targets){const loss=Math.min(t.hpNow,Math.round(t.hp*Number(e.hpRatio||0)+Number(e.flat||0)));t.hpNow-=loss;if(t.hpNow<=0){t.hpNow=0;t.alive=false;}if(e.atkDown){t.attackDownPct=Math.max(Number(t.attackDownPct||0),Number(e.atkDown||0));t.attackDownTurns=Math.max(Number(t.attackDownTurns||0),Number(e.duration||2));}}if(targets.length)log.push(`${dead.name}触发【天地同寿】，反噬${targets.map(x=>x.name).join('、')}。`);}

function healTeam(team,source,ratio,log){if(!ratio)return;for(const ally of living(team)){const heal=Math.round(source.atk*ratio*healReceivedMul(ally));ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);}log.push(`${source.name}为全队恢复气血。`);}
function teamRage(team,amount,source,log,round){if(!amount)return;for(const ally of living(team)){ally.rage=Math.min(8,ally.rage+amount);triggerInnerBuff(ally,team,round,log);}log.push(`${source.name}令己方全体怒气 +${amount}。`);}
function shieldAfterAction(actor,own,log,round){
  const e=effectOf(actor,'shieldAfterAction'); if(!e||Math.random()>=e.chance)return;
  actor.shield+=Math.round(actor.hp*e.ratio);triggerInnerBuff(actor,own,round,log);log.push(`${actor.name}触发【九阳真经】，获得${Math.round(e.ratio*100)}%最大气血护盾。`);
  if(e.ally){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.shield+=Math.round(ally.hp*e.ratio);triggerInnerBuff(ally,own,round,log);log.push(`${ally.name}同时获得九阳护盾。`);}}
}

function applySkillAbnormals(actor,targets,targetTeam,action,round,log){
  if(!Array.isArray(action.abnormal))return;
  for(const target of targets)for(const a of action.abnormal){if(target.alive&&Math.random()<Number(a.chance||0))applyAbnormal(target,a.type,a.duration,round,log,actor.name,targetTeam);}
}

function applyThreeDuAfterHit(actor,target,useSkill,own,log){
  if(!circleActive(own))return;
  const n=useSkill?Number(actor.combat?.buddhaSkill||0):Number(actor.combat?.buddhaNormal||0);if(n)addBuddha(target,n,log);
}
function applyThreeDuAfterSkill(actor,own,log){
  if(!circleActive(own)||!actor.combat?.vajraGuardOnSkill)return;
  for(const ally of living(own))ally.vajraGuard=Math.max(Number(ally.vajraGuard||0),Number(actor.combat.vajraGuardOnSkill||1));
  log.push(`${actor.name}结成【金刚伏魔圈】，己方全体获得1次直接伤害免疫。`);
}

function performOne(actor,own,enemies,log,round,forceSkill=false,forceNormal=false,noNormalRage=false){
  if(!actor.alive||!living(enemies).length)return {usedSkill:false,killed:false};
  const skill=actor.skill||{name:'绝技',target:'one',multiplier:1.5,rageCost:4};
  const useSkill=forceSkill || (!forceNormal&&actor.rage>=(skill.rageCost||4));
  const action=useSkill?skill:{name:'普通攻击',target:'one',multiplier:1};
  const targets=pickTargets(action,enemies); if(!targets.length)return {usedSkill:false,killed:false};
  let skillMultiplier=action.multiplier||1;
  if(useSkill&&actor.nextSkillBonus){skillMultiplier*=1+Number(actor.nextSkillBonus||0);actor.nextSkillBonus=0;}
  if(actor.innerNextDamageBonus){skillMultiplier*=1+Number(actor.innerNextDamageBonus||0);actor.innerNextDamageBonus=0;}
  if(useSkill){const e=effectOf(actor,'skillDamage');if(e)skillMultiplier*=1+e.value;}
  if(useSkill){
    const rageBurst=effectOf(actor,'rageBurst'),cost=skill.rageCost||4;
    if(rageBurst){const spent=Math.max(cost,actor.rage),extra=Math.max(0,spent-4);skillMultiplier*=1+extra*rageBurst.bonusPerExtra;actor.rage=0;}
    else actor.rage-=cost;
  }else if(!noNormalRage&&Number(actor.statuses?.seal||0)<=0)actor.rage=Math.min(8,actor.rage+2);
  let killed=false,total=0,misses=0,crits=0,guarded=0;
  const visualHits=[];
  const pierce=effectOf(actor,'ignoreDef');
  for(const target of targets){
    const beforeHp=Number(target.hpNow||0),beforeAlive=!!target.alive;
    let targetMul=skillMultiplier;
    const missing=effectOf(actor,'missingHpDamage');if(missing){const steps=Math.floor(Math.max(0,1-target.hpNow/target.hp)*10);targetMul*=1+steps*Number(missing.bonusPer10||0);}
    if(useSkill&&actor.combat?.buddhaSkillBonusPerStack&&circleActive(own))targetMul*=1+Number(target.buddha||0)*Number(actor.combat.buddhaSkillBonusPerStack||0);
    const hit=damage(actor,target,targetMul,(action.ignoreDef||0)+Number(pierce?.value||0));
    if(hit.miss){misses++;triggerInnerReaction(target,'dodge',enemies,round,log);visualHits.push({name:target.name,damage:0,hpPct:hpPct(target),alive:!!target.alive,miss:true,guarded:false,crit:false});continue;}
    if(tryVajraGuard(actor,target,log)||tryDamageImmunity(target,round,log)){guarded++;visualHits.push({name:target.name,damage:0,hpPct:hpPct(target),alive:!!target.alive,miss:false,guarded:true,crit:false});continue;}
    const wasAlive=target.alive,flat=useSkill?Number(action.flatDamage||0):0;let amount=hit.amount+flat;amount=adjustBigHit(target,amount,log);applyDamage(target,amount,log);total+=amount;if(amount>0)afterDirectHit(target,log);if(hit.crit){crits++;if(target.alive)triggerInnerReaction(target,'critTaken',enemies,round,log);}
    applyThreeDuAfterHit(actor,target,useSkill,own,log);
    const execute=effectOf(actor,'execute');if(target.alive&&execute&&target.hpNow/target.hp<=execute.threshold&&Math.random()<execute.chance){log.push(`${actor.name}的【屠龙刀】触发斩杀！`);applyDamage(target,target.hpNow,log);}
    const reflect=effectOf(target,'reflect');if(reflect&&actor.alive){const back=Math.round(amount*reflect.ratio);if(back>0){applyDamage(actor,back,log);log.push(`${target.name}的【金丝软猬甲】反震 ${back.toLocaleString()} 伤害。`);}}
    if(!target.alive){tryTeamRevive(target,enemies,log);if(!target.alive)triggerDeathCurse(target,own,round,log);}
    const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);
    const grow=effectOf(target,'afterHitAtk');if(grow&&target.alive){target.godAtkStacks=Number(target.godAtkStacks||0);if(target.godAtkStacks<grow.maxStacks){target.atk=Math.round(target.atk*(1+grow.ratio));target.godAtkStacks+=1;}}
    if(wasAlive&&!target.alive)killed=true;
    visualHits.push({name:target.name,damage:Math.max(0,beforeHp-Number(target.hpNow||0)),rawDamage:Math.max(0,Number(amount||0)),hpPct:hpPct(target),alive:!!target.alive,wasAlive:beforeAlive,miss:false,guarded:false,crit:!!hit.crit});
  }
  if(!useSkill){const splash=effectOf(actor,'splashAdjacent');if(splash&&Math.random()<Number(splash.chance||0)){const others=living(enemies).filter(x=>!targets.includes(x));if(others.length){const t=others[Math.floor(Math.random()*others.length)],beforeHp=Number(t.hpNow||0),h=damage(actor,t,Number(splash.ratio||0),0);if(!h.miss&&!tryVajraGuard(actor,t,log)&&!tryDamageImmunity(t,round,log)){let a=adjustBigHit(t,h.amount,log);applyDamage(t,a,log);if(a>0)afterDirectHit(t,log);total+=a;log.push(`${actor.name}触发【白蟒鞭法】，波及${t.name} ${a.toLocaleString()}伤害。`);if(!t.alive)triggerDeathCurse(t,own,round,log);visualHits.push({name:t.name,damage:Math.max(0,beforeHp-Number(t.hpNow||0)),rawDamage:Math.max(0,Number(a||0)),hpPct:hpPct(t),alive:!!t.alive,wasAlive:true,miss:false,guarded:false,crit:!!h.crit,splash:true});}}}}
  if(useSkill)applySkillAbnormals(actor,targets,enemies,action,round,log);
  const actionText=`${actor.name}${useSkill?`施展【${action.name}】`:'普通攻击'}，造成 ${total.toLocaleString()} 伤害${crits?'，触发暴击':''}${misses?`，${misses}次闪避`:''}${guarded?`，${guarded}次被护盾挡下`:''}。${killed?' 有敌人倒下！':''}`;
  const marker=visualMarker({v:1,type:'action',round,actor:actor.name,skill:useSkill?action.name:'',normal:!useSkill,targets:targets.map(x=>x.name),hits:visualHits,states:[...own,...enemies].map(visualState),damage:total,crits,misses,guarded,killed});
  log.push(`${actionText}${marker}`);
  if(useSkill&&skill.refundOnKill&&killed)actor.rage+=skill.rageCost||4;
  const steal=effectOf(actor,'lifesteal');if(steal&&total>0&&actor.alive){const heal=Math.round(total*steal.ratio);actor.hpNow=Math.min(actor.hp,actor.hpNow+heal);log.push(`${actor.name}凭【${steal.label||'玄铁指环'}】吸血 ${heal.toLocaleString()}。`);}
  if(useSkill){
    applyThreeDuAfterSkill(actor,own,log);
    if(Number(skill.highestAtkAllyRage||0)>0){const ally=[...living(own)].sort((a,b)=>b.atk-a.atk)[0];if(ally){const before=ally.rage;ally.rage=Math.min(8,ally.rage+Number(skill.highestAtkAllyRage||0));const gained=ally.rage-before;if(gained){triggerInnerBuff(ally,own,round,log);log.push(`${actor.name}施展【${skill.name}】，为${ally.name}回复${gained}点怒气。`);}}}
    teamRage(own,skill.teamRage||0,actor,log,round);healTeam(own,actor,skill.healTeam||0,log);
    const rageFloor=effectOf(actor,'rageFloorAfterSkill');if(rageFloor){for(const ally of living(own)){const before=ally.rage;ally.rage=Math.max(ally.rage,rageFloor.value);if(ally.rage>before)triggerInnerBuff(ally,own,round,log);}log.push(`${actor.name}悟道令己方低怒侠客补至${rageFloor.value}怒。`);}
    const drain=effectOf(actor,'skillDrainRage');if(drain){for(const foe of living(enemies)){const lost=reduceRage(foe,enemies,drain.amount,log);if(lost)log.push(`${actor.name}压制${foe.name}怒气 -${lost}。`);}}
    const xuantian=effectOf(actor,'skillDrainRageControl');if(xuantian){for(const foe of targets.filter(x=>x.alive)){if(Math.random()<Number(xuantian.chance||0)){let amount=Number(xuantian.amount||1);if(controlCount(foe)>0&&Math.random()<Number(xuantian.extraChance||0))amount+=Number(xuantian.extraAmount||2);const lost=reduceRage(foe,enemies,amount,log);if(lost)log.push(`${actor.name}触发【玄天指】，${foe.name}怒气 -${lost}${controlCount(foe)>0?'（控制中）':''}。`);}}}
    const rageSupport=effectOf(actor,'rageSupport');if(rageSupport&&Math.random()<rageSupport.chance){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.rage=Math.min(8,ally.rage+rageSupport.amount);log.push(`${actor.name}的【焦尾琴】令${ally.name}怒气 +${rageSupport.amount}。`);}}
    if(skill.repeatChance&&living(enemies).length&&Math.random()<skill.repeatChance)performOne(actor,own,enemies,log,round,true,false);
  }
  shieldAfterAction(actor,own,log,round);selfHealAfterAction(actor,log);
  return {usedSkill:useSkill,killed};
}

function triggerAssists(acted,own,enemies,log,round){
  if(!acted.alive)return;
  for(const source of living(own)){
    if(source===acted)continue;const e=effectOf(source,'assist');if(!e)continue;
    const key=`${round}:${acted.id}`;if(source.assistSeen[key])continue;source.assistSeen[key]=1;
    if(Math.random()>=Number(e.chance||0)||!living(enemies).length)continue;
    const canSkill=Number(e.skillAfterStacks||0)>0&&source.assistCount>=Number(e.skillAfterStacks||0)&&source.rage>=Number(source.skill?.rageCost||4);
    log.push(`${source.name}触发【追魂夺命剑】，协同${acted.name}出手。`);
    performOne(source,own,enemies,log,round,canSkill,!canSkill,true);
    if(canSkill)source.assistCount=0;else{source.assistCount+=1;if(e.rageOnAssist)source.rage=Math.min(8,source.rage+Number(e.rageOnAssist||0));}
  }
}
function act(actor,own,enemies,log,round){
  prepareJiuyin(actor,log);
  const buddhaFail=Math.min(1,Number(actor.buddha||0)*.10);
  if(buddhaFail>0&&Math.random()<buddhaFail){log.push(`${actor.name}受${actor.buddha}层【佛性】压制，本次行动失败。`);actor.actedThisRound=true;tickControls(actor);return;}
  if(Number(actor.statuses?.stun||0)>0){log.push(`${actor.name}处于【眩晕】，本次无法行动。`);actor.actedThisRound=true;tickControls(actor);return;}
  const silenced=Number(actor.statuses?.silence||0)>0,sealed=Number(actor.statuses?.seal||0)>0;
  if(silenced)log.push(`${actor.name}处于【沉默】，本次只能普通攻击。`);
  if(sealed)log.push(`${actor.name}处于【封穴】，本次只能普通攻击且不能从普攻回怒。`);
  actor.actedThisRound=true;const first=performOne(actor,own,enemies,log,round,false,silenced||sealed);
  if(first.usedSkill){const extra=effectOf(actor,'extraAction');if(extra){for(let i=0;i<extra.max&&living(enemies).length;i++){if(Math.random()>=extra.chance)break;log.push(`${actor.name}触发【龙爪手】，追加出手！`);performOne(actor,own,enemies,log,round,false,false);}}}
  triggerAssists(actor,own,enemies,log,round);
  tickControls(actor);if(actor.attackDownTurns>0){actor.attackDownTurns-=1;if(actor.attackDownTurns<=0)actor.attackDownPct=0;}
}

function simulate(player,enemies,maxRounds=20){
  const log=[];
  const firstRoundImmune=player.filter(x=>x.abnormalImmuneThroughRound>=1);
  if(firstRoundImmune.length)log.push(`${firstRoundImmune.map(x=>x.name).join('、')}首回合免疫异常状态。`);
  if(circleActive(player))log.push('渡厄、渡难、渡劫齐上阵，【金刚伏魔圈】成立：佛性最高10层，每层使敌人行动失败率+10%。');
  initializeKungfuBattle([...player,...enemies],log);
  for(let round=1;round<=maxRounds;round++){
    if(!living(player).length||!living(enemies).length)break;
    log.push(`—— 第${round}回合 ——`);
    for(const f of [...living(player),...living(enemies)]){f.rageTransferUsed=0;f.actedThisRound=false;f.firstHitTakenThisRound=false;applyYinYangRound(f,round);}
    const order=[...living(player),...living(enemies)].sort((a,b)=>b.speed-a.speed||(Math.random()-.5));
    for(const actor of order){if(!actor.alive)continue;if(actor.side==='player')act(actor,player,enemies,log,round);else act(actor,enemies,player,log,round);if(!living(player).length||!living(enemies).length)break;}
  }
  const win=living(player).length>0&&living(enemies).length===0;
  return {win,log,playerAlive:living(player).length,enemyAlive:living(enemies).length};
}

export function runChapterBattle(state){const power=chapterEnemyPower(state.player.chapter),rating=chapterEnemyRating(state.player.chapter);return {...simulate(playerTeam(state),makeEnemyTeam(power,'元兵')),enemyPower:rating*ENEMY_POWER_MULTIPLIER};}
export function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor),rating=towerEnemyRating(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:rating*ENEMY_POWER_MULTIPLIER,floor};}
export function runAncientTombBattle(state,floor,power){return {...simulate(playerTeam(state),makeEnemyTeam(power,'古墓守卫')),enemyPower:power*ENEMY_POWER_MULTIPLIER,floor};}
