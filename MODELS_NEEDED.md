# Models needed (PARIS_EXPAND §5: flagged for the user)

Statues and sculpture that procedural geometry cannot do justice to and that riders see up close. The statues
the user has already made (`incoming_models/`, `public/landmarks/paris-statues.json`) are not listed:
- the Génie de la Liberté;
- the Cirque d'Hiver horsemen;
- Marianne and her lion;
- Henri IV, Jeanne d'Arc (Pyramides), Clemenceau, de Gaulle, Charlemagne, Étienne Marcel, Danton.

Every one of these has a PROCEDURAL STAND-IN in the city now (2026-09-22):
- `louisXIV` and `fochTrocadero` (render/landmarks/paris/equestrian.ts);
- the Alexandre III's winged horses in render/bridge-structures.ts;
- the Concorde's figures in `placeConcorde`;
- Apollo and the gilded groups in `palaisGarnier`;
- Saint Michael in `fountains.ts`;
- the Arc's groups in `arcDeTriomphe`.

A model from the user replaces a stand-in through `public/landmarks/paris-statues.json`: take its manifest entry
out, or make its builder leave the figure off.

Freestanding, at eye level or very prominent, on the main riding routes first:

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Place des Victoires (48.8656, 2.3412) | Louis XIV, equestrian, rearing | ~7 m on a 9 m plinth | the plinth is procedural; rearing horse on its hind legs |
| 1 | Place du Trocadéro (48.8627, 2.2874) | Foch, equestrian | ~6 m | faces the Eiffel Tower across the Seine |
| 1 | Pont Alexandre III pylons (48.8638, 2.3134) | the four gilded Renommées with Pegasus | ~5 m each, ×4 | now gold masses (`bridge-structures.ts`); one model, placed four times (two mirrored) |
| 2 | Concorde fountains (48.8656, 2.3211) | the seated river gods and tritons round the basins | ~2.5 m, several | would replace the bronze blocks in `placeConcorde` |
| 2 | Place de la Concorde corners | the eight seated cities (Lyon, Marseille, Bordeaux…) | ~3 m | on the corner pavilions |
| 2 | Opéra Garnier roof (48.8719, 2.3316) | Apollo with his lyre, and the two gilded Harmonie / Poésie groups | ~7 m | seen against the sky down the Avenue de l'Opéra |
| 2 | Fontaine Saint-Michel (48.8533, 2.3436) | Saint Michael slaying the devil | ~5 m | now a bronze stand-in in `fountains.ts` |
| 3 | Arc de Triomphe | the four great relief groups (La Marseillaise…) | ~12 m reliefs | high relief on the piers; could be flat textured panels instead |
| 3 | Louvre, Cour Carrée / Tuileries | Lafayette, equestrian (Cours la Reine); the Maillol bronzes in the Tuileries | ~3–5 m | low priority |

Not worth a model (procedural is enough, or too flat to gain): the Obelisk, the Colonne Vendôme's frieze, the
Buren columns, the Innocents' reliefs, the Flamme de la Liberté.

## San Francisco (SF_PLAN.md §10; user, 2026-09-22: "remember to produce a file of statues so I can create GLBs")

SF has fewer statues than Paris, and the ones it has matter: they are what a place is remembered by. Positions
are approximate (check on the map). Sizes are the figure's, and the plinth is procedural unless it says so.
Each will go in `public/landmarks/sf-statues.json` the way Paris's do.

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Letterman Digital Arts Center, Presidio (37.7987, −122.4493) | **the Yoda Fountain** (user: "amazing must-have") | Yoda ~1 m on a ~1.5 m fountain | bronze Yoda standing on a rock in a small basin, water from his feet; at the box's west edge |
| 1 | Market & Battery, Mechanics Monument plaza (37.7910, −122.3990) | the Mechanics Monument (Douglas Tilden, 1901) | ~4 m group on a ~3 m plinth | five nude men straining at a huge punch press; on the main Market route |
| 1 | Union Square (37.7880, −122.4075) | the Victory figure on the Dewey Monument | ~3 m, gilded bronze | on a 26 m granite column (procedural); trident and wreath, arms up. **The figure must be a model** (user, 2026-09-22): what is in the game now is a procedural stand-in to be replaced |
| 1 | Portsmouth Square (37.7948, −122.4056) | the Goddess of Democracy (replica, 1994) | ~3 m, bronze | torch held up in both hands; on the square's upper level |
| 1 | Chinatown, everywhere | a pair of guardian lions (foo dogs), male with ball and female with cub | ~1.2 m each on plinths | ONE model pair placed dozens of times: the Dragon Gate, the banks, the family associations |
| 2 | Civic Center, Fulton St (37.7797, −122.4163) | the Pioneer Monument (1894) | ~10 m, several groups | a big bronze column group with Eureka on top; between the Library and the Asian Art Museum |
| 2 | City Hall steps (37.7791, −122.4185) | the seated Abraham Lincoln (Haig Patigian, 1928) | ~2.5 m seated | in front of City Hall on Polk |
| 2 | St. Mary's Square (37.7918, −122.4054) | Sun Yat-sen (Beniamino Bufano, 1937) | ~4 m | a stainless-steel robe with a red granite head and hands: two-material, stylised |
| 2 | Washington Square (37.8008, −122.4102) | the Volunteer Firemen memorial (Haig Patigian, 1933) and Benjamin Franklin (1879) | ~3 m each | the firemen carrying a woman; Franklin on a drinking-fountain plinth |
| 2 | Pioneer Park, Coit Tower (37.8024, −122.4058) | Christopher Columbus (1957) | ~3.5 m bronze | in front of the tower, facing the bay |
| 2 | Transamerica Redwood Park (37.7951, −122.4027) | the "Puddle Jumpers" children and the frog fountain | ~1 m figures, several | small bronzes among the redwoods |
| 2 | Ferry Building plaza (37.7956, −122.3934) | Mahatma Gandhi (1988) | ~2.5 m bronze | walking with his staff |
| 3 | UN Plaza (37.7806, −122.4138) | Simón Bolívar, equestrian | ~5 m | check its current position |
| 3 | Chinatown (37.7930, −122.4072) | Confucius | ~3 m bronze | |

**The rule** (user, 2026-09-22: "the actual dewey monument statue top should be modeled, not generated… any
extremely prominent statues must be modeled"): a statue a rider stops and looks at gets a real model from the
user. A procedural stand-in is allowed so the place is not empty, and must be listed here so it is replaced.

**Not models: procedural, and on the plan (SF_PLAN.md §10 public art).** Cupid's Span, the Vaillancourt Fountain,
Language of the Birds, the Hearts, Lotta's Fountain, the Robert Louis Stevenson memorial (a granite shaft with a
galleon), the MLK waterfall at Yerba Buena.
