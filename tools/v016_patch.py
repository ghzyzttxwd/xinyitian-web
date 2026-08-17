from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:180]}')
    p.write_text(s.replace(old,new,1))

# state.js：剧情阶段基础属性真正进入侠客属性。
rep('src/state.js',
"import { createVipExtras } from './vip.js';",
"import { createVipExtras } from './vip.js';\nimport { storyHeroProfile } from './story.js';")
rep('src/state.js',
"export function heroStats(state, heroId) {\n  const tpl = HEROES[heroId], h = state.heroes[heroId];",
"export function heroStats(state, heroId) {\n  const tpl = storyHeroProfile(state,heroId,HEROES[heroId]), h = state.heroes[heroId];")

# wudao.js：剧情神品主角也能正常悟道。
p=Path('src/wudao.js'); s=p.read_text()
if not s.startswith("import { isStoryGod } from './story.js';"):
    s="import { isStoryGod } from './story.js';\n\n"+s
old="  if(!h?.awakened)return 0;"
new="  if(!h?.awakened&&!isStoryGod(state,heroId))return 0;"
if old not in s: raise SystemExit('wudao stage marker missing')
s=s.replace(old,new,1); p.write_text(s)

# battle.js：剧情形态、神剑三方向进入实际战斗。
rep('src/battle.js',
"import { applyWudaoProfile, wudaoBattleEffects } from './wudao.js';",
"import { applyWudaoProfile, wudaoBattleEffects } from './wudao.js';\nimport { storyHeroProfile, storyBattleEffects } from './story.js';")
rep('src/battle.js',
"  out.push(...wudaoBattleEffects(state,heroId));\n  return out;",
"  out.push(...wudaoBattleEffects(state,heroId));\n  out.push(...storyBattleEffects(state,heroId));\n  return out;")
rep('src/battle.js',
"    const tpl=applyWudaoProfile(state,id,effectiveHeroProfile(state,id,HEROES[id])), s=heroStats(state,id), effects=effectsForHero(state,id);",
"    const tpl=applyWudaoProfile(state,id,storyHeroProfile(state,id,effectiveHeroProfile(state,id,HEROES[id]))), s=heroStats(state,id), effects=effectsForHero(state,id);")
rep('src/battle.js',
"log.push(`${actor.name}凭【玄铁指环】吸血 ${heal.toLocaleString()}。`);",
"log.push(`${actor.name}凭【${steal.label||'玄铁指环'}】吸血 ${heal.toLocaleString()}。`);")

