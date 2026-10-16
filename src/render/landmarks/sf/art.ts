/**
 * San Francisco public art and fountains that are PROCEDURAL because they cannot be modelled as a separate
 * figure (MODELS_NEEDED.md, SF section): a figure or scene built into a fountain or a wall, freestanding on its
 * own ground, not attached to any building. Every entry here is a standalone manifest placement (lat/lon/size),
 * no OSM footprint — `_fit` is usually unused; each builder works in its own local frame, front toward +z.
 *
 * Kept out of this file deliberately: anything ON or IN a building (a niche figure, a pediment group, caryatids,
 * a relief over a door) — those belong to that building's own procedural builder, where they can sit flush
 * against the wall they are part of. See docs/sf-batches/art.md for a note on any such piece found in passing.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { boxAlong } from '../parts.ts'
import { beam } from './golden-gate.ts'
import { surfaceTag } from '../../cartoon-material.ts'
/*
 * The MLK Memorial waterfall is built in `./yerba-buena.ts` with the rest of its block, because it is not a
 * free-standing piece of art on its own ground: it is CUT INTO a level change, and it needs that file's deck
 * height and the OSM polylines of the wall and the pools. It stays a member of `ART` so it keeps its
 * nonbuilding marking (tools/nonbuildings.ts marks the whole record) and its own manifest entry.
 */
import { mlkWaterfall } from './yerba-buena.ts'

type V3 = [number, number, number]

const CONCRETE: Rgb = [0.62, 0.6, 0.56]
const GRANITE: Rgb = [0.42, 0.4, 0.38]
const GRANITE_DK: Rgb = [0.3, 0.29, 0.28]
const BRONZE: Rgb = [0.32, 0.26, 0.16]
const BRONZE_LT: Rgb = [0.42, 0.35, 0.22]
const WATER: Rgb = [0.42, 0.58, 0.62]

const CONC_TAG = surfaceTag('concrete')
const GRAN_TAG = surfaceTag('granite')
const METAL_TAG = surfaceTag('metal')

