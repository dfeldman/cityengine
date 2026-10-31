/**
 * The owner's small stations (docs/PARIS_MINOR_BUGS.md #10, #11, #16, 2026-10-30). The bake takes every building at a negative level or on
 * a layer off the ground for a part of something underground, or a canopy, and these are exactly that: Nanterre-Université (way/386283983)
 * is `layer=3 level=3`, outside the bake's box and so in the fringe at 7 m with no model; Pont Cardinet (way/421800231) is `layer=-2`, its
 * platform roofs `layer=1 level=-1`, and they are not in the package at all. So they are placed by point, in frames read off OSM's outlines by osmium, and drawn whole. The rails and the platforms are the
 * city's; these stand over them and do not touch them.
 *
 * - NANTERRE-UNIVERSITÉ ("not rendering Nanterre station at all"; Duthilleul and Tricaud, OSM's `architect`; Commons "Vue d'ensemble gare
 *   Nanterre-Université en sortant de l'université", IGN's aerial): a deck over the cutting, an upper box of pale ribbed panels on a glazed
 *   ground floor, and the one thing you see, a thin white roof 60 m across on raking struts, its soffit timber, three strips of skylight.
 *   The escalators' white tubes go down past its east side to the platforms, whose long canopies run on eastward. −z to the university's
 *   parvis, front 343; +x is bearing 253. Its outline is a trapezium.
 * - PONT CARDINET (1922 by its look, the date not checked; Commons "Pont-Cardinet extérieur.JPG", "Paris - Gare de Pont-Cardinet 01.jpg", IGN's
 *   aerial): cream render and yellow brick panels, the great ogee gable glazed in red frames over a flat concrete canopy, a smaller
 *   gable behind it, copper-green barrel roofs, PONT CARDINET in a stone panel; behind it, over the cutting, the white footbridge hall of
 *   the Clichy-Batignolles rebuilding, and the four glass roofs over the platforms (OSM). −z to the Rue Cardinet, front 131; +x bearing 41.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { beam, block, hex, prism, shade, type Rgb } from '../../kit.ts'
import { signText } from '../../parts.ts'
import { FIXED, UV, cap, panel, surfaceTag, type P2, type V3 } from '../rivegauche/common.ts'

const quad = (out: MeshBuilder, q: V3[], n: V3, c: Rgb, tag = FIXED): void => out.quad(q, n, UV, c, tag)

/** A platform roof: a thin plate on a line of T-posts, down the platform's length, standing on the ground under each post. */
export function platformRoof(out: MeshBuilder, a: P2, b: P2, hw: number, at: (x: number, z: number) => number, h: number, roof: Rgb, under: Rgb, pitch = 12): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
  const nx = -tz, nz = tx
  const n = Math.max(1, Math.round(L / pitch))
  const steel: Rgb = [0.24, 0.27, 0.29]
  const metal = surfaceTag('metal')
  for (let i = 0; i < n; i++) {
    const u0 = (L * i) / n, u1 = (L * (i + 1)) / n
    const P = (u: number): P2 => ({ x: a.x + tx * u, z: a.z + tz * u })
    const p0 = P(u0), p1 = P(u1)
    const y0 = at(p0.x, p0.z) + h, y1 = at(p1.x, p1.z) + h
    const C = (p: P2, y: number, s: number): V3 => [p.x + nx * s * hw, y, p.z + nz * s * hw]
    // the plate, a shallow V as a butterfly roof is, its top and underside, and its thin edge
    quad(out, [C(p0, y0, -1), C(p1, y1, -1), [p1.x, y1 - 0.25, p1.z], [p0.x, y0 - 0.25, p0.z]], [-nx * 0.1, 1, -nz * 0.1], roof, FIXED)
    quad(out, [[p0.x, y0 - 0.25, p0.z], [p1.x, y1 - 0.25, p1.z], C(p1, y1, 1), C(p0, y0, 1)], [nx * 0.1, 1, nz * 0.1], shade(roof, 0.92), FIXED)
    quad(out, [C(p0, y0 - 0.3, -1), C(p1, y1 - 0.3, -1), C(p1, y1 - 0.3, 1), C(p0, y0 - 0.3, 1)], [0, -1, 0], under, FIXED)
    // the post, its arms out to the edges
    const m = P((u0 + u1) / 2)
    const ym = at(m.x, m.z)
    prism(out, m.x, m.z, ym, ym + h - 0.3, 0.14, 6, steel, metal, 0.12, false)
    beam(out, C(m, ym + h - 0.35, -1), C(m, ym + h - 0.35, 1), 0.07, steel, 0.12)
  }
}

