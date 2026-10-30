# Paris to San Francisco parity

What Paris needs to stand beside San Francisco. Written 2026-10-29 from a survey of the code and data. The owner's
framing:

> "Paris has few public parks, few skyscrapers or highrises, and little surface public transit so those parts are
> unnecessary. But there are a bunch of unique buildings in the box that are presently unmodeled."

> "paris does have different plants, cars, outfits on NPCs, surfaces, and most of all generic buildings. we should
> probably expand the box in Paris to include a bit more, maybe some hillscapes."

So: no parks programme, no towers, no surface-transit network (the Métro, RER and boats Paris already has are
enough). The work is the **generic buildings**, a **bigger box with hills**, the **city's own plants, cars,
clothes and surfaces**, and the **unmodelled landmarks**.

The plan of record for the box itself is [PARIS_EXPAND.md](PARIS_EXPAND.md) (its §8 is the progress log); the
ranked landmark ledger is [docs/landmarks/paris-centre.txt](docs/landmarks/paris-centre.txt).

## Where Paris stands

| | Paris (`paris-centre`) | San Francisco |
|---|---|---|
| box | 6.7 × 3.5 km, ~23 km² (lon 2.286–2.378, lat 48.845–48.876) | 17.6 × 13.8 km, mostly water |
| tiles | 1,539 | 9,206 |
| bake | 2026-09-22 (bake 20261014T2238), legacy inline terrain: no `terrain.bin`, no `datumMsl`, no per-tile terrain | current pipeline |
| `live` | false (tools/cities.ts) | true |
| landmark builders | 45 files in `src/render/landmarks/paris/`; 70 entries in `public/landmarks/paris.json` | 271 files; ~2,600 entries across 134 manifests |
| statues / fountains / info cards | 12 / 6 / 46 | 89 statues |
| bridges | 26 designs (`PARIS_BRIDGES`) | — |

