/**
 * Batch 3's shopping centres (2026-10-31; owner, 2026-10-30: "a high-rise or shopping center that is highly visible and unusual"). Bercy 2, Renzo Piano's steel whale on the motorway; Kenzo Tange's Grand Écran at the Place d'Italie, its great glass slope and white mast; Beaugrenelle's two rounded glass drums and the bridge between. Each in world metres (x east, z north), with `lat`, `lon`, `size`, `front: 180`.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, prism, shade } from '../../kit.ts'
import { edgeAt, roundRing } from '../../parts.ts'
import { faceBand, towerRing, type Face } from '../../tower.ts'
import { fitted, pts } from '../palaces/common.ts'
import { bandRound, lettersAlong } from '../palaces/showfront.ts'

type P2 = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/* --------------------------------------------------------------------------------------------------- Bercy 2 */

/** the shell's plan off the aerial (bercy2.jpg, 48.8262 2.3937, 0.36 m/px; x = (px − 500)·0.36 + 0.7, z = (500 − py)·0.36 + 9.1), the eave from the north round the nose to the south: the D of the motorway's curve */
const SHELL = ([[405, 268], [345, 285], [290, 315], [250, 350], [235, 395], [240, 440], [265, 485], [300, 530], [345, 575], [395, 612]] as const).map(([x, y]) => ({ x: (x - 500) * 0.36 + 0.7, z: (500 - y) * 0.36 + 9.1 }))
const HIP = { x: (575 - 500) * 0.36 + 0.7, z: (500 - 445) * 0.36 + 9.1 }

/**
 * BERCY 2 (Renzo Piano Building Workshop, 1987–90; Charenton, where the A4 meets the Périphérique; relation/2013390; 25 m): "une grande coque toute simple", a single shell of stainless steel panels dropped between motorway junctions, whose curve is the junction's. What half a million drivers a day see is a silver whale-back
 * running down from a high straight back to a long low eave, glazed under. The panels are drawn one by one so the steel catches the sun in facets. Plan off the aerial, the shell's fan swung from the back's middle; the service blocks along the rails to the north-east are plain.
 */
