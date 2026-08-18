import { saveState, normalizeDaily } from './state.js';

const pageEl=document.querySelector('#page');
const GOODS={
  meridianPills:{
    id:'meridianPills',
    name:'经脉丹',
    desc:'经脉冲穴与突破',
    price:10,
    dailyLimit:2000,
    dailyKey:'meridianMallBuys',
  },
  breakthroughPills:{
    id:'breakthroughPills',
    name:'突破丹',
    desc:'命门突破所需',
    price:50,
    dailyLimit:200,
    dailyKey:'breakthroughMallBuys',
  },
};

function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function liveState(){return globalThis.__XYT_STATE__||{};}

function ensureDaily(s){
  if(!s?.player)return s;
  normalizeDaily(s);
  s.daily=s.daily||{};
  for(const g of Object.values(GOODS)){
    s.daily[g.dailyKey]=Math.max(0,Math.min(g.dailyLimit,Math.floor(Number(s.daily[g.dailyKey]||0))));
  }
  return s;
}

function boughtToday(s,g){return Math.max(0,Math.min(g.dailyLimit,Number(s.daily?.[g.dailyKey]||0)));}
function remainingToday(s,g){return Math.max(0,g.dailyLimit-boughtToday(s,g));}

function cardHtml(g){
  const s=ensureDaily(liveState()),p=s.player||{},open=Number(p.level||0)>=10;
  const bought=boughtToday(s,g),remaining=remainingToday(s,g),value=remaining>0?Math.min(100,remaining):0;
  const sourceNote=g.id==='breakthroughPills'?'单机补充购买渠道':'原版基础商城价格';
  return `<div class="mall-good bulk-mall-good ${open?'':'locked'}" data-bulk-mall-card="${g.id}">
    <div class="mall-good-head">
      <div><b>${g.name}</b><small>${g.desc}</small></div>
      <span class="mall-price"><img src="./assets/original/icon-gems.png" alt="">${fmt(g.price)}</span>
    </div>
    <div class="hero-meta">${sourceNote} · 每颗${fmt(g.price)}元宝</div>
    <div class="bulk-limit-row"><span>今日已购 <b>${fmt(bought)}</b> / ${fmt(g.dailyLimit)}</span><span>剩余 <b>${fmt(remaining)}</b></span></div>
    <div class="bulk-slider-wrap ${open&&remaining>0?'':'bulk-disabled'}">
      <div class="bulk-qty-head"><span>购买数量</span><b data-bulk-qty-label="${g.id}">${fmt(value)}</b></div>
      <input type="range" min="0" max="${remaining}" step="1" value="${value}" data-bulk-mall-range="${g.id}" ${open&&remaining>0?'':'disabled'}>
      <div class="bulk-quick-row">
        <button class="btn btn-small" type="button" data-bulk-adjust="-10" data-bulk-id="${g.id}" ${open&&remaining>0?'':'disabled'}>-10</button>
        <button class="btn btn-small" type="button" data-bulk-adjust="10" data-bulk-id="${g.id}" ${open&&remaining>0?'':'disabled'}>+10</button>
        <button class="btn btn-small" type="button" data-bulk-set="100" data-bulk-id="${g.id}" ${open&&remaining>0?'':'disabled'}>100</button>
        <button class="btn btn-small" type="button" data-bulk-set="max" data-bulk-id="${g.id}" ${open&&remaining>0?'':'disabled'}>拉满</button>
      </div>
      <div class="bulk-cost-row">合计 <b data-bulk-cost="${g.id}">${fmt(value*g.price)}</b> 元宝</div>
      <button class="btn btn-gold btn-block bulk-buy-button" type="button" data-bulk-mall-buy="${g.id}" ${open&&remaining>0?'':'disabled'}>${remaining>0?'确认购买':'今日已达上限'}</button>
    </div>
    ${open?'':`<div class="hero-meta">Lv.10解锁</div>`}
  </div>`;
}

