import { HEROES, INITIAL_HERO_IDS, SAVE_KEY, SAVE_VERSION, VIP_THRESHOLDS, playerExpToNext } from './data.js';
import { RED_KUNGFU, DIVINE_KUNGFU, equippedKungfuBonuses } from './kungfu.js';

function newHeroState(id) {
  return {
    id,
    level: 1,
    exp: 0,
    owned: INITIAL_HERO_IDS.includes(id),
    awakened: false,
    meridian: { progress: 0, atk: 0, def: 0, hp: 0, talent: 0 },
    kungfu: { equipped: [null,null,null,null,null,null,null,null] },
  };
}

function createKungfuState() {
  const red = {};
  Object.keys(RED_KUNGFU).forEach(id => { red[id] = { level: 0, copies: 0 }; });
  const divine = {};
  Object.keys(DIVINE_KUNGFU).forEach(id => { divine[id] = 0; });
  return { red, divine, scrolls: {}, drawCount: 0, fragments: 0 };
}

export function createInitialState() {
  const heroes = {};
  Object.keys(HEROES).forEach(id => { heroes[id] = newHeroState(id); });
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player: {
      level: 1, exp: 0, chapter: 1,
      copper: 120000, gems: 300,
      stamina: 100, staminaCap: 100, lastStaminaAt: Date.now(),
      vip: 0, vipExp: 0, totalRecharge: 0,
      legendTokens: 0, heroTokens: 20,
      meridianPills: 0, breakthroughPills: 0,
      kungfuTickets: 0,
    },
    heroes,
    party: ['player', 'wuji', null, null, null, null],
    tower: { highest: 0 },
    ancientTomb: { highest: 0, attemptsToday: 1 },
    kungfu: createKungfuState(),
    recharge: { firstDoubleUsed: {}, first6Claimed: false, vipGiftBought: {} },
    daily: { date: localDateKey(), staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0 },
    specials: {
      '纸皮面具': 0, '桃树': 0, '玉蜂': 0, '襄阳令': 0, '大鸡腿': 0,
      '桃花令': 0, '打狗令': 0,
    },
  };
}

export function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function mergeDefaults(saved, fresh) {
  if (Array.isArray(fresh)) return Array.isArray(saved) ? saved : fresh;
  if (!fresh || typeof fresh !== 'object') return saved ?? fresh;
  const out = { ...fresh };
  if (saved && typeof saved === 'object') {
    Object.keys(saved).forEach(key => { out[key] = key in fresh ? mergeDefaults(saved[key], fresh[key]) : saved[key]; });
  }
  return out;
}

export function loadState() {
  const fresh = createInitialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    const state = mergeDefaults(parsed, fresh);
    normalizeDaily(state); recoverStamina(state); recalcVip(state);
    return state;
  } catch (err) {
    console.warn('存档读取失败，使用新档', err);
    return fresh;
  }
}

export function saveState(state) { state.updatedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

export function normalizeDaily(state) {
  const today = localDateKey();
  if (state.daily.date !== today) {
    state.daily = { date: today, staminaBuys: 0, moneyTreeUses: 0, quickBattles: 0 };
    if (state.ancientTomb) state.ancientTomb.attemptsToday = 1;
  }
}

export function recoverStamina(state) {
  const now = Date.now(), last = Number(state.player.lastStaminaAt || now);
  const gained = Math.floor((now - last) / (6 * 60 * 1000));
  if (gained > 0) {
    state.player.stamina = Math.min(state.player.staminaCap, state.player.stamina + gained);
    state.player.lastStaminaAt = last + gained * 6 * 60 * 1000;
  }
}

export function recalcVip(state) {
  let vip = 0;
  for (let i=1;i<VIP_THRESHOLDS.length;i++) { if (state.player.totalRecharge >= VIP_THRESHOLDS[i]) vip=i; else break; }
  state.player.vip = vip;
  state.player.vipExp = state.player.totalRecharge * 10;
}

export function addPlayerExp(state, amount) {
  state.player.exp += Math.max(0, Math.floor(amount));
  while (state.player.level < 240) {
    const need = playerExpToNext(state.player.level);
    if (state.player.exp < need) break;
    state.player.exp -= need; state.player.level += 1;
    state.player.stamina = Math.min(state.player.staminaCap + 30, state.player.stamina + (state.player.level >= 21 ? 5 : 2));
  }
}

function globalKungfuLevels(state) {
  const levels = {};
  for (const [id,rec] of Object.entries(state.kungfu?.red || {})) levels[id] = Number(rec?.level || 0);
  return levels;
}

export function heroKungfuBonuses(state, heroId) {
  const h = state.heroes?.[heroId];
  if (!h) return {atk:0,def:0,hp:0,hit:0,dodge:0,crit:0,antiCrit:0,power:0};
  return equippedKungfuBonuses({ equipped: h.kungfu?.equipped || [], levels: globalKungfuLevels(state) });
}

export function heroStats(state, heroId) {
  const tpl = HEROES[heroId], h = state.heroes[heroId];
  if (!tpl || !h) return null;
  const growth = 1 + (Math.max(1, h.level) - 1) * 0.085;
  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId);
  return {
    atk: Math.round(tpl.base.atk * growth + Number(meridian.atk || 0) + k.atk),
    def: Math.round(tpl.base.def * growth + Number(meridian.def || 0) + k.def),
    hp: Math.round(tpl.base.hp * growth + Number(meridian.hp || 0) + k.hp),
    speed: tpl.base.speed + Math.floor((h.level - 1) / 10),
    hit: k.hit, dodge: k.dodge, crit: k.crit, antiCrit: k.antiCrit,
  };
}

export function heroPower(state, heroId) {
  const s = heroStats(state, heroId); if (!s) return 0;
  const k = heroKungfuBonuses(state, heroId);
  return Math.round(s.atk*4.6 + s.def*3.5 + s.hp*.7 + s.speed*6 + (s.hit+s.dodge+s.crit+s.antiCrit)*1200 + k.power);
}

export function totalPower(state) { return state.party.filter(Boolean).reduce((sum,id)=>sum+heroPower(state,id),0); }

export function ownHero(state, heroId) {
  if (!state.heroes[heroId]) state.heroes[heroId] = newHeroState(heroId);
  state.heroes[heroId].owned = true;
}

export function exportSave(state) {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`新倚天存档-${localDateKey()}.json`; a.click(); URL.revokeObjectURL(url);
}

export async function importSaveFile(file) {
  const text=await file.text(), parsed=JSON.parse(text);
  if (!parsed || typeof parsed!=='object' || !parsed.player) throw new Error('不是有效的新倚天存档');
  const state=mergeDefaults(parsed,createInitialState()); normalizeDaily(state); recoverStamina(state); recalcVip(state); saveState(state); return state;
}

export function resetSave() { localStorage.removeItem(SAVE_KEY); return createInitialState(); }
