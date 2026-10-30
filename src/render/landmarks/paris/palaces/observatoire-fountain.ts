import { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, pts } from './common.ts'

const FIXED = 0
const HX = 12
const HZ = 12

/** OSM's basin (relation 1004052's outer ring) round the node, in this frame (osmium, 2026-10-29), simplified */
const BASIN = pts([-10.1, 0.1, -9.1, 0.0, -9.1, -1.2, -8.8, -3.0, -8.0, -5.0, -6.9, -6.6, -5.3, -8.1, -3.4, -9.1, -1.0, -9.7, 1.4, -9.7,
  4.1, -8.9, 6.3, -7.4, 7.9, -5.4, 8.9, -3.2, 9.2, -0.6, 10.2, -0.6, 10.7, 7.3, 5.3, 7.8, 5.9, 12.0, -4.3, 12.0, -4.7, 7.8, -9.9, 7.9])

/**
 * The Fontaine de l'Observatoire, Fontaine des Quatre-Parties-du-Monde (Davioud's fountain, 1874: Carpeaux's group,
 * Frémiet's horses), at the south end of the Jardin Marco-Polo on the axis between the Luxembourg and the Observatoire —
 * OSM node 1248594605, its basin relation 1004052. In green bronze:
 *
 * - the GROUP on its rock in the middle: the four women — Europe, Asia, Africa, America — turning round, their arms up
 *   holding the armillary sphere with its band of the zodiac and the globe inside it;
 * - round them in the water the eight rearing HORSES with fishes' tails, and the turtles, spouting toward the group;
 * - the basin's stone kerb (the water is the city's own).
 *
 * Local frame square to the meridian, +z north up the garden toward the Luxembourg.
 */
export function observatoireFountain(out: MeshBuilder, fit: Fit): void {
  // the garden falls toward the Observatoire: the kerb follows the ground under it, the group stands on the ground at
  // the middle — not all of it on the footprint's lowest point
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const g = (x: number, z: number): number => fit.groundAt?.(x * sx, z * sz) ?? 0
  fitted(out, fit, HX, HZ, (q) => draw(q, g))
}

function draw(base: MeshBuilder, g: (x: number, z: number) => number): void {
  const out = new MeshBuilder()
  const p = palette('#d6ccb5')
  const bronze: [number, number, number] = [0.27, 0.4, 0.34]
  const dark = shade(bronze, 0.75)
  // ---- the kerb round OSM's basin, open toward the channel at the north end (the garden's water carries on)
  for (let i = 0; i < BASIN.length; i++) {
    const e = edgeAt(BASIN, i)
    if (e.mid.z > 11.5) continue
    boxAlong(base, e.mid.x, g(e.mid.x, e.mid.z) + 0.3, e.mid.z, e.L / 2 + 0.25, 0.5, 0.3, e.heading, p.stone)
  }
  // ---- the rock and the pedestal
  prism(out, 0, 0, -0.2, 1.4, 3.9, 12, [0.42, 0.42, 0.38], FIXED, 3.2)
  prism(out, 0, 0, 1.4, 4.2, 1.9, 12, p.stone, FIXED, 1.6)
  prism(out, 0, 0, 4.2, 4.6, 2.2, 12, p.trim, FIXED)
  // ---- the four women, back to back, turning; their raised arms up to the sphere
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    const x = Math.sin(a) * 0.95
    const z = Math.cos(a) * 0.95
    prism(out, x, z, 4.6, 6.4, 0.55, 8, bronze, FIXED, 0.42)                                        // skirts
    prism(out, x, z, 6.4, 7.6, 0.4, 8, bronze, FIXED, 0.33)                                         // bodies
    box(out, x * 1.04, 7.85, z * 1.04, 0.2, 0.22, 0.2, bronze, FIXED)                                // heads
    // the arms, reaching up and in to the band
    for (const s of [-1, 1]) {
      const b = a + s * 0.55
      box(out, Math.sin(b) * 0.85, 8.35, Math.cos(b) * 0.85, 0.09, 0.7, 0.09, bronze, FIXED)
    }
  }
  // ---- the armillary sphere: the meridian rings and the zodiac band, the globe inside
  const c = { y: 9.9, r: 1.25 }
  const n = 16
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    // the band, tilted
    const P = (a: number, rr: number): [number, number, number] => [Math.cos(a) * rr, c.y + Math.sin(a) * rr * 0.4, Math.sin(a) * rr]
    const p0 = P(a0, c.r); const p1 = P(a1, c.r)
    box(out, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2, 0.16, 0.14, 0.16, bronze, FIXED)
    // two meridians
    for (const t of [0, Math.PI / 2]) {
      const m = (a: number): [number, number, number] => [Math.cos(t) * Math.cos(a) * c.r, c.y + Math.sin(a) * c.r, Math.sin(t) * Math.cos(a) * c.r]
      const q0 = m(a0); const q1 = m(a1)
      box(out, (q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, (q0[2] + q1[2]) / 2, 0.07, 0.07, 0.07, dark, FIXED)
    }
  }
  prism(out, 0, 0, c.y - 0.55, c.y + 0.55, 0.55, 10, dark, FIXED, 0.55)
  prism(out, 0, 0, c.y + 1.25, c.y + 1.7, 0.06, 6, bronze, FIXED)
  // ---- the eight sea-horses rearing round the rock, the turtles between them
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const r = 6.2
    const x = Math.sin(a) * r
    const z = Math.cos(a) * r
    const h = Math.atan2(-x, -z)
    // the body leaning up toward the group, the forelegs pawing, the fish's tail curling back in the water
    boxAlong(out, x * 0.93, 1.3, z * 0.93, 0.45, 0.55, 1.1, h, bronze)
    boxAlong(out, x * 0.86, 2.2, z * 0.86, 0.3, 0.5, 0.35, h, bronze)                              // neck and head
    boxAlong(out, x * 0.84, 2.75, z * 0.84, 0.22, 0.22, 0.4, h, bronze)
    boxAlong(out, x * 0.85, 1.35, z * 0.85, 0.42, 0.1, 0.12, h, dark)                              // forelegs
    boxAlong(out, x * 1.08, 0.45, z * 1.08, 0.3, 0.35, 0.8, h, dark)                               // the tail
    const t = a + Math.PI / 8
    block(out, Math.sin(t) * 4.6 - 0.45, Math.sin(t) * 4.6 + 0.45, Math.cos(t) * 4.6 - 0.45, Math.cos(t) * 4.6 + 0.45, 0, 0.45, dark)
  }
  // the group, lifted onto the ground at the middle of the basin
  const y = g(0, 0)
  const b0 = base.positions.length / 3
  for (let i = 0; i < out.positions.length; i += 3) base.positions.push(out.positions[i], out.positions[i + 1] + y, out.positions[i + 2])
  for (const v of out.normals) base.normals.push(v)
  for (const v of out.uvs) base.uvs.push(v)
  for (const v of out.colors) base.colors.push(v)
  for (const v of out.indices) base.indices.push(b0 + v)
}
