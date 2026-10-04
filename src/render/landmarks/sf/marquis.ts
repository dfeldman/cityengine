/**
 * The San Francisco Marriott Marquis (Zeidler Partnership with DMJM, 1989), 780 Mission at Fourth (133 m, 39 storeys):
 * "the jukebox", Herb Caen's name for its fan-shaped glass windows. The builder below (2026-10-03) replaces a box
 * ziggurat with dark slits that the owner found looked nothing like it; docs/MARRIOTT-MARQUIS.md has the first brief.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { faceBand, towerRing, type Face } from '../tower.ts'
import { edgeAt, offsetRing } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

const ROOF: Rgb = [0.45, 0.45, 0.46]

/** The plausible height, in case the manifest's is missing or off. */
const heightOf = (fit: Fit, h: number): number => (fit.height > 0.6 * h && fit.height < 1.6 * h ? fit.height : h)

/**
 * THE JUKEBOX, rebuilt 2026-10-03 (owner: "the extremely unique hotel near YB Center needs a custom model, the kit
 * model looks nothing like it … that one will take internet research"). From Commons photographs — "2017 San
 * Francisco Marriott Marquis Hotel from Yerba Buena Gardens.jpg" and "San Francisco Marriott Marquis.jpg" — and the
 * tower's own OSM part (way/436648569), whose plan is a CROSS: four arms on the diagonals round a core.
 *
 *   - the massing is that cross, cut back in steps: at each tier the plan is the cross clipped to a square round the
 *     core, the square shrinking as it rises, so every arm comes down in stairs toward its end — the ziggurat seen
 *     from every side, and on OSM's own outline rather than a box;
 *   - cream precast with small punched windows;
 *   - at every step, on the arm's end, the JUKEBOX LIGHT: a funnel of blue glass, half-round at the top and narrowing
 *     to a point below it, over a blue glass strip running down the face — the motif the nickname comes from;
 *   - the core's top storeys in blue glass, a great half-round arch on each face standing over the roof.
 */
const CREAM: Rgb = [0.86, 0.83, 0.76]
const JUKE: Rgb = [0.38, 0.55, 0.74]
const JUKE_DARK: Rgb = [0.3, 0.46, 0.64]

/** a ring clipped to the square |u|, |v| ≤ s about centre c, in axes (ax, az) / (−az, ax): Sutherland–Hodgman */
function clipSquare(ring: P2[], c: P2, ax: number, az: number, s: number): P2[] {
  const toUV = (p: P2): P2 => ({ x: (p.x - c.x) * ax + (p.z - c.z) * az, z: -(p.x - c.x) * az + (p.z - c.z) * ax })
  const fromUV = (q: P2): P2 => ({ x: c.x + q.x * ax - q.z * az, z: c.z + q.x * az + q.z * ax })
  let poly = ring.map(toUV)
  const planes: [(q: P2) => number][] = [[(q) => s - q.x], [(q) => s + q.x], [(q) => s - q.z], [(q) => s + q.z]]
  for (const [f] of planes) {
    const out: P2[] = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      const fa = f(a), fb = f(b)
      if (fa >= 0) out.push(a)
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }) }
    }
    poly = out
    if (poly.length < 3) return []
  }
  // drop the slivers clipping leaves
  const clean: P2[] = []
  for (const q of poly) { const l = clean[clean.length - 1]; if (!l || Math.hypot(q.x - l.x, q.z - l.z) > 0.3) clean.push(q) }
  if (clean.length > 2 && Math.hypot(clean[0].x - clean[clean.length - 1].x, clean[0].z - clean[clean.length - 1].z) < 0.3) clean.pop()
  return clean.length >= 3 ? clean.map(fromUV) : []
}

