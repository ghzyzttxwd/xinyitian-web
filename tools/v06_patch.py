from pathlib import Path


def rep(path, old, new):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:100]}')
    p.write_text(s.replace(old, new, 1))


# state.js
rep('src/state.js',
    "import { createInnerPowerHeroState, innerPowerBonuses, INNER_POWER_PER_MINUTE, advanceInnerPower } from './innerpower.js';",
    "import { createInnerPowerHeroState, innerPowerBonuses, INNER_POWER_PER_MINUTE, advanceInnerPower } from './innerpower.js';\nimport { createWeaponState, equippedWeaponBonuses } from './weapons.js';")
rep('src/state.js',
    "    innerPower: createInnerPowerHeroState(),\n  };",
    "    innerPower: createInnerPowerHeroState(),\n    weapons: {weapon:null,armor:null,accessory:null,treasure:null},\n  };")
rep('src/state.js',
    "    innerPower:createInnerPowerState(),\n    recharge:",
    "    innerPower:createInnerPowerState(),\n    weapons:createWeaponState(),\n    recharge:")
rep('src/state.js',
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);\n  const rawAtk=tpl.base.atk*growth+Number(meridian.atk||0)+k.atk+ip.flatAtk;\n  const rawDef=tpl.base.def*growth+Number(meridian.def||0)+k.def+ip.flatDef;\n  const rawHp=tpl.base.hp*growth+Number(meridian.hp||0)+k.hp+ip.flatHp;",
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);\n  const rawAtk=tpl.base.atk*growth+Number(meridian.atk||0)+k.atk+ip.flatAtk+w.atk;\n  const rawDef=tpl.base.def*growth+Number(meridian.def||0)+k.def+ip.flatDef+w.def;\n  const rawHp=tpl.base.hp*growth+Number(meridian.hp||0)+k.hp+ip.flatHp+w.hp;")
rep('src/state.js',
    "  const k = heroKungfuBonuses(state, heroId);\n  return Math.round(s.atk*4.6 + s.def*3.5 + s.hp*.7 + s.speed*6 + (s.hit+s.dodge+s.crit+s.antiCrit+s.damageBonus+s.damageReduction)*1200 + k.power);",
    "  const k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);\n  return Math.round(s.atk*4.6 + s.def*3.5 + s.hp*.7 + s.speed*6 + (s.hit+s.dodge+s.crit+s.antiCrit+s.damageBonus+s.damageReduction)*1200 + k.power + w.power);")

# battle.js
rep('src/battle.js',
    "import { RED_KUNGFU, DIVINE_KUNGFU, effectAtLevel } from './kungfu.js';",
    "import { RED_KUNGFU, DIVINE_KUNGFU, effectAtLevel } from './kungfu.js';\nimport { weaponBattleEffects } from './weapons.js';")
rep('src/battle.js',
    "  return out;\n}\n\nfunction effectOf(fighter,kind)",
    "  out.push(...weaponBattleEffects(state,heroId));\n  return out;\n}\n\nfunction effectOf(fighter,kind)")
rep('src/battle.js',
    "function playerTeam(state) {\n  return state.party.filter(Boolean).map(id=>{\n    const tpl=HEROES[id], s=heroStats(state,id), effects=effectsForHero(state,id);\n    const rageEffect=effects.find(x=>x.kind==='rageBurst');\n    return cloneFighter({ id,name:tpl.name,side:'player',...s,skill:tpl.skill,effects,initialRage:rageEffect?.initialRage||0 });\n  });\n}",
    "function playerTeam(state) {\n  const team=state.party.filter(Boolean).map(id=>{\n    const tpl=HEROES[id], s=heroStats(state,id), effects=effectsForHero(state,id);\n    const rageEffect=effects.find(x=>x.kind==='rageBurst'),dodgeStart=effects.find(x=>x.kind==='dodgeStart');\n    return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });\n  });\n  const maxAtk=Math.max(0,...team.map(x=>x.atk));\n  for(const f of team){const e=effectOf(f,'copyHighestAtk');if(e)f.atk+=Math.round(maxAtk*e.ratio);}\n  return team;\n}")
