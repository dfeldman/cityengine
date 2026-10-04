/**
 * THE FERRY BUILDING'S SOUTH GATES, E, F AND G (the 2019–2021 Downtown Ferry Terminal expansion), owner 2026-10-03:
 * "the pier by the Ferry Building where the ferries actually dock needs tons of work" — bare grey gangways out to
 * T-shaped walks over the water. From Commons ("Three new gates at the Ferry Building, July 2020", "Newly opened
 * Gate F at the Ferry Building, February 2019"): at the head of each gangway a grey granite GATE kiosk, its name
 * cut over the doors under a pedimented cap and a stainless "SAN FRANCISCO BAY FERRY" marquee; the gangway a covered
 * bridge of white steel trusses under a white arched roof, sloping down to the FLOAT — a dark steel barge held by
 * tall white guide piles, a white arched canopy over its boarding end.
 *
 * Built in the WORLD's own axes about one point (front 180: local x east, z north; its footprint box covers the floats
 * and the gangways' far ends, clear of the Ferry Station Post Office), from OSM: the floats are ways
 * 23623549 (E), 661723971 (F), 661723973 (G); the gangways the package's foot bridges 80426 (E), 80425 (F), 80424 (G),
 * whose own heights the trusses and the gangway floor follow. The entry is `coversRaised`: the gangways' floors are
 * the model's; on the floats the city still draws the walks (sea + 0.5) over the model's deck, without their walls.
 * y = 0 is the sea (`deckAbove: 0`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand } from '../tower.ts'
import { boxAlong, signText } from '../parts.ts'
import { FERRY_GANGWAYS, FERRY_GATES_ORIGIN, gangwayY } from '../../../city/sf/bridges.ts'

const ORIGIN = FERRY_GATES_ORIGIN
const SEA = -84.51
const WHITE: Rgb = [0.92, 0.93, 0.92]
const GRANITE: Rgb = [0.6, 0.61, 0.6]
const STEEL: Rgb = [0.2, 0.21, 0.22]
const STAINLESS: Rgb = [0.72, 0.74, 0.75]

type P3 = [number, number, number]
/** world x, z and package height → the model's frame */
const at = (x: number, z: number, h: number): P3 => [x - ORIGIN.x, h - SEA, z - ORIGIN.z]

interface Gate { name: string; float: [number, number][]; gangway: [number, number, number][] }
/** a gangway's line, kiosk to float, in six points on the declared profile (src/city/sf/bridges.ts) */
function line(gate: string): [number, number, number][] {
  const g = FERRY_GANGWAYS.find((q) => q.gate === gate)!
  const pts: [number, number, number][] = []
  for (let k = 0; k <= 5; k++) {
    const t = k / 5
    pts.push([g.from[0] + (g.to[0] - g.from[0]) * t, g.from[1] + (g.to[1] - g.from[1]) * t, gangwayY(t)])
  }
  return pts
}
const GATES: Gate[] = [
  { name: 'E',
    float: [[1782.4, 217.6], [1815, 241.4], [1807.3, 251.9], [1774.7, 228.1]],
    gangway: line('E') },
  { name: 'F',
    float: [[1811.2, 177], [1844.3, 201.3], [1836.7, 211.7], [1803.6, 187.3]],
    gangway: line('F') },
  { name: 'G',
    float: [[1841.3, 136.3], [1874.2, 160.5], [1866.4, 171], [1833.6, 146.9]],
    gangway: line('G') },
]

