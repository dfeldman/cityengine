/**
 * THE BUILDING AT SUTRO TOWER'S FOOT (owner, 2026-10-03, with a photograph: "the base of sutro tower renders as an
 * apartment building. there is a huge concrete structure there … guessing it's an equipment bunker and maybe broadcast
 * offices. only want this to be a good model because i want to add a fictional 'ride to the top' later!").
 *
 * From the photograph: raw board-marked concrete in big plain blocks, stepping in height, each with a dark horizontal
 * slot of windows; on top of the blocks a band of WHITE translucent panels (corrugated fibreglass) behind a thin frame.
 * OSM maps it well as ~16 concrete `building:part`s (7–18 m, some starting at 7 m on the lower blocks) and the white
 * band as the parts from 13 to 15 m (one tagged `building:colour=#ffffff`), so each part gets one of two builders:
 *
 * - `sutroBunker`: a concrete block, a dark window slot a third of the way down each face, a plain coping;
 * - `sutroBunkerPanels`: the band of white ribbed panels, framed top and bottom.
 *
 * The building was a Victorian-styled cluster before (the classifier had nothing better), with a 12 m "apartment
 * block" round the tower's foot that was really OSM's `building:part=no` outline (#236).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { tower } from '../tower.ts'

const CONCRETE: Rgb = [0.4, 0.4, 0.39]
const SLOT: Rgb = [0.12, 0.13, 0.14]
const PANEL: Rgb = [0.9, 0.92, 0.92]
const FRAME: Rgb = [0.62, 0.63, 0.64]

export function sutroBunker(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 2 ? fit.height : 12
  const slotAt = H * 0.62
  tower(out, fit, {
    height: H,
    tiers: [
      { to: Math.max(0.5, slotAt - 0.8), face: { kind: 'blank', material: 'concrete', wall: CONCRETE } },
      { to: Math.min(H - 0.6, slotAt + 0.7), face: { kind: 'bands', material: 'concrete', wall: CONCRETE, glass: SLOT, solid: 0.15, floor: 1.5 } },
      { to: H, face: { kind: 'blank', material: 'concrete', wall: CONCRETE }, cornice: { depth: 0.15, height: 0.3, colour: CONCRETE } },
    ],
    roof: [0.42, 0.41, 0.39],
  })
}

export function sutroBunkerPanels(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 1 ? fit.height : 2
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'fins', material: 'metal', wall: PANEL, glass: [0.84, 0.86, 0.87], pitch: 0.9, solid: 0.6, depth: 0.06, floor: H }, cornice: { depth: 0.12, height: 0.18, colour: FRAME } }],
    roof: [0.45, 0.45, 0.44],
  })
}

export const SUTRO_BASE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { sutroBunker, sutroBunkerPanels }
