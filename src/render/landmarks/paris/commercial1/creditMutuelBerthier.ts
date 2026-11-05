/**
 * Crédit Mutuel offices (Odile Decq, 2019), 46-52 boulevard Berthier, Paris 17e. OSM way/881420349, 10 levels, ~34 m.
 * No facade photo found (Commons geosearch and web gave nothing of it); styled as Decq's usual black glass: a recessed
 * dark plinth, a black body with proud black floor bands and vertical fins, upper floors cantilevered out over the
 * plinth, a roof sloping down toward the boulevard, and her signature red at the entrance. Plan in metres east/north of
 * 48.89272, 2.30817.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tone, tools, ccwEN, type P2 } from '../museums/enframe.ts'

const RING: P2[] = [[-16.4, 44.6], [7.5, 10.1], [29.8, -23.9], [23.8, -26.2], [11.0, -39.0], [-2.1, -22.4], [4.6, -18.1], [-30.6, 35.5]]

export const CREDIT_MUTUEL_BERTHIER = {
  H: 34, LOW_H: 34, // flat roof (the sloped fan needs a convex plan; this one has a notch)
  PLINTH: 7, PLINTH_IN: 1.5, // two recessed lobby floors
  FLOOR: 3.3, BAND: 0.5, BAND_OUT: 0.5, CANTI: 0.8, // floor bands; the body overhangs the OSM line by CANTI
  FIN_STEP: 3.2, FIN_OUT: 1.0, FIN_W: 0.25, // vertical black fins on long faces
  RED_H: 4.5, RED_W: 6, // red entrance box at the south-east end
}

// a closed anticlockwise ring pushed out by d (in for d < 0), mitred
const grow = (r: P2[], d: number): P2[] => r.map((p, i) => {
  const a = r[(i + r.length - 1) % r.length], b = r[(i + 1) % r.length]
  const n1 = norm([p[1] - a[1], a[0] - p[0]]), n2 = norm([b[1] - p[1], p[0] - b[0]])
  const m = norm([n1[0] + n2[0], n1[1] + n2[1]]), c = Math.max(0.5, m[0] * n1[0] + m[1] * n1[1])
  return [p[0] + m[0] * d / c, p[1] + m[1] * d / c] as P2
})
const norm = (v: P2): P2 => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l] }

export const creditMutuelBerthier = (out: MeshBuilder, fit: Fit): void => {
  const K = CREDIT_MUTUEL_BERTHIER, T = tools(out, registerRing(RING, fit))
  const black = hex('#1b1d20'), glass = hex('#262e35'), lobby = hex('#3a4650'), roofC = hex('#4a4a4a'), red = hex('#b3191f')
  const ring = ccwEN(RING)
  const body = grow(ring, K.CANTI)
  const plinth = grow(ring, -K.PLINTH_IN)
  // roof height along the long (NW→SE) axis
  const n0 = -39, n1 = 44.6
  const roofH = (_e: number, n: number): number => K.LOW_H + (K.H - K.LOW_H) * (n - n0) / (n1 - n0)
  T.prism(plinth, 0, K.PLINTH, lobby, null)
  T.prism(body, K.PLINTH, K.H, glass, roofC)
  T.cap(body, K.PLINTH, tone(black, 0.8)) // soffit-ish underside line seen from the street
  for (let i = 0; i < body.length; i++) {
    const a = body[i], b = body[(i + 1) % body.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 1) continue
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, nx = uy, ny = -ux
    const o = (d: number, s: number): P2 => [a[0] + ux * s + nx * d, a[1] + uy * s + ny * d]
    const top = Math.min(roofH(a[0], a[1]), roofH(b[0], b[1]))
    for (let y = K.PLINTH; y < top - 1; y += K.FLOOR) T.wall(o(K.BAND_OUT, 0), o(K.BAND_OUT, l), y, y + K.BAND, black)
    if (l < 15) continue
    for (let s = K.FIN_STEP; s < l - 1; s += K.FIN_STEP) {
      T.wall(o(K.FIN_OUT, s), o(0, s), K.PLINTH, top, black)
      T.wall(o(0, s + K.FIN_W), o(K.FIN_OUT, s + K.FIN_W), K.PLINTH, top, black)
    }
  }
  // red entrance box at the south-east tip
  const tip = plinth.reduce((m, p) => (p[1] < m[1] ? p : m))
  T.prism([[tip[0] - K.RED_W / 2, tip[1] + 1], [tip[0] + K.RED_W / 2, tip[1] + 1], [tip[0] + K.RED_W / 2, tip[1] + 1 + K.RED_W], [tip[0] - K.RED_W / 2, tip[1] + 1 + K.RED_W]], 0, K.RED_H, red, red)
}
