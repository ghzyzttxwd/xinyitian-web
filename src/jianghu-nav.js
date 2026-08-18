import { saveState, addPlayerExp } from './state.js';
import { originalSweepReward, WEB_SWEEP_BATTLE_EQUIVALENT } from './progression.js';
import { RED_KUNGFU, DIVINE_KUNGFU } from './kungfu.js';
import { INNER_POWER_MEDICINES } from './innerpower.js';
import { WEAPONS } from './weapons.js';
import { ANCIENT_TOMB_MATERIALS, ANCIENT_TOMB_OPEN_CHAPTER, ANCIENT_TOMB_MAX_FLOOR, ancientTombPower } from './ancienttomb.js';
import { AWAKENINGS, SOUL_SHARDS_PER_STONE } from './awakening.js';
import { bumpDaily } from './tasks.js';

const pageEl = document.querySelector('#page');
const bottomNav = document.querySelector('.bottom-nav');
const bottomMore = bottomNav?.querySelector('[data-page="more"]');
const bottomChallenge = bottomNav?.querySelector('[data-page="challenge"]');
const SAVE_KEY = 'xinyitian_single_v1';
let activePanel=null;

const MALL_GOODS=[
  {id:'heroTokens',name:'侠客信物',desc:'客栈兑换侠客招募令',amount:1,price:50,level:10,source:'3008521'},
  {id:'kungfuTickets',name:'功法帖',desc:'藏经阁抽取功法',amount:1,price:300,level:10,source:'3002502'},
  {id:'heroExp',name:'侠客经验',desc:'提升侠客等级',amount:1000,price:10,level:10,source:'113'},
  {id:'meridianPills',name:'经脉丹',desc:'经脉冲穴与突破',amount:1,price:10,level:10,source:'3004205'},
  {id:'kungfuFragments',name:'功法残页',desc:'功法养成资源',amount:1,price:50,level:10,source:'3000038'},
];

function readSave(){
  try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{return {};}
}
function liveState(){return globalThis.__XYT_STATE__ || readSave();}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function syncResourceBar(){
  const s=liveState(),p=s.player||{};
  const values={铜钱:fmt(p.copper),元宝:fmt(p.gems),体力:`${fmt(p.stamina)}/${fmt(p.staminaCap)}`,侠客经验:fmt(p.heroExp),传奇令:fmt(p.legendTokens),等级:`Lv.${fmt(p.level)}`};
  document.querySelectorAll('#resourceBar .resource-item').forEach(item=>{
    const label=item.querySelector('.resource-label')?.textContent?.trim();
    if(label&&label in values){const v=item.querySelector('.resource-value');if(v)v.textContent=values[label];}
  });
}

function removeLegacyHomeEntries(){
  if(pageEl.dataset.page!=='home')return;
  for(const card of pageEl.querySelectorAll(':scope > section.card')){
    if(card.querySelector('h3')?.textContent.trim()==='主线')card.remove();
  }
  for(const block of pageEl.querySelectorAll(':scope > section.grid-2')){
    const text=block.textContent||'';
    if(text.includes('少林千宝塔')&&text.includes('模拟充值'))block.remove();
  }
}

