/**
 * LE CENT QUATRE, the arts centre in the old municipal undertakers' at 104 rue d'Aubervilliers, built for the "Service
 * municipal des pompes funèbres de Paris" (the words are cut over its arch: Commons "Le Centquatre, les anciennes pompes
 * funèbres de Paris"). OSM: relation/3705800, building=public, 223 × 72 m, four courts; way/278632326 is the arts centre's
 * own tag on the same ground and has no building.
 *
 * The long street flanks are hidden by little but their plain stone; what reads is what stands in the block:
 * - the two great GLASS-ROOFED HALLS with iron ribs, the longer between the courts, the shorter toward Rue d'Aubervilliers;
 * - the great GABLE of the hall, stone striped with red brick, a fan-headed window filling it and a round oculus either side
 *   ("Le Cent Quatre à Paris, juin 2012");
 * - the stone ranges on both streets, four floors, an arch through the middle, the inscription on the Aubervilliers side.
 *
 * Local −z faces south (`front` 195), +x east to Rue Curial. The halls' sections and the ranges' heights are estimated from
 * the photographs; the courts are OSM's.
 *
 * The owner, 2026-10-30 (#30): "also this has an elaborate facade. the sign is not readable". It was 46 letters half a metre high behind the
 * arch's own band. The front on the Rue d'Aubervilliers is now its frontispiece (`frontispiece`, from Commons "Le Centquatre, les anciennes
 * pompes funèbres de Paris (21628557194).jpg"): a coursed ground floor, the low arch between its corbels, the great scrolls either side of it,
 * the balcony on its consoles, three windows over it, the dentilled cornice breaking forward, the crowning attic with its scrolled ends
 * and its piers. The words are on their stone under the balcony, on two lines, in letters that can be read from the street.
 */
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, placed, roof } from '../../kit.ts'
import { MeshBuilder } from '../../../buildings.ts'
import { Relief } from '../minor/sculpt.ts'
import { signText } from '../../parts.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { clamp } from './shell.ts'

const STONE: Rgb = [0.82, 0.77, 0.65]
const STONE_DK: Rgb = [0.7, 0.65, 0.54]
const BRICK: Rgb = [0.6, 0.27, 0.19]
const GLASS: Rgb = [0.5, 0.62, 0.66]
const GLASS2: Rgb = [0.42, 0.54, 0.6]
const DARK: Rgb = [0.13, 0.15, 0.17]
const IRON: Rgb = [0.26, 0.3, 0.32]
const SLATE: Rgb = [0.38, 0.4, 0.44]
const ZINC: Rgb = [0.55, 0.56, 0.56]
const PAVE: Rgb = [0.66, 0.64, 0.6]

/** a gable-roofed hall of glass along x from x0 to x1, z0 to z1, eaves at y0, ridge at y1, its iron ribs every `bay` */
function glassHall(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, bay: number, glass: number, metal: number): void {
  const zm = (z0 + z1) / 2
  const n = Math.max(2, Math.round((x1 - x0) / bay))
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n
    const b = x0 + ((x1 - x0) * (i + 1)) / n
    for (const [z, s] of [[z0, -1], [z1, 1]] as [number, number][]) {
      quadN(out, [[a, y0, z], [b, y0, z], [b, y1, zm], [a, y1, zm]], [0, 0.8, s], i % 2 ? GLASS : GLASS2, glass)
    }
  }
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    for (const z of [z0, z1]) strut(out, [x, y0, z], [x, y1 + 0.1, zm], 0.5, 0.5, IRON, metal, false)
  }
  // the purlins, two a side, and the ridge's lantern
  for (const f of [0.33, 0.66]) {
    for (const z of [z0, z1]) {
      const y = y0 + (y1 - y0) * f
      const zz = z + (zm - z) * f
      strut(out, [x0, y + 0.1, zz], [x1, y + 0.1, zz], 0.24, 0.24, IRON, metal, false)
    }
  }
  box(out, (x0 + x1) / 2, y1 + 0.2, zm, (x1 - x0) / 2, 0.3, 0.8, IRON, metal)
}

