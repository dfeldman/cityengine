import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import { colonnade } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { balustrade, fitted, palette, rectOn, statue, type F } from './common.ts'

const HX = 35.7
const HZ = 39.6

/**
 * The Palais Brongniart, the old Bourse (Alexandre-Théodore Brongniart, 1808–26; the two side wings by Jean-Baptiste
 * Cavel, 1902–07, which made it a cross): a Corinthian temple of commerce standing free in its square. What a rider
 * sees from all round the Place de la Bourse:
 *
 * - the PERISTYLE: Corinthian columns on every side, on a high podium, the broad flights of steps at the two ends;
 * - over them the entablature and a plain attic, the cella's wall in shadow behind the columns with its tall windows;
 * - the 1900s wings either side, colonnaded the same way.
 *
 * Plan: OSM way 54657155 (the cross, measured in this frame with osmium, 2026-10-29): the temple x ±21.1 by z ±39.6,
 * the wings out to x ±35.7 over z ±25. Long axis z; the ends (±z) are the stepped fronts.
 */
export function brongniart(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e2d8c2')
  const podium = 2.6
  const col = 14.5
  const top = podium + col + 0.2 + 1.8
  const T = { x: 21.1, z: 39.6 }
  const W = { x: 35.7, z: 25 }
  // ---- the podium, its steps at both ends
  block(out, -T.x, T.x, -T.z, T.z, 0, podium, shade(p.stone, 0.93))
  block(out, -W.x, W.x, -W.z, W.z, 0, podium, shade(p.stone, 0.93))
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = s * (T.z + 0.2 + (5 - i) * 0.55)
    block(out, -15, 15, Math.min(z, z + s * 0.6), Math.max(z, z + s * 0.6), 0, (i + 1) * (podium / 6), shade(p.stone, 0.9 + (i % 2) * 0.04))
  }
  // ---- the cella walls, set back behind the columns, with their tall windows in shadow
  const inset = 3.6
  const walls: [number, number, number, number][] = [[-T.x + inset, T.x - inset, -T.z + inset, T.z - inset], [-W.x + inset, W.x - inset, -W.z + inset, W.z - inset]]
  for (const [x0, x1, z0, z1] of walls) {
    block(out, x0, x1, z0, z1, podium, top, shade(p.stone, 0.88))
    for (const [f, plane, t0, t1] of [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]] as [F, number, number, number][]) {
      for (let t = t0 + 3; t < t1 - 2; t += 3.6) rectOn(out, f, plane, t - 0.8, t + 0.8, podium + 2.5, podium + 11.5, [0.2, 0.21, 0.22], 0.05)
    }
  }
  // ---- the peristyle: columns round the temple and along the wings' outer faces
  const run = (ax: number, az: number, bx: number, bz: number, n: number): void =>
    colonnade(out, { x: ax, z: az }, { x: bx, z: bz }, podium, col, n, { radius: 0.62, out: -1.3, colour: p.stone, order: 'corinthian', tier: 'mid', entablature: 1.8, trim: p.trim })
  // (anticlockwise, so each run's outward side is the colonnade's front)
  run(-T.x, -T.z, T.x, -T.z, 12)
  run(T.x, T.z, -T.x, T.z, 12)
  for (const s of [-1, 1]) {
    // the temple's long sides between the wings' corners, and the wings' three faces
    const x = s * T.x
    if (s > 0) {
      run(x, W.z, x, T.z, 4)
      run(x, -T.z, x, -W.z, 4)
      run(T.x, -W.z, W.x, -W.z, 4)
      run(W.x, -W.z, W.x, W.z, 14)
      run(W.x, W.z, T.x, W.z, 4)
    } else {
      run(x, T.z, x, W.z, 4)
      run(x, -W.z, x, -T.z, 4)
      run(-T.x, W.z, -W.x, W.z, 4)
      run(-W.x, W.z, -W.x, -W.z, 14)
      run(-W.x, -W.z, -T.x, -W.z, 4)
    }
  }
  // ---- the attic over it all, the roof and its glass lantern over the hall, statues at the four corners of the steps
  block(out, -T.x, T.x, -T.z, T.z, top, top + 3.0, p.stone)
  block(out, -W.x, W.x, -W.z, W.z, top, top + 3.0, p.stone)
  block(out, -T.x - 0.3, T.x + 0.3, -T.z - 0.3, T.z + 0.3, top + 3.0, top + 3.5, p.trim)
  block(out, -W.x - 0.3, W.x + 0.3, -W.z - 0.3, W.z + 0.3, top + 3.0, top + 3.5, p.trim)
  balustrade(out, -12, 12, -26, 26, top + 3.5, p, { h: 0.9 })
  block(out, -10, 10, -24, 24, top + 3.5, top + 5.5, [0.48, 0.58, 0.62])
  for (const s of [-1, 1]) for (const x of [-16.5, 16.5]) statue(out, x, s * (T.z + 3.6), 0, 3.6, p.trim)
}
