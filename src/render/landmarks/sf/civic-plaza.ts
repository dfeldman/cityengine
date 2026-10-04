/**
 * CIVIC CENTER PLAZA, in front of City Hall (owner, 2026-10-03: "the park across from city hall could use some work.
 * in reality it has a playground and sport courts and a little restaurant … large silver towers in it, presumably
 * ventilation for the parking structures below"). It was a lawn with trees scattered on it. Built here:
 *
 *   - the PROMENADE on the axis from City Hall to Larkin: a wide band of tan decomposed granite between paved edges
 *     (Mapillary 3043992125927801), paved at street level so the lawn stops at it;
 *   - the AVENUE OF FLAGS down both sides of it — the 26 poles at OSM's own nodes (n7797674715…32);
 *   - the double rows of clipped London plane trees outside them, flat-topped as they are pruned;
 *   - the two Helen Diller playgrounds at the Larkin end — furnished by the city from OSM since the bake learned
 *     playgrounds (render/playground.ts); here only the south one's spiderweb net, and the clearings;
 *   - the stainless VENTILATION STACKS of the garage under the plaza standing in the lawns, and the garage's
 *     stair-and-lift kiosks;
 *   - a pair of basketball half-courts by McAllister, placed by eye (OSM has none; its café, at Grove, is OSM's own).
 *
 * Placed by lat/lon with no rotation, so local x is east and z is north, and everything here is in metres from the
 * plaza's centre (37.779491, −122.417617). The grid here runs 9° off east (OSM's outline: −81° on its long side).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { climbingNet } from '../../playground.ts'
import { court } from '../../sports.ts'

const C = { lat: 37.779491, lon: -122.417617 }
const L = (lat: number, lon: number): [number, number] => [(lon - C.lon) * 87960, (lat - C.lat) * 111132]
const A = (9 * Math.PI) / 180
const U = { x: Math.cos(A), z: Math.sin(A) }       // along the promenade (east)
const V = { x: -Math.sin(A), z: Math.cos(A) }      // across it (north)
const at = (u: number, v: number): [number, number] => [U.x * u + V.x * v, U.z * u + V.z * v]

const DG: Rgb = [0.72, 0.62, 0.46]
const PAVE: Rgb = [0.62, 0.61, 0.58]
const STEEL: Rgb = [0.78, 0.8, 0.82]


/** a flat quad on the ground at height y, its corners in (u, v) */
function slab(out: MeshBuilder, u0: number, u1: number, v0: number, v1: number, y: number, c: Rgb, tag = 0): void {
  const p = (u: number, v: number): [number, number, number] => { const [x, z] = at(u, v); return [x, y, z] }
  out.quad([p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

export function civicCenterPlaza(out: MeshBuilder, _fit: Fit): void {
  const HALF_U = 58
  // the promenade: paved edges and the granite band down its middle; the city paves under it (no lawn)
  const ring = [at(-HALF_U, -15), at(HALF_U, -15), at(HALF_U, 15), at(-HALF_U, 15)].map(([x, z]) => ({ x, z }))
  out.grounds.push(ring)
  slab(out, -HALF_U, HALF_U, -15, 15, 0.03, PAVE, surfaceTag('concrete'))
  slab(out, -HALF_U, HALF_U, -7, 7, 0.08, DG, surfaceTag('concrete'))

  // (the Avenue of Flags is the city's flag layer now — render/flags.ts stands a real flag on each of OSM's 26 poles;
  // drawn here too, every one of them had a plain coloured square on a second pole in front of it, owner 2026-10-03)

  // the planes: two rows each side, REAL trees from the library planted along each row (owner, 2026-10-03: "we don't
  // need to use square blocks as trees, we have real trees") — a strip a metre wide, one every 7 m
  for (const v of [-25, -31, 25, 31]) {
    const strip = [at(-HALF_U + 4, v - 0.6), at(HALF_U - 4, v - 0.6), at(HALF_U - 4, v + 0.6), at(-HALF_U + 4, v + 0.6)].map(([x, z]) => ({ x, z }))
    out.decks.push({ ring: strip, y: 0.5, trees: true, spacing: 7, keepOff: 0 })
  }

  // the garage's ventilation stacks: brushed steel drums in the lawns, and its stair kiosks
  for (const [u, v] of [[-38, -50], [-12, -52], [-38, 50], [-12, 52]]) {
    const [x, z] = at(u, v)
    prism(out, x, z, 0, 6.5, 1.3, 16, STEEL, surfaceTag('metal'))
    prism(out, x, z, 6.5, 6.9, 1.45, 16, [0.6, 0.62, 0.64], surfaceTag('metal'))
    for (let k = 0; k < 4; k++) prism(out, x, z, 1.2 + k * 1.2, 1.35 + k * 1.2, 1.32, 16, [0.5, 0.52, 0.54], surfaceTag('metal'))
  }
  for (const [u, v] of [[-50, -30], [-50, 30]]) {
    const [x, z] = at(u, v)
    box(out, x, 1.6, z, 2.2, 1.6, 2.2, [0.55, 0.58, 0.6], surfaceTag('glass'))
    box(out, x, 3.36, z, 2.5, 0.12, 2.5, [0.85, 0.85, 0.83], surfaceTag('metal'))
  }

  // the Helen Diller playgrounds, on OSM's rectangles (−81° along their long side), from the playground kit
  for (const [lat, lon] of [[37.77995, -122.417336], [37.779121, -122.417168]] as [number, number][]) {
    const [x, z] = L(lat, lon)
    const fit = { sport: 'playground' as const, x, z, heading: (-81 * Math.PI) / 180, len: 36, wid: 21.5 }
    // (the kit itself is the city's now: every OSM playground is furnished by the courts layer since the 2026-10-03
    // bake, and drawn here as well it was two playgrounds in one place, z-fighting — owner, 37.779145, -122.417235)
    // (a clearing: the park scatter planted trees in it)
    const c = Math.cos(fit.heading), sn = Math.sin(fit.heading)
    out.grounds.push([[-18, -10.75], [18, -10.75], [18, 10.75], [-18, 10.75]].map(([u, v]) => ({ x: x + u * c - v * sn, z: z + u * sn + v * c })))
  }
  // (the south one is the spiderweb: a big net over its kit)
  { const [x, z] = L(37.779121, -122.417168); climbingNet(out, x - 6, z + 2, 4.5) }

  // two basketball half-courts by McAllister — by eye (the café is OSM's own, at Grove: way/941705060)
  for (const k of [0, 1]) {
    const [x, z] = at(-50 + k * 19, 64)
    court(out, { sport: 'basketball', x, z, heading: A + Math.PI / 2, len: 14, wid: 15.24, half: true })
  }
}

export const CIVIC_PLAZA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { civicCenterPlaza }
