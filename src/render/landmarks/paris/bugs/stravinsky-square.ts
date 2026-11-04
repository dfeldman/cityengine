/**
 * THE PLACE IGOR-STRAVINSKY'S OWN FURNITURE (owner's Street View, 2026-11-03: "the main thing are the 8 ventilation pipes …
 * and the murals"). Everything OSM has here that the bake leaves out, and what it never had:
 *
 * - the EIGHT VENTILATION PIPES of the IRCAM's studios under the square (OSM ways 202498507…514, `man_made=chimney`,
 *   unnamed, so the bake drops them as infrastructure): white tubes turning over at the top into a grilled mouth — four
 *   tall ones in a row before the Bains-Douches, three short ones at the foot of the IRCAM tower, one alone before the murals;
 * - the GLASS ROOF over the studios (OSM way 227834262, `building=roof` on layer 1, which the bake leaves out as a canopy):
 *   a long strip of glazing on a steel grid beside the fountain, railed all round;
 * - the MURALS on the blind east walls on the square's west side, from the south: Jef Aérosol's "Chuuuttt!" (the grey face
 *   with its finger to its lips, its red arrow), Shepard Fairey's "Knowledge + Action = Power" (the blue robed figure holding
 *   an open book), and Invader's big tiled space invader high on the next wall. Drawn as coarse pixel pictures in vertex
 *   colour — what they are from across the square, not their detail.
 *
 * The frame is north-up: local x east, z north (rotateDeg 0), metres from 48.8594 N 2.3512 E, as read off OSM with osmium.
 * y = 0 is the square's paving.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const WHITE: Rgb = [0.92, 0.92, 0.9]

/** A pipe from (x, z): up `h`, then an elbow turning toward bearing `deg`, ending in a round grilled mouth. */
function pipe(out: MeshBuilder, x: number, z: number, h: number, r: number, deg: number, y0 = 0): void {
  const metal = surfaceTag('metal')
  const dx = Math.sin((deg * Math.PI) / 180), dz = Math.cos((deg * Math.PI) / 180)
  prism(out, x, z, y0, y0 + 0.25, r * 1.25, 14, [0.7, 0.7, 0.68], surfaceTag('concrete'))     // its footing
  prism(out, x, z, y0 + 0.25, y0 + h, r, 14, WHITE, metal, r, false)
  // the elbow: a quarter turn of radius R, as a run of short tubes
  const R = r * 1.3
  let prev: V3 = [x, y0 + h, z]
  const n = 6
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2)
    const q: V3 = [x + dx * R * (1 - Math.cos(a)), y0 + h + R * Math.sin(a), z + dz * R * (1 - Math.cos(a))]
    beam(out, prev, q, r, WHITE)
    prev = q
  }
  // the mouth: a flared lip and the dark grille across it, facing out along the bearing
  const [mx, my, mz] = prev
  const ux = -dz, uz = dx                                            // across the mouth, horizontal
  const ring = 16
  for (let i = 0; i < ring; i++) {
    const a0 = (i / ring) * Math.PI * 2, a1 = ((i + 1) / ring) * Math.PI * 2
    const P = (a: number, rr: number, out_: number): V3 => [mx + ux * Math.cos(a) * rr + dx * out_, my + Math.sin(a) * rr, mz + uz * Math.cos(a) * rr + dz * out_]
    beam(out, P(a0, r * 1.18, 0.12), P(a1, r * 1.18, 0.12), 0.06, WHITE)
    out.quad([P(a0, 0, 0.05), P(a0, r * 1.12, 0.1), P(a1, r * 1.12, 0.1), P(a1, 0, 0.05)], [dx, 0, dz], UV, [0.32, 0.33, 0.34], metal)
  }
}

/** A railing along a→b: posts every 1.5 m, a top rail and a mid rail. */
function rail(out: MeshBuilder, a: V3, b: V3): void {
  const grey: Rgb = [0.42, 0.44, 0.46]
  const L = Math.hypot(b[0] - a[0], b[2] - a[2])
  const n = Math.max(1, Math.round(L / 1.5))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t
    beam(out, [x, y, z], [x, y + 1.1, z], 0.025, grey)
  }
  beam(out, [a[0], a[1] + 1.1, a[2]], [b[0], b[1] + 1.1, b[2]], 0.03, grey)
  beam(out, [a[0], a[1] + 0.55, a[2]], [b[0], b[1] + 0.55, b[2]], 0.02, grey)
}

