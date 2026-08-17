// V0.8 神品觉醒。
// 原版有明确魂石ID的侠客沿用其魂石身份；单机版把被赛季/活动切碎的来源统一成常驻碎片渠道。
// 黄药师、洪七公为本项目补入角色，其神品技能属于本项目设计，不冒充原版配置。

export const SOUL_SHARDS_PER_STONE = 1000;
export const SOUL_SHARD_PACK = 40;
export const SOUL_SHARD_PACK_PRICE = 1000; // 单机版暂定经济值，后续统一平衡。
export const SOUL_SHARD_PACK_LIMIT = 25;

export const AWAKENINGS = {
  zhangsanfeng:{heroId:'zhangsanfeng',godName:'神·张三丰',unlockChapter:95,soulId:'3010201',statMul:{atk:1.52,def:1.48,hp:1.50},speed:4,role:'神品群攻/太极',skill:{name:'太极无量',target:'all',multiplier:1.55,rageCost:4},effects:[{kind:'afterHitAtk',ratio:.06,maxStacks:5}],desc:'全体太极攻击；受击后逐步把压力转成攻击。'},
  guoxiang:{heroId:'guoxiang',godName:'神·郭襄',unlockChapter:95,soulId:'3010207',statMul:{atk:1.46,def:1.52,hp:1.55},speed:6,role:'神品回怒辅助',skill:{name:'峨眉神剑',target:'all',multiplier:1.12,rageCost:4,teamRage:2,healTeam:.18},effects:[],desc:'全队回怒，并兼顾恢复。'},
  huiyue:{heroId:'huiyue',godName:'神·辉月使',unlockChapter:100,soulId:'3010209',statMul:{atk:1.50,def:1.52,hp:1.56},speed:5,role:'神品增攻/回怒',skill:{name:'圣火昭昭',target:'all',multiplier:1.16,rageCost:4,teamRage:2,healTeam:.22},effects:[{kind:'skillDamage',value:.08}],desc:'回怒、增攻，并把团队续航接进绝技循环。'},

  yangguo:{heroId:'yangguo',godName:'神·杨过',unlockChapter:110,soulId:'3010224',statMul:{atk:1.66,def:1.55,hp:1.58},speed:7,role:'神品顶级输出',skill:{name:'黯然玄铁剑',target:'three',multiplier:1.95,rageCost:4,ignoreDef:.25,refundOnKill:true},effects:[],desc:'高穿防爆发；击杀后保留怒气继续压制。'},
  huangrong:{heroId:'huangrong',godName:'神·黄蓉',unlockChapter:110,soulId:'3010226',statMul:{atk:1.55,def:1.65,hp:1.70},speed:8,role:'神品治疗/控制',skill:{name:'碧海九花',target:'all',multiplier:1.02,rageCost:4,healTeam:.55},effects:[{kind:'teamStartShield',ratio:.10}],desc:'强力群疗与保护，承担后期核心辅助。'},
  xiaolongnv:{heroId:'xiaolongnv',godName:'神·小龙女',unlockChapter:110,soulId:'3010233',statMul:{atk:1.60,def:1.58,hp:1.60},speed:10,role:'神品驱散/回怒',skill:{name:'玉女素心',target:'all',multiplier:1.18,rageCost:4,teamRage:2},effects:[],desc:'高速度团队怒气发动机。'},
  guojing:{heroId:'guojing',godName:'神·郭靖',unlockChapter:110,soulId:'3010235',statMul:{atk:1.70,def:1.66,hp:1.70},speed:5,role:'神品降龙连发',skill:{name:'神·亢龙有悔',target:'all',multiplier:1.42,rageCost:4,repeatChance:.65},effects:[{kind:'skillDamage',value:.08}],desc:'降龙连续释放，越打越凶。'},
  zhoubotong:{heroId:'zhoubotong',godName:'神·周伯通',unlockChapter:110,soulId:'3010237',statMul:{atk:1.72,def:1.58,hp:1.62},speed:9,role:'神品单体爆破',skill:{name:'神·通明拳',target:'highestAtk',multiplier:5.65,rageCost:4,ignoreDef:.60},effects:[],desc:'高额单体伤害并大幅穿防。'},

  huangyaoshi:{heroId:'huangyaoshi',godName:'神·黄药师',unlockChapter:110,soulId:'custom-huangyaoshi',statMul:{atk:1.68,def:1.58,hp:1.60},speed:11,role:'神品控制/减怒',skill:{name:'碧海潮生·神',target:'all',multiplier:1.28,rageCost:4},effects:[{kind:'skillDrainRage',amount:1}],desc:'项目补入神品：高速群攻并压制敌方怒气。'},
  hongqigong:{heroId:'hongqigong',godName:'神·洪七公',unlockChapter:110,soulId:'custom-hongqigong',statMul:{atk:1.75,def:1.62,hp:1.65},speed:6,role:'神品爆发群攻',skill:{name:'降龙十八掌·神',target:'all',multiplier:1.68,rageCost:4,repeatChance:.28},effects:[],desc:'项目补入神品：高额群攻并有机会再出一掌。'},
};

export function createAwakeningState(){
  const fragments={},stones={},shopBuys={};
  Object.keys(AWAKENINGS).forEach(id=>{fragments[id]=0;stones[id]=0;shopBuys[id]=0;});
  return {fragments,stones,shopBuys,choicePacks:0};
}

export function awakeningConfig(heroId){return AWAKENINGS[heroId]||null;}
export function canHeroAwaken(state,heroId){
  const c=awakeningConfig(heroId),h=state?.heroes?.[heroId];
  return !!(c&&h?.owned&&!h.awakened&&Number(state?.player?.chapter||0)>=c.unlockChapter&&Number(state?.awakening?.stones?.[heroId]||0)>0);
}

export function effectiveHeroProfile(state,heroId,base){
  const c=awakeningConfig(heroId),awakened=!!state?.heroes?.[heroId]?.awakened;
  if(!c||!awakened)return base;
  return {...base,name:c.godName,rarity:7,role:c.role,skill:c.skill};
}

export function awakeningBaseMultiplier(state,heroId){
  const c=awakeningConfig(heroId),awakened=!!state?.heroes?.[heroId]?.awakened;
  if(!c||!awakened)return {atk:1,def:1,hp:1,speed:0};
  return {atk:c.statMul.atk||1,def:c.statMul.def||1,hp:c.statMul.hp||1,speed:c.speed||0};
}

export function awakeningBattleEffects(state,heroId){
  const c=awakeningConfig(heroId);
  return c&&state?.heroes?.[heroId]?.awakened ? (c.effects||[]) : [];
}

export function buyableShardPacks(state,heroId){
  const bought=Number(state?.awakening?.shopBuys?.[heroId]||0);
  return Math.max(0,SOUL_SHARD_PACK_LIMIT-bought);
}

export function synthesizeSoulStone(state,heroId){
  if(!awakeningConfig(heroId))return false;
  const have=Number(state.awakening.fragments[heroId]||0);
  if(have<SOUL_SHARDS_PER_STONE)return false;
  state.awakening.fragments[heroId]=have-SOUL_SHARDS_PER_STONE;
  state.awakening.stones[heroId]=Number(state.awakening.stones[heroId]||0)+1;
  return true;
}
