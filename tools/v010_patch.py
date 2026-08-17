from pathlib import Path


def rep(path, old, new):
    p=Path(path);s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:160]}')
    p.write_text(s.replace(old,new,1))

# state.js：任务存档、每日重置与旧档兼容
rep('src/state.js',
    "import { createWudaoState, wudaoBonuses } from './wudao.js';",
    "import { createWudaoState, wudaoBonuses } from './wudao.js';\nimport { createTasksState, createDailyTaskFields, ensureTaskState } from './tasks.js';")
rep('src/state.js',
    "    wudao:createWudaoState(),\n    recharge:",
    "    wudao:createWudaoState(),\n    tasks:createTasksState(),\n    recharge:")
rep('src/state.js',
    "    daily: { date: localDateKey(), staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0 },",
    "    daily: { date: localDateKey(), staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0, ...createDailyTaskFields() },")
old_norm="""export function normalizeDaily(state) {
  const today = localDateKey();
  if (state.daily.date !== today) {
    state.daily = { date: today, staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0 };
    if (state.ancientTomb) state.ancientTomb.attemptsToday = ANCIENT_TOMB_DAILY_ATTEMPTS;
  }
}"""
new_norm="""export function normalizeDaily(state) {
  const today = localDateKey();
  if (state.daily.date !== today) {
    state.daily = { date: today, staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0, wudaoShopBuys: 0, ...createDailyTaskFields() };
    if (state.ancientTomb) state.ancientTomb.attemptsToday = ANCIENT_TOMB_DAILY_ATTEMPTS;
  }
  ensureTaskState(state);
}"""
rep('src/state.js',old_norm,new_norm)

# app.js：导入任务配置
rep('src/app.js',
    "} from './wudao.js';",
    "} from './wudao.js';\nimport {\n  DAILY_TASKS, DAILY_ACTIVITY_REWARDS, GROWTH_TASKS, ensureTaskState, bumpDaily,\n  dailyTaskProgress, dailyActivity, growthTaskProgress, grantTaskReward, taskRewardText,\n} from './tasks.js';")

# 各核心玩法计入当日任务
rep('src/app.js',"m.progress=Number(m.progress||0)+1;commit();}","m.progress=Number(m.progress||0)+1;bumpDaily(state,'meridian');commit();}")
rep('src/app.js',"rec.copies-=need;rec.level+=1;commit();}","rec.copies-=need;rec.level+=1;bumpDaily(state,'kungfu');commit();}")
rep('src/app.js',"}commit();const redText=reds.length?", "}bumpDaily(state,'scripture',n);commit();const redText=reds.length?")
rep('src/app.js',"if(wudaoGain)reward+=` · 悟道丹 +${wudaoGain}`;commit();}","if(wudaoGain)reward+=` · 悟道丹 +${wudaoGain}`;bumpDaily(state,'tower');commit();}")
rep('src/app.js',"state.player.copper-=cost;h.level+=1;commit();}","state.player.copper-=cost;h.level+=1;bumpDaily(state,'hero');commit();}")
rep('src/app.js',"state.player.legendTokens+=gained;commit();alert(`客栈兑换", "state.player.legendTokens+=gained;bumpDaily(state,'inn',actual);commit();alert(`客栈兑换")
rep('src/app.js',"state.player.copper-=cost;r.level+=1;commit();}","state.player.copper-=cost;r.level+=1;bumpDaily(state,'weapon');commit();}")
rep('src/app.js',"ip.power=Number(ip.power||0)+gain;advanceInnerPower(ip);commit();alert", "ip.power=Number(ip.power||0)+gain;advanceInnerPower(ip);bumpDaily(state,'inner');commit();alert")
rep('src/app.js',"const info=breakthroughInfo(year);let rate=info.rateBp;", "bumpDaily(state,'inner');const info=breakthroughInfo(year);let rate=info.rateBp;")
rep('src/app.js',"if(result.win){state.ancientTomb.highest=floor;reward=applyAncientTombReward(floor,true);}","if(result.win){state.ancientTomb.highest=floor;reward=applyAncientTombReward(floor,true);bumpDaily(state,'tomb');}")
rep('src/app.js',"const reward=applyAncientTombReward(state.ancientTomb.highest,false);commit();alert(`古墓速战完成", "const reward=applyAncientTombReward(state.ancientTomb.highest,false);bumpDaily(state,'tomb');commit();alert(`古墓速战完成")

