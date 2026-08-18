import { saveState, addPlayerExp } from './state.js';
import { originalSweepReward, WEB_SWEEP_BATTLE_EQUIVALENT } from './progression.js';
import { RED_KUNGFU, DIVINE_KUNGFU } from './kungfu.js';
import { INNER_POWER_MEDICINES } from './innerpower.js';
import { WEAPONS } from './weapons.js';
import { ANCIENT_TOMB_MATERIALS, ANCIENT_TOMB_OPEN_CHAPTER, ANCIENT_TOMB_MAX_FLOOR, ancientTombPower } from './ancienttomb.js';
import { AWAKENINGS, SOUL_SHARDS_PER_STONE, SOUL_SHARD_PACK } from './awakening.js';
import { SPECIAL_EXCHANGE_ITEMS, SPECIAL_ITEM_PACK_SIZE } from './vip.js';
import { bumpDaily } from './tasks.js';

const pageEl=document.querySelector('#page');
const bottomNav=document.querySelector('.bottom-nav');
const bottomMore=bottomNav?.querySelector('[data-page="more"]');
const bottomChallenge=bottomNav?.querySelector('[data-page="challenge"]');
const SAVE_KEY='xinyitian_single_v1';
let activePanel=null;
let bagSection=null;
let bagChoice=null;
let specialChoiceItem='';
let specialChoiceQty=1;
let bagNotice='';

const MALL_GOODS=[
  {id:'heroTokens',name:'侠客信物',desc:'客栈兑换侠客招募令',amount:1,price:50,level:10,source:'3008521'},
  {id:'kungfuTickets',name:'功法帖',desc:'藏经阁抽取功法',amount:1,price:300,level:10,source:'3002502'},
  {id:'heroExp',name:'侠客经验',desc:'提升侠客等级',amount:1000,price:10,level:10,source:'113'},
  {id:'meridianPills',name:'经脉丹',desc:'经脉冲穴与突破',amount:1,price:10,level:10,source:'3004205'},
  {id:'kungfuFragments',name:'功法残页',desc:'功法养成资源',amount:1,price:50,level:10,source:'3000038'},
];
const ORIGINAL_KUNGFU_BOX_POOL=['104001','104201','104301','104401','104501','104601','104701'];
const ORIGINAL_KUNGFU_LOW_POOL=['104001','104201','104301'];
const BAG_SECTIONS=[
  ['core','资','常用资源','经验、信物、经脉与通用材料'],
  ['kungfu','功','功法','功法帖、残页、红功法本体与神功卷'],
  ['inner','内','内力与古墓','内力药、古墓材料与速战卷'],
  ['weapons','兵','神兵','精铁、陨铁与同名神兵本体'],
  ['soul','神','神品','魂石、碎片与悟道材料'],
  ['packs','礼','礼包与奇侠','可开启礼包、自选箱与奇侠兑换物'],
];

function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{return {};}}
function liveState(){return globalThis.__XYT_STATE__||readSave();}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveAndSync(s){saveState(s);syncResourceBar();}
function ensurePackState(s){
  if(!s.packs||typeof s.packs!=='object')s.packs={};
  for(const key of ['kungfuRandom','kungfuChoiceHigh','kungfuChoiceLow','weaponRandom'])s.packs[key]=Math.max(0,Number(s.packs[key]||0));
  const aliases=[
    ['kungfuRandom',['kungfuGift','kungfuPack','功法礼包','redKungfuRandom']],
    ['kungfuChoiceHigh',['kungfuChoice','功法自选包','highKungfuChoice']],
    ['kungfuChoiceLow',['lowKungfuChoice','低阶功法箱']],
    ['weaponRandom',['weaponGift','weaponPack','神兵礼包']],
  ];
  for(const [target,keys] of aliases){for(const key of keys){const n=Number(s.packs[key]||0);if(n>0){s.packs[target]+=n;delete s.packs[key];}}}
  for(const key of ['kungfuGiftPacks','kungfuPacks']){const n=Number(s.vipExtras?.[key]||0);if(n>0){s.packs.kungfuRandom+=n;delete s.vipExtras[key];}}
  return s.packs;
}
function addKungfuCopy(s,id,count=1){const rec=s.kungfu?.red?.[id];if(!rec)return false;let n=Math.max(0,Number(count)||0);if(Number(rec.level||0)<=0&&n>0){rec.level=1;n--;}rec.copies=Number(rec.copies||0)+n;return true;}
function grantWeaponCopy(s,id,count=1){const rec=s.weapons?.items?.[id];if(!rec)return false;let n=Math.max(0,Number(count)||0);if(!rec.owned&&n>0){rec.owned=true;rec.level=Math.max(1,Number(rec.level||0));n--;}rec.copies=Number(rec.copies||0)+n;return true;}

