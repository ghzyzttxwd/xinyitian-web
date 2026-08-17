import fs from 'node:fs';

function patch(path, replacements) {
  let text = fs.readFileSync(path, 'utf8');
  for (const [from, to, label] of replacements) {
    if (!text.includes(from)) throw new Error(`${path}: missing patch anchor ${label}`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(path, text);
}

patch('src/innerpower.js', [
  [
    "export const INNER_POWER_MEDICINES={xingqi:{name:'行气散',minYear:0,maxYear:60,basePower:2000},yuling:{name:'玉灵散',minYear:61,maxYear:120,basePower:5000},wujue:{name:'五绝散',minYear:121,maxYear:180,basePower:10000},lingqi:{name:'灵气散',minYear:181,maxYear:240,basePower:12500},lingxian:{name:'灵仙散',minYear:241,maxYear:260,basePower:15000},juling:{name:'聚灵散',minYear:261,maxYear:280,basePower:17500}};\nexport function medicineRatio(used){const n=Number(used||0)+1;return n<=10?1.2:n<=20?1:n<=30?.8:.5;}\nexport function medicinePower(key,used){const m=INNER_POWER_MEDICINES[key];return m?Math.round(m.basePower*medicineRatio(used)):0;}",
    `// 六类内力散数值来自已确认客户端资料；其余聚气丹/属性丹缺少完整原版精确数值，V0.17按单机V1暂定值实现。\nexport const INNER_POWER_MEDICINES={\n  xingqi:{name:'行气散',kind:'power',minYear:0,maxYear:60,basePower:2000},\n  yuling:{name:'玉灵散',kind:'power',minYear:61,maxYear:120,basePower:5000},\n  wujue:{name:'五绝散',kind:'power',minYear:121,maxYear:180,basePower:10000},\n  lingqi:{name:'灵气散',kind:'power',minYear:181,maxYear:240,basePower:12500},\n  lingxian:{name:'灵仙散',kind:'power',minYear:241,maxYear:260,basePower:15000},\n  juling:{name:'聚灵散',kind:'power',minYear:261,maxYear:280,basePower:17500},\n  juqi:{name:'聚气丹',kind:'power',minYear:0,maxYear:279,basePower:6000,v1:true},\n  qiangjin:{name:'强筋丸',kind:'stat',minYear:60,maxYear:280,maxUses:20,stat:'flatAtk',value:400,v1:true},\n  tongpi:{name:'铜皮丹',kind:'stat',minYear:60,maxYear:280,maxUses:20,stat:'flatDef',value:400,v1:true},\n  huoxue:{name:'活血膏',kind:'stat',minYear:60,maxYear:280,maxUses:20,stat:'flatHp',value:2400,v1:true},\n  atkdan:{name:'高级攻击丹',kind:'stat',minYear:140,maxYear:280,maxUses:20,stat:'atkPct',value:.5,v1:true},\n  defdan:{name:'高级防御丹',kind:'stat',minYear:140,maxYear:280,maxUses:20,stat:'defPct',value:.5,v1:true},\n  hpdan:{name:'高级气血丹',kind:'stat',minYear:140,maxYear:280,maxUses:20,stat:'hpPct',value:.5,v1:true},\n  critdan:{name:'高级暴击丹',kind:'stat',minYear:200,maxYear:280,maxUses:20,stat:'crit',value:.5,v1:true},\n  hitdan:{name:'高级命中丹',kind:'stat',minYear:200,maxYear:280,maxUses:20,stat:'hit',value:.5,v1:true},\n  dodgedan:{name:'高级闪避丹',kind:'stat',minYear:200,maxYear:280,maxUses:20,stat:'dodge',value:.5,v1:true},\n  anticritdan:{name:'高级抗暴丹',kind:'stat',minYear:200,maxYear:280,maxUses:20,stat:'antiCrit',value:.5,v1:true},\n};\nexport const INNER_POWER_SHOP={\n  juqi:{price:500},qiangjin:{price:800},tongpi:{price:800},huoxue:{price:800},\n  atkdan:{price:1500},defdan:{price:1500},hpdan:{price:1500},\n  critdan:{price:1800},hitdan:{price:1800},dodgedan:{price:1800},anticritdan:{price:1800},\n};\nconst STAT_LABELS={flatAtk:'攻击',flatDef:'防御',flatHp:'气血',atkPct:'攻击',defPct:'防御',hpPct:'气血',crit:'暴击',hit:'命中',dodge:'闪避',antiCrit:'抗暴'};\nexport function medicineRatio(used){const n=Number(used||0)+1;return n<=10?1.2:n<=20?1:n<=30?.8:.5;}\nexport function medicinePower(key,used){const m=INNER_POWER_MEDICINES[key];return m?.kind==='power'?Math.round(Number(m.basePower||0)*medicineRatio(used)):0;}\nexport function innerMedicineEffectText(key,used=0){const m=INNER_POWER_MEDICINES[key];if(!m)return '';if(m.kind==='power')return \`本次 +\${medicinePower(key,used).toLocaleString('zh-CN')}内力\`;const suffix=['atkPct','defPct','hpPct','crit','hit','dodge','antiCrit'].includes(m.stat)?'%':'';return \`永久\${STAT_LABELS[m.stat]||'属性'} +\${m.value}\${suffix} · 已服用\${Number(used||0)}/\${m.maxUses}\`;}`,
    'inner medicine config'
  ],
  [
    "4806542:['破军','被暴击后，下次出手伤害加成+8%',{}],4806543:['化禄','每回合首次被暴击时回复队友',{}],4806544:['巨门','每回合首次被暴击时获得护盾',{}],4806545:['七杀','闪避后下次出手伤害加成+12%',{}],4806546:['廉贞','首次闪避时回复队友',{}],4806547:['天相','首次闪避时获得护盾',{}],4806549:['破镜','被施加异常后下次出手增伤',{}],4806550:['沐雨','首次被施加异常时回复队友',{}],4806551:['天佑','首次被施加异常时获得护盾',{}]",
    "4806542:['破军','被暴击后，下次出手伤害加成+8%',{battleEffect:{kind:'innerReaction',event:'critTaken',mode:'nextDamage',value:.08,oncePerRound:true}}],4806543:['化禄','每回合首次被暴击时回复队友（V1：6%最大气血）',{battleEffect:{kind:'innerReaction',event:'critTaken',mode:'heal',value:.06,oncePerRound:true,v1:true}}],4806544:['巨门','每回合首次被暴击时获得护盾（V1：8%最大气血）',{battleEffect:{kind:'innerReaction',event:'critTaken',mode:'shield',value:.08,oncePerRound:true,v1:true}}],4806545:['七杀','闪避后下次出手伤害加成+12%',{battleEffect:{kind:'innerReaction',event:'dodge',mode:'nextDamage',value:.12,oncePerRound:true}}],4806546:['廉贞','首次闪避时回复队友（V1：8%最大气血）',{battleEffect:{kind:'innerReaction',event:'dodge',mode:'heal',value:.08,oncePerRound:true,v1:true}}],4806547:['天相','首次闪避时获得护盾（V1：10%最大气血）',{battleEffect:{kind:'innerReaction',event:'dodge',mode:'shield',value:.10,oncePerRound:true,v1:true}}],4806549:['破镜','被施加异常后下次出手增伤（V1：15%）',{battleEffect:{kind:'innerReaction',event:'abnormal',mode:'nextDamage',value:.15,oncePerRound:true,v1:true}}],4806550:['沐雨','首次被施加异常时回复队友（V1：10%最大气血）',{battleEffect:{kind:'innerReaction',event:'abnormal',mode:'heal',value:.10,oncePerRound:true,v1:true}}],4806551:['天佑','首次被施加异常时获得护盾（V1：12%最大气血）',{battleEffect:{kind:'innerReaction',event:'abnormal',mode:'shield',value:.12,oncePerRound:true,v1:true}}]",
    'reaction milestone effects'
  ],
  [
    "4806560:['暴怒','爆伤减免+5%',{}],4806561:['暴怒','爆伤减免+3%',{}],4806562:['聚势','首次获得增益后下次出手增伤',{}],4806563:['应援','首次获得增益后回复队友',{}],4806564:['振奋','首次获得增益后获得护盾',{}],4806565:['狂暴','暴击伤害+5%',{}],4806566:['狂暴','暴击伤害+3%',{}]",
    "4806560:['暴怒','爆伤减免+5%',{critDamageReduction:5}],4806561:['暴怒','爆伤减免+3%',{critDamageReduction:3}],4806562:['聚势','首次获得增益后下次出手增伤（V1：15%）',{battleEffect:{kind:'innerReaction',event:'buff',mode:'nextDamage',value:.15,oncePerRound:true,v1:true}}],4806563:['应援','首次获得增益后回复队友（V1：10%最大气血）',{battleEffect:{kind:'innerReaction',event:'buff',mode:'heal',value:.10,oncePerRound:true,v1:true}}],4806564:['振奋','首次获得增益后获得护盾（V1：12%最大气血）',{battleEffect:{kind:'innerReaction',event:'buff',mode:'shield',value:.12,oncePerRound:true,v1:true}}],4806565:['狂暴','暴击伤害+5%',{critDamage:5}],4806566:['狂暴','暴击伤害+3%',{critDamage:3}]",
    'crit and buff milestone effects'
  ],
  [
    "export function innerPowerBonuses(heroId,years,talent=0){const o={flatAtk:0,flatDef:0,flatHp:0,atkPct:0,defPct:0,hpPct:0,hit:0,dodge:0,crit:0,antiCrit:0,damageBonus:0,damageReduction:0,initialRage:0};for(const r of innerPowerMilestones(heroId)){if(r.year>Number(years||0))break;o.flatAtk+=Number(r.flatAtk||0)+Number(r.talentAtk||0)*talent;o.flatDef+=Number(r.flatDef||0)+Number(r.talentDef||0)*talent;o.flatHp+=Number(r.flatHp||0)+Number(r.talentHp||0)*talent;for(const k of['atkPct','defPct','hpPct','hit','dodge','crit','antiCrit','damageBonus','damageReduction','initialRage'])o[k]+=Number(r[k]||0);}return o;}\nexport function createInnerPowerHeroState()",
    "export function innerPowerBonuses(heroId,ipOrYears,talent=0){const ip=typeof ipOrYears==='object'&&ipOrYears?ipOrYears:null,years=ip?Number(ip.year||0):Number(ipOrYears||0),used=ip?.medicineUsed||{};const o={flatAtk:0,flatDef:0,flatHp:0,atkPct:0,defPct:0,hpPct:0,hit:0,dodge:0,crit:0,antiCrit:0,damageBonus:0,damageReduction:0,initialRage:0,critDamage:0,critDamageReduction:0};for(const r of innerPowerMilestones(heroId)){if(r.year>years)break;o.flatAtk+=Number(r.flatAtk||0)+Number(r.talentAtk||0)*talent;o.flatDef+=Number(r.flatDef||0)+Number(r.talentDef||0)*talent;o.flatHp+=Number(r.flatHp||0)+Number(r.talentHp||0)*talent;for(const k of['atkPct','defPct','hpPct','hit','dodge','crit','antiCrit','damageBonus','damageReduction','initialRage','critDamage','critDamageReduction'])o[k]+=Number(r[k]||0);}for(const [key,m] of Object.entries(INNER_POWER_MEDICINES)){if(m.kind!=='stat')continue;const count=Math.min(Number(m.maxUses||0),Math.max(0,Number(used[key]||0)));if(!count)continue;o[m.stat]=Number(o[m.stat]||0)+count*Number(m.value||0);}return o;}\nexport function innerPowerBattleEffects(heroId,years){return innerPowerMilestones(heroId).filter(r=>r.year<=Number(years||0)&&r.battleEffect).map(r=>({...r.battleEffect,label:r.name,year:r.year}));}\nexport function createInnerPowerHeroState()",
    'inner bonus and battle effects'
  ],
]);

patch('src/state.js', [
  [
    "items:{xingqi:0,yuling:0,wujue:0,lingqi:0,lingxian:0,juling:0,dingshen:0},",
    "items:{xingqi:0,yuling:0,wujue:0,lingqi:0,lingxian:0,juling:0,juqi:0,dingshen:0,qiangjin:0,tongpi:0,huoxue:0,atkdan:0,defdan:0,hpdan:0,critdan:0,hitdan:0,dodgedan:0,anticritdan:0},",
    'inner item defaults'
  ],
  [
    "const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);",
    "const ip = innerPowerBonuses(heroId,h.innerPower,meridian.talent||0);",
    'inner bonus state input'
  ],
  [
    "damageBonus:ip.damageBonus+wd.damageBonus, damageReduction:ip.damageReduction+wd.damageReduction, initialRage:ip.initialRage,",
    "damageBonus:ip.damageBonus+wd.damageBonus, damageReduction:ip.damageReduction+wd.damageReduction, initialRage:ip.initialRage, critDamage:ip.critDamage, critDamageReduction:ip.critDamageReduction,",
    'crit damage stats'
  ],
]);

patch('src/ancienttomb.js', [
  [
    "export function rollAncientTombReward(floor,{firstClear=false}={}){",
    `function v1InnerItemsForFloor(floor,firstClear){\n  const f=Number(floor)||1,out={};\n  // 聚气丹/属性丹的原版完整投放数值未查到，以下为单机V1常驻迁移。\n  if(f>=50)out.juqi=1+(f>=250?1:0)+(f>=400?1:0);\n  if(firstClear&&f%25===0){\n    let pool=f<150?['qiangjin','tongpi','huoxue']:f<250?['atkdan','defdan','hpdan']:['critdan','hitdan','dodgedan','anticritdan','atkdan','defdan','hpdan'];\n    out[pool[(Math.floor(f/25)-1)%pool.length]]=1;\n  }\n  return out;\n}\n\nexport function rollAncientTombReward(floor,{firstClear=false}={}){`,
    'ancient inner item helper'
  ],
  [
    "wudaoPills:firstClear&&f>=200&&f%50===0 ? 15+Math.floor((f-200)/50)*5 : 0,",
    "wudaoPills:firstClear&&f>=200&&f%50===0 ? 15+Math.floor((f-200)/50)*5 : 0,\n    innerItems:v1InnerItemsForFloor(f,firstClear),",
    'ancient inner item reward'
  ],
]);

patch('src/battle.js', [
  [
    "import { storyHeroProfile, storyBattleEffects } from './story.js';",
    "import { storyHeroProfile, storyBattleEffects } from './story.js';\nimport { innerPowerBattleEffects } from './innerpower.js';",
    'inner battle import'
  ],
  [
    "out.push(...storyBattleEffects(state,heroId));\n  return out;",
    "out.push(...storyBattleEffects(state,heroId));\n  out.push(...innerPowerBattleEffects(heroId,h?.innerPower?.year||0));\n  return out;",
    'inner battle effects append'
  ],
  [
    "lethalReverseUsed:0, lowHpTriggered:0, nextSkillBonus:0, assistCount:0, assistSeen:{},",
    "lethalReverseUsed:0, lowHpTriggered:0, nextSkillBonus:0, innerNextDamageBonus:0, innerReactionRound:{}, assistCount:0, assistSeen:{},",
    'fighter inner reaction state'
  ],
  [
    "const crit=Math.random()<critChance;\n  const bonus=1+Number(attacker.damageBonus||0)/100+Number(attacker.controlDamageBonus||0),reflect=effectOf(target,'reflect'),flatDR=effectOf(target,'damageReduction');",
    "const crit=Math.random()<critChance,critMul=Math.max(1.05,1.5+Number(attacker.critDamage||0)/100-Number(target.critDamageReduction||0)/100);\n  const bonus=1+Number(attacker.damageBonus||0)/100+Number(attacker.controlDamageBonus||0),reflect=effectOf(target,'reflect'),flatDR=effectOf(target,'damageReduction');",
    'crit multiplier'
  ],
  [
    "return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1)*bonus*reduction)),miss:false,crit};",
    "return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?critMul:1)*bonus*reduction)),miss:false,crit};",
    'crit multiplier use'
  ],
  [
    "function applyAbnormal(target,type,duration,round,log,source=''){ \n  if(!CONTROL_TYPES.includes(type)||!target.alive)return false;\n  if(Number(target.abnormalImmuneThroughRound||0)>=round){log.push(`${target.name}免疫${CONTROL_NAMES[type]}${source?`（${source}）`:''}。`);return false;}\n  target.statuses[type]=Math.max(Number(target.statuses[type]||0),Math.max(1,Number(duration)||1));\n  log.push(`${target.name}陷入【${CONTROL_NAMES[type]}】${target.statuses[type]}次行动。`);return true;\n}",
    "function applyAbnormal(target,type,duration,round,log,source='',targetTeam=[]){ \n  if(!CONTROL_TYPES.includes(type)||!target.alive)return false;\n  if(Number(target.abnormalImmuneThroughRound||0)>=round){log.push(`${target.name}免疫${CONTROL_NAMES[type]}${source?`（${source}）`:''}。`);return false;}\n  target.statuses[type]=Math.max(Number(target.statuses[type]||0),Math.max(1,Number(duration)||1));\n  log.push(`${target.name}陷入【${CONTROL_NAMES[type]}】${target.statuses[type]}次行动。`);triggerInnerReaction(target,'abnormal',targetTeam,round,log);return true;\n}",
    'abnormal reaction hook'
  ],
  [
    "function tryVajraGuard(attacker,target,log){",
    `function triggerInnerReaction(target,event,team,round,log){\n  if(!target?.alive)return;\n  for(const e of (target.effects||[]).filter(x=>x.kind==='innerReaction'&&x.event===event)){\n    const key=\`${event}:\${e.label||''}\`;if(e.oncePerRound&&target.innerReactionRound?.[key]===round)continue;\n    target.innerReactionRound=target.innerReactionRound||{};target.innerReactionRound[key]=round;\n    if(e.mode==='nextDamage'){target.innerNextDamageBonus=Math.max(Number(target.innerNextDamageBonus||0),Number(e.value||0));log.push(\`${target.name}触发【\${e.label}】，下次出手伤害提高\${Math.round(Number(e.value||0)*100)}%。\`);}\n    else if(e.mode==='heal'){const allies=living(team).filter(x=>x.alive);if(allies.length){const ally=[...allies].sort((a,b)=>a.hpNow/a.hp-b.hpNow/b.hp)[0],heal=Math.max(1,Math.round(ally.hp*Number(e.value||0)));ally.hpNow=Math.min(ally.hp,ally.hpNow+heal);log.push(\`${target.name}触发【\${e.label}】，为\${ally.name}恢复 \${heal.toLocaleString()} 气血。\`);}}\n    else if(e.mode==='shield'){const shield=Math.max(1,Math.round(target.hp*Number(e.value||0)));target.shield+=shield;log.push(\`${target.name}触发【\${e.label}】，获得 \${shield.toLocaleString()} 护盾。\`);}\n  }\n}\nfunction triggerInnerBuff(target,team,round,log){triggerInnerReaction(target,'buff',team,round,log);}\n\nfunction tryVajraGuard(attacker,target,log){`,
    'inner reaction helper'
  ],
  [
    "function teamRage(team,amount,source,log){if(!amount)return;for(const ally of living(team))ally.rage=Math.min(8,ally.rage+amount);log.push(`${source.name}令己方全体怒气 +${amount}。`);}\nfunction shieldAfterAction(actor,own,log){",
    "function teamRage(team,amount,source,log,round){if(!amount)return;for(const ally of living(team)){ally.rage=Math.min(8,ally.rage+amount);triggerInnerBuff(ally,team,round,log);}log.push(`${source.name}令己方全体怒气 +${amount}。`);}\nfunction shieldAfterAction(actor,own,log,round){",
    'buff hook signatures'
  ],
  [
    "actor.shield+=Math.round(actor.hp*e.ratio);log.push(`${actor.name}触发【九阳真经】，获得${Math.round(e.ratio*100)}%最大气血护盾。`);\n  if(e.ally){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.shield+=Math.round(ally.hp*e.ratio);log.push(`${ally.name}同时获得九阳护盾。`);}}",
    "actor.shield+=Math.round(actor.hp*e.ratio);triggerInnerBuff(actor,own,round,log);log.push(`${actor.name}触发【九阳真经】，获得${Math.round(e.ratio*100)}%最大气血护盾。`);\n  if(e.ally){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.shield+=Math.round(ally.hp*e.ratio);triggerInnerBuff(ally,own,round,log);log.push(`${ally.name}同时获得九阳护盾。`);}}",
    'shield buff hook'
  ],
  [
    "function applySkillAbnormals(actor,targets,action,round,log){\n  if(!Array.isArray(action.abnormal))return;\n  for(const target of targets)for(const a of action.abnormal){if(target.alive&&Math.random()<Number(a.chance||0))applyAbnormal(target,a.type,a.duration,round,log,actor.name);}\n}",
    "function applySkillAbnormals(actor,targets,targetTeam,action,round,log){\n  if(!Array.isArray(action.abnormal))return;\n  for(const target of targets)for(const a of action.abnormal){if(target.alive&&Math.random()<Number(a.chance||0))applyAbnormal(target,a.type,a.duration,round,log,actor.name,targetTeam);}\n}",
    'skill abnormal team'
  ],
  [
    "let skillMultiplier=action.multiplier||1;\n  if(useSkill&&actor.nextSkillBonus){skillMultiplier*=1+Number(actor.nextSkillBonus||0);actor.nextSkillBonus=0;}",
    "let skillMultiplier=action.multiplier||1;\n  if(useSkill&&actor.nextSkillBonus){skillMultiplier*=1+Number(actor.nextSkillBonus||0);actor.nextSkillBonus=0;}\n  if(actor.innerNextDamageBonus){skillMultiplier*=1+Number(actor.innerNextDamageBonus||0);actor.innerNextDamageBonus=0;}",
    'next action damage'
  ],
  [
    "const hit=damage(actor,target,targetMul,(action.ignoreDef||0)+Number(pierce?.value||0));if(hit.miss){misses++;continue;}",
    "const hit=damage(actor,target,targetMul,(action.ignoreDef||0)+Number(pierce?.value||0));if(hit.miss){misses++;triggerInnerReaction(target,'dodge',enemies,round,log);continue;}",
    'dodge reaction'
  ],
  [
    "applyDamage(target,amount,log);total+=amount;if(amount>0)afterDirectHit(target,log);if(hit.crit)crits++;",
    "applyDamage(target,amount,log);total+=amount;if(amount>0)afterDirectHit(target,log);if(hit.crit){crits++;if(target.alive)triggerInnerReaction(target,'critTaken',enemies,round,log);}",
    'crit taken reaction'
  ],
  [
    "if(useSkill)applySkillAbnormals(actor,targets,action,round,log);",
    "if(useSkill)applySkillAbnormals(actor,targets,enemies,action,round,log);",
    'abnormal call'
  ],
  [
    "teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);",
    "teamRage(own,skill.teamRage||0,actor,log,round);healTeam(own,actor,skill.healTeam||0,log);",
    'team rage round'
  ],
  [
    "const rageFloor=effectOf(actor,'rageFloorAfterSkill');if(rageFloor){for(const ally of living(own))ally.rage=Math.max(ally.rage,rageFloor.value);log.push(`${actor.name}悟道令己方低怒侠客补至${rageFloor.value}怒。`);}",
    "const rageFloor=effectOf(actor,'rageFloorAfterSkill');if(rageFloor){for(const ally of living(own)){const before=ally.rage;ally.rage=Math.max(ally.rage,rageFloor.value);if(ally.rage>before)triggerInnerBuff(ally,own,round,log);}log.push(`${actor.name}悟道令己方低怒侠客补至${rageFloor.value}怒。`);}",
    'rage floor buff'
  ],
  [
    "shieldAfterAction(actor,own,log);selfHealAfterAction(actor,log);",
    "shieldAfterAction(actor,own,log,round);selfHealAfterAction(actor,log);",
    'shield round call'
  ],
]);

patch('src/app.js', [
  [
    "INNER_POWER_MEDICINES, powerRequiredForYear, breakthroughInfo, calmingPillRateBonus,\n  medicinePower, medicineRatio, innerPowerMilestones, advanceInnerPower, readyBreakthroughYear,",
    "INNER_POWER_MEDICINES, INNER_POWER_SHOP, powerRequiredForYear, breakthroughInfo, calmingPillRateBonus,\n  medicinePower, medicineRatio, innerMedicineEffectText, innerPowerMilestones, advanceInnerPower, readyBreakthroughYear,",
    'inner imports'
  ],
  [
    "const meds=Object.entries(INNER_POWER_MEDICINES).map(([key,m])=>{const count=Number(state.innerPower?.items?.[key]||0),used=Number(ip.medicineUsed?.[key]||0),ratio=Math.round(medicineRatio(used)*100),gain=medicinePower(key,used),inRange=ip.year>=m.minYear&&ip.year<=m.maxYear&&!maxed;return `<div class=\"hero-card ${inRange&&count?'':'locked'}\"><div class=\"hero-card-row\"><div><div class=\"hero-name\">${m.name} ×${fmt(count)}</div><div class=\"hero-meta\">适用 ${m.minYear}～${m.maxYear}年 · 本次 +${fmt(gain)}内力（${ratio}%）</div><div class=\"hero-meta\">本阶段已服用 ${used} 次</div></div><button class=\"btn\" data-inner-medicine=\"${key}\" ${inRange&&count?'':'disabled'}>服用</button></div></div>`;}).join('');",
    "const meds=Object.entries(INNER_POWER_MEDICINES).map(([key,m])=>{const count=Number(state.innerPower?.items?.[key]||0),used=Number(ip.medicineUsed?.[key]||0),ratio=Math.round(medicineRatio(used)*100),atCap=m.maxUses&&used>=m.maxUses,inRange=ip.year>=m.minYear&&ip.year<=m.maxYear&&!(m.kind==='power'&&maxed)&&!atCap;const effect=m.kind==='power'?`${innerMedicineEffectText(key,used)}（${ratio}%）`:innerMedicineEffectText(key,used);return `<div class=\"hero-card ${inRange&&count?'':'locked'}\"><div class=\"hero-card-row\"><div><div class=\"hero-name\">${m.name} ×${fmt(count)}${m.v1?' <span class=\"tag\">V1暂定</span>':''}</div><div class=\"hero-meta\">适用 ${m.minYear}～${m.maxYear}年 · ${effect}</div></div><button class=\"btn\" data-inner-medicine=\"${key}\" ${inRange&&count?'':'disabled'}>服用</button></div></div>`;}).join('');\n const innerShop=Object.entries(INNER_POWER_SHOP).map(([key,cfg])=>{const m=INNER_POWER_MEDICINES[key],open=ip.year>=m.minYear,price=Number(cfg.price||0);return `<div class=\"list-row\"><span>${m.name} <small>V1常驻迁移</small></span><button class=\"btn\" data-buy-inner=\"${key}\" ${open&&state.player.gems>=price?'':'disabled'}>${fmt(price)}元宝</button></div>`;}).join('');",
    'inner medicine cards'
  ],
  [
    "<section class=\"card\"><div class=\"section-title\"><h3>内力丹药</h3><small>同类连续服用收益递减</small></div><div class=\"hero-list\">${meds}</div><div class=\"hero-meta\" style=\"margin-top:8px\">丹药、定神丸的稳定产出后续由古墓/炼丹/礼包接入；这里不额外造商店。</div></section>`;",
    "<section class=\"card\"><div class=\"section-title\"><h3>内力丹药</h3><small>内力散递减 · 属性丹有上限</small></div><div class=\"hero-list\">${meds}</div><div class=\"hero-meta\" style=\"margin-top:8px\">六类内力散沿用已确认数据；聚气丹、属性丹数值与投放为单机V1暂定，古墓为主产地，千宝塔节点与常驻元宝补充。</div></section><section class=\"card\"><div class=\"section-title\"><h3>内力常驻补给</h3><small>元宝迁移渠道</small></div>${innerShop}</section>`;",
    'inner shop panel'
  ],
  [
    "function useInnerMedicine(key){ensureGrowthHero();const m=INNER_POWER_MEDICINES[key],h=state.heroes[selectedGrowthHero],ip=h?.innerPower;if(!m||!ip)return;const count=Number(state.innerPower?.items?.[key]||0);if(count<=0)return alert(`${m.name}不足。`);if(ip.year<m.minYear||ip.year>m.maxYear)return alert(`${m.name}仅适用于${m.minYear}～${m.maxYear}年。`);if(ip.year>=INNER_POWER_MAX_YEAR)return alert('内力已经达到280年上限。');const used=Number(ip.medicineUsed?.[key]||0),gain=medicinePower(key,used);state.innerPower.items[key]-=1;ip.medicineUsed[key]=used+1;ip.power=Number(ip.power||0)+gain;advanceInnerPower(ip);bumpDaily(state,'inner');commit();alert(`${HEROES[selectedGrowthHero].name}服用${m.name}，内力 +${fmt(gain)}。`);}",
    "function useInnerMedicine(key){ensureGrowthHero();const m=INNER_POWER_MEDICINES[key],h=state.heroes[selectedGrowthHero],ip=h?.innerPower;if(!m||!ip)return;const count=Number(state.innerPower?.items?.[key]||0);if(count<=0)return alert(`${m.name}不足。`);if(ip.year<m.minYear||ip.year>m.maxYear)return alert(`${m.name}仅适用于${m.minYear}～${m.maxYear}年。`);if(m.kind==='power'&&ip.year>=INNER_POWER_MAX_YEAR)return alert('内力已经达到280年上限。');const used=Number(ip.medicineUsed?.[key]||0);if(m.maxUses&&used>=m.maxUses)return alert(`${m.name}已达到单侠客服用上限${m.maxUses}次。`);const gain=medicinePower(key,used);state.innerPower.items[key]-=1;ip.medicineUsed[key]=used+1;if(gain){ip.power=Number(ip.power||0)+gain;advanceInnerPower(ip);}bumpDaily(state,'inner');const text=m.kind==='power'?`内力 +${fmt(gain)}`:innerMedicineEffectText(key,used+1);commit();alert(`${HEROES[selectedGrowthHero].name}服用${m.name}：${text}。`);}\nfunction buyInnerItem(key){const m=INNER_POWER_MEDICINES[key],cfg=INNER_POWER_SHOP[key];if(!m||!cfg)return;ensureGrowthHero();const ip=state.heroes[selectedGrowthHero]?.innerPower;if(!ip||ip.year<m.minYear)return alert(`${m.name}需要内力达到${m.minYear}年后购买。`);const price=Number(cfg.price||0);if(state.player.gems<price)return alert(`元宝不足，需要${price}。`);state.player.gems-=price;state.innerPower.items[key]=Number(state.innerPower.items[key]||0)+1;commit();}",
    'medicine use and shop function'
  ],
  [
    "if(r.wudaoPills){state.wudao.pills=Number(state.wudao.pills||0)+r.wudaoPills;parts.push(`悟道丹 +${r.wudaoPills}`);}const specialPack=tombSpecialChoicePack(floor,firstClear);",
    "if(r.wudaoPills){state.wudao.pills=Number(state.wudao.pills||0)+r.wudaoPills;parts.push(`悟道丹 +${r.wudaoPills}`);}for(const [key,count] of Object.entries(r.innerItems||{})){state.innerPower.items[key]=Number(state.innerPower.items[key]||0)+count;parts.push(`${INNER_POWER_MEDICINES[key]?.name||key} +${count}`);}const specialPack=tombSpecialChoicePack(floor,firstClear);",
    'ancient reward apply'
  ],
  [
    "<div class=\"notice\" style=\"margin-top:10px\">六人单机挑战。主要产出内力药材、内力散、定神丸；30/50/100...450层首次到达可获得鸳鸯刀。</div>",
    "<div class=\"notice\" style=\"margin-top:10px\">六人单机挑战。主要产出内力药材、内力散、聚气丹与属性丹；30/50/100...450层首次到达可获得鸳鸯刀。聚气丹/属性丹投放为单机V1暂定值。</div>",
    'ancient card note'
  ],
  [
    "if(result.floor%100===0){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+1;}const wudaoGain=",
    "if(result.floor%100===0){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+1;state.innerPower.items.juqi=Number(state.innerPower.items.juqi||0)+1;}const v1TowerAttr=result.floor%250===0?['qiangjin','tongpi','huoxue','atkdan','defdan','hpdan','critdan','hitdan','dodgedan','anticritdan'][Math.floor(result.floor/250-1)%10]:'';if(v1TowerAttr)state.innerPower.items[v1TowerAttr]=Number(state.innerPower.items[v1TowerAttr]||0)+1;const wudaoGain=",
    'tower inner item grants'
  ],
  [
    "if(result.floor%100===0)reward+=` · 神品魂石自选箱 +1`;if(wudaoGain)",
    "if(result.floor%100===0)reward+=` · 神品魂石自选箱 +1 · 聚气丹 +1`;if(v1TowerAttr)reward+=` · ${INNER_POWER_MEDICINES[v1TowerAttr].name} +1`;if(wudaoGain)",
    'tower inner item reward text'
  ],
  [
    "if(btn.dataset.innerMedicine){useInnerMedicine(btn.dataset.innerMedicine);return;}if(btn.dataset.recharge)",
    "if(btn.dataset.innerMedicine){useInnerMedicine(btn.dataset.innerMedicine);return;}if(btn.dataset.buyInner){buyInnerItem(btn.dataset.buyInner);return;}if(btn.dataset.recharge)",
    'inner shop click handler'
  ],
]);

// One-shot artifacts remove themselves before the patch commit.
fs.rmSync('scripts/v017-patch.mjs', {force:true});
fs.rmSync('.github/workflows/v017-one-shot.yml', {force:true});
console.log('V0.17 patch applied; one-shot files removed.');
