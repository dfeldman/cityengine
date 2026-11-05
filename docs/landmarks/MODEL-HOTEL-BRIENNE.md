# Hôtel de Brienne (14-16 rue Saint-Dominique, OSM way/65090118)

Builder `src/render/landmarks/paris/hotel-brienne.ts` (`hotelBrienne`), test `tests/hotel-brienne.test.ts`, entry in `public/landmarks/paris.json`
(madeBy claude-sonnet-5-5). The parisCivic entry for way/65090118 was removed from `public/landmarks/paris/civic.json` by hand.

Sources: Commons "Hôtel Brienne - Paris VII - 2024-08-07 - 1/2" (street front, gate at no. 16), "Brienne facade 1", "Jielbeaumadier ... 2008" (court front),
IGN LiDAR HD MNS (tools/ign-mns.ts at 48.8598 N, 2.3192 E, radius 75). The OSM way is the whole Ministry complex (about 116 x 87 m, jagged cadastre
outline); only the stone hôtel is modelled, in the street's frame (x along rue Saint-Dominique, bearing -28.2 deg, z inward NNE).

Lidar read: Duret block 13-14 m (u -58..-36), low street wing 8-10 m, west court wing 10 m, east wing 14 m, main block 15-18 m, open court about 41 x 18 m.
Drawn: Duret front with the great relieving-arch gate and dormers; street wing with the court carriage gate; court front of the main block (nine bays,
arched ground openings, balconied first floor, three-bay pedimented avant-corps); garden front; plain wing faces. Tunables are the exported constants.

Shots: refs/hotel-brienne/street-lowres.png (street front from rue Saint-Dominique, CITY=paris-centre), top-lowres.png.
Flaws: street-wing east end and the Ministry wings east of u=34 are not drawn (they vanish with the generic building); window sashes are flat;
no sculpture; garden front is a copy of the court front; the east Mailly/Duret pavilion gable in the photo is not modelled.

## Ministry massing (added)
The claim on the whole way would otherwise leave a hole, so the rest of the outline (mostly west and north-west of the hôtel in the street frame) is filled
with `FILL`: 43 limestone boxes at lidar heights, a zinc roof slab and plain window rows on faces that look onto open ground (about +1.8k triangles,
9.6k total). Hand-written boxes, not the facade() kit. top-lowres.png shows no gap. Flaw: heights are 3 m-cell medians, so tree-covered cells are rough.
