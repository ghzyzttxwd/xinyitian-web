import { HEROES, chapterEnemyPower, towerEnemyPower } from './data.js';
import { heroStats } from './state.js';
import { RED_KUNGFU, DIVINE_KUNGFU, effectAtLevel } from './kungfu.js';
import { weaponBattleEffects } from './weapons.js';
import { effectiveHeroProfile, awakeningBattleEffects } from './awakening.js';
import { applyWudaoProfile, wudaoBattleEffects } from './wudao.js';

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
  return out;
}

function effectOf(fighter,kind){ return fighter.effects?.find(x=>x.kind===kind) || null; }

function cloneFighter(base) {
  const rage=base.initialRage||0;
  return { ...base, hpNow:base.hp, rage, alive:true, shield:0, reviveUsed:0 };
}

function playerTeam(state) {
  const team=state.party.filter(Boolean).map(id=>{
    const tpl=applyWudaoProfile(state,id,effectiveHeroProfile(state,id,HEROES[id])), s=heroStats(state,id), effects=effectsForHero(state,id);
    const rageEffect=effects.find(x=>x.kind==='rageBurst'),dodgeStart=effects.find(x=>x.kind==='dodgeStart');
    return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });
  });
  const maxAtk=Math.max(0,...team.map(x=>x.atk));
  for(const f of team){const e=effectOf(f,'copyHighestAtk');if(e)f.atk+=Math.round(maxAtk*e.ratio);}
  for(const f of team){const e=effectOf(f,'teamStartShield');if(e)for(const ally of team)ally.shield+=Math.round(ally.hp*e.ratio);}
  return team;
}

function makeEnemyTeam(power,label='江湖敌手') {
  const count=power<14000?3:power<50000?4:6, each=power/count, team=[];
  for(let i=0;i<count;i++){
    const scale=.93+i*.035, atk=Math.max(60,Math.round(each*.155*scale)), def=Math.max(40,Math.round(each*.087*scale)), hp=Math.max(800,Math.round(each*.83*scale));
    team.push(cloneFighter({id:`enemy-${i}`,name:`${label}${i+1}`,side:'enemy',atk,def,hp,speed:92+i*2,hit:0,dodge:0,crit:0,antiCrit:0,effects:[],skill:{name:'合击',target:'one',multiplier:1.65,rageCost:4}}));
  }
  return team;
}

function living(team){return team.filter(x=>x.alive);}
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
  const effectiveDef=target.def*(1-ignoreDef), base=Math.max(attacker.atk*.28,attacker.atk-effectiveDef*.56), variance=.92+Math.random()*.16;
  const critChance=Math.max(0,Math.min(.75,.05+Number(attacker.crit||0)/100-Number(target.antiCrit||0)/100));
  const crit=Math.random()<critChance;
  const bonus=1+Number(attacker.damageBonus||0)/100,reflect=effectOf(target,'reflect'),flatDR=effectOf(target,'damageReduction');
  const reduction=Math.max(.2,1-Number(target.damageReduction||0)/100-Number(reflect?.damageReduction||0)-Number(flatDR?.value||0)/100);
  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1)*bonus*reduction)),miss:false,crit};
}

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

function healTeam(team,source,ratio,log){
  if(!ratio)return;
  for(const ally of living(team)){const heal=Math.round(source.atk*ratio);ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);}
  log.push(`${source.name}为全队恢复气血。`);
}
function teamRage(team,amount,source,log){if(!amount)return;for(const ally of living(team))ally.rage=Math.min(8,ally.rage+amount);log.push(`${source.name}令己方全体怒气 +${amount}。`);}

function shieldAfterAction(actor,own,log){
  const e=effectOf(actor,'shieldAfterAction'); if(!e||Math.random()>=e.chance)return;
  actor.shield+=Math.round(actor.hp*e.ratio);
  log.push(`${actor.name}触发【九阳真经】，获得${Math.round(e.ratio*100)}%最大气血护盾。`);
  if(e.ally){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.shield+=Math.round(ally.hp*e.ratio);log.push(`${ally.name}同时获得九阳护盾。`);}}
}

