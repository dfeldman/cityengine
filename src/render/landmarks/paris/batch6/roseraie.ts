/**
 * LA ROSERAIE DE BAGATELLE (Forestier, 1905; the Concours international de roses nouvelles since 1907): what stands among its
 * roses. The beds themselves are OSM's and are planted in render/garden.ts by render/roses.ts (FLOWER_GARDENS in render/flower-gardens.ts); the gravel and the
 * yew cones are tools/gardens/paris-public.ts's plan. Here:
 *  - the rose GARLANDS round the two apses: green posts with a climber up each, a festoon of roses slung between their heads
 *    (the ortho, Ortho_20cm_D075_2021: a ring of posts just inside each apse's outer path);
 *  - the PERGOLA along the walk outside the south-west apse (the same photograph: a ladder of cross-beams ~2.6 m wide, 38 m);
 *  - WEEPING STANDARDS at the corners of the centre cross's three lawn squares (an assumption: pleureurs are a Bagatelle sight,
 *    their places are not read off anything);
 *  - the KIOSQUE DE L'IMPÉRATRICE (OSM amenity=shelter, 1852, for Eugénie) on its rocky knoll at the south-east corner,
 *    looking over the roses.
 * Local x east, z north (`front: 180`), origin at the garden's frame origin, 48.8673 2.2442. Layout in the garden's own frame
 * (bearing 222.4, u along the long lawns to the south-west, v to its right), as paris-public.ts writes it. Every number is in R.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism, strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, shade } from '../../kit.ts'
import { crag } from '../batch3/parks.ts'
import { climber, pergola, ROSE, standardRose, swag, TRELLIS, varietyOf } from '../../../roses.ts'

const R = {
  /** the frame: bearing of u */
  BEARING: 222.4,
  /** the apses: centre (u, v), the garland ring's radius, the arc it spans either side of the axis (degrees), post spacing */
  APSES: [{ u: 35, v: -2, r: 18.9, span: 78, out: 1 }, { u: -34, v: 0.5, r: 21.9, span: 74, out: -1 }],
  POST_STEP: 3.4,
  /** the pergola, from the ortho, lat/lon */
  PERGOLA: [[48.867145, 2.243517], [48.86685, 2.24379]] as [number, number][],
  /** the centre cross's lawn squares: (u, v) of each and its half-size; the weeping standards stand at their corners, this far out */
  SQUARES: [{ u: 0, v: -13, h: 4.3 }, { u: 0, v: -0.8, h: 4.3 }, { u: 0.4, v: 11.4, h: 4.3 }],
  WEEP_OUT: 0.9,
  /** the kiosk, lat/lon, its knoll's height and radius, the kiosk's radius */
  KIOSK: [48.867007, 2.244715] as [number, number],
  KNOLL_H: 1.8,
  KNOLL_R: 5.2,
  KIOSK_R: 2.3,
}
const ORIGIN: [number, number] = [48.8673, 2.2442]

const M_LAT = 111320
const enOf = ([lat, lon]: [number, number]): { x: number; z: number } => ({
  x: (lon - ORIGIN[1]) * M_LAT * Math.cos((ORIGIN[0] * Math.PI) / 180), z: (lat - ORIGIN[0]) * M_LAT,
})
/** the garden frame (u, v) → local (x east, z north) */
const uvOf = (u: number, v: number): { x: number; z: number } => {
  const b = (R.BEARING * Math.PI) / 180
  return { x: u * Math.sin(b) + v * Math.cos(b), z: u * Math.cos(b) - v * Math.sin(b) }
}

