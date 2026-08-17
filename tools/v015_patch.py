from pathlib import Path
import re

def rep(path, old, new):
    p=Path(path)
    s=p.read_text()
    if old not in s:
        raise SystemExit(f"marker missing in {path}: {old[:140]}")
    p.write_text(s.replace(old,new,1))

rep('src/state.js',
'''    atk: Math.round(rawAtk*(1+ip.atkPct/100)*(1+wd.atkPct/100)),
    def: Math.round(rawDef*(1+ip.defPct/100)*(1+wd.defPct/100)),
    hp: Math.round(rawHp*(1+ip.hpPct/100)*(1+wd.hpPct/100)),
    speed: tpl.base.speed + Number(a.speed||0) + Math.floor((h.level - 1) / 10),
    hit: k.hit+ip.hit+wd.hit, dodge: k.dodge+ip.dodge+wd.dodge, crit: k.crit+ip.crit+wd.crit, antiCrit: k.antiCrit+ip.antiCrit+wd.antiCrit,''',
'''    atk: Math.round(rawAtk*(1+ip.atkPct/100)*(1+wd.atkPct/100)*(1+Number(w.atkPct||0)/100)),
    def: Math.round(rawDef*(1+ip.defPct/100)*(1+wd.defPct/100)*(1+Number(w.defPct||0)/100)),
    hp: Math.round(rawHp*(1+ip.hpPct/100)*(1+wd.hpPct/100)*(1+Number(w.hpPct||0)/100)),
    speed: tpl.base.speed + Number(a.speed||0) + Math.floor((h.level - 1) / 10),
    hit: k.hit+ip.hit+wd.hit+Number(w.hit||0), dodge: k.dodge+ip.dodge+wd.dodge+Number(w.dodge||0), crit: k.crit+ip.crit+wd.crit+Number(w.crit||0), antiCrit: k.antiCrit+ip.antiCrit+wd.antiCrit+Number(w.antiCrit||0),''')

rep('src/weapons.js',
"out.power=Math.round(out.atk*4.6+out.def*3.5+out.hp*.7+r.breakthrough*8000+Number(r.smelt||0)*12000);",
"out.power=Math.round(out.atk*4.6+out.def*3.5+out.hp*.7+r.breakthrough*8000);")

rep('src/app.js',
'''  WEAPON_OPEN_LEVEL, WEAPON_MAX_LEVEL, WEAPON_FORGE_COST, WEAPON_TYPES, WEAPONS, FORGE_THEMES,
  strengthenCost, breakthroughNeed, weaponRecord, rollForge,''',
'''  WEAPON_OPEN_LEVEL, WEAPON_MAX_LEVEL, WEAPON_FORGE_COST, WEAPON_TYPES, WEAPONS, FORGE_THEMES,
  WEAPON_SMELT_OPEN_LEVEL, WEAPON_SMELT_MAX, strengthenCost, breakthroughNeed, smeltNeed,
  smeltAttrText, weaponRecord, rollForge,''')

p=Path('src/app.js'); s=p.read_text()
pattern=r"function renderWeaponPanel\(\)\{.*?\nfunction equipWeapon\(id\)"
m=re.search(pattern,s,flags=re.S)
if not m:
    raise SystemExit("renderWeaponPanel block missing")