export function nanterreUniversite(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const at = (x: number, z: number): number => fit.groundAt?.(x, z) ?? g
  const conc = surfaceTag('concrete'), glass = surfaceTag('glass'), metal = surfaceTag('metal'), plank = surfaceTag('planks')
  const PANEL: Rgb = hex('#d9d6cc'), PANEL2: Rgb = hex('#c4c2b8'), WHITE: Rgb = hex('#bdbdb8'), GLASS: Rgb = hex('#3b4a50'), TIMBER: Rgb = hex('#a9743f'), CONC: Rgb = hex('#9d9a92'), STEEL: Rgb = hex('#c9cbc9')
  // OSM's outline, the roof's edge
  const roof: P2[] = [{ x: -22.45, z: -30.35 }, { x: 31.25, z: -30.35 }, { x: 21.65, z: 30.35 }, { x: -31.25, z: 21.05 }]
  const inset = (r: P2[], k: number): P2[] => { const c = { x: r.reduce((s, p) => s + p.x, 0) / 4, z: r.reduce((s, p) => s + p.z, 0) / 4 }; return r.map((p) => ({ x: c.x + (p.x - c.x) * k, z: c.z + (p.z - c.z) * k })) }
  const deck = inset(roof, 0.96), hall = inset(roof, 0.74), box = inset(roof, 0.66)
  const yDeck = g + 0.05, yBox = g + 4.6, yEaves = g + 9.8

  // ---- the deck over the cutting, on its piers down to the track bed
  cap(out, deck, yDeck, CONC, conc)
  for (let i = 0; i < 4; i++) {
    const a = deck[i], b = deck[(i + 1) % 4]
    panel(out, [[a.x, yDeck, a.z], [b.x, yDeck, b.z], [b.x, yDeck - 1.3, b.z], [a.x, yDeck - 1.3, a.z]], [0, g, 0], shade(CONC, 0.85), conc)
  }
  for (let i = -2; i <= 2; i++) {
    for (const z of [-20, -2, 16]) {
      const x = i * 10
      const y = at(x, z)
      if (y < g - 1.5) block(out, x - 0.6, x + 0.6, z - 0.6, z + 0.6, y - 0.5, yDeck - 1.2, shade(CONC, 0.8))
    }
  }

  // ---- the glazed ground floor, and the upper box of pale ribbed panels with its few dark windows
  const walls = (r: P2[], y0: number, y1: number, each: (a: P2, b: P2, nx: number, nz: number, L: number) => void): void => {
    const c = { x: r.reduce((s, p) => s + p.x, 0) / 4, z: r.reduce((s, p) => s + p.z, 0) / 4 }
    for (let i = 0; i < 4; i++) {
      const a = r[i], b = r[(i + 1) % 4]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      let nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
      if ((a.x + b.x) / 2 * nx - c.x * nx + ((a.z + b.z) / 2 - c.z) * nz < 0) { nx = -nx; nz = -nz }
      void y0; void y1
      each(a, b, nx, nz, L)
    }
  }
  walls(hall, yDeck, yBox, (a, b, nx, nz, L) => {
    quad(out, [[a.x, yDeck, a.z], [b.x, yDeck, b.z], [b.x, yBox, b.z], [a.x, yBox, a.z]], [nx, 0, nz], GLASS, glass)
    const n = Math.round(L / 3.2)
    for (let i = 0; i <= n; i++) {
      const x = a.x + ((b.x - a.x) * i) / n, z = a.z + ((b.z - a.z) * i) / n
      block(out, x - 0.06 + nx * 0.1, x + 0.06 + nx * 0.1, z - 0.06 + nz * 0.1, z + 0.06 + nz * 0.1, yDeck, yBox, STEEL)
    }
  })
  cap(out, hall, yBox, shade(CONC, 0.9), conc)
  walls(box, yBox, yEaves, (a, b, nx, nz, L) => {
    const n = Math.round(L / 2.4)
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n
      const A: V3 = [a.x + (b.x - a.x) * u0, 0, a.z + (b.z - a.z) * u0], B: V3 = [a.x + (b.x - a.x) * u1, 0, a.z + (b.z - a.z) * u1]
      quad(out, [[A[0], yBox, A[2]], [B[0], yBox, B[2]], [B[0], yEaves, B[2]], [A[0], yEaves, A[2]]], [nx, 0, nz], i % 2 ? PANEL : PANEL2, FIXED)
      if (i % 3 === 1) {
        const m = 0.04
        quad(out, [[A[0] + nx * m, yBox + 2.5, A[2] + nz * m], [B[0] + nx * m, yBox + 2.5, B[2] + nz * m], [B[0] + nx * m, yBox + 3.9, B[2] + nz * m], [A[0] + nx * m, yBox + 3.9, A[2] + nz * m]], [nx, 0, nz], GLASS, glass)
      }
    }
  })

  // ---- the roof: a skillion, a shade higher on the parvis's side. Timber under, white over, a fascia; the skylights on it, and the crest
  const rise = (p: P2): number => yEaves + 1.0 + (30.35 - p.z) * 0.03
  const R: V3[] = roof.map((p) => [p.x, rise(p), p.z])
  quad(out, R, [0, -1, 0], TIMBER, plank)
  const up: V3[] = R.map((p) => [p[0], p[1] + 0.55, p[2]])
  quad(out, up, [0, 1, 0], WHITE, FIXED)
  for (let i = 0; i < 4; i++) {
    const a = R[i], b = R[(i + 1) % 4], c = up[(i + 1) % 4], d = up[i]
    panel(out, [a, b, c, d], [0, a[1], 0], shade(WHITE, 0.82), metal)
  }
  // three skylights, as IGN's aerial has them, slanted strips on the roof's long diagonal
  for (const [cx, cz, hl] of [[3, -15, 11], [2, -1, 13], [0, 13, 11]]) {
    const y = rise({ x: cx, z: cz }) + 0.62
    quad(out, [[cx - hl, y, cz - 1.1], [cx + hl, y, cz - 1.1], [cx + hl, y, cz + 1.1], [cx - hl, y, cz + 1.1]], [0, 1, 0], GLASS, glass)
    block(out, cx - hl, cx + hl, cz - 0.08, cz + 0.08, y, y + 0.28, STEEL)
  }
  // the raking struts: pairs in a V, from the box's head out to the roof's edge
  walls(inset(roof, 0.9), 0, 0, (a, b, nx, nz, L) => {
    const n = Math.round(L / 9)
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      const fy = yBox - 0.1, fx = x - nx * 6, fz = z - nz * 6
      const top = rise({ x, z }) - 0.05
      for (const s of [-1, 1]) beam(out, [fx, fy, fz], [x + (s * (b.x - a.x)) / L * 1.6, top, z + (s * (b.z - a.z)) / L * 1.6], 0.16, WHITE)
      // from the deck to the box's head, the column under it
      block(out, fx - 0.22, fx + 0.22, fz - 0.22, fz + 0.22, yDeck, fy, STEEL)
    }
  })
  // the white crest along the west edge of the roof, a picket of fins as the photograph has
  {
    const a = R[3], b = R[0]
    for (let i = 0; i <= 26; i++) {
      const t = i / 26
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t
      block(out, x - 0.04, x + 0.04, z - 0.04, z + 0.04, y + 0.5, y + 1.5, WHITE)
    }
  }

  // ---- the escalators, white tubes going down to the platforms past the east side (−x)
  const lowZ = [-13, 2]
  for (const z of lowZ) {
    const top: V3 = [-26, yBox - 1.2, z]
    const yb = at(-46, z) + 1.1
    beam(out, top, [-46, yb, z], 1.2, WHITE, 0.95)
    beam(out, [top[0], top[1] + 0.95, z - 1.1], [-46, yb + 0.95, z - 1.1], 0.05, STEEL)
    beam(out, [top[0], top[1] + 0.95, z + 1.1], [-46, yb + 0.95, z + 1.1], 0.05, STEEL)
  }
  // the name, on the fascia to the parvis
  signText(out, 'NANTERRE UNIVERSITÉ', 4, rise({ x: 4, z: -30.35 }) + 0.28, -30.45, 0.42, [0.14, 0.2, 0.42], { heading: Math.PI })

  // ---- the long platform canopies running east, on OSM's three platforms from the deck's edge
  const glassRoof: Rgb = hex('#65757a'), under: Rgb = hex('#c9c6bc')
  const canopy = (ax: number, az: number, bx: number, bz: number): void =>
    platformRoof(out, { x: ax, z: az }, { x: bx, z: bz }, 2.6, at, 4.6, glassRoof, under, 13)
  canopy(-30, -14, -112, -20.5)
  canopy(-30, -2, -112, -9)
  canopy(-30, 11, -112, 0)
}

