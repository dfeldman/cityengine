# Place de la Concorde: plan

Written 2026-11-04, from the code and OSM. No screenshots were taken yet; step 0 does that.

**Frame.** All positions are in `placeConcorde`'s local frame:
- obelisk at 0, 0;
- +z north, toward the Madeleine; +x east, toward the Tuileries;
- the landmark is rotated 25.7°.

**Converting OSM positions.** I rotated OSM centres into this frame with the same 25.7°. The fountains land exactly at 0, ±64, so the conversion is right.

## What is there now

| Piece | Where | State |
|---|---|---|
| Obelisk, plinth, gilt panels, hieroglyph bands, pyramidion | `place-concorde.ts` `placeConcorde` | good enough; procedural is the right level |
| Fontaine des Fleuves (N), des Mers (S) | `fountain()` | pier, two basins, water, finial are fine. Figures are beams and prisms: stand-ins |
| 8 city pavilions + seated cities | `city()` | pavilion is fine as a block; figure is a stand-in. **4 of 8 are misplaced** (below) |
| Rostral columns, 12 | inline loop | shape is fine; **positions are guessed and don't match OSM** |
| Hôtel de la Marine, Crillon (+ Coislin, Plessis-Bellière) | `gabrielPalaces`, `public/landmarks/paris.json` | exists; not yet reviewed in a shot |
| Musée de l'Orangerie, Jeu de Paume | `orangerie`, `jeuDePaume` (museums.json) | exist |
| Pont de la Concorde | `bridge-structures.ts`: 5 arches, balustrade, candelabra | exists |
| Madeleine, Assemblée portico, Palais Bourbon, Petit Palais | their own builders | exist; they only bound the views |
| Tuileries Grand Bassin Octogonal, terrace walls | `venues/gardens.ts` | exist |
| Chevaux de Marly, Renommée and Mercure on Pegasus, Franchi lions, the rest of the Tuileries statues | `parisStreetKind` generic street stand-in | stand-ins only |
| Octagon balustrade (the old sauts-de-loup line between pavilions) | — | **missing** |
| Square's own lamps (Hittorff candelabra) | city.ts street candelabra pattern | generic; verify in a shot |

### Position errors (OSM vs builder)

| Object | OSM (x, z) | Builder (x, z) |
|---|---|---|
| Strasbourg, Brest, Lyon, Nantes | (±85, ±88) | (±84, ±88): ✓ |
| Lille, Rouen, Marseille, Bordeaux | (±68, ±121) | (±132, ±46): **wrong** |
| Rostral columns (10 OSM nodes within 200 m) | (±85, ±15/±30/±50), (±25, ±123) | (±24, ±70), (±70, ±24), (±110, 0), (0, ±120): **all wrong** |
| Renommée / Mercure (Tuileries gate) | (+108, ∓15) | — |
| Chevaux de Marly (Champs-Élysées) | (−108, ±15) | — |
| Franchi lions (Tuileries ramps) | (+108, ±141) | — |

The cities come in pairs at the octagon's cut corners: Strasbourg with Lille at the NE, Brest with Rouen at the NW, Lyon with Marseille at the SE, Nantes with Bordeaux at the SW. The builder's note admits that only the NE inner one was surveyed.

There are 20 rostral columns in reality and OSM has 10 near the square, so the other 10 are missing from OSM. Find them with osmium on the local pbf (`man_made`/`historic`=`rostral_column`, or `artwork_type`), or mirror the 10 we have.

## Step 0: baseline shots (cheap)

`tools/shoot-landmark.sh` with `CITY=paris-centre`. Use tinyres to frame, then lowres from three views:
- from above, at 45°;
- from the Rue Royale end;
- at bike height by the Fontaine des Mers.

These shots are the before images, and they show the Gabriel palaces, the lamps and the Tuileries gate as they stand now.

## Step 1: fix the procedural layout (no GLBs needed)

1. **Position tables.** Move the positions into top-level tunable tables in `place-concorde.ts`: `CITIES`, `ROSTRAL`, `GATES`.
   - `CITIES` gets the OSM positions above, each with its name.
   - `ROSTRAL` gets the 10 OSM nodes plus the 10 missing ones.
