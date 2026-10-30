/**
 * The monument kit: what the basilicas, domes, gates and statues of this folder share, beside the palace kit
 * (../palaces/common.ts: ranges, roofs, pediments, `fitted()`), which they import directly.
 *
 * What is here is what a church or a monument has and a palace does not: walls raised from a measured PLAN (a
 * chevet's radiating chapels, a Greek cross), DOMES turned on a profile — the Byzantine egg of Montmartre, the
 * Panthéon's lead cap — with their ribs and their drums ringed by arches or columns, a lantern, a bronze HORSEMAN,
 * a reclining LION. Everything is drawn in a builder's local frame (front −z), y up from the base.
 */
import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, classicalColumn, lathe, shade } from '../../kit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export type P2 = { x: number; z: number }

/** [x, z, x, z, …] as points. */
export const ring = (a: number[]): P2[] => Array.from({ length: a.length / 2 }, (_, i) => ({ x: a[2 * i], z: a[2 * i + 1] }))

const area = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}
/** The ring wound anticlockwise (seen from above, x east z north), so `edgeAt`'s normals face out. */
export const ccw = (r: P2[]): P2[] => (area(r) > 0 ? r : [...r].reverse())

/** The plan's walls from y0 to y1, each facing out, and a lid over them at y1 if asked. */
export function walls(out: MeshBuilder, plan: P2[], y0: number, y1: number, c: Rgb, lid?: Rgb): void {
  const r = ccw(plan)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 0.01) continue
    out.quad([[e.a.x, y0, e.a.z], [e.b.x, y0, e.b.z], [e.b.x, y1, e.b.z], [e.a.x, y1, e.a.z]], [e.nx, 0, e.nz], UV, c, FIXED)
  }
  if (lid) capPolygonWithHoles(out, [r], y1, lid, FIXED)
}

/** A moulded band round the plan at y (a string course, a cornice): `d` proud of the walls, `h` tall. */
export function band(out: MeshBuilder, plan: P2[], y: number, h: number, d: number, c: Rgb): void {
  const r = ccw(plan)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 0.3) continue
    boxAlong(out, e.mid.x + e.nx * d / 2, y + h / 2, e.mid.z + e.nz * d / 2, e.L / 2 + d / 2, h / 2, d / 2, e.heading, c)
  }
}

/** Round-headed openings along every wall of the plan at least `min` long, `pitch` apart: dark insets on the face. */
export function archesOn(out: MeshBuilder, plan: P2[], y: number, w: number, h: number, pitch: number, c: Rgb, min = 3): void {
  const r = ccw(plan)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < min) continue
    const n = Math.max(1, Math.floor(e.L / pitch))
    for (let k = 0; k < n; k++) {
      const u = (e.L * (k + 0.5)) / n
      archAlong(out, e.a.x + e.tx * u + e.nx * 0.06, e.a.z + e.tz * u + e.nz * 0.06, e.tx, e.tz, e.nx, e.nz, y, w, h, c)
    }
  }
}

/** One round-headed opening, flat on a face whose along-direction is (tx, tz) and normal (nx, nz), centred at (x, z). */
export function archAlong(out: MeshBuilder, x: number, z: number, tx: number, tz: number, nx: number, nz: number,
  y0: number, w: number, h: number, c: Rgb): void {
  const r = w / 2
  const spring = y0 + Math.max(0, h - r)
  const P = (u: number, y: number): [number, number, number] => [x + tx * u, y, z + tz * u]
  const n: [number, number, number] = [nx, 0, nz]
  out.quad([P(-r, y0), P(r, y0), P(r, spring), P(-r, spring)], n, UV, c, FIXED)
  const seg = 4
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    out.quad([P(0, spring), P(Math.cos(a0) * r, spring + Math.sin(a0) * r), P(Math.cos(a1) * r, spring + Math.sin(a1) * r), P(0, spring)], n, UV, c, FIXED)
  }
}

/**
 * A ring of round-headed openings round a drum of radius `r` at (cx, cz): `n` of them, `w` wide and `h` to the crown,
 * from y0, laid flat on the drum a little proud of it; with a colonnette between each pair if `posts`.
 */
