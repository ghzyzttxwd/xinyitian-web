from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image
import io, json, hashlib, time

BASE='https://xyttlj-static.xyimg.net/game/'
OUT=Path('assets/original/huangshan-1000018-event')
META=OUT/'meta.json'
OUT.mkdir(parents=True,exist_ok=True)
EXPECT={
 'role-ult-q82.webp':'0ece61b7dcaeff4ddef8234d914b82b7dba466a823c210ef8b3e700a627d7377',
 'magic-q82.webp':'70fef4301c082ebd3b2fb5ba19101147a3d6c68fb3f22b989fdea0298d979e53',
 'skillname.png':'9bc37e823b37b28e9d134a66d8fc5a1da1ff90f5e99d2c5529d3355b33a1e904',
 '4910451.mp3':'ae6b9ac636d1d2e5bee6860523b01621e77dc8ad15a99b66586fc7c0641e1c30',
}

def fetch(rel):
    last=None
    for attempt in range(4):
        try:
            req=Request(BASE+rel,headers={'User-Agent':'Mozilla/5.0 XYT-offline-builder'})
            with urlopen(req,timeout=45) as r:
                data=r.read()
            if not data: raise RuntimeError('empty response')
            return data
        except Exception as e:
            last=e
            if attempt<3: time.sleep(1.5*(attempt+1))
    raise RuntimeError(f'fetch failed {rel}: {last}')

def parse_cfg(data):
    if len(data)<2: raise RuntimeError('cfg too short')
    count=int.from_bytes(data[:2],'big')
    need=2+count*12
    if len(data)<need: raise RuntimeError(f'cfg truncated: {len(data)} < {need}')
    out=[]
    for i in range(count):
        p=2+i*12
        out.append([
            int.from_bytes(data[p:p+2],'big',signed=True),
            int.from_bytes(data[p+2:p+4],'big',signed=True),
            int.from_bytes(data[p+4:p+6],'big'),
            int.from_bytes(data[p+6:p+8],'big'),
            int.from_bytes(data[p+8:p+10],'big'),
            int.from_bytes(data[p+10:p+12],'big'),
        ])
    return out

def paste_sheet(atlas, png_rel, cfg_rel, dest_frames):
    src=Image.open(io.BytesIO(fetch(png_rel))).convert('RGBA')
    cfg=parse_cfg(fetch(cfg_rel))
    if len(cfg)!=len(dest_frames):
        raise RuntimeError(f'frame count mismatch {png_rel}: source={len(cfg)} meta={len(dest_frames)}')
    for idx,(source,dest) in enumerate(zip(cfg,dest_frames)):
        _ox,_oy,w,h,x,y=source
        _dox,_doy,dw,dh,dx,dy=dest
        dw,dh,dx,dy=map(int,(dw,dh,dx,dy))
        if w<=0 or h<=0 or x<0 or y<0 or x+w>src.width or y+h>src.height:
            raise RuntimeError(f'bad source frame bounds {png_rel} #{idx}')
        if dw<=0 or dh<=0 or dx<0 or dy<0 or dx+dw>atlas.width or dy+dh>atlas.height:
            raise RuntimeError(f'bad atlas frame bounds {png_rel} #{idx}')
        crop=src.crop((x,y,x+w,y+h))
        if crop.size!=(dw,dh): crop=crop.resize((dw,dh),Image.Resampling.LANCZOS)
        atlas.alpha_composite(crop,(dx,dy))

meta=json.loads(META.read_text(encoding='utf-8'))
role_size=tuple(meta['role']['size'])
magic_size=tuple(meta['magic']['size'])
if role_size!=(512,840) or magic_size!=(1536,800):
    raise SystemExit(f'unexpected atlas sizes: role={role_size} magic={magic_size}')

role=Image.new('RGBA',role_size,(0,0,0,0))
paste_sheet(role,
    'resself/model/role/att2/1000018_v2.png',
    'resself/model/role/att2/1000018_v2.cfg',
    meta['role']['frames']['att2'])
role.save(OUT/'role-ult-q82.webp','WEBP',quality=82,method=4)

magic=Image.new('RGBA',magic_size,(0,0,0,0))
for key,dest_frames in meta['magic']['frames'].items():
    if not key.startswith('m') or not key[1:].isdigit(): raise RuntimeError(f'bad magic key {key}')
    suffix=key[1:]
    paste_sheet(magic,
        f'resself/model/magic/atlas/491045{suffix}_v2.png',
        f'resself/model/magic/atlas/491045{suffix}_v2.cfg',
        dest_frames)
magic.save(OUT/'magic-q82.webp','WEBP',quality=82,method=4)

(OUT/'skillname.png').write_bytes(fetch('res/icon/skillname/4010451_v2.png'))
(OUT/'4910451.mp3').write_bytes(fetch('resself/sound/4910451_v2.mp3'))

for name,expected in EXPECT.items():
    p=OUT/name
    actual=hashlib.sha256(p.read_bytes()).hexdigest()
    if actual!=expected: raise SystemExit(f'{name} sha mismatch: {actual} != {expected}')

for name,dim in [('role-ult-q82.webp',role_size),('magic-q82.webp',magic_size)]:
    im=Image.open(OUT/name)
    if im.size!=dim or im.mode!='RGBA': raise SystemExit(f'{name} decode mismatch: {im.size} {im.mode}')

budget=(role_size[0]*role_size[1]+magic_size[0]*magic_size[1])*4
if budget>7*1024*1024: raise SystemExit(f'decoded budget too high: {budget}')
print('verified Huangshan static assets; decoded MB=',round(budget/1024/1024,2))
for name in EXPECT:
    p=OUT/name
    print(name,p.stat().st_size,hashlib.sha256(p.read_bytes()).hexdigest())
