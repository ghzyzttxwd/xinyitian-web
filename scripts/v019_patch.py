from pathlib import Path
import re

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'{label}: target not found')
    return text.replace(old, new, 1)

# ---- meridians: quality-based initial talent ----
path = 'src/meridians.js'
s = read(path)
first = "export const MERIDIAN_POINT_NAMES = ['经渠','太渊','鱼际','少商','中府','云门','天府','侠白','孔最','命门'];"
insert = """// 用户确认原版侠客按品质自带初始天赋；现有提取档案没有保留 xiake 表的精确初始值。\n// V0.19 先用单机V1暂定分档，后续若重新取得 v580 原表，只需替换本配置。\nexport const BASE_TALENT_BY_RARITY = Object.freeze({3:140,4:160,5:180,6:200,7:220});\nexport function baseTalentForRarity(rarity){\n  const r=Math.max(0,Math.floor(Number(rarity)||0));\n  if(r>=7)return 220;\n  return Number(BASE_TALENT_BY_RARITY[r]||0);\n}\n\nexport const MERIDIAN_POINT_NAMES = ['经渠','太渊','鱼际','少商','中府','云门','天府','侠白','孔最','命门'];"""
s = replace_once(s, first, insert, 'meridians base talent')
write(path, s)

# ---- state: total talent affects inner-power talent scaling ----
path = 'src/state.js'
s = read(path)
s = replace_once(s,
    "import { createVipExtras } from './vip.js';\nimport { storyHeroProfile } from './story.js';",
    "import { createVipExtras } from './vip.js';\nimport { baseTalentForRarity } from './meridians.js';\nimport { storyHeroProfile } from './story.js';",
    'state meridian import')
s = replace_once(s,
    "import { createAwakeningState, awakeningBaseMultiplier } from './awakening.js';",
    "import { createAwakeningState, awakeningBaseMultiplier, effectiveHeroProfile } from './awakening.js';",
    'state effective profile import')
marker = "export function heroStats(state, heroId) {"
helper = """export function heroTalent(state, heroId) {\n  const base=HEROES[heroId],h=state.heroes?.[heroId];\n  if(!base||!h)return 0;\n  const tpl=storyHeroProfile(state,heroId,effectiveHeroProfile(state,heroId,base));\n  return baseTalentForRarity(tpl?.rarity||base.rarity)+Number(h.meridian?.talent||0);\n}\n\nexport function heroStats(state, heroId) {"""
s = replace_once(s, marker, helper, 'state heroTalent helper')
s = replace_once(s,
    "  const ip = innerPowerBonuses(heroId,h.innerPower,meridian.talent||0);",
    "  const ip = innerPowerBonuses(heroId,h.innerPower,heroTalent(state,heroId));",
    'state inner power total talent')
write(path, s)

# ---- app: talent display/slots + Jianghu hub ----
path = 'src/app.js'
s = read(path)
s = replace_once(s,
    "  loadState, saveState, addPlayerExp, heroPower, totalPower, heroStats, ownHero,",
    "  loadState, saveState, addPlayerExp, heroPower, totalPower, heroStats, heroTalent, ownHero,",
    'app heroTalent import')
s = replace_once(s,
    "import { getMeridianPoint, kungfuSlotsForTalent, MERIDIAN_TOTAL_POINTS } from './meridians.js';",
    "import { getMeridianPoint, kungfuSlotsForTalent, MERIDIAN_TOTAL_POINTS, baseTalentForRarity } from './meridians.js';",
    'app base talent import')
s = replace_once(s,
    "let state=loadState(), currentPage='home', selectedGrowthHero='player', selectedGrowthTab='meridian', heroFilter='all', heroDetailId=null;",
    "let state=loadState(), currentPage='home', selectedGrowthHero='player', selectedGrowthTab='meridian', heroFilter='all', heroDetailId=null, moreSection='hub';",
    'app more state')
