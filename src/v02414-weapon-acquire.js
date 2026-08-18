import { FORGE_THEMES, WEAPONS, WEAPON_FORGE_COST, rollForge, weaponRecord } from './weapons.js';
import { saveState } from './state.js';

const page=document.querySelector('#page');
const saveStatus=document.querySelector('#saveStatus');
const PACK_IRON=100;
const PACK_GEMS=100;
const FORGE_PROGRESS_NEED=100;
const FORGE_PROGRESS_BASE=10;

function state(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function isWeaponPage(){return page?.dataset.page==='growth'&&!!page.querySelector('.weapon-system-root');}
function forgeCard(){return [...(page?.querySelectorAll('section.card')||[])].find(card=>{const t=card.querySelector('.section-title h3')?.textContent?.trim()||'';return t==='神兵锻造'||t==='神兵获取 · 常驻锻造';})||null;}
function persist(){const s=state();if(!s)return;saveState(s);if(saveStatus)saveStatus.textContent='已保存';}
function refreshAll(){document.querySelector('.nav-item[data-page="growth"]')?.click();}

function currentTheme(){
  const s=state();
  const idx=Math.max(0,Math.min(FORGE_THEMES.length-1,Number(s?.weapons?.theme||0)));
  return {idx,theme:FORGE_THEMES[idx]};
}
function ensureProgress(s,idx){
  s.weapons=s.weapons||{};
  s.weapons.forgeProgress=s.weapons.forgeProgress&&typeof s.weapons.forgeProgress==='object'?s.weapons.forgeProgress:{};
  const key=String(idx);
  s.weapons.forgeProgress[key]=Math.max(0,Math.floor(Number(s.weapons.forgeProgress[key]||0)));
  return key;
}
function rollProgress(){
  const r=Math.random();
  if(r<.03)return {gain:FORGE_PROGRESS_BASE*3,multi:3};
  if(r<.20)return {gain:FORGE_PROGRESS_BASE*2,multi:2};
  return {gain:FORGE_PROGRESS_BASE,multi:1};
}
function grantWeapon(s,id){
  const r=weaponRecord(s,id),w=WEAPONS[id];
  if(!r||!w)return null;
  if(!r.owned){r.owned=true;r.level=1;r.copies=Math.max(0,Number(r.copies||0));}
  else r.copies=Math.max(0,Number(r.copies||0))+1;
  return w.name;
}

function acquisitionHtml(){
  const s=state();if(!s)return '';
  const {idx,theme}=currentTheme(),key=ensureProgress(s,idx);
  const progress=Math.min(FORGE_PROGRESS_NEED-1,Number(s.weapons.forgeProgress[key]||0));
  const iron=Math.max(0,Number(s.weapons?.iron||0));
  const gems=Math.max(0,Number(s.player?.gems||0));
  const owned=Object.values(s.weapons?.items||{}).filter(x=>x?.owned).length;
  return `<div class="weapon-acquire-box" style="margin-top:10px">
    <div class="notice">原版神兵锻造走“精铁 → 锻造进度/暴击 → 出神兵”，不是点1次直接送1件。现在每次消耗${WEAPON_FORGE_COST}精铁，基础增加${FORGE_PROGRESS_BASE}进度，并有2倍/3倍暴击；进度满${FORGE_PROGRESS_NEED}才结算1件神兵。当前主题重点为【${WEAPONS[theme.featured]?.name||''}】，同时保留副产出与其他神兵。</div>
    <div class="grid-3" style="margin-top:9px">
      <div class="mini-stat"><div class="muted">锻造进度</div><b>${progress}/${FORGE_PROGRESS_NEED}</b></div>
      <div class="mini-stat"><div class="muted">精铁</div><b>${fmt(iron)}</b></div>
      <div class="mini-stat"><div class="muted">已收集</div><b>${owned}/${Object.keys(WEAPONS).length}</b></div>
    </div>
    <div class="action-row" style="margin-top:9px">
      <button class="btn btn-primary" type="button" data-smart-weapon-forge="1">锻造1次</button>
      <button class="btn btn-gold" type="button" data-smart-weapon-forge="5">连续锻造5次</button>
    </div>
    <div class="hero-meta" style="margin-top:7px">精铁不足时仍按当前单机补给价自动补足：${PACK_GEMS}元宝 = ${PACK_IRON}精铁。这里的进度与暴击数值属于单机平衡值，不冒充原版精确概率。</div>
  </div>`;
}

function patchForgeCard(){
  if(!isWeaponPage())return;
  const card=forgeCard();if(!card)return;
  card.classList.add('weapon-acquire-card');
  const title=card.querySelector('.section-title h3');if(title)title.textContent='神兵获取 · 常驻锻造';
  const small=card.querySelector('.section-title small');if(small)small.textContent='进度 / 暴击';
  let box=card.querySelector('.weapon-acquire-box');
  if(!box){
    card.querySelector('.section-title')?.insertAdjacentHTML('afterend',acquisitionHtml());
  }else{
    const wrap=document.createElement('div');wrap.innerHTML=acquisitionHtml();box.replaceWith(wrap.firstElementChild);
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
  const short=Math.max(0,totalIron-iron),packs=Math.ceil(short/PACK_IRON),gemCost=packs*PACK_GEMS;
  const gems=Math.max(0,Number(s.player?.gems||0));
  if(gems<gemCost)return alert(`精铁不足，自动补足还需要${gemCost}元宝；当前元宝${fmt(gems)}。`);
  if(packs>0){s.player.gems=gems-gemCost;iron+=packs*PACK_IRON;}
  s.weapons.iron=iron-totalIron;

  const {idx}=currentTheme(),key=ensureProgress(s,idx);
  let progress=Number(s.weapons.forgeProgress[key]||0),totalGain=0,doubleCount=0,tripleCount=0;
  const gained=[];
  for(let i=0;i<n;i++){
    const roll=rollProgress();totalGain+=roll.gain;if(roll.multi===2)doubleCount++;if(roll.multi===3)tripleCount++;
    progress+=roll.gain;s.weapons.forgeCount=Math.max(0,Number(s.weapons.forgeCount||0))+1;
    while(progress>=FORGE_PROGRESS_NEED){
      progress-=FORGE_PROGRESS_NEED;
      const id=rollForge(idx),name=grantWeapon(s,id);if(name)gained.push(name);
    }
  }
  s.weapons.forgeProgress[key]=progress;
  persist();
  const bought=packs>0?`；自动补精铁消耗${gemCost}元宝`:'';
  const crit=[doubleCount?`2倍暴击×${doubleCount}`:'',tripleCount?`3倍暴击×${tripleCount}`:''].filter(Boolean).join('、');
  const result=gained.length?`获得 ${gained.map(x=>`【${x}】`).join('、')}`:`本轮未满进度，当前 ${progress}/${FORGE_PROGRESS_NEED}`;
  alert(`锻造${n}次：进度 +${totalGain}${crit?`（${crit}）`:''}${bought}；${result}。`);
  refreshAll();
}

if(page){
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchForgeCard();});});
  observer.observe(page,{childList:true});
  page.addEventListener('click',event=>{
    const btn=event.target.closest?.('[data-smart-weapon-forge]');if(!btn)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();forgeMany(btn.dataset.smartWeaponForge);
  },true);
}

requestAnimationFrame(patchForgeCard);
