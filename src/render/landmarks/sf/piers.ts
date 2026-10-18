/**
 * The Embarcadero's piers (SF_PLAN.md §10; user, 2026-09-22: "the piers. some are copies of each other"). From
 * Pier 45 round to Pier 40 they are the same building repeated with variations, which is exactly what a generator
 * is for: a BULKHEAD building along the Embarcadero — two storeys of stucco over a concrete frame, pilasters, a
 * central portal, sea-green sash and doors, a parapet cornice, and the pier's number over the portal — and behind
 * it the long SHED out over the water, a clerestoried barrel or gable roof on a deck standing on piles.
 *
 * `pier({ number: 33, style: 'beaux' })` is one pier. The styles:
 * - `beaux`   the Embarcadero Historic District front (Piers 1–45, 1912–1930s): pilasters, arched windows, a
 *             cartouche with the number, a moulded cornice;
 * - `mission` the same with a tiled pent roof over the parapet and round-headed openings (Piers 15–23);
 * - `plain`   a later utility shed: a flat concrete front, steel roller doors, the number stencilled on.
 *
 * Local frame: the fit's — the bulkhead across the front (local ±x), the shed running out to −z (away from the
 * street, over the water). The manifest gives `front: "street"`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { signText } from '../parts.ts'
import { sign } from '../signage.ts'

export interface PierSpec {
  /** the number over the portal, as it is painted (33, 39, "1½") */
  number: string
  style: 'beaux' | 'mission' | 'plain'
  /** the bulkhead's height, metres (default 11) */
  height?: number
  wall?: Rgb
  /** doors, sash and ironwork: the Port's sea green */
  trim?: Rgb
}

const STUCCO: Rgb = [0.9, 0.85, 0.72]
const SEA_GREEN: Rgb = [0.13, 0.36, 0.33]
const ROOF: Rgb = [0.42, 0.44, 0.45]
const TILE: Rgb = [0.55, 0.28, 0.2]
const DARK: Rgb = [0.12, 0.13, 0.14]

