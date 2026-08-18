const battleDialog=document.querySelector('#battleDialog');

function forceCloseBattle(event){
  if(!battleDialog?.hasAttribute('open'))return false;
  if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}
  battleDialog.close();
  return true;
}

function toggleBattleLog(event,summary){
  const details=summary?.closest('details');
  if(!details)return false;
  if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}
  details.open=!details.open;
  return true;
}

// Capture before the visual battle layer can consume Android touch events.
for(const type of ['pointerup','touchend','click']){
  document.addEventListener(type,event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const close=target.closest('#battleDialog [data-close-dialog]');
    if(close){forceCloseBattle(event);return;}
    const summary=target.closest('#battleDialog .bv-log-details summary');
    if(summary){toggleBattleLog(event,summary);return;}
  },true);
}

// Previous versions wrapped the close button in method="dialog". Prevent that
// form from invoking native dialog behaviour; our overlay close is deterministic.
document.addEventListener('submit',event=>{
  const form=event.target;
  if(form instanceof HTMLFormElement&&form.closest('#battleDialog')&&form.dataset.battleCloseForm!==undefined){
    forceCloseBattle(event);
  }
},true);

// Android back/ESC: close battle first instead of trapping the player.
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&battleDialog?.hasAttribute('open'))forceCloseBattle(event);
},true);
