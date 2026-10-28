/**
 * SAN FRANCISCO'S DESIGNED FOUNTAINS that OSM maps as areas the city otherwise drew as plain paving or lawn
 * (fountain census, 2026-10-05).
 *
 * The United Nations Plaza fountain is in civic/un-plaza.ts with the rest of the Civic Center (2026-10-21).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { capPolygon } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { towerRing, insetRing, faceBand } from '../tower.ts'
import { edgeAt, edgeFacing, signText } from '../parts.ts'

/**
 * THE YODA FOUNTAIN (Lawrence Noble, 2005; OSM way/1376085479, ~4.6 m round) in the Letterman Digital Arts Center's
 * court, the Presidio — Commons "Always pass on what you have learned – Yoda, Wiki Education, and guests.jpg": a low
 * round stone basin wall at bench height, a faceted tan stone pedestal in the middle with water sheeting down its
 * faces, and on top the bronze Yoda, a metre tall, leaning on his cane. Standalone.
 */
export function yodaFountain(out: MeshBuilder, _fit: Fit): void {
  const STONE: Rgb = [0.6, 0.55, 0.48], TAN: Rgb = [0.72, 0.64, 0.52], FLOOR: Rgb = [0.2, 0.25, 0.26], BRONZE: Rgb = [0.38, 0.4, 0.33]
  const st = surfaceTag('granite'), metal = surfaceTag('metal')
  // the basin wall (a ring of segments), its dark floor, and the water inside it (render/water.ts; was a glass disc)
  const n = 20
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    box(out, Math.cos(a) * 2.15, 0.27, Math.sin(a) * 2.15, 0.36, 0.27, 0.22, STONE, st)
  }
  prism(out, 0, 0, 0, 0.06, 1.97, 20, FLOOR, 0)
  const POOL = 0.3
  out.water.push({ kind: 'pool', ring: Array.from({ length: 20 }, (_, k) => ({ x: Math.sin((k / 20) * Math.PI * 2) * 1.97, z: Math.cos((k / 20) * Math.PI * 2) * 1.97 })), y: POOL })
  // the pedestal: a broad faceted block, then a narrower cap
  prism(out, 0, 0, POOL, 1.25, 0.95, 6, TAN, st, 0.75)
  prism(out, 0, 0, 1.25, 1.55, 0.6, 6, TAN, st, 0.55)
  /*
   * The water out from under the cap, sheeting down every face of the block into the basin (were white boxes standing
   * off three faces). Each sheet leaves the block's top edge just fast enough to follow the face out 0.2 m as it falls.
   */
  const lip = (k: number): [number, number, number] => [Math.sin((k / 6) * Math.PI * 2) * 0.77, 1.25, Math.cos((k / 6) * Math.PI * 2) * 0.77]
  for (let k = 0; k < 6; k++) {
    const p = lip(k + 1), q = lip(k)
    const a: [number, number, number] = [p[0] * 0.92 + q[0] * 0.08, 1.25, p[2] * 0.92 + q[2] * 0.08]
    const b: [number, number, number] = [q[0] * 0.92 + p[0] * 0.08, 1.25, q[2] * 0.92 + p[2] * 0.08]
    out.water.push({ kind: 'sheet', a, b, out: 0.5, drop: 1.25 - POOL })
  }
  out.water.push({ kind: 'splash', at: [0, POOL + 0.01, 0], r: 1.35 })
  // Yoda: the robe, the head with its long ears, the cane
  prism(out, 0, 0, 1.55, 2.35, 0.36, 8, BRONZE, metal, 0.2)
  prism(out, 0, 0, 2.35, 2.65, 0.2, 8, BRONZE, metal, 0.17)
  for (const s of [-1, 1]) strut(out, [s * 0.12, 2.55, 0], [s * 0.5, 2.68, -0.04], 0.16, 0.04, BRONZE, metal)
  strut(out, [0.24, 1.55, 0.16], [0.26, 2.2, 0.14], 0.05, 0.05, BRONZE, metal)
}

