/**
 * THE WEST SIDE OF THE ARÈNES DE LUTÈCE (owner, 2026-10-31: "the arenes de lutece has a building cutting off a side. that side is a genuine old stone wall, there are no windows pointing in to the arena"). The houses of the Rue Monge were built across the amphitheatre's west side in the 1860s (fr.wikipedia: they "ne permettent pas de compléter la cavea") and the arena ends against their back: OSM's row, way/40447203–208 and relation/236905, whose east edges are the site's own edge, between the south-west and the north tiers. The city raised it as seven storeys of Haussmann windows right on the sand.
 * Now, on OSM's outline: on every face turned to the arena a wall of rough coursed rubble, 10 m over the sand (Commons "Arenes de Lutece April 24, 2012" and "Arènes de Lutèce, Paris 15 August 2013 007": a man on the sand scales it at about ten), patched and stained, capped, its low footing carrying on the arena's ring of stone; over that the houses' blind pale render to their eaves, under slates. No window on those faces, as the owner has it. (Those photographs do show a few windows in the houses high above the wall: said so in the batch's report.) The faces turned away, on the houses' own courts, keep their windows.
 * front 180: x east, z north, in metres from the outline's centre, read off OSM's rings.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { prism, strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'

const LAT = 48.845047, LON = 2.352361, MX = 73290, MZ = 111320
const L = (la: number, lo: number): [number, number] => [(lo - LON) * MX, (la - LAT) * MZ]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/** the faces turned to the arena, north to south (OSM's nodes along the row's east side, the little notches left out) */
const EAST: [number, number][] = [
  L(48.845599, 2.352419), L(48.845486, 2.352461), L(48.845469, 2.352357), L(48.845311, 2.352413), L(48.84518, 2.352461), L(48.845014, 2.352521), L(48.844916, 2.352556),
  L(48.844887, 2.352569), L(48.844755, 2.352567), L(48.844678, 2.352565), L(48.844495, 2.352558),
]
/** and the row's far side, south to north, which looks into the Rue Monge's courts */
const WEST: [number, number][] = [
  L(48.844513, 2.352532), L(48.844622, 2.352493), L(48.844738, 2.35245), L(48.844861, 2.352406), L(48.844987, 2.35236), L(48.845153, 2.352299), L(48.845284, 2.352251), L(48.845442, 2.352194), L(48.845555, 2.352153),
]
const RUBBLE = hex('#8d846f'), MORTAR = hex('#75705f'), RENDER = hex('#b3ab98'), SLATE = hex('#4b5257'), GLASS: Rgb = [0.17, 0.19, 0.21], CAP = hex('#a39a82')
const WALL = 10, EAVES = 21

/** A flat quad on a wall from a to b, s0..s1 along it, y0..y1, `d` out along (nx, nz). */
function patch(out: MeshBuilder, a: [number, number], ux: number, uz: number, nx: number, nz: number, s0: number, s1: number, y0: number, y1: number, d: number, c: Rgb): void {
  const P = (s: number, y: number): [number, number, number] => [a[0] + ux * s + nx * d, y, a[1] + uz * s + nz * d]
  out.quad([P(s0, y0), P(s1, y0), P(s1, y1), P(s0, y1)], [nx, 0, nz], UV, c, 0)
}

