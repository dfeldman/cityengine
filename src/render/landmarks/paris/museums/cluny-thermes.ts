import { MeshBuilder } from '../../../buildings.ts'
import { archedPane, block, box, hex, pane, prism, rotated, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

const FIXED = 0

/**
 * The Thermes de Cluny: what stands of the Gallo-Roman baths of Lutetia (c. 200 AD) in their garden at the corner
 * of the Boulevards Saint-Michel and Saint-Germain, in front of the Hôtel de Cluny (the museum). Grey-yellow rubble
 * walls laid in bands — three courses of red brick every metre or so, the Roman way — broken off at ragged heights,
 * round-arched openings and niches turned in brick, an apse, and at the back the tall wall of the frigidarium,
 * the one hall still roofed (inside the museum), with its great arched window.
 *
 * Standalone, at OSM's node for the archaeological site (historic=archaeological_site, "Thermes de Cluny"), in the
 * open ground west of the museum's buildings; the museum itself is the city's (OSM way 41874779 and its parts) in
 * the Marais dress. Local frame: −z to the Boulevard Saint-Michel.
 */
export function clunyThermes(out: MeshBuilder, fit: Fit): void {
  const rubble = hex('#a3967a')
  const brick = hex('#9a5a40')
  const dark: Rgb = [0.24, 0.22, 0.2]
  const hx = Math.min(Math.max(fit.hx, 9), 16)
  const hz = Math.min(Math.max(fit.hz, 6), 16)
  const t = 1.4

  /** a wall along x on the −z face at z, x0..x1, its top broken off at heights hs (one a stretch), banded in brick */
  const wall = (q: MeshBuilder, x0: number, x1: number, z: number, hs: number[], arches: number[] = [], archH = 5): void => {
    const n = hs.length
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w
      const h = hs[i]
      block(q, a, a + w, z, z + t, 0, h, rubble)
      for (let y = 1.1; y < h - 0.3; y += 1.25) {
        pane(q, '-z', z, a + w / 2, y, w, 0.32, brick, 0.03)
        pane(q, '+z', z + t, a + w / 2, y, w, 0.32, brick, 0.03)
      }
    }
    for (const x of arches) {
      archedPane(q, z - 0.04, x, 1.2, 2.6, archH, dark)
      // the brick voussoirs round the head
      for (let k = 0; k <= 6; k++) {
        const ang = (k / 6) * Math.PI
        box(q, x + Math.cos(ang) * 1.55, 1.2 + archH - 1.3 + Math.sin(ang) * 1.55, z - 0.06, 0.22, 0.22, 0.05, brick, FIXED)
      }
    }
  }

  // the front wall to the boulevard, broken low, three openings
  wall(out, -hx, hx, -hz, [5.5, 7.2, 6.4, 8.6, 7.8, 5.2], [-hx * 0.55, 0, hx * 0.55], 4.2)
  // the frigidarium's west wall at the back, tall, its great window
  {
    const q = new MeshBuilder()
    wall(q, -hx, hx, -hz, [12.5, 13.6, 14.2, 14.2, 13.4, 12.2], [0], 8.5)
    rotated(out, q, Math.PI)
  }
  // the two side walls, lower, ragged
  for (const s of [-1, 1]) {
    const q = new MeshBuilder()
    wall(q, -hz, hz, -hx, s < 0 ? [6.8, 9.5, 11.2, 12.4] : [4.6, 5.8, 8.2, 11.6], [-hz * 0.3], 4)
    rotated(out, q, (s * Math.PI) / 2)
  }
  // the apse of the caldarium off the middle, and the hypocaust's low walls inside
  for (let k = 0; k < 7; k++) {
    const a0 = -Math.PI / 2 + (k / 7) * Math.PI
    const a1 = -Math.PI / 2 + ((k + 1) / 7) * Math.PI
    const r = hz * 0.45
    const cx = hx * 0.15
    const p0 = [cx + Math.sin(a0) * r, Math.cos(a0) * r]
    const p1 = [cx + Math.sin(a1) * r, Math.cos(a1) * r]
    const mx = (p0[0] + p1[0]) / 2
    const mz = (p0[1] + p1[1]) / 2
    prism(out, mx, mz, 0, 3 + (k % 3) * 1.4, 1.2, 5, rubble, FIXED, 1.1)
  }
  for (const x of [-hx * 0.6, -hx * 0.25]) block(out, x - 0.5, x + 0.5, -hz + 1.4, hz - 1.4, 0, 1.3, shade(rubble, 0.92))
  for (const z of [-hz * 0.3, hz * 0.2]) block(out, -hx + 1.4, -hx * 0.1, z - 0.5, z + 0.5, 0, 1.1, shade(rubble, 0.92))
}
