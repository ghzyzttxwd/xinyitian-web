// V0.24.22 主角 / 张无忌剧情成长。
// 张无忌节点沿用已确认原版节奏：15/35/55/75/95/110幕。
// 用户最新明确要求：张无忌不是群攻侠客；其剧情成长技能全部按单体攻击执行。
// 保留武当长拳→九阳神掌→九阳真气→乾坤大挪移→传奇→大挪移心法的成长线，只纠正攻击范围。
// 玩家主角原版为25/45/65/85/105/115/125幕；单机主线止于110幕，
// 因此前四节点保留，后三段压缩到100/105/110幕，保证神品主角在V1主线内可达。
// 神品主角只确认“赤霄/龙渊/胜邪”神剑方向；具体战斗系数为V1实现，不冒充原版精确值。

export const WUJI_STORY = [
  {chapter:0, title:'武当长拳', rarity:5, statMul:1.00, role:'单体', skill:{name:'武当长拳',target:'one',multiplier:1.02,rageCost:4}},
  {chapter:15,title:'武当长拳·精进',rarity:5,statMul:1.08,role:'单体',skill:{name:'武当长拳',target:'one',multiplier:1.10,rageCost:4}},
  {chapter:35,title:'九阳神掌',rarity:5,statMul:1.18,role:'单体',skill:{name:'九阳神掌',target:'one',multiplier:1.20,rageCost:4}},
  {chapter:55,title:'九阳真气',rarity:5,statMul:1.30,role:'单体',skill:{name:'九阳神掌',target:'one',multiplier:1.28,rageCost:4}},
  {chapter:75,title:'乾坤大挪移',rarity:5,statMul:1.42,role:'单体/挪移',skill:{name:'乾坤大挪移',target:'one',multiplier:1.36,rageCost:4}},
  {chapter:95,title:'传奇张无忌',rarity:6,statMul:1.58,role:'传奇单体/挪移',skill:{name:'乾坤大挪移',target:'one',multiplier:1.44,rageCost:4}},
  {chapter:110,title:'大挪移心法',rarity:6,statMul:1.72,role:'传奇单体/挪移',skill:{name:'大挪移心法',target:'one',multiplier:1.52,rageCost:4}},
];

export const PLAYER_STORY = [
  {chapter:0,  title:'少侠',rarity:5,statMul:1.00,role:'均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.05,rageCost:4}},
  {chapter:25, title:'剧情觉醒·一',rarity:5,statMul:1.12,role:'均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.12,rageCost:4}},
  {chapter:45, title:'剧情觉醒·二',rarity:5,statMul:1.24,role:'均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.19,rageCost:4}},
  {chapter:65, title:'剧情觉醒·三',rarity:5,statMul:1.38,role:'均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.27,rageCost:4}},
  {chapter:85, title:'剧情觉醒·四',rarity:5,statMul:1.54,role:'均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.35,rageCost:4}},
  {chapter:100,title:'传奇少侠',rarity:6,statMul:1.72,role:'传奇均衡',skill:{name:'长虹贯日',target:'all',multiplier:1.43,rageCost:4}},
  {chapter:105,title:'神剑初醒',rarity:6,statMul:1.90,role:'传奇神剑',skill:{name:'神剑',target:'all',multiplier:1.50,rageCost:4}},
  {chapter:110,title:'神·少侠',rarity:7,statMul:2.12,role:'神品神剑/均衡',skill:{name:'神剑',target:'all',multiplier:1.58,rageCost:4}},
];

function stagesFor(heroId){
  if(heroId==='wuji')return WUJI_STORY;
  if(heroId==='player')return PLAYER_STORY;
  return null;
}

export function storyStageIndex(state,heroId){
  const stages=stagesFor(heroId);if(!stages)return -1;
  const chapter=Number(state?.player?.chapter||0);
  let idx=0;for(let i=0;i<stages.length;i++)if(chapter>=stages[i].chapter)idx=i;
  return idx;
}

export function storyStageInfo(state,heroId){
  const stages=stagesFor(heroId);if(!stages)return null;
  return stages[Math.max(0,storyStageIndex(state,heroId))];
}

export function nextStoryStage(state,heroId){
  const stages=stagesFor(heroId);if(!stages)return null;
  const idx=storyStageIndex(state,heroId);return stages[idx+1]||null;
}

export function storyMilestonesAtChapter(chapter){
  const c=Number(chapter||0),out=[];
  for(const [heroId,stages] of [['player',PLAYER_STORY],['wuji',WUJI_STORY]]){
    const stage=stages.find(x=>x.chapter===c&&x.chapter>0);if(stage)out.push({heroId,...stage});
  }
  return out;
}

export function storyHeroProfile(state,heroId,base){
  if(!base)return base;
  const stage=storyStageInfo(state,heroId);if(!stage)return base;
  const mul=Number(stage.statMul||1),b=base.base||{};
  return {
    ...base,
    name: heroId==='player'&&stage.rarity>=7 ? '神·少侠' : base.name,
    rarity: stage.rarity??base.rarity,
    role: stage.role||base.role,
    base:{
      ...b,
      atk:Math.round(Number(b.atk||0)*mul),
      def:Math.round(Number(b.def||0)*mul),
      hp:Math.round(Number(b.hp||0)*mul),
      speed:Number(b.speed||0)+(stage.rarity>=6?2:0)+(stage.rarity>=7?2:0),
    },
    skill:{...(base.skill||{}),...(stage.skill||{})},
  };
}

export function isStoryGod(state,heroId){
  return heroId==='player' && Number(state?.player?.chapter||0)>=110;
}

export function storyBattleEffects(state,heroId){
  if(!isStoryGod(state,heroId))return [];
  return [
    {kind:'skillDamage',value:.12,label:'赤霄'},
    {kind:'damageReduction',value:8,label:'龙渊'},
    {kind:'lifesteal',ratio:.10,label:'胜邪'},
  ];
}

export function storyStageText(state,heroId){
  const now=storyStageInfo(state,heroId),next=nextStoryStage(state,heroId);
  if(!now)return '';
  return `${now.title}${next?` · 下一觉醒：第${next.chapter}幕【${next.title}】`:' · 剧情成长已完成'}`;
}