function patchMallPanel(){
  if(!pageEl||pageEl.dataset.more!=='mall-panel')return;
  const grid=pageEl.querySelector('.mall-grid');
  if(!grid)return;

  const legacyMeridian=grid.querySelector('[data-mall-buy="meridianPills"]')?.closest('.mall-good');
  const currentMeridian=grid.querySelector('[data-bulk-mall-card="meridianPills"]');
  if(legacyMeridian){
    legacyMeridian.insertAdjacentHTML('beforebegin',cardHtml(GOODS.meridianPills));
    legacyMeridian.remove();
  }else if(currentMeridian){
    currentMeridian.outerHTML=cardHtml(GOODS.meridianPills);
  }else{
    grid.insertAdjacentHTML('beforeend',cardHtml(GOODS.meridianPills));
  }

  const meridianCard=grid.querySelector('[data-bulk-mall-card="meridianPills"]');
  const currentBreak=grid.querySelector('[data-bulk-mall-card="breakthroughPills"]');
  if(currentBreak)currentBreak.outerHTML=cardHtml(GOODS.breakthroughPills);
  else if(meridianCard)meridianCard.insertAdjacentHTML('afterend',cardHtml(GOODS.breakthroughPills));
  else grid.insertAdjacentHTML('beforeend',cardHtml(GOODS.breakthroughPills));
}

function rangeFor(id){return pageEl?.querySelector(`[data-bulk-mall-range="${id}"]`)||null;}
function updatePreview(id){
  const g=GOODS[id],range=rangeFor(id);if(!g||!range)return;
  const max=Math.max(0,Number(range.max||0));
  const qty=Math.max(0,Math.min(max,Math.floor(Number(range.value||0))));
  range.value=String(qty);
  const q=pageEl.querySelector(`[data-bulk-qty-label="${id}"]`),c=pageEl.querySelector(`[data-bulk-cost="${id}"]`),buy=pageEl.querySelector(`[data-bulk-mall-buy="${id}"]`);
  if(q)q.textContent=fmt(qty);
  if(c)c.textContent=fmt(qty*g.price);
  if(buy)buy.disabled=qty<=0;
}

function syncResourceBar(){
  const s=liveState(),p=s.player||{};
  document.querySelectorAll('#resourceBar .resource-item').forEach(item=>{
    const label=item.querySelector('.resource-label')?.textContent?.trim();
    if(label==='元宝'){
      const value=item.querySelector('.resource-value');
      if(value)value.textContent=fmt(p.gems);
    }
  });
}

function buyBulk(id){
  const g=GOODS[id],s=ensureDaily(liveState());if(!g||!s?.player)return;
  if(Number(s.player.level||0)<10)return alert('商城需要玩家Lv.10。');
  const range=rangeFor(id),remaining=remainingToday(s,g);
  const qty=Math.max(0,Math.min(remaining,Math.floor(Number(range?.value||0))));
  if(remaining<=0)return alert(`${g.name}今日购买已达上限。`);
  if(qty<=0)return alert('请选择购买数量。');
  const cost=qty*g.price;
  if(Number(s.player.gems||0)<cost)return alert(`元宝不足，需要${fmt(cost)}元宝。`);

  s.player.gems=Number(s.player.gems||0)-cost;
  s.player[id]=Number(s.player[id]||0)+qty;
  s.daily[g.dailyKey]=boughtToday(s,g)+qty;
  saveState(s);
  syncResourceBar();
  patchMallPanel();
  alert(`购买成功：【${g.name}】×${fmt(qty)}，消耗${fmt(cost)}元宝。`);
}

pageEl?.addEventListener('input',e=>{
  const id=e.target?.dataset?.bulkMallRange;
  if(id&&GOODS[id])updatePreview(id);
});

pageEl?.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  const id=btn.dataset.bulkId;
  if(id&&GOODS[id]){
    const range=rangeFor(id);if(!range)return;
    const max=Math.max(0,Number(range.max||0)),current=Math.max(0,Number(range.value||0));
    if(btn.dataset.bulkAdjust!==undefined)range.value=String(Math.max(0,Math.min(max,current+Number(btn.dataset.bulkAdjust||0))));
    if(btn.dataset.bulkSet!==undefined)range.value=String(btn.dataset.bulkSet==='max'?max:Math.max(0,Math.min(max,Number(btn.dataset.bulkSet)||0)));
    updatePreview(id);
    return;
  }
  const buyId=btn.dataset.bulkMallBuy;
  if(buyId&&GOODS[buyId])buyBulk(buyId);
});

if(pageEl){
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;patchMallPanel();});
  });
  observer.observe(pageEl,{childList:true});
}

patchMallPanel();