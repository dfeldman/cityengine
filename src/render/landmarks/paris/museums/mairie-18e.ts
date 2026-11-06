import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM way 28882087's box (local −z faces bearing 19.2, the Place Jules-Joffrin and the church) */
const HX = 20.3
const HZ = 34.4

/** OSM's outline in this frame (osmium, 2026-11-05) */
const OUTER = pts([-19.7, 30.4, -18.2, 30.4, -16.8, 31.7, -13.0, 31.7, -13.0, 34.4, 12.9, 34.4, 13.0, 31.9, 16.9, 31.9, 18.1, 30.6, 19.5, 30.4, 19.5, 25.9, 19.3, 25.8, 18.2, 26.2, 17.1, 25.1, 17.1, 23.4, 20.1, 23.2, 20.0, 12.8, 20.3, 12.8, 20.3, 5.7, 20.3, 1.6, 20.3, -5.6, 20.0, -5.6, 20.0, -9.5, 20.0, -16.0, 19.2, -16.0, 19.2, -23.9, 12.7, -23.8, 12.7, -28.2, 12.7, -29.4, 6.5, -29.3, 6.5, -34.3, -6.8, -34.4, -6.9, -29.3, -12.9, -29.4, -12.9, -28.0, -12.9, -23.9, -19.5, -23.9, -19.4, -16.0, -20.3, -16.0, -20.0, -5.6, -20.3, -5.5, -19.9, 12.7, -19.7, 12.7, -19.5, 23.5, -18.6, 23.4, -18.5, 23.2, -17.1, 23.2, -17.0, 24.5, -17.2, 24.5, -18.2, 25.8, -19.7, 25.8])

/** heights: IGN lidar MNS−MNT (front range roof 25–29 m, rear wings 17–21 m, the portico 8 m) and the Commons photograph "Mairie du 18e arrondissement de Paris.jpg" */
const E = 18 // the front range's cornice
const RISE = 8.5 // its mansard to the flat deck
const ER = 15 // the rear wings' cornice
const RR = 5 // their roof
const PF = -29.4 // the pavilion's front
const WF = -23.9 // the wings' front
const PT = -34.3 // the portico's front
const PX = 12.9 // the pavilion's half width
const WX = 19.5 // the wings' half width
const QX = 6.5 // the portico's half width
const BAL = 8.2 // the portico's balcony top
const DEPTH = -14 // where the front range ends

/**
 * La Mairie du 18e (Varcollier, 1888–1905), Place Jules-Joffrin, facing the church Notre-Dame-de-Clignancourt: a stone
 * neo-Renaissance front of three storeys, a rusticated ground floor with a three-arch portico carrying a balcony (Liberté, Égalité,
 * Fraternité, statues at its corners), tall first-floor windows, pedimented second-floor windows, a bracketed cornice,
 * a slate mansard with the clock gable up the centre.
 */
