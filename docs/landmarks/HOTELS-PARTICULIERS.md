# Hôtels particuliers — inventory and plan

Inventory: `python3 tools/hotels-rank.py <dir>` (osmium extracts of the core detail box + Versailles town; see script). 326 buildings named *Hôtel …* (not hotels, mairies, hospitals); 28 already claimed by a manifest entry.

Score = heritage (classé 3, inscrit 2) + wikipedia 2 + wikidata 1 + size (≤4, area/800) + 1.5 × frontage (square 3, primary/trunk 2, secondary 1.5, tertiary/pedestrian 1, within 25 m). Owner, 2026-11-04: *important* means architecturally important or prominent on a square or major street, not historic.

Known gaps: houses OSM names by their use (Musée Picasso = Hôtel Salé, Musée Carnavalet, Hôtel Lambert under another name) are missed; the 9 Place des Vosges pavilions score high only by frontage and are one uniform brick-and-stone type — model them as one kit, not nine.

| score | name | osm | m² | front | heritage | claimed by |
|---|---|---|---|---|---|---|
| 14.5 | Hôtel de la Marine | relation/1060822 | 5638 | 3 | 2 | gabrielPalaces |
| 14.5 | Hôtel d'Évreux | relation/542353 | 9625 | 3 | 2 |  |
| 13.9 | Hôtel Arnaud | relation/571726 | 2750 | 3 | 2 |  |
| 13.0 | Hôtel de Ségur | relation/542286 | 2796 | 3 | 3 |  |
| 12.1 | Hôtel Gaillard | relation/1261334 | 2509 | 2 | 2 |  |
| 12.0 | Hôtel Moufle | relation/542283 | 1208 | 3 | 2 |  |
| 11.8 | Hôtel Coulanges | relation/403147 | 1028 | 3 | 2 |  |
| 11.8 | Hôtel de Béhague | way/69859760 | 2230 | 2 | 2 |  |
| 11.7 | Hôtel de Tresmes | relation/411404 | 942 | 3 | 2 |  |
| 11.6 | Hôtel de Vitry | relation/411405 | 881 | 3 | 2 |  |
| 11.6 | Hôtel Saint-Florentin | way/54177935 | 1697 | 3 | 3 |  |
| 11.5 | Hôtel Lafont | way/49734641 | 785 | 3 | 2 | parisCivic |
| 11.5 | Hôtel de Soubise | relation/3371164 | 4475 | 1 | 2 |  |
| 11.5 | Hôtel de Matignon | relation/1076880 | 3748 | 1 | 2 | ? |
| 11.5 | Hôtel du Cardinal de Richelieu | relation/18812504 | 806 | 3 | 2 |  |
| 11.3 | Hôtel de Chaulnes | way/49734550 | 604 | 3 | 2 |  |
| 11.2 | Hôtel Marchand | way/49734571 | 527 | 3 | 2 |  |
| 11.2 | Hôtel d'Espinoy et Pavillon de la Reine | way/50591615 | 585 | 3 | 2 |  |
| 11.1 | Hôtel de Fontpertuis | way/54175277 | 488 | 3 | 2 |  |
| 11.1 | Hôtel de Fourcy | relation/571727 | 499 | 3 | 2 |  |
| 11.0 | Hôtel Dyel des Hameaux | way/49734566 | 397 | 3 | 2 |  |
| 11.0 | Hôtel de Chabannes | way/49734570 | 366 | 3 | 2 |  |
| 11.0 | Hôtel d'Asfeldt | way/49734634 | 408 | 3 | 2 |  |
| 11.0 | Hôtel de Clermont-Tonnerre | way/49734644 | 385 | 3 | 2 |  |
| 11.0 | Hôtel de Laffemas | way/49734651 | 369 | 3 | 2 |  |
| 11.0 | Hôtel de Boullongne | way/54175280 | 408 | 3 | 2 |  |
| 11.0 | Hôtel Potocki | relation/1104615 | 4077 | 2 | 2 |  |
| 10.9 | Hôtel de Montbrun | way/49734495 | 306 | 3 | 2 |  |
| 10.9 | Hôtel de Montmorin | way/49734496 | 325 | 3 | 2 |  |
| 10.9 | Hôtel d'Angennes de Rambouillet | way/49734646 | 320 | 3 | 2 |  |
| 10.8 | Hôtel de la Salle | way/49734554 | 201 | 3 | 2 |  |
| 10.8 | Hôtel de Châtillon | way/49734640 | 258 | 3 | 2 |  |
| 10.8 | Hôtel du Cardinal de Richelieu | way/50591660 | 209 | 3 | 2 |  |
| 10.8 | Hôtel de l'Escalopier | way/50591670 | 225 | 3 | 2 |  |
| 10.8 | Hôtel de Ribault | way/56077594 | 208 | 3 | 2 |  |
| 10.7 | Hôtel Pierrard | way/49734549 | 136 | 3 | 2 |  |
| 10.6 | Hôtel de Miramion | relation/568776 | 2091 | 2 | 3 |  |
| 10.5 | Hôtel Élysée Palace | relation/1100897 | 3259 | 1 | 3 |  |
| 10.3 | Hôtel de Roquelaure | way/63564122 | 2603 | 2 | 2 | parisCivic |
| 10.2 | Hôtel de Plessis-Bellière | relation/1060806 | 2144 | 1 | 2 | gabrielPalaces |

