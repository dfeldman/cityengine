import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Dôme des Invalides above its church (Hardouin-Mansart, 1706) — Napoleon's tomb is under it. OSM maps
 * the church below the drum well, so this is the part above 34 m that everyone knows (PARIS_EXPAND §5 A):
 *
 * - the DRUM: pale stone ringed by forty paired columns, tall windows between them;
 * - the DOME, dark lead covered in GILDING — its ribs, the trophies and garlands between them;
 * - the gilded lantern, and the spire with its cross at 107 m above the Seine (85.6 m over the ground here).
 *
 * Built from y = 34.2 up, centred on its footprint.
 */
export function invalidesDome(out: MeshBuilder, fit: Fit): void {
  const stone: Rgb = [0.86, 0.83, 0.76]
  const lead: Rgb = [0.24, 0.26, 0.26]
  const gold: Rgb = [0.86, 0.66, 0.24]
  const dark: Rgb = [0.16, 0.15, 0.14]
  const r = Math.min(Math.max(Math.max(fit.hx, fit.hz) * 1.05, 13), 16)
  const y0 = 34.2
  // the drum and its attic
  prism(out, 0, 0, y0, 46.3, r, 40, stone, FIXED)
  prism(out, 0, 0, 46.3, 48.1, r * 0.96, 40, stone, FIXED)
  // forty paired columns round it, windows between the pairs
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    for (const d of [-0.035, 0.035]) {
      const b = a + d
      prism(out, Math.sin(b) * (r + 0.55), Math.cos(b) * (r + 0.55), y0 + 0.6, y0 + 11, 0.42, 8, stone, FIXED)
    }
    const w = a + Math.PI / 20
    box(out, Math.sin(w) * (r + 0.02), y0 + 6, Math.cos(w) * (r + 0.02), 0.9, 3.6, 0.9, dark, FIXED)
  }
  prism(out, 0, 0, y0 + 11, y0 + 12.1, r + 1.1, 40, stone, FIXED)                     // the entablature
  // the dome: dark lead rising in a steep curve, gilded ribs over it, garlands between
  const steps = 10
  const dome = (t: number): number => r * 0.95 * Math.cos(t * Math.PI * 0.46)
  const yd = 48.1
  const hd = 24
  for (let k = 0; k < steps; k++) {
    const t0 = k / steps
    const t1 = (k + 1) / steps
    prism(out, 0, 0, yd + hd * Math.sin(t0 * Math.PI / 2), yd + hd * Math.sin(t1 * Math.PI / 2), dome(t0), 32, lead, FIXED, dome(t1))
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps
      const t1 = (k + 1) / steps
      const p0 = dome(t0) + 0.12
      const p1 = dome(t1) + 0.12
      const ya = yd + hd * Math.sin(t0 * Math.PI / 2)
      const yb = yd + hd * Math.sin(t1 * Math.PI / 2)
      // a rib: a thin gilded band up the dome
      box(out, Math.sin(a) * (p0 + p1) / 2, (ya + yb) / 2, Math.cos(a) * (p0 + p1) / 2, 0.35, (yb - ya) / 2 + 0.1, 0.35, gold, FIXED)
    }
    // a gilded trophy between the ribs, low on the dome, and a garland above it
    const m = a + Math.PI / 16
    box(out, Math.sin(m) * (dome(0.15) + 0.2), yd + 5, Math.cos(m) * (dome(0.15) + 0.2), 0.9, 1.6, 0.9, gold, FIXED)
    box(out, Math.sin(m) * (dome(0.45) + 0.1), yd + 13, Math.cos(m) * (dome(0.45) + 0.1), 1.1, 0.35, 1.1, gold, FIXED)
  }
  // the lantern, gilded, and the spire with its cross
  prism(out, 0, 0, 72, 75.5, 2.6, 12, gold, FIXED)
  prism(out, 0, 0, 75.5, 77.6, 2.9, 12, gold, FIXED, 1.4)
  prism(out, 0, 0, 77.6, 84.4, 0.55, 8, gold, FIXED, 0.12)
  box(out, 0, 84.6, 0, 0.1, 1.1, 0.1, gold, FIXED)
  box(out, 0, 85.0, 0, 0.55, 0.1, 0.1, gold, FIXED)
}
