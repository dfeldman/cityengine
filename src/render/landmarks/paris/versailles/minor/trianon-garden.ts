/**
 * The Trianon gardens' small works (Versailles minor monuments, group "trianon"), all procedural; each figure is a plain
 * stand-in until its Modly model is made (the commands wait in monu/versailles/guided-queue.md):
 *
 *   * the PAVILLON FRANÇAIS (Gabriel 1750; OSM way/194534704): a pale-stone cross-plan pavilion, tall windows in every face, a
 *     cornice and a balustraded roof with statues and urns at its corners, a raised central cabinet. The plan is OSM's outline.
 *   * the PAVILLON FRAIS (Gabriel 1751, rebuilt 2008; relation/16125820): a one-room pavilion painted sage green, two tall
 *     treillage piers with urns in front of it and low lattice galleries running forward from them.
 *   * the BUFFET D'EAU of the Grand Trianon (Hardouin-Mansart 1703): a stepped wall of red marble with white and grey
 *     marble, three shell basins, gilded lead figures and lions along its top; the bake draws its pool.
 *   * the FONTAINE DE L'AMOUR sur un dauphin and the two TROIS ENFANTS fountains: a coping round OSM's basin and a lead stand-in.
 *   * the RIMS of the Grand Trianon's basins (Plat-Fond, Fer à Cheval, Trèfle, Petite Gerbe, Parterre de Laocoon): a stone
 *     coping laid along OSM's water outline (the bake draws the water, never its curb).
 *
 * Frame: x east, z north (every entry has lat/lon + size and no `front`), y up from the model base; the ground at a point is
 * `fit.groundAt` (a basin's coping follows the slope), the pavilions stand at `fit.grade`. Tunables are the constants.
 */
import type { MeshBuilder } from '../../../../buildings.ts'
import { capPolygonWithHoles } from '../../../../buildings.ts'
import type { Fit } from '../../../fit.ts'
import { block, dome, hex, prism, roof, shade } from '../../../kit.ts'
import { boxAlong, edgeAt } from '../../../parts.ts'
import { ccw, band, type P2 } from '../../monuments/common.ts'
import { sweptTube } from '../../monuments/minor/monument-kit.ts'
import { TRIANON_RINGS, type Pt } from './trianon-garden-data.ts'

type V3 = [number, number, number]
const toP2 = (r: Pt[], k = 1): P2[] => r.map(([x, z]) => ({ x: x * k, z: z * k }))

/* ------------------------------------------------------------------------------------------------------- coping */

const RIM = { stone: '#cdc7b6', w: 0.42, h: 0.2, below: 0.15, slope: 0.35 }

/** A stone coping `w` wide laid along a closed outline, each stretch at the ground under its middle (a basin on a slope keeps its rim at the ground). */
function coping(out: MeshBuilder, fit: Fit, pts: Pt[], o: { w?: number; h?: number; c?: string; lift?: number } = {}): void {
  const w = o.w ?? RIM.w, h = o.h ?? RIM.h, c = hex(o.c ?? RIM.stone), ring = ccw(toP2(pts))
  const gAt = (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x, z) : (fit.grade ?? 0))
  // the bake's water stands at the ring's lowest bank (city/package.ts waterLevels): the coping follows it, within RIM.slope of the ground
  const wl = Math.min(...ring.map((p) => gAt(p.x, p.z)))
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 0.05) continue
    const g = Math.min(Math.max(gAt(e.mid.x, e.mid.z), wl), wl + RIM.slope) + (o.lift ?? 0)
    // the coping lies OUTSIDE the water's edge (its inner face on the outline), so the lip never overhangs the water
    boxAlong(out, e.mid.x + e.nx * w / 2, g + (h - RIM.below) / 2, e.mid.z + e.nz * w / 2, e.L / 2 + w / 2, (h + RIM.below) / 2, w / 2, e.heading, c)
  }
}

const rim = (key: 'plat' | 'fer' | 'trefle' | 'gerbe' | 'laocoon') => (out: MeshBuilder, fit: Fit): void => coping(out, fit, TRIANON_RINGS[key])
export const versaillesRimPlatFond = rim('plat')
export const versaillesRimFerACheval = rim('fer')
export const versaillesRimTrefle = rim('trefle')
export const versaillesRimPetiteGerbe = rim('gerbe')
export const versaillesRimLaocoon = rim('laocoon')

/* ------------------------------------------------------------------------------------------------------ fountains */