s = replace_once(s,
    "const profileOf=id=>storyHeroProfile(state,id,effectiveHeroProfile(state,id,HEROES[id]));",
    "const profileOf=id=>storyHeroProfile(state,id,effectiveHeroProfile(state,id,HEROES[id]));\nconst baseTalentOf=id=>baseTalentForRarity(profileOf(id)?.rarity||HEROES[id]?.rarity||0);",
    'app baseTalentOf')
s = replace_once(s,
    "data-page-jump=\"more\">去充值",
    "data-page-jump=\"more\" data-more-section=\"vip\">去充值",
    'home recharge jump')
s = replace_once(s,
    "talent=Number(h?.meridian?.talent||0);",
    "talent=heroTalent(state,id);",
    'hero card total talent')
s = replace_once(s,
    "<div class=\"hero-card ${owned?'':'locked'}\">",
    "<div class=\"hero-card rarity-card-${tpl.rarity} ${owned?'':'locked'}\">",
    'hero rarity card class')
s = replace_once(s,
    "<div class=\"hero-meta\">${rarityName(tpl.rarity)} · ${tpl.role} · ${heroAcquireText(id)}</div><div class=\"grid-2\" style=\"margin-top:10px\">",
    "<div class=\"hero-meta\">${rarityName(tpl.rarity)} · ${tpl.role} · ${heroAcquireText(id)}</div><div class=\"talent-line\"><b>天赋 ${fmt(heroTalent(state,id))}</b><span>初始 ${fmt(baseTalentForRarity(tpl.rarity))} + 经脉 ${fmt(h?.meridian?.talent||0)}</span></div><div class=\"grid-2\" style=\"margin-top:10px\">",
    'hero detail talent breakdown')
s = replace_once(s,
    "function heroListCard(id){return `<div>${heroCard(id)}<button class=\"btn btn-block ${heroDetailId===id?'btn-gold':''}\" data-hero-detail=\"${id}\" style=\"margin-top:6px\">${heroDetailId===id?'收起详情':'查看详情'}</button></div>`;}",
    "function heroListCard(id){return `<div class=\"hero-list-item\">${heroCard(id)}<button class=\"detail-link ${heroDetailId===id?'active':''}\" data-hero-detail=\"${id}\">${heroDetailId===id?'收起详情':'查看侠客详情'}</button></div>`;}",
    'hero detail button style')

# Replace heroes renderer with a compact, game-like filter strip.
heroes_pattern = re.compile(r"function renderHeroes\(\)\{.*?\n\nfunction ensureGrowthHero", re.S)
heroes_new = """function renderHeroes(){const allIds=Object.keys(HEROES).sort((a,b)=>{const ao=state.heroes[a]?.owned?1:0,bo=state.heroes[b]?.owned?1:0;if(ao!==bo)return bo-ao;if(HEROES[a].unlock!==HEROES[b].unlock)return HEROES[a].unlock-HEROES[b].unlock;return HEROES[b].rarity-HEROES[a].rarity;}),ids=allIds.filter(heroMatchesFilter),ownedCount=allIds.filter(id=>state.heroes[id]?.owned).length;pageEl.innerHTML=`<div class=\"page-heading\"><div><span class=\"eyebrow\">侠客谱</span><h2>侠客</h2></div><small>已结识 ${ownedCount}/${allIds.length}</small></div><div class=\"filter-strip\">${HERO_FILTERS.map(([key,label])=>`<button class=\"filter-chip ${heroFilter===key?'active':''}\" data-hero-filter=\"${key}\">${label}</button>`).join('')}</div>${heroDetailHtml(heroDetailId)}<div class=\"hero-list\">${ids.length?ids.map(heroListCard).join(''):'<section class=\"card\"><div class=\"muted\">当前筛选条件下没有侠客。</div></section>'}</div>`;}\n\nfunction ensureGrowthHero"""
s, n = heroes_pattern.subn(heroes_new, s, count=1)
if n != 1:
    raise RuntimeError(f'heroes renderer replace count={n}')

