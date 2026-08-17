import {
  HEROES,
  RECHARGE_PACKS,
  STAMINA_BUY_LIMIT,
  requiredPlayerLevelForChapter,
  playerExpToNext,
  staminaPrice,
} from './data.js';
import {
  loadState,
  saveState,
  addPlayerExp,
  heroPower,
  totalPower,
  heroStats,
  ownHero,
  exportSave,
  importSaveFile,
  resetSave,
  recoverStamina,
  normalizeDaily,
  recalcVip,
} from './state.js';
import { runChapterBattle, runTowerBattle } from './battle.js';

let state = loadState();
let currentPage = 'home';

const pageEl = document.querySelector('#page');
const resourceBar = document.querySelector('#resourceBar');
const battleDialog = document.querySelector('#battleDialog');
const battleDialogBody = document.querySelector('#battleDialogBody');
const importInput = document.querySelector('#importSaveInput');
const saveStatus = document.querySelector('#saveStatus');

const fmt = n => Number(n || 0).toLocaleString('zh-CN');
const rarityName = r => r >= 7 ? '神品' : r >= 6 ? '传奇' : r >= 5 ? '宗师' : '侠客';

// 原客户端传奇招募令兑换倍率权重，总权重10000。
const LEGEND_EXCHANGE_WEIGHTS = [
  [1,1100],[2,1200],[3,1200],[4,1100],[5,1100],[6,1100],[7,1100],[8,900],[9,900],
  [10,50],[11,50],[12,50],[13,50],[14,50],[15,50],
];

function commit() {
  normalizeDaily(state);
  recalcVip(state);
  saveState(state);
  saveStatus.textContent = '已保存';
  render();
}

function resourceItem(label, value) {
  return `<div class="resource-item"><span class="resource-label">${label}</span><span class="resource-value">${value}</span></div>`;
}

function renderResources() {
  resourceBar.innerHTML = [
    resourceItem('等级', `Lv.${state.player.level}`),
    resourceItem('幕数', `第${state.player.chapter}幕`),
    resourceItem('战力', fmt(totalPower(state))),
    resourceItem('VIP', `V${state.player.vip}`),
    resourceItem('铜钱', fmt(state.player.copper)),
    resourceItem('元宝', fmt(state.player.gems)),
    resourceItem('体力', `${state.player.stamina}/${state.player.staminaCap}`),
    resourceItem('传奇令', fmt(state.player.legendTokens)),
  ].join('');
}

function partyHtml() {
  return state.party.map((id, index) => {
    if (!id) return `<div class="party-slot empty">${index + 1}号位</div>`;
    const tpl = HEROES[id];
    const h = state.heroes[id];
    return `<div class="party-slot">
      <div class="hero-name rarity-${tpl.rarity}">${tpl.name}</div>
      <div class="hero-meta">Lv.${h.level} · ${tpl.role}</div>
      <div class="hero-meta">战力 ${fmt(heroPower(state,id))}</div>
    </div>`;
  }).join('');
}

function renderHome() {
  const need = requiredPlayerLevelForChapter(state.player.chapter);
  const expNeed = playerExpToNext(state.player.level);
  const expPct = Math.min(100, Math.round(state.player.exp / expNeed * 100));
  pageEl.innerHTML = `
    <section class="card hero-banner">
      <div>
        <span class="tag">当前阵容战力</span>
        <div class="big-number">${fmt(totalPower(state))}</div>
        <div class="muted">第${state.player.chapter}幕 · 下一幕要求 Lv.${need}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">玩家等级</div>
        <div style="font-size:24px;font-weight:900">Lv.${state.player.level}</div>
      </div>
    </section>

    <section class="card">
      <div class="section-title"><h3>修为进度</h3><small>${fmt(state.player.exp)} / ${fmt(expNeed)}</small></div>
      <div class="progress"><i style="width:${expPct}%"></i></div>
    </section>

    <section class="card">
      <div class="section-title"><h3>当前阵容</h3><small>最多6人 · 在侠客页调整</small></div>
      <div class="party-grid">${partyHtml()}</div>
    </section>

    <section class="card">
      <div class="section-title"><h3>主线</h3><small>第${state.player.chapter}幕</small></div>
      <div class="notice">首次挑战不消耗体力。等级不足时，可用速战消耗5体力获取经验。</div>
      <div class="action-row" style="margin-top:10px">
        <button class="btn btn-primary" data-action="chapter">挑战第${state.player.chapter}幕</button>
        <button class="btn btn-gold" data-action="quick">速战 · 5体力</button>
      </div>
    </section>

    <section class="grid-2">
      <div class="card"><div class="muted">少林千宝塔</div><div style="font-size:22px;font-weight:900;margin:5px 0">${state.tower.highest}层</div><button class="btn btn-block" data-page-jump="challenge">去挑战</button></div>
      <div class="card"><div class="muted">模拟充值</div><div style="font-size:22px;font-weight:900;margin:5px 0">VIP ${state.player.vip}</div><button class="btn btn-block" data-page-jump="more">去充值</button></div>
    </section>
  `;
}