rep('src/battle.js',
    "  const crit=Math.random()<critChance;\n  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1))),miss:false,crit};",
    "  const crit=Math.random()<critChance;\n  const reflect=effectOf(target,'reflect'),flatDR=effectOf(target,'damageReduction');\n  const reduce=Math.min(.8,Math.max(0,Number(target.damageReduction||0)/100+Number(reflect?.damageReduction||0)+Number(flatDR?.value||0)/100));\n  return {amount:Math.max(1,Math.round(base*multiplier*variance*(crit?1.5:1)*(1-reduce))),miss:false,crit};")
rep('src/battle.js',
    "  let skillMultiplier=action.multiplier||1;",
    "  let skillMultiplier=action.multiplier||1;\n  if(useSkill){const e=effectOf(actor,'skillDamage');if(e)skillMultiplier*=1+e.value;}")
rep('src/battle.js',
    "  for(const target of targets){const hit=damage(actor,target,skillMultiplier,action.ignoreDef||0);if(hit.miss){misses++;continue;}const wasAlive=target.alive;applyDamage(target,hit.amount,log);total+=hit.amount;if(hit.crit)crits++;if(wasAlive&&!target.alive)killed=true;}",
    "  const pierce=effectOf(actor,'ignoreDef');\n  for(const target of targets){const hit=damage(actor,target,skillMultiplier,(action.ignoreDef||0)+Number(pierce?.value||0));if(hit.miss){misses++;continue;}const wasAlive=target.alive;applyDamage(target,hit.amount,log);total+=hit.amount;if(hit.crit)crits++;const execute=effectOf(actor,'execute');if(target.alive&&execute&&target.hpNow/target.hp<=execute.threshold&&Math.random()<execute.chance){log.push(`${actor.name}的【屠龙刀】触发斩杀！`);applyDamage(target,target.hpNow,log);}const reflect=effectOf(target,'reflect');if(reflect&&actor.alive){const back=Math.round(hit.amount*reflect.ratio);if(back>0){applyDamage(actor,back,log);log.push(`${target.name}的【金丝软猬甲】反震 ${back.toLocaleString()} 伤害。`);}}const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);if(wasAlive&&!target.alive)killed=true;}")
rep('src/battle.js',
    "  if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);if(skill.repeatChance&&living(enemies).length&&Math.random()<skill.repeatChance){performOne(actor,own,enemies,log,true);}}\n  shieldAfterAction(actor,own,log);",
    "  const steal=effectOf(actor,'lifesteal');if(steal&&total>0&&actor.alive){const heal=Math.round(total*steal.ratio);actor.hpNow=Math.min(actor.hp,actor.hpNow+heal);log.push(`${actor.name}凭【玄铁指环】吸血 ${heal.toLocaleString()}。`);}\n  if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const rageSupport=effectOf(actor,'rageSupport');if(rageSupport&&Math.random()<rageSupport.chance){const allies=living(own).filter(x=>x!==actor);if(allies.length){const ally=allies[Math.floor(Math.random()*allies.length)];ally.rage=Math.min(8,ally.rage+rageSupport.amount);log.push(`${actor.name}的【焦尾琴】令${ally.name}怒气 +${rageSupport.amount}。`);}}if(skill.repeatChance&&living(enemies).length&&Math.random()<skill.repeatChance){performOne(actor,own,enemies,log,true);}}\n  shieldAfterAction(actor,own,log);")

# app.js imports
rep('src/app.js',
    "} from './innerpower.js';\n\nlet state=loadState()",
    "} from './innerpower.js';\nimport {\n  WEAPON_OPEN_LEVEL, WEAPON_MAX_LEVEL, WEAPON_FORGE_COST, WEAPON_TYPES, WEAPONS, FORGE_THEMES,\n  strengthenCost, breakthroughNeed, weaponRecord, rollForge,\n} from './weapons.js';\n\nlet state=loadState()")

