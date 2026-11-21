import { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { archedPane, block, hex, pane, pediment, placed, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Fontaine des Innocents (Goujon and Lescot, 1549), in the square at Les Halles (PARIS_EXPAND §5 B): a
 * square Renaissance pavilion on a stepped base with water falling down its steps, each face an open arch
 * between paired Corinthian pilasters, a triangular pediment over each, a small dome of scales on top.
 *
 * Local frame: centred, faces ±x and ±z alike.
 */
export function fontaineInnocents(out: MeshBuilder): void {
  const stone = hex('#e3dac6')
  const water: Rgb = [0.4, 0.55, 0.62]
  // the stepped basin with its cascades, four tiers
  for (let i = 0; i < 4; i++) {
    const r = 9 - i * 1.4
    block(out, -r, r, -r, r, i * 0.55, (i + 1) * 0.55, shade(stone, 0.9 + i * 0.02))
    // a skin of water down each step's face
    for (const [x0, x1, z0, z1] of [[-r, r, -r - 0.02, -r], [-r, r, r, r + 0.02], [-r - 0.02, -r, -r, r], [r, r + 0.02, -r, r]]) {
      block(out, x0, x1, z0, z1, i * 0.55, (i + 1) * 0.55, water)
    }
  }
  const b0 = 2.2
  const w = 4.2
  // the pavilion: four corner piers, an arch between each pair, the entablature, the pediment on each face
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) block(out, sx * w - 1, sx * w + 1, sz * w - 1, sz * w + 1, b0, b0 + 9, stone)
  for (let k = 0; k < 4; k++) {
    const f = new MeshBuilder()
    // on a −z face at z = −w: the arch's reveal in shadow, paired pilasters, a relief of a nymph each side
    archedPane(f, -0.05, 0, b0, 6.4, 8.2, [0.34, 0.33, 0.31])
    for (const x of [-3.9, -3.4, 3.4, 3.9]) pane(f, '-z', -0.12, x, b0, 0.35, 8.5, shade(stone, 1.05), 0.02)
    block(f, -w - 1.1, w + 1.1, -1.2, 0.2, b0 + 9, b0 + 10.2, shade(stone, 1.03))
    pediment(f, -w - 1.1, w + 1.1, -1.2, b0 + 10.2, 2.4, 1.4, stone)
    placed(out, f, (k * Math.PI) / 2, Math.sin((k * Math.PI) / 2) * -w, Math.cos((k * Math.PI) / 2) * -w)
  }
  // the dome of scales, and its lantern
  prism(out, 0, 0, b0 + 10.2, b0 + 13.5, w + 0.5, 16, hex('#8a8f8c'), FIXED, 0.6)
  prism(out, 0, 0, b0 + 13.5, b0 + 14.6, 0.6, 8, stone, FIXED, 0.2)
}

/**
 * The Fontaine Saint-Michel (Davioud, 1860), closing the Place Saint-Michel: a triumphal arch as a wall
 * fountain — four red marble columns carrying bronze chimeras' plinths, the archangel slaying the devil in the
 * great niche, the dragons spouting into the basin below, the attic with its statues. Stands against the
 * building behind; the front faces −z.
 */
export function fontaineSaintMichel(out: MeshBuilder): void {
  const stone = hex('#e1d7c2')
  const red: Rgb = [0.58, 0.28, 0.24]
  const bronze: Rgb = [0.3, 0.34, 0.29]
  const water: Rgb = [0.4, 0.55, 0.62]
  // the basin and its stepped cascade
  block(out, -9, 9, -6, 0, 0, 0.6, shade(stone, 0.92))
  block(out, -8.5, 8.5, -5.5, -0.3, 0.55, 0.6, water)
  block(out, -5, 5, -2.8, 0, 0.6, 1.8, shade(stone, 0.95))
  block(out, -4.8, 4.8, -2.82, -2.8, 0.6, 1.8, water)
  // the back wall, the full height of the building, and the four red columns before it
  block(out, -8, 8, -0.8, 0, 0, 26, stone)
  for (const x of [-6.4, -4, 4, 6.4]) {
    prism(out, x, -1.6, 2, 15, 0.55, 12, red, FIXED, 0.5)
    box(out, x, 15.3, -1.6, 0.75, 0.3, 0.75, stone, FIXED)
    // a bronze chimera on the column's entablature
    box(out, x, 16.8, -1.6, 0.5, 0.8, 0.9, bronze, FIXED)
  }
  block(out, -8, 8, -2.4, 0, 15.6, 17.2, shade(stone, 1.03))
  // the niche: the arch in shadow and Saint Michael over the devil, in bronze
  const f = new MeshBuilder()
  archedPane(f, -0.85, 0, 2.2, 5.2, 12.2, [0.3, 0.29, 0.27])
  placed(out, f, 0, 0, 0)
  box(out, 0, 5.3, -1.4, 0.9, 1.2, 0.8, bronze, FIXED)
  prism(out, 0, -1.4, 6.5, 10.5, 0.6, 8, bronze, FIXED, 0.35)
  box(out, 0.9, 10.2, -1.4, 0.9, 0.12, 0.05, bronze, FIXED)                                  // the raised sword, and a wing
  box(out, -0.7, 9.6, -1.2, 0.1, 1.4, 0.6, bronze, FIXED)
  // the dragons spouting either side of the rock
  for (const x of [-3, 3]) box(out, x, 2.2, -2.3, 0.6, 0.45, 0.9, bronze, FIXED)
  // the attic and its four statues, the pediment
  block(out, -7.6, 7.6, -1.6, 0, 17.2, 22, stone)
  for (const x of [-6.4, -4, 4, 6.4]) prism(out, x, -1.9, 17.2, 20.3, 0.45, 8, shade(stone, 0.85), FIXED, 0.35)
  pediment(out, -8, 8, -1.8, 22, 3.4, 1.8, stone)
}

/**
 * The Flamme de la Liberté (1987), on the Place de l'Alma over the tunnel's mouth: the full-size gilded flame of the
 * Statue of Liberty's new torch on a green-grey marble drum, standing on a low four-pointed star of black granite
 * (Commons "Sculpture pont de l'alma Paris FRA.jpg" and "Paris Flamme de la Liberté 4.jpg", read 2026-11-20).
 *
 * The flame is not symmetric: a smooth bulb on a narrow foot, fullest on one side (+x), with one great tongue
 * sweeping up and out the other way (−x) to a hooked tip, two smaller tongues on the crown, and S-curved licks in
 * low relief winding up the bulb. Every gilt surface is one smooth grid (per-vertex normals), not flat facets.
 * Local frame: centred, the star's arms on ±x and ±z. Placed by the manifest's baseY on the tunnel lid.
 */
const FL = {
  starH: 1.2, starTop: 1.45, starArm: 4.6, starIn: 1.9, starTip: 0.12, // the granite star: height, top, arm tips, re-entrant corners
  drumR: 1.05, drumH: 2.3,                                             // the marble drum on it
  bodyH: 2.95, bodyR: 1.85, bodyFoot: 0.85, bodyFull: 0.5, // the bulb: height, widest radius, foot radius, where (0-1 up) it is widest
  bodySwell: 0.14, bodyLean: 0.55,                       // fuller on +x by this share; the crown drifts this far to −x
  licks: 7,                                              // S-curved licks in relief on the bulb
}

type P5 = [number, number, number, number, number] // x, y, z, width, thickness

/** Catmull-Rom through control points, n samples. */
function spline(cs: P5[], n: number): P5[] {
  const out: P5[] = []
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * (cs.length - 1), i = Math.min(cs.length - 2, Math.floor(t)), f = t - i
    const a = cs[Math.max(0, i - 1)], b = cs[i], c = cs[i + 1], d = cs[Math.min(cs.length - 1, i + 2)]
    out.push(b.map((_, q) => 0.5 * (2 * b[q] + (c[q] - a[q]) * f + (2 * a[q] - 5 * b[q] + 4 * c[q] - d[q]) * f * f
      + (3 * b[q] - a[q] - 3 * c[q] + d[q]) * f * f * f)) as P5)
  }
  return out
}