function recruitStatusHtml(id) {
  const tpl = HEROES[id];
  const recruit = tpl.recruit;
  if (!recruit) {
    if (id === 'xiaozhao') return '<span class="muted">首充6元获得</span>';
    return '<span class="muted">剧情/后续开放</span>';
  }
  if (recruit.type === 'vip8') return '<span class="muted">VIP8专属礼包</span>';
  if (state.player.chapter < (tpl.unlock || 0)) return `<span class="muted">第${tpl.unlock}幕开放</span>`;
  if (recruit.type === 'legendToken') {
    const enough = state.player.legendTokens >= recruit.cost;
    return `<button class="btn ${enough ? 'btn-primary' : ''}" data-recruit-hero="${id}" ${enough ? '' : 'disabled'}>${fmt(recruit.cost)}传奇令</button>`;
  }
  if (recruit.type === 'special') {
    const have = Number(state.specials?.[recruit.item] || 0);
    const enough = have >= recruit.cost;
    return `<div style="text-align:right"><div class="hero-meta">${recruit.item} ${fmt(have)}/${fmt(recruit.cost)}</div><button class="btn ${enough ? 'btn-primary' : ''}" data-recruit-hero="${id}" ${enough ? '' : 'disabled'}>兑换</button></div>`;
  }
  return '<span class="muted">未开放</span>';
}

function heroCard(id) {
  const tpl = HEROES[id];
  const h = state.heroes[id];
  const owned = h?.owned;
  const inParty = state.party.includes(id);
  const unlockText = tpl.recruit?.type === 'vip8' ? 'VIP8礼包' : tpl.unlock ? `第${tpl.unlock}幕开放` : (id === 'xiaozhao' ? '首充6元' : '初始/活动');
  const s = owned ? heroStats(state,id) : null;
  return `<div class="hero-card ${owned ? '' : 'locked'}">
    <div class="hero-card-row">
      <div>
        <div class="hero-name rarity-${tpl.rarity}">${tpl.name} <span class="tag">${rarityName(tpl.rarity)}</span></div>
        <div class="hero-meta">${tpl.role} · ${owned ? `Lv.${h.level} · 战力 ${fmt(heroPower(state,id))}` : unlockText}</div>
        ${s ? `<div class="hero-meta">攻 ${fmt(s.atk)} · 防 ${fmt(s.def)} · 血 ${fmt(s.hp)}</div>` : ''}
      </div>
      <div class="action-row">
        ${owned ? `<button class="btn" data-level-hero="${id}">升级</button><button class="btn ${inParty ? 'btn-gold' : ''}" data-toggle-party="${id}">${inParty ? '下阵' : '上阵'}</button>` : recruitStatusHtml(id)}
      </div>
    </div>
  </div>`;
}

function renderHeroes() {
  const ids = Object.keys(HEROES).sort((a,b) => {
    const ao = state.heroes[a]?.owned ? 1 : 0;
    const bo = state.heroes[b]?.owned ? 1 : 0;
    if (ao !== bo) return bo - ao;
    if (HEROES[a].unlock !== HEROES[b].unlock) return HEROES[a].unlock - HEROES[b].unlock;
    return HEROES[b].rarity - HEROES[a].rarity;
  });
  pageEl.innerHTML = `
    <div class="section-title"><h2>侠客</h2><small>${ids.filter(id=>state.heroes[id]?.owned).length}/${ids.length}</small></div>
    <div class="notice">已接入侠客升级、上阵/下阵、传奇令定向招募。六人阵容可自由调整。</div>
    <div class="hero-list" style="margin-top:10px">${ids.map(heroCard).join('')}</div>
  `;
}