export function pier(out: MeshBuilder, fit: Fit, spec: PierSpec): void {
  const stucco = surfaceTag('stucco')
  const metal = surfaceTag('metal')
  const concrete = surfaceTag('concrete')
  const wall = spec.wall ?? STUCCO
  const trim = spec.trim ?? SEA_GREEN
  const H = spec.height ?? 11
  const hx = Math.max(8, fit.hx)
  const hz = Math.max(12, fit.hz)
  const front = hz            // the bulkhead's face, toward the street
  const bulk = Math.min(14, hz * 0.3)        // how deep the bulkhead building is

  // ---- the bulkhead: a box with its front dressed
  box(out, 0, H / 2, front - bulk / 2, hx, H / 2, bulk / 2, wall, stucco)
  // the pilasters: a bay every 6 m across the front, standing a little proud
  const bays = Math.max(3, Math.round((hx * 2) / 6))
  const bw = (hx * 2) / bays
  for (let i = 0; i <= bays; i++) {
    const x = -hx + i * bw
    box(out, x, H / 2, front + 0.12, 0.5, H / 2 - 0.4, 0.25, wall, stucco)
  }
  // the openings: a tall arched window in each bay, the middle bays the portal
  // (2026-10-06, the Embarcadero survey: the windows were black holes and the portal a box — now glazing with the
  //  Port's sea-green sash across it, and a portal under a solid round head)
  const GLAZE: Rgb = [0.2, 0.25, 0.28]
  const sash = (x: number, y: number, hw: number, hh: number, arched: boolean): void => {
    box(out, x, y, front + 0.04, hw + 0.15, hh + 0.15, 0.06, trim, metal)
    box(out, x, y, front + 0.09, hw, hh, 0.04, GLAZE, surfaceTag('glass'))
    for (const f of [-0.5, 0, 0.5]) box(out, x + f * hw, y, front + 0.15, 0.05, hh, 0.03, trim, metal)
    for (const f of [-0.34, 0.34]) box(out, x, y + f * hh, front + 0.15, hw, 0.05, 0.03, trim, metal)
    if (arched) {
      // the round head over the sash: glazing in four steps, and its sash ring
      for (let k = 0; k < 4; k++) {
        const t = (k + 0.5) / 4, w = hw * Math.sqrt(1 - t * t)
        box(out, x, y + hh + hw * 0.6 * (k + 0.5) / 4, front + 0.09, w, (hw * 0.6) / 8, 0.04, GLAZE, surfaceTag('glass'))
      }
      for (let k = 0; k <= 8; k++) {
        const a = (Math.PI * k) / 8
        box(out, x + Math.cos(a) * hw, y + hh + Math.sin(a) * hw * 0.6, front + 0.14, 0.09, 0.09, 0.04, trim, metal)
      }
    }
  }
  const mid = Math.floor(bays / 2)
  const historic = spec.style !== 'plain'
  for (let i = 0; i < bays; i++) {
    const x = -hx + (i + 0.5) * bw
    const portal = i === mid || (bays > 5 && (i === mid - 1 || i === mid + 1))
    if (portal) {
      const r = bw / 2 - 0.7, spring = 5.6
      // the doorway: a dark recess with the sea-green roller door, under a round head filled in dark
      box(out, x, spring / 2, front + 0.06, r, spring / 2, 0.1, DARK, concrete)
      box(out, x, 2.6, front + 0.13, r - 0.2, 2.6, 0.06, trim, metal)
      if (historic) {
        for (let k = 0; k < 6; k++) {
          const t = (k + 0.5) / 6, w = r * Math.sqrt(1 - t * t)
          box(out, x, spring + r * (k + 0.5) / 6, front + 0.06, w, r / 12, 0.1, DARK, concrete)
        }
        // the voussoirs round it, and a keystone
        for (let k = 0; k <= 10; k++) {
          const a = (Math.PI * k) / 10
          box(out, x + Math.cos(a) * (r + 0.3), spring + Math.sin(a) * (r + 0.3), front + 0.16, 0.32, 0.32, 0.1, wall, stucco)
        }
        box(out, x, spring + r + 0.45, front + 0.22, 0.4, 0.55, 0.12, wall, stucco)
      }
    } else {
      // two storeys of windows: the upper ones round-headed on the historic fronts
      sash(x, 3.0, bw / 2 - 1.2, 1.4, false)
      sash(x, 7.0, bw / 2 - 1.3, 1.1, historic)
    }
  }
  // the cornice: a moulded band across the front, and the parapet standing on the building behind it
  box(out, 0, H - 0.5, front + 0.25, hx + 0.3, 0.4, 0.35, wall, stucco)
  box(out, 0, H - 0.05, front + 0.45, hx + 0.45, 0.12, 0.5, [0.95, 0.92, 0.82], stucco)
  box(out, 0, H - 1.05, front + 0.18, hx + 0.2, 0.1, 0.25, [0.8, 0.75, 0.62], stucco)
  box(out, 0, H + 0.6, front - bulk / 2, hx, 0.7, bulk / 2 - 0.15, wall, stucco)
  // and the panel the number is painted on, standing proud of the parapet's face
  box(out, 0, H + 0.6, front + 0.02, hx * 0.22, 0.75, 0.06, wall, stucco)
  if (spec.style === 'mission') {
    // a pent of red tile over the parapet
    for (let i = 0; i < Math.round(hx); i++) {
      const x = -hx + (i + 0.5) * ((hx * 2) / Math.round(hx))
      box(out, x, H + 1.5, front + 0.15, (hx * 2) / Math.round(hx) / 2, 0.12, 0.7, TILE, surfaceTag('tile'))
    }
  }
  // PIER and its number over the portal, in the frieze: classical capitals, read from far down the Embarcadero
  sign(out, { type: 'flat', text: `PIER ${spec.number}`, h: spec.style === 'mission' ? 0.85 : 1.2, face: 'roman', weight: 'bold', colour: spec.style === 'plain' ? DARK : trim, tracking: 0.12, lit: 'none', w: spec.style === 'mission' ? Math.min(hx * 0.3, 5 + spec.number.length * 0.8) : Math.min(hx * 0.42, 6 + spec.number.length * 0.9) },
    { x: 0, y: spec.style === 'mission' ? H + 0.45 : H + 0.6, z: front + 0.08, heading: 0 })

  // ---- the shed behind: a long hall with a clerestory, on the deck
  const shedH = Math.min(7.5, H - 3)
  const back = -hz
  box(out, 0, (shedH + 0.8) / 2, (front - bulk + back) / 2, hx - 1.5, (shedH - 0.8) / 2, (front - bulk - back) / 2 - 0.05, wall, stucco)
  // the roof: a shallow barrel of a few facets, or a gable for the plain ones
  const rz0 = back
  const rz1 = front - bulk
  const facets = spec.style === 'plain' ? 2 : 6
  for (let i = 0; i < facets; i++) {
    const a0 = (i / facets) * Math.PI
    const a1 = ((i + 1) / facets) * Math.PI
    const P = (a: number): [number, number] => [Math.cos(a) * (hx - 1.5), shedH + Math.sin(a) * (spec.style === 'plain' ? 2.2 : 3.4)]
    const [x0, y0] = P(a0)
    const [x1, y1] = P(a1)
    out.quad([[x0, y0, rz0], [x1, y1, rz0], [x1, y1, rz1], [x0, y0, rz1]], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0],
      [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, metal)
  }
  // the clerestory windows down both flanks of the shed
  for (const s of [-1, 1]) {
    for (let z = rz0 + 6; z < rz1 - 4; z += 6) {
      box(out, s * (hx - 1.45), shedH - 1.2, z, 0.05, 0.7, 2, trim, metal)
    }
  }
  // the substructure: dark timber and concrete from the deck down past the waterline, under the whole pier. Placed on
  // the sea's level since 2026-10-02 (BUGS.md #258), the open underside showed the bank of ground the pier stands on as
  // a green strip at the waterline (owner's screenshot)
  // (stopping 10 cm under the deck, and 5 cm in: up to 0.4 m and flush with its sides, the two z-fought along every
  // pier's waterline — the largest surfaces the coplanar scan found in the city, 2026-10-03)
  box(out, 0, -2.85, 0, hx - 0.05, 2.75, hz - 0.05, [0.24, 0.22, 0.2], concrete)
  // the deck's edge and its piles, out over the water
  box(out, 0, 0.4, (rz0 + rz1) / 2, hx, 0.4, (rz1 - rz0) / 2, [0.5, 0.49, 0.47], concrete)
  for (const s of [-1, 1]) {
    for (let z = rz0 + 3; z < rz1; z += 9) strut(out, [s * (hx - 0.3), 0, z], [s * (hx - 0.3), -4, z], 0.35, 0.35, [0.36, 0.34, 0.3], concrete)
  }
}

