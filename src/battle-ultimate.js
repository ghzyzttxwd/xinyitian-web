const body=document.querySelector('#battleDialogBody');
if(!body) throw new Error('battle body missing');

let boundBanner=null,lastAt=0;
const cleanupTimers=new Set();
const later=(fn,ms)=>{const id=setTimeout(()=>{cleanupTimers.delete(id);fn();},ms);cleanupTimers.add(id);return id;};

function speedLevel(stage){
  const text=stage.querySelector('[data-bv-speed]')?.textContent||'1×';
  const n=Number.parseInt(text,10)||1;
  return Math.max(1,Math.min(5,n));
}
function playbackRate(stage){return speedLevel(stage)/2;}
function fighter(stage,name){try{return stage.querySelector(`.bv-fighter[data-fighter-name="${CSS.escape(name)}"]`);}catch{return null;}}
function center(rect,root){return {x:rect.left-root.left+rect.width/2,y:rect.top-root.top+rect.height/2};}
function removeFx(stage){for(const el of stage.querySelectorAll('.wuji-fx'))el.remove();stage.classList.remove('wuji2d-active');}

function enemyCenter(stage){
  const alive=[...stage.querySelectorAll('.enemy-team .bv-fighter:not(.dead) .bv-portrait')];
  if(!alive.length)return null;
  const rects=alive.map(el=>el.getBoundingClientRect());
  const root=stage.getBoundingClientRect();
  return {
    x:rects.reduce((n,r)=>n+r.left+r.width/2,0)/rects.length-root.left,
    y:rects.reduce((n,r)=>n+r.top+r.height/2,0)/rects.length-root.top,
    portraits:alive,
  };
}

function animateWuji(stage){
  const card=fighter(stage,'张无忌');
  const portrait=card?.querySelector('.bv-portrait');
  const target=enemyCenter(stage);
  if(!portrait||!target)return;

  const now=Date.now();if(now-lastAt<80)return;lastAt=now;
  removeFx(stage);
  stage.classList.add('wuji2d-active');

  const rate=playbackRate(stage),root=stage.getBoundingClientRect();
  const p=center(portrait.getBoundingClientRect(),root);
  const dx=target.x-p.x,dy=target.y-p.y;
  const ms=n=>n/rate;

  // 张无忌本人不离开战场：放大、前压、蓄力后回位。
  portrait.animate([
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'},
    {offset:.22,transform:'translate3d(8px,-5px,0) scale(1.28)',filter:'brightness(1.25) drop-shadow(0 0 8px rgba(165,226,255,.72))'},
    {offset:.52,transform:'translate3d(18px,-7px,0) scale(1.62)',filter:'brightness(1.55) drop-shadow(0 0 18px rgba(118,208,255,.95))'},
    {offset:.72,transform:'translate3d(12px,-4px,0) scale(1.34)',filter:'brightness(1.2)'},
    {transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1)'}
  ],{duration:ms(720),easing:'cubic-bezier(.18,.78,.2,1)'});

  const rootFx=document.createElement('div');
  rootFx.className='wuji-fx wuji-root';
  rootFx.style.left=`${p.x}px`;rootFx.style.top=`${p.y}px`;
  rootFx.innerHTML='<i class="wuji-taiji"></i><i class="wuji-aura a1"></i><i class="wuji-aura a2"></i>';
  stage.appendChild(rootFx);
  const taiji=rootFx.querySelector('.wuji-taiji');
  const auras=rootFx.querySelectorAll('.wuji-aura');
  if(taiji)taiji.style.animationDuration=`${ms(680)}ms`;
  auras.forEach((el,i)=>{el.style.animationDuration=`${ms(580)}ms`;el.style.animationDelay=`${ms(i?80:0)}ms`;});

  // 三道气劲从张无忌当前位置真正横穿至敌阵。
  [0,-18,18].forEach((offset,i)=>{
    const beam=document.createElement('i');
    beam.className=`wuji-fx wuji-beam b${i+1}`;
    beam.style.left=`${p.x}px`;beam.style.top=`${p.y+offset}px`;
    beam.style.setProperty('--dx',`${dx}px`);beam.style.setProperty('--dy',`${dy-offset}px`);
    beam.style.setProperty('--delay',`${ms(95+i*42)}ms`);
    beam.style.setProperty('--dur',`${ms(300+i*25)}ms`);
    stage.appendChild(beam);
  });

  const wave=document.createElement('i');
  wave.className='wuji-fx wuji-wavefront';
  wave.style.left=`${p.x}px`;wave.style.top=`${p.y}px`;
  wave.style.setProperty('--dx',`${dx}px`);wave.style.setProperty('--dy',`${dy}px`);
  wave.style.setProperty('--dur',`${ms(360)}ms`);
  wave.style.animationDelay=`${ms(80)}ms`;
  stage.appendChild(wave);

  // 命中时敌阵整体震退，不再只是每张卡片自己闪一下。
  later(()=>{
    const burst=document.createElement('div');
    burst.className='wuji-fx wuji-impact-field';
    burst.style.left=`${target.x}px`;burst.style.top=`${target.y}px`;
    burst.style.animationDuration=`${ms(380)}ms`;
    stage.appendChild(burst);
    for(const [i,el] of target.portraits.entries()){
      el.animate([
        {transform:'translate3d(0,0,0)',filter:'brightness(1)'},
        {offset:.18,transform:`translate3d(${10+i%2*4}px,-2px,0)`,filter:'brightness(2)'},
        {offset:.52,transform:'translate3d(-5px,1px,0)',filter:'brightness(1.3)'},
        {transform:'translate3d(0,0,0)',filter:'brightness(1)'}
      ],{duration:ms(300),easing:'ease-out'});
    }
    stage.animate([
      {transform:'translate3d(0,0,0)'},
      {transform:'translate3d(-5px,1px,0)'},
      {transform:'translate3d(6px,-1px,0)'},
      {transform:'translate3d(0,0,0)'}
    ],{duration:ms(210),easing:'ease-out'});
  },ms(240));

  later(()=>removeFx(stage),ms(760));
}

function bindBanner(){
  const stage=body.querySelector('.battle-visual-stage');
  const banner=stage?.querySelector('[data-bv-skill]');
  if(!stage||!banner||banner===boundBanner)return;
  boundBanner=banner;
  const trigger=()=>{
    if(!banner.classList.contains('show'))return;
    const text=(banner.textContent||'').trim();
    const [actor]=text.split(' · ');
    if(actor?.trim()==='张无忌')animateWuji(stage);
  };
  const observer=new MutationObserver(trigger);
  observer.observe(banner,{attributes:true,attributeFilter:['class'],childList:true,characterData:true,subtree:true});
  trigger();
}

const rootObserver=new MutationObserver(()=>requestAnimationFrame(bindBanner));
rootObserver.observe(body,{childList:true,subtree:true});
requestAnimationFrame(bindBanner);