export function bercy2(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 94.1, 111.3, (q) => {
    const C = hex('#667074'), RIB = hex('#42494d'), H = 25.2, EAVE = 5.2
    // the back of the building: service blocks to the rails
    const back = pts([-17, 111.3, 94.1, -3.2, 48.1, -62.4, 26.9, -102.9, 18.2, -111.3, 7.3, -87.3, 44, -30, 20, 30, -14, 80])
    const wall: Face = { kind: 'blank', wall: hex('#65655f'), material: 'concrete' }
    faceBand(q, back, 0, 18, wall)
    capPolygon(q, back, 18, hex('#5c5e5b'), 0)
    // its plant on the roof
    for (let k = 0; k < 6; k++) block(q, 25 + k * 7 - 3, 25 + k * 7 + 3, 52 - k * 11 - 3, 52 - k * 11 + 3, 18, 21, hex('#6c6c67'))
    // ---- the shell: a fan from HIP to the eave, ring by ring
    const NS = SHELL.length - 1, seg = 4, rings = 7
    const B: P2[] = []
    for (let i = 0; i < NS; i++) for (let k = 0; k < seg; k++) {
      const t = k / seg, a = SHELL[i], b = SHELL[i + 1], p = SHELL[Math.max(0, i - 1)], n = SHELL[Math.min(NS, i + 2)]
      // (a Catmull-Rom through the plan's points, so the eave is a curve and not ten chords)
      const t2 = t * t, t3 = t2 * t
      const f = (v0: number, v1: number, v2: number, v3: number): number => 0.5 * ((2 * v1) + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (-v0 + 3 * v1 - 3 * v2 + v3) * t3)
      B.push({ x: f(p.x, a.x, b.x, n.x), z: f(p.z, a.z, b.z, n.z) })
    }
    B.push(SHELL[NS])
    const at = (i: number, r: number): [number, number, number] => {
      // the crown just back of the fan's centre: flat, then falling ever faster, a whale's back
      const e = B[i]
      const y = EAVE + (H - EAVE) * Math.cos(((r ** 1.25) * Math.PI) / 2) ** 0.8
      return [HIP.x + (e.x - HIP.x) * r, y, HIP.z + (e.z - HIP.z) * r]
    }
    const met = surfaceTag('metal')
    for (let i = 0; i + 1 < B.length; i++) {
      for (let j = 0; j < rings; j++) {
        const r0 = 0.04 + (j / rings) * 0.96, r1 = 0.04 + ((j + 1) / rings) * 0.96
        const a = at(i, r0), b = at(i + 1, r0), c = at(i + 1, r1), d = at(i, r1)
        const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2]
        let n: [number, number, number] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
        if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
        // (each panel a shade off the next: steel quilts)
        q.quad([a, b, c, d], n, UV, shade(C, 0.88 + hash(i, j) * 0.22), met)
      }
    }
    // the ribs down it, and three hoops of seams along it
    for (let i = 0; i < B.length; i += 2) {
      for (let j = 0; j < rings; j++) {
        const r0 = 0.04 + (j / rings) * 0.96, r1 = 0.04 + ((j + 1) / rings) * 0.96
        const a = at(i, r0), b = at(i, r1)
        strut(q, [a[0], a[1] + 0.05, a[2]], [b[0], b[1] + 0.05, b[2]], 0.18, 0.1, RIB, met, false)
      }
    }
    for (const j of [2, 4, 6]) {
      const r = 0.04 + (j / rings) * 0.96
      for (let i = 0; i + 2 < B.length; i += 2) {
        const a = at(i, r), b = at(i + 2, r)
        strut(q, [a[0], a[1] + 0.05, a[2]], [b[0], b[1] + 0.05, b[2]], 0.14, 0.1, RIB, met, false)
      }
    }
    // the long glazed wall under the eave, its columns, the eave's bright lip
    const G = hex('#465a64'), W = hex('#c5c9c8')
    for (let i = 0; i + 1 < B.length; i++) {
      const a = B[i], b = B[i + 1]
      const nx = (b.z - a.z), nz = -(b.x - a.x), l = Math.hypot(nx, nz) || 1, n: [number, number, number] = [nx / l, 0, nz / l]
      q.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, EAVE, b.z], [a.x, EAVE, a.z]], n, UV, i % 3 ? G : shade(G, 1.2), 0)
      q.quad([[a.x + n[0] * 0.3, EAVE - 0.4, a.z + n[2] * 0.3], [b.x + n[0] * 0.3, EAVE - 0.4, b.z + n[2] * 0.3], [b.x + n[0] * 0.3, EAVE + 0.2, b.z + n[2] * 0.3], [a.x + n[0] * 0.3, EAVE + 0.2, a.z + n[2] * 0.3]], n, UV, W, 0)
      if (i % 4 === 0) block(q, a.x - 0.3, a.x + 0.3, a.z - 0.3, a.z + 0.3, 0, EAVE, hex('#b5b8b6'))
    }
    // the shell's two open ends, walled
    const E0 = B[0], E1 = B[B.length - 1]
    for (const e of [E0, E1]) {
      const n = 6
      for (let k = 0; k < n; k++) {
        const a = at(e === E0 ? 0 : B.length - 1, 0.04 + (k / n) * 0.96), b = at(e === E0 ? 0 : B.length - 1, 0.04 + ((k + 1) / n) * 0.96)
        q.quad([[a[0], 0, a[2]], [b[0], 0, b[2]], [b[0], b[1], b[2]], [a[0], a[1], a[2]]], [e === E0 ? -0.7 : 0.7, 0, e === E0 ? 0.7 : -0.7], UV, hex('#7c8084'), 0)
      }
    }
    // the great name over the eave, toward the Périphérique
    lettersAlong(q, B[8], B[20], Math.hypot(B[20].x - B[8].x, B[20].z - B[8].z) / 2, EAVE + 0.4, 'BERCY 2', { h: 2, c: hex('#26313a'), wide: 0.7, d: 0.4, both: true })
  })
}

