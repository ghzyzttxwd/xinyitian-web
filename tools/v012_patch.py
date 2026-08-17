from pathlib import Path


def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'marker not found in {path}: {old[:180]}')
    p.write_text(s.replace(old,new,1))

# state.js：侠客经验池 + VIP/奇侠商店持久化
rep('src/state.js',
    "import { calibratedHeroPower } from './power.js';",
    "import { calibratedHeroPower } from './power.js';\nimport { createVipExtras } from './vip.js';")
rep('src/state.js',
    "      meridianPills: 0, breakthroughPills: 0,\n      kungfuTickets: 0,",
    "      meridianPills: 0, breakthroughPills: 0,\n      kungfuTickets: 0, heroExp: 0,")
rep('src/state.js',
    "    wudao:createWudaoState(),\n    tasks:createTasksState(),",
    "    wudao:createWudaoState(),\n    vipExtras:createVipExtras(),\n    tasks:createTasksState(),")

# app.js imports
rep('src/app.js',
    "} from './tasks.js';",
    "} from './tasks.js';\nimport {\n  VIP_GIFTS, SPECIAL_EXCHANGE_ITEMS, SPECIAL_ITEM_PACK_SIZE, SPECIAL_ITEM_PACK_PRICE, SPECIAL_ITEM_PACK_LIMIT,\n  towerSpecialChoicePack, tombSpecialChoicePack,\n} from './vip.js';")
rep('src/app.js',
    "const SPECIAL_EXCHANGE_IDS=['yangguo','huangrong','xiaolongnv','guojing','zhoubotong'];",
    "const SPECIAL_EXCHANGE_IDS=['yangguo','huangrong','xiaolongnv','guojing','zhoubotong','huangyaoshi','hongqigong'];")

# 顶部资源增加侠客经验
rep('src/app.js',
    " resourceItem('铜钱',fmt(state.player.copper)),resourceItem('元宝',fmt(state.player.gems)),resourceItem('体力',`${state.player.stamina}/${state.player.staminaCap}`),resourceItem('传奇令',fmt(state.player.legendTokens)),",
    " resourceItem('铜钱',fmt(state.player.copper)),resourceItem('元宝',fmt(state.player.gems)),resourceItem('体力',`${state.player.stamina}/${state.player.staminaCap}`),resourceItem('侠客经验',fmt(state.player.heroExp)),resourceItem('传奇令',fmt(state.player.legendTokens)),")

# 主线/速战产出侠客经验
rep('src/app.js',
    "if(result.win){const exp=180+chapter*36,copper=12000+chapter*1800;addPlayerExp(state,exp);state.player.copper+=copper;state.player.heroTokens+=chapter%5===0?2:0;state.player.chapter+=1;reward=`玩家经验 +${fmt(exp)} · 铜钱 +${fmt(copper)}${chapter%5===0?' · 侠客信物 +2':''}`;commit();}",
    "if(result.win){const exp=180+chapter*36,copper=12000+chapter*1800,heroExp=800+chapter*80;addPlayerExp(state,exp);state.player.copper+=copper;state.player.heroExp=Number(state.player.heroExp||0)+heroExp;state.player.heroTokens+=chapter%5===0?2:0;state.player.chapter+=1;reward=`玩家经验 +${fmt(exp)} · 侠客经验 +${fmt(heroExp)} · 铜钱 +${fmt(copper)}${chapter%5===0?' · 侠客信物 +2':''}`;commit();}")
