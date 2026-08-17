// V0.10 每日任务 + 成长任务。
// 正式任务书只固定了任务方向与“轻量活跃度/成长任务补回大量玩家经验”的原则；
// 本文件中的单项活跃值、活跃宝箱具体奖励与18组成长任务门槛属于单机V1暂定配置，后续统一经济校准。

export const DAILY_TASKS = [
  {id:'quick', name:'主线速战', desc:'完成5次主线速战', target:5, activity:130, source:'quickBattles'},
  {id:'inn', name:'客栈兑换', desc:'完成1次传奇招募令兑换', target:1, activity:130, counter:'inn'},
  {id:'scripture', name:'藏经阁', desc:'在藏经阁直接抽取1次功法', target:1, activity:130, counter:'scripture'},
  {id:'moneyTree', name:'摇钱树', desc:'使用摇钱树3次', target:3, activity:130, source:'moneyTreeUses'},
  {id:'tower', name:'千宝塔', desc:'通关3层少林千宝塔', target:3, activity:130, counter:'tower'},
  {id:'meridian', name:'经脉冲穴', desc:'完成5次冲穴/命门突破', target:5, activity:130, counter:'meridian'},
  {id:'weapon', name:'神兵强化', desc:'强化神兵3次', target:3, activity:130, counter:'weapon'},
  {id:'inner', name:'内力修炼', desc:'服丹或进行1次瓶颈突破', target:1, activity:130, counter:'inner'},
  {id:'tomb', name:'古墓奇遇', desc:'挑战或速战古墓1次', target:1, activity:130, counter:'tomb'},
  {id:'kungfu', name:'功法培养', desc:'升级红色功法1次', target:1, activity:130, counter:'kungfu'},
  {id:'hero', name:'侠客培养', desc:'提升侠客等级3次', target:3, activity:130, counter:'hero'},
];

export const DAILY_ACTIVITY_REWARDS = [
  {threshold:100, reward:{copper:50000}},
  {threshold:200, reward:{gems:30}},
  {threshold:400, reward:{heroTokens:5,meridianPills:10}},
  {threshold:600, reward:{gems:60,iron:100}},
  {threshold:1000,reward:{gems:150,heroTokens:10,meridianPills:30,wudaoPills:5}},
];

// 18组总玩家经验 = 1,718,000，落在阶段档案“前18组约170万+”的量级。
export const GROWTH_TASKS = [
  {id:'g01',name:'初入江湖',desc:'推进到第5幕',metric:'chapter',target:5,exp:2000},
  {id:'g02',name:'小有所成',desc:'玩家达到10级',metric:'playerLevel',target:10,exp:3000},
  {id:'g03',name:'初登千宝塔',desc:'千宝塔达到10层',metric:'tower',target:10,exp:5000},
  {id:'g04',name:'经脉初通',desc:'累计贯通20个穴位',metric:'meridianTotal',target:20,exp:8000},
  {id:'g05',name:'江湖渐深',desc:'推进到第20幕',metric:'chapter',target:20,exp:12000},
  {id:'g06',name:'藏经问道',desc:'藏经阁累计抽取10次',metric:'kungfuDraws',target:10,exp:18000},
  {id:'g07',name:'群侠并进',desc:'已拥有侠客等级总和达到20',metric:'heroLevelSum',target:20,exp:25000},
  {id:'g08',name:'百层试锋',desc:'千宝塔达到100层',metric:'tower',target:100,exp:35000},
  {id:'g09',name:'神兵渐成',desc:'已获得神兵强化等级总和达到20',metric:'weaponLevelSum',target:20,exp:50000},
  {id:'g10',name:'五十幕',desc:'推进到第50幕',metric:'chapter',target:50,exp:70000},
  {id:'g11',name:'一甲子未满',desc:'任意侠客内力达到50年',metric:'innerMax',target:50,exp:90000},
  {id:'g12',name:'古墓初探',desc:'古墓奇遇达到10层',metric:'tomb',target:10,exp:110000},
  {id:'g13',name:'天赋初显',desc:'累计贯通220个经脉穴位',metric:'meridianTotal',target:220,exp:130000},
  {id:'g14',name:'功法大成',desc:'任意红色功法达到10级',metric:'kungfuMax',target:10,exp:150000},
  {id:'g15',name:'神品初现',desc:'觉醒1名神品侠客',metric:'awakened',target:1,exp:180000},
  {id:'g16',name:'古墓百层',desc:'古墓奇遇达到100层',metric:'tomb',target:100,exp:210000},
  {id:'g17',name:'内力深厚',desc:'已拥有侠客内力年份总和达到500年',metric:'innerTotal',target:500,exp:240000},
  {id:'g18',name:'后期阵容',desc:'达到110幕并觉醒3名神品侠客',metric:'lateCore',target:1,exp:380000},
];

const COUNTER_KEYS=['inn','scripture','tower','meridian','weapon','inner','tomb','kungfu','hero'];

