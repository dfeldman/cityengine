# Model: the Music Concourse fountains, Golden Gate Park

2026-10-27, for `musicConcourse` in `src/render/landmarks/sf/strawberry-hill.ts`, and the moving-water system in
`src/render/water.ts`. Owner: "add a fountain rendering system. we already have waterfalls. the large fountains in
golden gate park look really bad … Probably just a shader that imitates moving water, not a particle system."
`?model=musicConcourse`.

## The system was already there

`render/water.ts` (2026-10-06, #516) IS that system: jets, sheets, pools and splashes as fixed meshes whose shader
runs the water through them — no particles. The Legion of Honor fountain, the Vaillancourt Fountain, Huntington Falls
and the Tea Garden falls all use it (`out.water` on the builder's MeshBuilder). The Concourse's three fountains never
moved onto it: their jets were white `strut`s (28 five-piece hairline parabolas round Rideout, a white stick in each
side basin) and their water a glass-tagged prism. That is what looked bad. (`render/fountains.ts` is the older Paris
manifest system; left alone.)

## What changed

**The Concourse fountains** (all three basins on the axis, centred on the middle one):
- rim: a ring of coping stones round an open basin, a dark floor, a `pool` in it; the basin stands on the HIGHEST
  ground round its rim and the coping runs down to the lowest. In the city the terrain under OSM's basin water is
  lower than the paving, and the promenade's gravel strip — wider than the side basins, narrower than Rideout's —
  drew straight across the Rideout pool. The strip now stops at Rideout's rim; under the side basins the floor covers
  it.
- each bronze bowl holds its own `pool` (just over the bowl's solid top) and overflows all round in `sheet`s, white
  `splash` where the curtain lands.
- Rideout: the 28-jet ring is now real jets from nozzles 1.3 m out from the bowl, each topping out a metre over the
  lip and landing inside it (vy = √(2gh), flight T = √(2h/g) + √(2(h − dy)/g), inward speed = distance / T), a small
  splash at each nozzle. The figure and swan are unchanged (no new sculpture).
- side basins: a single 2 m jet out of the bowl, falling back into it.

**`render/water.ts`:**
- a jet now ends in the pool it actually comes down INTO: the highest pool below its apex whose ring contains its
  landing point, else the lowest pool, else 0; `land` overrides. Every jet used to stop at the highest pool's level,
  so the Legion's ring of rim jets ended in mid-air at the height of its central bowl — fixed by this with no change
  to `legion.ts`.
- the pool shader: ripples tilt the surface normal, and through it the pool shows its own tint looking down and the
  sky (the scene's zenith/horizon) at a glancing angle (Fresnel), with a tight sun glint — the sun direction from
  `DAYLIGHT`. Was a two-tone of the tint with blotchy cyan glints.
- `src/model-showcase.ts` raises a model's `out.water` (parented to the model, as `render/landmarks.ts` does), so
  `?model=` and `tools/model-shots.ts` show fountains with their water.

## Checked

Showcase: Rideout three-quarter, low and top-down; a side basin; Legion (rim jets now reach the pool); Huntington Falls
(unchanged). City (`tools/shoot-landmark.sh`, Concourse at −4882, −2488): top-down at 70 m — three basins of water on
the axis, the promenade stopping at Rideout; a low oblique from the south. Vaillancourt in the city, from the plaza:
its sheets, jets and pool were already on this system and show; not changed beyond the pool shader.

Noted, not changed: in the low city oblique a palm of the park's scatter stands at the Rideout basin's south edge.
