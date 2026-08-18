const pageEl = document.querySelector('#page');
const bottomMore = document.querySelector('.bottom-nav [data-page="more"]');
const SAVE_KEY = 'xinyitian_single_v1';
let activePanel=null;

function readSave(){
  try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{return {};}
}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}

function removeLegacyHomeEntries(){
  if(pageEl.dataset.page!=='home')return;
  for(const card of pageEl.querySelectorAll(':scope > section.card')){
    if(card.querySelector('h3')?.textContent.trim()==='主线')card.remove();
  }
  for(const block of pageEl.querySelectorAll(':scope > section.grid-2')){
    const text=block.textContent||'';
    if(text.includes('少林千宝塔')&&text.includes('模拟充值'))block.remove();
  }
}

function simplifyChallenge(){
  if(pageEl.dataset.page!=='challenge')return;
  for(const card of pageEl.querySelectorAll(':scope > section.card')){
    if(card.querySelector('h3')?.textContent.trim()==='少林千宝塔')card.remove();
  }
  const heading=pageEl.querySelector(':scope > .section-title');
  const h2=heading?.querySelector('h2'), small=heading?.querySelector('small');
  if(h2&&h2.textContent!=='古墓奇遇')h2.textContent='古墓奇遇';
  if(small&&small.textContent!=='内力资源挑战')small.textContent='内力资源挑战';
}

function hubTile(kind,seal,title,sub){
  const btn=document.createElement('button');
  btn.className='hub-tile jh-primary-tile';
  btn.type='button';
  btn.dataset.jhPanel=kind;
  btn.innerHTML=`<span class="hub-seal">${seal}</span><span class="hub-title">${title}</span><span class="hub-sub">${sub}</span><span class="hub-arrow">›</span>`;
  return btn;
}

function enhanceJianghuHub(){
  if(pageEl.dataset.page!=='more'||pageEl.dataset.more!=='hub')return;
  const grid=pageEl.querySelector('.hub-grid');
  if(!grid)return;
  let main=grid.querySelector('[data-more-section="mainline"]')||grid.querySelector('[data-jh-panel="mainline"]');
  let tower=grid.querySelector('[data-more-section="tower"]')||grid.querySelector('[data-jh-panel="tower"]');
  if(!main){main=hubTile('mainline','主','主线','挑战当前幕 / 连续速战');grid.insertBefore(main,grid.firstChild);}
  if(!tower){tower=hubTile('tower','塔','少林千宝塔','永久爬塔 / 经脉资源');grid.insertBefore(tower,main.nextSibling);}
  const vip=grid.querySelector('[data-more-section="vip"]');
  if(grid.firstElementChild!==main)grid.insertBefore(main,grid.firstElementChild);
  if(main.nextElementSibling!==tower)grid.insertBefore(tower,main.nextElementSibling);
  if(vip&&tower.nextElementSibling!==vip)grid.insertBefore(vip,tower.nextElementSibling);
}

function subHead(title,sub){
  return `<div class="subpage-head"><button class="back-link" type="button" data-jh-back>‹ 江湖</button><div><span class="eyebrow">江湖</span><h2>${title}</h2><small>${sub}</small></div></div>`;
}

function subpageShell(inner){return `<div class="jh-subpage-backdrop" data-jh-backdrop><div class="jh-subpage-panel">${inner}</div></div>`;}

function renderMainlinePanel(){
  const s=readSave(),p=s.player||{},chapter=Number(p.chapter||1),stamina=Number(p.stamina||0);
  pageEl.dataset.more='mainline-panel';
  pageEl.innerHTML=subpageShell(`${subHead('主线','剧情推进 / 连续速战')}<section class="card featured-card jh-action-card"><div class="section-title"><h3>第${chapter}幕</h3><small>体力 ${fmt(stamina)}</small></div><div class="notice">首次挑战不消耗体力；连续速战5次共消耗25体力。</div><div class="action-row jh-big-actions"><button class="btn btn-primary" data-action="chapter">挑战第${chapter}幕</button><button class="btn btn-gold" data-action="quick" ${stamina<25?'disabled':''}>速战5次 · 25体力</button></div></section>`);
}

function renderTowerPanel(){
  const s=readSave(),highest=Number(s.tower?.highest||0),next=highest+1;
  pageEl.dataset.more='tower-panel';
  pageEl.innerHTML=subpageShell(`${subHead('少林千宝塔','永久爬塔 / 经脉资源')}<section class="card featured-card jh-action-card"><span class="tag">永久爬塔</span><div class="section-title" style="margin-top:8px"><h3>已通关 ${fmt(highest)} 层</h3><small>下一层 ${fmt(next)}</small></div><div class="notice">按当前千宝塔规则结算经脉丹、突破丹及高层节点奖励。</div><button class="btn btn-primary btn-block jh-big-button" data-action="tower">挑战第${fmt(next)}层</button></section>`);
}

function leaveSubpage(){
  if(!activePanel)return;
  activePanel=null;
  bottomMore?.click();
}

function applyNavigationCleanup(){
  removeLegacyHomeEntries();
  simplifyChallenge();
  if(pageEl.dataset.page==='more'&&pageEl.dataset.more==='hub'&&activePanel==='mainline'){renderMainlinePanel();return;}
  if(pageEl.dataset.page==='more'&&pageEl.dataset.more==='hub'&&activePanel==='tower'){renderTowerPanel();return;}
  enhanceJianghuHub();
}

pageEl.addEventListener('click',e=>{
  if(e.target.closest('[data-jh-backdrop]')&&!e.target.closest('.jh-subpage-panel')){leaveSubpage();return;}
  const btn=e.target.closest('button');
  if(!btn)return;
  if(btn.dataset.jhPanel==='mainline'){activePanel='mainline';renderMainlinePanel();return;}
  if(btn.dataset.jhPanel==='tower'){activePanel='tower';renderTowerPanel();return;}
  if(btn.dataset.jhBack!==undefined){leaveSubpage();}
});

document.addEventListener('click',e=>{
  if(!activePanel)return;
  if(e.target.closest('.jh-subpage-panel'))return;
  if(e.target.closest('.bottom-nav'))return;
  if(e.target.closest('[data-jh-backdrop]'))return;
  if(e.target.closest('.topbar')||e.target.closest('.resource-bar'))leaveSubpage();
},true);

document.querySelector('.bottom-nav')?.addEventListener('click',e=>{
  const btn=e.target.closest('[data-page]');
  if(btn)activePanel=null;
},true);

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;applyNavigationCleanup();});
});
observer.observe(pageEl,{childList:true,subtree:true});
applyNavigationCleanup();
