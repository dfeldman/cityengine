#!/usr/bin/env python3
"""
The paint. Everything here draws into an RGBA image where **alpha is not transparency** — it is a tint mask:
how much of the building's palette colour multiplies this pixel at runtime.

    final = albedo * mix(white, wallColour, alpha)

That one trick is what lets seven styles and four palettes each become twenty-eight distinct buildings from a
single painted page. Brick is painted pale with alpha 1, so the palette makes it red here and yellow-buff two
streets over; the mortar between is painted with alpha 0.25, so it stays a pale grey line in both. Glass is
painted with alpha 0 and keeps the colour it was given, because a red building does not have red windows.

Three things do most of the work in making a flat painted panel read as a real facade:

  * **A dark line on the top and left inside edge of every opening.** A window is a hole in a thick wall, and
    what tells you so is the shadow the reveal casts. It costs two lines and it is the single highest-value
    mark in the file.
  * **Glass is never one colour.** It runs from a pale sky reflection at the top to a dark room at the bottom,
    with a diagonal streak across it. Flat glass looks like painted-on windows, which is exactly the failure
    mode this whole generator exists to avoid.
  * **Per-unit variation in the material itself.** Every brick gets its own slight shade; every stone course
    is a slightly different height. Uniform material is what makes rendered cities look like cardboard.
"""
import math
import random

from PIL import Image, ImageDraw, ImageFilter

# ------------------------------------------------------------------ colour helpers

def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def shade(c, f: float):
    """Multiply a colour toward black (f<1) or white (f>1), staying in range."""
    if f <= 1:
        return tuple(max(0, min(255, int(v * f))) for v in c)
    t = f - 1
    return tuple(max(0, min(255, int(v + (255 - v) * t))) for v in c)


def jitter(rnd: random.Random, c, amount: int):
    d = rnd.randint(-amount, amount)
    return tuple(max(0, min(255, v + d)) for v in c)


# Alpha conventions, named so the intent is readable at the call site.
TINT = 255      # takes the building's palette colour in full
TINT_HALF = 128
TINT_LOW = 64   # mortar, joints: barely picks up the palette
KEEP = 0        # metal, signage, frames: the painted colour survives untouched
# A reserved alpha that means "this is GLASS" — the shader throws the painted pixel away and shades it
# properly: fresnel, a reflected sky, a sun highlight, and the room behind. The painted colour is kept as the
# backing, so a lit shop interior still reads warm behind the reflection. Nothing else may use 1–15.
GLASS = 4


def px(img: Image.Image, xy, rgb, a=TINT):
    img.putpixel(xy, (*rgb, a))


def rect(d: ImageDraw.ImageDraw, box, rgb, a=TINT):
    d.rectangle(box, fill=(*rgb, a))


def line(d: ImageDraw.ImageDraw, xy, rgb, a=TINT, w=1):
    d.line(xy, fill=(*rgb, a), width=w)


def grain(img: Image.Image, rnd: random.Random, amount: int, density: float = 1.0) -> None:
    """Per-pixel noise. Materials without it look like plastic; with it they look like matter."""
    w, h = img.size
    pxa = img.load()
    for y in range(h):
        for x in range(w):
            if density < 1.0 and rnd.random() > density:
                continue
            r, g, b, a = pxa[x, y]
            d = rnd.randint(-amount, amount)
            pxa[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)), a)


def blotches(img: Image.Image, rnd: random.Random, n: int, amount: int, rmin=8, rmax=40) -> None:
    """Soft large-scale unevenness — weathering, damp, sun-bleaching. Breaks up flat fields."""
    w, h = img.size
    layer = Image.new('L', (w, h), 128)
    ld = ImageDraw.Draw(layer)
    for _ in range(n):
        x, y, r = rnd.randrange(w), rnd.randrange(h), rnd.randint(rmin, rmax)
        v = 128 + rnd.randint(-amount, amount)
        ld.ellipse([x - r, y - r, x + r, y + r], fill=v)
    layer = layer.filter(ImageFilter.GaussianBlur(rmax * 0.5))
    pxa, la = img.load(), layer.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pxa[x, y]
            d = (la[x, y] - 128) // 2
            pxa[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)), a)


# ------------------------------------------------------------------ seamless wall materials
#
# These are the fields the walls are made of. They tile, so nothing may touch an edge without also touching
# the opposite one — every draw here wraps in x, and the horizontal course lines wrap in y by construction.

def wall_brick(size: int, rnd: random.Random) -> Image.Image:
    """Running bond. The whole quality of brick is in the per-brick shade variation and the mortar being
    LIGHTER than the brick — get either backwards and it reads as a texture rather than a wall."""
    img = Image.new('RGBA', (size, size), (214, 206, 198, TINT_LOW))
    d = ImageDraw.Draw(img)
    course = size // 12          # ~65 mm brick + joint at 512 px ≈ 2.4 m
    brick_w = course * 3
    base = (236, 228, 220)
    y = 0
    row = 0
    while y < size:
        offset = (brick_w // 2) if row % 2 else 0
        x = -offset
        while x < size:
            c = jitter(rnd, base, 16)
            # a few bricks are noticeably off — burnt headers, replacements
            if rnd.random() < 0.06:
                c = shade(c, rnd.uniform(0.78, 0.9))
            d.rectangle([x + 1, y + 1, x + brick_w - 2, y + course - 2], fill=(*c, TINT))
            # the top edge of each brick catches light, the bottom sits in the joint's shadow
            d.line([(x + 1, y + 1), (x + brick_w - 2, y + 1)], fill=(*shade(c, 1.06), TINT))
            d.line([(x + 1, y + course - 2), (x + brick_w - 2, y + course - 2)], fill=(*shade(c, 0.9), TINT))
            x += brick_w
        y += course
        row += 1
    grain(img, rnd, 5)
    blotches(img, rnd, 14, 14, 20, 70)
    return img


def wall_ashlar(size: int, rnd: random.Random, course_px: int, joint: int = 2) -> Image.Image:
    """Cut stone in courses — Haussmann's limestone and the classical block. Joints are fine and the stones
    are large; the variation is between courses more than within them."""
    img = Image.new('RGBA', (size, size), (206, 200, 190, TINT_LOW))
    d = ImageDraw.Draw(img)
    base = (240, 236, 228)
    y = 0
    row = 0
    while y < size:
        h = course_px
        stone_w = int(course_px * rnd.uniform(2.2, 3.4))
        offset = rnd.randrange(stone_w) if row % 2 else 0
        band = jitter(rnd, base, 7)
        x = -offset
        while x < size:
            c = jitter(rnd, band, 5)
            d.rectangle([x + joint, y + joint, x + stone_w - joint, y + h - joint], fill=(*c, TINT))
            d.line([(x + joint, y + joint), (x + stone_w - joint, y + joint)], fill=(*shade(c, 1.04), TINT))
            x += stone_w
        y += h
        row += 1
    grain(img, rnd, 4)
    blotches(img, rnd, 10, 10, 30, 90)
    return img


def wall_render(size: int, rnd: random.Random, stipple: int = 3) -> Image.Image:
    """Smooth painted render — Bauhaus. Almost nothing to see, which is the point; all it needs is enough
    fine noise that the light does not land on it perfectly flat."""
    img = Image.new('RGBA', (size, size), (246, 244, 240, TINT))
    grain(img, rnd, stipple)
    blotches(img, rnd, 8, 7, 40, 110)
    return img


def wall_concrete(size: int, rnd: random.Random) -> Image.Image:
    """Board-marked concrete: the horizontal lines are the shuttering boards the wet concrete was poured
    against, and the dots are the tie holes. Without those two marks, concrete is just grey."""
    img = Image.new('RGBA', (size, size), (226, 224, 219, TINT))
    d = ImageDraw.Draw(img)
    board = size // 8
    for i in range(0, size, board):
        v = rnd.randint(-8, 8)
        d.rectangle([0, i, size, i + board - 1], fill=(226 + v, 224 + v, 219 + v, TINT))
        d.line([(0, i), (size, i)], fill=(196, 194, 190, TINT))            # the board joint
        d.line([(0, i + 1), (size, i + 1)], fill=(240, 238, 234, TINT))    # and its highlight
    for _ in range(6):
        x, y = rnd.randrange(size), rnd.randrange(size)
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(200, 198, 194, TINT))
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(214, 212, 208, TINT))
    grain(img, rnd, 6)
    blotches(img, rnd, 18, 12, 25, 80)
    return img