export function arenesWestWall(out: MeshBuilder, fit: Fit): void {
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
  const low = Math.min(...EAST.map(([x, z]) => G(x, z)))
  const topWall = low + WALL, eaves = low + EAVES
  // the arena's faces. Each runs clockwise seen from above, so its outward side is to its left going south
  for (let i = 0; i + 1 < EAST.length; i++) {
    const a = EAST[i], b = EAST[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 0.5) continue
    const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, nx = -uz, nz = ux
    // (outward: away from the row's far side)
    const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], w = WEST[Math.round(((WEST.length - 1) * (EAST.length - 2 - i)) / (EAST.length - 2))]
    const s = (m[0] - w[0]) * nx + (m[1] - w[1]) * nz >= 0 ? 1 : -1
    const ox = nx * s, oz = nz * s
    const y0 = Math.min(G(a[0], a[1]), G(b[0], b[1])) - 0.6
    patch(out, a, ux, uz, ox, oz, 0, len, y0, topWall, 0, MORTAR)
    patch(out, a, ux, uz, ox, oz, 0, len, topWall, eaves, 0, RENDER)
    // the rubble: courses of rough stones of no one size, proud of their mortar by a hand's breadth, here and there one gone
    let c = 0
    for (let y = y0 + 0.1; y < topWall - 0.1;) {
      const h = 0.34 + hash(c, i) * 0.26
      let t = hash(c + 3, i) * 0.5
      let k = 0
      while (t < len) {
        const l = 0.55 + hash(c + k * 0.37, i + 1) * 1.05, r = hash(k + i * 7, c)
        if (r > 0.07) {
          const v = 0.86 + hash(k, c + i) * 0.28
          // (a late rebuilt patch of paler stones low down, a darker damp run under the old coping)
          const f = y > topWall - 2 ? v * 0.86 : y < y0 + 3 && (t + i * 5) % 11 < 3 ? v * 1.1 : v
          patch(out, a, ux, uz, ox, oz, t, Math.min(len, t + l - 0.05), y, y + h - 0.05, 0.05 + hash(r, k) * 0.07, shade(RUBBLE, f))
        }
        t += l
        k++
      }
      y += h
      c++
    }
    // the coping, the old set-back
    strut(out, [a[0] + ox * 0.15, topWall + 0.14, a[1] + oz * 0.15], [b[0] + ox * 0.15, topWall + 0.14, b[1] + oz * 0.15], 0.5, 0.3, CAP, 0, false)
    // the eaves' gutter
    patch(out, a, ux, uz, ox, oz, 0, len, eaves - 0.3, eaves, 0.1, shade(RENDER, 1.08))
    // its low footing on the sand: the arena's ring of rough stone come round
    strut(out, [a[0] + ox * 0.65, y0 + 0.9, a[1] + oz * 0.65], [b[0] + ox * 0.65, y0 + 0.9, b[1] + oz * 0.65], 1.3, 1.8, shade(RUBBLE, 0.95), 0, false)
  }
  // the far faces, with the houses' windows, and the row's two ends
  const far: [number, number][] = [EAST[EAST.length - 1], ...WEST, EAST[0]]
  for (let i = 0; i + 1 < far.length; i++) {
    const a = far[i], b = far[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 0.5) continue
    const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len
    // (south to north along the west side: outward is west)
    const nx = -uz < 0 ? -uz : uz, nz = -uz < 0 ? ux : -ux
    const y0 = low - 0.6
    patch(out, a, ux, uz, nx, nz, 0, len, y0, eaves, 0, RENDER)
    for (let y = low + 3; y < eaves - 2; y += 3) for (let s = 2; s < len - 1.4; s += 3.6) patch(out, a, ux, uz, nx, nz, s - 0.65, s + 0.65, y, y + 1.8, 0.05, GLASS)
  }
  // the roof: a lid at the eaves and the row's long slate back along its middle, chimneys on it
  const poly = [...EAST, ...WEST].map(([x, z]) => ({ x, z }))
  let area = 0
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; area += p.x * q.z - q.x * p.z }
  capPolygonWithHoles(out, [area > 0 ? poly : [...poly].reverse()], eaves, shade(SLATE, 1.1), 0)
  for (let i = 0; i < WEST.length - 1; i++) {
    const j = EAST.length - 1 - i - (i > 3 ? 1 : 0)
    const a = WEST[i], e0 = EAST[Math.max(2, j)], b = WEST[i + 1], e1 = EAST[Math.max(2, j - 1)]
    const ma: [number, number, number] = [(a[0] + e0[0]) / 2, eaves + 1.1, (a[1] + e0[1]) / 2], mb: [number, number, number] = [(b[0] + e1[0]) / 2, eaves + 1.1, (b[1] + e1[1]) / 2]
    strut(out, ma, mb, 10, 2.2, SLATE, 0, true)
    prism(out, mb[0] + 2, mb[2] + 2, eaves + 1, eaves + 4, 0.6, 4, shade(RENDER, 0.82))
  }
}
