import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, classicalColumn, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, slab, type Pal } from '../palaces/common.ts'
import { pal } from './churches.ts'
import { FIXED } from './common.ts'
import { bar, boxOn, cappedTurret, edgeFrame, faceFrame, flyingButtress, gothicBalustrade, gothicPortal, niche, pilaster, pinnacle, rect, roseWindow, traceryWindow, type Frame } from './gothic.ts'

/*
 * SAINT-EUSTACHE (1532–1632; the west front Mansart de Jouy's and Moreau-Desproux's, 1754–88), the great church of Les
 * Halles: a Gothic body in Renaissance dress. The owner, with a street view of it from the Allée Jules-Supervielle:
 * "the church near des halles is incredibly elaborate, and we make a decent attempt, but it doesn't quite get there".
 * That view looks north-east, at the SOUTH TRANSEPT and the south flank, local +x here, and what it shows is what is drawn:
 *
 * - the FRONTISPIECE of the transept: a tall front under a pointed gable with a small rose and two round turrets with
 *   little domed caps; the great ROSE under that, a balustraded gallery under the rose, two rows of round-headed lancets,
 *   a deep arched portal with a tracery fan over paired doors, and sculpted piers either side;
 * - to each side a long ground storey of large ROUND-ARCHED windows with TRACERY, pilasters with Corinthian caps between
 *   them, and a heavy balustrade over;
 * - above that the FLYING BUTTRESSES, two flights in two tiers at every bay, and stacked pinnacles on their piers, and the
 *   clerestory of more tracery windows behind them;
 * - the high steep slate roof over everything.
 *
 * The rest from OSM's parts, measured in this frame with osmium (2026-10-30): way 53762963's outline for the chapels (the
 * south flank really is off the axis, 19.8 m out at the west end and 24.2 at the transept); 273063681 the aisles at 18 m;
 * 273063682 the nave, ridge 40; 273063684 the transept; 273063680 the Lady Chapel at 25; 273063678/679 the towers at 24 and
 * 38; 273063683…695 the cross-walls that are the flyers (their z's are `FLYERS`) and 273063691…699 the lines of their piers;
 * 273063701…703 the crossing's lantern. The frame is the nave's own axis, bearing 99.2 (every one of those walls agrees
 * within 0.1°; the first placement's 97.9 was the footprint's box): −z west, +x south.
 *
 * The body is solid blocks; every opening is the screens and nets of gothic.ts (the model was 4,010 triangles with flat dark
 * arches, and is about 16,000 with these).
 */
const EX = 24.7
const EZ = 54.3
export function saintEustache(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, EX, EZ, (q) => eustache(q))
}

/** the nave's walls, its eaves and ridge */
const NV = { x0: -5.2, x1: 7.7, z0: -45.4, z1: 25.2, eaves: 31, ridge: 40 }
const NCX = (NV.x0 + NV.x1) / 2
/** the aisles' outer walls and their head */
const AISLE = { x0: -16.6, x1: 19.9, z0: -41, z1: 19.6, h: 18 }
/** where the chapels' wall stops, under the balustrade */
const CHAPEL_H = 10
/** the transept: its z's, its middle (the crossing's), and the two fronts' planes (the north's is recessed between its turrets) */
const TR = { z0: -11.5, z1: 2.1, zm: -4.7, south: 23.4, north: -20.5 }
/** OSM's cross-walls: where a flyer stands */
const FLYERS = [-34.3, -28.4, -22.85, -16.75, 7.5, 13.2, 19.1]
/** the flyers' piers on each side: the outer on the aisle wall, the inner between the two aisles, as OSM's long walls */
const PIERS = { south: { outer: 19.4, inner: 13.9, wall: NV.x1 }, north: { outer: -16.1, inner: -10.6, wall: NV.x0 } }

type P2 = { x: number; z: number }
const pt = (x: number, z: number): P2 => ({ x, z })
const INSIDE = pt(1, 0)

