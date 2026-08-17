from pathlib import Path
import re


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:160]}')
    p.write_text(s.replace(old,new,1))

# ---------- kungfu.js：补齐11门复杂红功法的战斗效果 ----------
p=Path('src/kungfu.js'); s=p.read_text()
old="export const KUNGFU_EFFECTS={\"105001\":{\"kind\":\"extraAction\",\"chance\":[0.2,0.24,0.28,0.32,0.36,0.4,0.44,0.48,0.52,0.56],\"max\":[1,1,1,1,2,2,2,2,2,3]},\"105501\":{\"kind\":\"shieldAfterAction\",\"chance\":[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],\"ratio\":[0.12,0.16,0.2,0.24,0.28,0.32,0.36,0.4,0.44,0.48],\"duration\":[1,1,1,1,2,2,2,2,2,2],\"ally\":[0,0,0,0,0,0,0,0,0,1]},\"105601\":{\"kind\":\"rageBurst\",\"initialRage\":[2,2,2,2,3,3,3,3,3,4],\"bonusPerExtra\":[0.08,0.1,0.12,0.14,0.16,0.18,0.2,0.21,0.22,0.24]},\"105701\":{\"kind\":\"revive\",\"chance\":[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],\"healRatio\":[0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6],\"maxTriggers\":[1,1,1,1,1,2,2,2,2,3]}};"
new="""// Lv.1/Lv.10端点来自客户端；未取得逐级精确描述的中间等级采用V1平滑插值。
const kfLerp=(a,b)=>Array.from({length:10},(_,i)=>Number((a+(b-a)*i/9).toFixed(4)));
const kfRound=(a,b)=>Array.from({length:10},(_,i)=>Math.round(a+(b-a)*i/9));
export const KUNGFU_EFFECTS={
 \"105001\":{kind:\"extraAction\",chance:[.2,.24,.28,.32,.36,.4,.44,.48,.52,.56],max:[1,1,1,1,2,2,2,2,2,3]},
 \"105101\":{kind:\"turnGuard\",beforeActionDR:kfLerp(.15,.60),afterActionDR:kfLerp(0,.30),firstHitReduction:kfLerp(0,.30)},
 \"105201\":{kind:\"splashAdjacent\",chance:Array(10).fill(.50),ratio:kfLerp(.05,.50)},
 \"105301\":{kind:\"missingHpDamage\",bonusPer10:kfLerp(.01,.10)},
 \"105401\":{kind:\"selfHealAfterAction\",chance:kfLerp(.50,.60),ratio:kfLerp(.065,.20),healReceived:kfLerp(0,.20)},
 \"105501\":{kind:\"shieldAfterAction\",chance:Array(10).fill(.5),ratio:[.12,.16,.2,.24,.28,.32,.36,.4,.44,.48],duration:[1,1,1,1,2,2,2,2,2,2],ally:[0,0,0,0,0,0,0,0,0,1]},
 \"105601\":{kind:\"rageBurst\",initialRage:[2,2,2,2,3,3,3,3,3,4],bonusPerExtra:[.08,.1,.12,.14,.16,.18,.2,.21,.22,.24]},
 \"105701\":{kind:\"revive\",chance:Array(10).fill(.5),healRatio:[.15,.2,.25,.3,.35,.4,.45,.5,.55,.6],maxTriggers:[1,1,1,1,1,2,2,2,2,3]},
 \"105801\":{kind:\"damageImmunityStart\",chance:kfLerp(.20,.65),charges:kfRound(1,3),duration:Array(10).fill(2)},
 \"105901\":{kind:\"yinYangConversion\",oddAtkToDef:kfLerp(.02,.20),evenDefToAtk:kfLerp(0,.20),firstRoundBoth:[0,0,0,0,0,0,0,0,0,.20]},
 \"106001\":{kind:\"stackDRonHit\",perHit:kfLerp(.03,.05),maxStacks:kfRound(3,5),healEvery3:kfLerp(0,.15)},
 \"106101\":{kind:\"deathCurse\",targets:kfRound(1,3),hpRatio:kfLerp(.06,.20),flat:kfRound(5000,50000),atkDown:kfLerp(0,.20),duration:Array(10).fill(2)},
 \"106201\":{kind:\"assist\",chance:kfLerp(.12,.30),rageOnAssist:[0,0,0,0,0,0,0,0,0,1],skillAfterStacks:[0,0,0,0,0,0,0,0,0,3]},
 \"106301\":{kind:\"bigHitGuard\",threshold:Array(10).fill(.35),reduction:kfLerp(.25,.70),lethalReverse:[0,0,0,0,0,0,0,0,0,1],reverseHeal:Array(10).fill(.50)},
 \"106701\":{kind:\"lowHpSkillBoost\",threshold:Array(10).fill(.50),bonus:kfLerp(.075,.25),rage:[0,0,0,0,0,0,0,0,0,4]}
};"""
if old not in s: raise SystemExit('KUNGFU_EFFECTS marker missing')
s=s.replace(old,new,1); p.write_text(s)