rep('src/app.js',
    "function quickBattle(){const times=5,cost=times*5;if(state.player.stamina<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);state.player.stamina-=cost;state.daily.quickBattles+=times;const oneExp=260+state.player.chapter*44,oneCopper=10000+state.player.chapter*900,exp=oneExp*times,copper=oneCopper*times;addPlayerExp(state,exp);state.player.copper+=copper;commit();alert(`连续速战5次完成：经验 +${fmt(exp)}，铜钱 +${fmt(copper)}，体力 -${cost}。`);}",
    "function quickBattle(){const times=5,cost=times*5;if(state.player.stamina<cost)return alert(`体力不足，连续速战5次需要${cost}体力。`);state.player.stamina-=cost;state.daily.quickBattles+=times;const oneExp=260+state.player.chapter*44,oneCopper=10000+state.player.chapter*900,oneHeroExp=1800+state.player.chapter*120,exp=oneExp*times,copper=oneCopper*times,heroExp=oneHeroExp*times;addPlayerExp(state,exp);state.player.copper+=copper;state.player.heroExp=Number(state.player.heroExp||0)+heroExp;commit();alert(`连续速战5次完成：玩家经验 +${fmt(exp)}，侠客经验 +${fmt(heroExp)}，铜钱 +${fmt(copper)}，体力 -${cost}。`);}")

# 侠客升级真正消耗侠客经验资源
old_level="function levelHero(id){const h=state.heroes[id];if(!h?.owned)return;if(h.level>=state.player.level)return alert('侠客等级不能超过玩家等级。');const cost=Math.round(3000*Math.pow(1.09,h.level-1));if(state.player.copper<cost)return alert(`铜钱不足，需要 ${fmt(cost)}。`);state.player.copper-=cost;h.level+=1;bumpDaily(state,'hero');commit();}"
new_level="function heroExpLevelCost(level){const lv=Math.max(1,Number(level)||1);return Math.round(1000+Math.pow(lv,1.22)*280);}\nfunction levelHero(id){const h=state.heroes[id];if(!h?.owned)return;if(h.level>=state.player.level)return alert('侠客等级不能超过玩家等级。');const cost=Math.round(3000*Math.pow(1.09,h.level-1)),expCost=heroExpLevelCost(h.level);if(state.player.copper<cost)return alert(`铜钱不足，需要 ${fmt(cost)}。`);if(Number(state.player.heroExp||0)<expCost)return alert(`侠客经验不足，需要 ${fmt(expCost)}。主线与速战可获得。`);state.player.copper-=cost;state.player.heroExp-=expCost;h.level+=1;bumpDaily(state,'hero');commit();}"
rep('src/app.js',old_level,new_level)

# 千宝塔高层给奇侠兑换物自选包
rep('src/app.js',
    "if(wudaoGain)state.wudao.pills=Number(state.wudao.pills||0)+wudaoGain;reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;",
    "if(wudaoGain)state.wudao.pills=Number(state.wudao.pills||0)+wudaoGain;const specialPack=towerSpecialChoicePack(result.floor);if(specialPack)state.vipExtras.specialChoicePacks=Number(state.vipExtras.specialChoicePacks||0)+specialPack;reward=`经脉丹 +${pills} · 铜钱 +${fmt(copper)}`;")
rep('src/app.js',
    "if(wudaoGain)reward+=` · 悟道丹 +${wudaoGain}`;bumpDaily(state,'tower');commit();",
    "if(wudaoGain)reward+=` · 悟道丹 +${wudaoGain}`;if(specialPack)reward+=` · 奇侠兑换物自选包 +${specialPack}`;bumpDaily(state,'tower');commit();")

# 古墓100/200/300/400首次通关给奇侠兑换物自选包
rep('src/app.js',
    "if(r.wudaoPills){state.wudao.pills=Number(state.wudao.pills||0)+r.wudaoPills;parts.push(`悟道丹 +${r.wudaoPills}`);}return parts.join(' · ');}",
    "if(r.wudaoPills){state.wudao.pills=Number(state.wudao.pills||0)+r.wudaoPills;parts.push(`悟道丹 +${r.wudaoPills}`);}const specialPack=tombSpecialChoicePack(floor,firstClear);if(specialPack){state.vipExtras.specialChoicePacks=Number(state.vipExtras.specialChoicePacks||0)+specialPack;parts.push(`奇侠兑换物自选包 +${specialPack}`);}return parts.join(' · ');}")