/**
 * A smooth surface from rings of points (each ring a closed loop): quads between neighbouring rings with normals
 * taken per vertex from the grid's own slopes, turned to face away from their ring's centre.
 */
function rings(out: MeshBuilder, R: [number, number, number][][], colour: Rgb, tag: number): void {
  const nv = R.length, nu = R[0].length
  const N = R.map((ring, j) => {
    const c = ring.reduce((s, p) => [s[0] + p[0] / nu, s[1] + p[1] / nu, s[2] + p[2] / nu], [0, 0, 0])
    return ring.map((p, i) => {
      const pu = ring[(i + 1) % nu], mu = ring[(i + nu - 1) % nu], pv = R[Math.min(nv - 1, j + 1)][i], mv = R[Math.max(0, j - 1)][i]
      const du = [pu[0] - mu[0], pu[1] - mu[1], pu[2] - mu[2]], dv = [pv[0] - mv[0], pv[1] - mv[1], pv[2] - mv[2]]
      let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]]
      const l = Math.hypot(n[0], n[1], n[2])
      if (l < 1e-9) n = [p[0] - c[0], p[1] - c[1] + 1e-3, p[2] - c[2]]
      if (n[0] * (p[0] - c[0]) + n[1] * (p[1] - c[1]) + n[2] * (p[2] - c[2]) < 0) n = n.map((q) => -q)
      const m = Math.hypot(n[0], n[1], n[2]) || 1
      return n.map((q) => q / m) as [number, number, number]
    })
  })
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu; i++) {
    const k = (i + 1) % nu, ns = [N[j][i], N[j][k], N[j + 1][k], N[j + 1][i]]
    const avg: [number, number, number] = [0, 1, 2].map((q) => ns.reduce((s, n) => s + n[q], 0)) as [number, number, number]
    out.quad([R[j][i], R[j][k], R[j + 1][k], R[j + 1][i]], avg, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    const b = out.normals.length - 12
    ns.forEach((n, q) => { out.normals[b + q * 3] = n[0]; out.normals[b + q * 3 + 1] = n[1]; out.normals[b + q * 3 + 2] = n[2] })
  }
}