# All selected-growth slot calculations must use total talent; heroId context also uses total talent.
s = s.replace("kungfuSlotsForTalent(m.talent||0)", "kungfuSlotsForTalent(heroTalent(state,selectedGrowthHero))")
s = s.replace("kungfuSlotsForTalent(h.meridian?.talent||0)", "kungfuSlotsForTalent(heroTalent(state,heroId))")
# Meridian panel display should show total and breakdown.
s = replace_once(s,
    "<div class=\"mini-stat\"><div class=\"muted\">天赋</div><div class=\"big-number small\">${fmt(m.talent||0)}</div></div>",
    "<div class=\"mini-stat\"><div class=\"muted\">天赋</div><div class=\"big-number small\">${fmt(heroTalent(state,selectedGrowthHero))}</div></div>",
    'meridian displayed talent')
s = replace_once(s,
    "累计经脉加成：攻击 +${fmt(m.atk||0)} · 防御 +${fmt(m.def||0)} · 气血 +${fmt(m.hp||0)}",
    "天赋：初始 ${fmt(baseTalentOf(selectedGrowthHero))} + 经脉 ${fmt(m.talent||0)}。累计经脉加成：攻击 +${fmt(m.atk||0)} · 防御 +${fmt(m.def||0)} · 气血 +${fmt(m.hp||0)}",
    'meridian talent breakdown')

# Replace the giant More page with a hub and separate sub-pages.
more_pattern = re.compile(r"function renderMore\(\)\{.*?\n\nfunction render\(\)", re.S)
more_new = r'''const MORE_MENU=[
  ['inn','客','客栈','传奇招募与奇侠兑换'],
  ['tasks','任','任务','每日与成长目标'],
  ['awaken','神','神品悟道','魂石与悟道资源'],
  ['vip','充','充值VIP','模拟充值与专属礼包'],
  ['resources','财','资源补给','体力与摇钱树'],
  ['settings','设','设置存档','导入、导出与重置'],
];
function moreSubHead(title,sub=''){return `<div class="subpage-head"><button class="back-link" data-more-section="hub">‹ 江湖</button><div><span class="eyebrow">江湖</span><h2>${title}</h2>${sub?`<small>${sub}</small>`:''}</div></div>`;}
function renderMoreHub(){const tiles=MORE_MENU.map(([key,seal,title,sub])=>`<button class="hub-tile" data-more-section="${key}"><span class="hub-seal">${seal}</span><span class="hub-title">${title}</span><span class="hub-sub">${sub}</span><span class="hub-arrow">›</span></button>`).join('');pageEl.innerHTML=`<section class="jianghu-banner"><div><span class="eyebrow">单机江湖</span><h2>江湖</h2><p>常驻玩法各归其位，不再把所有功能堆成一张长页面。</p></div><div class="jianghu-rank"><span>当前</span><b>VIP ${state.player.vip}</b><small>第${state.player.chapter}幕</small></div></section><div class="hub-grid">${tiles}</div>`;}
function renderMoreInn(){pageEl.innerHTML=`${moreSubHead('客栈','定向招募 / 奇侠兑换')}${renderInnCard()}`;}
function renderMoreTasks(){pageEl.innerHTML=`${moreSubHead('任务','每日活跃 / 成长目标')}${renderTaskCenter()}`;}
function renderMoreAwaken(){pageEl.innerHTML=`${moreSubHead('神品悟道','魂石与后期养成资源')}${renderSoulStoneStore()}${renderWudaoStore()}`;}
function renderMoreVip(){pageEl.innerHTML=`${moreSubHead('充值与VIP','全部为本地模拟，不产生真实支付')}<section class="card featured-card"><div class="section-title"><h3>模拟充值</h3><small>累计 ¥${fmt(state.player.totalRecharge)}</small></div><div class="notice">首充档位保留双倍元宝；648档额外获得1个奇侠兑换物自选包。</div><div class="grid-3 recharge-grid" style="margin-top:10px">${rechargeHtml()}</div></section>${renderVipGiftCenter()}`;}
function renderMoreResources(){const staminaLimit=STAMINA_BUY_LIMIT[state.player.vip]??24,staminaCost=staminaPrice(state.daily.staminaBuys),treeLimit=moneyTreeLimit(state.player.vip);pageEl.innerHTML=`${moreSubHead('资源补给','体力 / 铜钱')}<section class="card"><div class="section-title"><h3>体力购买</h3><small>${state.daily.staminaBuys}/${staminaLimit}</small></div><div class="list-row"><span>每次恢复25体力</span><button class="btn" data-action="buyStamina" ${state.daily.staminaBuys>=staminaLimit?'disabled':''}>${staminaCost}元宝</button></div></section><section class="card"><div class="section-title"><h3>摇钱树</h3><small>${state.daily.moneyTreeUses}/${treeLimit}</small></div><div class="muted">基础10万铜钱，有概率触发多倍暴击。</div><button class="btn btn-gold btn-block" data-action="moneyTree" ${state.daily.moneyTreeUses>=treeLimit?'disabled':''} style="margin-top:10px">摇一次</button></section>`;}
function renderMoreSettings(){pageEl.innerHTML=`${moreSubHead('设置与存档','本地自动保存')}<section class="card settings-card"><div class="setting-row"><div><b>导出存档</b><div class="hero-meta">保存为JSON文件，可跨浏览器备份。</div></div><button class="btn" data-action="export">导出</button></div><div class="setting-row"><div><b>导入存档</b><div class="hero-meta">读取此前导出的新倚天JSON存档。</div></div><button class="btn" data-action="import">导入</button></div><div class="setting-row danger-row"><div><b>重置存档</b><div class="hero-meta">清空本机进度并重新开始。</div></div><button class="btn btn-danger" data-action="reset">重置</button></div></section><section class="card game-info"><span class="eyebrow">版本</span><h3>新倚天屠龙记 · 单机精简版</h3><div class="hero-meta">V0.19 · 手机优先 · 本地存档</div></section>`;}
function renderMore(){if(moreSection==='inn')return renderMoreInn();if(moreSection==='tasks')return renderMoreTasks();if(moreSection==='awaken')return renderMoreAwaken();if(moreSection==='vip')return renderMoreVip();if(moreSection==='resources')return renderMoreResources();if(moreSection==='settings')return renderMoreSettings();moreSection='hub';renderMoreHub();}

function render()'''
s, n = more_pattern.subn(more_new, s, count=1)
if n != 1:
    raise RuntimeError(f'more renderer replace count={n}')

