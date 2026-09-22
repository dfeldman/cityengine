#!/usr/bin/env python3
"""
The road surfaces. Seamless pages, one per thing a street can be made of.

    python3 tools/roadgen/paint.py            → public/roads/<surface>.png
    python3 tools/roadgen/paint.py --sheet    and a contact sheet

A road is most of what a rider looks at — it fills the bottom half of the screen for the whole session — and
a flat grey ribbon is the fastest way to make a city look like a diagram. What makes asphalt read as asphalt,
in order of how much each is worth:

  * **Aggregate at two scales.** Asphalt is stone in tar: a fine speckle everywhere, and a sparser scatter of
    larger chips. One scale alone looks like noise; two looks like a material.
  * **Wheel polish.** Traffic burnishes two bands where the tyres run, and leaves the crown between them and
    the gutters either side rougher and darker. It is the single mark that says a road is *used*.
  * **Repairs.** Tar seams wandering down the lane, rectangular patches in a slightly different shade, a few
    cracks. Real roads are mended, and an unmended one looks CG.

Markings are NOT painted here. They are drawn in the shader from the rider's distance across the carriageway,
because a texture of a centre line would have to be stretched to a street's width and would drift off centre
every time the road changed width. See `src/render/road-material.ts`.

Pillow only, as with the facades, and everything generated from nothing — so all of it is CC0.
"""
import argparse
import math
import random
import zlib
import sys
from pathlib import Path


def stable(text: str) -> int:
    """A hash that does not change between runs.

    Python salts `hash()` of a string per process, so seeding anything with it produced
    different art on every run — which made `--seed` meaningless and broke the rule that a
    re-bake leaves the city exactly as it was."""
    return zlib.crc32(text.encode())


from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'facadegen'))
import draw as fd  # noqa: E402  — the shared grain/blotch helpers

OUT = Path(__file__).resolve().parent.parent.parent / 'public' / 'roads'
SIZE = 512
# one page covers this many metres, so the shader knows what scale to sample it at
METRES = 6.0


def aggregate(img, rnd, n, size_range, light, dark):
    """Stone chips in tar. Drawn as short ellipses at random angles so they do not read as dots."""
    d = ImageDraw.Draw(img)
    w, h = img.size
    for _ in range(n):
        x, y = rnd.randrange(w), rnd.randrange(h)
        r = rnd.uniform(*size_range)
        v = rnd.randint(dark, light)
        e = r * rnd.uniform(0.5, 1.0)
        d.ellipse([x - r, y - e, x + r, y + e], fill=(v, v - 1, v - 2, 255))
        # a chip catches light on one side and shades on the other
        d.arc([x - r, y - e, x + r, y + e], 200, 340, fill=(min(255, v + 16),) * 3 + (255,))


