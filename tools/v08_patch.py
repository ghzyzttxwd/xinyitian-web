from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:140]}')
    p.write_text(s.replace(old,new,1))

# state.js：神品状态与属性进入总属性
rep('src/state.js',
    "import { createWeaponState, equippedWeaponBonuses } from './weapons.js';\nimport { createAncientTombState, ANCIENT_TOMB_DAILY_ATTEMPTS } from './ancienttomb.js';",
    "import { createWeaponState, equippedWeaponBonuses } from './weapons.js';\nimport { createAncientTombState, ANCIENT_TOMB_DAILY_ATTEMPTS } from './ancienttomb.js';\nimport { createAwakeningState, awakeningBaseMultiplier } from './awakening.js';")
rep('src/state.js',
    "    weapons:createWeaponState(),\n    recharge:",
    "    weapons:createWeaponState(),\n    awakening:createAwakeningState(),\n    recharge:")
rep('src/state.js',
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);\n  const rawAtk=tpl.base.atk*growth+Number(meridian.atk||0)+k.atk+ip.flatAtk+w.atk;\n  const rawDef=tpl.base.def*growth+Number(meridian.def||0)+k.def+ip.flatDef+w.def;\n  const rawHp=tpl.base.hp*growth+Number(meridian.hp||0)+k.hp+ip.flatHp+w.hp;",
    "  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId), a=awakeningBaseMultiplier(state,heroId);\n  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);\n  const rawAtk=tpl.base.atk*a.atk*growth+Number(meridian.atk||0)+k.atk+ip.flatAtk+w.atk;\n  const rawDef=tpl.base.def*a.def*growth+Number(meridian.def||0)+k.def+ip.flatDef+w.def;\n  const rawHp=tpl.base.hp*a.hp*growth+Number(meridian.hp||0)+k.hp+ip.flatHp+w.hp;")
rep('src/state.js',
    "    speed: tpl.base.speed + Math.floor((h.level - 1) / 10),",
    "    speed: tpl.base.speed + Number(a.speed||0) + Math.floor((h.level - 1) / 10),")

# battle.js：神品名字/绝技/核心机制进入战斗
rep('src/battle.js',
    "import { weaponBattleEffects } from './weapons.js';",
    "import { weaponBattleEffects } from './weapons.js';\nimport { effectiveHeroProfile, awakeningBattleEffects } from './awakening.js';")
rep('src/battle.js',
    "  out.push(...weaponBattleEffects(state,heroId));\n  return out;",
    "  out.push(...weaponBattleEffects(state,heroId));\n  out.push(...awakeningBattleEffects(state,heroId));\n  return out;")
rep('src/battle.js',
    "    const tpl=HEROES[id], s=heroStats(state,id), effects=effectsForHero(state,id);\n    const rageEffect=effects.find(x=>x.kind==='rageBurst'),dodgeStart=effects.find(x=>x.kind==='dodgeStart');\n    return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });",
    "    const tpl=effectiveHeroProfile(state,id,HEROES[id]), s=heroStats(state,id), effects=effectsForHero(state,id);\n    const rageEffect=effects.find(x=>x.kind==='rageBurst'),dodgeStart=effects.find(x=>x.kind==='dodgeStart');\n    return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });")
rep('src/battle.js',
    "  for(const f of team){const e=effectOf(f,'copyHighestAtk');if(e)f.atk+=Math.round(maxAtk*e.ratio);}\n  return team;",
    "  for(const f of team){const e=effectOf(f,'copyHighestAtk');if(e)f.atk+=Math.round(maxAtk*e.ratio);}\n  for(const f of team){const e=effectOf(f,'teamStartShield');if(e)for(const ally of team)ally.shield+=Math.round(ally.hp*e.ratio);}\n  return team;")
rep('src/battle.js',
    "const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);if(wasAlive&&!target.alive)killed=true;}",
    "const healHit=effectOf(target,'healOnHit');if(healHit&&Math.random()<healHit.chance)healTeam(enemies,target,healHit.ratio,log);const grow=effectOf(target,'afterHitAtk');if(grow&&target.alive){target.godAtkStacks=Number(target.godAtkStacks||0);if(target.godAtkStacks<grow.maxStacks){target.atk=Math.round(target.atk*(1+grow.ratio));target.godAtkStacks+=1;}}if(wasAlive&&!target.alive)killed=true;}")
rep('src/battle.js',
    "if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const rageSupport=effectOf(actor,'rageSupport');",
    "if(useSkill){teamRage(own,skill.teamRage||0,actor,log);healTeam(own,actor,skill.healTeam||0,log);const drain=effectOf(actor,'skillDrainRage');if(drain){for(const foe of living(enemies))foe.rage=Math.max(0,foe.rage-drain.amount);log.push(`${actor.name}压制敌方怒气 -${drain.amount}。`);}const rageSupport=effectOf(actor,'rageSupport');")

