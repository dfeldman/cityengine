/**
 * Paris's other rose gardens and the flower gardens whose beds the bake does not have (owner, 2026-11-20: "do as many rose gardens
 * as you know of. then do any other unique famous flower gardens"): render/flower-gardens.ts's `layoutGarden` inside each one's
 * OSM outline. Each entry in public/landmarks/paris/batch6.json stands at the same lat/lon with `front: 180`.
 * Tune the beds here; the plants in render/roses.ts and render/flower-gardens.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { gardenBuilder } from '../../../flower-gardens.ts'

export const PARIS_FLOWER_GARDENS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  // Parc de Bercy: la Roseraie: OSM's rosarium (garden:style=rosarium) in the Jardin Yitzhak-Rabin; the 2021 ortho shows a grid of square beds in gravel.
  roseraieBercy: gardenBuilder(48.835697, 2.38134, [[48.835698, 2.381147], [48.835537, 2.38138], [48.835695, 2.381633], [48.835856, 2.381393], [48.835698, 2.381147]], { flower: 'rose', bed: 3.2, walk: 1.6, cross: 4.8, crossW: 1.6, margin: 1.2, ground: 'gravel', seed: 11 }),
  // Parc Georges-Brassens: la Roseraie: OSM's leisure=garden 'Roseraie' by the old horse-market halls; small beds in gravel, the layout generic.
  roseraieBrassens: gardenBuilder(48.831152, 2.301771, [[48.831066, 2.301629], [48.830987, 2.301684], [48.830985, 2.301768], [48.831285, 2.30195], [48.831297, 2.301902], [48.831277, 2.301887], [48.831226, 2.301832], [48.831196, 2.301792], [48.831189, 2.301807], [48.831158, 2.301764], [48.831138, 2.301729], [48.8311, 2.301654], [48.831066, 2.301629]], { flower: 'rose', bed: 1.6, walk: 1.2, cross: 5, crossW: 1.2, margin: 0.8, ground: 'gravel', seed: 12 }),
  // Parc Montsouris: la Roseraie: OSM's leisure=garden 'Roseraie'; the ortho shows a fan of beds, drawn as straight rows (generic).
  roseraieMontsouris: gardenBuilder(48.821971, 2.335991, [[48.821901, 2.335865], [48.821832, 2.336014], [48.821872, 2.336051], [48.821913, 2.336087], [48.821952, 2.336102], [48.822009, 2.336096], [48.822046, 2.336075], [48.822078, 2.336038], [48.822099, 2.33599], [48.822066, 2.335957], [48.822015, 2.335906], [48.821972, 2.335922], [48.821938, 2.335907], [48.821901, 2.335865]], { flower: 'rose', bed: 2.4, walk: 1.4, cross: 4, crossW: 1.4, margin: 1, ground: 'gravel', seed: 13 }),
  // Île de Puteaux: la Roseraie: OSM's 'La Roseraie de l'Île de Puteaux'; the ortho shows a grid of small square beds. Its pergolas are not drawn yet.
  roseraiePuteaux: gardenBuilder(48.883007, 2.251014, [[48.883044, 2.250681], [48.882814, 2.251132], [48.882833, 2.251159], [48.882816, 2.251192], [48.883034, 2.251471], [48.883304, 2.250966], [48.883171, 2.250829], [48.883044, 2.250681]], { flower: 'rose', bed: 2.6, walk: 1.6, cross: 4.2, crossW: 1.6, margin: 2, ground: 'gravel', seed: 14 }),
  // Suresnes: la Roseraie: OSM's leisure=garden 'Roseraie'; the ortho shows three by four square beds in gravel.
  roseraieSuresnes: gardenBuilder(48.88236, 2.230527, [[48.882384, 2.230336], [48.882227, 2.230496], [48.882331, 2.23072], [48.882347, 2.230717], [48.882487, 2.23056], [48.882384, 2.230336]], { flower: 'rose', bed: 3.6, walk: 1.8, cross: 5.4, crossW: 1.8, margin: 1.5, ground: 'gravel', seed: 15 }),
  // Parc Floral de Vincennes: the Iris garden (north): OSM way/278043499; its Vallée des fleurs plan beds (tools/gardens/vincennes.ts) did not come through the bake, so laid here the same way.
  irisVincennesNorth: gardenBuilder(48.837219, 2.442987, [[48.837304, 2.442881], [48.837305, 2.442925], [48.837294, 2.442962], [48.837266, 2.442976], [48.837229, 2.442995], [48.837227, 2.443014], [48.837208, 2.443023], [48.837175, 2.443021], [48.837146, 2.443002], [48.83713, 2.442976], [48.83712, 2.442938], [48.837125, 2.442983], [48.837137, 2.443012], [48.837163, 2.443047], [48.837205, 2.443048], [48.837353, 2.443016], [48.837336, 2.442953]], { flower: 'iris', bed: 1.2, walk: 0.9, margin: 0.3, cross: 8, crossW: 0.9, ground: 'lawn', seed: 21 }),
  // Parc Floral de Vincennes: the Iris garden (south): OSM way/278043500; as the north garden.
  irisVincennesSouth: gardenBuilder(48.837487, 2.442877, [[48.837572, 2.442793], [48.837562, 2.442807], [48.837546, 2.442832], [48.837518, 2.442859], [48.837479, 2.442889], [48.837451, 2.442896], [48.837419, 2.442896], [48.837391, 2.442877], [48.837355, 2.442825], [48.837327, 2.442826], [48.837367, 2.442917], [48.837398, 2.443011], [48.837475, 2.442981], [48.837528, 2.442957], [48.837567, 2.44292], [48.837593, 2.442871], [48.837615, 2.442806], [48.837604, 2.44282]], { flower: 'iris', bed: 1.2, walk: 0.9, margin: 0.3, cross: 8, crossW: 0.9, ground: 'lawn', seed: 22 }),
}