function performOne(actor,own,enemies,log,forceSkill=false){
  if(!actor.alive||!living(enemies).length)return {usedSkill:false,killed:false};
  const skill=actor.skill||{name:'绝技',target:'one',multiplier:1.5,rageCost:4};
  const useSkill=forceSkill || actor.rage>=(skill.rageCost||4);
  const action=useSkill?skill:{name:'普通攻击',target:'one',multiplier:1};
  const targets=pickTargets(action,enemies); if(!targets.length)return {usedSkill:false,killed:false};
  let skillMultiplier=action.multiplier||1;
  if(useSkill){const e=effectOf(actor,'skillDamage');if(e)skillMultiplier*=1+e.value;}
  if(useSkill){
    const rageBurst=effectOf(actor,'rageBurst'),cost=skill.rageCost||4;
    if(rageBurst){const spent=Math.max(cost,actor.rage),extra=Math.max(0,spent-4);skillMultiplier*=1+extra*rageBurst.bonusPerExtra;actor.rage=0;}
    else actor.rage-=cost;
  }else actor.rage=Math.min(8,actor.rage+2);
  let killed=false,total=0,misses=0,crits=0;
  const pierce=effectOf(actor,'ignoreDef');
  for(const target of targets){const hit=damage(actor,target,skillMultiplier,(action.ignoreDef||0)+Number(pierce?.value||0));if(hit.miss){misses++;continue;}const wasAlive=target.alive;applyDamage(target,hit.amount,log);total+=hit.amount;if(hit.crit)crits++;const execute=effectOf(actor,'execute');if(target.alive&&execute&&target.hpNow/target.hp<=execute.threshold&&Math.random()<execute.chance){log.push(`${actor.name}的【屠龙刀】触发斩杀！`);applyDamage(target,target.hpNow,log);}const reflect=effectOf(target,'reflect');if(reflect&&actor.alive){const back=Math.round(hit.amount*reflect.ratio);if(back>0){applyDamage(actor,back,log);log.push(`${target.name}的【金丝软猬甲】反震 ${back.toLocaleString()} 伤害。`);}}if(!target.alive)tryTeamRevive(target,enemies,log);const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);const grow=effectOf(target,'afterHitAtk');if(grow&&target.alive){target.godAtkStacks=Number(target.godAtkStacks||0);if(target.godAtkStacks<grow.maxStacks){target.atk=Math.round(target.atk*(1+grow.ratio));target.godAtkStacks+=1;}}if(wasAlive&&!target.alive)killed=true;}
  log.push(`${actor.name}${useSkill?`施展【${action.name}】`:'普通攻击'}，造成 ${total.toLocaleString()} 伤害${crits?'，触发暴击':''}${misses?`，${misses}次闪避`:''}。${killed?' 有敌人倒下！':''}`);
  if(useSkill&&skill.refundOnKill&&killed)actor.rage+=skill.rageCost||4;
  const steal=effectOf(actor,'lifesteal');if(steal&&total>0&&actor.alive){const heal=Math.round(total*steal.ratio);actor.hpNow=Math.min(actor.hp,actor.hpNow+heal);log.push(`${actor.name}凭【玄铁指环】吸血 ${heal.toLocaleString()}。`);}
  if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const rageFloor=effectOf(actor,'rageFloorAfterSkill');if(rageFloor){for(const ally of living(own))ally.rage=Math.max(ally.rage,rageFloor.value);log.push(`${actor.name}悟道令己方低怒侠客补至${rageFloor.value}怒。`);}const drain=effectOf(actor,'skillDrainRage');if(drain){for(const foe of living(enemies))foe.rage=Math.max(0,foe.rage-drain.amount);log.push(`${actor.name}压制敌方怒气 -${drain.amount}。`);}const rageSupport=effectOf(actor,'rageSupport');if(rageSupport&&Math.random()<rageSupport.chance){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.rage=Math.min(8,ally.rage+rageSupport.amount);log.push(`${actor.name}的【焦尾琴】令${ally.name}怒气 +${rageSupport.amount}。`);}}if(skill.repeatChance&&living(enemies).length&&Math.random()<skill.repeatChance){performOne(actor,own,enemies,log,true);}}
  shieldAfterAction(actor,own,log);
  return {usedSkill:useSkill,killed};
}

function act(actor,own,enemies,log){
  const first=performOne(actor,own,enemies,log,false); if(!first.usedSkill)return;
  const extra=effectOf(actor,'extraAction'); if(!extra)return;
  for(let i=0;i<extra.max&&living(enemies).length;i++){
    if(Math.random()>=extra.chance)break;
    log.push(`${actor.name}触发【龙爪手】，追加出手！`);
    performOne(actor,own,enemies,log,false);
  }
}

function simulate(player,enemies,maxRounds=20){
  const log=[];
  for(let round=1;round<=maxRounds;round++){
    if(!living(player).length||!living(enemies).length)break;
    log.push(`—— 第${round}回合 ——`);
    const order=[...living(player),...living(enemies)].sort((a,b)=>b.speed-a.speed||(Math.random()-.5));
    for(const actor of order){if(!actor.alive)continue;if(actor.side==='player')act(actor,player,enemies,log);else act(actor,enemies,player,log);if(!living(player).length||!living(enemies).length)break;}
  }
  const win=living(player).length>0&&living(enemies).length===0;
  return {win,log,playerAlive:living(player).length,enemyAlive:living(enemies).length};
}

export function runChapterBattle(state){const power=chapterEnemyPower(state.player.chapter);return {...simulate(playerTeam(state),makeEnemyTeam(power,'元兵')),enemyPower:power};}
export function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:power,floor};}
export function runAncientTombBattle(state,floor,power){return {...simulate(playerTeam(state),makeEnemyTeam(power,'古墓守卫')),enemyPower:power,floor};}
