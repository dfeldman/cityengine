import type { MeshBuilder } from '../../../buildings.ts'
import { strut, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, mansard, palette, rectOn } from './common.ts'
import { EMIT, lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 205926201's box turned 15° off the meridian (local −z faces bearing 165, the boulevard) */
const HX = 4.5
const HZ = 6.2
const NEON = hex('#e0261f')
const SIGN_RED = hex('#b62a2e')
const WHITE: Rgb = [0.95, 0.95, 0.93]

/**
 * L'Olympia (Bruno Coquatrix's music hall since 1954; the front moved with the 1997 rebuilding, to the same pattern), 28
 * Boulevard des Capucines. A front only 8 m wide in a row of stone houses, and all of it sign. A rider sees, from the
 * ground up:
 *
 * - the black mouth of the foyer, wide open, the web address on its lintel in red;
 * - the great SCREEN of white horizontal bars, two storeys high, the bill hanging on it in red neon: MUSIC-HALL at the
 *   top and the name of the night under it;
 * - over that the CANOPY, a long red box tipped out over the pavement on its ribbed soffit, OLYMPIA across it in fat
 *   white letters and BRUNO COQUATRIX under them;
 * - the house's stone upper floors above, and its slates.
 *
 * Footprint is OSM's (way 205926201; the hall itself runs back behind the boulevard's houses and no rider sees it). Heights
 * are read off photographs from the pavement (Commons, 2010–2024), scaled on the doors. The bill's words change nightly, so
 * these say only CE SOIR; the real letters are a tall thin neon face.
 */
export function olympia(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e0d6c0', '#50575c')
  const z = -6.2
  block(out, -HX, HX, z, HZ, 0, 20, p.stone)
  // ---- the foyer: black between stone piers, the warm light of the lobby behind it
  rectOn(out, '-z', z, -3.7, 3.7, 0, 4.3, p.dark, 0.06)
  litOn(out, '-z', z, -3.1, 3.1, 2.8, 3.5, hex('#c98f4e'), 0.09)
  rectOn(out, '-z', z, -3.1, 3.1, 0, 2.3, hex('#3d3029'), 0.08)
  for (const x of [-1.6, 0, 1.6]) rectOn(out, '-z', z, x - 0.04, x + 0.04, 0, 2.3, p.dark, 0.1)
  block(out, -3.9, 3.9, z - 0.25, z, 4.3, 5.0, hex('#1d1c1e'))
  lettersOn(out, '-z', z - 0.25, 0, 4.47, 'WWW.OLYMPIAHALL.COM', { h: 0.3, c: NEON, wide: 0.56, th: 0.05, gap: 0.05, tag: EMIT, d: 0.02 })
  // ---- the screen: the pale wall, the white bars standing off it, the bill in red neon on them
  const y0 = 5.0
  const y1 = 12.4
  rectOn(out, '-z', z, -3.8, 3.8, y0, y1, hex('#d6d1c6'), 0.04)
  for (let y = y0 + 0.2; y < y1; y += 0.52) strut(out, [-4, y, z - 0.45], [4, y, z - 0.45], 0.06, 0.07, WHITE, FIXED, false)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const x = s * (3.05 + k * 0.28)
      block(out, x - 0.06, x + 0.06, z - 0.6, z, y0, y1, WHITE)
    }
  }
  const d = 0.55
  lettersOn(out, '-z', z, 0, 11.3, 'MUSIC - HALL', { h: 0.62, c: NEON, wide: 0.56, th: 0.1, gap: 0.09, tag: EMIT, d })
  lettersOn(out, '-z', z, 0, 10.4, 'CE SOIR A 20 H 30', { h: 0.36, c: NEON, wide: 0.56, th: 0.06, gap: 0.05, tag: EMIT, d })
  lettersOn(out, '-z', z, 0, 7.9, 'CONCERT', { h: 1.45, c: NEON, wide: 0.5, th: 0.19, gap: 0.12, tag: EMIT, d })
  lettersOn(out, '-z', z, 0, 6.5, 'ET AUSSI', { h: 0.5, c: NEON, wide: 0.56, th: 0.08, gap: 0.1, tag: EMIT, d })
  lettersOn(out, '-z', z, 0, 5.5, 'COMPLET', { h: 0.62, c: NEON, wide: 0.56, th: 0.1, gap: 0.1, tag: EMIT, d })
  // ---- the canopy: the ribbed soffit rising from the head of the screen to the red box's lower edge
  const yS = 12.4
  const zS = z - 0.1
  const yF = 13.7
  const zF = z - 2.7
  const W = 5.1
  const soff = hex('#d8d0be')
  const nS = Math.hypot(yF - yS, zS - zF)
  out.quad([[-W, yS, zS], [W, yS, zS], [W, yF, zF], [-W, yF, zF]], [0, -(zS - zF) / nS, -(yF - yS) / nS], [[0, 0], [1, 0], [1, 1], [0, 1]], soff, EMIT)
  for (let x = -W + 0.25; x < W; x += 0.5) strut(out, [x, yS - 0.03, zS], [x, yF - 0.03, zF], 0.08, 0.05, shade(soff, 0.55), FIXED, false)
  // the box, leaning back a little as it rises
  const yT = 15.5
  const zT = zF + 0.5
  const n = Math.hypot(yT - yF, zT - zF)
  const front: [number, number, number][] = [[-W, yF, zF], [W, yF, zF], [W, yT, zT], [-W, yT, zT]]
  out.quad(front, [0, (zT - zF) / n, -(yT - yF) / n], [[0, 0], [1, 0], [1, 1], [0, 1]], SIGN_RED, FIXED)
  // its top, back to the house, and its ends
  out.quad([[-W, yT, zT], [W, yT, zT], [W, yT - 0.8, z], [-W, yT - 0.8, z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(SIGN_RED, 0.8), FIXED)
  for (const s of [-1, 1]) {
    out.quad([[s * W, yS, zS], [s * W, yF, zF], [s * W, yT, zT], [s * W, yT - 0.8, z]], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(SIGN_RED, 0.72), FIXED)
  }
  // the letters on the tipped face: drawn on a plane lifted to its slope
  tipped(out, 'OLYMPIA', 14.25, 1.0, zF, yF, zT, yT, { c: WHITE, wide: 0.92, th: 0.24, gap: 0.16 })
  tipped(out, 'BRUNO COQUATRIX', 13.86, 0.26, zF, yF, zT, yT, { c: WHITE, wide: 0.72, th: 0.06, gap: 0.09 })
  // ---- the house above: two storeys and the attic of stone, three bays, the slates
  for (const x of [-2.7, 0, 2.7]) {
    for (const [y, h] of [[16.2, 1.7]] as const) {
      rectOn(out, '-z', z, x - 0.72, x + 0.72, y - 0.14, y + h + 0.14, p.trim, 0.05)
      rectOn(out, '-z', z, x - 0.55, x + 0.55, y, y + h, p.glass, 0.08)
      rectOn(out, '-z', z, x - 0.72, x + 0.72, y + 0.45, y + 0.52, p.dark, 0.14)
    }
  }
  block(out, -HX - 0.05, HX + 0.05, z - 0.3, z + 0.3, 19.3, 20, p.trim)
  mansard(out, -HX, HX, z, HZ, 20, 2.6, 0.8, p.slate, 1.2)
}

/** A line of letters on the canopy's tipped face, its feet at height y. */
function tipped(out: MeshBuilder, text: string, y: number, h: number, zA: number, yA: number, zB: number, yB: number, o: { c: Rgb; wide: number; th: number; gap: number }): void {
  const q = new (out.constructor as new () => MeshBuilder)()
  lettersOn(q, '-z', 0, 0, 0, text, { h, ...o, tag: EMIT, d: 0 })
  const slope = (zB - zA) / (yB - yA)
  for (let i = 0; i < q.positions.length; i += 3) {
    const yy = y + q.positions[i + 1]
    out.positions.push(q.positions[i], yy, zA + (yy - yA) * slope - 0.03)
    out.normals.push(q.normals[i], 0.27, q.normals[i + 2])
  }
  const base = out.positions.length / 3 - q.positions.length / 3
  for (const u of q.uvs) out.uvs.push(u)
  for (const c of q.colors) out.colors.push(c)
  for (const i of q.indices) out.indices.push(base + i)
}