# ancienttomb.js：高层首次通关给神品魂石自选箱（单机迁移渠道）
rep('src/ancienttomb.js',
    "    yuanyangCopies:firstClear?Number(YUANYANG_FIRST_REWARDS[f]||0):0,",
    "    yuanyangCopies:firstClear?Number(YUANYANG_FIRST_REWARDS[f]||0):0,\n    soulChoicePacks:firstClear&&f%100===0?1:0,")

# app.js imports
rep('src/app.js',
    "} from './ancienttomb.js';",
    "} from './ancienttomb.js';\nimport {\n  AWAKENINGS, SOUL_SHARDS_PER_STONE, SOUL_SHARD_PACK, SOUL_SHARD_PACK_PRICE,\n  SOUL_SHARD_PACK_LIMIT, awakeningConfig, canHeroAwaken, effectiveHeroProfile,\n  buyableShardPacks, synthesizeSoulStone,\n} from './awakening.js';")

# 首页阵容显示神品名
rep('src/app.js',
    "function partyHtml(){return state.party.map((id,index)=>{if(!id)return `<div class=\"party-slot empty\">${index+1}号位</div>`;const tpl=HEROES[id],h=state.heroes[id];return `<div class=\"party-slot\"><div class=\"hero-name rarity-${tpl.rarity}\">${tpl.name}</div><div class=\"hero-meta\">Lv.${h.level} · ${tpl.role}</div><div class=\"hero-meta\">战力 ${fmt(heroPower(state,id))}</div></div>`;}).join('');}",
    "function partyHtml(){return state.party.map((id,index)=>{if(!id)return `<div class=\"party-slot empty\">${index+1}号位</div>`;const tpl=effectiveHeroProfile(state,id,HEROES[id]),h=state.heroes[id];return `<div class=\"party-slot\"><div class=\"hero-name rarity-${tpl.rarity}\">${tpl.name}</div><div class=\"hero-meta\">Lv.${h.level} · ${tpl.role}</div><div class=\"hero-meta\">战力 ${fmt(heroPower(state,id))}</div></div>`;}).join('');}")

# 侠客卡：显示神品并提供觉醒按钮
old_hero="""function heroCard(id){
 const tpl=HEROES[id],h=state.heroes[id],owned=h?.owned,inParty=state.party.includes(id),unlockText=tpl.recruit?.type==='vip8'?'VIP8礼包':tpl.unlock?`第${tpl.unlock}幕开放`:(id==='xiaozhao'?'首充6元':'初始/活动'),s=owned?heroStats(state,id):null,talent=Number(h?.meridian?.talent||0);
 return `<div class=\"hero-card ${owned?'':'locked'}\"><div class=\"hero-card-row\"><div><div class=\"hero-name rarity-${tpl.rarity}\">${tpl.name} <span class=\"tag\">${rarityName(tpl.rarity)}</span></div><div class=\"hero-meta\">${tpl.role} · ${owned?`Lv.${h.level} · 战力 ${fmt(heroPower(state,id))}`:unlockText}</div>${s?`<div class=\"hero-meta\">攻 ${fmt(s.atk)} · 防 ${fmt(s.def)} · 血 ${fmt(s.hp)} · 天赋 ${talent}</div>`:''}</div><div class=\"action-row\">${owned?`<button class=\"btn\" data-level-hero=\"${id}\">升级</button><button class=\"btn ${inParty?'btn-gold':''}\" data-toggle-party=\"${id}\">${inParty?'下阵':'上阵'}</button>`:recruitStatusHtml(id)}</div></div></div>`;
}"""
new_hero="""function awakeningHeroAction(id){const c=awakeningConfig(id),h=state.heroes[id];if(!c||!h?.owned)return '';if(h.awakened)return '<span class=\"tag\">神品已觉醒</span>';const stone=Number(state.awakening?.stones?.[id]||0);if(state.player.chapter<c.unlockChapter)return `<span class=\"muted\">神品第${c.unlockChapter}幕</span>`;return `<button class=\"btn ${stone?'btn-gold':''}\" data-awaken-hero=\"${id}\" ${stone?'':'disabled'}>觉醒神品 · 魂石${stone}/1</button>`;}
function heroCard(id){
 const base=HEROES[id],tpl=effectiveHeroProfile(state,id,base),h=state.heroes[id],owned=h?.owned,inParty=state.party.includes(id),unlockText=base.recruit?.type==='vip8'?'VIP8礼包':base.unlock?`第${base.unlock}幕开放`:(id==='xiaozhao'?'首充6元':'初始/活动'),s=owned?heroStats(state,id):null,talent=Number(h?.meridian?.talent||0);
 return `<div class=\"hero-card ${owned?'':'locked'}\"><div class=\"hero-card-row\"><div><div class=\"hero-name rarity-${tpl.rarity}\">${tpl.name} <span class=\"tag\">${rarityName(tpl.rarity)}</span></div><div class=\"hero-meta\">${tpl.role} · ${owned?`Lv.${h.level} · 战力 ${fmt(heroPower(state,id))}`:unlockText}</div>${s?`<div class=\"hero-meta\">攻 ${fmt(s.atk)} · 防 ${fmt(s.def)} · 血 ${fmt(s.hp)} · 天赋 ${talent}</div>`:''}${owned&&awakeningConfig(id)?`<div class=\"hero-meta\">${h.awakened?awakeningConfig(id).desc:`神品魂石：${fmt(state.awakening?.stones?.[id]||0)} · 碎片 ${fmt(state.awakening?.fragments?.[id]||0)}/${SOUL_SHARDS_PER_STONE}`}</div>`:''}</div><div class=\"action-stack\">${owned?`<div class=\"action-row\"><button class=\"btn\" data-level-hero=\"${id}\">升级</button><button class=\"btn ${inParty?'btn-gold':''}\" data-toggle-party=\"${id}\">${inParty?'下阵':'上阵'}</button></div>${awakeningHeroAction(id)}`:recruitStatusHtml(id)}</div></div></div>`;
}"""
rep('src/app.js',old_hero,new_hero)

