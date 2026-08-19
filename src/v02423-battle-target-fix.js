// V0.24.23: seed the exact battle viewer with canonical enemy names 1..6
// before v02421 parses the battle log. This prevents duplicate labels such as
// 守塔人4 / 守塔人5 and keeps structured target playback one-to-one.
const battleDialog=document.querySelector('#battleDialog');
const battleBody=document.querySelector('#battleDialogBody');
if(!battleDialog||!battleBody) throw new Error('battle dialog missing');

const previousShow=battleDialog.showModal.bind(battleDialog);

function enemyLabel(title){
  if(title.includes('古墓'))return '古墓守卫';
  if(title.includes('千宝塔'))return '守塔人';
  return '元兵';
}

function seedCanonicalEnemies(){
  const log=battleBody.querySelector('.battle-log');
  if(!log||log.querySelector('[data-v02423-enemy-seed]'))return;
  const title=battleBody.querySelector('.modal-head h3')?.textContent||'';
  const label=enemyLabel(title);
  const seed=document.createElement('div');
  seed.dataset.v02423EnemySeed='1';
  seed.hidden=true;
  seed.setAttribute('aria-hidden','true');
  seed.textContent=Array.from({length:6},(_,i)=>`${label}${i+1}`).join(' ');
  log.appendChild(seed);
}

battleDialog.showModal=function(){
  seedCanonicalEnemies();
  return previousShow();
};
