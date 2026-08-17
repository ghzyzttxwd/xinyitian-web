from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:160]}')
    p.write_text(s.replace(old,new,1))

# state.js：悟道存档 + 属性进入总属性 + 每日商店次数
rep('src/state.js',
    "import { createAwakeningState, awakeningBaseMultiplier } from './awakening.js';",
    "import { createAwakeningState, awakeningBaseMultiplier } from './awakening.js';\nimport { createWudaoState, wudaoBonuses } from './wudao.js';")
rep('src/state.js',
    "    weapons: {weapon:null,armor:null,accessory:null,treasure:null},\n  };",
    "    weapons: {weapon:null,armor:null,accessory:null,treasure:null},\n    wudao: {stage:0},\n  };")
rep('src/state.js',
    "    awakening:createAwakeningState(),\n    recharge: { firstDoubleUsed: {}, first6Claimed: false, vipGiftBought: {} },\n    daily: { date: localDateKey(), staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0 },",
    "    awakening:createAwakeningState(),\n    wudao:createWudaoState(),\n    recharge: { firstDoubleUsed: {}, first6Claimed: false, vipGiftBought: {} },\n    daily: { date: localDateKey(), staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0 },")
rep('src/state.js',
    "    state.daily = { date: today, staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0 };",
    "    state.daily = { date: today, staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0 };")
rep('src/state.js',
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId), a=awakeningBaseMultiplier(state,heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);",
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId), a=awakeningBaseMultiplier(state,heroId), wd=wudaoBonuses(state,heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);")
rep('src/state.js',
    "    atk: Math.round(rawAtk*(1+ip.atkPct/100)),\n    def: Math.round(rawDef*(1+ip.defPct/100)),\n    hp: Math.round(rawHp*(1+ip.hpPct/100)),\n    speed: tpl.base.speed + Number(a.speed||0) + Math.floor((h.level - 1) / 10),\n    hit: k.hit+ip.hit, dodge: k.dodge+ip.dodge, crit: k.crit+ip.crit, antiCrit: k.antiCrit+ip.antiCrit,\n    damageBonus:ip.damageBonus, damageReduction:ip.damageReduction, initialRage:ip.initialRage,",
    "    atk: Math.round(rawAtk*(1+ip.atkPct/100)*(1+wd.atkPct/100)),\n    def: Math.round(rawDef*(1+ip.defPct/100)*(1+wd.defPct/100)),\n    hp: Math.round(rawHp*(1+ip.hpPct/100)*(1+wd.hpPct/100)),\n    speed: tpl.base.speed + Number(a.speed||0) + Math.floor((h.level - 1) / 10),\n    hit: k.hit+ip.hit+wd.hit, dodge: k.dodge+ip.dodge+wd.dodge, crit: k.crit+ip.crit+wd.crit, antiCrit: k.antiCrit+ip.antiCrit+wd.antiCrit,\n    damageBonus:ip.damageBonus+wd.damageBonus, damageReduction:ip.damageReduction+wd.damageReduction, initialRage:ip.initialRage,")

# battle.js：悟道技能/机制进入战斗
rep('src/battle.js',
    "import { effectiveHeroProfile, awakeningBattleEffects } from './awakening.js';",
    "import { effectiveHeroProfile, awakeningBattleEffects } from './awakening.js';\nimport { applyWudaoProfile, wudaoBattleEffects } from './wudao.js';")
rep('src/battle.js',
    "  out.push(...awakeningBattleEffects(state,heroId));\n  return out;",
    "  out.push(...awakeningBattleEffects(state,heroId));\n  out.push(...wudaoBattleEffects(state,heroId));\n  return out;")
rep('src/battle.js',
    "    const tpl=effectiveHeroProfile(state,id,HEROES[id]), s=heroStats(state,id), effects=effectsForHero(state,id);",
    "    const tpl=applyWudaoProfile(state,id,effectiveHeroProfile(state,id,HEROES[id])), s=heroStats(state,id), effects=effectsForHero(state,id);")
rep('src/battle.js',
    "function applyDamage(target,amount,log){\n  let left=amount;",
    "function tryTeamRevive(target,team,log){\n  if(target.alive)return false;\n  for(const source of living(team)){const e=effectOf(source,'teamReviveOnce');if(e&&!source.teamReviveUsed){source.teamReviveUsed=1;target.alive=true;target.hpNow=Math.max(1,Math.round(target.hp*e.ratio));log.push(`${source.name}悟道触发复起，${target.name}恢复${Math.round(e.ratio*100)}%气血！`);return true;}}\n  return false;\n}\n\nfunction applyDamage(target,amount,log){\n  let left=amount;")
