import { isStoryGod } from './story.js';

// V0.9 悟道系统。
// 已确认边界：神品后的后期养成；核心材料为悟道丹；原版V15锁死悟道不照搬。
// 具体5阶消耗与元宝商店数量属于单机V1暂定值，后续统一经济校准。

export const WUDAO_MAX_STAGE = 5;
export const WUDAO_STAGE_COSTS = [60, 90, 130, 180, 260];
export const WUDAO_SHOP_PACK = 20;
export const WUDAO_SHOP_PRICE = 800;
export const WUDAO_RECHARGE_PRICE = 648;
export const WUDAO_RECHARGE_GEMS = 6480;
export const WUDAO_RECHARGE_PILLS = 486;
export const WUDAO_RECHARGE_LIMIT = 10;

export function createWudaoState(){
  return { pills:0, rechargePackBuys:0 };
}

export function wudaoShopDailyLimit(vip){
  return Number(vip||0) >= 15 ? 5 : 2;
}

export function ensureHeroWudao(hero){
  if(!hero)return {stage:0};
  if(!hero.wudao || typeof hero.wudao!=='object') hero.wudao={stage:0};
  hero.wudao.stage=Math.max(0,Math.min(WUDAO_MAX_STAGE,Number(hero.wudao.stage||0)));
  return hero.wudao;
}

export function wudaoStage(state,heroId){
  const h=state?.heroes?.[heroId];
  if(!h?.awakened&&!isStoryGod(state,heroId))return 0;
  return Math.max(0,Math.min(WUDAO_MAX_STAGE,Number(h?.wudao?.stage||0)));
}

export function nextWudaoCost(state,heroId){
  const stage=wudaoStage(state,heroId);
  return stage>=WUDAO_MAX_STAGE?0:WUDAO_STAGE_COSTS[stage];
}

export function wudaoBonuses(state,heroId){
  const stage=wudaoStage(state,heroId);
  const pct=[0,3,6,10,15,22][stage]||0;
  const out={atkPct:pct,defPct:pct,hpPct:pct,crit:0,hit:0,dodge:0,antiCrit:0,damageBonus:0,damageReduction:0};
  if(heroId==='guojing'&&stage>=4)out.crit+=8;
  if(heroId==='xiaolongnv'&&stage>=4)out.dodge+=8;
  if(heroId==='zhoubotong'&&stage>=4)out.damageReduction+=10;
  if(heroId==='yangguo'&&stage>=4)out.damageBonus+=10;
  if(heroId==='huangrong'&&stage>=4)out.antiCrit+=8;
  return out;
}

export function applyWudaoProfile(state,heroId,profile){
  const stage=wudaoStage(state,heroId);
  if(!profile||stage<=0)return profile;
  const skill={...(profile.skill||{})};

  // 已确认悟道方向的V1实现：尽量复现角色定位，具体倍率后续统一校准。
  if(heroId==='yangguo'){
    if(stage>=3)skill.ignoreDef=Math.max(Number(skill.ignoreDef||0),.40);
    if(stage>=5)skill.repeatChance=Math.max(Number(skill.repeatChance||0),.30);
  }
  if(heroId==='huangrong'){
    if(stage>=2)skill.healTeam=Math.max(Number(skill.healTeam||0),.62);
    if(stage>=5)skill.healTeam=Math.max(Number(skill.healTeam||0),.78);
  }
  if(heroId==='guojing'){
    if(stage>=3)skill.ignoreDef=Math.max(Number(skill.ignoreDef||0),.18);
    if(stage>=5)skill.repeatChance=Math.max(Number(skill.repeatChance||0),.80);
  }
  if(heroId==='xiaolongnv'){
    if(stage>=3)skill.teamRage=Math.max(Number(skill.teamRage||0),3);
  }
  if(heroId==='zhoubotong'){
    if(stage>=2)skill.ignoreDef=Math.max(Number(skill.ignoreDef||0),.72);
    if(stage>=5)skill.multiplier=Math.max(Number(skill.multiplier||0),6.15);
  }
  if(heroId==='huiyue'){
    if(stage>=3)skill.healTeam=Math.max(Number(skill.healTeam||0),.32);
    if(stage>=5){skill.healTeam=Math.max(Number(skill.healTeam||0),.42);skill.teamRage=Math.max(Number(skill.teamRage||0),3);}
  }
  if(heroId==='guoxiang'){
    if(stage>=3)skill.healTeam=Math.max(Number(skill.healTeam||0),.28);
    if(stage>=5)skill.teamRage=Math.max(Number(skill.teamRage||0),3);
  }
  if(heroId==='zhangsanfeng'&&stage>=5)skill.multiplier=Math.max(Number(skill.multiplier||0),1.72);
  if(heroId==='huangyaoshi'&&stage>=5)skill.multiplier=Math.max(Number(skill.multiplier||0),1.42);
  if(heroId==='hongqigong'&&stage>=5)skill.repeatChance=Math.max(Number(skill.repeatChance||0),.42);

  return {...profile,skill};
}

