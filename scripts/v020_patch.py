from pathlib import Path
import re

ROOT=Path('.')
def rd(p): return (ROOT/p).read_text(encoding='utf-8')
def wr(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(s,a,b,label):
    if a not in s: raise RuntimeError(f'{label}: target not found')
    return s.replace(a,b,1)

# 1) Exact original initial talent from v580 xiake.cstianfu.
p='src/meridians.js'; s=rd(p)
pat=re.compile(r"// 用户确认原版侠客按品质自带初始天赋；.*?export const MERIDIAN_POINT_NAMES",re.S)
new="""// 原版 v580 `xiake.cstianfu` 初始天赋。不同侠客即使同品质也有不同档位。\n// 黄药师/洪七公为单机版补入角色，原版没有正式侠客行，按后期五侠档位暂定280。\nexport const BASE_TALENT_BY_HERO = Object.freeze({\n  player:100, wuji:100, xiaozhao:160, yangxiao:220, yangdingtian:240, guoxiang:240,\n  zhangsanfeng:260, duer:260, dunan:260, dujie:260, huiyue:260, huangshan:240,\n  yangguo:280, huangrong:280, xiaolongnv:280, guojing:280, zhoubotong:280,\n  huangyaoshi:280, hongqigong:280,\n});\nexport function baseTalentForHero(heroId){ return Number(BASE_TALENT_BY_HERO[heroId]||0); }\n\nexport const MERIDIAN_POINT_NAMES"""
s,n=pat.subn(new,s,count=1)
if n!=1: raise RuntimeError(f'meridians talent replace count={n}')
wr(p,s)

p='src/state.js'; s=rd(p)
s=rep(s,"import { baseTalentForRarity } from './meridians.js';","import { baseTalentForHero } from './meridians.js';",'state talent import')
old="""export function heroTalent(state, heroId) {\n  const base=HEROES[heroId],h=state.heroes?.[heroId];\n  if(!base||!h)return 0;\n  const tpl=storyHeroProfile(state,heroId,effectiveHeroProfile(state,heroId,base));\n  return baseTalentForRarity(tpl?.rarity||base.rarity)+Number(h.meridian?.talent||0);\n}"""
new="""export function heroTalent(state, heroId) {\n  const h=state.heroes?.[heroId];\n  if(!HEROES[heroId]||!h)return 0;\n  return baseTalentForHero(heroId)+Number(h.meridian?.talent||0);\n}"""
s=rep(s,old,new,'state heroTalent exact values')
# effectiveHeroProfile is no longer needed by state.js after changing heroTalent.
s=s.replace("import { createAwakeningState, awakeningBaseMultiplier, effectiveHeroProfile } from './awakening.js';","import { createAwakeningState, awakeningBaseMultiplier } from './awakening.js';")
wr(p,s)

p='src/app.js'; s=rd(p)
s=rep(s,"import { getMeridianPoint, kungfuSlotsForTalent, MERIDIAN_TOTAL_POINTS, baseTalentForRarity } from './meridians.js';","import { getMeridianPoint, kungfuSlotsForTalent, MERIDIAN_TOTAL_POINTS, baseTalentForHero } from './meridians.js';",'app talent import')
s=rep(s,"const baseTalentOf=id=>baseTalentForRarity(profileOf(id)?.rarity||HEROES[id]?.rarity||0);","const baseTalentOf=id=>baseTalentForHero(id);",'app baseTalentOf')
s=s.replace("baseTalentForRarity(tpl.rarity)","baseTalentForHero(id)")
# Allow CSS to skin whole pages by current route/subroute.
old="function render(){recoverStamina(state);recoverInnerPower(state);normalizeDaily(state);renderResources();"
new="function render(){recoverStamina(state);recoverInnerPower(state);normalizeDaily(state);pageEl.dataset.page=currentPage;pageEl.dataset.more=currentPage==='more'?moreSection:'';renderResources();"
s=rep(s,old,new,'render page dataset')
wr(p,s)

# 2) Use actual client art as page skin; keep content readable.
p='styles.css'; s=rd(p)
art_css=r'''

/* V0.20：直接复用原版客户端场景美术。 */
.page[data-page="heroes"],
.page[data-page="more"]{
  isolation:isolate;
}
.page[data-page="heroes"]::before,
.page[data-page="more"]::before{
  content:"";
  position:fixed;
  z-index:-2;
  inset:93px 0 calc(58px + env(safe-area-inset-bottom));
  background-position:center top;
  background-size:cover;
  background-repeat:no-repeat;
  opacity:.48;
  pointer-events:none;
}
.page[data-page="heroes"]::before{
  background-image:linear-gradient(180deg,rgba(8,10,9,.22),rgba(8,10,9,.76) 78%),url('./assets/original/hero-bg.jpg');
}
.page[data-page="more"]::before{
  background-image:linear-gradient(180deg,rgba(9,10,8,.14),rgba(9,10,8,.78) 76%),url('./assets/original/jianghu-bg.jpg');
}
.page[data-page="heroes"] .hero-card,
.page[data-page="heroes"] .card,
.page[data-page="more"] .card,
.page[data-page="more"] .hub-tile{
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  background-color:rgba(17,18,15,.86);
}
.page[data-page="more"] .jianghu-banner{
  background-image:linear-gradient(90deg,rgba(42,23,17,.90),rgba(25,23,18,.52)),url('./assets/original/jianghu-bg.jpg');
  background-position:center 38%;
  background-size:cover;
}
.page[data-page="heroes"] .page-heading,
.page[data-page="heroes"] .filter-strip,
.page[data-page="more"] .subpage-head{
  text-shadow:0 2px 10px rgba(0,0,0,.9);
}
/* 轻量雾气只是网页端氛围叠层，不冒充原版技能粒子。 */
.page[data-page="heroes"]::after,
.page[data-page="more"]::after{
  content:"";
  position:fixed;
  z-index:-1;
  left:-20%;right:-20%;bottom:8%;height:22vh;
  pointer-events:none;
  opacity:.16;
  filter:blur(22px);
  background:radial-gradient(ellipse at center,rgba(232,222,196,.7),transparent 67%);
  animation:xyt-mist 12s ease-in-out infinite alternate;
}
@keyframes xyt-mist{from{transform:translate3d(-3%,0,0) scaleX(.92)}to{transform:translate3d(3%,-4%,0) scaleX(1.08)}}
@media (prefers-reduced-motion:reduce){.page[data-page="heroes"]::after,.page[data-page="more"]::after{animation:none}}
'''
if 'V0.20：直接复用原版客户端场景美术' not in s: s+=art_css
wr(p,s)

# 3) Version/cache + original images offline.
p='index.html'; s=rd(p).replace('单机精简版 · V0.19','单机精简版 · V0.20'); wr(p,s)
p='sw.js'; s=rd(p)
s=s.replace("const CACHE = 'xinyitian-v0.19.0';","const CACHE = 'xinyitian-v0.20.0';")
needle="  './styles.css',\n"
add="  './styles.css',\n  './assets/original/hero-bg.jpg',\n  './assets/original/jianghu-bg.jpg',\n"
if './assets/original/hero-bg.jpg' not in s: s=rep(s,needle,add,'sw art assets')
wr(p,s)

# Assertions.
assert 'BASE_TALENT_BY_HERO' in rd('src/meridians.js')
assert 'yangguo:280' in rd('src/meridians.js')
assert "baseTalentForHero(heroId)+Number(h.meridian?.talent||0)" in rd('src/state.js')
assert "pageEl.dataset.page=currentPage" in rd('src/app.js')
assert "url('./assets/original/hero-bg.jpg')" in rd('styles.css')
assert 'xinyitian-v0.20.0' in rd('sw.js')
print('V0.20 patch applied')