/** A surface of revolution, smooth-shaded: (r, y) profile, `sides` round. */
function smoothLathe(out: MeshBuilder, prof: [number, number][], sides: number, colour: Rgb, tag = FIXED): void {
  rings(out, prof.map(([r, y]) => Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2
    return [Math.sin(a) * r, y, Math.cos(a) * r] as [number, number, number]
  })), colour, tag)
}

/**
 * A tongue of flame: a lens-sectioned tube along a spline through (x, y, z, width, thickness) points, the width
 * lying across `out` (the direction away from the flame's axis) and the thickness along it, so a lick laid on the
 * bulb lies flat on it and a free tongue reads as a curved blade. Ends taper to a point.
 */
function tongue(out: MeshBuilder, cs: P5[], colour: Rgb, tag: number, n = 16, sides = 10): void {
  const pts = spline(cs, n)
  rings(out, pts.map((p, k) => {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)]
    const T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(T[0], T[1], T[2]) || 1
    const t = T.map((q) => q / tl)
    let o = [p[0], 0, p[2]]; const ol = Math.hypot(o[0], o[2]); o = ol < 1e-3 ? [1, 0, 0] : o.map((q) => q / ol)
    let sd = [t[1] * o[2] - t[2] * o[1], t[2] * o[0] - t[0] * o[2], t[0] * o[1] - t[1] * o[0]]
    const sl = Math.hypot(sd[0], sd[1], sd[2]) || 1; sd = sd.map((q) => q / sl)
    const th = [sd[1] * t[2] - sd[2] * t[1], sd[2] * t[0] - sd[0] * t[2], sd[0] * t[1] - sd[1] * t[0]]
    const w = Math.max(0.004, p[3]), h = Math.max(0.004, p[4])
    return Array.from({ length: sides }, (_, i) => {
      const f = (i / sides) * Math.PI * 2, c = Math.cos(f), s = Math.sin(f)
      return [0, 1, 2].map((q) => p[q] + sd[q] * w * c + th[q] * h * s) as [number, number, number]
    })
  }), colour, tag)
}

