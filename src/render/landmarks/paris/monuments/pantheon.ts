import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { block, classicalColumn, roof, shade } from '../../kit.ts'
import { signText } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pedimentOn, rectOn } from '../palaces/common.ts'
import { archesOn, band, domeOf, figure, FIXED, peristyle, quarter, ring, roundBalustrade, walls } from './common.ts'

/** the design footprint: OSM way 16407465's box turned to the church's axis (local −z faces bearing 288.2, the Rue Soufflot) */
const HX = 42.5
const HZ = 56.1

/**
 * The plan, OSM way 16407465 in this frame (osmium, 2026-10-29), simplified to 30 cm: the portico's platform at −z,
 * the Greek cross — the nave arm, the wide transept with its porches at x ±42.5, the choir arm, the two little towers
 * at the east corners — and the sacristy at +z.
 */
const PLAN = ring([
  20.8, -56.1, 20.8, -40.6, 17.2, -40.6, 17.2, -34.6, 18.9, -34.6, 19.0, -30.9, 18.5, -30.8, 18.5, -28.9, 17.9, -28.9,
  18.0, -15.7, 20.8, -13.0, 33.8, -13.0, 33.8, -13.5, 35.8, -13.5, 35.8, -14.1, 39.4, -14.1, 39.5, -5.2, 42.3, -5.2,
  42.5, 15.0, 39.6, 15.0, 39.6, 23.9, 36.0, 23.9, 36.0, 23.2, 34.1, 23.2, 34.0, 22.8, 20.7, 22.7, 18.0, 25.5, 18.0, 38.7,
  25.8, 38.7, 25.8, 48.5, 16.4, 48.5, 16.2, 56.1, -16.3, 56.0, -16.2, 48.4, -25.6, 48.4, -25.6, 38.6, -18.0, 38.6,
  -18.0, 25.5, -20.9, 22.6, -34.0, 22.7, -34.0, 23.1, -35.9, 23.1, -35.9, 23.7, -39.6, 23.7, -39.7, 14.9, -42.5, 14.8,
  -42.3, -5.4, -39.6, -5.3, -39.6, -14.2, -36.0, -14.2, -36.0, -13.6, -34.1, -13.6, -34.0, -13.0, -20.9, -13.1,
  -18.1, -15.8, -18.2, -29.0, -18.7, -29.0, -18.7, -30.8, -19.3, -30.9, -19.3, -34.6, -17.5, -34.6, -17.5, -40.2,
  -21.2, -40.2, -21.2, -56.1,
])
/** the body without the portico's platform: the plan from the portico's back wall (z −40.6) on */
const BODY = PLAN.filter((p) => p.z > -40.7).map((p) => ({ x: p.x, z: p.z }))

/**
 * The Panthéon (Soufflot, 1757–90; Rondelet after him), Sainte-Geneviève's church become the nation's mausoleum, on the
 * top of the Montagne Sainte-Geneviève at the head of the Rue Soufflot. What a rider sees, from the Luxembourg up the
 * street and from the Place du Panthéon:
 *
 * - the PORTICO: twenty-two Corinthian columns (six across the front, the corners grouped three deep, and the
 *   engaged columns on the wall behind), the entablature with the inscription AUX GRANDS HOMMES LA PATRIE
 *   RECONNAISSANTE, and the PEDIMENT with David d'Angers' relief, on its platform of steps;
 * - the GREEK CROSS behind it: tall blind walls (Quatremère de Quincy walled up the windows in 1791), a frieze of
 *   garlands under a heavy cornice, the low lead roofs over the arms, the transept's porches, the two little towers
 *   at the east end;
 * - the DOME on its square base: the stylobate, the drum ringed by thirty-two Corinthian columns with a balustrade
 *   over them, the windowed attic, the lead dome with its ribs, and the round lantern with its cross at 83 m.
 *
 * Heights are OSM's 3D parts of the church (IGN Lidar HD; 1200917611…1459623260, measured in this frame with osmium,
 * 2026-10-29): the walls 23.8, their parapet to 26.6, the roofs to 32.4, the base under the dome 35, the colonnade
 * 37–48 at r 16.3, the attic to 59.8, the dome r 12.6 to 74.5. The portico's sixteen free columns are OSM's
 * (1458328815…1458328830), 23.8 m on the 1.8 m platform. The lantern stops at 83 m (Wikipedia), not the Lidar's 90.
 */
