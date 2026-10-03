/**
 * PIER 39 (1978): the shopping pier's buildings — A to Q, Fog Harbor, the kiosks — built of timber salvaged from old
 * piers and left to weather: dark brown boards, a ground floor of shopfronts in heavy frames, an upper storey of small
 * windows and balconies, low hipped roofs of grey shingle. The bake drew them as a jumble of Victorians, brick lofts
 * and stucco flats (waterfront sweep, 2026-10-03). Mapillary 137588811859150.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower } from '../tower.ts'

const WOOD: [number, number, number] = [0.36, 0.28, 0.21]
const WOOD_DARK: [number, number, number] = [0.24, 0.19, 0.15]

export function pier39Shop(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(4, Math.min(fit.height || 9, 12))
  const two = H >= 7
  tower(out, { ...fit, height: H }, {
    height: H,
    base: two ? { height: 4, face: { kind: 'curtain', wall: WOOD_DARK, glass: [0.2, 0.22, 0.22], pitch: 3.2, floor: 4, material: 'clapboard' } } : undefined,
    tiers: [{ to: 1, face: two
      ? { kind: 'punched', wall: WOOD, glass: [0.22, 0.24, 0.25], pitch: 2.6, floor: H - 4, solid: 0.6, material: 'clapboard' }
      : { kind: 'curtain', wall: WOOD_DARK, glass: [0.2, 0.22, 0.22], pitch: 3, floor: H, material: 'clapboard' } }],
    crown: { kind: 'hip', height: Math.min(3, H * 0.3), inset: -0.8, colour: [0.27, 0.27, 0.27], material: 'concrete' },
  })
}

/** FISH ALLEY's working sheds behind Jefferson Street (Pier 45 and the inner lagoon): one-storey corrugated metal,
 *  grey-green or rust, a roller door and a low roof — where the bake drew three-metre Victorians. */
export function fishAlleyShed(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(3.5, Math.min(fit.height || 4, 6))
  const rust = (Math.round(fit.hx * 7 + fit.hz * 13) % 3) === 0
  const wall: [number, number, number] = rust ? [0.5, 0.32, 0.24] : [0.46, 0.5, 0.46]
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'fins', wall, glass: [0.3, 0.32, 0.32], pitch: 4.5, solid: 0.45, depth: 0.08, floor: H, material: 'metal' } }],
    crown: { kind: 'hip', height: 1.0, inset: -0.4, colour: [0.52, 0.52, 0.5], material: 'metal' },
  })
}

export const PIER_39: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pier39Shop, fishAlleyShed }