rep('src/battle.js',
    "const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);const grow=effectOf(target,'afterHitAtk');",
    "if(!target.alive)tryTeamRevive(target,enemies,log);const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);const grow=effectOf(target,'afterHitAtk');")
rep('src/battle.js',
    "if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const drain=effectOf(actor,'skillDrainRage');",
    "if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const rageFloor=effectOf(actor,'rageFloorAfterSkill');if(rageFloor){for(const ally of living(own))ally.rage=Math.max(ally.rage,rageFloor.value);log.push(`${actor.name}悟道令己方低怒侠客补至${rageFloor.value}怒。`);}const drain=effectOf(actor,'skillDrainRage');")

# ancienttomb.js：高层悟道丹来源
rep('src/ancienttomb.js',
    "    soulChoicePacks:firstClear&&f%100===0?1:0,",
    "    soulChoicePacks:firstClear&&f%100===0?1:0,\n    wudaoPills:firstClear&&f>=200&&f%50===0 ? 15+Math.floor((f-200)/50)*5 : 0,")

# app.js imports
rep('src/app.js',
    "} from './awakening.js';",
    "} from './awakening.js';\nimport {\n  WUDAO_MAX_STAGE, WUDAO_SHOP_PACK, WUDAO_SHOP_PRICE, WUDAO_RECHARGE_PRICE,\n  WUDAO_RECHARGE_GEMS, WUDAO_RECHARGE_PILLS, WUDAO_RECHARGE_LIMIT,\n  wudaoShopDailyLimit, ensureHeroWudao, wudaoStage, nextWudaoCost, wudaoStageText,\n} from './wudao.js';")

# 养成页：开放悟道页签
old_tabs="function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER,weaponOpen=state.player.level>=WEAPON_OPEN_LEVEL;return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn ${selectedGrowthTab==='innerPower'?'btn-gold':''}\" data-growth-tab=\"innerPower\" ${innerOpen?'':'disabled'}>内力${innerOpen?'':' · 50幕'}</button><button class=\"btn ${selectedGrowthTab==='weapons'?'btn-gold':''}\" data-growth-tab=\"weapons\" ${weaponOpen?'':'disabled'}>神兵${weaponOpen?'':' · Lv.30'}</button><button class=\"btn\" disabled>悟道</button></div>`;}"
new_tabs="function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER,weaponOpen=state.player.level>=WEAPON_OPEN_LEVEL,wudaoOpen=!!state.heroes[selectedGrowthHero]?.awakened;return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn ${selectedGrowthTab==='innerPower'?'btn-gold':''}\" data-growth-tab=\"innerPower\" ${innerOpen?'':'disabled'}>内力${innerOpen?'':' · 50幕'}</button><button class=\"btn ${selectedGrowthTab==='weapons'?'btn-gold':''}\" data-growth-tab=\"weapons\" ${weaponOpen?'':'disabled'}>神兵${weaponOpen?'':' · Lv.30'}</button><button class=\"btn ${selectedGrowthTab==='wudao'?'btn-gold':''}\" data-growth-tab=\"wudao\" ${wudaoOpen?'':'disabled'}>悟道${wudaoOpen?'':' · 神品'}</button></div>`;}"
rep('src/app.js',old_tabs,new_tabs)

