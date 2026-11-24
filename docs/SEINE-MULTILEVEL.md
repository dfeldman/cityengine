# Seine bridgeheads and underpasses: what goes wrong, and a different representation

2026-11-15. Investigation of the owner's six spots plus four more bridges, on the baked **paris-centre** (BDTOPO_BAND=1 rebake of
2026-11-11). No rebake was needed: the audits below read the shipped package directly. No screenshots were taken. Every finding
here comes from heights in the package compared with the lidar and BD TOPO, plus the owner's two shots.

## Verdict, short

1. **BD TOPO is not at a different datum.** Its ground-level road heights agree with the lidar MNT to ±0.25 m (median) everywhere
   measured, the 16e inland included. The bad vertices are a **long tail** tied to how IGN measured them, and to roads under a
   cover. That is fixable by trusting each vertex according to its source. No shift will fix it (§3).
2. The faults fall into **seven classes** (§2). Each has a mechanical cause, and several have a one-file tactical fix.
3. The real cause is the **representation** (§4). The ground has a single height per (x, z). A way is a polyline with heights and a
   bag of flags (bridge, tunnel, bore, lid, cut, trench, ramp, layer). Each multi-level case is then patched by its own
   inference pass. By the last count, about 15 passes write heights in the band. The band added a second height authority on top,
   with an eased seam. Most faults sit at the hand-off between two passes, or between a way's height and a ground that cannot be
   at two levels.
4. **Recommendation:** do the tactical fixes on a mini city now (§5). Then move to a **structure-generating** model (§6):
   - the ground is only open ground;
   - every way is drawn at its own solved profile;
   - decks, retaining walls, trench walls and covers are generated wherever a way leaves the ground.

   With that, each bridgehead is no longer custom work.

## 1. What was examined

Tools, written for this pass:
- `tools/site-audit.ts`: per-site anomaly tally. It needs no rebake (about 10 s for 10 sites).
- `tools/bt-vs-mnt.ts`: BD TOPO z against the lidar MNT, by acquisition method.
- `tools/spot-probe.ts` (existing).

| Site | Spot | Ways (bridge/tunnel) | Headline numbers (R = 45–60 m) |
|---|---|---|---|
| Pont de Grenelle, right bank | 48.850168, 2.277801 | 50 (0/1) | 4 flights of steps **1.9–2.9 m over the ground**, 2.6–3.4 m over the MNT; a tunnel footway floating 2.9 m at 19 %; Voie Georges-Pompidou 3.1 m **under** the MNT |
| Île aux Cygnes tip | 48.855797, 2.285938 | 40 | 613 of 1257 ground posts 2.0–2.4 m under the MNT, none beyond (a constant, see C7); the grass-in-the-river itself not reproduced without a shot |
| Pont de Bir-Hakeim, right bank | 48.856813, 2.286413 | 87 (12/0) | **11 ways flagged `ramp`**: Av. du Président Kennedy (primary), 7 footways/steps, a Belmondo cycleway, 2 Pont de Bir Hakeim pieces; 16 ways > 2.5 m off the MNT; 6 junction steps; metro viaduct rails dive (C1) |
| Pont d'Iéna, right bank | 48.860309, 2.291387 | 70 (13/1) | **15 `ramp` ways**; 10 junction steps (L1 deck 4.1 m against L0 2.3–3.0 m); steps 7.0 m over the ground; footway 194581 buried 1.9 m at 26 %; ground up to 8 m under the MNT beside Av. de New York's trench |
| Pont de l'Alma, right bank | 48.864230, 2.301465 | 117 (32/0) | 148 under-deck and 28 trench-corridor ground samples > 2.5 m under the MNT (worst −8.8) |
| Concorde, Voie Georges-Pompidou underpass | 48.863978, 2.319740 | 69 (3/4) | 10 `ramp` ways; 8 junction steps; 280 under-deck plus 175 "open" ground samples > 2.5 m under the MNT (worst −9.5). Many of these may be correct (C6 caveat) |
| Pont Alexandre III, right bank | 48.8637, 2.3135 | 6 | 88 under-deck, 41 open ground samples > 2.5 m under the MNT |
| Pont Neuf, right bank | 0 → 0 | 2 → 1 | 0 → 0 | 7 → 0 | 0 → 1 |
| Pont de Sully, left bank | 48.8507, 2.3590 | 56 | Clean: 0 ground posts off by 2 m, 2 junction steps. The control |
| Pont Mirabeau, left bank | 48.8462, 2.2768 | 127 (8/0) | 10 floating ways, 9 off the MNT by > 2.5 m |

## 2. Failure classes

**C1. Rails pulled off their structure.** At Bir-Hakeim, the line 6 viaduct's track (rail 371959822, `subway br1 L2`) runs
**15.3 → 1.5 → 2.3 → 2.9 → 2.9 → 11.4 m** near the bank. It drops 14 m to road-deck level and climbs back. Mid-span, two nodes
sit at **4.9 m** between 7.6 m neighbours, on both tracks. This is the owner's "the train dips to the bridge level". It is in the
**baked rail heights**, not the renderer. Likely causes:
- `conformDeckRails` sets tracks inside a bridge outline to the road deck beside them. It was meant for Pont National's tram on
  its road deck.
- `bdTopoRails` matching to the lower deck's troncon.

The two-deck Bir-Hakeim (metro above, road below) is exactly the case those passes assume cannot happen.