/** the hall's end wall, on the plane x = x: stone with brick stripes, a fan window, an oculus either side */
function gable(out: MeshBuilder, x: number, s: number, z0: number, z1: number, g: number, y0: number, y1: number, stone: number, brick: number, glass: number, metal: number): void {
  const zm = (z0 + z1) / 2
  const hw = (z1 - z0) / 2
  const n: V3 = [s, 0, 0]
  quadN(out, [[x, g, z0], [x, g, z1], [x, y0, z1], [x, y0, z0]], n, STONE, stone)
  quadN(out, [[x, y0, z0], [x, y0, z1], [x, y1, zm], [x, y1, zm]], n, STONE, stone)
  const off = (o: number): number => x + s * o
  // the coping up both slopes, the brick stripes on the piers
  for (const e of [z0, z1]) strut(out, [off(0.3), y0, e], [off(0.3), y1 + 0.3, zm], 1.1, 0.9, STONE_DK, stone, false)
  for (const yy of [g + 4, g + 8, g + 12]) {
    for (const [a, b] of [[z0, zm - hw * 0.5], [zm + hw * 0.5, z1]]) box(out, off(0.1), yy, (a + b) / 2, 0.1, 0.45, Math.abs(b - a) / 2, BRICK, brick)
  }
  // the great window: its rectangle and its round head, with the iron's bars
  const w = hw * 0.48
  const top = y0 - 2
  box(out, off(0.1), (g + 0.2 + top) / 2, zm, 0.08, (top - g - 0.2) / 2, w, GLASS2, glass)
  const m = 12
  for (let i = 0; i < m; i++) {
    const a0 = (i / m) * Math.PI
    const a1 = ((i + 1) / m) * Math.PI
    quadN(out, [[off(0.1), top, zm], [off(0.1), top + Math.sin(a0) * w, zm + Math.cos(a0) * w], [off(0.1), top + Math.sin(a1) * w, zm + Math.cos(a1) * w], [off(0.1), top + Math.sin(a1) * w, zm + Math.cos(a1) * w]], n, GLASS2, glass)
    strut(out, [off(0.2), top + Math.sin(a0) * (w + 0.5), zm + Math.cos(a0) * (w + 0.5)], [off(0.2), top + Math.sin(a1) * (w + 0.5), zm + Math.cos(a1) * (w + 0.5)], 0.7, 0.7, BRICK, brick, false)
    strut(out, [off(0.18), top, zm], [off(0.18), top + Math.sin(a0) * w, zm + Math.cos(a0) * w], 0.14, 0.14, IRON, metal, false)
  }
  for (let i = 0; i <= 6; i++) box(out, off(0.18), (g + top) / 2, zm - w + (2 * w * i) / 6, 0.05, (top - g) / 2, 0.08, IRON, metal)
  // the two oculi
  for (const d of [-1, 1]) {
    const zc = zm + d * hw * 0.68
    const yc = y0 - 2
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2
      const a1 = ((i + 1) / 12) * Math.PI * 2
      const ring = (r: number, c: Rgb, o: number, tag: number): void => quadN(out, [[off(o), yc, zc], [off(o), yc + Math.sin(a0) * r, zc + Math.cos(a0) * r], [off(o), yc + Math.sin(a1) * r, zc + Math.cos(a1) * r], [off(o), yc + Math.sin(a1) * r, zc + Math.cos(a1) * r]], n, c, tag)
      ring(2, BRICK, 0.08, brick)
      ring(1.4, GLASS2, 0.14, glass)
    }
  }
}

/**
 * The middle of the Rue d'Aubervilliers front, drawn on a plane z = 0 facing −z, t along it, 26 m wide, from the ground at g. The wall behind is
 * the range's own; this stands 0.1–1.2 m off it. `stone` the material's tag, kept off the sculpture.
 */
