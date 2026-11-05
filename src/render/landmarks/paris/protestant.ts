import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { archedPane, block, column, hex, pane, pediment, pinnacle, roof, shade } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { registerRing, tone, tools, type P2, type V3, type Tools } from './museums/enframe.ts'
import type { Rgb } from '../../models.ts'

// Protestant churches that want their own builder. Manifest entries: public/landmarks/paris/protestant.json.

// ───────────────────────────── Temple de l'Oratoire du Louvre (way/30622528) ─────────────────────────────
// Lemercier's Oratorian church (1616-30), portal of 1745 on rue Saint-Honoré. Read off two Commons photographs
// (docs/landmarks/refs/oratoire/, 2026-11-04): facade-saint-honore.jpg (P1190922 rwk) — two tiers of free columns, a
// pediment over a round-arched window, stepped scroll wings, a Gothic-flanked nave with buttress pinnacles behind —
// and rivoli-apse-arcade.jpg — a balustraded arcade of round arches along rue de Rivoli in front of the polygonal
// apse, slate roofs, small corner turrets. Local −z is the rue Saint-Honoré front, +z the Rivoli apse.
const OR_STONE = '#cdbd98'    // warm limestone
const OR_SLATE = '#5d6068'
const OR_LOW_H = 9.0          // lower (Tuscan) tier of the portal
const OR_UP_H = 17.0          // top of the upper (Corinthian) tier
const OR_PED_H = 3.6          // pediment rise
const OR_NAVE_H = 16.0        // nave eaves
const OR_RIDGE = 7.5          // slate roof rise above eaves
const OR_FACADE_D = 1.6       // depth of the portal wall
const OR_PORTICO = 1.9        // projection of the lower columns
const OR_COL_R = 0.45         // lower column radius
const OR_UP_FRAC = 0.62       // width of the upper tier / facade width
const OR_BAYS = 5             // buttressed bays along the nave
const OR_BUTT_W = 1.1         // buttress width
const OR_BUTT_OUT = 0.9       // buttress projection
const OR_APSE_L = 11.0        // length of the apse end (hexagon + arcade)
const OR_ARC_D = 5.2          // depth of the Rivoli arcade
const OR_ARC_H = 5.4          // arcade height to the balustrade
const OR_ARC_N = 6            // arches across
const OR_INSET = 0.3

export function oratoireDuLouvre(out: MeshBuilder, fit: Fit): void {
  const stone = hex(OR_STONE), slate = hex(OR_SLATE), dark = hex('#2a2d36'), glass = hex('#3b4660')
  const ash = surfaceTag('ashlar'), plain = surfaceTag('stucco')
  const x0 = -fit.hx + OR_INSET, x1 = fit.hx - OR_INSET, z0 = -fit.hz + OR_INSET, z1 = fit.hz - OR_INSET
  const W = x1 - x0, xc = (x0 + x1) / 2
  const zNave1 = z1 - OR_APSE_L
  const slab = (a: number, b: number, c: number, d: number, y0: number, y1: number, col = stone): void => {
    block(out, a, b, c, d, y0, y1, col)
  }

  // ---- nave: walls, slate gabled roof, buttressed bays with tall windows and pinnacles
  slab(x0, x1, z0 + OR_FACADE_D, zNave1, 0, OR_NAVE_H)
  roof(out, x0 - 0.3, x1 + 0.3, z0 + OR_FACADE_D, zNave1, OR_NAVE_H, OR_RIDGE, (x1 - x0 + 0.6) / 2, 0, slate)
  const bayLen = (zNave1 - (z0 + OR_FACADE_D + 2)) / OR_BAYS
  for (let i = 0; i <= OR_BAYS; i++) {
    const zb = z0 + OR_FACADE_D + 2 + i * bayLen
    for (const sx of [-1, 1]) {
      const xe = sx < 0 ? x0 : x1
      slab(Math.min(xe, xe + sx * OR_BUTT_OUT), Math.max(xe, xe + sx * OR_BUTT_OUT), zb - OR_BUTT_W / 2, zb + OR_BUTT_W / 2, 0, OR_NAVE_H + 1.2, shade(stone, 0.96))
      pinnacle(out, xe + sx * OR_BUTT_OUT * 0.5, zb, OR_NAVE_H + 1.2, 3.4, OR_BUTT_W * 0.8, stone)
    }
  }
  for (let i = 0; i < OR_BAYS; i++) {
    const zm = z0 + OR_FACADE_D + 2 + (i + 0.5) * bayLen
    for (const sx of [-1, 1]) {
      const xe = sx < 0 ? x0 : x1
      pane(out, sx < 0 ? '-x' : '+x', xe, zm, 7.0, bayLen * 0.42, 6.5, glass, 0.05)         // tall window
      pane(out, sx < 0 ? '-x' : '+x', xe, zm, 4.2, bayLen * 0.3, 1.8, dark, 0.05)           // lower opening
    }
  }
  // clerestory cornice
  slab(x0 - 0.15, x1 + 0.15, z0 + OR_FACADE_D, zNave1, OR_NAVE_H - 0.5, OR_NAVE_H, shade(stone, 1.04))

  // ---- polygonal apse and its slate cone
  const ar = W / 2 - 0.3, acz = z1 - OR_ARC_D + 0.5 - ar * 0.87   // its far flat just inside the arcade
  prism(out, xc, acz, 0, OR_NAVE_H, ar, 6, stone, ash)
  prism(out, xc, acz, OR_NAVE_H, OR_NAVE_H + OR_RIDGE * 0.9, ar * 1.05, 6, slate, 0, 0.1)
  for (let k = -1; k <= 1; k++) pane(out, '+z', acz + ar * 0.86, xc + k * ar * 0.55, 7, 1.6, 6.5, glass, 0.05)
  // corner turrets at the junction
  for (const sx of [-1, 1]) {
    const tx = xc + sx * (W / 2 - 0.4), tz = zNave1 - 1
    prism(out, tx, tz, OR_NAVE_H - 3, OR_NAVE_H + 3.5, 0.9, 8, stone, ash)
    prism(out, tx, tz, OR_NAVE_H + 3.5, OR_NAVE_H + 8, 1.0, 8, slate, 0, 0.05)
  }

  // ---- Rivoli arcade: balustraded gallery of round arches in front of the apse
  const az0 = z1 - OR_ARC_D
  slab(x0, x1, z1 - OR_ARC_D, z1 - OR_ARC_D + 1.0, 0, OR_ARC_H, stone)             // back wall against the apse
  slab(x0, x1, az0, z1, OR_ARC_H - 0.7, OR_ARC_H, shade(stone, 1.05))               // terrace slab
  const pw = 1.0, span = (W - pw) / OR_ARC_N
  for (let i = 0; i <= OR_ARC_N; i++) {
    const px = x0 + pw / 2 + i * span
    slab(px - pw / 2, px + pw / 2, z1 - pw, z1, 0, OR_ARC_H - 0.7, stone)
  }
  for (let i = 0; i < OR_ARC_N; i++) {
    const px = x0 + pw / 2 + (i + 0.5) * span
    const w = span - pw, h = OR_ARC_H - 1.6, pl = az0 + 1.0   // the open arch: dark recess on the back wall, stepped round head
    pane(out, '+z', pl, px, 0, w, h - w / 2, dark, 0.04)
    for (const [f, k] of [[0.9, 0.12], [0.7, 0.3], [0.4, 0.42]] as const) pane(out, '+z', pl, px, h - w / 2 + w * (k - 0.12) , w * f, w * 0.14 + 0.02, dark, 0.04)
  }
  slab(x0, x1, z1 - 0.3, z1, OR_ARC_H + 0.7, OR_ARC_H + 1.0, shade(stone, 1.02))     // balustrade rail on the street edge
  for (let k = 0; k <= 24; k++) box(out, x0 + 0.3 + k * (W - 0.6) / 24, OR_ARC_H + 0.35, z1 - 0.15, 0.1, 0.35, 0.1, shade(stone, 0.9), plain)
  // the Coligny monument: a pale statue in the central arch
  box(out, xc, 1.0, z1 - 2.6, 0.7, 1.0, 0.5, hex('#e6e0d4'), plain)
  box(out, xc, 2.8, z1 - 2.6, 0.45, 1.0, 0.3, hex('#efe9dd'), plain)

  // ---- portal facade (rue Saint-Honoré)
  slab(x0, x1, z0, z0 + OR_FACADE_D, 0, OR_LOW_H, stone)
  slab(x0 - 0.2, x1 + 0.2, z0 - OR_PORTICO * 0.3, z0 + OR_FACADE_D, OR_LOW_H - 1.1, OR_LOW_H, shade(stone, 1.05))  // entablature
  const cols = [-0.46, -0.3, 0.3, 0.46].map((f) => xc + f * W)
  for (const cx of cols) column(out, cx, z0 - OR_PORTICO + 0.2, 0, OR_LOW_H - 1.1, OR_COL_R, stone, { order: 'tuscan', tag: ash })
  const doorW = 2.4
  archedPane(out, z0, xc, 0, doorW, 6.2, hex('#4a3524'))
  for (const sx of [-1, 1]) {
    pane(out, '-z', z0, xc + sx * W * 0.38, 0, 1.6, 4.6, hex('#4a3524'), 0.05)
    pane(out, '-z', z0, xc + sx * W * 0.38, 5.2, 1.5, 1.6, shade(stone, 0.6), 0.05)
  }
  // upper tier: set back, narrower, with pairs of columns, a round-headed window, and the pediment
  const ux0 = xc - W * OR_UP_FRAC / 2, ux1 = xc + W * OR_UP_FRAC / 2
  slab(ux0, ux1, z0 + 0.2, z0 + OR_FACADE_D + 0.6, OR_LOW_H, OR_UP_H)
  for (const f of [-0.28, -0.17, 0.17, 0.28]) column(out, xc + f * W, z0 + 0.1, OR_LOW_H, OR_UP_H - 0.9, OR_COL_R * 0.9, stone, { order: 'corinthian', tag: ash })
  slab(ux0 - 0.25, ux1 + 0.25, z0 - 0.3, z0 + OR_FACADE_D + 0.6, OR_UP_H - 0.9, OR_UP_H, shade(stone, 1.05))
  archedPane(out, z0 + 0.2, xc, OR_LOW_H + 1.6, 2.8, 6.0, glass)
  pediment(out, ux0 - 0.25, ux1 + 0.25, z0 - 0.3, OR_UP_H, OR_PED_H, OR_FACADE_D + 1, stone)
  box(out, xc, OR_UP_H + OR_PED_H + 0.7, z0 + 0.8, 0.12, 0.7, 0.12, hex('#3c3c3c'), 0)    // cross
  box(out, xc, OR_UP_H + OR_PED_H + 0.9, z0 + 0.8, 0.4, 0.12, 0.12, hex('#3c3c3c'), 0)
  // stepped scroll wings between the upper tier and the sides
  for (const sx of [-1, 1]) {
    const a = sx < 0 ? x0 : ux1 + 0.25, b = sx < 0 ? ux0 - 0.25 : x1
    slab(a, b, z0 + 0.4, z0 + OR_FACADE_D + 0.3, OR_LOW_H, OR_LOW_H + 3.2)
  }
  // side-wall blank behind the facade ends: slate-capped gable fill above the lower tier already by nave
}

// ───────────────────────────── The American Church in Paris (way/69049385) ─────────────────────────────
// Cram, Goodhue & Ferguson's Gothic-revival church (1927-31), 65 quai d'Orsay. Read off Commons photographs
// (docs/landmarks/refs/eglise-americaine/): ext-01 (the pointed, crocketed portal in pale ashlar), ext-02 (brick
// walls with stone-framed pointed windows, gables, a pierced scroll parapet, a brick-and-stone chimney tower beyond),
// ext-03 (brick hall wing: four tall pointed windows, mullioned floors, dormers), tower-a/tower-b (a stone
// belfry with corner pinnacles under a tall green copper spire). The footprint is OSM's, in metres east/north of
// the point (2.3069 E, 48.8621 N); north is the quai, where the tower stands at the west corner of the front.
// Registered on the loader's ring through museums/enframe.ts.
const AC_RING: P2[] = [[-2.2, -16.6], [6.1, -16.4], [7.1, -16.4], [10.2, -11], [12.2, -11], [11.9, -1.4], [11.3, 20.2], [3.9, 19.9], [-4.9, 19.9], [-4.9, 11.7], [-12.9, 11.5], [-13, 19.4], [-12.9, 13.1],
  [-4.7, -1.3], [-3.2, -14.7]]
const AC_NAVE: P2[] = [[-2.2, -16.6], [7.1, -16.4], [10.2, -11], [12.2, -11], [11.7, 20], [-4.9, 20], [-4.8, -1.3], [-3.2, -14.7]]   // the nave and quai front block
const AC_TOWER: [number, number, number, number] = [-13, -4.9, 11.5, 19.6]   // tower footprint: e0 e1 n0 n1
const AC_STONE: Rgb = [0.74, 0.68, 0.55]       // pale buff ashlar
const AC_BRICK: Rgb = [0.55, 0.30, 0.22]
const AC_SLATE: Rgb = [0.30, 0.31, 0.34]
const AC_COPPER: Rgb = [0.36, 0.60, 0.50]      // the green spire
const AC_GLASS: Rgb = [0.13, 0.16, 0.22]
const AC_DOOR: Rgb = [0.45, 0.28, 0.13]
const AC_EAVE = 17.0          // nave wall top
const AC_RISE = 7.5           // roof ridge above the eaves
const AC_BAY = 6.4            // buttress / window bay along the nave
const AC_BUTT_OUT = 0.9       // buttress projection
const AC_BUTT_W = 1.0         // buttress width
const AC_WIN_W = 2.4          // nave window width
const AC_WIN_Y = 4.5          // nave window sill
const AC_WIN_H = 9.5          // nave window height to the apex
const AC_BRICK_Y = 9.0        // brick below this height on the nave walls, stone above (ext-02: brick walls under a stone cornice)
const AC_TOWER_STONE = 27.0   // top of the belfry stage (parapet)
const AC_TOWER_BELFRY = 17.0  // where the plain shaft ends and the belfry begins
const AC_SPIRE_H = 36.0       // the spire's height above the parapet
const AC_SPIRE_R = 3.6        // its base radius
const AC_FACADE_WIN_W = 6.0
const AC_FACADE_WIN_Y = 7.5
const AC_FACADE_WIN_H = 12.0
const AC_PORTAL_W = 3.4
const AC_PORTAL_H = 6.8

/** An equilateral pointed arch standing on a wall: base centre `c`, along-wall unit `u`, outward `nrm`, from height y0, width w, total height h. */
export function ogive(T: Tools, c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, col: Rgb, off: number): void {
  const rise = w * 0.866, ys = Math.max(y0, y0 + h - rise)
  const at = (t: number, y: number): V3 => [c[0] + u[0] * t + nrm[0] * off, c[1] + u[1] * t + nrm[1] * off, y]
  const pts: V3[] = [at(-w / 2, y0), at(w / 2, y0), at(w / 2, ys)]
  const N = 5
  for (let i = 1; i <= N; i++) { const a = (i / N) * (Math.PI / 3); pts.push(at(-w / 2 + w * Math.cos(a), ys + w * Math.sin(a))) }   // right half: arc about the left springing
  for (let i = N - 1; i >= 0; i--) { const a = (i / N) * (Math.PI / 3); pts.push(at(w / 2 - w * Math.cos(a), ys + w * Math.sin(a))) }  // left half
  pts.push(at(-w / 2, ys))
  T.poly(pts, col, [nrm[0], nrm[1], 0])
}

/** a glazed pointed window with a pale surround, `mull` mullions and a dark transom band */
export function gothicWindow(T: Tools, c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, mull: number, stone: Rgb, glass: Rgb): void {
  ogive(T, c, u, nrm, y0 - 0.25, w + 0.7, h + 0.45, tone(stone, 1.06), 0.04)
  ogive(T, c, u, nrm, y0, w, h, glass, 0.09)
  for (let k = 1; k <= mull; k++) {
    const t = -w / 2 + (w * k) / (mull + 1), hw = 0.07
    const q = (tt: number, y: number): V3 => [c[0] + u[0] * tt + nrm[0] * 0.13, c[1] + u[1] * tt + nrm[1] * 0.13, y]
    T.poly([q(t - hw, y0), q(t + hw, y0), q(t + hw, y0 + h - w * 0.5), q(t - hw, y0 + h - w * 0.5)], tone(stone, 1.0), [nrm[0], nrm[1], 0])
  }
}

export function egliseAmericaine(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(AC_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const stone = AC_STONE, brick = AC_BRICK
  const rect = (e0: number, e1: number, n0: number, n1: number): P2[] => [[e0, n0], [e1, n0], [e1, n1], [e0, n1]]
  const loc = (e: number, n: number, h: number): V3 => F.p(e, n, h)

  // ---- nave and quai front: brick below, a stone cornice band above, slate hipped roof
  const [ne0, ne1] = [-4.9, 12.2], nmid = (ne0 + ne1) / 2
  pr(AC_NAVE, 0, AC_BRICK_Y, brick, null, 1.1)
  pr(AC_NAVE.map(([e, n]) => [e + (e > nmid ? 0.12 : -0.12), n] as P2), AC_BRICK_Y, AC_EAVE, stone, null, 2.2)
  pr(AC_NAVE.map(([e, n]) => [e + (e > nmid ? 0.3 : -0.3), n] as P2), AC_EAVE - 0.5, AC_EAVE, tone(stone, 1.06), tone(stone, 0.9))
  const ns = -16.6 + (ne1 - ne0) / 2, nn = 20.0, rid = AC_EAVE + AC_RISE
  poly([[ne0, -16.6, AC_EAVE], [ne0, nn, AC_EAVE], [nmid, nn, rid], [nmid, ns, rid]], AC_SLATE, [-0.6, 0, 0.8])
  poly([[ne1, nn, AC_EAVE], [ne1, -16.6, AC_EAVE], [nmid, ns, rid], [nmid, nn, rid]], AC_SLATE, [0.6, 0, 0.8])
  poly([[ne1, -16.6, AC_EAVE], [ne0, -16.6, AC_EAVE], [nmid, ns, rid]], tone(AC_SLATE, 0.92), [0, -0.6, 0.8])
  poly([[ne0, nn, AC_EAVE], [ne1, nn, AC_EAVE], [nmid, nn, rid]], stone, [0, 1, 0])                      // the quai gable, in stone
  poly([[ne0 - 0.3, nn + 0.12, AC_EAVE], [ne1 + 0.3, nn + 0.12, AC_EAVE], [nmid, nn + 0.12, rid + 0.4]], tone(stone, 0.96), [0, 1, 0])

  // ---- buttresses and windows down the east and west walls
  const sides: { e: number; nrm: P2; n0: number; n1: number }[] = [{ e: 12.2, nrm: [1, 0], n0: -10.5, n1: 19.5 }, { e: -4.9, nrm: [-1, 0], n0: 0.5, n1: 11.3 }]
  for (const s of sides) {
    const bays = Math.max(1, Math.round((s.n1 - s.n0) / AC_BAY)), bl = (s.n1 - s.n0) / bays
    for (let i = 0; i <= bays; i++) {
      const n = s.n0 + i * bl, e0 = Math.min(s.e, s.e + s.nrm[0] * AC_BUTT_OUT), e1 = Math.max(s.e, s.e + s.nrm[0] * AC_BUTT_OUT)
      pr(rect(e0, e1, n - AC_BUTT_W / 2, n + AC_BUTT_W / 2), 0, AC_EAVE + 0.8, tone(stone, 0.97), tone(stone, 0.9))
      const [px, py, pz] = loc(s.e + s.nrm[0] * AC_BUTT_OUT * 0.5, n, AC_EAVE + 0.8)
      pinnacle(out, px, pz, py, 3.2, AC_BUTT_W * 0.9, stone)
    }
    for (let i = 0; i < bays; i++) gothicWindow(T, [s.e, s.n0 + (i + 0.5) * bl], [0, 1], s.nrm, AC_WIN_Y, AC_WIN_W, AC_WIN_H, 2, stone, AC_GLASS)
  }
  // ---- the south chamfers: a window on each cut corner and the apse end
  gothicWindow(T, [2.5, -16.6], [1, 0], [0, -1], AC_WIN_Y, AC_WIN_W + 0.8, AC_WIN_H + 1, 3, stone, AC_GLASS)
  gothicWindow(T, [8.65, -13.7], [0.7, 0.71], [0.71, -0.7], AC_WIN_Y, AC_WIN_W, AC_WIN_H, 2, stone, AC_GLASS)

  // ---- the quai front: corner buttresses, the great window over the pointed, crocketed portal, a cross on the gable
  for (const e of [ne0 + 0.3, ne1 - 0.1]) {
    pr(rect(e - 0.7, e + 0.7, nn, nn + AC_BUTT_OUT), 0, AC_EAVE + 1.2, tone(stone, 0.97), tone(stone, 0.9))
    const [px, py, pz] = loc(e, nn + 0.4, AC_EAVE + 1.2)
    pinnacle(out, px, pz, py, 3.6, 1.1, stone)
  }
  gothicWindow(T, [nmid, nn], [1, 0], [0, 1], AC_FACADE_WIN_Y, AC_FACADE_WIN_W, AC_FACADE_WIN_H, 3, stone, AC_GLASS)
  ogive(T, [nmid, nn], [1, 0], [0, 1], 0, AC_PORTAL_W + 1.4, AC_PORTAL_H + 1.2, tone(stone, 1.08), 0.08)
  ogive(T, [nmid, nn], [1, 0], [0, 1], 0, AC_PORTAL_W, AC_PORTAL_H, AC_DOOR, 0.14)
  ogive(T, [nmid, nn], [1, 0], [0, 1], AC_PORTAL_H * 0.62, AC_PORTAL_W * 0.8, AC_PORTAL_H * 0.38, tone(stone, 0.78), 0.18)   // the tympanum
  const [cx, cy, cz] = loc(nmid, nn + 0.3, rid + 0.4)
  box(out, cx, cy + 0.8, cz, 0.1, 0.8, 0.1, hex('#3c3c3c'), 0)
  box(out, cx, cy + 1.1, cz, 0.4, 0.1, 0.1, hex('#3c3c3c'), 0)

  // ---- the tower at the west end of the quai front: shaft, belfry with pairs of pointed openings, pinnacled parapet, green spire
  const [te0, te1, tn0, tn1] = AC_TOWER, tc: P2 = [(te0 + te1) / 2, (tn0 + tn1) / 2], tw = te1 - te0
  pr(rect(te0, te1, tn0, tn1), 0, AC_TOWER_BELFRY, stone, null, 2.2)
  pr(rect(te0 - 0.15, te1 + 0.15, tn0 - 0.15, tn1 + 0.15), AC_TOWER_BELFRY - 0.5, AC_TOWER_BELFRY, tone(stone, 1.06), tone(stone, 0.92))   // string course
  pr(rect(te0 - 0.1, te1 + 0.1, tn0 - 0.1, tn1 + 0.1), AC_TOWER_BELFRY, AC_TOWER_STONE, tone(stone, 1.03), null, 2.2)
  pr(rect(te0 - 0.45, te1 + 0.45, tn0 - 0.45, tn1 + 0.45), AC_TOWER_STONE - 1.0, AC_TOWER_STONE, tone(stone, 1.06), tone(stone, 0.85))        // the parapet band
  const faces: { c: P2; u: P2; nrm: P2 }[] = [
    { c: [tc[0], tn1 + 0.1], u: [1, 0], nrm: [0, 1] }, { c: [tc[0], tn0 - 0.1], u: [-1, 0], nrm: [0, -1] },
    { c: [te0 - 0.1, tc[1]], u: [0, -1], nrm: [-1, 0] }, { c: [te1 + 0.1, tc[1]], u: [0, 1], nrm: [1, 0] }]
  for (const f of faces) {
    for (const k of [-1, 1]) {
      const c: P2 = [f.c[0] + f.u[0] * k * tw * 0.21, f.c[1] + f.u[1] * k * tw * 0.21]
      gothicWindow(T, c, f.u, f.nrm, AC_TOWER_BELFRY + 2.2, 1.7, 6.2, 1, stone, AC_GLASS)
    }
    gothicWindow(T, f.c, f.u, f.nrm, 6.5, 2.0, 7.0, 1, stone, AC_GLASS)                    // the shaft's lancet
  }
  for (const [e, n] of [[te0, tn0], [te1, tn0], [te0, tn1], [te1, tn1]] as P2[]) {
    pr(rect(e - 0.55, e + 0.55, n - 0.55, n + 0.55), 0, AC_TOWER_STONE + 0.6, tone(stone, 0.96), tone(stone, 0.9))   // corner buttresses
    const [px, py, pz] = loc(e, n, AC_TOWER_STONE + 0.6)
    pinnacle(out, px, pz, py, 4.8, 1.2, stone)
  }
  const [sx, sy, sz] = loc(tc[0], tc[1], AC_TOWER_STONE)
  prism(out, sx, sz, sy, sy + AC_SPIRE_H * 0.78, AC_SPIRE_R, 8, AC_COPPER, 0, AC_SPIRE_R * 0.30)
  prism(out, sx, sz, sy + AC_SPIRE_H * 0.78, sy + AC_SPIRE_H, AC_SPIRE_R * 0.30, 8, AC_COPPER, 0, 0.12)
  box(out, sx, sy + AC_SPIRE_H + 0.9, sz, 0.08, 1.0, 0.08, hex('#3c3c3c'), 0)
  box(out, sx, sy + AC_SPIRE_H + 1.4, sz, 0.35, 0.08, 0.08, hex('#3c3c3c'), 0)
}

// ───────────────────────────── Temple protestant de l'Étoile (way/84322974) ─────────────────────────────
// Église réformée de l'Étoile, 54 avenue de la Grande-Armée (Vaudremer, 1874). Read off Commons photographs
// (docs/landmarks/refs/etoile/, 2021-08-31 by Chabe01): b.jpg the whole front, a.jpg the pointed portal. It is a
// narrow GOTHIC-revival front (not Romanesque), pale limestone: a lower storey of three bays (side doors under
// hoods, roundels, the gabled portal), a stepped blind arcade over each side bay, and the nave's gable between them
// with the tall pointed window, a rose and a cross. Everything is measured in pixels of b.jpg (960 x 1791) and turned
// into metres by ET_SX / ET_SY, so a proportion is adjusted by editing a number. The footprint is OSM's, in metres
// east/north of (2.332 + -3290 / 73228, 48.8605 + 1822 / 111320); local u runs along the avenue front (to the
// viewer's right), v into the lot. Registered on the loader's ring through museums/enframe.ts.
const ET_RING: P2[] = [[-3289.7, 1845.6], [-3293.8, 1847.1], [-3296.4, 1841.9], [-3301.8, 1844.7], [-3307.9, 1832.3], [-3311.5, 1824.9], [-3307.5, 1822.7],
  [-3305.6, 1826.3], [-3298.2, 1822.7], [-3299.9, 1819.1], [-3302.6, 1820.3], [-3305.0, 1815.6], [-3307.1, 1816.6], [-3310.7, 1809.0], [-3293.0, 1800.5],
  [-3282.5, 1822.0], [-3276.0, 1818.8], [-3273.7, 1817.4], [-3272.9, 1819.6], [-3271.7, 1819.2], [-3268.6, 1828.5], [-3272.9, 1830.3], [-3278.8, 1833.3],
  [-3278.1, 1837.3], [-3277.9, 1837.9], [-3284.5, 1840.3], [-3283.0, 1843.3]].map(([e, n]) => [e + 3290, n - 1822] as P2)
const ET_FRONT0: P2 = [ET_RING[13][0], ET_RING[13][1]], ET_FRONT1: P2 = ET_RING[14]   // the avenue edge, left end to right end
const ET_STONE: Rgb = [0.74, 0.69, 0.58]      // pale buff limestone
const ET_SLATE: Rgb = [0.30, 0.31, 0.34]
const ET_GLASS: Rgb = [0.34, 0.40, 0.55]      // the great window, pale milky glass
const ET_DARK: Rgb = [0.12, 0.13, 0.14]
const ET_DOOR: Rgb = [0.38, 0.42, 0.38]       // the grey-green glazed doors
const ET_SX = 0.0195          // metres per pixel across b.jpg
const ET_SY = 0.0165          // and up it (the photograph stretches upward)
const ET_X0 = 10              // pixel column of the front's left edge
const ET_GY = 1742            // pixel row of the pavement
const ET_MARGIN = 0.75        // metres of party wall between the lot edge and the first pier
const ET_FRONT_D = 3.6        // depth of the front block (the three bays)
const ET_NAVE_L = 24.0        // the nave behind
const ET_SIDE_H = 9.0         // the flat-roofed halls on the rest of the OSM plan
const ET_ROOF_PX = 440        // pixel row where the nave gable starts
const ET_APEX_PX = 160        // its apex
const ET_CORNICE_PX = 1048    // the cornice over the lower storey
const ET_AISLE_PX = 745       // the low end of the aisles' stepped top
const ET_CROSS_H = 2.2

export function templeEtoile(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(ET_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const stone = ET_STONE, loc = F.p
  const dx = ET_FRONT1[0] - ET_FRONT0[0], dn = ET_FRONT1[1] - ET_FRONT0[1], FW = Math.hypot(dx, dn)
  const UV: P2 = [dx / FW, dn / FW], VV: P2 = [-UV[1], UV[0]], NRM: P2 = [-VV[0], -VV[1]]      // along the front, into the lot, outward
  const EN = (u: number, v: number): P2 => [ET_FRONT0[0] + u * UV[0] + v * VV[0], ET_FRONT0[1] + u * UV[1] + v * VV[1]]
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const U = (px: number): number => ET_MARGIN + (px - ET_X0) * ET_SX
  const H = (py: number): number => (ET_GY - py) * ET_SY
  const hintOut: V3 = [NRM[0], NRM[1], 0]
  const fp = (u: number, y: number, d = 0): V3 => { const p = EN(u, -d); return [p[0], p[1], y] }
  const eave = H(ET_ROOF_PX), apex = H(ET_APEX_PX), corn = H(ET_CORNICE_PX), aisle = H(ET_AISLE_PX)
  const nU0 = U(245), nU1 = U(690), nMid = (nU0 + nU1) / 2
  const fU0 = ET_MARGIN, fU1 = U(935)
  const pin = (u: number, v: number, h: number, ph: number, w: number): void => { const [x, y, z] = loc(...EN(u, v), h); pinnacle(out, x, z, y, ph, w, stone) }
  /** a front-facing stone band / pier: u0..u1, projecting `d`, from y0 to y1 */
  const slab = (u0: number, u1: number, d: number, y0: number, y1: number, k = 1): void => pr(rect(u0, u1, -d, 0.3), y0, y1, tone(stone, k), tone(stone, 0.95 * k))
  const round = (u: number, y: number, r: number, d: number, col: Rgb): void => {
    const pts: V3[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(fp(u + Math.cos(a) * r, y + Math.sin(a) * r, d)) }
    poly(pts, col, hintOut)
  }
  const tri = (ua: number, ub: number, y0: number, y1: number, d: number, col: Rgb): void => poly([fp(ua, y0, d), fp(ub, y0, d), fp((ua + ub) / 2, y1, d)], col, hintOut)
  const arch = (u: number, y0: number, w: number, h: number, col: Rgb, d: number): void => ogive(T, EN(u, 0), UV, NRM, y0, w, h, col, d)

  // ---- the flat-roofed halls on the whole OSM plan, then the front block and the nave on top
  pr(ET_RING, 0, ET_SIDE_H, stone, [0.40, 0.40, 0.42], 1.6)
  pr(rect(fU0, fU1, 0, ET_FRONT_D), 0, corn, stone, [0.40, 0.40, 0.42], 1.1)
  for (const [a, b] of [[10, 80], [240, 330], [630, 700], [860, 935]]) slab(U(a), U(b), 0.35, 0, corn + 0.35, 0.97)   // the piers
  slab(fU0 - 0.1, fU1 + 0.1, 0.3, corn - 0.3, corn + 0.2, 1.06)                                                  // cornice
  slab(fU0, fU1, 0.15, 0.0, 0.7, 0.94)                                                                            // plinth

  // ---- aisles above the cornice: stepped blind arcade rising toward the nave, an outer pinnacle
  for (const [a, b, dir] of [[ET_X0 + 20, 245, 1], [690, 915, -1]] as const) {
    const steps = 4, ua = U(a), ub = U(b)
    for (let i = 0; i < steps; i++) {
      const s0 = ua + (ub - ua) * (i / steps), s1 = ua + (ub - ua) * ((i + 1) / steps)
      const k = dir > 0 ? i : steps - 1 - i
      pr(rect(s0, s1, -0.05, ET_FRONT_D), corn, aisle + (H(660) - aisle) * (k / (steps - 1)), tone(stone, 0.99), tone(stone, 0.9), 1.1)
      arch((s0 + s1) / 2, corn + 0.9, (s1 - s0) * 0.55, 2.6, tone(stone, 0.68), 0.08)
    }
    pin(dir > 0 ? U(a + 40) : U(b - 40), 0.4, aisle + 0.4, 3.4, 1.0)
  }
  // balustrade bays at the foot of the aisles
  for (const [a, b] of [[85, 235], [705, 855]]) for (let i = 0; i < 3; i++) {
    const s = U(a) + (U(b) - U(a)) * (i / 3)
    arch(s + (U(b) - U(a)) / 6, corn + 0.35, 0.9, 1.0, tone(stone, 0.6), 0.1)
  }

  // ---- the nave's gable and roof
  pr(rect(nU0, nU1, 0, ET_NAVE_L), corn, eave, stone, null, 1.3)
  poly([fp(nU0, eave, 0.02), fp(nU1, eave, 0.02), fp(nMid, apex, 0.02)], stone, hintOut)
  poly([fp(nU0 - 0.25, eave, 0.2), fp(nU1 + 0.25, eave, 0.2), fp(nMid, apex + 0.35, 0.2)], tone(stone, 0.94), hintOut)   // projecting verge
  const rl = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  poly([rl(nU0 - 0.2, 0, eave), rl(nU0 - 0.2, ET_NAVE_L, eave), rl(nMid, ET_NAVE_L, apex), rl(nMid, 0, apex)], ET_SLATE, [-UV[0] * 0.6, -UV[1] * 0.6, 0.8])
  poly([rl(nU1 + 0.2, ET_NAVE_L, eave), rl(nU1 + 0.2, 0, eave), rl(nMid, 0, apex), rl(nMid, ET_NAVE_L, apex)], ET_SLATE, [UV[0] * 0.6, UV[1] * 0.6, 0.8])
  poly([rl(nU0, ET_NAVE_L, eave), rl(nU1, ET_NAVE_L, eave), rl(nMid, ET_NAVE_L, apex)], stone, [VV[0], VV[1], 0])
  for (const u of [nU0 + 0.1, nU1 - 0.1]) pin(u, 0.1, eave, 2.4, 0.9)                              // gable-foot pinnacles
  for (const [a, b] of [[262, 316], [636, 690]]) slab(U(a), U(b), 0.3, corn + 0.2, eave - 0.2, 0.96)      // pilasters either side of the window
  // gable blind arcade, the rose, the cross
  for (let i = 0; i < 5; i++) { const u = nMid + (i - 2) * 1.35, top = apex - 0.8 - Math.abs(i - 2) * 1.25; arch(u, eave + 0.6, 0.8, Math.max(1.0, top - eave - 0.6), tone(stone, 0.68), 0.06) }
  const roseY = H(455)
  round(nMid, roseY, 1.25, 0.08, tone(stone, 1.1)); round(nMid, roseY, 0.95, 0.12, ET_DARK)
  pr(rect(nMid - 0.12, nMid + 0.12, 0.35, 0.65), apex + 0.2, apex + 0.2 + ET_CROSS_H, tone(stone, 1.0), tone(stone, 0.95))
  pr(rect(nMid - 0.6, nMid + 0.6, 0.38, 0.62), apex + 0.2 + ET_CROSS_H * 0.62, apex + 0.2 + ET_CROSS_H * 0.62 + 0.24, tone(stone, 1.0), tone(stone, 0.95))

  // ---- the great pointed window over the portal, with its drip-mould and a small balustrade
  const gW = (570 - 375) * ET_SX, gU = U(472), gY0 = H(960), gH = H(630) - gY0
  gothicWindow(T, EN(gU, 0), UV, NRM, gY0, gW, gH, 3, stone, ET_GLASS)
  arch(gU, gY0 + gH - gW * 0.866 - 0.2, gW + 1.4, gW * 0.866 + 0.9, tone(stone, 1.05), 0.03)
  slab(gU - gW / 2 - 0.25, gU + gW / 2 + 0.25, 0.5, gY0 - 0.7, gY0 - 0.05, 1.04)
  for (let i = 0; i < 7; i++) arch(gU - gW / 2 + 0.2 + i * (gW - 0.4) / 6, gY0 - 0.6, 0.3, 0.5, tone(stone, 0.6), 0.52)

  // ---- the portal: a gable over the pointed archway, inscription band, trefoil lunette, glazed doors
  const pU = U(470), pW = (590 - 350) * ET_SX, pApex = H(1245), gabY0 = H(1330), gabY1 = H(1090)
  tri(pU - (610 - 325) * ET_SX / 2, pU + (610 - 325) * ET_SX / 2, gabY0, gabY1, 0.28, tone(stone, 0.98))
  tri(pU - (610 - 325) * ET_SX / 2 + 0.55, pU + (610 - 325) * ET_SX / 2 - 0.55, gabY0 + 0.5, gabY1 - 0.7, 0.32, tone(stone, 0.8))
  arch(pU, 0, pW + 0.7, pApex + 0.3, tone(stone, 1.1), 0.36)
  arch(pU, 0, pW - 0.5, pApex - 0.4, tone(stone, 0.72), 0.40)
  const dW = (545 - 400) * ET_SX, dTop = H(1470)
  poly([fp(pU - dW / 2, 0, 0.44), fp(pU + dW / 2, 0, 0.44), fp(pU + dW / 2, dTop, 0.44), fp(pU - dW / 2, dTop, 0.44)], ET_DARK, hintOut)
  poly([fp(pU - dW / 2 - 0.1, dTop, 0.46), fp(pU + dW / 2 + 0.1, dTop, 0.46), fp(pU + dW / 2 + 0.1, dTop + 0.55, 0.46), fp(pU - dW / 2 - 0.1, dTop + 0.55, 0.46)], tone(stone, 0.85), hintOut)   // inscription
  arch(pU, dTop + 0.75, dW - 0.3, 2.2, [0.25, 0.32, 0.5], 0.47)                                       // the trefoil lunette
  round(pU, H(1262), 0.28, 0.5, tone(stone, 1.0))                                                       // the cross in the gablet
  // ---- side doors under hoods, roundels, blind trefoil friezes
  for (const [a, b, rc] of [[110, 235, 180], [715, 835, 765]]) {
    const u = U((a + b) / 2), w = (b - a) * ET_SX
    tri(u - w * 0.78, u + w * 0.78, H(1480), H(1355), 0.24, tone(stone, 1.0))
    arch(u, 0, w + 0.5, H(1455) + 0.4, tone(stone, 0.78), 0.28)
    arch(u, 0, w - 0.1, H(1455), ET_DOOR, 0.34)
    round(U(rc), H(1235), 1.45, 0.08, tone(stone, 1.06)); round(U(rc), H(1235), 1.05, 0.12, ET_DARK)
    for (let i = -1; i <= 1; i += 2) round(U(rc) + i * 0.4, H(1235), 0.35, 0.16, tone(stone, 0.7))
    for (let i = -2; i <= 2; i++) arch(U(rc) + i * 0.75, H(1152), 0.55, 0.7, tone(stone, 0.65), 0.08)
  }
}

// ───────────────────────────── Temple protestant du Saint-Esprit (way/67350058) ─────────────────────────────
// Église réformée du Saint-Esprit, 5 rue Roquépine (Ballu-era neoclassical, 1860s). Read off Commons photographs
// (docs/landmarks/refs/saint-esprit/: b.jpg and c.jpg the corner from rue d'Astorg, a1.jpg the belfry): a pale ashlar
// block of three storeys with tall green-grated windows, rusticated base, rounded north-west corner, a flat-pedimented
// portico of four pilasters/columns on rue Roquépine, behind it a square belfry with lattice screens, pediments on
// every face and a cross. Plan = OSM's, in metres east/north of (2.332 + -890/73228, 48.8605 + 1415/111320).
const SE_RING: P2[] = [[-875.1, 1424.9], [-876.4, 1434.0], [-889.9, 1432.0], [-895.2, 1431.3], [-902.6, 1430.2], [-903.4, 1429.8], [-905.7, 1427.4],
  [-906.1, 1426.7], [-906.9, 1420.6], [-898.7, 1419.4], [-897.5, 1411.0], [-896.4, 1402.4], [-878.2, 1399.4], [-874.3, 1398.7], [-872.6, 1398.4],
  [-872.1, 1402.8], [-872.9, 1409.0], [-873.4, 1412.4], [-876.3, 1412.0], [-878.0, 1424.5]].map(([e, n]) => [e + 890, n - 1415] as P2)
const SE_STONE: Rgb = [0.78, 0.70, 0.55]     // warm buff ashlar
const SE_SLATE: Rgb = [0.30, 0.31, 0.34]
const SE_GREEN: Rgb = [0.27, 0.40, 0.31]     // the green window grilles and doors
const SE_GLASS: Rgb = [0.18, 0.22, 0.24]
const SE_BASE_H = 3.6         // rusticated ground storey (to the first string course)
const SE_EAVE = 14.2          // cornice
const SE_ROOF_H = 3.6         // low slate mansard above the cornice
const SE_ROOF_INSET = 0.12    // fraction of the plan the roof pulls in (toward the centroid)
const SE_BAY = 3.4            // window bay along a wall
const SE_WIN_W = 1.5
const SE_WIN_H1 = 3.0         // ground storey windows
const SE_WIN_H2 = 2.6         // upper storeys
const SE_FLOORS_Y = [0.9, 4.9, 9.0]   // window sill heights per storey
const SE_FRONT_A: P2 = [-12.6, 15.2], SE_FRONT_B: P2 = [13.6, 19.0]   // the rue Roquépine edge, west to east
const SE_PORT_U0 = 9.0        // portico start along the front (m from A)
const SE_PORT_U1 = 18.5       // and end
const SE_PORT_D = 1.8         // projection of the portico
const SE_PORT_H = 11.2        // top of the portico entablature
const SE_PED_H = 2.4          // pediment rise
const SE_COLS = 4
const SE_TOWER_W = 5.0        // belfry plan
const SE_TOWER_U = 13.7       // its centre along the front
const SE_TOWER_V = 6.5        // and its depth behind the front
const SE_TOWER_TOP = 25.5     // belfry cornice
const SE_TOWER_PED = 3.0      // belfry pediment rise
const SE_BELFRY_Y = 17.0      // lattice openings start

export function templeSaintEsprit(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SE_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const stone = SE_STONE
  const sa = SE_RING.reduce((s, p, i) => { const q = SE_RING[(i + 1) % SE_RING.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) > 0 ? 1 : -1
  const cen: P2 = [SE_RING.reduce((s, p) => s + p[0], 0) / SE_RING.length, SE_RING.reduce((s, p) => s + p[1], 0) / SE_RING.length]

  // ---- the block: rusticated base, string course, upper walls, cornice, slate roof pulled in
  pr(SE_RING, 0, SE_EAVE, stone, null, 1.6)
  const ex = (k: number): P2[] => SE_RING.map(([e, n]) => { const dx = e - cen[0], dn = n - cen[1], l = Math.hypot(dx, dn) || 1; return [e + (dx / l) * k, n + (dn / l) * k] as P2 })
  pr(ex(0.18), SE_BASE_H - 0.25, SE_BASE_H + 0.1, tone(stone, 1.05), null)
  pr(ex(0.3), SE_EAVE - 0.7, SE_EAVE, tone(stone, 1.06), tone(stone, 0.9))
  const roof = SE_RING.map(([e, n]) => [e + (cen[0] - e) * SE_ROOF_INSET, n + (cen[1] - n) * SE_ROOF_INSET] as P2)
  pr(roof, SE_EAVE, SE_EAVE + SE_ROOF_H, SE_SLATE, tone(SE_SLATE, 0.9))

  // ---- windows with pale surrounds on every wall of useful length
  const frontLen = Math.hypot(SE_FRONT_B[0] - SE_FRONT_A[0], SE_FRONT_B[1] - SE_FRONT_A[1])
  const fu: P2 = [(SE_FRONT_B[0] - SE_FRONT_A[0]) / frontLen, (SE_FRONT_B[1] - SE_FRONT_A[1]) / frontLen]
  const fn: P2 = [-fu[1], fu[0]]    // outward (north) of the front
  const at = (c: P2, u: P2, nrm: P2, t: number, y: number, off: number): V3 => [c[0] + u[0] * t + nrm[0] * off, c[1] + u[1] * t + nrm[1] * off, y]
  const win = (c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, ground: boolean): void => {
    const hint: V3 = [nrm[0], nrm[1], 0]
    const q = (ww: number, hh: number, yy: number, off: number): V3[] => [at(c, u, nrm, -ww / 2, yy, off), at(c, u, nrm, ww / 2, yy, off), at(c, u, nrm, ww / 2, yy + hh, off), at(c, u, nrm, -ww / 2, yy + hh, off)]
    poly(q(w + 0.5, h + 0.45, y0 - 0.2, 0.05), tone(stone, 1.1), hint)
    poly(q(w, h, y0, 0.1), ground ? SE_GREEN : SE_GLASS, hint)
    if (!ground) poly(q(w + 0.35, 0.12, y0 + h + 0.2, 0.12), tone(stone, 0.95), hint)
  }
  for (let i = 0; i < SE_RING.length; i++) {
    const a = SE_RING[i], b = SE_RING[(i + 1) % SE_RING.length]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (L < 4) continue
    const u: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nrm: P2 = [u[1] * sa, -u[0] * sa]
    const nb = Math.max(1, Math.round((L - 1) / SE_BAY)), bl = L / nb
    for (let k = 0; k < nb; k++) {
      const c: P2 = [a[0] + u[0] * (k + 0.5) * bl, a[1] + u[1] * (k + 0.5) * bl]
      // skip the bays the portico stands in front of
      const rel = (c[0] - SE_FRONT_A[0]) * fu[0] + (c[1] - SE_FRONT_A[1]) * fu[1], off = (c[0] - SE_FRONT_A[0]) * fn[0] + (c[1] - SE_FRONT_A[1]) * fn[1]
      if (Math.abs(off) < 1.2 && rel > SE_PORT_U0 - 0.5 && rel < SE_PORT_U1 + 0.5) continue
      win(c, u, nrm, SE_FLOORS_Y[0], SE_WIN_W, SE_WIN_H1, true)
      win(c, u, nrm, SE_FLOORS_Y[1], SE_WIN_W, SE_WIN_H2, false)
      win(c, u, nrm, SE_FLOORS_Y[2], SE_WIN_W, SE_WIN_H2, false)
    }
  }

  // ---- the portico: four columns under an entablature and a flat pediment, three green doors behind
  const EN = (u: number, v: number): P2 => [SE_FRONT_A[0] + fu[0] * u + fn[0] * v, SE_FRONT_A[1] + fu[1] * u + fn[1] * v]
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const pw = SE_PORT_U1 - SE_PORT_U0, pm = (SE_PORT_U0 + SE_PORT_U1) / 2
  pr(rect(SE_PORT_U0, SE_PORT_U1, 0, 0.5), 0, SE_PORT_H - 1.1, tone(stone, 0.92), null)      // recess
  for (let k = 0; k < 3; k++) {
    const u = SE_PORT_U0 + pw * (k + 0.5) / 3, c = EN(u, 0.52)
    const q = (ww: number, hh: number, off: number): V3[] => [at(c, fu, fn, -ww / 2, 0.4, off), at(c, fu, fn, ww / 2, 0.4, off), at(c, fu, fn, ww / 2, 0.4 + hh, off), at(c, fu, fn, -ww / 2, 0.4 + hh, off)]
    poly(q(2.0, 4.6, 0.03), SE_GREEN, [fn[0], fn[1], 0])
  }
  for (let k = 0; k < SE_COLS; k++) {
    const u = SE_PORT_U0 + 0.5 + (pw - 1.0) * k / (SE_COLS - 1), c = EN(u, SE_PORT_D - 0.5)
    pr([[c[0] - 0.42, c[1] - 0.42], [c[0] + 0.42, c[1] - 0.42], [c[0] + 0.42, c[1] + 0.42], [c[0] - 0.42, c[1] + 0.42]], 0, SE_PORT_H - 1.1, tone(stone, 1.03), tone(stone, 0.9))
    pr([[c[0] - 0.6, c[1] - 0.6], [c[0] + 0.6, c[1] - 0.6], [c[0] + 0.6, c[1] + 0.6], [c[0] - 0.6, c[1] + 0.6]], SE_PORT_H - 1.5, SE_PORT_H - 1.1, tone(stone, 1.08), null)
  }
  pr(rect(SE_PORT_U0 - 0.4, SE_PORT_U1 + 0.4, 0, SE_PORT_D + 0.2), SE_PORT_H - 1.1, SE_PORT_H, tone(stone, 1.06), tone(stone, 0.9))   // entablature
  const pedFace = (c: P2, u: P2, nrm: P2, w: number, y0: number, h: number, d: number): void => {
    const hint: V3 = [nrm[0], nrm[1], 0]
    poly([at(c, u, nrm, -w / 2, y0, d), at(c, u, nrm, w / 2, y0, d), at(c, u, nrm, 0, y0 + h, d)], stone, hint)
    poly([at(c, u, nrm, -w / 2 + 0.5, y0 + 0.2, d + 0.05), at(c, u, nrm, w / 2 - 0.5, y0 + 0.2, d + 0.05), at(c, u, nrm, 0, y0 + h - 0.5, d + 0.05)], tone(stone, 0.9), hint)
  }
  pedFace(EN(pm, SE_PORT_D + 0.2), fu, fn, pw + 0.8, SE_PORT_H, SE_PED_H, 0)
  const pr0 = EN(SE_PORT_U0 - 0.4, 0), pr1 = EN(SE_PORT_U1 + 0.4, 0), tp = EN(pm, 0)
  // slate flanks of the pediment roof, running back into the wall
  poly([[pr0[0], pr0[1], SE_PORT_H], [pr0[0] + fn[0] * (SE_PORT_D + 0.2), pr0[1] + fn[1] * (SE_PORT_D + 0.2), SE_PORT_H], [tp[0] + fn[0] * (SE_PORT_D + 0.2), tp[1] + fn[1] * (SE_PORT_D + 0.2), SE_PORT_H + SE_PED_H], [tp[0], tp[1], SE_PORT_H + SE_PED_H]], SE_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 0.8])
  poly([[pr1[0] + fn[0] * (SE_PORT_D + 0.2), pr1[1] + fn[1] * (SE_PORT_D + 0.2), SE_PORT_H], [pr1[0], pr1[1], SE_PORT_H], [tp[0], tp[1], SE_PORT_H + SE_PED_H], [tp[0] + fn[0] * (SE_PORT_D + 0.2), tp[1] + fn[1] * (SE_PORT_D + 0.2), SE_PORT_H + SE_PED_H]], SE_SLATE, [fu[0] * 0.5, fu[1] * 0.5, 0.8])

  // ---- the belfry behind the portico: square shaft, lattice screens in recessed panels, a pediment on each face, a cross
  const tc = EN(SE_TOWER_U, -SE_TOWER_V), tw = SE_TOWER_W, h2 = tw / 2
  const tring = (k: number): P2[] => [[tc[0] - h2 - k, tc[1] - h2 - k], [tc[0] + h2 + k, tc[1] - h2 - k], [tc[0] + h2 + k, tc[1] + h2 + k], [tc[0] - h2 - k, tc[1] + h2 + k]]
  pr(tring(0), SE_EAVE, SE_TOWER_TOP, stone, null, 1.6)
  pr(tring(0.3), SE_BELFRY_Y - 1.0, SE_BELFRY_Y - 0.6, tone(stone, 1.06), tone(stone, 0.9))
  pr(tring(0.35), SE_TOWER_TOP - 0.8, SE_TOWER_TOP, tone(stone, 1.06), tone(stone, 0.9))
  const faces: { c: P2; u: P2; nrm: P2 }[] = [
    { c: [tc[0], tc[1] + h2], u: [1, 0], nrm: [0, 1] }, { c: [tc[0], tc[1] - h2], u: [-1, 0], nrm: [0, -1] },
    { c: [tc[0] - h2, tc[1]], u: [0, 1], nrm: [-1, 0] }, { c: [tc[0] + h2, tc[1]], u: [0, -1], nrm: [1, 0] }]
  for (const f of faces) {
    const hint: V3 = [f.nrm[0], f.nrm[1], 0]
    // two lattice panels (dark grille) either side of the middle pilaster
    for (const s of [-1, 1]) {
      const cc: P2 = [f.c[0] + f.u[0] * s * 1.15, f.c[1] + f.u[1] * s * 1.15]
      poly([at(cc, f.u, f.nrm, -0.7, SE_BELFRY_Y + 0.4, 0.1), at(cc, f.u, f.nrm, 0.7, SE_BELFRY_Y + 0.4, 0.1), at(cc, f.u, f.nrm, 0.7, SE_TOWER_TOP - 1.9, 0.1), at(cc, f.u, f.nrm, -0.7, SE_TOWER_TOP - 1.9, 0.1)], [0.42, 0.45, 0.47], hint)
    }
    pedFace(f.c, f.u, f.nrm, tw + 0.8, SE_TOWER_TOP, SE_TOWER_PED, 0.18)
  }
  // the pyramid of slate behind the four pediments and the cross
  const [sx, sy, sz] = F.p(tc[0], tc[1], SE_TOWER_TOP)
  prism(out, sx, sz, sy, sy + SE_TOWER_PED * 0.95, tw * 0.62, 4, SE_SLATE, Math.PI / 4, 0.3)
  box(out, sx, sy + SE_TOWER_PED + 0.9, sz, 0.08, 0.9, 0.08, hex('#3c3c3c'), 0)
  box(out, sx, sy + SE_TOWER_PED + 1.2, sz, 0.4, 0.08, 0.08, hex('#3c3c3c'), 0)
}

// ───────────────────────────── Temple de la Rédemption (way/69220900), 16 rue Chauchat ─────────────────────────────
// Lutheran church (Paris 9e, 1840s, facade by Gau/Lacroix school; MH 1958). Read off Commons photographs
// (docs/landmarks/refs/redemption/: P1030037_Paris.jpg the front from the south-west, Plan_du_Temple.jpg the plan —
// an E-W nave 2:1, apse at the far end): a flat stone front under a low pediment, with a colossal round arch of
// radiating voussoirs rising into the pediment; inside it a recessed tympanum, an Ionic-ish portico of two columns
// carrying an inscribed entablature and a segmental cap, a round-headed red door; rusticated courses on the flanks;
// iron railing on a low plinth; a small stone lantern with a pyramid cap on the ridge. Plan = OSM's, in metres east/north
// of (2.332 + 589/73228, 48.8605 + 1475/111320); the street (rue Chauchat) runs along the WEST edge, front faces west.
const RD_RING: P2[] = [[-20.1, -12.4], [14.4, -16.7], [16.1, -3.7], [17.3, -3.8], [17.6, -0.6], [16.4, -0.4], [16.6, 1.4], [17.4, 2.1], [17.3, 6.2],
  [9.9, 7.5], [9.9, 11.2], [3.2, 11.4], [3.2, 7.6], [-19.2, 8.5], [-17.1, 8.3], [-17.3, 6.5], [-18.2, 2.2], [-15.6, 1.8], [-16.2, -2.8], [-16.9, -8.2], [-19.5, -8.0]]
const RD_FA: P2 = [-20.0, -12.4], RD_FB: P2 = [-19.2, 8.4]   // the front plane, south to north (outward = west)
const RD_STONE: Rgb = [0.63, 0.58, 0.47]
const RD_SLATE: Rgb = [0.30, 0.31, 0.34]
const RD_DOOR: Rgb = [0.50, 0.10, 0.14]
const RD_IRON: Rgb = [0.07, 0.07, 0.08]
const RD_EAVE = 9.0           // cornice height
const RD_PED = 3.6            // pediment rise
const RD_NAVE_L = 27.0        // gable roof depth from the front
const RD_ARCH_R = 4.5         // intrados radius of the colossal arch
const RD_ARCH_B = 1.15        // voussoir band thickness
const RD_ARCH_Y = 3.0         // springing height
const RD_COL_DX = 1.95        // column offset from the axis
const RD_COL_R = 0.42
const RD_COL_H = 4.2
const RD_PORT_D = 1.15        // column centre depth in front of the wall
const RD_DOOR_W = 2.4
const RD_DOOR_H = 4.2         // to the apex
const RD_COURSE = 0.85        // rustication course height on the flanks
const RD_RAIL_D = 2.7         // railing distance from the front
const RD_RAIL_H = 1.8
const RD_BAR = 0.36           // bar spacing
const RD_LANT = 2.1           // lantern width
const RD_LANT_V = 9.0         // lantern distance behind the front
const RD_WIN_W = 1.7
const RD_WIN_H = 4.8
const RD_WIN_Y = 2.6
const RD_WIN_PITCH = 4.2

export function templeRedemption(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RD_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const stone = RD_STONE
  const L = Math.hypot(RD_FB[0] - RD_FA[0], RD_FB[1] - RD_FA[1])
  const fu: P2 = [(RD_FB[0] - RD_FA[0]) / L, (RD_FB[1] - RD_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [RD_FA[0] + fu[0] * u + fn[0] * v, RD_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], mid = L / 2
  const sa = RD_RING.reduce((s, p, i) => { const q = RD_RING[(i + 1) % RD_RING.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) > 0 ? 1 : -1

  // ---- the body: the front block and the OSM plan (rear halls, annexes) at a lower height
  pr(rect(0, L, -RD_NAVE_L - 4, 0), 0, RD_EAVE, stone, null, 1.5)
  pr(RD_RING, 0, RD_EAVE - 0.5, stone, RD_SLATE, 1.5)
  pr(rect(-0.35, L + 0.35, -RD_NAVE_L - 4, 0.45), RD_EAVE - 0.65, RD_EAVE, tone(stone, 1.07), tone(stone, 0.9))   // cornice
  // gable roof: two slate slopes over the nave and the back gable
  const top = RD_EAVE + RD_PED, nl = -RD_NAVE_L
  poly([P(-0.3, 0.5, RD_EAVE - 0.3), P(-0.3, nl, RD_EAVE - 0.3), P(mid, nl, top), P(mid, 0.5, top)], RD_SLATE, [-fu[0] * 0.45, -fu[1] * 0.45, 0.9])
  poly([P(L + 0.3, nl, RD_EAVE - 0.3), P(L + 0.3, 0.5, RD_EAVE - 0.3), P(mid, 0.5, top), P(mid, nl, top)], RD_SLATE, [fu[0] * 0.45, fu[1] * 0.45, 0.9])
  poly([P(0, nl, RD_EAVE), P(L, nl, RD_EAVE), P(mid, nl, top)], stone, [-fn[0], -fn[1], 0])

  // ---- front: flank rustication, pediment, colossal arch, tympanum, portico, door
  const flank = (u0: number, u1: number): void => {
    for (let y = RD_COURSE; y < RD_EAVE - 0.6; y += RD_COURSE) poly([P(u0, 0.04, y), P(u1, 0.04, y), P(u1, 0.04, y + 0.07), P(u0, 0.04, y + 0.07)], tone(stone, 0.68), hint)
  }
  const aw = RD_ARCH_R + RD_ARCH_B
  flank(0, mid - aw); flank(mid + aw, L)
  // pediment: raking cornice and tympanum field
  poly([P(-0.5, 0.2, RD_EAVE - 0.25), P(L + 0.5, 0.2, RD_EAVE - 0.25), P(mid, 0.2, top + 0.6)], tone(stone, 1.1), hint)
  poly([P(0.7, 0.24, RD_EAVE + 0.1), P(L - 0.7, 0.24, RD_EAVE + 0.1), P(mid, 0.24, top - 0.15)], tone(stone, 0.95), hint)
  // arch: straight jambs then radiating voussoirs
  const N = 22, ay = RD_ARCH_Y
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI - (Math.PI * i) / N, a1 = Math.PI - (Math.PI * (i + 1)) / N, f = i % 2 ? 1.07 : 0.93
    const q = (a: number, r: number): V3 => P(mid + Math.cos(a) * r, 0.16, ay + Math.sin(a) * r)
    poly([q(a0, RD_ARCH_R), q(a0, aw), q(a1, aw), q(a1, RD_ARCH_R)], tone(stone, f), hint)
  }
  for (const s of [-1, 1]) for (let y = 0.4, k = 0; y < ay; y += RD_COURSE, k++) {
    const y1 = Math.min(ay, y + RD_COURSE - 0.06), f = k % 2 ? 1.05 : 0.94
    poly([P(mid + s * RD_ARCH_R, 0.16, y), P(mid + s * aw, 0.16, y), P(mid + s * aw, 0.16, y1), P(mid + s * RD_ARCH_R, 0.16, y1)], tone(stone, f), hint)
  }
  // recessed tympanum: darker, rectangle + semicircle
  const tym: V3[] = [P(mid - RD_ARCH_R, 0.1, 0.3), P(mid + RD_ARCH_R, 0.1, 0.3)]
  for (let i = 0; i <= 14; i++) { const a = (Math.PI * i) / 14; tym.push(P(mid + Math.cos(a) * RD_ARCH_R, 0.1, ay + Math.sin(a) * RD_ARCH_R)) }
  poly(tym, tone(stone, 0.8), hint)
  // door: round-headed, with a pale archivolt
  const door = (w: number, h: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(mid - r, v, 0.5), P(mid + r, v, 0.5)]
    for (let i = 0; i <= 10; i++) { const a = (Math.PI * i) / 10; pts.push(P(mid + Math.cos(a) * r, v, 0.5 + h - r + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }
  door(RD_DOOR_W + 0.55, RD_DOOR_H + 0.3, 0.12, tone(stone, 1.12))
  door(RD_DOOR_W, RD_DOOR_H, 0.16, RD_DOOR)
  // portico: two columns, entablature with its inscription, a segmental cap
  const octa = (c: P2, r: number): P2[] => Array.from({ length: 8 }, (_, i) => [c[0] + Math.cos((i / 8) * Math.PI * 2 + Math.PI / 8) * r, c[1] + Math.sin((i / 8) * Math.PI * 2 + Math.PI / 8) * r] as P2)
  for (const s of [-1, 1]) {
    const c = EN(mid + s * RD_COL_DX, -0.0 + RD_PORT_D)
    pr(octa(c, RD_COL_R), 0.3, RD_COL_H, tone(stone, 1.02), tone(stone, 0.9))
    pr(octa(c, RD_COL_R * 1.35), 0, 0.3, tone(stone, 1.06), null)
    pr(octa(c, RD_COL_R * 1.35), RD_COL_H, RD_COL_H + 0.25, tone(stone, 1.08), null)
  }
  const pw = RD_COL_DX + 0.75
  pr(rect(mid - pw, mid + pw, 0, RD_PORT_D + 0.55), RD_COL_H + 0.25, RD_COL_H + 1.35, tone(stone, 1.05), tone(stone, 0.9))
  const fv = RD_PORT_D + 0.58
  poly([P(mid - pw + 0.4, fv, RD_COL_H + 0.45), P(mid + pw - 0.4, fv, RD_COL_H + 0.45), P(mid + pw - 0.4, fv, RD_COL_H + 1.1), P(mid - pw + 0.4, fv, RD_COL_H + 1.1)], tone(stone, 0.72), hint)
  const cap: V3[] = [P(mid - pw, fv, RD_COL_H + 1.35), P(mid + pw, fv, RD_COL_H + 1.35)]
  for (let i = 0; i <= 10; i++) { const t = i / 10, a = Math.PI * t; cap.push(P(mid + pw * Math.cos(a), fv, RD_COL_H + 1.35 + 1.0 * Math.sin(a))) }
  poly(cap, tone(stone, 1.08), hint)
  // railing on a low plinth, open at the door
  const rd = RD_RAIL_D
  pr(rect(0, L, rd - 0.15, rd + 0.15), 0, 0.5, tone(stone, 1.0), tone(stone, 1.1))
  for (let u = 0.3; u < L; u += RD_BAR) {
    if (Math.abs(u - mid) < 1.5) continue
    const c = EN(u, rd); pr([[c[0] - 0.03, c[1] - 0.03], [c[0] + 0.03, c[1] - 0.03], [c[0] + 0.03, c[1] + 0.03], [c[0] - 0.03, c[1] + 0.03]], 0.5, RD_RAIL_H, RD_IRON, RD_IRON)
  }
  for (const y of [0.7, RD_RAIL_H - 0.05]) pr(rect(0, L, rd - 0.04, rd + 0.04), y, y + 0.07, RD_IRON, RD_IRON)

  // ---- lantern on the ridge: stone drum, dark arched openings, a pyramid cap and a cross
  const lc = EN(mid, -RD_LANT_V), h = RD_LANT / 2, ly = top - 0.2
  pr([[lc[0] - h, lc[1] - h], [lc[0] + h, lc[1] - h], [lc[0] + h, lc[1] + h], [lc[0] - h, lc[1] + h]], ly, ly + 2.4, stone, tone(stone, 0.9), 1.5)
  for (const [nx, ny] of [fn, [-fn[0], -fn[1]], fu, [-fu[0], -fu[1]]] as P2[]) {
    const ux = -ny, uy = nx, q = (t: number, y: number): V3 => [lc[0] + nx * (h + 0.03) + ux * t, lc[1] + ny * (h + 0.03) + uy * t, y]
    poly([q(-0.5, ly + 0.6), q(0.5, ly + 0.6), q(0.5, ly + 1.9), q(-0.5, ly + 1.9)], [0.12, 0.12, 0.13], [nx, ny, 0])
  }
  const [lx, lyy, lz] = F.p(lc[0], lc[1], ly + 2.4)
  prism(out, lx, lz, lyy, lyy + 1.1, h * 1.25, 4, RD_SLATE, Math.PI / 4, 0.25)
  box(out, lx, lyy + 1.6, lz, 0.06, 0.5, 0.06, hex('#3c3c3c'), 0)
  box(out, lx, lyy + 1.8, lz, 0.3, 0.06, 0.06, hex('#3c3c3c'), 0)

  // ---- tall round-headed windows along the long OSM walls
  for (let i = 0; i < RD_RING.length; i++) {
    const a = RD_RING[i], b = RD_RING[(i + 1) % RD_RING.length], Le = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (Le < 8) continue
    const u: P2 = [(b[0] - a[0]) / Le, (b[1] - a[1]) / Le], nrm: P2 = [u[1] * sa, -u[0] * sa]
    if (nrm[0] < -0.8 && Math.abs(a[0] - RD_FA[0]) < 4) continue          // the front itself
    const nb = Math.max(1, Math.floor((Le - 2) / RD_WIN_PITCH))
    for (let k = 0; k < nb; k++) {
      const t = (Le - (nb - 1) * RD_WIN_PITCH) / 2 + k * RD_WIN_PITCH, c: P2 = [a[0] + u[0] * t, a[1] + u[1] * t]
      const win = (w: number, hh: number, y0: number, off: number, col: Rgb): void => {
        const r = w / 2, pts: V3[] = [[c[0] - u[0] * r + nrm[0] * off, c[1] - u[1] * r + nrm[1] * off, y0], [c[0] + u[0] * r + nrm[0] * off, c[1] + u[1] * r + nrm[1] * off, y0]]
        for (let j = 0; j <= 8; j++) { const an = (Math.PI * j) / 8; pts.push([c[0] + u[0] * Math.cos(an) * r + nrm[0] * off, c[1] + u[1] * Math.cos(an) * r + nrm[1] * off, y0 + hh - r + Math.sin(an) * r]) }
        poly(pts, col, [nrm[0], nrm[1], 0])
      }
      win(RD_WIN_W + 0.5, RD_WIN_H + 0.3, RD_WIN_Y - 0.15, 0.04, tone(stone, 1.12))
      win(RD_WIN_W, RD_WIN_H, RD_WIN_Y, 0.08, [0.15, 0.18, 0.24])
    }
  }
}

// ───────────────────────────── Temple protestant de Pentemont (way/67353449) ─────────────────────────────
// The former abbey church of Panthemont (Contant d'Ivry, 1747-56), 106 rue de Grenelle. Read off Commons photographs
// (docs/landmarks/refs/pentemont/ ref-a, ref-b, 2026-11-04): a flat pale-limestone front under a low pediment, a round-
// arched portal with two free columns and a segmental hood, small side doors with triangular hoods, round oculi, a taller
// curved attic with a glazed half-round window behind, and a slate dome on a drum with oculi and a lantern. Plan = OSM's,
// in metres east/north of (2.332 − 742/73228, 48.8605 − 450/111320); rue de Grenelle runs along the SSW edge, front faces SSW.
const PM_RING: P2[] = [[8.6, 18.9], [8.2, 18.8], [7.7, 18.7], [7.3, 18.4], [7, 18.1], [6.6, 17.6], [1.8, 10], [-3.9, 13.8], [-15.4, -4.5], [-17.4, -7.7], [-13.1, -10.4],
  [-2.2, -17.2], [3.8, -20], [9.5, -11.3], [17, 0.4], [11.2, 4.1], [16, 11.6], [16.3, 12.3], [16.4, 13.4], [16.1, 14.6], [15.7, 15.1], [9.9, 18.7], [9, 19]]
const PM_FA: P2 = [3.8, -20], PM_FB: P2 = [-17.4, -7.7]      // the front plane, east to west (outward = SSW)
const PM_STONE: Rgb = [0.74, 0.67, 0.52]
const PM_SLATE: Rgb = [0.28, 0.30, 0.34]
const PM_DOOR: Rgb = [0.12, 0.17, 0.15]
const PM_IRON: Rgb = [0.07, 0.07, 0.08]
const PM_EAVE = 11.5          // front cornice height
const PM_PED = 2.6            // pediment rise
const PM_BLOCK_D = 25.0       // depth of the main block behind the front
const PM_ATTIC_H = 4.6        // curved attic above the cornice
const PM_ATTIC_U0 = 0.2       // attic span as fractions of the front width
const PM_ATTIC_U1 = 0.8
const PM_ATTIC_ARC = 0.45     // height of the attic's curved top as a fraction of its half-width
const PM_ATTIC_D = 6.0        // attic depth behind the front
const PM_DOOR_W = 2.3
const PM_DOOR_H = 5.0
const PM_COL_DX = 2.1         // portal column offset from the axis
const PM_COL_R = 0.42
const PM_COL_H = 6.4
const PM_COL_D = 0.9          // column projection
const PM_SIDE_DX = 7.4        // side door offset from the axis
const PM_SIDE_W = 1.5
const PM_SIDE_H = 3.6
const PM_OCULUS_R = 0.8
const PM_OCULUS_Y = 8.6
const PM_COURSE = 1.1         // ashlar joint spacing on the front
const PM_DRUM_R = 6.2
const PM_DRUM_Y0 = 12.5       // drum base (inside the main roof)
const PM_DRUM_Y1 = 16.5
const PM_DOME_H = 4.6
const PM_DOME_V = 12.0        // dome axis distance behind the front
const PM_LANT_H = 2.6
const PM_WIN_PITCH = 5.2
const PM_WIN_W = 1.5
const PM_WIN_H = 4.6
const PM_WIN_Y = 2.4

export function templePentemont(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(PM_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const stone = PM_STONE, slate = PM_SLATE
  const L = Math.hypot(PM_FB[0] - PM_FA[0], PM_FB[1] - PM_FA[1])
  const fu: P2 = [(PM_FB[0] - PM_FA[0]) / L, (PM_FB[1] - PM_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [PM_FA[0] + fu[0] * u + fn[0] * v, PM_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], mid = L / 2
  const sa = PM_RING.reduce((s, p, i) => { const q = PM_RING[(i + 1) % PM_RING.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) > 0 ? 1 : -1

  // ---- body: main block to the cornice, the OSM plan (rear annexes, apse) a little lower, a flat lead-grey top
  pr(rect(0, L, -PM_BLOCK_D, 0), 0, PM_EAVE, stone, slate, 1.5)
  pr(PM_RING, 0, PM_EAVE - 2.5, stone, slate, 1.5)
  pr(rect(-0.3, L + 0.3, -PM_BLOCK_D - 0.3, 0.4), PM_EAVE - 0.6, PM_EAVE, tone(stone, 1.07), tone(stone, 0.9))   // cornice
  pr(rect(-0.3, L + 0.3, -PM_BLOCK_D - 0.3, 0.4), PM_EAVE - 0.6, PM_EAVE, tone(stone, 1.07), tone(stone, 0.9))

  // ---- front: pilasters, ashlar joints, pediment, curved attic with its glazed half-round window
  for (const u of [0.25, L - 0.25]) pr(rect(u - 0.55, u + 0.55, 0, 0.2), 0, PM_EAVE - 0.6, tone(stone, 1.05), tone(stone, 1.05))
  for (let y = PM_COURSE; y < PM_EAVE - 0.8; y += PM_COURSE) poly([P(0.8, 0.03, y), P(L - 0.8, 0.03, y), P(L - 0.8, 0.03, y + 0.06), P(0.8, 0.03, y + 0.06)], tone(stone, 0.72), hint)
  poly([P(-0.4, 0.3, PM_EAVE - 0.4), P(L + 0.4, 0.3, PM_EAVE - 0.4), P(mid, 0.3, PM_EAVE + PM_PED)], tone(stone, 1.1), hint)
  poly([P(0.9, 0.34, PM_EAVE), P(L - 0.9, 0.34, PM_EAVE), P(mid, 0.34, PM_EAVE + PM_PED - 0.45)], tone(stone, 0.93), hint)
  const a0 = L * PM_ATTIC_U0, a1 = L * PM_ATTIC_U1, am = (a0 + a1) / 2, ar = (a1 - a0) / 2
  pr(rect(a0, a1, -PM_ATTIC_D, -0.2), PM_EAVE - 0.3, PM_EAVE + PM_ATTIC_H, stone, slate, 1.5)
  const NA = 14
  const arc = (r: number, v: number, y0: number): V3[] => Array.from({ length: NA + 1 }, (_, i) => { const a = (Math.PI * i) / NA; return P(am + Math.cos(a) * r, v, y0 + Math.sin(a) * r * PM_ATTIC_ARC) })
  poly(arc(ar, -0.2, PM_EAVE + PM_ATTIC_H), tone(stone, 1.0), hint)
  poly(arc(ar - 0.9, -0.17, PM_EAVE + 0.8), [0.20, 0.26, 0.32], hint)
  // ---- round-arched portal: free columns, hood, tall door; side doors with triangular hoods; oculi
  const door = (cu: number, w: number, h: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(cu - r, v, 0.35), P(cu + r, v, 0.35)]
    for (let i = 0; i <= 10; i++) { const a = (Math.PI * i) / 10; pts.push(P(cu + Math.cos(a) * r, v, 0.35 + h - r + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }
  door(mid, PM_DOOR_W + 1.0, PM_DOOR_H + 0.8, 0.12, tone(stone, 1.12))
  door(mid, PM_DOOR_W, PM_DOOR_H, 0.16, PM_DOOR)
  const octa = (c: P2, r: number): P2[] => Array.from({ length: 8 }, (_, i) => [c[0] + Math.cos((i / 8) * Math.PI * 2 + Math.PI / 8) * r, c[1] + Math.sin((i / 8) * Math.PI * 2 + Math.PI / 8) * r] as P2)
  for (const s of [-1, 1]) {
    const c = EN(mid + s * PM_COL_DX, PM_COL_D)
    pr(octa(c, PM_COL_R * 1.3), 0, 0.4, tone(stone, 1.06), null)
    pr(octa(c, PM_COL_R), 0.4, PM_COL_H, tone(stone, 1.03), tone(stone, 0.92))
    pr(octa(c, PM_COL_R * 1.4), PM_COL_H, PM_COL_H + 0.35, tone(stone, 1.08), null)
  }
  const pw = PM_COL_DX + 0.7
  pr(rect(mid - pw, mid + pw, 0, PM_COL_D + 0.4), PM_COL_H + 0.35, PM_COL_H + 1.2, tone(stone, 1.06), tone(stone, 0.92))
  const hv = PM_COL_D + 0.43, hood: V3[] = [P(mid - pw, hv, PM_COL_H + 1.2), P(mid + pw, hv, PM_COL_H + 1.2)]
  for (let i = 0; i <= 10; i++) { const a = (Math.PI * i) / 10; hood.push(P(mid + pw * Math.cos(a), hv, PM_COL_H + 1.2 + 1.5 * Math.sin(a))) }
  poly(hood, tone(stone, 1.08), hint)
  for (const s of [-1, 1]) {
    const cu = mid + s * PM_SIDE_DX
    door(cu, PM_SIDE_W + 0.5, PM_SIDE_H + 0.4, 0.1, tone(stone, 1.1))
    poly([P(cu - PM_SIDE_W / 2, 0.14, 0.4), P(cu + PM_SIDE_W / 2, 0.14, 0.4), P(cu + PM_SIDE_W / 2, 0.14, PM_SIDE_H + 0.2), P(cu - PM_SIDE_W / 2, 0.14, PM_SIDE_H + 0.2)], PM_IRON, hint)
    poly([P(cu - PM_SIDE_W / 2 - 0.5, 0.45, PM_SIDE_H + 0.5), P(cu + PM_SIDE_W / 2 + 0.5, 0.45, PM_SIDE_H + 0.5), P(cu, 0.45, PM_SIDE_H + 1.4)], tone(stone, 1.1), hint)
    const oc = EN(cu + s * 0.2, 0.06), pts: V3[] = []
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push([oc[0] + fu[0] * Math.cos(a) * PM_OCULUS_R, oc[1] + fu[1] * Math.cos(a) * PM_OCULUS_R, PM_OCULUS_Y + Math.sin(a) * PM_OCULUS_R]) }
    poly(pts, [0.12, 0.14, 0.17], hint)
  }

  // ---- slate dome on a drum with arched oculi, a lantern and a vane
  const dc = EN(mid, -PM_DOME_V)
  const [dx, , dz] = F.p(dc[0], dc[1], 0)
  prism(out, dx, dz, PM_DRUM_Y0, PM_DRUM_Y1, PM_DRUM_R, 16, tone(stone, 1.0))
  prism(out, dx, dz, PM_DRUM_Y1 - 0.4, PM_DRUM_Y1 + 0.3, PM_DRUM_R + 0.35, 16, tone(stone, 1.08))
  const rings = 5
  for (let k = 0; k < rings; k++) {
    const t0 = k / rings, t1 = (k + 1) / rings
    const r0 = PM_DRUM_R * Math.cos(t0 * 1.15), r1 = PM_DRUM_R * Math.cos(t1 * 1.15)
    prism(out, dx, dz, PM_DRUM_Y1 + 0.3 + PM_DOME_H * Math.sin(t0 * 1.15) / Math.sin(1.15), PM_DRUM_Y1 + 0.3 + PM_DOME_H * Math.sin(t1 * 1.15) / Math.sin(1.15), r0 + 0.1, 16, slate, undefined, r1 + 0.1, k === rings - 1)
  }
  const top = PM_DRUM_Y1 + 0.3 + PM_DOME_H
  for (let i = 0; i < 8; i++) {                                                // oculi on the drum
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const c: P2 = [dc[0] + Math.cos(a) * (PM_DRUM_R * 0.98), dc[1] + Math.sin(a) * (PM_DRUM_R * 0.98)], tu: P2 = [-Math.sin(a), Math.cos(a)]
    const pts: V3[] = [[c[0] - tu[0] * 0.9, c[1] - tu[1] * 0.9, PM_DRUM_Y0 + 1.4], [c[0] + tu[0] * 0.9, c[1] + tu[1] * 0.9, PM_DRUM_Y0 + 1.4]]
    for (let j = 0; j <= 8; j++) { const an = (Math.PI * j) / 8; pts.push([c[0] + tu[0] * Math.cos(an) * 0.9, c[1] + tu[1] * Math.cos(an) * 0.9, PM_DRUM_Y0 + 1.4 + 1.3 + Math.sin(an) * 0.9]) }
    poly(pts, [0.16, 0.19, 0.24], [Math.cos(a), Math.sin(a), 0])
  }
  prism(out, dx, dz, top, top + PM_LANT_H, 1.1, 8, tone(stone, 1.05), undefined, 0.9)
  prism(out, dx, dz, top + PM_LANT_H, top + PM_LANT_H + 1.1, 1.0, 8, slate, undefined, 0.05)
  box(out, dx, top + PM_LANT_H + 1.9, dz, 0.05, 0.9, 0.05, hex('#3c3c3c'), 0)

  // ---- tall rectangular barred windows along the long OSM walls, each with a small triangular hood
  for (let i = 0; i < PM_RING.length; i++) {
    const a = PM_RING[i], b = PM_RING[(i + 1) % PM_RING.length], Le = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (Le < 8) continue
    const u: P2 = [(b[0] - a[0]) / Le, (b[1] - a[1]) / Le], nrm: P2 = [u[1] * sa, -u[0] * sa]
    if (nrm[0] * fn[0] + nrm[1] * fn[1] > 0.8) continue                         // the front itself
    const nb = Math.max(1, Math.floor((Le - 2) / PM_WIN_PITCH))
    for (let k = 0; k < nb; k++) {
      const t = (Le - (nb - 1) * PM_WIN_PITCH) / 2 + k * PM_WIN_PITCH, c: P2 = [a[0] + u[0] * t, a[1] + u[1] * t]
      const q = (du: number, y: number, off: number): V3 => [c[0] + u[0] * du + nrm[0] * off, c[1] + u[1] * du + nrm[1] * off, y]
      const w = PM_WIN_W / 2
      poly([q(-w - 0.25, PM_WIN_Y - 0.2, 0.04), q(w + 0.25, PM_WIN_Y - 0.2, 0.04), q(w + 0.25, PM_WIN_Y + PM_WIN_H + 0.2, 0.04), q(-w - 0.25, PM_WIN_Y + PM_WIN_H + 0.2, 0.04)], tone(stone, 1.12), [nrm[0], nrm[1], 0])
      poly([q(-w, PM_WIN_Y, 0.08), q(w, PM_WIN_Y, 0.08), q(w, PM_WIN_Y + PM_WIN_H, 0.08), q(-w, PM_WIN_Y + PM_WIN_H, 0.08)], [0.14, 0.16, 0.2], [nrm[0], nrm[1], 0])
      poly([q(-w - 0.5, PM_WIN_Y + PM_WIN_H + 0.3, 0.3), q(w + 0.5, PM_WIN_Y + PM_WIN_H + 0.3, 0.3), q(0, PM_WIN_Y + PM_WIN_H + 1.2, 0.3)], tone(stone, 1.1), [nrm[0], nrm[1], 0])
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Temple de l'Annonciation (Passy), 19 rue Cortambert, 1891: a gabled nave whose street front is millstone (meulière)
// framed in cream ashlar: corner pilasters, bands, a stepped rake, a big rose window, a round-arched porch under a
// small gable hood, and a belfry on the ridge. Lower parish wings fill the rest of the plot.
// ---------------------------------------------------------------------------------------------------------------------
const AN_RING: P2[] = [[-21.99, 3.81], [-0.36, -10.76], [3.77, -14.86], [17.06, -0.71], [-11.82, 18.99]]   // OSM way/81792421, simplified (E/N)
const AN_FA: P2 = [-21.99, 3.81], AN_FB: P2 = [-11.82, 18.99]      // the street front, south to north (outward = NW)
const AN_MEUL: Rgb = [0.58, 0.40, 0.24]
const AN_MEUL_SIDE: Rgb = [0.60, 0.46, 0.31]
const AN_CREAM: Rgb = [0.80, 0.74, 0.60]
const AN_SLATE: Rgb = [0.30, 0.32, 0.36]
const AN_GW = 11.7            // gable width (the nave)
const AN_NAVE_D = 26.0        // nave depth behind the front
const AN_EAVE = 10.4          // nave eaves (gable shoulders)
const AN_RIDGE = 13.4         // ridge
const AN_WING_H = 7.6         // lower wings
const AN_PIL_W = 0.9          // corner pilaster width
const AN_BAND_Y1 = 3.9        // the two cream bands across the front
const AN_BAND_Y2 = 6.6
const AN_ROSE_Y = 9.0
const AN_ROSE_R = 2.4
const AN_PORCH_W = 6.0
const AN_PORCH_D = 1.7        // porch projection
const AN_PORCH_STEPS = 5
const AN_STEP = 0.18
const AN_ARCH_R = 2.3         // porch arch radius
const AN_ARCH_SPRING = 3.2
const AN_HOOD_Y = 5.9         // hood eaves
const AN_HOOD_RISE = 1.7
const AN_COL_R = 0.36
const AN_COL_DX = 2.35
const AN_COL_H = 3.4
const AN_DOOR_W = 2.0
const AN_DOOR_H = 2.6
const AN_BELL_W = 1.6         // belfry
const AN_BELL_H = 3.2
const AN_BELL_CAP = 1.5
const AN_TEETH = 7            // cream steps along each rake
const AN_WIN_PITCH = 4.3
const AN_WIN_W = 1.5
const AN_WIN_Y = 2.6
const AN_WIN_H = 4.8

export function templeAnnonciation(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(AN_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const cream = AN_CREAM
  const L = Math.hypot(AN_FB[0] - AN_FA[0], AN_FB[1] - AN_FA[1])
  const fu: P2 = [(AN_FB[0] - AN_FA[0]) / L, (AN_FB[1] - AN_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [AN_FA[0] + fu[0] * u + fn[0] * v, AN_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], mid = AN_GW / 2
  const sa = AN_RING.reduce((s, p, i) => { const q = AN_RING[(i + 1) % AN_RING.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) > 0 ? 1 : -1
  const uOf = (e: number, n: number): number => (e - AN_FA[0]) * fu[0] + (n - AN_FA[1]) * fu[1]

  // ---- the plot: low wings under a flat slate top, and the nave with its gabled roof
  pr(AN_RING, 0, AN_WING_H, AN_MEUL_SIDE, AN_SLATE, 0.9, 0.12)
  const ridgeAt = (e: number, n: number): number => AN_EAVE + (AN_RIDGE - AN_EAVE) * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / mid)
  pr(rect(0, AN_GW, -AN_NAVE_D, 0), 0, ridgeAt, AN_MEUL, AN_SLATE, 0.5, 0.18)

  // ---- front: cream plinth, corner pilasters, two bands, stepped rake
  poly([P(0, 0.12, 0), P(AN_GW, 0.12, 0), P(AN_GW, 0.12, 0.9), P(0, 0.12, 0.9)], tone(cream, 0.95), hint)
  for (const u0 of [0, AN_GW - AN_PIL_W]) pr(rect(u0, u0 + AN_PIL_W, 0, 0.18), 0, AN_EAVE - 0.4, tone(cream, 1.03), tone(cream, 0.9))
  for (const y of [AN_BAND_Y1, AN_BAND_Y2]) poly([P(AN_PIL_W, 0.1, y), P(AN_GW - AN_PIL_W, 0.1, y), P(AN_GW - AN_PIL_W, 0.1, y + 0.32), P(AN_PIL_W, 0.1, y + 0.32)], tone(cream, 1.04), hint)
  for (const s of [0, 1]) {                                                  // the rake band, and the steps against the meulière
    const uA = s ? AN_GW : 0, uB = mid
    poly([P(uA, 0.16, AN_EAVE - 0.5), P(uB, 0.16, AN_RIDGE - 0.5), P(uB, 0.16, AN_RIDGE + 0.1), P(uA, 0.16, AN_EAVE + 0.1)], tone(cream, 1.06), hint)
    for (let k = 1; k <= AN_TEETH; k++) {
      const t = k / (AN_TEETH + 1), u = uA + (uB - uA) * t, y = AN_EAVE + (AN_RIDGE - AN_EAVE) * t - 0.5, w = (mid / (AN_TEETH + 1)) * 0.5 * (s ? -1 : 1)
      poly([P(u, 0.13, y - 0.55), P(u + w, 0.13, y - 0.55), P(u + w, 0.13, y), P(u, 0.13, y)], tone(cream, 0.98), hint)
    }
  }
  poly([P(mid - 0.45, 0.1, AN_RIDGE - 1.7), P(mid + 0.45, 0.1, AN_RIDGE - 1.7), P(mid + 0.45, 0.1, AN_RIDGE - 1.2), P(mid - 0.45, 0.1, AN_RIDGE - 1.2)], tone(cream, 0.9), hint)  // date plaque

  // ---- rose window: cream ring, dark glass, eight spokes, hub
  const disc = (r: number, v: number, col: Rgb, n = 28): void => {
    const pts: V3[] = []
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(P(mid + Math.cos(a) * r, v, AN_ROSE_Y + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }
  disc(AN_ROSE_R + 0.45, 0.14, tone(cream, 1.08))
  disc(AN_ROSE_R, 0.18, [0.14, 0.17, 0.24])
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), w = 0.11
    const q = (r: number, o: number): V3 => P(mid + c * r - s * o, 0.22, AN_ROSE_Y + s * r + c * o)
    poly([q(0.4, -w), q(AN_ROSE_R, -w), q(AN_ROSE_R, w), q(0.4, w)], tone(cream, 1.05), hint)
  }
  disc(AN_ROSE_R * 0.62, 0.2, [0.14, 0.17, 0.24]); disc(0.5, 0.25, tone(cream, 1.08))
  for (let i = 0; i < 8; i++) {                                              // inner ring of lobes
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const c = Math.cos(a) * AN_ROSE_R * 0.66, s = Math.sin(a) * AN_ROSE_R * 0.66
    const pts: V3[] = []
    for (let j = 0; j < 8; j++) { const b = (j / 8) * Math.PI * 2; pts.push(P(mid + c + Math.cos(b) * 0.28, 0.26, AN_ROSE_Y + s + Math.sin(b) * 0.28)) }
    poly(pts, [0.22, 0.28, 0.4], hint)
  }

  // ---- porch: round arch (open vault), cream frame, hood gable, two free columns, steps, door with a gilded fanlight
  const pm = mid, py0 = AN_ARCH_SPRING
  const rim = (r0: number, r1: number, v: number, col: Rgb): void => {
    const n = 14
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
      poly([P(pm + Math.cos(a0) * r0, v, py0 + Math.sin(a0) * r0), P(pm + Math.cos(a0) * r1, v, py0 + Math.sin(a0) * r1), P(pm + Math.cos(a1) * r1, v, py0 + Math.sin(a1) * r1), P(pm + Math.cos(a1) * r0, v, py0 + Math.sin(a1) * r0)], col, hint)
    }
  }
  const sh = AN_PORCH_STEPS * AN_STEP
  pr(rect(pm - AN_PORCH_W / 2, pm - AN_ARCH_R, 0, AN_PORCH_D), 0, py0, tone(cream, 1.0), tone(cream, 0.9))     // flanking piers
  pr(rect(pm + AN_ARCH_R, pm + AN_PORCH_W / 2, 0, AN_PORCH_D), 0, py0, tone(cream, 1.0), tone(cream, 0.9))
  poly([P(pm - AN_ARCH_R, 0.05, sh), P(pm + AN_ARCH_R, 0.05, sh), P(pm + AN_ARCH_R, 0.05, py0), P(pm - AN_ARCH_R, 0.05, py0)], tone(cream, 0.7), hint)   // recess back wall
  const back: V3[] = []
  for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI; back.push(P(pm + Math.cos(a) * AN_ARCH_R, 0.05, py0 + Math.sin(a) * AN_ARCH_R)) }
  poly(back, tone(cream, 0.7), hint)
  for (let i = 0; i < 14; i++) {                                              // the barrel vault soffit
    const a0 = (i / 14) * Math.PI, a1 = ((i + 1) / 14) * Math.PI, am = (a0 + a1) / 2
    const q = (a: number, v: number): V3 => P(pm + Math.cos(a) * AN_ARCH_R, v, py0 + Math.sin(a) * AN_ARCH_R)
    const n = EN(0, 0)  // unused anchor
    void n
    const inward = P(pm, 0, py0), here = q(am, 0)
    poly([q(a0, 0.05), q(a0, AN_PORCH_D), q(a1, AN_PORCH_D), q(a1, 0.05)], tone(cream, 0.78 + 0.1 * Math.sin(am)), [inward[0] - here[0], inward[1] - here[1], inward[2] - here[2]])
  }
  rim(AN_ARCH_R, AN_ARCH_R + 0.55, AN_PORCH_D + 0.02, tone(cream, 1.1))
  for (const s of [-1, 1]) poly([P(pm + s * AN_ARCH_R, AN_PORCH_D + 0.02, 0.9), P(pm + s * (AN_ARCH_R + 0.55), AN_PORCH_D + 0.02, 0.9), P(pm + s * (AN_ARCH_R + 0.55), AN_PORCH_D + 0.02, py0), P(pm + s * AN_ARCH_R, AN_PORCH_D + 0.02, py0)], tone(cream, 1.1), hint)
  const hoodAt = (e: number, n: number): number => AN_HOOD_Y + AN_HOOD_RISE * Math.max(0, 1 - Math.abs(uOf(e, n) - pm) / (AN_PORCH_W / 2 + 0.2))
  pr(rect(pm - AN_PORCH_W / 2 - 0.2, pm + AN_PORCH_W / 2 + 0.2, 0, AN_PORCH_D + 0.25), AN_HOOD_Y - 0.4, hoodAt, tone(cream, 1.08), tone(cream, 0.72))
  for (const s of [-1, 1]) {
    const c = EN(pm + s * AN_COL_DX, AN_PORCH_D - 0.15)
    pr(rectPoly(c, AN_COL_R * 1.35, 8), 0, AN_STEP * AN_PORCH_STEPS * 0 + 0.35, tone(cream, 1.04), null)
    pr(rectPoly(c, AN_COL_R, 10), 0.35, AN_COL_H, tone(cream, 1.02), tone(cream, 0.9))
    pr(rectPoly(c, AN_COL_R * 1.5, 8), AN_COL_H, AN_COL_H + 0.42, tone(cream, 1.1), tone(cream, 0.95))
  }
  for (let k = 0; k < AN_PORCH_STEPS; k++) {                                  // steps down to the street
    const d = AN_PORCH_D + 0.9 - (k * 1.0) / AN_PORCH_STEPS * 0.6
    pr(rect(pm - 2.2 - k * 0.04, pm + 2.2 + k * 0.04, 0, d + (AN_PORCH_STEPS - k) * 0.24), 0, AN_STEP * (AN_PORCH_STEPS - k), tone(cream, 0.95), tone(cream, 1.0))
  }
  const dy0 = sh, dh = AN_DOOR_H, dw = AN_DOOR_W / 2
  poly([P(pm - dw, 0.1, dy0), P(pm + dw, 0.1, dy0), P(pm + dw, 0.1, dy0 + dh), P(pm - dw, 0.1, dy0 + dh)], [0.1, 0.11, 0.1], hint)
  const fan: V3[] = [P(pm - dw, 0.1, dy0 + dh + 0.1), P(pm + dw, 0.1, dy0 + dh + 0.1)]
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; fan.push(P(pm + Math.cos(a) * dw, 0.1, dy0 + dh + 0.1 + Math.sin(a) * dw * 0.95)) }
  poly(fan, [0.72, 0.52, 0.18], hint)

  // ---- belfry on the ridge: a cream box with a round-arched louvred opening, a pyramid cap and a cross
  const b0 = AN_RIDGE - 0.4, b1 = b0 + AN_BELL_H, bw = AN_BELL_W / 2
  pr(rect(mid - bw, mid + bw, -0.2, -0.2 - AN_BELL_W), b0, b1, tone(cream, 1.04), tone(cream, 0.9))
  const bc = mid, by = b0 + 1.2
  for (const [v, h] of [[-0.18, hint], [-0.22 - AN_BELL_W, [-fn[0], -fn[1], 0] as V3]] as [number, V3][]) {
    const pts: V3[] = [P(bc - 0.4, v, by), P(bc + 0.4, v, by)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(bc + Math.cos(a) * 0.4, v, by + 1.0 + Math.sin(a) * 0.4)) }
    poly(pts, [0.12, 0.1, 0.09], h)
  }
  const capAt = (e: number, n: number): number => {
    const d = Math.max(Math.abs(uOf(e, n) - mid), Math.abs((e - EN(0, 0)[0]) * fn[0] + (n - EN(0, 0)[1]) * fn[1] + 0.2 + bw)) / (bw + 0.25)
    return b1 + AN_BELL_CAP * Math.max(0, 1 - d)
  }
  pr(rect(mid - bw - 0.25, mid + bw + 0.25, -0.2 + 0.25, -0.2 - AN_BELL_W - 0.25), b1 - 0.1, capAt, tone(cream, 1.08), tone(cream, 0.72))
  const cx = P(mid, -0.2 - bw, b1 + AN_BELL_CAP)
  poly([[cx[0] - fu[0] * 0.05, cx[1] - fu[1] * 0.05, cx[2]], [cx[0] + fu[0] * 0.05, cx[1] + fu[1] * 0.05, cx[2]], [cx[0] + fu[0] * 0.05, cx[1] + fu[1] * 0.05, cx[2] + 0.8], [cx[0] - fu[0] * 0.05, cx[1] - fu[1] * 0.05, cx[2] + 0.8]], [0.5, 0.45, 0.35], hint)
  poly([[cx[0] - fu[0] * 0.28, cx[1] - fu[1] * 0.28, cx[2] + 0.5], [cx[0] + fu[0] * 0.28, cx[1] + fu[1] * 0.28, cx[2] + 0.5], [cx[0] + fu[0] * 0.28, cx[1] + fu[1] * 0.28, cx[2] + 0.6], [cx[0] - fu[0] * 0.28, cx[1] - fu[1] * 0.28, cx[2] + 0.6]], [0.5, 0.45, 0.35], hint)

  // ---- round-arched windows along the long walls
  const rw = (c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, col: Rgb, off: number): void => {
    const r = w / 2, q = (t: number, y: number): V3 => [c[0] + u[0] * t + nrm[0] * off, c[1] + u[1] * t + nrm[1] * off, y]
    const pts: V3[] = [q(-r, y0), q(r, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(q(Math.cos(a) * r, y0 + h - r + Math.sin(a) * r)) }
    poly(pts, col, [nrm[0], nrm[1], 0])
  }
  for (let i = 0; i < AN_RING.length; i++) {
    const a = AN_RING[i], b = AN_RING[(i + 1) % AN_RING.length], Le = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (Le < 8) continue
    const u: P2 = [(b[0] - a[0]) / Le, (b[1] - a[1]) / Le], nrm: P2 = [u[1] * sa, -u[0] * sa]
    if (nrm[0] * fn[0] + nrm[1] * fn[1] > 0.8) continue                       // the front itself
    const nb = Math.max(1, Math.floor((Le - 2) / AN_WIN_PITCH))
    for (let k = 0; k < nb; k++) {
      const t = (Le - (nb - 1) * AN_WIN_PITCH) / 2 + k * AN_WIN_PITCH, c: P2 = [a[0] + u[0] * t, a[1] + u[1] * t]
      rw(c, u, nrm, AN_WIN_Y - 0.15, AN_WIN_W + 0.5, AN_WIN_H + 0.3, tone(cream, 1.06), 0.04)
      rw(c, u, nrm, AN_WIN_Y, AN_WIN_W, AN_WIN_H, [0.16, 0.2, 0.28], 0.08)
    }
  }
}

/** a regular n-gon about `c` */
function rectPoly(c: P2, r: number, n: number): P2[] {
  return Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * Math.PI * 2 + Math.PI / n) * r, c[1] + Math.sin((i / n) * Math.PI * 2 + Math.PI / n) * r] as P2)
}

// ───────────────────── Église protestante unie de Paris-Belleville (way/69999948 + part way/917193350) ─────────────────────
// 97 rue Julien-Lacroix (Temple de Belleville, 1860s). Read off Commons photographs (docs/landmarks/refs/belleville/,
// 2026-11-04): a buff ashlar gable facing ENE onto the street — three round-arched windows under a string-course arcade,
// a central arched porch under a small pedimented hood with a red door, two small arched side windows, corner pilasters
// with sloped caps, a gable with a rake band, a louvre vent and a pinnacle on the apex. Lower wings from the OSM plan.
// Local frame: E/N metres from (x 3660, z 1352) of the paris-centre grid.
// ---------------------------------------------------------------------------------------------------------------------
const BV_RING: P2[] = [[8.00, -9.20], [15.40, -6.40], [13.90, -2.40], [13.10, -0.10], [11.30, 4.70], [9.30, 10.00], [8.60, 11.80], [6.80, 16.60], [-1.60, 13.40], [0.70, 7.00], [-2.20, 5.90], [-5.30, 12.00], [-21.60, 5.90], [-16.10, -10.60], [-14.00, -9.90], [-11.90, -16.80], [-6.60, -14.80], [-9.00, -8.50], [7.40, -9.40]]
const BV_FA: P2 = [9.3, 10.0], BV_FB: P2 = [13.1, -0.1]      // the gable front, north to south (outward = ENE)
const BV_STONE: Rgb = [0.78, 0.70, 0.54]
const BV_STONE_LO: Rgb = [0.66, 0.60, 0.48]
const BV_SLATE: Rgb = [0.31, 0.32, 0.35]
const BV_GLASS: Rgb = [0.12, 0.15, 0.21]
const BV_DOOR: Rgb = [0.55, 0.08, 0.08]
const BV_W = 10.8             // gable width (the nave)
const BV_D = 23.8             // nave depth behind the front
const BV_EAVE = 10.6          // nave eaves (gable shoulders)
const BV_RIDGE = 13.8         // ridge
const BV_WING_H = 7.0         // lower wings
const BV_PLINTH = 1.5         // darker footing
const BV_PIL_W = 0.95         // corner pilasters
const BV_PIL_OUT = 0.25
const BV_STRING_Y = 7.4       // string course under the windows
const BV_WIN_DX = 1.95        // spacing of the three windows
const BV_WIN_W = 1.1
const BV_WIN_Y = 7.6
const BV_WIN_H = 3.3
const BV_DOOR_W = 2.3
const BV_DOOR_H = 3.2
const BV_ARCH_R = 1.65        // porch arch
const BV_ARCH_Y = 3.4         // porch arch springing
const BV_HOOD_Y = 5.2         // hood eaves
const BV_HOOD_RISE = 1.8
const BV_SIDE_DX = 3.7        // small side windows
const BV_SIDE_Y = 1.9
const BV_SIDE_H = 2.9
const BV_SIDE_W = 0.9
const BV_PIN_H = 1.4          // apex pinnacle
const BV_CLERE_PITCH = 4.4    // clerestory bays along the nave
const BV_CLERE_Y = 7.4
const BV_CLERE_H = 2.9
const BV_CLERE_W = 1.0

export function templeBelleville(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BV_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BV_FB[0] - BV_FA[0], BV_FB[1] - BV_FA[1])
  const fu: P2 = [(BV_FB[0] - BV_FA[0]) / L, (BV_FB[1] - BV_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [BV_FA[0] + fu[0] * u + fn[0] * v, BV_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], mid = BV_W / 2
  const uOf = (e: number, n: number): number => (e - BV_FA[0]) * fu[0] + (n - BV_FA[1]) * fu[1]
  const stone = BV_STONE, lo = BV_STONE_LO

  // ---- plot: low wings, and the nave with its gabled slate roof (ridge runs back from the front)
  pr(BV_RING, 0, BV_WING_H, tone(stone, 0.95), BV_SLATE, 0.9, 0.12)
  const ridgeAt = (e: number, n: number): number => BV_EAVE + (BV_RIDGE - BV_EAVE) * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / mid)
  pr(rect(0, BV_W, -BV_D, 0), 0, ridgeAt, stone, BV_SLATE, 0.5, 0.18)

  // ---- front: plinth, corner pilasters with sloped caps, string course, rake band
  poly([P(0, 0.1, 0), P(BV_W, 0.1, 0), P(BV_W, 0.1, BV_PLINTH), P(0, 0.1, BV_PLINTH)], lo, hint)
  for (const u0 of [0, BV_W - BV_PIL_W]) {
    pr(rect(u0, u0 + BV_PIL_W, 0, BV_PIL_OUT), 0, BV_EAVE - 0.8, tone(stone, 1.04), tone(stone, 0.9))
    pr(rect(u0 - 0.05, u0 + BV_PIL_W + 0.05, 0, BV_PIL_OUT + 0.15), BV_STRING_Y - 1.2, BV_STRING_Y - 0.7, tone(stone, 0.8), tone(stone, 0.7))   // dark sloped cap
  }
  poly([P(BV_PIL_W, 0.1, BV_STRING_Y), P(BV_W - BV_PIL_W, 0.1, BV_STRING_Y), P(BV_W - BV_PIL_W, 0.1, BV_STRING_Y + 0.22), P(BV_PIL_W, 0.1, BV_STRING_Y + 0.22)], tone(stone, 1.08), hint)
  poly([P(BV_PIL_W, 0.1, BV_EAVE - 0.15), P(BV_W - BV_PIL_W, 0.1, BV_EAVE - 0.15), P(BV_W - BV_PIL_W, 0.1, BV_EAVE + 0.1), P(BV_PIL_W, 0.1, BV_EAVE + 0.1)], tone(stone, 1.06), hint)
  for (const s of [0, 1]) {                                                    // rake band
    const uA = s ? BV_W : 0, uB = mid
    poly([P(uA, 0.14, BV_EAVE - 0.55), P(uB, 0.14, BV_RIDGE - 0.55), P(uB, 0.14, BV_RIDGE + 0.05), P(uA, 0.14, BV_EAVE + 0.05)], tone(stone, 1.08), hint)
    for (let k = 1; k <= 5; k++) {                                             // square tiles on the rake
      const t = (k - 0.5) / 5.5, u = uA + (uB - uA) * t, y = BV_EAVE + (BV_RIDGE - BV_EAVE) * t - 0.9
      poly([P(u - 0.22, 0.12, y - 0.22), P(u + 0.22, 0.12, y - 0.22), P(u + 0.22, 0.12, y + 0.22), P(u - 0.22, 0.12, y + 0.22)], tone(stone, 0.8), hint)
    }
  }
  poly([P(mid - 0.2, 0.1, BV_RIDGE - 1.7), P(mid + 0.2, 0.1, BV_RIDGE - 1.7), P(mid + 0.2, 0.1, BV_RIDGE - 1.1), P(mid - 0.2, 0.1, BV_RIDGE - 1.1)], [0.14, 0.12, 0.1], hint)   // louvre vent
  pr(rectPoly(EN(mid, -0.3), 0.32, 4), BV_RIDGE - 0.4, BV_RIDGE + BV_PIN_H, tone(stone, 1.02), tone(stone, 0.88))      // apex pinnacle
  pr(rectPoly(EN(mid, -0.3), 0.14, 4), BV_RIDGE + BV_PIN_H, BV_RIDGE + BV_PIN_H + 0.7, tone(stone, 0.9), tone(stone, 0.8))

  // ---- arched helper (round head): base y0, width w, height h, on the front plane at offset v
  const arch = (uc: number, y0: number, w: number, h: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(uc + Math.cos(a) * r, v, y0 + h - r + Math.sin(a) * r)) }
    poly(pts, col, hint)
    pts.length = 0
  }
  // three tall windows with a stone surround, and the sills below
  for (const k of [-1, 0, 1]) {
    const uc = mid + k * BV_WIN_DX
    arch(uc, BV_WIN_Y - 0.15, BV_WIN_W + 0.5, BV_WIN_H + 0.3, 0.1, tone(stone, 1.1))
    arch(uc, BV_WIN_Y, BV_WIN_W, BV_WIN_H, 0.16, BV_GLASS)
    poly([P(uc - 0.04, 0.2, BV_WIN_Y), P(uc + 0.04, 0.2, BV_WIN_Y), P(uc + 0.04, 0.2, BV_WIN_Y + BV_WIN_H - BV_WIN_W / 2), P(uc - 0.04, 0.2, BV_WIN_Y + BV_WIN_H - BV_WIN_W / 2)], tone(stone, 1.05), hint)
    poly([P(uc - 0.45, 0.14, BV_WIN_Y - 0.9), P(uc + 0.45, 0.14, BV_WIN_Y - 0.9), P(uc + 0.45, 0.14, BV_WIN_Y - 0.25), P(uc - 0.45, 0.14, BV_WIN_Y - 0.25)], tone(stone, 0.86), hint)   // blind panel under each
  }
  for (const s of [-1, 1]) {                                                   // small arched side windows
    arch(mid + s * BV_SIDE_DX, BV_SIDE_Y - 0.12, BV_SIDE_W + 0.4, BV_SIDE_H + 0.24, 0.1, tone(stone, 1.1))
    arch(mid + s * BV_SIDE_DX, BV_SIDE_Y, BV_SIDE_W, BV_SIDE_H, 0.16, BV_GLASS)
  }

  // ---- porch: stone arch, red door, pedimented hood
  const pm = mid, py = BV_ARCH_Y
  arch(pm, 0.05, BV_ARCH_R * 2 + 0.9, py + BV_ARCH_R + 0.45, 0.12, tone(stone, 1.12))      // archivolt
  arch(pm, 0.1, BV_ARCH_R * 2, py + BV_ARCH_R, 0.18, tone(stone, 0.7))                      // tympanum recess
  poly([P(pm - BV_DOOR_W / 2, 0.24, 0.35), P(pm + BV_DOOR_W / 2, 0.24, 0.35), P(pm + BV_DOOR_W / 2, 0.24, 0.35 + BV_DOOR_H), P(pm - BV_DOOR_W / 2, 0.24, 0.35 + BV_DOOR_H)], BV_DOOR, hint)
  poly([P(pm - 0.03, 0.27, 0.35), P(pm + 0.03, 0.27, 0.35), P(pm + 0.03, 0.27, 0.35 + BV_DOOR_H), P(pm - 0.03, 0.27, 0.35 + BV_DOOR_H)], [0.3, 0.05, 0.05], hint)
  poly([P(pm - 0.6, 0.24, py + 0.55), P(pm + 0.6, 0.24, py + 0.55), P(pm + 0.6, 0.24, py + 1.05), P(pm - 0.6, 0.24, py + 1.05)], tone(stone, 0.95), hint)   // inscription plaque
  for (let k = 0; k < 3; k++) pr(rect(pm - 1.5 - k * 0.1, pm + 1.5 + k * 0.1, 0, 0.8 - k * 0.25), 0, 0.15 * (3 - k), tone(stone, 0.9), tone(stone, 1.0))   // steps
  for (const s of [-1, 1]) pr(rect(pm + s * (BV_ARCH_R + 0.45) - 0.22, pm + s * (BV_ARCH_R + 0.45) + 0.22, 0, 0.4), 0, BV_ARCH_Y, tone(stone, 1.08), tone(stone, 0.9))   // jamb shafts
  const hoodAt = (e: number, n: number): number => BV_HOOD_Y + BV_HOOD_RISE * Math.max(0, 1 - Math.abs(uOf(e, n) - pm) / (BV_ARCH_R + 0.9))
  pr(rect(pm - BV_ARCH_R - 0.9, pm + BV_ARCH_R + 0.9, 0, 0.45), BV_HOOD_Y - 0.4, hoodAt, tone(stone, 1.1), tone(stone, 0.75))
  pr(rectPoly(EN(pm, 0.3), 0.18, 6), BV_HOOD_Y + BV_HOOD_RISE, BV_HOOD_Y + BV_HOOD_RISE + 0.45, tone(stone, 1.1), tone(stone, 0.9))   // finial on the hood

  // ---- clerestory windows on the nave's long walls, above the wings
  const rw = (c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, col: Rgb, off: number): void => {
    const r = w / 2, q = (t: number, y: number): V3 => [c[0] + u[0] * t + nrm[0] * off, c[1] + u[1] * t + nrm[1] * off, y]
    const pts: V3[] = [q(-r, y0), q(r, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(q(Math.cos(a) * r, y0 + h - r + Math.sin(a) * r)) }
    poly(pts, col, [nrm[0], nrm[1], 0])
  }
  const nb = Math.floor((BV_D - 3) / BV_CLERE_PITCH)
  for (const [uw, sgn] of [[0, -1], [BV_W, 1]] as [number, number][]) {
    const nrm: P2 = [fu[0] * sgn, fu[1] * sgn], u: P2 = [-fn[0], -fn[1]]
    for (let k = 0; k < nb; k++) {
      const v = -(BV_D - (nb - 1) * BV_CLERE_PITCH) / 2 - k * BV_CLERE_PITCH, c = EN(uw, v)
      rw(c, u, nrm, BV_CLERE_Y - 0.12, BV_CLERE_W + 0.4, BV_CLERE_H + 0.24, tone(stone, 1.1), 0.04)
      rw(c, u, nrm, BV_CLERE_Y, BV_CLERE_W, BV_CLERE_H, BV_GLASS, 0.08)
    }
  }
}

// ───────────────────── Christuskirche, Deutsche Evangelische Kirche (way/69257726) ─────────────────────
// 25 rue Blanche (Paris 9e), the German Lutheran church of 1894 (Frisius?). Read off Commons photographs
// (docs/landmarks/refs/christuskirche/, 2026-11-04): a pale limestone Romanesque-Byzantine front wedged between
// apartment blocks and facing ENE onto rue Blanche — a big round-arched oak door under a carved eagle frieze, small
// round-headed windows flanking it, a triple-light round window above, an arcade of small colonnetted arches under
// an ornamented cornice, and a stone attic storey with a slate roof over it. Nave behind from the OSM plan.
// Local frame: E/N metres from (x 2.331 lon, 48.8794 lat) approx (hull-registered, so the origin is free).
// ---------------------------------------------------------------------------------------------------------------------
const CK_RING: P2[] = [[25.4, 15.7], [-7.3, 10.5], [-13.4, 9.6], [-10.7, -3.4], [13.0, 0.4], [25.5, 3.4]]
const CK_FA: P2 = [25.4, 15.7], CK_FB: P2 = [25.5, 3.4]      // front, north to south (outward = east)
const CK_STONE: Rgb = [0.77, 0.71, 0.58]
const CK_SLATE: Rgb = [0.30, 0.31, 0.34]
const CK_GLASS: Rgb = [0.12, 0.14, 0.19]
const CK_OAK: Rgb = [0.30, 0.17, 0.09]
const CK_IRON: Rgb = [0.08, 0.08, 0.09]
const CK_FRONT_H = 16.0       // top of the cornice
const CK_CORNICE_H = 1.0
const CK_ATTIC_H = 3.4        // stone attic storey above the cornice
const CK_ATTIC_SET = 1.3      // its setback
const CK_NAVE_H = 14.0        // nave eaves behind the front
const CK_RIDGE = 3.0
const CK_DOOR_T = 0.62        // door centre as a fraction from the north end
const CK_DOOR_W = 3.1
const CK_DOOR_H = 5.4         // to the apex of the arch
const CK_LINTEL_H = 2.0       // carved eagle frieze above the door arch
const CK_SM_Y = 1.7           // small ground windows
const CK_SM_W = 1.1
const CK_SM_H = 2.8
const CK_UP_Y = 8.0           // upper windows
const CK_UP_H = 4.4
const CK_TRI_W = 4.0          // the triple-light window
const CK_ARC_Y = 13.1         // arcade of small arches
const CK_ARC_H = 2.3
const CK_ARC_N = 8

export function christuskirche(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(CK_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(CK_FB[0] - CK_FA[0], CK_FB[1] - CK_FA[1])
  const fu: P2 = [(CK_FB[0] - CK_FA[0]) / L, (CK_FB[1] - CK_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [CK_FA[0] + fu[0] * u + fn[0] * v, CK_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const stone = CK_STONE
  const uOf = (e: number, n: number): number => (e - CK_FA[0]) * fu[0] + (n - CK_FA[1]) * fu[1]
  const tu = (t: number): number => W * (1 - t)       // photo fraction (left=south) to u from the north end

  // ---- nave from the OSM plan, with a low slate ridge; the front block; the attic storey
  pr(CK_RING, 0, CK_NAVE_H, tone(stone, 0.92), CK_SLATE, 0.9, 0.12)
  const ridgeAt = (e: number, n: number): number => CK_NAVE_H + CK_RIDGE * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / (mid - 0.5))
  pr(rect(0.5, W - 0.5, -34, -3), CK_NAVE_H - 0.1, ridgeAt, CK_SLATE, tone(CK_SLATE, 0.9))
  pr(rect(0, W, -3.5, 0), 0, CK_FRONT_H, tone(stone, 1.03), tone(stone, 0.9))
  pr(rect(0, W, -3.5, 0.4), CK_FRONT_H - CK_CORNICE_H, CK_FRONT_H, tone(stone, 1.1), tone(stone, 0.85))        // cornice
  pr(rect(0.15, W - 0.15, -6, -CK_ATTIC_SET), CK_FRONT_H, CK_FRONT_H + CK_ATTIC_H, tone(stone, 1.0), CK_SLATE, 0.8, 0.2)
  poly([P(0, 0.12, 0), P(W, 0.12, 0), P(W, 0.12, 1.1), P(0, 0.12, 1.1)], tone(stone, 0.82), hint)         // footing

  const arch = (uc: number, y0: number, w: number, h: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(uc + Math.cos(a) * r, v, y0 + h - r + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }
  const bar = (uc: number, y0: number, y1: number, hw: number, v: number, col: Rgb): void => {
    poly([P(uc - hw, v, y0), P(uc + hw, v, y0), P(uc + hw, v, y1), P(uc - hw, v, y1)], col, hint)
  }

  // ---- ground floor: great arched door, carved eagle frieze, iron gates, four small arched windows
  const du = tu(CK_DOOR_T), dr = CK_DOOR_W / 2
  arch(du, 0.1, CK_DOOR_W + 1.0, CK_DOOR_H + 0.5, 0.1, tone(stone, 1.12))                 // archivolt
  arch(du, 0.12, CK_DOOR_W, CK_DOOR_H, 0.2, CK_OAK)
  for (const k of [-1.5, -0.5, 0.5, 1.5]) bar(du + k * CK_DOOR_W / 4.4, 0.4, CK_DOOR_H - 1.6, 0.05, 0.25, tone(CK_OAK, 0.6))
  bar(du, 0.4, CK_DOOR_H - 1.6, 0.04, 0.26, CK_IRON)
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) bar(du + s * (0.25 + k * 0.38), 0.3, 1.6, 0.025, 0.4, CK_IRON)   // gate bars
  poly([P(du - dr - 0.6, 0.2, CK_DOOR_H + 0.1), P(du + dr + 0.6, 0.2, CK_DOOR_H + 0.1), P(du + dr + 0.6, 0.2, CK_DOOR_H + CK_LINTEL_H), P(du - dr - 0.6, 0.2, CK_DOOR_H + CK_LINTEL_H)], tone(stone, 0.9), hint)
  for (const s of [-1, 1]) arch(du + s * (dr - 0.2), CK_DOOR_H + 0.35, 0.9, 1.1, 0.26, tone(stone, 1.15))      // eagle roundels
  for (const k of [0.06, 0.14, 0.74, 0.9]) {
    const uc = tu(k)
    arch(uc, CK_SM_Y - 0.1, CK_SM_W + 0.5, CK_SM_H + 0.2, 0.1, tone(stone, 1.1))
    arch(uc, CK_SM_Y, CK_SM_W, CK_SM_H, 0.16, CK_GLASS)
    bar(uc, CK_SM_Y, CK_SM_Y + CK_SM_H * 0.6, 0.03, 0.2, CK_IRON)
    bar(uc, CK_SM_Y - 0.4, CK_SM_Y - 0.1, CK_SM_W / 2 + 0.2, 0.14, tone(stone, 0.8))                       // zigzag sill
  }
  poly([P(0, 0.14, 6.9), P(W, 0.14, 6.9), P(W, 0.14, 7.2), P(0, 0.14, 7.2)], tone(stone, 1.08), hint)       // string course

  // ---- first floor: triple-light round window, two flanking windows with carved arches
  const tc = tu(0.38)
  arch(tc, CK_UP_Y - 0.2, CK_TRI_W + 1.0, CK_UP_H + 0.5, 0.1, tone(stone, 1.1))
  arch(tc, CK_UP_Y, CK_TRI_W, CK_UP_H, 0.16, CK_GLASS)
  for (const k of [-1.0, -0.33, 0.33, 1.0]) bar(tc + k * CK_TRI_W / 2.2, CK_UP_Y, CK_UP_Y + CK_UP_H * 0.5, 0.08, 0.22, tone(stone, 1.0))
  for (const [k, w] of [[0.08, 1.5], [0.78, 2.1]] as [number, number][]) {
    const uc = tu(k)
    arch(uc, CK_UP_Y - 0.1, w + 0.8, CK_UP_H + 0.2, 0.1, tone(stone, 1.1))
    arch(uc, CK_UP_Y + 0.2, w, CK_UP_H - 0.4, 0.16, CK_GLASS)
    bar(uc, CK_UP_Y + 0.2, CK_UP_Y + 2.0, 0.04, 0.2, tone(stone, 1.0))
  }
  poly([P(0, 0.14, 12.3), P(W, 0.14, 12.3), P(W, 0.14, 12.7), P(0, 0.14, 12.7)], tone(stone, 1.08), hint)   // string course

  // ---- arcade of small round arches on colonnettes under the cornice
  const pitch = (W - 1.4) / CK_ARC_N
  for (let i = 0; i < CK_ARC_N; i++) {
    const uc = 0.7 + pitch * (i + 0.5)
    arch(uc, CK_ARC_Y, pitch * 0.62, CK_ARC_H, 0.12, tone(stone, 0.72))
    bar(uc + pitch / 2, CK_ARC_Y, CK_ARC_Y + CK_ARC_H - 0.5, 0.09, 0.18, [0.5, 0.42, 0.45])
  }
  poly([P(0.1, 0.45, CK_FRONT_H - CK_CORNICE_H + 0.25), P(W - 0.1, 0.45, CK_FRONT_H - CK_CORNICE_H + 0.25), P(W - 0.1, 0.45, CK_FRONT_H - 0.15), P(0.1, 0.45, CK_FRONT_H - 0.15)], tone(stone, 0.78), hint)   // carved band

  // ---- attic storey: three plain windows
  for (const k of [0.2, 0.5, 0.8]) {
    const uc = W * k
    poly([P(uc - 0.55, -CK_ATTIC_SET + 0.06, CK_FRONT_H + 0.8), P(uc + 0.55, -CK_ATTIC_SET + 0.06, CK_FRONT_H + 0.8), P(uc + 0.55, -CK_ATTIC_SET + 0.06, CK_FRONT_H + 2.7), P(uc - 0.55, -CK_ATTIC_SET + 0.06, CK_FRONT_H + 2.7)], CK_GLASS, hint)
  }

  // ---- clerestory windows on the long walls, behind the neighbours
  const rw = (c: P2, u: P2, nrm: P2, y0: number, w: number, h: number, col: Rgb, off: number): void => {
    const r = w / 2, q = (t: number, y: number): V3 => [c[0] + u[0] * t + nrm[0] * off, c[1] + u[1] * t + nrm[1] * off, y]
    const pts: V3[] = [q(-r, y0), q(r, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(q(Math.cos(a) * r, y0 + h - r + Math.sin(a) * r)) }
    poly(pts, col, [nrm[0], nrm[1], 0])
  }
  for (const [uw, sgn] of [[0.5, -1], [W - 0.5, 1]] as [number, number][]) {
    const nrm: P2 = [fu[0] * sgn, fu[1] * sgn], u: P2 = [-fn[0], -fn[1]]
    for (let k = 0; k < 5; k++) rw(EN(uw, -6 - k * 5), u, nrm, 9.0, 1.2, 3.6, CK_GLASS, 0.08)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Église évangélique baptiste, 48 rue de Lille (OSM way 63149138; Commons "Église Évangélique Baptiste - Paris VII
// (FR75) - 2024-11-08 - 1/2/3" and P1250764, docs/landmarks/refs/baptiste-lille/, 2026-11-04): a pale ashlar Gothic-revival
// front of 1873 filling a gap in the rue de Lille, facing south-south-west onto the street: a crocketed pointed portal with a trefoil
// tympanum under "EGLISE BAPTISTE", two triplets of lancets and two shopfronts at ground level, a rose window flanked
// by two traceried two-light windows above, a carved cornice with balustrades, and a central gable with three
// louvred lancets. Nave behind from the OSM plan. Photo fractions below are measured on the 960-px front elevation.
// Local frame: E/N metres from (x 2.332 lon, 48.8605 lat) (hull-registered, so the origin is free).
// ---------------------------------------------------------------------------------------------------------------------
const BL_RING: P2[] = [[-199.6, -161.7], [-193.4, -164.4], [-186.2, -167.7], [-186.8, -169.1], [-187.5, -170.5], [-195.6, -166.9], [-198.1, -172.2], [-190.0, -176.0], [-191.6, -179.6], [-193.4, -183.3], [-195.2, -187.5], [-200.9, -199.8], [-208.3, -196.5], [-214.4, -193.8], [-211.4, -187.3], [-210.6, -185.6], [-207.9, -180.1], [-206.3, -176.5], [-205.6, -175.0], [-203.9, -171.3], [-203.2, -169.8], [-201.5, -165.9], [-200.9, -164.8], [-200.2, -163.0]]
const BL_FA: P2 = [-200.9, -199.8], BL_FB: P2 = [-214.4, -193.8]      // front, east to west (outward = south-south-west, onto rue de Lille)
const BL_STONE: Rgb = [0.80, 0.74, 0.62]
const BL_SLATE: Rgb = [0.30, 0.31, 0.34]
const BL_GLASS: Rgb = [0.13, 0.15, 0.20]
const BL_GREEN: Rgb = [0.07, 0.17, 0.12]
const BL_WARM: Rgb = [0.78, 0.60, 0.30]          // lit shopfront glass
const BL_M = 0.0169           // metres per photo pixel (14.7 m front over 870 px)
const BL_GROUND = 1300        // photo y of the pavement
const BL_X0 = 40              // photo x of the front's left edge
const BL_PORTAL_X = 483, BL_DOOR_W = 2.3, BL_DOOR_H = 3.6
const BL_ARCH_W = 5.1, BL_ARCH_H = 7.5       // portal archivolt
const BL_STRING_H = 7.4       // ground-floor string course
const BL_CORNICE_H = 14.7
const BL_PARAPET_H = 1.2
const BL_EAVES_H = 18.3       // gable walls rise to here
const BL_PEAK_H = 21.3
const BL_GABLE_X0 = 300, BL_GABLE_X1 = 655
const BL_NAVE_H = 14.7
const BL_RIDGE = 4.5
const BL_NAVE_DEPTH = 32

export function baptisteLille(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BL_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BL_FB[0] - BL_FA[0], BL_FB[1] - BL_FA[1])
  const fu: P2 = [(BL_FB[0] - BL_FA[0]) / L, (BL_FB[1] - BL_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [BL_FA[0] + fu[0] * u + fn[0] * v, BL_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const stone = BL_STONE
  const uOfX = (px: number): number => W * ((px - BL_X0) / 870)     // photo x (left = west, seen from the street) to u from the east end
  const yOf = (py: number): number => (BL_GROUND - py) * BL_M
  const wOf = (px: number): number => px * BL_M
  const uOf = (e: number, n: number): number => (e - BL_FA[0]) * fu[0] + (n - BL_FA[1]) * fu[1]

  // ---- nave, front block, cornice, balustrades, central gable
  pr(BL_RING, 0, BL_NAVE_H, tone(stone, 0.92), BL_SLATE, 0.9, 0.12)
  pr(rect(0.5, W - 0.5, -BL_NAVE_DEPTH, -3), BL_NAVE_H - 0.1, (e, n) => BL_NAVE_H + BL_RIDGE * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / (mid - 0.5)), BL_SLATE, tone(BL_SLATE, 0.9))
  pr(rect(0, W, -3.5, 0), 0, BL_CORNICE_H, tone(stone, 1.03), tone(stone, 0.9))
  pr(rect(0, W, -3.5, 0.35), BL_CORNICE_H - 0.55, BL_CORNICE_H, tone(stone, 1.1), tone(stone, 0.85))         // cornice
  const g0 = uOf2(BL_GABLE_X1), g1 = uOf2(BL_GABLE_X0), gm = (g0 + g1) / 2
  function uOf2(px: number): number { return uOfX(px) }
  pr(rect(g0, g1, -4, -0.1), BL_CORNICE_H - 0.1, (e, n) => BL_EAVES_H + (BL_PEAK_H - BL_EAVES_H) * Math.max(0, 1 - Math.abs(uOf(e, n) - gm) / ((g1 - g0) / 2 - 0.05)), tone(stone, 1.0), BL_SLATE, 0.8, 0.2)
  for (const [a, b] of [[40, 310], [640, 910]] as [number, number][]) {
    const ua = uOfX(b), ub = uOfX(a)
    pr(rect(ua, ub, -0.7, -0.15), BL_CORNICE_H, BL_CORNICE_H + BL_PARAPET_H, tone(stone, 0.9), tone(stone, 0.8))     // balustrade
  }
  for (const px of [75, 215, 740, 860]) {            // corner and mid pinnacles
    const u = uOfX(px), h = px === 75 || px === 860 ? 3.4 : 2.3
    pr(rect(u - 0.3, u + 0.3, -0.9, -0.2), BL_CORNICE_H, BL_CORNICE_H + h, tone(stone, 1.05), tone(stone, 0.95))
  }
  poly([P(0, 0.12, 0), P(W, 0.12, 0), P(W, 0.12, 0.9), P(0, 0.12, 0.9)], tone(stone, 0.78), hint)           // plinth
  poly([P(0, 0.14, BL_STRING_H), P(W, 0.14, BL_STRING_H), P(W, 0.14, BL_STRING_H + 0.5), P(0, 0.14, BL_STRING_H + 0.5)], tone(stone, 1.1), hint)   // string course
  poly([P(0, 0.14, BL_CORNICE_H - 0.5), P(W, 0.14, BL_CORNICE_H - 0.5), P(W, 0.14, BL_CORNICE_H - 0.1), P(0, 0.14, BL_CORNICE_H - 0.1)], tone(stone, 0.8), hint)   // carved frieze
  for (const px of [335, 625]) {                     // pilaster strips either side of the rose window
    const u = uOfX(px)
    pr(rect(u - 0.45, u + 0.45, 0, 0.3), BL_STRING_H, BL_CORNICE_H, tone(stone, 1.06), tone(stone, 0.9))
  }

  // ---- windows: helper at a photo x
  const win = (px: number, wpx: number, y0px: number, y1px: number, mull: number, glass: Rgb): void => {
    const c = EN(uOfX(px), 0.1)
    gothicWindow(T, c, fu, fn, yOf(y0px), wOf(wpx), yOf(y1px) - yOf(y0px), mull, stone, glass)
  }
  // upper floor: rose window (centre) between two two-light traceried windows
  win(480, 160, 800, 470, 2, BL_GLASS)
  win(220, 120, 795, 560, 2, BL_GLASS)
  win(743, 120, 795, 560, 2, BL_GLASS)
  { // rose: a pale ring with a dark disc
    const uc = uOfX(480), cy = yOf(630), R = 1.0, pts: V3[] = [], ring: V3[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(uc + Math.cos(a) * R, 0.2, cy + Math.sin(a) * R)); ring.push(P(uc + Math.cos(a) * R * 1.12, 0.17, cy + Math.sin(a) * R * 1.12)) }
    poly(ring, tone(stone, 1.15), hint); poly(pts, tone(BL_GLASS, 1.3), hint)
  }
  // gable: three louvred lancets
  for (const px of [435, 478, 520]) win(px, 38, 395, 235, 0, BL_GLASS)
  // ground floor: two triplets of lancets
  for (const x0 of [152, 682]) for (const k of [0, 1, 2]) win(x0 + k * 50, 28, 1030, 905, 0, BL_GLASS)
  // shopfronts: dark green frame, warm lit glass under a pointed-arch transom
  for (const [x0, x1] of [[125, 305], [660, 840]] as [number, number][]) {
    const ua = uOfX(x1), ub = uOfX(x0)
    poly([P(ua - 0.15, 0.2, 0.2), P(ub + 0.15, 0.2, 0.2), P(ub + 0.15, 0.2, yOf(1078)), P(ua - 0.15, 0.2, yOf(1078))], BL_GREEN, hint)
    poly([P(ua, 0.28, yOf(1250)), P(ub, 0.28, yOf(1250)), P(ub, 0.28, yOf(1138)), P(ua, 0.28, yOf(1138))], BL_WARM, hint)
    poly([P(ua, 0.28, yOf(1135)), P(ub, 0.28, yOf(1135)), P(ub, 0.28, yOf(1092)), P(ua, 0.28, yOf(1092))], tone(BL_GREEN, 1.4), hint)
  }

  // ---- portal: crocketed pointed archivolt, trefoil tympanum, lettered lintel, green double door
  const pc = EN(uOfX(BL_PORTAL_X), 0)
  ogive(T, pc, fu, fn, 0.1, BL_ARCH_W + 0.5, BL_ARCH_H + 0.4, tone(stone, 1.15), 0.1)
  ogive(T, pc, fu, fn, 0.12, BL_ARCH_W - 0.5, BL_ARCH_H - 0.5, tone(stone, 0.95), 0.16)
  ogive(T, pc, fu, fn, 3.7, 2.4, 2.1, BL_GLASS, 0.24)                                           // trefoil tympanum glass
  poly([P(uOfX(BL_PORTAL_X) - 1.35, 0.26, 3.75), P(uOfX(BL_PORTAL_X) + 1.35, 0.26, 3.75), P(uOfX(BL_PORTAL_X) + 1.35, 0.26, 4.15), P(uOfX(BL_PORTAL_X) - 1.35, 0.26, 4.15)], tone(stone, 0.8), hint)   // EGLISE BAPTISTE
  ogive(T, pc, fu, fn, 0.12, BL_DOOR_W, BL_DOOR_H, BL_GREEN, 0.3)
  for (const k of [-0.5, 0.5]) for (const y of [0.35, 2.0]) {
    const uc = uOfX(BL_PORTAL_X) + k * BL_DOOR_W * 0.5
    poly([P(uc - 0.3, 0.34, y), P(uc + 0.3, 0.34, y), P(uc + 0.3, 0.34, y + 1.2), P(uc - 0.3, 0.34, y + 1.2)], tone(BL_WARM, 0.55), hint)
  }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {                                         // jamb colonnettes
    const uc = uOfX(BL_PORTAL_X) + s * (BL_DOOR_W / 2 + 0.2 + k * 0.28)
    poly([P(uc - 0.09, 0.28, 0.2), P(uc + 0.09, 0.28, 0.2), P(uc + 0.09, 0.28, 3.65), P(uc - 0.09, 0.28, 3.65)], tone(stone, 1.15), hint)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Temple protestant de Plaisance (Église réformée de Plaisance, 95 rue de l'Ouest; OSM way 79688125; Commons "Temple de
// Plaisance @ Paris 14" and "Entrée du temple de Plaisance au 95 rue de l'Ouest", docs/landmarks/refs/plaisance/, 2026-11-04):
// a buff ashlar gable of the 1860s-70s standing in the street wall, facing north-west onto the narrow rue de l'Ouest: three
// round-arched doors (two black, one blue) under moulded hoods and an inscription band, two bands of three windows (square-headed
// below, round-headed above) divided by flat pilaster strips, an oculus in a low pediment with a raking cornice and a
// cross finial. Nave behind from the OSM plan, slate roof. Photo constants below are measured on the 466x700 front photo (a.jpg).
// Local frame: E/N metres from (x 2.332 lon, 48.8605 lat) (hull-registered, so the origin is free).
// ---------------------------------------------------------------------------------------------------------------------
const PL_RING: P2[] = [[-1112.6, -2927.3], [-1104.5, -2918.7], [-1122.2, -2898.0], [-1129.9, -2889.2], [-1131.5, -2890.5], [-1138.1, -2896.1], [-1130.7, -2905.2], [-1127.5, -2909.0]]
const PL_FA: P2 = [-1138.1, -2896.1], PL_FB: P2 = [-1129.9, -2889.2]     // front, SW to NE (outward = north-west, onto rue de l'Ouest)
const PL_STONE: Rgb = [0.78, 0.69, 0.50]
const PL_SLATE: Rgb = [0.30, 0.31, 0.34]
const PL_GLASS: Rgb = [0.13, 0.16, 0.21]
const PL_BLACK: Rgb = [0.07, 0.09, 0.08]
const PL_BLUE: Rgb = [0.12, 0.38, 0.50]
const PL_M = 0.024            // metres per photo pixel, vertical
const PL_MX = 0.0228          // and horizontal (466 px across the 10.7 m front)
const PL_GROUND = 730         // photo y of the pavement
const PL_CX = 237             // photo x of the centre line
const PL_EAVES_H = 13.6       // side walls and the gable's shoulders
const PL_PEAK_H = 16.6
const PL_NAVE_H = 13.2
const PL_RIDGE = 3.6
const PL_DOOR_W = 2.4, PL_DOOR_H = 5.6
const PL_DOORS: [number, Rgb][] = [[62, PL_BLACK], [237, PL_BLACK], [410, PL_BLUE]]
const PL_LOWER_WIN: number[] = [87, 237, 385]
const PL_UPPER_WIN: number[] = [112, 237, 358]
const PL_STRIPS: number[] = [30, 175, 310, 445]

export function templePlaisance(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(PL_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(PL_FB[0] - PL_FA[0], PL_FB[1] - PL_FA[1])
  const fu: P2 = [(PL_FB[0] - PL_FA[0]) / L, (PL_FB[1] - PL_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [PL_FA[0] + fu[0] * u + fn[0] * v, PL_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const stone = PL_STONE
  // photo x (right = viewer's right, i.e. toward the SW end, u = 0) to u
  const uOfX = (px: number): number => mid - (px - PL_CX) * PL_MX
  const yOf = (py: number): number => (PL_GROUND - py) * PL_M
  const uOf = (e: number, n: number): number => (e - PL_FA[0]) * fu[0] + (n - PL_FA[1]) * fu[1]
  let depth = 0
  for (const [e, n] of PL_RING) depth = Math.max(depth, -((e - PL_FA[0]) * fn[0] + (n - PL_FA[1]) * fn[1]))

  // ---- nave walls and slate roof along the long axis, front block, pediment
  pr(PL_RING, 0, PL_NAVE_H, tone(stone, 0.9), PL_SLATE, 0.9, 0.12)
  pr(rect(0.3, W - 0.3, -(depth - 0.2), -0.2), PL_NAVE_H - 0.1, (e, n) => PL_NAVE_H + PL_RIDGE * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / (mid - 0.3)), PL_SLATE, tone(PL_SLATE, 0.9))
  pr(rect(0, W, -1.2, 0), 0, PL_EAVES_H, tone(stone, 1.0), tone(stone, 0.9))
  pr(rect(0, W, -1.0, 0.18), PL_EAVES_H - 0.45, PL_EAVES_H, tone(stone, 1.1), tone(stone, 0.85))        // eaves cornice
  pr(rect(0, W, -1.0, -0.05), PL_EAVES_H - 0.1, (e, n) => PL_EAVES_H + (PL_PEAK_H - PL_EAVES_H) * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / mid), tone(stone, 1.0), PL_SLATE, 0.8, 0.2)
  { // raking cornice: two bands up the pediment slopes
    const rake = (u0: number, u1: number, y0: number, y1: number): void => {
      const t = 0.3
      poly([P(u0, 0.16, y0), P(u1, 0.16, y1), P(u1, 0.16, y1 + t), P(u0, 0.16, y0 + t)], tone(stone, 1.12), hint)
    }
    rake(0, mid, PL_EAVES_H, PL_PEAK_H); rake(W, mid, PL_EAVES_H, PL_PEAK_H)
    pr(rect(mid - 0.12, mid + 0.12, -0.3, 0.05), PL_PEAK_H, PL_PEAK_H + 1.1, tone(stone, 1.05), tone(stone, 0.95))     // cross finial
    pr(rect(mid - 0.45, mid + 0.45, -0.3, 0.05), PL_PEAK_H + 0.6, PL_PEAK_H + 0.85, tone(stone, 1.05), tone(stone, 0.95))
  }
  poly([P(0, 0.12, 0), P(W, 0.12, 0), P(W, 0.12, 0.8), P(0, 0.12, 0.8)], tone(stone, 0.78), hint)           // plinth
  for (const [h, w, k] of [[yOf(425), 0.5, 1.12], [yOf(405), 0.35, 1.1], [yOf(160), 0.3, 1.1]] as [number, number, number][])
    poly([P(0, 0.14, h), P(W, 0.14, h), P(W, 0.14, h + w), P(0, 0.14, h + w)], tone(stone, k), hint)       // string courses
  for (const px of PL_STRIPS) {                      // flat pilaster strips
    const u = uOfX(px), w = px === 175 || px === 310 ? 0.5 : 0.4
    pr(rect(u - w / 2, u + w / 2, 0, 0.2), 0, PL_EAVES_H, tone(stone, 1.06), tone(stone, 0.9))
  }
  for (const [x0, x1] of [[175, 305]] as [number, number][]) {                       // inscription band over the middle door
    const ua = uOfX(x1), ub = uOfX(x0)
    poly([P(ua, 0.2, yOf(445)), P(ub, 0.2, yOf(445)), P(ub, 0.2, yOf(422)), P(ua, 0.2, yOf(422))], tone(stone, 0.8), hint)
  }
  { const ua = uOfX(462), ub = uOfX(340)
    poly([P(ua, 0.2, yOf(445)), P(ub, 0.2, yOf(445)), P(ub, 0.2, yOf(422)), P(ua, 0.2, yOf(422))], tone(stone, 0.8), hint) }

  // ---- doors: moulded round hood, dark leaf with a fanlight
  for (const [px, col] of PL_DOORS) {
    const c = EN(uOfX(px), 0)
    ogive(T, c, fu, fn, 0.1, PL_DOOR_W + 1.0, PL_DOOR_H + 0.7, tone(stone, 1.14), 0.1)
    ogive(T, c, fu, fn, 0.12, PL_DOOR_W + 0.35, PL_DOOR_H + 0.15, tone(stone, 0.9), 0.14)
    ogive(T, c, fu, fn, 0.14, PL_DOOR_W, PL_DOOR_H, col, 0.2)
    const ua = uOfX(px) - PL_DOOR_W * 0.5, ub = uOfX(px) + PL_DOOR_W * 0.5
    poly([P(ua, 0.26, 3.6), P(ub, 0.26, 3.6), P(ub, 0.26, 3.8), P(ua, 0.26, 3.8)], tone(col, 0.7), hint)         // transom bar
    poly([P(uOfX(px) - 0.05, 0.26, 0.15), P(uOfX(px) + 0.05, 0.26, 0.15), P(uOfX(px) + 0.05, 0.26, 3.6), P(uOfX(px) - 0.05, 0.26, 3.6)], tone(col, 1.5), hint)   // meeting stile
  }

  // ---- windows
  const sq = (px: number, wpx: number, y0px: number, y1px: number): void => {
    const u = uOfX(px), hw = (wpx * PL_MX) / 2, y0 = yOf(y0px), y1 = yOf(y1px)
    poly([P(u - hw - 0.18, 0.1, y0 - 0.15), P(u + hw + 0.18, 0.1, y0 - 0.15), P(u + hw + 0.18, 0.1, y1 + 0.12), P(u - hw - 0.18, 0.1, y1 + 0.12)], tone(stone, 1.12), hint)
    poly([P(u - hw, 0.14, y0), P(u + hw, 0.14, y0), P(u + hw, 0.14, y1), P(u - hw, 0.14, y1)], PL_GLASS, hint)
    for (const f of [-0.33, 0.33]) poly([P(u + f * hw * 2 - 0.03, 0.17, y0), P(u + f * hw * 2 + 0.03, 0.17, y0), P(u + f * hw * 2 + 0.03, 0.17, y1), P(u + f * hw * 2 - 0.03, 0.17, y1)], tone(stone, 1.0), hint)
    const ym = (y0 + y1) / 2
    poly([P(u - hw, 0.17, ym - 0.03), P(u + hw, 0.17, ym - 0.03), P(u + hw, 0.17, ym + 0.03), P(u - hw, 0.17, ym + 0.03)], tone(stone, 1.0), hint)
  }
  for (const px of PL_LOWER_WIN) sq(px, 75, 405, 310)
  for (const px of PL_UPPER_WIN) {                   // round-headed: a rect with a half-disc, under a hood arch
    const u = uOfX(px), hw = 0.9, y0 = yOf(260), y1 = yOf(205), r = hw
    poly([P(u - hw - 0.2, 0.1, y0 - 0.12), P(u + hw + 0.2, 0.1, y0 - 0.12), P(u + hw + 0.2, 0.1, y1), P(u - hw - 0.2, 0.1, y1)], tone(stone, 1.12), hint)
    const arc = (rr: number, off: number, col: Rgb): void => {
      const pts: V3[] = [P(u - rr, off, y0 - (rr === r ? 0 : 0.1))]
      pts.push(P(u + rr, off, y0 - (rr === r ? 0 : 0.1)), P(u + rr, off, y1))
      for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(u + Math.cos(a) * rr, off, y1 + Math.sin(a) * rr)) }
      pts.push(P(u - rr, off, y1))
      poly(pts, col, hint)
    }
    arc(r + 0.2, 0.1, tone(stone, 1.12))
    arc(r, 0.14, PL_GLASS)
    poly([P(u - 0.03, 0.17, y0), P(u + 0.03, 0.17, y0), P(u + 0.03, 0.17, y1 + r), P(u - 0.03, 0.17, y1 + r)], tone(stone, 1.0), hint)
    const hood = (rr: number): void => {                       // raised label arch above
      const pts: V3[] = []
      for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(u + Math.cos(a) * rr, 0.12, y1 + Math.sin(a) * rr)) }
      for (let i = 10; i >= 0; i--) { const a = (i / 10) * Math.PI; pts.push(P(u + Math.cos(a) * (rr + 0.2), 0.12, y1 + Math.sin(a) * (rr + 0.2))) }
      poly(pts, tone(stone, 1.15), hint)
    }
    void hood
  }
  { // oculus in the pediment
    const uc = uOfX(PL_CX), cy = yOf(90), R = 0.75, pts: V3[] = [], ring: V3[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(uc + Math.cos(a) * R, 0.2, cy + Math.sin(a) * R)); ring.push(P(uc + Math.cos(a) * R * 1.3, 0.17, cy + Math.sin(a) * R * 1.3)) }
    poly(ring, tone(stone, 1.15), hint); poly(pts, tone(PL_GLASS, 1.3), hint)
  }
}

// ───────────────────── Église luthérienne Saint-Paul de Montmartre (way/148524233) ─────────────────────
// 90 boulevard Barbès, Aug. Rey, 1896. Read off Commons photographs (docs/landmarks/refs/saint-paul-montmartre/, 2026-11-04):
// a pale ashlar front in the boulevard wall facing west behind an iron railing and plane trees: a round-arched door in a
// moulded arch under a gabled hood (ÉGLISE S^T PAUL frieze with hexagonal rosettes), above it a tall narrow window flanked
// by two slender colonnettes on carved corbels up to a stepped gable, lower side bays (a narrow red-cross window to the
// north, twin arched windows to the south), a slim stone spire behind. Nave from the OSM plan, slate roof.
// Local frame: E/N metres from (x 2.332 lon, 48.8605 lat). Photo constants measured on the 960 px wide p1.jpg.
// ---------------------------------------------------------------------------------------------------------------------
const SPM_RING: P2[] = [[1306.4, 3387.6], [1329.6, 3387.4], [1325.8, 3374.4], [1324.8, 3370.9], [1323.7, 3366.7], [1323, 3364.3], [1319.8, 3364.3], [1319.9, 3374.4], [1310.6, 3374.4], [1310.5, 3366], [1314.6, 3365.9], [1314.6, 3364.4], [1304.4, 3364.5], [1304.4, 3375], [1306.3, 3375], [1306.3, 3377.1], [1305.9, 3377.1], [1305.9, 3378.6], [1305.4, 3378.6], [1305.5, 3383.8], [1306, 3383.8], [1306, 3385.2], [1306.3, 3385.2]]
const SPM_FA: P2 = [1305.4, 3375.1], SPM_FB: P2 = [1305.4, 3387.6]       // front, south to north (outward = west, onto boulevard Barbès)
const SPM_STONE: Rgb = [0.80, 0.72, 0.54]
const SPM_SLATE: Rgb = [0.30, 0.31, 0.35]
const SPM_WOOD: Rgb = [0.24, 0.10, 0.07]
const SPM_GLASS: Rgb = [0.14, 0.17, 0.24]
const SPM_IRON: Rgb = [0.06, 0.07, 0.07]
const SPM_RED: Rgb = [0.55, 0.12, 0.10]
const SPM_MX = 0.0197          // metres per photo pixel across the front (640 px = the 12.5 m between the neighbours)
const SPM_CX = 460             // photo x of the front's centre line
const SPM_PORTAL_PX = 468      // photo x of the door
const SPM_SIDE_H = 9.0         // the side bays' cornice
const SPM_TOWER_H = 11.4       // the central block's eaves
const SPM_GABLE_H = 14.2       // the stepped gable's top
const SPM_NAVE_H = 10.6, SPM_RIDGE = 5.0, SPM_ROOF_INSET = 0.4  // roof over the whole body, ridge running away from the street
const SPM_TOWER_W = 6.8        // central block width
const SPM_DOOR_W = 2.2, SPM_DOOR_H = 3.6
const SPM_HOOD_W = 6.0, SPM_HOOD_PEAK = 6.9
const SPM_WIN_W = 1.5, SPM_WIN_Y0 = 7.6, SPM_WIN_Y1 = 12.2
const SPM_SPIRE_D = 5.0, SPM_SPIRE_R = 1.8, SPM_SPIRE_Y0 = SPM_GABLE_H - 0.6, SPM_SPIRE_Y1 = 29
const SPM_RAIL_V = 1.1, SPM_RAIL_H = 1.5, SPM_RAIL_STEP = 0.22

export function templeSaintPaulMontmartre(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SPM_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(SPM_FB[0] - SPM_FA[0], SPM_FB[1] - SPM_FA[1])
  const fu: P2 = [(SPM_FB[0] - SPM_FA[0]) / L, (SPM_FB[1] - SPM_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [SPM_FA[0] + fu[0] * u + fn[0] * v, SPM_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const stone = SPM_STONE
  const uOfX = (px: number): number => mid - (px - SPM_CX) * SPM_MX
  const uOf = (e: number, n: number): number => (e - SPM_FA[0]) * fu[0] + (n - SPM_FA[1]) * fu[1]
  const vOf = (e: number, n: number): number => (e - SPM_FA[0]) * fn[0] + (n - SPM_FA[1]) * fn[1]
  let depth = 0
  for (const [e, n] of SPM_RING) depth = Math.max(depth, -vOf(e, n))
  const uc = uOfX(SPM_PORTAL_PX), ut0 = uc - SPM_TOWER_W / 2, ut1 = uc + SPM_TOWER_W / 2
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)

  // ---- nave walls with a slate roof, ridge along the long axis; the front block, side bays and stepped gable
  pr(SPM_RING, 0, SPM_NAVE_H, tone(stone, 0.88), SPM_SLATE, 0.9, 0.12)
  let uLo = 0, uHi = W
  for (const [e, n] of SPM_RING) { uLo = Math.min(uLo, uOf(e, n)); uHi = Math.max(uHi, uOf(e, n)) }
  const um = (uLo + uHi) / 2
  { // slate gable roof over the whole body, ridge running away from the street (a prism top is one flat polygon, so built from faces)
    const u0 = uLo + SPM_ROOF_INSET, u1 = uHi - SPM_ROOF_INSET, vA = -1.0, vB = -(depth - SPM_ROOF_INSET), y0 = SPM_NAVE_H - 0.1, y1 = SPM_NAVE_H + SPM_RIDGE
    poly([P(u0, vA, y0), P(um, vA, y1), P(um, vB, y1), P(u0, vB, y0)], SPM_SLATE, [-fu[0] * 0.5 + 0, -fu[1] * 0.5, 1])
    poly([P(u1, vB, y0), P(um, vB, y1), P(um, vA, y1), P(u1, vA, y0)], tone(SPM_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(u0, vA, y0), P(u1, vA, y0), P(um, vA, y1)], tone(stone, 0.88), hint)
    poly([P(u1, vB, y0), P(u0, vB, y0), P(um, vB, y1)], tone(stone, 0.88), [-hint[0], -hint[1], 0])
  }
  pr(rect(0, W, -1.2, 0), 0, SPM_SIDE_H, tone(stone, 1.0), tone(stone, 0.9))                       // side bays
  pr(rect(0, W, -1.0, 0.16), SPM_SIDE_H - 0.4, SPM_SIDE_H, tone(stone, 1.1), tone(stone, 0.85))    // their cornice
  pr(rect(ut0, ut1, -1.4, 0.05), 0, SPM_TOWER_H, tone(stone, 1.04), tone(stone, 0.92))             // central block
  pr(rect(ut0 - 0.1, ut1 + 0.1, -1.2, 0.18), SPM_TOWER_H - 0.35, SPM_TOWER_H, tone(stone, 1.12), tone(stone, 0.85))
  // stepped gable: the block narrows to a ridge, with raking cornices
  pr(rect(ut0 + 0.5, ut1 - 0.5, -1.0, 0), SPM_TOWER_H - 0.1, (e, n) => SPM_TOWER_H + (SPM_GABLE_H - SPM_TOWER_H) * Math.max(0, 1 - Math.abs(uOf(e, n) - uc) / (SPM_TOWER_W / 2 - 0.5)), tone(stone, 1.04), SPM_SLATE, 0.8, 0.2)
  for (const s of [-1, 1]) {
    const ua = uc + s * (SPM_TOWER_W / 2 - 0.5), ub = uc
    poly([P(ua, 0.05, SPM_TOWER_H), P(ub, 0.05, SPM_GABLE_H), P(ub, 0.05, SPM_GABLE_H + 0.28), P(ua, 0.05, SPM_TOWER_H + 0.28)], tone(stone, 1.14), hint)
  }
  pr(rect(uc - 0.1, uc + 0.1, -0.25, 0.02), SPM_GABLE_H, SPM_GABLE_H + 0.9, tone(stone, 1.1), tone(stone, 0.95))                     // finial
  band(0, W, 0, 0.7, 0.04, tone(stone, 0.78))                                                       // plinth
  for (const y of [3.4, 7.0]) band(0, W, y, y + 0.18, 0.1, tone(stone, 1.1))                         // string courses
  // ashlar coursing as faint bands on the central block
  for (let y = 1.0; y < SPM_TOWER_H; y += 0.55) band(ut0, ut1, y, y + 0.03, 0.07, tone(stone, 0.86))

  // ---- the portal: moulded round arch, gabled hood, inscription frieze
  const arch = (c: number, w: number, y0: number, spring: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(c - r, v, y0), P(c + r, v, y0), P(c + r, v, spring)]
    for (let i = 1; i < 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(c + Math.cos(a) * r, v, spring + Math.sin(a) * r)) }
    pts.push(P(c - r, v, spring))
    poly(pts, col, hint)
  }
  const dsp = SPM_DOOR_H - SPM_DOOR_W / 2
  arch(uc, SPM_DOOR_W + 2.2, 0.7, dsp + 0.3, 0.12, tone(stone, 1.15))
  arch(uc, SPM_DOOR_W + 1.3, 0.7, dsp + 0.2, 0.15, tone(stone, 0.88))
  arch(uc, SPM_DOOR_W, 0.7, dsp, 0.19, SPM_WOOD)
  band(uc - 0.05, uc + 0.05, 0.7, SPM_DOOR_H, 0.22, tone(SPM_WOOD, 1.5))
  for (const s of [-1, 1]) pr(rect(uc + s * 1.5 - 0.15, uc + s * 1.5 + 0.15, 0, 0.3), 0.7, 4.0, tone(stone, 1.15), tone(stone, 1.0))    // jamb shafts
  const hy = 4.6, hw = SPM_HOOD_W / 2
  poly([P(uc - hw, 0.14, hy), P(uc + hw, 0.14, hy), P(uc, 0.14, SPM_HOOD_PEAK), P(uc - hw, 0.14, hy)], tone(stone, 1.02), hint)    // gable field
  for (const s of [-1, 1]) {
    poly([P(uc + s * hw, 0.2, hy - 0.1), P(uc, 0.2, SPM_HOOD_PEAK), P(uc, 0.2, SPM_HOOD_PEAK + 0.32), P(uc + s * (hw + 0.2), 0.2, hy + 0.15)], tone(stone, 1.2), hint)
  }
  band(uc - hw - 0.2, uc + hw + 0.2, hy - 0.1, hy + 0.2, 0.2, tone(stone, 1.14))
  band(uc - 1.9, uc + 1.9, hy + 0.35, hy + 0.9, 0.22, tone(SPM_WOOD, 1.7))                           // lettered frieze
  for (let i = -2; i <= 2; i++) band(uc + i * 0.95 - 0.18, uc + i * 0.95 + 0.18, hy + 1.15, hy + 1.5, 0.22, SPM_RED)   // rosettes

  // ---- the tall narrow window with twin colonnettes, over the portal
  const wu = uc, wy0 = SPM_WIN_Y0, wy1 = SPM_WIN_Y1
  arch(wu, SPM_WIN_W + 0.6, wy0 - 0.15, wy1 - 0.5, 0.1, tone(stone, 1.12))
  arch(wu, SPM_WIN_W, wy0, wy1 - 0.5, 0.14, SPM_GLASS)
  for (let k = 1; k < 4; k++) band(wu - SPM_WIN_W / 2, wu + SPM_WIN_W / 2, wy0 + ((wy1 - wy0) * k) / 4 - 0.5, wy0 + ((wy1 - wy0) * k) / 4 - 0.46, 0.17, tone(stone, 0.9))   // leading
  band(wu - 0.05, wu + 0.05, wy0, wy1 - 0.4, 0.2, tone(stone, 1.1))                                   // central mullion
  for (const s of [-1, 1]) {
    pr(rect(uc + s * 1.7 - 0.17, uc + s * 1.7 + 0.17, 0.02, 0.4), 7.3 + (s > 0 ? 0 : 0), SPM_TOWER_H + 1.4, tone(stone, 1.18), tone(stone, 1.05))   // colonnette
    pr(rect(uc + s * 1.7 - 0.3, uc + s * 1.7 + 0.3, 0.0, 0.48), 6.8, 7.4, tone(stone, 1.05), tone(stone, 0.95))                                    // corbel
  }

  // ---- side bays: narrow red-cross window (north), twin arched windows (south)
  const un = uOfX(215), us = uOfX(695)
  arch(un, 0.9, 3.2, 4.6, 0.1, tone(stone, 1.12)); arch(un, 0.55, 3.35, 4.6, 0.14, SPM_GLASS)
  band(un - 0.12, un + 0.12, 5.3, 5.55, 0.15, SPM_RED); band(un - 0.04, un + 0.04, 5.15, 5.7, 0.15, SPM_RED)
  for (const d of [-0.45, 0.45]) { arch(us + d, 0.7, 5.7, 6.6, 0.1, tone(stone, 1.12)); arch(us + d, 0.42, 5.8, 6.6, 0.14, SPM_GLASS) }
  { const ud = uOfX(850)                                                                                 // the big wooden gate beyond
    if (ud > 0.3) arch(ud, 1.6, 0.7, 3.0, 0.1, SPM_WOOD) }

  // ---- iron railing along the boulevard edge
  for (let u = 0.1; u < W; u += SPM_RAIL_STEP) band(u - 0.02, u + 0.02, 0.5, SPM_RAIL_H, SPM_RAIL_V, SPM_IRON)
  band(0, W, SPM_RAIL_H - 0.12, SPM_RAIL_H - 0.06, SPM_RAIL_V + 0.01, SPM_IRON)
  band(0, W, 0.55, 0.61, SPM_RAIL_V + 0.01, SPM_IRON)

  // ---- stone spire behind the gable, octagonal on a square base
  const sc = EN(uc, -SPM_SPIRE_D)
  pr(rectPoly(sc, SPM_SPIRE_R, 8), SPM_SPIRE_Y0 - 0.3, SPM_SPIRE_Y0 + 0.6, tone(stone, 1.08), tone(stone, 0.9))
  { // eight faces to the tip
    const ring8 = rectPoly(sc, SPM_SPIRE_R * 0.95, 8)
    for (let i = 0; i < 8; i++) {
      const p = ring8[i], q = ring8[(i + 1) % 8], mx = (p[0] + q[0]) / 2 - sc[0], my = (p[1] + q[1]) / 2 - sc[1]
      poly([[p[0], p[1], SPM_SPIRE_Y0], [q[0], q[1], SPM_SPIRE_Y0], [sc[0], sc[1], SPM_SPIRE_Y1]], i % 2 ? tone(stone, 0.95) : tone(stone, 1.05), [mx, my, 0.15])
    }
  }
}

// ---- Église luthérienne du Bon-Secours (20 rue Titon, 11e; A. Rey 1890s): front faces west onto the street behind an iron railing
const BS_RING: P2[] = [[4008.3, -942.1], [3998.5, -943.6], [3998.0, -939.5], [3988.3, -940.6], [3988.7, -945.0], [3991.0, -944.8], [3991.1, -956.4], [4015.1, -953.1], [4022.4, -952.1], [4021.4, -949.1], [4018.7, -940.5]]
const BS_FA: P2 = [3991.0, -956.4], BS_FB: P2 = [3991.0, -944.8]     // main front, south to north (outward = west, onto rue Titon)
const BS_STONE: Rgb = [0.80, 0.72, 0.55]
const BS_SLATE: Rgb = [0.30, 0.32, 0.36]
const BS_GLASS: Rgb = [0.12, 0.15, 0.20]
const BS_WOOD: Rgb = [0.22, 0.12, 0.08]
const BS_IRON: Rgb = [0.07, 0.07, 0.08]
const BS_M = 0.0219           // metres per photo pixel (530 px across the 11.6 m main front)
const BS_GY = 1270            // photo y of the ground
const BS_CX = 610             // photo x of the centre line
const BS_NAVE_H = 9.6         // shoulders of the front gable and the nave walls
const BS_PEAK_H = 13.4
const BS_RIDGE = 3.4
const BS_NAVE_D = 29          // nave length behind the front
const BS_WING_W = 4.4, BS_WING_FWD = 2.4, BS_WING_D = 7.4, BS_WING_H = 6.3, BS_WING_RISE = 1.9
const BS_PORCH_W = 6.4, BS_PORCH_V = 1.5, BS_PORCH_EAVE = 3.6, BS_PORCH_PEAK = 5.7
const BS_ARCH_W = 4.6, BS_ARCH_H = 3.9, BS_DOOR_W = 2.5, BS_DOOR_H = 3.2
const BS_ROSE_Y = 7.7, BS_ROSE_R = 1.9, BS_ROSE_ARCH_W = 5.0, BS_ROSE_ARCH_Y0 = 4.0, BS_ROSE_ARCH_Y1 = 10.6
const BS_SIDE_X = [425, 795], BS_COL_X = [392, 462, 758, 832]
const BS_BELFRY_Y0 = 14.4, BS_BELFRY_Y1 = 17.4, BS_BELFRY_R = 1.25, BS_SPIRE_Y1 = 21.3, BS_CROSS_Y = 22.7
const BS_RAIL_V = 3.2, BS_RAIL_H = 2.0, BS_RAIL_STEP = 0.28

export function egliseBonSecours(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BS_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BS_FB[0] - BS_FA[0], BS_FB[1] - BS_FA[1])
  const fu: P2 = [(BS_FB[0] - BS_FA[0]) / L, (BS_FB[1] - BS_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [BS_FA[0] + fu[0] * u + fn[0] * v, BS_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const stone = BS_STONE
  const uOfX = (px: number): number => mid - (px - BS_CX) * BS_M
  const yOf = (py: number): number => (BS_GY - py) * BS_M
  const uOf = (e: number, n: number): number => (e - BS_FA[0]) * fu[0] + (n - BS_FA[1]) * fu[1]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void => poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (c: number, w: number, y0: number, spring: number, v: number, col: Rgb): void => {   // round arch, flat on the facade
    const r = w / 2, pts: V3[] = [P(c - r, v, y0), P(c + r, v, y0), P(c + r, v, spring)]
    for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI; pts.push(P(c + Math.cos(a) * r, v, spring + Math.sin(a) * r)) }
    pts.push(P(c - r, v, spring)); poly(pts, col, hint)
  }
  const disc = (c: number, y: number, r: number, v: number, col: Rgb): void => {
    const pts: V3[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(c + Math.cos(a) * r, v, y + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }

  // ---- nave and front block: gable front, slate ridge roof running back from the street
  pr(rect(0, W, -BS_NAVE_D, -0.3), 0, BS_NAVE_H, tone(stone, 0.9), BS_SLATE)
  pr(rect(W, W + BS_WING_W - 0.2, -BS_NAVE_D, -BS_WING_D - 0.1), 0, 8.4, tone(stone, 0.88), BS_SLATE)     // rear widening toward the NE
  pr(rect(0, W, -1.2, 0), 0, BS_NAVE_H - 0.1, tone(stone, 1.0), tone(stone, 0.9), 0.9, 0.1)
  pr(rect(0, W, -1.0, -0.05), BS_NAVE_H - 0.15, (e, n) => BS_NAVE_H + (BS_PEAK_H - BS_NAVE_H) * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / mid), tone(stone, 1.0), BS_SLATE, 0.8, 0.2)
  { const u0 = 0.2, u1 = W - 0.2, vA = -0.4, vB = -BS_NAVE_D + 0.3, y0 = BS_NAVE_H - 0.1, y1 = BS_NAVE_H + BS_RIDGE
    poly([P(u0, vA, y0), P(mid, vA, y1), P(mid, vB, y1), P(u0, vB, y0)], BS_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(u1, vB, y0), P(mid, vB, y1), P(mid, vA, y1), P(u1, vA, y0)], tone(BS_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(u1, vB, y0), P(u0, vB, y0), P(mid, vB, y1)], tone(stone, 0.88), [-fn[0], -fn[1], 0]) }
  // raking cornice with carved band, corner pilasters, string courses, plinth
  for (const s of [0, W]) poly([P(s, 0.16, BS_NAVE_H - 0.1), P(mid, 0.16, BS_PEAK_H - 0.1), P(mid, 0.16, BS_PEAK_H + 0.32), P(s, 0.16, BS_NAVE_H + 0.32)], tone(stone, 1.14), hint)
  for (const s of [0, W]) poly([P(s, 0.2, BS_NAVE_H + 0.0), P(mid, 0.2, BS_PEAK_H), P(mid, 0.2, BS_PEAK_H + 0.12), P(s, 0.2, BS_NAVE_H + 0.12)], tone(stone, 0.8), hint)
  band(0, W, 0, 0.8, 0.1, tone(stone, 0.8))
  band(0, W, yOf(1015), yOf(1005), 0.14, tone(stone, 1.12)); band(0, W, yOf(800), yOf(790), 0.14, tone(stone, 1.1))
  for (const u of [0.45, W - 0.45]) pr(rect(u - 0.45, u + 0.45, -0.3, 0.2), 0, BS_NAVE_H, tone(stone, 1.06), tone(stone, 0.9))
  for (let y = 1.0; y < BS_NAVE_H; y += 0.5) band(0.9, W - 0.9, y, y + 0.03, 0.08, tone(stone, 0.86))   // ashlar coursing
  { const uc = mid                                                                                    // gable crown: small arched niche and the belfry base
    arch(uc, 1.0, BS_PEAK_H - 1.5, BS_PEAK_H - 1.1, 0.1, tone(stone, 1.15)); arch(uc, 0.6, BS_PEAK_H - 1.4, BS_PEAK_H - 1.1, 0.13, BS_GLASS) }

  // ---- great rose window in a moulded round arch
  { const c = mid, sp = BS_ROSE_ARCH_Y1 - BS_ROSE_ARCH_W / 2
    arch(c, BS_ROSE_ARCH_W + 0.9, BS_ROSE_ARCH_Y0 - 0.2, sp - 0.4, 0.1, tone(stone, 1.16))
    arch(c, BS_ROSE_ARCH_W + 0.4, BS_ROSE_ARCH_Y0 - 0.1, sp - 0.3, 0.12, tone(stone, 0.86))
    arch(c, BS_ROSE_ARCH_W - 0.2, BS_ROSE_ARCH_Y0, sp - 0.1, 0.14, tone(stone, 1.05))
    disc(c, BS_ROSE_Y, BS_ROSE_R + 0.18, 0.16, tone(stone, 1.2)); disc(c, BS_ROSE_Y, BS_ROSE_R, 0.19, BS_GLASS)
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; disc(c + Math.cos(a) * BS_ROSE_R * 0.62, BS_ROSE_Y + Math.sin(a) * BS_ROSE_R * 0.62, BS_ROSE_R * 0.28, 0.22, tone(stone, 1.08)); disc(c + Math.cos(a) * BS_ROSE_R * 0.62, BS_ROSE_Y + Math.sin(a) * BS_ROSE_R * 0.62, BS_ROSE_R * 0.22, 0.25, BS_GLASS) }
    disc(c, BS_ROSE_Y, BS_ROSE_R * 0.3, 0.22, tone(stone, 1.08)); disc(c, BS_ROSE_Y, BS_ROSE_R * 0.24, 0.25, BS_GLASS)
    for (let k = -2; k <= 2; k++) arch(c + k * 0.78, 0.55, BS_ROSE_ARCH_Y0 + 0.1, BS_ROSE_ARCH_Y0 + 1.1, 0.19, BS_GLASS)    // lancets under the rose
  }
  // ---- side recesses with a tall lancet, free colonnettes
  for (const px of BS_SIDE_X) {
    const c = uOfX(px)
    arch(c, 2.0, 2.6, 6.2, 0.1, tone(stone, 1.14)); arch(c, 1.6, 2.7, 6.2, 0.12, tone(stone, 0.9))
    arch(c, 0.6, 3.0, 5.4, 0.16, BS_GLASS); band(c - 0.04, c + 0.04, 3.0, 6.3, 0.19, tone(stone, 1.0))
  }
  for (const px of BS_COL_X) { const u = uOfX(px); pr(rect(u - 0.14, u + 0.14, 0, 0.32), 1.8, yOf(1020), tone(stone, 1.12), tone(stone, 1.0)); pr(rect(u - 0.22, u + 0.22, -0.05, 0.4), yOf(1020), yOf(1020) + 0.3, tone(stone, 1.0), tone(stone, 0.9)) }
  for (const s of [-1, 1]) arch(mid + s * 4.8, 0.6, 0.9, 1.7, 0.1, tone(stone, 1.1)), arch(mid + s * 4.8, 0.4, 1.0, 1.7, 0.14, BS_GLASS)   // small ground windows beside the porch

  // ---- porch: projecting round arch under a gabled hood, inscription ring, dark door
  { const c = mid, hw = BS_PORCH_W / 2, v = BS_PORCH_V
    pr(rect(c - hw, c + hw, 0, v), 0, BS_PORCH_EAVE, tone(stone, 1.02), tone(stone, 0.92))
    pr(rect(c - hw - 0.2, c + hw + 0.2, -0.05, v + 0.2), BS_PORCH_EAVE - 0.25, BS_PORCH_EAVE, tone(stone, 1.16), tone(stone, 0.9))
    poly([P(c - hw, v, BS_PORCH_EAVE), P(c, v, BS_PORCH_PEAK), P(c + hw, v, BS_PORCH_EAVE)], tone(stone, 1.0), hint)
    for (const s of [-1, 1]) poly([P(c + s * (hw + 0.3), v + 0.1, BS_PORCH_EAVE - 0.1), P(c, v + 0.1, BS_PORCH_PEAK + 0.1), P(c, v + 0.1, BS_PORCH_PEAK + 0.42), P(c + s * (hw + 0.3), v + 0.1, BS_PORCH_EAVE + 0.3)], tone(stone, 1.2), hint)
    const sp = BS_ARCH_H - BS_ARCH_W / 2
    arch(c, BS_ARCH_W + 0.5, 0.2, sp, v + 0.05, tone(stone, 1.15)); arch(c, BS_ARCH_W - 0.3, 0.2, sp - 0.05, v + 0.08, tone(stone, 0.78))     // moulding and the inscription ring
    arch(c, BS_ARCH_W - 1.3, 0.2, sp - 0.2, v + 0.1, tone(stone, 1.0))
    arch(c, BS_DOOR_W, 0.3, BS_DOOR_H - BS_DOOR_W / 2, v + 0.14, BS_WOOD); band(c - 0.04, c + 0.04, 0.3, BS_DOOR_H, v + 0.17, tone(BS_WOOD, 1.5))
    for (const s of [-1, 1]) pr(rect(c + s * (hw - 0.3) - 0.4, c + s * (hw - 0.3) + 0.4, 0.1, v + 0.3), 1.8, 2.2, tone(stone, 1.1), tone(stone, 0.9))     // carved corbels
    for (let k = 0; k < 4; k++) pr(rect(c - 1.8 + k * 0.2, c + 1.8 - k * 0.2, 0.5, v + 1.2 - k * 0.3), 0, 0.12 * (4 - k), tone(stone, 0.95), null)    // steps
  }

  // ---- north wing: three arched windows over two plain ones, hipped slate roof, pedimented door
  { const u0 = W, u1 = W + BS_WING_W, fv = BS_WING_FWD
    pr(rect(u0, u1, -BS_WING_D, fv), 0, BS_WING_H, tone(stone, 0.98), BS_SLATE)
    pr(rect(u0, u1 + 0.1, -BS_WING_D, fv + 0.15), BS_WING_H - 0.4, BS_WING_H, tone(stone, 1.12), tone(stone, 0.9))
    poly([P(u0, fv, BS_WING_H), P(u0, -BS_WING_D, BS_WING_H + BS_WING_RISE), P(u1, -BS_WING_D, BS_WING_H + BS_WING_RISE), P(u1, fv, BS_WING_H)], BS_SLATE, [fn[0] * 0.6, fn[1] * 0.6, 1])
    band(u0, u1, 0, 0.8, fv + 0.03, tone(stone, 0.8)); band(u0, u1, 2.9, 3.05, fv + 0.05, tone(stone, 1.12)); band(u0, u1, 4.4, 4.5, fv + 0.05, tone(stone, 1.1))
    const cw = (k: number): number => u0 + (BS_WING_W * (k + 0.5)) / 3
    for (let k = 0; k < 3; k++) { arch(cw(k), 1.0, 3.5, 4.5, fv + 0.06, tone(stone, 1.14)); arch(cw(k), 0.66, 3.6, 4.5, fv + 0.09, BS_GLASS); band(cw(k) - 0.03, cw(k) + 0.03, 3.6, 5.1, fv + 0.12, tone(stone, 1.0)) }
    arch((u0 + u1) / 2, BS_WING_W - 0.5, 5.3, 5.55, fv + 0.04, tone(stone, 0.92)); band(u0 + 0.2, u1 - 0.2, 5.3, 5.55, fv + 0.05, tone(stone, 0.92))
    for (const k of [0, 2]) { band(cw(k) - 0.55, cw(k) + 0.55, 0.8, 2.5, fv + 0.06, tone(stone, 1.12)); band(cw(k) - 0.42, cw(k) + 0.42, 0.9, 2.4, fv + 0.1, BS_GLASS) }
    poly([P(cw(0) - 0.8, fv + 0.1, 2.5), P(cw(0), fv + 0.1, 3.0), P(cw(0) + 0.8, fv + 0.1, 2.5)], tone(stone, 1.15), hint)   // little pediment
  }

  // ---- bellcote on the ridge: stone base, slate louvred box with a lantern spire and cross
  { const c = EN(mid, -1.4), r = BS_BELFRY_R
    pr(rectPoly(c, r * 0.95, 4), BS_PEAK_H - 0.6, BS_BELFRY_Y0, tone(stone, 1.06), tone(stone, 0.9))
    pr(rectPoly(c, r * 1.1, 4), BS_BELFRY_Y0 - 0.25, BS_BELFRY_Y0 + 0.1, tone(stone, 1.12), tone(stone, 0.9))
    pr(rectPoly(c, r * 0.9, 4), BS_BELFRY_Y0, BS_BELFRY_Y1 - 0.3, BS_SLATE, tone(BS_SLATE, 0.9))
    pr(rectPoly(c, r * 1.12, 4), BS_BELFRY_Y1 - 0.3, BS_BELFRY_Y1 + 0.15, tone(BS_SLATE, 0.8), tone(BS_SLATE, 0.7))
    const cu = mid
    arch(cu, 1.0, BS_BELFRY_Y0 + 0.5, BS_BELFRY_Y0 + 1.7, -1.4 + r * 0.9 * 0.7071 + 0.03, BS_GLASS)
    const ring8 = rectPoly(c, r * 1.0, 8)
    for (let i = 0; i < 8; i++) {
      const p = ring8[i], q = ring8[(i + 1) % 8], mx = (p[0] + q[0]) / 2 - c[0], my = (p[1] + q[1]) / 2 - c[1]
      poly([[p[0], p[1], BS_BELFRY_Y1 + 0.15], [q[0], q[1], BS_BELFRY_Y1 + 0.15], [c[0], c[1], BS_SPIRE_Y1]], i % 2 ? tone(BS_SLATE, 0.9) : BS_SLATE, [mx, my, 0.4])
    }
    pr(rectPoly(c, 0.05, 4), BS_SPIRE_Y1 - 0.2, BS_CROSS_Y, BS_IRON, BS_IRON)
    pr(rectPoly(c, 0.3, 4), BS_CROSS_Y - 0.8, BS_CROSS_Y - 0.72, BS_IRON, BS_IRON)
  }

  // ---- iron railing along the street, with two gate piers
  const uR0 = -0.4, uR1 = W + BS_WING_W + 0.4
  for (let u = uR0; u <= uR1; u += BS_RAIL_STEP) band(u - 0.02, u + 0.02, 0.15, BS_RAIL_H, BS_RAIL_V, BS_IRON)
  band(uR0, uR1, BS_RAIL_H - 0.12, BS_RAIL_H - 0.06, BS_RAIL_V + 0.01, BS_IRON)
  band(uR0, uR1, 0.3, 0.36, BS_RAIL_V + 0.01, BS_IRON)
}

// ───────────────────── Temple protestant de Neuilly-sur-Seine (way/81248340, 60 rue Perronet) ─────────────────────
// Small Gothic-revival chapel in a garden behind a wall and railing. Read off two Commons photographs
// (docs/landmarks/refs/neuilly/, 2026-11-04): Temple_protestant_de_Neuilly (front, snow) and a ND postcard — buff rubble-
// and-ashlar gable facing west onto the garden, a projecting central bay with a steep gable, a rose window over a pointed
// porch with a red door and colonnettes, narrow arched windows either side on two levels, corner buttress strips, and a
// small bellcote with a cross on the ridge. Rear and south hall are lower blocks from the OSM plan. Photo scale ~0.018 m/px.
const NE_RING: P2[] = [[-4208.04, 2736.05], [-4199.95, 2733.81], [-4191.9, 2731.58], [-4189.99, 2738.37], [-4187.07, 2737.77], [-4184.06, 2748.84], [-4201.08, 2753.42], [-4203.74, 2753.9], [-4204.4, 2751.36], [-4205.65, 2750.0], [-4205.67, 2747.86], [-4206.12, 2746.16], [-4206.9, 2745.53], [-4206.74, 2742.77]]
const NE_FA: P2 = [-4206.5, 2742.4], NE_FB: P2 = [-4205.3, 2751.1]     // main front, south to north (outward = west, onto the garden)
const NE_STONE: Rgb = [0.74, 0.66, 0.50]
const NE_SLATE: Rgb = [0.32, 0.33, 0.37]
const NE_GLASS: Rgb = [0.13, 0.15, 0.20]
const NE_RED: Rgb = [0.52, 0.10, 0.10]
const NE_IRON: Rgb = [0.07, 0.07, 0.08]
const NE_EAVE = 6.6           // front wall top / nave eaves
const NE_PEAK = 9.8           // main gable apex
const NE_BAY_W = 4.8, NE_BAY_OUT = 0.35, NE_BAY_PEAK = 8.7, NE_BAY_EAVE = 6.4     // projecting central bay
const NE_NAVE_D = 14.0        // nave length behind the front
const NE_HALL_D = 15.0, NE_HALL_H = 4.6, NE_HALL_SOUTH = 7.2      // south hall: depth, height, extent south of the front
const NE_ROSE_Y = 7.0, NE_ROSE_R = 1.0
const NE_PORCH_W = 2.6, NE_PORCH_H = 3.9, NE_DOOR_W = 1.5, NE_DOOR_H = 2.7
const NE_SIDE_X = 2.9         // side window offset from the centre line
const NE_BELL_Y0 = 9.4, NE_BELL_Y1 = 11.6, NE_BELL_R = 0.85, NE_CROSS_Y = 13.2
const NE_WALL_H = 2.4, NE_WALL_V = 3.0     // garden wall along the front

export function templeNeuilly(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(NE_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(NE_FB[0] - NE_FA[0], NE_FB[1] - NE_FA[1])
  const fu: P2 = [(NE_FB[0] - NE_FA[0]) / L, (NE_FB[1] - NE_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [NE_FA[0] + fu[0] * u + fn[0] * v, NE_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2, stone = NE_STONE
  const uOf = (e: number, n: number): number => (e - NE_FA[0]) * fu[0] + (n - NE_FA[1]) * fu[1]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void => poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const og = (c: number, v: number, y0: number, w: number, h: number, col: Rgb, off = 0): void => ogive(T, EN(c, v), fu, fn, y0, w, h, col, off)
  const disc = (c: number, y: number, r: number, v: number, col: Rgb): void => {
    const pts: V3[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(c + Math.cos(a) * r, v, y + Math.sin(a) * r)) }
    poly(pts, col, hint)
  }

  // ---- nave: gabled front wall, slate ridge roof running east
  pr(rect(0, W, -NE_NAVE_D, -0.3), 0, NE_EAVE, tone(stone, 0.92), NE_SLATE)
  pr(rect(0, W, -1.0, 0), 0, NE_EAVE - 0.05, tone(stone, 1.0), tone(stone, 0.9), 0.9, 0.1)
  pr(rect(0, W, -0.9, -0.05), NE_EAVE - 0.1, (e, n) => NE_EAVE + (NE_PEAK - NE_EAVE) * Math.max(0, 1 - Math.abs(uOf(e, n) - mid) / mid), tone(stone, 1.0), NE_SLATE, 0.8, 0.2)
  { const u0 = 0.15, u1 = W - 0.15, vA = -0.4, vB = -NE_NAVE_D + 0.3, y0 = NE_EAVE - 0.1, y1 = NE_PEAK - 0.6
    poly([P(u0, vA, y0), P(mid, vA, y1), P(mid, vB, y1), P(u0, vB, y0)], NE_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(u1, vB, y0), P(mid, vB, y1), P(mid, vA, y1), P(u1, vA, y0)], tone(NE_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(u1, vB, y0), P(u0, vB, y0), P(mid, vB, y1)], tone(stone, 0.88), [-fn[0], -fn[1], 0]) }
  for (const s of [0, W]) poly([P(s, 0.14, NE_EAVE - 0.1), P(mid, 0.14, NE_PEAK - 0.1), P(mid, 0.14, NE_PEAK + 0.28), P(s, 0.14, NE_EAVE + 0.28)], tone(stone, 1.14), hint)   // raking band
  band(0, W, 0, 0.6, 0.1, tone(stone, 0.8))                                                           // plinth
  for (let y = 0.9; y < NE_EAVE; y += 0.45) band(0.5, W - 0.5, y, y + 0.03, 0.08, tone(stone, 0.84))  // coursing
  for (const u of [0.35, W - 0.35]) pr(rect(u - 0.35, u + 0.35, -0.3, 0.2), 0, NE_EAVE + 0.2, tone(stone, 1.06), tone(stone, 0.9))   // corner buttress strips
  band(0.3, W - 0.3, 2.4, 2.5, 0.12, tone(stone, 1.14))                                                // string course

  // ---- projecting central bay with its own steep gable, rose window, porch
  { const c = mid, hw = NE_BAY_W / 2, v = NE_BAY_OUT
    pr(rect(c - hw, c + hw, -0.2, v), 0, NE_BAY_EAVE, tone(stone, 1.02), tone(stone, 0.92))
    poly([P(c - hw, v, NE_BAY_EAVE), P(c, v, NE_BAY_PEAK), P(c + hw, v, NE_BAY_EAVE)], tone(stone, 1.0), hint)
    for (const s of [-1, 1]) {
      poly([P(c + s * hw, v + 0.06, NE_BAY_EAVE - 0.1), P(c, v + 0.06, NE_BAY_PEAK - 0.1), P(c, v + 0.06, NE_BAY_PEAK + 0.3), P(c + s * (hw + 0.2), v + 0.06, NE_BAY_EAVE + 0.2)], tone(stone, 1.18), hint)
      poly([P(c, -0.3, NE_BAY_PEAK + 0.15), P(c, -0.3 - 0.6, NE_BAY_PEAK + 0.15), P(c + s * (hw + 0.2), -0.9, NE_BAY_EAVE + 0.2), P(c + s * (hw + 0.2), v, NE_BAY_EAVE + 0.2)], NE_SLATE, [fn[0] * 0.5, fn[1] * 0.5, 1])
      pr(rect(c + s * hw - 0.3, c + s * hw + 0.3, -0.1, v + 0.3), 0, NE_BAY_EAVE + 0.2, tone(stone, 1.1), tone(stone, 0.92))     // flanking buttress
    }
    band(c - hw, c + hw, 2.4, 2.5, v + 0.04, tone(stone, 1.14))
    disc(c, NE_ROSE_Y, NE_ROSE_R + 0.35, v + 0.04, tone(stone, 1.15)); disc(c, NE_ROSE_Y, NE_ROSE_R + 0.15, v + 0.07, tone(stone, 0.85))
    disc(c, NE_ROSE_Y, NE_ROSE_R, v + 0.1, NE_GLASS)
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; disc(c + Math.cos(a) * NE_ROSE_R * 0.6, NE_ROSE_Y + Math.sin(a) * NE_ROSE_R * 0.6, NE_ROSE_R * 0.24, v + 0.13, tone(stone, 1.1)) }
    disc(c, NE_ROSE_Y, NE_ROSE_R * 0.22, v + 0.13, tone(stone, 1.1))
    // pointed porch: moulded arch, red door, free colonnettes
    og(c, v, 0.15, NE_PORCH_W + 0.7, NE_PORCH_H + 0.3, tone(stone, 1.16), 0.05)
    og(c, v, 0.15, NE_PORCH_W, NE_PORCH_H, tone(stone, 0.86), 0.08)
    og(c, v, 0.15, NE_PORCH_W - 0.5, NE_PORCH_H - 0.4, tone(stone, 1.05), 0.1)
    og(c, v, 0.2, NE_DOOR_W, NE_DOOR_H, NE_RED, 0.14); band(c - 0.03, c + 0.03, 0.2, NE_DOOR_H - 0.5, v + 0.17, tone(NE_RED, 1.5))
    for (const s of [-1, 1]) pr(rect(c + s * 0.95 - 0.12, c + s * 0.95 + 0.12, v + 0.05, v + 0.3), 0.15, 2.5, tone(stone, 1.15), tone(stone, 1.0))
    for (let k = 0; k < 2; k++) pr(rect(c - 1.2 + k * 0.2, c + 1.2 - k * 0.2, v, v + 0.8 - k * 0.25), 0, 0.14 * (2 - k), tone(stone, 0.95), null)
  }

  // ---- narrow arched windows on both sides, two levels
  for (const s of [-1, 1]) {
    const c = mid + s * NE_SIDE_X
    og(c, 0.06, 0.8, 0.95, 2.4, tone(stone, 1.12), 0.0); og(c, 0.06, 0.95, 0.6, 2.1, NE_GLASS, 0.04)
    og(c, 0.06, 3.6, 0.95, 2.5, tone(stone, 1.12), 0.0); og(c, 0.06, 3.75, 0.6, 2.2, NE_GLASS, 0.04)
  }
  band(mid - 0.6, mid + 0.6, 2.9, 3.0, 0.2, tone(stone, 1.0))

  // ---- gable crown: small bellcote on the ridge
  { const c = EN(mid, -1.0), r = NE_BELL_R
    pr(rectPoly(c, r * 1.1, 4), NE_PEAK - 0.7, NE_BELL_Y0, tone(stone, 1.06), tone(stone, 0.9))
    pr(rectPoly(c, r, 4), NE_BELL_Y0, NE_BELL_Y1, tone(stone, 1.0), tone(stone, 0.9))
    og(mid, -1.0 + r * 0.7071 + 0.04, NE_BELL_Y0 + 0.2, 0.7, 1.7, NE_GLASS, 0.02)
    const cap = rectPoly(c, r * 1.1, 4)
    for (let i = 0; i < 4; i++) poly([[cap[i][0], cap[i][1], NE_BELL_Y1], [cap[(i + 1) % 4][0], cap[(i + 1) % 4][1], NE_BELL_Y1], [c[0], c[1], NE_BELL_Y1 + 1.2]], NE_SLATE, [cap[i][0] - c[0], cap[i][1] - c[1], 0.5])
    pr(rectPoly(c, 0.05, 4), NE_BELL_Y1 + 1.1, NE_CROSS_Y, NE_IRON, NE_IRON)
    pr(rectPoly(c, 0.25, 4), NE_CROSS_Y - 0.5, NE_CROSS_Y - 0.44, NE_IRON, NE_IRON)
  }

  // ---- south hall (lower, gabled slate roof running east) and a low north annex from the OSM plan
  { const u0 = -NE_HALL_SOUTH, u1 = -0.1, v0 = -NE_HALL_D, v1 = 0.9
    pr(rect(u0, u1, v0, v1), 0, NE_HALL_H, tone(stone, 0.96), NE_SLATE)
    pr(rect(u0 - 0.1, u1 + 0.05, v0, v1 + 0.15), NE_HALL_H - 0.4, NE_HALL_H, tone(stone, 1.12), tone(stone, 0.9))
    const um = (u0 + u1) / 2
    poly([P(u0, v1, NE_HALL_H), P(um, v1, NE_HALL_H + 1.8), P(um, v0, NE_HALL_H + 1.8), P(u0, v0, NE_HALL_H)], NE_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(u1, v0, NE_HALL_H), P(um, v0, NE_HALL_H + 1.8), P(um, v1, NE_HALL_H + 1.8), P(u1, v1, NE_HALL_H)], tone(NE_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(u0, v1 + 0.05, NE_HALL_H), P(um, v1 + 0.05, NE_HALL_H + 1.8), P(u1, v1 + 0.05, NE_HALL_H)], tone(stone, 0.96), hint)
    for (let k = 0; k < 3; k++) { const c = u0 + 1.4 + k * 2.2; og(c, v1 + 0.02, 1.0, 0.8, 2.4, tone(stone, 1.12), 0.0); og(c, v1 + 0.02, 1.1, 0.55, 2.2, NE_GLASS, 0.04) }
    const a0 = W + 0.1, a1 = W + 3.0
    pr(rect(a0, a1, -6.5, 0.6), 0, 4.2, tone(stone, 0.98), NE_SLATE)
    pr(rect(a0 - 0.1, a1 + 0.1, -6.5, 0.7), 3.8, 4.2, tone(stone, 1.12), tone(stone, 0.9))
    og((a0 + a1) / 2, 0.62, 0.9, 0.9, 2.2, tone(stone, 1.12), 0.0); og((a0 + a1) / 2, 0.62, 1.0, 0.6, 2.0, NE_GLASS, 0.04)
  }

  // ---- garden wall and iron railing along the front, with gate piers
  const uR0 = -NE_HALL_SOUTH, uR1 = W + 3.0
  pr(rect(uR0, uR1, NE_WALL_V - 0.2, NE_WALL_V + 0.2), 0, 1.0, tone(stone, 1.05), tone(stone, 0.9))
  for (let u = uR0; u <= uR1; u += 0.25) band(u - 0.02, u + 0.02, 1.0, NE_WALL_H, NE_WALL_V, NE_IRON)
  band(uR0, uR1, NE_WALL_H - 0.12, NE_WALL_H - 0.06, NE_WALL_V + 0.01, NE_IRON)
  for (const u of [mid - 1.6, mid + 1.6]) pr(rect(u - 0.3, u + 0.3, NE_WALL_V - 0.3, NE_WALL_V + 0.3), 0, NE_WALL_H + 0.5, tone(stone, 1.1), tone(stone, 0.95))
}

// ───────────────────── Église danoise / Frederikskirken (way/70187665, 17 rue Lord Byron) ─────────────────────
// 1950s Danish Lutheran church flush on the street (Commons Frederikskirken (Paris) 02 + 03, docs/landmarks/refs/danish/):
// cream rendered wall in a grid of flat pilaster strips, a grey granite plinth, a door bay at the west end (oak double door,
// stone cross in laurel, small square window above) then five tall dark leaded windows over sunk panels, one low-pitched
// dark tile roof falling to the street eave. Local +v is the street (north-north-east); u runs west to east.
const DK_RING: P2[] = [[-2410.8, 1451.1], [-2418.4, 1435.6], [-2400.4, 1426.7], [-2398.8, 1429.9], [-2397.1, 1433.1], [-2392.8, 1442.0], [-2401.7, 1446.5]]
const DK_FA: P2 = [-2410.8, 1451.1], DK_FB: P2 = [-2392.8, 1442.0]      // street front, west to east (outward = north onto rue Lord Byron)
const DK_WALL: Rgb = [0.86, 0.82, 0.66]
const DK_GRANITE: Rgb = [0.60, 0.60, 0.58]
const DK_GLASS: Rgb = [0.09, 0.10, 0.11]
const DK_TILE: Rgb = [0.21, 0.19, 0.19]
const DK_WOOD: Rgb = [0.27, 0.14, 0.07]
const DK_EAVE = 9.7           // wall top / street eave
const DK_RIDGE = 11.9         // ridge height
const DK_PLINTH = 1.3         // granite plinth height
const DK_BAY_W = 3.9          // door bay width (west end)
const DK_PITCH = 3.25         // window pitch
const DK_WIN_N = 5            // tall windows
const DK_WIN_W = 1.9, DK_WIN_Y0 = 3.5, DK_WIN_Y1 = 8.3
const DK_PILASTER = 0.3       // strip width beside each window
const DK_DOOR_U0 = 0.6, DK_DOOR_W = 2.2, DK_DOOR_H = 3.0
const DK_SMALL_Y0 = 7.2, DK_SMALL_Y1 = 8.5, DK_SMALL_W = 1.8
const DK_MULL = 0.42          // leaded-glass grid step

export function egliseDanoise(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(DK_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(DK_FB[0] - DK_FA[0], DK_FB[1] - DK_FA[1])
  const fu: P2 = [(DK_FB[0] - DK_FA[0]) / L, (DK_FB[1] - DK_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [DK_FA[0] + fu[0] * u + fn[0] * v, DK_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  let depth = 0
  for (const [e, n] of DK_RING) depth = Math.max(depth, -((e - DK_FA[0]) * fn[0] + (n - DK_FA[1]) * fn[1]))

  // ---- body and the low tiled roof falling to the street
  pr(DK_RING, 0, DK_EAVE, DK_WALL, DK_TILE)
  { const vA = 0.3, vR = -depth / 2, vB = -depth + 0.1, y0 = DK_EAVE - 0.05
    poly([P(-0.1, vA, y0), P(L + 0.1, vA, y0), P(L + 0.1, vR, DK_RIDGE), P(-0.1, vR, DK_RIDGE)], DK_TILE, [fn[0] * 0.3, fn[1] * 0.3, 1])
    poly([P(-0.1, vB, y0), P(L + 0.1, vB, y0), P(L + 0.1, vR, DK_RIDGE), P(-0.1, vR, DK_RIDGE)], tone(DK_TILE, 0.9), [-fn[0] * 0.3, -fn[1] * 0.3, 1])
    for (const u of [-0.1, L + 0.1]) poly([P(u, vA, y0), P(u, vB, y0), P(u, vR, DK_RIDGE)], DK_WALL, [fu[0] * (u < 1 ? -1 : 1), fu[1] * (u < 1 ? -1 : 1), 0])
    band(-0.1, L + 0.1, DK_EAVE - 0.35, DK_EAVE + 0.02, 0.3, tone(DK_WALL, 1.08))      // eaves fascia
  }
  band(0, L, 0, DK_PLINTH, 0.05, DK_GRANITE)                                           // granite plinth
  band(0, L, DK_PLINTH, DK_PLINTH + 0.18, 0.1, tone(DK_WALL, 1.1))                    // plinth ledge
  band(0, L, DK_EAVE - 1.0, DK_EAVE - 0.7, 0.1, tone(DK_WALL, 1.1))                    // upper frieze band

  // ---- pilaster grid: vertical strips beside each window, top and bottom rails
  const strip = (u: number): void => { pr(rect(u - DK_PILASTER / 2, u + DK_PILASTER / 2, 0, 0.14), DK_PLINTH, DK_EAVE - 0.35, tone(DK_WALL, 1.1), tone(DK_WALL, 1.0)) }
  strip(0.2); strip(DK_BAY_W)
  const wc = (i: number): number => DK_BAY_W + DK_PITCH * (i + 0.5)
  for (let i = 0; i < DK_WIN_N; i++) {
    const c = wc(i), hw = DK_WIN_W / 2
    strip(DK_BAY_W + DK_PITCH * (i + 1))
    band(c - hw - 0.12, c + hw + 0.12, DK_WIN_Y0 - 0.12, DK_WIN_Y1 + 0.12, 0.1, tone(DK_WALL, 1.12))     // window reveal
    band(c - hw, c + hw, DK_WIN_Y0, DK_WIN_Y1, 0.14, DK_GLASS)
    for (let y = DK_WIN_Y0 + DK_MULL; y < DK_WIN_Y1; y += DK_MULL) band(c - hw, c + hw, y - 0.025, y + 0.025, 0.16, tone(DK_WALL, 0.45))
    for (let u = c - hw + DK_MULL; u < c + hw - 0.1; u += DK_MULL) band(u - 0.025, u + 0.025, DK_WIN_Y0, DK_WIN_Y1, 0.16, tone(DK_WALL, 0.45))
    band(c - hw + 0.1, c + hw - 0.1, DK_PLINTH + 0.5, DK_WIN_Y0 - 0.5, 0.11, tone(DK_WALL, 0.93))       // sunk panel below
  }

  // ---- the door bay: oak double door, laurel cross, small square window
  const d0 = DK_DOOR_U0, d1 = DK_DOOR_U0 + DK_DOOR_W, dc = (d0 + d1) / 2
  band(d0 - 0.1, d1 + 0.1, 0, DK_DOOR_H + 0.1, 0.1, tone(DK_WALL, 1.1))
  band(d0, d1, 0, DK_DOOR_H, 0.16, DK_WOOD)
  band(dc - 0.03, dc + 0.03, 0, DK_DOOR_H, 0.18, tone(DK_WOOD, 0.6))
  for (let y = 0.5; y < DK_DOOR_H; y += 0.45) band(d0 + 0.1, d1 - 0.1, y, y + 0.03, 0.18, tone(DK_WOOD, 1.4))
  band(dc - 0.55, dc + 0.55, 5.45, 5.6, 0.18, tone(DK_WALL, 1.25))                      // cross: arm
  band(dc - 0.08, dc + 0.08, 4.1, 6.9, 0.18, tone(DK_WALL, 1.25))                       // cross: stem
  for (const s of [-1, 1]) band(dc + s * 0.32 - 0.05, dc + s * 0.32 + 0.05, 4.3, 5.6, 0.16, tone(DK_WALL, 0.8))   // laurel sprays
  band(dc - DK_SMALL_W / 2, dc + DK_SMALL_W / 2, DK_SMALL_Y0, DK_SMALL_Y1, 0.14, DK_GLASS)
  band(dc - DK_SMALL_W / 2 - 0.15, dc + DK_SMALL_W / 2 + 0.15, DK_SMALL_Y0 - 0.15, DK_SMALL_Y0, 0.13, tone(DK_WALL, 1.15))   // sill
  band(dc - 0.03, dc + 0.03, DK_SMALL_Y0, DK_SMALL_Y1, 0.16, tone(DK_WALL, 0.45))
  band(dc - DK_SMALL_W / 2, dc + DK_SMALL_W / 2, (DK_SMALL_Y0 + DK_SMALL_Y1) / 2 - 0.03, (DK_SMALL_Y0 + DK_SMALL_Y1) / 2 + 0.03, 0.16, tone(DK_WALL, 0.45))
}

// ───────────────────────────── Église réformée de Béthanie (way/70151576) ─────────────────────────────
// 185 rue des Pyrénées, flush on the street (outward = east-north-east, bearing 63). Read off Commons photographs
// (docs/landmarks/refs/bethanie/): a cream rendered gabled nave bay with a round oculus, two tiers of paired
// round-arched windows with sill bands and a round-arched ochre door, between two low wings striped brick red and
// cream under tiled lean-to roofs, each with its own ochre door and arched or square windows. Cross on the apex.
const BT_RING: P2[] = [[4987.0, 70.8], [4980.8, 67.8], [4976.3, 65.5], [4980.8, 56.7], [4978.6, 55.5], [4982.4, 48.1], [4984.6, 49.2], [4990.9, 52.3], [5000.5, 57.0], [4997.9, 61.9], [4995.8, 65.9], [4993.9, 69.7], [4992.1, 73.3]]
const BT_FA: P2 = [4992.1, 73.3], BT_FB: P2 = [5000.5, 57.0]      // street front, viewer's right to left
const BT_WALL: Rgb = [0.84, 0.80, 0.68]
const BT_STONE: Rgb = [0.66, 0.64, 0.58]
const BT_BRICK: Rgb = [0.55, 0.27, 0.22]
const BT_TILE: Rgb = [0.45, 0.24, 0.18]
const BT_SLATE: Rgb = [0.30, 0.31, 0.34]
const BT_DOOR: Rgb = [0.80, 0.56, 0.10]
const BT_GLASS: Rgb = [0.16, 0.19, 0.24]
const BT_N0 = 4.5, BT_N1 = 11.7     // nave bay across the front (u from the viewer's right)
const BT_NAVE_D = 17.0              // nave depth behind the front
const BT_EAVE = 10.2, BT_APEX = 13.3
const BT_WING_H = 4.8, BT_WING_RISE = 1.3, BT_WING_PITCH = 3.5
const BT_PLINTH = 0.8
const BT_STRIPE = 0.85              // stripe pitch on the wings; brick fraction below
const BT_BRICK_FRAC = 0.55

export function egliseBethanie(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BT_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BT_FB[0] - BT_FA[0], BT_FB[1] - BT_FA[1])
  const fu: P2 = [(BT_FB[0] - BT_FA[0]) / L, (BT_FB[1] - BT_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [BT_FA[0] + fu[0] * u + fn[0] * v, BT_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  /** round-arched opening: centre u, base y0, width w, total height h */
  const arch = (uc: number, y0: number, w: number, h: number, col: Rgb, v: number): void => {
    const r = w / 2, ys = y0 + h - r, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(uc - r * Math.cos(a), v, ys + r * Math.sin(a))) }
    poly(pts, col, hint)
  }
  const mid = (BT_N0 + BT_N1) / 2, nw = BT_N1 - BT_N0

  // ---- low body over the whole plan, then the nave block with its slate gable roof
  pr(BT_RING, 0, BT_WING_H, BT_WALL, BT_TILE)
  const nave: P2[] = [EN(BT_N0, 0), EN(BT_N1, 0), EN(BT_N1, -BT_NAVE_D), EN(BT_N0, -BT_NAVE_D)]
  pr(nave, 0, BT_EAVE, BT_WALL, BT_SLATE)
  { const y0 = BT_EAVE - 0.05, vB = -BT_NAVE_D, o = 0.25
    poly([P(BT_N0 - o, 0.3, y0), P(mid, 0.3, BT_APEX), P(mid, vB, BT_APEX), P(BT_N0 - o, vB, y0)], BT_SLATE, [fu[0] * -0.5, fu[1] * -0.5, 1])
    poly([P(BT_N1 + o, 0.3, y0), P(mid, 0.3, BT_APEX), P(mid, vB, BT_APEX), P(BT_N1 + o, vB, y0)], tone(BT_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(BT_N0, 0.01, BT_EAVE - 0.05), P(BT_N1, 0.01, BT_EAVE - 0.05), P(mid, 0.01, BT_APEX)], BT_WALL, hint)       // front gable
    poly([P(BT_N0 - o, 0.3, y0), P(mid, 0.3, BT_APEX + 0.05), P(mid, 0.3, BT_APEX - 0.25), P(BT_N0 - o, 0.3, y0 - 0.25)], tone(BT_WALL, 1.1), hint)
    poly([P(BT_N1 + o, 0.3, y0), P(mid, 0.3, BT_APEX + 0.05), P(mid, 0.3, BT_APEX - 0.25), P(BT_N1 + o, 0.3, y0 - 0.25)], tone(BT_WALL, 1.1), hint)
  }
  // wing lean-to tile roofs rising toward the nave
  for (const [a, b, dir] of [[0, BT_N0, 1], [BT_N1, L, -1]] as [number, number, number][]) {
    const v1 = -BT_WING_PITCH, y0 = BT_WING_H - 0.02, y1 = BT_WING_H + BT_WING_RISE
    poly([P(a, 0.25, y0), P(b, 0.25, y0), P(b, v1, y1), P(a, v1, y1)], BT_TILE, [fn[0] * 0.5, fn[1] * 0.5, 1])
    const e = dir > 0 ? a : b
    poly([P(e, 0.25, y0), P(e, v1, y0), P(e, v1, y1)], BT_WALL, [-fu[0] * dir, -fu[1] * dir, 0])
  }

  // ---- plinth and the wing stripes
  band(0, L, 0, BT_PLINTH, 0.06, BT_STONE)
  for (const [a, b] of [[0, BT_N0], [BT_N1, L]] as [number, number][]) {
    for (let y = BT_PLINTH; y < BT_WING_H - 0.1; y += BT_STRIPE) {
      band(a, b, y, Math.min(y + BT_STRIPE * BT_BRICK_FRAC, BT_WING_H - 0.1), 0.05, BT_BRICK)
    }
    band(a, b, BT_WING_H - 0.18, BT_WING_H + 0.02, 0.2, tone(BT_WALL, 1.1))        // wing cornice
  }

  // ---- wing doors and windows (u from the viewer's right)
  const door = (uc: number, w: number): void => {
    band(uc - w / 2 - 0.12, uc + w / 2 + 0.12, 0, 2.7, 0.08, tone(BT_WALL, 1.1)); band(uc - w / 2, uc + w / 2, 0, 2.55, 0.14, BT_DOOR)
  }
  const sq = (uc: number, w: number, y0: number, y1: number, n: number): void => {
    band(uc - w / 2 - 0.12, uc + w / 2 + 0.12, y0 - 0.12, y1 + 0.12, 0.09, tone(BT_WALL, 1.12)); band(uc - w / 2, uc + w / 2, y0, y1, 0.14, BT_GLASS)
    for (let k = 1; k < n; k++) { const u = uc - w / 2 + (w * k) / n; band(u - 0.03, u + 0.03, y0, y1, 0.16, tone(BT_WALL, 1.1)) }
    band(uc - w / 2, uc + w / 2, (y0 + y1) / 2 - 0.03, (y0 + y1) / 2 + 0.03, 0.16, tone(BT_WALL, 1.1))
  }
  door(L - 6.0, 1.0); sq(L - 3.1, 2.3, 1.5, 3.7, 4)                 // left wing
  door(L - 14.2, 1.0); sq(L - 16.4, 2.0, 1.5, 3.6, 3)               // right wing (u mirrored by L-s)
  // ---- nave front: oculus, twin arched windows on two tiers with sill bands, door, small flank windows
  { const cy = 10.4, r = 0.85, pts: V3[] = []
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push(P(mid + r * Math.cos(a), 0.1, cy + r * Math.sin(a))) }
    poly(pts, tone(BT_WALL, 1.12), hint)
    const q: V3[] = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; q.push(P(mid + r * 0.62 * Math.cos(a), 0.14, cy + r * 0.62 * Math.sin(a))) }
    poly(q, BT_GLASS, hint)
  }
  for (const [y0, h] of [[7.6, 2.3], [4.9, 2.0]] as [number, number][]) {
    arch(mid, y0 - 0.15, nw * 0.5, h + 0.55, tone(BT_WALL, 1.12), 0.08)          // arched surround of the pair
    for (const s of [-1, 1]) arch(mid + s * 0.62, y0, 0.8, h, BT_GLASS, 0.14)
    band(mid - nw * 0.32, mid + nw * 0.32, y0 - 0.32, y0 - 0.12, 0.2, tone(BT_WALL, 1.15))   // sill band
  }
  { const dw = 1.9
    arch(mid, 0, dw + 1.0, 4.9, tone(BT_WALL, 1.1), 0.07)                         // moulded surround
    arch(mid, 0, dw, 4.1, BT_DOOR, 0.15)
    band(mid - 0.03, mid + 0.03, 0, 2.3, 0.18, tone(BT_DOOR, 0.6))
  }
  for (const s of [-1, 1]) { const uc = mid + s * 3.1; arch(uc, 1.6, 0.95, 1.9, tone(BT_WALL, 1.12), 0.07); arch(uc, 1.7, 0.7, 1.7, BT_GLASS, 0.12) }
  // ---- rake and cross on the apex
  { const cu = mid, y = BT_APEX
    band(cu - 0.09, cu + 0.09, y + 0.1, y + 1.3, 0.1, BT_STONE); band(cu - 0.4, cu + 0.4, y + 0.75, y + 0.95, 0.1, BT_STONE)
  }
}

// ───────────── Temple de la Petite Étoile (81 rue Anatole-France, Levallois-Perret; Letrosne 1912; way/64623212) ─────────────
// From Commons photos docs/landmarks/refs/petite-etoile/: cream stucco over brick bands and meulière rubble, a steep slate
// roof sweeping down over the portal side, a pointed window in the nave gable, a pointed brick portal with a scrolled iron
// gate, a cross-gable with an oculus on the left flank, a slate spire at the crossing. Front = the long (ENE) edge on rue Anatole-France.
const PE_RING: P2[] = [[-3516.1, 3600.9], [-3516.3, 3600.7], [-3504.6, 3581.3], [-3491.8, 3589.0], [-3503.5, 3608.4]]
const PE_FA: P2 = [-3503.5, 3608.4], PE_FB: P2 = [-3491.8, 3589.0]      // front, viewer's right to left (outward = ENE onto the street)
const PE_CREAM: Rgb = [0.88, 0.82, 0.66]
const PE_BRICK: Rgb = [0.62, 0.29, 0.19]
const PE_MEUL: Rgb = [0.62, 0.55, 0.40]
const PE_SLATE: Rgb = [0.22, 0.25, 0.31]
const PE_WOOD: Rgb = [0.24, 0.13, 0.09]
const PE_IRON: Rgb = [0.07, 0.07, 0.08]
const PE_GLASS: Rgb = [0.15, 0.19, 0.27]
const PE_EAVE = 4.6                                   // wall top under the sweeping roof
const PE_APEX_U = 6.5, PE_APEX = 13.5                 // nave ridge: u from the viewer's right, height
const PE_PROF: [number, number][] = [[-0.4, 4.7], [PE_APEX_U, PE_APEX], [11.0, 8.2], [15.5, 4.6]]   // roof profile across the front (u, y): steep right, swept left
const PE_FRONT_OH = 0.6       // roof lip beyond the front wall
const PE_TR_V = -5.5, PE_TR_HW = 5.3, PE_TR_Y = 11.6, PE_TR_OH = 0.5   // cross-gable: ridge line v, half width, ridge height
const PE_SPIRE_Y0 = 13.2, PE_BELFRY_TOP = 15.2, PE_SPIRE_TIP = 22.0, PE_SPIRE_R = 1.0
const PE_PORTAL_U = 11.6, PE_PORTAL_W = 2.5, PE_PORTAL_H = 5.0, PE_ARCH_W = 3.6
const PE_WIN_W = 2.3, PE_WIN_Y0 = 5.7, PE_WIN_H = 5.2
const PE_LWIN_U = 16.5, PE_LWIN_W = 3.4
const PE_RAIL_V = 1.0, PE_RAIL_H = 1.1, PE_RAIL_STEP = 0.3

export function templePetiteEtoile(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(PE_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(PE_FB[0] - PE_FA[0], PE_FB[1] - PE_FA[1])
  const fu: P2 = [(PE_FB[0] - PE_FA[0]) / L, (PE_FB[1] - PE_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [PE_FA[0] + fu[0] * u + fn[0] * v, PE_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const W = L
  let D = 0
  for (const [e, n] of PE_RING) D = Math.max(D, -((e - PE_FA[0]) * fn[0] + (n - PE_FA[1]) * fn[1]))
  const hF: V3 = [fn[0], fn[1], 0], hB: V3 = [-fn[0], -fn[1], 0], hL: V3 = [fu[0], fu[1], 0], hR: V3 = [-fu[0], -fu[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hF)
  const side = (v0: number, v1: number, y0: number, y1: number, u: number, col: Rgb): void =>     // on the left flank (u = W), facing +u
    poly([P(u, v0, y0), P(u, v1, y0), P(u, v1, y1), P(u, v0, y1)], col, hL)
  const profY = (u: number): number => {
    for (let i = 0; i < PE_PROF.length - 1; i++) {
      const [a, ya] = PE_PROF[i], [b, yb] = PE_PROF[i + 1]
      if (u <= b) return ya + ((yb - ya) * (u - a)) / (b - a)
    }
    return PE_PROF[PE_PROF.length - 1][1]
  }

  // ---- body: stucco walls to the eaves, then the gable walls under the profile
  pr(PE_RING, 0, PE_EAVE, tone(PE_CREAM, 0.95), PE_SLATE, 0.8, 0.04)
  { const y0 = profY(0) - 0.15
    const wall = (v: number, h: V3): void => poly([P(0, v, PE_EAVE - 0.1), P(0, v, y0), P(PE_APEX_U, v, PE_APEX - 0.15), P(11.0, v, 8.05), P(15.5, v, PE_EAVE), P(15.5, v, PE_EAVE - 0.1)], tone(PE_CREAM, 1.0), h)
    wall(0.03, hF)
    poly([P(0, 0, PE_EAVE - 0.1), P(0, -D, PE_EAVE - 0.1), P(0, -D, y0), P(0, 0, y0)], tone(PE_CREAM, 0.9), hR)    // right wall up to the steep slope's foot
    poly([P(0, -D - 0.03, PE_EAVE - 0.1), P(0, -D - 0.03, y0), P(PE_APEX_U, -D - 0.03, PE_APEX - 0.15), P(11.0, -D - 0.03, 8.05), P(15.5, -D - 0.03, PE_EAVE), P(15.5, -D - 0.03, PE_EAVE - 0.1)], tone(PE_CREAM, 0.95), hB)
  }
  // ---- roofs: the swept nave roof (profile across, ridge along the depth)
  const vF = PE_FRONT_OH, vR = -D - 0.4
  for (let i = 0; i < PE_PROF.length - 1; i++) {
    const [a, ya] = PE_PROF[i], [b, yb] = PE_PROF[i + 1], right = i === 0
    const nx = right ? -(yb - ya) : (ya - yb)       // outward lean of the slope along the profile direction
    poly([P(a, vF, ya), P(b, vF, yb), P(b, vR, yb), P(a, vR, ya)], right ? tone(PE_SLATE, 1.08) : tone(PE_SLATE, 0.9 + 0.06 * i), [fu[0] * (right ? -0.6 : 0.6), fu[1] * (right ? -0.6 : 0.6), 1 + 0 * nx])
  }
  for (let i = 0; i < PE_PROF.length - 1; i++) {                      // barge boards along the front lip
    const [a, ya] = PE_PROF[i], [b, yb] = PE_PROF[i + 1]
    poly([P(a, vF + 0.04, ya), P(b, vF + 0.04, yb), P(b, vF + 0.04, yb - 0.4), P(a, vF + 0.04, ya - 0.4)], PE_WOOD, hF)
  }
  poly([P(15.5, -D, PE_EAVE + 0.1), P(W + 0.3, -D, PE_EAVE - 0.3), P(W + 0.3, -PE_TR_HW * 2 + PE_TR_V + 1.6, PE_EAVE - 0.3), P(15.5, -PE_TR_HW * 2 + PE_TR_V + 1.6, PE_EAVE + 0.1)], tone(PE_SLATE, 0.95), [fu[0] * 0.3, fu[1] * 0.3, 1])
  // ---- the cross-gable on the left flank, ridge along u from the nave to the flank
  { const hw = PE_TR_HW + PE_TR_OH, uE = W + 0.4, y0 = PE_EAVE - 0.2
    poly([P(PE_APEX_U - 0.6, PE_TR_V, PE_TR_Y), P(uE, PE_TR_V, PE_TR_Y), P(uE, PE_TR_V + hw, y0), P(PE_APEX_U - 0.6, PE_TR_V + hw, y0)], tone(PE_SLATE, 1.0), [fn[0] * 0.6, fn[1] * 0.6, 1])
    poly([P(uE, PE_TR_V, PE_TR_Y), P(PE_APEX_U - 0.6, PE_TR_V, PE_TR_Y), P(PE_APEX_U - 0.6, PE_TR_V - hw, y0), P(uE, PE_TR_V - hw, y0)], tone(PE_SLATE, 0.88), [-fn[0] * 0.6, -fn[1] * 0.6, 1])
    poly([P(W + 0.02, PE_TR_V + PE_TR_HW, PE_EAVE - 0.1), P(W + 0.02, PE_TR_V - PE_TR_HW, PE_EAVE - 0.1), P(W + 0.02, PE_TR_V, PE_TR_Y - 0.15)], tone(PE_CREAM, 1.0), hL)
    for (const s of [-1, 1]) poly([P(uE + 0.03, PE_TR_V + s * hw, y0), P(uE + 0.03, PE_TR_V, PE_TR_Y), P(uE + 0.03, PE_TR_V, PE_TR_Y - 0.4), P(uE + 0.03, PE_TR_V + s * hw, y0 - 0.4)], PE_WOOD, hL)
    // oculus with a brick ring and tracery
    const cy = 7.3, ring = (r: number, off: number, col: Rgb): void => {
      const pts: V3[] = []
      for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(W + off, PE_TR_V + r * Math.cos(a), cy + r * Math.sin(a))) }
      poly(pts, col, hL)
    }
    ring(1.4, 0.04, PE_BRICK); ring(1.05, 0.07, tone(PE_CREAM, 1.1)); ring(0.85, 0.1, PE_GLASS)
    for (const a of [0, Math.PI / 2]) poly([P(W + 0.12, PE_TR_V - 0.82 * Math.cos(a) - 0.03 * Math.sin(a), cy - 0.82 * Math.sin(a) + 0.03 * Math.cos(a)), P(W + 0.12, PE_TR_V + 0.82 * Math.cos(a) - 0.03 * Math.sin(a), cy + 0.82 * Math.sin(a) + 0.03 * Math.cos(a)), P(W + 0.12, PE_TR_V + 0.82 * Math.cos(a) + 0.03 * Math.sin(a), cy + 0.82 * Math.sin(a) - 0.03 * Math.cos(a)), P(W + 0.12, PE_TR_V - 0.82 * Math.cos(a) + 0.03 * Math.sin(a), cy - 0.82 * Math.sin(a) - 0.03 * Math.cos(a))], tone(PE_CREAM, 1.1), hL)
  }
  // ---- plinth of rubble and brick bands on the front and the left flank
  band(0, W, 0, 1.0, 0.05, PE_MEUL); band(0, W, 1.0, 2.5, 0.05, PE_BRICK)
  side(0, -D, 0, 1.0, W + 0.03, PE_MEUL); side(0, -D, 1.0, 2.5, W + 0.03, PE_BRICK)
  for (let y = 1.0; y < 2.5; y += 0.3) band(0, W, y, y + 0.03, 0.06, tone(PE_BRICK, 0.8))
  // ---- the nave window, pointed, in a brick surround, with a sill panel and an awning over the grilled windows
  { const c = EN(PE_APEX_U + 0.15, 0)
    ogive(T, c, fu, fn, PE_WIN_Y0 - 0.5, PE_WIN_W + 1.2, PE_WIN_H + 1.1, PE_BRICK, 0.04)
    gothicWindow(T, c, fu, fn, PE_WIN_Y0, PE_WIN_W, PE_WIN_H, 3, tone(PE_CREAM, 1.12), PE_GLASS)
    band(PE_APEX_U + 0.15 - 1.3, PE_APEX_U + 0.15 + 1.3, 4.6, 5.2, 0.08, tone(PE_CREAM, 1.1))
    const au = PE_APEX_U + 0.15
    poly([P(au - 1.7, 1.3, 3.9), P(au + 1.7, 1.3, 3.9), P(au + 1.7, 0.0, 4.5), P(au - 1.7, 0.0, 4.5)], tone(PE_SLATE, 1.1), [fn[0] * 0.5, fn[1] * 0.5, 1])
    for (const s of [-1, 1]) poly([P(au + s * 1.7, 1.3, 3.9), P(au + s * 1.7, 0.0, 4.5), P(au + s * 1.7, 0.0, 3.9)], PE_SLATE, [fu[0] * s, fu[1] * s, 0])
    const wy0 = 1.3, wy1 = 2.8
    band(au - 1.6, au + 1.6, wy0 - 0.15, wy1 + 0.15, 0.08, tone(PE_CREAM, 1.12)); band(au - 1.5, au + 1.5, wy0, wy1, 0.12, PE_GLASS)
    for (let k = 1; k < 6; k++) band(au - 1.5 + (3 * k) / 6 - 0.03, au - 1.5 + (3 * k) / 6 + 0.03, wy0, wy1, 0.15, PE_IRON)
    band(au - 1.5, au + 1.5, (wy0 + wy1) / 2 - 0.03, (wy0 + wy1) / 2 + 0.03, 0.15, PE_IRON)
  }
  // ---- the portal: brick pointed arch, scrolled iron gate
  { const c = EN(PE_PORTAL_U, 0)
    ogive(T, c, fu, fn, 0.4, PE_ARCH_W, PE_PORTAL_H + 0.8, PE_BRICK, 0.1)
    ogive(T, c, fu, fn, 0.5, PE_PORTAL_W, PE_PORTAL_H, PE_GLASS, 0.16)
    for (let k = -4; k <= 4; k++) { const uu = PE_PORTAL_U + (k * PE_PORTAL_W) / 9.5, hh = 3.4 - Math.abs(k) * 0.28; band(uu - 0.025, uu + 0.025, 0.5, 0.5 + hh, 0.2, PE_IRON) }
    band(PE_PORTAL_U - PE_PORTAL_W / 2, PE_PORTAL_U + PE_PORTAL_W / 2, 3.3, 3.38, 0.21, PE_IRON)
    band(PE_PORTAL_U - 0.03, PE_PORTAL_U + 0.03, 0.5, 5.0, 0.21, PE_IRON)
    band(PE_PORTAL_U - PE_ARCH_W / 2 - 0.1, PE_PORTAL_U + PE_ARCH_W / 2 + 0.1, 1.0, 2.5, 0.07, PE_BRICK)    // brick band returns under the arch
  }
  // ---- grilled windows left of the portal, small brick squares in the stucco
  { const wy0 = 1.4, wy1 = 2.9, a = PE_LWIN_U - PE_LWIN_W / 2, b = PE_LWIN_U + PE_LWIN_W / 2
    band(a - 0.15, b + 0.15, wy0 - 0.15, wy1 + 0.15, 0.08, tone(PE_CREAM, 1.12)); band(a, b, wy0, wy1, 0.12, PE_GLASS)
    for (let k = 1; k < 8; k++) band(a + ((b - a) * k) / 8 - 0.025, a + ((b - a) * k) / 8 + 0.025, wy0, wy1, 0.15, PE_IRON)
    band(a, b, (wy0 + wy1) / 2 - 0.03, (wy0 + wy1) / 2 + 0.03, 0.15, PE_IRON)
    for (const [uu, yy] of [[3.6, 8.4], [9.7, 9.9], [19.5, 3.3], [13.9, 6.4]] as [number, number][]) band(uu - 0.3, uu + 0.3, yy - 0.3, yy + 0.3, 0.06, PE_BRICK)
    poly([P(0, 1.1, 3.4), P(2.6, 1.1, 3.4), P(2.6, 0, 4.2), P(0, 0, 4.2)], tone(PE_SLATE, 1.1), [fn[0] * 0.5, fn[1] * 0.5, 1])   // little lean-to hood at the right end
  }
  // ---- iron railing on the pavement edge, brick wall stub at the left
  for (let u = 0.1; u < W; u += PE_RAIL_STEP) band(u - 0.02, u + 0.02, 0.2, PE_RAIL_H, PE_RAIL_V, PE_IRON)
  band(0, W, PE_RAIL_H - 0.1, PE_RAIL_H - 0.04, PE_RAIL_V + 0.01, PE_IRON); band(0, W, 0.25, 0.31, PE_RAIL_V + 0.01, PE_IRON)
  pr([EN(14.0, PE_RAIL_V - 0.15), EN(W, PE_RAIL_V - 0.15), EN(W, PE_RAIL_V + 0.15), EN(14.0, PE_RAIL_V + 0.15)], 0, 0.85, PE_BRICK, tone(PE_BRICK, 1.1))

  // ---- slate spire at the crossing: square belfry with louvres, eight faces to a cross
  { const sc = EN(PE_APEX_U, PE_TR_V)
    pr(rectPoly(sc, PE_SPIRE_R * 1.1, 8), PE_SPIRE_Y0, PE_BELFRY_TOP, tone(PE_SLATE, 1.1), tone(PE_SLATE, 0.9))
    const ring8 = rectPoly(sc, PE_SPIRE_R * 1.05, 8)
    for (let i = 0; i < 8; i++) {
      const p = ring8[i], q = ring8[(i + 1) % 8], mx = (p[0] + q[0]) / 2 - sc[0], my = (p[1] + q[1]) / 2 - sc[1]
      poly([[p[0], p[1], PE_BELFRY_TOP - 0.1], [q[0], q[1], PE_BELFRY_TOP - 0.1], [sc[0], sc[1], PE_SPIRE_TIP]], i % 2 ? tone(PE_SLATE, 0.92) : tone(PE_SLATE, 1.08), [mx, my, 0.15])
    }
    const ring4 = rectPoly(sc, PE_SPIRE_R * 0.7, 4)    // louvres: dark panels on the belfry faces
    for (let i = 0; i < 4; i++) { const p = ring4[i], q = ring4[(i + 1) % 4]; poly([[p[0], p[1], PE_SPIRE_Y0 + 0.9], [q[0], q[1], PE_SPIRE_Y0 + 0.9], [q[0], q[1], PE_BELFRY_TOP - 0.5], [p[0], p[1], PE_BELFRY_TOP - 0.5]], PE_WOOD, [(p[0] + q[0]) / 2 - sc[0], (p[1] + q[1]) / 2 - sc[1], 0]) }
    pr(rectPoly(sc, 0.05, 4), PE_SPIRE_TIP, PE_SPIRE_TIP + 1.1, PE_IRON, PE_IRON)
  }
}

// ───────────── Temple protestant de Boulogne-Billancourt (Église réformée de Boulogne; way/68723367) ─────────────
// 117 rue du Château. From Commons photos docs/landmarks/refs/boulogne/ (2026-11-04): a cream limestone gable with red
// brick pilaster strips at the corners and round the door, a polychrome brick arch over three stepped arched windows, a
// gabled stone hood over the oak door, a brick-arched slit under the apex, two small segmental windows, a stone bellcote
// with a cross; to its west a low ochre stucco pavilion under a slate mansard with a dormer. The front is the 10 m edge on
// the street (outward = NNW). Ring: E/N metres from (-6725, -2045) of the paris-centre grid.
const BO_RING: P2[] = [[-10.7, -12.3], [8.0, -9.0], [7.5, -6.1], [3.9, -7.0], [3.2, -4.2], [2.0, -0.3], [2.2, 0.8], [1.2, 2.8], [2.8, 2.9], [11.7, 5.3], [10.5, 10.2], [0.8, 7.6], [-0.2, 8.3], [-4.3, 7.1], [-8.0, 6.0], [-7.8, 5.2], [-12.6, 3.6], [-13.4, 2.2], [-12.7, -1.8]]
const BO_PAV: P2[] = [[2.2, 0.8], [1.2, 2.8], [0.8, 7.6], [-0.2, 8.3], [-4.3, 7.1], [-8.0, 6.0], [-7.8, 5.2], [-12.6, 3.6], [-13.4, 2.2], [-12.7, -1.8]]
const BO_FA: P2 = [10.5, 10.2], BO_FB: P2 = [0.8, 7.6]       // the gable front, east corner to west corner (outward = NNW onto rue du Château)
const BO_STONE: Rgb = [0.84, 0.77, 0.58]
const BO_BRICK: Rgb = [0.60, 0.29, 0.20]
const BO_OCHRE: Rgb = [0.82, 0.74, 0.52]
const BO_ROUGH: Rgb = [0.38, 0.33, 0.28]
const BO_SLATE: Rgb = [0.28, 0.30, 0.35]
const BO_GLASS: Rgb = [0.13, 0.17, 0.26]
const BO_WOOD: Rgb = [0.34, 0.20, 0.10]
const BO_EAVE = 10.0          // nave eaves = gable shoulders
const BO_RIDGE = 13.2
const BO_NAVE_D = 12.0        // nave length behind the front
const BO_BASE_H = 4.6         // low block under the rest of the ring
const BO_PLINTH = 0.6
const BO_PIL_W = 0.8          // brick pilaster strips
const BO_PIL_OUT = 0.07
const BO_PIL_STEP = 0.9
const BO_DOOR_U = 5.1, BO_DOOR_W = 2.1, BO_DOOR_H = 3.9, BO_ARCH_W = 2.9, BO_ARCH_TOP = 5.1
const BO_HOOD_W = 4.2, BO_HOOD_Y = 5.2, BO_HOOD_PEAK = 6.9
const BO_WIN_DX = 1.3, BO_WIN_W = 0.9, BO_WIN_Y0 = 7.3, BO_WIN_Y1 = 9.5, BO_WIN_SIDE_DROP = 0.6
const BO_BARCH_W = 4.8, BO_BARCH_SPRING = 8.8     // polychrome arch over the windows
const BO_LOW_WIN_DX = 3.8, BO_LOW_WIN_W = 1.0, BO_LOW_WIN_Y0 = 1.6, BO_LOW_WIN_Y1 = 3.6
const BO_SLIT_Y0 = 11.3, BO_SLIT_Y1 = 12.3
const BO_BELL_Y0 = 12.5, BO_BELL_W = 1.7, BO_BELL_H = 2.1, BO_BELL_ROOF = 0.9, BO_BELL_CROSS = 0.9
const BO_MANSARD_Y1 = 6.9, BO_MANSARD_IN = 1.4
const BO_DORMER_U = 0.52   // dormer position along the pavilion front

export function templeBoulogne(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BO_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BO_FB[0] - BO_FA[0], BO_FB[1] - BO_FA[1])
  const fu: P2 = [(BO_FB[0] - BO_FA[0]) / L, (BO_FB[1] - BO_FA[1]) / L], fn: P2 = [fu[1], -fu[0]]   // u runs to the viewer's right; fn is outward
  const EN = (u: number, v: number): P2 => [BO_FA[0] + fu[0] * u + fn[0] * v, BO_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0], W = L, mid = W / 2
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (c: number, w: number, y0: number, spring: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(c - r, v, y0), P(c + r, v, y0), P(c + r, v, spring)]
    for (let i = 1; i < 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(c + Math.cos(a) * r, v, spring + Math.sin(a) * r)) }
    pts.push(P(c - r, v, spring))
    poly(pts, col, hint)
  }
  const win = (c: number, w: number, y0: number, y1: number, v: number): void => {
    const sp = y1 - w / 2
    arch(c, w + 0.34, y0 - 0.12, sp, v, tone(BO_STONE, 1.12))
    arch(c, w, y0, sp, v + 0.03, BO_GLASS)
    band(c - 0.025, c + 0.025, y0, sp + w / 2, v + 0.06, tone(BO_STONE, 1.1))
    band(c - w / 2, c + w / 2, y0 + (sp - y0) * 0.5, y0 + (sp - y0) * 0.5 + 0.04, v + 0.06, tone(BO_STONE, 1.1))
    band(c - w / 2 - 0.25, c + w / 2 + 0.25, y0 - 0.2, y0 - 0.06, v + 0.05, tone(BO_STONE, 1.05))
  }
  const brickRing = (c: number, w: number, spring: number, v: number, th: number): void => {   // a polychrome arch band over a window
    arch(c, w + 2 * th, spring, spring, v, BO_BRICK); arch(c, w, spring, spring, v + 0.02, tone(BO_STONE, 1.04))
  }

  // ---- the rest of the ring: ochre stucco low block, slate flat roof
  pr(BO_RING, 0, BO_BASE_H, BO_OCHRE, BO_SLATE, 0.9, 0.06)
  // ---- the pavilion: slate mansard with a dormer on the street front
  pr(BO_PAV, BO_BASE_H - 0.1, BO_BASE_H + 0.02, tone(BO_OCHRE, 1.1), BO_SLATE)
  { const c: P2 = [0, 0]; for (const p of BO_PAV) { c[0] += p[0] / BO_PAV.length; c[1] += p[1] / BO_PAV.length }
    const inner: P2[] = BO_PAV.map(([e, n]) => { const dx = c[0] - e, dy = c[1] - n, d = Math.hypot(dx, dy); return [e + (dx / d) * BO_MANSARD_IN, n + (dy / d) * BO_MANSARD_IN] })
    for (let i = 0; i < BO_PAV.length; i++) {
      const j = (i + 1) % BO_PAV.length, a = BO_PAV[i], b = BO_PAV[j]
      poly([[a[0], a[1], BO_BASE_H], [b[0], b[1], BO_BASE_H], [inner[j][0], inner[j][1], BO_MANSARD_Y1], [inner[i][0], inner[i][1], BO_MANSARD_Y1]], tone(BO_SLATE, i % 2 ? 0.9 : 1.0), [(a[0] + b[0]) / 2 - c[0], (a[1] + b[1]) / 2 - c[1], 0.8])
    }
    T.cap(inner, BO_MANSARD_Y1, tone(BO_SLATE, 0.85))
    // dormer on the long street edge C→D
    const C = BO_PAV[4], D = BO_PAV[5], dx = D[0] - C[0], dz = D[1] - C[1], dl = Math.hypot(dx, dz), du: P2 = [dx / dl, dz / dl], dn: P2 = [du[1], -du[0]]
    const m: P2 = [C[0] + du[0] * dl * BO_DORMER_U, C[1] + du[1] * dl * BO_DORMER_U]
    const dp = (s: number, t: number, y: number): V3 => [m[0] + du[0] * s + dn[0] * (t - 0.6), m[1] + du[1] * s + dn[1] * (t - 0.6), y]
    pr([[dp(-0.7, 0, 0)[0], dp(-0.7, 0, 0)[1]], [dp(0.7, 0, 0)[0], dp(0.7, 0, 0)[1]], [dp(0.7, 1.4, 0)[0], dp(0.7, 1.4, 0)[1]], [dp(-0.7, 1.4, 0)[0], dp(-0.7, 1.4, 0)[1]]], BO_BASE_H + 0.9, BO_BASE_H + 2.4, tone(BO_STONE, 1.0), BO_SLATE)
    const dh: V3 = [dn[0], dn[1], 0]
    poly([dp(-0.78, 0.05, BO_BASE_H + 2.3), dp(0.78, 0.05, BO_BASE_H + 2.3), dp(0, 0.05, BO_BASE_H + 3.2)], tone(BO_STONE, 1.0), dh)
    poly([dp(-0.8, 0.0, BO_BASE_H + 2.3), dp(0, 0.0, BO_BASE_H + 3.25), dp(0, 1.4, BO_BASE_H + 3.25), dp(-0.8, 1.4, BO_BASE_H + 2.3)], BO_SLATE, [-du[0], -du[1], 1])
    poly([dp(0.8, 1.4, BO_BASE_H + 2.3), dp(0, 1.4, BO_BASE_H + 3.25), dp(0, 0.0, BO_BASE_H + 3.25), dp(0.8, 0.0, BO_BASE_H + 2.3)], tone(BO_SLATE, 0.92), [du[0], du[1], 1])
    poly([dp(-0.4, 0.07, BO_BASE_H + 1.0), dp(0.4, 0.07, BO_BASE_H + 1.0), dp(0.4, 0.07, BO_BASE_H + 2.1), dp(-0.4, 0.07, BO_BASE_H + 2.1)], BO_GLASS, dh)
    // big ground-floor window and quoin strips on the pavilion front
    const wp = (s: number, y: number): V3 => [m[0] + du[0] * s + dn[0] * 0.05, m[1] + du[1] * s + dn[1] * 0.05, y]
    poly([wp(-0.8, 0.9), wp(0.8, 0.9), wp(0.8, 3.4), wp(-0.8, 3.4)], tone(BO_STONE, 1.2), dh)
    poly([wp(-0.65, 1.05), wp(0.65, 1.05), wp(0.65, 3.3), wp(-0.65, 3.3)], BO_GLASS, dh)
    for (const [e, n] of [C, D]) for (let y = 0.4; y < BO_BASE_H - 0.3; y += 0.7) {
      poly([[e + dn[0] * 0.05 - du[0] * 0.35, n + dn[1] * 0.05 - du[1] * 0.35, y], [e + dn[0] * 0.05 + du[0] * 0.35, n + dn[1] * 0.05 + du[1] * 0.35, y], [e + dn[0] * 0.05 + du[0] * 0.35, n + dn[1] * 0.05 + du[1] * 0.35, y + 0.32], [e + dn[0] * 0.05 - du[0] * 0.35, n + dn[1] * 0.05 - du[1] * 0.35, y + 0.32]], BO_BRICK, dh)
    }
  }

  // ---- nave: stone walls, slate gable roof, ridge running away from the street
  pr(rect(0.05, W - 0.05, -BO_NAVE_D, -0.02), 0, BO_EAVE, BO_STONE, null, 1.0, 0.05)
  { const y0 = BO_EAVE - 0.05, y1 = BO_RIDGE, u0 = -0.25, u1 = W + 0.25, vA = 0.25, vB = -BO_NAVE_D
    poly([P(u0, vA, y0), P(mid, vA, y1), P(mid, vB, y1), P(u0, vB, y0)], BO_SLATE, [-fu[0], -fu[1], 1])
    poly([P(u1, vB, y0), P(mid, vB, y1), P(mid, vA, y1), P(u1, vA, y0)], tone(BO_SLATE, 0.92), [fu[0], fu[1], 1])
    poly([P(0.05, 0.0, y0), P(W - 0.05, 0.0, y0), P(mid, 0.0, y1 - 0.05)], BO_STONE, hint)
    poly([P(W - 0.05, vB + 0.02, y0), P(0.05, vB + 0.02, y0), P(mid, vB + 0.02, y1 - 0.05)], tone(BO_STONE, 0.9), [-hint[0], -hint[1], 0])
    for (const s of [0, 1]) {         // brick raking bands
      const ua = s ? W - 0.05 : 0.05, ub = mid
      poly([P(ua, 0.05, y0 - 0.1), P(ub, 0.05, y1 - 0.12), P(ub, 0.05, y1 - 0.55), P(ua, 0.05, y0 - 0.55)], BO_BRICK, hint)
      poly([P(ua, 0.12, y0 + 0.02), P(ub, 0.12, y1), P(ub, 0.12, y1 + 0.12), P(ua, 0.12, y0 + 0.14)], tone(BO_STONE, 1.18), hint)
    }
  }
  band(0, W, 0, BO_PLINTH, 0.04, BO_ROUGH)
  // brick pilaster strips at the corners and round the door
  for (const [u0, u1] of [[0.0, BO_PIL_W], [W - BO_PIL_W, W], [BO_DOOR_U - BO_DOOR_W / 2 - 0.55, BO_DOOR_U - BO_DOOR_W / 2 - 0.12], [BO_DOOR_U + BO_DOOR_W / 2 + 0.12, BO_DOOR_U + BO_DOOR_W / 2 + 0.55]]) {
    const top = u0 < 1 || u1 > W - 1 ? BO_EAVE - 0.4 : BO_DOOR_H + 0.4
    for (let y = BO_PLINTH, k = 0; y < top; y += BO_PIL_STEP, k++) {
      const grow = k % 2 ? 0.0 : 0.25
      band(u0 - (u0 < 1 ? 0 : 0.0), u1 + (u1 > W - 1 ? 0 : grow), y, y + 0.36, 0.04 + BO_PIL_OUT, BO_BRICK)
    }
  }
  // door: oak leaves in a brick arch under a gabled stone hood
  const dsp = BO_DOOR_H
  arch(BO_DOOR_U, BO_ARCH_W, BO_DOOR_H - 0.2, BO_ARCH_TOP - BO_ARCH_W / 2, 0.06, BO_BRICK)
  arch(BO_DOOR_U, BO_ARCH_W - 0.7, BO_DOOR_H - 0.2, BO_ARCH_TOP - BO_ARCH_W / 2, 0.08, tone(BO_STONE, 1.14))
  band(BO_DOOR_U - BO_DOOR_W / 2, BO_DOOR_U + BO_DOOR_W / 2, 0.15, dsp, 0.1, BO_WOOD)
  band(BO_DOOR_U - 0.03, BO_DOOR_U + 0.03, 0.15, dsp, 0.12, tone(BO_WOOD, 0.6))
  for (const s of [-1, 1]) band(BO_DOOR_U + s * BO_DOOR_W * 0.25 - 0.3, BO_DOOR_U + s * BO_DOOR_W * 0.25 + 0.3, 0.5, dsp - 0.5, 0.12, tone(BO_WOOD, 1.18))
  { const hw = BO_HOOD_W / 2, c = BO_DOOR_U
    poly([P(c - hw, 0.1, BO_HOOD_Y), P(c + hw, 0.1, BO_HOOD_Y), P(c, 0.1, BO_HOOD_PEAK)], tone(BO_STONE, 1.05), hint)
    for (const s of [-1, 1]) poly([P(c + s * (hw + 0.1), 0.1, BO_HOOD_Y - 0.12), P(c, 0.1, BO_HOOD_PEAK), P(c, 0.1, BO_HOOD_PEAK + 0.26), P(c + s * (hw + 0.1), 0.1, BO_HOOD_Y + 0.16)], tone(BO_STONE, 1.22), hint)
    for (const s of [-1, 1]) { band(c + s * (hw - 0.2) - 0.18, c + s * (hw - 0.2) + 0.18, BO_HOOD_Y - 0.7, BO_HOOD_Y - 0.1, 0.12, tone(BO_STONE, 1.0)) }
    band(c - 0.07, c + 0.07, BO_HOOD_PEAK + 0.2, BO_HOOD_PEAK + 0.9, 0.12, tone(BO_STONE, 1.15)); band(c - 0.26, c + 0.26, BO_HOOD_PEAK + 0.5, BO_HOOD_PEAK + 0.68, 0.12, tone(BO_STONE, 1.15))
  }
  band(BO_DOOR_U - 0.8, BO_DOOR_U + 0.8, 0, 0.45, 0.5, tone(BO_STONE, 0.9))    // steps
  // three stepped arched windows under a polychrome brick arch
  brickRing(BO_DOOR_U, BO_BARCH_W - 0.9, BO_BARCH_SPRING, 0.07, 0.45)
  win(BO_DOOR_U, BO_WIN_W, BO_WIN_Y0, BO_WIN_Y1, 0.12)
  for (const s of [-1, 1]) win(BO_DOOR_U + s * BO_WIN_DX, BO_WIN_W, BO_WIN_Y0 - BO_WIN_SIDE_DROP, BO_WIN_Y1 - BO_WIN_SIDE_DROP, 0.12)
  arch(BO_DOOR_U, 0.55, BO_SLIT_Y0, BO_SLIT_Y1 - 0.28, 0.1, BO_BRICK); arch(BO_DOOR_U, 0.32, BO_SLIT_Y0, BO_SLIT_Y1 - 0.28, 0.12, BO_GLASS)
  // two small low windows with segmental brick heads
  for (const s of [-1, 1]) {
    const c = BO_DOOR_U + s * BO_LOW_WIN_DX
    band(c - BO_LOW_WIN_W / 2 - 0.12, c + BO_LOW_WIN_W / 2 + 0.12, BO_LOW_WIN_Y0 - 0.12, BO_LOW_WIN_Y1 + 0.05, 0.08, tone(BO_STONE, 1.15))
    band(c - BO_LOW_WIN_W / 2, c + BO_LOW_WIN_W / 2, BO_LOW_WIN_Y0, BO_LOW_WIN_Y1, 0.11, BO_GLASS)
    band(c - BO_LOW_WIN_W / 2 - 0.2, c + BO_LOW_WIN_W / 2 + 0.2, BO_LOW_WIN_Y1 + 0.05, BO_LOW_WIN_Y1 + 0.45, 0.08, BO_BRICK)
  }
  // flank windows along the nave sides
  for (let v = 3.0; v < BO_NAVE_D - 1; v += 3.2) for (const u of [0.0, W]) {
    const a = P(u, -v, 3.0), b = P(u, -v - 1.0, 3.0), s = u ? 1 : -1
    const o: V3 = [fu[0] * s, fu[1] * s, 0], n = (p: V3, y: number): V3 => [p[0] + o[0] * 0.05, p[1] + o[1] * 0.05, y]
    poly([n(a, 2.2), n(b, 2.2), n(b, 5.2), n(a, 5.2)], BO_GLASS, o)
  }
  // bellcote on the ridge: stone box with an arched louvre, little pyramid roof, cross
  { const c = mid, v0 = -0.45, v1 = 0.55
    pr(rect(c - BO_BELL_W / 2, c + BO_BELL_W / 2, v0, v1), BO_BELL_Y0 - 0.4, BO_BELL_Y0 + BO_BELL_H, tone(BO_STONE, 1.05), null)
    pr(rect(c - BO_BELL_W / 2 - 0.12, c + BO_BELL_W / 2 + 0.12, v0 - 0.1, v1 + 0.1), BO_BELL_Y0 + BO_BELL_H, BO_BELL_Y0 + BO_BELL_H + 0.2, tone(BO_STONE, 1.2), tone(BO_STONE, 0.9))
    arch(c, 0.75, BO_BELL_Y0 + 0.2, BO_BELL_Y0 + BO_BELL_H - 0.8, v1 + 0.02, BO_GLASS)
    const yt = BO_BELL_Y0 + BO_BELL_H + 0.2, hw = BO_BELL_W / 2 + 0.12, apex = P(c, (v0 + v1) / 2, yt + BO_BELL_ROOF)
    const cs: V3[] = [P(c - hw, v1 + 0.1, yt), P(c + hw, v1 + 0.1, yt), P(c + hw, v0 - 0.1, yt), P(c - hw, v0 - 0.1, yt)]
    for (let i = 0; i < 4; i++) { const p = cs[i], q = cs[(i + 1) % 4]; poly([p, q, apex], tone(BO_STONE, i % 2 ? 0.95 : 1.08), [(p[0] + q[0]) / 2 - apex[0], (p[1] + q[1]) / 2 - apex[1], 0.4]) }
    pr(rect(c - 0.05, c + 0.05, -0.05, 0.05), yt + BO_BELL_ROOF - 0.05, yt + BO_BELL_ROOF + BO_BELL_CROSS, tone(BO_STONE, 1.1), tone(BO_STONE, 1.0))
    pr(rect(c - 0.3, c + 0.3, -0.04, 0.04), yt + BO_BELL_ROOF + 0.4, yt + BO_BELL_ROOF + 0.55, tone(BO_STONE, 1.1), tone(BO_STONE, 1.0))
  }
}

// ───────────── Temple protestant de La Rencontre (Église protestante unie; way/63203792) ─────────────
// Rue des Petits-Hôtels, Paris 10e. A 1960s street front read off Commons photos docs/landmarks/refs/rencontre/ (ref1-3,
// 2026-11-04): travertine spandrels, a row of deep rough-cast concrete fins hung over the upper storeys (longest at the
// left, shortening to the right), black marble pilasters on the ground floor with a barred gate at the left, a glazed door
// and a shuttered window at the right. The front is the 12 m north edge (outward ≈ N). Ring: E/N metres from (1559, 1870)
// of the paris-centre grid (x=(lon-2.332)*73228, z=(lat-48.8605)*111320).
const RE_RING: P2[] = [[2.2, 13.3], [8.8, 12.0], [8.0, 7.6], [7.6, 5.9], [3.6, -13.1], [3.4, -14.3], [-8.4, -11.9], [-2.9, 14.2]]
const RE_FA: P2 = [8.8, 12.0], RE_FB: P2 = [-2.9, 14.2]       // front, east corner to west corner (u to the viewer's right)
const RE_TRAV: Rgb = [0.80, 0.74, 0.64]
const RE_CONC: Rgb = [0.50, 0.50, 0.48]
const RE_MARBLE: Rgb = [0.15, 0.16, 0.19]
const RE_GLASS: Rgb = [0.14, 0.18, 0.25]
const RE_SIDE: Rgb = [0.66, 0.62, 0.55]
const RE_ROOF: Rgb = [0.40, 0.41, 0.43]
const RE_BAR: Rgb = [0.72, 0.72, 0.70]
const RE_H = 17.2             // parapet height
const RE_GROUND_H = 4.2       // top of the ground floor / travertine band
const RE_FLOORS = [4.2, 7.4, 10.6, 13.8]   // storey bases above the ground floor; each storey is a spandrel + a glazed band
const RE_SPANDREL = 1.0, RE_GLAZE = 1.7
const RE_FINS = 13            // fins across the front
const RE_FIN_W = 0.46         // fin width
const RE_FIN_D0 = 0.95, RE_FIN_D1 = 0.28   // projection at the left end, at the right end
const RE_GATE_U0 = 0.5, RE_GATE_U1 = 5.3, RE_DOOR_U0 = 6.0, RE_DOOR_U1 = 7.7, RE_SHUT_U0 = 8.2, RE_SHUT_U1 = 10.2
const RE_PIL_W = 0.7

export function templeRencontre(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RE_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(RE_FB[0] - RE_FA[0], RE_FB[1] - RE_FA[1])
  const fu: P2 = [(RE_FB[0] - RE_FA[0]) / L, (RE_FB[1] - RE_FA[1]) / L], fn: P2 = [fu[1], -fu[0]]
  const EN = (u: number, v: number): P2 => [RE_FA[0] + fu[0] * u + fn[0] * v, RE_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)

  pr(RE_RING, 0, RE_H, RE_SIDE, RE_ROOF, 3, 0.04)                              // the block
  band(0, L, 0, RE_H, 0.02, RE_TRAV)                                           // travertine front skin
  band(0, L, RE_H - 0.5, RE_H, 0.08, tone(RE_TRAV, 1.08))                      // parapet band
  pr(rect(0, L, 0, 0.1), RE_H, RE_H + 0.25, tone(RE_TRAV, 0.95), tone(RE_TRAV, 0.95))   // coping
  // ground floor: black marble, barred gate, glazed door, shuttered window
  band(0, L, 0, RE_GROUND_H - 0.5, 0.05, RE_MARBLE)
  band(0, L, RE_GROUND_H - 0.6, RE_GROUND_H, 0.12, tone(RE_TRAV, 1.0))          // travertine lintel band
  band(RE_GATE_U0, RE_GATE_U1, 0.1, RE_GROUND_H - 0.7, 0.1, [0.05, 0.05, 0.06])  // dark passage behind the gate
  for (let u = RE_GATE_U0 + 0.15; u < RE_GATE_U1; u += 0.24) band(u - 0.025, u + 0.025, 0.1, RE_GROUND_H - 0.7, 0.16, RE_BAR)
  band(RE_GATE_U0, RE_GATE_U1, 1.3, 1.4, 0.17, RE_BAR); band(RE_GATE_U0, RE_GATE_U1, 3.1, 3.2, 0.17, RE_BAR)
  band(RE_DOOR_U0, RE_DOOR_U1, 0.12, RE_GROUND_H - 0.9, 0.1, RE_GLASS)
  band(RE_DOOR_U0 + (RE_DOOR_U1 - RE_DOOR_U0) / 2 - 0.03, RE_DOOR_U0 + (RE_DOOR_U1 - RE_DOOR_U0) / 2 + 0.03, 0.12, RE_GROUND_H - 0.9, 0.12, RE_BAR)
  band(RE_SHUT_U0, RE_SHUT_U1, 1.2, 3.0, 0.1, tone(RE_TRAV, 0.9))               // roller shutter
  for (const u of [0, RE_GATE_U1 + 0.1, RE_DOOR_U1 + 0.1, L - RE_PIL_W]) pr(rect(u, u + RE_PIL_W, 0, 0.18), 0, RE_GROUND_H - 0.6, tone(RE_MARBLE, 1.25), tone(RE_MARBLE, 1.1))
  // upper storeys: a glazed ribbon over each travertine spandrel
  for (const y0 of RE_FLOORS) band(0.1, L - 0.1, y0 + RE_SPANDREL, y0 + RE_SPANDREL + RE_GLAZE, 0.1, RE_GLASS)
  // the fins: a sawtooth of deep concrete blades from the first floor to the parapet, shortening left to right
  const pitch = L / RE_FINS
  for (let i = 0; i < RE_FINS; i++) {
    const c = (i + 0.5) * pitch, d = RE_FIN_D0 + (RE_FIN_D1 - RE_FIN_D0) * (i / (RE_FINS - 1))
    pr(rect(c - RE_FIN_W / 2, c + RE_FIN_W / 2, 0.1, 0.1 + d), RE_GROUND_H, RE_H - 0.5, tone(RE_CONC, 0.94 + (i % 3) * 0.05), tone(RE_CONC, 1.15), 3, 0.05)
  }
  // flank windows: dark ribbons on the east and west walls
  for (let i = 0; i < 4; i++) for (const y0 of RE_FLOORS) {
    const v = 3 + i * 5.5
    for (const s of [0, 1]) {
      const a = EN(s ? L : 0, -v), b = EN(s ? L : 0, -v - 2.2), o: V3 = [fu[0] * (s ? 1 : -1), fu[1] * (s ? 1 : -1), 0]
      const n = (p: P2, y: number): V3 => [p[0] + o[0] * 0.04, p[1] + o[1] * 0.04, y]
      poly([n(a, y0 + 1.2), n(b, y0 + 1.2), n(b, y0 + 2.6), n(a, y0 + 2.6)], RE_GLASS, o)
    }
  }
}

// ───────────────────────────── Église suédoise / Svenska kyrkan (way/137884622) ─────────────────────────────
// 9 rue Médéric, Paris 17e (Ivar Tengbom, 1911-13). Read off the Commons set "Paris - Svenska kyrkan 01-06"
// (docs/landmarks/refs/swedish/r01.jpg r02.jpg, 2026-11-04): red-brick walls, a tall steep brick gable with a stone-edged
// raking coping and a tall round-arched window facing the street, a terracotta-tiled nave roof, and a slender square
// brick tower with a stone string course, a green-copper cap and a needle spire beside the nave.
// Plan frame (t, b): origin at the middle of the street gable, +t to the viewer's right, +b from the street back along the
// nave; the ring is a nave of ~10.7 x 24.8 m with a 3.8 m strip on its south-west flank (tower at the front, a low annex behind).
const SW_RING: P2[] = [[-1.3, 1.9], [-8.4, 11.6], [-3.3, 15.3], [3.1, 20.1], [8.3, 13.6], [10.2, 11.2], [11.0, 10.1], [12.6, 8.2], [18.5, 0.6], [9.4, -6.1], [7.4, -3.5], [1.8, 3.9], [-1.1, 1.7]]
const SW_M: P2 = [13.95, -2.75]                 // middle of the gable edge on the street
const SW_N: P2 = [0.593, -0.805]                // its outward normal (towards rue Médéric)
const SW_BRICK: Rgb = [0.56, 0.27, 0.19]
const SW_TILE: Rgb = [0.68, 0.31, 0.18]
const SW_STONE: Rgb = [0.80, 0.72, 0.54]
const SW_GRANITE: Rgb = [0.55, 0.50, 0.46]
const SW_COPPER: Rgb = [0.40, 0.52, 0.46]
const SW_GLASS: Rgb = [0.18, 0.21, 0.28]
const SW_GOLD: Rgb = [0.85, 0.68, 0.22]
const SW_T0 = -5.6, SW_T1 = 5.1                 // nave walls, across
const SW_B1 = 24.7                              // nave length
const SW_EAVE = 11.0                            // nave wall top
const SW_RIDGE = 21.0                           // roof ridge (steep: ~62 degrees)
const SW_COPING = 0.45                          // stone rake coping, vertical depth
const SW_FRONT_WIN_W = 1.9, SW_FRONT_WIN_Y0 = 8.0, SW_FRONT_WIN_H = 6.4
const SW_BAYS = 5, SW_BAY0 = 3.0, SW_BAY_PITCH = 4.2   // flank windows: first centre and spacing along b
const SW_WIN_W = 1.5, SW_WIN_Y0 = 4.6, SW_WIN_H = 5.2
const SW_TOWER_B0 = 12.7, SW_TOWER_B1 = 16.5    // tower along the nave
const SW_TOWER_T0 = -9.4                        // and out to the flank (its east face is the nave wall)
const SW_TOWER_SHAFT = 25.0                     // top of the shaft
const SW_TOWER_BELFRY = 27.0                    // top of the belfry stage
const SW_TOWER_CAP = 29.5                       // copper cap top
const SW_TOWER_TIP = 38.0                       // spire tip
const SW_ANNEX_H = 6.5                          // the low annex behind the tower
const SW_PLINTH = 1.1                           // granite base

export function egliseSuedoise(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SW_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const bu: P2 = [-SW_N[0], -SW_N[1]], tu: P2 = [-bu[1], bu[0]]       // along the nave; to the viewer's right at the front
  const tv: P2 = [-SW_N[1], SW_N[0]]
  void tu
  const EN = (t: number, b: number): P2 => [SW_M[0] + tv[0] * t + bu[0] * b, SW_M[1] + tv[1] * t + bu[1] * b]
  const P = (t: number, b: number, y: number): V3 => { const p = EN(t, b); return [p[0], p[1], y] }
  const rect = (t0: number, t1: number, b0: number, b1: number): P2[] => [EN(t0, b0), EN(t1, b0), EN(t1, b1), EN(t0, b1)]
  const nf: V3 = [SW_N[0], SW_N[1], 0], nb: V3 = [bu[0], bu[1], 0], nr: V3 = [tv[0], tv[1], 0], nl: V3 = [-tv[0], -tv[1], 0]
  const tc = (SW_T0 + SW_T1) / 2
  const OFF = 0.04
  // a round-headed window or panel standing on a wall: map(u, y) puts a point on the wall, uc the centre
  const roundWin = (map: (u: number, y: number) => V3, hint: V3, uc: number, y0: number, w: number, h: number, col: Rgb): void => {
    const r = w / 2, ys = y0 + h - r
    const pts: V3[] = [map(uc - r, y0), map(uc + r, y0), map(uc + r, ys)]
    for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push(map(uc + r * Math.cos(a), ys + r * Math.sin(a))) }
    pts.push(map(uc - r, ys))
    poly(pts, col, hint)
  }
  const win = (map: (u: number, y: number) => V3, hint: V3, uc: number, y0: number, w: number, h: number): void => {
    roundWin((u, y) => { const p = map(u, y); return [p[0] + hint[0] * 0.02, p[1] + hint[1] * 0.02, p[2]] }, hint, uc, y0 - 0.2, w + 0.5, h + 0.3, SW_STONE)
    roundWin((u, y) => { const p = map(u, y); return [p[0] + hint[0] * 0.06, p[1] + hint[1] * 0.06, p[2]] }, hint, uc, y0, w, h, SW_GLASS)
  }

  // ---- the nave, the tower and the low annex
  pr(rect(SW_T0, SW_T1, 0, SW_B1), 0, SW_EAVE, SW_BRICK, null, 3, 0.05)
  pr(rect(SW_TOWER_T0, SW_T0, SW_TOWER_B0, SW_TOWER_B1), 0, SW_TOWER_SHAFT, SW_BRICK, SW_STONE, 3, 0.05)
  pr(rect(SW_TOWER_T0, SW_T0, SW_TOWER_B1, SW_B1), 0, SW_ANNEX_H, SW_BRICK, SW_TILE, 3, 0.05)
  // ---- the roof: two steep terracotta slopes, brick gables at both ends, stone raking copings at the street end
  const slope = (t0: number, hint: V3): void => poly([P(t0, 0, SW_EAVE), P(t0, SW_B1, SW_EAVE), P(tc, SW_B1, SW_RIDGE), P(tc, 0, SW_RIDGE)], SW_TILE, hint)
  slope(SW_T0, [nl[0] * 0.6, nl[1] * 0.6, 0.8]); slope(SW_T1, [nr[0] * 0.6, nr[1] * 0.6, 0.8])
  poly([P(SW_T0, 0, SW_EAVE), P(SW_T1, 0, SW_EAVE), P(tc, 0, SW_RIDGE)], SW_BRICK, nf)
  poly([P(SW_T0, SW_B1, SW_EAVE), P(SW_T1, SW_B1, SW_EAVE), P(tc, SW_B1, SW_RIDGE)], SW_BRICK, nb)
  for (const t0 of [SW_T0, SW_T1]) {
    poly([P(t0, -OFF, SW_EAVE), P(tc, -OFF, SW_RIDGE), P(tc, -OFF, SW_RIDGE - SW_COPING), P(t0, -OFF, SW_EAVE - SW_COPING)], SW_STONE, nf)
    poly([P(t0, SW_B1 + OFF, SW_EAVE), P(tc, SW_B1 + OFF, SW_RIDGE), P(tc, SW_B1 + OFF, SW_RIDGE - SW_COPING), P(t0, SW_B1 + OFF, SW_EAVE - SW_COPING)], SW_STONE, nb)
  }
  pr(rect(tc - 0.12, tc + 0.12, 0.05, 0.3), SW_RIDGE, SW_RIDGE + 1.7, SW_GOLD, SW_GOLD)   // the gilt finial on the gable
  // ---- the street gable: granite base, one tall round-headed window, a stone string course under the eaves
  poly([P(SW_T0, -OFF, 0), P(SW_T1, -OFF, 0), P(SW_T1, -OFF, SW_PLINTH), P(SW_T0, -OFF, SW_PLINTH)], SW_GRANITE, nf)
  poly([P(SW_T0, -OFF, SW_EAVE - 0.5), P(SW_T1, -OFF, SW_EAVE - 0.5), P(SW_T1, -OFF, SW_EAVE - 0.2), P(SW_T0, -OFF, SW_EAVE - 0.2)], SW_STONE, nf)
  win((u, y) => P(u, -OFF, y), nf, tc, SW_FRONT_WIN_Y0, SW_FRONT_WIN_W, SW_FRONT_WIN_H)
  // ---- the flanks: a rank of round-headed windows (the south-west flank only where the tower and annex do not cover it)
  for (let i = 0; i < SW_BAYS; i++) {
    const b = SW_BAY0 + i * SW_BAY_PITCH
    win((u, y) => P(SW_T1 + OFF, u, y), nr, b, SW_WIN_Y0, SW_WIN_W, SW_WIN_H)
    if (b + SW_WIN_W < SW_TOWER_B0 - 0.4) win((u, y) => P(SW_T0 - OFF, u, y), nl, b, SW_WIN_Y0, SW_WIN_W, SW_WIN_H)
  }
  // ---- the tower: slit windows, a stone string course, a belfry stage, a flared copper cap and a needle spire
  const tt0 = SW_TOWER_T0, tt1 = SW_T0, tb0 = SW_TOWER_B0, tb1 = SW_TOWER_B1
  const faces: Array<{ a: [number, number]; c: [number, number]; h: V3 }> = [
    { a: [tt0, tb0], c: [tt1, tb0], h: nf }, { a: [tt0, tb1], c: [tt1, tb1], h: nb }, { a: [tt0, tb0], c: [tt0, tb1], h: nl },
  ]
  for (const f of faces) {
    const mid = (p: [number, number], q: [number, number], s: number): P2 => EN(p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s)
    const o = (p: P2, y: number): V3 => [p[0] + f.h[0] * OFF, p[1] + f.h[1] * OFF, y]
    const cx = mid(f.a, f.c, 0.5), ux: P2 = [(EN(f.c[0], f.c[1])[0] - EN(f.a[0], f.a[1])[0]) / 3.8, (EN(f.c[0], f.c[1])[1] - EN(f.a[0], f.a[1])[1]) / 3.8]
    const at = (du: number, y: number): V3 => o([cx[0] + ux[0] * du, cx[1] + ux[1] * du], y)
    for (const [y0, y1] of [[8, 11.5], [15, 18.5], [20, 23]]) poly([at(-0.1, y0), at(0.1, y0), at(0.1, y1), at(-0.1, y1)], SW_GLASS, f.h)
    poly([at(-1.9, SW_TOWER_SHAFT - 0.7), at(1.9, SW_TOWER_SHAFT - 0.7), at(1.9, SW_TOWER_SHAFT), at(-1.9, SW_TOWER_SHAFT)], SW_STONE, f.h)   // string course
    for (const du of [-0.9, 0, 0.9]) poly([at(du - 0.25, 25.6), at(du + 0.25, 25.6), at(du + 0.25, 26.6), at(du - 0.25, 26.6)], [0.28, 0.42, 0.36], f.h)   // belfry louvres
  }
  pr(rect(tt0, tt1, tb0, tb1), SW_TOWER_SHAFT, SW_TOWER_BELFRY, tone(SW_BRICK, 1.05), SW_STONE, 3, 0.05)
  const cx = (tt0 + tt1) / 2, cb = (tb0 + tb1) / 2, hw = (tt1 - tt0) / 2
  const sq = (r: number, y: number): V3[] => [P(cx - r, cb - r, y), P(cx + r, cb - r, y), P(cx + r, cb + r, y), P(cx - r, cb + r, y)]
  const frustum = (r0: number, y0: number, r1: number, y1: number, col: Rgb): void => {
    const A = sq(r0, y0), B = sq(r1, y1)
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4, m = [(A[k][0] + A[k2][0]) / 2 - (P(cx, cb, 0)[0]), (A[k][1] + A[k2][1]) / 2 - (P(cx, cb, 0)[1])]
      poly([A[k], A[k2], B[k2], B[k]], col, [m[0], m[1], 0.3])
    }
  }
  frustum(hw, SW_TOWER_BELFRY, hw * 0.55, SW_TOWER_CAP, SW_COPPER)
  const tip = P(cx, cb, SW_TOWER_TIP), base = sq(hw * 0.55 * 0.5, SW_TOWER_CAP)
  frustum(hw * 0.55, SW_TOWER_CAP, hw * 0.28, SW_TOWER_CAP + 0.4, tone(SW_COPPER, 0.8))
  const sb = sq(hw * 0.28, SW_TOWER_CAP + 0.4)
  void base
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4, m = [(sb[k][0] + sb[k2][0]) / 2 - P(cx, cb, 0)[0], (sb[k][1] + sb[k2][1]) / 2 - P(cx, cb, 0)[1]]
    poly([sb[k], sb[k2], tip], tone(SW_COPPER, 0.9), [m[0], m[1], 0.5])
  }
}

// ───────────────────────────── Église luthérienne de l'Ascension (way/84320043) ─────────────────────────────
// 47 rue Dulong, Paris 17e. Read off two Commons photographs (docs/landmarks/refs/ascension/ref1.jpg, ref2.jpg, P1160919/20
// rwk, 2026-11-04): a cream-stucco Gothic-revival street front, two storeys, an ochre plinth; a central steep gable
// (ogival portal under a mosaic arch, a pointed window with a quatrefoil panel, flanking pinnacles, a small open bellcote
// and cross on the apex); a left wing with a pointed upper window over paired lancets and a balustrade, a lower right
// wing the same. Ring in world metres (x east, z north), as OSM; the model stays inside it (the front edge is drawn
// AS_IN metres inside the OSM edge so the relief of the front does not cross the ring).
const AS_RING: P2[] = [[-1191.68, 2799.68], [-1198.0, 2793.85], [-1200.53, 2791.55], [-1203.03, 2789.26], [-1194.54, 2779.66], [-1195.45, 2779.49], [-1202.69, 2772.98], [-1201.36, 2771.39], [-1199.74, 2772.68], [-1198.09, 2770.75], [-1180.82, 2786.06], [-1184.07, 2790.14]]
const AS_FRONT_B: P2 = [-1180.82, 2786.06], AS_FRONT_A: P2 = [-1191.68, 2799.68]   // the street edge, viewer's left end and right end
const AS_IN = 0.18             // the drawn front edge sits this far inside the OSM edge
const AS_STUCCO: Rgb = [0.87, 0.77, 0.58]
const AS_PLINTH: Rgb = [0.62, 0.47, 0.20]
const AS_STONE: Rgb = [0.90, 0.83, 0.67]
const AS_SLATE: Rgb = [0.42, 0.46, 0.52]
const AS_GLASS: Rgb = [0.16, 0.19, 0.26]
const AS_WOOD: Rgb = [0.34, 0.17, 0.08]
const AS_IRON: Rgb = [0.08, 0.08, 0.09]
const AS_GOLD: Rgb = [0.78, 0.60, 0.20]
const AS_WING_H = 9.4          // wing eaves (top of the cornice)
const AS_RAIL_H = 1.0          // balustrade above it
const AS_PLINTH_H = 1.0
const AS_GABLE_S0 = 6.3, AS_GABLE_S1 = 11.7   // central gable across the front (s from the viewer's left)
const AS_PEAK = 14.2           // gable apex
const AS_CORNICE_H = 0.5
const AS_PINN_TOP = 12.4       // flank pinnacles
const AS_BELL_H = 4.0          // bellcote above the apex
const AS_CROSS_H = 1.8
const AS_NAVE_D = 14.0         // nave roof depth behind the front
const AS_PORTAL_W = 2.1, AS_PORTAL_H = 3.9
const AS_UP_WIN_W = 1.5, AS_UP_WIN_Y0 = 5.6, AS_UP_WIN_H = 3.4
const AS_GABLE_WIN_W = 1.5, AS_GABLE_WIN_Y0 = 6.6, AS_GABLE_WIN_H = 4.4
const AS_LANCET_W = 0.8, AS_LANCET_Y0 = 1.9, AS_LANCET_H = 2.4
const AS_POST_PITCH = 0.45

export function egliseAscension(out: MeshBuilder, fit: Fit): void {
  const ring = AS_RING.slice()
  const L = Math.hypot(AS_FRONT_A[0] - AS_FRONT_B[0], AS_FRONT_A[1] - AS_FRONT_B[1])
  const fu: P2 = [(AS_FRONT_A[0] - AS_FRONT_B[0]) / L, (AS_FRONT_A[1] - AS_FRONT_B[1]) / L], fn: P2 = [fu[1], -fu[0]]
  // pull the street edge's three vertices inside
  for (const i of [0, 10, 11]) ring[i] = [ring[i][0] - fn[0] * AS_IN, ring[i][1] - fn[1] * AS_IN]
  const F = registerRing(ring, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const EN = (s: number, v: number): P2 => [AS_FRONT_B[0] + fu[0] * s + fn[0] * (v - AS_IN), AS_FRONT_B[1] + fu[1] * s + fn[1] * (v - AS_IN)]
  const P = (s: number, v: number, y: number): V3 => { const p = EN(s, v); return [p[0], p[1], y] }
  const rect = (s0: number, s1: number, v0: number, v1: number): P2[] => [EN(s0, v0), EN(s1, v0), EN(s1, v1), EN(s0, v1)]
  const nf: V3 = [fn[0], fn[1], 0], nl: V3 = [-fu[0], -fu[1], 0], nr: V3 = [fu[0], fu[1], 0]
  const sc = (AS_GABLE_S0 + AS_GABLE_S1) / 2
  const band = (s0: number, s1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(s0, v, y0), P(s1, v, y0), P(s1, v, y1), P(s0, v, y1)], col, nf)
  // an ogive (pointed arch) on the front at along-position s
  const og = (s: number, y0: number, w: number, h: number, col: Rgb, v: number): void => ogive(T, EN(s, 0), fu, fn, y0, w, h, col, v)
  const lancet = (s: number, y0: number, w: number, h: number): void => { og(s, y0 - 0.15, w + 0.45, h + 0.3, AS_STONE, 0.04); og(s, y0, w, h, AS_GLASS, 0.08) }

  // ---- the body: the whole ring to the wing eaves, then the plinth, cornice and balustrade on the street
  pr(ring, 0, AS_WING_H, AS_STUCCO, AS_STUCCO, 3, 0.03)
  band(0, L, 0, AS_PLINTH_H, 0.03, AS_PLINTH)
  band(0, L, AS_WING_H - AS_CORNICE_H, AS_WING_H, 0.1, AS_STONE)
  band(0, L, 4.55, 4.85, 0.06, AS_STONE)                      // first-floor string course
  for (const [a, b] of [[0, AS_GABLE_S0], [AS_GABLE_S1, L]]) {
    band(a, b, AS_WING_H, AS_WING_H + 0.12, 0.08, AS_STONE)
    band(a, b, AS_WING_H + AS_RAIL_H - 0.12, AS_WING_H + AS_RAIL_H, 0.08, AS_STONE)
    for (let s = a + 0.2; s < b - 0.1; s += AS_POST_PITCH) pr(rect(s - 0.07, s + 0.07, 0.0, 0.12), AS_WING_H + 0.12, AS_WING_H + AS_RAIL_H - 0.12, AS_STONE, AS_STONE)
  }
  // ---- the wings: a pointed upper window over paired lancets, on each side of the gable
  for (const sw of [3.1, 14.1]) {
    og(sw, AS_UP_WIN_Y0 - 0.2, AS_UP_WIN_W + 0.7, AS_UP_WIN_H + 0.5, AS_STONE, 0.04)
    og(sw, AS_UP_WIN_Y0, AS_UP_WIN_W, AS_UP_WIN_H, AS_GLASS, 0.08)
    band(sw - 0.05, sw + 0.05, AS_UP_WIN_Y0, AS_UP_WIN_Y0 + AS_UP_WIN_H - AS_UP_WIN_W * 0.5, 0.12, AS_STONE)
    band(sw - 0.9, sw + 0.9, 4.3, 5.1, 0.08, tone(AS_STONE, 0.96))   // the quatrefoil panel under the sill
    lancet(sw - 0.5, AS_LANCET_Y0, AS_LANCET_W, AS_LANCET_H); lancet(sw + 0.5, AS_LANCET_Y0, AS_LANCET_W, AS_LANCET_H)
  }
  // ---- the gable: steep slate roof, stone-edged front, pointed window, portal with its mosaic arch
  const s0 = AS_GABLE_S0, s1 = AS_GABLE_S1
  poly([P(s0, 0, AS_WING_H), P(s1, 0, AS_WING_H), P(sc, 0, AS_PEAK)], AS_STUCCO, nf)
  for (const [sa, hint] of [[s0, nl], [s1, nr]] as Array<[number, V3]>) {
    poly([P(sa, 0, AS_WING_H), P(sc, 0, AS_PEAK), P(sc, -AS_NAVE_D, AS_PEAK), P(sa, -AS_NAVE_D, AS_WING_H)], AS_SLATE, [hint[0] * 0.6, hint[1] * 0.6, 0.8])
    poly([P(sa, 0.1, AS_WING_H), P(sc, 0.1, AS_PEAK), P(sc, 0.1, AS_PEAK - 0.45), P(sa, 0.1, AS_WING_H - 0.45)], AS_STONE, nf)   // raking coping
  }
  poly([P(s0, -AS_NAVE_D, AS_WING_H), P(s1, -AS_NAVE_D, AS_WING_H), P(sc, -AS_NAVE_D, AS_PEAK)], AS_STUCCO, [-fn[0], -fn[1], 0])
  og(sc, AS_GABLE_WIN_Y0 - 0.25, AS_GABLE_WIN_W + 0.8, AS_GABLE_WIN_H + 0.55, AS_STONE, 0.04)
  og(sc, AS_GABLE_WIN_Y0, AS_GABLE_WIN_W, AS_GABLE_WIN_H, AS_GLASS, 0.08)
  band(sc - 0.05, sc + 0.05, AS_GABLE_WIN_Y0, AS_GABLE_WIN_Y0 + AS_GABLE_WIN_H - AS_GABLE_WIN_W * 0.6, 0.12, AS_STONE)
  band(sc - 1.1, sc + 1.1, 4.7, 5.9, 0.08, tone(AS_STONE, 0.96))     // the quatrefoil panel and statuette
  og(sc, 0.2, AS_PORTAL_W + 1.6, AS_PORTAL_H + 1.5, AS_STONE, 0.04)    // the arch with its mosaic band
  og(sc, 0.2, AS_PORTAL_W + 1.0, AS_PORTAL_H + 0.9, AS_GOLD, 0.07)
  og(sc, 0.2, AS_PORTAL_W + 0.35, AS_PORTAL_H + 0.3, AS_STONE, 0.1)
  og(sc, 0.35, AS_PORTAL_W, AS_PORTAL_H, AS_WOOD, 0.13)                 // the door
  band(sc - 0.04, sc + 0.04, 0.35, 2.9, 0.15, AS_IRON)
  for (const dy of [0.8, 1.7, 2.6]) for (const ds of [-0.5, 0.5]) band(sc + ds - 0.3, sc + ds + 0.3, dy, dy + 0.14, 0.16, AS_IRON)
  for (const sa of [sc - AS_PORTAL_W / 2 - 0.1, sc + AS_PORTAL_W / 2 + 0.1]) pr(rect(sa - 0.12, sa + 0.12, 0.0, 0.15), 0.35, 3.3, AS_STONE, AS_STONE)  // jamb shafts
  pr(rect(sc - 1.6, sc + 1.6, 0.0, 0.15), 0, 0.3, tone(AS_STONE, 0.9), tone(AS_STONE, 0.9))   // the threshold
  // ---- pinnacles flanking the gable
  for (const sp of [s0 + 0.35, s1 - 0.35]) {
    pr(rect(sp - 0.4, sp + 0.4, 0.0, 0.8), AS_WING_H, AS_PINN_TOP, AS_STUCCO, AS_STONE)
    const tip = P(sp, 0.4, AS_PINN_TOP + 1.8)
    const q = [P(sp - 0.4, 0, AS_PINN_TOP), P(sp + 0.4, 0, AS_PINN_TOP), P(sp + 0.4, 0.8, AS_PINN_TOP), P(sp - 0.4, 0.8, AS_PINN_TOP)]
    for (let k = 0; k < 4; k++) {
      const a = q[k], b = q[(k + 1) % 4], m: V3 = [(a[0] + b[0]) / 2 - tip[0], (a[1] + b[1]) / 2 - tip[1], 0.4]
      poly([a, b, tip], AS_STONE, m)
    }
  }
  // ---- the bellcote on the apex: a stone frame with two open bays, a pyramid cap and a cross
  const bt = AS_PEAK - 0.2, bm = bt + AS_BELL_H * 0.55
  pr(rect(sc - 0.55, sc + 0.55, -0.9, 0.0), bt, bm, AS_STONE, AS_STONE)
  band(sc - 0.4, sc + 0.4, bt + 0.4, bm - 0.15, 0.03, AS_GLASS)
  const roofTip = P(sc, -0.45, bt + AS_BELL_H)
  const bq = [P(sc - 0.6, 0.05, bm), P(sc + 0.6, 0.05, bm), P(sc + 0.6, -0.95, bm), P(sc - 0.6, -0.95, bm)]
  for (let k = 0; k < 4; k++) {
    const a = bq[k], b = bq[(k + 1) % 4], m: V3 = [(a[0] + b[0]) / 2 - roofTip[0], (a[1] + b[1]) / 2 - roofTip[1], 0.5]
    poly([a, b, roofTip], AS_STONE, m)
  }
  pr(rect(sc - 0.05, sc + 0.05, -0.5, -0.4), bt + AS_BELL_H, bt + AS_BELL_H + AS_CROSS_H, AS_STONE, AS_STONE)
  pr(rect(sc - 0.4, sc + 0.4, -0.5, -0.4), bt + AS_BELL_H + AS_CROSS_H * 0.55, bt + AS_BELL_H + AS_CROSS_H * 0.55 + 0.12, AS_STONE, AS_STONE)
}

// ───────────────────── Église luthérienne Saint-Marcel (way/60209197) ─────────────────────
// 24 rue Pierre-Nicole (5e), a Romanesque-revival street front squeezed between apartment blocks. Read off Commons
// photographs (docs/landmarks/refs/saint-marcel/, 2026-11-04): cream ashlar; ground floor with a round-arched portal
// under an inscribed archivolt flanked by two pairs of shuttered windows; string course; first floor with a large
// arched window over the door and a pair of arched windows each side; cornice; slate mansard with two dormers; a
// central gable with a blind arcature and a bellcote with a cross. Front = the ESE edge of the OSM ring; the rear is a
// plain slate-topped block (no photo).
// ---------------------------------------------------------------------------------------------------------------------
const SM_RING: P2[] = [[556.6, -2168.2], [554.4, -2172.5], [552.0, -2177.4], [530.2, -2170.3], [530.8, -2167.1], [532.6, -2157.4], [536.5, -2159.1], [541.1, -2161.1], [544.8, -2162.7], [548.3, -2164.3], [548.4, -2164.1]]
const SM_FRONT_B: P2 = [552.0, -2177.4], SM_FRONT_A: P2 = [556.6, -2168.2]   // street edge, viewer's left end and right end
const SM_IN = 0.18
const SM_STONE: Rgb = [0.82, 0.76, 0.62]
const SM_STONE_LO: Rgb = [0.70, 0.65, 0.54]
const SM_SLATE: Rgb = [0.34, 0.36, 0.40]
const SM_GLASS: Rgb = [0.17, 0.20, 0.26]
const SM_SHUTTER: Rgb = [0.88, 0.84, 0.70]
const SM_WOOD: Rgb = [0.45, 0.24, 0.10]
const SM_PLINTH_H = 0.6
const SM_STRING_Y = 5.7        // string course between the floors
const SM_EAVE = 9.0            // cornice
const SM_ROOF_TOP = 10.4       // top of the mansard / rear slate block
const SM_ROOF_RUN = 2.4        // depth of the front mansard slope
const SM_PEAK = 11.7           // gable apex
const SM_GABLE_DS = 2.2        // gable half-width
const SM_NAVE_D = 16
const SM_DOOR_W = 2.2
const SM_DOOR_H = 3.9
const SM_WIN_DS = [3.35, 4.4]  // ground-floor shuttered window offsets from centre
const SM_UP_DS = [2.9, 3.95]   // upper arched windows
const SM_UP_Y0 = 6.2
const SM_UP_H = 2.3
const SM_BIG_W = 1.25
const SM_BIG_H = 2.3
const SM_DORMER_DS = 2.9
const SM_BELL_Y = 11.5

export function egliseSaintMarcel(out: MeshBuilder, fit: Fit): void {
  const ring = SM_RING.slice()
  const L = Math.hypot(SM_FRONT_A[0] - SM_FRONT_B[0], SM_FRONT_A[1] - SM_FRONT_B[1])
  const fu: P2 = [(SM_FRONT_A[0] - SM_FRONT_B[0]) / L, (SM_FRONT_A[1] - SM_FRONT_B[1]) / L], fn: P2 = [fu[1], -fu[0]]
  for (const i of [0, 1, 2]) ring[i] = [ring[i][0] - fn[0] * SM_IN, ring[i][1] - fn[1] * SM_IN]
  const F = registerRing(ring, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const EN = (s: number, v: number): P2 => [SM_FRONT_B[0] + fu[0] * s + fn[0] * (v - SM_IN), SM_FRONT_B[1] + fu[1] * s + fn[1] * (v - SM_IN)]
  const P = (s: number, v: number, y: number): V3 => { const p = EN(s, v); return [p[0], p[1], y] }
  const rect = (s0: number, s1: number, v0: number, v1: number): P2[] => [EN(s0, v0), EN(s1, v0), EN(s1, v1), EN(s0, v1)]
  const nf: V3 = [fn[0], fn[1], 0]
  const sc = L / 2
  const band = (s0: number, s1: number, y0: number, y1: number, v: number, col: Rgb): void => poly([P(s0, v, y0), P(s1, v, y0), P(s1, v, y1), P(s0, v, y1)], col, nf)
  // a round-headed opening centred on s: base y0, width w, total height h
  const rnd = (s: number, y0: number, w: number, h: number, col: Rgb, v: number): void => {
    const r = w / 2, ys = y0 + h - r, pts: V3[] = [P(s - r, v, y0), P(s + r, v, y0), P(s + r, v, ys)]
    for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(s + r * Math.cos(a), v, ys + r * Math.sin(a))) }
    pts.push(P(s - r, v, ys)); poly(pts, col, nf)
  }
  const arched = (s: number, y0: number, w: number, h: number, hood: number): void => {
    rnd(s, y0 - 0.12, w + hood, h + 0.12 + hood * 0.5, SM_STONE_LO, 0.04); rnd(s, y0, w, h, SM_GLASS, 0.08)
    band(s - 0.03, s + 0.03, y0, y0 + h - w * 0.5, 0.11, SM_STONE)
  }

  // ---- body to the cornice, plinth, string course, cornice
  pr(ring, 0, SM_EAVE, SM_STONE, SM_STONE, 3, 0.03)
  band(0, L, 0, SM_PLINTH_H, 0.03, SM_STONE_LO)
  band(0, L, SM_STRING_Y - 0.12, SM_STRING_Y + 0.12, 0.08, SM_STONE_LO)
  band(0, L, SM_EAVE - 0.3, SM_EAVE + 0.1, 0.14, SM_STONE_LO)
  // ---- ground floor: round-arched portal under its inscribed archivolt, shuttered window pairs
  rnd(sc, 0.2, SM_DOOR_W + 1.9, SM_DOOR_H + 1.1, SM_STONE_LO, 0.04)
  rnd(sc, 0.2, SM_DOOR_W + 1.3, SM_DOOR_H + 0.7, tone(SM_STONE, 0.9), 0.07)
  rnd(sc, 0.3, SM_DOOR_W, SM_DOOR_H, SM_WOOD, 0.1)
  band(sc - 0.04, sc + 0.04, 0.3, SM_DOOR_H - SM_DOOR_W * 0.5, 0.13, SM_STONE_LO)
  for (const sp of [sc - SM_DOOR_W / 2 - 0.25, sc + SM_DOOR_W / 2 + 0.25]) pr(rect(sp - 0.2, sp + 0.2, 0.0, 0.3), 0.3, 3.5, SM_STONE, SM_STONE)
  pr(rect(sc - 1.5, sc + 1.5, 0.0, 0.35), 0, 0.3, tone(SM_STONE, 0.9), tone(SM_STONE, 0.9))
  for (const sg of [-1, 1]) for (const d of SM_WIN_DS) {
    const s = sc + sg * d
    rnd(s, 1.85, 0.95, 2.7, SM_STONE_LO, 0.04); rnd(s, 1.95, 0.7, 2.5, SM_SHUTTER, 0.08)
  }
  // ---- first floor: the big arched window over the door, pairs of arched windows
  arched(sc, SM_UP_Y0, SM_BIG_W, SM_BIG_H, 1.2)
  for (const sg of [-1, 1]) for (const d of SM_UP_DS) arched(sc + sg * d, SM_UP_Y0, 0.8, SM_UP_H, 0.3)
  // ---- slate mansard (front slope) and the rear block
  const sl: Rgb = SM_SLATE
  poly([P(0, 0.05, SM_EAVE), P(L, 0.05, SM_EAVE), P(L, -SM_ROOF_RUN, SM_ROOF_TOP), P(0, -SM_ROOF_RUN, SM_ROOF_TOP)], sl, [fn[0] * 0.6, fn[1] * 0.6, 0.8])
  pr(rect(0.25, L - 0.25, -SM_ROOF_RUN, -SM_NAVE_D - 6), SM_EAVE, SM_ROOF_TOP, SM_STONE_LO, sl)
  // ---- the central gable (nave roof) with its blind arcature
  const sa = sc - SM_GABLE_DS, sb = sc + SM_GABLE_DS
  poly([P(sa, 0, SM_EAVE), P(sb, 0, SM_EAVE), P(sc, 0, SM_PEAK)], SM_STONE, nf)
  for (const [s, hint] of [[sa, -1], [sb, 1]] as Array<[number, number]>) {
    poly([P(s, 0, SM_EAVE), P(sc, 0, SM_PEAK), P(sc, -SM_NAVE_D, SM_PEAK), P(s, -SM_NAVE_D, SM_EAVE)], sl, [fu[0] * hint * 0.6, fu[1] * hint * 0.6, 0.8])
    poly([P(s, 0.1, SM_EAVE), P(sc, 0.1, SM_PEAK), P(sc, 0.1, SM_PEAK - 0.4), P(s, 0.1, SM_EAVE - 0.4)], SM_STONE_LO, nf)   // raking coping
  }
  poly([P(sa, -SM_NAVE_D, SM_EAVE), P(sb, -SM_NAVE_D, SM_EAVE), P(sc, -SM_NAVE_D, SM_PEAK)], SM_STONE, [-fn[0], -fn[1], 0])
  for (const d of [-1.1, -0.4, 0.4, 1.1]) rnd(sc + d, SM_EAVE + 0.15, 0.5, 0.9 - Math.abs(d) * 0.35, tone(SM_STONE, 0.78), 0.06)
  rnd(sc, SM_EAVE + 0.3, 0.6, 0.6, tone(SM_STONE, 0.78), 0.06)
  // ---- two dormers on the mansard
  for (const sg of [-1, 1]) {
    const s = sc + sg * SM_DORMER_DS
    pr(rect(s - 0.6, s + 0.6, -0.5, -1.6), SM_EAVE + 0.15, SM_EAVE + 1.45, SM_STONE, SM_STONE)
    rnd(s, SM_EAVE + 0.35, 0.65, 1.1, SM_GLASS, -0.49)
    poly([P(s - 0.7, -0.5, SM_EAVE + 1.45), P(s + 0.7, -0.5, SM_EAVE + 1.45), P(s, -0.5, SM_EAVE + 2.1)], SM_STONE_LO, nf)
  }
  // ---- bellcote with a cross on the apex
  const bt = SM_PEAK - 0.1, bm = SM_BELL_Y + 1.45
  pr(rect(sc - 0.6, sc + 0.6, -0.9, 0.0), bt, SM_BELL_Y + 0.5, SM_STONE_LO, SM_STONE_LO)
  pr(rect(sc - 0.5, sc + 0.5, -0.8, -0.1), SM_BELL_Y + 0.5, bm, SM_STONE, SM_STONE)
  rnd(sc, SM_BELL_Y + 0.7, 0.5, 0.75, SM_GLASS, 0.0)
  const tip = P(sc, -0.45, bm + 0.55)
  const bq = [P(sc - 0.6, 0.05, bm), P(sc + 0.6, 0.05, bm), P(sc + 0.6, -0.95, bm), P(sc - 0.6, -0.95, bm)]
  for (let k = 0; k < 4; k++) {
    const a = bq[k], b = bq[(k + 1) % 4], m: V3 = [(a[0] + b[0]) / 2 - tip[0], (a[1] + b[1]) / 2 - tip[1], 0.5]
    poly([a, b, tip], SM_STONE_LO, m)
  }
  pr(rect(sc - 0.05, sc + 0.05, -0.5, -0.4), bm + 0.55, bm + 1.6, SM_STONE, SM_STONE)
  pr(rect(sc - 0.35, sc + 0.35, -0.5, -0.4), bm + 1.15, bm + 1.27, SM_STONE, SM_STONE)
}

// ───────────────────── Église luthérienne des Billettes (way/55942658; the cloister way/466690493 is left alone) ─────────────────────
// 24 rue des Archives, 4e (Carmes-Billettes church, front of 1756-58). Read off Commons photographs
// (docs/landmarks/refs/billettes/, 2026-11-04): facade-2016.jpg (Billettes mai 2016) — a two-storey limestone front, a round-arched
// red door in the lower storey under a string cornice, a central pavilion with pilasters, a clock over a tall round-arched
// window, a low pediment, lower wings with small windows, and a domed lantern belfry with a cross rising behind; and the
// portal close-up (Paris-Église des Billettes-2025-01a) for the door. The front faces WNW onto the street; the nave runs
// back ESE to a rounded apse. Front edge A(south)→B(north) is taken off the OSM ring; u runs along it, v outward.
const BIL_RING: P2[] = [[1681.0, -279.8], [1683.1, -275.7], [1686.7, -268.5], [1691.8, -271.1], [1690.0, -274.7], [1701.9, -280.5], [1703.8, -280.5], [1708.0, -282.7], [1709.2, -285.8], [1707.5, -290.6], [1704.3, -292.1], [1701.1, -291.8], [1698.0, -288.8], [1697.6, -288.8], [1686.1, -283.3], [1684.3, -279.6]]
const BIL_FA: P2 = [1681.0, -279.8], BIL_FB: P2 = [1686.7, -268.5]
const BIL_STONE: Rgb = [0.80, 0.72, 0.53]
const BIL_SLATE: Rgb = [0.30, 0.32, 0.36]
const BIL_GLASS: Rgb = [0.12, 0.15, 0.20]
const BIL_DOOR: Rgb = [0.48, 0.09, 0.12]
const BIL_LEAD: Rgb = [0.42, 0.50, 0.48]
const BIL_IRON: Rgb = [0.08, 0.08, 0.09]
const BIL_NAVE_H = 9.0         // eaves of the nave and the flat of the front block
const BIL_RIDGE = 3.4          // nave roof rise
const BIL_NAVE_U0 = -0.7, BIL_NAVE_U1 = 8.7, BIL_NAVE_V0 = -6.1, BIL_APSE_V = -19.1   // nave strip in front-frame metres
const BIL_PAV_W = 7.2          // central pavilion width, centred on the front
const BIL_WING_H = 9.9
const BIL_STRING_Y = 6.2       // string cornice between the storeys
const BIL_PED_Y = 11.6, BIL_PED_PEAK = 12.8
const BIL_DOOR_W = 2.6, BIL_DOOR_SPRING = 4.1, BIL_DOOR_OUT = 3.8
const BIL_WIN_W = 1.8, BIL_WIN_Y0 = 6.9, BIL_WIN_Y1 = 10.2, BIL_CLOCK_R = 0.55, BIL_CLOCK_Y = 9.45
const BIL_PIL_W = 0.55, BIL_PIL_OUT = [3.25, 1.6]
const BIL_BELFRY_V = -3.4, BIL_BELFRY_Y0 = 10.6, BIL_BELFRY_Y1 = 12.4, BIL_LANT_Y1 = 14.4, BIL_LANT_W = 1.0, BIL_DOME_Y1 = 15.8, BIL_CROSS_Y1 = 17.2

export function egliseBillettes(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BIL_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BIL_FB[0] - BIL_FA[0], BIL_FB[1] - BIL_FA[1])
  const fu: P2 = [(BIL_FB[0] - BIL_FA[0]) / L, (BIL_FB[1] - BIL_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [BIL_FA[0] + fu[0] * u + fn[0] * v, BIL_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const hint: V3 = [fn[0], fn[1], 0]
  const stone = BIL_STONE, uc = L / 2
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (c: number, w: number, y0: number, spring: number, v: number, col: Rgb): void => {
    const r = w / 2, pts: V3[] = [P(c - r, v, y0), P(c + r, v, y0), P(c + r, v, spring)]
    for (let i = 1; i < 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(c + Math.cos(a) * r, v, spring + Math.sin(a) * r)) }
    pts.push(P(c - r, v, spring))
    poly(pts, col, hint)
  }
  const V = 0.04   // relief sits this far proud of the ring edge

  // ---- the whole plan as walls, a flat top for the front block
  pr(BIL_RING, 0, BIL_NAVE_H, tone(stone, 0.92), tone(stone, 0.7), 0.9, 0.1)

  // ---- nave roof: slate gable, ridge along the nave; a stone gable end toward the front; a conical hip over the apse
  { const uR = (BIL_NAVE_U0 + BIL_NAVE_U1) / 2, y0 = BIL_NAVE_H - 0.05, y1 = BIL_NAVE_H + BIL_RIDGE, vA = BIL_NAVE_V0, vB = BIL_APSE_V
    poly([P(BIL_NAVE_U0, vA, y0), P(uR, vA, y1), P(uR, vB, y1), P(BIL_NAVE_U0, vB, y0)], BIL_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(BIL_NAVE_U1, vB, y0), P(uR, vB, y1), P(uR, vA, y1), P(BIL_NAVE_U1, vA, y0)], tone(BIL_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(BIL_NAVE_U0, vA, y0), P(BIL_NAVE_U1, vA, y0), P(uR, vA, y1)], tone(stone, 0.85), hint)
    const apex = EN(uR, vB - 1.5), arc = BIL_RING.slice(5, 14)    // the rounded end, from the north corner round to the south
    for (let i = 0; i + 1 < arc.length; i++) {
      const p = arc[i], q = arc[i + 1], mx = (p[0] + q[0]) / 2 - apex[0], my = (p[1] + q[1]) / 2 - apex[1]
      poly([[p[0], p[1], BIL_NAVE_H], [q[0], q[1], BIL_NAVE_H], [apex[0], apex[1], y1 - 0.9]], i % 2 ? tone(BIL_SLATE, 0.9) : BIL_SLATE, [mx, my, 0.8])
    }
    // the gap between the nave ridge end and the apse fan is closed by the two end slopes meeting the cone
    poly([P(BIL_NAVE_U0, vB, y0), P(uR, vB, y1), [apex[0], apex[1], y1 - 0.9]], BIL_SLATE, [-fu[0] * 0.3, -fu[1] * 0.3 - 0.0, 1])
    poly([P(BIL_NAVE_U1, vB, y0), P(uR, vB, y1), [apex[0], apex[1], y1 - 0.9]], tone(BIL_SLATE, 0.92), [fu[0] * 0.3, fu[1] * 0.3, 1])
  }

  // ---- the front: plinth, string cornice, wings, central pavilion
  band(0, L, 0, 0.7, V, tone(stone, 0.78))
  band(0, L, BIL_STRING_Y - 0.15, BIL_STRING_Y + 0.25, V, tone(stone, 1.14))
  const pu0 = uc - BIL_PAV_W / 2, pu1 = uc + BIL_PAV_W / 2
  pr([EN(0.0, 0), EN(pu0, 0), EN(pu0, -1.2), EN(0.75, -1.2)], BIL_NAVE_H - 0.1, BIL_WING_H, tone(stone, 1.0), BIL_SLATE, 0.8, 0.1)       // south wing
  pr([EN(pu1, 0), EN(L, 0), EN(L, -1.2), EN(pu1, -1.2)], BIL_NAVE_H - 0.1, BIL_WING_H, tone(stone, 1.0), BIL_SLATE, 0.8, 0.1)             // north wing
  pr(rect(pu0, pu1, -1.4, 0), BIL_NAVE_H - 0.1, BIL_PED_Y, tone(stone, 1.04), tone(stone, 0.8), 0.8, 0.1)                                 // pavilion
  band(0, L, BIL_WING_H - 0.3, BIL_WING_H, V, tone(stone, 1.16))                                                                            // wing cornice
  band(pu0 - 0.05, pu1 + 0.05, BIL_PED_Y - 0.55, BIL_PED_Y, V, tone(stone, 1.18))                                                           // pavilion entablature
  for (const s of [-1, 1]) {   // scrolled ramps from wing to pavilion
    const ue = s < 0 ? pu0 : pu1
    poly([P(ue, V, BIL_WING_H), P(ue + s * -0.0 + s * -1.0 * -1, V, BIL_WING_H), P(ue, V, BIL_PED_Y - 0.55)], tone(stone, 1.08), hint)
  }
  // pediment
  poly([P(pu0 - 0.1, V + 0.01, BIL_PED_Y), P(pu1 + 0.1, V + 0.01, BIL_PED_Y), P(uc, V + 0.01, BIL_PED_PEAK)], tone(stone, 1.02), hint)
  for (const s of [-1, 1]) poly([P(uc + s * (BIL_PAV_W / 2 + 0.2), V + 0.02, BIL_PED_Y - 0.05), P(uc, V + 0.02, BIL_PED_PEAK), P(uc, V + 0.02, BIL_PED_PEAK + 0.22), P(uc + s * (BIL_PAV_W / 2 + 0.2), V + 0.02, BIL_PED_Y + 0.15)], tone(stone, 1.22), hint)

  // ---- pilasters on the pavilion (upper) and flanking the door (lower)
  for (const s of [-1, 1]) for (const o of BIL_PIL_OUT) {
    band(uc + s * o - BIL_PIL_W / 2, uc + s * o + BIL_PIL_W / 2, BIL_STRING_Y + 0.25, BIL_PED_Y - 0.55, V + 0.01, tone(stone, 1.1))
    band(uc + s * o - BIL_PIL_W / 2 - 0.08, uc + s * o + BIL_PIL_W / 2 + 0.08, BIL_PED_Y - 0.85, BIL_PED_Y - 0.55, V + 0.02, tone(stone, 1.2))
  }
  for (const s of [-1, 1]) {
    band(uc + s * 2.55 - 0.3, uc + s * 2.55 + 0.3, 0.7, BIL_STRING_Y - 0.15, V + 0.01, tone(stone, 1.1))
    band(uc + s * 2.55 - 0.38, uc + s * 2.55 + 0.38, BIL_STRING_Y - 0.5, BIL_STRING_Y - 0.15, V + 0.02, tone(stone, 1.2))
  }

  // ---- door: moulded round arch, red leaves with a fanlight panel
  arch(uc, BIL_DOOR_OUT, 0.7, BIL_DOOR_SPRING + 0.35, V + 0.01, tone(stone, 1.2))
  arch(uc, BIL_DOOR_W, 0.7, BIL_DOOR_SPRING, V + 0.03, BIL_DOOR)
  band(uc - BIL_DOOR_W / 2, uc + BIL_DOOR_W / 2, 2.9, 3.0, V + 0.05, tone(BIL_DOOR, 1.5))     // transom
  band(uc - 0.04, uc + 0.04, 0.7, 2.9, V + 0.05, tone(BIL_DOOR, 0.6))                            // meeting stile
  for (const s of [-1, 1]) band(uc + s * 0.62 - 0.4, uc + s * 0.62 + 0.4, 1.1, 2.5, V + 0.05, tone(BIL_DOOR, 0.85))
  for (let k = 0; k < 3; k++) band(uc - 1.9 - k * 0.0, uc + 1.9, 0.0 + 0.1 * k, 0.1 + 0.1 * k, V + 0.06, tone(stone, 0.8 - 0.05 * k))   // steps

  // ---- lower blind windows, wing windows
  for (const s of [-1, 1]) {
    const c = uc + s * 4.9
    if (c > 0.5 && c < L - 0.5) { arch(c, 1.1, 1.4, 4.1, V + 0.01, tone(stone, 1.15)); arch(c, 0.8, 1.55, 4.1, V + 0.03, BIL_GLASS); band(c - 0.4, c + 0.4, 2.8, 2.85, V + 0.05, BIL_IRON) }
    const w = uc + s * 5.1
    if (w > 0.5 && w < L - 0.5) { band(w - 0.45, w + 0.45, 7.2, 9.0, V + 0.01, tone(stone, 1.15)); band(w - 0.32, w + 0.32, 7.35, 8.85, V + 0.03, BIL_GLASS) }
  }

  // ---- the tall arched window with the clock in its head
  arch(uc, BIL_WIN_W + 0.8, BIL_WIN_Y0 - 0.15, BIL_WIN_Y1 - BIL_WIN_W / 2 - 0.1, V + 0.01, tone(stone, 1.2))
  arch(uc, BIL_WIN_W, BIL_WIN_Y0, BIL_WIN_Y1 - BIL_WIN_W / 2, V + 0.03, BIL_GLASS)
  for (let y = BIL_WIN_Y0 + 0.45; y < BIL_CLOCK_Y - 0.7; y += 0.45) band(uc - BIL_WIN_W / 2, uc + BIL_WIN_W / 2, y, y + 0.04, V + 0.05, BIL_IRON)
  for (let u = -0.6; u <= 0.61; u += 0.3) band(uc + u - 0.02, uc + u + 0.02, BIL_WIN_Y0, BIL_CLOCK_Y - 0.6, V + 0.05, BIL_IRON)
  { const face: V3[] = []
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; face.push(P(uc + Math.cos(a) * BIL_CLOCK_R, V + 0.07, BIL_CLOCK_Y + Math.sin(a) * BIL_CLOCK_R)) }
    poly(face, [0.92, 0.9, 0.84], hint)
    band(uc - 0.03, uc + 0.03, BIL_CLOCK_Y, BIL_CLOCK_Y + 0.42, V + 0.09, BIL_IRON)
    band(uc, uc + 0.3, BIL_CLOCK_Y - 0.03, BIL_CLOCK_Y + 0.03, V + 0.09, BIL_IRON) }

  // ---- the belfry behind the pediment: stone base, square lantern with arched louvres, lead dome, cross
  { const bc = EN(uc, BIL_BELFRY_V), w = 1.5
    pr(rect(uc - w, uc + w, BIL_BELFRY_V - w, BIL_BELFRY_V + w), BIL_BELFRY_Y0, BIL_BELFRY_Y1, tone(stone, 1.0), tone(stone, 0.8))
    const lw = BIL_LANT_W + 0.15
    pr(rect(uc - lw, uc + lw, BIL_BELFRY_V - lw, BIL_BELFRY_V + lw), BIL_BELFRY_Y1 - 0.05, BIL_LANT_Y1, tone(stone, 1.06), tone(stone, 0.8))
    pr(rect(uc - lw - 0.15, uc + lw + 0.15, BIL_BELFRY_V - lw - 0.15, BIL_BELFRY_V + lw + 0.15), BIL_LANT_Y1 - 0.25, BIL_LANT_Y1, tone(stone, 1.18), tone(stone, 0.8))
    const vf = BIL_BELFRY_V + lw + 0.03
    arch(uc, 1.1, BIL_BELFRY_Y1 + 0.2, BIL_LANT_Y1 - 1.0, vf, BIL_GLASS)
    for (const s of [-1, 1]) {   // the side faces
      const us = uc + s * (lw + 0.03), sh: V3 = [fu[0] * s, fu[1] * s, 0], r = 0.55
      const pts: V3[] = [P(us, BIL_BELFRY_V - r, BIL_BELFRY_Y1 + 0.2), P(us, BIL_BELFRY_V + r, BIL_BELFRY_Y1 + 0.2), P(us, BIL_BELFRY_V + r, BIL_LANT_Y1 - 1.0)]
      for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(us, BIL_BELFRY_V + Math.cos(a) * r, BIL_LANT_Y1 - 1.0 + Math.sin(a) * r)) }
      pts.push(P(us, BIL_BELFRY_V - r, BIL_LANT_Y1 - 1.0))
      poly(pts, BIL_GLASS, sh)
    }
    const ring8 = rectPoly(bc, lw * 1.2, 8)
    for (let i = 0; i < 8; i++) {
      const p = ring8[i], q = ring8[(i + 1) % 8], mx = (p[0] + q[0]) / 2 - bc[0], my = (p[1] + q[1]) / 2 - bc[1]
      poly([[p[0], p[1], BIL_LANT_Y1], [q[0], q[1], BIL_LANT_Y1], [bc[0], bc[1], BIL_DOME_Y1]], i % 2 ? tone(BIL_LEAD, 0.92) : BIL_LEAD, [mx, my, 0.5])
    }
    pr(rect(uc - 0.05, uc + 0.05, BIL_BELFRY_V - 0.05, BIL_BELFRY_V + 0.05), BIL_DOME_Y1 - 0.05, BIL_CROSS_Y1, BIL_IRON, BIL_IRON)
    pr(rect(uc - 0.3, uc + 0.3, BIL_BELFRY_V - 0.04, BIL_BELFRY_V + 0.04), BIL_CROSS_Y1 - 0.6, BIL_CROSS_Y1 - 0.5, BIL_IRON, BIL_IRON)
  }
}

// ───────────────────── Église luthérienne de la Trinité (way/78534147) ─────────────────────
// 172 bis boulevard Vincent-Auriol, 13e (a Gothic-revival chapel of 1870s tucked between apartment blocks). Read off
// Commons photographs (docs/landmarks/refs/trinite/, 2026-11-04): p1 — a flint (meulière) gable facing SSE onto the boulevard,
// cream-stone quoins and rake coping, a big pointed traceried window over a Tudor-arched porch with a brown door, two small
// lancets, a fleuron on the gable and a cross on the apex; p2/p5 — the plain rendered rear on rue Godefroy with a tall pointed
// traceried window in a gable and barred rectangular windows in the lower flat-roofed wings. The railing across the boulevard
// forecourt lies outside the OSM ring and is left out. Frame: u runs along the front A→B (W→E), v outward (SSE); the ring's
// forecourt spur (nodes 3-4-5) is dropped from the body. Frame is E/N metres of the paris-centre grid.
const TR_RING: P2[] = [[1880.98, -3181.25], [1883.86, -3191.58], [1884.15, -3191.51], [1885.68, -3197.07], [1888.24, -3202.48], [1888.70, -3202.25], [1887.40, -3199.53], [1891.36, -3198.46], [1894.59, -3197.58], [1895.37, -3198.88], [1897.67, -3197.69], [1899.73, -3196.63], [1897.68, -3189.33], [1896.96, -3186.52], [1894.55, -3187.24], [1895.49, -3190.61], [1893.55, -3191.14], [1891.80, -3184.89], [1895.17, -3183.93], [1895.71, -3185.86], [1896.67, -3185.57], [1894.37, -3177.43], [1891.13, -3178.35], [1884.07, -3180.37]]
const TR_A: P2 = [1887.40, -3199.53], TR_B: P2 = [1894.59, -3197.58]
const TR_FLINT: Rgb = [0.48, 0.43, 0.37]
const TR_CREAM: Rgb = [0.86, 0.82, 0.70]
const TR_PLASTER: Rgb = [0.83, 0.81, 0.75]
const TR_SLATE: Rgb = [0.34, 0.36, 0.40]
const TR_GLASS: Rgb = [0.15, 0.17, 0.22]
const TR_WOOD: Rgb = [0.45, 0.26, 0.12]
const TR_IN = 0.15             // front plane inset from the ring
const TR_N0 = 0.25, TR_N1 = 7.2          // nave strip along the front, metres
const TR_VR = -19.35           // rear gable plane
const TR_LOW_H = 7.0           // the lower wings and the flat block
const TR_EAVE = 8.0, TR_PEAK = 11.2      // nave eaves and gable apex
const TR_WIN_Y0 = 5.2, TR_WIN_W = 1.9, TR_WIN_H = 3.4
const TR_DOOR_W = 2.0, TR_DOOR_H = 3.3, TR_PORCH_W = 3.3, TR_PORCH_H = 4.2
const TR_LANCET_DS = 2.9, TR_LANCET_Y0 = 1.5
const TR_QUOIN_STEP = 0.7
const TR_CROSS_Y1 = 13.0
const TR_REAR_WIN_Y0 = 2.6, TR_REAR_WIN_W = 2.2, TR_REAR_WIN_H = 4.4

export function egliseTrinite(out: MeshBuilder, fit: Fit): void {
  const A = TR_A, B = TR_B
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const fu: P2 = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], fn: P2 = [fu[1], -fu[0]]
  const F = registerRing(TR_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const EN = (s: number, v: number): P2 => [A[0] + fu[0] * s + fn[0] * v, A[1] + fu[1] * s + fn[1] * v]
  const P = (s: number, v: number, y: number): V3 => { const p = EN(s, v); return [p[0], p[1], y] }
  const rect = (s0: number, s1: number, v0: number, v1: number): P2[] => [EN(s0, v0), EN(s1, v0), EN(s1, v1), EN(s0, v1)]
  const nf: V3 = [fn[0], fn[1], 0], nb: V3 = [-fn[0], -fn[1], 0]
  const sc = (TR_N0 + TR_N1) / 2
  const vF = -TR_IN, VF = vF + 0.04, VRd = TR_VR - 0.0   // decor planes
  const band = (s0: number, s1: number, y0: number, y1: number, v: number, col: Rgb, hint: V3 = nf): void => poly([P(s0, v, y0), P(s1, v, y0), P(s1, v, y1), P(s0, v, y1)], col, hint)
  const win = (s: number, y0: number, w: number, h: number, v: number, hood: Rgb | null, glass: Rgb): void => {
    const c = EN(s, v)
    if (hood) ogive(T, c, fu, hint2(v), y0 - 0.2, w + 0.6, h + 0.35, hood, 0.0)
    ogive(T, c, fu, hint2(v), y0, w, h, glass, 0.03)
  }
  const hint2 = (v: number): P2 => (v > -5 ? fn : [-fn[0], -fn[1]])

  // ---- body: the ring without the forecourt spur, front inset, flat roof, plaster
  const body: P2[] = TR_RING.filter((_, i) => i !== 4 && i !== 5).map((p, i) => {
    return (i >= 4 && i <= 6) ? [p[0] - fn[0] * TR_IN, p[1] - fn[1] * TR_IN] as P2 : p
  })
  pr(body, 0, TR_LOW_H, TR_PLASTER, [0.48, 0.48, 0.46], 3, 0.02)
  // low cream coping along the wings
  pr(body, TR_LOW_H - 0.02, TR_LOW_H + 0.12, TR_CREAM, TR_CREAM)

  // ---- nave: flank walls to the eaves, slate roof, flint gable front, rendered gable rear
  pr(rect(TR_N0, TR_N1, TR_VR, vF), TR_LOW_H, TR_EAVE, TR_PLASTER, TR_PLASTER)
  for (const [s, h] of [[TR_N0, -1], [TR_N1, 1]] as Array<[number, number]>) {
    poly([P(s, vF, TR_EAVE), P(sc, vF, TR_PEAK), P(sc, TR_VR, TR_PEAK), P(s, TR_VR, TR_EAVE)], TR_SLATE, [fu[0] * h * 0.7, fu[1] * h * 0.7, 0.7])
  }
  // front gable face: flint with cream quoins and rake coping
  poly([P(TR_N0, VF, 0.1), P(TR_N1, VF, 0.1), P(TR_N1, VF, TR_EAVE), P(sc, VF, TR_PEAK), P(TR_N0, VF, TR_EAVE)], TR_FLINT, nf)
  for (let y = 1.0; y < TR_EAVE - 0.4; y += TR_QUOIN_STEP) {
    const k = Math.round(y / TR_QUOIN_STEP) % 2 ? 0.55 : 0.4
    band(TR_N0, TR_N0 + k, y, y + 0.42, VF + 0.03, TR_CREAM); band(TR_N1 - k, TR_N1, y, y + 0.42, VF + 0.03, TR_CREAM)
  }
  for (const [s0, s1] of [[TR_N0, sc], [sc, TR_N1]] as Array<[number, number]>) {
    const y0 = s0 === sc ? TR_PEAK : TR_EAVE, y1 = s0 === sc ? TR_EAVE : TR_PEAK
    poly([P(s0, VF + 0.05, y0 - 0.1), P(s1, VF + 0.05, y1 - 0.1), P(s1, VF + 0.05, y1 + 0.2), P(s0, VF + 0.05, y0 + 0.2)], TR_CREAM, nf)
  }
  // the big pointed window with its cream hood, the porch, the door, two lancets, the fleuron
  win(sc, TR_WIN_Y0, TR_WIN_W, TR_WIN_H, VF + 0.03, TR_CREAM, TR_GLASS)
  for (const d of [-0.32, 0.32]) band(sc + d - 0.03, sc + d + 0.03, TR_WIN_Y0, TR_WIN_Y0 + TR_WIN_H - TR_WIN_W * 0.6, VF + 0.1, TR_CREAM)
  band(sc - TR_WIN_W / 2, sc + TR_WIN_W / 2, TR_WIN_Y0 + 1.6, TR_WIN_Y0 + 1.66, VF + 0.1, TR_CREAM)
  band(sc - TR_PORCH_W / 2, sc + TR_PORCH_W / 2, 0.1, TR_PORCH_H, VF + 0.05, TR_CREAM)
  band(sc - TR_PORCH_W / 2 - 0.15, sc + TR_PORCH_W / 2 + 0.15, TR_PORCH_H - 0.05, TR_PORCH_H + 0.2, VF + 0.08, TR_CREAM)
  win(sc, 0.15, TR_DOOR_W + 0.7, TR_DOOR_H + 0.5, VF + 0.07, null, tone(TR_CREAM, 0.85))
  win(sc, 0.2, TR_DOOR_W, TR_DOOR_H, VF + 0.1, null, TR_WOOD)
  band(sc - 0.03, sc + 0.03, 0.2, TR_DOOR_H - 0.8, VF + 0.12, tone(TR_WOOD, 0.6))
  for (const sg of [-1, 1]) win(sc + sg * TR_LANCET_DS, TR_LANCET_Y0, 0.6, 1.6, VF + 0.05, TR_CREAM, TR_GLASS)
  band(sc - 0.12, sc + 0.12, TR_PEAK - 1.6, TR_PEAK - 1.0, VF + 0.05, TR_CREAM)
  // cross on the apex
  pr(rect(sc - 0.18, sc + 0.18, vF - 0.0, vF - 0.36), TR_PEAK - 0.1, TR_PEAK + 0.7, TR_CREAM, TR_CREAM)
  pr(rect(sc - 0.07, sc + 0.07, vF - 0.1, vF - 0.24), TR_PEAK + 0.7, TR_CROSS_Y1, TR_CREAM, TR_CREAM)
  pr(rect(sc - 0.45, sc + 0.45, vF - 0.1, vF - 0.24), TR_CROSS_Y1 - 0.7, TR_CROSS_Y1 - 0.5, TR_CREAM, TR_CREAM)

  // ---- rear (rue Godefroy): rendered gable with the tall pointed window, barred wing windows
  poly([P(TR_N0, VRd, TR_LOW_H), P(TR_N1, VRd, TR_LOW_H), P(TR_N1, VRd, TR_EAVE), P(sc, VRd, TR_PEAK), P(TR_N0, VRd, TR_EAVE)], TR_PLASTER, nb)
  for (const [s0, s1] of [[TR_N0, sc], [sc, TR_N1]] as Array<[number, number]>) {
    const y0 = s0 === sc ? TR_PEAK : TR_EAVE, y1 = s0 === sc ? TR_EAVE : TR_PEAK
    poly([P(s0, VRd - 0.04, y0 - 0.1), P(s1, VRd - 0.04, y1 - 0.1), P(s1, VRd - 0.04, y1 + 0.15), P(s0, VRd - 0.04, y0 + 0.15)], tone(TR_CREAM, 0.9), nb)
  }
  win(sc, TR_REAR_WIN_Y0, TR_REAR_WIN_W, TR_REAR_WIN_H, VRd - 0.03, TR_CREAM, TR_GLASS)
  for (const d of [-0.37, 0.37]) band(sc + d - 0.03, sc + d + 0.03, TR_REAR_WIN_Y0, TR_REAR_WIN_Y0 + TR_REAR_WIN_H - TR_REAR_WIN_W * 0.6, VRd - 0.08, TR_CREAM, nb)
  for (const s of [-0.5, 9.4]) {
    band(s - 0.5, s + 0.5, 3.1, 3.4 + 2.1, VRd - 0.03, TR_CREAM, nb)
    band(s - 0.35, s + 0.35, 3.25, 5.15, VRd - 0.06, TR_GLASS, nb)
    for (const d of [-0.18, 0, 0.18]) band(s + d - 0.015, s + d + 0.015, 3.25, 5.15, VRd - 0.08, [0.1, 0.1, 0.11], nb)
  }
}

// ───────────────────────────── Temple protestant du Luxembourg (way/63681841, 58 rue Madame, 6e) ─────────────────────────────
// A Gothic-revival chapel on the street line of rue Madame (Commons, docs/landmarks/refs/luxembourg/, 2026-11-04):
// a three-storey limestone front — rusticated ground floor with a pointed doorway under a crocketed ogee hood and
// rectangular windows, three tall pointed windows with a transom and leaded lozenges under a corbel cornice, then an
// attic with three small rectangular windows and pinnacled cresting. The nave behind is plain. Frame: E/N metres of
// the paris-centre grid; front A (south) → B (north), outward = east onto rue Madame.
const LX_RING: P2[] = [[-51.3, -1441.3], [-48.6, -1441.4], [-48.7, -1444.8], [-51.5, -1444.7], [-51.7, -1450.3], [-48.9, -1450.3], [-49.1, -1453.3], [-51.8, -1453.2], [-51.9, -1454.6], [-43.2, -1454.9], [-35.1, -1455.0], [-35.1, -1455.2], [-34.8, -1448.5], [-34.5, -1440.4], [-51.3, -1440.0]]
const LX_A: P2 = [-35.1, -1455.2], LX_B: P2 = [-34.5, -1440.4]
const LX_BACK: P2 = [-51.5, -1447.5], LX_CEN: P2 = [-43.0, -1447.7]    // a point on the notched west side; the ring's middle
const LX_STONE: Rgb = [0.80, 0.68, 0.50]
const LX_GLASS: Rgb = [0.20, 0.23, 0.27]
const LX_DOOR: Rgb = [0.20, 0.30, 0.18]
const LX_SLATE: Rgb = [0.36, 0.37, 0.40]
const LX_FRAME: Rgb = [0.88, 0.85, 0.76]
const LX_VF = -0.35            // main front plane
const LX_VC = -0.30            // base plane for the window helpers
const LX_FACADE_H = 15.4       // top of the attic cresting wall
const LX_BODY_IN = 0.9         // how far the body's front edge sits behind the ring's
const LX_BODY_H = 12.5         // the nave block behind
const LX_GF_H = 5.3            // top of the ground floor
const LX_CORN_Y = 11.3         // cornice
const LX_WIN = [2.2, 5.1, 9.5] // the tall windows' centres along the front
const LX_WIN_W = 2.4, LX_WIN_Y0 = 5.9, LX_WIN_H = 5.0
const LX_ATTIC = [2.2, 5.1, 9.5], LX_ATTIC_W = 0.95, LX_ATTIC_Y0 = 12.8, LX_ATTIC_H = 2.0
const LX_DOOR_U = 5.0, LX_DOOR_W = 2.0, LX_DOOR_H = 3.8, LX_HOOD_PEAK = 6.2
const LX_GF_NARROW = [1.3, 2.6], LX_GF_BIG = [8.7, 11.7]
const LX_QUOIN_W = 0.9, LX_QUOIN_STEP = 0.62

export function templeLuxembourg(out: MeshBuilder, fit: Fit): void {
  const A = LX_A, B = LX_B
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const fu: P2 = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], fn: P2 = [fu[1], -fu[0]]
  const F0 = registerRing(LX_RING, fit)
  // the moment fit can turn this near-square ring 180°: the front (A-B) must land on the model's -z side as the city places it (checked against a top shot), the notched back on +z
  const flipped = F0.xz((A[0] + B[0]) / 2, (A[1] + B[1]) / 2).z > F0.xz(LX_BACK[0], LX_BACK[1]).z
  const F = flipped ? { ...F0, p: (e: number, n: number, h: number) => F0.p(LX_CEN[0] * 2 - e, LX_CEN[1] * 2 - n, h), xz: (e: number, n: number) => F0.xz(LX_CEN[0] * 2 - e, LX_CEN[1] * 2 - n), n: (v: V3) => { const q = F0.n(v); return [-q[0], q[1], -q[2]] as V3 } } : F0
  const T = tools(out, F)
  const { prism: pr, poly } = T
  const EN = (s: number, v: number): P2 => [A[0] + fu[0] * s + fn[0] * v, A[1] + fu[1] * s + fn[1] * v]
  const P = (s: number, v: number, y: number): V3 => { const p = EN(s, v); return [p[0], p[1], y] }
  const rect = (s0: number, s1: number, v0: number, v1: number): P2[] => [EN(s0, v0), EN(s1, v0), EN(s1, v1), EN(s0, v1)]
  const nf: V3 = [fn[0], fn[1], 0]
  const W = L, stone = LX_STONE
  const band = (s0: number, s1: number, y0: number, y1: number, v: number, col: Rgb): void => poly([P(s0, v, y0), P(s1, v, y0), P(s1, v, y1), P(s0, v, y1)], col, nf)

  // body block and the front slab
  const body: P2[] = LX_RING.map((p, i) => (i >= 10 && i <= 13 ? [p[0] - fn[0] * LX_BODY_IN, p[1] - fn[1] * LX_BODY_IN] as P2 : p))   // the front edge pulled in behind the slab, or the body walls bury the front's detail
  pr(body, 0, LX_BODY_H, tone(stone, 0.92), LX_SLATE, 0.9, 0.12)
  pr(rect(0, W, -1.2, LX_VF), 0, LX_FACADE_H, stone, tone(stone, 0.85))
  pr(rect(0, W, -1.2, -0.05), LX_CORN_Y, LX_CORN_Y + 0.4, tone(stone, 1.1), tone(stone, 0.9))            // cornice
  for (let u = 0.35; u < W - 0.2; u += 0.55) pr(rect(u, u + 0.22, -0.55, -0.05), LX_CORN_Y - 0.5, LX_CORN_Y, tone(stone, 1.0), tone(stone, 0.85))   // corbels
  pr(rect(0, W, -1.2, -0.12), LX_GF_H, LX_GF_H + 0.3, tone(stone, 1.08), tone(stone, 0.9))               // string course
  pr(rect(0, W, -1.2, -0.12), 0, 0.7, tone(stone, 0.8), tone(stone, 0.8))                                // plinth
  pr(rect(0, W, -1.2, -0.12), LX_FACADE_H - 0.25, LX_FACADE_H + 0.05, tone(stone, 1.1), tone(stone, 0.9))  // top coping

  // rusticated quoins at both ends of the ground floor
  for (const [u0, u1] of [[0, LX_QUOIN_W * 0.8], [W - LX_QUOIN_W, W]]) {
    for (let y = 0.7, i = 0; y < LX_GF_H; y += LX_QUOIN_STEP, i++) {
      const k = i % 2 ? 0 : 0.18
      pr(rect(u0 + (u0 > 1 ? -k : 0), u1 + (u0 > 1 ? 0 : k), -0.55, -0.1), y, y + LX_QUOIN_STEP - 0.05, tone(stone, i % 2 ? 1.05 : 0.95), tone(stone, 0.9))
    }
  }
  // doorway: pointed arch with a crocketed gabled hood
  const dc = EN(LX_DOOR_U, LX_VC)
  ogive(T, dc, fu, fn, 0.7, LX_DOOR_W + 1.0, LX_DOOR_H + 0.9, tone(stone, 1.12), 0.0)
  ogive(T, dc, fu, fn, 0.7, LX_DOOR_W, LX_DOOR_H, LX_DOOR, 0.04)
  band(LX_DOOR_U - 0.04, LX_DOOR_U + 0.04, 0.7, LX_DOOR_H - 0.6, -0.22, tone(LX_DOOR, 1.5))
  { const hw = (LX_DOOR_W + 1.0) / 2 + 0.2
    for (const s of [-1, 1]) poly([P(LX_DOOR_U + s * hw, -0.2, 3.6), P(LX_DOOR_U, -0.2, LX_HOOD_PEAK), P(LX_DOOR_U, -0.2, LX_HOOD_PEAK - 0.35), P(LX_DOOR_U + s * (hw - 0.3), -0.2, 3.6)], tone(stone, 1.2), nf)
    pr(rectPoly(EN(LX_DOOR_U, -0.3), 0.14, 4), LX_HOOD_PEAK - 0.1, LX_HOOD_PEAK + 0.55, tone(stone, 1.15), tone(stone, 1.0)) }          // finial

  // ground-floor rectangular windows
  const rwin = (u: number, w: number, y0: number, y1: number): void => {
    band(u - w / 2 - 0.15, u + w / 2 + 0.15, y0 - 0.15, y1 + 0.15, -0.3, LX_FRAME)
    band(u - w / 2, u + w / 2, y0, y1, -0.26, LX_GLASS)
    band(u - 0.03, u + 0.03, y0, y1, -0.22, LX_FRAME)
    const my = (y0 + y1) / 2; band(u - w / 2, u + w / 2, my - 0.03, my + 0.03, -0.22, LX_FRAME)
  }
  for (const u of LX_GF_NARROW) rwin(u, 0.8, 1.9, 4.5)
  for (const u of LX_GF_BIG) rwin(u, 2.0, 1.9, 4.5)

  // three tall pointed windows with a transom and leaded lozenges
  for (const u of LX_WIN) {
    const c = EN(u, LX_VC)
    gothicWindow(T, c, fu, fn, LX_WIN_Y0, LX_WIN_W, LX_WIN_H, 1, stone, LX_GLASS)
    band(u - LX_WIN_W / 2, u + LX_WIN_W / 2, LX_WIN_Y0 + 1.4, LX_WIN_Y0 + 1.55, -0.16, tone(stone, 1.05))      // transom
    for (let k = 1; k < 7; k++) band(u - LX_WIN_W / 2, u + LX_WIN_W / 2, LX_WIN_Y0 + 1.55 + k * 0.4, LX_WIN_Y0 + 1.58 + k * 0.4, -0.17, tone(LX_GLASS, 1.5))
    pr(rect(u - LX_WIN_W / 2 - 0.5, u + LX_WIN_W / 2 + 0.5, -0.6, -0.1), LX_WIN_Y0 - 0.4, LX_WIN_Y0 - 0.2, tone(stone, 1.1), tone(stone, 0.9))   // sill
  }
  // attic windows and pinnacled cresting
  for (const u of LX_ATTIC) {
    band(u - LX_ATTIC_W / 2 - 0.15, u + LX_ATTIC_W / 2 + 0.15, LX_ATTIC_Y0 - 0.15, LX_ATTIC_Y0 + LX_ATTIC_H + 0.15, -0.3, LX_FRAME)
    band(u - LX_ATTIC_W / 2, u + LX_ATTIC_W / 2, LX_ATTIC_Y0, LX_ATTIC_Y0 + LX_ATTIC_H, -0.26, LX_GLASS)
    band(u - 0.03, u + 0.03, LX_ATTIC_Y0, LX_ATTIC_Y0 + LX_ATTIC_H, -0.22, LX_FRAME)
  }
  for (const u of [0.45, 3.65, 7.3, W - 0.45]) {
    const c = EN(u, -0.6), r = rectPoly(c, 0.22, 4)
    pr(r, LX_FACADE_H, LX_FACADE_H + 0.6, tone(stone, 1.1), tone(stone, 0.95))
    poly([[r[0][0], r[0][1], LX_FACADE_H + 0.6], [r[1][0], r[1][1], LX_FACADE_H + 0.6], [c[0], c[1], LX_FACADE_H + 1.4]], tone(stone, 1.05), nf)
    poly([[r[1][0], r[1][1], LX_FACADE_H + 0.6], [r[2][0], r[2][1], LX_FACADE_H + 0.6], [c[0], c[1], LX_FACADE_H + 1.4]], tone(stone, 0.95), [fu[0], fu[1], 0.5])
  }
  // pilaster strips between the tall windows
  for (const u of [3.65, 7.3]) band(u - 0.2, u + 0.2, LX_GF_H + 0.3, LX_CORN_Y - 0.5, -0.31, tone(stone, 0.9))
}

// ───────────── Église luthérienne Saint-Pierre (55 rue Manin, Paris 19e; way/63224657) ─────────────
// From Commons photos docs/landmarks/refs/saint-pierre/ (2026-11-04): a narrow red-brick chapel flush on rue Manin
// between apartment blocks — stone ground storey, twin windows either side of a central arched portal with a gold
// mosaic tympanum under a grey timber hood, a brick gable with an oculus and a cross, slate side roofs with dormers.
// Front = the 10 m edge on the street (outward = NNW, bearing -15). u from the viewer's right.
// ---------------------------------------------------------------------------------------------------------------------
const SP_RING: P2[] = [[3510.7, 2292.5], [3507.5, 2294.8], [3504.8, 2296.7], [3504.6, 2296.9], [3504.4, 2297.3], [3494.7, 2294.7], [3495.8, 2290.9], [3499.7, 2288.4], [3513.0, 2278.7], [3515.8, 2282.4], [3518.1, 2285.4], [3518.9, 2286.6]]
const SP_FA: P2 = [3494.7, 2294.7], SP_FB: P2 = [3504.4, 2297.3]      // street front, viewer's right to left
const SP_BRICK: Rgb = [0.66, 0.31, 0.19]
const SP_STONE: Rgb = [0.80, 0.75, 0.62]
const SP_SLATE: Rgb = [0.27, 0.28, 0.31]
const SP_TIMBER: Rgb = [0.39, 0.41, 0.44]
const SP_DOOR: Rgb = [0.27, 0.15, 0.09]
const SP_GLASS: Rgb = [0.18, 0.22, 0.28]
const SP_GOLD: Rgb = [0.80, 0.64, 0.26]
const SP_IRON: Rgb = [0.12, 0.12, 0.13]
const SP_EAVE = 5.8           // side-wing cornice
const SP_SIDE_RISE = 2.0      // side slate roofs rise over SP_SIDE_D
const SP_SIDE_D = 3.6
const SP_NAVE_U0 = 2.8, SP_NAVE_U1 = 7.2   // gabled bay
const SP_NAVE_D = 6.4         // keeps the bay inside the ring (the west boundary slants away behind)
const SP_NAVE_EAVE = 7.8      // gable shoulders
const SP_APEX = 10.3
const SP_BASE_H = 2.5         // stone ground storey
const SP_WIN_Y0 = 2.8, SP_WIN_Y1 = 4.6
const SP_WIN_PAIR_W = 1.8
const SP_WIN_U = [1.95, 8.05] as const      // pair centres (right, left)
const SP_DOOR_W = 1.5, SP_DOOR_H = 3.7
const SP_HOOD_Y = 5.5, SP_HOOD_RISE = 2.4, SP_HOOD_HW = 1.9
const SP_OCULUS_Y = 8.1, SP_OCULUS_R = 0.55
const SP_DORMER_Y = 6.0, SP_DORMER_W = 1.0, SP_DORMER_H = 1.6

export function egliseSaintPierre(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SP_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(SP_FB[0] - SP_FA[0], SP_FB[1] - SP_FA[1])
  const fu: P2 = [(SP_FB[0] - SP_FA[0]) / L, (SP_FB[1] - SP_FA[1]) / L], fn: P2 = [-fu[1], fu[0]]
  const EN = (u: number, v: number): P2 => [SP_FA[0] + fu[0] * u + fn[0] * v, SP_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (uc: number, y0: number, w: number, h: number, col: Rgb, v: number): void => {
    const r = w / 2, ys = y0 + h - r, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(uc - r * Math.cos(a), v, ys + r * Math.sin(a))) }
    poly(pts, col, hint)
  }
  const mid = (SP_NAVE_U0 + SP_NAVE_U1) / 2

  // ---- body over the whole plan, then the gabled bay
  pr(SP_RING, 0, SP_EAVE, SP_BRICK, SP_SLATE)
  pr([EN(SP_NAVE_U0, 0), EN(SP_NAVE_U1, 0), EN(SP_NAVE_U1, -SP_NAVE_D), EN(SP_NAVE_U0, -SP_NAVE_D)], 0, SP_NAVE_EAVE, SP_BRICK, SP_SLATE)
  { const y0 = SP_NAVE_EAVE - 0.05, vB = -SP_NAVE_D
    poly([P(SP_NAVE_U0, 0, y0), P(mid, 0, SP_APEX), P(mid, vB, SP_APEX), P(SP_NAVE_U0, vB, y0)], SP_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(SP_NAVE_U1, 0, y0), P(mid, 0, SP_APEX), P(mid, vB, SP_APEX), P(SP_NAVE_U1, vB, y0)], tone(SP_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(SP_NAVE_U0, 0, y0), P(SP_NAVE_U1, 0, y0), P(mid, 0, SP_APEX)], SP_BRICK, hint)             // front gable
    poly([P(SP_NAVE_U0 - 0.1, 0.1, y0 - 0.1), P(mid, 0.1, SP_APEX + 0.08), P(mid, 0.1, SP_APEX - 0.22), P(SP_NAVE_U0 - 0.1, 0.1, y0 - 0.36)], SP_STONE, hint)   // rake bands
    poly([P(SP_NAVE_U1 + 0.1, 0.1, y0 - 0.1), P(mid, 0.1, SP_APEX + 0.08), P(mid, 0.1, SP_APEX - 0.22), P(SP_NAVE_U1 + 0.1, 0.1, y0 - 0.36)], SP_STONE, hint)
  }
  // side slate roofs, rising away from the street toward the bay
  for (const [a, b, s] of [[0, SP_NAVE_U0, 1], [SP_NAVE_U1, L, -1]] as [number, number, number][]) {
    const y0 = SP_EAVE - 0.02, y1 = SP_EAVE + SP_SIDE_RISE
    poly([P(a, 0, y0), P(b, 0, y0), P(b, -SP_SIDE_D, y1), P(a, -SP_SIDE_D, y1)], SP_SLATE, [fn[0] * 0.5, fn[1] * 0.5, 1])
    const e = s > 0 ? a : b
    poly([P(e, 0, y0), P(e, -SP_SIDE_D, y0), P(e, -SP_SIDE_D, y1)], SP_BRICK, [-fu[0] * s, -fu[1] * s, 0])
  }
  // ---- ground storey, cornice, string
  band(0, L, 0, SP_BASE_H, 0.06, SP_STONE)
  band(0, L, SP_EAVE - 0.22, SP_EAVE + 0.02, 0.1, SP_STONE)
  // ---- twin windows either side of the portal, stone surrounds
  for (const uc of SP_WIN_U) {
    const w = SP_WIN_PAIR_W
    band(uc - w / 2 - 0.15, uc + w / 2 + 0.15, SP_WIN_Y0 - 0.15, SP_WIN_Y1 + 0.15, 0.07, SP_STONE)
    for (const s of [-1, 1]) band(uc + s * 0.45 - 0.37, uc + s * 0.45 + 0.37, SP_WIN_Y0, SP_WIN_Y1, 0.11, SP_GLASS)
    band(uc - 0.03, uc + 0.03, SP_WIN_Y0, SP_WIN_Y1, 0.13, SP_STONE)
    band(uc - w / 2 + 0.15, uc + w / 2 - 0.15, 0.75, 1.75, 0.1, SP_IRON)             // barred basement window
  }
  band(0.7, 1.7, 0.4, 2.2, 0.0, SP_DOOR)                                              // small side door (viewer's right)
  band(0.7, 1.7, 0.4, 2.2, 0.1, SP_DOOR)
  // ---- portal: stone jambs, arched door, gold tympanum, lettering band, iron gate
  for (const s of [-1, 1]) band(mid + s * (SP_DOOR_W / 2 + 0.2) - 0.18, mid + s * (SP_DOOR_W / 2 + 0.2) + 0.18, 0, SP_DOOR_H + 0.4, 0.09, SP_STONE)
  arch(mid, 0.1, SP_DOOR_W, SP_DOOR_H - 0.1, SP_DOOR, 0.12)
  band(mid - 0.03, mid + 0.03, 0.1, SP_DOOR_H - 0.9, 0.15, tone(SP_DOOR, 0.6))
  band(mid - SP_DOOR_W / 2 - 0.35, mid + SP_DOOR_W / 2 + 0.35, SP_DOOR_H + 0.4, SP_DOOR_H + 0.75, 0.1, SP_GOLD)          // ÉGLISE ÉVANGÉLIQUE
  arch(mid, SP_DOOR_H + 0.75, SP_DOOR_W + 0.6, 1.1, SP_GOLD, 0.1)                                                       // tympanum
  for (let k = 0; k <= 8; k++) band(mid - SP_DOOR_W / 2 + (SP_DOOR_W * k) / 8 - 0.02, mid - SP_DOOR_W / 2 + (SP_DOOR_W * k) / 8 + 0.02, 0.1, 1.2, 0.16, SP_IRON)
  band(mid - SP_DOOR_W / 2, mid + SP_DOOR_W / 2, 1.1, 1.18, 0.16, SP_IRON)
  // ---- timber hood over the portal (flat on the face: a grey triangular frame with an inner arch)
  { const hw = SP_HOOD_HW, y0 = SP_HOOD_Y, y1 = SP_HOOD_Y + SP_HOOD_RISE, v = 0.1
    poly([P(mid - hw, v, y0), P(mid + hw, v, y0), P(mid, v, y1)], SP_TIMBER, hint)
    poly([P(mid - hw * 0.62, v + 0.03, y0 + 0.2), P(mid + hw * 0.62, v + 0.03, y0 + 0.2), P(mid, v + 0.03, y1 - 0.65)], SP_BRICK, hint)
    arch(mid, y0 - 0.05, hw * 1.0, hw * 0.55, tone(SP_TIMBER, 0.8), v + 0.05)
    band(mid - 0.05, mid + 0.05, y0, y1 - 0.5, v + 0.06, tone(SP_TIMBER, 0.8))
  }
  // ---- oculus, cross
  { const cy = SP_OCULUS_Y, r = SP_OCULUS_R, ring: V3[] = [], gl: V3[] = []
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ring.push(P(mid + (r + 0.18) * Math.cos(a), 0.08, cy + (r + 0.18) * Math.sin(a))); gl.push(P(mid + r * Math.cos(a), 0.12, cy + r * Math.sin(a))) }
    poly(ring, SP_STONE, hint); poly(gl, SP_GLASS, hint)
    band(mid - 0.07, mid + 0.07, SP_APEX + 0.05, SP_APEX + 1.1, 0.1, SP_STONE); band(mid - 0.32, mid + 0.32, SP_APEX + 0.65, SP_APEX + 0.85, 0.1, SP_STONE)
  }
  // ---- dormers on the side roofs
  for (const uc of SP_WIN_U) {
    const w = SP_DORMER_W, y0 = SP_DORMER_Y
    band(uc - w / 2, uc + w / 2, y0, y0 + SP_DORMER_H, 0.04, SP_STONE)
    band(uc - w / 2 + 0.12, uc + w / 2 - 0.12, y0 + 0.15, y0 + SP_DORMER_H - 0.15, 0.08, SP_GLASS)
    poly([P(uc - w / 2 - 0.1, 0.1, y0 + SP_DORMER_H), P(uc + w / 2 + 0.1, 0.1, y0 + SP_DORMER_H), P(uc, 0.1, y0 + SP_DORMER_H + 0.55)], SP_SLATE, hint)
  }
}

// ───────────── Temple des Batignolles (44 boulevard des Batignolles, Paris 17e; way/75748174) ─────────────
// From Commons photos docs/landmarks/refs/batignolles/ (2026-11-04): a pale-limestone Gothic-Romanesque temple (1860s)
// flush on the boulevard: a gabled nave front with a round-arched portal at its west end and a triple lancet group
// under a great arch, a square tower beside it carrying a belfry, a slate spire and a corbel cornice, and a lower
// two-storey presbytery wing (blue door, arched windows) to the east. The OSM way is a 20.8 x 30 m rectangle
// (u east along the front, v inward) plus a west spur; the ring is passed in its own metres so the fit cannot flip.
// Front = the south edge on the boulevard (outward bearing 163). u runs to the viewer's right on the street.
// ---------------------------------------------------------------------------------------------------------------------
const BG_RING: P2[] = [[-675.2, 2511.2], [-676.0, 2510.9], [-677.2, 2510.5], [-685.4, 2508.0], [-688.5, 2507.0], [-689.1, 2509.0], [-691.2, 2516.4], [-694.5, 2515.4], [-702.9, 2513.0], [-702.2, 2510.3], [-698.9, 2511.2], [-695.1, 2512.3], [-693.0, 2505.6], [-696.7, 2504.4], [-696.1, 2502.7], [-696.4, 2502.8], [-696.7, 2502.3], [-696.2, 2502.0], [-693.7, 2494.0], [-693.8, 2493.6], [-693.3, 2493.4], [-693.1, 2493.8], [-689.6, 2494.6], [-688.4, 2490.9], [-689.0, 2490.7], [-688.8, 2490.1], [-688.2, 2490.3], [-687.0, 2486.5], [-687.6, 2486.2], [-687.5, 2485.6], [-686.7, 2485.8], [-685.7, 2482.2], [-686.3, 2482.0], [-686.1, 2481.2], [-685.5, 2481.3], [-684.2, 2477.0], [-670.0, 2481.4], [-664.3, 2483.1], [-667.4, 2492.8], [-670.3, 2502.3], [-673.3, 2511.8]]
const BG_FA: P2 = [-684.2, 2477.0], BG_FB: P2 = [-664.3, 2483.1]      // the front, viewer's left to right
const BG_STONE: Rgb = [0.80, 0.76, 0.67]
const BG_STONE_D: Rgb = [0.74, 0.68, 0.55]
const BG_SLATE: Rgb = [0.27, 0.28, 0.31]
const BG_DOOR: Rgb = [0.15, 0.20, 0.40]
const BG_GLASS: Rgb = [0.17, 0.20, 0.26]
const BG_IRON: Rgb = [0.12, 0.12, 0.13]
const BG_EAVE = 8.0           // the whole plan, and the wing cornice
const BG_NAVE_U0 = 0.06, BG_NAVE_U1 = 9.6, BG_NAVE_D = 28.0
const BG_NAVE_EAVE = 9.6, BG_NAVE_APEX = 14.6
const BG_TOWER_U0 = 9.6, BG_TOWER_U1 = 14.6, BG_TOWER_D = 5.0
const BG_TOWER_CORN = 19.0, BG_BELFRY_Y0 = 14.6, BG_BELFRY_Y1 = 18.2, BG_SPIRE_TOP = 31.0
const BG_WING_U0 = 14.6, BG_WING_U1 = 20.7, BG_WING_D = 11.0, BG_WING_RISE = 2.6
const BG_PORTAL_U = 3.0, BG_PORTAL_W = 2.4, BG_PORTAL_H = 4.2
const BG_ROSE_U = 4.8, BG_ROSE_Y = 5.9, BG_ROSE_H = 3.6

export function templeBatignolles(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(BG_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(BG_FB[0] - BG_FA[0], BG_FB[1] - BG_FA[1])
  const fu: P2 = [(BG_FB[0] - BG_FA[0]) / L, (BG_FB[1] - BG_FA[1]) / L], fn: P2 = [fu[1], -fu[0]]   // fn: outward over the street
  const EN = (u: number, v: number): P2 => [BG_FA[0] + fu[0] * u + fn[0] * v, BG_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (uc: number, y0: number, w: number, h: number, col: Rgb, v: number): void => {
    const r = w / 2, ys = y0 + h - r, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push(P(uc - r * Math.cos(a), v, ys + r * Math.sin(a))) }
    poly(pts, col, hint)
  }
  const lancet = (uc: number, y0: number, w: number, h: number, v: number, frame = true): void => {
    if (frame) arch(uc, y0 - 0.12, w + 0.4, h + 0.2, BG_STONE_D, v)
    arch(uc, y0, w, h, BG_GLASS, v + 0.05)
  }
  const mid = (BG_NAVE_U0 + BG_NAVE_U1) / 2

  // ---- the whole plan, then the nave under its ridge
  pr(BG_RING, 0, BG_EAVE, BG_STONE, BG_SLATE)
  pr([EN(BG_NAVE_U0, -0.02), EN(BG_NAVE_U1, -0.02), EN(BG_NAVE_U1, -BG_NAVE_D), EN(BG_NAVE_U0, -BG_NAVE_D)], 0, BG_NAVE_EAVE, BG_STONE, null)
  { const y0 = BG_NAVE_EAVE - 0.05, vB = -BG_NAVE_D
    poly([P(BG_NAVE_U0, 0, y0), P(mid, 0, BG_NAVE_APEX), P(mid, vB, BG_NAVE_APEX), P(BG_NAVE_U0, vB, y0)], BG_SLATE, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(BG_NAVE_U1, 0, y0), P(mid, 0, BG_NAVE_APEX), P(mid, vB, BG_NAVE_APEX), P(BG_NAVE_U1, vB, y0)], tone(BG_SLATE, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(BG_NAVE_U0, 0.01, y0), P(BG_NAVE_U1, 0.01, y0), P(mid, 0.01, BG_NAVE_APEX)], BG_STONE, hint)   // front gable
    // corbelled rake bands
    poly([P(BG_NAVE_U0 - 0.08, 0.12, y0 - 0.1), P(mid, 0.12, BG_NAVE_APEX + 0.08), P(mid, 0.12, BG_NAVE_APEX - 0.28), P(BG_NAVE_U0 - 0.08, 0.12, y0 - 0.4)], BG_STONE_D, hint)
    poly([P(BG_NAVE_U1 + 0.08, 0.12, y0 - 0.1), P(mid, 0.12, BG_NAVE_APEX + 0.08), P(mid, 0.12, BG_NAVE_APEX - 0.28), P(BG_NAVE_U1 + 0.08, 0.12, y0 - 0.4)], BG_STONE_D, hint)
    band(mid - 0.06, mid + 0.06, BG_NAVE_APEX, BG_NAVE_APEX + 1.4, 0.1, BG_STONE_D)                           // cross
    band(mid - 0.4, mid + 0.4, BG_NAVE_APEX + 0.75, BG_NAVE_APEX + 0.95, 0.1, BG_STONE_D)
  }
  // ---- the wing: a slate shed rising backward, side cheeks
  { const y0 = BG_EAVE - 0.02, y1 = BG_EAVE + BG_WING_RISE, vB = -BG_WING_D
    poly([P(BG_WING_U0, 0, y0), P(BG_WING_U1, 0, y0), P(BG_WING_U1, vB, y1), P(BG_WING_U0, vB, y1)], BG_SLATE, [fn[0] * 0.5, fn[1] * 0.5, 1])
    poly([P(BG_WING_U1, 0, y0), P(BG_WING_U1, vB, y0), P(BG_WING_U1, vB, y1)], BG_STONE, [fu[0], fu[1], 0])
    poly([P(BG_WING_U0, 0, y0), P(BG_WING_U0, vB, y0), P(BG_WING_U0, vB, y1)], BG_STONE, [-fu[0], -fu[1], 0])
    // dormer on the wing roof
    band(16.9, 18.3, 8.6, 10.0, 0.1, BG_STONE_D); band(17.1, 18.1, 8.8, 9.9, 0.15, BG_GLASS)
    poly([P(16.8, 0.1, 10.0), P(18.4, 0.1, 10.0), P(17.6, 0.1, 10.7)], BG_SLATE, hint)
  }
  // ---- tower: shaft, corbel cornice, belfry louvres, slate spire
  { const u0 = BG_TOWER_U0, u1 = BG_TOWER_U1, d = BG_TOWER_D, uc = (u0 + u1) / 2
    pr([EN(u0, -0.02), EN(u1, -0.02), EN(u1, -d), EN(u0, -d)], 0, BG_TOWER_CORN, BG_STONE, BG_STONE_D)
    band(u0 - 0.25, u1 + 0.25, BG_TOWER_CORN - 0.5, BG_TOWER_CORN + 0.1, 0.18, BG_STONE_D)
    band(u0 - 0.1, u1 + 0.1, BG_EAVE - 0.3, BG_EAVE, 0.08, BG_STONE_D)
    for (const y of [4.4, 11.6]) lancet(uc, y, 0.55, 1.9, 0.02)
    for (const du of [-1.35, 0, 1.35]) lancet(uc + du, BG_BELFRY_Y0, 0.62, BG_BELFRY_Y1 - BG_BELFRY_Y0, 0.02, false)
    const sp = 2.2, y0 = BG_TOWER_CORN + 0.1, tip = P(uc, -d / 2, BG_SPIRE_TOP)
    // corners in order: front-left, front-right, back-right, back-left
    const fl = P(uc - sp, 0.1, y0), fr = P(uc + sp, 0.1, y0), br = P(uc + sp, -d + 0.2, y0), bl = P(uc - sp, -d + 0.2, y0)
    poly([fl, fr, tip], BG_SLATE, [fn[0], fn[1], 0.4]); poly([fr, br, tip], tone(BG_SLATE, 0.9), [fu[0], fu[1], 0.4])
    poly([br, bl, tip], tone(BG_SLATE, 0.85), [-fn[0], -fn[1], 0.4]); poly([bl, fl, tip], tone(BG_SLATE, 0.95), [-fu[0], -fu[1], 0.4])
    band(uc - 0.05, uc + 0.05, BG_SPIRE_TOP, BG_SPIRE_TOP + 1.3, 0, BG_STONE_D)
  }
  // ---- string courses and cornices along the front
  band(0.06, BG_WING_U1, 3.55, 3.75, 0.08, BG_STONE_D)
  band(0.06, BG_WING_U1, BG_EAVE - 0.35, BG_EAVE + 0.02, 0.14, BG_STONE_D)
  // ---- portal: stepped jambs, deep arch, door, tympanum
  { const uc = BG_PORTAL_U, w = BG_PORTAL_W, h = BG_PORTAL_H
    arch(uc, 0, w + 1.5, h + 1.2, BG_STONE_D, 0.12)
    arch(uc, 0, w + 0.7, h + 0.4, tone(BG_STONE, 0.9), 0.2)
    arch(uc, 0, w, h, BG_DOOR, 0.26)
    band(uc - 0.04, uc + 0.04, 0, h - 1.1, 0.3, tone(BG_DOOR, 0.6))
    for (const s of [-1, 1]) band(uc + s * (w / 2 + 0.55) - 0.15, uc + s * (w / 2 + 0.55) + 0.15, 0, 2.3, 0.3, BG_STONE_D)   // shafts
    arch(uc, h - 0.9, w - 0.4, 1.0, BG_GLASS, 0.3)
  }
  // ---- great round arch over three lancets in the gable, oculus above
  { const uc = BG_ROSE_U, y0 = BG_ROSE_Y
    arch(uc, y0 - 0.6, 4.6, BG_ROSE_H + 1.6, BG_STONE_D, 0.1)
    arch(uc, y0 - 0.5, 4.1, BG_ROSE_H + 1.3, tone(BG_STONE, 0.93), 0.16)
    for (const du of [-1.2, 0, 1.2]) lancet(uc + du, y0, 0.8, du === 0 ? BG_ROSE_H : BG_ROSE_H - 0.5, 0.22)
    const ring: V3[] = []
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ring.push(P(mid + 0.28 * Math.cos(a), 0.1, 12.0 + 0.28 * Math.sin(a))) }
    poly(ring, BG_GLASS, hint)
  }
  // ---- presbytery: blue door, ground arches, upper two-light windows
  { band(15.1, 16.3, 0, 2.9, 0.1, BG_STONE_D); arch(15.7, 0, 1.3, 3.4, BG_DOOR, 0.18)
    for (const uc of [17.7, 19.5]) { arch(uc, 0, 1.0, 3.2, BG_STONE_D, 0.1); arch(uc, 0.15, 0.8, 2.9, BG_GLASS, 0.16) }
    for (const uc of [16.6, 19.0]) for (const s of [-1, 1]) { band(uc + s * 0.4 - 0.33, uc + s * 0.4 + 0.33, 4.3, 6.9, 0.05, BG_STONE_D); band(uc + s * 0.4 - 0.25, uc + s * 0.4 + 0.25, 4.45, 6.75, 0.1, BG_GLASS) }
  }
  // ---- small barred window beside the portal
  band(7.1, 8.0, 1.6, 3.1, 0.08, BG_IRON)
}

// ───────────────────────────── Temple du Foyer de l'Âme (way/63648393) ─────────────────────────────
// 7bis rue du Pasteur-Wagner, Paris 11e (1907). Read off Commons (docs/landmarks/refs/foyer-de-lame/, 2026-11-04):
// ext1.jpg (P1150057 rwk) — a pale-buff brick street front with a stone ground storey, a deep portal with a bracketed
// hood over double oak doors, and a great half-round stone archivolt over three windows split by colonnettes;
// verriere.jpg — the hall behind has a flat glass roof, round-arched galleries inside. The temple stands flush on the
// street between apartment houses, so the model is a plain brick box with this front and a glazed roof.
// Front on the rue du Pasteur-Wagner (south-west); the plan is passed in its own metres.
const FA_RING: P2[] = [[2764.2, -496.8], [2744.7, -514.4], [2745.4, -515.2], [2756.4, -527.9], [2765.1, -520.1], [2776.9, -509.5], [2766.4, -499.0]]
const FA_FA: P2 = [2744.7, -514.4], FA_FB: P2 = [2756.4, -527.9]     // the street front, viewer's left to right
const FA_BRICK: Rgb = [0.80, 0.72, 0.56]
const FA_STONE: Rgb = [0.74, 0.70, 0.62]
const FA_STONE_D: Rgb = [0.64, 0.60, 0.52]
const FA_DOOR: Rgb = [0.34, 0.17, 0.09]
const FA_GLASS: Rgb = [0.55, 0.62, 0.68]
const FA_GLASS_D: Rgb = [0.20, 0.23, 0.28]
const FA_ZINC: Rgb = [0.45, 0.47, 0.50]
const FA_H = 12.2                               // front and flank top
const FA_GROUND_H = 4.9                         // stone ground storey
const FA_PORTAL_U = 4.4, FA_PORTAL_W = 2.4, FA_PORTAL_H = 3.5
const FA_ARCH_R = 3.5, FA_ARCH_Y = 7.1          // archivolt radius and spring height
const FA_CORNICE = 0.7                          // stone cornice depth
const FA_WIN_U0 = 10.2, FA_WIN_PITCH = 2.5, FA_WIN_N = 3, FA_WIN_W = 1.2   // windows right of the portal
const FA_ROOF_U0 = 3.0, FA_ROOF_U1 = 14.5, FA_ROOF_V0 = 5.5, FA_ROOF_V1 = 22.0   // glass roof footprint (v behind the front)
const FA_ROOF_CURB = 0.5, FA_ROOF_RISE = 1.6

export function templeFoyerAme(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(FA_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const L = Math.hypot(FA_FB[0] - FA_FA[0], FA_FB[1] - FA_FA[1])
  const fu: P2 = [(FA_FB[0] - FA_FA[0]) / L, (FA_FB[1] - FA_FA[1]) / L], fn: P2 = [fu[1], -fu[0]]   // fn: outward over the street
  const EN = (u: number, v: number): P2 => [FA_FA[0] + fu[0] * u + fn[0] * v, FA_FA[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const hint: V3 = [fn[0], fn[1], 0]
  const band = (u0: number, u1: number, y0: number, y1: number, v: number, col: Rgb): void =>
    poly([P(u0, v, y0), P(u1, v, y0), P(u1, v, y1), P(u0, v, y1)], col, hint)
  const arch = (uc: number, y0: number, w: number, h: number, col: Rgb, v: number): void => {
    const r = w / 2, ys = y0 + h - r, pts: V3[] = [P(uc - r, v, y0), P(uc + r, v, y0)]
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push(P(uc - r * Math.cos(a), v, ys + r * Math.sin(a))) }
    poly(pts, col, hint)
  }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, -v0), EN(u1, -v0), EN(u1, -v1), EN(u0, -v1)]

  // ---- the block, a stone ground storey and cornice on the front
  pr(FA_RING, 0, FA_H, FA_BRICK, FA_ZINC)
  band(0, L, 0, FA_GROUND_H, 0.03, FA_STONE)
  band(0, L, FA_GROUND_H, FA_GROUND_H + 0.35, 0.1, FA_STONE_D)                          // string course
  band(0, L, FA_H - FA_CORNICE, FA_H, 0.14, FA_STONE_D)                                  // cornice
  band(0, L, FA_H - 0.1, FA_H + 0.45, 0.06, FA_STONE)                                    // parapet coping
  // stone pilasters either side of the front
  for (const u of [0, L - 0.9]) pr([EN(u, 0.0), EN(u + 0.9, 0.0), EN(u + 0.9, 0.18), EN(u, 0.18)], 0, FA_GROUND_H, FA_STONE_D, FA_STONE_D)
  // ---- portal: pilastered jambs, hood on brackets, oak doors
  { const uc = FA_PORTAL_U, w = FA_PORTAL_W, h = FA_PORTAL_H
    band(uc - w / 2 - 0.9, uc + w / 2 + 0.9, 0, h + 0.5, 0.1, FA_STONE_D)
    band(uc - w / 2, uc + w / 2, 0, h, 0.2, FA_DOOR)
    band(uc - w / 2 + 0.1, uc + w / 2 - 0.1, h - 0.7, h - 0.15, 0.24, FA_GLASS_D)                        // door transom glass
    band(uc - 0.04, uc + 0.04, 0, h - 0.8, 0.26, tone(FA_DOOR, 0.6))
    for (const s of [-1, 1]) for (const [y0, y1] of [[0.4, 1.4], [1.6, 2.6]]) band(uc + s * (w / 4) - 0.35, uc + s * (w / 4) + 0.35, y0, y1, 0.24, tone(FA_DOOR, 1.25))
    pr([EN(uc - w / 2 - 1.1, -0.0), EN(uc + w / 2 + 1.1, -0.0), EN(uc + w / 2 + 1.1, 0.55), EN(uc - w / 2 - 1.1, 0.55)].map(([e, n]): P2 => [e, n]), h + 0.5, h + 0.8, FA_STONE, FA_STONE)   // the hood slab
    for (const s of [-1, 1]) pr([EN(uc + s * (w / 2 + 0.35) - 0.12, 0.0), EN(uc + s * (w / 2 + 0.35) + 0.12, 0.0), EN(uc + s * (w / 2 + 0.35) + 0.12, 0.3), EN(uc + s * (w / 2 + 0.35) - 0.12, 0.3)], h - 0.1, h + 0.5, FA_STONE_D, FA_STONE_D)   // brackets
  }
  // ---- great half-round archivolt over three windows split by colonnettes
  { const uc = FA_PORTAL_U, r = FA_ARCH_R, ys = FA_ARCH_Y
    arch(uc, ys, 2 * r + 1.0, r + 0.5, FA_STONE_D, 0.08)                                  // outer ring (half disc)
    arch(uc, ys, 2 * r, r, FA_STONE, 0.11)
    arch(uc, ys, 2 * r - 0.8, r - 0.4, FA_BRICK, 0.13)                                    // tympanum recess
    for (const du of [-1.9, 0, 1.9]) { const w = du === 0 ? 1.3 : 1.35
      const x = uc + du, y0 = ys + 0.3, h = du === 0 ? 2.4 : 2.0
      if (du === 0) band(x - w / 2, x + w / 2, y0, y0 + h, 0.15, FA_GLASS)
      else band(x - w / 2, x + w / 2, y0, y0 + 1.6, 0.15, FA_GLASS)
    }
    for (const du of [-0.95, 0.95]) band(uc + du - 0.09, uc + du + 0.09, ys + 0.1, ys + 2.7, 0.18, FA_STONE)   // colonnettes
    band(uc - r - 0.5, uc + r + 0.5, ys - 0.2, ys + 0.1, 0.1, FA_STONE_D)                  // impost course
    band(uc - 0.5, uc + 0.5, ys + r + 0.5, ys + r + 1.2, 0.1, FA_STONE)                    // keystone
  }
  // ---- windows right of the portal: grilled at ground level, brick-framed above
  for (let i = 0; i < FA_WIN_N; i++) {
    const uc = FA_WIN_U0 + i * FA_WIN_PITCH
    band(uc - FA_WIN_W / 2, uc + FA_WIN_W / 2, 1.2, 3.8, 0.1, FA_GLASS_D)
    band(uc - FA_WIN_W / 2 - 0.1, uc + FA_WIN_W / 2 + 0.1, 3.8, 3.95, 0.12, FA_STONE_D)
    band(uc - FA_WIN_W / 2, uc + FA_WIN_W / 2, 6.0, 9.2, 0.07, FA_GLASS_D)
    band(uc - FA_WIN_W / 2 - 0.1, uc + FA_WIN_W / 2 + 0.1, 5.85, 6.0, 0.1, FA_STONE_D)
    band(uc - FA_WIN_W / 2 - 0.1, uc + FA_WIN_W / 2 + 0.1, 9.2, 9.35, 0.1, FA_STONE_D)
  }
  // ---- the glass roof: a curb and a low ridged lantern over the hall
  { const y0 = FA_H + 0.02, y1 = y0 + FA_ROOF_CURB, ym = y1 + FA_ROOF_RISE
    const um = (FA_ROOF_U0 + FA_ROOF_U1) / 2
    pr(rect(FA_ROOF_U0, FA_ROOF_U1, FA_ROOF_V0, FA_ROOF_V1), y0, y1, FA_STONE_D, FA_STONE_D)
    const v0 = -FA_ROOF_V0, v1 = -FA_ROOF_V1
    poly([P(FA_ROOF_U0, v0, y1), P(um, v0, ym), P(um, v1, ym), P(FA_ROOF_U0, v1, y1)], FA_GLASS, [-fu[0] * 0.5, -fu[1] * 0.5, 1])
    poly([P(FA_ROOF_U1, v0, y1), P(um, v0, ym), P(um, v1, ym), P(FA_ROOF_U1, v1, y1)], tone(FA_GLASS, 0.92), [fu[0] * 0.5, fu[1] * 0.5, 1])
    poly([P(FA_ROOF_U0, v0, y1), P(FA_ROOF_U1, v0, y1), P(um, v0, ym)], FA_GLASS_D, hint)
    poly([P(FA_ROOF_U0, v1, y1), P(FA_ROOF_U1, v1, y1), P(um, v1, ym)], FA_GLASS_D, [-hint[0], -hint[1], 0])
    for (let k = 1; k < 5; k++) { const v = v0 + (v1 - v0) * (k / 5)   // glazing bars
      poly([P(FA_ROOF_U0, v, y1 + 0.02), P(um, v, ym + 0.02), P(um, v - 0.06, ym + 0.02), P(FA_ROOF_U0, v - 0.06, y1 + 0.02)], FA_STONE_D, [0, 0, 1])
      poly([P(FA_ROOF_U1, v, y1 + 0.02), P(um, v, ym + 0.02), P(um, v - 0.06, ym + 0.02), P(FA_ROOF_U1, v - 0.06, y1 + 0.02)], FA_STONE_D, [0, 0, 1])
    }
  }
}

// ───────────────────── Église adventiste du septième jour (way/81203918, 81 boulevard Bineau, Neuilly) ─────────────────────
// Gothic Revival church (Commons "81 boulevard Bineau Neuilly-sur-Seine.jpg", docs/landmarks/refs/adventiste-bineau/): a steep
// gabled front on a paved forecourt with a small gabled porch and arched door at its left foot, a tall pointed traceried
// window, a buttressed nave wall running back to a square tower with louvred belfry openings and a slim stone spire.
// Read off the OSM ring: the front faces WSW (the west end steps out in a porch and a narrower front bay); the tower is the
// narrower block at the east end. Plan is passed in game metres (E, N), so the ring fit is an identity.
// Local frame: origin AD_O, u along the nave toward the tower (25° north of east), v to the left of u. The front looks along −u.
const AD_RING: P2[] = [[-3962.07, 2950.15], [-3946.92, 2958.66], [-3936.54, 2964.46], [-3936.95, 2965.2], [-3936.53, 2965.43], [-3936.74, 2965.81], [-3937.2, 2965.53], [-3938.21, 2967.36], [-3936.96, 2968.05], [-3936.65, 2967.49], [-3936.23, 2967.74], [-3936.52, 2968.25], [-3934.28, 2969.51], [-3934.13, 2969.23], [-3933.71, 2969.46], [-3933.87, 2969.76], [-3933.57, 2969.93], [-3933.82, 2970.41], [-3934.1, 2970.23], [-3936.01, 2973.65], [-3937.76, 2976.77], [-3937.44, 2976.94], [-3937.65, 2977.3], [-3937.84, 2977.21], [-3938.02, 2977.51], [-3938.53, 2977.22], [-3938.37, 2976.95], [-3939.66, 2976.24], [-3939.95, 2976.77], [-3940.38, 2976.52], [-3940.11, 2976.04], [-3942.41, 2974.76], [-3942.62, 2975.17], [-3943.15, 2974.88], [-3944.4, 2977.14], [-3943.91, 2977.44], [-3944.21, 2977.95], [-3944.7, 2977.69], [-3944.93, 2978.09], [-3945.55, 2977.74], [-3945.32, 2977.33], [-3947.29, 2976.24], [-3947.5, 2976.62], [-3948.09, 2976.28], [-3947.86, 2975.9], [-3948.29, 2975.66], [-3947.74, 2974.64], [-3950.7, 2972.98], [-3950.91, 2973.33], [-3951.52, 2973.0], [-3951.35, 2972.69], [-3954.36, 2970.99], [-3954.55, 2971.31], [-3955.02, 2971.05], [-3954.83, 2970.7], [-3957.8, 2969.05], [-3957.98, 2969.34], [-3958.49, 2969.05], [-3958.35, 2968.79], [-3961.46, 2967.05], [-3961.63, 2967.32], [-3961.94, 2967.17], [-3962.57, 2968.27], [-3966.2, 2966.22], [-3963.74, 2961.62], [-3965.19, 2960.83], [-3965.36, 2961.13], [-3965.76, 2960.9], [-3965.04, 2959.62], [-3965.34, 2959.45], [-3965.09, 2959.01], [-3964.79, 2959.15], [-3962.79, 2955.57], [-3964.44, 2954.61]]
const AD_O: P2 = [-3950, 2963], AD_ANG = 25 * Math.PI / 180
const AD_STONE: Rgb = [0.80, 0.74, 0.60]
const AD_SLATE: Rgb = [0.30, 0.31, 0.35]
const AD_GLASS: Rgb = [0.12, 0.14, 0.19]
const AD_DOOR: Rgb = [0.20, 0.12, 0.08]
const AD_IRON: Rgb = [0.08, 0.08, 0.09]
const AD_NAVE_U0 = -13.0, AD_NAVE_U1 = 11.0, AD_NAVE_V0 = -4.1, AD_NAVE_V1 = 7.6   // nave plan
const AD_EAVE = 7.4           // nave eaves
const AD_RIDGE = 12.4         // nave ridge
const AD_FAC_U = -14.6, AD_FAC_V0 = -0.9, AD_FAC_V1 = 4.4   // front bay
const AD_FAC_APEX = 14.0      // front gable apex
const AD_FAC_WIN_W = 2.3, AD_FAC_WIN_Y = 3.4, AD_FAC_WIN_H = 7.0
const AD_PORCH_U = -16.2, AD_PORCH_V0 = -6.0, AD_PORCH_V1 = -1.8, AD_PORCH_EAVE = 4.4, AD_PORCH_APEX = 7.0
const AD_DOOR_W = 2.0, AD_DOOR_H = 3.3
const AD_BAY_U1 = -9.4, AD_BAY_V1 = 9.3, AD_BAY_H = 5.8   // wider west bay on the north side
const AD_BUTT_U = [-8.9, -4.85, -0.85, 3.2, 7.2], AD_BUTT_W = 0.6, AD_BUTT_OUT = 0.4
const AD_WIN_U = [-6.9, -2.85, 1.15, 5.2], AD_WIN_Y = 2.4, AD_WIN_W = 1.1, AD_WIN_H = 4.4
const AD_TW_U0 = 11.0, AD_TW_U1 = 16.7, AD_TW_V0 = -0.4, AD_TW_V1 = 7.1   // tower plan
const AD_TW_BODY = 19.5       // tower top (belfry parapet)
const AD_TW_BELFRY = 14.0     // belfry openings spring
const AD_SPIRE = 18.0         // spire rise over the parapet
const AD_SPIRE_IN = 0.9      // spire base inset from the tower walls

export function egliseAdventisteBineau(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(AD_RING, fit), T = tools(out, F)
  const { prism: pr, poly } = T
  const cA = Math.cos(AD_ANG), sA = Math.sin(AD_ANG)
  const fu: P2 = [cA, sA], fn: P2 = [-sA, cA]
  const EN = (u: number, v: number): P2 => [AD_O[0] + fu[0] * u + fn[0] * v, AD_O[1] + fu[1] * u + fn[1] * v]
  const P = (u: number, v: number, y: number): V3 => { const p = EN(u, v); return [p[0], p[1], y] }
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [EN(u0, v0), EN(u1, v0), EN(u1, v1), EN(u0, v1)]
  const stone = AD_STONE
  const W: V3 = [-fu[0], -fu[1], 0], Eh: V3 = [fu[0], fu[1], 0], Nh: V3 = [fn[0], fn[1], 0], Sh: V3 = [-fn[0], -fn[1], 0]
  const vc = (AD_NAVE_V0 + AD_NAVE_V1) / 2
  const hOf = (n: V3, up: number): V3 => [n[0], n[1], up]
  // a flat decoration on the wall at fixed u (facing -u or +u) or fixed v
  const winU = (u: number, v: number, dir: 1 | -1, y0: number, w: number, h: number): void => {
    ogive(T, EN(u, v), [fn[0], fn[1]], [fu[0] * dir, fu[1] * dir], y0 - 0.2, w + 0.5, h + 0.3, tone(stone, 1.12), 0.03)
    ogive(T, EN(u, v), [fn[0], fn[1]], [fu[0] * dir, fu[1] * dir], y0, w, h, AD_GLASS, 0.07)
  }
  const winV = (u: number, v: number, dir: 1 | -1, y0: number, w: number, h: number): void => {
    ogive(T, EN(u, v), [fu[0], fu[1]], [fn[0] * dir, fn[1] * dir], y0 - 0.2, w + 0.5, h + 0.3, tone(stone, 1.12), 0.03)
    ogive(T, EN(u, v), [fu[0], fu[1]], [fn[0] * dir, fn[1] * dir], y0, w, h, AD_GLASS, 0.07)
  }
  const disc = (u: number, v: number, y: number, r: number, plane: 'u' | 'v', dir: 1 | -1, col: Rgb): void => {
    const pts: V3[] = []
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push(plane === 'u' ? P(u, v + Math.cos(a) * r, y + Math.sin(a) * r) : P(u + Math.cos(a) * r, v, y + Math.sin(a) * r)) }
    poly(pts, col, plane === 'u' ? [fu[0] * dir, fu[1] * dir, 0] : [fn[0] * dir, fn[1] * dir, 0])
  }

  // ---- nave: stone walls, steep slate roof, gable ends
  pr(rect(AD_NAVE_U0, AD_NAVE_U1, AD_NAVE_V0, AD_NAVE_V1), 0, AD_EAVE, tone(stone, 0.96), AD_SLATE, 1.0, 0.05)
  poly([P(AD_NAVE_U0, AD_NAVE_V0, AD_EAVE), P(AD_NAVE_U1, AD_NAVE_V0, AD_EAVE), P(AD_NAVE_U1, vc, AD_RIDGE), P(AD_NAVE_U0, vc, AD_RIDGE)], AD_SLATE, hOf(Sh, 1))
  poly([P(AD_NAVE_U1, AD_NAVE_V1, AD_EAVE), P(AD_NAVE_U0, AD_NAVE_V1, AD_EAVE), P(AD_NAVE_U0, vc, AD_RIDGE), P(AD_NAVE_U1, vc, AD_RIDGE)], tone(AD_SLATE, 0.92), hOf(Nh, 1))
  poly([P(AD_NAVE_U0, AD_NAVE_V0, AD_EAVE), P(AD_NAVE_U0, vc, AD_RIDGE), P(AD_NAVE_U0, AD_NAVE_V1, AD_EAVE)], tone(stone, 0.94), W)   // west gable wall
  pr(rect(AD_NAVE_U0, AD_NAVE_U1, vc - 0.12, vc + 0.12), AD_RIDGE, AD_RIDGE + 0.22, tone(stone, 1.05), tone(stone, 1.05))        // ridge cap
  pr(rect(AD_NAVE_U0 - 0.1, AD_NAVE_U1, AD_NAVE_V0 - 0.08, AD_NAVE_V1 + 0.08), AD_EAVE - 0.35, AD_EAVE, tone(stone, 1.14), null)   // eaves cornice
  for (const u of AD_BUTT_U) {
    pr(rect(u - AD_BUTT_W / 2, u + AD_BUTT_W / 2, AD_NAVE_V1, AD_NAVE_V1 + AD_BUTT_OUT), 0, AD_EAVE + 0.5, tone(stone, 1.08), tone(stone, 1.0))
    pr(rect(u - AD_BUTT_W / 2, u + AD_BUTT_W / 2, AD_NAVE_V0 - AD_BUTT_OUT, AD_NAVE_V0), 0, AD_EAVE + 0.5, tone(stone, 1.08), tone(stone, 1.0))
  }
  for (const u of AD_WIN_U) {
    winV(u, AD_NAVE_V1 + 0.03, 1, AD_WIN_Y, AD_WIN_W, AD_WIN_H)
    winV(u, AD_NAVE_V0 - 0.03, -1, AD_WIN_Y, AD_WIN_W, AD_WIN_H)
  }
  { // plinth band and string course both sides
    for (const [v, dir] of [[AD_NAVE_V1 + 0.04, 1], [AD_NAVE_V0 - 0.04, -1]] as [number, number][]) {
      poly([P(AD_NAVE_U0, v, 0), P(AD_NAVE_U1, v, 0), P(AD_NAVE_U1, v, 0.9), P(AD_NAVE_U0, v, 0.9)], tone(stone, 0.8), [fn[0] * dir, fn[1] * dir, 0])
      poly([P(AD_NAVE_U0, v, AD_WIN_Y + AD_WIN_H * 0.45), P(AD_NAVE_U1, v, AD_WIN_Y + AD_WIN_H * 0.45), P(AD_NAVE_U1, v, AD_WIN_Y + AD_WIN_H * 0.45 + 0.1), P(AD_NAVE_U0, v, AD_WIN_Y + AD_WIN_H * 0.45 + 0.1)], tone(stone, 1.12), [fn[0] * dir, fn[1] * dir, 0])
    }
  }

  // ---- wider west bay on the north side (low, slate)
  pr(rect(AD_NAVE_U0, AD_BAY_U1, AD_NAVE_V1, AD_BAY_V1), 0, AD_BAY_H, tone(stone, 0.98), AD_SLATE, 1.0, 0.05)
  pr(rect(AD_NAVE_U0, AD_BAY_U1, AD_NAVE_V1, AD_BAY_V1), AD_BAY_H - 0.3, AD_BAY_H, tone(stone, 1.14), null)
  winV((AD_NAVE_U0 + AD_BAY_U1) / 2, AD_BAY_V1 + 0.03, 1, 1.8, 1.0, 3.0)

  // ---- front bay: steep gable, tall pointed window, rake bands, finial
  { const u = AD_FAC_U, v0 = AD_FAC_V0, v1 = AD_FAC_V1, vm = (v0 + v1) / 2
    pr(rect(u, AD_NAVE_U0 + 0.2, v0, v1), 0, AD_EAVE, tone(stone, 1.02), AD_SLATE, 1.0, 0.05)
    poly([P(u, v0, AD_EAVE), P(u, vm, AD_FAC_APEX), P(u, v1, AD_EAVE)], tone(stone, 1.0), W)
    const tail = AD_NAVE_U0 + 1.5, yT = AD_RIDGE - 0.3
    poly([P(u - 0.05, v0, AD_EAVE), P(tail, v0, AD_EAVE), P(tail, vm, yT), P(u - 0.05, vm, AD_FAC_APEX)], AD_SLATE, hOf(Sh, 1))
    poly([P(tail, v1, AD_EAVE), P(u - 0.05, v1, AD_EAVE), P(u - 0.05, vm, AD_FAC_APEX), P(tail, vm, yT)], tone(AD_SLATE, 0.92), hOf(Nh, 1))
    for (const s of [-1, 1]) {   // moulded rake bands along the gable
      const ve = s < 0 ? v0 : v1
      poly([P(u - 0.1, ve, AD_EAVE - 0.1), P(u - 0.1, vm, AD_FAC_APEX - 0.15), P(u - 0.1, vm, AD_FAC_APEX + 0.25), P(u - 0.1, ve + s * 0.25, AD_EAVE + 0.15)], tone(stone, 1.2), W)
    }
    gothicWindow(T, EN(u - 0.02, vm) as P2, fn, [-fu[0], -fu[1]], AD_FAC_WIN_Y, AD_FAC_WIN_W, AD_FAC_WIN_H, 2, stone, AD_GLASS)
    disc(u - 0.04, vm, AD_FAC_WIN_Y + AD_FAC_WIN_H + 1.3, 0.55, 'u', -1, tone(stone, 1.2)); disc(u - 0.08, vm, AD_FAC_WIN_Y + AD_FAC_WIN_H + 1.3, 0.38, 'u', -1, AD_GLASS)
    poly([P(u - 0.06, v0, 0), P(u - 0.06, v1, 0), P(u - 0.06, v1, 0.9), P(u - 0.06, v0, 0.9)], tone(stone, 0.8), W)
    // buttress on the right corner, stepped
    pr(rect(u - 0.35, u, v1 - 0.9, v1 + 0.0), 0, AD_EAVE + 0.6, tone(stone, 1.1), tone(stone, 1.0))
    pr(rect(u - 0.45, u, v0, v0 + 0.8), 0, AD_EAVE + 0.4, tone(stone, 1.1), tone(stone, 1.0))
    // finial and cross on the apex
    const c = EN(u + 0.3, vm)
    pr(rectPoly(c, 0.3, 4), AD_FAC_APEX - 0.1, AD_FAC_APEX + 0.9, tone(stone, 1.1), tone(stone, 1.0))
    pr(rectPoly(c, 0.06, 4), AD_FAC_APEX + 0.9, AD_FAC_APEX + 2.1, AD_IRON, AD_IRON)
    pr(rectPoly([c[0], c[1]], 0.05, 4), AD_FAC_APEX + 1.5, AD_FAC_APEX + 1.6, AD_IRON, AD_IRON)
  }

  // ---- porch at the left foot: gabled, arched door in its front
  { const u = AD_PORCH_U, v0 = AD_PORCH_V0, v1 = AD_PORCH_V1, vm = (v0 + v1) / 2, u1 = AD_FAC_U + 0.3
    pr(rect(u, u1, v0, v1), 0, AD_PORCH_EAVE, tone(stone, 1.0), AD_SLATE, 1.0, 0.05)
    poly([P(u, v0, AD_PORCH_EAVE), P(u, vm, AD_PORCH_APEX), P(u, v1, AD_PORCH_EAVE)], tone(stone, 1.02), W)
    poly([P(u - 0.05, v0, AD_PORCH_EAVE), P(u1, v0, AD_PORCH_EAVE), P(u1, vm, AD_PORCH_APEX - 0.3), P(u - 0.05, vm, AD_PORCH_APEX)], AD_SLATE, hOf(Sh, 1))
    poly([P(u1, v1, AD_PORCH_EAVE), P(u - 0.05, v1, AD_PORCH_EAVE), P(u - 0.05, vm, AD_PORCH_APEX), P(u1, vm, AD_PORCH_APEX - 0.3)], tone(AD_SLATE, 0.92), hOf(Nh, 1))
    for (const s of [-1, 1]) {
      const ve = s < 0 ? v0 : v1
      poly([P(u - 0.08, ve, AD_PORCH_EAVE - 0.05), P(u - 0.08, vm, AD_PORCH_APEX - 0.1), P(u - 0.08, vm, AD_PORCH_APEX + 0.22), P(u - 0.08, ve - s * -0.2, AD_PORCH_EAVE + 0.15)], tone(stone, 1.2), W)
    }
    const arch = (w: number, h: number, col: Rgb, off: number, y0: number): void => ogive(T, EN(u, vm), fn, [-fu[0], -fu[1]], y0, w, h, col, off)
    arch(AD_DOOR_W + 0.9, AD_DOOR_H + 0.6, tone(stone, 1.2), 0.03, 0.0)
    arch(AD_DOOR_W + 0.35, AD_DOOR_H + 0.2, tone(stone, 0.88), 0.06, 0.0)
    arch(AD_DOOR_W, AD_DOOR_H, AD_DOOR, 0.1, 0.0)
    disc(u - 0.04, vm, AD_PORCH_EAVE + 0.6, 0.35, 'u', -1, tone(stone, 1.2)); disc(u - 0.08, vm, AD_PORCH_EAVE + 0.6, 0.22, 'u', -1, AD_GLASS)
    for (const s of [-1, 1]) pr(rect(u - 0.35, u + 0.1, vm + s * 1.55 - 0.2, vm + s * 1.55 + 0.2), 0, AD_PORCH_EAVE + 0.2, tone(stone, 1.1), tone(stone, 1.0))   // corner buttresses
    winV((u + u1) / 2, v1 + 0.02, 1, 1.2, 0.7, 2.0)
  }

  // ---- tower: square shaft, string courses, louvred belfry, corner buttresses, pinnacles, slim spire
  { const u0 = AD_TW_U0, u1 = AD_TW_U1, v0 = AD_TW_V0, v1 = AD_TW_V1, uc = (u0 + u1) / 2, vm = (v0 + v1) / 2
    pr(rect(u0, u1, v0, v1), 0, AD_TW_BODY, tone(stone, 1.0), tone(stone, 0.86), 1.0, 0.05)
    pr(rect(u0 - 0.05, u1 + 0.05, v0 - 0.05, v1 + 0.05), AD_TW_BODY - 0.5, AD_TW_BODY, tone(stone, 1.15), null)
    for (const y of [4.2, 9.5, AD_TW_BELFRY - 0.7]) pr(rect(u0 - 0.06, u1 + 0.06, v0 - 0.06, v1 + 0.06), y, y + 0.14, tone(stone, 1.15), tone(stone, 1.1))
    for (const [cu, cv] of [[u0, v0], [u1, v0], [u0, v1], [u1, v1]] as P2[]) {   // corner buttresses: two steps
      const su = cu === u0 ? -1 : 1, sv = cv === v0 ? -1 : 1
      pr(rect(Math.min(cu, cu + su * 0.5), Math.max(cu, cu + su * 0.5), Math.min(cv, cv + sv * 0.5), Math.max(cv, cv + sv * 0.5)), 0, AD_TW_BELFRY - 0.7, tone(stone, 1.08), tone(stone, 1.0))
      pr(rect(Math.min(cu, cu + su * 0.3), Math.max(cu, cu + su * 0.3), Math.min(cv, cv + sv * 0.3), Math.max(cv, cv + sv * 0.3)), AD_TW_BELFRY - 0.7, AD_TW_BODY - 0.5, tone(stone, 1.08), tone(stone, 1.0))
    }
    // faces: east (u1), north (v1), south (v0). A lancet low down, a clock disc, paired belfry openings.
    winU(u1 + 0.02, vm, 1, 5.0, 0.9, 3.4)
    winV(uc, v1 + 0.02, 1, 5.0, 0.9, 3.4); winV(uc, v0 - 0.02, -1, 5.0, 0.9, 3.4)
    for (const [dir, face] of [[1, 'u'], [1, 'vn'], [-1, 'vs']] as [1 | -1, string][]) {
      for (const k of [-1, 1]) {
        const off = k * 1.15
        if (face === 'u') winU(u1 + 0.02, vm + off * 1.1, dir, AD_TW_BELFRY, 1.05, 4.2)
        else winV(uc + off, dir === 1 ? v1 + 0.02 : v0 - 0.02, dir, AD_TW_BELFRY, 1.05, 4.2)
      }
    }
    disc(u1 + 0.03, vm, 10.9, 0.62, 'u', 1, tone(stone, 1.2)); disc(u1 + 0.06, vm, 10.9, 0.46, 'u', 1, [0.9, 0.88, 0.8])
    disc(uc, v1 + 0.03, 10.9, 0.62, 'v', 1, tone(stone, 1.2)); disc(uc, v1 + 0.06, 10.9, 0.46, 'v', 1, [0.9, 0.88, 0.8])
    // pinnacles at the four corners of the parapet
    for (const [cu, cv] of [[u0 + 0.35, v0 + 0.35], [u1 - 0.35, v0 + 0.35], [u0 + 0.35, v1 - 0.35], [u1 - 0.35, v1 - 0.35]] as P2[]) {
      const c = EN(cu, cv), top = AD_TW_BODY + 1.4
      pr(rectPoly(c, 0.32, 4), AD_TW_BODY, top, tone(stone, 1.1), tone(stone, 1.0))
      const q = rectPoly(c, 0.34, 4)
      for (let i = 0; i < 4; i++) poly([[q[i][0], q[i][1], top], [q[(i + 1) % 4][0], q[(i + 1) % 4][1], top], [c[0], c[1], top + 1.1]], tone(stone, 1.05), [q[i][0] - c[0], q[i][1] - c[1], 0.6])
    }
    // spire: four-sided, with a ring of small gablets, cross on top
    const su0 = u0 + AD_SPIRE_IN, su1 = u1 - AD_SPIRE_IN, sv0 = v0 + AD_SPIRE_IN, sv1 = v1 - AD_SPIRE_IN, y0 = AD_TW_BODY, ya = y0 + AD_SPIRE
    pr(rect(su0, su1, sv0, sv1), y0, y0 + 0.5, tone(stone, 1.05), null)
    const ap = P(uc, vm, ya), a = P(su0, sv0, y0 + 0.5), b = P(su1, sv0, y0 + 0.5), c2 = P(su1, sv1, y0 + 0.5), d = P(su0, sv1, y0 + 0.5)
    const slate = [AD_SLATE, tone(AD_SLATE, 0.9), tone(AD_SLATE, 1.1), tone(AD_SLATE, 0.95)]
    const sides: [V3, V3, V3][] = [[a, b, Sh], [b, c2, Eh], [c2, d, Nh], [d, a, W]]
    sides.forEach(([p, q, h], i) => poly([p, q, ap], tone(stone, 0.9 + i * 0.03), hOf(h, 0.7)))
    void slate
    for (const [gu, gv, h] of [[uc, v0 + 0.55, Sh], [uc, v1 - 0.55, Nh], [u1 - 0.55, vm, Eh]] as [number, number, V3][]) {   // gablets low on the spire
      const w = 0.9
      const tu = h[0] !== 0 || h[1] !== 0 ? (h === Eh ? 0 : 1) : 1
      const pA = tu === 1 ? P(gu - w / 2, gv, y0 + 0.5) : P(gu, gv - w / 2, y0 + 0.5), pB = tu === 1 ? P(gu + w / 2, gv, y0 + 0.5) : P(gu, gv + w / 2, y0 + 0.5)
      const pT = P(gu, gv, y0 + 3.4)
      poly([pA, pB, pT], tone(stone, 1.15), h)
    }
    const top = EN(uc, vm)
    pr(rectPoly(top, 0.06, 4), ya, ya + 1.5, AD_IRON, AD_IRON)
    pr(rectPoly([top[0], top[1]], 0.05, 4), ya + 0.9, ya + 1.0, AD_IRON, AD_IRON)
  }
}
