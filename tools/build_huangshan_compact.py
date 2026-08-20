from pathlib import Path
from urllib.request import Request, urlopen
import io, hashlib, json
from PIL import Image

BASE='https://xyttlj-static.xyimg.net/game/'
OUT=Path('assets/original/huangshan-1000018')
OUT.mkdir(parents=True,exist_ok=True)
EXPECT_META='882310a46b4934db815fc3c93512de19638cd93ba88264042f4152dc42113bb6'
EXPECT_STATIC={
 'skillname.png':'9bc37e823b37b28e9d134a66d8fc5a1da1ff90f5e99d2c5529d3355b33a1e904',
 '4910451.mp3':'ae6b9ac636d1d2e5bee6860523b01621e77dc8ad15a99b66586fc7c0641e1c30',
}

def get(rel):
    req=Request(BASE+rel,headers={'User-Agent':'Mozilla/5.0'})
    with urlopen(req,timeout=60) as r:
        b=r.read()
    if not b: raise RuntimeError('empty '+rel)
    return b

def parse_cfg(b):
    n=int.from_bytes(b[:2],'big'); out=[]
    if len(b)<2+n*12: raise RuntimeError('truncated cfg')
    for i in range(n):
        p=2+i*12
        out.append([int.from_bytes(b[p:p+2],'big',signed=True),int.from_bytes(b[p+2:p+4],'big',signed=True),int.from_bytes(b[p+4:p+6],'big'),int.from_bytes(b[p+6:p+8],'big'),int.from_bytes(b[p+8:p+10],'big'),int.from_bytes(b[p+10:p+12],'big')])
    return out

def shelf_pack(items,maxw,pad=2,minh=0):
    order=sorted(items,key=lambda t:(-t[2].height,-t[2].width,t[0],t[1]))
    x=pad; y=pad; rowh=0; placed=[]
    for item in order:
        im=item[2]
        if x+im.width+pad>maxw and x>pad:
            x=pad; y+=rowh+pad; rowh=0
        placed.append((item,x,y)); x+=im.width+pad; rowh=max(rowh,im.height)
    return placed,max(y+rowh+pad,minh)

def build_group(specs,maxw,minh,outname):
    items=[]; meta={}
    for key,base,scale in specs:
        src=Image.open(io.BytesIO(get(base+'.png'))).convert('RGBA')
        cfg=parse_cfg(get(base+'.cfg'))
        meta[key]=[None]*len(cfg)
        for idx,(ox,oy,w,h,x,y) in enumerate(cfg):
            if w<=0 or h<=0 or x+w>src.width or y+h>src.height:
                raise RuntimeError(f'bad frame bounds {base} #{idx}')
            crop=src.crop((x,y,x+w,y+h))
            nw=max(1,round(w*scale)); nh=max(1,round(h*scale))
            if crop.size!=(nw,nh): crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
            items.append((key,idx,crop,ox*scale,oy*scale))
    placed,height=shelf_pack(items,maxw,minh=minh)
    atlas=Image.new('RGBA',(maxw,height),(0,0,0,0))
    for (key,idx,crop,ox,oy),px,py in placed:
        atlas.alpha_composite(crop,(px,py))
        meta[key][idx]=[round(ox,3),round(oy,3),crop.width,crop.height,px,py]
    atlas.save(OUT/outname,'WEBP',quality=82,method=4)
    return {'size':[maxw,height],'frames':meta}

role_specs=[
 ('stand','resself/model/role/stand/1000018_v1',.42),
 ('run','resself/model/role/run/1000018_v1',.42),
 ('att1','resself/model/role/att1/1000018_v1',.42),
 ('att2','resself/model/role/att2/1000018_v2',.42),
 ('hit1','resself/model/role/hit1/1000018_v1',.42),
]
magic_specs=[(f'm{i}',f'resself/model/magic/atlas/491045{i}_v2',.22) for i in range(102,118)]
meta={
 'role':build_group(role_specs,1024,944,'role-q82.webp'),
 'magic':build_group(magic_specs,2048,1130,'magic-q82.webp'),
}
meta_bytes=json.dumps(meta,ensure_ascii=False,separators=(',',':')).encode()
if hashlib.sha256(meta_bytes).hexdigest()!=EXPECT_META:
    raise SystemExit('frame metadata mismatch; refusing publish')
(OUT/'skillname.png').write_bytes(get('res/icon/skillname/4010451_v2.png'))
(OUT/'4910451.mp3').write_bytes(get('resself/sound/4910451_v2.mp3'))
for name,expected in EXPECT_STATIC.items():
    actual=hashlib.sha256((OUT/name).read_bytes()).hexdigest()
    if actual!=expected: raise SystemExit(f'{name} official hash mismatch {actual}')
for name,dim in [('role-q82.webp',(1024,944)),('magic-q82.webp',(2048,1130))]:
    p=OUT/name
    im=Image.open(p)
    if im.size!=dim or p.stat().st_size<=0: raise SystemExit(f'{name} invalid {im.size}')
decoded=(1024*944+2048*1130)*4
if decoded>14*1024*1024: raise SystemExit('decoded memory budget exceeded')
print('Huangshan compact assets verified; decoded MB=',round(decoded/1024/1024,2))
