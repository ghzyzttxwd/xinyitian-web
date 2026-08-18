(()=>{
  const battle=document.querySelector('#battleDialog');
  const rail=document.querySelector('#battleControlRail');
  if(!battle)return;

  Object.defineProperty(battle,'open',{
    configurable:true,
    get(){return battle.hasAttribute('open');}
  });

  battle.showModal=function(){
    if(battle.open)return;
    battle.hidden=false;
    battle.setAttribute('open','');
    battle.classList.add('battle-overlay-open');
    document.documentElement.classList.add('battle-overlay-active');
    document.body.classList.add('battle-overlay-active');
    if(rail)rail.hidden=false;
    battle.dispatchEvent(new Event('battleoverlayopen'));
  };

  battle.close=function(){
    if(!battle.open)return;
    battle.removeAttribute('open');
    battle.classList.remove('battle-overlay-open');
    battle.hidden=true;
    document.documentElement.classList.remove('battle-overlay-active');
    document.body.classList.remove('battle-overlay-active');
    if(rail)rail.hidden=true;
    battle.dispatchEvent(new Event('close'));
  };

  function details(){return battle.querySelector('.bv-log-details');}
  function internal(selector){return battle.querySelector(selector);}
  let lastAction={kind:'',at:0};

  function run(kind,event){
    event?.preventDefault();
    event?.stopPropagation();
    if(kind==='close'){
      battle.close();
      return;
    }
    if(kind==='log'){
      const d=details();
      if(d)d.open=!d.open;
      return;
    }
    if(kind==='skip'){
      internal('[data-bv-skip]')?.click();
      return;
    }
    if(kind==='speed'){
      const b=internal('[data-bv-speed]');
      b?.click();
      const rb=rail?.querySelector('[data-rail-speed]');
      if(rb&&b)rb.textContent=b.textContent||'1×';
    }
  }

  function kindFrom(target){
    if(!(target instanceof Element))return '';
    if(target.closest('[data-rail-close]'))return 'close';
    if(target.closest('[data-rail-log]'))return 'log';
    if(target.closest('[data-rail-skip]'))return 'skip';
    if(target.closest('[data-rail-speed]'))return 'speed';
    return '';
  }

  if(rail){
    rail.addEventListener('pointerup',event=>{
      const kind=kindFrom(event.target);if(!kind)return;
      lastAction={kind,at:Date.now()};
      run(kind,event);
    },true);
    rail.addEventListener('click',event=>{
      const kind=kindFrom(event.target);if(!kind)return;
      if(kind===lastAction.kind&&Date.now()-lastAction.at<700){event.preventDefault();event.stopPropagation();return;}
      run(kind,event);
    },true);
  }

  // Keep the original in-panel close button working too.
  battle.addEventListener('click',event=>{
    const target=event.target;
    if(target instanceof Element&&target.closest('[data-close-dialog]')){
      event.preventDefault();event.stopPropagation();battle.close();
    }
  },true);
})();
