const page=document.querySelector('#page');

let pending=null;
let restoreQueued=false;

function cssEscape(value){
  if(globalThis.CSS?.escape)return CSS.escape(String(value));
  return String(value).replace(/["\\]/g,'\\$&');
}

function actionSelector(target){
  const forge=target.closest?.('[data-smart-weapon-forge]');
  if(forge)return `[data-smart-weapon-forge="${cssEscape(forge.dataset.smartWeaponForge)}"]`;
  const strengthen=target.closest?.('button[data-strengthen-weapon]');
  if(strengthen)return `button[data-strengthen-weapon="${cssEscape(strengthen.dataset.strengthenWeapon)}"]`;
  return '';
}

function rememberAction(target){
  const selector=actionSelector(target);
  if(!selector)return;
  const el=target.closest?.(selector)||document.querySelector(selector);
  if(!el)return;
  pending={selector,top:el.getBoundingClientRect().top,expires:Date.now()+5000};
}

function tryRestore(attempt=0){
  if(!pending)return;
  if(Date.now()>pending.expires){pending=null;return;}
  const el=document.querySelector(pending.selector);
  if(!el){
    if(attempt<12)requestAnimationFrame(()=>tryRestore(attempt+1));
    return;
  }
  const delta=el.getBoundingClientRect().top-pending.top;
  if(Math.abs(delta)>0.5)window.scrollBy({top:delta,left:0,behavior:'auto'});
  pending=null;
}

function queueRestore(){
  if(!pending||restoreQueued)return;
  restoreQueued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    restoreQueued=false;
    tryRestore();
  }));
}

// Capture on document so this runs before the older page-level capture handlers,
// which stopImmediatePropagation after handling weapon actions.
document.addEventListener('click',event=>{
  if(page?.dataset.page!=='growth')return;
  rememberAction(event.target);
},true);

if(page){
  const observer=new MutationObserver(()=>queueRestore());
  observer.observe(page,{childList:true});
}
