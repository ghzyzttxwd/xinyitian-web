const battleDialog=document.querySelector('#battleDialog');
let lastPointerAction={kind:'',time:0};

function consume(event){
  event?.preventDefault();
  event?.stopPropagation();
  event?.stopImmediatePropagation?.();
}

function forceCloseBattle(event){
  if(!battleDialog?.hasAttribute('open'))return false;
  consume(event);
  battleDialog.close();
  return true;
}

function toggleBattleLog(event,summary){
  const details=summary?.closest('details');
  if(!details)return false;
  consume(event);
  details.open=!details.open;
  return true;
}

function actionFromTarget(target){
  if(!(target instanceof Element))return null;
  const close=target.closest('#battleDialog [data-close-dialog]');
  if(close)return {kind:'close',el:close};
  const summary=target.closest('#battleDialog .bv-log-details summary');
  if(summary)return {kind:'log',el:summary};
  return null;
}

// Pointer events cover Android touch and mouse. Handle here before the battle
// presentation layer, then suppress the synthetic click that follows.
document.addEventListener('pointerup',event=>{
  const action=actionFromTarget(event.target);if(!action)return;
  lastPointerAction={kind:action.kind,time:Date.now()};
  if(action.kind==='close')forceCloseBattle(event);
  else toggleBattleLog(event,action.el);
},true);

document.addEventListener('click',event=>{
  const action=actionFromTarget(event.target);if(!action)return;
  const duplicate=action.kind===lastPointerAction.kind&&Date.now()-lastPointerAction.time<800;
  if(duplicate){consume(event);return;}
  // Keyboard activation / browsers without PointerEvent support.
  if(action.kind==='close')forceCloseBattle(event);
  else toggleBattleLog(event,action.el);
},true);

// Previous versions wrapped the close button in method="dialog". Prevent that
// form from invoking native dialog behaviour; our overlay close is deterministic.
document.addEventListener('submit',event=>{
  const form=event.target;
  if(form instanceof HTMLFormElement&&form.closest('#battleDialog')&&form.dataset.battleCloseForm!==undefined){
    consume(event);
    if(battleDialog?.hasAttribute('open'))battleDialog.close();
  }
},true);

// Desktop Escape; Android browser back remains normal page navigation if the
// browser does not emit a key event.
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&battleDialog?.hasAttribute('open'))forceCloseBattle(event);
},true);
