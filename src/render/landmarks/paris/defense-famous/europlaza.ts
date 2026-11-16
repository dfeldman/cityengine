/**
 * EUROPLAZA (1972, reclad 1999 by B&B Architectes; 135 m, 31 storeys), Courbevoie. After the reclad: green-grey glass with
 * white horizontal bands, a dark pitched (hipped) roof and a mast (fr.wikipedia "Tour Europlaza": "verre et granit", "un mât
 * et un toit à pans inclinés"; Commons Tour_Europlaza_Aout_2021.jpeg). Height Wikipedia 135 m (BD TOPO gives only the podium).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { beam, hex } from '../../kit.ts'
import { FIXED } from '../monuments/common.ts'
import { footRing, shaft, shrink } from './cbx.ts'

// ---- tunables ----
const EP_GLASS = '#8ea7a6'  // green-grey glass
const EP_BAND = '#e7e6e0'   // white spandrel bands
const EP_LOBBY = '#5b6a6e'
const EP_ROOF = '#3f4a52'   // dark pitched roof
const EP_MAST = '#c9cccc'
const EP_EAVE = 119         // top of the glass
const EP_RIDGE = 135        // roof apex (Wikipedia height)
const EP_MAST_TOP = 150
const EP_RIDGE_K = 0.25     // ridge ring as a share of the plan
const EP_FLOOR = 3.8

export function europlaza(out: MeshBuilder, fit: Fit): void {
  const r = footRing(fit)
  const g = fit.grade ?? 0
  shaft(out, r, 0, g + EP_EAVE, hex(EP_GLASS), hex(EP_BAND), EP_FLOOR, hex(EP_LOBBY), g + 8)
  // the hipped roof: each edge up to a small ridge ring
  const top = shrink(r, EP_RIDGE_K)
  const roof = hex(EP_ROOF)
  const y0 = g + EP_EAVE
  const y1 = g + EP_RIDGE
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length
    const a = r[i], b = r[j], c = top[j], d = top[i]
    const ux = b.x - a.x, uz = b.z - a.z
    const vx = d.x - a.x, vy = y1 - y0, vz = d.z - a.z
    let nx = -uz * vy, ny = uz * vx - ux * vz, nz = ux * vy
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz }
    const l = Math.hypot(nx, ny, nz) || 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [c.x, y1, c.z], [d.x, y1, d.z]], [nx / l, ny / l, nz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], roof, FIXED)
  }
  const cx = r.reduce((s, p) => s + p.x, 0) / r.length
  const cz = r.reduce((s, p) => s + p.z, 0) / r.length
  out.quad(top.length === 4 ? [[top[0].x, y1, top[0].z], [top[1].x, y1, top[1].z], [top[2].x, y1, top[2].z], [top[3].x, y1, top[3].z]] : [[cx, y1, cz], [cx, y1, cz], [cx, y1, cz], [cx, y1, cz]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], roof, FIXED)
  beam(out, [cx, y1, cz], [cx, g + EP_MAST_TOP, cz], 0.35, hex(EP_MAST))
}