def wall_spandrel(size: int, rnd: random.Random) -> Image.Image:
    """The opaque panel between the glass in a curtain wall: flat coated metal, with the vertical mullion
    shadow that gives a tower its pinstripe at distance."""
    img = Image.new('RGBA', (size, size), (232, 232, 234, TINT))
    d = ImageDraw.Draw(img)
    for x in range(0, size, size // 8):
        d.line([(x, 0), (x, size)], fill=(210, 210, 214, TINT))
        d.line([(x + 1, 0), (x + 1, size)], fill=(244, 244, 246, TINT))
    grain(img, rnd, 3)
    return img


def wall_brownstone(size: int, rnd: random.Random) -> Image.Image:
    """Brownstone is a sandstone, laid in courses but smooth-faced and much less obviously jointed than
    ashlar — the courses are a whisper, and the mottling is the material itself."""
    img = wall_ashlar(size, rnd, course_px=size // 7, joint=1)
    blotches(img, rnd, 22, 16, 18, 60)
    grain(img, rnd, 7)
    return img


def wall_plaster(size: int, rnd: random.Random) -> Image.Image:
    """The Marais: lime plaster over rubble, hand-trowelled. Rougher than Bauhaus render, with the soft
    patches where it has been repaired over three centuries — and, faintly, the stone courses showing
    through where it has worn thin."""
    img = Image.new('RGBA', (size, size), (242, 238, 230, TINT))
    grain(img, rnd, 7)
    blotches(img, rnd, 22, 12, 20, 120)
    d = ImageDraw.Draw(img)
    y = 0
    while y < size:
        y += rnd.randint(size // 10, size // 7)
        if rnd.random() < 0.35:
            x0 = rnd.randint(0, size)
            line(d, [(x0, y), (x0 + rnd.randint(size // 8, size // 3), y)], (226, 220, 210), TINT, 1)
    return img


def wall_siding(size: int, rnd: random.Random) -> Image.Image:
    """San Francisco: painted redwood clapboard. Each board casts a thin shadow line on the one below it,
    which is the whole of what makes timber read as timber at a distance."""
    img = Image.new('RGBA', (size, size), (244, 242, 236, TINT))
    d = ImageDraw.Draw(img)
    board = size // 22
    for y in range(0, size, board):
        line(d, [(0, y), (size, y)], (206, 202, 194), TINT, 2)
        line(d, [(0, y + 2), (size, y + 2)], (250, 249, 246), TINT, 1)
    grain(img, rnd, 3)
    return img


def wall_shingle(size: int, rnd: random.Random) -> Image.Image:
    """Cape Cod (Sausalito, owner 2026-10-06): weathered cedar shingles in staggered courses, each shingle its own
    tone, the butt of every course casting a line on the one below."""
    img = Image.new('RGBA', (size, size), (236, 234, 230, TINT))
    d = ImageDraw.Draw(img)
    course = size // 18
    for i, y in enumerate(range(0, size, course)):
        off = (i % 2) * (course // 2)
        x = -off
        while x < size:
            w = rnd.randint(course * 3 // 4, course * 3 // 2)
            v = rnd.randint(-14, 10)
            d.rectangle([x, y, x + w - 1, y + course - 1], fill=(236 + v, 234 + v, 230 + v, TINT))
            d.line([(x, y), (x, y + course - 1)], fill=(200, 198, 194, TINT))
            x += w
        line(d, [(0, y + course - 1), (size, y + course - 1)], (190, 188, 184), TINT, 2)
    grain(img, rnd, 3)
    return img


def wall_terracotta(size: int, rnd: random.Random) -> Image.Image:
    """Chicago: glazed terracotta blocks, larger and smoother than stone, with fine joints."""
    return wall_ashlar(size, rnd, course_px=size // 12, joint=1)


def wall_precast(size: int, rnd: random.Random) -> Image.Image:
    """The post-war residential tower: precast concrete panels, one to a storey-and-a-bay, with the recessed
    joint between them. Where brutalism shows the shuttering boards, this shows the PANEL — a grid of wide
    joints with a fine aggregate face between, which is what reads on a hillside tower from half a mile off."""
    img = Image.new('RGBA', (size, size), (223, 220, 212, TINT))
    d = ImageDraw.Draw(img)
    panel = size // 4
    for i in range(0, size, panel):
        for j in range(0, size, panel):
            v = rnd.randint(-5, 5)
            d.rectangle([j + 2, i + 2, j + panel - 3, i + panel - 3], fill=(223 + v, 220 + v, 212 + v, TINT))
        d.line([(0, i), (size, i)], fill=(199, 196, 189, TINT))            # the recessed joint
        d.line([(0, i + 2), (size, i + 2)], fill=(238, 236, 229, TINT))    # and the light on its lower lip
    for j in range(0, size, panel):
        d.line([(j, 0), (j, size)], fill=(203, 200, 193, TINT))
        d.line([(j + 2, 0), (j + 2, size)], fill=(236, 234, 227, TINT))
    grain(img, rnd, 5)
    blotches(img, rnd, 10, 10, 20, 50)
    return img


def wall_pressedbrick(size: int, rnd: random.Random) -> Image.Image:
    """The tenement's brick: a darker, tighter, more regular machine-pressed brick than the workhorse wall,
    so a five-storey walk-up does not come out identical to every other brick building in the city."""
    img = wall_brick(size, rnd)
    dark = Image.new('RGBA', (size, size), (150, 96, 78, 70))
    return Image.alpha_composite(img, dark)


WALLS = {
    'haussmann': lambda s, r: wall_ashlar(s, r, course_px=s // 9),
    'classical': lambda s, r: wall_ashlar(s, r, course_px=s // 7),
    'brownstone': wall_brownstone,
    'brick': wall_brick,
    'bauhaus': wall_render,
    'brutalist': wall_concrete,
    'skyscraper': wall_spandrel,
    'marais': wall_plaster,
    'tenement': wall_pressedbrick,
    'chicago': wall_terracotta,
    'victorian': wall_siding,
    'vosges': wall_brick,
    # San Francisco's (SF_PLAN.md §3): smooth stucco, the apartment block's rougher render, Chinatown's painted brick
    'stucco': lambda s, r: wall_render(s, r, stipple=4),
    'sfapartment': lambda s, r: wall_render(s, r, stipple=6),
    'chinatown': wall_brick,
    'edwardian': wall_siding,
    # the post-war tower's precast panels — NOT brutalism's board-marked concrete
    'towerblock': wall_precast,
    # the Presidio's (owner, 2026-10-02): the Army's smooth white stucco, and the Main Post's red brick
    'presidio': lambda s, r: wall_render(s, r, stipple=3),
    'presidioBrick': wall_brick,
    # Sausalito's Cape Cod houses (owner, 2026-10-06): cedar shingle
    'capecod': wall_shingle,
}


# ------------------------------------------------------------------ windows
#
# Every window is: a hole, the shadow the hole's reveal casts, glass, glazing bars, and a frame. Drawn in
# that order, because each one sits on top of the last.

def glass(img: Image.Image, box, rnd: random.Random, lit: float = 0.0) -> None:
    """Glass: a vertical gradient from the sky reflected at the top to the dark of the room at the bottom,
    with a soft reflection or two across it. `lit` warms it toward a room with a lamp on.

    The reflections are drawn on their own layer, blurred, and blended in weakly. An earlier version drew
    them as hard bright bars and every window in the city ended up wearing the same two white stripes — which
    is precisely the uniformity this generator exists to avoid. They vary in number, angle, position and
    strength, and about one window in six has none at all.
    """
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    w, h = max(1, x1 - x0), max(1, y1 - y0)
    if w < 3 or h < 3:
        return
    pane = Image.new('RGB', (w, h))
    pd = ImageDraw.Draw(pane)
    for y in range(h):
        t = y / h
        pd.line([(0, y), (w, y)], fill=(int(150 - 96 * t + 44 * lit * t),
                                        int(168 - 108 * t + 28 * lit * t),
                                        int(184 - 112 * t + 4 * lit * t)))

    n = rnd.choice([0, 1, 1, 2, 2, 3])
    if n:
        refl = Image.new('L', (w, h), 0)
        rd = ImageDraw.Draw(refl)
        for _ in range(n):
            sx = rnd.uniform(-0.4, 1.1) * w
            slant = rnd.uniform(0.5, 1.6)          # how far the streak leans
            width = max(2, int(w * rnd.uniform(0.05, 0.19)))
            rd.line([(sx, h), (sx + h * slant, 0)], fill=rnd.randint(90, 190), width=width)
        refl = refl.filter(ImageFilter.GaussianBlur(max(1.5, w * 0.03)))
        pane = Image.composite(Image.new('RGB', (w, h), (226, 236, 246)), pane,
                               refl.point(lambda v: int(v * 0.42)))

    # Pasted rather than drawn pixel by pixel: 43 elements of 60 000 `d.point` calls is a slow build.
    # Alpha goes in with it, so the glass keeps the colour it was painted and the palette never touches it.
    out = pane.convert('RGBA')
    # GLASS, not KEEP: this hands the pixel to the glass shader, which does far more with it than paint can.
    # The painted gradient stays in RGB and becomes the backing the reflection sits over.
    out.putalpha(Image.new('L', (w, h), GLASS))
    img.paste(out, (x0, y0))

    if rnd.random() < 0.28:  # a blind pulled part-way down, which is what real windows do
        drop = int(h * rnd.uniform(0.15, 0.45))
        d.rectangle([x0, y0, x1, y0 + drop], fill=(224, 218, 204, KEEP))
        for y in range(y0, y0 + drop, 4):
            d.line([(x0, y), (x1, y)], fill=(208, 202, 188, KEEP))
    elif rnd.random() < 0.32:  # curtains, drawn back to the sides
        cw = max(2, int(w * rnd.uniform(0.12, 0.26)))
        for cx0, cx1 in ((x0, x0 + cw), (x1 - cw, x1)):
            d.rectangle([cx0, y0, cx1, y1], fill=(236, 232, 222, KEEP))
            d.line([(cx0 + 1, y0), (cx0 + 1, y1)], fill=(216, 212, 202, KEEP))


def reveal(d: ImageDraw.ImageDraw, box, depth: int = 3) -> None:
    """The shadow the wall's own thickness casts into an opening — the mark that turns a painted rectangle
    into a hole. Dark along the top and left, a bright catch along the bottom sill: the light in this file is
    always up and to the right.

    It is painted rather than multiplied because Pillow has no blend modes, so it goes down BEFORE the glass
    and the frame overdraws its inner part."""
    x0, y0, x1, y1 = box
    for i in range(depth):
        v = 64 + i * 20
        d.line([(x0 + i, y0 + i), (x1 - i, y0 + i)], fill=(v, v - 4, v - 8, KEEP))
        d.line([(x0 + i, y0 + i), (x0 + i, y1 - i)], fill=(v + 10, v + 6, v + 2, KEEP))
    d.line([(x0, y1 - 1), (x1, y1 - 1)], fill=(214, 208, 198, KEEP))
    d.line([(x1 - 1, y0), (x1 - 1, y1)], fill=(188, 184, 176, KEEP))


# ------------------------------------------------------------------ window elements
#
# One painter per style. Each fills a 256×256 cell that will be stretched onto a bay — wall around the
# opening, then the opening itself. The wall behind is painted pale with full tint so the palette carries it,
# exactly as in the seamless pages.

def _bay(size: int, rnd: random.Random, wall=(238, 234, 226)):
    img = Image.new('RGBA', (size, size), (*wall, TINT))
    grain(img, rnd, 4)
    return img, ImageDraw.Draw(img)


def win_french(size, rnd):
    """Haussmann: a tall casement to the floor, two leaves, a small-paned upper light, stone surround."""
    img, d = _bay(size, rnd)
    w = int(size * 0.52); x0 = (size - w) // 2; y0 = int(size * 0.12); y1 = int(size * 0.93)
    rect(d, [x0 - 6, y0 - 7, x0 + w + 6, y1], (246, 242, 234), TINT)          # the stone surround
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x0 + w - 4, y1 - 4), rnd)
    f = (250, 248, 242)
    rect(d, [x0 + w // 2 - 2, y0 + 4, x0 + w // 2 + 2, y1 - 4], f, KEEP)      # the meeting stile
    for t in (0.3, 0.58, 0.86):                                               # glazing bars
        y = int(y0 + (y1 - y0) * t)
        line(d, [(x0 + 4, y), (x0 + w - 4, y)], f, KEEP, 2)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    line(d, [(x0 - 8, y0 - 7), (x0 + w + 8, y0 - 7)], (252, 250, 244), TINT, 4)   # the lintel
    return img


def win_sash(size, rnd):
    """Brownstone: a two-over-two sash under a heavy stone lintel, sitting on a projecting sill."""
    img, d = _bay(size, rnd, (232, 226, 218))
    w = int(size * 0.46); x0 = (size - w) // 2; y0 = int(size * 0.16); y1 = int(size * 0.82)
    rect(d, [x0 - 10, y0 - 14, x0 + w + 10, y0 - 4], (248, 244, 236), TINT)   # lintel
    rect(d, [x0 - 12, y1, x0 + w + 12, y1 + 9], (248, 244, 236), TINT)        # sill
    line(d, [(x0 - 12, y1 + 9), (x0 + w + 12, y1 + 9)], (188, 182, 174), TINT, 2)
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 3, y0 + 3, x0 + w - 3, y1 - 3), rnd)
    f = (242, 240, 234)
    ym = (y0 + y1) // 2
    rect(d, [x0 + 3, ym - 4, x0 + w - 3, ym + 4], f, KEEP)                    # the meeting rail
    rect(d, [x0 + w // 2 - 2, y0 + 3, x0 + w // 2 + 2, y1 - 3], f, KEEP)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    return img


def win_pedimented(size, rnd):
    """Classical: an arched or pedimented head, a moulded architrave, a sill on little brackets."""
    img, d = _bay(size, rnd, (242, 238, 230))
    w = int(size * 0.44); x0 = (size - w) // 2; y0 = int(size * 0.2); y1 = int(size * 0.8)
    arched = rnd.random() < 0.45
    rect(d, [x0 - 9, y0 - 8, x0 + w + 9, y1 + 4], (250, 247, 240), TINT)      # architrave
    if arched:
        d.pieslice([x0 - 9, y0 - 26, x0 + w + 9, y0 + 18], 180, 360, fill=(250, 247, 240, TINT))
        d.pieslice([x0, y0 - 17, x0 + w, y0 + 17], 180, 360, fill=(90, 84, 76, KEEP))
    else:
        d.polygon([(x0 - 13, y0 - 9), (x0 + w // 2, y0 - 30), (x0 + w + 13, y0 - 9)],
                  fill=(252, 249, 242, TINT))
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 3, y0 + 3, x0 + w - 3, y1 - 3), rnd)
    f = (246, 243, 236)
    for t in (0.34, 0.67):
        line(d, [(x0 + 3, int(y0 + (y1 - y0) * t)), (x0 + w - 3, int(y0 + (y1 - y0) * t))], f, KEEP, 2)
    rect(d, [x0 + w // 2 - 2, y0 + 3, x0 + w // 2 + 2, y1 - 3], f, KEEP)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    rect(d, [x0 - 13, y1 + 4, x0 + w + 13, y1 + 12], (250, 247, 240), TINT)   # sill
    for bx in (x0 - 6, x0 + w - 2):                                           # and its brackets
        rect(d, [bx, y1 + 12, bx + 8, y1 + 20], (240, 236, 228), TINT)
    return img


def win_punched(size, rnd):
    """Brick: an opening punched in a flat wall, a soldier course over it, a projecting stone sill. The wall
    here is left blank, because the brick page shows through from the material behind."""
    img, d = _bay(size, rnd, (236, 230, 222))
    w = int(size * 0.5); x0 = (size - w) // 2; y0 = int(size * 0.2); y1 = int(size * 0.78)
    course = max(6, size // 26)
    for i in range(0, w + 18, course):                                        # soldier course lintel
        c = jitter(rnd, (234, 226, 218), 12)
        rect(d, [x0 - 9 + i, y0 - course * 2, x0 - 9 + i + course - 2, y0 - 3], c, TINT)
    rect(d, [x0 - 11, y1, x0 + w + 11, y1 + 8], (246, 242, 234), TINT)        # sill
    line(d, [(x0 - 11, y1 + 8), (x0 + w + 11, y1 + 8)], (186, 180, 172), TINT, 2)
    reveal(d, (x0, y0, x0 + w, y1), 5)
    glass(img, (x0 + 4, y0 + 4, x0 + w - 4, y1 - 4), rnd)
    f = (240, 238, 232)
    rect(d, [x0 + 4, (y0 + y1) // 2 - 3, x0 + w - 4, (y0 + y1) // 2 + 3], f, KEEP)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=4)
    return img


def win_ribbon(size, rnd):
    """Bauhaus: a horizontal band of glass running nearly the full bay, thin steel frame, no surround at all
    — the wall simply stops."""
    img, d = _bay(size, rnd, (248, 246, 242))
    x0 = int(size * 0.03); x1 = int(size * 0.97); y0 = int(size * 0.3); y1 = int(size * 0.72)
    reveal(d, (x0, y0, x1, y1), 3)
    glass(img, (x0 + 2, y0 + 2, x1 - 2, y1 - 2), rnd)
    f = (238, 238, 236)
    for k in range(1, 4):
        x = x0 + (x1 - x0) * k // 4
        rect(d, [x - 2, y0 + 2, x + 2, y1 - 2], f, KEEP)
    d.rectangle([x0, y0, x1, y1], outline=(*f, KEEP), width=3)
    return img


def win_recessed(size, rnd):
    """Brutalist: a small window at the back of a deep concrete reveal. The reveal is most of the picture,
    and that is the style."""
    img, d = _bay(size, rnd, (232, 230, 226))
    w = int(size * 0.58); x0 = (size - w) // 2; y0 = int(size * 0.26); y1 = int(size * 0.7)
    rect(d, [x0, y0, x0 + w, y1], (150, 148, 144), TINT)                      # the recess, in shadow
    reveal(d, (x0, y0, x0 + w, y1), 10)
    ix0, iy0 = x0 + 12, y0 + 10
    glass(img, (ix0, iy0, x0 + w - 6, y1 - 5), rnd)
    d.rectangle([ix0, iy0, x0 + w - 6, y1 - 5], outline=(74, 72, 70, KEEP), width=3)
    return img


def win_curtain(size, rnd):
    """Skyscraper: vision glass above a spandrel panel, split by mullions. The bay is almost all glass; what
    varies between towers is the tint of it."""
    img = Image.new('RGBA', (size, size), (232, 232, 234, TINT))
    d = ImageDraw.Draw(img)
    x0, x1 = int(size * 0.04), int(size * 0.96)
    y0, y1 = int(size * 0.06), int(size * 0.72)
    glass(img, (x0, y0, x1, y1), rnd, lit=0.15 if rnd.random() < 0.18 else 0.0)
    m = (206, 208, 212)
    rect(d, [x0 - 5, y0 - 5, x0 + 3, size], m, KEEP)                          # vertical mullions
    rect(d, [x1 - 3, y0 - 5, x1 + 5, size], m, KEEP)
    rect(d, [(x0 + x1) // 2 - 2, y0, (x0 + x1) // 2 + 2, y1], m, KEEP)
    rect(d, [x0, y1, x1, y1 + 6], (188, 190, 194), KEEP)                      # the transom
    rect(d, [x0, y1 + 6, x1, size], (226, 226, 228), TINT)                    # spandrel below
    line(d, [(x0, size - 3), (x1, size - 3)], (200, 200, 204), TINT, 2)
    return img


# All one family. The grammar picks a window variant per BAY, so a red shutter among green ones made every
# building a patchwork; a real building's shutters are painted together, in one colour.
SHUTTERS = [(47, 74, 54), (50, 78, 58), (44, 70, 52)]


def win_casement(size, rnd):
    """The Marais: a tall two-leaf casement in a plain plaster surround, standing on a sill well above the
    floor, with a pair of louvred wooden shutters folded back against the wall either side. The shutters
    are what say 'old Paris' rather than 'boulevard' — Haussmann's blocks have none."""
    img, d = _bay(size, rnd)
    w = int(size * 0.4); x0 = (size - w) // 2; y0 = int(size * 0.14); y1 = int(size * 0.82)
    rect(d, [x0 - 5, y0 - 6, x0 + w + 5, y1 + 3], (248, 245, 238), TINT)          # the plaster surround
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x0 + w - 4, y1 - 4), rnd)
    f = (244, 242, 236)
    rect(d, [x0 + w // 2 - 2, y0 + 4, x0 + w // 2 + 2, y1 - 4], f, KEEP)          # the meeting stile
    for t in (0.25, 0.5, 0.75):                                                   # small panes
        y = int(y0 + (y1 - y0) * t)
        line(d, [(x0 + 4, y), (x0 + w - 4, y)], f, KEEP, 2)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    rect(d, [x0 - 8, y1 + 2, x0 + w + 8, y1 + 8], (236, 232, 224), TINT)          # the sill
    # the shutters, folded open against the wall
    c = rnd.choice(SHUTTERS)
    sw = w // 2 + 2
    for sx0 in (x0 - 7 - sw, x0 + w + 7):
        rect(d, [sx0, y0 - 2, sx0 + sw, y1], c, KEEP)
        d.rectangle([sx0, y0 - 2, sx0 + sw, y1], outline=(*shade(c, 0.7), KEEP), width=2)
        for y in range(y0 + 4, y1 - 2, 6):                                         # the louvres
            line(d, [(sx0 + 3, y), (sx0 + sw - 3, y)], shade(c, 0.72), KEEP, 1)
            line(d, [(sx0 + 3, y + 2), (sx0 + sw - 3, y + 2)], shade(c, 1.25), KEEP, 1)
        rect(d, [sx0 + 2, (y0 + y1) // 2 - 2, sx0 + sw - 2, (y0 + y1) // 2 + 1], shade(c, 0.8), KEEP)
    return img


def win_chicago(size, rnd):
    """The Chicago window: a broad fixed pane between two narrow opening sashes, in a bay as wide as the
    structure allows — the steel frame is what made a window this wide possible."""
    img, d = _bay(size, rnd)
    x0, x1 = int(size * 0.07), int(size * 0.93)
    y0, y1 = int(size * 0.14), int(size * 0.84)
    reveal(d, (x0, y0, x1, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x1 - 4, y1 - 4), rnd)
    f = (232, 228, 220)
    w = x1 - x0
    for fx in (x0 + int(w * 0.22), x1 - int(w * 0.22)):                      # the mullions
        rect(d, [fx - 3, y0, fx + 3, y1], f, KEEP)
    for fx0, fx1 in ((x0, x0 + int(w * 0.22)), (x1 - int(w * 0.22), x1)):     # the sashes' meeting rails
        line(d, [(fx0, (y0 + y1) // 2), (fx1, (y0 + y1) // 2)], f, KEEP, 3)
    d.rectangle([x0, y0, x1, y1], outline=(*f, KEEP), width=4)
    rect(d, [x0 - 6, y1, x1 + 6, y1 + 8], (238, 232, 222), TINT)              # the terracotta sill band
    return img


def win_victorian(size, rnd):
    """San Francisco: a tall one-over-one sash in a moulded frame, under a bracketed hood."""
    img, d = _bay(size, rnd, (244, 242, 236))
    w = int(size * 0.44); x0 = (size - w) // 2; y0 = int(size * 0.18); y1 = int(size * 0.88)
    rect(d, [x0 - 10, y0 - 8, x0 + w + 10, y1 + 6], (252, 250, 246), KEEP)    # the trim, which keeps its white
    reveal(d, (x0, y0, x0 + w, y1), 3)
    glass(img, (x0 + 3, y0 + 3, x0 + w - 3, y1 - 3), rnd)
    f = (250, 248, 244)
    rect(d, [x0, (y0 + y1) // 2 - 2, x0 + w, (y0 + y1) // 2 + 2], f, KEEP)    # the meeting rail
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    d.polygon([(x0 - 16, y0 - 8), (x0 + w // 2, y0 - 26), (x0 + w + 16, y0 - 8)], fill=(250, 248, 244, KEEP))   # the hood
    for bx in (x0 - 12, x0 + w + 6):                                          # its brackets
        rect(d, [bx, y0 - 8, bx + 6, y0 + 10], (236, 232, 226), KEEP)
    return img


def win_vosges(size, rnd):
    """The Place des Vosges: red brick (painted pale and tinted by the palette, like the brick page) with the
    window in a white stone frame, and the frame carried up and down the full storey as a stone chain, its
    edges toothed into the brick — so a row of houses reads as vertical white stripes on red. The stone is
    KEEP: it must stay white whatever red the palette gives the brick."""
    img = Image.new('RGBA', (size, size), (214, 206, 198, TINT_LOW))
    d = ImageDraw.Draw(img)
    course = max(6, size // 16)
    brick_w = course * 3
    for row, y in enumerate(range(0, size, course)):
        x = -(brick_w // 2 if row % 2 else 0)
        while x < size:
            c = jitter(rnd, (236, 228, 220), 16)
            d.rectangle([x + 1, y + 1, x + brick_w - 2, y + course - 2], fill=(*c, TINT))
            x += brick_w
    stone = (238, 233, 222)
    cx = size // 2
    band = int(size * 0.3)                                       # half-width of the chain at its narrow teeth
    for i, y in enumerate(range(0, size, course * 2)):             # the toothed chain: long and short blocks
        hw = band + (int(size * 0.06) if i % 2 == 0 else 0)
        c = jitter(rnd, stone, 5)
        rect(d, [cx - hw, y, cx + hw, y + course * 2 - 2], c, KEEP)
        line(d, [(cx - hw, y + course * 2 - 2), (cx + hw, y + course * 2 - 2)], shade(c, 0.86), KEEP, 1)
    w = int(size * 0.38); x0 = cx - w // 2; y0 = int(size * 0.16); y1 = int(size * 0.86)
    rect(d, [x0 - 7, y0 - 7, x0 + w + 7, y1 + 3], (246, 243, 236), KEEP)          # the moulded frame
    d.rectangle([x0 - 7, y0 - 7, x0 + w + 7, y1 + 3], outline=(*shade(stone, 0.8), KEEP), width=1)
    rect(d, [cx - 8, y0 - 14, cx + 8, y0 - 4], (250, 248, 242), KEEP)             # the keystone
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x0 + w - 4, y1 - 4), rnd)
    f = (240, 238, 232)
    rect(d, [cx - 2, y0 + 4, cx + 2, y1 - 4], f, KEEP)                             # small panes: the 1600s
    for t in (0.2, 0.4, 0.6, 0.8):
        yy = int(y0 + (y1 - y0) * t)
        line(d, [(x0 + 4, yy), (x0 + w - 4, yy)], f, KEEP, 2)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*f, KEEP), width=3)
    rect(d, [x0 - 10, y1 + 3, x0 + w + 10, y1 + 9], (244, 240, 232), KEEP)        # the sill
    rect(d, [0, size - 10, size, size], (236, 231, 220), KEEP)                     # the floor band
    return img


def win_arched(size, rnd):
    """The Marina's 1930s stucco: a round-headed casement window deep in a smooth wall — or, one in three, a
    square steel-framed Deco window in small panes. The arch is what says Mediterranean."""
    img, d = _bay(size, rnd, (246, 242, 234))
    w = int(size * 0.46); x0 = (size - w) // 2; y0 = int(size * 0.2); y1 = int(size * 0.84)
    f = (248, 246, 240)
    if rnd.random() < 0.66:
        r = w // 2
        # the reveal: the arch's shadow, then the glass inside it, then the frame
        d.pieslice([x0 - 3, y0 - 3, x0 + w + 3, y0 + 2 * r + 3], 180, 360, fill=(84, 80, 74, KEEP))
        rect(d, [x0 - 3, y0 + r, x0 + w + 3, y1], (84, 80, 74), KEEP)
        pane = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        glass(pane, (x0 + 3, y0 + 3, x0 + w - 3, y1 - 3), rnd)
        mask = Image.new('L', (size, size), 0)
        md = ImageDraw.Draw(mask)
        md.pieslice([x0 + 3, y0 + 3, x0 + w - 3, y0 + 2 * r - 3], 180, 360, fill=255)
        md.rectangle([x0 + 3, y0 + r, x0 + w - 3, y1 - 3], fill=255)
        img.paste(pane, (0, 0), mask)
        rect(d, [x0 + w // 2 - 2, y0 + 6, x0 + w // 2 + 2, y1 - 3], f, KEEP)         # the mullion
        line(d, [(x0 + 3, y0 + r), (x0 + w - 3, y0 + r)], f, KEEP, 3)                  # the transom at the springing
        d.arc([x0, y0, x0 + w, y0 + 2 * r], 180, 360, fill=(*f, KEEP), width=4)
    else:
        reveal(d, (x0, y0 + 10, x0 + w, y1), 4)
        glass(img, (x0 + 4, y0 + 14, x0 + w - 4, y1 - 4), rnd)
        for t in (1 / 3, 2 / 3):
            line(d, [(x0 + int(w * t), y0 + 14), (x0 + int(w * t), y1 - 4)], (60, 62, 64), KEEP, 2)
        for t in (0.25, 0.5, 0.75):
            y = int(y0 + 14 + (y1 - y0 - 18) * t)
            line(d, [(x0 + 4, y), (x0 + w - 4, y)], (60, 62, 64), KEEP, 2)
    rect(d, [x0 - 6, y1, x0 + w + 6, y1 + 7], (236, 230, 220), TINT)               # the sill
    # a little iron balconette under one in four
    if rnd.random() < 0.25:
        for bx in range(x0 - 4, x0 + w + 6, 7):
            line(d, [(bx, y1 - 22), (bx, y1)], (40, 38, 36), KEEP, 2)
        line(d, [(x0 - 6, y1 - 22), (x0 + w + 6, y1 - 22)], (40, 38, 36), KEEP, 3)
    return img


def win_sfapartment(size, rnd):
    """The Edwardian apartment block: a one-over-one sash in a plain moulded surround, a keystone over it."""
    img = win_sash(size, rnd)
    d = ImageDraw.Draw(img)
    cx = size // 2
    y = int(size * 0.13)
    d.polygon([(cx - 10, y - 6), (cx + 10, y - 6), (cx + 7, y + 12), (cx - 7, y + 12)], fill=(250, 248, 242, TINT_HALF))
    return img


def win_chinatown(size, rnd):
    """Chinatown: a sash window with its frame painted in the street's red or green, and one in three with a
    little shrine's red lanterns or a pot of plants on the sill."""
    img, d = _bay(size, rnd, (238, 232, 222))
    w = int(size * 0.46); x0 = (size - w) // 2; y0 = int(size * 0.14); y1 = int(size * 0.8)
    frame = rnd.choice([(170, 44, 38), (46, 104, 74), (236, 232, 222), (170, 44, 38)])
    reveal(d, (x0, y0, x0 + w, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x0 + w - 4, y1 - 4), rnd, lit=0.3)
    rect(d, [x0, (y0 + y1) // 2 - 2, x0 + w, (y0 + y1) // 2 + 2], frame, KEEP)
    d.rectangle([x0, y0, x0 + w, y1], outline=(*frame, KEEP), width=5)
    rect(d, [x0 - 8, y1, x0 + w + 8, y1 + 8], (232, 226, 214), TINT)
    if rnd.random() < 0.35:
        for lx in (x0 + w // 4, x0 + 3 * w // 4):
            d.ellipse([lx - 9, y0 + 10, lx + 9, y0 + 32], fill=(206, 40, 30, KEEP))
            line(d, [(lx, y0 + 32), (lx, y0 + 40)], (232, 190, 60), KEEP, 2)
    elif rnd.random() < 0.3:
        rect(d, [x0 + 6, y1 - 20, x0 + w - 6, y1 - 2], (120, 70, 48), KEEP)
        for px0 in range(x0 + 8, x0 + w - 8, 12):
            d.ellipse([px0, y1 - 34, px0 + 14, y1 - 16], fill=(62, 110, 52, KEEP))
    return img


def wall_opera(size: int, rnd: random.Random) -> Image.Image:
    """The Opéra's granite: big square slabs with fine dark joints, barely varied — a machined surface."""
    img = Image.new('RGBA', (size, size), (236, 236, 232, TINT))
    d = ImageDraw.Draw(img)
    slab = size // 4
    for y in range(0, size, slab):
        for x in range(0, size, slab):
            c = jitter(rnd, (238, 238, 234), 4)
            d.rectangle([x + 1, y + 1, x + slab - 2, y + slab - 2], fill=(*c, TINT))
    for k in range(0, size, slab):
        line(d, [(k, 0), (k, size)], (170, 170, 168), TINT, 1)
        line(d, [(0, k), (size, k)], (170, 170, 168), TINT, 1)
    grain(img, rnd, 2)
    return img


WALLS['opera'] = wall_opera
WALLS['operaGlass'] = wall_opera


def win_opera(size, rnd):
    """The Opéra's cell: a square of blue-grey glass, set in a thick pale granite frame, with a thin mullion
    cross — the whole building is these squares, so they must tile edge to edge with nothing else."""
    img = Image.new('RGBA', (size, size), (236, 236, 232, TINT))
    d = ImageDraw.Draw(img)
    m = int(size * 0.08)
    rect(d, [0, 0, size, size], (238, 238, 234), TINT)
    line(d, [(0, 0), (size, 0)], (176, 176, 172), TINT, 2)
    line(d, [(0, 0), (0, size)], (176, 176, 172), TINT, 2)
    reveal(d, (m, m, size - m, size - m), 5)
    glass(img, (m + 3, m + 3, size - m - 3, size - m - 3), rnd)
    f = (214, 216, 214)
    c = size // 2
    rect(d, [c - 2, m + 3, c + 2, size - m - 3], f, KEEP)
    rect(d, [m + 3, c - 2, size - m - 3, c + 2], f, KEEP)
    d.rectangle([m, m, size - m, size - m], outline=(*f, KEEP), width=3)
    return img


def win_opera_glass(size, rnd):
    """The Opéra's curved front: the whole cell is glass — pale, reflecting the sky — in a fine grid of thin
    light mullions, four panes by four. Seen together the tiers read as a silvery drum."""
    img = Image.new('RGBA', (size, size), (236, 238, 238, TINT))
    d = ImageDraw.Draw(img)
    glass(img, (2, 2, size - 2, size - 2), rnd, lit=0.15)
    f = (226, 230, 232)
    for k in range(0, size + 1, size // 4):
        rect(d, [k - 2, 0, k + 2, size], f, KEEP)
        rect(d, [0, k - 2, size, k + 2], f, KEEP)
    return img


WINDOWS = {
    'haussmann': win_french, 'brownstone': win_sash, 'classical': win_pedimented,
    'brick': win_punched, 'bauhaus': win_ribbon, 'brutalist': win_recessed, 'skyscraper': win_curtain,
    'marais': win_casement,
    'tenement': win_sash,
    'chicago': win_chicago,
    'victorian': win_victorian,
    'vosges': win_vosges,
    'opera': win_opera,
    'operaGlass': win_opera_glass,
    'stucco': win_arched,
    'sfapartment': win_sfapartment,
    'chinatown': win_chinatown,
    'edwardian': win_sfapartment,
    'towerblock': win_punched,
    'presidio': win_sash,
    'presidioBrick': win_sash,
    'capecod': win_sash,
}


# ------------------------------------------------------------------ ground storeys
#
# The most valuable 256 pixels in the file. A street is read at eye level, and at eye level you are looking at
# shopfronts, doors and stoops — not at the fourth floor. A building whose ground storey is another row of
# windows is the clearest single tell that a city was generated.

SIGN_WORDS_FR = ['BOULANGERIE', 'PÂTISSERIE', 'TABAC', 'PHARMACIE', 'FROMAGERIE', 'LIBRAIRIE', 'CAFÉ', 'BISTROT',
                 'FLEURS', 'OPTIQUE', 'BOUCHERIE', 'ÉPICERIE', 'CAVE', 'CHAPELIER', 'GALERIE', 'CRÉMERIE']
# (English only: the shared list is what every non-Paris style paints, and BOULANGERIE, TABAC, PHARMACIE, OPTIQUE
#  and FLEURS turned up over San Francisco's shops — BUGS.md #255, 2026-10-02)
SIGN_WORDS = ['CAFÉ', 'BAKERY', 'DRUGS', 'PHARMACY', 'BOOKS', 'DELI', 'BAR', 'HARDWARE',
              'LAUNDRY', 'OPTICAL', 'FLOWERS', 'LIQUORS', 'GROCERY', 'BANK', 'SALON', 'TAILOR']
AWNING = [(168, 58, 48), (46, 82, 112), (58, 96, 62), (140, 116, 58), (96, 62, 96), (54, 54, 60)]


# (Georgia Bold FIRST, 2026-10-04: Didot's hairline crossbars vanish at the atlas's resolution — PHARMACY read
#  "PIIARMACY" on a Potrero Avenue shopfront)
_FONTS = ['/System/Library/Fonts/Supplemental/Georgia Bold.ttf', '/System/Library/Fonts/Supplemental/Baskerville.ttc',
          '/System/Library/Fonts/Supplemental/Didot.ttc', '/System/Library/Fonts/Supplemental/Georgia.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf']


def _word(img, d, box, word, ink):
    """A shop's word painted on its fascia in real letters — a serif as a sign-writer's — sized to fill the
    board. Painted blocks in place of letters read, close up, as a row of dashes (user: signs hard to read).
    Falls back to the blocks if no font is found."""
    from PIL import ImageFont
    x0, y0, x1, y1 = box
    font = None
    for path in _FONTS:
        try:
            size = int((y1 - y0) * 0.72)
            font = ImageFont.truetype(path, size)
            while font.getlength(word) > (x1 - x0) * 0.92 and size > 8:
                size -= 1
                font = ImageFont.truetype(path, size)
            break
        except OSError:
            font = None
    if font is None:
        h = (y1 - y0) * 0.46
        cw = h * 0.62
        x = (x0 + x1) / 2 - len(word) * cw / 2
        cy = (y0 + y1) / 2
        for ch in word:
            if ch != ' ':
                d.rectangle([x, cy - h / 2, x + cw * 0.72, cy + h / 2], fill=(*ink, KEEP))
            x += cw
        return
    d.text(((x0 + x1) / 2, (y0 + y1) / 2 + 1), word, font=font, fill=(*ink, KEEP), anchor='mm')


def _sign(d, box, rnd, fascia, words=None):
    """A fascia board with a name on it. Drawn as blocks rather than glyphs — at the distance a rider sees it,
    letterforms are noise and the rhythm of a word is the whole signal."""
    x0, y0, x1, y1 = box
    rect(d, [x0, y0, x1, y1], fascia, KEEP)
    line(d, [(x0, y0), (x1, y0)], shade(fascia, 1.3), KEEP, 2)
    word = rnd.choice(words or SIGN_WORDS)
    ink = (240, 236, 226) if sum(fascia) < 380 else (40, 38, 36)
    _word(None, d, (x0 + 6, y0 + 2, x1 - 6, y1 - 2), word, ink)

def ground_shopfront(size, rnd, accent, words=None):
    """Haussmann and brick: a glazed shop with a stall riser, a fascia sign above it, and about half the time
    an awning out over the pavement."""
    img, d = _bay(size, rnd, (238, 234, 226))
    x0, x1 = int(size * 0.05), int(size * 0.95)
    fascia_y = int(size * 0.2)
    _sign(d, (x0 - 4, int(size * 0.06), x1 + 4, fascia_y), rnd, rnd.choice(AWNING), words)
    y0, y1 = fascia_y + 6, int(size * 0.88)
    reveal(d, (x0, y0, x1, y1), 4)
    glass(img, (x0 + 4, y0 + 4, x1 - 4, y1 - 4), rnd, lit=0.5)
    f = (236, 232, 224)
    door_x = x0 + int((x1 - x0) * rnd.uniform(0.12, 0.72))
    dw = int((x1 - x0) * 0.2)
    rect(d, [door_x, y0 + 4, door_x + 3, y1], f, KEEP)                        # the shop door, in the glazing
    rect(d, [door_x + dw, y0 + 4, door_x + dw + 3, y1], f, KEEP)
    rect(d, [x0 + 4, y1 - 14, x1 - 4, y1], shade(accent, 0.9), KEEP)          # stall riser
    d.rectangle([x0, y0, x1, y1], outline=(*f, KEEP), width=4)
    if rnd.random() < 0.45:                                                   # awning
        c = rnd.choice(AWNING)
        ay = fascia_y + 8
        for i in range(x0 - 6, x1 + 6, 14):
            d.polygon([(i, ay), (i + 14, ay), (i + 11, ay + 26), (i + 3, ay + 26)],
                      fill=(*(c if (i // 14) % 2 == 0 else shade(c, 1.35)), KEEP))
        rect(d, [x0 - 6, ay, x1 + 6, ay + 4], shade(c, 0.8), KEEP)
    rect(d, [x0 - 6, int(size * 0.93), x1 + 6, size], (206, 202, 196), TINT_HALF)   # the pavement plinth
    return img


def ground_stoop(size, rnd, accent):
    """Brownstone: the ground floor is a half-basement with its own door under the steps, and the real front
    door is up a flight of stone stairs with an iron rail. The stoop is the whole character of the street."""
    img, d = _bay(size, rnd, (230, 224, 216))
    # the basement window, low and barred
    bx0, bx1 = int(size * 0.08), int(size * 0.4)
    by0, by1 = int(size * 0.56), int(size * 0.8)
    reveal(d, (bx0, by0, bx1, by1), 3)
    glass(img, (bx0 + 2, by0 + 2, bx1 - 2, by1 - 2), rnd)
    for i in range(bx0 + 5, bx1 - 2, 7):
        line(d, [(i, by0 + 2), (i, by1 - 2)], (58, 54, 50), KEEP, 2)
    # the stoop: treads rising to a door about two thirds of the way up
    steps = rnd.randint(5, 8)
    sx0, sx1 = int(size * 0.46), int(size * 0.94)
    top = int(size * 0.5)
    for i in range(steps):
        t = i / steps
        y = int(size * 0.92 - (size * 0.92 - top) * t)
        h = max(3, (int(size * 0.92) - top) // steps)
        x0s = int(sx0 + (sx1 - sx0) * 0.08 * t)
        rect(d, [x0s, y - h, sx1, y], shade((244, 240, 232), 1 - 0.04 * i), TINT)
        line(d, [(x0s, y - h), (sx1, y - h)], (252, 249, 242), TINT, 1)
    rail = shade(accent, 0.7)
    for rx in (sx0 + 4, sx1 - 4):                                             # the iron rail
        line(d, [(rx, int(size * 0.9)), (rx, top - 26)], rail, KEEP, 3)
    line(d, [(sx0 + 4, top - 26), (sx1 - 4, top - 26)], rail, KEEP, 3)
    # the door at the head of the steps
    dx0, dx1 = sx0 + 10, sx1 - 10
    dy0, dy1 = int(size * 0.12), top - 4
    rect(d, [dx0 - 7, dy0 - 8, dx1 + 7, dy1], (248, 244, 236), TINT)          # the door surround
    reveal(d, (dx0, dy0, dx1, dy1), 4)
    rect(d, [dx0 + 3, dy0 + 3, dx1 - 3, dy1], shade(accent, 0.85), KEEP)
    for k in range(2):                                                        # raised door panels
        py0 = dy0 + 10 + k * (dy1 - dy0 - 20) // 2
        d.rectangle([dx0 + 10, py0, dx1 - 10, py0 + (dy1 - dy0 - 30) // 2],
                    outline=(*shade(accent, 0.6), KEEP), width=2)
    d.ellipse([dx1 - 16, (dy0 + dy1) // 2 - 3, dx1 - 10, (dy0 + dy1) // 2 + 3],
              fill=(214, 186, 112, KEEP))                                     # brass knob
    return img


def ground_arcade(size, rnd, accent):
    """Classical: a round-headed arch on a rusticated base. The rustication — deep horizontal joints — is what
    makes the bottom of the building read as heavier than the top."""
    img, d = _bay(size, rnd, (242, 238, 230))
    for y in range(0, size, max(8, size // 14)):                              # rustication
        line(d, [(0, y), (size, y)], (206, 200, 190), TINT, 2)
        line(d, [(0, y + 2), (size, y + 2)], (250, 247, 240), TINT, 1)
    w = int(size * 0.6); x0 = (size - w) // 2; y1 = int(size * 0.92); y0 = int(size * 0.34)
    d.pieslice([x0, y0 - w // 2, x0 + w, y0 + w // 2], 180, 360, fill=(248, 245, 238, TINT))
    rect(d, [x0, y0, x0 + w, y1], (248, 245, 238), TINT)
    ix0, ix1 = x0 + 8, x0 + w - 8
    d.pieslice([ix0, y0 - w // 2 + 8, ix1, y0 + w // 2 - 8], 180, 360, fill=(86, 80, 72, KEEP))
    reveal(d, (ix0, y0, ix1, y1), 5)
    glass(img, (ix0 + 3, y0, ix1 - 3, y1 - 3), rnd, lit=0.3)
    rect(d, [(ix0 + ix1) // 2 - 2, y0, (ix0 + ix1) // 2 + 2, y1 - 3], (240, 236, 228), KEEP)
    rect(d, [x0 + w // 2 - 7, y0 - w // 2 - 2, x0 + w // 2 + 7, y0 - w // 2 + 12],
         (252, 250, 244), TINT)                                               # keystone
    return img


def ground_vosges_arcade(size, rnd, accent):
    """The Place des Vosges arcade: a round stone arch on square piers, all white stone (KEEP, never tinted
    red), opening into the shadow of the vaulted gallery with a lit shop window at the back of it."""
    img, d = _bay(size, rnd, (232, 227, 216))
    img.putalpha(0)
    d = ImageDraw.Draw(img)
    for y in range(0, size, max(10, size // 10)):                               # the piers' coursing
        line(d, [(0, y), (size, y)], (206, 200, 188), KEEP, 1)
    w = int(size * 0.72); x0 = (size - w) // 2; y0 = int(size * 0.4); y1 = size
    d.pieslice([x0, y0 - w // 2, x0 + w, y0 + w // 2], 180, 360, fill=(46, 42, 38, KEEP))
    rect(d, [x0, y0, x0 + w, y1], (46, 42, 38), KEEP)
    d.arc([x0 - 6, y0 - w // 2 - 6, x0 + w + 6, y0 + w // 2 + 6], 180, 360, fill=(244, 240, 232, KEEP), width=8)
    rect(d, [x0 + w // 2 - 7, y0 - w // 2 - 8, x0 + w // 2 + 7, y0 - w // 2 + 8], (250, 248, 242), KEEP)
    # the shop at the back of the gallery: a warm window under a dark fascia
    sx0 = x0 + int(w * 0.18); sx1 = x0 + w - int(w * 0.18); sy0 = int(size * 0.5)
    rect(d, [sx0, sy0 - 12, sx1, sy0 - 2], accent, KEEP)
    rect(d, [sx0, sy0, sx1, y1 - 16], (150, 118, 72), KEEP)
    glass(img, (sx0 + 4, sy0 + 4, sx1 - 4, y1 - 20), rnd, lit=0.8)
    rect(d, [0, y1 - 10, size, y1], (196, 190, 178), KEEP)                      # the gallery's stone floor
    return img


def ground_glazed(size, rnd, accent):
    """Bauhaus and skyscraper: a fully glazed base with a revolving or flush entrance and a flat canopy. No
    ornament; the transparency is the effect."""
    img = Image.new('RGBA', (size, size), (240, 240, 238, TINT))
    d = ImageDraw.Draw(img)
    x0, x1 = int(size * 0.03), int(size * 0.97)
    y0, y1 = int(size * 0.1), int(size * 0.93)
    glass(img, (x0, y0, x1, y1), rnd, lit=0.55)
    m = (226, 226, 228)
    for k in range(1, 4):
        x = x0 + (x1 - x0) * k // 4
        rect(d, [x - 3, y0, x + 3, y1], m, KEEP)
    rect(d, [x0, y1 - 3, x1, y1 + 3], (198, 198, 202), KEEP)
    if rnd.random() < 0.5:                                                    # entrance canopy
        cy = int(size * 0.34)
        rect(d, [x0 - 6, cy, x1 + 6, cy + 8], (214, 214, 216), KEEP)
        rect(d, [x0 - 6, cy + 8, x1 + 6, cy + 11], (176, 176, 180), KEEP)
    dx = int(size * 0.34)
    rect(d, [dx, y0 + 12, dx + 4, y1 - 3], (208, 208, 210), KEEP)
    rect(d, [dx + int(size * 0.3), y0 + 12, dx + int(size * 0.3) + 4, y1 - 3], (208, 208, 210), KEEP)
    rect(d, [x0 - 4, int(size * 0.94), x1 + 4, size], (204, 202, 198), TINT_HALF)
    return img


def ground_recessed(size, rnd, accent):
    """Brutalist: the ground floor pulled back behind the structure, leaving the piers standing in front of a
    shadowed void. Dark, heavy, and unmistakable."""
    img, d = _bay(size, rnd, (228, 226, 222))
    x0, x1 = int(size * 0.12), int(size * 0.88)
    y0, y1 = int(size * 0.12), int(size * 0.94)
    rect(d, [x0, y0, x1, y1], (120, 118, 114), TINT)                          # the void behind
    reveal(d, (x0, y0, x1, y1), 12)
    glass(img, (x0 + 18, y0 + 24, x1 - 18, y1 - 10), rnd, lit=0.35)
    rect(d, [0, y0 - 6, x0, size], (236, 234, 230), TINT)                     # the piers in front
    rect(d, [x1, y0 - 6, size, size], (236, 234, 230), TINT)
    line(d, [(x0, y0 - 6), (x0, size)], (206, 204, 200), TINT, 2)
    line(d, [(x1, y0 - 6), (x1, size)], (250, 248, 244), TINT, 2)
    return img


def dormer(size, rnd, accent):
    """The Haussmann attic: a zinc mansard with dormer windows set into it. This is the element that makes a
    Paris roofline unmistakable from three streets away."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rect(d, [0, 0, size, size], (188, 190, 192), KEEP)                        # the zinc slope
    for x in range(0, size, max(10, size // 12)):                             # standing seams
        line(d, [(x, 0), (x, size)], (168, 170, 174), KEEP, 2)
        line(d, [(x + 2, 0), (x + 2, size)], (206, 208, 210), KEEP, 1)
    w = int(size * 0.44); x0 = (size - w) // 2; y0 = int(size * 0.2); y1 = int(size * 0.74)
    rect(d, [x0 - 8, y0 - 10, x0 + w + 8, y1 + 6], (208, 210, 212), KEEP)     # the dormer cheeks
    d.polygon([(x0 - 12, y0 - 8), (x0 + w // 2, y0 - 26), (x0 + w + 12, y0 - 8)], fill=(200, 202, 206, KEEP))
    reveal(d, (x0, y0, x0 + w, y1), 3)
    glass(img, (x0 + 3, y0 + 3, x0 + w - 3, y1 - 3), rnd)
    rect(d, [x0 + w // 2 - 2, y0 + 3, x0 + w // 2 + 2, y1 - 3], (238, 238, 236), KEEP)
    d.rectangle([x0, y0, x0 + w, y1], outline=(238, 238, 236, KEEP), width=3)
    return img


def carriage(size, rnd, accent):
    """A porte cochère: the tall carriage door into a Paris courtyard. A round-headed opening in the stone,
    a pair of dark green panelled leaves with a small wicket door cut into one, and a glazed fanlight in the
    arch above them."""
    img, d = _bay(size, rnd, (238, 234, 226))
    x0, x1 = int(size * 0.1), int(size * 0.9)
    w = x1 - x0
    spring = int(size * 0.32)                     # where the arch springs from
    y1 = int(size * 0.95)
    rect(d, [x0 - 8, spring - w // 2 - 8, x1 + 8, y1], (246, 242, 234), TINT)   # the stone surround
    d.pieslice([x0 - 8, spring - w // 2 - 8, x1 + 8, spring + w // 2 + 8], 180, 360, fill=(246, 242, 234, TINT))
    # the opening's reveal, then the fanlight glass in the half-round
    d.pieslice([x0, spring - w // 2, x1, spring + w // 2], 180, 360, fill=(70, 66, 60, KEEP))
    fan = Image.new('RGBA', (w - 8, w // 2 - 4))
    glass(fan, (0, 0, fan.width, fan.height), rnd)
    mask = Image.new('L', fan.size, 0)
    ImageDraw.Draw(mask).pieslice([0, 0, fan.width, fan.height * 2], 180, 360, fill=255)
    img.paste(fan, (x0 + 4, spring - w // 2 + 4), mask)
    for k in range(1, 5):                          # the fanlight's radiating glazing bars
        a = math.pi * k / 5
        cx, cy = (x0 + x1) / 2, spring
        line(d, [(cx, cy), (cx - math.cos(a) * w / 2, cy - math.sin(a) * w / 2)], (230, 228, 222), KEEP, 2)
    green = (34, 58, 44) if rnd.random() < 0.7 else (26, 30, 34)
    rect(d, [x0, spring, x1, y1], green, KEEP)                                   # the two leaves
    rect(d, [(x0 + x1) // 2 - 1, spring, (x0 + x1) // 2 + 1, y1], shade(green, 0.6), KEEP)
    for lx0, lx1 in ((x0 + 6, (x0 + x1) // 2 - 6), ((x0 + x1) // 2 + 6, x1 - 6)):
        for py0, py1 in ((spring + 8, spring + int((y1 - spring) * 0.42)), (spring + int((y1 - spring) * 0.48), y1 - 8)):
            d.rectangle([lx0, py0, lx1, py1], outline=(*shade(green, 1.35), KEEP), width=2)
    rect(d, [x0, spring - 3, x1, spring + 3], shade(green, 0.8), KEEP)            # the transom
    rect(d, [x1 - 34, int(size * 0.6), x1 - 30, int(size * 0.66)], (196, 170, 96), KEEP)   # a brass handle
    return img


WOOD = [(40, 62, 48), (86, 30, 34), (26, 30, 38), (58, 44, 30)]   # green, oxblood, near-black, walnut


def ground_woodfront(size, rnd, accent):
    """The Marais shop: a painted wooden front applied over the stone — a deep fascia with the name in pale
    letters, slim panelled pilasters either side, small-paned glazing above a panelled stall riser, and the
    door to one side. Old Paris shopfronts are furniture; Haussmann's are holes."""
    img, d = _bay(size, rnd, (238, 234, 226))
    wood = rnd.choice(WOOD)
    x0, x1 = int(size * 0.04), int(size * 0.96)
    top, bottom = int(size * 0.07), int(size * 0.9)
    rect(d, [x0, top, x1, bottom], wood, KEEP)                                   # the whole front
    fy = int(size * 0.23)
    rect(d, [x0 + 8, top + 6, x1 - 8, fy], shade(wood, 1.15), KEEP)              # the fascia board
    word = rnd.choice(SIGN_WORDS_FR)          # the Marais front: French trades only
    _word(img, d, (x0 + 22, top + 8, x1 - 22, fy - 2), word, (226, 206, 150))              # gilt letters
    for px0 in (x0, x1 - 14):                                                     # panelled pilasters
        rect(d, [px0, top, px0 + 14, bottom], shade(wood, 1.2), KEEP)
        d.rectangle([px0 + 3, fy + 8, px0 + 11, bottom - 8], outline=(*shade(wood, 0.8), KEEP), width=1)
    gy0, gy1 = fy + 8, int(size * 0.7)
    door_left = rnd.random() < 0.5
    dw = int((x1 - x0) * 0.22)
    dx0 = x0 + 18 if door_left else x1 - 18 - dw
    gx0, gx1 = (dx0 + dw + 6, x1 - 18) if door_left else (x0 + 18, dx0 - 6)
    reveal(d, (gx0, gy0, gx1, gy1), 3)
    glass(img, (gx0 + 3, gy0 + 3, gx1 - 3, gy1 - 3), rnd, lit=0.6)
    for t in (0.33, 0.66):                                                        # glazing bars
        xx = int(gx0 + (gx1 - gx0) * t)
        line(d, [(xx, gy0), (xx, gy1)], shade(wood, 1.1), KEEP, 3)
    line(d, [(gx0, (gy0 + gy1) // 2), (gx1, (gy0 + gy1) // 2)], shade(wood, 1.1), KEEP, 2)
    rect(d, [gx0, gy1 + 6, gx1, bottom - 6], shade(wood, 0.9), KEEP)             # panelled riser
    d.rectangle([gx0 + 6, gy1 + 12, gx1 - 6, bottom - 12], outline=(*shade(wood, 1.25), KEEP), width=2)
    reveal(d, (dx0, gy0, dx0 + dw, bottom), 3)                                    # the door, half glazed
    glass(img, (dx0 + 5, gy0 + 5, dx0 + dw - 5, int(size * 0.55)), rnd, lit=0.4)
    rect(d, [dx0 + 5, int(size * 0.55), dx0 + dw - 5, bottom - 3], shade(wood, 0.95), KEEP)
    rect(d, [x0 - 6, int(size * 0.93), x1 + 6, size], (206, 202, 196), TINT_HALF)
    return img


def ground_garage(size, rnd, accent):
    """San Francisco's ground storey on a 25-foot lot: a garage door — the city was built before cars and
    every house has since had one cut into its front — or, in the other painting, the front door up a short
    stair under an arched hood. The grammar mixes the two along a street."""
    img, d = _bay(size, rnd, (242, 238, 230))
    # the two paintings alternate — garage, then door — so a street of them always has both
    ground_garage.n = getattr(ground_garage, 'n', -1) + 1
    if ground_garage.n % 2 == 0:
        x0, x1 = int(size * 0.1), int(size * 0.9)
        y0, y1 = int(size * 0.26), int(size * 0.94)
        reveal(d, (x0, y0, x1, y1), 5)
        door = rnd.choice([(232, 228, 218), (112, 76, 52), (196, 192, 184), (70, 74, 78), (150, 110, 70)])
        rect(d, [x0 + 5, y0 + 5, x1 - 5, y1], door, KEEP)
        for i in range(1, 5):                                                      # the sectional door's panels
            y = y0 + 5 + int((y1 - y0 - 5) * i / 5)
            line(d, [(x0 + 5, y), (x1 - 5, y)], shade(door, 0.78), KEEP, 2)
        if rnd.random() < 0.4:                                                     # a row of little windows
            gy = y0 + 5 + int((y1 - y0 - 5) * 0.2)
            for gx in range(x0 + 14, x1 - 20, 30):
                glass(img, (gx, gy - 12, gx + 20, gy - 2), rnd)
        rect(d, [x0 - 8, y0 - 12, x1 + 8, y0 - 4], shade(accent, 1.0), KEEP)     # the lintel band
    else:
        dx0, dx1 = int(size * 0.3), int(size * 0.7)
        dy0, dy1 = int(size * 0.18), int(size * 0.7)
        r = (dx1 - dx0) // 2
        d.pieslice([dx0 - 8, dy0 - 8, dx1 + 8, dy0 + 2 * r + 8], 180, 360, fill=(250, 248, 242, KEEP))
        rect(d, [dx0, dy0 + r, dx1, dy1], (84, 80, 74), KEEP)
        d.pieslice([dx0, dy0, dx1, dy0 + 2 * r], 180, 360, fill=(84, 80, 74, KEEP))
        wood = rnd.choice([(96, 62, 40), (60, 70, 62), (40, 44, 52)])
        rect(d, [dx0 + 5, dy0 + r, dx1 - 5, dy1], wood, KEEP)
        glass(img, (dx0 + 12, dy0 + r + 8, dx1 - 12, dy0 + r + 50), rnd, lit=0.4)
        for i in range(5):                                                         # the stair up to it
            y = dy1 + i * ((int(size * 0.94) - dy1) // 5)
            rect(d, [dx0 - 10 - i * 5, y, dx1 + 10 + i * 5, y + 8], shade((236, 232, 224), 1 - 0.03 * i), TINT)
    rect(d, [0, int(size * 0.94), size, size], (206, 202, 196), TINT_HALF)
    return img


SIGN_WORDS_CHINATOWN = ['RESTAURANT', 'BAKERY', 'TEA', 'HERBS', 'JEWELRY', 'IMPORTS', 'DIM SUM', 'NOODLES',
                        'SEAFOOD', 'GIFTS', 'MARKET', 'PHARMACY', 'BBQ', 'CAFE']


def ground_chinatown(size, rnd, accent):
    """Chinatown's shops: the ordinary shopfront, but its sign in the street's own colours — red on gold,
    gold on red, white on green — and its awning striped the same way."""
    img = ground_shopfront(size, rnd, (170, 44, 38), SIGN_WORDS_CHINATOWN)
    d = ImageDraw.Draw(img)
    # a pair of red lanterns under the fascia, one shop in two
    if rnd.random() < 0.5:
        for lx in (int(size * 0.2), int(size * 0.8)):
            line(d, [(lx, int(size * 0.2)), (lx, int(size * 0.26))], (40, 36, 32), KEEP, 2)
            d.ellipse([lx - 11, int(size * 0.26), lx + 11, int(size * 0.36)], fill=(214, 40, 30, KEEP))
            rect(d, [lx - 5, int(size * 0.36), lx + 5, int(size * 0.38)], (232, 190, 60), KEEP)
    return img


GROUNDS = {
    'shopfront': ground_shopfront, 'stoop': ground_stoop, 'arcade': ground_arcade,
    'glazed': ground_glazed, 'recessed': ground_recessed, 'garage': ground_garage,
    'chinatown/shopfront': ground_chinatown,
    # a style's own painting of a ground kind, where it differs: `<style>/<kind>` wins over `<kind>`
    'marais/shopfront': ground_woodfront,
    # Haussmann is Paris's: its shops are named in French
    'haussmann/shopfront': lambda size, rnd, accent: ground_shopfront(size, rnd, accent, SIGN_WORDS_FR),
    'vosges/arcade': ground_vosges_arcade,
}


def ground_for(style: str, kind: str):
    return GROUNDS.get(f'{style}/{kind}', GROUNDS[kind])
