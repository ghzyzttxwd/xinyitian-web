from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:120]}')
    p.write_text(s.replace(old,new,1))

# state.js
rep('src/state.js',
    "import { createWeaponState, equippedWeaponBonuses } from './weapons.js';",
    "import { createWeaponState, equippedWeaponBonuses } from './weapons.js';\nimport { createAncientTombState, ANCIENT_TOMB_DAILY_ATTEMPTS } from './ancienttomb.js';")
rep('src/state.js',
    "    ancientTomb: { highest: 0, attemptsToday: 1 },",
    "    ancientTomb: createAncientTombState(),")
rep('src/state.js',
    "    if (state.ancientTomb) state.ancientTomb.attemptsToday = 1;",
    "    if (state.ancientTomb) state.ancientTomb.attemptsToday = ANCIENT_TOMB_DAILY_ATTEMPTS;")

# battle.js
rep('src/battle.js',
    "export function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:power,floor};}",
    "export function runTowerBattle(state){const floor=state.tower.highest+1,power=towerEnemyPower(floor);return {...simulate(playerTeam(state),makeEnemyTeam(power,'守塔人')),enemyPower:power,floor};}\nexport function runAncientTombBattle(state,floor,power){return {...simulate(playerTeam(state),makeEnemyTeam(power,'古墓守卫')),enemyPower:power,floor};}")

# app.js imports
rep('src/app.js',
    "import { runChapterBattle, runTowerBattle } from './battle.js';",
    "import { runChapterBattle, runTowerBattle, runAncientTombBattle } from './battle.js';")
rep('src/app.js',
    "} from './weapons.js';",
    "} from './weapons.js';\nimport {\n  ANCIENT_TOMB_OPEN_CHAPTER, ANCIENT_TOMB_MAX_FLOOR, ANCIENT_TOMB_MATERIALS,\n  ancientTombPower, rollAncientTombReward,\n} from './ancienttomb.js';")