new_panel=r'''function renderWeaponPanel(){
 const theme=Math.max(0,Math.min(FORGE_THEMES.length-1,Number(state.weapons?.theme||0))),t=FORGE_THEMES[theme],iron=Number(state.weapons?.iron||0),meteor=Number(state.weapons?.meteorIron||0),smeltOpen=state.player.level>=WEAPON_SMELT_OPEN_LEVEL;
 const cards=Object.values(WEAPONS).map(w=>{
  const r=weaponRecord(state,w.id),used=weaponUsedBy(w.id),need=r.breakthrough<5?breakthroughNeed(r.breakthrough):0,cost=strengthenCost(r.level),smelt=Math.max(0,Number(r.smelt||0)),sn=smelt<WEAPON_SMELT_MAX?smeltNeed(smelt):null;
  const canStr=r.owned&&r.level<WEAPON_MAX_LEVEL&&state.player.copper>=cost,canBreak=r.owned&&r.breakthrough<5&&r.copies>=need,canSmelt=r.owned&&smeltOpen&&r.breakthrough>=5&&smelt<WEAPON_SMELT_MAX&&r.copies>=sn.copies&&meteor>=sn.meteorIron;
  return `<div class="hero-card ${r.owned?'':'locked'}"><div class="hero-card-row"><div><div class="hero-name rarity-6">${w.name} ${r.owned?`强化+${r.level} · 突破${r.breakthrough} · 熔铸${smelt}火`:'未获得'}</div><div class="hero-meta">${WEAPON_TYPES[w.slot]} · ${w.effect}</div><div class="hero-meta">同名本体 ${fmt(r.copies)}${used?` · 已装备：${HEROES[used.heroId]?.name||''}`:''}</div>${r.owned?`<div class="hero-meta">熔铸属性：${smeltAttrText(state,w.id)}</div>`:''}</div><div class="action-stack">${r.owned?`<button class="btn ${canStr?'btn-primary':''}" data-strengthen-weapon="${w.id}" ${canStr?'':'disabled'}>强化 · ${fmt(cost)}铜钱</button><button class="btn ${canBreak?'btn-gold':''}" data-breakthrough-weapon="${w.id}" ${canBreak?'':'disabled'}>${r.breakthrough>=5?'已满突破':`突破 · ${need}本`}</button>${smelt<WEAPON_SMELT_MAX?`<button class="btn ${canSmelt?'btn-gold':''}" data-smelt-weapon="${w.id}" ${canSmelt?'':'disabled'}>熔铸${smelt+1}火 · ${sn.copies}本 + ${sn.meteorIron}陨铁</button>`:'<button class="btn btn-gold" disabled>熔铸3火圆满</button>'}<button class="btn" data-equip-weapon="${w.id}" ${used?.heroId===selectedGrowthHero?'disabled':''}>${used?.heroId===selectedGrowthHero?'已装备':'装备'}</button>`:''}</div></div></div>`;
 }).join('');
 return `<section class="card"><div class="section-title"><h3>${HEROES[selectedGrowthHero].name} · 神兵</h3><small>四部位</small></div>${weaponSlotsHtml()}<div class="notice" style="margin-top:10px">神兵培养：强化 + 突破1～5 + 熔铸1～3。原版熔铸需突破5且Lv.${WEAPON_SMELT_OPEN_LEVEL}开放；1/2/3火依次消耗同名本体5/10/15件与天外陨铁500/800/1200。</div></section>
 <section class="card"><div class="section-title"><h3>神兵锻造</h3><small>精铁 ${fmt(iron)} · 天外陨铁 ${fmt(meteor)}</small></div><div class="action-row">${FORGE_THEMES.map((x,i)=>`<button class="btn ${i===theme?'btn-gold':''}" data-weapon-theme="${i}">${x.name}</button>`).join('')}</div><div class="notice" style="margin-top:10px">当前主题：${t.name}。重点产出【${WEAPONS[t.featured].name}】，并可获得【${WEAPONS[t.secondary].name}】等神兵。</div><div class="action-row" style="margin-top:10px"><button class="btn" data-action="buyWeaponIron" ${state.player.gems<100?'disabled':''}>100元宝换100精铁</button><button class="btn" data-action="buyMeteorIron" ${state.player.gems<1000?'disabled':''}>1000元宝换100天外陨铁</button><button class="btn btn-primary" data-action="forgeWeapon" ${iron<WEAPON_FORGE_COST?'disabled':''}>锻造1次 · ${WEAPON_FORGE_COST}精铁</button></div><div class="hero-meta" style="margin-top:8px">精铁：千宝塔每10层+20。天外陨铁：千宝塔每100层+100；1000元宝换100陨铁为删去活动商店后的单机V1常驻迁移值，并非原版商店价格。</div></section>
 <div class="section-title"><h3>神兵库</h3><small>${Object.values(state.weapons?.items||{}).filter(x=>x.owned).length}/${Object.keys(WEAPONS).length}</small></div><div class="hero-list">${cards}</div>`;
}
function equipWeapon(id)'''
s=s[:m.start()]+new_panel+s[m.end():]
p.write_text(s)

