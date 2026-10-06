/**
 * STRAWBERRY HILL, the island in Stow Lake (owner, 2026-10-04: "put some more effort into Strawberry Hill. It's 400
 * feet tall, a dense wood, and has a huge artificial waterfall into the lake, and parts of the tea garden"; "it also
 * has many trails that should be on our trail network").
 *
 *  - HUNTINGTON FALLS (1893): from the reservoir near the summit, a cascade some 30 m down the island's east face
 *    into the lake, white water tumbling over dark boulders in a cleft of rock, widening into a pool at the foot.
 *    Drawn on the ground along OSM's stream (way/120479794, /120479802), its heights from the terrain (`groundAt`).
 *  - The GOLDEN GATE PAVILION (the Chinese Pavilion, a 1981 gift from Taipei; way/120479810), on the island's east
 *    shore: hexagonal, red columns, a concave celadon tile roof (the owner's photograph).
 *
 * The wood and the trails are zones (data/zones: `plant-strawberry-hill`, and `trails: 'bike'` on the hill's own).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { boxAlong } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

/** the falls' line follows OSM's stream (way/120479794, /120479802) from the reservoir east to the lake */
export const FALLS_CENTRE = { x: -5464, z: -2693 }

const h = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

export function huntingtonFalls(out: MeshBuilder, fit: Fit): void {
  /*
   * REBUILT 2026-10-05 from the owner's photograph ("it looks really bad … the real site is quite beautiful"): an
   * ARTIFICIAL CLIFF of tan and brown rock built out of the hillside in great steps, the water falling in thin white
   * ribbons down each sheer face into a pool on the ledge below, ferns and shrubs in every crack, two wooden
   * footbridges with X-braced rails across the falls, and a stone-rimmed pool at the lake's edge.
   *
   * The natural ground falls a steady 45% here (30 m to 3 m over 60 m, measured), so the cliff is the model's own: each
   * terrace a flat ledge of piled rock standing out of the slope, ending in a face 6–10 m sheer. Rocks are flat-shaded
   * (no surface tag: the granite library drew a masonry grid on them and they read as stone towers), broad and low.
   * Local frame: the stream's line along +x, downhill (rotateDeg 0, centre FALLS_CENTRE); z across.
   */
  const g = fit.groundAt ?? ((x: number): number => Math.max(0, (22 - x) * 0.55))
  const WATER: Rgb = [0.42, 0.56, 0.6], FOAM: Rgb = [0.94, 0.96, 0.97], SPRAY: Rgb = [0.8, 0.88, 0.92]
  const WOOD: Rgb = [0.46, 0.3, 0.2], WOOD_DK: Rgb = [0.34, 0.22, 0.15]
  const rockC = (k: number): Rgb => {
    const t = h(k, 4), m = h(k, 5)
    // (weathered tan, brown and mossy grey, set dark: the lit material brightens them)
    const base: Rgb = m < 0.25 ? [0.27, 0.28, 0.22] : t < 0.5 ? [0.37, 0.31, 0.25] : [0.29, 0.25, 0.21]
    const v = 0.9 + h(k, 6) * 0.2
    return [base[0] * v, base[1] * v, base[2] * v]
  }
  const GREENS: Rgb[] = [[0.13, 0.22, 0.09], [0.17, 0.26, 0.11], [0.11, 0.19, 0.09], [0.2, 0.28, 0.12]]
  const both = (q: [number, number, number][], n: [number, number, number], c: Rgb): void => {
    out.quad(q, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    out.quad([...q].reverse() as [number, number, number][], [-n[0], -n[1], -n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
  // the stream bends a little across the hill
  const zAt = (x: number): number => -3 + ((x + 26) / 48) * 6
  /** the terraces: [from x, face x, ledge level], each ledge standing out of the slope down to its sheer face */
  const tiers: [number, number, number][] = [
    [-28, -15, g(-28, zAt(-28)) + 0.6],
    [-14, -1, g(-14, zAt(-14)) - 0.5],
    [0, 12, g(0, zAt(0)) - 0.5],
  ]
  const W = 8
  let k = 0
  for (const [ti, [x0, xf, top]] of tiers.entries()) {
    const next = ti + 1 < tiers.length ? tiers[ti + 1][2] : g(xf + 4, zAt(xf + 4))
    // the mass: broad low blocks from below the ground up to the ledge, higher shoulders either side of the channel
    for (let x = x0; x <= xf; x += 2.1) {
      for (let z = -W; z <= W; z += 2.2) {
        k++
        const cz = zAt(x) + z + (h(k, 1) - 0.5) * 0.8
        const side = Math.abs(z) / W
        const lift = side > 0.35 ? 0.6 + side * 3 * h(k, 2) : -0.25
        const y1 = top + lift + (h(k, 3) - 0.5) * 0.4
        // (well into the ground: the model's frame starts at the LOWEST ground under its footprint, the lake shore)
        const y0 = Math.min(g(x, cz) - 2.5 - h(k, 15) * 0.4, y1 - 0.5)
        const r = 1.4 + h(k, 7) * 0.8
        boxAlong(out, x + (h(k, 8) - 0.5) * 0.6, (y0 + y1) / 2, cz, r, (y1 - y0) / 2, r * (0.7 + h(k, 10) * 0.4), h(k, 13) * Math.PI, rockC(k), 0)
      }
    }
    // the face: boulders stacked down it, proud by turns, so it is craggy and not a wall of columns
    for (let y = next - 0.5; y < top; y += 1.3) {
      for (let z = -W + 1; z <= W - 1; z += 1.7) {
        k++
        if (Math.abs(z) < 3) continue   // the fall's own slot, clear of the blocks' reach
        // angular blocks at all headings, staggered in and out: prisms read as columns of masonry, then as lampshades
        const r = 1 + h(k, 7) * 1.1
        const cx = xf + 0.2 + h(k, 2) * 1.6
        const yy = y + (h(k, 11) - 0.5) * 0.8
        const hh = r * (0.45 + h(k, 3) * 0.35)
        boxAlong(out, cx, yy + hh, zAt(xf) + z + (h(k, 12) - 0.5) * 0.8, r, hh, r * (0.6 + h(k, 9) * 0.5), h(k, 14) * Math.PI, rockC(k), 0)
      }
    }
    // the slot behind the fall, darker, and the water: a pool along the ledge, then thin white ribbons down the face
    const zc = zAt(xf)
    both([[xf + 0.4, next, zc - 2.8], [xf + 0.4, next, zc + 2.8], [xf + 0.4, top, zc + 2.8], [xf + 0.4, top, zc - 2.8]], [1, 0, 0], [0.2, 0.17, 0.14])
    // the slot's rock sides
    for (const sz of [-1, 1]) boxAlong(out, xf + 1.3, (next + top) / 2, zc + sz * 2.6, 1.2, (top - next) / 2, 0.4, 0, rockC(k + sz * 31), 0)
    // (one face, up: a pair back to back is two coplanar surfaces to the depth buffer)
    out.quad([[x0 + 2, top + 0.12, zAt(x0 + 2) + 1.2], [xf + 0.9, top + 0.12, zc + 1.4], [xf + 0.9, top + 0.12, zc - 1.4], [x0 + 2, top + 0.12, zAt(x0 + 2) - 1.2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WATER, 0)
    const ribbons = ti === 0 ? [[-0.8, 1.0], [0.8, 0.7]] : [[-0.2, 1.6]]
    for (const [dz, w] of ribbons) {
      for (let s = 0; s < 3; s++) {
        const zz = zc + dz - w / 2 + (s * w) / 3
        both([[xf + 1.4, top + 0.1, zz], [xf + 1.4, top + 0.1, zz + w / 3], [xf + 2.0 + s * 0.15, next + 0.2, zz + w / 3], [xf + 2.0 + s * 0.15, next + 0.2, zz]], [1, 0, 0], s === 1 ? SPRAY : FOAM)
      }
    }
    prism(out, xf + 2.2, zc, next - 0.05, next + 0.35, 1.6, 10, FOAM, 0, 1.2)
    // greenery: ferns and shrubs on the ledge and in the cracks of the shoulders
    for (let n = 0; n < 26; n++) {
      k++
      const x = x0 + h(k, 1) * (xf - x0 + 1)
      const z = (h(k, 2) < 0.5 ? -1 : 1) * (1.8 + h(k, 3) * (W - 1.5))
      const r = 0.6 + h(k, 4) * 1.1
      const y = top + (Math.abs(z) / W > 0.35 ? 0.6 + (Math.abs(z) / W) * 1.5 * h(k, 5) : 0)
      prism(out, x, zAt(x) + z, y - 0.2, y + r * (0.8 + h(k, 6)), r, 6, GREENS[n % GREENS.length], 0, r * 0.35)
    }
  }
  // the two footbridges across the falls, on the upper ledges just above their faces: plank decks, posts, X-braced rails
  for (const [bx, top] of [[tiers[0][1] - 2.5, tiers[0][2]], [tiers[1][1] - 2.5, tiers[1][2]]] as [number, number][]) {
    const zc = zAt(bx), y = top + 0.9, half = 3.4
    box(out, bx, y, zc, 0.8, 0.07, half, WOOD, 0)
    for (const sx of [-0.75, 0.75]) {
      for (let zz = -half; zz <= half + 0.01; zz += half) box(out, bx + sx, y + 0.55, zc + zz, 0.06, 0.55, 0.06, WOOD_DK, 0)
      box(out, bx + sx, y + 1.08, zc, 0.05, 0.05, half, WOOD, 0)
      box(out, bx + sx, y + 0.12, zc, 0.04, 0.04, half, WOOD, 0)
      for (const [za, zb] of [[-half, 0], [0, half]]) {
        strut(out, [bx + sx, y + 0.12, zc + za], [bx + sx, y + 1.05, zc + zb], 0.04, 0.04, WOOD, 0)
        strut(out, [bx + sx, y + 1.05, zc + za], [bx + sx, y + 0.12, zc + zb], 0.04, 0.04, WOOD, 0)
      }
    }
  }
  // the pool at the foot, by the lake, rimmed with rounded stones
  const xl = tiers[2][1] + 6, zl = zAt(xl), yl = g(xl, zl)
  prism(out, xl, zl, yl - 0.2, yl + 0.22, 6.5, 16, WATER, surfaceTag('glass'))
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 1.6 - 0.8 + Math.PI, r = 0.5 + h(i, 8) * 0.6
    prism(out, xl + Math.cos(a) * 6.6, zl + Math.sin(a) * 6.6, yl - 2.5, yl + r * 0.9, r, 6, rockC(i + 900), 0, r * 0.6)
  }
}

export function goldenGatePavilion(out: MeshBuilder, fit: Fit): void {
  /*
   * From the owner's photograph (2026-10-04): HEXAGONAL — six red columns on a white-balustraded stone terrace at the
   * water, a carved frieze of blue-green and gold under the eaves, and one sweeping CONCAVE roof of pale celadon
   * glazed tile whose six hips curve up at their ends, a celadon bulb finial on top.
   */
  const R = Math.max(3.2, Math.min(fit.hx, fit.hz) * 0.95)
  const stone = surfaceTag('granite'), tile = surfaceTag('tile')
  const RED: Rgb = [0.74, 0.14, 0.13], CELADON: Rgb = [0.5, 0.76, 0.68], FRIEZE: Rgb = [0.32, 0.55, 0.55], WHITE: Rgb = [0.9, 0.9, 0.87]
  const hex = (r: number, k: number): [number, number] => [Math.cos((k / 6) * Math.PI * 2) * r, Math.sin((k / 6) * Math.PI * 2) * r]
  // the terrace and its white balustrade: a rail on posts round the hexagon
  prism(out, 0, 0, -0.3, 0.6, R + 1.3, 6, [0.6, 0.6, 0.58], stone)
  for (let k = 0; k < 6; k++) {
    const [ax, az] = hex(R + 1.1, k), [bx, bz] = hex(R + 1.1, k + 1)
    strut(out, [ax, 1.45, az], [bx, 1.45, bz], 0.14, 0.12, WHITE, stone)
    for (let t = 0; t < 1; t += 0.25) {
      const px = ax + (bx - ax) * t, pz = az + (bz - az) * t
      box(out, px, 1.05, pz, 0.11, 0.45, 0.11, WHITE, stone)
    }
  }
  // the six red columns, and the frieze ring over them
  for (let k = 0; k < 6; k++) { const [cx, cz] = hex(R, k); prism(out, cx, cz, 0.6, 4.3, 0.24, 10, RED, 0) }
  prism(out, 0, 0, 4.3, 4.85, R + 0.15, 6, FRIEZE, 0)
  prism(out, 0, 0, 4.85, 5.0, R + 0.3, 6, RED, 0)
  // the concave roof: a wide shallow skirt, steepening in bands to the top
  const bands: [number, number, number][] = [[5.0, R + 2.0, R + 1.1], [5.45, R + 1.1, R * 0.62], [6.3, R * 0.62, R * 0.32], [7.4, R * 0.32, 0.25]]
  let y = 5.0
  for (const [y0, r0, r1] of bands) {
    const y1 = y0 === 5.0 ? 5.45 : y0 === 5.45 ? 6.3 : y0 === 6.3 ? 7.4 : 8.3
    prism(out, 0, 0, y0, y1, r0, 6, CELADON, tile, r1)
    y = y1
  }
  // the six hips, curving up at their ends
  for (let k = 0; k < 6; k++) {
    const [ex, ez] = hex(R + 2.0, k), [mx, mz] = hex(R + 1.1, k), [tx, tz] = hex(0.3, k)
    strut(out, [tx, y - 0.1, tz], [mx, 5.5, mz], 0.18, 0.18, CELADON, tile)
    strut(out, [mx, 5.5, mz], [ex * 1.08, 5.75, ez * 1.08], 0.2, 0.2, CELADON, tile)
  }
  // the bulb finial
  prism(out, 0, 0, y, y + 0.4, 0.25, 8, CELADON, tile, 0.4)
  prism(out, 0, 0, y + 0.4, y + 1.0, 0.4, 8, CELADON, tile, 0.12)
  prism(out, 0, 0, y + 1.0, y + 1.3, 0.12, 8, CELADON, tile, 0.04)
}

/**
 * THE MUSIC CONCOURSE (1894, rebuilt 2005), between the de Young and the Academy of Sciences, the bandshell at its
 * south-west end — a sunken oval of tan decomposed granite under a GRID of pollarded London plane trees, their
 * knobbed limbs carrying low flat canopies, lawn panels between the rows and fountains down the axis. OSM maps the
 * lawns and the three fountain basins; the city drew the rest as open park with scattered palms (views audit,
 * 2026-10-04). Standalone, centred on the middle fountain; local +x runs along the axis (rotateDeg set in the
 * manifest), +z across it.
 */
export function musicConcourse(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ?? (() => 0)
  const HL = 100, HW = 52
  const DG: Rgb = [0.6, 0.54, 0.44], BARK: Rgb = [0.56, 0.52, 0.45], LEAF: Rgb = [0.26, 0.37, 0.19], STONE: Rgb = [0.78, 0.76, 0.71]
  const inOval = (x: number, z: number): boolean => (x / HL) ** 2 + (z / HW) ** 2 < 1
  const fountains = [-49, 0, 49]
  const nearFountain = (x: number, z: number): boolean => fountains.some((f) => Math.hypot(x - f, z) < 14)
  // the promenade of tan gravel down the axis
  const strip = (x0: number, x1: number, z0: number, z1: number): void => {
    for (let x = x0; x < x1; x += 4) {
      const xa = x, xb = Math.min(x1, x + 4)
      out.quad([[xa, g(xa, z0) + 0.06, z0], [xb, g(xb, z0) + 0.06, z0], [xb, g(xb, z1) + 0.06, z1], [xa, g(xa, z1) + 0.06, z1]].reverse() as [number, number, number][],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], DG, 0)
    }
  }
  strip(-HL * 0.95, HL * 0.95, -7, 7)
  // the grid: rows across the axis every 8 m, trees every 8 m along each, out to the oval, clear of the promenade and
  // the fountains
  for (let x = -HL + 8; x < HL - 4; x += 8) {
    for (let z = -HW + 6; z < HW - 2; z += 8) {
      if (Math.abs(z) < 10 || !inOval(x, z) || nearFountain(x, z)) continue
      const y = g(x, z)
      // the trunk, the knuckled limbs pruned back to knobs, the low flat canopy they carry
      prism(out, x, z, y, y + 3.4, 0.32, 5, BARK, 0, 0.26, false)
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4
        strut(out, [x, y + 3.2, z], [x + Math.cos(a) * 1.2, y + 4.7, z + Math.sin(a) * 1.2], 0.2, 0.2, BARK, 0, false)
      }
      prism(out, x, z, y + 4.6, y + 6.6, 3.6, 6, LEAF, 0, 3.0)
    }
  }
  // the fountains' stone rims (OSM maps the basins' water), and in each a pedestal and a bowl. The middle one is the
  // RIDEOUT FOUNTAIN (Commons "Rideout Fountain - Golden Gate Park - San Francisco, CA - 01.jpg", 2026-10-05): a
  // bronze bowl on a pedestal, a stone figure on it wrestling a swan whose neck arches over its head, and a ring of
  // jets round the pool arching in onto the bowl. It and the side ones were a grey spike in the water.
  const FOAM: Rgb = [0.93, 0.96, 0.98], BRONZE: Rgb = [0.5, 0.38, 0.2], PALE: Rgb = [0.86, 0.83, 0.76]
  for (const [i, f] of fountains.entries()) {
    const r = i === 1 ? 11 : 4.5, y = g(f, 0)
    prism(out, f, 0, y, y + 0.6, r + 0.5, 20, STONE, surfaceTag('granite'), r + 0.5)
    prism(out, f, 0, y, y + 0.7, r, 20, [0.5, 0.62, 0.68], surfaceTag('glass'))
    const big = i === 1
    const pr = big ? 1 : 0.6, bowlY = y + (big ? 1.9 : 1.3), bowlR = big ? 2.8 : 1.6
    prism(out, f, 0, y + 0.6, bowlY - 0.3, pr, 10, STONE, surfaceTag('granite'), pr * 0.6)
    prism(out, f, 0, bowlY - 0.3, bowlY + 0.35, pr * 0.6, 16, BRONZE, surfaceTag('metal'), bowlR)
    prism(out, f, 0, bowlY + 0.3, bowlY + 0.38, bowlR - 0.15, 16, [0.5, 0.62, 0.68], surfaceTag('glass'))
    if (!big) {
      strut(out, [f, bowlY + 0.3, 0], [f, bowlY + 1.6, 0], 0.12, 0.05, FOAM, 0, false)
      continue
    }
    // the figure and the swan, pale stone
    const fy = bowlY + 0.35
    prism(out, f, 0, fy, fy + 1.3, 0.42, 8, PALE, surfaceTag('ashlar'), 0.32)
    prism(out, f, 0, fy + 1.3, fy + 2, 0.36, 8, PALE, surfaceTag('ashlar'), 0.28)
    prism(out, f + 0.08, 0, fy + 2, fy + 2.35, 0.2, 8, PALE, surfaceTag('ashlar'), 0.17)
    strut(out, [f + 0.25, fy + 0.6, 0.25], [f + 0.35, fy + 2.9, 0.1], 0.14, 0.11, PALE, surfaceTag('ashlar'))
    strut(out, [f + 0.35, fy + 2.9, 0.1], [f - 0.1, fy + 3.2, 0.05], 0.11, 0.09, PALE, surfaceTag('ashlar'))
    strut(out, [f - 0.1, fy + 3.2, 0.05], [f - 0.35, fy + 2.85, 0], 0.09, 0.06, PALE, surfaceTag('ashlar'))
    for (const sg of [-1, 1]) strut(out, [f + 0.05, fy + 1.8, sg * 0.3], [f + 0.3, fy + 2.7, sg * 0.15], 0.08, 0.07, PALE, surfaceTag('ashlar'))
    // the ring of jets, from a pipe ring a stride out from the bowl, arching in onto its rim (each a parabola in
    // five pieces: two straight struts read as a ring of spider's legs)
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a)
      const r0 = bowlR + 1.3, r1 = bowlR - 0.2, y0 = y + 0.7, y1 = bowlY + 0.3, top = bowlY + 1.3
      const at = (t: number): [number, number, number] => {
        const rr = r0 + (r1 - r0) * t
        return [f + c * rr, y0 + (y1 - y0) * t + 4 * (top - Math.max(y0, y1)) * t * (1 - t) + (Math.max(y0, y1) - y0) * t * 0, sn * rr]
      }
      for (let j = 0; j < 5; j++) strut(out, at(j / 5), at((j + 1) / 5), 0.035, 0.035, FOAM, 0, false)
    }
  }
}


/**
 * THE CAROUSEL, Koret Children's Quarter, Golden Gate Park (1914 Herschell-Spillman in its 1941 WPA rotunda;
 * way/1554375367, ~25 m round). Commons "Golden Gate Park carousel building 01.jpg" (2026-10-05): a cream rotunda, a
 * ring of fluted Doric columns with tall dark-framed glazed bays between them, a deep plain entablature, and over it a
 * low grey standing-seam metal dome on a stepped drum, with a small lantern. Was a `midcentury-slab` recipe that drew a
 * dark banded drum. Standalone of its own outline: centred on the fit.
 */
export function goldenGateCarousel(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.88, 0.85, 0.75], GLASS: Rgb = [0.12, 0.13, 0.14], METAL: Rgb = [0.36, 0.38, 0.4]
  const st = surfaceTag('stucco'), metal = surfaceTag('metal')
  const R = Math.max(8, Math.min(fit.hx, fit.hz) - 0.3)
  const N = 12
  const COL = 6.4, ENT = 1.8
  // the glazed drum behind the columns, the colonnade, the entablature
  prism(out, 0, 0, 0, 0.4, R + 0.6, 24, [0.7, 0.68, 0.62], st)
  prism(out, 0, 0, 0.4, COL + 0.4, R - 0.8, 24, GLASS, surfaceTag('glass'))
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2
    prism(out, Math.sin(a) * (R - 0.2), Math.cos(a) * (R - 0.2), 0.4, 1, 0.62, 8, CREAM, st)
    prism(out, Math.sin(a) * (R - 0.2), Math.cos(a) * (R - 0.2), 1, COL + 0.4, 0.42, 12, CREAM, st, 0.38)
  }
  prism(out, 0, 0, COL + 0.4, COL + 0.4 + ENT, R + 0.3, 24, CREAM, st)
  prism(out, 0, 0, COL + 0.4 + ENT, COL + 0.4 + ENT + 0.35, R + 0.6, 24, CREAM, st)
  // the stepped drum and the low ribbed dome, and its lantern
  const y0 = COL + 0.75 + ENT
  prism(out, 0, 0, y0, y0 + 0.9, R - 0.2, 24, METAL, metal, R - 1.4)
  prism(out, 0, 0, y0 + 0.9, y0 + 1.3, R - 1.6, 24, METAL, metal)
  const D = 3.6
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6, t1 = (i + 1) / 6
    const r0 = (R - 1.6) * Math.cos(t0 * Math.PI / 2), r1 = (R - 1.6) * Math.cos(t1 * Math.PI / 2) + 0.01
    prism(out, 0, 0, y0 + 1.3 + D * Math.sin(t0 * Math.PI / 2), y0 + 1.3 + D * Math.sin(t1 * Math.PI / 2), r0, 24, METAL, metal, Math.max(1.2, r1))
  }
  prism(out, 0, 0, y0 + 1.3 + D, y0 + 2.2 + D, 1.2, 12, METAL, metal, 0.9)
}