export function flammeLiberte(out: MeshBuilder): void {
  const gold: Rgb = [0.93, 0.72, 0.28], MT = FIXED // (not 'metal': that draws standing-seam roof panels)
  const marble: Rgb = [0.24, 0.29, 0.27], granite: Rgb = [0.13, 0.13, 0.14]
  // the star: a flat top falling in eight facets to four long arms and four short re-entrant corners
  const ring8 = (r: (i: number) => number, y: number): [number, number, number][] =>
    Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return [Math.sin(a) * r(i), y, Math.cos(a) * r(i)] })
  const top = ring8(() => FL.starTop, FL.starH), foot = ring8((i) => (i % 2 ? FL.starIn : FL.starArm), 0)
  foot.forEach((q, i) => { if (i % 2 === 0) q[1] = FL.starTip })
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8, a = ((i + 0.5) / 8) * Math.PI * 2
    out.quad([foot[i], foot[j], top[j], top[i]], [Math.sin(a), 0.8, Math.cos(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], granite, FIXED)
    out.quad([top[i], top[j], [0, FL.starH, 0], [0, FL.starH, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], granite, FIXED)
  }
  // the drum, moulded at its foot and head, the head stepping in to the flame's collar
  const y0 = FL.starH, R = FL.drumR, H = FL.drumH
  smoothLathe(out, [[0, y0], [R + 0.2, y0], [R + 0.2, y0 + 0.18], [R + 0.05, y0 + 0.3], [R, y0 + 0.4], [R, y0 + H - 0.4],
    [R + 0.12, y0 + H - 0.3], [R + 0.14, y0 + H - 0.08], [R + 0.02, y0 + H], [FL.bodyFoot + 0.05, y0 + H + 0.08],
    [FL.bodyFoot + 0.05, y0 + H + 0.18], [0, y0 + H + 0.18]], 28, marble)

  // the bulb: a teardrop on a narrow foot, fuller on +x, its crown drifting to −x
  const fb = y0 + H + 0.15, BH = FL.bodyH, BR = FL.bodyR, BF = FL.bodyFoot, full = FL.bodyFull
  const rAt = (v: number): number => v <= full
    ? BF + (BR - BF) * Math.pow(Math.sin((Math.PI / 2) * (v / full)), 0.75)
    : BR * Math.sqrt(Math.max(0, 1 - Math.pow((v - full) / (1 - full), 2)))
  const body = (u: number, v: number, lift = 0): [number, number, number] => {
    const a = u * Math.PI * 2, k = (1 + FL.bodySwell * Math.sin(a)) * rAt(v) + lift
    return [Math.sin(a) * k - FL.bodyLean * v * v, fb + BH * v, Math.cos(a) * k]
  }
  const NV = 18, NU = 32
  rings(out, Array.from({ length: NV + 1 }, (_, j) => {
    const v = j / NV
    return Array.from({ length: NU }, (_, i) => body(i / NU, Math.min(v, 0.999)))
  }), gold, MT)

  // the great tongue, out of the bulb's −x shoulder: fat at its root, a thin neck, a hooked tip high on −x
  const L = fb
  tongue(out, [[-0.2, L + 1.2, 0, 1.3, 1.15], [-1.05, L + 1.85, 0.05, 1.1, 0.95], [-1.75, L + 2.5, 0.1, 0.66, 0.58],
    [-2.15, L + 3.05, 0.1, 0.38, 0.36], [-2.3, L + 3.5, 0.05, 0.34, 0.34], [-2.2, L + 3.85, 0, 0.2, 0.2],
    [-2.05, L + 3.98, 0, 0.0, 0.0]], gold, MT, 22, 14)
  // the two crown tongues, pointed, leaning a little apart
  tongue(out, [[-0.35, L + 2.3, 0.15, 0.7, 0.5], [-0.3, L + 2.95, 0.2, 0.5, 0.36], [-0.18, L + 3.35, 0.2, 0.24, 0.18],
    [-0.26, L + 3.6, 0.15, 0.0, 0.0]], gold, MT, 14, 10)
  tongue(out, [[0.3, L + 2.25, -0.25, 0.65, 0.48], [0.4, L + 2.85, -0.3, 0.46, 0.34], [0.55, L + 3.2, -0.3, 0.22, 0.16],
    [0.7, L + 3.42, -0.28, 0.0, 0.0]], gold, MT, 14, 10)
  // the licks: S-curved blades in low relief, winding up the bulb from its lower flank, tips lifting free
  for (let k = 0; k < FL.licks; k++) {
    const u0 = k / FL.licks + 0.03, dir = k % 2 ? 1 : -1, v0 = 0.12 + 0.06 * (k % 3), v1 = 0.78 + 0.07 * ((k * 2) % 3)
    const cs: P5[] = []
    for (let q = 0; q <= 5; q++) {
      const s = q / 5, v = v0 + (v1 - v0) * s
      const u = u0 + dir * (0.06 * s + 0.035 * Math.sin(Math.PI * s * 1.6))
      const [x, y, z] = body(u, v, 0.03 + 0.16 * s * s * s)
      const w = 0.5 * Math.sin(Math.PI * (0.18 + 0.82 * s)) + 0.02
      cs.push([x, y, z, w, 0.07 + 0.04 * (1 - s)])
    }
    tongue(out, cs, gold, MT, 14, 8)
  }
}
