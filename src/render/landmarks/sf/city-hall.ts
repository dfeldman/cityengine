/**
 * San Francisco City Hall (Arthur Brown Jr., 1915; SF_PLAN.md §4) on Civic Center Plaza, from photographs (Wikimedia
 * Commons: "San Francisco City Hall exterior") and its figures: a granite block about 125 m by 90 m, and the dome —
 * taller than the Capitol's — whose lantern's gilded spire stands 94 m up.
 *
 * - the **block**: a rusticated ground storey; above it a Doric colonnade through two storeys along both long fronts;
 *   the cornice and a balustraded attic; **end pavilions** that step forward under pediments;
 * - the **centre**: a portico of six free columns under a sculpted pediment, facing the plaza;
 * - the **dome** (docs/sf-batches/MODEL-CITY-HALL-DOME.md, 2026-10-26, from Commons photographs): a square podium
 *   with urns at its corners; a drum of SIXTEEN bays — paired Doric columns proud of the wall, a pedimented window
 *   in each bay, a balustrade round the foot — under an entablature with a break over each pair; an attic of
 *   garland panels with an urn on a pedestal over each pair; the dome itself, lead-grey and taller than a
 *   hemisphere, its ribs gilt in pairs with an oculus and a gilt cartouche in each panel; a gilt balustrade round
 *   the crown; the lantern, a gilt tempietto with a concave lead roof; the dark spire and the gilt finial at 93.7 m.
 *
 * Local frame: long axis x, the plaza (Polk Street) front toward −z; fitted to OSM's relation.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { lathe } from '../column.ts'
import type { Fit } from '../fit.ts'
import { column, pediment } from '../kit.ts'

const GRANITE: Rgb = [0.82, 0.81, 0.78]
const RUSTIC: Rgb = [0.72, 0.71, 0.68]
/** the tympana and the portico's depths: the building reads by its shadows, and in flat light it reads by these */
const DEEP: Rgb = [0.64, 0.63, 0.6]
const SHADOW: Rgb = [0.5, 0.5, 0.49]
const DARK: Rgb = [0.27, 0.28, 0.3]
/** the dome's lead, pale blue-grey in the sun; the spire and the lantern roof a darker lead */
const LEAD: Rgb = [0.5, 0.55, 0.62]
const LEAD_DARK: Rgb = [0.38, 0.42, 0.48]
const GILT: Rgb = [0.82, 0.66, 0.24]
const RELIEF: Rgb = [0.88, 0.87, 0.84]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type P3 = [number, number, number]

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
        // engaged against the wall and there are ~90 of them: the mid tier, not the full capital (PLAN Z)
        column(out, x, z, base + 0.5, eaves - 0.2, 0.55, GRANITE, { order: 'doric', tier: 'mid' })
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
  // the six of the portico ARE the building's face: the near tier, Doric as they are
  for (let i = 0; i < 6; i++) column(out, -12.5 + i * 5, pz, base, eaves, 0.9, GRANITE, { order: 'doric', tier: 'near' })
  box(out, 0, eaves + 0.9, pz + 2.5, 15, 0.9, 3.5, GRANITE, 0)
  box(out, 0, eaves - 0.15, pz - 1.02, 15, 0.15, 0.02, SHADOW, 0)          // the shadow line under the entablature
  box(out, 0, base / 2, pz + 2.5, 15, base / 2, 3.5, RUSTIC, 0)
  pediment(out, -15, 15, pz - 1, eaves + 1.8, 7, 4, DEEP)
  box(out, 0, eaves + 1.95, pz - 1.1, 15.3, 0.15, 0.1, GRANITE, 0)     // the pediment's base cornice
  for (const x of [-5, 0, 5]) box(out, x, 3.6, -hz - 0.05, 1.6, 3.2, 0.06, DARK, 0)
  domeStage(out)
}

/*
 * ---- the dome stage, in its own frame about the drum's axis: angle `a` runs round it (x = sin a · r, z = cos a · r,
 * so a = π faces the plaza on −z), `r` is out from the axis, y is up. Every piece is placed by (a, r, y).
 */

/** a point on the drum's cylinder: tangent coordinate `u` (metres along the wall, +u anticlockwise), `w` outward */
function at(a: number, r: number, u: number, y: number, w = 0): P3 {
  const s = Math.sin(a)
  const c = Math.cos(a)
  return [s * (r + w) + c * u, y, c * (r + w) - s * u]
}

