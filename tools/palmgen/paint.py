"""
The palm textures (src/render/palms.ts; SF_PLAN.md §5): painted once, offline, into public/palms/.

A palm looks like a palm because of the leaflets — hundreds of them, each catching the light differently —
and no amount of geometry gets there on a budget. So the fronds are CARDS: a strip along the curved rachis,
folded into a V, wearing a painting of the leaflets with the gaps between them cut out (alpha test, as the
rest of the foliage). What makes a painted frond read as real:

- the leaflets are not a comb. They leave the rachis at varied angles, lengths and spacings, in groups, some
  crossing others, a few broken or missing;
- colour varies per leaflet: darker and bluer toward the base, yellower toward the tips, a lighter midrib;
- the base of a Canary frond is SPINES, not leaflets — short, stiff and yellow;
- the fan palm's leaf splits at its edge into drooping segments with thin filaments between them.

  python3 tools/palmgen/paint.py            # writes public/palms/*.png and a sheet.png to look at
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / 'public' / 'palms'


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def jit(rnd, c, k):
    """Vary brightness, not hue: jittering each channel on its own is what turned a brown trunk pink and green."""
    dv = rnd.uniform(-k, k)
    return tuple(max(0, min(255, int(v + dv + rnd.uniform(-k, k) * 0.15))) for v in c)


def tapered(d: ImageDraw.ImageDraw, p0, p1, w0, w1, fill):
    """A tapered stroke from p0 (width w0) to p1 (width w1): a leaflet, a spine, a filament."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    d.polygon([(p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2), (p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2),
               (p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2), (p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2)], fill=fill)


def curved_leaflet(d, p0, direction, length, width, bend, fill, mid, segs=6):
    """A leaflet: a slightly curved, tapering blade with a lighter midrib, drawn in a few straight pieces."""
    ang = direction
    x, y = p0
    pts = [(x, y)]
    for i in range(segs):
        ang += bend / segs
        x += math.cos(ang) * length / segs
        y += math.sin(ang) * length / segs
        pts.append((x, y))
    for i in range(segs):
        t0, t1 = i / segs, (i + 1) / segs
        prof = lambda t: width * (min(1.0, t * 5) if t < 0.2 else (1 - t) ** 0.7)  # narrow at the base, pointed tip
        tapered(d, pts[i], pts[i + 1], max(1, prof(t0)), max(0.6, prof(t1)), fill)
    for i in range(segs - 1):
        d.line([pts[i], pts[i + 1]], fill=mid, width=1)