2. **Pavilions.** Each pavilion faces the obelisk, which `city()` already handles. Check the 6 m height against IGN's MNS (lidar) layer.
3. **Octagon balustrade.** Add a low stone balustrade along the octagon's edges between pavilion pairs, breaking at the street openings. It's procedural: posts, a rail, and the coping from `gardens.ts`. Tunables: `BAL_H` 1.0 m, `BAL_POST` 0.25 m.
4. **Gate pedestals, procedural:**
   - the Tuileries gate pillars that carry Renommée and Mercure;
   - the two tall Marly pedestals at the Champs-Élysées end.

   Each gets a mount point for its GLB.
5. **Fountain figures.** `fountain()` keeps its pier, basins, water and finial. The figure loops get a flag, so a GLB replaces the stand-in when one is present, the way `paris-statues.json` `attach.to` already works.

## Step 2: GLBs

| Group | Distinct models | Instances | Photo now | Photo needed | Source |
|---|---|---|---|---|---|
| Seated cities (Pradier, Cortot…) | 8, or 3 shared at a pinch | 8 | Lyon, Marseille, Nantes, Brest, Strasbourg ✓; Rouen ✓ (busy) | **Lille** (current photo shows the wrong subject), **Bordeaux** (cropped, reads as a relief) | Modly on ml1 |
| Fleuves: river figures seated round the pier | 2 variants | 6 | whole-fountain photo only | close-up of one figure | Modly / Tripo |
| Fleuves: tritons with fish in the pool | 1 | 6 | — | close-up | Tripo |
| Fleuves: the three genii under the upper basin | 1 (the group, or one ×3) | 1–3 | — | close-up | Tripo |
| Mers: the same three groups | 4 | 15 | whole-fountain photo, cropped | close-ups | Tripo |
| Renommée on Pegasus | 1 | 1 | ✓ | — | Modly |
| Mercure on Pegasus | 1 (or Renommée mirrored) | 1 | b&w only | colour photo | Modly |
| Chevaux de Marly | 1, mirrored for the pair | 2 | ✓ (way/553416271) | — | Modly |
| Franchi lions (Tuileries ramps) | 1, mirrored | 2 | ✓ ×2 | — | Modly; optional, they belong to the Tuileries |

That comes to about **16 distinct GLBs for about 45 placed figures**. With shared models it can come down to about 11. Try a procedural stand-in first wherever Tripo is short.

Not GLB: the obelisk, the basins, the rostral columns, the pavilions, the balustrade, the lamps.

**Fountain photos.** Look in Commons' `Category:Fontaine des Fleuves (Paris)` and `Category:Fontaine des Mers (Paris)` and their subcategories for one photo per figure type; `commons_cats.py` can fetch them. Each figure gets its own folder under `assets_to_model/`, named `fontaine-des-fleuves-triton--way72937684`, `…-genie--…` and so on. Record parts=1 and the material as verdigris bronze with gilt.

## Step 3: buildings around the square

- **Gabriel palaces.** Review against the step-0 shots and against the photos on Commons. Check the colonnade bays, the pediments and the attic balustrade. If they're weak, they're the biggest visual win after the fountains, because they fill the north view.
- **Orangerie, Jeu de Paume, Pont de la Concorde.** Glance at them in the shots; only touch them if they're broken.
- **Not modelled yet, lower priority:**
  - the US Embassy on Avenue Gabriel, west of the Crillon;
  - the Hôtel de Talleyrand at Rue Saint-Florentin, east of the Marine;
  - the Rue Royale fronts, including Maxim's;
  - the Tuileries gate railing.

  None of these goes on the GLB list.

## Step 4: inventory clean-up

All of these are in `assets_to_model/`:
- Drop `fontaines-de-la-concorde--wdQ3076336`. It covers both fountains, so it duplicates Fleuves and Mers.
- Rouen's material reads bronze. All eight cities are stone, so change it to stone.
- Add the second Marly horse (way/553416270) as a reuse of the first, not a new GLB.
- In `merge.py`'s `PLACED`, add the gate and Marly statues once step 1 mounts them, so LIST.md reports them as attached.

## Order and cost

1. Step 0 shots.
2. Step 1 layout fixes: one session, no external calls.
3. City GLBs: 6 now, 2 after the new photos.
4. Gate horses.
5. Fountain close-up photos, then the fountain GLBs.
6. Gabriel palaces review.
7. Clean-up, alongside the others.
