import { HEROES, INITIAL_HERO_IDS, SAVE_KEY, SAVE_VERSION, VIP_THRESHOLDS, playerExpToNext } from './data.js';
import { RED_KUNGFU, DIVINE_KUNGFU, equippedKungfuBonuses } from './kungfu.js';
import { createInnerPowerHeroState, innerPowerBonuses, INNER_POWER_PER_MINUTE, advanceInnerPower } from './innerpower.js';
import { createWeaponState, equippedWeaponBonuses } from './weapons.js';
import { createAncientTombState, ANCIENT_TOMB_DAILY_ATTEMPTS } from './ancienttomb.js';

function newHeroState(id) {
  return {
    id,
    level: 1,
    exp: 0,
    owned: INITIAL_HERO_IDS.includes(id),
    awakened: false,
    meridian: { progress: 0, atk: 0, def: 0, hp: 0, talent: 0 },
    kungfu: { equipped: [null,null,null,null,null,null,null,null] },
    innerPower: createInnerPowerHeroState(),
    weapons: {weapon:null,armor:null,accessory:null,treasure:null},
  };
}

function createKungfuState() {
  const red = {};
  Object.keys(RED_KUNGFU).forEach(id => { red[id] = { level: 0, copies: 0 }; });
  const divine = {};
  Object.keys(DIVINE_KUNGFU).forEach(id => { divine[id] = 0; });
  return { red, divine, scrolls: {}, drawCount: 0, fragments: 0 };
}

function createInnerPowerState(){
  return {
    rooms:[null,null,null,null,null,null,null],
    lastTick:Date.now(),
    items:{xingqi:0,yuling:0,wujue:0,lingqi:0,lingxian:0,juling:0,dingshen:0},
  };
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
    ancientTomb: createAncientTombState(),
    kungfu: createKungfuState(),
    innerPower:createInnerPowerState(),
    weapons:createWeaponState(),
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
    normalizeDaily(state); recoverStamina(state); recoverInnerPower(state); recalcVip(state);
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
    if (state.ancientTomb) state.ancientTomb.attemptsToday = ANCIENT_TOMB_DAILY_ATTEMPTS;
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

export function recoverInnerPower(state){
  if(!state.innerPower)return;
  const now=Date.now(),last=Number(state.innerPower.lastTick||now);
  const minutes=Math.floor((now-last)/60000);
  if(minutes<=0)return;
  for(const heroId of state.innerPower.rooms||[]){
    if(!heroId||!state.heroes?.[heroId]?.owned)continue;
    const ip=state.heroes[heroId].innerPower||(state.heroes[heroId].innerPower=createInnerPowerHeroState());
    if(ip.year>=280)continue;
    ip.power=Number(ip.power||0)+minutes*INNER_POWER_PER_MINUTE;
    advanceInnerPower(ip);
  }
  state.innerPower.lastTick=last+minutes*60000;
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
  const meridian = h.meridian || {}, k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);
  const ip = innerPowerBonuses(heroId,h.innerPower?.year||0,meridian.talent||0);
  const rawAtk=tpl.base.atk*growth+Number(meridian.atk||0)+k.atk+ip.flatAtk+w.atk;
  const rawDef=tpl.base.def*growth+Number(meridian.def||0)+k.def+ip.flatDef+w.def;
  const rawHp=tpl.base.hp*growth+Number(meridian.hp||0)+k.hp+ip.flatHp+w.hp;
  return {
    atk: Math.round(rawAtk*(1+ip.atkPct/100)),
    def: Math.round(rawDef*(1+ip.defPct/100)),
    hp: Math.round(rawHp*(1+ip.hpPct/100)),
    speed: tpl.base.speed + Math.floor((h.level - 1) / 10),
    hit: k.hit+ip.hit, dodge: k.dodge+ip.dodge, crit: k.crit+ip.crit, antiCrit: k.antiCrit+ip.antiCrit,
    damageBonus:ip.damageBonus, damageReduction:ip.damageReduction, initialRage:ip.initialRage,
  };
}

export function heroPower(state, heroId) {
  const s = heroStats(state, heroId); if (!s) return 0;
  const k = heroKungfuBonuses(state, heroId), w=equippedWeaponBonuses(state,heroId);
  return Math.round(s.atk*4.6 + s.def*3.5 + s.hp*.7 + s.speed*6 + (s.hit+s.dodge+s.crit+s.antiCrit+s.damageBonus+s.damageReduction)*1200 + k.power + w.power);
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
  const state=mergeDefaults(parsed,createInitialState()); normalizeDaily(state); recoverStamina(state); recoverInnerPower(state); recalcVip(state); saveState(state); return state;
}

export function resetSave() { localStorage.removeItem(SAVE_KEY); return createInitialState(); }