from pathlib import Path
from urllib.request import Request, urlopen
import io, hashlib, json
from PIL import Image

BASE='https://xyttlj-static.xyimg.net/game/'
OUT=Path('assets/original/huangshan-1000018-compact')
OUT.mkdir(parents=True,exist_ok=True)
EXPECT={
 'role.webp':'f9cfcf7be98d33ad0ce13b7056dec0225f49bd2a6cf61c9dc32f4ae24ab984f6',
 'magic.webp':'64a993deb7be3960f42aba4da05bc6e3357147b27d71ca118fae62b557de6c2d',
 'skillname.png':'9bc37e823b37b28e9d134a66d8fc5a1da1ff90f5e99d2c5529d3355b33a1e904',
 'skill.mp3':'ae6b9ac636d1d2e5bee6860523b01621e77dc8ad15a99b66586fc7c0641e1c30',
}
EXPECT_FRAMES='063a40fa3d2fb39ede5c3f94c290354cdd6e717f0c2952de3c194c79b7b6d008'

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

def shelf_pack(items,maxw,pad=2):
    order=sorted(items,key=lambda t:(-t[2].height,-t[2].width,t[0],t[1]))
    x=pad;y=pad;rowh=0;placed=[]
    for item in order:
        im=item[2]
        if x+im.width+pad>maxw and x>pad:
            x=pad;y+=rowh+pad;rowh=0
        placed.append((item,x,y));x+=im.width+pad;rowh=max(rowh,im.height)
    return placed,y+rowh+pad

def build_group(specs,maxw,outname):
    items=[];meta={}
    for key,base,scale in specs:
        src=Image.open(io.BytesIO(get(base+'.png'))).convert('RGBA')
        cfg=parse_cfg(get(base+'.cfg'))
        meta[key]=[None]*len(cfg)
        for idx,(ox,oy,w,h,x,y) in enumerate(cfg):
            crop=src.crop((x,y,x+w,y+h))
            nw=max(1,round(w*scale));nh=max(1,round(h*scale))
            if crop.size!=(nw,nh): crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
            items.append((key,idx,crop,ox*scale,oy*scale))
    placed,height=shelf_pack(items,maxw)
    atlas=Image.new('RGBA',(maxw,height),(0,0,0,0))
    for (key,idx,crop,ox,oy),px,py in placed:
        atlas.alpha_composite(crop,(px,py))
        meta[key][idx]=[round(ox,3),round(oy,3),crop.width,crop.height,px,py]
    f=OUT/outname
    atlas.save(f,'WEBP',quality=80,method=4)
    return meta,atlas.size

role_specs=[
 ('stand','resself/model/role/stand/1000018_v1',.36),
 ('run','resself/model/role/run/1000018_v1',.36),
 ('att1','resself/model/role/att1/1000018_v1',.36),
 ('att2','resself/model/role/att2/1000018_v2',.36),
 ('hit1','resself/model/role/hit1/1000018_v1',.36),
]
magic_specs=[(f'm{i}',f'resself/model/magic/atlas/491045{i}_v2',.16) for i in range(102,118)]
role_meta,role_size=build_group(role_specs,1024,'role.webp')
magic_meta,magic_size=build_group(magic_specs,2048,'magic.webp')
(OUT/'skillname.png').write_bytes(get('res/icon/skillname/4010451_v2.png'))
(OUT/'skill.mp3').write_bytes(get('resself/sound/4910451_v2.mp3'))
frames=json.dumps({'role':{'size':role_size,'frames':role_meta},'magic':{'size':magic_size,'frames':magic_meta}},ensure_ascii=False,separators=(',',':')).encode()
if hashlib.sha256(frames).hexdigest()!=EXPECT_FRAMES: raise SystemExit('frame metadata mismatch')
for name,expected in EXPECT.items():
    actual=hashlib.sha256((OUT/name).read_bytes()).hexdigest()
    if actual!=expected: raise SystemExit(f'{name} sha mismatch {actual}')
print('Huangshan compact assets verified', role_size, magic_size)