/** A flat disc or ring in the x–z plane at height y (a basin rim, a plinth top). */
function disc(out: MeshBuilder, cx: number, y: number, cz: number, r0: number, r1: number, c: Rgb, n = 24, tag = 0): void {
  r0 = Math.max(r0, 0.02)
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const P = (a: number, r: number): V3 => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]
    out.quad([P(a0, r0), P(a0, r1), P(a1, r1), P(a1, r0)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** A shallow round basin: a low outer wall and a flat water surface inside it. */
function basin(out: MeshBuilder, cx: number, cz: number, r: number, wallH: number, c: Rgb, tag = GRAN_TAG): void {
  prism(out, cx, cz, 0, wallH, r, 28, c, tag, r * 1.05)
  disc(out, cx, wallH * 0.7, cz, 0, r * 0.97, WATER, 28)
}

// ---------------------------------------------------------------------------------------------------------------
// Vaillancourt Fountain, Justin Herman Plaza (37.7946, -122.3946): a brutalist tangle of square concrete tubes,
// walkable, ~12 m. Armand Vaillancourt's 1971 piece — a jumble of hollow precast box beams stacked and
// cantilevered at all angles over a wide basin, water spilling from several of the tube mouths. Boxes and
// angles, nothing curved: the most procedural-friendly of the whole list.
// ---------------------------------------------------------------------------------------------------------------
export function vaillancourtFountain(out: MeshBuilder, _fit?: Fit): void {
  const basinR = 9
  const v0 = out.positions.length, w0 = out.water.length
  disc(out, 0, 0, 0, 0, basinR, [0.55, 0.53, 0.5], 32, CONC_TAG)
  // (the rim uncapped: capped, its top covered the whole basin at 0.4 m and hid the water under it)
  prism(out, 0, 0, -0.3, 0.4, basinR, 32, [0.5, 0.48, 0.45], CONC_TAG, basinR + 0.4, false)

  // a square-section hollow tube: four thin slabs round a box, so it reads as a hollow beam not a solid one
  const s = 1.1 // half the tube's outer size
  const wall = 0.22
  const tube = (a: V3, b: V3): void => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
    const L = Math.hypot(dx, dy, dz) || 1
    const heading = Math.atan2(dz, dx)
    const pitch = Math.asin(dy / L)
    // build along local +x then rotate: approximate by drawing as a beam-oriented box (flat run, sloped by pitch
    // handled via midpoint offset) — most Vaillancourt members are near-horizontal or near-vertical, so treat as
    // axis boxes for verticals and boxAlong for horizontals/diagonals in plan
    void pitch
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2
    if (Math.abs(dy) > Math.hypot(dx, dz) * 1.5) {
      // mostly vertical member
      box(out, mx, my, mz, s, Math.abs(dy) / 2, s, CONCRETE, CONC_TAG)
    } else {
      // mostly horizontal/diagonal in plan, sloped a little in y — draw as a level boxAlong at the midpoint height
      boxAlong(out, mx, my, mz, L / 2, s, s, heading, CONCRETE, CONC_TAG)
    }
    void wall
  }

  // the tangle: a scaffold of members criss-crossing at several levels, deliberately irregular
  const members: [V3, V3][] = [
    [[-4, 0.5, -3], [-4, 6.5, -3]], [[4, 0.5, 3], [4, 9, 3]], [[-3, 0.5, 4], [-3, 5, 4]], [[3.5, 0.5, -4], [3.5, 7.5, -4]],
    [[0, 0.5, 0], [0, 11.5, 0]],
    [[-4, 6.5, -3], [4, 6.5, 3]], [[-4, 6.5, -3], [0, 6.5, 3.5]], [[4, 9, 3], [0, 9, -3.5]],
    [[-3, 5, 4], [3, 5, -4]], [[3.5, 7.5, -4], [-2.5, 7.5, 4]], [[0, 11.5, 0], [4, 9, 3]], [[0, 11.5, 0], [-4, 6.5, -3]],
    [[-4, 3, -3], [4, 3, 3]], [[-3, 8, 4], [3.5, 8, -4]], [[4, 4.5, 3], [-3, 4.5, 4]], [[-4, 10, -3], [0, 10, 0]],
    [[0, 2, -5], [0, 2, 5]], [[-5, 4, 0], [5, 4, 0]],
  ]
  for (const [a, b] of members) tube(a, b)
  // a few uprights straight from the basin so it stands rooted, not floating
  for (const [x, z] of [[-4, -3], [4, 3], [-3, 4], [3.5, -4], [0, 0]]) box(out, x, 0.3, z, s * 1.1, 0.5, s * 1.1, CONCRETE, CONC_TAG)
  /*
   * THE WATER (owner, 2026-10-06: "the fountain at embarcadero plaza has no water"; render/water.ts): the basin's
   * pool, and the fountain's signature — water ROARING out of the tube mouths in thick falls and arcing jets into the
   * basin, white where it lands. (Was three pale-blue sticks.)
   */
  const pool: { x: number; z: number }[] = []
  for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2; pool.push({ x: Math.cos(a) * basinR * 0.94, z: Math.sin(a) * basinR * 0.94 }) }
  out.water.push({ kind: 'pool', ring: pool, y: 0.3, colour: [0.24, 0.34, 0.36] })
  // falls out of the horizontal tubes' ends: a sheet across each mouth, falling to the basin
  const falls: [V3, V3, number][] = [
    [[-4.9, 6.5, -3.6], [-4.3, 6.5, -2.0], 6.3], [[4.9, 9, 3.6], [4.2, 9, 2.0], 8.8], [[-0.8, 5, 4.9], [0.9, 5, 4.9], 4.8],
    [[4.9, 4, -0.8], [4.9, 4, 0.8], 3.8], [[-0.8, 2, -5.9], [0.8, 2, -5.9], 1.8], [[-5.9, 4, 0.8], [-5.9, 4, -0.8], 3.8],
  ]
  for (const [a, b, drop] of falls) {
    out.water.push({ kind: 'sheet', a, b, out: 1.4, drop })
    out.water.push({ kind: 'splash', at: [(a[0] + b[0]) / 2 * 1.15, 0.22, (a[2] + b[2]) / 2 * 1.15], r: 1.4 })
  }
  // jets arcing out of the high tube mouths into the basin
  for (const [x, y, z, vx, vz] of [[0, 11.6, 0, 2.2, -1.5], [3.5, 7.6, -4, -1.2, 2.0], [-3, 8.2, 4, 1.6, -1.2], [0, 10.2, -0.5, -2.4, 0.4]] as [number, number, number, number, number][]) {
    out.water.push({ kind: 'jet', at: [x, y, z], v: [vx, 1.5, vz], width: 0.25, spread: 0.5 })
  }
  out.water.push({ kind: 'splash', at: [0, 0.22, 0], r: 3.5 })
  standOnHighest(out, _fit, basinR, v0, w0, [0.5, 0.48, 0.45], CONC_TAG, 0.4)
}

/**
 * A basin on a slope, stood on the HIGHEST ground round its rim, with a skirt down to the base. Its base is the
 * lowest ground under the footprint (render/landmarks.ts `place`) and the plaza falls across it: from there the
 * basin floor and its water were under the paving, and the terrain's depth occluder hid them (the Vaillancourt
 * Fountain; and Ruth Asawa's mermaid fountain on Ghirardelli Square's terraces, a granite sliver in the paving —
 * the nonbuildings audit's relief check, 2026-10-14). Water stands level, so a basin cannot follow the slope: it
 * steps up onto it, as the real ones do. Everything built since `v0` / `w0` is lifted.
 */
