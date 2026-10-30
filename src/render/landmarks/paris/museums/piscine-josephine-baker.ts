import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

const FIXED = 0

/**
 * La Piscine Joséphine-Baker (Robert de Busni, 2006), a swimming pool on a barge moored on the Seine at the Quai
 * François-Mauriac, under the BnF's towers. A long dark hull with a long clear shed on it, and a roof that slides away in
 * summer:
 *
 * - from the QUAI and the Passerelle Simone-de-Beauvoir (local −z is the river side, +z the bank): the dark blue-grey hull,
 *   the white rail of the deck round it, the long glazed hall in its slim white steel frame;
 * - on the roof: the two long pitches of glass, one half slid back over the other, as it is on a summer's day;
 * - at one end the sun deck and its timber, at the other the changing rooms' grey box and the gangway.
 *
 * OSM's way 119943935: 90.6 × 21.8 m. No height tagged; 9 m to the eaves and 11 to the ridge are from memory. The hull is
 * drawn from the model's base, because the base is the river bed: what shows above the water depends on the bake's Seine
 * level, and that is not checked here.
 */
export function piscineJosephineBaker(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx
  const hz = fit.hz
  const hull = hex('#2f3a45')
  const deckC = hex('#a58a68')
  const steel = hex('#e7e8e3')
  const glass: Rgb = [0.45, 0.58, 0.65]
  const water = hex('#3f9ec1')
  const deck = 4.2
  // ---- the hull and its waterline stripe, the deck's rail
  block(out, -hx, hx, -hz, hz, 0, deck, hull)
  block(out, -hx - 0.03, hx + 0.03, -hz - 0.03, hz + 0.03, deck - 0.5, deck - 0.3, steel)
  block(out, -hx, hx, -hz, hz, deck, deck + 0.1, deckC)
  const rail = (x0: number, x1: number, z0: number, z1: number): void => block(out, x0, x1, z0, z1, deck + 1.05, deck + 1.13, steel)
  rail(-hx, hx, -hz, -hz + 0.08); rail(-hx, hx, hz - 0.08, hz); rail(-hx, -hx + 0.08, -hz, hz); rail(hx - 0.08, hx, -hz, hz)
  for (let x = -hx; x <= hx; x += 3) {
    for (const s of [-1, 1]) block(out, x - 0.04, x + 0.04, s * (hz - 0.04) - 0.04, s * (hz - 0.04) + 0.04, deck, deck + 1.1, steel)
  }
  // ---- the hall on the deck: bays of glass between white portal frames
  const x0 = -hx + 16
  const x1 = hx - 11
  const z0 = -hz + 1.4
  const z1 = hz - 1.4
  const E = 8.8
  const ridge = 11
  const n = 13
  const bay = (x1 - x0) / n
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  block(out, x0, x1, z0 + 0.15, z1 - 0.15, deck + 0.1, E - 0.1, glass)
  block(out, x0 + 2, x1 - 2, -hz + 4, hz - 4, deck + 0.1, deck + 0.5, water)
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * bay
    for (const z of [z0, z1]) block(out, x - 0.14, x + 0.14, z - 0.14, z + 0.14, deck + 0.1, E, steel)
    block(out, x - 0.1, x + 0.1, z0, z1, E - 0.1, E + 0.1, steel)
    block(out, x - 0.05, x + 0.05, z0 + 0.1, z1 - 0.1, E + 0.12, E + 0.2, steel)
  }
  block(out, x0, x1, z0 - 0.12, z0 + 0.1, deck + 0.1, deck + 0.34, steel)
  block(out, x0, x1, z1 - 0.1, z1 + 0.12, deck + 0.1, deck + 0.34, steel)
  block(out, x0, x1, z0 - 0.12, z0 + 0.12, E - 0.15, E + 0.1, steel)
  block(out, x0, x1, z1 - 0.12, z1 + 0.12, E - 0.15, E + 0.1, steel)
  // ---- the glass roof, its river half slid along over the other half: the opening above the water
  const zm = (z0 + z1) / 2
  const open = (x1 - x0) * 0.38
  const roofPanel = (a: number, b: number, zA: number, zB: number, lift: number, c: Rgb): void => {
    const yA = E + (zA === zm ? ridge - E : 0) + lift
    const yB = E + (zB === zm ? ridge - E : 0) + lift
    const nz = zA < zB ? -0.35 : 0.35
    out.quad([[a, yA, zA], [b, yA, zA], [b, yB, zB], [a, yB, zB]], [0, 0.93, nz], uv, c, FIXED)
    out.quad([[b, yA - 0.03, zA], [a, yA - 0.03, zA], [a, yB - 0.03, zB], [b, yB - 0.03, zB]], [0, -0.93, -nz], uv, shade(c, 0.8), FIXED)
  }
  roofPanel(x0 + open, x1, z0, zm, 0, glass)
  roofPanel(x0, x1 - open, zm, z1, 0, glass)
  roofPanel(x0 + open, x1, zm, z1, 0.4, shade(glass, 1.15))
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * bay
    if (x > x0 + open - 0.1) {
      out.quad([[x - 0.06, E + 0.03, z0], [x + 0.06, E + 0.03, z0], [x + 0.06, ridge + 0.03, zm], [x - 0.06, ridge + 0.03, zm]], [0, 0.93, -0.35], uv, steel, FIXED)
      out.quad([[x + 0.06, E + 0.45, z1], [x - 0.06, E + 0.45, z1], [x - 0.06, ridge + 0.45, zm], [x + 0.06, ridge + 0.45, zm]], [0, 0.93, 0.35], uv, steel, FIXED)
    }
    if (x < x1 - open + 0.1 && x <= x0 + open) out.quad([[x + 0.06, E + 0.03, z1], [x - 0.06, E + 0.03, z1], [x - 0.06, ridge + 0.03, zm], [x + 0.06, ridge + 0.03, zm]], [0, 0.93, 0.35], uv, steel, FIXED)
  }
  block(out, x0, x1, zm - 0.1, zm + 0.1, ridge - 0.1, ridge + 0.5, steel)
  // the sun deck's loungers at the +x end, the grey box at the −x end
  block(out, -hx + 2, x0 - 0.5, -hz + 2, hz - 2, deck + 0.1, deck + 4.6, hex('#79838a'))
  block(out, -hx + 1.6, x0 - 0.2, -hz + 1.6, hz - 1.6, deck + 4.6, deck + 5, steel)
  for (const z of [-5, -2, 1, 4]) block(out, x1 + 1.5, x1 + 8.5, z - 0.4, z + 0.4, deck + 0.1, deck + 0.6, hex('#d4d0c8'))
  // the gangway to the bank
  block(out, -hx + 10, -hx + 13, hz, hz + 7, deck + 0.8, deck + 1, shade(steel, 0.8))
}
