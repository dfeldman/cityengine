/**
 * CEMETERIES (owner, 2026-11-15: "we should support headstone style cemeteries AND french style which are more chaotic
 * and each plot is more like a small mausoleum or above-ground sculpture … they should 'feel' like the cemeteries in a
 * given area, with a few representative styles").
 *
 * The outlines and a style per cemetery come from public/landmarks/<region>-cemeteries.json (tools/cemeteries.ts, from
 * OSM). Inside each outline, rows square to its longest side; along a row, plots one after another, each a small
 * composition of parts from a library of monument meshes (chapel, slab, stele, cross, obelisk, tablet, statue,
 * railing). Each part kind is ONE thin-instanced mesh per cemetery, recoloured per instance.
 *
 * The chaos of a Paris cemetery is in PATCHES (reference photos, 2026-11-15: Père-Lachaise, Montparnasse, Montmartre,
 * Pantin, Bagneux): a square of PATCH metres takes one MOOD — a run of chapels shoulder to shoulder, a field of black
 * granite family slabs, an overgrown corner of mossy crosses and railings — and the plots inside it draw from that mood.
 * Headstone styles (military, American) are regular rows of one or two shapes.
 *
 * Drives and paths are kept clear (the street graph: Père-Lachaise's chemins are all mapped footways, so its divisions
 * fall out of it). Built when the rider's focus comes within NEAR, a slice at a time (BUDGET_MS a frame), dropped
 * beyond FAR. Left out with the furniture. Reference numbers: docs/CEMETERIES.md.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'

// ── tunables ────────────────────────────────────────────────────────────────────────────────────────────────────────
const NEAR = 450            // build a cemetery when the focus is this close to its outline's box
const FAR = 750             // and drop it past this
const BUDGET_MS = 4         // layout work per frame
const CLEAR = 0.9           // metres kept clear of a drive's or path's edge
const EDGE = 1.5            // metres kept in from the outline (its wall)
const SETTLE_MS = 60_000    // re-read the ground under the stones this long after building (fine terrain streams in)
const PLATE = 0.13          // the gravel plate's height over the ground under its centre (the drawn grass stands a little proud)

type RGB = [number, number, number]
type Proto = 'chapel' | 'slab' | 'stele' | 'cross' | 'obelisk' | 'tablet' | 'statue' | 'railing' | 'latin'
const PROTOS: Proto[] = ['chapel', 'slab', 'stele', 'cross', 'obelisk', 'tablet', 'statue', 'railing', 'latin']

/** stone colours (reference photos, read by Haiku 2026-11-15) */
const C = {
  limestone: [0.78, 0.74, 0.65] as RGB,
  oldLime: [0.66, 0.64, 0.58] as RGB,
  moss: [0.42, 0.45, 0.36] as RGB,
  soot: [0.38, 0.37, 0.35] as RGB,
  greyGranite: [0.55, 0.56, 0.56] as RGB,
  darkGranite: [0.36, 0.36, 0.38] as RGB,
  black: [0.12, 0.12, 0.13] as RGB,
  pink: [0.56, 0.49, 0.47] as RGB,
  redBrown: [0.4, 0.31, 0.29] as RGB,
  white: [0.92, 0.91, 0.88] as RGB,
  paleGrey: [0.72, 0.72, 0.7] as RGB,
  bronze: [0.3, 0.37, 0.33] as RGB,
  gravel: [0.5, 0.48, 0.43] as RGB,
  cedar: [0.5, 0.43, 0.36] as RGB,
}

/** one plot type: its width along the row, and the parts it lays down */
type PlotKind = 'chapel' | 'family' | 'ledger' | 'cross' | 'obelisk' | 'statue' | 'overgrown' | 'tablet' | 'latin' | 'kerb' | 'tiny'
interface Mood { w: Partial<Record<PlotKind, number>>; stone: [RGB, number][] }
interface Style {
  /** row pitch (across), the plot's depth; the gap between neighbours along a row (min, max); a path every n rows, this wide */
  across: number; gap: [number, number]; pathEvery: number; path: number
  /** fixed pitch along the row (headstone styles), else 0 and each plot's own width */
  along: number
  /** sideways and sideways-turn jitter (m, rad) */
  jitter: number; turn: number
  /** a share of spots left empty (lawn, a lost plot) */
  empty: number
  patch: number
  /** a gravel plate under each plot (Paris: the ground between graves is gravel and dust, not lawn), or none */
  ground?: RGB
  moods: [Mood, number][]
}

