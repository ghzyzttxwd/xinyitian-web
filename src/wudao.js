import { isStoryGod } from './story.js';

// V0.24.25 悟道系统收尾。
// 已确认边界：神品后的后期养成；核心材料为悟道丹；原版V15锁死悟道不照搬。
// 具体5阶消耗、元宝商店数量和下列角色机制倍率属于单机V1暂定值，不冒充原版精确数值。

export const WUDAO_MAX_STAGE = 5;
export const WUDAO_STAGE_COSTS = [60, 90, 130, 180, 260];
export const WUDAO_STAGE_PCTS = [0, 3, 6, 10, 15, 22];
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
  const pct=WUDAO_STAGE_PCTS[stage]||0;
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

  // 单机V1悟道角色机制：战斗层实际读取这里的技能配置。
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
    if(stage>=2)effects.push({kind:'lifesteal',ratio:.08,label:'悟道'});
    if(stage>=3)effects.push({kind:'ignoreDef',value:.15,label:'悟道'});
    if(stage>=5)effects.push({kind:'skillDamage',value:.12,label:'悟道'});
  }
  if(heroId==='yangguo'){
    if(stage>=3)effects.push({kind:'ignoreDef',value:.12,label:'悟道'});
    if(stage>=5)effects.push({kind:'skillDamage',value:.15,label:'悟道'});
  }
  if(heroId==='huangrong'){
    if(stage>=3)effects.push({kind:'teamStartShield',ratio:.12,label:'悟道'});
    if(stage>=5)effects.push({kind:'teamReviveOnce',ratio:.35,label:'悟道'});
  }
  if(heroId==='xiaolongnv'){
    if(stage>=5)effects.push({kind:'rageFloorAfterSkill',value:4,label:'悟道'});
  }
  if(heroId==='zhoubotong'){
    if(stage>=3)effects.push({kind:'ignoreDef',value:.12,label:'悟道'});
    // stage4 的10%减伤已经通过 wudaoBonuses 进入 heroStats；这里不再重复叠加一次。
    if(stage>=5)effects.push({kind:'reflect',ratio:.15,damageReduction:.05,label:'悟道'});
  }
  if(heroId==='huiyue'&&stage>=5)effects.push({kind:'teamStartShield',ratio:.08,label:'悟道'});
  if(heroId==='zhangsanfeng'&&stage>=5)effects.push({kind:'skillDamage',value:.12,label:'悟道'});
  if(heroId==='huangyaoshi'&&stage>=5)effects.push({kind:'skillDrainRage',amount:2,label:'悟道'});
  if(heroId==='hongqigong'&&stage>=5)effects.push({kind:'skillDamage',value:.15,label:'悟道'});
  return effects;
}

export function wudaoStageText(heroId,stage){
  const pct=WUDAO_STAGE_PCTS[stage]||0;
  const base=stage<=0?'未悟道':`${['','初窥大道','融会贯通','明心见性','道法自然','返璞归真'][stage]}：三维+${pct}%`;
  const special={
    yangguo:{3:'绝技穿防至少40%，并获得12%通用穿防',4:'额外增伤+10%',5:'绝技30%追击，绝技伤害再+15%'},
    huangrong:{2:'群疗系数至少62%',3:'开局为全队提供12%气血护盾',4:'抗暴+8%',5:'群疗系数至少78%，并可复起1名队友35%气血'},
    guojing:{2:'吸血8%',3:'绝技穿防至少18%，并获得15%通用穿防',4:'暴击+8%',5:'亢龙连发至少80%，绝技伤害再+12%'},
    xiaolongnv:{3:'绝技全队回怒至少3点',4:'闪避+8%',5:'绝技后低怒队友补至4怒'},
    zhoubotong:{2:'绝技穿防至少72%',3:'再获得12%通用穿防',4:'减伤+10%',5:'绝技倍率至少6.15倍，并获得15%反伤与5%额外减伤'},
    huiyue:{3:'治疗系数至少32%',5:'治疗系数至少42%，全队回怒至少3点，开局全队8%气血护盾'},
    guoxiang:{3:'治疗系数至少28%',5:'绝技全队回怒至少3点'},
    zhangsanfeng:{5:'绝技倍率至少1.72倍，绝技伤害再+12%'},
    huangyaoshi:{5:'绝技倍率至少1.42倍，并压制敌方全体2点怒气'},
    hongqigong:{5:'绝技追击至少42%，绝技伤害再+15%'},
  };
  const extra=special[heroId]?.[stage];
  return extra?`${base} · ${extra}`:base;
}