export function pantheonFull(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  // the inscription on the frieze: a sign, which `fitted` does not carry over, so placed here at the fitted scale
  const sx = fit.hx > 0 ? fit.hx / HX : 1
  const sz = fit.hz > 0 ? fit.hz / HZ : 1
  signText(out, 'AUX GRANDS HOMMES LA PATRIE RECONNAISSANTE', -0.1 * sx, 23.15, (-55.6 + 0.04) * sz, 0.85, [0.3, 0.27, 0.22], { heading: Math.PI })
}

const STONE: Rgb = [0.87, 0.83, 0.74]
const TRIM: Rgb = shade(STONE, 1.05)
const DEEP: Rgb = shade(STONE, 0.84)
const LEAD: Rgb = [0.56, 0.6, 0.61]
const DARK: Rgb = [0.18, 0.17, 0.16]
const GLASS: Rgb = [0.24, 0.25, 0.27]

function draw(out: MeshBuilder): void {
  // ---- the cross: blind walls to 23.8, the frieze of garlands, the cornice, a plain parapet to 26.6
  walls(out, BODY, 0, 23.8, STONE)
  band(out, BODY, 0, 1.6, 0.4, DEEP)                                                   // the plinth
  band(out, BODY, 19.6, 1.9, 0.12, TRIM)                                               // the frieze
  garlands(out)
  band(out, BODY, 21.5, 1.3, 0.75, TRIM)                                               // the cornice
  walls(out, BODY, 23.8, 26.6, TRIM)
  band(out, BODY, 26.2, 0.4, 0.2, TRIM)
  // the blind windows Quatremère walled up: tall panels sunk a shade darker into every long wall
  archesOn(out, BODY, 5.5, 3.2, 10.5, 11, shade(STONE, 0.93), 9)
  // the leads behind the parapet, and the low hipped roofs over the arms (OSM: 23.8 → 32.4)
  block(out, -39, 39, -13, 22.5, 23.6, 24.2, LEAD)
  block(out, -17.5, 17.5, -40.2, 48, 23.6, 24.2, LEAD)
  roof(out, -12.4, 12.4, -40.2, 48.8, 24.2, 8.2, 12.4, 6, LEAD)
  roof(out, -35, 35, -6.8, 17, 24.2, 8.2, 6, 11.9, LEAD)
  // the transept's porches: a pediment on each, a door
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const plane = s * 42.4
    block(out, Math.min(s * 39.5, plane), Math.max(s * 39.5, plane), -5.3, 14.9, 23.8, 25.7, TRIM)
    pedimentOn(out, f, plane, -5.3, 14.9, 25.7, 4.2, 0.4, TRIM)
    rectOn(out, f, plane, 1.5, 8.1, 0, 7.5, DARK, 0.08)
  }
  // the two little towers at the east corners, and the low sacristy behind the choir
  for (const s of [-1, 1]) {
    block(out, s > 0 ? 17.6 : -25.8, s > 0 ? 25.8 : -17.6, 38.6, 48.5, 23.8, 26.3, STONE)
    roof(out, s > 0 ? 17.4 : -26.0, s > 0 ? 26.0 : -17.4, 38.4, 48.7, 26.3, 1.0, 4.3, 5.1, LEAD)
  }
  pedimentOn(out, '+z', 48.5, -9.6, 9.6, 23.8, 4.6, 0.5, TRIM)

  portico(out)
  dome(out, -0.3, 5.2)
}