const PARIS_GRANITE: [RGB, number][] = [[C.black, 4], [C.greyGranite, 3], [C.darkGranite, 2.5], [C.pink, 0.8], [C.redBrown, 0.8]]
const PARIS_LIME: [RGB, number][] = [[C.limestone, 3], [C.oldLime, 4], [C.soot, 2], [C.moss, 1.5]]

export const STYLES: Record<string, Style> = {
  // Père-Lachaise, Montmartre, Passy: chapels and statues, mossy limestone, packed shoulder to shoulder
  'paris-old': {
    across: 2.7, gap: [0.1, 0.4], pathEvery: 4, path: 1.2, along: 0, jitter: 0.12, turn: 0.04, empty: 0.03, patch: 13, ground: C.gravel,
    moods: [
      [{ w: { chapel: 6, family: 1, statue: 1 }, stone: PARIS_LIME }, 3],
      [{ w: { family: 3, cross: 2, overgrown: 2, obelisk: 1, statue: 1 }, stone: [...PARIS_LIME, ...PARIS_GRANITE] }, 3],
      [{ w: { overgrown: 4, cross: 2, ledger: 1 }, stone: [[C.moss, 3], [C.soot, 2], [C.oldLime, 2]] }, 2],
      [{ w: { chapel: 2, obelisk: 2, statue: 2, cross: 1 }, stone: PARIS_LIME }, 1],
    ],
  },
  // Montparnasse and the other intra-muros ones: granite family slabs, chapels in runs, gridded
  'paris-classic': {
    across: 2.8, gap: [0.2, 0.5], pathEvery: 3, path: 1.4, along: 0, jitter: 0.06, turn: 0.02, empty: 0.04, patch: 15, ground: C.gravel,
    moods: [
      [{ w: { family: 6, ledger: 2, cross: 1 }, stone: PARIS_GRANITE }, 4],
      [{ w: { chapel: 5, family: 2 }, stone: [[C.limestone, 3], [C.oldLime, 2], [C.greyGranite, 1]] }, 2],
      [{ w: { family: 2, cross: 2, obelisk: 1, overgrown: 1, statue: 0.5 }, stone: [...PARIS_LIME, ...PARIS_GRANITE] }, 2],
    ],
  },
  // the communes' and the cimetières parisiens extra-muros: polished granite slabs on gravel, a chapel now and then
  'paris-suburban': {
    across: 2.9, gap: [0.3, 0.6], pathEvery: 3, path: 1.6, along: 0, jitter: 0.04, turn: 0.015, empty: 0.06, patch: 18, ground: C.gravel,
    moods: [
      [{ w: { family: 8, ledger: 3, cross: 1, chapel: 0.25 }, stone: PARIS_GRANITE }, 5],
      [{ w: { family: 4, cross: 2, chapel: 0.6, obelisk: 0.3 }, stone: [[C.oldLime, 2], [C.greyGranite, 2], [C.black, 1]] }, 1.5],
      [{ w: { latin: 1 }, stone: [[C.paleGrey, 1]] }, 0.6],   // a carré militaire
    ],
  },
  // the American cemetery at Suresnes: white marble Latin crosses in rows on a lawn
  'military-cross': {
    across: 2.8, gap: [0, 0], pathEvery: 0, path: 0, along: 1.4, jitter: 0, turn: 0, empty: 0, patch: 1000,
    moods: [[{ w: { latin: 1 }, stone: [[C.white, 1]] }, 1]],
  },
  // the SF National Cemetery's look, for any other military cemetery
  'military-tablet': {
    across: 2.4, gap: [0, 0], pathEvery: 0, path: 0, along: 1.5, jitter: 0, turn: 0, empty: 0, patch: 1000,
    moods: [[{ w: { tablet: 1 }, stone: [[C.white, 1]] }, 1]],
  },
  // an old American churchyard (Mission Dolores): weathered headstones, an obelisk, kerbs, cedar boards, garden between
  'us-old': {
    across: 3.2, gap: [0.6, 1.6], pathEvery: 0, path: 0, along: 0, jitter: 0.3, turn: 0.12, empty: 0.25, patch: 10,
    moods: [[{ w: { tablet: 5, obelisk: 1, kerb: 2, cross: 1 }, stone: [[C.paleGrey, 3], [C.oldLime, 2], [C.cedar, 1], [C.white, 1]] }, 1]],
  },
  pet: {
    across: 1.4, gap: [0.3, 0.8], pathEvery: 0, path: 0, along: 0, jitter: 0.2, turn: 0.2, empty: 0.2, patch: 1000,
    moods: [[{ w: { tiny: 1 }, stone: [[C.paleGrey, 2], [C.white, 1], [C.cedar, 1]] }, 1]],
  },
}

