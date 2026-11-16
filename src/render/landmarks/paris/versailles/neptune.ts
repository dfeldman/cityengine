/**
 * THE BASSIN DE NEPTUNE (Le Nôtre 1679–81, remade by Le Bouteux and Hardouin-Mansart; OSM way/196502843 "Bassin de Neptune"):
 * the great basin at the north end of the gardens, below the Allée d'Eau and the Dragon. Its straight south side is a dressed-stone
 * retaining wall, a pilastered front over a plinth, a string course and a cornice, the tablette on top a balustrade with 22 lead
 * vases on piers and, on the face, plinths for the great lead groups (Neptune and Amphitrite in the middle, Proteus and the Ocean
 * either side; the statues are not here). A terrace runs behind it, stairs at either end, and grass slopes fall to the park. Round
 * the rest of the basin's rim the turf rises in terraces behind a stone curb. Small sheets (lames) drop from the string course into
 * the basin all along the wall; the basin's own jets come from tools/versailles-fountains.py.
 *
 * The wall is the longest straight edge of the footprint's hull (OSM's ring), the basin on its centroid's side. Frame: x east, z north
 * (front 180). Tunables are the constants below.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, lathe, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'

type P2 = { x: number; z: number }

const NEPTUNE = {
  /** the wall: height over the basin edge, thickness, the share of its length the ends keep clear (m), the plinth course's height and projection */
  wall: 4.2, thick: 2.4, endClear: 1.2, plinth: 1.1, plinthOut: 0.3,
  /** the string course: its height as a share of the wall, projection and thickness; the cornice's height and projection */
  string: 0.58, stringOut: 0.2, stringH: 0.3, cornice: 0.5, corniceOut: 0.45,
  /** pilasters between the bays: width, projection; the bays' spacing is the vases' */
  pilaster: 0.7, pilasterOut: 0.22,
  /** the tablette's balustrade: height, baluster spacing and section, rail height; the vases: count, pier width and height, urn height and radius */
  bal: { h: 1.05, step: 0.55, sec: 0.12, rail: 0.14 },
  vases: { count: 22, pier: 0.9, pierH: 1.35, urn: 1.9, r: 0.42 },
  /** the plinths for the groups on the wall's face: offset along the wall from the middle (m), width, height over the basin edge, projection into the basin */
  groups: [{ u: 0, w: 9, h: 2.6, out: 2.4 }, { u: -29, w: 5.5, h: 2.1, out: 1.8 }, { u: 29, w: 5.5, h: 2.1, out: 1.8 },
    { u: -50, w: 4.4, h: 1.8, out: 1.5 }, { u: 50, w: 4.4, h: 1.8, out: 1.5 }],
  /** the terrace behind the wall (depth, m), then the grass slope's steepness (run per rise) and the stair: width, riser, tread, from each end */
  terrace: 9, slope: 2.2, stair: { w: 3.2, riser: 0.17, tread: 0.32, inset: 5 },
  /** the lames: a sheet per bay, its width share of the bay, its speed out, splash radius */
  lames: { share: 0.45, out: 0.25, splash: 0.55 },
  /** the amphitheatre round the arc: its terraces, each one's width and rise; the curb's width and height */
  tiers: 3, tierW: 3.4, tierRise: 0.7, curb: 0.45, curbH: 0.35,
  stone: '#d6cdb6', darkStone: '#bcb39c', lead: '#4f5753', grass: '#4a6b30', grass2: '#3f5e2a', stair_: '#cfc6af',
  water: -0.15,
  /** the wall's face stands this far into the basin from the footprint hull's edge (OSM's south side is notched 14 m in the middle) */
  faceShift: 7,
}