function bagItem(name,qty,desc=''){
  return `<div class="bag-item"><div class="bag-item-main"><b>${esc(name)}</b>${desc?`<small>${esc(desc)}</small>`:''}</div><strong>×${fmt(qty)}</strong></div>`;
}
function bagSection(title,items,empty='暂无物品'){
  return `<section class="card bag-section"><div class="section-title"><h3>${esc(title)}</h3><small>${items.length}类</small></div>${items.length?`<div class="bag-grid">${items.join('')}</div>`:`<div class="empty-bag">${esc(empty)}</div>`}</section>`;
}
function renderBackpack(){
  if(pageEl.dataset.page!=='challenge')return;
  const s=liveState(),p=s.player||{};
  const core=[
    bagItem('侠客经验',p.heroExp||0,'侠客升级'),bagItem('侠客信物',p.heroTokens||0,'客栈兑换'),bagItem('传奇招募令',p.legendTokens||0,'传奇招募'),
    bagItem('经脉丹',p.meridianPills||0,'经脉冲穴'),bagItem('突破丹',p.breakthroughPills||0,'经脉突破'),bagItem('功法帖',p.kungfuTickets||0,'藏经阁抽取'),
    bagItem('功法残页',s.kungfu?.fragments||0,'功法资源'),bagItem('悟道丹',s.wudao?.pills||0,'神品悟道'),bagItem('精铁',s.weapons?.iron||0,'神兵锻造'),bagItem('天外陨铁',s.weapons?.meteorIron||0,'神兵熔铸')
  ];
  const kungfu=[];
  for(const [id,k] of Object.entries(RED_KUNGFU)){
    const copies=Number(s.kungfu?.red?.[id]?.copies||0);
    if(copies>0)kungfu.push(bagItem(`${k.name}本体`,copies,'红功法升级消耗'));
  }
  for(const [id,n] of Object.entries(s.kungfu?.scrolls||{}))if(Number(n)>0)kungfu.push(bagItem(`${DIVINE_KUNGFU[id]?.name||id}卷`,n,'神功融合材料'));
  const inner=Object.entries(INNER_POWER_MEDICINES).filter(([id])=>Number(s.innerPower?.items?.[id]||0)>0).map(([id,m])=>bagItem(m.name,s.innerPower.items[id],'内力养成'));
  const tomb=Object.entries(ANCIENT_TOMB_MATERIALS).filter(([id])=>Number(s.ancientTomb?.materials?.[id]||0)>0).map(([id,name])=>bagItem(name,s.ancientTomb.materials[id],'古墓材料'));
  if(Number(s.ancientTomb?.speedTickets||0)>0)tomb.push(bagItem('古墓速战卷',s.ancientTomb.speedTickets,'古墓速战'));
  const souls=[];
  for(const [id,c] of Object.entries(AWAKENINGS)){
    const f=Number(s.awakening?.fragments?.[id]||0),stone=Number(s.awakening?.stones?.[id]||0);
    if(f>0)souls.push(bagItem(`${c.godName}魂石碎片`,f,`${SOUL_SHARDS_PER_STONE}碎片合成1魂石`));
    if(stone>0)souls.push(bagItem(`${c.godName}魂石`,stone,'神品觉醒'));
  }
  if(Number(s.awakening?.choicePacks||0)>0)souls.push(bagItem('神品魂石碎片自选箱',s.awakening.choicePacks,'神品材料'));
  const weapons=Object.entries(WEAPONS).filter(([id])=>Number(s.weapons?.items?.[id]?.copies||0)>0).map(([id,w])=>bagItem(`${w.name}备用本体`,s.weapons.items[id].copies,'突破/熔铸'));
  const special=Object.entries(s.specials||{}).filter(([,n])=>Number(n)>0).map(([name,n])=>bagItem(name,n,'奇侠兑换物'));
  if(Number(s.vipExtras?.specialChoicePacks||0)>0)special.push(bagItem('奇侠兑换物自选包',s.vipExtras.specialChoicePacks,'奇侠资源'));
  if(Number(s.vipExtras?.kunlunLiangyi||0)>0)special.push(bagItem('昆仑两仪剑',s.vipExtras.kunlunLiangyi,'礼包收藏'));
  pageEl.innerHTML=`<div class="section-title"><h2>背包</h2><small>当前存档真实库存</small></div><section class="card bag-wallet"><div><span>铜钱</span><b>${fmt(p.copper)}</b></div><div><span>元宝</span><b>${fmt(p.gems)}</b></div><div><span>体力</span><b>${fmt(p.stamina)}/${fmt(p.staminaCap)}</b></div></section>${bagSection('常用材料',core)}${bagSection('功法材料',kungfu)}${bagSection('内力药物',inner)}${bagSection('古墓材料',tomb)}${bagSection('神品材料',souls)}${bagSection('神兵备用本体',weapons)}${bagSection('奇侠与礼包',special)}`;
}