function syncResourceBar(){
  const s=liveState(),p=s.player||{};
  const values={铜钱:fmt(p.copper),元宝:fmt(p.gems),体力:`${fmt(p.stamina)}/${fmt(p.staminaCap)}`,侠客经验:fmt(p.heroExp),传奇令:fmt(p.legendTokens),等级:`Lv.${fmt(p.level)}`};
  document.querySelectorAll('#resourceBar .resource-item').forEach(item=>{const label=item.querySelector('.resource-label')?.textContent?.trim();if(label&&label in values){const v=item.querySelector('.resource-value');if(v)v.textContent=values[label];}});
}
function removeLegacyHomeEntries(){
  if(pageEl.dataset.page!=='home')return;
  for(const card of pageEl.querySelectorAll(':scope > section.card'))if(card.querySelector('h3')?.textContent.trim()==='主线')card.remove();
  for(const block of pageEl.querySelectorAll(':scope > section.grid-2')){const text=block.textContent||'';if(text.includes('少林千宝塔')&&text.includes('模拟充值'))block.remove();}
}

function bagItem(name,qty,desc='',action=''){
  const button=action?`<button class="btn btn-small" ${action}>使用</button>`:'';
  return `<div class="bag-item"><div class="bag-item-main"><b>${esc(name)}</b>${desc?`<small>${esc(desc)}</small>`:''}</div><div class="bag-item-side"><strong>×${fmt(qty)}</strong>${button}</div></div>`;
}
function bagList(items,empty='暂无物品'){return items.length?`<div class="bag-grid">${items.join('')}</div>`:`<div class="empty-bag">${esc(empty)}</div>`;}
function bagBackHead(title,sub='',key='section'){
  return `<div class="subpage-head bag-subhead" data-bag-root="${esc(key)}"><button class="back-link" type="button" data-bag-back>‹ 背包</button><div><span class="eyebrow">背包</span><h2>${esc(title)}</h2>${sub?`<small>${esc(sub)}</small>`:''}</div></div>`;
}
function sectionCount(s,key){
  const packs=ensurePackState(s);
  if(key==='core')return 10;
  if(key==='kungfu')return 2+Object.values(s.kungfu?.red||{}).filter(x=>Number(x?.copies||0)>0).length+Object.values(s.kungfu?.scrolls||{}).filter(n=>Number(n)>0).length;
  if(key==='inner')return Object.values(s.innerPower?.items||{}).filter(n=>Number(n)>0).length+Object.values(s.ancientTomb?.materials||{}).filter(n=>Number(n)>0).length+(Number(s.ancientTomb?.speedTickets||0)>0?1:0);
  if(key==='weapons')return 2+Object.values(s.weapons?.items||{}).filter(x=>Number(x?.copies||0)>0).length;
  if(key==='soul')return Object.values(s.awakening?.fragments||{}).filter(n=>Number(n)>0).length+Object.values(s.awakening?.stones||{}).filter(n=>Number(n)>0).length+(Number(s.wudao?.pills||0)>0?1:0);
  if(key==='packs')return Object.values(packs).filter(n=>Number(n)>0).length+(Number(s.awakening?.choicePacks||0)>0?1:0)+(Number(s.vipExtras?.specialChoicePacks||0)>0?1:0)+Object.values(s.specials||{}).filter(n=>Number(n)>0).length+(Number(s.vipExtras?.kunlunLiangyi||0)>0?1:0);
  return 0;
}
function renderBackpackHub(){
  if(pageEl.dataset.page!=='challenge')return;
  const s=liveState(),p=s.player||{};ensurePackState(s);
  bagSection=null;bagChoice=null;pageEl.dataset.bag='hub';
  const tiles=BAG_SECTIONS.map(([key,seal,title,sub])=>`<button class="bag-category" type="button" data-bag-section="${key}"><span class="bag-category-seal">${seal}</span><span class="bag-category-copy"><b>${title}</b><small>${sub}</small></span><span class="bag-category-count">${sectionCount(s,key)}类</span><span class="bag-category-arrow">›</span></button>`).join('');
  pageEl.innerHTML=`<div class="page-heading bag-heading" data-bag-root="hub"><div><span class="eyebrow">行囊</span><h2>背包</h2></div><small>分类查看</small></div><section class="card bag-wallet"><div><span>铜钱</span><b>${fmt(p.copper)}</b></div><div><span>元宝</span><b>${fmt(p.gems)}</b></div><div><span>体力</span><b>${fmt(p.stamina)}/${fmt(p.staminaCap)}</b></div></section><div class="bag-category-grid">${tiles}</div>`;
}
function renderCoreBag(s){const p=s.player||{};return bagList([
  bagItem('侠客经验',p.heroExp||0,'侠客升级'),bagItem('侠客信物',p.heroTokens||0,'客栈兑换'),bagItem('传奇招募令',p.legendTokens||0,'传奇侠客招募'),bagItem('经脉丹',p.meridianPills||0,'经脉冲穴'),bagItem('突破丹',p.breakthroughPills||0,'经脉命门突破'),bagItem('功法帖',p.kungfuTickets||0,'藏经阁抽取'),bagItem('功法残页',s.kungfu?.fragments||0,'功法养成'),bagItem('悟道丹',s.wudao?.pills||0,'神品悟道'),bagItem('精铁',s.weapons?.iron||0,'神兵锻造'),bagItem('天外陨铁',s.weapons?.meteorIron||0,'神兵熔铸')
]);}
function renderKungfuBag(s){const items=[bagItem('功法帖',s.player?.kungfuTickets||0,'藏经阁抽取'),bagItem('功法残页',s.kungfu?.fragments||0,'功法养成')];for(const [id,k] of Object.entries(RED_KUNGFU)){const n=Number(s.kungfu?.red?.[id]?.copies||0);if(n>0)items.push(bagItem(`${k.name}本体`,n,'红功法升级消耗'));}for(const [id,n] of Object.entries(s.kungfu?.scrolls||{}))if(Number(n)>0)items.push(bagItem(`${DIVINE_KUNGFU[id]?.name||id}卷`,n,'神功融合材料'));return bagList(items);}
function renderInnerBag(s){const items=[];for(const [id,m] of Object.entries(INNER_POWER_MEDICINES)){const n=Number(s.innerPower?.items?.[id]||0);if(n>0)items.push(bagItem(m.name,n,'内力养成'));}for(const [id,name] of Object.entries(ANCIENT_TOMB_MATERIALS)){const n=Number(s.ancientTomb?.materials?.[id]||0);if(n>0)items.push(bagItem(name,n,'古墓材料'));}if(Number(s.ancientTomb?.speedTickets||0)>0)items.push(bagItem('古墓速战卷',s.ancientTomb.speedTickets,'用于古墓已通关层速战'));return bagList(items);}
function renderWeaponBag(s){const items=[bagItem('精铁',s.weapons?.iron||0,'神兵锻造'),bagItem('天外陨铁',s.weapons?.meteorIron||0,'神兵熔铸')];for(const [id,w] of Object.entries(WEAPONS)){const n=Number(s.weapons?.items?.[id]?.copies||0);if(n>0)items.push(bagItem(`${w.name}备用本体`,n,'突破/熔铸消耗'));}return bagList(items);}
function renderSoulBag(s){const items=[bagItem('悟道丹',s.wudao?.pills||0,'神品悟道')];for(const [id,c] of Object.entries(AWAKENINGS)){const f=Number(s.awakening?.fragments?.[id]||0),stone=Number(s.awakening?.stones?.[id]||0);if(f>0)items.push(bagItem(`${c.godName}魂石碎片`,f,`${SOUL_SHARDS_PER_STONE}碎片合成1魂石`));if(stone>0)items.push(bagItem(`${c.godName}魂石`,stone,'神品觉醒'));}return bagList(items);}
function packButton(label,qty,desc,attrs,button='打开'){
  return `<div class="bag-item pack-item"><div class="bag-item-main"><b>${esc(label)}</b><small>${esc(desc)}</small></div><div class="bag-item-side"><strong>×${fmt(qty)}</strong><button class="btn btn-gold btn-small" ${attrs}>${button}</button></div></div>`;
}
function kungfuChoiceHtml(pool,kind){const valid=pool.filter(id=>RED_KUNGFU[id]);return `<div class="pack-choice-grid">${valid.map(id=>`<button class="pack-choice" type="button" data-pack-kungfu="${id}" data-pack-kind="${kind}"><b>${esc(RED_KUNGFU[id].name)}</b><small>${esc(RED_KUNGFU[id].desc1||'获得1本')}</small></button>`).join('')}</div>`;}
function soulChoiceHtml(){return `<div class="pack-choice-grid">${Object.entries(AWAKENINGS).map(([id,c])=>`<button class="pack-choice" type="button" data-pack-soul="${id}"><b>${esc(c.godName)}</b><small>魂石碎片 +${SOUL_SHARD_PACK}</small></button>`).join('')}</div>`;}
function specialChoiceHtml(s){
  const max=Math.max(1,Number(s.vipExtras?.specialChoicePacks||0));
  if(!SPECIAL_EXCHANGE_ITEMS.some(x=>x.item===specialChoiceItem))specialChoiceItem=SPECIAL_EXCHANGE_ITEMS[0]?.item||'';
  specialChoiceQty=Math.max(1,Math.min(max,Number(specialChoiceQty)||1));
  const options=SPECIAL_EXCHANGE_ITEMS.map(x=>`<button class="pack-choice ${specialChoiceItem===x.item?'selected':''}" type="button" data-pack-special-select="${esc(x.item)}"><b>${esc(x.item)}</b><small>每包 +${SPECIAL_ITEM_PACK_SIZE}</small></button>`).join('');
  const total=specialChoiceQty*SPECIAL_ITEM_PACK_SIZE;
  return `<div class="pack-choice-grid">${options}</div><div class="special-batch-box"><div class="special-batch-head"><div><b>已选：${esc(specialChoiceItem||'请选择')}</b><small>持有自选包 ${fmt(max)} 个</small></div><strong><span data-special-qty-label>${fmt(specialChoiceQty)}</span>包</strong></div><input class="special-batch-range" type="range" min="1" max="${max}" value="${specialChoiceQty}" step="1" data-special-pack-range><div class="special-batch-actions"><button class="btn" type="button" data-special-pack-minus>−1</button><button class="btn" type="button" data-special-pack-plus>+1</button><button class="btn" type="button" data-special-pack-all>全部</button></div><div class="notice special-batch-summary">消耗 <b data-special-cost>${fmt(specialChoiceQty)}</b> 个自选包 → 获得 <b data-special-gain>${fmt(total)}</b> 个${esc(specialChoiceItem||'兑换物')}</div><button class="btn btn-gold btn-block" type="button" data-confirm-special-pack ${specialChoiceItem?'':'disabled'}>确认兑换</button></div>`; }