function standOnHighest(out: MeshBuilder, fit: Fit | undefined, r: number, v0: number, w0: number, skirt: Rgb, tag: number, over: number): void {
  const g = fit?.groundAt
  if (!g) return
  let lift = g(0, 0)
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; lift = Math.max(lift, g(Math.cos(a) * r, Math.sin(a) * r)) }
  if (lift <= 0.02) return
  for (let i = v0; i < out.positions.length; i += 3) out.positions[i + 1] += lift
  for (let i = w0; i < out.water.length; i++) {
    const f = out.water[i]
    if (f.kind === 'pool') f.y += lift
    else if (f.kind === 'sheet') { f.a[1] += lift; f.b[1] += lift }
    else f.at[1] += lift
  }
  prism(out, 0, 0, -0.3, lift - 0.3, r + over, 32, skirt, tag, r + over, false)
}

// ---------------------------------------------------------------------------------------------------------------
// Lotta's Fountain is NOT here. A version was written in this file on 2026-09-22 without noticing that
// districts/market-mid.ts already had one — two builders under the same PROCEDURAL key, and two manifest
// entries sixty metres apart, so the city had two fountains. The market-mid one is kept: it is bronze rather
// than grey iron, has the lion heads with their gables, the banded drums and the glass lantern, and it cites
// the photograph it was drawn from. See BUGS.md #92 and the naming rule in docs/sf-batches/BRIEF.md.
// ---------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------
export function cupidsSpan(out: MeshBuilder, _fit?: Fit): void {
  const PINK: Rgb = [0.66, 0.16, 0.22]
  const YELLOW: Rgb = [0.85, 0.68, 0.2]
  // the bow: an arc of short beam segments standing in the x-y plane (bow's plane faces +z), tips near the ground
  const segs = 14
  const R = 8.5
  const bowPts: V3[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const ang = Math.PI * 0.12 + t * Math.PI * 0.76   // just short of a half-circle, so the tips splay outward
    bowPts.push([Math.cos(ang) * R, 1.2 + Math.sin(ang) * R, 0])
  }
  for (let i = 0; i < bowPts.length - 1; i++) beam(out, bowPts[i], bowPts[i + 1], 0.35, 0.55, PINK)
  // the string: straight, tip to tip
  beam(out, bowPts[0], bowPts[bowPts.length - 1], 0.05, 0.05, [0.85, 0.83, 0.78], false)
  // the arrow: shaft through roughly the bow's midpoint, angled down into the ground; nock near the string,
  // head buried, fletching high in the air behind
  const nock: V3 = [0, 9.2, 0.2]
  const head: V3 = [-6.5, -1.5, -3.2]
  beam(out, nock, head, 0.22, 0.22, YELLOW)
  // arrowhead: a short dark wedge past the shaft's buried end (mostly hidden — just the tip breaking the lawn)
  const tipDir: V3 = [head[0] - nock[0], head[1] - nock[1], head[2] - nock[2]]
  const tl = Math.hypot(...tipDir) || 1
  const tip: V3 = [head[0] + (tipDir[0] / tl) * 1.1, head[1] + (tipDir[1] / tl) * 1.1, head[2] + (tipDir[2] / tl) * 1.1]
  beam(out, head, tip, 0.05, 0.45, [0.3, 0.28, 0.24])
  // fletching: two flat pink vanes near the nock end
  const fBase: V3 = [nock[0] + (head[0] - nock[0]) * 0.14, nock[1] + (head[1] - nock[1]) * 0.14, nock[2] + (head[2] - nock[2]) * 0.14]
  for (const s of [-1, 1]) beam(out, fBase, [fBase[0] + s * 0.9, fBase[1] + 1.1, fBase[2] + s * 0.6], 0.04, 0.5, PINK)
}

// ---------------------------------------------------------------------------------------------------------------
// Ruth Asawa's mermaid fountain ("Andrea"), Ghirardelli Square (37.8058, -122.4230): the owner is hand-modelling
// the mermaids and sea creatures, so this builds ONLY the round stepped basin they will stand in — a place for
// those figures to arrive into, not a stand-in for them.
// ---------------------------------------------------------------------------------------------------------------
export function asawaMermaidFountain(out: MeshBuilder, _fit?: Fit): void {
  const r = 5.5
  const v0 = out.positions.length, w0 = out.water.length
  basin(out, 0, 0, r, 0.5, GRANITE, GRAN_TAG)
  // a low stepped granite plinth at the centre, clear of the water, for the mermaid group to stand on
  prism(out, 0, 0, 0.55, 0.85, 1.6, 16, GRANITE, GRAN_TAG, 1.45)
  prism(out, 0, 0, 0.85, 1.05, 1.35, 16, GRANITE, GRAN_TAG, 1.1)
  // (on the plaza's terrace, not sunk into it: the square falls 1.9 m across the basin)
  standOnHighest(out, _fit, r, v0, w0, GRANITE, GRAN_TAG, 0.3)
}