function hubTile(kind,seal,title,sub){
  const btn=document.createElement('button');
  btn.className='hub-tile jh-primary-tile';
  btn.type='button';btn.dataset.jhPanel=kind;
  btn.innerHTML=`<span class="hub-seal">${seal}</span><span class="hub-title">${title}</span><span class="hub-sub">${sub}</span><span class="hub-arrow">›</span>`;
  return btn;
}
function ensureTile(grid,kind,seal,title,sub){
  let tile=grid.querySelector(`[data-jh-panel="${kind}"]`);
  if(!tile){tile=hubTile(kind,seal,title,sub);grid.appendChild(tile);}
  return tile;
}
function enhanceJianghuHub(){
  if(pageEl.dataset.page!=='more'||pageEl.dataset.more!=='hub')return;
  const grid=pageEl.querySelector('.hub-grid');if(!grid)return;
  const main=ensureTile(grid,'mainline','主','主线','挑战当前幕 / 连续速战');
  const tower=ensureTile(grid,'tower','塔','少林千宝塔','永久爬塔 / 经脉资源');
  const tomb=ensureTile(grid,'tomb','墓','古墓奇遇','内力材料 / 450层');
  const mall=ensureTile(grid,'mall','商','商城','原版基础元宝商城');
  const vip=grid.querySelector('[data-more-section="vip"]');
  const first=grid.firstElementChild;if(first!==main)grid.insertBefore(main,first);
  if(main.nextElementSibling!==tower)grid.insertBefore(tower,main.nextElementSibling);
  if(tower.nextElementSibling!==tomb)grid.insertBefore(tomb,tower.nextElementSibling);
  if(tomb.nextElementSibling!==mall)grid.insertBefore(mall,tomb.nextElementSibling);
  if(vip&&mall.nextElementSibling!==vip)grid.insertBefore(vip,mall.nextElementSibling);
}