export function wudaoBattleEffects(state,heroId){
  const stage=wudaoStage(state,heroId),effects=[];
  if(stage<=0)return effects;

  if(heroId==='guojing'){
    if(stage>=2)effects.push({kind:'lifesteal',ratio:.08});
    if(stage>=3)effects.push({kind:'ignoreDef',value:.15});
    if(stage>=5)effects.push({kind:'skillDamage',value:.12});
  }
  if(heroId==='yangguo'){
    if(stage>=3)effects.push({kind:'ignoreDef',value:.12});
    if(stage>=5)effects.push({kind:'skillDamage',value:.15});
  }
  if(heroId==='huangrong'){
    if(stage>=3)effects.push({kind:'teamStartShield',ratio:.12});
    if(stage>=5)effects.push({kind:'teamReviveOnce',ratio:.35});
  }
  if(heroId==='xiaolongnv'){
    if(stage>=5)effects.push({kind:'rageFloorAfterSkill',value:4});
  }
  if(heroId==='zhoubotong'){
    if(stage>=3)effects.push({kind:'ignoreDef',value:.12});
    if(stage>=4)effects.push({kind:'damageReduction',value:10});
    if(stage>=5)effects.push({kind:'reflect',ratio:.15,damageReduction:.05});
  }
  if(heroId==='huiyue'&&stage>=5)effects.push({kind:'teamStartShield',ratio:.08});
  if(heroId==='zhangsanfeng'&&stage>=5)effects.push({kind:'skillDamage',value:.12});
  if(heroId==='huangyaoshi'&&stage>=5)effects.push({kind:'skillDrainRage',amount:2});
  if(heroId==='hongqigong'&&stage>=5)effects.push({kind:'skillDamage',value:.15});
  return effects;
}

export function wudaoStageText(heroId,stage){
  const generic=['未悟道','初窥大道：三维+3%','融会贯通：三维+6%','明心见性：三维+10%并强化核心机制','道法自然：三维+15%并强化战斗属性','返璞归真：三维+22%，核心机制完成'];
  const special={
    yangguo:['','基础悟道','基础悟道','强化玄铁穿防','提高伤害','绝技可连续追击'],
    huangrong:['','基础悟道','强化群疗','开局护盾','提高生存','解锁一次团队复起'],
    guojing:['','基础悟道','获得吸血','提高穿防','叠加暴击','强化亢龙连发'],
    xiaolongnv:['','基础悟道','基础悟道','强化全队回怒','提高闪避','绝技后把低怒队友补到4怒'],
    zhoubotong:['','基础悟道','强化穿防','继续强化穿防','提高减伤','反击反伤方向成型'],
    huiyue:['','基础悟道','基础悟道','强化治疗','基础属性提高','强化治疗、护盾与回怒'],
  };
  return special[heroId]?.[stage]||generic[stage]||'';
}