# ---------- battle.js：让上述功法真正进入战斗 ----------
rep('src/battle.js',
"    statuses:{stun:0,silence:0,seal:0}, buddha:0, vajraGuard:0, controlDamageBonus:0,\n    rageTransferUsed:0, abnormalImmuneThroughRound:base.passive?.firstRoundAbnormalImmune?1:0 };",
"    statuses:{stun:0,silence:0,seal:0}, buddha:0, vajraGuard:0, controlDamageBonus:0,\n    rageTransferUsed:0, guardStacks:0, hitsTaken:0, damageImmuneCharges:0, damageImmuneThroughRound:0,\n    actedThisRound:false, firstHitTakenThisRound:false, yinYangAtk:0, yinYangDef:0,\n    lethalReverseUsed:0, lowHpTriggered:0, nextSkillBonus:0, assistCount:0, assistSeen:{},\n    attackDownPct:0, attackDownTurns:0, abnormalImmuneThroughRound:base.passive?.firstRoundAbnormalImmune?1:0 };")

rep('src/battle.js',
"function damage(attacker,target,multiplier=1,ignoreDef=0){\n  const hitChance=Math.max(.15,Math.min(.98,.95+Number(attacker.hit||0)/100-Number(target.dodge||0)/100));",
"function damage(attacker,target,multiplier=1,ignoreDef=0){\n  const hitChance=Math.max(.15,Math.min(.98,.95+Number(attacker.hit||0)/100-Number(target.dodge||0)/100));")
rep('src/battle.js',
"  const effectiveDef=target.def*(1-ignoreDef), base=Math.max(attacker.atk*.28,attacker.atk-effectiveDef*.56), variance=.92+Math.random()*.16;",
"  const atkNow=attacker.atk*(1-Number(attacker.attackDownPct||0)),effectiveDef=target.def*(1-ignoreDef), base=Math.max(atkNow*.28,atkNow-effectiveDef*.56), variance=.92+Math.random()*.16;")
rep('src/battle.js',
"  const reduction=Math.max(.2,1-Number(target.damageReduction||0)/100-Number(reflect?.damageReduction||0)-Number(flatDR?.value||0)/100);\n  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1)*bonus*reduction)),miss:false,crit};",
"  const turnGuard=effectOf(target,'turnGuard'),stackGuard=effectOf(target,'stackDRonHit');\n  let extraDR=Number(stackGuard?.perHit||0)*Math.min(Number(target.guardStacks||0),Number(stackGuard?.maxStacks||0));\n  if(turnGuard){extraDR+=target.actedThisRound?Number(turnGuard.afterActionDR||0):Number(turnGuard.beforeActionDR||0);if(target.actedThisRound&&!target.firstHitTakenThisRound)extraDR+=Number(turnGuard.firstHitReduction||0);}\n  const reduction=Math.max(.08,1-Number(target.damageReduction||0)/100-Number(reflect?.damageReduction||0)-Number(flatDR?.value||0)/100-extraDR);\n  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1)*bonus*reduction)),miss:false,crit};")

