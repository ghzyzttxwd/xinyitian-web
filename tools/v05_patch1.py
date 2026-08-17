from pathlib import Path
p=Path('src/app.js')
s=p.read_text()

s=s.replace(
"  exportSave, importSaveFile, resetSave, recoverStamina, normalizeDaily, recalcVip,\n} from './state.js';",
"  exportSave, importSaveFile, resetSave, recoverStamina, recoverInnerPower, normalizeDaily, recalcVip,\n} from './state.js';")

s=s.replace(
"import { RED_KUNGFU, DIVINE_KUNGFU, KUNGFU_UPGRADE_COPIES, displayEffect } from './kungfu.js';",
"import { RED_KUNGFU, DIVINE_KUNGFU, KUNGFU_UPGRADE_COPIES, displayEffect } from './kungfu.js';\nimport {\n  INNER_POWER_MAX_YEAR, INNER_POWER_OPEN_CHAPTER, INNER_POWER_ROOM_NAMES, INNER_POWER_PER_MINUTE,\n  INNER_POWER_MEDICINES, powerRequiredForYear, breakthroughInfo, calmingPillRateBonus,\n  medicinePower, medicineRatio, innerPowerMilestones, advanceInnerPower, readyBreakthroughYear,\n} from './innerpower.js';")

old="function growthTabs(){return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn\" disabled>内力</button><button class=\"btn\" disabled>神兵</button><button class=\"btn\" disabled>悟道</button></div>`;}"
new="function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER;return `<div class=\"growth-tabs\"><button class=\"btn ${selectedGrowthTab==='meridian'?'btn-gold':''}\" data-growth-tab=\"meridian\">经脉</button><button class=\"btn ${selectedGrowthTab==='kungfu'?'btn-gold':''}\" data-growth-tab=\"kungfu\">功法</button><button class=\"btn ${selectedGrowthTab==='innerPower'?'btn-gold':''}\" data-growth-tab=\"innerPower\" ${innerOpen?'':'disabled'}>内力${innerOpen?'':' · 50幕'}</button><button class=\"btn\" disabled>神兵</button><button class=\"btn\" disabled>悟道</button></div>`;}"
assert old in s
s=s.replace(old,new)

old=""" <section class=\"card\"><div class=\"section-title\"><h3>藏经阁</h3><small>当前功法帖 ${fmt(state.player.kungfuTickets)}</small></div><div class=\"notice\">原版功法帖价格300元宝。当前精简版保留红功法2%稀有掉落；低品质结果暂折算为功法残页。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn\" data-action=\"buyKungfuTicket\">300元宝买1帖</button><button class=\"btn btn-gold\" data-action=\"drawKungfu\" ${state.player.kungfuTickets<1?'disabled':''}>研习1次</button></div><div class=\"hero-meta\" style=\"margin-top:8px\">累计研习 ${fmt(state.kungfu?.drawCount||0)} 次 · 功法残页 ${fmt(state.kungfu?.fragments||0)}</div></section>"""
new=""" <section class=\"card\"><div class=\"section-title\"><h3>藏经阁</h3><small>元宝直接抽取</small></div><div class=\"notice\">300元宝抽1次，1500元宝抽5次。红色功法概率按当前原版元宝抽取的2%处理；低品质结果暂折算为功法残页。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn\" data-action=\"drawKungfu1\" ${state.player.gems<300?'disabled':''}>抽1次 · 300元宝</button><button class=\"btn btn-gold\" data-action=\"drawKungfu5\" ${state.player.gems<1500?'disabled':''}>抽5次 · 1500元宝</button></div><div class=\"hero-meta\" style=\"margin-top:8px\">累计抽取 ${fmt(state.kungfu?.drawCount||0)} 次 · 功法残页 ${fmt(state.kungfu?.fragments||0)}</div></section>"""
assert old in s
s=s.replace(old,new)

