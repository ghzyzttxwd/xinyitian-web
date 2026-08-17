// V0.12 VIP礼包 + 后期奇侠资源闭环。
// VIP礼包内容沿用项目已确认的原版档位；V1/V2昆仑两仪剑因V1功法系统只保留红/神功，暂作为早期功法收藏记录。
// 奇侠专属物原资料只规定“元宝限购/充值礼包/千宝塔古墓高层/常驻玩法”，具体数量与价格为单机V1暂定经济值。

export const VIP_GIFTS = [
  {vip:0, price:0, reward:{kungfuFragments:10,heroTokens:2,copper:20000}, desc:'功法残页×10 · 侠客信物×2 · 铜钱2万'},
  {vip:1, price:888, reward:{kunlun:1,heroTokens:10,copper:100000}, desc:'昆仑两仪剑×1 · 侠客信物×10 · 铜钱10万'},
  {vip:2, price:1888, reward:{kunlun:2,heroTokens:20,copper:200000}, desc:'昆仑两仪剑×2 · 侠客信物×20 · 铜钱20万'},
  {vip:3, price:3888, reward:{kungfu:{'104001':1},heroTokens:30,copper:300000}, desc:'真武七截剑×1 · 侠客信物×30 · 铜钱30万'},
  {vip:4, price:8888, reward:{kungfu:{'104001':2},heroTokens:40,copper:400000}, desc:'真武七截剑×2 · 侠客信物×40 · 铜钱40万'},
  {vip:5, price:10888, reward:{kungfu:{'105601':1},heroTokens:50,copper:500000}, desc:'金刚伏魔功×1 · 侠客信物×50 · 铜钱50万'},
  {vip:6, price:20888, reward:{kungfu:{'105601':2},heroTokens:60,copper:600000}, desc:'金刚伏魔功×2 · 侠客信物×60 · 铜钱60万'},
  {vip:7, price:30888, reward:{kungfu:{'105601':3},heroTokens:70,copper:700000}, desc:'金刚伏魔功×3 · 侠客信物×70 · 铜钱70万'},
  {vip:8, price:40888, reward:{hero:'huangshan',heroTokens:80,copper:800000}, desc:'黄衫女×1 · 侠客信物×80 · 铜钱80万'},
  {vip:9, price:50888, reward:{kungfu:{'105601':4},heroTokens:90,copper:900000}, desc:'金刚伏魔功×4 · 侠客信物×90 · 铜钱90万'},
  {vip:10,price:60888, reward:{kungfu:{'105601':5},heroTokens:100,copper:1000000}, desc:'金刚伏魔功×5 · 侠客信物×100 · 铜钱100万'},
  {vip:11,price:80888, reward:{kungfu:{'105601':6},heroTokens:120,copper:1500000}, desc:'金刚伏魔功×6 · 侠客信物×120 · 铜钱150万'},
  {vip:12,price:90888, reward:{kungfu:{'105601':7},skin:'明教教主',copper:2000000}, desc:'金刚伏魔功×7 · 明教教主皮肤 · 铜钱200万'},
  {vip:13,price:108888,reward:{kungfu:{'105601':8},heroTokens:200,copper:3000000}, desc:'金刚伏魔功×8 · 侠客信物×200 · 铜钱300万'},
  {vip:14,price:158888,reward:{kungfu:{'106201':5},title:'氪出强大',frame:'堆金积玉'}, desc:'追魂夺命剑×5 · 称号「氪出强大」· 头像框「堆金积玉」'},
  {vip:15,price:228888,reward:{kungfu:{'106201':5},title:'氪金改命',frame:'金钱帝国'}, desc:'追魂夺命剑×5 · 称号「氪金改命」· 头像框「金钱帝国」'},
];

export function vipGift(vip){return VIP_GIFTS.find(x=>x.vip===Number(vip))||null;}

export const SPECIAL_EXCHANGE_ITEMS = [
  {heroId:'yangguo', item:'纸皮面具'},
  {heroId:'huangrong', item:'桃树'},
  {heroId:'xiaolongnv', item:'玉蜂'},
  {heroId:'guojing', item:'襄阳令'},
  {heroId:'zhoubotong', item:'大鸡腿'},
  {heroId:'huangyaoshi', item:'桃花令'},
  {heroId:'hongqigong', item:'打狗令'},
];

export const SPECIAL_ITEM_PACK_SIZE=100;
export const SPECIAL_ITEM_PACK_PRICE=1500;
export const SPECIAL_ITEM_PACK_LIMIT=10;

export function createVipExtras(){
  const specialShopBuys={};
  for(const x of SPECIAL_EXCHANGE_ITEMS)specialShopBuys[x.item]=0;
  return {kunlunLiangyi:0,skins:[],titles:[],frames:[],specialChoicePacks:0,specialShopBuys};
}

export function towerSpecialChoicePack(floor){
  const f=Number(floor)||0;
  return f>=500&&f<=2500&&f%250===0?1:0;
}

export function tombSpecialChoicePack(floor,firstClear=false){
  const f=Number(floor)||0;
  return firstClear&&f>=100&&f<=400&&f%100===0?1:0;
}
