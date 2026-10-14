#!/usr/bin/env python3
"""
San Francisco's leaf pages and barks for tools/sftrees (SF_PLAN.md §5), built from Trail Trainer's photographed
Poly Haven pages (CC0; assetkit's tools/deciduousgen, fetched there by fetch.py) with its own cluster
compositor (pages.py), then graded and painted for the trees this city plants:

- `glossy`     ficus: many small, dark, shiny leaves packed tight — a clipped dome reads as one dark mass
- `evergreen`  brisbane box, pittosporum, magnolia: the broad leaves, darker and a little bluer
- `olive`      olive, NZ tea tree, melaleuca: small leaves, grey-green, silvery
- `gum`        eucalyptus: the broad leaves drawn out into hanging sickles, blue-grey
- `feather`    jacaranda, pepper tree: the pinnate fronds, fresher green
- `blossom_pink`, `blossom_white`   pear, plum and cherry in flower: each cell a cloud of painted five-petal
                flowers over a few leaves; two pink, the plum's, and the pear's white
- `plum`       the cherry plum's purple leaves
- `pohutukawa` the New Zealand Christmas tree: dark leaves with the crimson brush flowers in one cell in two
- `bottlebrush` callistemon: fine grey-green with red brushes

and two barks, graded from the platanus photograph (its normal and ARM maps are used as they are):

- `plane`   the London plane's camouflage: olive, cream and grey plates
- `gum`     the eucalyptus: smooth, pale, cream to grey with a flush of pink

    python3 tools/sftrees/pages.py       (system python + Pillow) -> tools/cache/sftrees/
"""
import math
import random
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
# assetkit (github.com/dfeldman/assetkit), checked out beside this repo, or wherever $ASSETKIT_DIR points
TT = Path(os.environ.get('ASSETKIT_DIR') or Path(__file__).resolve().parents[3] / 'assetkit') / 'tools' / 'deciduousgen'
sys.path.insert(0, str(TT))
import pages as tt  # noqa: E402  (Trail Trainer's compositor: components, cluster, graded, regrade)

SRC = TT.parent / 'cache' / 'deciduousgen'
CACHE = HERE.parent / 'cache' / 'sftrees'
SIZE = 1024
CELLS = 2

PAGES = {
    'glossy': {'source': 'broad', 'count': (70, 90), 'scale': (0.12, 0.17), 'stem_in': True, 'spread': 0.3, 'seed': 21,
               'grade': {'hue_to': 95, 'val_to': 0.24, 'sat': 1.1}},
    'evergreen': {'source': 'broad', 'count': (40, 54), 'scale': (0.2, 0.3), 'stem_in': True, 'spread': 0.29, 'seed': 22,
                  'grade': {'hue_to': 88, 'val_to': 0.27, 'sat': 1.0}},
    'olive': {'source': 'broad', 'count': (95, 120), 'scale': (0.1, 0.15), 'stem_in': True, 'spread': 0.32, 'seed': 23,
              'narrow': 0.5, 'grade': {'hue_to': 80, 'val_to': 0.42, 'sat': 0.45}},
    'gum': {'source': 'broad', 'count': (34, 44), 'scale': (0.26, 0.36), 'stem_in': False, 'spread': 0.3, 'seed': 24,
            'narrow': 0.32, 'hang': True, 'grade': {'hue_to': 105, 'val_to': 0.4, 'sat': 0.42}},
    'feather': {'source': 'fine', 'count': (5, 7), 'scale': (0.55, 0.75), 'stem_in': False, 'spread': 0.4, 'seed': 25,
                'grade': {'hue_to': 78, 'val_to': 0.4, 'sat': 1.05}},
    'blossom_pink': {'source': 'broad', 'count': (18, 26), 'scale': (0.16, 0.22), 'stem_in': True, 'spread': 0.28, 'seed': 26,
                     'grade': {'hue_to': 70, 'val_to': 0.33, 'sat': 0.9}, 'flowers': [(0.97, 0.72, 0.8), (0.93, 0.6, 0.72)], 'bloom': 1.0},
    'blossom_white': {'source': 'broad', 'count': (18, 26), 'scale': (0.16, 0.22), 'stem_in': True, 'spread': 0.28, 'seed': 27,
                      'grade': {'hue_to': 74, 'val_to': 0.36, 'sat': 0.9}, 'flowers': [(0.97, 0.96, 0.92), (0.92, 0.93, 0.88)], 'bloom': 1.0},
    'plum': {'source': 'broad', 'count': (46, 60), 'scale': (0.16, 0.24), 'stem_in': True, 'spread': 0.29, 'seed': 30,
             'grade': {'hue_to': 346, 'val_to': 0.26, 'sat': 0.62}},
    'pohutukawa': {'source': 'broad', 'count': (44, 60), 'scale': (0.15, 0.22), 'stem_in': True, 'spread': 0.3, 'seed': 28,
                   'narrow': 0.7, 'grade': {'hue_to': 92, 'val_to': 0.25, 'sat': 0.9}, 'brushes': (0.78, 0.08, 0.1), 'bloom': 0.5},
    'bottlebrush': {'source': 'broad', 'count': (95, 120), 'scale': (0.1, 0.15), 'stem_in': True, 'spread': 0.32, 'seed': 29,
                    'narrow': 0.35, 'grade': {'hue_to': 85, 'val_to': 0.33, 'sat': 0.6}, 'brushes': (0.8, 0.1, 0.12), 'bloom': 0.5},
}