function frontispiece(q: MeshBuilder, g: number, stone: number, dark: number): void {
  const P: Rgb = [0.84, 0.79, 0.66], T: Rgb = [0.9, 0.86, 0.74], D: Rgb = [0.72, 0.67, 0.55]
  const quad = (a: number, b: number, y0: number, y1: number, d: number, c: Rgb, tag = stone): void =>
    q.quad([[a, y0, -d], [b, y0, -d], [b, y1, -d], [a, y1, -d]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  const R = 4.3, spring = g + 5.4              // the low arch: a segment, 8.6 m wide, its crown at about 7.8, the inscription over it
  const crown = g + 7.8
  const arc = (t: number): number => spring + (crown - spring) * Math.sqrt(Math.max(0, 1 - (t * t) / (R * R)))
  // the front's plate: the wall round the arch, standing forward of the range
  quad(-13, -R, 0, g + 16, 0.12, P)
  quad(R, 13, 0, g + 16, 0.12, P)
  const n = 12
  for (let i = 0; i < n; i++) {
    const t0 = -R + (2 * R * i) / n, t1 = -R + (2 * R * (i + 1)) / n
    q.quad([[t0, arc(t0), -0.12], [t1, arc(t1), -0.12], [t1, g + 16, -0.12], [t0, g + 16, -0.12]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], P, stone)
    // the opening: dark, the gate's bars in it
    q.quad([[t0, g, -0.04], [t1, g, -0.04], [t1, arc(t1), -0.04], [t0, arc(t0), -0.04]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.1, 0.11, 0.12], dark)
    // its voussoirs, wedges of alternating tone
    const a0 = arc(t0), a1 = arc(t1)
    q.quad([[t0, a0, -0.28], [t1, a1, -0.28], [t1 * 1.09, a1 + 0.45, -0.28], [t0 * 1.09, a0 + 0.45, -0.28]], [0, 0.1, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 ? T : D, stone)
    q.quad([[t0, a0, -0.12], [t1, a1, -0.12], [t1, a1, -0.28], [t0, a0, -0.28]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], D, stone)
  }
  for (let i = 0; i <= 10; i++) { const t = -R + (2 * R * i) / 10; block(q, t - 0.04, t + 0.04, -0.1, -0.04, g, Math.min(g + 3.2, arc(t)), [0.16, 0.17, 0.17]) }
  // the ground floor's courses: the piers either side of the arch, their numbered panels, the bands
  for (const s of [-1, 1]) {
    const a = s < 0 ? -9 : R, b = s < 0 ? -R : 9
    block(q, a, b, -0.34, -0.1, 0, spring, T)
    for (let y = g + 0.75; y < spring - 0.1; y += 0.75) block(q, a - 0.02, b + 0.02, -0.36, -0.32, y - 0.05, y + 0.05, D)
    const c = s * 6.7
    block(q, c - 1.05, c + 1.05, -0.38, -0.3, g + 2.7, g + 4.4, D)
    block(q, c - 0.85, c + 0.85, -0.4, -0.34, g + 2.9, g + 4.2, T)
    // a door low down in the pier
    quad(c - 0.8, c + 0.8, g, g + 2.2, 0.36, [0.14, 0.15, 0.16], dark)
    // the string over the ground floor, running on across the whole front
    block(q, s < 0 ? -13.2 : R, s < 0 ? -R : 13.2, -0.5, -0.1, spring - 0.05, spring + 0.3, T)
    // the great scroll: a quarter-round rising from the string to the corbel, a spiral at its inner head
    const r = new Relief(q, s * 6.6, spring + 0.3, -0.13, P, 0.5, s > 0)
    const m = 10
    for (let i = 0; i < m; i++) {
      const u0 = (i / m) * Math.PI, u1 = ((i + 1) / m) * Math.PI
      const X = (u: number, rr: number): [number, number, number] => [-Math.cos(u) * rr * 1.25 - 0.0, Math.sin(u) * rr, 0.26]
      r.face(X(u0, 2.05), X(u1, 2.05), X(u1, 1.65), X(u0, 1.65), [0, 0.2, 1], T)
      r.face([X(u0, 1.65)[0], X(u0, 1.65)[1], 0.02], [X(u1, 1.65)[0], X(u1, 1.65)[1], 0.02], [0, 0.04, 0.02], [0, 0.04, 0.02], [0, 0, 1], P)
    }
    r.disc([1.75, 0.95, 0.04], 1.02, 0.42, 12)
    r.disc([1.75, 0.95, 0.42], 0.5, 0.14, 8)
    // the corbel over each side of the arch, the pair of tall consoles the balcony stands on
    for (const d of [-0.42, 0.42]) {
      const t = s * 5.9 + d
      block(q, t - 0.22, t + 0.22, -0.92, -0.1, g + 7.4, g + 9.6, T)
      block(q, t - 0.28, t + 0.28, -1.02, -0.1, g + 9.2, g + 9.7, T)
      block(q, t - 0.28, t + 0.28, -0.72, -0.1, g + 7.05, g + 7.45, D)
    }
  }
  // the stone of the inscription, between the corbels over the arch
  block(q, -5.4, 5.4, -0.24, -0.1, crown + 0.0, g + 9.7, T)
  // the balcony: its deep cornice with consoles, the slab, the panelled balustrade, a window behind
  block(q, -6.5, 6.5, -1.45, -0.1, g + 9.7, g + 10.1, T)
  for (let i = 0; i <= 18; i++) {
    const t = -6.3 + (12.6 * i) / 18
    block(q, t - 0.15, t + 0.15, -1.25, -0.2, g + 9.5, g + 9.7, D)
  }
  block(q, -6.5, 6.5, -1.4, -1.15, g + 10.1, g + 11.2, P)
  block(q, -6.65, 6.65, -1.5, -1.1, g + 11.2, g + 11.42, T)
  for (let i = 0; i < 9; i++) {
    const t = -5.8 + (11.6 * (i + 0.5)) / 9
    block(q, t - 0.5, t + 0.5, -1.44, -1.38, g + 10.25, g + 11.05, D)
    block(q, t - 0.36, t + 0.36, -1.47, -1.42, g + 10.37, g + 10.93, T)
  }
  // the frontispiece over it: two pairs of pilasters, three windows between, a slit either side
  const y0 = g + 10.2, y1 = g + 15.2
  for (const t of [-5.05, 5.05]) block(q, t - 0.62, t + 0.62, -0.32, -0.1, y0, y1, T)
  for (let i = -1; i <= 1; i++) {
    const t = i * 2.7
    quad(t - 1.14, t + 1.14, g + 11.4, g + 14.6, 0.15, D)
    quad(t - 0.92, t + 0.92, g + 11.55, g + 14.4, 0.17, [0.12, 0.15, 0.17], dark)
    block(q, t - 0.05, t + 0.05, -0.2, -0.17, g + 11.55, g + 14.4, T)
    block(q, t - 0.92, t + 0.92, -0.2, -0.17, g + 13.2, g + 13.3, T)
  }
  // the wings of the frontispiece: a tall window with its little balcony, a stepped quoin down each corner of the range
  for (const s of [-1, 1]) {
    const t = s * 9.8
    quad(t - 1.3, t + 1.3, g + 6.7, g + 10.2, 0.15, D)
    quad(t - 1.05, t + 1.05, g + 6.85, g + 10, 0.17, [0.12, 0.15, 0.17], dark)
    block(q, t - 1.4, t + 1.4, -0.4, -0.1, g + 6.5, g + 6.72, T)
    quad(t - 1.3, t + 1.3, g + 11.6, g + 15, 0.15, D)
    quad(t - 1.05, t + 1.05, g + 11.75, g + 14.8, 0.17, [0.12, 0.15, 0.17], dark)
    block(q, t - 1.35, t + 1.35, -0.4, -0.1, g + 11.4, g + 11.6, T)
    block(q, t - 1.4, t + 1.4, -0.34, -0.1, g + 15.03, g + 15.3, T)
    for (let y = g + 6; y < g + 15.5; y += 1.1) {
      block(q, s * 12.1 - 0.9, s * 12.1 + 0.9, -0.2, -0.1, y, y + 0.55, T)
      block(q, s * 12.4 - 0.6, s * 12.4 + 0.6, -0.2, -0.1, y + 0.55, y + 1.1, D)
    }
  }
  // the dentilled cornice, breaking forward over the pilasters
  block(q, -13.4, 13.4, -0.9, -0.1, g + 15.6, g + 16.15, T)
  block(q, -13.4, 13.4, -0.55, -0.1, g + 15.35, g + 15.6, D)
  for (let i = 0; i <= 48; i++) {
    const t = -13 + (26 * i) / 48
    block(q, t - 0.14, t + 0.14, -0.76, -0.5, g + 15.28, g + 15.6, T)
  }
  for (const t of [-5.05, 5.05]) block(q, t - 0.82, t + 0.82, -1.1, -0.1, g + 15.5, g + 16.2, T)
  // the crown: the low balustrade with its little piers and urns, the attic panel, its scrolled ends
  block(q, -6, 6, -0.6, 0.4, g + 16.15, g + 17.05, P)
  block(q, -6.2, 6.2, -0.7, 0.4, g + 17.05, g + 17.25, T)
  for (const s of [-1, 1]) {
    block(q, s * 5.5 - 0.5, s * 5.5 + 0.5, -0.75, 0.4, g + 16.15, g + 17.8, T)
    const u = new Relief(q, s * 5.5, g + 17.8, -0.5, P, 0.4)
    u.lump([0, 0.3, 0.1], 0.32, 0.36, 0.3, 5)
  }
  block(q, -2.6, 2.6, -0.6, 0.4, g + 16.15, g + 19.0, P)
  block(q, -1.5, 1.5, -0.68, -0.58, g + 17.2, g + 18.6, T)
  block(q, -2.8, 2.8, -0.74, 0.5, g + 19.0, g + 19.25, T)
  for (const s of [-1, 1]) {
    const t = s * 2.15
    block(q, t - 0.55, t + 0.55, -0.82, 0.4, g + 16.15, g + 19.25, T)
    const c = new Relief(q, t, g + 19.25, -0.72, P, 0.5)
    c.disc([0, 0.5, 0.1], 0.72, 0.3, 10)
    block(q, t - 0.72, t + 0.72, -0.8, 0.3, g + 19.25, g + 19.55, D)
  }
  // the flagstaff of the photograph
  block(q, -0.03, 0.03, -0.2, -0.14, g + 19.25, g + 23.5, [0.25, 0.25, 0.25])
}

export function centQuatre(out: MeshBuilder, fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const brick = surfaceTag('brick')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const conc = surfaceTag('concrete')
  const hx = clamp(fit.hx, 30, 115)
  const hz = clamp(fit.hz, 15, 40)
  const sx = hx / 111.6
  const sz = hz / 36.7
  const g = groundMid(fit)
  // (down to the model's base, which is under its lowest ground, and not to half a metre under the ground at its middle: on 223 m of a sloping
  //  block the Rue d'Aubervilliers end stood clear of its pavement. Owner, 2026-10-30, 48.890402, 2.368561: "this building is floating about 1m in the air")
  const S = (x0: number, x1: number, z0: number, z1: number, y1: number, c: Rgb = STONE, tag = stone): void =>
    box(out, ((x0 + x1) / 2) * sx, y1 / 2, ((z0 + z1) / 2) * sz, ((x1 - x0) / 2) * sx, y1 / 2, ((z1 - z0) / 2) * sz, c, tag)

  // ---- the paved floor of the courts
  quadN(out, [[-hx, g + 0.05, -hz], [hx, g + 0.05, -hz], [hx, g + 0.05, hz], [-hx, g + 0.05, hz]], [0, 1, 0], PAVE, conc)

  // ---- the long ranges down both flanks: stone, zinc-topped, two floors of tall windows with brick lintels
  const eaves = g + 13
  for (const [z0, z1, face] of [[-36.7, -26, -1], [26, 36.7, 1]] as [number, number, number][]) {
    S(-111.6, 111.6, z0, z1, eaves)
    box(out, 0, eaves + 0.2, ((z0 + z1) / 2) * sz, hx, 0.25, ((z1 - z0) / 2) * sz, ZINC, metal)
    const zf = (face < 0 ? z0 : z1) * sz + face * 0.05
    const n = Math.round(hx / 3.4)
    for (let i = 0; i < n; i++) {
      const x = -hx + ((2 * hx) * (i + 0.5)) / n
      for (const [y, h] of [[g + 1.2, 3.6], [g + 7, 4]]) {
        box(out, x, y + h / 2, zf, 1.3, h / 2, 0.05, DARK, glass)
        box(out, x, y + h + 0.2, zf + face * 0.04, 1.6, 0.26, 0.05, BRICK, brick)
      }
      if (i % 2) box(out, x + hx / n, (g + 12) / 2 + 0.3, zf + face * 0.1, 0.32, 6, 0.1, STONE_DK, stone)
    }
    box(out, 0, g + 6.2, zf + face * 0.08, hx, 0.26, 0.08, BRICK, brick)
    box(out, 0, eaves - 0.5, zf + face * 0.16, hx + 0.2, 0.5, 0.16, STONE_DK, stone)
  }

  // ---- the stone range on each street: higher, slate-roofed, its windows, the arch through the middle
  const rangeTop = g + 17
  for (const [x0, x1, face] of [[-111.6, -101, -1], [100, 111.6, 1]] as [number, number, number][]) {
    S(x0, x1, -36.7, 36.7, rangeTop)
    const xc = ((x0 + x1) / 2) * sx
    roof(out, x0 * sx + 0.4, x1 * sx - 0.4, -hz + 0.4, hz - 0.4, rangeTop + 0.6, 4, ((x1 - x0) / 2) * sx - 1.4, 1.4, SLATE)
    box(out, xc, rangeTop + 0.2, 0, ((x1 - x0) / 2) * sx + 0.4, 0.45, hz + 0.3, STONE_DK, stone)
    const xf = (face < 0 ? x0 : x1) * sx + face * 0.06
    const n = 15
    for (let f = 0; f < 3; f++) {
      for (let i = 0; i < n; i++) {
        const z = -hz + ((2 * hz) * (i + 0.5)) / n
        if (face < 0 ? Math.abs(z) < 13.6 : Math.abs(z) < 5.5 && f === 0) continue
        box(out, xf, g + 2 + f * 4.9 + 1.5, z, 0.05, 1.7, 1, DARK, glass)
      }
    }
    // the Rue d'Aubervilliers has its frontispiece, below; the Rue Curial, a dark round-headed opening under a balcony, its keystone band
    if (face < 0) continue
    box(out, xf + face * 0.04, g + 3, 0, 0.05, 3.6, 4, DARK, glass)
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI
      const a1 = ((i + 1) / 10) * Math.PI
      const P = (a: number, r: number): V3 => [xf + face * 0.04, g + 6.6 + Math.sin(a) * r, Math.cos(a) * r]
      quadN(out, [P(a0, 0), P(a0, 4), P(a1, 4), P(a1, 4)], [face, 0, 0], DARK, glass)
      strut(out, P(a0, 4.5), P(a1, 4.5), 0.9, 0.9, STONE_DK, stone, false)
    }
    box(out, xf + face * 0.6, g + 11.4, 0, 0.6, 0.2, 5, STONE_DK, stone)
    box(out, xf + face * 0.1, g + 10.2, 0, 0.1, 0.5, 5.2, STONE, stone)
  }
  // the Rue d'Aubervilliers' frontispiece, drawn looking at −z and turned to face −x, and its words on their stone under the balcony
  const front = new MeshBuilder()
  frontispiece(front, g, stone, glass)
  const fx = -111.6 * sx - 0.02
  placed(out, front, Math.PI / 2, fx, 0)
  signText(out, 'SERVICE MUNICIPAL', fx - 0.28, g + 9.02, 0, 0.42, [0.2, 0.17, 0.13], { heading: -Math.PI / 2 })
  signText(out, 'DES POMPES FUNÈBRES DE PARIS', fx - 0.28, g + 8.52, 0, 0.42, [0.2, 0.17, 0.13], { heading: -Math.PI / 2 })

  // ---- the cross ranges between the courts, plain and low
  S(-31, -19, -26, -15, eaves)
  S(-31, -19, 16, 26, eaves)
  S(87, 100, -26, -22, eaves)
  S(87, 100, 24, 26, eaves)

  // ---- the long hall between the courts and the short one toward Aubervilliers, with their gables
  const Z0 = -26 * sz
  const Z1 = 26 * sz
  const rid = g + 29
  glassHall(out, -19 * sx, 87 * sx, Z0, Z1, eaves, rid, 8.8, glass, metal)
  gable(out, 87 * sx, 1, Z0, Z1, g, eaves, rid, stone, brick, glass, metal)
  gable(out, -19 * sx, -1, Z0, Z1, g, eaves, rid, stone, brick, glass, metal)
  const rid2 = g + 24
  glassHall(out, -90 * sx, -33 * sx, Z0, Z1, eaves, rid2, 8, glass, metal)
  gable(out, -33 * sx, 1, Z0, Z1, g, eaves, rid2, stone, brick, glass, metal)
  // the short hall's far end against the range's courts: a plain stone wall and the small courts' floor
  quadN(out, [[-90 * sx, g, Z0], [-90 * sx, g, Z1], [-90 * sx, rid2, 0], [-90 * sx, rid2, 0]], [-1, 0, 0], STONE, stone)
  quadN(out, [[-90 * sx, g, Z0], [-90 * sx, g, Z1], [-90 * sx, eaves, Z1], [-90 * sx, eaves, Z0]], [-1, 0, 0], STONE, stone)
}
