import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { jitter, sheet, type V3 } from './shapes.ts'

/** the design footprint: OSM way 78535563's box (local −z faces bearing 48, the Seine) */
const HX = 87.6
const HZ = 20.15

/**
 * Les Docks, Cité de la Mode et du Design (Jakob + MacFarlane, 2008–12): the 1907 reinforced-concrete warehouses of the
 * Magasins généraux on the Quai d'Austerlitz, and over them the "plug-over", a lime-green glazed tube that climbs out of
 * the frame and runs its whole length. The only building in Paris this colour, and it is what you see from the Bercy
 * side, from the Pont de Bercy and the Pont Charles-de-Gaulle, and from the metro's viaduct:
 *
 * - from the SEINE (local −z): the pale concrete grid four storeys high and open at the bottom to the quay, the bright
 *   faceted tube riding along it over the first floor, swelling and narrowing, the stairs climbing inside it;
 * - from the QUAI D'AUSTERLITZ (+z): the plain glass wall between the old grey-green concrete columns, floors marked by
 *   the slab edges, the green showing through at the top, as in the Mapillary frame along the quai (2026-10-30);
 * - over everything the roof terrace and its low green glass hump.
 *
 * Plan from OSM's way 78535563 (175 × 40 m). OSM gives no height; four 5 m floors and the terrace, from the frame on the
 * quai. No clear photograph from the river came back from Mapillary, so the tube's course is from memory: its faceting
 * here is a stylisation of the glass, not a survey of it.
 */
export function citeDeLaMode(out: MeshBuilder, fit: Fit): void {
  draw(out, fit.hx || HX, fit.hz || HZ)
}

function draw(out: MeshBuilder, hx: number, hz: number): void {
  const concrete = hex('#c4c5be')
  const grey = hex('#8c938c')
  const glass: Rgb = [0.2, 0.27, 0.3]
  const lime = hex('#93bb1f')
  const limeDeep = hex('#6f9a1c')
  const inside = hex('#b7cf4a')
  const floor = 5
  const H = floor * 4
  // ---- the dark glazed box inside the frame
  block(out, -hx + 0.4, hx - 0.4, -hz + 2, hz - 0.5, 0, H, glass)

  // ---- the concrete frame: a column every 10 m, the slab edges, both long sides and both ends
  const nb = Math.round((2 * hx) / 10)
  const bay = (2 * hx) / nb
  for (let i = 0; i <= nb; i++) {
    const x = -hx + i * bay
    block(out, x - 0.45, x + 0.45, -hz, -hz + 0.9, 0, H, concrete)         // the Seine side
    block(out, x - 0.45, x + 0.45, hz - 0.5, hz + 0.1, 0, H, grey)         // the quay side
    block(out, x - 0.3, x + 0.3, -hz + 8, -hz + 8.6, 0, H, concrete)
  }
  for (let f = 1; f <= 4; f++) {
    const y = f * floor
    block(out, -hx, hx, -hz, -hz + 2, y - 0.45, y, concrete)
    block(out, -hx, hx, hz - 0.5, hz + 0.05, y - 0.35, y, grey)
    block(out, -hx, -hx + 0.5, -hz, hz, y - 0.35, y, grey)
    block(out, hx - 0.5, hx, -hz, hz, y - 0.35, y, grey)
  }
  // the glazing bars on the quay side, and the green showing through the top floors
  for (let x = -hx + bay / 4; x < hx; x += bay / 4) block(out, x - 0.03, x + 0.03, hz - 0.46, hz - 0.4, 0, H, shade(grey, 0.7))
  block(out, -hx + 8, hx - 8, hz - 0.49, hz - 0.46, floor * 3 + 0.3, floor * 3 + 2.1, inside)
  // the ends: glass between the frame
  for (const s of [-1, 1]) {
    for (let z = -hz + 5; z < hz; z += 5) block(out, s * hx - 0.25, s * hx + 0.25, z - 0.25, z + 0.25, 0, H, grey)
  }
  // ---- the ground storey to the river: open to the quay, the deep arcade of the promenade, under the slab
  block(out, -hx + 0.4, hx - 0.4, -hz + 1.98, -hz + 2.02, 0, floor - 0.45, [0.15, 0.17, 0.18])
  // ---- the TUBE: lime facets over the first to third floors, swelling and narrowing along the frame
  const rise = (u: number): number => 1.6 * Math.sin(u * Math.PI * 2.7 + 0.4)
  const reach = (u: number): number => 3.1 + 1.8 * Math.sin(u * Math.PI * 3.3 + 1.2) + 0.9 * Math.sin(u * Math.PI * 9.1)
  const tube = (u: number, v: number): V3 => {
    const a = -1.45 + v * 2.9        // round the section, from under to over
    const x = (-hx + 2 + u * (2 * hx - 4))
    const yc = floor * 2.45 + rise(u)
    const ry = floor * 1.4 + 0.5 * Math.sin(u * 19)
    return [x, yc + Math.sin(a) * ry, -hz + 0.5 - Math.cos(a) * reach(u)]
  }
  sheet(out, tube, 42, 5, (u, v) => {
    const i = Math.floor(u * 42)
    const j = Math.floor(v * 5)
    const r = jitter(i, j)
    return r < 0.22 ? limeDeep : shade(lime, 0.94 + jitter(i + 3, j + 5) * 0.14)
  }, 0.05)
  // the end of the tube at each end, closed on the frame
  for (const u of [0, 1]) {
    const c = tube(u, 0.5)
    const s = u === 0 ? -1 : 1
    sheet(out, (a, b) => {
      const p = tube(u, a)
      return [p[0] + s * b * 1.4, p[1] + (c[1] - p[1]) * b, p[2] + (c[2] - p[2]) * b]
    }, 5, 1, limeDeep, 0.05)
  }

  // ---- the roof: the terrace's deck, its parapet, the low hump of green glass, the plant
  block(out, -hx, hx, -hz, hz, H, H + 0.3, hex('#8f948a'))
  block(out, -hx, hx, -hz, -hz + 0.25, H + 0.3, H + 1.2, [0.42, 0.5, 0.48])
  block(out, -hx, hx, hz - 0.25, hz, H + 0.3, H + 1.2, [0.42, 0.5, 0.48])
  const hump = (u: number, v: number): V3 => {
    const x = -hx * 0.42 + u * hx * 1.05
    const z = -hz + 2 + v * (hz * 1.5)
    const s = Math.sin(u * Math.PI)
    return [x, H + 0.3 + (2.6 + 1.2 * Math.sin(u * 7)) * s * Math.sin(v * Math.PI), z]
  }
  sheet(out, hump, 14, 4, (u, v) => shade(lime, 0.86 + jitter(Math.floor(u * 14), Math.floor(v * 4)) * 0.22), 0.05)
  block(out, hx * 0.72, hx * 0.92, -hz * 0.3, hz * 0.5, H + 0.3, H + 2.6, grey)
}
