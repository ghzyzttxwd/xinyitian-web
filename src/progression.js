// 原版玩家成长与主线核心奖励：来自客户端 v580 `rolelv` + `trunk_chapter` + `trunk_event`。
// 资源映射由 v351 AttrId 核对：104=玩家经验，106=铜钱，113=侠客经验。

// rolelv.maxExp 的逐级差分段。区间含义：从上一等级表行递增到 endLevel 时，每行增加 diff。
const ROLE_MAX_EXP_DIFFS=[
  [5,100],[19,200],[20,300],[21,500],[24,2000],[29,10000],[31,20000],
  [41,40000],[51,50000],[61,60000],[71,80000],[81,100000],[91,200000],
  [100,400000],[101,1000000],[111,600000],[121,800000],[131,1000000],
  [201,2000000],[202,6000000],[208,10000000],[210,20000000],[211,10000000],
  [220,1000000],[221,11000000],[230,18000000],[231,23000000],[240,2000000],
];

function roleMaxExp(rowLevel){
  const level=Math.max(1,Math.min(240,Math.floor(Number(rowLevel)||1)));
  if(level<=1)return 0;
  let exp=0,start=2;
  for(const [end,diff] of ROLE_MAX_EXP_DIFFS){
    if(level<start)break;
    const to=Math.min(level,end);
    if(to>=start)exp+=(to-start+1)*diff;
    if(level<=end)break;
    start=end+1;
  }
  return exp;
}

// 当前玩家等级 L 的升级需求读取原表 rolelv[L+1].maxExp。
export function originalPlayerExpToNext(level){
  const lv=Math.max(1,Math.floor(Number(level)||1));
  return lv>=240?0:roleMaxExp(lv+1);
}

// v580 trunk_chapter.level：1~3幕同级；4~13幕每幕跨2级；14幕起为幕数+10（表内至160幕）。
export function originalChapterRequiredLevel(chapter){
  const ch=Math.max(1,Math.floor(Number(chapter)||1));
  if(ch<=3)return ch;
  if(ch<=13)return ch*2-3;
  return Math.min(240,ch+10);
}

// 原客户端 rolelv.zhuxiansaod 是“一次速战计数”的奖励。
// 网页把一幕内的多场战斗合并为一次主线挑战；为避免因此把前期成长压成约1/4，
// 网页的一次“速战”固定按早期一幕4场战斗折算。按钮连续5次即结算20份原表速战奖励。
export const WEB_SWEEP_BATTLE_EQUIVALENT=4;
export function originalSweepReward(level){
  const lv=Math.max(1,Math.min(240,Math.floor(Number(level)||1)));
  const exp=lv<=30?lv*200:(lv-18)*500;
  let heroExp;
  if(lv<=20)heroExp=lv*100;
  else if(lv<=30)heroExp=2100;
  else if(lv<=60)heroExp=2200+Math.floor((lv-31)/10)*100;
  else if(lv<=210)heroExp=2600+Math.floor((lv-61)/10)*200;
  else heroExp=5600;
  return {exp:exp*WEB_SWEEP_BATTLE_EQUIVALENT,heroExp:heroExp*WEB_SWEEP_BATTLE_EQUIVALENT,copper:0};
}

// 网页把原版一幕内的多场 trunk_event 合并成一次挑战，因此这里返回整幕汇总。
export function originalChapterReward(chapter){
  const ch=Math.max(1,Math.floor(Number(chapter)||1));
  if(ch>160)return null;
  const specials={
    1:[100,1000,2000,1],2:[400,2800,5600,2],3:[1600,7200,14400,4],
    4:[2100,6600,13200,3],5:[2000,5200,10400,2],21:[35000,25000,50000,5],
    160:[459000,178000,360000,6],
  };
  if(specials[ch]){const [exp,heroExp,copper,fights]=specials[ch];return {exp,heroExp,copper,fights};}
  let exp,heroExp,fights;
  if(ch<=15)exp=ch*1200-2000;
  else if(ch<=20)exp=ch*2000-14000;
  else exp=ch*3000-21000;
  if(ch<=11)heroExp=ch*1600+2400;
  else if(ch<=20)heroExp=20000;
  else if(ch<=29)heroExp=30000;
  else if(ch<=59)heroExp=36000+Math.floor((ch-30)/10)*6000;
  else heroExp=60000+Math.floor((ch-60)/10)*12000;
  fights=ch<=20?4:6;
  return {exp,heroExp,copper:heroExp*2,fights};
}

export {roleMaxExp};