export function drumArches(out: MeshBuilder, cx: number, cz: number, r: number, y0: number, n: number, w: number, h: number,
  c: Rgb, posts?: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    const nx = Math.sin(a)
    const nz = Math.cos(a)
    archAlong(out, cx + nx * (r + 0.05), cz + nz * (r + 0.05), nz, -nx, nx, nz, y0, w, h, c)
    if (posts) {
      const b = (i / n) * Math.PI * 2
      prism(out, cx + Math.sin(b) * (r + 0.25), cz + Math.cos(b) * (r + 0.25), y0, y0 + h, 0.22, 6, posts, FIXED)
    }
  }
}

/**
 * A DOME turned on a profile: from radius r at y0 up h, its section given by `shape(t)` → radius fraction for t in
 * 0..1 of the height (1 at the foot, ~0 at the crown). `ribs` raised bands up it in a lighter shade.
 */
export function domeOf(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number, c: Rgb,
  shape: (t: number) => number, o: { sides?: number; steps?: number; ribs?: number; rib?: Rgb } = {}): void {
  const steps = o.steps ?? 12
  const sides = o.sides ?? 24
  const prof: [number, number][] = []
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    prof.push([Math.max(0.02, r * shape(t)), y0 + h * t])
  }
  lathe(out, cx, cz, prof, sides, c)
  if (o.ribs) {
    const rc = o.rib ?? shade(c, 1.06)
    for (let i = 0; i < o.ribs; i++) {
      const a = (i / o.ribs) * Math.PI * 2
      // (two courses to a beam: a rib reads as a line, and it is most of a dome's triangles)
      for (let k = 0; k < steps - 1; k += 2) {
        const [r0, ya] = prof[k]
        const [r1, yb] = prof[Math.min(steps - 1, k + 2)]
        beam(out, [cx + Math.sin(a) * (r0 + 0.05), ya, cz + Math.cos(a) * (r0 + 0.05)],
          [cx + Math.sin(a) * (r1 + 0.05), yb, cz + Math.cos(a) * (r1 + 0.05)], Math.max(0.12, r * 0.022), rc)
      }
    }
  }
}

/** The Byzantine egg of Montmartre: straight-sided at the foot, swelling a little, then drawn up to a blunt point. */
export const egg = (t: number): number => {
  if (t < 0.18) return 1 + 0.04 * Math.sin((t / 0.18) * Math.PI / 2)
  const u = Math.min(1, (t - 0.18) / 0.82)
  return 1.04 * Math.max(0, Math.cos(u * Math.PI / 2)) ** 0.85
}
/** A classical dome's section: a quarter circle (the Panthéon's, the Invalides'), flattened by `k` < 1. */
export const quarter = (t: number): number => Math.cos(Math.asin(Math.min(1, t)))

/** A ring of `n` Corinthian columns round (cx, cz) at radius r, from y0 to y1. */
export function peristyle(out: MeshBuilder, cx: number, cz: number, r: number, y0: number, y1: number, n: number, cr: number, c: Rgb,
  tier: 'near' | 'mid' | 'far' = 'mid'): void {
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    classicalColumn(out, cx + Math.sin(a) * r, cz + Math.cos(a) * r, y0, y1, cr, c, { order: 'corinthian', tier, heading: a })
  }
}

/** A balustrade round a circle: plinth, rail and posts. */
export function roundBalustrade(out: MeshBuilder, cx: number, cz: number, r: number, y: number, c: Rgb, h = 1.1, n = 32): void {
  prism(out, cx, cz, y, y + 0.22, r + 0.15, n, c, FIXED, r + 0.15, false)
  prism(out, cx, cz, y + h - 0.18, y + h, r + 0.15, n, c, FIXED, r + 0.15, false)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    box(out, cx + Math.sin(a) * r, y + h / 2, cz + Math.cos(a) * r, 0.09, h / 2 - 0.15, 0.09, c, FIXED)
  }
}

