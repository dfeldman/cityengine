/**
 * ST. ANNE OF THE SUNSET CATHOLIC CHURCH, 850 Judah Street at Funston Avenue (1933; way/267102407) — the pink church
 * of the Inner Sunset: Romanesque/Byzantine revival in salmon-pink stucco with white cast-stone trim and red-tile
 * roofs, twin square campaniles over Judah, a wheel rose window over a tiled hood and three carved portals, and at
 * the back an octagonal crossing drum with a lantern and a round arcaded apse. Evidence pack:
 * docs/sf-batches/MODEL-ST-ANNE.md (Commons photographs from Grandview Park, Strawberry Hill and Judah Street).
 *
 * Built in its own frame measured off the RAW ring (`fit.ring`, not `towerRing`, which simplifies away the 3–5 m
 * tower stubs and chapel notches): u runs along the front, o is depth (0 at the tower fronts, negative into the
 * site), and u = 0 is the nave axis — the middle of the footprint 16 m behind the front, because the whole
 * footprint's centre is pulled 2–3 m west by the transept and the rear wing. Every width — the aisles, the front, the
 * transept arms, the rear wing — is read from the ring at its depth, so the asymmetries are OSM's, not guesses.
 * Heights are from the photographs (OSM's 25 m is taken as the nave ridge): nave eaves 21, ridge 27.4, the front
 * gable's apex 29.6, the towers' caps 42, their crosses 43.5.
 *
 * `front: 176` (Judah's bearing) puts Judah on local -z — a numeric front faces -z at the manifest bearing, as the
 * Chateau's does; `"street"` took the baked frontage, which for this footprint is Funston, and turned the towers
 * onto the avenue. Everything here is placed by heading from the -z edge, so the builder is indifferent to which way
 * the fit turned it. Walls start at -3 (the model's base is the lowest ground under the
 * footprint); the steps stand at `fit.grade`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt, edgeFacing } from '../parts.ts'
import { crossFinial, gableEnd, lancet, portal, roseWindow } from '../church.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const PINK: Rgb = [0.91, 0.60, 0.52]           // salmon: the engine's sun lifts it a long way, so it starts deeper than the photographs
const PINK_DEEP: Rgb = [0.80, 0.50, 0.44]       // blind arches, shadowed recesses
const WHITE: Rgb = [0.97, 0.95, 0.90]
const TILE: Rgb = [0.60, 0.29, 0.20]           // the city's tile idiom (carmelite, art-institute), not OSM's orange
const GLASS: Rgb = [0.14, 0.16, 0.22]
const COPPER: Rgb = [0.36, 0.56, 0.46]
const STEP: Rgb = [0.78, 0.76, 0.72]
const IRON: Rgb = [0.2, 0.2, 0.22]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function stAnneOfTheSunset_850_Judah(out: MeshBuilder, fit: Fit): void {
  const ST = surfaceTag('stucco'), TR = surfaceTag('terracotta'), TL = surfaceTag('tile'), MT = surfaceTag('metal')
  const G = Math.max(0, fit.grade ?? 0)

  /* ---------------------------------------------------------------- the frame: the front edge, depth and the nave axis */
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.map((p) => ({ x: p.x, z: p.z })) : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const e = edgeAt(ring, edgeFacing(ring, 180))
  const { tx, tz, nx, nz } = e
  const H = e.heading                           // the front's outward heading; flanks are ±π/2 from it
  const HT = Math.atan2(tx, tz)                 // a wall facing +u
  const uo = ring.map((p) => ({ u: (p.x - e.mid.x) * tx + (p.z - e.mid.z) * tz, o: (p.x - e.mid.x) * nx + (p.z - e.mid.z) * nz }))
  const oMax = Math.max(...uo.map((p) => p.o)), oMin = Math.min(...uo.map((p) => p.o))
  /** the ring's u extent at a depth o (0 at the ring's most forward point), or null where the line misses it */
  const widthAt = (o: number): [number, number] | null => {
    const oo = o + oMax
    const us: number[] = []
    for (let i = 0; i < uo.length; i++) {
      const a = uo[i], b = uo[(i + 1) % uo.length]
      if ((a.o <= oo && b.o > oo) || (b.o <= oo && a.o > oo)) us.push(a.u + ((oo - a.o) / (b.o - a.o)) * (b.u - a.u))
    }
    if (us.length < 2) return null
    return [Math.min(...us), Math.max(...us)]
  }
  const depth = oMax - oMin
  const naveW = widthAt(-Math.min(16, depth * 0.2)) ?? [-13.5, 13.5]
  const uC = (naveW[0] + naveW[1]) / 2
  const P = (u: number, o: number, y: number): V3 => [e.mid.x + tx * (uC + u) + nx * (oMax + o), y, e.mid.z + tz * (uC + u) + nz * (oMax + o)]
  const at = (u: number, o: number): P2 => { const p = P(u, o, 0); return { x: p[0], z: p[2] } }
  /** a box centred at (u, o), `w` along the front, `d` into the site, y0..y1 */
  /** a world heading as a unit direction in (u, o) */
  const dirUO = (hd: number): [number, number] => [Math.sin(hd) * tx + Math.cos(hd) * tz, Math.sin(hd) * nx + Math.cos(hd) * nz]
  const slab = (u: number, o: number, y0: number, y1: number, w: number, d: number, c: Rgb, tag: number): void => {
    const p = P(u, o, 0)
    boxAlong(out, p[0], (y0 + y1) / 2, p[2], w / 2, (y1 - y0) / 2, d / 2, H, c, tag)
  }
  /** one quad (or a triangle, with the last point repeated) from (u, o, y) corners, normal from its winding */
  const quad = (pts: [number, number, number][], c: Rgb, tag: number, outward?: V3): void => {
    const p = pts.map(([u, o, y]) => P(u, o, y)) as V3[]
    const a: V3 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]]
    const k = p[2][0] === p[3][0] && p[2][2] === p[3][2] && p[2][1] === p[3][1] ? 2 : 3
    const b: V3 = [p[k][0] - p[0][0], p[k][1] - p[0][1], p[k][2] - p[0][2]]
    let n: V3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    const L = Math.hypot(n[0], n[1], n[2]) || 1
    n = [n[0] / L, n[1] / L, n[2] / L]
    // nothing here faces down, and a sloping face must face OUT of the building: flip what winds the other way
    const cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cz = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4
    const ox = outward ? cx - outward[0] : 0, oz = outward ? cz - outward[2] : 0
    if (n[1] < -0.01 || (outward && n[0] * ox + n[2] * oz < 0)) { p.reverse(); n = [-n[0], -n[1], -n[2]] }
    out.quad([p[0], p[1], p[2], p[3]], n, UV, c, tag)
  }
  /** a round colonette standing on y0 */
  const colonette = (u: number, o: number, y0: number, y1: number, r: number, c: Rgb = WHITE): void => {
    const p = P(u, o, 0)
    prism(out, p[0], p[2], y0, y1, r, 6, c, TR)
    box(out, p[0], y1 + 0.08, p[2], r * 1.6, 0.08, r * 1.6, c, TR)
    box(out, p[0], y0 + 0.06, p[2], r * 1.5, 0.06, r * 1.5, c, TR)
  }
  /** a white corbel table: a band with dentil blocks under it, along a wall from (u0,o0) to (u1,o1) facing `heading` */
  const corbelTable = (u0: number, o0: number, u1: number, o1: number, heading: number, y: number): void => {
    const L = Math.hypot(u1 - u0, o1 - o0)
    const n = Math.max(1, Math.round(L / 0.9))
    const [ox, oz] = dirUO(heading)                                 // the outward direction in (u, o)
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const p = P(u0 + (u1 - u0) * t + ox * 0.18, o0 + (o1 - o0) * t + oz * 0.18, 0)
      boxAlong(out, p[0], y - 0.55, p[2], 0.16, 0.22, 0.2, heading, WHITE, TR)
    }
    const pm = P((u0 + u1) / 2 + ox * 0.12, (o0 + o1) / 2 + oz * 0.12, 0)
    boxAlong(out, pm[0], y - 0.15, pm[2], L / 2 + 0.2, 0.18, 0.16, heading, WHITE, TR)
  }
  /** an n-sided drum centred at (u, o) with a flat side facing the front, r0 at y0 narrowing to r1 at y1 */
  const polyDrum = (u: number, o: number, y0: number, y1: number, r0: number, r1: number, n: number, c: Rgb, tag: number, cap = false): void => {
    const pt = (k: number, r: number, y: number): [number, number, number] => {
      const a = ((k + 0.5) / n) * Math.PI * 2
      return [u + Math.sin(a) * r, o + Math.cos(a) * r, y]
    }
    const axis = P(u, o, 0)
    for (let k = 0; k < n; k++) {
      quad(r1 < 0.01 ? [pt(k, r0, y0), pt(k + 1, r0, y0), [u, o, y1], [u, o, y1]] : [pt(k, r0, y0), pt(k + 1, r0, y0), pt(k + 1, r1, y1), pt(k, r1, y1)], c, tag, axis)
    }
    if (cap && r1 >= 0.01) for (let k = 0; k < n; k++) quad([pt(k, r1, y1), [u, o, y1], pt(k + 1, r1, y1), pt(k + 1, r1, y1)], c, tag)
  }

  /* ---------------------------------------------------------------- the plan, read from the ring */
  const FO = -3.6                                            // the main front wall, behind the tower fronts
  const T = 3.0, NH = 8.3, UT = NH + T                       // tower half-width; clerestory half-width; tower centres ±UT
  const AH = Math.min(14.5, Math.max(11.5, (naveW[1] - naveW[0]) / 2))   // the aisles' outer half-width (27 m nave)
  const frontW = widthAt(-5) ?? [-19.3, 19.3]
  const chapelR = Math.min(UT + T + 2.5 + 3, Math.max(UT + T + 2.5, frontW[1] - uC))
  const chapelLx = Math.max(-(UT + T + 6), Math.min(-(UT + T + 2.5), frontW[0] - uC))
  // the transept: where the ring is at least 6 m wider than the nave; otherwise a third of the way back
  let oT0 = NaN, oT1 = NaN
  for (let o = -8; o > oMin - oMax + 4; o -= 1) {
    const w = widthAt(o)
    if (!w) continue
    const wide = w[1] - w[0] > naveW[1] - naveW[0] + 6
    if (wide && Number.isNaN(oT0)) oT0 = o
    if (wide) oT1 = o
  }
  if (Number.isNaN(oT0) || oT1 > oT0 - 8) { oT0 = -Math.max(20, depth * 0.5); oT1 = oT0 - Math.min(21, depth * 0.28) }
  const oTm = (oT0 + oT1) / 2
  const tw = widthAt(oTm) ?? [uC - 21, uC + 19]
  const tL = Math.max(-26, Math.min(-(AH + 1), tw[0] - uC)), tR = Math.min(26, Math.max(AH + 1, tw[1] - uC))
  const oEnd = oMin - oMax
  const rearW = widthAt(Math.max(oEnd + 2, oT1 - 6)) ?? [uC - 17, uC + 14]
  const rL = Math.max(-26, Math.min(-6, rearW[0] - uC)), rR = Math.min(26, Math.max(6, rearW[1] - uC))

  /* ---------------------------------------------------------------- the nave, the aisles and the side chapels */
  const EAVE = 21.0, RIDGE = 27.4, AISLE = 11.0
  slab(0, (FO + oT0) / 2, -3, EAVE, 2 * NH, oT0 - FO, PINK, ST)                         // the clerestory
  for (const s of [-1, 1]) {
    const uA = s * (NH + AH) / 2
    slab(uA, (FO - 8 + oT0) / 2, -3, AISLE, AH - NH, oT0 - (FO - 8), PINK, ST)           // an aisle
    // its roof: a tile lean-to from under the clerestory windows down to the aisle's corbelled eave (the Strawberry
    // Hill and Judah-east photographs), closed at the front by a pink triangle against the chapel block
    const AL = AISLE + 3.5
    quad([[s * NH, FO - 8, AL], [s * NH, oT0, AL], [s * (AH + 0.4), oT0, AISLE], [s * (AH + 0.4), FO - 8, AISLE]], TILE, TL, P(0, oTm, 0))
    quad([[s * NH, FO - 8 + 0.02, AL], [s * (AH + 0.4), FO - 8 + 0.02, AISLE], [s * NH, FO - 8 + 0.02, AISLE], [s * NH, FO - 8 + 0.02, AISLE]], PINK, ST, P(0, oTm, 0))
    const hd = s > 0 ? HT : HT + Math.PI
    corbelTable(s * AH, FO - 8, s * AH, oT0, hd, AISLE)
    corbelTable(s * NH, FO, s * NH, oT0, hd, EAVE)
    // the clerestory's paired round-arched windows and the aisle's single ones, a bay every 4.6 m
    const bays = Math.max(2, Math.min(9, Math.round((oT0 - FO - 2) / 4.6)))
    for (let k = 0; k < bays; k++) {
      const o = FO - 2 + ((k + 0.5) / bays) * (oT0 - FO + 2)
      for (const d of [-0.75, 0.75]) lancet(out, at(s * (NH + 0.05), o + d), hd, 15.2, 1.0, 4.4, 'round', WHITE, GLASS)
      lancet(out, at(s * (AH + 0.05), o), hd, 3.6, 1.4, 4.6, 'round', WHITE, GLASS)
    }
  }
  // the side chapels outside the towers: flat-roofed, a corbel band, one tall arched window on the front
  for (const [u0, u1] of [[chapelLx, -(UT + T)], [UT + T, chapelR]] as [number, number][]) {
    if (u1 - u0 < 1) continue
    const um = (u0 + u1) / 2
    slab(um, FO - 1 - 4, -3, AISLE, u1 - u0, 8, PINK, ST)
    corbelTable(u0, FO - 1, u1, FO - 1, H, AISLE)
    const outer = u0 < 0 ? u0 : u1
    corbelTable(outer, FO - 1, outer, FO - 9, u0 < 0 ? HT + Math.PI : HT, AISLE)
    lancet(out, at(um, FO - 1 + 0.05), H, 3.8, 1.5, 5.0, 'round', WHITE, GLASS)
    lancet(out, at(outer + (u0 < 0 ? -0.05 : 0.05), FO - 5), u0 < 0 ? HT + Math.PI : HT, 3.8, 1.3, 4.4, 'round', WHITE, GLASS)
  }
  // the nave roof: two tile slopes from the front wall back through the crossing
  quad([[-NH - 0.5, FO + 0.2, EAVE], [-NH - 0.5, oT1, EAVE], [0, oT1, RIDGE], [0, FO + 0.2, RIDGE]], TILE, TL)
  quad([[0, FO + 0.2, RIDGE], [0, oT1, RIDGE], [NH + 0.5, oT1, EAVE], [NH + 0.5, FO + 0.2, EAVE]], TILE, TL)

  /* ---------------------------------------------------------------- the front between the towers */
  slab(0, FO - 0.3, -3, EAVE, 2 * NH + 0.2, 0.6, PINK, ST)                            // the front wall to the eaves
  gableEnd(out, at(0, FO), H, NH + 0.1, EAVE, 29.6 - EAVE, PINK, 'stucco', WHITE)    // the gable, white along its rakes
  crossFinial(out, at(0, FO - 0.2), 29.6, 1.6, COPPER)
  // the narthex: a band standing 1.6 m proud, three round portals in white archivolts, colonettes, a white top band
  const NX = FO + 1.6
  slab(0, (FO + NX) / 2, -3, 9.0, 2 * NH, NX - FO, PINK, ST)
  portal(out, at(0, NX), H, 4.2, 6.6, 'round', WHITE, { orders: 3 })
  for (const s of [-1, 1]) portal(out, at(s * 5.7, NX), H, 2.9, 5.2, 'round', WHITE, { orders: 2 })
  for (const u of [-3.1, 3.1, -8.0, 8.0]) colonette(u, NX + 0.3, G, 6.2, 0.22)
  for (const u of [-5.7, 5.7]) slab(u, NX + 0.1, 6.1, 6.9, 3.6, 0.3, WHITE, TR)        // the sculpted friezes over the side doors
  slab(0, NX + 0.1, 8.3, 9.0, 2 * NH + 0.2, 0.45, WHITE, TR)
  corbelTable(-NH, NX, NH, NX, H, 8.4)
  // the tiled pent roof over the narthex, and the gabled hood over the middle
  quad([[-NH - 0.4, NX + 0.45, 9.0], [NH + 0.4, NX + 0.45, 9.0], [NH, FO + 0.1, 10.7], [-NH, FO + 0.1, 10.7]], TILE, TL)
  quad([[-3.4, NX + 0.5, 9.0], [3.4, NX + 0.5, 9.0], [0, NX + 0.5, 11.6], [0, NX + 0.5, 11.6]], PINK, ST)
  for (const s of [-1, 1]) quad(s > 0 ? [[0, NX + 0.55, 11.7], [0, FO, 12.6], [3.6, FO, 10.7], [3.6, NX + 0.55, 8.9]]
    : [[-3.6, NX + 0.55, 8.9], [-3.6, FO, 10.7], [0, FO, 12.6], [0, NX + 0.55, 11.7]], TILE, TL)
  // the steps across the front, and their iron handrails
  // twelve risers (the Judah photograph), the top tread at the narthex; the rails' posts stand on the treads
  const RISERS = 12, RISE = 0.15, TREAD = 0.32
  for (let k = 0; k < RISERS; k++) slab(0, NX + 0.2 + (RISERS - k) * TREAD - TREAD / 2, G, G + (k + 1) * RISE, 2 * NH + 1 - k * 0.06, TREAD, STEP, surfaceTag('concrete'))
  const stepTop = (o: number): number => G + Math.max(0, Math.min(RISERS, RISERS - (o - NX - 0.2) / TREAD)) * RISE
  for (const u of [-5.9, -1.5, 1.5, 5.9]) {
    for (let k = 0; k < 4; k++) { const o = NX + 0.4 + k * 1.2; const y = stepTop(o); const p = P(u, o, 0); box(out, p[0], (y + y + 0.95) / 2, p[2], 0.03, 0.475, 0.03, IRON, MT) }
    const a = P(u, NX + 0.4, stepTop(NX + 0.4) + 0.95), b = P(u, NX + 4.0, stepTop(NX + 4.0) + 0.95)
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    const L = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    const dir: V3 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L]
    const sx: V3 = [-dir[2], 0, dir[0]]
    out.quad([[m[0] - dir[0] * L / 2 - sx[0] * 0.03, m[1] - dir[1] * L / 2, m[2] - dir[2] * L / 2 - sx[2] * 0.03],
      [m[0] + dir[0] * L / 2 - sx[0] * 0.03, m[1] + dir[1] * L / 2, m[2] + dir[2] * L / 2 - sx[2] * 0.03],
      [m[0] + dir[0] * L / 2 + sx[0] * 0.03, m[1] + dir[1] * L / 2 + 0.05, m[2] + dir[2] * L / 2 + sx[2] * 0.03],
      [m[0] - dir[0] * L / 2 + sx[0] * 0.03, m[1] - dir[1] * L / 2 + 0.05, m[2] - dir[2] * L / 2 + sx[2] * 0.03]], [0, 1, 0], UV, IRON, MT)
  }
  // the rose: a twelve-spoked wheel in a wide white rim
  roseWindow(out, at(0, FO), H, 15.8, 3.0, WHITE, { spokes: 12, wheel: true, glass: GLASS })
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2
    quad([[Math.cos(a0) * 3.3, FO + 0.1, 15.8 + Math.sin(a0) * 3.3], [Math.cos(a0) * 3.8, FO + 0.1, 15.8 + Math.sin(a0) * 3.8],
      [Math.cos(a1) * 3.8, FO + 0.1, 15.8 + Math.sin(a1) * 3.8], [Math.cos(a1) * 3.3, FO + 0.1, 15.8 + Math.sin(a1) * 3.3]], WHITE, TR)
  }
  // the gallery: a white blind arcade of colonettes under an entablature, a statue niche under a little pediment
  slab(0, FO + 0.08, 20.0, 22.6, 13.0, 0.1, PINK_DEEP, ST)
  for (let k = 0; k <= 8; k++) { const u = -6 + k * 1.5; if (Math.abs(u) > 1.2) colonette(u, FO + 0.3, 20.0, 22.6, 0.16) }
  slab(0, FO + 0.3, 22.6, 23.3, 13.4, 0.6, WHITE, TR)
  slab(0, FO + 0.3, 19.5, 20.0, 13.4, 0.6, WHITE, TR)
  slab(0, FO + 0.45, 19.5, 23.3, 2.8, 0.9, WHITE, TR)
  slab(0, FO + 0.9, 20.2, 22.7, 1.3, 0.1, GLASS, 0)
  quad([[-1.8, FO + 0.9, 23.3], [1.8, FO + 0.9, 23.3], [0, FO + 0.9, 24.5], [0, FO + 0.9, 24.5]], WHITE, TR)
  quad([[-1.8, FO + 0.9, 23.3], [0, FO + 0.9, 24.5], [0, FO, 24.5], [-1.8, FO, 23.3]], TILE, TL)
  quad([[1.8, FO, 23.3], [0, FO, 24.5], [0, FO + 0.9, 24.5], [1.8, FO + 0.9, 23.3]], TILE, TL)

  /* ---------------------------------------------------------------- the twin campaniles */
  for (const s of [-1, 1]) {
    const uT = s * UT, oT = -T
    slab(uT, oT, -3, 36.8, 2 * T, 2 * T, PINK, ST)
    for (const y of [22.3, 30.8]) slab(uT, oT, y, y + 0.35, 2 * T + 0.3, 2 * T + 0.3, WHITE, TR)      // string courses
    corbelTable(uT - T, 0, uT + T, 0, H, 36.8)
    corbelTable(uT + T, 0, uT + T, -2 * T, HT, 36.8)
    corbelTable(uT + T, -2 * T, uT - T, -2 * T, H + Math.PI, 36.8)
    corbelTable(uT - T, -2 * T, uT - T, 0, HT + Math.PI, 36.8)
    slab(uT, oT, 36.8, 37.6, 2 * T + 0.7, 2 * T + 0.7, WHITE, TR)
    // the red-tile pyramid and its copper cross
    const r = T + 0.45, y0 = 37.6, y1 = 42.6
    const c: [number, number][] = [[uT - r, oT - r], [uT + r, oT - r], [uT + r, oT + r], [uT - r, oT + r]]
    for (let k = 0; k < 4; k++) quad([[c[k][0], c[k][1], y0], [c[(k + 1) % 4][0], c[(k + 1) % 4][1], y0], [uT, oT, y1], [uT, oT, y1]], TILE, TL, P(uT, oT, 0))
    { const p = P(uT, oT, 0); prism(out, p[0], p[2], y1 - 0.1, y1 + 0.5, 0.25, 8, COPPER, MT, 0.12) }
    crossFinial(out, at(uT, oT), y1 + 0.4, 1.5, COPPER)
    // the faces: slits low down, a triple arcade stage, quatrefoils, the triple-arched belfry
    const faces: [number, number, number][] = [[uT, 0, H], [uT + s * T, oT, s > 0 ? HT : HT + Math.PI], [uT, -2 * T, H + Math.PI], [uT - s * T, oT, s > 0 ? HT + Math.PI : HT]]
    faces.forEach(([fu, fo, hd], fi) => {
      const [ox, oz] = dirUO(hd)
      // d along the face (the outward direction turned a quarter), pr proud of it
      const face = (d: number, pr: number): P2 => at(fu + oz * d + ox * pr, fo - ox * d + oz * pr)
      if (fi < 2) for (const d of [-0.8, 0.8]) lancet(out, face(d, 0.05), hd, 11.0, 0.7, 3.6, 'round', WHITE, GLASS)
      for (const [yb, h] of [[23.2, 4.0], [31.8, 4.6]] as [number, number][]) {
        const p = face(0, 0.03)
        boxAlong(out, p.x, yb + h / 2 + 0.3, p.z, 2.55, h / 2 + 0.3, 0.03, hd, PINK_DEEP, ST)
        for (const d of [-1.6, 0, 1.6]) lancet(out, face(d, 0.08), hd, yb, 1.15, h, 'round', WHITE, GLASS)
        for (const d of [-2.4, -0.8, 0.8, 2.4]) { const q = face(d, 0.28); prism(out, q.x, q.z, yb, yb + h * 0.62, 0.15, 6, WHITE, TR) }
      }
      for (const d of [-1.1, 1.1]) roseWindow(out, face(d, 0.05), hd, 29.4, 0.45, WHITE, { spokes: 2, glass: GLASS })
    })
  }

  /* ---------------------------------------------------------------- the transept and the crossing */
  slab((tL + tR) / 2, oTm, -3, EAVE, tR - tL, oT0 - oT1, PINK, ST)
  quad([[tL - 0.5, oT0 + 0.5, EAVE], [tR + 0.5, oT0 + 0.5, EAVE], [tR + 0.5, oTm, RIDGE], [tL - 0.5, oTm, RIDGE]], TILE, TL)
  quad([[tL - 0.5, oTm, RIDGE], [tR + 0.5, oTm, RIDGE], [tR + 0.5, oT1 - 0.5, EAVE], [tL - 0.5, oT1 - 0.5, EAVE]], TILE, TL)
  for (const [u, hd] of [[tL, HT + Math.PI], [tR, HT]] as [number, number][]) {
    const sgn = hd === HT ? 1 : -1
    gableEnd(out, at(u + sgn * 0.02, oTm), hd, (oT0 - oT1) / 2 + 0.3, EAVE, RIDGE - EAVE, PINK, 'stucco', WHITE)
    roseWindow(out, at(u + sgn * 0.06, oTm), hd, EAVE + 2.8, 1.8, WHITE, { spokes: 8, glass: GLASS })
    corbelTable(u, oT0, u, oT1, hd, EAVE)
    for (const d of [-4.5, 0, 4.5]) lancet(out, at(u + sgn * 0.05, oTm + d), hd, 7.5, 1.5, 7.0, 'round', WHITE, GLASS)
    for (const d of [-7.5, -2.5, 2.5, 7.5]) lancet(out, at(u + sgn * 0.05, oTm + d), hd, 2.0, 1.2, 3.2, 'round', WHITE, GLASS)
  }
  for (const [o, hd] of [[oT0, H], [oT1, H + Math.PI]] as [number, number][]) {
    for (const [u0, u1] of [[tL, -AH], [AH, tR]] as [number, number][]) {
      if (u1 - u0 < 2) continue
      corbelTable(hd === H ? u0 : u1, o, hd === H ? u1 : u0, o, hd, EAVE)
      const n = Math.max(1, Math.round((u1 - u0) / 4))
      for (let k = 0; k < n; k++) lancet(out, at(u0 + ((k + 0.5) / n) * (u1 - u0), o + (hd === H ? 0.05 : -0.05)), hd, 8, 1.3, 6, 'round', WHITE, GLASS)
    }
  }
  // the octagonal crossing drum, its tiled pyramid, and the lantern
  const DR = Math.min(8.2, (oT0 - oT1) / 2 - 1.5)
  // the drum stands four metres clear of the ridges (Strawberry Hill), a pair of round-arched windows in each face
  const DT = 31.6
  polyDrum(0, oTm, EAVE - 1, DT, DR, DR, 8, PINK, ST)
  for (let k = 0; k < 8; k++) {
    const am = (k / 8) * Math.PI * 2, [ox, oz] = dirUO(H + am), rf = DR * Math.cos(Math.PI / 8)
    const [fu, fo] = [Math.sin(am) * rf, oTm + Math.cos(am) * rf]
    for (const d of [-1.3, 1.3]) lancet(out, at(fu + ox * 0.05 + oz * d, fo + oz * 0.05 - ox * d), H + am, DT - 4.2, 1.1, 3.0, 'round', WHITE, GLASS)
  }
  polyDrum(0, oTm, DT - 0.7, DT, DR + 0.25, DR + 0.25, 8, WHITE, TR)
  polyDrum(0, oTm, DT, DT + 0.3, DR + 0.6, DR + 0.6, 8, WHITE, TR, true)
  // the pyramid is shallow — the photograph has it rising barely a third of its span — and the lantern on it is
  // small, an open cupola a few metres across, not a third tower
  polyDrum(0, oTm, DT + 0.3, DT + 3.6, DR + 0.6, 1.6, 8, TILE, TL, true)
  polyDrum(0, oTm, DT + 3.6, DT + 5.9, 1.45, 1.45, 8, PINK, ST)
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2, am = (k / 8) * Math.PI * 2
    const q = P(Math.sin(am) * 1.47, oTm + Math.cos(am) * 1.47, 0)
    boxAlong(out, q[0], DT + 4.75, q[2], 0.38, 0.85, 0.03, H + am, GLASS, 0)
    const c = P(Math.sin(a) * 1.5, oTm + Math.cos(a) * 1.5, 0)
    prism(out, c[0], c[2], DT + 3.7, DT + 5.8, 0.12, 6, WHITE, TR)
  }
  polyDrum(0, oTm, DT + 5.9, DT + 6.25, 1.9, 1.9, 8, WHITE, TR, true)
  polyDrum(0, oTm, DT + 6.25, DT + 7.9, 1.9, 0.0, 8, TILE, TL)
  crossFinial(out, at(0, oTm), DT + 7.9, 1.2, COPPER)

  /* ---------------------------------------------------------------- the apse and the rear wing */
  const RA = Math.min(7.5, (tR - tL) * 0.2), RB = RA + 3.0
  const rearD = oT1 - oEnd
  slab((rL + rR) / 2, (oT1 + oEnd) / 2, -3, 8.0, rR - rL, rearD, PINK, ST)                 // the parish wing
  corbelTable(rR, oT1, rR, oEnd, HT, 8.0)
  corbelTable(rL, oEnd, rL, oT1, HT + Math.PI, 8.0)
  corbelTable(rR, oEnd, rL, oEnd, H + Math.PI, 8.0)
  for (const [u, hd] of [[rR, HT], [rL, HT + Math.PI]] as [number, number][]) {
    const n = Math.max(1, Math.min(8, Math.round(rearD / 3.2)))
    for (let k = 0; k < n; k++) for (const y of [1.6, 4.6]) {
      const p = at(u + (hd === HT ? 0.03 : -0.03), oT1 - ((k + 0.5) / n) * rearD)
      boxAlong(out, p.x, y + 0.9, p.z, 0.7, 0.9, 0.03, hd, GLASS, 0)
    }
  }
  { const n = Math.max(1, Math.min(12, Math.round((rR - rL) / 3.2)))
    for (let k = 0; k < n; k++) for (const y of [1.6, 4.6]) {
      const p = at(rL + ((k + 0.5) / n) * (rR - rL), oEnd - 0.03)
      boxAlong(out, p.x, y + 0.9, p.z, 0.7, 0.9, 0.03, H + Math.PI, GLASS, 0)
    } }
  // the apse: a tall round upper storey of blind arches under a conical tile roof, over a wider ambulatory ring
  const apseRing = (r: number, n: number, y0: number, y1: number, c: Rgb, tag: number, win: ((u: number, o: number, hd: number, w: number) => void) | null): void => {
    for (let k = 0; k < n; k++) {
      const a0 = -Math.PI / 2 + (k / n) * Math.PI, a1 = -Math.PI / 2 + ((k + 1) / n) * Math.PI
      const p0: [number, number] = [r * Math.sin(a0), oT1 - r * Math.cos(a0)], p1: [number, number] = [r * Math.sin(a1), oT1 - r * Math.cos(a1)]
      quad([[p0[0], p0[1], y0], [p1[0], p1[1], y0], [p1[0], p1[1], y1], [p0[0], p0[1], y1]], c, tag, P(0, oT1, 0))
      if (win) {
        const am = (a0 + a1) / 2
        const dx = Math.sin(am), dz = -Math.cos(am)                    // outward in (u, o)
        const hd = Math.atan2(tx * dx + nx * dz, tz * dx + nz * dz)
        win(r * Math.sin(am) + dx * 0.05, oT1 - r * Math.cos(am) + dz * 0.05, hd, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]))
      }
    }
  }
  apseRing(RB, 11, -3, AISLE, PINK, ST, (u, o, hd, w) => lancet(out, at(u, o), hd, 3.6, Math.min(1.4, w * 0.45), 4.4, 'round', WHITE, GLASS))
  apseRing(RB + 0.2, 11, AISLE - 0.5, AISLE, WHITE, TR, null)
  for (let k = 0; k < 11; k++) {   // the ambulatory's roof: a tile lean-to ring rising to the upper apse wall
    const a0 = -Math.PI / 2 + (k / 11) * Math.PI, a1 = -Math.PI / 2 + ((k + 1) / 11) * Math.PI
    const ro = RB + 0.4, ri = RA + 0.3, AT = AISLE + 2.4
    quad([[ro * Math.sin(a0), oT1 - ro * Math.cos(a0), AISLE], [ro * Math.sin(a1), oT1 - ro * Math.cos(a1), AISLE],
      [ri * Math.sin(a1), oT1 - ri * Math.cos(a1), AT], [ri * Math.sin(a0), oT1 - ri * Math.cos(a0), AT]], TILE, TL, P(0, oT1, 0))
  }
  const APSE = 20.0
  apseRing(RA, 9, AISLE - 1, APSE, PINK, ST, (u, o, hd, w) => lancet(out, at(u, o), hd, 13.6, Math.min(2.3, w * 0.6), 5.6, 'round', WHITE, PINK_DEEP))
  apseRing(RA + 0.25, 9, APSE - 0.6, APSE, WHITE, TR, null)
  for (let k = 0; k < 9; k++) {    // the conical roof
    const a0 = -Math.PI / 2 + (k / 9) * Math.PI, a1 = -Math.PI / 2 + ((k + 1) / 9) * Math.PI
    quad([[(RA + 0.5) * Math.sin(a0), oT1 - (RA + 0.5) * Math.cos(a0), APSE], [(RA + 0.5) * Math.sin(a1), oT1 - (RA + 0.5) * Math.cos(a1), APSE], [0, oT1 + 1.5, 25.0], [0, oT1 + 1.5, 25.0]], TILE, TL, P(0, oT1, 0))
  }
  crossFinial(out, at(0, oT1 + 1.5), 25.0, 1.0, COPPER)
}

export const ST_ANNE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { stAnneOfTheSunset_850_Judah }
