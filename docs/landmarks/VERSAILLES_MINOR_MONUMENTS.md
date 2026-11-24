# Versailles minor monuments to model

The basins, fountains, bosquet architecture and garden pavilions of the Parc de Versailles, the Trianons and the old town
that the game doesn't draw yet (owner, 2026-11-24: "next let's do the minor monuments in Versailles"). Same method as
PARIS_MINOR_MONUMENTS.md and docs/landmarks/MINOR-MONUMENT-BRIEF.md (its "Versailles" section): procedural architecture,
Modly (img2glb guided) for the sculpture.

Already drawn (src/render/landmarks/paris/versailles/): the château and communs, the Orangerie and its parterre, the Cent
Marches, the Bassin de Neptune, the Colonnade, the Salle de Bal, the grotto of the Bains d'Apollon and the Encelade's
treillage (garden-structures.ts), La Lanterne, the Grand and Petit Trianon, the Temple de l'Amour, the Belvédère and the
Grand Rocher (trianon-follies.ts). The planting of the parterres and bosquets is tools/gardens/versailles.ts; the jets of
every basin are tools/versailles-fountains.py (moving water only: no rims, no sculpture).

x, z are versailles-mini metres (origin 48.8044, 2.1269): x = (lon − 2.1269)·73343, z = (lat − 48.8044)·111200.

## Groups (one agent each)

| Group | Works (OSM) | lat, lon | x, z |
|---|---|---|---|
| latone | Bassin de Latone (way/13645589); Bassins des Lézards (way/40409120, way/40409122) | 48.80551, 2.11769 | −676, 123 |
| north-axis | Bassin de la Pyramide (way/124531640); Bain des Nymphes (way/23707418); the Allée d'Eau's 22 Marmousets basins ("Trois …" fountain nodes, way/124531622); Bassin du Dragon (way/124531629) | 48.80649, 2.12107 | −428, 232 |
| trianon | Pavillon français (way/194534704); Pavillon frais (48.81460, 2.10774); the Grand Trianon's Buffet d'eau; Fontaine de l'Amour assis sur un dauphin (node/11026542613); the two "Trois enfants" fountains (node/11026527973, node/11026527975); rims of the Bassins du Plat-Fond (way/124531641), du Fer à Cheval (way/124531630), du Trèfle, de la Petite Gerbe, du Parterre de Laocoon | 48.81519, 2.10749 | −1555, 1194 |
| seasons | Bassins de Bacchus, Cérès, Flore, Saturne (one builder, four entries; find their water ways in OSM) | 48.80750, 2.11722 | −711, 340 |
| parterres | the Parterre d'Eau's two basins and their bronzes; Bassins du Midi (way/237843251) and du Nord (way/257712056); Bassins des Couronnes (way/92619334, way/92619350); Fontaines du Point du Jour (way/1202778307) and du Soir (way/92619297) | 48.80536, 2.11934 | −555, 106 |
| apollon | Bassin d'Apollon (rim; the chariot group); Bassin du Miroir (way/5013340) and the Île royale | 48.80737, 2.11072 | −1187, 330 |
| bosquets | Théâtre d'Eau (Othoniel's Belles Danses, the lead children), Bassin des Enfants dorés (way/124536153), Trois Fontaines, Arc de Triomphe, Dômes, Reine, Girandole and Dauphin (way/95475829), the Obélisque's basin (way/124531638), the Étoile (Penone's bronze trees) | 48.80703, 2.11959 | −537, 292 |
| town | Fontaine Saint-Louis (way/74631328); Fontaine des Quatre Pavés (node/4268639281) | 48.79898, 2.12424 | −195, −603 |

## Not modelled

- Abbaye Notre-Dame-des-Anges, École spéciale militaire (Saint-Cyr, lon 2.06), Fontaine de la rue de l'Ermitage: outside
  every Versailles detail region.
- Pièce d'eau des Suisses: a lake; the bake draws its water and tools/gardens its rows.
- Grotte du Petit Trianon: the Grand Rocher in trianon-follies.ts.
- Site historique de l'Hôpital Richaud: a building complex (generic buildings now), a landmark job rather than a minor monument.
- The garden statues themselves (PARIS-STATUES.md sections V and G, ~250 works): none went through img2glb; that is a batch
  run of its own.

## Sculpture queue

While ml1's GPU is held by the img2glb redo round, agents don't run guided: each writes its pieces' guided commands to
the queue (the coordinator's scratchpad, monu/versailles/guided-queue.md) and draws a plain plinth or stand-in. The
coordinator runs the queue once Modly is free.

## Status
- apollon (Bassin d'Apollon, Bassin du Miroir; Île royale is lawn, no structure): modelled (src/render/landmarks/paris/versailles/minor/bassin-apollon.ts, public/landmarks/paris/monuments.json; Modly pieces: versailles-apollon-chariot queued, not run)
- north-axis (Bassin de la Pyramide, Bain des Nymphes, Allée d'Eau's 22 Marmousets basins, Bassin du Dragon): modelled (versailles/minor/north-axis.ts, monuments.json; sculpture stand-ins, Modly pieces queued: marmousets, dragon, dragon-dauphins, pyramide-triton, nymphes-relief)
- latone (Bassin de Latone, two Bassins des Lézards): modelled (src/render/landmarks/paris/versailles/minor/bassin-latone.ts, public/landmarks/paris/monuments.json; Modly pieces: none yet, three commands queued in guided-queue.md; procedural stand-ins in place)
- town (Fontaine Saint-Louis, Fontaine des Quatre Pavés): modelled (src/render/landmarks/paris/versailles/minor/fontaines-saint-louis.ts, public/landmarks/paris/monuments.json; Modly pieces: none, both are architecture; the Quatre Pavés claims OSM building way/74626210, its own pavilion)
- seasons (Bassins de Bacchus, Cérès, Flore, Saturne): modelled (src/render/landmarks/paris/versailles/minor/bassins-saisons.ts, public/landmarks/paris/monuments.json; Modly pieces: none yet, four group commands queued in guided-queue.md; stand-ins on the mounds)
- parterres (Parterre d'Eau Midi + Nord basins = OSM Bassin du Midi/du Nord, Point du Jour, Soir, 2 Couronnes): modelled (versailles/minor/parterre-basins.ts, monuments.json; copings, 24 pedestals + 4 beast pedestals, 6 Couronnes plinths; bronzes plain stand-ins; Modly pieces queued in guided-queue.md, none run)
- trianon (Pavillon français, Pavillon frais, Buffet d'eau, Fontaine de l'Amour, two Trois enfants fountains, coping of the Plat-Fond, Fer à Cheval, Trèfle, Petite Gerbe and Laocoon basins): modelled (src/render/landmarks/paris/versailles/minor/trianon-garden.ts + trianon-garden-data.ts, public/landmarks/paris/monuments.json; Modly pieces: none yet, six commands in the guided queue)
- bosquets (Théâtre d'Eau with Othoniel's Belles Danses, Enfants dorés, Trois Fontaines, Dômes balustrade, Obélisque's stepped basin, Dauphin and France triomphante basins): modelled (versailles/minor/bosquets.ts, monuments.json; Modly pieces: none yet, Enfants dorés and France triomphante queued in guided-queue.md; stand-ins in place). Left: Arc de Triomphe bosquet's other basins, Penone's trees (Étoile), Reine, the Théâtre d'Eau's lawn tiers, the two small basins (ways 124531661/663), Dômes reliefs/statues