# 悟道面板与升级函数，插在renderGrowth前
marker="function renderGrowth(){ensureGrowthHero();"
insert=r'''function renderWudaoPanel(){const h=state.heroes[selectedGrowthHero],p=effectiveHeroProfile(state,selectedGrowthHero,HEROES[selectedGrowthHero]);ensureHeroWudao(h);const stage=wudaoStage(state,selectedGrowthHero),cost=nextWudaoCost(state,selectedGrowthHero),maxed=stage>=WUDAO_MAX_STAGE;return `<section class="card ${h.awakened?'':'locked'}"><div class="section-title"><h3>${p.name} · 悟道</h3><small>${stage}/${WUDAO_MAX_STAGE}阶</small></div><div class="grid-2"><div class="mini-stat"><div class="muted">悟道丹</div><div class="big-number small">${fmt(state.wudao?.pills||0)}</div></div><div class="mini-stat"><div class="muted">当前境界</div><div class="big-number small">${maxed?'返璞归真':`${stage}阶`}</div></div></div><div class="notice" style="margin-top:10px">${stage?wudaoStageText(selectedGrowthHero,stage):'神品觉醒后可开始悟道。悟道强化三维与角色核心机制。'}</div>${!maxed?`<div class="list-row" style="margin-top:10px"><span>下一阶：${wudaoStageText(selectedGrowthHero,stage+1)}</span><b>${fmt(cost)}悟道丹</b></div><button class="btn btn-gold btn-block" data-action="wudao" ${h.awakened&&Number(state.wudao?.pills||0)>=cost?'':'disabled'} style="margin-top:10px">悟道至${stage+1}阶</button>`:'<div class="battle-win" style="margin-top:12px">五阶悟道圆满</div>'}<div class="hero-meta" style="margin-top:8px">当前五阶消耗为单机V1暂定值，后续统一经济校准；不冒充原版精确消耗。</div></section>`;}
function advanceWudao(){ensureGrowthHero();const h=state.heroes[selectedGrowthHero];if(!h?.awakened)return alert('只有已觉醒神品侠客可以悟道。');ensureHeroWudao(h);const stage=wudaoStage(state,selectedGrowthHero);if(stage>=WUDAO_MAX_STAGE)return;const cost=nextWudaoCost(state,selectedGrowthHero);if(Number(state.wudao?.pills||0)<cost)return alert(`悟道丹不足，需要${cost}枚。`);state.wudao.pills-=cost;h.wudao.stage=stage+1;commit();alert(`${effectiveHeroProfile(state,selectedGrowthHero,HEROES[selectedGrowthHero]).name}悟道提升至${stage+1}阶。`);}

'''
if marker not in Path('src/app.js').read_text(): raise SystemExit('renderGrowth marker missing')
p=Path('src/app.js');s=p.read_text();p.write_text(s.replace(marker,insert+marker,1))

old_growth="function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);if(selectedGrowthTab==='innerPower'&&state.player.chapter<INNER_POWER_OPEN_CHAPTER)selectedGrowthTab='meridian';if(selectedGrowthTab==='weapons'&&state.player.level<WEAPON_OPEN_LEVEL)selectedGrowthTab='meridian';const panel=selectedGrowthTab==='kungfu'?renderKungfuPanel():selectedGrowthTab==='innerPower'?renderInnerPowerPanel():selectedGrowthTab==='weapons'?renderWeaponPanel():renderMeridianPanel();pageEl.innerHTML=`<div class=\"section-title\"><h2>养成</h2><small>经脉 · 功法 · 内力 · 神兵</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${panel}`;}"
new_growth="function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);if(selectedGrowthTab==='innerPower'&&state.player.chapter<INNER_POWER_OPEN_CHAPTER)selectedGrowthTab='meridian';if(selectedGrowthTab==='weapons'&&state.player.level<WEAPON_OPEN_LEVEL)selectedGrowthTab='meridian';if(selectedGrowthTab==='wudao'&&!state.heroes[selectedGrowthHero]?.awakened)selectedGrowthTab='meridian';const panel=selectedGrowthTab==='kungfu'?renderKungfuPanel():selectedGrowthTab==='innerPower'?renderInnerPowerPanel():selectedGrowthTab==='weapons'?renderWeaponPanel():selectedGrowthTab==='wudao'?renderWudaoPanel():renderMeridianPanel();pageEl.innerHTML=`<div class=\"section-title\"><h2>养成</h2><small>经脉 · 功法 · 内力 · 神兵 · 悟道</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${panel}`;}"
rep('src/app.js',old_growth,new_growth)

# 古墓悟道丹发放
rep('src/app.js',
    "if(r.soulChoicePacks){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+r.soulChoicePacks;parts.push(`神品魂石自选箱 +${r.soulChoicePacks}`);}return parts.join(' · ');",
    "if(r.soulChoicePacks){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+r.soulChoicePacks;parts.push(`神品魂石自选箱 +${r.soulChoicePacks}`);}if(r.wudaoPills){state.wudao.pills=Number(state.wudao.pills||0)+r.wudaoPills;parts.push(`悟道丹 +${r.wudaoPills}`);}return parts.join(' · ');")