const LEAD = '#4d4f46', BRONZE = '#4a3f2e'

/** A small figure stand-in: a tapering body with a head, `h` tall, at (x, z) from y0. */
function figure(out: MeshBuilder, x: number, z: number, y0: number, h: number, c: string): void {
  const col = hex(c)
  prism(out, x, z, y0, y0 + h * 0.78, h * 0.17, 6, col, 0, h * 0.09)
  dome(out, x, z, y0 + h * 0.76, h * 0.11, h * 0.2, col, 8)
}

const CHILDREN = { drum: 0.85, rock: 0.55, kids: 3, kidH: 0.75 }
/** Three lead children playing on a rock: a drum under the water, a low rock and three small stand-ins. */
function children(out: MeshBuilder, fit: Fit, key: 'oiseaux' | 'poissons'): void {
  const C = CHILDREN, g = (fit.groundAt?.(0, 0) ?? fit.grade ?? 0)
  coping(out, fit, TRIANON_RINGS[key])
  prism(out, 0, 0, g - 0.45, g + 0.02, C.drum, 12, hex('#8d887a'))
  prism(out, 0, 0, g, g + 0.3, C.rock, 9, hex(LEAD), 0, C.rock * 0.8)
  for (let i = 0; i < C.kids; i++) {
    const a = (i / C.kids) * Math.PI * 2 + 0.5
    figure(out, Math.cos(a) * 0.3, Math.sin(a) * 0.3, g + 0.28, C.kidH, LEAD)
  }
}
export const versaillesFontaineEnfantsOiseaux = (out: MeshBuilder, fit: Fit): void => children(out, fit, 'oiseaux')
export const versaillesFontaineEnfantsPoissons = (out: MeshBuilder, fit: Fit): void => children(out, fit, 'poissons')

const AMOUR = { coping: 0.3, dolphinLen: 1.7, rise: 0.9, cupidH: 0.65 }
/** Marsy's Love astride a dolphin: a drum, a curved bronze dolphin leaping and a small cupid on its back. */
export function versaillesFontaineAmour(out: MeshBuilder, fit: Fit): void {
  const A = AMOUR, g = fit.groundAt?.(0, 0) ?? fit.grade ?? 0
  coping(out, fit, TRIANON_RINGS.amour, { w: A.coping })
  prism(out, 0, 0, g - 0.4, g + 0.02, 0.55, 10, hex('#8d887a'))
  const path: V3[] = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, x = (t - 0.5) * A.dolphinLen
    path.push([x, g + 0.05 + A.rise * Math.sin(t * Math.PI) * (1 - 0.35 * t) + 0.1, 0.05 * Math.sin(t * 6)])
  }
  sweptTube(out, path, { r: (t) => 0.2 * (1 - 0.8 * Math.abs(t - 0.35)) + 0.03, sides: 8, c: hex(BRONZE) })
  // the tail fluke and the beak
  block(out, A.dolphinLen / 2 - 0.05, A.dolphinLen / 2 + 0.2, -0.22, 0.22, g + 0.08, g + 0.14, hex(BRONZE))
  figure(out, 0, 0.02, g + 0.05 + A.rise * 0.95, A.cupidH, BRONZE)
}

/* ------------------------------------------------------------------------------------------------ Pavillon français */

const PF = {
  stone: '#d9d0b9', stoneDark: '#c4baa2', roofLead: '#7b8082', glass: '#3f4a47', frame: '#b9c2a8', urnCol: '#cfc7b2',
  /** the plinth (scale of the plan, rise), wall height, cornice rise and proud, balustrade rise, baluster pitch */
  plinth: { k: 1.03, h: 0.5 }, wall: 6.1, cornice: { h: 0.4, d: 0.32 }, bal: 0.95, pitch: 0.42,
  /** windows: width, height, sill over the floor, how far they stand proud of the wall */
  win: { w: 1.25, h: 3.2, sill: 0.75, proud: 0.05 },
  /** the raised central cabinet: radius, rise over the roof, its own cornice and balustrade */
  cabinet: { r: 3.4, h: 1.5 },
  /** statues and urns on the roofline: stand-in height and their plinth */
  statue: { h: 1.5, plinth: 0.55 }, urn: { r: 0.22, h: 0.7 },
}