/** The chapels' outline, off way 53762963, cut back between the transept's piers so its fronts can stand clear. */
const CHAPELS: P2[] = [
  pt(19.8, -40.4), pt(24.2, -14.3), pt(22.9, -13.4), pt(22.9, 2.1), pt(23.5, 2.1), pt(22.8, 20.3), pt(22.3, 26.2), pt(19.5, 32.1), pt(17.2, 39.9),
  pt(14.3, 50.3), pt(13.9, 52.6), pt(10.4, 54.3), pt(2.2, 49.5), pt(-4.1, 45.6), pt(-18.6, 36.2), pt(-24.7, 31.8), pt(-20.8, 24.8), pt(-19.6, 19.2),
  pt(-20, 5.5), pt(-20.4, 3.6), pt(-20.4, -12.6), pt(-20.5, -12.8), pt(-21.1, -41.1),
]
/** The aisles' ring round the choir (way 273063681 past the last flyer) */
const AMBULATORY: P2[] = [
  pt(19.9, 19.6), pt(18.7, 24.4), pt(16.2, 29.3), pt(12.3, 33.7), pt(7.7, 36.6), pt(-4.8, 36.3), pt(-9.9, 32.8), pt(-13, 29.3), pt(-14.9, 25.7), pt(-16.5, 19.6),
]
/** The Lady Chapel's plan (way 273063680), east of the ambulatory */
const LADY: P2[] = [
  pt(2.8, 30), pt(7.2, 36.8), pt(7.9, 38.7), pt(8.2, 40.9), pt(7.9, 42.7), pt(6.9, 45.2), pt(5.4, 46.3), pt(3.5, 47.3), pt(1.4, 47.4), pt(-0.8, 47.1),
  pt(-2.7, 46.1), pt(-4.3, 44.6), pt(-5.3, 42.3), pt(-5.6, 40.6), pt(-5.2, 38.7), pt(-4.4, 36.4), pt(-0.3, 30),
]

function eustache(out: MeshBuilder): void {
  const p = pal('#d3c9b4')
  mass(out, p)
  groundStorey(out, p)
  upperWindows(out, p)
  flyers(out, p)
  transeptFront(out, faceFrame(out, '+x', TR.south), 1, 1.2, p)
  transeptFront(out, faceFrame(out, '-x', TR.north), -1, 2.9, p)
  chevet(out, p)
  westFront(out, p)
}

