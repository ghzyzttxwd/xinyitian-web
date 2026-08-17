from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:160]}')
    p.write_text(s.replace(old,new,1))

# data.js：战力显示曲线 + 黄衫女原版技能补齐
rep('src/data.js',
    "export const SAVE_KEY = 'xinyitian_single_v1';",
    "import { towerPowerRating } from './power.js';\n\nexport const SAVE_KEY = 'xinyitian_single_v1';")
rep('src/data.js',
    "    skill: { name: '玉女素心剑法', target: 'highestAtk', multiplier: 3.2, rageCost: 4, refundOnKill: true },",
    "    skill: { name: '玉女素心剑法', target: 'highestAtk', multiplier: 3.2, flatDamage: 3600, rageCost: 4, refundOnKill: true },\n    passive: { firstRoundAbnormalImmune: true },")
rep('src/data.js',
    "export function towerEnemyPower(floor) {\n  return Math.round(2400 * Math.pow(1.0165, floor - 1));\n}",
    "export function chapterEnemyRating(chapter) {\n  return Math.round(chapterEnemyPower(chapter) * 10);\n}\n\nexport function towerEnemyRating(floor) {\n  return towerPowerRating(floor);\n}\n\n// 战斗模拟仍用压缩后的内部强度；界面显示使用原版千宝塔战力锚点。\nexport function towerEnemyPower(floor) {\n  return Math.max(2400, Math.round(towerEnemyRating(floor) / 7));\n}")

# state.js：原版模板战力作为侠客显示战力基准
rep('src/state.js',
    "import { createTasksState, createDailyTaskFields, ensureTaskState } from './tasks.js';",
    "import { createTasksState, createDailyTaskFields, ensureTaskState } from './tasks.js';\nimport { calibratedHeroPower } from './power.js';")
old_power="""export function heroPower(state, heroId) {
  const s = heroStats(state, heroId); if (!s) return 0;
  const k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);
  return Math.round(s.atk*4.6 + s.def*3.5 + s.hp*.7 + s.speed*6 + (s.hit+s.dodge+s.crit+s.antiCrit+s.damageBonus+s.damageReduction)*1200 + k.power + w.power);
}"""
new_power="""export function heroPower(state, heroId) {
  const s = heroStats(state, heroId), tpl=HEROES[heroId]; if (!s||!tpl) return 0;
  const k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);
  return calibratedHeroPower(heroId,tpl.base,s,{kungfuPower:k.power,weaponPower:w.power});
}"""
rep('src/state.js',old_power,new_power)

# battle.js：界面战力与内部模拟强度拆开；黄衫女+3600进入实际伤害
rep('src/battle.js',
    "import { HEROES, chapterEnemyPower, towerEnemyPower } from './data.js';",
    "import { HEROES, chapterEnemyPower, towerEnemyPower, chapterEnemyRating, towerEnemyRating } from './data.js';")
rep('src/battle.js',
    "  return { ...base, hpNow:base.hp, rage, alive:true, shield:0, reviveUsed:0 };",
    "  return { ...base, hpNow:base.hp, rage, alive:true, shield:0, reviveUsed:0, abnormalImmuneThroughRound:base.passive?.firstRoundAbnormalImmune?1:0 };" )
rep('src/battle.js',
    "return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });",
    "return cloneFighter({ id,name:tpl.name,side:'player',...s,dodge:Number(s.dodge||0)+Number(dodgeStart?.value||0),skill:tpl.skill,passive:tpl.passive||{},effects,initialRage:Number(s.initialRage||0)+Number(rageEffect?.initialRage||0) });")
rep('src/battle.js',
    "const wasAlive=target.alive;applyDamage(target,hit.amount,log);total+=hit.amount;",
    "const wasAlive=target.alive,flat=useSkill?Number(action.flatDamage||0):0,amount=hit.amount+flat;applyDamage(target,amount,log);total+=amount;")
rep('src/battle.js',
    "const back=Math.round(hit.amount*reflect.ratio);",
    "const back=Math.round(amount*reflect.ratio);")
rep('src/battle.js',
    "function simulate(player,enemies,maxRounds=20){\n  const log=[];",
    "function simulate(player,enemies,maxRounds=20){\n  const log=[];\n  const firstRoundImmune=player.filter(x=>x.abnormalImmuneThroughRound>=1);\n  if(firstRoundImmune.length)log.push(`${firstRoundImmune.map(x=>x.name).join('、')}首回合免疫异常状态。`);")
rep('src/battle.js',
    "export function runChapterBattle(state){const power=chapterEnemyPower(state.player.chapter);return {...simulate(playerTeam(state),makeEnemyTeam(power,'元兵')),enemyPower:power};}\nexport function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:power,floor};}",
    "export function runChapterBattle(state){const power=chapterEnemyPower(state.player.chapter),rating=chapterEnemyRating(state.player.chapter);return {...simulate(playerTeam(state),makeEnemyTeam(power,'元兵')),enemyPower:rating};}\nexport function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor),rating=towerEnemyRating(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:rating,floor};}")

# app.js：速战固定连续5次；客栈直接展示定向招募/奇侠兑换
rep('src/app.js',
    "const LEGEND_EXCHANGE_WEIGHTS=[[1,1100],[2,1200],[3,1200],[4,1100],[5,1100],[6,1100],[7,1100],[8,900],[9,900],[10,50],[11,50],[12,50],[13,50],[14,50],[15,50]];",
    "const LEGEND_EXCHANGE_WEIGHTS=[[1,1100],[2,1200],[3,1200],[4,1100],[5,1100],[6,1100],[7,1100],[8,900],[9,900],[10,50],[11,50],[12,50],[13,50],[14,50],[15,50]];\nconst DIRECT_RECRUIT_IDS=['yangxiao','yangdingtian','guoxiang','zhangsanfeng','duer','dunan','dujie','huiyue'];\nconst SPECIAL_EXCHANGE_IDS=['yangguo','huangrong','xiaolongnv','guojing','zhoubotong'];")