// ── the library: each part at a nominal size, foot at y=0, running down to y=-0.6 so a slope never shows under it ──
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const SINK = -0.6
const RECOLOUR = 1
const KEEP = 0
function box(o: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t: RGB, k: number, top = true): void {
  o.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], UV, t, k)
  o.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], UV, t, k)
  o.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], UV, t, k)
  o.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], UV, t, k)
  if (top) o.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], UV, t, k)
}
/** a frustum: base half-sizes (a, b) at y0, top (c, d) at y1 */
function taper(o: MeshBuilder, a: number, b: number, c: number, d: number, y0: number, y1: number, t: RGB, k: number): void {
  const B = [[-a, -b], [a, -b], [a, b], [-a, b]]
  const T = [[-c, -d], [c, -d], [c, d], [-c, d]]
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const mx = (B[i][0] + B[j][0]) / 2, mz = (B[i][1] + B[j][1]) / 2
    const l = Math.hypot(mx, mz) || 1
    o.quad([[B[i][0], y0, B[i][1]], [B[j][0], y0, B[j][1]], [T[j][0], y1, T[j][1]], [T[i][0], y1, T[i][1]]], [mx / l, 0.25, mz / l], UV, t, k)
  }
  if (c > 0) o.quad([[-c, y1, d], [c, y1, d], [c, y1, -d], [-c, y1, -d]], [0, 1, 0], UV, t, k)
}
const W: RGB = [1, 1, 1]
const SLATE: RGB = [0.4, 0.4, 0.41]   // most chapel roofs are stone slabs, not slate
const IRON: RGB = [0.16, 0.18, 0.2]
/** Every proto is 1 m wide (x), 1 m deep (z, its face to +z) and 1 m tall before scaling, unless noted. */
function proto(p: Proto): MeshBuilder {
  const o = new MeshBuilder()
  switch (p) {
    case 'chapel': {
      // walls to 0.72, a 35° gable roof over z, a door on the +z front, a cross on the apex; a plinth step
      box(o, -0.53, 0.53, SINK, 0.08, -0.53, 0.53, W, RECOLOUR)
      box(o, -0.5, 0.5, 0.08, 0.72, -0.5, 0.5, W, RECOLOUR, false)
      const r = 0.72, ridge = 0.92, ov = 0.06
      o.quad([[-0.5 - ov, r, 0.55], [0, ridge, 0.55], [0, ridge, -0.55], [-0.5 - ov, r, -0.55]], [-0.7, 0.7, 0], UV, SLATE, KEEP)
      o.quad([[0.5 + ov, r, -0.55], [0, ridge, -0.55], [0, ridge, 0.55], [0.5 + ov, r, 0.55]], [0.7, 0.7, 0], UV, SLATE, KEEP)
      // pediments front and back
      for (const s of [1, -1]) o.quad([[-0.5, r, s * 0.5], [0.5, r, s * 0.5], [0, ridge, s * 0.5], [0, ridge, s * 0.5]], [0, 0, s], UV, W, RECOLOUR)
      box(o, -0.2, 0.2, 0.08, 0.55, 0.5, 0.515, IRON, KEEP)
      box(o, -0.025, 0.025, ridge - 0.02, ridge + 0.2, 0.47, 0.53, W, RECOLOUR)
      box(o, -0.08, 0.08, ridge + 0.1, ridge + 0.14, 0.47, 0.53, W, RECOLOUR)
      break
    }
    case 'slab': box(o, -0.5, 0.5, SINK, 1, -0.5, 0.5, W, RECOLOUR); break
    case 'stele': {
      // a slab standing, with a shallow arched head
      box(o, -0.5, 0.5, SINK, 0.85, -0.5, 0.5, W, RECOLOUR)
      taper(o, 0.5, 0.5, 0.3, 0.5, 0.85, 1, W, RECOLOUR)
      break
    }
    case 'cross': {
      // a stepped plinth (to 0.25) and a Latin cross; 1 m tall overall, arms at 0.75
      box(o, -0.5, 0.5, SINK, 0.12, -0.5, 0.5, W, RECOLOUR)
      box(o, -0.32, 0.32, 0.12, 0.25, -0.32, 0.32, W, RECOLOUR)
      box(o, -0.07, 0.07, 0.25, 1, -0.07, 0.07, W, RECOLOUR)
      box(o, -0.3, 0.3, 0.68, 0.8, -0.07, 0.07, W, RECOLOUR)
      break
    }
    case 'latin': {
      box(o, -0.06, 0.06, SINK, 1, -0.04, 0.04, W, RECOLOUR)
      box(o, -0.25, 0.25, 0.66, 0.78, -0.04, 0.04, W, RECOLOUR)
      break
    }
    case 'obelisk': {
      box(o, -0.5, 0.5, SINK, 0.18, -0.5, 0.5, W, RECOLOUR)
      box(o, -0.36, 0.36, 0.18, 0.3, -0.36, 0.36, W, RECOLOUR)
      taper(o, 0.22, 0.22, 0.13, 0.13, 0.3, 0.92, W, RECOLOUR)
      taper(o, 0.13, 0.13, 0, 0, 0.92, 1, W, RECOLOUR)
      break
    }
    case 'tablet': {
      // the SF National Cemetery's rounded-top upright stone
      box(o, -0.5, 0.5, SINK, 0.82, -0.5, 0.5, W, RECOLOUR)
      taper(o, 0.5, 0.5, 0.2, 0.5, 0.82, 1, W, RECOLOUR)
      break
    }
    case 'statue': {
      // a pedestal (to 0.5) and a standing figure: robe, shoulders, head (recoloured: bronze or marble)
      box(o, -0.5, 0.5, SINK, 0.5, -0.5, 0.5, W, RECOLOUR)
      taper(o, 0.3, 0.22, 0.2, 0.15, 0.5, 0.88, W, RECOLOUR)
      box(o, -0.07, 0.07, 0.88, 1, -0.07, 0.07, W, RECOLOUR)
      break
    }
    case 'railing': {
      // a low iron fence round a 1×1 plot, 1 m tall before scaling (scaled to ~0.45)
      const t = 0.025
      for (const [x0, x1, z0, z1] of [[-0.5, 0.5, -0.5, -0.5 + t], [-0.5, 0.5, 0.5 - t, 0.5], [-0.5, -0.5 + t, -0.5, 0.5], [0.5 - t, 0.5, -0.5, 0.5]]) {
        box(o, x0, x1, 0.82, 0.9, z0, z1, IRON, KEEP)
        box(o, x0, x1, 0.15, 0.2, z0, z1, IRON, KEEP)
      }
      for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) box(o, x - 0.035, x + 0.035, SINK, 1, z - 0.035, z + 0.035, IRON, KEEP)
      for (let i = -4; i <= 4; i++) box(o, i * 0.11 - 0.008, i * 0.11 + 0.008, 0.15, 0.9, 0.49, 0.5, IRON, KEEP)
      break
    }
  }
  return o
}

