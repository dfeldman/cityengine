import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Centre Pompidou: the building turned inside out. 166 × 60 × 42 m, thirteen 12.8 m bays by six 7 m
 * floors. Behind the outer plane the glass is set back; on the long sides the white columns carry the
 * gerberettes — the cast-steel rocker arms at every floor that reach out to the thin tension ties on the
 * outer line — with the X-bracing across every bay. The piazza (west) front carries the escalator in its
 * glass tube, climbing in flights from the south end to the gallery along the top; the east (street) front
 * carries the ducts in their colour code — blue air, green water, yellow electricity, red for moving people.
 * On the piazza, the white ventilation trumpets. `fit` is the footprint measured square to the piazza
 * front, which faces local −z (landmarks.ts turns it so; manifest front 291).
 */
export function pompidou(out: MeshBuilder, fit: Fit): void {
  const { hx, hz } = fit
  const h = Math.min(fit.height, 42)
  const white: Rgb = [0.93, 0.93, 0.92]
  const cast: Rgb = [0.78, 0.79, 0.8]
  const glass: Rgb = [0.46, 0.55, 0.62]
  const tube: Rgb = [0.72, 0.8, 0.84]
  const red: Rgb = [0.78, 0.14, 0.1]
  const bays = Math.max(4, Math.round((2 * hx) / 12.8))
  const bay = (2 * hx) / bays
  const floors = 6
  const fh = h / floors
  const inner = hz - 3.2                        // the column line; the ties stand on the outer line at ±hz
  // the glass box behind it all
  box(out, 0, h / 2, 0, hx - 1.2, h / 2, inner - 1.2, glass, FIXED)
  box(out, 0, h + 0.3, 0, hx - 1.2, 0.3, inner - 1.2, cast, FIXED)
  for (const s of [-1, 1]) {
    for (let i = 0; i <= bays; i++) {
      const x = -hx + i * bay
      // the column, the thin outer tie, and a gerberette at every floor between them
      prism(out, x, s * inner, 0, h + 0.8, 0.45, 10, white)
      prism(out, x, s * hz, 0, h, 0.16, 6, white)
      for (let f = 1; f <= floors; f++) {
        const y = f * fh
        beam(out, [x, y - 0.2, s * (inner - 1.4)], [x, y - 0.35, s * (hz + 0.2)], 0.28, cast, 0.45)
        beam(out, [x, y - 1.6, s * inner], [x, y - 0.5, s * (hz - 0.6)], 0.12, cast)
      }
    }
    // the floor beams on the outer line, and the X-bracing across every bay
    for (let f = 0; f <= floors; f++) beam(out, [-hx, f * fh, s * hz], [hx, f * fh, s * hz], 0.14, white, 0.22)
    for (let i = 0; i < bays; i++) {
      const x0 = -hx + i * bay
      const x1 = x0 + bay
      for (let f = 0; f < floors; f++) {
        const y0 = f * fh
        const y1 = y0 + fh
        beam(out, [x0, y0, s * (hz + 0.1)], [x1, y1, s * (hz + 0.1)], 0.06, white)
        beam(out, [x1, y0, s * (hz + 0.1)], [x0, y1, s * (hz + 0.1)], 0.06, white)
      }
    }
  }
  // the short ends: columns and floor bands
  for (const s of [-1, 1]) {
    for (let z = -inner; z <= inner + 0.01; z += (2 * inner) / 4) prism(out, s * hx, z, 0, h, 0.35, 8, white)
    for (let f = 0; f <= floors; f++) box(out, s * hx, f * fh, 0, 0.25, 0.2, inner, white, FIXED)
  }
  // the escalator: flights up the piazza front from the south end, a landing at each floor, then the
  // gallery along the top — a glass tube on white struts, a red line under it
  const zf = -hz - 2.2
  let x = -hx + bay * 0.6
  let y = 1
  const flight = bay * 1.9
  const pts: [number, number, number][] = [[x, y, zf]]
  for (let f = 1; f < floors && x + flight < hx - 4; f++) {
    x += flight
    y = f * fh + 1
    pts.push([x, y, zf])
    x += 3.5
    pts.push([x, y, zf])
  }
  pts.push([hx - 3, y, zf])
  for (let i = 1; i < pts.length; i++) {
    beam(out, pts[i - 1], pts[i], 1.25, tube, 1.5)
    const lo = (p: [number, number, number]): [number, number, number] => [p[0], p[1] - 1.6, p[2] - 1.26]
    beam(out, lo(pts[i - 1]), lo(pts[i]), 0.08, red, 0.12)
  }
  for (const p of pts) beam(out, [p[0], p[1] - 1.5, zf], [p[0], p[1] - 1.5, -hz + 0.2], 0.15, white)
  // the east front's ducts, in their colours, standing proud of the frame, and their horizontal runs
  const ducts: Rgb[] = [[0.12, 0.32, 0.72], [0.12, 0.55, 0.3], [0.9, 0.78, 0.15], [0.12, 0.32, 0.72], [0.12, 0.55, 0.3], [0.78, 0.14, 0.1]]
  for (let i = 0; i < 20; i++) {
    const xd = -hx + 4 + (i * (2 * hx - 8)) / 19
    prism(out, xd, hz + 1.8, 0, h + 1.5, i % 3 === 0 ? 0.95 : 0.55, 10, ducts[i % ducts.length])
  }
  for (let f = 1; f < floors; f += 2) beam(out, [-hx + 2, f * fh + 2, hz + 2.8], [hx - 2, f * fh + 2, hz + 2.8], 0.4, ducts[f % 3])
  // the roof plant: blue air handlers and green pipes
  for (let i = 0; i < 6; i++) {
    const xr = -hx * 0.7 + (i * hx * 1.4) / 5
    box(out, xr, h + 1.8, -inner * 0.3, 2.8, 1.5, 3.2, [0.12, 0.32, 0.72], FIXED)
    box(out, xr, h + 1.0, inner * 0.4, 0.45, 0.45, inner * 0.3, [0.12, 0.55, 0.3], FIXED)
  }
  // the Piazza: pale paving falling gently toward the building, the length of the front and 45 m out
  // (and under the building's outer frame too, right up to the glass, or a strip of lawn showed there)
  block(out, -hx - 4, hx + 4, -hz - 1, -inner + 1, 0, 0.55, [0.62, 0.59, 0.54])
  for (let k = 0; k < 6; k++) {
    const z0 = -hz - 1 - k * 7.5
    block(out, -hx - 4, hx + 4, z0 - 7.5, z0, 0, 0.55 + k * 0.22, k % 2 ? [0.6, 0.57, 0.52] : [0.62, 0.59, 0.54])
  }
  // the white trumpets on the piazza: a pipe up, and a bell opening toward the building
  for (const t of [-0.55, -0.1, 0.35]) {
    const xt = hx * t
    const zt = -hz - 16
    prism(out, xt, zt, 0.5, 3.9, 0.55, 12, white)
    prism(out, xt, zt, 3.9, 5.3, 0.6, 12, white, FIXED, 1.5)
    prism(out, xt, zt, 5.3, 5.5, 1.5, 12, [0.25, 0.25, 0.27], FIXED, 1.4)
  }
}