/** One preset per pier: the manifest names it. */
const preset = (s: PierSpec) => (out: MeshBuilder, fit: Fit): void => pier(out, fit, s)

export const PIERS = {
  pier1: preset({ number: '1', style: 'beaux' }),
  pier3: preset({ number: '3', style: 'beaux' }),
  pier5: preset({ number: '5', style: 'beaux' }),
  pier9: preset({ number: '9', style: 'beaux' }),
  /*
   * PIER 15 is the EXPLORATORIUM (since 2013): the Port's bulkhead with the museum's name across it, and at the bay end the
   * glass BAY OBSERVATORY standing over the pier's deck (museums audit, 2026-10-04; exploratorium.edu).
   */
  pier15: (out: MeshBuilder, fit: Fit): void => {
    pier(out, fit, { number: '15', style: 'mission' })
    // the name on its own dark band across the bulkhead, standing clear of the pilasters and the arch heads' stepped
    // ornament, which half hid it when the letters were set in the wall (owner, 2026-10-17: "exploratorium sign is
    // mostly obscured")
    box(out, 0, 8.55, fit.hz + 0.75, Math.min(fit.hx * 0.75, 11), 0.85, 0.08, [0.12, 0.13, 0.14], surfaceTag('metal'))
    signText(out, 'EXPLORATORIUM', 0, 8.55, fit.hz + 0.86, 1.1, [0.95, 0.95, 0.93])
    // at the bay end, from the deck up past the crown of the shed's roof, a little wider than the shed: its glass
    // block (shed 7.5 m to the eaves, the arched roof to ~11 m — piers.ts `pier`)
    const L = Math.min(22, fit.hz * 0.3), W = fit.hx - 1.5 + 0.35
    box(out, 0, 6.1, -fit.hz + L / 2 + 1, W, 5.3, L / 2, [0.34, 0.45, 0.5], surfaceTag('glass'))
    box(out, 0, 11.55, -fit.hz + L / 2 + 1, W + 0.3, 0.15, L / 2 + 0.3, [0.85, 0.85, 0.83], surfaceTag('metal'))
  },
  pier17: preset({ number: '17', style: 'mission' }),
  pier19: preset({ number: '19', style: 'mission' }),
  pier23: preset({ number: '23', style: 'mission' }),
  pier29: preset({ number: '29', style: 'beaux' }),
  pier31: preset({ number: '31', style: 'beaux' }),
  pier33: preset({ number: '33', style: 'beaux' }),
  pier35: preset({ number: '35', style: 'plain' }),
  pier45: preset({ number: '45', style: 'plain' }),
  // south of the Bay Bridge: the 1910s bulkheads of Piers 26 and 28 under the viaduct, and the later sheds
  pier24: preset({ number: '24', style: 'beaux', height: 10 }),
  pier26: preset({ number: '26', style: 'beaux', height: 10 }),
  pier28: preset({ number: '28', style: 'beaux', height: 10 }),
  pier38: preset({ number: '38', style: 'plain', height: 9 }),
  pier40: preset({ number: '40', style: 'plain', height: 9 }),
  pier48: preset({ number: '48', style: 'plain', height: 13 }),
  // Fort Mason's piers: long plain sheds on the water, the Herbst and Festival pavilions
  fortMasonPier1: preset({ number: '1', style: 'plain', height: 10, wall: [0.8, 0.79, 0.75] }),
  fortMasonPier2: preset({ number: '2', style: 'plain', height: 10, wall: [0.8, 0.79, 0.75] }),
  fortMasonPier3: preset({ number: '3', style: 'plain', height: 10, wall: [0.8, 0.79, 0.75] }),
  // Pier 39: no `building=yes` tag in OSM (BUGS.md #181), so it is placed by lat/lon + size rather than
  // claimed by way id, same as the three standalone piers in s1.json. A big double-deck shopping pier with
  // a marina either side, of which a rider sees only the bulkhead and the deck's edge from the Embarcadero
  // -- the same shed this kit already draws, wider than the plain Piers 33/35 sheds either side of it.
  // (no pier39: Pier 39 has no shed — its shops are sf/pier39.ts, and the preset drew a stucco bulkhead over them)
}
