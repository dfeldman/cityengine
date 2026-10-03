# Appearance audit — 50 places a rider notices (2026-10-02)

The owner: *"do an appearance audit. take screenshots of 50 prominent places that the user is likely to notice:
the waterfront, big buildings, buildings in parks that are far away from anything, famous buildings. Compare them
to reality and make sure they look ok. Make any needed fixes."*

**The views** are the `audit` group in `views/san-francisco.json` (50 entries, "audit 01 Ferry Building" …
"audit 50 Alcatraz from the shore"), shot with

    node --experimental-strip-types tools/views.ts --city=san-francisco --group=audit --batch=12 --page=0..4

into `docs/shots/views/san-francisco/` (contact sheets `sheet-audit-p0..p4.png`). The framing rule that works in
this city: the camera ABOVE the roofs, never beside them — 2.4 × the subject's height away (at least 300 m), at
0.9 × its height plus 0.28 × the distance, looking at 0.4 of its height. The first pass (camera 200–400 m off at
15–60 m) mostly photographed the building in front.

**A probe artefact to know about:** `__view` streams tiles round the point LOOKED AT, not round the camera; a
camera far from its subject stands over unbuilt tiles (no water, no buildings) — that is not what a rider sees.

## The places

Waterfront: Ferry Building · Pier 39 · Fisherman's Wharf · Hyde Street Pier · Aquatic Park and the Maritime
Museum · Ghirardelli Square · Fort Mason · Palace of Fine Arts · Marina Green and Crissy Field · Fort Point and the
Golden Gate · the Golden Gate from Crissy Field · Cliff House and Sutro Baths · Ocean Beach · Exploratorium ·
Oracle Park · Chase Center · the Bay Bridge west span · Alcatraz from the shore.

Big and famous buildings: Salesforce Tower · Transamerica Pyramid · Coit Tower · City Hall · War Memorial Opera
House · Main Library and Asian Art Museum · St Mary's Cathedral · Grace Cathedral · Fairmont · Palace Hotel ·
SFMOMA · Yerba Buena and Moscone · Embarcadero Center · 555 California · Millennium Tower and 181 Fremont ·
One Rincon Hill · Federal Building · Union Square · Chinatown Gate · Lombard Street · Mission Dolores · Sutro Tower
· Twin Peaks.

Buildings in parks, far from anything: Legion of Honor · Conservatory of Flowers · de Young · California Academy of
Sciences · Dutch Windmill · Beach Chalet · Stow Lake and Strawberry Hill · Presidio Main Post · Kezar Stadium.

## Found and fixed

1. **The open sea was a lawn.** Water is drawn by the tiles, so past the ring of built tiles the Pacific off Ocean
   Beach and the bay round Alcatraz were the distant GROUND, grass-coloured to the horizon. Now one flat plane at the
   sea's level under everything (render/city.ts `distantSea`); the land hides it by depth, the sea bed shows it. The
   level reaches the renderer as the index's `sea` (v3: `-datumMsl`, map/adapt.ts; v2: tiles.ts) under its own
   name — NOT as `seaLevel`, which would switch on `deckAbove` for 22 pier entries placed by the drape it falls
   back to today. That is its own change, not this one.
2. **Trees floated over the haze.** The city's shaders fog; the trees' PBR materials did not, so every distant hill
   wore a crop of dark trees over pale roofs. Babylon's own EXP fog is now on, sharing the hour's fog colour object,
   at a quarter of the shaders' density (`PBR_FOG`, render/photo.ts: PBR mixes in linear light, and at full density a
   tree 300 m off was fog-white); photo mode and the parks' air move it with the shaders'.
3. **Piers and car parks were grass.** The bake had no area rule for `man_made=pier` or a surface `amenity=parking`,
   so Pier 30-32 — a 13-acre parking deck — was a lawn with its aisles drawn on it, and every surface car park in
   the city likewise. Both are `paved` now (tools/bake.ts `areaKind`; parking added to `squaresQuery`). Re-baked.
4. **St Mary's Cathedral** (Nervi and Belluschi) was a 19 m "classical" restyle. Now `stMarysCathedral`
   (sf/st-marys.ts): four saddle-shaped shells from the corners to a glazed cross 58 m up, glass gables, the gold
   cross.