/**
 * THE SAN FRANCISCO MINT, 155 Hermann Street (Gilbert Stanley Underwood, 1937; way/115944818). Commons "NRIS 88000026
 * Mint Building - Duboce St Elevation.jpg" (2026-10-05): a white granite Stripped Classical fortress on the rock
 * outcrop over Duboce and Market. One tall storey of narrow window bays between flat piers, each pier with a roundel
 * at its head, plain end pavilions with a single window, a high attic lettered UNITED STATES MINT with a row of small
 * square windows, a flagpole — all standing on a massive rubble-stone retaining wall about 12 m high, which is the
 * building's whole silhouette from the street. The terrain under it is the flattened summit of BUGS #260, so the rock
 * and the wall are drawn here, the building raised on them. Front 180: Duboce is south.
 */
export function sanFranciscoMint(out: MeshBuilder, fit: Fit): void {
  const GRANITE: Rgb = [0.86, 0.86, 0.84], SHADE: Rgb = [0.74, 0.74, 0.72], GLASS: Rgb = [0.13, 0.16, 0.2]
  const RUBBLE: Rgb = [0.4, 0.36, 0.31], ROCK: Rgb = [0.42, 0.4, 0.37]
  const st = surfaceTag('granite')
  const ring = towerRing(fit)
  const ROCKH = 12
  // the outcrop and its rubble wall: the outline pushed out 4 m, from below ground to the building's floor
  const wall = insetRing(ring, -4)
  faceBand(out, wall, -2, ROCKH, { kind: 'blank', wall: RUBBLE, material: 'granite' })
  capPolygon(out, wall.map((p) => ({ x: p.x, z: p.z })), ROCKH, ROCK, surfaceTag('concrete'))
  // the building: the tall window storey, the attic, the parapet rail
  const B = ROCKH, H1 = 13, ATT = 6
  faceBand(out, ring, B, B + H1, { kind: 'fins', wall: GRANITE, glass: GLASS, pitch: 3.6, solid: 0.55, depth: 0.25, floor: H1, material: 'granite' })
  faceBand(out, ring, B + H1, B + H1 + 0.7, { kind: 'blank', wall: SHADE, material: 'granite' })
  faceBand(out, insetRing(ring, 1.2), B + H1 + 0.7, B + H1 + 0.7 + ATT, { kind: 'punched', wall: GRANITE, glass: GLASS, pitch: 4.2, solid: 0.88, floor: ATT, material: 'granite' })
  capPolygon(out, insetRing(ring, 1.2).map((p) => ({ x: p.x, z: p.z })), B + H1 + 0.7 + ATT, [0.55, 0.55, 0.55], surfaceTag('concrete'))
  capPolygon(out, ring.map((p) => ({ x: p.x, z: p.z })), B + H1 + 0.7, SHADE, st)
  // the lettering and the flagpole over the front
  const e = edgeAt(ring, edgeFacing(ring))
  signText(out, 'UNITED STATES MINT', e.mid.x + e.nx * 0.06, B + H1 - 1.4, e.mid.z + e.nz * 0.06, 0.8, [0.6, 0.6, 0.58], { heading: e.heading })
  box(out, e.mid.x - e.nx * 6, B + H1 + 0.7 + ATT + 5, e.mid.z - e.nz * 6, 0.07, 5, 0.07, [0.8, 0.8, 0.8], surfaceTag('metal'))
  box(out, e.mid.x - e.nx * 6 + e.tx * 1.1, B + H1 + 0.7 + ATT + 9.2, e.mid.z - e.nz * 6 + e.tz * 1.1, 1, 0.6, 0.02, [0.7, 0.18, 0.16], 0)
}

/**
 * LEVI'S PLAZA FOUNTAIN (Lawrence Halprin, 1982), in the hard plaza between the Levi Strauss buildings off Battery
 * Street (OSM node/2219695172 in the plaza way/25751236). Fountain census 2026-10-05, from Commons "Levi's Plaza Park
 * (hard, fountain pano).jpg": a broad shallow pool in a plain concrete coping, crossed by low weirs of brown granite
 * the water spills over in sheets; at its head a stepped granite pyramid climbed by a stair, a jet on its top; flat
 * stepping slabs and a big planter block of clipped green in the water. Was bare paving. Local x the pool's length,
 * the pyramid at +x.
 */