function renderPackBag(s){
  const packs=ensurePackState(s),items=[];
  if(packs.kungfuRandom>0)items.push(packButton('红品功法随机包',packs.kungfuRandom,'原版7门属性红功法中随机获得1本','data-open-pack="kungfuRandom"'));
  if(packs.kungfuChoiceHigh>0)items.push(packButton('充值高阶功法箱',packs.kungfuChoiceHigh,'原版7门属性红功法中自选1本','data-choose-pack="kungfuChoiceHigh"','自选'));
  if(packs.kungfuChoiceLow>0)items.push(packButton('充值低阶功法箱',packs.kungfuChoiceLow,'真武七截剑 / 金刚不坏 / 纯阳无极功中自选1本','data-choose-pack="kungfuChoiceLow"','自选'));
  if(packs.weaponRandom>0)items.push(packButton('神兵随机礼包',packs.weaponRandom,'随机获得当前红色神兵1件','data-open-pack="weaponRandom"'));
  const soulPacks=Number(s.awakening?.choicePacks||0);if(soulPacks>0)items.push(packButton('神品魂石碎片自选箱',soulPacks,`自选1名神品侠客，获得${SOUL_SHARD_PACK}魂石碎片`,'data-choose-pack="soul"','自选'));
  const specialPacks=Number(s.vipExtras?.specialChoicePacks||0);if(specialPacks>0)items.push(packButton('奇侠兑换物自选包',specialPacks,`自选1种奇侠兑换物，获得${SPECIAL_ITEM_PACK_SIZE}个`,'data-choose-pack="special"','自选'));
  for(const [name,n] of Object.entries(s.specials||{}))if(Number(n)>0)items.push(bagItem(name,n,'奇侠兑换物'));
  if(Number(s.vipExtras?.kunlunLiangyi||0)>0)items.push(bagItem('昆仑两仪剑',s.vipExtras.kunlunLiangyi,'VIP早期礼包收藏品；当前版本不是可装备功法'));
  let chooser='';
  if(bagChoice==='kungfuChoiceHigh')chooser=`<section class="card pack-choice-card"><div class="section-title"><h3>选择一本红品功法</h3><button class="btn" data-cancel-pack>取消</button></div>${kungfuChoiceHtml(ORIGINAL_KUNGFU_BOX_POOL,'kungfuChoiceHigh')}</section>`;
  if(bagChoice==='kungfuChoiceLow')chooser=`<section class="card pack-choice-card"><div class="section-title"><h3>选择一本红品功法</h3><button class="btn" data-cancel-pack>取消</button></div>${kungfuChoiceHtml(ORIGINAL_KUNGFU_LOW_POOL,'kungfuChoiceLow')}</section>`;
  if(bagChoice==='soul')chooser=`<section class="card pack-choice-card"><div class="section-title"><h3>选择魂石碎片</h3><button class="btn" data-cancel-pack>取消</button></div>${soulChoiceHtml()}</section>`;
  if(bagChoice==='special')chooser=`<section class="card pack-choice-card"><div class="section-title"><h3>选择奇侠兑换物</h3><button class="btn" data-cancel-pack>取消</button></div>${bagNotice?`<div class="battle-win bag-inline-notice">${esc(bagNotice)}</div>`:''}${specialChoiceHtml(s)}</section>`;
  return `${chooser}${bagList(items,'当前没有可开启礼包或奇侠兑换物')}`;
}
function renderBagSection(key){
  if(pageEl.dataset.page!=='challenge')return;const s=liveState();ensurePackState(s);bagSection=key;pageEl.dataset.bag=key;
  const meta={core:['常用资源','经验、信物、经脉与通用材料'],kungfu:['功法','功法本体、残页与神功卷'],inner:['内力与古墓','内力药、古墓材料与速战卷'],weapons:['神兵','锻造材料与同名本体'],soul:['神品','魂石、碎片与悟道'],packs:['礼包与奇侠','礼包可直接打开，自选箱进入选择界面']}[key]||['背包',''];
  const body=key==='core'?renderCoreBag(s):key==='kungfu'?renderKungfuBag(s):key==='inner'?renderInnerBag(s):key==='weapons'?renderWeaponBag(s):key==='soul'?renderSoulBag(s):renderPackBag(s);
  pageEl.innerHTML=`${bagBackHead(meta[0],meta[1],key)}<section class="card bag-section-card">${body}</section>`;
}
function openRandomPack(kind){
  const s=liveState(),packs=ensurePackState(s);if(Number(packs[kind]||0)<=0)return;
  if(kind==='kungfuRandom'){
    const pool=ORIGINAL_KUNGFU_BOX_POOL.filter(id=>RED_KUNGFU[id]&&s.kungfu?.red?.[id]);if(!pool.length)return alert('当前功法数据无法匹配礼包。');
    const id=pool[Math.floor(Math.random()*pool.length)];packs[kind]-=1;addKungfuCopy(s,id,1);saveAndSync(s);renderBagSection('packs');alert(`打开红品功法随机包：获得【${RED_KUNGFU[id].name}】×1。`);return;
  }
  if(kind==='weaponRandom'){
    const pool=Object.keys(WEAPONS).filter(id=>s.weapons?.items?.[id]);if(!pool.length)return alert('当前神兵数据无法匹配礼包。');
    const id=pool[Math.floor(Math.random()*pool.length)];packs[kind]-=1;grantWeaponCopy(s,id,1);saveAndSync(s);renderBagSection('packs');alert(`打开神兵随机礼包：获得【${WEAPONS[id].name}】×1。`);
  }
}
function chooseKungfuPack(kind,id){const s=liveState(),packs=ensurePackState(s),pool=kind==='kungfuChoiceLow'?ORIGINAL_KUNGFU_LOW_POOL:ORIGINAL_KUNGFU_BOX_POOL;if(Number(packs[kind]||0)<=0||!pool.includes(id)||!RED_KUNGFU[id])return;packs[kind]-=1;addKungfuCopy(s,id,1);bagChoice=null;saveAndSync(s);renderBagSection('packs');alert(`功法箱：获得【${RED_KUNGFU[id].name}】×1。`);}
function chooseSoulPack(id){const s=liveState();if(!AWAKENINGS[id]||Number(s.awakening?.choicePacks||0)<=0)return;s.awakening.choicePacks-=1;s.awakening.fragments[id]=Number(s.awakening.fragments[id]||0)+SOUL_SHARD_PACK;bagChoice=null;saveAndSync(s);renderBagSection('packs');alert(`自选箱：${AWAKENINGS[id].godName}魂石碎片 +${SOUL_SHARD_PACK}。`);}
function updateSpecialBatchPreview(){
  const s=liveState(),max=Math.max(1,Number(s.vipExtras?.specialChoicePacks||0)),range=pageEl.querySelector('[data-special-pack-range]');
  if(range)specialChoiceQty=Math.max(1,Math.min(max,Number(range.value)||1));
  const qty=Math.max(1,Math.min(max,Number(specialChoiceQty)||1)),gain=qty*SPECIAL_ITEM_PACK_SIZE;
  specialChoiceQty=qty;
  const q=pageEl.querySelector('[data-special-qty-label]'),c=pageEl.querySelector('[data-special-cost]'),g=pageEl.querySelector('[data-special-gain]');
  if(q)q.textContent=fmt(qty);if(c)c.textContent=fmt(qty);if(g)g.textContent=fmt(gain);
}
function confirmSpecialPack(){
  const s=liveState(),have=Math.max(0,Number(s.vipExtras?.specialChoicePacks||0)),item=specialChoiceItem,qty=Math.max(1,Math.min(have,Number(specialChoiceQty)||1));
  if(!SPECIAL_EXCHANGE_ITEMS.some(x=>x.item===item)||have<=0)return;
  s.vipExtras.specialChoicePacks-=qty;s.specials[item]=Number(s.specials[item]||0)+qty*SPECIAL_ITEM_PACK_SIZE;
  bagNotice=`已使用${qty}个自选包：${item} +${qty*SPECIAL_ITEM_PACK_SIZE}`;
  saveAndSync(s);
  const left=Math.max(0,Number(s.vipExtras.specialChoicePacks||0));
  if(left<=0){bagChoice=null;specialChoiceQty=1;}else specialChoiceQty=Math.min(qty,left);
  renderBagSection('packs');
}