def canary_frond(rnd: random.Random, W=1024, H=512) -> Image.Image:
    """Phoenix canariensis: a pinnate frond laid along +u, the rachis on the middle line, leaflets both sides.
    u is 4.8 m of frond, v is 1.9 m across (0.95 each side of the rachis)."""
    img = Image.new('RGBA', (W, H), (60, 90, 40, 0))
    d = ImageDraw.Draw(img)
    cy = H / 2
    pu = W / 4.8                 # px per metre along
    pv = H / 1.9                 # px per metre across
    base_col = (40, 72, 34)
    tip_col = (96, 124, 50)
    # the leaflets, both sides, from the tip back so the base ones lie over them
    positions = []
    s = 0.55
    while s < 4.75:
        positions.append(s)
        s += rnd.uniform(0.012, 0.026)
    for s in reversed(positions):
        t = s / 4.8
        # the length profile: the longest a third of the way out, short at the tip
        L = 1.3 * (math.sin(min(1.0, max(0.0, (t - 0.08) / 0.92)) * math.pi) ** 1.1) * rnd.uniform(0.78, 1.02) + 0.08
        for side in (-1, 1):
            if rnd.random() < 0.05:
                continue             # one gone
            # leaflets point forward and stand in groups at different angles (Phoenix's are in several planes,
            # which the V fold gives in 3D; here the angle varies)
            ang = math.radians(rnd.uniform(34, 62)) * side
            # inside the card: never past its edge across, nor past the tip (a clipped leaflet is a straight
            # cut, and a row of them is a ruler line along the frond)
            L = min(L, 0.9 / abs(math.sin(ang)), (4.78 - s) / math.cos(ang) * 0.95)
            col = lerp(base_col, tip_col, min(1, t * 1.1 + rnd.uniform(-0.15, 0.15)))
            col = jit(rnd, col, 10)
            if rnd.random() < 0.06:
                col = lerp(col, (150, 130, 70), 0.6)     # a yellowing one
            mid = lerp(col, (190, 200, 120), 0.35)
            p0 = (s * pu, cy + side * 3)
            # in pixels: forward along u, out along v (the two scales differ, so convert)
            dirx = math.cos(ang) * pu
            diry = math.sin(ang) * pv
            a = math.atan2(diry, dirx)
            length_px = L * math.hypot(math.cos(ang) * pu, math.sin(ang) * pv)
            curved_leaflet(d, p0, a, length_px, rnd.uniform(7, 11), -side * rnd.uniform(0.0, 0.3), (*col, 255), (*mid, 255))
    # the spines at the base: short, stiff, yellow-green, in the first half metre
    s = 0.05
    while s < 0.6:
        for side in (-1, 1):
            ang = math.radians(rnd.uniform(35, 60)) * side
            L = rnd.uniform(0.08, 0.18) + s * 0.25
            p0 = (s * pu, cy)
            p1 = (p0[0] + math.cos(ang) * L * pu, p0[1] + math.sin(ang) * L * pv)
            tapered(d, p0, p1, 3, 0.8, (170, 160, 80, 255))
        s += rnd.uniform(0.03, 0.06)
    # the rachis over them all: broad and yellow-green at the base, thin at the tip
    for i in range(60):
        t0, t1 = i / 60, (i + 1) / 60
        tapered(d, (t0 * W, cy), (t1 * W, cy), 14 * (1 - t0) + 3, 14 * (1 - t1) + 3, (*lerp((168, 158, 86), (96, 120, 50), t0), 255))
        d.line([(t0 * W, cy - 2), (t1 * W, cy - 2)], fill=(*lerp((200, 190, 120), (130, 150, 80), t0), 255), width=1)
    return img


def fan_leaf(rnd: random.Random, S=512) -> Image.Image:
    """Washingtonia robusta: a costapalmate fan, drawn as seen from the front, the stalk's end at the bottom
    middle. Radiating pleated segments, joined for the inner 55% and free beyond, their tips drooping and
    split, with thread-like filaments hanging in the gaps (fewer on robusta than on filifera)."""
    img = Image.new('RGBA', (S, S), (70, 110, 50, 0))
    d = ImageDraw.Draw(img)
    cx, cy = S / 2, S * 0.56
    R = S * 0.5
    n = 64
    spread = math.radians(250)        # most of a circle: the fan is round, its lowest segments hanging
    base = (56, 104, 42)
    joined = R * 0.52
    for i in range(n):
        a0 = -math.pi / 2 - spread / 2 + spread * i / n
        a1 = a0 + spread / n
        am = (a0 + a1) / 2
        col = jit(rnd, lerp(base, (88, 134, 58), 0.3 + 0.4 * math.sin(i * 0.7) ** 2), 6)
        dark = lerp(col, (22, 44, 22), 0.28)
        shade = col if i % 2 == 0 else dark
        # the joined blade, graded dark at the stalk to light at the edge: a strip of small wedges
        steps = 8
        for k in range(steps):
            r0 = R * 0.06 + (joined - R * 0.06) * k / steps
            r1 = R * 0.06 + (joined - R * 0.06) * (k + 1) / steps
            c = lerp(lerp(shade, (20, 40, 20), 0.3), shade, k / steps)
            d.polygon([(cx + math.cos(a0) * r0, cy + math.sin(a0) * r0), (cx + math.cos(a0) * r1, cy + math.sin(a0) * r1),
                       (cx + math.cos(a1) * r1, cy + math.sin(a1) * r1), (cx + math.cos(a1) * r0, cy + math.sin(a1) * r0)],
                      fill=(*c, 255))
        # the free segment: narrow, folded, drooping under its own weight (more the further round it is), and
        # split at the very tip
        L = R * rnd.uniform(0.34, 0.46)
        side = math.cos(am)                 # -1 at the left, +1 at the right, 0 at the top
        droop = side * rnd.uniform(0.5, 0.9) + rnd.uniform(-0.1, 0.1)
        p = (cx + math.cos(am) * joined, cy + math.sin(am) * joined)
        curved_leaflet(d, p, am, L, (a1 - a0) * joined * 1.05, droop, (*shade, 255), (*lerp(col, (150, 172, 100), 0.3), 255), 8)
        if rnd.random() < 0.25:
            fp = (cx + math.cos(a1) * joined, cy + math.sin(a1) * joined)
            tapered(d, fp, (fp[0] + math.cos(a1) * L * 0.6, fp[1] + math.sin(a1) * L * 0.6 + L * 0.35), 1.4, 0.7, (186, 176, 146, 255))
    return img