# 插入复杂功法辅助函数
anchor="function tryVajraGuard(attacker,target,log){\n  if(Number(target.vajraGuard||0)<=0)return false;\n  target.vajraGuard-=1;addBuddha(attacker,1,log);\n  log.push(`${target.name}的【金刚伏魔圈】护盾免疫本次直接伤害，${attacker.name}沾染1层佛性。`);return true;\n}\n"
helpers=r'''function initializeKungfuBattle(fighters,log){
  for(const f of fighters){const e=effectOf(f,'damageImmunityStart');if(e&&Math.random()<Number(e.chance||0)){f.damageImmuneCharges=Number(e.charges||1);f.damageImmuneThroughRound=Number(e.duration||2);log.push(`${f.name}触发【阿罗汉神功】，获得${f.damageImmuneCharges}次伤害免疫。`);}}
}
function tryDamageImmunity(target,round,log){if(Number(target.damageImmuneCharges||0)<=0||round>Number(target.damageImmuneThroughRound||0))return false;target.damageImmuneCharges-=1;log.push(`${target.name}的【阿罗汉神功】免疫本次伤害。`);return true;}
function adjustBigHit(target,amount,log){const e=effectOf(target,'bigHitGuard');if(!e||amount<=target.hp*Number(e.threshold||.35))return amount;if(e.lethalReverse&&!target.lethalReverseUsed&&amount>=target.hpNow){target.lethalReverseUsed=1;const heal=Math.round(amount*Number(e.reverseHeal||.5));target.hpNow=Math.min(target.hp,target.hpNow+heal);log.push(`${target.name}触发【先天功·逆转】，免疫致命伤害并转化治疗 ${heal.toLocaleString()}。`);return 0;}const reduced=Math.max(0,Math.round(amount*(1-Number(e.reduction||0))));log.push(`${target.name}触发【先天功】，大额伤害由${amount.toLocaleString()}降至${reduced.toLocaleString()}。`);return reduced;}
function afterDirectHit(target,log){target.firstHitTakenThisRound=true;const e=effectOf(target,'stackDRonHit');if(e){target.hitsTaken=Number(target.hitsTaken||0)+1;target.guardStacks=Math.min(Number(e.maxStacks||0),Number(target.guardStacks||0)+1);if(e.healEvery3&&target.hitsTaken%3===0&&target.alive){const heal=Math.round(target.hp*Number(e.healEvery3||0));target.hpNow=Math.min(target.hp,target.hpNow+heal);log.push(`${target.name}触发【金刚护体功】，受击积累减伤并恢复 ${heal.toLocaleString()} 气血。`);}}const low=effectOf(target,'lowHpSkillBoost');if(low&&!target.lowHpTriggered&&target.alive&&target.hpNow/target.hp<Number(low.threshold||.5)){target.lowHpTriggered=1;target.nextSkillBonus=Math.max(target.nextSkillBonus,Number(low.bonus||0));target.rage=Math.min(8,target.rage+Number(low.rage||0));log.push(`${target.name}触发【真武归元诀】，下次绝技增伤${Math.round(Number(low.bonus||0)*100)}%${low.rage?`并回复${low.rage}怒`:''}。`);}}
function selfHealAfterAction(actor,log){const e=effectOf(actor,'selfHealAfterAction');if(!e||Math.random()>=Number(e.chance||0)||!actor.alive)return;const heal=Math.round(actor.hp*Number(e.ratio||0));actor.hpNow=Math.min(actor.hp,actor.hpNow+heal);log.push(`${actor.name}触发【子午针灸经】，恢复 ${heal.toLocaleString()} 气血。`);}
function healReceivedMul(target){const e=effectOf(target,'selfHealAfterAction');return 1+Number(e?.healReceived||0);}
function applyYinYangRound(f,round){if(f.yinYangAtk){f.atk-=f.yinYangAtk;f.yinYangAtk=0;}if(f.yinYangDef){f.def-=f.yinYangDef;f.yinYangDef=0;}const e=effectOf(f,'yinYangConversion');if(!e)return;const baseAtk=f.atk,baseDef=f.def;if(round===1&&e.firstRoundBoth){f.yinYangDef=Math.round(baseAtk*Number(e.firstRoundBoth||0));f.yinYangAtk=Math.round(baseDef*Number(e.firstRoundBoth||0));}else if(round%2===1)f.yinYangDef=Math.round(baseAtk*Number(e.oddAtkToDef||0));else f.yinYangAtk=Math.round(baseDef*Number(e.evenDefToAtk||0));f.atk+=f.yinYangAtk;f.def+=f.yinYangDef;}
function triggerDeathCurse(dead,foes,round,log){const e=effectOf(dead,'deathCurse');if(!e||dead.alive||dead.deathCurseUsed)return;dead.deathCurseUsed=1;const targets=[...living(foes)].sort((a,b)=>b.atk-a.atk).slice(0,Number(e.targets||1));for(const t of targets){const loss=Math.min(t.hpNow,Math.round(t.hp*Number(e.hpRatio||0)+Number(e.flat||0)));t.hpNow-=loss;if(t.hpNow<=0){t.hpNow=0;t.alive=false;}if(e.atkDown){t.attackDownPct=Math.max(Number(t.attackDownPct||0),Number(e.atkDown||0));t.attackDownTurns=Math.max(Number(t.attackDownTurns||0),Number(e.duration||2));}}if(targets.length)log.push(`${dead.name}触发【天地同寿】，反噬${targets.map(x=>x.name).join('、')}。`);}
'''
if anchor not in Path('src/battle.js').read_text(): raise SystemExit('battle helper anchor missing')
rep('src/battle.js',anchor,anchor+helpers)

