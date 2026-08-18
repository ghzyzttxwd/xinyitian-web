import { saveState, totalPower } from './state.js';

const resourceBar=document.querySelector('#resourceBar');
const POWER_POLL_MS=180;
let lastPower=0;
let animationId=0;
let animationActive=false;

function fmtPower(value){
  const n=Math.max(0,Number(value)||0);
  if(n>=100000000)return `${(n/100000000).toFixed(1)}亿`;
  if(n>=10000)return `${(n/10000).toFixed(1)}万`;
  return Math.round(n).toLocaleString('zh-CN');
}

function liveState(){return globalThis.__XYT_STATE__||null;}

function repairKungfuInventory(){
  const s=liveState();
  if(!s?.kungfu?.red)return false;
  let changed=false;
  for(const rec of Object.values(s.kungfu.red)){
    if(!rec||typeof rec!=='object')continue;
    rec.level=Math.max(0,Math.floor(Number(rec.level)||0));
    rec.copies=Math.max(0,Math.floor(Number(rec.copies)||0));
    if(rec.level<=0&&rec.copies>0){
      rec.level=1;
      rec.copies-=1;
      changed=true;
    }
  }
  if(changed)saveState(s);
  return changed;
}

function powerItem(){
  if(!resourceBar)return null;
  return [...resourceBar.querySelectorAll('.resource-item')].find(item=>item.querySelector('.resource-label')?.textContent?.trim()==='战力')||null;
}

function legendItem(){
  if(!resourceBar)return null;
  return [...resourceBar.querySelectorAll('.resource-item')].find(item=>item.querySelector('.resource-label')?.textContent?.trim()==='传奇令')||null;
}

function ensurePowerItem(finalValue=null){
  if(!resourceBar)return null;
  let item=powerItem();
  if(!item){
    item=document.createElement('div');
    item.className='resource-item power-resource-item';
    item.innerHTML='<span class="resource-copy"><span class="resource-label">战力</span><span class="resource-value">0</span></span>';
    resourceBar.appendChild(item);
  }
  item.classList.add('power-resource-item');
  const legend=legendItem();
  if(legend&&legend.nextElementSibling!==item)legend.insertAdjacentElement('afterend',item);
  if(finalValue!==null&&!animationActive){
    const value=item.querySelector('.resource-value');
    if(value)value.textContent=fmtPower(finalValue);
  }
  return item;
}

function showPowerGain(delta){
  if(delta<=0)return;
  const item=ensurePowerItem();
  if(!item)return;
  const old=document.querySelector('.power-gain-float');
  if(old)old.remove();
  const rect=item.getBoundingClientRect();
  const toast=document.createElement('div');
  toast.className='power-gain-float';
  toast.textContent=`战力 +${Math.max(0,Math.round(delta))}`;
  toast.style.left=`${Math.max(12,Math.min(window.innerWidth-12,rect.left+rect.width/2))}px`;
  toast.style.top=`${Math.min(window.innerHeight-54,rect.bottom+6)}px`;
  document.body.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add('show'));
  setTimeout(()=>toast.classList.add('leave'),760);
  setTimeout(()=>toast.remove(),1180);
}

function animatePower(from,to){
  const token=++animationId;
  animationActive=true;
  const start=performance.now();
  const duration=680;
  function frame(now){
    if(token!==animationId)return;
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    const current=Math.round(from+(to-from)*eased);
    const item=ensurePowerItem();
    const value=item?.querySelector('.resource-value');
    if(value)value.textContent=fmtPower(current);
    if(t<1){requestAnimationFrame(frame);return;}
    animationActive=false;
    if(value)value.textContent=fmtPower(to);
  }
  requestAnimationFrame(frame);
}

function safeTotalPower(){
  try{
    const s=liveState();
    return s?Math.max(0,Math.round(Number(totalPower(s))||0)):0;
  }catch{return 0;}
}

repairKungfuInventory();
lastPower=safeTotalPower();
ensurePowerItem(lastPower);

if(resourceBar){
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;
      ensurePowerItem(lastPower);
    });
  });
  observer.observe(resourceBar,{childList:true});
}

setInterval(()=>{
  if(document.visibilityState==='hidden')return;
  repairKungfuInventory();
  const current=safeTotalPower();
  if(current!==lastPower){
    const previous=lastPower;
    lastPower=current;
    if(current>previous)showPowerGain(current-previous);
    animatePower(previous,current);
  }else{
    ensurePowerItem(current);
  }
},POWER_POLL_MS);