/**
 * A bronze HORSEMAN, life-and-a-half size (the horse ~3.3 m long), standing at (x, y, z) and facing `heading` (the
 * kit's sense: 0 faces +z, π faces −z). `s` scales it; `arm` raises the rider's sword or banner.
 */
export function horseman(out: MeshBuilder, x: number, y: number, z: number, heading: number, c: Rgb, s = 1, arm = true): void {
  const q = new MeshBuilder()
  const L = (a: [number, number, number], b: [number, number, number], r: number): void => beam(q, a, b, r, c)
  // the body, neck and head, facing +z
  L([0, 1.55, -0.95], [0, 1.65, 0.85], 0.42)
  L([0, 1.85, 0.8], [0, 2.55, 1.35], 0.24)
  L([0, 2.55, 1.35], [0, 2.3, 1.85], 0.16)
  // the legs, one fore lifted, and the tail
  L([-0.22, 1.3, 0.75], [-0.22, 0, 0.8], 0.11)
  L([0.22, 1.3, 0.75], [0.22, 0.75, 1.15], 0.11)
  L([0.22, 0.75, 1.15], [0.22, 0.45, 0.95], 0.1)
  for (const sx of [-0.22, 0.22]) L([sx, 1.3, -0.8], [sx, 0, -0.95], 0.12)
  L([0, 1.75, -1.05], [0, 0.9, -1.35], 0.1)
  // the rider: legs astride, the body, the head, the arm raised
  for (const sx of [-0.38, 0.38]) L([sx, 2.0, 0.05], [sx, 1.35, 0.25], 0.1)
  L([0, 1.95, 0], [0, 2.85, 0.05], 0.24)
  box(q, 0, 3.05, 0.05, 0.13, 0.16, 0.14, c, FIXED)
  if (arm) {
    L([0.25, 2.65, 0.05], [0.45, 3.25, 0.35], 0.07)
    L([0.45, 3.25, 0.35], [0.5, 4.1, 0.55], 0.04)
  }
  const co = Math.cos(heading)
  const si = Math.sin(heading)
  const base = out.positions.length / 3
  for (let i = 0; i < q.positions.length; i += 3) {
    const px = q.positions[i] * s
    const pz = q.positions[i + 2] * s
    out.positions.push(x + px * co + pz * si, y + q.positions[i + 1] * s, z - px * si + pz * co)
    const nx = q.normals[i]
    const nz = q.normals[i + 2]
    out.normals.push(nx * co + nz * si, q.normals[i + 1], -nx * si + nz * co)
  }
  for (const u of q.uvs) out.uvs.push(u)
  for (const col of q.colors) out.colors.push(col)
  for (const i of q.indices) out.indices.push(base + i)
}

/** A standing figure in bronze or stone, `h` tall, at (x, y, z): a draped mass, shoulders, a head. */
export function figure(out: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb): void {
  prism(out, x, z, y, y + h * 0.78, h * 0.15, 7, c, FIXED, h * 0.11)
  box(out, x, y + h * 0.72, z, h * 0.16, h * 0.06, h * 0.09, c, FIXED)
  prism(out, x, z, y + h * 0.8, y + h, h * 0.06, 6, c, FIXED, h * 0.045)
}

export { FIXED, UV }

/**
 * An ARCHWAY through a block: the vault of an opening centred at x = xc, `hw` wide each side, through z0..z1, springing
 * at `spring` into a semicircle and filled above it up to `top` — stacked thin slices, so the opening is real (the
 * Arc de Triomphe's method). The piers either side are the caller's.
 */
export function vault(out: MeshBuilder, xc: number, hw: number, z0: number, z1: number, spring: number, top: number, c: Rgb, slices = 12): void {
  for (let i = 0; i < slices; i++) {
    const y0 = spring + (hw * i) / slices
    const y1 = spring + (hw * (i + 1)) / slices
    const w = hw * Math.sqrt(Math.max(0, 1 - ((y0 + y1) / 2 - spring) ** 2 / (hw * hw)))
    if (hw - w > 0.01) {
      block(out, xc - hw, xc - w, z0, z1, y0, y1, c)
      block(out, xc + w, xc + hw, z0, z1, y0, y1, c)
    }
  }
  if (top > spring + hw) block(out, xc - hw, xc + hw, z0, z1, spring + hw, top, c)
}