/** The frieze of garlands under the cornice: a swag every 3.5 m along each long wall. */
function garlands(out: MeshBuilder): void {
  const faces: [number, number, number, number, 'x' | 'z'][] = [
    // [plane, t0, t1, outward sign, axis the plane is perpendicular to]
    [-40.6, -17, 17, -1, 'z'], [56.0, -16, 16, 1, 'z'], [17.6, -40, -16, 1, 'x'], [-18.1, -40, -16, -1, 'x'],
    [39.6, -14, 23.5, 1, 'x'], [-39.6, -14, 23.5, -1, 'x'], [-13.0, 21, 39, -1, 'z'], [-13.0, -39, -21, -1, 'z'],
    [22.7, 21, 39, 1, 'z'], [22.7, -39, -21, 1, 'z'], [18.0, 25.5, 38.6, 1, 'x'], [-18.0, 25.5, 38.6, -1, 'x'],
  ]
  for (const [plane, t0, t1, s, axis] of faces) {
    const n = Math.max(1, Math.round((t1 - t0) / 3.5))
    for (let i = 0; i < n; i++) {
      const t = t0 + ((t1 - t0) * (i + 0.5)) / n
      if (axis === 'z') box(out, t, 20.4, plane + s * 0.2, 1.1, 0.35, 0.12, TRIM, FIXED)
      else box(out, plane + s * 0.2, 20.4, t, 0.12, 0.35, 1.1, TRIM, FIXED)
    }
  }
}

/**
 * The portico: the stepped platform (z −56.1…−40.6, 1.8 m), the columns, the entablature with its inscription,
 * the pediment and its relief, the coffered roof back to the wall.
 */
function portico(out: MeshBuilder): void {
  const zf = -55.6
  // the steps across the whole front and the platform
  for (let k = 0; k < 6; k++) block(out, -21.2, 20.8, -56.1 + k * 0.42, -40.6, 0, 0.3 * (k + 1), k % 2 ? STONE : TRIM)
  // the columns: OSM's sixteen free-standing, symmetric about the axis, and six engaged on the wall behind
  const cols: [number, number][] = []
  for (const x of [3.55, 10.3, 16.65]) cols.push([x, -54.8], [-x, -54.8])
  for (const x of [10.3, 16.65, 19.55]) cols.push([x, -51.7], [-x, -51.7])
  for (const x of [16.85, 19.6]) cols.push([x, -46.0], [-x, -46.0])
  for (const [x, z] of cols) classicalColumn(out, x, z, 1.8, 21.0, 0.95, STONE, { order: 'corinthian', tier: 'near', heading: Math.PI, trim: TRIM })
  for (const x of [3.55, 10.3, 16.65]) for (const s of [-1, 1]) {
    classicalColumn(out, s * x, -41.2, 1.8, 21.0, 0.85, STONE, { order: 'corinthian', tier: 'mid', heading: Math.PI, trim: TRIM })
  }
  // the great tricolore, hung in the portico from the entablature (owner, 2026-10-30: "the pantheon does have a huge french flag on it";
  // "not a lot of french flags, but when they do use them, they mean it"). Where it hangs is a guess: no photograph was checked
  for (const [x0, x1, c] of [[-4.5, -1.5, [0.05, 0.18, 0.5]], [-1.5, 1.5, [0.95, 0.95, 0.93]], [1.5, 4.5, [0.82, 0.12, 0.14]]] as [number, number, Rgb][]) {
    block(out, x0, x1, -47.05, -46.95, 6.5, 20.8, c)
  }
  // the door in the wall behind, bronze
  rectOn(out, '-z', -40.6, -2.6, 2.6, 1.8, 10.5, [0.28, 0.24, 0.18], 0.1)
  // the entablature: architrave, the frieze with the inscription, the cornice
  block(out, -21.0, 20.8, zf, -40.6, 21.0, 22.4, TRIM)
  block(out, -21.0, 20.8, zf + 0.1, -40.6, 22.4, 23.9, STONE)
  block(out, -21.6, 21.4, zf - 0.5, -40.6, 23.9, 25.0, TRIM)
  // the pediment, the relief in its tympanum, the roof behind it back to the body
  pedimentOn(out, '-z', zf - 0.5, -21.6, 21.4, 25.0, 7.4, 1.0, STONE)
  pedimentOn(out, '-z', zf - 0.5, -18.5, 18.3, 25.6, 5.9, 1.15, shade(STONE, 0.82))
  // the relief: La Patrie with her arms spread in the middle, the great men crowding either side, smaller toward the
  // corners as the tympanum closes over them
  figure(out, -0.1, 25.7, zf - 1.8, 4.6, TRIM)
  for (let i = 1; i <= 7; i++) {
    for (const s of [-1, 1]) {
      const h = 3.6 - i * 0.42
      figure(out, -0.1 + s * (1.4 + i * 2.0), 25.7, zf - 1.75 - (i % 2) * 0.15, h, TRIM)
    }
  }
  roof(out, -21.6, 21.4, zf - 0.5, -40.6, 25.0, 7.4, 21.5, 0, LEAD)
}