# 养成侠客选择显示神品名
rep('src/app.js',
    "${HEROES[id].name} · Lv.${state.heroes[id].level}",
    "${effectiveHeroProfile(state,id,HEROES[id]).name} · Lv.${state.heroes[id].level}")

# 神品魂石商店/购买/合成/觉醒
marker="function rechargeHtml(){return RECHARGE_PACKS.map"
insert=r'''function soulStoreCard(id){const c=AWAKENINGS[id],h=state.heroes[id],frag=Number(state.awakening?.fragments?.[id]||0),stone=Number(state.awakening?.stones?.[id]||0),bought=Number(state.awakening?.shopBuys?.[id]||0),left=buyableShardPacks(state,id),open=state.player.chapter>=c.unlockChapter;return `<div class="hero-card ${open?'':'locked'}"><div class="hero-card-row"><div><div class="hero-name rarity-7">${c.godName}</div><div class="hero-meta">${h?.owned?'本体已拥有':'尚未获得本体'} · ${c.unlockChapter}幕觉醒 · 魂石ID ${c.soulId}</div><div class="hero-meta">碎片 ${fmt(frag)}/${SOUL_SHARDS_PER_STONE} · 魂石 ${fmt(stone)} · 常驻购买 ${bought}/${SOUL_SHARD_PACK_LIMIT}</div></div><div class="action-stack"><button class="btn" data-buy-soul="${id}" data-soul-times="1" ${open&&left>0&&state.player.gems>=SOUL_SHARD_PACK_PRICE?'':'disabled'}>40碎片 · ${SOUL_SHARD_PACK_PRICE}元宝</button><button class="btn" data-buy-soul="${id}" data-soul-times="5" ${open&&left>=5&&state.player.gems>=SOUL_SHARD_PACK_PRICE*5?'':'disabled'}>买5次</button>${Number(state.awakening?.choicePacks||0)>0?`<button class="btn" data-choice-soul="${id}">自选箱 +40</button>`:''}${frag>=SOUL_SHARDS_PER_STONE?`<button class="btn btn-gold" data-synth-soul="${id}">合成魂石</button>`:''}</div></div></div>`;}
function renderSoulStoneStore(){return `<section class="card"><div class="section-title"><h3>神品魂石商店</h3><small>自选箱 ${fmt(state.awakening?.choicePacks||0)}</small></div><div class="notice">单机常驻渠道：每次40碎片，25次正好1000碎片合成1枚魂石。当前价格1000元宝/40碎片属于单机版暂定经济值。千宝塔和古墓的高层节点会给魂石自选箱。</div><div class="hero-list" style="margin-top:10px">${Object.keys(AWAKENINGS).map(soulStoreCard).join('')}</div></section>`;}
function buySoulShards(id,times=1){const c=awakeningConfig(id);if(!c)return;const n=Math.max(1,Math.min(5,Number(times)||1)),left=buyableShardPacks(state,id),actual=Math.min(n,left);if(actual<=0)return alert('该魂石常驻购买次数已经用完。');if(state.player.chapter<c.unlockChapter)return alert(`第${c.unlockChapter}幕开放该神品魂石。`);const cost=actual*SOUL_SHARD_PACK_PRICE;if(state.player.gems<cost)return alert(`元宝不足，需要${fmt(cost)}。`);state.player.gems-=cost;state.awakening.shopBuys[id]=Number(state.awakening.shopBuys[id]||0)+actual;state.awakening.fragments[id]=Number(state.awakening.fragments[id]||0)+actual*SOUL_SHARD_PACK;commit();}
function useChoiceSoulPack(id){if(!awakeningConfig(id))return;if(Number(state.awakening?.choicePacks||0)<=0)return alert('魂石自选箱不足。');state.awakening.choicePacks-=1;state.awakening.fragments[id]=Number(state.awakening.fragments[id]||0)+SOUL_SHARD_PACK;commit();}
function synthSoul(id){if(!synthesizeSoulStone(state,id))return alert(`需要${SOUL_SHARDS_PER_STONE}魂石碎片。`);commit();alert(`已合成【${AWAKENINGS[id].godName}】对应魂石。`);}
function awakenHero(id){const c=awakeningConfig(id),h=state.heroes[id];if(!c||!h?.owned)return alert('尚未获得该侠客本体。');if(h.awakened)return;if(state.player.chapter<c.unlockChapter)return alert(`需要第${c.unlockChapter}幕。`);if(!canHeroAwaken(state,id))return alert('对应魂石不足。');state.awakening.stones[id]-=1;h.awakened=true;commit();alert(`觉醒成功：${c.godName}！`);}

function rechargeHtml(){return RECHARGE_PACKS.map'''
rep('src/app.js',marker,insert)

