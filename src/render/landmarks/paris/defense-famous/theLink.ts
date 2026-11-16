/**
 * THE LINK (PCA-Stream / Philippe Chiambaretta, 2021–2025; TotalEnergies' HQ, Puteaux). Two slim blades, staggered
 * in plan: "Arche" (west, 242 m, 52 storeys) and "Seine" (east, 178 m, 35 storeys) (fr.wikipedia "The Link
 * (gratte-ciel)", infobox: roof 242 m and 178 m, 52+35 storeys), tied across the gap by 35 "links": stacked
 * bridge/garden floors, one every two storeys, which read as white horizontal slots between the blades. Pale silver
 * glass double skin with a fine white band at every floor (Commons "The Link Octobre 2025.jpg", "Link - Juin 2025.jpg",
 * "The Link at la Defense - 2026-08-14.jpg"). Plan in east/north metres from the OSM way's box centre (48.8873,
 * 2.2479), the blades read off the OSM ring's parallel edges and the 2023 IGN orthophoto (the lidar MNS predates the
 * towers, so heights are the published ones).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'

// tunables
const LK_GLASS = '#a7b8c3'      // pale silver sky-reflecting glass
const LK_GAP_GLASS = '#7f909b'  // the inner faces, in shade across the gap
const LK_BAND = '#e2e5e3'       // the white floor band
const LK_LINK = '#eceeea'       // the link floors' white slab edges
const LK_LINK_GLASS = '#7d8f99' // glazing between link slabs
const LK_LOBBY = '#5a6b74'
const LK_ROOF = '#9aa3a8'
const LK_ARCHE_H = 242
const LK_SEINE_H = 178
const LK_FLOOR = 4.2            // storey height: the band rhythm
const LK_BAND_H = 0.35
const LK_BAND_OUT = 0.25
const LK_LOBBY_H = 9
const LK_LINK_EVERY = 2         // storeys per link
const LK_LINK_SLAB = 1.3        // slab-edge thickness
const LK_CROWN_DROP = 7         // the Arche's roof falls this much toward its east end
const LK_CHAMFER = 3            // the blades' corners cut
// plan: u along the blades (east-north-east), v across them (north-north-west)
const LK_U: P2 = [0.95, 0.32]
const LK_V: P2 = [-0.32, 0.95]
const LK_ARCHE = { u0: -55, u1: 14, v0: 7, v1: 35 }
const LK_SEINE = { u0: -4, u1: 50, v0: -37, v1: -9 }
const LK_LINKS = { u0: -2, u1: 13 }  // the overlap the links bridge
// the OSM ring (east, north), for registration
const OSM_RING: P2[] = [[9, 22], [-20, 36], [-22, 36], [-36, 32], [-38, 30], [-46, 18], [-54, 0], [-55, -4], [-55, -6], [-53, -8], [-41, -14], [-38, -14], [-30, -13], [-9, -28], [-9, -29], [3, -36], [6, -37], [9, -37], [54, -22], [56, -20], [57, -19], [56, -15], [52, -2], [51, 0], [44, 3], [41, 5], [39, 5], [17, -3], [11, 20]]

const en = (u: number, v: number): P2 => [LK_U[0] * u + LK_V[0] * v, LK_U[1] * u + LK_V[1] * v]
function plan(b: { u0: number; u1: number; v0: number; v1: number }, grow = 0, c = LK_CHAMFER): P2[] {
  const u0 = b.u0 - grow, u1 = b.u1 + grow, v0 = b.v0 - grow, v1 = b.v1 + grow
  return [en(u0 + c, v0), en(u1 - c, v0), en(u1, v0 + c), en(u1, v1 - c), en(u1 - c, v1), en(u0 + c, v1), en(u0, v1 - c), en(u0, v0 + c)]
}

export function theLink(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(OSM_RING, fit)
  const T = tools(out, F)
  const glass = hex(LK_GLASS), band = hex(LK_BAND), roof = hex(LK_ROOF)
  const scale = fit.height > 200 && fit.height < 260 ? fit.height / LK_ARCHE_H : 1
  const HA = LK_ARCHE_H * scale, HS = LK_SEINE_H * scale

  const blade = (b: typeof LK_ARCHE, H: number, drop: number, innerSide: 'v0' | 'v1'): void => {
    const r = plan(b)
    const top = (e: number, n: number): number => {
      const u = e * LK_U[0] + n * LK_U[1]
      return H - drop * (u - b.u0) / (b.u1 - b.u0)
    }
    // lobby, inset and darker
    T.prism(plan(b, -1.2), 0, LK_LOBBY_H, hex(LK_LOBBY), null)
    // shaft: walls per face, the face toward the gap in shade
    for (let i = 0; i < r.length; i++) {
      const a = r[i], c = r[(i + 1) % r.length]
      const mu = ((a[0] + c[0]) / 2) * LK_V[0] + ((a[1] + c[1]) / 2) * LK_V[1]
      const inner = innerSide === 'v0' ? mu < b.v0 + 1 : mu > b.v1 - 1
      T.wall(a, c, LK_LOBBY_H, top, inner ? hex(LK_GAP_GLASS) : glass)
    }
    // roof: sloped fan (convex plan) and a white parapet line
    T.prism(plan(b, -0.6), (e, n) => top(e, n) - 0.5, (e, n) => top(e, n) + 1.2, band, roof)
    // floor bands
    const rb = plan(b, LK_BAND_OUT, LK_CHAMFER + LK_BAND_OUT * 0.4)
    const lowest = H - drop
    for (let y = LK_LOBBY_H; y + LK_BAND_H < lowest - 1; y += LK_FLOOR) T.prism(rb, y, y + LK_BAND_H, band, null)
  }
  blade(LK_ARCHE, HA, LK_CROWN_DROP, 'v0')
  blade(LK_SEINE, HS, 0, 'v1')

  // the links: a white slab every two storeys spanning the gap, glazing set back between them
  const g0 = LK_SEINE.v1 - 0.5, g1 = LK_ARCHE.v0 + 0.5
  const linkPlan: P2[] = [en(LK_LINKS.u0, g0), en(LK_LINKS.u1, g0), en(LK_LINKS.u1, g1), en(LK_LINKS.u0, g1)]
  const glassPlan: P2[] = [en(LK_LINKS.u0 + 1, g0), en(LK_LINKS.u1 - 1, g0), en(LK_LINKS.u1 - 1, g1), en(LK_LINKS.u0 + 1, g1)]
  const step = LK_FLOOR * LK_LINK_EVERY
  T.prism(glassPlan, LK_LOBBY_H, HS - 2, hex(LK_LINK_GLASS), null)
  for (let y = LK_LOBBY_H + step; y < HS - 1; y += step) T.prism(linkPlan, y, y + LK_LINK_SLAB, hex(LK_LINK), hex(LK_LINK))
  T.cap(linkPlan, HS - 0.5, roof)
}