def sprites_of(source: str, narrow: float | None, hang: bool) -> list[Image.Image]:
    page = Image.open(SRC / f'leaf_{source}_page.png').convert('RGBA')
    boxes = tt.components(page.getchannel('A'), 64, 400 if source == 'broad' else 5000)
    out = []
    for b in boxes:
        sp = page.crop(b)
        if narrow:
            # the photographed leaves are broad ellipses: squeezed across, they are a gum's lance or a tea tree's needle
            sp = sp.resize((max(2, int(sp.width * narrow)), sp.height), Image.LANCZOS)
        if hang:
            # a gum's leaf hangs and curves: a little shear, then it is placed tip-down by cluster()
            sp = sp.transform(sp.size, Image.AFFINE, (1, 0.18, -0.09 * sp.height, 0, 1, 0), Image.BICUBIC)
        out.append(sp)
    return out


def flower(size: int, rgb: tuple, rng: random.Random) -> Image.Image:
    """A five-petal blossom: petals as soft ellipses round a darker eye."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    rot = rng.uniform(0, 72)
    for k in range(5):
        a = math.radians(rot + k * 72)
        px, py = c + math.cos(a) * size * 0.22, c + math.sin(a) * size * 0.22
        r = size * 0.2
        shade = rng.uniform(0.9, 1.05)
        col = tuple(min(255, int(255 * v * shade)) for v in rgb)
        d.ellipse((px - r, py - r, px + r, py + r), fill=col + (255,))
    e = size * 0.08
    d.ellipse((c - e, c - e, c + e, c + e), fill=(200, 170, 60, 255))
    return im


def brush(size: int, rgb: tuple, rng: random.Random) -> Image.Image:
    """A myrtle's brush flower: a burst of fine crimson stamens with pale tips."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    for _ in range(60):
        a = rng.uniform(0, 6.283)
        r = size * rng.uniform(0.25, 0.48)
        x, y = c + math.cos(a) * r, c + math.sin(a) * r * 0.8
        shade = rng.uniform(0.75, 1.1)
        col = tuple(min(255, int(255 * v * shade)) for v in rgb)
        d.line((c, c, x, y), fill=col + (255,), width=max(1, size // 40))
        d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(240, 200, 90, 255))
    return im


def build(key: str, cfg: dict) -> None:
    sprites = sprites_of(cfg['source'], cfg.get('narrow'), cfg.get('hang', False))
    rng = random.Random(cfg['seed'])
    cell = SIZE // CELLS
    atlas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    for i in range(CELLS * CELLS):
        im = tt.cluster(sprites, cfg, rng, cell)
        im = tt.regrade(im, cfg['grade'])
        # the flowers: every cell for blossom (a tree in flower is flowers first), one in two for the myrtles
        flowered = ('flowers' in cfg) or ('brushes' in cfg and i % 2 == 1)
        if flowered:
            n = 70 if 'flowers' in cfg else 9
            for _ in range(n):
                a = rng.uniform(0, 6.283)
                r = cell * 0.34 * rng.random() ** 0.7
                x, y = cell / 2 + math.cos(a) * r, cell * 0.55 + math.sin(a) * r * 0.85
                if 'flowers' in cfg:
                    f = flower(int(cell * rng.uniform(0.07, 0.11)), rng.choice(cfg['flowers']), rng)
                else:
                    f = brush(int(cell * rng.uniform(0.16, 0.24)), cfg['brushes'], rng)
                im.alpha_composite(f, (int(x - f.width / 2), int(y - f.height / 2)))
        atlas.alpha_composite(im, ((i % CELLS) * cell, (i // CELLS) * cell))
    finish(key, atlas)


def finish(key: str, atlas: Image.Image) -> None:
    rgb = atlas.convert('RGB')
    a = atlas.getchannel('A')
    halo = rgb.copy()
    for _ in range(3):
        halo = halo.filter(ImageFilter.MaxFilter(3))
    rgb = Image.composite(rgb, halo, a.point(lambda v: 255 if v > 8 else 0))
    rgb.putalpha(a)
    rgb.save(CACHE / f'leaf_{key}_atlas.png', optimize=True)
    rgb.resize((512, 512), Image.LANCZOS).save(CACHE / f'leaf_{key}_atlas_512.png', optimize=True)
    print(f'  -> leaf_{key}_atlas.png')


def bark(key: str, palette: list[tuple], blotch: float, seed: int, relief: float = 1.3) -> None:
    """A bark graded from the platanus photograph: its relief kept as value, recoloured in patches from the palette."""
    for sfx, size in (('', 1024), ('_512', 512)):
        src = Image.open(SRC / f'bark_platanus_diff{sfx}.jpg').convert('L')
        w, h = src.size
        rng = random.Random(seed)
        # the patches: flakes, irregular rounded polygons of the palette over its first colour, drawn wrapped so the
        # tile repeats without a seam, softened a little at the edges
        plates = Image.new('RGB', (w, h), tuple(int(255 * v) for v in palette[0]))
        d = ImageDraw.Draw(plates)
        for _ in range(int(260 * blotch)):
            col = tuple(int(255 * v) for v in rng.choice(palette))
            cx, cy = rng.uniform(0, w), rng.uniform(0, h)
            rx, ry = w * rng.uniform(0.03, 0.12) / max(blotch, 0.3), h * rng.uniform(0.04, 0.16) / max(blotch, 0.3)
            n = rng.randint(7, 11)
            pts = []
            for k in range(n):
                t = 6.283 * k / n
                j = rng.uniform(0.6, 1.15)
                pts.append((cx + math.cos(t) * rx * j, cy + math.sin(t) * ry * j))
            for ox in (-w, 0, w):
                for oy in (-h, 0, h):
                    d.polygon([(x + ox, y + oy) for x, y in pts], fill=col)
        plates = plates.filter(ImageFilter.GaussianBlur(w / 400))
        # the photograph's relief, re-centred on its mean, multiplied into the plates (128 → ×1)
        mean = sum(src.getdata()) / (w * h)
        rel = src.point(lambda v: max(0, min(255, int(2 * (128 + (v - mean) * relief)) - 40)))
        res = [ImageChops.multiply(ch, rel) for ch in plates.split()]
        Image.merge('RGB', res).save(CACHE / f'bark_{key}_diff{sfx}.jpg', quality=90)
    print(f'  -> bark_{key}_diff.jpg')


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    for key, cfg in PAGES.items():
        build(key, cfg)
    bark('plane', [(0.62, 0.6, 0.45), (0.78, 0.76, 0.6), (0.5, 0.52, 0.42), (0.7, 0.66, 0.52), (0.58, 0.58, 0.55)], 1.0, 31)
    bark('gum', [(0.82, 0.78, 0.7), (0.74, 0.72, 0.68), (0.84, 0.74, 0.68), (0.66, 0.66, 0.62)], 0.5, 32, 0.55)
    bark('ficus', [(0.62, 0.6, 0.56), (0.58, 0.57, 0.54), (0.66, 0.64, 0.6)], 0.3, 33, 0.5)


if __name__ == '__main__':
    sys.exit(main())