old_tabs = "function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER;return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn ${selectedGrowthTab==='innerPower'?'btn-gold':''}\" data-growth-tab=\"innerPower\" ${innerOpen?'':'disabled'}>内力${innerOpen?'':' · 50幕'}</button><button class=\"btn\" disabled>神兵</button><button class=\"btn\" disabled>悟道</button></div>`;}"
new_tabs = "function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER,weaponOpen=state.player.level>=WEAPON_OPEN_LEVEL;return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn ${selectedGrowthTab==='innerPower'?'btn-gold':''}\" data-growth-tab=\"innerPower\" ${innerOpen?'':'disabled'}>内力${innerOpen?'':' · 50幕'}</button><button class=\"btn ${selectedGrowthTab==='weapons'?'btn-gold':''}\" data-growth-tab=\"weapons\" ${weaponOpen?'':'disabled'}>神兵${weaponOpen?'':' · Lv.30'}</button><button class=\"btn\" disabled>悟道</button></div>`;}"
rep('src/app.js', old_tabs, new_tabs)

weapon_ui = r'''function weaponUsedBy(id){for(const [heroId,h] of Object.entries(state.heroes)){for(const [slot,wid] of Object.entries(h?.weapons||{}))if(wid===id)return {heroId,slot};}return null;}
function weaponSlotsHtml(){const eq=state.heroes[selectedGrowthHero].weapons||{};return `<div class="kungfu-slots">${Object.entries(WEAPON_TYPES).map(([slot,label])=>{const id=eq[slot],w=id?WEAPONS[id]:null;return `<div class="kungfu-slot"><div class="muted">${label}</div><div class="hero-name">${w?w.name:'空'}</div>${w?`<button class="btn btn-ghost btn-block" data-unequip-weapon="${slot}" style="margin-top:6px">卸下</button>`:''}</div>`;}).join('')}</div>`;}
function renderWeaponPanel(){const theme=Math.max(0,Math.min(FORGE_THEMES.length-1,Number(state.weapons?.theme||0))),t=FORGE_THEMES[theme],iron=Number(state.weapons?.iron||0);const cards=Object.values(WEAPONS).map(w=>{const r=weaponRecord(state,w.id),used=weaponUsedBy(w.id),need=r.breakthrough<5?breakthroughNeed(r.breakthrough):0,cost=strengthenCost(r.level),canStr=r.owned&&r.level<WEAPON_MAX_LEVEL&&state.player.copper>=cost,canBreak=r.owned&&r.breakthrough<5&&r.copies>=need;return `<div class="hero-card ${r.owned?'':'locked'}"><div class="hero-card-row"><div><div class="hero-name rarity-6">${w.name} ${r.owned?`强化+${r.level} · 突破${r.breakthrough}`:'未获得'}</div><div class="hero-meta">${WEAPON_TYPES[w.slot]} · ${w.effect}</div><div class="hero-meta">同名本体 ${fmt(r.copies)}${used?` · 已装备：${HEROES[used.heroId]?.name||''}`:''}</div></div><div class="action-stack">${r.owned?`<button class="btn ${canStr?'btn-primary':''}" data-strengthen-weapon="${w.id}" ${canStr?'':'disabled'}>强化 · ${fmt(cost)}铜钱</button><button class="btn ${canBreak?'btn-gold':''}" data-breakthrough-weapon="${w.id}" ${canBreak?'':'disabled'}>${r.breakthrough>=5?'已满突破':`突破 · ${need}本`}</button><button class="btn" data-equip-weapon="${w.id}" ${used?.heroId===selectedGrowthHero?'disabled':''}>${used?.heroId===selectedGrowthHero?'已装备':'装备'}</button>`:''}</div></div></div>`;}).join('');return `<section class="card"><div class="section-title"><h3>${HEROES[selectedGrowthHero].name} · 神兵</h3><small>四部位</small></div>${weaponSlotsHtml()}<div class="notice" style="margin-top:10px">神兵强化、突破会直接进入侠客属性和战斗。突破1～5级依次消耗同名本体1/2/4/8/15。</div></section><section class="card"><div class="section-title"><h3>神兵锻造</h3><small>精铁 ${fmt(iron)}</small></div><div class="action-row">${FORGE_THEMES.map((x,i)=>`<button class="btn ${i===theme?'btn-gold':''}" data-weapon-theme="${i}">${x.name}</button>`).join('')}</div><div class="notice" style="margin-top:10px">当前主题：${t.name}。重点产出【${WEAPONS[t.featured].name}】，并可获得【${WEAPONS[t.secondary].name}】等神兵。单机版暂设100精铁锻造1次，后续整体经济校准时统一调整。</div><div class="action-row" style="margin-top:10px"><button class="btn" data-action="buyWeaponIron" ${state.player.gems<100?'disabled':''}>100元宝换100精铁</button><button class="btn btn-primary" data-action="forgeWeapon" ${iron<WEAPON_FORGE_COST?'disabled':''}>锻造1次 · ${WEAPON_FORGE_COST}精铁</button></div><div class="hero-meta" style="margin-top:8px">千宝塔每10层额外获得20精铁；这是现阶段常驻来源。</div></section><div class="section-title"><h3>神兵库</h3><small>${Object.values(state.weapons?.items||{}).filter(x=>x.owned).length}/${Object.keys(WEAPONS).length}</small></div><div class="hero-list">${cards}</div>`;}
function equipWeapon(id){ensureGrowthHero();const w=WEAPONS[id],r=weaponRecord(state,id);if(!w||!r.owned)return;for(const h of Object.values(state.heroes)){if(h?.weapons?.[w.slot]===id)h.weapons[w.slot]=null;}state.heroes[selectedGrowthHero].weapons[w.slot]=id;commit();}
function unequipWeapon(slot){ensureGrowthHero();if(state.heroes[selectedGrowthHero]?.weapons)state.heroes[selectedGrowthHero].weapons[slot]=null;commit();}
function strengthenWeapon(id){const r=weaponRecord(state,id);if(!r.owned||r.level>=WEAPON_MAX_LEVEL)return;const cost=strengthenCost(r.level);if(state.player.copper<cost)return alert(`铜钱不足，需要${fmt(cost)}。`);state.player.copper-=cost;r.level+=1;commit();}
function breakthroughWeapon(id){const r=weaponRecord(state,id);if(!r.owned||r.breakthrough>=5)return;const need=breakthroughNeed(r.breakthrough);if(r.copies<need)return alert(`同名神兵不足，需要${need}件。`);r.copies-=need;r.breakthrough+=1;commit();alert(`${WEAPONS[id].name}突破至${r.breakthrough}级。`);}
function buyWeaponIron(){if(state.player.gems<100)return alert('元宝不足。');state.player.gems-=100;state.weapons.iron=Number(state.weapons.iron||0)+100;commit();}
function forgeWeapon(){if(Number(state.weapons?.iron||0)<WEAPON_FORGE_COST)return alert('精铁不足。');state.weapons.iron-=WEAPON_FORGE_COST;const id=rollForge(state.weapons.theme),r=weaponRecord(state,id);state.weapons.forgeCount=Number(state.weapons.forgeCount||0)+1;if(!r.owned){r.owned=true;r.level=1;}else r.copies+=1;commit();alert(`神兵锻造：获得【${WEAPONS[id].name}】${r.copies?`，当前备用本体${r.copies}件`:''}。`);}

'''
p=Path('src/app.js'); s=p.read_text(); marker='function renderGrowth(){ensureGrowthHero();'
if marker not in s: raise SystemExit('renderGrowth marker missing')
p.write_text(s.replace(marker, weapon_ui+marker, 1))