rep('src/app.js',
    "<section class=\"card\"><div class=\"section-title\"><h3>主线</h3><small>第${state.player.chapter}幕</small></div><div class=\"notice\">首次挑战不消耗体力。等级不足时，可用速战消耗5体力获取经验。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn btn-primary\" data-action=\"chapter\">挑战第${state.player.chapter}幕</button><button class=\"btn btn-gold\" data-action=\"quick\">速战 · 5体力</button></div></section>",
    "<section class=\"card\"><div class=\"section-title\"><h3>主线</h3><small>第${state.player.chapter}幕</small></div><div class=\"notice\">首次挑战不消耗体力。速战按原版单次5体力，本单机版按钮一次连续结算5次，共25体力。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn btn-primary\" data-action=\"chapter\">挑战第${state.player.chapter}幕</button><button class=\"btn btn-gold\" data-action=\"quick\" ${state.player.stamina<25?'disabled':''}>速战5次 · 25体力</button></div></section>")
rep('src/app.js',
    "function quickBattle(){if(state.player.stamina<5)return alert('体力不足。');state.player.stamina-=5;state.daily.quickBattles+=1;const exp=260+state.player.chapter*44,copper=10000+state.player.chapter*900;addPlayerExp(state,exp);state.player.copper+=copper;commit();alert(`速战完成：经验 +${fmt(exp)}，铜钱 +${fmt(copper)}。`);}",
    "function quickBattle(){const times=5,cost=times*5;if(state.player.stamina<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);state.player.stamina-=cost;state.daily.quickBattles+=times;const oneExp=260+state.player.chapter*44,oneCopper=10000+state.player.chapter*900,exp=oneExp*times,copper=oneCopper*times;addPlayerExp(state,exp);state.player.copper+=copper;commit();alert(`连续速战5次完成：经验 +${fmt(exp)}，铜钱 +${fmt(copper)}，体力 -${cost}。`);}")

p=Path('src/app.js');s=p.read_text()
start=s.find('function renderInnCard(){')
end=s.find('function renderMore(){',start)
if start<0 or end<0: raise SystemExit('renderInnCard block not found')
new_inn=r'''function innRecruitRow(id){const tpl=HEROES[id],h=state.heroes[id],owned=!!h?.owned,open=state.player.chapter>=Number(tpl.unlock||0),r=tpl.recruit;if(!r)return '';let status='';if(owned)status='<span class="tag">已招募</span>';else if(!open)status=`<span class="muted">第${tpl.unlock}幕开放</span>`;else if(r.type==='legendToken')status=`<button class="btn ${state.player.legendTokens>=r.cost?'btn-primary':''}" data-recruit-hero="${id}" ${state.player.legendTokens>=r.cost?'':'disabled'}>${fmt(r.cost)}传奇令</button>`;else if(r.type==='special'){const have=Number(state.specials?.[r.item]||0);status=`<div style="text-align:right"><div class="hero-meta">${r.item} ${fmt(have)}/${fmt(r.cost)}</div><button class="btn ${have>=r.cost?'btn-gold':''}" data-recruit-hero="${id}" ${have>=r.cost?'':'disabled'}>兑换</button></div>`;}return `<div class="list-row"><div><b>${tpl.name}</b><div class="hero-meta">${r.type==='legendToken'?`第${tpl.unlock}幕 · ${fmt(r.cost)}传奇招募令`:`第${tpl.unlock}幕 · ${r.item}×${fmt(r.cost)}`}</div></div>${status}</div>`;}
function renderInnCard(){return `<section class="card"><div class="section-title"><h3>客栈</h3><small>兑换 · 定向招募 · 奇侠兑换</small></div><div class="grid-2"><div class="mini-stat"><div class="muted">侠客信物</div><div class="big-number small">${fmt(state.player.heroTokens)}</div></div><div class="mini-stat"><div class="muted">传奇招募令</div><div class="big-number small">${fmt(state.player.legendTokens)}</div></div></div><div class="notice" style="margin-top:10px">侠客信物每10个兑换1次传奇招募令，保留1～15倍暴击。兑换出招募令后，不需要再去侠客页找入口，下面直接定向招募。</div><div class="action-row" style="margin-top:10px"><button class="btn btn-primary" data-exchange-legend="1" ${state.player.heroTokens<10?'disabled':''}>兑换1次</button><button class="btn btn-gold" data-exchange-legend="10" ${state.player.heroTokens<100?'disabled':''}>连续10次</button></div><div class="section-title" style="margin-top:14px"><h3>传奇定向招募</h3><small>达到幕数后常驻</small></div>${DIRECT_RECRUIT_IDS.map(innRecruitRow).join('')}<div class="section-title" style="margin-top:14px"><h3>奇侠兑换</h3><small>110幕档</small></div>${SPECIAL_EXCHANGE_IDS.map(innRecruitRow).join('')}</section>`;}
'''
s=s[:start]+new_inn+s[end:]
p.write_text(s)

# 版本与离线缓存
rep('index.html','单机精简版 · V0.10','单机精简版 · V0.11')
rep('sw.js',"const CACHE = 'xinyitian-v0.10.0';","const CACHE = 'xinyitian-v0.11.0';")
rep('sw.js',"  './src/tasks.js',\n  './src/weapons.js',","  './src/tasks.js',\n  './src/power.js',\n  './src/weapons.js',")
