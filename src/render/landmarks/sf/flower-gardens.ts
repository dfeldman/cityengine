/**
 * Golden Gate Park's two famous flower gardens (owner, 2026-11-20): the SF bake has no garden layer, so each is a landmark
 * (public/landmarks/san-francisco/parks.json, same lat/lon, rotateDeg 0) laid by render/flower-gardens.ts inside its OSM outline.
 * Tune the beds here; the plants in render/roses.ts and render/flower-gardens.ts.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { gardenBuilder } from '../../flower-gardens.ts'

export const SF_FLOWER_GARDENS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  // the Rose Garden: OSM way/120479804 (garden:type=rosegarden), a long strip running NNE-SSW at the park's JFK Drive side; long rectangular rose beds in lawn.
  ggpRoseGarden: gardenBuilder(37.7720, -122.47145, [[37.7726132, -122.4715294], [37.7722146, -122.4713336], [37.7717249, -122.4710037], [37.7715913, -122.4708911], [37.771498, -122.4710842], [37.7717376, -122.4712559], [37.7717185, -122.4713122], [37.7717143, -122.4713658], [37.7717185, -122.4714168], [37.7717334, -122.471457], [37.7717524, -122.4714946], [37.7717864, -122.4715402], [37.7718288, -122.4715589], [37.7718712, -122.471567], [37.7719093, -122.471567], [37.7719602, -122.4715428], [37.7719984, -122.4714999], [37.7720281, -122.4714409], [37.77245, -122.4716877], [37.7725115, -122.4716957], [37.7725517, -122.4716743], [37.772592, -122.4716314], [37.7726132, -122.4715294]], { flower: 'rose', bed: 4, walk: 2.2, margin: 1.6, cross: 24, crossW: 2.2, ground: 'lawn', seed: 31 }),
  // the Queen Wilhelmina Tulip Garden: OSM way/120483945, the lawn east of the Dutch Windmill; massed beds of tulips.
  ggpTulipGarden: gardenBuilder(37.77025, -122.50925, [[37.7704252, -122.5092869], [37.7704573, -122.5092845], [37.7704637, -122.5092595], [37.7704663, -122.5092313], [37.7704621, -122.509207], [37.7704528, -122.5091801], [37.7704388, -122.5091518], [37.7704132, -122.5091068], [37.7703862, -122.5090451], [37.7703733, -122.5090229], [37.7703606, -122.5090098], [37.770348, -122.5090027], [37.7703325, -122.5090035], [37.7701932, -122.5090578], [37.7700808, -122.5091328], [37.7700679, -122.5091462], [37.7700463, -122.5091957], [37.7700494, -122.5092172], [37.7700667, -122.5092686], [37.7700888, -122.5093193], [37.7700879, -122.5093562], [37.770105, -122.509421], [37.7701877, -122.5093808], [37.7702386, -122.5093647], [37.770281, -122.509362], [37.7703213, -122.5093995], [37.770334, -122.5093513], [37.7703573, -122.5093164], [37.770387, -122.5092949], [37.7704252, -122.5092869]], { flower: 'tulip', bed: 3, walk: 1.6, margin: 1.2, cross: 40, crossW: 1.6, ground: 'lawn', seed: 32 }),
}