/** The ogee gable: half-width at the fraction t up it, from the springing to the point. */
const ogee = (w: number, t: number): number => w * Math.pow(Math.cos((t * Math.PI) / 2), 0.72)

/**
 * A gable on the plane z, facing −z: a stone band up an ogee arch over x = cx, half-width w, from y0 to y1, red-framed glazing in it, the roof
 * running back from it `depth` as a barrel of the same section.
 */
function gable(out: MeshBuilder, cx: number, z: number, y0: number, y1: number, w: number, depth: number, stone: Rgb, roofC: Rgb, red: Rgb, glass: Rgb): void {
  const n = 12
  const P = (i: number, ww: number): [number, number] => {
    const t = i / n
    return [ogee(ww, t), y0 + (y1 - y0) * t]
  }
  const gl = surfaceTag('glass')
  const cop = surfaceTag('copper')
  const st = surfaceTag('stucco')
  for (let i = 0; i < n; i++) {
    const [a0, y] = P(i, w), [a1, yn] = P(i + 1, w)
    const b0 = ogee(w - 0.95, i / n), b1 = ogee(w - 0.95, (i + 1) / n)
    const yb = y0 + (y1 - 0.8 - y0) * (i / n), ybn = y0 + (y1 - 0.8 - y0) * ((i + 1) / n)
    for (const s of [-1, 1]) {
      // the glazing's sector and the band round it
      quad(out, [[cx, yb, z - 0.02], [cx + s * b0, yb, z - 0.02], [cx + s * b1, ybn, z - 0.02], [cx, ybn, z - 0.02]], [0, 0, -1], glass, gl)
      quad(out, [[cx + s * b0, yb, z - 0.45], [cx + s * a0, y, z - 0.45], [cx + s * a1, yn, z - 0.45], [cx + s * b1, ybn, z - 0.45]], [0, 0.1, -1], stone, st)
      quad(out, [[cx + s * a0, y, z - 0.45], [cx + s * a0, y, z + 0.1], [cx + s * a1, yn, z + 0.1], [cx + s * a1, yn, z - 0.45]], [s * 0.7, 0.7, 0], shade(stone, 0.92), st)
      quad(out, [[cx + s * b0, yb, z - 0.45], [cx + s * b0, yb, z], [cx + s * b1, ybn, z], [cx + s * b1, ybn, z - 0.45]], [-s * 0.7, -0.5, 0], shade(stone, 0.75), st)
      // the barrel going back
      quad(out, [[cx + s * a0, y, z], [cx + s * a0, y, z + depth], [cx + s * a1, yn, z + depth], [cx + s * a1, yn, z]], [s * Math.cos(((i + 0.5) / n) * Math.PI / 2), Math.sin(((i + 0.5) / n) * Math.PI / 2), 0], roofC, cop)
    }
  }
  // the iron frames in the gable, red
  const bars = Math.round((2 * (w - 0.95)) / 1.25)
  for (let i = 1; i < bars; i++) {
    const x = -(w - 0.95) + ((2 * (w - 0.95)) * i) / bars
    const t = (2 / Math.PI) * Math.acos(Math.min(1, Math.pow(Math.abs(x) / (w - 0.95), 1 / 0.72)))
    const y = y0 + (y1 - 0.8 - y0) * t
    block(out, cx + x - 0.06, cx + x + 0.06, z - 0.06, z, y0, y, red)
  }
  for (const f of [0.34, 0.68]) {
    const yy = y0 + (y1 - 0.8 - y0) * f
    const ww = ogee(w - 0.95, f)
    block(out, cx - ww, cx + ww, z - 0.06, z, yy - 0.06, yy + 0.06, red)
  }
  // the back of the barrel, closed
  quad(out, [[cx - w, y0, z + depth], [cx + w, y0, z + depth], [cx + ogee(w, 0.5), y0 + (y1 - y0) * 0.5, z + depth], [cx - ogee(w, 0.5), y0 + (y1 - y0) * 0.5, z + depth]], [0, 0, 1], stone, st)
  quad(out, [[cx - ogee(w, 0.5), y0 + (y1 - y0) * 0.5, z + depth], [cx + ogee(w, 0.5), y0 + (y1 - y0) * 0.5, z + depth], [cx, y1, z + depth], [cx, y1, z + depth]], [0, 0, 1], stone, st)
}