# 客栈：增加专属物常驻商店/自选包按钮
marker="function renderInnCard(){return `<section class=\"card\"><div class=\"section-title\"><h3>客栈</h3><small>兑换 · 定向招募 · 奇侠兑换</small></div>"
if marker not in Path('src/app.js').read_text(): raise SystemExit('renderInnCard marker missing')
rep('src/app.js',
    "function renderInnCard(){return `<section class=\"card\"><div class=\"section-title\"><h3>客栈</h3><small>兑换 · 定向招募 · 奇侠兑换</small></div><div class=\"grid-2\"><div class=\"mini-stat\"><div class=\"muted\">侠客信物</div><div class=\"big-number small\">${fmt(state.player.heroTokens)}</div></div><div class=\"mini-stat\"><div class=\"muted\">传奇招募令</div><div class=\"big-number small\">${fmt(state.player.legendTokens)}</div></div></div><div class=\"notice\" style=\"margin-top:10px\">侠客信物每10个兑换1次传奇招募令，保留1～15倍暴击。兑换出招募令后，不需要再去侠客页找入口，下面直接定向招募。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn btn-primary\" data-exchange-legend=\"1\" ${state.player.heroTokens<10?'disabled':''}>兑换1次</button><button class=\"btn btn-gold\" data-exchange-legend=\"10\" ${state.player.heroTokens<100?'disabled':''}>连续10次</button></div><div class=\"section-title\" style=\"margin-top:14px\"><h3>传奇定向招募</h3><small>达到幕数后常驻</small></div>${DIRECT_RECRUIT_IDS.map(innRecruitRow).join('')}<div class=\"section-title\" style=\"margin-top:14px\"><h3>奇侠兑换</h3><small>110幕档</small></div>${SPECIAL_EXCHANGE_IDS.map(innRecruitRow).join('')}</section>`;}",
    "function specialResourceRow(x){const have=Number(state.specials?.[x.item]||0),used=Number(state.vipExtras?.specialShopBuys?.[x.item]||0),packs=Number(state.vipExtras?.specialChoicePacks||0),open=state.player.chapter>=110;return `<div class=\"list-row\"><div><b>${x.item}</b><div class=\"hero-meta\">持有 ${fmt(have)} · 元宝限购 ${used}/${SPECIAL_ITEM_PACK_LIMIT}</div></div><div class=\"action-stack\"><button class=\"btn\" data-buy-special=\"${x.item}\" ${open&&used<SPECIAL_ITEM_PACK_LIMIT&&state.player.gems>=SPECIAL_ITEM_PACK_PRICE?'':'disabled'}>${SPECIAL_ITEM_PACK_SIZE}个 · ${SPECIAL_ITEM_PACK_PRICE}元宝</button><button class=\"btn btn-gold\" data-use-special-pack=\"${x.item}\" ${open&&packs>0?'':'disabled'}>自选包 +${SPECIAL_ITEM_PACK_SIZE}</button></div></div>`;}\nfunction renderInnCard(){return `<section class=\"card\"><div class=\"section-title\"><h3>客栈</h3><small>兑换 · 定向招募 · 奇侠兑换</small></div><div class=\"grid-2\"><div class=\"mini-stat\"><div class=\"muted\">侠客信物</div><div class=\"big-number small\">${fmt(state.player.heroTokens)}</div></div><div class=\"mini-stat\"><div class=\"muted\">传奇招募令</div><div class=\"big-number small\">${fmt(state.player.legendTokens)}</div></div></div><div class=\"notice\" style=\"margin-top:10px\">侠客信物每10个兑换1次传奇招募令，保留1～15倍暴击。兑换出招募令后，不需要再去侠客页找入口，下面直接定向招募。</div><div class=\"action-row\" style=\"margin-top:10px\"><button class=\"btn btn-primary\" data-exchange-legend=\"1\" ${state.player.heroTokens<10?'disabled':''}>兑换1次</button><button class=\"btn btn-gold\" data-exchange-legend=\"10\" ${state.player.heroTokens<100?'disabled':''}>连续10次</button></div><div class=\"section-title\" style=\"margin-top:14px\"><h3>传奇定向招募</h3><small>达到幕数后常驻</small></div>${DIRECT_RECRUIT_IDS.map(innRecruitRow).join('')}<div class=\"section-title\" style=\"margin-top:14px\"><h3>奇侠兑换</h3><small>110幕档</small></div>${SPECIAL_EXCHANGE_IDS.map(innRecruitRow).join('')}<div class=\"section-title\" style=\"margin-top:14px\"><h3>奇侠专属物</h3><small>自选包 ${fmt(state.vipExtras?.specialChoicePacks||0)}</small></div><div class=\"notice\">110幕后开放。专属物可元宝限购，也可从648模拟充值、千宝塔高层、古墓高层获得自选包。当前100个/1500元宝、每种限购10次属于单机V1暂定经济值。</div>${SPECIAL_EXCHANGE_ITEMS.map(specialResourceRow).join('')}</section>`;}")

