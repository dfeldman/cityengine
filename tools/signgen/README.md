# signgen — extruded sign lettering in a real typeface

Makes a GLB of a word in a real font, extruded, optionally with light bulbs along the letters. For the signs
that ARE the landmark: Ghirardelli, a theatre's name across a marquee, a hotel on a roof, a painted warehouse
name on the waterfront.

```
blender -b -P tools/signgen/gen.py -- \
  --text=Ghirardelli --height=5 --depth=0.35 --bulbs=0.5 \
  --font="/System/Library/Fonts/Supplemental/Georgia.ttf" \
  --out=public/models/signs/ghirardelli.glb
```

| flag | what it does |
|---|---|
| `--text=` | the word. Mixed case works and usually matters — most real signs are not capitals |
| `--height=` | CAP height in metres (measured off an `H`, so descenders do not shrink the word) |
| `--depth=` | how far the letters stand off their frame |
| `--bevel=` | a small chamfer on the letter edges, which is what catches the light on metal lettering |
| `--bulbs=` | bulb spacing in metres along the letter outlines; omit or `0` for plain letters |
| `--font=` | any TTF/OTF on the machine |
| `--out=` | the GLB, under `public/` so a landmark entry can name it in `file` |

The mesh comes out centred on the origin in x and y with its front face at z = 0 and the extrusion going back
into −z, so a builder can put a scaffold behind it without hunting for an offset.

## The GLBs are not checked in

`public/models/` is gitignored: **the assets are generated, and the code that generates them is what is kept.**
`npm run signs` rebuilds every sign the city needs from `tools/signgen/build.sh`, so add a line there when you
add a sign rather than leaving a GLB lying in a directory nobody can reproduce.

## Why this exists

`signText` in `render/landmarks/parts.ts` draws a 3×5 block font. That is the right tool for a small painted
name on a facade — a few cells read as writing and cost almost nothing, and there are hundreds of them. It is
the wrong tool for lettering you read from across the bay: blocky capitals give the game away, and the real
Ghirardelli sign is mixed-case with serifs and curves that a cell grid cannot make.

So: block font for the many, a real typeface for the few.

## Changing it for other styles

The script is deliberately small and meant to be edited:

- **A different look** is mostly `--font` plus the material at the bottom of `gen.py` — base colour, metallic
  and roughness. Painted wooden letters want metallic 0, a high roughness and a colour; polished steel wants
  the opposite.
- **Neon** would be the bulb path with a much smaller spacing, a thin tube instead of spheres, and no letter
  extrusion — set `--depth` very small and raise the emission.
- **Individually lit channel letters** (a cinema) want the letters themselves emissive rather than the bulbs:
  move the emission onto the `sign` material.
- **A backing board** is not generated here. Signs differ far more in their frames than in their letters —
  Ghirardelli stands on an open steel lattice, a marquee is a box, a blade sign hangs off a wall — so the
  frame stays in the builder where it can use the kit (`beam` for a truss, `boxAlong` for a box) and only the
  lettering comes from here.

## Cost

A word is a few thousand triangles per letter at the default bevel, and the bulbs are eight-segment spheres.
Ghirardelli at `--bulbs=0.5` is 385 bulbs and about 2 MB. That is fine for a handful of landmarks and would
not be fine for every shopfront in the city — which is the same line as above: block font for the many.