function renderGrowth() {
  pageEl.innerHTML = `
    <div class="section-title"><h2>养成</h2><small>核心成长线</small></div>
    <div class="grid-2">
      ${['经脉','功法','内力','神兵','悟道'].map((name,i)=>`<div class="card"><div class="hero-name">${name}</div><div class="hero-meta">${i < 4 ? '下一阶段接入' : '神品后开放'}</div><button class="btn btn-block" disabled style="margin-top:10px">开发中</button></div>`).join('')}
    </div>
  `;
}

function renderChallenge() {
  const next = state.tower.highest + 1;
  pageEl.innerHTML = `
    <div class="section-title"><h2>挑战</h2><small>长期战力检验</small></div>
    <section class="card">
      <span class="tag">永久爬塔</span>
      <h3>少林千宝塔</h3>
      <div class="big-number">${state.tower.highest}层</div>
      <div class="muted">下一层：${next}层。胜利获得经脉丹与铜钱。</div>
      <button class="btn btn-primary btn-block" data-action="tower" style="margin-top:12px">挑战第${next}层</button>
    </section>
    <section class="card locked">
      <span class="tag">中后期</span>
      <h3>古墓奇遇</h3>
      <div class="muted">六人单机挑战，主要产出内力材料和鸳鸯刀。后续阶段接入。</div>
      <button class="btn btn-block" disabled style="margin-top:12px">尚未开放</button>
    </section>
  `;
}

function rechargeHtml() {
  return RECHARGE_PACKS.map(p => {
    const first = !state.recharge.firstDoubleUsed[p.yuan];
    const extra = p.yuan === 6 && !state.recharge.first6Claimed ? ' · 首充小昭礼包' : '';
    return `<button class="btn ${p.yuan === 648 ? 'btn-gold' : ''}" data-recharge="${p.yuan}">
      ${p.yuan}元<br><small>${first ? `首充 ${fmt(p.gems * 2)}元宝` : `${fmt(p.gems + p.repeatBonus)}元宝`}${extra}</small>
    </button>`;
  }).join('');
}

function moneyTreeLimit(vip) {
  if (vip >= 10) return 50;
  if (vip >= 8) return 40;
  if (vip >= 6) return 30;
  if (vip >= 4) return 20;
  if (vip >= 2) return 15;
  return 10;
}

function renderInnCard() {
  return `<section class="card">
    <div class="section-title"><h3>客栈</h3><small>定向招募</small></div>
    <div class="grid-2">
      <div class="mini-stat"><div class="muted">侠客信物</div><div class="big-number small">${fmt(state.player.heroTokens)}</div></div>
      <div class="mini-stat"><div class="muted">传奇招募令</div><div class="big-number small">${fmt(state.player.legendTokens)}</div></div>
    </div>
    <div class="notice" style="margin-top:10px">每次消耗10侠客信物兑换传奇招募令，保留原版多倍奖励，最高15倍。达到幕数后到“侠客”页定向招募。</div>
    <button class="btn btn-primary btn-block" data-action="exchangeLegend" ${state.player.heroTokens < 10 ? 'disabled' : ''} style="margin-top:10px">10信物兑换传奇令</button>
  </section>`;
}