/** The solids, roofs and leads: everything the dress stands on. */
function mass(out: MeshBuilder, p: Pal): void {
  slab(out, CHAPELS, 0, CHAPEL_H, p.lead, p.stone)
  // the chapels' walls in stone (the slab's are the lead's colour: only its top is meant to be seen)
  for (let i = 0; i < CHAPELS.length; i++) {
    const a = CHAPELS[i]
    const b = CHAPELS[(i + 1) % CHAPELS.length]
    rect(edgeFrame(out, a, b, INSIDE), 0, Math.hypot(b.x - a.x, b.z - a.z), 0, CHAPEL_H, 0.04, p.stone)
  }
  // the aisles, the nave, the transept, standing on them
  block(out, AISLE.x0, AISLE.x1, AISLE.z0, AISLE.z1, CHAPEL_H - 0.1, AISLE.h, p.stone)
  block(out, NV.x0, NV.x1, NV.z0, NV.z1, AISLE.h - 0.1, NV.eaves, p.stone)
  block(out, -19.6, TR.south, TR.z0, TR.z1, 0, NV.eaves, p.stone)
  // the aisles' low slate roofs, up to the nave's wall, and the chapels' lean-to up to the aisles' wall
  const sl = (a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number], nx: number, ny: number): void =>
    out.quad([a, b, c, d], [nx, ny, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  sl([AISLE.x1 + 0.3, AISLE.h, AISLE.z0], [AISLE.x1 + 0.3, AISLE.h, AISLE.z1], [NV.x1, AISLE.h + 4.4, AISLE.z1], [NV.x1, AISLE.h + 4.4, AISLE.z0], 0.34, 0.94)
  sl([AISLE.x0 - 0.3, AISLE.h, AISLE.z0], [AISLE.x0 - 0.3, AISLE.h, AISLE.z1], [NV.x0, AISLE.h + 4.4, AISLE.z1], [NV.x0, AISLE.h + 4.4, AISLE.z0], -0.34, 0.94)
  const lean = CHAPEL_H + 2.2
  sl([19.8, CHAPEL_H + 0.1, -40.4], [24.2, CHAPEL_H + 0.1, -14.3], [AISLE.x1, lean, -14.3], [AISLE.x1, lean, -40.4], 0.34, 0.94)
  sl([23.5, CHAPEL_H + 0.1, 2.1], [22.8, CHAPEL_H + 0.1, 20.3], [AISLE.x1, lean, 20.3], [AISLE.x1, lean, 2.1], 0.34, 0.94)
  sl([-21.1, CHAPEL_H + 0.1, -41.1], [-20.5, CHAPEL_H + 0.1, -12.8], [AISLE.x0, lean, -12.8], [AISLE.x0, lean, -41.1], -0.34, 0.94)
  sl([-20, CHAPEL_H + 0.1, 3.6], [-19.6, CHAPEL_H + 0.1, 19.2], [AISLE.x0, lean, 19.2], [AISLE.x0, lean, 3.6], -0.34, 0.94)
  // the high roofs: the nave's ridge over its whole length, the transept's across it
  const half = (NV.x1 - NV.x0) / 2
  roof(out, NV.x0 - 0.4, NV.x1 + 0.4, NV.z0 - 0.1, NV.z1, NV.eaves, NV.ridge - NV.eaves, half + 0.4, 0.01, p.slate)
  const tHalf = (TR.z1 - TR.z0) / 2
  roof(out, -19.9, TR.south, TR.z0 - 0.4, TR.z1 + 0.4, NV.eaves, NV.ridge - NV.eaves, 0.01, tHalf + 0.4, p.slate)
  // the lead crest along the ridges, which draws the roof's line against the sky
  block(out, NV.x0 + half - 0.1, NV.x0 + half + 0.1, NV.z0, NV.z1, NV.ridge - 0.05, NV.ridge + 0.35, p.lead)
  block(out, -19.6, TR.south - 1, TR.zm - 0.1, TR.zm + 0.1, NV.ridge - 0.05, NV.ridge + 0.35, p.lead)
  // the crossing's slender lantern: OSM's 40 m base, 46 m pyramid, 50 m ball, in lead
  prism(out, NCX + 0.5, TR.zm, NV.ridge - 1.2, NV.ridge + 2, 2.9, 8, p.lead, FIXED, 2.5, false)
  prism(out, NCX + 0.5, TR.zm, NV.ridge + 2, NV.ridge + 5.5, 2.5, 8, shade(p.lead, 1.1), FIXED, 1.1, false)
  prism(out, NCX + 0.5, TR.zm, NV.ridge + 5.5, NV.ridge + 7.4, 1.1, 8, p.dark, FIXED, 1.0, false)
  prism(out, NCX + 0.5, TR.zm, NV.ridge + 7.4, NV.ridge + 11.5, 1.2, 8, p.lead, FIXED, 0.03, false)
}

/**
 * The ground storey along a wall: `n` bays of round-arched tracery windows through a stone screen, pilasters between them,
 * an entablature and a heavy balustrade over.
 */
function chapelRun(fr: Frame, L: number, n: number, p: Pal, lights = 3): void {
  const bay = L / n
  const top = CHAPEL_H - 0.7
  const w = Math.min(4.2, bay * 0.66)
  // the plinth under it all
  boxOn(fr, 0, L, 0, 1.1, 0, 0.5, shade(p.stone, 0.92))
  for (let i = 0; i < n; i++) {
    const u = bay * (i + 0.5)
    traceryWindow(fr, u, 2.1, w, top - 2.1 - 0.35, { stone: p.stone, glass: p.glass, head: 'round', lights, screen: { u0: u - bay / 2, u1: u + bay / 2, base: 1.1, top, d: 0.34 } })
  }
  for (let i = 0; i <= n; i++) pilaster(fr, bay * i, 1.1, top, 0.85, 0.58, p.stone)
  // the entablature and the balustrade
  boxOn(fr, -0.1, L + 0.1, top, CHAPEL_H - 0.18, 0, 0.5, p.trim)
  boxOn(fr, -0.2, L + 0.2, CHAPEL_H - 0.18, CHAPEL_H + 0.1, 0, 0.72, shade(p.trim, 1.03), true)
  gothicBalustrade(fr, 0, L, CHAPEL_H + 0.1, 1.15, { stone: p.trim, d: 0.5, pitch: 0.8 })
}

function groundStorey(out: MeshBuilder, p: Pal): void {
  const run = (a: P2, b: P2, n: number, lights = 3): void => {
    const fr = edgeFrame(out, a, b, INSIDE)
    chapelRun(fr, fr.L, n, p, lights)
  }
  run(pt(19.8, -40.4), pt(24.2, -14.3), 4)
  run(pt(23.5, 2.1), pt(22.8, 20.3), 3)
  run(pt(-20.5, -12.8), pt(-21.1, -41.1), 4)
  run(pt(-20, 3.6), pt(-19.6, 19.2), 2)
  // the choir's chapels: the same round-headed windows, fewer lights, with no order between them
  for (const [a, b] of [[pt(22.8, 20.3), pt(22.3, 26.2)], [pt(22.3, 26.2), pt(19.5, 32.1)], [pt(19.5, 32.1), pt(17.2, 39.9)], [pt(17.2, 39.9), pt(14.3, 50.3)],
    [pt(2.2, 49.5), pt(-4.1, 45.6)], [pt(-4.1, 45.6), pt(-18.6, 36.2)], [pt(-18.6, 36.2), pt(-24.7, 31.8)], [pt(-20.8, 24.8), pt(-19.6, 19.2)]] as [P2, P2][]) {
    const fr = edgeFrame(out, a, b, pt(1, 32))
    const n = Math.max(1, Math.round(fr.L / 7))
    const bay = fr.L / n
    for (let i = 0; i < n; i++) traceryWindow(fr, bay * (i + 0.5), 2.2, Math.min(3, bay * 0.56), 6, { stone: p.stone, glass: p.glass, head: 'round', lights: 2, far: true })
    boxOn(fr, 0, fr.L, CHAPEL_H - 0.5, CHAPEL_H, 0, 0.4, p.trim)
  }
}

/** The bays between one flyer's plane and the next, as z's: `[from, to]`, skipping the transept. */
const CLERE: [number, number][] = [[-40, -34.3], [-34.3, -28.4], [-28.4, -22.85], [-22.85, -16.75], [-16.75, TR.z0], [TR.z1, 7.5], [7.5, 13.2], [13.2, 19.1], [19.1, NV.z1]]

/** The clerestory over the flyers' feet and the aisles' upper windows over the chapels' roofs. */
function upperWindows(out: MeshBuilder, p: Pal): void {
  for (const [f, wallX, aisleX] of [['+x', NV.x1, AISLE.x1], ['-x', NV.x0, AISLE.x0]] as const) {
    const near = f === '+x'
    const nave = faceFrame(out, f, wallX)
    const aisle = faceFrame(out, f, aisleX)
    for (const [z0, z1] of CLERE) {
      const m = (z0 + z1) / 2
      const w = Math.min(3.6, (z1 - z0) * 0.68)
      traceryWindow(nave, m, 23.4, w, 6.9, { stone: p.stone, glass: p.glass, head: 'pointed', lights: 3, far: !near })
      if (z1 <= AISLE.z1 && (z1 < TR.z0 + 0.1 || z0 > TR.z1 - 0.1)) {
        traceryWindow(aisle, m, CHAPEL_H + 2.8, w * 0.9, AISLE.h - CHAPEL_H - 3.4, { stone: p.stone, glass: p.glass, head: 'round', lights: 2, far: true })
      }
    }
    // the nave's cornice, and a balustrade on it from the transept west, where the owner's view has it
    boxOn(nave, NV.z0, NV.z1, NV.eaves - 0.5, NV.eaves + 0.08, 0, 0.45, p.trim, true)
    boxOn(aisle, AISLE.z0, AISLE.z1, AISLE.h - 0.42, AISLE.h + 0.08, 0, 0.4, p.trim, true)
    if (near) gothicBalustrade(nave, -40, NV.z1, NV.eaves + 0.08, 0.95, { stone: p.trim, d: 0.4, pitch: 1.3 })
  }
  // the transept's long walls over the aisles: a great window each side of each arm
  for (const [f, z] of [['-z', TR.z0], ['+z', TR.z1]] as const) {
    const fr = faceFrame(out, f, z)
    for (const x of [13.8, -11]) traceryWindow(fr, x, 21, 6, 9, { stone: p.stone, glass: p.glass, head: 'pointed', lights: 4, far: true })
    boxOn(fr, -19.6, TR.south, NV.eaves - 0.5, NV.eaves + 0.08, 0, 0.45, p.trim, true)
  }
}

/** A pier for a flyer: square, broken by a course, with its stacked pinnacle. */
function flyerPier(out: MeshBuilder, x: number, z: number, y0: number, y1: number, w: number, top: number, p: Pal): void {
  const c = p.stone
  prism(out, x, z, y0, y1, w * 0.72, 4, c, FIXED, w * 0.72, false)
  prism(out, x, z, y1 - 0.5, y1, w * 0.86, 4, p.trim, FIXED, w * 0.86, false)
  pinnacle(out, x, z, y1, top - y1, w * 0.72, p.trim, 2)
}

/**
 * The flyers: at each of OSM's cross-walls, each side, an outer pier on the aisle wall and an inner one between the
 * aisles, each carrying its stacked pinnacle, and two tiers of arches, outer pier to inner and inner to the nave's wall.
 */
function flyers(out: MeshBuilder, p: Pal): void {
  const stone = shade(p.stone, 0.97)
  for (const side of [PIERS.south, PIERS.north]) {
    for (const z of FLYERS) {
      flyerPier(out, side.outer, z, CHAPEL_H + 2, 26.6, 1.15, 34.2, p)
      flyerPier(out, side.inner, z, AISLE.h + 1, 31.4, 1.1, 38.2, p)
      const seat = side.wall + Math.sign(side.outer - side.wall) * 0.05
      const sgn = Math.sign(side.outer - side.wall)
      const ip = side.inner - sgn * 0.5
      const op = side.outer - sgn * 0.55
      flyingButtress(out, [ip, 29.6, z], [seat, 30.9, z], 0.62, stone, { drop: 2.8 })
      flyingButtress(out, [ip, 25.3, z], [seat, 26.4, z], 0.62, stone, { drop: 3.0 })
      flyingButtress(out, [op, 26.2, z], [side.inner + sgn * 0.5, 27.8, z], 0.6, stone, { drop: 2.6 })
      flyingButtress(out, [op, 22.2, z], [side.inner + sgn * 0.5, 23.6, z], 0.6, stone, { drop: 2.8 })
    }
  }
}

/**
 * A TRANSEPT FRONT on `fr` (u is z): the owner's whole composition, from the ground up. `s` which way out in x, `pierD`
 * how far the piers stand out of the plane (the north front is recessed between its turrets by more than the south).
 */
function transeptFront(out: MeshBuilder, fr: Frame, s: number, pierD: number, p: Pal): void {
  const m = TR.zm
  const hw = 7.6
  const glass = p.glass
  // north, the wall itself: the transept's block runs only to −19.6
  if (s < 0) block(out, TR.north, -19.5, TR.z0, TR.z1, 0, NV.eaves, p.stone)
  // the wall between the piers, a little proud of the block
  rect(fr, m - hw, m + hw, 0, NV.eaves, 0.02, p.stone)
  // the portal, its plinth, its steps
  gothicPortal(fr, m, 0.45, 8, 10.4, { stone: p.stone, dark: p.glass, door: [0.24, 0.17, 0.12], depth: 1.05, orders: 3, head: 'round' })
  for (let i = 0; i < 2; i++) boxOn(fr, m - 5 + i * 0.3, m + 5 - i * 0.3, i * 0.2, (i + 1) * 0.22, 0, 1.9 - i * 0.4, shade(p.stone, 0.86))
  // over the portal: a string course, and the two rows of round-headed lancets
  boxOn(fr, m - hw, m + hw, 11, 11.45, 0, 0.42, p.trim, true)
  for (const [y0, n] of [[11.85, 6], [15.25, 6]] as const) {
    const sp = 11 / n
    for (let i = 0; i < n; i++) traceryWindow(fr, m - 5.5 + sp * (i + 0.5), y0, sp * 0.62, 2.95, { stone: p.stone, glass, head: 'round', lights: 1, far: true })
  }
  // the gallery under the rose
  boxOn(fr, m - hw, m + hw, 18.55, 19, 0, 0.62, p.trim, true)
  gothicBalustrade(fr, m - hw + 0.4, m + hw - 0.4, 19, 1.2, { stone: p.trim, d: 0.58, pitch: 0.62, every: 5 })
  // the great rose, cut through its sheet of stone
  roseWindow(fr, m, 25.1, 4.7, { stone: p.stone, glass, spokes: 12, d: 0.34, panel: 5.7 })
  // the cornice, and over it the gable
  boxOn(fr, m - hw, m + hw, 30.6, NV.eaves + 0.2, 0, 0.6, p.trim, true)
  const gw = hw - 0.8
  const gy = NV.eaves + 0.2
  const gt = NV.ridge + 0.8
  fr.out.quad([fr.P(m - gw, gy, 0.06), fr.P(m + gw, gy, 0.06), fr.P(m, gt, 0.06), fr.P(m, gt, 0.06)], fr.n, [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  for (const d of [-1, 1]) {
    // the coping up each rake, and a pale band inside it
    const a: [number, number] = [m + d * (gw + 0.35), gy - 0.1]
    const b: [number, number] = [m, gt + 0.35]
    bar(fr, a, b, 0.55, 0.3, p.trim)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    fr.out.quad([fr.P(a[0], a[1] + 0.28, 0.3), fr.P(b[0], b[1] + 0.28, 0.3), fr.P(b[0], b[1] + 0.28, -0.6), fr.P(a[0], a[1] + 0.28, -0.6)], [fr.t[0] * d * 0.65, (gw / L), fr.t[2] * d * 0.65], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(p.trim, 1.05), FIXED)
  }
  roseWindow(fr, m, gy + 3.3, 1.35, { stone: p.stone, glass, spokes: 8, d: 0.2, far: true })
  traceryWindow(fr, m, gy + 0.3, 3.2, 1.05, { stone: p.stone, glass, head: 'round', lights: 2, far: true })
  // a finial on the apex
  const [fx, , fz] = fr.P(m, 0, 0.1)
  prism(out, fx, fz, gt + 0.1, gt + 2, 0.3, 4, p.trim, FIXED, 0.03, false)
  // the two sculpted piers either side, and the round turrets on them
  for (const d of [-1, 1]) {
    const u = m + d * hw
    const w = 1.2
    boxOn(fr, u - w - 0.1, u + w + 0.1, 0, 1.5, 0, pierD + 0.2, shade(p.stone, 0.92))
    boxOn(fr, u - w, u + w, 1.5, 28, 0, pierD, p.stone)
    // its courses, and a stage of niches over each
    for (const y of [8.4, 14.6, 21]) boxOn(fr, u - w - 0.08, u + w + 0.08, y, y + 0.3, 0, pierD + 0.1, p.trim)
    for (const y of [3, 9.6, 15.9]) niche(faceAt(fr, pierD), u, y, 1.05, 3.6, 0.02, p.stone, shade(p.glass, 1.1))
    const [tx, , tz] = fr.P(u, 0, pierD * 0.55)
    cappedTurret(out, tx, tz, 28.4, 36.4, 1.28, p.stone, p.lead)
    // the buttress's stacked pinnacles on its outer corners, the owner's "stacked"
    pinnacle(out, tx + s * pierD * 0.3, tz + d * 0.9, 28, 7, 0.46, p.trim, 2)
  }
}

/** The same frame moved `d` out: for what stands on a pier's face. */
function faceAt(fr: Frame, d: number): Frame {
  return { out: fr.out, n: fr.n, t: fr.t, P: (u, y, dd) => fr.P(u, y, d + dd) }
}

/** The choir: the apse's clerestory over the ambulatory, its radiating flyers, the Lady Chapel. */
function chevet(out: MeshBuilder, p: Pal): void {
  const cz = NV.z1
  const r = (NV.x1 - NV.x0) / 2
  const facets = 7
  const P = (i: number, rr: number): P2 => {
    const a = -Math.PI / 2 + (i / facets) * Math.PI
    return { x: NCX + Math.sin(a) * rr, z: cz + Math.cos(a) * rr }
  }
  // the ambulatory's walls up to the aisles' height, its roof, with a window in each long facet
  const inner = pt(NCX, cz)
  for (let i = 0; i + 1 < AMBULATORY.length; i++) {
    const fr = edgeFrame(out, AMBULATORY[i], AMBULATORY[i + 1], inner)
    rect(fr, 0, fr.L, CHAPEL_H - 0.1, AISLE.h, 0, p.stone)
    boxOn(fr, 0, fr.L, AISLE.h - 0.4, AISLE.h + 0.08, 0, 0.35, p.trim)
    if (fr.L > 3.5) traceryWindow(fr, fr.L / 2, CHAPEL_H + 2.8, Math.min(3, fr.L * 0.5), AISLE.h - CHAPEL_H - 3.4, { stone: p.stone, glass: p.glass, head: 'round', lights: 2, far: true })
    // its slate, up to the apse's wall
    const a = AMBULATORY[i]
    const b = AMBULATORY[i + 1]
    const toward = (q: P2): [number, number, number] => {
      const l = Math.hypot(q.x - NCX, q.z - cz) || 1
      return [NCX + ((q.x - NCX) / l) * r, AISLE.h + 4.4, cz + ((q.z - cz) / l) * r]
    }
    out.quad([[a.x, AISLE.h, a.z], [b.x, AISLE.h, b.z], toward(b), toward(a)], [fr.n[0] * 0.4, 0.9, fr.n[2] * 0.4], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
  // the apse: its facets up to the eaves, the cone of its roof, a window and a flyer at each
  for (let i = 0; i < facets; i++) {
    const a = P(i, r)
    const b = P(i + 1, r)
    const fr = edgeFrame(out, a, b, inner)
    rect(fr, 0, fr.L, AISLE.h - 0.1, NV.eaves, 0, p.stone)
    traceryWindow(fr, fr.L / 2, 23.4, fr.L * 0.6, 6.9, { stone: p.stone, glass: p.glass, head: 'pointed', lights: 2, far: true })
    boxOn(fr, 0, fr.L, NV.eaves - 0.5, NV.eaves + 0.08, 0, 0.4, p.trim, true)
    const m = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
    const nn = Math.hypot(m.x - NCX, m.z - cz) || 1
    const a2 = P(i, r + 0.45)
    const b2 = P(i + 1, r + 0.45)
    out.quad([[a2.x, NV.eaves, a2.z], [b2.x, NV.eaves, b2.z], [NCX, NV.ridge, cz], [NCX, NV.ridge, cz]], [(m.x - NCX) / nn, 0.72, (m.z - cz) / nn], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
  // the radiating flyers, on the apse's corners
  for (let i = 1; i < facets; i++) {
    const a = P(i, r)
    const ux = (a.x - NCX) / r
    const uz = (a.z - cz) / r
    const px = a.x + ux * 7.2
    const pz = a.z + uz * 7.2
    flyerPier(out, px, pz, AISLE.h - 1, 27, 1.1, 34.4, p)
    flyingButtress(out, [px - ux * 0.5, 26.3, pz - uz * 0.5], [a.x + ux * 0.05, 30.6, a.z + uz * 0.05], 0.6, shade(p.stone, 0.97), { drop: 3.4 })
    flyingButtress(out, [px - ux * 0.5, 24, pz - uz * 0.5], [a.x + ux * 0.05, 26, a.z + uz * 0.05], 0.6, shade(p.stone, 0.97), { drop: 3.2 })
  }
  // the Lady Chapel: its walls to 18 m, a window in each facet, its own hipped roof to 25
  const lc = pt(1.3, 40)
  for (let i = 0; i < LADY.length; i++) {
    const a = LADY[i]
    const b = LADY[(i + 1) % LADY.length]
    const fr = edgeFrame(out, a, b, lc)
    rect(fr, 0, fr.L, 0, 18, 0, p.stone)
    boxOn(fr, 0, fr.L, 17.5, 18.05, 0, 0.35, p.trim)
    if (fr.L > 1.6 && a.z > 36) traceryWindow(fr, fr.L / 2, 11.5, fr.L * 0.62, 5.2, { stone: p.stone, glass: p.glass, head: 'round', lights: 1, far: true })
    if (a.z > 30 || b.z > 30) out.quad([[a.x, 18, a.z], [b.x, 18, b.z], [lc.x, 25, lc.z], [lc.x, 25, lc.z]], [fr.n[0], 0.7, fr.n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
}

/**
 * The classical WEST FRONT (kept as it was: it is not what the owner's view shows and it is right already): the porch,
 * two storeys of columns and the pediment, the north tower finished to 38 m and the south a stump at 24 (273063679 and
 * 273063678), on the frame's own numbers now.
 */
function westFront(out: MeshBuilder, p: Pal): void {
  const zf = -54.3
  const cx = 1.15
  block(out, cx - 6.55, cx + 6.55, zf + 1.5, -40, 0, 30, p.stone)
  for (const x of [-4.35, -1.35, 1.65, 4.65]) {
    classicalColumn(out, cx + x - 0.15, zf + 0.9, 0.5, 13.5, 0.55, p.stone, { order: 'doric', tier: 'mid', heading: Math.PI })
    classicalColumn(out, cx + x - 0.15, zf + 0.9, 15.0, 25.5, 0.45, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
  }
  block(out, cx - 6.8, cx + 6.8, zf, zf + 1.6, 13.5, 15.0, p.trim)
  block(out, cx - 6.8, cx + 6.8, zf, zf + 1.6, 25.5, 27.0, p.trim)
  const west = faceFrame(out, '-z', zf + 1.5)
  // the pediment, its raking tops, and the doors and the window behind the columns
  const face = faceFrame(out, '-z', zf)
  face.out.quad([face.P(cx - 6.8, 27, 0), face.P(cx + 6.8, 27, 0), face.P(cx, 31, 0), face.P(cx, 31, 0)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
  for (const d of [-1, 1]) {
    const L = Math.hypot(6.8, 4)
    face.out.quad([face.P(cx + d * 6.8, 27, 0), face.P(cx, 31, 0), face.P(cx, 31, -1.4), face.P(cx + d * 6.8, 27, -1.4)], [(d * 4) / L, 6.8 / L, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(p.trim, 1.04), FIXED)
  }
  gothicPortal(west, cx, 0, 5.2, 9.6, { stone: p.stone, dark: p.dark, door: [0.24, 0.17, 0.12], depth: 0.6, orders: 2 })
  traceryWindow(west, cx, 16, 3.2, 7.5, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: true })
  // the north tower: its two storeys, the belfry, the balustrade at 38; the south, the stump
  const NT = { x0: -17.8, x1: -5.1, z0: -52.5, z1: -40.5 }
  const ST = { x0: 7.6, x1: 20.8, z0: -53.3, z1: -40.4 }
  block(out, NT.x0, NT.x1, NT.z0, NT.z1, 0, 30, p.stone)
  block(out, NT.x0 + 1.2, NT.x1 - 1.2, NT.z0 + 1.2, NT.z1 - 1.2, 30, 36.5, p.stone)
  block(out, NT.x0 + 0.7, NT.x1 - 0.7, NT.z0 + 0.7, NT.z1 - 0.7, 36.5, 37.6, p.trim)
  for (const [f, plane, t0, t1] of [['-z', NT.z0 + 0.9, NT.x0 + 0.9, NT.x1 - 0.9], ['+z', NT.z1 - 0.9, NT.x0 + 0.9, NT.x1 - 0.9], ['-x', NT.x0 + 0.9, NT.z0 + 0.9, NT.z1 - 0.9], ['+x', NT.x1 - 0.9, NT.z0 + 0.9, NT.z1 - 0.9]] as const) {
    gothicBalustrade(faceFrame(out, f, plane), t0, t1, 37.6, 0.9, { stone: p.trim, d: 0.2, pitch: 0.9 })
  }
  block(out, ST.x0, ST.x1, ST.z0, ST.z1, 0, 24, p.stone)
  block(out, ST.x0 - 0.3, ST.x1 + 0.3, ST.z0 - 0.3, ST.z1 + 0.3, 23.2, 24.2, p.trim)
  box(out, (ST.x0 + ST.x1) / 2, 24.3, (ST.z0 + ST.z1) / 2, 6, 0.1, 5.8, p.lead, FIXED)
  // the towers' faces: tall round-headed openings in moulded frames, courses, pilasters at the corners
  for (const T of [NT, ST]) {
    const u = (T.x0 + T.x1) / 2
    const f = faceFrame(out, '-z', T.z0)
    const s = faceFrame(out, T.x0 < 0 ? '-x' : '+x', T.x0 < 0 ? T.x0 : T.x1)
    const v = (T.z0 + T.z1) / 2
    for (const fr of [f, s]) {
      const c = fr === f ? u : v
      traceryWindow(fr, c, 2.5, 3.4, 8.2, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
      boxOn(fr, (fr === f ? T.x0 : T.z0) - 0.05, (fr === f ? T.x1 : T.z1) + 0.05, 12.4, 13, 0, 0.32, p.trim)
      traceryWindow(fr, c, 14.2, 3, 7.4, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    }
  }
  // the belfry's openings, north tower
  for (const [f, plane, t] of [['-z', NT.z0 + 1.2, (NT.x0 + NT.x1) / 2], ['-x', NT.x0 + 1.2, (NT.z0 + NT.z1) / 2], ['+x', NT.x1 - 1.2, (NT.z0 + NT.z1) / 2], ['+z', NT.z1 - 1.2, (NT.x0 + NT.x1) / 2]] as const) {
    traceryWindow(faceFrame(out, f, plane), t, 30.8, 2.8, 5, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
  }
}
