import { RED_KUNGFU } from './kungfu.js';
import { saveState } from './state.js';
import { bumpDaily } from './tasks.js';

// V0.24.5 correction: the user's "one draw" fragment range refers to one
// five-pull batch, not to every slot inside the five-pull.
const page=document.querySelector('#page');
const fmt=n=>Number(n||0).toLocaleString('zh-CN');

function addKungfuCopy(state,id,count=1){
  const rec=state?.kungfu?.red?.[id];if(!rec)return;
  let n=Math.max(0,Number(count)||0);
  if(rec.level<=0&&n>0){rec.level=1;n--;}
  rec.copies=Number(rec.copies||0)+n;
}

function fragmentGain(n,nonRed){
  if(nonRed<=0)return 0;
  if(n===5){
    const fullBatch=8+Math.floor(Math.random()*38); // 8..45 for a full five-pull
    return Math.max(1,Math.round(fullBatch*nonRed/5));
  }
  return 2+Math.floor(Math.random()*8); // 2..9 for a single pull, roughly one fifth
}

function patchNotice(){
  if(!page||page.dataset.page!=='growth')return;
  const draw=[...page.querySelectorAll(':scope > section.card')].find(card=>card.querySelector('.section-title h3')?.textContent?.trim()==='藏经阁');
  const notice=draw?.querySelector('.notice');
  if(notice)notice.textContent='300元宝单抽，1500元宝五连抽。红色功法概率暂沿用当前2%配置；五连抽整批非红结果合计随机8～45张功法残页，若其中出了红功法则按非红格数同比折算。单抽残页为2～9张。';
}
function patchLater(){requestAnimationFrame(()=>requestAnimationFrame(patchNotice));}
if(page){new MutationObserver(patchLater).observe(page,{childList:true});patchLater();}

function refreshKungfuView(keepY){
  document.querySelector('[data-growth-tab="kungfu"]')?.click();
  const state=globalThis.__XYT_STATE__;
  for(const item of document.querySelectorAll('#resourceBar .resource-item')){
    if(item.querySelector('.resource-label')?.textContent?.trim()==='元宝'){
      const value=item.querySelector('.resource-value');if(value)value.textContent=fmt(state?.player?.gems||0);break;
    }
  }
  const save=document.querySelector('#saveStatus');if(save)save.textContent='已保存';
  patchLater();
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:keepY,left:0,behavior:'auto'})));
}

function drawKungfu(times){
  const state=globalThis.__XYT_STATE__;if(!state)return;
  const n=Number(times)===5?5:1,cost=n*300;
  if(Number(state.player?.gems||0)<cost)return alert(`元宝不足，需要${cost}元宝。`);
  const keepY=window.scrollY;state.player.gems-=cost;
  const reds=[];let nonRed=0;
  for(let i=0;i<n;i++){
    state.kungfu.drawCount=Number(state.kungfu.drawCount||0)+1;
    if(Math.random()<.02){
      const ids=Object.keys(RED_KUNGFU),id=ids[Math.floor(Math.random()*ids.length)];
      addKungfuCopy(state,id,1);reds.push(RED_KUNGFU[id].name);
    }else nonRed++;
  }
  const fragments=fragmentGain(n,nonRed);
  if(fragments)state.kungfu.fragments=Number(state.kungfu.fragments||0)+fragments;
  bumpDaily(state,'scripture',n);saveState(state);
  const redText=reds.length?`红色功法：${reds.map(x=>`【${x}】`).join('、')}`:'未获得红色功法';
  alert(`藏经阁${n===5?'五连抽':'单抽'}：${redText}${fragments?`；功法残页 +${fragments}`:''}。`);
  refreshKungfuView(keepY);
}

document.addEventListener('click',event=>{
  const btn=event.target instanceof Element?event.target.closest('button[data-action]'):null;if(!btn)return;
  const action=btn.dataset.action;if(action!=='drawKungfu1'&&action!=='drawKungfu5')return;
  event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
  drawKungfu(action==='drawKungfu5'?5:1);
},true);
