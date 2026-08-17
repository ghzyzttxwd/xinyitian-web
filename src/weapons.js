// V0.6 神兵系统。
// 结构遵循原版：武器/宝甲/首饰/宝物四类；强化 + 突破1~5；突破吃同名本体1/2/4/8/15。
// 部分具体战斗系数先采用单机版初始实现，后续统一做数值校准，不改变神兵定位。

export const WEAPON_OPEN_LEVEL = 30;
export const WEAPON_MAX_LEVEL = 1000;
export const WEAPON_FORGE_COST = 100;
export const WEAPON_TYPES = { weapon:'武器', armor:'宝甲', accessory:'首饰', treasure:'宝物' };
export const WEAPON_BREAKTHROUGH_COPIES = [1,2,4,8,15];

export const WEAPONS = {
  tulong:{id:'tulong',name:'屠龙刀',slot:'weapon',rarity:6,base:{atk:1800},grow:{atk:180},effect:'斩杀：攻击低血量目标时有机会直接斩杀。'},
  yitian:{id:'yitian',name:'倚天剑',slot:'weapon',rarity:6,base:{atk:1650},grow:{atk:170},effect:'穿防：攻击时无视部分防御，突破越高效果越强。'},
  jiaowei:{id:'jiaowei',name:'焦尾琴',slot:'weapon',rarity:6,base:{atk:1350,hp:5000},grow:{atk:135,hp:500},effect:'回怒：释放绝技后有概率为队友回复怒气。'},
  yuanyang:{id:'yuanyang',name:'鸳鸯刀',slot:'weapon',rarity:6,base:{atk:1500},grow:{atk:150},effect:'借势：复制己方攻击最高侠客的一部分攻击。'},
  shennongzhang:{id:'shennongzhang',name:'神农圣杖',slot:'weapon',rarity:6,base:{atk:1250,hp:8000},grow:{atk:125,hp:800},effect:'生息：提高自身生存与治疗能力。'},

  jinsiruanwei:{id:'jinsiruanwei',name:'金丝软猬甲',slot:'armor',rarity:6,base:{def:1500,hp:9000},grow:{def:150,hp:900},effect:'反震：提高减伤，并反弹部分受到的直接伤害。'},
  taijipao:{id:'taijipao',name:'太极袍',slot:'armor',rarity:6,base:{def:1350,hp:7600},grow:{def:135,hp:760},effect:'灵动：开局获得较高闪避，突破越高越明显。'},
  wucanyi:{id:'wucanyi',name:'乌蚕衣',slot:'armor',rarity:6,base:{def:1650,hp:6800},grow:{def:165,hp:680},effect:'坚韧：稳定提高伤害减免。'},
  chiyanpao:{id:'chiyanpao',name:'赤焰明尊袍',slot:'armor',rarity:6,base:{def:1450,hp:8200},grow:{def:145,hp:820},effect:'明尊护体：兼顾防御和气血。'},

  xuantiezhi:{id:'xuantiezhi',name:'玄铁指环',slot:'accessory',rarity:6,base:{atk:900,hp:6000},grow:{atk:90,hp:600},effect:'吸血：造成伤害后回复自身气血。'},
  shennongnang:{id:'shennongnang',name:'神农药囊',slot:'accessory',rarity:6,base:{def:650,hp:10000},grow:{def:65,hp:1000},effect:'济世：受到攻击后有概率为己方恢复气血。'},
  longwenyu:{id:'longwenyu',name:'龙纹玉佩',slot:'accessory',rarity:6,base:{atk:750,def:750,hp:6000},grow:{atk:75,def:75,hp:600},effect:'龙纹：均衡提高攻防血。'},
  jindingmao:{id:'jindingmao',name:'金顶毗卢帽',slot:'accessory',rarity:6,base:{def:1100,hp:7600},grow:{def:110,hp:760},effect:'护心：偏防御生存。'},

  shenghuoling:{id:'shenghuoling',name:'圣火令',slot:'treasure',rarity:6,base:{atk:1000,hp:5000},grow:{atk:100,hp:500},effect:'圣火：提高绝技伤害。'},
  mengzhuling:{id:'mengzhuling',name:'盟主法令',slot:'treasure',rarity:6,base:{atk:700,def:700,hp:7000},grow:{atk:70,def:70,hp:700},effect:'号令：均衡属性。'},
  shangshanfae:{id:'shangshanfae',name:'赏善罚恶令',slot:'treasure',rarity:6,base:{atk:1100,def:450,hp:5000},grow:{atk:110,def:45,hp:500},effect:'赏善罚恶：偏输出。'},
  yemingzhu:{id:'yemingzhu',name:'夜明珠',slot:'treasure',rarity:6,base:{def:700,hp:9000},grow:{def:70,hp:900},effect:'夜明：偏生存。'},
};