old_growth = "function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);if(selectedGrowthTab==='innerPower'&&state.player.chapter<INNER_POWER_OPEN_CHAPTER)selectedGrowthTab='meridian';const panel=selectedGrowthTab==='kungfu'?renderKungfuPanel():selectedGrowthTab==='innerPower'?renderInnerPowerPanel():renderMeridianPanel();pageEl.innerHTML=`<div class=\"section-title\"><h2>养成</h2><small>经脉 · 功法 · 内力</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${panel}`;}"
new_growth = "function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);if(selectedGrowthTab==='innerPower'&&state.player.chapter<INNER_POWER_OPEN_CHAPTER)selectedGrowthTab='meridian';if(selectedGrowthTab==='weapons'&&state.player.level<WEAPON_OPEN_LEVEL)selectedGrowthTab='meridian';const panel=selectedGrowthTab==='kungfu'?renderKungfuPanel():selectedGrowthTab==='innerPower'?renderInnerPowerPanel():selectedGrowthTab==='weapons'?renderWeaponPanel():renderMeridianPanel();pageEl.innerHTML=`<div class=\"section-title\"><h2>养成</h2><small>经脉 · 功法 · 内力 · 神兵</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${panel}`;}"
rep('src/app.js', old_growth, new_growth)

rep('src/app.js',
    "const basePills=towerBaseMeridianPills(result.floor),milestone=towerMilestoneReward(result.floor),pills=basePills+milestone.meridian,copper=8000+result.floor*1200;state.player.meridianPills+=pills;",
    "const basePills=towerBaseMeridianPills(result.floor),milestone=towerMilestoneReward(result.floor),pills=basePills+milestone.meridian,copper=8000+result.floor*1200,iron=result.floor%10===0?20:0;state.player.meridianPills+=pills;state.weapons.iron=Number(state.weapons.iron||0)+iron;")
