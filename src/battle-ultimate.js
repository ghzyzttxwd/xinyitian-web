const body=document.querySelector('#battleDialogBody');
if(!body) throw new Error('battle body missing');

const CUTIN_IMAGES={
  '少侠':'./assets/original/figure-player.webp',
  '张无忌':'./assets/original/figure-wuji.webp',
  '张三丰':'./assets/original/figure-zhangsanfeng.webp',
};
const TAO_SKILLS=/太极|武当|乾坤|无极|真武/;
const FIRE_SKILLS=/圣火|轻罗|九阳|阳|火/;
let boundBanner=null,lastKey='',lastAt=0;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function modeFor(actor,skill){if(TAO_SKILLS.test(skill)||actor==='张三丰'||actor==='张无忌')return 'taiji';if(FIRE_SKILLS.test(skill)||actor==='小昭')return 'flame';return 'sword';}
function fighterFor(stage,name){try{return stage.querySelector(`.bv-fighter[data-fighter-name="${CSS.escape(name)}"]`);}catch{return null;}}
function portraitBackground(fighter){const p=fighter?.querySelector('.bv-portrait');if(!p)return '';const cs=getComputedStyle(p);return cs.backgroundImage&&cs.backgroundImage!=='none'?cs.backgroundImage:'';}
function battleSpeed(stage){return stage.querySelector('[data-bv-speed]')?.textContent?.includes('2')?2:1;}

function playCutin(stage,actor,skill){
  const fighter=fighterFor(stage,actor);
  if(!fighter||!fighter.classList.contains('player'))return;
  const now=Date.now(),key=`${actor}|${skill}`;if(key===lastKey&&now-lastAt<360)return;lastKey=key;lastAt=now;
  stage.querySelector('.bu-overlay')?.remove();

  const mode=modeFor(actor,skill),src=CUTIN_IMAGES[actor]||'';
  const bg=portraitBackground(fighter),safeBg=(bg||'linear-gradient(160deg,#72552b,#22160f)').replaceAll('"',"'");
  const art=src
    ? `<img class="bu-figure" src="${src}" alt="">`
    : `<div class="bu-figure bu-figure-bg" style="background-image:${safeBg}"><span>${esc(actor.slice(0,1))}</span></div>`;
  const overlay=document.createElement('div');
  overlay.className=`bu-overlay bu-${mode}`;
  overlay.innerHTML=`
    <div class="bu-dark"></div>
    <div class="bu-backglow"></div>
    <div class="bu-art">${art}</div>
    <div class="bu-copy"><b>${esc(actor)}</b><strong>${esc(skill)}</strong></div>
    <div class="bu-qi bu-qi-1"></div><div class="bu-qi bu-qi-2"></div><div class="bu-qi bu-qi-3"></div>
    <div class="bu-ring bu-ring-1"></div><div class="bu-ring bu-ring-2"></div>
    <div class="bu-flash"></div>`;
  stage.appendChild(overlay);
  const speed=battleSpeed(stage);
  overlay.style.setProperty('--bu-speed',String(speed));
  setTimeout(()=>overlay.classList.add('leave'),560/speed);
  setTimeout(()=>overlay.remove(),820/speed);
}

function bindBanner(){
  const stage=body.querySelector('.battle-visual-stage');
  const banner=stage?.querySelector('[data-bv-skill]');
  if(!stage||!banner||banner===boundBanner)return;
  boundBanner=banner;
  const trigger=()=>{
    if(!banner.classList.contains('show'))return;
    const text=(banner.textContent||'').trim();if(!text)return;
    const parts=text.split(' · '),actor=(parts.shift()||'').trim(),skill=parts.join(' · ').trim();
    if(actor&&skill)playCutin(stage,actor,skill);
  };
  const observer=new MutationObserver(trigger);
  observer.observe(banner,{attributes:true,attributeFilter:['class'],childList:true,characterData:true,subtree:true});
  trigger();
}

const rootObserver=new MutationObserver(()=>requestAnimationFrame(bindBanner));
rootObserver.observe(body,{childList:true,subtree:true});
requestAnimationFrame(bindBanner);
