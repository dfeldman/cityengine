# La Défense raised walkways: audit (2026-11-16)

Bake audited: the current local paris-centre (2026-11-15 rebake). Positions are paris-centre local x,z (tools/ll2xz.ts).
"g" is the baked terrain (the lidar's dalle), "h" the edge's baked height. Real heights from BD TOPO and the lidar MNS
BD TOPO `troncon_de_route` z (NGF) was fetched for 48.886–48.896 / 2.228–2.255 (2025 features). The package datum is ≈ NGF − 31.5
(at-grade checks: Jardins de l'Arche 53.5 ↔ 22.2, Rue Serpentine 48.3 ↔ 16.3, Liaison Médiane 44.4 ↔ 12.8). "Real" below = BD TOPO z − 31.5.

## Real heights (BD TOPO) against the game

| Walkway | BD TOPO z (sol) | real, game datum | game | verdict |
|---|---|---|---|---|
| La Jetée, junction (-7178,3628) | 66.7 (1) | 35.2 | 27.1 / 30.1 / 33.1 | 2–8 m low and stepped |
| La Jetée, middle (-7300,3686) | 66.3 (1), autoroute under at 48.0 (−1/−4) | 34.8 | 31.5 (hump top) | 3 m low |
| La Jetée, west end (-7478,3772) | 65.6 (1); Jardins de l'Arche 53.5 (0) | 34.1, 12 m over the garden | 27.5 | 6.6 m low; real deck is flat at ~34–35 and does end in the air (closed) |
| Passerelle des Reflets (-6258,3373) | 58.2 (1); Liaison Médiane 44.3 (−3) / 44.5 (0) | 26.7, 14 m over the road | 17.9 | 9 m low: the `footBridgeLayers` one-storey cap is wrong here |
| Terrasse des Reflets (dalle) | 58.2 (0) | 26.7 | ground 13–23 | the dalle's edge smeared by the terrain: the ramp is an artefact |
| Passage de Seine (-5760,3146) | 43.2 (0); Voie des Blanchisseurs 30.3 | 11.7 | 7.8–9.4 | ~3 m low (the datum may differ by the river) |
| Bd Patrick Devedjian (-7049,2982) | 71.0 (1) | 39.5 | 41.8 | 2 m high, fine |
| N192 under Trinity (-6668,3599) | 52.7 (0/−1) | 21.2 | 18.8–23.9 | fine |
| Rue Serpentine (-6600,3826) | 48.3 (0); Devedjian above 58.0–60.0 (1) | 16.8 / 26.5–28.5 | 16.1–16.4 / 27.1 | fine |

So the La Défense foot decks are generally too LOW, not too high: the regions.json cap (layer 1 = 5.5 m) was set against OSM
layers 2/4 that stood 11–22 m up, but the real decks are 12–14 m over what they cross. A better rule: heights from BD TOPO z for
`sol=1` Sentier/Escalier/pedestrian ways in the zone (as the Seine band does), instead of a layer cap. That needs a rebake.

## Inventory (core)

| Structure (OSM) | lat, lon / x,z | OSM tags | Game draws | Reality / verdict |
|---|---|---|---|---|
| La Jetée, w15224025 + w1126693845 (edges 314409, 314410, 316167) | 48.8944,2.2299 → 48.8931,2.2339 / -7478,3772 → -7125,3602 | bridge, layer 4, `access=no`, "Toujours fermé" | Three chains with three profiles: 314409 flat at 27.5 (g 22–25.5); 314410 a 6 m hump to 31.5 and back down to 27.1; 316167 flat at 33.1 (g 24–27.8). At node -7178,3628 the three ways stand 27.1 / 30.1 (side footway 315012) / 33.1. The west end of 314409 does not connect to anything: 5 m over the footways at -7480,3767 | The Jetée is the dalle carried west over the Boulevard Circulaire, at one level, and it is closed to the public. The steps are wrong. It should also not be rideable (access=no is not read for footways) |
| Passerelle des Reflets, w640083292 (edge 318330) | 48.8907,2.2466 / -6258,3373 | bridge, layer 1 | deck ~17.9 over the Liaison Médiane (12.3–13.8); the Terrasse des Reflets (316851, ramp) ramps 17.9 → 23 through the Euronext building (386007522, min 0, 35 m) | The footbridge is real. The ramp's path runs through a generic building drawn solid from the ground: the camera ends up inside it |
| Passage de Seine, w45748356/w651001040 + w852424290 (edges 277117, 277207) | 48.8888,2.2534 / -5781,3104 → -5759,3148 | 277117 `bridge` L1 over the quay road; w852424290 `covered=yes` | 277117 deck 9.4 → 7.8 (ground under it falls to 1.7); 277207 is a `passage` at 7.85 inside the Damiers d'Anjou (82467023, min 0, 38 m) | Correct in reality: the passage goes under the Damiers (a covered way). In the game the generic building is solid; only a passage vault is drawn |
| Voie de l'Ancre (edges 277201, 960000000000481, 277218) | 48.8894,2.2535 / -5751,3214 | bridge L1 | decks 3.9–4.7 next to ground 5.4 | Below the dalle edge; no building at the point. Probably the owner's second "through a building" is the same Damiers passage; to check |
| Boulevard Circulaire, Bd Patrick Devedjian (edge 274002) | 48.8873,2.2358 / -7049,2982 | bridge L2 | 41.8 over g 32.5 (9.3 m); bareViaducts gives it walk 0.6 | A viaduct with no pedestrians: that is what bareViaducts is for |
| N192 under Tour Trinity (edges 318570, 318572) | 48.8928,2.2410 / -6668,3599 | `tunnel=building_passage`; Trinity (w758211633) is `layer=4`, 151 m | Road in a cut through a passage arch; Trinity's footprint drawn from 0 | Correct in reality: Trinity stands on a slab over the road. Needs a podium/min_height in the landmark, not a road fix |
| Terrasse des Reflets tunnels (w780545651, w1268644552) | 48.8907,2.2466 | layer −1, tunnel | not drawn | OK |

## The owner's bugs

1. **Massive drop at 48.893146, 2.233859** (-7188,3634). La Jetée's ways meet a side footway at node -7178,3628. `chains()`
   (tools/bridges.ts:131) only runs through a node of degree 2, so the deck was cut in three chains and `bridgeHeights` (tools/bridges.ts,
   the chain loop after `allChains`) profiled each from its own ends: 314410 humped (`MAX_HUMP_GRADE`), 316167 lifted 5.5 m
   (`PER_LAYER`) over a way under it. Nothing reconciles two bridge ends at one node (`meetDecks`, tools/bridges.ts:1313, moves only
   non-bridge ways). **Fixed in code** (rebake needed): a named foot deck now chains through a 3-way node onto its one way of the
   same name and layer (`namedOnward`, `CHAIN_THROUGH_NAMED=0` turns it off); tests/defense-walkways.test.ts. The side footway
   315012 is still its own chain and may still stand off the deck there.
2. **Again at 48.894397, 2.229903** (-7477,3773). 314409's west end (node 150668946) is joined to no other way: a deck that ends in
   the air 5 m up, so `meetDecks`/`rampFootBridgeEnds` never see it. Its flat 27.5 is the default `rise: 2, over: 'nothing'`
   (tools/bridges.ts, end of `bridgeRise`) above the higher end. The Jetée is `access=no` "always closed" in OSM; the bake does not
   read `access=no` on footways, so it is ridden. Proposed (not done): drop `access=no` foot bridges from the ride graph, or let
   a foot bridge over nothing inside a `footBridgeLayers` zone take rise 0.
3. **Footway through a building, 48.888761, 2.253356 / 48.889371, 2.253476**. The Passage de Seine is `covered=yes` under the
   Damiers d'Anjou (82467023): the bake marks it `passage` (tools/bake.ts:371) and render/passages.ts draws a vault, but the generic
   building stays solid round it. Correct in reality; the building needs to be cut (render), not the path moved. Second point:
   Voie de l'Ancre bridges, no building at the point; to check in game.
4. **Canopied skyway hides the camera, 48.890685, 2.246557**. Not a canopy: the Terrasse des Reflets ramp (316851, given `ramp`
   by `rampOnward`, tools/bridges.ts:1385) climbs to the Passerelle des Reflets through the generic Euronext building
   (386007522, min 0, h 35). Either the footprint is wrong or the building stands on the dalle over the path; the terrain also
   climbs 13 → 23 m in 55 m here (the dalle's edge smeared). Needs a look at the photo/lidar before a fix.
5. **Giant building on top of a road, 48.892831, 2.240951**. Tour Trinity, which really does straddle the N192 (`building_passage`,
   building `layer=4`). Correct in reality; the tower wants a podium with a void over the road (a landmark job; defense-famous is
   another agent's).
6. **Road through a building, 48.894869, 2.241880 / 48.894931, 2.241546** (-6600,3826). The road is the Boulevard Patrick
   Devedjian viaduct (316942, bridge L2, at 27.1, BD TOPO 58–60 = 26.5–28.5: right) and a bridge path (317355). They run through the
   generic office building w82486000 (cadastre, 8 levels, 25.8 m, min 0, ground 14.7 → roof 40.5): 15 of the viaduct's points are
   inside its ring. Not a landmark (the defense2 neighbours Les Dauphins w82486104 and Maréchal Leclerc w82486286 are 27–35 m off and
   do not contain it). Cadastre footprints run under the viaduct; the building can't stand through the deck. Fix (bake, rebake):
   clip a generic building's ring by a road bridge deck that crosses it below its roof, or cap it under the deck.
7. **Generic intersection, 48.890191, 2.240975 / 48.890941, 2.239014 / 48.890249, 2.240609**. All inside generic buildings
   (636957678, 68086786) drawn from the ground on the dalle, with only tunnels (273557 L−2, 317126 L−1) and an L−1 footway
   (319218, not a tunnel, at the dalle's height) under them. Read as "generic buildings where something specific stands": a
   landmark job. The L−1 footway at dalle height is suspect (OSM `level=-1` areas): it rides on top of the dalle inside a building.
8. **Foot bridges capped at a storey, viaducts without pavements, paths that go nowhere, 48.887286, 2.235754**. The cap is
   deliberate (regions.json `footBridgeLayers`, layer 1); bareViaducts takes the pavements off the Circulaire on purpose. Paths
   that go nowhere: dangling decks like La Jetée's west end (bug 2).

## Damiers d'Anjou passage: what the landmark must leave open

The solid mass is the defense2 landmark (`damiersAnjou`, OSM way/82467023, public/landmarks/paris/defense2.json:169), so no generic
cut was made. In package local x,z (paris-centre):
- **Passage de Seine** (covered=yes, w852424290; edges 960000000000480 + 277207, `passage`, width 6 m): a straight walk from the
  south face at (-5761.4, 3142.9) to the north face at (-5755.5, 3156.6), floor 7.76 → 8.3 (game). It enters at a ring vertex and
  crosses the whole slab (~15 m). Leave a void 7 m wide (6 m way + 0.5 m each side) and 4 m clear above the floor along it.
- **Voie de l'Ancre** (edge 277181, `passage`, residential, width 3.4 m) also runs under the building's west half, floor
  2.5–3.8 m, through (-5777.9, 3140.8) → (-5771.3, 3137.7), continuing to (-5765, 3135) at 1.5. Leave ~5 m wide, 4.5 m clear.
- Building ring (local): -5794.3,3118.7 … -5736.4,3147.6 (see `tmp` dump in the audit); the passage floors are relative to the
  building's ground of ~8 at the north face and ~1–2 at the south-west.

## Fixes

- Done, needs a paris-centre rebake: `chains()` named foot deck through a junction (tools/bridges.ts, tests/defense-walkways.test.ts).
- Done, rebake: `closedFootBridge` (tools/bridges.ts, used in tools/bake.ts `wayTags`): a foot bridge with `access=no|private`
  (and not `bicycle=yes`) gets `noBike`, still drawn. `CLOSED_FOOT_BRIDGES=0` turns it off.
- Done, rebake: `alignDeckEnds` (tools/bridges.ts, called after `bridgeHeights` in tools/bake.ts): foot-bridge ends meeting at a node
  inside a `footBridgeLayers` zone, within `ALIGN_MAX_STEP` 8 m, all take the highest, eased over ≤ `ALIGN_EASE` 20 m. `ALIGN_DECK_ENDS=0` off.
- Done but OFF by default: rise 0 for a foot bridge over nothing in a zone (`CAP_FLAT=1` turns it on). BD TOPO shows La Jetée 12 m
  over the garden, so the rule would have made it worse.
- Proposed: BD TOPO z for `sol=1` foot decks in La Défense instead of the layer cap; clip generic buildings by a crossing road deck (w82486000).
- Lidar MNS not fetched: BD TOPO covered every walkway in the table.

## BD TOPO decks and capped buildings (round 3)

- `tools/defense-decks.ts`: `btOffset` measures NGF → package in the zone (32.91 m for paris-centre, from at-grade roads on sol 0;
  the 31.5 used in the tables above was a rough hand reading, so those "real" values are ~1.4 m high). `btFootDecks` gives each
  foot bridge in a `footBridgeLayers` zone BD TOPO's sol-1 z, interpolated between matched vertices; an end that a way at grade
  meets is pinned (the deck eases to it), a free or deck-to-deck end takes BD TOPO, then `alignDeckEnds` runs. Vetoes: under
  `BT_DECK_MIN_OVER` 1.5 m over the ground, or more than `BT_DECK_MAX_MOVE` 15 m from the old height. `BT_FOOT_DECKS=0` turns it off.
  BD TOPO pages are cached by `fetchBdTopo`; nothing computed is stored.
- `capUnderDecks`: a generic building with ≥ 2 deck vertices in its ring is capped at the lowest deck less 1.5 m (`DECK_THICKNESS`),
  in the zone only, never a landmark claim. `CAP_UNDER_DECKS=0` turns it off. The trial caps w82486000 and 5 others (1112248133 is a
  batch7 landmark: excluded in the bake).
- Round 4 (coordinator review): a match more than `BT_DECK_AGREE` 5 m off the median of its edge's matches, or a lone match more
  than 5 m off the old height, is dropped (Place du Sud's 22.8 m). `rampFreeEnds`: a foot-deck end joined to nothing comes to the
  ground at `BT_FREE_END_GRADE` 8 %, down or up, along the deck and on through the foot ways it runs into end to end, stopping at a
  junction (never moved). `capUnderDecks` only for a deck that passes THROUGH (both ends outside) and never a building of 40 m or more
  (`CAP_MAX_HEIGHT`: Kupka A's 50 m tower and the Japan Bridge at its door).
- The dalle (`DALLE_BT=0` off): right after the datum is applied to both ground grids (tools/bake.ts), each post in the zone takes the
  median of BD TOPO's at-grade vertices within 15 m when there are ≥ 3, they agree within 2 m (a road beside the dalle vetoes) and
  they stand ≥ 3 m over it; full weight within 7.5 m. Everything downstream drapes on it. (The multi-level pass is band-only; this
  is the earliest hook, like `levelGrounds`.)
- `tools/defense-decks-check.ts` (no bake): dalle lift re-drapes 296 ways, 75 foot decks move, generic buildings capped: w82486000
  (Devedjian viaduct, real) and w637247370 (an office the Cours du Triangle L2 deck crosses at 28.7: to look at). No end is left
  joined to nothing. The ends left > 1 m off the ground and off the level of the ways meeting them (lidar ground; NEW = worse by
  > 1 m than before). These are meetings with other ways, which `meetDecks` (≤ 8 m) and `alignDeckEnds` (≤ 8 m) treat in the bake:

```
NEW 274243 Passerelle Orme (moved) at -6077,2930 (48.886824, 2.249023): deck 9.4, ground -1.9, step 11.3, 2 way(s) off its level
274293 Passerelle des Pince-Vins  at -6609,2980 (48.887271, 2.241755): deck 18.4, ground 8.6, step 9.7, 2 way(s) off its level
274295 Place du Sud  at -6599,3089 (48.888252, 2.241899): deck 19.1, ground 28.4, step -9.3, 2 way(s) off its level
274873   at -6726,2939 (48.886898, 2.240155): deck 24.0, ground 18.6, step 5.4, 2 way(s) off its level
NEW 275097 Promenade de la Rose de Cherbourg (moved) at -6997,3208 (48.889319, 2.236461): deck 37.6, ground 29.6, step 8.0, 1 way(s) off its level
314567 Passage Valmy (moved) at -7405,3555 (48.892434, 2.230894): deck 31.6, ground 34.9, step -3.3, 2 way(s) off its level
318093 Cours du Triangle  at -6969,3788 (48.894529, 2.236846): deck 30.1, ground 32.5, step -2.4, 2 way(s) off its level
318332 Passerelle des Reflets (moved) at -6238,3416 (48.891186, 2.246830): deck 17.9, ground 10.4, step 7.5, 1 way(s) off its level
318650   at -6786,3760 (48.894278, 2.239336): deck 24.7, ground 29.1, step -4.4, 3 way(s) off its level
320028   at -6094,3340 (48.890503, 2.248791): deck 14.9, ground 1.8, step 13.1, 1 way(s) off its level
320028   at -6080,3331 (48.890422, 2.248982): deck 14.9, ground 0.8, step 14.1, 1 way(s) off its level
320559 Passerelle Louis Blanc  at -5917,3365 (48.890726, 2.251203): deck 3.4, ground -2.1, step 5.4, 1 way(s) off its level
321017   at -5913,3364 (48.890716, 2.251258): deck 3.4, ground -2.1, step 5.5, 1 way(s) off its level
```

## Round 5: stairs at deck ends

`stairsAtDeckEnds` (tools/defense-decks.ts, after `alignDeckEnds` in tools/bake.ts; `STAIRS_AT_DECKS=0` off): where a foot deck's end
meets a foot way (or a lower deck) more than `STAIR_MIN` 4 m off it, an OSM `steps` way at the node or within `STAIR_SEARCH` 40 m
along the paths is re-sloped to the deck (the paths between lifted as its landing); else the meeting way becomes a flight if
≤ `STAIR_FLIGHT_MAX` 60 m, else a ramp at 8 %. A foot deck's end that a road deck meets is pinned (Rose de Cherbourg). Check: 16 ways
made or re-sloped as flights. Left:

- 274293 Passerelle des Pince-Vins at 48.887271, 2.241755: the deck (18.4) lands on a residential street at 9.8. OSM joins a
  footbridge to a road 8.6 m below; it needs a look at photos (stairs mapped elsewhere, or a wrong join).
- 318332 Passerelle des Reflets at 48.891186, 2.246830: 1.6 m to the Terrasse des Reflets ramp; `meetDecks` closes it in the bake.
