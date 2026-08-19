// V0.24.24: permanent simulated recharge channel for god-grade soul stones.
import { saveState, recalcVip } from './state.js';
import {
  SOUL_RECHARGE_PRICE, SOUL_RECHARGE_GEMS,
  SOUL_RECHARGE_CHOICE_PACKS, SOUL_RECHARGE_LIMIT,
} from './awakening.js';

const page=document.querySelector('#page');
if(!page) throw new Error('page missing');

function state(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function isAwakenPage(){return page.dataset.page==='more'&&page.dataset.more==='awaken';}

function cardHtml(){
  const s=state();if(!s)return '';
  const used=Number(s.awakening?.rechargePackBuys||0),left=Math.max(0,SOUL_RECHARGE_LIMIT-used);
  return `<section class="card featured-card" id="awakeningRechargeV02424">
    <div class="section-title"><h3>神品魂石礼包</h3><small>${used}/${SOUL_RECHARGE_LIMIT}</small></div>
    <div class="notice">任务书要求的模拟充值魂石渠道。单机V1补充值：每次模拟648元，获得${fmt(SOUL_RECHARGE_GEMS)}元宝 + 神品魂石自选箱×${SOUL_RECHARGE_CHOICE_PACKS}。每箱可自选40碎片；一次只提供200碎片，不直接觉醒毕业。</div>
    <div class="list-row" style="margin-top:10px"><div><b>648神品魂石礼包</b><div class="hero-meta">剩余 ${left} 次 · 5次合计正好1000自选碎片</div></div><button class="btn btn-gold" type="button" data-v02424-soul-recharge ${left>0?'':'disabled'}>模拟648元</button></div>
    <div class="hero-meta" style="margin-top:8px">礼包数量与限购为单机V1暂定值，不冒充原版精确礼包配置。</div>
  </section>`;
}

function inject(){
  if(!isAwakenPage())return;
  if(page.querySelector('#awakeningRechargeV02424'))return;
  const sections=[...page.querySelectorAll(':scope > section.card')];
  const soul=sections.find(x=>x.querySelector('h3')?.textContent?.includes('神品魂石商店'));
  if(!soul)return;
  soul.insertAdjacentHTML('afterend',cardHtml());
}

function refreshAwaken(){
  const more=document.querySelector('.bottom-nav [data-page="more"]');
  if(!more)return;
  more.click();
  requestAnimationFrame(()=>{
    const tile=page.querySelector('[data-more-section="awaken"]');
    tile?.click();
  });
}

page.addEventListener('click',e=>{
  const btn=e.target.closest('[data-v02424-soul-recharge]');
  if(!btn)return;
  const s=state();if(!s)return;
  s.awakening=s.awakening||{};
  const used=Number(s.awakening.rechargePackBuys||0);
  if(used>=SOUL_RECHARGE_LIMIT)return alert('神品魂石礼包已达限购。');
  s.awakening.rechargePackBuys=used+1;
  s.player.totalRecharge=Number(s.player.totalRecharge||0)+SOUL_RECHARGE_PRICE;
  s.player.gems=Number(s.player.gems||0)+SOUL_RECHARGE_GEMS;
  s.awakening.choicePacks=Number(s.awakening.choicePacks||0)+SOUL_RECHARGE_CHOICE_PACKS;
  recalcVip(s);saveState(s);
  alert(`神品魂石礼包：元宝 +${fmt(SOUL_RECHARGE_GEMS)}，神品魂石自选箱 +${SOUL_RECHARGE_CHOICE_PACKS}。`);
  refreshAwaken();
});

const observer=new MutationObserver(inject);
observer.observe(page,{childList:true});
requestAnimationFrame(inject);