/** The glass roof over the studios: a strip of panes on a steel grid, the corners A, B (along one edge) and the width out to the east. */
function glassRoof(out: MeshBuilder, g: (x: number, z: number) => number): void {
  // OSM's strip, its long edges ~(−9.2, −14.3)→(22.4, 45.2) on the east and (−16.6, −10.0)→(16.9, 47.9) on the west
  // (each corner over the ground under it: the model's base is the lowest ground in its whole box, below the paving here)
  const W0: V3 = [-16.6, g(-16.6, -10.0) + 0.9, -10.0], W1: V3 = [16.9, g(16.9, 47.9) + 0.9, 47.9]
  const E0: V3 = [-9.2, g(-9.2, -14.3) + 0.3, -14.3], E1: V3 = [22.4, g(22.4, 45.2) + 0.3, 45.2]
  const glass = surfaceTag('glass')
  const steel: Rgb = [0.5, 0.52, 0.55]
  const L = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]
  const n = 34, m = 4
  for (let i = 0; i < n; i++) {
    const a0 = L(W0, W1, i / n), a1 = L(W0, W1, (i + 1) / n), b0 = L(E0, E1, i / n), b1 = L(E0, E1, (i + 1) / n)
    for (let j = 0; j < m; j++) {
      const p = L(a0, b0, j / m), q = L(a1, b1, j / m), r = L(a1, b1, (j + 1) / m), s = L(a0, b0, (j + 1) / m)
      // both faces: which way the strip's corners wind depends on OSM's order
      out.quad([p, q, r, s], [0.06, 0.99, -0.03], UV, [0.24, 0.3, 0.34], glass)
      out.quad([s, r, q, p], [0.06, 0.99, -0.03], UV, [0.24, 0.3, 0.34], glass)
    }
    beam(out, a0, b0, 0.05, steel)
  }
  for (let j = 0; j <= m; j++) beam(out, L(W0, E0, j / m), L(W1, E1, j / m), 0.05, steel)
  // its low walls down to the paving, and the railing round it
  for (const [p, q] of [[W0, W1], [E0, E1]] as [V3, V3][]) {
    const dirx = q[0] - p[0], dirz = q[2] - p[2], l = Math.hypot(dirx, dirz)
    out.quad([[p[0], 0, p[2]], [q[0], 0, q[2]], [q[0], q[1], q[2]], [p[0], p[1], p[2]]], [dirz / l, 0, -dirx / l], UV, [0.6, 0.6, 0.58], surfaceTag('concrete'))
  }
  rail(out, W0, W1)
  rail(out, E0, E1)
  rail(out, W0, E0)
  rail(out, W1, E1)
}

/**
 * A pixel picture on a wall: `rows` top to bottom, one character a cell, coloured by `pal` ('.' = leave the wall), on
 * the vertical plane along a→b (ground points), from y0 up to y1, a hand's width proud toward `n`.
 */
function mural(out: MeshBuilder, a: [number, number], b: [number, number], y0: number, y1: number, rows: string[], pal: Record<string, Rgb>, lift = 0): void {
  y0 += lift
  y1 += lift
  const tag = surfaceTag('stucco')
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz)
  const nx = dz / L, nz = -dx / L                                    // the face's outward normal: right of a→b
  const H = rows.length, Wd = Math.max(...rows.map((r) => r.length))
  for (let j = 0; j < H; j++) for (let i = 0; i < Wd; i++) {
    const ch = rows[j][i]
    const c = ch && pal[ch]
    if (!c) continue
    const t0 = i / Wd, t1 = (i + 1) / Wd
    const yb = y1 - ((j + 1) / H) * (y1 - y0), yt = y1 - (j / H) * (y1 - y0)
    const P = (t: number, y: number): V3 => [a[0] + dx * t + nx * 0.06, y, a[1] + dz * t + nz * 0.06]
    out.quad([P(t0, yb), P(t1, yb), P(t1, yt), P(t0, yt)], [nx, 0, nz], UV, c, tag)
  }
}

