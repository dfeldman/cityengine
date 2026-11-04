/**
 * THE PALAIS GALLIERA (Ginain, 1878–94; the Musée de la Mode) and THE SQUARE BRIGNOLE-GALLIERA, 16e.
 *
 * Plain east/north metres (rotateDeg 0), origin 48.86572, 2.29666, from OSM relation 1191057 and its parts (osmium on
 * the local pbf, 2026-11-03), heights from IGN's LiDAR HD MNS − MNT:
 * - the MAIN BLOCK x −14..+18, z −32..−1: cornice ~17 m, the balustraded attic to ~18.5, the glass-roofed hall in the
 *   middle (OSM part way 262367203, x −8..+11, z −21..−9) up to ~21;
 * - the GARDEN FRONT (−z, south, toward the Avenue du Président-Wilson; Commons photographs): a rusticated base with
 *   steps, then three tall glazed round arches between engaged Corinthian columns — single between the arches, PAIRED
 *   at the two end bays, which carry a medallion over a niche — a deep entablature, the balustrade with pedestals for
 *   vases over every column. Pedestals in front of the three arches stand empty (the statues are another builder's);
 * - north of the block, the HEMICYCLE (OSM part way 262367189, ~10–11 m): a semicircle of open colonnade, centre
 *   (+0.5, +3), radius 14.5, enclosing the court, its gate pavilion at the apex on the street (x −8..+4, z +21..+29);
 *   and the straight COLONNADE WINGS, z 0..5, out to x ±38, open toward the garden, as the photographs show either side.
 *
 * The square: the railings round OSM way 79232732's ring, gravel walks, clipped trees, empty pedestals on the lawns.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, palette, rectOn, slabOn, type Pal } from './common.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]

/** A curved band: annulus r0..r1 from angle a0 to a1 (radians, 0 = +x, π/2 = +z), y0..y1, all four sides. */
function ring(out: MeshBuilder, cx: number, cz: number, r0: number, r1: number, a0: number, a1: number, y0: number, y1: number, c: Rgb, tag = 0, n = 16): void {
  const P = (r: number, a: number, y: number): V3 => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, b = a0 + ((a1 - a0) * (i + 1)) / n, m = (a + b) / 2
    const no: V3 = [Math.cos(m), 0, Math.sin(m)], ni: V3 = [-no[0], 0, -no[2]]
    out.quad([P(r1, a, y0), P(r1, b, y0), P(r1, b, y1), P(r1, a, y1)], no, UV, c, tag)
    out.quad([P(r0, b, y0), P(r0, a, y0), P(r0, a, y1), P(r0, b, y1)], ni, UV, shade(c, 0.9), tag)
    out.quad([P(r0, a, y1), P(r1, a, y1), P(r1, b, y1), P(r0, b, y1)], [0, 1, 0], UV, c, tag)
    out.quad([P(r0, b, y0), P(r1, b, y0), P(r1, a, y0), P(r0, a, y0)], [0, -1, 0], UV, shade(c, 0.7), tag)
  }
}

function column(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, p: Pal): void {
  box(out, x, y0 + 0.2, z, r * 1.35, 0.2, r * 1.35, p.trim)                    // base
  prism(out, x, z, y0 + 0.4, y1 - 0.5, r, 10, p.stone, 0, r * 0.88)
  prism(out, x, z, y1 - 0.5, y1 - 0.2, r * 0.9, 10, p.trim, 0, r * 1.25)       // capital
  box(out, x, y1 - 0.1, z, r * 1.35, 0.1, r * 1.35, p.trim)                    // abacus
}

function vase(out: MeshBuilder, x: number, z: number, y: number, p: Pal): void {
  box(out, x, y + 0.35, z, 0.4, 0.35, 0.4, p.trim)
  prism(out, x, z, y + 0.7, y + 1.1, 0.18, 8, p.stone, 0, 0.32)
  prism(out, x, z, y + 1.1, y + 1.35, 0.32, 8, p.stone, 0, 0.12)
}