function subHead(title,sub){return `<div class="subpage-head"><button class="back-link" type="button" data-jh-back>‹ 江湖</button><div><span class="eyebrow">江湖</span><h2>${title}</h2><small>${sub}</small></div></div>`;}
function subpageShell(inner){return `<div class="jh-subpage-backdrop" data-jh-backdrop><div class="jh-subpage-panel">${inner}</div></div>`;}
function renderMainlinePanel(){
  const s=liveState(),p=s.player||{},chapter=Number(p.chapter||1),stamina=Number(p.stamina||0);
  pageEl.dataset.more='mainline-panel';
  pageEl.innerHTML=subpageShell(`${subHead('主线','剧情推进 / 连续速战')}<section class="card featured-card jh-action-card"><div class="section-title"><h3>第${chapter}幕</h3><small>体力 ${fmt(stamina)}</small></div><div class="notice">单次速战仍按5体力。网页版一幕合并了原版多场战斗，因此速战5次按${WEB_SWEEP_BATTLE_EQUIVALENT}场/幕折算，共逐次结算${5*WEB_SWEEP_BATTLE_EQUIVALENT}份原版速战奖励。</div><div class="action-row jh-big-actions"><button class="btn btn-primary" data-action="chapter">挑战第${chapter}幕</button><button class="btn btn-gold" data-action="quick" ${stamina<25?'disabled':''}>速战5次 · 25体力</button></div></section>`);
}
function renderTowerPanel(){
  const s=liveState(),highest=Number(s.tower?.highest||0),next=highest+1;
  pageEl.dataset.more='tower-panel';
  pageEl.innerHTML=subpageShell(`${subHead('少林千宝塔','永久爬塔 / 经脉资源')}<section class="card featured-card jh-action-card"><span class="tag">永久爬塔</span><div class="section-title" style="margin-top:8px"><h3>已通关 ${fmt(highest)} 层</h3><small>下一层 ${fmt(next)}</small></div><div class="notice">按当前千宝塔规则结算经脉丹、突破丹及高层节点奖励。</div><button class="btn btn-primary btn-block jh-big-button" data-action="tower">挑战第${fmt(next)}层</button></section>`);
}
function renderTombPanel(){
  const s=liveState(),p=s.player||{},t=s.ancientTomb||{},open=Number(p.chapter||0)>=ANCIENT_TOMB_OPEN_CHAPTER,highest=Number(t.highest||0),done=highest>=ANCIENT_TOMB_MAX_FLOOR,next=Math.min(ANCIENT_TOMB_MAX_FLOOR,highest+1),power=ancientTombPower(next);
  pageEl.dataset.more='tomb-panel';
  const mats=Object.entries(ANCIENT_TOMB_MATERIALS).map(([id,name])=>`${name}${fmt(t.materials?.[id]||0)}`).join(' · ');
  pageEl.innerHTML=subpageShell(`${subHead('古墓奇遇','内力材料 / 450层')}<section class="card featured-card jh-action-card ${open?'':'locked'}"><div class="section-title"><div><span class="tag">内力资源区</span><h3>已通关 ${fmt(highest)} 层</h3></div><small>今日挑战 ${fmt(t.attemptsToday||0)}次</small></div><div class="muted">${done?'450层全部通关':`下一层 ${fmt(next)} · 推荐战力约 ${fmt(power)}`}</div><div class="notice" style="margin-top:10px">主要产出内力药材、内力散、聚气丹与属性丹；首次节点还会产出鸳鸯刀等资源。</div><div class="hero-meta" style="margin-top:8px">药材：${mats}</div><div class="hero-meta">古墓速战卷 ${fmt(t.speedTickets||0)}</div><div class="action-row" style="margin-top:10px"><button class="btn btn-primary" data-action="ancientTomb" ${open&&!done&&Number(t.attemptsToday||0)>0?'':'disabled'}>${open?done?'已通关':`挑战${fmt(next)}层`:`第${ANCIENT_TOMB_OPEN_CHAPTER}幕开放`}</button><button class="btn btn-gold" data-action="ancientTombSpeed" ${open&&highest>0&&Number(t.speedTickets||0)>0?'':'disabled'}>速战已通关层</button></div></section>`);
}
function mallGoodCard(g){
  const s=liveState(),p=s.player||{},open=Number(p.level||0)>=g.level,can1=open&&Number(p.gems||0)>=g.price,can10=open&&Number(p.gems||0)>=g.price*10;
  return `<div class="mall-good ${open?'':'locked'}"><div class="mall-good-head"><div><b>${g.name}</b><small>${g.desc}</small></div><span class="mall-price"><img src="./assets/original/icon-gems.png" alt="">${fmt(g.price)}</span></div><div class="hero-meta">每份 ×${fmt(g.amount)} · ${open?'已解锁':`Lv.${g.level}解锁`}</div><div class="action-row"><button class="btn" data-mall-buy="${g.id}" data-mall-qty="1" ${can1?'':'disabled'}>购买1份</button><button class="btn btn-gold" data-mall-buy="${g.id}" data-mall-qty="10" ${can10?'':'disabled'}>购买10份</button></div></div>`;
}
function renderMallPanel(){
  const s=liveState(),p=s.player||{};pageEl.dataset.more='mall-panel';
  pageEl.innerHTML=subpageShell(`${subHead('商城','原版基础元宝商城')}<section class="card mall-banner"><div><span class="eyebrow">元宝余额</span><div class="big-number">${fmt(p.gems)}</div></div><img src="./assets/original/icon-gems.png" alt="元宝"></section><section class="card"><div class="section-title"><h3>常驻商品</h3><small>Lv.10开放</small></div><div class="notice">价格与门槛按当前原版客户端基础商城。朱果属于已删除的宠物系统；改名卡在当前单机版没有命名用途，因此不投放死道具。</div><div class="mall-grid">${MALL_GOODS.map(mallGoodCard).join('')}</div></section>`);
}
function grantMallGood(s,id,qty){
  const n=Math.max(1,Math.floor(Number(qty)||1),0);
  if(id==='heroTokens')s.player.heroTokens=Number(s.player.heroTokens||0)+n;
  if(id==='kungfuTickets')s.player.kungfuTickets=Number(s.player.kungfuTickets||0)+n;
  if(id==='heroExp')s.player.heroExp=Number(s.player.heroExp||0)+1000*n;
  if(id==='meridianPills')s.player.meridianPills=Number(s.player.meridianPills||0)+n;
  if(id==='kungfuFragments')s.kungfu.fragments=Number(s.kungfu.fragments||0)+n;
}
function buyMallItem(id,qty=1){
  const s=liveState(),g=MALL_GOODS.find(x=>x.id===id),n=Number(qty)===10?10:1;if(!g||!s.player)return;
  if(Number(s.player.level||0)<g.level)return alert(`商城需要玩家Lv.${g.level}。`);
  const cost=g.price*n;if(Number(s.player.gems||0)<cost)return alert(`元宝不足，需要${fmt(cost)}。`);
  s.player.gems-=cost;grantMallGood(s,id,n);saveState(s);syncResourceBar();renderMallPanel();alert(`购买成功：【${g.name}】×${fmt(g.amount*n)}，消耗${fmt(cost)}元宝。`);
}

