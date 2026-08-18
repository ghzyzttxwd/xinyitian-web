import { HEROES } from './data.js';
import {
  WEAPONS, WEAPON_TYPES, WEAPON_MAX_LEVEL, WEAPON_SMELT_OPEN_LEVEL, WEAPON_SMELT_MAX,
  weaponRecord, breakthroughNeed, smeltNeed, smeltAttrText,
} from './weapons.js';
import { saveState } from './state.js';
import { bumpDaily } from './tasks.js';

const page=document.querySelector('#page');
const dialog=document.querySelector('#genericDialog');
const dialogBody=document.querySelector('#genericDialogBody');
const saveStatus=document.querySelector('#saveStatus');

function liveState(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function heroIdByName(name){return Object.entries(HEROES).find(([,h])=>h?.name===name)?.[0]||null;}
function currentHeroId(){
  const text=page?.querySelector('.weapon-system-root .section-title h3, .weapon-system-head .section-title h3')?.textContent
    || [...(page?.querySelectorAll('section.card .section-title h3')||[])].find(x=>/· 神兵$/.test(x.textContent?.trim()||''))?.textContent
    || '';
  return heroIdByName(String(text).split('·')[0].trim());
}
function ensureHeroWeapons(heroId){
  const h=liveState()?.heroes?.[heroId];if(!h)return null;
  h.weapons=h.weapons||{weapon:null,armor:null,accessory:null,treasure:null};
  for(const slot of Object.keys(WEAPON_TYPES))if(!(slot in h.weapons))h.weapons[slot]=null;
  return h.weapons;
}
function equippedCount(id){
  let n=0;for(const h of Object.values(liveState()?.heroes||{}))for(const wid of Object.values(h?.weapons||{}))if(wid===id)n++;
  return n;
}
function totalPhysicalCopies(id){const r=weaponRecord(liveState(),id);return r.owned?1+Math.max(0,Number(r.copies||0)):0;}
function freeEquipCopies(id){return Math.max(0,totalPhysicalCopies(id)-equippedCount(id));}
function reservedDuplicateCopies(id){return Math.max(0,equippedCount(id)-1);}
function freeMaterialCopies(id){const r=weaponRecord(liveState(),id);return Math.max(0,Number(r.copies||0)-reservedDuplicateCopies(id));}
function persist(){const s=liveState();if(!s)return;saveState(s);if(saveStatus)saveStatus.textContent='已保存';}
function refreshWeapons(){
  const btn=document.querySelector('[data-growth-tab="weapons"]');
  if(btn)btn.click();
  else requestAnimationFrame(patchWeaponPage);
}

function weaponSlotHtml(heroId,slot,label){
  const eq=ensureHeroWeapons(heroId),id=eq?.[slot],w=id?WEAPONS[id]:null,r=id?weaponRecord(liveState(),id):null;
  return `<div class="weapon-slot-card">
    <div class="weapon-slot-label">${label}</div>
    <div class="weapon-slot-name">${w?w.name:'空槽位'}</div>
    <div class="weapon-slot-meta">${w?`强化+${r.level} · 突破${r.breakthrough} · 熔铸${Number(r.smelt||0)}火`:'点击选择已拥有的同部位神兵'}</div>
    <div class="action-row">
      <button class="btn ${w?'':'btn-gold'}" type="button" data-weapon-slot-pick="${slot}">${w?'更换':'选择神兵'}</button>
      ${w?`<button class="btn btn-ghost" type="button" data-unequip-weapon="${slot}">卸下</button>`:''}
    </div>
  </div>`;
}

function patchWeaponHeader(){
  if(!page||page.dataset.page!=='growth')return false;
  const head=[...page.querySelectorAll('section.card')].find(card=>/· 神兵$/.test(card.querySelector('.section-title h3')?.textContent?.trim()||''));
  if(!head)return false;
  head.classList.add('weapon-system-root','weapon-system-head');
  const heroId=currentHeroId();if(!heroId)return false;
  const old=head.querySelector('.kungfu-slots');
  if(old){old.className='weapon-slot-grid';old.innerHTML=Object.entries(WEAPON_TYPES).map(([slot,label])=>weaponSlotHtml(heroId,slot,label)).join('');}
  let summary=head.querySelector('.weapon-system-summary');
  if(!summary){summary=document.createElement('div');summary.className='weapon-system-summary';head.appendChild(summary);}
  const s=liveState(),owned=Object.values(s?.weapons?.items||{}).filter(x=>x?.owned).length;
  summary.innerHTML=`<div class="mini-stat"><span class="muted">已收集</span><b>${owned}/${Object.keys(WEAPONS).length}</b></div><div class="mini-stat"><span class="muted">精铁</span><b>${fmt(s?.weapons?.iron||0)}</b></div><div class="mini-stat"><span class="muted">天外陨铁</span><b>${fmt(s?.weapons?.meteorIron||0)}</b></div>`;
  return true;
}

function patchWeaponLibrary(){
  const s=liveState(),heroId=currentHeroId();if(!s||!heroId)return;
  const eq=ensureHeroWeapons(heroId);if(!eq)return;
  for(const equipBtn of page.querySelectorAll('button[data-equip-weapon]')){
    const id=equipBtn.dataset.equipWeapon,w=WEAPONS[id],r=weaponRecord(s,id);if(!w||!r.owned)continue;
    const card=equipBtn.closest('.hero-card');
    const count=equippedCount(id),freeEquip=freeEquipCopies(id),freeMats=freeMaterialCopies(id),isCurrent=eq[w.slot]===id;
    const metas=card?[...card.querySelectorAll('.hero-meta')]:[];
    const stock=metas.find(x=>/同名本体/.test(x.textContent||''));
    if(stock)stock.textContent=`备用本体 ${fmt(r.copies)} · 已装备${count}件 · 可用于培养${fmt(freeMats)}件`;
    equipBtn.disabled=!isCurrent&&freeEquip<=0;
    equipBtn.textContent=isCurrent?'已装备':freeEquip>0?(eq[w.slot]?'替换装备':'装备'):'本体已被占用';

    const breakBtn=card?.querySelector(`button[data-breakthrough-weapon="${id}"]`);
    if(breakBtn&&Number(r.breakthrough||0)<5){const need=breakthroughNeed(r.breakthrough);breakBtn.disabled=freeMats<need;breakBtn.textContent=`突破 · ${need}本（可用${freeMats}）`;}
    const smeltBtn=card?.querySelector(`button[data-smelt-weapon="${id}"]`);
    if(smeltBtn&&Number(r.smelt||0)<WEAPON_SMELT_MAX){const need=smeltNeed(r.smelt);const ok=s.player.level>=WEAPON_SMELT_OPEN_LEVEL&&Number(r.breakthrough||0)>=5&&freeMats>=need.copies&&Number(s.weapons?.meteorIron||0)>=need.meteorIron;smeltBtn.disabled=!ok;smeltBtn.textContent=`熔铸${Number(r.smelt||0)+1}火 · ${need.copies}本 + ${need.meteorIron}陨铁`;}
  }
}

function patchWeaponPage(){
  if(!patchWeaponHeader())return;
  patchWeaponLibrary();
}

function openWeaponPicker(slot){
  const s=liveState(),heroId=currentHeroId(),eq=ensureHeroWeapons(heroId);if(!s||!heroId||!eq||!WEAPON_TYPES[slot])return;
  const current=eq[slot];
  const cards=Object.values(WEAPONS).filter(w=>w.slot===slot&&weaponRecord(s,w.id).owned).map(w=>{
    const r=weaponRecord(s,w.id),isCurrent=current===w.id,free=freeEquipCopies(w.id),disabled=!isCurrent&&free<=0;
    return `<button class="weapon-choice-card ${disabled?'disabled':''}" type="button" data-pick-weapon="${w.id}" data-target-weapon-slot="${slot}" ${disabled?'disabled':''}>
      <span class="weapon-choice-name">${w.name}</span>
      <span class="weapon-choice-state">强化+${r.level} · 突破${r.breakthrough} · 熔铸${Number(r.smelt||0)}火</span>
      <span class="weapon-choice-effect">${w.effect}</span>
      <span class="weapon-choice-stock">备用${fmt(r.copies)}件 · 已装备${equippedCount(w.id)}件 · 空闲本体${free}</span>
      <span class="weapon-choice-status">${isCurrent?'当前已装备':disabled?'本体均已被其他侠客装备':'点击装备'}</span>
    </button>`;
  }).join('');
  dialogBody.innerHTML=`<div class="weapon-modal-inner"><div class="modal-head"><div><span class="eyebrow">神兵装备</span><h3>${HEROES[heroId].name} · ${WEAPON_TYPES[slot]}</h3></div><button class="btn btn-ghost" data-close-generic>关闭</button></div><div class="notice" style="margin-bottom:8px">同名神兵有多件时可以分别装备给不同侠客；已经装备出去的副本不会被突破/熔铸误当材料消耗。</div><div class="weapon-picker-scroll"><div class="weapon-choice-grid">${cards}</div>${cards?'':'<div class="notice">这个部位目前没有已获得神兵，先去下方神兵锻造获取。</div>'}</div></div>`;
  dialog.classList.remove('kungfu-dialog');dialog.classList.add('weapon-dialog');if(!dialog.open)dialog.showModal();
}

function equipWeaponCopy(heroId,id,slot){
  const s=liveState(),w=WEAPONS[id],eq=ensureHeroWeapons(heroId),r=weaponRecord(s,id);if(!s||!w||!eq||!r.owned||w.slot!==slot)return;
  if(eq[slot]===id){if(dialog?.open)dialog.close();return;}
  if(freeEquipCopies(id)<=0)return alert('这件神兵的本体都已经装备给其他侠客了。');
  eq[slot]=id;persist();if(dialog?.open)dialog.close();refreshWeapons();
}

function breakthroughSafe(id){
  const s=liveState(),r=weaponRecord(s,id),w=WEAPONS[id];if(!s||!w||!r.owned||r.breakthrough>=5)return;
  const need=breakthroughNeed(r.breakthrough),free=freeMaterialCopies(id);if(free<need)return alert(`可用同名神兵不足，需要${need}件；已有装备占用的本体不会被消耗。`);
  r.copies=Number(r.copies||0)-need;r.breakthrough+=1;persist();refreshWeapons();alert(`${w.name}突破至${r.breakthrough}级。`);
}

function smeltSafe(id){
  const s=liveState(),r=weaponRecord(s,id),w=WEAPONS[id];if(!s||!w||!r.owned)return;
  if(Number(s.player?.level||0)<WEAPON_SMELT_OPEN_LEVEL)return alert(`神兵熔铸需要玩家Lv.${WEAPON_SMELT_OPEN_LEVEL}。`);
  if(Number(r.breakthrough||0)<5)return alert('神兵突破5后才能熔铸。');
  const stage=Number(r.smelt||0);if(stage>=WEAPON_SMELT_MAX)return;
  const need=smeltNeed(stage),free=freeMaterialCopies(id),meteor=Number(s.weapons?.meteorIron||0);
  if(free<need.copies)return alert(`可用同名神兵不足，需要${need.copies}件；已有装备占用的本体不会被消耗。`);
  if(meteor<need.meteorIron)return alert(`天外陨铁不足，需要${need.meteorIron}。`);
  r.copies=Number(r.copies||0)-need.copies;s.weapons.meteorIron=meteor-need.meteorIron;r.smelt=stage+1;bumpDaily(s,'weapon');persist();refreshWeapons();alert(`${w.name}熔铸${r.smelt}火成功：${smeltAttrText(s,id)}`);
}

if(page){
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchWeaponPage();});});
  observer.observe(page,{childList:true});
  page.addEventListener('click',event=>{
    const slotBtn=event.target.closest?.('[data-weapon-slot-pick]');if(slotBtn){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openWeaponPicker(slotBtn.dataset.weaponSlotPick);return;}
    const equipBtn=event.target.closest?.('button[data-equip-weapon]');if(equipBtn&&WEAPONS[equipBtn.dataset.equipWeapon]){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const heroId=currentHeroId(),w=WEAPONS[equipBtn.dataset.equipWeapon];equipWeaponCopy(heroId,w.id,w.slot);return;}
    const breakBtn=event.target.closest?.('button[data-breakthrough-weapon]');if(breakBtn&&WEAPONS[breakBtn.dataset.breakthroughWeapon]){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();breakthroughSafe(breakBtn.dataset.breakthroughWeapon);return;}
    const smeltBtn=event.target.closest?.('button[data-smelt-weapon]');if(smeltBtn&&WEAPONS[smeltBtn.dataset.smeltWeapon]){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();smeltSafe(smeltBtn.dataset.smeltWeapon);}
  },true);
}

if(dialog){
  dialog.addEventListener('click',event=>{
    const btn=event.target.closest?.('button[data-pick-weapon]');if(!btn)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    equipWeaponCopy(currentHeroId(),btn.dataset.pickWeapon,btn.dataset.targetWeaponSlot);
  },true);
  dialog.addEventListener('close',()=>dialog.classList.remove('weapon-dialog'));
}

requestAnimationFrame(patchWeaponPage);
