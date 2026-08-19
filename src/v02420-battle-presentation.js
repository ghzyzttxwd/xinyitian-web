import { HEROES } from './data.js';
import { storyStageInfo } from './story.js';

const body=document.querySelector('#battleDialogBody');
if(!body) throw new Error('battle body missing');

let lastBanner=null;
let lastBannerText='';
const stageState=new WeakMap();

function liveState(){return globalThis.__XYT_STATE__||null;}

function syncWujiProfile(){
  const s=liveState();
  if(!s||!HEROES?.wuji)return;
  const stage=storyStageInfo(s,'wuji');
  if(!stage?.skill)return;
  HEROES.wuji.role=stage.role||HEROES.wuji.role;
  HEROES.wuji.skill={...(HEROES.wuji.skill||{}),...stage.skill};
}

function fighterHpWidth(fighter){
  return fighter.querySelector('.bv-hp i')?.style.width||'100%';
}

function snapshotStage(stage){
  let state=stageState.get(stage);
  if(!state){
    state={snap:new Map(),timer:null,massAnimating:false};
    stageState.set(stage,state);
  }
  const snap=state.snap;
  for(const f of stage.querySelectorAll('.bv-fighter')){
    snap.set(f,{
      dead:f.classList.contains('dead'),
      hp:fighterHpWidth(f),
    });
  }
  return state;
}

function animateWujiTechnique(stage,banner){
  if(!banner.classList.contains('show'))return;
  const text=(banner.textContent||'').trim();
  if(!text.startsWith('张无忌 · '))return;
  if(text===lastBannerText&&banner===lastBanner)return;
  lastBanner=banner;
  lastBannerText=text;

  const skill=text.split(' · ').slice(1).join(' · ');
  if(skill==='武当长拳')return;

  const portrait=stage.querySelector('.bv-fighter[data-fighter-id="wuji"] .bv-portrait');
  if(!portrait?.animate)return;

  const speedText=stage.querySelector('[data-bv-speed]')?.textContent||'1×';
  const speed=Math.max(1,Math.min(5,Number.parseInt(speedText,10)||1));
  const rate=speed/2;
  const duration=680/Math.max(.5,rate);

  portrait.animate([
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},
    {offset:.22,transform:'translate3d(-5px,2px,0) scale(.97)',filter:'brightness(1.08)'},
    {offset:.52,transform:'translate3d(14px,-3px,0) scale(1.12)',filter:'brightness(1.45) drop-shadow(0 0 10px rgba(255,220,134,.82))'},
    {offset:.72,transform:'translate3d(8px,-1px,0) scale(1.06)',filter:'brightness(1.18)'},
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'}
  ],{duration,easing:'cubic-bezier(.2,.78,.2,1)'});

  const pulse=document.createElement('span');
  pulse.className='wuji-v02420-pulse';
  Object.assign(pulse.style,{
    position:'absolute',left:'50%',top:'50%',width:'28px',height:'28px',
    border:'2px solid rgba(255,224,150,.85)',borderRadius:'50%',
    transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:'90',
    boxShadow:'0 0 14px rgba(255,195,84,.7)'
  });
  portrait.appendChild(pulse);
  pulse.animate([
    {opacity:.95,transform:'translate(-50%,-50%) scale(.45)'},
    {opacity:.65,offset:.35},
    {opacity:0,transform:'translate(-50%,-50%) scale(2.5)'}
  ],{duration:duration*.85,easing:'ease-out'});
  setTimeout(()=>pulse.remove(),duration);
}

function smoothMassClear(stage){
  const state=stageState.get(stage)||snapshotStage(stage);
  if(state.massAnimating)return;

  const enemies=[...stage.querySelectorAll('.enemy-team .bv-fighter')];
  const mass=enemies.filter(f=>{
    const before=state.snap.get(f);
    return before&&!before.dead&&f.classList.contains('dead');
  });
  if(mass.length<2)return;

  state.massAnimating=true;
  const roundEl=stage.querySelector('[data-bv-round]');
  const finalBox=stage.parentElement?.querySelector('.bv-final');
  if(finalBox)finalBox.hidden=true;
  if(roundEl)roundEl.textContent='最后一击';

  mass.forEach((f,i)=>{
    const before=state.snap.get(f);
    const hp=f.querySelector('.bv-hp i');
    const portrait=f.querySelector('.bv-portrait');
    f.classList.remove('dead');
    if(hp)hp.style.width=before?.hp||'35%';

    const delay=i*45;
    setTimeout(()=>{
      const fx=document.createElement('span');
      fx.className='bv-impact burst';
      portrait?.appendChild(fx);
      setTimeout(()=>fx.remove(),420);
      portrait?.animate?.([
        {transform:'translate3d(0,0,0)',filter:'brightness(1)'},
        {offset:.28,transform:'translate3d(9px,-1px,0)',filter:'brightness(1.9)'},
        {transform:'translate3d(-3px,1px,0)',filter:'brightness(.9)'}
      ],{duration:260,easing:'ease-out'});
      if(hp)hp.style.width='0%';
      setTimeout(()=>f.classList.add('dead'),130);
    },delay);
  });

  const total=360+mass.length*45;
  setTimeout(()=>{
    if(roundEl)roundEl.textContent='战斗胜利';
    if(finalBox)finalBox.hidden=false;
    state.massAnimating=false;
    snapshotStage(stage);
  },total);
}

function bindStage(stage){
  if(!stage||stage.dataset.v02420Bound==='1')return;
  stage.dataset.v02420Bound='1';
  const state=snapshotStage(stage);
  state.timer=setInterval(()=>snapshotStage(stage),45);

  const banner=stage.querySelector('[data-bv-skill]');
  if(banner){
    const bannerObserver=new MutationObserver(()=>animateWujiTechnique(stage,banner));
    bannerObserver.observe(banner,{attributes:true,attributeFilter:['class'],childList:true,characterData:true,subtree:true});
  }

  const roundEl=stage.querySelector('[data-bv-round]');
  if(roundEl){
    const roundObserver=new MutationObserver(()=>{
      if((roundEl.textContent||'').trim()==='战斗胜利')smoothMassClear(stage);
    });
    roundObserver.observe(roundEl,{childList:true,characterData:true,subtree:true});
  }
}

syncWujiProfile();
setInterval(syncWujiProfile,180);

const rootObserver=new MutationObserver(()=>{
  syncWujiProfile();
  const stage=body.querySelector('.battle-visual-stage');
  if(stage)bindStage(stage);
});
rootObserver.observe(body,{childList:true,subtree:true});
requestAnimationFrame(()=>{
  const stage=body.querySelector('.battle-visual-stage');
  if(stage)bindStage(stage);
});
