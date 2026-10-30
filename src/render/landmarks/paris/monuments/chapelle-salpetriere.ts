import { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, placed, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, fitted, pedimentOn, rectOn, type Pal } from '../palaces/common.ts'
import { pal, roseOn } from './churches.ts'
import { archAlong, archesOn, band, FIXED, ring, UV, type P2, walls } from './common.ts'

/*
 * THE CHAPELLE SAINT-LOUIS DE LA SALPÊTRIÈRE (Libéral Bruant, 1670–77), at the head of the Cour Mazarin in the hospital: a
 * cross of four long, plain naves, a pedimented gable with an oculus at the end of each, meeting round a great OCTAGON with
 * chapels in its angles — the whole rising to one mark, the tall stone drum with its arched windows, one to a face, the
 * broad dome of ribbed black slate on it, and the slate lantern with its clock, its little cap, its ball and its vane.
 * The rest is long low stone walls and acres of slate; what the rider sees from the court is the main arm's porch of three
 * arches under the pediment, and that dome over the hospital's roofs from every side.
 *
 * In the city the outline (way 78535716, height 8) and its parts made a scatter of mansards. The model replaces it and the
 * 13 parts inside it; its walls are the outline's ring, the octagon OSM's part 236576220 (to 32), the lantern part 236576213
 * (to 40). The drum's and dome's split is from the Commons photographs. The porch is from memory, the photographs show
 * only the south arm. Frame: −z the main arm, at bearing 334 (osmium, 2026-10-30): the way's widest arm, toward the Boulevard de l'Hôpital's gate, opposite OSM's
 * `Abside` (way 377136988, bearing 157 from the centre). No photograph of that front was found, so this is an inference, not a sighting. The ring's own annex beside it is left plain.
 */
const HX = 36.7
const HZ = 35.8

const P: Pal = pal('#d7cdb6', '#3f4449')
const LEAD: Rgb = hex('#54595d')
/** The octagon's and the drum's middle, from OSM's part. */
const CX = 0
const CZ = -0.5
/** The apothem of the drum. */
const AP = 10.2
const EAVES = 11.2

/** The way's ring, simplified. */
const PLAN = ring([36.7, 6.2, 24.1, 6.2, 24.2, 16.4, 17.1, 23.3, 7.3, 23.4, 7.3, 35.8, -6.6, 35.8, -6.9, 23.3, -16.8, 23.4, -23.9, 16.4, -24.0, 6.5, -36.5, 6.4,
  -36.4, -7.6, -24.1, -7.6, -24.0, -17.8, -17.0, -24.6, -7.1, -24.6, -7.1, -35.8, 10.4, -35.7, 11.5, -30.8, 16.8, -31.0, 17.0, -24.6, 23.9, -17.8, 24.1, -7.6, 36.6, -7.6])
/** The chapels' roof, between this ring at the eaves and the drum. */
const CHAPELS = ring([24.2, -17.9, 24.4, 16.5, 17.2, 23.6, -17.0, 23.6, -24.2, 16.5, -24.2, -17.9, -17.1, -24.8, 17.1, -24.8])

/** An eight-sided ring with flat faces to the axes, apothem `a`, at (CX, CZ). */
const oct = (a: number): P2[] => {
  const k = a * Math.tan(Math.PI / 8)
  return ring([CX + a, CZ - k, CX + a, CZ + k, CX + k, CZ + a, CX - k, CZ + a, CX - a, CZ + k, CX - a, CZ - k, CX - k, CZ - a, CX + k, CZ - a])
}

/** A slope from ring `a` at y0 to ring `b` at y1, same count, each facing out. */
function between(out: MeshBuilder, a: P2[], b: P2[], y0: number, y1: number, c: Rgb): void {
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    const mx = (a[i].x + a[j].x) / 2 - CX
    const mz = (a[i].z + a[j].z) / 2 - CZ
    const L = Math.hypot(mx, mz) || 1
    out.quad([[a[i].x, y0, a[i].z], [a[j].x, y0, a[j].z], [b[j].x, y1, b[j].z], [b[i].x, y1, b[i].z]], [mx / L, 0.7, mz / L], UV, c, FIXED)
  }
}

export function chapelleSalpetriere(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => chapelle(q))
}

