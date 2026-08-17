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

export const STAMINA_BUY_LIMIT = [8,12,12,16,16,20,20,24,24,24,24,24,24,24,24,24];

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

export const HEROES = {
  player: {
    id: 'player', name: '少侠', rarity: 5, role: '均衡', unlock: 0,
    base: { atk: 135, def: 82, hp: 1650, speed: 105 },
    skill: { name: '长虹贯日', target: 'all', multiplier: 1.05, rageCost: 4 },
  },
  wuji: {
    id: 'wuji', name: '张无忌', rarity: 5, role: '群攻', unlock: 0,
    base: { atk: 150, def: 78, hp: 1540, speed: 103 },
    skill: { name: '武当长拳', target: 'all', multiplier: 1.02, rageCost: 4 },
  },
  xiaozhao: {
    id: 'xiaozhao', name: '小昭', rarity: 5, role: '辅助', unlock: 0,
    base: { atk: 112, def: 76, hp: 1480, speed: 108 },
    skill: { name: '圣火心诀', target: 'all', multiplier: .88, rageCost: 4, teamRage: 1 },
  },
  yangxiao: {
    id: 'yangxiao', name: '杨逍', rarity: 6, role: '群攻/封穴', unlock: 30,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 255, def: 132, hp: 2680, speed: 111 },
    skill: { name: '乾坤大挪移', target: 'all', multiplier: 1.18, rageCost: 4 },
  },
  yangdingtian: {
    id: 'yangdingtian', name: '阳顶天', rarity: 6, role: '输出', unlock: 55,
    recruit: { type: 'legendToken', cost: 900 },
    base: { atk: 292, def: 140, hp: 2800, speed: 106 },
    skill: { name: '乾坤神功', target: 'all', multiplier: 1.25, rageCost: 4 },
  },
  guoxiang: {
    id: 'guoxiang', name: '郭襄', rarity: 6, role: '回怒辅助', unlock: 70,
    recruit: { type: 'legendToken', cost: 900 },
    base: { atk: 285, def: 145, hp: 2920, speed: 115 },
    skill: { name: '落英剑法', target: 'all', multiplier: 1.05, rageCost: 4, teamRage: 2 },
  },
  zhangsanfeng: {
    id: 'zhangsanfeng', name: '张三丰', rarity: 6, role: '群攻', unlock: 70,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 330, def: 168, hp: 3240, speed: 112 },
    skill: { name: '太极无量', target: 'all', multiplier: 1.28, rageCost: 4 },
  },
  duer: {
    id: 'duer', name: '渡厄', rarity: 6, role: '三渡核心', unlock: 90,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 315, def: 190, hp: 3560, speed: 102 },
    skill: { name: '金刚伏魔', target: 'all', multiplier: 1.12, rageCost: 4 },
  },
  dunan: {
    id: 'dunan', name: '渡难', rarity: 6, role: '控制', unlock: 90,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 300, def: 176, hp: 3380, speed: 104 },
    skill: { name: '须弥山掌', target: 'all', multiplier: 1.08, rageCost: 4 },
  },
  dujie: {
    id: 'dujie', name: '渡劫', rarity: 6, role: '防御', unlock: 90,
    recruit: { type: 'legendToken', cost: 600 },
    base: { atk: 270, def: 218, hp: 3920, speed: 99 },
    skill: { name: '伏魔护体', target: 'all', multiplier: .92, rageCost: 4 },
  },
  huiyue: {
    id: 'huiyue', name: '辉月使', rarity: 6, role: '增攻/回怒', unlock: 100,
    recruit: { type: 'legendToken', cost: 1200 },
    base: { atk: 342, def: 172, hp: 3300, speed: 116 },
    skill: { name: '圣火昭昭', target: 'all', multiplier: 1.02, rageCost: 4, teamRage: 2 },
  },
  huangshan: {
    id: 'huangshan', name: '黄衫女', rarity: 6, role: '单体斩首', unlock: 0,
    recruit: { type: 'vip8' },
    base: { atk: 390, def: 178, hp: 3180, speed: 119 },
    skill: { name: '玉女素心剑法', target: 'highestAtk', multiplier: 3.2, rageCost: 4, refundOnKill: true },
  },
  yangguo: {
    id: 'yangguo', name: '杨过', rarity: 6, role: '顶级输出', unlock: 110,
    recruit: { type: 'special', item: '纸皮面具', cost: 1000 },
    base: { atk: 520, def: 225, hp: 4380, speed: 121 },
    skill: { name: '玄铁剑法', target: 'three', multiplier: 1.42, rageCost: 4 },
  },
  huangrong: {
    id: 'huangrong', name: '黄蓉', rarity: 6, role: '治疗/控制', unlock: 110,
    recruit: { type: 'special', item: '桃树', cost: 1000 },
    base: { atk: 430, def: 236, hp: 4680, speed: 125 },
    skill: { name: '碧海潮生曲', target: 'all', multiplier: .96, rageCost: 4, healTeam: .35 },
  },
  xiaolongnv: {
    id: 'xiaolongnv', name: '小龙女', rarity: 6, role: '驱散/回怒', unlock: 110,
    recruit: { type: 'special', item: '玉蜂', cost: 1000 },
    base: { atk: 470, def: 222, hp: 4210, speed: 128 },
    skill: { name: '玉女剑法', target: 'all', multiplier: 1.08, rageCost: 4, teamRage: 1 },
  },
  guojing: {
    id: 'guojing', name: '郭靖', rarity: 6, role: '降龙连发', unlock: 110,
    recruit: { type: 'special', item: '襄阳令', cost: 1000 },
    base: { atk: 535, def: 265, hp: 4920, speed: 110 },
    skill: { name: '亢龙有悔', target: 'all', multiplier: 1.2, rageCost: 4, repeatChance: .5 },
  },
  zhoubotong: {
    id: 'zhoubotong', name: '周伯通', rarity: 6, role: '单体爆破', unlock: 110,
    recruit: { type: 'special', item: '大鸡腿', cost: 1000 },
    base: { atk: 548, def: 242, hp: 4480, speed: 126 },
    skill: { name: '通明拳', target: 'highestAtk', multiplier: 4.8, rageCost: 4, ignoreDef: .3 },
  },
  huangyaoshi: {
    id: 'huangyaoshi', name: '黄药师', rarity: 6, role: '控制/减怒', unlock: 110,
    recruit: { type: 'special', item: '桃花令', cost: 1000 },
    base: { atk: 515, def: 230, hp: 4400, speed: 130 },
    skill: { name: '碧海潮生曲', target: 'all', multiplier: 1.12, rageCost: 4 },
  },
  hongqigong: {
    id: 'hongqigong', name: '洪七公', rarity: 6, role: '爆发群攻', unlock: 110,
    recruit: { type: 'special', item: '打狗令', cost: 1000 },
    base: { atk: 555, def: 248, hp: 4580, speed: 114 },
    skill: { name: '降龙十八掌', target: 'all', multiplier: 1.42, rageCost: 4 },
  },
};

export const INITIAL_HERO_IDS = ['player', 'wuji'];

export function requiredPlayerLevelForChapter(chapter) {
  if (chapter <= 10) return Math.max(1, chapter);
  return Math.min(240, chapter + 10);
}

export function playerExpToNext(level) {
  return Math.round(380 + Math.pow(level, 1.35) * 82);
}

export function chapterEnemyPower(chapter) {
  return Math.round(1550 * Math.pow(1.075, chapter - 1));
}

export function towerEnemyPower(floor) {
  return Math.round(2400 * Math.pow(1.0165, floor - 1));
}