# VIP礼包中心与购买逻辑
insert_before="function renderMore(){"
s=Path('src/app.js').read_text(); idx=s.find(insert_before)
if idx<0: raise SystemExit('renderMore not found')
vip_code=r'''function vipGiftRow(g){const bought=!!state.recharge.vipGiftBought?.[g.vip],open=state.player.vip>=g.vip,can=open&&!bought&&state.player.gems>=g.price;return `<div class="list-row ${open?'':'locked'}"><div><b>VIP${g.vip}专属礼包</b><div class="hero-meta">${g.desc}</div></div><button class="btn ${can?'btn-gold':''}" data-buy-vip-gift="${g.vip}" ${can?'':'disabled'}>${bought?'已购买':open?(g.price?`${fmt(g.price)}元宝`:'免费领取'):`V${g.vip}解锁`}</button></div>`;}
function renderVipGiftCenter(){const ex=state.vipExtras||{};return `<section class="card"><div class="section-title"><h3>VIP专属礼包</h3><small>当前 V${state.player.vip}</small></div><div class="notice">达到对应VIP后仍需花元宝购买，不会自动发放。V8继续严格保留40888元宝购买黄衫女礼包。</div>${VIP_GIFTS.map(vipGiftRow).join('')}<div class="hero-meta" style="margin-top:8px">收藏：昆仑两仪剑×${fmt(ex.kunlunLiangyi||0)}${ex.skins?.length?` · 皮肤：${ex.skins.join('、')}`:''}${ex.titles?.length?` · 称号：${ex.titles.join('、')}`:''}${ex.frames?.length?` · 头像框：${ex.frames.join('、')}`:''}</div></section>`;}
function grantVipGiftReward(g){const r=g.reward||{};state.player.copper+=Number(r.copper||0);state.player.heroTokens+=Number(r.heroTokens||0);state.kungfu.fragments=Number(state.kungfu.fragments||0)+Number(r.kungfuFragments||0);state.vipExtras.kunlunLiangyi=Number(state.vipExtras.kunlunLiangyi||0)+Number(r.kunlun||0);for(const [id,n] of Object.entries(r.kungfu||{}))addKungfuCopy(id,n);if(r.hero){ownHero(state,r.hero);placeHeroIfPossible(r.hero);}if(r.skin&&!state.vipExtras.skins.includes(r.skin))state.vipExtras.skins.push(r.skin);if(r.title&&!state.vipExtras.titles.includes(r.title))state.vipExtras.titles.push(r.title);if(r.frame&&!state.vipExtras.frames.includes(r.frame))state.vipExtras.frames.push(r.frame);}
function buyVipGift(vip){const g=VIP_GIFTS.find(x=>x.vip===Number(vip));if(!g)return;if(state.player.vip<g.vip)return alert(`需要VIP${g.vip}。`);if(state.recharge.vipGiftBought[g.vip])return;if(state.player.gems<g.price)return alert(`元宝不足，需要${fmt(g.price)}。`);state.player.gems-=g.price;state.recharge.vipGiftBought[g.vip]=true;grantVipGiftReward(g);commit();alert(`VIP${g.vip}礼包购买成功：${g.desc}`);}
function buySpecialItem(item){const row=SPECIAL_EXCHANGE_ITEMS.find(x=>x.item===item);if(!row)return;if(state.player.chapter<110)return alert('奇侠专属物商店第110幕开放。');const used=Number(state.vipExtras.specialShopBuys[item]||0);if(used>=SPECIAL_ITEM_PACK_LIMIT)return alert('该专属物元宝限购已买满。');if(state.player.gems<SPECIAL_ITEM_PACK_PRICE)return alert('元宝不足。');state.player.gems-=SPECIAL_ITEM_PACK_PRICE;state.vipExtras.specialShopBuys[item]=used+1;state.specials[item]=Number(state.specials[item]||0)+SPECIAL_ITEM_PACK_SIZE;commit();}
function useSpecialChoicePack(item){if(state.player.chapter<110)return alert('奇侠专属物第110幕开放。');if(Number(state.vipExtras.specialChoicePacks||0)<=0)return alert('奇侠兑换物自选包不足。');if(!SPECIAL_EXCHANGE_ITEMS.some(x=>x.item===item))return;state.vipExtras.specialChoicePacks-=1;state.specials[item]=Number(state.specials[item]||0)+SPECIAL_ITEM_PACK_SIZE;commit();}

'''
s=s[:idx]+vip_code+s[idx:]
Path('src/app.js').write_text(s)

