const body=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
const XIAOZHAO_IMG='data:image/jpeg;base64,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';

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

function ensureXiaozhaoImage(){
  const portrait=body?.querySelector('.bv-fighter[data-fighter-id="xiaozhao"] .bv-portrait');
  if(!portrait)return;
  let img=portrait.querySelector('img.bv-xiaozhao-img');
  if(!img){
    portrait.replaceChildren();
    img=document.createElement('img');
    img.className='bv-xiaozhao-img';
    img.alt='小昭';
    img.decoding='sync';
    portrait.appendChild(img);
  }
  if(img.src!==XIAOZHAO_IMG)img.src=XIAOZHAO_IMG;
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

function polish(){ensureCloseButton();ensureXiaozhaoImage();ensureSixEnemies();markExtraEnemiesDead();}

if(battleDialog){
  battleDialog.addEventListener('cancel',e=>{e.preventDefault();closeBattle();});
  battleDialog.addEventListener('pointerdown',e=>{if(e.target===battleDialog)closeBattle();},true);
}
if(body){const obs=new MutationObserver(polish);obs.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});polish();}
