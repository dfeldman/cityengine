#!/usr/bin/env python3
"""
Builds the facade art the renderer draws with.

    python3 tools/facadegen/paint.py              everything
    python3 tools/facadegen/paint.py --sheet      and a contact sheet to judge it by

Output, all under `public/facades/`:

    walls/<style>.png     a seamless material page per style, sampled with repeating UVs
    atlas.png             the elements — windows, ground storeys, dormers — packed 256 px to a cell
    atlas.json            which cell is which, in UVs, plus the style table the grammar used
    sheet.png             a contact sheet (only with --sheet); not shipped, just for looking at

Two pages rather than one because they are sampled differently: a wall has to REPEAT across a surface however
big it is, and an element has to sit in its cell and not bleed into its neighbour. Those want opposite wrap
modes, so they cannot share a texture. `src/render/facade-material.ts` binds both and picks per vertex.

Element cells carry an 8 px bleed: the art is painted at 240 px and its edge pixels are smeared into the
margin. Without it, the lower mip levels average in whatever was packed next door and every window at
distance grows a halo of its neighbour.

Everything here is generated from nothing — no photographs, no scanned facades — so the output is CC0 and
ships with the game with no attribution beyond the generator itself.
"""
import argparse
import json
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


from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import draw  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / 'public' / 'facades'
STYLES_JSON = ROOT / 'src' / 'city' / 'styles.json'

CELL = 256          # one element's slot in the atlas
BLEED = 8           # margin smeared with edge pixels so mips do not sample the neighbour
ART = CELL - 2 * BLEED
COLS = 8            # 8 across…
ROWS = 20           # …by 20 down: 2048 × 5120 (a 17th row for the Presidio's two styles, 2026-10-02; an 18th and 19th for
                    # the Wharf's five shopfronts and the generic storefront's five treatments, 2026-10-16; a 20th for the
                    # Presidio's third style and its three-way ground storeys, 2026-10-17). It was 8 × 8 until the three American styles filled it; two
                    # pages tall keeps every UV the manifest gives and needs nothing new of the material
WALL = 512          # seamless material page
VARIANTS = 3        # how many paintings of each element; the grammar picks between them per bay
# ground storeys painted more than twice: the Wharf's five themed shopfronts, and the generic storefront's five treatments
# where most of San Francisco's shops are (brick, tenement)
GROUND_VARIANTS = {'wharf': 5, 'brick': 5, 'tenement': 5,
                   # …and the Presidio's three: an entrance and two windows, so about one bay in three is a door
                   'presidio': 3, 'presidioBrick': 3, 'presidioStucco': 3}


