# devmaps

A 2D debugging map of a baked city: every tile, everything in it, and the ground, in the browser. For development, not
for players.

## Run it

```bash
npm run devmaps:prep -- --city=paris-centre     # or --city=a --city=b, or --all (Paris ~35 s, minis a few s)
npm run dev                                     # then open http://localhost:5200/devmaps.html
```

Re-run the prep after every bake. The viewer warns in the status bar (and in the city tab) when the prep's bake id is not
the bake of the tiles on disk, since the raw tiles' dictionaries then disagree with the prep's.

## What the prep writes (`tools/devmaps-prep.ts` → `public/devmaps/<city>/`, git-ignored)

| file | what |
|---|---|
| `meta.json` | the index's small parts, all in v2 metres (x east, z north): box, detail regions (rings, or corridors: `line` + `margin`), zones, water, river, landmarks, skyline, walls, roundabouts; per-tile stats; a census of every field the tiles carry; tours routed on the ride graph |
| `major.json` | the far view's roads and rail, simplified |
| `search.json` | `[name, type, x, z, tileKey, ref]` for every named way, place, building ref, procedural/mesh building, boat, landmark, zone, tour stop |
| `terrain.png` | `terrain.bin` (the coarse ground) as a hillshade |
| `custom.json` | hand-made things from the landmark catalogues (`public/landmarks/<region>.json`, `<region>/*.json`): procedural/kit builders, GLB statues (`-statues.json`), fountains (`-fountains.json`). A builder named by OSM id is tied to the bake building carrying `b<id>`; one at a lat/lon with a `size` gets that rectangle turned by `front`. **Approximate**: `src/render/landmarks.ts` fits them more cleverly; `approx` says how each was placed |
| `restyles.json` | per OSM id, the render-time restyle (`restyleInfo` in `src/city/hand-looks.ts`: Panoramax labels and hand entries). The bake doesn't carry restyles; the prep asks the renderer's own functions. SF street-photo labels apply only under `?looks=labels`, so SF normally has none |
| `legacy.json` | index geometry the tiles don't hold: quay walls (`top`/`low`/`cap`), garden hedges, topiary, beds/lawns/gravel, formal rings |
| `chunk/<cx>_<cy>.json` | `CHUNK`×`CHUNK` tiles (8 = 1.6 km): streets with a height, Δground and **level** per segment, footprints, areas, items (plants and furniture), places, decks, boats, courts, ride-graph edges (bike + run) |

Every chunk record keeps its tile key and index, so clicking it loads the **raw** tile and shows the real object: every
field the bake wrote, including ones the prep and `src/map/format.ts` don't know.

## Levels

Each street/rail segment gets one class, the same colours as `tools/level-map.ts`:

- **bridge** (blue): `bridge` flag, or role `bridge`/`deck`; **tunnel** (green): `tunnel`/`bore`/`cut`; **trench** (teal)
- otherwise from the way's height minus the ground, mean of the segment's two ends: **grade** (black) within `LEVEL_TOL`
  (0.7 m), **raised** (orange) above, **buried** (magenta) below.

The way's height is its own `z` override where it has one (the multi-level signal, flagged `z!` in labels and in red in
the node table), else its node's z. The ground is the tile's fine ground; where a tile ships none, the coarse grid,
and the segment is drawn faded (its class is less trustworthy). The node table in the inspector shows node z, way z,
Δground and the class for every vertex.

## Viewer (`devmaps.html`, `src/devmaps/`)

- **far** (< 0.25 px/m): coarse terrain, major roads, tile grid coloured by content, detail regions, zones, water,
  landmarks, tours. **mid**: the chunks. **near** (≥ 2 px/m): the raw tiles too — fine ground, way nodes (red = carries an
  OSM node id), heights along ways at very close zoom.
- Click: every entity under the cursor, ranked; pick one for all its fields with decoders (dictionary names, flag bits,
  cm → m, colours, refs → OSM links). Tiles show their prep stats and the whole raw tile.
- Layers are built from what the bake actually holds (ways by role, buildings by kind, areas by kind, item types split
  into plants and furniture, levels), with counts. The census of fields is at the bottom of the layers tab.
- Go box: `lat,lon` (any pair within 2° of the city origin), else local `x,z`; `way 123` / `node 123` / `relation 123`
  fetches it from the OSM API and draws it in red over the map, and lists bake entities whose ref carries that id;
  anything else searches names and refs.
- Coordinates: the status bar shows lat,lon, local x,z, the tile, and the coarse ground (v2 and above sea level).
  Right-click or `c` copies lat,lon at the cursor; `x` copies x,z; the inspector's coordinates copy on click.
  The view lives in the URL hash (`#city=…&ll=lat,lon&s=px/m`): paste it into a bug note.
- `m` measures (click points: each leg's length and bearing, and the running total); `Esc` clears.
- Buildings can be coloured by kind, by **restyle** (the look's wall colour; pink outline = applied, dashed = label
  present but not applied; grey fill = a look with a style and no colour, e.g. a confidence-1 label in Paris proper,
  which only forces Haussmann; everything else light grey), by **style** (the applied restyle's, else the bake's;
  close-in labels end in `?` on generic buildings, where the bake guessed), by archetype, or by height. A checkbox hides
  confidence-1 and unapplied restyles. The **builders** tab lists every builder with its instance count, coloured
  unique / repeated / mass (≥10, e.g. parisCivic), with per-builder toggles, "only", and **unique only** (`u`). A restyled building's inspector starts with its look.
- Custom builders (pink diamonds, rectangles), GLB statues (gold stars), fountains (blue); the bake building a builder
  replaces is outlined pink. Their inspector shows the whole catalogue entry, the file it came from and `madeBy`.
- Tours: each leg whose two stops are on this city's ride graph is routed (as `tools/check-tours.ts` routes), so a mini
  shows the part of a tour that crosses it; stops off the city are grey.
- Satellite: Esri World Imagery under the data, with the `sat` slider; `data` fades our layers over it.
  Each imagery tile is placed by its own corners through the city's projection.
- Google / OSM buttons open the view centre; the inspector has links at the entity.

Tunables are at the top of each file: `CHUNK`, `LEVEL_TOL`, the simplification epsilons, `MID_S`/`NEAR_S`, cache sizes.
