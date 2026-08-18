import { FORGE_THEMES, WEAPONS, WEAPON_FORGE_COST, rollForge, weaponRecord } from './weapons.js';
import { saveState } from './state.js';

const page=document.querySelector('#page');
const saveStatus=document.querySelector('#saveStatus');
const PACK_IRON=100;
const PACK_GEMS=100;

function state(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function isWeaponPage(){return page?.dataset.page==='growth'&&!!page.querySelector('.weapon-system-root');}
function forgeCard(){return [...(page?.querySelectorAll('section.card')||[])].find(card=>card.querySelector('.section-title h3')?.textContent?.trim()==='神兵锻造')||null;}
function persist(){const s=state();if(!s)return;saveState(s);if(saveStatus)saveStatus.textContent='已保存';}
function refreshAll(){document.querySelector('.nav-item[data-page="growth"]')?.click();}

function currentTheme(){
  const s=state();
  const idx=Math.max(0,Math.min(FORGE_THEMES.length-1,Number(s?.weapons?.theme||0)));
  return {idx,theme:FORGE_THEMES[idx]};
}

function acquisitionHtml(){
  const s=state();if(!s)return '';
  const {theme}=currentTheme();
  const iron=Math.max(0,Number(s.weapons?.iron||0));
  const gems=Math.max(0,Number(s.player?.gems||0));
  const owned=Object.values(s.weapons?.items||{}).filter(x=>x?.owned).length;
  return `<div class="weapon-acquire-box" style="margin-top:10px">
    <div class="notice">获取神兵：消耗${WEAPON_FORGE_COST}精铁锻造1次。精铁不足时，可按当前单机补给价 <b>${PACK_GEMS}元宝 = ${PACK_IRON}精铁</b> 自动补足。当前主题重点产出【${WEAPONS[theme.featured]?.name||''}】，并可获得【${WEAPONS[theme.secondary]?.name||''}】等神兵。</div>
    <div class="grid-3" style="margin-top:9px">
      <div class="mini-stat"><div class="muted">已收集</div><b>${owned}/${Object.keys(WEAPONS).length}</b></div>
      <div class="mini-stat"><div class="muted">精铁</div><b>${fmt(iron)}</b></div>
      <div class="mini-stat"><div class="muted">元宝</div><b>${fmt(gems)}</b></div>
    </div>
    <div class="action-row" style="margin-top:9px">
      <button class="btn btn-primary" type="button" data-smart-weapon-forge="1">一键锻造1次</button>
      <button class="btn btn-gold" type="button" data-smart-weapon-forge="5">一键锻造5次</button>
    </div>
    <div class="hero-meta" style="margin-top:7px">优先消耗现有精铁；不足部分才自动购买精铁。锻造获得神兵后，可直接在上方四个神兵槽里选择装备。</div>
  </div>`;
}

function patchForgeCard(){
  if(!isWeaponPage())return;
  const card=forgeCard();if(!card)return;
  card.classList.add('weapon-acquire-card');
  const title=card.querySelector('.section-title h3');if(title)title.textContent='神兵获取 · 常驻锻造';
  const small=card.querySelector('.section-title small');if(small)small.textContent='精铁锻造';
  let box=card.querySelector('.weapon-acquire-box');
  if(!box){
    const titleRow=card.querySelector('.section-title');
    titleRow?.insertAdjacentHTML('afterend',acquisitionHtml());
  }else{
    const wrap=document.createElement('div');wrap.innerHTML=acquisitionHtml();
    box.replaceWith(wrap.firstElementChild);
  }
  const oldActions=[...card.querySelectorAll('.action-row')].find(row=>row.querySelector('[data-action="buyWeaponIron"], [data-action="forgeWeapon"]'));
  if(oldActions){
    oldActions.querySelector('[data-action="forgeWeapon"]')?.remove();
    const ironBtn=oldActions.querySelector('[data-action="buyWeaponIron"]');
    if(ironBtn)ironBtn.textContent='单买100精铁 · 100元宝';
  }
}

function forgeMany(times){
  const s=state();if(!s)return;
  const n=Number(times)===5?5:1;
  s.weapons=s.weapons||{};s.weapons.items=s.weapons.items||{};
  const totalIron=WEAPON_FORGE_COST*n;
  let iron=Math.max(0,Number(s.weapons.iron||0));
  const short=Math.max(0,totalIron-iron);
  const packs=Math.ceil(short/PACK_IRON);
  const gemCost=packs*PACK_GEMS;
  const gems=Math.max(0,Number(s.player?.gems||0));
  if(gems<gemCost)return alert(`精铁不足，自动补足还需要${gemCost}元宝；当前元宝${fmt(gems)}。`);

  if(packs>0){
    s.player.gems=gems-gemCost;
    iron+=packs*PACK_IRON;
  }
  s.weapons.iron=iron-totalIron;

  const {idx}=currentTheme();
  const gained=[];
  for(let i=0;i<n;i++){
    const id=rollForge(idx),r=weaponRecord(s,id),w=WEAPONS[id];
    if(!r||!w)continue;
    if(!r.owned){r.owned=true;r.level=1;r.copies=Math.max(0,Number(r.copies||0));}
    else r.copies=Math.max(0,Number(r.copies||0))+1;
    s.weapons.forgeCount=Math.max(0,Number(s.weapons.forgeCount||0))+1;
    gained.push(w.name);
  }
  persist();
  const bought=packs>0?`（自动补充精铁，消耗${gemCost}元宝）`:'';
  alert(`神兵锻造完成${bought}：${gained.map(x=>`【${x}】`).join('、')||'未获得神兵'}。`);
  refreshAll();
}

if(page){
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;patchForgeCard();});
  });
  observer.observe(page,{childList:true});
  page.addEventListener('click',event=>{
    const btn=event.target.closest?.('[data-smart-weapon-forge]');if(!btn)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    forgeMany(btn.dataset.smartWeaponForge);
  },true);
}

requestAnimationFrame(patchForgeCard);