# 治疗吃子午针灸经的受治疗加成
rep('src/battle.js',
"function healTeam(team,source,ratio,log){if(!ratio)return;for(const ally of living(team)){const heal=Math.round(source.atk*ratio);ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);}log.push(`${source.name}为全队恢复气血。`);}",
"function healTeam(team,source,ratio,log){if(!ratio)return;for(const ally of living(team)){const heal=Math.round(source.atk*ratio*healReceivedMul(ally));ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);}log.push(`${source.name}为全队恢复气血。`);}")

# performOne：低血增伤、混元霹雳、伤害免疫/先天功/金刚护体、白蟒溅射、天地同寿
rep('src/battle.js',
"  let skillMultiplier=action.multiplier||1;\n  if(useSkill){const e=effectOf(actor,'skillDamage');if(e)skillMultiplier*=1+e.value;}",
"  let skillMultiplier=action.multiplier||1;\n  if(useSkill&&actor.nextSkillBonus){skillMultiplier*=1+Number(actor.nextSkillBonus||0);actor.nextSkillBonus=0;}\n  if(useSkill){const e=effectOf(actor,'skillDamage');if(e)skillMultiplier*=1+e.value;}")
rep('src/battle.js',
"    let targetMul=skillMultiplier;\n    if(useSkill&&actor.combat?.buddhaSkillBonusPerStack&&circleActive(own))targetMul*=1+Number(target.buddha||0)*Number(actor.combat.buddhaSkillBonusPerStack||0);",
"    let targetMul=skillMultiplier;\n    const missing=effectOf(actor,'missingHpDamage');if(missing){const steps=Math.floor(Math.max(0,1-target.hpNow/target.hp)*10);targetMul*=1+steps*Number(missing.bonusPer10||0);}\n    if(useSkill&&actor.combat?.buddhaSkillBonusPerStack&&circleActive(own))targetMul*=1+Number(target.buddha||0)*Number(actor.combat.buddhaSkillBonusPerStack||0);")
rep('src/battle.js',
"    if(tryVajraGuard(actor,target,log)){guarded++;continue;}\n    const wasAlive=target.alive,flat=useSkill?Number(action.flatDamage||0):0,amount=hit.amount+flat;applyDamage(target,amount,log);total+=amount;if(hit.crit)crits++;",
"    if(tryVajraGuard(actor,target,log)||tryDamageImmunity(target,round,log)){guarded++;continue;}\n    const wasAlive=target.alive,flat=useSkill?Number(action.flatDamage||0):0;let amount=hit.amount+flat;amount=adjustBigHit(target,amount,log);applyDamage(target,amount,log);total+=amount;if(amount>0)afterDirectHit(target,log);if(hit.crit)crits++;")
rep('src/battle.js',
"    if(!target.alive)tryTeamRevive(target,enemies,log);",
"    if(!target.alive){tryTeamRevive(target,enemies,log);if(!target.alive)triggerDeathCurse(target,own,round,log);}")

# 普攻白蟒鞭法溅射：每次主行动后取另一敌人
rep('src/battle.js',
"  if(useSkill)applySkillAbnormals(actor,targets,action,round,log);\n  log.push(`${actor.name}${useSkill?`施展【${action.name}】`:'普通攻击'}，造成 ${total.toLocaleString()} 伤害${crits?'，触发暴击':''}${misses?`，${misses}次闪避`:''}${guarded?`，${guarded}次被伏魔圈挡下`:''}。${killed?' 有敌人倒下！':''}`);",
"  if(!useSkill){const splash=effectOf(actor,'splashAdjacent');if(splash&&Math.random()<Number(splash.chance||0)){const others=living(enemies).filter(x=>!targets.includes(x));if(others.length){const t=others[Math.floor(Math.random()*others.length)],h=damage(actor,t,Number(splash.ratio||0),0);if(!h.miss&&!tryVajraGuard(actor,t,log)&&!tryDamageImmunity(t,round,log)){let a=adjustBigHit(t,h.amount,log);applyDamage(t,a,log);if(a>0)afterDirectHit(t,log);total+=a;log.push(`${actor.name}触发【白蟒鞭法】，波及${t.name} ${a.toLocaleString()}伤害。`);if(!t.alive)triggerDeathCurse(t,own,round,log);}}}}\n  if(useSkill)applySkillAbnormals(actor,targets,action,round,log);\n  log.push(`${actor.name}${useSkill?`施展【${action.name}】`:'普通攻击'}，造成 ${total.toLocaleString()} 伤害${crits?'，触发暴击':''}${misses?`，${misses}次闪避`:''}${guarded?`，${guarded}次被护盾挡下`:''}。${killed?' 有敌人倒下！':''}`);")

