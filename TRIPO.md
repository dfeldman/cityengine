# Tripo queue — shapes for image → GLB

Owner, 2026-10-17: Tripo (image-to-GLB) is the tool for things that are very hard to model by hand — statues, fountains
with figures, ornate lamp posts, ships, unique signs, very unique landmarks. These are listed here for the owner to make;
nothing here should be hand-modelled at length. Each entry: what, where, a reference to photograph from, and how it is
drawn today. When a GLB lands, place it with a manifest entry (`"file": "models/…glb"`) and retire the stand-in.

Simple geometric sculptures (all boxes and cylinders, like the Embarcadero Plaza fountain) are NOT for this list — those
are modelled directly.

| # | What | Where | Reference | Today |
|---|------|-------|-----------|-------|
| 1 | Lotta's Fountain (cast iron, 1875) | Market at Kearny/Geary, 37.78783 −122.40363 | Commons "Lotta's Fountain" | check manifest |
| 2 | Japanese Tea Garden drum (moon) bridge | Golden Gate Park, 37.77005 −122.47066 | Commons "Drum Bridge Japanese Tea Garden" | generic |
| 3 | Sea-lion statue "Guardians of the Gate" | Pier 39 entrance, 37.808682 −122.410767 (OSM node 4149743879) | Commons / Mapillary | not drawn |
| 4 | "Crab Topiary" crab statue | Pier 39, 37.808508 −122.410202 (OSM node 5455625122) | Mapillary | not drawn |
| 5 | The Klamath ferry's propellers on their display frame (two 4-blade steel props, cavitation-pitted) | Aquatic Park end of Jefferson, 37.807583 −122.421783 (hmdb marker 117351, "Propellers from Klamath") (#290j) | hmdb photos (A. Ruppenstein 2018); Mapillary has none close | stand-in `klamathPropellers` (wharf-shops.ts, 2026-10-17): flat twisted blades on A-frames |
| 6 | Pier 39 sea lions (lying on their floats) | Pier 39 K-dock | Commons "Zalophus californianus at Pier 39" | boxes (seaLionFloats) |
| 7 | Balclutha, C.A. Thayer, Eureka, Hercules, Alma (historic ships) | Hyde Street Pier | Commons | hand-built hulls (ships.json) — good enough? |
| 8 | SS Jeremiah O'Brien, USS Pampanito | Pier 45 | Commons | hand-built |
| 9 | San Francisco's ornate "Path of Gold" Market Street lamp posts | Market Street | Commons "Path of Gold" | check lamps.ts |
| 10 | Wharf-style lamp posts (blue, scrolled arms, as on the Embarcadero near Pier 39) | The Embarcadero / Jefferson | owner's Street View 2026-10-16 | generic lamps |
| 11 | Ruth Asawa's Mermaid fountain (Ghirardelli Square) | 37.80585 −122.42287 | Commons | asawaMermaidFountain (hand) |
| 12 | The Wave Organ | Marina jetty, 37.80853 −122.43993 | Commons | check |
| 13 | Ghirardelli's GHIRARDELLI roof sign | Ghirardelli Square | — | done by the sign kit, not Tripo |
| 14 | Hard Rock Cafe's giant red guitar sculpture | Pier 39 entrance plaza by Building Q, ~37.80866 −122.40983 (OSM node 643445596 is the café) | Commons "Pier 39 2018.jpg" (right of frame) | not drawn |
| 15 | Aunt Fanny's pretzel finial / a real photo of the kiosk | Pier 39, by Building L (OSM node 4611835603) | none found (no Mapillary on the pier deck) | `pretzelKiosk` built from the owner's description (red drum, scalloped canopy, tube pretzel) |
| 16 | The Argonaut Hotel's little pink figure on top of its ARGONAUT blade sign (a dancing/leaping figure, rose-pink, ~1 m) | Jefferson & Hyde corner, 37.80752 −122.42063, ~16 m up | Commons "Argonaut Hotel, San Francisco, California, US" (top of the blade) | a plinth only (`argonautHotel`, wharf-landside.ts) |
| 17 | The Franciscan's crab-and-mermaid emblem (red Dungeness crab, a green-tailed mermaid riding it, ~2.5 m, flat relief) | Pier 43½ parapet wall, 37.80905 −122.41465, ~6 m up | Mapillary 190325623495572 (Jun 2022) | flat red crab of lozenges + legs (`franciscanCrab`, wharf-shops.ts) |
| 18 | Painted fibreglass sea lions on rock bases (street art, several along Jefferson) | Bay Company corner 37.8077 −122.4206; Frank's Fisherman 37.8080 −122.4186 | Mapillary 2275436329641501, 4635265953366739 (Aug 2025) | none |
| 19 | The painted cut-out cook holding a big fish on a Pier 39 balcony | Pier 39 Building B's east face (OSM way/128240115 edge 9), ~37.80925 −122.41007, upper floor | owner's Street View walk 2026-10-17, photograph 2 | flat stand-in (`cutout` feature, pier39-style.ts) |
| 20 | Giant ice-cream cones on Pier 39's kiosks: Dreyer's waffle cone (red-and-white awning) and Atalia's gelato cone | Dreyer's: Building D south-east corner ~37.80946 −122.41018; Atalia's: Building B south-east corner ~37.80910 −122.41000 | owner's photograph 3; Mapillary 4638570392820856, 1340963877366826 | tapered tube + scoop prisms (`cone` feature, pier39-style.ts) |

Add rows as they are found; mark a row DONE with the GLB's path when it is placed.