/* -------------------------------------------------------------------------------------------- Italie Deux, Grand Écran */

const ECRAN = pts([-48.1, -4.1, -36, -19.8, -30.1, -49.1, 15.1, -39.8, 12.9, -29.2, 48.1, -22, 35.7, 39, 6.9, 37.4, -12.8, 43.5, -15.5, 47.3, -19.4, 49.1])

/**
 * LE GRAND ÉCRAN D'ITALIE (Kenzo Tange, 1991–92; Italie Deux's front on the Place d'Italie; way/78470870): the one great modern thing on the Place. A white frame, its glass roof a huge slope up from the mall's roof to the Place, offices and terraces up the west side, and the white MAST on the Avenue d'Italie's edge carrying its crossbeam 55 m up (OSM's height), which
 * you see from the Avenue des Gobelins's top. Aerial 48.8295 2.3555, 0.38 m/px: glass slope (340–510, 210–330) on it; mast (520, 160–350). x east, z north: lat 48.830218 lon 2.35522. Everything white goes to a warm grey here: colours are linear and pale blows out.
 */
export function grandEcran(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 48.1, 49.1, (q) => {
    const W = hex('#a9a89f'), W2 = hex('#d2d1c8'), G = hex('#6d8e99'), R = hex('#b3b5ae'), DK = hex('#5d666a')
    const ring = ECRAN
    const eaves = 25
    const face: Face = { kind: 'bands', wall: W, glass: hex('#46555b'), solid: 0.46, floor: 3.6, material: 'concrete' }
    faceBand(q, ring, 0, eaves, face)
    capPolygon(q, ring, eaves, hex('#898a84'), 0)
    // the slope: glass, rising from the back (z ≈ −35) to the Place, in panes on a white grid
    const X0 = -33, X1 = 11, Z0 = -28, Z1 = 28, Y0 = eaves - 3, Y1 = 44, cols = 9, rows = 8
    const P = (u: number, v: number, lift = 0): [number, number, number] => [X0 + (X1 - X0) * u + (v - 0.5) * -8 * (u - 0.5), Y0 + (Y1 - Y0) * v + lift, Z0 + (Z1 - Z0) * v]
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const n: [number, number, number] = [0, Z1 - Z0, -(Y1 - Y0)]
      q.quad([P(i / cols, j / rows), P((i + 1) / cols, j / rows), P((i + 1) / cols, (j + 1) / rows), P(i / cols, (j + 1) / rows)], n, UV, shade(G, 0.92 + hash(i, j) * 0.16), surfaceTag('glass'))
    }
    for (let i = 0; i <= cols; i++) strut(q, P(i / cols, 0, 0.15), P(i / cols, 1, 0.15), 0.3, 0.3, W2, 0, false)
    for (let j = 0; j <= rows; j++) strut(q, P(0, j / rows, 0.15), P(1, j / rows, 0.15), 0.26, 0.26, W2, 0, false)
    // the front to the Place: a wall of glass under the slope's head, its white frame
    const f0 = P(0, 1), f1 = P(1, 1)
    q.quad([[f0[0], 0, f0[2]], [f1[0], 0, f1[2]], [f1[0], f1[1], f1[2]], [f0[0], f0[1], f0[2]]], [0, 0, 1], UV, G, surfaceTag('glass'))
    for (let i = 0; i <= cols; i += 3) { const p = P(i / cols, 1); block(q, p[0] - 0.5, p[0] + 0.5, p[2] - 0.4, p[2] + 0.4, 0, p[1], W2) }
    for (const y of [6, 14, 22, 30, 38]) strut(q, [f0[0], y, f0[2] + 0.1], [f1[0], y, f1[2] + 0.1], 0.3, 0.3, W2, 0, false)
    // its sides, closed
    for (const u of [0, 1]) {
      const a = P(u, 0), b = P(u, 1)
      q.quad([[a[0], Y0, a[2]], [b[0], Y0, b[2]], [b[0], b[1], b[2]], [a[0], a[1], a[2]]], [u ? 1 : -1, 0, 0], UV, shade(G, 0.86), surfaceTag('glass'))
    }
    // the terraces up the west side, each a floor's step in white with planting
    for (let k = 0; k < 4; k++) {
      const x0 = -42 + k * 2, y = eaves + k * 3
      block(q, x0, -33, -14, 30, y, y + 3, W)
      block(q, x0 - 0.4, -33, -14.4, 30.4, y + 2.8, y + 3.1, W2)
      block(q, x0, x0 + 1.4, -13, 29, y + 3.1, y + 3.5, hex('#4c6a3b'))
    }
    // ---- the mast: the white frame of two legs and its crossbeam, on the east side from the back to the Place (aerial: x 8–14, z −10–36)
    const mx0 = 13.5, mx1 = 21, mz0 = -12, mz1 = 31, top = 55
    for (const [x, z] of [[mx0, mz0], [mx1, mz0], [mx0, mz1], [mx1, mz1]] as const) block(q, x - 1, x + 1, z - 1, z + 1, 0, top, W2)
    for (let y = eaves; y < top - 1; y += 4.5) {
      block(q, mx0 - 1, mx1 + 1, mz0 - 0.6, mz0 + 0.6, y, y + 0.5, W)
      block(q, mx0 - 1, mx1 + 1, mz1 - 0.6, mz1 + 0.6, y, y + 0.5, W)
      block(q, mx0 - 0.6, mx0 + 0.6, mz0, mz1, y, y + 0.5, W)
      block(q, mx1 - 0.6, mx1 + 0.6, mz0, mz1, y, y + 0.5, W)
    }
    block(q, mx0 + 0.8, mx1 - 0.8, mz0 + 2, mz1 - 2, eaves, top - 3, DK)
    block(q, mx0 - 1.2, mx1 + 1.2, mz0 - 2, mz1 + 2, top - 0.4, top + 1, R)
    // the crossbeam out over the Place, its stays
    block(q, mx0 - 15, mx1 + 15, mz1 + 2.5, mz1 + 4.8, top - 2, top + 0.6, W2)
    for (const s of [-1, 1]) {
      const x = (mx0 + mx1) / 2 + s * 18
      strut(q, [(mx0 + mx1) / 2, top + 3, mz1 + 1], [x, top - 1, mz1 + 3.6], 0.28, 0.28, R, 0, false)
    }
    prism(q, (mx0 + mx1) / 2, mz1 + 3.6, top + 0.6, top + 8, 0.25, 5, R, 0, 0.08)
  })
}

