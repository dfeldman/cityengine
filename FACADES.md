# Facades

The part of Street Runner most likely to be wrong in a way no test catches, and the reason the game looks like
a city rather than like OSM data.

## The problem

Render OpenStreetMap the obvious way and every building comes out the same: take the footprint, extrude it to
`building:levels × 3 m`, wrap it in a tiling brick texture, repeat two thousand times. This is roughly what
streets-gl does, and it is why its cities read as one building copied rather than as a street.

The eye reads a street by its **rhythm** — how wide the bays are, where the floor lines fall, how the ground
floor differs from the one above it, where the wall stops and the cornice begins. Miss that and no amount of
texture resolution rescues it. Get it right and even plain art reads as a real street.

## The shape of it

```
    styles.json          facade.ts              buildings.ts         facadegen/
    ───────────          ─────────              ────────────         ──────────
    seven styles    ──►  planFacade()      ──►  wall quads      ◄──  atlas.png
    with ranges          storey bands           per cell             elements
    and palettes         planWall()             feature boxes        walls/*.png
                         bays and cells         merged per tile      seamless
```

One style table, `src/city/styles.json`, read by **both** the TypeScript grammar and the Python painter. That
is deliberate: a palette that existed in one and not the other would be a silent mismatch between the art and
the geometry, and this is the file most likely to be edited.

## The three rules

Every one of these is a thing that, when it breaks, makes a city look generated — and none of them shows in a
screenshot of a single building. All three are pinned in `tests/facade.test.ts`.

1. **Bays are chosen per wall and shared by every storey**, so windows line up vertically. A facade whose
   windows wander is the single most obvious tell. The wall's leftover length goes into the *corner margins*,
   never into the bays, which is also what real buildings do — masonry returns at the corner, not half a
   window.
2. **Ground, middle and top are different by construction.** Buildings meet the pavement with doors and shops
   and meet the sky with a cornice. The ground storey is always taller; the top is always closed with
   something proud of the wall.
3. **Every random choice comes from the building's OSM way id.** A re-bake leaves the city identical, and two
   neighbours are never the same.

## The tint mask

The single trick that makes seven styles cover a city. Both painted pages store **alpha as a tint mask, not
transparency**:

```glsl
colour = albedo.rgb * mix(vec3(1.0), tint, albedo.a)
```

| painted as | mask | result |
|---|---|---|
| brick, pale | 1.0 | takes the palette fully — red here, yellow-buff two streets over |
| mortar | 0.25 | stays a pale grey line whatever the brick does |
| glass | 0.0 | keeps the colour it was painted; a red building has no red windows |

So one brick page plus four palettes is four visibly different brick buildings, and the painter never has to
know what colour anything will end up.

## Two pages, not one

A wall must **repeat** over whatever length it is; an element must **stay inside its cell**. Those want
opposite wrap modes, so they cannot share a texture:

- `public/facades/walls/<style>.png` — 512², seamless, repeating uvs in metres.
- `public/facades/atlas.png` — 2048², 256 px cells, clamped uvs, **8 px bleed**: the art is painted at 240 px
  and its edge pixels smeared into the margin. Without that, the lower mip levels average in whatever was
  packed next door and every window at distance grows a halo of its neighbour.

A per-vertex `kind` attribute picks between them, so a whole style stays one draw call.

## What makes painted art read as real

Three marks do most of the work, and they are cheap:

- **A dark line on the top and left inside edge of every opening.** A window is a hole in a thick wall, and
  the shadow the reveal casts is what says so. Two lines, and it is the highest-value mark in the file.
- **Glass is never one colour.** A vertical gradient from sky reflection at the top to the dark of the room at
  the bottom, with one to three soft diagonal streaks that vary in angle, position and strength — and about
  one window in six with none. The first version drew two hard bright bars on every window and the whole city
  wore the same stripes, which is exactly the uniformity this generator exists to avoid.
- **Per-unit variation in the material.** Every brick gets its own shade, a few are noticeably off, and the
  mortar is *lighter* than the brick. Uniform material is what makes rendered cities look like cardboard.

## Geometry or paint?

Openings are painted. Anything that breaks the **silhouette** is built:

| built | painted |
|---|---|
| cornice, parapet | window reveals and frames |
| balcony slab and rail | glazing bars, blinds, curtains |
| string course | shopfront signage and awnings |
| floor slab bands | door panels, stoop steps |
| pilasters, sills | wall material |

On a street you see buildings at a grazing angle, where the only thing that says a building has depth is its
edge against the sky and against its neighbour. Ten triangles of cornice buy more than doubling the texture
resolution. A typical building is 400–900 triangles.

## Working on it

```bash
python3 tools/facadegen/paint.py --sheet   # rebuild the atlas and a contact sheet
npm run dev                                 # then /?showcase=1
npm run shots                               # a screenshot per style, via Playwright
```

`public/facades/sheet.png` is the thing to look at: every style down the page, its wall material, the same
material tinted as the game tints it, its windows, its ground storey and its roofline. Tinted, because an
untinted sheet shows every style in the same off-white and hides the one variable that matters most.

Do **not** judge facades from the app's browser pane — it stops delivering animation frames while hidden and a
WebGL canvas captured from it comes back blank or half-drawn. That is what `npm run shots` is for.

## Not yet

- **A much larger atlas.** 2048² with 43 of 64 cells used is the prototype's budget, not the design's. More
  window variants per style, more ground storeys, night and seasonal variants, and street furniture all want
  room. Growing the page is a constant and a re-bake — but past a point it wants to become several pages or a
  texture array, and that changes the material, so it is worth deciding deliberately rather than by drift.
- **Normal and emissive maps** in the same atlas layout: real relief in the reveals, and lit windows at night.
- **Geometric window reveals** at the nearest level of detail.
- **`building:colour`** is read by the tag layer and currently ignored by the grammar, which prefers its own
  palettes. A tagged colour is a fact about the building and should win.
- **More ground storeys.** It is the storey the rider actually looks at, and there are two paintings of each.