function leaveSubpage(){if(!activePanel)return;activePanel=null;bottomMore?.click();}
function renderActivePanel(){
  if(activePanel==='mainline')return renderMainlinePanel();
  if(activePanel==='tower')return renderTowerPanel();
  if(activePanel==='tomb')return renderTombPanel();
  if(activePanel==='mall')return renderMallPanel();
}

function patchKungfuTicketButtons(){
  if(pageEl.dataset.page!=='growth')return;
  const s=liveState(),p=s.player||{},tickets=Math.max(0,Number(p.kungfuTickets||0));
  for(const [action,n] of [['drawKungfu1',1],['drawKungfu5',5]]){
    const btn=pageEl.querySelector(`[data-action="${action}"]`);if(!btn)continue;
    const used=Math.min(n,tickets),cost=(n-used)*300;
    btn.disabled=Number(p.gems||0)<cost;
    btn.textContent=used===n?`抽${n}次 · 功法帖${used}`:used?`抽${n}次 · 功法帖${used} + ${cost}元宝`:`抽${n}次 · ${cost}元宝`;
  }
}
function patchSettingsVersion(){
  if(pageEl.dataset.page!=='more'||pageEl.dataset.more!=='settings')return;
  pageEl.querySelectorAll('.hero-meta').forEach(el=>{if(el.textContent.includes('V0.21 · 手机优先'))el.textContent=el.textContent.replace('V0.21','V0.22.1');});
}
function applyNavigationCleanup(){
  if(bottomChallenge){const span=bottomChallenge.querySelector('span');if(span&&span.textContent!=='背包')span.textContent='背包';}
  removeLegacyHomeEntries();
  if(pageEl.dataset.page==='challenge'){
    const title=pageEl.querySelector(':scope > .section-title h2')?.textContent?.trim();
    if(title!=='背包')renderBackpack();
    return;
  }
  if(pageEl.dataset.page==='more'&&pageEl.dataset.more==='hub'&&activePanel){renderActivePanel();return;}
  enhanceJianghuHub();patchKungfuTicketButtons();patchSettingsVersion();
}