/* ----------------------------------------------------------------------------------------------- Beaugrenelle */

/**
 * BEAUGRENELLE (Valode et Pistre, 2013; the two buildings either side of the Rue Linois, way/53396317 and way/53396302): rounded glass drums with soft corners, white ribbons wrapped round them, a green roof with a great round oculus in a spiral of paths, and the glass bridge over the Rue Linois between them. Aerial 48.8490 2.2815, 0.6 m/px. The ring is `fit.ring`, its corners rounded.
 */
const beaug = (out: MeshBuilder, fit: Fit, H: number, ox: number, oz: number): void => {
  const ring = roundRing(towerRing(fit), 12, 4)
  const G = hex('#6d8f9f'), W = hex('#cfd0c7'), M = hex('#9fa4a2')
  const face: Face = { kind: 'curtain', wall: M, glass: G, pitch: 2.4, floor: 4.6 }
  faceBand(out, ring, 0, H, face)
  // the white ribbons, floor by floor, and how they dip across the middle of each wall
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const n = Math.max(1, Math.round(e.L / 5))
    for (let k = 0; k < n; k++) {
      const u0 = (k / n) * e.L, u1 = ((k + 1) / n) * e.L
      for (const [y, a] of [[4.8, 0.5], [9.6, 0.9], [14.4, 0.6], [H - 0.5, 0.15]] as const) {
        const w0 = Math.sin((u0 / e.L) * Math.PI) * a, w1 = Math.sin((u1 / e.L) * Math.PI) * a
        const P = (u: number, yy: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * 0.65, yy, e.a.z + e.tz * u + e.nz * 0.65]
        out.quad([P(u0, y - w0 - 0.5), P(u1, y - w1 - 0.5), P(u1, y - w1 + 0.5), P(u0, y - w0 + 0.5)], [e.nx, 0, e.nz], UV, W, 0)
      }
    }
  }
  // the meadow on its roof, the walks, the oculus in its spiral
  capPolygon(out, ring, H, hex('#5a7a43'), 0)
  const y = H + 0.1
  prism(out, ox, oz, H, y, 12, 24, hex('#a9a595'), 0)
  for (let k = 0; k < 3; k++) {
    const r0 = 12 + k * 4, a0 = k * 2
    for (let j = 0; j < 10; j++) {
      const a = a0 + (j / 10) * Math.PI * 1.5, b = a0 + ((j + 1) / 10) * Math.PI * 1.5
      const rr = r0 + (j / 10) * 3
      strut(out, [ox + Math.cos(a) * rr, y + 0.1, oz + Math.sin(a) * rr], [ox + Math.cos(b) * rr, y + 0.1, oz + Math.sin(b) * rr], 0.9, 0.08, hex('#ababa0'), 0, false)
    }
  }
  prism(out, ox, oz, H, H + 3.6, 7.4, 20, hex('#73929a'), surfaceTag('glass'), 5.8)
  bandRound(out, ox, oz, 7.6, 7.6, -Math.PI, Math.PI, H, H + 0.8, W, { segs: 20 })
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    strut(out, [ox + Math.cos(a) * 7.4, H + 0.2, oz + Math.sin(a) * 7.4], [ox + Math.cos(a) * 5.8, H + 3.65, oz + Math.sin(a) * 5.8], 0.14, 0.1, W, 0, false)
  }
}
export const beaugrenelleLinois = (out: MeshBuilder, fit: Fit): void => beaug(out, fit, 19, 0, 0)
export const beaugrenelleMagnetic = (out: MeshBuilder, fit: Fit): void => beaug(out, fit, 19, 0, -4)

/** The bridge between them, over the Rue Linois (aerial: (640, 560) on beaug.jpg, about 30 m long, at the 2nd floor): glass in a white frame, curved as they are. `front` along it: it runs on x. */
export function beaugrenellePont(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 10, W = hex('#cfd0c7'), G = hex('#7ea2b0'), hl = Math.max(14, fit.hx)
  block(out, -hl, hl, -2.4, 2.4, y - 0.4, y, W)
  // (it meets the buildings' walls; these are its feet at each end, against them)
  for (const s of [-1, 1]) block(out, s * hl - 0.4, s * hl + 0.4, -2.4, 2.4, fit.grade ?? 0, y, hex('#9fa4a2'))
  block(out, -hl, hl, -2.4, 2.4, y + 4.2, y + 4.6, W)
  for (const s of [-1, 1]) {
    out.quad([[-hl, y, s * 2.3], [hl, y, s * 2.3], [hl, y + 4.2, s * 2.3], [-hl, y + 4.2, s * 2.3]], [0, 0, s], UV, G, surfaceTag('glass'))
    for (let x = -hl; x <= hl; x += 3.4) block(out, x - 0.1, x + 0.1, s * 2.3 - 0.1, s * 2.3 + 0.1, y, y + 4.2, W)
  }
}