function renderMore() {
  const staminaLimit = STAMINA_BUY_LIMIT[state.player.vip] ?? 24;
  const staminaCost = staminaPrice(state.daily.staminaBuys);
  const treeLimit = moneyTreeLimit(state.player.vip);
  const vip8Bought = !!state.recharge.vipGiftBought[8];
  pageEl.innerHTML = `
    <div class="section-title"><h2>更多</h2><small>客栈 · 充值 · 资源 · 存档</small></div>

    ${renderInnCard()}

    <section class="card">
      <div class="section-title"><h3>模拟充值</h3><small>累计 ¥${fmt(state.player.totalRecharge)}</small></div>
      <div class="notice">只修改本地存档，不产生真实支付。首充档位保留双倍元宝。</div>
      <div class="grid-3" style="margin-top:10px">${rechargeHtml()}</div>
    </section>

    <section class="card">
      <div class="section-title"><h3>VIP ${state.player.vip}</h3><small>氪佬成长</small></div>
      ${state.player.vip >= 8 ? `
        <div class="list-row"><div><b>VIP8 黄衫女礼包</b><div class="hero-meta">黄衫女×1 · 侠客信物×80 · 铜钱80万</div></div><button class="btn btn-gold" data-action="vip8gift" ${vip8Bought ? 'disabled' : ''}>${vip8Bought ? '已购买' : '40888元宝'}</button></div>
      ` : `<div class="notice">累计模拟充值10000元达到V8，解锁黄衫女专属礼包。</div>`}
    </section>

    <section class="card">
      <div class="section-title"><h3>体力购买</h3><small>${state.daily.staminaBuys}/${staminaLimit}</small></div>
      <div class="list-row"><span>每次 +25体力</span><button class="btn" data-action="buyStamina" ${state.daily.staminaBuys >= staminaLimit ? 'disabled' : ''}>${staminaCost}元宝</button></div>
    </section>

    <section class="card">
      <div class="section-title"><h3>摇钱树</h3><small>${state.daily.moneyTreeUses}/${treeLimit}</small></div>
      <div class="muted">基础10万铜钱，有概率暴击至多倍。</div>
      <button class="btn btn-gold btn-block" data-action="moneyTree" ${state.daily.moneyTreeUses >= treeLimit ? 'disabled' : ''} style="margin-top:10px">摇一次</button>
    </section>

    <section class="card">
      <div class="section-title"><h3>存档</h3><small>本地自动保存</small></div>
      <div class="action-row">
        <button class="btn" data-action="export">导出JSON</button>
        <button class="btn" data-action="import">导入JSON</button>
        <button class="btn btn-danger" data-action="reset">重置存档</button>
      </div>
    </section>
  `;
}

function render() {
  recoverStamina(state);
  normalizeDaily(state);
  renderResources();
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === currentPage));
  if (currentPage === 'home') renderHome();
  if (currentPage === 'heroes') renderHeroes();
  if (currentPage === 'growth') renderGrowth();
  if (currentPage === 'challenge') renderChallenge();
  if (currentPage === 'more') renderMore();
}

function showBattle(result, title, rewardText = '') {
  battleDialogBody.innerHTML = `<div class="modal-inner">
    <div class="modal-head"><h3>${title}</h3><button class="btn btn-ghost" data-close-dialog>关闭</button></div>
    <div class="${result.win ? 'battle-win' : 'battle-loss'}">${result.win ? '胜利' : '战败'} · 敌方战力约 ${fmt(result.enemyPower)}</div>
    ${rewardText ? `<div class="notice" style="margin:10px 0">${rewardText}</div>` : ''}
    <div class="battle-log">${result.log.map(x => `<div>${x}</div>`).join('')}</div>
  </div>`;
  battleDialog.showModal();
}

function challengeChapter() {
  if (!state.party.some(Boolean)) return alert('请至少上阵1名侠客。');
  const need = requiredPlayerLevelForChapter(state.player.chapter);
  if (state.player.level < need) {
    alert(`等级不足：第${state.player.chapter}幕需要 Lv.${need}。先速战获取经验。`);
    return;
  }
  const chapter = state.player.chapter;
  const result = runChapterBattle(state);
  let reward = '';
  if (result.win) {
    const exp = 180 + chapter * 36;
    const copper = 12000 + chapter * 1800;
    addPlayerExp(state, exp);
    state.player.copper += copper;
    state.player.heroTokens += chapter % 5 === 0 ? 2 : 0;
    state.player.chapter += 1;
    reward = `玩家经验 +${fmt(exp)} · 铜钱 +${fmt(copper)}${chapter % 5 === 0 ? ' · 侠客信物 +2' : ''}`;
    commit();
  }
  showBattle(result, `主线 · 第${chapter}幕`, reward);
}

function quickBattle() {
  if (state.player.stamina < 5) return alert('体力不足。');
  state.player.stamina -= 5;
  state.daily.quickBattles += 1;
  const exp = 260 + state.player.chapter * 44;
  const copper = 10000 + state.player.chapter * 900;
  addPlayerExp(state, exp);
  state.player.copper += copper;
  commit();
  alert(`速战完成：经验 +${fmt(exp)}，铜钱 +${fmt(copper)}。`);
}