function chapelle(out: MeshBuilder): void {
  // the long walls, the cornice, the windows
  walls(out, PLAN, 0, EAVES, P.stone)
  band(out, PLAN, EAVES - 0.45, 0.45, 0.28, P.trim)
  band(out, PLAN, 0, 0.8, 0.12, P.deep)
  archesOn(out, PLAN, 3.6, 2.0, 4.8, 6.0, P.glass, 5.5)

  // the annex in the ring beside the main arm, under its own low slates
  block(out, 7.0, 16.7, -30.9, -24.0, 0, EAVES - 0.3, P.stone)
  block(out, 7.0, 10.3, -35.6, -30.8, 0, EAVES - 0.3, P.stone)
  roof(out, 6.9, 17.0, -31.2, -23.8, EAVES - 0.3, 1.8, 0.01, 0.01, P.slate)
  roof(out, 6.9, 10.5, -35.8, -30.8, EAVES - 0.3, 1.8, 0.01, 0.01, P.slate)

  // the chapels' slates round the octagon, up to the drum's foot
  between(out, CHAPELS, oct(AP + 0.1), EAVES, 18.0, P.slate)

  // the four arms: a pedimented gable, a slate roof to the octagon; each drawn pointing −z and turned into place
  arm(out, 0, 35.7, 0, true)
  arm(out, Math.PI / 2, 36.4, 0.6, false)
  arm(out, Math.PI, 35.75, -0.35, false)
  arm(out, -Math.PI / 2, 36.6, -0.7, false)

  // THE DRUM: an octagon of stone to 25.6, its cornice, one arched window to a face between pilasters at the angles
  const r = oct(AP)
  walls(out, r, 17.5, 25.5, P.stone)
  band(out, r, 25.3, 0.65, 0.4, P.trim)
  band(out, r, 18.0, 0.35, 0.2, P.trim)
  for (let i = 0; i < 8; i++) {
    const a = r[i]
    const b = r[(i + 1) % 8]
    const mx = (a.x + b.x) / 2
    const mz = (a.z + b.z) / 2
    const dx = b.x - a.x
    const dz = b.z - a.z
    const L = Math.hypot(dx, dz)
    const tx = dx / L
    const tz = dz / L
    const nx = tz
    const nz = -tx
    archAlong(out, mx + nx * 0.05, mz + nz * 0.05, tx, tz, nx, nz, 19.0, 3.1, 5.7, P.deep)
    archAlong(out, mx + nx * 0.09, mz + nz * 0.09, tx, tz, nx, nz, 19.2, 2.5, 5.2, P.glass)
    prism(out, a.x, a.z, 18.2, 25.3, 0.32, 6, P.trim, FIXED, 0.32, false)
  }

  // THE DOME: the eight faces of black slate rounding up from the cornice, ribs of lead at the angles, to its crown at 32
  const y0 = 25.95
  const H = 7.4
  const steps = 8
  const prof = (k: number): [number, number] => {
    const t = (k / steps) * (Math.PI / 2)
    return [AP * 0.97 * Math.cos(t) ** 0.72 + 2.0 * (k / steps) ** 2, y0 + H * Math.sin(t)]
  }
  for (let k = 0; k < steps; k++) {
    const [ra, ya] = prof(k)
    const [rb, yb] = prof(k + 1)
    const ring0 = oct(ra)
    const ring1 = oct(rb)
    between(out, ring0, ring1, ya, yb, k % 2 ? P.slate : shade(P.slate, 0.95))
    for (let i = 0; i < 8; i++) beam(out, [ring0[i].x, ya + 0.03, ring0[i].z], [ring1[i].x, yb + 0.03, ring1[i].z], 0.09, LEAD)
  }
  // THE LANTERN: a lead-capped stage with the clock, its arched lights, a small dome, the ball and the vane
  const lr = oct(2.5)
  walls(out, lr, 33.0, 37.2, shade(P.slate, 1.25))
  band(out, lr, 33.0, 0.4, 0.3, LEAD)
  band(out, lr, 37.1, 0.3, 0.25, LEAD)
  for (let i = 0; i < 8; i++) {
    const a = lr[i]
    const b = lr[(i + 1) % 8]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const L = Math.hypot(dx, dz)
    archAlong(out, (a.x + b.x) / 2 + (dz / L) * 0.03, (a.z + b.z) / 2 - (dx / L) * 0.03, dx / L, dz / L, dz / L, -dx / L, 34.0, 1.0, 2.5, P.dark)
  }
  clockOn(out, '-z', CZ - 2.5, CX, 35.6, 0.62, P)
  between(out, oct(2.65), oct(0.7), 37.4, 39.0, P.slate)
  prism(out, CX, CZ, 39.0, 39.8, 0.55, 8, LEAD, FIXED, 0.28, false)
  prism(out, CX, CZ, 39.8, 40.3, 0.3, 8, P.gold, FIXED, 0.24, false)
  beam(out, [CX, 40.3, CZ], [CX, 42.4, CZ], 0.035, P.dark)
  beam(out, [CX - 0.5, 41.8, CZ], [CX + 0.5, 41.8, CZ], 0.03, P.dark)
}

/**
 * One arm, its gable at `len` from the middle on the −z side: the wall's face with pilasters at the corners, its oculus, the pediment,
 * the slate roof back into the chapels' roof. `off` moves it sideways, the ring's arms not being quite on the axes.
 */
function arm(out: MeshBuilder, angle: number, len: number, off: number, main: boolean): void {
  const q = new MeshBuilder()
  const w = 7.05
  const z = -len
  // the roof from the gable in, ridge along the arm
  roof(q, -w - 0.2, w + 0.2, z - 0.1, -10, EAVES, 3.3, w + 0.2, 0.01, P.slate)
  // the gable's cornice and pediment
  pedimentOn(q, '-z', z, -w - 0.28, w + 0.28, EAVES, 3.3, 0.5, P.trim)
  for (const s of [-1, 1]) block(q, s * (w - 0.5) - 0.5, s * (w - 0.5) + 0.5, z - 0.12, z + 0.2, 0.8, EAVES - 0.4, shade(P.stone, 1.03))
  roseOn(q, '-z', z, 0, EAVES - 3.0, 1.15, P.glass, P.trim)
  if (main) {
    // the main arm's porch: three round arches on a stepped plinth, a band over them
    block(q, -5.5, 5.5, z - 1.15, z, 0, 5.6, P.stone)
    block(q, -5.65, 5.65, z - 1.3, z, 5.6, 6.05, P.trim)
    for (const t of [-3.4, 0, 3.4]) {
      archOn(q, '-z', z - 1.15, t, 0, 2.6, 4.6, P.deep, 0.04)
      archOn(q, '-z', z - 1.15, t, 0, 2.1, 4.2, P.dark, 0.08)
    }
    rectOn(q, '-z', z, -1.6, 1.6, 6.2, 7.0, P.deep, 0.03)
  } else {
    archOn(q, '-z', z, 0, 0, 2.2, 3.8, P.dark, 0.06)
    rectOn(q, '-z', z, -1.5, 1.5, 3.9, 4.25, P.trim, 0.1)
  }
  placed(out, q, angle, Math.cos(angle) * off, -Math.sin(angle) * off)
}
