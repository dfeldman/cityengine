/**
 * MUNI METRO TUNNEL PORTALS (owner, 2026-10-06: "At the east portal site we draw a bunch of trains just appearing and
 * disappearing. we should add a tunnel entrance"). The bake drops track in a tunnel (a train on it would drive through
 * the buildings above), so the surface track simply ENDS where the line goes under, and the trains shuttling to its
 * end popped in and out of nothing. Each portal is placed at that end, its mouth over the last metres of the track:
 * a train runs into the dark and is gone.
 *
 * A board-formed concrete headwall with a deep lintel over a dark rectangular mouth wide enough for two tracks, wing
 * walls stepping down either side, the dark tunnel running back into the ground behind it, and a slim coping. Local
 * frame: the mouth faces +z (the surface track), the tunnel runs to −z. Placed by numeric `front` (the bearing out of
 * the tunnel).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.66, 0.65, 0.62]
const COPING: Rgb = [0.72, 0.71, 0.68]
const DARK: Rgb = [0.03, 0.03, 0.035]

export function tunnelPortal(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const W = Math.max(5.2, fit.hx * 0.65)        // half the mouth's width (two tracks)
  const H = 5.6                                  // the mouth's height
  const T = 1.2                                  // the headwall's thickness
  const D = 30                                   // how far the dark runs back
  // the headwall: piers either side of the mouth, the lintel over it
  for (const s of [-1, 1]) box(out, s * (W + 1.0), (H + 2.2) / 2, 0, 1.0, (H + 2.2) / 2, T / 2, CONCRETE, conc)
  box(out, 0, H + 1.1, 0, W + 2.0, 1.1, T / 2, CONCRETE, conc)
  box(out, 0, H + 2.3, 0.05, W + 2.2, 0.1, T / 2 + 0.15, COPING, conc)
  // the wing walls, stepping down away from the mouth
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const h = H + 2.2 - k * 1.8
      box(out, s * (W + 2.0 + 0.3), h / 2, T / 2 + 1.5 + k * 3, 0.3, h / 2, 1.5, CONCRETE, conc)
    }
  }
  // the dark inside: walls, roof and floor of the tunnel running back, lit by nothing
  box(out, 0, H + 0.1, -D / 2, W, 0.1, D / 2, DARK, 0)
  for (const s of [-1, 1]) box(out, s * (W + 0.1), H / 2, -D / 2, 0.1, H / 2, D / 2, DARK, 0)
  box(out, 0, H / 2, -D + 0.1, W, H / 2, 0.1, DARK, 0)
  box(out, 0, 0.02, -D / 2, W, 0.02, D / 2, DARK, 0)
  // the hill over the tunnel's first metres, so the headwall is not a free-standing screen
  box(out, 0, H + 1.7, -D / 2 - T / 2, W + 2.0, 1.7, D / 2, [0.33, 0.4, 0.26], 0)
}

/**
 * A portal in a street's MEDIAN (the Embarcadero's, the Central Subway's on 4th Street): no hill to bore into, so the
 * track goes down a ramp between two low concrete parapets and under a low headwall. The free-standing hill portal
 * stood there as a 30 m black box with a lawn on top, along the middle of the Embarcadero (owner, 2026-10-06: "keep
 * working on embarcadero"). The ground cannot be cut, so the ramp is drawn as its dark floor stepping down between
 * the walls, and the mouth as a dark opening under a headwall a metre high. Local frame as `tunnelPortal`'s: the
 * surface track comes in from +z, the tunnel runs to −z.
 */
export function rampPortal(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const W = Math.max(4.6, fit.hx * 0.6)   // half the trench's width
  const L = 34                            // the ramp's length, from the mouth (z = 0) back up to grade (z = L)
  // the parapets either side, full length, and their coping
  for (const s of [-1, 1]) {
    box(out, s * (W + 0.2), 0.55, L / 2, 0.2, 0.55, L / 2, CONCRETE, conc)
    box(out, s * (W + 0.2), 1.13, L / 2, 0.26, 0.03, L / 2, COPING, conc)
  }
  // the ramp's floor: dark bands stepping down toward the mouth (the trench's depth, read as shade)
  for (let k = 0; k < 8; k++) {
    const t = k / 8, z0 = L * t, z1 = L * (t + 1 / 8)
    const shade = 0.06 + 0.3 * t
    box(out, 0, 0.03, (z0 + z1) / 2, W, 0.03, (z1 - z0) / 2, [shade * 0.9, shade * 0.9, shade * 0.85], 0)
  }
  // the headwall over the mouth: a low concrete beam with the dark opening under it, and the end walls
  box(out, 0, 0.75, -0.6, W + 0.4, 0.75, 0.6, CONCRETE, conc)
  box(out, 0, 1.53, -0.6, W + 0.5, 0.03, 0.7, COPING, conc)
  box(out, 0, 0.6, 0.02, W - 0.2, 0.6, 0.02, DARK, 0)
}
