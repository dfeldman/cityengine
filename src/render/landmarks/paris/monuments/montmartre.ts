import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, pedimentOn } from '../palaces/common.ts'
import { FIXED, graded, type P2, ring, walls } from './common.ts'
import { pal, roseOn } from './churches.ts'

/*
 * The hilltop of Montmartre beside the Sacré-Cœur: the old village church, and the two windmills left of the thirty
 * that once turned on the butte.
 */

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-PIERRE DE MONTMARTRE (consecrated 1147), one of the oldest churches of Paris, between the Place du Tertre and
 * the basilica: small and low — a plain 18th-century west front on the Rue du Mont-Cenis with its three doors and
 * round window, the nave and broad aisles under brown tile, the Romanesque apse rounded under a conical roof, and the
 * square BELL TOWER over the choir with its paired arches and pyramid roof to 26 m (OSM's part 653147916). Against the
 * white basilica behind it, the village church is its foil.
 *
 * OSM's outline (way 23884336, dropped by the bake) and its ten parts gave the city a windowed office block; the
 * model replaces them. Frame: −z the west front (bearing 274.6), +x south.
 */
const SPX = 15.55
const SPZ = 27.1
const SP_PLAN: P2[] = ring([
  -4.8, -26.5, 9.9, -27.0, 15.4, -25.9, 15.5, 13.1, 14.7, 17.2, 14.0, 21.7, 9.8, 22.1, 7.5, 25.2, 3.3, 25.6, 0.1, 23.1,
  -0.6, 21.1, -4.0, 21.2, -4.5, 18.7, -5.2, 12.6, -7.0, 6.6, -15.5, 6.6, -15.5, -2.5, -5.0, -2.5,
])

export function saintPierreMontmartre(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, SPX, SPZ, (q) => saintPierre(q))
}