rep('src/app.js',
    "if(milestone.mixedYiqi)reward+=` · 混元一气功 +${milestone.mixedYiqi}`;commit();",
    "if(milestone.mixedYiqi)reward+=` · 混元一气功 +${milestone.mixedYiqi}`;if(iron)reward+=` · 精铁 +${iron}`;commit();")

rep('src/app.js',
    "if(btn.dataset.fuseDivine){fuseDivine(btn.dataset.fuseDivine);return;}if(btn.dataset.recharge)",
    "if(btn.dataset.fuseDivine){fuseDivine(btn.dataset.fuseDivine);return;}if(btn.dataset.weaponTheme!==undefined){state.weapons.theme=Number(btn.dataset.weaponTheme)||0;commit();return;}if(btn.dataset.equipWeapon){equipWeapon(btn.dataset.equipWeapon);return;}if(btn.dataset.unequipWeapon!==undefined){unequipWeapon(btn.dataset.unequipWeapon);return;}if(btn.dataset.strengthenWeapon){strengthenWeapon(btn.dataset.strengthenWeapon);return;}if(btn.dataset.breakthroughWeapon){breakthroughWeapon(btn.dataset.breakthroughWeapon);return;}if(btn.dataset.recharge)")
rep('src/app.js',
    "if(action==='innerBreakthroughPill')attemptInnerBreakthrough(true);if(action==='buyStamina')",
    "if(action==='innerBreakthroughPill')attemptInnerBreakthrough(true);if(action==='buyWeaponIron')buyWeaponIron();if(action==='forgeWeapon')forgeWeapon();if(action==='buyStamina')")

rep('index.html','单机精简版 · V0.5','单机精简版 · V0.6')
rep('sw.js',"const CACHE = 'xinyitian-v0.5.0';","const CACHE = 'xinyitian-v0.6.0';")
rep('sw.js',"  './src/innerpower.js',\n  './src/app.js'","  './src/innerpower.js',\n  './src/weapons.js',\n  './src/app.js'")