rep('src/app.js',
'''function breakthroughWeapon(id){const r=weaponRecord(state,id);if(!r.owned||r.breakthrough>=5)return;const need=breakthroughNeed(r.breakthrough);if(r.copies<need)return alert(`同名神兵不足，需要${need}件。`);r.copies-=need;r.breakthrough+=1;commit();alert(`${WEAPONS[id].name}突破至${r.breakthrough}级。`);}
function buyWeaponIron(){''',
'''function breakthroughWeapon(id){const r=weaponRecord(state,id);if(!r.owned||r.breakthrough>=5)return;const need=breakthroughNeed(r.breakthrough);if(r.copies<need)return alert(`同名神兵不足，需要${need}件。`);r.copies-=need;r.breakthrough+=1;commit();alert(`${WEAPONS[id].name}突破至${r.breakthrough}级。`);}
function smeltWeapon(id){const r=weaponRecord(state,id);if(!r.owned)return;if(state.player.level<WEAPON_SMELT_OPEN_LEVEL)return alert(`神兵熔铸需要玩家Lv.${WEAPON_SMELT_OPEN_LEVEL}。`);if(Number(r.breakthrough||0)<5)return alert('神兵突破5后才能熔铸。');const stage=Number(r.smelt||0);if(stage>=WEAPON_SMELT_MAX)return;const need=smeltNeed(stage),meteor=Number(state.weapons?.meteorIron||0);if(r.copies<need.copies)return alert(`同名神兵不足，需要${need.copies}件。`);if(meteor<need.meteorIron)return alert(`天外陨铁不足，需要${need.meteorIron}。`);r.copies-=need.copies;state.weapons.meteorIron=meteor-need.meteorIron;r.smelt=stage+1;bumpDaily(state,'weapon');commit();alert(`${WEAPONS[id].name}熔铸${r.smelt}火成功：${smeltAttrText(state,id)}`);}
function buyWeaponIron(){''')
rep('src/app.js',
"function buyWeaponIron(){if(state.player.gems<100)return alert('元宝不足。');state.player.gems-=100;state.weapons.iron=Number(state.weapons.iron||0)+100;commit();}",
"function buyWeaponIron(){if(state.player.gems<100)return alert('元宝不足。');state.player.gems-=100;state.weapons.iron=Number(state.weapons.iron||0)+100;commit();}\nfunction buyMeteorIron(){if(state.player.gems<1000)return alert('元宝不足。');state.player.gems-=1000;state.weapons.meteorIron=Number(state.weapons.meteorIron||0)+100;commit();}")

rep('src/app.js',
"copper=8000+result.floor*1200,iron=result.floor%10===0?20:0;",
"copper=8000+result.floor*1200,iron=result.floor%10===0?20:0,meteorIron=result.floor%100===0?100:0;")
rep('src/app.js',
"state.weapons.iron=Number(state.weapons.iron||0)+iron;state.player.breakthroughPills",
"state.weapons.iron=Number(state.weapons.iron||0)+iron;state.weapons.meteorIron=Number(state.weapons.meteorIron||0)+meteorIron;state.player.breakthroughPills")
rep('src/app.js',
"if(iron)reward+=` · 精铁 +${iron}`;if(result.floor%100===0)",
"if(iron)reward+=` · 精铁 +${iron}`;if(meteorIron)reward+=` · 天外陨铁 +${meteorIron}`;if(result.floor%100===0)")

rep('src/app.js',
"if(btn.dataset.breakthroughWeapon){breakthroughWeapon(btn.dataset.breakthroughWeapon);return;}if(btn.dataset.buySoul)",
"if(btn.dataset.breakthroughWeapon){breakthroughWeapon(btn.dataset.breakthroughWeapon);return;}if(btn.dataset.smeltWeapon){smeltWeapon(btn.dataset.smeltWeapon);return;}if(btn.dataset.buySoul)")
rep('src/app.js',
"if(action==='buyWeaponIron')buyWeaponIron();if(action==='forgeWeapon')forgeWeapon();",
"if(action==='buyWeaponIron')buyWeaponIron();if(action==='buyMeteorIron')buyMeteorIron();if(action==='forgeWeapon')forgeWeapon();")

rep('index.html','单机精简版 · V0.14','单机精简版 · V0.15')
rep('sw.js',"const CACHE = 'xinyitian-v0.14.0';","const CACHE = 'xinyitian-v0.15.0';")