# app.js：显示剧情成长、动态角色形态、剧情神品悟道，并在推幕时提示觉醒。
rep('src/app.js',
"import {\n  VIP_GIFTS, SPECIAL_EXCHANGE_ITEMS, SPECIAL_ITEM_PACK_SIZE, SPECIAL_ITEM_PACK_PRICE, SPECIAL_ITEM_PACK_LIMIT,\n  towerSpecialChoicePack, tombSpecialChoicePack,\n} from './vip.js';",
"import {\n  VIP_GIFTS, SPECIAL_EXCHANGE_ITEMS, SPECIAL_ITEM_PACK_SIZE, SPECIAL_ITEM_PACK_PRICE, SPECIAL_ITEM_PACK_LIMIT,\n  towerSpecialChoicePack, tombSpecialChoicePack,\n} from './vip.js';\nimport { storyHeroProfile, storyStageInfo, storyStageText, storyMilestonesAtChapter, isStoryGod } from './story.js';")
rep('src/app.js',
"const SPECIAL_EXCHANGE_IDS=['yangguo','huangrong','xiaolongnv','guojing','zhoubotong','huangyaoshi','hongqigong'];",
"const SPECIAL_EXCHANGE_IDS=['yangguo','huangrong','xiaolongnv','guojing','zhoubotong','huangyaoshi','hongqigong'];\nconst profileOf=id=>storyHeroProfile(state,id,effectiveHeroProfile(state,id,HEROES[id]));")
rep('src/app.js',
"const tpl=effectiveHeroProfile(state,id,HEROES[id]),h=state.heroes[id];",
"const tpl=profileOf(id),h=state.heroes[id];")
rep('src/app.js',
"function renderHome(){\n const need=requiredPlayerLevelForChapter(state.player.chapter),expNeed=playerExpToNext(state.player.level),expPct=Math.min(100,Math.round(state.player.exp/expNeed*100));",
"function renderStoryProgress(){const p=storyStageInfo(state,'player'),w=storyStageInfo(state,'wuji');return `<section class=\"card\"><div class=\"section-title\"><h3>剧情成长</h3><small>主角 / 张无忌</small></div><div class=\"list-row\"><span>${profileOf('player').name}</span><small>${storyStageText(state,'player')}</small></div><div class=\"list-row\"><span>张无忌</span><small>${storyStageText(state,'wuji')}</small></div><div class=\"hero-meta\" style=\"margin-top:8px\">张无忌沿15/35/55/75/95/110幕成长；少侠前四段保留原节奏，后段压入110幕主线终点。</div></section>`;}\n\nfunction renderHome(){\n const need=requiredPlayerLevelForChapter(state.player.chapter),expNeed=playerExpToNext(state.player.level),expPct=Math.min(100,Math.round(state.player.exp/expNeed*100));")
rep('src/app.js',
" <section class=\"card\"><div class=\"section-title\"><h3>当前阵容</h3><small>最多6人 · 在侠客页调整</small></div><div class=\"party-grid\">${partyHtml()}</div></section>\n <section class=\"card\"><div class=\"section-title\"><h3>主线</h3>",
" <section class=\"card\"><div class=\"section-title\"><h3>当前阵容</h3><small>最多6人 · 在侠客页调整</small></div><div class=\"party-grid\">${partyHtml()}</div></section>\n ${renderStoryProgress()}\n <section class=\"card\"><div class=\"section-title\"><h3>主线</h3>")
rep('src/app.js',
" const base=HEROES[id],tpl=effectiveHeroProfile(state,id,base),h=state.heroes[id],owned=h?.owned,inParty=state.party.includes(id),",
" const base=HEROES[id],tpl=profileOf(id),h=state.heroes[id],owned=h?.owned,inParty=state.party.includes(id),")
rep('src/app.js',
"${effectiveHeroProfile(state,id,HEROES[id]).name} · Lv.${state.heroes[id].level}",
"${profileOf(id).name} · Lv.${state.heroes[id].level}")
rep('src/app.js',
"function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER,weaponOpen=state.player.level>=WEAPON_OPEN_LEVEL,wudaoOpen=!!state.heroes[selectedGrowthHero]?.awakened;",
"function growthTabs(){const innerOpen=state.player.chapter>=INNER_POWER_OPEN_CHAPTER,weaponOpen=state.player.level>=WEAPON_OPEN_LEVEL,wudaoOpen=!!state.heroes[selectedGrowthHero]?.awakened||isStoryGod(state,selectedGrowthHero);")
rep('src/app.js',
"function renderWudaoPanel(){const h=state.heroes[selectedGrowthHero],p=effectiveHeroProfile(state,selectedGrowthHero,HEROES[selectedGrowthHero]);",
"function renderWudaoPanel(){const h=state.heroes[selectedGrowthHero],p=profileOf(selectedGrowthHero);")
rep('src/app.js',
"return `<section class=\"card ${h.awakened?'':'locked'}\"><div class=\"section-title\"><h3>${p.name} · 悟道</h3>",
"const godReady=!!h.awakened||isStoryGod(state,selectedGrowthHero);return `<section class=\"card ${godReady?'':'locked'}\"><div class=\"section-title\"><h3>${p.name} · 悟道</h3>")
rep('src/app.js',
"data-action=\"wudao\" ${h.awakened&&Number(state.wudao?.pills||0)>=cost?'':'disabled'}",
"data-action=\"wudao\" ${godReady&&Number(state.wudao?.pills||0)>=cost?'':'disabled'}")
rep('src/app.js',
"function advanceWudao(){ensureGrowthHero();const h=state.heroes[selectedGrowthHero];if(!h?.awakened)return alert('只有已觉醒神品侠客可以悟道。');",
"function advanceWudao(){ensureGrowthHero();const h=state.heroes[selectedGrowthHero];if(!h?.awakened&&!isStoryGod(state,selectedGrowthHero))return alert('只有神品侠客可以悟道。');")
rep('src/app.js',
"alert(`${effectiveHeroProfile(state,selectedGrowthHero,HEROES[selectedGrowthHero]).name}悟道提升至${stage+1}阶。`);",
"alert(`${profileOf(selectedGrowthHero).name}悟道提升至${stage+1}阶。`);")
rep('src/app.js',
"if(selectedGrowthTab==='wudao'&&!state.heroes[selectedGrowthHero]?.awakened)selectedGrowthTab='meridian';",
"if(selectedGrowthTab==='wudao'&&!state.heroes[selectedGrowthHero]?.awakened&&!isStoryGod(state,selectedGrowthHero))selectedGrowthTab='meridian';")
rep('src/app.js',
"state.player.chapter+=1;reward=`玩家经验 +${fmt(exp)} · 侠客经验 +${fmt(heroExp)} · 铜钱 +${fmt(copper)}${chapter%5===0?' · 侠客信物 +2':''}`;commit();",
"state.player.chapter+=1;reward=`玩家经验 +${fmt(exp)} · 侠客经验 +${fmt(heroExp)} · 铜钱 +${fmt(copper)}${chapter%5===0?' · 侠客信物 +2':''}`;const story=storyMilestonesAtChapter(state.player.chapter);if(story.length)reward+=` · 剧情觉醒：${story.map(x=>`${x.heroId==='player'?'少侠':'张无忌'}【${x.title}】`).join('、')}`;commit();")

# 版本与离线缓存。
rep('index.html','单机精简版 · V0.15','单机精简版 · V0.16')
rep('sw.js',"const CACHE = 'xinyitian-v0.15.0';","const CACHE = 'xinyitian-v0.16.0';")
rep('sw.js',"  './src/state.js',","  './src/state.js',\n  './src/story.js',")
