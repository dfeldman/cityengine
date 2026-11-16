/**
 * TOUR ORANO (ex-Areva, ex-Fiat; SOM with Saubot & Jullien, 1974; 178 m roof, mast to ~184 m), La Défense.
 * A perfect square prism clad in near-black polished granite (Nero Impala) with dark tinted windows: the one truly
 * dark tower of the old Défense. Punched windows WIDEN toward the top as the stone piers thin (the "2001 monolith").
 * The top floors read as a blank band of plant behind louvres. Sources: ladefense.fr/en/discover/towers/areva,
 * pss-archi.eu FR-92026-16 (windows widen with height, square prism, granite + tinted glass), en.wikipedia Tour_Areva
 * (178 m). IGN MNS (tools/ign-mns.ts 2026-11-16) has no returns over the tower (masked), so the height is cited.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face } from '../../tower.ts'

// ---- tunables ----
const OR_STONE = '#2a2b2e'      // polished black granite, sky sheen lifts it off pure black
const OR_GLASS = '#1d2730'      // tinted glass with a little sky in it
const OR_BASE = '#232427'
const OR_LOBBY_GLASS = '#3a4650'
const OR_ROOF_H = 178
const OR_MAST = 6
const OR_LOBBY = 9
const OR_FLOOR = 3.9
const OR_PITCH = 3.0
const OR_PLANT = 0.955          // share of height where the blank plant band starts
// window share by band, bottom to top: the stone share falls as you go up
const OR_BANDS: [number, number][] = [[0.25, 0.7], [0.5, 0.62], [0.75, 0.54], [OR_PLANT, 0.46]]

const win = (solid: number): Face => ({ kind: 'punched', wall: hex(OR_STONE), glass: hex(OR_GLASS), floor: OR_FLOOR, pitch: OR_PITCH, solid, material: 'granite' })

export function areva(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: OR_ROOF_H,
    roof: hex('#38393b'),
    base: { height: OR_LOBBY, face: { kind: 'fins', wall: hex(OR_BASE), glass: hex(OR_LOBBY_GLASS), pitch: 3, solid: 0.25, depth: 0.4, material: 'granite' } },
    tiers: [
      ...OR_BANDS.map(([to, s]) => ({ to, face: win(s) })),
      { to: 1, face: { kind: 'bands', wall: hex(OR_STONE), glass: hex('#26292c'), floor: 1.2, solid: 0.6, material: 'granite' } },
    ],
    crown: { kind: 'mast', height: OR_MAST, colour: hex('#55585b'), width: 1.2 },
  })
}
