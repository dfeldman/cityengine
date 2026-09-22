# San Francisco, built out: a Paris-class city on the hills

The goal (user, 2026-09-22): make San Francisco "a similar vibrant bikeable world" to central Paris. The user
said it is harder in most respects:
- **the core is larger;**
- **there are many landmarks:** the skyscrapers, the convention centre, Fisherman's Wharf;
- **the plants vary far more:** deciduous street trees to palms and tree ferns;
- **the ordinary buildings vary:** Victorians, brick lofts, stucco, glass offices, where Paris was one Haussmann
  street after another;
- **it is American:** signals, far more signs, billboards and ads;
- **the streetcars** are modelled already but could be a lot better.

The method is Paris's:
1. look at what the OSM data really says;
2. infer what it doesn't say;
3. refine in passes, screenshotting each (`views/san-francisco.json`, `tools/views.ts`);
4. add landmarks in families;
5. log bugs in BUGS.md one at a time.

Code for San Francisco goes in its own files (`src/render/sf/`, `src/render/landmarks/sf/`, `src/city/sf/`).
Anything both cities have is shared ([[feedback-region-files]]). Third-party models needed go in
[MODELS_NEEDED.md](MODELS_NEEDED.md) under "San Francisco" for the user to source.

## 1. The area

The northeast of the city, about 5.6 × 4.5 km, roughly the size of paris-centre (6.7 × 3.5):
- west: the Palace of Fine Arts and the Marina;
- east: the Embarcadero and the Ferry Building;
- north: the whole north shore, Fisherman's Wharf and Aquatic Park;
- south: past Market Street, Civic Center and Alamo Square.

The origin and the start are still Nob Hill (37.7930, −122.4120), so older views and notes hold (`tools/cities.ts`).
Just outside the box, drawn on the skyline or the water: the Golden Gate Bridge, Alcatraz, the Bay Bridge's
east span, Twin Peaks and Sutro Tower.

## 2. What OSM says about the buildings (tools/building-census.ts)

About 18 900 building ways in the box. What they carry:

| tag | on | use |
|---|---|---|
| `building=yes` | 91% | tells us nothing: the type has to be inferred |
| `height` | 74% | an import with measured heights. The best signal there is: height, not levels |
| `addr:*` | 69% | an address per lot, so frontage and lot pattern are recoverable |
| `building:levels` | 9% | rare; infer from height (3.2 m a storey here, 4.5 m for a ground floor of shops) |
| `name` | 9%, `wikidata` 2% | the landmark candidates: about 440 with wikidata |
| material, colour, roof, start_date, architecture | under 0.5% each | effectively absent |

So a building's type comes from **its geometry, its place and what is inside it** — and, from the city's own
open data, **its age** (user, 2026-09-22: "if we can get construction date on buildings, we could adjust style
based on that"). DataSF's Land Use dataset carries, per parcel, `yrbuilt`, the land use (residential, mixed,
office, retail, industrial…) and the unit count, with the parcel's outline. Joined to the building by where it
stands (tools/sf-parcels.ts, cached like Overpass), the year sorts the city into its eras:
- before 1906: Victorian;
- 1906–1920: Edwardian and the post-quake rebuild;
- 1920–1945: stucco, Deco and Mediterranean;
- 1945–1975: mid-century and the redevelopment;
- after 1975: modern.

The land use says whether a building is a house, a flat block, an office or a warehouse, which is exactly what
the geometry could only guess.

### Building-type inference (the classifier, `src/city/sf/btype.ts`, run at bake)

The features, per building:
- **its size:** height; footprint area; the frontage (the side along the nearest street) and the depth;
- **its lot:** how many addresses it holds;
- **its district:** a hand-drawn map, `src/city/sf/districts.json`, covering the Financial District, SoMa,
  Chinatown, North Beach, Telegraph Hill, Russian Hill, Nob Hill, the Tenderloin, Union Square, Civic Center,
  Hayes Valley, the Western Addition, Pacific Heights, Cow Hollow, the Marina, Fisherman's Wharf, the
  Embarcadero and Rincon Hill;