def asphalt(size, rnd):
    img = Image.new('RGBA', (size, size), (58, 58, 60, 255))
    d = ImageDraw.Draw(img)

    aggregate(img, rnd, size * 26, (0.6, 1.6), 96, 44)       # the fine speckle, everywhere
    aggregate(img, rnd, size * 2, (1.8, 3.6), 120, 62)       # the larger chips, sparser

    # patches: a rectangle of road relaid at a slightly different age
    for _ in range(rnd.randint(1, 3)):
        pw, ph = rnd.randint(size // 6, size // 2), rnd.randint(size // 8, size // 3)
        px, py = rnd.randrange(size), rnd.randrange(size)
        patch = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
        pd = ImageDraw.Draw(patch)
        tone = rnd.randint(-14, 12)
        pd.rectangle([0, 0, pw, ph], fill=(58 + tone, 58 + tone, 60 + tone, 255))
        aggregate(patch, rnd, pw * ph // 22, (0.6, 1.5), 92 + tone, 42 + tone)
        pd.rectangle([0, 0, pw - 1, ph - 1], outline=(38, 38, 40, 255), width=2)
        for dx in (0, size):                                  # wrapped, so the page still tiles
            for dy in (0, size):
                img.alpha_composite(patch, (px - dx, py - dy))

    # tar seams: a mended crack, wandering, slightly proud and shiny
    for _ in range(rnd.randint(2, 4)):
        x = rnd.randrange(size)
        y = 0
        pts = []
        while y < size:
            pts.append((x, y))
            x += rnd.randint(-3, 3)
            y += rnd.randint(6, 16)
        pts.append((x, size))
        d.line(pts, fill=(44, 43, 44, 255), width=rnd.randint(3, 6), joint='curve')
        d.line(pts, fill=(74, 73, 74, 255), width=1)

    # hairline cracks, which are darker than everything and very thin
    for _ in range(rnd.randint(3, 7)):
        x, y = rnd.randrange(size), rnd.randrange(size)
        a = rnd.uniform(0, math.tau)
        pts = [(x, y)]
        for _ in range(rnd.randint(3, 8)):
            a += rnd.uniform(-0.7, 0.7)
            x += math.cos(a) * rnd.randint(6, 20)
            y += math.sin(a) * rnd.randint(6, 20)
            pts.append((x, y))
        d.line(pts, fill=(40, 39, 40, 255), width=1)

    fd.blotches(img, rnd, 16, 10, 30, 90)
    fd.grain(img, rnd, 4)
    return img


def cobblestone(size, rnd):
    """Sett paving: rows of roughly square stones with deep joints, the rows bowing slightly. Paris is full
    of it, and it is the one surface a rider feels — the ride model gives it three times asphalt's rolling
    resistance."""
    img = Image.new('RGBA', (size, size), (44, 43, 42, 255))
    d = ImageDraw.Draw(img)
    # Paris's pavés are about 14 cm: 40 to the 6 m tile. At a quarter of their old size they read as setts,
    # not as the big paving slabs they looked like
    stone = max(6, size // 40)
    rows = size // stone
    for r in range(rows):
        y = r * stone
        offset = rnd.randrange(stone) if r % 2 else 0
        x = -offset
        while x < size:
            w = stone + rnd.randint(-1, 2)
            v = rnd.randint(88, 142)
            c = (v, v - rnd.randint(0, 6), v - rnd.randint(2, 12))
            bow = int(math.sin((x / size) * math.tau * 2) * 1.2)
            box = [x + 1, y + 1 + bow, x + w - 1, y + stone - 1 + bow]
            d.rectangle(box, fill=(*c, 255))
            d.line([(box[0], box[1]), (box[2], box[1])], fill=(*fd.shade(c, 1.2), 255))
            d.line([(box[0], box[3]), (box[2], box[3])], fill=(*fd.shade(c, 0.7), 255))
            x += w
    fd.blotches(img, rnd, 20, 12, 20, 60)
    fd.grain(img, rnd, 6)
    return img


def concrete(size, rnd):
    """A concrete carriageway or a paved footway: big slabs, expansion joints, a brushed finish."""
    img = Image.new('RGBA', (size, size), (146, 144, 140, 255))
    d = ImageDraw.Draw(img)
    slab = size // 3
    for i in range(0, size + slab, slab):
        d.line([(i, 0), (i, size)], fill=(118, 116, 113, 255), width=3)
        d.line([(0, i), (size, i)], fill=(118, 116, 113, 255), width=3)
        d.line([(i + 3, 0), (i + 3, size)], fill=(162, 160, 156, 255), width=1)
    for y in range(0, size, 2):                               # the brush marks
        v = rnd.randint(-6, 6)
        d.line([(0, y), (size, y)], fill=(146 + v, 144 + v, 140 + v, 255))
    fd.blotches(img, rnd, 14, 12, 30, 80)
    fd.grain(img, rnd, 5)
    return img


def gravel(size, rnd):
    img = Image.new('RGBA', (size, size), (128, 120, 106, 255))
    aggregate(img, rnd, size * 40, (0.8, 2.4), 176, 92)
    aggregate(img, rnd, size * 4, (2.4, 4.4), 190, 110)
    fd.blotches(img, rnd, 18, 14, 25, 70)
    fd.grain(img, rnd, 7)
    return img


def dirt(size, rnd):
    img = Image.new('RGBA', (size, size), (104, 86, 66, 255))
    aggregate(img, rnd, size * 12, (0.8, 2.0), 132, 74)
    d = ImageDraw.Draw(img)
    for _ in range(rnd.randint(6, 12)):                       # ruts and dried tracks
        y = rnd.randrange(size)
        d.line([(0, y), (size, y + rnd.randint(-4, 4))], fill=(92, 76, 58, 255), width=rnd.randint(2, 7))
    fd.blotches(img, rnd, 24, 16, 30, 90)
    fd.grain(img, rnd, 8)
    return img


def wood(size, rnd):
    """A boardwalk. Rare, but OSM tags it and a plain grey ribbon where the map says timber looks wrong."""
    img = Image.new('RGBA', (size, size), (118, 92, 64, 255))
    d = ImageDraw.Draw(img)
    plank = size // 8
    for i in range(0, size, plank):
        v = rnd.randint(-16, 16)
        d.rectangle([0, i, size, i + plank - 2], fill=(118 + v, 92 + v, 64 + v, 255))
        d.line([(0, i + plank - 2), (size, i + plank - 2)], fill=(72, 56, 38, 255), width=2)
        for _ in range(rnd.randint(2, 5)):                    # grain
            y = i + rnd.randrange(max(1, plank - 3))
            d.line([(0, y), (size, y)], fill=(104 + v, 80 + v, 54 + v, 255))
    fd.grain(img, rnd, 6)
    return img


def grass(size, rnd):
    """What is between the buildings where OSM mapped nothing: yards, verges, the inside of a block. Most
    cities are green there, and painting it concrete — which is what the first version did — made every
    courtyard read as a car park."""
    img = Image.new('RGBA', (size, size), (74, 96, 52, 255))
    d = ImageDraw.Draw(img)
    for _ in range(size * 30):                                # blades, as short strokes at random angles
        x, y = rnd.randrange(size), rnd.randrange(size)
        a = rnd.uniform(0, math.tau)
        L = rnd.uniform(1.5, 4.0)
        v = rnd.randint(-22, 26)
        d.line([(x, y), (x + math.cos(a) * L, y + math.sin(a) * L)],
               fill=(74 + v, 96 + v, 52 + max(-20, v // 2), 255))
    fd.blotches(img, rnd, 22, 16, 25, 80)                     # patches of dry and lush
    fd.grain(img, rnd, 5)
    return img


def sand(size, rnd):
    """The same job in a dry city. Ripples rather than blades."""
    img = Image.new('RGBA', (size, size), (192, 170, 132, 255))
    d = ImageDraw.Draw(img)
    for y in range(0, size, 3):
        v = rnd.randint(-8, 8)
        wob = math.sin(y * 0.06) * 3
        d.line([(0, y + wob), (size, y + wob)], fill=(192 + v, 170 + v, 132 + v, 255))
    aggregate(img, rnd, size * 6, (0.6, 1.6), 226, 160)
    fd.blotches(img, rnd, 18, 12, 30, 90)
    fd.grain(img, rnd, 6)
    return img


SURFACES = {
    'asphalt': asphalt, 'cobblestone': cobblestone, 'concrete': concrete,
    'gravel': gravel, 'dirt': dirt, 'wood': wood, 'grass': grass, 'sand': sand,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet', action='store_true')
    ap.add_argument('--seed', type=int, default=20260920)
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    for name, fn in SURFACES.items():
        img = fn(SIZE, random.Random(args.seed ^ (stable(name) & 0xffffffff)))
        img.save(OUT / f'{name}.png')
        print(f'  roads/{name}.png')

    (OUT / 'roads.json').write_text(
        '{\n "metres": %s,\n "size": %d,\n "surfaces": [%s]\n}\n'
        % (METRES, SIZE, ', '.join(f'"{k}"' for k in SURFACES)))

    if args.sheet:
        S = 256
        sheet = Image.new('RGB', (S * len(SURFACES), S), (20, 20, 22))
        for i, (name, fn) in enumerate(SURFACES.items()):
            t = fn(SIZE, random.Random(args.seed ^ (stable(name) & 0xffffffff)))
            sheet.paste(t.convert('RGB').resize((S, S)), (i * S, 0))
        sheet.save(OUT / 'sheet.png')
        print(f'  roads/sheet.png  {sheet.width}x{sheet.height}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