// ---------------------------------------------------------------------------------------------------------------
// The Transamerica Redwood Park frog fountain and "Puddle Jumpers" children (37.7951, -122.4027): the owner is
// hand-modelling the frog and the children, so this builds ONLY the small pool among the redwoods they will sit
// beside — a shallow granite-rimmed basin let into the ground, not a stand-in for the bronzes themselves.
// ---------------------------------------------------------------------------------------------------------------
export function redwoodParkBronzes(out: MeshBuilder, _fit?: Fit): void {
  basin(out, -1.6, -1.2, 1.3, 0.22, GRANITE_DK, GRAN_TAG)
  // a couple of flat paving/puddle discs nearby, where the "Puddle Jumpers" figures will be placed
  for (const [x, z] of [[1.0, 0.2], [0.3, 1.7], [2.0, -0.6]]) disc(out, x, 0.03, z, 0, 0.5, [0.55, 0.65, 0.7], 12)
}

// ---------------------------------------------------------------------------------------------------------------
// Hearts in San Francisco, Union Square (37.7880, -122.4075): big painted hearts on plinths, one model reused
// with a different colour per placement. A stylised valentine-heart silhouette, flat and thick, standing on a
// low square plinth — built from a heart-curve polygon extruded top/bottom/sides (the same box-and-angle
// approach as everything else here, just with a rounder outline).
// ---------------------------------------------------------------------------------------------------------------
function heartRing(scale: number): { x: number; z: number }[] {
  const pts: { x: number; z: number }[] = []
  const n = 32
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    // the standard parametric heart curve, x=sideways, z=up (we keep it flat in x-y, thin in z as a panel)
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push({ x: (x / 16) * scale, z: (y / 17) * scale })
  }
  return pts
}

export function heartsInSanFrancisco(out: MeshBuilder, _fit?: Fit): void {
  const RED: Rgb = [0.72, 0.1, 0.14] // default paint colour; placements may recolour by not sharing material (see note)
  const plinthH = 0.9
  box(out, 0, plinthH / 2, 0, 1.1, plinthH / 2, 1.1, GRANITE, GRAN_TAG)
  const ring = heartRing(1.8) // in the x-y plane, we place it upright: (x, z-of-ring) -> (x, y), thin in local z
  const thick = 0.35
  const baseY = plinthH + 1.9 // the ring's own "z" is really the heart's up axis, offset so its point sits on the plinth
  // front and back faces
  for (const side of [1, -1] as const) {
    const norm: V3 = [0, 0, side]
    const face: V3[] = ring.map((p) => [p.x, baseY + p.z, side * thick])
    for (let i = 1; i < face.length - 1; i++) {
      const tri = side === 1 ? [face[0], face[i], face[i + 1]] : [face[0], face[i + 1], face[i]]
      out.quad([tri[0], tri[1], tri[2], tri[2]], norm, [[0, 0], [1, 0], [1, 1], [1, 1]], RED, METAL_TAG)
    }
  }
  // the rim, edge by edge
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const heading = Math.atan2(b.z - a.z, b.x - a.x)
    boxAlong(out, (a.x + b.x) / 2, baseY + (a.z + b.z) / 2, 0, L / 2, 0.02, thick, heading + Math.PI / 2, RED, METAL_TAG)
  }
}

/**
 * HEARTS IN SAN FRANCISCO, as they are (owner, 2026-10-03: "union square itself has the heart sculpture, neat. we
 * should add all the hearts"): the San Francisco General Hospital Foundation's series since 2004 — big rounded
 * fibreglass hearts on low pedestals, each painted by its own artist. A lofted heart: the heart curve at shrinking
 * scale toward front and back, so it is puffy, not a cut-out; and painted, by a design and two colours per piece.
 * Placed at OSM's own heart artworks (art.json).
 */
