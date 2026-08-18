import { WEAPONS, WEAPON_MAX_LEVEL, weaponRecord, strengthenCost } from './weapons.js';
import { saveState } from './state.js';
import { bumpDaily } from './tasks.js';

const page=document.querySelector('#page');
const saveStatus=document.querySelector('#saveStatus');

function state(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function persist(){const s=state();if(!s)return;saveState(s);if(saveStatus)saveStatus.textContent='已保存';}
function refreshWeapons(){document.querySelector('[data-growth-tab="weapons"]')?.click();}

function nextStrengthCost(id,count=10){
  const s=state(),r=weaponRecord(s,id);if(!r?.owned)return {levels:0,cost:0};
  let lv=Number(r.level||0),cost=0,levels=0;
  while(levels<count&&lv<WEAPON_MAX_LEVEL){cost+=strengthenCost(lv);lv++;levels++;}
  return {levels,cost};
}

function patchStrengthButtons(){
  if(page?.dataset.page!=='growth')return;
  for(const btn of page.querySelectorAll('button[data-strengthen-weapon]')){
    const id=btn.dataset.strengthenWeapon,r=weaponRecord(state(),id);if(!r?.owned)continue;
    if(Number(r.level||0)>=WEAPON_MAX_LEVEL){btn.disabled=true;btn.textContent='强化已满';continue;}
    const next=nextStrengthCost(id,10),first=strengthenCost(r.level),copper=Number(state()?.player?.copper||0);
    btn.disabled=copper<first;
    btn.textContent=`强化${next.levels}次 · ${fmt(next.cost)}铜钱`;
  }
}

function strengthenTen(id){
  const s=state(),r=weaponRecord(s,id),w=WEAPONS[id];if(!s||!r?.owned||!w||r.level>=WEAPON_MAX_LEVEL)return;
  let done=0,total=0;
  while(done<10&&r.level<WEAPON_MAX_LEVEL){
    const cost=strengthenCost(r.level);
    if(Number(s.player?.copper||0)<cost)break;
    s.player.copper-=cost;r.level+=1;total+=cost;done+=1;
  }
  if(done<=0)return alert(`铜钱不足，下一次强化需要${fmt(strengthenCost(r.level))}铜钱。`);
  bumpDaily(s,'weapon',done);persist();refreshWeapons();
  alert(`${w.name}连续强化${done}次：当前强化+${r.level}，共消耗${fmt(total)}铜钱。`);
}

function patchSpecialPackCopy(){
  if(page?.dataset.page!=='more')return;
  for(const el of page.querySelectorAll('.notice')){
    const text=el.textContent||'';
    if(text.includes('648模拟充值'))el.textContent=text.replace('648模拟充值','首次648档模拟充值');
  }
}

if(page){
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;patchStrengthButtons();patchSpecialPackCopy();});
  });
  observer.observe(page,{childList:true});

  page.addEventListener('click',event=>{
    const strengthen=event.target.closest?.('button[data-strengthen-weapon]');
    if(strengthen&&WEAPONS[strengthen.dataset.strengthenWeapon]){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      strengthenTen(strengthen.dataset.strengthenWeapon);return;
    }

    const recharge=event.target.closest?.('button[data-recharge="648"]');
    if(!recharge)return;
    const s=state();if(!s)return;
    const repeat=!!s.recharge?.firstDoubleUsed?.[648];
    if(!repeat)return;
    const before=Math.max(0,Number(s.vipExtras?.specialChoicePacks||0));
    const nativeAlert=window.alert;
    window.alert=msg=>nativeAlert(String(msg).replace('。奇侠兑换物自选包 +1','').replace('奇侠兑换物自选包 +1',''));
    queueMicrotask(()=>{
      window.alert=nativeAlert;
      const now=Math.max(0,Number(s.vipExtras?.specialChoicePacks||0));
      if(now>before){s.vipExtras.specialChoicePacks=before;persist();}
    });
  },true);
}

requestAnimationFrame(()=>{patchStrengthButtons();patchSpecialPackCopy();});