const cross = (o: P2, a: P2, b: P2): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
function hull(ps: P2[]): P2[] {
  const s = [...ps].sort((a, b) => a.x - b.x || a.z - b.z)
  const lo: P2[] = [], up: P2[] = []
  for (const p of s) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
  for (const p of [...s].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

export function versaillesNeptune(out: MeshBuilder, fit: Fit): void {
  const N = NEPTUNE, y = fit.grade ?? 0, STONE = hex(N.stone), LEAD = hex(N.lead)
  const ASH = surfaceTag('ashlar')
  const ring: P2[] = fit.ring && fit.ring.length > 2 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const c = { x: ring.reduce((s, p) => s + p.x, 0) / ring.length, z: ring.reduce((s, p) => s + p.z, 0) / ring.length }
  // the wall: the hull's longest edge
  const h = hull(ring)
  let bi = 0, bl = 0
  for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length], l = Math.hypot(q.x - p.x, q.z - p.z); if (l > bl) { bl = l; bi = i } }
  const A = h[bi], B = h[(bi + 1) % h.length]
  let tx = (B.x - A.x) / bl, tz = (B.z - A.z) / bl
  let nx = -tz, nz = tx
  if ((c.x - A.x) * nx + (c.z - A.z) * nz < 0) { nx = -nx; nz = -nz; tx = -tx; tz = -tz }
  // the wall's own frame: (u along the wall, v from its face into the basin); the middle of the edge is the origin
  const M = { x: (A.x + B.x) / 2 + nx * N.faceShift, z: (A.z + B.z) / 2 + nz * N.faceShift }
  const W = (u: number, v: number): P2 => ({ x: M.x + tx * u + nx * v, z: M.z + tz * u + nz * v })
  const heading = Math.atan2(-tz, tx)
  const Lh = bl / 2 - N.endClear
  /** a box in the wall's frame: u0..u1 along, v0..v1 from the face (v negative is inside the wall), heights over the base */
  const bx = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col: [number, number, number], tag = 0): void => {
    const m = W((u0 + u1) / 2, (v0 + v1) / 2)
    boxAlong(out, m.x, y + (y0 + y1) / 2, m.z, (u1 - u0) / 2, (y1 - y0) / 2, (v1 - v0) / 2, heading, col, tag)
  }
  const H = N.wall
  // the wall's body, its plinth course, the string course and the cornice
  bx(-Lh, Lh, -N.thick, 0, -0.5, H, STONE, ASH)
  bx(-Lh, Lh, 0, N.plinthOut, -0.5, N.plinth, shade(STONE, 0.9), ASH)
  bx(-Lh, Lh, 0, N.stringOut, H * N.string, H * N.string + N.stringH, shade(STONE, 1.04), ASH)
  bx(-Lh, Lh, -0.6, N.corniceOut, H - N.cornice, H, shade(STONE, 1.06), ASH)
  // the bays: a vase on a pier over every pilaster; a lame in the middle of each bay
  const nv = N.vases.count, pitch = (2 * Lh - N.vases.pier * 2) / (nv - 1)
  const uv = (k: number): number => -Lh + N.vases.pier + k * pitch
  for (let k = 0; k < nv; k++) {
    const u = uv(k)
    bx(u - N.pilaster / 2, u + N.pilaster / 2, 0, N.pilasterOut, N.plinth, H - N.cornice, shade(STONE, 1.03), ASH)
  }
  // the tablette: a plinth and a balustrade, piers at the vases
  bx(-Lh, Lh, -0.5, 0.35, H, H + 0.18, shade(STONE, 1.08), ASH)
  const bal = N.bal, by0 = H + 0.18
  bx(-Lh, Lh, -0.2, 0.2, by0, by0 + bal.rail, STONE, ASH)
  bx(-Lh, Lh, -0.22, 0.22, by0 + bal.h - bal.rail, by0 + bal.h, STONE, ASH)
  for (let u = -Lh + 0.3; u < Lh - 0.2; u += bal.step) {
    if (Array.from({ length: nv }, (_, k) => uv(k)).some((v) => Math.abs(u - v) < N.vases.pier * 0.7)) continue
    bx(u - bal.sec / 2, u + bal.sec / 2, -bal.sec / 2, bal.sec / 2, by0 + bal.rail, by0 + bal.h - bal.rail, shade(STONE, 1.02))
  }
  const urn: [number, number][] = [[0.0, 0], [N.vases.r * 0.55, 0], [N.vases.r * 0.55, 0.15], [N.vases.r * 0.4, 0.3], [N.vases.r * 0.75, 0.55],
    [N.vases.r * 1.05, 0.95], [N.vases.r, 1.35], [N.vases.r * 0.6, 1.65], [N.vases.r * 0.7, 1.75], [0, 1.78]]
    .map(([r, t]) => [r, t * (N.vases.urn / 1.78)])
  for (let k = 0; k < nv; k++) {
    const u = uv(k), p = W(u, 0)
    bx(u - N.vases.pier / 2, u + N.vases.pier / 2, -N.vases.pier / 2, N.vases.pier / 2, by0, by0 + N.vases.pierH, shade(STONE, 1.05), ASH)
    bx(u - N.vases.pier * 0.6, u + N.vases.pier * 0.6, -N.vases.pier * 0.6, N.vases.pier * 0.6, by0 + N.vases.pierH, by0 + N.vases.pierH + 0.12, shade(STONE, 1.1), ASH)
    lathe(out, p.x, p.z, urn.map(([r, t]) => [r, y + by0 + N.vases.pierH + 0.12 + t] as [number, number]), 10, LEAD)
  }
  // the groups' plinths: a stepped base from the basin floor, a cap
  for (const g of N.groups) {
    bx(g.u - g.w / 2, g.u + g.w / 2, 0, g.out, -0.5, g.h, shade(STONE, 0.95), ASH)
    bx(g.u - g.w / 2 - 0.25, g.u + g.w / 2 + 0.25, 0, g.out + 0.25, g.h, g.h + 0.22, shade(STONE, 1.08), ASH)
    bx(g.u - g.w / 2 - 0.2, g.u + g.w / 2 + 0.2, 0, g.out + 0.2, -0.5, 0.45, shade(STONE, 0.85), ASH)
  }
  // the terrace behind and the grass falling from it, with a stair at each end
  const tb = -N.thick, tT = tb - N.terrace
  bx(-Lh - 2, Lh + 2, tT, tb, -0.5, H, shade(STONE, 0.78), surfaceTag('setts'))
  const run = H * N.slope
  const GR = hex(N.grass), GR2 = hex(N.grass2)
  const nseg = Math.ceil((2 * Lh + 4) / 12)
  for (let s = 0; s < nseg; s++) {
    const u0 = -Lh - 2 + (s / nseg) * (2 * Lh + 4), u1 = -Lh - 2 + ((s + 1) / nseg) * (2 * Lh + 4)
    const P = (u: number, v: number, yy: number): [number, number, number] => { const q = W(u, v); return [q.x, y + yy, q.z] }
    out.quad([P(u0, tT, H - 0.05), P(u1, tT, H - 0.05), P(u1, tT - run, -0.2), P(u0, tT - run, -0.2)], [-nx, 0.4, -nz], [[0, 0], [1, 0], [1, 1], [0, 1]], s % 2 ? GR : GR2, 0)
  }
  const st = N.stair
  const nst = Math.ceil((H - 0.3) / st.riser)
  for (const sgn of [-1, 1]) {
    const uc = sgn * (Lh - st.inset)
    for (let i = 0; i < nst; i++) {
      const top = H - (i + 1) * st.riser
      if (top < 0) break
      bx(uc - st.w / 2, uc + st.w / 2, tT - i * st.tread - st.tread, tT - i * st.tread, -0.4, top + 0.0, hex(N.stair_), ASH)
    }
  }
  // the amphitheatre round the arc: a stone curb along every edge on the basin side, turf terraces rising outward behind it
  const nrm = ring.map((p, i) => {
    const a = ring[(i + ring.length - 1) % ring.length], b = ring[(i + 1) % ring.length]
    let ex = b.x - a.x, ez = b.z - a.z; const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l
    let ox = ez, oz = -ex
    if ((p.x - c.x) * ox + (p.z - c.z) * oz < 0) { ox = -ox; oz = -oz }
    return { x: ox, z: oz }
  })
  const vOf = (p: P2): number => (p.x - M.x) * nx + (p.z - M.z) * nz
  const offs = (i: number, d: number): P2 => ({ x: ring[i].x + nrm[i].x * d, z: ring[i].z + nrm[i].z * d })
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length, p = ring[i], q = ring[j]
    if (vOf(p) < 1.5 || vOf(q) < 1.5) continue
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.4) continue
    const hd = Math.atan2(-(q.z - p.z), q.x - p.x)
    // the curb
    const mid = { x: (p.x + q.x) / 2 + nrm[i].x * N.curb / 2, z: (p.z + q.z) / 2 + nrm[i].z * N.curb / 2 }
    boxAlong(out, mid.x, y + N.curbH / 2 - 0.1, mid.z, L / 2 + 0.05, N.curbH / 2 + 0.1, N.curb / 2, hd, STONE, ASH)
    for (let k = 0; k < N.tiers; k++) {
      const d0 = N.curb + k * N.tierW, d1 = d0 + N.tierW, y0 = N.curbH + k * N.tierRise, y1 = y0 + N.tierRise
      const a0 = offs(i, d0), b0 = offs(j, d0), a1 = offs(i, d1), b1 = offs(j, d1)
      const col = (i + k) % 2 ? GR : GR2
      // the tread (a gentle slope up), then the riser's face
      out.quad([[a0.x, y + y0 - 0.05, a0.z], [b0.x, y + y0 - 0.05, b0.z], [b1.x, y + y1 - 0.2, b1.z], [a1.x, y + y1 - 0.2, a1.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], col, 0)
      out.quad([[a1.x, y + y1 - 0.2, a1.z], [b1.x, y + y1 - 0.2, b1.z], [b1.x, y + y1, b1.z], [a1.x, y + y1, a1.z]], [nrm[i].x, 0, nrm[i].z], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(col, 0.8), 0)
    }
  }
  // the lames: a sheet from the string course over every bay (the middle ones leave a gap for the groups' plinths)
  const lipY = y + H * N.string + N.stringH
  for (let k = 0; k < nv - 1; k++) {
    const u = (uv(k) + uv(k + 1)) / 2
    if (N.groups.some((g) => Math.abs(u - g.u) < g.w / 2 + 0.4)) continue
    const w = pitch * N.lames.share, a = W(u - w / 2, N.stringOut), b = W(u + w / 2, N.stringOut)
    // a→b has the basin on its right: the wall's u runs with t, the basin normal n is t rotated one way; flip the pair if the sheet would leave the wrong way
    const right = (b.z - a.z) * nx - (b.x - a.x) * nz
    const [p, q] = right > 0 ? [a, b] : [b, a]
    out.water.push({ kind: 'sheet', a: [p.x, lipY, p.z], b: [q.x, lipY, q.z], out: N.lames.out, drop: lipY - y - N.water })
    const s = W(u, N.stringOut + 0.5)
    out.water.push({ kind: 'splash', at: [s.x, y + N.water, s.z], r: N.lames.splash })
  }
}

export const VERSAILLES_NEPTUNE = { versaillesNeptune }