export function createTasksState(){return {growthClaimed:[]};}
export function createDailyTaskFields(){const taskCounters={};for(const k of COUNTER_KEYS)taskCounters[k]=0;return {taskCounters,activityClaimed:[]};}

export function ensureTaskState(state){
  if(!state.tasks||typeof state.tasks!=='object')state.tasks=createTasksState();
  if(!Array.isArray(state.tasks.growthClaimed))state.tasks.growthClaimed=[];
  if(!state.daily||typeof state.daily!=='object')state.daily={};
  if(!state.daily.taskCounters||typeof state.daily.taskCounters!=='object')state.daily.taskCounters={};
  for(const k of COUNTER_KEYS)state.daily.taskCounters[k]=Math.max(0,Number(state.daily.taskCounters[k]||0));
  if(!Array.isArray(state.daily.activityClaimed))state.daily.activityClaimed=[];
  return state;
}

export function bumpDaily(state,key,amount=1){ensureTaskState(state);if(!(key in state.daily.taskCounters))state.daily.taskCounters[key]=0;state.daily.taskCounters[key]+=Math.max(0,Number(amount)||0);}

export function dailyTaskProgress(state,task){ensureTaskState(state);if(task.source)return Math.max(0,Number(state.daily?.[task.source]||0));return Math.max(0,Number(state.daily?.taskCounters?.[task.counter]||0));}
export function dailyActivity(state){return DAILY_TASKS.reduce((sum,t)=>sum+(dailyTaskProgress(state,t)>=t.target?t.activity:0),0);}

function heroValues(state,fn){return Object.values(state.heroes||{}).filter(h=>h?.owned).map(fn);}
function weaponItems(state){return Object.values(state.weapons?.items||{}).filter(x=>x?.owned);}
function redKungfu(state){return Object.values(state.kungfu?.red||{});}

export function growthTaskProgress(state,task){
  switch(task.metric){
    case 'chapter': return Number(state.player?.chapter||0);
    case 'playerLevel': return Number(state.player?.level||0);
    case 'tower': return Number(state.tower?.highest||0);
    case 'meridianTotal': return heroValues(state,h=>Number(h.meridian?.progress||0)).reduce((a,b)=>a+b,0);
    case 'kungfuDraws': return Number(state.kungfu?.drawCount||0);
    case 'heroLevelSum': return heroValues(state,h=>Number(h.level||0)).reduce((a,b)=>a+b,0);
    case 'weaponLevelSum': return weaponItems(state).reduce((a,x)=>a+Number(x.level||0),0);
    case 'innerMax': return Math.max(0,...heroValues(state,h=>Number(h.innerPower?.year||0)));
    case 'tomb': return Number(state.ancientTomb?.highest||0);
    case 'kungfuMax': return Math.max(0,...redKungfu(state).map(x=>Number(x.level||0)));
    case 'awakened': return heroValues(state,h=>h.awakened?1:0).reduce((a,b)=>a+b,0);
    case 'innerTotal': return heroValues(state,h=>Number(h.innerPower?.year||0)).reduce((a,b)=>a+b,0);
    case 'lateCore': return Number(state.player?.chapter||0)>=110&&heroValues(state,h=>h.awakened?1:0).reduce((a,b)=>a+b,0)>=3?1:0;
    default:return 0;
  }
}

export function grantTaskReward(state,reward={}){
  if(reward.copper)state.player.copper=Number(state.player.copper||0)+reward.copper;
  if(reward.gems)state.player.gems=Number(state.player.gems||0)+reward.gems;
  if(reward.heroTokens)state.player.heroTokens=Number(state.player.heroTokens||0)+reward.heroTokens;
  if(reward.meridianPills)state.player.meridianPills=Number(state.player.meridianPills||0)+reward.meridianPills;
  if(reward.breakthroughPills)state.player.breakthroughPills=Number(state.player.breakthroughPills||0)+reward.breakthroughPills;
  if(reward.iron){state.weapons=state.weapons||{};state.weapons.iron=Number(state.weapons.iron||0)+reward.iron;}
  if(reward.wudaoPills){state.wudao=state.wudao||{};state.wudao.pills=Number(state.wudao.pills||0)+reward.wudaoPills;}
}

export function taskRewardText(reward={}){const p=[];if(reward.copper)p.push(`铜钱+${reward.copper}`);if(reward.gems)p.push(`元宝+${reward.gems}`);if(reward.heroTokens)p.push(`侠客信物+${reward.heroTokens}`);if(reward.meridianPills)p.push(`经脉丹+${reward.meridianPills}`);if(reward.breakthroughPills)p.push(`突破丹+${reward.breakthroughPills}`);if(reward.iron)p.push(`精铁+${reward.iron}`);if(reward.wudaoPills)p.push(`悟道丹+${reward.wudaoPills}`);return p.join(' · ');}
