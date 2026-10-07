/**
 * THE EMBARCADERO SOUTH OF MARKET, from Mapillary (owner, 2026-10-06: "really we should do the same thing along
 * embarcadero that we did on market — look at EVERY building on mapillary and do a custom build"; "the two tall curved
 * buildings are identical i believe"). Raised from their own fitted footprints with the tower grammar.
 *
 * - infinityTower: THE INFINITY I and II (301 Main, 338 Spear; 2008), one design twice — green glass ellipses, the
 *   floors drawn as thin pale slab edges across the glass, two setbacks near the top, a parapet. They were two
 *   different generic glass boxes.
 * - twoFolsom: 2 FOLSOM STREET, a deep grid of dark red-brown granite with recessed windows (it was a plain blue glass
 *   box: its old note said no photograph was found; Mapillary on Folsom and Steuart has several).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, type Face } from '../tower.ts'

const INFINITY: Face = { kind: 'bands', wall: [0.78, 0.8, 0.78], glass: [0.16, 0.4, 0.37], floor: 3.05, solid: 0.14, material: 'concrete' }

export function infinityTower(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 120,
    base: { height: 6, face: { kind: 'curtain', wall: [0.7, 0.72, 0.7], glass: [0.2, 0.28, 0.3], pitch: 2 } },
    tiers: [{ to: 0.86, face: INFINITY }, { to: 0.94, inset: 2.2, face: INFINITY }, { to: 1, inset: 2.2, face: INFINITY }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.74, 0.76, 0.74] },
  })
}

export function twoFolsom(out: MeshBuilder, fit: Fit): void {
  const GRANITE: Face = { kind: 'punched', wall: [0.38, 0.22, 0.17], glass: [0.12, 0.13, 0.15], floor: 4, pitch: 3, solid: 0.42, material: 'granite' }
  tower(out, fit, {
    height: 91,
    base: { height: 8, face: { kind: 'fins', wall: [0.34, 0.2, 0.16], glass: [0.14, 0.16, 0.18], pitch: 3, solid: 0.35, material: 'granite' } },
    tiers: [{ to: 1, face: GRANITE }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.34, 0.2, 0.16], material: 'granite' },
    penthouse: 1,
  })
}

export const EMBARCADERO_SOUTH: Record<string, (out: MeshBuilder, fit: Fit) => void> = { infinityTower, twoFolsom }
