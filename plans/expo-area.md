# Porte de Versailles / Balard / Issy — expo-area plan

Already in the data (check these first; don't rebuild):
- `tourSequana` — public/landmarks/paris/batch9.json:76. User sees it as missing/plain → check placement and whether it renders.
- `hexagoneBalard` — museums.json:753. User sees grass where the Ministry is → check it renders and its footprint matches; the sat tile hides it, so OSM is the only source.
- Cirque Bormann-Moreno — civic.json:39711, a sign only (`word`). No tent yet.

## Phase 0 — fix what's broken (quick, do first)
1. **Overlap at 48.833237, 2.281181**: custom renderer + generic building on the same ring. Find the generic's OSM id and add it to the exclude list that other landmarks use.
2. **All white concrete at 48.836176, 2.281809**: a part with no material tag (see the pale-faces memory). Tag its faces glass/metal, or build it properly in Phase 1.
3. **Steep drop at 48.834267, 2.276238** (Périphérique by Issy): probably a terrain cut or a tunnel/trench mask in tools/tunnels.ts or quays.ts where the road should be on a bridge. Read the elevation profile along the way, then fix the layer/bridge tag or smooth the cut.
4. **Périphérique elevated sections**: check which OSM ways have `bridge=yes`/`layer≥1` between Porte de Sèvres and Porte de Versailles, and make sure the deck, piers and the ground under it render. Data fix, not a custom renderer.

## Phase 1 — Paris Expo (most important)
One file, `src/render/landmarks/paris/expo/`, a builder per hall, set out in an E/N frame (enframe.ts) from OSM building parts:
- **Pavilion 5**: the wavy roof. Use a sine-ruled surface over the footprint (tunable amplitude/period/count), with a glass front.
- **Pavilion 1 / Paris Convention Centre (Pav. 7)**: big glass-and-steel box, a sloped canopy on the front, a grid of mullions as a shader surface.
- Other halls (2–4, 6, 8): parametric box sheds, one helper with height, colour and band settings; the existing partial model becomes one of these.
- **Fountain** at the main entrance: a round basin plus a procedural jet (Tripo only if it's sculptural).
- Get roof heights from the IGN lidar MNS before you start.

## Phase 2 — shopping centres (easy and geometric)
Aquaboulevard and the glass retail blocks next to it: stacked glass boxes with steel bands and a roof plant. One shared `glassMall(params)` recipe in kit/recipes.ts.

## Phase 3 — exceptional towers
- **Tour Sequana**: fix or finish it — tall glass slab with set-backs and a crown.
- **37 Tour / 37 Rue du Colonel-Pierre-Avia (Roosevelt?)**: confirm which building is meant, then a glass tower builder with the facade rhythm as tunables.

## Phase 4 — Ministry of Defence (Balard)
- Hexagone: get the existing builder to show (Phase 0). Then low courtyard blocks plus the Parallélogramme tower. Fidelity can stay low.
- **Heliport (Issy/Paris heliport)**: a flat apron, a painted H and circles, a small terminal box, wind socks. Use `aeroway=helipad/heliport` from OSM. Cheap.

## Phase 5 — fun extra
- **Cirque Bormann-Moreno**: a striped big top (cone + catenary skirt, tunable stripe count) next to the existing sign, a few caravans.

## Notes
- Get footprints and parts from the local pbf with osmium (fast).
- Sonnet subagents for each builder, at most 1–2 at a time; Haiku to read photos.
- Check each piece with shoot-landmark (tinyres → lowres), CITY=paris-centre.
- Order: 0 → 1 → 2 → 3 → 4 → 5. Each phase is one commit.

## Owner's steers (2026-11-05)
- Seen from a distance (bikers stay on the Seine): shape, colour, size only. Not lidar roofs or facade rhythm.
- Hexagone already renders. Phase 4 = heliport only. Much of the Expo is under construction.
- Aquaboulevard: huge glass pyramids + waterslides, not a glass box.
- Seine side first: Sequana (= Accor HQ, already modelled, check it reads), DGAC (long low building), Roosevelt quay complex, heliport.