# 行动结束：子午针灸经
rep('src/battle.js',
"  shieldAfterAction(actor,own,log);\n  return {usedSkill:useSkill,killed};",
"  shieldAfterAction(actor,own,log);selfHealAfterAction(actor,log);\n  return {usedSkill:useSkill,killed};")

# 追魂夺命剑协同函数，插在 act 前
act_anchor="function act(actor,own,enemies,log,round){\n"
assist=r'''function triggerAssists(acted,own,enemies,log,round){
  if(!acted.alive)return;
  for(const source of living(own)){
    if(source===acted)continue;const e=effectOf(source,'assist');if(!e)continue;
    const key=`${round}:${acted.id}`;if(source.assistSeen[key])continue;source.assistSeen[key]=1;
    if(Math.random()>=Number(e.chance||0)||!living(enemies).length)continue;
    const canSkill=Number(e.skillAfterStacks||0)>0&&source.assistCount>=Number(e.skillAfterStacks||0)&&source.rage>=Number(source.skill?.rageCost||4);
    log.push(`${source.name}触发【追魂夺命剑】，协同${acted.name}出手。`);
    performOne(source,own,enemies,log,round,canSkill,!canSkill);
    if(canSkill)source.assistCount=0;else{source.assistCount+=1;if(e.rageOnAssist)source.rage=Math.min(8,source.rage+Number(e.rageOnAssist||0));}
  }
}
'''
if act_anchor not in Path('src/battle.js').read_text(): raise SystemExit('act anchor missing')
rep('src/battle.js',act_anchor,assist+act_anchor)

# act：标记行动前后，不动明王诀；攻击降低倒计时；触发协同
rep('src/battle.js',
"function act(actor,own,enemies,log,round){\n  prepareJiuyin(actor,log);",
"function act(actor,own,enemies,log,round){\n  prepareJiuyin(actor,log);")
rep('src/battle.js',
"  if(buddhaFail>0&&Math.random()<buddhaFail){log.push(`${actor.name}受${actor.buddha}层【佛性】压制，本次行动失败。`);tickControls(actor);return;}",
"  if(buddhaFail>0&&Math.random()<buddhaFail){log.push(`${actor.name}受${actor.buddha}层【佛性】压制，本次行动失败。`);actor.actedThisRound=true;tickControls(actor);return;}")
rep('src/battle.js',
"  if(Number(actor.statuses?.stun||0)>0){log.push(`${actor.name}处于【眩晕】，本次无法行动。`);tickControls(actor);return;}",
"  if(Number(actor.statuses?.stun||0)>0){log.push(`${actor.name}处于【眩晕】，本次无法行动。`);actor.actedThisRound=true;tickControls(actor);return;}")
rep('src/battle.js',
"  const first=performOne(actor,own,enemies,log,round,false,silenced||sealed);",
"  actor.actedThisRound=true;const first=performOne(actor,own,enemies,log,round,false,silenced||sealed);")
rep('src/battle.js',
"  tickControls(actor);\n}",
"  triggerAssists(actor,own,enemies,log,round);\n  tickControls(actor);if(actor.attackDownTurns>0){actor.attackDownTurns-=1;if(actor.attackDownTurns<=0)actor.attackDownPct=0;}\n}")

# simulate：战斗开始阿罗汉；每回合阴阳转换/行动标志重置
rep('src/battle.js',
"  if(circleActive(player))log.push('渡厄、渡难、渡劫齐上阵，【金刚伏魔圈】成立：佛性最高10层，每层使敌人行动失败率+10%。');\n  for(let round=1;round<=maxRounds;round++){
",
"  if(circleActive(player))log.push('渡厄、渡难、渡劫齐上阵，【金刚伏魔圈】成立：佛性最高10层，每层使敌人行动失败率+10%。');\n  initializeKungfuBattle([...player,...enemies],log);\n  for(let round=1;round<=maxRounds;round++){\n")
rep('src/battle.js',
"    for(const f of [...living(player),...living(enemies)])f.rageTransferUsed=0;",
"    for(const f of [...living(player),...living(enemies)]){f.rageTransferUsed=0;f.actedThisRound=false;f.firstHitTakenThisRound=false;applyYinYangRound(f,round);}")

# 版本号
rep('index.html','单机精简版 · V0.13','单机精简版 · V0.14')
rep('sw.js',"const CACHE = 'xinyitian-v0.13.0';","const CACHE = 'xinyitian-v0.14.0';")