def skirt(rnd: random.Random, W=256, H=512) -> Image.Image:
    """The fan palm's skirt of dead leaves hanging against the trunk: brown-grey, straw-coloured strands,
    layered, ragged at the bottom. Wraps round a cone; u around, v down."""
    img = Image.new('RGBA', (W, H), (140, 116, 84, 0))
    d = ImageDraw.Draw(img)
    for layer in range(5):
        for i in range(40):
            x = rnd.uniform(-8, W + 8)
            y0 = layer * H * 0.12 + rnd.uniform(0, H * 0.05)
            L = H * rnd.uniform(0.35, 0.95)
            col = jit(rnd, lerp((104, 88, 68), (176, 160, 128), rnd.random() ** 1.5), 14)
            tapered(d, (x, y0), (x + rnd.uniform(-10, 10), min(H - 2, y0 + L)), rnd.uniform(7, 14), 2, (*col, 255))
            d.line([(x, y0), (x, min(H - 2, y0 + L * 0.9))], fill=(*lerp(col, (80, 64, 44), 0.5), 255), width=1)
    return img


def canary_trunk(rnd: random.Random, W=256, H=512) -> Image.Image:
    """The Canary palm's trunk: the diamond pattern of old leaf bases cut off flush, brown-grey, the ridges
    lighter where the light catches them. Tiles in u (round the trunk) and v (up it)."""
    img = Image.new('RGBA', (W, H), (98, 84, 66, 255))
    d = ImageDraw.Draw(img)
    cw, ch = W / 8, H / 12
    for j in range(-1, 14):
        for i in range(-1, 10):
            x = i * cw + (j % 2) * cw / 2
            y = j * ch
            col = jit(rnd, (100, 88, 72), 9)
            d.polygon([(x, y - ch * 0.62), (x + cw * 0.56, y), (x, y + ch * 0.62), (x - cw * 0.56, y)], fill=(*col, 255))
            # fibre across the scar
            for k in range(4):
                fy = y - ch * 0.4 + k * ch * 0.25
                d.line([(x - cw * 0.3, fy), (x + cw * 0.3, fy + rnd.uniform(-2, 2))], fill=(*jit(rnd, col, 14), 255), width=1)
            # the scar's lit upper edge and shadowed lower edge
            d.line([(x - cw * 0.56, y), (x, y - ch * 0.62), (x + cw * 0.56, y)], fill=(*lerp(col, (170, 150, 120), 0.5), 255), width=2)
            d.line([(x - cw * 0.56, y), (x, y + ch * 0.62), (x + cw * 0.56, y)], fill=(*lerp(col, (40, 34, 26), 0.6), 255), width=2)
    # tile seamlessly in u: copy the left strip's pattern is already periodic (8 cells); blur a hair
    return img.filter(ImageFilter.GaussianBlur(0.6))