# renderMore 用完整VIP礼包中心替换单独V8卡
p=Path('src/app.js');s=p.read_text()
old="${renderInnCard()}${renderTaskCenter()}${renderSoulStoneStore()}${renderWudaoStore()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3><small>累计 ¥${fmt(state.player.totalRecharge)}</small></div><div class=\"notice\">只修改本地存档，不产生真实支付。首充档位保留双倍元宝。</div><div class=\"grid-3\" style=\"margin-top:10px\">${rechargeHtml()}</div></section><section class=\"card\"><div class=\"section-title\"><h3>VIP ${state.player.vip}</h3><small>氪佬成长</small></div>${state.player.vip>=8?`<div class=\"list-row\"><div><b>VIP8 黄衫女礼包</b><div class=\"hero-meta\">黄衫女×1 · 侠客信物×80 · 铜钱80万</div></div><button class=\"btn btn-gold\" data-action=\"vip8gift\" ${vip8Bought?'disabled':''}>${vip8Bought?'已购买':'40888元宝'}</button></div>`:`<div class=\"notice\">累计模拟充值10000元达到V8，解锁黄衫女专属礼包。</div>`}</section>"
new="${renderInnCard()}${renderTaskCenter()}${renderSoulStoneStore()}${renderWudaoStore()}<section class=\"card\"><div class=\"section-title\"><h3>模拟充值</h3><small>累计 ¥${fmt(state.player.totalRecharge)}</small></div><div class=\"notice\">只修改本地存档，不产生真实支付。首充档位保留双倍元宝；648档额外获得1个奇侠兑换物自选包。</div><div class=\"grid-3\" style=\"margin-top:10px\">${rechargeHtml()}</div></section>${renderVipGiftCenter()}"
if old not in s: raise SystemExit('old VIP render block missing')
s=s.replace(old,new,1); p.write_text(s)

# renderMore开头不再需要vip8Bought局部变量
rep('src/app.js',
    "function renderMore(){const staminaLimit=STAMINA_BUY_LIMIT[state.player.vip]??24,staminaCost=staminaPrice(state.daily.staminaBuys),treeLimit=moneyTreeLimit(state.player.vip),vip8Bought=!!state.recharge.vipGiftBought[8];",
    "function renderMore(){const staminaLimit=STAMINA_BUY_LIMIT[state.player.vip]??24,staminaCost=staminaPrice(state.daily.staminaBuys),treeLimit=moneyTreeLimit(state.player.vip);")