// ---------------------------------------------------------------------------------------------------------------
export function galliera(out: MeshBuilder, _fit: Fit): void {
  const p = palette('#ddd3bd', '#5a6166')
  const glass: Rgb = [0.2, 0.24, 0.27]
  const gt = surfaceTag('glass')
  const X0 = -14, X1 = 18, Z0 = -32, Z1 = -1
  const base = 3.0, cor = 17, cx = (X0 + X1) / 2

  // ---- the main block
  box(out, cx, base / 2, (Z0 + Z1) / 2, (X1 - X0) / 2 + 0.3, base / 2, (Z1 - Z0) / 2 + 0.3, p.deep)    // rusticated base
  for (let y = 0.75; y < base; y += 0.75) box(out, cx, y, Z0 - 0.3, (X1 - X0) / 2 + 0.32, 0.04, 0.03, shade(p.deep, 0.8))
  box(out, cx, (base + cor) / 2, (Z0 + Z1) / 2, (X1 - X0) / 2, (cor - base) / 2, (Z1 - Z0) / 2, p.stone)
  // entablature all round, the frieze and cornice
  box(out, cx, cor - 2.6, (Z0 + Z1) / 2, (X1 - X0) / 2 + 0.25, 0.35, (Z1 - Z0) / 2 + 0.25, p.trim)
  box(out, cx, cor - 0.4, (Z0 + Z1) / 2, (X1 - X0) / 2 + 0.7, 0.4, (Z1 - Z0) / 2 + 0.7, p.trim)
  box(out, cx, cor - 0.9, (Z0 + Z1) / 2, (X1 - X0) / 2 + 0.45, 0.12, (Z1 - Z0) / 2 + 0.45, shade(p.trim, 0.85))
  // the attic: balustrade round the edge, a low lead roof behind, the hall's glass ridge
  balustrade(out, X0 - 0.3, X1 + 0.3, Z0 - 0.3, Z1 + 0.3, cor, p, { h: 1.2 })
  box(out, cx, cor + 0.3, (Z0 + Z1) / 2, (X1 - X0) / 2 - 1, 0.3, (Z1 - Z0) / 2 - 1, p.lead, surfaceTag('metal'))
  {
    const hx0 = -8, hx1 = 11, hz0 = -21, hz1 = -9, y = cor + 0.6, top = 21
    box(out, (hx0 + hx1) / 2, (y + 19) / 2, (hz0 + hz1) / 2, (hx1 - hx0) / 2, (19 - y) / 2, (hz1 - hz0) / 2, p.stone)
    const hm = (hx0 + hx1) / 2
    // a gabled glass roof, ridge along x
    out.quad([[hx0, 19, hz0], [hx1, 19, hz0], [hx1, top, (hz0 + hz1) / 2], [hx0, top, (hz0 + hz1) / 2]], [0, 0.8, -0.6], UV, glass, gt)
    out.quad([[hx1, 19, hz1], [hx0, 19, hz1], [hx0, top, (hz0 + hz1) / 2], [hx1, top, (hz0 + hz1) / 2]], [0, 0.8, 0.6], UV, glass, gt)
    for (const x of [hx0, hx1]) out.quad(x === hx0
      ? [[x, 19, hz1], [x, 19, hz0], [x, top, (hz0 + hz1) / 2], [x, top, (hz0 + hz1) / 2]]
      : [[x, 19, hz0], [x, 19, hz1], [x, top, (hz0 + hz1) / 2], [x, top, (hz0 + hz1) / 2]], [x === hx0 ? -1 : 1, 0, 0], UV, p.stone, 0)
    for (let x = hx0 + 1.5; x < hx1; x += 1.5) box(out, x, top - 0.9, (hz0 + hz1) / 2, 0.05, 0.05, 5.9, p.lead)
    void hm
  }

  // ---- the garden front (−z): end bays with paired columns, three glazed arches between single columns
  const zf = Z0
  const endW = 5.2
  const arches = [X0 + endW, X1 - endW]
  const aw = (arches[1] - arches[0]) / 3
  const colY0 = base, colY1 = cor - 3.0, cr = 0.5
  slabOn(out, '-z', zf, X0 - 0.3, X1 + 0.3, base - 0.3, base, 0.5, p.trim)
  const colsX = [X0 + 0.9, X0 + endW - 0.8, arches[0] + aw, arches[0] + 2 * aw, X1 - endW + 0.8, X1 - 0.9]
  for (const x of colsX) column(out, x, zf - 0.55, colY0, colY1, cr, p)
  // engaged columns on the flanks too
  for (const [xs, f] of [[X0, -1], [X1, 1]] as [number, number][]) for (let z = Z0 + 4; z < Z1 - 1; z += 6) column(out, xs + f * 0.5, z, colY0, colY1, 0.42, p)
  for (let i = 0; i < 3; i++) {
    const t = arches[0] + (i + 0.5) * aw
    archOn(out, '-z', zf, t, base + 0.6, aw - 1.2, 10.0, p.trim, 0.12)          // the archivolt
    archOn(out, '-z', zf, t, base + 0.6, aw - 2.0, 9.6, glass, 0.18)
    // the glazing bars
    for (const dt of [-1.1, 0, 1.1]) rectOn(out, '-z', zf, t + dt - 0.05, t + dt + 0.05, base + 0.6, base + 9.4, p.lead, 0.22)
    for (let y = base + 2; y < base + 9; y += 1.8) rectOn(out, '-z', zf, t - (aw - 2) / 2, t + (aw - 2) / 2, y - 0.04, y + 0.04, p.lead, 0.22)
    slabOn(out, '-z', zf, t - 0.4, t + 0.4, base + 9.7, base + 10.6, 0.25, p.trim)           // keystone
    // the empty pedestal in front, a statue's place
    box(out, t, base + 0.7, zf - 1.5, 0.55, 0.7, 0.55, p.trim)
  }
  // the end bays: a niche under a medallion
  for (const t of [X0 + endW / 2, X1 - endW / 2]) {
    archOn(out, '-z', zf, t, base + 1, 1.8, 4.5, shade(p.stone, 0.75), 0.05)
    prism(out, t, zf - 0.05, base + 7.6, base + 7.75, 0.9, 12, p.trim)
    out.quad([[t - 0.7, base + 6.9, zf - 0.08], [t + 0.7, base + 6.9, zf - 0.08], [t + 0.7, base + 8.3, zf - 0.08], [t - 0.7, base + 8.3, zf - 0.08]], [0, 0, -1], UV, shade(p.stone, 0.8), 0)
  }
  // vases on the balustrade's pedestals over each column
  for (const x of colsX) vase(out, x, zf - 0.3, cor + 1.2, p)
  // the steps down to the garden, full width
  for (let i = 0; i < 6; i++) box(out, cx, base - 0.5 * i - 0.25, zf - 0.3 - 0.45 * (i + 1), (X1 - X0) / 2 - 1, 0.25, 0.45 * (i + 1) / 2 + 0.1, p.deep)

  // the court side (+z) and the flanks: tall windows
  for (let x = X0 + 3; x < X1 - 2; x += 5) archOn(out, '+z', Z1, x, base + 1, 2.4, 8, glass, 0.06)
  for (const [f, plane] of [['-x', X0], ['+x', X1]] as ['-x' | '+x', number][]) for (let z = Z0 + 7; z < Z1 - 2; z += 6) archOn(out, f, plane, z, base + 1, 2.2, 7.5, glass, 0.06)

  // ---- the colonnades: hemicycle round the court and the straight wings, open galleries ~10 m
  const ch = 9.2, ent = 10.6
  const hcx = 0.5, hcz = 3, hr = 14.5
  // floor, back wall (outer, toward the street), entablature, roof slab
  ring(out, hcx, hcz, hr - 4, hr + 0.6, 0, Math.PI, 0, 0.5, p.deep, 0, 20)
  ring(out, hcx, hcz, hr - 0.1, hr + 0.6, 0, Math.PI, 0.5, ent, p.stone, 0, 20)
  ring(out, hcx, hcz, hr - 4.3, hr + 0.8, 0, Math.PI, ch, ent, p.trim, 0, 20)
  ring(out, hcx, hcz, hr - 4.2, hr + 0.7, 0, Math.PI, ent, ent + 0.8, p.trim, 0, 20)
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI
    const x = hcx + Math.cos(a) * (hr - 3.6), z = hcz + Math.sin(a) * (hr - 3.6)
    column(out, x, z, 0.5, ch, 0.38, p)
    const xo = hcx + Math.cos(a) * (hr + 0.1), zo = hcz + Math.sin(a) * (hr + 0.1)
    if (i % 2 === 1) prism(out, xo - Math.cos(a) * 0.15, zo - Math.sin(a) * 0.15, 1.5, 7.5, 0.9, 8, shade(p.stone, 0.7), 0)   // niches
  }
  // balustrade on the hemicycle
  ring(out, hcx, hcz, hr - 4.1, hr - 3.8, 0, Math.PI, ent + 0.8, ent + 1.6, p.trim, 0, 20)
  ring(out, hcx, hcz, hr + 0.2, hr + 0.5, 0, Math.PI, ent + 0.8, ent + 1.6, p.trim, 0, 20)
  // the gate pavilion at the apex, on the street
  {
    const gx = -2, gz = 25
    box(out, gx, 6, gz, 6, 6, 4, p.stone)
    box(out, gx, 12.2, gz, 6.4, 0.4, 4.4, p.trim)
    archOn(out, '+z', gz + 4, gx, 0, 4, 7.5, shade(p.dark, 2), 0.05)
    archOn(out, '-z', gz - 4, gx, 0, 4, 7.5, shade(p.dark, 2), 0.05)
    for (const s of [-1, 1]) slabOn(out, '+z', gz + 4, gx + s * 3.6 - 0.45, gx + s * 3.6 + 0.45, 0, 11.4, 0.4, p.trim)
    balustrade(out, gx - 6, gx + 6, gz - 4, gz + 4, 12.6, p, { h: 1 })
  }
  // the straight wings: x 15..38 and −38..−14, z 0..5, a back wall to the north, columns along the south
  for (const [w0, w1] of [[-38, -14], [15, 38]]) {
    const wm = (w0 + w1) / 2, hw = (w1 - w0) / 2
    box(out, wm, 0.25, 2.5, hw, 0.25, 2.5, p.deep)
    box(out, wm, ent / 2, 4.7, hw, ent / 2, 0.35, p.stone)                     // the back wall
    for (const x of [w0, w1]) if (Math.abs(x) > 30) box(out, x + (x < 0 ? 1 : -1), ent / 2, 2.5, 1, ent / 2, 2.5, p.stone)   // end piers
    box(out, wm, (ch + ent) / 2, 2.5, hw + 0.2, (ent - ch) / 2, 2.7, p.trim)
    box(out, wm, ent + 0.15, 2.5, hw, 0.15, 2.5, p.lead)
    balustrade(out, w0, w1, -0.2, 5.2, ent, p, { sides: ['-z'], h: 0.9 })
    for (let x = w0 + 2.5; x < w1 - 1; x += 3) {
      column(out, x, 0.4, 0.5, ch, 0.36, p)
      archOn(out, '-z', 4.35, x, 1.5, 1.2, 4.5, shade(p.stone, 0.72), 0.02)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
/** OSM way 79232732, the square's railed ring, east/north metres from the same origin. */
const SQUARE: [number, number][] = [[8, 27], [13, 24], [57, 0], [62, -63], [60, -65], [9, -69], [2, -70], [-49, -74], [-52, -72], [-57, -9], [-23, 17], [-17, 21], [-12, 25]]

export function gallieraSquare(out: MeshBuilder, fit: Fit): void {
  const gy = (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x, z) : 0)
  const iron: Rgb = [0.12, 0.13, 0.13]
  const gilt: Rgb = [0.75, 0.6, 0.25]
  const gravel: Rgb = [0.8, 0.74, 0.62]
  const stone: Rgb = [0.84, 0.81, 0.73]
  const leaf = surfaceTag('clipped')
  const green: Rgb = [0.24, 0.4, 0.18]
  // ---- railings round the ring (not along the palace's own street front, the last edge)
  for (let i = 0; i < SQUARE.length - 1; i++) {
    const [ax, az] = SQUARE[i], [bx, bz] = SQUARE[i + 1]
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L
    const n: V3 = [uz, 0, -ux]
    // stone kerb, two rails as thin quads both ways, posts with gilt tips
    const kerb = (y0: number, y1: number, d: number, c: Rgb) => {
      const P = (s: number, y: number, o: number): V3 => [ax + ux * s + n[0] * o, y, az + uz * s + n[2] * o]
      out.quad([P(0, y0, d), P(L, y0, d), P(L, y1, d), P(0, y1, d)], n, UV, c, 0)
      out.quad([P(L, y0, -d), P(0, y0, -d), P(0, y1, -d), P(L, y1, -d)], [-n[0], 0, -n[2]], UV, c, 0)
      out.quad([P(0, y1, -d), P(L, y1, -d), P(L, y1, d), P(0, y1, d)], [0, 1, 0], UV, c, 0)
    }
    kerb(0, 0.35, 0.2, stone)
    kerb(0.45, 0.5, 0.03, iron)
    kerb(1.65, 1.7, 0.03, iron)
    for (let s = 0; s < L; s += 0.5) {
      const x = ax + ux * s, z = az + uz * s
      prism(out, x, z, 0.35, 1.85, 0.025, 4, iron)
      if (s % 3 < 0.5) prism(out, x, z, 1.85, 2.0, 0.05, 4, gilt, 0, 0)
    }
  }
  // ---- the walks: a gravel oval round the lawns south of the palace, the axis from the steps to the avenue
  const walk = (cx: number, cz: number, rx: number, rz: number, w: number) => {
    const n = 40
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2
      const P = (t: number, o: number): V3 => { const x = cx + Math.cos(t) * (rx + o), z = cz + Math.sin(t) * (rz + o); return [x, gy(x, z) + 0.12, z] }
      out.quad([P(a, w / 2), P(b, w / 2), P(b, -w / 2), P(a, -w / 2)], [0, 1, 0], UV, gravel, 0)
    }
  }
  walk(2, -50, 40, 17, 3)
  const strip = (x0: number, x1: number, z0: number, z1: number) => {
    for (let z = z0; z < z1 - 0.01; z += 4) {
      const za = z, zb = Math.min(z1, z + 4)
      out.quad([[x0, gy(x0, za) + 0.12, za], [x1, gy(x1, za) + 0.12, za], [x1, gy(x1, zb) + 0.12, zb], [x0, gy(x0, zb) + 0.12, zb]], [0, 1, 0], UV, gravel, 0)
    }
  }
  strip(-1, 5, -42, -36)
  strip(-1, 5, -69, -54)
  strip(-14, 18, -38, -34)
  // ---- clipped trees round the walk, and cones by the steps
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.17
    const x = 2 + Math.cos(a) * 46, z = -50 + Math.sin(a) * 21
    if (z > -32 || z < -71 || x < -48 || x > 58) continue
    const g = gy(x, z)
    prism(out, x, z, g, g + 2.6, 0.18, 6, [0.35, 0.28, 0.2])
    prism(out, x, z, g + 2.6, g + 4.2, 1.5, 12, green, leaf, 2.0)              // the clipped round head
    prism(out, x, z, g + 4.2, g + 5.6, 2.0, 12, green, leaf, 1.0)
  }
  for (const x of [-12, -6, 10, 16]) prism(out, x, -38.5, gy(x, -38.5), gy(x, -38.5) + 2.4, 0.8, 10, shade(green, 0.85), leaf, 0.05)
  // ---- empty pedestals on the lawns (the sculptures are placed by the statues' builder)
  for (const [x, z] of [[-30, -45], [34, -45], [-28, -18], [38, -18], [2, -66]]) {
    const g = gy(x, z)
    box(out, x, g + 0.6, z, 0.75, 0.6, 0.75, stone)
    box(out, x, g + 1.25, z, 0.85, 0.05, 0.85, shade(stone, 1.05))
  }
}