/** A rusticated band course across a face at z = plane (facing −z if `s` < 0, +z if > 0): a slim groove every `pitch` from y0 to y1. */
export function rustication(out: MeshBuilder, x0: number, x1: number, plane: number, s: number, y0: number, y1: number, pitch: number, c: Rgb): void {
  for (let y = y0 + pitch; y < y1 - 0.05; y += pitch) block(out, x0, x1, Math.min(plane, plane + s * 0.04), Math.max(plane, plane + s * 0.04), y - 0.05, y + 0.05, c)
}

/**
 * A half-round APSE at (cx, cz), its round end toward +z: walls of radius r from y0 to the eaves, a half-cone roof up
 * to `ridge` at the centre, a tall window in every other bay.
 */
export function apseWall(out: MeshBuilder, cx: number, cz: number, r: number, y0: number, eaves: number, ridge: number,
  wall: Rgb, roofC: Rgb, glass: Rgb, n = 10): void {
  const P = (i: number, rr: number): P2 => {
    const a = -Math.PI / 2 + (i / n) * Math.PI
    return { x: cx + Math.sin(a) * rr, z: cz + Math.cos(a) * rr }
  }
  for (let i = 0; i < n; i++) {
    const a = P(i, r)
    const b = P(i + 1, r)
    const mx = (a.x + b.x) / 2 - cx
    const mz = (a.z + b.z) / 2 - cz
    const l = Math.hypot(mx, mz) || 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, eaves, b.z], [a.x, eaves, a.z]], [mx / l, 0, mz / l], UV, wall, FIXED)
    const a2 = P(i, r + 0.4)
    const b2 = P(i + 1, r + 0.4)
    out.quad([[a2.x, eaves, a2.z], [b2.x, eaves, b2.z], [cx, ridge, cz], [cx, ridge, cz]], [mx / l, 0.8, mz / l], UV, roofC, FIXED)
    if (i % 2 === 1 && eaves - y0 > 5) {
      const ang = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI
      const m = P(i + 0.5, r + 0.06)
      const ex = Math.cos(ang)
      const ez = -Math.sin(ang)
      out.quad([[m.x - ex * 0.8, y0 + (eaves - y0) * 0.22, m.z - ez * 0.8], [m.x + ex * 0.8, y0 + (eaves - y0) * 0.22, m.z + ez * 0.8],
        [m.x + ex * 0.8, y0 + (eaves - y0) * 0.8, m.z + ez * 0.8], [m.x - ex * 0.8, y0 + (eaves - y0) * 0.8, m.z - ez * 0.8]], [mx / l, 0, mz / l], UV, glass, FIXED)
    }
  }
}

/**
 * `fitted()` for a building on a slope (wave 2: Saint-Étienne on the Montagne Sainte-Geneviève, the churches and
 * mills of the Butte): the loader seats a model at the LOWEST ground under it, so where the front's street is
 * higher than the back the portal sinks under the pavement. As `church()` does (render/landmarks/church.ts), the
 * whole drawing is lifted to the front's grade (less the half metre the loader sinks every model) onto a plain stone
 * plinth — the exposed basement on the downhill side. On level ground it is `fitted()` exactly.
 */
export function graded(out: MeshBuilder, fit: Fit, hx: number, hz: number, draw: (q: MeshBuilder) => void, plinth: Rgb = [0.6, 0.58, 0.54]): void {
  const lift = Math.max(0, (fit.grade ?? 0) - 0.5)
  const p0 = out.positions.length
  fitted(out, fit, hx, hz, draw)
  if (lift < 0.8) return
  for (let i = p0 + 1; i < out.positions.length; i += 3) out.positions[i] += lift
  const base = fit.ring && fit.ring.length >= 3 ? fit.ring : ring([-fit.hx, -fit.hz, fit.hx, -fit.hz, fit.hx, fit.hz, -fit.hx, fit.hz])
  walls(out, base, 0, lift + 0.05, plinth, plinth)
}