# 充值：首充侠客经验 + 648奇侠自选包
rep('src/app.js',
    "function recharge(yuan){const pack=RECHARGE_PACKS.find(x=>x.yuan===yuan);if(!pack)return;const first=!state.recharge.firstDoubleUsed[yuan],first6=yuan===6&&!state.recharge.first6Claimed,gained=first?pack.gems*2:pack.gems+pack.repeatBonus;state.recharge.firstDoubleUsed[yuan]=true;state.player.totalRecharge+=yuan;state.player.gems+=gained;if(first6){state.recharge.first6Claimed=true;state.player.gems+=60;ownHero(state,'xiaozhao');placeHeroIfPossible('xiaozhao');}recalcVip(state);commit();alert(`模拟充值 ¥${yuan}：获得 ${fmt(gained)} 元宝${first6?'。首充礼包额外60元宝，小昭已领取。':'。'}`);}",
    "function recharge(yuan){const pack=RECHARGE_PACKS.find(x=>x.yuan===yuan);if(!pack)return;const first=!state.recharge.firstDoubleUsed[yuan],first6=yuan===6&&!state.recharge.first6Claimed,gained=first?pack.gems*2:pack.gems+pack.repeatBonus;state.recharge.firstDoubleUsed[yuan]=true;state.player.totalRecharge+=yuan;state.player.gems+=gained;let extra='';if(first6){state.recharge.first6Claimed=true;state.player.gems+=60;state.player.heroExp=Number(state.player.heroExp||0)+10000;ownHero(state,'xiaozhao');placeHeroIfPossible('xiaozhao');extra+='。首充礼包额外60元宝、小昭、侠客经验10000';}if(yuan===648){state.vipExtras.specialChoicePacks=Number(state.vipExtras.specialChoicePacks||0)+1;extra+='。奇侠兑换物自选包 +1';}recalcVip(state);commit();alert(`模拟充值 ¥${yuan}：获得 ${fmt(gained)} 元宝${extra||'。'}`);}")

# 删除旧V8独立购买函数，避免双逻辑
rep('src/app.js',
    "function buyVip8Gift(){if(state.player.vip<8)return alert('需要VIP8。');if(state.recharge.vipGiftBought[8])return;if(state.player.gems<40888)return alert('元宝不足，需要40888元宝。');state.player.gems-=40888;state.recharge.vipGiftBought[8]=true;state.player.heroTokens+=80;state.player.copper+=800000;ownHero(state,'huangshan');placeHeroIfPossible('huangshan');commit();alert('VIP8礼包购买成功：黄衫女已加入侠客列表。');}\n",
    "")

# 点击事件
rep('src/app.js',
    "if(btn.dataset.awakenHero){awakenHero(btn.dataset.awakenHero);return;}if(btn.dataset.claimActivity)",
    "if(btn.dataset.awakenHero){awakenHero(btn.dataset.awakenHero);return;}if(btn.dataset.buyVipGift!==undefined){buyVipGift(Number(btn.dataset.buyVipGift));return;}if(btn.dataset.buySpecial){buySpecialItem(btn.dataset.buySpecial);return;}if(btn.dataset.useSpecialPack){useSpecialChoicePack(btn.dataset.useSpecialPack);return;}if(btn.dataset.claimActivity)")
rep('src/app.js',
    "if(action==='moneyTree')moneyTree();if(action==='vip8gift')buyVip8Gift();if(action==='export')",
    "if(action==='moneyTree')moneyTree();if(action==='export')")

# 版本与缓存
rep('index.html','单机精简版 · V0.11','单机精简版 · V0.12')
rep('sw.js',"const CACHE = 'xinyitian-v0.11.0';","const CACHE = 'xinyitian-v0.12.0';")
rep('sw.js',"  './src/tasks.js',\n  './src/power.js',","  './src/tasks.js',\n  './src/power.js',\n  './src/vip.js',")
