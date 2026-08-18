const body=document.querySelector('#battleDialogBody');
const battleDialog=document.querySelector('#battleDialog');
const XIAOZHAO_IMG='data:image/jpeg;base64,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';

function closeBattle(){
  if(!battleDialog?.open)return;
  battleDialog.close();
}

if(battleDialog){
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-close-dialog]');
    if(!btn||!battleDialog.contains(btn))return;
    e.preventDefault();
    e.stopPropagation();
    closeBattle();
  },true);
  battleDialog.addEventListener('cancel',e=>{e.preventDefault();closeBattle();});
}

if(body){
  function labelFromTitle(){
    const title=body.querySelector('.modal-head h3')?.textContent||'';
    if(title.includes('古墓'))return '古墓守卫';
    if(title.includes('千宝塔'))return '守塔人';
    return '元兵';
  }
  function extraCard(name,index){
    const el=document.createElement('div');
    el.className='bv-fighter enemy bv-extra-enemy';
    el.dataset.fighterName=name;
    el.dataset.fighterId=`enemy-extra-${index}`;
    el.innerHTML=`<div class="bv-portrait"><span></span></div><div class="bv-name">${name}</div><div class="bv-hp"><i style="width:100%"></i></div><div class="bv-rage"><i style="width:25%"></i></div>`;
    return el;
  }
  function polish(){
    const stage=body.querySelector('.battle-visual-stage');
    if(!stage)return;
    const xz=stage.querySelector('.bv-fighter[data-fighter-id="xiaozhao"] .bv-portrait');
    if(xz){
      xz.style.backgroundImage=`url("${XIAOZHAO_IMG}")`;
      xz.style.backgroundPosition='center 18%';
      xz.style.backgroundSize='cover';
      xz.style.backgroundRepeat='no-repeat';
      const mark=xz.querySelector('span');if(mark)mark.style.display='none';
    }
    const team=stage.querySelector('.enemy-team');
    if(team&&!team.dataset.sixFilled){
      const current=[...team.querySelectorAll('.bv-fighter')];
      const label=labelFromTitle();
      for(let i=current.length;i<6;i++)team.appendChild(extraCard(`${label}${i+1}`,i));
      team.dataset.sixFilled='1';
    }
    const final=body.querySelector('.bv-final.show');
    if(final?.querySelector('.battle-win')){
      for(const el of body.querySelectorAll('.bv-extra-enemy')){
        el.classList.add('dead');
        const hp=el.querySelector('.bv-hp i');if(hp)hp.style.width='0%';
      }
    }
  }
  const obs=new MutationObserver(polish);
  obs.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  polish();
}