/** a box in the tangent frame at (a, r): `hu` half-width along the wall, `hy` half-height, `hw` half-depth outward */
function tbox(out: MeshBuilder, a: number, r: number, y: number, hu: number, hy: number, hw: number, colour: Rgb, u = 0): void {
  const s = Math.sin(a)
  const c = Math.cos(a)
  const P = (du: number, dy: number, dw: number): P3 => at(a, r, u + du, y + dy, dw)
  const faces: [P3[], P3][] = [
    [[P(-hu, -hy, hw), P(hu, -hy, hw), P(hu, hy, hw), P(-hu, hy, hw)], [s, 0, c]],
    [[P(hu, -hy, -hw), P(-hu, -hy, -hw), P(-hu, hy, -hw), P(hu, hy, -hw)], [-s, 0, -c]],
    [[P(hu, -hy, hw), P(hu, -hy, -hw), P(hu, hy, -hw), P(hu, hy, hw)], [c, 0, -s]],
    [[P(-hu, -hy, -hw), P(-hu, -hy, hw), P(-hu, hy, hw), P(-hu, hy, -hw)], [-c, 0, s]],
    [[P(-hu, hy, hw), P(hu, hy, hw), P(hu, hy, -hw), P(-hu, hy, -hw)], [0, 1, 0]],
    [[P(-hu, -hy, -hw), P(hu, -hy, -hw), P(hu, -hy, hw), P(-hu, -hy, hw)], [0, -1, 0]],
  ]
  for (const [q, n] of faces) out.quad(q, n, UVQ, colour, 0)
}

/** a flat panel on the wall at (a, r), facing outward, `w` wide and `h` tall with its foot at y */
function panel(out: MeshBuilder, a: number, r: number, y: number, w: number, h: number, colour: Rgb): void {
  out.quad([at(a, r, -w / 2, y), at(a, r, w / 2, y), at(a, r, w / 2, y + h), at(a, r, -w / 2, y + h)],
    [Math.sin(a), 0, Math.cos(a)], UVQ, colour, 0)
}

/** a stone urn on the axis at (a, r): foot, bowl, neck and lid, `h` tall, `w` across the bowl */
function urn(out: MeshBuilder, a: number, r: number, y: number, h: number, w: number, colour: Rgb, sides = 8): void {
  const [x, , z] = at(a, r, 0, y)
  const b = w / 2
  lathe(out, x, z, [[b * 0.42, y], [b, y + h * 0.4], [b * 0.4, y + h * 0.7], [b * 0.55, y + h * 0.8], [b * 0.12, y + h * 0.95], [0.01, y + h]], sides, colour, 0)
}

/** a balustrade round the axis at radius r: two rails and posts at about `pitch` */
function ring(out: MeshBuilder, r: number, y: number, h: number, pitch: number, colour: Rgb, sides: number): void {
  lathe(out, 0, 0, [[r - 0.18, y], [r + 0.18, y + 0.02], [r + 0.18, y + 0.22], [r - 0.18, y + 0.24]], sides, colour, 0)
  lathe(out, 0, 0, [[r - 0.16, y + h - 0.2], [r + 0.16, y + h - 0.18], [r + 0.16, y + h], [r - 0.16, y + h + 0.02]], sides, colour, 0)
  const n = Math.max(8, Math.round((2 * Math.PI * r) / pitch))
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    prism(out, Math.sin(a) * r, Math.cos(a) * r, y + 0.2, y + h - 0.2, 0.09, 4, colour, 0, 0.09, false)
  }
}

/** the dome's profile: radius and height at a latitude t in [0, 1], fuller in the shoulder than a sphere */
const DOME_R = 16
const DOME_Y = 58
const DOME_RISE = 15
const DOME_TOP = 80.4 * (Math.PI / 180)   // where the profile reaches the lantern's foot, r ≈ 3.8
function domeAt(t: number, out = 0): [number, number] {
  const th = t * DOME_TOP
  return [DOME_R * Math.pow(Math.cos(th), 0.8) + out, DOME_Y + DOME_RISE * Math.sin(th)]
}

/** a patch lying on the dome's surface: angular half-width `hw` (metres, at that latitude) and latitude span [t0, t1] */
function domePatch(out: MeshBuilder, a: number, hw: number, t0: number, t1: number, lift: number, colour: Rgb): void {
  const [r0, y0] = domeAt(t0, lift)
  const [r1, y1] = domeAt(t1, lift)
  const d0 = hw / r0
  const d1 = hw / r1
  const p = (aa: number, r: number, y: number): P3 => [Math.sin(aa) * r, y, Math.cos(aa) * r]
  const tm = ((t0 + t1) / 2) * DOME_TOP
  out.quad([p(a - d0, r0, y0), p(a + d0, r0, y0), p(a + d1, r1, y1), p(a - d1, r1, y1)],
    [Math.sin(a) * Math.cos(tm), Math.sin(tm), Math.cos(a) * Math.cos(tm)], UVQ, colour, 0)
}

const BAYS = 16
const SIDES = 40

