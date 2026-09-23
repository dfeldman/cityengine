| name | osm | height | lat, lon | what makes it hard | reference photo URL |
|---|---|---|---|---|---|
| de Young Museum | relation/1652482 | ~13 m (copper box) + observation tower | 37.7702, -122.4686 (Music Concourse) | It is a multipolygon relation, not a plain way, and its shape is the whole point: a long perforated/dimpled copper box with a twisting nine-storey observation tower cantilevered off one end — not a recipe or a simple prism. Overpass returned the relation's id and tags on every query, but every attempt to fetch its member ways' geometry (`rel(id:1652482); out geom;` and `(relation(1652482); way(r);); out geom;`) timed out on both overpass.kumi.systems and overpass.private.coffee (dispatcher-busy errors, ~5 attempts over 20 minutes). Needs a retry with a working Overpass endpoint, or the geometry pulled from the (already-baked, once it re-runs) city package. | https://en.wikipedia.org/wiki/M._H._de_Young_Memorial_Museum |
| Fort Point | relation/5504536 | 15 m (brick fort, 3 tiers of casemates) | 37.8107, -122.4772 (under the Golden Gate Bridge) | Same relation-geometry fetch problem as de Young (Overpass timeouts on every mirror tried). Also genuinely hard geometry even with a footprint: a square brick fort with three tiers of open brick arcades (casemates) on every face, corner turrets, a parade ground inside — `arcade` could do one tier but not the fort's whole distinctive tiered-arcade elevation without a lot of new geometry. | https://en.wikipedia.org/wiki/Fort_Point,_San_Francisco |
| Letterman Digital Arts Center | relation/10219643 | not fetched | 37.7989, -122.4472 (Presidio, off Lombard) | Same relation-geometry fetch problem. Also a multi-block campus (several separate red-brick buildings around a courtyard) rather than one building, so once the geometry is in hand this may want per-block restyle entries rather than one procedural model — worth deciding after the footprints are actually seen. | https://en.wikipedia.org/wiki/Letterman_Digital_Arts_Center |

Retry note: `tools/cache/overpass-parks-manual.json` already holds the successfully-fetched ways (Conservatory,
Academy, Tea Garden x3, both windmills, Beach Chalet, Spreckels Temple, Officers' Club, five Main Post
barracks blocks) so re-fetching only needs the three relations above, e.g.:

    curl -s -H "User-Agent: streetrunner/0.1" --data-urlencode "data@-" https://overpass.kumi.systems/api/interpreter -o out.json <<'Q'
    [out:json][timeout:90];
    rel(id:1652482,5504536,10219643);
    out geom;
    Q

and merge the resulting `elements` into the same cache file (or a new `overpass-*.json` in `tools/cache/`).
