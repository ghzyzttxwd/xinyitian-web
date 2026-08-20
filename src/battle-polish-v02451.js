// V0.24.51: battle polish without legacy Xiao Zhao portrait injection.
// Keep battle close/six-enemy helpers, but never replace fighter portrait children.
const body=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');

function closeBattle(){
  if(!battleDialog?.open)return;
  try{battleDialog.close();}catch{battleDialog.removeAttribute('open');}
}

function ensureCloseButton(){
  if(!body||!battleDialog)return;
  const btn=body.querySelector('[data-close-dialog]');
  if(!btn)return;
  const head=btn.closest('.modal-head');
  if(head){head.style.position='relative';head.style.zIndex='100000';head.style.pointerEvents='auto';}
  btn.style.position='relative';btn.style.zIndex='100001';btn.style.pointerEvents='auto';btn.style.touchAction='manipulation';
  if(btn.dataset.nativeCloseReady==='1')return;
  btn.dataset.nativeCloseReady='1';
  let form=btn.closest('form[data-battle-close-form]');
  if(!form){
    form=document.createElement('form');form.method='dialog';form.dataset.battleCloseForm='1';form.style.margin='0';form.style.position='relative';form.style.zIndex='100001';
    btn.parentNode.insertBefore(form,btn);form.appendChild(btn);
  }
  btn.type='submit';btn.value='close';
  const forceClose=e=>{e.preventDefault();e.stopPropagation();closeBattle();};
  btn.addEventListener('pointerup',forceClose,true);
  btn.addEventListener('touchend',forceClose,{capture:true,passive:false});
  btn.addEventListener('click',forceClose,true);
}

function labelFromTitle(){
  const title=body?.querySelector('.modal-head h3')?.textContent||'';
  if(title.includes('古墓'))return '古墓守卫';
  if(title.includes('千宝塔'))return '守塔人';
  return '元兵';
}

function extraCard(name,index){
  const el=document.createElement('div');
  el.className='bv-fighter enemy bv-extra-enemy';
  el.dataset.fighterName=name;el.dataset.fighterId=`enemy-extra-${index}`;
  el.innerHTML=`<div class="bv-portrait"><span></span></div><div class="bv-name">${name}</div><div class="bv-hp"><i style="width:100%"></i></div><div class="bv-rage"><i style="width:25%"></i></div>`;
  return el;
}

function ensureSixEnemies(){
  const team=body?.querySelector('.enemy-team');
  if(!team||team.dataset.sixFilled==='1')return;
  const current=[...team.querySelectorAll('.bv-fighter')];
  const label=labelFromTitle();
  for(let i=current.length;i<6;i++)team.appendChild(extraCard(`${label}${i+1}`,i));
  team.dataset.sixFilled='1';
}

function markExtraEnemiesDead(){
  const final=body?.querySelector('.bv-final.show');
  if(!final?.querySelector('.battle-win'))return;
  for(const el of body.querySelectorAll('.bv-extra-enemy')){
    el.classList.add('dead');
    const hp=el.querySelector('.bv-hp i');if(hp)hp.style.width='0%';
  }
}

function polish(){ensureCloseButton();ensureSixEnemies();markExtraEnemiesDead();}

if(battleDialog){
  battleDialog.addEventListener('cancel',e=>{e.preventDefault();closeBattle();});
  battleDialog.addEventListener('pointerdown',e=>{if(e.target===battleDialog)closeBattle();},true);
}
if(body){
  const obs=new MutationObserver(polish);
  obs.observe(body,{childList:true,subtree:true});
  polish();
}
