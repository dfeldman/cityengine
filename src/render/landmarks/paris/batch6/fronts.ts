/**
 * Batch 6's fronts (2026-10-31): the Quai d'Orsay's palace, and the theatres and halls the candidates' list had still as the civic kit's boxes. Owner, 2026-10-31: the 1st, 2nd, 6th, 7th, 8th and 9th are cream "with no exceptions", so all of these are stone. Each is a front on OSM's outline, its body plain behind it, and says what it was read from; none could be checked against a street photograph from here (docs/landmarks/PARIS-BATCH-BRIEF.md: Commons and Wikipedia only), so they are from memory of the elevation and marked so. List for street view in the batch's report.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { block, dome, hex, placed, shade, type Rgb } from '../../kit.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { archOn, balustrade, fitted, hipRoof, mansard, pairOn, palette, pavilionRoof, pedimentOn, range, rectOn, slabOn, statue, type Pal } from '../palaces/common.ts'
import { EMIT, lettersOn, litOn } from '../palaces/showfront.ts'

const GOLD_LETTER: Rgb = [0.62, 0.48, 0.2], RED_NEON = hex('#d83a2b'), WARM = hex('#c98f4e')

/** the Republic's flag on its staff, `h` up from y */
function tricolore(out: MeshBuilder, x: number, z: number, y: number, h: number, w = 1.5): void {
  prism(out, x, z, y, y + h, 0.04, 5, hex('#2a2a2a'))
  const t = y + h - 0.1, H = w * 0.66
  for (const [a, c] of [[0, hex('#1a3a78')], [1, hex('#d8d8d2')], [2, hex('#a82a2a')]] as const) {
    const x0 = x + 0.04 + (a * w) / 3, x1 = x0 + w / 3
    block(out, x0, x1, z - 0.012, z + 0.012, t - H, t, c)
  }
}

/* --------------------------------------------------------------------------------------------------- Quai d'Orsay */

/**
 * THE HÔTEL DU MINISTRE DES AFFAIRES ÉTRANGÈRES, "le Quai d'Orsay" (Jacques Lacornée, 1845–55; OSM way/448794899, 78 × 39 m; aerial 48.8618 2.3145; the palaces' restyle had it as three storeys under a mansard and a rider took it for an apartment block). Rebuilt 2026-11-16 off a Commons photograph from the quay (the audit's "short hip-roofed block" was the centre-pavilion-and-mansard invention): NOT symmetric. A run of eleven bays with free columns between the tall first-floor windows, the frieze of round windows over them and a balustraded roof line; the tall west pavilion (+x, the photograph's right) with its columned balcony and great arched window; a lower return beyond it; the small east pavilion; the garden front's bow (the salon de l'Horloge's rotunda) on the south. −z to the Seine.
 */