# 千宝塔重要节点悟道丹
rep('src/app.js',
    "if(result.floor%100===0){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+1;}reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;",
    "if(result.floor%100===0){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+1;}const wudaoGain=result.floor>=250&&result.floor%250===0?20+Math.floor(result.floor/250)*5:0;if(wudaoGain)state.wudao.pills=Number(state.wudao.pills||0)+wudaoGain;reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;")
rep('src/app.js',
    "if(result.floor%100===0)reward+=` · 神品魂石自选箱 +1`;commit();",
    "if(result.floor%100===0)reward+=` · 神品魂石自选箱 +1`;if(wudaoGain)reward+=` · 悟道丹 +${wudaoGain}`;commit();")

# 更多页悟道商店/礼包
marker2="function rechargeHtml(){return RECHARGE_PACKS.map"
store=r'''function renderWudaoStore(){const pills=Number(state.wudao?.pills||0),limit=wudaoShopDailyLimit(state.player.vip),used=Number(state.daily?.wudaoShopBuys||0),packBuys=Number(state.wudao?.rechargePackBuys||0);return `<section class="card"><div class="section-title"><h3>悟道资源</h3><small>悟道丹 ${fmt(pills)}</small></div><div class="notice">正常渠道：千宝塔重要节点、古墓高层、元宝少量购买。VIP15不再锁死悟道，只把每日元宝购买上限从2次提高到5次。</div><div class="list-row" style="margin-top:10px"><div><b>悟道丹×${WUDAO_SHOP_PACK}</b><div class="hero-meta">今日 ${used}/${limit}</div></div><button class="btn" data-action="buyWudaoPills" ${used<limit&&state.player.gems>=WUDAO_SHOP_PRICE?'':'disabled'}>${WUDAO_SHOP_PRICE}元宝</button></div><div class="list-row"><div><b>648悟道礼包</b><div class="hero-meta">6480元宝 + 悟道丹${WUDAO_RECHARGE_PILLS} · ${packBuys}/${WUDAO_RECHARGE_LIMIT}</div></div><button class="btn btn-gold" data-action="wudaoRechargePack" ${packBuys<WUDAO_RECHARGE_LIMIT?'':'disabled'}>模拟648元</button></div></section>`;}
function buyWudaoPills(){const limit=wudaoShopDailyLimit(state.player.vip),used=Number(state.daily?.wudaoShopBuys||0);if(used>=limit)return alert('今日悟道丹元宝购买次数已用完。');if(state.player.gems<WUDAO_SHOP_PRICE)return alert('元宝不足。');state.player.gems-=WUDAO_SHOP_PRICE;state.daily.wudaoShopBuys=used+1;state.wudao.pills=Number(state.wudao.pills||0)+WUDAO_SHOP_PACK;commit();}
function buyWudaoRechargePack(){const used=Number(state.wudao?.rechargePackBuys||0);if(used>=WUDAO_RECHARGE_LIMIT)return alert('悟道礼包已达限购10次。');state.wudao.rechargePackBuys=used+1;state.player.totalRecharge+=WUDAO_RECHARGE_PRICE;state.player.gems+=WUDAO_RECHARGE_GEMS;state.wudao.pills=Number(state.wudao.pills||0)+WUDAO_RECHARGE_PILLS;recalcVip(state);commit();alert(`悟道礼包：元宝 +${fmt(WUDAO_RECHARGE_GEMS)}，悟道丹 +${WUDAO_RECHARGE_PILLS}。`);}

'''
p=Path('src/app.js');s=p.read_text();
if marker2 not in s: raise SystemExit('recharge marker missing')
p.write_text(s.replace(marker2,store+marker2,1))
rep('src/app.js',
    "</small></div>${renderInnCard()}${renderSoulStoneStore()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3>",
    "</small></div>${renderInnCard()}${renderSoulStoneStore()}${renderWudaoStore()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3>")

# 点击事件
rep('src/app.js',
    "if(action==='meridian')unlockMeridianPoint();",
    "if(action==='meridian')unlockMeridianPoint();if(action==='wudao')advanceWudao();if(action==='buyWudaoPills')buyWudaoPills();if(action==='wudaoRechargePack')buyWudaoRechargePack();")

# 版本号 / 缓存
rep('index.html','单机精简版 · V0.8','单机精简版 · V0.9')
rep('sw.js',"const CACHE = 'xinyitian-v0.8.0';","const CACHE = 'xinyitian-v0.9.0';")
rep('sw.js',"  './src/awakening.js',\n  './src/weapons.js',","  './src/awakening.js',\n  './src/wudao.js',\n  './src/weapons.js',")
