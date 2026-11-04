/**
 * L'IMMEUBLE FULTON (Agence Bernard Bühler, 2017; 11 quai d'Austerlitz / 2 rue Fulton, 13e; OSM way 553589502, 11 levels;
 * owner's Street View, 2026-11-03; ArchDaily, parisjetaime): 87 social flats over two shops. A base of four storeys in pale
 * textured concrete with small square windows and a glazed shopfront, and over it two towers to eleven floors, split by a
 * gap, every floor hung with glass boxes — the balconies — staggered and turned, jutting over the street, their glazing
 * yellow to lime to green as you move, a few blue.
 *
 * North-up frame (rotateDeg 0): local x east, z north, metres from 48.8381 N 2.3720 E; OSM's ring read with osmium.
 * The towers stand on the block's two arms either side of the garden notch. y = 0 the street.
 */
import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { placed } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ccw, walls } from '../monuments/common.ts'

const RING = [
  [1.3, 21.2], [-5.6, 32.2], [-5.0, 32.6], [5.0, 38.9], [13.1, 44.0], [17.9, 47.0], [22.2, 42.4], [24.6, 44.5], [38.3, 29.4],
  [35.7, 27.1], [42.9, 15.3], [32.9, 3.4], [25.6, 9.8], [25.8, 11.1], [29.2, 10.6], [25.5, 19.6], [14.9, 28.2], [11.6, 27.9],
].map(([x, z]) => ({ x, z }))

const CONCRETE: Rgb = [0.74, 0.73, 0.7]
const PANEL: Rgb = [0.82, 0.83, 0.83]
const GLASS: Rgb[] = [[0.86, 0.84, 0.32], [0.78, 0.86, 0.36], [0.62, 0.8, 0.46], [0.88, 0.8, 0.28], [0.7, 0.84, 0.5], [0.36, 0.48, 0.82]]

/** A tower on the base: a pale core and, floor by floor, glass boxes jutting from its faces at angles. */
function tower(out: MeshBuilder, cx: number, cz: number, turn: number, base: number, floors: number, seed: number): void {
  const t = new MeshBuilder()
  const plain = surfaceTag('stucco')
  const H = 3.0
  const top = base + floors * H
  const hw = 4.8, hd = 5.6
  box(t, 0, (base + top) / 2, 0, hw, (top - base) / 2, hd, PANEL, surfaceTag('panel'))
  // slit windows up the core
  for (let f = 0; f < floors; f++) for (const s of [-1, 1]) box(t, s * (hw + 0.02), base + f * H + 1.5, (f % 3 - 1) * 1.8, 0.02, 0.9, 0.35, [0.25, 0.3, 0.4], surfaceTag('glass'))
  let r = seed
  const rnd = (): number => ((r = (r * 16807) % 2147483647) / 2147483647)
  for (let f = 0; f < floors; f++) {
    const y = base + f * H + 0.15
    const boxes = 4 + Math.floor(rnd() * 2)
    for (let b = 0; b < boxes; b++) {
      // which face, how far along it, how far out, how turned
      // one box per face each floor, a fifth on a random face; wide, deep, turned hard
      const face = b < 4 ? (b + f) % 4 : Math.floor(rnd() * 4)
      const along = (rnd() - 0.5) * 5
      const w = 5.5 + rnd() * 4, d = 2.6 + rnd() * 2.2
      const yaw = (rnd() - 0.5) * 1.1
      const c = GLASS[Math.floor(rnd() * (rnd() < 0.12 ? GLASS.length : GLASS.length - 1))]
      const q = new MeshBuilder()
      // the box sits with its back on the face, sticking out along +z: dark soffit, coloured glass sides, a thin top edge
      box(q, 0, 0.12, d / 2, w / 2, 0.12, d / 2, [0.3, 0.31, 0.32], surfaceTag('concrete'))
      box(q, 0, 1.45, d / 2, w / 2, 1.2, d / 2, c, plain)
      box(q, 0, 2.62, d / 2, w / 2 + 0.03, 0.04, d / 2 + 0.03, [0.55, 0.58, 0.55], surfaceTag('metal'))
      const [fx, fz, ang] = face === 0 ? [along, hd, 0] : face === 1 ? [hw, along, Math.PI / 2] : face === 2 ? [along, -hd, Math.PI] : [-hw, along, -Math.PI / 2]
      const lifted = new MeshBuilder()
      placed(lifted, q, ang + yaw, fx, fz)
      for (let i = 1; i < lifted.positions.length; i += 3) lifted.positions[i] += y
      placed(t, lifted, 0, 0, 0)
    }
  }
  // the roof: a parapet of the same glass round the top
  box(t, 0, top + 0.6, 0, hw + 0.3, 0.6, hd + 0.3, GLASS[1], plain)
  placed(out, t, turn, cx, cz)
}

export function immeubleFulton(out: MeshBuilder, _fit: Fit): void {
  const plan = ccw(RING)
  const base = 12.4
  // the base: the block's whole outline, four storeys of textured concrete, a flat roof
  walls(out, plan, 0, base, CONCRETE)
  capPolygonWithHoles(out, [plan], base, [0.6, 0.6, 0.58], 0)
  // small square windows along every face, at each storey above the ground floor
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], b = plan[(i + 1) % plan.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 4) continue
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const n = Math.floor(L / 4)
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n
      for (const y of [4.8, 8.0, 11.0]) {
        const x = a.x + (b.x - a.x) * t + nx * 0.05, z = a.z + (b.z - a.z) * t + nz * 0.05
        const u = new MeshBuilder()
        box(u, 0, 0, 0, 0.55, 0.65, 0.04, (k + Math.round(y)) % 5 === 0 ? [0.25, 0.35, 0.75] : [0.3, 0.32, 0.36], surfaceTag('glass'))
        const lifted = new MeshBuilder()
        placed(lifted, u, Math.atan2(nx, nz), x, z)
        for (let j = 1; j < lifted.positions.length; j += 3) lifted.positions[j] += y
        placed(out, lifted, 0, 0, 0)
      }
    }
  }
  // the glazed shopfront along the Rue Fulton end (the south-west face), two storeys of glass in steel
  {
    const a = plan.find((p) => p.x === 1.3 && p.z === 21.2) ?? plan[0]
    const b = { x: 11.6, z: 27.9 }
    const L = Math.hypot(b.x - a.x, b.z - a.z), nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const u = new MeshBuilder()
    box(u, 0, 3.4, 0, L / 2, 3.4, 0.6, [0.5, 0.6, 0.6], surfaceTag('glass'))
    placed(out, u, Math.atan2(-nx, -nz), (a.x + b.x) / 2 - nx * 0.6, (a.z + b.z) / 2 - nz * 0.6)
  }
  // the two towers on the arms either side of the garden notch, turned to the block's own grid
  const turn = Math.atan2(5.0 - -5.6, 38.9 - 32.2)
  tower(out, 7.5, 36.5, turn, base, 11, 1871)
  tower(out, 33.0, 19.0, turn, base, 11, 4409)
}
