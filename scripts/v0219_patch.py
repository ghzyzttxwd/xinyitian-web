from pathlib import Path
import re

# data.js: v580 exact level EXP and chapter gates.
p=Path('src/data.js'); s=p.read_text()
anchor="import { towerPowerRating } from './power.js';"
imp="import { originalPlayerExpToNext, originalChapterRequiredLevel } from './progression.js';"
if imp not in s:
    if anchor not in s: raise SystemExit('data import anchor missing')
    s=s.replace(anchor,anchor+'\n'+imp,1)
s,n=re.subn(r"export function requiredPlayerLevelForChapter\(chapter\) \{.*?\n\}","export function requiredPlayerLevelForChapter(chapter) {\n  return originalChapterRequiredLevel(chapter);\n}",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'chapter gate replace={n}')
s,n=re.subn(r"export function playerExpToNext\(level\) \{.*?\n\}","export function playerExpToNext(level) {\n  return originalPlayerExpToNext(level);\n}",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'player exp replace={n}')
p.write_text(s)

# app.js: aggregate original trunk_event rewards; sweep uses rolelv.zhuxiansaod.
p=Path('src/app.js'); s=p.read_text()
anchor="import { storyHeroProfile, storyStageInfo, storyStageText, storyMilestonesAtChapter, isStoryGod } from './story.js';"
imp="import { originalChapterReward, originalSweepReward } from './progression.js';"
if imp not in s:
    if anchor not in s: raise SystemExit('app import anchor missing')
    s=s.replace(anchor,anchor+'\n'+imp,1)
new_ch="""function challengeChapter(){if(!hasParty())return alert('当前没有上阵侠客。');const need=requiredPlayerLevelForChapter(state.player.chapter);if(state.player.level<need)return alert(`等级不足：第${state.player.chapter}幕需要 Lv.${need}。先速战获取经验。`);const chapter=state.player.chapter,result=runChapterBattle(state);let reward='';if(result.win){const original=originalChapterReward(chapter),exp=original?.exp??(180+chapter*36),copper=original?.copper??(12000+chapter*1800),heroExp=original?.heroExp??(800+chapter*80);addPlayerExp(state,exp);state.player.copper+=copper;state.player.heroExp=Number(state.player.heroExp||0)+heroExp;state.player.heroTokens+=chapter%5===0?2:0;state.player.chapter+=1;reward=`玩家经验 +${fmt(exp)} · 侠客经验 +${fmt(heroExp)} · 铜钱 +${fmt(copper)}${chapter%5===0?' · 侠客信物 +2':''}`;const story=storyMilestonesAtChapter(state.player.chapter);if(story.length)reward+=` · 剧情觉醒：${story.map(x=>`${x.heroId==='player'?'少侠':'张无忌'}【${x.title}】`).join('、')}`;commit();}showBattle(result,`主线 · 第${chapter}幕`,reward);}"""
new_q="""function quickBattle(){const times=5,cost=times*5;if(state.player.stamina<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);state.player.stamina-=cost;state.daily.quickBattles+=times;let exp=0,heroExp=0,copper=0;for(let i=0;i<times;i++){const one=originalSweepReward(state.player.level);exp+=one.exp;heroExp+=one.heroExp;copper+=one.copper;addPlayerExp(state,one.exp);}state.player.copper+=copper;state.player.heroExp=Number(state.player.heroExp||0)+heroExp;commit();const parts=[`玩家经验 +${fmt(exp)}`,`侠客经验 +${fmt(heroExp)}`];if(copper)parts.push(`铜钱 +${fmt(copper)}`);alert(`连续速战5次完成：${parts.join('，')}，体力 -${cost}。`);}"""
pat=r"function challengeChapter\(\)\{.*?\}\nfunction quickBattle\(\)\{.*?\}\nfunction towerBaseMeridianPills"
s,n=re.subn(pat,new_ch+'\n'+new_q+'\nfunction towerBaseMeridianPills',s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'mainline/quick replace={n}')
p.write_text(s)

# Cache and visible version.
p=Path('sw.js'); s=p.read_text()
s,n=re.subn(r"const CACHE = 'xinyitian-v0\.21\.\d+';","const CACHE = 'xinyitian-v0.21.9';",s,count=1)
if n!=1: raise SystemExit('cache version missing')
asset="  './src/progression.js',\n"
if asset not in s:
    a="  './src/state.js',\n"
    if a not in s: raise SystemExit('sw asset anchor missing')
    s=s.replace(a,a+asset,1)
p.write_text(s)

p=Path('index.html'); s=p.read_text()
s,n=re.subn(r'单机精简版 · V0\.21\.\d+','单机精简版 · V0.21.9',s,count=1)
if n!=1: raise SystemExit('visible version missing')
p.write_text(s)
