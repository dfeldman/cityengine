# Plazas and bridgeheads: where the pass stands (2026-11-16, evening)

The owner's goal: make Paris plazas and Seine bridgeheads look amazing. Rounds 7 and 8 at the end of docs/SEINE-MULTILEVEL.md record
what was done. This is the brief for picking it up.

## Tools
- `tools/site-sheet.ts`: a ring of rider-height views and a high oblique per site from one page load; `--probe=1` writes index.txt
  (mesh hits for 15 pixels per cell, written at the END of a run). About one site a minute; split a list across two processes.
- `tools/look-at.ts`: `--probeall=x,y;…` (every mesh a pixel's ray hits, with render group), `--eval=<js>`, `--without=life`.
- `tools/at-point.ts`, `tools/level-map.ts`. Review sheets with a Sonnet subagent so the images stay out of context.
- Survey lists: every Seine bridge's two heads 12 m past the ends of its outline (pkg.bridges named Pont/Passerelle/Viaduc, the
  farthest pair of ring points); sixteen plazas (Varsovie 48.8605,2.2910; Trocadéro 48.8620,2.2880; Alma 48.8645,2.3012; Résistance
  48.8620,2.3020; Concorde 48.8656,2.3212; Hôtel de Ville 48.8566,2.3522; Châtelet 48.8577,2.3470; Saint-Michel 48.8534,2.3441;
  Parvis Notre-Dame 48.8534,2.3480; Défense parvis 48.8920,2.2380; Étoile 48.8738,2.2950; Bastille 48.8532,2.3691; République
  48.8675,2.3637; Vendôme 48.8675,2.3294; Vosges 48.8556,2.3655; Italie 48.8310,2.3555).

## State
- Uncommitted. Another session edits src/render/city.ts at the same time: don't revert what you didn't write.
- paris-centre rebaked 2026-11-16 20:44 (bake 20261116T2044-ofwh) with `BDTOPO_BAND=1 --no-audit` (another session's untracked
  public/landmarks/paris/defense3.json fails audit stage 2). Backups: ~/cityengine-bake-backups/paris-centre-20261116 and -20261116b.
  Ask the owner before the next rebake (67–99 min). Mini bakes overwrite public/landmarks/paris.where.json: copy it first, restore after.

## Open, in order
1. **Pont d'Iéna right-bank head** (paris-centre local about −2985, −15). From the deck you look down into the lower quai's passage
   under the land arch beside the street decks: decks cover only the ways, and the passage lies outside the bridge outline and the deck
   top's ±hw strip (render/bridge-structures.ts). Needs a deck over passages at bridgeheads (render), or a change to the flush-deck fill
   in tools/multilevel.ts ("FLUSH deck"). Must not lay paving in the air under other bridges. Test on bir-hakeim-mini. The owner also
   called the far side of the overpass messy and asked whether an elevated walk there is right.
2. **Avenue de New York trench, north-east mouth** (48.860864, 2.291706; local −2951, 40). The left carriageway stops short of the
   portal: the mouth's short connector pieces (192674, 193002) go −0.5 → +1.4 m. Corridor shards on its banks.
3. **Plaza leftovers** (round-3 review): Varsovie's street decks over the trench beside the lid are flat deck colour; the Alma lid
   meets a bridge in a seam (Alma cell 2: lidtop:asphalt against bridges); hard dark shadow polygons at Vendôme and Concorde; a pale box
   on the pavement at Châtelet; stepped plates at the Parvis Notre-Dame.
4. Re-survey every head and plaza after each fix until a reviewer finds only camera-inside-a-model artifacts; check SF (Lombard,
   Filbert Steps, Taylor at Green, Twin Peaks) for regressions.

Done when the surveys come back clean and the owner's sites look right in medres shots: the Iéna heads, the Place de Varsovie, the
Quai Branly (48.856433, 2.28932), Port Debilly's boats (48.862981, 2.296962), and the four Neuilly and Défense banks.
