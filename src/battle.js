import { HEROES, chapterEnemyPower, towerEnemyPower } from './data.js';
import { heroStats } from './state.js';

function cloneFighter(base) {
  return { ...base, hpNow: base.hp, rage: 0, alive: true, shield: 0 };
}

function playerTeam(state) {
  return state.party.filter(Boolean).map(id => {
    const tpl = HEROES[id];
    const s = heroStats(state, id);
    return cloneFighter({ id, name: tpl.name, side: 'player', ...s, skill: tpl.skill });
  });
}

function makeEnemyTeam(power, label = '江湖敌手') {
  const count = power < 14000 ? 3 : power < 50000 ? 4 : 6;
  const each = power / count;
  const team = [];
  for (let i = 0; i < count; i++) {
    const scale = .93 + i * .035;
    const atk = Math.max(60, Math.round(each * .155 * scale));
    const def = Math.max(40, Math.round(each * .087 * scale));
    const hp = Math.max(800, Math.round(each * .83 * scale));
    team.push(cloneFighter({
      id: `enemy-${i}`,
      name: `${label}${i + 1}`,
      side: 'enemy',
      atk, def, hp,
      speed: 92 + i * 2,
      skill: { name: '合击', target: 'one', multiplier: 1.65, rageCost: 4 },
    }));
  }
  return team;
}

function living(team) { return team.filter(x => x.alive); }

function pickTargets(skill, enemies) {
  const alive = living(enemies);
  if (!alive.length) return [];
  if (skill.target === 'all') return alive;
  if (skill.target === 'three') return [...alive].sort((a,b) => a.hpNow - b.hpNow).slice(0, 3);
  if (skill.target === 'highestAtk') return [[...alive].sort((a,b) => b.atk - a.atk)[0]];
  return [alive[Math.floor(Math.random() * alive.length)]];
}

function damage(attacker, target, multiplier = 1, ignoreDef = 0) {
  const effectiveDef = target.def * (1 - ignoreDef);
  const base = Math.max(attacker.atk * .28, attacker.atk - effectiveDef * .56);
  const variance = .92 + Math.random() * .16;
  return Math.max(1, Math.round(base * multiplier * variance));
}

function applyDamage(target, amount) {
  let left = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, left);
    target.shield -= absorbed;
    left -= absorbed;
  }
  if (left > 0) target.hpNow -= left;
  if (target.hpNow <= 0) {
    target.hpNow = 0;
    target.alive = false;
  }
}

function healTeam(team, source, ratio, log) {
  if (!ratio) return;
  for (const ally of living(team)) {
    const heal = Math.round(source.atk * ratio);
    ally.hpNow = Math.min(ally.hp, ally.hpNow + heal);
  }
  log.push(`${source.name}为全队恢复气血。`);
}

function teamRage(team, amount, source, log) {
  if (!amount) return;
  for (const ally of living(team)) ally.rage = Math.min(8, ally.rage + amount);
  log.push(`${source.name}令己方全体怒气 +${amount}。`);
}

function act(actor, own, enemies, log) {
  if (!actor.alive || living(enemies).length === 0) return;
  const skill = actor.skill || { name: '绝技', target: 'one', multiplier: 1.5, rageCost: 4 };
  const useSkill = actor.rage >= (skill.rageCost || 4);
  const action = useSkill ? skill : { name: '普通攻击', target: 'one', multiplier: 1 };
  const targets = pickTargets(action, enemies);
  if (!targets.length) return;

  if (useSkill) actor.rage -= skill.rageCost || 4;
  else actor.rage = Math.min(8, actor.rage + 2);

  let killed = false;
  let total = 0;
  for (const target of targets) {
    const hit = damage(actor, target, action.multiplier || 1, action.ignoreDef || 0);
    const wasAlive = target.alive;
    applyDamage(target, hit);
    total += hit;
    if (wasAlive && !target.alive) killed = true;
  }
  log.push(`${actor.name}${useSkill ? `施展【${action.name}】` : '普通攻击'}，造成 ${total.toLocaleString()} 伤害。${killed ? ' 有敌人倒下！' : ''}`);

  if (useSkill && skill.refundOnKill && killed) actor.rage += skill.rageCost || 4;
  if (useSkill) {
    teamRage(own, skill.teamRage || 0, actor, log);
    healTeam(own, actor, skill.healTeam || 0, log);
    if (skill.repeatChance && living(enemies).length && Math.random() < skill.repeatChance) {
      const extraTargets = pickTargets(skill, enemies);
      let extra = 0;
      for (const target of extraTargets) {
        const hit = damage(actor, target, (skill.multiplier || 1) * 1.5, skill.ignoreDef || 0);
        applyDamage(target, hit);
        extra += hit;
      }
      log.push(`${actor.name}触发连发，再次施展【${skill.name}】，造成 ${extra.toLocaleString()} 伤害！`);
    }
  }
}

function simulate(player, enemies, maxRounds = 20) {
  const log = [];
  for (let round = 1; round <= maxRounds; round++) {
    if (!living(player).length || !living(enemies).length) break;
    log.push(`—— 第${round}回合 ——`);
    const order = [...living(player), ...living(enemies)].sort((a,b) => b.speed - a.speed || (Math.random() - .5));
    for (const actor of order) {
      if (!actor.alive) continue;
      if (actor.side === 'player') act(actor, player, enemies, log);
      else act(actor, enemies, player, log);
      if (!living(player).length || !living(enemies).length) break;
    }
  }
  const win = living(player).length > 0 && living(enemies).length === 0;
  return {
    win,
    log,
    playerAlive: living(player).length,
    enemyAlive: living(enemies).length,
  };
}

export function runChapterBattle(state) {
  const power = chapterEnemyPower(state.player.chapter);
  return { ...simulate(playerTeam(state), makeEnemyTeam(power, '元兵')), enemyPower: power };
}

export function runTowerBattle(state) {
  const floor = state.tower.highest + 1;
  const power = towerEnemyPower(floor);
  return { ...simulate(playerTeam(state), makeEnemyTeam(power, '守塔人')), enemyPower: power, floor };
}
