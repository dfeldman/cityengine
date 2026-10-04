/**
 * A street clock's post (OSM amenity=clock, support=pole): a dark green-black iron column on a fluted base, a collar,
 * and the drum head the four dials hang on (render/city.ts draws the dials with `clockFace`, so they tell the real
 * time — render/clocks.ts). San Francisco's sidewalk clocks (the one by Union Square, Samuel's on Market) are this
 * shape; so are London's and Paris's, which is why it is not a region's.
 */
import type { MeshBuilder } from './buildings.ts'
import { box, prism, type Rgb } from './models.ts'

const IRON: Rgb = [0.11, 0.15, 0.12]
const GOLD: Rgb = [0.62, 0.5, 0.22]

export function streetClockPost(out: MeshBuilder): void {
  prism(out, 0, 0, 0, 0.5, 0.32, 10, IRON, 0, 0.26)
  prism(out, 0, 0, 0.5, 3.4, 0.11, 10, IRON, 0, 0.09)
  prism(out, 0, 0, 3.4, 3.62, 0.2, 10, GOLD, 0, 0.2)
  // the drum the dials hang on, its cap and finial
  box(out, 0, 4.1, 0, 0.41, 0.48, 0.41, IRON, 0)
  prism(out, 0, 0, 4.58, 4.8, 0.48, 12, IRON, 0, 0.18)
  prism(out, 0, 0, 4.8, 5.05, 0.06, 6, GOLD, 0, 0.01)
}