def bleed(art: Image.Image) -> Image.Image:
    """Paste `art` into a CELL-sized tile and smear its edges into the margin."""
    tile = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    tile.paste(art, (BLEED, BLEED))
    # edges outward, then the four corners
    tile.paste(art.crop((0, 0, ART, 1)).resize((ART, BLEED)), (BLEED, 0))
    tile.paste(art.crop((0, ART - 1, ART, ART)).resize((ART, BLEED)), (BLEED, CELL - BLEED))
    tile.paste(art.crop((0, 0, 1, ART)).resize((BLEED, ART)), (0, BLEED))
    tile.paste(art.crop((ART - 1, 0, ART, ART)).resize((BLEED, ART)), (CELL - BLEED, BLEED))
    for sx, sy, dx, dy in ((0, 0, 0, 0), (ART - 1, 0, CELL - BLEED, 0),
                           (0, ART - 1, 0, CELL - BLEED), (ART - 1, ART - 1, CELL - BLEED, CELL - BLEED)):
        tile.paste(art.crop((sx, sy, sx + 1, sy + 1)).resize((BLEED, BLEED)), (dx, dy))
    return tile


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet', action='store_true', help='also write a contact sheet to look at')
    ap.add_argument('--seed', type=int, default=20260920)
    args = ap.parse_args()

    # (a style with `art` paints nothing: it draws with another style's cells and wall page — src/city/facade.ts)
    styles = [st for st in json.loads(STYLES_JSON.read_text())['styles'] if 'art' not in st]
    (OUT / 'walls').mkdir(parents=True, exist_ok=True)

    # ---- the seamless wall materials
    for st in styles:
        rnd = random.Random(args.seed ^ stable(st['id']) & 0xffffffff)
        page = draw.WALLS[st['id']](WALL, rnd)
        page.save(OUT / 'walls' / f"{st['id']}.png")
        print(f"  walls/{st['id']}.png")

    # ---- the far pages: one bay by one storey, repeating, for the city beyond the rideable box (fringe.ts).
    # The style's own window cell is exactly that — a window with its wall round it — so it tiles as is.
    for st in styles:
        page = draw.WINDOWS[st['id']](256, random.Random(args.seed ^ stable(st['id'] + '/far') & 0xffffffff))
        page.save(OUT / 'walls' / f"{st['id']}-far.png")

    # ---- the element atlas
    atlas = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    entries: dict[str, list[dict]] = {}
    slot = 0

    def place(name: str, art: Image.Image) -> None:
        nonlocal slot
        if slot >= COLS * ROWS:
            raise SystemExit(f'atlas full at {name}; raise COLS')
        cx, cy = slot % COLS, slot // COLS
        atlas.paste(bleed(art.resize((ART, ART), Image.LANCZOS)), (cx * CELL, cy * CELL))
        # UVs address the ART region only, never the bleed margin
        u0 = (cx * CELL + BLEED) / atlas.width
        v0 = (cy * CELL + BLEED) / atlas.height
        entries.setdefault(name, []).append(
            {'u0': u0, 'v0': v0, 'u1': u0 + ART / atlas.width, 'v1': v0 + ART / atlas.height})
        slot += 1

    for st in styles:
        sid = st['id']
        accent = draw.hex_rgb(st['palettes'][0]['accent'])
        for v in range(VARIANTS):
            place(f'{sid}/window', draw.WINDOWS[sid](ART, random.Random(args.seed + v * 977 + stable(sid) % 1000)))
        # (the Wharf paints five shopfronts, not two: its fascias carry the district's words, and with two every
        #  shop on Jefferson Street said CRAB or GIFTS)
        for v in range(GROUND_VARIANTS.get(sid, 2)):
            painter = draw.ground_for(sid, st['ground'])
            gr = random.Random(args.seed + 31 + v * 613 + stable(sid) % 1000)
            # (a painter marked `by_variant` paints a different THING per variant — the Presidio's door, then windows)
            place(f'{sid}/{st["ground"]}',
                  painter(ART, gr, accent, variant=v) if getattr(painter, 'by_variant', False) else painter(ART, gr, accent))
        if st['top'] == 'mansard':
            place(f'{sid}/dormer', draw.dormer(ART, random.Random(args.seed + 71), accent))
        if sid in ('haussmann', 'marais'):
            # the porte cochère the grammar puts in one ground-floor bay in three (facade.ts planWall)
            place(f'{sid}/carriage', draw.carriage(ART, random.Random(args.seed + 83 + stable(sid) % 1000), accent))
        # A blank wall cell per style, for returns too narrow to hold a window. It is the wall material
        # itself, so it matches what is either side of it.
        place(f'{sid}/wall', draw.WALLS[sid](ART, random.Random(args.seed + 97)))

    atlas.save(OUT / 'atlas.png')
    manifest = {
        'cell': CELL, 'bleed': BLEED, 'size': atlas.width, 'variants': VARIANTS,
        'note': 'alpha is a TINT MASK, not transparency: final = albedo * mix(white, wallColour, alpha)',
        'elements': entries,
        'walls': {st['id']: f"walls/{st['id']}.png" for st in styles},
    }
    (OUT / 'atlas.json').write_text(json.dumps(manifest, indent=1))
    print(f'  atlas.png  {atlas.width}×{atlas.height}px, {slot} of {COLS * ROWS} cells used')
    print(f'  atlas.json {len(entries)} elements')

    if args.sheet:
        sheet(styles, args.seed)
    return 0


def apply_tint(img: Image.Image, wall_hex: str) -> Image.Image:
    """What the shader does, done in Pillow: albedo × mix(white, wallColour, alpha). Used by the contact
    sheet so that what is on the sheet is what the game will actually draw — an untinted sheet shows every
    style in the same off-white and hides the one variable that matters most."""
    pal = draw.hex_rgb(wall_hex)
    out = img.convert('RGBA').copy()
    pxa = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pxa[x, y]
            f = a / 255
            pxa[x, y] = (int(r * (1 - f + f * pal[0] / 255)),
                         int(g * (1 - f + f * pal[1] / 255)),
                         int(b * (1 - f + f * pal[2] / 255)), 255)
    return out


def sheet(styles, seed: int) -> None:
    """A contact sheet: every style down the page, its wall material and its elements across, all tinted as
    the game tints them. This is the thing to look at when deciding whether the art is good enough — the
    atlas itself is unreadable and the untinted art is misleading."""
    S = 200
    cols = 2 + VARIANTS + 2
    img = Image.new('RGB', (cols * S, len(styles) * S), (24, 24, 26))
    for row, st in enumerate(styles):
        sid = st['id']
        pal = st['palettes'][0]['wall']
        accent = draw.hex_rgb(st['palettes'][0]['accent'])
        seeds = random.Random(seed ^ stable(sid) & 0xffffffff)
        tiles = [draw.WALLS[sid](WALL, random.Random(seed ^ stable(sid) & 0xffffffff)).convert('RGB')]
        tiles.append(apply_tint(draw.WALLS[sid](WALL, random.Random(seed ^ stable(sid) & 0xffffffff)), pal))
        for v in range(VARIANTS):
            tiles.append(apply_tint(
                draw.WINDOWS[sid](ART, random.Random(seed + v * 977 + stable(sid) % 1000)), pal))
        tiles.append(apply_tint(
            draw.ground_for(sid, st['ground'])(ART, random.Random(seed + 31 + stable(sid) % 1000), accent), pal))
        tiles.append(apply_tint(
            draw.dormer(ART, random.Random(seed + 71), accent) if st['top'] == 'mansard'
            else draw.WINDOWS[sid](ART, seeds), pal))
        for col, t in enumerate(tiles[:cols]):
            img.paste(t.convert('RGB').resize((S, S)), (col * S, row * S))
    img.save(OUT / 'sheet.png')
    print(f'  sheet.png  {img.width}x{img.height} - wall, tinted wall, {VARIANTS} windows, ground, top')


if __name__ == "__main__":
    raise SystemExit(main())
