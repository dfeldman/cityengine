/**
 * HIPPODROME DE PARIS-VINCENNES — the grandstand (1983): a ~180 m concrete stand facing the track to the south-south-east.
 * Refs: Commons MediaSearch "Hippodrome de Vincennes tribune" (docs/landmarks/refs/vincennes/hippodrome/): open terraced
 * steps at the trackside foot, a glazed multi-storey body set back above them, a thin white roof cantilevered far out
 * over the steps with blue boxes (commentary/lighting) hung under its fascia. Plan: OSM way 62819893 (building=grandstand);
 * modelled as a section extruded along the long axis (local x), front = track = local −z.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'

const CONC: Rgb = hex('#9e9a92'), STEP: Rgb = hex('#8e8a83'), GLASS: Rgb = [0.26, 0.33, 0.37], ROOF: Rgb = hex('#ecebe6')
const BLUE: Rgb = hex('#2f6fb0'), BACK: Rgb = hex('#a9a59c')

// end inset (the plan tapers), steps depth/rise/count, glass body set-back from the front, body height,
// roof height/thickness/overhang beyond the steps' front edge, blue box size/spacing
const H_INSET = 6, H_STEP_D = 16, H_STEP_R = 5, H_STEPS = 10, H_BODY_Y = 20, H_ROOF_Y = 26, H_ROOF_T = 1.2
const H_ROOF_OVER = -2, H_BOX_W = 6, H_BOX_H = 2.2, H_BOX_D = 3, H_BOX_GAP = 22, H_GLASS_TILT = 3

type V = [number, number, number]

export function hippodromeVincennes(out: MeshBuilder, fit: Fit): void {
  const x0 = -fit.hx + H_INSET, x1 = fit.hx - H_INSET, zf = -fit.hz, zb = fit.hz, zg = zf + H_STEP_D
  const side = (pts: [number, number][], c: Rgb) => {            // an end wall from a section polygon (z, y), fan
    for (const [x, s] of [[x0, -1], [x1, 1]] as const)
      for (let i = 1; i < pts.length - 1; i++) {
        const q = [pts[0], pts[i], pts[i + 1]].map(([z, y]) => [x, y, z] as V)
        quadN(out, [q[0], q[1], q[2], q[2]], [s, 0, 0], c)
      }
  }
  const strip = (a: [number, number], b: [number, number], want: V, c: Rgb) =>
    quadN(out, [[x0, a[1], a[0]], [x1, a[1], a[0]], [x1, b[1], b[0]], [x0, b[1], b[0]]], want, c)
  // terraced steps
  for (let i = 0; i < H_STEPS; i++) {
    const za = zf + H_STEP_D * i / H_STEPS, zn = zf + H_STEP_D * (i + 1) / H_STEPS
    const ya = H_STEP_R * i / H_STEPS, yn = H_STEP_R * (i + 1) / H_STEPS
    strip([za, ya], [za, yn], [0, 0, -1], STEP)
    strip([za, yn], [zn, yn], [0, 1, 0], i % 2 ? STEP : CONC)
  }
  side([[zf, 0], [zg, 0], [zg, H_STEP_R], [zf + H_STEP_D / H_STEPS, H_STEP_R]], CONC)
  // glazed body, leaning slightly out toward the track as it rises; concrete back
  const gTop: [number, number] = [zg - H_GLASS_TILT, H_BODY_Y]
  strip([zg, H_STEP_R], gTop, [0, 0.2, -1], GLASS)
  strip(gTop, [gTop[0], H_ROOF_Y], [0, 0, -1], CONC)
  strip([zb, H_ROOF_Y], [zb, 0], [0, 0, 1], BACK)
  side([[zg, 0], [zb, 0], [zb, H_ROOF_Y], [gTop[0], H_ROOF_Y], gTop, [zg, H_STEP_R]], CONC)
  // the cantilevered roof slab
  const zr = zf + H_ROOF_OVER, yt = H_ROOF_Y + H_ROOF_T
  strip([zr, yt], [zb, yt], [0, 1, 0], ROOF)
  strip([zr, H_ROOF_Y], [zr, yt], [0, 0, -1], ROOF)
  strip([zb, H_ROOF_Y], [zr, H_ROOF_Y], [0, -1, 0], ROOF)
  side([[zr, H_ROOF_Y], [zb, H_ROOF_Y], [zb, yt], [zr, yt]], ROOF)
  // blue boxes hung under the fascia
  const zbx = zr + 2, n = Math.max(1, Math.floor((x1 - x0) / H_BOX_GAP))
  for (let k = 0; k < n; k++) {
    const cx = x0 + (x1 - x0) * (k + 0.5) / n, a = cx - H_BOX_W / 2, b = cx + H_BOX_W / 2
    const y0 = H_ROOF_Y - H_BOX_H, y1 = H_ROOF_Y, z0 = zbx, z1 = zbx + H_BOX_D
    quadN(out, [[a, y0, z0], [b, y0, z0], [b, y1, z0], [a, y1, z0]], [0, 0, -1], BLUE)
    quadN(out, [[a, y0, z1], [b, y0, z1], [b, y0, z0], [a, y0, z0]], [0, -1, 0], BLUE)
    quadN(out, [[a, y0, z0], [a, y0, z1], [a, y1, z1], [a, y1, z0]], [-1, 0, 0], BLUE)
    quadN(out, [[b, y0, z1], [b, y0, z0], [b, y1, z0], [b, y1, z1]], [1, 0, 0], BLUE)
  }
}
