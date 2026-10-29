import { MeshBuilder } from '../../../buildings.ts'
import { archedPane, block, column, dome, hex, placed, prism, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

/**
 * The rotunda of the Musée Guimet (Jules Chatron, 1889) at the corner of the Place d'Iéna — the part of the museum
 * anyone knows: a stone drum on a rusticated ground floor with the entrance, a ring of engaged Ionic columns round the
 * upper storey with tall windows between them (the library is inside), the entablature and a balustraded attic, and
 * a low ribbed dome over it. Standalone, centred on the round end of OSM's way 79641993, which stays the city's
 * building in the classical dress; the drum is a touch wider than OSM's round end so it stands over it.
 * Local frame: −z faces the place (south-west).
 */
export function guimetRotunda(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e3d9c4')
  const deep = shade(stone, 0.86)
  const dark: Rgb = [0.22, 0.24, 0.25]
  const zinc: Rgb = [0.48, 0.53, 0.55]
  const r = Math.min(Math.max(Math.min(fit.hx, fit.hz), 6.5), 10)
  const base = 7
  const top = 19
  prism(out, 0, 0, 0, base, r + 0.3, 24, deep)                       // the rusticated ground floor
  prism(out, 0, 0, base, base + 0.6, r + 0.6, 24, shade(stone, 0.94))
  prism(out, 0, 0, base + 0.6, top, r, 24, stone)
  prism(out, 0, 0, top, top + 1.3, r + 0.7, 24, deep)               // the entablature
  prism(out, 0, 0, top + 1.3, top + 2.6, r + 0.2, 24, stone)        // the attic
  dome(out, 0, 0, top + 2.6, r - 0.4, r * 0.55, zinc, 24, shade(zinc, 0.8))
  prism(out, 0, 0, top + 2.6 + r * 0.55 - 0.3, top + 2.6 + r * 0.55 + 1.6, 1.0, 8, stone)   // the lantern
  // round the front half: engaged columns, windows between, arched openings below; drawn on −z and turned round
  const bays = 8
  for (let i = 0; i < bays; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) / bays) * Math.PI       // −90° … +90° about the front (−z)
    const q = new MeshBuilder()
    column(q, 0, -r - 0.35, base + 0.6, top, 0.42, stone, { order: 'ionic' })
    const w = new MeshBuilder()
    archedPane(w, -r - 0.04, 0, base + 2, 1.7, 7.5, dark)
    archedPane(w, -r - 0.34, 0, 0.6, 2.2, 5.2, dark)
    placed(out, q, a, 0, 0)
    placed(out, w, a + Math.PI / bays / 2, 0, 0)
  }
  // the entrance porch on the place, a step out from the drum
  block(out, -2.6, 2.6, -r - 1.6, -r + 0.5, 0, base, deep)
  archedPane(out, -r - 1.64, 0, 0.3, 3, 5.6, dark)
}
