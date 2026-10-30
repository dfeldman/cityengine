import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

/**
 * La Tour Zamansky at Jussieu (Édouard Albert, 1971): at 90 m the tallest thing in the Latin Quarter, standing on the
 * raised slab of the university's grid, Paris's own lesson in why a tower needs permission. A plain square shaft on
 * thin legs, and since the renovation that took the asbestos out (finished 2009) dark glass held in a light aluminium grid:
 *
 * - from anywhere within two kilometres: the square slab with clipped corners, the fine grid, the dark floors;
 * - from the foot, the Place Jussieu: the storey-high gap at the bottom, the thin columns and a recessed core;
 * - at the top, the plant floors set in behind a parapet.
 *
 * OSM's way 16924888: 23.4 m square, 90 m, 29 levels. Glass and grid colours are from memory. Mapillary returned nothing
 * close enough to check them (2026-10-30). 
 */
export function tourZamansky(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx
  const hz = fit.hz
  const H = Math.min(Math.max(fit.height || 90, 60), 92)
  const c = 1.1
  const glass: Rgb = [0.15, 0.2, 0.25]
  const grid = hex('#b9bec1')
  const dark = hex('#3a3f43')
  const base = 7
  const top = H - 5
  // the shaft, its clipped corners as four strips
  block(out, -hx + c, hx - c, -hz, hz, base, top, glass)
  block(out, -hx, hx, -hz + c, hz - c, base, top, glass)
  const floor = (top - base) / 26
  const bays = 8
  for (const s of [-1, 1]) {
    for (let i = 0; i <= bays; i++) {
      const t = -hx + c + (i / bays) * (2 * (hx - c))
      const w = i === 0 || i === bays ? 0.3 : 0.12
      block(out, t - w, t + w, s * hz - 0.1, s * hz + 0.1, base, top, grid)
      const u = -hz + c + (i / bays) * (2 * (hz - c))
      block(out, s * hx - 0.1, s * hx + 0.1, u - w, u + w, base, top, grid)
    }
    for (let f = 0; f <= 26; f++) {
      const y = base + f * floor
      block(out, -hx + c, hx - c, s * hz - 0.09, s * hz + 0.09, y - 0.09, y + 0.09, f % 2 === 0 ? grid : shade(grid, 0.82))
      block(out, s * hx - 0.09, s * hx + 0.09, -hz + c, hz - c, y - 0.09, y + 0.09, f % 2 === 0 ? grid : shade(grid, 0.82))
    }
  }
  // the clipped corners: a pale strip up each, set back
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) block(out, sx * (hx - c) - 0.5, sx * (hx - c) + 0.5, sz * (hz - c) - 0.5, sz * (hz - c) + 0.5, base, top, shade(grid, 0.9))
  }
  // the top: the deep parapet, the plant floors set in, their masts
  block(out, -hx + 0.3, hx - 0.3, -hz + 0.3, hz - 0.3, top, top + 1.1, grid)
  block(out, -hx + 3, hx - 3, -hz + 3, hz - 3, top + 1.1, H, shade(grid, 0.78))
  block(out, -hx + 6, hx - 6, -hz + 6, hz - 6, H, H + 1, dark)
  // the foot: the slab of the Jussieu grid at about first-floor height, the recessed core, the legs
  block(out, -hx * 0.55, hx * 0.55, -hz * 0.55, hz * 0.55, 0, base, dark)
  block(out, -hx, hx, -hz, hz, base - 0.5, base, grid)
  for (let i = 0; i <= 4; i++) {
    const t = -hx + 1 + (i / 4) * (2 * hx - 2)
    for (const s of [-1, 1]) {
      block(out, t - 0.3, t + 0.3, s * (hz - 1) - 0.3, s * (hz - 1) + 0.3, 0, base - 0.5, grid)
      block(out, s * (hx - 1) - 0.3, s * (hx - 1) + 0.3, t - 0.3, t + 0.3, 0, base - 0.5, grid)
    }
  }
}
