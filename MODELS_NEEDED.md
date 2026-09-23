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

**Most sculpture in San Francisco is ON a building, and that is not this list** (user, 2026-09-22: "most are
in/on buildings"). A figure in a niche, a pediment group, the caryatids on a bank, the reliefs over a theatre
door, a clock held up by bronze figures, the eagles on a cornice — all of those belong to the BUILDING'S OWN
BUILDER, where they can be placed against the wall they sit on and share its stone. Putting them in a statue
manifest would place them in mid-air beside the building. If a building's sculpture is what makes it
recognisable, say so in that building's note and let its builder carry it.

This list is only what stands on its OWN GROUND.

**What qualifies** (user, 2026-09-22): **freestanding and visible from the street.** A figure standing on its
own plinth, on a column, or on the ground. NOT a figure built into a fountain or a wall — those cannot be
modelled separately from the thing they are part of, so they stay procedural. Where a figure stands clear
ABOVE a basin it still counts, because the figure can be made on its own and the basin drawn under it; those
are marked *(basin procedural)*.

### Downtown and the waterfront

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Union Square (37.7880, −122.4075) | the Victory figure on the **Dewey Monument** | ~3 m gilded bronze | on a 26 m granite column (procedural); trident and wreath, arms up. **The figure must be a model** (user): what is in the game is a stand-in to be replaced |
| 1 | Market & Battery (37.7910, −122.3990) | the **Mechanics Monument** (Tilden, 1901) | ~4 m group on a ~3 m plinth | five nude men straining at a punch press; on the main Market route |
| 1 | Oracle Park, 24 Willie Mays Plaza (37.7785, −122.3893) | **Willie Mays** | ~3 m bronze | at the park's main gate, on the Embarcadero ride; the most photographed statue in the city |
| 2 | McCovey Point, across the channel (37.7765, −122.3876) | **Willie McCovey** | ~3 m bronze | seen from the bridge and the promenade |
| 2 | Ferry Building plaza (37.7956, −122.3934) | **Mahatma Gandhi** (1988) | ~2.5 m bronze | walking with his staff |
| 2 | Embarcadero at Pier 40 / Rincon (37.7757, −122.3874) | **Sea Change** (Mark di Suvero) | ~20 m painted steel | huge red abstract; a landmark of the waterfront ride |
| 2 | Market/Montgomery/Post (37.7889, −122.4022) | **Admission Day (Native Sons) Monument** | ~2.5 m figure on a column | bronze figure with a flag on a granite shaft |
| 3 | City Hall steps, Polk St (37.7791, −122.4185) | seated **Abraham Lincoln** (Patigian, 1928) | ~2.5 m seated | |
| 3 | Civic Center, Fulton St (37.7797, −122.4163) | the **Pioneer Monument** (1894) | ~10 m, several groups | column group with Eureka on top |
| 3 | UN Plaza (37.7806, −122.4138) | **Simón Bolívar**, equestrian | ~5 m | check its current position |
| 3 | Nob Hill, Fairmont forecourt (37.7924, −122.4102) | **Tony Bennett** (2016) | ~2.5 m bronze | on the pavement at California and Mason, on the cable car line |

### Chinatown, Portsmouth Square, North Beach

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Chinatown, everywhere | a pair of **guardian lions** (foo dogs), male with ball, female with cub | ~1.2 m each on plinths | ONE model pair placed dozens of times: the Dragon Gate, the banks, the family associations. Highest value per model in the city |
| 1 | Portsmouth Square (37.7948, −122.4056) | the **Goddess of Democracy** (replica, 1994) | ~3 m bronze | torch in both hands, on the upper level |
| 2 | St. Mary's Square (37.7918, −122.4054) | **Sun Yat-sen** (Bufano, 1937) | ~4 m | stainless-steel robe with a red granite head and hands: two materials, stylised |
| 2 | Washington Square (37.8008, −122.4102) | the **Volunteer Firemen memorial** (Patigian, 1933) | ~3 m | firemen carrying a woman |
| 3 | Washington Square (37.8007, −122.4103) | **Benjamin Franklin** (1879) | ~2.5 m | stands on a drinking-fountain plinth *(basin procedural)* |
| 3 | Pioneer Park, below Coit Tower (37.8024, −122.4058) | **Christopher Columbus** (1957) | ~3.5 m bronze | removed in 2020 — model only if the city is set before then; say so in its entry |
| — | ~~Chinatown~~ | ~~**Confucius**~~ | — | **DOES NOT EXIST.** Checked 2026-09-22 while gathering reference photographs: there is no Confucius statue in San Francisco. The St. Mary's Square location given for it holds Bufano's Sun Yat-sen, already row 2 above. Confucius statues exist in San Jose and New York. Struck rather than deleted so nobody adds it back. |

### Golden Gate Park — the Music Concourse and the drives

The park's statues are scattered along the drives and the Concourse, all freestanding on plinths, all passed
at riding speed. Several are busts, which are cheap models and read well close up.

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Music Concourse (37.7702, −122.4682) | **Cervantes with Don Quixote and Sancho Panza** (1916) | ~4 m group | the two kneeling figures below the bust; the Concourse's best-known piece |
| 1 | Japanese Tea Garden (37.7704, −122.4700) | the **Great Buddha** (bronze, 1790) | ~3 m seated | the oldest bronze Buddha outside Japan; seated on a tiered base |
| 2 | Music Concourse, east end (37.7706, −122.4675) | **Goethe and Schiller** (1901) | ~3.5 m pair | two standing figures sharing a wreath |
| 2 | Music Concourse (37.7705, −122.4679) | **Giuseppe Verdi** monument (1914) | ~5 m with figures | bust high on a column with allegorical figures below |
| 2 | Outside the de Young (37.7715, −122.4686) | the two **sphinxes** (Arthur Putnam) | ~2 m each, ×2 | one model placed twice; flanking the old entrance |
| 2 | JFK Drive, near the Conservatory (37.7726, −122.4600) | **Robert Burns** (1908) | ~2.5 m | standing, on a plinth beside the drive |
| 3 | Music Concourse (37.7703, −122.4684) | **Beethoven** bust (1915) | ~1 m bust on a plinth | |
| 3 | GGP, near the Conservatory (37.7724, −122.4606) | **Thomas Starr King** | ~2.5 m | |
| 3 | GGP, JFK Drive (37.7718, −122.4650) | **General Pershing** (1922) | ~3 m | |
| 3 | GGP, near the Concourse (37.7708, −122.4670) | **Ulysses S. Grant** bust | ~1 m bust | |
| 3 | GGP (37.7712, −122.4712) | the **Apple Cider Press** (Tilden, 1894) | ~2.5 m | a man straining at a press; freestanding on a low base |
| 3 | GGP, near the Concourse (37.7700, −122.4690) | the **Roman Gladiator** (1881) | ~2.5 m | |

### The Presidio, the bridge and the western shore

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 1 | Letterman Digital Arts Center (37.7987, −122.4493) | the **Yoda Fountain** (user: "amazing must-have") | Yoda ~1 m | bronze Yoda standing clear on a column above the basin *(basin procedural)* — the figure models on its own |
| 1 | Golden Gate Bridge, south approach (37.8079, −122.4750) | **Joseph Strauss** (1941) | ~2.5 m | at the toll plaza, passed by every rider crossing the bridge |
| 2 | Vista Point / bridge approach (37.8073, −122.4753) | the **Lone Sailor** (1995) | ~2.5 m | standing sailor with a seabag, looking out |
| 2 | Lincoln Park, Legion of Honor forecourt (37.7845, −122.5008) | Rodin's **The Thinker** (cast) | ~2 m on a plinth | in the courtyard, seen through the arch from the drive |
| 2 | Lands End, above the Legion (37.7840, −122.5006) | the **Holocaust Memorial** (George Segal, 1984) | ~1.8 m figures, several | white figures behind a wire fence; startling and instantly recognisable |
| 3 | Sutro Heights Park (37.7797, −122.5138) | the park's **lions and garden statues** | ~1.5 m each | at the old entrance; just outside the box's west edge — include when the box reaches Ocean Beach |

### Elsewhere in the city

| Priority | Where | What | Size | Notes |
|---|---|---|---|---|
| 2 | Dolores Park, upper corner (37.7597, −122.4270) | **Miguel Hidalgo** (1962) | ~3 m bronze | on the hill with the city behind it |
| 2 | Ghirardelli Square (37.8058, −122.4230) | Ruth Asawa's **mermaids** (1968) | ~1.2 m figures | two mermaids and sea turtles over the basin *(basin procedural)* — user will model |
| 2 | Transamerica Redwood Park (37.7951, −122.4027) | the **frog fountain** and the "Puddle Jumpers" children | ~1 m figures, several | small bronzes among the redwoods *(basin procedural)* — user will model |
| 3 | Around the city | **Bufano's animals** — the bears, the penguins, St Francis | ~1.5 m each | rounded stylised stone; several around the city, one model each, placed where they stand |

**The rule** (user, 2026-09-22: "the actual dewey monument statue top should be modeled, not generated… any
extremely prominent statues must be modeled"): a statue a rider stops and looks at gets a real model from the
user. A procedural stand-in is allowed so the place is not empty, and must be listed here so it is replaced.

**Done procedurally** (2026-09-22, `src/render/landmarks/sf/art.ts`, manifest `public/landmarks/san-francisco/art.json`;
notes in `docs/sf-batches/art.md`): freestanding fountains and art that cannot be modelled as a separate figure —
the **Vaillancourt Fountain** (`vaillancourtFountain`), **Lotta's Fountain** (`lottasFountain`), **Cupid's Span**
(`cupidsSpan`), the **MLK memorial waterfall** at Yerba Buena (`mlkWaterfall`), **Hearts in San Francisco**
(`heartsInSanFrancisco` — one model, several placements; colour is NOT yet parameterised per instance, see the
batch notes), **Language of the Birds** (`languageOfTheBirds`), the **Francis Scott Key monument**'s canopy only
(`francisScottKeyCanopy` — the figure itself is still a real model, listed above), and the **Robert Louis
Stevenson memorial** (`stevensonMemorial`). The **Ghirardelli mermaid fountain** and the **Transamerica Redwood
Park frog fountain/Puddle Jumpers** got basins only (`asawaMermaidFountain`, `redwoodParkBronzes`) — their
figures are listed above as the user's own models, per the rows in "Elsewhere in the city".

