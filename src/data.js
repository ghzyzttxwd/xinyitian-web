import { towerPowerRating } from './power.js';
import { originalPlayerExpToNext, originalChapterRequiredLevel } from './progression.js';

export const SAVE_KEY = 'xinyitian_single_v1';
export const SAVE_VERSION = 1;

export const VIP_THRESHOLDS = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000, 20000, 30000, 50000, 70000, 150000, 300000];

export const RECHARGE_PACKS = [
  { yuan: 6, gems: 60, repeatBonus: 20 },
  { yuan: 30, gems: 300, repeatBonus: 100 },
  { yuan: 68, gems: 680, repeatBonus: 200 },
  { yuan: 128, gems: 1280, repeatBonus: 400 },
  { yuan: 328, gems: 3280, repeatBonus: 1000 },
  { yuan: 648, gems: 6480, repeatBonus: 2000 },
];

export const STAMINA_BUY_LIMIT = [8,12,12,16,16,20,20,36,36,36,36,36,36,36,36,36];

export function staminaPrice(index) {
  const n = index + 1;
  if (n <= 2) return 50;
  if (n === 3) return 100;
  if (n <= 6) return 150;
  if (n <= 12) return 200;
  if (n <= 16) return 250;
  if (n <= 20) return 300;
  return 400;
}