**C2. Stray `ramp: true`.** `ramp` means "the bake lifted this way onto a bridge deck", and in Paris it **draws a bridge-width
deck** (PARIS-BRIDGEHEAD.md pitfall #1). Flagged ways in the audit:
- Bir-Hakeim: 11, among them Avenue du Président Kennedy (a primary street at grade) and steps.
- Iéna: 15, among them Place de Varsovie and Pont d'Iéna service pieces.
- Concorde: 10. Pont Neuf: 7.

These are the owner's "gray extra plane in the bridge" and the steep drops: a deck drawn along a way that also drapes. The
bridges pass (`tools/bridges.ts`) lifts too far from the deck end.

**C3. Floating stairs and paths.** These are the "random stairs" at Grenelle: four steps ways float 1.9–2.9 m over the shipped
ground and 2.6–3.4 m over the lidar. Their upper ends are right, but the ground under them was lowered, along with the lower quai
road they meet (Voie Georges-Pompidou is 3.1 m *under* the lidar). Steps and footways are "unmatched" in the band. Each one only
meets its junction heights and keeps a straight line between them, while the ground under it moves. Iéna has steps 7.0 m over
the ground.

**C4. Junction steps where a deck piece meets a street.** These are the owner's "routes drop and rise through the ground". Where
an `L1 bridge` piece shares a node with an `L0` way, the two ends disagree by 0.6–1.8 m. At Iéna, Place de Varsovie on the deck
is at 4.1 m and the same street off it at 2.8–3.0 m. A footway (194581) at 0.8 m meets 3.2 m neighbours on both ends: it was
pulled down to a lower level and climbs 26 % out of it. The renderer bridges the gap as a slope through the ground. The
band's `DZ_BAND_FREE_DECKS false` eases deck ends towards BD TOPO junctions, and the bridges pass, meetDecks and the zones'
routes each move one side of the same node.

**C5. Holes: ground sunk under decks and along trenches.**
- Under decks: Alma has 148 samples 2.5–8.8 m under the MNT, Iéna 90, Alexandre III 88, Concorde 280.
- In trench corridors: Alma 28, Iéna 15, Concorde 21.

Causes:
- The lid carve digs a pit (round 8: "the carve's 8 m pit"), and `LID_RECUT` lowers ground to the road inside each lid road's
  corridor.
- Under a deck nothing holds the ground up, because "posts under the riverbed line are left alone" and the bridge-structure
  pass expects open arches.
- Where the trench walls or the occluder don't cover it, the pit is seen as a hole. The owner's first shot at Iéna shows exactly
  this: dark pits beside the bridgehead, deck pieces with no ground under them.

Caveat: the lidar MNT under a deck is IGN's interpolation (bare earth with the structure removed), so part of this count is
legitimate lower ground.

**C6. Ground rising to meet a sunk road.** This is the second shot, the underpass mouth: grass ramps up beside and over the road
and looks translucent. A road below the ground is drawn only where a `cut` covers it (`Terrain.heightAt = cut ?? max(raw, grade)`).
Wherever the cut, the lid's trench walls and the ground disagree about the corridor's edge, the ground pokes through. The fixes so
far (WT_OCCLUDE, depth copies, WALLS_FIRST) are draw-order patches for that.
- **Caveat on counts:** at Concorde, the MNT over the covered Voie Georges-Pompidou is the cover's surface. Some of the 175 "open"
  low samples may be right. MNS − MNT should decide before they are counted as bugs.

**C7. A systematic ~2 m lowering in the western stretch.** At Cygnes, 49 % of ground posts within 60 m sit 2.0–2.4 m under
the MNT, none beyond that and none above it. Grenelle has 16 % the same way, and Sully none. A flat offset over a whole island is a
constant in a pass, not geometry. BD TOPO's own sol-0 z there is fine (median +0.5 m vs MNT), so the bake makes it. Candidates:
- the band's per-polygon river level: `BAND_LEVEL_Q` / `BAND_LEVEL_TRUST` can take a draped ring's z, and below the Suresnes pool
  the level changes;
- the band's `groundAt` / `mntAt` blend (`DZ_MNT_CAP` only caps from above).

This is also the likeliest cause of "grass in the middle of the river": the island and its fade ground interleave with the
clamped river sheet. **First thing the mini must verify.**

## 3. The datum question: BD TOPO against the lidar

`tools/bt-vs-mnt.ts` compares every sol-0 `troncon_de_route` vertex with z against the IGN MNT at the same point. Seven 900 × 900 m
boxes:

| Box | "BDTopo" method p50 / share off > 1.5 m | "Photogrammétrie" | "Z corrigé" |
|---|---|---|---|
| Grenelle | +0.12 / 2 % | −0.12 / **35 %** | +0.04 / **33 %** |
| Bir-Hakeim | +0.22 / 5 % | +0.07 / 24 % | +0.24 / 8 % |
| Iéna | +0.15 / 8 % | −0.42 / 15 % | +0.07 / 6 % |
| Alma | +0.02 / 1 % | −0.12 / 4 % | +0.19 / 2 % |
| Concorde | −0.25 / 14 % | −0.78 / 28 % | **−1.24 / 39 %** |
| Sully | +0.06 / 3 % | **−1.48 / 51 %** | −0.17 / 4 % |
| 16e inland (control) | −0.11 / 4 % | −0.54 / 2 % | −0.05 / 3 % |

- **No global offset.** The NGF/IGN69 datum is shared: the lidar MNT and BD TOPO are both IGN products.
- **The tail is per method.** Photogrammetric and corrected-z vertices near the river are wrong 15–51 % of the time. The
  "BDTopo" method, apparently interpolated from IGN's own terrain model, is wrong 1–14 %.
- **The tail is mostly BD TOPO *below* the lidar** (65–95 % of outliers). It is **not** a horizontal shift: only 2–11 % of outliers
  have the MNT reach the BD TOPO z within 3 m, and 17–30 % within 6 m. It is not mostly near bridges either: 10–28 of 106–244
  outliers are within 20 m of a bridge or tunnel troncon. Two kinds explain it:
  - (a) roads marked sol 0 that run **under a cover** (Concorde, under the lidar's slab), where BD TOPO is right and the MNT is
    the cover;
  - (b) photogrammetric z interpolated in a straight line along a lower-quai ramp, where the MNT is right.
- **What to do instead of a datum shift.** Give each vertex a trust weight from `methode_d_acquisition_altimetrique`. Run a
  **covered test**: where the MNS (or the MNT) stands more than about 2 m over a BD TOPO z and an OSM bridge, tunnel or cover is
  there, BD TOPO wins and the place is marked covered. Elsewhere, the lidar wins over a photogrammetric vertex that disagrees by more
  than 1.5 m. Below 1.5 m, keep BD TOPO, since it is the road crown, not the bare earth.

So **BD TOPO was not a bad idea as data.** On the 3D road network it is the best source there is, and the only one that sees
under covers. What went wrong is how it entered: as a third height authority (after OSM inference and lidar) over a
single-valued ground. It reached the band through a distance-field band with an eased seam (`BT_EASE`), and ways it didn't match
fell back to a "sight blend". Many C3/C4 faults sit on that matched/unmatched seam.

## 4. Why the representation keeps failing

Today:
- **Ground:** one heightfield (`Terrain.rawHeightAt`). At runtime a chain of modifiers adjusts it: walls (read on your side),
  river (clamped under the sheet), shore, grass (kept under streets), grade (`max(raw, grade)`: streets lift the ground) and cut
  (a street in a cut wins).
- **Ways:** OSM polylines with per-vertex heights and flags. Flags are booleans for cases someone needed: `bridge`, `tunnel`,
  `bore`, `lid`, `cut`, `trench`, `trenchTo`, `ramp`, `layer`, `passage`, `authored`.
- **Heights** come from a pipeline. Each pass is right on its own case and writes over the last one: lidar drape, plates,
  deck clearance, the lower-quay shelf, sinkRoadMouths, lidTunnels, overLids, meetDecks ×3, survey pins, level plans, deck zones
  (levels, routes, ramps), the road bed (DZ_BED, DZ_BED_DOWN), LID_RECUT, conformDeckRails and bdTopoRails, and the band with its
  `bandAt` gates.
- **Rendering** drapes most things on the ground and draws a structure only where a flag says so. The draw order then has to hide
  the ground the flags didn't account for: occluders, depth copies, WALLS_FIRST, WT_OCCLUDE, dropDryWater, RIVER_CLAMP.

The structural problems:
1. **The ground cannot be in two places.** Under a bridge it is either the lower quai or the approach embankment, never both.
   Over an underpass mouth it is either the street on top or the road below. Every pass that changes it for one way breaks it for
   another (C5, C6, C7).
2. **Way heights are written by many passes with no shared constraints.** Junction continuity, grade limits and clearance
   under a crossing are each checked by whichever pass last cared. So a deck end and the street it joins disagree (C4), and a
   footway is left floating when the ground moves (C3).
3. **Structures are inferred from flags, not from geometry.** `ramp` draws a deck wherever it is set, right or wrong (C2). A
   track on a bridge is assumed to sit on the road deck (C1). A sunk road is shown only where `cut` is set (C6).
4. **The band layered a new authority without retiring the old ones.** It gates some passes off with `bandAt` but keeps others,
   eases at a seam, and still sits under the hand zones. The pass count went up, not down.

## 5. Tactical fixes (days, on a mini)

> **2026-11-15:** §§5–8 were the plan. What was actually built is the multi-level pass, §9; most of T1–T7 are among its rules.

Each fix is small, tunable, and judged by `site-audit` numbers before and after.

| # | Fix | Where | Expected effect |
|---|---|---|---|
| T1 | Never conform a `subway`/`rail` track at `layer ≥ 2` (or above the road deck by more than 3 m) to a road deck; never pull a deck track node below its neighbours' straight line by more than 0.5 m | `conformDeckRails`, `bdTopoRails` (tools/deck-zones.ts) | Bir-Hakeim metro stays elevated (C1) |
| T2 | Set `ramp` only on a way that continues a bridge deck end-to-end, at a height over the ground the deck rule needs; never on steps, footways, or a primary street at grade; log every flag set in the band | tools/bridges.ts (ramp lift) | Removes 7–15 false decks per bridgehead: the gray planes (C2) |
| T3 | Unmatched steps/footways in the band take the ground under them in between, as well as their junctions, and are flagged when they float > 1 m | band routes (deck-zones.ts) | Grenelle, Iéna stairs (C3) |
| T4 | One pass owns every deck-end node: after the last height writer, snap shared nodes to one height and grade the shorter side, capped at 8 % | new final pass in bake.ts | Junction steps (C4) |
| T5 | Find the 2 m constant at Cygnes/Grenelle: dump the band's per-ring river level and the `groundAt` blend on one post | seine-band.ts, deck-zones.ts | C7, grass in river |
| T6 | BD TOPO trust by method, plus the covered test (§3) | bdtopo-zones.ts `btMatchEdge` users | Lower-quai roads 3–6 m under the lidar (Voie Georges-Pompidou), C3 |
| T7 | Under a deck, the ground never goes below the lower of (the MNT, the lower quai) inside the deck outline; the lid carve never digs beyond the trench walls' footprint | deck-zones groundAt, tunnels.ts carve | Holes (C5) |

These will fix most of what the owner listed, but each one is another patch on the model in §4.

## 6. The proposed representation: open ground, solved profiles, generated structures

Goal: tunnels, overpasses, underpasses, bridges and quays come out of one general rule set, not out of per-case passes or
per-bridgehead hand zones.

**6.1 Ground is only open ground.**
- The heightfield is the bare-earth surface where nothing is built over it: the lidar MNT, smoothed. Roads never lift it
  (no `max(raw, grade)`).
- The **ground has holes**: a mask of footprints where it isn't drawn at all, such as trench floors, underpass corridors and
  the water. A hole replaces lowering the ground into a pit and hiding the pit by draw order.
- Under a deck the ground stays where the lidar has it, and a lower road there is simply a way at that level.

**6.2 Every way has one solved 3D profile.** One least-squares solve per zone, or per connected network in the band, replaces
the ~15 writers. The tables below give the inputs.

Observations (weighted):

| Source | Applies to | Weight |
|---|---|---|
| BD TOPO z | road vertices | by method and the covered test |
| lidar MNT | at-grade vertices | |
| MNS | deck tops | |
| survey pins, hand levels | where given | high-weight observations, not overrides |

Hard constraints:
- shared nodes have one height;
- a deck stays flat along its length within ±0.3 m;
- a crossing of two ways with no shared node keeps at least 4.5 m of clearance (the upper way minus the lower), or 3 m for a
  footbridge.

Soft constraints:
- grade under 8 % (6 % on foot, stairs exempt);
- smoothness (second difference).

Rails are in the same solve, and a track on a bridge observes its own deck, not the road's (C1 goes away).

**6.3 Each segment is classified by its height over the open ground.**

| Relation (way − ground) | Class | What gets generated |
|---|---|---|
| \|d\| < 0.5 m | at grade | the ground is conformed to the way **inside its corridor only** (as the road bed does today) |
| 0.5 m to 3 m | embankment | a retaining-wall skirt each side down to the ground, or a slope where there's room |
| > 3 m, or OSM/BD TOPO bridge | deck | a deck slab, parapets, piers at the arch rule, and the ground under it left alone |
| −0.5 m to −3 m | cutting | the ground is cut (hole) along the corridor; trench walls up to the ground |
| < −3 m, or tunnel / sol −1 / covered | covered | hole plus trench walls at the mouths; a **cover** slab (lid) wherever another way or the open ground passes over it |

`bridge`, `ramp`, `cut`, `trench` and `lid` stop being inputs. They become outputs of this table. OSM `bridge`/`tunnel`/`layer`
and BD TOPO `sol` feed the solve (as clearance hints and the covered test) and do not decide drawing.

**6.4 Covers are explicit.**
- A cover is a polygon with a height: a bridge outline, a lid slab, or the street over an underpass.
- Sources: OSM `man_made=bridge` outlines, BD TOPO sol ±1 troncons buffered by their width, and MNS − MNT where it shows a
  structure.
- The renderer draws covers like decks. Under a cover, nothing drapes on the ground.

**6.5 What this retires.**
- Bake: plates, deck clearance, the shelf, sinkRoadMouths, overLids, meetDecks, the band's ease and sight blend, the deck zones'
  levels (a hand zone becomes pins plus a few "this connects to that" facts), and conformDeckRails.
- Renderer: `grade` lifting the ground, `cut` as a special case, and most depth-order patches. The holes mask and the generated
  walls do their job.
- Quay walls stay. A quay is an embankment edge along the water: the same skirt rule, with the water as the low side.

**6.6 Cost and risk.**
- The renderer's road draping changes everywhere. San Francisco too, though its hills are almost all "at grade", so it should be
  invisible there.
- A solver of about 10⁵ unknowns for paris-centre is sparse and fast (a conjugate-gradient iteration; seconds).
- Classification thresholds are tunable constants.
- The largest risk is junction topology from OSM: a grade-separated crossing wrongly sharing a node. The solve reports every
  violated clearance or grade, so these become a fix list, not silent geometry.
- Expect two to three weeks for a mini-city prototype behind a flag, before any city-wide switch.

**Recommended path.**
1. T1, T2, T5 and T6 now on the mini, so the owner gets visible improvement.
2. In parallel, prototype 6.1–6.3 on the same mini behind `LEVELS=solve`, rendering only the generated skirts and decks.
3. Compare with `site-audit` and shots.
4. Keep the old passes until the solve wins on both minis.

## 7. The test city

Don't bake paris-centre for any of this (45 min).
- **New `bir-hakeim-mini`:** centre 48.8585, 2.2890, radius 450, `datum: 32.94`, `test: true`. It covers Bir-Hakeim's right bank,
  the tip of the Île aux Cygnes and Pont d'Iéna's right bank: owner spots 2, 3 and 4, plus classes C1–C5 and C7.
- Bake it twice, with `BDTOPO_BAND=1` and with `=0` as the control: about a minute each.
- **Reuse `concorde-mini`** (48.8648, 2.3202, r300) for the Concorde underpass and C6.
- Grenelle (spot 1) and Alma (spot 5) are 1.3 km and 1.2 km away. They need their own 300 m minis if T3 or C5 need checking there.

Judge with:
- `npx tsx tools/site-audit.ts <mini> name:lat,lon …` (`V=1` lists each way; `R=` radius);
- tinyres shots to aim, then lowres shots at the six spots, rider's eye and `view=high`.

## 8. Questions for the owner

1. Is the structure-generating model (§6) the direction you want, or should the tactical list (§5) come first and be judged?
2. Bir-Hakeim: should the road deck under the metro be ridden at its real height, about 5 m under the viaduct?
3. Hand zones (Pont National): should they become "pins plus connections" under the solver, or stay as overrides until the solver
   wins?

## 9. Built: the multi-level pass (2026-11-15)

`tools/multilevel.ts`, called from `tools/bake.ts` after every other height and ground writer in the band (the road bed, lid recut, the
rail passes), before the walls are cut and the package written. It runs only with `BDTOPO_BAND=1`; `MULTILEVEL=0` turns it off.
It takes about 3 s on a mini. Nothing is persisted. It replaces none of the earlier passes yet: it overwrites their result inside
the band.

What it does, in order (every constant is at the top of the file, most can be set from the environment):

1. **Densify.** At-grade ways in the band are split every `ML_DENSIFY` (5 m), so a long segment follows the ground between its ends.
2. **Deck share.** Bridge ways on one structure take its highest deck within `ML_DECK_SHARE` (10 m) and `ML_DECK_DH` (2.2 m).
   This lifts sidewalks mapped 1 m under their roadway, which hung inside the Pont de la Concorde's arch.
3. **One height solve** for every way in the band. It is a sparse least-squares problem solved with conjugate gradients:
   - **One unknown per shared position**, but only if the ways' incoming heights are within `ML_SEP`. OSM shares a node between
     the Pont d'Iéna's service deck and the lower-quai road 8 m under it; merging them humped the road 5.7 m.
   - **A membrane along each way**, with length scale `ML_SMOOTH` (9 m). Stairs bend freely.
   - **What pulls each vertex:**
     - **Decks, car tunnels and lids** are held (`ML_W_HOLD`). The hold eases off within `ML_DECK_END` (25 m) of an end that
       meets a street.
     - **Trench roads** are held more loosely (`ML_W_CUT`).
     - **Under a bridge outline or a deck** the lidar is blind, so the vertex gets only a weak prior and its level comes from
       either side.
     - **Everywhere else** the vertex is pulled to the **1 m lidar MNT** if it is within `ML_TRUST` (2.5 m). Further off, the
       way is under a cover and keeps its height (BD TOPO's). A foot tunnel is always pulled to the lidar, so the Grenelle
       stairs no longer climb 3 m into the air.
   - **A grade limit:** links steeper than `ML_GRADE_MAX` (11 %) are stiffened and the solve is re-run,
     up to 5 times.
4. **Grade separation.** A way crossing over another by `ML_SEP` (3 m) or more becomes a deck over the lower way's corridor plus
   `ML_SEP_PAD` (3 m): it is cut out into its own `bridge` piece, laid straight. This is the general form of the old "overpasses
   OSM does not call bridges", run after the heights are final and for foot ways too.
5. **One ground**, on a 1 m sparse grid over the band:
   - **At-grade corridors** are laid exactly at their way, easing to the lidar over `ML_SKIRT` (4 m).
   - **Elsewhere**, the lidar MNT.
   - **Under a structure**, the nearest at-grade way's level within `ML_UNDER_REACH` (25 m), so a lower quai runs flat under
     its arch. Failing that, a Laplace fill.
   - **Inside the river's outline** the ground is the **bed**, `ML_RIVER_BED` (1.5 m) under the river's own level, unless the
     lidar sees land at least `ML_RIVER_LAND` (0.8 m) over the water, or a way is within `ML_RIVER_CORR` (2.5 m) under a
     bridge. The river is judged by its outline, never by a height line: the band's line (water + 1.5 m) had sunk the Cygnes
     lower quai to the water.
6. **Elevated tracks:**
   - a node more than 1 m under both its neighbours, or over both, goes to the line between them (neighbours on opposite sides
     only, through shared ends);
   - parallel elevated tracks within 6 m of each other take their mean height;
   - inside the band, no dip steeper than 4 % (lift only).

   `conformDeckRails` now snaps a track node to a road deck only within `DZ_RAIL_SNAP_DH` (2.5 m) of its own height. The
   Bir-Hakeim métro no longer comes down to the road deck.
7. **Added after the first test round:**
   - every stairway in the band is laid straight from end to end;
   - a raised stretch carries on through vertices the lidar cannot see;
   - a whole way that stands raised is a deck however short;
   - a way the lidar sees nowhere, with both ends on decks, is deck too;
   - where a higher-layer way crosses a lower one with no shared node, the lower way gets no lidar pull within `ML_UNDER_CROSS`
     (8 m) past the upper way's half-width, because the lidar sees the upper one there. The rule had no measurable effect on the
     test cities, so it guards a case none of them has;
   - a way off the surface (`onSurface` false: tunnels, layer −2 passages) no longer shapes the ground;
   - **a stretch inside a lower way's corridor** by `ML_SEP` or more is deck, crossing or not. At the Pont Neuf's right-bank end
     (owner, 48.858327, 2.342420) footways ran on from the deck 7 m over the lower-quai road without crossing its centre line.
     Their corridors and the road's fought over one ground, and the renderer drew the road jumping up to them, with holes around
     it. Garigliano's layer −2
     passage had carved the ground to 3.5 m under a 7.9 m walkway.
   - **trench floors run 1.5 m past the kerb** (`ML_TRENCH_PAD`), with no skirt, so the step to the street stands behind the trench
     wall's face. Inside the Iéna tunnel (owner's shot) a diagonal corridor edge on the 1 m grid stood as a row of spikes;
   - **boats:** ground inside an OSM boat's outline (`building=boat|houseboat|ship`, padded `ML_BOAT_PAD`) is riverbed, and the boat
     model draws on top;
   - **land inside the river's outline must reach the shore**, by a 4-neighbour chain that does not cross a BD TOPO wall line
     (`ML_RIVER_WALL_GAP`). Otherwise it is riverbed. The lidar takes some moored barges' decks for ground, 1–2 m over the water,
     and they stood as grass in the Seine.
8. **Outside the pass, same day:**
   - **river holes** (bake.ts): a hole in a river outline that the lidar reads as water is dropped. It found none on the test
     cities; the barges there are not holes;
   - **no wall across a road** (bake.ts): a quay-wall piece a drawn way crosses at more than 25° is an opening and is removed (owner
     at 48.862035, 2.293575, Port Debilly's ramps "through retaining walls"). 7–8 pieces per test city;
   - **the distant ground under the river** (render/city.ts `distantGround`): the coarse 20 m mesh drawn under every tile had no
     river clamp, and a cell spanning a bank stood through the water as a straight-edged green patch. A post in the river takes
     the river's clamp, and a post beside one goes down to it too;
   - **the ride overlay** (render/pathmap.ts): junction discs take the junction's own height and spokes their edge's profile, not
     the drawn ground. In a trench they stood up at street level (owner: "the tunnel routes go up and down to street level").
9. **Flags from geometry:** `ramp` (which draws a bridge-width deck in Paris) comes off every way standing less than
   `ML_RAMP_ABOVE` (1.5 m) over the lidar.

Tools added: `tools/level-map.ts` (a top-down PNG: ground minus lidar, ways coloured at grade / raised / buried / deck / tunnel,
`ramp` outlined), `tools/site-audit.ts`, `tools/bt-vs-mnt.ts`, `tools/at-point.ts` (what the package puts near a point, no browser).
Test cities: `bir-hakeim-mini`, `grenelle-mini`, and `datum: 32.94` added to `alma-mini` and `concorde-mini`.

### Results on the test cities

Every test city was baked twice with `BDTOPO_BAND=1`: once with `MULTILEVEL=0`, once with the pass. Both bakes are audited with
`tools/site-audit.ts` (R = 60 m), counting only ways the game draws: tunnels and layer −2 passages are never seen. Each cell is
without → with the pass.

| Site | Junction steps | Floating | Buried | `ramp` decks | Steep (> 12 %) |
|---|---|---|---|---|---|
| Grenelle (owner) | 0 → 0 | 2 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| Île aux Cygnes, spot 2 (owner) | 1 → 0 | 1 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| Bir-Hakeim (owner) | 6 → 0 | 6 → 0 | 0 → 0 | 12 → 6 | 4 → 0 |
| Iéna (owner) | 12 → 0 | 6 → 0 | 1 → 0 | 14 → 2 | 3 → 1 |
| Alma (owner) | 3 → 0 | 1 → 0 | 0 → 0 | 0 → 0 | 1 → 0 |
| Concorde underpass (owner) | 8 → 0 | 1 → 0 | 1 → 0 | 10 → 0 | 1 → 1 |
| Pont de Sully, left bank | 2 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Pont de la Tournelle, left bank | 5 → 0 | 1 → 0 | 0 → 0 | 0 → 0 | 2 → 0 |
| Pont du Garigliano, right bank | 13 → 2 | 8 → 0 | 0 → 0 | 3 → 2 | 8 → 2 |
| Pont National, left bank | 1 → 0 | 5 → 4 | 2 → 1 | 7 → 1 | 8 → 9 |
| Passerelle Simone de Beauvoir, right bank | 7 → 0 | 11 → 0 | 1 → 0 | 4 → 0 | 5 → 4 |
| Pont Neuf, right bank | 0 → 0 | 2 → 1 | 0 → 0 | 7 → 0 | 0 → 1 |
| **Total** | **58 → 2** | **44 → 5** | **5 → 1** | **59 → 11** | **32 → 18** |

What is left:
- **Pont National:**
  - the four "floating" footways are sidewalks on the raised Bd Jean Simon's embankment, beside a retaining wall; the audit reads
    the ground on the wall's low side, and the way draws on top;
  - the buried way and most of the steep pieces are the Allée Paris-Ivry junction across a wall (below).
- **Shots:** the six owner spots were checked in headless shots at medres, among them Bir-Hakeim from above, Iéna from above,
  under the Concorde arch, the Alma tunnel mouth from the lower quai, and the Grenelle stairs.
- **The steep limit:** `ML_GRADE_MAX` is 11 %. At 8 % real ramps down to the ports floated; at 14 % the 12–14 % footway ramps
  stayed. Since the compounding fix (below) a steep link is stiffened at most 9× its own weight, so a few 12 % pieces come back.

Route check (`tools/bridge-scoreboard.ts`, band bake without → with the pass): legs passing are unchanged, 9/10 on
pont-national-mini and 9/14 on bir-hakeim-mini. The audit totals fell from 40 to 36 and from 141 to 125; level steps fell from 10 to
4 and from 15 to 3. The split pieces, the covered pieces and the new decks broke no route.

**At scale: `seine-centre-mini`** (radius 1.3 km, Pont Royal to Pont de Sully, fifteen bridges and both islands). The scoreboard
over all fifteen, band bake without → with the pass: legs **84/97 → 86/97**, audit total **606 → 473**:

| Audit | Without | With |
|---|---|---|
| level steps | 117 | 17 |
| deck ends | 4 | 2 |
| off the ground | 232 | 215 |
| grade | 78 | 41 |
| wall gaps | 161 | 193 |
| rail on a bridge | 2 | 0 |
| zigzags | 11 | 2 |

Pont de Sully gains two legs (4 → 6); every other bridge passes exactly the legs it passed before. The
pass took 7.9 s there; the whole bake was 79 s.

Three bugs this scale test found, now fixed:
- **The grade stiffening compounded.** Each re-solve multiplied a steep link by up to 9 again, so a ramp into the Voie
  Georges-Pompidou tunnel turned rigid and dragged the Pont au Change's Châtelet end down 2.6 m (legs 6/7 → 2/7). Each pass now
  works from the link's own weight.
- **A deck end was pulled to the lidar under it.** IGN's MNT is the bare earth beneath a deck. A deck end now only loosens its
  hold, to `ML_DECK_END_MIN` (20 %), and meets the street by smoothness.
- **The lidar pull is asymmetric now.** A way under the lidar is pulled up within `ML_TRUST` (2.5 m); a way over it is pulled
  down only within `ML_TRUST_UP` (1.0 m), because a low reading may be ground seen under a structure.

`wallGap` rose 161 → 187 (after the wall-line fixes below; 193 before them) and is the one audit that got worse. It counts ground posts beside a quay wall that don't step cleanly.
Two fixes took it from 193 to 187:
- the lidar is read 2.6 m clear of each BD TOPO wall line, on the cell's own side, so the ground steps at the line (`ML_WALL_SNAP`,
  `ML_WALL_READ`);
- no corridor skirt runs across a wall line.

The rest are probably low walls where the lidar shows less than the 0.8 m step a wall run needs. A missing wall shows as a slope,
not a hole.

A covered piece cut out of a way that was ridden gets `bore` as well as `tunnel`. `tunnel` alone takes a way off the surface and out
of the ride graph (`onSurface` in package.ts); a `bore` stays ridden and is drawn as a tunnel.

### Open items

- **paris-centre rebake (2026-11-15, owner's go-ahead).** Baked cities are git-ignored (`public/cities/`), so the 2026-11-11
  build was copied first, as clones beside the project:
  - the served build to `~/cityengine-bake-backups/paris-centre-20261111`;
  - the bake-private package (`tools/cache/bake/paris-centre`) to `~/cityengine-bake-backups/paris-centre-20261111-work`.

  First paris-centre bake with the pass: 54 min in all, the pass 225 s (146 k unknowns, 6955 ground tiles; 376 decks and 85
  covered pieces cut from geometry, `ramp` off 560 ways). The twelve sites audited in it match the minis. The Concorde underpass
  shot in paris-centre matches the mini's. It was rebaked again after the Pont Neuf corridor rule.

  Final paris-centre bake of 2026-11-15, with everything above: 34 min, the pass 225 s. 228 boats laid as riverbed, 187 wall pieces
  opened for roads, 2336 samples of decks over lower corridors. The regression before it, without → with: legs on the 15-bridge
  city 84/97 → 86/97, audit 606 → 459; pont-national-mini 40 → 35, bir-hakeim-mini 141 → 118. Not uploaded to R2.

  `public/landmarks/paris.where.json` (Search positions) is regenerated after a paris-centre bake with
  `node --experimental-strip-types tools/landmark-where.ts paris-centre`.

  To restore: copy both back over `public/cities/paris-centre` and `tools/cache/bake/paris-centre`. To rebuild instead, run the
  same bake with `MULTILEVEL=0` (the code of that build is commit 6172331c plus the band).
- **Mini bakes overwrite `public/landmarks/paris.where.json`** with only the mini's landmarks. This hazard predates this work. Run
  `git checkout public/landmarks/paris.where.json` after a mini bake; a paris-centre bake rewrites it whole.
- **Fixed later the same day (renderer):** the Pont d'Iéna's sawtooth parapet. `render/bridge-structures.ts` now smooths the
  structure's per-metre deck profile with a running median over ±`DECK_MEDIAN` (3) bins, then a mean over ±`DECK_MEAN` (2).
- **A few junctions cross a real wall in the lidar.** The Allée Paris-Ivry runs on the Bd Jean Simon's embankment, and its
  first 9 m drop to a quai junction 6.5 m lower (the lidar agrees at both ends); the solve
  stiffens it to its limit and leaves a 28–56 % piece. It is most likely an OSM junction across a wall, so a hand fix (drop or
  relink the way) is the answer.
- **`bake --rides` re-lays bike ramps** straight between their nodes, while the bake now solves them with everything else. The
  difference is small, but `--rides` after a band bake no longer re-applies the band's routes. With MULTILEVEL on it keeps the
  package's heights.
- **Fixed later the same day (bake):** flights of stairs are laid straight from end to end after the solve. The Grenelle flight
  that dipped 0.9 m in the middle now rises nothing, and the stairs renderer's existing 0.8 m rule no longer draws it.
- **Grass shows on the lidar trench floor just inside the Alma tunnel mouth**, beside the road and in the slab's shade. Raising
  the ground under the lid slab to the street (adding the lids to the structure mask) stood bright slanted ground faces in the
  mouth, which looked worse, so it was reverted. Under a structure, a trench road no longer lends its level beyond its own corridor.
- **paris-centre's runtime for the pass is unmeasured.** The river and bridge-outline masks are rasterised and indexed for it,
  but it has only run on minis (1–3 s).
- **Fixed later the same day (renderer): steep ground is stone.** `render/road-material.ts` gives the base ground's material a
  `cliff` switch, on for grass, dirt and sand only. A face steeper than about 60° (`CLIFF_FROM`/`CLIFF_TO`, the face's own slope
  from screen derivatives) draws as limestone in `CLIFF_COURSE` courses instead of stretched grass. This covers the Iéna tunnel's
  sides, the step at a trench and the face of a bank. Gentler slopes keep their grass.
- **48.860758, 2.291972 ("a poly over the ground… tesselation"):** not identified; a screenshot would pin it down.
- **The earlier band passes still run** under this one, which costs bake time and leaves two sources of truth in the code. Once the
  pass has been ridden on paris-centre, the next step is to switch off, inside the band, the passes whose output it replaces:
  the band's sight blend and route easing, the road bed, `LID_RECUT`, and the deck zones' levels except the hand facts.

### Round 3: owner's reports after the paris-centre rebake (2026-11-15, evening), not yet fixed

- **Wall climbs (added, tested on pont-national-mini only, not in paris-centre):** a segment rising 2 m+ at 25 %+ across a BD TOPO wall
  line, or 2.5 m+ at 35 %+ with no line, becomes `steps` (`ML_CLIMB_*`). Three on pont-national-mini, legs unchanged at 9/10. The
  Allée Paris-Ivry keeps one 2.3 m / 38 % segment, under the threshold.
- **Fixed: 48.863086, 2.296402.** Under a structure, a way's height over the ground is now judged against the median lidar in a ring
  8–12 m round it, outside structures and the river (`ML_RING`). A raised stretch becomes a deck; a raised flight of stairs stands
  free and is kept out of the ground's corridors. On debilly-mini the mound is gone and the stairs stand free from the port.
  The original report:
- **48.863086, 2.296402 (Passerelle Debilly's landing, holes in the ground with stairs through them):** the footbridge's stairs and
  ramp footways stand up to 5 m over the lower port, inside the bridge outline where the lidar is blind. The height-span rule never
  starts a deck at a blind vertex, so they stay at grade, and their corridors pull the ground up into a torn mound.
  *Fix:* a non-bridge way standing ML_RAISE over the terrace level under a structure should be cut as a deck, or kept out of the
  ground corridors, so stairs stand free.
- **Partly addressed: 48.860556, 2.291294.** Under a FLUSH deck (a lid, a bridge's end on land: the lidar within `ML_FLUSH` 1.5 m of
  the deck) the ground is filled to `ML_FILL_UNDER` under it; 576 cells on bir-hakeim-mini. The Place de Varsovie deck probed there
  runs along the trench's edge, so its side face overhangs the open trench, which is real. Not confirmed in a shot.
  The original report:
- **48.860556, 2.291294 (Iéna bridgehead, the bridge's abutment faces through the plaza):** `render/bridge-structures.ts` stands
  the abutment and spandrel walls down to a ground it estimates, and the plaza ground is higher. Likely the structure's foot
  should take the shipped ground, or the walls be clipped to it.
- **Pont Neuf (48.856748, 2.340945) and Pont Alexandre III, a generic deck clashing with the styled structure:** the deck pieces
  there are OSM's own, not the pass's. The structure's deck profile was smoothed this afternoon with a median then a mean. The mean
  blurred the ramps at the bridge ends, so the structure stood off the ways' decks; the mean is now off (`DECK_MEAN` 0). Not
  confirmed: a screenshot would show whether the clash is height or width.
- **48.863403, 2.313347 (Pont Alexandre III):** a generic deck drawn over the custom-modelled bridge. Check whether the
  pass's new decks (grade separation / height spans) were cut on ways the custom model already draws, and skip ways inside a
  landmark bridge's outline.
- **48.863667, 2.320426 and 48.862827, 2.319590 (Concorde, ground floating over the river, a large protrusion):** not yet
  probed. Candidates are the land-must-reach-shore rule's barrier cells along a wall, and the distant-ground clamp at a bank.
- **48.857889, 2.339162 (grass in the water by the Île de la Cité's tip):** the spot itself is water (bed −7.5 under −6.0); from
  above, the green round the island's stone prow is the Square du Vert-Galant, a real park near water level. Five cells near it
  stand 0.5–1.3 m over the water at the island's edge. No change made.
- **48.858571, 2.340164 (a route through a tunnel entrance):** the Parc Rives de Seine promenade (now really ridden through the
  old expressway's tunnels) runs on the lower quai, into a cut and under the Pont Neuf's right-bank end. There the bridge structure is
  drawn solid to the ground, so the route enters a wall instead of an open arch. *Fix:* in `render/bridge-structures.ts`, the span
  over a lower-quai way should be open (its `open` stretches and `DRY_CLEAR`).


### Round 4: the round-3 reports, checked and fixed (2026-11-15, late)

Each was probed on a mini and the fix shot there; paris-centre was rebaked with the two bake rules (34 min).

- **Fixed: Concorde, 48.863667, 2.320426 and 48.862827, 2.319590 (ground over the river).** The lidar's interpolation under the
  Pont de la Concorde reads +0.4 m (6.4 m over the water) in a 22 m strip beside the OSM outline, bank to bank, and the shore flood
  fill kept it as land. Within `ML_BRIDGE_NEAR` 30 m of a bridge outline and over `ML_BANK` 2.5 m from the river's edge, lidar land in
  the river is now riverbed unless a way runs within `ML_RIVER_CORR` (a lower quay under a bridge has its path). A first version with a
  height test (`ML_PORT_MAX`) left the strip's 2–5 m down-ramp standing. 5,274 cells on concorde-mini, 40,934 on paris-centre. The
  twelve-site regression is unchanged in every way count and route leg; only Concorde (+79 low cells) and Alma (+6) moved.
- **Fixed: 48.858571, 2.340164 (a route through the Tunnel des Tuileries' mouth).** Not the Pont Neuf. `tools/gaps.ts` joins a path
  ending at a tunnel's mouth to the nearest way because a tunnel "is not ridden". It had joined the lower quai's trench path to the
  Quai du Louvre's sidewalk 3 m above, and the solve pulled the sidewalk down into the mouth and back up. The multi-level pass now undoes
  a gap join where the joined path's other end continues into a ridden tunnel (`bore`). Heights cannot tell: the ways come in at one
  height at the join. The sidewalk now crosses the mouth as a short deck. 1 join on louvre-mini, 5 on paris-centre.
- **Fixed: 48.857889, 2.339162 (grass in the water by the Vert-Galant) and the straight-edged green triangle beside the Pont d'Iéna
  (by 48.860758, 2.291972).** Both were the riverbed (−7.5 m) with no water over it. `dropDryWater` treats the land side of a quay
  wall as dry up to 30 m inland, "whatever the ground". Short wall pieces at the island's tip and the Iéna bank face their high side
  to the river, so wedges of open water were cut away. Ground `WATER_BED_WET` 0.8 m or more under the water is now always wet.
  Render-only.
- **Fixed: Pont Neuf and Pont Alexandre III, "fences and lights are not aligned with the bridge deck and road" (owner).** The
  structure ran along its OSM outline's rectangle, which is turned off the ways it carries: 3.5° at Alexandre III, 8° on the Pont Neuf's
  short arm. Over 150 m the parapets crossed the roadway by 9 m. The axis now turns to the length-weighted direction of the bridge's
  own ways running within 25° of it, carriageways counted twice (`alongWays`, `ALONG_*`). Render-only. The 64 bridge and water unit
  tests pass.
- **Checked, no clash left: the generic deck over the custom bridges.** Seen from above, both decks are one surface (median-only
  smoothing). What looked like a deck by the Pont Neuf's island end is a quay wall and steep (limestone-shaded) ground, where the island
  climbs from the Vert-Galant. Under the Pont Alexandre III it is the arch's own rib and spandrel posts.
- **Checked: the Iéna footings (48.860556, 2.291294).** In the new paris-centre no footing shows through the plaza, and the arch over
  the lower quai is open.
- **Still unidentified: 48.860758, 2.291972.** The water wedge fixed above is about 20 m east of it. At the point itself, the Place de
  Varsovie's pavement layer shows jagged pale shapes round the lid slabs, and a small dark-green pavement wedge sits by the
  road-tunnel portal. A screenshot would settle which one the owner meant.
- **Fixed in paris-centre: the green slab beside the Pont de la Concorde** (shot after the rebake: water all round the bridge).
- **Checked in paris-centre: 48.860758, 2.291972.** At the point nothing odd remains: the green wedge by the road-tunnel portal is
  gone, and the water reaches the quay.
- **Pont National's leftovers (4 floating footways, 8 steep pieces, the Allée Paris-Ivry's 38 % segment):** they stood past the band's
  25 m ease, where the old passes' ground, 2–3 m under the footways, still shipped. The pass's own ground there was right (the
  footway's corridor), with weight 0. `ML_EASE` is now 60 m: 1 floating footway, 4 steep pieces, and the Allée becomes a short covered
  piece under the Bd Jean Simon's embankment (20 % over 6 m). Route legs unchanged at 9/10. 100 m gained little more.
- **wallGap (161 without the pass, 184 with it):** the rise is the openings. The bake takes a wall piece out where a drawn way crosses
  its line (88 on seine-centre-mini) so routes do not run through stone, and the scoreboard counted each as a gap. It now counts a
  sample as covered where a drawn way crosses the wall line at more than 25° within 3 m (`WALL_OPEN`). A quai road running along its
  wall does not count.
- **The Tunnel des Tuileries is on the bike graph.** Undoing the false join at its mouth cost the Pont Neuf's lower-quai leg
  (86 → 85/97). The leg had passed only through the bug: the Seine band's `noBike` takes every non-foot tunnel off the bike graph
  (meant for the Pont National's highway tunnel), and the Tunnel des Tuileries, a `service` way, is the Parc Rives de Seine's own
  tunnel, car-free since 2016–17. With it off the graph, the promenade dead-ended at the mouth, and the join to the sidewalk 3 m above
  was its only way out. `DZ_BAND_NO_BIKE_TUNNEL_OK` now includes `service`. seine-centre-mini: 87/97, the best yet; the Pont National
  highway tunnel stays off (1 highway-type way). A scoreboard change that snapped lower-quai ends to the lowest way at the quai's own
  level was tried and reverted: it dropped failing legs (97 → 92) rather than failing them.
- **Garigliano: one more steep piece** (1 → 2) with the 60 m ease; the route legs are unchanged.
  The two are a Quai André Citroën slip road at 12 % over 7.5 m and a 2 m footway at 12 %, just over `ML_GRADE_MAX` 11 %.
- **paris-centre rebaked with all of round 4** (24 min): 41,048 bridge-ghost cells, 5 tunnel-mouth joins undone, 193 highway-type
  ways off the bike graph (the promenade's service tunnels no longer among them). The Search positions are regenerated. Local only:
  not on R2, not committed. The 2026-11-11 build is still in `~/cityengine-bake-backups/`.
- **Final regression (the owner's six sites and the six added ones):** every way count is unchanged or better than round 3.
  Pont National: floating footways 4 → 1, steep pieces 8 → 4. Pont Neuf: steep 1 → 0. Route legs: seine-centre-mini 86 → 87/97,
  pont-national-mini 9/10, bir-hakeim-mini 9/14. Garigliano: steep 1 → 2.

### Round 5: six fresh sites and the last leftovers (2026-11-15, night)

- **Six sites never audited before:** Pont Royal, Pont Marie, Pont d'Arcole, Pont Saint-Louis and Pont au Double (seine-centre-mini),
  and the Pont de Bercy's left-bank end (bercy-mini). None had a junction step. First pass: a flight of stairs by the Pont d'Arcole
  8.5 m over the port, and two ways 1.0 and 1.8 m under the ground at the Pont au Double. Both are fixed; none of the six has a floating
  or buried way now. What is left there is steep pieces: 12–16 % stretches of 2–7 m, and a 41 % 2 m joint on the Parc Rives de Seine
  by the Pont Marie.
  - **Arcole:** another gaps.ts join, here from the flight's foot at the port up to a footway on the upper quai, 7.9 m higher and 3 m
    off. A gap join whose last piece climbs more than `ML_GAP_LIDAR_DH` 2 m at over `ML_GAP_LIDAR_GRADE` 60 % in the lidar is now undone,
    and its extension vertex dropped. A flight of stairs at grade now takes the lidar whatever its incoming height: under a bridge's
    outline too (beside its abutment), and down to the water (a quay stair's foot is in the river's outline). It now runs 1.8 → −4.8 m
    on the ground. 20 joins undone on seine-centre-mini.
  - **Pont au Double:** the Promenade Maurice Carême lay inside a wider upper way's corridor, 1.8 m higher, which won on edge distance.
    Under a structure, inside two corridors, the way whose centreline is nearer now decides. The cost: about four more wall gaps on
    the Île Saint-Louis quays (wallGap 177 → 191 on seine-centre-mini, the same gaps counted in several bridges' windows); without the
    rule the buried way returns. Kept, by the owner's rule that no way runs through the ground.
- **Checked in shots:** the Concorde north end (48.862827, 2.319590) in paris-centre, with water and the lower quai's path clean
  round the arch.
- **The climb rule needs a reversal.** As first written it also undid the join at the top of a two-point footway that drops 5.8 m
  in 5 m from the Garigliano's footbridge (a stair mapped as a footway), and left a junction step there. A climbing join is now undone
  only when the way ran the other way just before it (down toward its end, then the join back up), as at Arcole. Garigliano is
  back to 2 junction steps; seine-centre-mini 87/97.
- **Final state (paris-centre rebaked, 24 min; 16 joins undone there).** Against round 4, on the twelve regression sites: Grenelle's
  floating ways 2 → 0 and Bir-Hakeim's high ground cells 51 → 29; everything else is unchanged. Route legs: seine-centre-mini 87/97,
  pont-national-mini 9/10, bir-hakeim-mini 9/14.
  Still in the audits, none of them an owner's report: Pont National's last floating footway and 4 steep pieces, both at the band's edge;
  Garigliano's 2 junction steps (footways on layer −2 meeting the footbridge, there before this work); and 12–16 % steep pieces of
  2–7 m at several bridges.
- **The ease holds full weight for its first half** (`ML_EASE_FULL` 0.5, then fading to 60 m). Pont National's last floating
  footway is gone and its steep pieces go 4 → 2. It gains one buried end: a flight of stairs whose top vertex, where it meets the
  upper footway, is 1.0 m under the ground (the lidar reads 3 m low at the wall's edge there), plus a raised footway's end vertex,
  also 1.0 m. Exempting a flight's shared ends from the stair rule did not clear them and brought back a buried way at the Pont au
  Double, so it was reverted. On the other eleven regression sites the plateau changes nothing; Bir-Hakeim's grade audit goes 69 → 67.
- **Re-audit of the six fresh sites on the final build:** no floating way, buried way or junction step at any of them; steep
  pieces only (Royal 1, Marie 2, Double 1).
- **Shots on the final paris-centre:** at 48.860758, 2.291972 the road-tunnel portal, the pavement and the water to the quay, with
  nothing out of place; at Concorde's 48.863667, 2.320426 the bridge's end arch and the lower quai's path, no ground in the water.

### Round 6: the Pont d'Iéna (2026-11-16)

The owner's report at the Place de Varsovie (48.860260, 2.290997): a dark block at the bridge's right-bank end, a hole in the ground
that comes and goes, and "the route in the tunnel also jumps to street level (both routes in it)". Then: make the Pont d'Iéna look right
from both bridgeheads, on the bridge and in every passage under it, then the bridges near it. Views are a fixed set in bir-hakeim-mini
(scratchpad `iena-shots.sh`: each bridgehead from land, the abutments from the lower quai, both faces, the deck).

- **The routes in the trench (fixed, render-side: the ride graph).** The Place de Varsovie is a hand-made roundabout (`overrides.ts`,
  R 55 m), and `applyRoundabout` rebuilt every ride edge inside it as ring and spokes: the Avenue de New York's two carriageways,
  7 m under the place in their trench, were cut at the boundary and spoked up onto the ring. A way all of whose points inside a
  place are more than `ROUNDABOUT_LEVEL` 2.5 m off the place's level (the median of its road points) now passes through it untouched
  and lends the ring no heights.
- **One node, two levels (fixed, bake).** OSM shares a node between a street on the place and the trench's ramp; the solve gave them
  their own heights, but the node joined them, and the ride graph drew a 7.6 m step. Where the ways at a node end more than
  `ML_NODE_SPLIT` 2 m apart, the level with the most ways keeps the node and each other level gets its own. 3 on bir-hakeim-mini.
  With both fixes bir-hakeim-mini's route legs went 9/14 → 11/14 and its scoreboard total 115 → 90–96.
- **The dark block (fixed, bake).** The Port Debilly's lower-quai road runs under the bridge's right-bank land arch. The grade
  separation compared it with the median lidar in a ring round it, mostly the upper quai at a bridgehead, cut 7 m of it as a covered
  piece, and the tunnel renderer drew a portal and tube inside the arch. A way under a bridge's outline is no longer cut as covered
  there (the bridge covers it), and an OSM tunnel lying ≥ 80 % under a bridge's outline is a passage at grade (`ML_PASSAGE_IN`). The
  road now runs straight under the open land arch.
- **The retaining wall behind the lower quai (improved, bake).** The step stood as a grass ramp and a cliff of ground, the wall 2 m back
  on the plateau: BD TOPO's Mur de soutènement line lies about 2–2.5 m behind the step that the lidar and OSM's footway on its top
  both show. BD TOPO's wall lines are now moved onto the lidar's step (`tools/wall-align.ts`: the strongest step within ±3 m of each
  2 m sample, if clearly stronger than the step on the line, offsets median-smoothed), for the ground pass and the wall builder alike.
  The wall now stands as one vertical face; a strip of grass still rises in front of its foot. Corridors also no longer reach across a
  wall line. (The scoreboard's wallGap reads BD TOPO's own lines, so walls moved onto the step count against it: 15 → 21 on
  bir-hakeim-mini.)
- **Corridors stop at wall lines, but not under a way's own width:** checked only in a way's bed pad and skirt. Checking across its
  whole width buried paths along quay walls: Iéna's stairs, the Port de Montebello, the Parc Rives de Seine by the Arcole.
- **The scoreboard measures walls against the aligned lines** (the bake's), so wallGap no longer counts the alignment against itself:
  seine-centre-mini 192 with it, against 191 before this round.
- **Still to do at the Pont d'Iéna:** the bridgehead pavements (jagged pale shapes and grass islands where the pavement layer, the
  areas and the grass meet; the owner: "lots of overlapping textures"); the grass strip at the right bank's retaining wall foot; the
  faces read dark from the water; the stairs on one side (the owner: "famous steps"). Then the bridges near it.
- **The Place de Varsovie's surface (owner: "holes in the surface", "random patches of different pavements").** Four causes, all fixed:
  1. *Lids lost their flag on the way to the page.* The v3 tile format (`src/map/format.ts`) had no place for `PackedBridge.lid`, so
     every lid slab arrived as a plain bridge outline and was built as a girder bridge as wide as its outline: 120 m of pale slab across
     the plaza, flush with its ground. The format now carries `lid` (convert.ts writes it, adapt.ts reads it).
  2. *The lid's level was taken before the multi-level pass* moved the streets on it, 0.6 m over them, and the vans sank into it. It is
     now the 10th percentile of the street heights on it as shipped (`LID_LEVEL_Q`), and the ground inside a lid's outline is held
     `ML_LID_UNDER` under that level, so the slab is the paving between the streets.
  3. *Two tiles drew the same pavements and carriageways* within a few metres of their shared edge, each subdivided and draped its own
     way, and they fought in patches; a tile seam runs through the place. Each tile's pavement layer and carriageways are now clipped
     to its own square (`render/clip-mesh.ts`, `TILE_CLIP`).
  4. *Three paving colours:* the slab, the footway decks (`PARIS_DECK`) and the structures' own. The lid's top is the decks' Paris
     paving, and structures take a small polygon offset (`BRIDGE_Z_OFFSET`) so they yield to a surface in their own plane.
  The bake needs `tsx` while another session's tools/gardens/index.ts uses a constructor parameter property that Node's type
  stripping rejects: `NODE_OPTIONS=--max-old-space-size=12288 npx tsx tools/bake.ts <city>`.
- **The bank beside the right-bank lower quai (improved).** The grass bank between the lower quai's road and the plateau came from the
  road's corridor skirt, which blends the ground 4 m out to the lidar beyond: here up 8 m, under the bridge where no BD TOPO wall line
  runs. A skirt now applies only where the open ground beyond lies within `ML_SKIRT_DH` 2 m of the way; past that the ground steps at
  the corridor's edge (−4.4 → +3.8 m between 202 and 204 under the arch). Stairs lay the ground under their own width only
  (`ML_STEPS_NO_SKIRT`). A paved strip `WALL_FOOT_PAVE` 2.5 m wide now runs along every quay wall's low side. Taking the lowest way
  under a structure (`ML_UNDER_LOW`) was tried and left off: no change here, a worse scoreboard.
- **Stairs at the Pont d'Iéna:** OSM has two long flights at the left bank (338, 39 m from the lower quai up to the Quai Branly; 1722,
  15 m) and short ones at the right; all are drawn as generic stone flights. Which ones the owner means by "famous steps" is open.
- **Quay stairs (owner: the left-bank flights).** A flight running along a quay wall (60 % of its points within a wall's reach,
  `QUAY_STAIRS` in render/stairs.ts) is now built whole by the civic stairway builder (render/landmarks/stairway.ts) as stone flights
  and landings with a solid parapet raking down in register, newels at the foot (`QUAY_STAIR_STYLE`), not concrete treads on the
  ground. The Pont d'Iéna's two left-bank flights read as stone quay stairs from the lower quai; so does every other quay stair on the
  Seine. Render-only.
- **Regression for the skirt and stair-ground changes:** no site worse; Alma's buried way gone, Bir-Hakeim's high ground cells
  29 → 21, Pont National's low cells 18 → 15.
- **The neighbouring bridges, first look** (scratchpad `bridge-views.py <city> <name> <prefix>`: both faces from the water, the deck and
  both heads, framed from the structure's own axis). The Pont de Bir-Hakeim reads well: the iron arches and the métro viaduct, the deck's
  walk under the colonnade, both heads. Only a pale wedge of steep ground by a viaduct pier at its right bank. The Passerelle Debilly is
  clean from the water: green iron arch and railings. The Pont de l'Alma: the girder and its two piers, water under the deck (the green
  band seen under it is the far lower quai's lawns), the deck and right-bank head fine.
- **paris-centre, checked after the 2026-11-16 rebake** (99 min; 22 tunnels under bridge outlines made passages, 38 nodes split by level):
  the Place de Varsovie reads as one plaza (cobbles and roads, no pale slab, no flicker); the lower quai runs under the Pont d'Iéna's open
  right-bank land arch; the left-bank quay stairs show their stone parapets; the Concorde points and 48.860758, 2.291972 are clean. That
  bake predates the skirt rule and the ground under lids (the bank under the right-bank arch still slopes −3.8 → −0.2 m there); a
  further rebake carries them.
- **paris-centre rebaked again (67 min) with the skirt rule, stairs without skirts and the ground under 31 lids (1,309 cells).** Under the
  Pont d'Iéna's right-bank arch the bank now stands as a stone face beside the path, not a grass ramp.
- **Ten more bridges, checked in paris-centre** (both faces from the water, the deck from the street before it, both heads):
  Grenelle, Invalides, Alexandre III, Concorde, Royal, Carrousel, Arts, Saint-Michel, Marie and Sully. One flaw, on two of them: the
  structure's own deck top, drawn the whole width just under its lowest way, showed as pale wedges on the road at the Pont Marie's and
  the Pont de Sully's ends where the ways' surfaces stop short of the structure. Its colour is now the decks' paving tone (`DECK_TOP`),
  and both decks read as road and grey pavements. The rest read correctly: arches and pylons, decks, heads. (Several head views
  landed inside buildings or the Louvre when framed from the axis; those were camera placements, checked again from the quai roads.)
- **Pont National's last audit items (left, explained).** Three ways read exactly 1.0 m under the ground at one point each, and two
  pieces at 12–14 %. Debugged at the cells: the bike ramp overlaps the Bd Jean Simon's 19 m-wide corridor in plan, a metre under it —
  below `ML_SEP` 3 m, so the levels are not separated and the ground takes the boulevard's. At the flight's top and the raised footway's
  end the ground at the cell is within 0.3 m of the way (5.20 under 5.42; 4.53 under 4.5); the audit's 1.0 m is the ground mesh's blend
  between neighbouring cells at the junction. Three rules were tried and reverted: the lower way inside two drawn widths (floated
  footway 1013 by 1.6 m), the nearer centreline there (`ML_ON_CENTRE`, the ramp 2 m under), and stairs' shared ends off the lidar (a
  buried way back at the Pont au Double).
- **Final paris-centre, re-checked:** 48.860758, 2.291972 clean (water to the quay, a moored boat); under the Pont d'Iéna's right-bank
  arch a stone face beside the path; the land arch open from the river.
  Two more tries, both reverted: the narrower way inside two drawn widths (`ML_ON_NARROW`, no change: the ramp's cells sit at the
  edge of its own width) and holding the bike ramp at its declared profile (the ramp 1.7 m under). The ramp is laid once, before the
  pass (tools/bike-ramps.ts via `earlyRamps`), and its declared route runs inside the Bd Jean Simon's mapped width for its first
  metres; the fix belongs in the declared ramp's via points (region data), not in the ground rules.
  Then the via point itself, tried 5 and 9 m west (src/city/bike-ramps.ts): the ramp's descent also runs over the boulevard's sidewalk
  footway, 1.3 m under it, and clearing that put its corridor under footway 1013, which floated 2.3 m. Reverted. The declared ramp's own
  note says no one has looked at an overhead shot of its line; it needs that look (where the real ramp, wall and sidewalks run) before
  it moves. These three items are this audit's, not the owner's reports.
  **The overhead look (IGN orthophoto, tools/ortho.ts, with the ways drawn over it):** the declared ramp's upper half runs from the Bd
  Jean Simon's end diagonally across a strip of tracks with catenary poles, and its lower half across the three parallel paths of the
  promenade, before it reaches the Quai d'Ivry. It follows nothing on the ground, so no via point clears the railway, the sidewalk
  and the paths at once. It needs a decision from the owner: a real route for it, or dropping it (the bridge's left bank is then
  reached by the steps and lift alone).
  **Resolved as a deck:** a declared bike ramp now stands as a steel ramp on posts (`bridge`, layer 1) unless its declaration says
  `ground` (src/city/bike-ramps.ts). It keeps its designed profile over the track strip and the paths, the ground under it stays the
  lidar's, and the Pont National audit no longer lists it as buried; route legs unchanged at 9/10. Left at Pont National: the flight's
  top and the raised footway's end (1.0 m readings that are blends between cells at the junctions; the cells are within 0.3 m), and
  two short footway stretches at 12 and 14 %, just over the audit's 11 %.
- **paris-centre rebaked with the elevated bike ramp (44 min).** Pont National there: no buried way; the ramp is a deck. One reading:
  the flight beside the wall (59826, the mini's 616) stands 1.6 m over the ground at its middle, where the lidar under a stair against
  a wall reads the low side; the quay-stair builder draws it as one solid stone flight, so nothing hangs open. Two footway stretches at
  12 and 14 % remain over the audit's 11 %.
  **Reverted: the ramp as a deck.** Rays along it in paris-centre: its deck lay under the boulevard's sidewalk paving (6.5 m over
  4.5) and then under the embankment's ground (4.3 over 3.0), the rider hidden. The embankment stays at 4.3–6.5 m almost to the quai
  and drops at a wall near the end, so a ramp falling at 10 % from the boulevard is inside it on any line. The ramp is back at grade on
  its original line (one 1 m spot); `elevated` remains as an option for a declared ramp. Its line needs a design — along the wall,
  descending where the ground does — and the owner's call.
  **Why no line works as declared:** the top is at (−191, −161), 6.5 m; the embankment holds 6.5 m to its edge at about z −135 (no BD TOPO
  wall line there), and below it the ground is 1.9 → 0.8 → −0.3 m; the bottom on the Quai d'Ivry is at (−190, −107), 31 m past the
  edge. 6.8 m over 31 m is 22 %. A ramp outside the embankment needs a switchback on the low ground below the edge, which holds the
  track strip and the promenade's paths (orthophoto). A design decision for the owner: where the switchback goes, or no ramp.
  (The paris-centre bake of 2026-11-16 03:58 wrote every city file; its final audit stage then failed on three La Défense entries in
  another session's paris/defense3.json, not on anything of this work.)
- **The Pont National bike ramp, resolved as it stands.** The height map shows its route is coherent: from the boulevard's plateau it
  passes under the railway embankment (a covered piece the pass cuts) and descends to the Quai d'Ivry. Its 1 m reading was the tunnel's
  approach, under the ground but short of `ML_RAISE`. A stretch next to a covered piece that runs `ML_CUT_MIN` 0.7 m or more under
  the lidar is now `cut`: the ground follows it down, no skirt. The ramp is no longer buried; six approaches became cuttings on
  pont-national-mini. Regression: no site worse (low-ground counts rise where cuttings lower the ground, by design); legs unchanged.
  Approach cuttings take no trench pad (`approaches`): padded, the ramp's cutting sank the end of the sidewalk beside it, which stood
  2.2 m over the ground in paris-centre. After the paris-centre rebake (2026-11-16, 76 approaches made cuttings): Pont National has no
  buried or floating way except the flight beside the wall over its lidar dip (drawn on the ground by the stairs layer), and two footway
  stretches at 12 and 14 %. Regression: no site worse; legs unchanged.
  The two 12 and 14 % footway stretches are pinned at both ends by the ways they join: eight grade-stiffening rounds instead of five
  (`ML_GRADE_ITERS`, now tunable) changed nothing.

### Round 7: banks between street levels, and the Défense slab (2026-11-16)

Owner's reports at 48.868278, 2.224362 (Suresnes), 48.889156, 2.250540 and 48.888766, 2.254812 (La Défense's edge), 48.886270, 2.256000
(Pont de Neuilly) and 48.889028, 2.254117: shards of pavement and grass on every bank between two street levels, sawtooth walls, a tunnel
portal seen through a bank, all moving with the camera, and 9 m ridges of ground under the slab's walkways. Test city `neuilly-mini`
(500 m round the Pont de Neuilly). `look-at --probeall=x,y;…` lists every mesh a pixel's ray hits with its render group: the ground groups
clear depth (render/city.ts `setupGroundLayers`), so what a later group draws shows through the ground unless an occluder hides it.

- **Render (no rebake):**
  - `WT_OCC_BANKS`: the base ground's depth skin skipped every triangle steeper than `WT_OCC_GRADE`, meant for wall faces, so a bare bank
    had no depth in the later groups (the coarse occluder sinks to the drop's foot) and the upper level's paving, roads and a footway
    tunnel's portal drew through it. Steep triangles are now skipped only in a quay wall's reach or where a street is levelled off the raw
    ground (a street's retaining wall stands there; without that test the bank skin sawed the foot of Suresnes's walls).
  - `STREET_LAYER_MAX_GRADE` 0.6: the corridor's concrete (4.5 m wider than the street) and the pavements spilled onto banks of ~1.2,
    under `OVERLAY_MAX_GRADE` 1.5, and lost only some triangles: shards. No street is steeper than 0.6, so steeper triangles of those
    layers go.
  - `WT_TUNE.conform` (city/wall-ground.ts): the base ground and its layers are different chords of the same ground; at a bank's toe they
    parted by a metre. An edge whose middle is 0.15 m off the ground is split, over ground shipped at `conformStep` 2 m or finer only
    (on SF's Russian Hill it more than doubled the ground layers' triangles, 1.37M → 3.31M). Site 4 is on 4 m ground: a few small shards
    remain at its bank's foot.
  - `RW_SEEK…`: a street's retaining wall stood at a fixed line beside the street; on ground shipped at 4 m or finer the ground already
    steps there, and its cells stood in front of the wall's face as teeth. Each piece's ends now go out to the step's foot (≤ 1.5 posts,
    6 m) and a strip at the street's level covers the gap — only where the drop from the street over that distance is `RW_STEP_GRADE`
    0.6 or steeper, so a hillside sloping away keeps its wall where it was (Taylor at Green, SF: unchanged).
- **Bake (`tools/multilevel.ts`, needs a rebake):** under a structure the ground took the nearest at-grade way's level within 25 m; under
  the slab's walkway decks that way was on the slab, 12 m over the street the lidar sees. Over the lidar by `ML_UNDER_MNT_DH` 2.5 m, the
  floor is now the way within reach nearest the lidar's level, or the lidar. Over only (under a bridge the lidar reads high, not low), and
  not within `ML_UNDER_MNT_RIVER` 60 m of the river: either way the rule reshaped the ground by the Pont d'Iéna's left-bank arch.
  neuilly-mini: 1,600+ cells; bir-hakeim-mini: 138, all 60 m+ inland (the Trocadéro gardens, Rue Beethoven's stair bridge in Passy; not
  looked at closely). `ML_LOG_UNDER_MNT=1` logs where. Not yet in paris-centre: it needs the rebake.
- **Unchecked:** SF stair streets against `STREET_LAYER_MAX_GRADE` (flights of 0.45–0.7 may lose part of their corridor strip).
- **Not changed:** at Suresnes (site 1) the beige patch is bare base ground in the median between Boulevard Henri Sellier's two
  carriageways, which the bake has 1.4 m apart (5.56 and 6.99).
- **Quay wall's foot (render):** at the Quai Branly (48.856433, 2.28932) a footway along a wall's top had a corridor reaching past the
  line, and the ground on the low side took its level up to the stone's face: pale spikes up the wall and lawn panels standing on it.
  On a quay wall's low side a street's level or cut may now lower the ground, never lift it (`WALL_LOW_NO_LIFT`, city/terrain.ts).
- **Lids (render), the Place de Varsovie (48.860111, 2.290794):** the ground under a lid is the trench's, 7–9 m down; the place's paving
  and lawns were draped down there under the slab, the slab's flat top (structures group) painted over them, and the streets on it were
  dark decks up to 2 m over it. Now the slab's top is ground (`lidtop:` in the base group, depth copies just under it in the later
  groups), the place's layers inside a lid's outline stand on it, both at the level of the nearest street on the lid (`lidLevel`), and a
  street with 80 % of its length on a lid is laid as a carriageway in its own surface (`lidroad:`), not a deck (`LID_TOP_GROUND`,
  `LID_*` constants in render/city.ts). Foot ways on lids are still decks.
- **Bake:** the lidar rule (`ML_UNDER_MNT_DH`) now stands down inside a lid's outline too (it would sink the ground to the trench floor
  under lids more than 60 m from the river). Needs the next paris-centre rebake.

### Round 8: the plazas and bridgeheads pass (2026-11-16, owner: "make the plazas and bridgeheads look AMAZING")

`tools/site-sheet.ts` photographs many sites from one page load: per site four rider-height views round it and a high oblique, a
labelled sheet each, and `--probe=1` writes what 15 pixels of every cell hit (index.txt). Survey lists: every Seine bridge's two heads
12 m past the outline's ends (122 sites, from the package's bridge outlines) and sixteen plazas. A Sonnet reviewer ranked the defects.

- **Banks are ashlar (render, Paris).** The commonest flaw (16 of 28 sheets) was the ground's stone on steep faces: wavy beige courses
  with sawtooth edges, decided per triangle. The base ground now carries its steepness per vertex (render/city.ts, colour alpha −1..−2,
  `CLIFF_GRADE_*`) and Paris's stone is dressed ashlar (`CLIFF_COURSE`, `CLIFF_BLOCK`, `CLIFF_MORTAR`, `CLIFF_ASHLAR` in
  render/road-material.ts): staggered blocks along a fixed world direction (the face's own direction from screen derivatives jittered
  at a lumpy bank's triangle edges and speckled), no grass texture under it. Other cities keep the old courses.
- **Road tunnel mouths (render).** The portal's bank of earth behind it (for a railway into a hill) stood up as a 7 m dark-green wedge
  at road mouths under lids and bridgeheads (Varsovie, Saint-Cloud, Billancourt): roads get none. A road's portal is built only where
  the street behind stands `ROAD_PORTAL_SUNK` 3.5 m over it; on short underpasses it stood on the open road as a block.
- **Pale landmark paving.** The Étoile's rings are granite setts and darker flags (they lit to a cream disc); the Trocadéro parvis's
  paving is in the granite page and a warmer limestone (flat colour blew out white).
- **Step walls (bake, `tools/step-walls.ts`, off: `SW=1` turns it on).** The fine ground's steps as quay walls (mid-height contour,
  smoothed tops, a paved side required). On neuilly-mini it made a clean wall along a building's foot but walled lawn bumps in
  crenellations, and the banks the sheets showed are long embankment slopes it does not find. Left off.
- Checked: SF's Lombard, Filbert Steps, Taylor at Green and Twin Peaks unchanged.
- **Lid tops, second pass.** At the slab's edges the lid top and the base ground met in one plane in the base group, and the painted
  layers' material writes no depth, so the ground drawn after tore the top in patches (the Varsovie sheet's "torn crater"). The lid top
  has its own material, written into depth with `LID_TOP_ZOFFSET`, and is laid in the surface most of its streets use (setts at the
  Place de Varsovie), so the gaps between the place's layers read as the place.
- **Round two of the survey** (all 122 heads and 16 plazas after these changes): every bank flagged in round one now reads as ashlar.
  The remaining flags were mostly the survey camera inside a model (a deck, a parapet, a quay wall, a building: probe hits at 0–2 m),
  not geometry; the Pont du Carrousel's "striped wall" is the Louvre's rusticated Grande Galerie.
- **Walls' surface.** The streets' retaining walls and the trench walls were built with surface index 0, not a defined page, and the
  landmark material drew them in a dark bark-like grain (owner's shots at the Pont d'Iéna and a tunnel mouth, "really bad"). They are
  ashlar (stone, caps) and concrete (trench faces, copings), railings metal.
- **Plazas, third round** (after the shadow fix: a landmark's shadow is now the hull of its own vertices slid along the sun when that is
  smaller than its footprint's, `LM_SHADOW_*` in render/landmarks.ts — the Monument à la République's square slab is gone): Varsovie,
  Trocadéro, Étoile and République better; Résistance, Saint-Michel, Défense, Bastille, Vosges clean.
- **Open (owner, 2026-11-16 evening):** holes in the Pont d'Iéna's right-bank head deck seen from the bridge, an elevated walk there, a
  bad tunnel mouth with a wall slab standing in the trench (location to find), and moored boats inside the quay walls at
  48.862981, 2.296962 (Port Debilly; "now" — check whether today's rebake moved the walls).
- **Later the same evening.** Hand-placed boats are pushed out until their beam is also `HAND_WALL_CLEAR` 1.5 m off a quay wall's land
  side (render/boats.ts; Port Debilly). A carriageway's triangles steeper than `ROAD_MAX_GRADE` 1.0 are dropped (a ramp piece's asphalt
  stood as a wall across the Avenue de New York's trench at its north-east mouth, 48.860864, 2.291706). Still open there: the left
  carriageway stops short of the portal, where the bake gives the mouth's short connector pieces −0.5 → +1.4 m.
  **The Pont d'Iéna's right-bank head** (owner's "holes in the surface"): not holes. The bake fills the ground up to the deck round the
  street decks (flush-deck fill) and it dips into a pit toward the land arch, its steep sides drawn as stone. A bake job (Round 6's
  "bridgehead pavements" item). A cap over a styled bridge's whole outline was tried (`OUTLINE_CAP`, render/bridge-structures.ts) and
  changed nothing there: off.

### Round 9: the two bridgehead leftovers (2026-11-16, night)

- **Both owner reports came from a paris-centre bake without the multi-level pass.** The paris-centre being served was baked at
  22:32 UTC (bake 20261116T2232) by the La Défense session, with `npm run bake paris-centre --no-audit` and without `BDTOPO_BAND=1`.
  Its log has no "seine band" lines and no "multi-level:" lines, and its tiles come to 299 MB against 380 MB for the 20:44 bake. In
  that data:
  - The Pont d'Iéna right-bank crossings and sidewalks stand at 7.5 m, 4 m over the lidar (3.3–3.5) and 3.4 m over the deck. These
    are the owner's "elevated walk".
  - The ground is filled up round them and dips into the "pit" toward the land arch.
  - The ground under the Place de Varsovie's lid is the lid's top instead of the trench.
  - The Avenue de New York's northbound tunnel stands at the lid's level (4.10).
  The 20:44 bake (backup ~/cityengine-bake-backups/paris-centre-20261116c) has the footways at 3.6–3.9 and the tunnel at
  −2.8 … −3.6. A fresh bir-hakeim-mini (current code, `BDTOPO_BAND=1`) is clean from the owner's deck view: paving and decks, no
  fill, no pit. The far side, from the place back toward the bridge, is clean too. **The elevated walk is not right: it is an
  artefact of that bake.** paris-centre needs restoring from backup c or rebaking with `BDTOPO_BAND=1`: the owner's call.
- **Twin lid chains (bake, tools/tunnels.ts `lidTunnels`).** The Avenue de New York's two halves under the Place de Varsovie are
  judged as separate chains. In paris-centre (both the 20:44 and the 22:32 bakes) the northbound half failed the at-grade test by a
  hair: its road 100 m out is at 1.5 / 1.1, mean 1.3, against a limit of 1.3 (the street over it is 4.3). It stayed a tunnel inside
  the open trench, with a portal and a wall in the trench, while the southbound half became a trench road. A chain refused only by
  that test is now tried again after every chain has been judged. It becomes a lid when a lid chain of the same name runs beside it:
  mean offset under `LID_TWIN` 30 m, length within `LID_TWIN_LEN` 35 %, and `LID_TWIN_SIDE` 70 % of its points beside the other
  chain rather than past its ends (the Périphérique's lids follow one another under one name, end to end). A synthetic check pairs
  side-by-side twins and leaves end-to-end chains alone. bir-hakeim-mini already accepted both halves (its log is unchanged). Needs
  the paris-centre rebake.
- **Twin trench carriageways (bake, tools/multilevel.ts).** The two halves come into the solve with their own held heights: one
  mouth's road ramped by the lid, the other following the trench floor. Side by side they stood 1.3 m apart (−1.44 / −2.75 at
  210, 280 on the mini), and the ground between their corridors showed as a jagged bank with holes in the median. Each cut vertex is
  now tied to the nearest vertex of a same-named cut way within `ML_TWIN_D` 8 m, at `ML_TWIN_TIE` 2 × its hold weight
  (`multi-level: … N twin trench ties`). On the mini they now sit at −2.02 / −2.17 and the median is a flat strip to the lid. The
  mini's only cut ways are the Avenue de New York's 8 pieces, so nothing else there moved. Needs the paris-centre rebake.
- **Still at the north-east mouth (render, src/render/city.ts trench walls, not changed):** under the lid's edge each half's inner
  trench wall rises to the slab (`lidOver`) and stands as a dark block in the median. Just outside the lid, a thin pale wall end
  shows edge-on. The real underpass may have a central wall; check a photo before removing it.

### Round 9: the plaza leftovers (2026-11-16, night)

The round-3 plaza review's leftovers, render-side (no bake):

- **Place de Varsovie, the deck-grey slabs.** The pieces of the place's streets either side of the lid (364441, 192676, 192683, 364447,
  152491) are flagged ramps with every height on the ground, and went to `deck()`: flat PARIS_DECK slabs in the setts. A carriage way's
  ramp within `LID_FLUSH_PAD` 15 m of a lid (`LID_FLUSH_RAMPS` turns it off) whose every height is within `LID_FLUSH_DH` 0.3 m of the ground is laid like a street on
  the lid (`lidroad:`), at its own heights (render/city.ts, decks loop, `flushRamp`).
- **Parvis Notre-Dame and Saint-Michel, the floating grey bars.** Foot ways flagged ramps with every vertex on the ground (within
  `FLUSH_FOOT_DH` 0.4 m; the parvis's 167255, 165475's tail, Saint-Michel's 166757) went to `deck()` too, and a deck, linear between
  vertices 5 m apart, stood up to 0.8 m over the paving's dips. In Paris they are no longer raised at all (`FLUSH_FOOT_RAMPS`, where
  `raisedIds` is filled) and are painted as ordinary footways. (Laid as strips in their own surface first, they crossed the parvis as
  gravel bands.)
- **Place de l'Alma, the dark band.** Not a seam with the bridge: the bake's lid outline stops 4 m short of the trench's north wall, and
  between the slab and the Avenue de New York the eye looked 3.6 m down into the trench. The lid top is laid over its outline grown
  `LID_GROW` 6 m across its long sides (`LID_GROW_EDGE` 25 m or longer; the short ends are the portals) and keeps, outside the outline,
  only triangles over ground `LID_GROW_DH` 1 m or more under it; `liftOnLids` lifts the place's layers lying down in that band too
  (`growRing`). Then a blue line with white dashes across the place: the lid's own slab (`bridges:`, render/bridge-structures.ts) has
  its top 0–2 cm under the lid top, over the lid top's depth copy in the structures' group; that copy now stands `LID_OCC_G3_LIFT`
  1.5 cm over the top (the other groups' copies stay `LID_OCC_SINK` under it). A faint dashed marking still crosses the near place
  after that: a lid road's own marking or the slab still showing, not checked — re-check after the band rebake.
- **Shadows (Concorde, Vendôme).** A landmark's shadow from its own shape is now a hull per chunk: its parts (triangles joined by
  shared corners) cut into `LM_SHADOW_CHUNK` 8 m chunks by where each triangle stands, each casting the hull of its vertices at their
  feet and slid along the sun (`modelShadowHulls`, `LM_SHADOW_PARTS`). They overlap without darkening twice (shadowMaterial's depth
  test). Used when the hull of all of them is smaller than the footprint's; past `LM_SHADOW_MAX_PARTS` 500 chunks or
  `LM_SHADOW_MAX_VERTS` the one hull of everything, as before. The Place de la Concorde's one hull spanned the obelisk, the fountains
  and every lamp, and per part its moats' balustrades (a ring) still cast their hull across the place. The Colonne Vendôme's was a
  37 m strip draped at its six corners only: its middle sank under the place's ground and its far end lay alone on the paving as a
  dark slab. Landmark shadows are now split, longest edge first, to `LM_SHADOW_EDGE` 3 m before draping, or coarser so as to stay
  within `LM_SHADOW_MAX_TRIS` 300 a landmark (`bisectLong`). Quartering to 3 m (coplanar.ts `subdivideLong`) gave the Dôme des
  Invalides 865k triangles; now 307 landmark shadows round the Concorde total 67k. Heights are each vertex's over the ground under it,
  not over the model's base: on Lombard Street (SF) the downhill beds stood 20 m "high" and cast a dark polygon across the street.
  The Concorde's band was its FOOTPRINT's shadow: the model is fitted to the obelisk's ~10 m OSM base, slid at 31 m, a 10 m strip
  across the place. The model's hulls are now used when they cover less than the footprint together (`unionArea`, on a grid) or the
  model reaches past `LM_SHADOW_SPREAD` 3× the footprint's area, and only with `LM_SHADOW_STACK_MAX` 100 hulls or fewer (the Vendôme's
  443 overlapping hulls, draped apart, multiplied to a black beam; it keeps its footprint's strip). Hulls past `LM_SHADOW_MAX_PARTS`
  are keyed by chunk alone. **Not re-shot after this last change** (usage limit): re-survey concorde and vendome.
- **Châtelet's "pale box"**: the Théâtre du Châtelet's low corner block on the avenue side of its front (OSM way 248804634, a 5 m block
  with a terrace; render/landmarks/paris/palaces/chatelet.ts). Real; left.
- **The band is now the default (owner, 2026-11-16: "make the proper bake settings the default").** A city whose region has a
  `riverLevel` (every Paris city: region `paris`) bakes with the Seine band and the multi-level pass unless `BDTOPO_BAND=0`
  (`bandOn` in tools/bake.ts; `bake --rides` follows the same rule). SF, New York and Chicago are unchanged. The 22:32 bake is
  backed up at ~/cityengine-bake-backups/paris-centre-20261116d-nomultilevel; paris-centre was rebaked with no flag in the
  environment: bake 20261117T0352-3dra, 496 MB, the band and the multi-level pass ran (441 twin trench ties; the Avenue de New
  York's second carriageway "its twin carriageway is a lid: a lid too", both lids ridden 4.6 m under the place). Shots: the
  Pont d'Iéna's right-bank head runs flat from the deck onto the Place de Varsovie, with no pit, fill or raised walk; the
  Avenue de New York's two carriageways are level into the lid. The median wall block under the lid's edge is still there.
  Note for look-at: `--from` is x,z,height.
- **Survey.** Two rounds of all 16 plazas (Sonnet review). Fixed: Varsovie's slabs, the Alma band, the Parvis's bars, Saint-Michel's
  slab (a flush foot ramp, 166757), Vendôme's detached slab. Left at severity 1–2: the obelisk's shadow; a pale corridor wedge beside
  Varsovie's lid; Concorde's sand-yellow `areas` patches; Bastille's Y-shaped dark patch; Italie's dark rectangle in the oblique (none
  checked closely). **The Défense parvis** now stands a slab above the rider's eye at the survey's south camera (another session's
  uncommitted `parvisSlab` in render/landmarks/paris/defense-famous/parvis.ts, fitted at the 90th percentile of the ground): not
  touched here.
- **Caveat: the bake.** Every paris-centre shot this round came from bake 20261116T2232, made without the multi-level pass
  (BDTOPO_BAND off). The Varsovie and Alma lid and deck fixes were measured on it and are unverified on the band bake; re-survey both
  after the rebake.
- SF (Lombard, Filbert Steps, Taylor at Green, Twin Peaks) against round 8's sheets: the same, except Lombard's brick now lies evenly in
  its beds' shadow instead of a lit diagonal band.


### Round 10: the owner's reports on the default-band paris-centre (2026-11-16, late)
- **Fixed (render, no rebake): the Pont d'Arcole's right-bank end, "the lower quai road intersects the first bridge footing"
  (48.855709, 2.351085).** The bake is right there: the ground under the outline is the path's own height (−1.5 / −0.65). In
  `render/bridge-structures.ts` the open test wanted 3.4 m between the deck and the ground. The lower quai's ramp
  (960000000000360) crosses under the end with 2.9 m, so the dry arch stopped at s 86 and the solid abutment came down on the ramp at
  s 87–89. Now a station an at-grade way crosses under with `BR_WAY_CLEAR` (2.2 m) or more is open, padded `BR_WAY_PAD` past its
  kerb. A dry arch over such a way springs `BR_WAY_HEAD` (2.4 m) over the highest one, capped at the deck less 0.75, which makes a
  flat soffit. Arcole's dry span now runs 76.8–90 with its soffit at about 1.5–1.7.
- **Open: boxy ground patches in the Seine (owner: moving boats caught by the lidar), the grass at 48.856969, 2.346347.** At the
  point itself the package has riverbed (−7.7). A scan of the land inside the river outlines finds 295 blobs over 30 m², but the
  renderer clamps every river-outline cell under the sheet (`RIVER_CLAMP`) except on a quay wall's land side. So a visible patch has
  to be outside the outline (a hole) or on a wall's land side. That needs a patch's exact coordinate.
- **The Pont d'Iéna right-bank head and the Pont de l'Alma, "the tunnel isn't deep enough, bits poke into the ground"
  (partly done, bake, not in paris-centre yet).** Inside the Avenue de New York's tunnel (paris-centre, camera -2950,38 looking SW),
  grass strips and an ashlar bank stood in front of the trench walls, and a grass wedge came through near the top.
  - Cause: the trench road's padded floor (`ML_TRENCH_PAD`, which runs to 4.1 m from the centreline) lost its outer metre or two to
    the street beside it. That street's padded corridor (a wide sidewalk) won the corridor test on edge distance. So the place's
    level (3.6–4.0) came down at about 2.5–3 m from the centre, at the render's trench wall (2.5 m) instead of behind it. The
    Alma's Voie Georges-Pompidou (195364) has the same fault: its outer side stops at 2.5 m.
  - Fix (`tools/multilevel.ts` corridor, `ML_TRENCH_FLOOR_WINS`, on by default, `=0` turns it off): inside its padded width a
    trench floor wins over any corridor that isn't a floor, and wall lines inside that width don't stop it.
  - On bir-hakeim-mini the step moved out about 0.6 m, behind the wall. The same tunnel view on the mini shows a broad grass slope
    in the median that is there with the rule off too: the mini doesn't reproduce the paris-centre view, and the slope is a
    `retaining` mesh. It is not the park-bank slope: capping that changed nothing, so the cap was reverted. **Not verified in
    paris-centre**, which needs a rebake. bir-hakeim-mini is currently baked with `ML_TRENCH_FLOOR_WINS=0`.