export function pontCardinet(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const at = (x: number, z: number): number => fit.groundAt?.(x, z) ?? g
  const st = surfaceTag('stucco'), brk = surfaceTag('brick'), gl = surfaceTag('glass'), conc = surfaceTag('concrete')
  const CREAM: Rgb = hex('#c9bf98'), TRIM: Rgb = hex('#d3ccb4'), BRICK: Rgb = hex('#8d7346'), RED: Rgb = hex('#8e2b23'), RGLASS: Rgb = hex('#47241f'), ZINC: Rgb = hex('#59625f'), COPPER: Rgb = hex('#6f917f'), DARK: Rgb = hex('#2b2d2e'), WHITE: Rgb = hex('#bebeb8'), GLASS: Rgb = hex('#4c5d63')
  const Z0 = -21            // the street front
  // a wall of bays on the plane z, facing −z: cream piers, brick panels, a red window in each
  const bays = (x0: number, x1: number, n: number, y0: number, y1: number, z = Z0): void => {
    block(out, x0, x1, z, z + 0.3, y0, y1, CREAM)
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const cx = x0 + w * (i + 0.5)
      block(out, cx - w * 0.36, cx + w * 0.36, z - 0.03, z + 0.1, y0 + 0.9, y1 - 0.55, BRICK)
      quad(out, [[cx - w * 0.2, y0 + 1.2, z - 0.05], [cx + w * 0.2, y0 + 1.2, z - 0.05], [cx + w * 0.2, y1 - 1, z - 0.05], [cx - w * 0.2, y1 - 1, z - 0.05]], [0, 0, -1], RGLASS, gl)
      for (const k of [-1, 0, 1]) block(out, cx + (k * w) / 5 - 0.04, cx + (k * w) / 5 + 0.04, z - 0.09, z - 0.03, y0 + 1.2, y1 - 1, RED)
      block(out, cx - w * 0.2, cx + w * 0.2, z - 0.09, z - 0.03, (y0 + y1) / 2 - 0.04, (y0 + y1) / 2 + 0.04, RED)
      block(out, cx - w * 0.26, cx + w * 0.26, z - 0.22, z + 0.05, y0 + 1, y0 + 1.2, TRIM)
    }
    block(out, x0 - 0.1, x1 + 0.1, z - 0.14, z + 0.1, y0, y0 + 0.75, shade(CREAM, 0.9))
    block(out, x0 - 0.15, x1 + 0.15, z - 0.22, z + 0.4, y1 - 0.55, y1, TRIM)
  }
  // the low wing on the viewer's left, its roof a low hip of zinc behind the parapet
  const wy = g + 5.4
  bays(-28, -14, 4, g, wy)
  block(out, -28, -14, Z0 + 0.3, -3, g - 0.5, wy - 0.05, CREAM)
  quad(out, [[-27.5, wy, Z0 + 0.5], [-14.5, wy, Z0 + 0.5], [-14.5, wy + 2.2, -9], [-27.5, wy + 2.2, -9]], [0, 0.9, -0.4], ZINC, FIXED)
  quad(out, [[-27.5, wy + 2.2, -9], [-14.5, wy + 2.2, -9], [-14.5, wy, -3], [-27.5, wy, -3]], [0, 0.9, 0.4], ZINC, FIXED)
  // the end of the wing
  block(out, -28.2, -27.9, Z0, -3, g, wy, CREAM)

  // the main block: a door-filled ground floor under the canopy, the great gable over it
  const cx = -6, w = 8.2
  const gy = g + 6.0
  block(out, cx - w, cx + w, Z0, -3, g - 0.5, gy, CREAM)
  quad(out, [[cx - 5.6, g + 0.3, Z0 - 0.04], [cx + 2.6, g + 0.3, Z0 - 0.04], [cx + 2.6, g + 4, Z0 - 0.04], [cx - 5.6, g + 4, Z0 - 0.04]], [0, 0, -1], DARK, gl)
  for (const x of [cx - 5.6, cx - 1.4, cx + 2.6]) block(out, x - 0.45, x + 0.45, Z0 - 0.18, Z0, g, g + 4.2, TRIM)
  quad(out, [[cx + 3.6, g + 0.9, Z0 - 0.04], [cx + 7, g + 0.9, Z0 - 0.04], [cx + 7, g + 3.9, Z0 - 0.04], [cx + 3.6, g + 3.9, Z0 - 0.04]], [0, 0, -1], RGLASS, gl)
  // the band of pierced ornament on the piers
  for (const x of [cx - w + 0.7, cx + w - 0.7]) block(out, x - 0.42, x + 0.42, Z0 - 0.06, Z0, g + 1.2, g + 3.8, BRICK)
  gable(out, cx, Z0 + 1.8, gy, g + 14.2, w, 15.5, TRIM, COPPER, RED, RGLASS)
  // the parapet's short wall between gable and canopy, and the pier heads with their urns
  block(out, cx - w - 0.3, cx + w + 0.3, Z0 + 1.2, Z0 + 2.1, gy - 0.5, gy + 0.25, TRIM)
  for (const s of [-1, 1]) prism(out, cx + s * (w + 0.1), Z0 + 1.2, gy + 0.2, gy + 1.5, 0.55, 6, TRIM, st, 0.4)
  // the flat concrete canopy over the doors, on its brackets
  const cz0 = Z0 - 3
  block(out, -17, 7.5, cz0, Z0 + 0.1, g + 4.4, g + 4.85, shade(TRIM, 0.96))
  block(out, -17.1, 7.6, cz0 - 0.1, cz0 + 0.1, g + 4.3, g + 5, shade(TRIM, 0.9))
  for (let x = -15; x <= 6; x += 4.2) {
    block(out, x - 0.14, x + 0.14, cz0 + 0.5, Z0, g + 4.05, g + 4.4, shade(TRIM, 0.85))
  }
  // the right wing, with the panel of the name on its parapet
  bays(2.2, 11, 2, g, g + 6.2)
  block(out, 2.2, 11, Z0 + 0.3, -3, g - 0.5, g + 6.15, CREAM)
  block(out, 3, 10.2, Z0 - 0.22, Z0 + 0.1, g + 6.15, g + 7.5, TRIM)
  block(out, 3.3, 9.9, Z0 - 0.26, Z0 - 0.1, g + 6.3, g + 7.3, hex('#8b6b45'))
  signText(out, 'PONT CARDINET', 6.6, g + 6.8, Z0 - 0.3, 0.46, [0.93, 0.89, 0.74], { heading: Math.PI })
  // the smaller gable behind it, on the same pattern
  gable(out, 8.2, -9.5, g + 6, g + 12, 5.2, 9.5, TRIM, COPPER, RED, RGLASS)
  block(out, 2.2, 13.4, -9.5, 0, g, g + 6, CREAM)

  // ---- the footbridge hall of the rebuilding, over the cutting behind the old station, white with its glass sides
  const hy = g + 6.2
  block(out, -24, 28.5, 1, 14, g - 0.8, g + 0.2, shade(WHITE, 0.72))
  quad(out, [[-24, g + 0.2, 1], [28.5, g + 0.2, 1], [28.5, hy, 1], [-24, hy, 1]], [0, 0, -1], GLASS, gl)
  quad(out, [[-24, g + 0.2, 14], [28.5, g + 0.2, 14], [28.5, hy, 14], [-24, hy, 14]], [0, 0, 1], GLASS, gl)
  for (let x = -24; x <= 28.5; x += 3.75) for (const z of [1, 14]) block(out, x - 0.08, x + 0.08, z - 0.08, z + 0.08, g + 0.2, hy, WHITE)
  for (const x of [-24, 28.5]) block(out, x - 0.1, x + 0.1, 1, 14, g + 0.2, hy, WHITE)
  block(out, -24.6, 29.1, 0.4, 14.6, hy, hy + 0.55, WHITE)
  for (const x of [-14, 1, 16]) quad(out, [[x - 4, hy + 0.62, 4], [x + 4, hy + 0.62, 4], [x + 4, hy + 0.62, 11], [x - 4, hy + 0.62, 11]], [0, 1, 0], GLASS, gl)
  // its stair towers, down to the platforms
  for (const x of [1.6, 15.6, 28.2]) {
    const yb = at(x, 18) + 0.8
    block(out, x - 1.9, x + 1.9, 14, 23, Math.min(yb, g - 0.5), hy - 1.6, WHITE)
    quad(out, [[x - 1.92, yb + 1, 18.5], [x - 1.92, yb + 1, 22.8], [x - 1.92, hy - 2, 22.8], [x - 1.92, hy - 2, 18.5]], [-1, 0, 0], GLASS, gl)
  }

  // ---- the platform roofs, OSM's four
  const roofC: Rgb = hex('#5f6f74'), under: Rgb = hex('#bfbcb0')
  for (const x of [2.8, 15.65, 28.2]) platformRoof(out, { x, z: 23 }, { x, z: 89.7 }, 3.1, at, 4.8, roofC, under, 11.5)
  platformRoof(out, { x: -24.5, z: 14.4 }, { x: -29.5, z: 59.8 }, 3.2, at, 4.8, roofC, under, 11.5)
  void conc; void brk
}
