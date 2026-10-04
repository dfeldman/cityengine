/**
 * THE GOLDEN FIRE HYDRANT (visitor joys: "The Golden Fire Hydrant (20th & Church)"): the hydrant at the south-west
 * corner of Dolores Park that kept running when the mains failed after the 1906 earthquake, so the Mission was saved.
 * The city repaints it gold every April 18th. An old Greenberg pattern — a stout barrel on a flanged foot, a band, a
 * domed bonnet with its operating nut, two side outlets and the big pumper outlet facing the street — taller and
 * broader than the ordinary kerb hydrants (models.ts `hydrant`), and gold all over; a bronze plaque set in the pavement
 * before it. At OSM's node 3989015890 ("The Golden Fire Hydrant").
 *
 * Local frame: the pumper outlet on +z (the manifest's `front` turns it to the street).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { dome } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const GOLD: Rgb = [0.86, 0.66, 0.2]
const GOLD_DARK: Rgb = [0.66, 0.48, 0.13]
const BRONZE: Rgb = [0.36, 0.26, 0.15]

export function goldenHydrant(out: MeshBuilder, _fit: Fit): void {
  const metal = surfaceTag('metal')
  // the foot: a flange on a short collar
  prism(out, 0, 0, 0, 0.07, 0.26, 12, GOLD_DARK, metal)
  prism(out, 0, 0, 0.07, 0.14, 0.2, 12, GOLD, metal)
  // the barrel, a little narrower at the top, and its band
  prism(out, 0, 0, 0.14, 0.74, 0.16, 12, GOLD, metal, 0.015)
  prism(out, 0, 0, 0.5, 0.56, 0.18, 12, GOLD_DARK, metal)
  // the bonnet: a rim, a dome, the pentagonal operating nut
  prism(out, 0, 0, 0.74, 0.8, 0.2, 12, GOLD_DARK, metal)
  dome(out, 0, 0, 0.8, 0.17, 0.12, GOLD, 12)
  prism(out, 0, 0, 0.9, 0.98, 0.045, 5, GOLD_DARK, metal)
  // the two side outlets with their caps, and the pumper outlet to the street
  for (const s of [-1, 1]) {
    box(out, s * 0.21, 0.6, 0, 0.06, 0.055, 0.055, GOLD, metal)
    box(out, s * 0.28, 0.6, 0, 0.02, 0.07, 0.07, GOLD_DARK, metal)
  }
  box(out, 0, 0.4, 0.22, 0.08, 0.08, 0.07, GOLD, metal)
  box(out, 0, 0.4, 0.3, 0.1, 0.1, 0.02, GOLD_DARK, metal)
  // the plaque in the pavement before it
  box(out, 0, 0.012, 0.75, 0.3, 0.012, 0.2, BRONZE, metal)
  box(out, 0, 0.026, 0.75, 0.24, 0.004, 0.14, [0.5, 0.38, 0.2], metal)
}

export const GOLDEN_HYDRANT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { goldenHydrant }
