"""photo | today's render (the generics) | the appearance model's | the labelled render — those that were shot — one row per building.
python3 -I compose.py <elevdir> <gold.jsonl> <out.jpg> [ids]"""
import json
import os
import sys
from PIL import Image, ImageDraw

elev, goldp, out = sys.argv[1:4]
gold = {json.loads(l)['osm'].split('/')[1]: json.loads(l) for l in open(goldp)}
ids = sys.argv[4].split(',') if len(sys.argv) > 4 else sorted({f.split('-')[0] for f in os.listdir(elev) if f.endswith(('-look.png', '-imputed.png', '-gated.png'))})
H = 420
rows = []
for i in ids:
    base, look, imp, gat = (f'{elev}/{i}-{t}.png' for t in ('base', 'look', 'imputed', 'gated'))
    if not (os.path.exists(base) and any(os.path.exists(p) for p in (look, imp, gat))):
        continue
    d = f'/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-{i}/'
    best = gold.get(i, {}).get('best')
    pics = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
    photo = d + (best if best in pics else (best + '.jpg' if best and best + '.jpg' in pics else pics[0]))
    paths = [photo, base] + [p for p in (imp, gat, look) if os.path.exists(p)]
    ims = [Image.open(p).convert('RGB') for p in paths]
    ims = [im.resize((int(im.width * H / im.height), H)) for im in ims]
    row = Image.new('RGB', (sum(im.width for im in ims) + 20, H + 22), 'white')
    x = 0
    for im in ims:
        row.paste(im, (x, 22))
        x += im.width + 10
    ImageDraw.Draw(row).text((4, 4), f'way/{i}   photo | today | ' + ' | '.join(t for t, p in (('model', imp), ('gated', gat), ('from labels', look)) if os.path.exists(p)), fill='black')
    rows.append(row)
    os.makedirs(f'{elev}/rows', exist_ok=True)
    row.save(f'{elev}/rows/{i}.jpg', quality=88)
W = max(r.width for r in rows)
sheet = Image.new('RGB', (W, sum(r.height for r in rows)), 'white')
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(out, quality=85)
print(out, len(rows))