/**
 * The dome at (cx, cz): the square base from the roofs to 35, the stylobate, the drum within its ring of thirty-two
 * columns, their balustrade, the attic with its windows, the lead dome and ribs, the lantern.
 */
function dome(out: MeshBuilder, cx: number, cz: number): void {
  // the square base, its corners cut, from the roofs to 35
  block(out, cx - 20, cx + 20, cz - 14, cz + 14, 24, 35, STONE)
  block(out, cx - 14, cx + 14, cz - 20, cz + 20, 24, 35, STONE)
  block(out, cx - 20.4, cx + 20.4, cz - 14.4, cz + 14.4, 34.2, 35.0, TRIM)
  block(out, cx - 14.4, cx + 14.4, cz - 20.4, cz + 20.4, 34.2, 35.0, TRIM)
  // the stylobate, the drum and its windows behind the colonnade
  prism(out, cx, cz, 35.0, 37.0, 17.6, 32, TRIM, FIXED)
  prism(out, cx, cz, 37.0, 48.0, 13.8, 32, STONE, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2 + Math.PI / 32
    box(out, cx + Math.sin(a) * 13.85, 42.2, cz + Math.cos(a) * 13.85, Math.abs(Math.cos(a)) * 0.9 + 0.08, 3.1, Math.abs(Math.sin(a)) * 0.9 + 0.08, GLASS, FIXED)
  }
  peristyle(out, cx, cz, 16.3, 37.0, 47.8, 32, 0.6, STONE, 'mid')
  // the entablature over the columns, the balustrade on it
  prism(out, cx, cz, 47.8, 49.4, 17.3, 32, TRIM, FIXED)
  roundBalustrade(out, cx, cz, 16.9, 49.4, TRIM, 1.2, 40)
  // the attic: a plain drum with its windows, a cornice
  prism(out, cx, cz, 49.4, 59.8, 14.3, 32, STONE, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2
    box(out, cx + Math.sin(a) * 14.35, 54.5, cz + Math.cos(a) * 14.35, Math.abs(Math.cos(a)) * 0.8 + 0.08, 1.9, Math.abs(Math.sin(a)) * 0.8 + 0.08, GLASS, FIXED)
  }
  prism(out, cx, cz, 59.0, 60.2, 14.9, 32, TRIM, FIXED)
  // the dome: lead, nearly a half-sphere, its ribs
  domeOf(out, cx, cz, 60.2, 13.2, 14.3, LEAD, quarter, { sides: 32, steps: 10, ribs: 16, rib: shade(LEAD, 1.12) })
  // the lantern: a round temple of columns on a ring, its little dome, the cross
  prism(out, cx, cz, 74.2, 75.0, 3.4, 16, TRIM, FIXED)
  prism(out, cx, cz, 75.0, 79.6, 2.2, 16, STONE, FIXED)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    prism(out, cx + Math.sin(a) * 2.9, cz + Math.cos(a) * 2.9, 75.0, 79.4, 0.2, 6, STONE, FIXED)
  }
  prism(out, cx, cz, 79.4, 80.2, 3.25, 16, TRIM, FIXED)
  domeOf(out, cx, cz, 80.2, 2.6, 1.6, LEAD, quarter, { sides: 16, steps: 5 })
  box(out, cx, 82.3, cz, 0.12, 0.7, 0.12, LEAD, FIXED)
  box(out, cx, 82.5, cz, 0.45, 0.1, 0.1, LEAD, FIXED)
}