// 三维代码沿用原客户端：203攻击、204防御、202气血。
// 下列原版侠客基础三维来自 v580 `xiake.sanwei`。
// 后期五侠使用原版化名对应行：独臂大侠/桃花岛女侠/古墓女侠/襄阳大侠/顽童侠。
// 黄药师、洪七公为本单机版补入角色，暂按后期五侠同档三维处理，不冒充原版精确数据。
export const HEROES = {
  player: {
    id: 'player', name: '少侠', rarity: 5, role: '均衡', unlock: 0,
    base: { atk: 360, def: 180, hp: 1080, speed: 105 },
    skill: { name: '长虹贯日', target: 'all', multiplier: 1.05, rageCost: 4 },
  },
  wuji: {
    id: 'wuji', name: '张无忌', rarity: 5, role: '群攻', unlock: 0,
    base: { atk: 360, def: 180, hp: 1080, speed: 103 },
    skill: { name: '武当长拳', target: 'all', multiplier: 1.02, rageCost: 4 },
  },
  xiaozhao: {
    id: 'xiaozhao', name: '小昭', rarity: 5, role: '辅助', unlock: 0,
    base: { atk: 4500, def: 2250, hp: 13500, speed: 108 },
    skill: { name: '圣火心诀', target: 'all', multiplier: .88, rageCost: 4, teamRage: 1 },
  },
  yangxiao: {
    id: 'yangxiao', name: '杨逍', rarity: 6, role: '群攻/封穴', unlock: 30,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 30000, def: 15000, hp: 90000, speed: 111 },
    skill: { name: '乾坤大挪移', target: 'all', multiplier: 1.18, rageCost: 4, abnormal:[{type:'seal',chance:.28,duration:1}] },
  },
  yangdingtian: {
    id: 'yangdingtian', name: '阳顶天', rarity: 6, role: '输出', unlock: 55,
    recruit: { type: 'legendToken', cost: 900 },
    base: { atk: 60000, def: 30000, hp: 180000, speed: 106 },
    skill: { name: '乾坤神功', target: 'all', multiplier: 1.25, rageCost: 4 },
  },
  guoxiang: {
    id: 'guoxiang', name: '郭襄', rarity: 6, role: '回怒辅助', unlock: 70,
    recruit: { type: 'legendToken', cost: 900 },
    base: { atk: 60000, def: 30000, hp: 180000, speed: 115 },
    skill: { name: '落英剑法', target: 'all', multiplier: 1.05, rageCost: 4, teamRage: 2 },
  },
  zhangsanfeng: {
    id: 'zhangsanfeng', name: '张三丰', rarity: 6, role: '群攻', unlock: 70,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 90000, def: 45000, hp: 270000, speed: 112 },
    skill: { name: '太极无量', target: 'all', multiplier: 1.28, rageCost: 4 },
  },
  duer: {
    id: 'duer', name: '渡厄', rarity: 6, role: '三渡核心', unlock: 90,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 90000, def: 45000, hp: 270000, speed: 102 },
    skill: { name: '金刚伏魔', target: 'all', multiplier: 1.12, rageCost: 4 },
    combat: { buddhaNormal:1, buddhaSkill:2, buddhaSkillBonusPerStack:.06 },
  },
  dunan: {
    id: 'dunan', name: '渡难', rarity: 6, role: '控制', unlock: 90,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 90000, def: 45000, hp: 270000, speed: 104 },
    skill: { name: '须弥山掌', target: 'all', multiplier: 1.08, rageCost: 4, abnormal:[{type:'stun',chance:.30,duration:1}] },
    combat: { buddhaSkill:1 },
  },
  dujie: {
    id: 'dujie', name: '渡劫', rarity: 6, role: '防御', unlock: 90,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 90000, def: 45000, hp: 270000, speed: 99 },
    skill: { name: '伏魔护体', target: 'all', multiplier: .92, rageCost: 4 },
    combat: { vajraGuardOnSkill:1 },
  },
  huiyue: {
    id: 'huiyue', name: '辉月使', rarity: 6, role: '增攻/回怒', unlock: 100,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 90000, def: 45000, hp: 270000, speed: 116 },
    skill: { name: '圣火昭昭', target: 'all', multiplier: 1.02, rageCost: 4, teamRage: 2 },
  },
  huangshan: {
    id: 'huangshan', name: '黄衫女', rarity: 6, role: '单体斩首', unlock: 0,
    recruit: { type: 'vip8' },
    base: { atk: 60000, def: 30000, hp: 180000, speed: 119 },
    skill: { name: '玉女素心剑法', target: 'highestAtk', multiplier: 3.2, flatDamage: 3600, rageCost: 4, refundOnKill: true },
    passive: { firstRoundAbnormalImmune: true },
  },
  yangguo: {
    id: 'yangguo', name: '杨过', rarity: 6, role: '顶级输出', unlock: 110,
    recruit: { type: 'special', item: '纸皮面具', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 121 },
    skill: { name: '玄铁剑法', target: 'three', multiplier: 1.42, rageCost: 4 },
  },
  huangrong: {
    id: 'huangrong', name: '黄蓉', rarity: 6, role: '治疗/控制', unlock: 110,
    recruit: { type: 'special', item: '桃树', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 125 },
    skill: { name: '碧海潮生曲', target: 'all', multiplier: .96, rageCost: 4, healTeam: .35 },
  },
  xiaolongnv: {
    id: 'xiaolongnv', name: '小龙女', rarity: 6, role: '驱散/回怒', unlock: 110,
    recruit: { type: 'special', item: '玉蜂', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 128 },
    skill: { name: '玉女剑法', target: 'all', multiplier: 1.08, rageCost: 4, teamRage: 1 },
  },
  guojing: {
    id: 'guojing', name: '郭靖', rarity: 6, role: '降龙连发', unlock: 110,
    recruit: { type: 'special', item: '襄阳令', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 110 },
    skill: { name: '亢龙有悔', target: 'all', multiplier: 1.2, rageCost: 4, repeatChance: .5 },
  },
  zhoubotong: {
    id: 'zhoubotong', name: '周伯通', rarity: 6, role: '单体爆破', unlock: 110,
    recruit: { type: 'special', item: '大鸡腿', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 126 },
    skill: { name: '通明拳', target: 'highestAtk', multiplier: 4.8, rageCost: 4, ignoreDef: .3 },
  },
  huangyaoshi: {
    id: 'huangyaoshi', name: '黄药师', rarity: 6, role: '控制/减怒', unlock: 110,
    recruit: { type: 'special', item: '桃花令', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 130 },
    skill: { name: '碧海潮生曲', target: 'all', multiplier: 1.12, rageCost: 4 },
  },
  hongqigong: {
    id: 'hongqigong', name: '洪七公', rarity: 6, role: '爆发群攻', unlock: 110,
    recruit: { type: 'special', item: '打狗令', cost: 1000 },
    base: { atk: 105000, def: 52500, hp: 315000, speed: 114 },
    skill: { name: '降龙十八掌', target: 'all', multiplier: 1.42, rageCost: 4 },
  },
};

export const INITIAL_HERO_IDS = ['player', 'wuji'];

export function requiredPlayerLevelForChapter(chapter) {
  return originalChapterRequiredLevel(chapter);
}

export function playerExpToNext(level) {
  return originalPlayerExpToNext(level);
}

export function chapterEnemyPower(chapter) {
  return Math.round(1550 * Math.pow(1.075, chapter - 1));
}

export function chapterEnemyRating(chapter) {
  return Math.round(chapterEnemyPower(chapter) * 10);
}

export function towerEnemyRating(floor) {
  return towerPowerRating(floor);
}

// 战斗模拟仍用压缩后的内部强度；界面显示使用原版千宝塔战力锚点。
export function towerEnemyPower(floor) {
  return Math.max(2400, Math.round(towerEnemyRating(floor) / 7));
}