// ── plots ───────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Part { p: Proto; x: number; z: number; sx: number; sy: number; sz: number; c: RGB }
type Rand = () => number
const pick = <T>(r: Rand, ws: [T, number][]): T => {
  let s = 0
  for (const [, w] of ws) s += w
  let x = r() * s
  for (const [v, w] of ws) { x -= w; if (x <= 0) return v }
  return ws[ws.length - 1][0]
}
const range = (r: Rand, a: number, b: number): number => a + (b - a) * r()
const shade = (c: RGB, r: Rand, by = 0.12): RGB => { const k = 1 + (r() - 0.5) * 2 * by; return [c[0] * k, c[1] * k, c[2] * k] }

/**
 * A plot's width along the row and its parts, in the plot's frame: x along the row, z across it with the head of the
 * grave at -z and the path it faces at +z; `depth` is the row pitch.
 */
function plot(kind: PlotKind, depth: number, r: Rand, stone: () => RGB): { w: number; parts: Part[] } {
  const d = depth - 0.4
  switch (kind) {
    case 'chapel': {
      const w = range(r, 1.3, 2.0), dd = Math.min(d, range(r, 1.8, 2.4)), h = range(r, 2.3, 3.4)
      return { w, parts: [{ p: 'chapel', x: 0, z: 0, sx: w, sy: h, sz: dd, c: shade(stone(), r) }] }
    }
    case 'family': case 'ledger': {
      const w = kind === 'family' ? range(r, 1.0, 1.5) : range(r, 0.85, 1.1), c = shade(stone(), r, 0.06)
      const parts: Part[] = [{ p: 'slab', x: 0, z: 0.15, sx: w, sy: range(r, 0.15, 0.4), sz: Math.min(d, 2.1), c }]
      if (kind === 'family') {
        const h = range(r, 0.6, 1.3)
        parts.push({ p: 'stele', x: 0, z: 0.15 - Math.min(d, 2.1) / 2 - 0.08, sx: w * range(r, 0.7, 1), sy: h, sz: 0.16, c })
        if (r() < 0.3) parts.push({ p: 'latin', x: 0, z: 0.15 - Math.min(d, 2.1) / 2 - 0.08, sx: 0.5, sy: h + 0.45, sz: 1.5, c })
      }
      if (r() < 0.12) parts.push({ p: 'railing', x: 0, z: 0.15, sx: w + 0.2, sy: 0.45, sz: Math.min(d, 2.1) + 0.2, c: W })
      return { w: w + (parts.length > 2 ? 0.1 : 0), parts }
    }
    case 'cross': {
      const w = range(r, 0.9, 1.3), c = shade(stone(), r)
      const parts: Part[] = [
        { p: 'slab', x: 0, z: 0.2, sx: w, sy: range(r, 0.1, 0.3), sz: Math.min(d, 1.9), c },
        { p: 'cross', x: 0, z: 0.2 - Math.min(d, 1.9) / 2 + 0.3, sx: 0.6, sy: range(r, 1.2, 2.2), sz: 0.6, c },
      ]
      return { w, parts }
    }
    case 'obelisk': {
      const s = range(r, 0.8, 1.2), c = shade(stone(), r)
      return { w: s + 0.2, parts: [{ p: 'obelisk', x: 0, z: -0.3, sx: s, sy: range(r, 2.0, 3.6), sz: s, c }] }
    }
    case 'statue': {
      const s = range(r, 0.7, 1.0), bronze = r() < 0.6
      return { w: s + 0.3, parts: [{ p: 'statue', x: 0, z: -0.2, sx: s, sy: range(r, 1.8, 2.6), sz: s, c: bronze ? shade(C.bronze, r) : shade(stone(), r) }] }
    }
    case 'overgrown': {
      // an old grave sinking: a low slab, a leaning cross or a broken stele, a rusted railing
      const w = range(r, 0.9, 1.3), c = shade(stone(), r, 0.15)
      const parts: Part[] = [{ p: 'slab', x: 0, z: 0.1, sx: w, sy: range(r, 0.05, 0.2), sz: Math.min(d, 2), c }]
      parts.push(r() < 0.5
        ? { p: 'latin', x: range(r, -0.2, 0.2), z: -0.8, sx: 1.2, sy: range(r, 0.8, 1.4), sz: 2, c }
        : { p: 'stele', x: 0, z: -0.85, sx: w * 0.7, sy: range(r, 0.4, 0.9), sz: 0.14, c })
      if (r() < 0.5) parts.push({ p: 'railing', x: 0, z: 0.1, sx: w + 0.15, sy: 0.5, sz: Math.min(d, 2) + 0.15, c: W })
      return { w, parts }
    }
    case 'tablet': {
      const c = shade(stone(), r, 0.05)
      return { w: 0.5, parts: [{ p: 'tablet', x: 0, z: -0.6, sx: range(r, 0.38, 0.5), sy: range(r, 0.75, 0.95), sz: 0.1, c }] }
    }
    case 'latin': {
      const c = shade(stone(), r, 0.03)
      return { w: 0.6, parts: [{ p: 'latin', x: 0, z: -0.6, sx: 1.1, sy: 0.95, sz: 1.2, c }] }
    }
    case 'kerb': {
      // a family plot edged in low stone kerbs (the railing frame, recoloured as stone, short)
      const w = range(r, 1.4, 2.4), c = shade(stone(), r)
      return { w, parts: [
        { p: 'slab', x: -w / 2 + 0.05, z: 0, sx: 0.1, sy: 0.2, sz: 2, c }, { p: 'slab', x: w / 2 - 0.05, z: 0, sx: 0.1, sy: 0.2, sz: 2, c },
        { p: 'slab', x: 0, z: 0.95, sx: w, sy: 0.2, sz: 0.1, c },
        { p: 'tablet', x: 0, z: -0.95, sx: 0.6, sy: range(r, 0.7, 1.1), sz: 0.14, c },
      ] }
    }
    case 'tiny': {
      const c = shade(stone(), r)
      return { w: 0.3, parts: [{ p: 'tablet', x: 0, z: -0.3, sx: 0.25, sy: range(r, 0.2, 0.35), sz: 0.06, c }] }
    }
  }
}

