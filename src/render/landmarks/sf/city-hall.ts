/**
 * San Francisco City Hall (Arthur Brown Jr., 1915; SF_PLAN.md §4) on Civic Center Plaza, from photographs (Wikimedia
 * Commons: "San Francisco City Hall exterior") and its figures: a granite block about 125 m by 90 m, and the dome —
 * taller than the Capitol's — whose lantern's gilded spire stands 94 m up.
 *
 * - the **block**: a rusticated ground storey; above it a Doric colonnade through two storeys along both long fronts;
 *   the cornice and a balustraded attic; **end pavilions** that step forward under pediments;
 * - the **centre**: a portico of six free columns under a sculpted pediment, facing the plaza;
 * - the **dome**: a drum ringed with columns and its attic, then the dome itself, dark lead with gilded ribs, and
 *   the lantern with its gilded cupola and spire.
 *
 * Local frame: long axis x, the plaza (Polk Street) front toward −z; fitted to OSM's relation.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { column, dome, pediment } from '../kit.ts'

const GRANITE: Rgb = [0.82, 0.81, 0.78]
const RUSTIC: Rgb = [0.72, 0.71, 0.68]
/** the tympana and the portico's depths: the building reads by its shadows, and in flat light it reads by these */
const DEEP: Rgb = [0.64, 0.63, 0.6]
const SHADOW: Rgb = [0.5, 0.5, 0.49]
const DARK: Rgb = [0.27, 0.28, 0.3]
const LEAD: Rgb = [0.36, 0.39, 0.43]
const GOLD: Rgb = [0.82, 0.66, 0.3]

export function cityHall(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(66, Math.max(50, fit.hx))
  const hz = Math.min(48, Math.max(36, fit.hz))
  const base = 8
  const eaves = 25
  const attic = 28.5
  // the block: base, walls, cornice, attic
  box(out, 0, base / 2, 0, hx, base / 2, hz, RUSTIC, 0)
  box(out, 0, (base + eaves) / 2, 0, hx - 1, (eaves - base) / 2, hz - 1, GRANITE, 0)
  box(out, 0, eaves + 0.7, 0, hx + 0.4, 0.7, hz + 0.4, GRANITE, 0)
  box(out, 0, attic - 1, 0, hx - 0.6, 1.8, hz - 0.6, GRANITE, 0)
  // the rusticated base's courses and its arched windows, and the colonnade over it, on every face
  for (const [len, other, axis] of [[hx, hz, 'x'], [hz, hx, 'z']] as const) {
    for (const s of [-1, 1]) {
      const at = (u: number, y: number, d = 0): [number, number, number] => axis === 'x' ? [u, y, s * (other + d)] : [s * (other + d), y, u]
      for (let y = 1.6; y < base; y += 1.6) {
        const [x, yy, z] = at(0, y, 0.02)
        box(out, x, yy, z, axis === 'x' ? len : 0.05, 0.06, axis === 'x' ? 0.05 : len, SHADOW, 0)
      }
      // the columns of the two-storey colonnade, engaged, with the windows between them
      const n = Math.round((2 * len - 24) / 5)
      for (let i = 0; i <= n; i++) {
        const u = -len + 12 + ((2 * len - 24) * i) / n
        const [x, , z] = at(u, 0, 0.5)
        column(out, x, z, base + 0.5, eaves - 0.2, 0.55, GRANITE)
        if (i < n) {
          const um = u + (2 * len - 24) / n / 2
          const [wx, , wz] = at(um, 0, -0.95)
          for (const [y0, y1] of [[base + 1.5, base + 7], [base + 9, eaves - 2]]) {
            box(out, wx, (y0 + y1) / 2, wz, axis === 'x' ? 1 : 0.06, (y1 - y0) / 2, axis === 'x' ? 0.06 : 1, DARK, 0)
          }
          const [bx, , bz] = at(um, 0, 0.03)
          box(out, bx, base / 2 - 0.3, bz, axis === 'x' ? 0.9 : 0.05, 2.2, axis === 'x' ? 0.05 : 0.9, DARK, 0)
        }
      }
    }
  }
  // the end pavilions, stepping forward on the long fronts, each under a pediment
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(out, sx * (hx - 7), (base + eaves) / 2, sz * (hz + 0.8), 7, (eaves + base) / 2, 1.2, GRANITE, 0)
    }
    const x0 = sx > 0 ? hx - 14 : -hx
    const x1 = sx > 0 ? hx : -hx + 14
    pediment(out, x0, x1, -hz - 2, eaves + 1.4, 4.2, 2, DEEP)
  }
  // the centre: the portico of six columns, its pediment, the doors behind it
  const pz = -hz - 5
  // the wall behind the columns, in the portico's shade
  box(out, 0, (base + eaves) / 2, -hz - 1.1, 14.5, (eaves - base) / 2, 0.1, SHADOW, 0)
  for (let i = 0; i < 6; i++) column(out, -12.5 + i * 5, pz, base, eaves, 0.9, GRANITE)
  box(out, 0, eaves + 0.9, pz + 2.5, 15, 0.9, 3.5, GRANITE, 0)
  box(out, 0, eaves - 0.15, pz - 1.02, 15, 0.15, 0.02, SHADOW, 0)          // the shadow line under the entablature
  box(out, 0, base / 2, pz + 2.5, 15, base / 2, 3.5, RUSTIC, 0)
  pediment(out, -15, 15, pz - 1, eaves + 1.8, 7, 4, DEEP)
  box(out, 0, eaves + 1.95, pz - 1.1, 15.3, 0.15, 0.1, GRANITE, 0)     // the pediment's base cornice
  for (const x of [-5, 0, 5]) box(out, x, 3.6, -hz - 0.05, 1.6, 3.2, 0.06, DARK, 0)
  // the drum: a square podium off the roof, the colonnaded drum and its attic
  box(out, 0, attic + 2, 0, 20, 2, 20, GRANITE, 0)
  prism(out, 0, 0, attic + 4, attic + 18, 16, 24, SHADOW, 0)
  for (let i = 0; i < 24; i++) {
    const a = ((i + 0.5) / 24) * Math.PI * 2
    column(out, Math.sin(a) * 17, Math.cos(a) * 17, attic + 4, attic + 17, 0.6, GRANITE)
  }
  prism(out, 0, 0, attic + 17, attic + 19.5, 18, 24, GRANITE, 0)
  prism(out, 0, 0, attic + 19.5, attic + 25, 15.5, 24, GRANITE, 0)
  // the dome: lead, ribbed in gold
  dome(out, 0, 0, attic + 25, 15.5, 22, LEAD, 24, GOLD)
  // the lantern: a ring of columns, its gilded cupola, the spire
  const ly = attic + 25 + 21
  prism(out, 0, 0, ly, ly + 7, 3.2, 12, SHADOW, 0)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    column(out, Math.sin(a) * 3.6, Math.cos(a) * 3.6, ly, ly + 7, 0.3, GRANITE)
  }
  dome(out, 0, 0, ly + 7, 4, 4, GOLD, 12)
  prism(out, 0, 0, ly + 10.5, 94, 0.5, 6, GOLD, 0, 0.05)
}