type HeartPaint = { base: Rgb; accent: Rgb; design: 'stripes' | 'dots' | 'bands' | 'rainbow' | 'splotch' | 'labyrinth' | 'plain' }
function paintedHeart(out: MeshBuilder, paint: HeartPaint): void {
  const plinthH = 0.8
  box(out, 0, plinthH / 2, 0, 0.95, plinthH / 2, 0.75, GRANITE, GRAN_TAG)
  const R = 1.6
  const depth = 0.55
  const baseY = plinthH + R
  const ring = heartRing(R)
  const K = 8
  // (the loft stops short of the faces — ±0.9, not ±1 — and each face is a FAN to a point a little proud: lofted to a
  //  point, the last rings were slivers and the faces read as black holes, 2026-10-05)
  const layer = (k: number): { x: number; y: number; z: number }[] => {
    const t = -0.9 + (1.8 * k) / K
    const sc = Math.pow(Math.max(0, 1 - t * t), 0.35)
    return ring.map((p) => ({ x: p.x * sc, y: baseY + (p.z + 0.2 * R) * sc - 0.2 * R, z: t * depth }))
  }
  const RAINBOW: Rgb[] = [[0.85, 0.15, 0.15], [0.95, 0.55, 0.1], [0.95, 0.85, 0.15], [0.2, 0.65, 0.3], [0.15, 0.4, 0.8], [0.5, 0.25, 0.7]]
  const colourAt = (x: number, y: number, z: number): Rgb => {
    const h = y - plinthH
    switch (paint.design) {
      case 'stripes': return Math.floor((x + h) * 2.2) % 2 === 0 ? paint.base : paint.accent
      case 'dots': return (Math.hypot(((x * 2.4) % 1 + 1) % 1 - 0.5, ((h * 2.4) % 1 + 1) % 1 - 0.5) < 0.22) ? paint.accent : paint.base
      case 'bands': return Math.floor(h * 2.5) % 2 === 0 ? paint.base : paint.accent
      case 'rainbow': return RAINBOW[Math.max(0, Math.min(5, Math.floor((h / (2 * R)) * 6)))]
      case 'splotch': return (Math.sin(x * 5.1 + z * 3) * Math.sin(h * 4.3 + x * 2) > 0.35) ? paint.accent : paint.base
      case 'labyrinth': return (Math.abs(Math.sin(Math.hypot(x, h - R) * 7)) < 0.25) ? paint.accent : paint.base
      default: return paint.base
    }
  }
  for (let k = 0; k < K; k++) {
    const A = layer(k), B = layer(k + 1)
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length
      const q: [number, number, number][] = [[A[i].x, A[i].y, A[i].z], [A[j].x, A[j].y, A[j].z], [B[j].x, B[j].y, B[j].z], [B[i].x, B[i].y, B[i].z]]
      // the normal: across the ring's tangent and the loft
      const ux = q[1][0] - q[0][0], uy = q[1][1] - q[0][1], uz = q[1][2] - q[0][2]
      const vx = q[3][0] - q[0][0], vy = q[3][1] - q[0][1], vz = q[3][2] - q[0][2]
      let n: [number, number, number] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
      const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2 - baseY + 0.2 * R, cz = (q[0][2] + q[2][2]) / 2
      // (outward: flip the NORMAL and the WINDING together — flipping only the normal left the quads wound inward,
      //  culled from outside, and the heart's front showed as a black hole through to its unlit back, 2026-10-05)
      let quad = q
      if (n[0] * cx + n[1] * cy + n[2] * cz < 0) { n = [-n[0], -n[1], -n[2]]; quad = [q[0], q[3], q[2], q[1]] }
      const L = Math.hypot(...n) || 1
      out.quad(quad, [n[0] / L, n[1] / L, n[2] / L], [[0, 0], [1, 0], [1, 1], [0, 1]], colourAt(cx, (q[0][1] + q[2][1]) / 2, cz), METAL_TAG)
    }
  }
  // the two faces: each end ring fanned to its centre, the centre a little proud of the ring (a domed face)
  for (const side of [-1, 1]) {
    const E = layer(side < 0 ? 0 : K)
    const c: [number, number, number] = [0, baseY - 0.2 * R * 0.6, side * depth * 1.05]
    for (let i = 0; i < E.length; i++) {
      const j = (i + 1) % E.length
      const a: [number, number, number] = [E[i].x, E[i].y, E[i].z], b: [number, number, number] = [E[j].x, E[j].y, E[j].z]
      const col = colourAt((a[0] + b[0]) / 3, (a[1] + b[1] + c[1]) / 3, side * depth)
      // wound so the face is seen from outside (+z for the front, −z for the back)
      out.quad(side > 0 ? [a, b, c, c] : [b, a, c, c], [0, 0, side], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], col, METAL_TAG)
    }
  }
}
const HEART_PAINTS: Record<string, HeartPaint> = {
  heartLabyrinthine: { base: [0.12, 0.2, 0.45], accent: [0.95, 0.82, 0.3], design: 'labyrinth' },
  heartButterflight: { base: [0.55, 0.78, 0.9], accent: [0.92, 0.45, 0.15], design: 'splotch' },
  heartUnionSquare: { base: [0.8, 0.1, 0.15], accent: [0.97, 0.95, 0.9], design: 'dots' },
  heartMyHeart: { base: [0.9, 0.85, 0.75], accent: [0.75, 0.12, 0.18], design: 'stripes' },
  heartOpen: { base: [0.6, 0.8, 0.85], accent: [0.85, 0.95, 0.98], design: 'bands' },
  heartRichmond: { base: [0.2, 0.55, 0.35], accent: [0.95, 0.9, 0.3], design: 'stripes' },
  heartPanhandle: { base: [0.7, 0.2, 0.5], accent: [0.2, 0.6, 0.9], design: 'rainbow' },
  heartHaight: { base: [0.95, 0.93, 0.88], accent: [0.1, 0.1, 0.12], design: 'splotch' },
  heartBronze: { base: [0.45, 0.3, 0.18], accent: [0.45, 0.3, 0.18], design: 'plain' },
  heartMetal: { base: [0.62, 0.64, 0.66], accent: [0.62, 0.64, 0.66], design: 'plain' },
  // (2026-10-07, the last two of OSM's hearts: Migrant Heart by the Presidio's Lyon Street gate; Wesley Skinner's Wave
  //  Heart, 2025, metal, at Ocean Beach — blue and white, banded like surf)
  heartMigrant: { base: [0.85, 0.55, 0.2], accent: [0.2, 0.35, 0.6], design: 'stripes' },
  heartWave: { base: [0.2, 0.45, 0.7], accent: [0.92, 0.95, 0.97], design: 'bands' },
}
/**
 * THE BANKER'S HEART (Masayuki Nagare, "Transcendence", 1969; OSM n3357102023), on the plaza of 555 California: the
 * hearts survey's one heart that is not heart-shaped — a 200-ton mass of polished black Swedish granite, a heavy rounded
 * form twisting up off a low base, nicknamed by the bankers it faces. Built as a stack of rounded slabs, each turned a
 * little on the last, glossy black.
 */