/**
 * THE PRESIDIO TIDE GAUGE HOUSE (way/934659297), at the end of the old Coast Guard pier off Crissy Field: the oldest
 * continuously operating tide gauge in the Western Hemisphere (1854; here since 1927). NOAA Greater Farallones "Pier &
 * Tide Gauge House": a tiny white clapboard house with a red hipped roof on the pier head, the pier itself a long timber
 * deck on piles running back to the shore by the sanctuary building. It stood alone on the water — OSM maps the house
 * but not this pier. Front 224: the shore is south-west, local −z; the pier runs that way.
 */
export function tideGaugeHouse(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.93, 0.92, 0.88], RED: Rgb = [0.62, 0.17, 0.13], DECK: Rgb = [0.52, 0.45, 0.36], PILE: Rgb = [0.3, 0.26, 0.22]
  const wood = surfaceTag('clapboard')
  const W = 2.4, H = 3.2
  // the pier head and the long deck to the shore (local −z), on piles
  const L = 110, DW = 2.2
  box(out, 0, 0.15, 0, 4.2, 0.15, 4.2, DECK, wood)
  box(out, 0, 0.15, -4.2 - L / 2, DW, 0.15, L / 2, DECK, wood)
  for (let z = -4; z > -4.2 - L; z -= 6) for (const s of [-1, 1]) box(out, s * (DW - 0.15), -1.6, z, 0.15, 1.75, 0.15, PILE, 0)
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) box(out, x, -1.6, z, 0.18, 1.75, 0.18, PILE, 0)
  // the rail along both sides
  for (const s of [-1, 1]) box(out, s * (DW - 0.05), 1.2, -4.2 - L / 2, 0.04, 0.04, L / 2, WHITE, 0)
  // the house
  box(out, 0, 0.3 + H / 2, 0, W, H / 2, W, WHITE, wood)
  box(out, 0, 1.8, W + 0.02, 0.5, 1.1, 0.04, [0.3, 0.32, 0.34], 0)
  for (const s of [-1, 1]) box(out, s * (W + 0.02), 2.2, 0, 0.04, 0.5, 0.6, [0.2, 0.22, 0.25], 0)
  prism(out, 0, 0, 0.3 + H, 0.3 + H + 1.6, (W + 0.4) * Math.SQRT2, 4, RED, surfaceTag('tile'), 0.15)
}

export const STRAWBERRY_HILL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { huntingtonFalls, goldenGatePavilion, musicConcourse, goldenGateCarousel, tideGaugeHouse }
