// V0.7 古墓奇遇。
// 依据当前项目已确认数据：450层、单机六人挑战、内力材料为主、30/50/100...450层给鸳鸯刀。
// 350层后的原版战力膨胀很明显，当前先保留原版锚点，后续统一做战力校准。

export const ANCIENT_TOMB_OPEN_CHAPTER = 50;
export const ANCIENT_TOMB_MAX_FLOOR = 450;
export const ANCIENT_TOMB_DAILY_ATTEMPTS = 1;

export const ANCIENT_TOMB_POWER_ANCHORS = [
  [1, 1900000],
  [50, 12780000],
  [100, 29700000],
  [150, 67930000],
  [200, 114000000],
  [300, 299000000],
  [350, 1167000000],
  [450, 3337000000],
];

export const ANCIENT_TOMB_MATERIALS = {
  lingzhi:'灵芝',
  bailianguo:'百炼果',
  hugufen:'虎骨粉',
  jingangteng:'金刚藤',
  xuanxuecao:'玄血草',
  renshen:'人参',
  heshouwu:'何首乌',
};

// 已知首次到达节点总计约15把鸳鸯刀。当前按前5节点1把、后5节点2把分配。
export const YUANYANG_FIRST_REWARDS = {
  30:1, 50:1, 100:1, 150:1, 200:1,
  250:2, 300:2, 350:2, 400:2, 450:2,
};

export function ancientTombPower(floor){
  const f=Math.max(1,Math.min(ANCIENT_TOMB_MAX_FLOOR,Number(floor)||1));
  for(let i=0;i<ANCIENT_TOMB_POWER_ANCHORS.length-1;i++){
    const [f1,p1]=ANCIENT_TOMB_POWER_ANCHORS[i], [f2,p2]=ANCIENT_TOMB_POWER_ANCHORS[i+1];
    if(f>=f1&&f<=f2){
      if(f===f1)return p1;if(f===f2)return p2;
      const t=(f-f1)/(f2-f1);
      return Math.round(Math.exp(Math.log(p1)+(Math.log(p2)-Math.log(p1))*t));
    }
  }
  return ANCIENT_TOMB_POWER_ANCHORS.at(-1)[1];
}

export function medicineKeyForFloor(floor){
  const f=Number(floor)||1;
  if(f<=90)return 'xingqi';
  if(f<=180)return 'yuling';
  if(f<=270)return 'wujue';
  if(f<=330)return 'lingqi';
  if(f<=390)return 'lingxian';
  return 'juling';
}

function pickDistinctMaterials(count=2){
  const keys=Object.keys(ANCIENT_TOMB_MATERIALS),picked=[];
  while(picked.length<Math.min(count,keys.length)){
    const key=keys[Math.floor(Math.random()*keys.length)];
    if(!picked.includes(key))picked.push(key);
  }
  return picked;
}

function v1InnerItemsForFloor(floor,firstClear){
  const f=Number(floor)||1,out={};
  // 聚气丹/属性丹的原版完整投放数值未查到，以下为单机V1常驻迁移。
  if(f>=50)out.juqi=1+(f>=250?1:0)+(f>=400?1:0);
  if(firstClear&&f%25===0){
    let pool=f<150?['qiangjin','tongpi','huoxue']:f<250?['atkdan','defdan','hpdan']:['critdan','hitdan','dodgedan','anticritdan','atkdan','defdan','hpdan'];
    out[pool[(Math.floor(f/25)-1)%pool.length]]=1;
  }
  return out;
}

export function rollAncientTombReward(floor,{firstClear=false}={}){
  const f=Math.max(1,Math.min(ANCIENT_TOMB_MAX_FLOOR,Number(floor)||1));
  const materialEach=1+Math.floor((f-1)/100);
  const materials={};
  for(const key of pickDistinctMaterials(f>=250?3:2))materials[key]=materialEach;
  return {
    materials,
    medicineKey:medicineKeyForFloor(f),
    medicineCount:1+(f>=200?1:0)+(f>=350?1:0),
    calmingPills:firstClear&&f%10===0?1:0,
    speedTickets:firstClear?1:0,
    yuanyangCopies:firstClear?Number(YUANYANG_FIRST_REWARDS[f]||0):0,
    soulChoicePacks:firstClear&&f%100===0?1:0,
    wudaoPills:firstClear&&f>=200&&f%50===0 ? 15+Math.floor((f-200)/50)*5 : 0,
    innerItems:v1InnerItemsForFloor(f,firstClear),
  };
}

export function createAncientTombState(){
  const materials={};Object.keys(ANCIENT_TOMB_MATERIALS).forEach(k=>materials[k]=0);
  return {highest:0,attemptsToday:ANCIENT_TOMB_DAILY_ATTEMPTS,speedTickets:0,materials};
}