export function mairie18e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'LIBERTÉ  ÉGALITÉ  FRATERNITÉ', h: 0.45, face: 'roman', colour: [0.3, 0.26, 0.2], tracking: 0.1, lit: 'none', w: 9.5 },
    { x: 0, y: BAL - 0.8, z: (PT - 0.45) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const stone = hex('#d8cdb2')
  const p = palette('#d8cdb2', '#4a5058')
  p.trim = shade(stone, 1.04)
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER], p, { eaves: ER, bay: 3.6, win: 1.4, rise: RR, inset: 4, dormers: false,
    storeys: [{ y: 0, h: 3.0, sill: 1.8 }, { y: 5.2, h: 2.6, sill: 1.1 }, { y: 9.2, h: 2.6, sill: 1.0 }] })
  rustic(out, OUTER, 0.4, 6.4, 0.7, stone, 5)
  bands(out, OUTER, [6.5], 0.5, 0.18, stone, 5)

  // ---- the front range: wings and pavilion, a stone skin up to the cornice
  const FS = WF - 0.2
  block(out, -WX, WX, FS, DEPTH, 0, E, stone)
  block(out, -PX, PX, PF, WF + 0.5, 0, E + 0.5, stone)
  const pf = PF - 0.05
  // rusticated base and the string courses
  for (const [a, b, f] of [[-WX, -PX, FS], [PX, WX, FS], [-PX, PX, pf]] as [number, number, number][]) {
    for (let y = 0.9; y < 6.3; y += 0.7) rectOn(out, '-z', f, a, b, y, y + 0.2, shade(stone, 0.8), 0.03)
    slabOn(out, '-z', f, a - 0.1, b + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
    slabOn(out, '-z', f, a - 0.1, b + 0.1, 6.4, 6.9, 0.2, stone)
    slabOn(out, '-z', f, a - 0.1, b + 0.1, 12.0, 12.3, 0.16, stone)
    // the cornice on brackets
    slabOn(out, '-z', f, a, b, E - 1.3, E - 1.1, 0.18, stone)
    for (let x = a + 0.4; x < b; x += 0.9) slabOn(out, '-z', f, x - 0.13, x + 0.13, E - 1.1, E - 0.45, 0.4, shade(stone, 0.93))
    slabOn(out, '-z', f, a - 0.3, b + 0.3, E - 0.45, E + 0.05, 0.75, stone)
  }
  // the wings' windows and doors: one bay each, the arched door on the right
  for (const s of [-1, 1]) {
    const x = s * 16.2
    if (s > 0) {
      archOn(out, '-z', FS, x, 0.6, 3.0, 5.4, hex('#7a4a2c'), 0.08)
      archOn(out, '-z', FS, x, 0.4, 3.6, 5.8, stone, 0.05)
    } else {
      rectOn(out, '-z', FS, x - 1.1, x + 1.1, 1.4, 4.6, stone, 0.05)
      rectOn(out, '-z', FS, x - 0.8, x + 0.8, 1.6, 4.4, p.glass, 0.09)
    }
    rectOn(out, '-z', FS, x - 1.15, x + 1.15, 8.2, 12.3 - 0.4, stone, 0.06)
    rectOn(out, '-z', FS, x - 0.85, x + 0.85, 8.5, 11.4, p.glass, 0.1)
    rectOn(out, '-z', FS, x - 0.06, x + 0.06, 8.5, 11.4, stone, 0.13)
    slabOn(out, '-z', FS, x - 1.35, x + 1.35, 11.7, 11.9, 0.22, stone)
    pedimentOn(out, '-z', FS, x - 1.4, x + 1.4, 11.9, 0.5, 0.22, stone)
    rectOn(out, '-z', FS, x - 0.65, x + 0.65, 13.9, 16.4, stone, 0.05)
    rectOn(out, '-z', FS, x - 0.45, x + 0.45, 14.1, 16.2, p.glass, 0.09)
    pedimentOn(out, '-z', FS, x - 0.85, x + 0.85, 16.4, 0.35, 0.18, stone)
    // quoins at the outer corner
    const qx = s * WX
    for (let y = 0; y < E - 1.4; y += 0.9) slabOn(out, '-z', FS, qx - (s < 0 ? 0 : 1.2) - (y % 1.8 ? 0.35 : 0), qx + (s < 0 ? 1.2 : 0) + (y % 1.8 ? 0.35 : 0), y, y + 0.8, 0.05, stone)
  }
  // the pavilion's first floor: five tall windows between pilasters, second floor pedimented windows
  for (const x of [-10.2, -5.1, 0, 5.1, 10.2]) {
    rectOn(out, '-z', pf, x - 1.0, x + 1.0, 8.9, 12.3 - 0.2, stone, 0.06)
    rectOn(out, '-z', pf, x - 0.78, x + 0.78, 9.2, 11.8, p.glass, 0.1)
    rectOn(out, '-z', pf, x - 0.05, x + 0.05, 9.2, 11.8, stone, 0.13)
    rectOn(out, '-z', pf, x - 0.78, x + 0.78, 10.7, 10.8, stone, 0.12)
    rectOn(out, '-z', pf, x - 0.7, x + 0.7, 13.3, 16.0, stone, 0.05)
    rectOn(out, '-z', pf, x - 0.5, x + 0.5, 13.5, 15.8, p.glass, 0.09)
    pedimentOn(out, '-z', pf, x - 0.95, x + 0.95, 16.0, 0.45, 0.18, stone)
    if (x < 10) for (const dx of [2.55]) slabOn(out, '-z', pf, x + dx - 0.2, x + dx + 0.2, 7.0, E - 1.3, 0.22, stone)
  }
  slabOn(out, '-z', pf, -PX - 0.2, -PX + 0.5, 7.0, E - 1.3, 0.3, stone)
  slabOn(out, '-z', pf, PX - 0.5, PX + 0.2, 7.0, E - 1.3, 0.3, stone)

  // ---- the portico: three arches on piers, the balcony on top with its statues
  block(out, -QX, QX, PT, PF + 0.2, 0, BAL, stone)
  for (let y = 0.9; y < 6.3; y += 0.7) rectOn(out, '-z', PT, -QX, QX, y, y + 0.2, shade(stone, 0.8), 0.03)
  for (const x of [-4.3, 0, 4.3]) {
    archOn(out, '-z', PT, x, 0.5, 3.0, 6.0, hex('#1d1d20'), 0.1)
    archOn(out, '-z', PT, x, 0.5, 3.4, 6.2, shade(stone, 0.85), 0.05)
  }
  slabOn(out, '-z', PT, -QX - 0.2, QX + 0.2, 6.5, 6.9, 0.3, stone)
  slabOn(out, '-z', PT, -QX - 0.4, QX + 0.4, BAL - 0.5, BAL, 0.55, stone)
  rectOn(out, '-z', PT - 0.3, -QX + 0.3, QX - 0.3, 6.9, BAL - 0.5, shade(stone, 1.03), 0.04)
  for (const x of [-QX + 0.3, 0, QX - 0.3]) block(out, x - 0.35, x + 0.35, PT - 0.6, PT, BAL, BAL + 0.9, stone)
  for (const x of [-QX + 0.3, 0, QX - 0.3]) statue(out, x, PT - 0.3, BAL + 0.9, 2.4, shade(stone, 1.05))
  for (const x of [-3.2, 3.2]) block(out, x - 0.3, x + 0.3, PT - 0.5, PT, BAL, BAL + 0.8, stone)
  slabOn(out, '-z', PT, -QX + 0.3, QX - 0.3, BAL + 0.6, BAL + 0.9, 0.2, stone)

  // ---- the slate mansards
  const rz1 = DEPTH
  roof(out, -PX - 0.3, PX + 0.3, PF - 0.2, rz1, E + 0.1, RISE, 3.3, 3.4, p.slate)
  for (const s of [-1, 1]) {
    const a = s < 0 ? -WX - 0.3 : PX + 0.3
    const b = s < 0 ? -PX - 0.3 : WX + 0.3
    roof(out, a, b, WF - 0.5, rz1, E + 0.1, RISE - 1, 2.6, 3.0, p.slate)
  }
  // dormers on the pavilion's front slope
  for (const x of [-10, -7.3, 7.3, 10]) {
    block(out, x - 0.7, x + 0.7, PF + 0.4, PF + 1.4, E + 0.9, E + 3.4, stone)
    rectOn(out, '-z', PF + 0.4, x - 0.45, x + 0.45, E + 1.2, E + 3.1, p.glass, 0.08)
    pedimentOn(out, '-z', PF + 0.4, x - 0.9, x + 0.9, E + 3.4, 0.6, 0.2, stone)
  }
  // the clock gable up the centre
  const cx = 0
  const af = PF + 0.1
  block(out, -3.4, 3.4, af, af + 3.6, E, E + 9.5, stone)
  clockOn(out, '-z', af, cx, E + 5.0, 1.15, p)
  rectOn(out, '-z', af, -1.6, 1.6, E + 1.6, E + 3.6, p.glass, 0.1)
  pedimentOn(out, '-z', af, -3.9, 3.9, E + 9.5, 2.0, 0.25, stone)
  slabOn(out, '-z', af, -3.9, 3.9, E + 9.2, E + 9.6, 0.25, stone)
  for (const s of [-1, 1]) {
    block(out, s * 4.1 - 0.35, s * 4.1 + 0.35, af, af + 1.4, E, E + 3.2, stone)
    prism(out, s * 4.1, af + 0.5, E + 3.2, E + 4.6, 0.3, 8, stone, FIXED, 0.2)
  }
  // chimneys along the ridge, a flag mast
  for (const s of [-1, 1]) {
    stack(out, s * 17, WF + 4, E + 3, E + RISE + 2.2, 0.5, 0.9, shade(stone, 0.9), p.lead)
    stack(out, s * 9, -18, E + 6, E + RISE + 2.4, 0.5, 0.9, shade(stone, 0.9), p.lead)
  }
  // the rear wings: the stone bands and a few chimneys
  for (const s of [-1, 1]) stack(out, s * 14, 6, ER + 2, ER + RR + 1.6, 0.5, 0.9, shade(stone, 0.9), p.lead)
}