function runWebQuickBattle(){
  const s=liveState(),times=5,total=times*WEB_SWEEP_BATTLE_EQUIVALENT,cost=times*5;if(!s.player)return;
  if(Number(s.player.stamina||0)<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);
  s.player.stamina-=cost;s.daily.quickBattles=Number(s.daily.quickBattles||0)+times;
  let exp=0,heroExp=0,copper=0;
  for(let i=0;i<total;i++){
    const one=originalSweepReward(s.player.level);exp+=Number(one.exp||0);heroExp+=Number(one.heroExp||0);copper+=Number(one.copper||0);addPlayerExp(s,one.exp);
  }
  s.player.heroExp=Number(s.player.heroExp||0)+heroExp;s.player.copper=Number(s.player.copper||0)+copper;saveState(s);syncResourceBar();
  if(activePanel==='mainline')renderMainlinePanel();
  const parts=[`玩家经验 +${fmt(exp)}`,`侠客经验 +${fmt(heroExp)}`];if(copper)parts.push(`铜钱 +${fmt(copper)}`);
  alert(`连续速战5次完成：按${WEB_SWEEP_BATTLE_EQUIVALENT}场/幕逐次结算${total}份原版奖励，${parts.join('，')}，体力 -${cost}。`);
}
function runKungfuDrawWithTickets(times){
  const s=liveState(),n=Number(times)===5?5:1,tickets=Math.min(n,Math.max(0,Number(s.player?.kungfuTickets||0)));if(tickets<=0)return false;
  const cost=(n-tickets)*300;if(Number(s.player.gems||0)<cost){alert(`元宝不足，需要${fmt(cost)}元宝补足剩余次数。`);return true;}
  s.player.kungfuTickets-=tickets;s.player.gems-=cost;const reds=[];let fragments=0;
  for(let i=0;i<n;i++){
    s.kungfu.drawCount=Number(s.kungfu.drawCount||0)+1;
    if(Math.random()<.02){const ids=Object.keys(RED_KUNGFU),id=ids[Math.floor(Math.random()*ids.length)],rec=s.kungfu.red[id];if(rec.level<=0)rec.level=1;else rec.copies=Number(rec.copies||0)+1;reds.push(RED_KUNGFU[id].name);}else{s.kungfu.fragments=Number(s.kungfu.fragments||0)+1;fragments++;}
  }
  bumpDaily(s,'scripture',n);saveState(s);syncResourceBar();document.querySelector('.bottom-nav [data-page="growth"]')?.click();
  alert(`藏经阁抽取${n}次：消耗功法帖${tickets}${cost?` + ${fmt(cost)}元宝`:''}；${reds.length?`红色功法：${reds.join('、')}`:'未获得红色功法'}${fragments?`；功法残页 +${fragments}`:''}。`);return true;
}

pageEl.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.action==='quick'){
    e.preventDefault();e.stopImmediatePropagation();runWebQuickBattle();return;
  }
  if(btn.dataset.action==='drawKungfu1'||btn.dataset.action==='drawKungfu5'){
    const used=runKungfuDrawWithTickets(btn.dataset.action==='drawKungfu5'?5:1);
    if(used){e.preventDefault();e.stopImmediatePropagation();return;}
  }
},true);

pageEl.addEventListener('click',e=>{
  if(e.target.closest('[data-jh-backdrop]')&&!e.target.closest('.jh-subpage-panel')){leaveSubpage();return;}
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.jhPanel){activePanel=btn.dataset.jhPanel;renderActivePanel();return;}
  if(btn.dataset.mallBuy){buyMallItem(btn.dataset.mallBuy,Number(btn.dataset.mallQty||1));return;}
  if(btn.dataset.jhBack!==undefined)leaveSubpage();
});

document.addEventListener('click',e=>{
  if(!activePanel)return;
  if(e.target.closest('.jh-subpage-panel')||e.target.closest('.bottom-nav')||e.target.closest('[data-jh-backdrop]'))return;
  if(e.target.closest('.topbar')||e.target.closest('.resource-bar'))leaveSubpage();
},true);

bottomNav?.addEventListener('click',e=>{const btn=e.target.closest('[data-page]');if(btn)activePanel=null;},true);

let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyNavigationCleanup();});});
observer.observe(pageEl,{childList:true,subtree:true});
applyNavigationCleanup();
