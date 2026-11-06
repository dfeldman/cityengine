/**
 * Office slab beside Aquaboulevard (OSM way/44281432, office, 7 levels, ~110 m square block round a garden court on the
 * Rue du Colonel Pierre Avia). Owner photo: blue-grey glass with white vertical fins. Distance fidelity: a glass body, white fins
 * round the outside, a dark glazed band per floor, a green court on the roof. Plan in metres east/north of 48.831323, 2.275402.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const PLAN: P2[] = [[144,155.9],[146.7,154.2],[177.4,134.8],[204.4,117.7],[152.8,38.9],[140.4,46.8],[144,52.3],[108,75.8],[104.7,70.8],[92.8,78.6]]

export const AQUA_OFFICE = {
  FLOOR: 3.7, LEVELS: 7, GLASS: '#6d8396', BAND: '#3e5568', FIN: '#eef1f2', ROOF: '#8f9395', COURT: '#5f7f55', COURT_K: 0.5,
  FIN_STEP: 3.1, FIN_W: 0.22, FIN_OUT: 0.45, BAND_H: 1.8, BAND_LO: 0.9, ROOF_BOX: '#7b8083', ROOF_BOX_H: 2.5,
}

export const aquaOffice = (out: MeshBuilder, fit: Fit): void => {
  const K = AQUA_OFFICE, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(PLAN), H = K.FLOOR * K.LEVELS
  T.prism(r, 0, H, hex(K.GLASS), hex(K.ROOF), 8, 0.03)
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 3) continue
    const ex = (b[0] - a[0]) / l, ey = (b[1] - a[1]) / l, nx = ey, ny = -ex
    for (let y = K.BAND_LO; y + K.BAND_H < H; y += K.FLOOR) T.wall([a[0] + nx * 0.1, a[1] + ny * 0.1], [b[0] + nx * 0.1, b[1] + ny * 0.1], y, y + K.BAND_H, hex(K.BAND))
    for (let d = K.FIN_STEP / 2; d < l; d += K.FIN_STEP) {
      const px = a[0] + ex * d + nx * K.FIN_OUT / 2, py = a[1] + ey * d + ny * K.FIN_OUT / 2
      T.beam([px, py, 0.5], [px, py, H], K.FIN_W / 2, hex(K.FIN), K.FIN_OUT / 2)
    }
  }
  const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length
  T.cap(r.map(([e, n]) => [cx + (e - cx) * K.COURT_K, cy + (n - cy) * K.COURT_K] as P2), H + 0.08, hex(K.COURT))
  T.prism([[cx - 6, cy - 5], [cx + 6, cy - 5], [cx + 6, cy + 5], [cx - 6, cy + 5]], H + 0.1, H + 0.1 + K.ROOF_BOX_H, hex(K.ROOF_BOX), hex(K.ROOF))
}