function domeStage(out: MeshBuilder): void {
  const roof = 28.5
  // ---- the podium: a square base with a pedestal and an urn at each corner
  box(out, 0, (roof + 36.2) / 2, 0, 21, (36.2 - roof) / 2, 21, GRANITE, 0)
  box(out, 0, 36.4, 0, 21.6, 0.3, 21.6, GRANITE, 0)
  for (let y = roof + 1.5; y < 35.5; y += 1.7) box(out, 0, y, 0, 21.02, 0.04, 21.02, SHADOW, 0)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(out, sx * 19.2, (roof + 37.6) / 2, sz * 19.2, 3, (37.6 - roof) / 2, 3, GRANITE, 0)
      box(out, sx * 19.2, 37.8, sz * 19.2, 3.3, 0.2, 3.3, GRANITE, 0)
      const a = Math.atan2(sx, sz)
      urn(out, a, 19.2 * Math.SQRT2, 38, 3.4, 2.4, GRANITE, 10)
    }
  }
  // ---- the drum: its wall, the plinth the paired columns stand on, the balustrade round its foot
  const wall = 17
  prism(out, 0, 0, 36.2, 54.2, wall, SIDES, GRANITE, 0, wall, false)
  lathe(out, 0, 0, [[19.6, 36.2], [19.6, 39.2], [19.2, 39.5]], SIDES, GRANITE, 0)
  ring(out, 20.6, 36.5, 1.3, 1.8, GRANITE, SIDES)
  const colR = 18.6
  for (let i = 0; i < BAYS; i++) {
    const a = Math.PI + (i / BAYS) * Math.PI * 2          // the bay's window; the pairs sit between the bays
    const pa = a + Math.PI / BAYS
    // the window: a dark pane, its jambs and sill, a triangular pediment on a cornice
    panel(out, a, wall + 0.05, 41, 2.4, 6, DARK)
    for (const s of [-1, 1]) tbox(out, a, wall, 44, 0.36, 3.1, 0.3, GRANITE, s * 1.5)
    tbox(out, a, wall, 40.8, 1.8, 0.25, 0.4, GRANITE)
    tbox(out, a, wall, 47.3, 1.95, 0.3, 0.45, GRANITE)
    const pz = wall + 0.42
    out.quad([at(a, pz, -2, 47.6), at(a, pz, 2, 47.6), at(a, pz, 0, 48.9), at(a, pz, 0, 48.9)], [Math.sin(a), 0, Math.cos(a)], UVQ, DEEP, 0)
    out.quad([at(a, pz, -2, 47.6), at(a, pz - 0.42, -2, 47.6), at(a, pz - 0.42, 0, 48.9), at(a, pz, 0, 48.9)],
      [Math.sin(a) * 0.6 - Math.cos(a) * 0.6, 0.8, Math.cos(a) * 0.6 + Math.sin(a) * 0.6], UVQ, GRANITE, 0)
    out.quad([at(a, pz, 0, 48.9), at(a, pz - 0.42, 0, 48.9), at(a, pz - 0.42, 2, 47.6), at(a, pz, 2, 47.6)],
      [Math.sin(a) * 0.6 + Math.cos(a) * 0.6, 0.8, Math.cos(a) * 0.6 - Math.sin(a) * 0.6], UVQ, GRANITE, 0)
    // the pair of columns, proud of the wall on the plinth, and the break in the entablature over them
    for (const s of [-1, 1]) {
      const [x, , z] = at(pa, colR, s * 1.25, 0)
      column(out, x, z, 39.5, 51.5, 0.72, GRANITE, { order: 'doric', tier: 'mid' })
    }
    tbox(out, pa, 18.65, 52.75, 2.2, 1.25, 0.95, GRANITE)
    tbox(out, pa, 18.65, 54.1, 2.45, 0.2, 1.2, GRANITE)
    // the attic: a garland panel in the bay, a pedestal and its urn over the pair
    panel(out, a, 16.65, 55.2, 3.6, 2, RELIEF)
    tbox(out, pa, 17.6, 56.1, 0.95, 2.1, 0.9, GRANITE)
    tbox(out, pa, 17.6, 58.3, 1.1, 0.12, 1.05, GRANITE)
    urn(out, pa, 17.6, 58.4, 2.8, 1.6, GRANITE)
  }
  // the entablature between the breaks, its cornice stepping out, and the attic wall
  lathe(out, 0, 0, [[18.1, 51.5], [18.1, 53.3], [18.7, 53.5], [18.7, 54.0], [18.2, 54.3]], SIDES, GRANITE, 0)
  prism(out, 0, 0, 54.3, 55.0, 17.6, SIDES, GRANITE, 0, 17.6, true)
  prism(out, 0, 0, 55.0, 58.0, 16.6, SIDES, GRANITE, 0, 16.6, false)
  lathe(out, 0, 0, [[16.6, 58.0], [16.9, 58.1], [16.9, 58.45], [16.2, 58.55]], SIDES, GRANITE, 0)
  // ---- the dome: a lathe from the gilt foot band to the crown rim, the ribs in pairs, an oculus and a cartouche a bay
  const RINGS = 14
  const prof: [number, number][] = []
  for (let k = 0; k <= RINGS; k++) prof.push(domeAt(k / RINGS))
  lathe(out, 0, 0, [[DOME_R + 0.12, DOME_Y - 0.1], [DOME_R + 0.12, DOME_Y + 0.5], prof[1]], SIDES, GILT, 0)
  lathe(out, 0, 0, prof.slice(1), SIDES, LEAD, 0)
  const [rTop, yTop] = prof[RINGS]
  lathe(out, 0, 0, [[rTop, yTop], [rTop + 0.5, yTop + 0.1], [rTop + 0.5, yTop + 0.4], [rTop - 0.2, yTop + 0.5]], 24, GILT, 0)
  prism(out, 0, 0, yTop + 0.4, yTop + 0.5, rTop - 0.2, 24, LEAD, 0, rTop - 0.2, true)
  for (let i = 0; i < BAYS; i++) {
    const a = Math.PI + ((i + 0.5) / BAYS) * Math.PI * 2    // the ribs are over the column pairs
    for (const s of [-1, 1]) {
      for (let k = 1; k < RINGS; k++) {
        const da = (s * 0.5) / prof[k][0]
        domePatch(out, a + da, 0.13, k / RINGS, (k + 1) / RINGS, 0.14, GILT)
      }
    }
    // in the panel: the cartouche with its swags, the oculus in a gilt frame
    const b = a + Math.PI / BAYS
    domePatch(out, b, 0.6, 0.52, 0.585, 0.12, GILT)
    domePatch(out, b, 0.22, 0.47, 0.52, 0.12, GILT)
    domePatch(out, b, 0.55, 0.67, 0.725, 0.1, GILT)
    domePatch(out, b, 0.38, 0.68, 0.715, 0.16, DARK)
  }
  // ---- the crown: the gilt balustrade round the lantern's foot
  ring(out, rTop + 0.7, yTop + 0.5, 1.2, 0.8, GILT, 24)
  const lb = yTop + 0.5
  // ---- the lantern: a lead core with an arched opening a face, gilt columns in pairs at the corners, a gilt
  // entablature with urns over the pairs, the concave roof, the spire and the finial
  prism(out, 0, 0, lb, lb + 1.6, 3.4, 16, LEAD, 0, 3.4, true)
  const ly = lb + 1.6
  prism(out, 0, 0, ly, ly + 5.5, 2.2, 16, LEAD, 0, 2.2, false)
  for (let i = 0; i < 4; i++) {
    const a = Math.PI + (i / 4) * Math.PI * 2
    panel(out, a, 2.22, ly + 0.8, 1.3, 3.4, DARK)
    for (const s of [-1, 1]) {
      const pa = a + Math.PI / 4
      const [x, , z] = at(pa, 3.1, s * 0.55, 0)
      column(out, x, z, ly, ly + 5.5, 0.26, GILT, { tier: 'far' })
    }
  }
  lathe(out, 0, 0, [[3.3, ly + 5.5], [3.3, ly + 6.2], [3.8, ly + 6.4], [3.8, ly + 6.8], [3.2, ly + 7.0]], 16, GILT, 0)
  prism(out, 0, 0, ly + 6.8, ly + 7.0, 3.2, 16, LEAD_DARK, 0, 3.2, true)
  for (let i = 0; i < 4; i++) urn(out, Math.PI + ((i + 0.5) / 4) * Math.PI * 2, 3.2, ly + 7.0, 1.7, 0.9, GILT)
  const ry = ly + 7.0
  lathe(out, 0, 0, [[3.0, ry], [2.3, ry + 0.8], [1.5, ry + 1.8], [1.0, ry + 3.0]], 16, LEAD_DARK, 0)
  lathe(out, 0, 0, [[1.1, ry + 3.0], [1.15, ry + 3.6], [0.95, ry + 4.0]], 8, GILT, 0)
  lathe(out, 0, 0, [[0.95, ry + 4.0], [0.5, ry + 7.0], [0.14, ry + 10.0]], 8, LEAD_DARK, 0)
  const fy = ry + 10.0
  lathe(out, 0, 0, [[0.14, fy], [0.38, fy + 0.5], [0.42, fy + 1.0], [0.16, fy + 1.6], [0.3, fy + 1.9], [0.02, fy + 2.2]], 8, GILT, 0)
}
