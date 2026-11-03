# Review: 2026-11-02-v1, Haiku (claude-haiku-5-5, effort medium), single-shot

Written by Claude (Opus) from the render sheet [sheets/haiku.jpg](sheets/haiku.jpg), on the judge's 1–5 likeness scale. It is a first look, not the owner's verdict.

## Likeness

| Likeness | Meaning |
|---|---|
| 1 | Not this building |
| 2 | Right massing, no signature features |
| 3 | Recognisable, clear errors |
| 4 | Clearly it |

| building | screen | likeness | what it built |
|---|---|---|---|
| bnf-mitterrand | 91 | **4** | Four towers at the corners of a raised deck around a sunken middle. The towers are plain boxes, not L-shaped. |
| chase-center | 94 | **4** | A banded white drum with a flat roof and a glazed entrance block. |
| madeleine | 95 | **4** | A temple with columns all round, pediments and a green roof. |
| coit-tower | 86 | 3 | A plain cylinder on a plinth. The silhouette is right; the crown openings are missing this time. |
| conservatory-of-flowers | 79 | 3 | White barrel-vaulted wings and a domed centre pavilion, set on an odd terracotta plinth slab. |
| ferry-building | 97 | 3 | A long body with a central clock tower. No arcade can be read; the walls are punched windows. |
| gare-de-lyon | 76 | 3 | A corner clock tower with a dome, a vaulted train shed and side wings. No arched front. |
| musee-orsay | 83 | 3 | A long block under a glass barrel vault, with corner pavilions. No clocks, and no arches on the river front. |
| pantheon | 96 | 3 | Cross plan, colonnaded drum and dome. A cone stands in for the lantern, the walls have windows they don't have, and the portico columns are barely visible. |
| parc-des-princes | 74 | 3 | An oval bowl ringed with ribs, the strongest signature. No pitch and no roof. |
| sacre-coeur | 83 | 3 | The main dome with a spire, and smaller domes. The base is a punched-window box. |
| asian-art-museum | 82 | 2 | A generic punched block under a hipped roof, with a token colonnade on the short front. |
| de-young | 76 | 2 | A brown slab with a short stubby tower. Not twisted and not tall. |
| centre-pompidou | 81 | 2 | A blue-roofed box and one escalator tube. No exposed frame and no ducts, which is the building's whole identity. |
| hotel-de-ville | 99 | 2 | One big hipped block. The belfry and corner pavilions are too small to read. |
| legion-of-honor | 95 | 2 | A solid box with a dome. **No court**: the U-plan and colonnades are lost; the features it has are tiny. |
| palace-of-fine-arts | 85 | 2 | An egg-shaped dome on a solid drum. It should be an open ring of columns. |
| palais-garnier | 95 | 2 | Grey boxes with a small dome and gilt corner statues. No loggia or arcade can be read. |
| sfmoma | 67 | 2 | Brick base and a plain low cylinder, under striped grey blocks. The stepped symmetry and slanted oculus are missing. |
| oracle-park | — | 1 (invalid) | One cylinder had radius 0. The rest was a sound horseshoe bowl, open to the bay, with a brick front. |

**Summary:** 11 of 20 recognisable (likeness 3 or more), mean likeness 2.65, at $0.0013 per building (2.6 cents for the set) and 9 s each.

## What it shows

- **Haiku builds coarse massing and stops.** The median answer was 9 parts, against "10–80 usual" in the prompt. The signature parts it does use are placed correctly: the BnF towers, the Madeleine peristyle, the Parc des Princes ribs, the Gare de Lyon tower and vault. It fails where the signature is an arrangement of many parts: the Legion's court, the Pompidou frame, the PoFA's open rotunda, Garnier's loggia.
- **Windows go on everything.** That includes the windowless Panthéon and Sacré-Cœur. A v2 prompt could say "only where the photos show windows".
- **The screen score is not a quality signal.** Legion (95), Hôtel de Ville (99) and Garnier (95) are all likeness 2. The feature checks pass whenever a qualifying part exists anywhere, at any size. They are a floor only; the sheets decide, as the design said.
- **The single invalid answer would have survived a repair turn** (`--attempts=2`).
