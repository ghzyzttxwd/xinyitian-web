import { HEROES } from './data.js';
import { RED_KUNGFU } from './kungfu.js';
import { saveState } from './state.js';
import { bumpDaily } from './tasks.js';

// V0.24.4: interaction/data corrections kept outside app.js so the stable
// battle shell and controls stay untouched.

// Xiao Zhao: single-target ultimate, then +2 rage to the allied unit with
// the highest attack. Exact original damage multiplier is still unconfirmed.
if (HEROES.xiaozhao) {
  HEROES.xiaozhao.skill = {
    name: '轻罗飞花',
    target: 'one',
    multiplier: 1,
    rageCost: 4,
    highestAtkAllyRage: 2,
    compatMultiplier: true,
  };
}

const page = document.querySelector('#page');
const fmt = n => Number(n || 0).toLocaleString('zh-CN');
const BASE_RED_EXCHANGE_COST = 200;
const BASE_RED_EXCHANGE_IDS = [
  '104001', // 真武七截剑
  '104201', // 金刚不坏
  '104301', // 纯阳无极功
  '104401', // 金刚禅指功
  '104501', // 移形换影
  '104601', // 摧坚神爪
  '104701', // 乾坤化劲
];

function patchHeroDetail(){
  if (!page || page.dataset.page !== 'heroes') return;
  const active = page.querySelector('.detail-link.active');
  if (!active) return;
  const item = active.closest('.hero-list-item');
  if (!item) return;

  const topDetail = [...page.children].find(el =>
    el.matches?.('section.card') && el.querySelector('.tag')?.textContent?.trim() === '侠客详情'
  );
  if (topDetail && topDetail.parentElement === page) {
    active.insertAdjacentElement('afterend', topDetail);
    requestAnimationFrame(() => topDetail.scrollIntoView({ block:'nearest', behavior:'smooth' }));
  }

  const detail = item.querySelector('section.card');
  if (!detail) return;
  const name = detail.querySelector('.section-title h3')?.textContent?.trim();
  if (name === '小昭') {
    const skillRow = [...detail.querySelectorAll('.list-row')]
      .find(row => row.querySelector('span')?.textContent?.trim() === '绝技');
    const small = skillRow?.querySelector('small');
    if (small) small.textContent = '轻罗飞花 · 敌方单体 · 伤害倍率待核原版 · 4怒 · 己方攻击最高侠客回怒+2';
  }
}

function exchangeRows(state){
  const fragments = Number(state?.kungfu?.fragments || 0);
  return BASE_RED_EXCHANGE_IDS.map(id => {
    const k = RED_KUNGFU[id];
    if (!k) return '';
    const rec = state?.kungfu?.red?.[id] || { level:0, copies:0 };
    const own = Number(rec.level || 0) > 0;
    const stock = own ? `Lv.${rec.level} · 备用本体 ${fmt(rec.copies || 0)}` : '尚未获得';
    return `<div class="list-row"><div><b class="rarity-6">${k.name}</b><div class="hero-meta">${stock}</div></div><button class="btn ${fragments>=BASE_RED_EXCHANGE_COST?'btn-gold':''}" data-fragment-exchange="${id}" ${fragments>=BASE_RED_EXCHANGE_COST?'':'disabled'}>${BASE_RED_EXCHANGE_COST}残页 · 兑换1本</button></div>`;
  }).join('');
}

function patchKungfuPanel(){
  if (!page || page.dataset.page !== 'growth') return;
  const cards = [...page.querySelectorAll(':scope > section.card')];
  const drawCard = cards.find(card => card.querySelector('.section-title h3')?.textContent?.trim() === '藏经阁');
  if (!drawCard) return;

  const notice = drawCard.querySelector('.notice');
  if (notice) notice.textContent = '300元宝抽1次，1500元宝抽5次。红色功法概率暂沿用当前2%配置；未抽到红功法时，每次随机获得8～45张功法残页。';

  const state = globalThis.__XYT_STATE__;
  let shop = page.querySelector('#kungfuFragmentShop');
  if (!shop) {
    shop = document.createElement('section');
    shop.id = 'kungfuFragmentShop';
    shop.className = 'card';
    drawCard.insertAdjacentElement('afterend', shop);
  }
  shop.innerHTML = `<div class="section-title"><h3>功法商店</h3><small>功法残页 ${fmt(state?.kungfu?.fragments || 0)}</small></div><div class="notice">200张功法残页兑换1本基础红色功法。只开放7门基础属性型红功法；龙爪手、九阳真经、金刚伏魔功、混元一气功、九阴真经等机制型/稀有红功法不能用残页兑换。橙色功法不接入本单机版。</div>${exchangeRows(state)}`;
}