def knob(rnd: random.Random, W=256, H=256) -> Image.Image:
    """The Canary palm's crown knob: the fresh leaf bases, orange-brown and fibrous, packed tight."""
    img = Image.new('RGBA', (W, H), (150, 110, 60, 255))
    d = ImageDraw.Draw(img)
    for i in range(500):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        col = jit(rnd, lerp((150, 104, 52), (196, 160, 96), rnd.random()), 14)
        tapered(d, (x, y), (x + rnd.uniform(-6, 6), y - rnd.uniform(14, 30)), rnd.uniform(6, 12), 3, (*col, 255))
    return img


def fan_trunk(rnd: random.Random, W=256, H=512) -> Image.Image:
    """The fan palm's trunk: smooth grey, closely ringed with old leaf scars, faint vertical fibre."""
    img = Image.new('RGBA', (W, H), (132, 124, 112, 255))
    d = ImageDraw.Draw(img)
    for x in range(0, W, 2):
        c = jit(rnd, (132, 124, 112), 10)
        d.line([(x, 0), (x, H)], fill=(*c, 255), width=2)
    y = 0.0
    while y < H:
        c = jit(rnd, (96, 90, 82), 10)
        d.line([(0, y), (W, y + rnd.uniform(-2, 2))], fill=(*c, 255), width=2)
        d.line([(0, y + 2), (W, y + 2)], fill=(*jit(rnd, (160, 152, 140), 8), 255), width=1)
        y += rnd.uniform(7, 12)
    return img.filter(ImageFilter.GaussianBlur(0.5))


def queen_frond(rnd: random.Random, W=1024, H=512) -> Image.Image:
    """Syagrus romanzoffiana: a plumose frond along +u, 4 m of it, the leaflets long and soft, in several planes, so
    from the side the frond is a feather boa rather than Phoenix's comb. v is 1.9 m across."""
    img = Image.new('RGBA', (W, H), (70, 110, 40, 0))
    d = ImageDraw.Draw(img)
    cy = H / 2
    pu, pv = W / 4.0, H / 1.9
    base_col, tip_col = (58, 96, 36), (112, 146, 60)
    s = 0.25
    positions = []
    while s < 3.95:
        positions.append(s)
        s += rnd.uniform(0.018, 0.032)
    for s in reversed(positions):
        t = s / 4.0
        L = 0.85 * (math.sin(min(1.0, max(0.0, (t - 0.03) / 0.97)) * math.pi) ** 0.8) * rnd.uniform(0.75, 1.05) + 0.1
        for side in (-1, 1):
            for _ in range(2):   # leaflets in groups at two angles: the plume
                ang = math.radians(rnd.uniform(45, 88)) * side
                Lh = min(L, 0.9 / abs(math.sin(ang)), (3.98 - s) / max(0.2, math.cos(ang)) * 0.95)
                col = jit(rnd, lerp(base_col, tip_col, min(1, t + rnd.uniform(-0.2, 0.2))), 12)
                mid = lerp(col, (180, 190, 120), 0.3)
                p0 = (s * pu, cy + side * 2)
                a = math.atan2(math.sin(ang) * pv, math.cos(ang) * pu)
                length_px = Lh * math.hypot(math.cos(ang) * pu, math.sin(ang) * pv)
                # soft leaflets droop at their tips: a strong bend back toward the tip of the frond
                curved_leaflet(d, p0, a, length_px, rnd.uniform(4, 7), -side * rnd.uniform(0.3, 0.8), (*col, 255), (*mid, 255))
    for i in range(50):
        t0, t1 = i / 50, (i + 1) / 50
        tapered(d, (t0 * W, cy), (t1 * W, cy), 9 * (1 - t0) + 2, 9 * (1 - t1) + 2, (*lerp((130, 140, 80), (96, 124, 52), t0), 255))
    return img


