/**
 * THE PARC FLORAL DE PARIS (1969, Daniel Collin):
 * - the PAVILLONS (Les Cèdres, Cyprès, Chênes, Tilleuls, Bambous, Hortensias): open polygonal halls on slim dark
 *   timber posts under broad, low pyramid roofs of dark brown tile with deep eaves — one parametric builder;
 * - the ESPACE DELTA: the concert stage, a pale tensile canopy, scalloped at its rim, lifted on raking masts over a
 *   stone-walled terrace by the lake.
 * The Hall de la Pinède (a plain exhibition shed) and Le Bosquet / Bonsaïs stay generic. Plans: OSM w26007001 (Delta)
 * and the `building=roof` ways named per entry; every roof follows fit.ring. Refs: Commons
 * (docs/landmarks/refs/vincennes/floral/). Roofs are radially symmetric, so the front only sets the canopy's opening.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism } from '../../../models.ts'
import { block, hex, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'

const TILE: Rgb = hex('#5a4038'), TILE_U: Rgb = hex('#6e5448'), POST: Rgb = hex('#3c3430'), FLOOR: Rgb = hex('#a8a296'),
  CANVAS: Rgb = hex('#ece6d8'), CANVAS_U: Rgb = hex('#c8c2b4'), MAST: Rgb = hex('#9aa0a4'), STONE: Rgb = hex('#b4aa98')

type P = { x: number; z: number }
const centre = (r: P[]): P => ({ x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length })
const toward = (p: P, c: P, f: number): P => ({ x: c.x + (p.x - c.x) * f, z: c.z + (p.z - c.z) * f })
const ringOf = (fit: Fit): P[] => fit.ring && fit.ring.length >= 3 ? fit.ring
  : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

// pavilion: eave height, apex height, posts inset from the roof edge (fraction toward centre), post radius, floor
const PV_EAVE = 2.7, PV_APEX = 6.2, PV_INSET = 0.8, PV_POST_R = 0.14, PV_FLOOR = 0.25, PV_FASCIA = 0.3

export function pavillonFloral(out: MeshBuilder, fit: Fit): void {
  const y = 0, ring = ringOf(fit), c = centre(ring), n = ring.length
  const floor = ring.map((p) => toward(p, c, PV_INSET))
  for (let i = 0; i < n; i++) {                                                           // the paved floor as a fan
    const a = floor[i], b = floor[(i + 1) % n]
    quadN(out, [[c.x, y + PV_FLOOR, c.z], [a.x, y + PV_FLOOR, a.z], [b.x, y + PV_FLOOR, b.z], [b.x, y + PV_FLOOR, b.z]], [0, 1, 0], FLOOR)
    prism(out, a.x, a.z, y + PV_FLOOR, y + PV_EAVE, PV_POST_R, 6, POST)
  }
  const ye = y + PV_EAVE, ya = y + PV_APEX
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], ox = (a.x + b.x) / 2 - c.x, oz = (a.z + b.z) / 2 - c.z
    const A: [number, number, number] = [a.x, ye, a.z], B: [number, number, number] = [b.x, ye, b.z]
    quadN(out, [A, B, [c.x, ya, c.z], [c.x, ya, c.z]], [ox, 4, oz], TILE)                // roof face
    quadN(out, [A, B, [c.x, ye + 0.4, c.z], [c.x, ye + 0.4, c.z]], [0, -1, 0], TILE_U)  // soffit
    quadN(out, [[a.x, ye - PV_FASCIA, a.z], [b.x, ye - PV_FASCIA, b.z], B, A], [ox, 0, oz], POST) // fascia
    const pa = floor[i], pb = floor[(i + 1) % n]                                             // ring beam on the posts
    quadN(out, [[pa.x, ye - 0.35, pa.z], [pb.x, ye - 0.35, pb.z], [pb.x, ye, pb.z], [pa.x, ye, pa.z]], [ox, 0, oz], POST)
  }
}

// Delta: terrace height, canopy rim and crown heights, crown size (fraction), rim scallop depth, mast count/rake
const DL_TERRACE = 1.2, DL_RIM = 6.4, DL_CROWN = 8.6, DL_CROWN_F = 0.3, DL_SAG = 0.9, DL_MAST_F = 0.82, DL_MAST_TOP = 9.4

export function espaceDelta(out: MeshBuilder, fit: Fit): void {
  const y = 0, ring = ringOf(fit), c = centre(ring), n = ring.length
  block(out, -fit.hx * 0.9, fit.hx * 0.9, -fit.hz * 0.9, fit.hz * 0.9, y, y + DL_TERRACE, STONE)      // stage terrace
  const yr = y + DL_RIM, yc = y + DL_CROWN
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], m = toward({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, c, 0.94)
    const ca = toward(a, c, DL_CROWN_F), cb = toward(b, c, DL_CROWN_F), ox = m.x - c.x, oz = m.z - c.z
    // each bay in two halves, its rim sagging between corner points (the scallops)
    const halves: [P, P, P, P, number, number][] = [[a, m, toward(m, c, DL_CROWN_F / 0.94), ca, yr, yr - DL_SAG],
      [m, b, cb, toward(m, c, DL_CROWN_F / 0.94), yr - DL_SAG, yr]]
    for (const [p0, p1, p2, p3, h0, h1] of halves) {
      const q: [number, number, number][] = [[p0.x, h0, p0.z], [p1.x, h1, p1.z], [p2.x, yc, p2.z], [p3.x, yc, p3.z]]
      quadN(out, q, [ox, 3, oz], CANVAS)
      quadN(out, [q[3], q[2], q[1], q[0]], [-ox, -3, -oz], CANVAS_U)
    }
    const top = toward(a, c, DL_MAST_F)                                                       // raking mast to each corner
    prism(out, a.x, a.z, y + DL_TERRACE, yr, 0.12, 6, MAST)
    prism(out, top.x, top.z, yr, y + DL_MAST_TOP, 0.1, 6, MAST)
  }
  for (let i = 0; i < n; i++) {                                                               // the crown cap
    const a = toward(ring[i], c, DL_CROWN_F), b = toward(ring[(i + 1) % n], c, DL_CROWN_F)
    quadN(out, [[a.x, yc, a.z], [b.x, yc, b.z], [c.x, yc + 0.5, c.z], [c.x, yc + 0.5, c.z]], [0, 1, 0], CANVAS)
  }
}
