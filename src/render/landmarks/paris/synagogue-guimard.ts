import type { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { archedPane, block, hex, pane, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The synagogue of the rue Pavée (Agoudas Hakehilos), Hector Guimard, 1913 — the métro-entrance architect's
 * only religious building. A tall, narrow front of pale limestone, gently CONCAVE like an opened book, with
 * two ribs running the full height either side of a central bay of tall windows, rounded doorways below and
 * a soft curved crown above. What is recognised is the curve and the verticality, so that is what is drawn:
 * the front in narrow strips set back along a curve, the ribs standing proud, the crown rising in the middle.
 */
export function synagogueGuimard(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e9e1cf')
  const dark = hex('#2b2a28')
  const hx = Math.min(fit.hx, 7)
  const hz = Math.max(4, fit.hz)
  const H = 21
  const sag = 1.3                                   // how far the middle of the front is set back
  const zf = (x: number): number => -hz + sag * (1 - (x / hx) ** 2)
  // the house behind, and the curved front in strips
  block(out, -hx, hx, -hz + sag, hz, 0, H, stone)
  roof(out, -hx, hx, -hz + sag, hz, H, 2.5, 1.5, 1.5, hex('#5b6066'))
  // the curved front as one smooth surface, and the two little returns that close its ends
  const N = 16
  for (let i = 0; i < N; i++) {
    const x0 = -hx + (2 * hx * i) / N
    const x1 = x0 + (2 * hx) / N
    const z0 = zf(x0)
    const z1 = zf(x1)
    const tx = x1 - x0
    const tz = z1 - z0
    const l = Math.hypot(tx, tz)
    out.quad([[x1, 0, z1], [x0, 0, z0], [x0, H, z0], [x1, H, z1]], [tz / l, 0, -tx / l],
      [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
  }
  // and a flat cornice band following it at the top
  for (let i = 0; i < N; i++) {
    const x0 = -hx + (2 * hx * i) / N
    const x1 = x0 + (2 * hx) / N
    block(out, x0, x1, zf((x0 + x1) / 2) - 0.25, zf((x0 + x1) / 2) + 0.3, H - 0.5, H, shade(stone, 1.05))
  }
  // the ribs, full height and proud of the curve, ending in rounded caps above the crown line
  for (const s of [-1, 1]) {
    const x = s * hx * 0.42
    block(out, x - 0.7, x + 0.7, zf(x) - 0.9, zf(x) + 0.2, 0, H + 1.2, shade(stone, 1.06))
    prism(out, x, zf(x) - 0.35, H + 1.2, H + 2.4, 0.75, 12, shade(stone, 1.06), FIXED, 0.2)
  }
  // the crown: a soft arch over the central bay, and the tablet under its peak
  for (let i = -6; i <= 6; i++) {
    const x = (i / 6) * hx * 0.4
    const top = H + 2.4 * Math.sqrt(Math.max(0, 1 - (i / 6.5) ** 2))
    block(out, x - hx * 0.034, x + hx * 0.034, zf(x) - 0.05, zf(x) + 0.6, H, top, stone)
  }
  // the central bay: tall windows up four floors, the top one tallest, rounded
  for (let f = 1; f <= 4; f++) {
    const y = 4.6 + (f - 1) * 3.9
    const hgt = f === 4 ? 3.6 : 2.7
    pane(out, '-z', zf(0) - 0.02, 0, y, 2.2, hgt, dark)
    pane(out, '-z', zf(0) - 0.04, 0, y, 0.12, hgt, stone, 0.03)
    // the side bays: narrow slots, following the curve
    for (const s of [-1, 1]) {
      const x = s * hx * 0.72
      pane(out, '-z', zf(x) - 0.02, x, y + 0.3, 0.9, 2.2, dark)
    }
  }
  archedPane(out, zf(0) - 0.02, 0, 1.6, 2.4, 2.4, dark)
  // the ground floor: three rounded doorways
  for (const x of [-hx * 0.62, 0, hx * 0.62]) archedPane(out, zf(x) - 0.03, x, 0, 1.5, 3.1, dark)
  // a Star of David in the tablet under the crown: two small triangles
  const yc = H + 1.1
  const zc = zf(0) - 0.08
  const r = 0.55
  const tri = (up: number): [number, number, number][] => [0, 1, 2].map((k) => {
    const a = up * Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [Math.cos(a) * r, yc + Math.sin(a) * r, zc] as [number, number, number]
  })
  const t1 = tri(1)
  const t2 = tri(-1)
  out.quad([t1[0], t1[1], t1[2], t1[2]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#3a4f78'), FIXED)
  out.quad([t2[0], t2[1], t2[2], t2[2]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#3a4f78'), FIXED)
}
