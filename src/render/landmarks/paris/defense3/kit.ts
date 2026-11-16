import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { cutDeckWays, cutDomeImax } from './passages.ts'
import { tower, type Crown, type Face, type Tier, type TowerSpec } from '../../tower.ts'

/**
 * DEFENSE3 KIT: the lesser La Défense buildings as short configs over tower(). Every building still gets its own
 * look from its own photo (Panoramax / Commons) — the defaults below are only a structure, not a colour scheme.
 *
 *  face     'curtain' glass grid, 'bands' ribbon windows between solid floor bands, 'punched' windows in a wall,
 *           'fins' vertical piers. wall/glass are hex strings; floor = floor-to-floor m; pitch = mullion/bay m.
 *  lobby    a different ground storey (glazed, recessed look) of `lobby.h` metres.
 *  setbacks [{ at, inset, face? }]: from `at` (metres, or ≤1.5 = share of the height) the outline steps in by
 *           `inset` metres; `face` overrides the main face above it (e.g. a glazed attic).
 *  crown    'parapet' (default, 1 m in the wall colour), 'flat', or a penthouse box count via `plant`.
 */
export interface D3Look {
  face: { kind: Face['kind']; wall: string; glass?: string; floor?: number; pitch?: number; solid?: number; depth?: number }
  lobby?: { h: number; wall: string; glass?: string }
  setbacks?: { at: number; inset: number; face?: D3Look['face'] }[]
  roof?: string
  parapet?: { h: number; colour?: string } | 'none'
  plant?: number
  /** carve the Dôme IMAX's circle out (the mall block it stands in) */
  cutDome?: boolean
  /** cornice ledges at these heights (m or share), in the wall colour unless given */
  bands?: { at: number; depth?: number; colour?: string }[]
}

const face = (f: D3Look['face']): Face => ({
  kind: f.kind, wall: hex(f.wall), glass: f.glass ? hex(f.glass) : undefined,
  floor: f.floor, pitch: f.pitch, solid: f.solid, depth: f.depth,
})

/** One building from its look; height comes from the manifest (BD TOPO) through fit.height. */
export function d3Building(out: MeshBuilder, fit: Fit, look: D3Look, fallbackH = 30): void {
  const H = fit.height > 0 ? fit.height : fallbackH
  const main = face(look.face)
  const tiers: Tier[] = []
  const sb = [...(look.setbacks ?? [])].sort((a, b) => a.at - b.at)
  let cur = main
  for (const s of sb) {
    const at = s.at <= 1.5 ? s.at * H : s.at
    tiers.push({ to: at, face: cur })
    cur = s.face ? face(s.face) : cur
    tiers.push({ to: at, face: cur, inset: s.inset })
  }
  tiers.push({ to: 1, face: cur })
  const p = look.parapet ?? { h: 1 }
  const crown: Crown = p === 'none' ? { kind: 'flat' } : { kind: 'parapet', height: p.h, colour: hex(p.colour ?? look.face.wall) }
  const spec: TowerSpec = {
    height: H,
    roof: hex(look.roof ?? '#8e8d8a'),
    base: look.lobby && H > look.lobby.h * 2.5
      ? { height: look.lobby.h, face: { kind: 'curtain', wall: hex(look.lobby.wall), glass: hex(look.lobby.glass ?? '#4d5a63'), floor: look.lobby.h, pitch: 2.4 } }
      : undefined,
    tiers,
    cornices: look.bands?.map((b) => ({ at: b.at, depth: b.depth ?? 0.4, colour: hex(b.colour ?? look.face.wall) })),
    crown,
    penthouse: look.plant,
  }
  tower(out, fit, spec)
  cutDeckWays(out, fit)
  if (look.cutDome) cutDomeImax(out, fit)
}

/** Shorthand: a builder from a look. */
export const d3 = (look: D3Look) => (out: MeshBuilder, fit: Fit): void => d3Building(out, fit, look)
