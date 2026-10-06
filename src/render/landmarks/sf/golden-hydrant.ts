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
  // the barrel, a little narrower at the top, and its band (the top radius was 0.015: the barrel came to a POINT, and
  // the bonnet stood on a spike — owner, 2026-10-06: "modeled, but does not look right")
  prism(out, 0, 0, 0.14, 0.74, 0.16, 12, GOLD, metal, 0.145)
  prism(out, 0, 0, 0.5, 0.56, 0.18, 12, GOLD_DARK, metal)
  // the bonnet: a rim, a dome, the pentagonal operating nut
  prism(out, 0, 0, 0.74, 0.8, 0.2, 12, GOLD_DARK, metal)
  dome(out, 0, 0, 0.8, 0.17, 0.12, GOLD, 12)
  prism(out, 0, 0, 0.9, 0.98, 0.045, 5, GOLD_DARK, metal)
  // the two side outlets with their caps, and the pumper outlet to the street
  for (const s of [-1, 1]) {
    nozzle(out, s, 0, 0.6, 0.15, 0.06, 0.055, metal)
  }
  nozzle(out, 0, 1, 0.42, 0.145, 0.09, 0.075, metal)
  // the plaque in the pavement before it
  box(out, 0, 0.012, 0.75, 0.3, 0.012, 0.2, BRONZE, metal)
  box(out, 0, 0.026, 0.75, 0.24, 0.004, 0.14, [0.5, 0.38, 0.2], metal)
}

/** A round outlet out of the barrel along (sx, sz), its hexagonal cap and the chain lug. */
function nozzle(out: MeshBuilder, sx: number, sz: number, y: number, from: number, len: number, r: number, tag: number): void {
  const N = 10
  const ring = (d: number, rr: number): [number, number, number][] => Array.from({ length: N }, (_, k) => {
    const a = (k / N) * Math.PI * 2
    // the outlet's axis is (sx, 0, sz): the ring is in the plane across it
    const u = Math.cos(a) * rr, v = Math.sin(a) * rr
    return [sx * d + (sz !== 0 ? u : 0), y + v, sz * d + (sx !== 0 ? u : 0)]
  })
  const seg = (d0: number, d1: number, r0: number, r1: number, c: Rgb): void => {
    const A = ring(d0, r0), B = ring(d1, r1)
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N
      const mx = (A[k][0] + A[k1][0]) / 2 - sx * d0, my = (A[k][1] + A[k1][1]) / 2 - y, mz = (A[k][2] + A[k1][2]) / 2 - sz * d0
      const L = Math.hypot(mx, my, mz) || 1
      out.quad([A[k], A[k1], B[k1], B[k]], [mx / L, my / L, mz / L], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
    const C: [number, number, number] = [sx * d1, y, sz * d1]
    for (let k = 0; k < N; k++) out.quad([B[k], B[(k + 1) % N], C, C], [sx, 0, sz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  seg(from - 0.02, from + len, r, r, GOLD)
  seg(from + len, from + len + 0.035, r * 1.25, r * 1.25, GOLD_DARK)
}

export const GOLDEN_HYDRANT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { goldenHydrant }