export function bagatelleRoseraie(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
  // the garlands
  R.APSES.forEach((a, ai) => {
    const arc = (a.span * Math.PI) / 90
    const n = Math.max(2, Math.round((arc * a.r) / R.POST_STEP))
    const heads: [number, number, number][] = []
    for (let k = 0; k <= n; k++) {
      const t = ((k / n) - 0.5) * arc
      const p = uvOf(a.u + a.out * Math.cos(t) * a.r, a.v + Math.sin(t) * a.r)
      const y = g(p.x, p.z)
      const bloom = varietyOf(ai * 5 + (k % 3))
      climber(out, p.x, y, p.z, bloom, ai * 100 + k)
      heads.push([p.x, y + ROSE.CLIMBER_H + 0.05, p.z])
    }
    for (let k = 1; k < heads.length; k++) swag(out, heads[k - 1], heads[k], varietyOf(ai * 5 + 1))
  })
  // the pergola
  pergola(out, enOf(R.PERGOLA[0]), enOf(R.PERGOLA[1]), g, 77)
  // the weeping standards
  R.SQUARES.forEach((s, si) => {
    for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = uvOf(s.u + du * (s.h + R.WEEP_OUT), s.v + dv * (s.h + R.WEEP_OUT))
      standardRose(out, p.x, g(p.x, p.z), p.z, varietyOf(40 + si * 2 + (du > 0 ? 1 : 0)), si * 9 + du + dv * 3, true)
    }
  })
  kiosk(out, enOf(R.KIOSK), g)
}

/**
 * The KIOSQUE DE L'IMPÉRATRICE: a knoll of rockwork with steps up its garden side, a stone floor, eight slender green posts with a
 * lattice rail and a frieze, a flared roof of zinc and a gilt finial. From memory of photographs; −u side (to the roses) open.
 */
function kiosk(out: MeshBuilder, c: { x: number; z: number }, g: (x: number, z: number) => number): void {
  const base = Math.min(g(c.x, c.z), g(c.x + 3, c.z), g(c.x - 3, c.z), g(c.x, c.z + 3), g(c.x, c.z - 3))
  const ROCK = hex('#6a6252'), STONE = hex('#b8ad96'), ZINC = hex('#5d6669'), PALE = hex('#c9c1a6'), GILT: [number, number, number] = [0.72, 0.56, 0.2]
  const K = base + R.KNOLL_H
  crag(out, c.x, base - 0.4, c.z, R.KNOLL_R, R.KNOLL_H + 0.5, R.KNOLL_R * 0.92, 5.3, ROCK)
  // the steps up from the roses (toward −u, the garden)
  const d = uvOf(-1, 0), L = Math.hypot(d.x, d.z), ux = d.x / L, uz = d.z / L
  for (let i = 0; i < 6; i++) {
    const r = R.KNOLL_R + 0.6 - i * 0.55, y = base + ((i + 1) * R.KNOLL_H) / 6
    const px = c.x + ux * r, pz = c.z + uz * r
    strut(out, [px - uz * 0.8, y - 0.09, pz + ux * 0.8], [px + uz * 0.8, y - 0.09, pz - ux * 0.8], 0.6, 0.18, shade(STONE, 0.85), surfaceTag('ashlar'), true)
  }
  prism(out, c.x, c.z, K - 0.5, K, R.KIOSK_R + 0.5, 8, shade(STONE, 0.9), surfaceTag('ashlar'))
  const r = R.KIOSK_R
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2, b = ((i + 1.5) / 8) * Math.PI * 2
    const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, xb = c.x + Math.cos(b) * r, zb = c.z + Math.sin(b) * r
    block(out, x - 0.07, x + 0.07, z - 0.07, z + 0.07, K, K + 2.7, TRELLIS)
    strut(out, [x, K + 0.85, z], [xb, K + 0.85, zb], 0.06, 0.06, TRELLIS, 0, false)
    strut(out, [x, K + 2.45, z], [xb, K + 2.45, zb], 0.07, 0.36, PALE, 0, false)
    // a climber up every other post, as the photographs have it
    if (i % 2 === 0) climber(out, x, K, z, varietyOf(60 + i), 300 + i, 2.3, false)
  }
  prism(out, c.x, c.z, K + 2.65, K + 2.8, r + 0.75, 8, shade(ZINC, 1.05), surfaceTag('metal'))
  prism(out, c.x, c.z, K + 2.8, K + 3.9, r + 0.65, 8, ZINC, surfaceTag('metal'), 0.35)
  prism(out, c.x, c.z, K + 3.9, K + 4.3, 0.14, 6, GILT, surfaceTag('metal'), 0.03)
}