- **what is inside it:** shop, amenity and office POIs at its address or inside its outline;
- **what the mapper said:** `amenity`, `building=*` and the name, when they say anything.

The archetypes, and the style each gets:

| archetype | how it is recognised | style |
|---|---|---|
| Victorian / Edwardian row house | frontage 6–10 m (the 25 ft lot), 2–4 storeys (7–14 m), residential districts | `victorian`: Italianate, Stick or Queen Anne; bay windows; painted-lady palettes |
| Marina stucco house | the Marina and Cow Hollow, 2–3 storeys, 7–12 m frontage | `stucco` (new): Mediterranean or Art Deco, a garage door at street level |
| Apartment block, 1910s–30s | footprint 250–2000 m², 4–9 storeys, residential districts and the Tenderloin | `sfapartment` (new): stucco or brick, bay windows in stacks, fire escapes, a cornice |
| Chinatown walk-up | the Chinatown district, 2–6 storeys | `chinatown` (new): balconies, colour, green tile eaves on some, shops below |
| Brick warehouse / loft | SoMa, Jackson Square, the northern waterfront, footprint over 600 m², 2–8 storeys | `brick` (existing), with loft windows |
| Pre-war downtown office | the Financial District and Union Square, 8–25 storeys, and tall with a small footprint | `classical` / `chicago` (existing): terracotta and granite |
| Glass tower | over 60 m, or over 40 m in the Financial District, SoMa or Rincon Hill | `skyscraper` (existing), plus curtain-wall variants |
| Modern concrete | Golden Gateway / Embarcadero Center and Western Addition redevelopment, 1960s–80s | `brutalist` (existing) |
| Retail box / garage | 1–2 storeys, footprint over 1500 m², or `amenity=parking` | a plain commercial front (new ground kind) |
| Pier shed | on the water along the Embarcadero | a landmark family (§4), not a style |

Tested like the Paris work: a table of known buildings with the archetype each should get (the Painted Ladies,
the Hallidie Building, a SoMa loft, a Marina house, a Chinatown block) in `tests/sf-btype.test.ts`.

## 3. The facades that do not exist yet

`victorian` exists, but the rest of SF's ordinary street does not. New styles, in `styles.json` plus the painter
(`tools/facadegen/`):
- **`stucco`:** smooth, pale, pastel; arched openings; a garage door.
- **`sfapartment`:** bay-window stacks, fire escapes.
- **`chinatown`:** balconies and a green-tile or red trim cornice.
- **a curtain-wall variant of `skyscraper`:** the Salesforce and Millennium glass rather than a punched grid.

Also:
- **Bay windows are GEOMETRY:** they break the silhouette, which is SF's single most recognisable mark.
- **Colour:** SF streets are many-coloured where Paris was one stone, so the Victorian palettes have to be wide.
- **Garage doors** as a ground kind.

## 4. Landmarks — about 100, in families

Placed and oriented from the manifest as in Paris (`public/landmarks/san-francisco.json`), each shot to verify
([[feedback-landmark-method]]).

- **Towers:** Transamerica Pyramid, Salesforce Tower, 555 California, Millennium Tower, 181 Fremont,
  Embarcadero Center ×4, Rincon Center, One Rincon Hill, Coit Tower, Sentinel (Columbus Tower), Russ Building,
  Shell Building, Pacific Telephone.
- **Civic:** City Hall (the dome), War Memorial Opera House, Davies Symphony Hall, the Asian Art Museum,
  the Public Library, the Old Mint, the Federal Building.
- **Waterfront:** the Ferry Building clock tower, Piers 1–45 with their bulkhead facades, Pier 39, the
  Exploratorium (Pier 15), Fisherman's Wharf (the crab-wheel sign), the Hyde Street Pier and its ships,
  Ghirardelli Square (the sign), the Cannery, Aquatic Park's bathhouse, Fort Mason.
- **Hills and homes:** Lombard Street's crooked block, the Painted Ladies, Haas-Lilienthal House, the Octagon
  House, the Spreckels Mansion, the Fairmont, the Mark Hopkins, the Pacific-Union Club, the Filbert Steps.