function bankersHeart(out: MeshBuilder): void {
  const BLACK: Rgb = [0.07, 0.07, 0.08]
  box(out, 0, 0.15, 0, 3.2, 0.15, 2.4, [0.5, 0.49, 0.47], GRAN_TAG)
  const N = 7
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1)
    const w = 2.6 * (1 - 0.35 * Math.abs(t - 0.35)), d = 1.6 * (1 - 0.3 * t), y0 = 0.3 + k * 0.62
    const part = new (out.constructor as new () => MeshBuilder)()
    // a rounded slab: an octagonal prism squashed to the slab's plan
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2
      const p0: [number, number] = [Math.cos(a0) * w, Math.sin(a0) * d], p1: [number, number] = [Math.cos(a1) * w, Math.sin(a1) * d]
      const nx = Math.cos((a0 + a1) / 2) / w, nz = Math.sin((a0 + a1) / 2) / d, L = Math.hypot(nx, nz)
      part.quad([[p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y0 + 0.64, p1[1]], [p0[0], y0 + 0.64, p0[1]]], [nx / L, 0, nz / L], [[0, 0], [1, 0], [1, 1], [0, 1]], BLACK, GRAN_TAG)
      part.quad([[0, y0 + 0.64, 0], [p0[0], y0 + 0.64, p0[1]], [p1[0], y0 + 0.64, p1[1]], [0, y0 + 0.64, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], BLACK, GRAN_TAG)
    }
    const ang = k * 0.22, c = Math.cos(ang), sn = Math.sin(ang), base = out.positions.length / 3
    for (let i = 0; i < part.positions.length; i += 3) {
      const x = part.positions[i], z = part.positions[i + 2]
      out.positions.push(x * c + z * sn + Math.sin(t * 3) * 0.3, part.positions[i + 1], -x * sn + z * c)
      const nx = part.normals[i], nz = part.normals[i + 2]
      out.normals.push(nx * c + nz * sn, part.normals[i + 1], -nx * sn + nz * c)
    }
    out.uvs.push(...part.uvs); out.colors.push(...part.colors)
    for (const ix of part.indices) out.indices.push(base + ix)
  }
}

/**
 * THE DANDELION FOUNTAIN (Bob Woodward; OSM way/1177704967, `amenity=fountain`, layer 1) on the Embarcadero Center
 * podium: a 14 m round pool in granite, and in the middle on a short bronze stem a sphere of radiating bronze tubes, each
 * throwing its jet straight out, so the water draws a dandelion clock in the air (#480 waited on a photograph; built
 * from the design's published description, 2026-10-07 — the owner should say if it reads wrong). Water only, by the
 * shared system (render/water.ts).
 */