// ── layout ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface CemeterySpec { name: string; osm: string; style: string; ring: [number, number][]; holes?: [number, number][][] }
export interface CemeteriesWorld {
  toLocal: (lat: number, lon: number) => { x: number; z: number }
  ground: (x: number, z: number) => number
  ways: () => { points: { x: number; z: number }[]; half: number }[]
  paved: () => { x: number; z: number }[][]
  version: () => number
}
type Pt = { x: number; z: number }
const inside = (r: Pt[], x: number, z: number): boolean => {
  let hit = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) hit = !hit
  }
  return hit
}
function hash(a: number, b: number, s: number): number {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function rng(seed: number): Rand {
  let s = seed >>> 0 || 1
  return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0; s ^= s >>> 12; return (s >>> 0) / 4294967296 }
}

/** one cemetery's layout: the parts with world (x, z), heading and scale, built a slice at a time */
interface Placed { p: number; x: number; z: number; h: number; sx: number; sy: number; sz: number; c: RGB }

class One {
  readonly ring: Pt[]
  readonly holes: Pt[][]
  readonly box: { x0: number; x1: number; z0: number; z1: number }
  private job: Generator<void, Placed[], void> | null = null
  placed: Placed[] = []
  meshes: (Mesh | null)[] = []
  private mats: Float32Array[] = []
  builtAt = -1
  settleUntil = 0
  lastGround = 0
  private groundSum = NaN

