/**
 * The PISCINE GEORGES-VALLEREY, the Piscine des Tourelles of the 1924 Olympics, renovated by Roger Taillibert in 1986–89 and
 * again for 2024 (Wikipedia fr: a 50 × 21 m pool, 1,500 seats, a glass roof). OSM: relation/1103345, 86 × 56 m, buttressed.
 *
 * From the Avenue Gambetta (Commons "Piscine Georges Vallerey, Paris 8 April 2017" and the two of 2024-11-01): the END of a great
 * BARREL VAULT of glass with a pale green-grey rim, standing over square beige masses of Taillibert's; below it, on the
 * avenue, a tall glazed bay between two great round white columns, and the name over dark blue doors; to the right the
 * pale green faceted TOWER with its round window, and dark blue glass beyond.
 *
 * Local −z is the avenue (`front` 255), z along the vault, +x south. The vault's width and the heights are estimated from
 * the photographs: OSM's courtyard (18 × 50 m) sets where it stands.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { towerRing } from '../../tower.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { clamp, edgesOf, row, sheet, walls } from './shell.ts'

const BEIGE: Rgb = [0.74, 0.7, 0.62]
const BEIGE_DK: Rgb = [0.62, 0.58, 0.51]
const WHITE: Rgb = [0.9, 0.9, 0.88]
const GLASS: Rgb = [0.13, 0.22, 0.34]
const VAULT: Rgb = [0.2, 0.3, 0.4]
const VAULT2: Rgb = [0.26, 0.37, 0.47]
const RIM: Rgb = [0.56, 0.64, 0.6]
const TOWER: Rgb = [0.63, 0.7, 0.62]
const BLUE: Rgb = [0.08, 0.17, 0.42]
const ROOF: Rgb = [0.5, 0.49, 0.46]

export function piscineVallerey(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const g = groundMid(fit)
  const hx = clamp(fit.hx, 12, 32)
  const hz = clamp(fit.hz, 20, 48)
  const ring = towerRing(fit)
  const H = g + 13

  // ---- the beige masses on OSM's buttressed outline, with deep dark blue slots of window between the buttresses
  walls(out, ring, g - 0.5, H, BEIGE, conc)
  capPolygon(out, ring, H, ROOF, conc)
  for (const e of edgesOf(ring)) {
    if (e.L < 3) continue
    sheet(out, e, 0, e.L, H - 0.7, H, 0.14, BEIGE_DK, conc)
    if (e.L > 9) {
      sheet(out, e, 1, e.L - 1, g + 5, g + 10, 0.05, GLASS, glass)
      row(out, e, g + 5, 5, 3, 0.2, 0.1, BEIGE_DK, metal, 1)
    }
  }

  // ---- the barrel vault along z: glass strips between pale ribs, over the pool
  const R = hx * 0.62
  const rise = 8
  const spring = H + 0.6
  const z0 = -hz * 0.74
  const z1 = hz * 0.7
  const at = (a: number, z: number, dr = 0): V3 => [Math.cos(a) * (R + dr), spring + (Math.sin(a) * rise * (R + dr)) / R, z]
  const seg = 14
  const bays = 13
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const n: V3 = [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0]
    quadN(out, [at(a0, z0), at(a1, z0), at(a1, z1), at(a0, z1)], n, i % 2 ? VAULT : VAULT2, glass)
    // the end lunettes, glass with radial bars
    for (const [z, s] of [[z0, -1], [z1, 1]] as [number, number][]) {
      quadN(out, [[0, spring, z], at(a0, z), at(a1, z), at(a1, z)], [0, 0, s], GLASS, glass)
      strut(out, [0, spring, z + s * 0.1], at(a0, z + s * 0.1), 0.18, 0.18, RIM, metal, false)
    }
  }
  for (let b = 0; b <= bays; b++) {
    const z = z0 + ((z1 - z0) * b) / bays
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI
      const a1 = ((i + 1) / seg) * Math.PI
      strut(out, at(a0, z, 0.1), at(a1, z, 0.1), 0.22, 0.22, RIM, metal, false)
    }
  }
  for (let i = 1; i < seg; i += 2) strut(out, at((i / seg) * Math.PI, z0, 0.12), at((i / seg) * Math.PI, z1, 0.12), 0.14, 0.14, RIM, metal, false)
  // the thick rim round each end, and the footings along each side
  for (const z of [z0, z1]) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI
      const a1 = ((i + 1) / seg) * Math.PI
      strut(out, at(a0, z, 0.5), at(a1, z, 0.5), 1.1, 0.9, RIM, metal, false)
    }
  }
  for (const s of [-1, 1]) box(out, s * R, H + 0.3, (z0 + z1) / 2, 0.9, 0.8, (z1 - z0) / 2 + 0.5, RIM, metal)

  // ---- the avenue's front: the tall glazed bay between the two white columns, the deep lintel over it, the name
  const zf = -hz
  const bw = hx * 0.42
  box(out, 0, g + 5.2, zf - 0.05, bw, 5.8, 0.05, GLASS, glass)
  for (let i = 0; i <= 8; i++) box(out, -bw + (2 * bw * i) / 8, g + 5.2, zf - 0.14, 0.1, 5.8, 0.06, WHITE, metal)
  for (const y of [g + 3.4, g + 7]) box(out, 0, y, zf - 0.14, bw, 0.08, 0.06, WHITE, metal)
  for (const s of [-1, 1]) {
    prism(out, s * (bw + 1.1), zf - 1.8, g - 0.5, H - 2.2, 1.45, 16, WHITE, conc)
    box(out, s * (bw + 4.2), g + 5.6, zf - 0.8, 2.4, 6.1, 0.8, BEIGE, conc)
  }
  box(out, 0, H - 1.1, zf - 2, bw + 6.6, 1.2, 2, BEIGE, conc)
  box(out, 0, g + 3.7, zf - 0.28, bw - 0.4, 0.55, 0.1, WHITE, conc)
  signText(out, 'PISCINE GEORGES VALLEREY', 0, g + 3.7, zf - 0.4, 0.62, [0.08, 0.14, 0.32], { heading: Math.PI })
  box(out, 0, g + 1.5, zf - 0.2, bw - 0.6, 1.9, 0.08, BLUE, metal)

  // ---- the green tower on the avenue's south corner: eight flat faces, its round window, a dark blue foot; the blue glass beyond
  const tx = hx * 0.76
  const tz = -hz + 7
  prism(out, tx, tz, g - 0.5, g + 2.6, 7.4, 8, BLUE, metal)
  prism(out, tx, tz, g + 2.6, g + 21, 7.2, 8, TOWER, metal)
  prism(out, tx, tz, g + 21, g + 21.5, 6.8, 8, RIM, metal)
  prism(out, tx, tz, g + 21.5, g + 22.2, 3.5, 8, ROOF, conc)
  // the window on its west face, a white ring and the dark round
  for (const [r, c, z] of [[2.5, WHITE, 0.08], [2, GLASS, 0.14]] as [number, Rgb, number][]) {
    const m = 16
    for (let i = 0; i < m; i++) {
      const a0 = (i / m) * Math.PI * 2
      const a1 = ((i + 1) / m) * Math.PI * 2
      const y = g + 5.4
      const zw = tz - 7.2 * Math.cos(Math.PI / 8) - z
      quadN(out, [[tx, y, zw], [tx + Math.cos(a0) * r, y + Math.sin(a0) * r, zw], [tx + Math.cos(a1) * r, y + Math.sin(a1) * r, zw], [tx + Math.cos(a1) * r, y + Math.sin(a1) * r, zw]], [0, 0, -1], c, glass)
    }
  }
  box(out, hx * 0.86, g + 10, -hz + 26, hx * 0.16, 10, 9, GLASS, glass)
}
