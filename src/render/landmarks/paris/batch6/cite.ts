/**
 * LA CITÉ DE LA MUSIQUE (Christian de Portzamparc, east wing 1995; OSM way/63971254, 130 × 180 m, its 184-point outline; aerial 48.8895 2.3940, 0.22 m/px; the wing the parisCivic kit had as a drum with brick stripes). A long low mass of pale stone and ribbon windows on OSM's own outline, cut by the great diagonal of the Rue Musicale under its dark roof beam; the elliptical concert hall under its tan zinc dome, 50 m across and the only thing that shows from the Avenue Jean-Jaurès over the planes; the glazed collar of the street curving round the hall's north and east; the row of stepped studios up the Rue Musicale's west side; the two zinc "petals" over the museum; the white half-domes. front 180: x east, z north, with `px` reading the aerial. The roofs' places are all off the photograph; the walls' banding from photographs in memory.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, shade, type Rgb } from '../../kit.ts'
import { slab } from '../palaces/common.ts'

const CREAM = hex('#c6bda6'), BAND = hex('#8c8879'), RIBBON = hex('#262b2e'), ROOF = hex('#6e6c64'), ZINC = hex('#8d8272'), DARK = hex('#3c4145'), GLASS = hex('#7f98a2'), BAR = hex('#c7cbc8')

export function citeMusique(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, ring = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // the aerial's pixel to the model's frame: the bbox's centre is 13.0 m west, 43.7 m north of the aerial's
  // (and the outline's own centre in the frame the city hands it, which is not always the origin: a first shot had the hall 15 m off its drum)
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z), rx = (Math.min(...xs) + Math.max(...xs)) / 2, rz = (Math.min(...zs) + Math.max(...zs)) / 2
  const px = (a: number, b: number): [number, number] => [(a - 500) * 0.22 + 13 + rx, (500 - b) * 0.22 - 43.7 + rz]
  // the walls, stacked in their bands on OSM's outline: a dark ground floor, pale stone, the two ribbon windows, the grey string, the parapet
  const bands: [number, number, Rgb][] = [[0, 3.4, RIBBON], [3.4, 5, CREAM], [5, 6.4, RIBBON], [6.4, 8, CREAM], [8, 8.7, BAND], [8.7, 9.9, RIBBON], [9.9, 11.5, CREAM]]
  for (const [a, b, c] of bands) slab(out, ring, y + a, y + b, c, c)
  slab(out, ring, y + 11.5, y + 11.65, ROOF, ROOF)
  // the hall
  const [hx, hz] = px(487, 420)
  dome(out, hx, hz, y + 12, 25, 13, ZINC, 32)
  // its drum, under the dome's skirt
  const drum = (r0: number, y0: number, y1: number, c: Rgb) => { for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, b = ((i + 1) / 32) * Math.PI * 2; out.quad([[hx + Math.cos(a) * r0, y0, hz + Math.sin(a) * r0], [hx + Math.cos(b) * r0, y0, hz + Math.sin(b) * r0], [hx + Math.cos(b) * r0, y1, hz + Math.sin(b) * r0], [hx + Math.cos(a) * r0, y1, hz + Math.sin(a) * r0]], [Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0) } }
  drum(25, y + 11.6, y + 12.1, DARK)
  // the zinc's seams
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    for (let i = 0; i < 5; i++) {
      const t0 = (i / 5) * (Math.PI / 2), t1 = ((i + 1) / 5) * (Math.PI / 2)
      strut(out, [hx + Math.cos(a) * Math.cos(t0) * 25.03, y + 12 + Math.sin(t0) * 13.03, hz + Math.sin(a) * Math.cos(t0) * 25.03], [hx + Math.cos(a) * Math.cos(t1) * 25.03, y + 12 + Math.sin(t1) * 13.03, hz + Math.sin(a) * Math.cos(t1) * 25.03], 0.09, 0.05, shade(ZINC, 0.8), 0, false)
    }
  }
  // the glass collar of the Rue Musicale round it, a band 9 m wide, its bars across
  const collar: [number, number][] = [[590, 215], [625, 250], [648, 300], [652, 350], [640, 400], [610, 440], [570, 490], [520, 528], [460, 540], [405, 515], [370, 480]]
  for (let i = 0; i + 1 < collar.length; i++) {
    const [ax, az] = px(collar[i][0], collar[i][1]), [bx, bz] = px(collar[i + 1][0], collar[i + 1][1])
    strut(out, [ax, y + 12.6, az], [bx, y + 12.6, bz], 8.4, 0.5, GLASS, 0)
    const n = 4
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, l = Math.hypot(x - hx, z - hz), ux = (x - hx) / l, uz = (z - hz) / l
      strut(out, [x - ux * 4.2, y + 12.92, z - uz * 4.2], [x + ux * 4.2, y + 12.92, z + uz * 4.2], 0.14, 0.08, BAR, 0, false)
    }
    strut(out, [ax, y + 9.5, az], [bx, y + 9.5, bz], 8.2, 6, RIBBON, 0, false)
  }
  // the Rue Musicale: its long wall and dark roof beam, from the Fontaine aux Lions' side to the Avenue
  const [sa, sb] = px(240, 470), [ea, eb] = px(700, 105)
  strut(out, [sa, y + 14, sb], [ea, y + 14, eb], 7, 6.2, CREAM, 0)
  strut(out, [sa, y + 17.4, sb], [ea, y + 17.4, eb], 9.2, 0.8, DARK, 0)
  const dx = (ea - sa) / Math.hypot(ea - sa, eb - sb), dz = (eb - sb) / Math.hypot(ea - sa, eb - sb)
  strut(out, [sa, y + 14.4, sb], [ea, y + 14.4, eb], 7.08, 1.2, RIBBON, 0, false)
  // the studios, stepping up its west side
  for (const [a, b, h] of [[318, 362, 15.5], [345, 288, 16.5], [375, 225, 17.5], [405, 150, 18.5]] as const) {
    const [cx, cz] = px(a, b)
    strut(out, [cx - dz * -5 - dx * 7, y + 11.5 + (h - 11.5) / 2, cz + dx * -5 - dz * 7], [cx - dz * -5 + dx * 7, y + 11.5 + (h - 11.5) / 2, cz + dx * -5 + dz * 7], 13, h - 11.5, shade(CREAM, 0.96), 0)
    strut(out, [cx - dz * -5 - dx * 7, y + h - 2, cz + dx * -5 - dz * 7], [cx - dz * -5 + dx * 7, y + h - 2, cz + dx * -5 + dz * 7], 13.06, 1.1, RIBBON, 0, false)
    strut(out, [cx - dz * -5 - dx * 7.1, y + h + 0.06, cz + dx * -5 - dz * 7.1], [cx - dz * -5 + dx * 7.1, y + h + 0.06, cz + dx * -5 + dz * 7.1], 13.2, 0.14, BAND, 0, false)
  }
  // the zinc petals over the museum
  for (const [a0, a1, b0, b1, h, w] of [[445, 135, 555, 215, 17, 10], [535, 245, 610, 352, 16, 10]] as const) {
    const [ax, az] = px(a0, a1), [bx, bz] = px(b0, b1)
    strut(out, [ax, y + 11.5, az], [bx, y + h, bz], w, 2.2, ZINC, 0)
    strut(out, [ax, y + 12.6, az], [bx, y + h + 0.8, bz], w * 0.55, 1.6, shade(ZINC, 1.08), 0)
  }
  // the white half-domes and the small round rooflights on the terraces
  const WHITE = hex('#cbc9c2')
  for (const [a, b, r] of [[335, 165, 6.6], [275, 590, 3.9], [665, 355, 3], [660, 175, 3.3], [442, 560, 1.7]] as const) {
    const [x, z] = px(a, b)
    dome(out, x, z, y + 11.5, r, r * 0.95, WHITE, 14)
  }
}