- **Churches:** Grace Cathedral, Saints Peter and Paul, Old St. Mary's, St. Mary's Cathedral, Glide.
- **Culture and commerce:** Moscone Center, SFMOMA, Yerba Buena Gardens and the Metreon, the Palace Hotel,
  the Westin St. Francis, Macy's, the Hallidie Building, Oracle Park, the Cable Car Museum, the Salesforce
  Transit Center and its rooftop park.
- **Squares:** Union Square (the Dewey Monument), Portsmouth Square, Washington Square, Alamo Square,
  Lafayette Park, Alta Plaza, Justin Herman Plaza with the Vaillancourt Fountain, and the Chinatown Dragon Gate.
- **The three icons, the priority** (user, 2026-09-22): the Golden Gate Bridge, the Bay Bridge (the west span's
  suspension towers and the east span's single tower) and Sutro Tower. Each gets a proper generator, modelled
  from reference photographs ("for big well-known structures we should use images as references"). They are
  seen from half the city, so they stand at their real positions and sizes: in the scene where they are near,
  as sky furniture beyond the far plane. Alcatraz too, on the water.

Quick restyles by kind for the hundreds more (hospitals, schools, hotels, churches), as Paris's #41 did.

## 5. Plants

SF's street trees are a mixed collection: London plane, ficus, Victorian box, brisbane box, sycamore, ginkgo,
New Zealand Christmas tree (pōhutukawa) and palms:
- Canary Island date palms on the Embarcadero and Dolores;
- Mexican fan palms;
- king palms.

Parks add Monterey cypress, eucalyptus and coast live oak. Planting follows the Paris design (a region
species mix, `plantings.ts`) with a per-district palette: palms along the Embarcadero and in the Marina. The
palms are the gap: the tree generator makes broadleaf and conifer trees, and a palm is a new form. Either
`tools/treekit` grows a palm generator, or a model is sourced (MODELS_NEEDED.md).

## 6. An American street

Shared where they are shared (Chicago and New York want them too), placed per region:
- **signals:** mast-arm and pole signals exist; add pedestrian countdown heads and the green signal cabinets;
- **signs:** street-name blades exist; add one-way signs, stop signs, speed and parking signs, the
  "Muni" stop flags and the cable-car stop signs;
- **billboards and ads:** rooftop and wall billboards, painted wall ads on brick, bus-shelter ads,
  lit signs on Market Street and in Chinatown, neon in North Beach and the Tenderloin;
- **the rest:** parking meters, newspaper boxes, fire hydrants (they exist, and SF's are white-topped), trash
  cans, BART and Muni entrances on Market, the overhead trolleybus wires.

## 7. Cable cars and streetcars

- **Cable cars:** Powell–Hyde, Powell–Mason and California Street:
  - the car itself: grip car proportions, running boards with riders standing on them, the bell, the livery;
  - the slot and rails in the street, the turntables at Powell & Market and at Hyde;
  - California's double-ended car;
  - the ride from the rider's height up the hills.
- **The F-line:** the historic streetcars (PCC cars in their many liveries, Milan Peter Witt cars) on
  Market and the Embarcadero, under their wires.
- **Muni trolleybuses** under the wires, and the buses.

## 8. More that moves

These make the world alive, as the Seine's boats did:
- on the bay: ferries to the Ferry Building, sailboats off the Marina, a container ship, the Alcatraz ferry,
  the sea lions at Pier 39;
- fog rolling in from the west.

## 9. Order of work

1. The bake at the new size, and a first look (views file, contact sheets): what is wrong at a glance.
2. Districts, then the building-type classifier, then the census of archetypes; screenshots per archetype.
3. The new facade styles and bay windows.
4. The landmark families: the skyline towers first (they are seen from everywhere), then the waterfront, then
   civic, then the rest.
5. Plants: the district palette, then palms.
6. The American street: signs, billboards.
7. Cable cars and the F-line.
8. Bay traffic and fog.

## 10. Backlog (user asks, 2026-09-22; not all at once)

- **It is a biking and running game** (user): freeways and road detail matter little. The places people go to
  exercise off the road matter a lot: waterfront promenades, park paths, stairways, trails.
- **The west, as a later phase:** Golden Gate Park ("even though it is more natural and less buildings"), the
  Presidio, Crissy Field, Lands End and Ocean Beach. This means growing the box west to about −122.511 and south
  to about 37.7635, 11 × 5.3 km, which takes in the Richmond between them. Or it could be a second city joined at
  the edge. Decide when the core is done.
- **The Lyon Street Steps** (just inside the box's west edge, at Broadway) and the Filbert and Greenwich Steps:
  stairways are where SF runs, so the run graph must include them.
- **Specific buildings the city is recognised by** — "they don't have to be architecturally famous or big tourist
  attractions, just things that make the city feel like the city":
  - the Moscone Center;
  - Salesforce Tower and the Transamerica Pyramid;
  - Fisherman's Wharf;
  - the Hilton Union Square (the 46-storey tower on O'Farrell);
  - Parc 55;
  - and the rest of the big unique buildings of that kind: the Marriott Marquis ("the jukebox"), the
    Embarcadero Center towers, the Hyatt Regency atrium, 101 California, One Maritime Plaza, the St. Regis,
    the Four Seasons, the Federal Building, the Bank of America Center (555 California).
- **The Golden Gate Bridge, the Bay Bridge and Sutro Tower:** good generators, made from reference photographs
  (§4).
- **Construction dates** from DataSF, to pick style by era (§2).
- **Salesforce Park and its gondola** (user: "it would be AMAZING if we could go up to the salesforce park… And
  the gondola!!!!"). The rooftop park on the Transit Center is about 21 m up and 450 m long. The ride graph already
  carries raised edges (bridges, the métro viaducts), so its paths can be ride edges at roof height. The way up is
  its ramps and stairs, and the gondola from Mission Street: a small funicular car, animated, which the rider can
  take as a turn — "you should be able to ride the gondola!"
- **Ride the cable cars up the steep hills** (user: "maybe even ride the streetcars up steep hills"): at a cable-car
  stop the rider can hop on, stand on the running board and be carried up Nob Hill or Russian Hill. The session
  keeps its clock but the effort is honestly zero, and the rider steps off at the top.
- **The big parks are modelled by hand** (user: "the big parks should be carefully, specifically modeled since they
  are designed as gardens. the map data won't be sufficient"). Each is laid out as its designer laid it out, from
  plans and photographs: the lawns and their edges, the paths, the planting beds, the specimen trees, the
  fountains and the buildings. That means Golden Gate Park (the Conservatory of Flowers, the Japanese Tea Garden,
  the Music Concourse, the lakes), the Presidio's Main Post, Alamo Square, Lafayette Park, Alta Plaza, Washington
  Square, Union Square, Yerba Buena Gardens and Salesforce Park. A park gets a hand-made layout file, as the
  Paris landmarks get a manifest entry.
- **Public sculptural art** (user: "sf has a lot of public sculptural art — these should be attempted if possible.
  not really as many statues like paris though"). OSM's `tourism=artwork` gives the positions; the abstract
  pieces suit procedural models: Cupid's Span, the Vaillancourt Fountain, Sea Change, Language of the Birds,
  the Hearts, and the Embarcadero's pieces.

## 11. Progress and decisions (kept current — read this first on a new session)

- 2026-09-22: the Assessor rolls are in (tools/sf-parcels.ts, 63 270 parcels in the box): year built,
  use, units, stories and construction type join each building by the parcels inside it, and the classifier
  decides by era and use first (src/city/sf/btype.ts; 19 tests). 1900 is the Assessor's "pre-1906".
- 2026-09-22: palms landed (render/palms.ts + tools/palmgen/paint.py; ?palms=1 and tools/palm-shots.ts). There
  are Canary Island date palms and Mexican fan palms, textured frond cards, three levels of detail. SF's flora is
  render/sf/flora.ts: palms by district, 85% of plantings on the Embarcadero.
- 2026-09-22: the box grown to about 5.6 × 4.5 km and rebaked. The census tool is written, and the findings are
  in §2.
