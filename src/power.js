// V0.11 战力校准。
// basePower 优先采用 v580 `xiake.zhanli` 原版模板值。
// 主角原表依剧情成长、没有单一固定模板战力；当前V1以8000作为早期显示基准。
// 黄药师/洪七公是本项目补入角色，按110幕后期传奇档210000对齐，不冒充原版值。

export const HERO_BASE_POWER = {
  player: 8000,
  wuji: 8000,
  xiaozhao: 8000,
  yangxiao: 60000,
  yangdingtian: 120000,
  guoxiang: 120000,
  zhangsanfeng: 180000,
  duer: 180000,
  dunan: 180000,
  dujie: 180000,
  huiyue: 180000,
  huangshan: 120000,
  yangguo: 210000,
  huangrong: 210000,
  xiaolongnv: 210000,
  guojing: 210000,
  zhoubotong: 210000,
  huangyaoshi: 210000,
  hongqigong: 210000,
};

function coreRating(stats,{kungfuPower=0,weaponPower=0}={}){
  if(!stats)return 0;
  return Number(stats.atk||0)*4.6
    + Number(stats.def||0)*3.5
    + Number(stats.hp||0)*.7
    + Number(stats.speed||0)*6
    + (Number(stats.hit||0)+Number(stats.dodge||0)+Number(stats.crit||0)+Number(stats.antiCrit||0)+Number(stats.damageBonus||0)+Number(stats.damageReduction||0))*1200
    + Number(kungfuPower||0)+Number(weaponPower||0);
}

export function calibratedHeroPower(heroId,baseStats,currentStats,{kungfuPower=0,weaponPower=0}={}){
  const basePower=Number(HERO_BASE_POWER[heroId]||8000);
  const baseline=coreRating(baseStats);
  const current=coreRating(currentStats,{kungfuPower,weaponPower});
  // 原版模板战力负责“角色档位”，当前养成系统只叠加超过裸模板的增量。
  return Math.max(basePower,Math.round(basePower+Math.max(0,current-baseline)));
}

// 任务书已确认的原版少林千宝塔战力锚点。
export const TOWER_POWER_ANCHORS = [
  [1,2400],
  [100,84700],
  [500,1340000],
  [1000,7630000],
  [1500,15190000],
  [2000,28040000],
  [2500,63800000],
];

export function towerPowerRating(floor){
  const f=Math.max(1,Math.min(2500,Number(floor)||1));
  for(let i=0;i<TOWER_POWER_ANCHORS.length-1;i++){
    const [f1,p1]=TOWER_POWER_ANCHORS[i], [f2,p2]=TOWER_POWER_ANCHORS[i+1];
    if(f>=f1&&f<=f2){
      if(f===f1)return p1;if(f===f2)return p2;
      const t=(f-f1)/(f2-f1);
      return Math.round(Math.exp(Math.log(p1)+(Math.log(p2)-Math.log(p1))*t));
    }
  }
  return TOWER_POWER_ANCHORS.at(-1)[1];
}
