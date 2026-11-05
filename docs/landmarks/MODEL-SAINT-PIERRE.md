# Église luthérienne Saint-Pierre (55 rue Manin, 19e)

- OSM: way/63224657 is the church (named, wikidata Q60384798); way/63234762 is the neighbouring apartment block (not used). Flush on the street, between apartment blocks, visible.
- Refs (Commons): `refs/saint-pierre/ref1-6.jpg` (ref2 and ref1 read; ref4 geotagged 48.88098,2.38017).
- Builder: `egliseSaintPierre` in `src/render/landmarks/paris/protestant.ts` (constants `SP_*`); manifest entry in `public/landmarks/paris/protestant.json`; registered in `procedural.ts`; the parisCivic entry for way/63224657 was removed from `civic.json`.
- Modelled: brick facade over a stone ground storey, twin windows either side of an arched portal with gold tympanum and lettering band, grey timber hood, brick gable (4.4 m) with stone rake bands, oculus and cross, slate side roofs with dormers. Front faces bearing -15 (NNW); checked in a shot and top view: no flip.
- Not modelled: sides and rear (not photographed; plan taken from the OSM ring, flat-topped slate box behind the gable bay); hood is flat on the face, not projecting, to stay inside the ring (decor stands at most 0.16 m proud).
- Risk: in the game the ground in front of the church shows as lawn rather than street.
- Shot: `CITY=paris-centre SHOTS_MEDRES=1 HEIGHT=4 PITCH=8 sh tools/shoot-landmark.sh 3499.5 2296 -15 0.55 0 shot2.png`