  constructor(readonly spec: CemeterySpec, private readonly world: CemeteriesWorld, private readonly scene: Scene) {
    this.ring = spec.ring.map(([la, lo]) => world.toLocal(la, lo))
    this.holes = (spec.holes ?? []).map((h) => h.map(([la, lo]) => world.toLocal(la, lo)))
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of this.ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    this.box = { x0, x1, z0, z1 }
  }

  distance(at: Pt): number {
    const dx = Math.max(this.box.x0 - at.x, 0, at.x - this.box.x1)
    const dz = Math.max(this.box.z0 - at.z, 0, at.z - this.box.z1)
    return Math.hypot(dx, dz)
  }

  get building(): boolean { return this.job !== null }
  get built(): boolean { return this.meshes.length > 0 }

  start(): void { this.builtAt = this.world.version(); this.job = this.layout() }

  /** run the layout for up to `ms`; true when it finished (and the meshes are up) */
  step(ms: number): boolean {
    if (!this.job) return false
    const t0 = performance.now()
    for (;;) {
      const r = this.job.next()
      if (r.done) { this.job = null; this.placed = r.value; this.raise(); return true }
      if (performance.now() - t0 > ms) return false
    }
  }

  private *layout(): Generator<void, Placed[], void> {
    const st = STYLES[this.spec.style] ?? STYLES['paris-suburban']
    const { x0, x1, z0, z1 } = this.box
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    // the clearances: segments of the ways near it, in a 12 m grid
    const segs: number[][] = []
    const G = 12
    const grid = new Map<number, number[]>()
    const key = (i: number, j: number): number => i * 100003 + j
    for (const w of this.world.ways()) {
      for (let i = 1; i < w.points.length; i++) {
        const a = w.points[i - 1], b = w.points[i]
        if (Math.max(a.x, b.x) < x0 - 20 || Math.min(a.x, b.x) > x1 + 20 || Math.max(a.z, b.z) < z0 - 20 || Math.min(a.z, b.z) > z1 + 20) continue
        const k = segs.length
        segs.push([a.x, a.z, b.x, b.z, w.half + CLEAR])
        const pad = w.half + CLEAR
        for (let gi = Math.floor((Math.min(a.x, b.x) - pad) / G); gi <= Math.floor((Math.max(a.x, b.x) + pad) / G); gi++) {
          for (let gj = Math.floor((Math.min(a.z, b.z) - pad) / G); gj <= Math.floor((Math.max(a.z, b.z) + pad) / G); gj++) {
            const kk = key(gi, gj)
            const l = grid.get(kk)
            if (l) l.push(k); else grid.set(kk, [k])
          }
        }
      }
    }
    const paved = this.world.paved().filter((r) => r.some((p) => p.x > x0 - 20 && p.x < x1 + 20 && p.z > z0 - 20 && p.z < z1 + 20))
    const clear = (x: number, z: number, rad: number): boolean => {
      if (!inside(this.ring, x, z)) return false
      for (const h of this.holes) if (inside(h, x, z)) return false
      const l = grid.get(key(Math.floor(x / G), Math.floor(z / G)))
      if (l) {
        for (const k of l) {
          const [ax, az, bx, bz, half] = segs[k]
          const dx = bx - ax, dz = bz - az
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9)))
          if (Math.hypot(ax + dx * t - x, az + dz * t - z) < half + rad) return false
        }
      }
      for (const r of paved) if (inside(r, x, z)) return false
      return true
    }
    // rows square to the outline's longest side
    let best = 0, ux = 1, uz = 0
    for (let i = 0; i < this.ring.length; i++) {
      const a = this.ring[i], b = this.ring[(i + 1) % this.ring.length]
      const l = Math.hypot(b.x - a.x, b.z - a.z)
      if (l > best) { best = l; ux = (b.x - a.x) / l; uz = (b.z - a.z) / l }
    }
    const vx = -uz, vz = ux
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const p of this.ring) {
      const u = (p.x - cx) * ux + (p.z - cz) * uz, v = (p.x - cx) * vx + (p.z - cz) * vz
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v)
    }
    const seed = Number(this.spec.osm.replace(/\D/g, '')) || 7
    const out: Placed[] = []
    const moodOf = new Map<number, Mood>()
    let row = 0
    for (let v = v0 + EDGE + st.across / 2; v < v1 - EDGE; row++) {
      // a pair of rows back to back between paths: the first faces -v, the second +v
      const face = st.pathEvery ? (row % 2 === 0 ? -1 : 1) : 1
      const r = rng(seed * 31 + row)
      let u = u0 + EDGE + r() * 0.8
      while (u < u1 - EDGE) {
        const pi = Math.floor(u / st.patch), pj = Math.floor(v / st.patch)
        let mood = moodOf.get(pi * 7919 + pj)
        if (!mood) { mood = pick(rng(Math.floor(hash(pi, pj, seed) * 1e9)), st.moods); moodOf.set(pi * 7919 + pj, mood) }
        const kind = pick(r, Object.entries(mood.w) as [PlotKind, number][])
        const pl = plot(kind, st.across, r, () => pick(r, mood.stone))
        const w = st.along || pl.w
        const uc = u + w / 2 + (st.along ? 0 : (r() - 0.5) * st.jitter)
        u += w + (st.along ? 0 : range(r, st.gap[0], st.gap[1]))
        if (r() < st.empty) continue
        const vc = v + (r() - 0.5) * st.jitter
        const x = cx + ux * uc + vx * vc, z = cz + uz * uc + vz * vc
        // the plot's footprint corners must all be clear (the head and foot too, so a chapel never straddles a path)
        const hu = pl.w / 2 * 0.6, hv = (st.across - 0.4) / 2 * 0.7
        let ok = clear(x, z, 0)
        for (const [a, b] of [[hu, hv], [-hu, hv], [hu, -hv], [-hu, -hv]]) if (ok) ok = clear(x + ux * a + vx * b, z + uz * a + vz * b, 0)
        if (!ok) continue
        const turn = (r() - 0.5) * 2 * st.turn
        // the plot's frame: +z (its face) toward the path at face·v
        const fx = vx * face, fz = vz * face
        const h = Math.atan2(fx, fz) + turn
        const lx = ux * face, lz = uz * face   // its +x along the row (kept right-handed with the face)
        if (st.ground) {
          const gp = PROTOS.indexOf('slab'), gw = w + st.gap[1] + 0.1
          out.push({ p: gp, x, z, h, sx: gw, sy: PLATE, sz: st.across + 0.15 + 2 * st.path, c: st.ground })
        }
        for (const p of pl.parts) {
          out.push({ p: PROTOS.indexOf(p.p), x: x + lx * p.x + fx * p.z, z: z + lz * p.x + fz * p.z, h, sx: p.sx, sy: p.sy, sz: p.sz, c: p.c })
        }
        if (out.length % 256 === 0) yield
      }
      v += st.across + (st.pathEvery && row % st.pathEvery === st.pathEvery - 1 ? st.path : 0.15)
      yield
    }
    return out
  }

  private raise(): void {
    this.dispose()
    const counts = PROTOS.map(() => 0)
    for (const p of this.placed) counts[p.p]++
    this.mats = []
    for (let k = 0; k < PROTOS.length; k++) {
      if (!counts[k]) { this.meshes.push(null); this.mats.push(new Float32Array(0)); continue }
      const mesh = new Mesh(`cemetery:${this.spec.name}:${PROTOS[k]}`, this.scene)
      proto(PROTOS[k]).toVertexData().applyToMesh(mesh)
      mesh.material = cartoonMaterial(this.scene)
      mesh.isPickable = false
      mesh.alwaysSelectAsActiveMesh = true
      mesh.renderingGroupId = 3
      const col = new Float32Array(counts[k] * 4)
      let i = 0
      for (const p of this.placed) if (p.p === k) { col.set([p.c[0], p.c[1], p.c[2], 1], i * 4); i++ }
      mesh.thinInstanceSetBuffer('instColor', col, 4)
      this.meshes.push(mesh)
      this.mats.push(new Float32Array(counts[k] * 16))
    }
    this.groundSum = NaN
    this.place()
  }

  /** every part on the ground under its own centre; a no-op once the ground has stopped changing */
  place(): void {
    if (!this.built) return
    let sum = 0
    const m = new Matrix(), q = new Quaternion(), s = new Vector3(), t = new Vector3()
    const idx = PROTOS.map(() => 0)
    const ys = this.placed.map((p) => this.world.ground(p.x, p.z))
    for (const y of ys) sum += y
    if (sum === this.groundSum) return
    this.groundSum = sum
    for (let i = 0; i < this.placed.length; i++) {
      const p = this.placed[i]
      Quaternion.FromEulerAnglesToRef(0, p.h, 0, q)
      s.set(p.sx, p.sy, p.sz)
      t.set(p.x, ys[i] - 0.03, p.z)
      Matrix.ComposeToRef(s, q, t, m)
      m.copyToArray(this.mats[p.p], idx[p.p]++ * 16)
    }
    for (let k = 0; k < PROTOS.length; k++) this.meshes[k]?.thinInstanceSetBuffer('matrix', this.mats[k], 16)
  }

  dispose(): void {
    for (const m of this.meshes) m?.dispose()
    this.meshes = []
    this.mats = []
  }

  drop(): void { this.dispose(); this.job = null; this.placed = [] }
}

