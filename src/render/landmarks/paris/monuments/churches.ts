import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, classicalColumn, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, pedimentOn, rectOn, type Pal } from '../palaces/common.ts'
import { apseWall, domeOf, drumArches, FIXED, quarter } from './common.ts'

/*
 * The churches a rider passes whose silhouette OSM does not give the city: Saint-Eustache (its outline is tagged a
 * `building:part` with a 10 m height, so the bake keeps a 10 m lump and drops its parts), La Trinité, Saint-Roch and
 * Saint-Germain-l'Auxerrois with its belfry (flat blocks at one height). Each in its own design metres off OSM's
 * footprint, measured in its frame with osmium (2026-10-29), and fitted.
 */

const pal = (stone: string, slate = '#4b5357'): Pal => {
  const s = hex(stone)
  return {
    stone: s, trim: shade(s, 1.05), deep: shade(s, 0.82), glass: [0.2, 0.21, 0.24], slate: hex(slate),
    lead: [0.33, 0.36, 0.37], gold: [0.8, 0.65, 0.3], dark: [0.15, 0.15, 0.15], bronze: [0.3, 0.33, 0.29],
  }
}

/** A pointed (Gothic) opening on a face: a rectangle under a steep triangle meeting at a point, `h` to the point. */
function pointedOn(out: MeshBuilder, f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number, w: number, h: number, c: Rgb, d = 0.08): void {
  const r = w / 2
  const spring = y0 + Math.max(0.3, h - w * 0.86)
  rectOn(out, f, plane, t - r, t + r, y0, spring, c, d)
  const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  const off = f === '-z' || f === '-x' ? -d : d
  const P = (u: number, y: number): [number, number, number] => (f === '-z' || f === '+z' ? [t + u, y, plane + off] : [plane + off, y, t + u])
  out.quad([P(-r, spring), P(r, spring), P(0, y0 + h), P(0, y0 + h)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}

/** A rose window: a round disc of glass flat on a face, `r` across, with a lighter ring round it. */
function roseOn(out: MeshBuilder, f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y: number, r: number, c: Rgb, ring: Rgb): void {
  const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  const P = (u: number, v: number, d: number): [number, number, number] => {
    const off = f === '-z' || f === '-x' ? -d : d
    return f === '-z' || f === '+z' ? [t + u, y + v, plane + off] : [plane + off, y + v, t + u]
  }
  const k = 16
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * Math.PI * 2
    const a1 = ((i + 1) / k) * Math.PI * 2
    out.quad([P(0, 0, 0.1), P(Math.cos(a0) * r, Math.sin(a0) * r, 0.1), P(Math.cos(a1) * r, Math.sin(a1) * r, 0.1), P(0, 0, 0.1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    out.quad([P(Math.cos(a0) * r, Math.sin(a0) * r, 0.08), P(Math.cos(a0) * (r + 0.5), Math.sin(a0) * (r + 0.5), 0.08),
      P(Math.cos(a1) * (r + 0.5), Math.sin(a1) * (r + 0.5), 0.08), P(Math.cos(a1) * r, Math.sin(a1) * r, 0.08)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], ring, FIXED)
  }
}

/** A pinnacle: a slim square shaft and a pointed cap. */
function pinnacle(out: MeshBuilder, x: number, z: number, y0: number, h: number, w: number, c: Rgb): void {
  block(out, x - w / 2, x + w / 2, z - w / 2, z + w / 2, y0, y0 + h * 0.55, c)
  prism(out, x, z, y0 + h * 0.55, y0 + h, w * 0.7, 4, c, FIXED, 0.03)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-EUSTACHE (1532–1632; the west front Mansart de Jouy's and Moreau-Desproux's, 1754–88), the great church of
 * Les Halles: a Gothic body in Renaissance dress. What a rider sees, from the Halles garden and the Rue Rambuteau:
 *
 * - the immense BODY: the nave and choir under one high slate roof (OSM's part 273063682: 40 m), the double aisles
 *   and the ring of chapels, and the FLYING BUTTRESSES over them, bay after bay (OSM maps them as the thin 33 m
 *   cross-walls 273063683…690);
 * - the TRANSEPT's ends, each a tall gable with its rose window and pinnacles, on the Rue Rambuteau and the Rue du Jour;
 * - the APSE at the east end, the Lady Chapel behind it under its own roof;
 * - the classical WEST FRONT: two storeys of Doric and Ionic over the porch, a pediment, its north tower finished to
 *   38 m and its south tower a stump (273063679 and 273063678).
 *
 * OSM way 53762963 in this frame: −z west (bearing 277.9), +x south.
 */
const EX = 24.5
const EZ = 54.3
export function saintEustache(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, EX, EZ, (q) => eustache(q))
}

function eustache(out: MeshBuilder): void {
  const p = pal('#d3c9b4')
  const nx = 7.2
  const cx0 = 0.5
  // the chapels round the outside, the outer and inner aisles
  block(out, -24.5, 24.5, -40, 25, 0, 12.5, p.stone)
  roof(out, -24.8, 24.8, -40.2, 25.2, 12.5, 2.5, 4, 1, p.slate)
  block(out, -16.5, 17.5, -40, 25, 12.5, 20.5, p.stone)
  roof(out, -16.8, 17.8, -40.2, 25.2, 20.5, 3.0, 4, 1, p.slate)
  // the nave and choir, the transept, their roofs
  block(out, cx0 - nx, cx0 + nx, -45.3, 25.4, 20.5, 30, p.stone)
  roof(out, cx0 - nx - 0.4, cx0 + nx + 0.4, -45.5, 25.4, 30, 10, nx + 0.4, 0.01, p.slate)
  block(out, -20.4, 22.7, -11.8, 2.8, 0, 30, p.stone)
  roof(out, -20.6, 22.9, -12.0, 3.0, 30, 10, 0.01, 7.5, p.slate)
  // the apse: the nave's end turned round in a half-circle, and the ambulatory and chapels round it
  apseWall(out, cx0, 25.4, nx, 20.5, 30, 40, p.stone, p.slate, p.glass)
  apseWall(out, cx0, 25.0, 17.0, 12.5, 20.5, 23.5, p.stone, p.slate, p.glass)
  apseWall(out, cx0, 25.0, 24.5, 0, 12.5, 15.0, p.stone, p.slate, p.glass)
  // the Lady Chapel behind the apse
  block(out, -5.0, 8.8, 36, 47.6, 0, 18, p.stone)
  roof(out, -5.2, 9.0, 35.8, 47.8, 18, 7, 6.9, 5, p.slate)
  // the clerestory and the aisles' tall windows, every bay
  for (let z = -38; z < 24; z += 6.2) {
    if (z > -13 && z < 4) continue
    for (const s of [-1, 1]) {
      const f = s < 0 ? '-x' : '+x'
      pointedOn(out, f, cx0 + s * nx, z, 21.5, 2.6, 7.6, p.glass)
      pointedOn(out, f, s < 0 ? -24.5 : 24.5, z, 3.0, 2.6, 7.8, p.glass)
      // the flying buttress: the outer pier, its pinnacle, and the arc over the aisles to the nave wall
      const xo = s < 0 ? -18.5 : 19.5
      block(out, xo - 1.0, xo + 1.0, z + 2.6, z + 3.8, 12.5, 27.5, p.stone)
      pinnacle(out, xo, z + 3.2, 27.5, 4.5, 1.1, p.trim)
      beam(out, [xo, 25.0, z + 3.2], [cx0 + s * (nx + 0.2), 28.5, z + 3.2], 0.45, p.stone)
      beam(out, [xo, 20.5, z + 3.2], [cx0 + s * (nx + 0.2), 24.0, z + 3.2], 0.4, p.stone)
    }
  }
  // the transept's ends: the gable with its rose, the great window under it, pinnacles at the corners
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const plane = s < 0 ? -20.4 : 22.7
    const zm = -4.5
    const P = (z: number, y: number): [number, number, number] => [plane + s * 0.02, y, z]
    out.quad([P(-11.8, 30), P(2.8, 30), P(zm, 40), P(zm, 40)], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    pointedOn(out, f, plane, zm, 4.0, 3.4, 10.0, p.dark)
    pointedOn(out, f, plane, zm, 15.0, 7.4, 13.5, p.glass)
    roseOn(out, f, plane, zm, 33.6, 2.4, p.glass, p.trim)
    for (const z of [-11.8, 2.8]) pinnacle(out, plane, z, 30, 9, 1.6, p.trim)
  }
  // the crossing's slender lantern
  prism(out, cx0, -4.5, 39, 44, 1.4, 8, p.lead, FIXED)
  prism(out, cx0, -4.5, 44, 52, 1.4, 8, p.lead, FIXED, 0.05)

  // the west front: the porch, two storeys of columns and the pediment, the two towers
  const zf = -54.3
  block(out, -6.5, 6.0, zf + 1.5, -40, 0, 30, p.stone)
  for (const x of [-4.6, -1.6, 1.4, 4.4]) {
    classicalColumn(out, x - 0.25, zf + 0.9, 0.5, 13.5, 0.55, p.stone, { order: 'doric', tier: 'mid', heading: Math.PI })
    classicalColumn(out, x - 0.25, zf + 0.9, 15.0, 25.5, 0.45, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
  }
  block(out, -6.8, 6.3, zf, zf + 1.6, 13.5, 15.0, p.trim)
  block(out, -6.8, 6.3, zf, zf + 1.6, 25.5, 27.0, p.trim)
  pedimentOn(out, '-z', zf, -6.8, 6.3, 27.0, 4.0, 1.4, p.trim)
  archOn(out, '-z', zf + 1.5, -0.25, 0, 3.6, 9.0, p.dark)
  archOn(out, '-z', zf + 1.5, -0.25, 16.0, 2.4, 6.5, p.glass)
  // the north tower, finished to 38 m with its belfry storey; the south one a stump at 24
  block(out, -19.5, -6.5, -52.2, -39.9, 0, 30, p.stone)
  block(out, -18.3, -7.7, -51.0, -41.1, 30, 36.5, p.stone)
  for (const f of ['-z', '-x'] as const) archOn(out, f, f === '-z' ? -51.0 : -18.3, f === '-z' ? -13.0 : -46.0, 30.6, 2.6, 5.0, p.dark)
  block(out, -18.8, -7.2, -51.5, -40.6, 36.5, 38.0, p.trim)
  balustrade(out, -18.6, -7.4, -51.3, -40.8, 38.0, p, { h: 0.9 })
  block(out, 6.0, 19.5, -53.5, -40.6, 0, 24, p.stone)
  block(out, 5.7, 19.8, -53.8, -40.3, 23.2, 24.2, p.trim)
  for (const [x, f] of [[-13, '-z'], [12.75, '-z']] as const) {
    archOn(out, f, x < 0 ? -52.2 : -53.5, x, 2.5, 2.8, 8.0, p.dark)
    archOn(out, f, x < 0 ? -52.2 : -53.5, x, 14.0, 2.4, 6.5, p.glass)
  }
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * LA TRINITÉ (Théodore Ballu, 1861–67), the Second Empire church at the head of the Rue de la Chaussée-d'Antin over its
 * square garden: a tall many-storeyed front of arches and columns, and over it the TOWER rising 65 m in stages to its
 * domed lantern — what closes the view up the street from the Opéra. OSM way 49872150 (92 × 34.7 m, no parts): −z
 * south toward the square (bearing 163.9), the apse to the north.
 */
const TX = 17.35
const TZ = 46.0
export function laTrinite(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, TX, TZ, (q) => trinite(q))
}

function trinite(out: MeshBuilder): void {
  const p = pal('#ddd3bf')
  // the body: aisles, nave, its roof, the apse
  block(out, -17.3, 17.3, -30, 34, 0, 14, p.stone)
  roof(out, -17.6, 17.6, -30.2, 34.2, 14, 2.5, 4, 1, p.slate)
  block(out, -9.5, 9.5, -30, 34, 14, 25, p.stone)
  roof(out, -9.9, 9.9, -30, 34, 25, 7, 9.9, 0.01, p.slate)
  apseWall(out, 0, 34, 9.5, 0, 25, 32, p.stone, p.slate, p.glass)
  apseWall(out, 0, 33.5, 12, 0, 14, 16.5, p.stone, p.slate, p.glass)
  for (let z = -26; z < 32; z += 5.4) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', s * 9.5, z, 16.0, 2.0, 6.5, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', s * 17.3, z, 4.0, 2.2, 7.0, p.glass)
    }
  }
  // the front: the porch of three arches, the storey of the rose, the gable, the corner turrets
  const zf = -46
  block(out, -14, 14, zf + 4, -30, 0, 30, p.stone)
  block(out, -11, 11, zf, zf + 4, 0, 11, p.stone)
  for (const x of [-7, 0, 7]) archOn(out, '-z', zf, x, 0, 4.6, 9.0, p.dark)
  balustrade(out, -11, 11, zf, zf + 4, 11, p, { sides: ['-z'], h: 1.0 })
  roseOn(out, '-z', zf + 4, 0, 17.0, 3.4, p.glass, p.trim)
  for (const x of [-8.5, 8.5]) archOn(out, '-z', zf + 4, x, 13.0, 2.4, 7.5, p.glass)
  for (const x of [-12.6, -4.2, 4.2, 12.6]) classicalColumn(out, x, zf + 3.6, 11.6, 23.0, 0.45, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  block(out, -14.3, 14.3, zf + 3.3, zf + 4.4, 23.0, 24.6, p.trim)
  pedimentOn(out, '-z', zf + 3.3, -9, 9, 24.6, 4.5, 0.5, p.trim)
  for (const s of [-1, 1]) {
    block(out, s * 12.5 - 1.6, s * 12.5 + 1.6, zf + 3, zf + 6.2, 24.6, 33, p.stone)
    domeOf(out, s * 12.5, zf + 4.6, 33, 1.7, 3.2, p.lead, quarter, { sides: 12, steps: 5 })
  }
  // the tower over the front, in stages: the square belfry, the open lantern, the dome, the cross at 65 m
  const tz = -35
  block(out, -6.5, 6.5, tz - 6.5, tz + 6.5, 24, 40, p.stone)
  for (const f of ['-z', '-x', '+x'] as const) {
    const plane = f === '-z' ? tz - 6.5 : f === '-x' ? -6.5 : 6.5
    const t = f === '-z' ? 0 : tz
    for (const d of [-2.4, 2.4]) archOn(out, f, plane, t + d, 31.5, 1.9, 6.5, p.dark)
    pedimentOn(out, f, plane, t - 6.5, t + 6.5, 40, 3.0, 0.4, p.trim)
  }
  block(out, -6.9, 6.9, tz - 6.9, tz + 6.9, 39.4, 40.4, p.trim)
  for (const [x, z] of [[-6, tz - 6], [6, tz - 6], [-6, tz + 6], [6, tz + 6]]) pinnacle(out, x, z, 40.4, 4.5, 1.2, p.trim)
  block(out, -4.5, 4.5, tz - 4.5, tz + 4.5, 40.4, 49, p.stone)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? tz - 4.5 : f === '+z' ? tz + 4.5 : f === '-x' ? -4.5 : 4.5
    archOn(out, f, plane, f === '-z' || f === '+z' ? 0 : tz, 41.5, 2.6, 6.5, p.dark)
  }
  prism(out, 0, tz, 49, 54, 3.4, 12, p.stone, FIXED)
  drumArches(out, 0, tz, 3.4, 49.6, 8, 1.2, 3.8, p.dark, p.trim)
  prism(out, 0, tz, 53.8, 54.6, 3.8, 12, p.trim, FIXED)
  domeOf(out, 0, tz, 54.6, 3.4, 5.2, p.lead, quarter, { sides: 12, steps: 6, ribs: 8 })
  prism(out, 0, tz, 59.8, 62.2, 0.8, 8, p.lead, FIXED)
  domeOf(out, 0, tz, 62.2, 0.9, 1.2, p.lead, quarter, { sides: 8, steps: 4 })
  box(out, 0, 64.2, tz, 0.08, 0.8, 0.08, p.gold, FIXED)
  box(out, 0, 64.5, tz, 0.4, 0.07, 0.08, p.gold, FIXED)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-ROCH (Lemercier, 1653; the front Robert de Cotte's, 1736), on the Rue Saint-Honoré: its long body runs north
 * behind the street, and what the street sees is the Baroque FRONT on its flight of steps — two storeys of paired
 * Doric and Corinthian columns, the pediment, the scrolls joining the upper storey to the lower — with the dome of the
 * Lady Chapel and the Calvary chapel behind. OSM way 42722202 (126.8 × 39.1, no parts) in this frame: the long axis
 * along x, the front at −x on the Rue Saint-Honoré (bearing 216).
 */
const RX = 63.4
const RZ = 19.55
export function saintRoch(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, RX, RZ, (q) => roch(q))
}

function roch(out: MeshBuilder): void {
  const p = pal('#dbd0ba')
  // the body: aisles and chapels, the nave and its roof, the domed Lady Chapel and the Calvary chapel beyond
  block(out, -53, 40, -19.5, 19.5, 0, 14, p.stone)
  roof(out, -53, 40, -19.8, 19.8, 14, 2.5, 1, 4, p.slate)
  block(out, -53, 20, -8, 8, 14, 26, p.stone)
  roof(out, -53, 20, -8.4, 8.4, 26, 7, 0.01, 8.4, p.slate)
  block(out, -14, 0, -15, 15, 14, 26, p.stone)
  roof(out, -14.2, 0.2, -15.2, 15.2, 26, 6, 7, 0.01, p.slate)
  for (let x = -49; x < 18; x += 5.5) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-z' : '+z', s * 8, x, 16.5, 2.0, 6.5, p.glass)
      archOn(out, s < 0 ? '-z' : '+z', s * 19.5, x, 3.5, 2.0, 7.5, p.glass)
    }
  }
  prism(out, 28, 0, 14, 24, 7.5, 20, p.stone, FIXED)
  drumArches(out, 28, 0, 7.5, 16, 8, 1.8, 5, p.glass)
  domeOf(out, 28, 0, 24, 7.3, 6.5, p.lead, quarter, { sides: 20, steps: 7, ribs: 10 })
  prism(out, 28, 0, 30.4, 33, 1.0, 8, p.trim, FIXED)
  block(out, 40, 63.4, -12, 12, 0, 15, p.stone)
  roof(out, 40, 63.4, -12.2, 12.2, 15, 3, 3, 6, p.slate)
  // the front on the Rue Saint-Honoré: the steps, two storeys of paired columns, the scrolls, the pediment
  const xf = -63.4
  for (let k = 0; k < 6; k++) block(out, xf + k * 0.55, -53, -10, 10, 0, 0.3 * (k + 1), k % 2 ? p.stone : p.trim)
  block(out, -57.5, -53, -12, 12, 0, 17, p.stone)
  block(out, -57.5, -53, -7.5, 7.5, 17, 29, p.stone)
  for (const z of [-9.6, -8.2, -2.4, -1.0, 1.0, 2.4, 8.2, 9.6]) {
    classicalColumn(out, -58.1, z, 1.8, 14.8, 0.5, p.stone, { order: 'doric', tier: 'mid', heading: -Math.PI / 2 })
    if (Math.abs(z) < 9) classicalColumn(out, -58.1, z * 0.72, 17.0, 26.5, 0.42, p.stone, { order: 'corinthian', tier: 'mid', heading: -Math.PI / 2 })
  }
  block(out, -58.8, -57.4, -12.3, 12.3, 14.8, 17.0, p.trim)
  block(out, -58.8, -57.4, -7.8, 7.8, 26.5, 28.2, p.trim)
  // the pediment, facing −x
  out.quad([[-58.8, 28.2, -7.8], [-58.8, 28.2, 7.8], [-58.8, 31.8, 0], [-58.8, 31.8, 0]], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
  for (const s of [-1, 1]) {
    // the scrolls joining the upper storey to the lower, and the urns on the lower storey's ends
    beam(out, [-58.0, 17.4, s * 11.4], [-58.0, 22.5, s * 7.8], 0.6, p.trim)
    prism(out, -58.0, s * 11.6, 17.0, 18.6, 0.5, 8, p.trim, FIXED, 0.3)
  }
  archOn(out, '-x', -57.5, 0, 1.8, 3.4, 8.5, p.dark)
  archOn(out, '-x', -57.5, 0, 18.0, 2.6, 6.5, p.glass)
  for (const s of [-1, 1]) archOn(out, '-x', -57.5, s * 5.2, 1.8, 2.0, 5.5, p.dark)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-GERMAIN-L'AUXERROIS (13th–16th c.), the parish of the Louvre, facing the colonnade across the Place du Louvre:
 * the flamboyant PORCH of five bays across the front with its pinnacles and balustrade, the rose and gable of the
 * front over it, the tall slate roof and the Romanesque tower by the south transept; and beside it on the place,
 * Ballu's neo-Gothic BELFRY (1858–60, OSM way 200452261, 50 m) between the church and the town hall of the 1st. OSM way
 * 53770908 (78.3 × 40.6, no parts) in this frame: the long axis along x, the front at −x toward the Louvre (bearing
 * 282.4). The belfry is drawn at OSM's place, local (−34, +29) and 9.5 × 11.5 m.
 */
const GX = 39.15
const GZ = 20.3
export function saintGermainAuxerrois(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, GX, GZ, (q) => auxerrois(q))
}

function auxerrois(out: MeshBuilder): void {
  const p = pal('#d6ccb7')
  // the body: chapels, aisles, the high nave and choir, the apse
  block(out, -33, 30, -20.3, 20.3, 0, 11, p.stone)
  roof(out, -33, 30, -20.6, 20.6, 11, 2.5, 1, 4, p.slate)
  block(out, -33, 30, -7.5, 7.5, 11, 21, p.stone)
  roof(out, -33.2, 30, -7.9, 7.9, 21, 9, 0.01, 7.9, p.slate)
  for (let x = -28; x < 28; x += 5.6) {
    for (const s of [-1, 1]) {
      pointedOn(out, s < 0 ? '-z' : '+z', s * 7.5, x, 12.5, 2.2, 7.0, p.glass)
      pointedOn(out, s < 0 ? '-z' : '+z', s * 20.3, x, 2.5, 2.2, 7.0, p.glass)
    }
  }
  // the apse at +x, turned so its round end faces east
  {
    const n = 8
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i / n) * Math.PI
      const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI
      const P = (a: number, r: number, y: number): [number, number, number] => [30 + Math.cos(a) * r, y, Math.sin(a) * r]
      const am = (a0 + a1) / 2
      out.quad([P(a0, 7.5, 11), P(a1, 7.5, 11), P(a1, 7.5, 21), P(a0, 7.5, 21)], [Math.cos(am), 0, Math.sin(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
      out.quad([P(a0, 7.9, 21), P(a1, 7.9, 21), P(a0, 0, 30), P(a0, 0, 30)], [Math.cos(am), 0.8, Math.sin(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
      out.quad([P(a0, 20.3, 0), P(a1, 20.3, 0), P(a1, 20.3, 11), P(a0, 20.3, 11)], [Math.cos(am), 0, Math.sin(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    }
  }
  // the Romanesque tower by the south transept, its pyramid roof
  block(out, 4, 10, 7.5, 13.5, 11, 32, p.stone)
  for (const f of ['+z', '-x', '+x'] as const) archOn(out, f, f === '+z' ? 13.5 : f === '-x' ? 4 : 10, f === '+z' ? 7 : 10.5, 25, 1.4, 4.5, p.dark)
  roof(out, 3.8, 10.2, 7.3, 13.7, 32, 6, 3.2, 3.2, p.slate)
  // the front: the gable with its rose, and the porch across it
  const xf = -33
  out.quad([[xf - 0.02, 21, -7.5], [xf - 0.02, 21, 7.5], [xf - 0.02, 30, 0], [xf - 0.02, 30, 0]], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  roseOn(out, '-x', xf, 0, 16.5, 3.2, p.glass, p.trim)
  block(out, -39.15, xf, -13, 13, 0, 9.5, p.stone)
  for (let i = 0; i < 5; i++) {
    const z = -10.4 + i * 5.2
    pointedOn(out, '-x', -39.15, z, 0, 3.6, 7.8, p.dark)
    pinnacle(out, -39.2, z - 2.6, 9.5, 3.5, 0.9, p.trim)
  }
  pinnacle(out, -39.2, 13, 9.5, 3.5, 0.9, p.trim)
  balustrade(out, -39.15, xf, -13, 13, 9.5, p, { sides: ['-x'], h: 0.9 })
  // the belfry on the place: four storeys of Gothic openings, the corner pinnacles, the spire
  const bx = -34
  const bz = 29
  block(out, bx - 4.75, bx + 4.75, bz - 5.75, bz + 5.75, 0, 36, p.stone)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? bz - 5.75 : f === '+z' ? bz + 5.75 : f === '-x' ? bx - 4.75 : bx + 4.75
    const t = f === '-z' || f === '+z' ? bx : bz
    pointedOn(out, f, plane, t, 0, 3.2, 6.5, p.dark)
    pointedOn(out, f, plane, t, 10, 2.0, 6.0, p.glass)
    pointedOn(out, f, plane, t, 19, 2.4, 6.5, p.glass)
    pointedOn(out, f, plane, t, 27.5, 3.4, 7.5, p.dark)
  }
  for (const [x, z] of [[-4.75, -5.75], [4.75, -5.75], [-4.75, 5.75], [4.75, 5.75]]) pinnacle(out, bx + x, bz + z, 36, 6, 1.4, p.trim)
  balustrade(out, bx - 4.75, bx + 4.75, bz - 5.75, bz + 5.75, 36, p, { h: 0.9 })
  prism(out, bx, bz, 36, 50, 4.6, 8, p.slate, FIXED, 0.1)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-GERMAIN-DES-PRÉS (the tower c. 1000, the nave 11th c., the choir 1145–63), the oldest church in Paris, on its
 * corner of the boulevard: the square ROMANESQUE TOWER over the west porch, its belfry storey of twin arches and the
 * slate spire to 60 m (OSM's parts 1461285707/14/15); the long low nave under its slate roof; the Gothic choir at the
 * east end with its early flying buttresses and the ring of chapels round the apse. OSM way 62287173 in this frame
 * (turned to the church's own axis, 6.5° off the footprint's box): −z west, the tower at (−2, −41.6). Saint-Symphorien
 * (the chapel against the tower's south side, way 495635817) is OSM's and stays.
 *
 * In the city OSM's parts drew the tower as a windowed block and its corner pinnacles as pillars floating over the
 * roofs; the model replaces them.
 */
const SGX = 19.05
const SGZ = 52.1
export function saintGermainDesPres(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, SGX, SGZ, (q) => sgdp(q))
}

function sgdp(out: MeshBuilder): void {
  const p = pal('#d2c7b1')
  const ax = -0.5
  // the nave and its aisles
  block(out, ax - 13.4, ax + 13.4, -35, 0, 0, 10, p.stone)
  roof(out, ax - 13.7, ax + 13.7, -35.2, 0.2, 10, 2.5, 4, 1, p.slate)
  block(out, ax - 5.6, ax + 5.6, -35, 0, 10, 18.5, p.stone)
  roof(out, ax - 6.0, ax + 6.0, -35, 0.2, 18.5, 7.5, 6.0, 0.01, p.slate)
  for (let z = -32; z < -1; z += 4.6) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', ax + s * 5.6, z, 12.0, 1.4, 4.4, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', ax + s * 13.4, z, 2.5, 1.5, 5.0, p.glass)
    }
  }
  // the choir: its aisles and chapels, the high choir, the apse, the flying buttresses
  block(out, ax - 13.4, ax + 13.4, 0, 37, 0, 11, p.stone)
  roof(out, ax - 13.7, ax + 13.7, -0.2, 37, 11, 2.5, 4, 1, p.slate)
  block(out, ax - 5.8, ax + 5.8, 0, 37, 11, 20, p.stone)
  roof(out, ax - 6.2, ax + 6.2, 0, 37, 20, 7.5, 6.2, 0.01, p.slate)
  apseWall(out, ax, 37, 5.8, 11, 20, 27.5, p.stone, p.slate, p.glass)
  apseWall(out, ax, 37, 13.4, 0, 11, 13.5, p.stone, p.slate, p.glass)
  for (let z = 3; z < 36; z += 5.2) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', ax + s * 5.8, z, 13.0, 1.5, 5.0, p.glass)
      const xo = ax + s * 12.0
      block(out, xo - 0.6, xo + 0.6, z - 0.6, z + 0.6, 11, 17.5, p.stone)
      beam(out, [xo, 16.5, z], [ax + s * 6.0, 19.0, z], 0.3, p.stone)
    }
  }
  // the west tower: the porch and lower storeys to 36.7, the corner pinnacles, the belfry to 42.8, the spire to 60
  const tx = -2.0
  const tz = -41.6
  block(out, -7.0, 4.8, -46.3, -35.5, 0, 34.7, p.stone)
  for (const y of [10.5, 20.5, 28.0]) block(out, -7.3, 5.1, -46.6, -35.2, y, y + 0.5, p.trim)
  archOn(out, '-z', -46.3, tx + 0.1, 0, 2.6, 5.5, p.dark)
  for (const f of ['-z', '-x', '+x'] as const) {
    const plane = f === '-z' ? -46.3 : f === '-x' ? -7.0 : 4.8
    const t = f === '-z' ? tx + 0.1 : tz
    for (const d of [-1.6, 1.6]) archOn(out, f, plane, t + d, 22.0, 1.2, 4.2, p.dark)
    archOn(out, f, plane, t, 12.5, 1.3, 4.5, p.glass)
  }
  for (const [x, z] of [[-6.4, -45.7], [4.2, -45.7], [-6.4, -36.1], [4.2, -36.1]]) pinnacle(out, x, z, 34.7, 3.0, 1.0, p.stone)
  block(out, tx - 4.25, tx + 4.25, tz - 4.05, tz + 4.05, 34.7, 42.8, p.stone)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? tz - 4.05 : f === '+z' ? tz + 4.05 : f === '-x' ? tx - 4.25 : tx + 4.25
    const t = f === '-z' || f === '+z' ? tx : tz
    for (const d of [-1.7, 1.7]) archOn(out, f, plane, t + d, 36.2, 1.3, 4.6, p.dark)
  }
  block(out, tx - 4.5, tx + 4.5, tz - 4.3, tz + 4.3, 42.2, 42.8, p.trim)
  prism(out, tx, tz, 42.8, 60, 4.4, 8, p.slate, FIXED, 0.08)
  box(out, tx, 60.6, tz, 0.06, 0.6, 0.06, p.gold, FIXED)
  for (const s of [-1, 1]) {
    prism(out, tx + s * 4.1, tz + 3.9, 42.8, 43.8, 0.7, 8, p.stone, FIXED)
    prism(out, tx + s * 4.1, tz + 3.9, 43.8, 44.8, 0.75, 8, p.slate, FIXED, 0.05)
  }
}