`paris-marais` has a spec in tools/cities.ts but no bake on disk (BUGS.md's "433 tiles still on disk" is stale).

Because the bake is on the old terrain format, **any expansion is a re-bake on the current pipeline anyway**; do
the box change and the re-bake together.

## The owner's notes from street view (2026-10-29)

> "Paris has a lot more mature deciduous trees, cyclists, bus stops, very large distinctive street signs. Overall
> think it should be much easier than SF since there are few unique buildings (mostly churches and government
> buildings)"

> "Essentially every building is cream, with an exception maybe once every few blocks. The street furniture and
> sidewalk cafes are distinctive" — "There is some variation between modern cream hausmann-ish facades and real
> original ones" — "We can get that from construction date" — "Most of the others are brick with a cream first floor"

> "The real exceptions are civic buildings. Museums schools hospitals libraries government offices"

### The street-view checklist (owner, 2026-10-29) — tick as done, check each in the city

- [x] bus stops: Foster's abribus where OSM says `shelter=yes`, RATP's post elsewhere
- [x] far more pedestrians ("30 on a random block … more pedestrians than cars"): crowd ×3 (to be counted on a block)
- [x] more cyclists (×1.6); trams T2/T3a/T3b (Citadis, already); the funicular; the Métro to 15 stations
- [x] road paint: the axis line only; yellow zigzags at bus stops; the white damier across big signalled crossings
- [x] Haussmann fronts varied: balcony schemes, railings at almost every window, hoods, window surrounds, consoles,
      modillions under the cornice, painted carriage doors, plants on some sills, the cream's own shade, rustication
      grooves on the lower storeys, bow windows and single balconies on the richer fronts
- [x] seven levels by default (the ground, five, the mansard)
- [ ] wall-to-wall: no gap between buildings (check in the city: the cadastre footprints touch)
- [ ] the traffic circles, all of them (done: found from OSM's junction=roundabout rings at bake) — and a MONUMENT in
      the middle of most ("so many monuments that many aren't even named"): a generic statue, column or fountain
      (render/paris/roundabout-monuments.ts, built; the city index carries the roundabouts from the 2026-10-29 night
      bake — check Nation and Place d'Italie, which the ring test rejected)
- [x] the wayfinding signs: white arrow panels with blue lettering, 2–4 on a grey post, at the big junctions only
- [x] two-wheelers parked in rows along the kerb (scooters, motorbikes): OSM motorcycle_parking, from the night bake
- [x] parking bays marked in dashes along the kerb, most with a car in: where the baked carriageway leaves room beside
      the traffic lane (the left kerb of one-way streets from 5.6 m, both kerbs of two-way from 11.6 m — ~85 of ~450 km;
      most rues are baked one lane wide, 3.4 m, and have none)
- [x] bollards along most pavements ("paris has them very commonly"): all narrow pavements down to 0.5 m, corners
      and runs on the broad ones
- [x] a map jump: out of look-around first, the rider held with a loading banner until the landing's tiles are in
- [ ] cobblestone (`surface=sett`) — check how much shows; some pavements red-tinted
- [ ] food and craft stands (the bouquinistes are done on their quays)
- [ ] La Défense's towers (inside the box's north-west corner now) and the Grande Arche
- [x] street lamps: rarer and different — the tall dark lanterns on the boulevards only (parisLamp), the walls' lamps elsewhere
- [x] the Métro's "M" totem by every entrance (the stairs down are hard to see; the totem is what you see)
- [x] the low black barriers (the Saint-Andrew's-cross panels) along the kerb from the corners, between the bollards,
      to keep people crossing at the crossings
- [ ] the decorated métro viaducts (Lines 2 and 6: the lattice girders, the stone piers, the city's arms) — check

So the generic building is ONE colour family (cream limestone), told apart by AGE, not by palette; what breaks the
cream is the CIVIC building — museums, schools, hospitals, libraries, government offices (OSM `amenity=school|
hospital|library|townhall`, `tourism=museum`, `office=government`, `building=school|hospital|government|civic`),
which get their own treatment (brick and stone schools, glass and concrete hospitals, the ministries' classical
stone).

> "I'm not sure there is a single unique building that's a mere private office building or apartment in central
> Paris - there are when you get outside the central area of course"

So inside the old core (roughly the 1st–8th and the Marais) a private building is never a landmark: the generic
grammar is the whole job there. Further out — the Front de Seine towers and Beaugrenelle, Montparnasse, the 13th's
towers, the edges of the box in Boulogne and Levallois — modern private buildings do stand out, and are worth a look
building by building (Mapillary, as SF). By age:

| period (APUR `c_perconst`) | what it is | how it reads |
|---|---|---|
| before 1800, 1801–1850 | faubourg and Marais houses | plastered, narrower bays, shutters, steeper slate roof (`marais`) |
| 1851–1914 | Haussmann proper | cut stone, the 2nd- and 5th-floor balconies, zinc mansard (`haussmann`) |
| 1915–1939 | interwar, the HBM rings | **brick above a cream stone ground floor** |
| 1940 on | post-war and modern | cream render or stone cladding "Haussmann-ish": flat fronts, regular windows, no mansard, continuous balconies of a newer kind |

OSM has a `start_date` on only 4,804 of the box's 130,970 buildings (3.7%), so the age has to come from **APUR's
building layer** ("Emprise bâtie", field `c_perconst`, every building in Paris) — and the national **BDNB** for the
suburbs inside the box (Boulogne, Neuilly, Levallois, Montrouge…). That is a bake input, like SF's Assessor records.

**Mapillary, as SF** (owner: "use Mapillary like we did in SF for individual buildings"): the SF pipeline
(docs/APPEARANCE-RESEARCH.md, tools/appearance/) is paused — it reads awnings, balconies and fire escapes at 95–97% but
style and exact colour at ~60%, and its biggest error is WHICH building a frame shows. Paris needs it less: APUR dates
every front, and the core is one grammar. So the Paris pass is aimed where APUR leaves a question: the post-war and outer
buildings (the 13th's towers, the Front de Seine, Boulogne and Levallois at the box's edges), and the features it reads
well (balcony schemes, awnings, a front's ground floor). After the façade grammar has its Paris vocabulary, not before.

Done 2026-10-29: the box grown to ~123 km² with the whole Bois de Boulogne; Paris trees (planes first, mature:
12–20 m on the streets, 14–22 m in the parks), Paris traffic (hatchbacks and small vans, black and white taxis with
the roof sign, white police, green-and-white buses), more cyclists (×1.6), darker clothes with coats.

> "There are a whole lot of train stations, with their trains"

The grown box takes in all seven great termini and their approaches — Saint-Lazare, the Gare du Nord, the Gare de
l'Est, the Gare de Lyon, Austerlitz, Bercy, Montparnasse — each a landmark (the train shed, the front, the clock
tower of the Gare de Lyon) with a fan of open tracks behind it running for kilometres (the Saint-Lazare trench under
the Pont de l'Europe, the Nord and Est throats at La Chapelle, the Lyon and Austerlitz viaducts). The rail already
draws (the bake found 2,622 railways); the trains want their stock: TGV and Ouigo (double-deck), Transilien and the
RER's double-deckers (only the Z 2N is in `render/paris/trains.ts`), the TER, the Eurostar at the Nord. And the
stations need trains standing at the platforms, not only passing.

## 1. Generic buildings (the owner's first priority)

Paris already has its own palettes, shop names, porte cochère, awnings, chimneys, dormers, terracotta pots and three
generic styles (`haussmann`, `marais`, `classical`, plus the `vosges` and `opera` restyles). What SF has and Paris
lacks:

- [ ] **A classifier.** `classifierFor` knows only SF (`src/city/sf/btype.ts`, `classifySF`, 442 lines). Paris
      needs its own: Haussmannian immeuble (the bulk of the box), pre-Haussmann faubourg house, Marais hôtel
      particulier, 17th–18th c. stone, Belle Époque, 1930s brick (HBM, on the boulevards des Maréchaux if the box
      reaches them), post-war slab, modern infill. OSM gives `building:levels`, `roof:shape`, `start_date` here and
      there; the Paris open data's building-age layer (APUR / "BDTOPO", to check) would give the rest.
- [ ] **The Haussmann grammar, in full.** The type the eye judges Paris by: rez-de-chaussée and entresol in rusticated
      stone, the 2nd floor's continuous balcony (étage noble), the 5th floor's second balcony, the zinc mansard
      with lucarnes and the chimney stacks on the party walls, the cut corner (pan coupé) at junctions, the
      repeated cornice line along a street. Check how much of this the `haussmann` style already says.
- [ ] **Appearance data.** SF has 85,694 street-photo rows (`public/appearance/imputed.json`) and the Assessor's
      records; Paris has nothing. Decide the source (street photos via Mapillary, as SF; the Paris "PLU" heritage
      layer) before building the pipeline.
- [ ] **Shopfronts at street level**: boulangerie, café-tabac (the red carrot sign), pharmacie (green cross), the
      brasserie's terrace under its awning. Shop names exist; check what is drawn.
- [ ] **Quick landmarks.** Buildings with no entry get dressed by kind (`render/prepare.ts` QUICK,
      `render/quickmarks.ts`): churches get classical dress and a generic bell tower. Most Paris churches are
      Gothic or Baroque, so a Paris church quickmark (buttresses, a rose window, a flèche) would lift dozens at once.

## 2. A bigger box, with hills

The terrain grid already covers all of these (x ±6,740 m, z ±5,100 m around the centre, 20 m step, from the global
terrarium tiles, `tools/bake.ts:1840`), so the box can grow without a new elevation source.

| hill | from the box edge | height in the grid* |
|---|---|---|
| Montmartre (Sacré-Cœur) | ~1.2 km N (the foot of the butte at Clichy / Rochechouart ~0.8 km) | 91 |
| Buttes-Chaumont | ~0.55 km N, ~0.35 km E of the NE corner | 31 |
| Parc de Belleville | ~0.5 km E | 50 |
| Ménilmontant | ~0.7 km E | 37 |
| Père-Lachaise | ~1.1 km E | 53 |
| Rue du Télégraphe (summit of Belleville) | ~1.6 km E | 95 |
| Montagne Sainte-Geneviève | already inside; the Panthéon is 0.13 km from the south edge, its south slope 0.3–0.5 km out | 33 |

\* the grid's datum is not stated and is not MSL (the Seine at the Concorde reads −3.9).

- [ ] **Push the north edge to take in Montmartre** (~+1.5 km): the one real hill, the funicular, the stairs (SF's
      `stairways` machinery), Sacré-Cœur, the Moulin Rouge and Pigalle. Just past today's north edge already: Saint-
      Augustin, Gare Saint-Lazare, Notre-Dame-de-Lorette, La Trinité.
- [ ] **Push the north-east corner to take in Belleville / Buttes-Chaumont** (~+1 km E and N): the park's cliff and
      temple, the Belleville slopes, the view back over the city from the Parc de Belleville.
- [ ] **Push the south edge ~0.5 km**: the rest of the Montagne Sainte-Geneviève (rue Mouffetard), and the Panthéon
      stops being an edge object.
- [ ] **Fine elevation.** The fine lidar is USGS 3DEP only (`tools/lidar/ept.py`). For Montmartre's stairs and
      Belleville's streets, IGN's RGE ALTI (1 m, open) or LiDAR HD would be the French equivalent; the 20 m grid will
      round the butte off.
- [ ] Mind the cost: the box is 23 km²; the four pushes above roughly double it. Check tile count and load time
      against SF's before committing to all of them.

## 3. The city's own plants, cars, clothes and surfaces

Each of these falls back to the SF/US default today.

- [ ] **Trees.** `render/region-kits.ts` gives `paris` only `stock` and `fleet`; only SF has `flora`. Paris gets
      `DEFAULT_FLORA` (maple, birch, ash, beech). It needs **London planes** (most of the boulevards and quais),
      **horse chestnuts**, **limes**, the clipped alignments of the Tuileries and the Palais-Royal, and the
      **Paris tree grille** round each trunk. The comment in `render/flora.ts` points at a `render/paris/flora.ts`
      that does not exist. Street-tree data: Paris's open "Les arbres" dataset (~200,000 trees, species and
      position) is the counterpart of `'datasf'`; `streetTrees` can only be `'datasf'` today. No planting zones
      either (`data/zones/` has only san-francisco.json), so Paris uses the old scatter rules
      (`city/plantings.ts:255`).
- [ ] **Cars.** `render/street-fleet.ts` has one global `MIX` with no region hook: US pickups and US police cars.
      Paris wants small hatchbacks and city cars, scooters and mopeds, Renault/Peugeot-shaped vans, the G7 taxi
      (black or white with the roof light, not yellow), the white-and-blue police van, the RATP bus livery (green
      and white, today's buses are hard-coded Muni silver and red). Paris's rail and boat stock already exist
      (`render/paris/trains.ts`, `render/paris/boats.ts`).
- [ ] **Clothes.** `render/crowd-baked.ts` has one `CITY_WARDROBE` and `cityClothes()`, with no region key. Paris: darker
      and more tailored, coats and scarves, fewer shorts and team shirts.
- [ ] **Surfaces.** `city/pavement.ts` sets pavement by width only. Paris's region entry has `crossings: bands` and
      one `pavedSquares` entry (Trocadéro), and none of SF's `streetWidths`, `streetPaint`, `brickStreets`,
      `stripedStreets`, `touristStrips`, `centreLine`. Paris wants:
      - **pavés** (granite setts) where OSM says `surface=sett`: the quais' lower banks, the Place de la Concorde's
        edges, Montmartre, the Marais's old lanes; the ride now feels them (sim/ride.ts `SURFACE_TOP`);
      - asphalt pavements with the **granite kerb** and the gutter (caniveau), the **cast-iron tree grilles**, the
        Place's stone paving;
      - the **bus and bike lanes** in their paint (green-tinted bike lanes, the "BUS" lettering), the dashed edge
        lines, the Paris pedestrian crossing (`bands` is there).
      The road textures (`public/roads/`, including cobblestone) are shared by every city already.
- [ ] Street furniture is already Paris's own (wall lamps, bollards, Guimard entrances, Wallace fountains, Morris
      columns, kiosks, blue plaques, Vélib). Nothing to do beyond what the expansion adds (Montmartre's lamps,
      the funicular).

## 4. Unmodelled landmarks in today's box

From the ledger, against the manifests (by OSM id, and within 80 m of a modelled entry). About 2,480 heritage,
wikidata or worship buildings in the box are unmatched; many are Marais hôtels the `Hôtel …` name restyle already
dresses in stone. The top thirty by prominence:

1. Église Saint-Roch, way/42722202 (ledger #2)
2. Palais du Luxembourg, relation/975955, with the Fontaine Médicis node/782601793 and the Musée du Luxembourg
   way/170226810
3. Porte Saint-Denis, relation/3170072
4. Porte Saint-Martin, relation/3178897
5. Saint-Sulpice, way/16077204
6. Saint-Germain-des-Prés, way/62287173
7. Saint-Eustache, way/53762963 (4,207 m²)
8. Saint-Germain-l'Auxerrois, way/53770908, and its belfry way/200452261
9. **Panthéon**, way/16407465: only a skyline stand-in today (`pantheon.ts`, five primitives)
10. Saint-Étienne-du-Mont, way/55343672
11. Saint-Séverin, way/19740659
12. Arc de Triomphe du Carrousel, way/227483542
13. **Hôtel des Invalides**, relation/1463538 (49,870 m²; only the Dôme is modelled), with Saint-Louis-des-Invalides
    way/64955027
14. Palais Bourbon, relation/1019368 (portico only), with the Hôtel de Lassay way/175448743
15. Palais de l'Élysée, relation/1060803 (= Hôtel d'Évreux relation/542353)
16. Ministère des Affaires étrangères, Quai d'Orsay, way/448794899
17. Tribunal de commerce (the dome on the Île de la Cité), way/53601032
18. Basilique Sainte-Clotilde, way/64952290
19. Saint-François-Xavier, way/68893289
20. Saint-Nicolas-des-Champs, way/56290843
21. Notre-Dame-des-Victoires, way/54661742
22. Odéon, way/338641511
23. Opéra-Comique, way/54572719
24. Palais Brongniart (the Bourse), way/54657155
25. Banque de France, relation/541080 (20,889 m², no wikidata tag), with BnF Richelieu relation/545655 and the Galerie
    Vivienne relation/546789
26. Musée de l'Orangerie way/54188996 and the Jeu de Paume way/54188994
27. Palais de Tokyo way/79219351 and the Musée d'Art Moderne way/79219308; the Palais d'Iéna way/79657345; the Musée
    Guimet way/79641993
28. Hôtel Biron (Musée Rodin) way/68568682; Palais de la Légion d'Honneur relation/1002192
29. Chapelle expiatoire way/67557301; Grande Synagogue de la Victoire way/69363730
30. Carreau du Temple way/30612670, Bibliothèque de l'Arsenal way/56217774, Musée de Cluny way/56640163, Hôpital
    Saint-Louis relation/10714750, Bon Marché relation/10166422, BHV way/29168869

Not checked: whether the 80 m test marks a neighbour of a modelled building as covered when it is not.

### …and the palaces and monuments, wherever they are in the box

> "We should do the palace and monuments tho"

The custom work stays in the core for ordinary buildings, but not for PALACES and MONUMENTS: those get modelled
anywhere in the grown box. Newly inside it: Sacré-Cœur and the Saint-Pierre de Montmartre, the Moulin de la Galette;
the Lion de Belfort at Denfert-Rochereau and the Observatoire; the Triomphe de la République at the Nation; the Grande
Mosquée; the Buttes-Chaumont's Temple de la Sibylle; the Bois de Boulogne's Pré Catelan, the Bagatelle's château and
the Fondation Louis Vuitton; the Palais des Congrès at the Porte Maillot; the Cité universitaire's houses. In the
core, still to do: the Palais du Luxembourg (and its Médicis fountain), the Élysée, the Palais Bourbon in full, the
Invalides in full, the Panthéon in full, the Portes Saint-Denis and Saint-Martin, the Arc du Carrousel (§4).

### The landmark programme, by family (2026-10-29)

> "carefully prioritize which landmarks you do. prominent, unusual, and important are different axes. But all train
> stations, museums, palaces, major government buildings should be done as they are usually all 3. Also large monuments
> like the Arc d'Triomphe. Things someone would actually notice when they bike by."

Each family has its own folder (`src/render/landmarks/paris/<family>/`) and manifest (`public/landmarks/paris/<family>.json`),
worked by at most four agents at a time. In order within each:

- **Stations** (all): Gare du Nord, Gare de l'Est, Saint-Lazare, Gare de Lyon (and its clock tower), Austerlitz,
  Montparnasse, Bercy — the fronts and the sheds; the platforms with trains standing (with the stock: render/paris/trains.ts).
- **Palaces and government** (all): the Palais du Luxembourg (the Senate) with its garden front and the Médicis fountain;
  the Hôtel des Invalides in full; the Palais Bourbon in full; the Élysée; the Hôtel Matignon; the Quai d'Orsay ministry;
  the Ministry of Finance at Bercy; the Banque de France; the Palais-Royal and the Conseil d'État; the Palais Brongniart; the
  Palais de la Légion d'Honneur; the Palais de Tokyo.
- **Museums** (all): the Orangerie and the Jeu de Paume; the Musée Rodin; Cluny; the Musée Picasso; the Quai Branly; the
  Grande Galerie de l'Évolution; the Arts et Métiers; the Institut du monde arabe; the Fondation Louis Vuitton; Guimet and the
  Musée d'Art Moderne; the Cité des Sciences and the Philharmonie at La Villette; the BnF François-Mitterrand. (Done: the
  Louvre, Orsay, the Grand and Petit Palais, Pompidou, Carnavalet's court.)
- **Monuments and churches**: Sacré-Cœur; the Panthéon in full; the Arc du Carrousel; the Portes Saint-Denis and
  Saint-Martin; the Triomphe de la République at the Nation; the Lion de Belfort; the Tour Montparnasse as a model (it is
  inside the box now); then the churches a rider sees: Saint-Sulpice, Saint-Eustache, Saint-Germain-des-Prés, Saint-Roch,
  Saint-Germain-l'Auxerrois, Saint-Étienne-du-Mont, La Trinité, Saint-Augustin, Sainte-Clotilde; the Grande Mosquée.
- **Sports venues and the parks' structures**: the Parc des Princes; Roland-Garros's courts; the Accor Arena at Bercy; the
  Stade Charléty; the Stade Jean-Bouin; the Buttes-Chaumont's temple and cliffs; the Bois's Pré Catelan and Bagatelle.

## 5. Already planned (PARIS_EXPAND.md §8)

The progress log's own next steps, still open: the Step 3 ride-graph overrides (Étoile, Concorde, Trocadéro, Opéra,
Châtelet, Saint-Michel), Bir-Hakeim's Métro deck and the Alexandre III arch (BUGS #37), box hedges for the formal
gardens. Statue priorities are in MODELS_NEEDED.md (Louis XIV, Foch, the Alexandre III Renommées, the Concorde
figures, Garnier's Apollo, Saint Michael).

## Suggested order

1. Box and re-bake together (§2): the bake has to move to the current pipeline anyway, and every later step is judged
   in the bigger box.
2. Generic buildings (§1): the classifier and the Haussmann grammar.
3. Trees and the street-tree register (§3), then cars, clothes, surfaces.
4. Landmarks (§4) from the top, with Montmartre's own (Sacré-Cœur, the funicular, the Moulin Rouge) once the box
   takes it in.