export function quaiOrsay(out: MeshBuilder, fit: Fit): void {
  const HX = 38.8, HZ = 19.4
  fitted(out, fit, HX, HZ, (q) => {
    const p = palette('#d9cdb4', '#4b5257')
    // ---- tunable (Commons: "Ministère français des Affaires Etrangères … Quai d'Orsay Paris", from the quay; x runs west, so the tall pavilion is on the right of the photograph)
    const E = 17.6, EP = 20.6, EE = 18.8          // eaves of the run, of the west pavilion, of the east pavilion
    const XE = -27, XW = 14, XP = 30.5            // the run's limits; the west pavilion's body ends at XP and a lower return follows to HX
    const PROUD = 1.0, OCULUS = 0.78, RUN_PITCH = 1.8, RUN_ZINC: Rgb = [0.5, 0.53, 0.55]   // the run's roof is a low zinc one, paler than the pavilions' slate (IGN ortho)
    const st = [{ y: 0.5, h: 3.7, arched: true, sill: 0.6 }, { y: 6.6, h: 5.2, sill: 0.5 }]
    // the run: a rusticated ground floor, the tall first-floor windows between free columns, the frieze of round windows, the balustraded roof line
    range(q, XE, XW, -HZ, HZ, p, { eaves: E, storeys: st, bay: 3.6, win: 1.6, rustic: 0.62, rusticTo: 5.9, cornice: 0.5, frames: true, faces: ['-z', '+z'] })
    const n = 11, step = (XW - XE - 1.2) / n, z = -HZ - 0.45
    for (let i = 0; i <= n; i++) {
      const t = XE + 0.6 + step * i
      prism(q, t, z, 6.3, 13.4, 0.3, 8, p.trim)
      box(q, t, 6.1, z, 0.42, 0.2, 0.42, p.trim, 0)
      box(q, t, 13.5, z, 0.44, 0.2, 0.44, p.trim, 0)
    }
    slabOn(q, '-z', -HZ, XE, XW, 13.7, 14.4, 0.85, p.trim)
    for (let i = 0; i < n; i++) {
      const t = XE + 0.6 + step * (i + 0.5)
      const zz = -HZ - 0.06
      for (let k = 0; k < 10; k++) {
        const a0 = (k / 10) * Math.PI * 2, a1 = ((k + 1) / 10) * Math.PI * 2
        q.quad([[t, 15.5, zz], [t + Math.cos(a0) * OCULUS, 15.5 + Math.sin(a0) * OCULUS, zz], [t + Math.cos(a1) * OCULUS, 15.5 + Math.sin(a1) * OCULUS, zz], [t, 15.5, zz]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.glass, 0)
        q.quad([[t + Math.cos(a0) * OCULUS, 15.5 + Math.sin(a0) * OCULUS, zz - 0.02], [t + Math.cos(a0) * (OCULUS + 0.22), 15.5 + Math.sin(a0) * (OCULUS + 0.22), zz - 0.02], [t + Math.cos(a1) * (OCULUS + 0.22), 15.5 + Math.sin(a1) * (OCULUS + 0.22), zz - 0.02], [t + Math.cos(a1) * OCULUS, 15.5 + Math.sin(a1) * OCULUS, zz - 0.02]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, 0)
      }
    }
    // the first-floor balcony rail along the run
    slabOn(q, '-z', -HZ, XE, XW, 5.9, 6.2, 0.55, p.trim)
    rectOn(q, '-z', -HZ - 0.5, XE, XW, 6.2, 7.0, p.deep, 0.02)
    balustrade(q, XE, XW, -HZ, HZ, E, p, { sides: ['-z', '+z'], h: 0.95 })
    hipRoof(q, XE + 0.4, XW - 0.4, -HZ + 1.2, HZ - 1.2, E, RUN_PITCH, RUN_ZINC, 0)
    for (const x of [-20, -9, 3]) for (const zc of [-4, 5]) block(q, x - 0.7, x + 0.7, zc - 0.5, zc + 0.5, E + 1, E + 4.6, p.deep)
    // the west pavilion: proud of the run, the columned balcony, the great arched window, statues in their niches, a roof of its own
    range(q, XW, XP, -HZ - PROUD, HZ, p, { eaves: EP, storeys: [{ y: 0.5, h: 3.7, arched: true, sill: 0.6 }, { y: 6.6, h: 4.4, sill: 0.5 }, { y: 13.4, h: 4.2, sill: 0.5 }], bay: 3.4, win: 1.5, rustic: 0.62, rusticTo: 5.9, cornice: 0.7, quoins: true, frames: true, faces: ['-z', '+z', '+x'] })
    const zp = -HZ - PROUD
    const cw = (XW + XP) / 2
    archOn(q, '-z', zp, cw, 7.4, 3.0, 7.6, p.glass, 0.1)
    archOn(q, '-z', zp, cw, 7.1, 3.8, 8.6, p.deep, 0.07)
    for (const s of [-1, 1]) { archOn(q, '-z', zp, cw + s * 4.4, 8.2, 1.1, 2.9, p.deep, 0.1); statue(q, cw + s * 4.4, zp - 0.25, 8.0, 2.0, p.trim) }
    pairOn(q, '-z', zp, XW + 1.3, 6.3, 17.2, 0.3, p.trim, 0.9)
    pairOn(q, '-z', zp, XP - 1.3, 6.3, 17.2, 0.3, p.trim, 0.9)
    block(q, XW - 0.4, XP + 0.4, zp - 1.1, zp, 5.9, 6.2, p.trim)
    for (let t = XW; t <= XP + 0.01; t += 0.55) block(q, t - 0.05, t + 0.05, zp - 1.05, zp - 0.95, 6.2, 7, p.deep)
    block(q, XW - 0.4, XP + 0.4, zp - 1.1, zp - 0.9, 7, 7.15, p.trim)
    balustrade(q, XW, XP, zp, HZ, EP, p, { sides: ['-z', '+x'], h: 0.95 })
    pavilionRoof(q, XW + 0.8, XP - 0.8, zp + 0.6, HZ - 3, EP, 5.2, p, { top: 4 })
    // the lower return beyond it
    range(q, XP, HX, -HZ, HZ, p, { eaves: E + 0.4, storeys: st, bay: 3.4, win: 1.5, rustic: 0.62, rusticTo: 5.9, cornice: 0.6, frames: true })
    balustrade(q, XP, HX, -HZ, HZ, E + 0.4, p, { sides: ['-z', '+x'], h: 0.95 })
    hipRoof(q, XP + 0.4, HX - 0.4, -HZ + 1.2, HZ - 1.2, E + 0.4, 3.0, p.slate, 0)
    // the east pavilion: smaller, a little proud, its own steep roof
    range(q, -HX, XE, -HZ - 0.6, HZ, p, { eaves: EE, storeys: [{ y: 0.5, h: 3.7, arched: true, sill: 0.6 }, { y: 6.6, h: 5.2, sill: 0.5 }], bay: 3.3, win: 1.5, rustic: 0.62, rusticTo: 5.9, cornice: 0.7, quoins: true, frames: true, faces: ['-z', '+z', '-x'] })
    archOn(q, '-z', -HZ - 0.6, -HX + 4.3, 12.2, 1.2, 3.4, p.deep, 0.09)
    balustrade(q, -HX, XE, -HZ - 0.6, HZ, EE, p, { sides: ['-z', '-x'], h: 0.95 })
    pavilionRoof(q, -HX + 0.8, XE - 0.8, -HZ - 0.2, HZ - 3, EE, 4.6, p, { top: 3 })
    tricolore(q, 6, -HZ + 8, E + 3.2, 5, 1.9)
    // the garden's bow, three storeys of it, on the south
    const R = 8.5, Z = HZ + 0.5
    prism(q, 0, Z, 0, E, R, 18, p.stone)
    prism(q, 0, Z, E - 0.7, E, R + 0.55, 18, p.trim)
    prism(q, 0, Z, E, E + 3.2, R, 18, p.slate, 0, 2.5)
    for (let k = 1; k < 9; k++) {
      const a = (k / 9) * Math.PI, x = -Math.cos(a) * R, zz = Z + Math.sin(a) * R, cx = -Math.cos(a), cz = Math.sin(a)
      for (const [y0, y1, w] of [[1, 5, 1.5], [6.8, 12.3, 1.6], [14, 16.5, 1.2]] as const) {
        const ex = cz * w / 2, ez = -(-cx) * w / 2
        q.quad([[x - ex + cx * 0.08, y0, zz + ez * -1 + cz * 0.08], [x + ex + cx * 0.08, y0, zz + ez + cz * 0.08], [x + ex + cx * 0.08, y1, zz + ez + cz * 0.08], [x - ex + cx * 0.08, y1, zz + ez * -1 + cz * 0.08]], [cx, 0, cz], [[0, 0], [1, 0], [1, 1], [0, 1]], p.glass, 0)
      }
    }
  })
}

/* ------------------------------------------------------------------------------------------------- Conseil constitutionnel */

/** LE CONSEIL CONSTITUTIONNEL, 2 rue de Montpensier (OSM's amenity outline, way/239444173; the Palais-Royal's model is the wing): the palace's plain flank, so this is the door on the Rue de Montpensier, its stone frame, its plaque, and the flag over it. −z to the street. */
export function conseilDoor(out: MeshBuilder, fit: Fit): void {
  const p = palette('#dcd1b9', '#4b5257'), y = fit.grade ?? 0, z = -fit.hz
  block(out, -3.4, 3.4, z, fit.hz, y, y + 6.4, p.stone)
  slabOn(out, '-z', z, -2.5, 2.5, y, y + 5.4, 0.25, p.trim)
  const zz = z - 0.25
  archOn(out, '-z', zz, 0, y, 3.1, 4.5, hex('#2f3b36'), 0.09)
  rectOn(out, '-z', zz, -0.04, 0.04, y, y + 3, hex('#222'), 0.12)
  block(out, -2.9, 2.9, zz - 0.25, zz + 0.2, y + 5.3, y + 5.75, p.trim)
  rectOn(out, '-z', zz, 1.72, 2.36, y + 1.9, y + 2.6, hex('#b9a874'), 0.08)
  tricolore(out, -0.9, zz - 0.5, y + 5.75, 2.8, 1.7)
}

/* ------------------------------------------------------------------------------------------------------- Salle Pleyel */

/**
 * LA SALLE PLEYEL (Gustave Lyon, Jean-Marcel Auburtin and André Granet, 1927; 252 rue du Faubourg-Saint-Honoré; OSM has a node, in the block way/70287879, 83 × 38 m, nine storeys): Paris's great concert hall of the Twenties, its stone front flat and tall on the street: a dark marble ground floor and a long glass and bronze marquee with the name lit under it, then eight storeys of tight stone piers between the tall window strips, an attic setback at the top. Art Deco, cream. −z to the Faubourg.
 */
// OSM's block (27 corners, 2 600 m²) is far from its 83 × 38 m box, and the hall filled the box into the street (owner, 2026-11-05)
const PLEYEL_ACROSS = 0.8, PLEYEL_ALONG = 1
// the box's front corner stood 4-8 m into the Faubourg (owner #231, 2026-11-16): the front is set back from the box, the marquee kept short and its name on its face
const PLEYEL_SETBACK = 4.5, PLEYEL_MARQUEE = 1.4
export function sallePleyel(out: MeshBuilder, fit: Fit): void {
  const HX = 19, HZ = 41.4
  fitted(out, { ...fit, hx: fit.hx * PLEYEL_ACROSS, hz: fit.hz * PLEYEL_ALONG }, HX, HZ, (q) => {
    const p = palette('#d9cfb8', '#50565a'), z = -HZ + PLEYEL_SETBACK, E = 30
    block(q, -HX, HX, z, HZ, 0, E, p.stone)
    // the dark base, the doors with their warm light, the marquee
    rectOn(q, '-z', z, -HX, HX, 0, 5.4, hex('#1e1f20'), 0.08)
    for (let i = 0; i < 7; i++) {
      const t = -10.5 + i * 3.5
      litOn(q, '-z', z, t - 1.4, t + 1.4, 0.2, 3.5, WARM, 0.12)
      rectOn(q, '-z', z, t - 0.05, t + 0.05, 0.2, 3.5, hex('#2b2118'), 0.15)
    }
    block(q, -13.5, 13.5, z - PLEYEL_MARQUEE + 0.2, z, 3.8, 4.25, hex('#38332b'))
    block(q, -13.7, 13.7, z - PLEYEL_MARQUEE, z - PLEYEL_MARQUEE + 0.4, 3.75, 4.95, hex('#1b1b1c'))
    lettersOn(q, '-z', z - PLEYEL_MARQUEE, 0, 3.95, 'SALLE PLEYEL', { h: 0.8, c: hex('#e9d6a8'), wide: 0.6, th: 0.12, gap: 0.16, tag: EMIT, d: 0.03 })
    // the piers and the strips, each three bays a group, the name of the house cut in the frieze
    const bays = 11, step = (2 * HX) / bays
    for (let i = 0; i < bays; i++) {
      const t = -HX + step * (i + 0.5), w = step - 1.05
      rectOn(q, '-z', z, t - w / 2, t + w / 2, 6.1, 25.2, hex('#2a2e30'), 0.07)
      for (let y = 8.65; y < 25; y += 2.65) rectOn(q, '-z', z, t - w / 2, t + w / 2, y - 0.18, y + 0.18, shade(p.stone, 0.92), 0.1)
      slabOn(q, '-z', z, t + step / 2 - 0.3, t + step / 2 + 0.3, 5.4, 26, 0.4, p.trim)
    }
    block(q, -HX, HX, z - 0.5, z + 0.5, 5.2, 6.1, p.trim)
    block(q, -HX - 0.1, HX + 0.1, z - 0.55, z + 0.5, 25.2, 26.8, p.trim)
    block(q, -HX - 0.3, HX + 0.3, z - 0.7, z + 0.5, 29.5, 30, p.trim)
    for (const s of [-1, 1]) block(q, s * HX - 0.7, s * HX + 0.7, z - 0.5, z + 0.5, 5.4, 30, p.trim)
    lettersOn(q, '-z', z - 0.55, 0, 27.3, 'PLEYEL', { h: 1.6, c: shade(p.stone, 0.55), wide: 0.62, th: 0.24, gap: 0.5, d: 0.05 })
    // the flanks' plain windows, set back floors and roof
    for (const f of ['-x', '+x'] as const) {
      const plane = f === '-x' ? -HX : HX
      for (let t = z + 5; t < HZ - 4; t += 4) for (let y = 6.5; y < 28; y += 3.2) rectOn(q, f, plane, t - 0.8, t + 0.8, y, y + 1.9, p.glass, 0.07)
    }
    block(q, -HX + 2.6, HX - 2.6, z + 2.6, HZ - 1, 30, 33, shade(p.stone, 0.92))
    for (let t = -HX + 4; t < HX - 3; t += 3.2) rectOn(q, '-z', z + 2.6, t - 0.8, t + 0.8, 30.7, 32.5, p.glass, 0.06)
    block(q, -HX + 2.3, HX - 2.3, z + 2.3, HZ - 0.7, 33, 33.35, p.trim)
    hipRoof(q, -HX + 3.5, HX - 3.5, z + 3.5, HZ - 2, 33.35, 2.2, p.slate, 0)
  })
}

/* ----------------------------------------------------------------------------------------------- the boulevard theatres */

interface Bill {
  /** half-width of the front itself, the outline's face or less */
  W: number
  /** the front's top: over it a plain body follows the outline */
  E: number
  stone?: string
  arches: number
  archFrom: number
  archH: number
  /** a name on the frieze, or null */
  name: string | null
  /** a neon sign above the marquee */
  neon?: string
  /** a marquee and lit doors */
  doors: number
  pediment?: boolean
  mansard?: number
  body?: number
  columns?: boolean
  statues?: boolean
}

/** A theatre's front on −z and a plain stone body back along its outline: the base with lit doors under a marquee, the great windows of the foyer, a frieze with the house's name, the pediment or the mansard. */
function bill(out: MeshBuilder, fit: Fit, b: Bill): void {
  const p: Pal = palette(b.stone ?? '#dcd1b9', '#4d5458'), y = fit.grade ?? 0, HX = fit.hx, HZ = fit.hz, z = -HZ, W = Math.min(b.W, HX)
  const q = new MB()
  // the body, to its height, set behind the front
  const body = b.body ?? b.E
  block(q, -HX, HX, z + 1.2, HZ, 0, body, shade(p.stone, 0.92))
  block(q, -HX - 0.1, HX + 0.1, z + 1.1, HZ + 0.1, body - 0.4, body, p.trim)
  block(q, -W, W, z, z + 1.3, 0, b.E, p.stone)
  // the base, rusticated, its doors
  for (let t = 0.6; t < b.archFrom - 0.6; t += 0.6) rectOn(q, '-z', z, -W, W, t - 0.05, t + 0.05, p.deep, 0.03)
  const n = b.doors, step = (2 * W) / n
  for (let i = 0; i < n; i++) {
    const t = -W + step * (i + 0.5)
    archOn(q, '-z', z, t, 0, Math.min(step - 0.9, 3), 3.6, hex('#201a14'), 0.08)
    litOn(q, '-z', z, t - Math.min(step - 1.1, 2.8) / 2, t + Math.min(step - 1.1, 2.8) / 2, 2.1, 2.9, WARM, 0.1)
  }
  // the marquee
  block(q, -W * 0.92, W * 0.92, z - 2.4, z, 3.9, 4.25, hex('#2d2c2a'))
  rectOn(q, '-z', z - 2.4, -W * 0.92, W * 0.92, 3.9, 4.25, shade(WARM, 1.1), 0.02)
  if (b.neon) lettersOn(q, '-z', z - 2.4, 0, 4.3, b.neon, { h: Math.min(1.3, (W * 1.5) / b.neon.length), c: RED_NEON, wide: 0.6, th: 0.14, gap: 0.14, tag: EMIT, d: 0.02 })
  // the foyer's great windows, columns between them if it has any
  const ast = (2 * W) / b.arches
  for (let i = 0; i < b.arches; i++) {
    const t = -W + ast * (i + 0.5), w = Math.min(ast - 1.3, 4.2)
    archOn(q, '-z', z, t, b.archFrom - 0.25, w + 0.5, b.archH + 0.5, p.trim, 0.05)
    archOn(q, '-z', z, t, b.archFrom, w, b.archH, p.glass, 0.09)
    rectOn(q, '-z', z, t - 0.05, t + 0.05, b.archFrom, b.archFrom + b.archH - 0.2, p.trim, 0.11)
    rectOn(q, '-z', z, t - w / 2, t + w / 2, b.archFrom + b.archH * 0.55, b.archFrom + b.archH * 0.55 + 0.1, p.trim, 0.11)
  }
  if (b.columns) {
    for (let i = 0; i <= b.arches; i++) pairOn(q, '-z', z, -W + ast * i, b.archFrom - 0.3, b.archFrom + b.archH + 0.4, 0.26, p.trim, 0.7)
  }
  // the string course over the base and the frieze
  block(q, -W - 0.15, W + 0.15, z - 0.28, z + 0.2, b.archFrom - 0.75, b.archFrom - 0.35, p.trim)
  const fr = b.archFrom + b.archH + 0.55
  block(q, -W - 0.2, W + 0.2, z - 0.28, z + 0.2, fr, b.E, p.trim)
  block(q, -W - 0.4, W + 0.4, z - 0.5, z + 0.2, b.E - 0.3, b.E, shade(p.trim, 1.03))
  if (b.name) lettersOn(q, '-z', z - 0.28, 0, fr + 0.28, b.name, { h: Math.min(1.1, b.E - fr - 0.7), c: GOLD_LETTER, wide: 0.6, th: 0.13, gap: 0.14, d: 0.04 })
  if (b.pediment) {
    pedimentOn(q, '-z', z, -W, W, b.E, Math.min(3.5, W * 0.35), 0.5, p.trim)
    block(q, -W + 0.4, W - 0.4, z + 0.1, z + 1.4, b.E, b.E + Math.min(3.1, W * 0.3), p.stone)
  }
  if (b.mansard) mansard(q, -W, W, z + 0.1, z + 8, b.E, b.mansard, 0.7, p.slate, 1.3)
  if (b.statues) for (const s of [-1, 1]) { prism(q, s * (W - 0.7), z + 0.5, b.E, b.E + 0.5, 0.42, 8, shade(p.stone, 0.82)); prism(q, s * (W - 0.7), z + 0.5, b.E + 0.5, b.E + 1.5, 0.5, 8, shade(p.stone, 0.82), 0, 0.2); box(q, s * (W - 0.7), b.E + 1.6, z + 0.5, 0.14, 0.14, 0.14, shade(p.stone, 0.82)) }
  // the body's roof
  hipRoof(q, -HX + 0.6, HX - 0.6, z + 2, HZ - 0.6, body, 2.2, p.slate, 0)
  placed(out, q, 0, 0, 0)
  // (the whole drawn from y = 0: lifted to the street's grade)
  if (y !== 0) {
    const n0 = out.positions.length - q.positions.length
    for (let i = n0 + 1; i < out.positions.length; i += 3) out.positions[i] += y
  }
}

/** LE CASINO DE PARIS, 16 rue de Clichy (the music hall of Mistinguett and Joséphine Baker; OSM way/69257631, civic's front −112): the arch of its foyer over the marquee and the name in the red neon. A front 16 m wide in the row. */
export function casinoParis(out: MeshBuilder, fit: Fit): void {
  bill(out, fit, { W: 8.2, E: 15.5, arches: 3, archFrom: 5.6, archH: 6.4, name: 'CASINO DE PARIS', neon: 'CASINO', doors: 4, body: 18, statues: true })
}
/** LE THÉÂTRE MOGADOR, 25 rue de Mogador (Bertie Crewe for Sir Alfred Butt, 1919, on London's music halls; OSM way/69226516, front 80): the three tall round-headed windows between columns, and the frieze. */
export function mogador(out: MeshBuilder, fit: Fit): void {
  bill(out, fit, { W: 12, E: 20, arches: 3, archFrom: 6, archH: 9.5, name: 'THEATRE MOGADOR', neon: 'MOGADOR', doors: 5, columns: true, mansard: 3.2, body: 24 })
}
/** LE TRIANON, 80 boulevard de Rochechouart (Joseph Cassien-Bernard, 1902, for the Élysée-Montmartre's neighbour; OSM way/77807488, front 164): the Belle Époque front of swags and tall windows over its long glass marquee. */
export function trianonRochechouart(out: MeshBuilder, fit: Fit): void {
  bill(out, fit, { W: 12.6, E: 18, stone: '#d8caac', arches: 5, archFrom: 6, archH: 7, name: 'LE TRIANON', doors: 5, statues: true, body: 20 })
}
/** LE GYMNASE MARIE-BELL, 38 boulevard de Bonne-Nouvelle (Louis Regnier de Guerchy, 1820; OSM way/63195400, front 186): a sober Restoration front of a theatre, columns over the arcade. */
export function gymnase(out: MeshBuilder, fit: Fit): void {
  bill(out, fit, { W: Math.min(fit.hx, 11), E: 17, arches: 5, archFrom: 5.8, archH: 7, name: 'GYMNASE', doors: 5, columns: true, pediment: false, mansard: 2.8, body: 19 })
}
/** LE THÉÂTRE DES VARIÉTÉS, 7 boulevard Montmartre (Cellerier, 1807; OSM has a node, against the Passage des Panoramas): the two orders of columns and the pediment that Offenbach's public went under. A front only: the block behind is the city's. */
export function varietes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, p = palette('#dcd1b9', '#4d5458'), W = fit.hx, z = -fit.hz, E = 15.4
  block(out, -W, W, z, fit.hz, y, y + E, p.stone)
  for (let t = 0.6; t < 5; t += 0.6) rectOn(out, '-z', z, -W, W, y + t - 0.05, y + t + 0.05, p.deep, 0.03)
  const n = 5, step = (2 * W) / n
  for (let i = 0; i < n; i++) {
    const t = -W + step * (i + 0.5)
    archOn(out, '-z', z, t, y, 2.2, 3.8, hex('#201a14'), 0.08)
    litOn(out, '-z', z, t - 0.95, t + 0.95, y + 2.2, y + 3, WARM, 0.1)
    rectOn(out, '-z', z, t - 1.05, t + 1.05, y + 6, y + 10, p.glass, 0.08)
    rectOn(out, '-z', z, t - 0.9, t + 0.9, y + 11, y + 13.4, p.glass, 0.08)
  }
  block(out, -W - 0.15, W + 0.15, z - 0.4, z, y + 4.9, y + 5.5, p.trim)
  block(out, -W - 0.15, W + 0.15, z - 0.4, z, y + 10.3, y + 10.8, p.trim)
  for (let i = 0; i <= n; i++) {
    pairOn(out, '-z', z, -W + step * i + (i === 0 ? 0.4 : i === n ? -0.4 : 0), y + 5.5, y + 10.3, 0.3, p.trim, 0.72)
    pairOn(out, '-z', z, -W + step * i + (i === 0 ? 0.4 : i === n ? -0.4 : 0), y + 10.8, y + 14.5, 0.25, p.trim, 0.66)
  }
  block(out, -W - 0.25, W + 0.25, z - 0.5, z, y + 14.5, y + E, p.trim)
  pedimentOn(out, '-z', z, -W, W, y + E, 2.8, 0.45, p.trim)
  block(out, -W + 0.4, W - 0.4, z + 0.2, fit.hz, y + E, y + E + 2.5, p.stone)
  lettersOn(out, '-z', z - 0.4, 0, y + 5.0, 'THEATRE DES VARIETES', { h: 0.4, c: GOLD_LETTER, wide: 0.6, th: 0.07, gap: 0.07, d: 0.03 })
}

/**
 * LE THÉÂTRE MARIGNY (Charles Garnier, 1883, for the panorama of Marigny, in the gardens of the Champs-Élysées; OSM way/67028573, height 15, free-standing): Garnier's round building, an octagon of stone with tall windows, a colonnaded porch to the avenue's garden, the low drum and shallow zinc dome. −z to the Avenue de Marigny's garden.
 */
export function marigny(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, p = palette('#dcd1b9', '#4b5257'), R = Math.min(fit.hx, fit.hz), E = 12.5
  prism(out, 0, 0, y, y + E, R, 8, p.stone)
  prism(out, 0, 0, y + E - 0.5, y + E, R + 0.5, 8, p.trim)
  const a = R * Math.cos(Math.PI / 8), side = 2 * R * Math.sin(Math.PI / 8)
  for (let k = 0; k < 8; k++) {
    const q = new MB()
    for (const t of [-side * 0.28, 0, side * 0.28]) {
      archOn(q, '-z', -a - 0.02, t, y + 6, 1.9, 5, p.glass, 0.08)
      rectOn(q, '-z', -a - 0.02, t - 0.9, t + 0.9, y + 1.1, y + 4.4, k === 0 ? hex('#1f1a15') : p.glass, 0.08)
    }
    slabOn(q, '-z', -a - 0.02, -side / 2, side / 2, y + 4.8, y + 5.2, 0.15, p.trim)
    placed(out, q, (k * Math.PI) / 4, 0, 0)
  }
  // the drum and its dome
  prism(out, 0, 0, y + E, y + E + 3.4, R * 0.62, 16, shade(p.stone, 0.95))
  prism(out, 0, 0, y + E + 3.4, y + E + 3.8, R * 0.65, 16, p.trim)
  dome(out, 0, 0, y + E + 3.8, R * 0.62, R * 0.28, hex('#57615f'), 16)
  prism(out, 0, 0, y + E + 3.8 + R * 0.28 - 0.1, y + E + 3.8 + R * 0.28 + 1.6, 0.9, 8, hex('#57615f'), 0, 0.25)
  // the porch to the garden, four columns under an entablature
  const z = -a
  block(out, -6.6, 6.6, z - 4.4, z, y, y + 0.5, shade(p.stone, 0.88))
  for (const t of [-5.5, -1.85, 1.85, 5.5]) prism(out, t, z - 3.6, y + 0.5, y + 7.2, 0.46, 10, p.trim)
  block(out, -6.4, 6.4, z - 4.3, z, y + 7.2, y + 8.4, p.trim)
  block(out, -6.6, 6.6, z - 4.5, z, y + 8.4, y + 8.75, shade(p.trim, 1.03))
  lettersOn(out, '-z', z - 4.3, 0, y + 7.48, 'THEATRE MARIGNY', { h: 0.6, c: GOLD_LETTER, wide: 0.6, th: 0.09, gap: 0.1, d: 0.03 })
}