/** The Petit Trianon's Pavillon français: Gabriel's pale-stone cross-plan pavilion on OSM's outline, with a balustraded roof. */
export function versaillesPavillonFrancais(out: MeshBuilder, fit: Fit): void {
  const P = PF, g = fit.grade ?? 0, plan = ccw(toP2(TRIANON_RINGS.pf)), stone = hex(P.stone)
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // plinth: the plan blown up a little, under the walls
  const pl = plan.map((p) => ({ x: p.x * P.plinth.k, z: p.z * P.plinth.k }))
  for (let i = 0; i < pl.length; i++) {
    const e = edgeAt(pl, i)
    out.quad([[e.a.x, g - 0.4, e.a.z], [e.b.x, g - 0.4, e.b.z], [e.b.x, g + P.plinth.h, e.b.z], [e.a.x, g + P.plinth.h, e.a.z]], [e.nx, 0, e.nz], UV, shade(stone, 0.9), 0)
  }
  capPolygonWithHoles(out, [pl], g + P.plinth.h, shade(stone, 0.92), 0)
  const y0 = g + P.plinth.h, y1 = y0 + P.wall
  for (let i = 0; i < plan.length; i++) {
    const e = edgeAt(plan, i)
    out.quad([[e.a.x, y0, e.a.z], [e.b.x, y0, e.b.z], [e.b.x, y1, e.b.z], [e.a.x, y1, e.a.z]], [e.nx, 0, e.nz], UV, stone, 0)
    if (e.L < 2.2) continue
    // a tall window (frame, then dark glass) centred on the face
    const W = P.win, w = Math.min(W.w, e.L - 0.9)
    boxAlong(out, e.mid.x + e.nx * W.proud, y0 + W.sill + W.h / 2, e.mid.z + e.nz * W.proud, w / 2 + 0.12, W.h / 2 + 0.12, 0.04, e.heading, hex(P.stoneDark))
    boxAlong(out, e.mid.x + e.nx * (W.proud + 0.04), y0 + W.sill + W.h / 2, e.mid.z + e.nz * (W.proud + 0.04), w / 2, W.h / 2, 0.03, e.heading, hex(P.glass))
    boxAlong(out, e.mid.x + e.nx * (W.proud + 0.08), y0 + W.sill + W.h / 2, e.mid.z + e.nz * (W.proud + 0.08), 0.03, W.h / 2, 0.02, e.heading, hex(P.frame))
  }
  band(out, plan, y1 - 0.02, P.cornice.h, P.cornice.d, shade(stone, 1.04))
  // roof: lead lid, then the balustrade (base course, balusters, rail) round the edge
  const top = y1 + P.cornice.h
  capPolygonWithHoles(out, [plan], top, hex(P.roofLead), 0)
  band(out, plan, top, 0.28, 0.12, shade(stone, 1.02))
  band(out, plan, top + P.bal - 0.14, 0.14, 0.18, shade(stone, 1.02))
  for (let i = 0; i < plan.length; i++) {
    const e = edgeAt(plan, i), n = Math.max(2, Math.floor(e.L / P.pitch))
    for (let k = 0; k < n; k++) {
      const u = ((k + 0.5) / n - 0.5) * (e.L - 0.3)
      boxAlong(out, e.mid.x + e.tx * u - e.nx * 0.02, top + 0.28 + (P.bal - 0.42) / 2, e.mid.z + e.tz * u - e.nz * 0.02, 0.05, (P.bal - 0.42) / 2, 0.05, e.heading, shade(stone, 1.06))
    }
  }
  // the raised central cabinet, octagonal, with its own cornice and rail
  const C = P.cabinet, cy = top
  prism(out, 0, 0, cy, cy + C.h, C.r, 8, shade(stone, 1.0), 0, C.r, true, Math.PI / 8)
  prism(out, 0, 0, cy + C.h, cy + C.h + 0.3, C.r + 0.3, 8, shade(stone, 1.04), 0, C.r + 0.3, true, Math.PI / 8)
  prism(out, 0, 0, cy + C.h + 0.3, cy + C.h + 0.75, C.r + 0.1, 8, shade(stone, 1.0), 0, C.r + 0.1, true, Math.PI / 8)
  prism(out, 0, 0, cy + C.h + 0.75, cy + C.h + 0.9, C.r - 0.2, 8, hex(P.roofLead), 0, C.r - 0.2, true, Math.PI / 8)
  // statues on the arm ends (the far corners of the plan), urns on the angles between them
  let outer = 0
  for (const p of plan) {
    const r = Math.hypot(p.x, p.z)
    if (r < 9) continue
    const k = 1 - 0.55 / r, x = p.x * k, z = p.z * k
    if (outer++ % 2 === 0) {
      block(out, x - 0.4, x + 0.4, z - 0.4, z + 0.4, top, top + P.statue.plinth, shade(stone, 1.05))
      figure(out, x, z, top + P.statue.plinth, P.statue.h, P.stone)
      figure(out, x + 0.45, z + 0.2, top + P.statue.plinth, P.statue.h * 0.8, P.stone)
    } else {
      prism(out, x, z, top, top + 0.25, 0.3, 6, hex(P.stone))
      prism(out, x, z, top + 0.25, top + P.urn.h, P.urn.r, 8, hex(P.urnCol), 0, P.urn.r * 0.5)
      dome(out, x, z, top + P.urn.h - 0.05, P.urn.r * 1.1, 0.25, hex(P.urnCol), 8)
    }
  }
}