function saintPierre(out: MeshBuilder): void {
  const p = pal('#d8ccb0')
  const tile = hex('#7a5f4f')
  const cx = 4.9
  // the low walls all round (the chapels, sacristy), the aisles' broad roof, the nave over it
  walls(out, SP_PLAN, 0, 6.5, p.stone, shade(tile, 0.95))
  roof(out, cx - 10.0, cx + 10.0, -25.8, 12.7, 7.0, 6.0, 10.0, 0.01, tile)
  block(out, cx - 10.0, cx + 10.0, -25.8, 12.7, 6.4, 7.0, p.stone)
  block(out, cx - 5.6, cx + 5.6, -25.8, 12.7, 7.0, 12.5, p.stone)
  roof(out, cx - 5.9, cx + 5.9, -26.0, 12.9, 12.5, 3.8, 5.9, 0.01, tile)
  for (let z = -22; z < 11; z += 4.4) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', cx + s * 5.6, z, 9.0, 1.0, 2.2, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', s < 0 ? -4.8 : 15.5, z, 1.6, 1.2, 3.4, p.glass)
    }
  }
  // the Romanesque apse: half-round, its tall arched windows between buttresses, the conical roof
  const az = 15.0
  const n = 10
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI
    const r = 5.3
    const P = (a: number, rr: number, y: number): [number, number, number] => [cx + Math.sin(a) * rr, y, az + Math.cos(a) * rr + 5]
    const am = (a0 + a1) / 2
    out.quad([P(a0, r, 0), P(a1, r, 0), P(a1, r, 10), P(a0, r, 10)], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    out.quad([P(a0, r + 0.5, 10), P(a1, r + 0.5, 10), P(a1, 0, 13.4), P(a0, 0, 13.4)], [Math.sin(am), 0.8, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], tile, FIXED)
    if (i % 3 === 1) {
      const ex = Math.cos(am) * 0.55
      const ez = -Math.sin(am) * 0.55
      const m = P(am, r + 0.05, 0)
      out.quad([[m[0] - ex, 3.0, m[2] - ez], [m[0] + ex, 3.0, m[2] + ez], [m[0] + ex, 7.6, m[2] + ez], [m[0] - ex, 7.6, m[2] - ez]], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.glass, FIXED)
    }
  }
  block(out, cx - 5.3, cx + 5.3, 12.5, 20, 0, 10, p.stone)
  // the bell tower over the north side of the choir: plain to 17, the belfry's paired arches, the pyramid roof to 26
  const tx = -2.2
  const tz = 15.6
  block(out, tx - 2.95, tx + 2.95, tz - 3.1, tz + 3.1, 0, 17.0, p.stone)
  block(out, tx - 3.1, tx + 3.1, tz - 3.25, tz + 3.25, 16.6, 17.0, p.trim)
  block(out, tx - 2.85, tx + 2.85, tz - 3.0, tz + 3.0, 17.0, 22.0, p.stone)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? tz - 3.0 : f === '+z' ? tz + 3.0 : f === '-x' ? tx - 2.85 : tx + 2.85
    const t = f === '-z' || f === '+z' ? tx : tz
    for (const d of [-1.05, 1.05]) archOn(out, f, plane, t + d, 17.6, 1.1, 3.4, p.dark)
  }
  block(out, tx - 3.2, tx + 3.2, tz - 3.35, tz + 3.35, 21.8, 22.3, p.trim)
  roof(out, tx - 3.3, tx + 3.3, tz - 3.45, tz + 3.45, 22.3, 3.8, 3.3, 3.45, tile)
  box(out, tx, 26.8, tz, 0.05, 0.7, 0.05, p.dark, FIXED)
  box(out, tx, 27.1, tz, 0.35, 0.05, 0.05, p.dark, FIXED)
  // the west front: the gable of the nave, its round window, the three doors, the aisles' half-gables
  const zf = -26.6
  block(out, -4.8, 15.5, zf, -25.6, 0, 7.0, p.stone)
  block(out, cx - 5.6, cx + 5.6, zf, -25.6, 7.0, 12.5, p.stone)
  pedimentOn(out, '-z', zf, cx - 5.9, cx + 5.9, 12.5, 3.8, 0.4, p.trim)
  roseOn(out, '-z', zf, cx, 9.4, 1.2, p.glass, p.trim)
  archOn(out, '-z', zf, cx, 0.2, 2.2, 4.2, p.dark)
  for (const s of [-1, 1]) archOn(out, '-z', zf, cx + s * 6.2, 0.2, 1.4, 3.2, p.dark)
}

// ---------------------------------------------------------------------------------------------------------------
const WOOD: Rgb = hex('#5a3d2b')
const PLANK: Rgb = hex('#6b4a33')
const SAIL: Rgb = hex('#d9d2c2')

/**
 * A post mill's BODY: the weatherboarded box `w` × `d` from y0 to the eaves, its gabled roof, and its four lattice
 * SAILS on the front (−z) turning about a shaft at height `hub`, `len` each from the hub, at `turn` radians.
 */
