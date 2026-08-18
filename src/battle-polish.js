const body=document.querySelector('#battleDialogBody');
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