function hubTile(kind,seal,title,sub){const btn=document.createElement('button');btn.className='hub-tile jh-primary-tile';btn.type='button';btn.dataset.jhPanel=kind;btn.innerHTML=`<span class="hub-seal">${seal}</span><span class="hub-title">${title}</span><span class="hub-sub">${sub}</span><span class="hub-arrow">›</span>`;return btn;}
function ensureTile(grid,kind,seal,title,sub){let tile=grid.querySelector(`[data-jh-panel="${kind}"]`);if(!tile){tile=hubTile(kind,seal,title,sub);grid.appendChild(tile);}return tile;}
function enhanceJianghuHub(){
  if(pageEl.dataset.page!=='more'||pageEl.dataset.more!=='hub')return;const grid=pageEl.querySelector('.hub-grid');if(!grid)return;
  const main=ensureTile(grid,'mainline','主','主线','挑战当前幕 / 连续速战'),tower=ensureTile(grid,'tower','塔','少林千宝塔','永久爬塔 / 经脉资源'),tomb=ensureTile(grid,'tomb','墓','古墓奇遇','内力材料 / 450层'),mall=ensureTile(grid,'mall','商','商城','原版基础元宝商城'),vip=grid.querySelector('[data-more-section="vip"]');
  const first=grid.firstElementChild;if(first!==main)grid.insertBefore(main,first);if(main.nextElementSibling!==tower)grid.insertBefore(tower,main.nextElementSibling);if(tower.nextElementSibling!==tomb)grid.insertBefore(tomb,tower.nextElementSibling);if(tomb.nextElementSibling!==mall)grid.insertBefore(mall,tomb.nextElementSibling);if(vip&&mall.nextElementSibling!==vip)grid.insertBefore(vip,mall.nextElementSibling);
}
function subHead(title,sub){return `<div class="subpage-head"><button class="back-link" type="button" data-jh-back>‹ 江湖</button><div><span class="eyebrow">江湖</span><h2>${title}</h2><small>${sub}</small></div></div>`;}
function subpageShell(inner){return `<div class="jh-subpage-backdrop" data-jh-backdrop><div class="jh-subpage-panel">${inner}</div></div>`;}
function renderMainlinePanel(){const s=liveState(),p=s.player||{},chapter=Number(p.chapter||1),stamina=Number(p.stamina||0);pageEl.dataset.more='mainline-panel';pageEl.innerHTML=subpageShell(`${subHead('主线','剧情推进 / 连续速战')}<section class="card featured-card jh-action-card"><div class="section-title"><h3>第${chapter}幕</h3><small>体力 ${fmt(stamina)}</small></div><div class="notice">单次速战仍按5体力。网页版一幕合并原版多场战斗，因此速战5次按${WEB_SWEEP_BATTLE_EQUIVALENT}场/幕折算，共逐次结算${5*WEB_SWEEP_BATTLE_EQUIVALENT}份原版速战奖励。</div><div class="action-row jh-big-actions"><button class="btn btn-primary" data-action="chapter">挑战第${chapter}幕</button><button class="btn btn-gold" data-action="quick" ${stamina<25?'disabled':''}>速战5次 · 25体力</button></div></section>`);}
function renderTowerPanel(){const s=liveState(),highest=Number(s.tower?.highest||0),next=highest+1;pageEl.dataset.more='tower-panel';pageEl.innerHTML=subpageShell(`${subHead('少林千宝塔','永久爬塔 / 经脉资源')}<section class="card featured-card jh-action-card"><span class="tag">永久爬塔</span><div class="section-title" style="margin-top:8px"><h3>已通关 ${fmt(highest)} 层</h3><small>下一层 ${fmt(next)}</small></div><div class="notice">按当前千宝塔规则结算经脉丹、突破丹及高层节点奖励。</div><button class="btn btn-primary btn-block jh-big-button" data-action="tower">挑战第${fmt(next)}层</button></section>`);}
function renderTombPanel(){const s=liveState(),p=s.player||{},t=s.ancientTomb||{},open=Number(p.chapter||0)>=ANCIENT_TOMB_OPEN_CHAPTER,highest=Number(t.highest||0),done=highest>=ANCIENT_TOMB_MAX_FLOOR,next=Math.min(ANCIENT_TOMB_MAX_FLOOR,highest+1),power=ancientTombPower(next);pageEl.dataset.more='tomb-panel';const mats=Object.entries(ANCIENT_TOMB_MATERIALS).map(([id,name])=>`${name}${fmt(t.materials?.[id]||0)}`).join(' · ');pageEl.innerHTML=subpageShell(`${subHead('古墓奇遇','内力材料 / 450层')}<section class="card featured-card jh-action-card ${open?'':'locked'}"><div class="section-title"><div><span class="tag">内力资源区</span><h3>已通关 ${fmt(highest)} 层</h3></div><small>今日挑战 ${fmt(t.attemptsToday||0)}次</small></div><div class="muted">${done?'450层全部通关':`下一层 ${fmt(next)} · 推荐战力约 ${fmt(power)}`}</div><div class="notice" style="margin-top:10px">主要产出内力药材、内力散、聚气丹与属性丹；首次节点还会产出鸳鸯刀等资源。</div><div class="hero-meta" style="margin-top:8px">药材：${mats}</div><div class="hero-meta">古墓速战卷 ${fmt(t.speedTickets||0)}</div><div class="action-row" style="margin-top:10px"><button class="btn btn-primary" data-action="ancientTomb" ${open&&!done&&Number(t.attemptsToday||0)>0?'':'disabled'}>${open?done?'已通关':`挑战${fmt(next)}层`:`第${ANCIENT_TOMB_OPEN_CHAPTER}幕开放`}</button><button class="btn btn-gold" data-action="ancientTombSpeed" ${open&&highest>0&&Number(t.speedTickets||0)>0?'':'disabled'}>速战已通关层</button></div></section>`);}
function mallGoodCard(g){const s=liveState(),p=s.player||{},open=Number(p.level||0)>=g.level,can1=open&&Number(p.gems||0)>=g.price,can10=open&&Number(p.gems||0)>=g.price*10;return `<div class="mall-good ${open?'':'locked'}"><div class="mall-good-head"><div><b>${g.name}</b><small>${g.desc}</small></div><span class="mall-price"><img src="./assets/original/icon-gems.png" alt="">${fmt(g.price)}</span></div><div class="hero-meta">每份 ×${fmt(g.amount)} · ${open?'已解锁':`Lv.${g.level}解锁`}</div><div class="action-row"><button class="btn" data-mall-buy="${g.id}" data-mall-qty="1" ${can1?'':'disabled'}>购买1份</button><button class="btn btn-gold" data-mall-buy="${g.id}" data-mall-qty="10" ${can10?'':'disabled'}>购买10份</button></div></div>`;}
function renderMallPanel(){const s=liveState(),p=s.player||{};pageEl.dataset.more='mall-panel';pageEl.innerHTML=subpageShell(`${subHead('商城','原版基础元宝商城')}<section class="card mall-banner"><div><span class="eyebrow">元宝余额</span><div class="big-number">${fmt(p.gems)}</div></div><img src="./assets/original/icon-gems.png" alt="元宝"></section><section class="card"><div class="section-title"><h3>常驻商品</h3><small>Lv.10开放</small></div><div class="notice">价格与门槛按当前原版客户端基础商城。朱果属于已删除的宠物系统；改名卡当前无命名用途，因此不投放死道具。</div><div class="mall-grid">${MALL_GOODS.map(mallGoodCard).join('')}</div></section>`);}
function grantMallGood(s,id,qty){const n=Math.max(1,Math.floor(Number(qty)||1));if(id==='heroTokens')s.player.heroTokens=Number(s.player.heroTokens||0)+n;if(id==='kungfuTickets')s.player.kungfuTickets=Number(s.player.kungfuTickets||0)+n;if(id==='heroExp')s.player.heroExp=Number(s.player.heroExp||0)+1000*n;if(id==='meridianPills')s.player.meridianPills=Number(s.player.meridianPills||0)+n;if(id==='kungfuFragments')s.kungfu.fragments=Number(s.kungfu.fragments||0)+n;}
function buyMallItem(id,qty=1){const s=liveState(),g=MALL_GOODS.find(x=>x.id===id),n=Number(qty)===10?10:1;if(!g||!s.player)return;if(Number(s.player.level||0)<g.level)return alert(`商城需要玩家Lv.${g.level}。`);const cost=g.price*n;if(Number(s.player.gems||0)<cost)return alert(`元宝不足，需要${fmt(cost)}。`);s.player.gems-=cost;grantMallGood(s,id,n);saveAndSync(s);renderMallPanel();alert(`购买成功：【${g.name}】×${fmt(g.amount*n)}，消耗${fmt(cost)}元宝。`);}
function leaveSubpage(){if(!activePanel)return;activePanel=null;bottomMore?.click();}
function renderActivePanel(){if(activePanel==='mainline')return renderMainlinePanel();if(activePanel==='tower')return renderTowerPanel();if(activePanel==='tomb')return renderTombPanel();if(activePanel==='mall')return renderMallPanel();}
function patchKungfuTicketButtons(){if(pageEl.dataset.page!=='growth')return;const s=liveState(),p=s.player||{},tickets=Math.max(0,Number(p.kungfuTickets||0));for(const [action,n] of [['drawKungfu1',1],['drawKungfu5',5]]){const btn=pageEl.querySelector(`[data-action="${action}"]`);if(!btn)continue;const used=Math.min(n,tickets),cost=(n-used)*300;btn.disabled=Number(p.gems||0)<cost;const label=used===n?`抽${n}次 · 功法帖${used}`:used?`抽${n}次 · 功法帖${used} + ${cost}元宝`:`抽${n}次 · ${cost}元宝`;if(btn.textContent!==label)btn.textContent=label;}}
function patchSettingsVersion(){if(pageEl.dataset.page!=='more'||pageEl.dataset.more!=='settings')return;pageEl.querySelectorAll('.hero-meta').forEach(el=>{if(/V0\.2[12](\.\d+)? · 手机优先/.test(el.textContent))el.textContent=el.textContent.replace(/V0\.2[12](\.\d+)?/,'V0.22.3');});}
function applyNavigationCleanup(){
  if(bottomChallenge){const span=bottomChallenge.querySelector('span');if(span&&span.textContent!=='背包')span.textContent='背包';}
  removeLegacyHomeEntries();
  if(pageEl.dataset.page==='challenge'){
    const expected=bagSection||'hub',marker=pageEl.querySelector('[data-bag-root]');
    if(pageEl.dataset.bag!==expected||marker?.dataset.bagRoot!==expected){if(bagSection)renderBagSection(bagSection);else renderBackpackHub();}return;
  }
  if(pageEl.dataset.page==='more'&&pageEl.dataset.more==='hub'&&activePanel){renderActivePanel();return;}
  enhanceJianghuHub();patchKungfuTicketButtons();patchSettingsVersion();
}
function runWebQuickBattle(){const s=liveState(),times=5,total=times*WEB_SWEEP_BATTLE_EQUIVALENT,cost=times*5;if(!s.player)return;if(Number(s.player.stamina||0)<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);s.player.stamina-=cost;s.daily.quickBattles=Number(s.daily.quickBattles||0)+times;let exp=0,heroExp=0,copper=0;for(let i=0;i<total;i++){const one=originalSweepReward(s.player.level);exp+=Number(one.exp||0);heroExp+=Number(one.heroExp||0);copper+=Number(one.copper||0);addPlayerExp(s,one.exp);}s.player.heroExp=Number(s.player.heroExp||0)+heroExp;s.player.copper=Number(s.player.copper||0)+copper;saveAndSync(s);if(activePanel==='mainline')renderMainlinePanel();const parts=[`玩家经验 +${fmt(exp)}`,`侠客经验 +${fmt(heroExp)}`];if(copper)parts.push(`铜钱 +${fmt(copper)}`);alert(`连续速战5次完成：按${WEB_SWEEP_BATTLE_EQUIVALENT}场/幕逐次结算${total}份原版奖励，${parts.join('，')}，体力 -${cost}。`);}
function runKungfuDrawWithTickets(times){const s=liveState(),n=Number(times)===5?5:1,tickets=Math.min(n,Math.max(0,Number(s.player?.kungfuTickets||0)));if(tickets<=0)return false;const cost=(n-tickets)*300;if(Number(s.player.gems||0)<cost){alert(`元宝不足，需要${fmt(cost)}元宝补足剩余次数。`);return true;}s.player.kungfuTickets-=tickets;s.player.gems-=cost;const reds=[];let fragments=0;for(let i=0;i<n;i++){s.kungfu.drawCount=Number(s.kungfu.drawCount||0)+1;if(Math.random()<.02){const ids=Object.keys(RED_KUNGFU),id=ids[Math.floor(Math.random()*ids.length)];addKungfuCopy(s,id,1);reds.push(RED_KUNGFU[id].name);}else{s.kungfu.fragments=Number(s.kungfu.fragments||0)+1;fragments++;}}bumpDaily(s,'scripture',n);saveAndSync(s);document.querySelector('.bottom-nav [data-page="growth"]')?.click();alert(`藏经阁抽取${n}次：消耗功法帖${tickets}${cost?` + ${fmt(cost)}元宝`:''}；${reds.length?`红色功法：${reds.join('、')}`:'未获得红色功法'}${fragments?`；功法残页 +${fragments}`:''}。`);return true;}