function float(out: MeshBuilder, g: Gate): void {
  const ring = g.float.map(([x, z]) => ({ x: x - ORIGIN.x, z: z - ORIGIN.z }))
  // the barge: dark steel, its deck a hand under the walks the city draws on it (sea + 0.5); the city's walls
  // along those walks are left out inside the entry's footprint (render/city.ts, `inCover`)
  faceBand(out, ring, -0.6, 0.42, { kind: 'blank', wall: STEEL, material: 'metal' })
  capPolygon(out, ring, 0.42, [0.42, 0.43, 0.43], surfaceTag('metal'))
  // the guide piles: tall white cylinders at the corners, a little in
  const c = ring.reduce((a, p) => ({ x: a.x + p.x / 4, z: a.z + p.z / 4 }), { x: 0, z: 0 })
  for (const p of ring) {
    const x = p.x + (c.x - p.x) * 0.08, z = p.z + (c.z - p.z) * 0.25
    prism(out, x, z, -1, 7.5, 0.55, 12, WHITE, surfaceTag('concrete'))
    prism(out, x, z, 7.5, 7.9, 0.6, 12, WHITE, surfaceTag('concrete'), 0.1)
  }
  // the canopy over the boarding end: a white arched roof on four posts, across the float's landward end
  const a = ring[0], b = ring[3], d = ring[1]
  const ux = (d.x - a.x), uz = (d.z - a.z), L = Math.hypot(ux, uz)
  const tx = ux / L, tz = uz / L
  const m = { x: (a.x + b.x) / 2 + tx * 9, z: (a.z + b.z) / 2 + tz * 9 }
  const wx = b.x - a.x, wz = b.z - a.z, W = Math.hypot(wx, wz) * 0.42
  const sx = wx / Math.hypot(wx, wz), sz = wz / Math.hypot(wx, wz)
  const N = 8
  for (let i = 0; i < N; i++) {
    const t0 = -1 + (2 * i) / N, t1 = -1 + (2 * (i + 1)) / N
    const y0 = 3.6 + 1.1 * Math.cos((t0 * Math.PI) / 2), y1 = 3.6 + 1.1 * Math.cos((t1 * Math.PI) / 2)
    const q = (t: number, y: number, s: number): P3 => [m.x + sx * W * t + tx * s, y, m.z + sz * W * t + tz * s]
    out.quad([q(t0, y0, -6), q(t1, y1, -6), q(t1, y1, 6), q(t0, y0, 6)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, surfaceTag('metal'))
  }
  for (const s of [-1, 1]) for (const e of [-5.5, 5.5]) strut(out, [m.x + sx * W * s * 0.95 + tx * e, 0.5, m.z + sz * W * s * 0.95 + tz * e], [m.x + sx * W * s * 0.95 + tx * e, 3.65, m.z + sz * W * s * 0.95 + tz * e], 0.2, 0.2, WHITE)
}

function gangway(out: MeshBuilder, g: Gate): void {
  const P = g.gangway.map(([x, z, h]) => at(x, z, h))
  const HW = 1.7, TOP = 2.5
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i]
    const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz)
    const nx = -dz / L, nz = dx / L
    for (const s of [-1, 1]) {
      const o = (p: P3, y: number): P3 => [p[0] + nx * HW * s, p[1] + y, p[2] + nz * HW * s]
      // the truss: top and bottom chords, a post at each end, a diagonal across
      strut(out, o(a, 0.15), o(b, 0.15), 0.14, 0.14, WHITE)
      strut(out, o(a, TOP), o(b, TOP), 0.16, 0.16, WHITE)
      strut(out, o(a, 0.15), o(a, TOP), 0.12, 0.12, WHITE)
      strut(out, o(i % 2 ? a : b, 0.15), o(i % 2 ? b : a, TOP), 0.1, 0.1, WHITE)
      // the handrail along the inside
      strut(out, o(a, 1.05), o(b, 1.05), 0.06, 0.06, STAINLESS)
    }
    // the floor: steel plate the full width, a hand over the way's own height (the city does not draw it: the entry is
    // `coversRaised`)
    const f = (p: P3, s: number): P3 => [p[0] + nx * HW * s, p[1] + 0.04, p[2] + nz * HW * s]
    out.quad([f(a, -1), f(b, -1), f(b, 1), f(a, 1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.55, 0.56, 0.56], surfaceTag('metal'))
    // the arched roof: two slopes up to a ridge
    const r = (p: P3, s: number, y: number): P3 => [p[0] + nx * (HW + 0.25) * s, p[1] + y, p[2] + nz * (HW + 0.25) * s]
    const ridge = (p: P3): P3 => [p[0], p[1] + TOP + 0.55, p[2]]
    out.quad([r(a, -1, TOP + 0.1), r(b, -1, TOP + 0.1), ridge(b), ridge(a)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, surfaceTag('metal'))
    out.quad([ridge(a), ridge(b), r(b, 1, TOP + 0.1), r(a, 1, TOP + 0.1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, surfaceTag('metal'))
  }
  // the last posts, at the float
  const z = P[P.length - 1], y = P[P.length - 2]
  const L = Math.hypot(z[0] - y[0], z[2] - y[2]), nx = -(z[2] - y[2]) / L, nz = (z[0] - y[0]) / L
  for (const s of [-1, 1]) strut(out, [z[0] + nx * HW * s, z[1] + 0.15, z[2] + nz * HW * s], [z[0] + nx * HW * s, z[1] + TOP, z[2] + nz * HW * s], 0.12, 0.12, WHITE)
}

function kiosk(out: MeshBuilder, g: Gate): void {
  const [a, b] = [at(...(g.gangway[0] as [number, number, number])), at(...(g.gangway[1] as [number, number, number]))]
  const dx = a[0] - b[0], dz = a[2] - b[2], L = Math.hypot(dx, dz)
  const fx = dx / L, fz = dz / L                        // facing the land
  const heading = Math.atan2(fx, fz)
  const nx = fz, nz = -fx                               // across the passage
  const cx = a[0] + fx * 2, cz = a[2] + fz * 2, y0 = a[1]
  const gr = surfaceTag('granite')
  // the two piers either side of the passage, the lintel and the pedimented cap over it
  for (const s of [-1, 1]) boxAlong(out, cx + nx * 2.2 * s, y0 + 2.5, cz + nz * 2.2 * s, 0.6, 2.5, 2, heading, GRANITE, gr)
  boxAlong(out, cx, y0 + 5.4, cz, 2.9, 0.45, 2.1, heading, GRANITE, gr)
  boxAlong(out, cx, y0 + 6.0, cz, 3.2, 0.15, 2.4, heading, [0.66, 0.67, 0.66], gr)
  for (let k = 0; k < 3; k++) boxAlong(out, cx, y0 + 6.4 + k * 0.3, cz, 2.6 - k * 0.85, 0.13, 2.2, heading, GRANITE, gr)
  // the marquee band over the doors, and the gate's letter cut over it, on the landward face
  boxAlong(out, cx + fx * 2.15, y0 + 4.1, cz + fz * 2.15, 2.1, 0.22, 0.25, heading, STAINLESS, surfaceTag('metal'))
  signText(out, `GATE ${g.name}`, cx + fx * 2.12, y0 + 5.35, cz + fz * 2.12, 0.55, [0.25, 0.26, 0.27], { heading })
}

export function ferryGatesEFG(out: MeshBuilder, _fit: Fit): void {
  for (const g of GATES) {
    float(out, g)
    gangway(out, g)
    kiosk(out, g)
  }
  // (a flag on Gate E's kiosk, as in the photograph)
  const e = at(1750, 202, gangwayY(0))
  box(out, e[0], e[1] + 7.8, e[2], 0.04, 1, 0.04, STAINLESS, 0)
}


/**
 * THE SOUTH BASIN DECK: the 2020 deck over the water south of the Ferry Building, from the old bulkhead (OSM's
 * coastline, 1717,142 → 1673,187) out to the gates' kiosks — OSM's pier outline 661723975, clipped to the seaward side
 * of the coastline and south of the Ferry Building's south corner (1712,215). Only the plaza's own rectangle had a deck
 * (marina.ts `plazaDeck`), so between the promenade and the plaza, and round the kiosks, the bay showed through: the
 * owner's "square of water inside the pier". Concrete at the walks' deck height (sea + 3.5, a few centimetres under the
 * plaza deck's top where they overlap), an edge beam, piles. Its own entry, `coversRaised`, so the city's walls along
 * the walks on it are left out.
 */
const BASIN: [number, number][] = [[1737.2, 198.0], [1728.2, 210.7], [1712.2, 215.2], [1673.1, 186.9], [1715.7, 143.3], [1748.9, 167.3], [1770.5, 138.1], [1791.2, 110.2], [1766.1, 91.8], [1769.1, 88.8], [1793.5, 106.7], [1797.4, 101.4], [1800.2, 99.5], [1803.5, 100.3], [1805.2, 103.2], [1804.2, 106.5], [1801.4, 110.4], [1811.4, 117.7], [1806.9, 123.8], [1796.9, 116.5], [1773.0, 149.0], [1771.6, 150.9], [1781.8, 158.4], [1777.3, 164.5], [1767.2, 157.0], [1743.2, 189.8], [1742.0, 191.4], [1752.6, 199.2], [1747.8, 205.8]]
const BASIN_ORIGIN = { x: 1755, z: 190 }
export function southBasinDeck(out: MeshBuilder, _fit: Fit): void {
  const ring = BASIN.map(([x, z]) => ({ x: x - BASIN_ORIGIN.x, z: z - BASIN_ORIGIN.z }))
  const conc = surfaceTag('concrete')
  capPolygon(out, ring, 3.44, [0.56, 0.55, 0.53], conc)
  faceBand(out, ring, 2.4, 3.44, { kind: 'blank', wall: [0.36, 0.35, 0.34], material: 'concrete' })
  // piles along the edge, every 6 m
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    for (let t = 1.5; t < L; t += 6) prism(out, a.x + ((b.x - a.x) * t) / L, a.z + ((b.z - a.z) * t) / L, -1.5, 2.4, 0.3, 6, [0.22, 0.21, 0.2], conc)
  }
}

export const FERRY_GATES: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ferryGatesEFG, southBasinDeck }