export class Cemeteries {
  private readonly all: One[]
  constructor(scene: Scene, specs: CemeterySpec[], private readonly world: CemeteriesWorld) {
    this.all = specs.filter((s) => s.ring.length >= 4).map((s) => new One(s, world, scene))
  }

  get count(): number { return this.all.reduce((n, c) => n + c.placed.length, 0) }

  /** every frame: start the nearest unbuilt one in range, give the one building its slice, drop far ones, settle */
  update(at: Pt, now: number): void {
    let busy = this.all.find((c) => c.building)
    if (!busy) {
      let best: One | null = null, bd = NEAR
      for (const c of this.all) {
        const d = c.distance(at)
        if (!c.built && d < bd) { bd = d; best = c }
        else if (c.built && d > FAR) c.drop()
      }
      if (best) { best.start(); busy = best }
    }
    if (busy && busy.step(BUDGET_MS)) busy.settleUntil = now + SETTLE_MS
    for (const c of this.all) {
      if (!c.built || now > c.settleUntil || now - c.lastGround < 3000) continue
      c.lastGround = now
      // the streets round it may still be streaming in: lay it out again off any new path
      if (this.world.version() !== c.builtAt && !busy) { c.start(); busy = c } else c.place()
    }
  }
}

/** The cemeteries of a city or its region: `landmarks/<name>-cemeteries.json`, or none. */
export async function cemeteryManifest(base: string, names: string[]): Promise<CemeterySpec[]> {
  for (const n of names) {
    try {
      const r = await fetch(new URL(`landmarks/${n}-cemeteries.json`, base).href)
      const t = await r.text()
      if (r.ok && t.trimStart().startsWith('[')) return JSON.parse(t) as CemeterySpec[]
    } catch { /* the next */ }
  }
  return []
}
