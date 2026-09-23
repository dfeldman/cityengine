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

type V3 = [number, number, number]

const CONCRETE: Rgb = [0.62, 0.6, 0.56]
const GRANITE: Rgb = [0.42, 0.4, 0.38]
const GRANITE_DK: Rgb = [0.3, 0.29, 0.28]
const IRON: Rgb = [0.16, 0.18, 0.2]
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
  disc(out, 0, 0, 0, 0, basinR, [0.55, 0.53, 0.5], 32, CONC_TAG)
  prism(out, 0, 0, -0.3, 0.4, basinR, 32, [0.5, 0.48, 0.45], CONC_TAG, basinR + 0.4)
  disc(out, 0, 0.15, 0, 0, basinR * 0.94, WATER, 32)

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
  // water spilling from a few tube mouths: thin pale-blue drop boxes
  for (const [x, y, z] of [[-4, 6.2, -3], [4, 8.7, 3], [0, 11.2, 0]] as V3[]) box(out, x, y / 2, z, 0.25, y / 2, 0.25, [0.65, 0.78, 0.82], 0)
}

// ---------------------------------------------------------------------------------------------------------------
// Lotta's Fountain, Market at Kearny/Geary (37.7884, -122.4029): a slim cast-iron column ~8 m, lion-head spouts
// into a basin, a lamp on top. Gift of Lotta Crabtree, 1875 — the oldest monument in the city.
// ---------------------------------------------------------------------------------------------------------------
export function lottasFountain(out: MeshBuilder, _fit?: Fit): void {
  const basinR = 2.6
  basin(out, 0, 0, basinR, 0.55, GRANITE, GRAN_TAG)
  // four lion-head spouts round the basin wall, simple blocky muzzles
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const x = Math.cos(a) * basinR, z = Math.sin(a) * basinR
    box(out, x, 0.45, z, 0.3, 0.22, 0.22, IRON, METAL_TAG)
  }
  // the column: a stepped iron base, a long fluted-looking taper (approximated with a few tapered prism drums),
  // decorative bands, and a small lamp/torch finial
  box(out, 0, 0.7, 0, 1.1, 0.15, 1.1, GRANITE_DK, GRAN_TAG)
  prism(out, 0, 0, 0.85, 1.7, 0.75, 8, IRON, METAL_TAG, 0.6)
  prism(out, 0, 0, 1.7, 1.95, 0.62, 8, IRON, METAL_TAG, 0.62)          // a decorative band, near-cylindrical
  prism(out, 0, 0, 1.95, 6.2, 0.5, 12, IRON, METAL_TAG, 0.28)          // the long tapering shaft
  for (const y of [2.4, 3.6, 4.8]) prism(out, 0, 0, y, y + 0.15, 0.42, 12, [0.2, 0.22, 0.24], METAL_TAG, 0.42) // bands
  prism(out, 0, 0, 6.2, 6.55, 0.5, 12, IRON, METAL_TAG, 0.34)          // capital, flares slightly
  box(out, 0, 6.75, 0, 0.55, 0.2, 0.55, IRON, METAL_TAG)
  prism(out, 0, 0, 6.95, 7.6, 0.32, 8, [0.24, 0.24, 0.22], METAL_TAG, 0.06) // small dome/lamp top
  box(out, 0, 7.75, 0, 0.1, 0.15, 0.1, [0.85, 0.75, 0.3], 0)           // the light at the very top
}

