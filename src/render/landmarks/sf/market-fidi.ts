/**
 * MARKET STREET AND THE FIDI CORE — the generic buildings left there, modelled one at a time in priority order
 * (docs/GENERIC-MARKET-FIDI.md; owner, 2026-10-07: "start working on them … NOT batching"). Each builder here replaces
 * a `restyle` (reface) or nothing; its manifest entry is in public/landmarks/san-francisco/market-fidi.json, and its
 * notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, type Face } from '../tower.ts'
import type { Rgb } from '../../models.ts'

// ---------------------------------------------------------------- Stevenson Place, 71 Stevenson (1980s; way/149840694)
/**
 * Commons "Stevenson Place.jpg" and Mapillary on Stevenson/Jessie: a dark red-brown granite base of five storeys
 * ruled by cream stone bands, then a shaft of cream vertical piers with dark window columns between them and
 * red-brown spandrels, three setbacks stepping in near the top, and a little pitched cream gable block with a
 * louvre on the roof.
 */
function stevensonPlace(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.85, 0.8, 0.7]
  const BROWN: Rgb = [0.4, 0.27, 0.25]
  const GLASS: Rgb = [0.3, 0.27, 0.28]
  const baseFace: Face = { kind: 'punched', wall: BROWN, glass: GLASS, floor: 3.9, pitch: 3.4, solid: 0.55, material: 'granite' }
  const shaft: Face = { kind: 'fins', wall: CREAM, glass: [0.34, 0.26, 0.26], floor: 3.6, pitch: 3.3, solid: 0.62, depth: 0.55, material: 'ashlar' }
  const upper: Face = { ...shaft }
  const bands = [3.9, 7.8, 11.7, 15.6].map((at) => ({ at, depth: 0.25, height: 0.7, colour: CREAM }))
  tower(out, fit, {
    height: 103,
    base: { height: 19.5, face: baseFace },
    cornices: bands,
    tiers: [
      { to: 0.8, face: shaft, cornice: { depth: 0.5, height: 0.8, colour: CREAM } },
      { to: 0.88, face: upper, inset: 2.4, cornice: { depth: 0.4, height: 0.7, colour: CREAM } },
      { to: 0.95, face: upper, inset: 2.4, cornice: { depth: 0.4, height: 0.7, colour: CREAM } },
      { to: 1.0, face: { kind: 'punched', wall: CREAM, glass: GLASS, floor: 3.6, pitch: 3.3, solid: 0.7, material: 'ashlar' }, inset: 4 },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: { kind: 'hip', height: 6, inset: 3, colour: CREAM, material: 'ashlar' },
  })
}

export const MARKET_FIDI: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  stevensonPlace,
}
