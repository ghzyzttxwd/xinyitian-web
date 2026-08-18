import { HEROES } from './data.js';
import { RED_KUNGFU } from './kungfu.js';
import { saveState, normalizeDaily } from './state.js';

const page=document.querySelector('#page');
const dialog=document.querySelector('#genericDialog');
const resourceBar=document.querySelector('#resourceBar');
const BASE_RED_IDS=new Set(['104001','104201','104301','104401','104501','104601','104701']);
const RARE_RED_IDS=Object.keys(RED_KUNGFU).filter(id=>!BASE_RED_IDS.has(id));
const RARE_FRAGMENT_COST=500;
const RARE_GEM_COST=3000;
const RARE_DAILY_LIMIT=3;
let selectedRareId=RARE_RED_IDS.includes('105501')?'105501':RARE_RED_IDS[0];

function liveState(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function heroIdByName(name){return Object.entries(HEROES).find(([,h])=>h?.name===name)?.[0]||null;}
function heroIdFromText(text){return heroIdByName(String(text||'').split('·')[0].trim());}
function heroIdFromDialog(){return heroIdFromText(dialog?.querySelector('.modal-head h3')?.textContent);}
function heroIdFromPage(){return heroIdFromText(page?.querySelector('.kungfu-main-card .section-title h3')?.textContent);}
function heroEq(heroId){const h=liveState()?.heroes?.[heroId];if(!h)return null;h.kungfu=h.kungfu||{};if(!Array.isArray(h.kungfu.equipped))h.kungfu.equipped=[null,null,null,null,null,null,null,null];while(h.kungfu.equipped.length<8)h.kungfu.equipped.push(null);return h.kungfu.equipped;}
function usedByOtherHero(heroId,id){const s=liveState();return Object.entries(s?.heroes||{}).some(([other,h])=>other!==heroId&&h?.kungfu?.equipped?.includes(id));}
function updateGemBar(){const s=liveState();for(const item of resourceBar?.querySelectorAll('.resource-item')||[]){if(item.querySelector('.resource-label')?.textContent?.trim()==='元宝'){const v=item.querySelector('.resource-value');if(v)v.textContent=fmt(s?.player?.gems||0);break;}}}
function refreshKungfu(){document.querySelector('[data-growth-tab="kungfu"]')?.click();updateGemBar();}

function equipSharedRed(heroId,id,slot){
  const s=liveState(),rec=s?.kungfu?.red?.[id],eq=heroEq(heroId);
  if(!s||!RED_KUNGFU[id]||!eq||Number(rec?.level||0)<=0)return alert('这门功法尚未获得。');
  if(eq.includes(id))return alert('这个侠客已经装备了这门功法。');
  const i=Number(slot);
  if(!Number.isInteger(i)||i<0||i>=8)return alert('功法槽无效。');
  if(eq[i])return alert('这个功法槽已经有功法了。');
  eq[i]=id;
  saveState(s);
  if(dialog?.open)dialog.close();
  refreshKungfu();
}

function patchPicker(){
  if(!dialog)return;
  const heroId=heroIdFromDialog(),eq=heroEq(heroId);
  if(!heroId||!eq)return;
  for(const btn of dialog.querySelectorAll('button[data-pick-kungfu]')){
    const id=btn.dataset.pickKungfu;
    if(!RED_KUNGFU[id])continue;
    const status=btn.querySelector('.kungfu-choice-status');
    if(eq.includes(id)){
      btn.disabled=true;btn.classList.add('disabled');
      if(status)status.textContent='本侠客已装备';
    }else{
      btn.disabled=false;btn.classList.remove('disabled');
      if(status)status.textContent=usedByOtherHero(heroId,id)?'其他侠客已装备 · 仍可装备':'点击装备';
    }
  }
}

function firstOpenSlot(heroId){
  const eq=heroEq(heroId);if(!eq)return -1;
  const openCount=page?.querySelectorAll('.kungfu-slots .kungfu-slot.open').length||0;
  for(let i=0;i<openCount;i++)if(!eq[i])return i;
  return -1;
}

function patchDirectEquipButtons(){
  const heroId=heroIdFromPage(),eq=heroEq(heroId);if(!heroId||!eq)return;
  for(const btn of page.querySelectorAll('button[data-equip-kungfu]')){
    const id=btn.dataset.equipKungfu;if(!RED_KUNGFU[id])continue;
    const own=Number(liveState()?.kungfu?.red?.[id]?.level||0)>0;
    if(!own)continue;
    if(eq.includes(id)){btn.disabled=true;btn.textContent='已装备';}
    else{const slot=firstOpenSlot(heroId);btn.disabled=slot<0;btn.textContent=slot<0?'无空槽':'装备到空槽';}
    const card=btn.closest('.hero-card');
    const metas=card?[...card.querySelectorAll('.hero-meta')]:[];
    const stock=metas.find(x=>/备用本体/.test(x.textContent||''));
    if(stock&&/已装备：/.test(stock.textContent||''))stock.textContent=stock.textContent.replace(/ · 已装备：.*$/,' · 可供多名侠客装备');
  }
}

function ensureRareDaily(s){normalizeDaily(s);s.daily=s.daily||{};s.daily.rareKungfuResearch=Math.max(0,Math.min(RARE_DAILY_LIMIT,Math.floor(Number(s.daily.rareKungfuResearch||0))));return s.daily.rareKungfuResearch;}
function addRareCopy(s,id){const rec=s?.kungfu?.red?.[id];if(!rec)return false;if(Number(rec.level||0)<=0)rec.level=1;else rec.copies=Number(rec.copies||0)+1;return true;}

function rareShopHtml(){
  const s=liveState();if(!s)return '';
  const used=ensureRareDaily(s),left=Math.max(0,RARE_DAILY_LIMIT-used),frag=Number(s.kungfu?.fragments||0),gems=Number(s.player?.gems||0);
  if(!RARE_RED_IDS.includes(selectedRareId))selectedRareId=RARE_RED_IDS[0];
  const options=RARE_RED_IDS.map(id=>`<option value="${id}" ${id===selectedRareId?'selected':''}>${RED_KUNGFU[id]?.name||id}</option>`).join('');
  const rec=s.kungfu?.red?.[selectedRareId]||{level:0,copies:0};
  return `<div class="section-title"><h3>珍品功法推演</h3><small>今日 ${used}/${RARE_DAILY_LIMIT}</small></div>
  <div class="notice">稀有红功法的稳定长期渠道。基础7门仍按200残页兑换；九阳真经、九阴真经、金刚伏魔功、龙爪手、混元一气功等珍品在这里定向推演。VIP礼包原有功法奖励继续保留。</div>
  <div class="list-row"><span>选择珍品</span><select class="growth-select" data-rare-kungfu-select style="max-width:58%">${options}</select></div>
  <div class="list-row"><span>当前库存</span><b>${Number(rec.level||0)>0?`Lv.${rec.level} · 备用${fmt(rec.copies)}本`:'未获得'}</b></div>
  <div class="list-row"><span>本次消耗</span><b>${RARE_FRAGMENT_COST}残页 + ${fmt(RARE_GEM_COST)}元宝</b></div>
  <div class="hero-meta">现有：功法残页 ${fmt(frag)} · 元宝 ${fmt(gems)} · 今日剩余 ${left} 次</div>
  <button class="btn btn-gold btn-block" data-rare-kungfu-buy ${left>0?'':'disabled'} style="margin-top:10px">${left>0?`推演【${RED_KUNGFU[selectedRareId]?.name||''}】×1`:'今日推演已达上限'}</button>`;
}

function patchRareShop(){
  if(!page||page.dataset.page!=='growth'||!page.querySelector('.kungfu-main-card'))return;
  let shop=page.querySelector('#rareKungfuResearchShop');
  const fragmentShop=page.querySelector('#kungfuFragmentShop');
  const drawCard=[...page.querySelectorAll(':scope > section.card')].find(card=>card.querySelector('.section-title h3')?.textContent?.trim()==='藏经阁');
  const anchor=fragmentShop||drawCard;if(!anchor)return;
  if(!shop){shop=document.createElement('section');shop.id='rareKungfuResearchShop';shop.className='card';anchor.insertAdjacentElement('afterend',shop);}
  shop.innerHTML=rareShopHtml();
}

function patchKungfuPage(){patchDirectEquipButtons();patchRareShop();}

function buyRare(){
  const s=liveState();if(!s||!RARE_RED_IDS.includes(selectedRareId))return;
  const used=ensureRareDaily(s);if(used>=RARE_DAILY_LIMIT)return alert('今日珍品功法推演次数已用完。');
  const frag=Number(s.kungfu?.fragments||0);if(frag<RARE_FRAGMENT_COST)return alert(`功法残页不足，需要${RARE_FRAGMENT_COST}张。`);
  const gems=Number(s.player?.gems||0);if(gems<RARE_GEM_COST)return alert(`元宝不足，需要${RARE_GEM_COST}元宝。`);
  s.kungfu.fragments=frag-RARE_FRAGMENT_COST;s.player.gems=gems-RARE_GEM_COST;s.daily.rareKungfuResearch=used+1;
  addRareCopy(s,selectedRareId);saveState(s);
  alert(`珍品推演成功：获得【${RED_KUNGFU[selectedRareId].name}】×1。`);
  refreshKungfu();
}

if(dialog){
  const observer=new MutationObserver(()=>requestAnimationFrame(patchPicker));
  observer.observe(dialog,{childList:true,subtree:true});
  dialog.addEventListener('click',event=>{
    const btn=event.target.closest?.('button[data-pick-kungfu]');if(!btn)return;
    const id=btn.dataset.pickKungfu;if(!RED_KUNGFU[id])return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    equipSharedRed(heroIdFromDialog(),id,Number(btn.dataset.targetSlot));
  },true);
}

if(page){
  const observer=new MutationObserver(()=>requestAnimationFrame(patchKungfuPage));
  observer.observe(page,{childList:true});
  page.addEventListener('click',event=>{
    const direct=event.target.closest?.('button[data-equip-kungfu]');
    if(direct&&RED_KUNGFU[direct.dataset.equipKungfu]){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const heroId=heroIdFromPage(),slot=firstOpenSlot(heroId);if(slot<0)return alert('当前没有已解锁的空功法槽。');
      equipSharedRed(heroId,direct.dataset.equipKungfu,slot);return;
    }
    if(event.target.closest?.('[data-rare-kungfu-buy]')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();buyRare();}
  },true);
  page.addEventListener('change',event=>{
    if(!event.target?.matches?.('[data-rare-kungfu-select]'))return;
    selectedRareId=event.target.value;if(!RARE_RED_IDS.includes(selectedRareId))selectedRareId=RARE_RED_IDS[0];patchRareShop();
  });
}

requestAnimationFrame(()=>{patchKungfuPage();patchPicker();});
