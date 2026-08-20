from pathlib import Path
from urllib.request import Request, urlopen
import io, json, hashlib
from PIL import Image

BASE='https://xyttlj-static.xyimg.net/game/'
OUT=Path('assets/original/xiaozhao-1000108')
OUT.mkdir(parents=True,exist_ok=True)

ROLE={
 'stand':('resself/model/role/stand/1000108_v1',.36),
 'run':('resself/model/role/run/1000108_v1',.36),
 'att1':('resself/model/role/att1/1000108_v3',.36),
 'att2':('resself/model/role/att2/1000108_v2',.36),
 'hit1':('resself/model/role/hit1/1000108_v1',.36),
}
MAGIC={f'm{i}':(f'resself/model/magic/atlas/491235{i}_v2',.16) for i in range(101,116)}

def get(rel):
    req=Request(BASE+rel,headers={'User-Agent':'Mozilla/5.0'})
    with urlopen(req,timeout=60) as r:
        data=r.read()
    if not data:
        raise RuntimeError('empty '+rel)
    return data

def parse_cfg(b):
    n=int.from_bytes(b[:2],'big')
    if len(b)<2+n*12:
        raise RuntimeError('truncated cfg')
    out=[]
    for i in range(n):
        p=2+i*12
        out.append([
            int.from_bytes(b[p:p+2],'big',signed=True),
            int.from_bytes(b[p+2:p+4],'big',signed=True),
            int.from_bytes(b[p+4:p+6],'big'),
            int.from_bytes(b[p+6:p+8],'big'),
            int.from_bytes(b[p+8:p+10],'big'),
            int.from_bytes(b[p+10:p+12],'big'),
        ])
    return out

def shelf(items,maxw,pad=2):
    items=sorted(items,key=lambda x:(-x[2].height,-x[2].width,x[0],x[1]))
    x=pad;y=pad;rowh=0;placed=[]
    for item in items:
        im=item[2]
        if x+im.width+pad>maxw and x>pad:
            x=pad;y+=rowh+pad;rowh=0
        placed.append((item,x,y))
        x+=im.width+pad
        rowh=max(rowh,im.height)
    return placed,y+rowh+pad

def build(spec,maxw,outname):
    items=[]; meta={}
    for key,(base,scale) in spec.items():
        src=Image.open(io.BytesIO(get(base+'.png'))).convert('RGBA')
        cfg=parse_cfg(get(base+'.cfg'))
        meta[key]=[None]*len(cfg)
        for idx,(ox,oy,w,h,x,y) in enumerate(cfg):
            if w<=0 or h<=0 or x+w>src.width or y+h>src.height:
                raise RuntimeError(f'bad frame {base} #{idx}')
            crop=src.crop((x,y,x+w,y+h))
            nw=max(1,round(w*scale)); nh=max(1,round(h*scale))
            if crop.size!=(nw,nh):
                crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
            items.append((key,idx,crop,ox*scale,oy*scale))
    placed,height=shelf(items,maxw)
    atlas=Image.new('RGBA',(maxw,height),(0,0,0,0))
    for (key,idx,crop,ox,oy),px,py in placed:
        atlas.alpha_composite(crop,(px,py))
        meta[key][idx]=[round(ox,3),round(oy,3),crop.width,crop.height,px,py]
    path=OUT/outname
    atlas.save(path,'WEBP',quality=82,method=4)
    return {'size':[maxw,height],'frames':meta}

meta={
 'role':build(ROLE,1024,'role-q82.webp'),
 'magic':build(MAGIC,2048,'magic-q82.webp'),
}
(OUT/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(OUT/'skillname.png').write_bytes(get('res/icon/skillname/4012351_v2.png'))
(OUT/'4912351.mp3').write_bytes(get('resself/sound/4912351_v2.mp3'))

role=Image.open(OUT/'role-q82.webp')
magic=Image.open(OUT/'magic-q82.webp')
if role.width!=1024 or magic.width!=2048:
    raise RuntimeError('atlas width mismatch')
decoded=(role.width*role.height+magic.width*magic.height)*4
if decoded>6*1024*1024:
    raise RuntimeError(f'decoded budget exceeded: {decoded}')
for p in ['role-q82.webp','magic-q82.webp','meta.json','skillname.png','4912351.mp3']:
    f=OUT/p
    if not f.exists() or f.stat().st_size<=0:
        raise RuntimeError('missing '+p)
    print(p,f.stat().st_size,hashlib.sha256(f.read_bytes()).hexdigest())
print('decoded_mb',round(decoded/1024/1024,2))