/* ---------------------------------------------------------------------------------------------------- Pavillon frais */

const PFR = {
  green: '#a3b296', greenDark: '#7f9275', trim: '#c9d1b7', glass: '#38403d', lattice: '#6f8a6a', roof: '#808684', urn: '#5d7b62',
  /** the salon: half-width, half-depth, wall height, cornice, rail rise */
  hw: 4.8, hd: 3.2, wall: 4.3, cornice: 0.35, rail: 0.7,
  /** front: the arched door (width, height) and the two windows (width, height, sill) either side */
  door: { w: 1.5, h: 3.3 }, win: { w: 1.2, h: 2.5, sill: 0.9, at: 2.7 },
  /** the two piers: across (x), how far in front of the salon, side, shaft height, plinth rise, cap rise */
  pier: { x: 6.3, front: 1.4, side: 1.3, h: 5.4, plinth: 0.8, cap: 0.35 },
  /** the lattice galleries running forward from each pier: length, height, bar pitch and width */
  gallery: { len: 5.2, h: 2.7, pitch: 0.32, bar: 0.05 },
}

/** A lattice wall from (x, z) forward (−z) `len`, `h` high, standing on y0: a panel, a grid of bars and posts at the ends. */
function lattice(out: MeshBuilder, x: number, z0: number, len: number, y0: number, h: number, back: string, bar: string, pitch: number, w: number): void {
  const B = hex(back), R = hex(bar)
  block(out, x - 0.02, x + 0.02, z0 - len, z0, y0 + 0.15, y0 + h, B)
  for (let u = pitch; u < len - 0.05; u += pitch) block(out, x - 0.045, x + 0.045, z0 - u - w / 2, z0 - u + w / 2, y0 + 0.15, y0 + h, R)
  for (let v = 0.15 + pitch; v < h - 0.05; v += pitch) block(out, x - 0.045, x + 0.045, z0 - len, z0, y0 + v - w / 2, y0 + v + w / 2, R)
  block(out, x - 0.08, x + 0.08, z0 - len, z0, y0 + h, y0 + h + 0.08, R)
  block(out, x - 0.08, x + 0.08, z0 - len, z0, y0, y0 + 0.15, R)
  for (const zz of [z0 - len, z0 - len / 2]) block(out, x - 0.1, x + 0.1, zz - 0.07, zz + 0.07, y0, y0 + h + 0.08, R)
}