function postMill(out: MeshBuilder, w: number, d: number, y0: number, eaves: number, hub: number, len: number, turn: number): void {
  block(out, -w / 2, w / 2, -d / 2, d / 2, y0, eaves, PLANK)
  // the weatherboards: thin dark lines across the sides
  for (let y = y0 + 0.45; y < eaves; y += 0.45) {
    for (const s of [-1, 1]) box(out, s * (w / 2 + 0.02), y, 0, 0.02, 0.03, d / 2, WOOD, FIXED)
  }
  roof(out, -w / 2 - 0.3, w / 2 + 0.3, -d / 2 - 0.2, d / 2 + 0.2, eaves, 1.8, w / 2 + 0.3, 0.01, shade(WOOD, 0.8))
  box(out, 0, y0 + 2.2, -d / 2 - 0.05, 0.25, 0.3, 0.05, hex('#2a2a2a'), FIXED)
  // the windshaft and the cross of the four sails, each a whip with its lattice of bars
  beam(out, [0, hub, -d / 2 + 0.5], [0, hub + 0.15, -d / 2 - 0.7], 0.22, WOOD)
  const zc = -d / 2 - 0.75
  for (let k = 0; k < 4; k++) {
    const a = turn + (k * Math.PI) / 2
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    beam(out, [0, hub, zc], [ux * len, hub + uy * len, zc], 0.13, WOOD)
    // the lattice: a frame along one side of the whip, from 1.2 m out to the tip
    const vx = -uy
    const vy = ux
    const wd = len * 0.24
    for (const f of [0.18, 1]) beam(out, [ux * len * f + vx * wd, hub + uy * len * f + vy * wd, zc], [ux * len * f, hub + uy * len * f, zc], 0.05, SAIL)
    beam(out, [ux * len * 0.18 + vx * wd, hub + uy * len * 0.18 + vy * wd, zc], [ux * len + vx * wd, hub + uy * len + vy * wd, zc], 0.05, SAIL)
    for (let j = 1; j < 9; j++) {
      const f = 0.18 + (0.82 * j) / 9
      beam(out, [ux * len * f, hub + uy * len * f, zc], [ux * len * f + vx * wd, hub + uy * len * f + vy * wd, zc], 0.035, SAIL)
    }
  }
}

/**
 * THE MOULIN DE LA GALETTE — the Blute-Fin (1622), the elder of the two, in the garden between the Rue Lepic and the
 * Rue Tholozé that Renoir painted dancing: a dark weatherboarded post mill turned on its post, raised on a timber
 * trestle tower over the garden's walls, its sails to ~19 m. OSM's way 77780940 (8.2 m square, the city's 8 m box).
 * Frame: −z the sails toward the Rue Lepic (bearing 190).
 */
export function moulinGalette(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, 4.1, 4.1, (q) => {
    // the trestle: four raking corner posts, braces, a deck at 6 m
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(q, [x * 3.6, 0, z * 3.6], [x * 1.6, 6.2, z * 1.6], 0.22, WOOD)
    for (const y of [1.8, 4.0]) {
      const r = 3.6 - (y / 6.2) * 2.0
      for (const [a, b] of [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[r, r], [-r, r]], [[-r, r], [-r, -r]]] as const) {
        beam(q, [a[0], y, a[1]], [b[0], y, b[1]], 0.1, WOOD)
      }
    }
    block(q, -2.1, 2.1, -2.1, 2.1, 6.0, 6.4, WOOD)
    prism(q, 0, 0, 0, 6.2, 0.35, 8, WOOD, FIXED)
    // the body on its post, the sails turned a little off the cross, the tail pole and ladder down behind
    postMill(q, 3.4, 4.6, 6.4, 11.6, 10.4, 8.6, 0.35)
    beam(q, [0, 7.0, 2.3], [0, 1.0, 6.2], 0.12, WOOD)
    for (let k = 0; k < 9; k++) beam(q, [-0.4, 7.0 - k * 0.65, 2.4 + k * 0.42], [0.4, 7.0 - k * 0.65, 2.4 + k * 0.42], 0.04, WOOD)
  })
}

/**
 * THE MOULIN RADET (first mentioned 1717), on the corner of the Rue Lepic and the Rue Girardon over the restaurant
 * that took the Galette's name: a smaller post mill of brown boards with its sails, standing on the restaurant's
 * roof (OSM's building:part 307906882 inside way 77780866, both 4 m in the bake). Frame: −z the sails toward the
 * corner (bearing 150); the mill stands on a 4 m base, the roof of the building it crowns.
 */
export function moulinRadet(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, 2.8, 2.8, (q) => {
    const stone = hex('#cfc6b4')
    block(q, -2.6, 2.6, -2.6, 2.6, 0, 4.4, stone)
    block(q, -2.8, 2.8, -2.8, 2.8, 4.4, 4.7, shade(stone, 0.9))
    prism(q, 0, 0, 4.7, 6.2, 0.6, 8, WOOD, FIXED, 0.35)
    postMill(q, 3.0, 4.0, 6.2, 10.6, 9.4, 6.4, 0.6)
  })
}