function patchRenderedPage(){
  patchHeroDetail();
  patchKungfuPanel();
}

if (page) {
  const observer = new MutationObserver(() => requestAnimationFrame(patchRenderedPage));
  observer.observe(page, { childList:true });
  requestAnimationFrame(patchRenderedPage);
}

function addKungfuCopy(state,id,count=1){
  const rec = state?.kungfu?.red?.[id];
  if (!rec) return;
  let n = Math.max(0, Number(count) || 0);
  if (rec.level <= 0 && n > 0) { rec.level = 1; n--; }
  rec.copies = Number(rec.copies || 0) + n;
}

function refreshKungfuView(keepY){
  document.querySelector('[data-growth-tab="kungfu"]')?.click();
  const state = globalThis.__XYT_STATE__;
  for (const item of document.querySelectorAll('#resourceBar .resource-item')) {
    if (item.querySelector('.resource-label')?.textContent?.trim() === '元宝') {
      const value = item.querySelector('.resource-value');
      if (value) value.textContent = fmt(state?.player?.gems || 0);
      break;
    }
  }
  const save = document.querySelector('#saveStatus');
  if (save) save.textContent = '已保存';
  requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top:keepY, left:0, behavior:'auto' })));
}

function drawKungfu(times){
  const state = globalThis.__XYT_STATE__;
  if (!state) return;
  const n = Number(times) === 5 ? 5 : 1;
  const cost = n * 300;
  if (Number(state.player?.gems || 0) < cost) {
    alert(`元宝不足，需要${cost}元宝。`);
    return;
  }

  const keepY = window.scrollY;
  state.player.gems -= cost;
  const reds = [];
  let fragments = 0;
  for (let i=0;i<n;i++) {
    state.kungfu.drawCount = Number(state.kungfu.drawCount || 0) + 1;
    if (Math.random() < .02) {
      const ids = Object.keys(RED_KUNGFU);
      const id = ids[Math.floor(Math.random() * ids.length)];
      addKungfuCopy(state,id,1);
      reds.push(RED_KUNGFU[id].name);
    } else {
      const gain = 8 + Math.floor(Math.random() * 38);
      state.kungfu.fragments = Number(state.kungfu.fragments || 0) + gain;
      fragments += gain;
    }
  }
  bumpDaily(state,'scripture',n);
  saveState(state);

  const redText = reds.length ? `红色功法：${reds.map(x=>`【${x}】`).join('、')}` : '未获得红色功法';
  alert(`藏经阁抽取${n}次：${redText}${fragments ? `；功法残页 +${fragments}` : ''}。`);
  refreshKungfuView(keepY);
}

function exchangeBaseRedKungfu(id){
  if (!BASE_RED_EXCHANGE_IDS.includes(id)) return;
  const state = globalThis.__XYT_STATE__;
  const k = RED_KUNGFU[id];
  if (!state || !k) return;
  const fragments = Number(state.kungfu?.fragments || 0);
  if (fragments < BASE_RED_EXCHANGE_COST) {
    alert(`功法残页不足，需要${BASE_RED_EXCHANGE_COST}张。`);
    return;
  }
  const keepY = window.scrollY;
  state.kungfu.fragments = fragments - BASE_RED_EXCHANGE_COST;
  addKungfuCopy(state,id,1);
  saveState(state);
  alert(`功法商店：消耗${BASE_RED_EXCHANGE_COST}张功法残页，获得【${k.name}】×1。`);
  refreshKungfuView(keepY);
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const exchangeBtn = target.closest('button[data-fragment-exchange]');
  if (exchangeBtn) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    exchangeBaseRedKungfu(exchangeBtn.dataset.fragmentExchange);
    return;
  }

  const btn = target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action !== 'drawKungfu1' && action !== 'drawKungfu5') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
  drawKungfu(action === 'drawKungfu5' ? 5 : 1);
}, true);