function challengeTower() {
  if (!state.party.some(Boolean)) return alert('请至少上阵1名侠客。');
  const result = runTowerBattle(state);
  let reward = '';
  if (result.win) {
    state.tower.highest = result.floor;
    const pills = result.floor <= 100 ? 2 : Math.min(10, 2 + Math.floor(result.floor / 50));
    const copper = 8000 + result.floor * 1200;
    state.player.meridianPills += pills;
    state.player.copper += copper;
    reward = `经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;
    commit();
  }
  showBattle(result, `少林千宝塔 · ${result.floor}层`, reward);
}

function levelHero(id) {
  const h = state.heroes[id];
  if (!h?.owned) return;
  if (h.level >= state.player.level) return alert('侠客等级不能超过玩家等级。');
  const cost = Math.round(3000 * Math.pow(1.09, h.level - 1));
  if (state.player.copper < cost) return alert(`铜钱不足，需要 ${fmt(cost)}。`);
  state.player.copper -= cost;
  h.level += 1;
  commit();
}

function placeHeroIfPossible(id) {
  if (state.party.includes(id)) return true;
  const empty = state.party.findIndex(x => !x);
  if (empty >= 0) {
    state.party[empty] = id;
    return true;
  }
  return false;
}

function togglePartyHero(id) {
  const h = state.heroes[id];
  if (!h?.owned) return;
  const index = state.party.indexOf(id);
  if (index >= 0) {
    if (state.party.filter(Boolean).length <= 1) return alert('阵容至少保留1名侠客。');
    state.party[index] = null;
    commit();
    return;
  }
  const empty = state.party.findIndex(x => !x);
  if (empty < 0) return alert('阵容已满6人，请先下阵一名侠客。');
  state.party[empty] = id;
  commit();
}

function recruitHero(id) {
  const tpl = HEROES[id];
  const h = state.heroes[id];
  if (!tpl || !h || h.owned) return;
  if (state.player.chapter < (tpl.unlock || 0)) return alert(`需要推进到第${tpl.unlock}幕。`);
  const recruit = tpl.recruit;
  if (!recruit) return alert('该侠客目前不能在客栈招募。');
  if (recruit.type === 'legendToken') {
    if (state.player.legendTokens < recruit.cost) return alert(`传奇招募令不足，需要${recruit.cost}。`);
    state.player.legendTokens -= recruit.cost;
  } else if (recruit.type === 'special') {
    const have = Number(state.specials?.[recruit.item] || 0);
    if (have < recruit.cost) return alert(`${recruit.item}不足，需要${recruit.cost}。`);
    state.specials[recruit.item] = have - recruit.cost;
  } else {
    return alert('该侠客通过其他方式获得。');
  }
  ownHero(state, id);
  const placed = placeHeroIfPossible(id);
  commit();
  alert(`${tpl.name}招募成功${placed ? '，已自动加入空余阵位' : ''}。`);
}

function rollLegendMultiplier() {
  let roll = Math.floor(Math.random() * 10000) + 1;
  for (const [multi, weight] of LEGEND_EXCHANGE_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return multi;
  }
  return 1;
}

function exchangeLegendTokens() {
  if (state.player.heroTokens < 10) return alert('侠客信物不足，需要10个。');
  state.player.heroTokens -= 10;
  const multi = rollLegendMultiplier();
  state.player.legendTokens += multi;
  commit();
  alert(`客栈兑换成功：获得传奇招募令×${multi}${multi >= 10 ? '！大暴击！' : multi > 1 ? '！触发多倍奖励！' : '。'}`);
}

function recharge(yuan) {
  const pack = RECHARGE_PACKS.find(x => x.yuan === yuan);
  if (!pack) return;
  const first = !state.recharge.firstDoubleUsed[yuan];
  const firstSixNow = yuan === 6 && !state.recharge.first6Claimed;
  const gained = first ? pack.gems * 2 : pack.gems + pack.repeatBonus;
  state.recharge.firstDoubleUsed[yuan] = true;
  state.player.totalRecharge += yuan;
  state.player.gems += gained;

  if (firstSixNow) {
    state.recharge.first6Claimed = true;
    state.player.gems += 60;
    ownHero(state, 'xiaozhao');
    placeHeroIfPossible('xiaozhao');
  }
  recalcVip(state);
  commit();
  alert(`模拟充值 ¥${yuan}：获得 ${fmt(gained)} 元宝${firstSixNow ? '；首充礼包额外60元宝，小昭已领取。' : '。'}`);
}

function buyStamina() {
  const limit = STAMINA_BUY_LIMIT[state.player.vip] ?? 24;
  if (state.daily.staminaBuys >= limit) return alert('今日体力购买次数已用完。');
  const price = staminaPrice(state.daily.staminaBuys);
  if (state.player.gems < price) return alert('元宝不足。');
  state.player.gems -= price;
  state.player.stamina += 25;
  state.daily.staminaBuys += 1;
  commit();
}

function moneyTreeCost() {
  const n = state.daily.moneyTreeUses + 1;
  if (n === 1) return 0;
  if (n <= 3) return 50;
  if (n <= 5) return 60;
  if (n <= 7) return 70;
  if (n <= 9) return 80;
  if (n <= 11) return 90;
  return 100;
}

function moneyTree() {
  const limit = moneyTreeLimit(state.player.vip);
  if (state.daily.moneyTreeUses >= limit) return alert('今日摇钱树次数已用完。');
  const cost = moneyTreeCost();
  if (state.player.gems < cost) return alert('元宝不足。');
  state.player.gems -= cost;
  state.daily.moneyTreeUses += 1;
  const r = Math.random();
  const multi = r < .015 ? 5 : r < .06 ? 3 : r < .20 ? 2 : 1;
  const gain = 100000 * multi;
  state.player.copper += gain;
  commit();
  alert(`摇钱树${multi > 1 ? `暴击×${multi}` : ''}：铜钱 +${fmt(gain)}。`);
}

function buyVip8Gift() {
  if (state.player.vip < 8) return alert('需要VIP8。');
  if (state.recharge.vipGiftBought[8]) return;
  if (state.player.gems < 40888) return alert('元宝不足，需要40888元宝。');
  state.player.gems -= 40888;
  state.recharge.vipGiftBought[8] = true;
  state.player.heroTokens += 80;
  state.player.copper += 800000;
  ownHero(state, 'huangshan');
  placeHeroIfPossible('huangshan');
  commit();
  alert('VIP8礼包购买成功：黄衫女已加入侠客列表。');
}

async function onImport(file) {
  if (!file) return;
  try {
    state = await importSaveFile(file);
    commit();
    alert('存档导入成功。');
  } catch (err) {
    alert(`导入失败：${err.message}`);
  } finally {
    importInput.value = '';
  }
}

pageEl.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.pageJump) { currentPage = btn.dataset.pageJump; render(); return; }
  if (btn.dataset.levelHero) { levelHero(btn.dataset.levelHero); return; }
  if (btn.dataset.toggleParty) { togglePartyHero(btn.dataset.toggleParty); return; }
  if (btn.dataset.recruitHero) { recruitHero(btn.dataset.recruitHero); return; }
  if (btn.dataset.recharge) { recharge(Number(btn.dataset.recharge)); return; }
  const action = btn.dataset.action;
  if (action === 'chapter') challengeChapter();
  if (action === 'quick') quickBattle();
  if (action === 'tower') challengeTower();
  if (action === 'exchangeLegend') exchangeLegendTokens();
  if (action === 'buyStamina') buyStamina();
  if (action === 'moneyTree') moneyTree();
  if (action === 'vip8gift') buyVip8Gift();
  if (action === 'export') exportSave(state);
  if (action === 'import') importInput.click();
  if (action === 'reset' && confirm('确定清空本地存档并重新开始？')) { state = resetSave(); commit(); }
});

document.querySelector('.bottom-nav').addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  currentPage = btn.dataset.page;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

battleDialog.addEventListener('click', e => {
  if (e.target.closest('[data-close-dialog]')) battleDialog.close();
});

importInput.addEventListener('change', e => onImport(e.target.files?.[0]));

setInterval(() => {
  const before = state.player.stamina;
  recoverStamina(state);
  if (state.player.stamina !== before) { saveState(state); renderResources(); }
}, 30000);

window.addEventListener('beforeunload', () => saveState(state));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();