function dandelionFountain(out: MeshBuilder): void {
  const BRONZE: Rgb = [0.42, 0.3, 0.17]
  const R = 7
  // the rim, round: its outer wall, its top, and the inner wall down to the water; and the basin floor
  const N = 40, pool: { x: number; z: number }[] = []
  const Ri = R - 0.45, top = 0.5
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, b = ((i + 1) / N) * Math.PI * 2
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cm = Math.cos((a + b) / 2), sm = Math.sin((a + b) / 2)
    pool.push({ x: ca * Ri, z: sa * Ri })
    out.quad([[ca * R, 0, sa * R], [cb * R, 0, sb * R], [cb * R, top, sb * R], [ca * R, top, sa * R]], [cm, 0, sm], [[0, 0], [1, 0], [1, 1], [0, 1]], GRANITE, GRAN_TAG)
    out.quad([[ca * Ri, top, sa * Ri], [cb * Ri, top, sb * Ri], [cb * R, top, sb * R], [ca * R, top, sa * R]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], GRANITE, GRAN_TAG)
    out.quad([[cb * Ri, 0, sb * Ri], [ca * Ri, 0, sa * Ri], [ca * Ri, top, sa * Ri], [cb * Ri, top, sb * Ri]], [-cm, 0, -sm], [[0, 0], [1, 0], [1, 1], [0, 1]], GRANITE, GRAN_TAG)
  }
  box(out, 0, 0.03, 0, R - 0.3, 0.03, R - 0.3, [0.3, 0.32, 0.32], GRAN_TAG)
  out.water.push({ kind: 'pool', ring: pool, y: 0.35, colour: [0.24, 0.34, 0.36] })
  // the stem and the head: a bronze ball, and tubes out of it in every direction of the upper sphere
  const H = 2.6, r0 = 0.45
  box(out, 0, H / 2, 0, 0.12, H / 2, 0.12, BRONZE, METAL_TAG)
  for (let i = 0; i < 4; i++) box(out, 0, H + (i - 1.5) * 0.22, 0, r0 * Math.cos(((i - 1.5) / 2.5) * Math.PI / 2), 0.11, r0 * Math.cos(((i - 1.5) / 2.5) * Math.PI / 2), BRONZE, METAL_TAG)
  const TUBES = 46, L = 1.2
  for (let k = 0; k < TUBES; k++) {
    // a Fibonacci sphere, the lowest fifth left out (the stem is there)
    const y = 1 - (k + 0.5) / TUBES * 1.6, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = k * 2.39996
    const d: [number, number, number] = [Math.cos(th) * rr, y, Math.sin(th) * rr]
    for (let s = 0; s < 4; s++) {
      const t = r0 + (L * (s + 0.5)) / 4
      box(out, d[0] * t, H + d[1] * t, d[2] * t, 0.035, 0.035, 0.035, BRONZE, METAL_TAG)
    }
    const tip: [number, number, number] = [d[0] * (r0 + L), H + d[1] * (r0 + L), d[2] * (r0 + L)]
    out.water.push({ kind: 'jet', at: tip, v: [d[0] * 1.8, d[1] * 1.8 + 0.6, d[2] * 1.8], width: 0.06, spread: 0.15 })
  }
  out.water.push({ kind: 'splash', at: [0, 0.37, 0], r: 2.6 })
}

const HEARTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = Object.fromEntries(
  Object.entries(HEART_PAINTS).map(([k, paint]) => [k, (out: MeshBuilder) => paintedHeart(out, paint)]))