## Custom models: the top 20 (owner chose 20, 2026-11-04)

Uniform squares are one model each: Place Vendôme (Arnaud, Ségur, Moufle, Delpech de Chaunot, Nocé and the rest of its hôtels) and Place des Vosges (the pavilions). Soubise and Sully already have bespoke court models.

1. Place Vendôme fronts — 2. Place des Vosges pavilions — 3. Hôtel d'Évreux (Élysée) relation/542353 — 4. Gaillard relation/1261334 — 5. Béhague way/69859760 — 6. Saint-Florentin way/54177935 — 7. Lafont way/49734641 — 8. Potocki relation/1104615 — 9. Miramion relation/568776 — 10. Élysée Palace relation/1100897 — 11. Roquelaure way/63564122 — 12. Günsburg way/84323015 — 13. Colbert de Torcy relation/546795 — 14. Hôtel de Vendôme relation/975976 — 15. Brienne way/65090118 — 16. Mercy-Argenteau way/69220486 — 17. Rohan way/251136638 — 18. Castries relation/1076763 — 19. Landolfo-Carcano way/108200345 — 20. the next unclaimed in the table.

Status: (each line gets done/notes as its subagent reports)
- 1 Place Vendôme: done (place-vendome.ts, 19 ids incl. relation/542353 — OSM's "Hôtel d'Évreux" is No. 19 on the square, not the Élysée; it replaced the `vendomeFronts` overlay). So #3 is void; Hôtel Arnaud relation/571726 (Marais, 48.8545 N 2.366 E) takes its place.
- 2 Place des Vosges: done (place-vosges.ts, 26 outlines + 33 arcade parts, ~31k tris). Flaws: stray diagonal struts across roofs in v1m shot; Roi/Reine not projecting; eaves from photo ratios.
- 4 Gaillard: done (hotel-gaillard.ts, 9.8k). Flaws: plan simplified to a quad, no portal, no street-level comparison yet.
- 5 Béhague: done (hotel-behague.ts, 5.3k). Street front checked. Flaws: garden side guessed; stray horizontal line across the street shot.
- 6 Saint-Florentin: done (hotel-saint-florentin.ts, 4.2k). Concorde front plain; back faces guessed; flat roof frustum.
- 7 Lafont: void — it is a Place des Vosges pavilion, already in placeVosges. Next: 8 Potocki.
- 8 Potocki: done (hotel-potocki.ts, 6k). Street front checked. Flaws: dome is a stepped box; back plan approximate.
- 9 Miramion: done (hotel-miramion.ts, 1.8k). Placed on lidar (OSM ring off a few m).
- 10 Élysée Palace: skipped — a 1898 grand hotel, not a hôtel particulier (Palais de l'Élysée already in palaces.json).
- 11 Roquelaure: done (hotel-roquelaure.ts, 1.6k). Heights from Atget plates (lidar unusable). landmarks.test.ts not yet rerun.
- 12 Günsburg: done but NEEDS REVIEW (hotel-gunsburg.ts, 4.6k). Plan guessed off a poor OSM ring; only an oblique shot; generic footprint may double-draw.
- 13 Colbert de Torcy (Hôtel Tubeuf, rue Vivienne): done (hotel-colbert-torcy.ts, 2.8k). Frontal + top checked; court fronts from Marot engravings.
- 14 Vendôme (École des Mines): done, REVIEW placement (hotel-vendome.ts, 4k) — the hôtel proper lies mostly west of OSM's outline.
- 15 Brienne: done (hotel-brienne.ts, 9.6k). The OSM way is the whole Ministry; the rest is filled with plain lidar-height blocks. Street shot not frontal.
- 16 Mercy-Argenteau: PARTIAL (hotel-mercy-argenteau.ts on way/69220658, 5 of 11 bays). OSM's named way/69220486 is the Passage Jouffroy strip (generic entry deleted). The other 6 bays + avant-corps are in unclaimed way/69220286 — extend there later.
- 17 Rohan: done (hotel-rohan.ts, 5.8k). Frontal + top checked. Gate leaves too orange; Apollon relief unconfirmed.
- 18 Castries: done (hotel-castries.ts, 6.4k). Top-down clean. Cour front only 3 bays (photos wider).
- 19 Landolfo-Carcano (1 rue de Tilsitt): done (hotel-landolfo-carcano.ts, 5k). Oriel boxy.
- 20 Arnaud: = No. 6 Place des Vosges (Maison de Victor Hugo); folded into placeVosges as a plain back.