5. **The de Young Museum** was never modelled (BUGS.md #147 — the name search finds the Market Street building).
   Now `deYoungMuseum` (sf/de-young.ts): the long low copper building in three sliding bars, the cantilevered
   entrance canopy, planted courtyards, the north-east wing and the twisting 44 m Hamon Tower.
6. **Grace Cathedral** was a 53 m "classical" box. Its front is modelled on Notre-Dame de Paris, so it is the Paris
   model at 0.75 (`graceCathedral`, sf/grace.ts), the west front to Taylor Street.
7. **The Legion of Honor** had no entry at all. Now `legionOfHonor` (sf/legion.ts): the arch and colonnade screen,
   the Court of Honor with The Thinker, colonnaded wings, the portico, pediment and dome.
8. **Alcatraz**, the view from every pier, was Victorian houses and apartment blocks. Now the Main Prison
   (`alcatrazCellhouse`: pale concrete, tall barred windows, the skylight monitor) and the 1909 lighthouse
   (`alcatrazLighthouse`), the rest of the island restyled pale (alcatraz.json).
9. **Dark boxes round the piers.** A landmark's drop shadow is draped on the terrain, and under a pier on piles
   (`deckAbove`) that terrain is the sea bed: the shadow showed up through the water as a dark translucent box round
   Hyde Street Pier and the Ferry Building's floats. Piers cast no shadow now, like the `baseY` bridges
   (render/landmarks.ts).
10. **A dark saucer over the bay.** The skyline stand-ins (the far Bay Bridge, the Golden Gate, Sutro Tower) had
    their haze baked from their distance to the city's ORIGIN; the Bay Bridge's was 38 % with the city a kilometre
    nearer 90 % fogged, and Yerba Buena Island hung over the downtown skyline as a dark disc. Each stand-in is now
    fogged just before its own draw from its distance to the EYE, capped at 0.8 so the far landmarks stay readable.

## Looked at and fine

Ferry Building · Pier 39 · Fisherman's Wharf · Aquatic Park · Ghirardelli · Fort Mason's piers · Palace of Fine Arts
(dome, lagoon, colonnade) · Crissy Field · Fort Point and the Golden Gate · Cliff House · Ocean Beach (with the sea
now) · the Exploratorium's piers · Coit Tower · Transamerica · Salesforce Tower · Oracle Park · Chase Center · City
Hall (the dome, Civic Center Plaza) · the Opera House and Davies · Main Library and the Asian Art Museum · Fairmont ·
SFMOMA (the white oculus, the Snøhetta wall) · Yerba Buena Gardens · Embarcadero Center · Millennium Tower and 181
Fremont · One Rincon Hill · the Federal Building · Union Square · Lombard Street · the Conservatory of Flowers · the
Academy of Sciences (green roof) · the Dutch Windmill · Beach Chalet · Stow Lake and Strawberry Hill · the Presidio's
Main Post · Sutro Tower · Twin Peaks · Kezar Stadium · Mission Dolores.

The red wedge east of the Conservatory (view 39) is a real triangular red-roofed building, not a defect. The pale
hills in views 46-47 are the fog on the distant ground from 150 m up — a rider is never there.

## Not fixed

- ~~Alcatraz is too low~~ fixed later the same day: an `alcatraz` fine-terrain zone (BUGS.md #257). Was: **Alcatraz is too low**: its tile has only the coarse 20 m terrain, which tops the island out 11 m
  above the sea; the real one rises about 41 m to the cellhouse. The fine (z15) ground does not reach it — a bake
  change to its sampling box.
- ~~`seaLevel` at run time~~ fixed later the same day (BUGS.md #258). Was: **`seaLevel` at run time.** The index now carries the sea's level as `sea`, deliberately not as `seaLevel`, which
  would make `deckAbove` work for 22 pier entries that have been placed by the drape it silently falls back to. Turning
  it on needs those piers checked one by one (BUGS.md #258).
- ~~The historic ships~~ modelled later the same day (BUGS.md #251, sf/ships.ts).
