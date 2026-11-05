/**
 * THE PAVILLON HABIB BOURGUIBA (MAISON DE TUNISIE) — EXPLORATIONS ARCHITECTURE & LAMINE BEN HIBET (2020): a seven-
 * storey rounded drum, its whole skin a dark ground scattered with pale tilted rectangular tiles (a calligraphic
 * screen), flat roof. Refs: Commons "CIUP - Pavillon Bourguiba.jpg" (docs/landmarks/refs/citeu/bourguiba/).
 * Plan from OSM way 859745357 (name "Maison de Tunisie - Pavillon Habib Bourguiba", 7 levels); front ~bearing 5 (boulevard Jourdan).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { cap, edges, onWall, type V } from './maison-tunisie.ts'

const SKIN: Rgb = hex('#4c4f53'), TILE: Rgb = hex('#d9d9d4'), TILE2: Rgb = hex('#b8bab8'), ROOF: Rgb = hex('#56565a')
const GLASS: Rgb = hex('#2f363e')
const glassTag = surfaceTag('glass')

const HEIGHT = 23.5, BASE_GLASS = 3.2                  // seven levels; a glazed ground storey behind the screen
const TILE_L = 1.15, TILE_W = 0.38, TILE_OUT = 0.14    // the pale tiles: size, how proud of the skin
const TILE_DENSITY = 0.55                              // tiles per square metre
const SEED = 7

export function pavillonBourguiba(out: MeshBuilder, fit: Fit): void {
  const { ring, len, nrm } = edges(fit), N = ring.length
  let r = SEED
  const rnd = (): number => { r = (r * 16807) % 2147483647; return r / 2147483647 }
  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = len[i], n = nrm[i]
    if (L < 0.2) continue
    onWall(out, a, b, n, 0, L, -0.3, HEIGHT, SKIN, 0)
    onWall(out, a, b, n, 0, L, 0.2, BASE_GLASS, GLASS, 0.05, glassTag)
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    const count = Math.round(L * (HEIGHT - BASE_GLASS - 0.6) * TILE_DENSITY)
    for (let k = 0; k < count; k++) {
      const t = rnd() * L, y = BASE_GLASS + 0.3 + rnd() * (HEIGHT - BASE_GLASS - 0.9), th = (rnd() - 0.5) * Math.PI
      const cx = Math.cos(th) * TILE_L / 2, cy = Math.sin(th) * TILE_L / 2, wx = -Math.sin(th) * TILE_W / 2, wy = Math.cos(th) * TILE_W / 2
      const pt = (dt: number, dy: number): V => [a.x + ux * (t + dt) + n[0] * TILE_OUT, y + dy, a.z + uz * (t + dt) + n[2] * TILE_OUT]
      out.quad([pt(-cx - wx, -cy - wy), pt(cx - wx, cy - wy), pt(cx + wx, cy + wy), pt(-cx + wx, -cy + wy)], n,
        [[0, 0], [1, 0], [1, 1], [0, 1]], rnd() < 0.7 ? TILE : TILE2, 0)
    }
  }
  cap(out, ring, HEIGHT - 0.4, ROOF)
}