/** a half-round arch of glass standing on the roof edge `e`, radius `r`, its foot at `y` */
function arch(out: MeshBuilder, e: ReturnType<typeof edgeAt>, r: number, y: number): void {
  const m = e.mid
  const seg = 12
  const P = (a: number, rr: number): [number, number, number] => [m.x + e.tx * Math.cos(a) * rr + e.nx * 0.15, y + Math.sin(a) * rr, m.z + e.tz * Math.cos(a) * rr + e.nz * 0.15]
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI, a1 = ((k + 1) / seg) * Math.PI
    // the glass, both faces, and its frame: a ring of mullions out to the rim
    for (const s of [1, -1]) {
      const quad: [number, number, number][] = [P(a0, 0), P(a0, r), P(a1, r), P(a1, 0)]
      out.quad(s > 0 ? quad : [...quad].reverse(), [e.nx * s, 0, e.nz * s], [[0, 0], [0, 1], [1, 1], [1, 0]], k % 2 ? JUKE : JUKE_DARK, surfaceTag('glass'))
    }
    // the fan's ribs, radiating from the foot of the arch: what makes it the "jukebox"
    if (k > 0) for (const s2 of [1, -1]) {
      const a = P(a0, 0.6), b = P(a0, r)
      out.quad([a, b, [b[0] + e.nx * 0.1 * s2, b[1], b[2] + e.nz * 0.1 * s2], [a[0] + e.nx * 0.1 * s2, a[1], a[2] + e.nz * 0.1 * s2]], [e.tx, 0, e.tz], [[0, 0], [0, 1], [1, 1], [1, 0]], CREAM, 0)
    }
    const q: [number, number, number][] = [P(a0, r), P(a0, r + 0.5), P(a1, r + 0.5), P(a1, r)]
    for (const s of [1, -1]) out.quad(s > 0 ? q : [...q].reverse(), [e.nx * s, 0, e.nz * s], [[0, 0], [0, 1], [1, 1], [1, 0]], CREAM, 0)
  }
}

export function marriottMarquis_missionAt4th(out: MeshBuilder, fit: Fit): void {
  const H = heightOf(fit, 133)
  const ring = towerRing(fit)
  // the arms' axes: the edges' dominant direction, folded to a quarter turn
  let sx = 0, sz = 0
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); const a = Math.atan2(e.tz, e.tx) * 4; sx += Math.cos(a) * e.L; sz += Math.sin(a) * e.L }
  const th = Math.atan2(sz, sx) / 4
  const ax = Math.cos(th), az = Math.sin(th)
  // the core: the centre of the plan's area
  let A = 0, cx = 0, cz = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    const k = p.x * q.z - q.x * p.z
    A += k; cx += (p.x + q.x) * k; cz += (p.z + q.z) * k
  }
  const c = Math.abs(A) > 1e-6 ? { x: cx / (3 * A), z: cz / (3 * A) } : { x: 0, z: 0 }
  let D = 0
  for (const p of ring) D = Math.max(D, Math.abs((p.x - c.x) * ax + (p.z - c.z) * az), Math.abs(-(p.x - c.x) * az + (p.z - c.z) * ax))
  // ribbons of mirrored blue glass between bands of pale stone, floor after floor — not a punched grid (owner, 2026-10-03:
  // "rendering for the hotel around YB Center is still pretty bad"; the grey punched ziggurat read as an office block)
  const face: Face = { kind: 'bands', wall: CREAM, glass: [0.34, 0.47, 0.62], floor: 3.1, solid: 0.42, material: 'ashlar' }

  // the steps: each tier's half-size and top
  const TIERS = 6
  const tiers = Array.from({ length: TIERS }, (_, k) => ({ s: D * (1 - 0.115 * k) + 0.01, top: H * (0.36 + 0.1 * k) }))
  const coreTop = H * 0.9
  tiers[TIERS - 1].top = coreTop
  let y0 = 0
  const rings: P2[][] = []
  for (let k = 0; k < TIERS; k++) {
    const r = k === 0 ? ring : clipSquare(ring, c, ax, az, tiers[k].s)
    if (r.length < 3) break
    rings.push(r)
    faceBand(out, r, y0, tiers[k].top, face)
    capPolygon(out, r, tiers[k].top, ROOF, 0)
    // (the blue glass funnels once hung on every step's arm ends read as cones stuck on the walls: the jukebox is the
    // crown alone)
    y0 = tiers[k].top
  }
  // the crown: the core's top storeys in blue glass, a great arch on each face over the roof
  const core = rings[rings.length - 1]
  if (!core) return
  const crown = offsetRing(core, -1)
  faceBand(out, crown, coreTop, H, { kind: 'curtain', wall: JUKE, glass: JUKE, floor: 3.2, pitch: 1.8, solid: 0.08 })
  capPolygon(out, crown, H, ROOF, 0)
  for (let i = 0; i < crown.length; i++) {
    const e = edgeAt(crown, i)
    if (e.L < 10) continue
    arch(out, e, Math.min(e.L * 0.47, 13), H)
  }
}
