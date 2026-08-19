// V0.24.25: close the悟道 UI loop without changing the existing economy.
// Battle remains authoritative in battle.js; this module makes the exact active
// stage, skill and battle effects visible on mobile and fixes stale hero details.
import { HEROES } from './data.js';
import { effectiveHeroProfile } from './awakening.js';
import { storyHeroProfile } from './story.js';
import {
  WUDAO_MAX_STAGE, applyWudaoProfile, wudaoStage, wudaoBonuses,
  wudaoBattleEffects, wudaoStageText, nextWudaoCost,
} from './wudao.js';

const page=document.querySelector('#page');
if(!page) throw new Error('page missing');

function liveState(){return globalThis.__XYT_STATE__||null;}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function profileOf(state,id){
  const base=effectiveHeroProfile(state,id,HEROES[id]);
  return applyWudaoProfile(state,id,storyHeroProfile(state,id,base));
}
function targetText(target){
  return {all:'敌方全体',three:'敌方3人',highestAtk:'敌方攻击最高',one:'敌方单体'}[target]||'敌方单体';
}
function skillText(skill={}){
  const parts=[`${skill.name||'绝技'} · ${targetText(skill.target)} · ${Number(skill.multiplier||1).toFixed(2)}倍`,`${Number(skill.rageCost||4)}怒`];
  if(skill.teamRage)parts.push(`全队回怒+${skill.teamRage}`);
  if(skill.healTeam)parts.push(`全队治疗${Math.round(Number(skill.healTeam)*100)}%系数`);
  if(skill.refundOnKill)parts.push('击杀返还绝技怒气');
  if(skill.repeatChance)parts.push(`追击${Math.round(Number(skill.repeatChance)*100)}%`);
  if(skill.ignoreDef)parts.push(`绝技穿防${Math.round(Number(skill.ignoreDef)*100)}%`);
  return parts.join(' · ');
}
function effectText(e){
  if(!e)return '';
  if(e.kind==='lifesteal')return `吸血${Math.round(Number(e.ratio||0)*100)}%`;
  if(e.kind==='ignoreDef')return `通用穿防${Math.round(Number(e.value||0)*100)}%`;
  if(e.kind==='skillDamage')return `绝技伤害+${Math.round(Number(e.value||0)*100)}%`;
  if(e.kind==='teamStartShield')return `开局全队护盾${Math.round(Number(e.ratio||0)*100)}%气血`;
  if(e.kind==='teamReviveOnce')return `全队一次复起${Math.round(Number(e.ratio||0)*100)}%气血`;
  if(e.kind==='rageFloorAfterSkill')return `绝技后低怒队友补至${Number(e.value||0)}怒`;
  if(e.kind==='reflect')return `反伤${Math.round(Number(e.ratio||0)*100)}%${e.damageReduction?` · 额外减伤${Math.round(Number(e.damageReduction)*100)}%`:''}`;
  if(e.kind==='skillDrainRage')return `绝技压制敌方${Number(e.amount||0)}怒`;
  return e.kind||'';
}
function bonusText(b){
  const parts=[`攻/防/血 +${Number(b.atkPct||0)}%`];
  if(b.crit)parts.push(`暴击 +${b.crit}%`);
  if(b.hit)parts.push(`命中 +${b.hit}%`);
  if(b.dodge)parts.push(`闪避 +${b.dodge}%`);
  if(b.antiCrit)parts.push(`抗暴 +${b.antiCrit}%`);
  if(b.damageBonus)parts.push(`增伤 +${b.damageBonus}%`);
  if(b.damageReduction)parts.push(`减伤 +${b.damageReduction}%`);
  return parts.join(' · ');
}

function patchWudaoPanel(){
  const state=liveState();if(!state||page.dataset.page!=='growth')return;
  const active=page.querySelector('[data-growth-tab="wudao"].btn-gold');
  if(!active)return;
  const heroId=page.querySelector('#growthHeroSelect')?.value;
  if(!heroId||!state.heroes?.[heroId])return;
  const card=[...page.querySelectorAll(':scope > section.card')].find(x=>x.querySelector('h3')?.textContent?.includes('· 悟道'));
  if(!card||card.querySelector('#wudaoClosureV02425'))return;

  const stage=wudaoStage(state,heroId),bonuses=wudaoBonuses(state,heroId),profile=profileOf(state,heroId),effects=wudaoBattleEffects(state,heroId);
  const next=stage<WUDAO_MAX_STAGE?stage+1:0;
  const box=document.createElement('div');
  box.id='wudaoClosureV02425';
  box.innerHTML=`
    <div class="notice" style="margin-top:10px"><b>当前实际生效</b>：${wudaoStageText(heroId,stage)}${stage?`<br>${bonusText(bonuses)}`:''}</div>
    ${stage?`<div class="list-row"><span>当前绝技</span><small>${skillText(profile?.skill)}</small></div>`:''}
    ${effects.length?`<div class="list-row"><span>悟道战斗机制</span><small>${effects.map(effectText).filter(Boolean).join(' · ')}</small></div>`:''}
    ${next?`<div class="list-row"><span>下一阶实际结果</span><small>${wudaoStageText(heroId,next)} · 消耗${fmt(nextWudaoCost(state,heroId))}悟道丹</small></div>`:'<div class="battle-win" style="margin-top:10px">五阶效果已经全部生效</div>'}
    <div class="hero-meta" style="margin-top:8px">悟道丹当前闭环：千宝塔250层节点、古墓200层后高层节点、每日元宝补给、648悟道礼包。具体五阶消耗与机制倍率为单机V1暂定值。</div>`;
  const lastMeta=[...card.querySelectorAll(':scope > .hero-meta')].at(-1);
  if(lastMeta)card.insertBefore(box,lastMeta);else card.appendChild(box);
}

function patchHeroDetail(){
  const state=liveState();if(!state||page.dataset.page!=='heroes')return;
  const detail=[...page.querySelectorAll(':scope > section.card')].find(x=>x.querySelector('.section-title button[data-hero-detail]'));
  if(!detail)return;
  const id=detail.querySelector('.section-title button[data-hero-detail]')?.dataset?.heroDetail;
  if(!id||!HEROES[id])return;
  const profile=profileOf(state,id),stage=wudaoStage(state,id);
  const skillRow=[...detail.querySelectorAll('.list-row')].find(x=>x.querySelector('span')?.textContent?.trim()==='绝技');
  if(skillRow){const small=skillRow.querySelector('small');if(small)small.textContent=skillText(profile?.skill);}
  if(stage>0&&!detail.querySelector('[data-v02425-wudao-row]')){
    const row=document.createElement('div');row.className='list-row';row.dataset.v02425WudaoRow='1';
    row.innerHTML=`<span>悟道</span><small>${wudaoStageText(id,stage)}</small>`;
    skillRow?.insertAdjacentElement('afterend',row);
  }
}

function patch(){patchWudaoPanel();patchHeroDetail();}
const observer=new MutationObserver(patch);
observer.observe(page,{childList:true});
requestAnimationFrame(patch);