// ---------------------------------------------------------------------------------------------------------------
// Language of the Birds, Brian Goggin & Dorka Keehn, 2008, at Broadway & Columbus (37.7978, -122.4069): a flock of
// open books flying over the corner, hung on wires so fine they vanish — no poles (the owner's Street View,
// 2026-10-16: "it's books, up in the air"; the first model stood them on posts in the roadway). Cream pages,
// spread like wings, tilted every way, between about 6 m and 13 m up; LED-lit after dark.
// ---------------------------------------------------------------------------------------------------------------
export function languageOfTheBirds(out: MeshBuilder, _fit?: Fit): void {
  const PAGE: Rgb = [0.95, 0.9, 0.72], COVER: Rgb = [0.96, 0.92, 0.76]   // lit from inside after dark: cream from below too
  const rnd = (i: number): number => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x) }
  const N = 26
  for (let i = 0; i < N; i++) {
    // a loose flock over the corner: an ellipse ~22 x 12 m, denser toward the middle, rising toward one side
    const a = rnd(i) * Math.PI * 2, r = Math.sqrt(rnd(i + 50))
    const x = Math.cos(a) * r * 11, z = Math.sin(a) * r * 6
    const y = 6.2 + rnd(i + 100) * 5.5 + (x + 11) * 0.08
    const yaw = rnd(i + 150) * Math.PI * 2, open = 0.35 + rnd(i + 200) * 0.6, roll = (rnd(i + 250) - 0.5) * 0.8
    const w = 0.42 + rnd(i + 300) * 0.12, d = 0.32
    // each half: a thin page block hinged at the spine, lifted by `open` like a wing
    for (const s of [-1, 1] as const) {
      const ang = s * open + roll                              // each half lifted like a wing about the spine
      const ux = Math.cos(yaw), uz = Math.sin(yaw)             // across the spread
      const off = w / 2 * Math.cos(ang), lift = w / 2 * Math.sin(ang) * s
      const cx = x + ux * off * s, cz = z + uz * off * s, cy = y + lift
      const ex = ux * (w / 2) * Math.cos(ang), ez = uz * (w / 2) * Math.cos(ang), ey = (w / 2) * Math.sin(ang) * s
      const vx = -uz * d, vz = ux * d
      const c0: V3 = [cx - ex - vx, cy - ey, cz - ez - vz], c1: V3 = [cx + ex - vx, cy + ey, cz + ez - vz]
      const c2: V3 = [cx + ex + vx, cy + ey, cz + ez + vz], c3: V3 = [cx - ex + vx, cy - ey, cz - ez + vz]
      const nx = -Math.sin(ang) * s * ux, ny = Math.cos(ang), nz = -Math.sin(ang) * s * uz
      out.quad([c0, c1, c2, c3], [nx, ny, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], PAGE, 0)
      out.quad([c3, c2, c1, c0].map((p) => [p[0], p[1] - 0.025, p[2]] as V3), [-nx, -ny, -nz], [[0, 0], [1, 0], [1, 1], [0, 1]], COVER, 0)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Francis Scott Key Monument, Golden Gate Park (37.7707, -122.4671): a stone canopy over a bronze figure of Key.
// The figure is a real model elsewhere; this builds only the canopy — architecture, not sculpture: a small
// classical open pavilion, four columns under a stepped dome, on a low platform.
// ---------------------------------------------------------------------------------------------------------------
export function francisScottKeyCanopy(out: MeshBuilder, _fit?: Fit): void {
  const platH = 0.6
  box(out, 0, platH / 2, 0, 3.2, platH / 2, 3.2, GRANITE, GRAN_TAG)
  const colR = 0.32
  const colH = 4.2
  const cx = 2.1
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    prism(out, sx * cx, sz * cx, platH, platH + colH, colR, 10, [0.86, 0.84, 0.78], GRAN_TAG)
    box(out, sx * cx, platH + colH + 0.1, sz * cx, colR * 1.4, 0.12, colR * 1.4, [0.86, 0.84, 0.78], GRAN_TAG) // capital
  }
  // the entablature ring
  const entY = platH + colH + 0.3
  for (const [x0, z0, x1, z1] of [[cx, cx, -cx, cx], [-cx, cx, -cx, -cx], [-cx, -cx, cx, -cx], [cx, -cx, cx, cx]] as const) {
    const heading = Math.atan2(z1 - z0, x1 - x0)
    boxAlong(out, (x0 + x1) / 2, entY, (z0 + z1) / 2, cx, 0.25, 0.35, heading, [0.82, 0.8, 0.74], GRAN_TAG)
  }
  // a stepped dome roof over the whole thing
  prism(out, 0, 0, entY + 0.25, entY + 1.6, cx * 1.15, 12, [0.78, 0.76, 0.7], GRAN_TAG, 0.15)
  box(out, 0, entY + 1.75, 0, 0.15, 0.15, 0.15, [0.7, 0.68, 0.62], GRAN_TAG)
}

// ---------------------------------------------------------------------------------------------------------------
// Robert Louis Stevenson Memorial, Portsmouth Square (37.7948, -122.4054): a granite shaft topped with a small
// bronze galleon (his ship, sails set), ~5 m overall.
// ---------------------------------------------------------------------------------------------------------------
export function stevensonMemorial(out: MeshBuilder, _fit?: Fit): void {
  box(out, 0, 0.3, 0, 1.0, 0.3, 1.0, GRANITE_DK, GRAN_TAG)
  prism(out, 0, 0, 0.6, 3.6, 0.55, 8, GRANITE, GRAN_TAG, 0.4)
  box(out, 0, 3.75, 0, 0.5, 0.15, 0.5, GRANITE, GRAN_TAG) // capital
  // the galleon: a hull, a mast, and a couple of angled sails
  const hy = 4.05
  boxAlong(out, 0, hy, 0, 0.55, 0.12, 0.16, 0, BRONZE, METAL_TAG)
  beam(out, [0, hy + 0.1, 0], [0, hy + 0.75, 0], 0.04, 0.04, BRONZE)
  for (const [dz, w, h, yb] of [[0.02, 0.32, 0.35, hy + 0.2], [-0.02, 0.24, 0.26, hy + 0.45]] as const) {
    boxAlong(out, dz * 4, yb + h / 2, dz, w, h / 2, 0.015, Math.PI / 2, BRONZE_LT, METAL_TAG)
  }
}

export const ART: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  vaillancourtFountain, cupidsSpan, asawaMermaidFountain, redwoodParkBronzes, mlkWaterfall,
  // (`heartsInSanFrancisco`, the flat red heart, is unregistered: the hearts are `paintedHeart`'s family now, HEARTS)
  languageOfTheBirds, francisScottKeyCanopy, stevensonMemorial,
  ...HEARTS,
  bankersHeart,
  dandelionFountain,
}