export const FORGE_THEMES = [
  {name:'倚天剑锻造',featured:'yitian',secondary:'jinsiruanwei'},
  {name:'鸳鸯刀锻造',featured:'yuanyang',secondary:'mengzhuling'},
  {name:'屠龙刀锻造',featured:'tulong',secondary:'taijipao'},
  {name:'玄铁指环锻造',featured:'xuantiezhi',secondary:'wucanyi'},
];

export function createWeaponState(){
  const items={};
  Object.keys(WEAPONS).forEach(id=>items[id]={owned:false,copies:0,level:0,breakthrough:0});
  return {iron:0,theme:0,forgeCount:0,items};
}

export function strengthenCost(level){
  const lv=Math.max(0,Number(level)||0);
  return Math.round(25000 + lv*1500);
}

export function breakthroughNeed(stage){
  const s=Math.max(0,Math.min(4,Number(stage)||0));
  return WEAPON_BREAKTHROUGH_COPIES[s];
}

export function weaponRecord(state,id){
  return state?.weapons?.items?.[id] || {owned:false,copies:0,level:0,breakthrough:0};
}

export function weaponStats(state,id){
  const w=WEAPONS[id],r=weaponRecord(state,id);
  if(!w||!r.owned)return {atk:0,def:0,hp:0,power:0};
  const mul=1 + r.breakthrough*.18;
  const out={atk:0,def:0,hp:0,power:0};
  for(const k of ['atk','def','hp'])out[k]=Math.round(((w.base[k]||0)+(w.grow[k]||0)*r.level)*mul);
  out.power=Math.round(out.atk*4.6+out.def*3.5+out.hp*.7+r.breakthrough*8000);
  return out;
}

export function equippedWeaponBonuses(state,heroId){
  const h=state?.heroes?.[heroId],out={atk:0,def:0,hp:0,power:0};
  if(!h)return out;
  for(const id of Object.values(h.weapons||{})){
    if(!id)continue;
    const s=weaponStats(state,id);
    out.atk+=s.atk;out.def+=s.def;out.hp+=s.hp;out.power+=s.power;
  }
  return out;
}

export function weaponBattleEffects(state,heroId){
  const h=state?.heroes?.[heroId],effects=[];
  if(!h)return effects;
  for(const id of Object.values(h.weapons||{})){
    if(!id)continue;
    const r=weaponRecord(state,id),b=Number(r.breakthrough||0);
    if(id==='tulong')effects.push({kind:'execute',threshold:.06+b*.015,chance:.10+b*.04});
    if(id==='yitian')effects.push({kind:'ignoreDef',value:.08+b*.045});
    if(id==='jiaowei')effects.push({kind:'rageSupport',chance:.20+b*.06,amount:1+(b>=4?1:0)});
    if(id==='yuanyang')effects.push({kind:'copyHighestAtk',ratio:.08+b*.04});
    if(id==='jinsiruanwei')effects.push({kind:'reflect',ratio:.04+b*.025,damageReduction:.04+b*.02});
    if(id==='taijipao')effects.push({kind:'dodgeStart',value:8+b*3});
    if(id==='wucanyi')effects.push({kind:'damageReduction',value:5+b*2});
    if(id==='xuantiezhi')effects.push({kind:'lifesteal',ratio:.05+b*.025});
    if(id==='shennongnang')effects.push({kind:'healOnHit',chance:.18+b*.04,ratio:.06+b*.02});
    if(id==='shenghuoling')effects.push({kind:'skillDamage',value:.06+b*.025});
  }
  return effects;
}

export function rollForge(themeIndex=0){
  const theme=FORGE_THEMES[Math.max(0,Math.min(FORGE_THEMES.length-1,Number(themeIndex)||0))];
  const r=Math.random();
  if(r<.45)return theme.featured;
  if(r<.65)return theme.secondary;
  const ids=Object.keys(WEAPONS).filter(id=>id!==theme.featured&&id!==theme.secondary);
  return ids[Math.floor(Math.random()*ids.length)];
}