# More页加入魂石商店
rep('src/app.js',
    "pageEl.innerHTML=`<div class=\"section-title\"><h2>更多</h2><small>客栈 · 充值 · 资源 · 存档</small></div>${renderInnCard()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3>",
    "pageEl.innerHTML=`<div class=\"section-title\"><h2>更多</h2><small>客栈 · 神品 · 充值 · 资源 · 存档</small></div>${renderInnCard()}${renderSoulStoneStore()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3>")

# 千宝塔：每100层首次通关给1个40片自选箱
rep('src/app.js',
    "if(milestone.mixedYiqi)addKungfuCopy('105701',milestone.mixedYiqi);reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;",
    "if(milestone.mixedYiqi)addKungfuCopy('105701',milestone.mixedYiqi);if(result.floor%100===0){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+1;}reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;")
rep('src/app.js',
    "if(milestone.mixedYiqi)reward+=` · 混元一气功 +${milestone.mixedYiqi}`;commit();",
    "if(milestone.mixedYiqi)reward+=` · 混元一气功 +${milestone.mixedYiqi}`;if(result.floor%100===0)reward+=` · 神品魂石自选箱 +1`;commit();")

# 古墓：100/200/300/400层首次通关自选箱
rep('src/app.js',
    "if(r.yuanyangCopies){grantWeaponCopies('yuanyang',r.yuanyangCopies);parts.push(`鸳鸯刀 +${r.yuanyangCopies}`);}return parts.join(' · ');",
    "if(r.yuanyangCopies){grantWeaponCopies('yuanyang',r.yuanyangCopies);parts.push(`鸳鸯刀 +${r.yuanyangCopies}`);}if(r.soulChoicePacks){state.awakening.choicePacks=Number(state.awakening.choicePacks||0)+r.soulChoicePacks;parts.push(`神品魂石自选箱 +${r.soulChoicePacks}`);}return parts.join(' · ');")

# 点击事件
rep('src/app.js',
    "if(btn.dataset.breakthroughWeapon){breakthroughWeapon(btn.dataset.breakthroughWeapon);return;}if(btn.dataset.innerMedicine)",
    "if(btn.dataset.breakthroughWeapon){breakthroughWeapon(btn.dataset.breakthroughWeapon);return;}if(btn.dataset.buySoul){buySoulShards(btn.dataset.buySoul,Number(btn.dataset.soulTimes||1));return;}if(btn.dataset.choiceSoul){useChoiceSoulPack(btn.dataset.choiceSoul);return;}if(btn.dataset.synthSoul){synthSoul(btn.dataset.synthSoul);return;}if(btn.dataset.awakenHero){awakenHero(btn.dataset.awakenHero);return;}if(btn.dataset.innerMedicine)")

# 版本与缓存
rep('index.html','单机精简版 · V0.7','单机精简版 · V0.8')
rep('sw.js',"const CACHE = 'xinyitian-v0.7.0';","const CACHE = 'xinyitian-v0.8.0';")
rep('sw.js',"  './src/ancienttomb.js',\n  './src/weapons.js',","  './src/ancienttomb.js',\n  './src/awakening.js',\n  './src/weapons.js',")