// Jef Aérosol's "Chuuuttt!": a man's face in grey and black, his finger to his lips, the red arrow by his head
const CHUT = [
  'wwwwwwwwwwww',
  'wwwwkkkkwwww',
  'wwwkggggkwww',
  'wwkgggggkkww',
  'wwkgwwkggkww',
  'wwkgwkkgggkw',
  'wwkgggggggkw',
  'wrkggggkggkw',
  'wrrkgggkggkw',
  'wrwkggggggkw',
  'wwwkggkkkgkw',
  'wwwwkgkwkgkw',
  'wwwwkgkwkkww',
  'wwwwkkkwkgww',
  'wwwwwkgkkgww',
  'wwwwwkgkggww',
  'wwwwwwkgggww',
  'wwwwwwwkkwww',
]
// Shepard Fairey's "Knowledge + Action = Power": a robed figure under a rayed halo, an open book in its hands, on blue
const FAIREY = [
  'BBBBBBBBBBBBBB',
  'BbbbbbbbbbbbbB',
  'BbBBBppppBBBbB',
  'BbBBppPPppBBbB',
  'BbBppPccPppBbB',
  'BbBppPccPppBbB',
  'BbBBpPPPPpBBbB',
  'BbBppPPPPppBbB',
  'BbBpPPPPPPpBbB',
  'BbBpPPPPPPpBbB',
  'BbBpPwwwwPpBbB',
  'BbBpPwkkwPpBbB',
  'BbBpPwwwwPpBbB',
  'BbBpPPPPPPpBbB',
  'BbBppPPPPppBbB',
  'BbBBBppppBBBbB',
  'BbbbbbbbbbbbbB',
  'BBwwwwwwwwwwBB',
  'BBBBBBBBBBBBBB',
]
// Invader: the big tiled invader, white with grey and a red eye
const INVADER = [
  '..ww.....ww..',
  '...ww...ww...',
  '..wwwwwwwww..',
  '.wwrwwwwgwww.',
  'wwwwwwwwwwwww',
  'w.wwwwwwwww.w',
  'w.w.......w.w',
  '...gg...gg...',
]

export function stravinskySquare(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0
  // the ground at a wall's foot: the lower of its two ends, a little out from the face
  const gw = (a: [number, number], b: [number, number]): number => Math.min(g(a[0] + 0.8, a[1]), g(b[0] + 0.8, b[1]))
  // the pipes: their mouths turn east, toward the fountain
  const face = 118
  for (const [x, z] of [[-1.1, 15.8], [-0.4, 17.3], [0.4, 18.9], [1.3, 20.3]]) pipe(out, x, z, 8.5, 0.7, face, g(x, z))
  for (const [x, z] of [[9.5, 35.7], [10.2, 37.2], [11.0, 38.7]]) pipe(out, x, z, 3.2, 0.6, face, g(x, z))
  pipe(out, -8.3, 2.5, 3.0, 0.65, face, g(-8.3, 2.5))
  // the remaining low tubes, a cluster of thin vents before the murals
  for (let i = 0; i < 5; i++) prism(out, -10.5 + i * 0.35, 4.5 + i * 0.6, g(-10, 5), g(-10, 5) + 3.2, 0.09, 8, WHITE, surfaceTag('metal'))

  glassRoof(out, g)

  // the murals, on the east faces of the blind walls (running south to north, so they face east)
  const grey: Rgb = [0.55, 0.55, 0.55], k: Rgb = [0.13, 0.13, 0.14], w: Rgb = [0.88, 0.87, 0.84], r: Rgb = [0.75, 0.15, 0.13]
  mural(out, [-21.0, -15.3], [-16.5, -7.7], 2, 19, CHUT, { w, k, g: grey, r }, gw([-21.0, -15.3], [-16.5, -7.7]))
  const B: Rgb = [0.27, 0.42, 0.6], b: Rgb = [0.48, 0.62, 0.74], p: Rgb = [0.72, 0.8, 0.84], P: Rgb = [0.36, 0.5, 0.66], c: Rgb = [0.92, 0.88, 0.76]
  mural(out, [-13.4, -2.6], [-10.4, 2.8], 4, 22, FAIREY, { B, b, p, P, c, w: [0.93, 0.9, 0.82], k: [0.2, 0.25, 0.32] }, gw([-13.4, -2.6], [-10.4, 2.8]))
  mural(out, [-10.4, 2.8], [-7.4, 8.1], 12, 20, INVADER, { w: [0.94, 0.94, 0.92], g: [0.45, 0.46, 0.48], r }, gw([-10.4, 2.8], [-7.4, 8.1]))
  // the graffiti band along the foot of the walls: blocks of colour
  const tags: Rgb[] = [[0.82, 0.3, 0.55], [0.18, 0.18, 0.2], [0.3, 0.42, 0.75], [0.9, 0.86, 0.8], [0.7, 0.2, 0.2], [0.2, 0.55, 0.45]]
  const segs: [[number, number], [number, number]][] = [[[-21.0, -15.3], [-16.5, -7.7]], [[-13.4, -2.6], [-10.4, 2.8]], [[-10.4, 2.8], [-7.4, 8.1]]]
  segs.forEach(([a, bb], si) => {
    const row = Array.from({ length: 10 }, (_, i) => 'abcdef'[(i * 7 + si * 3) % 6]).join('')
    mural(out, a, bb, 0.3, 3.8, [row, row.split('').reverse().join('')], { a: tags[0], b: tags[1], c: tags[2], d: tags[3], e: tags[4], f: tags[5] }, gw(a, bb))
  })
  void box
}