export function leviPlazaFountain(out: MeshBuilder, fit: Fit): void {
  const CONC: Rgb = [0.74, 0.72, 0.68], GRANITE: Rgb = [0.4, 0.33, 0.28], PALE: Rgb = [0.68, 0.64, 0.58]
  const FLOOR: Rgb = [0.24, 0.28, 0.27], HEDGE: Rgb = [0.2, 0.33, 0.18]
  const conc = surfaceTag('concrete'), st = surfaceTag('granite')
  const hx = Math.max(8, fit.hx), hz = Math.max(6, fit.hz)
  const ring = towerRing(fit)
  // the coping, knee high, and the water a hand under its top
  faceBand(out, ring, 0, 0.5, { kind: 'blank', wall: CONC, material: 'concrete' })
  faceBand(out, insetRing(ring, 0.6), 0, 0.5, { kind: 'blank', wall: CONC, material: 'concrete' })
  for (const [a, b] of [[ring, insetRing(ring, 0.6)]] as const) {
    for (let i = 0; i < 4; i++) {
      const p = a[i], q = a[(i + 1) % 4], P = b[i], Q = b[(i + 1) % 4]
      out.quad([[p.x, 0.5, p.z], [q.x, 0.5, q.z], [Q.x, 0.5, Q.z], [P.x, 0.5, P.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CONC, conc)
    }
  }
  /*
   * THE WATER is moving water (render/water.ts), as the Music Concourse's: the pool, the jet, and sheets over every lip
   * — the pyramid's tiers and the weirs — white where they land. (Were a glass-tagged cap, a white stick with four
   * white struts falling off it, and white boxes standing on the stone.)
   */
  const POOL = 0.38
  capPolygon(out, insetRing(ring, 0.6), 0.05, FLOOR, 0)
  out.water.push({ kind: 'pool', ring: insetRing(ring, 0.6).map((p) => ({ x: p.x, z: p.z })), y: POOL, colour: [0.2, 0.32, 0.33] })
  /** a sheet over a straight lip centred on (x, z), `half` long, leaving square to it toward (nx, nz) */
  const over = (x: number, y: number, z: number, nx: number, nz: number, half: number, drop: number): void => {
    out.water.push({ kind: 'sheet', a: [x + nz * half, y, z - nx * half], b: [x - nz * half, y, z + nx * half], out: 0.4, drop })
  }
  // the stepped pyramid at the head, a stair up its front
  const px = hx - 5
  const tiers = [[4.2, 0.7], [3.3, 1.3], [2.4, 1.9], [1.5, 2.5]]
  let y0 = 0
  for (const [r, y1] of tiers) { box(out, px, (y0 + y1) / 2, 0, r, (y1 - y0) / 2, r, GRANITE, st); y0 = y1 }
  for (let k = 0; k < 6; k++) box(out, px - 4.2 - 0.35 - k * 0.45, 0.25 + (5 - k) * 0.38, 0, 0.23, 0.25 + (5 - k) * 0.19 + 0.01, 1.1, PALE, conc)
  // the jet on top, standing 2.7 m and falling back onto it (vy = √(2gh))
  const TOP = 2.5 + 0.02
  out.water.push({ kind: 'jet', at: [px, TOP, 0], v: [0, Math.sqrt(2 * 9.81 * 2.7), 0], width: 0.1, spread: 0.6, land: TOP })
  out.water.push({ kind: 'splash', at: [px, TOP + 0.01, 0], r: 1.1 })
  // the water running off it down the tiers on the three water sides (the stair side is dry): a skin of water on each
  // tread, a sheet over each tier's edge onto the one below, the lowest into the pool
  for (const [i, [r, y1]] of tiers.entries()) {
    const yw = y1 + 0.02, below = i === 0 ? POOL : tiers[i - 1][1] + 0.02
    const ru = i + 1 < tiers.length ? tiers[i + 1][0] : 0
    const rect = (x0: number, x1: number, z0: number, z1: number): void =>
      void out.water.push({ kind: 'pool', ring: [{ x: px + x0, z: z0 }, { x: px + x1, z: z0 }, { x: px + x1, z: z1 }, { x: px + x0, z: z1 }], y: yw })
    if (ru) { rect(-r, r, ru, r); rect(-r, r, -r, -ru); rect(ru, r, -ru, ru) } else rect(-r, r, -r, r)
    over(px + r + 0.02, yw, 0, 1, 0, r * 0.85, yw - below)
    for (const sg of [-1, 1]) over(px + r * 0.1, yw, sg * (r + 0.02), 0, sg, r * 0.85, yw - below)
    if (i === 0) for (const sg of [-1, 1]) out.water.push({ kind: 'splash', at: [px, POOL + 0.01, sg * (r + 0.3)], r: 1.2 })
  }
  out.water.push({ kind: 'splash', at: [px + 4.5, POOL + 0.01, 0], r: 1.2 })
  // the weirs: low brown granite walls across the pool, the water running over their tops and sheeting down the far face
  const weirs: [number, number, number, number][] = [[-hx * 0.15, -hz * 0.35, hz * 0.5, 0.85], [hx * 0.25, hz * 0.3, hz * 0.45, 0.75], [-hx * 0.55, hz * 0.2, hz * 0.4, 0.65]]
  for (const [x, z, half, top] of weirs) {
    box(out, x, top / 2, z, 0.45, top / 2, half, GRANITE, st)
    const yw = top + 0.02, h = half * 0.85
    out.water.push({ kind: 'pool', ring: [{ x: x - 0.45, z: z - h }, { x: x + 0.45, z: z - h }, { x: x + 0.45, z: z + h }, { x: x - 0.45, z: z + h }], y: yw })
    over(x - 0.47, yw, z, -1, 0, h, yw - POOL)
    for (let k = -1; k <= 1; k++) out.water.push({ kind: 'splash', at: [x - 0.75, POOL + 0.01, z + k * h * 0.6], r: 0.6 })
  }
  // the stepping slabs and the planter block
  for (let k = 0; k < 7; k++) box(out, -hx * 0.8 + k * 1.5, 0.45, -hz * 0.65 + (k % 2) * 0.6, 0.6, 0.07, 0.6, PALE, conc)
  box(out, -hx * 0.35, 0.6, hz * 0.62, 2.2, 0.6, 1.6, CONC, conc)
  box(out, -hx * 0.35, 1.55, hz * 0.62, 2, 0.35, 1.4, HEDGE, 0)
}

/**
 * AURORA (Ruth Asawa, 1986; OSM node/2840131401 and the basin way/1168879938, ~6.6 m round), on the Embarcadero at
 * Howard. Fountain census 2026-10-05, from Commons "Aurora sculpture Asawa.jpg" (Wikidata Q28451422): a ring some
 * 4.5 m high standing on its edge, folded from stainless steel like paper — a chain of sharp pyramidal facets, deep
 * then shallow, all the way round — in a round basin tiled deep blue, framing the Bay Bridge. The ring stands in the
 * local x–y plane, looking along z.
 */
export function auroraFountain(out: MeshBuilder, fit: Fit): void {
  const STEEL: Rgb = [0.74, 0.76, 0.78], TILE: Rgb = [0.16, 0.24, 0.52], RIM: Rgb = [0.78, 0.76, 0.72]
  const R = Math.max(2.8, Math.min(fit.hx, fit.hz))
  prism(out, 0, 0, 0, 0.45, R, 24, RIM, surfaceTag('concrete'))
  prism(out, 0, 0, 0.44, 0.47, R - 0.3, 24, TILE, surfaceTag('tile'))
  const C = 2.7, rIn = 1.3, rOut = 2.35, N = 24
  const metal = surfaceTag('metal')
  // each station round the ring a diamond across it — inner, front, outer, back — alternately deep and shallow, so the
  // skin between them folds into facets
  const station = (i: number): [number, number, number][] => {
    const a = (i / N) * Math.PI * 2
    const deep = i % 2 === 0
    const d = deep ? 0.75 : 0.18, rm = deep ? (rIn + rOut) / 2 + 0.15 : (rIn + rOut) / 2 - 0.1
    const ri = deep ? rIn - 0.15 : rIn + 0.2, ro = deep ? rOut + 0.25 : rOut - 0.1
    const P = (r: number, z: number): [number, number, number] => [Math.cos(a) * r, C + Math.sin(a) * r, z]
    return [P(ri, 0), P(rm, d), P(ro, 0), P(rm, -d)]
  }
  const nrm = (p: [number, number, number][]): [number, number, number] => {
    const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], v = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]]
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  }
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < N; i++) {
    const A = station(i), B = station(i + 1)
    for (let k = 0; k < 4; k++) {
      const q: [number, number, number][] = [A[k], B[k], B[(k + 1) % 4], A[(k + 1) % 4]]
      out.quad(q, nrm(q), UV, STEEL, metal)
      const r: [number, number, number][] = [q[3], q[2], q[1], q[0]]
      out.quad(r, nrm(r), UV, STEEL, metal)
    }
  }
}

export const FOUNTAINS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { yodaFountain, sanFranciscoMint, leviPlazaFountain, auroraFountain }