// ---------------------------------------------------------------------------------------------------------------
// Cupid's Span, Rincon Park (37.7910, -122.3899): a giant bow and part-buried arrow, ~18 m — Claes Oldenburg &
// Coosje van Bruggen, 2002. A simple unmistakable silhouette: a curved bow standing on end, a taut string, and
// a long arrow shaft plunging into the lawn at an angle with its fletching still up in the air.
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
  basin(out, 0, 0, r, 0.5, GRANITE, GRAN_TAG)
  // a low stepped granite plinth at the centre, clear of the water, for the mermaid group to stand on
  prism(out, 0, 0, 0.55, 0.85, 1.6, 16, GRANITE, GRAN_TAG, 1.45)
  prism(out, 0, 0, 0.85, 1.05, 1.35, 16, GRANITE, GRAN_TAG, 1.1)
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
// MLK Memorial waterfall, Yerba Buena Gardens (37.7853, -122.4029): a wide granite waterfall wall, ~9 m tall and
// walkable-behind. Water sheets down the front of a long stacked-granite-block wall built on a ring so a rider
// can pass through the gap behind it.
// ---------------------------------------------------------------------------------------------------------------
export function mlkWaterfall(out: MeshBuilder, _fit?: Fit): void {
  const halfW = 12
  const h = 9
  const thick = 1.4
  const gap = 3 // the walkway behind
  // front face: courses of rough granite blocks, water sheeting down over most of it
  const courses = 10
  const ch = h / courses
  for (let i = 0; i < courses; i++) {
    const y0 = i * ch
    const blocks = 9
    for (let k = 0; k < blocks; k++) {
      const x0 = -halfW + (k * 2 * halfW) / blocks
      const w = (2 * halfW) / blocks
      const shade: Rgb = (i + k) % 2 === 0 ? GRANITE : GRANITE_DK
      box(out, x0 + w / 2, y0 + ch / 2, thick / 2, w / 2 - 0.05, ch / 2 - 0.03, thick / 2, shade, GRAN_TAG)
    }
  }
  // water sheet over the face, just proud of it
  box(out, 0, h * 0.42, thick + 0.08, halfW - 0.6, h * 0.42, 0.06, [0.6, 0.74, 0.78], 0)
  // back wall (plain granite, no water) and the two end walls closing the walkway
  box(out, 0, h / 2, thick + gap + thick / 2, halfW, h / 2, thick / 2, GRANITE_DK, GRAN_TAG)
  for (const s of [-1, 1]) box(out, s * halfW, h / 2, thick + gap / 2, thick / 2, h / 2, gap / 2, GRANITE_DK, GRAN_TAG)
  // a plain granite walkway floor between the two walls
  box(out, 0, 0.05, thick + gap / 2, halfW - thick, 0.05, gap / 2 - 0.1, GRANITE, GRAN_TAG)
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

// ---------------------------------------------------------------------------------------------------------------
// Language of the Birds, Brenda Way / Vito Acconci / PROXY? — actually Brian Goggin & Dorka Keehn, 2016, at
// Broadway & Columbus (37.7978, -122.4069): translucent resin "books" suspended on tall poles over the
// pavement, as if flung open in flight. Pale glassy panels, thin steel poles.
// ---------------------------------------------------------------------------------------------------------------
export function languageOfTheBirds(out: MeshBuilder, _fit?: Fit): void {
  const GLASS: Rgb = [0.82, 0.88, 0.92]
  const poles: V3[] = [[-2.2, 0, -1.5], [1.8, 0, -0.5], [-0.6, 0, 1.8], [2.6, 0, 1.6], [0.4, 0, -2.4]]
  for (const [px, , pz] of poles) {
    const h = 5 + Math.abs(px * pz) * 0.15
    box(out, px, h / 2, pz, 0.06, h / 2, 0.06, IRON, METAL_TAG)
    // one or two open "books" near the top of each pole: two angled panels meeting at a spine, like flung pages
    const by = h - 0.6 + (px > 0 ? 0.3 : 0)
    for (const s of [-1, 1]) {
      const heading = Math.atan2(pz, px) + s * 0.5
      boxAlong(out, px + Math.cos(heading) * 0.5, by + s * 0.15, pz + Math.sin(heading) * 0.5, 0.55, 0.02, 0.4, heading, GLASS, surfaceTag('glass'))
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
  vaillancourtFountain, lottasFountain, cupidsSpan, asawaMermaidFountain, redwoodParkBronzes, mlkWaterfall,
  heartsInSanFrancisco, languageOfTheBirds, francisScottKeyCanopy, stevensonMemorial,
}