old_challenge="function renderChallenge(){const next=state.tower.highest+1;pageEl.innerHTML=`<div class=\"section-title\"><h2>挑战</h2><small>长期战力检验</small></div><section class=\"card\"><span class=\"tag\">永久爬塔</span><h3>少林千宝塔</h3><div class=\"big-number\">${state.tower.highest}层</div><div class=\"muted\">下一层：${next}层。按原版层数曲线产出经脉丹，每50层稳定获得突破丹。</div><button class=\"btn btn-primary btn-block\" data-action=\"tower\" style=\"margin-top:12px\">挑战第${next}层</button></section><section class=\"card locked\"><span class=\"tag\">中后期</span><h3>古墓奇遇</h3><div class=\"muted\">六人单机挑战，主要产出内力材料和鸳鸯刀。后续阶段接入。</div><button class=\"btn btn-block\" disabled style=\"margin-top:12px\">尚未开放</button></section>`;}"
new_challenge=r'''function grantWeaponCopies(id,count=1){const r=weaponRecord(state,id);let n=Math.max(0,Number(count)||0);if(!r.owned&&n>0){r.owned=true;r.level=1;n--;}r.copies=Number(r.copies||0)+n;}
function applyAncientTombReward(floor,firstClear=false){const r=rollAncientTombReward(floor,{firstClear});state.ancientTomb.materials=state.ancientTomb.materials||{};const parts=[];for(const [key,count] of Object.entries(r.materials)){state.ancientTomb.materials[key]=Number(state.ancientTomb.materials[key]||0)+count;parts.push(`${ANCIENT_TOMB_MATERIALS[key]} +${count}`);}state.innerPower.items[r.medicineKey]=Number(state.innerPower.items[r.medicineKey]||0)+r.medicineCount;parts.push(`${INNER_POWER_MEDICINES[r.medicineKey].name} +${r.medicineCount}`);if(r.calmingPills){state.innerPower.items.dingshen=Number(state.innerPower.items.dingshen||0)+r.calmingPills;parts.push(`定神丸 +${r.calmingPills}`);}if(r.speedTickets){state.ancientTomb.speedTickets=Number(state.ancientTomb.speedTickets||0)+r.speedTickets;parts.push(`古墓速战卷 +${r.speedTickets}`);}if(r.yuanyangCopies){grantWeaponCopies('yuanyang',r.yuanyangCopies);parts.push(`鸳鸯刀 +${r.yuanyangCopies}`);}return parts.join(' · ');}
function challengeAncientTomb(){if(state.player.chapter<ANCIENT_TOMB_OPEN_CHAPTER)return alert(`古墓奇遇第${ANCIENT_TOMB_OPEN_CHAPTER}幕开放。`);if(!hasParty())return alert('当前没有上阵侠客。');if(state.ancientTomb.highest>=ANCIENT_TOMB_MAX_FLOOR)return alert('古墓450层已经全部通关。');if(Number(state.ancientTomb.attemptsToday||0)<=0)return alert('今日古墓正式挑战次数已用完。');const floor=state.ancientTomb.highest+1,power=ancientTombPower(floor);state.ancientTomb.attemptsToday-=1;const result=runAncientTombBattle(state,floor,power);let reward='';if(result.win){state.ancientTomb.highest=floor;reward=applyAncientTombReward(floor,true);}commit();showBattle(result,`古墓奇遇 · ${floor}层`,reward);}
function speedAncientTomb(){if(state.player.chapter<ANCIENT_TOMB_OPEN_CHAPTER)return;if(state.ancientTomb.highest<=0)return alert('至少先通关古墓1层。');if(Number(state.ancientTomb.speedTickets||0)<=0)return alert('古墓速战卷不足。');state.ancientTomb.speedTickets-=1;const reward=applyAncientTombReward(state.ancientTomb.highest,false);commit();alert(`古墓速战完成：${reward}`);}
function renderAncientTombCard(){const t=state.ancientTomb||{},open=state.player.chapter>=ANCIENT_TOMB_OPEN_CHAPTER,done=Number(t.highest||0)>=ANCIENT_TOMB_MAX_FLOOR,next=Math.min(ANCIENT_TOMB_MAX_FLOOR,Number(t.highest||0)+1),power=ancientTombPower(next),materials=Object.entries(ANCIENT_TOMB_MATERIALS).map(([k,n])=>`${n}${fmt(t.materials?.[k]||0)}`).join(' · ');return `<section class="card ${open?'':'locked'}"><div class="section-title"><div><span class="tag">内力资源区</span><h3>古墓奇遇</h3></div><small>今日挑战 ${fmt(t.attemptsToday||0)}次</small></div><div class="big-number">${fmt(t.highest||0)}层</div><div class="muted">${done?'450层全部通关':`下一层 ${next} · 推荐战力约 ${fmt(power)}`}</div><div class="notice" style="margin-top:10px">六人单机挑战。主要产出内力药材、内力散、定神丸；30/50/100...450层首次到达可获得鸳鸯刀。</div><div class="hero-meta" style="margin-top:8px">药材：${materials}</div><div class="hero-meta">古墓速战卷 ${fmt(t.speedTickets||0)}</div><div class="action-row" style="margin-top:10px"><button class="btn btn-primary" data-action="ancientTomb" ${open&&!done&&Number(t.attemptsToday||0)>0?'':'disabled'}>${open?done?'已通关':`挑战${next}层`:`第${ANCIENT_TOMB_OPEN_CHAPTER}幕开放`}</button><button class="btn btn-gold" data-action="ancientTombSpeed" ${open&&Number(t.highest||0)>0&&Number(t.speedTickets||0)>0?'':'disabled'}>速战已通关层</button></div></section>`;}
function renderChallenge(){const next=state.tower.highest+1;pageEl.innerHTML=`<div class="section-title"><h2>挑战</h2><small>长期战力检验</small></div><section class="card"><span class="tag">永久爬塔</span><h3>少林千宝塔</h3><div class="big-number">${state.tower.highest}层</div><div class="muted">下一层：${next}层。按原版层数曲线产出经脉丹，每50层稳定获得突破丹。</div><button class="btn btn-primary btn-block" data-action="tower" style="margin-top:12px">挑战第${next}层</button></section>${renderAncientTombCard()}`;}'''
rep('src/app.js',old_challenge,new_challenge)

rep('src/app.js',
    "if(action==='tower')challengeTower();",
    "if(action==='tower')challengeTower();if(action==='ancientTomb')challengeAncientTomb();if(action==='ancientTombSpeed')speedAncientTomb();")

# version/cache
rep('index.html','单机精简版 · V0.6','单机精简版 · V0.7')
rep('sw.js',"const CACHE = 'xinyitian-v0.6.0';","const CACHE = 'xinyitian-v0.7.0';")
rep('sw.js',"  './src/innerpower.js',\n  './src/weapons.js',","  './src/innerpower.js',\n  './src/ancienttomb.js',\n  './src/weapons.js',")