# 任务中心UI + 领取逻辑
marker="function rechargeHtml(){return RECHARGE_PACKS.map"
insert=r'''function claimActivityReward(threshold){ensureTaskState(state);const node=DAILY_ACTIVITY_REWARDS.find(x=>x.threshold===Number(threshold));if(!node)return;if(state.daily.activityClaimed.includes(node.threshold))return;if(dailyActivity(state)<node.threshold)return alert('今日活跃度还没达到这个档位。');grantTaskReward(state,node.reward);state.daily.activityClaimed.push(node.threshold);commit();alert(`活跃奖励领取：${taskRewardText(node.reward)}`);}
function claimGrowthTask(id){ensureTaskState(state);const task=GROWTH_TASKS.find(x=>x.id===id);if(!task||state.tasks.growthClaimed.includes(id))return;const progress=growthTaskProgress(state,task);if(progress<task.target)return alert('成长条件尚未完成。');state.tasks.growthClaimed.push(id);addPlayerExp(state,task.exp);commit();alert(`成长任务完成：玩家经验 +${fmt(task.exp)}。`);}
function renderDailyTasks(){ensureTaskState(state);const activity=dailyActivity(state),pct=Math.min(100,Math.round(activity/1000*100));const rows=DAILY_TASKS.map(t=>{const p=dailyTaskProgress(state,t),done=p>=t.target;return `<div class="list-row"><div><b>${t.name}</b><div class="hero-meta">${t.desc}</div></div><div style="text-align:right"><b>${Math.min(p,t.target)}/${t.target}</b><div class="hero-meta">${done?`已完成 · +${t.activity}活跃`:`+${t.activity}活跃`}</div></div></div>`;}).join('');const nodes=DAILY_ACTIVITY_REWARDS.map(n=>{const claimed=state.daily.activityClaimed.includes(n.threshold),can=activity>=n.threshold;return `<div class="list-row"><div><b>${n.threshold}活跃</b><div class="hero-meta">${taskRewardText(n.reward)}</div></div><button class="btn ${can&&!claimed?'btn-gold':''}" data-claim-activity="${n.threshold}" ${can&&!claimed?'':'disabled'}>${claimed?'已领取':'领取'}</button></div>`;}).join('');return `<section class="card"><div class="section-title"><h3>每日任务</h3><small>${Math.min(activity,1000)}/1000活跃</small></div><div class="progress"><i style="width:${pct}%"></i></div><div class="notice" style="margin-top:10px">11项任务每项130活跃，完成任意8项即可超过1000活跃，不要求全部清空。</div><div style="margin-top:8px">${rows}</div><div class="section-title" style="margin-top:12px"><h3>活跃奖励</h3><small>每日重置</small></div>${nodes}<div class="hero-meta" style="margin-top:8px">当前单项活跃值和宝箱具体资源为单机V1暂定配置，后续统一经济校准。</div></section>`;}
function renderGrowthTasks(){ensureTaskState(state);const claimed=new Set(state.tasks.growthClaimed||[]),left=GROWTH_TASKS.filter(t=>!claimed.has(t.id)),shown=left.slice(0,8),claimedCount=GROWTH_TASKS.length-left.length;const rows=shown.map(t=>{const p=growthTaskProgress(state,t),done=p>=t.target;return `<div class="list-row"><div><b>${t.name}</b><div class="hero-meta">${t.desc} · 玩家经验 +${fmt(t.exp)}</div></div><div style="text-align:right"><div class="hero-meta">${Math.min(p,t.target)}/${t.target}</div><button class="btn ${done?'btn-primary':''}" data-claim-growth="${t.id}" ${done?'':'disabled'}>领取</button></div></div>`;}).join('');return `<section class="card"><div class="section-title"><h3>成长任务</h3><small>${claimedCount}/${GROWTH_TASKS.length}</small></div><div class="notice">把原版绑定游历、战功、PVP等废系统的成长经验迁到现有核心玩法。18组任务合计约171.8万玩家经验。</div>${rows||'<div class="battle-win" style="margin-top:10px">当前18组成长任务已全部领取</div>'}${left.length>8?`<div class="hero-meta" style="margin-top:8px">完成/领取前面的任务后继续显示后续目标。</div>`:''}</section>`;}
function renderTaskCenter(){return `${renderDailyTasks()}${renderGrowthTasks()}`;}

'''
p=Path('src/app.js');s=p.read_text()
if marker not in s: raise SystemExit('task UI marker not found')
p.write_text(s.replace(marker,insert+marker,1))

# 更多页加入任务中心
rep('src/app.js',"<div class=\"section-title\"><h2>更多</h2><small>客栈 · 神品 · 充值 · 资源 · 存档</small></div>${renderInnCard()}${renderSoulStoneStore()}${renderWudaoStore()}","<div class=\"section-title\"><h2>更多</h2><small>任务 · 客栈 · 神品 · 充值 · 存档</small></div>${renderInnCard()}${renderTaskCenter()}${renderSoulStoneStore()}${renderWudaoStore()}")

# 点击领取
rep('src/app.js',"if(btn.dataset.awakenHero){awakenHero(btn.dataset.awakenHero);return;}if(btn.dataset.innerMedicine)","if(btn.dataset.awakenHero){awakenHero(btn.dataset.awakenHero);return;}if(btn.dataset.claimActivity){claimActivityReward(Number(btn.dataset.claimActivity));return;}if(btn.dataset.claimGrowth){claimGrowthTask(btn.dataset.claimGrowth);return;}if(btn.dataset.innerMedicine)")

# 版本与缓存
rep('index.html','单机精简版 · V0.9','单机精简版 · V0.10')
rep('sw.js',"const CACHE = 'xinyitian-v0.9.0';","const CACHE = 'xinyitian-v0.10.0';")
rep('sw.js',"  './src/wudao.js',\n  './src/weapons.js',","  './src/wudao.js',\n  './src/tasks.js',\n  './src/weapons.js',")