pageEl.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.action==='quick'){e.preventDefault();e.stopImmediatePropagation();runWebQuickBattle();return;}
  if(btn.dataset.action==='drawKungfu1'||btn.dataset.action==='drawKungfu5'){const used=runKungfuDrawWithTickets(btn.dataset.action==='drawKungfu5'?5:1);if(used){e.preventDefault();e.stopImmediatePropagation();return;}}
},true);
pageEl.addEventListener('click',e=>{
  if(e.target.closest('[data-jh-backdrop]')&&!e.target.closest('.jh-subpage-panel')){leaveSubpage();return;}
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.bagSection){bagSection=btn.dataset.bagSection;bagChoice=null;renderBagSection(bagSection);window.scrollTo({top:0,behavior:'smooth'});return;}
  if(btn.dataset.bagBack!==undefined){bagSection=null;bagChoice=null;specialChoiceItem='';specialChoiceQty=1;bagNotice='';renderBackpackHub();window.scrollTo({top:0,behavior:'smooth'});return;}
  if(btn.dataset.openPack){openRandomPack(btn.dataset.openPack);return;}
  if(btn.dataset.choosePack){bagChoice=btn.dataset.choosePack;bagNotice='';if(bagChoice==='special'){specialChoiceItem='';specialChoiceQty=1;}renderBagSection('packs');return;}
  if(btn.dataset.cancelPack!==undefined){bagChoice=null;bagNotice='';renderBagSection('packs');return;}
  if(btn.dataset.packKungfu){chooseKungfuPack(btn.dataset.packKind,btn.dataset.packKungfu);return;}
  if(btn.dataset.packSoul){chooseSoulPack(btn.dataset.packSoul);return;}
  if(btn.dataset.packSpecialSelect){specialChoiceItem=btn.dataset.packSpecialSelect;bagNotice='';renderBagSection('packs');return;}
  if(btn.dataset.specialPackMinus!==undefined){const r=pageEl.querySelector('[data-special-pack-range]');if(r){r.value=String(Math.max(1,Number(r.value||1)-1));updateSpecialBatchPreview();}return;}
  if(btn.dataset.specialPackPlus!==undefined){const r=pageEl.querySelector('[data-special-pack-range]');if(r){r.value=String(Math.min(Number(r.max||1),Number(r.value||1)+1));updateSpecialBatchPreview();}return;}
  if(btn.dataset.specialPackAll!==undefined){const r=pageEl.querySelector('[data-special-pack-range]');if(r){r.value=r.max;updateSpecialBatchPreview();}return;}
  if(btn.dataset.confirmSpecialPack!==undefined){confirmSpecialPack();return;}
  if(btn.dataset.jhPanel){activePanel=btn.dataset.jhPanel;renderActivePanel();return;}
  if(btn.dataset.mallBuy){buyMallItem(btn.dataset.mallBuy,Number(btn.dataset.mallQty||1));return;}
  if(btn.dataset.jhBack!==undefined)leaveSubpage();
});
pageEl.addEventListener('input',e=>{if(e.target?.matches?.('[data-special-pack-range]'))updateSpecialBatchPreview();});
document.addEventListener('click',e=>{if(!activePanel)return;if(e.target.closest('.jh-subpage-panel')||e.target.closest('.bottom-nav')||e.target.closest('[data-jh-backdrop]'))return;if(e.target.closest('.topbar')||e.target.closest('.resource-bar'))leaveSubpage();},true);
bottomNav?.addEventListener('click',e=>{const btn=e.target.closest('[data-page]');if(!btn)return;activePanel=null;if(btn.dataset.page!=='challenge'){bagSection=null;bagChoice=null;specialChoiceItem='';specialChoiceQty=1;bagNotice='';}},true);
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyNavigationCleanup();});});observer.observe(pageEl,{childList:true,subtree:true});
applyNavigationCleanup();