/** The Petit Trianon's Pavillon frais: a sage-green salon, two treillage piers with urns, and lattice galleries running forward. Front is −z. */
export function versaillesPavillonFrais(out: MeshBuilder, fit: Fit): void {
  const P = PFR, g = fit.grade ?? 0, G = hex(P.green), T = hex(P.trim)
  const y1 = g + P.wall
  block(out, -P.hw - 0.25, P.hw + 0.25, -P.hd - 0.25, P.hd + 0.25, g - 0.3, g + 0.3, shade(G, 0.9))
  block(out, -P.hw, P.hw, -P.hd, P.hd, g + 0.2, y1, G)
  block(out, -P.hw - 0.2, P.hw + 0.2, -P.hd - 0.2, P.hd + 0.2, y1, y1 + P.cornice, T)
  block(out, -P.hw, P.hw, -P.hd, P.hd, y1 + P.cornice, y1 + P.cornice + 0.1, hex(P.roof))
  // balustrade: low panelled rail
  const ry = y1 + P.cornice
  block(out, -P.hw - 0.1, P.hw + 0.1, -P.hd - 0.1, -P.hd + 0.1, ry, ry + P.rail, T)
  block(out, -P.hw - 0.1, P.hw + 0.1, P.hd - 0.1, P.hd + 0.1, ry, ry + P.rail, T)
  block(out, -P.hw - 0.1, -P.hw + 0.1, -P.hd, P.hd, ry, ry + P.rail, T)
  block(out, P.hw - 0.1, P.hw + 0.1, -P.hd, P.hd, ry, ry + P.rail, T)
  // front: the central door under an arch, a window either side
  const D = P.door, W = P.win, zf = -P.hd - 0.03
  block(out, -D.w / 2 - 0.15, D.w / 2 + 0.15, zf - 0.03, zf, g + 0.3, g + 0.3 + D.h - 0.5, T)
  block(out, -D.w / 2, D.w / 2, zf - 0.06, zf - 0.03, g + 0.3, g + 0.3 + D.h - 0.5, hex(P.glass))
  dome(out, 0, zf - 0.03, g + 0.3 + D.h - 0.5, D.w / 2, 0.5, hex(P.glass), 10)
  for (const s of [-1, 1]) {
    block(out, s * W.at - W.w / 2 - 0.14, s * W.at + W.w / 2 + 0.14, zf - 0.03, zf, g + W.sill - 0.14, g + W.sill + W.h + 0.14, T)
    block(out, s * W.at - W.w / 2, s * W.at + W.w / 2, zf - 0.06, zf - 0.03, g + W.sill, g + W.sill + W.h, hex(P.glass))
    block(out, s * W.at - 0.025, s * W.at + 0.025, zf - 0.08, zf - 0.06, g + W.sill, g + W.sill + W.h, T)
  }
  // the piers: plinth, panelled shaft, cap and an urn
  const Q = P.pier, G2 = P.gallery
  for (const s of [-1, 1]) {
    const x = s * Q.x, z = -P.hd - Q.front, h2 = Q.side / 2
    block(out, x - h2 - 0.15, x + h2 + 0.15, z - h2 - 0.15, z + h2 + 0.15, g, g + Q.plinth, shade(G, 0.9))
    block(out, x - h2, x + h2, z - h2, z + h2, g + Q.plinth, g + Q.h, G)
    for (const f of [-1, 1]) {
      block(out, x - h2 * 0.7, x + h2 * 0.7, z + f * (h2 + 0.02) - 0.02, z + f * (h2 + 0.02) + 0.02, g + Q.plinth + 0.5, g + Q.h - 0.5, hex(P.lattice))
      block(out, x + f * (h2 + 0.02) - 0.02, x + f * (h2 + 0.02) + 0.02, z - h2 * 0.7, z + h2 * 0.7, g + Q.plinth + 0.5, g + Q.h - 0.5, hex(P.lattice))
    }
    block(out, x - h2 - 0.18, x + h2 + 0.18, z - h2 - 0.18, z + h2 + 0.18, g + Q.h, g + Q.h + Q.cap, T)
    prism(out, x, z, g + Q.h + Q.cap, g + Q.h + Q.cap + 0.55, 0.3, 8, hex(P.urn), 0, 0.2)
    dome(out, x, z, g + Q.h + Q.cap + 0.5, 0.38, 0.35, hex(P.urn), 8)
    // the gallery forward from the pier's outer side, and a small inner post
    lattice(out, x + s * (h2 - 0.05), z, G2.len, g, G2.h, P.greenDark, P.green, G2.pitch, G2.bar)
    block(out, s * (P.hw + 0.35) - 0.25, s * (P.hw + 0.35) + 0.25, -P.hd - 0.5, -P.hd, g, g + 2.9, G)
    block(out, s * (P.hw + 0.35) - 0.3, s * (P.hw + 0.35) + 0.3, -P.hd - 0.5, -P.hd, g + 2.9, g + 3.1, T)
  }
}

/* ------------------------------------------------------------------------------------------------------ Buffet d'eau */

const BUF = {
  red: '#cfb0a4', redDark: '#a88a82', grey: '#7d7f80', white: '#e4dfd2', gold: '#b39a58', dark: '#2f2a2c',
  /** x extent of the wall (it sits a little west of the outline's centre), the wall's front z and back z */
  x0: -5.6, x1: 4.6, zf: 1.2, zb: 4.9,
  /** the tiers: lower wall height, middle tier height and setback, top block height, its half-width */
  low: 1.9, mid: 1.1, midBack: 0.9, top: 0.9, topHw: 2.0,
  /** the three shell basins: centre and side bowl radius, rise over the foot */
  bowl: { r: 0.95, side: 0.6, y: 1.25, at: 3.2 },
}