# Page click routing and bottom navigation.
s = replace_once(s,
    "if(btn.dataset.pageJump){currentPage=btn.dataset.pageJump;render();return;}if(btn.dataset.heroFilter)",
    "if(btn.dataset.pageJump){currentPage=btn.dataset.pageJump;if(currentPage==='more')moreSection=btn.dataset.moreSection||'hub';render();return;}if(btn.dataset.moreSection){moreSection=btn.dataset.moreSection;renderMore();window.scrollTo({top:0,behavior:'smooth'});return;}if(btn.dataset.heroFilter)",
    'more click routing')
s = replace_once(s,
    "currentPage=btn.dataset.page;render();window.scrollTo({top:0,behavior:'smooth'});",
    "currentPage=btn.dataset.page;if(currentPage==='more')moreSection='hub';render();window.scrollTo({top:0,behavior:'smooth'});",
    'bottom nav reset hub')
write(path, s)

# ---- index: visible version and game-like nav label ----
path = 'index.html'
s = read(path)
s = s.replace('单机精简版 · V0.16', '单机精简版 · V0.19')
s = s.replace('data-page="more" type="button"><span>更多</span>', 'data-page="more" type="button"><span>江湖</span>')
write(path, s)

# ---- service worker cache bump ----
path = 'sw.js'
s = read(path).replace("const CACHE = 'xinyitian-v0.16.0';", "const CACHE = 'xinyitian-v0.19.0';")
write(path, s)

