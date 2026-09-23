# Golden Gate Park & Presidio — buildings in the parks

Only a few buildings; each is a landmark people ride to. City box was just extended west to the ocean, so most
of these are NOT in the baked `public/cities/san-francisco.json` yet — footprints fetched directly from
Overpass and cached (`tools/cache/overpass-parks-manual.json`) so `tools/model-shots.ts` can still photograph
them.

## Golden Gate Park

- [x] **Conservatory of Flowers** — way/30675038. `conservatoryOfFlowers`. White Victorian glasshouse: white
  curtain-glass box with a shallow hip glass roof for the long wings, a big white-drum glass dome (`cupola`)
  standing over the centre of the ridge. Shot: docs/shots/models/parks/conservatoryOfFlowers-corner.png — reads
  well, dome centred over the long wings.
- [x] **California Academy of Sciences** — way/28695389. `californiaAcademyOfSciences`. Flat glass box, green
  living roof (the roof cap tinted green), an overhanging glass canopy (a wider inset ring one wall-height up),
  two `cupola` domes standing through the roof for the planetarium and the rainforest dome. Shot:
  docs/shots/models/parks/californiaAcademyOfSciences-corner.png.
- [x] **Japanese Tea Garden** — three small structures, each its own footprint:
  - Pagoda (way/34221099) `japaneseTeaGardenPagoda`: two-tier red/green pagoda, lower hip roof left as a
    platform (not a full pyramid, which would close to a point and strand the upper storey), upper storey,
    second pyramid roof, a green finial post. Shot: japaneseTeaGardenPagoda-corner.png.
  - South Gate (way/136888948) `japaneseTeaGardenGate`: small red box, green pyramid roof.
  - Tea House (way/34220947) `japaneseTeaGardenTeaHouse`: dark timber, green hip roof.
- [x] **Dutch Windmill** — way/287921407. `dutchWindmill`. Round brick tower (`roundRing` on the footprint),
  a small dark cap, four sails as diagonal `beam`s (golden-gate.ts) crossed near the hub — a real diagonal,
  not a wall-mounted box, so `boxAlong` could not do it. Shot: dutchWindmill-corner.png.
- [x] **Murphy Windmill** — way/287927026. `murphyWindmill`. Same construction, smaller.
- [x] **Beach Chalet** — way/28691595. `beachChalet`, `edwardian-terracotta` recipe with a red-brown hip crown
  (cream stucco, red tile roof, matches OSM's `building:colour`/`roof:colour` tags).
- [x] **Spreckels Temple of Music (Bandshell)** — way/30896932. `spreckelsTempleOfMusic`. A stone drum behind a
  `colonnade` along the front edge (`edgeFacing`/`edgeAt`), stage floor capped, no roof over the audience side
  (real building has none).
- [ ] Park Chalet — not found under that name in Overpass near the west end (only "Beach Chalet" node/way);
  the Beach Chalet building modelled above sits at the same spot and the Park Chalet is the same building's
  ocean-facing lower level, not a separate footprint. No separate row needed.
- [ ] de Young Museum — see parks-hard.md.

## Presidio

- [x] **Officers' Club** — way/32775201. `presidioOfficersClub`. White stucco box, tile hip roof, an `arcade`
  along the street-facing edge. Shot: presidioOfficersClub-street.png (arcade openings read clearly).
- [x] **Main Post barracks** — restyled (no procedural code needed for a plain row): five of the row of
  buildings around the parade ground (way/288342511, 288342516, 288342517, 288342518, 288340247, 288340248),
  `restyle: "brick"` with `height` set from OSM. The row reads as a line of red brick blocks with white trim
  once restyled; the rest of the row is plentiful and not worth separate rows for a "just a few big buildings"
  brief — Main Post itself is more courtyard than single landmark.
- [ ] Letterman Digital Arts Center — see parks-hard.md.
- [ ] Fort Point — see parks-hard.md.

## Kit gaps noticed

- A `'pyramid'` crown always closes to a single apex point — it cannot leave a flat plateau the way `'hip'`
  with the same `inset` can. Building a second storey (a pagoda's upper tier) on top of a pyramid roof floats
  it in mid-air over the closed point. Used `'hip'` instead for the pagoda's lower roof, which does leave a
  flat top. Worth a line in tower.ts's docstring for the next agent who builds a pagoda or a lookout tower.
- No dedicated "windmill sails" part — `beam` (golden-gate.ts, a private district file) is the only shared
  helper that draws an arbitrary 3D diagonal segment, and I had to import it across from `golden-gate.ts`
  rather than from `parts.ts`. If a second windmill or a ferris-wheel-shaped building comes up, `beam` is
  worth promoting to `parts.ts`.