/** The Grand Trianon's Buffet d'eau: a stepped red-marble wall, three shell basins, a gilded pediment and figures along the top. Front is −z (south). */
export function versaillesBuffetEau(out: MeshBuilder, fit: Fit): void {
  const B = BUF, g = fit.grade ?? 0, red = hex(B.red), cx = (B.x0 + B.x1) / 2, hw = (B.x1 - B.x0) / 2
  coping(out, fit, TRIANON_RINGS.buffet, { w: 0.45, h: 0.28, c: B.white })
  // lower wall: a grey socle in the water, red marble above, three dark niche panels with a gold mask on each
  block(out, B.x0, B.x1, B.zf, B.zb, g - 0.4, g + 0.7, hex(B.grey))
  block(out, B.x0, B.x1, B.zf, B.zb, g + 0.7, g + B.low, red)
  for (const u of [-1, 0, 1]) {
    const x = cx + u * hw * 0.55
    block(out, x - 1.15, x + 1.15, B.zf - 0.04, B.zf, g + 0.9, g + B.low - 0.25, hex(B.redDark))
    prism(out, x, B.zf - 0.06, g + B.low - 1.05, g + B.low - 0.9, 0.2, 8, hex(B.gold), 0, 0.2, true, 0)
  }
  block(out, B.x0 - 0.15, B.x1 + 0.15, B.zf - 0.15, B.zb + 0.1, g + B.low, g + B.low + 0.25, hex(B.white))
  // shell basins projecting from the wall: a stem and a wide shallow bowl each
  for (const [x, r] of [[cx, B.bowl.r], [cx - B.bowl.at, B.bowl.side], [cx + B.bowl.at, B.bowl.side]] as [number, number][]) {
    prism(out, x, B.zf - 0.1, g + 0.5, g + B.bowl.y, r * 0.25, 8, hex(B.white))
    prism(out, x, B.zf - 0.1 - r * 0.25, g + B.bowl.y, g + B.bowl.y + 0.2, r, 14, hex(B.white), 0, r * 0.35)
  }
  // middle tier, set back, with a gilded relief panel and two roundels
  const mz = B.zf + B.midBack, my = g + B.low + 0.25
  block(out, B.x0 + 0.5, B.x1 - 0.5, mz, B.zb, my, my + B.mid, red)
  block(out, cx - 1.5, cx + 1.5, mz - 0.05, mz, my + 0.35, my + B.mid - 0.3, hex(B.gold))
  for (const s of [-1, 1]) prism(out, cx + s * hw * 0.62, mz - 0.03, my + B.mid / 2 - 0.02, my + B.mid / 2 + 0.02, 0.5, 14, hex(B.gold), 0, 0.5, true, 0)
  block(out, B.x0 + 0.35, B.x1 - 0.35, mz - 0.1, B.zb, my + B.mid, my + B.mid + 0.2, hex(B.white))
  // the top: a central block with a gilded scroll pediment, and two lions at its feet
  const ty = my + B.mid + 0.2
  block(out, cx - B.topHw, cx + B.topHw, mz + 0.8, B.zb - 0.3, ty, ty + B.top, red)
  roof(out, cx - B.topHw - 0.2, cx + B.topHw + 0.2, mz + 0.7, B.zb - 0.2, ty + B.top, 0.6, 1.1, 0.25, hex(B.white))
  const gold = B.gold
  figure(out, cx - 0.8, mz + 1.2, ty + B.top + 0.35, 1.5, gold)
  figure(out, cx + 0.8, mz + 1.2, ty + B.top + 0.35, 1.5, gold)
  for (const s of [-1, 1]) {
    block(out, cx + s * (B.topHw + 1.1) - 0.55, cx + s * (B.topHw + 1.1) + 0.55, mz + 0.3, mz + 1.0, ty, ty + 0.5, hex(B.gold))
    block(out, cx + s * (B.x1 - B.x0 - 1.2) / 2 - 0.5, cx + s * (B.x1 - B.x0 - 1.2) / 2 + 0.5, mz + 0.3, mz + 1.2, ty - 0.1, ty + 0.65, hex(B.gold))
    // the white end scrolls
    block(out, cx + s * (hw + 0.1) - 0.2, cx + s * (hw + 0.1) + 0.2, B.zf, B.zb - 0.5, g + 0.7, g + B.low + 1.6, hex(B.white))
  }
}