marker="function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);pageEl.innerHTML=`<div class=\"section-title\"><h2>养成</h2><small>经脉 · 功法</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${selectedGrowthTab==='kungfu'?renderKungfuPanel():renderMeridianPanel()}`;}"
assert marker in s
inner_code=r'''function formatRemain(ms){const sec=Math.max(0,Math.ceil(ms/1000));if(sec<60)return `${sec}秒`;const min=Math.ceil(sec/60);if(min<60)return `${min}分钟`;return `${Math.floor(min/60)}小时${min%60?`${min%60}分钟`:''}`;}
function innerPowerRoomIndex(heroId){return (state.innerPower?.rooms||[]).indexOf(heroId);}
function renderInnerPowerPanel(){
 recoverInnerPower(state);
 const h=state.heroes[selectedGrowthHero],ip=h.innerPower||{year:0,power:0,recoveryUntil:0,passed:[],medicineUsed:{}},now=Date.now();
 const roomIndex=innerPowerRoomIndex(selectedGrowthHero),emptyRoom=(state.innerPower?.rooms||[]).findIndex(x=>!x),maxed=ip.year>=INNER_POWER_MAX_YEAR;
 const barrier=readyBreakthroughYear(ip),nextYear=maxed?INNER_POWER_MAX_YEAR:Math.min(INNER_POWER_MAX_YEAR,ip.year+1),currentReq=powerRequiredForYear(ip.year),nextReq=powerRequiredForYear(nextYear);
 const segment=Math.max(1,nextReq-currentReq),pct=maxed?100:Math.max(0,Math.min(100,Math.round((ip.power-currentReq)/segment*100)));
 const bInfo=barrier?breakthroughInfo(barrier):null,recoveryLeft=Math.max(0,Number(ip.recoveryUntil||0)-now);
 const milestones=innerPowerMilestones(selectedGrowthHero),unlocked=milestones.filter(x=>x.year<=ip.year),nextSkills=milestones.filter(x=>x.year>ip.year).slice(0,3);
 const rooms=(state.innerPower?.rooms||[]).map((heroId,i)=>`<div class="list-row"><span>${INNER_POWER_ROOM_NAMES[i]}</span><b>${heroId?(HEROES[heroId]?.name||'侠客'):'空闲'}</b></div>`).join('');
 const meds=Object.entries(INNER_POWER_MEDICINES).map(([key,m])=>{const count=Number(state.innerPower?.items?.[key]||0),used=Number(ip.medicineUsed?.[key]||0),ratio=Math.round(medicineRatio(used)*100),gain=medicinePower(key,used),inRange=ip.year>=m.minYear&&ip.year<=m.maxYear&&!maxed;return `<div class="hero-card ${inRange&&count?'':'locked'}"><div class="hero-card-row"><div><div class="hero-name">${m.name} ×${fmt(count)}</div><div class="hero-meta">适用 ${m.minYear}～${m.maxYear}年 · 本次 +${fmt(gain)}内力（${ratio}%）</div><div class="hero-meta">本阶段已服用 ${used} 次</div></div><button class="btn" data-inner-medicine="${key}" ${inRange&&count?'':'disabled'}>服用</button></div></div>`;}).join('');
 return `<section class="card"><div class="section-title"><h3>${HEROES[selectedGrowthHero].name} · 内力</h3><small>上限${INNER_POWER_MAX_YEAR}年</small></div><div class="big-number">${ip.year}年</div><div class="hero-meta">累计内力 ${fmt(ip.power)}${maxed?' · 已达上限':` · 下一年 ${fmt(nextReq)}`}</div><div class="progress" style="margin-top:10px"><i style="width:${pct}%"></i></div><div class="notice" style="margin-top:10px">练功房每分钟获得 ${INNER_POWER_PER_MINUTE} 内力；离线后再次打开游戏会按经过的完整分钟结算。</div></section>
 <section class="card"><div class="section-title"><h3>七大练功房</h3><small>${roomIndex>=0?`当前：${INNER_POWER_ROOM_NAMES[roomIndex]}`:'尚未入房'}</small></div>${rooms}<div class="action-row" style="margin-top:10px">${roomIndex>=0?`<button class="btn btn-danger" data-action="leaveInnerRoom">离开练功房</button>`:`<button class="btn btn-primary" data-action="assignInnerRoom" ${emptyRoom<0?'disabled':''}>进入空闲练功房</button>`}</div></section>
 ${barrier?`<section class="card"><div class="section-title"><h3>${barrier}年瓶颈</h3><small>基础成功率 ${(bInfo.rate*100).toFixed(1)}%</small></div>${recoveryLeft?`<div class="notice">突破失败后正在调息，还需 ${formatRemain(recoveryLeft)}。</div>`:`<div class="notice">突破成功后获得${barrier}年对应内力特性。失败后进入单机压缩调息：${formatRemain(bInfo.recoverySec*1000)}。</div><div class="action-row" style="margin-top:10px"><button class="btn btn-primary" data-action="innerBreakthrough">直接突破</button><button class="btn btn-gold" data-action="innerBreakthroughPill" ${Number(state.innerPower?.items?.dingshen||0)>0?'':'disabled'}>定神丸突破 · +${(calmingPillRateBonus(barrier)/100).toFixed(2)}%</button></div><div class="hero-meta" style="margin-top:8px">定神丸库存 ${fmt(state.innerPower?.items?.dingshen||0)}</div>`}</section>`:''}
 <section class="card"><div class="section-title"><h3>十年特性</h3><small>已解锁 ${unlocked.length}/28</small></div>${unlocked.length?`<div class="notice">最近获得：${unlocked.slice(-3).map(x=>`${x.year}年【${x.name}】${x.desc}`).join('；')}</div>`:'<div class="notice">达到10年并突破后获得第一项内力特性。</div>'}${nextSkills.map(x=>`<div class="list-row"><span>${x.year}年 · ${x.name}</span><small>${x.desc}</small></div>`).join('')}</section>
 <section class="card"><div class="section-title"><h3>内力丹药</h3><small>同类连续服用收益递减</small></div><div class="hero-list">${meds}</div><div class="hero-meta" style="margin-top:8px">丹药、定神丸的稳定产出后续由古墓/炼丹/礼包接入；这里不额外造商店。</div></section>`;
}
function renderGrowth(){ensureGrowthHero();const ownedIds=Object.keys(HEROES).filter(id=>state.heroes[id]?.owned);if(selectedGrowthTab==='innerPower'&&state.player.chapter<INNER_POWER_OPEN_CHAPTER)selectedGrowthTab='meridian';const panel=selectedGrowthTab==='kungfu'?renderKungfuPanel():selectedGrowthTab==='innerPower'?renderInnerPowerPanel():renderMeridianPanel();pageEl.innerHTML=`<div class="section-title"><h2>养成</h2><small>经脉 · 功法 · 内力</small></div>${growthHeroSelector(ownedIds)}${growthTabs()}${panel}`;}'''
s=s.replace(marker,inner_code)

p.write_text(s)
print('patch1 done')