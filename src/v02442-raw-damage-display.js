// V0.24.42: damage float must show the authoritative calculated hit amount.
// Backend structured markers already carry both rawDamage (calculated hit) and damage (actual HP lost).
// Preserve hpPct/alive for HP bars, but feed rawDamage to the visual float so it matches the battle report.
const battleDialog=document.querySelector('#battleDialog');
const battleBody=document.querySelector('#battleDialogBody');
if(!battleDialog||!battleBody) throw new Error('battle dialog missing');

const priorShow=battleDialog.showModal;
if(typeof priorShow!=='function') throw new Error('battle showModal missing');

function patchStructuredDamage(){
  const log=battleBody.querySelector('.battle-log');
  if(!log)return;
  for(const node of log.children){
    if(node.dataset.rawDamageDisplay==='042')continue;
    const html=node.innerHTML||'';
    const match=html.match(/<!--XYT:([\s\S]*?)-->/);
    if(!match)continue;
    try{
      const payload=JSON.parse(decodeURIComponent(match[1]));
      if(payload?.v!==1||payload?.type!=='action'||!Array.isArray(payload.hits))continue;
      let changed=false;
      for(const hit of payload.hits){
        const raw=Number(hit?.rawDamage);
        if(!Number.isFinite(raw)||raw<=0||hit?.miss||hit?.guarded)continue;
        if(hit.hpLoss==null)hit.hpLoss=Number(hit.damage||0);
        if(Number(hit.damage)!==raw){hit.damage=raw;changed=true;}
      }
      if(changed){
        const marker=`<!--XYT:${encodeURIComponent(JSON.stringify(payload))}-->`;
        node.innerHTML=html.slice(0,match.index)+marker+html.slice(match.index+match[0].length);
      }
      node.dataset.rawDamageDisplay='042';
    }catch{}
  }
}

battleDialog.showModal=function(...args){
  patchStructuredDamage();
  return priorShow.apply(this,args);
};
