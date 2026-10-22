#!/usr/bin/env python3
"""
Crop a captured frame to the building between its two red dashed lines (tools/photo.ts `mark`), with a margin, so a
model reading it sees the target large and its neighbours small. Appearance research, 2026-10-21.

    python3 -I tools/appearance/crop.py <in-dir> <out-dir>     every *.jpg under in-dir, mirrored into out-dir

The lines are found by colour (#ff2d2d), column by column: a column is a line where a sixth of its pixels are that red.
A frame with fewer than two line clusters is copied whole.
"""
import sys
from pathlib import Path
from PIL import Image


def lines(im: Image.Image) -> list[int]:
    w, h = im.size
    px = im.load()
    cols = []
    for x in range(w):
        n = 0
        for y in range(0, h, 2):
            r, g, b = px[x, y][:3]
            if r > 200 and g < 90 and b < 90:
                n += 1
        if n > h / 2 / 6:
            cols.append(x)
    # cluster adjacent columns into lines
    out: list[list[int]] = []
    for x in cols:
        if out and x - out[-1][-1] <= 3:
            out[-1].append(x)
        else:
            out.append([x])
    return [round(sum(c) / len(c)) for c in out]


def crop(src: Path, dst: Path) -> str:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    ls = lines(im)
    dst.parent.mkdir(parents=True, exist_ok=True)
    if len(ls) < 2:
        im.save(dst, quality=90)
        return 'whole'
    x0, x1 = min(ls), max(ls)
    m = round(0.08 * w)
    box = (max(0, x0 - m), 0, min(w, x1 + m), h)
    im.crop(box).save(dst, quality=90)
    return f'{box[2] - box[0]}/{w}'


if __name__ == '__main__':
    a, b = Path(sys.argv[1]), Path(sys.argv[2])
    for f in sorted(a.rglob('*.jpg')):
        print(f.relative_to(a), crop(f, b / f.relative_to(a)))