def queen_trunk(rnd: random.Random, W=256, H=512) -> Image.Image:
    """The queen palm's trunk: smooth, pale grey, the old leaf scars as faint wide-spaced rings."""
    img = Image.new('RGBA', (W, H), (150, 146, 136, 255))
    d = ImageDraw.Draw(img)
    for x in range(0, W, 2):
        d.line([(x, 0), (x, H)], fill=(*jit(rnd, (150, 146, 136), 7), 255), width=2)
    y = 0.0
    while y < H:
        d.line([(0, y), (W, y + rnd.uniform(-3, 3))], fill=(*jit(rnd, (118, 114, 106), 8), 255), width=3)
        y += rnd.uniform(22, 38)
    return img.filter(ImageFilter.GaussianBlur(0.7))


def strap_tuft(rnd: random.Random, S=512) -> Image.Image:
    """Cordyline australis (and yucca): a tuft of long narrow strap leaves, seen from the side, the tuft's heart at
    the bottom centre — the young leaves standing up, the older arching out, the dead ones hanging brown below."""
    img = Image.new('RGBA', (S, S), (80, 100, 50, 0))
    d = ImageDraw.Draw(img)
    cx, cy = S / 2, S * 0.62
    blades = []
    for _ in range(70):
        a = rnd.uniform(-1.0, 1.0)
        blades.append((abs(a), a))
    for k, a in sorted(blades, reverse=True):
        ang = -math.pi / 2 + a * 1.55                     # up, to either side and a little below horizontal
        L = S * rnd.uniform(0.28, 0.4) * (1 - 0.25 * k)
        dead = k > 0.85 and rnd.random() < 0.6
        col = jit(rnd, (140, 118, 72) if dead else lerp((64, 96, 42), (118, 140, 66), rnd.random()), 12)
        bend = (0.9 if a > 0 else -0.9) * k + (1.4 * (1 if a > 0 else -1) if dead else 0)
        curved_leaflet(d, (cx, cy), ang, L, rnd.uniform(5, 8), bend * 0.6, (*col, 255), (*lerp(col, (200, 200, 140), 0.25), 255), segs=8)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rnd = random.Random(20260922)
    parts = {
        'canary-frond-a': canary_frond(random.Random(1)),
        'canary-frond-b': canary_frond(random.Random(2)),
        'fan-leaf-a': fan_leaf(random.Random(3)),
        'fan-leaf-b': fan_leaf(random.Random(4)),
        'fan-skirt': skirt(random.Random(5)),
        'canary-trunk': canary_trunk(random.Random(6)),
        'canary-knob': knob(random.Random(7)),
        'fan-trunk': fan_trunk(random.Random(8)),
        'queen-frond-a': queen_frond(random.Random(9)),
        'queen-frond-b': queen_frond(random.Random(10)),
        'queen-trunk': queen_trunk(random.Random(11)),
        'strap-tuft-a': strap_tuft(random.Random(12)),
        'strap-tuft-b': strap_tuft(random.Random(13)),
    }
    for name, im in parts.items():
        im.save(OUT / f'{name}.png')
        print(f'  palms/{name}.png  {im.width}×{im.height}')
    # a sheet over a grey ground, to look at
    sheet = Image.new('RGB', (1600, 1100), (190, 196, 202))
    x, y, rowh = 10, 10, 0
    for name, im in parts.items():
        scale = min(1.0, 520 / im.width)
        t = im.resize((int(im.width * scale), int(im.height * scale)))
        if x + t.width > 1590:
            x, y = 10, y + rowh + 10
            rowh = 0
        sheet.paste(t, (x, y), t)
        x += t.width + 10
        rowh = max(rowh, t.height)
    sheet.save(OUT / 'sheet.png')
    del rnd


if __name__ == '__main__':
    main()
