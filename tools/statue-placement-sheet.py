#!/usr/bin/env python3
"""Map tiles of placed statues, for a reviewer to check where they stand and which way they face: one 50 m square per
statue, from the --report JSON of tools/img2glb-statues.ts. Buildings grey, carriageways at their assumed width, paths
as thin lines; the statue a red disc (its plinth or footprint) with an arrow along its bearing, an x where its source
point was if it was moved, a blue tick towards the photo's camera.

    python3 -I tools/statue-placement-sheet.py report.json out-prefix [--cols=6] [--per=36]
writes out-prefix-1.jpg, -2.jpg …, and out-prefix.txt (tile number → id).
"""
import json, math, sys
from PIL import Image, ImageDraw, ImageFont

TILE = 220          # px
SPAN = 50.0         # metres across a tile
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
COLS, PER = int(opt.get('cols', 6)), int(opt.get('per', 36))
data = json.load(open(args[0]))['sheet']
ids = sorted(data)
k = TILE / SPAN
font = ImageFont.load_default()


def tile(s):
    im = Image.new('RGB', (TILE, TILE + 14), (236, 240, 228))
    d = ImageDraw.Draw(im)
    cx, cz = s['at']['x'], s['at']['z']
    px = lambda p: (TILE / 2 + (p['x'] - cx) * k, TILE / 2 - (p['z'] - cz) * k)
    for r in s['roads']:
        pts = [px(p) for p in r['pts']]
        if len(pts) > 1:
            d.line(pts, fill=(170, 170, 175) if r['hw'] else (205, 190, 160), width=max(1, int((r['hw'] or 0.6) * 2 * k)))
    for rings in s['buildings']:
        for i, ring in enumerate(rings):
            if len(ring) > 2:
                d.polygon([px(p) for p in ring], fill=(150, 140, 130) if i == 0 else (236, 240, 228), outline=(90, 80, 70))
    if s.get('camera'):
        c = s['camera']
        a = math.atan2(c['x'] - cx, c['z'] - cz)
        d.line([px(s['at']), (TILE / 2 + math.sin(a) * TILE * 0.48, TILE / 2 - math.cos(a) * TILE * 0.48)], fill=(40, 90, 220), width=1)
    f = s['from']
    if abs(f['x'] - cx) + abs(f['z'] - cz) > 0.3:
        q = px(f)
        d.line([q[0] - 4, q[1] - 4, q[0] + 4, q[1] + 4], fill=(200, 0, 0), width=2)
        d.line([q[0] - 4, q[1] + 4, q[0] + 4, q[1] - 4], fill=(200, 0, 0), width=2)
    r = max(3, s['radius'] * k)
    d.ellipse([TILE / 2 - r, TILE / 2 - r, TILE / 2 + r, TILE / 2 + r], fill=(220, 40, 40))
    b = math.radians(s['bearing'])
    tip = (TILE / 2 + math.sin(b) * (r + 22), TILE / 2 - math.cos(b) * (r + 22))
    d.line([(TILE / 2, TILE / 2), tip], fill=(200, 0, 0), width=3)
    d.ellipse([tip[0] - 4, tip[1] - 4, tip[0] + 4, tip[1] + 4], fill=(200, 0, 0))
    return im


lines = []
for page in range(0, len(ids), PER):
    chunk = ids[page:page + PER]
    rows = math.ceil(len(chunk) / COLS)
    sheet = Image.new('RGB', (COLS * TILE, rows * (TILE + 14)), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    for i, id_ in enumerate(chunk):
        n = page + i + 1
        x, y = (i % COLS) * TILE, (i // COLS) * (TILE + 14)
        sheet.paste(tile(data[id_]), (x, y))
        d.rectangle([x, y, x + TILE - 1, y + TILE + 13], outline=(0, 0, 0))
        d.text((x + 3, y + TILE + 1), f"{n} {id_[:30]}", fill=(0, 0, 0), font=font)
        lines.append(f"{n}\t{id_}\t{data[id_]['name']}")
    sheet.save(f"{args[1]}-{page // PER + 1}.jpg", quality=80)
open(f"{args[1]}.txt", 'w').write('\n'.join(lines) + '\n')
print(f"{len(ids)} tiles in {math.ceil(len(ids) / PER)} sheet(s): {args[1]}-N.jpg")