# ---- full visual refresh: Chinese-wuxia game shell, less admin-dashboard ----
css = r''':root {
  --bg:#0d0f0e;
  --bg-2:#151713;
  --panel:#1d1c17;
  --panel-2:#252119;
  --panel-soft:#171814;
  --line:#57462e;
  --line-soft:rgba(205,164,91,.22);
  --text:#f3ead8;
  --muted:#a99d89;
  --gold:#d8b46a;
  --gold-bright:#f0d38d;
  --red:#a93d32;
  --red-deep:#68251f;
  --jade:#78977c;
  --purple:#a782c8;
  --shadow:0 12px 32px rgba(0,0,0,.22);
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
body{min-width:320px;background:radial-gradient(circle at 18% -10%,rgba(125,42,31,.22),transparent 32%),radial-gradient(circle at 100% 14%,rgba(191,146,71,.08),transparent 27%),linear-gradient(180deg,#121411 0,#0b0d0c 68%,#090a09 100%)}
button,input,select{font:inherit}button{color:inherit}
.app-shell{min-height:100vh;padding-bottom:calc(68px + env(safe-area-inset-bottom));position:relative}
.app-shell:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.15;background-image:linear-gradient(90deg,transparent 49.6%,rgba(255,255,255,.025) 50%,transparent 50.4%),linear-gradient(0deg,transparent 49.6%,rgba(255,255,255,.018) 50%,transparent 50.4%);background-size:46px 46px}
.topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:10px 14px 9px;background:linear-gradient(180deg,rgba(45,22,18,.98),rgba(24,19,16,.97));border-bottom:1px solid rgba(221,177,92,.48);box-shadow:0 4px 20px rgba(0,0,0,.24)}
.brand{font-family:"STKaiti","KaiTi","FangSong",serif;font-weight:900;letter-spacing:.09em;font-size:19px;color:#f2d28a;text-shadow:0 1px 0 #3c1b12}
.subtitle{color:#bba786;font-size:10px;margin-top:1px;letter-spacing:.05em}
.save-status{border:1px solid rgba(218,180,108,.38);background:rgba(12,12,10,.36);border-radius:4px;padding:5px 8px;font-size:11px;color:#cdb98f}
.resource-bar{display:flex;gap:0;padding:5px 8px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid rgba(215,173,92,.16);background:rgba(18,19,16,.96);position:sticky;top:55px;z-index:15;box-shadow:0 5px 16px rgba(0,0,0,.12)}
.resource-bar::-webkit-scrollbar,.filter-strip::-webkit-scrollbar,.growth-tabs::-webkit-scrollbar{display:none}
.resource-item{flex:0 0 auto;min-width:72px;text-align:left;padding:3px 10px;border-right:1px solid rgba(210,170,101,.17)}
.resource-item:last-child{border-right:0}
.resource-label{display:block;font-size:9px;color:#857a69;letter-spacing:.06em}
.resource-value{display:block;margin-top:1px;white-space:nowrap;font-weight:800;font-size:12px;color:#e9d6ae}
.page{width:min(100%,720px);margin:0 auto;padding:15px 12px 26px;position:relative;z-index:1}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:2px 2px 9px;margin-bottom:4px;border-bottom:1px solid rgba(211,169,92,.18)}
.page-heading h2,.subpage-head h2,.jianghu-banner h2{font-family:"STKaiti","KaiTi","FangSong",serif;margin:1px 0 0;font-size:25px;letter-spacing:.08em;color:#f0d28d}
.page-heading small,.subpage-head small{color:var(--muted);font-size:11px}
.eyebrow{display:inline-block;color:#b38e50;font-size:9px;letter-spacing:.18em;text-transform:uppercase}
.section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:2px 0 10px;padding-bottom:8px;border-bottom:1px solid rgba(210,168,91,.14)}
.section-title h2,.section-title h3{margin:0;font-family:"STKaiti","KaiTi","FangSong",serif;font-size:19px;letter-spacing:.04em;color:#ead3a0}
.section-title small{color:var(--muted);font-size:11px}
.card{position:relative;background:linear-gradient(145deg,rgba(34,32,25,.97),rgba(24,24,20,.97));border:1px solid rgba(193,153,87,.28);border-radius:9px;padding:13px;box-shadow:0 7px 20px rgba(0,0,0,.14);margin-bottom:10px;overflow:hidden}
.card:before{content:"";position:absolute;left:0;top:0;width:34px;height:2px;background:linear-gradient(90deg,var(--red),var(--gold));opacity:.9}
.featured-card{border-color:rgba(216,180,106,.48);background:linear-gradient(145deg,rgba(52,38,25,.96),rgba(28,25,20,.98))}
.hero-banner{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:radial-gradient(circle at 85% 0,rgba(201,155,70,.15),transparent 42%),linear-gradient(135deg,#39221b,#211d18 62%,#191915);border-color:rgba(199,157,84,.42)}
.big-number{font-family:Georgia,"Times New Roman",serif;font-size:27px;font-weight:900;color:#e8bd68;letter-spacing:.02em}
.big-number.small{font-size:20px;margin-top:2px}.muted{color:var(--muted)}
.tag{display:inline-flex;align-items:center;border:1px solid rgba(192,150,80,.36);background:rgba(91,58,28,.3);color:#d8bb7d;border-radius:3px;padding:2px 6px;font-size:9px;letter-spacing:.04em}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.stat-box,.mini-stat{background:rgba(8,10,9,.28);border:1px solid rgba(187,149,86,.18);border-radius:6px;padding:9px;min-width:0}.stat-box b{display:block;font-size:15px;margin-top:2px}.mini-stat{text-align:center}
.btn{border:1px solid rgba(185,145,79,.45);background:linear-gradient(180deg,#3a3023,#282219);border-radius:6px;padding:9px 11px;font-weight:750;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.025)}
.btn:active{transform:translateY(1px)}.btn-primary{background:linear-gradient(180deg,#ac4839,#762b25);border-color:#b95d50}.btn-gold{background:linear-gradient(180deg,#b38a46,#735629);border-color:#cfa75f}.btn-ghost{background:rgba(15,15,13,.45);border-color:rgba(175,145,95,.2);color:var(--muted)}.btn-danger{background:#5a2521;border-color:#853d34}.btn-block{width:100%}.btn[disabled]{opacity:.38;cursor:not-allowed}.action-row{display:flex;gap:7px;flex-wrap:wrap}.action-row>*{flex:1 1 115px}.action-stack{display:grid;gap:6px;min-width:96px}
.growth-select{width:100%;appearance:none;color:var(--text);background:#151713;border:1px solid rgba(194,153,85,.42);border-radius:6px;padding:10px 11px;outline:none}.growth-select:focus{border-color:#d2a85b;box-shadow:0 0 0 2px rgba(210,168,91,.1)}
.growth-tabs{display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;padding-bottom:2px}.growth-tabs .btn{flex:1 0 72px;min-width:0;padding:8px 7px;font-size:11px}
.party-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.party-slot,.hero-card{border:1px solid rgba(168,139,91,.27);border-radius:7px;padding:10px;background:linear-gradient(145deg,rgba(22,23,19,.95),rgba(16,17,15,.95));min-width:0}.party-slot.empty{color:#6f6658;border-style:dashed;min-height:72px;display:grid;place-items:center}.hero-name{font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hero-meta{color:var(--muted);font-size:10.5px;margin-top:3px;line-height:1.5}.rarity-7{color:#ffd46b}.rarity-6{color:#ef6a58}.rarity-5{color:#c895e1}.hero-list{display:grid;gap:9px;margin-top:8px}.hero-list-item{position:relative}.hero-card-row{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:center}.hero-card{border-left-width:3px}.rarity-card-7{border-left-color:#e5bc56;background:radial-gradient(circle at 96% 0,rgba(229,188,86,.09),transparent 35%),linear-gradient(145deg,#222019,#151612)}.rarity-card-6{border-left-color:#b84b3c}.rarity-card-5{border-left-color:#8d62aa}.detail-link{width:100%;border:0;border-bottom:1px solid rgba(194,153,87,.18);background:transparent;color:#a9946f;padding:7px 5px 5px;text-align:right;font-size:10px;cursor:pointer}.detail-link:after{content:"  ›";color:#d0aa63}.detail-link.active{color:#e0bf7b}.talent-line{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:8px;padding:7px 9px;border-left:2px solid #b78b45;background:rgba(112,77,33,.12);font-size:11px}.talent-line b{color:#e4bd70}.talent-line span{color:var(--muted);font-size:10px}
.filter-strip{display:flex;gap:6px;overflow-x:auto;padding:7px 1px 10px;margin-bottom:2px;scrollbar-width:none}.filter-chip{flex:0 0 auto;border:1px solid rgba(182,147,91,.24);background:rgba(24,24,20,.7);color:#a79b87;border-radius:999px;padding:6px 11px;font-size:10px}.filter-chip.active{color:#f0cf87;border-color:#9d7037;background:rgba(112,69,28,.34)}
.kungfu-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.kungfu-slot{min-height:74px;padding:9px;border:1px solid rgba(174,139,80,.3);border-radius:7px;background:rgba(17,18,15,.9)}.kungfu-slot .hero-name{margin-top:4px;color:#e0b969}.kungfu-slot.locked{border-style:dashed}
.progress{height:6px;background:#0b0d0c;border-radius:2px;overflow:hidden;border:1px solid rgba(165,132,77,.2)}.progress>i{display:block;height:100%;background:linear-gradient(90deg,#8f3b2d,#d5a652);width:0}
.list{display:grid;gap:7px}.list-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(181,144,84,.13)}.list-row:last-child{border-bottom:0}
.notice{padding:9px 10px;border-left:2px solid #9d743b;background:rgba(74,53,28,.17);color:#cdbd9e;font-size:11px;line-height:1.55}.locked{opacity:.48}
.jianghu-banner{position:relative;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;margin-bottom:12px;padding:18px 16px;border:1px solid rgba(210,170,95,.34);border-radius:9px;overflow:hidden;background:radial-gradient(circle at 90% 0,rgba(205,159,76,.17),transparent 38%),linear-gradient(135deg,rgba(92,39,29,.76),rgba(31,28,22,.96) 58%,rgba(21,25,20,.98))}.jianghu-banner:after{content:"江湖";position:absolute;right:80px;bottom:-18px;font-family:"STKaiti","KaiTi",serif;font-size:72px;color:rgba(240,211,143,.045);transform:rotate(-7deg)}.jianghu-banner p{margin:6px 0 0;color:#ae9e84;font-size:11px;line-height:1.55;max-width:390px}.jianghu-rank{position:relative;z-index:1;min-width:78px;text-align:center;padding:9px 10px;border-left:1px solid rgba(224,187,111,.25)}.jianghu-rank span,.jianghu-rank small{display:block;color:#998b75;font-size:9px}.jianghu-rank b{display:block;margin:3px 0;color:#efc870;font-size:15px}
.hub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.hub-tile{position:relative;display:grid;grid-template-columns:45px 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;min-height:96px;text-align:left;padding:12px;border:1px solid rgba(187,149,85,.27);border-radius:8px;background:linear-gradient(145deg,rgba(31,30,24,.96),rgba(20,21,17,.96));cursor:pointer}.hub-tile:active{transform:translateY(1px);background:#29251c}.hub-seal{grid-row:1/3;width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(211,169,91,.52);border-radius:50%;background:radial-gradient(circle,rgba(151,62,45,.42),rgba(87,38,31,.2));font-family:"STKaiti","KaiTi",serif;font-size:21px;color:#e1ba6e}.hub-title{font-weight:850;color:#e7d4aa;font-size:14px}.hub-sub{align-self:start;color:#897e6d;font-size:9.5px;line-height:1.35}.hub-arrow{position:absolute;right:9px;top:8px;color:#705e43;font-size:17px}
.subpage-head{display:flex;align-items:flex-start;gap:12px;margin:0 0 11px;padding:1px 2px 10px;border-bottom:1px solid rgba(211,169,92,.18)}.back-link{flex:0 0 auto;margin-top:5px;border:0;background:transparent;color:#c39b58;padding:4px 3px;cursor:pointer;font-size:11px}.settings-card{padding-top:4px}.setting-row{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:13px 1px;border-bottom:1px solid rgba(184,145,81,.14)}.setting-row:last-child{border-bottom:0}.setting-row b{color:#dfc797}.danger-row b{color:#d58d82}.game-info{text-align:center;padding:20px}.game-info h3{font-family:"STKaiti","KaiTi",serif;color:#daba78;margin:4px 0}.recharge-grid .btn{min-height:42px}
.bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:30;display:grid;grid-template-columns:repeat(5,1fr);padding:5px 7px calc(5px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(27,24,19,.98),rgba(14,15,13,.99));border-top:1px solid rgba(202,161,88,.34);box-shadow:0 -8px 26px rgba(0,0,0,.26)}.nav-item{position:relative;appearance:none;border:0;background:transparent;color:#817666;padding:9px 3px 7px;font-weight:750;font-size:11px;letter-spacing:.04em}.nav-item.active{color:#efc873}.nav-item.active:before{content:"";position:absolute;top:-5px;left:28%;right:28%;height:2px;background:#d09d4f;box-shadow:0 0 8px rgba(208,157,79,.45)}
.modal{width:min(92vw,620px);max-height:84vh;overflow:auto;color:var(--text);background:#171814;border:1px solid rgba(206,166,97,.5);border-radius:10px;padding:0;box-shadow:0 24px 80px rgba(0,0,0,.62)}.modal::backdrop{background:rgba(0,0,0,.76);backdrop-filter:blur(3px)}.modal-inner{padding:15px}.modal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.modal-head h3{margin:0;color:#e5c987}.battle-log{max-height:48vh;overflow:auto;background:#0d0f0d;border:1px solid rgba(176,139,78,.25);border-radius:7px;padding:9px;font-size:12px;line-height:1.65}.battle-win{color:#9fc697;font-weight:800}.battle-loss{color:#df786c;font-weight:800}
@media(max-width:430px){.hero-card-row{grid-template-columns:1fr}.hero-card-row .action-row,.hero-card-row .action-stack{width:100%}.action-stack{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-3{grid-template-columns:repeat(2,minmax(0,1fr))}.party-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.jianghu-banner{gap:8px;padding:15px 13px}.jianghu-banner:after{right:28px}.hub-tile{grid-template-columns:39px 1fr;padding:10px;column-gap:8px}.hub-seal{width:36px;height:36px;font-size:18px}.hub-title{font-size:13px}.talent-line{align-items:flex-start;flex-direction:column;gap:2px}}
@media(min-width:700px){.page{padding-top:19px}.resource-bar{padding-left:max(12px,calc((100vw - 720px)/2));padding-right:max(12px,calc((100vw - 720px)/2))}.party-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.kungfu-slots{grid-template-columns:repeat(4,minmax(0,1fr))}.hub-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
'''
write('styles.css', css)

# Sanity checks in the patch itself.
app = read('src/app.js')
if "moreSection='hub'" not in app or 'hub-grid' not in app:
    raise RuntimeError('Jianghu hub patch missing')
if 'heroTalent(state,selectedGrowthHero)' not in app:
    raise RuntimeError('total talent not wired into growth UI')
state = read('src/state.js')
if 'innerPowerBonuses(heroId,h.innerPower,heroTalent(state,heroId))' not in state:
    raise RuntimeError('total talent not wired into inner power')
print('V0.19 patch applied')
