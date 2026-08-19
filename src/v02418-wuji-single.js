import { HEROES } from './data.js';
import { WUJI_STORY } from './story.js';

// V0.24.18 correction: early Zhang Wuji's Wudang Long Fist is single-target.
// Do not turn the free early-game Wuji into a group attacker.
if (HEROES?.wuji) {
  HEROES.wuji.role = '单体';
  HEROES.wuji.skill = { ...(HEROES.wuji.skill || {}), name: '武当长拳', target: 'one' };
}

for (const stage of WUJI_STORY || []) {
  if (stage?.skill?.name !== '武当长拳') continue;
  stage.role = '单体';
  stage.skill = { ...stage.skill, target: 'one' };
}
