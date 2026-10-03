/**
 * FOUNDRY SQUARE (2003–2008; STUDIOS Architecture, Jim Jennings Architecture, Page & Turnbull): four ten-storey
 * glass office buildings on the four corners of Howard and First, a block south of Salesforce Park — "architecturally
 * linked", one on each corner, round a set of public plazas. The owner, 2026-10-02: *"the howard side has the Foundry
 * buildings, 4 lower glass block buildings in a corner … should be glass and nicely designed."*
 *
 * What makes them read as a set: clear glass curtain walls over a slender aluminium mullion grid, floor-to-ceiling
 * glazing on 14-foot floors (4.3 m), a double-height glazed lobby under a thin steel canopy, and a crisp flat top with
 * the top floor set back. Each is a little different — I and III with deep horizontal sunshade fins, II and IV with
 * vertical fins — so the four corners read as siblings, not copies. About 45 m to the parapet (OSM's 50 and 55 are the
 * rooftop plant). docs/SALESFORCE-PARK.md.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, type TowerSpec } from '../tower.ts'
import type { Rgb } from '../../models.ts'

const CLEAR: Rgb = [0.56, 0.71, 0.77]
const MULLION: Rgb = [0.78, 0.80, 0.82]
const LOBBY_GLASS: Rgb = [0.62, 0.74, 0.78]

function foundry(fins: 'horizontal' | 'vertical'): (out: MeshBuilder, fit: Fit) => void {
  const spec: TowerSpec = {
    height: 45,
    base: { height: 8.6, face: { kind: 'curtain', wall: MULLION, glass: LOBBY_GLASS, pitch: 3, floor: 8.6, material: 'glass' }, canopy: { depth: 2.4, colour: MULLION } },
    tiers: [
      fins === 'horizontal'
        ? { to: 40.5, face: { kind: 'bands', wall: MULLION, glass: CLEAR, floor: 4.3, solid: 0.14, depth: 0.55, material: 'metal' } }
        : { to: 40.5, face: { kind: 'fins', wall: MULLION, glass: CLEAR, floor: 4.3, pitch: 1.5, solid: 0.12, depth: 0.45, material: 'metal' } },
      // the top floor, set back behind a terrace
      { to: 45, inset: 2.2, face: { kind: 'curtain', wall: MULLION, glass: CLEAR, pitch: 1.5, floor: 4.5, material: 'glass' } },
    ],
    cornices: [{ at: 40.5, depth: 0.6, height: 0.35, colour: MULLION }],
    crown: { kind: 'parapet', height: 1.1, colour: MULLION },
    penthouse: 1,
  }
  return (out, fit) => tower(out, { ...fit, height: 45 }, spec)
}

export const FOUNDRY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 400 Howard (NW corner of Howard and First) */
  foundrySquareI: foundry('horizontal'),
  /** 500 Howard */
  foundrySquareII: foundry('vertical'),
  /** 505 Howard */
  foundrySquareIII: foundry('horizontal'),
  /** 405 Howard */
  foundrySquareIV: foundry('vertical'),
}
