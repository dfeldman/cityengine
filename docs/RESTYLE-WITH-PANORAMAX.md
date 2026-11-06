# Restyling generic buildings from street photos (Paris)

San Francisco was labelled building by building (Haiku on Mapillary, `src/city/appearance.ts`). Paris does not need
that: its small buildings are Haussmann/old stock the styles already draw well, and its streets are too narrow and
crowded for street photos of small buildings to read. **Look only at the buildings that stand out**: anything over
~40 m, and anything modern (post-1960: the bake's `skyscraper`, `towerblock`, `bauhaus`/`parismodern` styles, or
OSM `start_date` ≥ 1960). The aim is all of Paris and the detail-box suburbs this way.

## Steps
1. **Enumerate** a district with osmium on the local pbf
   (`tools/cache/osm/ile-de-france-latest.osm.pbf`: `osmium extract -b`, `tags-filter w/building w/building:part`,
   `export -f geojsonseq`). Keep ≥40 m (height, or levels×3) or modern, minus ways already claimed by a landmark
   (`public/landmarks/paris.where.json`). **Also keep untagged-height ways inside a cluster**: Boulogne's
   Pont de Sèvres towers had no height and were nearly missed. Write the list to `plans/<district>-buildings.tsv`.
2. **Cluster** them (≈400 m cells, or by name/complex). One look per cluster, not per building.
3. **Photos**: `python3 -I tools/panoramax.py <scratch>/pmx name=lat,lon ...`: up to 3 Panoramax pictures per
   target, aimed at it, shrunk to 900 px. No key; works when Mapillary/Street View need a browser.
   Some clusters have no aimed photos (Trapèze, parks, the quays); try a point nearer a street.
4. **Haiku reads them** (one subagent, `model: haiku`): per cluster, one line of dominant wall hex, material
   (white render / cream stone / pale concrete / glass + tint / metal), balconies, confidence, note.
5. **Write the looks** in `src/city/hand-looks.ts`:
   - `AREAS`: a lat/lon ring where a style draws from other palettes (Boulogne: `skyscraper` → pale blue-grey glass
     and white/cream). The cheap, broad fix; do this first.
   - `ENTRIES`: way ids → named palette (`HAND_PALETTES`), optional `style` and `dress` (balconies, belts), for
     complexes that differ from their area (Pont de Sèvres steel, the white balcony slabs).
   Tint multiplies the style's painted wall, so a grey-painted style stays grey under a light tint: change `style`
   too (the steel towers needed `parismodern`). To check a palette reaches the render at all, set it `#ff0000`
   and take a tinyres shot.
6. **Check** with `tools/shoot-landmark.sh` (CITY=paris-centre, HEIGHT/PITCH from above), from the **sunlit side**:
   a north face in shade looks grey whatever the palette.

Done so far: Boulogne-Billancourt and Issy's north bank (2026-11-05, plans/boulogne-recolour.md).
