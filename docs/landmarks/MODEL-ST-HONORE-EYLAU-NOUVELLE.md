# Église nouvelle Saint-Honoré-d'Eylau (2026-11-04, claude-sonnet-5-5)

Builder `saintHonoreEylauNouvelle` in src/render/landmarks/paris/catholic/saint-honore-eylau-nouvelle.ts; entry in
public/landmarks/paris/catholic.json (OSM way/112237139, front 260.7 = west). Photos: docs/landmarks/refs/st-honore-eylau-nouvelle/
(Commons "Église Saint-Honoré-d'Eylau (église nouvelle) - 1 / - 3"). AXIS_DEG 9.3; u runs west front to east end.

- Plan from the OSM outline: 60 x 27 m, straight west wall (the front), lobed east end; building:part 13 m nave strip
  (10.7 m wide) and 7 m aisles. IGN lidar was NOT fetched; ridge 15.4, facade apex 16.4, bell gable 22.6 are read off the
  photo (door ~4.6 m for scale) and are the least certain numbers.
- Modelled: ochre brick with pale bands and piers, raking gable front with five round-arched doors, a frieze of ten gold
  mosaic-saint arches, three tall dark-blue windows, a three-bell gable and cross; nave clerestory under slate, lean-to
  aisles with round-arched windows and buttress piers, lower east block.
- Geometry fixes after comparing with the photo: the gable triangle was missing (wrong `gable` axis argument), the two
  inner piers now rise to the coping with caps.
- Not modelled: sawtooth wall nodes (OSM noise), the real aisle roof pitch, mosaic figures, brick polychromy, the east lobe's
  true shape (a plain box).
